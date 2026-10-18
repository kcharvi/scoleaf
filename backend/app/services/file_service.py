import os
import uuid
import shutil
import pickle
from typing import Optional, Dict, Any
from pathlib import Path
from datetime import datetime
from fastapi import UploadFile, HTTPException

from ..config import settings
from ..models.file import PDFDocument, FileUploadResponse, FileInfoResponse
from .pdf_processor import PDFProcessor


class FileService:
    """Service for managing PDF file uploads and storage."""
    
    def __init__(self):
        self.upload_dir = Path(settings.upload_dir)
        self.cache_dir = self.upload_dir / "cache"
        self.upload_dir.mkdir(exist_ok=True)
        self.cache_dir.mkdir(exist_ok=True)
        self.pdf_processor = PDFProcessor()
        
        # In-memory storage for PDF documents (in production, use database)
        self.documents: Dict[str, PDFDocument] = {}
        self._load_from_cache()
    
    def _load_from_cache(self):
        """Load all cached documents into memory on startup."""
        for cache_file in self.cache_dir.glob("*.pkl"):
            file_id = cache_file.stem
            try:
                with open(cache_file, "rb") as f:
                    self.documents[file_id] = pickle.load(f)
            except Exception as e:
                print(f"Error loading cached document {file_id}: {e}")

    def _save_to_cache(self, document: PDFDocument):
        """Save a document to the file cache."""
        cache_path = self.cache_dir / f"{document.id}.pkl"
        try:
            with open(cache_path, "wb") as f:
                pickle.dump(document, f)
        except Exception as e:
            print(f"Error saving document {document.id} to cache: {e}")
            
    def _remove_from_cache(self, file_id: str):
        """Remove a document from the file cache."""
        cache_path = self.cache_dir / f"{file_id}.pkl"
        if cache_path.exists():
            cache_path.unlink()

    async def upload_pdf(self, file: UploadFile) -> FileUploadResponse:
        """
        Upload and process a PDF file.
        
        Args:
            file: Uploaded PDF file
            
        Returns:
            FileUploadResponse with file metadata
        """
        # Validate file
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        if file.size and file.size > settings.max_file_size_bytes:
            raise HTTPException(
                status_code=413, 
                detail=f"File size exceeds maximum allowed size of {settings.max_file_size_mb}MB"
            )
        
        # Generate unique file ID and path
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix
        stored_filename = f"{file_id}{file_extension}"
        file_path = self.upload_dir / stored_filename
        
        try:
            # Save uploaded file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Process PDF and extract content
            pdf_document = await self.pdf_processor.process_pdf(
                str(file_path), 
                file.filename
            )
            
            # Update document ID to match file ID
            pdf_document.id = file_id
            pdf_document.file_path = str(file_path)
            
            # Store in memory and cache
            self.documents[file_id] = pdf_document
            self._save_to_cache(pdf_document)
            
            return FileUploadResponse(
                id=file_id,
                filename=file.filename,
                file_size=len(content),
                page_count=pdf_document.page_count,
                message="PDF uploaded and processed successfully",
                upload_timestamp=pdf_document.upload_timestamp
            )
            
        except Exception as e:
            # Clean up file if processing failed
            if file_path.exists():
                file_path.unlink()
            
            raise HTTPException(
                status_code=500, 
                detail=f"Error processing PDF: {str(e)}"
            )
    
    def get_document(self, file_id: str) -> Optional[PDFDocument]:
        """
        Retrieve a processed PDF document by ID.
        Checks memory first, then file cache.
        
        Args:
            file_id: ID of the document
            
        Returns:
            PDFDocument or None if not found
        """
        # 1. Check in-memory cache
        document = self.documents.get(file_id)
        if document:
            return document
            
        # 2. Check file cache
        cache_path = self.cache_dir / f"{file_id}.pkl"
        if cache_path.exists():
            try:
                with open(cache_path, "rb") as f:
                    document = pickle.load(f)
                    self.documents[file_id] = document # Add to in-memory cache
                    return document
            except Exception as e:
                print(f"Error loading document {file_id} from cache: {e}")

        return None
    
    def get_file_info(self, file_id: str) -> Optional[FileInfoResponse]:
        """
        Get file information by ID.
        
        Args:
            file_id: ID of the file
            
        Returns:
            FileInfoResponse or None if not found
        """
        document = self.get_document(file_id) # Use get_document to ensure it's loaded
        if not document:
            return None
        
        return FileInfoResponse(
            id=document.id,
            filename=document.filename,
            file_size=document.file_size,
            page_count=document.page_count,
            upload_timestamp=document.upload_timestamp,
            elements_count=len(document.elements),
            supabase_url=document.remote_url if hasattr(document, 'remote_url') else None
        )
    
    def delete_file(self, file_id: str) -> bool:
        """
        Delete a file and its processed data.
        
        Args:
            file_id: ID of the file to delete
            
        Returns:
            True if deleted successfully, False if not found
        """
        document = self.get_document(file_id)
        if not document:
            return False
        
        try:
            # Remove file from disk
            file_path = Path(document.file_path)
            if file_path.exists():
                file_path.unlink()
            
            # Remove from memory and cache
            if file_id in self.documents:
                del self.documents[file_id]
            self._remove_from_cache(file_id)
            
            return True
            
        except Exception as e:
            print(f"Error deleting file {file_id}: {e}")
            return False
    
    def list_files(self) -> list[FileInfoResponse]:
        """
        List all uploaded files.
        
        Returns:
            List of FileInfoResponse objects
        """
        # Ensure all cached files are loaded for the list
        self._load_from_cache()
        return [
            FileInfoResponse(
                id=doc.id,
                filename=doc.filename,
                file_size=doc.file_size,
                page_count=doc.page_count,
                upload_timestamp=doc.upload_timestamp,
                elements_count=len(doc.elements),
                supabase_url=doc.remote_url if hasattr(doc, 'remote_url') else None
            )
            for doc in self.documents.values()
        ]
    
    def cleanup_old_files(self, max_age_hours: int = 24):
        """
        Clean up files older than specified age.
        
        Args:
            max_age_hours: Maximum age in hours before cleanup
        """
        current_time = datetime.now()
        # We need to check the files on disk for this, not just in-memory
        all_files = {doc.id for doc in self.documents.values()}
        for pkl in self.cache_dir.glob("*.pkl"):
            all_files.add(pkl.stem)

        files_to_delete = []
        for file_id in all_files:
            doc = self.get_document(file_id)
            if doc:
                 age_hours = (current_time - doc.upload_timestamp).total_seconds() / 3600
                 if age_hours > max_age_hours:
                    files_to_delete.append(file_id)
        
        for file_id in files_to_delete:
            self.delete_file(file_id)
        
        print(f"Cleaned up {len(files_to_delete)} old files") 