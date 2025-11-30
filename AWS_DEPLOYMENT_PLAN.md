# BootCampMusic AWS 배포 계획서

## 프로젝트 개요
- **프로젝트명**: BootCampMusic
- **목표**: 로컬 개발 환경에서 AWS 클라우드로 배포하여 외부 접속 가능한 서비스 구축
- **배포 방식**: Docker 컨테이너화 + AWS EC2/ECS 배포
- **예상 소요 시간**: 1일 (8시간)

---

## 1단계: Docker 컨테이너화 (2-3시간)

### 1.1 Backend Dockerfile 작성
**목적**: Django 백엔드를 Docker 이미지로 패키징

**작업 내용**:
- Python 3.10 기반 이미지 사용
- requirements.txt 의존성 설치
- Django 정적 파일 수집 (collectstatic)
- Gunicorn WSGI 서버 설정
- 환경 변수 설정 (.env 파일 활용)

**산출물**: `backend/Dockerfile`

### 1.2 Frontend Dockerfile 작성
**목적**: React 프론트엔드를 프로덕션 빌드로 패키징

**작업 내용**:
- Node.js 기반 멀티 스테이지 빌드
  - Stage 1: npm install + npm run build
  - Stage 2: Nginx로 정적 파일 서빙
- 환경 변수 설정 (API URL 등)
- Nginx 설정 파일 작성 (SPA 라우팅 지원)

**산출물**: `frontend/Dockerfile`, `frontend/nginx.conf`

### 1.3 Docker Compose 설정
**목적**: 로컬에서 전체 스택 테스트

**작업 내용**:
- Backend, Frontend, PostgreSQL 서비스 정의
- 네트워크 설정 (서비스 간 통신)
- 볼륨 마운트 (데이터베이스, 미디어 파일)
- 환경 변수 관리

**산출물**: `docker-compose.yml`, `docker-compose.prod.yml`

### 1.4 로컬 Docker 테스트
**검증 항목**:
- ✅ 컨테이너 빌드 성공
- ✅ 서비스 간 통신 정상
- ✅ 데이터베이스 연결 확인
- ✅ 미디어 파일 업로드/다운로드 테스트

---

## 2단계: 프로덕션 환경 설정 (1-2시간)

### 2.1 환경 변수 분리
**작업 내용**:
- 개발/프로덕션 환경 변수 파일 분리
  - `.env.development`
  - `.env.production`
- 민감 정보 관리 (SECRET_KEY, DB 비밀번호 등)
- AWS Secrets Manager 또는 환경 변수로 관리

### 2.2 데이터베이스 마이그레이션
**작업 내용**:
- SQLite → PostgreSQL 전환
- AWS RDS PostgreSQL 인스턴스 생성 (또는 Docker PostgreSQL 사용)
- 마이그레이션 스크립트 작성
- 초기 데이터 시딩 (샘플 음악 데이터)

### 2.3 정적 파일 및 미디어 파일 관리
**작업 내용**:
- AWS S3 버킷 생성
  - `bootcampmusic-static`: 정적 파일 (CSS, JS)
  - `bootcampmusic-media`: 미디어 파일 (음악, 이미지)
- Django Storages 설정 (django-storages, boto3)
- CloudFront CDN 설정 (선택 사항, 성능 향상)

**산출물**: S3 버킷, IAM 정책

---

## 3단계: AWS 인프라 구축 (2-3시간)

### 3.1 AWS 계정 및 IAM 설정
**작업 내용**:
- AWS 계정 준비 (Free Tier 활용)
- IAM 사용자 생성 (배포용)
- 필요한 권한 부여:
  - EC2 FullAccess
  - S3 FullAccess
  - RDS FullAccess (선택)
  - ECR (Elastic Container Registry) 권한

### 3.2 배포 방식 선택

#### 옵션 A: EC2 + Docker Compose (권장 - 간단함)
**작업 내용**:
- EC2 인스턴스 생성 (t2.medium 이상 권장)
- Ubuntu 22.04 LTS 선택
- 보안 그룹 설정:
  - 80 (HTTP)
  - 443 (HTTPS)
  - 22 (SSH)
  - 8000 (Django, 임시)
- Docker 및 Docker Compose 설치
- 프로젝트 파일 전송 (Git clone 또는 SCP)
- docker-compose up -d 실행

**장점**: 설정 간단, 비용 저렴
**단점**: 수동 스케일링, 관리 부담

#### 옵션 B: ECS (Elastic Container Service) - 고급
**작업 내용**:
- ECR에 Docker 이미지 푸시
- ECS 클러스터 생성
- Task Definition 작성 (Backend, Frontend)
- Application Load Balancer 설정
- Auto Scaling 설정

**장점**: 자동 스케일링, 관리 용이
**단점**: 설정 복잡, 비용 높음

**선택**: **옵션 A (EC2 + Docker Compose)** 추천

### 3.3 도메인 및 SSL 설정
**작업 내용**:
- 도메인 구매 (선택 사항, Route 53 또는 외부)
- Elastic IP 할당 (고정 IP)
- Let's Encrypt SSL 인증서 발급 (Certbot)
- Nginx 리버스 프록시 설정
  - Frontend: https://yourdomain.com
  - Backend API: https://yourdomain.com/api

**산출물**: SSL 인증서, Nginx 설정 파일

---

## 4단계: 배포 실행 (1-2시간)

### 4.1 Docker 이미지 빌드 및 푸시
**작업 내용**:
```bash
# Backend 이미지 빌드
cd backend
docker build -t bootcampmusic-backend:latest .

# Frontend 이미지 빌드
cd ../frontend
docker build -t bootcampmusic-frontend:latest .

# ECR에 푸시 (옵션 B 선택 시)
docker tag bootcampmusic-backend:latest <ECR_URL>/backend:latest
docker push <ECR_URL>/backend:latest
```

### 4.2 EC2 인스턴스 배포
**작업 내용**:
```bash
# EC2 접속
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Docker 설치
sudo apt update
sudo apt install docker.io docker-compose -y

# 프로젝트 클론
git clone https://github.com/YOUR_USERNAME/BootCampMusic.git
cd BootCampMusic

# 환경 변수 설정
nano .env.production

# Docker Compose 실행
docker-compose -f docker-compose.prod.yml up -d

# 로그 확인
docker-compose logs -f
```

### 4.3 데이터베이스 초기화
**작업 내용**:
```bash
# 마이그레이션 실행
docker-compose exec backend python manage.py migrate

# 슈퍼유저 생성
docker-compose exec backend python manage.py createsuperuser

# 정적 파일 수집
docker-compose exec backend python manage.py collectstatic --noinput

# 샘플 데이터 로드
docker-compose exec backend python manage.py loaddata initial_data.json
```

---

## 5단계: 테스트 및 검증 (1시간)

### 5.1 기능 테스트
**검증 항목**:
- ✅ 외부에서 웹사이트 접속 (http://<EC2_PUBLIC_IP>)
- ✅ 사용자 회원가입/로그인
- ✅ 음악 검색 및 재생
- ✅ 관리자 페이지 접속 및 음악 업로드
- ✅ 파일 다운로드 기능
- ✅ 모바일 반응형 확인

### 5.2 성능 테스트
**검증 항목**:
- 페이지 로딩 속도 (<3초)
- 음악 재생 지연 시간 (<200ms)
- 동시 접속자 처리 (최소 10명)

### 5.3 보안 점검
**검증 항목**:
- HTTPS 적용 확인
- CORS 설정 확인
- 환경 변수 노출 여부
- SQL Injection 방어
- XSS 방어

---

## 6단계: 모니터링 및 유지보수 설정 (1시간)

### 6.1 로깅 설정
**작업 내용**:
- Docker 로그 수집 (CloudWatch Logs 연동)
- Django 로그 레벨 설정 (ERROR, WARNING)
- Nginx 액세스 로그 분석

### 6.2 백업 전략
**작업 내용**:
- 데이터베이스 자동 백업 (RDS 스냅샷 또는 cron)
- 미디어 파일 S3 버전 관리
- 백업 주기: 매일 자동

### 6.3 모니터링 도구
**작업 내용**:
- AWS CloudWatch 알람 설정
  - CPU 사용률 > 80%
  - 디스크 사용률 > 90%
  - 서비스 다운 알림
- Uptime 모니터링 (UptimeRobot 등)

---

## 7단계: CI/CD 파이프라인 구축 (선택 사항)

### 7.1 GitHub Actions 설정
**작업 내용**:
- `.github/workflows/deploy.yml` 작성
- 자동 테스트 실행
- Docker 이미지 자동 빌드
- EC2 자동 배포

**트리거**: main 브랜치에 push 시

---

## 예상 비용 (월간)

| 항목 | 사양 | 예상 비용 (USD) |
|------|------|----------------|
| EC2 (t2.medium) | 2 vCPU, 4GB RAM | $30-40 |
| RDS PostgreSQL (선택) | db.t3.micro | $15-20 |
| S3 Storage | 10GB | $0.23 |
| CloudFront (선택) | 10GB 전송 | $1-2 |
| Elastic IP | 1개 | $0 (사용 중) |
| **총계** | | **$46-62/월** |

**절약 팁**: 
- Free Tier 활용 (첫 12개월)
- RDS 대신 Docker PostgreSQL 사용
- CloudFront 생략 (초기)

---

## 체크리스트

### 배포 전
- [ ] GitHub에 소스 코드 Push 완료
- [ ] Dockerfile 작성 (Backend, Frontend)
- [ ] docker-compose.yml 작성
- [ ] 로컬 Docker 테스트 완료
- [ ] 환경 변수 파일 준비 (.env.production)
- [ ] AWS 계정 준비

### 배포 중
- [ ] EC2 인스턴스 생성
- [ ] 보안 그룹 설정
- [ ] Docker 설치
- [ ] 프로젝트 배포
- [ ] 데이터베이스 마이그레이션
- [ ] SSL 인증서 설정

### 배포 후
- [ ] 외부 접속 테스트
- [ ] 기능 테스트 완료
- [ ] 모니터링 설정
- [ ] 백업 설정
- [ ] 문서화 업데이트

---

## 참고 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [AWS EC2 시작 가이드](https://docs.aws.amazon.com/ec2/)
- [Django 배포 가이드](https://docs.djangoproject.com/en/4.2/howto/deployment/)
- [Let's Encrypt Certbot](https://certbot.eff.org/)

---

## 문제 해결 가이드

### 문제 1: 컨테이너가 시작되지 않음
**해결책**: 
```bash
docker-compose logs backend
docker-compose logs frontend
```

### 문제 2: 데이터베이스 연결 실패
**해결책**:
- 환경 변수 확인 (DB_HOST, DB_PORT)
- 네트워크 설정 확인
- 보안 그룹에서 PostgreSQL 포트(5432) 허용

### 문제 3: 정적 파일이 로드되지 않음
**해결책**:
```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

---

**작성일**: 2025-11-30
**작성자**: BootCampMusic 개발팀
**버전**: 1.0
