// kotoba-icons.jsx
const I = {
  // ── UI icons (unchanged) ──
  home:   (s=22)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 11l8-6 8 6v8a1 1 0 01-1 1h-4v-5h-6v5H5a1 1 0 01-1-1v-8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  learn:  (s=22)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 6.5C4 5.7 4.7 5 5.5 5H11v14H5.5A1.5 1.5 0 014 17.5v-11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M20 6.5C20 5.7 19.3 5 18.5 5H13v14h5.5a1.5 1.5 0 001.5-1.5v-11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  chart:  (s=22)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 19V5M5 19h14M9 19v-5M13 19V8M17 19v-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  user:   (s=22)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="3.6" stroke="currentColor" strokeWidth="1.8"/><path d="M5.5 19c1-3.4 3.6-5 6.5-5s5.5 1.6 6.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  flame:  (s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3c1 3-2 4-2 7a2 2 0 104 0c0-1 1-2 1-2 2 2 3 4 3 6a6 6 0 11-12 0c0-4 4-6 6-11z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  bolt:   (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  target: (s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8"/></svg>,
  check:  (s=20)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  x:      (s=20)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>,
  close:  (s=22)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  arrow:  (s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  play:   (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor"/></svg>,
  chev:   (s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  clock:  (s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  trophy: (s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M7 4h10v4a5 5 0 01-10 0V4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M9 15h6M10 19h4M12 15v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  book:   (s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 5.5C4 5 4.4 4.5 5 4.5h6V19H5a1 1 0 01-1-1V5.5zM20 5.5c0-.5-.4-1-1-1h-6V19h6a1 1 0 001-1V5.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  lock:   (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8"/></svg>,
  star:   (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l2.4 6.5H21l-5.5 4 2.1 6.5L12 16l-5.6 4 2.1-6.5L3 9.5h6.6L12 3z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  spark:  (s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,

  // ── Japanese cultural icons (new) ──

  // Torii gate — replaces 🎯 (Adaptive Drills)
  torii: (s=28)=><svg width={s} height={s} viewBox="0 0 28 28" fill="none">
    <rect x="3" y="7" width="22" height="2.6" rx="1.3" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="5.5" y="11" width="17" height="2.2" rx="1.1" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="7" y="13.2" width="2.2" height="11" rx="1.1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="18.8" y="13.2" width="2.2" height="11" rx="1.1" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M3 8.3C3 7 5 5 14 5s11 2 11 3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>,

  // Fan (sensu) — replaces 📖 (Vocabulary)
  fan: (s=28)=><svg width={s} height={s} viewBox="0 0 28 28" fill="none">
    <path d="M14 22 L4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 22 L7 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 22 L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 22 L16.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 22 L21 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 22 L24 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4.5 6.5 Q7 3.5 11.5 3.5 Q14 3.5 16.5 3.5 Q21 3.5 23.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="currentColor" fillOpacity="0.10"/>
    <circle cx="14" cy="22" r="1.6" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1"/>
  </svg>,

  // Paper lantern — replaces 📰 (Reading)
  lantern: (s=28)=><svg width={s} height={s} viewBox="0 0 28 28" fill="none">
    <line x1="14" y1="2" x2="14" y2="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="9" y="5.5" width="10" height="2" rx="1" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1"/>
    <ellipse cx="14" cy="15" rx="6" ry="8" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.6"/>
    <line x1="8" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.5"/>
    <line x1="8" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.5"/>
    <line x1="8" y1="19" x2="20" y2="19" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.5"/>
    <rect x="11" y="23" width="6" height="1.8" rx="0.9" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.08"/>
    <line x1="14" y1="24.8" x2="14" y2="27" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>,

  // Mt Fuji — replaces 📈 (Progress)
  fuji: (s=28)=><svg width={s} height={s} viewBox="0 0 28 28" fill="none">
    <path d="M14 4 L22 18 H6 Z" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M11 8.5 Q14 6 17 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="currentColor" fillOpacity="0.22"/>
    <path d="M3 22 Q8 18 14 18 Q20 18 25 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <circle cx="22" cy="7" r="3" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.3"/>
  </svg>,

  // Maneki neko (lucky cat) — replaces 🤖 (AI Tutor)
  neko: (s=28)=><svg width={s} height={s} viewBox="0 0 28 28" fill="none">
    <ellipse cx="14" cy="14" rx="7.5" ry="8" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6.5 7 L4 3 L8 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21.5 7 L24 3 L20 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="11" cy="13" r="1.2" fill="currentColor" fillOpacity="0.7"/>
    <circle cx="17" cy="13" r="1.2" fill="currentColor" fillOpacity="0.7"/>
    <path d="M11.5 16.5 Q14 18 16.5 16.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    <path d="M14 16 L14 17.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M19 18 Q23 14 22 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    <path d="M20.5 18.5 Q24 22 20 23" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
  </svg>,

  // Katana / brush — replaces ✍️ (Grammar)
  katana: (s=28)=><svg width={s} height={s} viewBox="0 0 28 28" fill="none">
    <path d="M5 23 L21 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M19.5 3.5 L24.5 8.5 L22 7 L21 5 Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <rect x="3" y="20.5" width="5" height="3" rx="1" transform="rotate(-45 5 23)" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.3"/>
    <line x1="10" y1="18" x2="12" y2="16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
  </svg>,

  // Sakura petal — used in hero bg
  petal: (s=16)=><svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M8 2 Q11 5 8 8 Q5 5 8 2Z" fill="currentColor" fillOpacity="0.7"/>
    <path d="M8 8 Q11 11 8 14 Q5 11 8 8Z" fill="currentColor" fillOpacity="0.5"/>
    <path d="M2 8 Q5 5 8 8 Q5 11 2 8Z" fill="currentColor" fillOpacity="0.6"/>
    <path d="M8 8 Q11 5 14 8 Q11 11 8 8Z" fill="currentColor" fillOpacity="0.4"/>
    <circle cx="8" cy="8" r="1.2" fill="currentColor" fillOpacity="0.9"/>
  </svg>,

  // Lotus — achievement icon
  lotus: (s=28)=><svg width={s} height={s} viewBox="0 0 28 28" fill="none">
    <path d="M14 20 Q14 13 14 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M14 10 Q10 7 7 10 Q10 16 14 16Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M14 10 Q18 7 21 10 Q18 16 14 16Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M14 8 Q14 4 14 3 Q11 5 11 8 Q12.5 9 14 8Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M14 8 Q14 4 14 3 Q17 5 17 8 Q15.5 9 14 8Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M7 20 Q10 20 14 20 Q18 20 21 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,

  // Origami crane — achievement icon
  crane: (s=28)=><svg width={s} height={s} viewBox="0 0 28 28" fill="none">
    <path d="M14 8 L20 14 L14 16 L8 14 Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M14 16 L14 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M14 22 L10 26" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M14 22 L18 26" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M20 14 L25 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M8 14 L3 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M14 8 L14 4 L17 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,

  // Koi fish — achievement icon
  koi: (s=28)=><svg width={s} height={s} viewBox="0 0 28 28" fill="none">
    <path d="M6 14 Q10 6 18 9 Q22 11 22 14 Q22 17 18 19 Q10 22 6 14Z" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M22 14 L27 10 M22 14 L27 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="10" cy="12" r="1.3" fill="currentColor" fillOpacity="0.7"/>
    <path d="M14 9.5 Q16 11 16 14 Q16 16 14 18" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.5"/>
  </svg>,

  // Bonsai — achievement icon
  bonsai: (s=28)=><svg width={s} height={s} viewBox="0 0 28 28" fill="none">
    <rect x="9" y="22" width="10" height="3.5" rx="1.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="14" y1="22" x2="14" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 17 Q10 12 7 14 Q9 10 14 11Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M14 17 Q18 12 21 14 Q19 10 14 11Z" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M14 13 Q12 8 10 9 Q11 5 14 7 Q17 5 18 9 Q16 8 14 13Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <line x1="11" y1="20" x2="9" y2="22" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5"/>
    <line x1="17" y1="20" x2="19" y2="22" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5"/>
  </svg>,
};
Object.assign(window, { I });
