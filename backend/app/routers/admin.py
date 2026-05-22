from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db, User
from app.auth import get_current_user, get_password_hash
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])

class UserCreate(BaseModel):
    username: str
    password: str

class UserList(BaseModel):
    username: str

@router.get("/users")
def list_users(username: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all users (admin only)"""
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view users"
        )

    try:
        users = db.query(User).all()
        return {"users": [{"username": u.username} for u in users]}
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(status_code=500, detail="Error listing users")

@router.post("/users")
def create_user(
    user: UserCreate,
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)"""
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can create users"
        )

    # Check if user already exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User '{user.username}' already exists"
        )

    if not user.username or len(user.username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters long"
        )

    if not user.password or len(user.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )

    try:
        new_user = User(
            username=user.username,
            password_hash=get_password_hash(user.password)
        )
        db.add(new_user)
        db.commit()
        logger.info(f"User '{user.username}' created by admin")
        return {
            "status": "success",
            "message": f"User '{user.username}' created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Error creating user")

@router.put("/users/{user_id}/password")
def reset_password(
    user_id: str,
    new_password: str,
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset user password (admin only or own password)"""
    if username != 'admin' and username != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot reset other user's password"
        )

    if not new_password or len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )

    try:
        user = db.query(User).filter(User.username == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{user_id}' not found"
            )

        user.password_hash = get_password_hash(new_password)
        db.commit()

        logger.info(f"Password reset for user '{user_id}'")
        return {
            "status": "success",
            "message": f"Password for user '{user_id}' reset successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail="Error resetting password")

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    username: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only, cannot delete admin)"""
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete users"
        )

    if user_id == 'admin':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the admin account"
        )

    try:
        user = db.query(User).filter(User.username == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{user_id}' not found"
            )

        db.delete(user)
        db.commit()
        logger.info(f"User '{user_id}' deleted by admin")
        return {
            "status": "success",
            "message": f"User '{user_id}' deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail="Error deleting user")
