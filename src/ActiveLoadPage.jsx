import React from 'react';
import SelectionLabPage from './SelectionLabPage';
import { ActiveSchematic } from './CircuitSchematics';
import { ACTIVE_METRICS, activeLoadPoint } from './activeLoadModel';
import { fmt } from './labUi';

const config = {
  key: 'al', tag: 'AL', title: 'Carga ativa', version: 'EXPERIMENTO 03', block: 'active',
  csvName: 'gmid-carga-ativa-ilustrativo', schematic: ActiveSchematic, devices: 'NMOS + PMOS',
  exampleSlug: 'carga-ativa-ganho',
  caption: 'M_L em destaque · slider e L selecionam somente a carga',
  purpose: 'Escolha o gm/ID da carga PMOS: menos tensão exigida, mais ruído adicional ou maior velocidade?',
  fixedLabel: 'I_D = 20 µA; gₘ,entrada = 300 µS', targetLabel: 'gₘ/Iᴅ da carga PMOS', lengthLabel: 'Comprimento da carga PMOS',
  assumptions: 'CS fixo: gm = 300 µS, gm/ID = 15 V⁻¹, L = 0,5 µm. I_D = 20 µA; V_out = 0,6 V; V_DD = 1,2 V; T = 27 °C.',
  limitations: 'M_L é redimensionado a cada ponto, com V_bias reajustado: não é um sweep com gate e geometria fixos. PMOS usa proxies ilustrativos de NMOS para densidade e capacitâncias. Ruído térmico apenas, γ_n = γ_p = 2/3. fT é do dispositivo, não banda do CS.',
  biasLatex: String.raw`I_D=20\,\mu\mathrm A,\quad g_{m,L}=(g_m/I_D)_L I_D`,
  evaluate: activeLoadPoint, metrics: ACTIVE_METRICS,
  csvExtras: [
    { header: 'I_D_uA', value: p => p.current },
    { header: 'gm_carga_uS', value: p => p.loadGm },
    { header: 'W_carga_um', value: p => p.loadWidth },
    { header: 'ruido_total_nV_rtHz', value: p => p.totalNoise },
    { header: 'Vout_min_V', value: p => p.vOutMin },
    { header: 'Vout_max_V', value: p => p.vOutMax },
  ],
  descriptions: {
    headroom: p => `A carga exige V_SD,min ≈ ${fmt(p.loadHeadroom, 3)} V pelo critério ilustrativo de 99% da corrente direta. O CS de referência não muda. Intervalo estimado de saída: ${fmt(p.vOutMin, 3)} a ${fmt(p.vOutMax, 3)} V; não é uma amplitude garantida de sinal.`,
    noise: p => `Contribuição da carga referida à entrada: ${fmt(p.loadNoise, 3)} nV/√Hz. O ruído do CS é fixo em ${fmt(p.inputNoise, 3)} nV/√Hz; somando as potências, o total é ${fmt(p.totalNoise, 3)} nV/√Hz. A corrente fixa faz gm da carga aumentar com seu gm/ID.`,
    ft: p => `fT do PMOS de carga: ${fmt(p.ft, 3)} GHz. A curva não usa min(fT) e não representa a banda do amplificador. Apenas o ponto de inversão e o comprimento da carga variam.`,
  },
};
export default function ActiveLoadPage() { return <SelectionLabPage config={config} />; }
