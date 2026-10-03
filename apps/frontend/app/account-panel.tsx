'use client';

type LedgerEntry = {
  id: string;
  type: string;
  amount: number | string;
  reference: string;
  createdAt: string;
};

type Bet = {
  id: string;
  status: string;
  stake: number | string;
  cashoutAt?: number | string | null;
  payout?: number | string | null;
  createdAt?: string;
  round?: { sequence: number; crashMultiplier?: number | string | null };
};

type Props = {
  user: { name: string; email: string } | null;
  balance: number;
  ledger: LedgerEntry[];
  bets: Bet[];
  busy: boolean;
  message: string;
  onOpenRefill: () => void;
  onBack: () => void;
  onLogout: () => void;
};

const credits = (value: number | string) => Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 });
const date = (value: string) => new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const movementLabel: Record<string, string> = {
  DEMO_GRANT: 'Créditos de práctica',
  BET: 'Apuesta confirmada',
  CASHOUT: 'Retiro de apuesta',
  REFUND: 'Ajuste de saldo',
};

export default function AccountPanel({ user, balance, ledger, bets, busy, message, onOpenRefill, onBack, onLogout }: Props) {
  const wins = bets.filter(bet => bet.status === 'CASHED_OUT').length;
  const losses = bets.filter(bet => bet.status === 'LOST').length;
  const totalStaked = bets.reduce((sum, bet) => sum + Number(bet.stake || 0), 0);

  return <main className="app-shell game-shell console-shell account-shell">
    <header className="topbar console-topbar">
      <a href="#inicio" className="wordmark"><span className="wordmark-icon">✦</span><span>SKY<span className="wordmark-accent">RUSH</span></span><span className="wordmark-period">.</span></a>
      <div className="console-heading"><span className="console-live-mark"/>MI ESPACIO</div>
      <div className="console-header-actions"><span className="console-admin-name">{user?.name}</span><button className="console-quiet-button" onClick={onBack}>Volver al juego</button><button className="icon-button logout-button" onClick={onLogout} aria-label="Cerrar sesión">↗</button></div>
    </header>

    <section className="console-welcome account-welcome">
      <div><div className="eyebrow"><span className="eyebrow-line"/>TU CUENTA</div><h1>Tu espacio de <span>vuelo.</span></h1><p>{user?.email} · Créditos de práctica sin valor monetario.</p></div>
      <div className="account-balance-card"><span>SALDO DISPONIBLE</span><b>{credits(balance)} <small>CR</small></b><button className="button button-primary" onClick={onOpenRefill} disabled={busy || balance >= 100000000}>{busy ? 'Actualizando…' : '＋ Elegir cantidad para recargar'}</button><small>Saldo máximo: 100.000.000 CR</small></div>
    </section>

    {message && <div className="console-notice" role="status">{message}</div>}

    <section className="console-metrics account-metrics">
      <article className="console-metric"><span>PARTIDAS REGISTRADAS</span><b>{bets.length}</b><small>Tu actividad reciente</small></article>
      <article className="console-metric"><span>RETIROS CONFIRMADOS</span><b>{wins}</b><small>Vuelos cerrados a tiempo</small></article>
      <article className="console-metric"><span>APUESTAS PERDIDAS</span><b>{losses}</b><small>Créditos en partidas finalizadas</small></article>
      <article className="console-metric"><span>CRÉDITOS APOSTADOS</span><b>{credits(totalStaked)}</b><small>En los últimos {bets.length} registros</small></article>
    </section>

    <section className="account-panels">
      <article className="console-card account-list-card">
        <div className="console-card-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>BITÁCORA PERSONAL</div><h2>Mis partidas</h2></div><span className="console-count">{bets.length} REGISTROS</span></div>
        <div className="account-rows">{bets.length ? bets.map(bet => <div className="account-row" key={bet.id}><span className={`account-result-icon ${bet.status === 'CASHED_OUT' ? 'account-result-win' : bet.status === 'LOST' ? 'account-result-loss' : ''}`}>{bet.status === 'CASHED_OUT' ? '✓' : bet.status === 'LOST' ? '×' : '…'}</span><span className="account-row-title"><b>Vuelo #{bet.round?.sequence ?? '—'}</b><small>{bet.createdAt ? date(bet.createdAt) : 'Partida en curso'}</small></span><span className="account-row-detail"><small>Apuesta</small><b>{credits(bet.stake)} CR</b></span><span className="account-row-detail"><small>{bet.status === 'CASHED_OUT' ? `Retiro a ${Number(bet.cashoutAt).toFixed(2)}×` : 'Resultado'}</small><b className={bet.status === 'CASHED_OUT' ? 'account-positive' : ''}>{bet.status === 'CASHED_OUT' ? `+${credits(bet.payout ?? 0)} CR` : bet.status === 'LOST' ? `${Number(bet.round?.crashMultiplier ?? 0).toFixed(2)}×` : 'En juego'}</b></span><span className={`account-status ${bet.status === 'CASHED_OUT' ? 'account-status-win' : bet.status === 'LOST' ? 'account-status-loss' : ''}`}>{bet.status === 'CASHED_OUT' ? 'Retirada' : bet.status === 'LOST' ? 'Finalizada' : 'En juego'}</span></div>) : <div className="console-empty account-empty">Cuando juegues tu primera partida, verás el detalle aquí.</div>}</div>
        <div className="console-table-foot">Se muestran tus últimos 30 registros de partidas.</div>
      </article>

      <aside className="console-card account-list-card">
        <div className="console-card-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>SALDO</div><h2>Movimientos</h2></div><span className="console-count">{ledger.length}</span></div>
        <div className="console-ledger-list">{ledger.length ? ledger.map(entry => <div className="console-ledger-row" key={entry.id}><span className={`console-ledger-icon ${Number(entry.amount) < 0 ? 'console-ledger-negative' : ''}`}>{Number(entry.amount) < 0 ? '−' : '+'}</span><span className="console-ledger-meta"><b>{movementLabel[entry.type] ?? entry.type}</b><small>{date(entry.createdAt)}</small><small>{entry.reference.startsWith('admin:') ? 'Ajuste de soporte' : entry.reference}</small></span><b className={Number(entry.amount) < 0 ? 'console-amount-negative' : 'console-amount-positive'}>{Number(entry.amount) > 0 ? '+' : ''}{credits(entry.amount)}</b></div>) : <div className="console-empty account-empty">Tus recargas y movimientos aparecerán aquí.</div>}</div>
        <p className="console-ledger-foot">Registro seguro de créditos de práctica</p>
      </aside>
    </section>
  </main>;
}
