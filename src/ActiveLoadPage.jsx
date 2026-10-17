import React, { useState } from 'react';
import { BookOpen, Download, FlaskConical, Info } from 'lucide-react';
import LabShell from './LabShell';
import { EfficiencyControl, LabChart, LabDialog, LengthSelector, Metric, fmt } from './labUi';
import { COLORS, LENGTHS } from './model';
import { ACTIVE_LOAD, ACTIVE_METRICS, activeLoadPoint } from './activeLoadModel';

const evaluate = (efficiency, length) => activeLoadPoint(efficiency, length);

// Dois transistores, na mesma gramática do lab do fonte comum: canal vertical,
// barra de gate à esquerda, seta de canal e zigue-zague da fonte. No PMOS o
// zigue-zague fica no topo, porque a fonte vai para V_DD.
function ActiveSchematic({ current, efficiency }) {
  const ground = (x, y) => <path d={`M${x} ${y}v8M${x - 12} ${y + 8}h24M${x - 8} ${y + 13}h16M${x - 4} ${y + 18}h8`} />;
  const fet = (x, top, bottom, { pmos = false } = {}) => <>
    <path d={`M${x} ${top}v${bottom - top}`} />
    <path d={`M${x} ${top + 26}v18m-5-6 5 6 5-6`} />
    {pmos ? <path d={`M${x} ${top}v-30`} /> : <path d={`M${x} ${bottom}h-17v33h17v20`} />}
    <path d={`M${x - 27} ${top + 18}v32`} />
  </>;
  return <svg className="schematic" viewBox="0 0 300 210" role="img" aria-label="Fonte comum NMOS com um único transistor PMOS como carga ativa. M1 recebe a entrada em v_in e tem a saída tomada no dreno, em v_out, onde fica a carga C_L. O gate da carga está numa tensão de polarização fixa V_bias, separada do rail de V_DD, então a corrente é imposta pelo transistor e não por um espelho.">
    <g fill="none" stroke="#42536b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* rails separados: V_DD alimenta a fonte da carga; V_bias polariza o gate dela */}
      <path d="M186 30h64M92 30h56v52h81" />
      {fet(200, 60, 120, { pmos: true })}
      {fet(120, 120, 170)}
      <path d="M40 154h53" />
      {/* no de saida: dreno de M1 e dreno de M_L, com C_L */}
      <path d="M120 120h130M240 120v18M233 138h14M236 142h8" />
      <path d="M104 186h-11m4-4-4 4 4 4" />
      {ground(120, 198)}
      {ground(240, 142)}
      <circle cx="120" cy="120" r="3" fill="#42536b" />
    </g>
    <g fontFamily="inherit" fontSize="11" fill="#728096">
      <text x="192" y="22">Vᴅᴅ = 1,2 V</text>
      <text x="94" y="22" fill="#7a6a94">V_bias</text>
      <text x="208" y="96" fill="#344b65">M_L</text>
      <text x="62" y="138" fill="#344b65">M₁</text>
      <text x="14" y="150" fill="#df7037">vᵢₙ</text>
      <text x="128" y="112" fill="#df7037">v_out</text>
      <text x="228" y="168" fill="#4b5f78">C_L</text>
      <text x="14" y="200">I_D = {fmt(current)} µA</text>
      <text x="240" y="200">gₘ/Iᴅ = {fmt(efficiency)} V⁻¹</text>
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
    const rows = [`# Carga ativa de um unico transistor sobre o CS; NAO sao dados do PDK IHP SG13G2; modelo didatico; gm fixo 300 uS; carga com g_m/I_D fixo em ${ACTIVE_LOAD.loadEfficiency} V-1 e VA 0,6 do NMOS`, 'gm_id_V-1,L_um,ID_uA,W_in_um,W_load_um,ro_in_kOhm,ro_load_kOhm,rout_kOhm,gain_V_V,ganho_ideal_V_V,headroom_entrada_V,headroom_carga_V,headroom_par_V,swing_V,ruido_nV_rtHz,razao_ruido,fT_entrada_GHz,fT_carga_GHz,fT_par_GHz,limitado_por,area_par_um2'];
    LENGTHS.forEach(l => { for (let i = 0; i <= 100; i++) { const e = 5 + i * .2, p = evaluate(e, l); rows.push([e, l, p.current, p.width, p.loadWidth, p.ro, p.roLoad, p.rout, p.gain, p.intrinsicGain, p.input.headroom, p.load.headroom, p.headroom, p.swing, p.thermalNoise, p.noiseRatio, p.ftInput, p.ftLoad, p.ft, p.limitedBy, p.pairArea].join(',')); } });
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'gmid-carga-ativa-ilustrativo.csv'; a.click(); URL.revokeObjectURL(url);
  }
  return <>
    <LabShell activeKey="al" version="EXPERIMENTO 03" onHelp={() => setModal('guide')} onUnavailable={setModal}>
      <div className="card title-hero"><div className="title-hero-left"><h1>Carga ativa<span className="title-tag">AL</span></h1><button className="secondary-button export" onClick={exportCSV}><Download size={15} /> Exportar curvas</button><button className="data-disclaimer" onClick={() => setModal('data')}><Info size={13} /> Curvas ilustrativas · Não extraídas do PDK</button></div><div className="title-hero-circuit"><div className="card-heading"><h2>Circuito</h2><span className="neutral-badge">NMOS + PMOS</span></div><ActiveSchematic {...{ current: point.current, efficiency }} /><div className="circuit-caption"><span className="small-dot" /> Um transistor de carga · C_L = 2 pF</div><div className="fixed-bias"><p>Vᴅᴅ = 1,2 V · C_L = 2 pF<br />T = 27 °C</p><div className="formula">V_OV,carga = 2/{fmt(ACTIVE_LOAD.loadEfficiency)} V</div></div></div></div>
      <div className="controls-grid">
        <EfficiencyControl {...{ efficiency, setEfficiency, regime }} onReset={reset} />
        <LengthSelector {...{ length, setLength }} />
      </div>
      <div className="plots-full"><div className="plots-grid">{Object.entries(ACTIVE_METRICS).map(([metric, config]) => <section className={`card plot-card plot-${metric}`} key={metric}>
        <div className="plot-header"><h2>{config.title}</h2>{config.symbol && <span className="plot-symbol">{config.symbol}</span>}</div>
        <div className="regime-labels"><span>FORTE</span><span>MODERADA</span><span>FRACA</span></div>
        <LabChart id={`active-${metric}`} config={config} evaluate={(e, l) => evaluate(e, l)[config.key]} {...{ efficiency, setEfficiency, length }} />
        {metric === 'headroom' && <p className="headroom-definition">A carga é polarizada por tensão, então a sua sobrecondução é fixa em {fmt(ACTIVE_LOAD.loadEfficiency, 0)} V⁻¹ e custa {fmt(point.load.headroom, 3)} V. O par inteiro precisa de {fmt(point.headroom, 3)} V de V_DD e sobra {fmt(point.swing, 3)} V de swing — o preço de colocar um transistor em cima do outro.</p>}
        {metric === 'noise' && <p className="headroom-definition">O par também faz ruído: gₘ,carga/gₘ,1 = {fmt(point.noiseRatio, 2)}, o que multiplica o ruído por {fmt(Math.sqrt(1 + point.noiseRatio), 2)}. Com carga ideal seria {fmt(point.input.thermalNoise, 2)} nV/√Hz; aqui são {fmt(point.thermalNoise, 2)} nV/√Hz.</p>}
        {metric === 'ft' && <p className="headroom-definition">O sinal não passa mais rápido que a carga. Neste ponto a entrada faz {fmt(point.ftInput, 1)} GHz e a carga {fmt(point.ftLoad, 1)} GHz: quem limita é {point.limitedBy === 'carga' ? 'a carga' : 'a entrada'}. Abaixo do limite, a curva achata.</p>}
      </section>)}
        <section className="card operating-card summary-card"><div className="operating-top"><h2>Ponto selecionado</h2><span className="selected-length" style={{ color: COLORS[LENGTHS.indexOf(length)] }}>L = {fmt(length, 2)} µm</span></div><div className="metrics-grid five"><Metric label="HEADROOM DO PAR" symbol="V_OV1+V_OV,L =" value={fmt(point.headroom, 3)} unit="V" /><Metric label="SWING" symbol="V_DD − headroom =" value={fmt(point.swing, 3)} unit="V" /><Metric label="RUÍDO" symbol="e_n =" value={fmt(point.thermalNoise, 2)} unit="nV/√Hz" /><Metric label="fT DO PAR" symbol="min(f_T) =" value={fmt(point.ft, 1)} unit="GHz" /><Metric label="GANHO" symbol="gₘ·r_out =" value={fmt(point.gain, 1)} unit="V/V" /></div></section></div></div>
      {!point.compliant && <div className="warning"><Info size={17} /> Atenção: as duas sobreconduções somam {fmt(point.headroom, 3)} V e não cabem em V_DD = 1,2 V. O par não opera como está.</div>}
      <footer><span>Modelo didático · Não validado para fabricação</span></footer>
    </LabShell>
    {modal && <LabDialog onClose={() => setModal(null)} title={modal === 'guide' ? 'Do gₘ/Iᴅ à carga ativa' : modal === 'data' ? 'Sobre estas curvas' : modal} icon={modal === 'guide' ? <BookOpen size={25} /> : <FlaskConical size={25} />} actionLabel={modal === 'guide' ? 'Vamos experimentar' : 'Entendido'}>
      {modal === 'guide' ? <>
        <p>Trocar a fonte de corrente ideal por <strong>um único transistor</strong> é a forma mais barata de conseguir ganho alto. O preço vem em três contas: espaço de tensão, ruído e velocidade.</p>
        <ol>
          <li><strong>O gₘ da entrada fica fixo em 300 µS.</strong> A corrente vem de I_D = gₘ/(gₘ/Iᴅ). Só o gₘ/Iᴅ e o L da entrada mudam.</li>
          <li><strong>A carga é polarizada por tensão, não por corrente.</strong> O gate de M_L está numa tensão fixa, então a sobrecondução dele <strong>não acompanha</strong> o gₘ/Iᴅ escolhido: é constante em {fmt(ACTIVE_LOAD.loadEfficiency, 0)} V⁻¹. Isso é a vantagem — dá para escolher o ponto da carga independentemente — e também a fragilidade: nada garante que a corrente continue certa com PVT.</li>
          <li><strong>Headroom empilhado.</strong> V_out ≥ V_OV,1 + V_OV,L ≈ 2/(gₘ/Iᴅ) + {fmt(2 / ACTIVE_LOAD.loadEfficiency, 3)} V. Cada transistor leva um pedaço de V_DD, e o swing é o que sobra.</li>
          <li><strong>A carga faz ruído.</strong> O par gera 4kTγ(g_m1 + g_mL) de corrente de ruído. Referindo à entrada, o r_out se cancela e sobra um fator √(1 + g_mL/g_m1) sobre o ruído de carga ideal. Aqui isso vai de 1,84× em inversão forte a 1,22× em fraca.</li>
          <li><strong>A carga vira gargalo de velocidade.</strong> A fT da carga é fixa; a da entrada cai com o gₘ/Iᴅ. O par não fica mais rápido que o transistor mais lento, e a curva achata quando a carga assume.</li>
          <li><strong>Ganho em paralelo.</strong> A saída vê r_o1 ∥ r_o,L, então |Aᵥ| = gₘ·r_out fica abaixo de gₘ/gds. Um espelho de corrente seria melhor aqui — mas é um bloco só, não dois.</li>
        </ol>
        <div className="formula">V_OV,L = 2/{fmt(ACTIVE_LOAD.loadEfficiency, 0)} V (fixa)<br />V_out ≥ V_OV,1 + V_OV,L ≈ 2/(gₘ/Iᴅ) + {fmt(2 / ACTIVE_LOAD.loadEfficiency, 3)} V<br />e_n = √[4kTγ/g_m1 · (1 + g_mL/g_m1)]<br />f_T,par = min(f_T,entrada; f_T,carga)<br />|Aᵥ| = gₘ·(r_o1 ∥ r_o,L) ≤ gₘ/gds</div>
        <p className="modal-fine">O ruído é o de canal do NMOS em aproximação de canal longo, γ = 2/3, T = 300,15 K, e cobre <strong>apenas o ruído térmico</strong>: sem 1/f, sem ruído da fonte de bias e sem ruído da carga externa. A carga usa a mesma densidade do modelo do NMOS, V_A 60% da do NMOS, e o mesmo L da entrada. Ganho, V_A e fT vêm do mesmo modelo didático dos outros blocos, ainda sem caracterização SPICE. A tensão V_bias é um ponto DC assumido e o modelo ignora variação de PVT e efeito de corpo.</p>
      </> : modal === 'data' ? <>
        <p>O IHP SG13G2 é a tecnologia de referência deste laboratório. <strong>As curvas atuais não foram extraídas do PDK.</strong></p>
        <p>Esta versão usa relações analíticas simplificadas, inspiradas no conceito de inversão do EKV, com normalizações ilustrativas. Efeitos de canal curto, capacitâncias parasitas completas e dependência física de temperatura não são modelados.</p>
        <p>O próximo passo é caracterizar os dispositivos com SPICE e substituir o modelo por tabelas de consulta em função de L, Vᴅs, Vɢs e temperatura.</p>
      </> : <><p>Este bloco fará parte das próximas iterações do laboratório.</p><p>Por enquanto, explore o fonte comum, o espelho de corrente e a carga ativa para entender as relações entre eficiência, impedência e dimensionamento.</p></>}
    </LabDialog>}
  </>;
}

export default ActiveLoadPage;