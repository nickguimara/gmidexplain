import React, { useState } from 'react';
import { COLORS, LENGTHS, designPoint } from './model';

const fmt = (value, digits = 2) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(value);
const SAMPLES = Array.from({ length: 101 }, (_, i) => 5 + i * .2);

// Trade-off área × corrente com gm fixo, ambos em função de gm/ID:
// acima, a área de gate (log); abaixo, a corrente (linear, igual para todos os L).
export default function AreaCurrentChart({ efficiency, setEfficiency, length, evaluate = designPoint, areaKey = 'area', currentKey = 'current', areaLabel = 'Área (µm² · log)', currentLabel = 'Iᴅ (µA)' }) {
  const [hover, setHover] = useState(null);
  const w = 520, h = 452;
  const left = 58, right = 120;
  const topA = 26, bottomA = 182, topB = 246, bottomB = 402;
  const x = value => left + (value - 5) / 20 * (w - left - right);
  const yArea = area => bottomA - (Math.log10(area) + 2) / Math.log10(200 / 0.01) * (bottomA - topA);
  const yCurrent = current => bottomB - current / 70 * (bottomB - topB);
  const areaAt = (l, e) => evaluate(e, l)[areaKey];
  const currentAt = e => evaluate(e, length)[currentKey];
  const areaTicks = [.01, .1, 1, 10, 100];
  const currentTicks = [0, 20, 40, 60];
  const labels = LENGTHS.map(l => ({ l, endpoint: yArea(areaAt(l, 25)) })).sort((a, b) => a.endpoint - b.endpoint);
  labels.forEach((label, i) => { label.labelY = Math.max(label.endpoint, i ? labels[i - 1].labelY + 23 : topA + 5); });
  const overflow = Math.max(0, labels.at(-1).labelY - (bottomA - 4));
  labels.forEach(label => { label.labelY -= overflow; });
  function position(e) { const rect = e.currentTarget.getBoundingClientRect(); return Math.min(25, Math.max(5, 5 + (((e.clientX - rect.left) / rect.width * w) - left) / (w - left - right) * 20)); }
  function select(e) { setEfficiency(Math.round(position(e) * 10) / 10); }
  const hoverArea = hover === null ? null : areaAt(length, hover);
  const hoverCurrent = hover === null ? null : currentAt(hover);
  const band = (top, bottom) => <><rect x={x(5)} y={top} width={x(10) - x(5)} height={bottom - top} fill="#f0f4fa" /><rect x={x(10)} y={top} width={x(20) - x(10)} height={bottom - top} fill="#f1f7f4" /><rect x={x(20)} y={top} width={x(25) - x(20)} height={bottom - top} fill="#fff5ea" /></>;
  return <div className="chart-wrap"><svg viewBox={`0 0 ${w} ${h}`} className="chart area-current-chart" role="img" aria-label={`${areaLabel} e ${currentLabel} versus gm/ID, com gm fixo em 300 microsiemens. Acima, área em escala logarítmica para quatro comprimentos; abaixo, corrente, igual para todos os comprimentos. Clique para selecionar o ponto.`} onMouseMove={e => setHover(position(e))} onMouseLeave={() => setHover(null)} onClick={select}>
    {band(topA, bottomA)}{band(topB, bottomB)}
    {areaTicks.map(value => <g key={`a${value}`}><line x1={left} x2={w - right} y1={yArea(value)} y2={yArea(value)} stroke="#e6eaf0" strokeDasharray="3 4" /><text x={left - 10} y={yArea(value) + 4} textAnchor="end" className="axis-text">{fmt(value)}</text></g>)}
    {currentTicks.map(value => <g key={`c${value}`}><line x1={left} x2={w - right} y1={yCurrent(value)} y2={yCurrent(value)} stroke="#e6eaf0" strokeDasharray="3 4" /><text x={left - 10} y={yCurrent(value) + 4} textAnchor="end" className="axis-text">{value}</text></g>)}
    {[5, 10, 15, 20, 25].map(value => <text key={value} x={x(value)} y={bottomB + 21} textAnchor="middle" className="axis-text">{value}</text>)}
    <text x={left} y={topA - 10} className="axis-text">{areaLabel}</text>
    <text x={left} y={topB - 10} className="axis-text">{currentLabel}</text>
    <text x={(left + w - right) / 2} y={h - 4} textAnchor="middle" className="axis-label">gₘ/Iᴅ (V⁻¹)</text>
    {LENGTHS.map((l, index) => <path key={l} d={SAMPLES.map((e, i) => `${i === 0 ? 'M' : 'L'}${x(e).toFixed(1)},${yArea(areaAt(l, e)).toFixed(1)}`).join(' ')} fill="none" stroke={COLORS[index]} strokeWidth={l === length ? 3 : 2} opacity={l === length ? 1 : .85} />)}
    <path d={SAMPLES.map((e, i) => `${i === 0 ? 'M' : 'L'}${x(e).toFixed(1)},${yCurrent(currentAt(e)).toFixed(1)}`).join(' ')} fill="none" stroke="#526880" strokeWidth="2.5" />
    <line x1={x(efficiency)} x2={x(efficiency)} y1={topA} y2={bottomB} stroke="#7d8796" strokeDasharray="4 5" />
    {LENGTHS.map((l, i) => <circle key={l} cx={x(efficiency)} cy={yArea(areaAt(l, efficiency))} r={l === length ? 5 : 3} fill="#fff" stroke={COLORS[i]} strokeWidth="2" />)}
    <circle cx={x(efficiency)} cy={yCurrent(currentAt(efficiency))} r="5" fill="#fff" stroke="#526880" strokeWidth="2" />
    {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={topA} y2={bottomB} stroke="#8290a4" strokeDasharray="3 4" />}
    {labels.map(label => <g key={label.l}><path d={`M${x(25)},${label.endpoint} L${x(25) + 10},${label.labelY} H${x(25) + 16}`} fill="none" stroke={COLORS[LENGTHS.indexOf(label.l)]} strokeWidth="1" strokeDasharray="2 3" opacity=".8" /><text className="curve-label" x={x(25) + 20} y={label.labelY + 4.5} fill={COLORS[LENGTHS.indexOf(label.l)]} fontWeight={label.l === length ? 700 : 600}>L = {fmt(label.l, 2)} µm</text></g>)}
    <text className="curve-label" x={x(25) + 20} y={yCurrent(currentAt(25)) + 4.5} fill="#526880" fontWeight="600">todos os L</text>
  </svg>{hover !== null && <div className="chart-tooltip">L = {fmt(length, 2)} µm · gₘ/Iᴅ {fmt(hover)}<span>{fmt(hoverArea, 2)} µm² · {fmt(hoverCurrent)} µA · Clique para selecionar</span></div>}</div>;
}
