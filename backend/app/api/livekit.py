import os
import uuid
import json
import datetime
from fastapi import APIRouter
from livekit import api
from pydantic import BaseModel
from ..dependencies import get_file_service

router = APIRouter()

livekit_api_key = os.environ.get("LIVEKIT_API_KEY", "devkey")
livekit_api_secret = os.environ.get("LIVEKIT_API_SECRET", "secret")
livekit_url = os.environ.get("LIVEKIT_URL", "ws://localhost:7880")

class TokenRequest(BaseModel):
    pdf_id: str | None = None

class TokenResponse(BaseModel):
    token: str
    url: str

@router.post("/livekit/token", response_model=TokenResponse)
async def get_livekit_token(request: TokenRequest):
    room_name = str(uuid.uuid4())
    participant_identity = "pdf_explainer_user"
    
    # Try to get remote URL from cached document
    file_service = get_file_service()
    pdf_url = None
    if request.pdf_id:
        doc = file_service.get_document(request.pdf_id)
        if doc and hasattr(doc, "remote_url"):
            pdf_url = doc.remote_url

    metadata = {
        "pdf_id": request.pdf_id,
        "pdf_url": pdf_url
    }

    token = api.AccessToken(livekit_api_key, livekit_api_secret) \
        .with_ttl(datetime.timedelta(minutes=5)) \
        .with_identity(participant_identity) \
        .with_name("PDF Explainer User") \
        .with_metadata(json.dumps(metadata)) \
        .with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
        )).to_jwt()


    return TokenResponse(
        token=token,
        url=livekit_url
    ) 