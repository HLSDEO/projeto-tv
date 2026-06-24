from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import logging
from sqlalchemy.orm import Session

from database import get_db
from models.audit_log import AuditLog
from auth import get_current_user
from schemas.user import UserCreate, PasswordReset
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
    data: PasswordReset,
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
        user_service.reset_password(user_id, data.new_password)
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

@router.get("/audit-logs")
def list_audit_logs(
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List system audit logs (admin only)"""
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view audit logs"
        )

    try:
        logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(200).all()
        return {
            "logs": [
                {
                    "id": log.id,
                    "timestamp": log.timestamp.isoformat(),
                    "user_id": log.user_id,
                    "username": log.username,
                    "action": log.action,
                    "entity_type": log.entity_type,
                    "entity_id": log.entity_id,
                    "ip_address": log.ip_address,
                    "details": log.details
                }
                for log in logs
            ]
        }
    except Exception as e:
        logger.error(f"Error listing audit logs: {e}")
        raise HTTPException(status_code=500, detail="Error listing audit logs")
