# distractors.py — builds the 4 answer options for a quiz question.
#
# The old approach (get_distractors in main.py) pulled 3 random common JMdict
# entries with the same first part-of-speech tag and used their first gloss.
# Measured against the real N5 list that produced:
#   • obscure words a beginner has never seen ("tommy gun", "lymph",
#     "inexcusable")
#   • near-duplicates of the right answer — 持つ "to hold" got the wrong
#     option "to hold (in one's hand)", i.e. two correct answers
#   • long options (up to 120 characters) that overflowed the answer buttons
#
# The new approach:
#   1. Wrong answers come from OTHER WORDS AT THE SAME JLPT LEVEL. Their
#      meanings are short, familiar, and exactly the vocabulary the learner is
#      mixing up anyway.
#   2. Candidates must be the same kind of word (verb / adjective / noun /
#      adverb), so a verb never gets "fork" as an option.
#   3. Candidates that SHARE A KANJI with the question word score highest —
#      学校 (school) gets 学生 (student) and 大学 (university), so you have to
#      actually read the word rather than guess from the answer's shape.
#   4. Length is matched to the correct answer, and every option — including
#      the correct one — is cleaned down to a short form
#      ("to stretch out hands, to raise an umbrella" → "to stretch out hands").
#   5. Anything sharing a content word with the right answer is excluded, so
#      "hot" and "hot to the touch" can't both appear.
#
# Only if a level doesn't have enough suitable words does it fall back to
# common JMdict entries — and those go through the same cleaning and length
# filters.

import json
import random
import re

# ── Text cleaning ────────────────────────────────────────────────────────────

_ZERO_WIDTH = re.compile(r"[​-‍﻿]")
_PARENS     = re.compile(r"\s*[\(\[（][^\)\]）]*[\)\]）]\s*")
_NUMBERING  = re.compile(r"\(\d+\)\s*")
_TRAILING   = re.compile(r"(\s*(etc\.?|…|\.\.\.))+\s*$", re.I)
_SPACES     = re.compile(r"\s+")

# Words that don't carry meaning when comparing two answers for overlap.
_STOP = {
    "to", "a", "an", "the", "be", "of", "in", "on", "at", "for", "with", "by",
    "something", "someone", "somebody", "one", "one's", "oneself", "up", "out",
    "off", "or", "and", "is", "get", "become", "very", "do", "make",
}

MAX_WORDS = 4     # options longer than this are too long for a quick-read button
MAX_CHARS = 26    # hard ceiling; CSS also wraps gracefully past this


def clean_gloss(text: str, prefer_verb: bool = False) -> str:
    """
    Shorten a dictionary/JLPT meaning to one short, readable sense.

      "(honorable) father"                         → "father"
      "to stretch out hands, to raise an umbrella" → "to stretch out hands"
      "animal noise. to chirp, roar or croak etc." → "to chirp"   (verb)
      "(1) one day, (2) first of month"            → "one day"
      "to hold (in one's hand)"                    → "to hold"
    """
    if not text:
        return ""
    t = _ZERO_WIDTH.sub("", text)
    t = _NUMBERING.sub("", t)
    t = _PARENS.sub(" ", t)
    segments = [s.strip() for s in re.split(r"[;,]|\.\s", t) if s.strip()]
    if not segments:
        return ""

    chosen = segments[0]
    if prefer_verb:
        for s in segments:
            if s.lower().startswith("to "):
                chosen = s
                break

    chosen = _TRAILING.sub("", chosen)
    chosen = _SPACES.sub(" ", chosen).strip(" .")
    return chosen


def content_words(text: str) -> set:
    return {w for w in re.findall(r"[a-z']+", text.lower()) if w not in _STOP}


def word_count(text: str) -> int:
    return len(text.split())


def is_short(text: str) -> bool:
    return 0 < len(text) <= MAX_CHARS and word_count(text) <= MAX_WORDS


def fits(text: str) -> bool:
    """Looser check for pool entries: short enough to sit on a button."""
    return 0 < len(text) <= MAX_CHARS and word_count(text) <= MAX_WORDS + 1


# ── Word category (what kind of word is it) ─────────────────────────────────

def category(meaning: str, pos_tags: list) -> str:
    """
    verb / adj / noun / adv / other.

    The shape of the English meaning wins over JMdict's tag: 練習 is tagged
    as a noun in JMdict, but the JLPT list glosses it "to practice", so its
    options should also be "to ..." verbs.
    """
    if meaning.lower().startswith("to "):
        return "verb"
    first = pos_tags[0] if pos_tags else ""
    if first.startswith("v"):
        return "verb"
    if first.startswith("adj"):
        return "adj"
    if first.startswith("adv"):
        return "adv"
    if first in ("n", "n-adv", "n-t", "n-pref", "n-suf", "pn", "ctr", "num"):
        return "noun"
    return "other"


def _kanji(word: str) -> set:
    return {ch for ch in word if "一" <= ch <= "鿿"}


# ── Word families ───────────────────────────────────────────────────────────
# When the answer belongs to a family, the wrong options should come from the
# same family: 六 "six" is tested against other numbers, 火曜日 "Tuesday"
# against other weekdays. That's the mix-up a learner actually makes.
_FAMILIES = {
    "number":    {"zero", "one", "two", "three", "four", "five", "six", "seven",
                  "eight", "nine", "ten", "hundred", "thousand", "million"},
    "weekday":   {"monday", "tuesday", "wednesday", "thursday", "friday",
                  "saturday", "sunday"},
    "colour":    {"red", "blue", "green", "yellow", "white", "black", "brown"},
    "direction": {"north", "south", "east", "west", "left", "right", "above",
                  "below", "behind", "middle", "outside", "inside"},
    "season":    {"spring", "summer", "autumn", "winter"},
    "time":      {"morning", "afternoon", "evening", "night", "today", "tomorrow",
                  "yesterday", "week", "month", "year", "day", "noon", "now"},
    "family":    {"father", "mother", "brother", "sister", "parents", "wife",
                  "husband", "siblings", "child", "grandmother", "grandfather",
                  "aunt", "uncle", "family"},
    "body":      {"head", "eye", "ear", "nose", "mouth", "tooth", "hand", "foot",
                  "leg", "body", "stomach"},
    "weather":   {"rain", "snow", "wind", "sky", "weather", "cloudy", "sunny"},
    "food":      {"meat", "fish", "egg", "bread", "rice", "vegetable", "fruit",
                  "pork", "beef", "sugar", "salt", "milk", "tea", "coffee",
                  "curry", "butter", "candy", "sweets", "breakfast", "meal"},
}


def family_of(text: str) -> str | None:
    words = set(re.findall(r"[a-z]+", text.lower()))
    for name, members in _FAMILIES.items():
        if words & members:
            return name
    return None


# ── Per-level pool (built once per process, then cached) ────────────────────

_pools: dict = {}


def _lookup_pos(word: str, jm_db) -> list:
    row = jm_db.execute(
        "SELECT pos FROM words WHERE kanji = ? OR kana = ? LIMIT 1", (word, word)
    ).fetchone()
    if not row:
        return []
    try:
        return json.loads(row["pos"] or "[]")
    except (TypeError, ValueError):
        return []


# Where a long phrase can be cut without changing what it means:
#   "to put on from the shoulders down"          → "to put on"
#   "to play an instrument with strings"         → "to play an instrument"
#   "to take a photo or record a film"           → "to take a photo"
_TRIM_AT = re.compile(
    r"\s+(?:from|with|including|e\.g\.?|such as|or|when|while|used for|"
    r"which|that|because)\s+.*$",
    re.I,
)


def short_meaning(word: str, meaning: str, pos_tags: list, jm_db=None) -> str:
    """
    The display form of the CORRECT answer: the JLPT meaning, cleaned, and
    trimmed at a natural phrase boundary if it's still too long.

    Deliberately does NOT substitute a JMdict gloss — a kanji can have several
    readings (弾く is both ひく "to play an instrument" and はじく "to flip"),
    and a short wrong answer is worse than a slightly long right one.
    """
    is_verb = category(meaning, pos_tags) == "verb"
    text = clean_gloss(meaning, prefer_verb=is_verb)
    if is_short(text):
        return text

    trimmed = _TRIM_AT.sub("", text).strip()
    if trimmed and word_count(trimmed) >= (2 if is_verb else 1) and is_short(trimmed):
        return trimmed

    if not text:
        return meaning
    base = trimmed or text
    # Slightly over the word count but still fits ("to come to a halt"): keep it
    # whole rather than chopping it into nonsense.
    if len(base) <= MAX_CHARS:
        return base
    # Last resort: first MAX_WORDS words, never ending on a filler word.
    words = base.split()[:MAX_WORDS]
    while len(words) > 1 and words[-1].lower() in _STOP:
        words.pop()
    return " ".join(words)


def get_level_pool(level: int, jlpt_words: list, jm_db) -> list:
    """Every word at this level, pre-processed for fast candidate scoring."""
    if level in _pools:
        return _pools[level]

    pool, seen = [], set()
    for w in jlpt_words:
        word = (w.get("word") or "").strip()
        raw  = w.get("meaning") or ""
        if not word or not raw:
            continue
        pos  = _lookup_pos(word, jm_db)
        text = short_meaning(word, raw, pos, jm_db)
        key  = text.lower()
        if not fits(text) or key in seen:
            continue
        seen.add(key)
        pool.append({
            "word":    word,
            "text":    text,
            "cat":     category(raw, pos),
            "kanji":   _kanji(word),
            "content": content_words(text),
            "words":   word_count(text),
            "family":  family_of(text),
        })

    _pools[level] = pool
    return pool


# ── Picking the distractors ─────────────────────────────────────────────────

def _score(target_word: str, target_text: str, target_family, cand: dict,
           rng: random.Random) -> float:
    s = 0.0
    shared = len(_kanji(target_word) & cand["kanji"])
    s += 3.0 * shared                                            # looks similar
    if target_family and cand["family"] == target_family:
        s += 4.0                                                 # same kind of thing
    s -= 1.0 * abs(word_count(target_text) - cand["words"])      # similar shape
    s -= abs(len(target_text) - len(cand["text"])) / 8.0         # similar length
    s += rng.uniform(0, 1.6)                                     # variety between sessions
    return s


def _jmdict_fallback(pos_tags, cat, exclude_text, exclude_content, need, jm_db, rng):
    """Common JMdict entries, cleaned and length-filtered. Only used when the
    level pool can't supply enough same-type words."""
    if pos_tags:
        rows = jm_db.execute(
            "SELECT meanings FROM words WHERE pos LIKE ? AND is_common = 1 "
            "ORDER BY RANDOM() LIMIT 60",
            (f'%"{pos_tags[0]}"%',),
        ).fetchall()
    else:
        rows = jm_db.execute(
            "SELECT meanings FROM words WHERE is_common = 1 ORDER BY RANDOM() LIMIT 60"
        ).fetchall()

    out = []
    for r in rows:
        text = clean_gloss(r["meanings"] or "", prefer_verb=(cat == "verb"))
        if not is_short(text) or word_count(text) > 3:
            continue
        if cat == "verb" and not text.lower().startswith("to "):
            continue
        if text.lower() in exclude_text or (content_words(text) & exclude_content):
            continue
        exclude_text.add(text.lower())
        exclude_content |= content_words(text)
        out.append(text)
        if len(out) == need:
            break
    return out


def build_options(word: str, raw_meaning: str, pos_tags: list, level_pool: list,
                  jm_db, rng: random.Random | None = None):
    """
    Returns (options, correct_index). Always 4 options, all short and distinct.
    """
    rng = rng or random.Random()
    cat = category(raw_meaning, pos_tags)
    correct = short_meaning(word, raw_meaning, pos_tags, jm_db)

    used_text    = {correct.lower()}
    used_content = set(content_words(correct))
    fam          = family_of(correct)

    def eligible(c, same_cat=True):
        if c["word"] == word or c["text"].lower() in used_text:
            return False
        if c["content"] & used_content:
            return False
        # Same family beats same word type: for 赤い "red", the noun 黒
        # "black" is a better wrong answer than an unrelated adjective.
        if fam and c["family"] == fam:
            return True
        if same_cat and cat != "other" and c["cat"] != cat:
            return False
        return True

    # Same word type first; relax the type filter only if the level is short
    # of candidates (e.g. rare adverbs).
    candidates = [c for c in level_pool if eligible(c)]
    if len(candidates) < 3:
        candidates = [c for c in level_pool if eligible(c, same_cat=False)]

    ranked = sorted(candidates, key=lambda c: _score(word, correct, fam, c, rng), reverse=True)

    distractors = []
    for c in ranked:
        # re-check: an earlier pick may now overlap with this one
        if c["text"].lower() in used_text or (c["content"] & used_content):
            continue
        distractors.append(c["text"])
        used_text.add(c["text"].lower())
        used_content |= c["content"]
        if len(distractors) == 3:
            break

    if len(distractors) < 3:
        distractors += _jmdict_fallback(pos_tags, cat, used_text, used_content,
                                        3 - len(distractors), jm_db, rng)

    # Absolute last resort so the UI always gets 4 buttons.
    filler = iter(["water", "to go", "big", "tomorrow", "friend", "to eat"])
    while len(distractors) < 3:
        f = next(filler)
        if f.lower() not in used_text:
            distractors.append(f)
            used_text.add(f.lower())

    correct_idx = rng.randint(0, 3)
    options = distractors[:3]
    options.insert(correct_idx, correct)
    return options, correct_idx
