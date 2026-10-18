import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    # Google AI
    google_api_key: str = ""
    
    # Application
    debug: bool = True
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 50
    
    # CORS
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://pitutor.pi4wear.com",
        "https://scoleaf.com"
    ]
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # LiveKit
    livekit_api_key: str = "devkey"
    livekit_api_secret: str = "secret"
    livekit_url: str = "ws://localhost:7880"
    
    # Supabase
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    debug_user_email: Optional[str] = None
    
    # Supabase Storage
    supabase_storage_bucket: str = "pdfs"
    
    @validator('google_api_key')
    def validate_google_api_key(cls, v):
        if not v:
            print("⚠️  Google API key not set - AI features will be limited")
        return v
    
    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


# Global settings instance
settings = Settings() 