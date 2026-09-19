# main.py — Kotoba FastAPI Backend (Postgres/Supabase version)
#
# What changed from your original main.py, and why:
#
#   • users / user_sm2 / user_bkt moved from SQLite to Postgres (Supabase).
#     Reason: Render's disk is ephemeral — every redeploy/restart resets it
#     to whatever shipped in the image. SQLite for these tables meant every
#     registered user and every saved answer would vanish on the next deploy.
#     jmdict.db (the dictionary) is UNCHANGED and stays SQLite on purpose —
#     it's read-only reference data rebuilt at build time, never written to
#     at runtime, so ephemeral disk is irrelevant for it.
#
#   • /answer used to be a stub (`return {"saved": True}`). It now actually
#     runs the SM-2 + BKT update and writes it, inside one DB transaction,
#     plus appends to review_log (permanent history — see models.py).
#
#   • /quiz and /readiness now require a valid auth token and compute their
#     numbers from that user's real rows, instead of /readiness trusting
#     whatever numbers the client put in the request body (which was fully
#     spoofable — anyone could POST accuracy_last_10: 1.0 and get "ready").
#
#   • SECRET_KEY moved to an environment variable — see auth.py's comment
#     for why the hardcoded placeholder was a real vulnerability.
#
#   • Registration/login payloads are now validated Pydantic models instead
#     of bare dicts.
#
#   • NEW: profile-management routes — PATCH /auth/me, POST /auth/password,
#     DELETE /auth/me, GET /me/stats — plus GET /auth/me now returns the
#     full ProfileOut shape (including `onboarded`) instead of a bare
#     {id, email, name} dict. The frontend's boot sequence, onboarding flow,
#     and Profile screen all depend on these; they were built into
#     schemas.py/crud.py earlier but never wired up in main.py, which is why
#     onboarding appeared to "complete" but never actually persisted, and
#     the Profile screen's edit/password/delete/stats features all 405'd.
#
# Everything else — get_jlpt_words, enrich_with_jmdict, get_distractors, the
# JMdict SQLite lookups — is UNCHANGED from your original file.

import json
import random
import time
import uuid

import numpy as np
import requests
import xgboost as xgb
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

import sqlite3
import os

from auth import create_token, get_current_user, hash_password, verify_password
from db import get_db, init_models
from models import User
from schemas import (
    AnswerIn, AnswerOut, AuthOut, LoginIn, ReadinessOut, RegisterIn,
    ProfileOut, ProfileUpdateIn, PasswordChangeIn, StatsOut,
)
import crud

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

JMDICT_DB = "jmdict.db"  # unchanged — read-only reference data, stays SQLite


@app.on_event("startup")
async def on_startup():
    await init_models()  # creates users/user_sm2/user_bkt/review_log in Postgres if missing


# ── XGBoost model, unchanged ──
_model = None
def get_model():
    global _model
    if _model is None:
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "readiness_model.json")
        _model = xgb.XGBClassifier()
        _model.load_model(model_path)
    return _model


# ── JMdict (SQLite, read-only) helpers — unchanged from your original ──
def get_jmdict_db():
    conn = sqlite3.connect(JMDICT_DB)
    conn.row_factory = sqlite3.Row
    return conn


_jlpt_cache = {}

def get_jlpt_words(level: int):
    if level in _jlpt_cache:
        return _jlpt_cache[level]
    url = f"https://jlpt-vocab-api.vercel.app/api/words/all?level={level}"
    res = requests.get(url, timeout=10)
    data = res.json()
    words = data if isinstance(data, list) else data.get("words", [])
    _jlpt_cache[level] = words
    return words


def enrich_with_jmdict(word_text: str, db):
    row = db.execute(
        "SELECT * FROM words WHERE kanji = ? OR kana = ? LIMIT 1",
        (word_text, word_text)
    ).fetchone()
    if not row:
        return {}
    return {
        "pos":          json.loads(row["pos"] or "[]"),
        "usually_kana": bool(row["usually_kana"]),
        "antonyms":     json.loads(row["antonyms"] or "[]"),
        "related":      json.loads(row["related"] or "[]"),
        "is_common":    bool(row["is_common"]),
    }


def get_distractors(correct_meaning: str, pos_tags: list, count: int, db):
    if pos_tags:
        pos_str = pos_tags[0]
        rows = db.execute("""
            SELECT meanings FROM words
            WHERE pos LIKE ? AND meanings != ? AND is_common = 1
            ORDER BY RANDOM() LIMIT ?
        """, (f'%"{pos_str}"%', correct_meaning, count * 3)).fetchall()
    else:
        rows = db.execute("""
            SELECT meanings FROM words
            WHERE meanings != ? AND is_common = 1
            ORDER BY RANDOM() LIMIT ?
        """, (correct_meaning, count * 3)).fetchall()

    distractors = []
    seen = set()
    for row in rows:
        first = row["meanings"].split(";")[0].strip()
        if first and first not in seen and first != correct_meaning:
            seen.add(first)
            distractors.append(first)
        if len(distractors) == count:
            break

    while len(distractors) < count:
        distractors.append("unknown")

    return distractors


def _user_to_profile_dict(user: User) -> dict:
    """Shared shape used by GET /auth/me and PATCH /auth/me responses."""
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "why": user.why,
        "level": user.level,
        "daily_goal": user.daily_goal,
        "jlpt_level": user.jlpt_level,
        "onboarded": bool(user.onboarded),
        "created": user.created,
        "avatar": user.avatar,
    }


# ════════════════════════════════
#  AUTH ROUTES
# ════════════════════════════════

@app.post("/auth/register", response_model=AuthOut)
async def register(payload: RegisterIn, db=Depends(get_db)):
    email = payload.email.lower().strip()

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "An account with this email already exists.")

    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=email,
        name=payload.name.strip(),
        password=hash_password(payload.password),
        created=int(time.time()),
    )
    db.add(user)
    await db.commit()

    token = create_token(user_id)
    return {"token": token, "user": {"id": user_id, "email": email, "name": user.name}}


@app.post("/auth/login", response_model=AuthOut)
async def login(payload: LoginIn, db=Depends(get_db)):
    email = payload.email.lower().strip()

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(401, "Invalid email or password.")

    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "email": user.email, "name": user.name}}


@app.get("/auth/me", response_model=ProfileOut)
async def me(user_id: str = Depends(get_current_user), db=Depends(get_db)):
    """
    Now returns the full ProfileOut shape (including `onboarded`) instead of
    a bare {id, email, name} dict. The frontend's boot sequence reads
    `onboarded` from this response to decide whether to route a returning
    user straight into the app or into the onboarding flow.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found.")
    return _user_to_profile_dict(user)


@app.patch("/auth/me", response_model=ProfileOut)
async def update_me(payload: ProfileUpdateIn, user_id: str = Depends(get_current_user), db=Depends(get_db)):
    """
    Partial profile update. Used by:
      - kotoba-onboarding.jsx's final step: {why, level, daily_goal,
        jlpt_level, onboarded: true}
      - kotoba-views.jsx's Profile screen: name edits, goal/level picker
        changes, one field at a time.
    Only fields the client actually sent are touched — everything else on
    the row is left alone.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found.")

    updates = payload.model_dump(exclude_unset=True)

    if "name" in updates:
        user.name = updates["name"].strip()
    if "why" in updates:
        user.why = updates["why"]
    if "level" in updates:
        user.level = updates["level"]
    if "daily_goal" in updates:
        user.daily_goal = updates["daily_goal"]
    if "jlpt_level" in updates:
        user.jlpt_level = updates["jlpt_level"]
    if "onboarded" in updates:
        user.onboarded = 1 if updates["onboarded"] else 0
    if "avatar" in updates:
        user.avatar = updates["avatar"]

    await db.commit()
    await db.refresh(user)
    return _user_to_profile_dict(user)


@app.post("/auth/password")
async def change_password(payload: PasswordChangeIn, user_id: str = Depends(get_current_user), db=Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found.")

    if not verify_password(payload.current_password, user.password):
        raise HTTPException(400, "Current password is incorrect.")

    user.password = hash_password(payload.new_password)
    await db.commit()
    return {"ok": True}


@app.delete("/auth/me")
async def delete_me(user_id: str = Depends(get_current_user), db=Depends(get_db)):
    """
    Deletes the user row. user_sm2 / user_bkt / review_log all have
    ForeignKey(..., ondelete="CASCADE") back to users.id (see models.py),
    so Postgres cleans those up automatically — no need to delete them here.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found.")

    await db.delete(user)
    await db.commit()
    return {"ok": True}


@app.get("/me/stats", response_model=StatsOut)
async def my_stats(user_id: str = Depends(get_current_user), db=Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found.")

    return await crud.get_user_stats(db, user_id, daily_goal=user.daily_goal)


# ════════════════════════════════
#  DICTIONARY / QUIZ ROUTES (JMdict logic unchanged)
# ════════════════════════════════

@app.get("/")
def root():
    return {"status": "Kotoba API running"}


@app.get("/words")
def get_words(level: int = 5, limit: int = 50):
    jlpt_words = get_jlpt_words(level)
    jm_db = get_jmdict_db()
    result = []
    for w in jlpt_words[:limit]:
        jm = enrich_with_jmdict(w.get("word", ""), jm_db)
        result.append({
            "word":     w.get("word"),
            "meaning":  w.get("meaning"),
            "furigana": w.get("furigana"),
            "romaji":   w.get("romaji"),
            "level":    f"N{w.get('level', 5)}",
            **jm
        })
    jm_db.close()
    return {"words": result, "total": len(result)}


@app.get("/quiz")
async def get_quiz(level: int = 5, count: int = 8, user_id: str = Depends(get_current_user), db=Depends(get_db)):
    """
    Now requires auth. Filters out words this user has already mastered
    (BKT p_known >= 0.95), same rule your frontend's fetchQuiz() used to
    apply client-side in kotoba-data.jsx — moved server-side so it can't
    be skipped by calling the API directly, and so it's based on real
    stored state instead of whatever the client happened to have cached.
    """
    jlpt_words = get_jlpt_words(level)
    mastered = set(await crud.get_mastered_words(db, user_id))

    pool = [w for w in jlpt_words if w.get("word") not in mastered] or jlpt_words
    sample = random.sample(pool, min(count, len(pool)))

    jm_db = get_jmdict_db()
    questions = []
    for w in sample:
        word_text = w.get("word", "")
        correct   = w.get("meaning", "")
        jm        = enrich_with_jmdict(word_text, jm_db)
        pos       = jm.get("pos", [])
        wrong     = get_distractors(correct, pos, 3, jm_db)
        opts      = wrong[:3]
        correct_idx = random.randint(0, 3)
        opts.insert(correct_idx, correct)
        questions.append({
            "w":            word_text,
            "r":            w.get("romaji", ""),
            "lv":           f"N{w.get('level', 5)}",
            "opts":         opts,
            "c":            correct_idx,
            "pos":          pos,
            "usually_kana": jm.get("usually_kana", False),
        })
    jm_db.close()
    return {"questions": questions}


@app.get("/word/{word}")
def get_word(word: str):
    jm_db = get_jmdict_db()
    row = jm_db.execute(
        "SELECT * FROM words WHERE kanji = ? OR kana = ? LIMIT 1",
        (word, word)
    ).fetchone()
    jm_db.close()
    if not row:
        return {"error": "not found"}
    return {
        "id":           row["id"],
        "kanji":        row["kanji"],
        "kana":         row["kana"],
        "meanings":     row["meanings"],
        "pos":          json.loads(row["pos"] or "[]"),
        "is_common":    bool(row["is_common"]),
        "usually_kana": bool(row["usually_kana"]),
        "antonyms":     json.loads(row["antonyms"] or "[]"),
        "related":      json.loads(row["related"] or "[]"),
        "domain":       json.loads(row["domain"] or "[]"),
    }


# ════════════════════════════════
#  ANSWER — the route that used to be a stub
# ════════════════════════════════

@app.post("/answer", response_model=AnswerOut)
async def save_answer(payload: AnswerIn, user_id: str = Depends(get_current_user), db=Depends(get_db)):
    """
    Real implementation. One DB transaction:
      1. update-or-create the user's SM-2 row for this word
      2. update-or-create the user's BKT row for this word
      3. append a row to review_log (permanent, replayable history)
    All three commit together, or none do.
    """
    result = await crud.record_answer(db, user_id, payload.word, payload.correct, payload.level)
    await db.commit()
    return {"saved": True, "word": payload.word, **result}


@app.get("/stats")
def get_stats():
    return {
        "total_words": 217425,
        "common_words": 22603,
        "levels": ["N5", "N4", "N3", "N2", "N1"]
    }


@app.post("/readiness", response_model=ReadinessOut)
async def check_readiness(user_id: str = Depends(get_current_user), db=Depends(get_db), current_level: int = 1):
    """
    Now requires auth and computes every feature server-side from Postgres.
    The old version trusted a JSON body the client built itself — anyone
    could POST {"accuracy_last_10": 1.0, ...} and get told they were ready.
    """
    try:
        features_dict = await crud.get_readiness_features(db, user_id, current_level)
        features = np.array([[
            features_dict["accuracy_last_10"],
            features_dict["avg_pknown"],
            features_dict["avg_ease"],
            features_dict["mastered_count"],
            features_dict["due_count"],
            features_dict["streak"],
            features_dict["current_level"],
        ]])
        model = get_model()
        score = float(model.predict_proba(features)[0][1])
        ready = score >= 0.7
        return {
            "ready":   ready,
            "score":   round(score, 3),
            "message": "Ready to level up! 🎉" if ready else "Keep practicing at this level.",
        }
    except Exception as e:
        raise HTTPException(500, f"Readiness check failed: {e}")