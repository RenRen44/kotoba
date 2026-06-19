// kotoba-onboarding.jsx — full onboarding flow
const { useState: obSt, useEffect: obEf, useRef: obRf } = React;

/* ══════════════════════════════════════════
   ONBOARDING SHELL
══════════════════════════════════════════ */
function Onboarding({ onDone }) {
  const [step, setStep] = obSt(0); // 0=welcome, 1=why, 2=level, 3=goal
  const [data, setData] = obSt({ why: null, level: null, goal: null });
  const play = useSound();

  function next(patch = {}) {
    play();
    const next = { ...data, ...patch };
    setData(next);
    if (step === 3) {
      localStorage.setItem('kotoba_onboarded', '1');
      localStorage.setItem('kotoba_user', JSON.stringify(next));
      onDone(next);
    } else {
      setStep(s => s + 1);
    }
  }

  function pick(key, val) {
    play();
    setData(d => ({ ...d, [key]: val }));
  }

  return (
    <div className="ob-shell">
      {/* ambient orbs */}
      <div className="ob-orb1" /><div className="ob-orb2" /><div className="ob-orb3" />

      {/* floating kana bg */}
      <div className="ob-kana-bg" aria-hidden="true">
        {['日','本','語','学','習','言','葉','心'].map((k,i) => (
          <span key={i} style={{
            position:'absolute',
            fontFamily:'var(--jp)', fontWeight:900,
            color:'rgba(255,255,255,0.028)',
            fontSize: `${44 + Math.sin(i*1.9)*28}px`,
            top:`${10+((i*37)%78)}%`, left:`${6+((i*23)%86)}%`,
            animation:`kanaDrift ${18+i*3}s linear ${i*1.6}s infinite`,
            userSelect:'none', pointerEvents:'none',
          }}>{k}</span>
        ))}
      </div>

      {/* step dots */}
      {step > 0 && (
        <div className="ob-dots">
          {[1,2,3].map(s => (
            <div key={s} className={'ob-dot' + (step===s?' ob-dot-active':step>s?' ob-dot-done':'')}/>
          ))}
        </div>
      )}

      {/* screens */}
      <div className="ob-content" key={step}>
        {step === 0 && <ObWelcome onNext={() => next()} />}
        {step === 1 && <ObWhy    selected={data.why}   onPick={v=>pick('why',v)}   onNext={()=>next()} />}
        {step === 2 && <ObLevel  selected={data.level} onPick={v=>pick('level',v)} onNext={()=>next()} />}
        {step === 3 && <ObGoal   selected={data.goal}  onPick={v=>pick('goal',v)}  onNext={()=>next()} />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 0 — WELCOME
══════════════════════════════════════════ */
function ObWelcome({ onNext }) {
  return (
    <div className="ob-screen ob-welcome">
      <div className="ob-mascot-wrap">
        <Mascot size={148} className="mascot-float" />
        <div className="ob-mascot-bubble">こんにちは！</div>
      </div>
      <div className="ob-welcome-text">
        <div className="ob-tag">{I.spark(13)} Japanese Learning · 日本語</div>
        <h1 className="ob-h1">
          Welcome to<br/>
          <span style={{color:'var(--peach)'}}>Kotoba</span>
        </h1>
        <p className="ob-sub">
          We'd love to learn a little about you so we can build the perfect learning path — just for you.
        </p>
      </div>
      <button className="btn btn-peach ob-cta" onClick={onNext}>
        Let's get started {I.arrow(18)}
      </button>
      <p className="ob-skip">Takes about 30 seconds · No account needed</p>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 1 — WHY
══════════════════════════════════════════ */
const WHY_OPTIONS = [
  { val:'travel',   jp:'旅行',   label:'Travel to Japan',       icon: I.fuji(28)   },
  { val:'anime',    jp:'趣味',   label:'Anime & manga',         icon: I.neko(28)   },
  { val:'work',     jp:'仕事',   label:'Work or business',      icon: I.torii(28)  },
  { val:'moving',   jp:'移住',   label:'Moving to Japan',       icon: I.lantern(28)},
  { val:'culture',  jp:'文化',   label:'Japanese culture',      icon: I.fan(28)    },
  { val:'curious',  jp:'好奇心', label:'Just curious',          icon: I.crane(28)  },
];

function ObWhy({ selected, onPick, onNext }) {
  return (
    <div className="ob-screen">
      <div className="ob-screen-head">
        <div className="ob-step-label">Step 1 of 3</div>
        <h2 className="ob-h2">Why are you learning<br/><span style={{color:'var(--peach)'}}>Japanese?</span></h2>
        <p className="ob-step-sub">Pick the one that fits best — this helps us choose the right vocabulary for you.</p>
      </div>
      <div className="ob-options-grid">
        {WHY_OPTIONS.map(o => (
          <button
            key={o.val}
            className={'ob-option' + (selected===o.val ? ' ob-option-selected' : '')}
            onClick={() => onPick(o.val)}
          >
            <div className="ob-option-icon">{o.icon}</div>
            <div className="ob-option-label">{o.label}</div>
            <div className="ob-option-jp">{o.jp}</div>
            {selected===o.val && <div className="ob-option-check">{I.check(14)}</div>}
          </button>
        ))}
      </div>
      <button
        className={'btn btn-peach ob-cta' + (!selected?' ob-cta-dim':'')}
        onClick={selected ? onNext : undefined}
        style={{marginTop:28}}
      >
        Continue {I.arrow(16)}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 2 — LEVEL
══════════════════════════════════════════ */
const LEVEL_OPTIONS = [
  {
    val:'zero',
    jp:'初心者',
    label:'Total beginner',
    desc:'I don\'t know any Japanese yet',
    kana:'あ',
  },
  {
    val:'kana',
    jp:'初級',
    label:'Know some kana',
    desc:'I can read hiragana / katakana',
    kana:'か',
  },
  {
    val:'studied',
    jp:'中級',
    label:'Studied before',
    desc:'I know some words and grammar',
    kana:'語',
  },
  {
    val:'conversational',
    jp:'上級',
    label:'Conversational',
    desc:'I can hold basic conversations',
    kana:'話',
  },
];

function ObLevel({ selected, onPick, onNext }) {
  return (
    <div className="ob-screen">
      <div className="ob-screen-head">
        <div className="ob-step-label">Step 2 of 3</div>
        <h2 className="ob-h2">How's your<br/><span style={{color:'var(--honey)'}}>Japanese?</span></h2>
        <p className="ob-step-sub">Be honest — we'll place you in the right level automatically.</p>
      </div>
      <div className="ob-levels-list">
        {LEVEL_OPTIONS.map(o => (
          <button
            key={o.val}
            className={'ob-level-row' + (selected===o.val ? ' ob-level-selected' : '')}
            onClick={() => onPick(o.val)}
          >
            <div className="ob-level-kana">{o.kana}</div>
            <div className="ob-level-text">
              <div className="ob-level-label">{o.label}</div>
              <div className="ob-level-desc">{o.desc}</div>
            </div>
            <div className="ob-level-jp">{o.jp}</div>
            <div className={'ob-level-radio' + (selected===o.val?' ob-level-radio-on':'')}/>
          </button>
        ))}
      </div>
      <button
        className={'btn btn-peach ob-cta' + (!selected?' ob-cta-dim':'')}
        onClick={selected ? onNext : undefined}
        style={{marginTop:28}}
      >
        Continue {I.arrow(16)}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 3 — DAILY GOAL
══════════════════════════════════════════ */
const GOAL_OPTIONS = [
  { val:5,  label:'Casual',   desc:'5 words / day',  jp:'気軽に', sub:'~3 min' },
  { val:10, label:'Regular',  desc:'10 words / day', jp:'普通に', sub:'~6 min' },
  { val:20, label:'Serious',  desc:'20 words / day', jp:'本気で', sub:'~12 min' },
  { val:30, label:'Intense',  desc:'30 words / day', jp:'激しく', sub:'~20 min' },
];

function ObGoal({ selected, onPick, onNext }) {
  return (
    <div className="ob-screen">
      <div className="ob-screen-head">
        <div className="ob-step-label">Step 3 of 3</div>
        <h2 className="ob-h2">Set your<br/><span style={{color:'var(--sage)'}}>daily goal</span></h2>
        <p className="ob-step-sub">You can always change this later. Consistency beats intensity.</p>
      </div>
      <div className="ob-goals-grid">
        {GOAL_OPTIONS.map(o => (
          <button
            key={o.val}
            className={'ob-goal-card' + (selected===o.val?' ob-goal-selected':'')}
            onClick={() => onPick(o.val)}
          >
            <div className="ob-goal-jp">{o.jp}</div>
            <div className="ob-goal-label">{o.label}</div>
            <div className="ob-goal-desc">{o.desc}</div>
            <div className="ob-goal-sub">{o.sub}</div>
            {selected===o.val && <div className="ob-goal-check">{I.check(13)}</div>}
          </button>
        ))}
      </div>
      <button
        className={'btn btn-peach ob-cta' + (!selected?' ob-cta-dim':'')}
        onClick={selected ? onNext : undefined}
        style={{marginTop:28}}
      >
        Start learning {I.play(16)}
      </button>
    </div>
  );
}

Object.assign(window, { Onboarding });
