from abc import ABC, abstractmethod
import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException
from repositories.settings_repository import ISettingsRepository
from core.websocket import manager

class ISettingsService(ABC):
    @abstractmethod
    def get_all_settings(self) -> dict:
        pass

    @abstractmethod
    def update_settings(self, news_enabled: bool, weather_enabled: bool, weather_city: str, sync_interval: int, logo_blur_enabled: bool, logo_position: str, clock_position: str, news_position: str) -> None:
        pass

    @abstractmethod
    def upload_logo(self, file: UploadFile) -> str:
        pass

    @abstractmethod
    def delete_logo(self) -> None:
        pass

    @abstractmethod
    async def trigger_sync(self) -> None:
        pass


class SettingsService(ISettingsService):
    def __init__(self, settings_repo: ISettingsRepository, upload_dir: str = "/app/uploads"):
        self.settings_repo = settings_repo
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def get_all_settings(self) -> dict:
        news_setting = self.settings_repo.get_by_key("news_enabled")
        logo_setting = self.settings_repo.get_by_key("logo_url")
        weather_enabled_setting = self.settings_repo.get_by_key("weather_enabled")
        weather_city_setting = self.settings_repo.get_by_key("weather_city")
        sync_interval_setting = self.settings_repo.get_by_key("sync_interval")
        logo_blur_setting = self.settings_repo.get_by_key("logo_blur_enabled")
        logo_position_setting = self.settings_repo.get_by_key("logo_position")
        clock_position_setting = self.settings_repo.get_by_key("clock_position")
        news_position_setting = self.settings_repo.get_by_key("news_position")

        return {
            "news_enabled": news_setting.value == "true" if news_setting else True,
            "logo_url": logo_setting.value if logo_setting and logo_setting.value else None,
            "weather_enabled": weather_enabled_setting.value == "true" if weather_enabled_setting else False,
            "weather_city": weather_city_setting.value if weather_city_setting else "Brasília",
            "sync_interval": int(sync_interval_setting.value) if sync_interval_setting else 15,
            "logo_blur_enabled": logo_blur_setting.value == "true" if logo_blur_setting else True,
            "logo_position": logo_position_setting.value if logo_position_setting else "top-left",
            "clock_position": clock_position_setting.value if clock_position_setting else "top-right",
            "news_position": news_position_setting.value if news_position_setting else "bottom"
        }

    def update_settings(self, news_enabled: bool, weather_enabled: bool, weather_city: str, sync_interval: int, logo_blur_enabled: bool, logo_position: str, clock_position: str, news_position: str) -> None:
        self.settings_repo.set_key_value("news_enabled", "true" if news_enabled else "false")
        self.settings_repo.set_key_value("weather_enabled", "true" if weather_enabled else "false")
        self.settings_repo.set_key_value("weather_city", weather_city.strip())
        self.settings_repo.set_key_value("sync_interval", str(max(1, sync_interval)))
        self.settings_repo.set_key_value("logo_blur_enabled", "true" if logo_blur_enabled else "false")
        self.settings_repo.set_key_value("logo_position", logo_position.strip())
        self.settings_repo.set_key_value("clock_position", clock_position.strip())
        self.settings_repo.set_key_value("news_position", news_position.strip())
        self.settings_repo.commit()

    def upload_logo(self, file: UploadFile) -> str:
        file_extension = file.filename.split(".")[-1].lower()
        if file_extension not in ["jpg", "jpeg", "png", "gif", "svg", "webp"]:
            raise ValueError("Formato de arquivo inválido. Apenas imagens são permitidas.")

        unique_filename = f"logo_{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(self.upload_dir, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        logo_url = f"/uploads/{unique_filename}"

        # Get existing setting to delete old file
        setting = self.settings_repo.get_by_key("logo_url")
        if setting and setting.value:
            old_file_name = setting.value.split("/")[-1]
            old_file_path = os.path.join(self.upload_dir, old_file_name)
            if os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                except Exception:
                    pass

        self.settings_repo.set_key_value("logo_url", logo_url)
        self.settings_repo.commit()
        return logo_url

    def delete_logo(self) -> None:
        setting = self.settings_repo.get_by_key("logo_url")
        if setting and setting.value:
            old_file_name = setting.value.split("/")[-1]
            old_file_path = os.path.join(self.upload_dir, old_file_name)
            if os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                except Exception:
                    pass
            setting.value = ""
            self.settings_repo.commit()

    async def trigger_sync(self) -> None:
        await manager.broadcast({"type": "sync"})
