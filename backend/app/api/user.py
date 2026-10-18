from fastapi import APIRouter, Depends, HTTPException, status
from ..services.supabase_service import SupabaseService
from ..dependencies import get_supabase_service, get_current_user

router = APIRouter(prefix="/api/user", tags=["user"])

@router.get("/profile")
async def get_user_profile(
    current_user: dict = Depends(get_current_user),
    supabase_service: SupabaseService = Depends(get_supabase_service)
):
    """
    Fetch the current user's profile from Supabase.
    """
    user_id = current_user.id
    profile = supabase_service.get_user_profile(user_id)
    
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
        
    return profile 