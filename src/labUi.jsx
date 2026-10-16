import React, { useEffect, useRef, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { COLORS, LENGTHS } from './model';

export const fmt = (n, digits = 1) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(n);

export function Metric({ label, symbol, value, unit }) {
  return <div className="metric"><div className="metric-label">{label}<span>{symbol}</span></div><div className="metric-value">{value}<small>{unit}</small></div></div>;
}

// Curva didática genérica: uma métrica em função de gm/ID, uma curva por L
// (ou uma curva única quando config.shared). evaluate(gmId, length) devolve o valor.
export function LabChart({ id, config, evaluate, efficiency, setEfficiency, length, tall = false }) {
  const [hover, setHover] = useState(null);
  const w = 520, h = tall ? 452 : 300, pad = tall ? { left: 58, right: 120, top: 26, bottom: 50 } : { left: 58, right: 120, top: 26, bottom: 48 };
  const clipId = `plot-clip-${id}`;
  const curves = config.shared ? [length] : LENGTHS;
  const curveColor = l => config.shared ? '#526880' : COLORS[LENGTHS.indexOf(l)];
  const values = curves.flatMap(l => Array.from({ length: 101 }, (_, i) => evaluate(5 + i * .2, l)));
  const rawMax = Math.max(...values) * 1.08;
  const magnitude = 10 ** Math.floor(Math.log10(rawMax));
  const max = Math.ceil(rawMax / magnitude / 2) * magnitude * 2;
  const x = v => pad.left + (v - 5) / 20 * (w - pad.left - pad.right);
  const y = v => h - pad.bottom - v / max * (h - pad.top - pad.bottom);
  const hoverValue = hover === null ? null : evaluate(hover, length);
  // Keep direct labels readable, even when curve endpoints converge near zero.
  const labels = curves.map(l => ({ l, endpoint: y(evaluate(25, l)) })).sort((a, b) => a.endpoint - b.endpoint);
  labels.forEach((label, i) => { label.labelY = Math.max(label.endpoint, i ? labels[i - 1].labelY + 23 : pad.top + 5); });
  const overflow = Math.max(0, labels.at(-1).labelY - (h - pad.bottom - 4));
  labels.forEach(label => { label.labelY -= overflow; });
  function position(e) { const rect = e.currentTarget.getBoundingClientRect(); return Math.min(25, Math.max(5, 5 + (((e.clientX - rect.left) / rect.width * w) - pad.left) / (w - pad.left - pad.right) * 20)); }
  return <div className="chart-wrap"><svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label={`${config.title} versus gm/ID. Use o controle deslizante para alterar o ponto.`} onMouseMove={e => setHover(position(e))} onMouseLeave={() => setHover(null)} onClick={e => setEfficiency(Math.round(position(e) * 10) / 10)}>
    <defs><clipPath id={clipId}><rect x={pad.left} y={pad.top} width={w - pad.left - pad.right} height={h - pad.top - pad.bottom} /></clipPath></defs>
    <rect x={x(5)} y={pad.top} width={x(10) - x(5)} height={h - pad.top - pad.bottom} fill="#f0f4fa" /><rect x={x(10)} y={pad.top} width={x(20) - x(10)} height={h - pad.top - pad.bottom} fill="#f1f7f4" /><rect x={x(20)} y={pad.top} width={x(25) - x(20)} height={h - pad.top - pad.bottom} fill="#fff5ea" />
    {Array.from({ length: 5 }, (_, i) => <g key={i}><line x1={pad.left} x2={w - pad.right} y1={y(max * i / 4)} y2={y(max * i / 4)} stroke="#e6eaf0" strokeDasharray="3 4" /><text x={pad.left - 12} y={y(max * i / 4) + 4} textAnchor="end" className="axis-text">{fmt(max * i / 4, 2)}</text></g>)}
    {[5, 10, 15, 20, 25].map(v => <g key={v}><text x={x(v)} y={h - 27} textAnchor="middle" className="axis-text">{v}</text></g>)}
    <text x={pad.left} y={16} className="axis-text">{config.unit}</text><text x={(pad.left + w - pad.right) / 2} y={h - 4} textAnchor="middle" className="axis-label">gₘ/Iᴅ (V⁻¹)</text>
    <g clipPath={`url(#${clipId})`}>{curves.map(l => <path key={l} d={Array.from({ length: 101 }, (_, i) => { const v = 5 + i * .2; return `${i === 0 ? 'M' : 'L'}${x(v)},${y(evaluate(v, l))}`; }).join(' ')} fill="none" stroke={curveColor(l)} strokeWidth={l === length ? 3 : 2} opacity={l === length ? 1 : .85} />)}
    <line x1={x(efficiency)} x2={x(efficiency)} y1={pad.top} y2={h - pad.bottom} stroke="#7d8796" strokeDasharray="4 5" />{curves.map(l => <circle key={l} cx={x(efficiency)} cy={y(evaluate(efficiency, l))} r={l === length ? 5 : 3} fill="#fff" stroke={curveColor(l)} strokeWidth="2" />)}
    {hover !== null && <><line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={h - pad.bottom} stroke="#8290a4" strokeDasharray="3 4" /><circle cx={x(hover)} cy={y(hoverValue)} r="4" fill="#344b65" /></>}</g>
    {labels.map(label => <g key={label.l}><path d={`M${x(25)},${label.endpoint} L${x(25) + 10},${label.labelY} H${x(25) + 16}`} fill="none" stroke={curveColor(label.l)} strokeWidth="1" strokeDasharray="2 3" opacity=".8" /><text className="curve-label" x={x(25) + 20} y={label.labelY + 4.5} fill={curveColor(label.l)} fontWeight={label.l === length ? 700 : 600}>{config.shared ? 'Todos os L' : `L = ${fmt(label.l, 2)} µm`}</text></g>)}
  </svg>{hover !== null && <div className="chart-tooltip">L = {fmt(length, 2)} µm · gₘ/Iᴅ {fmt(hover)}<span>{fmt(hoverValue, 2)} {config.unit} · Clique para selecionar</span></div>}</div>;
}

export function EfficiencyControl({ efficiency, setEfficiency, regime, onReset }) {
  return <section className="card focus-control"><div className="focus-heading"><div><h2>gₘ = 300 µS <span className="fixed-tag">fixo</span></h2></div><span className="regime-badge"><span />{regime}</span><button className="icon-button" onClick={onReset} title="Restaurar ponto inicial" aria-label="Restaurar ponto inicial"><RotateCcw size={15} /></button></div><div className="efficiency-control"><label htmlFor="efficiency">gₘ/Iᴅ</label><output>{fmt(efficiency)} <small>V⁻¹</small></output></div>
    <input className="efficiency-range" id="efficiency" type="range" min="5" max="25" step=".1" value={efficiency} aria-valuetext={`${fmt(efficiency)} V⁻¹, ${regime}`} onChange={e => setEfficiency(+e.target.value)} />
    <div className="inversion-ticks" aria-hidden="true">{[5, 10, 15, 20, 25].map((value, i) => <span key={value} style={{ left: `${i * 25}%` }}>{value}</span>)}</div>
    <div className="inversion-zones" aria-label="Regiões de inversão, faixas didáticas aproximadas" title="Faixas didáticas aproximadas, não limites físicos exatos">
      <div className={`inversion-zone strong ${efficiency < 10 ? 'current' : ''}`} aria-current={efficiency < 10 ? 'true' : undefined}>Inversão forte</div>
      <div className={`inversion-zone moderate ${efficiency >= 10 && efficiency <= 20 ? 'current' : ''}`} aria-current={efficiency >= 10 && efficiency <= 20 ? 'true' : undefined}>Inversão moderada</div>
      <div className={`inversion-zone weak ${efficiency > 20 ? 'current' : ''}`} aria-current={efficiency > 20 ? 'true' : undefined}>Inversão fraca</div>
    </div>
  </section>;
}

export function LengthSelector({ length, setLength }) {
  return <section className="card comparison-card"><h2>Comprimento de canal</h2><div className="length-key">{LENGTHS.map((l, i) => <button key={l} aria-pressed={length === l} onClick={() => setLength(l)} className={length === l ? 'selected' : ''} style={{ '--curve-color': COLORS[i] }}><span />L = {fmt(l, 2)} µm{length === l && <Check size={13} />}</button>)}</div></section>;
}

export function LabDialog({ onClose, title, icon, actionLabel, children }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const focusable = () => [...dialog.querySelectorAll('button, a[href], input, select, [tabindex="0"]')];
    focusable()[0]?.focus();
    function handleKey(event) {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const controls = focusable();
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onClick={onClose}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="modal" onClick={e => e.stopPropagation()}>
      <button className="modal-close icon-button" onClick={onClose} aria-label="Fechar"><X size={21} /></button>
      <div className="modal-icon">{icon}</div>
      <h2 id="modal-title">{title}</h2>
      {children}
      <button className="primary-button" onClick={onClose}><Check size={16} /> {actionLabel}</button>
    </section>
  </div>;
}