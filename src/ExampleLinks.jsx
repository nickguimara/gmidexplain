import React from 'react';
import { ArrowRight } from 'lucide-react';
import { EXAMPLES } from './methodology';
import { BLOCK_EXAMPLES } from './blockExamples';

export default function ExampleLinks() {
  return <>
    <section className="examples-section" aria-labelledby="examples-title"><div className="examples-section-heading"><div><span className="section-kicker">APLIQUE O MÉTODO</span><h2 id="examples-title">Dimensione um fonte comum</h2></div><span>Requisitos, escolhas e dimensões.</span></div><div className="example-links">{EXAMPLES.map(example => example.disabled ? <span className="example-link disabled" key={example.slug} aria-disabled="true" title="Exemplo temporariamente desabilitado"><span className="example-number">{example.number}</span><span><small>EM BREVE</small><strong>{example.title}</strong></span></span> : <a className="example-link" key={example.slug} href={`#/exemplos/${example.slug}`}><span className="example-number">{example.number}</span><span><small>{example.tag}</small><strong>{example.title}</strong></span><ArrowRight size={18} /></a>)}</div></section>
    <section className="examples-section" aria-labelledby="block-examples-title"><div className="examples-section-heading"><div><span className="section-kicker">UM GUIA POR BLOCO</span><h2 id="block-examples-title">Exemplos guiados dos outros blocos</h2></div><span>Adaptados de Jespers &amp; Murmann.</span></div><div className="example-links">{BLOCK_EXAMPLES.map(example => <a className="example-link" key={example.slug} href={`#/exemplos/${example.slug}`}><span className="example-number">{example.number}</span><span><small>{example.tag}</small><strong>{example.title}</strong></span><ArrowRight size={18} /></a>)}</div></section>
  </>;
}
