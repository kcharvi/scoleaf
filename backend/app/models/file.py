from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime


class PDFElement(BaseModel):
    """Represents an extracted element from PDF with coordinates"""
    type: str  # 'text', 'image', 'table'
    content: Any
    page_number: int
    bbox: Dict[str, float]  # bounding box coordinates
    font_info: Optional[Dict[str, Any]] = None


class PageDimensions(BaseModel):
    page_number: int
    width: float
    height: float


class PDFDocument(BaseModel):
    """Represents a parsed PDF document"""
    id: str
    filename: str
    file_path: str
    file_size: int
    page_count: int
    elements: List[PDFElement]
    page_dimensions: List[PageDimensions]
    full_text: str
    remote_url: Optional[str] = None
    upload_timestamp: datetime

    class Config:
        arbitrary_types_allowed = True


class FileUploadResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    page_count: int
    message: str
    supabase_url: Optional[str] = None
    upload_timestamp: datetime


class FileInfoResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    page_count: int
    upload_timestamp: datetime
    elements_count: int
    supabase_url: Optional[str] = None 