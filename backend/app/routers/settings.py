from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])

class SettingsUpdate(BaseModel):
    news_enabled: bool

@router.get("/")
def get_settings():
    db = get_db()
    settings_col = db.collection('settings')
    doc = settings_col.get('global')
    return doc or {"news_enabled": True}

@router.put("/")
def update_settings(data: SettingsUpdate, username: str = Depends(get_current_user)):
    db = get_db()
    settings_col = db.collection('settings')
    
    update_doc = {
        '_key': 'global',
        'news_enabled': data.news_enabled
    }
    
    if settings_col.has('global'):
        settings_col.update(update_doc)
    else:
        settings_col.insert(update_doc)
        
    return {"status": "success"}
