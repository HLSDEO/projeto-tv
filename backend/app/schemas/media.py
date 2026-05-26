from pydantic import BaseModel
from datetime import datetime

class MediaUpdate(BaseModel):
    duration: int
    active: bool
    order: int

class MediaResponse(BaseModel):
    id: int
    filename: str
    original_name: str
    type: str
    duration: int
    active: bool
    order: int
    uploaded_at: datetime
    url: str

    class Config:
        from_attributes = True
