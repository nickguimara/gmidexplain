// Guided, didactic examples for the three selection blocks. Each one follows the
// step structure of a worked example from Jespers & Murmann, adapted to the same
// illustrative model used by the labs. Numbers are NOT PDK data and are NOT a
// numerical reproduction of the book's tables.
import { BIAS, designPoint } from './model.js';
import { MIRROR, mirrorPoint } from './mirrorModel.js';
import { ACTIVE_LOAD, activeLoadPoint } from './activeLoadModel.js';
import { DIFF, differentialPoint } from './differentialModel.js';
import { quantity, texNumber as n } from './guideMath.js';

export const BOOK = {
  title: 'Jespers & Murmann · Systematic Design of Analog CMOS Circuits (2017)',
  url: 'https://doi.org/10.1017/9781108125840',
};

// Mirror: add the Δβ/β term to the threshold term, both from the sized area.
export function mirrorGuidePoint(efficiency, length) {
  const point = mirrorPoint(efficiency, length);
  const sigmaVt = point.error;                                    // fração (1σ)
  const sigmaBeta = MIRROR.mismatchBeta / Math.sqrt(point.area);  // fração (1σ)
  const sigmaTotal = Math.hypot(sigmaVt, sigmaBeta);
  return { ...point, sigmaVt, sigmaBeta, sigmaTotal, sigmaTotalPercent: sigmaTotal * 100 };
}

// Active load: the CS input stage is a fixed reference; compare against it.
export function activeGuidePoint(efficiency, length) {
  const point = activeLoadPoint(efficiency, length);
  const referenceGain = designPoint(ACTIVE_LOAD.inputEfficiency, ACTIVE_LOAD.inputLength).intrinsicGain;
  return { ...point, referenceGain, gainPercentOfIgs: point.gain / referenceGain * 100, gainLossPercent: (1 - point.gain / referenceGain) * 100 };
}

// Quadros finais (KaTeX) testáveis fora do React.
export function mirrorLedger(point, efficiency) {
  return String.raw`\begin{aligned}L&=${quantity(point.length, String.raw`\mu\mathrm m`)}\\ \frac{g_m}{I_D}&=${quantity(efficiency, String.raw`\mathrm{V^{-1}}`)}\\ I_{\rm ref}&=I_{\rm out}=20\,\mu\mathrm A\\ W&=W_1=W_2\approx${quantity(point.width, String.raw`\mu\mathrm m`, 3)}\\ \sigma_{\Delta I/I}&\approx${n(point.sigmaTotalPercent, 3)}\%\end{aligned}`;
}

export function activeLedger(point, efficiency) {
  return String.raw`\begin{aligned}L_L&=${quantity(point.length, String.raw`\mu\mathrm m`)}\\ \left(\frac{g_m}{I_D}\right)_L&=${quantity(efficiency, String.raw`\mathrm{V^{-1}}`)}\\ I_D&=20\,\mu\mathrm A\\ W_L&\approx${quantity(point.loadWidth, String.raw`\mu\mathrm m`, 3)}\\ A_{v0}&\approx${n(point.gain, 2)}\end{aligned}`;
}

export function diffLedger(point, efficiency) {
  return String.raw`\begin{aligned}L&=${quantity(point.length, String.raw`\mu\mathrm m`)}\\ \left(\frac{g_m}{I_D}\right)_{in}&=${quantity(efficiency, String.raw`\mathrm{V^{-1}}`)}\\ I_{D1,2}&=20\,\mu\mathrm A,\qquad I_{\rm tail}=40\,\mu\mathrm A\\ W&\approx${quantity(point.input.width, String.raw`\mu\mathrm m`, 3)}\\ g_{m1,2}&\approx${quantity(point.input.gm, String.raw`\mu\mathrm S`, 0)}\end{aligned}`;
}

export const BLOCK_EXAMPLES = [
  {
    slug: 'espelho-mismatch', number: '05', block: 'mirror', labRoute: '#/espelho', labLabel: 'Laboratório do espelho',
    tag: 'PRECISÃO E CÓPIA',
    title: 'Espelho de corrente: copiar 20 µA com precisão',
    reference: 'Exemplo 4.7 — Random Mismatch Estimation in a Current Mirror',
    application: 'Espelho NMOS 1:1 que copia a corrente de referência de um bloco de polarização.',
    brief: 'Copie 20 µA com desvio de 1σ próximo de 1% e mantenha 0,6 V de compliance na saída.',
    decision: 'Escolha gm/ID e L para equilibrar mismatch, headroom e área. A meta de 1% é um critério didático, não um ótimo imposto.',
    start: { efficiency: 15, length: .5 },
    evaluate: mirrorGuidePoint,
    errorTarget: MIRROR.errorTarget,
    efficiencyEnds: ['5 V⁻¹ · menos área, mais mismatch (Δβ)', '25 V⁻¹ · mais área, mais compliance'],
    spec: [
      { label: 'Corrente copiada', latex: String.raw`I_{\rm ref}=I_{\rm out}=20\,\mu\mathrm A` },
      { label: 'Razão de espelho', latex: String.raw`W_2/W_1=1` },
      { label: 'Compliance de saída', latex: String.raw`V_{DS,\rm out}\ge 0{,}6\,\mathrm V` },
      { label: 'Meta de erro 1σ', latex: String.raw`\sigma_{\Delta I/I}\lesssim 1\%` },
    ],
    steps: [
      { key: 'requirements', label: 'Objetivo', title: 'Fixe a corrente e a meta de matching.', text: 'Um espelho 1:1 só é exato se os dois transistores forem idênticos. A corrente é imposta (I_ref = I_out = 20 µA); o que resta escolher é o nível de inversão e o comprimento, que definem área, mismatch e a tensão mínima de saída.' },
      { key: 'point', label: 'gₘ/Iᴅ e L', title: 'Escolha o nível de inversão e o comprimento.', text: 'A área cresce com gm/ID (W ∝ (gm/ID)²) e com L. Mais área reduz o mismatch; mais gm/ID reduz a tensão de compliance exigida. Compare sensibilidade a área fixa e compliance antes de decidir.' },
      { key: 'geometry', label: 'Geometria', title: 'Calcule a largura a partir da densidade de corrente.', text: 'A corrente é fixa. Lida a densidade ID/W no ponto escolhido, a largura vem de W = I_ref/(ID/W). A área de gate é W·L por transistor.' },
      { key: 'mismatch', label: 'Mismatch', title: 'Some os termos ΔV_T e Δβ em variância.', text: 'Como no Exemplo 4.7, o erro 1σ de corrente combina a diferença de threshold e a diferença de fator de corrente: σ² = σ²(ΔV_T) + σ²(Δβ/β). O termo ΔV_T cresce com gm/ID; ambos caem com a raiz da área.' },
      { key: 'verify', label: 'Verificação', title: 'Confirme compliance, matching e área.', text: 'Recoloque os números no modelo: a tensão da saída precisa exceder a compliance estimada e o erro 1σ precisa caber na meta. Valide depois com SPICE e o PDK.' },
    ],
  },
  {
    slug: 'carga-ativa-ganho', number: '06', block: 'active', labRoute: '#/carga-ativa', labLabel: 'Laboratório da carga ativa',
    tag: 'GANHO E HEADROOM',
    title: 'Carga ativa: ganho contra headroom',
    reference: 'Exemplo 3.8 — Sizing a CS Stage with Active Load',
    application: 'Carga PMOS no dreno de um CS para elevar o ganho de tensão.',
    brief: 'Some um PMOS de carga ao CS de referência (gm = 300 µS) e quantifique a perda de ganho, o headroom e o ruído adicional.',
    decision: 'Escolha gm/ID da carga para equilibrar faixa de saída e ruído — o livro adota ≈10 V⁻¹. Neste modelo, o comprimento L₂ é o que mais altera o ganho.',
    start: { efficiency: 10, length: .5 },
    evaluate: activeGuidePoint,
    efficiencyEnds: ['5 V⁻¹ · menos ruído, menos faixa', '25 V⁻¹ · mais ruído, mais faixa'],
    spec: [
      { label: 'CS de referência', latex: String.raw`g_{m,1}=300\,\mu\mathrm S` },
      { label: 'Corrente', latex: String.raw`I_D=20\,\mu\mathrm A` },
      { label: 'Alimentação', latex: String.raw`V_{DD}=1{,}2\,\mathrm V` },
      { label: 'Saída quiescente', latex: String.raw`V_{\rm out}=0{,}6\,\mathrm V` },
    ],
    steps: [
      { key: 'requirements', label: 'Objetivo', title: 'Fixe o CS de entrada e a alimentação.', text: 'O transistor de entrada M1 é uma referência fixa (gm = 300 µS, gm/ID = 15 V⁻¹, L = 0,5 µm). O novo grau de liberdade é a carga PMOS: seu nível de inversão e seu comprimento. A corrente continua 20 µA.' },
      { key: 'point', label: 'gₘ/Iᴅ e L da carga', title: 'Escolha o gm/ID e o comprimento da carga.', text: 'A carga adiciona uma condutância gds₂ em paralelo com gds₁, então o ganho cai. Neste modelo, (gds/ID)₂ depende principalmente de L₂, não do gm/ID: o deslizante troca faixa de saída por ruído adicional, enquanto o comprimento define o ganho. O livro ancora o gm/ID da carga em ≈10 V⁻¹.' },
      { key: 'gain', label: 'Ganho', title: 'Combine as saídas de M1 e da carga.', text: 'O ganho de baixa frequência é gm₁/(gds₁+gds₂). Compare com o ganho do CS com fonte de corrente ideal para medir a perda. Aqui, alongar L₂ reduz gds₂/ID e recupera ganho; o gm/ID da carga quase não muda esse número.' },
      { key: 'noise', label: 'Ruído da carga', title: 'Some o ruído da carga em potência.', text: 'A carga injeta corrente de ruído que, referida à entrada, vale √(4kTγ g_m,L)/gm₁. Fontes independentes somam como potência. Corrente fixa faz gm,L aumentar com o gm/ID da carga.' },
      { key: 'verify', label: 'Verificação', title: 'Confirme faixa de saída e velocidade.', text: 'A saída só pode excursionar entre a compliance do NMOS e a da carga PMOS. A fT é do dispositivo de carga, não a banda do amplificador. Refaça as contas no modelo e valide depois com SPICE.' },
    ],
  },
  {
    slug: 'par-diferencial-fluxo', number: '07', block: 'diff', labRoute: '#/par-diferencial', labLabel: 'Laboratório do par diferencial',
    tag: 'ENTRADA DIFERENCIAL',
    title: 'Par diferencial: da corrente de cauda ao ganho',
    reference: 'Exemplos 3.11 e 3.12 — Sizing a Differential Pair / Differential Amplifier with Current-Mirror Load',
    application: 'Estágio de entrada diferencial alimentado por uma cauda de corrente.',
    brief: 'Dimensione M₁/M₂ para I_D = 20 µA por ramo (cauda de 40 µA) com ganho, ruído e linearidade conhecidos.',
    decision: 'Escolha gm/ID e L da entrada. As cargas (gm = 240 µS) e a cauda ficam fixas como referências; não há ótimo imposto.',
    start: { efficiency: 15, length: .5 },
    evaluate: differentialPoint,
    hd3Db: DIFF.hd3Db, tailCurrent: DIFF.current * 2,
    efficiencyEnds: ['5 V⁻¹ · menos gm e área', '25 V⁻¹ · mais gm e área'],
    spec: [
      { label: 'Corrente por ramo', latex: String.raw`I_{D1,2}=20\,\mu\mathrm A` },
      { label: 'Corrente de cauda', latex: String.raw`I_{\rm tail}=2I_D=40\,\mu\mathrm A` },
      { label: 'Carga PMOS', latex: String.raw`g_{m,L}=240\,\mu\mathrm S` },
      { label: 'Alvo de distorção', latex: String.raw`\mathrm{HD3}\le -60\,\mathrm{dBc}` },
    ],
    steps: [
      { key: 'requirements', label: 'Objetivo', title: 'Fixe a corrente de cauda e as cargas.', text: 'A cauda impõe 20 µA em cada ramo, então I_cauda = 40 µA. As cargas PMOS (gm = 240 µS, L = 1 µm) são referências fixas; o par de entrada é o que dimensionamos. Como no Exemplo 3.12, o ganho de baixa frequência do par com espelho é o de um CS carregado ativamente.' },
      { key: 'point', label: 'gₘ/Iᴅ e L', title: 'Escolha o gm/ID e o comprimento do par.', text: 'Com corrente fixa, gm = (gm/ID)·I_D cresce com o nível de inversão. Isso melhora o ruído, mas sobe a área e reduz a amplitude linear e a fT. Compare ganho intrínseco, ruído, linearidade e offset.' },
      { key: 'geometry', label: 'Geometria', title: 'Calcule a largura de M1 e M2.', text: 'A corrente por ramo é fixa. Lida a densidade ID/W no ponto, W = I_D/(ID/W). A área do par é 2·W·L; mais gm/ID exige mais área.' },
      { key: 'performance', label: 'Desempenho', title: 'Leia ganho, ruído, offset e linearidade.', text: 'O ruído diferencial do par é 8kTγ_n/gm1,2, decrescente com gm/ID. O offset 1σ é A_VT/√(WL). A amplitude linear para HD3 ≤ −60 dBc cai quando gm/ID cresce, no proxy de terceira ordem.' },
      { key: 'verify', label: 'Verificação', title: 'Confirme cauda, saturação e velocidade.', text: 'A cauda continua em 40 µA e cada ramo em 20 µA. A fT é de cada transistor de entrada, não a banda do estágio. Feche as contas e valide com SPICE e o PDK.' },
    ],
  },
];
