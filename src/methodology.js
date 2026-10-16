import { operatingPoint, BIAS, LENGTHS, NOISE } from './model.js';

// Teaching adaptation, not worked examples reproduced from the cited authors.
export const REFERENCES = [
  { title: 'Jespers & Murmann · Systematic Design of Analog CMOS Circuits (2017)', url: 'https://doi.org/10.1017/9781108125840', role: 'Dimensionamento com gm/ID, parâmetros normalizados e tabelas pré-computadas.' },
  { title: 'Murmann · Systematic Design of Analog Circuits Using Pre-Computed Lookup Tables (2016)', url: 'https://www.ieeetoronto.ca/wp-content/uploads/2020/06/20160226toronto_sscs.pdf', role: 'Fluxo: determinar gm → escolher L e gm/ID → calcular ID → consultar ID/W → calcular W.' },
  { title: 'Razavi · Design of Analog CMOS Integrated Circuits, 2ª ed.', url: 'https://people.eecs.berkeley.edu/~pister/140sp20/index.htm', role: 'Relações de pequenos sinais, ganho e resposta em frequência do CS; caps. 3 e 6. Link: programa de curso com as seções do livro.' },
];

export const EFFICIENCIES = Array.from({ length: 41 }, (_, i) => 5 + i * .5);
export const GRID_DESCRIPTION = 'L ∈ {0,13; 0,25; 0,5; 1} µm · gm/ID de 5 a 25 V⁻¹, passo 0,5';
export const EXAMPLES = [
  {
    slug: 'fluxo-basico', aliases: ['ganho-por-banda', 'sinal-lento'], number: '01', title: 'Receptor óptico: da especificação ao transistor', tag: 'FLUXO BÁSICO', objective: 'basic', flow: 'basic',
    application: 'Pré-amplificador de um fotodiodo antes de um comparador, em um enlace de dados.',
    brief: 'O fotodiodo entrega 20 mV. Eleve o sinal e mantenha a banda sobre a carga do enlace.',
    gain: 50, bandwidth: 1e6, bandwidthDesign: 1.2e6, load: 2e-12, speedMargin: 10,
    decision: 'A transcondutância vem da especificação. Comprimento e nível de inversão são escolhas lidas nas curvas normalizadas; corrente e largura são calculadas. Há um ponto de partida sugerido, não uma solução única.',
    steps: [
      { key: 'requirements', label: 'Especificação', title: 'Escreva a especificação do amplificador.', text: 'Ganho, banda, carga, ruído e alimentação definem o que o transistor precisa entregar. As margens de projeto são hipóteses declaradas, não constantes universais.' },
      { key: 'gm', label: 'Transcondutância', title: 'Derive a transcondutância a partir da especificação.', text: 'Produto ganho-banda sobre a carga define o limite inferior, com 20% de margem explícita para cobrir parasitas e variações. Esse valor vale para qualquer ponto escolhido a seguir.' },
      { key: 'point', label: 'Ponto de projeto', title: 'Escolha comprimento e nível de inversão.', text: 'Leia ganho intrínseco e fT nas curvas normalizadas. Canal mais longo dá mais ganho; inversão mais forte dá mais velocidade. Compare os candidatos nos gráficos.' },
      { key: 'density', label: 'Leitura de JD', title: 'Leia a densidade de corrente no ponto escolhido.', text: 'A curva é indexada por comprimento e nível de inversão. Registre a leitura antes de calcular a geometria.' },
      { key: 'dimensions', label: 'Iᴅ e W', title: 'Calcule corrente e largura.', text: 'A corrente é a transcondutância dividida pela eficiência escolhida. A largura vem da densidade lida no gráfico.' },
      { key: 'verify', label: 'Verificação', title: 'Verifique desempenho e margem.', text: 'Recomponha a transcondutância, o ganho e a banda no modelo. A validação final depende de SPICE e do PDK.' },
    ],
  },
  {
    slug: 'sinal-rapido', number: '02', title: 'Sinal rápido, menor corrente', tag: 'BANDA PRIMEIRO', objective: 'current', disabled: true,
    application: 'Pré-amplificador antes de um comparador em um receptor de dados.',
    brief: 'Amplifique pequenos pulsos com a menor corrente que atende ao ganho e à banda especificados.',
    gain: 5, bandwidth: 10e6, load: 200e-15, resistance: 100e3, maxCurrent: 100,
    decision: 'Resolver ID mínimo para cada L e gm/ID; descartar inviáveis; minimizar ID. Em empate, preferir menor área.',
    steps: [
      { key: 'requirements', label: 'Requisitos', title: 'Fixe ganho, banda e carga.', text: 'O ganho especificado é de baixa frequência. A banda deve ser atendida pelo estágio carregado, não apenas pelo transistor.' },
      { key: 'derive', label: 'Transcondutância', title: 'Obtenha um limite inferior de transcondutância.', text: 'Combine ganho e polo de saída. Desprezando a capacitância própria, você obtém um ponto de partida, não o dimensionamento final.' },
      { key: 'lookup', label: 'L e gₘ/Iᴅ', title: 'Resolva corrente, não ajuste sliders.', text: 'Para cada ponto normalizado, calcule a menor corrente que atende simultaneamente ao ganho e à banda. Ordene os pontos viáveis por corrente.' },
      { key: 'scale', label: 'Dimensões', title: 'Escale o dispositivo.', text: 'A corrente é definida pelas equações. A largura vem da densidade de corrente; a transcondutância deve respeitar o limite inferior calculado.' },
      { key: 'parasitics', label: 'Cout e recálculo', title: 'Inclua o carregamento do próprio transistor.', text: 'Consulte Cout/W, calcule Cout e resolva novamente a corrente necessária. Se o limite de 100 µA for excedido, o ponto é descartado.' },
      { key: 'verify', label: 'Verificação', title: 'Verifique banda e custo da solução.', text: 'O ponto escolhido deve satisfazer os requisitos com a corrente calculada. Compare-o com o de menor corrente da grade corrigida.' },
    ],
  },
  {
    slug: 'corrente-limitada', number: '03', title: 'Desempenho com 10 µA', tag: 'ORÇAMENTO → EFICIÊNCIA', objective: 'area', disabled: true,
    application: 'Pré-amplificador de um sensor portátil alimentado por bateria.',
    brief: 'Atenda ao ganho e à banda sem ultrapassar o orçamento de corrente. Entre as soluções viáveis, escolha a menor área de gate.',
    gain: 10, bandwidth: 100e3, load: 2e-12, resistance: 1e6, maxCurrent: 10,
    decision: 'Usar o orçamento como restrição, não como corrente obrigatória. Resolver a corrente por ponto e minimizar a área de gate entre os pontos viáveis.',
    steps: [
      { key: 'requirements', label: 'Orçamento', title: 'A corrente é uma restrição.', text: 'Fixe 10 µA como teto. Defina também um critério para escolher entre soluções viáveis: aqui, menor área de gate.' },
      { key: 'derive', label: 'Eficiência mínima', title: 'Teste a viabilidade antes de dimensionar.', text: 'Derive a transcondutância mínima e divida pelo orçamento para obter um limite de eficiência. Ele ainda ignora parasitas e não garante viabilidade.' },
      { key: 'lookup', label: 'Tabela viável', title: 'Descarte pontos fora do orçamento.', text: 'Resolva a corrente de cada L e gm/ID. Elimine os que precisam de mais de 10 µA, e compare a área dos restantes.' },
      { key: 'scale', label: 'Dimensões', title: 'Calcule a geometria que cabe no orçamento.', text: 'A corrente é a menor que atende às equações naquele ponto. A largura vem da densidade de corrente.' },
      { key: 'parasitics', label: 'Cout e orçamento', title: 'Confirme que os parasitas também cabem.', text: 'Recalcule a corrente com Cout. Se ultrapassar 10 µA, descarte o candidato, em vez de aumentar o orçamento silenciosamente.' },
      { key: 'verify', label: 'Verificação', title: 'Feche requisitos, corrente e área.', text: 'Compare a solução com a menor área viável na grade corrigida. Menor corrente e menor área são objetivos diferentes.' },
    ],
  },
  {
    slug: 'baixo-ruido', number: '04', title: 'Dimensionamento por ruído', tag: 'RUÍDO PRIMEIRO', objective: 'current', disabled: true,
    application: 'Contribuição de ruído térmico do NMOS de um pré-amplificador para sensor de vibração.',
    brief: 'Atenda ao limite de ruído térmico do canal, mantendo ganho e banda, com a menor corrente na grade.',
    gain: 10, bandwidth: 10e3, load: 2e-12, resistance: 1e6, maxCurrent: 100, maxNoise: 10,
    decision: 'Derivar gm da meta de ruído; resolver a corrente por ponto incluindo ganho e banda; minimizar ID entre os pontos viáveis.',
    steps: [
      { key: 'requirements', label: 'Meta de ruído', title: 'Especifique qual ruído está sendo limitado.', text: 'A meta é a densidade de ruído térmico do canal NMOS referida à entrada. Não é ruído RMS nem o ruído total do pré-amplificador.' },
      { key: 'derive', label: 'Transcondutância', title: 'Converta ruído em transcondutância.', text: 'Inverta a expressão de ruído térmico. Compare o limite por ruído com o limite por ganho e banda; use o maior como condição necessária.' },
      { key: 'lookup', label: 'Ponto de projeto', title: 'Transforme transcondutância em corrente.', text: 'Consulte os parâmetros normalizados e resolva a corrente exigida pelo ruído junto com ganho e banda. Escolha a menor corrente viável.' },
      { key: 'scale', label: 'Dimensões', title: 'Calcule a largura a partir da densidade.', text: 'A largura vem da densidade de corrente. Outro requisito pode elevar a transcondutância além do mínimo exigido pelo ruído.' },
      { key: 'parasitics', label: 'Cout e recálculo', title: 'Reconfira banda sem abandonar a meta de ruído.', text: 'Inclua Cout e resolva novamente as mesmas restrições. Mais corrente pode ser necessária; a meta de ruído continua sendo verificada.' },
      { key: 'verify', label: 'Verificação', title: 'Feche ruído, ganho, banda e corrente.', text: 'Verifique cada condição e a decisão na grade. Ruído 1/f e ruído da carga continuam fora deste exercício básico.' },
    ],
  },
];

// All quantities in the solver below are SI, except the returned device data.
// Replace this normalized-data adapter with SPICE LUTs to use a real PDK.
export function lookupDevice(length, efficiency) {
  const unit = operatingPoint(efficiency, length, 1, BIAS.vds);
  return {
    density: unit.density, // µA/µm
    intrinsicGain: unit.intrinsicGain,
    earlyVoltage: unit.ro * 1e-3, // ro[kΩ] × 1 µA -> V
    ft: unit.ft, // GHz, width independent in the didactic model
    outputCapPerWidth: (.35 + .4 * length) * 1e-15, // F/µm, proxy for Cgd + Cdb
    cggPerWidth: unit.cgg / unit.width * 1e-15,
    cgdPerWidth: .12e-15, // illustrative overlap proxy, NOT extracted from a PDK
  };
}

export function deriveLimits(example) {
  const gmBandwidth = example.gain ? 2 * Math.PI * example.gain * example.bandwidth * example.load * 1e6 : null; // µS
  const gmNoise = example.maxNoise ? 4 * NOISE.boltzmann * NOISE.temperature * NOISE.gamma / (example.maxNoise * 1e-9) ** 2 * 1e6 : null;
  return {
    routMax: 1 / (2 * Math.PI * example.bandwidth * example.load),
    gmBandwidth, gmNoise,
    gmMin: Math.max(gmBandwidth || 0, gmNoise || 0),
    efficiencyMin: Math.max(gmBandwidth || 0, gmNoise || 0) / example.maxCurrent,
  };
}

export function evaluateStage(example, design, includeParasitics = true) {
  const point = operatingPoint(design.efficiency, design.length, design.current, BIAS.vds);
  const normalized = lookupDevice(design.length, design.efficiency);
  const rout = 1 / (1 / (point.ro * 1e3) + 1 / example.resistance);
  const physicalOutputCap = point.width * normalized.outputCapPerWidth;
  const outputCap = includeParasitics ? physicalOutputCap : 0;
  const totalCap = example.load + outputCap;
  const gain = point.gm * 1e-6 * rout;
  const bandwidth = 1 / (2 * Math.PI * rout * totalCap);
  const checks = [
    ...(example.gain ? [{ key: 'gain', label: 'Ganho em baixa frequência', pass: gain >= example.gain * (1 - 1e-9) }] : []),
    { key: 'bandwidth', label: 'Banda −3 dB', pass: bandwidth >= example.bandwidth * (1 - 1e-9) },
    { key: 'current', label: 'Orçamento de corrente', pass: design.current <= example.maxCurrent * (1 + 1e-9) },
    ...(example.maxNoise ? [{ key: 'noise', label: 'Ruído térmico NMOS', pass: point.thermalNoise <= example.maxNoise * (1 + 1e-9) }] : []),
    { key: 'saturation', label: 'Saturação aproximada', pass: point.saturated },
  ];
  return { ...point, gain, bandwidth, rout, outputCap, physicalOutputCap, totalCap, normalized, checks, pass: checks.every(check => check.pass) };
}

export function solveCandidate(example, length, efficiency, includeParasitics = false) {
  const data = lookupDevice(length, efficiency);
  const limits = deriveLimits(example);
  const va = data.earlyVoltage, gl = 1 / example.resistance, omega = 2 * Math.PI * example.bandwidth;
  // W = I[A] × 1e6 / JD[µA/µm]; Cout = K × I, K in F/A.
  const k = includeParasitics ? data.outputCapPerWidth * 1e6 / data.density : 0;
  let lower = .01e-6, upper = example.maxCurrent * 1e-6, reason = '';
  let gainCurrent = 0;
  if (example.gain) {
    const denominator = efficiency - example.gain / va;
    if (denominator <= 0) reason = 'Ganho intrínseco insuficiente';
    else { gainCurrent = example.gain * gl / denominator; lower = Math.max(lower, gainCurrent); }
  }
  const noiseCurrent = example.maxNoise ? limits.gmNoise * 1e-6 / efficiency : 0;
  lower = Math.max(lower, noiseCurrent);
  // (I/VA + GL) >= ω(CL + KI); handle both lower- and upper-bound cases.
  const a = 1 / va - omega * k, b = omega * example.load - gl;
  if (Math.abs(a) < 1e-14) { if (b > 0) reason ||= 'Banda inviável neste ponto'; }
  else if (a > 0) lower = Math.max(lower, b / a);
  else upper = Math.min(upper, b / a);
  if (lower > upper * (1 + 1e-10) || upper <= 0) reason ||= 'Banda/ganho exigem corrente fora dos limites';
  // At fixed (L, gm/ID), loaded DC gain is monotonic in I: use the budget for objective 1.
  const current = example.objective === 'gain' ? Math.max(.01, Math.min(example.maxCurrent, upper * 1e6)) : lower * 1e6;
  if (current * 1e-6 > upper * (1 + 1e-10)) reason ||= 'Banda insuficiente no orçamento fixado';
  const design = { length, efficiency, current };
  const point = evaluateStage(example, design, includeParasitics);
  if (!point.pass) reason ||= 'Não atende aos requisitos';
  return { id: `${length}:${efficiency}`, design, point, feasible: !reason, reason, lowerCurrent: lower * 1e6, upperCurrent: upper * 1e6, includeParasitics,
    currentLimits: { gain: gainCurrent * 1e6, noise: noiseCurrent * 1e6, bandwidth: a > 0 ? Math.max(0, b / a * 1e6) : null } };
}

export function compareCandidates(example, a, b) {
  if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
  const main = example.objective === 'gain' ? b.point.gain - a.point.gain : example.objective === 'area' ? a.point.area - b.point.area : a.point.current - b.point.current;
  if (Math.abs(main) > 1e-10) return main;
  return a.point.area - b.point.area || a.design.length - b.design.length || a.design.efficiency - b.design.efficiency;
}

export function buildCandidates(example, includeParasitics = false) {
  if (example.flow === 'basic') throw new Error('O fluxo básico dimensiona um ponto escolhido; não otimiza uma grade.');
  return LENGTHS.flatMap(length => EFFICIENCIES.map(efficiency => solveCandidate(example, length, efficiency, includeParasitics))).sort((a, b) => compareCandidates(example, a, b));
}

export function decisionMatches(example, selected, best) {
  if (!selected?.feasible || !best?.feasible) return false;
  const key = example.objective === 'gain' ? 'gain' : example.objective === 'area' ? 'area' : 'current';
  return Math.abs(selected.point[key] - best.point[key]) <= Math.max(1e-8, Math.abs(best.point[key]) * 1e-8);
}
