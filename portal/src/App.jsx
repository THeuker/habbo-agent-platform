import { useEffect, useMemo, useState } from 'react';

const BOT_DIRECTIONS = [0, 1, 2, 3, 4, 5, 6, 7];

const FALLBACK_FIGURE_TYPES = {
  'default-m':  { gender: 'M', figure: 'hd-180-1.ch-210-66.lg-270-110.sh-300-91' },
  'citizen-m':  { gender: 'M', figure: 'hd-180-1.ch-210-66.lg-270-110.sh-300-91.ha-1012-110.hr-828-61' },
  'agent-m':    { gender: 'M', figure: 'hd-3095-12.ch-255-64.lg-3235-96.sh-295-91.ha-3426-110.hr-3531-61.he-1601-0.ea-3169-0.fa-1211-1408.cp-3310-0.cc-3007-0.ca-1809-0.wa-2007-0' },
  'default-f':  { gender: 'F', figure: 'hd-620-1.ch-680-66.lg-715-110.sh-905-91' },
  'citizen-f':  { gender: 'F', figure: 'hd-620-1.ch-680-66.lg-715-110.sh-905-91.ha-1012-110.hr-828-61' },
  'agent-f':    { gender: 'F', figure: 'hd-620-12.ch-3005-64.lg-3006-96.sh-905-91.ha-3426-110.hr-3531-61.he-1601-0.ea-3169-0' },
};

const emptyRegister = { email: '', username: '', password: '' };
const emptyLogin = { login: '', password: '' };
const emptyForgot = { email: '' };
const emptyReset = { email: '', token: '', password: '' };
const initialHotelStatus = { loading: true, socket_online: false, reason: '', checked_url: '' };
const initialMcpData = { loading: false, tier: 'basic', tokens: [], calls: [] };

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}


export default function App() {
  const currentPath = window.location.pathname;
  const isLoginRoute = currentPath === '/login';
  const isAppRoute = currentPath === '/app';
  const [debugMode, setDebugMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1';
  });
  const [me, setMe] = useState(null);
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [forgotForm, setForgotForm] = useState(emptyForgot);
  const [resetForm, setResetForm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      ...emptyReset,
      email: params.get('email') || '',
      token: params.get('token') || ''
    };
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [hotelStatus, setHotelStatus] = useState(initialHotelStatus);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showSpotify, setShowSpotify] = useState(() => localStorage.getItem('spotify_dismissed') !== '1');
  const [showResetForm, setShowResetForm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('reset') === '1';
  });
  const [mcpData, setMcpData] = useState(initialMcpData);
  const [newMcpToken, setNewMcpToken] = useState(null);
  const [mcpTokenLabel, setMcpTokenLabel] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [authTab, setAuthTab] = useState('register');
  const [activeTab, setActiveTab] = useState('home');
  const [bots, setBots] = useState([]);
  const [botsLoading, setBotsLoading] = useState(false);
  const [editingBotId, setEditingBotId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [botBusy, setBotBusy] = useState({});
  const [botMsg, setBotMsg] = useState({});
  const [figureTypes, setFigureTypes] = useState(FALLBACK_FIGURE_TYPES);
  const [dirTick, setDirTick] = useState(0);

  useEffect(() => {
    api('/api/auth/me')
      .then((data) => setMe(data.user || null))
      .catch(() => setMe(null))
      .finally(() => setAuthLoading(false));
    api('/api/figure-types')
      .then(d => { if (d.figureTypes) setFigureTypes(d.figureTypes); })
      .catch(() => { /* keep fallback */ });
  }, []);

  useEffect(() => {
    let id;
    id = setInterval(() => setDirTick(t => t + 1), 600);
    return () => { clearInterval(id); };
  }, []);

  const isLoggedIn = useMemo(() => !!me, [me]);

  useEffect(() => {
    if (authLoading) return;

    if (isAppRoute && !isLoggedIn) {
      window.location.replace('/login');
      return;
    }

    if (isLoginRoute && isLoggedIn) {
      window.location.replace('/app');
    }
  }, [authLoading, isAppRoute, isLoginRoute, isLoggedIn]);

  useEffect(() => {
    let mounted = true;
    let intervalId;

    async function loadHotelStatus() {
      try {
        const data = await api('/api/hotel/status');
        if (!mounted) return;
        setHotelStatus({
          loading: false,
          socket_online: !!data.socket_online,
          reason: String(data.reason || ''),
          checked_url: String(data.checked_url || '')
        });
      } catch (err) {
        if (!mounted) return;
        setHotelStatus({
          loading: false,
          socket_online: false,
          reason: err.message,
          checked_url: ''
        });
      }
    }

    if (isLoggedIn) {
      setHotelStatus(initialHotelStatus);
      loadHotelStatus();
      intervalId = window.setInterval(loadHotelStatus, 5000);
    } else {
      setHotelStatus(initialHotelStatus);
    }

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setMcpData(initialMcpData);
      setNewMcpToken(null);
      setMcpTokenLabel('');
      return;
    }

    let mounted = true;
    setMcpData((current) => ({ ...current, loading: true }));

    Promise.all([api('/api/mcp/tokens'), api('/api/mcp/calls?limit=30')])
      .then(([tokenData, callData]) => {
        if (!mounted) return;
        setMcpData({
          loading: false,
          tier: tokenData.tier || me?.ai_tier || 'basic',
          tokens: tokenData.tokens || [],
          calls: callData.calls || []
        });
      })
      .catch(() => {
        if (!mounted) return;
        setMcpData((current) => ({ ...current, loading: false }));
      });

    return () => {
      mounted = false;
    };
  }, [isLoggedIn, me?.ai_tier]);

  async function handleRegister(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerForm)
      });
      setMe(data.user);
      setMessage('Registered and logged in.');
      setJoinUrl('');
      setRegisterForm(emptyRegister);
      window.location.replace('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm)
      });
      setMe(data.user);
      setMessage('Logged in.');
      setJoinUrl('');
      setLoginForm(emptyLogin);
      window.location.replace('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api('/api/auth/logout', { method: 'POST' });
      setMe(null);
      setJoinUrl('');
      setMessage('Logged out.');
      window.location.replace('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinHotel() {
    if (!hotelStatus.socket_online) {
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api('/api/hotel/join', { method: 'POST' });
      window.open(data.login_url, '_blank');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateMcpToken() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api('/api/mcp/tokens', {
        method: 'POST',
        body: JSON.stringify({ label: mcpTokenLabel })
      });
      setNewMcpToken(data.token || null);
      setMcpTokenLabel('');

      const [tokenData, callData] = await Promise.all([
        api('/api/mcp/tokens'),
        api('/api/mcp/calls?limit=30')
      ]);
      setMcpData((current) => ({
        ...current,
        tier: tokenData.tier || current.tier,
        tokens: tokenData.tokens || [],
        calls: callData.calls || []
      }));
      setMessage('MCP token generated. Copy it now; it is only shown once.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRevokeMcpToken(tokenId) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api(`/api/mcp/tokens/${tokenId}`, { method: 'DELETE' });
      const tokenData = await api('/api/mcp/tokens');
      setMcpData((current) => ({
        ...current,
        tier: tokenData.tier || current.tier,
        tokens: tokenData.tokens || []
      }));
      setMessage('MCP token revoked.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(forgotForm)
      });
      setMessage(`${data.message} Check Mailpit at http://127.0.0.1:8025`);
      setForgotForm(emptyForgot);
      setShowForgotModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(resetForm)
      });
      setMessage(data.message || 'Password reset successful.');
      setShowResetForm(false);
      setResetForm(emptyReset);
      const url = new URL(window.location.href);
      url.searchParams.delete('reset');
      url.searchParams.delete('token');
      url.searchParams.delete('email');
      window.history.replaceState({}, '', url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function fetchBots() {
    setBotsLoading(true);
    try {
      const d = await api('/api/hotel/bots');
      setBots(d.bots || []);
    } catch {
      setBots([]);
    } finally {
      setBotsLoading(false);
    }
  }

  function startEditBot(bot) {
    setEditingBotId(bot.id);
    const figureType = Object.entries(figureTypes).find(([, v]) => v.figure === bot.figure)?.[0]
      || (bot.gender === 'F' ? 'default-f' : 'default-m');
    setEditForm({ name: bot.name, persona: bot.persona, motto: bot.motto || '', figureType, figure: bot.figure, gender: bot.gender });
  }

  function cancelEditBot() {
    setEditingBotId(null);
    setEditForm({});
  }

  function setBotMessage(botId, text, type = 'ok', ttl = 5000) {
    setBotMsg(prev => ({ ...prev, [botId]: { text, type } }));
    if (ttl) setTimeout(() => setBotMsg(prev => ({ ...prev, [botId]: null })), ttl);
  }

  async function saveBot(botId) {
    setBotBusy(prev => ({ ...prev, [botId]: true }));
    try {
      const d = await api(`/api/hotel/bots/${botId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      setBots(prev => prev.map(b => b.id === botId ? { ...b, ...editForm } : b));
      setEditingBotId(null);
      const parts = ['Saved!'];
      if (d.visualChanged) parts.push('Changes applied live in hotel.');
      if (d.personaUpdated) parts.push('Persona updated.');
      setBotMessage(botId, parts.join(' '), 'ok', 5000);
    } catch (err) {
      setBotMessage(botId, err.message || 'Save failed.', 'err');
    }
    setBotBusy(prev => ({ ...prev, [botId]: false }));
  }

async function deleteBot(botId) {
    if (!window.confirm('Permanently delete this bot?')) return;
    setBotBusy(prev => ({ ...prev, [botId]: true }));
    try {
      await api(`/api/hotel/bots/${botId}`, { method: 'DELETE' });
      setBots(prev => prev.filter(b => b.id !== botId));
    } catch (err) {
      setBotMessage(botId, err.message || 'Delete failed.', 'err');
      setBotBusy(prev => ({ ...prev, [botId]: false }));
    }
  }

  const activeTier = (me?.ai_tier || 'basic');
  const hotelSocketStatus = hotelStatus.loading
    ? 'Checking...'
    : (hotelStatus.socket_online ? 'Online' : 'Offline');

  return (
    <main className="page habbo-reception">
      <div className="corner-branding" aria-hidden="true">
        <img
          src="/logo.png"
          alt="Agent Hotel logo"
          className="corner-branding-image"
        />
      </div>
      {showSpotify && <aside className="spotify-widget" aria-label="Spotify music widget">
        <div className="spotify-widget-header">
          <p className="spotify-widget-title">Theme song</p>
          <button className="spotify-close" onClick={() => { localStorage.setItem('spotify_dismissed', '1'); setShowSpotify(false); }} aria-label="Close">✕</button>
        </div>
        <iframe
          title="Spotify track player"
          src="https://open.spotify.com/embed/track/4kml1fml3e8NBHCywXNecG?utm_source=generator"
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </aside>}

      <section className="card">
        <div className="debug-toggle">
          {me && (
            <>
              <span
                className="tooltip-wrap"
                title={hotelStatus.socket_online ? '' : 'Hotel is offline'}
              >
                <button
                  className="btn-sm btn-join"
                  disabled={busy || !hotelStatus.socket_online}
                  onClick={handleJoinHotel}
                  type="button"
                >
                  {busy ? 'Joining…' : 'Join Hotel'}
                </button>
              </span>
              <button className="ghost btn-sm" onClick={handleLogout} disabled={busy} type="button">
                Logout
              </button>
            </>
          )}
        </div>

        <h1>Agent Hotel Portal</h1>
        <p className="muted">Register, log in, and jump into your Habbo hotel with a fresh SSO ticket.</p>

        {debugMode && error && <div className="alert error">{error}</div>}
        {message && <div className="alert ok">{message}</div>}

        {authLoading ? (
          <div className="session-loading">
            <p className="muted">Loading your portal session...</p>
          </div>
        ) : isLoginRoute ? (
          <div className="auth-tabs">
            <div className="tab-bar">
              <button
                className={authTab === 'register' ? 'tab active' : 'tab'}
                onClick={() => setAuthTab('register')}
                type="button"
              >
                Register
              </button>
              <button
                className={authTab === 'login' ? 'tab active' : 'tab'}
                onClick={() => setAuthTab('login')}
                type="button"
              >
                Login
              </button>
            </div>

            {authTab === 'register' && (
              <form onSubmit={handleRegister}>
                <input
                  placeholder="Email"
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((s) => ({ ...s, email: e.target.value }))}
                />
                <input
                  placeholder="Username"
                  required
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm((s) => ({ ...s, username: e.target.value }))}
                />
                <input
                  placeholder="Password"
                  type="password"
                  minLength={8}
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((s) => ({ ...s, password: e.target.value }))}
                />
                <button disabled={busy} type="submit">
                  {busy ? 'Please wait...' : 'Create account'}
                </button>
              </form>
            )}

            {authTab === 'login' && (
              <>
                <form onSubmit={handleLogin}>
                  <input
                    placeholder="Email or username"
                    required
                    value={loginForm.login}
                    onChange={(e) => setLoginForm((s) => ({ ...s, login: e.target.value }))}
                  />
                  <input
                    placeholder="Password"
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))}
                  />
                  <button disabled={busy} type="submit">
                    {busy ? 'Please wait...' : 'Login'}
                  </button>
                  <div className="login-help-row">
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => setShowForgotModal(true)}
                      type="button"
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>

                {showResetForm && (
                  <form onSubmit={handleResetPassword}>
                    <h2>Reset password</h2>
                    <input
                      placeholder="Email"
                      type="email"
                      required
                      value={resetForm.email}
                      onChange={(e) => setResetForm((s) => ({ ...s, email: e.target.value }))}
                    />
                    <input
                      placeholder="Reset token"
                      required
                      value={resetForm.token}
                      onChange={(e) => setResetForm((s) => ({ ...s, token: e.target.value }))}
                    />
                    <input
                      placeholder="New password"
                      type="password"
                      minLength={8}
                      required
                      value={resetForm.password}
                      onChange={(e) => setResetForm((s) => ({ ...s, password: e.target.value }))}
                    />
                    <button disabled={busy} type="submit">
                      {busy ? 'Please wait...' : 'Reset password'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="dashboard">
            <div className="tab-bar">
              <button
                className={activeTab === 'home' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('home')}
                type="button"
              >
                Home
              </button>
              <button
                className={activeTab === 'bots' ? 'tab active' : 'tab'}
                onClick={() => { setActiveTab('bots'); fetchBots(); }}
                type="button"
              >
                Bots
              </button>
              <button
                className={activeTab === 'mcp' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('mcp')}
                type="button"
              >
                MCP
              </button>
            </div>

            {activeTab === 'home' && (
              <div className="section-card">
                <div className="home-welcome">
                  {me.figure && (
                    <div className="bot-figure-wrap">
                      <div className="bot-figure-stack">
                        {BOT_DIRECTIONS.map((d) => (
                          <img
                            key={d}
                            src={`/api/figure?figure=${encodeURIComponent(me.figure)}&direction=${d}&v=3`}
                            alt={d === BOT_DIRECTIONS[dirTick % BOT_DIRECTIONS.length] ? me.habbo_username : ''}
                            className={`bot-avatar${d === BOT_DIRECTIONS[dirTick % BOT_DIRECTIONS.length] ? ' bot-avatar-visible' : ''}`}
                            aria-hidden={d !== BOT_DIRECTIONS[dirTick % BOT_DIRECTIONS.length]}
                          />
                        ))}
                      </div>
                      <div className="bot-pad" />
                    </div>
                  )}
                  <div className="dashboard-header">
                    <h2>Welcome, {me.username}</h2>
                    <p className="muted">Manage your hotel access and MCP connection from one place.</p>
                  </div>
                </div>
                <div className="status-grid">
                  <div className="status-card">
                    <p className="status-label">Linked Habbo</p>
                    <p className="status-value">{me.habbo_username}</p>
                  </div>
                  <div className="status-card">
                    <p className="status-label">AI Tier</p>
                    <p className="status-value">{activeTier.toUpperCase()}</p>
                  </div>
                  <div className="status-card">
                    <p className="status-label">Hotel Socket</p>
                    <p className={`status-value ${hotelStatus.socket_online ? 'status-online' : 'status-offline'}`}>
                      {hotelSocketStatus}
                    </p>
                  </div>
                </div>
                {debugMode && hotelStatus.reason && (
                  <p className="muted">Debug: {hotelStatus.reason}</p>
                )}
                {debugMode && hotelStatus.checked_url && (
                  <p className="muted">Debug URL: {hotelStatus.checked_url}</p>
                )}
              </div>
            )}

            {activeTab === 'bots' && (
              <div className="section-card">
                <h3>My Bots</h3>
                {botsLoading ? (
                  <p className="muted">Loading bots...</p>
                ) : bots.length === 0 ? (
                  <p className="muted">No bots deployed yet. Use <code>:setup_agent</code> in the hotel.</p>
                ) : (
                  <div className="bot-grid">
                    {bots.map((bot) => {
                      const isBusy = !!botBusy[bot.id];
                      const msg = botMsg[bot.id];
                      const dir = BOT_DIRECTIONS[dirTick % BOT_DIRECTIONS.length];
                      return (
                        <div className="bot-card" key={bot.id}>
                          <div className="bot-card-top">
                            <span className="item-title">{bot.name}</span>
                            <span className={`badge ${bot.active ? 'badge-ok' : 'badge-off'}`}>
                              {bot.active ? 'Active' : 'Inactive'}
                            </span>
                            <div className="bot-actions">
                              <button type="button" className="btn-sm" onClick={() => startEditBot(bot)} disabled={isBusy}>Edit</button>
<button type="button" className="btn-sm btn-danger" onClick={() => deleteBot(bot.id)} disabled={isBusy}>Delete</button>
                            </div>
                          </div>

                          <div className="bot-card-body">
                            {bot.figure && (
                              <div className="bot-figure-wrap">
                                <div className="bot-figure-stack">
                                  {BOT_DIRECTIONS.map((d) => (
                                    <img
                                      key={d}
                                      src={`/api/figure?figure=${encodeURIComponent(bot.figure)}&direction=${d}&v=3`}
                                      alt={d === dir ? bot.name : ''}
                                      className={`bot-avatar${d === dir ? ' bot-avatar-visible' : ''}`}
                                      aria-hidden={d !== dir}
                                    />
                                  ))}
                                </div>
                                <div className="bot-pad" />
                              </div>
                            )}
                            <div className="bot-info">
                              <p className="muted bot-room">Room: {bot.room_name || `#${bot.room_id}`}</p>
                              {bot.motto && (
                                <p className="muted bot-persona">{bot.motto}</p>
                              )}
                              {msg && (
                                <p className={`bot-msg ${msg.type === 'err' ? 'bot-msg-err' : 'bot-msg-ok'}`}>{msg.text}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mcp' && (
              <div className="section-card">
                <h3>MCP Connect</h3>
                <p className="muted">
                  Endpoint: <code>/mcp</code> on your hosted <code>hotel-mcp</code> domain.
                </p>

                {activeTier === 'basic' ? (
                  <p className="muted">Upgrade to Pro to enable MCP token generation.</p>
                ) : (
                  <>
                    <div className="row row-wrap">
                      <input
                        placeholder="Token label (optional)"
                        className="token-input"
                        value={mcpTokenLabel}
                        onChange={(e) => setMcpTokenLabel(e.target.value)}
                      />
                      <button disabled={busy} onClick={handleCreateMcpToken} type="button">
                        {busy ? 'Generating...' : 'Generate token'}
                      </button>
                    </div>

                    {newMcpToken?.value && (
                      <div className="alert ok">
                        <strong>Copy this token now:</strong>
                        <br />
                        <code>{newMcpToken.value}</code>
                      </div>
                    )}

                    <h4>Your Tokens</h4>
                    {mcpData.loading ? (
                      <p className="muted">Loading MCP data...</p>
                    ) : mcpData.tokens.length === 0 ? (
                      <p className="muted">No tokens generated yet.</p>
                    ) : (
                      <div className="list-grid">
                        {mcpData.tokens.map((token) => (
                          <div className="list-item" key={token.id}>
                            <p className="item-title">#{token.id} {token.token_label || '(no label)'}</p>
                            <p className="muted">Status: {token.status}</p>
                            <p className="muted">Last used: {token.last_used_at || 'never'}</p>
                            <button
                              className="ghost"
                              disabled={busy || token.status !== 'active'}
                              onClick={() => handleRevokeMcpToken(token.id)}
                              type="button"
                            >
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <h4>Recent MCP Calls</h4>
                    {mcpData.calls.length === 0 ? (
                      <p className="muted">No MCP calls yet.</p>
                    ) : (
                      <div className="list-grid">
                        {mcpData.calls.map((call) => (
                          <div className="list-item" key={call.id}>
                            <p className="item-title">{call.tool_name} ({call.channel})</p>
                            <p className="muted">Status: {call.success ? 'ok' : 'error'}</p>
                            <p className="muted">Duration: {call.duration_ms}ms</p>
                            <p className="muted">At: {call.created_at}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {editingBotId !== null && (() => {
        const bot = bots.find(b => b.id === editingBotId);
        const isBusy = !!botBusy[editingBotId];
        const dir = BOT_DIRECTIONS[dirTick % BOT_DIRECTIONS.length];
        return (
          <div className="modal-overlay" onClick={cancelEditBot}>
            <div className="modal-card modal-edit-bot" onClick={e => e.stopPropagation()}>
              <h2>Edit Bot</h2>
              <div className="modal-edit-body">
                {editForm.figure && (
                  <div className="modal-figure-preview">
                    <div className="bot-figure-wrap">
                      <div className="bot-figure-stack">
                        {BOT_DIRECTIONS.map((d) => (
                          <img
                            key={d}
                            src={`/api/figure?figure=${encodeURIComponent(editForm.figure)}&direction=${d}&v=3`}
                            alt=""
                            className={`bot-avatar${d === dir ? ' bot-avatar-visible' : ''}`}
                            aria-hidden={d !== dir}
                          />
                        ))}
                      </div>
                      <div className="bot-pad" />
                    </div>
                    <span className="muted small">{editForm.name}</span>
                  </div>
                )}
                <div className="modal-edit-fields">
                  <label>Name</label>
                  <input
                    maxLength={25}
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  />
                  <label>Motto <span className="muted small">(shown in hotel)</span></label>
                  <input
                    maxLength={100}
                    value={editForm.motto}
                    onChange={e => setEditForm(f => ({ ...f, motto: e.target.value }))}
                    placeholder="e.g. Here to help!"
                  />
                  <label>Persona</label>
                  <textarea
                    rows={5}
                    value={editForm.persona}
                    onChange={e => setEditForm(f => ({ ...f, persona: e.target.value }))}
                  />
                  <label>Figure type</label>
                  <select
                    value={editForm.figureType}
                    onChange={e => {
                      const ft = figureTypes[e.target.value];
                      setEditForm(f => ({ ...f, figureType: e.target.value, figure: ft?.figure ?? f.figure, gender: ft?.gender ?? f.gender }));
                    }}
                  >
                    {Object.entries(figureTypes).map(([t, v]) => (
                      <option key={t} value={t}>{t} ({v.gender})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button className="ghost" onClick={cancelEditBot} disabled={isBusy} type="button">Cancel</button>
                <button onClick={() => saveBot(editingBotId)} disabled={isBusy} type="button">
                  {isBusy ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Forgot password</h2>
            <p className="muted small">Enter your account email to receive a reset link (Mailpit).</p>
            <form onSubmit={handleForgotPassword}>
              <input
                placeholder="Email"
                type="email"
                required
                value={forgotForm.email}
                onChange={(e) => setForgotForm((s) => ({ ...s, email: e.target.value }))}
              />
              <div className="modal-actions">
                <button className="ghost" disabled={busy} onClick={() => setShowForgotModal(false)} type="button">
                  Cancel
                </button>
                <button disabled={busy} type="submit">
                  {busy ? 'Please wait...' : 'Send reset link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
