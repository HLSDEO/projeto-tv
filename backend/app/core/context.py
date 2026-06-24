import contextvars
from typing import Optional, Dict, Any

# ContextVar to store request metadata for auditing: {"user_id": int, "username": str, "ip_address": str}
request_context: contextvars.ContextVar[Optional[Dict[str, Any]]] = contextvars.ContextVar(
    "request_context", default=None
)

def set_request_context(user_id: Optional[int], username: Optional[str], ip_address: Optional[str]):
    request_context.set({
        "user_id": user_id,
        "username": username,
        "ip_address": ip_address
    })

def clear_request_context():
    request_context.set(None)

def get_request_context() -> Optional[Dict[str, Any]]:
    return request_context.get()
