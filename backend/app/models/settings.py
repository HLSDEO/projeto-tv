from sqlalchemy import Column, Integer, String
from database import Base
from models.audit_log import AuditMixin

class Settings(Base, AuditMixin):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)

