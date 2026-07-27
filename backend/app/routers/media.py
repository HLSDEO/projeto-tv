from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import List
from datetime import datetime
import logging

from auth import get_current_user
from schemas.media import MediaUpdate, MediaResponse
from services.media_service import IMediaService
from core.dependencies import get_media_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/media", tags=["media"])

@router.get("", response_model=List[MediaResponse])
def get_media(media_service: IMediaService = Depends(get_media_service)):
    logger.info("🎬 Listing all media items requested")
    return media_service.get_all_media()

@router.post("", response_model=MediaResponse)
async def upload_media(
    file: UploadFile = File(...),
    duration: int = Form(10),
    username: str = Depends(get_current_user),
    media_service: IMediaService = Depends(get_media_service)
):
    logger.info("📤 Uploading new media file: %s (duration=%d)", file.filename, duration)
    try:
        media = media_service.upload_media(file, duration)
        logger.info("✅ Media uploaded successfully: ID=%d, filename=%s, original_name=%s", media.id, media.filename, media.original_name)
        return media
    except ValueError as e:
        logger.warning("⚠️ Media file size limit exceeded for %s: %s", file.filename, e)
        raise HTTPException(status_code=413, detail=str(e))
    except Exception as e:
        logger.error("❌ Failed to upload media %s: %s", file.filename, e)
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload da mídia: {e}")

@router.put("/reorder")
def reorder_media(
    ids: List[int],
    username: str = Depends(get_current_user),
    media_service: IMediaService = Depends(get_media_service)
):
    logger.info("🔄 Reordering media items. ID sequence: %s", ids)
    try:
        media_service.reorder_media(ids)
        logger.info("✅ Media items reordered successfully")
        return {"status": "success", "message": "Media reordered successfully"}
    except KeyError as e:
        logger.error("❌ Media not found during reorder: %s", e)
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("❌ Failed to reorder media items: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{media_id}", response_model=MediaResponse)
def update_media(
    media_id: int,
    data: MediaUpdate,
    username: str = Depends(get_current_user),
    media_service: IMediaService = Depends(get_media_service)
):
    logger.info("✏️ Updating media ID %d: duration=%d, active=%s, order=%d, scheduled_start=%s", media_id, data.duration, data.active, data.order, data.scheduled_start)
    try:
        media = media_service.update_media(media_id, data.duration, data.active, data.order, data.scheduled_start)
        logger.info("✅ Media ID %d updated successfully", media_id)
        return media
    except KeyError as e:
        logger.warning("⚠️ Media ID %d not found for update: %s", media_id, e)
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("❌ Failed to update media ID %d: %s", media_id, e)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{media_id}")
def delete_media(
    media_id: int,
    username: str = Depends(get_current_user),
    media_service: IMediaService = Depends(get_media_service)
):
    logger.info("🗑️ Deleting media ID %d requested by %s", media_id, username)
    try:
        media_service.delete_media(media_id)
        logger.info("✅ Media ID %d deleted successfully", media_id)
        return {"status": "success", "message": "Media deleted"}
    except KeyError as e:
        logger.warning("⚠️ Media ID %d not found for deletion: %s", media_id, e)
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("❌ Failed to delete media ID %d: %s", media_id, e)
        raise HTTPException(status_code=500, detail=str(e))
