// kotoba-icons.jsx
const I = {
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
};
Object.assign(window, { I });
