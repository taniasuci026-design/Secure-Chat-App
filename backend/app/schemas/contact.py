from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.contact import ContactStatus
from app.schemas.user import UserResponse
import uuid


class ContactAdd(BaseModel):
    contact_username: str


class ContactResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    contact_id: uuid.UUID
    status: ContactStatus
    created_at: datetime
    contact: Optional[UserResponse] = None

    class Config:
        from_attributes = True
