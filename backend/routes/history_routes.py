from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
import uuid

from models.user_models import (
    TranscriptionHistoryItem, TranscriptionHistoryCreate, TranscriptionHistoryUpdate
)
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])

db = None


def set_db(database):
    global db
    db = database


@router.get("/", response_model=List[TranscriptionHistoryItem])
async def get_history(current_user: dict = Depends(get_current_user)):
    items = await db.transcription_history.find(
        {"user_id": current_user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)

    for item in items:
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])

    return items


@router.post("/", response_model=TranscriptionHistoryItem)
async def create_history_item(
    item: TranscriptionHistoryCreate,
    current_user: dict = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    history_item = TranscriptionHistoryItem(
        id=str(uuid.uuid4()),
        user_id=current_user["user_id"],
        file_name=item.file_name,
        language=item.language,
        transcription=item.transcription,
        original_transcription=item.original_transcription,
        date=item.date,
        created_at=now,
    )

    doc = history_item.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()

    await db.transcription_history.insert_one(doc)

    return history_item


@router.put("/{item_id}", response_model=TranscriptionHistoryItem)
async def update_history_item(
    item_id: str,
    update: TranscriptionHistoryUpdate,
    current_user: dict = Depends(get_current_user)
):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.transcription_history.find_one_and_update(
        {"id": item_id, "user_id": current_user["user_id"]},
        {"$set": update_data},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=404, detail="History item not found")

    result.pop("_id", None)
    if isinstance(result.get("created_at"), str):
        result["created_at"] = datetime.fromisoformat(result["created_at"])

    return TranscriptionHistoryItem(**result)


@router.delete("/{item_id}")
async def delete_history_item(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    result = await db.transcription_history.delete_one(
        {"id": item_id, "user_id": current_user["user_id"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="History item not found")

    return {"message": "History item deleted"}


@router.delete("/")
async def clear_history(current_user: dict = Depends(get_current_user)):
    await db.transcription_history.delete_many(
        {"user_id": current_user["user_id"]}
    )
    return {"message": "History cleared"}
