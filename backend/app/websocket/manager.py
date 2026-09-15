from fastapi import WebSocket
from typing import Dict, Set
import json
import uuid


class ConnectionManager:
    """
    Mengelola semua koneksi WebSocket aktif.
    
    Setiap user yang terhubung disimpan dalam dictionary:
    active_connections[user_id] = WebSocket
    """

    def __init__(self):
        # Dict: user_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"✅ User {user_id} terhubung. Total: {len(self.active_connections)}")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"❌ User {user_id} terputus. Total: {len(self.active_connections)}")

    async def send_to_user(self, user_id: str, message: dict):
        """Kirim pesan ke user tertentu jika sedang online."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error kirim ke {user_id}: {e}")
                self.disconnect(user_id)

    async def broadcast(self, message: dict, exclude_user_id: str = None):
        """Kirim pesan ke semua user yang terhubung."""
        disconnected = []
        for user_id, websocket in self.active_connections.items():
            if user_id == exclude_user_id:
                continue
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(user_id)
        for uid in disconnected:
            self.disconnect(uid)

    def get_online_users(self) -> list:
        return list(self.active_connections.keys())

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections


# Singleton instance
manager = ConnectionManager()
