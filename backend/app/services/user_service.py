from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User
from app.models.contact import Contact, ContactStatus
from app.schemas.user import UserUpdate, PublicKeyUpdate
import uuid


def get_user_by_id(user_id: uuid.UUID, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return user


def search_users(query: str, current_user_id: uuid.UUID, db: Session):
    return db.query(User).filter(
        User.is_active == True,
        User.id != current_user_id,
        (User.username.ilike(f"%{query}%")) | (User.full_name.ilike(f"%{query}%"))
    ).limit(20).all()


def update_profile(user: User, data: UserUpdate, db: Session) -> User:
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.bio is not None:
        user.bio = data.bio
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    db.commit()
    db.refresh(user)
    return user


def update_public_key(user: User, data: PublicKeyUpdate, db: Session) -> User:
    user.public_key = data.public_key
    db.commit()
    db.refresh(user)
    return user


def add_contact(user: User, contact_username: str, db: Session) -> Contact:
    contact_user = db.query(User).filter(User.username == contact_username, User.is_active == True).first()
    if not contact_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if contact_user.id == user.id:
        raise HTTPException(status_code=400, detail="Tidak bisa menambahkan diri sendiri")

    existing = db.query(Contact).filter(
        Contact.user_id == user.id, Contact.contact_id == contact_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kontak sudah ada")

    contact = Contact(user_id=user.id, contact_id=contact_user.id, status=ContactStatus.ACCEPTED)
    db.add(contact)
    # Add reverse contact too
    reverse = Contact(user_id=contact_user.id, contact_id=user.id, status=ContactStatus.ACCEPTED)
    db.add(reverse)
    db.commit()
    db.refresh(contact)
    return contact


def get_contacts(user: User, db: Session):
    return db.query(Contact).filter(
        Contact.user_id == user.id,
        Contact.status == ContactStatus.ACCEPTED
    ).all()


def get_all_users(db: Session):
    return db.query(User).all()
