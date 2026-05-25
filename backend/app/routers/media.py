from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import List
from datetime import datetime

from auth import get_current_user
from schemas.media import MediaUpdate, MediaResponse
from services.media_service import IMediaService
from core.dependencies import get_media_service

router = APIRouter(prefix="/api/media", tags=["media"])

@router.get("/", response_model=List[MediaResponse])
def get_media(media_service: IMediaService = Depends(get_media_service)):
    return media_service.get_all_media()

@router.post("", response_model=MediaResponse)
async def upload_media(
    file: UploadFile = File(...),
    duration: int = Form(10),
    username: str = Depends(get_current_user),
    media_service: IMediaService = Depends(get_media_service)
):
    try:
        return media_service.upload_media(file, duration)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload da mídia: {e}")

@router.put("/{media_id}", response_model=MediaResponse)
def update_media(
    media_id: int,
    data: MediaUpdate,
    username: str = Depends(get_current_user),
    media_service: IMediaService = Depends(get_media_service)
):
    try:
        return media_service.update_media(media_id, data.duration, data.active, data.order)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{media_id}")
def delete_media(
    media_id: int,
    username: str = Depends(get_current_user),
    media_service: IMediaService = Depends(get_media_service)
):
    try:
        media_service.delete_media(media_id)
        return {"status": "success", "message": "Media deleted"}
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
