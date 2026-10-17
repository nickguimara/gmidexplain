import React, { useState } from 'react';
import { BookOpen, Download, FlaskConical, Info } from 'lucide-react';
import LabShell from './LabShell';
import { EfficiencyControl, LabChart, LabDialog, LengthSelector, Metric, fmt } from './labUi';
import { COLORS, LENGTHS } from './model';
import { DIFF, DIFF_METRICS, differentialPoint } from './differentialModel';

const evaluate = (efficiency, length) => differentialPoint(efficiency, length);

// Par diferencial NMOS convencional com carga em espelho PMOS e fonte de cauda.
// M1/M2 são o par; M3 (sobre M2) é diodo-conectado; M4 espelha M3 sobre M1;
// M5 define a corrente de cauda. Não há fonte de bias extra no ramo PMOS.
const DPM = { input: { top: 140, bottom: 180 }, load: { top: 56, bottom: 88 }, tail: { top: 232, bottom: 268 } };
const DX = { m1: 112, m4: 112, tail: 162, m2: 212, m3: 212 };
const GATE_DX = 27;
const center = s => (s.top + s.bottom) / 2;

function DiffSchematic({ current, efficiency }) {
  const ground = (x, y) => <path d={`M${x} ${y}v7m-12 0h24m-8 5h16m-4 5h8`} />;
  const mos = (x, span, { pmos = false, gateSide = -1 } = {}) => <>
    <path d={`M${x} ${span.top}v${span.bottom - span.top}`} />
    <path d={`M${x} ${center(span) - 9}v18m-5-6 5 6 5-6`} />
    <path d={`M${x + gateSide * GATE_DX} ${center(span) - 16}v32`} />
    {pmos
      ? <path d={`M${x} ${span.top}v-20`} />
      : <path d={`M${x} ${span.bottom}h-12v18h12v14`} />}
  </>;
  const gateMirrorY = center(DPM.load); // y=72: shared PMOS-gate / M3-diode node
  const outputY = 112;
  const commonSourceY = DPM.input.bottom + 32;
  const tailGateY = center(DPM.tail);
  return <svg className="schematic" viewBox="0 0 300 314" role="img" aria-label="Par diferencial NMOS M1/M2 com carga em espelho PMOS M3/M4 e fonte de cauda M5. M3, sobre M2, é diodo-conectado: seu dreno liga ao próprio gate e ao gate de M4. M4 e M1 compartilham a saída v_out. M5 é a cauda, polarizada por V_bias.">
    <g fill="none" stroke="#42536b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* rail V_DD e fontes dos PMOS */}
      <path d={`M86 26h152M${DX.m4} 26v10M${DX.m3} 26v10`} />
      {mos(DX.m4, DPM.load, { pmos: true, gateSide: 1 })}
      {mos(DX.m3, DPM.load, { pmos: true, gateSide: -1 })}
      {/* M4 dreno -> saída; M3 dreno -> M2 dreno e nó de gate comum */}
      <path d={`M${DX.m4} ${DPM.load.bottom}v${outputY - DPM.load.bottom}`} />
      <path d={`M${DX.m3} ${DPM.load.bottom}V${gateMirrorY}h-${GATE_DX}M${DX.m3} ${gateMirrorY}V${DPM.input.top}`} />
      <path d={`M${DX.m4 + GATE_DX} ${gateMirrorY}H${DX.m3}`} />
      <circle cx={DX.m3} cy={gateMirrorY} r="3" fill="#42536b" />
      {/* junção M3 drain/gate e M2 drain: nó da referência do espelho */}
      <circle cx={DX.m3} cy={DPM.input.top} r="3" fill="#42536b" />
      {/* NMOS differential pair: gates face outward; sources go to the tail node */}
      {mos(DX.m1, DPM.input, { gateSide: -1 })}
      {mos(DX.m2, DPM.input, { gateSide: 1 })}
      <path d={`M${DX.m1} ${outputY}V${DPM.input.top}M30 ${center(DPM.input)}H${DX.m1 - GATE_DX}M${DX.m2 + GATE_DX} ${center(DPM.input)}H270`} />
      <circle cx={DX.m1} cy={outputY} r="3" fill="#42536b" />
      {/* tie both NMOS sources; M5 is the only tail device */}
      <path d={`M${DX.m1} ${commonSourceY}H${DX.m2}M${DX.tail} ${commonSourceY}V${DPM.tail.top}`} />
      {mos(DX.tail, DPM.tail, { gateSide: -1 })}
      <path d={`M${DX.tail - GATE_DX} ${tailGateY}H30`} />
      {ground(DX.tail, DPM.tail.bottom + 32)}
    </g>
    <g fontFamily="inherit" fontSize="11" fill="#728096">
      <text x="88" y="21">Vᴅᴅ</text>
      <text x="123" y="66" fill="#344b65">M₄</text>
      <text x="216" y="66" fill="#344b65">M₃</text>
      <text x="123" y="160" fill="#344b65">M₁</text>
      <text x="216" y="160" fill="#344b65">M₂</text>
      <text x="177" y="252" fill="#344b65">M₅</text>
      <text x="77" y="108" fill="#df7037">v_out</text>
      <text x="30" y={center(DPM.input) - 5} fill="#df7037">v_id1</text>
      <text x="245" y={center(DPM.input) - 5} fill="#df7037">v_id2</text>
      <text x="10" y={center(DPM.tail) - 9} fill="#7a6a94">V_bias,tail</text>
      <text x="16" y="300">I_D = {fmt(current)} µA por ramo</text>
      <text x="180" y="300">gₘ/Iᴅ = {fmt(efficiency)} V⁻¹</text>
    </g>
  </svg>;
}

function DifferentialPage() {
  const [efficiency, setEfficiency] = useState(15);
  const [length, setLength] = useState(.5);
  const [modal, setModal] = useState(null);
  const point = evaluate(efficiency, length);
  const regime = efficiency < 10 ? 'Inversão forte' : efficiency <= 20 ? 'Inversão moderada' : 'Inversão fraca';
  function reset() { setEfficiency(15); setLength(.5); }
  function exportCSV() {
    const rows = [`# Par diferencial com espelho PMOS e cauda NMOS; NAO sao dados do PDK IHP SG13G2; modelo didatico; gm do par fixo 300 uS; cauda e espelho com g_m/I_D fixo em ${DIFF.tailEfficiency} V-1; A_VT = 0,5 mV.um`, 'gm_id_V-1,L_um,ID_ramo_uA,L_carga_um,L_cauda_um,W_entrada_um,W_cauda_um,ganho_dif_V_V,ro_out_kOhm,CMRR_V,CMRR_dB,ICMR_V,offset_mV,area_total_um2'];
    LENGTHS.forEach(l => { for (let i = 0; i <= 100; i++) { const e = 5 + i * .2, p = evaluate(e, l); rows.push([e, l, p.current, p.loadLength, p.tailLength, p.input.width, p.tail.width, p.gain, p.rout, p.cmrr, p.cmrrDb, p.icmr, p.offsetMv, p.pairArea].join(',')); } });
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'gmid-par-diferencial-ilustrativo.csv'; a.click(); URL.revokeObjectURL(url);
  }
  return <>
    <LabShell activeKey="dp" version="EXPERIMENTO 04" onHelp={() => setModal('guide')} onUnavailable={setModal}>
      <div className="card title-hero"><div className="title-hero-left"><h1>Par diferencial<span className="title-tag">DP</span></h1><button className="secondary-button export" onClick={exportCSV}><Download size={15} /> Exportar curvas</button><button className="data-disclaimer" onClick={() => setModal('data')}><Info size={13} /> Curvas ilustrativas · Não extraídas do PDK</button></div><div className="title-hero-circuit tall"><div className="card-heading"><h2>Circuito</h2><span className="neutral-badge">NMOS + PMOS</span></div><DiffSchematic {...{ current: point.current, efficiency }} /><div className="circuit-caption"><span className="small-dot" /> Espelho PMOS · cauda NMOS</div><div className="fixed-bias"><p>Vᴅᴅ = 1,2 V · I_cauda = 2·I_D<br />T = 27 °C</p><div className="formula">CMRR = 2·(gₘ/Iᴅ)·V_A,cauda</div></div></div></div>
      <div className="controls-grid">
        <EfficiencyControl {...{ efficiency, setEfficiency, regime }} onReset={reset} />
        <LengthSelector {...{ length, setLength }} />
      </div>
      <div className="plots-full"><div className="plots-grid">{Object.entries(DIFF_METRICS).map(([metric, config]) => <section className={`card plot-card plot-${metric}`} key={metric}>
        <div className="plot-header"><h2>{config.title}</h2>{config.symbol && <span className="plot-symbol">{config.symbol}</span>}</div>
        <div className="regime-labels"><span>FORTE</span><span>MODERADA</span><span>FRACA</span></div>
        <LabChart id={`diff-${metric}`} config={config} evaluate={(e, l) => evaluate(e, l)[config.key]} {...{ efficiency, setEfficiency, length }} />
        {metric === 'cmrr' && <p className="headroom-definition">Quem rejeita o modo comum é a cauda: CMRR = 2·g_m·r_tail. Neste ponto são {fmt(point.cmrrDb, 1)} dB, com a cauda em L = {fmt(point.tailLength, 2)} µm. Note que a corrente não entra: mudar o gₘ/Iᴅ muda I_D e r_tail na mesma proporção.</p>}
        {metric === 'icmr' && <p className="headroom-definition">O gate pode variar de {fmt(point.vMin, 3)} V a {fmt(point.vMax, 3)} V: embaixo pela sobrecondução da cauda somada à do par, em cima pelo que a carga deixa. São {fmt(point.icmr, 3)} V de faixa.</p>}
        {metric === 'offset' && <p className="headroom-definition">Duas áreas que não casam geram uma tensão de offset: σ(V_os) = A_VT/√(2·W·L), com o √2 de duas variâncias somadas. Neste ponto são {fmt(point.offsetMv, 3)} mV — o limite prático do par.</p>}
      </section>)}
        <section className="card operating-card summary-card"><div className="operating-top"><h2>Ponto selecionado</h2><span className="selected-length" style={{ color: COLORS[LENGTHS.indexOf(length)] }}>L = {fmt(length, 2)} µm</span></div><div className="metrics-grid five"><Metric label="GANHO DIFERENCIAL" symbol="gₘ·(r_o1 ∥ r_o4) =" value={fmt(point.gain, 1)} unit="V/V" /><Metric label="CMRR" symbol="20·log₁₀(2gₘr_tail) =" value={fmt(point.cmrrDb, 1)} unit="dB" /><Metric label="FAIXA DE MODO COMUM" symbol="ICMR =" value={fmt(point.icmr, 3)} unit="V" /><Metric label="OFFSET" symbol="σ(V_os) =" value={fmt(point.offsetMv, 3)} unit="mV" /><Metric label="ÁREA TOTAL" symbol="soma das 5 áreas" value={fmt(point.pairArea, 2)} unit="µm²" /></div></section></div></div>
      <footer><span>Modelo didático · Não validado para fabricação</span></footer>
    </LabShell>
    {modal && <LabDialog onClose={() => setModal(null)} title={modal === 'guide' ? 'Do gₘ/Iᴅ ao par diferencial' : modal === 'data' ? 'Sobre estas curvas' : modal} icon={modal === 'guide' ? <BookOpen size={25} /> : <FlaskConical size={25} />} actionLabel={modal === 'guide' ? 'Vamos experimentar' : 'Entendido'}>
      {modal === 'guide' ? <>
        <p>O par diferencial existe por causa de uma propriedade que o transistor único não tem: <strong>sinal diferencial rejeita sinal comum</strong>. Tudo de interessante neste bloco sai daí.</p>
        <ol>
          <li><strong>O gₘ do par fica fixo em 300 µS.</strong> A corrente por ramo é I_D = gₘ/(gₘ/Iᴅ) e a cauda carrega o dobro. Só o gₘ/Iᴅ e o L do par mudam.</li>
          <li><strong>Ganho diferencial.</strong> Em meio-circuito diferencial o dreno de M2 é um terra virtual e não carrega a saída. A saída vê só r_o1 ∥ r_o4, então |A_vd| = gₘ·(r_o1 ∥ r_o4) — igual ao fonte comum com a mesma carga, mas sobre um par de transistores.</li>
          <li><strong>Rejeição de modo comum é a cauda.</strong> Se os dois gates se movem juntos, a corrente da cauda quase não muda, e a saída quase não se move. CMRR = 2·g_m·r_tail. Como r_tail = V_A/I e gₘ = (gₘ/I_D)·I, a corrente se cancela: <strong>CMRR = 2·(gₘ/I_D)·V_A,cauda</strong>. Por isso alongar a cauda melhora a rejeição enquanto o slew rate não claimpar.</li>
          <li><strong>Faixa de modo comum.</strong> O gate não pode descer abaixo de V_OV,cauda + V_OV,1 nem subir acima do que a carga deixa. Inversão fraca abre a faixa, porque a sobrecondução do par encolhe.</li>
          <li><strong>Offset é o preço do matching.</strong> Duas áreas que não casam de verdade geram uma tensão de offset: σ(V_os) = A_VT/√(2·W·L). O √2 vem de somar duas variâncias. Área maior reduz o offset — e é por isso que par diferencial quase nunca usa a largura mínima.</li>
        </ol>
        <div className="formula">|A_vd| = gₘ·(r_o1 ∥ r_o4)<br />CMRR = A_d/A_cm = 2·g_m·r_tail = 2·(gₘ/I_D)·V_A,cauda<br />ICMR = V_DD − V_OV,carga − V_OV,cauda − V_OV,1<br />σ(V_os) = A_VT / √(2·W·L)</div>
        <p className="modal-fine">Cauda e espelho são polarizados por tensão, com gₘ/I_D fixo em {fmt(DIFF.tailEfficiency, 0)} V⁻¹, e usam L = min(1 µm, 2·L) porque r_o da cauda e da carga é o que limita rejeição e ganho. O CMRR aqui é o ideal de r_tail infinito no tail, sem a degradação por mismatch nem pelo ruído da própria fonte de cauda — que é o que costuma dominá-lo em silício. A_VT = 0,5 mV·µm é proxy de Pelgrom, não dado de PDK. Ganho e V_A vêm do mesmo modelo didático dos outros blocos, ainda sem caracterização SPICE.</p>
      </> : modal === 'data' ? <>
        <p>O IHP SG13G2 é a tecnologia de referência deste laboratório. <strong>As curvas atuais não foram extraídas do PDK.</strong></p>
        <p>Esta versão usa relações analíticas simplificadas, inspiradas no conceito de inversão do EKV, com normalizações ilustrativas. Efeitos de canal curto, capacitâncias parasitas completas e dependência física de temperatura não são modelados.</p>
        <p>O próximo passo é caracterizar os dispositivos com SPICE e substituir o modelo por tabelas de consulta em função de L, Vᴅs, Vɢs e temperatura.</p>
      </> : <><p>Este bloco fará parte das próximas iterações do laboratório.</p><p>Por enquanto, explore o fonte comum, o espelho de corrente, a carga ativa e o par diferencial.</p></>}
    </LabDialog>}
  </>;
}

export default DifferentialPage;
