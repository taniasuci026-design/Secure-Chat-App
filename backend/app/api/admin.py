from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models.user import User
from app.models.message import Message
from app.models.activity_log import ActivityLog
from app.utils.deps import get_admin_user

router = APIRouter()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    """Statistik aplikasi untuk admin dashboard."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_messages = db.query(Message).filter(Message.is_deleted == False).count()
    total_logs = db.query(ActivityLog).count()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_messages": total_messages,
        "total_activity_logs": total_logs,
    }


@router.get("/users")
def list_all_users(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    """Daftar semua user untuk admin."""
    from app.schemas.user import UserResponse
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserResponse.from_orm(u) for u in users]


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: str, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    """Aktifkan/nonaktifkan user."""
    import uuid
    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    user.is_active = not user.is_active
    db.commit()
    return {"user_id": user_id, "is_active": user.is_active}


@router.get("/logs")
def get_activity_logs(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Activity logs untuk monitoring."""
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs
