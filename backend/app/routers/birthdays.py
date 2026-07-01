from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
import logging
from auth import get_current_user
from services.birthday_service import IBirthdayService
from core.dependencies import get_birthday_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/birthdays", tags=["birthdays"])

@router.get("")
def get_birthdays(
    month: Optional[int] = None,
    start_month: Optional[int] = None,
    end_month: Optional[int] = None,
    username: str = Depends(get_current_user),
    birthday_service: IBirthdayService = Depends(get_birthday_service)
):
    """
    Retrieve birthdays for a given month or period.
    Requires JWT authentication.
    """
    # Validation
    if month is None and (start_month is None or end_month is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Informe o mês ou o período de tempo (mês inicial e final)."
        )

    if month is not None and (month < 1 or month > 12):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O mês selecionado deve ser um número entre 1 e 12."
        )

    if start_month is not None and (start_month < 1 or start_month > 12):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O mês inicial deve ser um número entre 1 e 12."
        )

    if end_month is not None and (end_month < 1 or end_month > 12):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O mês final deve ser um número entre 1 e 12."
        )

    try:
        birthdays = birthday_service.get_birthdays(
            month=month,
            start_month=start_month,
            end_month=end_month
        )
        return birthdays
    except Exception as e:
        logger.error(f"Error fetching birthdays in router: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar aniversariantes: {str(e)}"
        )
