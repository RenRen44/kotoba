# crud.py — SM-2 and BKT, ported from kotoba-sm2.jsx / kotoba-bkt.jsx.
#
# This is the server-side replacement for what your frontend used to do to
# localStorage. Same formulas, same constants — nothing about the algorithm
# itself changes, only where it runs and what it's durable against.
#
# Each function here does ONE database round trip's worth of work and does
# NOT commit — the caller (main.py's /answer route) wraps get-then-update
# for both SM2 and BKT, plus the review_log insert, in a single transaction.
# That matters: if the process crashes between updating SM2 and updating BKT,
# you want either both changes applied or neither — never a review that's
# logged but half-scheduled.

import time
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import UserSM2, UserBKT, ReviewLog

# ── SM-2 constants (unchanged from kotoba-sm2.jsx) ──
SM2_DEFAULT_EASE = 2.5
SM2_MIN_EASE = 1.3

# ── BKT constants (unchanged from kotoba-bkt.jsx) ──
P_LEARN = 0.2
P_GUESS = 0.25
P_SLIP = 0.1
P_KNOWN_INIT = 0.1
MASTERED_THRESHOLD = 0.95


async def get_or_create_sm2(db: AsyncSession, user_id: str, word: str) -> UserSM2:
    row = await db.get(UserSM2, {"user_id": user_id, "word": word})
    if row is None:
        row = UserSM2(user_id=user_id, word=word, interval=1.0, repetitions=0,
                       ease=SM2_DEFAULT_EASE, due=0, last_seen=0)
        db.add(row)
        await db.flush()  # assigns it into the session without committing
    return row


async def get_or_create_bkt(db: AsyncSession, user_id: str, word: str) -> UserBKT:
    row = await db.get(UserBKT, {"user_id": user_id, "word": word})
    if row is None:
        row = UserBKT(user_id=user_id, word=word, p_known=P_KNOWN_INIT, attempts=0, correct=0)
        db.add(row)
        await db.flush()
    return row


def _apply_sm2_update(row: UserSM2, correct: bool, quality: int | None = None) -> None:
    """Mutates row in place. Same math as updateSM2() in kotoba-sm2.jsx."""
    q = quality if quality is not None else (4 if correct else 1)

    if correct:
        if row.repetitions == 0:
            row.interval = 1.0
        elif row.repetitions == 1:
            row.interval = 6.0
        else:
            row.interval = round(row.interval * row.ease)
        row.repetitions += 1
    else:
        row.repetitions = 0
        row.interval = 1.0

    row.ease = row.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    row.ease = max(SM2_MIN_EASE, row.ease)

    now_ms = int(time.time() * 1000)
    row.due = now_ms + int(row.interval * 24 * 60 * 60 * 1000)
    row.last_seen = now_ms


def _apply_bkt_update(row: UserBKT, correct: bool) -> None:
    """Mutates row in place. Same math as updateBKT() in kotoba-bkt.jsx."""
    p_k = row.p_known

    p_correct_if_known = 1 - P_SLIP
    p_correct_if_not_known = P_GUESS

    if correct:
        p_correct = p_k * p_correct_if_known + (1 - p_k) * p_correct_if_not_known
        p_known_given_answer = (p_k * p_correct_if_known) / p_correct
    else:
        p_correct_if_known_wrong = P_SLIP
        p_correct_if_not_known_wrong = 1 - P_GUESS
        p_wrong = p_k * p_correct_if_known_wrong + (1 - p_k) * p_correct_if_not_known_wrong
        p_known_given_answer = (p_k * p_correct_if_known_wrong) / p_wrong

    p_known_after_learning = p_known_given_answer + (1 - p_known_given_answer) * P_LEARN

    row.p_known = min(0.99, p_known_after_learning)
    row.attempts += 1
    row.correct += 1 if correct else 0


async def record_answer(db: AsyncSession, user_id: str, word: str, correct: bool, level: str) -> dict:
    """
    The full "saveAnswer" replacement. Does three things in one transaction:
      1. update (or create) the SM-2 row
      2. update (or create) the BKT row
      3. append one row to review_log (the permanent, replayable history)
    Caller is responsible for db.commit() — see main.py's /answer route,
    so this stays composable/testable without forcing a commit here.
    """
    sm2 = await get_or_create_sm2(db, user_id, word)
    bkt = await get_or_create_bkt(db, user_id, word)

    _apply_sm2_update(sm2, correct)
    _apply_bkt_update(bkt, correct)

    db.add(ReviewLog(
        user_id=user_id,
        word=word,
        correct=1 if correct else 0,
        level=level,
        interval_at_review=sm2.interval,
        ease_at_review=sm2.ease,
        p_known_at_review=bkt.p_known,
        timestamp=int(time.time() * 1000),
    ))

    return {
        "sm2": {"interval": sm2.interval, "repetitions": sm2.repetitions, "ease": sm2.ease, "due": sm2.due},
        "bkt": {"p_known": bkt.p_known, "attempts": bkt.attempts, "correct": bkt.correct},
    }


async def get_due_words(db: AsyncSession, user_id: str) -> list[str]:
    """Words whose SM-2 due date has passed, for this user."""
    now_ms = int(time.time() * 1000)
    result = await db.execute(
        select(UserSM2.word).where(UserSM2.user_id == user_id, UserSM2.due <= now_ms)
    )
    return [row[0] for row in result.all()]


async def get_mastered_words(db: AsyncSession, user_id: str) -> list[str]:
    """Words at or above the BKT mastery threshold, for this user."""
    result = await db.execute(
        select(UserBKT.word).where(UserBKT.user_id == user_id, UserBKT.p_known >= MASTERED_THRESHOLD)
    )
    return [row[0] for row in result.all()]


async def get_user_stats(db: AsyncSession, user_id: str, daily_goal: int = 10) -> dict:
    """
    Everything the Profile and Progress screens need, computed from review_log.

    This replaces the hardcoded demo values that were baked into the frontend
    ("12 day streak", "248 words mastered", "Rank 142"). All of it is derived
    from real rows now.

    Note on timezones: day boundaries are computed in UTC. For a learner in
    IST that means the "day" rolls over at 5:30am local. If that bothers you
    later, store a tz offset on the user and shift `ts` before bucketing —
    the fix belongs here, in one place.
    """
    result = await db.execute(
        select(ReviewLog.correct, ReviewLog.word, ReviewLog.timestamp)
        .where(ReviewLog.user_id == user_id)
        .order_by(ReviewLog.timestamp.asc())
    )
    rows = result.all()

    total = len(rows)
    correct = sum(1 for r in rows if r[0])
    words_seen = len({r[1] for r in rows})

    # Longest run of consecutive correct answers, all time.
    best_combo = cur = 0
    for r in rows:
        cur = cur + 1 if r[0] else 0
        best_combo = max(best_combo, cur)

    DAY_MS = 86_400_000
    day_numbers = sorted({int(r[2]) // DAY_MS for r in rows})
    study_days = len(day_numbers)

    today = int(time.time() * 1000) // DAY_MS
    answered_today = sum(1 for r in rows if int(r[2]) // DAY_MS == today)

    # Day streak: walk backwards from today (or yesterday, so the streak
    # isn't shown as broken before you've studied yet on the current day).
    day_streak = 0
    if day_numbers:
        day_set = set(day_numbers)
        cursor = today if today in day_set else today - 1
        while cursor in day_set:
            day_streak += 1
            cursor -= 1

    mastered = await get_mastered_words(db, user_id)
    due = await get_due_words(db, user_id)

    return {
        "total_answers": total,
        "correct_answers": correct,
        "accuracy": round((correct / total) * 100) if total else 0,
        "words_seen": words_seen,
        "mastered_count": len(mastered),
        "due_count": len(due),
        "study_days": study_days,
        "day_streak": day_streak,
        "best_combo": best_combo,
        "daily_goal": daily_goal,
        "answered_today": answered_today,
    }


async def get_readiness_features(db: AsyncSession, user_id: str, current_level: int) -> dict:
    """
    Computes the exact feature set /readiness needs, server-side, from real
    rows — instead of trusting numbers the client sent in the request body
    (which is what the old endpoint did, and which anyone could fake).
    """
    # last 10 answers, most recent first
    result = await db.execute(
        select(ReviewLog.correct)
        .where(ReviewLog.user_id == user_id)
        .order_by(ReviewLog.timestamp.desc())
        .limit(10)
    )
    last10 = [row[0] for row in result.all()]
    accuracy_last_10 = (sum(last10) / len(last10)) if last10 else 0.0

    bkt_result = await db.execute(select(UserBKT.p_known).where(UserBKT.user_id == user_id))
    p_knowns = [row[0] for row in bkt_result.all()]
    avg_pknown = (sum(p_knowns) / len(p_knowns)) if p_knowns else 0.0

    sm2_result = await db.execute(select(UserSM2.ease).where(UserSM2.user_id == user_id))
    eases = [row[0] for row in sm2_result.all()]
    avg_ease = (sum(eases) / len(eases)) if eases else SM2_DEFAULT_EASE

    mastered = await get_mastered_words(db, user_id)
    due = await get_due_words(db, user_id)

    # "streak" here = best correct-in-a-row across the whole review log.
    # Cheap enough at this scale; if review_log grows very large per user,
    # this is the first place to add a maintained counter instead of
    # recomputing it from scratch.
    all_result = await db.execute(
        select(ReviewLog.correct).where(ReviewLog.user_id == user_id).order_by(ReviewLog.timestamp.asc())
    )
    best_streak = cur_streak = 0
    for (c,) in all_result.all():
        cur_streak = cur_streak + 1 if c else 0
        best_streak = max(best_streak, cur_streak)

    return {
        "accuracy_last_10": accuracy_last_10,
        "avg_pknown": avg_pknown,
        "avg_ease": avg_ease,
        "mastered_count": len(mastered),
        "due_count": len(due),
        "streak": best_streak,
        "current_level": current_level,
    }
