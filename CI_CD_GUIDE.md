# CI/CD 파이프라인 구축 및 설정 가이드

GitHub Actions를 사용하여 소스 코드를 GitHub에 Push하면 자동으로 AWS EC2 배포가 진행되도록 설정했습니다.
이제 사용자가 직접 수행해야 할 작업은 **GitHub 저장소에 AWS 접속 정보를 등록**하는 것뿐입니다.

## 📋 사전 확인 사항

1. **EC2 인스턴스가 실행 중**이어야 합니다.
2. **EC2 인스턴스에 프로젝트가 한 번은 배포되어 있어야 합니다.**
   - `deploy_ec2.sh`를 통해 최초 1회 배포를 성공한 상태라고 가정합니다.
   - 서버 내 경로는 `~/BootCampMusic`이어야 합니다.

---

## 🛠️ 사용자 설정 작업 (필수)

GitHub Repository 설정에서 AWS 접속 정보를 "Secrets"로 등록해야 합니다.

### 1단계: EC2 접속 키(PEM 파일) 준비
1. AWS EC2 생성 시 다운로드받은 `.pem` 키 파일을 메모장이나 텍스트 편집기로 엽니다.
2. `-----BEGIN RSA PRIVATE KEY-----` 부터 `-----END RSA PRIVATE KEY-----` 까지의 **모든 내용**을 복사합니다.

### 2단계: GitHub Secrets 등록
1. GitHub 웹사이트에서 해당 프로젝트 저장소(Repository)로 이동합니다.
2. 상단 메뉴의 **Settings** (설정) 탭을 클릭합니다.
3. 왼쪽 사이드바에서 **Secrets and variables** > **Actions**를 선택합니다.
4. **New repository secret** (새 저장소 비밀) 버튼을 클릭하여 아래 3가지 값을 각각 추가합니다.

#### 첫 번째 Secret
- **Name**: `AWS_HOST`
- **Secret**: 사용 중인 EC2 인스턴스의 **퍼블릭 IP 주소** (예: `15.165.14.176`)
- **Add secret** 클릭

#### 두 번째 Secret
- **Name**: `AWS_USERNAME`
- **Secret**: `ubuntu` (AWS EC2 기본 사용자명)
- **Add secret** 클릭

#### 세 번째 Secret
- **Name**: `AWS_KEY`
- **Secret**: (1단계에서 복사한 PEM 키 파일의 전체 내용 붙여넣기)
- **Add secret** 클릭

---

## 🚀 배포 테스트 방법

위 설정이 완료되었다면, 이제 자동으로 배포가 되는지 테스트해봅니다.

1. 로컬 컴퓨터(VS Code)에서 코드를 수정합니다. (예: 간단한 주석 추가 등)
2. 변경 사항을 GitHub에 Push 합니다.
   ```bash
   git add .
   git commit -m "CI/CD 테스트"
   git push origin main
   ```
3. GitHub 저장소의 **Actions** 탭으로 이동합니다.
4. `Deploy to AWS` 워크플로우가 실행되는 것을 실시간으로 확인할 수 있습니다.
5. 초록색 체크표시(✅)가 뜨면 배포 성공입니다.
6. 웹사이트(http://내도메인 또는 IP)에 접속하여 변경 사항이 반영되었는지 확인합니다.

## ℹ️ 작동 원리

1. 사용자가 `main` 브랜치에 코드를 Push합니다.
2. GitHub Actions가 이를 감지하여 `deploy.yml` 워크플로우를 시작합니다.
3. **Test Job**: 백엔드 테스트를 수행하여 기본 오류를 점검합니다.
4. **Deploy Job**:
   - SSH를 통해 AWS EC2 서버에 접속합니다.
   - `git pull origin main` 명령어로 최신 코드를 서버로 가져옵니다.
   - `docker-compose -f docker-compose.prod.yml up -d --build` 명령어로 Docker 컨테이너를 새로 빌드하고 재시작합니다.
   - 기존 컨테이너는 중단되고 새로운 버전으로 교체됩니다.

이제 설정 작업을 시작해주세요!
