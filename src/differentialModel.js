// Par diferencial NMOS com carga em espelho de corrente PMOS e fonte de cauda.
// M1/M2 são o par de entrada, M3/M4 o espelho de carga (M3 diodo-conectado) e
// M5 a fonte de cauda. Modelo didático: NÃO é SPICE nem dados do PDK IHP SG13G2.
import { BIAS, designPoint, operatingPoint } from './model.js';

export const DIFF = {
  // Cauda e espelho são polarizados por tensão, então a eficiência deles é uma
  // escolha de projeto e não acompanha o gₘ/Iᴅ do par de entrada.
  tailEfficiency: 12, // V⁻¹
  loadEfficiency: 12, // V⁻¹
  // A carga e a cauda querem ser mais longas que o par: r_o da carga limita o
  // ganho e r_o da cauda limita a rejeição de modo comum.
  lengthFactor: 2,
  maxLength: 1,
  loadVAFactor: 0.6, // V_A do PMOS
  // Coeficiente de Pelgrom para o desvio de V_T entre M1 e M2. Em par, o
  // desvio de área é √2 vezes maior que no transistor isolado.
  avt: 0.5e-3, // V·µm
};

const span = length => Math.min(DIFF.maxLength, length * DIFF.lengthFactor);
const vov = efficiency => 2 / efficiency;

export function differentialPoint(efficiency, length) {
  const input = designPoint(efficiency, length);
  const current = input.current; // corrente em cada ramo do par

  const loadLength = span(length);
  const load = operatingPoint(DIFF.loadEfficiency, loadLength, current, BIAS.vds);
  const tailLength = span(length);
  const tail = operatingPoint(DIFF.tailEfficiency, tailLength, 2 * current, BIAS.vds);

  // Ganho diferencial de saída simples: meio-circuito diferencial, M2 tem dreno
  // virtual e não carrega a saída. A saída vê r_o de M1 em paralelo com r_o do
  // espelho. |A_vd| = g_m,1·(r_o1 ∥ r_o4).
  const roLoad = DIFF.loadVAFactor * load.ro; // kΩ
  const rout = 1 / (1 / input.ro + 1 / roLoad);
  const gain = input.gm * rout / 1000;

  // Rejeição de modo comum: a fonte de cauda é a que rejeita. Para entrada em
  // modo comum, A_cm ≈ R_out/(2·r_tail), contra |A_vd| = g_m·R_out. Logo
  // CMRR = 2·g_m·r_tail = 2·(g_m/I_D)·V_A,cauda — não depende da corrente,
  // só da eficiência da cauda e do L.
  const cmrr = 2 * efficiency * (3 + tailLength * 19);

  // Faixa de entrada em modo comum: o gate não pode descer abaixo da sobrecondução
  // da cauda mais a do par, nem subir acima do que a carga deixa.
  const vMin = vov(efficiency) + vov(DIFF.tailEfficiency);
  const vMax = BIAS.vdd - vov(DIFF.loadEfficiency);
  const icmr = vMax - vMin;

  // Offset de entrada por mismatch: num par, as duas áreas não casam, então
  // σ(V_os) = A_VT/√(2·W·L) — o √2 vem de duas variâncias somadas.
  const offset = DIFF.avt / Math.sqrt(2 * input.area); // V

  return {
    ...input, length,
    input, load, tail,
    loadLength, tailLength, roLoad, rout,
    gain,
    cmrr, cmrrDb: 20 * Math.log10(cmrr),
    vMin, vMax, icmr,
    offset, offsetMv: offset * 1e3,
    compliant: icmr > 0 && vMax > vMin,
    pairArea: 2 * input.area + load.area + tail.area,
  };
}

export const DIFF_METRICS = {
  cmrr: { key: 'cmrrDb', title: 'Rejeição de modo comum', symbol: 'CMRR = 2·(gₘ/Iᴅ)·V_A,cauda', unit: 'dB' },
  icmr: { key: 'icmr', title: 'Faixa de modo comum', symbol: 'V_DD − V_OV,carga − V_OV,cauda − V_OV,1', unit: 'V', shared: true },
  offset: { key: 'offsetMv', title: 'Offset por mismatch', symbol: 'σ(V_os) = A_VT/√(2·W·L)', unit: 'mV' },
};