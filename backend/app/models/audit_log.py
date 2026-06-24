from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class AuditMixin:
    """Mixin to inject timestamp columns for creation and update auditing"""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class AuditLog(Base):
    """Model to store log of critical user actions in the system"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    user_id = Column(Integer, nullable=True)  # ID of user if authenticated, null for system
    username = Column(String(50), nullable=True)  # Keep username for historical logs
    action = Column(String(100), nullable=False)  # e.g., "LOGIN_SUCCESS", "MEDIA_UPLOAD"
    entity_type = Column(String(50), nullable=False)  # e.g., "User", "Media", "Settings"
    entity_id = Column(Integer, nullable=True)  # ID of entity affected
    ip_address = Column(String(45), nullable=True)  # Client IP address (optional)
    details = Column(String, nullable=True)  # Description of the action
