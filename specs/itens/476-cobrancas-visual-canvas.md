# 476 — Cobranças: lista, filtros, celular e estados no visual do canvas

Origem: issue #476 (Sprint 10.5, Fase 3, plano F1), `docs/auditoria/plano-de-issues.md`, `docs/auditoria/decisoes-canvas.md` (R1 a R4); evidências M75, M76, M83, B12, B13, M13, M4, A1, M5, M1. Branch: `item/476-cobrancas-visual-canvas`. Canvas: `Mensalidades`, `CobrancasEscuro`, `EstadoErro`, `EstadoSemAcesso` (1440 px) e `GMCobrancas` (celular; conferência a 390 px pelas capturas, D5 da #435). Dependências #449, #450, #456 a #459 e #464 já em `dev` (itens `feito` no backlog; os componentes `ui/` existem).

Uma especificação, uma entrega; a construção se divide em partes (A a C, nas tarefas).

## 1. Objetivo

Deixar Financeiro › Cobranças igual ao canvas para Coordenação e Administração: cabeçalho "Cobranças" com subtítulo "Unidade X · sem juros, multa ou pagamento parcial · taxas do meio de pagamento repassadas ao aluno" e os botões Recebimentos do dia, Prévia da geração, Exportar CSV ("Em breve") e Nova cobrança (primário); abas em pílula com contagem (Todas, Em atraso, Vence hoje, Em conferência, Pagas no mês); busca "Aluno, CPF ou referência" com ícone; filtros em pílula (Período, Situação, Tipo, Modalidade, Turma); tabela com avatar colorido, referência em duas linhas, vencimento antes da situação, dias de atraso, meio com valor pago, menu "..." por linha, rodapé de totais e paginação "1–12 de 128"; no celular, cabeçalho enxuto, uma linha de pílulas, cartões compactos e totais; os quatro estados no cartão do canvas (erro com "Tentar de novo" e "Falar com o suporte", abas e filtros mantidos). A API muda onde o canvas pede (R2 do dono). "Cobranças" já aparece no menu (A1) e "Sem acesso" já mantém menu e barra: só se confere.

Fora do escopo: janelas Nova cobrança, Cancelar, Renegociar, Registrar pagamento e painel (#477 e seguintes; aqui só se mantém o que abre); Exportar CSV de verdade (#151, Sprint 17); busca por CPF no servidor (ver D3).

## 2. Requisitos

- R1: o cabeçalho mostra o título, o subtítulo do canvas com a unidade da barra (sem unidade escolhida, "Todas as unidades · …") e os botões Recebimentos do dia, Prévia da geração (ambos com ícone, links), Exportar CSV (`ComingSoon`, "Em breve") e Nova cobrança (primário, com "+", só com `COLLECTIONS` completo); somem "Nova cobrança avulsa", "Gerar próximas mensalidades" e "Em atraso" do cabeçalho (D1, D2).
- R2: "Gerar próximas mensalidades" passa a ser aberto pelo botão da Prévia da geração, que abre a mesma janela já existente (D1).
- R3: as abas são `QuickFilters` com "Todas" (padrão) e contagem em cada uma, e sem número enquanto a primeira resposta não chega (B12); a API devolve `counts.all` (D4).
- R4: a busca usa `SearchBox` com o texto de ajuda "Aluno, CPF ou referência" e ícone; o filtro "Período" é uma pílula de mês (D5); Situação, Tipo, Modalidade e Turma são `PillFilter`; sai o filtro de unidade e os campos de data nativos; no celular os filtros vão para a folha (`FilterSheet`) e a linha de pílulas é a das abas.
- R5: a tabela tem as colunas Aluno (avatar colorido, `Person`), Referência (modalidade e mês, e abaixo o tipo Mensalidade/Avulsa/Parcela), Valor, Vencimento, Situação (com "N dias" quando em atraso) e Meio (nome do meio e valor pago, ex.: "Pix · R$ 180,90"; "—" sem pagamento); sem coluna Unidade; a linha inteira abre o painel; cada linha tem menu "..." (D6); a API devolve `daysLate` e `payment.amountCents` (D7).
- R6: o rodapé mostra "N de T cobranças", a soma do filtro e "Pago R$ … · Em aberto R$ …"; a paginação é a do canvas ("1–12 de 128" com setas); a API devolve `totals.paidCents` e `totals.openCents` (D7).
- R7: no celular (abaixo de 640 px) o cabeçalho traz "Mês/Ano · N cobranças", uma linha de pílulas, cartões compactos (avatar, nome, referência, valor à direita, selo e "venceu dd/mm · N dias") e ao pé "N cobranças em atraso · R$ …" quando a aba é Em atraso, e "Nova cobrança" fica disponível sem ocupar a primeira tela (D8).
- R8: os quatro estados usam o cartão do canvas (`canvasStates`): carregando com esqueleto da tabela, vazio, erro ("Não foi possível carregar as cobranças", "A conexão caiu no meio do caminho. Nada foi alterado. Se continuar, fale com o suporte.", botões "Tentar de novo" e "Falar com o suporte") com cabeçalho, abas e filtros mantidos, e sem permissão (403 do servidor) dentro da moldura da gestão.
- R9: o perfil sem acesso (Professor em `/cobrancas`) vê "Esta área não está disponível para o seu perfil" na moldura da gestão, com o texto do canvas e os botões "Voltar ao Início" e "Ver minhas turmas" (M4; ver D9).
- R10: o item do menu "Cobranças" aparece para quem tem a permissão (A1) e a tela cobre o escuro (`CobrancasEscuro`).
- R11: nenhuma regra de cobrança muda: sem juros, multa ou pagamento parcial (RN-COB-07), alcance do Administrador, 403 para Professor, Aluno e Responsável; texto só em pt-BR; axe nos dois temas.

## 3. Critérios de aceite

- CA1 (R1): dado Ana (Administradora), quando abre `/cobrancas`, então vê o subtítulo com a unidade e os quatro botões; "Exportar CSV" tem "Em breve", `aria-disabled` e não responde ao clique; "Nova cobrança" abre a janela de cobrança avulsa.
- CA2 (R1): dado perfil com `COLLECTIONS` só de consulta, quando abre a lista, então não vê "Nova cobrança" (o servidor segue recusando a criação).
- CA3 (R2): dado `/cobrancas/previa`, quando clica "Gerar próximas mensalidades", então abre a janela de antecipar e, ao concluir, a prévia recarrega.
- CA4 (R3): dado a primeira resposta ainda pendente, então as abas aparecem sem número; dada a resposta, "Todas" mostra o total do alcance e as outras mostram suas contagens; clicar numa aba filtra e põe `aria-pressed`; "Todas" limpa o atalho.
- CA5 (R4): dado digitar "bruno", então a lista filtra por aluno e o endereço guarda `q`; dado escolher o período "Outubro/2026", então a lista pede `from=2026-10-01&to=2026-10-31`; dado Situação, Tipo, Modalidade ou Turma, então o filtro combina (E); não há campo de data nativo nem seletor de unidade.
- CA6 (R5): dado uma cobrança em atraso, então a linha mostra "Em atraso" e "25 dias"; dado paga, então o meio mostra "Pix · R$ 180,90"; a referência tem o tipo na segunda linha; clicar na linha abre o painel (`?cobranca=`) e o menu "..." tem teclado e rótulo acessível.
- CA7 (R6): dado 12 linhas de 128, então o rodapé diz "12 de 128 cobranças", a soma e "Pago R$ … · Em aberto R$ …" do filtro (não só da página); a paginação diz "1–12 de 128" e as setas trocam a página.
- CA8 (R7): dado 390 px, então a primeira tela traz título com "Mês/Ano · N cobranças", a linha de pílulas e os primeiros cartões, sem busca vazia nem sete filtros; abrir "Filtros" mostra a folha; na aba Em atraso o pé mostra "N cobranças em atraso · R$ …".
- CA9 (R8): dado a API em erro, quando carrega, então aparece o cartão de erro com os dois botões, com cabeçalho, abas (com a última contagem) e filtros à vista, e "Tentar de novo" recarrega; dado 403, então "sem permissão" no cartão; dado lista vazia sem filtro, então o vazio; com filtro, "sem resultado" com "Limpar filtros".
- CA10 (R9): dado Professor em `/cobrancas`, então vê a tela de área indisponível com menu e barra do Professor, o texto do canvas e os botões "Voltar ao Início" e "Ver minhas turmas".
- CA11 (R10): dado Ana, então o menu Financeiro lista Cobranças com destaque quando ativo; o caso `cobrancas` do teste visual passa no limite padrão a 1440 e 390 px, no claro e no escuro.
- CA12 (R5, R6, R11): dado a API, então `GET /charges` devolve `counts.all`, `daysLate` (só em atraso, pela data do fuso da unidade), `payment.amountCents`, `totals.paidCents` e `totals.openCents`, e o isolamento entre organizações, perfis e o alcance do Administrador continuam como estavam.
- CA13 (R11): dado cobrança cancelada, renegociada ou estornada, então ela não soma em "Pago" nem em "Em aberto" (só PAID e PAID_LATE somam em Pago; PENDING, DUE_TODAY, OVERDUE e IN_REVIEW somam em Em aberto).

## 4. Plano técnico

- Dados: não muda (sem migração). Tudo sai de `charge`, `payment` e da situação já calculada em SQL.
- Especificação e contrato (primeiro): `docs/especificacao/10-cobrancas.md` (RF-COB-01: subtítulo, aba Todas, período, dias de atraso, meio com valor pago, totais Pago e Em aberto, Exportar CSV "Em breve" até a #151, "Gerar próximas" na Prévia); `docs/openapi.yaml` (`/charges` existe, linha ~1127): `ChargeRow` ganha `daysLate` (inteiro, nulo fora de OVERDUE) e `payment.amountCents`; `ChargeList.counts` ganha `all`; `totals` ganha `paidCents` e `openCents`.
- API (`backend/src/main/java/br/com/ctcore/billing/Charges.java`, existe): `Row` (linha 41) ganha `daysLate`; `PaymentRef` (linha 39) ganha `amountCents`; `Counts` (linha 45) ganha `all`; `Totals` (linha 47) ganha `paidCents` e `openCents`; `COLUMNS` (linha ~192) e `map` acrescentam a diferença em dias entre a data do fuso da unidade e `c.due_on` (só quando a situação é `OVERDUE`) e `p.amount_cents`; a consulta de `counts` ganha `count(*)` e a de `totals` ganha `sum(...) filter (where SITUATION in ('PAID','PAID_LATE'))` e o filtro das quatro abertas; o ramo do Administrador sem alcance devolve zeros nos campos novos. Rotas, permissões e filtros não mudam (a busca por CPF fica fora, D3).
- Interface (`frontend/src/features/charges/`, todos existem):
  - `ChargesPage.tsx`: reescrita sobre `PageHeader` (subtítulo com `useUnitScope`, ações com ícone, `ComingSoon` para Exportar CSV), `QueryPage` com `header`, `searchPlaceholder`, `canvasPagination`, `canvasStates`, `onRowClick` para o painel, `fetchPage` com `unitId` do escopo (`useCallback`, como `ClassesPage`), colunas novas e `footer` com totais e Pago/Em aberto; no celular, o botão "Nova cobrança" fixo ao pé (como `ClassesPage`); `filterKeys` troca `from`, `to` e `unitId` por `period`.
  - `ChargeFilters.tsx`: o `Select` nativo e o `DateField` saem; entram `PillFilter` (Período, Situação, Tipo, Modalidade, Turma) e `QuickFilters` com "Todas" e contagens (sem `count` enquanto `counts` é indefinido); abaixo de 640 px as abas ficam na linha e o resto na `FilterSheet`; o link para a conferência continua; entra o link para "Atrasados" ao lado da aba Em atraso (a tela `OverduePage` continua sendo o lugar de lembretes, D2).
  - `ChargeCards.tsx`: `StudentCell` passa a `Person` (avatar colorido de `avatar.tsx`, mantendo `photoUrl`); `ChargeCard` vira o cartão compacto do canvas sobre `RowCard` (avatar, nome, referência, valor, selo, "venceu dd/mm · N dias"); entram `ReferenceCell` (duas linhas), `StatusCell` (selo mais dias) e `MethodCell` (nome mais valor pago); `OpenButton` sai se nada mais o usar (conferir com busca antes; `OverdueRows` e outros podem importá-lo) e o menu "..." por linha entra em arquivo novo `ChargeRowMenu.tsx` (a criar) sobre `Popover` com "Abrir cobrança" ativo e os itens ainda sem tela própria desabilitados com "Em breve" (D6).
  - `ChargePreviewPage.tsx`: recebe o botão "Gerar próximas mensalidades" (abre `AdvanceChargesDialog`, recarrega a prévia ao concluir); `ChargePreviewPage.test.tsx` ganha o caso.
  - `types.ts`: `ChargeRow.daysLate`, `payment.amountCents`, `counts.all`, `totals.paidCents/openCents`; `useCharges.ts` (`fetchCharges`): traduz `period` (AAAA-MM) em `from` e `to` do mês, envia `unitId` e devolve `counts` com `all`.
  - `period.ts` (a criar): `periodOptions(now)` com os meses (seis anteriores, o atual e dois seguintes, rótulo "Outubro/2026") e `periodRange(value)`; teste de unidade.
  - Erro: `ErrorState` do cartão recebe `title`, texto e o `secondary` com "Falar com o suporte" (usar `SupportContact` de `features/auth`); como `QueryPage` monta o `ErrorState` sem esses campos, acrescentar a `QueryPage` as props opcionais `errorTitle`/`errorSecondary` (cobertas por `QueryPage.test.tsx`); só a tela de cobranças as usa.
  - `frontend/src/features/permissions/menuCatalog.ts`: já tem `item("collections", ..., true)`; só conferir (A1) e acrescentar o teste se faltar.
  - `frontend/src/features/auth/AreaUnavailablePage.tsx` e `AreaUnavailableShell.tsx` (existem): conferir M4; texto personalizado e "Ver minhas turmas" só se faltarem (D9).
  - `frontend/src/mocks/handlers.ts`: `chargeRowView` (linha ~976) acrescenta `daysLate` e `payment.amountCents`; a rota `/charges` (linha ~3948) acrescenta `counts.all`, `totals.paidCents`, `totals.openCents`; `cenarios/cobrancas` com dados do canvas onde o caso precisar (12 linhas de 128, Bruno em atraso, Ana Beatriz com Pix R$ 180,90). `billing.msw.test.ts` e `cenarios-cobrancas.msw.test.ts` (existem) ganham os casos.
  - `frontend/src/i18n/pt-BR.json` (`charges.*`): subtítulo, botões, abas, período, colunas, tipos curtos, "N dias", rodapé, erro e vazio; saem as chaves não usadas (`intro`, `columns.unit`, `filters.from`/`to`/`unit`/`allUnits`, `totals` antigo); o lint de texto literal passa.
  - `frontend/visual/casos.ts` (existe): `cobrancas` sem `limiteCanvas`; casos novos `cobrancas-erro` (canvas `EstadoErro`, MSW devolve 500) e `cobrancas-sem-acesso` (canvas `EstadoSemAcesso`, perfil Professor) se o MSW permitir; `GMCobrancas` entra em `semCaso` com o motivo ou ganha caso a 390 px; `cobranca-avulsa` e `cobranca-antecipar` mantêm os `limiteCanvas` da #477 (passo "Nova cobrança" e a janela abrir da Prévia ajustam o texto do botão); `docs/design/README.md` só se um padrão novo entrar.
  - Testes: `ChargesPage.test.tsx`, `ChargePanel.test.tsx` (campos novos nos mocks), `ChargePreviewPage.test.tsx`, `period.test.ts`, `ChargeRowMenu.test.tsx`, `visual/casos.test.ts`, `src/test/a11y.test.tsx` e o `e2e` que toque a tela (conferir `frontend/e2e/*` com busca por `cobrancas`).
- Segurança: permissão e alcance conferidos no servidor como hoje (`Charges.java`); os campos novos não expõem dado novo de pessoa (dias, valor pago e somas); nenhuma rota nova; sem auditoria (só leitura); sem segredo; dados de teste fictícios.
- Reuso: `PageHeader`, `QueryPage`, `SearchBox`, `PillFilter`, `QuickFilters`, `FilterSheet`, `CanvasPagination`, `Person`/`Avatar`, `RowCard`, `StatusBadge`, `ComingSoon`, `Popover`, `ErrorState`/`ForbiddenState` (`canvasStates`), `SupportContact`, `useUnitScope`, `AreaUnavailableShell`, `ClassesPage.tsx` (#475) como modelo de montagem.
- Riscos: a conta de Pago/Em aberto precisa fechar com a de `totals.amountCents` só quando não há cancelada/renegociada/estornada (por isso CA13); o dia de atraso usa a data do fuso da unidade, não da JVM; `OpenButton` é usado também em outras telas (verificar antes de remover); o canvas de erro mantém abas e filtros, e `QueryPage` já renderiza o cabeçalho e a barra fora do corpo, então o erro deve herdar isso sem mudar; o limite padrão do `visual:canvas` pode não fechar na primeira rodada por causa dos dados (12 de 128 no canvas, poucas linhas no MSW): divergência só de dados vira `limiteCanvas` com motivo e issue que a remove, nas condições da regra 4 da Autonomia.

## 5. Tarefas

- [x] T1: Parte A, contrato e servidor: atualizar `docs/especificacao/10-cobrancas.md` e `docs/openapi.yaml`; em `Charges.java`, `daysLate`, `payment.amountCents`, `counts.all`, `totals.paidCents/openCents`; casos novos em `ChargesIT` (dias pela data do fuso da unidade, Pago e Em aberto sem cancelada/renegociada, `all` no alcance do Administrador) e conferência em `ChargesIsolationIT` — cobre CA12, CA13 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=ChargesIT,ChargesIsolationIT -Dtest='OpenApiContractTest,ContractRoutesTest'`
- [x] T2: Parte A, MSW e tipos: `types.ts`, `useCharges.ts`, `period.ts` com teste, `handlers.ts` (`chargeRowView`, `/charges`), cenário do canvas e testes MSW — cobre CA5, CA12 — prova: `npm test -- period billing.msw cenarios-cobrancas` (de dentro de `frontend/`)
- [x] T3: Parte B, lista: `ChargesPage.tsx`, `ChargeFilters.tsx`, `ChargeCards.tsx`, `ChargeRowMenu.tsx`, pt-BR, `QueryPage` (`errorTitle`/`errorSecondary`); atualizar os testes de `charges/` e `QueryPage.test.tsx` — cobre CA1, CA2, CA4 a CA9 — prova: `npm test -- ChargesPage ChargePanel ChargeRowMenu QueryPage`
- [x] T4: Parte B, Prévia: botão "Gerar próximas mensalidades" em `ChargePreviewPage.tsx` e recarga ao concluir — cobre CA3 — prova: `npm test -- ChargePreviewPage`
- [x] T5: Parte C, sem acesso e menu: conferir `AreaUnavailablePage`/`Shell` e `menuCatalog.ts` com o canvas (acrescentar só o que faltar e o teste) — cobre CA10, CA11 — prova: `npm test -- AreaUnavailablePage menuCatalog`
- [x] T6: Parte C, visual: casos de `visual/casos.ts` (`cobrancas`, erro e sem acesso), capturas 1440 e 390 px em `.capturas/476/` com o navegador em pt-BR, `npm run test:visual:docker -- --update-snapshots -g "cobrancas"` só dessa tela, `npm run visual:canvas -- --exige`, `npm run lint && npm run typecheck && npm run test:cov`, axe — cobre CA11, CA9 — prova: `npm run test:visual:docker -- -g "cobrancas"` e `npm run visual:canvas -- --exige`

## 6. Decisões

- D1 (muda o comportamento): "Gerar próximas mensalidades" sai da lista e fica na Prévia da geração, como no canvas (`Fechamento`, `GerarProximas`: "no canvas, 'Gerar próximas' fica na Prévia"); a janela e a regra são as mesmas. Alternativa descartada: manter o botão nas duas telas (contraria o canvas, R1 do dono).
- D2 (muda o comportamento): "Nova cobrança avulsa" vira "Nova cobrança" (primário); o botão "Em atraso" sai da barra porque a aba Em atraso faz o filtro, e a tela de atrasados (lembretes) fica alcançável por um link ao lado da aba Em atraso. Alternativa: manter o botão (não está no canvas).
- D3: a busca do canvas diz "Aluno, CPF ou referência", mas a API filtra só por nome do aluno (`q`, OpenAPI). Não inventar busca por CPF (dado pessoal, regra de negócio e segurança): o texto de ajuda é o do canvas e a divergência de comportamento fica registrada no PR; abrir item para estender a busca se o dono quiser. Se estiver errado: o texto de ajuda promete mais do que a busca faz.
- D4: aba "Todas" mostra `counts.all` (total do alcance e da unidade, sem os demais filtros, igual às outras contagens). Alternativa: usar `total` da lista, que muda com os filtros e engana.
- D5 (muda o comportamento): "Período" é uma pílula de mês (seis anteriores, o atual, dois seguintes); sem escolha, não há filtro de vencimento (todo o período). O canvas mostra "Outubro/2026" e ao mesmo tempo atrasos de setembro, então ele não pode ser filtro fixo do mês; "Todo o período" como padrão é o que preserva a lista de hoje. O intervalo livre de datas some da tela (a API segue aceitando `from`/`to`). Alternativa: padrão no mês atual (esconderia atrasos).
- D6: menu "..." por linha, sem ação nova no servidor: "Abrir cobrança" funciona; "Registrar pagamento", "Cancelar" e "Renegociar" aparecem desabilitados com "Em breve" até a #477 e seguintes ligarem cada janela à linha (hoje todas vivem dentro do painel). Alternativa: ligar as janelas agora (escopo da #477).
- D7: dados que o canvas mostra e a API não trazia viram campos da API (R2 do dono): `daysLate`, `payment.amountCents`, `counts.all`, `totals.paidCents`, `totals.openCents`. Alternativa: calcular no navegador (erra o fuso da unidade e a página inteira).
- D8: no celular, a barra de filtros usa a folha (`FilterSheet`) e as abas viram a linha de pílulas; "Nova cobrança" fica ao pé, como em `ClassesPage`. O pé "N cobranças em atraso · R$ …" só aparece na aba Em atraso (soma de `totals`).
- D9: M4 (Sem acesso) e A1 (menu) já têm código (`AreaUnavailableShell` usa `ManagementLayout`; `menuCatalog` marca Cobranças disponível). O item só confere contra o canvas e corrige a diferença de texto e botões se houver; se o texto personalizado ("fale com a Carla Mendes") exigir nome do Administrador que a API não entrega, usar o texto genérico do canvas e registrar. Suposição: se a conferência achar diferença maior, vira divergência no PR, não ampliação do item.
- Suposição: o `visual:canvas` compara estrutura com dados do MSW (poucas linhas) e o limite padrão fecha; se não fechar só por dados, aplica-se a regra 4 da Autonomia.

## Construção

- T1 — arquivos: `docs/especificacao/10-cobrancas.md` (RF-COB-01), `docs/openapi.yaml` (ChargeRow.daysLate, payment.amountCents, counts.all, totals.paidCents/openCents), `backend/.../billing/Charges.java` (Row, PaymentRef, Counts, Totals, SQL de dias de atraso e das somas), `ChargesIT.java` (caso novo `daysAndPaidOpenTotals` + records atualizados) — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=ChargesIT,ChargesIsolationIT -Dtest='OpenApiContractTest,ContractRoutesTest'` → 20 testes, 0 falhas (ChargesIT 11, ChargesIsolationIT 2, contrato 7).
- T2 — arquivos: `types.ts`, `useCharges.ts` (`period` vira `from`/`to`, `unitId`, counts com os totais novos), `period.ts` e `period.test.ts`, `mocks/handlers.ts` (`chargeRowView`, `/charges`), `charges.msw.test.ts`, `cenarios-cobrancas.msw.test.ts`, fixtures de `ChargePanel.test`, `studentFinancialSummary.test`, `StudentFinancialTab.test` — prova: `npx vitest run src/features/charges src/mocks` → verde.
- T3 — arquivos: `ChargesPage.tsx` (reescrita), `ChargeFilters.tsx`, `ChargeCards.tsx` (`ChargeStudent`, `ReferenceCell`, `StatusCell`, `MethodCell`, `ChargeCard`; saiu `OpenButton`), `ChargeRowMenu.tsx` e `.test.tsx` (novos), `QueryPage.tsx` (`errorTitle`, `errorText`, `errorSecondary`), `states.tsx` (`ErrorState.text`), `DataTable.tsx` (`Column.hideLabel`), `SupportContact.tsx` (`SupportLink`), `pt-BR.json`, `ChargesPage.test.tsx` (reescrito), `QueryPage.test.tsx`, `e2e/agenda.spec.ts` — prova: `npx vitest run src/features/charges src/components/query` → verde.
- T4 — arquivos: `ChargePreviewPage.tsx` (botão e `AdvanceChargesDialog`, recarrega ao concluir), `ChargePreviewPage.test.tsx` (3 casos) — prova: `npx vitest run src/features/charges/ChargePreviewPage.test.tsx` → verde.
- T5 — arquivos: `AreaUnavailablePage.tsx` (em `/cobrancas`: texto da área e "Voltar ao Início"; Professor: "Ver minhas turmas"), `AreaUnavailablePage.test.tsx`, `buildMenu.test.ts` (A1 com o catálogo real), `pt-BR.json` (`areaUnavailable.*`); `menuCatalog.ts` já estava certo (sem mudança) — prova: `npx vitest run src/features/auth src/features/permissions` → verde.
- T6 — arquivos: `visual/casos.ts` (casos `cobrancas-erro`, `cobrancas-sem-acesso`; `falha` no tipo `Caso`; `cobranca-avulsa` clica "Nova cobrança"; `cobranca-antecipar` abre em `/cobrancas/previa`; `EstadoErro` saiu de `semCaso`), `visual/telas.visual.ts` (passo `falha` via `__mswOverride`) — prova: `npm run test:visual:docker -- -g "(cobrancas|cobrancas-erro|cobrancas-sem-acesso|cobranca-avulsa|cobranca-antecipar|cobranca-cancelar|sem-acesso) (1440|390) "` → 28 passaram; `npm run visual:canvas -- --exige` → 131 comparadas, 0 reprovadas (cobrancas 2,2% claro e 2,4% escuro; cobrancas-erro 2,5%; cobrancas-sem-acesso 3,9%; cobranca-avulsa 64% de 70%; cobranca-antecipar 66% de 70%).

Regressão (linha de base: tudo verde):
- `./backend/mvnw -f backend/pom.xml verify` → 878 testes, 0 falhas, JaCoCo ok, BUILD SUCCESS.
- `npm run lint`, `npm run typecheck`, `npm run build` (de `frontend/`) → verdes.
- `npm run test:cov` → 246 arquivos, 2335 testes passaram; cobertura de `src/features/charges` em 100% de linhas (a primeira rodada ficou em 99,4% e fechou com testes do cartão no celular, da busca na folha e do Esc na janela da Prévia).
- `npm run e2e` (@critical) → 96 passaram, 2 estouraram 30 s (`configuracao-unidade`, `portal-pedidos` dark); repetidos, passaram (instável, sem relação com Cobranças). Também rodei sem falha `e2e/agenda.spec.ts`, `alunos.spec.ts` e `pagamento.spec.ts`.
- Instáveis fora do item, vistos só enquanto o `verify` do back-end rodava em paralelo: `LoginPage` (trava com horário) e `EnrollmentWizardPage` (CA9/CA4 e CA1 a CA3); isolados e numa segunda rodada do `test:cov`, passaram. `DailyReceiptsPage` (CA10) falhou uma vez sob carga e passou duas vezes depois.
- `e2e:full` não rodei (só no PR para `main`).

Visual do CI: cobrancas → passou; cobrancas-erro → passou; cobrancas-sem-acesso → passou; cobranca-avulsa → passou; cobranca-antecipar → passou; cobranca-cancelar → passou; sem-acesso → passou.

Capturas (navegador em pt-BR, container do teste visual): `.capturas/476/` com `cobrancas-1440-sistema.png`, `cobrancas-1440-canvas.png`, `cobrancas-1440-escuro-sistema.png`, `cobrancas-390-sistema.png`, `cobrancas-390-canvas.png` (GMCobrancas, 360 px no canvas), `cobrancas-erro-1440-{sistema,canvas}.png`, `cobrancas-sem-acesso-1440-{sistema,canvas}.png`.

Referências visuais: alteradas `frontend/visual/referencias/cobrancas-{1440,390}-{claro,escuro}.png`, `cobranca-avulsa-*`, `cobranca-antecipar-*` (4 de cada) e `sem-acesso-390-{claro,escuro}.png` (agora com "Ver minhas turmas"); novas `cobrancas-erro-*` e `cobrancas-sem-acesso-*` (4 de cada).

Divergências com o canvas achadas na comparação (para a descrição do PR):
- Dados do MSW: o canvas mostra 12 de 128 cobranças de outubro/2026 (Bruno em atraso, Ana Beatriz com Pix R$ 180,90); o cenário do MSW tem 25 cobranças de outros alunos. Só dado; o visual:canvas passa no limite padrão, sem `limiteCanvas`.
- Período: o canvas mostra "Outubro/2026"; o sistema abre em "Todo o período" (D5, decisão registrada).
- "Ver atrasados" ao lado das abas (só na tela larga) não existe no canvas; é a D2 (a tela de lembretes continua alcançável).
- Rodapé: o canvas põe "12 de 128 · soma · Pago/Em aberto" dentro do cartão da tabela; aqui é uma faixa abaixo da tabela e acima da paginação.
- Coluna Meio: o canvas mostra "Pix na chave" em conferência e só "Dinheiro" (sem valor) em paga com atraso; aqui o meio sempre leva o valor pago (R5) e conferência não tem pagamento.
- Celular: o botão "Filtros" fica no fim da linha de pílulas (que rola na horizontal); o canvas não mostra botão de filtros. "Nova cobrança" fica ao pé (D8).
- Menu "..." por linha: ações além de "Abrir cobrança" ficam "Em breve" (D6).
- D3 mantida: o texto de ajuda promete CPF, a busca só filtra por nome (a API não muda; sugerir item ao dono se quiser).
- Sem acesso em `/cobrancas`: texto e "Voltar ao Início" vêm do canvas `EstadoSemAcesso` sem o nome da Administradora (a API não entrega; D9); em outras áreas valem o texto e "Ir para o Início" do canvas `SemAcessoM`.
- Moldura (menu "Cobranças e pagamentos", filtro de unidade da barra, breadcrumb) é de outras issues.

Desvios:
- `StudentCell` ficou como estava (também usado por `OverdueRows` e `PaymentProofsPage`); a lista de cobranças usa um `ChargeStudent` novo, com o avatar de `Person` (sem foto) e a foto quando existe. Trocar o `StudentCell` mudaria as referências dessas outras telas.
- `QueryPage` ganhou também `errorText` (o plano citava só `errorTitle` e `errorSecondary`), porque o texto do cartão de erro do canvas é outro; `ErrorState` ganhou `text`.
- "Falar com o suporte" é `SupportLink` (link `mailto:` do e-mail da plataforma, em `SupportContact.tsx`), com o texto em `states.support`.
- `DataTable.Column` ganhou `hideLabel` para a coluna do menu "..." (título só para leitor de tela, como no canvas, sem cabeçalho visível).
- `charges.columns.unit` ficou: o `ChargePanel` ainda usa; saíram `intro`, `totals`, `filters.from/to/unit/allUnits` e os "todas as…" antigos.
- Menu "..." com posição fixa calculada ao abrir (a tabela rola na horizontal e cortaria o menu nas últimas linhas).
- No celular a busca vai para dentro da folha de filtros (`QueryPage search={!narrow}`) para a primeira tela não ter caixa de busca vazia (CA8).
- `GMCobrancas` segue em `semCaso` (canvas de 360 px); conferido pelas capturas em `.capturas/476/`.

Não é do item: nada além do que está listado acima.

## Verificação

### Rodada 1 — OK — 2026-11-12, estado 6e763bd6c3f7703680f9410d3d81258345bf72cd

| Critério | Status | Evidência |
|---|---|---|
| CA1, CA2 | PASSOU | `ChargesPage.test.tsx` verde (botões, "Em breve", Nova cobrança só com COLLECTIONS FULL); captura `cobrancas-1440-sistema.png` mostra subtítulo e os quatro botões |
| CA3 | PASSOU | `ChargePreviewPage.test.tsx` verde (3 casos) |
| CA4, CA5 | PASSOU | `ChargesPage.test.tsx`, `period.test.ts`, `charges.msw.test.ts` verdes; captura mostra abas e pílulas, sem data nativa nem unidade |
| CA6, CA7 | PASSOU | testes da página e do menu `ChargeRowMenu.test.tsx` verdes; captura mostra referência em duas linhas e menu "..." |
| CA8 | PASSOU | teste do celular verde; `cobrancas-390-sistema.png` com título "Mês/Ano · N cobranças", linha de pílulas e cartões compactos |
| CA9 | PASSOU | caso `cobrancas-erro` (visual passou); cartão de erro com os dois botões, cabeçalho, abas e filtros; contagens só existem depois de uma primeira resposta (ver sugestão) |
| CA10 | PASSOU | `AreaUnavailablePage.test.tsx` verde; caso `cobrancas-sem-acesso` passou |
| CA11 | PASSOU | `buildMenu.test.ts` verde; `test:visual:docker` 28 passaram (claro e escuro, 1440 e 390); `visual:canvas --exige` 131 comparadas, 0 reprovadas |
| CA12, CA13 | PASSOU | `ChargesIT` (11) e `ChargesIsolationIT` (2) verdes; contrato 7 verdes |

Comandos:
- `./backend/mvnw -f backend/pom.xml verify -Dit.test=ChargesIT,ChargesIsolationIT -Dtest='OpenApiContractTest,ContractRoutesTest'` → 20 testes, BUILD SUCCESS.
- `npx vitest run src/features/charges src/components/query src/features/auth src/features/permissions src/mocks src/features/students --maxWorkers=2` → 118 arquivos, 880 testes passaram.
- `npm run lint`, `npm run typecheck` → verdes.
- `npm run test:cov` → 246 arquivos, 2335 testes passaram; `src/features/charges` com 100% de linhas.
- `npm run test:visual:docker -- -g "(cobrancas|cobrancas-erro|cobrancas-sem-acesso|cobranca-avulsa|cobranca-antecipar|cobranca-cancelar|sem-acesso) (1440|390) "` → 28 passaram (sem referência divergente).
- `npm run visual:canvas -- --exige` → 131 comparadas, 0 reprovadas.
- Não rodei de novo o `verify` completo do back-end nem o `e2e`: valem os resultados da Construção (878 testes; 96 passaram) e o CI do PR (AGENTS.md, autonomia 2).
- Capturas conferidas por mim em `.capturas/476/` (cobrancas 1440 e 390, erro 1440), lado a lado com o canvas: estrutura igual; diferenças são as já listadas em "Divergências" da Construção.

Achados:
- sugestão, código, `ChargesPage.tsx` (cabeçalho do celular) — o subtítulo mostra "Mês/Ano · N cobranças" com o mês atual mesmo sem filtro de período (D5: "Todo o período"), então o mês pode não corresponder ao N.
- sugestão, código, estado de erro na primeira carga — o canvas mostra as abas com contagem; aqui ficam sem número (não há resposta anterior), e o ícone e o botão "Falar com o suporte" têm acabamento diferente do canvas.
- sugestão, especificação, D3 — o texto de ajuda promete CPF e a busca só filtra por nome; abrir item se o dono quiser.

## Entrega

Muda: Financeiro › Cobranças (Coordenação e Administração) igual ao canvas: cabeçalho com subtítulo e os quatro botões (Exportar CSV "Em breve"), abas em pílula com contagem, busca e filtros em pílula, tabela com referência em duas linhas, vencimento antes da situação, dias de atraso, meio com valor pago, menu "..." por linha, rodapé de totais e paginação; celular com cabeçalho enxuto e cartões compactos; estados de erro (cartão do canvas) e sem acesso. API: `ChargeRow.daysLate`, `payment.amountCents`, `counts.all`, `totals.paidCents/openCents` (contrato, SQL e `ChargesIT`).

Verificado: rodada 2 OK (estado b3cdafd0520b6dcb53ab394ced6479b978853323), CA1 a CA13. `visual:canvas --exige`: 131 comparadas, 0 reprovadas. Capturas em `.capturas/476/`.

Decisões e divergências com o canvas (também na descrição do PR):
- D5: o período abre em "Todo o período", não em "Outubro/2026" do canvas.
- D3: a busca filtra só por nome; o texto de ajuda fala em CPF. Item a abrir se o dono quiser.
- D6: ações do menu "..." além de "Abrir cobrança" ficam "Em breve".
- D9: sem acesso em `/cobrancas` sem o nome da administradora (a API não entrega).
- Dados do MSW diferentes do canvas (só dado; passa no limite padrão, sem `limiteCanvas`).
- Sem "Ver atrasados" ao lado das abas (D2: a tela de lembretes continua alcançável).
- Rodapé de totais numa faixa abaixo da tabela (o canvas põe dentro do cartão).
- Coluna Meio sempre com o valor pago (R5); o canvas mostra só "Dinheiro" em paga com atraso.
- Celular: botão "Filtros" no fim da linha de pílulas; "Nova cobrança" ao pé (D8).
- `GMCobrancas` (360 px) conferido só pelas capturas.

Regressão (da construção; base `dev` não avançou, não rerodada): `verify` do back-end 878 testes verdes; lint, typecheck, build e `test:cov` (2335 testes, `src/features/charges` com 100%) verdes; `e2e` (@critical) 96 passaram; `configuracao-unidade` e `portal-pedidos` (dark) estouraram 30 s e passaram repetidos. Instáveis fora do item sob carga: `LoginPage`, `EnrollmentWizardPage`, `DailyReceiptsPage` (passaram isolados). Sem issue de instabilidade; a primeira linha do erro não foi anotada na construção. `e2e:full` só roda no PR para `main`.

Verificações do PR (PR #572, estado fdd5f9659b431547302096b773419e4881b3739b, run 43304990639): `ci-gate` e `visual` falharam; os demais passaram. Falha: `visual/telas.visual.ts:111` (caso `cobrancas-previa`, não coberto pelo filtro local da rodada 1), `expect(page).toHaveScreenshot` nos quatro casos, 1440 claro (8384 px), 1440 escuro (8486 px), 390 claro (12140 px), 390 escuro (12389 px) diferentes das referências em `visual/referencias/cobrancas-previa-*.png`. Devolvido `CORRIGIR_CODIGO`.

### Correção da entrega
- Falha do `visual` no PR #572 (caso `cobrancas-previa`, nao coberto pelo filtro local da rodada 1): a diferenca e o botao "Gerar proximas mensalidades" na Previa (D1, esperado). Referencias regeradas so desse caso — arquivos: `frontend/visual/referencias/cobrancas-previa-{1440,390}-{claro,escuro}.png` — prova: `npm run test:visual:docker -- -g "cobrancas-previa"` antes 4 falharam, apos `--update-snapshots` e nova rodada sem update 4 passaram; `npm run visual:canvas -- --exige` -> 131 comparadas, 0 reprovadas.
- Referencias visuais: alteradas `cobrancas-previa-*` (4).
- Visual do CI: cobrancas-previa -> passou.

### Rodada 2 — OK — 2026-11-12, estado b3cdafd0520b6dcb53ab394ced6479b978853323

Mudança desde a rodada 1 / commit fdd5f96: só as 4 referências `cobrancas-previa-{1440,390}-{claro,escuro}.png` e este arquivo (sem código). Achado da entrega (visual do CI em `cobrancas-previa`) conferido: a diferença é o botão "Gerar próximas mensalidades" na Prévia (D1, CA3).

| Critério | Status | Evidência |
|---|---|---|
| CA3 | PASSOU | `cobrancas-previa` 4 casos passaram contra as referências novas |
| CA11 | PASSOU | `test:visual:docker -g "cobranca\|sem-acesso"` → 44 passaram; `visual:canvas --exige` → 131 comparadas, 0 reprovadas |
| CA1, CA2, CA4 a CA10, CA12, CA13 | PASSOU (mantido da rodada 1) | sem mudança de código |

Comandos: os dois acima, resultado real.
Achados: nenhum obrigatório. Sugestões da rodada 1 mantidas.
