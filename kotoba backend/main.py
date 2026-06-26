# main.py — Kotoba FastAPI Backend
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import sqlite3, json, random, requests, os
import numpy as np
import xgboost as xgb

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB = "jmdict.db"

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
#  ROUTES
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

        wrong = get_distractors(correct, pos, 3, db)

        opts = wrong[:3]
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
    """
    Predict if user is ready to level up using XGBoost.
    Expects:
    {
        accuracy_last_10: float,
        avg_pknown:       float,
        avg_ease:         float,
        mastered_count:   int,
        due_count:        int,
        streak:           int,
        current_level:    int
    }
    Returns: { ready: bool, score: float, message: str }
    """
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