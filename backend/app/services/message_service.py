from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException
from app.models.message import Message, MessageStatus
from app.models.user import User
from app.schemas.message import MessageSend
from app.encryption.aes import hash_message
from datetime import datetime
import uuid


def send_message(data: MessageSend, sender: User, db: Session) -> Message:
    receiver = db.query(User).filter(User.id == data.receiver_id, User.is_active == True).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Penerima tidak ditemukan")

    message = Message(
        sender_id=sender.id,
        receiver_id=data.receiver_id,
        encrypted_content=data.encrypted_content,
        iv=data.iv,
        message_type=data.message_type,
        message_hash=data.message_hash,
        file_url=data.file_url,
        file_name=data.file_name,
        file_size=data.file_size,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_conversation(user_id: uuid.UUID, other_user_id: uuid.UUID, db: Session, skip: int = 0, limit: int = 50):
    messages = db.query(Message).filter(
        and_(
            Message.is_deleted == False,
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == user_id),
            )
        )
    ).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()

    # Mark messages as read
    db.query(Message).filter(
        Message.sender_id == other_user_id,
        Message.receiver_id == user_id,
        Message.status != MessageStatus.READ
    ).update({"status": MessageStatus.READ})
    db.commit()
    return messages


def get_conversations_list(user_id: uuid.UUID, db: Session):
    """Get list of unique conversations with last message."""
    from sqlalchemy import func, text
    
    subquery = db.query(
        func.greatest(Message.sender_id, Message.receiver_id).label("user1"),
        func.least(Message.sender_id, Message.receiver_id).label("user2"),
        func.max(Message.created_at).label("last_message_time")
    ).filter(
        or_(Message.sender_id == user_id, Message.receiver_id == user_id),
        Message.is_deleted == False
    ).group_by(
        func.greatest(Message.sender_id, Message.receiver_id),
        func.least(Message.sender_id, Message.receiver_id)
    ).subquery()

    results = []
    rows = db.execute(
        subquery.select()
    ).fetchall() if False else db.query(subquery).all()

    for row in rows:
        other_id = row.user2 if str(row.user1) == str(user_id) else row.user1
        other_user = db.query(User).filter(User.id == other_id).first()
        last_msg = db.query(Message).filter(
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == other_id),
                and_(Message.sender_id == other_id, Message.receiver_id == user_id),
            ),
            Message.is_deleted == False
        ).order_by(Message.created_at.desc()).first()

        unread = db.query(Message).filter(
            Message.sender_id == other_id,
            Message.receiver_id == user_id,
            Message.status != MessageStatus.READ
        ).count()

        if other_user and last_msg:
            results.append({
                "user": other_user,
                "last_message": last_msg,
                "unread_count": unread
            })

    return results


def delete_message(message_id: uuid.UUID, user_id: uuid.UUID, db: Session):
    message = db.query(Message).filter(Message.id == message_id, Message.sender_id == user_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Pesan tidak ditemukan")
    message.is_deleted = True
    db.commit()
    return {"detail": "Pesan dihapus"}

def get_all_user_messages(user_id: uuid.UUID, db: Session):
    """Ambil semua pesan user untuk search global di frontend."""
    from sqlalchemy import or_
    return db.query(Message).filter(
        or_(Message.sender_id == user_id, Message.receiver_id == user_id),
        Message.is_deleted == False,
        Message.message_type == "text"
    ).order_by(Message.created_at.desc()).limit(500).all()