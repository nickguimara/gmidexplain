import React, { useState } from 'react';
import { ArrowRight, BookOpen, Download, FlaskConical, Info } from 'lucide-react';
import LabShell from './LabShell';
import MathFormula from './MathFormula';
import TradeoffChart from './TradeoffChart';
import ExampleLinks from './ExampleLinks';
import { EfficiencyControl, LabChart, LabDialog, LengthSelector, Metric, fmt } from './labUi';
import { COLORS, LENGTHS } from './model';

// Shared shell for selection-only labs. CSV and cards use the same definitions
// and evaluator as the plots, so labels cannot keep old bias assumptions.
export default function SelectionLabPage({ config }) {
  const [efficiency, setEfficiency] = useState(15);
  const [length, setLength] = useState(.5);
  const [modal, setModal] = useState(null);
  const point = config.evaluate(efficiency, length);
  const regime = efficiency < 10 ? 'Inversão forte' : efficiency <= 20 ? 'Inversão moderada' : 'Inversão fraca';
  const reset = () => { setEfficiency(15); setLength(.5); };
  function exportCSV() {
    const entries = Object.entries(config.metrics);
    const extras = config.csvExtras || [];
    const columns = entries.flatMap(([key, metric]) => metric.csvSeries
      ? metric.csvSeries.map(series => ({ header: `${key}_${series.key} (${series.unit})`, key: series.key }))
      : [{ header: `${key} (${metric.unit})`, key: metric.key }]);
    const rows = [
      `# ILUSTRATIVO; nao extraido do PDK IHP SG13G2; ${config.assumptions}`,
      ['gm_id_V-1', 'L_um', ...columns.map(column => column.header), ...extras.map(field => field.header)].join(','),
    ];
    for (const l of LENGTHS) for (let i = 0; i <= 100; i++) {
      const eta = 5 + i * .2, p = config.evaluate(eta, l);
      rows.push([eta, l, ...columns.map(column => p[column.key]), ...extras.map(field => field.value(p))].join(','));
    }
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = `${config.csvName}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  const Schematic = config.schematic;
  return <>
    <LabShell activeKey={config.key} version={config.version} onHelp={() => setModal('guide')} onUnavailable={setModal} showExamples={!!config.block}>
      <div className="card title-hero">
        <div className="title-hero-left">
          <h1>{config.title}<span className="title-tag">{config.tag}</span></h1>
          <p className="selection-purpose">{config.purpose}</p>
          <button className="secondary-button export" onClick={exportCSV}><Download size={15} /> Exportar curvas</button>
          <button className="data-disclaimer" onClick={() => setModal('data')}><Info size={13} /> Curvas ilustrativas · Não extraídas do PDK</button>
          {config.exampleSlug && <a className="text-action" href={`#/exemplos/${config.exampleSlug}`}>Ver exemplo guiado <ArrowRight size={14} /></a>}
        </div>
        <div className={`title-hero-circuit ${config.tall ? 'tall' : ''}`}>
          <div className="card-heading"><h2>Circuito</h2><span className="neutral-badge">{config.devices}</span></div>
          <Schematic current={point.current} />
          <div className="circuit-caption"><span className="small-dot" />{config.caption}</div>
          <div className="fixed-bias"><p>{config.assumptions}</p><MathFormula latex={config.biasLatex} /></div>
        </div>
      </div>
      <div className="controls-grid">
        <EfficiencyControl {...{ efficiency, setEfficiency, regime }} onReset={reset} fixedLabel={config.fixedLabel} targetLabel={config.targetLabel} />
        <LengthSelector {...{ length, setLength }} label={config.lengthLabel} />
      </div>
      <p className="selection-assumptions">{config.assumptions} {config.limitations}</p>
      <div className="plots-full"><div className="plots-grid">
        {Object.entries(config.metrics).map(([metric, definition]) => <section className={`card plot-card plot-${metric}`} key={metric}>
          <div className="plot-header"><h2>{definition.title}</h2></div>
          <MathFormula className="selection-equation" latex={definition.latex} />
          {definition.chart === 'tradeoff'
            ? <div className="tradeoff-context">Comparação a gm = {definition.referenceGm} µS por transistor · η = gm/ID</div>
            : <div className="regime-labels"><span>FORTE</span><span>MODERADA</span><span>FRACA</span></div>}
          {definition.chart === 'tradeoff'
            ? <TradeoffChart {...{ efficiency, setEfficiency, length }} evaluate={config.evaluate} areaKey={definition.areaKey} areaLabel={definition.areaLabel} currentLabel={definition.currentLabel} referenceGm={definition.referenceGm} branchCount={definition.branchCount} />
            : <LabChart id={`${config.key}-${metric}`} config={definition} tall={definition.tall} evaluate={(eta, l) => config.evaluate(eta, l)[definition.key]} {...{ efficiency, setEfficiency, length }} />}
          <p className="headroom-definition">{config.descriptions[metric](point)}</p>
        </section>)}
        <section className="card operating-card summary-card">
          <div className="operating-top"><h2>Ponto selecionado</h2><span className="selected-length" style={{ color: COLORS[LENGTHS.indexOf(length)] }}>L = {fmt(length, 2)} µm</span></div>
          <div className={`metrics-grid ${[3, 6].includes(Object.keys(config.metrics).length) ? 'three' : ''}`}>
            {Object.entries(config.metrics).map(([key, metric]) => <Metric key={key} label={metric.summaryTitle || metric.title} symbol={metric.summarySymbol || ''} value={fmt(point[metric.key], 3)} unit={metric.unit} />)}
          </div>
        </section>
      </div></div>
      {config.block && <ExampleLinks block={config.block} />}
      <footer><span>Modelo didático · Não validado para fabricação</span></footer>
    </LabShell>
    {modal && <LabDialog onClose={() => setModal(null)} title={modal === 'guide' ? `Escolher gm/ID: ${config.title.toLowerCase()}` : 'Sobre as curvas'} icon={modal === 'guide' ? <BookOpen size={25} /> : <FlaskConical size={25} />} actionLabel="Entendido">
      <p>{config.purpose}</p>
      <p><strong>Condições fixas:</strong> {config.assumptions}</p>
      {Object.entries(config.metrics).map(([key, metric]) => <React.Fragment key={key}>
        <h3>{metric.title}</h3><MathFormula latex={metric.latex} /><p>{config.descriptions[key](point)}</p>
      </React.Fragment>)}
      <p className="modal-fine">{config.limitations} Curvas ilustrativas, não extraídas do PDK. Não são uma reprodução numérica dos exemplos de Jespers e Murmann. Sem corners, 1/f ou validação SPICE.</p>
    </LabDialog>}
  </>;
}
