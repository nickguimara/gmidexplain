// Modelo didático contínuo inspirado na relação de inversão do EKV.
// NÃO é uma caracterização SPICE, um modelo compacto nem dados do PDK IHP.
export const LENGTHS = [0.13, 0.25, 0.5, 1];
export const COLORS = ['#235bd4', '#a95308', '#8036b5', '#007a68'];
export const BIAS = { gm: 300, vds: 0.6, vdd: 1.2 }; // µS, V, V
export const NOISE = { temperature: 300.15, gamma: 2 / 3, boltzmann: 1.380649e-23 };
export function operatingPoint(efficiency, length, current, vds) {
  const thermalVoltage = 0.02585;
  const slopeFactor = 1.4;
  const inversion = Math.max(0.015, (2 / (slopeFactor * thermalVoltage * efficiency) - 1) ** 2 - 1);
  const density = 0.27 * inversion / length; // µA/µm; illustrative normalization
  const width = current / density;
  const gm = efficiency * current; // µS
  const earlyVoltage = (3 + length * 19) * (0.7 + 0.3 * vds / 0.6);
  const ro = earlyVoltage / current * 1000; // kΩ
  const intrinsicGain = efficiency * earlyVoltage;
  const gain = intrinsicGain; // Ideal current-source load: infinite small-signal resistance.
  const cgg = width * length * 6.5 + width * 0.35; // fF
  const ft = gm / (2 * Math.PI * cgg); // GHz
  const vov = 2 / efficiency;
  const headroom = vov; // Approximate NMOS VDS,sat, not output swing or VDS bias.
  const thermalNoise = Math.sqrt(4 * NOISE.boltzmann * NOISE.temperature * NOISE.gamma / (gm * 1e-6)) * 1e9; // input-referred nV/√Hz, NMOS channel only
  return { current, density, width, area: width * length, gm, ro, intrinsicGain, gain, cgg, ft, vov, headroom, thermalNoise, power: current * BIAS.vdd, saturated: vds >= headroom };
}
// Compare designs at equal transconductance, not equal current.
export const designPoint = (efficiency, length) => operatingPoint(efficiency, length, BIAS.gm / efficiency, BIAS.vds);
export const METRICS = {
  intrinsicGain: { title: 'Ganho de tensão', symbol: '|Aᵥ| = gₘ/gds', unit: 'V/V', description: 'Com carga ideal, o ganho em módulo é o ganho intrínseco do transistor.' },
  headroom: { title: 'Headroom mínimo', symbol: 'Vᴅs,sat ≈ 2/(gₘ/Iᴅ)', unit: 'V', description: 'Tensão mínima dreno–fonte estimada para manter o NMOS em saturação. A carga ideal não exige headroom adicional.', shared: true },
  ft: { title: 'Frequência de transição', symbol: 'fT', unit: 'GHz', description: 'Uma estimativa da velocidade intrínseca do transistor: gₘ / (2πCgg).', max: null },
  areaCurrent: { title: 'Área × corrente' },
};
