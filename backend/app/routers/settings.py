from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import logging

from auth import get_current_user
from schemas.settings import SettingsUpdate
from services.settings_service import ISettingsService
from services.external_service import IExternalService
from core.dependencies import get_settings_service, get_external_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("")
def get_settings(settings_service: ISettingsService = Depends(get_settings_service)):
    return settings_service.get_all_settings()

@router.put("")
def update_settings(
    data: SettingsUpdate,
    username: str = Depends(get_current_user),
    settings_service: ISettingsService = Depends(get_settings_service)
):
    logger.info("⚙️ Settings update requested by %s: news_enabled=%s, weather_enabled=%s, weather_city=%s, sync_interval=%d, logo_blur=%s, logo_pos=%s, clock_pos=%s, news_pos=%s", 
                username, data.news_enabled, data.weather_enabled, data.weather_city, data.sync_interval, data.logo_blur_enabled, data.logo_position, data.clock_position, data.news_position)
    try:
        settings_service.update_settings(
            news_enabled=data.news_enabled,
            weather_enabled=data.weather_enabled,
            weather_city=data.weather_city,
            sync_interval=data.sync_interval,
            logo_blur_enabled=data.logo_blur_enabled,
            logo_position=data.logo_position,
            clock_position=data.clock_position,
            news_position=data.news_position
        )
        logger.info("✅ System settings updated successfully")
        return {"status": "success"}
    except Exception as e:
        logger.error("❌ Failed to update settings: %s", e)
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar configurações: {e}")

@router.post("/sync")
async def trigger_sync(
    username: str = Depends(get_current_user),
    settings_service: ISettingsService = Depends(get_settings_service)
):
    logger.info("📡 TV sync signal triggered manually by user: %s", username)
    try:
        await settings_service.trigger_sync()
        logger.info("✅ TV sync signal broadcasted successfully to all connected displays")
        return {"status": "success"}
    except Exception as e:
        logger.error("❌ Failed to trigger manual sync: %s", e)
        raise HTTPException(status_code=500, detail=f"Erro ao disparar sincronização: {e}")

@router.get("/weather")
async def get_weather(
    settings_service: ISettingsService = Depends(get_settings_service),
    external_service: IExternalService = Depends(get_external_service)
):
    try:
        settings = settings_service.get_all_settings()
        return await external_service.get_weather(
            city=settings.get("weather_city"),
            enabled=settings.get("weather_enabled")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter previsão do tempo: {e}")

@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    username: str = Depends(get_current_user),
    settings_service: ISettingsService = Depends(get_settings_service)
):
    logger.info("🎨 Uploading new custom logo: %s (requested by user: %s)", file.filename, username)
    try:
        logo_url = settings_service.upload_logo(file)
        logger.info("✅ Custom logo uploaded successfully. URL: %s", logo_url)
        return {"logo_url": logo_url}
    except ValueError as e:
        logger.warning("⚠️ Invalid file format uploaded for custom logo: %s", e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("❌ Failed to upload custom logo: %s", e)
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload da logomarca: {e}")

@router.delete("/logo")
def delete_logo(
    username: str = Depends(get_current_user),
    settings_service: ISettingsService = Depends(get_settings_service)
):
    logger.info("🗑️ Custom logo deletion requested by user: %s", username)
    try:
        settings_service.delete_logo()
        logger.info("✅ Custom logo deleted successfully")
        return {"status": "success", "logo_url": None}
    except Exception as e:
        logger.error("❌ Failed to delete custom logo: %s", e)
        raise HTTPException(status_code=500, detail=f"Erro ao deletar logomarca: {e}")
