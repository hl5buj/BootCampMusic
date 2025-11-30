#!/bin/bash
# EC2 Docker 정리 스크립트

echo "========================================="
echo "Docker 정리 시작"
echo "========================================="

# 1. 실행 중인 컨테이너 중지
echo ""
echo "[1/6] 실행 중인 컨테이너 중지..."
docker stop $(docker ps -q) 2>/dev/null || echo "실행 중인 컨테이너 없음"

# 2. 모든 컨테이너 삭제
echo ""
echo "[2/6] 모든 컨테이너 삭제..."
docker rm $(docker ps -aq) 2>/dev/null || echo "삭제할 컨테이너 없음"

# 3. 사용하지 않는 이미지 삭제
echo ""
echo "[3/6] 사용하지 않는 이미지 삭제..."
docker image prune -a -f

# 4. 사용하지 않는 볼륨 삭제
echo ""
echo "[4/6] 사용하지 않는 볼륨 삭제..."
docker volume prune -f

# 5. 사용하지 않는 네트워크 삭제
echo ""
echo "[5/6] 사용하지 않는 네트워크 삭제..."
docker network prune -f

# 6. 빌드 캐시 삭제
echo ""
echo "[6/6] 빌드 캐시 삭제..."
docker builder prune -a -f

# 정리 후 상태 확인
echo ""
echo "========================================="
echo "정리 완료!"
echo "========================================="
echo ""
echo "=== 남은 이미지 ==="
docker images

echo ""
echo "=== 남은 컨테이너 ==="
docker ps -a

echo ""
echo "=== 디스크 사용량 ==="
df -h

echo ""
echo "=== Docker 디스크 사용량 ==="
docker system df

echo ""
echo "정리가 완료되었습니다!"
