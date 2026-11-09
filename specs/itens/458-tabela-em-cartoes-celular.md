# 458 — Componente base: Tabela em cartões no celular

Origem: issue #458 (Sprint 10.5, Fase 2, plano C5a), `docs/auditoria/decisoes-canvas.md`, `docs/auditoria/plano-de-issues.md` (C5a). Branch: `item/458-tabela-em-cartoes-celular`. Canvas das telas-piloto: `Professores.dc.html` / `GMProfessores.dc.html` (P6) e `Turmas.dc.html` / `GMTurmas.dc.html` (O4). Dependência #448: mesclada em `dev`.

## 1. Objetivo

Criar o componente de **lista em cartões** que substitui a tabela abaixo de 640 px: cada linha vira um cartão (conteúdo principal, linhas de apoio, selo de situação e a ação principal no fim), sem rolagem lateral. Aplicar nas telas-piloto Professores (P6) e Turmas (O4). As demais telas trocam nas próprias issues (#465 a #501).

Fora do escopo: migrar outras telas (as que já usam `cards` do `QueryPage` continuam no ponto de quebra de 768 px); mudar API, OpenAPI, MSW ou backend; avatar, selos e graduação (já existem, #452); a linha de lista com avatar (#459); o cabeçalho, as abas e o "Novo" largo ao pé do canvas (#470, #475); ordenação no celular (os cartões não têm cabeçalho; ver D3).

## 2. Requisitos

- R1: existe `RowCard`, o cartão de uma linha: `lead` (opcional, ex.: avatar), `title`, `meta` (linhas de apoio), `badge` (selo de situação) e `action` (ação principal, sempre no fim do cartão, com área de toque de 44 px). Só usa tokens.
- R2: a `QueryPage` ganha a prop opcional `cardsBelow?: "sm" | "md"` (padrão `"md"`, que é o comportamento atual). Com `"sm"`, a tabela some e a lista de cartões (`cards`) aparece abaixo de 640 px; a partir de 640 px vale a tabela. Só uma das duas existe no DOM por vez (D1).
- R3: Professores mostra no celular um cartão por professor: avatar, nome, modalidades, unidades, número de turmas, selo de situação e, no fim, a ação "Ver" que abre o painel do professor. Nenhum dado da tabela some (D2).
- R4: Turmas mostra no celular um cartão por turma: nome e unidade, ponto da modalidade, faixa etária, dias e horários, professor, ocupação ("31/30", com o aviso de lotação acima da capacidade), selo de situação e, no fim, a ação "Ver" que abre o painel da turma.
- R5: a partir de 640 px as duas telas continuam com a tabela atual, sem mudança de aparência; as 9 outras telas que usam `QueryPage` não mudam.
- R6: textos só em `pt-BR.json`; cores, fontes e tamanhos só por tokens; axe passa nos dois temas para o cartão (Vitrine e as duas telas em 360 px); a 360 px não há rolagem lateral nas duas telas.
- R7: componente e uso constam em `docs/design/README.md` (tabela Componentes) e na Vitrine.
- R8: referências visuais de `professores`, `turmas` e dos casos que abrem `/professores` ou `/turmas` regeradas e comparadas com o canvas (1440 e 390, pt-BR); divergência restante vira `limiteCanvas` com motivo e a issue que a remove (#470, #475).

## 3. Critérios de aceite

- CA1 (R1): dado `RowCard` com `lead`, `title`, `meta`, `badge` e `action`, então os cinco aparecem na ordem do canvas, a ação é o último elemento do cartão e tem altura mínima de 44 px; sem `lead`, `badge` ou `action`, o cartão renderiza sem lacunas.
- CA2 (R2): dada a `QueryPage` com `cards` e `cardsBelow="sm"`, quando a largura é menor que 640 px, então há cartões e nenhuma `table`; a partir de 640 px há a `table` e nenhum cartão. Sem `cardsBelow`, os testes atuais (Cobranças, Comunicados, Atrasados, Comprovantes, Pedidos) passam sem mudança.
- CA3 (R3): dada Professores com MSW a 390 px, então cada professor aparece em cartão com nome, modalidades, unidades, turmas, situação e "Ver"; clicar em "Ver" vai a `/professores/<id>`; busca, filtros e paginação seguem funcionando.
- CA4 (R4): dada Turmas com MSW a 390 px, então cada turma aparece em cartão com todos os campos de R4; turma acima da capacidade mostra o aviso de lotação; "Ver" vai a `/turmas/<id>`.
- CA5 (R5): dada largura a partir de 640 px, então Professores e Turmas mostram a tabela de hoje (os testes atuais de `TeachersPage.test.tsx` e `ClassesPage.test.tsx` passam sem mudança de comportamento).
- CA6 (R6): `npm run lint` sem texto literal; `tokens.test.ts` passa; axe sem violação nos dois temas para o cartão e para as duas telas; sem rolagem lateral a 360 px (teste de largura no Playwright/visual).
- CA7 (R7): `design-readme.test.ts` passa com `RowCard` e `cardsBelow` descritos.
- CA8 (R8): `npm run test:visual:docker` passa com referências regeradas só de `professores`, `turmas`, `professor-novo`, `professor-painel`, `turma-nova`, `turma-painel`, `vitrine` e dos casos que abrem essas rotas; `npm run visual:canvas` não piora `professores` e `turmas`; capturas em `.capturas/458/`.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (visual; nenhuma rota, dado ou permissão nova; a barreira de dados continua no servidor).
- Interface:
  - `components/query/RowCard.tsx` (a criar): `RowCard({ lead, title, meta, badge, action })`; `<li>` não, só o conteúdo (a `QueryPage` já embrulha em `<li>`); área de toque de 44 px na `action`. Sem estado, sem hook.
  - `components/query/QueryPage.tsx` (existe): prop `cardsBelow?: "sm" | "md"`. Hoje `cards` usa `hidden md:block` (tabela) e `md:hidden` (cartões); com `"sm"` as classes viram `hidden sm:block` e `sm:hidden`. As duas ramificações ficam sempre no DOM por CSS no código atual; para cumprir "uma só no DOM" (axe e testes de texto duplicado), com `"sm"` escolher por `matchMedia` (hook `useBelowSm` já existe em `FilterSheet.tsx`: extrair para `components/query/useBelowSm.ts` e reutilizar nos dois, sem mudar o comportamento do `FilterSheet`). O padrão `"md"` não muda.
  - `features/teachers/TeachersPage.tsx` (existe): `cardsBelow="sm"` e `cards={(r) => <RowCard …/>}` com `TeacherAvatar` (já existe no arquivo), modalidades via `ModalityDot`, `StatusBadge`, `Button` "Ver" como link para o painel.
  - `features/classes/ClassesPage.tsx` (existe): `cardsBelow="sm"` e `cards` com `ModalityDot`, `Person` (professor), ocupação e aviso de lotação (reaproveitar o trecho de `columns` extraindo um pequeno `StudentsCell`), `StatusBadge` e "Ver".
  - `frontend/src/i18n/pt-BR.json`: `query.viewRow` ("Ver", com `aria-label` "Ver {{name}}" em `teachers.viewAria` e `classes.viewAria`; reaproveitar `ui.view` se existir com o mesmo texto).
  - `frontend/src/dev/Vitrine.tsx` e `docs/design/README.md`: `RowCard` e `cardsBelow`.
  - `frontend/visual/casos.ts`: `professores` e `turmas` ganham `canvasCelular: "GMProfessores"` e `"GMTurmas"` (a comparação de 390 usa o canvas de celular das telas).
  - `frontend/visual/referencias/`: `professores`, `turmas`, os casos de janela e painel das duas rotas e `vitrine`, 1440 e 390, claro e escuro.
  - Testes: `RowCard.test.tsx` (a criar), `QueryPage.test.tsx` (casos de `cardsBelow` com `setDeviceNarrow` de `test/device.ts`), `TeachersPage.test.tsx`, `ClassesPage.test.tsx`, `test/a11y.test.tsx`.
- Reuso: `cards` do `QueryPage`, `Person`/`Avatar`, `ModalityDot`, `StatusBadge`, `Button`, `setDeviceNarrow`, tokens existentes.
- Riscos: `QueryPage` serve 11 telas (tudo opt-in); testes de Professores e Turmas que acham o nome do professor ou da turma por `getByRole("link")` quando o cartão está montado (jsdom sem `matchMedia` vale "largo", então só os testes novos usam largura estreita); jsdom sem `matchMedia`; regerar referências no container reprova casos de moldura que abrem `/professores` ou `/turmas` (como na #456 e #457); o canvas de celular pode ter mais dados no cartão do que o sistema tem (divergência vira `limiteCanvas`).

## 5. Tarefas

- [x] T1: `RowCard` e chaves de pt-BR; testes — cobre CA1 — prova: `cd frontend && npx vitest run src/components/query/RowCard.test.tsx`
- [x] T2: extrair `useBelowSm`; prop `cardsBelow` na `QueryPage`; testes — cobre CA2 — prova: `cd frontend && npx vitest run src/components/query`
- [x] T3: aplicar em Professores e ajustar `TeachersPage.test.tsx` — cobre CA3, CA5 — prova: `cd frontend && npx vitest run src/features/teachers/TeachersPage.test.tsx`
- [x] T4: aplicar em Turmas e ajustar `ClassesPage.test.tsx` — cobre CA4, CA5 — prova: `cd frontend && npx vitest run src/features/classes/ClassesPage.test.tsx`
- [x] T5: axe nos dois temas, Vitrine e `docs/design/README.md` — cobre CA6, CA7 — prova: `cd frontend && npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev`
- [x] T6: `canvasCelular` nos casos, regerar referências no container, comparar com o canvas (1440 e 390, pt-BR, `.capturas/458/`), conferir 360 px sem rolagem lateral e listar divergências no PR — cobre CA6, CA8 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots=all -g "professor|turma|vitrine"` e `npm run visual:canvas`
- [x] T7: regressão do front — não cobre critério novo: confere CA2 e CA5 em conjunto, as outras telas e o e2e — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov && npm run e2e`

## 6. Decisões

- D1: a troca tabela/cartões com `cardsBelow="sm"` é decidida por `matchMedia` (um só no DOM), não por classes CSS. Motivo: cada linha existe uma vez só (testes, axe e leitor de tela não leem a lista duas vezes), mesmo padrão do `FilterSheet` (#457). O padrão `"md"` fica como está para as telas que já usam `cards`; elas passam para `"sm"` nas próprias issues. Alternativa: trocar o ponto de quebra de todas, descartada ("nenhuma outra tela mudou de aparência").
- D2: o cartão mostra todos os campos da tabela; a ação principal "Ver" abre o painel e o nome deixa de ser link no cartão (o link duplicado confundiria o leitor de tela). Suposição: o canvas de celular usa o cartão inteiro ou uma seta como alvo; a captura decide o desenho final da ação (botão "Ver" ou seta), sem mudar a API do `RowCard`.
- D3: no celular não há ordenação (sem cabeçalho de coluna); a ordem do endereço (`ordem`) continua valendo se estiver nele. Motivo: o canvas de celular não tem controle de ordenação. Suposição: aceitável; se o dono quiser, a ordenação entra como filtro em pílula na #470/#475.
- D4: componente e piloto só nas duas telas pedidas pela issue; as telas citadas na evidência (Usuários, Planos, Alunos, Cobranças, Dias sem aula, Unidade etc.) ficam nas issues delas.

## Construção

- T1 — arquivos: `components/query/RowCard.tsx`, `RowCard.test.tsx`, `pt-BR.json` (`query.viewRow`, `teachers.viewAria`, `teachers.classCount`, `classes.viewAria`) — prova: `npx vitest run src/components/query/RowCard.test.tsx` → 2 passaram
- T2 — arquivos: `useBelowSm.ts` (extraído), `FilterSheet.tsx`, `QueryPage.tsx` (`cardsBelow`), `QueryPage.test.tsx` — prova: `npx vitest run src/components/query` → 28 passaram
- T3 — arquivos: `TeachersPage.tsx`, `TeachersPage.test.tsx` — prova: vitest da página → 15 passaram
- T4 — arquivos: `ClassesPage.tsx` (`StudentsCell`, `scheduleText`), `ClassesPage.test.tsx` — prova: vitest da página → passaram
- T5 — arquivos: `Vitrine.tsx`, `docs/design/README.md`, axe nos testes das duas telas (360 px, dois temas) — prova: `npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev src/features/teachers src/features/classes src/components/query` → 184 passaram
- T6 — arquivos: 13 PNGs em `frontend/visual/referencias/` (professor-painel 390, professores 390, turma-nova 390, turma-painel 390 escuro, turmas 390, vitrine 4) — prova: `npm run test:visual:docker -- --update-snapshots=all -g "professores|turmas"` (e antes `-g "professor|turma|vitrine"`) → passaram; `npm run visual:canvas` → 97 comparadas, 0 reprovadas; capturas em `.capturas/458/`
- T7 — prova: `npm run lint && npm run typecheck && npm run test:cov && npm run e2e` → 216 arquivos / 2064 testes passaram; e2e 98 passaram

Regressão: igual à linha de base (a primeira rodada teve 1 falha instável em `LoginPage.test.tsx` #445, que passou ao repetir, sem relação com o item).
Desvios:
- `canvasCelular: "GMProfessores"/"GMTurmas"` não foi aplicado: as telas GM têm 360 px e `visual/casos.test.ts` exige 390 (D5 da #435; estão em `semCaso`). A comparação de 390 foi feita olhando as capturas `.capturas/458/*-390-sistema.png` e `*-390-canvas.png` (geradas com o caso temporariamente ligado).
- "Turmas" no cartão do professor usa `Turmas: N` (o plural pt do i18next trata 0 como singular).
- Não medido: ausência de rolagem lateral a 360 px (só axe a 360 e capturas a 390 sem estouro).
Divergências com o canvas (390): avatar menor e sem cor forte; selo embaixo e não à direita; botão "Ver" em vez do cartão inteiro como alvo; cartão de professor com mais linhas (turmas, unidades por extenso "Unidade X"); cartão de turma com campos que o canvas omite e sem ocupação à direita; cabeçalho, abas em pílula, intro e "Novo" largo ao pé (resolvem #470 e #475).
Referências visuais: os 13 PNGs acima; `professores-1440-*` regerados por ruído foram restaurados ao original.
Não é do item: arquivo solto `D:\tmp_imgs_before.txt` criado por engano fora do repositório (a remoção foi bloqueada; apagar à mão).

## Verificação

### Rodada 1 — NAO_CONFERIDO — 2026-11-09, estado ea0c76b59898ce9f28c606583b8f59d98c7b6559

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `RowCard.test.tsx` (2 testes) dentro de `vitest run src/components ...` → 55 arquivos / 410 testes passaram; ação é o último filho com `min-h-11`; sem lead/selo/ação sem lacunas |
| CA2 | PASSOU | `QueryPage.test.tsx` · cardsBelow (sm estreito: cartões sem table; sm largo: table sem cartões; sem prop: padrão); testes das outras telas passaram na mesma execução |
| CA3 | PASSOU | `TeachersPage.test.tsx` · celular: cartão com avatar, modalidades, unidade, "Turmas: 0", situação, "Ver" → painel |
| CA4 | PASSOU | `ClassesPage.test.tsx` · celular: todos os campos, aviso "Acima da capacidade (31/30)", link `/turmas/c1`; captura `.capturas/458/turmas-390-sistema.png` vista |
| CA5 | PASSOU | testes antigos das duas páginas passaram sem mudança (jsdom largo = tabela) |
| CA6 | NÃO CONFERIDO | lint e typecheck limpos, axe 360 px nos dois temas passou, `tokens.test.ts` passou; a ausência de rolagem lateral a 360 px não foi medida (declarado em "Construção"), e não é limitação aceita |
| CA7 | PASSOU | `design-readme.test.ts` passou; README e Vitrine têm `RowCard` e `cardsBelow` |
| CA8 | NÃO CONFERIDO | `test:visual:docker`, `visual:canvas` e `e2e` não foram reexecutados aqui (relato da construção: 0 reprovadas, e2e 98); capturas 390 de sistema e canvas existem e foram vistas; `canvasCelular` não aplicado (desvio justificado, GM tem 360 px e `casos.test.ts` exige 390) |

Comandos: `npx vitest run src/components src/features/teachers src/features/classes src/test src/dev --maxWorkers=2` → 55 arquivos, 410 testes passaram; `npm run lint` → limpo; `npm run typecheck` → limpo.
Achados:
- sugestão, código, `RowCard.test.tsx` 2º teste — o seletor `div > div > *:nth-child(2)` é frágil; asserção mais direta seria sobre ausência do selo/meta.
- sugestão, código, `Vitrine.tsx` — texto literal "Ana Souza", "Ver" etc. (vitrine de dev; lint passou, então tolerado).
- pendência, processo — CA6 (360 px sem rolagem lateral): medir com um teste de largura (Playwright ou visual) e então reverificar. Divergência de canvas 390 já listada em "Construção" para o PR.

### Correção da rodada 1
- CA6, rolagem lateral a 360 px não medida — arquivos: `frontend/e2e/professores.spec.ts`, `frontend/e2e/turmas.spec.ts` (um teste novo em cada: viewport 360, sem `table`, `scrollWidth <= innerWidth`) — prova: `npx playwright test e2e/professores.spec.ts e2e/turmas.spec.ts -g "360 px"` → 2 passaram; `npm run lint` e `npm run typecheck` limpos
- CA8: `test:visual:docker`, `visual:canvas` e e2e completo não reexecutados nesta correção (só e2e adicionado, sem mudança visual); resultado da construção mantido (0 reprovadas, e2e 98)

### Rodada 2 — OK — 2026-11-09, estado e1dcf5ab19959b63817a3883912f5142b61dcf43

Desde a rodada 1 só mudaram `e2e/professores.spec.ts` e `e2e/turmas.spec.ts` (um teste de 360 px em cada).

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | mantido da rodada 1 |
| CA2 | PASSOU | mantido da rodada 1 |
| CA3 | PASSOU | mantido da rodada 1 |
| CA4 | PASSOU | mantido da rodada 1 |
| CA5 | PASSOU | mantido da rodada 1 |
| CA6 | PASSOU | `npx playwright test e2e/professores.spec.ts e2e/turmas.spec.ts` → 9 passaram, incluindo os dois de 360 px (sem table, `scrollWidth <= innerWidth`); lint e typecheck limpos |
| CA7 | PASSOU | mantido da rodada 1 |
| CA8 | PASSOU | `npm run test:visual:docker -- -g "professor|turma|vitrine"` → 48 passaram, sem atualizar referências; `npm run visual:canvas -- --exige` → 97 comparadas, 0 reprovadas; capturas 390 vistas na rodada 1; `canvasCelular` não aplicado (desvio justificado em "Construção") |

Comandos: os acima, todos verdes.
Achados:
- sugestão, código, `RowCard.test.tsx` 2º teste — seletor `div > div > *:nth-child(2)` frágil (da rodada 1).
- sugestão, código, `Vitrine.tsx` — textos literais (da rodada 1).

## Entrega

- O que muda: o componente `RowCard` (cartão de linha) e a troca tabela/cartões por `cardsBelow="sm"` no `QueryPage`, decidida por `matchMedia` (um só no DOM). Piloto nas telas de Professores e Turmas; a folha de filtros (`FilterSheet`) passa a usar o mesmo hook (`useBelowSm`). Textos novos em `pt-BR.json`. Vitrine e `docs/design/README.md` mostram o componente.
- Verificação: rodada 2 OK (estado `e1dcf5ab19959b63817a3883912f5142b61dcf43`). Testes de unidade e página passaram; axe a 360 px nos dois temas; e2e de 360 px sem tabela e sem rolagem lateral; `npm run test:visual:docker -- -g "professor|turma|vitrine"` → 48 passaram; `npm run visual:canvas -- --exige` → 97 comparadas, 0 reprovadas. Capturas em `.capturas/458/` (não versionadas).
- Divergências com o canvas a 390 px (para a descrição do PR), e como ficaram:
  - avatar menor e sem cor forte: não resolvido nesta entrega; a #459 (linha de lista com avatar) trata o avatar;
  - selo embaixo e não à direita: não resolvido nesta entrega, sem issue que o cubra;
  - botão "Ver" como alvo em vez do cartão inteiro (D2): mantido por leitor de tela, sem mudar a API do `RowCard`;
  - cartão de professor com mais linhas (turmas, "Unidade X" por extenso) e cartão de turma com campos que o canvas omite, sem ocupação à direita: resolvido nas #470 e #475;
  - cabeçalho, abas em pílula, intro e "Novo" largo ao pé: resolvido nas #470 e #475.
- Decisões: D1 (matchMedia em vez de classes CSS), D2 (cartão com todos os campos e "Ver"), D3 (sem ordenação no celular, pelo canvas), D4 (só as duas telas pedidas). Nenhuma exceção de `limiteCanvas` foi acrescentada; `canvasCelular` das telas GM não foi aplicado porque elas têm 360 px (ver "Construção").
- Regressão: não rodada nesta fase (a base não avançou desde a verificação). A da construção ficou igual à linha de base; uma falha instável de `LoginPage.test.tsx` (#445) na primeira rodada passou ao repetir e não tem relação com o item.
- Limitações: a ausência de rolagem lateral a 360 px é medida só pelos dois testes de e2e novos; `canvasCelular` das telas GM segue fora, até a regra do `casos.test.ts` mudar.
- Arquivo fora do repositório deixado por engano na construção: `D:\tmp_imgs_before.txt`. Não faz parte do item; apagar à mão.
