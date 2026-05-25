from pydantic import BaseModel

class SettingsUpdate(BaseModel):
    news_enabled: bool
    weather_enabled: bool
    weather_city: str
    sync_interval: int
