// kotoba-sm2.jsx
// SM-2 Spaced Repetition Algorithm
// Stores per-word state in localStorage under 'kotoba_sm2'
//
// Each word record looks like:
// {
//   interval:    number,   // days until next review
//   repetitions: number,   // correct streak count
//   ease:        number,   // difficulty multiplier (min 1.3)
//   due:         number,   // timestamp (ms) when word is next due
//   lastSeen:    number,   // timestamp of last answer
// }

const SM2_KEY = 'kotoba_sm2';

// ── Defaults for a brand new word ──
const SM2_DEFAULTS = {
  interval:    1,
  repetitions: 0,
  ease:        2.5,
  due:         0,       // 0 means "due immediately" (never seen before)
  lastSeen:    null,
};

// ── Get SM-2 record for a word (returns defaults if never seen) ──
function getSM2(word) {
  try {
    const store = JSON.parse(localStorage.getItem(SM2_KEY) || '{}');
    return store[word] ? { ...SM2_DEFAULTS, ...store[word] } : { ...SM2_DEFAULTS };
  } catch (e) {
    return { ...SM2_DEFAULTS };
  }
}

// ── Update SM-2 record after an answer ──
// correct: boolean
// quality: optional override (0-5). If not passed, correct=4, wrong=1
function updateSM2(word, correct, quality) {
  try {
    const store = JSON.parse(localStorage.getItem(SM2_KEY) || '{}');
    const r = getSM2(word);

    // Quality score: 4 = correct, 1 = wrong (classic SM-2 uses 0-5)
    const q = quality !== undefined ? quality : (correct ? 4 : 1);

    if (correct) {
      // Interval grows based on repetition count
      if (r.repetitions === 0) {
        r.interval = 1;
      } else if (r.repetitions === 1) {
        r.interval = 6;
      } else {
        r.interval = Math.round(r.interval * r.ease);
      }
      r.repetitions += 1;
    } else {
      // Wrong answer — reset streak, back to day 1
      r.repetitions = 0;
      r.interval = 1;
    }

    // Ease factor update (SM-2 formula)
    r.ease = r.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    r.ease = Math.max(1.3, r.ease); // never go below 1.3

    // Schedule next review
    r.due = Date.now() + r.interval * 24 * 60 * 60 * 1000;
    r.lastSeen = Date.now();

    store[word] = r;
    localStorage.setItem(SM2_KEY, JSON.stringify(store));
    return r;
  } catch (e) {
    console.warn('SM-2 update failed:', e);
    return getSM2(word);
  }
}

// ── Get all words that are due for review right now ──
function getDueWords() {
  try {
    const store = JSON.parse(localStorage.getItem(SM2_KEY) || '{}');
    const now = Date.now();
    return Object.entries(store)
      .filter(([_, r]) => r.due <= now)
      .map(([word, r]) => ({ word, ...r }));
  } catch (e) {
    return [];
  }
}

// ── Get count of words due today ──
function getDueCount() {
  return getDueWords().length;
}

// ── Get next review date for a word (human readable) ──
function getNextReview(word) {
  const r = getSM2(word);
  if (!r.lastSeen) return 'New';
  if (r.due <= Date.now()) return 'Due now';

  const days = Math.round((r.due - Date.now()) / (24 * 60 * 60 * 1000));
  if (days === 1) return 'Tomorrow';
  if (days < 7)  return `In ${days} days`;
  if (days < 30) return `In ${Math.round(days / 7)} weeks`;
  return `In ${Math.round(days / 30)} months`;
}

// ── Sort a list of quiz questions — due words first, new words second ──
// questions: array of { w, r, lv, opts, c }
function sortByDue(questions) {
  const now = Date.now();
  return [...questions].sort((a, b) => {
    const ra = getSM2(a.w);
    const rb = getSM2(b.w);

    // Never seen before → treat as due
    const dueA = ra.lastSeen ? ra.due : 0;
    const dueB = rb.lastSeen ? rb.due : 0;

    // Both due (or new) → sort by most overdue first
    const aDue = dueA <= now;
    const bDue = dueB <= now;

    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    if (aDue && bDue)  return dueA - dueB; // most overdue first
    return dueA - dueB; // both future — soonest first
  });
}
function saveAnswer(word, correct, level) {
  updateSM2(word, correct);  // ← ADD THIS
  try {
    const existing = JSON.parse(localStorage.getItem('kotoba_answers') || '[]');
    // ... rest stays the same
  } catch (e) {
    console.error('Error saving answer:', e);
  }
}
async function fetchQuiz(level = 5, count = SESSION_SIZE) {
  try {
    const res = await fetch(`${API}/quiz?level=${level}&count=${count}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return sortByDue(data.questions);  // ← was just data.questions
  } catch (e) {
    console.warn('API unavailable, using fallback words:', e.message);
    return sortByDue(FALLBACK_BANK);   // ← was just FALLBACK_BANK
  }
}

// ── Debug helper: log the full SM-2 store ──
function debugSM2() {
  const store = JSON.parse(localStorage.getItem(SM2_KEY) || '{}');
  console.table(
    Object.entries(store).map(([word, r]) => ({
      word,
      interval:    r.interval,
      repetitions: r.repetitions,
      ease:        r.ease.toFixed(2),
      due:         getNextReview(word),
    }))
  );
}

// ── Expose to window so other files can use these ──
Object.assign(window, {
  getSM2,
  updateSM2,
  getDueWords,
  getDueCount,
  getNextReview,
  sortByDue,
  debugSM2,
});