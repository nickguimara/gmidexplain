import React, { useState } from 'react';
import { BookOpen, Download, FlaskConical, Info } from 'lucide-react';
import LabShell from './LabShell';
import { EfficiencyControl, LabChart, LabDialog, LengthSelector, Metric, fmt } from './labUi';
import { COLORS, LENGTHS } from './model';
import { ACTIVE_LOAD, ACTIVE_METRICS, activeLoadPoint } from './activeLoadModel';

const evaluate = (efficiency, length) => activeLoadPoint(efficiency, length);

// Fonte comum com carga em espelho de corrente PMOS, na mesma gramática do lab
// do fonte comum: transistor com seta de canal, barra de gate à esquerda e lead
// de fonte em zigue-zague até o terra. M1 é o NMOS de entrada (fonte embaixo);
// o espelho PMOS tem as fontes em V_DD, por isso o zigue-zague fica no topo.
// colunas: x = 110 (M1), 170 e 230 (espelho PMOS), 250 (C_L na saída)
function ActiveSchematic({ current, length, efficiency }) {
  const ground = (x, y) => <path d={`M${x} ${y}v8M${x - 12} ${y + 8}h24M${x - 8} ${y + 13}h16M${x - 4} ${y + 18}h8`} />;
  // Mesma gramática do lab do fonte comum: transistor com canal vertical, barra
  // de gate à esquerda, seta de canal e lead de fonte em zigue-zague. No PMOS o
  // zigue-zague fica no topo, porque a fonte vai para V_DD.
  const fet = (x, top, bottom, { pmos = false, gateSide = -1 }) => {
    const arrowY = top + 26, arrowTo = top + 44;
    return <>
      <path d={`M${x} ${top}v${bottom - top}`} />
      <path d={`M${x} ${arrowY}v${arrowTo - arrowY}m-5-6 5 6 5-6`} />
      {pmos ? <path d={`M${x} ${top}v-18`} /> : <path d={`M${x} ${bottom}h-17v33h17v20`} />}
      <path d={`M${x + gateSide * 27} ${top + 18}v32`} />
    </>;
  };
  return <svg className="schematic" viewBox="0 0 300 250" role="img" aria-label="Fonte comum NMOS com carga ativa em espelho de corrente PMOS. O transistor M1 recebe a entrada em v_in e tem a saída tomada no dreno, em v_out, onde também está a carga C_L. O espelho PMOS tem as fontes ligadas em V_DD; M3 é diodo-conectado e M4 vai para a saída, e uma fonte de corrente ideal gera I_bias no nó dos gates.">
    <g fill="none" stroke="#42536b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M150 22h100" />
      {/* espelho PMOS: M3 diodo-conectado (x=170) e M4 no ramo de saida (x=230) */}
      {fet(170, 40, 90, { pmos: true, gateSide: -1 })}
      {fet(230, 40, 90, { pmos: true, gateSide: 1 })}
      <path d="M170 90v15M143 90v15M257 90v15M143 105h114" />
      <path d="M230 90h50v40" />
      {/* fonte de corrente ideal de bias, no nó dos gates */}
      <path d="M205 22v22M205 76v29" />
      <circle cx="205" cy="60" r="16" />
      <path d="M205 70V54m-4 4 4-4 4 4" />
      {/* no de saida: dreno de M1, dreno de M4 e C_L */}
      <path d="M110 130h170M250 130v20M243 150h14M246 154h8" />
      {ground(250, 154)}
      {/* M1: NMOS de entrada, fonte ao terra */}
      {fet(110, 130, 175, { pmos: false, gateSide: -1 })}
      <path d="M104 190h-11m4-4-4 4 4 4" />
      {ground(110, 228)}
      <path d="M36 164h47" />
      <path d="M165 22h22M195 22h22M225 22h22" />
      <circle cx="170" cy="105" r="3" fill="#42536b" /><circle cx="110" cy="130" r="3" fill="#42536b" />
    </g>
    <g fontFamily="inherit" fontSize="11" fill="#728096">
      <text x="104" y="18">Vᴅᴅ = 1,2 V</text>
      <text x="176" y="74" fill="#344b65">M₃</text>
      <text x="236" y="74" fill="#344b65">M₄</text>
      <text x="56" y="150" fill="#344b65">M₁</text>
      <text x="14" y="160" fill="#df7037">vᵢₙ</text>
      <text x="150" y="122" fill="#df7037">v_out</text>
      <text x="238" y="176" fill="#4b5f78">C_L</text>
      <text x="214" y="44" fill="#7a6a94">I_bias</text>
      <text x="14" y="206">I_D = {fmt(current)} µA</text>
      <text x="14" y="244">gₘ/Iᴅ = {fmt(efficiency)} V⁻¹</text>
      <text x="212" y="244">L = {fmt(length, 2)} µm</text>
    </g>
  </svg>;
}

function ActiveLoadPage() {
  const [efficiency, setEfficiency] = useState(15);
  const [length, setLength] = useState(.5);
  const [modal, setModal] = useState(null);
  const point = evaluate(efficiency, length);
  const regime = efficiency < 10 ? 'Inversão forte' : efficiency <= 20 ? 'Inversão moderada' : 'Inversão fraca';
  function reset() { setEfficiency(15); setLength(.5); }
  function exportCSV() {
    const rows = ['# Carga ativa: CS com espelho PMOS; NAO sao dados do PDK IHP SG13G2; modelo didatico; gm fixo 300 uS; espelho 2x mais longo, mobilidade 0,5, VA 0,6 do NMOS', 'gm_id_V-1,L_um,L_carga_um,ID_uA,W_in_um,W_load_um,ro_in_kOhm,ro_load_kOhm,rout_kOhm,gain_V_V,ganho_ideal_V_V,razao_ganho,headroom_par_V,swing_V,Cout_fF,f_3dB_MHz,gbw_MHz,area_par_um2'];
    LENGTHS.forEach(l => { for (let i = 0; i <= 100; i++) { const e = 5 + i * .2, p = evaluate(e, l); rows.push([e, l, p.loadLength, p.current, p.input.width, p.load.width, p.ro, p.roLoad, p.rout, p.gain, p.idealGain, p.gainRatio, p.headroom, p.swing, p.cOut, p.bandwidth, p.gbw, p.pairArea].join(',')); } });
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'gmid-carga-ativa-ilustrativo.csv'; a.click(); URL.revokeObjectURL(url);
  }
  return <>
    <LabShell activeKey="al" version="EXPERIMENTO 03" onHelp={() => setModal('guide')} onUnavailable={setModal}>
      <div className="card title-hero"><div className="title-hero-left"><h1>Carga ativa<span className="title-tag">AL</span></h1><button className="secondary-button export" onClick={exportCSV}><Download size={15} /> Exportar curvas</button><button className="data-disclaimer" onClick={() => setModal('data')}><Info size={13} /> Curvas ilustrativas · Não extraídas do PDK</button></div><div className="title-hero-circuit"><div className="card-heading"><h2>Circuito</h2><span className="neutral-badge">NMOS + PMOS</span></div><ActiveSchematic {...{ current: point.current, length, efficiency }} /><div className="circuit-caption"><span className="small-dot" /> Espelho PMOS · C_L = 2 pF</div><div className="fixed-bias"><p>Vᴅᴅ = 1,2 V · C_L = 2 pF<br />T = 27 °C</p><div className="formula">r_out = r_o1 ∥ r_o,carga</div></div></div></div>
      <div className="controls-grid">
        <EfficiencyControl {...{ efficiency, setEfficiency, regime }} onReset={reset} />
        <LengthSelector {...{ length, setLength }} />
      </div>
      <div className="plots-full"><div className="plots-grid">{Object.entries(ACTIVE_METRICS).map(([metric, config]) => <section className={`card plot-card plot-${metric}`} key={metric}>
        <div className="plot-header"><h2>{config.title}</h2>{config.symbol && <span className="plot-symbol">{config.symbol}</span>}</div>
        <div className="regime-labels"><span>FORTE</span><span>MODERADA</span><span>FRACA</span></div>
        <LabChart id={`active-${metric}`} config={config} evaluate={(e, l) => evaluate(e, l)[config.key]} {...{ efficiency, setEfficiency, length }} />
        {metric === 'gain' && <p className="headroom-definition">Com carga ideal o ganho seria gₘ/gds. Aqui a saída vê duas impedâncias em paralelo: a do NMOS de entrada e a do espelho PMOS, por isso o ganho cai para {fmt(100 * point.gainRatio, 0)}% do valor ideal neste ponto.</p>}
        {metric === 'headroom' && <p className="headroom-definition">As duas sobreconduções se empilham entre a fonte e V_DD: o par inteiro precisa de {fmt(point.headroom, 3)} V, restando {fmt(point.swing, 3)} V de swing. Inversão fraca devolve tensão ao sinal.</p>}
        {metric === 'bandwidth' && <p className="headroom-definition">Banda de um polo com r_out real: {fmt(point.bandwidth, 3)} MHz neste ponto. O produto ganho × banda é gₘ/(2πC_total) ≈ {fmt(point.gbw, 1)} MHz e não depende de L.</p>}
      </section>)}
        <section className="card operating-card summary-card"><div className="operating-top"><h2>Ponto selecionado</h2><span className="selected-length" style={{ color: COLORS[LENGTHS.indexOf(length)] }}>L = {fmt(length, 2)} µm</span></div><div className="metrics-grid five"><Metric label="GANHO" symbol="|Aᵥ| =" value={fmt(point.gain, 1)} unit="V/V" /><Metric label="GANHO IDEAL" symbol="gₘ/gds =" value={fmt(point.idealGain, 1)} unit="V/V" /><Metric label="BANDA" symbol="f₋₃dB =" value={fmt(point.bandwidth, 3)} unit="MHz" /><Metric label="HEADROOM DO PAR" symbol="V_OV1+V_OV2 =" value={fmt(point.headroom, 3)} unit="V" /><Metric label="ÁREA DO PAR" symbol="W₁L + W_L L" value={fmt(point.pairArea, 2)} unit="µm²" /></div></section></div></div>
      <footer><span>Modelo didático · Não validado para fabricação</span></footer>
    </LabShell>
    {modal && <LabDialog onClose={() => setModal(null)} title={modal === 'guide' ? 'Do gₘ/Iᴅ à carga ativa' : modal === 'data' ? 'Sobre estas curvas' : modal} icon={modal === 'guide' ? <BookOpen size={25} /> : <FlaskConical size={25} />} actionLabel={modal === 'guide' ? 'Vamos experimentar' : 'Entendido'}>
      {modal === 'guide' ? <>
        <p>Com carga de corrente ideal, a saída flutuava e o ganho era <strong>gₘ/gds</strong>. Uma carga ativa é um transistor no lugar da fonte ideal: o ganho continua alto, mas agora há um preço — resistência dividida, headroom empilhado e um polo de verdade.</p>
        <ol>
          <li><strong>O gₘ fica fixo em 300 µS.</strong> A corrente vem de I_D = gₘ/(gₘ/Iᴅ), como nos outros blocos. Só o gₘ/Iᴅ e o L mudam.</li>
          <li><strong>Ganho: duas impedências em paralelo.</strong> A saída vê r_o do NMOS <em>e</em> r_o do PMOS do espelho ao mesmo tempo: r_out = r_o1 ∥ r_o,carga e |Aᵥ| = gₘ·r_out. O ganho fica sempre abaixo do ideal.</li>
          <li><strong>O espelho é mais longo que a entrada.</strong> A carga é quem limita o ganho, então ela recebe o dobro de L. O PMOS tem menos mobilidade, então também precisa de largura maior.</li>
          <li><strong>Headroom empilhado.</strong> As duas sobreconduções se somam entre a fonte e V_DD. Inversão fraca reduz o headroom do par e devolve swing, ao custo de corrente.</li>
          <li><strong>Banda: agora existe um polo.</strong> Com carga ideal não havia r_out para fechar o polo. Aqui f_−3dB = 1/[2π·r_out·(C_L + C_out)]. Alongar L sobe o ganho e desce a banda.</li>
          <li><strong>Ganho × banda é constante.</strong> Multiplicando as duas, r_out se cancela: o produto vale gₘ/(2πC_total), ≈ {fmt(point.gbw, 1)} MHz neste modelo. É o preço de fundo para não fugir com L.</li>
        </ol>
        <div className="formula">r_out = 1/(1/r_o1 + 1/r_o,carga)<br />|Aᵥ| = gₘ·r_out ≤ gₘ/gds<br />V_out ≥ V_OV1 + V_OV,carga<br />f_−3dB = 1/[2π·r_out·(C_L + C_out)]<br />GBW = |Aᵥ|·f_₃dB = gₘ/(2πC_total)</div>
        <p className="modal-fine">O espelho usa L_carga = min(1 µm, 2·L), V_A 60% da do NMOS e mobilidade 50%. A capacitância de saída é um proxy linear em largura, C_out = Σ W(0,35 + 0,4L) fF/µm, <strong>não Cgg nem dados de PDK</strong>. C_L = 2 pF é fixa. A banda é de um polo, com carga externa resistiva; não há polo de entrada nem Miller completo, e f_−3dB não é f_T. Ganho, V_A e headroom vêm do mesmo modelo didático dos outros blocos, ainda sem caracterização SPICE.</p>
      </> : modal === 'data' ? <>
        <p>O IHP SG13G2 é a tecnologia de referência deste laboratório. <strong>As curvas atuais não foram extraídas do PDK.</strong></p>
        <p>Esta versão usa relações analíticas simplificadas, inspiradas no conceito de inversão do EKV, com normalizações ilustrativas. Efeitos de canal curto, capacitâncias parasitas completas e dependência física de temperatura não são modelados.</p>
        <p>O próximo passo é caracterizar os dispositivos com SPICE e substituir o modelo por tabelas de consulta em função de L, Vᴅs, Vɢs e temperatura.</p>
      </> : <><p>Este bloco fará parte das próximas iterações do laboratório.</p><p>Por enquanto, explore o fonte comum, o espelho de corrente e a carga ativa para entender as relações entre eficiência, impedância e dimensionamento.</p></>}
    </LabDialog>}
  </>;
}

export default ActiveLoadPage;