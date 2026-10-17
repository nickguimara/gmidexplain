import React, { useState } from 'react';
import { ArrowUpRight, BookOpen, CircuitBoard, ChevronRight, Layers, Menu, SlidersHorizontal, Zap } from 'lucide-react';

export const CIRCUIT_BLOCKS = [
  { key: 'cs', short: 'CS', title: 'Fonte comum', text: 'Ganho de tensão e eficiência', tag: 'Common source', route: '#/' },
  { key: 'cm', short: 'CM', title: 'Espelho de corrente', text: 'Precisão e cópia de corrente', tag: 'Current mirror', route: '#/espelho' },
  { key: 'al', short: 'AL', title: 'Carga ativa', text: 'Impedância e ganho', tag: 'Active load', route: '#/carga-ativa' },
  { key: 'dp', short: 'DP', title: 'Par diferencial', text: 'Transcondutância e simetria', tag: 'Em breve' },
];
const ICONS = [<Zap size={18} />, <CircuitBoard size={18} />, <Layers size={18} />, <SlidersHorizontal size={18} />];

// Casca compartilhada: menu lateral, barra superior e conteúdo de cada circuito.
// onHelp abre o guia do bloco atual; onUnavailable mostra "em breve" nos blocos futuros.
export default function LabShell({ activeKey, version, onHelp, onUnavailable, showExamples = false, children }) {
  const [menu, setMenu] = useState(false);
  const block = CIRCUIT_BLOCKS.find(item => item.key === activeKey) ?? CIRCUIT_BLOCKS[0];
  function go(item) {
    if (item.route) { if (window.location.hash !== item.route) window.location.hash = item.route; }
    else onUnavailable(item.title);
    setMenu(false);
  }
  return <div className="app-shell">
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <a className="brand" href="./" aria-label="gm/ID lab início"><span className="brand-mark"><CircuitBoard size={23} /></span><span>gₘ/Iᴅ<span className="brand-lab"> lab</span><small>ANALOG DESIGN, EXPLAINED.</small></span></a>
      <div className="nav-caption">SEU LABORATÓRIO</div>
      <nav>{CIRCUIT_BLOCKS.map((b, i) => <button key={b.short} className={`nav-block ${b.key === activeKey ? 'active' : ''}`} onClick={() => go(b)}><span className="block-icon">{ICONS[i]}</span><span>{b.title}<small>{b.tag}</small></span>{b.key === activeKey && <span className="active-dot" />}</button>)}</nav>
      <div className="sidebar-divider" /><button className="guide-nav" onClick={onHelp}><BookOpen size={17} /> Guia do método <ArrowUpRight size={14} /></button>
      {showExamples && <button className="guide-nav examples-nav" onClick={() => document.getElementById('examples-title')?.scrollIntoView({ block: 'start' })}><SlidersHorizontal size={17} /> Exemplos guiados <ChevronRight size={14} /></button>}
      <div className="sidebar-bottom"><div className="pdk-label"><span /> TECNOLOGIA DE REFERÊNCIA<strong>IHP SG13G2 <span>130 nm</span></strong></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" onClick={() => setMenu(!menu)} aria-label="Abrir menu"><Menu size={20} /></button><span>Laboratório</span><ChevronRight size={14} /><strong>{block.title}</strong></div><div className="topbar-right"><span className="version">{version}</span><button className="help-button" onClick={onHelp}><BookOpen size={15} /> Como usar</button></div></header>
      <main>{children}</main>
    </div>
  </div>;
}