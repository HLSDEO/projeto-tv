from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import uuid
from datetime import datetime

from app.database import get_db, Media
from app.auth import get_current_user

router = APIRouter(prefix="/api/media", tags=["media"])

class MediaUpdate(BaseModel):
    duration: int
    active: bool
    order: int

class MediaResponse(BaseModel):
    id: int
    filename: str
    original_name: str
    type: str
    duration: int
    active: bool
    order: int
    uploaded_at: datetime
    url: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[MediaResponse])
def get_media(db: Session = Depends(get_db)):
    media_list = db.query(Media).order_by(Media.order.asc()).all()
    return media_list

@router.post("/", response_model=MediaResponse)
async def upload_media(
    file: UploadFile = File(...),
    duration: int = Form(10),
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get next order
    last_media = db.query(Media).order_by(Media.order.desc()).first()
    next_order = (last_media.order if last_media else 0) + 1

    # Save file
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"/app/uploads/{unique_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    media_type = "video" if file_extension.lower() in ['mp4', 'webm', 'ogg'] else "image"

    media = Media(
        filename=unique_filename,
        original_name=file.filename,
        type=media_type,
        duration=duration,
        active=True,
        order=next_order,
        uploaded_at=datetime.utcnow(),
        url=f"/uploads/{unique_filename}"
    )

    db.add(media)
    db.commit()
    db.refresh(media)
    return media

@router.put("/{media_id}", response_model=MediaResponse)
def update_media(
    media_id: int,
    data: MediaUpdate,
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    media.duration = data.duration
    media.active = data.active
    media.order = data.order
    db.commit()
    db.refresh(media)
    return media

@router.delete("/{media_id}")
def delete_media(
    media_id: int,
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    # Delete file
    file_path = f"/app/uploads/{media.filename}"
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(media)
    db.commit()
    return {"status": "success", "message": "Media deleted"}
