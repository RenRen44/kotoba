// kotoba-ui.jsx
const { useState, useEffect, useMemo } = React;

function Ring({ value=0, size=96, stroke=9, color='var(--peach)', track='rgba(255,255,255,0.10)', children }) {
  const [v, setV] = useState(0);
  useEffect(() => { const t = setTimeout(() => setV(value), 160); return () => clearTimeout(t); }, [value]);
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c-(v/100)*c}
          style={{ transition:'stroke-dashoffset 1.3s cubic-bezier(.16,.84,.44,1)' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center' }}>
        {children}
      </div>
    </div>
  );
}

function Count({ to, dur=1200, suffix='' }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf, start;
    const step = t => {
      if (!start) start = t;
      const p = Math.min((t-start)/dur, 1);
      setN(Math.round((1-Math.pow(1-p,3))*to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <React.Fragment>{n}{suffix}</React.Fragment>;
}

function Bar({ value, cls='', light=false }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 220); return () => clearTimeout(t); }, [value]);
  return (
    <div className={'bar' + (light ? ' on-light' : '')}>
      <i className={cls} style={{ width: w+'%' }}/>
    </div>
  );
}

function tint(color) {
  const map = {
    'var(--peach)': 'rgba(241,133,90,0.13)',
    'var(--honey)': 'rgba(243,178,78,0.15)',
    'var(--sage)':  'rgba(95,174,142,0.14)',
    'var(--lav)':   'rgba(140,130,201,0.14)',
    'var(--terra)': 'rgba(224,104,92,0.13)',
  };
  return map[color] || 'rgba(32,30,51,0.07)';
}

function StatCard({ icon, color, value, label, jp }) {
  return (
    <div className="stat-card">
      <div className="ic" style={{ background: tint(color), color }}>{icon}</div>
      <div className="v">{value}</div>
      <div className="l">{label} <span className="jp">{jp}</span></div>
    </div>
  );
}
Object.assign(window, { Ring, Count, Bar, tint, StatCard });
