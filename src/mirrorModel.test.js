import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BIAS, LENGTHS } from './model.js';
import { MIRROR, mirrorPoint } from './mirrorModel.js';

describe('espelho de corrente 1:1', () => {
  it('mantém I_out = I_ref na razão 1:1 e deriva a corrente do gm/ID', () => {
    assert.equal(mirrorPoint(15, 0.5).outCurrent, BIAS.gm / 15);
    assert.equal(mirrorPoint(15, 0.5).refCurrent, 20);
    assert.equal(mirrorPoint(5, 0.5).outCurrent, 60);
  });

  it('usa a compliance didática 2/(gm/ID) e nada de L', () => {
    LENGTHS.forEach(l => {
      const point = mirrorPoint(15, l);
      assert.ok(Math.abs(point.vMinOut - 2 / 15) < 1e-12);
      assert.ok(Math.abs(point.vMaxOut - BIAS.vdd) < 1e-12);
      assert.ok(Math.abs(point.swing - (BIAS.vdd - 2 / 15)) < 1e-12);
    });
    assert.ok(mirrorPoint(10, 0.5).vMinOut > mirrorPoint(20, 0.5).vMinOut);
  });

  it('aplica a lei de Pelgrom ao erro por mismatch', () => {
    const point = mirrorPoint(15, 0.5);
    assert.ok(Math.abs(point.sigma - MIRROR.mismatchK / Math.sqrt(point.area)) < 1e-12);
    assert.ok(Math.abs(point.error - point.sigma * 15) < 1e-12);
    assert.ok(Math.abs(point.errorPercent - point.error * 100) < 1e-12);
  });

  it('melhora a cópia com L maior, para o mesmo gm/ID', () => {
    const errors = LENGTHS.map(l => mirrorPoint(15, l).error);
    errors.forEach((value, i) => { if (i) assert.ok(value < errors[i - 1], `L = ${LENGTHS[i]} deve errar menos`); });
    assert.ok(mirrorPoint(15, LENGTHS.at(-1)).precise);
  });

  it('exige mais área quando o gm/ID é mais fraco para bater a meta de erro', () => {
    const point = mirrorPoint(15, 0.5);
    assert.ok(Math.abs(point.areaForError - (MIRROR.mismatchK * 15 / 0.01) ** 2) < 1e-9);
    assert.ok(mirrorPoint(20, 0.5).areaForError > mirrorPoint(10, 0.5).areaForError);
    assert.ok(mirrorPoint(15, 0.5).precise);
    assert.ok(!mirrorPoint(15, 0.13).precise);
  });

  it('conta a área dos dois transistores do par', () => {
    const point = mirrorPoint(15, 0.5);
    assert.ok(Math.abs(point.pairArea - 2 * point.width * 0.5) < 1e-12);
  });

  it('mantém o ganho didático do par igual a (gₘ/Iᴅ)·V_A', () => {
    const point = mirrorPoint(15, 0.5);
    assert.ok(Math.abs(point.gain - 15 * (3 + 0.5 * 19)) < 1e-9);
    assert.ok(mirrorPoint(15, 1).gain > mirrorPoint(15, 0.13).gain);
  });

  it('considera o par sempre conforme em V_DS de saída = 0,6 V', () => {
    LENGTHS.forEach(l => [5, 10, 15, 20, 25].forEach(e => {
      assert.ok(mirrorPoint(e, l).compliant, `gₘ/Iᴅ ${e}, L ${l}`);
    }));
  });
});