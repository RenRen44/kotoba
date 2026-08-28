// kotoba-auth.jsx — Login & Register screens
const { useState: authSt, useEffect: authEf } = React;

function Auth({ onDone }) {
  const [mode,  setMode]  = authSt('login'); // 'login' | 'register'
  const [email, setEmail] = authSt('');
  const [pass,  setPass]  = authSt('');
  const [name,  setName]  = authSt('');
  const [error, setError] = authSt('');
  const [loading, setLoading] = authSt(false);

  async function submit() {
    if (!email || !pass) { setError('Please fill in all fields.'); return; }
    if (mode === 'register' && !name) { setError('Please enter your name.'); return; }
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { email, password: pass }
        : { email, password: pass, name };

      const res  = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Something went wrong.');
        setLoading(false);
        return;
      }

      // Save token and user info
      localStorage.setItem('kotoba_token', data.token);
      localStorage.setItem('kotoba_user_id', data.user.id);
      localStorage.setItem('kotoba_user_name', data.user.name);
      onDone(data.user);
    } catch(e) {
      setError('Could not connect to server.');
      setLoading(false);
    }
  }

  return (
    <div className="ob-shell">
      <div className="ob-orb1"/><div className="ob-orb2"/><div className="ob-orb3"/>

      {/* floating kana bg */}
      <div className="ob-kana-bg" aria-hidden="true">
        {['日','本','語','学','習','言','葉','心'].map((k,i) => (
          <span key={i} style={{
            position:'absolute',
            fontFamily:'var(--jp)', fontWeight:900,
            color:'rgba(255,255,255,0.028)',
            fontSize:`${44+Math.sin(i*1.9)*28}px`,
            top:`${10+((i*37)%78)}%`, left:`${6+((i*23)%86)}%`,
            animation:`kanaDrift ${18+i*3}s linear ${i*1.6}s infinite`,
            userSelect:'none', pointerEvents:'none',
          }}>{k}</span>
        ))}
      </div>

      <div className="ob-content">
        <div className="ob-screen" style={{maxWidth:420}}>

          {/* Mascot + title */}
          <div className="ob-mascot-wrap" style={{marginBottom:24}}>
            <Mascot size={100} className="mascot-float"/>
            <div className="ob-mascot-bubble">
              {mode === 'login' ? 'おかえり！' : 'はじめまして！'}
            </div>
          </div>

          <div className="ob-tag" style={{marginBottom:12}}>
            {I.spark(13)} {mode === 'login' ? 'Welcome back' : 'Create account'} · ことば
          </div>

          <h2 className="ob-h2" style={{marginBottom:28}}>
            {mode === 'login'
              ? <span>Sign in to<br/><span style={{color:'var(--peach)'}}>Kotoba</span></span>
              : <span>Join<br/><span style={{color:'var(--peach)'}}>Kotoba</span></span>
            }
          </h2>

          {/* Fields */}
          <div style={{display:'flex',flexDirection:'column',gap:12,width:'100%'}}>
            {mode === 'register' && (
              <input
                className="auth-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
              />
            )}
            <input
              className="auth-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={inputStyle}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop:12, padding:'10px 14px',
              borderRadius:10, background:'rgba(241,133,90,0.15)',
              border:'1px solid rgba(241,133,90,0.3)',
              color:'var(--peach)', fontSize:13,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            className="btn btn-peach ob-cta"
            style={{marginTop:20, opacity: loading ? 0.7 : 1}}
            onClick={submit}
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? <>Sign in {I.arrow(16)}</>
                : <>Create account {I.arrow(16)}</>
            }
          </button>

          {/* Toggle */}
          <div style={{marginTop:16,fontSize:13,color:'var(--cream-2)',textAlign:'center'}}>
            {mode === 'login'
              ? <>Don't have an account?{' '}
                  <button
                    onClick={() => { setMode('register'); setError(''); }}
                    style={{background:'none',border:'none',color:'var(--peach)',cursor:'pointer',fontWeight:700,fontSize:13}}
                  >Sign up</button>
                </>
              : <>Already have an account?{' '}
                  <button
                    onClick={() => { setMode('login'); setError(''); }}
                    style={{background:'none',border:'none',color:'var(--peach)',cursor:'pointer',fontWeight:700,fontSize:13}}
                  >Sign in</button>
                </>
            }
          </div>

        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1.5px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.06)',
  color: 'var(--cream)',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--body)',
  transition: 'border-color 0.2s',
};

Object.assign(window, { Auth });    