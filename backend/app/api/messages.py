from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.user import User
from app.schemas.message import MessageSend, MessageResponse
from app.services.message_service import (
    send_message, get_conversation, get_conversations_list, delete_message
)
from app.utils.deps import get_current_user
import uuid

router = APIRouter()


@router.post("/", response_model=MessageResponse, status_code=201)
def create_message(data: MessageSend, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Kirim pesan terenkripsi."""
    return send_message(data, current_user, db)


@router.get("/conversations", response_model=List[dict])
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Dapatkan daftar percakapan."""
    convs = get_conversations_list(current_user.id, db)
    result = []
    for c in convs:
        from app.schemas.user import UserResponse
        from app.schemas.message import MessageResponse
        result.append({
            "user": UserResponse.from_orm(c["user"]).dict(),
            "last_message": MessageResponse.from_orm(c["last_message"]).dict(),
            "unread_count": c["unread_count"]
        })
    return result


@router.get("/{other_user_id}", response_model=List[MessageResponse])
def get_chat_history(
    other_user_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dapatkan riwayat pesan dengan user tertentu."""
    return get_conversation(current_user.id, other_user_id, db, skip, limit)


@router.delete("/{message_id}")
def remove_message(message_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Hapus pesan (soft delete)."""
    return delete_message(message_id, current_user.id, db)

@router.get("/search/all", response_model=List[MessageResponse])
def search_all_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ambil semua pesan untuk search global di frontend."""
    from app.services.message_service import get_all_user_messages
    return get_all_user_messages(current_user.id, db)