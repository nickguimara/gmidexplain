// gm/ID selection for the INPUT pair only. No CMRR/ICMR proxy: these require
// a separate operating-point/topology analysis. Fixed current per input branch;
// gm varies with the INPUT gm/ID. Loads and tail are unchanged references.
import { BIAS, NOISE, operatingPoint } from './model.js';
import { differentialLinearity } from './selectionPhysics.js';

export const DIFF = {
  current: 20, loadGm: 240, loadLength: 1, // µA per branch, µS per PMOS, µm
  areaComparisonGm: 300, // µS per input, only for the area/current reference plot
  tailEfficiency: 12, tailLength: 1,
  hd3Db: -60,
  // Pair-difference convention, same as mirror: sigma(Delta VT)=A_VT/sqrt(WL).
  avt: 0.5e-3,
};

export function differentialAreaCurrentPoint(efficiency, length, gm = DIFF.areaComparisonGm) {
  const input = operatingPoint(efficiency, length, gm / efficiency, BIAS.vds);
  return { gm, area: 2 * input.area, current: 2 * input.current };
}

export function differentialPoint(efficiency, length) {
  const input = operatingPoint(efficiency, length, DIFF.current, BIAS.vds);
  const current = input.current;
  // Reference loads do not participate in this input-pair selection sweep.
  const loadEfficiency = DIFF.loadGm / current;
  const load = operatingPoint(loadEfficiency, DIFF.loadLength, current, BIAS.vds);
  const tail = operatingPoint(DIFF.tailEfficiency, DIFF.tailLength, 2 * current, BIAS.vds);
  const noiseFactor = 8 * NOISE.boltzmann * NOISE.temperature * NOISE.gamma;
  // Differential INPUT PAIR channel noise only. No PMOS-load multiplier.
  // SI: V²/Hz. Plot in nV²/Hz; amplitude density is exported separately.
  const thermalNoisePSD = noiseFactor / (input.gm * 1e-6);
  const noisePower = thermalNoisePSD * 1e18;
  const thermalNoise = Math.sqrt(thermalNoisePSD) * 1e9;
  const offset = DIFF.avt / Math.sqrt(input.area);
  const linearity = differentialLinearity(efficiency, DIFF.hd3Db);
  const areaComparison = differentialAreaCurrentPoint(efficiency, length);
  return {
    efficiency, length, input, current, tail, load, loadEfficiency,
    thermalNoisePSD, noisePower, thermalNoise, offset, offsetMv: offset * 1e3,
    intrinsicGain: input.intrinsicGain, tailCurrent: 2 * current,
    ft: input.ft, linearityMv: linearity.amplitude * 1e3,
    hd3Db: DIFF.hd3Db,
    pairArea: 2 * input.area,
    comparisonArea: areaComparison.area, comparisonCurrent: areaComparison.current,
    comparisonGm: areaComparison.gm,
  };
}

export const DIFF_METRICS = {
  intrinsicGain: { key: 'intrinsicGain', title: 'Ganho intrínseco', latex: String.raw`A_i=\frac{g_{m,1}}{g_{ds,1}}`, unit: 'V/V' },
  noise: { key: 'noisePower', title: 'Ruído diferencial referido à entrada', latex: String.raw`\frac{\overline{v_{in,\mathrm{diff}}^2}}{\Delta f}=\frac{8kT\gamma_n}{g_{m1,2}}=\frac{8kT\gamma_n}{(g_m/I_D)_{in}\,I_{D1,2}}`, unit: 'nV²/Hz', shared: true },
  linearity: { key: 'linearityMv', title: 'Linearidade · HD3 ≤ −60 dBc', latex: String.raw`\hat v_{id,\max}\approx\sqrt{\frac{4\cdot10^{-3}}{|a_3/g_m|}}`, unit: 'mV pico', shared: true },
  mismatch: { key: 'offsetMv', title: 'Mismatch de entrada', latex: String.raw`\sigma(V_{OS})=\frac{A_{VT}}{\sqrt{WL}}`, unit: 'mV' },
  ft: { key: 'ft', title: 'fT da entrada', latex: String.raw`f_{T,1}=\frac{g_{m,1}}{2\pi C_{gg,1}}`, unit: 'GHz', tall: true },
  areaCurrent: {
    key: 'comparisonArea', title: 'Área × corrente · gm fixo', summaryTitle: 'Área para gm = 300 µS/entrada',
    latex: String.raw`g_{m1,2}=300\,\mu\mathrm S,\quad I_{\rm cauda,ref}=\frac{2g_{m1,2}}{(g_m/I_D)_{in}},\quad A_{\rm ref}=2WL`,
    unit: 'µm²', chart: 'tradeoff', areaKey: 'comparisonArea', currentKey: 'comparisonCurrent',
    areaLabel: 'Área do par (µm² · log)', currentLabel: 'I_cauda (µA)',
    referenceGm: DIFF.areaComparisonGm, branchCount: 2,
    csvSeries: [{ key: 'comparisonArea', unit: 'µm²' }, { key: 'comparisonCurrent', unit: 'µA' }, { key: 'comparisonGm', unit: 'µS/entrada' }],
  },
};
