from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.websocket.manager import manager
from app.core.security import decode_access_token
from app.models.user import User
from app.models.message import Message, MessageStatus
from datetime import datetime
import json
import uuid

router = APIRouter()


async def get_user_from_token(token: str, db: Session):
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        return db.query(User).filter(User.id == uuid.UUID(user_id), User.is_active == True).first()
    except Exception:
        return None


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, token: str = Query(...)):
    db = SessionLocal()
    
    try:
        # Autentikasi via token
        user = await get_user_from_token(token, db)
        if not user or str(user.id) != user_id:
            await websocket.close(code=4001, reason="Unauthorized")
            return

        await manager.connect(websocket, user_id)

        # Beritahu semua user bahwa user ini online
        await manager.broadcast({
            "type": "user_online",
            "user_id": user_id,
            "username": user.username
        }, exclude_user_id=user_id)

        # Update last_seen
        user.last_seen = datetime.utcnow()
        db.commit()

        try:
            while True:
                data = await websocket.receive_json()
                msg_type = data.get("type")

                if msg_type == "message":
                    # Simpan pesan ke database
                    message = Message(
                        sender_id=uuid.UUID(user_id),
                        receiver_id=uuid.UUID(data["receiver_id"]),
                        encrypted_content=data["encrypted_content"],
                        iv=data["iv"],
                        message_type=data.get("message_type", "text"),
                        message_hash=data.get("message_hash"),
                        file_url=data.get("file_url"),
                        file_name=data.get("file_name"),
                        file_size=data.get("file_size"),
                    )
                    db.add(message)
                    db.commit()
                    db.refresh(message)

                    # Kirim ke penerima jika online
                    payload = {
                        "type": "message",
                        "id": str(message.id),
                        "sender_id": user_id,
                        "sender_username": user.username,
                        "receiver_id": data["receiver_id"],
                        "encrypted_content": data["encrypted_content"],
                        "iv": data["iv"],
                        "message_type": data.get("message_type", "text"),
                        "message_hash": data.get("message_hash"),
                        "file_url": data.get("file_url"),
                        "file_name": data.get("file_name"),
                        "file_size": data.get("file_size"),
                        "created_at": message.created_at.isoformat(),
                    }
                    await manager.send_to_user(data["receiver_id"], payload)

                    # Konfirmasi ke pengirim
                    await manager.send_to_user(user_id, {
                        "type": "message_sent",
                        "id": str(message.id),
                        "receiver_id": data["receiver_id"],
                        "created_at": message.created_at.isoformat(),
                    })

                elif msg_type == "typing":
                    await manager.send_to_user(data.get("receiver_id", ""), {
                        "type": "typing",
                        "sender_id": user_id,
                        "username": user.username,
                        "is_typing": data.get("is_typing", False)
                    })

                elif msg_type == "read":
                    # Mark messages as read
                    db.query(Message).filter(
                        Message.sender_id == uuid.UUID(data.get("sender_id", "")),
                        Message.receiver_id == uuid.UUID(user_id),
                        Message.status != MessageStatus.READ
                    ).update({"status": MessageStatus.READ})
                    db.commit()
                    await manager.send_to_user(data.get("sender_id", ""), {
                        "type": "messages_read",
                        "reader_id": user_id
                    })

                elif msg_type == "ping":
                    await manager.send_to_user(user_id, {"type": "pong"})
                    user.last_seen = datetime.utcnow()
                    db.commit()

        except WebSocketDisconnect:
            pass

    finally:
        manager.disconnect(user_id)
        await manager.broadcast({
            "type": "user_offline",
            "user_id": user_id
        }, exclude_user_id=user_id)
        db.close()
