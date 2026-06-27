# main.py — Kotoba FastAPI Backend
from fastapi import FastAPI, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import sqlite3, json, random, requests, os
import numpy as np
import xgboost as xgb
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB = "jmdict.db"
SECRET_KEY = "kotoba-secret-key-change-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)

# ── Load XGBoost model once at startup ──
_model = None
def get_model():
    global _model
    if _model is None:
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'readiness_model.json')
        _model = xgb.XGBClassifier()
        _model.load_model(model_path)
    return _model

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id       TEXT PRIMARY KEY,
            email    TEXT UNIQUE NOT NULL,
            name     TEXT NOT NULL,
            password TEXT NOT NULL,
            created  INTEGER NOT NULL
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS user_sm2 (
            user_id     TEXT NOT NULL,
            word        TEXT NOT NULL,
            interval    REAL DEFAULT 1,
            repetitions INTEGER DEFAULT 0,
            ease        REAL DEFAULT 2.5,
            due         INTEGER DEFAULT 0,
            last_seen   INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, word)
        )
    ''')
    db.execute('''
        CREATE TABLE IF NOT EXISTS user_bkt (
            user_id  TEXT NOT NULL,
            word     TEXT NOT NULL,
            p_known  REAL DEFAULT 0.1,
            attempts INTEGER DEFAULT 0,
            correct  INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, word)
        )
    ''')
    db.commit()
    db.close()

init_db()

# ── Auth helpers ──
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

# ── JLPT cache ──
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


# ════════════════════════════════
#  AUTH ROUTES
# ════════════════════════════════

@app.post("/auth/register")
def register(payload: dict):
    email    = payload.get("email", "").lower().strip()
    password = payload.get("password", "")
    name     = payload.get("name", "").strip()

    if not email or not password or not name:
        raise HTTPException(400, "Email, password and name are required.")
    if len(password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        db.close()
        raise HTTPException(400, "An account with this email already exists.")

    user_id  = str(uuid.uuid4())
    hashed   = hash_password(password)
    db.execute(
        "INSERT INTO users (id, email, name, password, created) VALUES (?,?,?,?,?)",
        (user_id, email, name, hashed, int(datetime.utcnow().timestamp()))
    )
    db.commit()
    db.close()

    token = create_token(user_id)
    return {
        "token": token,
        "user":  { "id": user_id, "email": email, "name": name }
    }


@app.post("/auth/login")
def login(payload: dict):
    email    = payload.get("email", "").lower().strip()
    password = payload.get("password", "")

    if not email or not password:
        raise HTTPException(400, "Email and password are required.")

    db   = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    db.close()

    if not user or not verify_password(password, user["password"]):
        raise HTTPException(401, "Invalid email or password.")

    token = create_token(user["id"])
    return {
        "token": token,
        "user":  { "id": user["id"], "email": user["email"], "name": user["name"] }
    }


@app.get("/auth/me")
def me(user_id: str = Depends(get_current_user)):
    if not user_id:
        raise HTTPException(401, "Not authenticated.")
    db   = get_db()
    user = db.execute("SELECT id, email, name FROM users WHERE id = ?", (user_id,)).fetchone()
    db.close()
    if not user:
        raise HTTPException(404, "User not found.")
    return { "id": user["id"], "email": user["email"], "name": user["name"] }


# ════════════════════════════════
#  EXISTING ROUTES
# ════════════════════════════════

@app.get("/")
def root():
    return {"status": "Kotoba API running"}


@app.get("/words")
def get_words(level: int = 5, limit: int = 50):
    jlpt_words = get_jlpt_words(level)
    db = get_db()
    result = []
    for w in jlpt_words[:limit]:
        jm = enrich_with_jmdict(w.get("word", ""), db)
        result.append({
            "word":     w.get("word"),
            "meaning":  w.get("meaning"),
            "furigana": w.get("furigana"),
            "romaji":   w.get("romaji"),
            "level":    f"N{w.get('level', 5)}",
            **jm
        })
    db.close()
    return {"words": result, "total": len(result)}


@app.get("/quiz")
def get_quiz(level: int = 5, count: int = 8):
    jlpt_words = get_jlpt_words(level)
    db = get_db()
    sample = random.sample(jlpt_words, min(count, len(jlpt_words)))
    questions = []
    for w in sample:
        word_text = w.get("word", "")
        correct   = w.get("meaning", "")
        jm        = enrich_with_jmdict(word_text, db)
        pos       = jm.get("pos", [])
        wrong     = get_distractors(correct, pos, 3, db)
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
    db.close()
    return {"questions": questions}


@app.get("/word/{word}")
def get_word(word: str):
    db = get_db()
    row = db.execute(
        "SELECT * FROM words WHERE kanji = ? OR kana = ? LIMIT 1",
        (word, word)
    ).fetchone()
    db.close()
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


@app.post("/answer")
def save_answer(payload: dict):
    return {"saved": True, "word": payload.get("word")}


@app.get("/stats")
def get_stats():
    return {
        "total_words": 217425,
        "common_words": 22603,
        "levels": ["N5", "N4", "N3", "N2", "N1"]
    }


@app.post("/readiness")
def check_readiness(payload: dict):
    try:
        features = np.array([[
            float(payload.get("accuracy_last_10", 0)),
            float(payload.get("avg_pknown", 0)),
            float(payload.get("avg_ease", 1.3)),
            int(payload.get("mastered_count", 0)),
            int(payload.get("due_count", 0)),
            int(payload.get("streak", 0)),
            int(payload.get("current_level", 1)),
        ]])
        model = get_model()
        score = float(model.predict_proba(features)[0][1])
        ready = score >= 0.7
        return {
            "ready":   ready,
            "score":   round(score, 3),
            "message": "Ready to level up! 🎉" if ready else "Keep practicing at this level."
        }
    except Exception as e:
        return {"error": str(e), "ready": False, "score": 0}