import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, BookOpen, Check, ChevronRight, CircuitBoard, Download, FlaskConical, Info, Layers, Menu, RotateCcw, SlidersHorizontal, X, Zap } from 'lucide-react';
import { designPoint, LENGTHS, COLORS, METRICS, BIAS } from './model';
import AreaCurrentChart from './AreaCurrentChart';
import ExampleLinks from './ExampleLinks';
import { EXAMPLES } from './methodology';
import './styles.css';
import './examples.css';

const MethodologyPage = lazy(() => import('./MethodologyPage'));
const BasicGuidePage = lazy(() => import('./BasicGuidePage'));

const fmt = (n, digits = 1) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(n);
const blocks = [{ title: 'Fonte comum', short: 'CS', text: 'Ganho de tensão e eficiência', active: true }, { title: 'Espelho de corrente', short: 'CM', text: 'Precisão e cópia de corrente' }, { title: 'Carga ativa', short: 'AL', text: 'Impedância e ganho' }, { title: 'Par diferencial', short: 'DP', text: 'Transcondutância e simetria' }];

function Schematic({ current, vds }) {
  return <svg className="schematic" viewBox="0 0 260 215" role="img" aria-label="Circuito fonte comum NMOS com fonte de corrente ideal no dreno, entrada no gate e saída no dreno">
    <g fill="none" stroke="#42536b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M145 25v15M145 80v38M145 96h53M145 118h-17v43h17v24M118 120v39M118 140H57M145 185v8M133 193h24M137 198h16M141 203h8" />
      <circle cx="145" cy="60" r="20" /><path d="M145 48v24m-5-6 5 6 5-6" />
      <path d="M139 153h-10m4-4-4 4 4 4" />
      <circle cx="145" cy="96" r="3" fill="#42536b" /><circle cx="57" cy="140" r="3" fill="#fff" /><circle cx="198" cy="96" r="3" fill="#fff" />
      <path d="M134 25h22" />
    </g>
    <g fontFamily="inherit" fontSize="11" fill="#728096"><text x="128" y="16">Vᴅᴅ = 1,2 V</text><text x="174" y="57">Iᴅ = {fmt(current)} µA</text><text x="174" y="73" fontSize="9">fonte ideal</text><text x="32" y="130" fill="#df7037">vᵢₙ</text><text x="199" y="83" fill="#df7037">vₒᵤₜ</text><text x="158" y="145" fill="#344b65">M₁</text><text x="17" y="183">Vᴅs = {fmt(vds, 2)} V</text></g>
  </svg>;
}

function Chart({ metric, efficiency, setEfficiency, length }) {
  const [hover, setHover] = useState(null);
  const config = METRICS[metric];
  const tall = metric === 'ft';
  const w = 520, h = tall ? 452 : 300, pad = tall ? { left: 58, right: 120, top: 26, bottom: 50 } : { left: 58, right: 120, top: 26, bottom: 48 };
  const clipId = `plot-clip-${metric}`;
  const curves = config.shared ? [length] : LENGTHS;
  const curveColor = l => config.shared ? '#526880' : COLORS[LENGTHS.indexOf(l)];
  const values = curves.flatMap(l => Array.from({ length: 101 }, (_, i) => designPoint(5 + i * .2, l)[metric]));
  const rawMax = Math.max(...values) * 1.08;
  const magnitude = 10 ** Math.floor(Math.log10(rawMax));
  const max = Math.ceil(rawMax / magnitude / 2) * magnitude * 2;
  const x = v => pad.left + (v - 5) / 20 * (w - pad.left - pad.right);
  const y = v => h - pad.bottom - v / max * (h - pad.top - pad.bottom);
  const hoverValue = hover === null ? null : designPoint(hover, length)[metric];
  // Keep direct labels readable, even when curve endpoints converge near zero.
  const labels = curves.map(l => ({ l, endpoint: y(designPoint(25, l)[metric]) })).sort((a, b) => a.endpoint - b.endpoint);
  labels.forEach((label, i) => { label.labelY = Math.max(label.endpoint, i ? labels[i - 1].labelY + 23 : pad.top + 5); });
  const overflow = Math.max(0, labels.at(-1).labelY - (h - pad.bottom - 4));
  labels.forEach(label => { label.labelY -= overflow; });
  function position(e) { const rect = e.currentTarget.getBoundingClientRect(); return Math.min(25, Math.max(5, 5 + (((e.clientX - rect.left) / rect.width * w) - pad.left) / (w - pad.left - pad.right) * 20)); }
  return <div className="chart-wrap"><svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label={`${config.title} versus gm/ID. Use o controle deslizante para alterar o ponto.`} onMouseMove={e => setHover(position(e))} onMouseLeave={() => setHover(null)} onClick={e => setEfficiency(Math.round(position(e) * 10) / 10)}>
    <defs><clipPath id={clipId}><rect x={pad.left} y={pad.top} width={w - pad.left - pad.right} height={h - pad.top - pad.bottom} /></clipPath></defs>
    <rect x={x(5)} y={pad.top} width={x(10) - x(5)} height={h - pad.top - pad.bottom} fill="#f0f4fa" /><rect x={x(10)} y={pad.top} width={x(20) - x(10)} height={h - pad.top - pad.bottom} fill="#f1f7f4" /><rect x={x(20)} y={pad.top} width={x(25) - x(20)} height={h - pad.top - pad.bottom} fill="#fff5ea" />
    {Array.from({ length: 5 }, (_, i) => <g key={i}><line x1={pad.left} x2={w - pad.right} y1={y(max * i / 4)} y2={y(max * i / 4)} stroke="#e6eaf0" strokeDasharray="3 4" /><text x={pad.left - 12} y={y(max * i / 4) + 4} textAnchor="end" className="axis-text">{fmt(max * i / 4, 2)}</text></g>)}
    {[5, 10, 15, 20, 25].map(v => <g key={v}><text x={x(v)} y={h - 27} textAnchor="middle" className="axis-text">{v}</text></g>)}
    <text x={pad.left} y={16} className="axis-text">{config.unit}</text><text x={(pad.left + w - pad.right) / 2} y={h - 4} textAnchor="middle" className="axis-label">gₘ/Iᴅ (V⁻¹)</text>
    <g clipPath={`url(#${clipId})`}>{curves.map(l => <path key={l} d={Array.from({ length: 101 }, (_, i) => { const v = 5 + i * .2; return `${i === 0 ? 'M' : 'L'}${x(v)},${y(designPoint(v, l)[metric])}`; }).join(' ')} fill="none" stroke={curveColor(l)} strokeWidth={l === length ? 3 : 2} opacity={l === length ? 1 : .85} />)}
    <line x1={x(efficiency)} x2={x(efficiency)} y1={pad.top} y2={h - pad.bottom} stroke="#7d8796" strokeDasharray="4 5" />{curves.map(l => <circle key={l} cx={x(efficiency)} cy={y(designPoint(efficiency, l)[metric])} r={l === length ? 5 : 3} fill="#fff" stroke={curveColor(l)} strokeWidth="2" />)}
    {hover !== null && <><line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={h - pad.bottom} stroke="#8290a4" strokeDasharray="3 4" /><circle cx={x(hover)} cy={y(hoverValue)} r="4" fill="#344b65" /></>}</g>
    {labels.map(label => <g key={label.l}><path d={`M${x(25)},${label.endpoint} L${x(25) + 10},${label.labelY} H${x(25) + 16}`} fill="none" stroke={curveColor(label.l)} strokeWidth="1" strokeDasharray="2 3" opacity=".8" /><text className="curve-label" x={x(25) + 20} y={label.labelY + 4.5} fill={curveColor(label.l)} fontWeight={label.l === length ? 700 : 600}>{config.shared ? 'Todos os L' : `L = ${fmt(label.l, 2)} µm`}</text></g>)}
  </svg>{hover !== null && <div className="chart-tooltip">L = {fmt(length, 2)} µm · gₘ/Iᴅ {fmt(hover)}<span>{fmt(hoverValue, 2)} {config.unit} · Clique para selecionar</span></div>}</div>;
}

function App() {
  const [efficiency, setEfficiency] = useState(15);
  const [length, setLength] = useState(.5);
  const { vds } = BIAS;
  const current = BIAS.gm / efficiency;
  const [modal, setModal] = useState(null);
  const [menu, setMenu] = useState(false);
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const focusable = () => [...dialog.querySelectorAll('button, a[href], input, select, [tabindex="0"]')];
    focusable()[0]?.focus();
    function handleKey(event) {
      if (event.key === 'Escape') setModal(null);
      if (event.key !== 'Tab') return;
      const controls = focusable();
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, [modal]);
  const point = designPoint(efficiency, length);
  const regime = efficiency < 10 ? 'Inversão forte' : efficiency <= 20 ? 'Inversão moderada' : 'Inversão fraca';
  function reset() { setEfficiency(15); setLength(.5); }
  function exportCSV() {
    const rows = ['# Modelo ilustrativo; NAO sao dados do PDK IHP SG13G2; carga ideal; gm fixo 300 uS; area de gate nao inclui layout; headroom NMOS aproximado por 2/(gm/ID)', 'gm_id_V-1,L_um,ID_uA,VDS_V,gm_uS,W_um,gate_area_um2,power_uW,headroom_V,gm_gds,ft_GHz,gain_magnitude_V_V'];
    LENGTHS.forEach(l => { for (let i = 0; i <= 100; i++) { const e = 5 + i * .2, p = designPoint(e, l); rows.push([e, l, p.current, vds, p.gm, p.width, p.area, p.power, p.headroom, p.intrinsicGain, p.ft, p.gain].join(',')); } });
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'gmid-cs-ilustrativo.csv'; a.click(); URL.revokeObjectURL(url);
  }
  return <div className="app-shell">
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <a className="brand" href="./" aria-label="gm/ID lab início"><span className="brand-mark"><CircuitBoard size={23} /></span><span>gₘ/Iᴅ<span className="brand-lab"> lab</span><small>ANALOG DESIGN, EXPLAINED.</small></span></a>
      <div className="nav-caption">SEU LABORATÓRIO</div>
      <nav>{blocks.map((b, i) => <button key={b.short} className={`nav-block ${b.active ? 'active' : ''}`} onClick={() => { if (!b.active) setModal(b.title); setMenu(false); }}><span className="block-icon">{i === 0 ? <Zap size={18} /> : i === 1 ? <CircuitBoard size={18} /> : i === 2 ? <Layers size={18} /> : <SlidersHorizontal size={18} />}</span><span>{b.title}<small>{b.active ? 'Common source' : 'Em breve'}</small></span>{b.active && <span className="active-dot" />}</button>)}</nav>
      <div className="sidebar-divider" /><button className="guide-nav" onClick={() => setModal('guide')}><BookOpen size={17} /> Guia do método <ArrowUpRight size={14} /></button>
      <button className="guide-nav examples-nav" onClick={() => document.getElementById('examples-title')?.scrollIntoView({ block: 'start' })}><SlidersHorizontal size={17} /> Exemplos guiados <ChevronRight size={14} /></button>
      <div className="sidebar-bottom"><div className="pdk-label"><span /> TECNOLOGIA DE REFERÊNCIA<strong>IHP SG13G2 <span>130 nm</span></strong></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" onClick={() => setMenu(!menu)} aria-label="Abrir menu"><Menu size={20} /></button><span>Laboratório</span><ChevronRight size={14} /><strong>Fonte comum</strong></div><div className="topbar-right"><span className="version">EXPERIMENTO 01</span><button className="help-button" onClick={() => setModal('guide')}><BookOpen size={15} /> Como usar</button></div></header>
      <main><section className="page-heading"><h1>Fonte comum<span className="title-tag">CS</span></h1><button className="secondary-button export" onClick={exportCSV}><Download size={15} /> Exportar curvas</button></section>
      <button className="data-disclaimer" onClick={() => setModal('data')}><Info size={13} /> Curvas ilustrativas · Não extraídas do PDK</button>
      <section className="card focus-control"><div className="focus-heading"><div><h2>gₘ = 300 µS <span className="fixed-tag">fixo</span></h2></div><span className="regime-badge"><span />{regime}</span><button className="icon-button" onClick={reset} title="Restaurar ponto inicial" aria-label="Restaurar ponto inicial"><RotateCcw size={15} /></button></div><div className="efficiency-control"><label htmlFor="efficiency">gₘ/Iᴅ</label><output>{fmt(efficiency)} <small>V⁻¹</small></output></div>
        <input className="efficiency-range" id="efficiency" type="range" min="5" max="25" step=".1" value={efficiency} aria-valuetext={`${fmt(efficiency)} V⁻¹, ${regime}`} onChange={e => setEfficiency(+e.target.value)} />
        <div className="inversion-ticks" aria-hidden="true">{[5, 10, 15, 20, 25].map((value, i) => <span key={value} style={{ left: `${i * 25}%` }}>{value}</span>)}</div>
        <div className="inversion-zones" aria-label="Regiões de inversão, faixas didáticas aproximadas" title="Faixas didáticas aproximadas, não limites físicos exatos">
          <div className={`inversion-zone strong ${efficiency < 10 ? 'current' : ''}`} aria-current={efficiency < 10 ? 'true' : undefined}>Inversão forte</div>
          <div className={`inversion-zone moderate ${efficiency >= 10 && efficiency <= 20 ? 'current' : ''}`} aria-current={efficiency >= 10 && efficiency <= 20 ? 'true' : undefined}>Inversão moderada</div>
          <div className={`inversion-zone weak ${efficiency > 20 ? 'current' : ''}`} aria-current={efficiency > 20 ? 'true' : undefined}>Inversão fraca</div>
        </div>
      </section>
      <div className="workspace overview-workspace"><div className="left-column"><section className="card circuit-card"><div className="card-heading"><h2>Circuito</h2><span className="neutral-badge">NMOS</span></div><Schematic current={current} vds={vds} /><div className="circuit-caption"><span className="small-dot" /> Fonte de corrente ideal</div><div className="fixed-bias"><p>Vᴅs = 0,6 V · Vᴅᴅ = 1,2 V<br />T = 27 °C</p><div className="formula">Iᴅ = gₘ / (gₘ/Iᴅ)</div></div></section>
      <section className="card comparison-card"><h2>Comprimento de canal</h2><div className="length-key">{LENGTHS.map((l, i) => <button key={l} aria-pressed={length === l} onClick={() => setLength(l)} className={length === l ? 'selected' : ''} style={{ '--curve-color': COLORS[i] }}><span />L = {fmt(l, 2)} µm{length === l && <Check size={13} />}</button>)}</div></section></div>
      <div className="right-column"><div className="plots-grid">{Object.entries(METRICS).map(([metric, config]) => <section className={`card plot-card plot-${metric}`} key={metric}>
        <div className="plot-header"><h2>{config.title}</h2>{config.symbol && <span className="plot-symbol">{config.symbol}</span>}</div>
        <div className="regime-labels"><span>FORTE</span><span>MODERADA</span><span>FRACA</span></div>
        {metric === 'areaCurrent' ? <AreaCurrentChart {...{ efficiency, setEfficiency, length }} /> : <Chart {...{ metric, efficiency, setEfficiency, length }} />}
        {metric === 'headroom' && <p className="headroom-definition">Headroom é a tensão mínima que o transistor precisa entre dreno e fonte para operar em saturação, região em que queremos usá-lo como amplificador.</p>}
      </section>)}
      <section className="card operating-card summary-card"><div className="operating-top"><h2>Ponto selecionado</h2><span className="selected-length" style={{ color: COLORS[LENGTHS.indexOf(length)] }}>L = {fmt(length, 2)} µm</span></div><div className="metrics-grid"><Metric label="GANHO" symbol="|Aᵥ|" value={fmt(point.gain)} unit="V/V" /><Metric label="HEADROOM NMOS" symbol="Vᴅs,sat ≈" value={fmt(point.headroom, 3)} unit="V" /><Metric label="ÁREA" symbol="W·L" value={fmt(point.area, 2)} unit="µm²" /><Metric label="CORRENTE" symbol="Iᴅ" value={fmt(point.current)} unit="µA" /></div></section></div></div></div>
      {!point.saturated && <div className="warning"><Info size={17} /> Atenção: Vᴅs &lt; 2/(gₘ/Iᴅ). Pela aproximação didática, a saturação não está garantida; não use os ganhos exibidos como previsão física.</div>}
      <ExampleLinks />
      <footer><span>Modelo didático · Não validado para fabricação</span></footer></main></div>
      {modal && <div className="modal-backdrop" onClick={() => setModal(null)}>
        <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close icon-button" onClick={() => setModal(null)} aria-label="Fechar"><X size={21} /></button>
          <div className="modal-icon">{modal === 'guide' ? <BookOpen size={25} /> : <FlaskConical size={25} />}</div>
          <h2 id="modal-title">{modal === 'guide' ? 'Do gₘ/Iᴅ ao dimensionamento' : modal === 'data' ? 'Sobre estas curvas' : modal}</h2>
          {modal === 'guide' ? <>
            <p>O método gₘ/Iᴅ permite escolher a eficiência do transistor antes de calcular sua largura. Aqui, só uma variável muda: o gₘ/Iᴅ.</p>
            <ol>
              <li><strong>O gₘ fica fixo em 300 µS.</strong> Comparamos projetos de mesma transcondutância, em Vᴅs = 0,6 V. A corrente é Iᴅ = gₘ/(gₘ/Iᴅ).</li>
              <li><strong>Mova o gₘ/Iᴅ.</strong> Observe ganho, headroom, fT e o compromisso área × corrente. Mais eficiência exige menos corrente, mas maior área.</li>
              <li><strong>Headroom é tensão necessária, não swing.</strong> Aqui é a tensão mínima dreno–fonte estimada para manter o NMOS em saturação: Vᴅs,sat ≈ 2/(gₘ/Iᴅ). Quanto menor, menos tensão o transistor exige. Não é a excursão de sinal nem o Vᴅs de polarização.</li>
              <li><strong>Compare as cores.</strong> Cada curva corresponde a um L, anotado no gráfico. O headroom não depende de L nesta aproximação; por isso aparece uma única curva.</li>
              <li><strong>Relacione os compromissos.</strong> Mais ganho e eficiência geralmente custam área e velocidade.</li>
            </ol>
            <div className="formula">Iᴅ = gₘ / (gₘ/Iᴅ)<br />Área de gate = W·L<br />Aᵥ ≈ −gₘrₒ = −gₘ/gds<br />Headroom NMOS ≈ 2/(gₘ/Iᴅ)</div>
            <p className="modal-fine">A aproximação 2/(gₘ/Iᴅ) é didática, não uma extração de Vᴅs,sat do PDK; especialmente em inversão fraca, a relação física não segue simplesmente essa expressão. A carga ideal tem resistência incremental infinita e não exige headroom adicional; uma carga real exigiria. O limite superior Vᴅᴅ é uma convenção do circuito alimentado. A área é apenas W·L do NMOS, sem layout ou implementação da carga; seu eixo é logarítmico. A corrente indica consumo: PDC = Vᴅᴅ·Iᴅ. Vᴅs é um ponto DC assumido, não determinado pela fonte ideal. fT não é a largura de banda do amplificador.</p>
          </> : modal === 'data' ? <>
            <p>O IHP SG13G2 é a tecnologia de referência deste laboratório. <strong>As curvas atuais não foram extraídas do PDK.</strong></p>
            <p>Esta versão usa relações analíticas simplificadas, inspiradas no conceito de inversão do EKV, com normalizações ilustrativas. Efeitos de canal curto, capacitâncias parasitas completas e dependência física de temperatura não são modelados.</p>
            <p>O próximo passo é caracterizar os dispositivos com SPICE e substituir o modelo por tabelas de consulta em função de L, Vᴅs, Vɢs e temperatura.</p>
          </> : <><p>Este bloco fará parte das próximas iterações do laboratório.</p><p>Por enquanto, explore o fonte comum para entender as relações entre eficiência, ganho, corrente e dimensionamento.</p></>}
          <button className="primary-button" onClick={() => setModal(null)}><Check size={16} /> {modal === 'guide' ? 'Vamos experimentar' : 'Entendido'}</button>
        </section>
      </div>}
    </div>;
}
function Metric({ label, symbol, value, unit }) { return <div className="metric"><div className="metric-label">{label}<span>{symbol}</span></div><div className="metric-value">{value}<small>{unit}</small></div></div>; }

function Router() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    const navigate = () => { setRoute(window.location.hash.slice(1) || '/'); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => { if (route === '/') document.title = 'gm/ID lab · Laboratório CMOS'; }, [route]);
  const example = EXAMPLES.find(item => route === `/exemplos/${item.slug}` || item.aliases?.some(alias => route === `/exemplos/${alias}`));
  if (example?.disabled) return <div className="guide-page"><main className="guide-main"><h1>Exemplo em breve</h1><p>Este exemplo está temporariamente desabilitado. Por enquanto, explore o fluxo básico.</p><a className="primary-button" href="#/">Voltar ao laboratório</a></main></div>;
  if (example) return <Suspense fallback={<div className="worksheet-loading" role="status">Abrindo exemplo…</div>}>{example.flow === 'basic' ? <BasicGuidePage key={example.slug} example={example} /> : <MethodologyPage key={example.slug} example={example} />}</Suspense>;
  if (route !== '/') return <div className="guide-main"><h1>Exemplo não encontrado</h1><a className="primary-button" href="#/">Voltar ao laboratório</a></div>;
  return <App />;
}

createRoot(document.getElementById('root')).render(<Router />);
