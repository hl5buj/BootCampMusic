# 🎵 MusicDown 플랫폼 - 빠른 시작 가이드

## ✅ 현재 상태
- **백엔드**: ✅ 정상 작동 (포트 8088)
- **프론트엔드**: ⚠️ Docker 환경에서 실행 필요
- **데이터베이스**: ✅ 준비 완료

---

## 🚀 1단계: 서비스 시작

### 방법 1: Docker Compose (권장)
```bash
# Docker Desktop이 실행 중인지 확인하세요
docker-compose up --build
```

### 방법 2: 로컬 실행
```bash
# 터미널 1 - 백엔드
cd backend
..\venv\Scripts\activate
python manage.py runserver 8088

# 터미널 2 - 프론트엔드
cd frontend
npm run dev
```

---

## 🧪 2단계: 백엔드 테스트

브라우저에서 `test_frontend.html` 파일을 열어보세요:
```
file:///d:/MyPython/BootCampMusic/test_frontend.html
```

또는 직접 브라우저에서 접속:
- 관리자: http://localhost:8088/admin/login/
- API: http://localhost:8088/api/music/tracks/

---

## 👤 3단계: 관리자 계정 생성

음악을 업로드하려면 관리자 계정이 필요합니다:

```bash
cd backend
..\venv\Scripts\activate
python manage.py createsuperuser
```

입력 예시:
- Username: admin
- Email: admin@example.com
- Password: (원하는 비밀번호)

---

## 🎵 4단계: 샘플 음악 추가

1. http://localhost:8088/admin/ 접속
2. 로그인 (위에서 만든 계정)
3. Artists → Add artist (아티스트 추가)
4. Albums → Add album (앨범 추가)
5. Tracks → Add track (트랙 추가)
   - 음악 파일 업로드
   - 앨범 커버 이미지 업로드 (선택)

---

## 🌐 5단계: 프론트엔드 접속

프론트엔드가 실행되면:
- http://localhost:5173 접속
- 메인 페이지에서 음악 탐색
- 회원가입 후 다운로드 가능

---

## 🔍 문제 해결

### 프론트엔드가 안 뜨는 경우
1. Docker Desktop이 실행 중인지 확인
2. `docker ps` 명령어로 컨테이너 상태 확인
3. 로컬 실행: `cd frontend && npm run dev`

### 포트 충돌
- 백엔드는 8088 포트 사용
- 프론트엔드는 5173 포트 사용
- 다른 프로그램이 사용 중이면 종료하세요

### 데이터베이스 오류
```bash
cd backend
python manage.py migrate
```

---

## 📚 추가 정보

- **전체 테스트 보고서**: `TEST_REPORT.md`
- **테스트 페이지**: `test_frontend.html`
- **API 문서**: http://localhost:8088/api/ (Django REST framework)

---

## 🎯 다음 단계

1. ✅ 백엔드 테스트 완료
2. ⚠️ 프론트엔드 실행
3. ⚠️ 관리자 계정 생성
4. ⚠️ 샘플 음악 추가
5. ⚠️ 전체 기능 테스트
6. ⚠️ AWS 배포 준비

---

**문제가 있으면 `TEST_REPORT.md`를 확인하세요!**
