import React, { lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, Download, FlaskConical, Info } from 'lucide-react';
import { designPoint, LENGTHS, COLORS, METRICS, BIAS } from './model';
import TradeoffChart from './TradeoffChart';
import ExampleLinks from './ExampleLinks';
import LabShell from './LabShell';
import MathFormula from './MathFormula';
import { CommonSourceSchematic as Schematic } from './CircuitSchematics';
import { EfficiencyControl, LabChart, LabDialog, LengthSelector, Metric, fmt } from './labUi';
import { EXAMPLES } from './methodology';
import { BLOCK_EXAMPLES } from './blockExamples';
import './styles.css';
import './examples.css';

const MethodologyPage = lazy(() => import('./MethodologyPage'));
const BasicGuidePage = lazy(() => import('./BasicGuidePage'));
const BlockGuidePage = lazy(() => import('./BlockGuidePage'));
const CurrentMirrorPage = lazy(() => import('./CurrentMirrorPage'));
const ActiveLoadPage = lazy(() => import('./ActiveLoadPage'));
const DifferentialPage = lazy(() => import('./DifferentialPage'));

function CommonSourcePage() {
  const [efficiency, setEfficiency] = useState(15);
  const [length, setLength] = useState(.5);
  const { vds } = BIAS;
  const current = BIAS.gm / efficiency;
  const [modal, setModal] = useState(null);
  const point = designPoint(efficiency, length);
  const regime = efficiency < 10 ? 'Inversão forte' : efficiency <= 20 ? 'Inversão moderada' : 'Inversão fraca';
  function reset() { setEfficiency(15); setLength(.5); }
  function exportCSV() {
    const rows = ['# Modelo ilustrativo; NAO sao dados do PDK IHP SG13G2; carga ideal; gm fixo 300 uS; area de gate nao inclui layout; VDSmin por criterio de 99% da corrente direta (proxy EKV)', 'gm_id_V-1,L_um,ID_uA,VDS_V,gm_uS,W_um,gate_area_um2,power_uW,VDSmin_99pct_V,gm_gds,ft_GHz,gain_magnitude_V_V'];
    LENGTHS.forEach(l => { for (let i = 0; i <= 100; i++) { const e = 5 + i * .2, p = designPoint(e, l); rows.push([e, l, p.current, vds, p.gm, p.width, p.area, p.power, p.headroom, p.intrinsicGain, p.ft, p.gain].join(',')); } });
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'gmid-cs-ilustrativo.csv'; a.click(); URL.revokeObjectURL(url);
  }
  return <>
    <LabShell activeKey="cs" version="EXPERIMENTO 01" onHelp={() => setModal('guide')} onUnavailable={setModal} showExamples>
      <div className="card title-hero"><div className="title-hero-left"><h1>Fonte comum<span className="title-tag">CS</span></h1><button className="secondary-button export" onClick={exportCSV}><Download size={15} /> Exportar curvas</button><button className="data-disclaimer" onClick={() => setModal('data')}><Info size={13} /> Curvas ilustrativas · Não extraídas do PDK</button></div><div className="title-hero-circuit"><div className="card-heading"><h2>Circuito</h2><span className="neutral-badge">NMOS</span></div><Schematic current={current} vds={vds} /><div className="circuit-caption"><span className="small-dot" /> Fonte de corrente ideal</div><div className="fixed-bias"><p>Vᴅs = 0,6 V · Vᴅᴅ = 1,2 V<br />T = 27 °C</p><div className="formula">Iᴅ = gₘ / (gₘ/Iᴅ)</div></div></div></div>
      <div className="controls-grid">
        <EfficiencyControl {...{ efficiency, setEfficiency, regime }} onReset={reset} />
        <LengthSelector {...{ length, setLength }} />
      </div>
      <div className="plots-full"><div className="plots-grid">{Object.entries(METRICS).map(([metric, config]) => <section className={`card plot-card plot-${metric}`} key={metric}>
        <div className="plot-header"><h2>{config.title}</h2>{config.symbol && <span className="plot-symbol">{metric === 'headroom' ? <MathFormula inline latex={String.raw`I_D/I_F=99\%`} /> : config.symbol}</span>}</div>
        {metric === 'areaCurrent'
          ? <div className="tradeoff-context">Comparação a gm = 300 µS · η = gm/ID</div>
          : <div className="regime-labels"><span>FORTE</span><span>MODERADA</span><span>FRACA</span></div>}
        {metric === 'areaCurrent' ? <TradeoffChart {...{ efficiency, setEfficiency, length }} /> : <LabChart id={`cs-${metric}`} config={config} evaluate={(e, l) => designPoint(e, l)[metric]} tall={metric === 'ft'} {...{ efficiency, setEfficiency, length }} />}
        {metric === 'headroom' && <p className="headroom-definition">Tensão mínima estimada pelo critério operacional de 99% da corrente direta: a componente reversa fica em até 1%. Proxy inspirado no EKV, sem extração do PDK; não é a regra 2/(gm/ID), nem swing. Curva comum aos L porque este proxy ignora a dependência de saturação com L.</p>}
        {metric === 'areaCurrent' && <p className="headroom-definition">gm = 300 µS fixo, com gm/ID no eixo x dos dois painéis. Acima, área de gate (log) por L; abaixo, corrente de dreno (linear), igual para todos os L. Neste ponto: {fmt(point.current, 1)} µA e {fmt(point.area, 3)} µm². Clique para selecionar gm/ID.</p>}
      </section>)}
        <section className="card operating-card summary-card"><div className="operating-top"><h2>Ponto selecionado</h2><span className="selected-length" style={{ color: COLORS[LENGTHS.indexOf(length)] }}>L = {fmt(length, 2)} µm</span></div><div className="metrics-grid"><Metric label="GANHO" symbol="|Aᵥ|" value={fmt(point.gain)} unit="V/V" /><Metric label="SATURAÇÃO MÍNIMA (99%)" symbol={<MathFormula inline latex={String.raw`V_{DS,\min}\approx`} />} value={fmt(point.headroom, 3)} unit="V" /><Metric label="ÁREA" symbol="W·L" value={fmt(point.area, 2)} unit="µm²" /><Metric label="CORRENTE" symbol="Iᴅ" value={fmt(point.current)} unit="µA" /></div></section></div></div>
      {!point.saturated && <div className="warning"><Info size={17} /> V_DS abaixo da tensão mínima estimada pelo critério de 99%. Não use os ganhos como previsão física neste ponto.</div>}
      <ExampleLinks />
      <footer><span>Modelo didático · Não validado para fabricação</span></footer>
    </LabShell>
    {modal && <LabDialog onClose={() => setModal(null)} title={modal === 'guide' ? 'Do gₘ/Iᴅ ao dimensionamento' : modal === 'data' ? 'Sobre estas curvas' : modal} icon={modal === 'guide' ? <BookOpen size={25} /> : <FlaskConical size={25} />} actionLabel={modal === 'guide' ? 'Vamos experimentar' : 'Entendido'}>
      {modal === 'guide' ? <>
        <p>O método gₘ/Iᴅ permite escolher a eficiência do transistor antes de calcular sua largura. Aqui, só uma variável muda: o gₘ/Iᴅ.</p>
        <ol>
          <li><strong>O gₘ fica fixo em 300 µS.</strong> Comparamos projetos de mesma transcondutância, em Vᴅs = 0,6 V. A corrente é Iᴅ = gₘ/(gₘ/Iᴅ).</li>
          <li><strong>Mova o gₘ/Iᴅ.</strong> Observe ganho, headroom, fT e o compromisso área × corrente. Mais eficiência exige menos corrente, mas maior área.</li>
          <li><strong>Tensão mínima de saturação.</strong> A estimativa usa um proxy inspirado no EKV com corrente reversa de até 1% da direta. Não é uma tensão extraída do PDK, não é swing e não é universalmente igual a 2/(gm/ID).</li>
          <li><strong>Compare as cores.</strong> Cada curva corresponde a um L, anotado no gráfico. O headroom não depende de L nesta aproximação; por isso aparece uma única curva.</li>
          <li><strong>Relacione os compromissos.</strong> Mais ganho e eficiência geralmente custam área e velocidade.</li>
        </ol>
        <MathFormula latex={String.raw`I_D=\frac{g_m}{g_m/I_D},\quad A_g=WL,\quad |A_v|=\frac{g_m}{g_{ds}},\quad I_D/I_F=99\%`} />
        <p className="modal-fine">A tensão mínima depende do critério de saturação adotado. Aqui usamos 99% da corrente direta num proxy sem canal curto, não LUTs de SPICE. A densidade e as capacitâncias continuam analíticas e ilustrativas. A carga ideal não exige tensão adicional. A área é só W·L do NMOS. V_DS é um ponto DC assumido e fT não é banda do amplificador.</p>
      </> : modal === 'data' ? <>
        <p>O IHP SG13G2 é a tecnologia de referência deste laboratório. <strong>As curvas atuais não foram extraídas do PDK.</strong></p>
        <p>Esta versão usa relações analíticas simplificadas, inspiradas no conceito de inversão do EKV, com normalizações ilustrativas. Efeitos de canal curto, capacitâncias parasitas completas e dependência física de temperatura não são modelados.</p>
        <p>O próximo passo é caracterizar os dispositivos com SPICE e substituir o modelo por tabelas de consulta em função de L, Vᴅs, Vɢs e temperatura.</p>
      </> : <><p>Este bloco fará parte das próximas iterações do laboratório.</p><p>Por enquanto, explore o fonte comum e o espelho de corrente para entender as relações entre eficiência, ganho, corrente e dimensionamento.</p></>}
    </LabDialog>}
  </>;
}

function Router() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    const navigate = () => { setRoute(window.location.hash.slice(1) || '/'); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  const TITLES = { '/': 'gm/ID lab · Laboratório CMOS', '/espelho': 'gm/ID lab · Espelho de corrente', '/carga-ativa': 'gm/ID lab · Carga ativa', '/par-diferencial': 'gm/ID lab · Par diferencial' };
  useEffect(() => { document.title = TITLES[route] ?? 'gm/ID lab · Laboratório CMOS'; }, [route]);
  const example = EXAMPLES.find(item => route === `/exemplos/${item.slug}` || item.aliases?.some(alias => route === `/exemplos/${alias}`));
  if (example?.disabled) return <div className="guide-page"><main className="guide-main"><h1>Exemplo em breve</h1><p>Este exemplo está temporariamente desabilitado. Por enquanto, explore o fluxo básico.</p><a className="primary-button" href="#/">Voltar ao laboratório</a></main></div>;
  if (example) return <Suspense fallback={<div className="worksheet-loading" role="status">Abrindo exemplo…</div>}>{example.flow === 'basic' ? <BasicGuidePage key={example.slug} example={example} /> : <MethodologyPage key={example.slug} example={example} />}</Suspense>;
  const blockExample = BLOCK_EXAMPLES.find(item => route === `/exemplos/${item.slug}`);
  if (blockExample) return <Suspense fallback={<div className="worksheet-loading" role="status">Abrindo exemplo…</div>}><BlockGuidePage key={blockExample.slug} example={blockExample} /></Suspense>;
  if (route === '/espelho') return <Suspense fallback={<div className="worksheet-loading" role="status">Abrindo o espelho de corrente…</div>}><CurrentMirrorPage /></Suspense>;
  if (route === '/carga-ativa') return <Suspense fallback={<div className="worksheet-loading" role="status">Abrindo a carga ativa…</div>}><ActiveLoadPage /></Suspense>;
  if (route === '/par-diferencial') return <Suspense fallback={<div className="worksheet-loading" role="status">Abrindo o par diferencial…</div>}><DifferentialPage /></Suspense>;
  if (route !== '/') return <div className="guide-main"><h1>Exemplo não encontrado</h1><a className="primary-button" href="#/">Voltar ao laboratório</a></div>;
  return <CommonSourcePage />;
}

createRoot(document.getElementById('root')).render(<Router />);
