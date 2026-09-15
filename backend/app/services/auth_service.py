from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Request
from datetime import datetime
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.schemas.user import UserRegister, UserLogin, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token
import uuid


def register_user(data: UserRegister, db: Session, request: Request = None) -> User:
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username sudah digunakan")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email sudah digunakan")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log = ActivityLog(
        user_id=user.id,
        action="REGISTER",
        detail=f"User {user.username} berhasil mendaftar",
        ip_address=request.client.host if request else None
    )
    db.add(log)
    db.commit()
    return user


def login_user(data: UserLogin, db: Session, request: Request = None) -> TokenResponse:
    user = db.query(User).filter(
        (User.username == data.username) | (User.email == data.username)
    ).first()

    if not user or not verify_password(data.password, user.hashed_password):
        log = ActivityLog(
            action="LOGIN_FAILED",
            detail=f"Percobaan login gagal untuk: {data.username}",
            ip_address=request.client.host if request else None
        )
        db.add(log)
        db.commit()
        raise HTTPException(status_code=401, detail="Username atau password salah")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Akun tidak aktif")

    token = create_access_token({"sub": str(user.id)})
    user.last_seen = datetime.utcnow()

    log = ActivityLog(
        user_id=user.id,
        action="LOGIN",
        detail=f"User {user.username} berhasil login",
        ip_address=request.client.host if request else None
    )
    db.add(log)
    db.commit()
    db.refresh(user)

    from app.schemas.user import UserResponse
    return TokenResponse(access_token=token, user=UserResponse.from_orm(user))
