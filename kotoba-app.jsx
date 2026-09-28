// kotoba-app.jsx — shell with onboarding gate, custom cursor, sound
const { useState: uS, useEffect: uE, useRef: uR } = React;

const NAV = [
  { key:'home',    label:'Home',     jp:'ホーム', icon:I.home  },
  { key:'learn',   label:'Learn',    jp:'学ぶ',   icon:I.learn },
  { key:'progress',label:'Progress', jp:'記録',   icon:I.chart },
  { key:'profile', label:'Profile',  jp:'自分',   icon:I.user  },
];

/* ── Global sound on all button clicks ── */
function useSoundOnButtons() {
  uE(() => {
    function onDown(e) {
      const el = e.target.closest('button');
      if (!el) return;
      try {
        const a = new Audio(CLICK_SFX);
        a.volume = 0.38;
        a.play().catch(() => {});
      } catch(e) {}
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, []);
}

/* ── Helpers for showing a real user ── */
function initialOf(name) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}
function jlptTag(n) {
  return 'N' + (n || 5);
}

/* ── Sidebar ── */
function Sidebar({ view, go, user, stats }) {
  const active = k => view===k||(view==='play'&&k==='learn')||(view==='results'&&k==='learn');
  const streak = stats ? stats.day_streak : 0;
  return (
    <aside className="side">
      <div className="side-glow"/><div className="side-glow2"/>
      <div className="brand">
        <div className="logo">コ</div>
        <div className="wm"><b>Kotoba</b><small>ことば</small></div>
      </div>
      <nav className="nav">
        {NAV.map(n=>(
          <button key={n.key} className={'nav-btn'+(active(n.key)?' on':'')} onClick={()=>go(n.key)}>
            {n.icon(21)}<span style={{flex:1}}>{n.label}</span>
            <span className="nav-jp">{n.jp}</span>
          </button>
        ))}
      </nav>
      <div className="side-fill"/>
      <div className="streak-card">
        <div className="streak-icon">{I.flame(20)}</div>
        <div>
          <div className="streak-num">
            {streak}<span style={{fontSize:12,fontWeight:600,marginLeft:3}}>
              {streak === 1 ? 'day' : 'days'}
            </span>
          </div>
          <div className="streak-label">
            {streak > 0 ? 'on a streak · 続く' : 'start today · 始めよう'}
          </div>
        </div>
      </div>
      <button className="user-row" onClick={()=>go('profile')} style={{textAlign:'left',width:'100%',background:'none'}}>
        <div className="avatar">
          {user && user.avatar
            ? <img src={user.avatar} alt="" className="avatar-img"/>
            : initialOf(user && user.name)}
        </div>
        <div style={{minWidth:0}}>
          <div className="user-name">{(user && user.name) || 'Your account'}</div>
          <div className="user-level">
            {jlptTag(user && user.jlpt_level)} · {stats ? stats.words_seen : 0} words
          </div>
        </div>
      </button>
    </aside>
  );
}

function Topbar({ stats }) {
  const streak = stats ? stats.day_streak : 0;
  return (
    <div className="topbar">
      <div className="tb-logo">コ</div>
      <div className="tb-name">Kotoba</div>
      <div className="tb-right">
        <div className="chip honey" style={{fontSize:12,padding:'5px 11px'}}>{I.flame(13)}<b>{streak}</b></div>
      </div>
    </div>
  );
}

/* ── Full-screen loading state while we check the stored token ── */
function BootSplash({ label = 'Loading…' }) {
  return (
    <div className="boot-splash">
      <div className="boot-kana">言</div>
      <div className="boot-label">{label}</div>
    </div>
  );
}

function BottomNav({ view, go }) {
  const active = k => view===k||(view==='play'&&k==='learn')||(view==='results'&&k==='learn');
  return (
    <nav className="botnav">
      {NAV.map(n=>(
        <button key={n.key} className={active(n.key)?'on':''} onClick={()=>go(n.key)}>
          {n.icon(23)}<span className="bn-l">{n.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ── Root App ──
   Boot sequence:
     1. 'checking'  — is the stored token still valid? (GET /auth/me)
     2. no token / 401        → <AuthScreen>
     3. valid token, onboarded=0 → <Onboarding>
     4. valid token, onboarded=1 → the app
   Onboarding state now lives on the account (users.onboarded), not in
   localStorage, so signing in on a new device doesn't re-run the flow.
*/
function App() {
  const [phase,   setPhase]   = uS('checking');  // checking | auth | onboarding | ready
  const [user,    setUser]    = uS(null);
  const [stats,   setStats]   = uS(null);
  const [view,    setView]    = uS(() => localStorage.getItem('kotoba_v') || 'home');
  const [result,  setResult]  = uS(null);
  const [gameKey, setGameKey] = uS(0);
  const [playLevel, setPlayLevel] = uS(null);   // which JLPT level the current game uses

  useSoundOnButtons();

  // ── Resolve the stored token on first load ──
  uE(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) { setPhase('auth'); return; }
      try {
        const me = await apiMe();
        if (cancelled) return;
        setUser(me);
        setPhase(me.onboarded ? 'ready' : 'onboarding');
      } catch (e) {
        if (!cancelled) setPhase('auth');   // token expired or account gone
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── A 401 anywhere in the app kicks us back to the login screen ──
  uE(() => {
    function onUnauthorized() {
      setUser(null); setStats(null); setPhase('auth');
    }
    window.addEventListener('kotoba-unauthorized', onUnauthorized);
    return () => window.removeEventListener('kotoba-unauthorized', onUnauthorized);
  }, []);

  // ── Keep stats fresh: on entering the app, and after every session ──
  const refreshStats = React.useCallback(async () => {
    try { setStats(await apiMyStats()); } catch (e) { /* non-fatal */ }
  }, []);

  uE(() => { if (phase === 'ready') refreshStats(); }, [phase, refreshStats]);

  // go('play', 4) starts an N4 game; go('play') uses the level in your profile.
  function go(v, level) {
    if (v==='play') { setGameKey(k=>k+1); setPlayLevel(level || null); }
    setView(v);
    if (v!=='results') localStorage.setItem('kotoba_v', v);
    const m = document.querySelector('.main');
    if (m) m.scrollTo({ top:0, behavior:'smooth' });
  }

  async function handleAuthed(u) {
    // /auth/register and /auth/login return a slim user object, so pull the
    // full profile to find out whether onboarding is still pending.
    try {
      const me = await apiMe();
      setUser(me);
      setPhase(me.onboarded ? 'ready' : 'onboarding');
      if (me.onboarded) go('learn');
    } catch (e) {
      setUser(u);
      setPhase('onboarding');
    }
  }

  function handleOnboardingDone(profile) {
    if (profile) setUser(profile);
    setPhase('ready');
    go('learn');
  }

  function handleLogout() {
    logout();
    setUser(null); setStats(null); setResult(null);
    try { localStorage.removeItem('kotoba_v'); } catch (e) {}
    setView('home');
    setPhase('auth');
  }

  if (phase === 'checking') {
    return (
      <div className="app">
        <div className="paper-tex"/>
        <BootSplash label="Signing you in…"/>
      </div>
    );
  }

  if (phase === 'auth') {
    return (
      <div className="app">
        <div className="paper-tex"/>
        <AuthScreen onAuthed={handleAuthed}/>
      </div>
    );
  }

  if (phase === 'onboarding') {
    return (
      <div className="app">
        <div className="paper-tex"/>
        <Onboarding onDone={handleOnboardingDone}/>
      </div>
    );
  }

  return (
    <div className={'app' + (view==='play' ? ' playing' : '')}>
      <div className="paper-tex"/>
      <Sidebar view={view} go={go} user={user} stats={stats}/>
      <div className="main">
        <Topbar stats={stats}/>
        {view==='home'     && <Landing  go={go} user={user} stats={stats}/>}
        {view==='learn'    && <LearnHub go={go} user={user} stats={stats}/>}
        {view==='play'     && <Game key={gameKey}
                                    level={playLevel || (user && user.jlpt_level) || 5}
                                    onComplete={r=>{setResult(r);setView('results');refreshStats();}}
                                    onExit={()=>go('learn')}/>}
        {view==='results'  && <Results  go={go} res={result}/>}
        {view==='progress' && <Progress stats={stats}/>}
        {view==='profile'  && <Profile  go={go} user={user} stats={stats}
                                        onUser={setUser}
                                        onLogout={handleLogout}
                                        onRefreshStats={refreshStats}/>}
      </div>
      <BottomNav view={view} go={go}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);