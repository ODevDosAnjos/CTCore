# 465 — Alunos: lista, filtros, estados e celular no visual do canvas

Origem: issue #465 (Sprint 10.5, Fase 3, plano P1), `docs/auditoria/plano-de-issues.md`, `docs/auditoria/decisoes-canvas.md`. Branch: `item/465-alunos-lista-canvas`. Canvas: `Alunos`, `GMAlunos`, `GMAlunosFiltros`, `EstadoCarregando`, `ExportarAlunos` (janela "Em breve", só conferência). Dependências já em `dev`: #450, #452, #454, #456, #457, #458, #459, #464.

## 1. Objetivo

Fechar a tela Pessoas › Alunos com o visual do canvas, usando os componentes base que as dependências entregaram: cabeçalho com subtítulo da unidade e contagem, "Exportar CSV" (Em breve) e "Nova matrícula" no cabeçalho, botão "Colunas", colunas do canvas (Aluno, Modalidades e turmas, Graduação, Situação, Financeiro) com selos coloridos, carregando com esqueleto de tabela e, no celular, lista em cartões com "Nova matrícula" ao lado de "Filtros". Para a Coordenação, a Administração e a pessoa que gerencia alunos.

Fora do escopo: coluna de WhatsApp por linha (a lista não traz telefone, RF-ALU-01; D3); filtro "Financeiro" com "Em dia" (o contrato só aceita `financial=OVERDUE`; D4); aba "Bloqueados", Graduação com dados, "Bloqueada por atraso", "Vence hoje" e "Em conferência" (Sprint 12 e contrato; D2); Exportar CSV funcional; ficha e painel do aluno; backend, OpenAPI.

## 2. Requisitos

- R1: o cabeçalho mostra o título "Alunos", o subtítulo "Unidade {nome} · {N} ativos · 1 ficha por pessoa na organização" (com "Todas as unidades" quando o escopo é todas; "carregando…" no lugar de "{N} ativos" até a contagem chegar) e, à direita, "Exportar CSV" (`ComingSoon`, contorno) e "Nova matrícula" (primário, com ícone +); o texto de introdução some (D1).
- R2: "Escolher colunas" vira o botão "Colunas" (com ícone), à direita dos filtros, abrindo um `Popover` com as colunas opcionais marcáveis; a escolha continua por conta, no navegador (`useStudentColumns`).
- R3: a tabela tem as colunas Aluno, Modalidades e turmas, Graduação, Situação e Financeiro, nessa ordem, mais as opcionais Unidade, Idade, Faixa etária e Cadastrado em; Graduação mostra "—" para todos (até a Sprint 12).
- R4: Aluno usa `PersonRow` (avatar, nome em link para a ficha, selos, "idade · unidade"); Modalidades e turmas usa `ModalityDot` com a modalidade em negrito e "turma · nível" em cinza; Situação e Financeiro usam `StatusBadge` pelo mapa único de tons (Ativo, Ex-aluno, Sem matrícula; Em dia, Em atraso).
- R5: as abas (Ativos, Em atraso, Bloqueados "Em breve", Ex-alunos), a busca e os filtros em pílula ficam como estão (#456, #457); o rótulo do filtro de selo passa a "Selos" e o de nível mostra "Todos" (como no canvas).
- R6: abaixo de 640 px a lista sai em cartões (`RowCard`, `cardsBelow="sm"`): avatar, nome, "idade · unidade", modalidades, selos e situação, e a seta "›" que abre a ficha; "Nova matrícula" aparece ao lado do botão "Filtros" e some do cabeçalho; "Exportar CSV" e "Colunas" ficam só a partir de 640 px.
- R7: carregando: com `canvasStates`, a lista mostra o cabeçalho de colunas e 8 linhas de esqueleto (círculo de avatar, duas barras no nome, barras nas colunas), com `role="status"`; abaixo de 640 px, 6 cartões de esqueleto. Vazio, erro e sem permissão seguem os cartões da #464 com os filtros acima.
- R8: nada muda na API, no contrato, nas rotas, nas regras de permissão nem na ficha; o servidor continua a única barreira (403 vira "sem permissão" na lista).
- R9: textos só em `pt-BR.json`; cores, fontes e tamanhos só por tokens; axe sem violação nos dois temas; a 360 px sem rolagem lateral; alvo de toque de 44 px.
- R10: caso `alunos` (e `alunos-filtros`) do teste visual comparados com o canvas (1440 e 390, pt-BR); divergência restante vira `limiteCanvas` com motivo e a issue que a remove; só as referências visuais de `alunos` e `alunos-filtros` (e as que abrem `/alunos` e mudam de verdade) são regeradas.

## 3. Critérios de aceite

- CA1 (R1): dada a lista de Alunos com a unidade "Tijuca" e `counts.active` 3, então o subtítulo diz "Unidade Tijuca · 3 ativos · 1 ficha por pessoa na organização"; antes da resposta, "carregando…"; com escopo "todas", "Todas as unidades"; "Exportar CSV" está desabilitado com "Em breve" e "Nova matrícula" leva a `/alunos/nova-matricula`.
- CA2 (R2): dado o botão "Colunas", quando clico, então abre o popover; desmarcar "Unidade" tira a coluna e a escolha sobrevive a recarregar a página; Esc fecha e devolve o foco ao botão.
- CA3 (R3, R4): dada a lista (MSW), então os cabeçalhos são Aluno, Modalidades e turmas, Graduação, Situação e Financeiro (e as opcionais ligadas); Graduação mostra "—"; o nome é link com o `aria-label` de hoje; aluno em atraso mostra o selo "Em atraso" em tom de perigo e o em dia "Em dia" em tom ok; modalidade aparece com ponto e "turma · nível".
- CA4 (R5): dado "Bloqueados", então está desabilitado com "Em breve" e sem chamada de API; o filtro "Selos" existe com opção "Todos"; filtrar por selo segue funcionando.
- CA5 (R6): dada a janela de 390 px, então não há tabela, há um cartão por aluno com nome, "idade · unidade", situação e seta que abre a ficha; "Nova matrícula" está ao lado de "Filtros", "Exportar CSV" e "Colunas" não aparecem; a 360 px sem rolagem lateral.
- CA6 (R7): dada a consulta em andamento, então aparecem o cabeçalho de colunas e 8 linhas de esqueleto (6 cartões no celular) com `role="status"`; com 500 aparece o cartão de erro e "Tentar de novo" recarrega; com 403, o de sem permissão; busca sem resultado, o vazio com "Limpar filtros"; os filtros seguem visíveis nos quatro.
- CA7 (R8): dada qualquer ação, então as chamadas e os parâmetros são os de hoje (`q`, `pagina`, `tamanho`, `status`, `financial`, `unitId`, `ageRangeId`, `seal`, `modalityId`, `classId`, `levelId`); `ContractRoutesTest` e o contrato não mudam.
- CA8 (R9): `npm run lint` sem texto literal; `tokens.test.ts` passa; axe sem violação nos dois temas na lista e com o popover de colunas aberto; a 360 px sem rolagem lateral.
- CA9 (R10): `npm run test:visual:docker -- --update-snapshots=all -g "alunos"` passa; `npm run visual:canvas -- --exige` não reprova; capturas em `.capturas/465/` (`<tela>-<largura>-{sistema,canvas}.png`); `git status` mostra só os PNG previstos.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (visual; a lista segue `StudentRow` sem telefone, CPF ou e-mail; permissão no servidor).
- Interface:
  - `frontend/src/components/query/QueryPage.tsx` (existe): prop opcional `header?: (p: { counts?: Record<string, number>; total?: number }) => ReactNode`, renderizada acima da busca (sem ela, nada muda); com `canvasStates`, o ramo `loading` mostra `TableSkeleton` (colunas da própria `columns`, 8 linhas) ou 6 cartões de esqueleto quando `cardsOnly && narrow`, em vez de `LoadingState variant="card"`.
  - `frontend/src/components/query/DataTable.tsx` (existe): exportar `TableSkeleton({ columns, rows })` com os cabeçalhos e barras por token (`bg-neutral`, `animate-pulse`), `role="status"` e texto só para leitor de tela.
  - `frontend/src/features/students/StudentsPage.tsx` (existe; `allColumns`, `Content`): colunas novas `graduation`, `modalities` com `ModalityDot`, `status` e `financial` com `StatusBadge`; `Content` troca `PageHeader` (subtítulo, `NewEnrollmentLink` no `actions`, texto de introdução removido), remove o `<details>`, liga `header`, `cards` (`RowCard` com `PersonRow`/`Avatar`, seta `ChevronRight` como link) e `cardsBelow="sm"`; usa `useUnitScope` (`features/units/UnitScopeProvider.tsx`, `ALL`) para o nome da unidade, como `PlansPage.tsx`.
  - `frontend/src/features/students/StudentFilters.tsx` (existe): recebe o seletor de colunas (`columnsMenu`) e `trailing` (o "Nova matrícula" do celular); rótulo "Selos"; `Popover` (`components/ui/popover.tsx`) para "Colunas", só a partir de 640 px.
  - `frontend/src/features/students/useStudentColumns.ts` (existe): `OPTIONAL_COLUMNS` ganha `graduation` (segunda posição); quem já salvou a escolha antes não vê Graduação até marcá-la (nota no PR).
  - `frontend/src/features/students/NewEnrollmentLink.tsx` (existe): aceita `className` e o ícone `Plus`; remove `self-start` fixo.
  - `frontend/src/i18n/pt-BR.json` (existe; bloco `students`): `subtitle`, `subtitleLoading`, `columnsButton`, `columns.name` "Aluno", `columns.modalities` "Modalidades e turmas", `columns.graduation`, `columns.financial` "Financeiro", `statuses`/`financial` conferidos, `filters.seal` "Selos"; remover `intro` e `columnsChoose`.
  - `frontend/visual/casos.ts` (existe, linhas 57-58): `alunos` com `limiteCanvas` reduzido ao que medir; `alunos-filtros` conferido.
  - `frontend/visual/referencias/`: PNG regerados de `alunos`, `alunos-filtros` e dos casos que abrem `/alunos` e mudam (moldura, `notificacoes`) só se a tela atrás mudar.
  - `docs/design/README.md` (existe): nota de uso do esqueleto de tabela na linha "Estados" e de `header` do `QueryPage`.
- Reuso: `PageHeader`, `ComingSoon`, `PersonRow`, `StatusBadge`, `ModalityDot`, `RowCard`, `FilterSheet`, `QuickFilters`, `PillFilter`, `SearchBox`, `Popover`, `CanvasPagination`, estados da #464, `useUnitScope`.
- Riscos: testes e e2e que procuram "Nome", "Situação financeira", "Escolher colunas" ou a introdução (`StudentsPage` tests, `e2e/alunos.spec.ts`, `cenarios-alunos.msw.test.ts`): atualizar junto; a coluna Aluno some do `PersonRow` no celular se `cards` repetir avatar (usar um só); `useUnitScope` fora do provider em testes (envolver no teste); preferência de colunas antiga sem Graduação.

## 5. Tarefas

- [x] T1: `QueryPage` com `header` e esqueleto de tabela/cartões no carregando (`TableSkeleton`) — cobre CA6 — prova: `cd frontend && npx vitest run src/components/query`
- [x] T2: cabeçalho de Alunos (subtítulo, Exportar CSV, Nova matrícula), botão "Colunas" em popover, `OPTIONAL_COLUMNS` com Graduação, textos pt-BR — cobre CA1, CA2 — prova: `cd frontend && npx vitest run src/features/students/StudentsPage src/features/students/useStudentColumns`
- [x] T3: colunas do canvas (Aluno, Modalidades e turmas, Graduação "—", Situação e Financeiro com selo) e filtro "Selos" — cobre CA3, CA4 — prova: `cd frontend && npx vitest run src/features/students/StudentsPage src/features/students/StudentFilters`
- [x] T4: lista em cartões no celular com "Nova matrícula" ao lado de "Filtros" — cobre CA5, CA6 — prova: `cd frontend && npx vitest run src/features/students/StudentsPage` e `npx playwright test e2e/alunos.spec.ts` (360 px sem rolagem lateral)
- [x] T5: ajustar testes e MSW afetados e conferir que parâmetros e rotas não mudaram; axe nos dois temas — cobre CA7, CA8 — prova: `cd frontend && npx vitest run src/features/students src/mocks/cenarios-alunos.msw.test.ts src/test/a11y.test.tsx src/components/tokens.test.ts` e `npm run lint`
- [x] T6: caso visual, referências no container, comparação com o canvas (1440 e 390, pt-BR, `.capturas/465/`), `docs/design/README.md` e divergências para o PR — cobre CA9 — prova: `cd frontend && npx vitest run visual/casos.test.ts src/components/design-readme.test.ts && npm run test:visual:docker -- --update-snapshots=all -g "alunos"` e `npm run visual:canvas -- --exige`

## 6. Decisões

- D1: o texto de introdução da tela é removido e o subtítulo do canvas ocupa o lugar. Motivo: o canvas vence em textos e layout (R1 de `decisoes-canvas.md`). Alternativa: manter a introdução, descartada.
- D2: Situação mostra só o que o contrato traz (Ativo, Ex-aluno, Sem matrícula) e Financeiro só "Em dia" e "Em atraso"; "Bloqueada por atraso", "Vence hoje" e "Em conferência" do canvas ficam como divergência registrada (dependem da inativação, Sprint 12, e de valor novo no contrato). Alternativa: inventar os estados no MSW, descartada (contraria o contrato).
- D3: a coluna de WhatsApp por linha não entra: a lista não traz telefone (RF-ALU-01, "telefone nunca vem na lista"; mesma decisão da #459 D5). Vence a especificação na regra e o canvas no visual; a divergência vai para o PR e para `limiteCanvas`. Alternativa: acrescentar telefone à lista, descartada (dado pessoal fora da regra, mudança de especificação é do dono).
- D4: o filtro "Financeiro" do canvas (Em dia/Em atraso) não é criado: o contrato só aceita `financial=OVERDUE`, que já é a aba "Em atraso"; um filtro com a mesma opção seria redundante. Sugestão de item separado: aceitar `financial=CURRENT` no contrato e no back-end e então acrescentar a pílula. O filtro "Unidade" continua na linha porque RF-ALU-01 o prevê, mesmo o canvas não o mostrar (divergência registrada).
- D5: a escolha de colunas guardada no navegador de quem já usava não inclui Graduação; aparece ao marcá-la no botão "Colunas". Alternativa: migrar a preferência, descartada (preferência só neste navegador, custo maior que o ganho).
- Suposição: o subtítulo usa `counts.active` da própria lista (o canvas diz "131 ativos"); se o servidor contar ativos só da unidade escolhida, o texto ainda confere. Se o contador não responder à unidade, o número pode divergir do canvas (ajuste no PR).
- Fora do item (sugestão): item para `financial=CURRENT` e pílula "Financeiro" (D4).

## Construção

- T1 — arquivos: frontend/src/components/query/DataTable.tsx (`TableSkeleton`), QueryPage.tsx (`header`, esqueleto de tabela e 6 cartões), QueryPage.test.tsx — prova: `npx vitest run src/components/query` → 32 passaram
- T2 — arquivos: StudentsPage.tsx (cabeçalho via `header`, botão Colunas em `Popover`), NewEnrollmentLink.tsx (`className`, ícone +; RecordEnrollment.tsx passa `self-start`), useStudentColumns.ts (`graduation`), pt-BR.json — prova: `npx vitest run src/features/students/StudentsPage src/features/students/useStudentColumns` → passou
- T3 — arquivos: StudentsPage.tsx (colunas com `ModalityDot`, `StatusBadge`, Graduação "—"), StudentFilters.tsx (`columnsMenu`, `trailing`), pt-BR.json ("Selos", "Aluno", "Modalidades e turmas", "Financeiro") — prova: `npx vitest run src/features/students` → passou
- T4 — arquivos: StudentsPage.tsx (`studentCard` com `RowCard`, `cardsBelow="sm"`), StudentFilters.tsx (Nova matrícula ao lado de Filtros) — prova: `npx vitest run src/features/students/StudentsPage` → 31 passaram; `npx playwright test e2e/alunos.spec.ts` → 7 passaram (inclui 360 px sem rolagem lateral)
- T5 — arquivos: StudentsPage.test.tsx (testes novos e ajustados, axe com popover aberto), e2e/alunos.spec.ts ("Selos") — prova: `npx vitest run src/features/students src/mocks/cenarios-alunos.msw.test.ts src/test/a11y.test.tsx src/components/tokens.test.ts` → 243 passaram; `npm run lint` → sem erros; parâmetros e rotas da API intactos (nenhum arquivo de API, OpenAPI ou back-end alterado)
- T6 — arquivos: docs/design/README.md (linha Estados), referências visuais — prova: `npx vitest run visual/casos.test.ts src/components/design-readme.test.ts` → 102 passaram; `npm run test:visual:docker -- --update-snapshots=all -g "alunos"` → 8 passaram; `npm run visual:canvas -- --exige` → 103 comparadas, 0 reprovadas (alunos 1440: 3,3% de diferença, limite padrão 30%); capturas em `.capturas/465/` (1440 e 390, sistema e canvas)
Regressão: `npm run typecheck` → ok; `npm run lint` → ok; `npx vitest run` (completo) → 2112 passaram, 5 falharam sob carga (LoginPage, OverduePage, UnitSettingsPage) e passaram ao rodar de novo os 3 arquivos (56 passaram): instáveis por carga, sem relação com o item. `test:cov`, `e2e` completo e back-end não rodaram nesta sessão (o item não toca no back-end; o CI do PR prova).
Desvios: (1) `OPTIONAL_COLUMNS` ganhou `graduation` na segunda posição e Modalidades, Situação e Financeiro continuam opcionais no popover (o plano as lista como colunas do canvas; mantidas ligáveis para não mudar a preferência salva). (2) `canvasCelular: "GMAlunos"` não pôde ser ligado ao caso: o canvas é de 360 px e `casos.test.ts` exige 390 px; a comparação a 390 px foi visual, pelas capturas em `.capturas/465/`. (3) `alunos` não tinha `limiteCanvas`; nada a reduzir. (4) `NewEnrollmentLink` só leva o ícone + sem `studentId` (lista), para não mudar a ficha.
Divergências para o PR: coluna de WhatsApp por linha (D3); filtro Financeiro (D4); Bloqueados, Graduação com dados, "Bloqueada por atraso", "Vence hoje", "Em conferência" (D2); filtro Unidade na linha; tabela sem a moldura de cartão do canvas; botão "Colunas" com contorno (canvas sem contorno); abas sem seleção inicial.
Referências visuais: frontend/visual/referencias/ alunos-{1440,390}-{claro,escuro}, alunos-filtros-{1440,390}-{claro,escuro}, moldura-administrador-390-{claro,escuro}, moldura-celular-menu-1440-{claro,escuro}, moldura-celular-unidade-{1440,390}-{claro,escuro}, notificacoes-{1440,390}-{claro,escuro}
Não é do item: nenhum

## Verificação

### Rodada 1 — OK — 2026-11-10, estado f9cb0ca5f64ca45d1359258d125c6df4f1b9bc04

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | StudentsPage.test (subtítulo, carregando, todas as unidades, Exportar CSV Em breve); captura 1440 mostra "Todas as unidades · 12 ativos · ..." |
| CA2 | PASSOU | teste "#465 CA2" (popover, Esc, foco) passou; escolha por conta em useStudentColumns.test |
| CA3 | PASSOU | testes "#465 CA3" e cabeçalhos (linha 326); captura 1440 com selos, ponto e "turma · nível", Graduação "—" |
| CA4 | PASSOU | testes de abas/Bloqueados e filtro Selos; e2e "filtra alunos por selo" passou |
| CA5 | PASSOU | captura 390: cartões, seta, "Nova matrícula" ao lado de "Filtros"; e2e 360 px sem rolagem lateral passou |
| CA6 | PASSOU | QueryPage.test (esqueleto 8 linhas / 6 cartões, role=status); e2e erro a 360 px; testes de 500/403/vazio |
| CA7 | PASSOU | diff sem backend/openapi/API; parâmetros conferidos em StudentsPage.test |
| CA8 | PASSOU | lint e typecheck sem erros; tokens.test e a11y.test passaram (axe com popover aberto) |
| CA9 | PASSOU (parcial: visual docker não reexecutado) | capturas existem em .capturas/465/ (1440 e 390, sistema e canvas) e foram abertas; só PNG previstos alterados; casos.test passou; resultado do container/visual:canvas vem do registro da construção e do CI |

Comandos: vitest (23 arquivos: query, students, cenarios-alunos.msw, a11y, tokens, casos, design-readme) 377 passaram; `npm run typecheck` ok; `npm run lint` ok; `npx playwright test e2e/alunos.spec.ts` 7 passaram. test:cov, e2e completo, back-end e test:visual:docker não rodados aqui (item sem back-end; CI prova, AGENTS.md autonomia 2 e 3).
Instáveis: nenhum observado nesta rodada.
Achados:
- sugestão, código, StudentsPage.tsx `allColumns` — Modalidades, Situação e Financeiro seguem opcionais no popover (desvio 1 registrado); sem preferência salva todas aparecem, então confere com o canvas.
- sugestão, especificação — capturas do canvas a 390 px comparadas só visualmente (desvio 2 registrado).

## Entrega

- O que muda: lista de Alunos no visual do canvas. Cabeçalho com subtítulo de contagem, "Exportar CSV" (Em breve) e "Nova matrícula"; botão "Colunas" em popover, com Graduação; colunas Aluno, Modalidades e turmas, Graduação, Situação e Financeiro com selos; filtro "Selos"; no celular, cartões com "Nova matrícula" ao lado de "Filtros". Estados carregando, vazio, erro e sem permissão pelo `QueryPage`. Sem mudança de API, OpenAPI, back-end ou parâmetros.
- Verificação: rodada 1 OK (estado `f9cb0ca5f64ca45d1359258d125c6df4f1b9bc04`). Vitest dos arquivos afetados: 377 passaram; `typecheck` e `lint` ok; `e2e/alunos.spec.ts`: 7 passaram (inclui 360 px sem rolagem lateral). Referências visuais de `alunos`, `alunos-filtros` e dos casos de moldura e notificações regeradas no container.
- Decisões (detalhe em "Decisões"): D1 subtítulo no lugar da introdução; D2 Situação e Financeiro só com os estados do contrato; D3 WhatsApp por linha fora (a lista não traz telefone); D4 filtro Financeiro não criado (sugestão de item separado); D5 preferência de colunas antiga sem Graduação.
- Divergências com o canvas que ficam para depois: coluna de WhatsApp por linha; filtro Financeiro; estados "Bloqueada por atraso", "Vence hoje" e "Em conferência" e aba Bloqueados com dados (dependem da inativação, Sprint 12, e de valor novo no contrato); filtro Unidade na linha (previsto em RF-ALU-01, não mostrado no canvas); tabela sem moldura de cartão; botão "Colunas" com contorno; abas sem seleção inicial.
- Comparação com o canvas: `npm run visual:canvas -- --exige` com 103 comparadas e 0 reprovadas (alunos 1440: 3,3% de diferença). Capturas em `.capturas/465/` (1440 e 390, sistema e canvas, pt-BR). A comparação a 390 px do canvas foi visual, porque o canvas é de 360 px.
- Regressão: a base `dev` não avançou desde a verificação (`4f09077`), então a regressão não foi rodada de novo. Na rodada da verificação, 5 testes falharam sob carga (`LoginPage`, `OverduePage`, `UnitSettingsPage`) e passaram ao rodar de novo os 3 arquivos isolados (56 passaram); não têm relação com o item. `test:cov`, `e2e` completo, visual docker e back-end ficam para o CI do PR.
- Limitações: nenhum `limiteCanvas` foi criado nem removido; nenhuma issue foi alterada.
