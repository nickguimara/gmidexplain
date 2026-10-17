import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import MathFormula from './MathFormula';
import { quantity } from './guideMath';

export function useGuideHeader() {
  const ref = useRef(null);
  useEffect(() => {
    const page = ref.current;
    const header = page?.querySelector('.guide-header');
    if (!page || !header) return;
    const update = () => page.style.setProperty('--guide-header-height', `${header.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(update);
    observer.observe(header);
    update();
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function TransistorChecklist({ length, efficiency, current, width, gm, items: definedItems, heading = 'Seu transistor', footer }) {
  const items = definedItems ?? [
    { key: 'length', symbol: 'L', label: 'Comprimento', value: length, unit: String.raw`\mu\mathrm m` },
    { key: 'efficiency', symbol: String.raw`\frac{g_m}{I_D}`, label: 'Eficiência', value: efficiency, unit: String.raw`\mathrm{V^{-1}}` },
    { key: 'current', symbol: 'I_D', label: 'Corrente', value: current, unit: String.raw`\mu\mathrm A` },
    { key: 'width', symbol: 'W', label: 'Largura', value: width, unit: String.raw`\mu\mathrm m` },
  ];
  return <section className="card transistor-checklist" aria-label={`Checklist de dimensionamento: ${heading}`}><div className="checklist-heading"><h2>{heading}</h2><span aria-live="polite">{items.filter(item => item.value != null).length}/{items.length}</span></div><ul className="checklist-list">{items.map(item => <li key={item.key} data-parameter={item.key} className={item.value != null ? 'complete' : 'pending'} aria-label={`${item.label}: ${item.value != null ? 'dimensionado' : 'pendente'}`}><span className="checklist-check">{item.value != null && <Check size={13} />}</span><span className="checklist-symbol"><MathFormula inline latex={item.symbol} /></span><span className="checklist-value">{item.value == null ? <span className="pending-value">—</span> : <MathFormula inline latex={quantity(item.value, item.unit, 3)} />}</span></li>)}</ul>{definedItems ? footer : gm != null && <div className="checklist-gm"><MathFormula inline latex={String.raw`g_m=${quantity(gm, String.raw`\mu\mathrm S`)}`} /></div>}</section>;
}
