import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, RotateCcw } from 'lucide-react';
import { COLORS, LENGTHS } from './model';
import { BOOK, guideChecklist, guideContent } from './blockExamples';
import MathFormula from './MathFormula';
import { LabChart } from './labUi';
import TransistorChecklist, { useGuideHeader } from './TransistorChecklist';
import { quantity } from './guideMath';

export default function BlockGuidePage({ example }) {
  const pageRef = useGuideHeader(), headingRef = useRef(null), pipelineRef = useRef(null);
  const [step, setStep] = useState(0), [completed, setCompleted] = useState(0);
  const [efficiency, setEfficiency] = useState(example.start.efficiency);
  const [length, setLength] = useState(example.start.length);
  const point = example.evaluate(efficiency, length);
  const stage = example.steps[step];
  const content = guideContent(example, point, efficiency, stage.key);
  const items = guideChecklist(example, point, efficiency, completed);
  useEffect(() => { document.title = `${example.title} · gm/ID lab`; }, [example.title]);
  useEffect(() => {
    const pipeline = pipelineRef.current, active = pipeline?.querySelector('[aria-current="step"]');
    if (pipeline && active) pipeline.scrollTo({ left: pipeline.scrollLeft + active.getBoundingClientRect().left - pipeline.getBoundingClientRect().left - (pipeline.clientWidth - active.clientWidth) / 2 });
  }, [step]);
  function changeStep(next) {
    setStep(next);
    requestAnimationFrame(() => {
      const page = pageRef.current, header = page?.querySelector('.guide-header');
      const card = headingRef.current?.closest('.step-card');
      headingRef.current?.focus({ preventScroll: true });
      const checklist = window.matchMedia('(max-width: 800px)').matches ? (page?.querySelector('.guide-live')?.getBoundingClientRect().height ?? 0) + 12 : 0;
      if (card && header) window.scrollTo({ top: Math.max(0, window.scrollY + card.getBoundingClientRect().top - header.getBoundingClientRect().height - checklist - 18) });
    });
  }
  function pick(setter, value) {
    setter(value);
    // Editing a confirmed point invalidates the geometry and all later results.
    setCompleted(value => Math.min(value, 1));
  }
  function reset() {
    setStep(0); setCompleted(0); setEfficiency(example.start.efficiency); setLength(example.start.length); window.scrollTo(0, 0);
  }
  const chart = example.block === 'mirror'
    ? { title: 'Erro de cópia · área dimensionada', unit: '% · 1σ', key: 'sigmaTotalPercent' }
    : { title: 'Ganho do estágio · primeira ordem', unit: 'V/V', key: 'gain' };
  const action = ['Confirmar requisito', 'Confirmar ponto', 'Registrar dimensões', 'Conferir projeto'][step];
  return <div className="guide-page block-guide" ref={pageRef}>
    <header className="guide-header">
      <div className="guide-topbar"><a href={example.labRoute} className="back-lab"><ArrowLeft size={16} />{example.labLabel}</a><span className="guide-brand">gₘ/Iᴅ <span>lab</span></span><span className="guide-counter">EXEMPLO {example.number}</span></div>
      <nav className="pipeline" aria-label="Fluxo do exemplo" ref={pipelineRef}>{example.steps.map((item, i) => <React.Fragment key={item.key}><button disabled={i > completed} onClick={() => changeStep(i)} aria-current={i === step ? 'step' : undefined} className={`${i === step ? 'active' : ''} ${i < completed ? 'visited' : ''}`}><span className="pipeline-number">{i < completed ? <Check size={13} /> : i + 1}</span>{item.label}</button>{i < 4 && <ChevronRight size={15} aria-hidden="true" />}</React.Fragment>)}</nav>
    </header>
    <main className="guide-main">
      <section className="guide-intro"><div><span className="section-kicker">{example.tag}</span><h1>{example.title}</h1><p>{example.application}</p></div><button className="secondary-button" onClick={reset}><RotateCcw size={14} />Recomeçar</button></section>
      <div className="guide-model-note">Jespers &amp; Murmann · {example.reference} · Adaptação com dados ilustrativos, não PDK.</div>
      <div className="guide-workspace methodology-workspace">
        <section className="card step-card">
          <div className="step-kicker"><span>ETAPA {step + 1} DE 5</span></div>
          <h2 tabIndex={-1} ref={headingRef}>{stage.title}</h2><p className="step-description">{stage.text}</p>
          {step === 0 && <div className="spec-grid">{example.spec.map(item => <div className="spec-card" key={item.label}><span>{item.label}</span><MathFormula latex={item.latex} /></div>)}</div>}
          {step === 1 && <>
            <div className="point-controls">
              <fieldset className="guide-lengths"><legend>Comprimento {example.block === 'active' ? 'da carga PMOS' : example.block === 'diff' ? 'do par de entrada' : 'do espelho'}</legend><div>{LENGTHS.map((value, i) => <button key={value} aria-pressed={length === value} className={length === value ? 'selected' : ''} style={{ '--curve-color': COLORS[i] }} onClick={() => pick(setLength, value)}><MathFormula inline latex={quantity(value, String.raw`\mu\mathrm m`)} /></button>)}</div></fieldset>
              <div className="guide-control efficiency-slider"><div><label htmlFor="block-efficiency"><MathFormula inline latex={String.raw`g_m/I_D`} /></label><output htmlFor="block-efficiency"><MathFormula inline latex={quantity(efficiency, String.raw`\mathrm{V^{-1}}`)} /></output></div><input id="block-efficiency" type="range" min="5" max="25" step=".1" value={efficiency} onChange={event => pick(setEfficiency, Number(event.target.value))} /><div className="guide-range-ends"><span>{example.efficiencyEnds[0]}</span><span>{example.efficiencyEnds[1]}</span></div></div>
            </div>
            <div className="chart-block"><LabChart id={example.slug} config={chart} evaluate={(eta, l) => example.evaluate(eta, l)[chart.key]} efficiency={efficiency} setEfficiency={value => pick(setEfficiency, value)} length={length} /></div>
          </>}
          <div className="step-formula"><MathFormula latex={content.formula} /></div>
          {content.results.length > 0 && <div className="calculation-grid" aria-live="polite">{content.results.map(item => <div className="calculation" key={item.label}><span>{item.label}</span><MathFormula latex={item.latex} /></div>)}</div>}
          <p className="method-note">{content.note}</p>
          {step === 4 && <><div className="design-ledger"><MathFormula latex={example.ledger(point, efficiency)} /></div><div className="decision-rule"><strong>O que falta validar</strong><p>{example.validation}</p></div></>}
          <div className="step-navigation"><button className="secondary-button" disabled={step === 0} onClick={() => changeStep(step - 1)}><ArrowLeft size={14} />Anterior</button><span>{step + 1} / 5</span>{step < 4 ? <button className="primary-button" onClick={() => { setCompleted(value => Math.max(value, step + 1)); changeStep(step + 1); }}>{action}<ArrowRight size={14} /></button> : <a className="primary-button" href={example.labRoute}>Voltar ao bloco<ArrowRight size={14} /></a>}</div>
        </section>
        <aside className="guide-live"><TransistorChecklist heading={example.block === 'active' ? 'Carga PMOS' : example.block === 'diff' ? 'Cada transistor de entrada' : 'Cada transistor do espelho'} items={items} /><p className="method-note checklist-note">A checklist registra etapas confirmadas, não os valores sugeridos. Rever o ponto invalida as dimensões.</p></aside>
      </div>
      <details className="guide-assumptions"><summary>Relação com o livro e limites da adaptação</summary><p>{example.adaptation}</p><p>{example.limitations}</p><a className="method-reference" href={BOOK.url} target="_blank" rel="noreferrer">{BOOK.title} · {example.reference}</a></details>
    </main>
  </div>;
}
