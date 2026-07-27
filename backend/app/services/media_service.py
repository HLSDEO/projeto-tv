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

    @abstractmethod
    def reorder_media(self, ids: List[int]) -> None:
        pass


MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_IMAGE_SIZE = 15 * 1024 * 1024   # 15 MB


def _process_image(file_path: str, upload_dir: str, unique_filename: str):
    """Compress image and create thumbnail using Pillow"""
    try:
        from PIL import Image
        with Image.open(file_path) as img:
            if img.mode in ('RGBA', 'P'):
                img_rgb = img.convert('RGB')
            else:
                img_rgb = img.copy()

            # 1. Generate lightweight thumbnail (max 400px width/height)
            thumb_filename = f"thumb_{unique_filename}.webp"
            thumb_path = os.path.join(upload_dir, thumb_filename)
            thumb_img = img_rgb.copy()
            thumb_img.thumbnail((400, 400))
            thumb_img.save(thumb_path, "WEBP", quality=80)

            # 2. Generate compressed web version (max 1920x1080)
            compressed_filename = f"compressed_{unique_filename}.webp"
            compressed_path = os.path.join(upload_dir, compressed_filename)
            comp_img = img_rgb.copy()
            comp_img.thumbnail((1920, 1080))
            comp_img.save(compressed_path, "WEBP", quality=85)

            return f"/uploads/{thumb_filename}", f"/uploads/{compressed_filename}"
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Image processing warning: %s", e)
        return None, None


def _generate_video_thumbnail(file_path: str, upload_dir: str, unique_filename: str):
    """Generate poster thumbnail for video using FFmpeg if available or Pillow fallback"""
    thumb_filename = f"thumb_{unique_filename}.jpg"
    thumb_path = os.path.join(upload_dir, thumb_filename)

    import subprocess
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", file_path, "-ss", "00:00:00.500", "-vframes", "1", "-vf", "scale=400:-1", thumb_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True
        )
        if os.path.exists(thumb_path):
            return f"/uploads/{thumb_filename}"
    except Exception:
        pass

    try:
        from PIL import Image, ImageDraw
        img = Image.new('RGB', (400, 225), color=(24, 24, 27))
        draw = ImageDraw.Draw(img)
        draw.ellipse([170, 82, 230, 142], fill=(59, 130, 246))
        draw.polygon([(193, 100), (193, 124), (214, 112)], fill=(255, 255, 255))
        img.save(thumb_path, "JPEG", quality=85)
        return f"/uploads/{thumb_filename}"
    except Exception:
        return None


class MediaService(IMediaService):
    def __init__(self, media_repo: IMediaRepository, upload_dir: str = "/app/uploads"):
        self.media_repo = media_repo
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def get_all_media(self) -> List[Media]:
        return self.media_repo.get_all_ordered()

    def upload_media(self, file: UploadFile, duration: int) -> Media:
        # Check media type
        file_extension = file.filename.split(".")[-1].lower() if "." in file.filename else ""
        media_type = "video" if file_extension in ['mp4', 'webm', 'ogg', 'mov', 'mkv'] else "image"

        # Check file size limit
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)

        max_allowed = MAX_VIDEO_SIZE if media_type == "video" else MAX_IMAGE_SIZE
        if file_size > max_allowed:
            max_mb = 100 if media_type == "video" else 15
            raise ValueError(f"O arquivo excede o limite máximo permitido de {max_mb} MB.")

        # Get next order rank
        last_media = self.media_repo.get_last_media()
        next_order = (last_media.order if last_media else 0) + 1

        # Save physical file
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(self.upload_dir, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process thumbnail and compressed versions
        thumbnail_url = None
        compressed_url = None

        if media_type == "image":
            thumbnail_url, compressed_url = _process_image(file_path, self.upload_dir, unique_filename)
        elif media_type == "video":
            thumbnail_url = _generate_video_thumbnail(file_path, self.upload_dir, unique_filename)

        media = Media(
            filename=unique_filename,
            original_name=file.filename,
            type=media_type,
            duration=duration,
            active=True,
            order=next_order,
            url=f"/uploads/{unique_filename}",
            thumbnail_url=thumbnail_url,
            compressed_url=compressed_url
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

    def reorder_media(self, ids: List[int]) -> None:
        for idx, media_id in enumerate(ids):
            media = self.media_repo.get_by_id(media_id)
            if not media:
                raise KeyError(f"Media with ID {media_id} not found")
            media.order = idx + 1
        self.media_repo.commit()

    def delete_media(self, media_id: int) -> None:
        media = self.media_repo.get_by_id(media_id)
        if not media:
            raise KeyError(f"Media with ID {media_id} not found")

        # Delete physical files (original, thumbnail, compressed)
        for rel_url in [media.url, media.thumbnail_url, media.compressed_url]:
            if rel_url:
                filename = rel_url.split("/")[-1]
                file_path = os.path.join(self.upload_dir, filename)
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception:
                        pass

        self.media_repo.delete(media)

