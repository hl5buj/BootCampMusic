# AWS 배포 완료 체크리스트

## ✅ 완료된 작업

### 1. Docker 컨테이너화
- [x] Backend Dockerfile 작성
- [x] Frontend Dockerfile 작성 (Multi-stage build)
- [x] docker-compose.prod.yml 작성
- [x] PostgreSQL 컨테이너 설정

### 2. AWS S3 연동
- [x] boto3, django-storages 패키지 추가
- [x] Django settings.py S3 설정 추가
- [x] 환경 변수 기반 S3/로컬 스토리지 전환
- [x] S3 업로드 스크립트 작성 (upload_to_s3.bat)

### 3. 배포 자동화
- [x] EC2 자동 배포 스크립트 (deploy_ec2.sh)
- [x] 환경 변수 템플릿 (.env.production.example)
- [x] 데이터베이스 백업 스크립트
- [x] Nginx 프록시 설정

### 4. 문서화
- [x] 완전한 배포 가이드 (AWS_DEPLOYMENT_GUIDE.md)
- [x] 빠른 실행 가이드 (DEPLOYMENT_STEPS.md)
- [x] 기존 빠른 시작 가이드 (DEPLOYMENT_QUICKSTART.md)

## 📋 배포 실행 순서

### 사전 준비 (로컬)
1. AWS 계정 생성
2. IAM 사용자 생성 및 키 발급
3. AWS CLI 설치 및 설정
4. S3 버킷 생성 및 설정
5. 로컬 음악 파일 S3 업로드

### EC2 배포
1. EC2 인스턴스 생성
2. Elastic IP 할당
3. 보안 그룹 설정
4. SSH 접속
5. 배포 스크립트 실행

## 📁 주요 파일

```
BootCampMusic/
├── backend/
│   ├── Dockerfile                    # Backend 컨테이너 이미지
│   ├── requirements.txt              # Python 패키지 (S3 포함)
│   └── config/
│       └── settings.py               # Django 설정 (S3 연동)
├── frontend/
│   ├── Dockerfile                    # Frontend 컨테이너 이미지
│   └── nginx.conf                    # Nginx 설정 (API 프록시)
├── docker-compose.prod.yml           # 프로덕션 Docker Compose
├── .env.production.example           # 환경 변수 템플릿
├── deploy_ec2.sh                     # EC2 자동 배포 스크립트
├── upload_to_s3.bat                  # S3 업로드 스크립트
├── AWS_DEPLOYMENT_GUIDE.md           # 상세 배포 가이드
└── DEPLOYMENT_STEPS.md               # 빠른 실행 가이드
```

## 🚀 빠른 시작

### 1. S3 업로드 (로컬)
```bash
upload_to_s3.bat
```

### 2. EC2 배포
```bash
# EC2 접속
ssh -i "your-key.pem" ubuntu@YOUR_IP

# 배포 스크립트 다운로드 및 실행
curl -O https://raw.githubusercontent.com/YOUR_USER/BootCampMusic/main/deploy_ec2.sh
chmod +x deploy_ec2.sh
./deploy_ec2.sh
```

### 3. 접속 확인
- Frontend: http://YOUR_IP
- Admin: http://YOUR_IP:8000/admin/

## 🔧 환경 변수 설정

`.env.production` 파일 예시:
```bash
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=your-ip,your-domain
POSTGRES_PASSWORD=strong-password
USE_S3=True
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=bootcamp-music-storage
```

## 📊 아키텍처

```
사용자 → EC2 (Docker Compose)
         ├── Frontend (Nginx:80)
         ├── Backend (Django:8000)
         └── PostgreSQL (5432)
                ↓
         AWS S3 (음악 파일)
```

## 🛠 유용한 명령어

```bash
# 컨테이너 상태
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f backend

# 재시작
docker-compose -f docker-compose.prod.yml restart

# 데이터베이스 백업
~/backup_db.sh
```

## 📖 상세 문서

- **완전한 가이드**: `AWS_DEPLOYMENT_GUIDE.md`
- **빠른 실행**: `DEPLOYMENT_STEPS.md`
- **기존 가이드**: `DEPLOYMENT_QUICKSTART.md`

## ⚠️ 주의사항

1. **보안**
   - SECRET_KEY 반드시 변경
   - 강력한 PostgreSQL 비밀번호 사용
   - AWS 자격 증명 노출 금지

2. **비용**
   - Free Tier: t2.micro (750시간/월)
   - 사용하지 않을 때 인스턴스 중지

3. **백업**
   - 정기적인 데이터베이스 백업
   - S3 버전 관리 활성화 권장

## 🎉 배포 완료!

모든 준비가 완료되었습니다. 이제 배포를 시작하세요!
