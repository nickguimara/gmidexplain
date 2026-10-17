// Carga ativa de um único transistor: um NMOS (M1) com um PMOS (ML) por cima,
// alimentados por V_DD. O gate da carga está numa tensão de polarização fixa,
// então a sua sobrecondução — e portanto a sua eficiência — é constante, e não
// acompanha o gₘ/Iᴅ escolhido para a entrada.
// Modelo didático: NÃO é caracterização SPICE nem dados do PDK IHP SG13G2.
import { BIAS, NOISE, designPoint, operatingPoint } from './model.js';

export const ACTIVE_LOAD = {
  // A carga é polarizada por tensão, não por corrente: a eficiência dela é uma
  // escolha de projeto, independente da eficiência da entrada.
  loadEfficiency: 12, // V⁻¹
  // A V_A do PMOS é menor que a do NMOS, então r_o,carga < r_o1 e o par rende
  // menos que o ganho intrínseco do transistor de entrada sozinho.
  loadVAFactor: 0.6,
  outputCap: 2e-12, // F; carga externa do nó de saída
  etaTarget: 15, // V⁻¹; eficiência de referência para a alerta de espaço
};

export function activeLoadPoint(efficiency, length) {
  const input = designPoint(efficiency, length);
  const current = input.current;
  const load = operatingPoint(ACTIVE_LOAD.loadEfficiency, length, current, BIAS.vds);

  // A saída vê as duas impedências ao mesmo tempo.
  const roLoad = ACTIVE_LOAD.loadVAFactor * load.ro; // kΩ
  const rout = 1 / (1 / input.ro + 1 / roLoad); // kΩ
  const gain = input.gm * rout / 1000; // V/V

  // As duas sobreconduções se empilham; a da carga é constante.
  const headroom = input.headroom + load.headroom;
  const swing = BIAS.vdd - headroom;
  const compliant = BIAS.vdd >= headroom;
  // A carga também rouba espaço: em inversão forte a entrada e a carga juntas
  // podem não caber em V_DD.
  const crowded = headroom > 0.5 * BIAS.vdd;

  // Ruído referido à entrada. O par gera 4kTγ(g_m1 + g_m,carga) de corrente de
  // ruído; dividindo pelo ganho g_m1·r_out, o r_out se cancela:
  //   e_n = sqrt(4kTγ/g_m1 · (1 + g_m,carga/g_m1)).
  // Com carga ideal (g_m,carga = 0) volta a ser sqrt(4kTγ/g_m1).
  const noiseRatio = ACTIVE_LOAD.loadEfficiency / efficiency; // g_mL/g_m1
  const thermalNoise = input.thermalNoise * Math.sqrt(1 + noiseRatio); // nV/√Hz

  // fT do par é a do transistor mais lento: o sinal não passa mais rápido que
  // a carga. Com a entrada em L fixo, a corrente acompanha o gₘ/Iᴅ e a fT da
  // entrada cai; a carga fica num piso que não depende do gₘ/Iᴅ.
  const ftInput = input.ft;
  const ftLoad = load.ft;
  const ft = Math.min(ftInput, ftLoad);
  const limitedBy = ftLoad < ftInput ? 'carga' : 'entrada';

  return {
    ...input, length,
    input, load, roLoad, rout,
    gain, intrinsicGain: input.intrinsicGain,
    headroom, swing, compliant, crowded,
    noiseRatio, thermalNoise,
    ftInput, ftLoad, ft, limitedBy,
    pairArea: input.area + load.area,
    loadWidth: load.width,
  };
}

export const ACTIVE_METRICS = {
  headroom: { key: 'headroom', title: 'Headroom do par', symbol: 'V_OV1 + V_OV,carga', unit: 'V', shared: true },
  noise: { key: 'thermalNoise', title: 'Ruído de entrada', symbol: 'e_n = √[4kTγ/g_m1·(1 + g_mL/g_m1)]', unit: 'nV/√Hz', shared: true },
  ft: { key: 'ft', title: 'fT do par', symbol: 'min(f_T,entrada; f_T,carga)', unit: 'GHz' },
};