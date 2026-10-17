import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { BLOCK_EXAMPLES, mirrorGuidePoint, activeGuidePoint, mirrorLedger, activeLedger, diffLedger } from './blockExamples.js';
import { LENGTHS } from './model.js';
import { MIRROR } from './mirrorModel.js';
import { differentialPoint } from './differentialModel.js';

const render = formula => assert.doesNotThrow(() => katex.renderToString(formula, { throwOnError: true, strict: 'error', trust: false }));

test('três guias de bloco, um para cada laboratório de seleção', () => {
  assert.deepEqual(BLOCK_EXAMPLES.map(example => example.slug), ['espelho-mismatch', 'carga-ativa-ganho', 'par-diferencial-fluxo']);
  assert.deepEqual(BLOCK_EXAMPLES.map(example => example.block), ['mirror', 'active', 'diff']);
  assert.deepEqual(BLOCK_EXAMPLES.map(example => example.labRoute), ['#/espelho', '#/carga-ativa', '#/par-diferencial']);
  for (const example of BLOCK_EXAMPLES) {
    assert(example.steps.length >= 5);
    assert.equal(new Set(example.steps.map(step => step.key)).size, example.steps.length);
    assert(example.steps.some(step => step.key === 'point'));
    assert(example.spec.length >= 4);
    assert(example.reference.length > 10);
  }
});

test('as fórmulas dos guias renderizam em KaTeX estrito', () => {
  for (const example of BLOCK_EXAMPLES) for (const item of example.spec) render(item.latex);
  render(mirrorLedger(mirrorGuidePoint(15, .5), 15));
  render(activeLedger(activeGuidePoint(10, .5), 10));
  render(diffLedger(differentialPoint(15, .5), 15));
  render(mirrorLedger(mirrorGuidePoint(5, .13), 5));
});

test('mismatch do espelho soma ΔV_T e Δβ a partir da área dimensionada', () => {
  for (const l of LENGTHS) for (const eta of [5, 15, 25]) {
    const point = mirrorGuidePoint(eta, l);
    assert.equal(point.sigmaVt, point.error);
    assert.equal(point.sigmaBeta, MIRROR.mismatchBeta / Math.sqrt(point.area));
    assert.equal(point.sigmaTotal, Math.hypot(point.sigmaVt, point.sigmaBeta));
    assert.equal(point.sigmaTotalPercent, point.sigmaTotal * 100);
    assert.equal(point.precise, point.sigmaTotalPercent <= MIRROR.errorTarget);
    assert(point.sigmaTotal >= point.sigmaVt && point.sigmaTotal >= point.sigmaBeta);
  }
});

test('carga ativa compara o ganho ao do CS com fonte ideal e troca faixa por ruído', () => {
  const point = activeGuidePoint(10, .5);
  assert(point.gain < point.referenceGain);
  assert.equal(point.gainPercentOfIgs, point.gain / point.referenceGain * 100);
  assert(Math.abs(point.gainLossPercent - (100 - point.gainPercentOfIgs)) < 1e-9);
  const low = activeGuidePoint(5, .5), high = activeGuidePoint(25, .5);
  // Mais gm/ID na carga devolve faixa, mas custa ruído adicional.
  assert(high.loadHeadroom <= low.loadHeadroom);
  assert(high.loadNoise >= low.loadNoise);
  // O ganho acompanha L (via gds/ID), não o gm/ID da carga.
  assert(activeGuidePoint(10, 1).gain > activeGuidePoint(10, .13).gain);
  assert.equal(activeGuidePoint(5, .5).gain, activeGuidePoint(25, .5).gain);
});

test('o guia do par usa exatamente o mesmo ponto do laboratório', () => {
  for (const l of LENGTHS) for (const eta of [5, 15, 25]) {
    assert.deepEqual(BLOCK_EXAMPLES[2].evaluate(eta, l), differentialPoint(eta, l));
  }
});
