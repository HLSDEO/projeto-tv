from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import logging

from auth import get_current_user
from schemas.user import UserCreate
from services.user_service import IUserService
from core.dependencies import get_user_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/users")
def list_users(
    username: str = Depends(get_current_user),
    user_service: IUserService = Depends(get_user_service)
):
    """List all users (admin only)"""
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view users"
        )

    try:
        users = user_service.list_users()
        return {"users": [{"username": u.username} for u in users]}
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(status_code=500, detail="Error listing users")

@router.post("/users")
def create_user(
    user: UserCreate,
    username: str = Depends(get_current_user),
    user_service: IUserService = Depends(get_user_service)
):
    """Create a new user (admin only)"""
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can create users"
        )

    try:
        user_service.create_user(user.username, user.password)
        logger.info(f"User '{user.username}' created by admin")
        return {
            "status": "success",
            "message": f"User '{user.username}' created successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Error creating user")

@router.put("/users/{user_id}/password")
def reset_password(
    user_id: str,
    new_password: str,
    username: str = Depends(get_current_user),
    user_service: IUserService = Depends(get_user_service)
):
    """Reset user password (admin only or own password)"""
    if username != 'admin' and username != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot reset other user's password"
        )

    try:
        user_service.reset_password(user_id, new_password)
        logger.info(f"Password reset for user '{user_id}'")
        return {
            "status": "success",
            "message": f"Password for user '{user_id}' reset successfully"
        }
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail="Error resetting password")

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    username: str = Depends(get_current_user),
    user_service: IUserService = Depends(get_user_service)
):
    """Delete a user (admin only, cannot delete admin)"""
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete users"
        )

    try:
        user_service.delete_user(user_id)
        logger.info(f"User '{user_id}' deleted by admin")
        return {
            "status": "success",
            "message": f"User '{user_id}' deleted successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail="Error deleting user")
