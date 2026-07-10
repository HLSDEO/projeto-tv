from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# Only call fileConfig if root logger has no handlers (i.e. running from CLI)
# to avoid resetting the FastAPI app's active logging handlers.
if config.config_file_name is not None:
    import logging
    if not logging.getLogger().handlers:
        fileConfig(config.config_file_name)

import sys
import os
from dotenv import load_dotenv

# Setup paths to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../app')))

# Load env variables from centralized root .env if it exists
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env'))
if os.path.exists(root_env):
    load_dotenv(root_env)
else:
    load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../.env')))

from app.database import Base
import app.models.user
import app.models.media
import app.models.settings
import app.models.audit_log

target_metadata = Base.metadata

# Dynamic database URL configuration
database_url = os.getenv("DATABASE_URL")
if not database_url:
    database_url = "postgresql://tvdlog:tvdlog123@localhost:5432/tvdlog"
config.set_main_option("sqlalchemy.url", database_url)


# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
