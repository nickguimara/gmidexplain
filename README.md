# gm/ID lab

Laboratório web em português para explorar dimensionamento CMOS pelo método gm/ID. Primeiro experimento: fonte comum NMOS com fonte de corrente ideal como carga. Segundo experimento: espelho de corrente NMOS com razão 1:1. Terceiro: carga ativa de um único transistor sobre o fonte comum. Quarto: par diferencial com espelho de carga e cauda. Todos os quatro blocos do menu estão implementados.

## Executar

```sh
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite. `npm run build` gera o site estático em `dist/`.

## Dados e limites

**As curvas são ilustrativas, não dados simulados do PDK IHP SG13G2. Não use para dimensionamento de fabricação.**

O modelo em `src/model.js` usa relações analíticas ilustrativas para densidade, resistência de saída e capacitâncias. Na faixa do slider, J_D = 377/((gₘ/Iᴅ)²·L) µA/µm. O piso numérico de densidade no código não constitui uma caracterização de subthreshold, nem torna essa lei válida em inversão fraca. Curvas não precisam ser monotônicas por princípio: a tendência depende de quais grandezas ficam constantes. O único controle contínuo é gm/ID; L continua como seleção discreta. Os quatro blocos são ferramentas de escolha de inversão, não soluções completas de polarização.

O circuito assume VDD = 1,2 V, **gm = 300 µS** e VDS = 0,6 V. Para comparar soluções de mesma transcondutância, a corrente varia como ID = gm/(gm/ID): de 60 µA a 12 µA. O consumo estático é VDD × ID. A área mostrada é apenas W × L do NMOS, não a área de layout ou da fonte de corrente. `designPoint` centraliza essa condição para a interface, os gráficos e a exportação.

A fonte de corrente ideal tem resistência incremental infinita, logo o ganho em módulo é gm × ro = gm/gds. VDS é um ponto de polarização assumido para a caracterização; a fonte ideal não o determina sozinha. A frequência fT é intrínseca e não a banda do estágio.

A tensão mínima de saturação usa um **critério operacional explícito de 99% da corrente direta**, não a igualdade universal VDS,sat = 2/(gm/ID). `src/selectionPhysics.js` inverte a eficiência de um proxy inspirado no EKV, I_F ∝ log²(1+exp(z)), e calcula V_DS mínimo para I_R/I_F = 1%. Usa n = 1,4 e U_T = 25,85 mV; não inclui canal curto nem dependência com L. **Não é uma extração do PDK nem swing.** Em gm/ID = 10, resulta aproximadamente 0,191 V. A validação real deverá substituir este proxy por LUTs, preservando um critério declarado. A densidade e as capacitâncias são proxies separados, não um modelo compacto único.

O gráfico área × corrente usa o mesmo eixo horizontal dos demais — gm/ID — em dois painéis empilhados **para gm dado (300 µS)**: acima, área de gate W·L (µm², log) por L; abaixo, corrente I_D = gm/(gm/ID) (µA, linear), independente de L. O gráfico de fT usa a mesma altura de SVG. O slider e o clique no gráfico movem o ponto nos dois painéis. A potência permanece no CSV como VDD × ID. O transistor M1 do CS é destacado em laranja, usando o mesmo símbolo MOS dos outros blocos.

A faixa de comprimento inclui 0,13 µm para exploração conceitual: sua validade para cada dispositivo real deve ser verificada no PDK.

`npm test` verifica a consistência das relações do modelo didático (não a validade física contra o PDK).

## Espelho de corrente (razão 1:1)

Em `/#/espelho`, **I_ref = I_out = 20 µA fica fixa**, enquanto gm/ID e L escolhem a geometria. Não é mais uma comparação a gm fixo. `src/mirrorModel.js` alimenta três gráficos:

- **Compliance mínima:** o mesmo critério de saturação de 99% usado no CS.
- **Mismatch a área fixa:** σ(ΔI/I) ≈ (gm/ID)·A_VT/√A_ref, com A_ref = 1 µm² por transistor e A_VT = 0,5 mV·µm. É uma curva crescente de sensibilidade à diferença de thresholds, comum aos L. **Não é o mismatch da geometria redimensionada no gráfico de W.** O texto e o CSV mostram também essa segunda estimativa e a área calculada. Nesta lei ilustrativa, a 20 µA, W ∝ (gm/ID)² e a estimativa da geometria dimensionada fica plana. Não se força a tendência nem se alega reproduzir uma figura específica do livro.
- **W necessária para 20 µA:** W = I_ref/(I_D/W), uma curva por L, sem painel de corrente.

A_VT usa a convenção de **diferença de thresholds do par**, igual à do offset do bloco diferencial. Não há fator √2 adicional. O erro sistemático devido a V_DS desigual, mismatch de fator de corrente e variações de layout não são incluídos. CSV: `gmid-espelho-ilustrativo.csv`.

## Carga ativa de um único transistor

Em `/#/carga-ativa`, slider e seletor de L afetam **apenas o PMOS de carga**. O CS fica fixo em gm = 300 µS, gm/ID = 15 V⁻¹, L = 0,5 µm e I_D = 20 µA. A carga é redimensionada e V_bias reajustado a cada ponto; não é um sweep de tensão de um transistor de geometria fixa.

`src/activeLoadModel.js` oferece headroom exigido pela carga, ruído adicional referido à entrada e fT da carga. A corrente fixa faz gm_L crescer com seu gm/ID: ganha-se espaço de tensão ao custo de mais ruído térmico. O ruído adicional é √(4kTγ_p gm_L)/gm_1; a contribuição fixa da entrada soma em potência para obter o total, mostrado no texto/CSV. γ_n = γ_p = 2/3 é ilustrativo.

Não há mais “fT do par = min(fT)”: fT é uma característica do dispositivo, não a banda do estágio. O intervalo de saída é [V_DS,min,n; V_DD − V_SD,min,p], sem alegar amplitude de sinal garantida. Dados PMOS de densidade/capacitância ainda são proxies compartilhados com NMOS; não representam a diferença de mobilidade de um PDK real.

## Par diferencial (com espelho de carga e cauda)

Em `/#/par-diferencial`, há seis gráficos: **ganho intrínseco, ruído, linearidade, mismatch, fT da entrada e área × corrente**, todos contra gm/ID de **M1/M2**, destacados em laranja no circuito. I_D = 20 µA **por ramo** e I_cauda = 40 µA ficam fixos, enquanto gm_1,2 = (gm/ID)_in·I_D varia de 100 a 500 µS. L seleciona apenas as entradas. Cargas (gm = 240 µS e L = 1 µm) e cauda não variam com o slider. CMRR e ICMR não participam da seleção.

- **Ganho intrínseco:** gm/gds de cada transistor de entrada, como no CS com carga ideal. Não é o ganho do estágio com espelho.

- **Linearidade:** amplitude diferencial de pico para HD3 ≤ −60 dBc. Proxy simétrico inspirado no EKV, com cauda ideal. A expansão I_diff = gm·v + a3·v³ dá a3/gm = g3/(24gm) − (g2/gm)²/8, incluindo o deslocamento da fonte comum. A amplitude estimada é √(4·10⁻³/|a3/gm|). Não há sweep de amplitude na UI, nem simulação harmônica do espelho. Teste independente confere os harmônicos da transferência do proxy.
- **Ruído:** exatamente a PSD diferencial do par de entrada, S_v = overline(v_in,diff²)/Δf = 8kTγ_n/gm_1,2 = 8kTγ_n/[(gm/ID)_in·I_D1,2], γ_n = 2/3 e T = 300,15 K. Sem multiplicador de carga: não inclui PMOS, cauda ou 1/f. A expressão está em **V²/Hz**, o eixo em **nV²/Hz** (fator 10¹⁸); a raiz em nV/√Hz é apenas leitura complementar no texto e CSV. A corrente fixa torna a PSD decrescente com gm/ID; isso não é a comparação anterior a gm fixo.
- **fT da entrada:** valor por dispositivo, nunca banda do par/OTA.
- **Mismatch de entrada:** expresso como offset σ(V_OS) = A_VT/√(WL), em mV, não erro percentual de corrente. A_VT é definido para a diferença de thresholds, sem √2 adicional. Só o mismatch de threshold das entradas; não inclui cargas/cauda.
- **Área × corrente para gm dado:** comparação de referência **separada**, a gm_1,2 = 300 µS, com gm/ID no eixo x. Acima, área de gate 2WL recalculada para esse gm; abaixo, corrente de cauda de referência 2gm/(gm/ID), de 120 a 24 µA. Os outros cinco gráficos e o circuito permanecem a **20 µA por ramo/40 µA de cauda**. Texto, cartão e CSV distinguem área/corrente da comparação das grandezas do ponto real de seleção; fora de gm/ID = 15 elas diferem. A área não inclui cargas/cauda ou layout. A fT usa a mesma altura de SVG para alinhar a última linha.

## Ruído

No exemplo de baixo ruído, a contribuição de canal NMOS referida à entrada é `en = sqrt(4kTγ/gm)`, em nV/√Hz, com gm convertido para siemens, T = 300,15 K e γ = 2/3 (aproximação de canal longo). Não inclui 1/f, ruído da carga ou de outros componentes, nem ruído RMS integrado. A meta de 10 nV/√Hz exige gm ≥ aproximadamente 110,5 µS. Para cada gm/ID e L, o solucionador exige `ID ≥ gm,ruído/(gm/ID)`, além das condições de ganho e banda. Isso não garante o ruído total do pré-amplificador real e não é uma caracterização do PDK.

## Exemplos guiados

Os botões abaixo do laboratório abrem páginas próprias com seis etapas e pipeline fixa no topo. Não há sliders livres nos exemplos. A lateral direita mantém uma checklist permanente dos quatro parâmetros do transistor — **L, gm/ID, I_D e W** — preenchida conforme as etapas são concluídas. Ela fica fixa (*sticky*) em telas largas e vira uma faixa horizontal acima do conteúdo em telas estreitas.

- `/#/exemplos/fluxo-basico`: **fluxo básico de Murmann** começando de uma especificação real (receptor óptico: A0 ≥ 50, banda ≥ 1 MHz, C_L = 2 pF). Deriva g_m, escolhe L e gm/ID pelos gráficos, lê ID/W e calcula I_D e W. Aliases antigos: `ganho-por-banda` e `sinal-lento`.
- `/#/exemplos/sinal-rapido`, `/corrente-limitada` e `/baixo-ruido`: **temporariamente desabilitados** (`disabled: true` em `src/methodology.js`). Os cartões aparecem como "EM BREVE", a rota direta mostra um aviso e a navegação "outros exemplos" os lista sem link. O solucionador e os testes desses fluxos continuam intactos para reativação futura.
- `/#/exemplos/espelho-mismatch`, `/carga-ativa-ganho` e `/par-diferencial-fluxo`: **um guia por bloco de seleção**, com cinco etapas cada, adaptados de três exemplos do livro — Ex. 4.7 (mismatch em espelho de corrente), Ex. 3.8 (CS com carga ativa) e Ex. 3.11/3.12 (par diferencial). Cada página de bloco traz a sua própria seção "Aplique o método" (como o fonte comum), com o cartão do seu exemplo; o link "Ver exemplo guiado" no cabeçalho e o atalho "Exemplos guiados" da barra lateral apontam para a mesma seção.

As rotas por hash permitem abrir/recarregar cada página e usar voltar/avançar do navegador em hospedagem estática, sem configurar fallback de servidor. Não há backend, simulador ou persistência dos dimensionamentos entre páginas.

### Um exemplo por bloco (guias 5 a 7)

`src/blockExamples.js` guarda os dados (referência do livro, condições, etapas, textos) e as funções puras de cada guia; `src/BlockGuidePage.jsx` é a casca compartilhada, que troca apenas o conteúdo da etapa. Cada exemplo é servido na seção "Aplique o método" da página do seu bloco. Cada página tem pipeline fixa, uma única etapa de escolha (um slider de gm/ID e um seletor discreto de L, como nos laboratórios) e uma checklist lateral própria do bloco.

A checklist lateral **começa vazia**: nenhuma parcela aparece preenchida ao abrir o guia. L, gm/ID, I_D (e o gm da carga) só entram depois que o projetista mexe de fato no ponto — move o slider ou troca o L — ou avança além da etapa de escolha; a largura W só entra na etapa de geometria (ou de ganho, na carga ativa), que é onde ela é calculada. "Recomeçar" esvazia a checklist novamente.

- **Espelho** (`espelho-mismatch`): objetivo → gm/ID e L → geometria (`W = I_ref/(ID/W)`) → mismatch → verificação. Segue o Ex. 4.7 e soma **dois** termos em variância, `σ² ≈ [(gm/ID)·A_VT/√(WL)]² + [A_β/√(WL)]²`, com A_VT = 0,5 mV·µm e A_β = 1%·µm. Nas áreas pequenas deste modelo (20 µA) o termo Δβ **não é** desprezível, ao contrário do exemplo do livro, que usa W/L maior; a página diz isso explicitamente.
- **Carga ativa** (`carga-ativa-ganho`): objetivo → gm/ID e L da carga → ganho → ruído da carga → verificação. Segue o Ex. 3.8, compara `A_v0 = gm₁/(gds₁+gds₂)` com o CS de fonte ideal e reporta a fração perdida (> 40% no livro). No modelo ilustrativo `gds/ID` depende sobretudo de **L**, não do gm/ID, então o deslizante troca faixa de saída por ruído adicional e é o comprimento que recupera ganho — a decisão e os textos refletem isso, sem alegar um ganho que o modelo não produz.
- **Par diferencial** (`par-diferencial-fluxo`): objetivo → gm/ID e L → geometria → desempenho → verificação. Segue os Ex. 3.11/3.12 com I_D = 20 µA por ramo e cauda de 40 µA fixas. Desempenho cobre ganho intrínseco, ruído diferencial (só o par de entrada), offset 1σ e amplitude linear para HD3 ≤ −60 dBc, exatamente como o laboratório.

Todas as fórmulas são KaTeX e todos os valores vêm das **mesmas funções de modelo** dos laboratórios (`mirrorPoint`, `activeLoadPoint`, `differentialPoint`), então guia e laboratório nunca discordam. As curvas continuam ilustrativas e **não** extraídas do PDK IHP SG13G2.

### Checklist lateral

`src/TransistorChecklist.jsx` exibe L, gm/ID, I_D e W como parcelas fechadas ou pendentes. O fluxo básico preenche cada parcela quando a etapa correspondente é confirmada; os guias 2–4 preenchem ao escolher o ponto e ao escalar a geometria. Os guias de bloco passam `items` próprios para renomear as parcelas (M₁/M₂, carga PMOS, par de entrada) sem duplicar o componente. `useGuideHeader` publica a altura do cabeçalho fixo em `--guide-header-height`, usada para posicionar a checklist e para rolar a etapa ativa sem escondê-la atrás do cabeçalho ou da faixa da checklist no mobile. Alterar L ou gm/ID no fluxo básico zera as etapas dependentes, evitando inconsistência entre a checklist e os cálculos.

### Fórmulas em notação matemática

`src/MathFormula.jsx` renderiza KaTeX com fontes locais, em modo display ou embutido. Equações, restrições, cabeçalhos de tabela, unidades e valores da checklist usam notação matemática. `src/guideMath.js` centraliza as expressões e a formatação numérica em pt-BR com vírgula decimal TeX-safe; `src/math.css` define escala tipográfica e responsividade. As expressões são geradas em código a partir de números calculados — nenhum texto do usuário é interpretado como TeX.

### O primeiro exemplo: da especificação ao transistor

`src/BasicGuidePage.jsx` implementa seis etapas: **especificação → transcondutância → ponto de projeto → leitura de ID/W → I_D e W → verificação**.

A aplicação é um pré-amplificador de fotodiodo antes de um comparador. A especificação tem três cartões: ganho A0 ≥ 50 (20 mV → 1 V), banda de −3 dB ≥ 1 MHz e carga C_L = 2 pF. `src/basicSizing.js` deriva a transcondutância pelo produto ganho-banda com 20% de margem explícita, g_m ≥ 2π·A0·κ_b·f_−3dB·C_L ≈ 753,98 µS. A fórmula é apresentada primeiro como igualdade (com f_−3dB isolada à esquerda) e só então como desigualdade; a substituição numérica aparece junto ao resultado.

Com a carga de corrente ideal, o ganho em baixa frequência é o ganho intrínseco A_i = (g_m/I_D)·V_A, lido diretamente na curva do comprimento escolhido. A banda de um polo é f_−3dB = g_m / (2π·A_i·(C_L + C_out)): quanto maior o ganho escolhido, menor a banda resultante. A diretriz f_T ≥ 10·f_−3dB separa os pontos com velocidade folgada dos pontos lentos. A corrente é I_D = g_m/(g_m/I_D) e a regra é direta — inversão fraca economiza corrente, inversão forte ganha velocidade.

Resultado no modelo ilustrativo para o ponto de partida sugerido (L = 0,13 µm, g_m/I_D = 10 V⁻¹): I_D ≈ 75,40 µA, J_D ≈ 29,00 µA/µm, W ≈ 2,600 µm, A_gate ≈ 0,34 µm², A_i ≈ 54,7 V/V (1,09× a especificação), f_−3dB ≈ 1,10 MHz, f_T ≈ 38,6 GHz (≫ 12 MHz) e P_DC ≈ 90,5 µW. O passo 5 exibe I_D e W em dois cartões de destaque no topo, com as substituições detalhadas abaixo. Qualquer outro ponto pode ser registrado: L = 1 µm dá mais ganho com mais área, mas afasta a f_−3dB do alvo; L = 0,13 µm com η alto economiza corrente com menos ganho. É essa comparação — não uma solução única — o conteúdo do ponto de projeto.

`src/guideCharts.jsx` desenha três gráficos limpos no estilo das curvas de caracterização de Murmann: ganho intrínseco (linear) com uma única linha de referência no ganho exigido, f_T (log) com uma única linha na diretriz de velocidade, e densidade de corrente (log) para a leitura de J_D. Cada gráfico mostra as quatro curvas de L, o ponto escolhido em destaque e os rótulos de L com separação anti-sobreposição; as curvas são recortadas na área do gráfico. Nada de faixas sombreadas, círculos de ótimo ou verificações de passa/falha: a leitura exibe ganho, f_T e corrente do ponto como margens informativas.

`buildCandidates` recusa este exemplo: a grade automática pertence aos guias 2–4, que otimizam sob restrições. Aqui a escolha é do projetista.

### Proposta de continuação para os guias 2 a 4

Os três guias restantes seguem um fluxo legível por grade, com limites inferior e superior de corrente. Para aproximá-los de Murmann, o passo natural é substituir a tabela pela leitura direta de curvas normalizadas, no mesmo estilo do primeiro exemplo:

- **Sinal rápido:** escolher L e gm/ID no plano exigindo ganho intrínseco suficiente e fT acima da frequência de interesse; ler ID/W; obter a corrente pela banda já com Cdd/Cgg; derivar W.
- **Corrente limitada:** manter o orçamento como restrição e escolher o ponto de menor ID/W entre os que satisfazem a eficiência mínima — o mesmo critério do exemplo 1, trocando apenas o objetivo.
- **Baixo ruído:** deixar de calcular gm,ruído como corte inicial; escolher o ponto do sweep e verificar que o ruído térmico é menor ou igual à meta, mostrando a curva de ruído para a mesma gm.

Isso exige reescrever o solucionador (`src/methodology.js`) para aceitar L e gm/ID como entradas, em vez de varrer a grade, além de remover a etapa de recálculo com parasitas. Não foi feito nesta iteração: exigiria revalidar os exemplos 2 a 4 contra o PDK depois da integração.

### Metodologia e atribuição

É uma adaptação didática, não uma reprodução de exemplos específicos dos autores:

- **Jespers e Murmann**, *Systematic Design of Analog CMOS Circuits: Using Pre-Computed Lookup Tables* (2017), [DOI](https://doi.org/10.1017/9781108125840): dimensionamento com parâmetros normalizados e LUTs.
- **B. Murmann**, [slides SSCS de 2016](https://www.ieeetoronto.ca/wp-content/uploads/2020/06/20160226toronto_sscs.pdf): determinar gm dos requisitos → escolher L e gm/ID → calcular ID → consultar ID/W → calcular W; tratar self-loading de forma autoconsistente.
- **B. Razavi**, *Design of Analog CMOS Integrated Circuits*, 2ª ed., capítulos 3 e 6: ganho de pequenos sinais e resposta em frequência do CS. [Programa de Berkeley com seções do livro](https://people.eecs.berkeley.edu/~pister/140sp20/index.htm).

A abordagem dos autores usa **dados SPICE reais**. Aqui, `lookupDevice` em `src/methodology.js` é apenas um adaptador de dados normalizados do modelo ilustrativo. Não há alegação de precisão de PDK nem de validação pelos autores.

### Fluxo dos guias 2 a 4 (seis etapas)

1. Fixar requisitos e objetivo de escolha.
2. Derivar limites necessários: transcondutância mínima por ganho × banda, por ruído ou eficiência mínima por orçamento.
3. Resolver os candidatos L × gm/ID usando CL apenas; apresentar o melhor por L e, opcionalmente, a grade completa de 164 pontos.
4. Ler J_D = ID/W e calcular ID, gm e W com substituições numéricas.
5. Incluir Cout, resolver as mesmas restrições novamente e reclassificar os candidatos.
6. Verificar requisitos e o objetivo na grade corrigida; declarar a necessidade de DC/AC/ruído/corners em SPICE.

Revisar a seleção invalida os cálculos posteriores. Não há botão que injete uma solução arbitrária com margem oculta. As margens não são adicionadas automaticamente; os requisitos são usados como declarados, com tolerância numérica de 1e−9 nas verificações. O resultado é ótimo **apenas na grade e dentro deste modelo**, não ótimo físico global. Empates do objetivo principal usam menor área; piso numérico de corrente = 0,01 µA.

### Equações resolvidas nos guias 2 a 4

`src/methodology.js` calcula `A0 = gm × (ro ∥ RL)` e `f−3dB = 1/[2π(ro ∥ RL)(CL + Cout)]`. RL é carga resistiva de pequeno sinal AC, sem alterar a polarização assumida. Cout = W × (0,35 + 0,4L) fF é um proxy ilustrativo de Cgd + Cdb, **não Cgg nem dados do PDK**. Não há polo de entrada ou Miller completo. A banda nunca é substituída por fT.

Para e = gm/ID, GL = 1/RL e VA = (gm/gds)/e, em unidades SI:

- Ganho: `ID ≥ Areq·GL / (e − Areq/VA)`; se o denominador não for positivo, o ponto não é viável.
- Ruído: `ID ≥ gm,ruído/e`.
- Banda com Cout = K·ID: `ID·(1/VA − 2πfK) ≥ 2πfCL − GL`.

A última desigualdade pode impor limite inferior **ou superior** de ID; intervalos vazios são descartados. Para minimizar corrente/área por ponto, usa-se a menor corrente admissível. Área é apenas W·L do NMOS; corrente/potência refere-se ao ramo, não ao sistema completo.

## Arquitetura da interface

`SelectionLabPage.jsx` mantém os três labs de seleção (espelho, carga e diferencial): gráficos, fórmulas KaTeX, cartões, hipóteses, guia e CSV derivam da mesma configuração. Cada configuração declara `block` e `exampleSlug`; `ExampleLinks` usa esse `block` para listar o exemplo do próprio bloco na seção "Aplique o método" (o fonte comum lista os exemplos do fluxo básico). `blockExamples.js` guarda os três guias de bloco e `BlockGuidePage.jsx` os renderiza sobre uma casca comum. `selectionPhysics.js` contém os proxies independentes de saturação/linearidade, com testes de corrente reversa e integração de harmônicos. `CircuitSchematics.jsx` mantém os símbolos MOS com seta no source e as topologias; não foi necessário alterar os diagramas nesta revisão das avaliações.

`src/labUi.jsx` concentra o que os quatro blocos compartilham: o gráfico de curva única por métrica (`LabChart`, com `evaluate(gm/ID, L)` injetado), o slider de gm/ID, o seletor de comprimento, o cartão de métrica e o diálogo modal com armadilha de foco. `src/LabShell.jsx` desenha menu lateral e barra superior, marcando o bloco ativo e navegando por hash. `TradeoffChart.jsx` (antes `AreaCurrentChart.jsx`) desenha a grandeza por L em escala log e, por padrão, um segundo painel com a corrente: recebe `evaluate`, as chaves, os rótulos e a faixa logarítmica por props, então o mesmo componente serve à área de gate do fonte comum (dois painéis) e à largura do espelho (`showCurrent={false}`, um painel só).

## Próxima etapa: caracterização real

1. Fixar versão do PDK e modelo NMOS de baixa tensão, verificando limites geométricos permitidos.
2. Executar varreduras SPICE de VGS para cada L, VDS e temperatura, fixando e documentando W e VBS.
3. Exportar ID, gm, gds e capacitâncias, com unidades, convenções e metadados do simulador.
4. Construir tabelas gm/ID → ID/W, gm/gds, Cgg/W e fT, com interpolação e limites explícitos; verificar escalabilidade com W.
5. Substituir `operatingPoint` por consulta às tabelas e validar pontos com simulações do circuito completo.

Não há dependência do PDK nem de um simulador nesta primeira versão. A fonte externa do Google Fonts é opcional; há fontes locais de fallback.
