import os
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    # Resolve log path
    log_dir = os.getenv("LOG_DIR", "logs")
    log_file = os.getenv("LOG_FILE", "backend.log")
    full_log_path = os.path.join(log_dir, log_file)
    
    # Ensure log directory exists
    os.makedirs(log_dir, exist_ok=True)
    
    # Define standard format
    log_format = "[%(asctime)s] [%(levelname)s] [%(name)s:%(lineno)d] - %(message)s"
    formatter = logging.Formatter(log_format, datefmt="%Y-%m-%d %H:%M:%S")
    
    # Setup RotatingFileHandler (5MB max size, keep 5 backups)
    file_handler = RotatingFileHandler(
        full_log_path, maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)
    
    # Configure level
    log_level_env = os.getenv("LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_env, logging.INFO)
    
    # Add file handler to root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Avoid duplicate file handlers on root
    has_file_handler = any(
        isinstance(h, RotatingFileHandler) and os.path.abspath(h.baseFilename) == os.path.abspath(full_log_path)
        for h in root_logger.handlers
    )
    if not has_file_handler:
        root_logger.addHandler(file_handler)
        
    # Add file handler to uvicorn loggers without deleting their default handlers (crucial for Docker --reload)
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        l = logging.getLogger(logger_name)
        l.setLevel(log_level)
        has_file_handler_l = any(
            isinstance(h, RotatingFileHandler) and os.path.abspath(h.baseFilename) == os.path.abspath(full_log_path)
            for h in l.handlers
        )
        if not has_file_handler_l:
            l.addHandler(file_handler)
            
    logging.info("📝 Logging configured successfully. Writing to: %s", full_log_path)
