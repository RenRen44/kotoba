// kotoba-views.jsx — Home, Learn, Results, Progress, Profile
const { useState: uSt, useEffect: uEf, useMemo: uM, useRef: uRf } = React;

/* ── Result icon based on score ── */
function ResultKanji({ acc }) {
  const k = acc >= 85 ? { ch:'完', c:'var(--honey)', g:'rgba(243,178,78,0.45)' }
          : acc >= 65 ? { ch:'良', c:'var(--sage)',  g:'rgba(95,174,142,0.45)' }
          :             { ch:'力', c:'var(--peach)', g:'rgba(241,133,90,0.45)' };
  return (
    <div className="result-kanji" style={{ color:k.c, filter:`drop-shadow(0 4px 16px ${k.g})` }}>{k.ch}</div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return { jp:'こんばんは', en:'Good evening' };
  if (h < 11) return { jp:'おはよう',   en:'Good morning' };
  if (h < 18) return { jp:'こんにちは', en:'Good afternoon' };
  return            { jp:'こんばんは', en:'Good evening' };
}

/* ══════════════════════════════════════════
   HOME — today at a glance
   The old home screen was a marketing landing page ("Learn Japanese the
   way あなた learn") shown to people who were already signed in. This is
   what a returning learner actually needs: how today is going, and one
   button to start.
══════════════════════════════════════════ */
function Landing({ go, user, stats }) {
  const s = stats || { day_streak:0, words_seen:0, mastered_count:0, due_count:0,
                       answered_today:0, daily_goal:(user && user.daily_goal) || 10, accuracy:0 };
  const goal   = Math.max(1, s.daily_goal || 10);
  const today  = s.answered_today || 0;
  const pct    = Math.min(100, Math.round((today / goal) * 100));
  const left   = Math.max(0, goal - today);
  const done   = today >= goal;
  const first  = (user && user.name ? user.name.trim().split(/\s+/)[0] : '');
  const hi     = greeting();
  const fresh  = !stats || s.total_answers === 0;

  return (
    <div className="page home page-enter">
      <header className="home-head">
        <p className="home-jp" lang="ja">{hi.jp}</p>
        <h1>{hi.en}{first ? `, ${first}` : ''}</h1>
      </header>

      {/* Today card */}
      <section className="today-card">
        <div className="today-ring">
          <Ring value={pct} size={128} stroke={11} color={done ? 'var(--sage)' : 'var(--peach)'}>
            <div>
              <div className="today-num">{today}</div>
              <div className="today-of">of {goal}</div>
            </div>
          </Ring>
        </div>
        <div className="today-body">
          <div className="today-label">Today's goal</div>
          <h2>
            {fresh ? 'Your first session is waiting'
             : done ? 'Goal complete — nice work'
             : `${left} ${left === 1 ? 'word' : 'words'} to go`}
          </h2>
          <p>
            {fresh ? 'Eight quick questions. Kotoba starts learning what you know from the very first answer.'
             : s.due_count > 0 ? `${s.due_count} ${s.due_count === 1 ? 'word is' : 'words are'} due for review.`
             : done ? 'Anything more today is a bonus.'
             : 'A short session now keeps your streak going.'}
          </p>
          <button className="btn btn-peach today-cta" onClick={() => go('play')}>
            {I.play(15)} {fresh ? 'Start first session' : 'Start session'}
          </button>
        </div>
        <Mascot size={96} mood={done ? 'wink' : 'happy'} className="today-mascot"/>
      </section>

      {/* Quick stats */}
      <div className="home-stats stagger">
        <div className="hs">
          <span className="hs-ic" style={{ color:'var(--honey)', background:tint('var(--honey)') }}>{I.flame(18)}</span>
          <div><b>{s.day_streak}</b><span>day streak</span></div>
        </div>
        <div className="hs">
          <span className="hs-ic" style={{ color:'var(--peach)', background:tint('var(--peach)') }}>{I.book(18)}</span>
          <div><b>{s.words_seen}</b><span>words seen</span></div>
        </div>
        <div className="hs">
          <span className="hs-ic" style={{ color:'var(--sage)', background:tint('var(--sage)') }}>{I.star(18)}</span>
          <div><b>{s.mastered_count}</b><span>mastered</span></div>
        </div>
      </div>

      {/* What's here / what's coming */}
      <div className="section-head"><h2>Study</h2><span className="jp">学ぶ</span>
        <button className="more" onClick={() => go('learn')}>All levels</button>
      </div>
      <button className="study-row" onClick={() => go('play', 5)}>
        <span className="study-kana" lang="ja">語</span>
        <span className="study-text"><b>N5 Vocabulary</b><span>Beginner words · adaptive review</span></span>
        <span className="study-go">{I.arrow(16)}</span>
      </button>
      <div className="soon-row">
        {[['漢','Kanji'],['法','Grammar'],['読','Reading']].map(([k, t]) => (
          <div className="soon-chip" key={t}><span lang="ja">{k}</span>{t}<small>Soon</small></div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   LEARN — pick what to study
   Was 4 categories × 5 levels = 20 cards, 19 of them locked and shimmering.
   Now: the vocabulary levels, plainly marked, and one compact "coming soon"
   row for everything that doesn't exist yet.
══════════════════════════════════════════ */
const VOCAB_LEVELS = [
  { n:5, name:'Beginner',            available:true  },
  { n:4, name:'Elementary',          available:false },
  { n:3, name:'Intermediate',        available:false },
  { n:2, name:'Upper-intermediate',  available:false },
  { n:1, name:'Advanced',            available:false },
];

function LearnHub({ go, user, stats }) {
  const s = stats || { words_seen:0, mastered_count:0, due_count:0 };

  return (
    <div className="page learn page-enter">
      <header className="page-head">
        <p className="page-jp" lang="ja">学ぶ</p>
        <h1>Learn</h1>
        <p className="page-sub">Pick a level. Each session is 8 words — anything due for review comes first, then words you haven't mastered yet.</p>
      </header>

      <div className="section-head"><h2>Vocabulary</h2><span className="jp">語彙</span></div>
      <div className="level-list stagger">
        {VOCAB_LEVELS.map(l => (
          <button key={l.n}
                  className={'level-row' + (l.available ? '' : ' locked')}
                  disabled={!l.available}
                  onClick={() => l.available && go('play', l.n)}>
            <span className="lr-tag">N{l.n}</span>
            <span className="lr-text">
              <b>N{l.n} Vocabulary</b>
              <span>
                {l.available
                  ? (s.words_seen
                      ? `${s.words_seen} seen · ${s.mastered_count} mastered${s.due_count ? ` · ${s.due_count} due` : ''}`
                      : `${l.name} · start here`)
                  : `${l.name} · coming soon`}
              </span>
            </span>
            {l.available
              ? <span className="lr-go">{I.play(14)}</span>
              : <span className="lr-lock">{I.lock(14)}</span>}
          </button>
        ))}
      </div>

      <div className="section-head"><h2>Coming soon</h2><span className="jp">近日</span></div>
      <div className="soon-grid">
        {[
          { k:'漢', t:'Kanji',   d:'Meanings, readings and the words they build.' },
          { k:'法', t:'Grammar', d:'JLPT grammar points with example sentences.' },
          { k:'読', t:'Reading', d:'Short graded texts using words you know.' },
        ].map(c => (
          <div className="soon-card" key={c.t}>
            <span className="soon-kana" lang="ja">{c.k}</span>
            <b>{c.t}</b>
            <p>{c.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   RESULTS
══════════════════════════════════════════ */
function Results({ go, res }) {
  const acc    = res && res.total ? Math.round((res.correct / res.total) * 100) : 0;
  const missed = res ? res.total - res.correct : 0;
  const level  = (res && res.level) || 5;
  const [readiness, setReadiness] = uSt(null);

  // Readiness features are computed server-side from this user's rows.
  // The model numbers levels 1 = N5 … 5 = N1, the opposite of JLPT names.
  uEf(() => {
    let cancelled = false;
    apiJson(`/readiness?current_level=${6 - level}`, { method: 'POST' })
      .then(data => { if (!cancelled) setReadiness(data); })
      .catch(() => {});   // non-fatal: the banner just doesn't render
    return () => { cancelled = true; };
  }, [level]);

  const wrongWords = (res && res.wrongWords) || [];
  const title = acc === 100 ? 'Perfect session' : acc >= 75 ? 'Nicely done' : acc >= 50 ? 'Good practice' : 'Keep at it';

  return (
    <div className="results-page page-enter">
      <div className="result-card">
        <ResultKanji acc={acc}/>
        <h2>{title}</h2>
        <div className="result-ring">
          <Ring value={acc} size={136} stroke={12} color="var(--sage)">
            <div>
              <div className="result-acc"><Count to={acc} suffix="%"/></div>
              <div className="result-acc-l">accuracy</div>
            </div>
          </Ring>
        </div>
        <div className="res-stats">
          <div className="res-stat"><div className="v">{res ? res.correct : 0}/{res ? res.total : 0}</div><div className="l">Correct</div></div>
          <div className="res-stat"><div className="v">{res ? res.best : 0}</div><div className="l">Best in a row</div></div>
          <div className="res-stat"><div className="v">{missed}</div><div className="l">To review</div></div>
        </div>
      </div>

      {readiness && (
        <div className={'readiness' + (readiness.ready ? ' ready' : '')}>
          <span className="readiness-ic">{readiness.ready ? I.trophy(20) : I.target(20)}</span>
          <div>
            <b>{readiness.ready ? `Ready for N${Math.max(1, level - 1)}` : `Building toward N${Math.max(1, level - 1)}`}</b>
            <span>Level readiness {Math.round(readiness.score * 100)}%</span>
          </div>
        </div>
      )}

      <div className="section-head">
        <h2>{wrongWords.length ? 'Review these' : 'Nothing missed'}</h2>
        <span className="jp">復習</span>
      </div>
      {wrongWords.length === 0 ? (
        <div className="card empty-card">
          <div className="empty-kana" lang="ja" style={{ color:'var(--sage)' }}>完璧</div>
          <div className="empty-title">Every word correct</div>
          <div className="empty-sub">They'll come back when they're due for review.</div>
        </div>
      ) : (
        <div className="review-list">
          {wrongWords.map((r, i) => (
            <div className="review-row" key={i}>
              <span className="rw" lang="ja">{r.w}</span>
              <span className="rr">{r.r}</span>
              <span className="rm">{r.m}</span>
            </div>
          ))}
        </div>
      )}

      <div className="result-actions">
        <button className="btn btn-soft" onClick={() => go('home')}>Done</button>
        <button className="btn btn-peach" onClick={() => go('play', level)}>{I.arrow(17)} Another session</button>
      </div>
    </div>
  );
}
/* ══════════════════════════════════════════
   PROGRESS
══════════════════════════════════════════ */
/*
  Progress now renders from GET /me/stats, passed down from App.

  What this replaces: the old useRealStats() read 'kotoba_answers' out of
  localStorage. That meant progress was per-browser (clearing site data
  wiped your entire history, and your phone showed an empty app), and the
  53×7 heatmap was recomputed by scanning every answer 371 times on mount.
  The server keeps the review_log, so the numbers follow the account.
*/
function Progress({ stats }) {
  const seen = stats ? Math.max(1, stats.words_seen) : 1;
  const breakdown = stats ? [
    { label:'Accuracy',       jp:'正答率', pct: stats.accuracy, cls:'sage',
      note: `${stats.correct_answers} of ${stats.total_answers} answers` },
    { label:'Mastered',       jp:'習得',   pct: Math.round((stats.mastered_count / seen) * 100), cls:'honey',
      note: `${stats.mastered_count} of ${stats.words_seen} words seen` },
    { label:"Today's goal",   jp:'今日',   pct: Math.min(100, Math.round((stats.answered_today / Math.max(1, stats.daily_goal)) * 100)), cls:'peach',
      note: `${stats.answered_today} of ${stats.daily_goal}` },
  ] : [];

  if (!stats || stats.total_answers === 0) {
    return (
      <div className="page page-enter">
        <header className="page-head">
          <p className="page-jp" lang="ja">学習記録</p>
          <h1>Progress</h1>
        </header>
        <div className="card empty-card">
          <div className="empty-kana" lang="ja">始</div>
          <div className="empty-title">No sessions yet</div>
          <div className="empty-sub">Finish your first session and your stats will show up here.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <header className="page-head">
        <p className="page-jp" lang="ja">学習記録</p>
        <h1>Progress</h1>
        <p className="page-sub">
          {stats.words_seen} words seen across {stats.study_days} study day{stats.study_days!==1?'s':''}
          {stats.due_count > 0 && <> · <b style={{color:'var(--peach)'}}>{stats.due_count} due now</b></>}
        </p>
      </header>
      <div className="stat-grid">
        <StatCard icon={I.trophy(18)} color="var(--honey)" value={<Count to={stats.study_days}/>}          label="Study days" jp="日"/>
        <StatCard icon={I.book(18)}   color="var(--peach)" value={<Count to={stats.words_seen}/>}          label="Words seen" jp="単語"/>
        <StatCard icon={I.target(18)} color="var(--sage)"  value={<Count to={stats.accuracy} suffix="%"/>} label="Accuracy"   jp="正答率"/>
        <StatCard icon={I.bolt(18)}   color="var(--lav)"   value={<Count to={stats.total_answers}/>}       label="Answers"    jp="回答"/>
      </div>
      <div className="stat-grid" style={{marginTop:12}}>
        <StatCard icon={I.star(18)}  color="var(--sage)"  value={<Count to={stats.mastered_count}/>} label="Mastered"   jp="習得"/>
        <StatCard icon={I.clock(18)} color="var(--peach)" value={<Count to={stats.due_count}/>}      label="Due now"    jp="復習"/>
        <StatCard icon={I.flame(18)} color="var(--honey)" value={<Count to={stats.day_streak}/>}     label="Day streak" jp="連続"/>
        <StatCard icon={I.spark(18)} color="var(--lav)"   value={<Count to={stats.best_combo}/>}     label="Best in a row" jp="最高"/>
      </div>
      <div className="section-head"><h2>Breakdown</h2><span className="jp">内訳</span></div>
      <div className="card breakdown">
        {breakdown.map(r => (
          <div className="bd-row" key={r.label}>
            <div className="bd-top">
              <span className="bd-label">{r.label} <span className="jp" lang="ja">{r.jp}</span></span>
              <span className="bd-pct">{r.pct}%</span>
            </div>
            <Bar value={r.pct} cls={r.cls} light/>
            <div className="bd-note">{r.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PROFILE
══════════════════════════════════════════ */
/*
  Profile — real account data, editable.

  Replaces the previous hardcoded panel ("Ren Takahashi", 12-day streak,
  "N4 · 248 words mastered", three unlocked achievements, and five settings
  rows that did nothing). Everything here now comes from /auth/me and
  /me/stats, and the edits actually persist.

  Props come from App: user (ProfileOut), stats (StatsOut), onUser to push
  an updated profile back up, onLogout, onRefreshStats.
*/

const WHY_LABELS = {
  travel:'Travel to Japan', anime:'Anime & manga', work:'Work or business',
  moving:'Moving to Japan', culture:'Japanese culture', curious:'Just curious',
};
const LEVEL_LABELS = {
  zero:'Total beginner', kana:'Knows some kana',
  studied:'Studied before', conversational:'Conversational',
};
const GOAL_CHOICES = [
  { val:5,  label:'Casual',  sub:'~3 min'  },
  { val:10, label:'Regular', sub:'~6 min'  },
  { val:20, label:'Serious', sub:'~12 min' },
  { val:30, label:'Intense', sub:'~20 min' },
];

function joinedLabel(created) {
  if (!created) return null;
  try {
    return new Date(created * 1000).toLocaleDateString(undefined, { month:'short', year:'numeric' });
  } catch (e) { return null; }
}

/* ── Inline editable name ── */
function NameEditor({ user, onUser }) {
  const [editing, setEditing] = uSt(false);
  const [value,   setValue]   = uSt(user.name || '');
  const [busy,    setBusy]    = uSt(false);
  const [err,     setErr]     = uSt('');

  uEf(() => { setValue(user.name || ''); }, [user.name]);

  async function save() {
    const name = value.trim();
    if (!name)            { setErr('Name can\'t be empty.'); return; }
    if (name === user.name) { setEditing(false); setErr(''); return; }
    setBusy(true); setErr('');
    try {
      const updated = await apiUpdateProfile({ name });
      onUser(updated);
      setEditing(false);
    } catch (e) {
      setErr(e.message || 'Could not save.');
    } finally { setBusy(false); }
  }

  if (!editing) {
    return (
      <h1 style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        {user.name}
        <button className="pf-inline-edit" onClick={()=>setEditing(true)}>Edit</button>
      </h1>
    );
  }

  return (
    <div className="pf-name-edit">
      <input
        value={value} onChange={e=>setValue(e.target.value)} disabled={busy}
        maxLength={80} autoFocus
        onKeyDown={e => { if (e.key==='Enter') save(); if (e.key==='Escape') { setEditing(false); setErr(''); } }}
      />
      <button className="btn btn-peach pf-mini-btn" onClick={save} disabled={busy}>
        {busy ? 'Saving…' : 'Save'}
      </button>
      <button className="btn btn-soft pf-mini-btn" onClick={()=>{setEditing(false);setValue(user.name||'');setErr('');}} disabled={busy}>
        Cancel
      </button>
      {err && <div className="pf-err">{err}</div>}
    </div>
  );
}

/* ── Profile picture picker ──
   Downsizes to a small square JPEG/WebP data URL client-side (max 256px,
   quality 0.82) before sending, so we don't ship multi-MB photos straight
   into a TEXT column. Falls back to the initial-letter avatar if nothing
   is set — see kotoba-app.jsx's Sidebar and the hero below.
*/
const AVATAR_MAX_DIM = 256;
const AVATAR_QUALITY = 0.82;

function downsizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      img.onerror = () => reject(new Error('That doesn\'t look like an image.'));
      img.onload = () => {
        // Crop to a centered square first (so the round avatar never shows
        // a squished oval), then scale that square down to AVATAR_MAX_DIM.
        const srcSide = Math.min(img.width, img.height);
        const sx = (img.width  - srcSide) / 2;
        const sy = (img.height - srcSide) / 2;
        const side = Math.min(srcSide, AVATAR_MAX_DIM);

        const canvas = document.createElement('canvas');
        canvas.width = side; canvas.height = side;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, srcSide, srcSide, 0, 0, side, side);
        resolve(canvas.toDataURL('image/jpeg', AVATAR_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function AvatarPicker({ user, onUser }) {
  const inputRef = uRf(null);
  const [busy, setBusy] = uSt(false);
  const [err,  setErr]  = uSt('');

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('Please choose an image file.'); return; }

    setBusy(true); setErr('');
    try {
      const dataUrl = await downsizeImageFile(file);
      const updated = await apiUpdateProfile({ avatar: dataUrl });
      onUser(updated);
    } catch (e) {
      setErr(e.message || 'Could not update your photo.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true); setErr('');
    try {
      const updated = await apiUpdateProfile({ avatar: null });
      onUser(updated);
    } catch (e) {
      setErr(e.message || 'Could not remove your photo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="avatar-picker">
      <input
        ref={inputRef} type="file" accept="image/*"
        style={{ display:'none' }} onChange={handleFile} disabled={busy}
      />
      <button
        type="button" className="avatar-edit-btn"
        onClick={() => inputRef.current && inputRef.current.click()}
        disabled={busy}
        title={user.avatar ? 'Change photo' : 'Add a photo'}
      >
        {busy ? '…' : I.camera(15)}
      </button>
      {user.avatar && !busy && (
        <button type="button" className="avatar-remove-btn" onClick={remove} title="Remove photo">
          {I.x(11)}
        </button>
      )}
      {err && <div className="pf-err" style={{marginTop:8}}>{I.x(14)} {err}</div>}
    </div>
  );
}

/* ── Change password ── */
function PasswordSection() {
  const [open,    setOpen]    = uSt(false);
  const [cur,     setCur]     = uSt('');
  const [next,    setNext]    = uSt('');
  const [busy,    setBusy]    = uSt(false);
  const [msg,     setMsg]     = uSt('');
  const [err,     setErr]     = uSt('');

  async function submit(e) {
    e.preventDefault();
    setErr(''); setMsg('');
    if (next.length < 6) { setErr('New password must be at least 6 characters.'); return; }
    setBusy(true);
    try {
      await apiChangePassword(cur, next);
      setMsg('Password updated.');
      setCur(''); setNext('');
      setTimeout(()=>{ setOpen(false); setMsg(''); }, 1400);
    } catch (e) {
      setErr(e.message || 'Could not change password.');
    } finally { setBusy(false); }
  }

  return (
    <div className="pf-block">
      <button className="settings-row pf-row-btn" onClick={()=>setOpen(o=>!o)}>
        <span className="s-label">Change password</span>
        <span style={{color:'var(--ink-3)',display:'flex',transform:open?'rotate(90deg)':'none',transition:'transform .2s'}}>
          {I.chev(16)}
        </span>
      </button>
      {open && (
        <form className="pf-form" onSubmit={submit}>
          <div className="pf-field">
            <label>Current password</label>
            <input type="password" value={cur} onChange={e=>setCur(e.target.value)}
                   autoComplete="current-password" disabled={busy}/>
          </div>
          <div className="pf-field">
            <label>New password</label>
            <input type="password" value={next} onChange={e=>setNext(e.target.value)}
                   autoComplete="new-password" placeholder="At least 6 characters" disabled={busy}/>
          </div>
          {err && <div className="pf-err">{I.x(14)} {err}</div>}
          {msg && <div className="pf-ok">{I.check(14)} {msg}</div>}
          <button type="submit" className="btn btn-peach" disabled={busy} style={{alignSelf:'flex-start'}}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}

/* ── Danger zone: delete account ── */
function DeleteSection({ onLogout }) {
  const [open,    setOpen]    = uSt(false);
  const [confirm, setConfirm] = uSt('');
  const [busy,    setBusy]    = uSt(false);
  const [err,     setErr]     = uSt('');

  async function remove() {
    setBusy(true); setErr('');
    try {
      await apiDeleteAccount();
      logout();
      onLogout();
    } catch (e) {
      setErr(e.message || 'Could not delete account.');
      setBusy(false);
    }
  }

  return (
    <div className="pf-block">
      <button className="settings-row pf-row-btn pf-danger-row" onClick={()=>setOpen(o=>!o)}>
        <span className="s-label">Delete account</span>
        <span style={{color:'var(--terra)',display:'flex'}}>{I.chev(16)}</span>
      </button>
      {open && (
        <div className="pf-form">
          <p className="pf-danger-note">
            This permanently deletes your account, your review history and your
            entire schedule. It cannot be undone. Type <b>DELETE</b> to confirm.
          </p>
          <div className="pf-field">
            <input value={confirm} onChange={e=>setConfirm(e.target.value)}
                   placeholder="DELETE" disabled={busy}/>
          </div>
          {err && <div className="pf-err">{I.x(14)} {err}</div>}
          <button className="btn pf-danger-btn" disabled={busy || confirm !== 'DELETE'}
                  onClick={remove} style={{alignSelf:'flex-start'}}>
            {busy ? 'Deleting…' : 'Permanently delete my account'}
          </button>
        </div>
      )}
    </div>
  );
}

function Profile({ go, user, stats, onUser, onLogout, onRefreshStats }) {
  const [goalBusy, setGoalBusy] = uSt(false);

  if (!user) {
    return (
      <div className="page page-enter">
        <div className="card" style={{padding:40,textAlign:'center'}}>
          <div style={{fontFamily:'var(--jp)',fontSize:44,color:'var(--ink-3)',marginBottom:12}}>読</div>
          <div style={{color:'var(--ink-3)'}}>Loading your profile…</div>
        </div>
      </div>
    );
  }

  const s = stats || {
    total_answers:0, accuracy:0, words_seen:0, mastered_count:0, due_count:0,
    study_days:0, day_streak:0, best_combo:0, daily_goal:user.daily_goal||10, answered_today:0,
  };

  // Achievements are now derived from real numbers instead of being three
  // permanently-unlocked decorations.
  const achievements = [
    { iconEl:I.crane(32), title:'Week warrior',  desc:'7-day streak',       unlocked:s.day_streak    >= 7,   color:'var(--honey)' },
    { iconEl:I.lotus(32), title:'Century',       desc:'100 words seen',     unlocked:s.words_seen    >= 100, color:'var(--peach)' },
    { iconEl:I.fuji(32),  title:'Sharpshooter',  desc:'90% accuracy',       unlocked:s.accuracy      >= 90 && s.total_answers >= 20, color:'var(--sage)' },
    { iconEl:I.koi(32),   title:'Combo master',  desc:'20× combo',          unlocked:s.best_combo    >= 20,  color:'var(--lav)'   },
  ];

  async function setGoal(val) {
    if (val === user.daily_goal || goalBusy) return;
    setGoalBusy(true);
    try {
      const updated = await apiUpdateProfile({ daily_goal: val });
      onUser(updated);
      if (onRefreshStats) onRefreshStats();
    } catch (e) {
      console.warn('Could not update daily goal:', e.message);
    } finally { setGoalBusy(false); }
  }

  async function setJlpt(val) {
    if (val === user.jlpt_level) return;
    try {
      const updated = await apiUpdateProfile({ jlpt_level: val });
      onUser(updated);
    } catch (e) {
      console.warn('Could not update level:', e.message);
    }
  }

  const joined = joinedLabel(user.created);

  return (
    <div className="page page-enter">
      <div className="profile-hero">
        <div className="avatar pf-avatar">
          {user.avatar
            ? <img src={user.avatar} alt="" className="avatar-img"/>
            : (user.name || '?').trim().charAt(0).toUpperCase() || '?'}
          <AvatarPicker user={user} onUser={onUser}/>
        </div>
        <div className="pf-id">
          <NameEditor user={user} onUser={onUser}/>
          <p className="sub">
            <span className="pf-email">{user.email}</span>
            {joined && <span className="pf-joined">Joined {joined}</span>}
          </p>
        </div>
        <Mascot size={84} mood="wink" className="pf-mascot"/>
        <div className="pf-chips">
          <span className="pf-chip">{I.flame(14)}<b style={{color:'var(--honey)'}}>{s.day_streak}</b> day streak</span>
          <span className="pf-chip">{I.star(14)}<b>{s.mastered_count}</b> mastered</span>
          <span className="pf-chip"><b>N{user.jlpt_level || 5}</b> level</span>
        </div>
      </div>

      {/* ── Daily goal ── */}
      <div className="section-head"><h2>Daily goal</h2><span className="jp">目標</span>
        <span className="more">{s.answered_today} answered today</span>
      </div>
      <div className="pf-choice-grid">
        {GOAL_CHOICES.map(g => (
          <button key={g.val}
                  className={'pf-choice' + (user.daily_goal === g.val ? ' on' : '')}
                  disabled={goalBusy}
                  onClick={()=>setGoal(g.val)}>
            <div className="pf-choice-n">{g.val}</div>
            <div className="pf-choice-l">{g.label}</div>
            <div className="pf-choice-s">{g.sub}</div>
          </button>
        ))}
      </div>

      {/* ── Study level ── */}
      <div className="section-head"><h2>Study level</h2><span className="jp">級</span></div>
      <div className="pf-choice-grid pf-level-grid">
        {[5,4,3,2,1].map(n => (
          <button key={n}
                  className={'pf-choice' + (user.jlpt_level === n ? ' on' : '')}
                  onClick={()=>setJlpt(n)}>
            <div className="pf-choice-n">N{n}</div>
            <div className="pf-choice-s">{n===5?'Beginner':n===1?'Advanced':''}</div>
          </button>
        ))}
      </div>
      <p className="pf-hint">
        Quizzes pull from this level. Only N5 has content right now — the rest will
        fall back to N5 until their word banks land.
      </p>

      {/* ── Achievements ── */}
      <div className="section-head"><h2>Achievements</h2><span className="jp">実績</span></div>
      <div className="ach-grid">
        {achievements.map((a,i)=>(
          <div className={'ach-card'+(a.unlocked?'':' locked')} key={i}>
            <div className="ach-icon" style={{
              background: a.unlocked ? tint(a.color) : 'var(--sand)',
              color: a.unlocked ? a.color : 'var(--ink-3)',
            }}>
              {a.iconEl}
            </div>
            <div className="t">{a.title}</div>
            <div className="d">{a.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Your answers (from onboarding) ── */}
      {(user.why || user.level) && (
        <React.Fragment>
          <div className="section-head"><h2>About you</h2><span className="jp">あなた</span></div>
          <div className="card settings-list">
            {user.why && (
              <div className="settings-row">
                <span className="s-label">Learning because</span>
                <span style={{color:'var(--ink-3)',fontSize:13.5}}>{WHY_LABELS[user.why] || user.why}</span>
              </div>
            )}
            {user.level && (
              <div className="settings-row">
                <span className="s-label">Starting point</span>
                <span style={{color:'var(--ink-3)',fontSize:13.5}}>{LEVEL_LABELS[user.level] || user.level}</span>
              </div>
            )}
          </div>
        </React.Fragment>
      )}

      {/* ── Account ── */}
      <div className="section-head"><h2>Account</h2><span className="jp">設定</span></div>
      <div className="card settings-list">
        <PasswordSection/>
        <button className="settings-row pf-row-btn" onClick={onLogout}>
          <span className="s-label">Sign out</span>
          <span style={{color:'var(--ink-3)',display:'flex'}}>{I.chev(16)}</span>
        </button>
        <DeleteSection onLogout={onLogout}/>
      </div>
    </div>
  );
}

Object.assign(window, { Landing, LearnHub, Results, Progress, Profile });
