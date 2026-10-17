import React from 'react';
import SelectionLabPage from './SelectionLabPage';
import { DiffSchematic } from './CircuitSchematics';
import { DIFF_METRICS, differentialPoint } from './differentialModel';
import { fmt } from './labUi';

const config = {
  key: 'dp', tag: 'DP', title: 'Par diferencial', version: 'EXPERIMENTO 04', block: 'diff', tall: true,
  csvName: 'gmid-par-diferencial-ilustrativo', schematic: DiffSchematic, devices: 'NMOS + PMOS',
  exampleSlug: 'par-diferencial-fluxo',
  caption: 'M₁/M₂ em destaque: gm/ID e L do par de entrada',
  purpose: 'Escolha o gm/ID da entrada comparando ganho intrínseco, ruído, linearidade, mismatch, velocidade e área × corrente.',
  fixedLabel: 'I_D = 20 µA por transistor de entrada', targetLabel: 'gₘ/Iᴅ de M₁ e M₂', lengthLabel: 'Comprimento de M₁ e M₂',
  assumptions: 'I_D = 20 µA por entrada e I_cauda = 40 µA fixos; gm de cada carga = 240 µS e L_carga = 1 µm; T = 27 °C; HD3 alvo = −60 dBc.',
  limitations: 'Somente gm/ID e L de M1/M2 variam; gm da entrada é recalculado. Ruído apenas térmico de canal do par de entrada, sem contribuição das cargas ou da cauda. Cauda ideal para linearidade; expansão cúbica de um proxy EKV, não simulação harmônica do circuito. Offset somente do par NMOS, sem mismatch das cargas.',
  biasLatex: String.raw`I_{D1,2}=20\,\mu\mathrm A,\quad g_{m1,2}=(g_m/I_D)_{in}I_{D1,2}`,
  evaluate: differentialPoint, metrics: DIFF_METRICS,
  csvExtras: [
    { header: 'I_ramo_uA', value: p => p.current },
    { header: 'I_cauda_uA', value: p => 2 * p.current },
    { header: 'W_entrada_um', value: p => p.input.width },
    { header: 'area_par_entrada_um2', value: p => p.pairArea },
    { header: 'HD3_alvo_dBc', value: p => p.hd3Db },
    { header: 'gm_carga_uS', value: p => p.load.gm },
    { header: 'gm_entrada_uS', value: p => p.input.gm },
    { header: 'ruido_entrada_V2_Hz', value: p => p.thermalNoisePSD },
    { header: 'ruido_entrada_nV_rtHz', value: p => p.thermalNoise },
  ],
  descriptions: {
    intrinsicGain: p => `Ganho intrínseco de cada transistor de entrada: ${fmt(p.intrinsicGain, 1)} V/V. É gm/gds, como no CS com carga ideal; não é o ganho do estágio diferencial com espelho, que depende também das cargas e da topologia.`,
    linearity: p => `Amplitude diferencial estimada: ${fmt(p.linearityMv, 3)} mV de pico (não pico a pico). Alvo HD3 ≤ −60 dBc em aproximação de terceira ordem. Quanto maior gm/ID, menor a amplitude linear neste proxy. Não inclui distorção do espelho ou modulação de canal.`,
    noise: p => `Densidade de potência do ruído térmico do par de entrada: ${fmt(p.noisePower, 3)} nV²/Hz. A expressão está em V²/Hz; o eixo usa nV²/Hz (fator 10¹⁸). I_D = 20 µA por ramo, então gm = ${fmt(p.input.gm, 1)} µS aumenta com gm/ID e o ruído diminui. A raiz equivale a ${fmt(p.thermalNoise, 3)} nV/√Hz. Não inclui ruído das cargas ou cauda.`,
    ft: p => `fT de cada transistor de entrada: ${fmt(p.ft, 3)} GHz. Não é fT do par nem banda do OTA. L maior e maior gm/ID custam velocidade no modelo ilustrativo.`,
    mismatch: p => `Mismatch expresso como offset de entrada de 1σ ≈ ${fmt(p.offsetMv, 3)} mV, não erro percentual de corrente. A_VT = 0,5 mV·µm usa a convenção da diferença de thresholds do par, sem √2 adicional. A área varia a corrente fixa; menor offset acompanha o aumento de área de M1/M2.`,
    areaCurrent: p => `Comparação separada a gm fixo em ${fmt(p.comparisonGm, 0)} µS por entrada, com gm/ID no eixo x dos dois painéis. Acima, área de gate dos dois transistores (log); abaixo, corrente total de cauda (linear). Neste ponto: I_cauda,ref = ${fmt(p.comparisonCurrent, 1)} µA e A_ref = ${fmt(p.comparisonArea, 3)} µm². Os outros cinco gráficos continuam a 20 µA por ramo; sua área nesse caso é ${fmt(p.pairArea, 3)} µm². Não inclui área das cargas, cauda ou layout.`,
  },
};
export default function DifferentialPage() { return <SelectionLabPage config={config} />; }
