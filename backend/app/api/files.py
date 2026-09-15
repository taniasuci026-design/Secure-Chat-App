import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.utils.deps import get_current_user
from app.core.config import settings

router = APIRouter()

ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
}

def get_upload_dir():
    """Ambil path absolut folder uploads."""
    # Dari backend/app/api/files.py naik 4 level ke root project
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    upload_dir = os.path.join(base, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    print(f"📁 Upload dir: {upload_dir}")
    return upload_dir


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipe file tidak diizinkan")

    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail=f"File terlalu besar")

    upload_dir = get_upload_dir()
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(contents)

    return {
        "file_url": f"/uploads/{unique_filename}",
        "file_name": file.filename,
        "file_size": f"{len(contents) / 1024:.1f} KB",
        "content_type": file.content_type
    }


@router.get("/view/{filename}")
async def view_file(filename: str):
    upload_dir = get_upload_dir()
    file_path = os.path.join(upload_dir, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File tidak ditemukan")

    return FileResponse(file_path)


@router.get("/{filename}")
async def download_file(filename: str, current_user: User = Depends(get_current_user)):
    upload_dir = get_upload_dir()
    file_path = os.path.join(upload_dir, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File tidak ditemukan")

    return FileResponse(file_path)