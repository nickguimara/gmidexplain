import React from 'react';
import SelectionLabPage from './SelectionLabPage';
import { MirrorSchematic } from './CircuitSchematics';
import { mirrorPoint, MIRROR, MIRROR_METRICS } from './mirrorModel';
import { fmt } from './labUi';

const config = {
  key: 'cm', tag: 'CM', title: 'Espelho de corrente', version: 'EXPERIMENTO 02', block: 'mirror',
  csvName: 'gmid-espelho-ilustrativo', schematic: MirrorSchematic, devices: 'NMOS',
  exampleSlug: 'espelho-mismatch',
  caption: 'M₁/M₂ em destaque · razão 1:1 · corrente fixa',
  purpose: 'Escolha o gm/ID: compare a tensão exigida, a sensibilidade ao mismatch a área fixa e a largura necessária para copiar 20 µA.',
  fixedLabel: `I_ref = ${MIRROR.current} µA`, targetLabel: 'gₘ/Iᴅ do espelho',
  assumptions: 'I_ref = I_out = 20 µA; V_DS,out = 0,6 V; V_DD = 1,2 V; T = 27 °C.',
  limitations: 'Densidade e capacitâncias analíticas ilustrativas. A_VT = 0,5 mV·µm é o coeficiente de mismatch do PAR, não de um transistor isolado. Apenas mismatch de threshold; erro sistemático por V_DS não incluído.',
  biasLatex: String.raw`I_{\rm ref}=I_{\rm out}=20\,\mu\mathrm A,\quad g_m=(g_m/I_D)I_D`,
  evaluate: mirrorPoint,
  csvExtras: [
    { header: 'I_ref_uA', value: p => p.current },
    { header: 'gm_uS', value: p => p.gm },
    { header: 'area_dimensionada_um2', value: p => p.area },
    { header: 'mismatch_area_dimensionada_pct', value: p => p.errorPercent },
    { header: 'area_referencia_um2', value: () => MIRROR.mismatchReferenceArea },
  ],
  metrics: MIRROR_METRICS,
  descriptions: {
    compliance: p => `V_DS mínimo estimado: ${fmt(p.vMinOut, 3)} V. Critério operacional: corrente reversa de até 1% da corrente direta num proxy inspirado no EKV. Não é 2/(gm/ID), nem extração do PDK. Curva comum a todos os L neste proxy.`,
    error: p => `Curva crescente de sensibilidade para área de referência fixa em 1 µm² por transistor: ${fmt(p.referenceMismatchPercent, 3)}% (1σ). Não é a área calculada no gráfico de W. Para a W dimensionada a 20 µA, a área por transistor é ${fmt(p.area, 3)} µm² e o mismatch estimado é ${fmt(p.errorPercent, 3)}%. Essa segunda estimativa é plana neste modelo de densidade; nenhum dos resultados é dado de PDK.`,
    width: p => `Cada transistor precisa de W = ${fmt(p.width, 3)} µm para a mesma corrente de 20 µA. Compare a economia de tensão com a largura exigida; não há corrente variável nem ótimo imposto.`,
  },
};
export default function CurrentMirrorPage() { return <SelectionLabPage config={config} />; }
