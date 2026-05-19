from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db, Settings
from app.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])

class SettingsUpdate(BaseModel):
    news_enabled: bool

@router.get("/")
def get_settings(db: Session = Depends(get_db)):
    setting = db.query(Settings).filter(Settings.key == "news_enabled").first()
    if setting:
        return {"news_enabled": setting.value == "true"}
    return {"news_enabled": True}

@router.put("/")
def update_settings(
    data: SettingsUpdate,
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    setting = db.query(Settings).filter(Settings.key == "news_enabled").first()
    if setting:
        setting.value = "true" if data.news_enabled else "false"
        db.commit()
    else:
        new_setting = Settings(key="news_enabled", value="true" if data.news_enabled else "false")
        db.add(new_setting)
        db.commit()

    return {"status": "success"}
