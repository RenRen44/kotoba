// kotoba-bkt.jsx
// Bayesian Knowledge Tracing (BKT)
// Tracks P(known) per word — probability the user actually knows it
// Stores state in localStorage under 'kotoba_bkt'
//
// Each word record:
// {
//   pKnown:   number,  // probability of knowing (0-1)
//   attempts: number,  // total times seen
//   correct:  number,  // total correct answers
// }

const BKT_KEY = 'kotoba_bkt';

// ── BKT Parameters ──
const P_LEARN = 0.2;       // chance of learning after one exposure
const P_GUESS = 0.25;      // chance of guessing right without knowing
const P_SLIP  = 0.1;       // chance of getting it wrong even if you know it
const P_KNOWN_INIT = 0.1;  // starting probability for a new word
const MASTERED_THRESHOLD = 0.95; // above this = mastered

// ── Get BKT record for a word ──
function getBKT(word) {
  try {
    const store = JSON.parse(localStorage.getItem(BKT_KEY) || '{}');
    return store[word] || { pKnown: P_KNOWN_INIT, attempts: 0, correct: 0 };
  } catch (e) {
    return { pKnown: P_KNOWN_INIT, attempts: 0, correct: 0 };
  }
}

// ── Update BKT after an answer ──
function updateBKT(word, correct) {
  try {
    const store = JSON.parse(localStorage.getItem(BKT_KEY) || '{}');
    const r = getBKT(word);

    const pK = r.pKnown;

    // Step 1 — P(correct | known) and P(correct | not known)
    const pCorrectIfKnown    = 1 - P_SLIP;
    const pCorrectIfNotKnown = P_GUESS;

    // Step 2 — P(known | answer) using Bayes theorem
    let pKnownGivenAnswer;
    if (correct) {
      const pCorrect = pK * pCorrectIfKnown + (1 - pK) * pCorrectIfNotKnown;
      pKnownGivenAnswer = (pK * pCorrectIfKnown) / pCorrect;
    } else {
      const pCorrectIfKnownWrong    = P_SLIP;
      const pCorrectIfNotKnownWrong = 1 - P_GUESS;
      const pWrong = pK * pCorrectIfKnownWrong + (1 - pK) * pCorrectIfNotKnownWrong;
      pKnownGivenAnswer = (pK * pCorrectIfKnownWrong) / pWrong;
    }

    // Step 3 — apply learning rate
    const pKnownAfterLearning = pKnownGivenAnswer + (1 - pKnownGivenAnswer) * P_LEARN;

    // Step 4 — update record
    r.pKnown   = Math.min(0.99, pKnownAfterLearning);
    r.attempts += 1;
    r.correct  += correct ? 1 : 0;

    store[word] = r;
    localStorage.setItem(BKT_KEY, JSON.stringify(store));
    return r;
  } catch (e) {
    console.warn('BKT update failed:', e);
    return getBKT(word);
  }
}

// ── Is a word mastered? ──
function isMastered(word) {
  return getBKT(word).pKnown >= MASTERED_THRESHOLD;
}

// ── Get all mastered words ──
function getMasteredWords() {
  try {
    const store = JSON.parse(localStorage.getItem(BKT_KEY) || '{}');
    return Object.entries(store)
      .filter(([_, r]) => r.pKnown >= MASTERED_THRESHOLD)
      .map(([word, r]) => ({ word, ...r }));
  } catch (e) {
    return [];
  }
}

// ── Get mastered count ──
function getMasteredCount() {
  return getMasteredWords().length;
}

// ── Get P(known) as a percentage string ──
function getKnownPercent(word) {
  return Math.round(getBKT(word).pKnown * 100) + '%';
}

// ── Debug helper ──
function debugBKT() {
  const store = JSON.parse(localStorage.getItem(BKT_KEY) || '{}');
  console.table(
    Object.entries(store).map(([word, r]) => ({
      word,
      pKnown:   (r.pKnown * 100).toFixed(1) + '%',
      attempts: r.attempts,
      correct:  r.correct,
      mastered: r.pKnown >= MASTERED_THRESHOLD ? '✅' : '❌',
    }))
  );
}

Object.assign(window, {
  getBKT,
  updateBKT,
  isMastered,
  getMasteredWords,
  getMasteredCount,
  getKnownPercent,
  debugBKT,
});