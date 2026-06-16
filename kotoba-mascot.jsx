// kotoba-mascot.jsx
function Mascot({ size=120, mood='happy', style={}, className='' }) {
  const rEye = mood === 'wink'
    ? <path d="M70 60c2.4-2 6-2 8.4 0" stroke="#201E33" strokeWidth="3.4" strokeLinecap="round" fill="none"/>
    : <circle cx="74.4" cy="60" r="4.6" fill="#201E33"/>;
  return (
    <svg width={size} height={size*(134/120)} viewBox="0 0 120 134"
         className={className} style={style} aria-hidden="true">
      <ellipse cx="60" cy="128" rx="30" ry="5" fill="rgba(32,30,51,0.09)"/>
      <path d="M60 10C90 10 108 38 108 74C108 108 88 122 60 122C32 122 12 108 12 74C12 38 30 10 60 10Z" fill="#F1855A"/>
      <path d="M22 96c10 13 24 19 38 19s28-6 38-19c-4 16-20 26-38 26S26 112 22 96Z" fill="#E06B41"/>
      <path d="M60 26C82 26 95 42 95 64C95 86 80 100 60 100C40 100 25 86 25 64C25 42 38 26 60 26Z" fill="#FBF6EC"/>
      <circle cx="40" cy="74" r="7" fill="#F7C4A8"/>
      <circle cx="80" cy="74" r="7" fill="#F7C4A8"/>
      <path d="M34 50c5-5 13-5 18 1" stroke="#201E33" strokeWidth="3.4" strokeLinecap="round" fill="none"/>
      <path d="M68 51c5-6 13-6 18-1" stroke="#201E33" strokeWidth="3.4" strokeLinecap="round" fill="none"/>
      <circle cx="45.6" cy="60" r="4.6" fill="#201E33"/>
      {rEye}
      <circle cx="47.2" cy="58.4" r="1.5" fill="#fff"/>
      <circle cx="76" cy="58.4" r="1.5" fill="#fff"/>
      <path d="M54 76c2.4 3 9.6 3 12 0" stroke="#201E33" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M60 10c0-4 1-7 3-9-3 0-6 2-6 6" fill="#E06B41"/>
    </svg>
  );
}

function BlobAccent({ color='var(--peach)', size=200, style={} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200"
         style={{ position:'absolute', ...style }} aria-hidden="true">
      <path fill={color}
        d="M44.7,-57.3C57.4,-47.6,66.3,-33.1,70.2,-17.3C74.1,-1.4,73,15.8,65.4,29.6C57.8,43.4,43.7,53.8,28.3,60.5C12.9,67.1,-3.8,70,-19.9,66.3C-36,62.6,-51.5,52.3,-60.8,38.1C-70.1,23.9,-73.2,5.8,-69.7,-10.4C-66.2,-26.6,-56.1,-40.9,-43.1,-50.7C-30.1,-60.5,-15.1,-65.8,1,-67.1C17,-68.4,32,-67,44.7,-57.3Z"
        transform="translate(100 100)"/>
    </svg>
  );
}
Object.assign(window, { Mascot, BlobAccent });
