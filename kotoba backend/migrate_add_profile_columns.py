#!/usr/bin/env python3
"""
migrate_add_profile_columns.py — one-time fix for the live Supabase DB.

WHY THIS EXISTS
────────────────
models.py's User table was missing why / level / daily_goal / jlpt_level /
onboarded / avatar. main.py read and wrote them anyway (as plain Python
attributes), so PATCH /auth/me returned 200 and *looked* like it saved —
but there was no column to persist into, so it silently did nothing.

Symptom this fixes: onboarding "completes" but every next login sends you
straight back through "Get started" again, because `onboarded` was never
actually true in the database.

This script also widens due / last_seen / timestamp from INTEGER to
BIGINT — those columns hold unix-millisecond values (~1.79e12 today),
which overflow a 32-bit INTEGER (~2.1e9 max). On real Postgres every
POST /answer was silently failing to save because of this.

`init_models()` / `Base.metadata.create_all()` will NOT do any of this —
create_all only creates missing TABLES, it never alters an existing one's
columns. Hence this separate, explicit migration.

USAGE
─────
Run this once, locally, against production:

    DATABASE_URL="<your supabase pooler string>" python migrate_add_profile_columns.py

It is idempotent — every statement uses IF NOT EXISTS / conditional
ALTER, so running it twice is harmless. Back up your database first if
you want to be extra safe, though nothing here is destructive.
"""

import asyncio
import os

from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine

RAW_URL = os.environ.get("DATABASE_URL", "").strip().strip('"').strip("'")
if not RAW_URL:
    raise SystemExit(
        "Set DATABASE_URL to your Supabase 'Connection pooling' string "
        "(port 6543) before running this script."
    )

_converted = RAW_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
_url = make_url(_converted).set(query={})

STATEMENTS = [
    # ── users: the missing onboarding/profile columns ──
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS why VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS level VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_goal INTEGER NOT NULL DEFAULT 10",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS jlpt_level INTEGER NOT NULL DEFAULT 5",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT",

    # ── widen ms-timestamp columns so they stop overflowing int32 ──
    "ALTER TABLE user_sm2   ALTER COLUMN due        TYPE BIGINT",
    "ALTER TABLE user_sm2   ALTER COLUMN last_seen  TYPE BIGINT",
    "ALTER TABLE review_log ALTER COLUMN timestamp  TYPE BIGINT",
]


async def main():
    engine = create_async_engine(_url, connect_args={"statement_cache_size": 0})
    async with engine.begin() as conn:
        for stmt in STATEMENTS:
            print(f"→ {stmt}")
            await conn.execute(text(stmt))
    await engine.dispose()
    print("\nDone. Existing rows: why/level default to NULL, daily_goal=10, "
          "jlpt_level=5, onboarded=false, avatar=NULL — so every existing "
          "account will be asked to onboard exactly once more, then it will "
          "stick for good.")


if __name__ == "__main__":
    asyncio.run(main())
