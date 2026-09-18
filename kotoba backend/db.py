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
#
# ALSO IMPORTANT: Supabase's copy-paste connection string comes with
# "?pgbouncer=true" tacked onto the end, e.g.:
#   postgresql://postgres.xxxx:pw@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
# That query param is meant for tools that specifically look for it (some
# ORMs use it as a signal to change behavior). SQLAlchemy doesn't recognize
# it as one of its own URL options, so it passes it straight through as a
# raw keyword argument to asyncpg's connect() — and asyncpg's connect()
# has no "pgbouncer" parameter, so it dies with:
#   TypeError: connect() got an unexpected keyword argument 'pgbouncer'
# The fix is to strip ALL query params from the URL before handing it to
# SQLAlchemy — we already pass the one setting that actually matters
# (statement_cache_size=0) explicitly via connect_args below, so nothing
# is lost by dropping the rest.
#
# NOTE ON HOW WE STRIP IT: we use SQLAlchemy's own make_url(), NOT the
# standard library's urllib.parse.urlsplit(). On Python 3.12+ (and strictly
# enforced in 3.14), urlsplit() treats ANY square bracket in the netloc as
# the start of an IPv6 literal and then validates the host as an IP address,
# blowing up with:
#   ValueError: 'aws-0-....pooler.supabase.com' does not appear to be an
#               IPv4 or IPv6 address
# A Postgres password can legitimately contain brackets, so urlsplit is the
# wrong tool here. make_url() parses userinfo properly and doesn't care.

import os
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

RAW_URL = os.environ.get("DATABASE_URL", "").strip().strip('"').strip("'")

if not RAW_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Set it to your Supabase 'Connection pooling' "
        "string (port 6543), with postgresql+asyncpg:// as the scheme."
    )

# Be forgiving if someone pastes the plain postgresql:// string.
_converted = RAW_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

try:
    _url = make_url(_converted)
except Exception as e:
    raise RuntimeError(
        f"DATABASE_URL could not be parsed as a database URL: {e}\n"
        "It should look like:\n"
        "  postgresql://postgres.<project-ref>:<password>"
        "@aws-0-<region>.pooler.supabase.com:6543/postgres"
    ) from e

# Catch the single most common setup mistake: copying Supabase's connection
# string without substituting the real password. Supabase cannot show you
# your database password (it doesn't store it in readable form), so the
# string it hands you contains the literal placeholder [YOUR-PASSWORD].
# Left in place, this fails later with a confusing auth error — so fail
# loudly and clearly here instead.
if _url.password and "YOUR-PASSWORD" in _url.password:
    raise RuntimeError(
        "DATABASE_URL still contains the literal placeholder [YOUR-PASSWORD].\n"
        "Replace it (brackets included) with your actual Supabase database "
        "password — the one you set when creating the project.\n"
        "Forgot it? Supabase Dashboard → Project Settings → Database → "
        "Reset database password."
    )

# Strip any query string (?pgbouncer=true and friends) — see note above.
DATABASE_URL = _url.set(query={})

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