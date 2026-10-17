import React from 'react';
import { ArrowRight } from 'lucide-react';
import { EXAMPLES } from './methodology';
import { BLOCK_EXAMPLES } from './blockExamples';

// O bloco 1 (fonte comum) usa o fluxo básico de EXAMPLES; os demais blocos
// mostram o guia do próprio bloco. Cada página lista só os seus exemplos.
const HEADINGS = {
  mirror: { title: 'Dimensione um espelho de corrente', note: 'Precisão, compliance e área.' },
  active: { title: 'Dimensione uma carga ativa', note: 'Corrente, largura e ganho.' },
  diff: { title: 'Dimensione um par diferencial', note: 'Frequência, largura e corrente de cauda.' },
};

export default function ExampleLinks({ block }) {
  const items = block ? BLOCK_EXAMPLES.filter(example => example.block === block) : EXAMPLES;
  const heading = block ? HEADINGS[block] : { title: 'Dimensione um fonte comum', note: 'Requisitos, escolhas e dimensões.' };
  return <section className="examples-section" aria-labelledby="examples-title"><div className="examples-section-heading"><div><span className="section-kicker">APLIQUE O MÉTODO</span><h2 id="examples-title">{heading.title}</h2></div><span>{heading.note}</span></div><div className="example-links">{items.map(example => example.disabled ? <span className="example-link disabled" key={example.slug} aria-disabled="true" title="Exemplo temporariamente desabilitado"><span className="example-number">{example.number}</span><span><small>EM BREVE</small><strong>{example.title}</strong></span></span> : <a className="example-link" key={example.slug} href={`#/exemplos/${example.slug}`}><span className="example-number">{example.number}</span><span><small>{example.tag}</small><strong>{example.title}</strong></span><ArrowRight size={18} /></a>)}</div></section>;
}
