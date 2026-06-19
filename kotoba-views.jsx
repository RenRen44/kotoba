// kotoba-views.jsx — all screens with upgraded animations + Japanese icons
const { useState: uSt, useEffect: uEf, useMemo: uM, useRef: uRf } = React;

/* ── Magnetic 3D tilt card ── */
function useMagneticTilt(strength = 10) {
  const ref = uRf(null);
  uEf(() => {
    const el = ref.current; if (!el) return;
    const onMove = e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      el.style.transform = `perspective(700px) rotateY(${x*strength}deg) rotateX(${-y*strength}deg) translateY(-6px) scale(1.02)`;
      el.style.boxShadow = `${-x*8}px ${-y*8}px 40px -10px rgba(32,30,51,0.22)`;
    };
    const onLeave = () => { el.style.transform = ''; el.style.boxShadow = ''; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, [strength]);
  return ref;
}

function FeatCard({ icon, kana, title, desc, tint, color }) {
  const ref = useMagneticTilt(9);
  return (
    <div className="feat-card" ref={ref} style={{ '--feat-tint': tint }}>
      <div className="feat-icon" style={{ background: tint, color: color || 'var(--peach)' }}>{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <div className="feat-kana">{kana}</div>
    </div>
  );
}

/* ── Sakura petal component ── */
function SakuraBg() {
  const petals = uM(() => Array.from({ length: 14 }, (_, i) => ({
    left:  `${5 + ((i * 17) % 88)}%`,
    size:  10 + Math.sin(i * 1.7) * 6,
    dur:   `${18 + i * 3.2}s`,
    delay: `${i * 1.8}s`,
    drift: (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40),
    startY: `${-5 + ((i * 7) % 20)}%`,
  })), []);

  return (
    <div className="sakura-bg" aria-hidden="true">
      {petals.map((p, i) => (
        <span key={i} className="sakura-petal" style={{
          left: p.left,
          top: p.startY,
          fontSize: p.size + 'px',
          animationDuration: p.dur,
          animationDelay: p.delay,
          '--drift': p.drift + 'px',
          color: 'rgba(241,133,90,0.55)',
        }}>
          {I.petal(p.size)}
        </span>
      ))}
    </div>
  );
}

/* ── Result icon based on score ── */
function ResultKanji({ acc }) {
  if (acc >= 85) return (
    <div style={{
      fontFamily:'var(--jp)', fontWeight:900, fontSize:52,
      color:'var(--honey)', lineHeight:1, marginBottom:10,
      filter:'drop-shadow(0 4px 16px rgba(243,178,78,0.5))',
      animation:'resultKanjiPop .7s cubic-bezier(.34,1.56,.64,1) both',
    }}>完</div>
  );
  if (acc >= 65) return (
    <div style={{
      fontFamily:'var(--jp)', fontWeight:900, fontSize:52,
      color:'var(--sage)', lineHeight:1, marginBottom:10,
      filter:'drop-shadow(0 4px 16px rgba(95,174,142,0.5))',
      animation:'resultKanjiPop .7s cubic-bezier(.34,1.56,.64,1) both',
    }}>良</div>
  );
  return (
    <div style={{
      fontFamily:'var(--jp)', fontWeight:900, fontSize:52,
      color:'var(--peach)', lineHeight:1, marginBottom:10,
      filter:'drop-shadow(0 4px 16px rgba(241,133,90,0.5))',
      animation:'resultKanjiPop .7s cubic-bezier(.34,1.56,.64,1) both',
    }}>力</div>
  );
}

/* ══════════════════════════════════════════
   LANDING
══════════════════════════════════════════ */
function Landing({ go }) {
  const features = [
    {
      icon: I.fan(26), kana:'語', title:'Vocabulary',
      desc:'JLPT N5–N1 words with frequency ranking, readings, and smart review scheduling.',
      tint:'rgba(241,133,90,0.11)', color:'var(--peach)',
    },
    {
      icon: <span style={{fontFamily:'var(--jp)',fontWeight:900,fontSize:22,lineHeight:1}}>漢</span>,
      kana:'字', title:'Kanji',
      desc:'Learn kanji with stroke order, meanings, on/kun readings, and example words.',
      tint:'rgba(243,178,78,0.11)', color:'var(--honey)',
    },
    {
      icon: I.katana(26), kana:'法', title:'Grammar',
      desc:'JLPT grammar points explained with examples, exercises and real sentence context.',
      tint:'rgba(95,174,142,0.11)', color:'var(--sage)',
    },
    {
      icon: I.torii(26), kana:'練', title:'Adaptive Drills',
      desc:'The system learns what you struggle with and serves it back at the right moment.',
      tint:'rgba(140,130,201,0.11)', color:'var(--lav)',
    },
    {
      icon: I.fuji(26), kana:'録', title:'Progress Tracking',
      desc:'Real-time JLPT readiness scores, streaks, accuracy heatmaps and weak spots.',
      tint:'rgba(241,133,90,0.11)', color:'var(--peach)',
    },
    {
      icon: I.neko(26), kana:'師', title:'AI Tutor',
      desc:'Ask anything — grammar questions, nuance between words, example sentences.',
      tint:'rgba(95,174,142,0.11)', color:'var(--sage)',
    },
  ];

  const bgKana = ['日','本','語','学','習','文','字','音','心','力'];

  return (
    <div className="landing page-enter">
      {/* HERO */}
      <div className="land-hero">
        <div className="land-orb1"/><div className="land-orb2"/><div className="land-orb3"/>

        {/* drifting kana bg */}
        <div className="land-kana-bg">
          {bgKana.map((k,i)=>(
            <span key={i} style={{
              fontSize:`${52+Math.sin(i*1.4)*36}px`,
              top:`${8+((i*43)%82)}%`, left:`${4+((i*21)%88)}%`,
              animationDuration:`${20+i*4}s`, animationDelay:`${i*1.4}s`,
            }}>{k}</span>
          ))}
        </div>

        {/* sakura petals */}
        <SakuraBg />

        {/* torii silhouette decoration */}
        <div className="land-torii-deco" aria-hidden="true">
          {I.torii(120)}
        </div>

        <div className="land-hero-left">
          <div className="land-eyebrow">{I.spark(13)} Adaptive Japanese Learning</div>
          <h1 className="land-h1">
            Learn Japanese<br/>
            <span className="accent">the way</span>{' '}
            <span className="jp-word">あなた</span> learn.
          </h1>
          <p className="land-sub">
            Kotoba adapts to your strengths and weaknesses in real time — serving you exactly the words, kanji, and grammar you need, exactly when you need them.
          </p>
          <div className="land-actions">
            <button className="btn btn-peach" style={{fontSize:16,padding:'16px 32px'}} onClick={()=>go('learn')}>
              {I.play(16)} Start learning
            </button>
            <button className="btn btn-ghost" onClick={()=>go('progress')}>
              View my progress
            </button>
          </div>
          <div className="land-note" style={{marginTop:18}}>
            {I.check(13)} Free · No account needed · N5 vocab live now
          </div>
        </div>

        <div className="land-hero-right">
          <Mascot size={190} className="mascot-float"/>
        </div>
      </div>

      {/* FEATURES */}
      <div className="features-strip">
        <div className="features-label">What's inside</div>
        <div className="features-grid stagger">
          {features.map((f,i) => <FeatCard key={i} {...f}/>)}
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row stagger">
        <div className="stat-pill">
          <div className="stat-pill-icon">{I.fan(22)}</div>
          <div className="num"><Count to={8000}/>+</div>
          <div className="desc">JLPT vocabulary words</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-icon" style={{fontFamily:'var(--jp)',fontWeight:900,fontSize:20,color:'var(--peach)'}}>漢</div>
          <div className="num"><Count to={2136}/></div>
          <div className="desc">Jōyō kanji covered</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-icon">{I.fuji(22)}</div>
          <div className="num"><Count to={5}/> <span className="unit">levels</span></div>
          <div className="desc">N5 through N1</div>
        </div>
      </div>

      {/* CTA */}
      <div className="land-cta">
        <div className="land-cta-orb"/>
        {/* decorative kana strip */}
        <div className="land-cta-kana-strip" aria-hidden="true">
          {['日','本','語','を','学','ぼ','う'].map((k,i)=>(
            <span key={i} style={{fontFamily:'var(--jp)',fontWeight:900,color:'rgba(255,255,255,0.06)',fontSize:38}}>{k}</span>
          ))}
        </div>
        <div className="land-cta-left">
          <h2>Ready to start your first session?</h2>
          <p>N5 vocabulary is live right now — 16 words, fully adaptive. More content dropping soon.</p>
        </div>
        <div className="land-cta-right">
          <button className="btn btn-peach" style={{fontSize:16,padding:'16px 34px',whiteSpace:'nowrap'}} onClick={()=>go('learn')}>
            {I.arrow(18)} Go to Learn
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   LEARN HUB
══════════════════════════════════════════ */
function LearnHub({ go }) {
  const categories = [
    {
      id:'vocab',
      iconEl: I.fan(22),
      iconBg:'rgba(241,133,90,0.13)', iconColor:'var(--peach)',
      title:'Vocabulary', jp:'語彙', available:true,
      levels:[
        { tag:'N5', kana:'語', title:'N5 Vocab',  meta:'16 words',   words:16,   progress:34, available:true  },
        { tag:'N4', kana:'語', title:'N4 Vocab',  meta:'~300 words', words:300,  progress:0,  available:false },
        { tag:'N3', kana:'語', title:'N3 Vocab',  meta:'~650 words', words:650,  progress:0,  available:false },
        { tag:'N2', kana:'語', title:'N2 Vocab',  meta:'~1k words',  words:1000, progress:0,  available:false },
        { tag:'N1', kana:'語', title:'N1 Vocab',  meta:'~2k words',  words:2000, progress:0,  available:false },
      ],
    },
    {
      id:'kanji',
      iconEl: <span style={{fontFamily:'var(--jp)',fontWeight:900,fontSize:20,lineHeight:1}}>漢</span>,
      iconBg:'rgba(243,178,78,0.13)', iconColor:'var(--honey)',
      title:'Kanji', jp:'漢字', available:false,
      levels:[
        { tag:'N5', kana:'漢', title:'N5 Kanji',  meta:'80 kanji',   words:80,   progress:0, available:false },
        { tag:'N4', kana:'漢', title:'N4 Kanji',  meta:'170 kanji',  words:170,  progress:0, available:false },
        { tag:'N3', kana:'漢', title:'N3 Kanji',  meta:'370 kanji',  words:370,  progress:0, available:false },
        { tag:'N2', kana:'漢', title:'N2 Kanji',  meta:'740 kanji',  words:740,  progress:0, available:false },
        { tag:'N1', kana:'漢', title:'N1 Kanji',  meta:'~1k kanji',  words:1000, progress:0, available:false },
      ],
    },
    {
      id:'grammar',
      iconEl: I.katana(22),
      iconBg:'rgba(95,174,142,0.13)', iconColor:'var(--sage)',
      title:'Grammar', jp:'文法', available:false,
      levels:[
        { tag:'N5', kana:'法', title:'N5 Grammar', meta:'~30 points', words:30,  progress:0, available:false },
        { tag:'N4', kana:'法', title:'N4 Grammar', meta:'~60 points', words:60,  progress:0, available:false },
        { tag:'N3', kana:'法', title:'N3 Grammar', meta:'~90 points', words:90,  progress:0, available:false },
        { tag:'N2', kana:'法', title:'N2 Grammar', meta:'~150 pts',   words:150, progress:0, available:false },
        { tag:'N1', kana:'法', title:'N1 Grammar', meta:'~200 pts',   words:200, progress:0, available:false },
      ],
    },
    {
      id:'reading',
      iconEl: I.lantern(22),
      iconBg:'rgba(140,130,201,0.13)', iconColor:'var(--lav)',
      title:'Reading', jp:'読解', available:false,
      levels:[
        { tag:'N5', kana:'読', title:'Short Texts',  meta:'Beginner',     words:0, progress:0, available:false },
        { tag:'N4', kana:'読', title:'Simple Texts', meta:'Elementary',   words:0, progress:0, available:false },
        { tag:'N3', kana:'読', title:'Medium Texts', meta:'Intermediate', words:0, progress:0, available:false },
        { tag:'N2', kana:'読', title:'Long Texts',   meta:'Advanced',     words:0, progress:0, available:false },
        { tag:'N1', kana:'読', title:'Native Texts', meta:'Native',       words:0, progress:0, available:false },
      ],
    },
  ];

  function handleLevel(cat, lvl) {
    if (!lvl.available) return;
    if (cat.id==='vocab' && lvl.tag==='N5') go('play');
  }

  return (
    <div className="page page-enter">
      <div className="learn-hero">
        <div className="learn-hero-orb"/>
        <BlobAccent color="rgba(243,178,78,0.18)" size={220} style={{right:-60,bottom:-80}}/>
        {/* decorative torii in hero */}
        <div style={{position:'absolute',right:180,bottom:0,opacity:0.07,pointerEvents:'none',color:'var(--cream)'}}>
          {I.torii(160)}
        </div>
        <div className="learn-hero-text">
          <div className="eyebrow">{I.spark(12)} Your learning path</div>
          <h1>What do you want<br/>to study today?</h1>
          <p>Choose a category and level. N5 Vocabulary is unlocked and playable. Everything else is coming soon.</p>
        </div>
        <div className="learn-hero-right"><Mascot size={110} mood="wink"/></div>
      </div>

      <div className="stagger">
        {categories.map(cat=>(
          <div className="cat-section" key={cat.id}>
            <div className="cat-header">
              <div className="cat-icon-big" style={{background:cat.iconBg,color:cat.iconColor}}>{cat.iconEl}</div>
              <div><h2>{cat.title}</h2><div className="cat-jp">{cat.jp}</div></div>
              <div className={'cat-badge '+(cat.available?'active':'soon')}>
                {cat.available ? '✓ Available' : 'Coming soon'}
              </div>
            </div>
            <div className="levels-grid">
              {cat.levels.map((lvl,i)=>(
                <div key={i}
                     className={'level-card '+(lvl.available?'unlocked':'locked')}
                     onClick={()=>handleLevel(cat,lvl)}>
                  {!lvl.available && <div className="lc-lock">{I.lock(13)}</div>}
                  {lvl.available  && <div className="lc-words">{lvl.words} words</div>}
                  {lvl.available  && <div className="lc-arrow">{I.arrow(14)}</div>}
                  <div>
                    <div className="lc-tag">{lvl.tag}</div>
                    <div className="lc-kana">{lvl.kana}</div>
                  </div>
                  <div>
                    <div className="lc-title">{lvl.title}</div>
                    <div className="lc-meta">{lvl.meta}</div>
                    {lvl.available && lvl.progress > 0 && (
                      <div className="lc-progress"><Bar value={lvl.progress} cls="peach"/></div>
                    )}
                    {lvl.available && lvl.progress === 0 && (
                      <div style={{marginTop:8,fontSize:11,color:'var(--peach)',fontWeight:700}}>← Tap to start</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
  const acc = res ? Math.round((res.correct/res.total)*100) : 0;
  const xp  = res ? res.correct*10 + (res.best>=3?25:0) : 0;
  return (
    <div className="results-page page-enter">
      <div className="result-card">
        <BlobAccent color="rgba(243,178,78,0.26)" size={300} style={{right:-80,top:-110}}/>
        <BlobAccent color="rgba(241,133,90,0.16)" size={220} style={{left:-70,bottom:-80}}/>
        <div style={{position:'relative',zIndex:1}}>
          {/* kanji instead of emoji */}
          <ResultKanji acc={acc}/>
          <h2>Session complete!</h2>
          <div style={{display:'flex',justifyContent:'center'}}>
            <Ring value={acc} size={144} stroke={13} color="var(--sage)">
              <div>
                <div style={{fontFamily:'var(--display)',fontWeight:800,fontSize:38,lineHeight:1,color:'var(--cream)'}}>
                  <Count to={acc} suffix="%"/>
                </div>
                <div style={{fontSize:12,color:'var(--cream-2)',marginTop:2}}>accuracy</div>
              </div>
            </Ring>
          </div>
          <div className="res-stats">
            <div className="res-stat"><div className="jp">単語</div><div className="v">{res?.correct}/{res?.total}</div><div className="l">Correct</div></div>
            <div className="res-stat"><div className="jp">連続</div><div className="v">×{res?.best}</div><div className="l">Best combo</div></div>
            <div className="res-stat"><div className="jp">経験値</div><div className="v" style={{color:'var(--honey)'}}>+{xp}</div><div className="l">XP gained</div></div>
          </div>
        </div>
      </div>
      <div style={{marginTop:28}}>
        <div className="section-head"><h2>Review these next</h2><span className="jp">復習</span></div>
        <div className="review-list">
          {REVIEW_WORDS.map((r,i)=>(
            <div className="review-row" key={i}>
              <span className="rw">{r.w}</span>
              <span className="rr">{r.r}</span>
              <span className="rm">{r.m}</span>
              <span style={{color:'var(--ink-3)',display:'flex'}}>{I.chev(16)}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:'flex',gap:12,marginTop:28}}>
        <button className="btn btn-soft" style={{flex:1}} onClick={()=>go('home')}>Back home</button>
        <button className="btn btn-peach" style={{flex:2}} onClick={()=>go('play')}>{I.arrow(18)} Play again</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PROGRESS
══════════════════════════════════════════ */
function useRealStats() {
  return uM(() => {
    try {
      const answers = JSON.parse(localStorage.getItem('kotoba_answers') || '[]');
      if (answers.length === 0) return null;

      const total     = answers.length;
      const correct   = answers.filter(a => a.correct).length;
      const accuracy  = Math.round((correct / total) * 100);

      // unique words seen
      const uniqueWords = new Set(answers.map(a => a.word)).size;

      // session count — group by day
      const days = new Set(answers.map(a =>
        new Date(a.timestamp).toDateString()
      )).size;

      // best combo from localStorage
      const bestCombo = parseInt(localStorage.getItem('kotoba_best_combo') || '0');

      // N5 accuracy
      const n5 = answers.filter(a => a.level === 'N5');
      const n5acc = n5.length > 0
        ? Math.round((n5.filter(a => a.correct).length / n5.length) * 100)
        : 0;

      // heatmap — last 53*7 days
      const now = Date.now();
      const DAY = 86400000;
      const heatMap = Array.from({ length: 53 * 7 }, (_, i) => {
        const dayStart = now - (53 * 7 - i) * DAY;
        const dayEnd   = dayStart + DAY;
        return answers.filter(a => a.timestamp >= dayStart && a.timestamp < dayEnd).length;
      });
      const maxDay = Math.max(...heatMap, 1);

      return { total, correct, accuracy, uniqueWords, days, bestCombo, n5acc, heatMap, maxDay };
    } catch(e) {
      return null;
    }
  }, []);
}

function Progress() {
  const stats = useRealStats();
  const heatColors = ['var(--sand)','rgba(243,178,78,0.28)','rgba(243,178,78,0.52)','var(--honey)','var(--peach)'];

  const jlpt = [
    { lv:'N5', pct: stats ? stats.n5acc : 0,  cls:'sage', cur: true },
    { lv:'N4', pct: 0, cls:'' },
    { lv:'N3', pct: 0, cls:'' },
    { lv:'N2', pct: 0, cls:'' },
    { lv:'N1', pct: 0, cls:'' },
  ];

  if (!stats) {
    return (
      <div className="page page-enter">
        <div style={{marginBottom:28}}>
          <p style={{fontFamily:'var(--jp)',color:'var(--peach)',fontWeight:700,fontSize:14,margin:'0 0 6px'}}>学習記録</p>
          <h1 style={{fontFamily:'var(--display)',fontWeight:800,fontSize:32,letterSpacing:'-0.02em',margin:0}}>Your progress</h1>
        </div>
        <div className="card" style={{padding:40,textAlign:'center'}}>
          <div style={{fontFamily:'var(--jp)',fontSize:48,color:'var(--ink-3)',marginBottom:16}}>始</div>
          <div style={{fontWeight:700,fontSize:18,marginBottom:8}}>No sessions yet</div>
          <div style={{color:'var(--ink-3)',fontSize:14}}>Play your first quiz to start tracking progress!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <div style={{marginBottom:28}}>
        <p style={{fontFamily:'var(--jp)',color:'var(--peach)',fontWeight:700,fontSize:14,margin:'0 0 6px',letterSpacing:'0.05em'}}>学習記録</p>
        <h1 style={{fontFamily:'var(--display)',fontWeight:800,fontSize:32,letterSpacing:'-0.02em',margin:0}}>Your progress</h1>
        <p style={{color:'var(--ink-3)',fontSize:14,margin:'8px 0 0'}}>
          {stats.uniqueWords} words seen across {stats.days} study day{stats.days!==1?'s':''}.
        </p>
      </div>
      <div className="stat-grid">
        <StatCard icon={I.trophy(18)} color="var(--honey)" value={<Count to={stats.days}/>}              label="Study days"  jp="日"/>
        <StatCard icon={I.book(18)}   color="var(--peach)" value={<Count to={stats.uniqueWords}/>}       label="Words seen"  jp="単語"/>
        <StatCard icon={I.target(18)} color="var(--sage)"  value={<Count to={stats.accuracy} suffix="%"/>} label="Accuracy" jp="正答率"/>
        <StatCard icon={I.bolt(18)}   color="var(--lav)"   value={<Count to={stats.total}/>}             label="Answers"     jp="回答"/>
      </div>
      <div className="section-head"><h2>JLPT readiness</h2><span className="jp">試験準備</span></div>
      <div className="card jlpt-card">
        {jlpt.map((j,i)=>(
          <div className="jlpt-row" key={i}>
            <span className={'jlpt-tag'+(j.cur?' cur':'')}>{j.lv}</span>
            <Bar value={j.pct} cls={j.cls} light/>
            <span className="jlpt-pct" style={{color:j.cur?'var(--peach)':'var(--ink-2)'}}>{j.pct}%</span>
          </div>
        ))}
      </div>
      <div className="section-head">
        <h2>Activity</h2><span className="jp">活動</span>
        <span className="more">{stats.total} answers</span>
      </div>
      <div className="card" style={{padding:'24px 26px',overflowX:'auto'}}>
        <div className="heat">
          {stats.heatMap.map((v,i)=>{
            const ratio = v / stats.maxDay;
            const lvl = v===0?0:ratio>0.75?4:ratio>0.5?3:ratio>0.25?2:1;
            return <i key={i} style={{background:heatColors[lvl]}}/>;
          })}
        </div>
        <div className="heat-legend">less&nbsp;{heatColors.map((c,i)=><i key={i} style={{background:c}}/>)}&nbsp;more</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PROFILE
══════════════════════════════════════════ */
function Profile({ go }) {
  const achievements = [
    { iconEl: I.crane(32),  title:'Week warrior',  desc:'7-day streak',      unlocked:true,  color:'var(--honey)'},
    { iconEl: I.lotus(32),  title:'Century',       desc:'100 words learned', unlocked:true,  color:'var(--peach)'},
    { iconEl: I.fuji(32),   title:'Perfectionist', desc:'100% session',      unlocked:true,  color:'var(--sage)' },
    { iconEl: I.koi(32),    title:'Combo master',  desc:'20× combo',         unlocked:false, color:'var(--lav)'  },
  ];
  const settings = ['Daily goal','Notifications','Audio & pronunciation','App language','Account'];
  return (
    <div className="page page-enter">
      <div className="profile-hero">
        <BlobAccent color="rgba(243,178,78,0.28)" size={280} style={{right:-90,top:-100}}/>
        {/* decorative bonsai */}
        <div style={{position:'absolute',right:110,bottom:0,opacity:0.08,color:'var(--cream)',pointerEvents:'none'}}>
          {I.bonsai(90)}
        </div>
        <div className="avatar" style={{width:76,height:76,flex:'0 0 76px',fontSize:30,position:'relative'}}>R</div>
        <div style={{position:'relative',flex:1,minWidth:0}}>
          <h1>Ren Takahashi</h1>
          <p className="sub">Level N4 · 248 words mastered · joined Mar 2025</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <span className="chip" style={{background:'rgba(255,255,255,0.09)',border:'none',color:'var(--cream)'}}>
              {I.flame(14)}<b style={{color:'var(--honey)',fontFamily:'var(--display)'}}>12</b> day streak
            </span>
            <span className="chip" style={{background:'rgba(255,255,255,0.09)',border:'none',color:'var(--cream)'}}>
              {I.trophy(14)}<b style={{fontFamily:'var(--display)'}}>Rank 142</b>
            </span>
          </div>
        </div>
        <div style={{position:'relative',flexShrink:0}}><Mascot size={90} mood="wink"/></div>
      </div>
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
      <div className="section-head"><h2>Settings</h2><span className="jp">設定</span></div>
      <div className="card settings-list">
        {settings.map((s,i)=>(
          <div className="settings-row" key={i}>
            <span className="s-label">{s}</span>
            <span style={{color:'var(--ink-3)',display:'flex'}}>{I.chev(16)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Landing, LearnHub, Results, Progress, Profile });