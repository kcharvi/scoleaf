from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, Response
from contextlib import asynccontextmanager
import os
import io
import fitz  # PyMuPDF
from pathlib import Path
import uuid
from typing import List, Optional
from datetime import datetime
import logging
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .api import upload, health, livekit, user

# Import chat-related services and models
from .services.ai_service import AIService
from .services.file_service import FileService
from .models.chat import ChatRequest, ChatResponse, ChatMessage, AnalysisResult
from .dependencies import get_file_service, get_ai_service

import httpx


# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 Scoleaf Backend Starting...")
    
    # Create upload directory if it doesn't exist
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(exist_ok=True)
    print(f"📁 Upload directory: {upload_dir.absolute()}")
    
    # Validate Google API key
    if not settings.google_api_key or settings.google_api_key == "your_google_api_key_here":
        print("⚠️  WARNING: Google API key not configured! Set GOOGLE_API_KEY environment variable.")
        print("   The AI service will not work without a valid API key.")
    else:
        print("✅ Google API key configured")
    
    print(f"🌐 CORS enabled for: {', '.join(settings.allowed_origins)}")
    print(f"🎯 Server will run on: {settings.host}:{settings.port}")
    print("✅ Backend startup complete!")
    
    yield
    
    # Shutdown
    print("🛑 Scoleaf Backend Shutting down...")


# Create FastAPI application
app = FastAPI(
    title="Scoleaf Backend",
    description="AI-powered PDF analysis backend using Google Gemini 2.5 Flash",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health.router)
app.include_router(upload.router)
app.include_router(livekit.router, prefix="/api")
app.include_router(user.router)

# --- Chat Endpoints Moved Directly Here ---

@app.post("/api/chat/text", response_model=ChatResponse, tags=["chat"])
async def chat_with_pdf(
    request: ChatRequest,
    ai_service: AIService = Depends(get_ai_service),
    file_service: FileService = Depends(get_file_service)
):
    print("\n=== DEBUG: Chat Request Details ===")
    print(f"Raw request data: {request}")
    print(f"Message: {request.message}")
    print(f"PDF ID: {request.pdf_id}")
    print(f"Session ID: {request.session_id}")
    print("================================\n")

    if not request.pdf_id:
        print("!!! ERROR: Missing PDF ID !!!")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PDF ID is required for chat")
    
    pdf_document = file_service.get_document(request.pdf_id)
    if not pdf_document:
        print(f"!!! ERROR: PDF document not found for ID: {request.pdf_id} !!!")
        print(f"Available documents: {list(file_service.documents.keys())}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF document not found")
    
    session_id = request.session_id or ai_service.create_session(request.pdf_id)
    
    try:
        print("\n=== Starting AI Analysis ===")
        analysis_result = await ai_service.analyze_query(query=request.message, pdf_document=pdf_document, session_id=session_id)
        print(f"Analysis completed successfully")
        
        response_message = ChatMessage(
            id=str(uuid.uuid4()),
            role="assistant",
            content=analysis_result.explanation,
            timestamp=datetime.now()
        )
        
        print("\n=== DEBUG: Sending AI Response ===")
        print(f"Analysis result: {analysis_result}")
        print(f"Response message: {response_message}")
        print("==============================\n")
        
        return ChatResponse(
            message=response_message,
            highlights=analysis_result.highlights,
            session_id=session_id
        )
    except Exception as e:
        print(f"\n!!! ERROR: AI Processing Failed !!!")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print(f"PDF ID: {request.pdf_id}")
        print(f"Session ID: {session_id}")
        print("===============================\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat request: {str(e)}"
        )

@app.post("/api/chat/session", response_model=dict, tags=["chat"])
async def create_chat_session(pdf_id: str):
    """
    DEBUG: Simplified session creation for testing.
    """
    print(f"--- DEBUG: create_chat_session called with pdf_id: {pdf_id} ---")
    # For now, just return a dummy session_id to let the frontend proceed.
    return {
        "session_id": f"debug-session-for-{pdf_id}", 
        "pdf_id": pdf_id, 
        "message": "Debug session created"
    }

@app.get("/api/chat/history/{session_id}", response_model=List[dict], tags=["chat"])
async def get_chat_history(
    session_id: str,
    ai_service: AIService = Depends(get_ai_service)
):
    history = ai_service.get_session_history(session_id)
    if not history:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found or empty")
    return history

@app.delete("/api/chat/session/{session_id}", tags=["chat"])
async def clear_chat_session(
    session_id: str,
    ai_service: AIService = Depends(get_ai_service)
):
    if session_id in ai_service.sessions:
        del ai_service.sessions[session_id]
        return {"message": "Chat session cleared successfully"}
    else:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

@app.post("/api/chat/analyze", response_model=AnalysisResult, tags=["chat"])
async def analyze_pdf_content(
    query: str,
    pdf_id: str,
    ai_service: AIService = Depends(get_ai_service),
    file_service: FileService = Depends(get_file_service)
):
    pdf_document = file_service.get_document(pdf_id)
    if not pdf_document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF document not found")
    try:
        analysis_result = await ai_service.analyze_query(query=query, pdf_document=pdf_document, session_id=None)
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error analyzing PDF content: {str(e)}")

@app.get("/api/download/{pdf_id}", tags=["download"])
async def download_highlighted_pdf(
    pdf_id: str,
    file_service: FileService = Depends(get_file_service),
    ai_service: AIService = Depends(get_ai_service)
):
    """Download PDF with highlights applied."""
    pdf_document = file_service.get_document(pdf_id)
    if not pdf_document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF document not found")
    
    try:
        # Collect all highlights for this PDF from active sessions
        all_highlights = ai_service.get_pdf_highlights(pdf_id)
        print(f"Found {len(all_highlights)} highlights for PDF {pdf_id}")
        
        # Open the original PDF
        pdf_path = pdf_document.file_path
        doc = fitz.open(pdf_path)
        
        # Define highlight colors for different categories
        highlight_colors = {
            "important": (1, 0.8, 0.8),    # Light red
            "general": (0.8, 1, 0.8),      # Light green  
            "thoughts": (0.8, 0.8, 1)      # Light blue
        }
        
        # Apply highlights to each page
        for highlight in all_highlights:
            try:
                page_num = highlight.position.pageNumber - 1  # Convert to 0-based indexing
                if 0 <= page_num < len(doc):
                    page = doc[page_num]
                    
                    # Get the category color
                    color = highlight_colors.get(highlight.category.value, highlight_colors["general"])
                    
                    # Apply highlights for each rectangle in the highlight
                    for rect_data in highlight.position.rects:
                        # Convert coordinates to PyMuPDF format
                        # Note: We need to convert back from frontend coordinates to PDF coordinates
                        page_height = page.rect.height
                        
                        x1 = rect_data["x1"]
                        y1 = page_height - rect_data["y2"]  # Convert Y coordinate
                        x2 = rect_data["x2"] 
                        y2 = page_height - rect_data["y1"]  # Convert Y coordinate
                        
                        bbox = fitz.Rect(x1, y1, x2, y2)
                        
                        # Add highlight annotation
                        highlight_annot = page.add_highlight_annot(bbox)
                        highlight_annot.set_colors(stroke=color)
                        highlight_annot.update()
                        
                        print(f"Applied highlight on page {page_num + 1} at {bbox}")
                        
            except Exception as e:
                print(f"Error applying highlight {highlight.id}: {e}")
                continue
        
        # Save the modified PDF to buffer
        output_buffer = io.BytesIO()
        doc.save(output_buffer)
        doc.close()
        output_buffer.seek(0)
        
        # Create a temporary file for download
        temp_file_path = Path(settings.upload_dir) / f"highlighted_{pdf_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        with open(temp_file_path, 'wb') as f:
            f.write(output_buffer.getvalue())
        
        # Return the file for download
        return FileResponse(
            path=temp_file_path,
            filename=f"highlighted_{pdf_document.filename}",
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error creating highlighted PDF: {str(e)}"
        )

# --- ArXiv Proxy Endpoint ---

@app.get("/api/arxiv-search", tags=["proxy"])
async def arxiv_search_proxy(query: str):
    """
    Proxy endpoint to search arXiv and avoid CORS issues on the frontend.
    Forwards the query to arXiv and returns the raw XML response.
    """
    arxiv_url = f"https://export.arxiv.org/api/query?search_query=all:{query}&max_results=20"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            arxiv_response = await client.get(arxiv_url)
            arxiv_response.raise_for_status()
            return Response(content=arxiv_response.text, media_type="application/xml")
    except Exception as e:
        logger.error(f"arXiv proxy error: {e}")
        raise HTTPException(status_code=502, detail=f"arXiv proxy error: {str(e)}")

# --- End of Moved Chat Endpoints ---

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Scoleaf Backend",
        "version": "1.0.0",
        "description": "AI-powered PDF analysis using Google Gemini 2.5 Flash",
        "status": "running",
        "endpoints": {
            "health": "/api/health",
            "upload": "/api/upload",
            "chat": "/api/chat",
            "docs": "/docs" if settings.debug else "disabled"
        },
        "features": [
            "PDF upload and processing",
            "AI-powered text analysis",
            "Intelligent highlighting",
            "Session-based chat",
            "Coordinate-based highlighting"
        ]
    }

# Exception handling
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"An unexpected error occurred: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred"},
    )

if __name__ == "__main__":
    import uvicorn
    
    # Run the application
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info"
    ) 