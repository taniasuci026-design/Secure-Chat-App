# Secure Chat Application with Encryption

Aplikasi chat real-time berbasis web dengan enkripsi end-to-end (AES + RSA).

## Tech Stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy, JWT, WebSocket, Cryptography
- **Frontend**: React, Vite, TailwindCSS, Axios, React Router
- **Database**: PostgreSQL

## Quick Start

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
copy .env.example .env      # Edit .env dengan password PostgreSQL kamu
uvicorn main:app --reload --port 8000
```

### 2. Database
```sql
CREATE DATABASE secure_chat_db;
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
