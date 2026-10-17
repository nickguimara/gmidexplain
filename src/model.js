import { minimumSaturationVoltage } from './selectionPhysics.js';
// Modelo didático de densidade/capacitâncias; não é uma caracterização EKV.
// NÃO é uma caracterização SPICE, um modelo compacto nem dados do PDK IHP.
export const LENGTHS = [0.13, 0.25, 0.5, 1];
export const COLORS = ['#235bd4', '#a95308', '#8036b5', '#007a68'];
export const BIAS = { gm: 300, vds: 0.6, vdd: 1.2 }; // µS, V, V
export const NOISE = { temperature: 300.15, gamma: 2 / 3, boltzmann: 1.380649e-23 };
export function operatingPoint(efficiency, length, current, vds) {
  // Illustrative current-density law over the UI range 5..25, NOT an EKV
  // characterization or a physical weak-inversion plateau. Do not prescribe
  // the mismatch trend: W, current and the comparison constraints determine it.
  const strongInversion = 377 / (efficiency * efficiency * length); // µA/µm
  const subthreshold = 0.05; // µA/µm; numerical floor, inactive over the UI range
  const density = Math.max(subthreshold, strongInversion);
  const width = current / density;
  const gm = efficiency * current; // µS
  const earlyVoltage = (3 + length * 19) * (0.7 + 0.3 * vds / 0.6);
  const ro = earlyVoltage / current * 1000; // kΩ
  const intrinsicGain = efficiency * earlyVoltage;
  const gain = intrinsicGain; // Ideal current-source load: infinite small-signal resistance.
  const cgg = width * length * 6.5 + width * 0.35; // fF
  const ft = gm / (2 * Math.PI * cgg); // GHz
  const vov = 2 / efficiency;
  const headroom = minimumSaturationVoltage(efficiency); // Illustrative 99% forward-current criterion.
  const thermalNoise = Math.sqrt(4 * NOISE.boltzmann * NOISE.temperature * NOISE.gamma / (gm * 1e-6)) * 1e9; // input-referred nV/√Hz, NMOS channel only
  return { current, density, width, area: width * length, gm, ro, intrinsicGain, gain, cgg, ft, vov, headroom, thermalNoise, power: current * BIAS.vdd, saturated: vds >= headroom };
}
// Compare designs at equal transconductance, not equal current.
export const designPoint = (efficiency, length) => operatingPoint(efficiency, length, BIAS.gm / efficiency, BIAS.vds);
export const METRICS = {
  intrinsicGain: { title: 'Ganho de tensão', symbol: '|Aᵥ| = gₘ/gds', unit: 'V/V', description: 'Com carga ideal, o ganho em módulo é o ganho intrínseco do transistor.' },
  headroom: { title: 'Tensão mínima de saturação', symbol: 'I_D / I_F = 99%', unit: 'V', description: 'Estimativa ilustrativa: corrente reversa de até 1% da corrente direta. Não extraída do PDK; não é swing.', shared: true },
  ft: { title: 'Frequência de transição', symbol: 'fT', unit: 'GHz', description: 'Uma estimativa da velocidade intrínseca do transistor: gₘ / (2πCgg).', max: null },
  areaCurrent: { title: 'Área × corrente' },
};
