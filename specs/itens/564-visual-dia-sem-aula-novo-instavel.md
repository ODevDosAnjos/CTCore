# 564 — Teste visual instável: dia-sem-aula-novo reprova em HEAD limpo e passa em outras execuções

Origem: issue #564 e os três comentários (técnica, front-end, autor `ODevDosAnjos`). Passa na frente dos itens de produto pela regra 8 de "Autonomia" (comentário de 26/11/2026); o PR #737 (item #733) espera por ela. Branch: `item/564-visual-dia-sem-aula-novo-instavel`.
Tempos: especificar 50 min (2 rodadas) · construir 33 min (2 rodadas) · verificar 18 min (regressão 8 min, 1 rodada) · entregar 5 min (estimado; início não anotado)
Comparação com o canvas: 2 min

<!-- Fase 2: especificação. -->

## 1. Objetivo

Fazer o caso visual `dia-sem-aula-novo` produzir sempre a mesma imagem, para o job `visual` do CI parar de reprovar PRs que não mexem nessa tela. Fora do escopo: mudar a tela, o `Modal`, o `DateField` ou o MSW; afrouxar a comparação; outros casos visuais.

Diagnóstico feito nesta fase (`dev` em `7030f773`): `npm run test:visual:docker -- -g "dia-sem-aula-novo 1440 claro" --repeat-each=10 --workers=2` falhou 4 de 10 em 31 s, no mesmo minuto e com o mesmo código. Comparando as 4 imagens com a referência, só um pixel passa do limiar, sempre o mesmo: (997, 194), com `rgb(249,240,238)` na referência e branco `rgb(255,255,255)` na imagem obtida. O resto são diferenças de 1 a 2 níveis nos cantos da janela, abaixo do limiar.

## 2. Requisitos

- R1: o caso `dia-sem-aula-novo` gera a mesma imagem em execuções repetidas, nas duas larguras e nos dois temas.
- R2: o caso não depende da data real.
- R3: a comparação continua com a mesma exigência (`maxDiffPixelRatio: 0`, `threshold: 0.05`), sem `retries`, sem máscara e sem espera de tempo fixo (D2).
- R4: só as referências desse caso mudam, e só se precisarem.

## 3. Critérios de aceite

- CA1 (R1): dado o caso corrigido e a referência atualizada, quando os 4 testes rodam no container 3 execuções seguidas com `--update-snapshots=changed --repeat-each=10` (D4), então nenhuma referência é regravada nas 3 e `git status` não mostra mudança nova em `visual/referencias`. Faixa aceitável: nenhuma regravação. Plano B (D5): não há segunda correção prevista; se houver regravação, parar e registrar no arquivo o caso, o pixel e a taxa medidos.
- CA2 (R2): dado o código do caso, quando conferido, então o relógio da página está fixo em 29/10/2026 12:00 (`page.clock.setFixedTime(AGORA)` antes de `abrir`) e o caso usa só datas literais; o arquivo do item registra que a falha ocorreu e deixou de ocorrer com a mesma data (D3).
- CA3 (R3): dado o diff, quando revisado, então a única mudança em `playwright.visual.config.ts` é a divisão em dois projetos de D5; `maxDiffPixelRatio`, `threshold` e `retries` não mudam, não há `mask` nem `waitForTimeout`, e nada muda em `frontend/src`, `visual/casos.ts` e `visual/telas.visual.ts`.
- CA4 (R4): dado o diff, quando revisado, então em `visual/referencias` só há arquivos `dia-sem-aula-novo-*.png`; e `playwright test -c playwright.visual.config.ts --list` mostra o mesmo total de testes de antes (664 em `7030f773`), com exatamente 4 no projeto `visual-sem-raster-parcial` e os demais em `visual`, que mantém os argumentos de hoje (`--lang=pt-BR`).
- CA5 (R1): dado o PR, quando o job `visual` do CI roda, então os 4 casos passam na primeira tentativa. Sem tarefa na construção: é só do CI e vai no comentário de merge.

## 4. Plano técnico

- Dados, API, segurança: não mudam. Interface do produto: não muda.
- Causa. Relógio: descartado, `frontend/visual/telas.visual.ts` (linha ~738) fixa `AGORA` e o caso (`frontend/visual/casos.ts:209`) preenche datas literais. Rasterização: a raster parcial do Chromium (repinta só a área invalidada) às vezes deixa na janela um resíduo em (997, 194), junto do anel de foco do campo "Até (opcional)", e a referência do `HEAD` guarda esse resíduo. Medido nesta fase (rodada de ajuste, D5): com `--disable-partial-raster`, as 4 imagens geradas diferem das do `HEAD`, acima de 2 níveis, só no pixel (997, 194) de 1440 claro (`249,240,238` para branco); 1440 escuro difere em 30 pixels, todos de até 2 níveis; as duas de 390 não têm pixel diferente.
- Medições (no container `v1.64.1-noble`, numa cópia do front, sem alterar o repositório; 4 testes x 30 repetições, `--workers=2`, cada variante contra as referências que ela mesma gerou):

  | Variante | Resultado |
  |---|---|
  | sem mudança | 104 passaram, 16 falharam (1440 claro, 16/30) |
  | `blur()` no elemento com foco antes do print | 113 passaram, 7 falharam (1440 claro, 7/30) |
  | `--disable-partial-raster` | 120/120, em duas medições separadas |
  | a mesma, por projeto na configuração, em container novo, contra as referências geradas no container anterior | 120/120 |
  | a mesma, contra as referências do `HEAD` | 1440 claro falha 30/30 (diferença fixa: a referência precisa mudar) |

- Correção, só em `frontend/playwright.visual.config.ts` (D5): trocar `projects: [{ name: "visual" }]` por dois projetos, com comentário citando a #564:
  - `{ name: "visual", grepInvert: / dia-sem-aula-novo / }`;
  - `{ name: "visual-sem-raster-parcial", grep: / dia-sem-aula-novo /, use: { launchOptions: { args: ["--lang=pt-BR", "--disable-partial-raster"] } } }`.

  O `launchOptions` do projeto substitui o do `use` geral, por isso repete `--lang=pt-BR`. Os espaços da expressão casam o nome exato do caso no título completo. Essa forma já foi testada (lista 664 antes e depois, 4 no projeto novo).
- Reutilizado: `snapshotPathTemplate` usa só `{arg}`, então o nome das referências não muda com o projeto. O CI (`.github/workflows/ci.yml:145`, `npm run test:visual -- --shard=...`) e `scripts/visual-docker.sh` não escolhem projeto: não mudam.
- Referências (existentes): `frontend/visual/referencias/dia-sem-aula-novo-{1440,390}-{claro,escuro}.png`; mudança esperada: 1440 claro (e 1440 escuro só se o modo `changed` a regravar; a diferença medida fica abaixo do limiar).
- Comparação com o canvas (`DiaSemAulaNovo`): o caso já existe, sem `limiteCanvas`; a tela não muda, mas a referência muda, então capturas em `.capturas/564/` e `visual:canvas` (T3).
- Arquivos contáveis: 1. Nenhum a criar.
- Riscos: o argumento muda a rasterização só do projeto novo; a prova é de container local, e o runner do CI só é conferido no CA5. Outro caso com o mesmo sintoma não é tratado aqui. As imagens de falha saem em `frontend/test-results/` (ignorada pelo Git). A imagem do Playwright já existia na máquina e o script não a remove.

## 5. Tarefas

- [x] T1: dividir os projetos em `playwright.visual.config.ts` (D5); regravar a referência do caso e abrir cada PNG alterado, conferindo que a única diferença visível é o fim do resíduo no pixel (997, 194) — cobre CA1, CA3, CA4 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots=changed -g "dia-sem-aula-novo" && npm run lint && npm run typecheck && npx vitest run visual`, `git status --short frontend` e, para a contagem do CA4, `npx playwright test -c playwright.visual.config.ts --list` com e sem `--project=visual-sem-raster-parcial` (só lista, não compara imagens)
- [x] T2: medir a estabilidade, 3 execuções seguidas, e registrar em "Construção" o resultado de cada uma e a data fixa usada — cobre CA1, CA2 — prova: 3 vezes `cd frontend && npm run test:visual:docker -- --update-snapshots=changed -g "dia-sem-aula-novo" --repeat-each=10 --workers=2`, sem linha de referência regravada na saída e sem mudança nova em `git status --short frontend/visual/referencias`
- [x] T3: salvar em `.capturas/564/` as capturas `<tela>-<largura>-sistema.png` e `<tela>-<largura>-canvas.png` (1440 e 390, pt-BR), conferir lado a lado com `DiaSemAulaNovo` e registrar `Comparação com o canvas: <min>` — conferência exigida pelo `AGENTS.md` para referência alterada, cobre CA4 — prova: `cd frontend && npm run visual:canvas -- --exige`, olhando o caso `dia-sem-aula-novo`

## 6. Decisões

- D1 (removida na rodada de ajuste; substituída por D5): corrigir forçando a repintura só neste caso (viewport; plano B, `opacity`). A construção mediu as duas e nenhuma estabiliza o caso (ver "Construção").
- D2: não relaxar limiar, não usar `retries` nem máscara: esconderiam regressões reais.
- D3 (ajusta a prova do "Pronto quando" da issue): a hipótese de data foi descartada (relógio fixo no código; 4 falhas e 6 acertos no mesmo minuto). "3 execuções seguidas em dias diferentes" não cabe numa sessão e a data do host não chega à página; a prova passa a ser CA1 (3 execuções seguidas, 120 testes) e CA2, mais o CI do PR (Autonomia, regra 2, itens de teste instável). "Dias diferentes" fica NÃO CONFERIDO localmente, sem impedir o OK. O objetivo da issue (não depender da data real) não muda.
- D4: a prova local usa `--update-snapshots=changed`, que só regrava a referência quando a comparação falha, porque o `AGENTS.md` deixa a conferência sem `--update-snapshots` só para o CI. Regravação na saída conta como falha. Suposição: o modo `changed` do Playwright 1.64.1 se comporta assim; se a saída não permitir distinguir, comparar o `sha256sum` das referências antes e depois de cada execução. A medição desta fase rodou sem a flag, só para diagnóstico, como no comentário do dono na issue.
- D5 (ajuste pedido em "Construção"): rodar só este caso com `--disable-partial-raster`, num projeto próprio da configuração visual. Motivo: foi a única candidata determinística nas medições (seção 4), não afrouxa a comparação (R3), mantém o foco e o anel em "Motivo", não toca a tela e não afeta os outros casos, que era a objeção da D1 à flag. Alternativas: `blur()` antes do print (7/30 falhas, e ainda mudaria a imagem); a flag para toda a suíte (mais simples, mas mudaria a rasterização das outras referências, efeito não medido). Se outro caso mostrar o mesmo sintoma, basta acrescentá-lo às duas expressões.

## Construção

Nenhuma tarefa marcada: nenhuma das duas alternativas de D1 estabiliza o caso. Pela CA1, a construção parou aqui. O código e as referências voltaram ao estado do `HEAD`; só o arquivo do item e o `specs/backlog.md` (fase 2) estão alterados. Data fixa usada em todas as medições: 29/10/2026 12:00 -03:00 (`page.clock.setFixedTime(AGORA)`, já no código).

- T1, 1ª alternativa (viewport +1 px e volta, dois `requestAnimationFrame`) — `casos.ts` (campo `repintar`) e `telas.visual.ts`. `npm run test:visual:docker -- --update-snapshots=changed -g "dia-sem-aula-novo"`: 4 passaram, só a referência 1440 claro foi regravada, e acima de 2 níveis só mudava o pixel (997, 194), de `249,240,238` para branco. `lint`, `typecheck` e `npx vitest run visual` (174 testes) passaram; `carregarCasos` carregou 165 casos, um com `repintar`.
- T2 da 1ª alternativa, 3 execuções de 40 testes (`--update-snapshots=changed --repeat-each=10 --workers=2`): 40/40 nas três, mas a 1440 claro foi regravada 5, 1 e 3 vezes. Depois da execução 1, o arquivo voltou a ser byte a byte a referência do `HEAD`, com o resíduo (`sha256` `ca99b4ec…`).
- Plano B (`opacity` 0.99 e volta no `[role=dialog]`, dois quadros por valor): no primeiro `changed`, regravou 1440 claro, 390 claro e 390 escuro. Nas 3 execuções de 40: a 390 claro foi regravada 2, 2 e 0 vezes.
- Diagnóstico do plano B contra as referências geradas por ele (30 repetições por variante, sem `--update-snapshots`, só para medir; 120 testes, 115 passaram, 5 falharam):
  - 1440 claro, 1/30: acima de 8 níveis diferem (997, 194), `255,255,255` na referência e `249,240,238` na obtida (o resíduo continua aparecendo), e (442, 276), `250,241,239` na referência e branco na obtida (canto do anel no campo "Motivo", que tem o foco).
  - 390 claro, 2/30, e 390 escuro, 2/30: 4161 e 4321 pixels acima de 8 níveis, caixa (23, 27) a (365, 827). É o texto alternando entre suavização em cinza (referência do `HEAD` e imagem obtida) e suavização por subpixel, com franjas coloridas (referência gerada pelo plano B; ex.: (95, 27) `212,148,73` contra `148,148,150`). Essa alternância foi criada pelo plano B: as referências 390 do `HEAD` são em cinza.
  - 1440 escuro: 0/30.

Testes do item: não há prova de estabilidade aprovada.
Desvios: a especificação previa um diagnóstico só na fase 2; foi feita mais uma rodada sem `--update-snapshots` para medir pixel e taxa, como a CA1 pede.
Referências visuais: nenhuma alterada (as regravadas na medição foram restauradas).
T3 (capturas em `.capturas/564/` e `visual:canvas`): não feita, porque nenhuma referência mudou.

Pedido de ajuste: CA1 e D1 (afeta R1, T1 e T2) — as duas correções previstas não tornam a imagem determinística. A repintura por viewport não elimina a alternância em (997, 194). A repintura por `opacity` também não, e ainda introduz alternância de suavização do texto a 390 px. A hipótese da seção 4 (só um resíduo que uma repintura apaga) não se sustenta: com o plano B, (442, 276), no anel do campo com foco, também variou. Inferência não provada: o que varia é a rasterização do canto arredondado do anel, não a sobra do foco anterior. Falta decidir outra abordagem dentro de R3 (sem afrouxar a comparação). Candidatas não testadas: (a) passo que tira o foco antes do print (muda a imagem, que perde o anel em "Motivo", e contraria o "o foco fica em Motivo" do plano); (b) argumento do Chromium só para este caso ou arquivo (ex.: `--disable-partial-raster`), que a D1 descartou por pensar no efeito sobre todas as referências.

### Retomada depois do ajuste (D5)

Pedido de ajuste acima (CA1 e D1): atendido pela fase 2 (D5). O texto anterior desta seção é o registro da primeira sessão.

- T1 — arquivos: `frontend/playwright.visual.config.ts` (dois projetos, D5) e `frontend/visual/referencias/dia-sem-aula-novo-1440-claro.png` — prova: `npm run test:visual:docker -- --update-snapshots=changed -g "dia-sem-aula-novo"` → 4 passaram, só a 1440 claro regravada (`sha256` `ca99b4ec…` para `147a08cd…`). Comparada pixel a pixel com a do `HEAD`: 31 pixels diferentes e um só acima de 2 níveis, (997, 194), de `249,240,238` para branco; no recorte ampliado, a única diferença visível é o fim desse resíduo. `npm run lint` e `npm run typecheck` passaram; `npx vitest run visual` → 174 testes passaram. `playwright test --list`: 664 antes e depois; `--project=visual-sem-raster-parcial` lista exatamente os 4 casos; `--project=visual` lista 660 e herda o `--lang=pt-BR` do `use` geral.
- T2 — data fixa: 29/10/2026 12:00 -03:00 (`page.clock.setFixedTime(AGORA)`); com essa data a falha ocorreu antes da correção e deixou de ocorrer depois. Prova: 3 vezes `npm run test:visual:docker -- --update-snapshots=changed -g "dia-sem-aula-novo" --repeat-each=10 --workers=2` → execução 1: 40/40, 0 regravações; execução 2: 40/40, 0; execução 3: 40/40, 0. `sha256sum` das 4 referências igual depois das 3; em `visual/referencias` só a 1440 claro da T1 aparece no `git status`. "Dias diferentes": NÃO CONFERIDO localmente (D3).
- T3 — capturas em `.capturas/564/`: `dia-sem-aula-novo-{1440,390}-sistema.png` e `dia-sem-aula-novo-1440-canvas.png`. Não há `-390-canvas.png`: o caso não tem `canvasCelular` e o canvas não tem a janela a 390 px (`GMDiasSemAula` é outra tela, a lista). `npm run visual:canvas -- --exige` → saiu 0, 165 comparadas, 0 reprovadas; `dia-sem-aula-novo` 1440 claro 6,1% (limite 30%). Lado a lado: há diferenças entre sistema e canvas em dados, rótulo "De *", controles de data, "Motivo" (contador e foco), "Turmas" (cartões em vez de lista), pílulas de unidade, "Prévia" (sem marcadores e sem a linha da mensalidade) e opção marcada em "Quando avisar". Nenhuma vem deste item: a única mudança visível na referência é o pixel da T1 e a tela não mudou.

Testes do item: `lint`, `typecheck`, `npx vitest run visual` (174 passaram) e as provas visuais acima (4/4 e 3 x 40/40).
Regressão: não roda nesta fase.
Desvios: nenhum em relação à especificação ajustada; só a captura 390 do canvas, que não existe. CA5 fica para o CI do PR.
Referências visuais: `frontend/visual/referencias/dia-sem-aula-novo-1440-claro.png`.

## Verificação

### Rodada 1 — OK — 2026-11-26, estado 8b52a4b659a8887ec8eb74bf86f5fc2d2bd0ba55

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | Cópia do estado (`git archive`) no scratchpad, para não tocar a árvore; 3 execuções seguidas de `bash scripts/visual-docker.sh --update-snapshots=changed -g "dia-sem-aula-novo" --repeat-each=10 --workers=2`: 40/40 em cada uma, nenhuma linha de regravação e `sha256sum` das 4 referências igual depois de cada uma. "Dias diferentes": NÃO CONFERIDO localmente (D3). |
| CA2 | PASSOU | `telas.visual.ts`: `page.clock.setFixedTime(AGORA)` antes de `abrir`, com `AGORA` = 29/10/2026 12:00 -03:00; o caso em `casos.ts` só preenche datas literais; "Construção" registra a falha antes e o acerto depois com a mesma data. |
| CA3 | PASSOU | Diff da configuração: só os dois projetos de D5 e o comentário. Limiar, `maxDiffPixelRatio` e `retries` iguais, sem `mask` nem `waitForTimeout`; `git diff --quiet 7030f773` em `frontend/src`, `visual/casos.ts` e `visual/telas.visual.ts`. |
| CA4 | PASSOU | Em `visual/referencias` só `dia-sem-aula-novo-1440-claro.png`. `--list`: 664 no total, 660 em `visual` (nenhum do caso) e exatamente os 4 do caso em `visual-sem-raster-parcial`; os projetos são complementares e os arquivos de caso não mudaram, então o total é o de antes. `visual` herda `--lang=pt-BR`. Pixels contra `7030f773`: 31 diferentes e só (997, 194) acima de 2 níveis (`249,240,238` para branco); no recorte ampliado some só o resíduo. As outras 3 não têm pixel diferente. |
| CA5 | NÃO CONFERIDO (só no CI) | Visual: no CI do PR; vai no comentário de merge. |

Comparação com o canvas: abertas `1440-sistema`, `1440-canvas` e `390-sistema` de `.capturas/564/`; as de sistema são byte a byte as referências claras atuais. Não há canvas desta janela a 390 px (`GMDiasSemAula` não a contém e o caso não tem `canvasCelular`), então não falta captura. `npm run visual:canvas -- --exige`: saiu 0, 165 comparadas, 0 reprovadas. Lado a lado há as divergências listadas em T3 (além delas, menu, topo, dados e botões de fundo); a tela não mudou e a única mudança da referência é o pixel acima, então nenhuma é deste item.

Comandos: em `frontend/`, `npm run lint`, `typecheck` e `build` passaram; `npm test`: 277 arquivos e 3048 testes passaram. E2e: não se aplica (nenhuma tela criada ou alterada). Back-end não tocado. Imagens Docker iguais antes e depois; nenhum container do Playwright restou; a cópia do scratchpad foi removida.
Instáveis: nenhum.
Achados:
- sugestão, código, descrição do PR — listar as divergências com o canvas vistas em T3, registrando que são anteriores ao item e que a tela não mudou.

## Entrega

- O que muda: `frontend/playwright.visual.config.ts` divide o projeto `visual` em dois (D5). `dia-sem-aula-novo` roda no projeto `visual-sem-raster-parcial`, com `--disable-partial-raster`; os demais casos seguem no `visual`, sem a flag. Única referência regravada: `frontend/visual/referencias/dia-sem-aula-novo-1440-claro.png`, só o pixel (997, 194), que tinha um resíduo. A data fixa (29/10/2026 12:00) já estava no código.
- Verificação: rodada 1 OK (estado `8b52a4b6`). CA1: 3 execuções de 40/40, sem regravação. CA2 e CA3 conferidos. CA4: 664 testes antes e depois, 4 no projeto novo. CA5 (visual do CI) fica no PR.
- Comparação com o canvas: `npm run visual:canvas -- --exige` saiu 0 (165 comparadas, 0 reprovadas). As divergências de `DiaSemAulaNovo` (dados, rótulo "De *", controles de data, "Motivo", "Turmas", pílulas de unidade, "Prévia", "Quando avisar") são anteriores ao item e a tela não mudou; não entram aqui.
- Decisões: D3 (o critério "dias diferentes" fica NÃO CONFERIDO localmente, sem impedir o OK), D4 (`--update-snapshots=changed` para a prova local), D5 (projeto próprio com `--disable-partial-raster`).
- Regressão: a da verificação (`lint`, `typecheck`, `build`, `npm test` com 3048 testes). Não rodou de novo aqui, porque o `AGENTS.md` ("Quem roda o quê") deixa a regressão completa para o CI. Base `dev` sem commits novos desde o início do item.
- Limitações: o caso só é provado de forma definitiva pelo job `visual` do CI. Se outro caso mostrar o mesmo sintoma, basta incluí-lo nas duas expressões de `grep`/`grepInvert`.
- Falhas na regressão local: nenhuma.
