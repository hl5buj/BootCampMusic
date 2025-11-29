# BootCampMusic

A full-stack music streaming platform built with React and Django.

## Features

- 🎵 Music streaming with instant playback
- 🔍 Search by title, artist, or genre
- 👤 User authentication and personalized dashboard
- 🎨 Modern, responsive UI with dark mode
- 👨‍💼 Admin panel for music management
- 📥 Secure music downloads

## Tech Stack

### Frontend
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Axios

### Backend
- Django
- Django REST Framework
- SQLite (Development)
- Token Authentication

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/BootCampMusic.git
cd BootCampMusic
```

2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Usage

- Access the application at `http://localhost:5173`
- Backend API at `http://localhost:8000`
- Admin panel at `http://localhost:8000/admin`

## Project Structure

```
BootCampMusic/
├── backend/          # Django backend
│   ├── config/       # Project settings
│   ├── music/        # Music app
│   └── users/        # User authentication
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── contexts/
└── docs/            # Documentation
```

## License

This project is licensed under the MIT License.

## Contact

For questions or feedback, please open an issue on GitHub.
