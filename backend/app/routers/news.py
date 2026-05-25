from fastapi import APIRouter, Depends
from services.external_service import IExternalService
from core.dependencies import get_external_service

router = APIRouter(prefix="/api/news", tags=["news"])

@router.get("/")
async def get_news(external_service: IExternalService = Depends(get_external_service)):
    return await external_service.get_news()
