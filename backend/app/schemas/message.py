from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.message import MessageStatus
import uuid


class MessageSend(BaseModel):
    receiver_id: uuid.UUID
    encrypted_content: str
    iv: str
    message_type: str = "text"
    message_hash: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[str] = None


class MessageResponse(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    receiver_id: uuid.UUID
    encrypted_content: str
    iv: str
    message_type: str
    status: MessageStatus
    message_hash: Optional[str]
    file_url: Optional[str]
    file_name: Optional[str]
    file_size: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MessageStatusUpdate(BaseModel):
    status: MessageStatus
