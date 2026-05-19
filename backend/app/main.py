from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import get_db
from app.auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, verify_password
from datetime import timedelta

def authenticate_user(db, username, password):
    user = next(db.collection('users').find({'username': username}), None)
    if not user:
        return False
    if not verify_password(password, user['password_hash']):
        return False
    return user

app = FastAPI(title="TV DLOG API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
os.makedirs("/app/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    try:
        get_db()
    except Exception as e:
        print(f"Error initializing database: {e}")

@app.post("/api/auth/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

from app.routers import media, settings, news, admin
app.include_router(media.router)
app.include_router(settings.router)
app.include_router(news.router)
app.include_router(admin.router)
