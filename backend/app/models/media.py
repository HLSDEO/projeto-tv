from sqlalchemy import Column, Integer, String, Boolean, DateTime, Index
from datetime import datetime
from database import Base
from models.audit_log import AuditMixin

class Media(Base, AuditMixin):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False)  # "image" or "video"
    duration = Column(Integer, default=10)  # seconds
    active = Column(Boolean, default=True, index=True)
    order = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
<<<<<<< HEAD
    url = Column(String(500), nullable=False)

    __table_args__ = (
        Index("ix_media_active_order", "active", "order"),
    )

=======
    scheduled_start = Column(DateTime, nullable=True)  # If set, media is only displayed from this date/time onward
    url = Column(String, nullable=False)
>>>>>>> 5f706791e8ec615419b552a5084fec8f261c6452
