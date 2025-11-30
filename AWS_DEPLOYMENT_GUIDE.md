# BootCampMusic AWS 배포 완전 가이드

## 목차
1. [개요](#개요)
2. [사전 준비](#사전-준비)
3. [AWS S3 설정](#aws-s3-설정)
4. [Docker 컨테이너 준비](#docker-컨테이너-준비)
5. [EC2 인스턴스 설정](#ec2-인스턴스-설정)
6. [애플리케이션 배포](#애플리케이션-배포)
7. [도메인 연결](#도메인-연결)
8. [SSL 인증서 설정](#ssl-인증서-설정)
9. [모니터링 및 유지보수](#모니터링-및-유지보수)
10. [문제 해결](#문제-해결)

---

## 개요

이 가이드는 BootCampMusic 애플리케이션을 AWS에 배포하는 전체 과정을 다룹니다.

### 아키텍처 구성
```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 브라우저                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    도메인 (Route 53)                          │
│                  yourdomain.com (선택사항)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EC2 인스턴스 (Ubuntu)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Docker Compose 환경                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │   Frontend   │  │   Backend    │  │PostgreSQL│  │   │
│  │  │   (Nginx)    │  │   (Django)   │  │   (DB)   │  │   │
│  │  │   Port 80    │  │  Port 8000   │  │Port 5432 │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS S3 버킷                               │
│              (음악 파일 및 미디어 저장)                        │
└─────────────────────────────────────────────────────────────┘
```

### 주요 구성 요소
- **Frontend**: React + Nginx (Docker 컨테이너)
- **Backend**: Django + Gunicorn (Docker 컨테이너)
- **Database**: PostgreSQL (Docker 컨테이너)
- **Storage**: AWS S3 (음악 파일, 앨범 커버)
- **Server**: AWS EC2 (Ubuntu 22.04)

---

## 사전 준비

### 1. AWS 계정 생성
1. https://aws.amazon.com/ko/free/ 접속
2. "무료 계정 만들기" 클릭
3. 이메일, 비밀번호, 계정 이름 입력
4. 연락처 정보 입력
5. 결제 정보 입력 (Free Tier 사용 시 과금 없음)
6. 본인 확인 (전화 인증)
7. 지원 플랜 선택 (기본 플랜 선택)

### 2. AWS CLI 설치 (로컬 컴퓨터)

**Windows:**
```powershell
# MSI 설치 프로그램 다운로드
# https://awscli.amazonaws.com/AWSCLIV2.msi

# 설치 확인
aws --version
```

**설치 후 AWS 자격 증명 설정:**
```bash
aws configure
# AWS Access Key ID: [IAM에서 생성한 키]
# AWS Secret Access Key: [IAM에서 생성한 비밀 키]
# Default region name: ap-northeast-2  (서울 리전)
# Default output format: json
```

### 3. IAM 사용자 생성 및 권한 설정

1. AWS Console → IAM → 사용자 → "사용자 추가"
2. 사용자 이름: `bootcamp-deploy-user`
3. 액세스 유형: "프로그래밍 방식 액세스" 선택
4. 권한 설정:
   - 기존 정책 직접 연결
   - 다음 정책 선택:
     - `AmazonS3FullAccess`
     - `AmazonEC2FullAccess`
     - `IAMReadOnlyAccess`
5. 태그 추가 (선택사항)
6. 검토 후 사용자 생성
7. **중요**: Access Key ID와 Secret Access Key를 안전하게 저장

### 4. GitHub 저장소 준비

```bash
# 로컬에서 실행
cd d:\MyPython\BootCampMusic

# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit for AWS deployment"

# GitHub 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/BootCampMusic.git
git branch -M main
git push -u origin main
```

---

## AWS S3 설정

### 1. S3 버킷 생성

**AWS Console에서:**
1. AWS Console → S3 → "버킷 만들기"
2. 버킷 이름: `bootcamp-music-storage` (고유한 이름 사용)
3. 리전: `ap-northeast-2` (서울)
4. 객체 소유권: "ACL 비활성화됨" 선택
5. 퍼블릭 액세스 차단 설정:
   - ✅ "모든 퍼블릭 액세스 차단" **해제**
   - ⚠️ 경고 확인 체크
6. 버킷 버전 관리: 비활성화
7. 기본 암호화: 활성화 (Amazon S3 관리형 키)
8. "버킷 만들기" 클릭

### 2. S3 버킷 정책 설정

버킷 생성 후:
1. 생성한 버킷 클릭
2. "권한" 탭 선택
3. "버킷 정책" → "편집" 클릭
4. 다음 정책 입력:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::bootcamp-music-storage/*"
        }
    ]
}
```

**주의**: `bootcamp-music-storage`를 실제 버킷 이름으로 변경하세요.

5. "변경 사항 저장" 클릭

### 3. CORS 설정

1. 같은 "권한" 탭에서 "CORS(Cross-Origin Resource Sharing)" 섹션으로 이동
2. "편집" 클릭
3. 다음 CORS 구성 입력:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

4. "변경 사항 저장" 클릭

### 4. S3 폴더 구조 생성

버킷 내부에 다음 폴더 구조를 생성합니다:
```
bootcamp-music-storage/
├── media/
│   ├── albums/          # 앨범 커버 이미지
│   └── tracks/          # 음악 파일
└── static/              # 정적 파일 (선택사항)
```

**폴더 생성 방법:**
1. 버킷 → "객체" 탭
2. "폴더 만들기" 클릭
3. 폴더 이름 입력: `media/albums/`, `media/tracks/`

---

## Docker 컨테이너 준비

### 1. Django S3 설정 추가

**requirements.txt 업데이트:**

```txt
Django>=4.2
djangorestframework>=3.14
django-cors-headers>=4.3
psycopg2-binary>=2.9
Pillow>=10.0
gunicorn>=21.2
boto3>=1.28
django-storages>=1.14
```

**설명:**
- `boto3`: AWS SDK for Python
- `django-storages`: Django에서 S3를 스토리지 백엔드로 사용

### 2. Django settings.py S3 설정 추가

`backend/config/settings.py` 파일 끝에 추가:

```python
# AWS S3 설정
USE_S3 = os.environ.get('USE_S3', 'False') == 'True'

if USE_S3:
    # AWS 설정
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'ap-northeast-2')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com'
    
    # S3 파일 저장 설정
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }
    
    # Static 파일 설정
    AWS_LOCATION = 'static'
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{AWS_LOCATION}/'
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    
    # Media 파일 설정
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
else:
    # 로컬 스토리지 설정
    STATIC_URL = '/static/'
    STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Static files 디렉토리
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
] if os.path.exists(os.path.join(BASE_DIR, 'static')) else []
```

### 3. 환경 변수 파일 생성

`.env.production` 파일 생성:

```bash
# Django 설정
DEBUG=False
SECRET_KEY=your-super-secret-key-change-this-in-production
ALLOWED_HOSTS=your-domain.com,your-ec2-ip,localhost

# 데이터베이스 설정
POSTGRES_DB=bootcampmusic
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-strong-password-here
POSTGRES_HOST=db
POSTGRES_PORT=5432

# AWS S3 설정
USE_S3=True
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_STORAGE_BUCKET_NAME=bootcamp-music-storage
AWS_S3_REGION_NAME=ap-northeast-2

# CORS 설정
CORS_ALLOWED_ORIGINS=https://your-domain.com,http://your-ec2-ip
```

**중요**: 
- `SECRET_KEY`: 강력한 랜덤 키 생성 (https://djecrety.ir/)
- `POSTGRES_PASSWORD`: 강력한 비밀번호 사용
- AWS 자격 증명: IAM에서 생성한 키 사용

### 4. docker-compose.prod.yml 업데이트

기존 파일을 다음과 같이 수정:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: bootcamp_db
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-bootcampmusic}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - bootcamp_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Django Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bootcamp_backend
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn --bind 0.0.0.0:8000 --workers 3 config.wsgi:application"
    environment:
      - DEBUG=${DEBUG:-False}
      - SECRET_KEY=${SECRET_KEY}
      - POSTGRES_DB=${POSTGRES_DB:-bootcampmusic}
      - POSTGRES_USER=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
      - ALLOWED_HOSTS=${ALLOWED_HOSTS}
      - CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
      - USE_S3=${USE_S3:-True}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_STORAGE_BUCKET_NAME=${AWS_STORAGE_BUCKET_NAME}
      - AWS_S3_REGION_NAME=${AWS_S3_REGION_NAME:-ap-northeast-2}
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - bootcamp_network
    restart: unless-stopped

  # React Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=${VITE_API_URL:-http://localhost:8000}
    container_name: bootcamp_frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - bootcamp_network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  bootcamp_network:
    driver: bridge
```

### 5. Frontend Dockerfile 업데이트

`frontend/Dockerfile`:

```dockerfile
# Stage 1: Build
FROM node:18-alpine as build

WORKDIR /app

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 6. Nginx 설정 파일

`frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # React Router 지원
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin 프록시
    location /admin {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 정적 파일 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## EC2 인스턴스 설정

### 1. EC2 인스턴스 생성

1. **AWS Console 로그인**
   - https://console.aws.amazon.com/ec2/

2. **인스턴스 시작**
   - "인스턴스 시작" 버튼 클릭

3. **이름 및 태그**
   - 이름: `BootCampMusic-Production`

4. **애플리케이션 및 OS 이미지 (AMI)**
   - Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
   - 아키텍처: 64비트 (x86)

5. **인스턴스 유형**
   - 권장: `t2.medium` (2 vCPU, 4GB RAM)
   - 최소: `t2.small` (1 vCPU, 2GB RAM)
   - Free Tier: `t2.micro` (테스트용, 성능 제한적)

6. **키 페어 (로그인)**
   - "새 키 페어 생성" 클릭
   - 키 페어 이름: `bootcamp-music-key`
   - 키 페어 유형: RSA
   - 프라이빗 키 파일 형식: `.pem`
   - "키 페어 생성" 클릭
   - **중요**: `.pem` 파일을 안전한 위치에 저장

7. **네트워크 설정**
   - "편집" 클릭
   - VPC: 기본 VPC 사용
   - 서브넷: 기본값
   - 퍼블릭 IP 자동 할당: 활성화
   
   **보안 그룹 규칙:**
   - 규칙 1: SSH
     - 유형: SSH
     - 프로토콜: TCP
     - 포트: 22
     - 소스: 내 IP (보안을 위해)
   
   - 규칙 2: HTTP
     - 유형: HTTP
     - 프로토콜: TCP
     - 포트: 80
     - 소스: 0.0.0.0/0 (모든 곳)
   
   - 규칙 3: HTTPS
     - 유형: HTTPS
     - 프로토콜: TCP
     - 포트: 443
     - 소스: 0.0.0.0/0 (모든 곳)
   
   - 규칙 4: Custom TCP (임시, 나중에 제거)
     - 유형: 사용자 지정 TCP
     - 프로토콜: TCP
     - 포트: 8000
     - 소스: 0.0.0.0/0

8. **스토리지 구성**
   - 크기: 20 GiB (최소), 권장 30 GiB
   - 볼륨 유형: gp3 (범용 SSD)
   - 종료 시 삭제: 체크 (선택사항)

9. **고급 세부 정보** (선택사항)
   - 종료 방지 활성화: 체크 (실수로 삭제 방지)

10. **요약 검토 및 시작**
    - 인스턴스 개수: 1
    - "인스턴스 시작" 클릭

### 2. Elastic IP 할당 (권장)

인스턴스를 재시작해도 IP가 변경되지 않도록 고정 IP를 할당합니다.

1. EC2 콘솔 → "탄력적 IP" → "탄력적 IP 주소 할당"
2. 네트워크 경계 그룹: 기본값
3. "할당" 클릭
4. 할당된 IP 선택 → "작업" → "탄력적 IP 주소 연결"
5. 인스턴스: 생성한 인스턴스 선택
6. "연결" 클릭

**할당된 Elastic IP를 기록하세요**: `_____._____._____._____ `

### 3. EC2 인스턴스 접속

**Windows (PowerShell):**

```powershell
# .pem 파일 권한 설정
icacls "bootcamp-music-key.pem" /inheritance:r
icacls "bootcamp-music-key.pem" /grant:r "%username%:R"

# SSH 접속
ssh -i "bootcamp-music-key.pem" ubuntu@YOUR_ELASTIC_IP
```

**접속 성공 시:**
```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 6.2.0-1009-aws x86_64)
...
ubuntu@ip-xxx-xxx-xxx-xxx:~$
```

---

## 애플리케이션 배포

### 1. EC2 서버 초기 설정

SSH로 EC2에 접속한 후:

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    git \
    vim

# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker 사용자 권한 추가
sudo usermod -aG docker ubuntu

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 설치 확인
docker --version
docker-compose --version

# 재로그인 (권한 적용)
exit
```

다시 SSH로 접속:
```bash
ssh -i "bootcamp-music-key.pem" ubuntu@YOUR_ELASTIC_IP
```

### 2. 프로젝트 클론

```bash
# 홈 디렉토리로 이동
cd ~

# GitHub에서 프로젝트 클론
git clone https://github.com/YOUR_USERNAME/BootCampMusic.git

# 프로젝트 디렉토리로 이동
cd BootCampMusic
```

### 3. 환경 변수 설정

```bash
# .env.production 파일 생성
nano .env.production
```

다음 내용 입력 (실제 값으로 변경):

```bash
# Django 설정
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=YOUR_ELASTIC_IP,your-domain.com,localhost

# 데이터베이스 설정
POSTGRES_DB=bootcampmusic
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-strong-password-here
POSTGRES_HOST=db
POSTGRES_PORT=5432

# AWS S3 설정
USE_S3=True
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_STORAGE_BUCKET_NAME=bootcamp-music-storage
AWS_S3_REGION_NAME=ap-northeast-2

# CORS 설정
CORS_ALLOWED_ORIGINS=http://YOUR_ELASTIC_IP,https://your-domain.com

# Frontend API URL
VITE_API_URL=http://YOUR_ELASTIC_IP:8000
```

**저장**: `Ctrl + O`, `Enter`, `Ctrl + X`

### 4. Docker 컨테이너 빌드 및 실행

```bash
# 환경 변수 로드
export $(cat .env.production | xargs)

# Docker Compose로 빌드 및 실행
docker-compose -f docker-compose.prod.yml up -d --build
```

**빌드 과정 (5-10분 소요):**
```
[+] Building 234.5s (23/23) FINISHED
 => [backend internal] load build definition
 => [frontend internal] load build definition
 ...
[+] Running 4/4
 ✔ Network bootcampmusic_bootcamp_network  Created
 ✔ Container bootcamp_db                   Started
 ✔ Container bootcamp_backend              Started
 ✔ Container bootcamp_frontend             Started
```

### 5. 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker-compose -f docker-compose.prod.yml ps
```

**정상 출력:**
```
NAME                   IMAGE                      STATUS         PORTS
bootcamp_backend       bootcampmusic-backend      Up 2 minutes   0.0.0.0:8000->8000/tcp
bootcamp_db            postgres:15-alpine         Up 2 minutes   5432/tcp
bootcamp_frontend      bootcampmusic-frontend     Up 2 minutes   0.0.0.0:80->80/tcp
```

### 6. 데이터베이스 마이그레이션

```bash
# 마이그레이션 실행
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# 슈퍼유저 생성
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

**슈퍼유저 정보 입력:**
```
Username: admin
Email: admin@example.com
Password: ********
Password (again): ********
Superuser created successfully.
```

### 7. 로컬 음악 파일 S3로 업로드

**로컬 컴퓨터에서 실행:**

```bash
# AWS CLI로 음악 파일 업로드
cd d:\MyPython\BootCampMusic\backend\media

# 앨범 커버 업로드
aws s3 sync albums/ s3://bootcamp-music-storage/media/albums/ --acl public-read

# 음악 파일 업로드
aws s3 sync tracks/ s3://bootcamp-music-storage/media/tracks/ --acl public-read
```

**업로드 확인:**
```bash
aws s3 ls s3://bootcamp-music-storage/media/albums/
aws s3 ls s3://bootcamp-music-storage/media/tracks/
```

### 8. 데이터베이스에 음악 정보 추가

**EC2에서 실행:**

```bash
# Django shell 실행
docker-compose -f docker-compose.prod.yml exec backend python manage.py shell
```

**Python 쉘에서:**
```python
from music.models import Artist, Album, Track

# 아티스트 생성
artist = Artist.objects.create(
    name="Sample Artist",
    bio="A great artist"
)

# 앨범 생성
album = Album.objects.create(
    title="Sample Album",
    artist=artist,
    release_date="2024-01-01",
    cover_image="albums/sample-cover.jpg"  # S3에 업로드한 파일명
)

# 트랙 생성
track = Track.objects.create(
    title="Sample Track",
    artist=artist,
    album=album,
    duration=180,  # 초 단위
    file_path="tracks/sample-track.mp3"  # S3에 업로드한 파일명
)

# 확인
print(f"Created: {track.title}")
exit()
```

### 9. 접속 확인

브라우저에서 다음 URL로 접속:

- **Frontend**: `http://YOUR_ELASTIC_IP`
- **Backend API**: `http://YOUR_ELASTIC_IP:8000/api/`
- **Admin**: `http://YOUR_ELASTIC_IP:8000/admin/`

---

## 도메인 연결

### 1. Route 53에서 도메인 구매 (선택사항)

1. AWS Console → Route 53 → "도메인 등록"
2. 원하는 도메인 검색 (예: `bootcamp-music.com`)
3. 장바구니에 추가 → 결제
4. 등록 완료 (10-15분 소요)

### 2. 호스팅 영역 생성

1. Route 53 → "호스팅 영역" → "호스팅 영역 생성"
2. 도메인 이름: `bootcamp-music.com`
3. 유형: 퍼블릭 호스팅 영역
4. "호스팅 영역 생성" 클릭

### 3. A 레코드 생성

1. 생성한 호스팅 영역 클릭
2. "레코드 생성" 클릭
3. 레코드 구성:
   - 레코드 이름: (비워둠 - 루트 도메인)
   - 레코드 유형: A
   - 값: `YOUR_ELASTIC_IP`
   - TTL: 300
   - 라우팅 정책: 단순 라우팅
4. "레코드 생성" 클릭

### 4. www 서브도메인 추가

1. "레코드 생성" 클릭
2. 레코드 구성:
   - 레코드 이름: `www`
   - 레코드 유형: CNAME
   - 값: `bootcamp-music.com`
   - TTL: 300
3. "레코드 생성" 클릭

### 5. 환경 변수 업데이트

EC2에서:
```bash
cd ~/BootCampMusic
nano .env.production
```

`ALLOWED_HOSTS`와 `CORS_ALLOWED_ORIGINS`에 도메인 추가:
```bash
ALLOWED_HOSTS=YOUR_ELASTIC_IP,bootcamp-music.com,www.bootcamp-music.com
CORS_ALLOWED_ORIGINS=http://bootcamp-music.com,https://bootcamp-music.com,http://www.bootcamp-music.com,https://www.bootcamp-music.com
```

컨테이너 재시작:
```bash
docker-compose -f docker-compose.prod.yml down
export $(cat .env.production | xargs)
docker-compose -f docker-compose.prod.yml up -d
```

---

## SSL 인증서 설정

### 1. Certbot 설치

EC2에서:
```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-nginx

# Nginx 설치 (호스트에)
sudo apt install -y nginx
```

### 2. Nginx 설정 (호스트)

```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/bootcamp-music
```

다음 내용 입력:
```nginx
server {
    listen 80;
    server_name bootcamp-music.com www.bootcamp-music.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/bootcamp-music /etc/nginx/sites-enabled/

# 기본 설정 제거
sudo rm /etc/nginx/sites-enabled/default

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### 3. SSL 인증서 발급

```bash
# Certbot으로 SSL 인증서 발급
sudo certbot --nginx -d bootcamp-music.com -d www.bootcamp-music.com
```

**프롬프트 응답:**
```
Enter email address: your-email@example.com
Agree to terms: (Y)es
Share email: (N)o
```

**성공 메시지:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/bootcamp-music.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/bootcamp-music.com/privkey.pem
```

### 4. 자동 갱신 설정

```bash
# 자동 갱신 테스트
sudo certbot renew --dry-run

# Cron job 확인 (자동으로 설정됨)
sudo systemctl status certbot.timer
```

### 5. HTTPS 접속 확인

브라우저에서 `https://bootcamp-music.com` 접속하여 자물쇠 아이콘 확인

---

## 모니터링 및 유지보수

### 1. 로그 확인

```bash
# 전체 로그
docker-compose -f docker-compose.prod.yml logs

# 특정 서비스 로그
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs db

# 실시간 로그 (Tail)
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 2. 리소스 모니터링

```bash
# 컨테이너 리소스 사용량
docker stats

# 디스크 사용량
df -h

# 메모리 사용량
free -h

# CPU 사용량
top
```

### 3. 데이터베이스 백업

```bash
# 백업 스크립트 생성
nano ~/backup_db.sh
```

```bash
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose -f ~/BootCampMusic/docker-compose.prod.yml exec -T db \
    pg_dump -U postgres bootcampmusic > $BACKUP_DIR/backup_$DATE.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
```

```bash
# 실행 권한 부여
chmod +x ~/backup_db.sh

# Cron job 설정 (매일 새벽 2시)
crontab -e
```

Cron 설정 추가:
```
0 2 * * * /home/ubuntu/backup_db.sh >> /home/ubuntu/backup.log 2>&1
```

### 4. 애플리케이션 업데이트

```bash
# 최신 코드 가져오기
cd ~/BootCampMusic
git pull origin main

# 컨테이너 재빌드 및 재시작
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# 마이그레이션 실행
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### 5. CloudWatch 모니터링 (선택사항)

1. EC2 콘솔 → 인스턴스 선택
2. "작업" → "모니터링 및 문제 해결" → "CloudWatch 세부 모니터링 관리"
3. "세부 모니터링 활성화" 선택

**CloudWatch 알람 설정:**
1. CloudWatch 콘솔 → "알람" → "알람 생성"
2. 지표 선택: EC2 → CPU 사용률
3. 조건: CPU > 80% (5분 연속)
4. 알림: SNS 주제 생성 → 이메일 입력
5. 알람 생성

---

## 문제 해결

### 1. 컨테이너가 시작되지 않을 때

```bash
# 로그 확인
docker-compose -f docker-compose.prod.yml logs

# 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 컨테이너 재시작
docker-compose -f docker-compose.prod.yml restart

# 완전 재시작
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### 2. 데이터베이스 연결 오류

```bash
# PostgreSQL 컨테이너 로그 확인
docker-compose -f docker-compose.prod.yml logs db

# 데이터베이스 접속 테스트
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d bootcampmusic

# 연결 확인
\conninfo
\q
```

### 3. S3 파일 접근 오류

```bash
# Backend 로그 확인
docker-compose -f docker-compose.prod.yml logs backend | grep -i s3

# AWS 자격 증명 확인
docker-compose -f docker-compose.prod.yml exec backend env | grep AWS

# S3 버킷 정책 확인 (로컬에서)
aws s3api get-bucket-policy --bucket bootcamp-music-storage
```

### 4. 502 Bad Gateway 오류

```bash
# Backend 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps backend

# Backend 재시작
docker-compose -f docker-compose.prod.yml restart backend

# Nginx 로그 확인 (호스트)
sudo tail -f /var/log/nginx/error.log
```

### 5. 메모리 부족

```bash
# 메모리 사용량 확인
free -h
docker stats

# 불필요한 이미지 삭제
docker image prune -a

# 불필요한 볼륨 삭제
docker volume prune

# 로그 파일 정리
docker-compose -f docker-compose.prod.yml logs --tail=0 -f
```

### 6. 디스크 공간 부족

```bash
# 디스크 사용량 확인
df -h

# Docker 정리
docker system prune -a --volumes

# 로그 파일 크기 제한 (docker-compose.yml에 추가)
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 보안 체크리스트

- [ ] SECRET_KEY를 강력한 랜덤 값으로 변경
- [ ] DEBUG=False 설정
- [ ] ALLOWED_HOSTS에 실제 도메인만 포함
- [ ] PostgreSQL 비밀번호를 강력하게 설정
- [ ] AWS 자격 증명을 환경 변수로 관리 (코드에 포함 X)
- [ ] SSH 포트 22를 특정 IP로만 제한
- [ ] 불필요한 포트 8000 보안 그룹에서 제거
- [ ] SSL 인증서 설치 (HTTPS)
- [ ] 정기적인 백업 설정
- [ ] CloudWatch 알람 설정
- [ ] S3 버킷 정책 최소 권한 원칙 적용

---

## 비용 최적화

### Free Tier 활용
- EC2 t2.micro: 750시간/월 (1년간)
- S3: 5GB 저장 공간 (1년간)
- RDS 대신 EC2 내 PostgreSQL 컨테이너 사용

### 비용 절감 팁
1. **사용하지 않을 때 인스턴스 중지**
   ```bash
   # AWS CLI로 인스턴스 중지
   aws ec2 stop-instances --instance-ids i-xxxxxxxxx
   
   # 시작
   aws ec2 start-instances --instance-ids i-xxxxxxxxx
   ```

2. **불필요한 스냅샷 삭제**
   - EC2 → Elastic Block Store → 스냅샷 → 오래된 스냅샷 삭제

3. **CloudWatch 로그 보존 기간 설정**
   - CloudWatch → 로그 그룹 → 보존 기간: 7일

4. **Elastic IP 미사용 시 해제**
   - 사용하지 않는 Elastic IP는 과금됨

---

## 배포 완료 확인

### 체크리스트

- [ ] EC2 인스턴스 실행 중
- [ ] Docker 컨테이너 3개 모두 실행 중 (frontend, backend, db)
- [ ] S3 버킷에 음악 파일 업로드 완료
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 슈퍼유저 생성 완료
- [ ] Frontend 접속 가능 (`http://YOUR_IP`)
- [ ] Backend API 접속 가능 (`http://YOUR_IP:8000/api/`)
- [ ] Admin 페이지 접속 가능 (`http://YOUR_IP:8000/admin/`)
- [ ] 음악 재생 기능 정상 작동
- [ ] 도메인 연결 완료 (선택사항)
- [ ] SSL 인증서 설치 완료 (선택사항)

---

## 추가 리소스

- [Django 배포 가이드](https://docs.djangoproject.com/en/stable/howto/deployment/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [AWS EC2 사용 설명서](https://docs.aws.amazon.com/ec2/)
- [AWS S3 개발자 가이드](https://docs.aws.amazon.com/s3/)
- [Let's Encrypt 문서](https://letsencrypt.org/docs/)

---

## 지원

문제가 발생하면:
1. 로그 확인: `docker-compose -f docker-compose.prod.yml logs`
2. GitHub Issues: https://github.com/YOUR_USERNAME/BootCampMusic/issues
3. AWS Support (유료 플랜 필요)

---

**배포 완료를 축하합니다! 🎉**
