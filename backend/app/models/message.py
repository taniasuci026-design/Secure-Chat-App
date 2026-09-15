from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.database.connection import Base


class MessageStatus(str, enum.Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Pesan disimpan dalam bentuk terenkripsi (AES)
    encrypted_content = Column(Text, nullable=False)
    
    # IV (Initialization Vector) untuk dekripsi AES
    iv = Column(String(255), nullable=False)
    
    # Tipe pesan: text, file, image
    message_type = Column(String(20), default="text")
    
    # Untuk pesan file
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size = Column(String(50), nullable=True)
    
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT)
    is_deleted = Column(Boolean, default=False)
    
    # Hash SHA-256 untuk verifikasi integritas pesan
    message_hash = Column(String(64), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id])
