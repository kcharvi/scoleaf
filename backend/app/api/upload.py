from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Header
from PyPDF2 import PdfReader
from io import BytesIO
from ..services.file_service import FileService
from ..services.supabase_service import SupabaseService
from ..models.file import FileUploadResponse, FileInfoResponse
from ..dependencies import get_file_service, get_supabase_service, get_current_user
from ..config import settings


router = APIRouter(prefix="/api/upload", tags=["file-upload"])

@router.post("/", response_model=FileUploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    file_service: FileService = Depends(get_file_service),
    supabase_service: SupabaseService = Depends(get_supabase_service),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a PDF file for processing.
    
    Args:
        file: PDF file to upload
        
    Returns:
        FileUploadResponse with file metadata and processing status
    """
    user_id = current_user.id
    user_email = current_user.email
    
    # Check for debug user
    if settings.debug_user_email and user_email == settings.debug_user_email:
        pass  # Bypass upload limits for debug user
    else:
        profile = supabase_service.get_user_profile(user_id)
        if not profile:
            # This might be the first upload, or profile creation failed.
            # For now, we'll deny, but a better implementation might create a profile here.
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User profile not found.")
        
        upload_count = profile.get('upload_count', 0)
        if upload_count >= 3:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You have reached your upload limit.")

    # Read file content into memory
    file_content = await file.read()
    
    # Check PDF page count
    try:
        pdf_reader = PdfReader(BytesIO(file_content))
        if len(pdf_reader.pages) > 20:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="PDFs larger than 20 pages are not allowed."
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted PDF file."
        )

    # Increment upload count for non-debug users before processing
    if not (settings.debug_user_email and user_email == settings.debug_user_email):
        supabase_service.increment_upload_count(user_id)

    # Reset file pointer before passing to service
    await file.seek(0)
    
    # First, let FileService handle local save & processing
    upload_response = await file_service.upload_pdf(file)

    # Upload the raw bytes to Supabase Storage
    try:
        supabase_url = supabase_service.upload_pdf(upload_response.id, file_content, bucket=settings.supabase_storage_bucket)
    except Exception as e:
        # Log but do not fail the entire request; client can still use local processing
        print(f"Supabase upload failed for {upload_response.id}: {e}")
        supabase_url = None

    # Persist remote_url on the cached PDFDocument so other services can fetch it
    if supabase_url:
        pdf_doc = file_service.get_document(upload_response.id)
        if pdf_doc:
            pdf_doc.remote_url = supabase_url
            # Update cache
            file_service._save_to_cache(pdf_doc)

    # Return extended response with supabase_url without duplicating field
    return upload_response.model_copy(update={"supabase_url": supabase_url})


@router.get("/files", response_model=List[FileInfoResponse])
async def list_files(
    file_service: FileService = Depends(get_file_service)
):
    """
    List all uploaded files.
    
    Returns:
        List of uploaded file information
    """
    return file_service.list_files()


@router.get("/files/{file_id}", response_model=FileInfoResponse)
async def get_file_info(
    file_id: str,
    file_service: FileService = Depends(get_file_service)
):
    """
    Get information about a specific file.
    
    Args:
        file_id: ID of the file
        
    Returns:
        File information
    """
    file_info = file_service.get_file_info(file_id)
    if not file_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return file_info


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    file_service: FileService = Depends(get_file_service)
):
    """
    Delete a file and its processed data.
    
    Args:
        file_id: ID of the file to delete
        
    Returns:
        Success message
    """
    success = file_service.delete_file(file_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return {"message": "File deleted successfully"} 