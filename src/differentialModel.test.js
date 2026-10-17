import test from 'node:test';
import assert from 'node:assert/strict';
import { LENGTHS, NOISE, designPoint } from './model.js';
import { DIFF, DIFF_METRICS, differentialPoint, differentialAreaCurrentPoint } from './differentialModel.js';

test('par varia gm da entrada a corrente fixa, mantendo cargas e cauda inalteradas', () => {
  const reference = differentialPoint(15, .5);
  for (const l of LENGTHS) for (const eta of [5, 15, 25]) {
    const p = differentialPoint(eta, l);
    assert.equal(p.input.gm, eta * DIFF.current);
    assert.equal(p.current, DIFF.current);
    assert.equal(p.tail.current, 2 * p.current);
    assert(Math.abs(p.load.gm - DIFF.loadGm) < 1e-10);
    assert.equal(p.load.current, p.current);
    assert.deepEqual(p.load, reference.load);
    assert.deepEqual(p.tail, reference.tail);
  }
});

test('PSD diferencial é exatamente 8kT gamma_n / [(gm/ID)_in I_D], sem cargas', () => {
  for (const l of LENGTHS) for (const eta of [5, 15, 25]) {
    const p = differentialPoint(eta, l);
    const expected = 8 * NOISE.boltzmann * NOISE.temperature * NOISE.gamma / (eta * DIFF.current * 1e-6);
    assert.equal(p.thermalNoisePSD, expected);
    assert.equal(p.noisePower, expected * 1e18);
    assert.equal(p.thermalNoise, Math.sqrt(expected) * 1e9);
    assert.equal(p.noisePower, differentialPoint(eta, .13).noisePower);
  }
  const a = differentialPoint(5, .5), b = differentialPoint(25, .5);
  assert(Math.abs(a.noisePower / b.noisePower - 5) < 1e-12);
  assert(Math.abs(a.thermalNoise / b.thermalNoise - Math.sqrt(5)) < 1e-12);
  assert.equal(DIFF_METRICS.noise.unit, 'nV²/Hz');
  assert.equal(DIFF_METRICS.noise.key, 'noisePower');
  assert(!DIFF_METRICS.noise.latex.includes('g_{m,L}'));
});

test('offset usa o mesmo A_VT do espelho sem fator sqrt(2) adicional', () => {
  for (const l of LENGTHS) for (const eta of [5, 15, 25]) {
    const p = differentialPoint(eta, l);
    assert.equal(p.offset, DIFF.avt / Math.sqrt(p.input.area));
    assert.equal(p.offsetMv, p.offset * 1e3);
    assert.equal(p.pairArea, 2 * p.input.area);
  }
});

test('tradeoffs da entrada a corrente fixa: reduz ruído/offset e custa área/linearidade/fT', () => {
  for (const l of LENGTHS) {
    const a = differentialPoint(5, l), b = differentialPoint(25, l);
    assert.equal(b.current, a.current);
    assert(b.input.gm > a.input.gm);
    assert(b.noisePower < a.noisePower);
    assert(b.pairArea > a.pairArea);
    assert(b.offset < a.offset);
    assert(b.linearityMv < a.linearityMv);
    assert(b.ft < a.ft);
  }
});

test('seis gráficos de seleção: ganho intrínseco, ruído, linearidade, mismatch, fT e área/corrente', () => {
  assert.deepEqual(Object.keys(DIFF_METRICS), ['intrinsicGain', 'noise', 'linearity', 'mismatch', 'ft', 'areaCurrent']);
  const p = differentialPoint(15, .5);
  assert(!('cmrr' in p));
  assert(!('icmr' in p));
  assert.equal(p.hd3Db, -60);
  assert.equal(p.ft, p.input.ft);
});

test('ganho intrínseco é gm/gds por dispositivo, não ganho carregado do estágio', () => {
  for (const l of LENGTHS) for (const eta of [5, 15, 25]) {
    const p = differentialPoint(eta, l);
    assert.equal(p.intrinsicGain, p.input.intrinsicGain);
    assert(Math.abs(p.intrinsicGain - p.input.gm * p.input.ro / 1000) < 1e-10);
  }
});

test('área/corrente do diferencial conta duas áreas de entrada e dois ramos de corrente', () => {
  for (const l of LENGTHS) for (const eta of [5, 15, 25]) {
    const p = differentialPoint(eta, l);
    assert.equal(p.pairArea, 2 * p.input.area);
    assert.equal(p.tailCurrent, 2 * p.current);
    assert.equal(p.tailCurrent, p.tail.current);
    assert.equal(p.tailCurrent, differentialPoint(eta, .13).tailCurrent);
  }
  const a = differentialPoint(5, .5), b = differentialPoint(25, .5);
  assert(b.pairArea > a.pairArea);
  assert.equal(b.tailCurrent, a.tailCurrent);
  assert.equal(b.tailCurrent, 40);
  assert.equal(DIFF_METRICS.areaCurrent.referenceGm, 300);
  assert.equal(DIFF_METRICS.areaCurrent.branchCount, 2);
  assert.equal(DIFF_METRICS.ft.tall, true);
});

test('comparação área/corrente a gm dado é separada do ponto de ruído a corrente fixa', () => {
  for (const l of LENGTHS) for (const eta of [5, 15, 25]) {
    const p = differentialPoint(eta, l);
    const reference = differentialAreaCurrentPoint(eta, l);
    const cs = designPoint(eta, l);
    assert.equal(p.comparisonGm, 300);
    assert.equal(p.comparisonCurrent, 2 * 300 / eta);
    assert.equal(p.comparisonCurrent, reference.current);
    assert.equal(p.comparisonArea, reference.area);
    assert.equal(p.comparisonArea, 2 * cs.area);
    // The circuit/noise operating point still copies 20 µA per branch.
    assert.equal(p.current, 20);
    assert.equal(p.tailCurrent, 40);
    const doubleGm = differentialAreaCurrentPoint(eta, l, 600);
    assert.equal(doubleGm.gm, 600);
    assert.equal(doubleGm.current, 2 * reference.current);
    assert.equal(doubleGm.area, 2 * reference.area);
  }
  assert(differentialPoint(25, .5).comparisonArea > differentialPoint(5, .5).comparisonArea);
  assert(differentialPoint(25, .5).comparisonCurrent < differentialPoint(5, .5).comparisonCurrent);
});
