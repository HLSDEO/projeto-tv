from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MediaUpdate(BaseModel):
    duration: int
    active: bool
    order: int
    scheduled_start: Optional[datetime] = None

class MediaResponse(BaseModel):
    id: int
    filename: str
    original_name: str
    type: str
    duration: int
    active: bool
    order: int
    uploaded_at: datetime
    scheduled_start: Optional[datetime] = None
    url: str

    class Config:
        from_attributes = True
