// First-order teaching adaptations, not reproductions of the book's PDK data.
import { BIAS, operatingPoint } from './model.js';
import { MIRROR, mirrorPoint } from './mirrorModel.js';
import { ACTIVE_LOAD, activeLoadPoint } from './activeLoadModel.js';
import { quantity as q, texNumber as n } from './guideMath.js';

export const BOOK = { title: 'Jespers & Murmann · Systematic Design of Analog CMOS Circuits (2017)', url: 'https://doi.org/10.1017/9781108125840' };
export const DIFF_GUIDE = { fu: 10e6, load: 5e-12, loadEfficiency: 10, loadLength: .5 };

export function mirrorGuidePoint(efficiency, length) {
  const p = mirrorPoint(efficiency, length);
  const sigmaVt = p.error, sigmaBeta = MIRROR.mismatchBeta / Math.sqrt(p.area);
  const sigmaTotal = Math.hypot(sigmaVt, sigmaBeta);
  return { ...p, sigmaVt, sigmaBeta, sigmaTotal, sigmaTotalPercent: 100 * sigmaTotal };
}

export function activeGuidePoint(efficiency, length) {
  const p = activeLoadPoint(efficiency, length);
  const referenceGain = p.input.intrinsicGain;
  return { ...p, width: p.loadWidth, density: p.load.density, gm: p.loadGm, referenceGain,
    gainPercentOfIgs: 100 * p.gain / referenceGain, gainLossPercent: 100 * (1 - p.gain / referenceGain) };
}

// Ex. 3.11/3.12: external-load-only gm -> ID -> JD -> W, not fixed ID.
export function diffGuidePoint(efficiency, length) {
  const gm = 2 * Math.PI * DIFF_GUIDE.fu * DIFF_GUIDE.load * 1e6;
  const current = gm / efficiency;
  const input = operatingPoint(efficiency, length, current, BIAS.vds);
  const load = operatingPoint(DIFF_GUIDE.loadEfficiency, DIFF_GUIDE.loadLength, current, BIAS.vds);
  const roLoad = ACTIVE_LOAD.loadVAFactor * load.ro;
  const gain = gm / 1000 / (1 / input.ro + 1 / roLoad);
  return { ...input, input, load, efficiency, length, current, gm, gain, tailCurrent: 2 * current,
    pairArea: 2 * input.area, loadWidth: load.width, roLoad, compliant: input.saturated && load.saturated };
}

const um = String.raw`\mu\mathrm m`, ua = String.raw`\mu\mathrm A`;
export function mirrorLedger(p, e) {
  return String.raw`\begin{aligned}L&=${q(p.length, um)}\\g_m/I_D&=${q(e, String.raw`\mathrm{V^{-1}}`)}\\I_{\rm ref}&=20\,\mu\mathrm A\\W_1=W_2&=${q(p.width, um, 3)}\\\sigma_{\Delta I/I}&=${n(p.sigmaTotalPercent, 3)}\%\end{aligned}`;
}
export function activeLedger(p, e) {
  return String.raw`\begin{aligned}L_L&=${q(p.length, um)}\\(g_m/I_D)_L&=${q(e, String.raw`\mathrm{V^{-1}}`)}\\I_D&=${q(p.current, ua)}\\W_L&=${q(p.loadWidth, um, 3)}\\|A_{v0}|&=${n(p.gain)}\end{aligned}`;
}
export function diffLedger(p, e) {
  return String.raw`\begin{aligned}L&=${q(p.length, um)}\\(g_m/I_D)_{in}&=${q(e, String.raw`\mathrm{V^{-1}}`)}\\g_{m1,2}&=${q(p.gm, String.raw`\mu\mathrm S`)}\\I_{D1,2}&=${q(p.current, ua)}\\I_{\rm tail}&=${q(p.tailCurrent, ua)}\\W_1=W_2&=${q(p.width, um, 3)}\end{aligned}`;
}

// A record of explicit confirmations, never a preview of the defaults.
export function guideChecklist(example, p, efficiency, completed) {
  return [
    { key: 'length', symbol: 'L', label: 'Comprimento escolhido', value: completed >= 2 ? p.length : null, unit: um },
    { key: 'efficiency', symbol: String.raw`g_m/I_D`, label: 'Eficiência escolhida', value: completed >= 2 ? efficiency : null, unit: String.raw`\mathrm{V^{-1}}` },
    { key: 'current', symbol: 'I_D', label: 'Corrente por transistor', value: completed >= (example.block === 'diff' ? 2 : 1) ? p.current : null, unit: ua },
    { key: 'width', symbol: 'W', label: 'Largura calculada', value: completed >= 3 ? p.width : null, unit: um },
  ];
}

const steps = (...pairs) => pairs.map(([title, text], i) => ({ key: ['requirements', 'point', 'geometry', 'result', 'verify'][i], label: ['Requisito', 'Escolha', 'Largura', 'Resultado', 'Verificação'][i], title, text }));

export const BLOCK_EXAMPLES = [
  {
    slug: 'espelho-mismatch', number: '05', block: 'mirror', labRoute: '#/espelho', labLabel: 'Laboratório do espelho',
    tag: 'ESPELHO · PRECISÃO', title: 'Espelho: da corrente ao erro de cópia',
    reference: '§4.3.2 e Exemplo 4.7 · pp. 153–155',
    application: 'Dimensione um espelho 1:1 e estime o erro aleatório de corrente.',
    adaptation: 'O livro estima mismatch de uma geometria dada. Aqui acrescentamos o dimensionamento para uma corrente especificada. Coeficientes e números são ilustrativos.',
    limitations: 'Termos de threshold e fator de corrente independentes; coeficientes da diferença do par, sem √2 adicional. A estimativa de mismatch supõe VDS iguais. Erro sistemático por diferença de VDS não está incluído. Saturação usa o proxy de corrente direta de 99%, não 2/(gm/ID).',
    validation: 'Verifique o ponto DC e a igualdade de VDS; depois use Monte Carlo de mismatch no PDK. 1σ não é erro máximo nem garantia de rendimento.',
    start: { efficiency: 15, length: .5 }, evaluate: mirrorGuidePoint, ledger: mirrorLedger,
    efficiencyEnds: ['Mais forte · menor área', 'Mais fraca · menor tensão exigida'],
    spec: [
      { label: 'Corrente nominal', latex: String.raw`I_{\rm ref}=20\,\mu\mathrm A` },
      { label: 'Cópia nominal', latex: String.raw`W_2/W_1=1` },
      { label: 'Tensão disponível', latex: String.raw`V_{DS,2}=0{,}6\,\mathrm V` },
      { label: 'Meta didática · 1σ', latex: String.raw`\sigma_{\Delta I/I}\le1\%` },
    ],
    steps: steps(
      ['Copiar corrente não é copiar com erro zero.', 'Use dois transistores de mesma geometria. A corrente nominal é dada; a precisão depende da sensibilidade à variação e da área de cada transistor.'],
      ['Escolha o ponto do espelho.', 'Compare os comprimentos. A área final será calculada para a mesma corrente; não confunda essa comparação com manter a área fixa. Os valores iniciais são apenas uma sugestão.'],
      ['Leia a densidade e calcule a largura.', 'Consulte a densidade no ponto escolhido. Divida a corrente de referência por essa densidade e use a mesma largura nos dois transistores.'],
      ['Calcule o erro de corrente de 1σ.', 'Os erros relativos por threshold e por fator de corrente são independentes: some suas variâncias, não seus desvios-padrão.'],
      ['Confira a meta e a tensão disponível.', 'A meta de precisão é estatística. A verificação de saturação é apenas uma estimativa; ainda falta validar o circuito real.']),
  },
  {
    slug: 'carga-ativa-ganho', number: '06', block: 'active', labRoute: '#/carga-ativa', labLabel: 'Laboratório da carga ativa',
    tag: 'CARGA ATIVA · GANHO', title: 'Carga ativa: dimensionar sem perder o ganho de vista',
    reference: '§3.2.1 e Exemplo 3.8 · pp. 94–97',
    application: 'Dimensione o PMOS de carga de um fonte comum já polarizado.',
    adaptation: 'Recorte de primeira ordem do Ex. 3.8: entrada fixa e carga externa dominante. O livro também escolhe a entrada por fT/fu e itera o dimensionamento com as capacitâncias de saída.',
    limitations: 'Neste proxy, gds/ID depende de L e não de gm/ID. PMOS reutiliza a densidade ilustrativa NMOS e um fator de resistência de saída. Self-loading, polos internos e ruído não fazem parte deste roteiro.',
    validation: 'Consulte LUTs PMOS reais; recalcule gm e larguras incluindo Cdd da entrada e da carga, como no Ex. 3.8. Verifique DC, AC e excursão em SPICE.',
    start: { efficiency: 10, length: .5 }, evaluate: activeGuidePoint, ledger: activeLedger,
    efficiencyEnds: ['Mais forte · mais tensão exigida', 'Mais fraca · maior largura'],
    spec: [
      { label: 'Entrada fixada', latex: String.raw`g_{m,1}=300\,\mu\mathrm S` },
      { label: 'Eficiência da entrada', latex: String.raw`(g_m/I_D)_1=15\,\mathrm{V^{-1}}` },
      { label: 'Comprimento da entrada', latex: String.raw`L_1=0{,}5\,\mu\mathrm m` },
      { label: 'Polarização', latex: String.raw`V_{DD}=1{,}2\,\mathrm V,\quad V_{out}=0{,}6\,\mathrm V` },
    ],
    steps: steps(
      ['A entrada determina a corrente da carga.', 'A carga PMOS conduz a mesma corrente do transistor de entrada. Obtenha essa corrente a partir da transcondutância e da eficiência já definidas.'],
      ['Escolha a eficiência e o comprimento do PMOS.', 'O livro usa eficiência de carga próxima de 10 V⁻¹ como compromisso de ganho, tensão exigida e ruído. Não é um ótimo universal. Aqui, compare ganho e largura ao mudar L.'],
      ['Dimensione a largura da carga.', 'Consulte a densidade de corrente do PMOS no ponto escolhido. A corrente já foi definida pela entrada; a largura é a incógnita.'],
      ['Inclua a condutância de saída da carga.', 'A carga real tem resistência finita: sua condutância soma à da entrada. Por isso, o módulo do ganho é menor que no mesmo fonte comum com carga ideal.'],
      ['Confira a polarização e registre o projeto.', 'Verifique a saturação dos dois transistores no ponto quiescente. Ganho e faixa estimada são resultados, não metas arbitrárias de passa/falha.']),
  },
  {
    slug: 'par-diferencial-fluxo', number: '07', block: 'diff', labRoute: '#/par-diferencial', labLabel: 'Laboratório do par diferencial',
    tag: 'PAR DIFERENCIAL · DIMENSIONAMENTO', title: 'Par diferencial: da frequência à corrente de cauda',
    reference: 'Exemplos 3.11 e 3.12 · pp. 105–110',
    application: 'Obtenha a transcondutância, a corrente por ramo e a largura do par de entrada.',
    adaptation: 'Fluxo do livro no limite de carga externa dominante. Ao contrário do laboratório de seleção, aqui gm é fixo e a corrente varia com gm/ID. A carga espelhada converte o sinal diferencial em saída simples.',
    limitations: 'fu ≈ gm/(2πCL) supõe polos não dominantes suficientemente altos. VDS = 0,6 V é assumido nos proxies: não resolvemos VGS, o nó de cauda, efeito de corpo ou modo comum. O ganho inclui a resistência PMOS, mas não os polos do espelho.',
    validation: 'Resolva source, drain e VSB nas LUTs, como nos Ex. 3.11/3.12. Dimensione a cauda, verifique modo comum, saturação de todos os dispositivos e polo do espelho. Só AC em SPICE confirma fu.',
    start: { efficiency: 15, length: .5 }, evaluate: diffGuidePoint, ledger: diffLedger,
    efficiencyEnds: ['Mais forte · maior corrente', 'Mais fraca · menor corrente'],
    spec: [
      { label: 'Frequência de ganho unitário', latex: String.raw`f_u=10\,\mathrm{MHz}` },
      { label: 'Carga externa', latex: String.raw`C_L=5\,\mathrm{pF}` },
      { label: 'Eficiência do espelho PMOS', latex: String.raw`(g_m/I_D)_L=10\,\mathrm{V^{-1}}` },
      { label: 'Comprimento do espelho', latex: String.raw`L_L=0{,}5\,\mu\mathrm m` },
    ],
    steps: steps(
      ['Parta da frequência e da carga.', 'Em primeira ordem, a frequência de ganho unitário e a carga externa determinam a transcondutância de cada transistor de entrada.'],
      ['Escolha a eficiência e o comprimento da entrada.', 'Com a transcondutância definida, a eficiência determina a corrente por ramo. No equilíbrio, a corrente de cauda é o dobro dessa corrente.'],
      ['Calcule a largura de cada transistor.', 'Consulte a densidade no ponto escolhido e divida a corrente de um ramo por essa densidade. M₁ e M₂ recebem a mesma geometria.'],
      ['Distinga ganho do transistor e ganho do estágio.', 'O espelho converte a corrente diferencial em saída simples. Em baixa frequência, o ganho depende tanto da resistência da entrada quanto da carga de saída.'],
      ['Feche as contas, sem confundir estimativa e validação.', 'Recomponha a transcondutância e a corrente de cauda. Recuperar a frequência pela mesma equação é uma conferência algébrica, não uma simulação de banda.']),
  },
];

// All teaching equations live here so every step can be checked in strict KaTeX.
export function guideContent(example, p, efficiency, key) {
  const result = (label, latex) => ({ label, latex });
  const isMirror = example.block === 'mirror', isDiff = example.block === 'diff';
  if (key === 'requirements') {
    if (isMirror) return { formula: String.raw`I_{out,nom}=I_{ref}\frac{W_2}{W_1}=20\,\mu\mathrm A`, results: [], note: 'Mesmo L para ambos; a razão 1:1 é nominal, não uma garantia de precisão.' };
    if (isDiff) return {
      formula: String.raw`g_{m1,2}\approx2\pi f_u C_L`,
      results: [result('Transcondutância por entrada', String.raw`2\pi\cdot10^7\cdot5\cdot10^{-12}=${q(p.gm, String.raw`\mu\mathrm S`)}`)],
      note: 'Carga externa dominante; não inclui capacitâncias de saída nem o polo interno do espelho.',
    };
    return { formula: String.raw`I_D=\frac{g_{m,1}}{(g_m/I_D)_1}`, results: [result('Corrente da entrada e da carga', String.raw`I_D=\frac{300}{15}=${q(p.current, ua)}`)], note: 'A entrada fica fixa durante este exemplo; só dimensionamos a carga PMOS.' };
  }
  if (key === 'point') return {
    formula: isMirror ? String.raw`\sigma_{\Delta I/I}\propto\frac{1}{\sqrt{WL}}\quad\text{a sensibilidade fixa}` : isDiff ? String.raw`I_{D1,2}=\frac{g_{m1,2}}{(g_m/I_D)_{in}},\qquad I_{tail}=2I_{D1,2}` : String.raw`|A_{v0}|=\frac{g_{m,1}}{g_{ds,1}+g_{ds,L}}`,
    results: isDiff ? [result('Corrente por ramo · prévia', q(p.current, ua)), result('Corrente de cauda · prévia', q(p.tailCurrent, ua))] : [],
    note: isMirror ? 'O gráfico usa a área redimensionada para 20 µA, não área fixa. Neste proxy, o termo de threshold fica constante com gm/ID a L fixo; o de fator de corrente diminui com a área.' : isDiff ? 'Confirme o ponto para registrar L, eficiência e corrente. A geometria vem na próxima etapa.' : 'Neste proxy, só L altera gds/ID e o ganho. gm/ID altera a largura e a tensão exigida. O comportamento real deve vir de LUTs PMOS.',
  };
  if (key === 'geometry') return {
    formula: String.raw`J_D=I_D/W,\qquad W=\frac{I_D}{J_D}`,
    results: [result('Densidade consultada · ilustrativa', String.raw`J_D=${q(p.density, String.raw`\mu\mathrm A/\mu\mathrm m`, 3)}`), result('Largura por transistor', String.raw`W=\frac{${n(p.current, 3)}}{${n(p.density, 3)}}\approx${q(p.width, um, 3)}`)],
    note: isDiff ? 'Esta é a largura de cada entrada, não a soma do par. A cauda e as cargas precisam de dimensionamento próprio.' : isMirror ? 'M₁ e M₂ recebem a mesma largura e o mesmo comprimento.' : 'No projeto real, consulte a densidade do PMOS, não a do NMOS.',
  };
  if (key === 'result' && isMirror) return {
    formula: String.raw`\begin{aligned}s_{VT}&=\frac{g_m}{I_D}\frac{A_{VT}}{\sqrt{WL}},\quad s_\beta=\frac{A_\beta}{\sqrt{WL}}\\\sigma_{\Delta I/I}&\approx\sqrt{s_{VT}^2+s_\beta^2}\end{aligned}`,
    results: [result('Contribuição de threshold', String.raw`s_{VT}=${n(p.sigmaVt * 100, 3)}\%`), result('Contribuição de fator de corrente', String.raw`s_\beta=${n(p.sigmaBeta * 100, 3)}\%`), result('Desvio-padrão relativo total', String.raw`\sigma_{\Delta I/I}=${n(p.sigmaTotalPercent, 3)}\%`)],
    note: 'A_VT = 0,5 mV·µm e A_β = 1%·µm são coeficientes ilustrativos da diferença do par. Verifique qual contribuição domina; não suponha que Δβ seja sempre desprezível.',
  };
  if (key === 'result') return {
    formula: isDiff ? String.raw`|A_{v0}|\approx\frac{g_{m1}}{g_{ds1}+g_{ds,L}},\qquad A_i=\frac{g_{m1}}{g_{ds1}}` : String.raw`|A_{v0}|=\frac{(g_m/I_D)_1}{(g_{ds}/I_D)_1+(g_{ds}/I_D)_L}`,
    results: [result(isDiff ? 'Ganho intrínseco da entrada' : 'Fonte comum com carga ideal', String.raw`A_i=${n(isDiff ? p.intrinsicGain : p.referenceGain)}`), result('Ganho do estágio · módulo', String.raw`|A_{v0}|\approx${n(p.gain)}`)],
    note: isDiff ? 'Saída simples com espelho ideal na conversão de corrente: não há fator 1/2 no gm efetivo. O polo do espelho foi omitido.' : 'A redução de ganho é consequência da resistência finita da carga; não imponha a porcentagem de perda do exemplo do livro a este modelo.',
  };
  if (isMirror) return {
    formula: String.raw`\sigma_{\Delta I/I}=${n(p.sigmaTotalPercent, 3)}\%\quad\text{(meta: }1\%\text{)}`,
    results: [result('Tensão disponível', String.raw`V_{DS,2}=0{,}6\,\mathrm V`), result('Mínimo estimado · proxy 99%', String.raw`V_{DS,min}\approx${q(p.vMinOut, String.raw`\mathrm V`, 3)}`)],
    note: `${p.precise ? 'A meta estatística é atendida neste modelo.' : 'A meta estatística não é atendida: reveja o ponto e a área.'} ${p.compliant ? 'A tensão disponível supera o mínimo estimado.' : 'Falta tensão para o critério de saturação.'}`,
  };
  if (isDiff) return {
    formula: String.raw`(g_m/I_D)_{in}I_D=${n(efficiency)}\cdot${n(p.current, 3)}\approx${q(p.gm, String.raw`\mu\mathrm S`)}`,
    results: [result('Corrente de cauda', String.raw`2I_D=${q(p.tailCurrent, ua)}`), result('Frequência recomposta · primeira ordem', String.raw`\frac{g_m}{2\pi C_L}=10\,\mathrm{MHz}`)],
    note: 'Consistência algébrica apenas. Saturação, modo comum e estabilidade ainda dependem do ponto DC e dos polos reais.',
  };
  return {
    formula: String.raw`V_{DS,1}=V_{SD,L}=0{,}6\,\mathrm V`,
    results: [result('Mínimo NMOS estimado', String.raw`V_{DS,min,1}\approx${q(p.input.headroom, String.raw`\mathrm V`, 3)}`), result('Mínimo PMOS estimado', String.raw`V_{SD,min,L}\approx${q(p.loadHeadroom, String.raw`\mathrm V`, 3)}`)],
    note: p.compliant ? 'Ambos têm margem de saturação no proxy de 99%. Isso não valida excursão de sinal nem banda.' : 'O ponto quiescente não atende ao critério de saturação do proxy.',
  };
}
