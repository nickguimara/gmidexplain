import React, { useId, useState } from 'react';
import { BIAS, COLORS, LENGTHS, designPoint } from './model';

const fmt = (value, digits = 2) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(value);
const SAMPLES = Array.from({ length: 101 }, (_, i) => 5 + i * .2);

// Both panels use gm/ID as x. Fixed gm sets I=gm/eta; branchCount=2 counts
// total tail current in the differential comparison. Its other plots can
// retain a separate fixed-current reference, without changing this contract.
export default function TradeoffChart({ efficiency, setEfficiency, length, evaluate = designPoint, areaKey = 'area', areaLabel = 'Área de gate (µm² · log)', currentLabel = 'Corrente de dreno (µA)', referenceGm = BIAS.gm, branchCount = 1 }) {
  const [hover, setHover] = useState(null);
  const clipId = `area-current-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const w = 520, h = 452, left = 58, right = 120;
  const topA = 26, bottomA = 182, topB = 246, bottomB = 402;
  const currentAt = eta => branchCount * referenceGm / eta;
  const currentMax = currentAt(5) * 7 / 6;
  const x = eta => left + (eta - 5) / 20 * (w - left - right);
  const yArea = area => bottomA - Math.log10(area / .01) / Math.log10(200 / .01) * (bottomA - topA);
  const yCurrent = current => bottomB - current / currentMax * (bottomB - topB);
  const areaAt = (eta, l) => evaluate(eta, l)[areaKey];
  const areaTicks = [.01, .1, 1, 10, 100];
  const currentTicks = [0, 20, 40, 60].map(v => v * branchCount * referenceGm / BIAS.gm);
  const labels = LENGTHS.map(l => ({ l, endpoint: yArea(areaAt(25, l)) })).sort((a, b) => a.endpoint - b.endpoint);
  labels.forEach((label, i) => { label.displayY = Math.max(label.endpoint, i ? labels[i - 1].displayY + 23 : topA + 5); });
  const overflow = Math.max(0, labels.at(-1).displayY - (bottomA - 4));
  labels.forEach(label => { label.displayY -= overflow; });
  function position(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = ((event.clientX - rect.left) / rect.width * w - left) / (w - left - right);
    return Math.min(25, Math.max(5, 5 + fraction * 20));
  }
  const band = (top, bottom) => <>
    <rect x={x(5)} y={top} width={x(10) - x(5)} height={bottom - top} fill="#f0f4fa" />
    <rect x={x(10)} y={top} width={x(20) - x(10)} height={bottom - top} fill="#f1f7f4" />
    <rect x={x(20)} y={top} width={x(25) - x(20)} height={bottom - top} fill="#fff5ea" />
  </>;
  return <div className="chart-wrap">
    <svg viewBox={`0 0 ${w} ${h}`} className="chart tradeoff-chart" role="img" aria-label={`${areaLabel} e ${currentLabel} versus gm/ID, para gm fixo em ${referenceGm} microsiemens por transistor. Acima, área em escala logarítmica por L; abaixo, corrente linear igual para todos os L. Clique para selecionar gm/ID.`}
      onMouseMove={event => setHover(position(event))} onMouseLeave={() => setHover(null)} onClick={event => setEfficiency(Math.round(position(event) * 10) / 10)}>
      <defs>
        <clipPath id={`${clipId}-area`}><rect x={left} y={topA} width={w - left - right} height={bottomA - topA} /></clipPath>
        <clipPath id={`${clipId}-current`}><rect x={left} y={topB} width={w - left - right} height={bottomB - topB} /></clipPath>
      </defs>
      {band(topA, bottomA)}{band(topB, bottomB)}
      {areaTicks.map(value => <g key={value}>
        <line x1={left} x2={w - right} y1={yArea(value)} y2={yArea(value)} stroke="#e6eaf0" strokeDasharray="3 4" />
        <text x={left - 10} y={yArea(value) + 4} textAnchor="end" className="axis-text">{fmt(value)}</text>
      </g>)}
      {currentTicks.map(value => <g key={value}>
        <line x1={left} x2={w - right} y1={yCurrent(value)} y2={yCurrent(value)} stroke="#e6eaf0" strokeDasharray="3 4" />
        <text x={left - 10} y={yCurrent(value) + 4} textAnchor="end" className="axis-text">{fmt(value, 0)}</text>
      </g>)}
      {[5, 10, 15, 20, 25].map(value => <text key={value} x={x(value)} y={bottomB + 21} textAnchor="middle" className="axis-text">{value}</text>)}
      <text x={left} y={topA - 10} className="axis-text">{areaLabel}</text>
      <text x={left} y={topB - 10} className="axis-text">{currentLabel}</text>
      <text x={(left + w - right) / 2} y={h - 4} textAnchor="middle" className="axis-label">gₘ/Iᴅ (V⁻¹)</text>
      <g clipPath={`url(#${clipId}-area)`}>
        {LENGTHS.map((l, i) => <path key={l} data-area-curve={l} d={SAMPLES.map((eta, index) => `${index ? 'L' : 'M'}${x(eta)},${yArea(areaAt(eta, l))}`).join(' ')} fill="none" stroke={COLORS[i]} strokeWidth={l === length ? 3 : 2} opacity={l === length ? 1 : .65} />)}
        {LENGTHS.map((l, i) => <circle key={l} cx={x(efficiency)} cy={yArea(areaAt(efficiency, l))} r={l === length ? 5 : 3} fill="#fff" stroke={COLORS[i]} strokeWidth="2" />)}
        {hover !== null && <circle cx={x(hover)} cy={yArea(areaAt(hover, length))} r="4" fill="#344b65" />}
      </g>
      <g clipPath={`url(#${clipId}-current)`}>
        <path data-current-curve="" d={SAMPLES.map((eta, index) => `${index ? 'L' : 'M'}${x(eta)},${yCurrent(currentAt(eta))}`).join(' ')} fill="none" stroke="#526880" strokeWidth="2.5" />
        <circle cx={x(efficiency)} cy={yCurrent(currentAt(efficiency))} r="5" fill="#fff" stroke="#526880" strokeWidth="2" />
      </g>
      <line x1={x(efficiency)} x2={x(efficiency)} y1={topA} y2={bottomB} stroke="#7d8796" strokeDasharray="4 5" />
      {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={topA} y2={bottomB} stroke="#8290a4" strokeDasharray="3 4" />}
      {labels.map(label => <g key={label.l}>
        <path d={`M${x(25)},${label.endpoint} L${x(25) + 10},${label.displayY} H${x(25) + 16}`} fill="none" stroke={COLORS[LENGTHS.indexOf(label.l)]} strokeDasharray="2 3" />
        <text x={x(25) + 20} y={label.displayY + 4.5} className="curve-label" fill={COLORS[LENGTHS.indexOf(label.l)]} fontWeight={label.l === length ? 700 : 600}>L = {fmt(label.l, 2)} µm</text>
      </g>)}
      <text x={x(25) + 20} y={yCurrent(currentAt(25)) + 4.5} className="curve-label" fill="#526880">todos os L</text>
    </svg>
    {hover !== null && <div className="chart-tooltip">gm/ID = {fmt(hover)} V⁻¹ · L = {fmt(length, 2)} µm<span>{fmt(currentAt(hover))} µA · {fmt(areaAt(hover, length))} µm² · gm = {fmt(referenceGm, 0)} µS por transistor</span></div>}
  </div>;
}
