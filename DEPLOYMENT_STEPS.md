# BootCampMusic AWS 배포 실행 가이드

## 배포 순서

### 1단계: AWS 준비 (30분)
1. AWS 계정 생성
2. IAM 사용자 생성 (S3, EC2 권한)
3. S3 버킷 생성: `bootcamp-music-storage`
4. S3 버킷 정책 및 CORS 설정

### 2단계: 로컬 준비 (10분)
1. AWS CLI 설치 및 설정
2. 음악 파일 S3 업로드
   ```bash
   upload_to_s3.bat
   ```

### 3단계: EC2 설정 (20분)
1. EC2 인스턴스 생성 (Ubuntu 22.04, t2.medium)
2. 보안 그룹: 22, 80, 443, 8000 포트 오픈
3. Elastic IP 할당
4. SSH 키 다운로드

### 4단계: 배포 실행 (15분)
1. EC2 접속
   ```bash
   ssh -i "key.pem" ubuntu@YOUR_IP
   ```
2. 배포 스크립트 실행
   ```bash
   curl -O https://raw.githubusercontent.com/YOUR_USER/BootCampMusic/main/deploy_ec2.sh
   chmod +x deploy_ec2.sh
   ./deploy_ec2.sh
   ```

### 5단계: 확인 (5분)
- Frontend: http://YOUR_IP
- Backend: http://YOUR_IP:8000/api/
- Admin: http://YOUR_IP:8000/admin/

## 주요 명령어

```bash
# 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f

# 재시작
docker-compose -f docker-compose.prod.yml restart

# 백업
~/backup_db.sh
```

## 문제 해결

### 컨테이너 시작 실패
```bash
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml restart
```

### S3 연결 오류
- .env.production의 AWS 자격 증명 확인
- S3 버킷 정책 확인

### 데이터베이스 연결 오류
```bash
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d bootcampmusic
```
