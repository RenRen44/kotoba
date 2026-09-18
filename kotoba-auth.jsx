// kotoba-auth.jsx — authentication: token storage, authed fetch, login/signup UI
//
// LOAD ORDER MATTERS: this file must come AFTER kotoba-data.jsx (it uses API),
// after kotoba-icons.jsx (uses I) and after kotoba-mascot.jsx (uses Mascot),
// and BEFORE kotoba-app.jsx. See index.html.

const TOKEN_KEY = 'kotoba_token';

/* ══════════════════════════════════════════
   TOKEN STORAGE
══════════════════════════════════════════ */
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
}
function setToken(t) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) {}
}

/* ══════════════════════════════════════════
   AUTHED FETCH
   Every call to the API goes through here so the Bearer token is attached
   in exactly one place. A 401 means the token is dead (expired, or the
   account was deleted) — we clear it and let the app fall back to the
   login screen rather than leaving the user in a broken half-logged-in UI.
══════════════════════════════════════════ */
async function authFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new CustomEvent('kotoba-unauthorized'));
    throw new Error('Session expired. Please sign in again.');
  }
  return res;
}

// Same thing, but parses JSON and turns a non-2xx into a thrown Error
// carrying the backend's own message (FastAPI puts it in `detail`).
async function apiJson(path, options = {}) {
  const res = await authFetch(path, options);
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(typeof msg === 'string' ? msg : 'Request failed');
  }
  return data;
}

/* ══════════════════════════════════════════
   AUTH API CALLS
══════════════════════════════════════════ */
async function apiRegister(name, email, password) {
  const data = await apiJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  setToken(data.token);
  return data.user;
}

async function apiLogin(email, password) {
  const data = await apiJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data.user;
}

async function apiMe() {
  return apiJson('/auth/me');
}

async function apiUpdateProfile(patch) {
  return apiJson('/auth/me', { method: 'PATCH', body: JSON.stringify(patch) });
}

async function apiChangePassword(current_password, new_password) {
  return apiJson('/auth/password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password }),
  });
}

async function apiDeleteAccount() {
  return apiJson('/auth/me', { method: 'DELETE' });
}

async function apiMyStats() {
  return apiJson('/me/stats');
}

function logout() {
  setToken(null);
}

/* ══════════════════════════════════════════
   AUTH SCREEN — login / signup
══════════════════════════════════════════ */
function AuthScreen({ onAuthed }) {
  const [mode,    setMode]    = React.useState('login'); // 'login' | 'signup'
  const [name,    setName]    = React.useState('');
  const [email,   setEmail]   = React.useState('');
  const [pw,      setPw]      = React.useState('');
  const [showPw,  setShowPw]  = React.useState(false);
  const [busy,    setBusy]    = React.useState(false);
  const [error,   setError]   = React.useState('');

  const isSignup = mode === 'signup';

  function switchMode(next) {
    setMode(next);
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;

    setError('');

    // Client-side checks first — instant feedback beats a round trip.
    if (isSignup && !name.trim())        return setError('What should we call you?');
    if (!email.trim())                   return setError('Email is required.');
    if (!/^\S+@\S+\.\S+$/.test(email))   return setError('That email doesn\'t look right.');
    if (pw.length < 6)                   return setError('Password must be at least 6 characters.');

    setBusy(true);
    try {
      const user = isSignup
        ? await apiRegister(name.trim(), email.trim(), pw)
        : await apiLogin(email.trim(), pw);
      onAuthed(user);
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-orb1" /><div className="auth-orb2" />

      {/* drifting kana background, same language as onboarding */}
      <div className="auth-kana-bg" aria-hidden="true">
        {['日','本','語','学','習','言','葉','心'].map((k, i) => (
          <span key={i} style={{
            position: 'absolute',
            fontFamily: 'var(--jp)', fontWeight: 900,
            color: 'rgba(255,255,255,0.03)',
            fontSize: `${44 + Math.sin(i * 1.9) * 28}px`,
            top: `${10 + ((i * 37) % 78)}%`, left: `${6 + ((i * 23) % 86)}%`,
            animation: `kanaDrift ${18 + i * 3}s linear ${i * 1.6}s infinite`,
            userSelect: 'none', pointerEvents: 'none',
          }}>{k}</span>
        ))}
      </div>

      <div className="auth-card">
        <div className="auth-mascot">
          <Mascot size={92} mood={isSignup ? 'happy' : 'wink'} className="mascot-float" />
        </div>

        <div className="auth-head">
          <div className="auth-tag">{I.spark(13)} {isSignup ? 'はじめまして' : 'おかえりなさい'}</div>
          <h1 className="auth-h1">
            {isSignup ? <>Create your<br/><span style={{color:'var(--peach)'}}>Kotoba</span> account</>
                      : <>Welcome back to<br/><span style={{color:'var(--peach)'}}>Kotoba</span></>}
          </h1>
          <p className="auth-sub">
            {isSignup
              ? 'Your progress, streaks and review schedule sync to your account — on any device.'
              : 'Sign in to pick up exactly where your review schedule left off.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {isSignup && (
            <div className="auth-field">
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name" type="text" autoComplete="name"
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Ren Takahashi" disabled={busy}
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email" type="email" autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" disabled={busy}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-pw">Password</label>
            <div className="auth-pw-wrap">
              <input
                id="auth-pw" type={showPw ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={pw} onChange={e => setPw(e.target.value)}
                placeholder={isSignup ? 'At least 6 characters' : '••••••••'} disabled={busy}
              />
              <button type="button" className="auth-pw-toggle"
                      onClick={() => setShowPw(s => !s)} tabIndex={-1}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{I.x(15)} {error}</div>}

          <button type="submit" className="btn btn-peach auth-submit" disabled={busy}>
            {busy ? 'Just a moment…' : (isSignup ? <>Create account {I.arrow(17)}</> : <>Sign in {I.arrow(17)}</>)}
          </button>
        </form>

        <div className="auth-switch">
          {isSignup ? (
            <>Already learning with us?{' '}
              <button type="button" onClick={() => switchMode('login')}>Sign in</button>
            </>
          ) : (
            <>New to Kotoba?{' '}
              <button type="button" onClick={() => switchMode('signup')}>Create an account</button>
            </>
          )}
        </div>

        <p className="auth-note">
          {I.check(13)} Free · JLPT N5 vocabulary live now
        </p>
      </div>
    </div>
  );
}

Object.assign(window, {
  getToken, setToken, authFetch, apiJson,
  apiRegister, apiLogin, apiMe, apiUpdateProfile,
  apiChangePassword, apiDeleteAccount, apiMyStats,
  logout, AuthScreen,
});
