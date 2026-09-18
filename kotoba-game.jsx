// kotoba-game.jsx
function Confetti({ trigger }) {
  const bits = React.useMemo(() => {
    const cols = ['#F3B24E','#F1855A','#5FAE8E','#FBF6EC','#8C82C9','#F7C4A8'];
    const shapes = ['2px','4px','9px'];
    return Array.from({ length: 22 }, (_, i) => {
      const a = (Math.random() * Math.PI * 2);
      const d = 60 + Math.random() * 160;
      return {
        cx:    (Math.cos(a) * d).toFixed(1) + 'px',
        cy:    (Math.sin(a) * d - 40).toFixed(1) + 'px',
        cr:    (Math.random() * 720 - 360).toFixed(1) + 'deg',
        bg:    cols[Math.floor(Math.random() * cols.length)],
        left:  (40 + Math.random() * 20) + '%',
        size:  shapes[Math.floor(Math.random() * shapes.length)],
        delay: (Math.random() * 0.15).toFixed(2) + 's',
      };
    });
  }, [trigger]);

  return (
    <div className={'confetti' + (trigger > 0 ? ' go' : '')} key={trigger}>
      {bits.map((b, i) => (
        <i key={i} style={{
          '--cx': b.cx, '--cy': b.cy, '--cr': b.cr,
          background: b.bg, left: b.left,
          width: b.size, height: b.size,
          animationDelay: b.delay,
        }}/>
      ))}
    </div>
  );
}

/*
  saveAnswer — now writes to the server.

  The server owns scheduling: POST /answer updates this user's SM-2 row and
  BKT row and appends to the permanent review_log, all in one transaction.

  We still update the local SM-2/BKT stores, but ONLY so the UI has
  something instant to read. They are a display cache, not the source of
  truth — the server's values win on the next fetch.

  Fire-and-forget on purpose: the answer animation should never wait on a
  network round trip. If the POST fails we queue it in localStorage so the
  review isn't lost, and flush the queue at the start of the next session.
*/
function saveAnswer(word, correct, level) {
  // Instant local feedback (cache only).
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

function queueAnswer(payload) {
  try {
    const q = JSON.parse(localStorage.getItem(ANSWER_QUEUE_KEY) || '[]');
    q.push(payload);
    // Keep the queue bounded so a long offline stretch can't fill storage.
    localStorage.setItem(ANSWER_QUEUE_KEY, JSON.stringify(q.slice(-200)));
  } catch (e) {}
}

// Called when a session starts. Replays anything that failed to send.
async function flushAnswerQueue() {
  let queue;
  try {
    queue = JSON.parse(localStorage.getItem(ANSWER_QUEUE_KEY) || '[]');
  } catch (e) { return; }
  if (!queue.length) return;

  const remaining = [];
  for (const payload of queue) {
    try {
      const res = await authFetch('/answer', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) remaining.push(payload);
    } catch (e) {
      remaining.push(payload);
    }
  }
  try { localStorage.setItem(ANSWER_QUEUE_KEY, JSON.stringify(remaining)); } catch (e) {}
}

function Game({ onComplete, onExit, level = 5 }) {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [offline, setOffline] = React.useState(false);
  const [idx,     setIdx]     = React.useState(0);
  const [sel,     setSel]     = React.useState(null);
  const [status,  setStatus]  = React.useState('idle');
  const [combo,   setCombo]   = React.useState(0);
  const [best,    setBest]    = React.useState(0);
  const [bump,    setBump]    = React.useState(false);
  const [done,    setDone]    = React.useState(0);
  const [correct, setCorrect] = React.useState(0);
  const [conf,    setConf]    = React.useState(0);
  const [wordKey, setWordKey] = React.useState(0);
  const [wrong,   setWrong]   = React.useState([]);   // words missed this session

  React.useEffect(() => {
    // Send up anything that failed to save while offline, then load.
    flushAnswerQueue().finally(() => {
      fetchQuiz(level, SESSION_SIZE).then(({ questions, isOffline }) => {
        setSession(questions);
        setOffline(isOffline);
        setLoading(false);
      });
    });
  }, [level]);

  if (loading || !session) {
    return (
      <div className="game-wrap">
        <div className="game-stage" style={{alignItems:'center',justifyContent:'center'}}>
          <div style={{textAlign:'center',color:'var(--cream-2)'}}>
            <div style={{fontFamily:'var(--jp)',fontSize:48,marginBottom:16,
              animation:'watermarkDrift 2s ease-in-out infinite alternate'}}>読</div>
            <div style={{fontSize:14}}>Loading quiz...</div>
          </div>
        </div>
      </div>
    );
  }

  // Length comes from what the server actually returned, NOT from
  // SESSION_SIZE. Once mastered words are filtered out server-side a
  // session can legitimately be shorter than 8, and the old code kept
  // indexing past the end until q.w[0] threw on undefined.
  const total = session.length;
  const q     = session[idx];
  const keys  = ['A','B','C','D'];

  function pick(i) {
    if (status !== 'idle') return;
    setSel(i);
    const right = i === q.c;
    setStatus(right ? 'correct' : 'wrong');

    // ── Persist to the server (and local display cache) ──
    saveAnswer(q.w, right, q.lv);

    if (!right) setWrong(w => [...w, { w: q.w, r: q.r, m: q.opts[q.c] }]);

    if (right) {
      const nc = combo + 1;
      setCombo(nc); setBest(b => Math.max(b, nc));
      setCorrect(c => c + 1); setConf(t => t + 1);
      setBump(true); setTimeout(() => setBump(false), 420);
    } else {
      setCombo(0);
    }

    setTimeout(() => {
      const nd = done + 1;
      if (nd >= total) {
        onComplete({
          correct: correct + (right?1:0),
          total,
          best: Math.max(best, right?combo+1:combo),
          // Actually collected now. The old version ran .filter(() => false),
          // so this was always an empty array and Results fell back to the
          // same four hardcoded REVIEW_WORDS every single session.
          wrongWords: right ? wrong : [...wrong, { w: q.w, r: q.r, m: q.opts[q.c] }],
        });
        return;
      }
      setDone(nd); setIdx(v => v+1); setSel(null); setStatus('idle'); setWordKey(k => k+1);
    }, right ? 960 : 1580);
  }

  const progress = (done / total) * 100;

  return (
    <div className="game-wrap">
      <div className="game-stage">
        <div className={'game-glow' + (status==='correct'?' correct':status==='wrong'?' wrong':'')}/>
        <Confetti trigger={conf}/>

        <div className="game-top">
          <button className="icon-btn" onClick={onExit} style={{color:'var(--cream-2)'}}>{I.close(20)}</button>
          <div className="bar" style={{height:11,background:'rgba(255,255,255,0.08)',position:'relative'}}>
            <i className="peach" style={{width:`${progress}%`}}/>
            {progress > 0 && progress < 100 && (
              <span style={{
                position:'absolute',top:'50%',left:`${progress}%`,
                transform:'translate(-50%,-50%)',
                width:14,height:14,borderRadius:'50%',
                background:'var(--peach)',
                boxShadow:'0 0 12px 4px rgba(241,133,90,0.7)',
                pointerEvents:'none',
              }}/>
            )}
          </div>
          <span style={{fontFamily:'var(--display)',fontWeight:700,fontSize:13,color:'var(--cream-2)',minWidth:38,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>
            {done+1}/{total}
          </span>
        </div>

        {offline && (
          <div className="game-offline-note">
            {I.bolt(13)} Offline — practising from a small built-in set. Progress will sync when you reconnect.
          </div>
        )}

        <div className="q-meta">
          <span className="q-prompt">Choose the meaning <span>意味は？</span></span>
          <span className={'combo'+(bump?' bump':'')} style={{opacity:combo>=2?1:0.32}}>
            <span style={{color:'var(--honey)',display:'flex'}}>{I.flame(15)}</span>
            ×{Math.max(combo,1)}{combo>=2?' combo':''}
            {combo>=5 && <span style={{marginLeft:4}}>🔥</span>}
          </span>
        </div>

        <div className="q-watermark">{q.w[0]}</div>

        <div className="q-zone">
          <div key={wordKey} className="word-enter" style={{textAlign:'center'}}>
            <div className="q-level-pill">{q.lv}</div>
            <div className="q-word">{q.w}</div>
            <div className="q-romaji">{q.r}</div>
          </div>
        </div>

        <div className="answers">
          {q.opts.map((opt, i) => {
            let cls = 'ans';
            if (status !== 'idle') {
              if (i === q.c)    cls += ' correct';
              else if (i===sel) cls += ' wrong';
              else              cls += ' dim';
            }
            return (
              <button key={i} className={cls} disabled={status!=='idle'} onClick={()=>pick(i)}
                style={{ animationDelay: `${i*0.04}s` }}>
                <span className="key">{keys[i]}</span>
                <span style={{flex:1}}>{opt}</span>
                {status!=='idle'&&i===q.c&&<span style={{color:'var(--sage)',display:'flex',flexShrink:0}}>{I.check(22)}</span>}
                {status==='wrong'&&i===sel&&<span style={{color:'var(--terra)',display:'flex',flexShrink:0}}>{I.x(22)}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { Game, saveAnswer, flushAnswerQueue });