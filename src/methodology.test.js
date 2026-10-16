import test from 'node:test';
import assert from 'node:assert/strict';
import { BIAS, LENGTHS } from './model.js';
import { EXAMPLES, EFFICIENCIES, lookupDevice, deriveLimits, solveCandidate, evaluateStage, buildCandidates, decisionMatches } from './methodology.js';

for (const example of EXAMPLES.filter(item => item.flow !== 'basic')) {
  test(`${example.slug}: seis etapas, decisão objetiva e solução com parasitas`, () => {
    assert.equal(example.steps.length, 6);
    assert.equal(new Set(example.steps.map(step => step.key)).size, 6);
    const rows = buildCandidates(example, true);
    assert.equal(rows.length, LENGTHS.length * EFFICIENCIES.length);
    const feasible = rows.filter(row => row.feasible);
    assert(feasible.length > 0);
    const best = feasible[0];
    assert(best.point.pass);
    assert(best.point.checks.every(check => check.pass));
    assert(best.design.current <= example.maxCurrent * (1 + 1e-9));
    assert(decisionMatches(example, best, best));
    for (const row of feasible) {
      if (example.objective === 'gain') assert(best.point.gain >= row.point.gain - 1e-8);
      else if (example.objective === 'area') assert(best.point.area <= row.point.area + 1e-8);
      else assert(best.point.current <= row.point.current + 1e-8);
      assert.equal(row.point.outputCap, row.point.width * row.point.normalized.outputCapPerWidth);
      assert(Math.abs(row.point.bandwidth - 1 / (2 * Math.PI * row.point.rout * row.point.totalCap)) < 1e-6);
      if (example.objective !== 'gain' && row.design.current > .01001) {
        const smaller = evaluateStage(example, { ...row.design, current: row.design.current * .999 }, true);
        assert(!smaller.pass, 'a corrente mínima calculada não pode ser reduzida arbitrariamente');
      }
    }
  });
}

test('a consulta normalizada conserva VA e usa ID/W para dimensionar W', () => {
  for (const length of LENGTHS) for (const efficiency of [5, 15, 25]) {
    const data = lookupDevice(length, efficiency);
    assert(Math.abs(data.earlyVoltage - (3 + length * 19)) < 1e-10);
    assert.equal(data.intrinsicGain, efficiency * data.earlyVoltage);
    const result = solveCandidate(EXAMPLES[1], length, efficiency, true);
    assert.equal(result.point.width, result.point.current / data.density);
  }
});

test('ganho × banda determina um limite necessário, não uma solução final', () => {
  const example = EXAMPLES[1], bounds = deriveLimits(example);
  assert(Math.abs(bounds.gmBandwidth - 62.83185307179586) < 1e-9);
  const result = buildCandidates(example, true)[0];
  assert(result.point.gm >= bounds.gmBandwidth);
  assert.notEqual(result.point.bandwidth, result.point.ft * 1e9);
});

test('o orçamento é mantido e a menor área difere de impor a corrente máxima', () => {
  const example = EXAMPLES[2], best = buildCandidates(example, true)[0];
  assert(best.design.current < example.maxCurrent);
  assert(!evaluateStage(example, { ...best.design, current: 10.1 }, true).pass);
});

test('o limite por ruído é invertido com unidades corretas e participa da corrente', () => {
  const example = EXAMPLES[3], bounds = deriveLimits(example);
  assert(bounds.gmNoise > 110 && bounds.gmNoise < 111);
  assert(bounds.gmNoise > bounds.gmBandwidth);
  const best = buildCandidates(example, true)[0];
  assert(Math.abs(best.point.thermalNoise - example.maxNoise) < 1e-10);
  assert(Math.abs(best.point.gm - bounds.gmNoise) < 1e-9);
  const lessCurrent = evaluateStage(example, { ...best.design, current: best.design.current * .99 }, true);
  assert.equal(lessCurrent.checks.find(check => check.key === 'noise').pass, false);
});

test('corrigir Cout resolve a mesma condição de banda, sem mudar requisitos', () => {
  const example = EXAMPLES[1];
  const first = buildCandidates(example, false)[0];
  const loaded = evaluateStage(example, first.design, true);
  const final = solveCandidate(example, first.design.length, first.design.efficiency, true);
  assert(loaded.bandwidth < example.bandwidth);
  assert(final.point.current > first.point.current);
  assert(final.feasible);
  assert(final.point.bandwidth >= example.bandwidth * (1 - 1e-9));
});

test('intervalos de corrente vazios ou ganho intrínseco insuficiente são rejeitados', () => {
  const impossibleGain = { ...EXAMPLES[1], gain: 1000 };
  assert(!solveCandidate(impossibleGain, .13, 5, true).feasible);
  const impossibleBudget = { ...EXAMPLES[1], maxCurrent: .001 };
  assert(buildCandidates(impossibleBudget, true).every(row => !row.feasible));
  const impossibleBand = { ...EXAMPLES[1], bandwidth: 1e12 };
  assert(buildCandidates(impossibleBand, true).every(row => !row.feasible));
});

test('o ramo de limite superior de corrente também respeita a desigualdade de banda', () => {
  const example = { ...EXAMPLES[1], gain: .01, bandwidth: 100e6, load: 1e-15 };
  const result = solveCandidate(example, 1, 25, true);
  assert(result.upperCurrent < example.maxCurrent);
  if (result.feasible) {
    assert(result.design.current <= result.upperCurrent);
    assert(!evaluateStage(example, { ...result.design, current: result.upperCurrent * 1.01 }, true).pass);
  }
});

test('ganho e banda declarados são independentes da polarização assumida e não alteram VDD', () => {
  assert.equal(BIAS.vds, .6);
  assert.equal(BIAS.vdd, 1.2);
  const example = EXAMPLES[1], best = buildCandidates(example, true)[0];
  assert(best.point.saturated);
  assert.equal(best.point.power, best.design.current * BIAS.vdd);
});
