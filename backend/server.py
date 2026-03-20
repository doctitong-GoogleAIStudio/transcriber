from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from models.sharing_models import (
    MessengerContact, MessengerContactCreate, MessengerContactUpdate,
    SharedTranscription, SharedTranscriptionCreate
)

from services.gemini_service import gemini_service


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Transcription API Models
class DetectLanguageRequest(BaseModel):
    audio_base64: str
    mime_type: str

class DetectLanguageResponse(BaseModel):
    language: str

class TranscribeRequest(BaseModel):
    audio_base64: str
    mime_type: str
    language: str

class TranscribeResponse(BaseModel):
    transcription: str

class TranslateRequest(BaseModel):
    text: str
    source_language: str

class TranslateResponse(BaseModel):
    translated_text: str

# Transcription endpoints
@api_router.post("/detect-language", response_model=DetectLanguageResponse)
async def detect_language(request: DetectLanguageRequest):
    try:
        language = await gemini_service.detect_language(
            audio_base64=request.audio_base64,
            mime_type=request.mime_type
        )
        return DetectLanguageResponse(language=language)
    except Exception as e:
        logger.error(f"Language detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(request: TranscribeRequest):
    try:
        transcription = await gemini_service.transcribe_audio(
            audio_base64=request.audio_base64,
            mime_type=request.mime_type,
            language=request.language
        )
        return TranscribeResponse(transcription=transcription)
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    try:
        translated_text = await gemini_service.translate_text(
            text=request.text,
            source_language=request.source_language
        )
        return TranslateResponse(translated_text=translated_text)
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# MESSENGER CONTACTS ENDPOINTS
# ============================================================================

@api_router.get("/messenger-contacts", response_model=List[MessengerContact])
async def get_messenger_contacts(user_id: str = "default_user", favorites_only: bool = False):
    """Get all messenger contacts, optionally filtered by favorites"""
    try:
        query = {"user_id": user_id}
        if favorites_only:
            query["is_favorite"] = True
        
        contacts = await db.messenger_contacts.find(query, {"_id": 0}).sort("is_favorite", -1).to_list(1000)
        
        # Convert ISO string timestamps back to datetime objects
        for contact in contacts:
            if isinstance(contact.get('created_at'), str):
                contact['created_at'] = datetime.fromisoformat(contact['created_at'])
        
        return contacts
    except Exception as e:
        logger.error(f"Error fetching messenger contacts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/messenger-contacts", response_model=MessengerContact)
async def create_messenger_contact(contact: MessengerContactCreate, user_id: str = "default_user"):
    """Create a new messenger contact"""
    try:
        contact_dict = contact.model_dump()
        contact_dict["user_id"] = user_id
        contact_obj = MessengerContact(**contact_dict)
        
        # Convert to dict and serialize datetime to ISO string for MongoDB
        doc = contact_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.messenger_contacts.insert_one(doc)
        return contact_obj
    except Exception as e:
        logger.error(f"Error creating messenger contact: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/messenger-contacts/{contact_id}", response_model=MessengerContact)
async def update_messenger_contact(contact_id: str, contact_update: MessengerContactUpdate):
    """Update a messenger contact"""
    try:
        update_data = {k: v for k, v in contact_update.model_dump().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        result = await db.messenger_contacts.find_one_and_update(
            {"id": contact_id},
            {"$set": update_data},
            return_document=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        # Remove MongoDB _id field
        result.pop('_id', None)
        
        # Convert ISO string timestamp back to datetime
        if isinstance(result.get('created_at'), str):
            result['created_at'] = datetime.fromisoformat(result['created_at'])
        
        return MessengerContact(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating messenger contact: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/messenger-contacts/{contact_id}")
async def delete_messenger_contact(contact_id: str):
    """Delete a messenger contact"""
    try:
        result = await db.messenger_contacts.delete_one({"id": contact_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        return {"message": "Contact deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting messenger contact: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SHARED TRANSCRIPTIONS ENDPOINTS
# ============================================================================

@api_router.get("/shared-transcriptions", response_model=List[SharedTranscription])
async def get_shared_transcriptions(user_id: str = "default_user", limit: int = 100):
    """Get sharing history"""
    try:
        query = {"shared_by": user_id}
        shares = await db.shared_transcriptions.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Convert ISO string timestamps back to datetime objects
        for share in shares:
            if isinstance(share.get('created_at'), str):
                share['created_at'] = datetime.fromisoformat(share['created_at'])
        
        return shares
    except Exception as e:
        logger.error(f"Error fetching shared transcriptions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/shared-transcriptions", response_model=SharedTranscription)
async def log_shared_transcription(share: SharedTranscriptionCreate, user_id: str = "default_user"):
    """Log a shared transcription"""
    try:
        share_dict = share.model_dump()
        share_dict["shared_by"] = user_id
        share_obj = SharedTranscription(**share_dict)
        
        # Convert to dict and serialize datetime to ISO string for MongoDB
        doc = share_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.shared_transcriptions.insert_one(doc)
        return share_obj
    except Exception as e:
        logger.error(f"Error logging shared transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()