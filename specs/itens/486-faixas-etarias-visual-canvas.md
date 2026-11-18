# 486 — Faixas etárias no visual do canvas

Origem: issue #486 (Sprint 10.5, Fase 3, plano G5), `docs/auditoria/plano-de-issues.md`, `docs/auditoria/decisoes-canvas.md` (R1 a R4); evidência B1. Branch: `item/486-faixas-etarias-visual-canvas`. Canvas: `ConfigFaixas` (1440 px, tema claro; não há versão escura nem de celular). Dependências #458 (`RowCard`, `useBelowSm`) e #459 já em `dev`. Os itens #484 e #485 são o modelo de padrão de tela.

## 1. Objetivo

Deixar Configurações › Faixas etárias igual ao canvas: cabeçalho com subtítulo e "Nova faixa etária" no canto, tabela em cartão (Nome, Idade mínima, Idade máxima, Usada em, ícone de lápis), faixa azul sobre categorias de competição e "Última alteração em ... por ...". A API ganha só os dados que o canvas mostra ("Usada em" e última alteração).

Fora do escopo: mudar regras de nome, idades, sobreposição ou permissão; "Usada em" de aula experimental e diretório (hoje só turmas usam a faixa); tela escura e celular do canvas (não existem).

## 2. Requisitos

- R1 (B1): título "Faixas etárias" com "Nova faixa etária" (ícone +) no canto superior direito, só para quem gerencia, e subtítulo "Administrativas: organizam turmas, diretório e aula experimental. A idade do aluno é sempre calculada pelo nascimento."
- R2 (B1): tabela dentro de cartão, cabeçalho em texto normal: Nome, Idade mínima, Idade máxima (números à direita; sem limite mostra "—"), Usada em, e uma coluna de ação sem rótulo visível.
- R3 (B1, D1): "Usada em" lista as turmas da faixa: uma ou duas, os nomes ("Jiu-Jitsu Juvenil", "Turmas Kids e Muay Thai Kids"); três ou mais, "N turmas"; nenhuma, "Sem turmas".
- R4 (B1, D2): a ação da linha é um botão de ícone de lápis ("Editar", com `aria-label` e `title`) que abre a janela de edição; só para quem gerencia. O "Apagar" sai da linha e passa a ser botão destrutivo no rodapé da janela de edição, com a confirmação atual (RN-ORG-17 continua: o Coordenador apaga).
- R5 (B1): abaixo da tabela, faixa informativa azul (`Banner`) "Categorias de competição (IBJJF, CBJ e outras) não entram no cadastro: variam por modalidade e regulamento. Fora da faixa, o sistema só avisa." (RN-ORG-17).
- R6 (B1, D3): abaixo da faixa, "Última alteração em dd/mm/aaaa às HHhMM por <pessoa>" (componente `LastChange`), tirada da auditoria `age_range.*` da organização; sem registro, "Ainda sem alterações".
- R7: a janela de nova e de edição segue o componente base e o canvas ConfigFaixas atrás dela; `scrim="canvas"` no `Modal` (D4). Campos, validações e mensagens atuais continuam.
- R8: abaixo de 640 px a tabela vira lista de `RowCard` (nome, idades, "Usada em", lápis), sem rolagem horizontal a 360 px.
- R9: quatro estados (carregando, vazio com "Nova faixa etária", erro com "Tentar de novo", sem permissão), axe sem violações nos dois temas, textos em `pt-BR.json`; Professor e portal seguem com 403; o Administrador só consulta (sem "Nova", sem lápis).
- R10: `docs/openapi.yaml` e o MSW mudam junto com a API (`AgeRange.usedIn`, `AgeRangeList.lastChange`).
- R11 (ajustado, D7): `npm run visual:canvas` aprova `configuracoes-faixas-etarias` no limite padrão de 30%; `configuracoes-faixa-nova` (o canvas não desenha a janela) fica sem `limiteCanvas` e sem vínculo com o canvas, só com a referência do teste visual.

## 3. Critérios de aceite

- CA1 (R1, R2): dado o Coordenador com Infantil 4–12, Juvenil 13–17 e Adulto 18+, então vê o subtítulo, "Nova faixa etária" no cabeçalho, os cinco cabeçalhos da tabela e, em Adulto, "—" na idade máxima.
- CA2 (R3): dado `usedIn` com 0, 1, 2 e 7 turmas, então a coluna mostra "Sem turmas", o nome, os dois nomes ligados por " e " e "7 turmas".
- CA3 (R4): dado o Coordenador, quando clica no lápis de "Infantil", então abre "Editar faixa etária" com os valores e, no rodapé, "Apagar" destrutivo que pede a confirmação e remove a faixa (falha mostra a mensagem atual); a linha não tem texto "Editar" nem "Apagar" visível.
- CA4 (R4, R9): dado o Administrador, então não há "Nova faixa etária" nem lápis; a lista continua visível.
- CA5 (R5, R6): dado a lista, então a faixa azul com o texto do canvas e "Última alteração em ... por Marcos Leão" aparecem abaixo da tabela; `lastChange` nulo mostra "Ainda sem alterações".
- CA6 (R7): dado "Nova faixa etária" aberta, então os campos, o 409 de nome repetido e o 400 por campo continuam como hoje, e o fundo usa `scrim="canvas"`.
- CA7 (R8): dado 360 px, então há lista de cartões e nenhuma `table`, sem rolagem horizontal da página; a partir de 640 px há a tabela e nenhum cartão.
- CA8 (R9): dado carregando, vazio, erro e 403, então cada estado aparece; axe sem violações nos dois temas.
- CA9 (R3, R6, R10): `GET /age-ranges` devolve `usedIn: { count, names }` (até dois nomes de turma, ordenados, só da organização; turmas desativadas contam) e `lastChange` (`{at, by}` ou nulo); a faixa de outra organização nunca entra na contagem (isolamento); `OpenApiContractTest` e `ContractRoutesTest` passam.
- CA10 (R11): `configuracoes-faixas-etarias` a 1440 e 390 px passa no teste visual e, a 1440 px claro, no `visual:canvas` no limite padrão; `configuracoes-faixa-nova` a 1440 e 390 px passa no teste visual contra a referência commitada, sem `limiteCanvas` e sem comparação com o canvas (que não tem a janela); a janela é conferida a olho contra a janela dos itens #484 e #485 e contra os componentes base.

## 4. Plano técnico

- Dados: não muda (usa `training_class.age_range_id` e `audit_log`).
- API (`docs/openapi.yaml`, schemas `AgeRange` e `AgeRangeList` vistos): `AgeRange.usedIn` ({count integer ≥0, names string[] até 2}, obrigatório); `AgeRangeList.lastChange` (`LastChange`, nullable, obrigatório). POST e PUT devolvem a faixa com `usedIn` (count 0 no POST; real no PUT). Descrição de GET atualizada.
- Back-end (`backend/src/main/java/br/com/ctcore/agerange/AgeRanges.java`, visto): `Item` ganha `UsedIn usedIn`; `list` conta turmas por faixa (`select age_range_id, count(*), array_agg(name order by name) from training_class where organization_id = :org and age_range_id is not null group by age_range_id`, dentro da transação com RLS) e chama `LastChange.find` com `entity_type = age_range`; a última alteração é o último registro `age_range.created|updated|deleted` da organização, então `LastChange.find` (`organization/LastChange.java`, por entidade) ganha uma variante por tipo sem id (`findByType`) ou consulta própria em `AgeRanges`; `create`/`update` devolvem `usedIn`. `AgeRangeController.java` só se o corpo mudar de forma. Testes: `AgeRangeIT` (contagem, nomes, isolamento entre organizações, `lastChange` nulo e depois preenchido).
- Interface (`frontend/src/features/age-ranges/`, vistos): `useAgeRanges.ts` (`usedIn`, `lastChange` no tipo; `lastChange` recarregado após gravar); `AgeRangesPage.tsx` (`PageHeader` com subtítulo e ação, `Card` com tabela, `RowCard` abaixo de 640 px com `useBelowSm`, botão de lápis, `Banner` azul, `LastChange`); `AgeRangeDialog.tsx` (rodapé com "Apagar" destrutivo para a faixa em edição, que dispara a confirmação existente; `scrim="canvas"`); `pt-BR.json` (`ageRanges.*`: subtítulo, cabeçalhos, `usedIn.*`, `competitionNote`, `create` = "Nova faixa etária"); `frontend/src/mocks/handlers.ts` (`usedIn` calculado das turmas do mock, `lastChange` fixo "Marcos Leão" 02/10/2026 14h12); `frontend/visual/casos.ts` (`configuracoes-faixa-nova` sem `limiteCanvas` e sem vínculo `canvas`, D7; ajustar o passo `clicar` para "Nova faixa etária"); testes `AgeRangesPage.test.tsx`; e2e que cliquem "Nova faixa" ou "Apagar" (grep em `frontend/e2e`). Reuso: `Card`, `RowCard`, `useBelowSm`, `Banner`, `LastChange`, `PageHeader`, `ConfirmDialog`, `Modal`, `states`.
- Segurança: permissão no servidor continua (`canManage` só do Coordenador; Professor e portal 403); a contagem e os nomes usam a organização do vínculo e RLS; auditoria das rotas não muda.
- Riscos: (1) o canvas não tem "Apagar"; mantê-lo na janela de edição preserva RN-ORG-17 (D2); (2) a comparação visual da janela pode seguir acima de 30% por fundo: ajustar o cenário do MSW (turmas Kids), não usar exceção; (3) a coluna "Usada em" cresce com nomes longos: quebrar linha, sem rolagem.

## 5. Tarefas

- [x] T1: contrato e back-end: `openapi.yaml` (`usedIn`, `lastChange`), `AgeRanges` (contagem, nomes, última alteração) e `AgeRangeIT` — cobre CA9 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=AgeRangeIT -Dtest='OpenApiContractTest,ContractRoutesTest'`.
- [x] T2: MSW (`usedIn`, `lastChange`, turmas Kids e cenário do canvas) — cobre CA2, CA5 (dados) — prova: `npx vitest run src/mocks`.
- [x] T3: `useAgeRanges`, `AgeRangesPage` (cabeçalho, tabela, lápis, faixa azul, última alteração, cartões no celular), `AgeRangeDialog` (Apagar no rodapé, `scrim="canvas"`), textos pt-BR e `AgeRangesPage.test.tsx` — cobre CA1 a CA8 — prova: `npx vitest run src/features/age-ranges`.
- [x] T4: caso visual sem `limiteCanvas`, capturas em `.capturas/486/` (1440 e 390 px, pt-BR; sistema e canvas da lista; da janela, só o sistema), `npm run visual:canvas`, e `npm run test:visual:docker -- -g "configuracoes-faixa"` sem `--update-snapshots` (regerar só as referências desta tela se a mudança visual é a pedida) — cobre CA10 — prova: esses comandos de dentro de `frontend/`.
- [x] T5: ajustar e2e que usam "Nova faixa" ou "Apagar" e rodar a regressão da pasta — não cobre critério: lint, tipos e testes — prova: `npm run lint && npm run typecheck && npx vitest run src/features/age-ranges` e `npm run e2e` nos specs afetados.

## 6. Decisões

- D1: "Usada em" é contagem e até dois nomes de turma vindos do servidor (`usedIn`), como o canvas mostra ("Turmas Kids e Muay Thai Kids", "7 turmas"). Aula experimental e diretório não guardam faixa hoje, então só turmas contam. Alternativa descartada: contar no cliente buscando as turmas (N chamadas, sem isolamento próprio).
- D2 (muda o comportamento): o "Apagar" sai da linha, porque o canvas só tem o lápis (R1 do canvas vence em botões), e passa a existir no rodapé da janela de edição com a mesma confirmação. A regra (só o Coordenador apaga) não muda. Alternativa descartada: tirar o apagar da tela, que contradiz RN-ORG-17 e RN-MOD-07. Se o dono quiser outro lugar, muda só a posição.
- D3: "Última alteração" vem da auditoria `age_range.*` da organização inteira (a lista é da organização), não de uma faixa. Alternativa descartada: por faixa (o canvas mostra um único texto sob a lista).
- D4: janela de nova/edição com `scrim="canvas"` (fundo igual ao do canvas), como na #484; é isso que tira o `limiteCanvas` de 80%.
- D5: o canvas só existe a 1440 px e claro; os 390 px são conferidos pelo sistema com `RowCard` (como em #484 e #485), com `limiteCanvas` e motivo só se a comparação automática reprovar.
- D7 (ajuste pedido na construção, R11 e CA10): o canvas `ConfigFaixas` só desenha a lista, não a janela; com ela aberta o caso reprova a 68,8% mesmo com `scrim="canvas"`. Segue o precedente `configuracoes-modalidades-pedido` (#485, D7): R11 e CA10 passam a exigir o `visual:canvas` só para a lista, e a janela guarda a referência do teste visual, sem `limiteCanvas` e sem vínculo `canvas`. Alternativa descartada: `limiteCanvas` alto com motivo, que esconderia divergência real.
- D6: a data "02/10/2026 às 14h12" e "Marcos Leão" do canvas são dados do MSW do caso, não regra.

## Construção

- T1 — arquivos: `docs/openapi.yaml` (`AgeRange.usedIn`, `AgeRangeList.lastChange`; `ClassWarnings.ageRange` passou a schema próprio, porque o back-end devolve `AgeRangeRef` sem `usedIn`), `backend/.../agerange/AgeRanges.java` (contagem e até dois nomes por faixa, `lastChange`, `usedIn` no POST/PUT), `backend/.../organization/LastChange.java` (`findByType`), `AgeRangeIT` (novo teste `usedInAndLastChange`: contagem, ordem, desativadas contam, isolamento, `lastChange` nulo e depois preenchido) — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=AgeRangeIT -Dtest='OpenApiContractTest,ContractRoutesTest'` → 7 + 7 testes passaram, BUILD SUCCESS
- T2 — arquivos: `frontend/src/mocks/handlers.ts` (`usedIn` das turmas do mock, `lastChange` fixo Marcos Leão 02/10/2026 14h12), `frontend/src/mocks/age-ranges.msw.test.ts`; cenário do canvas (Turmas Kids, 1, 7) fica no caso visual (`__mswOverride`) — prova: `npx vitest run src/mocks` → passou
- T3 — arquivos: `useAgeRanges.ts`, `AgeRangesPage.tsx`, `AgeRangeDialog.tsx` (Apagar destrutivo no rodapé só na edição, `scrim="canvas"`), `src/i18n/pt-BR.json`, `AgeRangesPage.test.tsx` — prova: `npx vitest run src/features/age-ranges` → 16 testes passaram
- T4 — arquivos: `frontend/visual/casos.ts`, `frontend/visual/telas.visual.ts` (flag `faixasCanvas`), referências regeradas; capturas em `.capturas/486/` (`faixas-etarias-1440-sistema/canvas`, `faixas-etarias-390-sistema`, `faixa-nova-1440-sistema`, `faixa-nova-390-sistema`; o canvas não tem versão de 390 nem janela) — prova: `npm run visual:canvas -- --exige` → 144 comparadas, 0 reprovadas (faixas-etarias 1440 claro a 0,5%, limite 30%)
- T5 — arquivos: `frontend/e2e/faixas-etarias.spec.ts` — prova: `npm run lint`, `npm run typecheck` → ok; `npx playwright test e2e/faixas-etarias.spec.ts` → 1 passou
Regressão: front `npm run test:cov` → 2522 passaram, 2 falharam sob carga (`LoginPage.test.tsx` trava com horário; `EnrollmentWizardPage.test.tsx` timeout 20 s); os dois arquivos rodados de novo isolados → 46 passaram (instável sob carga, não é do item). Back-end `./backend/mvnw -f backend/pom.xml verify` completo → 164 testes rápidos e 896 de integração, 0 falhas, BUILD SUCCESS.
Desvios: (1) R11/CA10: o canvas `ConfigFaixas` só desenha a lista, sem a janela "Nova faixa etária"; com a janela aberta o caso `configuracoes-faixa-nova` reprova no limite padrão (68,8%, o escurecimento do fundo difere do canvas, que não tem janela), mesmo com `scrim="canvas"`. Seguindo o precedente `configuracoes-modalidades-pedido` (#485, D7), o caso perdeu o `limiteCanvas` e também o vínculo `canvas`; guarda só a referência do teste visual. `configuracoes-faixas-etarias` aprova a 0,5% no limite padrão. (2) `ClassWarnings.ageRange` no OpenAPI ganhou schema próprio (sem `usedIn`). (3) Cabeçalho da tabela em texto normal por `[&_th]:normal-case` no contêiner da tabela (o `DataTable` base é em caixa alta).
Visual do CI: configuracoes-faixas-etarias → passou; configuracoes-faixa-nova → passou (`npm run test:visual:docker -- -g "configuracoes-faixa"`, 8 de 8, sem `--update-snapshots`)
Referências visuais: `frontend/visual/referencias/configuracoes-faixas-etarias-{1440,390}-{claro,escuro}.png`, `configuracoes-faixa-nova-{1440,390}-{claro,escuro}.png`
Pedido de ajuste: R11 e CA10 — o canvas ConfigFaixas não tem a janela de nova faixa, então a comparação automática da janela no limite padrão de 30% é impossível (68,8% medido); sugestão: exigir só a lista no `visual:canvas` e a referência da janela no teste visual, como foi feito.

## Verificação

### Rodada 1 — OK — 2026-11-17, estado be9ef05d0c216132496dc79a415d915f3e356580

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | AgeRangesPage.test.tsx (cabeçalhos, subtítulo, "Nova faixa etária", "—"); captura 1440 |
| CA2 | PASSOU | teste: Sem turmas, nome, "A e B", "7 turmas" |
| CA3 | PASSOU | testes: lápis abre "Editar faixa etária", Apagar no rodapé com confirmação, falha mantém; sem texto Editar/Apagar na linha |
| CA4 | PASSOU | teste Administrador: sem Nova e sem coluna de ação |
| CA5 | PASSOU | testes da faixa azul, "Última alteração ... por Marcos Leão" e "Ainda sem alterações" |
| CA6 | PASSOU | testes de 409/400 mantidos; Modal com scrim="canvas" no diff |
| CA7 | PASSOU | teste: cartões sem table a 390 px, tabela sem cartões; captura 390 sem rolagem |
| CA8 | PASSOU | testes dos quatro estados e axe nos dois temas |
| CA9 | PASSOU | AgeRangeIT 7 testes + OpenApiContractTest/ContractRoutesTest 7, BUILD SUCCESS (inclui isolamento) |
| CA10 | PASSOU | visual:canvas --exige: 144 comparadas, 0 reprovadas; visual docker 8 de 8; janela sem vínculo com o canvas por D7 (precedente #485) |

Comandos: mvnw verify -Dit.test=AgeRangeIT -Dtest='OpenApiContractTest,ContractRoutesTest' → ok; npm run lint, typecheck → ok; vitest age-ranges + mocks → 361 passaram; vitest de 18 arquivos que usam faixa → 300 passaram; playwright e2e/faixas-etarias.spec.ts → 1 passou; test:visual:docker -g "configuracoes-faixa" → 8 de 8 sem --update-snapshots; visual:canvas --exige → 0 reprovadas. Regressão completa não repetida (o builder registrou back-end verify completo verde e 2 testes instáveis de outros arquivos).
Capturas: conferidas a olho (.capturas/486/ 1440 canvas e sistema, 390 sistema).
Achados:
- sugestão, código, LastChange (componente compartilhado) — canvas mostra "em 02/10/2026 às 14h12" e ícone de relógio; o sistema mostra "14h12" sem "às" e sem ícone; mesmo padrão das telas anteriores, vale tratar no componente.
- sugestão, código, AgeRangesPage.tsx coluna Nome — canvas em peso normal, sistema em negrito (font-medium).
- sugestão, processo — listar essas divergências na descrição do PR.

## Entrega

- O que muda: Configurações › Faixas etárias no visual do canvas, com cabeçalho e subtítulo, "Nova faixa etária", tabela em cartões (Nome, Idade mínima, Idade máxima, Usada em, lápis), faixa azul sobre categorias de competição e "Última alteração ... por ...". A API ganha `usedIn` (contagem e até dois nomes de turma) e `lastChange`; OpenAPI, MSW e back-end acompanham.
- Decisões: D2 (Apagar sai da linha e fica no rodapé da edição, com a mesma confirmação); D5 (390 px conferido só pelo sistema); D7 (janela de nova faixa sem `limiteCanvas` e sem vínculo `canvas`, porque o canvas não desenha a janela; a referência fica só no teste visual).
- Verificação: rodada 1 OK (estado be9ef05d0c216132496dc79a415d915f3e356580). CA1 a CA10 passaram; `visual:canvas --exige` com 144 comparadas e 0 reprovadas; `test:visual:docker -g "configuracoes-faixa"` com 8 de 8, sem `--update-snapshots`; back-end `verify` completo verde.
- Regressão: a base (`dev`) não avançou desde a verificação, então a regressão não foi repetida. Front `test:cov`: 2522 passaram e 2 falharam sob carga (`src/features/login/LoginPage.test.tsx`, trava com horário; `src/features/enrollment/EnrollmentWizardPage.test.tsx`, timeout de 20 s); isolados passaram (46 de 46). Registrado como instabilidade no comentário da #519.
- Limitações e achados (sugestões, não corrigidas): "Última alteração" do `LastChange`, componente compartilhado, mostra "14h12" sem "às" e sem o ícone de relógio que o canvas tem; coluna Nome em negrito no sistema e em peso normal no canvas. Ambos entram na descrição do PR.
