from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db

from repositories.user_repository import SQLAlchemyUserRepository, IUserRepository
from repositories.media_repository import SQLAlchemyMediaRepository, IMediaRepository
from repositories.settings_repository import SQLAlchemySettingsRepository, ISettingsRepository

from services.user_service import UserService, IUserService
from services.media_service import MediaService, IMediaService
from services.settings_service import SettingsService, ISettingsService
from services.external_service import ExternalService, IExternalService
from repositories.birthday_repository import APEXBirthdayRepository, IBirthdayRepository
from services.birthday_service import BirthdayService, IBirthdayService

def get_user_service(db: Session = Depends(get_db)) -> IUserService:
    repo = SQLAlchemyUserRepository(db)
    return UserService(repo)

import os

def get_media_service(db: Session = Depends(get_db)) -> IMediaService:
    repo = SQLAlchemyMediaRepository(db)
    upload_dir = os.getenv("UPLOAD_DIR", "uploads")
    return MediaService(repo, upload_dir=upload_dir)

def get_settings_service(db: Session = Depends(get_db)) -> ISettingsService:
    repo = SQLAlchemySettingsRepository(db)
    upload_dir = os.getenv("UPLOAD_DIR", "uploads")
    return SettingsService(repo, upload_dir=upload_dir)


def get_external_service() -> IExternalService:
    return ExternalService()

def get_birthday_service() -> IBirthdayService:
    repo = APEXBirthdayRepository()
    return BirthdayService(repo)

