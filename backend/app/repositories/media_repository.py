from abc import ABC, abstractmethod
from typing import List, Optional
from sqlalchemy.orm import Session
from models.media import Media

class IMediaRepository(ABC):
    @abstractmethod
    def get_by_id(self, media_id: int) -> Optional[Media]:
        pass

    @abstractmethod
    def get_all_ordered(self) -> List[Media]:
        pass

    @abstractmethod
    def create(self, media: Media) -> Media:
        pass

    @abstractmethod
    def delete(self, media: Media) -> None:
        pass

    @abstractmethod
    def get_last_media(self) -> Optional[Media]:
        pass

    @abstractmethod
    def commit(self) -> None:
        pass

    @abstractmethod
    def refresh(self, media: Media) -> None:
        pass


class SQLAlchemyMediaRepository(IMediaRepository):
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, media_id: int) -> Optional[Media]:
        return self.db.query(Media).filter(Media.id == media_id).first()

    def get_all_ordered(self) -> List[Media]:
        return self.db.query(Media).order_by(Media.order.asc()).all()

    def create(self, media: Media) -> Media:
        self.db.add(media)
        self.db.commit()
        self.db.refresh(media)
        return media

    def delete(self, media: Media) -> None:
        self.db.delete(media)
        self.db.commit()

    def get_last_media(self) -> Optional[Media]:
        return self.db.query(Media).order_by(Media.order.desc()).first()

    def commit(self) -> None:
        self.db.commit()

    def refresh(self, media: Media) -> None:
        self.db.refresh(media)
