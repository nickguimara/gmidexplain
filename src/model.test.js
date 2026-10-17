import test from 'node:test';
import assert from 'node:assert/strict';
import { operatingPoint, designPoint, LENGTHS, BIAS, NOISE } from './model.js';

test('180 pontos de caracterização são finitos com carga de corrente ideal', () => {
  for (const length of LENGTHS) for (const current of [5, 20, 100]) {
    for (const vds of [.2, .6, 1]) for (const efficiency of [5, 10, 15, 20, 25]) {
      const point = operatingPoint(efficiency, length, current, vds);
      for (const [key, value] of Object.entries(point)) {
        if (typeof value === 'number') assert(Number.isFinite(value) && value > 0, key);
      }
      assert.equal(point.gm, efficiency * current);
      assert.equal(point.gain, point.intrinsicGain);
      assert(Math.abs(point.gain - point.gm * point.ro / 1000) < 1e-10);
    }
  }
});

test('mais eficiência aumenta largura e ganho, mas reduz fT neste modelo', () => {
  const a = operatingPoint(10, .5, 20, .6);
  const b = operatingPoint(20, .5, 20, .6);
  assert(b.width > a.width);
  assert(b.gain > a.gain);
  assert(b.ft < a.ft);
});

test('o indicador de saturação responde à tensão de dreno', () => {
  assert.equal(operatingPoint(5, .5, 20, .2).saturated, false);
  assert.equal(operatingPoint(5, .5, 20, .6).saturated, true);
});

test('a comparação mantém gm fixo enquanto troca consumo por área', () => {
  for (const length of LENGTHS) {
    let previous = designPoint(5, length);
    for (let i = 1; i <= 200; i++) {
      const efficiency = 5 + i * .1;
      const point = designPoint(efficiency, length);
      assert(Math.abs(point.gm - BIAS.gm) < 1e-10);
      assert.equal(point.current, BIAS.gm / efficiency);
      assert.equal(point.power, BIAS.vdd * point.current);
      assert.equal(point.area, point.width * length);
      assert(point.area > previous.area);
      assert(point.current < previous.current);
      assert(point.power < previous.power);
      assert(point.ft < previous.ft);
      previous = point;
    }
  }
});

test('a densidade de corrente decresce com o gm/ID e satura em subthreshold', () => {
  // Regressão: o fator de inversão (n−1)²−1 antigo ia a zero em inversão fraca,
  // o que fazia W e a área explodirem e o mismatch de Pelgrom "melhorar" sem
  // limite. O patamar garante que J_D nunca zere nem decresça mais que isso.
  for (const length of LENGTHS) {
    let previous = Infinity;
    for (let i = 0; i <= 400; i++) {
      const efficiency = 5 + i * .05;
      const density = designPoint(efficiency, length).current / designPoint(efficiency, length).width;
      assert(density > 0, 'J_D nunca zera');
      assert(density <= previous + 1e-12, `J_D cai com o gₘ/Iᴅ em L = ${length}`);
      previous = density;
    }
    // mesmo com W enorme, a densidade para no mesmo patamar para todo L
    const weak = designPoint(25, length);
    assert(Math.abs(weak.current / weak.width - 377 / (625 * length)) < 1e-9);
  }
  // e o platô realmente é o que limita: com eta enorme, J_D deixa de cair
  const huge = operatingPoint(1e6, .5, 1, .6);
  assert(Math.abs(huge.current / huge.width - .05) < 1e-9);
  // em inversão forte a escala é V_OV²/L, ou seja 1/(gₘ/Iᴅ)²·L
  const a = operatingPoint(10, .5, 20, .6), b = operatingPoint(20, .5, 20, .6);
  assert(Math.abs((a.current / a.width) / (b.current / b.width) - 4) < 1e-9);
});

test('headroom estima a tensão de saturação, sem inventar dependência em L', () => {
  for (const efficiency of [5, 10, 15, 20, 25]) for (const length of LENGTHS) {
    const point = designPoint(efficiency, length);
    assert.equal(point.headroom, 2 / efficiency);
    assert.equal(point.headroom, designPoint(efficiency, .13).headroom);
    assert.equal(point.saturated, BIAS.vds >= point.headroom);
  }
  assert.equal(designPoint(5, .5).headroom, .4);
  assert.equal(designPoint(25, .5).headroom, .08);
  assert(designPoint(25, .5).headroom < designPoint(5, .5).headroom);
  assert.equal(operatingPoint(5, .5, 20, .2).saturated, false);
});

test('ruído térmico usa gm em siemens, é constante a gm fixo e cai com √gm', () => {
  const expected = Math.sqrt(4 * NOISE.boltzmann * NOISE.temperature * NOISE.gamma / (BIAS.gm * 1e-6)) * 1e9;
  assert(expected > 6 && expected < 6.1);
  for (const length of LENGTHS) for (const efficiency of [5, 10, 15, 20, 25]) {
    assert(Math.abs(designPoint(efficiency, length).thermalNoise - expected) < 1e-10);
  }
  const a = operatingPoint(10, .5, 10, .6);
  const b = operatingPoint(10, .5, 40, .6);
  assert(Math.abs(a.thermalNoise / b.thermalNoise - 2) < 1e-10);
});
