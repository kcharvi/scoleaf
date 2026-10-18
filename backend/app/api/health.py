from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from ..services.ai_service import AIService
from ..config import settings


router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/")
async def health_check():
    """
    Basic health check endpoint.
    
    Returns:
        Health status and timestamp
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "service": "Scoleaf Backend",
        "version": "1.0.0"
    }


@router.get("/detailed")
async def detailed_health_check():
    """
    Detailed health check with service status.
    
    Returns:
        Detailed health information
    """
    status_info = {
        "status": "healthy",
        "timestamp": datetime.now(),
        "service": "Scoleaf Backend",
        "version": "1.0.0",
        "components": {
            "api": "healthy",
            "file_storage": "healthy",
            "ai_service": "unknown"
        },
        "configuration": {
            "upload_dir": settings.upload_dir,
            "max_file_size_mb": settings.max_file_size_mb,
            "debug_mode": settings.debug
        }
    }
    
    # Test AI service connectivity
    try:
        ai_service = AIService()
        # Basic connectivity test - just check if client initializes
        if ai_service.client:
            status_info["components"]["ai_service"] = "healthy"
        else:
            status_info["components"]["ai_service"] = "error"
            status_info["status"] = "degraded"
    except Exception as e:
        status_info["components"]["ai_service"] = f"error: {str(e)}"
        status_info["status"] = "degraded"
    
    # Check file storage directory
    try:
        import os
        if os.path.exists(settings.upload_dir):
            status_info["components"]["file_storage"] = "healthy"
        else:
            status_info["components"]["file_storage"] = "warning: upload directory missing"
            status_info["status"] = "degraded"
    except Exception as e:
        status_info["components"]["file_storage"] = f"error: {str(e)}"
        status_info["status"] = "degraded"
    
    return status_info


@router.get("/ai-status")
async def ai_service_status():
    """
    Check AI service specific status.
    
    Returns:
        AI service connectivity and model information
    """
    try:
        ai_service = AIService()
        
        return {
            "status": "connected",
            "model": ai_service.model,
            "timestamp": datetime.now(),
            "active_sessions": len(ai_service.sessions),
            "service_type": "Google Gemini 2.5 Flash"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"AI service unavailable: {str(e)}"
        ) 