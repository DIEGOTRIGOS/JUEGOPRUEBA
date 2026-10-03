'use client';

import { FormEvent, useEffect, useState } from 'react';

const API = (process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:4000').replace(/\/$/, '');

type Props = {
  token: string;
  currentUser: { name: string; email: string };
  onBack: () => void;
  onLogout: () => void;
};

type Overview = {
  users: number;
  activeUsers: number;
  rounds: number;
  bets: number;
  demoCreditsInCirculation: number | string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  active: boolean;
  demoBalance: number | string;
  createdAt: string;
  _count: { bets: number };
};

type LedgerRow = {
  id: string;
  type: string;
  amount: number | string;
  reference: string;
  createdAt: string;
  user: { name: string; email: string };
};

const credits = (value: number | string) => Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 });
const date = (value: string) => new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

async function json(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'No se pudo completar la operación.');
  return data;
}

export default function AdminPanel({ token, currentUser, onBack, onLogout }: Props) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});
  const headers = { authorization: `Bearer ${token}` };

  async function load(query = search) {
    setLoading(true);
    try {
      const [overviewResponse, usersResponse, ledgerResponse] = await Promise.all([
        fetch(`${API}/admin/overview`, { headers }),
        fetch(`${API}/admin/users${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`, { headers }),
        fetch(`${API}/admin/ledger`, { headers }),
      ]);
      const [nextOverview, nextUsers, nextLedger] = await Promise.all([
        json(overviewResponse), json(usersResponse), json(ledgerResponse),
      ]);
      setOverview(nextOverview);
      setUsers(nextUsers);
      setLedger(nextLedger);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar el panel.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(''); }, [token]);

  async function adjustCredits(event: FormEvent<HTMLFormElement>, user: UserRow) {
    event.preventDefault();
    const amount = Number(adjustments[user.id]);
    if (!amount) {
      setMessage('Escribe un monto distinto de cero para ajustar el saldo.');
      return;
    }
    setBusyId(user.id);
    try {
      await json(await fetch(`${API}/admin/users/${user.id}/credits`, {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ amount, reason: 'ajuste administrativo' }),
      }));
      setAdjustments(current => ({ ...current, [user.id]: '' }));
      setMessage(`Saldo actualizado para ${user.name}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo ajustar el saldo.');
    } finally {
      setBusyId('');
    }
  }

  async function toggleUser(user: UserRow) {
    setBusyId(user.id);
    try {
      await json(await fetch(`${API}/admin/users/${user.id}/active`, {
        method: 'PATCH',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      }));
      setMessage(`${user.name}: cuenta ${user.active ? 'pausada' : 'activada'}.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cambiar el estado.');
    } finally {
      setBusyId('');
    }
  }

  return <main className="app-shell game-shell console-shell">
    <header className="topbar console-topbar">
      <a href="#inicio" className="wordmark"><span className="wordmark-icon">✦</span><span>SKY<span className="wordmark-accent">RUSH</span></span><span className="wordmark-period">.</span></a>
      <div className="console-heading"><span className="console-live-mark"/>CENTRO DE ADMINISTRACIÓN</div>
      <div className="console-header-actions"><span className="console-admin-name">{currentUser.name}</span><button className="console-quiet-button" onClick={onBack}>Volver al juego</button><button className="icon-button logout-button" onClick={onLogout} aria-label="Cerrar sesión">↗</button></div>
    </header>

    <section className="console-welcome">
      <div><div className="eyebrow"><span className="eyebrow-line"/>OPERACIONES · SKYRUSH</div><h1>Centro de <span>control.</span></h1><p>Gestiona cuentas, créditos de práctica y actividad de la plataforma.</p></div>
      <div className="console-admin-chip"><span>ADMINISTRADOR</span><b>{currentUser.email}</b></div>
    </section>

    {message && <div className="console-notice" role="status">{message}</div>}

    <section className="console-metrics" aria-label="Resumen de la plataforma">
      <article className="console-metric"><span>USUARIOS REGISTRADOS</span><b>{overview?.users ?? '—'}</b><small>{overview?.activeUsers ?? '—'} cuentas activas</small></article>
      <article className="console-metric"><span>CRÉDITOS EN CIRCULACIÓN</span><b>{overview ? credits(overview.demoCreditsInCirculation) : '—'}</b><small>Saldo ficticio de usuarios</small></article>
      <article className="console-metric"><span>APUESTAS REGISTRADAS</span><b>{overview?.bets ?? '—'}</b><small>Historial completo de partidas</small></article>
      <article className="console-metric"><span>VUELOS GENERADOS</span><b>{overview?.rounds ?? '—'}</b><small>Rondas guardadas en servidor</small></article>
    </section>

    <section className="console-grid">
      <article className="console-card console-users-card">
        <div className="console-card-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>CUENTAS</div><h2>Gestión de usuarios</h2></div><span className="console-count">{users.length} CUENTAS</span></div>
        <form className="console-search" onSubmit={event => { event.preventDefault(); void load(search); }}>
          <span aria-hidden="true">⌕</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nombre o correo" aria-label="Buscar usuarios"/><button type="submit">Buscar</button>
        </form>
        {loading ? <div className="console-empty">Actualizando datos…</div> : users.length === 0 ? <div className="console-empty">No encontramos cuentas con esa búsqueda.</div> : <div className="console-table-wrap"><table className="console-table"><thead><tr><th>USUARIO</th><th>ESTADO</th><th>SALDO</th><th>PARTIDAS</th><th>AJUSTAR CRÉDITOS</th><th>ACCESO</th></tr></thead><tbody>
          {users.map(user => <tr key={user.id}>
            <td><div className="console-user-cell"><span className="console-avatar">{user.name.slice(0, 1).toUpperCase()}</span><span><b>{user.name}</b><small>{user.email}</small><small>Desde {date(user.createdAt)}</small></span></div></td>
            <td><span className={`console-status ${user.active ? 'console-status-active' : ''}`}>{user.active ? 'Activa' : 'Pausada'}</span></td>
            <td className="console-balance">{credits(user.demoBalance)} <small>CR</small></td>
            <td>{user._count.bets}</td>
            <td>{user.role === 'USER' ? <form className="console-adjust-form" onSubmit={event => void adjustCredits(event, user)}><input aria-label={`Ajuste de créditos para ${user.name}`} type="number" step="0.01" value={adjustments[user.id] ?? ''} onChange={event => setAdjustments(current => ({ ...current, [user.id]: event.target.value }))} placeholder="+ / − créditos"/><button disabled={busyId === user.id}>{busyId === user.id ? '…' : 'Aplicar'}</button></form> : <span className="console-role">ADMIN</span>}</td>
            <td>{user.role === 'USER' ? <button className="console-toggle" disabled={busyId === user.id} onClick={() => void toggleUser(user)}>{user.active ? 'Pausar' : 'Activar'}</button> : <span className="console-role">Protegido</span>}</td>
          </tr>)}
        </tbody></table></div>}
        <div className="console-table-foot">Los ajustes quedan registrados en la bitácora. El saldo máximo por cuenta es de 100.000.000 créditos.</div>
      </article>

      <aside className="console-card console-ledger-card">
        <div className="console-card-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>AUDITORÍA</div><h2>Movimientos recientes</h2></div><span className="console-count">{ledger.length}</span></div>
        <div className="console-ledger-list">{ledger.length ? ledger.slice(0, 18).map(entry => <div className="console-ledger-row" key={entry.id}><span className={`console-ledger-icon ${Number(entry.amount) < 0 ? 'console-ledger-negative' : ''}`}>{Number(entry.amount) < 0 ? '−' : '+'}</span><span className="console-ledger-meta"><b>{entry.user.name}</b><small>{entry.user.email}</small><small>{entry.type.replaceAll('_', ' ')} · {date(entry.createdAt)}</small></span><b className={Number(entry.amount) < 0 ? 'console-amount-negative' : 'console-amount-positive'}>{Number(entry.amount) > 0 ? '+' : ''}{credits(entry.amount)}</b></div>) : <div className="console-empty">Los movimientos aparecerán aquí.</div>}</div>
        <p className="console-ledger-foot">Control de créditos ficticios · Sin operaciones monetarias</p>
      </aside>
    </section>
  </main>;
}
