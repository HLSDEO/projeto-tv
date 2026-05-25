from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


from database import init_db
from auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from core.websocket import manager
from core.dependencies import get_user_service
from services.user_service import IUserService

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
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.post("/api/auth/login")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_service: IUserService = Depends(get_user_service)
):
    user = user_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

from app.routers import media, settings, news, admin
app.include_router(media.router)
app.include_router(settings.router)
app.include_router(news.router)
app.include_router(admin.router)
