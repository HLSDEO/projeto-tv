from pydantic import BaseModel

class SettingsUpdate(BaseModel):
    news_enabled: bool
    weather_enabled: bool
    weather_city: str
    sync_interval: int
    logo_blur_enabled: bool
    logo_position: str
    clock_position: str
    news_position: str

