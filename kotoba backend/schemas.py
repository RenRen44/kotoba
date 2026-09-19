# schemas.py — request/response validation.
#
# Your current main.py takes raw `dict` payloads and does payload.get("email", "")
# everywhere. That works, but it means a malformed request (wrong type, missing
# field) fails deep inside your logic with a confusing error instead of FastAPI
# rejecting it up front with a clear 422. Pydantic models fix that for free —
# FastAPI validates automatically before your function body even runs.

from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AuthOut(BaseModel):
    token: str
    user: dict  # {id, email, name} — kept loose to match existing frontend expectations


class AnswerIn(BaseModel):
    word: str
    correct: bool
    level: str = ""
    # Optional client-side timestamp for display/ordering only.
    # The server sets its own authoritative timestamp — never trust the client's clock
    # for anything that feeds the readiness model.
    client_time: int | None = None


class AnswerOut(BaseModel):
    saved: bool
    word: str
    sm2: dict     # {interval, repetitions, ease, due}
    bkt: dict     # {p_known, attempts, correct}


class ReadinessOut(BaseModel):
    ready: bool
    score: float
    message: str


# ── Profile ──

class ProfileOut(BaseModel):
    id: str
    email: str
    name: str
    why: str | None = None
    level: str | None = None
    daily_goal: int = 10
    jlpt_level: int = 5
    onboarded: bool = False
    created: int = 0
    avatar: str | None = None


class ProfileUpdateIn(BaseModel):
    """
    Every field optional — send only what changed. This doubles as the
    onboarding save (why + level + daily_goal + onboarded together) and as
    ordinary profile editing later on.
    """
    name: str | None = Field(default=None, min_length=1, max_length=80)
    why: str | None = None
    level: str | None = None
    daily_goal: int | None = Field(default=None, ge=1, le=200)
    jlpt_level: int | None = Field(default=None, ge=1, le=5)
    onboarded: bool | None = None
    # Data URL (e.g. "data:image/webp;base64,...."). The frontend downsizes
    # the image client-side before sending it — see AvatarPicker in
    # kotoba-views.jsx — so this cap is a backstop, not the primary limit.
    avatar: str | None = Field(default=None, max_length=2_000_000)


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class StatsOut(BaseModel):
    total_answers: int
    correct_answers: int
    accuracy: int              # 0–100, already rounded for display
    words_seen: int
    mastered_count: int
    due_count: int
    study_days: int
    day_streak: int            # consecutive calendar days with activity
    best_combo: int            # longest run of correct answers, all time
    daily_goal: int
    answered_today: int