import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './math.css';

export default function MathFormula({ latex, className = '', inline = false }) {
  const html = useMemo(() => katex.renderToString(latex, { displayMode: !inline, throwOnError: false, strict: 'error', trust: false, output: 'htmlAndMathml' }), [latex, inline]);
  const Tag = inline ? 'span' : 'div';
  return <Tag className={`math-formula ${inline ? 'math-inline' : ''} ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
