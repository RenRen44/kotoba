// kotoba-data.jsx
const API = 'https://kotoba-jz96.onrender.com';
const SESSION_SIZE = 8;

const REVIEW_WORDS = [
  { w:'食べる', r:'taberu',     m:'to eat'    },
  { w:'便利',   r:'benri',      m:'convenient' },
  { w:'速い',   r:'hayai',      m:'fast'       },
  { w:'難しい', r:'muzukashii', m:'difficult'  },
];

// Offline safety net only. Used when the API is unreachable (Render cold
// start, no network). The real word bank is JMdict on the server.
const FALLBACK_BANK = [
  { w:'食べる', r:'taberu',     opts:['to eat','to drink','to sleep','to buy'],             c:0, lv:'N5' },
  { w:'水',     r:'mizu',       opts:['fire','water','wind','earth'],                        c:1, lv:'N5' },
  { w:'速い',   r:'hayai',      opts:['slow','quiet','fast','heavy'],                        c:2, lv:'N5' },
  { w:'学校',   r:'gakkō',      opts:['hospital','station','library','school'],              c:3, lv:'N5' },
  { w:'新しい', r:'atarashii',  opts:['new','old','cheap','difficult'],                      c:0, lv:'N5' },
  { w:'友達',   r:'tomodachi',  opts:['teacher','friend','family','stranger'],               c:1, lv:'N5' },
  { w:'飲む',   r:'nomu',       opts:['to read','to write','to drink','to walk'],            c:2, lv:'N5' },
  { w:'便利',   r:'benri',      opts:['boring','famous','dangerous','convenient'],           c:3, lv:'N5' },
];

/*
  fetchQuiz — now authenticated.

  Two things changed when the scheduling moved server-side:

  1. /quiz requires an Authorization header. Without it the API returns 401
     and this used to fall through to FALLBACK_BANK silently — the app
     looked fine but was serving the same 8 hardcoded words forever.

  2. The "filter out mastered words" step is gone from here. The server
     already excludes words this user has mastered (BKT p_known >= 0.95)
     and orders what's left by SM-2 due date, using the real stored state
     rather than whatever this browser happened to have cached.

  isOffline on the result lets the caller tell the user why they're seeing
  the fallback, instead of pretending everything is normal.
*/
async function fetchQuiz(level = 5, count = SESSION_SIZE) {
  try {
    const res = await authFetch(`/quiz?level=${level}&count=${count}`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    const questions = Array.isArray(data.questions) ? data.questions : [];
    if (questions.length === 0) throw new Error('No questions returned');
    return { questions, isOffline: false };
  } catch (e) {
    console.warn('Quiz API unavailable, using fallback words:', e.message);
    return { questions: FALLBACK_BANK.slice(0, count), isOffline: true };
  }
}

Object.assign(window, { API, SESSION_SIZE, REVIEW_WORDS, FALLBACK_BANK, fetchQuiz });
