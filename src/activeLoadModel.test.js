import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BIAS, LENGTHS, NOISE, designPoint } from './model.js';
import { ACTIVE_LOAD, activeLoadPoint } from './activeLoadModel.js';

describe('carga ativa de um único transistor sobre o CS', () => {
  it('mantém a eficiência da carga fixa, independente da entrada', () => {
    // A carga é polarizada por tensão: a sobrecondução dela não segue o gₘ/Iᴅ.
    for (const e of [5, 15, 25]) for (const l of LENGTHS) {
      const point = activeLoadPoint(e, l);
      assert.ok(Math.abs(point.load.headroom - 2 / ACTIVE_LOAD.loadEfficiency) < 1e-12);
      assert.ok(Math.abs(point.load.gm - ACTIVE_LOAD.loadEfficiency * point.current) < 1e-9);
    }
    // e a corrente é a mesma dos dois lados, para o nó de saída ter um só ponto
    for (const e of [5, 15, 25]) {
      const point = activeLoadPoint(e, .5);
      assert.equal(point.load.current, point.current);
    }
  });

  it('empilha as duas sobreconduções e cabe em V_DD em toda a faixa', () => {
    const point = activeLoadPoint(15, .5);
    assert.ok(Math.abs(point.headroom - (point.input.headroom + point.load.headroom)) < 1e-12);
    assert.ok(Math.abs(point.swing - (BIAS.vdd - point.headroom)) < 1e-12);
    for (const l of LENGTHS) for (const e of [5, 10, 15, 20, 25]) {
      const p = activeLoadPoint(e, l);
      assert(p.compliant, `eta ${e}, L ${l}`);
      assert(p.headroom <= BIAS.vdd);
      // a carga sempre come uma fatia que a entrada não tinha
      assert(p.headroom > designPoint(e, l).headroom);
    }
    // inversão fraca devolve swing
    assert(activeLoadPoint(25, .5).headroom < activeLoadPoint(5, .5).headroom);
    assert(activeLoadPoint(25, .5).swing > activeLoadPoint(5, .5).swing);
  });

  it('o ruído incluye a carga e reduz ao caso de carga ideal', () => {
    const expected = Math.sqrt(4 * NOISE.boltzmann * NOISE.temperature * NOISE.gamma / (BIAS.gm * 1e-6)) * 1e9;
    for (const l of LENGTHS) for (const e of [5, 10, 15, 20, 25]) {
      const point = activeLoadPoint(e, l);
      const ratio = ACTIVE_LOAD.loadEfficiency / e;
      assert.ok(Math.abs(point.thermalNoise - expected * Math.sqrt(1 + ratio)) / point.thermalNoise < 1e-12);
      // a carga sempre piora o ruído, e nunca no gm fixo pela curva ideal
      assert(point.thermalNoise > expected);
      assert.ok(Math.abs(point.noiseRatio - ratio) < 1e-12);
    }
    // mais eficiência (menor g_mL/g_m1) significa menos ruído da carga
    assert(activeLoadPoint(25, .5).thermalNoise < activeLoadPoint(5, .5).thermalNoise);
  });

  it('a fT do par é a do transistor mais lento, e a carga vira o gargalo', () => {
    for (const l of LENGTHS) for (const e of [5, 15, 25]) {
      const p = activeLoadPoint(e, l);
      assert.equal(p.ft, Math.min(p.ftInput, p.ftLoad));
      const expected = p.ftLoad < p.ftInput ? 'carga' : 'entrada';
      assert.equal(p.limitedBy, expected);
      // a fT da carga não depende do gₘ/Iᴅ: a eficiência dela é fixa
      assert.ok(Math.abs(activeLoadPoint(5, l).ftLoad - activeLoadPoint(25, l).ftLoad) < 1e-9);
    }
    // existe um cruzamento: em inversão forte a carga limita, em fraca a entrada
    assert.equal(activeLoadPoint(5, LENGTHS[0]).limitedBy, 'carga');
    assert.equal(activeLoadPoint(25, LENGTHS[0]).limitedBy, 'entrada');
  });

  it('ganho abaixo do ideal, com as duas impedências em paralelo', () => {
    for (const l of LENGTHS) for (const e of [5, 15, 25]) {
      const p = activeLoadPoint(e, l);
      assert.ok(Math.abs(p.rout - 1 / (1 / p.ro + 1 / p.roLoad)) < 1e-9);
      assert.ok(Math.abs(p.gain - p.gm * p.rout / 1000) < 1e-9);
      assert(p.gain < p.intrinsicGain, `carga ativa não supera o ideal em L = ${l}`);
      assert.equal(p.intrinsicGain, designPoint(e, l).intrinsicGain);
    }
  });

  it('alongar L troca velocidade por ganho, e não mexe em ruído nem headroom', () => {
    for (const e of [5, 15, 25]) {
      const short = activeLoadPoint(e, LENGTHS[0]);
      const long = activeLoadPoint(e, LENGTHS.at(-1));
      // gm fixo e área maior => Cgg maior => fT menor
      assert.ok(Math.abs(long.thermalNoise - short.thermalNoise) < 1e-9, 'ruído não depende de L');
      assert.ok(Math.abs(long.headroom - short.headroom) < 1e-9, 'headroom não depende de L');
      assert(long.gain > short.gain, 'L longo ganha tensão');
      assert(long.ftInput < short.ftInput, 'L longo custa velocidade');
      assert(long.pairArea > short.pairArea);
    }
  });
});