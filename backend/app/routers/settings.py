from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from auth import get_current_user
from schemas.settings import SettingsUpdate
from services.settings_service import ISettingsService
from services.external_service import IExternalService
from core.dependencies import get_settings_service, get_external_service

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
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar configurações: {e}")

@router.post("/sync")
async def trigger_sync(
    username: str = Depends(get_current_user),
    settings_service: ISettingsService = Depends(get_settings_service)
):
    try:
        await settings_service.trigger_sync()
        return {"status": "success"}
    except Exception as e:
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
    try:
        logo_url = settings_service.upload_logo(file)
        return {"logo_url": logo_url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload da logomarca: {e}")

@router.delete("/logo")
def delete_logo(
    username: str = Depends(get_current_user),
    settings_service: ISettingsService = Depends(get_settings_service)
):
    try:
        settings_service.delete_logo()
        return {"status": "success", "logo_url": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar logomarca: {e}")
