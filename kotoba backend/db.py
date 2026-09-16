# db.py — Postgres (Supabase) connection setup
#
# Supabase gives you two Postgres connection strings under
# Project Settings → Database:
#
#   1. "Connection string" (direct, port 5432)      — fine for local scripts,
#      but NOT recommended for a deployed app that opens/closes connections
#      often (e.g. one per request on Render) — direct connections are
#      capped and get exhausted quickly.
#
#   2. "Connection pooling" (transaction mode, port 6543) — THIS is the one
#      to use from your deployed backend. It routes through Supabase's
#      PgBouncer pooler, built for exactly this pattern.
#
# Grab the pooling string, it looks like:
#   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-xx-xxxx-1.pooler.supabase.com:6543/postgres
#
# Then convert "postgresql://" to "postgresql+asyncpg://" (SQLAlchemy needs
# the driver named explicitly for async), and set it as an environment
# variable called DATABASE_URL — locally in a .env file, and on Render
# under your service's Environment tab.
#
# IMPORTANT: pgbouncer in transaction mode does not support prepared
# statements the way asyncpg uses them by default. We disable that below
# (statement_cache_size=0) — without it you'll see random
# "prepared statement already exists" errors under load.

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

RAW_URL = os.environ.get("DATABASE_URL", "")

if not RAW_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Set it to your Supabase 'Connection pooling' "
        "string (port 6543), with postgresql+asyncpg:// as the scheme."
    )

# Be forgiving if someone pastes the plain postgresql:// string.
DATABASE_URL = RAW_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # detect dead connections before using them
    connect_args={
        "statement_cache_size": 0,   # required for pgbouncer transaction mode
    },
)

async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db():
    """FastAPI dependency — yields one session per request."""
    async with async_session() as session:
        yield session


async def init_models():
    """
    Creates tables if they don't exist yet, based on models.py.
    Call this once at startup (see main.py). For a project this size,
    create_all is fine — you don't need Alembic migrations until the
    schema starts changing after you have real user data you can't
    afford to drop.
    """
    from models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
