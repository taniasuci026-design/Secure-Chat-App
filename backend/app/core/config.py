from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    APP_NAME: str = "SecureChatApp"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    SECRET_KEY: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str

    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    MAX_FILE_SIZE_MB: int = 10
    UPLOAD_DIR: str = "../uploads"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
