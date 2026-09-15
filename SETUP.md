# 🚀 Panduan Setup Secure Chat App

## Prasyarat
Pastikan sudah terinstall:
- Python 3.12: https://www.python.org/downloads/
- Node.js v18+: https://nodejs.org/
- PostgreSQL 15/16: https://www.postgresql.org/download/windows/
- Git: https://git-scm.com/

---

## Langkah 1 — Ekstrak & Buka di VS Code

Ekstrak ZIP ke Documents, lalu:
```
VS Code → File → Open Folder → pilih secure-chat-app
```

---

## Langkah 2 — Setup Database PostgreSQL

Buka pgAdmin atau psql:
```sql
CREATE DATABASE secure_chat_db;
```

---

## Langkah 3 — Setup Backend

Buka Terminal di VS Code (`Ctrl + backtick`):

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
```

Buka file `backend\.env` dan **wajib ubah**:
- `DATABASE_URL` → ganti `passwordmu` dengan password PostgreSQL kamu
- `JWT_SECRET_KEY` → string acak panjang (min 32 karakter)
- `SECRET_KEY` → string acak panjang lain

Contoh generate secret key di Python:
```python
python -c "import secrets; print(secrets.token_hex(32))"
```

Jalankan backend:
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Kalau berhasil: http://localhost:8000/docs terbuka ✅

---

## Langkah 4 — Setup Frontend

Buka terminal BARU di VS Code (klik tanda +):

```powershell
cd frontend
npm install
npm run dev
```

Kalau berhasil: http://localhost:5173 terbuka ✅

---

## Langkah 5 — Daftar & Login

1. Buka http://localhost:5173/register
2. Daftar akun pertama
3. Login → otomatis masuk halaman chat
4. Daftar akun kedua (buka tab incognito)
5. Login dengan akun kedua
6. Tambahkan kontak satu sama lain, mulai chat!

---

## Langkah 6 — Buat Admin (Opsional)

Di psql atau pgAdmin:
```sql
UPDATE users SET is_admin = true WHERE username = 'usernamu';
```

Akses admin dashboard: http://localhost:5173/admin

---

## Struktur Fitur

| Fitur | Status |
|-------|--------|
| Register & Login | ✅ |
| JWT Authentication | ✅ |
| Real-time Chat (WebSocket) | ✅ |
| AES-256-CBC Enkripsi Pesan | ✅ |
| RSA Key Exchange | ✅ |
| Message Integrity (SHA-256) | ✅ |
| Contact Management | ✅ |
| Chat History | ✅ |
| File Sharing | ✅ |
| Typing Indicator | ✅ |
| Online/Offline Status | ✅ |
| Activity Logging | ✅ |
| Admin Dashboard | ✅ |
| User Profile | ✅ |

---

## Troubleshooting

**psycopg2 error saat install:**
```powershell
pip install psycopg2-binary --only-binary=psycopg2-binary
```

**venv\Scripts\activate tidak bisa di PowerShell:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Port sudah dipakai:**
```powershell
# Backend
uvicorn main:app --reload --port 8001
# Frontend (edit vite.config.js port ke 5174)
```

**Database connection failed:**
Cek `DATABASE_URL` di `.env`, pastikan password PostgreSQL benar.
