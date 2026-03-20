from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

# Messenger Contacts Models
class MessengerContact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"  # For future multi-user support
    display_name: str
    messenger_username: Optional[str] = None
    facebook_profile_url: Optional[str] = None
    mobile_number: Optional[str] = None
    is_favorite: bool = False
    preferred_share_format: str = "plain_text"  # plain_text, txt, pdf, secure_link
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MessengerContactCreate(BaseModel):
    display_name: str
    messenger_username: Optional[str] = None
    facebook_profile_url: Optional[str] = None
    mobile_number: Optional[str] = None
    is_favorite: bool = False
    preferred_share_format: str = "plain_text"

class MessengerContactUpdate(BaseModel):
    display_name: Optional[str] = None
    messenger_username: Optional[str] = None
    facebook_profile_url: Optional[str] = None
    mobile_number: Optional[str] = None
    is_favorite: Optional[bool] = None
    preferred_share_format: Optional[str] = None

# Shared Transcriptions Models
class SharedTranscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transcript_id: str
    shared_by: str = "default_user"
    recipient_name: str
    recipient_contact_id: Optional[str] = None
    share_format: str  # plain_text, txt, pdf, secure_link
    share_method: str  # messenger, copy, download
    content_options: dict = {}  # {include_original, include_translation, include_soap}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "completed"  # completed, failed, pending

class SharedTranscriptionCreate(BaseModel):
    transcript_id: str
    recipient_name: str
    recipient_contact_id: Optional[str] = None
    share_format: str
    share_method: str
    content_options: dict = {}
    status: str = "completed"
