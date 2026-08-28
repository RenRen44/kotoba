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

/* ── Custom cursor ── */
function Cursor() {
  const dotRef  = uR(null);
  const ringRef = uR(null);
  const pos     = uR({ x: -100, y: -100 });
  const ring    = uR({ x: -100, y: -100 });
  const raf     = uR(null);

  uE(() => {
    const onMove = e => { pos.current = { x: e.clientX, y: e.clientY }; };
    const onEnter = () => {
      dotRef.current?.classList.add('hovering');
      ringRef.current?.classList.add('hovering');
    };
    const onLeave = () => {
      dotRef.current?.classList.remove('hovering');
      ringRef.current?.classList.remove('hovering');
    };

    document.addEventListener('mousemove', onMove);
    document.querySelectorAll('button, a, .feat-card, .level-card.unlocked, .review-row, .ach-card, .settings-row, .stat-pill, .ob-option, .ob-level-row, .ob-goal-card')
      .forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); });

    const obs = new MutationObserver(() => {
      document.querySelectorAll('button, a, .feat-card, .level-card.unlocked, .review-row, .ach-card, .ob-option, .ob-level-row, .ob-goal-card')
        .forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); });
    });
    obs.observe(document.body, { childList: true, subtree: true });

    function loop() {
      if (dotRef.current) {
        dotRef.current.style.left = pos.current.x + 'px';
        dotRef.current.style.top  = pos.current.y + 'px';
      }
      ring.current.x += (pos.current.x - ring.current.x) * 0.14;
      ring.current.y += (pos.current.y - ring.current.y) * 0.14;
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + 'px';
        ringRef.current.style.top  = ring.current.y + 'px';
      }
      raf.current = requestAnimationFrame(loop);
    }
    raf.current = requestAnimationFrame(loop);
    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
      obs.disconnect();
    };
  }, []);

  return (
    <React.Fragment>
      <div className="cursor-dot"  ref={dotRef} />
      <div className="cursor-ring" ref={ringRef} />
    </React.Fragment>
  );
}

/* ── Sidebar ── */
function Sidebar({ view, go }) {
  const active = k => view===k||(view==='play'&&k==='learn')||(view==='results'&&k==='learn');
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
          <div className="streak-num">12<span style={{fontSize:12,fontWeight:600,marginLeft:3}}>days</span></div>
          <div className="streak-label">on a streak · 続く</div>
        </div>
      </div>
      <div className="user-row">
        <div className="avatar">R</div>
        <div><div className="user-name">Ren Takahashi</div><div className="user-level">N4 · 248 words</div></div>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <div className="topbar">
      <div className="tb-logo">コ</div>
      <div className="tb-name">Kotoba</div>
      <div className="tb-right">
        <div className="chip honey" style={{fontSize:12,padding:'5px 11px'}}>{I.flame(13)}<b>12</b></div>
      </div>
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

/* ── Root App ── */
function App() {
  const [onboarded, setOnboarded] = uS(() => !!localStorage.getItem('kotoba_onboarded'));
  const [view,    setView]    = uS(() => localStorage.getItem('kotoba_v') || 'home');
  const [result,  setResult]  = uS(null);
  const [gameKey, setGameKey] = uS(0);

  useSoundOnButtons();

  function go(v) {
    if (v==='play') setGameKey(k=>k+1);
    setView(v);
    if (v!=='results') localStorage.setItem('kotoba_v', v);
    const m = document.querySelector('.main');
    if (m) m.scrollTo({ top:0, behavior:'smooth' });
  }

  function handleOnboardingDone(userData) {
    setOnboarded(true);
    go('learn');
  }

  if (!onboarded) {
    return (
      <div className="app">
        <Cursor/>
        <div className="paper-tex"/>
        <Onboarding onDone={handleOnboardingDone}/>
      </div>
    );
  }

  return (
    <div className="app">
      <Cursor/>
      <div className="paper-tex"/>
      <Sidebar view={view} go={go}/>
      <div className="main">
        <Topbar/>
        {view==='home'     && <Landing  go={go}/>}
        {view==='learn'    && <LearnHub go={go}/>}
        {view==='play'     && <Game key={gameKey} onComplete={r=>{setResult(r);setView('results');}} onExit={()=>go('learn')}/>}
        {view==='results'  && <Results  go={go} res={result}/>}
        {view==='progress' && <Progress/>}
        {view==='profile'  && <Profile  go={go}/>}
      </div>
      <BottomNav view={view} go={go}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);