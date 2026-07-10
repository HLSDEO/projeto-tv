from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables (look for centralized root .env first)
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
if os.path.exists(root_env):
    load_dotenv(root_env)
else:
    load_dotenv()

from core.logging_config import setup_logging
setup_logging()


from database import init_db, get_db
from sqlalchemy.orm import Session
from models.audit_log import AuditLog
from auth import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from core.websocket import manager
from core.dependencies import get_user_service
from services.user_service import IUserService

app = FastAPI(title="TV DLOG API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3100",
        "http://127.0.0.1:3100",
        "http://localhost:8200",
        "http://127.0.0.1:8200",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from core.context import set_request_context, clear_request_context

# Middleware to capture client IP address for database auditing
@app.middleware("http")
async def audit_context_middleware(request: Request, call_next):
    ip_address = request.client.host if request.client else None
    set_request_context(user_id=None, username=None, ip_address=ip_address)
    try:
        response = await call_next(request)
        return response
    finally:
        clear_request_context()

from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers
        )
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors()}
        )
        
    import logging
    import traceback
    logger = logging.getLogger("backend.errors")
    tb_str = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    logger.error(
        f"Unhandled exception during {request.method} {request.url.path}:\n{tb_str}"
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor. Consulte os logs."}
    )

# Serve uploaded files
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# Initialize database and apply migrations on startup
@app.on_event("startup")
async def startup_event():
    # Run Alembic migrations programmatically
    try:
        import logging
        from alembic.config import Config
        from alembic import command
        
        logger = logging.getLogger(__name__)
        logger.info("⚙️ Running Alembic database migrations...")
        
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        ini_path = os.path.join(base_dir, "alembic.ini")
        
        alembic_cfg = Config(ini_path)
        command.upgrade(alembic_cfg, "head")
        logger.info("✅ Alembic database migrations completed successfully")
    except Exception as migration_error:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"❌ Alembic database migrations failed: {migration_error}")
    finally:
        # Re-apply our logging configuration because Alembic's fileConfig overrides it
        from core.logging_config import setup_logging
        setup_logging()
        
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
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_service: IUserService = Depends(get_user_service),
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user = user_service.authenticate_user(form_data.username, form_data.password)
    
    if not user:
        try:
            failed_log = AuditLog(
                username=form_data.username,
                action="LOGIN_FAILED",
                entity_type="User",
                ip_address=ip_address,
                details=f"Tentativa de login falhou para o usuário '{form_data.username}'"
            )
            db.add(failed_log)
            db.commit()
        except Exception as e:
            # Don't let logging failures block the authentication flow response
            pass

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        success_log = AuditLog(
            user_id=user.id,
            username=user.username,
            action="LOGIN_SUCCESS",
            entity_type="User",
            entity_id=user.id,
            ip_address=ip_address,
            details=f"Usuário '{user.username}' realizou login com sucesso"
        )
        db.add(success_log)
        db.commit()
    except Exception as e:
        pass

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "must_change_password": user.must_change_password
    }

from routers import media, settings, news, admin, birthdays
app.include_router(media.router)
app.include_router(settings.router)
app.include_router(news.router)
app.include_router(admin.router)
app.include_router(birthdays.router)

