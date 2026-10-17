import test from 'node:test';
import assert from 'node:assert/strict';
import { LENGTHS } from './model.js';
import { ACTIVE_LOAD, activeLoadPoint, ACTIVE_METRICS } from './activeLoadModel.js';
import { minimumSaturationVoltage } from './selectionPhysics.js';

test('slider e L variam somente a carga; corrente e CS de referência fixos', () => {
  const reference = activeLoadPoint(5, .13).input;
  for (const l of LENGTHS) for (const eta of [5, 15, 25]) {
    const p = activeLoadPoint(eta, l);
    assert.deepEqual(p.input, reference);
    assert.equal(p.current, ACTIVE_LOAD.current);
    assert.equal(p.load.current, ACTIVE_LOAD.current);
    assert.equal(p.load.gm, eta * ACTIVE_LOAD.current);
    assert.equal(p.loadHeadroom, minimumSaturationVoltage(eta));
  }
});

test('mais eficiência da carga troca headroom por ruído, a mesma corrente', () => {
  const a = activeLoadPoint(5, .5), b = activeLoadPoint(25, .5);
  assert(b.loadHeadroom < a.loadHeadroom);
  assert(b.vOutMax > a.vOutMax);
  assert.equal(b.vOutMin, a.vOutMin);
  assert(b.loadNoise > a.loadNoise);
  assert(Math.abs(b.loadNoise / a.loadNoise - Math.sqrt(5)) < 1e-12);
  assert(b.ft < a.ft);
});

test('fontes de ruído independentes somam como potência', () => {
  for (const eta of [5, 15, 25]) {
    const p = activeLoadPoint(eta, .5);
    assert(Math.abs(p.totalNoise ** 2 - p.inputNoise ** 2 - p.loadNoise ** 2) < 1e-10);
    assert(Math.abs(p.loadNoise / p.inputNoise - Math.sqrt(p.load.gm / p.input.gm)) < 1e-12);
  }
});

test('fT é do dispositivo de carga, nunca um mínimo atribuído ao par', () => {
  assert.equal(ACTIVE_METRICS.ft.title, 'fT da carga');
  for (const l of LENGTHS) for (const eta of [5, 15, 25]) {
    const p = activeLoadPoint(eta, l);
    assert.equal(p.ft, p.load.ft);
    assert(!('limitedBy' in p));
  }
});

test('L da carga muda velocidade, sem mudar o ruído térmico a gm fixo', () => {
  const a = activeLoadPoint(15, .13), b = activeLoadPoint(15, 1);
  assert.equal(a.loadNoise, b.loadNoise);
  assert.equal(a.loadHeadroom, b.loadHeadroom);
  assert(b.ft < a.ft);
});
