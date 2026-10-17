// Carga ativa: fonte comum com carga em espelho de corrente PMOS.
// Modelo didático, reusing operatingPoint do fonte comum. NÃO é SPICE nem PDK.
import { BIAS, designPoint, operatingPoint } from './model.js';

export const ACTIVE_LOAD = {
  // O espelho deve ser mais longo que o transistor de entrada: a carga é quem
  // limita o ganho, então um espelho curto desperdiça a V_A do par.
  loadLengthFactor: 2,
  maxLength: 1,
  // A V_A do PMOS é menor que a do NMOS: a carga é o que limita o ganho, e é
  // por isso que o espelho é desenhado mais longo que o transistor de entrada.
  loadVAFactor: 0.6,
  // Mobilidade do PMOS ~ metade da do NMOS. Para a mesma corrente e o mesmo
  // gm/ID, o PMOS precisa de largura dobrada.
  loadMobility: 0.5,
  loadCap: 2e-12, // F; carga externa do nó de saída
};

export function activeLoadPoint(efficiency, length) {
  const input = designPoint(efficiency, length);
  const current = input.current;
  const loadLength = Math.min(ACTIVE_LOAD.maxLength, length * ACTIVE_LOAD.loadLengthFactor);
  // operatingPoint não distingue NMOS de PMOS: o ponto do espelho é calculado
  // como se fosse NMOS e só a largura é corrigida pela mobilidade menor.
  const base = operatingPoint(efficiency, loadLength, current, BIAS.vds);
  const load = { ...base, width: base.width / ACTIVE_LOAD.loadMobility, area: base.width / ACTIVE_LOAD.loadMobility * loadLength };

  // r_out do nó de saída: NMOS de entrada em paralelo com o PMOS do espelho
  const roInput = input.ro;
  const roLoad = (ACTIVE_LOAD.loadVAFactor * (3 + loadLength * 19) * (0.7 + 0.3 * BIAS.vds / 0.6)) / current * 1000;
  const rout = 1 / (1 / roInput + 1 / roLoad); // kΩ
  const gain = input.gm * rout / 1000; // V/V
  const idealGain = input.intrinsicGain;
  const gainRatio = gain / idealGain;

  // O par precisa caber em V_DD: as duas sobreconduções empilhadas.
  const headroom = input.headroom + load.headroom;
  const swing = BIAS.vdd - headroom;
  // O par empilha as duas sobreconduções, então quem limita é V_DD, não V_DS.
  const compliant = BIAS.vdd >= headroom;

  // C_out do nó: parasitas dos dois PLUS a carga externa.
  const capPerWidth = 0.35 + 0.4 * length;
  const cOut = input.width * capPerWidth + load.width * (0.35 + 0.4 * loadLength); // fF
  const cTotal = cOut * 1e-15 + ACTIVE_LOAD.loadCap;
  const bandwidth = 1 / (2 * Math.PI * rout * 1000 * cTotal) / 1e6; // MHz
  // O produto ganho × banda perde o r_out: depende só de gₘ e das capacitâncias.
  const gbw = input.gm * 1e-6 / (2 * Math.PI * cTotal) / 1e6; // MHz

  return {
    ...input, length,
    input, load,
    loadLength, roLoad, rout,
    gain, idealGain, gainRatio,
    headroom, swing, compliant,
    cOut, cTotal, bandwidth, gbw,
    pairArea: input.area + load.area,
  };
}

export const ACTIVE_METRICS = {
  gain: { key: 'gain', title: 'Ganho do estágio', symbol: '|Aᵥ| = gₘ·(r_o1 ∥ r_o,carga)', unit: 'V/V' },
  headroom: { key: 'headroom', title: 'Headroom do par', symbol: 'Vₒᵤₜ ≥ V_OV1 + V_OV,carga', unit: 'V', shared: true },
  bandwidth: { key: 'bandwidth', title: 'Banda do estágio', symbol: 'f₋₃dB = 1/[2π(r_o1 ∥ r_o,carga)(C_L + C_out)]', unit: 'MHz' },
};