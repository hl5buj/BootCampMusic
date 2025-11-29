# BootCampMusic Project Presentation Content

## Slide 1: Title Slide
**Title**: BootCampMusic Project
**Subtitle**: Comprehensive System Overview & Development Report (Waterfall Methodology)

## Slide 2: Project Overview
**Objectives**:
- Develop a full-stack music streaming platform.
- Provide seamless user experience with instant playback.
- Enable administrative management of music assets.
- Ensure scalability for future cloud deployment.

**Scope**:
- **Frontend**: Responsive Web Application (React).
- **Backend**: RESTful API (Django).
- **Database**: Relational Database for structured data.
- **Features**: Music Playback, Search, Admin Dashboard, Authentication.

## Slide 3: Requirement Analysis
**Functional Requirements**:
- **User Authentication**: Sign up, Login, Logout.
- **Music Discovery**: Search by title, artist, genre.
- **Playback**: Global player, Hover-to-preview.
- **Admin**: Upload, Edit, Delete tracks/artists/albums.
- **Download**: Secure file download for authenticated users.

**Non-Functional Requirements**:
- **Performance**: Instant playback start (<200ms).
- **Usability**: Intuitive UI with dark mode aesthetics.
- **Reliability**: Error handling for missing files or network issues.
- **Maintainability**: Modular code structure (Component-based).

## Slide 4: System Design
**System Architecture**:
- Client-Server Architecture.
- Frontend: React (SPA) communicating via Axios.
- Backend: Django REST Framework serving JSON APIs.
- Media Storage: Local file system (Dev) -> S3 (Prod).
- Database: SQLite (Dev) -> PostgreSQL (Prod).

**Technology Stack**:
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion.
- **Backend**: Python, Django, Django REST Framework.
- **Database**: SQLite (Development).
- **Tools**: VS Code, Git, Docker (Planned).

## Slide 5: Database Design
**Entity Relationship Diagram (ERD)**:
- **Artist**: Name, Bio, Image.
- **Album**: Title, Release Date, Cover Image, FK(Artist).
- **Track**: Title, Duration, File, Preview, Genre, FK(Artist), FK(Album).
- **DownloadLog**: User, Track, Timestamp.

## Slide 6: Detailed Design
**Frontend Components**:
- **Navbar**: Navigation & Auth state management.
- **TrackCard**: Individual track display with Hover-to-Play logic.
- **GlobalPlayer**: Persistent footer player with progress/volume control.
- **Pages**: Home, Search, Login, Dashboard, Admin(Upload/Manage).

**Backend API Endpoints**:
- `GET /api/music/tracks/`: List & Filter tracks.
- `GET /api/music/tracks/{id}/`: Track details.
- `POST /api/admin/upload-track/`: Admin upload (Multi-part).
- `GET /api/auth/me/`: Current user context.

## Slide 7: Implementation Highlights
**Key Feature: Instant Playback**:
- **Challenge**: Latency in starting audio.
- **Solution**: `preload='auto'` on audio elements.
- **Optimization**: Reduced hover delay to 150ms.
- **Result**: Snappy, responsive user experience.

**Key Feature: Admin Workflow**:
- Complex dependency handling (Artist -> Album -> Track).
- Unified Upload Form: Creates Artist/Album automatically if missing.
- Transactional integrity ensuring data consistency.

## Slide 8: Testing & Status
**Current Status**:
- **Development Phase**: Completed.
- **Local Testing**: Passed (Functional & UI).
- **Known Issues**: Resolved (Playback delay, Admin bugs).
- **Ready for**: Containerization & Deployment.

## Slide 9: Future Plans
**Deployment Strategy**:
- **Containerization**: Dockerize Frontend & Backend.
- **Orchestration**: Docker Compose for local simulation.
- **Cloud Provider**: AWS (EC2 or ECS).
- **CI/CD**: GitHub Actions for automated testing/deployment.
