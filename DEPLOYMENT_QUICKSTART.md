# AWS 배포 빠른 시작 가이드

## 사전 준비

1. **AWS 계정 생성** (아직 없는 경우)
   - https://aws.amazon.com/ko/free/ 에서 가입
   - Free Tier 12개월 무료 사용 가능

2. **GitHub에 코드 Push 완료**
   - `setup_github.bat` 실행하여 코드 업로드

## EC2 인스턴스 생성

### 1. AWS Console 로그인
- https://console.aws.amazon.com/ec2/ 접속

### 2. EC2 인스턴스 시작
1. **"인스턴스 시작"** 버튼 클릭
2. **이름**: `BootCampMusic-Server`
3. **AMI 선택**: Ubuntu Server 22.04 LTS
4. **인스턴스 유형**: t2.medium (또는 t2.small)
5. **키 페어**: 새로 생성 또는 기존 키 선택 (`.pem` 파일 다운로드 보관)
6. **네트워크 설정**:
   - SSH (22) - 내 IP만 허용
   - HTTP (80) - 모든 곳에서 허용
   - HTTPS (443) - 모든 곳에서 허용
   - 사용자 지정 TCP (8000) - 모든 곳에서 허용 (임시)
7. **스토리지**: 20GB gp3
8. **"인스턴스 시작"** 클릭

### 3. Elastic IP 할당 (선택 사항)
1. 왼쪽 메뉴에서 **"탄력적 IP"** 클릭
2. **"탄력적 IP 주소 할당"** 클릭
3. 할당된 IP를 인스턴스에 연결

## 배포 실행

### 1. EC2 접속
```bash
# Windows (PowerShell)
ssh -i "your-key.pem" ubuntu@<EC2_PUBLIC_IP>

# 권한 오류 시 (Windows)
icacls "your-key.pem" /inheritance:r
icacls "your-key.pem" /grant:r "%username%:R"
```

### 2. 배포 스크립트 실행
```bash
# 스크립트 다운로드
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/BootCampMusic/main/deploy_ec2.sh

# 실행 권한 부여
chmod +x deploy_ec2.sh

# 실행
./deploy_ec2.sh
```

스크립트가 자동으로:
- Docker 설치
- 프로젝트 클론
- 환경 변수 설정
- 컨테이너 빌드 및 실행
- 데이터베이스 마이그레이션
- 슈퍼유저 생성

### 3. 접속 확인
- 브라우저에서 `http://<EC2_PUBLIC_IP>` 접속
- 관리자 페이지: `http://<EC2_PUBLIC_IP>:8000/admin`

## 문제 해결

### 접속이 안 될 때
```bash
# 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# 재시작
docker-compose -f docker-compose.prod.yml restart
```

### 보안 그룹 확인
- EC2 콘솔에서 인스턴스 선택
- "보안" 탭 → "보안 그룹" 클릭
- 인바운드 규칙에 80, 443, 8000 포트가 열려있는지 확인

## 다음 단계

1. **도메인 연결** (선택 사항)
   - Route 53에서 도메인 구매
   - A 레코드로 EC2 IP 연결

2. **SSL 인증서 설치**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

3. **모니터링 설정**
   - CloudWatch 알람 설정
   - 로그 수집 설정

## 비용 절감 팁

- Free Tier 활용 (t2.micro, 750시간/월)
- 사용하지 않을 때 인스턴스 중지
- 불필요한 스냅샷 삭제
- CloudWatch 로그 보존 기간 설정

## 지원

문제가 발생하면 GitHub Issues에 문의하세요.
