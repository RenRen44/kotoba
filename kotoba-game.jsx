// kotoba-game.jsx — the quiz
//
// Layout (mobile-first):
//   ┌ top bar: close · progress · streak-in-a-row · n/total
//   ├ word card: level + prompt · kana reading · WORD (auto-sized) · romaji
//   ├ answers: one column on phones, 2×2 on wide screens
//   └ feedback bar: slides up after answering. Correct → moves on by itself.
//                    Wrong → shows the right answer and waits for "Continue",
//                    so you actually get to read it.
//
// On phones the App hides the top bar and bottom nav while this is on screen
// (see .app.playing in kotoba.css) — they used to sit on top of the answers.

function Confetti({ trigger }) {
  const bits = React.useMemo(() => {
    const cols = ['#F3B24E', '#F1855A', '#5FAE8E', '#8C82C9'];
    return Array.from({ length: 14 }, () => {
      const a = Math.random() * Math.PI * 2;
      const d = 50 + Math.random() * 110;
      return {
        cx: (Math.cos(a) * d).toFixed(1) + 'px',
        cy: (Math.sin(a) * d - 30).toFixed(1) + 'px',
        cr: (Math.random() * 540 - 270).toFixed(1) + 'deg',
        bg: cols[Math.floor(Math.random() * cols.length)],
        size: (4 + Math.random() * 4).toFixed(1) + 'px',
        delay: (Math.random() * 0.1).toFixed(2) + 's',
      };
    });
  }, [trigger]);

  if (!trigger) return null;
  return (
    <div className="confetti go" key={trigger} aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} style={{
          '--cx': b.cx, '--cy': b.cy, '--cr': b.cr,
          background: b.bg, width: b.size, height: b.size, animationDelay: b.delay,
        }}/>
      ))}
    </div>
  );
}

/*
  saveAnswer — writes to the server.

  The server owns scheduling: POST /answer updates this user's SM-2 row and
  BKT row and appends to the permanent review_log, all in one transaction.
  The local SM-2/BKT stores are only a display cache.

  Fire-and-forget: the answer animation never waits on the network. If the
  POST fails the answer is queued in localStorage and retried later.
*/
function saveAnswer(word, correct, level) {
  try { updateSM2(word, correct); } catch (e) {}
  try { updateBKT(word, correct); } catch (e) {}

  const payload = { word, correct, level: level || '', client_time: Date.now() };

  authFetch('/answer', { method: 'POST', body: JSON.stringify(payload) })
    .then(res => { if (!res.ok) throw new Error('status ' + res.status); })
    .catch(err => {
      console.warn('Answer not saved to server, queued for retry:', err.message);
      queueAnswer(payload);
    });
}

// ── Offline queue ──
const ANSWER_QUEUE_KEY = 'kotoba_answer_queue';

function readQueue() {
  try { return JSON.parse(localStorage.getItem(ANSWER_QUEUE_KEY) || '[]'); }
  catch (e) { return []; }
}

function queueAnswer(payload) {
  try {
    const q = readQueue();
    q.push(payload);
    // Bounded so a long offline stretch can't fill storage.
    localStorage.setItem(ANSWER_QUEUE_KEY, JSON.stringify(q.slice(-200)));
  } catch (e) {}
}

/*
  Replays answers that failed to send. Runs in the background — the quiz no
  longer waits for it (with a big queue that used to add seconds of loading).
  Stops at the first failure (the server is probably still down) and only
  removes the entries it actually delivered, so answers queued while it runs
  aren't overwritten.
*/
let _flushing = false;
async function flushAnswerQueue() {
  if (_flushing) return;
  _flushing = true;
  try {
    const snapshot = readQueue();
    const sent = new Set();
    for (const payload of snapshot) {
      try {
        const res = await authFetch('/answer', { method: 'POST', body: JSON.stringify(payload) });
        if (!res.ok) break;
        sent.add(payload.client_time + '|' + payload.word);
      } catch (e) { break; }
    }
    if (sent.size) {
      const remaining = readQueue().filter(p => !sent.has(p.client_time + '|' + p.word));
      try { localStorage.setItem(ANSWER_QUEUE_KEY, JSON.stringify(remaining)); } catch (e) {}
    }
  } finally {
    _flushing = false;
  }
}

const ANSWER_KEYS = ['A', 'B', 'C', 'D'];
const CORRECT_DELAY = 850;   // ms before moving on after a right answer

function Game({ onComplete, onExit, level = 5 }) {
  const [session, setSession] = React.useState(null);
  const [offline, setOffline] = React.useState(false);
  const [idx,     setIdx]     = React.useState(0);
  const [sel,     setSel]     = React.useState(null);
  const [status,  setStatus]  = React.useState('idle');   // idle | correct | wrong
  const [combo,   setCombo]   = React.useState(0);
  const [best,    setBest]    = React.useState(0);
  const [correct, setCorrect] = React.useState(0);
  const [conf,    setConf]    = React.useState(0);
  const [wrong,   setWrong]   = React.useState([]);
  const advanceTimer = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;
    flushAnswerQueue();                       // background, not awaited
    fetchQuiz(level, SESSION_SIZE).then(({ questions, isOffline }) => {
      if (cancelled) return;
      setSession(questions);
      setOffline(isOffline);
    });
    return () => { cancelled = true; clearTimeout(advanceTimer.current); };
  }, [level]);

  const total = session ? session.length : 0;
  const q     = session ? session[idx] : null;
  const last  = session ? idx + 1 >= total : false;

  function finish(finalCorrect, finalBest, finalWrong) {
    onComplete({ correct: finalCorrect, total, best: finalBest, wrongWords: finalWrong, level });
  }

  function advance() {
    clearTimeout(advanceTimer.current);
    if (last) {
      finish(correct, best, wrong);
      return;
    }
    setIdx(i => i + 1);
    setSel(null);
    setStatus('idle');
  }

  function pick(i) {
    if (!q || status !== 'idle') return;
    const right = i === q.c;
    setSel(i);
    setStatus(right ? 'correct' : 'wrong');
    saveAnswer(q.w, right, q.lv);

    if (right) {
      const nc = combo + 1;
      setCombo(nc);
      setBest(b => Math.max(b, nc));
      setCorrect(c => c + 1);
      setConf(t => t + 1);
      advanceTimer.current = setTimeout(() => {
        if (last) finish(correct + 1, Math.max(best, nc), wrong);
        else { setIdx(v => v + 1); setSel(null); setStatus('idle'); }
      }, CORRECT_DELAY);
    } else {
      setCombo(0);
      setWrong(w => [...w, { w: q.w, r: q.r, m: q.opts[q.c] }]);
      // wait for Continue
    }
  }

  // Keyboard: 1–4 or A–D to answer, Enter/Space to continue, Esc to leave.
  React.useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (status === 'idle') {
        const n = ['1', '2', '3', '4'].indexOf(k);
        const l = ['a', 'b', 'c', 'd'].indexOf(k);
        const i = n >= 0 ? n : l;
        if (i >= 0 && q && i < q.opts.length) { e.preventDefault(); pick(i); }
      } else if (status === 'wrong' && (k === 'enter' || k === ' ')) {
        e.preventDefault(); advance();
      }
      if (k === 'escape') onExit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!session) {
    return (
      <div className="game">
        <div className="g-loading">
          <div className="g-loading-kana">読</div>
          <div>Getting your words ready…</div>
        </div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="game">
        <div className="g-loading">
          <div className="g-loading-kana">空</div>
          <div>No words to practise right now.</div>
          <button className="btn btn-soft" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const answeredCount = idx + (status === 'idle' ? 0 : 1);
  const progress = (answeredCount / total) * 100;
  const reading  = q.f && q.f !== q.w ? q.f : '';
  const correctText = q.opts[q.c];

  return (
    <div className={'game is-' + status}>
      <Confetti trigger={conf}/>

      <header className="g-top">
        <button className="g-close" onClick={onExit} aria-label="End session">{I.close(20)}</button>
        <div className="g-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answeredCount}>
          <i style={{ width: progress + '%' }}/>
        </div>
        <span className={'g-combo' + (combo >= 2 ? ' on' : '')} key={'c' + combo} title="Correct in a row">
          {I.flame(14)}{combo}
        </span>
        <span className="g-count">{Math.min(idx + 1, total)}<small>/{total}</small></span>
      </header>

      {offline && (
        <div className="g-offline">
          {I.bolt(13)} Offline — practising a small built-in set. Answers will sync when you're back online.
        </div>
      )}

      <section className="g-card" key={idx}>
        <div className="g-meta">
          <span className="g-level">{q.lv}</span>
          <span className="g-prompt">What does this mean?</span>
        </div>
        <div className="g-word-wrap">
          {reading && <div className="g-reading" lang="ja">{reading}</div>}
          <div className="g-word" lang="ja" style={{ '--len': Math.max(q.w.length, 2) }}>{q.w}</div>
          {q.r && <div className="g-romaji">{q.r}</div>}
        </div>
      </section>

      <div className="g-answers" role="group" aria-label="Answer options">
        {q.opts.map((opt, i) => {
          let cls = 'g-ans';
          if (status !== 'idle') {
            if (i === q.c)        cls += ' correct';
            else if (i === sel)   cls += ' wrong';
            else                  cls += ' dim';
          }
          return (
            <button key={i} className={cls} disabled={status !== 'idle'} onClick={() => pick(i)}>
              <span className="g-key">{ANSWER_KEYS[i]}</span>
              <span className="g-ans-text">{opt}</span>
              {status !== 'idle' && i === q.c && <span className="g-ans-icon">{I.check(20)}</span>}
              {status === 'wrong' && i === sel && <span className="g-ans-icon">{I.x(20)}</span>}
            </button>
          );
        })}
      </div>

      <div className={'g-feedback' + (status === 'idle' ? '' : ' show ' + status)} aria-live="polite">
        {status === 'correct' && (
          <div className="g-fb-row">
            <span className="g-fb-badge ok">{I.check(18)}</span>
            <div className="g-fb-text"><b>正解 · Correct</b>{combo >= 3 && <span>{combo} in a row</span>}</div>
          </div>
        )}
        {status === 'wrong' && (
          <React.Fragment>
            <div className="g-fb-row">
              <span className="g-fb-badge no">{I.x(18)}</span>
              <div className="g-fb-text">
                <span className="g-fb-label">Answer</span>
                <b>{correctText}</b>
                <span lang="ja">{q.w}{reading ? ' · ' + reading : ''}</span>
              </div>
            </div>
            <button className="btn btn-peach g-continue fb-continue" onClick={advance} autoFocus>
              {last ? 'See results' : 'Continue'} {I.arrow(16)}
            </button>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
Object.assign(window, { Game, saveAnswer, flushAnswerQueue });
