from fastapi import APIRouter, HTTPException, Depends, status
from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
import jwt
import os
import uuid
import random
import string

from models.user_models import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest
)
from middleware.auth_middleware import get_current_user

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.environ.get("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Will be set from server.py
db = None


def set_db(database):
    global db
    db = database


def create_token(user_id: str, username: str, remember_me: bool = False):
    expire = timedelta(days=30) if remember_me else timedelta(hours=24)
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"username": user.username.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    if len(user.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    user_doc = {
        "id": user_id,
        "username": user.username.lower(),
        "full_name": user.full_name or user.username,
        "hashed_password": pwd_context.hash(user.password),
        "created_at": now.isoformat(),
    }

    await db.users.insert_one(user_doc)

    token = create_token(user_id, user.username.lower(), remember_me=True)

    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user_id,
            username=user.username.lower(),
            full_name=user_doc["full_name"],
            created_at=now.isoformat(),
        )
    )


@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"username": user.username.lower()}, {"_id": 0})
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not pwd_context.verify(user.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    token = create_token(db_user["id"], db_user["username"], user.remember_me)

    return TokenResponse(
        token=token,
        user=UserResponse(
            id=db_user["id"],
            username=db_user["username"],
            full_name=db_user.get("full_name", db_user["username"]),
            created_at=db_user["created_at"],
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    db_user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=db_user["id"],
        username=db_user["username"],
        full_name=db_user.get("full_name", db_user["username"]),
        created_at=db_user["created_at"],
    )


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    db_user = await db.users.find_one({"username": request.username.lower()}, {"_id": 0})
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Username not found"
        )

    reset_code = ''.join(random.choices(string.digits, k=6))
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)

    await db.password_resets.delete_many({"username": request.username.lower()})
    await db.password_resets.insert_one({
        "username": request.username.lower(),
        "reset_code": reset_code,
        "expires_at": expires.isoformat(),
    })

    return {
        "message": "Reset code generated",
        "reset_code": reset_code,
        "note": "In production, this code would be sent via email. Code expires in 15 minutes."
    }


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    reset_entry = await db.password_resets.find_one(
        {"username": request.username.lower()}, {"_id": 0}
    )

    if not reset_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No reset request found. Please request a new code."
        )

    expires_at = datetime.fromisoformat(reset_entry["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        await db.password_resets.delete_many({"username": request.username.lower()})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired. Please request a new one."
        )

    if reset_entry["reset_code"] != request.reset_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset code"
        )

    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )

    hashed = pwd_context.hash(request.new_password)
    await db.users.update_one(
        {"username": request.username.lower()},
        {"$set": {"hashed_password": hashed}}
    )
    await db.password_resets.delete_many({"username": request.username.lower()})

    return {"message": "Password reset successfully. You can now log in."}


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    db_user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not pwd_context.verify(request.current_password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )

    hashed = pwd_context.hash(request.new_password)
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"hashed_password": hashed}}
    )

    return {"message": "Password changed successfully"}
