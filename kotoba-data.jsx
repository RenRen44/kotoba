// kotoba-data.jsx
const API = 'http://127.0.0.1:8000';
const SESSION_SIZE = 8;

const REVIEW_WORDS = [
  { w:'食べる', r:'taberu',     m:'to eat'    },
  { w:'便利',   r:'benri',      m:'convenient' },
  { w:'速い',   r:'hayai',      m:'fast'       },
  { w:'難しい', r:'muzukashii', m:'difficult'  },
];

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

async function fetchQuiz(level = 5, count = SESSION_SIZE) {
  try {
    const res = await fetch(`${API}/quiz?level=${level}&count=${count}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return sortByDue(data.questions);  // ← SM-2 sort
  } catch (e) {
    console.warn('API unavailable, using fallback words:', e.message);
    return sortByDue(FALLBACK_BANK);   // ← SM-2 sort
  }
}

Object.assign(window, { API, SESSION_SIZE, REVIEW_WORDS, FALLBACK_BANK, fetchQuiz });