// Espelho de corrente NMOS com razão 1:1 (M1 diodo-conectado, M2 saída).
// Modelo didático: NÃO é caracterização SPICE nem dados do PDK IHP SG13G2.
// Só o gm é fixo (300 µS); o projeto varia o gm/ID e o L, como no lab do fonte comum.
import { BIAS, operatingPoint } from './model.js';

export const MIRROR = {
  ratio: 1,        // W₂/W₁
  vdsOut: BIAS.vds, // V_DS do transistor de saída, assumido constante (V)
  mismatchK: 0.5e-3, // K_V em V·µm: proxy de Pelgrom para σ(ΔV_T) = K_V/√(W·L)
  errorTarget: 1,   // % de erro por mismatch usado como meta didática
};

export function mirrorPoint(efficiency, length) {
  const refCurrent = BIAS.gm / efficiency; // µA: I_out = I_ref na razão 1:1 ideal
  const op = operatingPoint(efficiency, length, refCurrent, BIAS.vds);
  const area = op.width * length;           // µm² de cada transistor
  const pairArea = 2 * area;                // o par M1+M2
  const vMinOut = op.vov;                   // compliance: V_DS,out,mín ≈ V_OV
  const vMaxOut = BIAS.vdd;                 // rail do nó de saída
  // dI/I = dV_T·(gₘ/Iᴅ): em saturação I ∝ V_OV² e V_OV = 2/(gₘ/Iᴅ).
  const sigma = MIRROR.mismatchK / Math.sqrt(area); // V, desvio padrão de V_T
  const error = sigma * efficiency;                // fração (1σ)
  const gain = op.intrinsicGain;                   // gₘ·r_out da carga em espelho
  const areaForError = (MIRROR.mismatchK * efficiency / (MIRROR.errorTarget / 100)) ** 2;
  return {
    ...op, ratio: MIRROR.ratio, refCurrent, outCurrent: refCurrent * MIRROR.ratio,
    area, pairArea, vMinOut, vMaxOut, swing: vMaxOut - vMinOut,
    sigma, error, errorPercent: error * 100, gain, areaForError,
    compliant: MIRROR.vdsOut >= vMinOut, precise: error * 100 <= MIRROR.errorTarget,
  };
}

export const MIRROR_METRICS = {
  error: { key: 'errorPercent', title: 'Erro de cópia', symbol: '|ΔI|/I = σ(ΔV_T)·gₘ/Iᴅ', unit: '%', description: 'Desvio relativo entre I_out e I_ref, considerando apenas o mismatch de V_T entre M1 e M2.' },
  compliance: { key: 'vMinOut', title: 'Tensão de compliance mínima', symbol: 'Vᴅs,out,mín ≈ 2/(gₘ/Iᴅ)', unit: 'V', shared: true, description: 'Menor V_DS que o transistor de saída precisa para continuar em saturação.' },
  // painis empilhados como no fonte comum: em cima W por L, embaixo a corrente que a largura tem de suprir
  width: { title: 'W para a corrente pedida', symbol: 'W = I_out / (I_out/W)', unit: 'µm' },
};