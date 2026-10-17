import test from 'node:test';
import assert from 'node:assert/strict';
import { SATURATION, inversionShape, minimumSaturationVoltage, differentialLinearity } from './selectionPhysics.js';
import katex from 'katex';
import { ACTIVE_METRICS } from './activeLoadModel.js';
import { DIFF_METRICS } from './differentialModel.js';
import { MIRROR_METRICS } from './mirrorModel.js';

test('as fórmulas das avaliações são expressões KaTeX válidas', () => {
  for (const config of [ACTIVE_METRICS, DIFF_METRICS, MIRROR_METRICS]) {
    for (const metric of Object.values(config)) if (metric.latex) {
      assert.doesNotThrow(() => katex.renderToString(metric.latex, { throwOnError: true, strict: 'error', trust: false }));
    }
  }
});

test('saturação mínima corresponde a 99% da corrente direta no proxy', () => {
  let previous = Infinity;
  for (let i = 0; i <= 100; i++) {
    const eta = 5 + i * .2, { z, q } = inversionShape(eta);
    const voltage = minimumSaturationVoltage(eta);
    const reverseQ = Math.log1p(Math.exp(z - voltage / (2 * SATURATION.thermalVoltage)));
    const fraction = 1 - reverseQ ** 2 / q ** 2;
    assert(Math.abs(fraction - SATURATION.fraction) < 1e-12);
    assert(voltage < previous && voltage > 0);
    previous = voltage;
  }
});

test('inversão respeita a eficiência pedida e não extrapola além do limite térmico', () => {
  const { slopeFactor: n, thermalVoltage: ut } = SATURATION;
  for (const eta of [5, 15, 25]) {
    const { q, s } = inversionShape(eta);
    assert(Math.abs(s / (n * ut * q) - eta) < 1e-10);
  }
  assert.throws(() => inversionShape(30), RangeError);
  assert.throws(() => inversionShape(0), RangeError);
});

test('HD3 alvo fixa a amplitude de entrada em vez de abrir outro eixo de análise', () => {
  for (const eta of [5, 15, 25]) {
    const p = differentialLinearity(eta);
    assert.equal(p.hd3Db, -60);
    assert.equal(p.hd3, .001);
    assert(Math.abs(Math.abs(p.cubicRatio) * p.amplitude ** 2 / 4 - .001) < 1e-12);
    assert(differentialLinearity(eta, -80).amplitude < p.amplitude);
  }
});

test('estimativa cúbica de HD3 confere com integração da transferência do proxy', () => {
  const scale = 2 * SATURATION.slopeFactor * SATURATION.thermalVoltage;
  const softplus = z => Math.log1p(Math.exp(z));
  for (const eta of [5, 15, 25]) {
    const { z, q } = inversionShape(eta);
    const amplitude = differentialLinearity(eta).amplitude;
    let harmonic1 = 0, harmonic3 = 0;
    for (let k = 0; k < 512; k++) {
      const phase = 2 * Math.PI * k / 512;
      const d = amplitude * Math.sin(phase) / (2 * scale);
      let lo = -Math.abs(d) - 1, hi = Math.abs(d) + 1;
      for (let j = 0; j < 48; j++) {
        const common = (lo + hi) / 2;
        const total = softplus(z + common + d) ** 2 + softplus(z + common - d) ** 2;
        if (total > 2 * q ** 2) hi = common; else lo = common;
      }
      const common = (lo + hi) / 2;
      const diff = softplus(z + common + d) ** 2 - softplus(z + common - d) ** 2;
      harmonic1 += diff * Math.sin(phase);
      harmonic3 += diff * Math.sin(3 * phase);
    }
    assert(Math.abs(Math.abs(harmonic3 / harmonic1) / .001 - 1) < .05);
  }
});
