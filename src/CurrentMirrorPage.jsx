import React, { useState } from 'react';
import { BookOpen, Download, FlaskConical, Info } from 'lucide-react';
import TradeoffChart from './TradeoffChart';
import LabShell from './LabShell';
import { EfficiencyControl, LabChart, LabDialog, LengthSelector, Metric, fmt } from './labUi';
import { COLORS, LENGTHS } from './model';
import { MIRROR, MIRROR_METRICS, mirrorPoint } from './mirrorModel';

const evaluate = (efficiency, length) => mirrorPoint(efficiency, length);
const DEFINITIONS = {
  // A compliance é o único número do bloco que precisa ser comparado com um valor
  // assumido, então o texto mostra a folga real em vez de repetir a fórmula do cabeçalho.
  compliance: point => {
    const folga = MIRROR.vdsOut - point.vMinOut;
    return `Compliance é a menor tensão que o nó de saída precisa ter para o transistor de saída continuar em saturação. Neste ponto ela vale ${fmt(point.vMinOut, 3)} V, contra os ${fmt(MIRROR.vdsOut, 2)} V de Vᴅs,out assumidos: sobram ${fmt(folga, 3)} V de folga antes de M2 sair de saturação. Abaixo dela o espelho copia menos corrente do que a referência. M1 tem Vᴅs = Vɢs, por isso não existe compliance no ramo de referência.`;
  },
  error: 'Mismatch é o desvio-padrão relativo entre I_out e I_ref. Como I_D ∝ V_OV² em saturação, σ(I_D)/I_D = 2·σ(ΔV_T)/V_OV; com V_OV = 2/(gₘ/Iᴅ) o 2 se cancela e sobra σ(ΔI_D/I_D) ≈ (gₘ/Iᴅ)·A_VT/√(W·L), com A_VT = 0,5 mV·µm (Pelgrom). O erro por modulação de canal (λ·V_DS) também existe, mas neste modelo depende só de L e não muda com o gₘ/Iᴅ. A largura que produz cada curva está no gráfico ao lado.',
  width: 'Largura de cada transistor para a corrente de saída escolhida, em escala log. W = I_out/(I_out/W): em inversão fraca a mesma corrente sai com muito menos largura, mas a compliance mínima sobe e o ganho do par cai.',
};

// Mesmo símbolo do fonte comum: transistor com seta interna, barra de gate à
// esquerda e fonte em zigue-zague até o terra. Só muda o arranjo dos dois ramos.
function MirrorSchematic({ current }) {
  const ground = (x, y) => <path d={`M${x} ${y}v7m-12 0h24m-8 5h16m-4 5h8`} />;
  return <svg className="schematic" viewBox="0 0 300 210" role="img" aria-label="Espelho de corrente NMOS 1 para 1. A fonte ideal injeta I_ref no dreno de M1. M1 é diodo-conectado: seu dreno liga ao próprio gate e ao gate de M2. As fontes vão ao terra; o dreno de M2 é a saída v_out e não está ligado a V_DD.">
    <g fill="none" stroke="#42536b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Rail alimenta apenas a fonte de referência, não o dreno de saída */}
      <path d="M62 24h78M100 24v12" />
      <circle cx="100" cy="52" r="16" />
      <path d="M100 43v18m-5-5 5 5 5-5M100 68v28" />
      {/* M1: drain node y=96, channel x=100, gate à direita (espelhado) */}
      <path d="M100 96v14M100 110v38M127 116v32M100 148v12h-12v22h12v8" />
      <path d="M106 135h11m-4-4 4 4-4 4" />
      {/* M2: canal x=210, gate à esquerda; dreno livre em y=96 */}
      <path d="M210 110v38M183 116v32M210 96v14M210 148v12h12v22h-12v8" />
      <path d="M204 135h-11m4-4-4 4 4 4" />
      {/* diodo: dreno de M1 até o meio do fio de gates, depois às duas barras */}
      <path d="M100 96h55v39M127 135h56" />
      <circle cx="100" cy="96" r="3" fill="#42536b" />
      <circle cx="155" cy="135" r="3" fill="#42536b" />
      {/* output node M2: tap v_out. Isolado do rail V_DD. */}
      <path d="M210 96h48" />
      <circle cx="210" cy="96" r="3" fill="#42536b" />
      {ground(100, 190)}{ground(210, 190)}
    </g>
    <g fontFamily="inherit" fontSize="11" fill="#728096">
      <text x="50" y="20">Vᴅᴅ = 1,2 V</text>
      <text x="78" y="50" textAnchor="end">I_ref = {fmt(current)} µA</text>
      <text x="78" y="65" textAnchor="end" fontSize="9">fonte ideal</text>
      <text x="122" y="163" fill="#344b65">M₁</text>
      <text x="226" y="164" fill="#344b65">M₂</text>
      <text x="258" y="91" fill="#df7037">v_out</text>
      <text x="219" y="112">I_out ≈ {fmt(current)} µA</text>
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
    const rows = ['# Espelho de corrente 1:1; NAO sao dados do PDK IHP SG13G2; modelo didatico; gm fixo 300 uS; sigma(DeltaID/ID) = (gm/ID)*A_VT/sqrt(W*L) com A_VT = 0,5 mV.um (Pelgrom)', 'gm_id_V-1,L_um,I_ref_uA,I_out_uA,W_um,area_par_um2,sigma_VT_V,erro_copia_pct,Vout_min_V,Vout_max_V,ganho_V_V'];
    LENGTHS.forEach(l => { for (let i = 0; i <= 100; i++) { const e = 5 + i * .2, p = evaluate(e, l); rows.push([e, l, p.refCurrent, p.outCurrent, p.width, p.pairArea, p.sigma, p.errorPercent, p.vMinOut, p.vMaxOut, p.gain].join(',')); } });
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'gmid-espelho-ilustrativo.csv'; a.click(); URL.revokeObjectURL(url);
  }
  return <>
    <LabShell activeKey="cm" version="EXPERIMENTO 02" onHelp={() => setModal('guide')} onUnavailable={setModal}>
      <div className="card title-hero"><div className="title-hero-left"><h1>Espelho de corrente<span className="title-tag">CM</span></h1><button className="secondary-button export" onClick={exportCSV}><Download size={15} /> Exportar curvas</button><button className="data-disclaimer" onClick={() => setModal('data')}><Info size={13} /> Curvas ilustrativas · Não extraídas do PDK</button></div><div className="title-hero-circuit"><div className="card-heading"><h2>Circuito</h2><span className="neutral-badge">NMOS</span></div><MirrorSchematic current={point.outCurrent} /><div className="circuit-caption"><span className="small-dot" /> Razão 1:1 · fontes em comum</div><div className="fixed-bias"><p>Vᴅs,out = {fmt(MIRROR.vdsOut, 2)} V · Vᴅᴅ = 1,2 V<br />T = 27 °C</p><div className="formula">I_out ≈ I_ref = gₘ / (gₘ/Iᴅ)</div></div></div></div>
      <div className="controls-grid">
        <EfficiencyControl {...{ efficiency, setEfficiency, regime }} onReset={reset} />
        <LengthSelector {...{ length, setLength }} />
      </div>
      <div className="plots-full"><div className="plots-grid">{Object.entries(MIRROR_METRICS).map(([metric, config]) => <section className={`card plot-card plot-${metric}`} key={metric}>
        <div className="plot-header"><h2>{config.title}</h2>{config.symbol && <span className="plot-symbol">{config.symbol}</span>}</div>
        <div className="regime-labels"><span>FORTE</span><span>MODERADA</span><span>FRACA</span></div>
        {metric === 'width'
          ? <TradeoffChart {...{ efficiency, setEfficiency, length }} evaluate={evaluate} areaKey="width" areaUnit="µm" areaLabel="W (µm · log)" logRange={[0.1, 100]} showCurrent={false} />
          : <LabChart id={`mirror-${metric}`} config={config} evaluate={(e, l) => evaluate(e, l)[config.key ?? metric]} {...{ efficiency, setEfficiency, length }} />}
        {DEFINITIONS[metric] && <p className="headroom-definition">{typeof DEFINITIONS[metric] === 'function' ? DEFINITIONS[metric](point) : DEFINITIONS[metric]}</p>}
      </section>)}
        <section className="card operating-card summary-card"><div className="operating-top"><h2>Ponto selecionado</h2><span className="selected-length" style={{ color: COLORS[LENGTHS.indexOf(length)] }}>L = {fmt(length, 2)} µm</span></div><div className="metrics-grid five"><Metric label="CORRENTE COPIADA" symbol="I_out" value={fmt(point.outCurrent)} unit="µA" /><Metric label="MISMATCH" symbol="σ(ΔIᴅ/Iᴅ) ≈" value={fmt(point.errorPercent, 2)} unit="%" /><Metric label="W NECESSÁRIA" symbol="W por transistor" value={fmt(point.width, 2)} unit="µm" /><Metric label="V OUT MÍNIMA" symbol="Vᴅs,out,mín =" value={fmt(point.vMinOut, 3)} unit="V" /><Metric label="FOLGA DE SAÍDA" symbol="Vᴅs,out − Vᴅs,out,mín =" value={fmt(MIRROR.vdsOut - point.vMinOut, 3)} unit="V" /></div></section></div></div>
      {!point.precise && <div className="warning"><Info size={17} /> Atenção: o erro por mismatch estimado é {fmt(point.errorPercent, 2)}%, acima da meta de {fmt(MIRROR.errorTarget)}%. Para esta corrente, L = {fmt(length, 2)} µm pede uma área maior ou um gₘ/Iᴅ mais alto.</div>}
      <footer><span>Modelo didático · Não validado para fabricação</span></footer>
    </LabShell>
    {modal && <LabDialog onClose={() => setModal(null)} title={modal === 'guide' ? 'Do gₘ/Iᴅ ao espelho de corrente' : modal === 'data' ? 'Sobre estas curvas' : modal} icon={modal === 'guide' ? <BookOpen size={25} /> : <FlaskConical size={25} />} actionLabel={modal === 'guide' ? 'Vamos experimentar' : 'Entendido'}>
      {modal === 'guide' ? <>
        <p>O espelho tenta fazer <strong>I_out = I_ref</strong>. Como dois transistores reais nunca são iguais, o projeto consiste em controlar <em>quanto</em> eles erram e <em>quanto</em> de tensão o nó de saída precisa para funcionar.</p>
        <ol>
          <li><strong>O gₘ fica fixo em 300 µS.</strong> A corrente de referência vem de I_ref = gₘ/(gₘ/Iᴅ), igual ao fonte comum. Só o gₘ/Iᴅ muda.</li>
          <li><strong>Mismatch.</strong> A lei de Pelgrom diz que o desvio padrão de V_T cai com a área: σ(ΔV_T) = A_VT/√(W·L). Como I ∝ V_OV² e V_OV = 2/(gₘ/Iᴅ), o erro relativo de corrente é σ(ΔI_D/I_D) ≈ (gₘ/Iᴅ)·A_VT/√(W·L). Transistores maiores copiam melhor.</li>
          <li><strong>Compliance.</strong> M2 só copia enquanto estiver em saturação, ou seja, enquanto a tensão no nó de saída ficar acima de 2/(gₘ/Iᴅ). Essa é a <em>tensão de compliance mínima</em>: no ponto de partida (gₘ/Iᴅ = 15) ela vale 0,133 V, então sobram 0,467 V até os 0,6 V de V_DS,out assumidos. Inversão fraca entrega a mesma corrente com menos tensão.</li>
          <li><strong>W é a leitura.</strong> O terceiro gráfico dá a largura de cada transistor para a corrente escolhida, em escala log: em inversão fraca a mesma corrente sai com muito menos largura, ao custo de compliance e ganho. <strong>Compare os L.</strong> Cada curva corresponde a um L, anotado no gráfico. A compliance é igual para todos: ela não depende de L nesta aproximação.</li>
          <li><strong>Leia o par como sistema.</strong> Cópia mais precisa custa área; largura e área maiores melhoram o erro de mismatch, mas não devolvem tensão ao nó de saída.</li>
        </ol>
        <div className="formula">I_ref = gₘ / (gₘ/Iᴅ)<br />σ(ΔV_T) = A_VT / √(W·L)<br />σ(ΔIᴅ/Iᴅ) = 2·σ(ΔV_T)/V_OV ≈ (gₘ/Iᴅ)·A_VT/√(W·L)<br />V_DS,out,mín = V_OV ≈ 2/(gₘ/Iᴅ)</div>
        <p className="modal-fine">A tensão de compliance mínima é uma tensão <em>necessária</em> para manter M2 em saturação, não uma excursão de saída nem uma tensão de polarização. Ela não limita o lado alto do sinal: para swing, o teto é V_DD. A_VT = 0,5 mV·µm é um proxy didático da lei de Pelgrom, não uma extração de PDK. O erro mostrado é 1σ e cobre apenas o mismatch; o erro por modulação de canal (λ·V_DS) entra em quadratura e, neste modelo, varia só com L. A razão é fixa em 1:1; com razão k:1 o erro relativo de mismatch não muda, mas a área escala com k. A compliance ignora efeito de corpo e variação de V_T entre os dois transistores. A tensão de saída V_DS,out = 0,6 V é um ponto DC assumido.</p>
      </> : modal === 'data' ? <>
        <p>O IHP SG13G2 é a tecnologia de referência deste laboratório. <strong>As curvas atuais não foram extraídas do PDK.</strong></p>
        <p>Esta versão usa relações analíticas simplificadas, inspiradas no conceito de inversão do EKV, com normalizações ilustrativas. Efeitos de canal curto, capacitâncias parasitas completas e dependência física de temperatura não são modelados.</p>
        <p>O próximo passo é caracterizar os dispositivos com SPICE e substituir o modelo por tabelas de consulta em função de L, Vᴅs, Vɢs e temperatura.</p>
      </> : <><p>Este bloco fará parte das próximas iterações do laboratório.</p><p>Por enquanto, explore o fonte comum e o espelho de corrente para entender as relações entre eficiência, cópia de corrente e dimensionamento.</p></>}
    </LabDialog>}
  </>;
}

export default CurrentMirrorPage;
