---
description: Local testing of Frontend and Backend
---

# Steps to run the project locally

1. **Start the PostgreSQL database**
   ```bash
   docker compose up -d db
   ```
   // turbo
2. **Apply database migrations**
   ```bash
   docker compose run --rm backend python manage.py migrate
   ```
   // turbo
3. **Create a superuser (optional, for admin access)**
   ```bash
   docker compose run --rm backend python manage.py createsuperuser
   ```
   // turbo
4. **Start the backend service**
   ```bash
   docker compose up -d backend
   ```
   // turbo
5. **Start the frontend development server**
   ```bash
   docker compose up -d frontend
   ```
   // turbo
6. **Verify the API is reachable**
   ```bash
   curl http://localhost:8088/api/music/tracks/
   ```
   // turbo
7. **Open the frontend in a browser**
   Navigate to `http://localhost:5173` and interact with the UI.

# Cleanup

When you are done, stop and remove the containers:
```bash
docker compose down
```
