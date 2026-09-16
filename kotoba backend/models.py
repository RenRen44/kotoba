# models.py — Postgres tables for mutable, per-user state.
#
# jmdict.db (the 217k-entry dictionary) is deliberately NOT here — it's
# read-only reference data that ships inside your deploy image, rebuilt by
# process_jmdit.py at build time. SQLite is fine for that because nothing
# writes to it at runtime. These three tables are the opposite: they are
# exactly the data that must survive a redeploy, so they live in Supabase
# Postgres instead of on Render's ephemeral disk.
#
# Schema mirrors your existing SQLite tables field-for-field so the
# migration is a lift-and-shift, not a redesign.

from sqlalchemy import String, Integer, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)          # uuid4 hex string
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)      # bcrypt hash
    created: Mapped[int] = mapped_column(Integer, nullable=False)      # unix timestamp


class UserSM2(Base):
    """One row per (user, word) — SM-2 spaced-repetition state."""
    __tablename__ = "user_sm2"

    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    word: Mapped[str] = mapped_column(String, primary_key=True)
    interval: Mapped[float] = mapped_column(Float, default=1.0)
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    ease: Mapped[float] = mapped_column(Float, default=2.5)
    due: Mapped[int] = mapped_column(Integer, default=0)          # unix ms timestamp, matches frontend convention
    last_seen: Mapped[int] = mapped_column(Integer, default=0)    # unix ms timestamp


class UserBKT(Base):
    """One row per (user, word) — Bayesian Knowledge Tracing state."""
    __tablename__ = "user_bkt"

    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    word: Mapped[str] = mapped_column(String, primary_key=True)
    p_known: Mapped[float] = mapped_column(Float, default=0.1)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    correct: Mapped[int] = mapped_column(Integer, default=0)


class ReviewLog(Base):
    """
    Append-only log — one row per answer, never updated or deleted.
    This is your source of truth. UserSM2/UserBKT above are derived caches
    for fast lookups; if you ever change the SM-2/BKT formulas, you can
    replay this table to regenerate them instead of losing history.
    Also what future model retraining (train_model.py) should read from,
    instead of synthetic data.
    """
    __tablename__ = "review_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    word: Mapped[str] = mapped_column(String)
    correct: Mapped[int] = mapped_column(Integer)          # 0 or 1
    level: Mapped[str] = mapped_column(String, default="")  # e.g. "N5"
    interval_at_review: Mapped[float] = mapped_column(Float, default=1.0)
    ease_at_review: Mapped[float] = mapped_column(Float, default=2.5)
    p_known_at_review: Mapped[float] = mapped_column(Float, default=0.1)
    timestamp: Mapped[int] = mapped_column(Integer)         # unix ms, set by the server, not the client
