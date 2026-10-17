import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BIAS, LENGTHS, designPoint } from './model.js';
import { DIFF, differentialPoint } from './differentialModel.js';

describe('par diferencial com espelho de carga', () => {
  it('ganho diferencial usa só o ramo de M1 e a carga', () => {
    // Em meio-circuito diferencial o dreno de M2 é um terra virtual: ele não
    // carrega a saída. A saída vê r_o1 ∥ r_o4 e nada mais.
    const point = differentialPoint(15, .5);
    assert.ok(Math.abs(point.rout - 1 / (1 / point.ro + 1 / point.roLoad)) < 1e-9);
    assert.ok(Math.abs(point.gain - point.gm * point.rout / 1000) < 1e-9);
    assert.equal(point.input.gm, BIAS.gm, 'gm do par continua fixo');
    // a corrente da cauda é o dobro da de um ramo
    assert.equal(point.tail.current, 2 * point.current);
    assert.equal(point.load.current, point.current);
  });

  it('CMRR = 2·(gm/ID)·V_A da cauda, independente da corrente', () => {
    for (const l of LENGTHS) {
      let previous = -Infinity;
      for (let i = 0; i <= 200; i++) {
        const e = 5 + i * .1;
        const p = differentialPoint(e, l);
        const expected = 20 * Math.log10(2 * e * (3 + p.tailLength * 19));
        assert.ok(Math.abs(p.cmrrDb - expected) < 1e-9);
        assert.ok(Math.abs(p.cmrr - p.cmrr / 2 * 2) < 1e-12);
        assert(p.cmrr > previous, `CMRR cresce com o gₘ/Iᴅ em L = ${l}`);
        previous = p.cmrr;
      }
    }
    // como o gm é fixo, mudar o gm/ID muda a corrente — e mesmo assim o CMRR
    // só depende de eta e de V_A, nunca de I_D
    assert(Math.abs(differentialPoint(15, .5).cmrr / differentialPoint(5, .5).cmrr - 3) < 1e-9);
  });

  it('a cauda é o que rejeita: mais L nela, mais CMRR, até o teto', () => {
    for (const e of [5, 15, 25]) {
      const short = differentialPoint(e, LENGTHS[0]);
      const long = differentialPoint(e, LENGTHS.at(-1));
      assert.ok(long.tailLength >= short.tailLength);
      assert.ok(long.cmrr >= short.cmrr, `cauda mais longa rejeita mais em eta ${e}`);
    }
    // o teto de comprimento faz o CMRR saturar: L = 0,5 e L = 1 dão a mesma cauda
    assert.equal(differentialPoint(15, .5).tailLength, differentialPoint(15, 1).tailLength);
    assert.ok(Math.abs(differentialPoint(15, .5).cmrrDb - differentialPoint(15, 1).cmrrDb) < 1e-9);
  });

  it('offset de par tem o √2 do mismatch de dois transistores', () => {
    for (const l of LENGTHS) for (const e of [5, 10, 15, 20, 25]) {
      const p = differentialPoint(e, l);
      const solo = DIFF.avt / Math.sqrt(p.area); // um transistor, mesma área
      assert.ok(Math.abs(p.offset - solo / Math.SQRT2) < 1e-12);
      assert.ok(Math.abs(p.offsetMv - p.offset * 1e3) < 1e-12);
    }
    // área maior e eficiência mais fraca reduzem o offset
    let previous = Infinity;
    for (const e of [5, 10, 15, 20, 25]) {
      const p = differentialPoint(e, .5);
      assert(p.offsetMv < previous, 'mais eficiência amplia a área e reduz o offset');
      previous = p.offsetMv;
    }
    assert(differentialPoint(15, 1).offsetMv < differentialPoint(15, .13).offsetMv);
  });

  it('faixa de modo comum é limitada pela cauda embaixo e pela carga em cima', () => {
    const p = differentialPoint(15, .5);
    const vov = e => 2 / e;
    assert.ok(Math.abs(p.vMin - (vov(15) + vov(DIFF.tailEfficiency))) < 1e-12);
    assert.ok(Math.abs(p.vMax - (BIAS.vdd - vov(DIFF.loadEfficiency))) < 1e-12);
    assert.ok(Math.abs(p.icmr - (p.vMax - p.vMin)) < 1e-12);
    // não depende de L, e inversão mais fraca abre a faixa
    assert.equal(differentialPoint(5, .5).icmr, differentialPoint(5, 1).icmr);
    assert.ok(differentialPoint(25, .5).icmr > differentialPoint(5, .5).icmr);
    for (const l of LENGTHS) for (const e of [5, 10, 15, 20, 25]) assert(differentialPoint(e, l).compliant);
  });

  it('conta a área dos cinco transistores do circuito', () => {
    const p = differentialPoint(15, .5);
    assert.ok(Math.abs(p.pairArea - (2 * p.input.area + p.load.area + p.tail.area)) < 1e-12);
    // a cauda leva o dobro da corrente em eficiência menor e com L maior, logo
    // sai bem mais larga: W = I/J_D, e J_D cai com o gₘ/Iᴅ e com 1/L
    const expected = 2 * (p.input.density / p.tail.density);
    assert.ok(Math.abs(p.tail.width / p.input.width - expected) < 1e-9);
    assert(p.tail.width > p.input.width, 'a cauda é mais larga que um ramo do par');
    assert.ok(Math.abs(p.tail.gm - DIFF.tailEfficiency * 2 * p.current) < 1e-9);
    assert.equal(p.input.width, designPoint(15, .5).width);
  });
});