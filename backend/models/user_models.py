from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid


class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str
    remember_me: bool = False


class UserInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    full_name: Optional[str] = None
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserResponse(BaseModel):
    id: str
    username: str
    full_name: Optional[str] = None
    created_at: str


class TokenResponse(BaseModel):
    token: str
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    username: str


class ResetPasswordRequest(BaseModel):
    username: str
    reset_code: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# Per-user transcription history
class TranscriptionHistoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    file_name: str
    language: str
    transcription: str
    original_transcription: Optional[str] = None
    date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TranscriptionHistoryCreate(BaseModel):
    file_name: str
    language: str
    transcription: str
    original_transcription: Optional[str] = None
    date: str


class TranscriptionHistoryUpdate(BaseModel):
    transcription: Optional[str] = None
    original_transcription: Optional[str] = None
    date: Optional[str] = None
