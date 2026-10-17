// Espelho de corrente NMOS com razão 1:1 (M1 diodo-conectado, M2 saída).
// Modelo didático: NÃO é caracterização SPICE nem dados do PDK IHP SG13G2.
// Mesma função em toda a varredura: corrente de referência fixa em 20 µA.
import { BIAS, operatingPoint } from './model.js';

export const MIRROR = {
  current: 20,     // µA; I_ref fixa, não gm fixo
  ratio: 1,        // W₂/W₁
  vdsOut: BIAS.vds, // V_DS do transistor de saída, assumido constante (V)
  // A_VT é o coeficiente de Pelgrom em V·µm: σ(ΔV_T) = A_VT/√(W·L).
  mismatchK: 0.5e-3, // V·µm, proxy didático
  // A_beta é o coeficiente relativo do fator de corrente: σ(Δβ/β)=A_β/√(W·L).
  mismatchBeta: 1e-2, // 1%·µm, proxy didático (Jespers & Murmann, Ex. 4.7)
  mismatchReferenceArea: 1, // µm²: fixed-area sensitivity chart, not the sized device
  errorTarget: 1,   // % de erro por mismatch usado como meta didática
};

export function mirrorPoint(efficiency, length) {
  const refCurrent = MIRROR.current; // µA: compare mirrors copying the same current
  const op = operatingPoint(efficiency, length, refCurrent, BIAS.vds);
  const area = op.width * length;           // µm² de cada transistor
  const pairArea = 2 * area;                // o par M1+M2
  const vMinOut = op.headroom;              // same explicit saturation criterion as CS
  const vMaxOut = BIAS.vdd;                 // rail do nó de saída
  // Small threshold perturbation: sigma(Delta I/I) ≈ (gm/ID) sigma(Delta VT).
  // This sensitivity does not require the square-law identity V_OV=2/(gm/ID).
  const sigma = MIRROR.mismatchK / Math.sqrt(area); // V, desvio padrão de V_T
  const error = sigma * efficiency;                // fração (1σ), termo ΔV_T
  const sigmaBeta = MIRROR.mismatchBeta / Math.sqrt(area); // fração, termo Δβ/β
  const sigmaTotal = Math.hypot(error, sigmaBeta);         // fração, 1σ total
  const referenceMismatchPercent = efficiency * MIRROR.mismatchK / Math.sqrt(MIRROR.mismatchReferenceArea) * 100;
  const gain = op.intrinsicGain;                   // gₘ·r_out da carga em espelho
  const areaForError = (MIRROR.mismatchK * efficiency / (MIRROR.errorTarget / 100)) ** 2;
  return {
    ...op, efficiency, length, ratio: MIRROR.ratio, refCurrent, outCurrent: refCurrent * MIRROR.ratio,
    area, pairArea, vMinOut, vMaxOut, swing: vMaxOut - vMinOut,
    sigma, error, errorPercent: error * 100, sigmaBeta, sigmaTotal, sigmaTotalPercent: sigmaTotal * 100,
    referenceMismatchPercent, gain, areaForError,
    compliant: MIRROR.vdsOut >= vMinOut, precise: sigmaTotal * 100 <= MIRROR.errorTarget,
  };
}

export const MIRROR_METRICS = {
  compliance: { key: 'vMinOut', title: 'Tensão de compliance mínima', latex: String.raw`V_{DS,\min}\colon I_D/I_F=99\%`, unit: 'V', shared: true },
  error: { key: 'referenceMismatchPercent', title: 'Mismatch a área fixa', latex: String.raw`\sigma_{\Delta I_D/I_D}\approx\frac{g_m}{I_D}\frac{A_{VT}}{\sqrt{A_{\rm ref}}},\quad A_{\rm ref}=1\,\mu\mathrm m^2`, unit: '%', shared: true },
  width: { key: 'width', title: 'W necessária para 20 µA', latex: String.raw`W=\frac{I_{\rm ref}}{I_D/W}`, unit: 'µm' },
};
