#!/bin/bash

# BootCampMusic EC2 자동 배포 스크립트
# 이 스크립트는 EC2 인스턴스에서 실행됩니다

set -e  # 오류 발생 시 스크립트 중단

echo "========================================="
echo "BootCampMusic 배포 시작"
echo "========================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수: 성공 메시지
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 함수: 경고 메시지
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 함수: 오류 메시지
error() {
    echo -e "${RED}✗ $1${NC}"
}

# 1. 시스템 업데이트
echo ""
echo "1. 시스템 업데이트 중..."
sudo apt update -qq
sudo apt upgrade -y -qq
success "시스템 업데이트 완료"

# 2. 필수 패키지 설치
echo ""
echo "2. 필수 패키지 설치 중..."
sudo apt install -y -qq \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    git \
    vim \
    htop
success "필수 패키지 설치 완료"

# 3. Docker 설치
echo ""
echo "3. Docker 설치 중..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    success "Docker 설치 완료"
else
    warning "Docker가 이미 설치되어 있습니다"
fi

# 4. Docker Compose 설치
echo ""
echo "4. Docker Compose 설치 중..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    success "Docker Compose 설치 완료"
else
    warning "Docker Compose가 이미 설치되어 있습니다"
fi

# 버전 확인
echo ""
echo "설치된 버전:"
docker --version
docker-compose --version

# 5. GitHub에서 프로젝트 클론
echo ""
echo "5. 프로젝트 클론 중..."
cd ~
if [ -d "BootCampMusic" ]; then
    warning "프로젝트 디렉토리가 이미 존재합니다. 최신 코드로 업데이트합니다."
    cd BootCampMusic
    git pull origin main
else
    read -p "GitHub 사용자명을 입력하세요: " GITHUB_USER
    git clone https://github.com/$GITHUB_USER/BootCampMusic.git
    cd BootCampMusic
    success "프로젝트 클론 완료"
fi

# 6. 환경 변수 설정
echo ""
echo "6. 환경 변수 설정..."
if [ ! -f .env.production ]; then
    echo ""
    warning ".env.production 파일이 없습니다. 지금 생성합니다."
    echo ""
    
    # SECRET_KEY 생성
    SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
    
    # 사용자 입력 받기
    read -p "EC2 Elastic IP 또는 도메인 (예: 1.2.3.4): " EC2_IP
    read -p "PostgreSQL 비밀번호: " -s POSTGRES_PASSWORD
    echo ""
    read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
    read -p "AWS Secret Access Key: " -s AWS_SECRET_ACCESS_KEY
    echo ""
    read -p "AWS S3 버킷 이름 (예: bootcamp-music-storage): " AWS_BUCKET
    
    # .env.production 파일 생성
    cat > .env.production << EOF
# Django 설정
DEBUG=False
SECRET_KEY=$SECRET_KEY
ALLOWED_HOSTS=$EC2_IP,localhost

# 데이터베이스 설정
POSTGRES_DB=bootcampmusic
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# AWS S3 설정
USE_S3=True
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_STORAGE_BUCKET_NAME=$AWS_BUCKET
AWS_S3_REGION_NAME=ap-northeast-2

# CORS 설정
CORS_ALLOWED_ORIGINS=http://$EC2_IP,https://$EC2_IP

# Frontend API URL
VITE_API_URL=http://$EC2_IP:8000
EOF
    
    success ".env.production 파일 생성 완료"
else
    warning ".env.production 파일이 이미 존재합니다"
fi

# 7. Docker 이미지 빌드 및 컨테이너 실행
echo ""
echo "7. Docker 컨테이너 빌드 및 실행 중..."
echo "   (이 과정은 5-10분 정도 소요될 수 있습니다)"

# 환경 변수 로드
export $(cat .env.production | xargs)

# 기존 컨테이너 중지 및 제거
if [ "$(docker ps -aq)" ]; then
    warning "기존 컨테이너를 중지하고 제거합니다..."
    docker-compose -f docker-compose.prod.yml down
fi

# 새 컨테이너 빌드 및 실행
docker-compose -f docker-compose.prod.yml up -d --build

success "Docker 컨테이너 실행 완료"

# 8. 컨테이너 상태 확인
echo ""
echo "8. 컨테이너 상태 확인 중..."
sleep 10  # 컨테이너 시작 대기
docker-compose -f docker-compose.prod.yml ps

# 9. 데이터베이스 마이그레이션
echo ""
echo "9. 데이터베이스 마이그레이션 실행 중..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
success "데이터베이스 마이그레이션 완료"

# 10. 슈퍼유저 생성 (선택사항)
echo ""
read -p "슈퍼유저를 생성하시겠습니까? (y/n): " CREATE_SUPERUSER
if [ "$CREATE_SUPERUSER" = "y" ] || [ "$CREATE_SUPERUSER" = "Y" ]; then
    docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
fi

# 11. 백업 스크립트 설정
echo ""
echo "11. 자동 백업 스크립트 설정 중..."
cat > ~/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose -f ~/BootCampMusic/docker-compose.prod.yml exec -T db \
    pg_dump -U postgres bootcampmusic > $BACKUP_DIR/backup_$DATE.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
EOF

chmod +x ~/backup_db.sh
success "백업 스크립트 생성 완료"

# Cron job 설정
echo ""
read -p "매일 새벽 2시에 자동 백업을 설정하시겠습니까? (y/n): " SETUP_CRON
if [ "$SETUP_CRON" = "y" ] || [ "$SETUP_CRON" = "Y" ]; then
    (crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup_db.sh >> /home/ubuntu/backup.log 2>&1") | crontab -
    success "자동 백업 Cron job 설정 완료"
fi

# 12. 방화벽 설정 (UFW)
echo ""
echo "12. 방화벽 설정 중..."
if ! command -v ufw &> /dev/null; then
    sudo apt install -y ufw
fi

sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp  # Django (임시)

warning "방화벽 규칙이 추가되었습니다. 'sudo ufw enable'로 활성화할 수 있습니다."

# 완료 메시지
echo ""
echo "========================================="
echo -e "${GREEN}배포 완료!${NC}"
echo "========================================="
echo ""
echo "접속 정보:"
echo "  Frontend: http://$EC2_IP"
echo "  Backend API: http://$EC2_IP:8000/api/"
echo "  Admin: http://$EC2_IP:8000/admin/"
echo ""
echo "유용한 명령어:"
echo "  컨테이너 상태 확인: docker-compose -f docker-compose.prod.yml ps"
echo "  로그 확인: docker-compose -f docker-compose.prod.yml logs -f"
echo "  컨테이너 재시작: docker-compose -f docker-compose.prod.yml restart"
echo "  컨테이너 중지: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "다음 단계:"
echo "  1. S3에 음악 파일 업로드"
echo "  2. 도메인 연결 (선택사항)"
echo "  3. SSL 인증서 설치 (선택사항)"
echo ""
warning "Docker 그룹 권한을 적용하려면 로그아웃 후 다시 로그인하세요."
echo ""
