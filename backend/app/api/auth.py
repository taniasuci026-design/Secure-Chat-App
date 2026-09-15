from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import register_user, login_user

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: UserRegister, request: Request, db: Session = Depends(get_db)):
    """Registrasi user baru."""
    return register_user(data, db, request)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Login dan dapatkan JWT token."""
    return login_user(data, db, request)
