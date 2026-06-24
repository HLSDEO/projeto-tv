from sqlalchemy import event, insert
from models.user import User
from models.media import Media
from models.settings import Settings
from models.audit_log import AuditLog
from core.context import get_request_context
from datetime import datetime

def insert_audit_log(connection, action: str, entity_type: str, entity_id: int, details: str):
    ctx = get_request_context()
    user_id = ctx.get("user_id") if ctx else None
    username = ctx.get("username") if ctx else None
    ip_address = ctx.get("ip_address") if ctx else None

    # Using direct connection execution to avoid session flush recursion
    stmt = insert(AuditLog).values(
        timestamp=datetime.utcnow(),
        user_id=user_id,
        username=username,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        ip_address=ip_address,
        details=details
    )
    connection.execute(stmt)

# User events
def user_after_insert(mapper, connection, target):
    insert_audit_log(connection, "CREATE_USER", "User", target.id, f"Usuário '{target.username}' criado")

def user_after_update(mapper, connection, target):
    insert_audit_log(connection, "UPDATE_USER", "User", target.id, f"Usuário '{target.username}' atualizado")

def user_after_delete(mapper, connection, target):
    insert_audit_log(connection, "DELETE_USER", "User", target.id, f"Usuário '{target.username}' excluído")

# Media events
def media_after_insert(mapper, connection, target):
    insert_audit_log(connection, "UPLOAD_MEDIA", "Media", target.id, f"Mídia '{target.original_name}' (tipo: {target.type}) carregada")

def media_after_update(mapper, connection, target):
    insert_audit_log(connection, "UPDATE_MEDIA", "Media", target.id, f"Mídia '{target.original_name}' (ativa: {target.active}, ordem: {target.order}, duração: {target.duration}s) atualizada")

def media_after_delete(mapper, connection, target):
    insert_audit_log(connection, "DELETE_MEDIA", "Media", target.id, f"Mídia '{target.original_name}' excluída")

# Settings events
def settings_after_insert(mapper, connection, target):
    insert_audit_log(connection, "CREATE_SETTING", "Settings", target.id, f"Configuração '{target.key}' definida para '{target.value}'")

def settings_after_update(mapper, connection, target):
    insert_audit_log(connection, "UPDATE_SETTING", "Settings", target.id, f"Configuração '{target.key}' alterada para '{target.value}'")

def settings_after_delete(mapper, connection, target):
    insert_audit_log(connection, "DELETE_SETTING", "Settings", target.id, f"Configuração '{target.key}' removida")

def setup_audit_listeners():
    event.listen(User, "after_insert", user_after_insert)
    event.listen(User, "after_update", user_after_update)
    event.listen(User, "after_delete", user_after_delete)

    event.listen(Media, "after_insert", media_after_insert)
    event.listen(Media, "after_update", media_after_update)
    event.listen(Media, "after_delete", media_after_delete)

    event.listen(Settings, "after_insert", settings_after_insert)
    event.listen(Settings, "after_update", settings_after_update)
    event.listen(Settings, "after_delete", settings_after_delete)
