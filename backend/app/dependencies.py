"""
Shared dependency injection for FastAPI services.
"""

from .services.file_service import FileService
from .services.ai_service import AIService
from .services.supabase_service import SupabaseService
from .config import settings
from typing import Optional
from fastapi import Depends, HTTPException, status, Header

# Shared service instances (singletons)
_file_service_instance = None
_ai_service_instance = None
_supabase_service_instance = None

def get_file_service() -> FileService:
    """Get the shared FileService instance."""
    global _file_service_instance
    if _file_service_instance is None:
        _file_service_instance = FileService()
    return _file_service_instance

def get_ai_service() -> AIService:
    """Get the shared AIService instance."""
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = AIService()
    return _ai_service_instance

def get_supabase_service() -> SupabaseService:
    """Get the shared SupabaseService instance."""
    global _supabase_service_instance
    if _supabase_service_instance is None:
        if settings.supabase_url and settings.supabase_key:
            _supabase_service_instance = SupabaseService(
                url=settings.supabase_url,
                key=settings.supabase_key
            )
        else:
            raise ValueError("Supabase URL and Key must be set in the environment.")
    return _supabase_service_instance

async def get_current_user(
    authorization: Optional[str] = Header(None),
    supabase_service: SupabaseService = Depends(get_supabase_service)
):
    if authorization is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")
    
    token = authorization.split("Bearer ")[-1]
    try:
        user = supabase_service.get_user_by_token(token)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") 