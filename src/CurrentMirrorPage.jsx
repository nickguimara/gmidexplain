import React, { useState } from 'react';
import { BookOpen, Download, FlaskConical, Info } from 'lucide-react';
import AreaCurrentChart from './AreaCurrentChart';
import LabShell from './LabShell';
import { EfficiencyControl, LabChart, LabDialog, LengthSelector, Metric, fmt } from './labUi';
import { COLORS, LENGTHS } from './model';
import { MIRROR, MIRROR_METRICS, mirrorPoint } from './mirrorModel';

const evaluate = (efficiency, length) => mirrorPoint(efficiency, length);
const DEFINITIONS = {
  compliance: 'Compliance é a menor tensão que o nó de saída precisa ter para o transistor de saída continuar em saturação. Abaixo dela, o espelho copia menos corrente do que a referência. M1 tem Vᴅs = Vɢs, por isso não existe compliance no ramo de referência.',
  error: 'Só a parcela de mismatch entra aqui: σ(ΔV_T) = K_V/√(W·L), com K_V = 0,5 mV·µm. O erro por modulação de canal (λ·V_DS) também existe, mas neste modelo depende só de L e não muda com o gₘ/Iᴅ.',
  gain: 'É o mesmo limite gₘ·r_out do fonte comum, agora impostos pelo transistor de saída do espelho. Com o gₘ/Iᴅ fixo, a corrente não muda: um L maior compra ganho e precisão pagando só em área.',
};

function MirrorSchematic({ current, vds }) {
  return <svg className="schematic" viewBox="0 0 300 176" role="img" aria-label="Espelho de corrente NMOS com razão 1:1. M1 tem o dreno ligado ao próprio gate e recebe a corrente de referência; M2 copia essa corrente para o nó de saída. Ambas as fontes estão ligadas ao mesmo nó de massa.">
    <g fill="none" stroke="#42536b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 26h240M120 26v62M210 26v62" />
      <circle cx="120" cy="108" r="20" /><circle cx="210" cy="108" r="20" />
      <path d="M120 96v20m-5-6 5 6 5-6M210 96v20m-5-6 5 6 5-6" />
      <path d="M120 128v22M210 128v22M120 150h90" />
      <path d="M165 150v12M152 162h26M157 167h16M162 172h6" />
      <path d="M120 70H85v38h105" />
      <path d="M210 60h48" />
      <circle cx="120" cy="70" r="3" fill="#42536b" /><circle cx="210" cy="60" r="3" fill="#fff" />
      <path d="M109 14h22" />
    </g>
    <g fontFamily="inherit" fontSize="11" fill="#728096">
      <text x="56" y="20">Vᴅᴅ = 1,2 V</text>
      <text x="126" y="46">I_ref = {fmt(current)} µA</text>
      <text x="216" y="46">I_out = {fmt(current)} µA</text>
      <text x="262" y="64" fill="#df7037">v_out</text>
      <text x="50" y="112" fill="#344b65">M₁</text>
      <text x="236" y="112" fill="#344b65">M₂</text>
      <text x="58" y="128" fontSize="9">diodo</text>
      <text x="58" y="140" fontSize="9">conectado</text>
      <text x="12" y="166">Vᴅs,out = {fmt(vds, 2)} V</text>
    </g>
  </svg>;
}

function CurrentMirrorPage() {
  const [efficiency, setEfficiency] = useState(15);
  const [length, setLength] = useState(.5);
  const [modal, setModal] = useState(null);
  const point = evaluate(efficiency, length);
  const regime = efficiency < 10 ? 'Inversão forte' : efficiency <= 20 ? 'Inversão moderada' : 'Inversão fraca';
  function reset() { setEfficiency(15); setLength(.5); }
  function exportCSV() {
    const rows = ['# Espelho de corrente 1:1; NAO sao dados do PDK IHP SG13G2; modelo didatico; gm fixo 300 uS; erro apenas por mismatch de V_T (Pelgrom, K_V = 0,5 mV.um)', 'gm_id_V-1,L_um,I_ref_uA,I_out_uA,W_um,area_par_um2,sigma_VT_V,erro_copia_pct,Vout_min_V,Vout_max_V,ganho_V_V'];
    LENGTHS.forEach(l => { for (let i = 0; i <= 100; i++) { const e = 5 + i * .2, p = evaluate(e, l); rows.push([e, l, p.refCurrent, p.outCurrent, p.width, p.pairArea, p.sigma, p.errorPercent, p.vMinOut, p.vMaxOut, p.gain].join(',')); } });
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'gmid-espelho-ilustrativo.csv'; a.click(); URL.revokeObjectURL(url);
  }
  return <>
    <LabShell activeKey="cm" version="EXPERIMENTO 02" onHelp={() => setModal('guide')} onUnavailable={setModal}>
      <div className="card title-hero"><div className="title-hero-left"><h1>Espelho de corrente<span className="title-tag">CM</span></h1><button className="secondary-button export" onClick={exportCSV}><Download size={15} /> Exportar curvas</button><button className="data-disclaimer" onClick={() => setModal('data')}><Info size={13} /> Curvas ilustrativas · Não extraídas do PDK</button></div><div className="title-hero-circuit"><div className="card-heading"><h2>Circuito</h2><span className="neutral-badge">NMOS</span></div><MirrorSchematic current={point.outCurrent} vds={MIRROR.vdsOut} /><div className="circuit-caption"><span className="small-dot" /> Razão 1:1 · fontes em comum</div><div className="fixed-bias"><p>Vᴅs,out = {fmt(MIRROR.vdsOut, 2)} V · Vᴅᴅ = 1,2 V<br />T = 27 °C</p><div className="formula">I_out ≈ I_ref = gₘ / (gₘ/Iᴅ)</div></div></div></div>
      <div className="controls-grid">
        <EfficiencyControl {...{ efficiency, setEfficiency, regime }} onReset={reset} />
        <LengthSelector {...{ length, setLength }} />
      </div>
      <div className="plots-full"><div className="plots-grid">{Object.entries(MIRROR_METRICS).map(([metric, config]) => <section className={`card plot-card plot-${metric}`} key={metric}>
        <div className="plot-header"><h2>{config.title}</h2>{config.symbol && <span className="plot-symbol">{config.symbol}</span>}</div>
        <div className="regime-labels"><span>FORTE</span><span>MODERADA</span><span>FRACA</span></div>
        {metric === 'areaCurrent'
          ? <AreaCurrentChart {...{ efficiency, setEfficiency, length }} evaluate={evaluate} areaKey="pairArea" currentKey="outCurrent" areaLabel="Área do par (µm² · log)" currentLabel="I_out (µA)" />
          : <LabChart id={`mirror-${metric}`} config={config} evaluate={(e, l) => evaluate(e, l)[config.key ?? metric]} {...{ efficiency, setEfficiency, length }} />}
        {DEFINITIONS[metric] && <p className="headroom-definition">{DEFINITIONS[metric]}</p>}
      </section>)}
        <section className="card operating-card summary-card"><div className="operating-top"><h2>Ponto selecionado</h2><span className="selected-length" style={{ color: COLORS[LENGTHS.indexOf(length)] }}>L = {fmt(length, 2)} µm</span></div><div className="metrics-grid"><Metric label="CORRENTE COPIADA" symbol="I_out" value={fmt(point.outCurrent)} unit="µA" /><Metric label="ERRO DE CÓPIA" symbol="|ΔI|/I ≈" value={fmt(point.errorPercent, 2)} unit="%" /><Metric label="ÁREA DO PAR" symbol="2·W·L" value={fmt(point.pairArea, 2)} unit="µm²" /><Metric label="V OUT MÍNIMA" symbol="Vᴅs,out,mín =" value={fmt(point.vMinOut, 3)} unit="V" /></div></section></div></div>
      {!point.precise && <div className="warning"><Info size={17} /> Atenção: o erro por mismatch estimado é {fmt(point.errorPercent, 2)}%, acima da meta de {fmt(MIRROR.errorTarget)}%. Para esta corrente, L = {fmt(length, 2)} µm pede uma área maior ou um gₘ/Iᴅ mais alto.</div>}
      <footer><span>Modelo didático · Não validado para fabricação</span></footer>
    </LabShell>
    {modal && <LabDialog onClose={() => setModal(null)} title={modal === 'guide' ? 'Do gₘ/Iᴅ ao espelho de corrente' : modal === 'data' ? 'Sobre estas curvas' : modal} icon={modal === 'guide' ? <BookOpen size={25} /> : <FlaskConical size={25} />} actionLabel={modal === 'guide' ? 'Vamos experimentar' : 'Entendido'}>
      {modal === 'guide' ? <>
        <p>O espelho tenta fazer <strong>I_out = I_ref</strong>. Como dois transistores reais nunca são iguais, o projeto consiste em controlar <em>quanto</em> eles erram e <em>quanto</em> de tensão o nó de saída precisa para funcionar.</p>
        <ol>
          <li><strong>O gₘ fica fixo em 300 µS.</strong> A corrente de referência vem de I_ref = gₘ/(gₘ/Iᴅ), igual ao fonte comum. Só o gₘ/Iᴅ muda.</li>
          <li><strong>Erro de cópia.</strong> A lei de Pelgrom diz que o desvio padrão de V_T cai com a área: σ(ΔV_T) = K_V/√(W·L). Como I ∝ V_OV², o erro relativo de corrente é σ(ΔV_T)·(gₘ/Iᴅ). Transistores maiores copiam melhor.</li>
          <li><strong>Compliance.</strong> M2 só copia enquanto estiver em saturação, ou seja, enquanto V_DS,out &gt; 2/(gₘ/Iᴅ). Inversão fraca devolve a mesma corrente com menos tensão.</li>
          <li><strong>Compare os L.</strong> Cada curva corresponde a um L, anotado no gráfico. A compliance é igual para todos: ela não depende de L nesta aproximação.</li>
          <li><strong>Leia o par como sistema.</strong> Cópia mais precisa custa área; mais área e mais L compram ganho, mas não devolvem tensão ao nó de saída.</li>
        </ol>
        <div className="formula">I_ref = gₘ / (gₘ/Iᴅ)<br />σ(ΔV_T) = K_V / √(W·L)<br />|ΔI|/I = σ(ΔV_T)·(gₘ/Iᴅ)<br />V_DS,out,mín ≈ 2/(gₘ/Iᴅ)</div>
        <p className="modal-fine">K_V = 0,5 mV·µm é um proxy didático da lei de Pelgrom, não uma extração de PDK. O erro mostrado é 1σ e cobre apenas o mismatch; o erro por modulação de canal (λ·V_DS) entra em quadratura e, neste modelo, varia só com L. A razão é fixa em 1:1; com razão k:1 o erro relativo de mismatch não muda, mas a área escala com k. A compliance ignora efeito de corpo e variação de V_T entre os dois transistores. A tensão de saída V_DS,out = 0,6 V é um ponto DC assumido.</p>
      </> : modal === 'data' ? <>
        <p>O IHP SG13G2 é a tecnologia de referência deste laboratório. <strong>As curvas atuais não foram extraídas do PDK.</strong></p>
        <p>Esta versão usa relações analíticas simplificadas, inspiradas no conceito de inversão do EKV, com normalizações ilustrativas. Efeitos de canal curto, capacitâncias parasitas completas e dependência física de temperatura não são modelados.</p>
        <p>O próximo passo é caracterizar os dispositivos com SPICE e substituir o modelo por tabelas de consulta em função de L, Vᴅs, Vɢs e temperatura.</p>
      </> : <><p>Este bloco fará parte das próximas iterações do laboratório.</p><p>Por enquanto, explore o fonte comum e o espelho de corrente para entender as relações entre eficiência, cópia de corrente e dimensionamento.</p></>}
    </LabDialog>}
  </>;
}

export default CurrentMirrorPage;