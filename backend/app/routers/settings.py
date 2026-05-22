from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import shutil
import uuid
import httpx

from app.database import get_db, Settings
from app.auth import get_current_user
from app.websocket_manager import manager

router = APIRouter(prefix="/api/settings", tags=["settings"])

class SettingsUpdate(BaseModel):
    news_enabled: bool
    weather_enabled: bool
    weather_city: str
    sync_interval: int

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    news_setting = db.query(Settings).filter(Settings.key == "news_enabled").first()
    logo_setting = db.query(Settings).filter(Settings.key == "logo_url").first()
    weather_enabled_setting = db.query(Settings).filter(Settings.key == "weather_enabled").first()
    weather_city_setting = db.query(Settings).filter(Settings.key == "weather_city").first()
    sync_interval_setting = db.query(Settings).filter(Settings.key == "sync_interval").first()
    
    return {
        "news_enabled": news_setting.value == "true" if news_setting else True,
        "logo_url": logo_setting.value if logo_setting and logo_setting.value else None,
        "weather_enabled": weather_enabled_setting.value == "true" if weather_enabled_setting else False,
        "weather_city": weather_city_setting.value if weather_city_setting else "Brasília",
        "sync_interval": int(sync_interval_setting.value) if sync_interval_setting else 15
    }

@router.put("")
def update_settings(
    data: SettingsUpdate,
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # news_enabled
    news_setting = db.query(Settings).filter(Settings.key == "news_enabled").first()
    if news_setting:
        news_setting.value = "true" if data.news_enabled else "false"
    else:
        db.add(Settings(key="news_enabled", value="true" if data.news_enabled else "false"))

    # weather_enabled
    weather_enabled_setting = db.query(Settings).filter(Settings.key == "weather_enabled").first()
    if weather_enabled_setting:
        weather_enabled_setting.value = "true" if data.weather_enabled else "false"
    else:
        db.add(Settings(key="weather_enabled", value="true" if data.weather_enabled else "false"))

    # weather_city
    weather_city_setting = db.query(Settings).filter(Settings.key == "weather_city").first()
    if weather_city_setting:
        weather_city_setting.value = data.weather_city.strip()
    else:
        db.add(Settings(key="weather_city", value=data.weather_city.strip()))

    # sync_interval
    sync_interval_setting = db.query(Settings).filter(Settings.key == "sync_interval").first()
    val = str(max(1, data.sync_interval))
    if sync_interval_setting:
        sync_interval_setting.value = val
    else:
        db.add(Settings(key="sync_interval", value=val))

    db.commit()
    return {"status": "success"}

@router.post("/sync")
async def trigger_sync(
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    await manager.broadcast({"type": "sync"})
    return {"status": "success"}

@router.get("/weather")
async def get_weather(db: Session = Depends(get_db)):
    enabled_setting = db.query(Settings).filter(Settings.key == "weather_enabled").first()
    weather_enabled = enabled_setting.value == "true" if enabled_setting else False
    
    if not weather_enabled:
        return {"enabled": False, "weather": ""}
        
    city_setting = db.query(Settings).filter(Settings.key == "weather_city").first()
    city = city_setting.value if city_setting and city_setting.value else "Brasília"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://wttr.in/{city}?lang=pt&format=%c+%t+%C", timeout=3.0)
            if response.status_code == 200:
                text = response.text.strip()
                if "Unknown location" in text or "Sorry" in text or len(text) > 50:
                    return {"enabled": True, "weather": f"📍 {city}: clima indisponível"}
                return {"enabled": True, "weather": f"📍 {city}: {text}"}
    except Exception as e:
        pass
    
    return {"enabled": True, "weather": f"📍 {city}: clima indisponível"}


@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify file extension is an image
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in ["jpg", "jpeg", "png", "gif", "svg", "webp"]:
        raise HTTPException(status_code=400, detail="Formato de arquivo inválido. Apenas imagens são permitidas.")

    # Create uploads directory if it doesn't exist
    os.makedirs("/app/uploads", exist_ok=True)

    # Save file
    unique_filename = f"logo_{uuid.uuid4()}.{file_extension}"
    file_path = f"/app/uploads/{unique_filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    logo_url = f"/uploads/{unique_filename}"

    # Save to settings
    setting = db.query(Settings).filter(Settings.key == "logo_url").first()
    if setting:
        # Delete old logo file if it exists
        if setting.value:
            old_file_name = setting.value.split("/")[-1]
            old_file_path = f"/app/uploads/{old_file_name}"
            if os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                except Exception:
                    pass
        setting.value = logo_url
    else:
        new_setting = Settings(key="logo_url", value=logo_url)
        db.add(new_setting)
    
    db.commit()
    return {"logo_url": logo_url}

@router.delete("/logo")
def delete_logo(
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    setting = db.query(Settings).filter(Settings.key == "logo_url").first()
    if setting and setting.value:
        old_file_name = setting.value.split("/")[-1]
        old_file_path = f"/app/uploads/{old_file_name}"
        if os.path.exists(old_file_path):
            try:
                os.remove(old_file_path)
            except Exception:
                pass
        setting.value = ""
        db.commit()
    return {"status": "success", "logo_url": None}
