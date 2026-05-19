from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.database import get_db
from app.auth import get_current_user, get_password_hash
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])

class UserCreate(BaseModel):
    username: str
    password: str

class UserList(BaseModel):
    username: str
    created_at: str = None

@router.get("/users")
def list_users(username: str = Depends(get_current_user)):
    """List all users (admin only)"""
    db = get_db()
    users_col = db.collection('users')

    # Only admin can view users
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can view users"
        )

    try:
        users = list(users_col.all())
        return {
            "users": [{"username": u.get('username'), "created_at": u.get('created_at')} for u in users]
        }
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(status_code=500, detail="Error listing users")

@router.post("/users")
def create_user(user: UserCreate, username: str = Depends(get_current_user)):
    """Create a new user (admin only)"""
    db = get_db()
    users_col = db.collection('users')

    # Only admin can create users
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can create users"
        )

    # Check if user already exists
    existing_user = next(users_col.find({'username': user.username}), None)
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
        new_user = {
            'username': user.username,
            'password_hash': get_password_hash(user.password)
        }
        result = users_col.insert(new_user)
        logger.info(f"User '{user.username}' created by admin")
        return {
            "status": "success",
            "message": f"User '{user.username}' created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Error creating user")

@router.put("/users/{user_id}/password")
def reset_password(user_id: str, new_password: str, username: str = Depends(get_current_user)):
    """Reset user password (admin only or own password)"""
    db = get_db()
    users_col = db.collection('users')

    # Only admin or the user themselves can reset password
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
        user = users_col.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{user_id}' not found"
            )

        users_col.update({
            '_key': user_id,
            'password_hash': get_password_hash(new_password)
        })

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
def delete_user(user_id: str, username: str = Depends(get_current_user)):
    """Delete a user (admin only, cannot delete admin)"""
    db = get_db()
    users_col = db.collection('users')

    # Only admin can delete users
    if username != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete users"
        )

    # Cannot delete the admin account
    if user_id == 'admin':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the admin account"
        )

    try:
        user = users_col.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{user_id}' not found"
            )

        users_col.delete(user_id)
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
