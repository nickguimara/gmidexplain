import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BIAS, LENGTHS, designPoint, operatingPoint } from './model.js';
import { ACTIVE_LOAD, activeLoadPoint } from './activeLoadModel.js';

describe('carga ativa: CS com espelho PMOS', () => {
  it('coloca as duas impedências em paralelo no nó de saída', () => {
    const point = activeLoadPoint(15, .5);
    assert.ok(Math.abs(point.rout - 1 / (1 / point.ro + 1 / point.roLoad)) < 1e-9);
    assert(point.rout < point.ro && point.rout < point.roLoad);
    // paralelo nunca supera a maior das duas
    assert(point.rout < Math.max(point.ro, point.roLoad));
  });

  it('ganho = gₘ · r_out e nunca supera o ganho com carga ideal', () => {
    LENGTHS.forEach(l => [5, 15, 25].forEach(e => {
      const point = activeLoadPoint(e, l);
      const ideal = designPoint(e, l);
      assert.ok(Math.abs(point.gain - point.gm * point.rout / 1000) < 1e-9);
      assert.equal(point.idealGain, ideal.intrinsicGain);
      assert(point.gain < point.idealGain, `carga ativa não pode dar ganho extra em L = ${l}`);
      assert(point.gainRatio > 0 && point.gainRatio < 1);
      assert(Math.abs(point.gainRatio - point.gain / point.idealGain) < 1e-12);
    }));
  });

  it('empilha o headroom dos dois transistores e respeita V_DD', () => {
    const point = activeLoadPoint(15, .5);
    assert.ok(Math.abs(point.headroom - (point.input.headroom + point.load.headroom)) < 1e-12);
    assert.ok(Math.abs(point.swing - (BIAS.vdd - point.headroom)) < 1e-12);
    // mais eficiência, menos headroom: as duas sobreconduções caem juntas
    assert(activeLoadPoint(25, .5).headroom < activeLoadPoint(5, .5).headroom);
    // o par inteiro precisa caber em 1,2 V: quem limita é V_DD, não V_DS
    [5, 10, 15, 20, 25].forEach(e => assert(activeLoadPoint(e, .5).compliant, `eta ${e}`));
    assert(activeLoadPoint(5, .5).compliant && activeLoadPoint(5, .5).headroom <= BIAS.vdd);
  });

  it('deriva a banda de um polo com r_out real, não com carga ideal', () => {
    const point = activeLoadPoint(15, .5);
    const expected = 1 / (2 * Math.PI * point.rout * 1000 * point.cTotal) / 1e6; // MHz
    assert.ok(Math.abs(point.bandwidth - expected) / expected < 1e-12);
    assert(point.cTotal > ACTIVE_LOAD.loadCap, 'C_out entra em paralelo com a carga externa');
    assert(point.cOut > 0);
  });

  it('mantém o produto ganho × banda independente do L', () => {
    // GBW = gₘ/(2π·C_tot): nem r_out nem o L cancelam, só gₘ e as capacitâncias.
    LENGTHS.forEach(l => {
      const values = [5, 15, 25].map(e => activeLoadPoint(e, l).gbw);
      const spread = (Math.max(...values) - Math.min(...values)) / values[0];
      assert(spread < 0.05, `GBW deve ser ~constante em L = ${l} (espalhamento ${spread})`);
    });
    for (const e of [5, 15, 25]) for (const l of LENGTHS) {
      const p = activeLoadPoint(e, l);
      assert.ok(Math.abs(p.gbw - p.gain * p.bandwidth) / p.gbw < 1e-6);
    }
  });

  it('alongar L compra ganho mas custa banda e área', () => {
    for (const e of [5, 15, 25]) {
      const short = activeLoadPoint(e, LENGTHS[0]);
      const long = activeLoadPoint(e, LENGTHS.at(-1));
      assert(long.gain > short.gain, `L longo deve ganhar em eta ${e}`);
      assert(long.bandwidth < short.bandwidth, `L longo deve perder banda em eta ${e}`);
      assert(long.pairArea > short.pairArea);
    }
  });

  it('mais eficiência dá mais ganho ao custo de banda e headroom', () => {
    const weak = activeLoadPoint(5, .5);
    const strong = activeLoadPoint(25, .5);
    assert(strong.gain > weak.gain);
    assert(strong.bandwidth < weak.bandwidth);
    assert(strong.headroom < weak.headroom);
  });

  it('deriva o espelho mais longo que a entrada, com teto no máximo da biblioteca', () => {
    assert.equal(activeLoadPoint(15, .13).loadLength, .26);
    assert.equal(activeLoadPoint(15, .5).loadLength, 1);
    // L = 1 µm pediria um espelho de 2 µm, fora da faixa: fica no teto
    assert.equal(activeLoadPoint(15, 1).loadLength, ACTIVE_LOAD.maxLength);
    LENGTHS.forEach(l => assert(activeLoadPoint(15, l).loadLength >= l));
  });

  it('conta a área dos dois transistores e a largura do espelho', () => {
    const point = activeLoadPoint(15, .5);
    assert.ok(Math.abs(point.pairArea - (point.input.area + point.load.area)) < 1e-12);
    // o espelho é 2x mais longo (metade da densidade) e tem metade da
    // mobilidade: 4x a largura da entrada, para a mesma corrente
    assert.equal(point.loadLength, 1);
    assert.ok(Math.abs(point.load.width / point.input.width - 4) < 1e-9);
    assert.equal(point.load.current, point.input.current, 'espelho copia a mesma corrente');
    // a correção é só de mobilidade: sem ela a largura seria 2x (só pelo L)
    const withoutMobility = operatingPoint(15, point.loadLength, point.current, BIAS.vds).width;
    assert.ok(Math.abs(point.load.width / withoutMobility - 1 / ACTIVE_LOAD.loadMobility) < 1e-9);
  });
});