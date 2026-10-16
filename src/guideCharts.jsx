import React from 'react';
import { COLORS, LENGTHS } from './model';
import { evaluatePoint } from './basicSizing';

const EFFICIENCIES = Array.from({ length: 41 }, (_, i) => 5 + i * .5);

function Frame({ title, yLabel, xLabel = 'gm/ID (V⁻¹)', children, labelledBy }) {
  return <svg viewBox="0 0 520 300" role="img" aria-label={labelledBy}>
    <text x="58" y="18" className="chart-title">{title}</text>
    <text x="58" y="36" className="chart-unit">{yLabel}</text>
    {children}
    <text x="262" y="294" textAnchor="middle" className="chart-xlabel">{xLabel}</text>
  </svg>;
}

function curves(example, pick) {
  return LENGTHS.map(l => ({ length: l, values: EFFICIENCIES.map(eta => pick(evaluatePoint(example, l, eta))) }));
}

function CurveSet({ example, length, efficiency, panel, y, guide, guideLabel }) {
  const w = 520, left = 58, right = 104;
  const top = 52, bottom = 248;
  const clipId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const x = value => left + (value - 5) / 20 * (w - left - right);
  const chosen = evaluatePoint(example, length, efficiency);
  const list = curves(example, panel.value);
  const labels = list.map(curve => ({ length: curve.length, y: y(panel.value(evaluatePoint(example, curve.length, 25))) }))
    .sort((a, b) => a.y - b.y);
  labels.forEach((entry, i) => { entry.display = Math.max(entry.y, i ? labels[i - 1].display + 15 : top); });
  const labelY = {};
  labels.forEach(entry => { labelY[entry.length] = Math.min(entry.display, bottom); });
  return <g>
    <defs><clipPath id={clipId}><rect x={left} y={top} width={w - left - right} height={bottom - top} /></clipPath></defs>
    {panel.ticks.map(value => <g key={value}>
      <line x1={left} x2={w - right} y1={y(value)} y2={y(value)} className="chart-grid" />
      <text x={left - 10} y={y(value) + 4} textAnchor="end" className="chart-tick">{panel.format(value)}</text>
    </g>)}
    {[5, 10, 15, 20, 25].map(value => <text key={value} x={x(value)} y={bottom + 20} textAnchor="middle" className="chart-tick">{value}</text>)}
    {guide != null && <>
      <line x1={left} x2={w - right} y1={y(guide)} y2={y(guide)} className="chart-guide" />
      <text x={left + 6} y={y(guide) - 8} className="chart-guide-label">{guideLabel}</text>
    </>}
    {list.map((curve, i) => <g key={curve.length}>
      <g clipPath={`url(#${clipId})`}>
      <path d={curve.values.map((value, index) => `${index ? 'L' : 'M'}${x(EFFICIENCIES[index]).toFixed(1)},${y(value).toFixed(1)}`).join(' ')}
        fill="none" stroke={COLORS[i]} strokeWidth={curve.length === length ? 2.6 : 1.6}
        opacity={curve.length === length ? 1 : 0.55} />
      </g>
      <text x={w - right + 10} y={labelY[curve.length] + 4} fill={COLORS[i]} className="chart-curve-label">L = {String(curve.length).replace('.', ',')} µm</text>
    </g>)}
    <circle cx={x(efficiency)} cy={y(panel.value(chosen))} r="5" fill="#fff" stroke={COLORS[LENGTHS.indexOf(length)]} strokeWidth="2.6" />
  </g>;
}

// Intrinsic gain vs gm/ID (linear). Single faint guide at the required gain.
export function GainChart({ example, length, efficiency }) {
  const top = 52, bottom = 248, max = 600;
  const y = value => bottom - Math.min(value, max) / max * (bottom - top);
  return <figure className="basic-chart">
    <Frame title="Ganho intrínseco" yLabel="gm/gds (V/V)" labelledBy={`Ganho intrínseco versus gm/ID para quatro comprimentos. Linha de referência no ganho exigido de ${example.gain} volts por volt.`}>
      <CurveSet example={example} length={length} efficiency={efficiency}
        panel={{ value: point => point.intrinsicGain, ticks: [0, 150, 300, 450, 600], format: value => String(value) }}
        y={y} guide={example.gain} guideLabel={`exigido ${example.gain}`} />
    </Frame>
  </figure>;
}

// Transit frequency vs gm/ID (log, one decade per ~52 px). Single guide at κT·fdes.
export function FtChart({ example, length, efficiency }) {
  const top = 52, bottom = 248, min = 0.1, max = 1000;
  const y = value => bottom - Math.log10(Math.max(value, min) / min) / Math.log10(max / min) * (bottom - top);
  const guidelineGHz = example.speedMargin * example.bandwidthDesign / 1e9;
  return <figure className="basic-chart">
    <Frame title="Frequência de transição" yLabel="fT (GHz · log)" labelledBy="Frequência de transição versus gm/ID em escala logarítmica, com linha de referência na diretriz de velocidade.">
      <CurveSet example={example} length={length} efficiency={efficiency}
        panel={{ value: point => point.normalized.ft, ticks: [0.1, 1, 10, 100, 1000], format: value => String(value).replace('.', ',') }}
        y={y} guide={guidelineGHz} guideLabel="diretriz" />
    </Frame>
  </figure>;
}

// Current density vs gm/ID (log). The reading step of the basic flow.
export function DensityChart({ example, length, efficiency }) {
  const top = 52, bottom = 248, min = 0.1, max = 1000;
  const w = 520, left = 58, right = 104;
  const clipId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const x = value => left + (value - 5) / 20 * (w - left - right);
  const y = value => bottom - Math.log10(value / min) / Math.log10(max / min) * (bottom - top);
  const density = evaluatePoint(example, length, efficiency).normalized.density;
  const list = curves(example, point => point.normalized.density);
  const labels = list.map(curve => ({ length: curve.length, y: y(curve.values.at(-1)) })).sort((a, b) => a.y - b.y);
  labels.forEach((entry, i) => { entry.display = Math.max(entry.y, i ? labels[i - 1].display + 15 : top); });
  const labelY = {};
  labels.forEach(entry => { labelY[entry.length] = Math.min(entry.display, bottom); });
  return <figure className="basic-chart">
    <Frame title="Densidade de corrente" yLabel="ID/W (µA/µm · log)" labelledBy="Densidade de corrente versus gm/ID em escala logarítmica, com o ponto escolhido destacado.">
      <g>
        {[0.1, 1, 10, 100, 1000].map(value => <g key={value}>
          <line x1={left} x2={w - right} y1={y(value)} y2={y(value)} className="chart-grid" />
          <text x={left - 10} y={y(value) + 4} textAnchor="end" className="chart-tick">{String(value).replace('.', ',')}</text>
        </g>)}
        {[5, 10, 15, 20, 25].map(value => <text key={value} x={x(value)} y={bottom + 20} textAnchor="middle" className="chart-tick">{value}</text>)}
        {list.map((curve, i) => <g key={curve.length}>
          <defs><clipPath id={`${clipId}-${i}`}><rect x={left} y={top} width={w - left - right} height={bottom - top} /></clipPath></defs>
          <g clipPath={`url(#${clipId}-${i})`}>
          <path d={curve.values.map((value, index) => `${index ? 'L' : 'M'}${x(EFFICIENCIES[index]).toFixed(1)},${y(value).toFixed(1)}`).join(' ')}
            fill="none" stroke={COLORS[i]} strokeWidth={curve.length === length ? 2.6 : 1.6} opacity={curve.length === length ? 1 : 0.55} />
          </g>
          <text x={w - right + 10} y={labelY[curve.length] + 4} fill={COLORS[i]} className="chart-curve-label">L = {String(curve.length).replace('.', ',')} µm</text>
        </g>)}
        <line x1={x(efficiency)} x2={x(efficiency)} y1={top} y2={y(density)} className="chart-readout" />
        <line x1={left} x2={x(efficiency)} y1={y(density)} y2={y(density)} className="chart-readout" />
        <circle cx={x(efficiency)} cy={y(density)} r="5" fill="#fff" stroke={COLORS[LENGTHS.indexOf(length)]} strokeWidth="2.6" />
      </g>
    </Frame>
  </figure>;
}
