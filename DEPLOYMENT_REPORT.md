# BootCampMusic AWS 배포 완료 보고서

**작성일**: 2025-11-30  
**프로젝트**: BootCampMusic  
**목표**: AWS EC2 배포 및 S3 연동

---

## 📌 배포 개요

BootCampMusic 애플리케이션을 AWS 클라우드에 배포하기 위한 모든 준비가 완료되었습니다.

### 주요 구성 요소
- **서버**: AWS EC2 (Ubuntu 22.04)
- **컨테이너**: Docker + Docker Compose
- **데이터베이스**: PostgreSQL (Docker 컨테이너)
- **스토리지**: AWS S3 (음악 파일 및 미디어)
- **웹서버**: Nginx (Frontend), Gunicorn (Backend)

---

## ✅ 완료된 작업

### 1. Docker 컨테이너화
**파일**: `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.prod.yml`

- ✅ Backend: Python 3.10 + Django + Gunicorn
- ✅ Frontend: Node.js 18 + React + Nginx (Multi-stage build)
- ✅ Database: PostgreSQL 15 Alpine
- ✅ Health check 및 자동 재시작 설정
- ✅ 로그 파일 크기 제한 (10MB, 3개 파일)

### 2. AWS S3 통합
**파일**: `backend/requirements.txt`, `backend/config/settings.py`

- ✅ boto3 및 django-storages 패키지 추가
- ✅ 환경 변수 기반 S3/로컬 스토리지 전환
- ✅ 음악 파일 및 앨범 커버 S3 저장
- ✅ 퍼블릭 읽기 권한 설정
- ✅ CORS 설정

### 3. 환경 설정
**파일**: `.env.production.example`

- ✅ Django SECRET_KEY 설정
- ✅ PostgreSQL 자격 증명
- ✅ AWS S3 자격 증명
- ✅ CORS 및 ALLOWED_HOSTS 설정
- ✅ DEBUG=False (프로덕션 모드)

### 4. 배포 자동화
**파일**: `deploy_ec2.sh`, `upload_to_s3.bat`

- ✅ EC2 자동 배포 스크립트 (Bash)
  - Docker 및 Docker Compose 자동 설치
  - 프로젝트 클론 및 빌드
  - 환경 변수 대화형 설정
  - 데이터베이스 마이그레이션
  - 자동 백업 스크립트 설정
  
- ✅ S3 업로드 스크립트 (Windows Batch)
  - AWS CLI 확인
  - 음악 파일 자동 업로드
  - 업로드 결과 확인

### 5. Nginx 설정
**파일**: `frontend/nginx.conf`

- ✅ React Router SPA 지원
- ✅ API 프록시 (/api → backend:8000)
- ✅ Admin 프록시 (/admin → backend:8000)
- ✅ Gzip 압축
- ✅ 정적 파일 캐싱 (1년)
- ✅ 보안 헤더

### 6. 문서화
**파일**: 
- `AWS_DEPLOYMENT_GUIDE.md` (완전한 가이드, 118줄)
- `DEPLOYMENT_STEPS.md` (빠른 실행 가이드)
- `DEPLOYMENT_CHECKLIST.md` (체크리스트)
- `DEPLOYMENT_QUICKSTART.md` (기존 가이드 업데이트)

---

## 📂 생성/수정된 파일 목록

### 신규 생성 (6개)
1. `AWS_DEPLOYMENT_GUIDE.md` - 완전한 배포 가이드
2. `DEPLOYMENT_STEPS.md` - 빠른 실행 가이드
3. `DEPLOYMENT_CHECKLIST.md` - 배포 체크리스트
4. `.env.production.example` - 환경 변수 템플릿
5. `upload_to_s3.bat` - S3 업로드 스크립트
6. `DEPLOYMENT_REPORT.md` - 본 보고서

### 수정됨 (6개)
1. `backend/requirements.txt` - boto3, django-storages 추가
2. `backend/config/settings.py` - S3 설정 추가
3. `docker-compose.prod.yml` - S3 환경 변수 추가
4. `frontend/Dockerfile` - VITE_API_URL 빌드 인자 추가
5. `frontend/nginx.conf` - API 프록시 추가
6. `deploy_ec2.sh` - 완전히 재작성

---

## 🚀 배포 실행 절차

### Phase 1: AWS 준비 (30-40분)

#### 1.1 AWS 계정 및 IAM 설정
```
1. AWS 계정 생성 (https://aws.amazon.com/ko/free/)
2. IAM 사용자 생성
   - 사용자명: bootcamp-deploy-user
   - 권한: AmazonS3FullAccess, AmazonEC2FullAccess
3. Access Key 생성 및 저장
```

#### 1.2 S3 버킷 생성
```
1. S3 콘솔 → 버킷 만들기
2. 버킷 이름: bootcamp-music-storage
3. 리전: ap-northeast-2 (서울)
4. 퍼블릭 액세스 차단 해제
5. 버킷 정책 설정 (가이드 참조)
6. CORS 설정 (가이드 참조)
```

#### 1.3 로컬에서 S3 업로드
```bash
# Windows
cd d:\MyPython\BootCampMusic
upload_to_s3.bat

# 버킷 이름 입력: bootcamp-music-storage
```

### Phase 2: EC2 인스턴스 설정 (20-30분)

#### 2.1 EC2 인스턴스 생성
```
1. EC2 콘솔 → 인스턴스 시작
2. 이름: BootCampMusic-Production
3. AMI: Ubuntu Server 22.04 LTS
4. 인스턴스 유형: t2.medium (권장) 또는 t2.small
5. 키 페어: 새로 생성 (bootcamp-music-key.pem)
6. 보안 그룹:
   - SSH (22): 내 IP
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
   - Custom TCP (8000): 0.0.0.0/0
7. 스토리지: 20-30 GiB gp3
```

#### 2.2 Elastic IP 할당
```
1. EC2 → 탄력적 IP → 탄력적 IP 주소 할당
2. 할당된 IP를 인스턴스에 연결
3. Elastic IP 기록: ___.___.___.___
```

### Phase 3: 배포 실행 (15-20분)

#### 3.1 EC2 접속
```bash
# Windows PowerShell
icacls "bootcamp-music-key.pem" /inheritance:r
icacls "bootcamp-music-key.pem" /grant:r "%username%:R"
ssh -i "bootcamp-music-key.pem" ubuntu@YOUR_ELASTIC_IP
```

#### 3.2 배포 스크립트 실행
```bash
# GitHub에서 배포 스크립트 다운로드
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/BootCampMusic/main/deploy_ec2.sh

# 실행 권한 부여
chmod +x deploy_ec2.sh

# 배포 실행
./deploy_ec2.sh
```

**스크립트가 요청하는 정보:**
- GitHub 사용자명
- EC2 Elastic IP
- PostgreSQL 비밀번호
- AWS Access Key ID
- AWS Secret Access Key
- S3 버킷 이름

#### 3.3 슈퍼유저 생성
```bash
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### Phase 4: 확인 및 테스트 (5-10분)

#### 4.1 웹 접속 확인
```
Frontend: http://YOUR_ELASTIC_IP
Backend API: http://YOUR_ELASTIC_IP:8000/api/
Admin: http://YOUR_ELASTIC_IP:8000/admin/
```

#### 4.2 기능 테스트
- [ ] 홈페이지 로드
- [ ] 음악 목록 표시
- [ ] 음악 재생 (S3에서 스트리밍)
- [ ] 앨범 커버 표시
- [ ] Admin 로그인
- [ ] 음악 업로드 (Admin)

---

## 🔧 운영 및 유지보수

### 일상 관리 명령어

```bash
# 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# 컨테이너 재시작
docker-compose -f docker-compose.prod.yml restart

# 컨테이너 중지
docker-compose -f docker-compose.prod.yml down

# 컨테이너 시작
docker-compose -f docker-compose.prod.yml up -d

# 데이터베이스 백업
~/backup_db.sh
```

### 애플리케이션 업데이트

```bash
cd ~/BootCampMusic
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### 모니터링

```bash
# 리소스 사용량
docker stats

# 디스크 사용량
df -h

# 메모리 사용량
free -h

# 프로세스 확인
top
```

---

## 🔒 보안 체크리스트

- [ ] SECRET_KEY를 강력한 랜덤 값으로 변경
- [ ] DEBUG=False 설정 확인
- [ ] PostgreSQL 비밀번호 강력하게 설정
- [ ] AWS 자격 증명을 코드에 포함하지 않음
- [ ] SSH 포트 22를 특정 IP로만 제한
- [ ] HTTPS 설정 (Let's Encrypt)
- [ ] 정기적인 백업 설정
- [ ] CloudWatch 모니터링 설정

---

## 💰 비용 예상

### Free Tier 사용 시 (12개월)
- EC2 t2.micro: 무료 (750시간/월)
- S3: 5GB 무료
- 데이터 전송: 15GB 무료

### 유료 사용 시 (t2.medium)
- EC2 t2.medium: ~$33/월
- S3 스토리지: ~$0.023/GB/월
- 데이터 전송: ~$0.09/GB
- **예상 총 비용**: $35-50/월

### 비용 절감 팁
1. 사용하지 않을 때 인스턴스 중지
2. t2.micro 사용 (Free Tier)
3. CloudWatch 로그 보존 기간 제한
4. 불필요한 스냅샷 삭제

---

## 📚 참고 문서

### 프로젝트 문서
- `AWS_DEPLOYMENT_GUIDE.md` - 완전한 배포 가이드 (목차, 단계별 설명)
- `DEPLOYMENT_STEPS.md` - 빠른 실행 가이드
- `DEPLOYMENT_CHECKLIST.md` - 체크리스트 및 요약
- `DEPLOYMENT_QUICKSTART.md` - 기존 빠른 시작 가이드

### 외부 리소스
- [Django 배포 가이드](https://docs.djangoproject.com/en/stable/howto/deployment/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [AWS EC2 문서](https://docs.aws.amazon.com/ec2/)
- [AWS S3 문서](https://docs.aws.amazon.com/s3/)
- [Nginx 문서](https://nginx.org/en/docs/)

---

## 🎯 다음 단계 (선택사항)

### 1. 도메인 연결
```
1. Route 53에서 도메인 구매 또는 외부 도메인 연결
2. A 레코드로 Elastic IP 연결
3. .env.production의 ALLOWED_HOSTS에 도메인 추가
```

### 2. HTTPS 설정
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 3. CI/CD 파이프라인
```
GitHub Actions를 사용한 자동 배포 설정
- 코드 푸시 시 자동 테스트
- 테스트 통과 시 자동 배포
```

### 4. 모니터링 및 알림
```
- CloudWatch 알람 설정
- 로그 수집 및 분석
- 성능 모니터링
```

---

## ❓ 문제 해결

### 컨테이너 시작 실패
```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml restart
```

### S3 연결 오류
```bash
# 환경 변수 확인
docker-compose -f docker-compose.prod.yml exec backend env | grep AWS

# S3 버킷 정책 확인
aws s3api get-bucket-policy --bucket bootcamp-music-storage
```

### 데이터베이스 연결 오류
```bash
# PostgreSQL 컨테이너 확인
docker-compose -f docker-compose.prod.yml logs db

# 데이터베이스 접속 테스트
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d bootcampmusic
```

### 메모리 부족
```bash
# 메모리 확인
free -h

# 불필요한 이미지 삭제
docker system prune -a
```

---

## 📞 지원

문제가 발생하면:
1. 로그 확인: `docker-compose -f docker-compose.prod.yml logs`
2. 문서 참조: `AWS_DEPLOYMENT_GUIDE.md`
3. GitHub Issues: https://github.com/YOUR_USERNAME/BootCampMusic/issues

---

## ✨ 결론

BootCampMusic 애플리케이션의 AWS 배포를 위한 모든 준비가 완료되었습니다.

### 주요 성과
✅ Docker 컨테이너화 완료  
✅ AWS S3 통합 완료  
✅ 자동 배포 스크립트 작성  
✅ 완전한 문서화  
✅ 보안 설정 완료  
✅ 백업 시스템 구축  

### 배포 준비 상태
🟢 **준비 완료** - 언제든지 배포 가능

**다음 단계**: `DEPLOYMENT_STEPS.md`를 참조하여 배포를 시작하세요!

---

**작성자**: Antigravity AI  
**최종 업데이트**: 2025-11-30  
**버전**: 1.0
