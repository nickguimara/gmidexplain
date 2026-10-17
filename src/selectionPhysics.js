// Independent illustrative proxies, NOT PDK lookup tables. No fitted monotonic
// mismatch condition: the selected bias/geometry determines each result.
export const SATURATION = { fraction: 0.99, thermalVoltage: 0.02585, slopeFactor: 1.4 };
const softplus = z => Math.log1p(Math.exp(z));
const cache = new Map();

// EKV forward-current shape I ∝ log²(1+exp(z)), z=(V_GS-V_T)/(2nU_T).
// eta = sigmoid(z)/(nU_T·softplus(z)); invert only within its physical range.
export function inversionShape(efficiency) {
  const { slopeFactor: n, thermalVoltage: ut } = SATURATION;
  if (!(efficiency > 0 && efficiency < 1 / (n * ut))) throw new RangeError('gm/ID fora da faixa do proxy de inversão');
  if (cache.has(efficiency)) return cache.get(efficiency);
  let lo = -40, hi = 100;
  for (let i = 0; i < 64; i++) {
    const z = (lo + hi) / 2;
    const eta = (1 / (1 + Math.exp(-z))) / (n * ut * softplus(z));
    if (eta > efficiency) lo = z; else hi = z;
  }
  const z = (lo + hi) / 2;
  const q = softplus(z), s = 1 / (1 + Math.exp(-z));
  const result = { z, q, s };
  cache.set(efficiency, result);
  return result;
}

// Operational saturation criterion: reverse current <= 1% of forward current.
// V_DS,min = 2U_T(z_f-z_r). Unlike 2/eta this retains a diffusion floor in WI.
export function minimumSaturationVoltage(efficiency) {
  const { z, q } = inversionShape(efficiency);
  const reverseQ = Math.sqrt(1 - SATURATION.fraction) * q;
  const reverseZ = Math.log(Math.expm1(reverseQ));
  return 2 * SATURATION.thermalVoltage * (z - reverseZ);
}

// First-order HD3 estimate for an ideal symmetric pair with constant tail
// current. I_diff = gm·v + a3·v³; a3/gm = g3/(24gm)-g2²/(8gm²).
// Source motion is included; no mirror distortion, body effect or CLM.
export function differentialLinearity(efficiency, hd3Db = -60) {
  const { q, s } = inversionShape(efficiency);
  const scale = 2 * SATURATION.slopeFactor * SATURATION.thermalVoltage;
  const f1 = 2 * q * s;
  const f2 = 2 * (s * s + q * s * (1 - s));
  const f3 = 2 * (3 * s * s * (1 - s) + q * s * (1 - s) * (1 - 2 * s));
  const g2gm = f2 / f1 / scale;
  const g3gm = f3 / f1 / scale ** 2;
  const cubicRatio = g3gm / 24 - g2gm ** 2 / 8;
  const hd3 = 10 ** (hd3Db / 20);
  const amplitude = Math.sqrt(4 * hd3 / Math.abs(cubicRatio));
  return { amplitude, cubicRatio, hd3, hd3Db };
}
