import React, { useState } from 'react';
import { BookOpen, Download, FlaskConical, Info } from 'lucide-react';
import LabShell from './LabShell';
import { EfficiencyControl, LabChart, LabDialog, LengthSelector, Metric, fmt } from './labUi';
import { COLORS, LENGTHS } from './model';
import { DIFF, DIFF_METRICS, differentialPoint } from './differentialModel';

const evaluate = (efficiency, length) => differentialPoint(efficiency, length);

// Par diferencial com espelho de carga. Mesma gramática dos outros blocos:
// canal vertical, barra de gate, seta de canal e zigue-zague da fonte — só o
// PMOS tem o zigue-zague no topo, porque a fonte dele vai para V_DD.
//
// Dois cuidados de traçado. Os gates ficam voltados para fora (M1 à esquerda,
// M2 à direita), para nenhum fio de entrada precisar cruzar um transistor. E o
// rail de V_DD fica colado no topo dos símbolos, deixando o fio que junta os
// gates do espelho passar por cima dele em vez de cruzar as fontes.
const PAIR = { top: 110, bottom: 156 };
const MIRROR = { top: 48, bottom: 92 };
const TAIL = { top: 186, bottom: 222 };
const RAIL_DD = 44, RAIL_GATE = 28, RAIL_BIAS = 6;
const mid = s => (s.top + s.bottom) / 2;

function DiffSchematic({ current, efficiency }) {
  const ground = (x, y) => <path d={`M${x} ${y}v8M${x - 12} ${y + 8}h24M${x - 8} ${y + 13}h16M${x - 4} ${y + 18}h8`} />;
  const fet = (x, gateX, s, pmos) => <>
    <path d={`M${x} ${s.top}v${s.bottom - s.top}`} />
    <path d={`M${x} ${mid(s) - 9}v18m-5-6 5 6 5-6`} />
    <path d={`M${gateX} ${mid(s) - 16}v32`} />
    {pmos ? <path d={`M${x} ${s.top}v-4`} /> : <path d={`M${x} ${s.bottom}h-13v20h13v14`} />}
  </>;
  return <svg className="schematic" viewBox="26 0 240 282" role="img" aria-label="Par diferencial NMOS com carga em espelho de corrente PMOS e fonte de cauda. M1 e M2 são o par de entrada, com os gates em v_id1 e v_id2. O espelho M4 e M3 tem as fontes em V_DD, M3 é diodo-conectado e uma fonte de corrente ideal gera I_bias no nó dos gates. M5 é a fonte de cauda, polarizada por V_bias, e é ela que rejeita o modo comum.">
    <g fill="none" stroke="#42536b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* fonte de corrente ideal que polariza os gates do espelho */}
      <path d={`M140 ${RAIL_BIAS}h40M160 ${RAIL_BIAS}v6M160 24v${RAIL_GATE - 24}`} />
      <circle cx="160" cy="18" r="6" />
      {/* V_DD, logo acima dos PMOS, para o fio dos gates passar por cima */}
      <path d={`M110 ${RAIL_DD}h100`} />
      {/* M4 e M3: o fio dos gates sai das barras, sobe acima do rail e desce na outra ponta */}
      {fet(125, 98, MIRROR, true)}
      {fet(195, 222, MIRROR, true)}
      <path d={`M98 ${mid(MIRROR)}V${RAIL_GATE}H245V100`} />
      <path d={`M222 ${mid(MIRROR)}V${RAIL_GATE}`} />
      {/* dreno de M3 é o mesmo nó do dreno de M2: sobe pela coluna e vai até o fio dos gates */}
      <path d="M195 100h50" />
      {/* par de entrada; o dreno de M4 é a saída, direto na mesma coluna */}
      {fet(125, 98, PAIR, false)}
      {fet(195, 222, PAIR, false)}
      <path d={`M40 ${mid(PAIR)}h58M240 ${mid(PAIR)}h-18`} />
      <circle cx="125" cy="101" r="3" fill="#42536b" />
      {/* fontes de M1 e M2 em um nó só, jogados para a cauda */}
      <path d="M125 176h70M160 176v10" />
      {fet(160, 133, TAIL, false)}
      {ground(160, 256)}
      <path d={`M133 ${mid(TAIL)}H40`} />
    </g>
    <g fontFamily="inherit" fontSize="11" fill="#728096">
      <text x="112" y={RAIL_DD - 6}>Vᴅᴅ</text>
      <text x="168" y="22" fill="#7a6a94">I_bias</text>
      <text x="139" y="70" fill="#344b65">M₄</text>
      <text x="203" y="70" fill="#344b65">M₃</text>
      <text x="139" y="132" fill="#344b65">M₁</text>
      <text x="203" y="132" fill="#344b65">M₂</text>
      <text x="176" y="208" fill="#344b65">M₅</text>
      <text x="106" y="99" fill="#df7037">v_out</text>
      <text x="42" y="130" fill="#df7037">v_id1</text>
      <text x="230" y="130" fill="#df7037">v_id2</text>
      <text x="14" y="212" fill="#7a6a94">V_bias</text>
      <text x="14" y="252">I_D = {fmt(current)} µA</text>
      <text x="14" y="268">gₘ/Iᴅ = {fmt(efficiency)} V⁻¹</text>
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