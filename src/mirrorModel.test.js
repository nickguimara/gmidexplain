import test from 'node:test';
import assert from 'node:assert/strict';
import { LENGTHS } from './model.js';
import { MIRROR, mirrorPoint } from './mirrorModel.js';
import { minimumSaturationVoltage } from './selectionPhysics.js';

test('espelho compara a mesma corrente, não o mesmo gm', () => {
  for (const l of LENGTHS) for (const eta of [5, 10, 15, 20, 25]) {
    const p = mirrorPoint(eta, l);
    assert.equal(p.current, MIRROR.current);
    assert.equal(p.refCurrent, MIRROR.current);
    assert.equal(p.outCurrent, MIRROR.current);
    assert.equal(p.gm, eta * MIRROR.current);
    assert.equal(p.width, MIRROR.current / p.density);
    assert.equal(p.pairArea, 2 * p.width * l);
  }
});

test('compliance do espelho usa o mesmo critério explícito do CS', () => {
  for (const l of LENGTHS) for (const eta of [5, 15, 25]) {
    const p = mirrorPoint(eta, l);
    assert.equal(p.vMinOut, minimumSaturationVoltage(eta));
    assert(p.compliant);
  }
});

test('mismatch usa a convenção de diferença de thresholds do par', () => {
  for (const l of LENGTHS) for (const eta of [5, 15, 25]) {
    const p = mirrorPoint(eta, l);
    assert.equal(p.sigma, MIRROR.mismatchK / Math.sqrt(p.area));
    assert.equal(p.errorPercent, eta * p.sigma * 100);
    assert.equal(p.sigmaBeta, MIRROR.mismatchBeta / Math.sqrt(p.area));
    assert.equal(p.sigmaTotal, Math.hypot(p.error, p.sigmaBeta));
    assert.equal(p.sigmaTotalPercent, p.sigmaTotal * 100);
    assert.equal(p.precise, p.sigmaTotalPercent <= MIRROR.errorTarget);
  }
});

test('não força tendência de mismatch: com esta lei de W o resultado é plano', () => {
  for (const l of LENGTHS) {
    const initial = mirrorPoint(5, l);
    for (let i = 0; i <= 100; i++) {
      const eta = 5 + i * .2, p = mirrorPoint(eta, l);
      assert(Math.abs(p.error - initial.error) < 1e-12);
      assert(Math.abs(p.width / initial.width - (eta / 5) ** 2) < 1e-10);
    }
  }
  assert(mirrorPoint(15, 1).error < mirrorPoint(15, .13).error);
});

test('gráfico a área fixa cresce com gm/ID sem se confundir com a área dimensionada', () => {
  for (const l of LENGTHS) {
    let previous = 0;
    for (const eta of [5, 10, 15, 20, 25]) {
      const p = mirrorPoint(eta, l);
      const expected = eta * MIRROR.mismatchK / Math.sqrt(MIRROR.mismatchReferenceArea) * 100;
      assert.equal(p.referenceMismatchPercent, expected);
      assert(p.referenceMismatchPercent > previous);
      assert.equal(p.referenceMismatchPercent, mirrorPoint(eta, .13).referenceMismatchPercent);
      previous = p.referenceMismatchPercent;
    }
  }
});
