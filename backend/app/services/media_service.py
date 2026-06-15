from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
import os
import shutil
import uuid
from fastapi import UploadFile
from repositories.media_repository import IMediaRepository
from models.media import Media

class IMediaService(ABC):
    @abstractmethod
    def get_all_media(self) -> List[Media]:
        pass

    @abstractmethod
    def upload_media(self, file: UploadFile, duration: int) -> Media:
        pass

    @abstractmethod
    def update_media(self, media_id: int, duration: int, active: bool, order: int, scheduled_start: Optional[datetime] = None) -> Media:
        pass

    @abstractmethod
    def delete_media(self, media_id: int) -> None:
        pass


class MediaService(IMediaService):
    def __init__(self, media_repo: IMediaRepository, upload_dir: str = "/app/uploads"):
        self.media_repo = media_repo
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def get_all_media(self) -> List[Media]:
        return self.media_repo.get_all_ordered()

    def upload_media(self, file: UploadFile, duration: int) -> Media:
        # Get next order rank
        last_media = self.media_repo.get_last_media()
        next_order = (last_media.order if last_media else 0) + 1

        # File naming & path
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(self.upload_dir, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        media_type = "video" if file_extension.lower() in ['mp4', 'webm', 'ogg'] else "image"

        media = Media(
            filename=unique_filename,
            original_name=file.filename,
            type=media_type,
            duration=duration,
            active=True,
            order=next_order,
            url=f"/uploads/{unique_filename}"
        )

        return self.media_repo.create(media)

    def update_media(self, media_id: int, duration: int, active: bool, order: int, scheduled_start: Optional[datetime] = None) -> Media:
        media = self.media_repo.get_by_id(media_id)
        if not media:
            raise KeyError(f"Media with ID {media_id} not found")

        media.duration = duration
        media.active = active
        media.order = order
        media.scheduled_start = scheduled_start

        self.media_repo.commit()
        self.media_repo.refresh(media)
        return media

    def delete_media(self, media_id: int) -> None:
        media = self.media_repo.get_by_id(media_id)
        if not media:
            raise KeyError(f"Media with ID {media_id} not found")

        # Delete physical file
        file_path = os.path.join(self.upload_dir, media.filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

        self.media_repo.delete(media)
