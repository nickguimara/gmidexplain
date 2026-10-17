// Select the LOAD gm/ID. The input stage is a fixed reference, not a second
// optimization variable. All PMOS quantities remain illustrative proxies.
import { BIAS, NOISE, operatingPoint } from './model.js';

export const ACTIVE_LOAD = {
  current: 20, inputGm: 300, inputEfficiency: 15, inputLength: 0.5,
  loadVAFactor: 0.6,
};

export function activeLoadPoint(efficiency, length) {
  const input = operatingPoint(ACTIVE_LOAD.inputEfficiency, ACTIVE_LOAD.inputLength, ACTIVE_LOAD.current, BIAS.vds);
  const load = operatingPoint(efficiency, length, ACTIVE_LOAD.current, BIAS.vdd - BIAS.vds);
  const roLoad = ACTIVE_LOAD.loadVAFactor * load.ro;
  const rout = 1 / (1 / input.ro + 1 / roLoad);
  const noiseFactor = 4 * NOISE.boltzmann * NOISE.temperature * NOISE.gamma;
  const gmInputSI = input.gm * 1e-6;
  // Independent channel noise sources add as POWERS, not amplitudes.
  const inputNoise = Math.sqrt(noiseFactor / gmInputSI) * 1e9;
  const loadNoise = Math.sqrt(noiseFactor * load.gm * 1e-6 / gmInputSI ** 2) * 1e9;
  const totalNoise = Math.hypot(inputNoise, loadNoise);
  const vOutMin = input.headroom;
  const vOutMax = BIAS.vdd - load.headroom;
  return {
    efficiency, length, current: ACTIVE_LOAD.current, input, load,
    loadGm: load.gm, loadWidth: load.width, loadHeadroom: load.headroom,
    roLoad, rout, gain: input.gm * rout / 1000,
    inputNoise, loadNoise, totalNoise,
    ft: load.ft, vOutMin, vOutMax, swing: Math.max(0, vOutMax - vOutMin),
    compliant: BIAS.vds >= vOutMin && BIAS.vds <= vOutMax,
  };
}

export const ACTIVE_METRICS = {
  headroom: { key: 'loadHeadroom', title: 'Headroom da carga', latex: String.raw`V_{SD,\min,L}\quad(I_D/I_F=99\%)`, unit: 'V', shared: true },
  noise: { key: 'loadNoise', title: 'Ruído adicional da carga', latex: String.raw`e_{n,L}=\frac{\sqrt{4kT\gamma_p g_{m,L}}}{g_{m,1}}`, unit: 'nV/√Hz', shared: true },
  ft: { key: 'ft', title: 'fT da carga', latex: String.raw`f_{T,L}=\frac{g_{m,L}}{2\pi C_{gg,L}}`, unit: 'GHz' },
};
