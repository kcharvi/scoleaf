from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class HighlightCategory(str, Enum):
    GENERAL = "general"
    IMPORTANT = "important"
    THOUGHTS = "thoughts"


class Position(BaseModel):
    boundingRect: Dict[str, float]
    rects: List[Dict[str, float]]
    pageNumber: int


class Content(BaseModel):
    text: Optional[str] = None
    image: Optional[str] = None


class HighlightResponse(BaseModel):
    id: str
    position: Position
    content: Content
    comment: Optional[str] = None
    category: HighlightCategory
    emoji: Optional[str] = None
    timestamp: Optional[datetime] = None
    tags: Optional[List[str]] = None


class ChatMessage(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    pdf_id: Optional[str] = None


class ChatResponse(BaseModel):
    message: ChatMessage
    highlights: List[HighlightResponse] = []
    session_id: str


class AnalysisResult(BaseModel):
    explanation: str
    highlights: List[HighlightResponse] = []
    confidence: Optional[float] = None 