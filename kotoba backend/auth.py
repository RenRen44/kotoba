# auth.py — your existing bcrypt + JWT logic, pulled out of main.py.
#
# Behavior is unchanged from your current code. The one real fix: SECRET_KEY
# now MUST come from an environment variable. Your current main.py has:
#
#     SECRET_KEY = "kotoba-secret-key-change-in-production"
#
# ...still literally set to that placeholder. Anyone who reads your frontend's
# fetch calls (or your public GitHub repo, if it's public) can forge a JWT for
# any user_id and hit every authenticated endpoint as that user. This is the
# single highest-priority fix in this whole change.
#
# Generate a real one and set it as an env var (locally in .env, on Render
# under Environment):
#
#     python -c "import secrets; print(secrets.token_hex(32))"
#
# Set that output as SECRET_KEY on Render. Do NOT commit it to git.

import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY is not set. Generate one with:\n"
        "  python -c \"import secrets; print(secrets.token_hex(32))\"\n"
        "and set it as an environment variable before starting the server."
    )

ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> str | None:
    """Returns user_id if a valid token was sent, otherwise None. Never raises."""
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> str:
    """
    Returns user_id or raises 401. Use this (not the _optional version) on
    any route that reads or writes per-user data — /answer, /readiness, and
    ideally /quiz too, since quiz personalization needs to know who's asking.
    """
    if not credentials:
        raise HTTPException(401, "Missing Authorization header.")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(401, "Invalid token.")
        return user_id
    except JWTError:
        raise HTTPException(401, "Invalid or expired token.")
