from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, PublicKeyUpdate
from app.services.user_service import (
    get_user_by_id, search_users, update_profile,
    update_public_key, add_contact, get_contacts
)
from app.schemas.contact import ContactAdd, ContactResponse
from app.utils.deps import get_current_user
import uuid

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Dapatkan profil user yang sedang login."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update profil user."""
    return update_profile(current_user, data, db)


@router.put("/me/public-key", response_model=UserResponse)
def set_public_key(data: PublicKeyUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Simpan RSA public key user untuk E2EE."""
    return update_public_key(current_user, data, db)


@router.get("/search", response_model=List[UserResponse])
def search(q: str = Query(..., min_length=1), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Cari user berdasarkan username atau nama."""
    return search_users(q, current_user.id, db)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Dapatkan profil user berdasarkan ID."""
    return get_user_by_id(user_id, db)


@router.post("/contacts", response_model=ContactResponse, status_code=201)
def add_new_contact(data: ContactAdd, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Tambah kontak baru."""
    return add_contact(current_user, data.contact_username, db)


@router.get("/contacts/list", response_model=List[ContactResponse])
def list_contacts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Dapatkan daftar kontak."""
    return get_contacts(current_user, db)
