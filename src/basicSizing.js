import { lookupDevice } from './methodology.js';
import { operatingPoint, BIAS, LENGTHS } from './model.js';

// Murmann basic flow: gm comes from the specification, (L, gm/ID) is a design
// choice read from width-independent curves, then ID = gm/(gm/ID) and
// W = ID/(ID/W). No unique optimum is imposed; the suggestion below is only
// a balanced starting point.
export function gmRequirements(example) {
  const fromBandwidth = 2 * Math.PI * example.gain * example.bandwidthDesign * example.load * 1e6; // µS
  const fromNoise = example.maxNoise ? 4 * 1.380649e-23 * 300.15 * (2 / 3) / (example.maxNoise * 1e-9) ** 2 * 1e6 : 0;
  return { fromBandwidth, fromNoise, gm: Math.max(fromBandwidth, fromNoise), driver: fromNoise > fromBandwidth ? 'noise' : 'bandwidth' };
}

export function evaluatePoint(example, length, efficiency) {
  const { gm } = gmRequirements(example);
  const normalized = lookupDevice(length, efficiency);
  const current = gm / efficiency; // µA
  const width = current / normalized.density; // µm
  const point = operatingPoint(efficiency, length, current, BIAS.vds);
  const intrinsicGain = normalized.intrinsicGain; // η·VA; equals A0 with an ideal current-source load
  const ftHz = normalized.ft * 1e9;
  const ftGuidelineHz = example.speedMargin * example.bandwidthDesign;
  const outputCap = width * normalized.outputCapPerWidth;
  const totalCap = example.load + outputCap;
  const bandwidth = (gm * 1e-6) / (2 * Math.PI * intrinsicGain * totalCap);
  const thermalNoise = Math.sqrt(4 * 1.380649e-23 * 300.15 * (2 / 3) / (gm * 1e-6)) * 1e9;
  return {
    length, efficiency, normalized, current, width, area: width * length, point,
    intrinsicGain, ftHz, ftGuidelineHz, outputCap, totalCap, bandwidth, thermalNoise,
    gainMargin: intrinsicGain / example.gain,
    ftMargin: ftHz / ftGuidelineHz,
    meetsGain: intrinsicGain >= example.gain,
    meetsSpeed: ftHz >= ftGuidelineHz,
  };
}

// Balanced starting suggestion (moderate inversion, short channel), not an optimum.
// L = 0.13 µm at η = 10 V⁻¹: gain ≈ 54.7 V/V (inside the affordable window),
// fT in the tens of GHz, and the most compact area among the central options.
export function suggestedPoint(example) {
  return evaluatePoint(example, 0.13, 10);
}

export { LENGTHS };
