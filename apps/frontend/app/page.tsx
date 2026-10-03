'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Round = {
  id: string;
  sequence: number;
  multiplier?: number;
  status: string;
  seconds?: number;
  crashMultiplier?: number | string | null;
  serverSeedHash?: string;
  serverSeed?: string;
  clientSeed?: string;
  nonce?: number;
};

type DemoUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  demoBalance: string | number;
};

type Bet = {
  id: string;
  status: string;
  stake: string | number;
  payout?: string | number;
};

type IconName = 'rocket' | 'wallet' | 'history' | 'shield' | 'plus' | 'minus' | 'bolt' | 'radio' | 'clock' | 'logout' | 'spark' | 'chevron' | 'check' | 'copy';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const glyphs: Record<IconName, React.ReactNode> = {
    rocket: <><path d="M4.5 15.5c-1.5 1.3-2 4-2 4s2.7-.5 4-2c.8-.9.8-2.2-.1-3.1-.9-.9-2.2-.9-3.1.1Z"/><path d="m12 15-3-3c.5-2.3 2-4.5 4.5-6.2 2.3-1.6 5.1-2 7.5-2-.1 2.4-.5 5.2-2 7.5C17.3 13.8 15 15.3 12 16Z"/><path d="m9 12-4 1 3-4m4 6-1 4 4-3"/><circle cx="16" cy="8" r="1.5"/></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18M16 14h2"/><path d="M6 5V4a2 2 0 0 1 2-2h10"/></>,
    history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    minus: <><path d="M5 12h14"/></>,
    bolt: <><path d="m13 2-3 8h7l-6 12 1-9H5l8-11Z"/></>,
    radio: <><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4m-8.4 0a6 6 0 0 1 0-8.4"/><path d="M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></>,
    chevron: <><path d="m7 10 5 5 5-5"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
  };

  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{glyphs[name]}</svg>;
}

function Wordmark() {
  return <a href="#inicio" className="wordmark" aria-label="SkyRush inicio"><span className="wordmark-icon"><Icon name="rocket" size={19}/></span><span>SKY<span className="wordmark-accent">RUSH</span></span><span className="wordmark-period">.</span></a>;
}

function RocketArt({ small = false }: { small?: boolean }) {
  return <svg className={small ? 'rocket-art rocket-art-small' : 'rocket-art'} viewBox="0 0 150 190" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="rocketBody" x1="43" y1="18" x2="110" y2="155" gradientUnits="userSpaceOnUse"><stop stopColor="#FFFFFF"/><stop offset=".55" stopColor="#DCE9FF"/><stop offset="1" stopColor="#9AB8E7"/></linearGradient>
      <linearGradient id="rocketNose" x1="65" y1="15" x2="89" y2="66" gradientUnits="userSpaceOnUse"><stop stopColor="#FFCD83"/><stop offset="1" stopColor="#FF783D"/></linearGradient>
      <linearGradient id="flame" x1="76" y1="129" x2="76" y2="191" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF4B5"/><stop offset=".45" stopColor="#FF9B42"/><stop offset="1" stopColor="#F34C55" stopOpacity="0"/></linearGradient>
      <filter id="rocketGlow" x="0" y="0" width="150" height="190" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <ellipse cx="76" cy="111" rx="35" ry="58" fill="#83AFFF" opacity=".22" filter="url(#rocketGlow)"/>
    <path d="M69 128c-1 19-11 37-17 47 11-3 18-7 24-16 6 9 14 14 25 16-7-14-13-30-13-48" fill="url(#flame)"/>
    <path d="M75 17C57 36 44 66 43 105l2 29c1 8 7 15 15 16h31c8-1 14-8 15-16l2-29c-1-39-14-69-33-88Z" fill="url(#rocketBody)" stroke="#FFFFFF" strokeOpacity=".9" strokeWidth="2"/>
    <path d="M75 17c-7 9-13 19-18 31h36c-5-12-11-22-18-31Z" fill="url(#rocketNose)"/>
    <path d="M44 94 20 120l25 3M106 94l24 26-25 3" fill="#718CB8" stroke="#C9DAF7" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M45 111h60v22c-1 8-7 15-15 16H60c-8-1-14-8-15-16v-22Z" fill="#F7FAFF"/>
    <circle cx="75" cy="83" r="13" fill="#173756" stroke="#FFB26A" strokeWidth="4"/>
    <circle cx="75" cy="83" r="7" fill="#69DDFB"/><path d="m71 81 6-4-1 6-6 4 1-6Z" fill="#EAFDFF"/>
    <path d="M60 146h30" stroke="#FF8B54" strokeWidth="3" strokeLinecap="round"/>
    <path d="M62 58h26" stroke="#E6EEFB" strokeWidth="2" strokeLinecap="round" opacity=".8"/>
  </svg>;
}

function formatCredits(value: number | string) {
  return Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 });
}

function LoginScreen({ email, password, setEmail, setPassword, onLogin, busy, message }: {
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  message: string;
}) {
  return <main className="app-shell login-shell" id="inicio">
    <header className="topbar login-topbar"><Wordmark/><div className="topbar-right"><span className="demo-tag"><span className="demo-tag-dot"/>MODO DEMO</span><span className="topbar-caption">Vuela con créditos ficticios</span></div></header>
    <section className="login-layout">
      <div className="login-story">
        <div className="eyebrow"><span className="eyebrow-line"/>SIMULADOR DE VUELO · EN VIVO</div>
        <h1>El cielo no<br/>es el <span>límite.</span></h1>
        <p className="login-lede">Apuesta a tu instinto. Sigue el ascenso. Retira antes de que el cohete desaparezca entre las estrellas.</p>
        <div className="login-scene">
          <div className="login-scene-orbit orbit-one"/><div className="login-scene-orbit orbit-two"/>
          <span className="scene-star star-a"/><span className="scene-star star-b"/><span className="scene-star star-c"/><span className="scene-star star-d"/>
          <div className="scene-small-label"><span className="live-indicator"/>ÚLTIMO VUELO <b>12.84×</b></div>
          <div className="login-rocket"><RocketArt/></div>
          <div className="scene-ground-light"/>
          <div className="scene-note"><Icon name="spark" size={15}/>Cada ronda, una nueva historia.</div>
        </div>
        <div className="login-features"><span><Icon name="radio" size={16}/>Rondas en tiempo real</span><span><Icon name="shield" size={16}/>Solo créditos demo</span></div>
      </div>

      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-card-top"><span className="auth-icon"><Icon name="rocket" size={21}/></span><span className="auth-card-kicker">TU CABINA TE ESPERA</span></div>
        <h2 id="login-title">Despega ahora</h2>
        <p className="auth-intro">Entra a tu cuenta demo para unirte al próximo vuelo.</p>
        <form className="auth-form" onSubmit={onLogin}>
          <label htmlFor="email">Correo electrónico</label>
          <div className="field-wrap"><span className="field-symbol">@</span><input id="email" className="text-field" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required/></div>
          <label htmlFor="password">Contraseña</label>
          <div className="field-wrap"><span className="field-symbol field-lock"><Icon name="shield" size={16}/></span><input id="password" className="text-field" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required/></div>
          {message && <div className="inline-message" role="alert">{message}</div>}
          <button className="button button-primary auth-submit" type="submit" disabled={busy}><span>{busy ? 'Conectando…' : 'Entrar a la cabina'}</span><span className="button-arrow">↗</span></button>
        </form>
        <div className="auth-divider"><span/>ACCESO DE PRUEBA<span/></div>
        <div className="demo-credentials"><span className="demo-credentials-icon"><Icon name="spark" size={16}/></span><div><b>Cuenta demo lista</b><span>demo@example.com <i>·</i> Demo1234!</span></div><Icon name="check" size={17}/></div>
        <p className="auth-footnote">Sin depósitos ni dinero real. Este prototipo utiliza exclusivamente créditos ficticios.</p>
      </section>
    </section>
    <footer className="page-footer"><span>© 2026 SKYRUSH LABS</span><span>EXPERIENCIA DE PRUEBA <i className="footer-dot"/> HECHA PARA EXPLORAR</span></footer>
  </main>;
}

export default function Home() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('Demo1234!');
  const [user, setUser] = useState<DemoUser | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [countdown, setCountdown] = useState(5);
  const [stake, setStake] = useState(1000);
  const [bet, setBet] = useState<Bet | null>(null);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Round[]>([]);
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [busy, setBusy] = useState(false);

  const loggedIn = Boolean(token && user);
  const running = round?.status === 'RUNNING';
  const bettingOpen = round?.status === 'WAITING';
  const betOpen = bet?.status === 'OPEN';
  const balance = Number(user?.demoBalance ?? 0);
  const progress = useMemo(() => Math.min(100, Math.max(0, (Math.log(Math.max(1, multiplier)) / Math.log(40)) * 100)), [multiplier]);
  const peakMultiplier = useMemo(() => history.reduce((peak, item) => Math.max(peak, Number(item.crashMultiplier ?? item.multiplier ?? 0)), 0), [history]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'No pudimos iniciar sesión. Revisa tus datos.');
        return;
      }
      setToken(data.accessToken);
      setUser(data.user);
    } catch {
      setMessage('No se pudo conectar con el servidor. Revisa que el backend siga activo.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`${API}/games/history`).then(response => response.json()).then(data => {
      if (active && Array.isArray(data)) setHistory(data);
    }).catch(() => {
      if (active) setMessage('No se pudo cargar el historial de vuelos.');
    });

    const socket: Socket = io(`${API}/game`, { reconnection: true, reconnectionAttempts: 8, timeout: 8000 });
    setSocketStatus('connecting');
    socket.on('connect', () => setSocketStatus('connected'));
    socket.on('disconnect', () => setSocketStatus('disconnected'));
    socket.on('connect_error', () => setSocketStatus('disconnected'));
    socket.on('round:waiting', (data: Round) => {
      setRound({ ...data, status: 'WAITING' });
      setCountdown(data.seconds ?? 5);
      setMultiplier(1);
      setBet(null);
      setMessage('');
    });
    socket.on('round:countdown', (data: Round) => {
      setRound(current => current && current.id === data.id ? { ...current, ...data, status: 'WAITING' } : current);
      setCountdown(data.seconds ?? 0);
    });
    socket.on('round:start', (data: Round) => {
      setRound({ ...data, status: 'RUNNING' });
      setCountdown(0);
      setMultiplier(1);
      setMessage('');
    });
    socket.on('round:tick', (data: Partial<Round>) => {
      if (typeof data.multiplier === 'number') setMultiplier(data.multiplier);
      setRound(current => current ? { ...current, ...data, status: 'RUNNING' } : current);
    });
    socket.on('round:crash', (data: Partial<Round>) => {
      setMultiplier(Number(data.multiplier ?? multiplier));
      setRound(current => current ? { ...current, ...data, status: 'CRASHED' } : current);
      setCountdown(0);
      setBet(current => current && current.status !== 'CASHED_OUT' ? { ...current, status: 'LOST' } : current);
      fetch(`${API}/games/history`).then(response => response.json()).then(items => {
        if (active && Array.isArray(items)) setHistory(items);
      }).catch(() => undefined);
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [token]);

  async function placeBet() {
    if (!round || !bettingOpen || betOpen || !token || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`${API}/bets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ roundId: round.id, stake }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'No se pudo registrar la apuesta.');
        return;
      }
      setBet(data);
      setUser(current => current ? { ...current, demoBalance: balance - stake } : current);
      setMessage('Apuesta lista. El despegue es automático al terminar el contador.');
    } catch {
      setMessage('No se pudo conectar con el servidor.');
    } finally {
      setBusy(false);
    }
  }

  async function cashout() {
    if (!bet || bet.status !== 'OPEN' || !token || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`${API}/bets/cashout`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ betId: bet.id, multiplier }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'No se pudo retirar la apuesta.');
        return;
      }
      setUser(current => current ? { ...current, demoBalance: balance + Number(data.payout) } : current);
      setBet(current => current ? { ...current, status: 'CASHED_OUT', payout: data.payout } : current);
      setMessage(`Retiro confirmado: ${formatCredits(data.payout)} créditos demo.`);
    } catch {
      setMessage('No se pudo conectar con el servidor.');
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setToken('');
    setUser(null);
    setRound(null);
    setBet(null);
    setMessage('');
  }

  if (!loggedIn) {
    return <LoginScreen email={email} password={password} setEmail={setEmail} setPassword={setPassword} onLogin={login} busy={busy} message={message}/>;
  }

  const multiplierTone = round?.status === 'CRASHED' ? 'multiplier-crashed' : multiplier >= 2 ? 'multiplier-hot' : '';
  const historyItems = history.slice(0, 10);

  return <main className="app-shell game-shell" id="inicio">
    <header className="topbar game-topbar">
      <Wordmark/>
      <nav className="main-nav" aria-label="Navegación principal"><a className="nav-link nav-link-active" href="#juego"><Icon name="rocket" size={16}/>Juego</a><a className="nav-link" href="#actividad"><Icon name="history" size={16}/>Actividad</a><a className="nav-link" href="#juego"><Icon name="shield" size={16}/>Juego justo</a></nav>
      <div className="account-area"><div className="balance-pill"><span className="balance-symbol"><Icon name="wallet" size={16}/></span><span className="balance-label">Saldo demo</span><b>{formatCredits(balance)} <small>CR</small></b><Icon name="chevron" size={14}/></div><div className="account-avatar" title={user.name}>{user.name.slice(0, 1).toUpperCase()}</div><button className="icon-button logout-button" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión"><Icon name="logout" size={17}/></button></div>
    </header>

    <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/>CENTRO DE VUELO</div><h1>Buen vuelo, <span>{user.name.split(' ')[0]}.</span></h1><p>El siguiente despegue está a la vuelta de la órbita.</p></div><div className="welcome-badge"><span className="welcome-badge-icon"><Icon name="spark" size={17}/></span><span>Créditos de práctica<br/><b>100% ficticios, 100% diversión</b></span></div></section>

    <section className="flight-history-bar" aria-label="Últimos vuelos">
      <div className="history-bar-title"><span className="history-bar-icon"><Icon name="history" size={15}/></span><span>ÚLTIMOS VUELOS</span></div>
      <div className="history-chips">{historyItems.length ? historyItems.map((item, index) => {
        const value = Number(item.crashMultiplier ?? item.multiplier ?? 0);
        return <div className={`history-chip ${value >= 2 ? 'history-chip-bright' : ''}`} key={item.id ?? `${item.sequence}-${index}`}><span>#{item.sequence}</span><b>{value.toFixed(2)}×</b></div>;
      }) : <span className="history-empty">Cargando vuelos anteriores…</span>}</div>
      <a className="history-see-all" href="#actividad">Ver actividad <span>↗</span></a>
    </section>

    <section className="game-layout" id="juego">
      <div className="game-main-column">
        <div className="flight-card">
          <div className="flight-card-head"><div className="round-title"><span className="round-title-icon"><Icon name="rocket" size={16}/></span><span>VUELO <b>#{round?.sequence ?? '—'}</b></span></div><div className={`connection-pill ${socketStatus === 'connected' ? 'connection-on' : 'connection-off'}`}><span className="connection-dot"/>{socketStatus === 'connected' ? 'EN VIVO' : socketStatus === 'connecting' ? 'CONECTANDO' : 'RECONECTANDO'}</div><div className="flight-head-right"><span className="flight-mode-label">CRASH · ÓRBITA 01</span><span className="mode-dot"/></div></div>
          <div className={`flight-surface ${round?.status === 'CRASHED' ? 'flight-surface-crashed' : ''}`}>
            <div className="surface-grid"/><div className="surface-nebula nebula-one"/><div className="surface-nebula nebula-two"/>
            <div className="surface-stars"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
            <div className="flight-coordinates"><span>ALT 0.0 KM</span><span>SECTOR 07 / ORBITAL</span></div>
            <svg className="trajectory-svg" viewBox="0 0 1000 440" preserveAspectRatio="none" aria-hidden="true">
              <defs><linearGradient id="pathGlow" x1="70" y1="394" x2="900" y2="47" gradientUnits="userSpaceOnUse"><stop stopColor="#40D9FF" stopOpacity=".12"/><stop offset=".55" stopColor="#73A7FF" stopOpacity=".48"/><stop offset="1" stopColor="#FFAD69" stopOpacity=".9"/></linearGradient><linearGradient id="pathLine" x1="60" y1="395" x2="925" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#55DEFF"/><stop offset=".58" stopColor="#93AEFF"/><stop offset="1" stopColor="#FFD393"/></linearGradient></defs>
              <path d="M 45 392 C 190 383 271 366 360 331 C 487 280 540 240 646 179 C 744 123 823 88 960 45" fill="none" stroke="url(#pathGlow)" strokeWidth="14" strokeLinecap="round" opacity=".52"/>
              <path d="M 45 392 C 190 383 271 366 360 331 C 487 280 540 240 646 179 C 744 123 823 88 960 45" fill="none" stroke="#9CAECF" strokeOpacity=".2" strokeWidth="2" strokeDasharray="5 10"/>
              <path d="M 45 392 C 190 383 271 366 360 331 C 487 280 540 240 646 179 C 744 123 823 88 960 45" pathLength="100" fill="none" stroke="url(#pathLine)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${progress} 100`}/>
            </svg>
            <div className="flight-floor"><span>PLATAFORMA DE DESPEGUE</span><span>RUTA DE ASCENSO <i>↗</i></span></div>
            <div className={`flight-rocket ${round?.status === 'CRASHED' ? 'flight-rocket-crashed' : ''}`} style={{ left: `${Math.min(88, 7 + progress * .8)}%`, top: `${Math.max(18, 78 - progress * .58)}%` }}><span className="rocket-aura"/><RocketArt small/></div>
            <div className="multiplier-display"><div className="multiplier-overline"><span className="multiplier-pulse"/>{round?.status === 'CRASHED' ? 'VUELO FINALIZADO' : running ? 'EL COHETE SIGUE SUBIENDO' : bettingOpen ? 'DESPEGUE AUTOMÁTICO EN' : socketStatus === 'connected' ? 'PREPARANDO DESPEGUE' : 'ESPERANDO CONEXIÓN'}</div><div className={`multiplier-number ${multiplierTone} ${bettingOpen ? 'multiplier-countdown' : ''}`}>{bettingOpen ? `00:${String(countdown).padStart(2, '0')}` : multiplier.toFixed(2)}<span>{bettingOpen ? 's' : '×'}</span></div><div className="multiplier-caption">{round?.status === 'CRASHED' ? 'El próximo vuelo despega pronto' : running ? 'Retira antes de que termine el vuelo' : bettingOpen ? betOpen ? 'Apuesta lista · el cohete despega solo' : 'Ventana abierta: confirma tu apuesta antes del despegue' : 'Prepara tu apuesta para el próximo vuelo'}</div></div>
            <div className="surface-bottom-fade"/>
          </div>
          <div className="flight-card-foot"><div className="flight-foot-label"><span className={`status-icon ${running || bettingOpen ? 'status-icon-live' : ''}`}><Icon name={running ? 'bolt' : 'clock'} size={14}/></span><span>{running ? 'Vuelo en curso' : round?.status === 'CRASHED' ? 'Fin de vuelo' : bettingOpen ? `Apuestas abiertas · despega en ${countdown}s` : 'Plataforma en espera'}</span></div><span className="flight-foot-tip"><Icon name="spark" size={14}/> Todo se juega con saldo demo</span></div>
        </div>

        <div className="stats-row"><article className="stat-card"><span className="stat-icon stat-icon-blue"><Icon name="radio" size={16}/></span><div><span>ESTADO DE ÓRBITA</span><b>{socketStatus === 'connected' ? 'Conectada' : 'Reestableciendo'}</b></div><span className="stat-live-dot"/></article><article className="stat-card"><span className="stat-icon stat-icon-gold"><Icon name="spark" size={16}/></span><div><span>VUELO MÁS ALTO</span><b>{peakMultiplier ? `${peakMultiplier.toFixed(2)}×` : '—'}</b></div></article><article className="stat-card"><span className="stat-icon stat-icon-violet"><Icon name="shield" size={16}/></span><div><span>CRÉDITOS</span><b>De práctica</b></div></article></div>

        <section className="activity-card" id="actividad"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>BITÁCORA</div><h2>Vuelos recientes</h2></div><span className="activity-count">{history.length} REGISTROS</span></div>{historyItems.length ? <div className="activity-list">{historyItems.slice(0, 6).map((item, index) => {
          const value = Number(item.crashMultiplier ?? item.multiplier ?? 0);
          return <div className="activity-row" key={item.id ?? `${item.sequence}-${index}`}><span className={`activity-row-icon ${value >= 2 ? 'activity-row-icon-hot' : ''}`}><Icon name="rocket" size={16}/></span><span className="activity-flight">Vuelo <b>#{item.sequence}</b><small>{item.status === 'RUNNING' ? 'En progreso' : 'Vuelo finalizado'}</small></span><div className="activity-track"><span/><span/></div><span className={`activity-multiplier ${value >= 2 ? 'activity-multiplier-hot' : ''}`}>{value.toFixed(2)}×</span><span className="activity-result"><span className="result-dot"/>Finalizado</span></div>;
        })}</div> : <div className="empty-activity"><span className="empty-icon"><Icon name="history" size={20}/></span><b>Tu bitácora está por comenzar</b><span>Cuando despegue el primer cohete, verás aquí el historial.</span></div>}<div className="activity-foot"><span><Icon name="shield" size={14}/> Resultados generados y guardados por el servidor</span><span>ACTUALIZACIÓN EN TIEMPO REAL</span></div></section>
      </div>

      <aside className="bet-column">
        <section className="bet-card"><div className="bet-card-head"><div><div className="eyebrow"><span className="eyebrow-line"/>TU MISIÓN</div><h2>Configura tu vuelo</h2></div><span className="bet-card-icon"><Icon name="rocket" size={20}/></span></div>
          <div className="bet-status-strip"><span className={`bet-status-light ${running || bettingOpen ? 'bet-status-light-live' : ''}`}/><span>{betOpen && bettingOpen ? `Apuesta lista · despega en ${countdown}s` : running ? betOpen ? 'Vuelo activo · apuesta en juego' : 'Vuelo activo · apuestas cerradas' : round?.status === 'CRASHED' ? 'Vuelo completado' : bettingOpen ? `Apuestas abiertas · ${countdown}s` : 'Esperando la próxima salida'}</span><b>{round?.sequence ? `#${round.sequence}` : 'EN ESPERA'}</b></div>
          <div className="wager-label"><label htmlFor="stake">Créditos para el vuelo</label><span>DISPONIBLE <b>{formatCredits(balance)} CR</b></span></div>
          <div className="stake-input-wrap"><button className="stepper-button" aria-label="Restar 100 créditos" onClick={() => setStake(current => Math.max(100, current - 100))} disabled={stake <= 100 || betOpen}><Icon name="minus" size={16}/></button><input id="stake" className="stake-input" type="number" min="100" max={balance} step="100" value={stake} disabled={betOpen} onChange={event => setStake(Math.max(100, Number(event.target.value) || 100))}/><span className="stake-unit">CR</span><button className="stepper-button" aria-label="Sumar 100 créditos" onClick={() => setStake(current => Math.min(balance, current + 100))} disabled={stake >= balance || betOpen}><Icon name="plus" size={16}/></button></div>
          <div className="quick-amounts" aria-label="Montos rápidos">{[500, 1000, 5000, 10000].map(value => <button key={value} className={`quick-amount ${stake === value ? 'quick-amount-selected' : ''}`} disabled={betOpen} onClick={() => setStake(Math.min(value, Math.max(100, balance)))}>{value >= 1000 ? `${value / 1000}k` : value}</button>)}</div>
          <div className="wager-summary"><span>APUESTA DE PRÁCTICA</span><b>{formatCredits(stake)} <small>CR</small></b></div>
          {betOpen && running ? <button className="button button-cashout place-bet-button" onClick={cashout} disabled={busy}><span className="button-rocket"><Icon name="bolt" size={18}/></span><span>{busy ? 'Retirando…' : `Retirar a ${multiplier.toFixed(2)}×`}</span><span className="button-arrow">↗</span></button> : <button className="button button-primary place-bet-button" onClick={placeBet} disabled={!bettingOpen || betOpen || busy || stake > balance}><span className="button-rocket"><Icon name={betOpen ? 'check' : 'rocket'} size={18}/></span><span>{busy ? 'Confirmando…' : betOpen ? `Apuesta lista · ${countdown}s` : bettingOpen ? 'Confirmar apuesta' : running ? 'Apuestas cerradas' : 'Próximo despegue'}</span><span className="button-arrow">↗</span></button>}
          {message && <div className={`game-message ${message.toLowerCase().includes('no se pudo') || message.toLowerCase().includes('inválid') ? 'game-message-error' : ''}`} role="status"><span className="message-icon"><Icon name={message.toLowerCase().includes('confirmad') || message.toLowerCase().includes('registr') ? 'check' : 'spark'} size={15}/></span>{message}</div>}
          <p className="bet-note"><Icon name="shield" size={15}/> Sin dinero real. Tu apuesta solo usa créditos ficticios.</p>
        </section>

        <section className="fairness-card"><div className="fairness-top"><span className="fairness-icon"><Icon name="shield" size={19}/></span><span className="fairness-label">VUELO VERIFICABLE</span><span className="fairness-check"><Icon name="check" size={13}/></span></div><h3>La ruta es transparente.</h3><p>La semilla del servidor permite comprobar el resultado de cada vuelo al terminar.</p>{round?.serverSeedHash ? <div className="hash-block"><span>HASH DE ESTA RONDA</span><code>{round.serverSeedHash}</code></div> : <div className="fairness-pending"><span className="fairness-pending-dot"/>La huella se revelará al iniciar</div>}{round?.serverSeed && <div className="hash-block hash-seed"><span>SEMILLA REVELADA</span><code>{round.serverSeed}</code></div>}</section>

        <div className="help-card"><span className="help-star"><Icon name="spark" size={16}/></span><span><b>¿Primera vez en órbita?</b><small>Confirma tu apuesta en la cuenta regresiva. El cohete despega solo.</small></span><span className="help-arrow">↗</span></div>
      </aside>
    </section>

    <footer className="game-footer"><span><span className="footer-brand-dot"/> SKYRUSH <i>·</i> SIMULADOR DE JUEGO CRASH</span><span>SOLO CRÉDITOS FICTICIOS <i>·</i> SIN VALOR MONETARIO</span><span>VUELOS PROCESADOS DE FORMA JUSTA <Icon name="shield" size={13}/></span></footer>
  </main>;
}
