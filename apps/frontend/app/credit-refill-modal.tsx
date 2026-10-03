'use client';

import { useEffect, useState } from 'react';

const MAX_REFILL = 1_000_000;
const MAX_BALANCE = 100_000_000;

type Props = {
  balance: number;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (amount: number) => void;
};

const credits = (value: number) => value.toLocaleString('es-CO', { maximumFractionDigits: 2 });

export default function CreditRefillModal({ balance, busy, error, onClose, onSubmit }: Props) {
  const maxAmount = Math.min(MAX_REFILL, Math.max(0, MAX_BALANCE - balance));
  const [amountText, setAmountText] = useState(String(Math.min(50_000, maxAmount)));
  const amount = Number(amountText);
  const validAmount = Number.isFinite(amount) && amount >= 1 && amount <= maxAmount && Math.round(amount * 100) === amount * 100;

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [busy, onClose]);

  const presets = [1_000, 5_000, 10_000, 50_000, 100_000].filter(value => value <= maxAmount);

  return <div className="refill-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="refill-modal" role="dialog" aria-modal="true" aria-labelledby="refill-title" aria-describedby="refill-description">
      <button className="refill-close" type="button" onClick={onClose} disabled={busy} aria-label="Cerrar">×</button>
      <div className="refill-icon">＋</div>
      <div className="eyebrow"><span className="eyebrow-line"/>BILLETERA DE PRÁCTICA</div>
      <h2 id="refill-title">Elige tu recarga.</h2>
      <p id="refill-description">Añade créditos ficticios a tu saldo para seguir jugando.</p>

      <label className="refill-field-label" htmlFor="refill-amount">Cantidad de créditos</label>
      <div className="refill-amount-field"><input autoFocus id="refill-amount" type="number" min="1" max={maxAmount} step="0.01" value={amountText} onChange={event => setAmountText(event.target.value)} disabled={busy || maxAmount < 1}/><span>CR</span></div>

      {presets.length > 0 && <div className="refill-presets" aria-label="Cantidades sugeridas">{presets.map(value => <button key={value} type="button" onClick={() => setAmountText(String(value))} className={amount === value ? 'refill-preset-selected' : ''} disabled={busy}>{credits(value)}</button>)}</div>}

      <div className="refill-preview"><span>Nuevo saldo estimado</span><b>{credits(balance + (validAmount ? amount : 0))} <small>CR</small></b></div>
      <div className="refill-limit">Por recarga: hasta {credits(MAX_REFILL)} CR. Saldo máximo: {credits(MAX_BALANCE)} CR.</div>
      {error && <p className="refill-error" role="alert">{error}</p>}
      <div className="refill-actions"><button className="button refill-cancel" type="button" onClick={onClose} disabled={busy}>Cancelar</button><button className="button button-primary" type="button" onClick={() => validAmount && onSubmit(amount)} disabled={busy || !validAmount}>{busy ? 'Procesando…' : 'Añadir créditos'}</button></div>
      <small className="refill-disclaimer">Solo es una función de demostración. No se mueve dinero real.</small>
    </section>
  </div>;
}
