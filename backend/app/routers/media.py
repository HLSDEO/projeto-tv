from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List
import shutil
import os
import uuid
from datetime import datetime

from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/media", tags=["media"])

class MediaUpdate(BaseModel):
    duration: int
    active: bool
    order: int

@router.get("/")
def get_media():
    db = get_db()
    media_col = db.collection('media')
    # Use AQL to fetch sorted media
    cursor = db.aql.execute('FOR m IN media SORT m.order ASC RETURN m')
    return [doc for doc in cursor]

@router.post("/")
async def upload_media(
    file: UploadFile = File(...),
    duration: int = Form(10),
    username: str = Depends(get_current_user)
):
    db = get_db()
    media_col = db.collection('media')
    
    # Check max order
    cursor = db.aql.execute('FOR m IN media COLLECT AGGREGATE max_order = MAX(m.order) RETURN max_order')
    max_order = list(cursor)[0]
    next_order = (max_order or 0) + 1

    # Save file
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"/app/uploads/{unique_filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    media_type = "video" if file_extension.lower() in ['mp4', 'webm', 'ogg'] else "image"
    
    doc = {
        'filename': unique_filename,
        'original_name': file.filename,
        'type': media_type,
        'duration': duration,
        'active': True,
        'order': next_order,
        'uploaded_at': datetime.utcnow().isoformat(),
        'url': f"/uploads/{unique_filename}"
    }
    
    result = media_col.insert(doc)
    doc['_key'] = result['_key']
    return doc

@router.put("/{media_id}")
def update_media(media_id: str, data: MediaUpdate, username: str = Depends(get_current_user)):
    db = get_db()
    media_col = db.collection('media')
    
    if not media_col.has(media_id):
        raise HTTPException(status_code=404, detail="Media not found")
        
    update_doc = {
        '_key': media_id,
        'duration': data.duration,
        'active': data.active,
        'order': data.order
    }
    
    media_col.update(update_doc)
    return {"status": "success"}

@router.delete("/{media_id}")
def delete_media(media_id: str, username: str = Depends(get_current_user)):
    db = get_db()
    media_col = db.collection('media')
    
    if not media_col.has(media_id):
        raise HTTPException(status_code=404, detail="Media not found")
        
    doc = media_col.get(media_id)
    
    # Try removing the file
    file_path = f"/app/uploads/{doc['filename']}"
    if os.path.exists(file_path):
        os.remove(file_path)
        
    media_col.delete(media_id)
    return {"status": "success"}
