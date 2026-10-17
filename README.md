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

O modelo em `src/model.js` relaciona eficiência, densidade de corrente, largura, transcondutância, resistência de saída e capacitância por aproximações analíticas com constantes didáticas. A densidade segue a escala de inversão forte, J_D = 377/((gₘ/Iᴅ)²·L) µA/µm, com um patamar de subthreshold de 0,05 µA/µm que impede J_D de chegar a zero. Uma versão anterior usava o fator de inversão (n−1)²−1 do EKV, que decaía a zero em inversão fraca: W e a área explodiam e a lei de Pelgrom parecia melhorar sozinha, produzindo uma curva de mismatch com formato de tenda. O patamar corrige isso e é travado por teste. O único controle contínuo é gm/ID. Quatro gráficos simultâneos mostram ganho, headroom mínimo do NMOS, fT e área × corrente. O ruído é abordado apenas no exemplo guiado específico, não nos plots do laboratório. As curvas têm cores distintas e rótulos de L. A seleção de comprimento apenas destaca uma das curvas e sua leitura numérica. Inclui exportação CSV. As explicações detalhadas ficam em “Como usar”; o headroom tem apenas sua definição curta junto ao gráfico.

O circuito assume VDD = 1,2 V, **gm = 300 µS** e VDS = 0,6 V. Para comparar soluções de mesma transcondutância, a corrente varia como ID = gm/(gm/ID): de 60 µA a 12 µA. O consumo estático é VDD × ID. A área mostrada é apenas W × L do NMOS, não a área de layout ou da fonte de corrente. `designPoint` centraliza essa condição para a interface, os gráficos e a exportação.

A fonte de corrente ideal tem resistência incremental infinita, logo o ganho em módulo é gm × ro = gm/gds. VDS é um ponto de polarização assumido para a caracterização; a fonte ideal não o determina sozinha. A frequência fT é intrínseca e não a banda do estágio.

O headroom mínimo do NMOS é estimado por `VDS,sat ≈ 2/(gm/ID)`: a tensão dreno–fonte necessária para manter a saturação. **Não é swing de saída, margem VDS − VDS,sat ou tensão de polarização.** Não há headroom adicional da carga porque ela é ideal. Uma carga real exigiria sua própria tensão mínima. A aproximação é didática, não um VDS,sat extraído do PDK, e tem limitações especialmente em inversão fraca. Não há dependência de L nessa aproximação, portanto o gráfico mostra uma única curva identificada como comum a todos os comprimentos. A condição VDS ≥ 2/(gm/ID) também é apenas uma verificação aproximada de saturação.

O gráfico área × corrente usa o mesmo eixo horizontal dos demais — gm/ID — em dois painéis empilhados: acima, a área de gate W·L (µm², log) para os quatro comprimentos; abaixo, a corrente I_D (µA, linear) em curva única, pois com g_m fixo a corrente independe de L. O gráfico de fT usa a mesma altura e geometria, de modo que os dois cartões da linha têm topo, faixas de inversão e eixo x alinhados. O slider e o clique no gráfico movem o ponto nos dois painéis ao mesmo tempo. A potência permanece disponível no CSV e no modelo como VDD × ID.

A faixa de comprimento inclui 0,13 µm para exploração conceitual: sua validade para cada dispositivo real deve ser verificada no PDK.

`npm test` verifica a consistência das relações do modelo didático (não a validade física contra o PDK).

## Espelho de corrente (razão 1:1)

Segundo bloco, em `/#/espelho`, com o mesmo controle contínuo (gm/ID, gm fixo em 300 µS) e o mesmo seletor de L do fonte comum. O modelo vive em `src/mirrorModel.js` e reaproveita `operatingPoint`, de modo que largura, área e ganho intrínseco são exatamente os mesmos do primeiro experimento.

M1 é diodo-conectado (gate preso ao dreno) e M2 é o transistor de saída; a razão é fixa em 1:1, então I_out = I_ref = g_m/(g_m/I_D). Os gráficos usam o mesmo eixo horizontal — gm/ID — com uma curva por L:

- **Mismatch** (`σ(ΔI_D/I_D) ≈ (g_m/I_D)·A_VT/√(W·L)`, em %): lei de Pelgrom com σ(ΔV_T) = A_VT/√(W·L) e **A_VT = 0,5 mV·µm**, um proxy didático, não uma extração de PDK. Como I_D ∝ V_OV² em saturação, σ(I_D)/I_D = 2·σ(ΔV_T)/V_OV; com V_OV = 2/(g_m/I_D) o fator 2 se cancela e sobra a expressão acima — por isso o erro cresce com o gm/ID e cai com a área. No modelo: 1,67% em L = 0,13 µm contra 0,22% em L = 1 µm (a g_m/I_D = 15), e a curva é monótona em todo o intervalo — mais eficiência significa menos corrente e mais mismatch. Só a parcela de mismatch entra no gráfico; o erro por modulação de canal (λ·V_DS) existe e entra em quadratura, mas neste modelo depende apenas de L e não variaria com o eixo do gráfico.
- **Tensão de compliance mínima** (V): V_DS,out,mín ≈ 2/(g_m/I_D), igual à expressão de headroom do fonte comum e por isso independente de L — aparece como curva única. O texto abaixo do gráfico compara a compliance do ponto com o V_DS,out = 0,6 V assumido e mostra a folga restante, porque é o único número do bloco que precisa ser comparado com um valor fixo.
- **W para a corrente pedida** (µm, log): a largura de **cada** transistor para a corrente de saída escolhida, uma curva por L, sem painel de corrente. É a leitura direta de W = I_out/(I_out/W): no modelo, W vai de 0,52 µm (g_m/I_D = 5, L = 0,13 µm) a 19,9 µm (g_m/I_D = 25, L = 1 µm). Inversão fraca entrega a mesma corrente com muito menos largura, ao custo de compliance e ganho.

Os quatro gráficos do fonte comum continuam sendo ganho, headroom, fT e área × corrente. O espelho tem três: mismatch, compliance mínima e W. O gráfico de ganho em espelho (g_m·r_out) foi removido por repetir a curva de ganho do fonte comum com outros rótulos; o valor continua disponível no modelo e no CSV.

O cartão "Ponto selecionado" resume corrente copiada, mismatch, **W necessária**, compliance mínima e a **folga de saída** (V_DS,out − V_DS,out,mín), que é a margem real antes de M2 sair de saturação. Quando o mismatch ultrapassa a meta didática de 1%, aparece um aviso laranja no lugar da seção de saturação do fonte comum. Exporta CSV próprio (`gmid-espelho-ilustrativo.csv`) e tem guia próprio. Efeito de corpo, razão k:1, mismatch de layout e a dependência de V_DS na saída não são modelados.

## Carga ativa de um único transistor

Terceiro bloco, em `/#/carga-ativa`: um NMOS (M1) com **um único PMOS** por cima, como carga, e C_L = 2 pF. Mesmo controle contínuo dos outros blocos (gm/ID, gm fixo em 300 µS) e mesmo seletor de L. O modelo vive em `src/activeLoadModel.js` e reaproveita `operatingPoint`.

A diferença para o fonte comum é o gate da carga. Ele está numa tensão de polarização fixa V_bias, separada do rail de V_DD, então **a sobrecondução da carga não acompanha o gₘ/Iᴅ da entrada**: é constante em 12 V⁻¹ neste modelo. Isso é a vantagem (dá para escolher o ponto da carga de forma independente) e a fragilidade (nada garante a corrente com PVT, ao contrário de um espelho).

Três gráficos, todos com gm/ID no eixo x:

- **Headroom do par** (V): V_out ≥ V_OV,1 + V_OV,L ≈ 2/(g_m/I_D) + 0,167 V. É a mesma curva de headroom do fonte comum deslocada por uma constante, e o deslocamento é o preço de empilhar dois transistores. O swing é V_DD menos isso. Curva única, sem dependência de L.
- **Ruído de entrada** (nV/√Hz): quant pela primeira vez aparece no laboratório. O par gera 4kTγ(g_m1 + g_mL) de corrente de ruído; referido à entrada, o r_out se cancela e resta um fator √(1 + g_mL/g_m1). Com carga ideal volta a ser √(4kTγ/g_m1) = 6,07 nV/√Hz (gm fixo); com a carga são 11,2 nV/√Hz em inversão forte e 7,4 em fraca. Curva única: nem L nem r_out entram, só a razão de g_m.
- **fT do par** (GHz): min(f_T,entrada; f_T,carga). A fT da carga é fixa (a eficiência dela é fixa) e vira um piso; a da entrada cai com o gₘ/I_D. As quatro curvas de L mostram o cruzamento — em inversão forte a carga limita, em fraca a entrada assume, e abaixo do limite a curva achata.

Ganho, V_A e fT vêm do mesmo modelo didático dos outros blocos. O ganho |Aᵥ| = g_m·(r_o1 ∥ r_o,L) fica abaixo de g_m/gds porque a saída vê as duas impedências ao mesmo tempo; ele aparece no cartão de ponto mas não tem gráfico próprio, porque repetiria a curva de ganho do fonte comum com outro rótulo.

O cartão resume headroom do par, swing, ruído, fT do par e ganho. O guia chama de forma explícita o que o modelo não cobre: só ruído térmico de canal (γ = 2/3, T = 300,15 K), sem 1/f, sem ruído da fonte de bias e sem ruído da carga externa; V_bias é um ponto DC assumido, sem variação de PVT nem efeito de corpo.

## Par diferencial (com espelho de carga e cauda)

Quarto e último bloco, em `/#/par-diferencial`. Cinco transistores: M1/M2 são o par de entrada, M3/M4 o espelho de carga PMOS com M3 diodo-conectado, e M5 a fonte de cauda. Mesmo controle contínuo dos outros três (gm/ID, gm fixo em 300 µS) e mesmo seletor de L. O modelo vive em `src/differentialModel.js`.

O que interessa aqui não é o ganho, e sim o que só o par tem. Três gráficos, todos com gm/ID no eixo x:

- **Rejeição de modo comum** (dB): CMRR = 2·g_m·r_tail = **2·(g_m/I_D)·V_A,cauda**. A corrente se cancela: como r_tail = V_A/I e g_m = (g_m/I_D)·I, mudar o gm/ID mexe em I_D e em r_tail na mesma proporção. O resultado é que o CMRR depende só da eficiência e do comprimento da cauda — nunca da corrente. No modelo vai de 38 dB (L = 0,13 µm, g_m/I_D = 5) a 61 dB (L = 1 µm, g_m/I_D = 25), e **satura**: o teto de 1 µm faz L = 0,5 e L = 1 terem a mesma cauda.
- **Faixa de modo comum** (V): ICMR = V_DD − V_OV,carga − V_OV,cauda − V_OV,1. Embaixo a sobrecondução da cauda somada à do par, em cima o que a carga deixa. Curva única, de 0,47 V a 0,79 V: inversão mais fraca abre a faixa.
- **Offset por mismatch** (mV): σ(V_os) = A_VT/√(2·W·L). O √2 vem de somar duas variâncias — num par, as duas áreas não casam de verdade. É o limite prático do circuito: 1,36 mV em L = 0,13 µm contra 0,08 mV em L = 1 µm. É por isso que par diferencial quase nunca usa a largura mínima.

O ganho diferencial |A_vd| = g_m·(r_o1 ∥ r_o4) fica no cartão de ponto, sem gráfico: em meio-circuito diferencial o dreno de M2 é um terra virtual e não carrega a saída, então o resultado é o mesmo do fonte comum com a mesma carga — repetir a curva não acrescentaria nada.

Cauda e espelho são polarizados por tensão, com g_m/I_D fixo em 12 V⁻¹, e usam L = min(1 µm, 2·L), porque r_o da cauda limita a rejeição e r_o da carga limita o ganho. O CMRR mostrado é o ideal de cauda perfeita: não inclui a degradação por mismatch nem pelo ruído da própria fonte de cauda, que é o que costuma dominá-lo em silício — o guia diz isso na letra miúda.

## Ruído

No exemplo de baixo ruído, a contribuição de canal NMOS referida à entrada é `en = sqrt(4kTγ/gm)`, em nV/√Hz, com gm convertido para siemens, T = 300,15 K e γ = 2/3 (aproximação de canal longo). Não inclui 1/f, ruído da carga ou de outros componentes, nem ruído RMS integrado. A meta de 10 nV/√Hz exige gm ≥ aproximadamente 110,5 µS. Para cada gm/ID e L, o solucionador exige `ID ≥ gm,ruído/(gm/ID)`, além das condições de ganho e banda. Isso não garante o ruído total do pré-amplificador real e não é uma caracterização do PDK.

## Exemplos guiados

Os botões abaixo do laboratório abrem páginas próprias com seis etapas e pipeline fixa no topo. Não há sliders livres nos exemplos. A lateral direita mantém uma checklist permanente dos quatro parâmetros do transistor — **L, gm/ID, I_D e W** — preenchida conforme as etapas são concluídas. Ela fica fixa (*sticky*) em telas largas e vira uma faixa horizontal acima do conteúdo em telas estreitas.

- `/#/exemplos/fluxo-basico`: **fluxo básico de Murmann** começando de uma especificação real (receptor óptico: A0 ≥ 50, banda ≥ 1 MHz, C_L = 2 pF). Deriva g_m, escolhe L e gm/ID pelos gráficos, lê ID/W e calcula I_D e W. Aliases antigos: `ganho-por-banda` e `sinal-lento`.
- `/#/exemplos/sinal-rapido`, `/corrente-limitada` e `/baixo-ruido`: **temporariamente desabilitados** (`disabled: true` em `src/methodology.js`). Os cartões aparecem como "EM BREVE", a rota direta mostra um aviso e a navegação "outros exemplos" os lista sem link. O solucionador e os testes desses fluxos continuam intactos para reativação futura.

As rotas por hash permitem abrir/recarregar cada página e usar voltar/avançar do navegador em hospedagem estática, sem configurar fallback de servidor. Não há backend, simulador ou persistência dos dimensionamentos entre páginas.

### Checklist lateral

`src/TransistorChecklist.jsx` exibe L, gm/ID, I_D e W como parcelas fechadas ou pendentes. O fluxo básico preenche cada parcela quando a etapa correspondente é confirmada; os guias 2–4 preenchem ao escolher o ponto e ao escalar a geometria. `useGuideHeader` publica a altura do cabeçalho fixo em `--guide-header-height`, usada para posicionar a checklist e para rolar a etapa ativa sem escondê-la atrás do cabeçalho ou da faixa da checklist no mobile. Alterar L ou gm/ID no fluxo básico zera as etapas dependentes, evitando inconsistência entre a checklist e os cálculos.

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

`src/labUi.jsx` concentra o que os quatro blocos compartilham: o gráfico de curva única por métrica (`LabChart`, com `evaluate(gm/ID, L)` injetado), o slider de gm/ID, o seletor de comprimento, o cartão de métrica e o diálogo modal com armadilha de foco. `src/LabShell.jsx` desenha menu lateral e barra superior, marcando o bloco ativo e navegando por hash. `TradeoffChart.jsx` (antes `AreaCurrentChart.jsx`) desenha a grandeza por L em escala log e, por padrão, um segundo painel com a corrente: recebe `evaluate`, as chaves, os rótulos e a faixa logarítmica por props, então o mesmo componente serve à área de gate do fonte comum (dois painéis) e à largura do espelho (`showCurrent={false}`, um painel só).

## Próxima etapa: caracterização real

1. Fixar versão do PDK e modelo NMOS de baixa tensão, verificando limites geométricos permitidos.
2. Executar varreduras SPICE de VGS para cada L, VDS e temperatura, fixando e documentando W e VBS.
3. Exportar ID, gm, gds e capacitâncias, com unidades, convenções e metadados do simulador.
4. Construir tabelas gm/ID → ID/W, gm/gds, Cgg/W e fT, com interpolação e limites explícitos; verificar escalabilidade com W.
5. Substituir `operatingPoint` por consulta às tabelas e validar pontos com simulações do circuito completo.

Não há dependência do PDK nem de um simulador nesta primeira versão. A fonte externa do Google Fonts é opcional; há fontes locais de fallback.
