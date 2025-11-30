@echo off
REM BootCampMusic - 로컬 음악 파일을 AWS S3로 업로드하는 스크립트

echo ========================================
echo BootCampMusic S3 업로드 스크립트
echo ========================================
echo.

REM AWS CLI 설치 확인
where aws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [오류] AWS CLI가 설치되어 있지 않습니다.
    echo.
    echo AWS CLI 설치 방법:
    echo 1. https://awscli.amazonaws.com/AWSCLIV2.msi 다운로드
    echo 2. 설치 후 'aws configure' 실행
    echo.
    pause
    exit /b 1
)

REM AWS 자격 증명 확인
aws sts get-caller-identity >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [오류] AWS 자격 증명이 설정되지 않았습니다.
    echo.
    echo 'aws configure' 명령을 실행하여 자격 증명을 설정하세요.
    echo.
    pause
    exit /b 1
)

echo [확인] AWS CLI가 설치되어 있고 자격 증명이 설정되어 있습니다.
echo.

REM S3 버킷 이름 입력
set /p BUCKET_NAME="S3 버킷 이름을 입력하세요 (예: bootcamp-music-storage): "

if "%BUCKET_NAME%"=="" (
    echo [오류] 버킷 이름을 입력해야 합니다.
    pause
    exit /b 1
)

echo.
echo S3 버킷: %BUCKET_NAME%
echo.

REM 미디어 파일 경로 확인
set MEDIA_PATH=backend\media

if not exist "%MEDIA_PATH%" (
    echo [오류] 미디어 폴더를 찾을 수 없습니다: %MEDIA_PATH%
    pause
    exit /b 1
)

echo [1/3] 앨범 커버 이미지 업로드 중...
if exist "%MEDIA_PATH%\albums" (
    aws s3 sync "%MEDIA_PATH%\albums" s3://%BUCKET_NAME%/media/albums/ --acl public-read
    if %ERRORLEVEL% EQU 0 (
        echo [성공] 앨범 커버 업로드 완료
    ) else (
        echo [오류] 앨범 커버 업로드 실패
    )
) else (
    echo [건너뛰기] albums 폴더가 없습니다.
)

echo.
echo [2/3] 음악 파일 업로드 중...
if exist "%MEDIA_PATH%\tracks" (
    aws s3 sync "%MEDIA_PATH%\tracks" s3://%BUCKET_NAME%/media/tracks/ --acl public-read
    if %ERRORLEVEL% EQU 0 (
        echo [성공] 음악 파일 업로드 완료
    ) else (
        echo [오류] 음악 파일 업로드 실패
    )
) else (
    echo [건너뛰기] tracks 폴더가 없습니다.
)

echo.
echo [3/3] 업로드된 파일 확인 중...
echo.
echo === 앨범 커버 ===
aws s3 ls s3://%BUCKET_NAME%/media/albums/
echo.
echo === 음악 파일 ===
aws s3 ls s3://%BUCKET_NAME%/media/tracks/

echo.
echo ========================================
echo 업로드 완료!
echo ========================================
echo.
echo S3 버킷 URL:
echo https://%BUCKET_NAME%.s3.ap-northeast-2.amazonaws.com/
echo.
echo 다음 단계:
echo 1. EC2 인스턴스에서 .env.production 파일에 S3 설정 추가
echo 2. USE_S3=True 설정
echo 3. AWS_STORAGE_BUCKET_NAME=%BUCKET_NAME% 설정
echo 4. 애플리케이션 재시작
echo.
pause
