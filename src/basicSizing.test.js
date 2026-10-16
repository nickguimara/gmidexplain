import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { gmRequirements, evaluatePoint, suggestedPoint } from './basicSizing.js';
import { EXAMPLES, buildCandidates } from './methodology.js';
import { LENGTHS } from './model.js';
import { deriveEquation, scaleEquation, poleEquation, designEquation, quantity, texFrequency } from './guideMath.js';

const example = EXAMPLES[0];

test('a especificação deriva gm por dois limites e escolhe o maior', () => {
  assert.equal(example.flow, 'basic');
  assert.deepEqual(example.steps.map(step => step.key), ['requirements', 'gm', 'point', 'density', 'dimensions', 'verify']);
  assert.throws(() => buildCandidates(example));
  assert(example.aliases.includes('ganho-por-banda'));
  assert(!example.disabled);
  assert.deepEqual(EXAMPLES.filter(item => !item.disabled).map(item => item.slug), ['fluxo-basico']);
  const limits = gmRequirements(example);
  assert(Math.abs(limits.fromBandwidth - 2 * Math.PI * example.gain * example.bandwidthDesign * example.load * 1e6) < 1e-9);
  assert(Math.abs(limits.fromBandwidth - 753.982236862) < 1e-6);
  assert.equal(limits.fromNoise, 0);
  assert.equal(limits.gm, limits.fromBandwidth);
  assert.equal(limits.driver, 'bandwidth');
});

test('L e gm/ID determinam JD; gm exigido determina ID e W', () => {
  const design = gmRequirements(example).gm;
  for (const length of LENGTHS) for (const efficiency of [5, 10, 15, 20, 25]) {
    const point = evaluatePoint(example, length, efficiency);
    assert(Math.abs(point.current - design / efficiency) < 1e-12);
    assert.equal(point.width, point.current / point.normalized.density);
    assert.equal(point.area, point.width * length);
    assert(Math.abs(point.intrinsicGain - efficiency * point.normalized.earlyVoltage) < 1e-9);
    assert(Math.abs(point.point.gm - design) < 1e-9);
    assert(point.point.saturated);
  }
  const a = evaluatePoint(example, 0.5, 10), b = evaluatePoint(example, 0.5, 20);
  assert.equal(a.current, b.current * 2);
  assert(b.width > a.width);
});

test('a sugestão é um ponto de partida válido, não um ótimo imposto', () => {
  const suggestion = suggestedPoint(example);
  assert.equal(suggestion.length, 0.13);
  assert.equal(suggestion.efficiency, 10);
  assert(suggestion.meetsGain);
  assert(suggestion.meetsSpeed);
  assert(suggestion.gainMargin > 1);
  assert(suggestion.ftMargin > 100);
  assert(suggestion.bandwidth >= example.bandwidth);
  assert(suggestion.point.saturated);
});

test('fórmulas dos guias renderizam em KaTeX estrito', () => {
  const formulas = [scaleEquation, poleEquation, quantity(300, String.raw`\mu\mathrm S`), texFrequency(1e6)];
  for (const item of EXAMPLES.slice(1)) {
    formulas.push(deriveEquation(item));
    formulas.push(designEquation(buildCandidates(item, true)[0]));
  }
  for (const formula of formulas) assert.doesNotThrow(() => katex.renderToString(formula, { throwOnError: true, strict: 'error', trust: false }));
});
