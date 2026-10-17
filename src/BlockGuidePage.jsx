import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, RotateCcw, Calculator, BookOpen, X } from 'lucide-react';
import { COLORS, LENGTHS } from './model';
import { BLOCK_EXAMPLES, BOOK, mirrorLedger, activeLedger, diffLedger } from './blockExamples';
import MathFormula from './MathFormula';
import { LabChart, fmt } from './labUi';
import TransistorChecklist, { useGuideHeader } from './TransistorChecklist';
import { quantity, texNumber as n } from './guideMath';

// Rótulos didáticos: a mesma casca serve aos três blocos, mudando só o conteúdo.
function GuideChart({ id, title, unit, shared = false, latex, evaluate, efficiency, setEfficiency, length }) {
  return <div className="chart-block">
    <MathFormula className="chart-formula" latex={latex} />
    <LabChart id={id} config={{ title, unit, shared }} evaluate={evaluate} {...{ efficiency, setEfficiency, length }} />
  </div>;
}

function SpecGrid({ items }) {
  return <div className="spec-grid" aria-label="Condições do exemplo">{items.map(item => <div className="spec-card" key={item.label}><span>{item.label}</span><MathFormula latex={item.latex} /></div>)}</div>;
}

function Balls({ items }) {
  return <div className="dimension-balls" aria-live="polite">{items.map(item => <div className="dimension-ball" key={item.label}><span>{item.label}</span><MathFormula latex={item.latex} /></div>)}</div>;
}

function CalcGrid({ items }) {
  return <div className="calculation-grid" aria-live="polite">{items.map(item => <div className="calculation" key={item.label}><span>{item.label}</span><MathFormula latex={item.latex} /></div>)}</div>;
}

function VerifyCard({ pass, label, latex, note }) {
  return <div className={`spec-card verify-card ${pass ? 'is-pass' : 'is-fail'}`}><span className="verify-icon">{pass ? <Check size={12} /> : <X size={12} />}</span><span>{label}</span><MathFormula latex={latex} /><small>{note}</small></div>;
}

function PointControls({ example, efficiency, setEfficiency, length, setLength }) {
  return <div className="point-controls">
    <fieldset className="guide-lengths"><legend>Comprimento de canal</legend><div>{LENGTHS.map((value, i) => <button key={value} aria-pressed={length === value} className={length === value ? 'selected' : ''} style={{ '--curve-color': COLORS[i] }} onClick={() => setLength(value)}><MathFormula inline latex={quantity(value, String.raw`\mu\mathrm m`)} /></button>)}</div></fieldset>
    <div className="guide-control efficiency-slider"><div><label htmlFor="block-efficiency">Nível de inversão</label><output htmlFor="block-efficiency"><MathFormula inline latex={quantity(efficiency, String.raw`\mathrm{V^{-1}}`)} /></output></div><input id="block-efficiency" type="range" min="5" max="25" step=".1" value={efficiency} onChange={event => setEfficiency(Number(event.target.value))} /><div className="guide-range-ends"><span>{example.efficiencyEnds[0]}</span><span>{example.efficiencyEnds[1]}</span></div></div>
  </div>;
}

// A checklist só revela uma parcela depois que o projetista chega à etapa que a
// determina (ou faz a escolha no ponto). Nada aparece preenchido de antemão.
function Checklist({ example, point, efficiency, reveal }) {
  const footer = latex => <div className="checklist-gm"><MathFormula inline latex={latex} /></div>;
  const chosen = value => reveal.point ? value : null;
  const sized = value => reveal.size ? value : null;
  let heading, items, ledger;
  if (example.block === 'mirror') {
    heading = 'M₁ e M₂';
    items = [
      { key: 'length', symbol: 'L', label: 'Comprimento', value: chosen(point.length), unit: String.raw`\mu\mathrm m` },
      { key: 'efficiency', symbol: String.raw`\frac{g_m}{I_D}`, label: 'Eficiência', value: chosen(efficiency), unit: String.raw`\mathrm{V^{-1}}` },
      { key: 'current', symbol: 'I_{\rm ref}', label: 'Corrente copiada', value: chosen(point.current), unit: String.raw`\mu\mathrm A` },
      { key: 'width', symbol: 'W', label: 'Largura (cada)', value: sized(point.width), unit: String.raw`\mu\mathrm m` },
    ];
    ledger = footer(String.raw`2WL=${quantity(point.pairArea, String.raw`\mu\mathrm m^2`, 3)}`);
  } else if (example.block === 'active') {
    heading = 'Carga PMOS M_L';
    items = [
      { key: 'length', symbol: 'L_L', label: 'Comprimento da carga', value: chosen(point.length), unit: String.raw`\mu\mathrm m` },
      { key: 'efficiency', symbol: String.raw`\left(\frac{g_m}{I_D}\right)_L`, label: 'Eficiência da carga', value: chosen(efficiency), unit: String.raw`\mathrm{V^{-1}}` },
      { key: 'current', symbol: 'I_D', label: 'Corrente', value: chosen(point.current), unit: String.raw`\mu\mathrm A` },
      { key: 'width', symbol: 'W_L', label: 'Largura da carga', value: sized(point.loadWidth), unit: String.raw`\mu\mathrm m` },
      { key: 'gm', symbol: 'g_{m,L}', label: 'Transcondutância', value: chosen(point.loadGm), unit: String.raw`\mu\mathrm S` },
    ];
    ledger = footer(String.raw`A_{v0}=\frac{g_{m,1}}{g_{ds,1}+g_{ds,2}}`);
  } else {
    heading = 'Par de entrada M₁ e M₂';
    items = [
      { key: 'length', symbol: 'L', label: 'Comprimento', value: chosen(point.length), unit: String.raw`\mu\mathrm m` },
      { key: 'efficiency', symbol: String.raw`\left(\frac{g_m}{I_D}\right)_{in}`, label: 'Eficiência da entrada', value: chosen(efficiency), unit: String.raw`\mathrm{V^{-1}}` },
      { key: 'current', symbol: 'I_{D1,2}', label: 'Corrente por ramo', value: chosen(point.current), unit: String.raw`\mu\mathrm A` },
      { key: 'width', symbol: 'W', label: 'Largura (cada)', value: sized(point.input.width), unit: String.raw`\mu\mathrm m` },
    ];
    ledger = footer(String.raw`I_{\rm tail}=2I_{D1,2}=${quantity(example.tailCurrent, String.raw`\mu\mathrm A`, 0)}`);
  }
  const complete = items.every(item => item.value != null);
  return <TransistorChecklist heading={heading} items={items} footer={complete ? ledger : null} />;
}

// Conteúdo de cada etapa, por bloco. Mantido explícito para o texto didático.
function MirrorStep({ stage, example, point, efficiency }) {
  if (stage.key === 'requirements') return <><SpecGrid items={example.spec} /><div className="decision-rule"><strong>Regra de decisão</strong><p>{example.decision}</p></div></>;
  if (stage.key === 'geometry') return <>
    <div className="step-formula"><MathFormula latex={String.raw`W=\frac{I_{\rm ref}}{I_D/W},\qquad A=W\,L_{\rm cada}`} /></div>
    <Balls items={[
      { label: 'Densidade lida', latex: `I_D/W=${quantity(point.density, String.raw`\frac{\mu\mathrm A}{\mu\mathrm m}`, 3)}` },
      { label: 'Largura de cada', latex: `W=${quantity(point.width, String.raw`\mu\mathrm m`, 3)}` },
      { label: 'Área de cada', latex: `WL=${quantity(point.area, String.raw`\mu\mathrm m^2`, 3)}` },
      { label: 'Área do par', latex: `2WL=${quantity(point.pairArea, String.raw`\mu\mathrm m^2`, 3)}` },
    ]} />
    <p className="method-note">A corrente é fixa em 20 µA, então W vem só da densidade. Área maior reduz mismatch; nada aqui impõe um ponto ótimo.</p>
  </>;
  if (stage.key === 'mismatch') return <>
    <div className="step-formula"><MathFormula latex={String.raw`\sigma^2_{\Delta I/I}\approx\left[\left(\frac{g_m}{I_D}\right)\frac{A_{VT}}{\sqrt{WL}}\right]^2+\left[\frac{A_\beta}{\sqrt{WL}}\right]^2`} /></div>
    <CalcGrid items={[
      { label: 'Termo ΔV_T (1σ)', latex: `${n(point.sigmaVt * 100, 3)}\\%` },
      { label: 'Termo Δβ (1σ)', latex: `${n(point.sigmaBeta * 100, 3)}\\%` },
      { label: 'Total (1σ)', latex: `${n(point.sigmaTotal * 100, 3)}\\%` },
      { label: 'Meta', latex: String.raw`1\%` },
    ]} />
    <div className={`chart-status ${point.precise ? 'ok' : 'low'}`} aria-live="polite">{point.precise ? <Check size={14} /> : <X size={14} />}<span>Erro 1σ de {fmt(point.sigmaTotalPercent, 3)}% contra meta de 1%. {point.sigmaBeta > point.sigmaVt ? 'Nesta área pequena, o termo Δβ não é desprezível — ao contrário do Exemplo 4.7, que usa área maior.' : 'O termo ΔV_T domina, como no Exemplo 4.7.'}</span></div>
    <p className="method-note">A_VT = 0,5 mV·µm e A_β = 1%·µm são proxies didáticos do par. Não são dados do PDK e não substituem caracterização.</p>
  </>;
  if (stage.key === 'verify') return <>
    <div className="verify-grid" aria-live="polite">
      <VerifyCard pass={point.compliant} label="Compliance" latex={`V_{DS,\\min}=${n(point.vMinOut, 3)}\\,\\mathrm V`} note="saída ≥ 0,6 V" />
      <VerifyCard pass={point.precise} label="Mismatch 1σ" latex={`${n(point.sigmaTotalPercent, 3)}\\%`} note="meta ≤ 1%" />
      <VerifyCard pass={point.swing > .5} label="Faixa estimada" latex={`${n(point.swing, 3)}\\,\\mathrm V`} note="V_DD − V_DS,min" />
      <VerifyCard pass={point.area > 0} label="Área do par" latex={`${quantity(point.pairArea, String.raw`\mu\mathrm m^2`, 3)}`} note="só o gate de M1 e M2" />
    </div>
    <div className="design-ledger"><MathFormula latex={mirrorLedger(point, efficiency)} /></div>
    <p className="method-note">Modelo didático: mismatch de threshold e de fator de corrente, erro sistemático por V_DS excluído. Valide com SPICE e corners no PDK.</p>
  </>;
  return null;
}

function ActiveStep({ stage, example, point, efficiency }) {
  if (stage.key === 'requirements') return <><SpecGrid items={example.spec} /><div className="decision-rule"><strong>Regra de decisão</strong><p>{example.decision}</p></div></>;
  if (stage.key === 'gain') return <>
    <div className="step-formula"><MathFormula latex={String.raw`A_{v0}=\frac{g_{m,1}}{g_{ds,1}+g_{ds,2}}=\frac{g_m/I_D}{(g_{ds}/I_D)_1+(g_{ds}/I_D)_2}`} /></div>
    <CalcGrid items={[
      { label: 'Resistência de saída', latex: `r_{\\rm out}=${quantity(point.rout, String.raw`\mathrm{k\Omega}`, 1)}` },
      { label: 'Ganho do estágio', latex: `A_{v0}\\approx${n(point.gain, 2)}` },
      { label: 'CS com fonte ideal', latex: `\\frac{g_m}{g_{ds}}=${n(point.referenceGain, 1)}` },
      { label: 'Fração do ideal', latex: `${n(point.gainPercentOfIgs, 1)}\\%` },
    ]} />
    <div className={`chart-status ${point.gainPercentOfIgs > 50 ? 'ok' : 'low'}`} aria-live="polite"><span>A carga PMOS derruba o ganho para {fmt(point.gainPercentOfIgs, 1)}% do CS com fonte ideal — a perda esperada no Exemplo 3.8 é superior a 40%.</span></div>
  </>;
  if (stage.key === 'noise') return <>
    <div className="step-formula"><MathFormula latex={String.raw`e_{n,L}=\frac{\sqrt{4kT\gamma_p\,g_{m,L}}}{g_{m,1}},\qquad e_{n,\rm tot}=\sqrt{e_{n,1}^2+e_{n,L}^2}`} /></div>
    <CalcGrid items={[
      { label: 'Ruído do CS (referido à entrada)', latex: `${quantity(point.inputNoise, String.raw`\mathrm{nV}/\sqrt{\mathrm{Hz}}`, 3)}` },
      { label: 'Ruído da carga (referido)', latex: `${quantity(point.loadNoise, String.raw`\mathrm{nV}/\sqrt{\mathrm{Hz}}`, 3)}` },
      { label: 'Total (potências)', latex: `${quantity(point.totalNoise, String.raw`\mathrm{nV}/\sqrt{\mathrm{Hz}}`, 3)}` },
      { label: 'g_m da carga', latex: `${quantity(point.loadGm, String.raw`\mu\mathrm S`, 1)}` },
    ]} />
    <p className="method-note">Fontes independentes somam como potência. Com corrente fixa, o gm da carga cresce com seu gm/ID, embora o ruído referido à entrada dependa do gm da carga dividido por gm₁.</p>
  </>;
  if (stage.key === 'verify') return <>
    <div className="verify-grid" aria-live="polite">
      <VerifyCard pass={point.compliant} label="Faixa de saída" latex={`${n(point.vOutMin, 2)}\\!-\\!${n(point.vOutMax, 2)}\\,\\mathrm V`} note="compliance NMOS–PMOS" />
      <VerifyCard pass={point.swing > .4} label="Amplitude estimada" latex={`${n(point.swing, 3)}\\,\\mathrm V`} note="não é swing garantido" />
      <VerifyCard pass={point.ft > 1} label="fT da carga" latex={`${n(point.ft, 2)}\\,\\mathrm{GHz}`} note="dispositivo, não banda" />
      <VerifyCard pass={point.gainPercentOfIgs > 30} label="Fração do ganho ideal" latex={`${n(point.gainPercentOfIgs, 1)}\\%`} note="referência: > 50% desejável" />
    </div>
    <div className="design-ledger"><MathFormula latex={activeLedger(point, efficiency)} /></div>
    <p className="method-note">M_L é redimensionado a cada ponto, com V_bias reajustado; não é um sweep com gate fixo. PMOS usa proxies ilustrativos de NMOS.</p>
  </>;
  return null;
}

function DiffStep({ stage, example, point, efficiency }) {
  if (stage.key === 'requirements') return <><SpecGrid items={example.spec} /><div className="decision-rule"><strong>Regra de decisão</strong><p>{example.decision}</p></div></>;
  if (stage.key === 'geometry') return <>
    <div className="step-formula"><MathFormula latex={String.raw`W=\frac{I_{D1,2}}{I_D/W},\qquad A_{\rm par}=2WL`} /></div>
    <Balls items={[
      { label: 'Densidade lida', latex: `I_D/W=${quantity(point.input.density, String.raw`\frac{\mu\mathrm A}{\mu\mathrm m}`, 3)}` },
      { label: 'Largura de cada', latex: `W=${quantity(point.input.width, String.raw`\mu\mathrm m`, 3)}` },
      { label: 'Área do par', latex: `2WL=${quantity(point.pairArea, String.raw`\mu\mathrm m^2`, 3)}` },
      { label: 'Corrente de cauda', latex: `I_{\rm tail}=${quantity(point.tailCurrent, String.raw`\mu\mathrm A`, 0)}` },
    ]} />
    <p className="method-note">A corrente por ramo é fixa em 20 µA; mais gm/ID aumenta W e a área do par. Nada aqui impõe um ponto ótimo.</p>
  </>;
  if (stage.key === 'performance') return <>
    <div className="step-formula"><MathFormula latex={String.raw`\frac{\overline{v_{in,\mathrm{diff}}^2}}{\Delta f}=\frac{8kT\gamma_n}{g_{m1,2}},\qquad \sigma(V_{OS})=\frac{A_{VT}}{\sqrt{WL}}`} /></div>
    <CalcGrid items={[
      { label: 'Ganho intrínseco', latex: `A_i=${n(point.intrinsicGain, 1)}` },
      { label: 'Ruído diferencial', latex: `${n(point.noisePower, 3)}\\,\\mathrm{nV^2/Hz}` },
      { label: 'Offset 1σ', latex: `${quantity(point.offsetMv, String.raw`\mathrm{mV}`, 3)}` },
      { label: 'Amplitude linear (HD3)', latex: `${quantity(point.linearityMv, String.raw`\mathrm{mV}`, 3)}` },
    ]} />
    <p className="method-note">O ruído só inclui o canal do par de entrada, sem cargas nem cauda. O offset usa A_VT = 0,5 mV·µm do par. A amplitude linear vale para HD3 ≤ −60 dBc no proxy de terceira ordem.</p>
  </>;
  if (stage.key === 'verify') return <>
    <div className="verify-grid" aria-live="polite">
      <VerifyCard pass={Math.abs(point.tailCurrent - example.tailCurrent) < 1e-9} label="Corrente de cauda" latex={`${quantity(point.tailCurrent, String.raw`\mu\mathrm A`, 0)}`} note="fixa por desenho" />
      <VerifyCard pass={point.input.saturated} label="Saturação" latex={`V_{DS}=0{,}6\\,\\mathrm V`} note={`V_{DS,min}≈${n(point.input.headroom, 3)} V`} />
      <VerifyCard pass={point.ft > 1} label="fT da entrada" latex={`${n(point.ft, 2)}\\,\\mathrm{GHz}`} note="cada transistor, não o par" />
      <VerifyCard pass={point.offsetMv < 20} label="Offset 1σ" latex={`${quantity(point.offsetMv, String.raw`\mathrm{mV}`, 3)}`} note="só o par NMOS" />
    </div>
    <div className="design-ledger"><MathFormula latex={diffLedger(point, efficiency)} /></div>
    <p className="method-note">Cauda ideal para a linearidade; o offset cobre só o par NMOS. Valide com SPICE e corners no PDK.</p>
  </>;
  return null;
}

const BODY = { mirror: MirrorStep, active: ActiveStep, diff: DiffStep };

export default function BlockGuidePage({ example }) {
  const pageRef = useGuideHeader(), headingRef = useRef(null), pipelineRef = useRef(null);
  const [step, setStep] = useState(0), [reached, setReached] = useState(0);
  const [efficiency, setEfficiency] = useState(example.start.efficiency);
  const [length, setLength] = useState(example.start.length);
  // "chosen" vira true só quando o projetista mexe de fato no ponto (slider ou L)
  // ou quando avança além dele; até lá a checklist lateral fica vazia.
  const [chosen, setChosen] = useState(false);
  const point = example.evaluate(efficiency, length);
  const stage = example.steps[step];
  const Body = BODY[example.block];
  const pointIndex = example.steps.findIndex(item => item.key === 'point');
  const geometryIndex = example.steps.findIndex(item => item.key === 'geometry');
  const sizeIndex = geometryIndex >= 0 ? geometryIndex : pointIndex + 1;
  const reveal = { point: chosen || reached > pointIndex, size: reached >= sizeIndex };
  const pickEfficiency = value => { setChosen(true); setEfficiency(value); };
  const pickLength = value => { setChosen(true); setLength(value); };
  const charts = (...items) => items.map(item => <GuideChart key={item.id} {...item} id={`${example.slug}-${item.id}`} {...{ efficiency, setEfficiency: pickEfficiency, length }} />);
  useEffect(() => { document.title = `${example.title} · gm/ID lab`; }, [example.title]);
  useEffect(() => {
    const pipeline = pipelineRef.current, active = pipeline?.querySelector('[aria-current="step"]');
    if (pipeline && active) pipeline.scrollTo({ left: pipeline.scrollLeft + active.getBoundingClientRect().left - pipeline.getBoundingClientRect().left - (pipeline.clientWidth - active.clientWidth) / 2 });
  }, [step]);
  function changeStep(next) {
    setStep(next);
    requestAnimationFrame(() => {
      const page = pageRef.current, header = page?.querySelector('.guide-header');
      if (!headingRef.current || !header) return;
      headingRef.current.focus({ preventScroll: true });
      const card = headingRef.current.closest('.step-card');
      if (card) window.scrollTo({ top: Math.max(0, window.scrollY + card.getBoundingClientRect().top - header.getBoundingClientRect().height - 18) });
    });
  }
  function reset() { setStep(0); setReached(0); setChosen(false); setEfficiency(example.start.efficiency); setLength(example.start.length); window.scrollTo(0, 0); }
  return <div className="guide-page" ref={pageRef}>
    <header className="guide-header">
      <div className="guide-topbar"><a href={example.labRoute} className="back-lab"><ArrowLeft size={16} /> {example.labLabel}</a><span className="guide-brand">gₘ/Iᴅ <span>lab</span></span><span className="guide-counter">EXEMPLO {example.number} · BLOCO {example.block === 'mirror' ? 'CM' : example.block === 'active' ? 'AL' : 'DP'}</span></div>
      <nav className="pipeline" aria-label="Fluxo do exemplo" ref={pipelineRef}>{example.steps.map((item, i) => <React.Fragment key={item.key}><button disabled={i > reached} onClick={() => changeStep(i)} aria-current={i === step ? 'step' : undefined} className={`${i === step ? 'active' : ''} ${i < step ? 'visited' : ''}`}><span className="pipeline-number">{i < step ? <Check size={13} /> : i + 1}</span>{item.label}</button>{i < example.steps.length - 1 && <ChevronRight size={15} aria-hidden="true" />}</React.Fragment>)}</nav>
    </header>
    <main className="guide-main">
      <section className="guide-intro"><div><span className="section-kicker">{example.tag}</span><h1>{example.title}</h1><p>{example.application}</p></div><button className="secondary-button" onClick={reset}><RotateCcw size={14} /> Recomeçar</button></section>
      <div className="guide-model-note">Adaptado de {example.reference} · Modelo ilustrativo, não extraído do PDK</div>
      <div className="requirement-strip">{example.spec.map(item => <span key={item.label}><MathFormula inline latex={item.latex} /></span>)}</div>
      <div className="guide-workspace methodology-workspace">
        <section className="card step-card">
          <div className="step-kicker"><span>ETAPA {step + 1} DE {example.steps.length}</span><Calculator size={16} /></div>
          <h2 tabIndex={-1} ref={headingRef}>{stage.title}</h2>
          <p className="step-description">{stage.text}</p>
          {stage.key === 'point' && <PointControls {...{ example, efficiency, setEfficiency: pickEfficiency, length, setLength: pickLength }} />}
          {stage.key === 'point' && example.block === 'mirror' && charts(
            { id: 'compliance', title: 'Tensão de compliance mínima', unit: 'V', shared: true, latex: String.raw`V_{DS,\min}\colon I_D/I_F=99\%`, evaluate: (e, l) => example.evaluate(e, l).vMinOut },
            { id: 'error', title: 'Mismatch a área fixa', unit: '%', shared: true, latex: String.raw`\sigma_{\Delta I/I}=\frac{g_m}{I_D}\frac{A_{VT}}{\sqrt{A_{\rm ref}}},\ A_{\rm ref}=1\,\mu\mathrm m^2`, evaluate: (e, l) => example.evaluate(e, l).referenceMismatchPercent },
          )}
          {stage.key === 'point' && example.block === 'active' && charts(
            { id: 'headroom', title: 'Headroom da carga', unit: 'V', shared: true, latex: String.raw`V_{SD,\min,L}\quad(I_D/I_F=99\%)`, evaluate: (e, l) => example.evaluate(e, l).loadHeadroom },
            { id: 'noise', title: 'Ruído adicional da carga', unit: 'nV/√Hz', shared: true, latex: String.raw`e_{n,L}=\frac{\sqrt{4kT\gamma_p g_{m,L}}}{g_{m,1}}`, evaluate: (e, l) => example.evaluate(e, l).loadNoise },
            { id: 'ft', title: 'fT da carga', unit: 'GHz', latex: String.raw`f_{T,L}=\frac{g_{m,L}}{2\pi C_{gg,L}}`, evaluate: (e, l) => example.evaluate(e, l).ft },
          )}
          {stage.key === 'point' && example.block === 'diff' && charts(
            { id: 'gain', title: 'Ganho intrínseco', unit: 'V/V', latex: String.raw`A_i=\frac{g_{m,1}}{g_{ds,1}}`, evaluate: (e, l) => example.evaluate(e, l).intrinsicGain },
            { id: 'noise', title: 'Ruído diferencial referido à entrada', unit: 'nV²/Hz', shared: true, latex: String.raw`\frac{\overline{v_{in,\mathrm{diff}}^2}}{\Delta f}=\frac{8kT\gamma_n}{g_{m1,2}}`, evaluate: (e, l) => example.evaluate(e, l).noisePower },
            { id: 'linearity', title: 'Linearidade · HD3 ≤ −60 dBc', unit: 'mV pico', shared: true, latex: String.raw`\hat v_{id,\max}\approx\sqrt{\frac{4\cdot10^{-3}}{|a_3/g_m|}}`, evaluate: (e, l) => example.evaluate(e, l).linearityMv },
            { id: 'mismatch', title: 'Mismatch de entrada', unit: 'mV', latex: String.raw`\sigma(V_{OS})=\frac{A_{VT}}{\sqrt{WL}}`, evaluate: (e, l) => example.evaluate(e, l).offsetMv },
          )}
          <Body {...{ stage, example, point, efficiency }} />
          <div className="step-navigation"><button className="secondary-button" disabled={step === 0} onClick={() => changeStep(step - 1)}><ArrowLeft size={14} /> Anterior</button><span>{step + 1} / {example.steps.length}</span>{step < example.steps.length - 1 ? <button className="primary-button" onClick={() => { setReached(value => Math.max(value, step + 1)); changeStep(step + 1); }}>Continuar <ArrowRight size={14} /></button> : <a className="primary-button" href={example.labRoute}>Voltar ao laboratório <ArrowRight size={14} /></a>}</div>
        </section>
        <aside className="guide-live"><Checklist {...{ example, point, efficiency, reveal }} /></aside>
      </div>
      <details className="guide-assumptions"><summary>Hipóteses e referência do método</summary><p>Roteiro adaptado de <strong>{example.reference}</strong>. Densidade, capacitâncias e proxies de saturação são analíticos e ilustrativos; nenhuma curva foi extraída do PDK IHP SG13G2.</p><a className="method-reference" href={BOOK.url} target="_blank" rel="noreferrer"><BookOpen size={13} /> {BOOK.title}</a><p>A melhor validação é SPICE com corners e a caracterização real dos dispositivos.</p></details>
      <nav className="other-examples" aria-label="Outros exemplos">{BLOCK_EXAMPLES.filter(item => item.slug !== example.slug).map(item => <a key={item.slug} href={`#/exemplos/${item.slug}`}><span>{item.number}</span>{item.title}<ArrowRight size={14} /></a>)}<a href="#/exemplos/fluxo-basico"><span>01</span>Fluxo básico do fonte comum<ArrowRight size={14} /></a></nav>
    </main>
  </div>;
}
