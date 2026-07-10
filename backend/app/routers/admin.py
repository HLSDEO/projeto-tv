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

from fastapi.responses import FileResponse
import os

@router.get("/logs")
def get_logs(
    limit: int = 200,
    level: str = None,
    search: str = None,
    username: str = Depends(get_current_user)
):
    """Get latest logs (admin only)"""
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view logs"
        )
        
    log_file = os.path.join(os.getenv("LOG_DIR", "logs"), "backend.log")
    if not os.path.exists(log_file):
        return {"logs": []}
        
    try:
        # Read the log file lines
        with open(log_file, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
            
        # Parse and filter lines
        filtered_lines = []
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
                
            # Filter by log level if requested (e.g. ERROR, WARNING, INFO)
            if level and level != 'ALL':
                # Level check (e.g. [ERROR] or [WARNING] in the line)
                if f"[{level.upper()}]" not in line_str:
                    continue
                    
            # Filter by search term
            if search:
                if search.lower() not in line_str.lower():
                    continue
                    
            filtered_lines.append(line_str)
            
        # Get latest limit lines
        latest_logs = filtered_lines[-limit:] if limit > 0 else filtered_lines
        
        return {"logs": latest_logs}
    except Exception as e:
        logger.error(f"Error reading logs: {e}")
        raise HTTPException(status_code=500, detail="Error reading logs")

@router.delete("/logs/clear")
def clear_logs(username: str = Depends(get_current_user)):
    """Clear (truncate) current log file (admin only)"""
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can clear logs"
        )
        
    log_file = os.path.join(os.getenv("LOG_DIR", "logs"), "backend.log")
    if not os.path.exists(log_file):
        return {"status": "success", "message": "Log file does not exist"}
        
    try:
        # Truncate the file
        with open(log_file, "w", encoding="utf-8") as f:
            f.truncate(0)
        logger.info("Logs cleared by admin")
        return {"status": "success", "message": "Logs cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing logs: {e}")
        raise HTTPException(status_code=500, detail="Error clearing logs")

@router.get("/logs/download")
def download_logs(username: str = Depends(get_current_user)):
    """Download full log file (admin only)"""
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can download logs"
        )
        
    log_file = os.path.join(os.getenv("LOG_DIR", "logs"), "backend.log")
    if not os.path.exists(log_file):
        raise HTTPException(status_code=404, detail="Log file not found")
        
    return FileResponse(
        path=log_file,
        filename="backend.log",
        media_type="text/plain"
    )

