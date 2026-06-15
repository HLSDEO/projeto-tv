from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from database import Base

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "image" or "video"
    duration = Column(Integer, default=10)  # seconds
    active = Column(Boolean, default=True)
    order = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    scheduled_start = Column(DateTime, nullable=True)  # If set, media is only displayed from this date/time onward
    url = Column(String, nullable=False)
