import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, RotateCcw, Calculator, X } from 'lucide-react';
import { COLORS, LENGTHS } from './model';
import { EXAMPLES, REFERENCES } from './methodology';
import { evaluatePoint, gmRequirements, suggestedPoint } from './basicSizing';
import MathFormula from './MathFormula';
import { quantity, texNumber as n, texFrequency } from './guideMath';
import { DensityChart, GainChart, FtChart } from './guideCharts';
import TransistorChecklist, { useGuideHeader } from './TransistorChecklist';

export default function BasicGuidePage({ example }) {
  const pageRef = useGuideHeader(), headingRef = useRef(null), pipelineRef = useRef(null);
  const suggestion = suggestedPoint(example);
  const [step, setStep] = useState(0), [reached, setReached] = useState(0);
  const [length, setLength] = useState(suggestion.length), [efficiency, setEfficiency] = useState(suggestion.efficiency);
  const chosen = evaluatePoint(example, length, efficiency);
  const requirements = gmRequirements(example);
  const stage = example.steps[step];
  const gainOk = chosen.meetsGain, ftOk = chosen.meetsSpeed;
  const bwOk = chosen.bandwidth >= example.bandwidth, satOk = chosen.point.saturated;
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
      const checklist = window.matchMedia('(max-width: 800px)').matches ? (page.querySelector('.guide-live')?.getBoundingClientRect().height ?? 0) + 12 : 0;
      if (card) window.scrollTo({ top: Math.max(0, window.scrollY + card.getBoundingClientRect().top - header.getBoundingClientRect().height - checklist - 18) });
    });
  }
  function choose(key, value) {
    if ((key === 'length' ? length : efficiency) === value) return;
    if (key === 'length') setLength(value); else setEfficiency(value);
  }
  function useSuggestion() {
    setLength(suggestion.length); setEfficiency(suggestion.efficiency);
  }
  function reset() {
    setStep(0); setReached(0);
    setLength(suggestion.length); setEfficiency(suggestion.efficiency); window.scrollTo(0, 0);
  }
  const currentFormula = String.raw`I_D=\frac{g_m}{g_m/I_D}=\frac{${n(requirements.gm, 3)}}{${n(efficiency)}}=${quantity(chosen.current, String.raw`\mu\mathrm A`, 2)}`;
  const widthFormula = String.raw`W=\frac{I_D}{J_D}=\frac{${n(chosen.current, 3)}}{${n(chosen.normalized.density, 5)}}\approx${quantity(chosen.width, String.raw`\mu\mathrm m`, 3)}`;
  return <div className="guide-page" ref={pageRef}>
    <header className="guide-header"><div className="guide-topbar"><a href="#/" className="back-lab"><ArrowLeft size={16} /> Laboratório CS</a><span className="guide-brand">gₘ/Iᴅ <span>lab</span></span><span className="guide-counter">EXEMPLO 01 / 04</span></div>
      <nav className="pipeline" aria-label="Fluxo do dimensionamento" ref={pipelineRef}>{example.steps.map((item, i) => <React.Fragment key={item.key}><button disabled={i > reached} onClick={() => changeStep(i)} aria-current={i === step ? 'step' : undefined} className={`${i === step ? 'active' : ''} ${i < step ? 'visited' : ''}`}><span className="pipeline-number">{i < step ? <Check size={13} /> : i + 1}</span>{item.key === 'dimensions' ? <MathFormula inline latex={String.raw`I_D,\ W`} /> : item.label}</button>{i < example.steps.length - 1 && <ChevronRight size={15} />}</React.Fragment>)}</nav></header>
    <main className="guide-main"><section className="guide-intro"><div><span className="section-kicker">FLUXO BÁSICO · MURMANN</span><h1>{example.title}</h1><p>{example.application}</p></div><button className="secondary-button" onClick={reset}><RotateCcw size={14} /> Recomeçar</button></section><div className="guide-model-note">Modelo ilustrativo · Não caracterizado com o PDK</div>
      <div className="guide-workspace methodology-workspace"><section className="card step-card"><div className="step-kicker"><span>ETAPA {step + 1} DE 6</span><Calculator size={16} /></div><h2 tabIndex={-1} ref={headingRef}>{stage.title}</h2><p className="step-description">{stage.text}</p>
        {stage.key === 'requirements' && <><div className="spec-grid" aria-label="Especificações do amplificador"><div className="spec-card"><span>Ganho</span><MathFormula latex={String.raw`A_0\ge 50`} /><small>20 mV → 1 V</small></div><div className="spec-card"><span>Banda −3 dB</span><MathFormula latex={String.raw`f_{-3\mathrm{dB}}\ge 1\,\mathrm{MHz}`} /><small>ponto de −3 dB</small></div><div className="spec-card"><span>Carga</span><MathFormula latex={String.raw`C_L=2\,\mathrm{pF}`} /><small>fotodiodo + roteamento + comparador</small></div></div><p className="method-note">O sinal de 20 mV do fotodiodo precisa virar 1 V na saída: é daí que vem o ganho mínimo.</p></>}
        {stage.key === 'gm' && <><div className="step-formula"><MathFormula latex={String.raw`\begin{aligned}f_{-3\mathrm{dB}}&=\frac{g_m}{2\pi A_0 C_L}\\[6pt]g_m&\ge 2\pi A_0\,\kappa_b f_{-3\mathrm{dB}}C_L,\qquad \kappa_b=1{,}2\end{aligned}`} /></div><MathFormula className="guide-formula" latex={String.raw`=2\pi\cdot 50\cdot 1{,}2\cdot10^{6}\cdot 2\cdot10^{-12}`} /><div className="dimension-balls" aria-live="polite"><div className="dimension-ball"><span>Transcondutância exigida</span><MathFormula latex={String.raw`g_m\approx${quantity(requirements.gm, String.raw`\mu\mathrm S`)}`} /></div></div><p className="method-note">A margem κ_b = 1,2 é uma decisão de projeto, não parte da especificação: sem ela, o produto ganho-banda fica exatamente no limite e qualquer parasita estoura a banda.</p></>}
        {stage.key === 'point' && <>
          <div className="point-controls">
            <fieldset className="guide-lengths"><legend>Comprimento de canal</legend><div>{LENGTHS.map((value, i) => <button key={value} aria-pressed={length === value} className={length === value ? 'selected' : ''} style={{ '--curve-color': COLORS[i] }} onClick={() => choose('length', value)}><MathFormula inline latex={quantity(value, String.raw`\mu\mathrm m`)} /></button>)}</div></fieldset>
            <div className="guide-control efficiency-slider"><div><label htmlFor="basic-efficiency">Nível de inversão</label><output htmlFor="basic-efficiency"><MathFormula inline latex={quantity(efficiency, String.raw`\mathrm{V^{-1}}`)} /></output></div><input id="basic-efficiency" type="range" min="5" max="25" step=".5" value={efficiency} onChange={event => choose('efficiency', Number(event.target.value))} /><div className="guide-range-ends"><span>5 V⁻¹ · mais corrente</span><span>25 V⁻¹ · mais ganho</span></div><div className="slider-preview"><MathFormula inline latex={String.raw`I_D=\frac{${n(requirements.gm, 1)}}{${n(efficiency)}}\approx ${n(chosen.current, 1)}\,\mu\mathrm{A}`} /></div></div>
          </div>
          <div className="chart-block">
            <MathFormula className="chart-formula" latex={String.raw`A_i=\frac{g_m}{g_{ds}}=\left(\frac{g_m}{I_D}\right)V_A`} />
            <GainChart {...{ example, length, efficiency }} />
            <div className={`chart-status ${gainOk ? 'ok' : 'low'}`} aria-live="polite">{gainOk ? <Check size={14} /> : <X size={14} />}<MathFormula inline latex={String.raw`A_i\approx ${n(chosen.intrinsicGain, 1)}\,\mathrm{V/V}\ge 50`} /></div>
          </div>
          <div className="chart-block">
            <MathFormula className="chart-formula" latex={String.raw`f_T=\frac{g_m}{2\pi C_{gg}}`} />
            <FtChart {...{ example, length, efficiency }} />
            <div className={`chart-status ${ftOk ? 'ok' : 'low'}`} aria-live="polite">{ftOk ? <Check size={14} /> : <X size={14} />}<MathFormula inline latex={String.raw`f_T\approx ${n(chosen.ftHz / 1e9, 2)}\,\mathrm{GHz}\ge 12\,\mathrm{MHz}`} /></div>
          </div>
          <p className="selection-reason">Ponto de partida sugerido: L = 0,13 µm e gm/ID = 10 V⁻¹ — ganho dentro da janela (54,7 entre 50 e 60), fT folgada e área compacta. Qualquer outro ponto pode ser registrado.</p><button className="text-action" onClick={useSuggestion}>Usar ponto de partida sugerido</button>
        </>}
        {stage.key === 'density' && <><div className="step-formula"><MathFormula latex={String.raw`J_D=\left.\frac{I_D}{W}\right|_{L,\,g_m/I_D}\qquad W=\frac{I_D}{J_D}`} /></div><DensityChart {...{ example, length, efficiency }} /><div className="dimension-balls" aria-live="polite"><div className="dimension-ball"><span>Densidade lida</span><MathFormula latex={String.raw`J_D\approx ${quantity(chosen.normalized.density, String.raw`\frac{\mu\mathrm A}{\mu\mathrm m}`, 4)}`} /></div></div></>}
        {stage.key === 'dimensions' && <><div className="step-formula"><MathFormula latex={String.raw`I_D=\frac{g_m^{\mathrm{des}}}{g_m/I_D}\qquad W=\frac{I_D}{J_D}`} /></div><div className="dimension-balls" aria-live="polite"><div className="dimension-ball"><span>Corrente</span><MathFormula latex={String.raw`I_D\approx${quantity(chosen.current, String.raw`\mu\mathrm A`, 2)}`} /></div><div className="dimension-ball"><span>Largura</span><MathFormula latex={String.raw`W\approx${quantity(chosen.width, String.raw`\mu\mathrm m`, 2)}`} /></div></div><MathFormula className="guide-formula" latex={currentFormula} /><MathFormula className="guide-formula" latex={widthFormula} /><MathFormula className="guide-formula" latex={String.raw`P_{DC}=V_{DD}I_D\approx${quantity(chosen.current * 1.2, String.raw`\mu\mathrm W`, 1)}\qquad A_{\mathrm{gate}}=WL\approx${quantity(chosen.area, String.raw`\mu\mathrm m^2`, 2)}`} /></>}
        {stage.key === 'verify' && <>
          <div className="verify-grid" aria-live="polite">
            <div className={`spec-card verify-card ${gainOk ? 'is-pass' : 'is-fail'}`}><span className="verify-icon">{gainOk ? <Check size={12} /> : <X size={12} />}</span><span>Ganho</span><MathFormula latex={String.raw`A_i\approx ${n(chosen.intrinsicGain, 1)}\,\mathrm{V/V}`} /><small>exigido ≥ 50</small></div>
            <div className={`spec-card verify-card ${bwOk ? 'is-pass' : 'is-fail'}`}><span className="verify-icon">{bwOk ? <Check size={12} /> : <X size={12} />}</span><span>Banda −3 dB</span><MathFormula latex={String.raw`f\approx${texFrequency(chosen.bandwidth)}`} /><small>mínimo 1 MHz</small></div>
            <div className={`spec-card verify-card ${ftOk ? 'is-pass' : 'is-fail'}`}><span className="verify-icon">{ftOk ? <Check size={12} /> : <X size={12} />}</span><span>Velocidade</span><MathFormula latex={String.raw`f_T\approx ${n(chosen.ftHz / 1e9, 2)}\,\mathrm{GHz}`} /><small>diretriz ≥ 12 MHz</small></div>
            <div className={`spec-card verify-card ${satOk ? 'is-pass' : 'is-fail'}`}><span className="verify-icon">{satOk ? <Check size={12} /> : <X size={12} />}</span><span>Saturação</span><MathFormula latex={String.raw`0{,}6\ge ${n(chosen.point.headroom, 3)}\,\mathrm{V}`} /><small>VDS aproximada</small></div>
          </div>
          <div className="step-formula"><MathFormula latex={String.raw`\begin{aligned}g_m&=\left(\frac{g_m}{I_D}\right)I_D=${n(efficiency)}\cdot ${n(chosen.current, 2)}\approx ${quantity(chosen.point.gm, String.raw`\mu\mathrm S`)}\\W\,J_D&\approx ${n(chosen.width, 2)}\cdot ${n(chosen.normalized.density, 4)}\approx ${quantity(chosen.current, String.raw`\mu\mathrm A`, 2)}\\f_{-3\mathrm{dB}}&=\frac{g_m}{2\pi A_i(C_L+C_{\mathrm{out}})}\approx${texFrequency(chosen.bandwidth)}\end{aligned}`} /></div>
          <div className="design-ledger"><MathFormula latex={String.raw`\begin{aligned}L&=${quantity(chosen.length, String.raw`\mu\mathrm m`)}\\\frac{g_m}{I_D}&=${quantity(chosen.efficiency, String.raw`\mathrm{V^{-1}}`)}\\I_D&=${quantity(chosen.current, String.raw`\mu\mathrm A`, 2)}\\W&\approx${quantity(chosen.width, String.raw`\mu\mathrm m`, 2)}\end{aligned}`} /></div>
          <p className="method-note">Modelo didático: carga de corrente ideal, um polo, capacitâncias proxy. Valide com SPICE e corners no PDK.</p>
        </>}
        <div className="step-navigation"><button className="secondary-button" disabled={step === 0} onClick={() => changeStep(step - 1)}><ArrowLeft size={14} /> Anterior</button><span>{step + 1} / 6</span>{step < 5 ? <button className="primary-button" onClick={() => { setReached(value => Math.max(value, step + 1)); changeStep(step + 1); }}>Continuar <ArrowRight size={14} /></button> : <a className="primary-button" href="#/">Voltar ao laboratório <ArrowRight size={14} /></a>}</div>
      </section><aside className="guide-live"><TransistorChecklist length={reached >= 2 ? chosen.length : null} efficiency={reached >= 2 ? chosen.efficiency : null} current={reached >= 4 ? chosen.current : null} width={reached >= 4 ? chosen.width : null} gm={reached >= 1 ? requirements.gm : null} /></aside></div>
      <details className="guide-assumptions"><summary>Hipóteses e referência do método</summary><p>Adaptação do fluxo básico de Jespers/Murmann: especificação → gₘ → escolha de L e gm/ID → leitura de ID/W → Iᴅ e W → verificação. Dados ilustrativos, não caracterização IHP.</p><MathFormula latex={String.raw`\begin{aligned}I_D&=\frac{g_m}{g_m/I_D},\qquad W=\frac{I_D}{J_D},\qquad J_D=\frac{I_D}{W}\\A_i&=\frac{g_m}{g_{ds}}=\left(\frac{g_m}{I_D}\right)V_A,\qquad f_{-3\mathrm{dB}}=\frac{g_m}{2\pi A_i(C_L+C_{\mathrm{out}})}\end{aligned}`} /><p>A carga de corrente é ideal, então o ganho em baixa frequência é o ganho intrínseco. A polarização de dreno é assumida; sem polo de entrada nem Miller completo.</p>{REFERENCES.slice(0, 2).map(reference => <div className="method-reference" key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.title}</a></div>)}</details><nav className="other-examples" aria-label="Outros exemplos">{EXAMPLES.slice(1).map(item => <span className="other-disabled" key={item.slug} aria-disabled="true" title="Exemplo temporariamente desabilitado"><span>{item.number}</span>{item.title}</span>)}</nav>
    </main>
  </div>;
}
