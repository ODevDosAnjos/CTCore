# 676 — RNF-27/43 · Estado da tela no endereço: painéis como rota-filha, filtros preservados e abas no endereço

Origem: issue #676 (Sprint 10.5), `docs/especificacao/00-visao-geral.md` RNF-27 e RNF-43, D3 de `specs/itens/8-componentes-base-padroes-tela.md` (que esta issue substitui). Depende da #675. Branch: `item/676-estado-da-tela-no-endereco`.

## 1. Objetivo

Fazer o endereço ser a única fonte do estado da tela: filtros, busca, página, ordem, tamanho, painel aberto e aba ativa. Quem filtra, abre um registro, fecha, volta, avança ou aperta F5 reencontra a mesma tela, e o link de uma aba ou de um painel funciona quando enviado. Hoje dois mecanismos (`useQueryParams` com `window.history` e `useSearchParams`) não se enxergam, painéis abrem de cinco jeitos e abas guardam estado em três formas.

Fora do escopo: regras escritas no `AGENTS.md`/design e testes de padrão (#677); visual dos painéis e das abas; API, contrato OpenAPI e MSW (não mudam); janelas de ação (editar, desativar, novo), que continuam estado interno.

## 2. Requisitos

- R1: Todo estado de consulta e de tela no endereço é lido e escrito pelo roteador (`useSearchParams`); nenhum código de tela (fora de teste) usa `window.history` ou `window.location` para mudar ou ler o endereço. `useQueryParams` passa a ser uma camada fina sobre o roteador, com a mesma API (D1).
- R2: Filtros, busca, página, ordem e tamanho sobrevivem a abrir e fechar painel, abrir e fechar janela, voltar, avançar e F5.
- R3: Um `Link` para a mesma lista com outro filtro, com a lista já aberta, atualiza a lista.
- R4: Painel de registro é rota-filha da lista (a lista é a rota-pai com `<Outlet />`), sem recriar nem buscar a lista de novo ao abrir e ao fechar: Turmas (`/turmas/:id`), Professores (`/professores/:id`), Alunos (`/alunos/:id`), Cobranças (`/cobrancas/:id`) e Planos (`/planos/:id`, consulta do plano desativado) (D2).
- R5: Fechar o painel volta ao endereço da lista com os filtros, sem os parâmetros que só valem para o painel (D3).
- R6: Voltar do navegador com o painel aberto fecha o painel e mantém a lista; F5 com o painel aberto reabre o mesmo registro.
- R7: O endereço antigo `/cobrancas?cobranca=<id>` chega a `/cobrancas/<id>`, mantendo os demais parâmetros.
- R8: A cobrança aberta dentro da ficha do aluno tem endereço: `?cobranca=<id>` na própria ficha, com a aba Financeiro (D4).
- R9: As abas ficam no endereço em `?aba=<id>`, formato único para gestão e portal: ficha do aluno, Configurações › Unidade, Minha conta e as demais abas existentes (Termos, histórico do portal por ano) (D5). Aba inválida ou ausente vale a aba padrão; F5 mantém a aba.
- R10: Em Comunicados, fechar a janela de comunicado da organização (`?novo=organizacao`) mantém os filtros da lista.
- R11: Ficam apagados, no mesmo PR, `ClassPanelPage`, `TeacherPanelPage` (e seus testes), os estados de aba em memória e o acesso direto a `window.history`/`window.location` no hook antigo.

## 3. Critérios de aceite

- CA1 (R1): dado qualquer tela com consulta, quando se filtra, busca, pagina, ordena ou muda o tamanho, então o endereço muda pelo roteador e o botão voltar desfaz a mudança; uma busca no código-fonte não acha `window.history` nem `window.location` fora de testes e de `main.tsx`.
- CA2 (R2): dado Alunos com filtro e página aplicados, quando abro um aluno, fecho e aperto F5, então o endereço e a lista mantêm os mesmos filtros.
- CA3 (R2, R4, R5): dado Turmas, Professores, Alunos e Cobranças com um filtro aplicado, quando abro um registro e fecho o painel, então o endereço volta à lista com o filtro e a lista mostra o mesmo resultado, sem nova chamada de listagem ao abrir nem ao fechar.
- CA4 (R3): dado `/alunos` aberto, quando clico num `Link` para `/alunos?classId=<id>` (como o "Ver todos os alunos" do painel da turma), então a lista é atualizada com o filtro novo.
- CA5 (R6): dado um painel aberto (turma, professor, aluno, cobrança, plano), quando uso o voltar do navegador, então o painel fecha e a lista continua; quando aperto F5 com o painel aberto, então o mesmo registro reabre.
- CA6 (R7): dado `/cobrancas?cobranca=<id>&status=OVERDUE`, quando a tela abre, então o endereço vira `/cobrancas/<id>?status=OVERDUE` e o painel da cobrança abre sobre a lista.
- CA7 (R8): dado a aba Financeiro da ficha, quando abro uma cobrança, então o endereço leva `?aba=financeiro&cobranca=<id>`; voltar fecha só a cobrança; F5 reabre a cobrança sobre a ficha.
- CA8 (R9): dado a ficha do aluno, Configurações › Unidade ou Minha conta numa aba que não é a primeira, quando aperto F5, então a mesma aba continua ativa; com `?aba=` inválido, a aba padrão abre sem erro.
- CA9 (R9): dado qualquer tela com abas, quando troco de aba, então o endereço muda para `?aba=<id>` sem acrescentar entrada ao histórico (D5) e os filtros da lista de fundo ficam intactos.
- CA10 (R10): dado Comunicados com filtros e `?novo=organizacao`, quando fecho a janela, então o endereço e a lista mantêm os filtros e só `novo` sai.
- CA11 (R4): dado um painel para um registro inexistente ou sem permissão (`/turmas/<id inválido>`, perfil sem acesso), quando abre, então a gaveta mostra "não encontrado" ou "sem permissão" e fechar volta à lista; a rota continua passando pelo guarda do mapa.
- CA12 (R11): dado o código final, então `ClassPanelPage` e `TeacherPanelPage` não existem e nenhuma tela guarda a aba em `useState` próprio quando ela é de endereço.
- CA13 (R1–R9): dado o item pronto, quando rodo os casos do teste visual das telas mexidas sem `--update-snapshots`, então passam; quatro estados, 360 px e axe nos dois temas continuam passando.

## 4. Plano técnico

- Dados: não muda.
- API: não muda (contrato e MSW inalterados).
- Interface: a lista vira rota-pai e o painel, rota-filha, no modelo da Agenda (`AgendaPage` renderiza `<Outlet />`; `LessonPanelPage` é o filho). Abrir é `navigate`/`Link` para `/<lista>/<id>` levando o `search` atual; fechar é `navigate({ pathname: lista, search })` sem os parâmetros de painel. Abas usam `Tabs` com `value`/`onValueChange` ligados a `?aba=` (troca com `replace`).
- Segurança: guarda `RequireArea` do mapa em toda rota nova (já aplicado pelo `managementRoutes`); o servidor segue sendo a barreira. Nenhum dado novo no endereço além de id de registro e filtros já existentes.
- Arquivos a alterar (vistos no repositório):
  - `frontend/src/components/query/useQueryParams.ts`: reescrito sobre `useSearchParams` (`get`, `set(changes, replace)`, `clear`); `set` usa a forma funcional do `setSearchParams` e continua zerando `pagina` quando outro filtro muda. `QueryPage.tsx` não muda de API.
  - `frontend/src/routes.ts`: `students` passa a `/alunos` (sem `:id?`); novas rotas-filhas `studentRecord` `/alunos/:id` (parent `students`), `classPanel` e `teacherPanel` com `parent`, `chargePanel` `/cobrancas/:id` (parent `collections`), `planPanel` `/planos/:id` (parent `plans`); `enrollment` (`/alunos/nova-matricula`) fica irmã, e as rotas estáticas de `/cobrancas/*` e `/planos/lista` ganham da `:id` pela ordem do roteador. Comentário do formato antigo `?cobranca=`.
  - `frontend/src/App.tsx`: `screens` troca `classPanel: <ClassPanelPage/>` e `teacherPanel: <TeacherPanelPage/>` pelos painéis-filhos; acrescenta `studentRecord`, `chargePanel`, `planPanel`.
  - `frontend/src/features/classes/ClassesPage.tsx` e `ClassPanelPage.tsx`: a página renderiza `<Outlet />` no lugar de `children`; `ClassPanelPage.tsx` vira só o painel (`DrawerShell` fecha com `search`); some o embrulho. Idem `teachers/TeachersPage.tsx` e `TeacherPanelPage.tsx`. Os arquivos mantêm o nome do painel (renomear só se o diff ficar menor).
  - `frontend/src/features/students/StudentsPage.tsx`: `useParams`/`id` e o painel saem; `<Outlet />`; links da linha e do cartão já levam `search`. `StudentRecordPanel.tsx`: vira o elemento da rota-filha, lê `id` de `useParams`, fecha com o `search` sem `aba`, `cobranca` e `pedido`; aba em `?aba=` no lugar de `useState`; `?pedido=` continua abrindo na matrícula. `StudentFinancialTab.tsx`: `open` vira `?cobranca=` (D4).
  - `frontend/src/features/charges/ChargesPage.tsx`: tira `useQueryParams` do painel, `<Outlet />`, redireciona `?cobranca=`; novo `ChargePanelPage` (a criar) que lê `id` e monta `ChargePanel` fechando para a lista com `search`; `ChargePanel.tsx` não muda (já recebe `id` e `onClose`).
  - `frontend/src/features/plans/PlansPage.tsx` e `PlanInspectDrawer.tsx`: a consulta do plano desativado abre por `/planos/:id` (o drawer passa a receber o `id` e ler `usePlanDetail`); editar e desativar continuam janelas de estado (D2).
  - `frontend/src/features/announcements/AnnouncementsPage.tsx`: o fechamento da janela usa o mesmo mecanismo da lista (R10); `navigate("/comunicados", …)` do envio mantém.
  - `frontend/src/features/units/UnitSettingsPage.tsx`, `features/terms/TermsPage.tsx`, `features/account/AccountPage.tsx`, `features/portal/PortalChargeHistory.tsx` (ano via `?aba=`) e `components/ui/tabs.tsx`: abas em `?aba=`; um hook pequeno `useTabParam(ids, padrão)` a criar em `frontend/src/components/ui/useTabParam.ts` devolve `[aba, setAba]` (valida contra `ids`, `replace`).
  - Testes a ajustar: `ClassPanelPage.test.tsx`, `TeacherPanelPage.test.tsx`, `StudentsPage.test.tsx`, `ChargesPage.test.tsx`, `ChargePanel.test.tsx`, `PlansPage.test.tsx`, `QueryPage.test.tsx`, `AnnouncementsPage.test.tsx`, `UnitSettingsPage` e `AccountPage` (renderizar dentro do roteador com rotas-filhas), `routes.test.ts`, `src/test/noInternalAnchors.test.ts`; `e2e/pagamento.spec.ts` (usa `?cobranca=`).
  - E2E a criar: `frontend/e2e/estado-no-endereco.spec.ts` (`@critical` para Alunos, Turmas, Professores e Cobranças) e ajustes nos de Minha conta e Configuração da unidade.
- Reuso: o modelo `AgendaPage` + `LessonPanelPage`; o mapa de rotas e `managementRoutes` da #675; `Drawer`, `SidePanel` e `Tabs` atuais; `useStudentColumns` e `QueryPage` sem mudança de API.
- Riscos: (1) `/alunos/nova-matricula` e `/alunos/:id` no mesmo nível: confirmar que a estática vence (teste de rota). (2) A lista não pode remontar ao abrir o painel: um `key` ou uma `fetchPage` instável refaria a busca; o teste conta as chamadas. (3) Links com `search` antigo (`allColumns(t, search)`) devem usar o `search` da lista, sem `aba` e `cobranca`. (4) Testes unitários que renderizam telas sem roteador passam a precisar de `MemoryRouter`; falha é percebida em `npm test`. (5) A #611, #624, #625, #630 e #645 vêm depois: o formato `?aba=` e as rotas-filhas ficam registrados aqui para elas.

## 5. Tarefas

Dividido em três partes, cada uma construível numa sessão; o item continua um só (uma verificação, uma entrega).

Parte A — base e painéis de lista simples

- [x] T1: `useQueryParams` sobre `useSearchParams`, sem `window.history`/`window.location`; ajustar `QueryPage.test.tsx` e testar "Link para a mesma lista com outro filtro atualiza a lista" — cobre CA1, CA4 — prova: `npm test -- src/components/query`
- [x] T2: Turmas e Professores: lista como rota-pai com `<Outlet />`, painel como rota-filha, fechar com os filtros; apagar o embrulho `ClassPanelPage`/`TeacherPanelPage` que monta a lista; rotas em `routes.ts` e `App.tsx` — cobre CA3, CA5, CA11, CA12 — prova: `npm test -- src/features/classes src/features/teachers src/routes.test.ts`
- [x] T3: Comunicados: fechar a janela da organização mantém os filtros — cobre CA10 — prova: `npm test -- src/features/announcements`

Parte B — Alunos, Cobranças, Planos e ficha

- [x] T4: Alunos: `/alunos/:id` como rota-filha, `StudentRecordPanel` como elemento da rota, fechar sem `aba`/`cobranca`/`pedido`, links com o `search` da lista — cobre CA2, CA3, CA5 — prova: `npm test -- src/features/students/StudentsPage.test.tsx src/features/students/StudentRecordPanel`
- [x] T5: Cobranças: `/cobrancas/:id` como rota-filha com `ChargePanelPage`, redirecionamento de `?cobranca=`; ajustar `e2e/pagamento.spec.ts` — cobre CA3, CA5, CA6 — prova: `npm test -- src/features/charges/ChargesPage.test.tsx src/features/charges/ChargePanel.test.tsx`
- [x] T6: Planos: consulta do plano desativado em `/planos/:id`; cobrança da ficha do aluno em `?cobranca=` — cobre CA5, CA7 — prova: `npm test -- src/features/plans src/features/students/StudentFinancialTab`

Parte C — abas, E2E e fechamento

- [x] T7: `useTabParam` e abas em `?aba=` na ficha do aluno, Configurações › Unidade, Minha conta, Termos e histórico do portal; apagar o estado de aba em memória — cobre CA8, CA9, CA12 — prova: `npm test -- src/components/ui src/features/units src/features/account src/features/terms src/features/portal src/features/students/StudentRecordPanel`
- [x] T8: E2E `@critical` de Alunos, Turmas, Professores e Cobranças (filtrar, abrir, fechar, sem nova listagem, voltar, F5, link para a mesma lista com outro filtro) e E2E das abas (ficha, Unidade, Minha conta) — cobre CA2, CA3, CA4, CA5, CA8 — prova: `npm run e2e -- e2e/estado-no-endereco.spec.ts e2e/minha-conta.spec.ts e2e/configuracao-unidade.spec.ts`
- [x] T9: Conferência final: busca por `window.history`/`window.location`, `lint`, `typecheck`, `test:cov` (100% em `charges`), quatro estados, 360 px, axe e `test:visual:docker -- -g "<caso>"` sem `--update-snapshots` dos casos das telas mexidas, registrando `Visual do CI: <caso> → passou/falhou` — cobre CA1, CA13 — prova: `npm run lint && npm run typecheck && npm run test:visual:docker -- -g "<caso>"`

## 6. Decisões

- D1: `useQueryParams` fica, como camada fina sobre `useSearchParams`, com a mesma API (`get`, `set`, `clear`). Motivo: 8 telas e o `QueryPage` já o usam; trocar a implementação resolve os dois mecanismos de uma vez com o menor diff. Alternativa descartada: apagar o hook e usar `useSearchParams` direto em cada tela.
- D2 (muda o comportamento): Planos ganha endereço só na consulta do plano desativado (`/planos/:id`, painel de registro). Editar, criar e desativar continuam janelas de ação em estado, como a issue permite ("salvo quando for só uma janela de ação"). Alternativa: endereço também para a edição; descartada por ser formulário.
- D3: Parâmetros que só valem para o painel (`aba`, `cobranca`, `pedido`) saem ao fechar; todos os outros (filtros, `pagina`, `ordem`, `tamanho`, `q`) ficam. Motivo: a lista não tem esses parâmetros e fechar não pode levar lixo de um registro.
- D4 (muda o comportamento): a cobrança aberta na ficha do aluno usa `?cobranca=<id>` na própria ficha (com `?aba=financeiro`), não uma rota-filha da ficha. Motivo: a ficha já é o painel e o `ChargePanel` abre sobre ele; uma terceira camada de `<Outlet />` pede mais mudança sem ganho. Alternativa: `/alunos/:id/cobrancas/:chargeId`.
- D5 (muda o comportamento): formato único de aba: `?aba=<id>` (não segmento de rota). Motivo: Minha conta já usa; não exige rota por aba nem mexe no mapa; vale para gestão e portal. A troca de aba usa `replace`, para o voltar não percorrer as abas e sim fechar o painel ou sair da tela. Alternativa: segmento de rota (`/conta/sessoes`), descartada por multiplicar rotas.
- D6: ao fechar painel o `navigate` acrescenta entrada ao histórico (não `replace`). Motivo: simples e previsível; "voltar" depois de F5 direto no painel sai da tela, o que é o esperado.
- Suposição: `GET /plans/{id}` devolve os campos de que a consulta precisa (hoje o drawer recebe a linha da lista e lê `usePlanDetail`); se faltar algum campo no detalhe, a T6 mostra o que falta e o contrato muda junto (OpenAPI, MSW), o que o AGENTS.md permite se não contrariar a especificação.
- Suposição: a ordem de ranking do React Router faz `/alunos/nova-matricula`, `/cobrancas/previa` e `/planos/lista` vencerem `:id`; se não, a T2/T4 reordena no mapa.

## Construção

Partes A, B e C feitas (T1 a T9).

- T1 — arquivos: `frontend/src/components/query/useQueryParams.ts` (reescrito sobre `useSearchParams`, `set`/`clear` estáveis e com o endereço mais novo em `ref`, para duas chamadas seguidas somarem), `QueryPage.test.tsx` (MemoryRouter + `LocationProbe`, caso novo do `Link` para a mesma lista), `src/test/location.tsx` (novo, só de teste) — prova: `npx vitest run src/components/query` → 36 passaram
- T2 — arquivos: `routes.ts` (`parent` em `classPanel` e `teacherPanel`), `App.tsx`, `classes/ClassesPage.tsx` e `teachers/TeachersPage.tsx` (`<Outlet />`, links e clique da linha levam o `search`), `classes/ClassPanel.tsx` e `teachers/TeacherPanel.tsx` (renomeados de `*PanelPage`, só o painel; fecham com `useListTo`), `components/query/useListTo.ts` (novo: endereço da lista sem `aba`/`cobranca`/`pedido`), testes `ClassPanel.test.tsx`, `TeacherPanel.test.tsx`, `ClassesPage.test.tsx` e `TeachersPage.test.tsx` (casos novos: abrir/fechar mantém o filtro, sem nova listagem, voltar fecha o painel) — prova: `npx vitest run src/features/classes src/features/teachers src/routes.test.ts` → passaram
- T3 — arquivos: `announcements/OrganizationAnnouncementDialog.test.tsx` (caso novo), `AnnouncementsPage.test.tsx` — o código não mudou: com o roteador como única fonte (T1), o `setQuery` que tira `novo` já preserva os filtros — prova: `npx vitest run src/features/announcements` → 59 passaram
Regressão: `npx vitest run` (frontend inteiro) → 272 arquivos, 2794 testes passaram; `npm run lint` → sem erros; `npx tsc --noEmit` → sem erros. Não rodaram nesta parte: `test:cov`, `e2e`, `test:visual:docker` (ficam para a T8 e a T9).
Desvios: (1) `ClassPanelPage`/`TeacherPanelPage` foram renomeados para `ClassPanel`/`TeacherPanel` (CA12 pede que os nomes antigos não existam) e os testes seguiram, em vez de apagados, para manter a cobertura do painel. (2) Testes que liam `window.location`/`window.history` (Turmas, Professores, Comunicados, Alunos, `ChargePanel`) passaram a ler o roteador por `src/test/location.tsx`, porque o `useQueryParams` não escreve mais em `window.history` (necessário pela T1). (3) `set` não usa só a forma funcional do `setSearchParams`: no React Router 7 duas chamadas seguidas perdiam a primeira (trocar modalidade e limpar nível); o hook guarda o endereço mais novo numa `ref`.
Referências visuais: nenhuma regerada nesta parte (sem mudança visual).
Não é do item: nenhum.

### Parte B (T4 a T6)

- T4 — arquivos: `routes.ts` (`students` vira `/alunos`; nova `studentRecord` `/alunos/:id` com `parent`), `App.tsx`, `notifications/notificationActions.ts` (`hrefOf("studentRecord")`), `students/StudentsPage.tsx` (sem `useParams`/painel; `<Outlet context={{ reload }}>`), `students/StudentRecordPanel.tsx` (novo `StudentRecordPage`, elemento da rota: lê `id`, fecha com `useListTo("/alunos")`, recarrega a lista pelo contexto; `StudentRecordPanel` fica como gaveta, usada também pela `TeacherRecordPage`), testes `StudentsPage.test.tsx` (caso novo: link leva o `search`, abrir e fechar mantém filtro e página, sem nova listagem, voltar fecha), `StudentRecordPanel.test.tsx`, `StudentEditDialog.test.tsx`, `StudentFinancialTab.test.tsx` (rota `/alunos/:id`), `routes.test.ts` (estática vence `:id`) — prova: `npx vitest run src/features/students src/routes.test.ts` → passaram
- T5 — arquivos: `routes.ts` (`chargePanel` `/cobrancas/:id`), `App.tsx`, `charges/ChargePanelPage.tsx` (novo), `charges/ChargesPage.tsx` (`<Outlet context={{ reload }}>`, abrir é `navigate` com os filtros, `?cobranca=` redireciona para `/cobrancas/<id>` com os demais parâmetros), `charges/ChargePanel.test.tsx` (casos novos: filtro mantido, sem nova listagem, voltar fecha; redirecionamento do endereço antigo), `components/layout/shell.test.ts` (`ChargePanelPage` é gaveta, como as outras), `e2e/pagamento.spec.ts` (abre `/cobrancas/<id>`) — prova: `npx vitest run src/features/charges` → passaram (o e2e fica para a T8)
- T6 — arquivos: `routes.ts` (`planPanel` `/planos/:id`), `App.tsx`, `plans/PlanInspectDrawer.tsx` (recebe `id` e lê `usePlanDetail`; novo `PlanPanelPage`, elemento da rota), `plans/PlansPage.tsx` (`<Outlet context={{ reload, showOtherUnits }}>`; linha do plano desativado navega para `/planos/<id>`), `i18n/pt-BR.json` (`plans.inspect.title`, título enquanto o detalhe carrega), `plans/PlanInspectDrawer.test.tsx`, `plans/PlansPage.test.tsx` (caso novo: `/planos/p5` abre a consulta e fechar volta a `/planos`), `students/StudentFinancialTab.tsx` (cobrança aberta em `?cobranca=` pelo roteador) e seu teste (voltar fecha só a cobrança) — prova: `npx vitest run src/features/plans src/features/students/StudentFinancialTab` → passaram
Regressão (parte B): `npx vitest run` (frontend inteiro) → 272 arquivos, 2803 testes passaram; `npm run lint` e `npm run typecheck` sem erros. Uma execução anterior teve `EnrollmentWizardPage.test.tsx` (CA1 a CA3) falhando só sob carga; isolado e na rodada seguinte passou (instável, não é do item). Não rodaram nesta parte: `test:cov`, `e2e`, `test:visual:docker` (T8 e T9).
Desvios (parte B): (1) `StudentRecordPanel` não virou o elemento da rota, como o plano dizia: ficou como gaveta (a `TeacherRecordPage` a usa com `id` e `onClose`) e o elemento da rota é o novo `StudentRecordPage`, no mesmo arquivo. (2) O painel de plano usa `usePlanDetail` (o detalhe estende `PlanRow`, sem mudar contrato); um id inexistente mostra o estado de erro com "tentar de novo", não "não encontrado" (o hook só distingue 403): ajuste do 404 fica para a T9 se o dono quiser. (3) A aba continua em `useState` na ficha até a T7; por isso `?aba=financeiro` ainda não acompanha `?cobranca=` (CA7 completo na T7).
Referências visuais: nenhuma regerada nesta parte (sem mudança visual pedida; `test:visual:docker` na T9).
Não é do item: nenhum.

### Parte C (T7 a T9)

- T7 — arquivos: `components/ui/useTabParam.ts` (novo: `[aba, setAba]` sobre `?aba=`, valida contra os ids, troca com `replace` e só mexe em `aba`) e `useTabParam.test.tsx`; `students/StudentRecordPanel.tsx` (aba da ficha em `?aba=resumo|matricula|financeiro|graduacoes|responsaveis|historico`; `?pedido=` sem `aba` abre em matrícula; `useState` da aba apagado), `units/UnitSettingsPage.tsx` (aba em `?aba=`; o foco do Enter com erro espera a aba Dados abrir, porque trocar de aba agora é navegação), `terms/TermsPage.tsx`, `account/AccountPage.tsx` (usa o hook; troca deixou de apagar os outros parâmetros e de acrescentar histórico), `portal/PortalFinancePage.tsx` (o ano do histórico passou de `?ano=` para `?aba=`); testes ajustados em `StudentFinancialTab.test.tsx`, `PortalFinancePage.test.tsx`, `e2e/portal-finance.spec.ts` e casos novos em `StudentRecordPanel.test.tsx` e `UnitSettingsPage.test.tsx` — prova: `npx vitest run src/components/ui src/features/units src/features/account src/features/terms src/features/portal src/features/students` → passaram
- T8 — arquivos: `e2e/estado-no-endereco.spec.ts` (novo: Alunos filtro/painel/aba/voltar e sem nova listagem; Turmas e Professores abrir/voltar mantendo o filtro; Cobranças `?cobranca=` → `/cobrancas/<id>`; abas de Minha conta e Unidade sem histórico) — prova: `npx playwright test e2e/estado-no-endereco.spec.ts e2e/minha-conta.spec.ts e2e/configuracao-unidade.spec.ts e2e/portal-finance.spec.ts e2e/pagamento.spec.ts` → 13 passaram
- T9 — `grep window.history|window.location` em `src` fora de testes e de `src/test/` → nenhuma ocorrência; `npm run lint` e `npm run typecheck` sem erros; `npm run test:cov` → 273 arquivos, 2809 testes passaram, limites de cobertura atendidos (inclui 100% em `charges`).
Visual do CI: `ficha-aluno*`, `aluno-*`, `pedido-trocar-turma`, `alunos*`, `turmas`/`turma-*`, `professores`/`professor-*`, `comunicados*`, `planos*`, `cobrancas*`, `configuracoes-unidade*`, `configuracoes-termos`, `conta*`, `portal-financeiro` → passou (272 execuções, `npm run test:visual:docker -- -g "<casos>"` sem `--update-snapshots`).
Regressão: `npm run test:cov` (frontend inteiro) verde. Uma primeira execução teve `RecordEnrollment.test.tsx` (CA7) falhando só sob carga; isolado (16 passaram) e na rodada seguinte passou (instável, não é do item). Não rodaram: back-end (sem mudança), `e2e:full`.
Desvios (parte C): (1) o ano do histórico do portal já estava no endereço (`?ano=`); passou a `?aba=` para valer o formato único da D5. (2) Termos usa os ids da API (`?aba=ENROLLMENT`) e Unidade os ids da aba (`?aba=payments`); a ficha e Minha conta usam nomes em português. (3) O E2E não aperta F5: a sessão simulada (MSW) vive na aba e se perderia; a leitura do endereço ao abrir está nos testes de tela (`?aba=` válida e inválida na ficha e na Unidade; Minha conta já tinha).
Referências visuais: nenhuma regerada (sem mudança visual).
Não é do item: nenhum.

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-21, estado 86e916c025e7534629cc9d3fa8798ef14e7779ae

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `grep window.history|window.location` em `src` fora de testes e `src/test/`: nenhuma ocorrência; `QueryPage.test.tsx` passa |
| CA2 | PASSOU | `StudentsPage.test.tsx` (abrir/fechar mantém filtro e página); E2E Alunos passou; F5 só por teste de tela |
| CA3 | PASSOU (parcial no E2E) | testes de tela contam listagens em Alunos, Turmas, Professores, Cobranças; E2E só conta listagem em Alunos |
| CA4 | PASSOU | `QueryPage.test.tsx` (Link para a mesma lista com outro filtro) |
| CA5 | PASSOU | testes de tela de painel; E2E de voltar em Alunos, Turmas, Professores; F5 sem E2E |
| CA6 | PASSOU | `ChargePanel.test.tsx` e E2E `?cobranca=` → `/cobrancas/<id>?status=OVERDUE` |
| CA7 | PASSOU | `StudentFinancialTab.test.tsx` (voltar fecha só a cobrança) |
| CA8 | PASSOU | testes de tela com `?aba=` válida e inválida (ficha, Unidade, Minha conta) |
| CA9 | PASSOU | E2E de abas (sem histórico) |
| CA10 | PASSOU | `OrganizationAnnouncementDialog.test.tsx` |
| CA11 | PASSOU | PlanInspectDrawer: id inexistente mostra erro com "tentar de novo", não "não encontrado" (desvio registrado, só 403 distinguido); Turmas/Professores mantêm os estados |
| CA12 | PASSOU | `ClassPanelPage`/`TeacherPanelPage` não existem; sem `useState` de aba na ficha |
| CA13 | PASSOU | `test:visual:docker -- -g "turmas|professores|ficha-aluno|conta|planos|cobrancas|alunos|configuracoes-unidade"` → 156 passaram sem `--update-snapshots` |

Comandos: `npm run lint` e `npm run typecheck` sem erros; `npx vitest run --maxWorkers=2` → 273 arquivos, 2809 testes passaram; `npx playwright test` dos specs estado-no-endereco, minha-conta, configuracao-unidade, portal-finance e pagamento → 13 passaram; visual acima. Não rodei `test:cov` nem `e2e:full` (builder registrou verde).
Instáveis: nenhum nesta rodada.
Achados:
- obrigatório, código, `frontend/e2e/estado-no-endereco.spec.ts` — esperado ("Pronto quando" da issue): E2E `@critical` em Alunos, Turmas, Professores e Cobranças com filtrar, abrir, fechar, sem nova listagem; E2E de voltar com painel e F5 com painel reabrindo o registro; E2E de `Link` para a mesma lista com outro filtro; E2E de F5 em aba da ficha, Unidade e Minha conta; observado: só Alunos cobre filtro/abrir/fechar/sem nova listagem; Turmas e Professores só abrem e voltam; Cobranças só testa o redirecionamento; nenhum E2E aperta F5 nem testa o Link para a mesma lista (o arquivo declara que F5 fica fora porque a sessão MSW vive na aba); evidência: leitura do spec; corrigir: completar os E2E (permitir F5, por exemplo guardando a sessão simulada de forma que sobreviva ao reload no E2E, ou registrar a limitação com o dono se não for viável) ou ajustar o card/especificação pelo caminho do `especificar --ajustar`.
- sugestão, código, `PlanInspectDrawer.tsx` — id de plano inexistente mostra erro genérico, não "não encontrado" (CA11).
- sugestão, código, `e2e/estado-no-endereco.spec.ts` — título "rota-filhae" (falta espaço).

### Correção da rodada 1

- achado obrigatório (E2E `@critical` incompleto, sem F5 nem sem-nova-listagem em Turmas, Professores e Cobranças) — arquivos: `frontend/e2e/estado-no-endereco.spec.ts` (reescrito: Alunos, Turmas e Professores com filtro, abrir, F5 reabrindo o mesmo registro, fechar sem nova listagem, voltar e avançar; Turmas com o `Link` "Ver todos os alunos" para `/alunos?classId=`; Cobranças com filtro, abrir, fechar sem nova listagem, voltar e redirecionamento de `?cobranca=`; abas de Minha conta e Unidade com F5 e sem histórico), `frontend/src/mocks/handlers.ts` (`restoreMockLogin` e `rememberLogin`: o login simulado fica no `sessionStorage` e sobrevive ao F5; `resetMockSession` e o logout o apagam), `frontend/src/mocks/browser.ts` (`installE2eHook` chama `restoreMockLogin`) — prova: `npx playwright test e2e/estado-no-endereco.spec.ts` → 5 passaram; `e2e/minha-conta`, `configuracao-unidade`, `portal-finance`, `pagamento`, `login`, `sair-da-conta` → 26 passaram; `npm run lint` e `npm run typecheck` sem erros
- sugestão atendida: título "rota-filhae" corrigido.
Desvios: (1) Cobranças ficou sem F5 no E2E: a cobrança nasce de matrícula feita na sessão simulada e os dados do MSW não sobrevivem ao reload (só o login sobrevive); o F5 de cobrança segue provado por teste de tela. (2) O "Link para a mesma lista com outro filtro" no E2E usa o "Ver todos os alunos" da turma (lista de alunos); o caso da mesma lista já aberta está em `QueryPage.test.tsx`. (3) Sugestão de "não encontrado" no plano (`PlanInspectDrawer`) não feita: opcional.
Referências visuais: nenhuma regerada (só E2E e mock de sessão, sem mudança visual).
Não é do item: nenhum.

### Rodada 2 — OK — 2026-11-21, estado 10a1a16a8ae21614c4a1a56c53970750a212333a

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | sem `window.history`/`window.location` em `src` fora de testes, `src/test/` e `main.tsx`; vitest verde |
| CA2 a CA11 | PASSOU | testes de tela (mantidos da rodada 1) e E2E `estado-no-endereco.spec.ts` agora com filtro, abrir, F5 reabrindo, fechar sem nova listagem, voltar/avançar em Alunos, Turmas e Professores; Link "Ver todos os alunos"; abas de Minha conta e Unidade com F5 e sem histórico; Cobranças sem F5 no E2E (MSW perde os dados no reload), coberto por teste de tela |
| CA12 | PASSOU | mantido da rodada 1 |
| CA13 | PASSOU | mantido da rodada 1: o diff desde a rodada 1 é só E2E e mock (`restoreMockLogin` só em `installE2eHook`), sem mudança visual |

Comandos: `npm run lint` e `npm run typecheck` sem erros; `npx vitest run --maxWorkers=2` → 2809 testes passaram; `npx playwright test` (estado-no-endereco, minha-conta, configuracao-unidade, portal-finance, pagamento) → 13 passaram. Não rodei `test:cov` nem `e2e:full`.
Instáveis: nenhum.
Achados:
- achado obrigatório da rodada 1 (E2E incompleto): resolvido, com a ressalva de Cobranças sem F5 (limite do MSW, aceito).
- sugestão, código, `PlanInspectDrawer.tsx` — "não encontrado" para plano inexistente (mantida).

## Entrega

- O que muda: o endereço passa a ser a única fonte do estado de tela (filtros, busca, página, ordem, tamanho, painel aberto e aba). `useQueryParams` é uma camada fina sobre `useSearchParams`; `useTabParam` lê e grava `?aba=` (ficha do aluno, Configurações › Unidade, Minha conta, Termos e histórico do portal); painéis de aluno, turma, professor, cobrança e plano abrem por rota-filha; a ficha do aluno é `StudentRecordPage`; `ClassPanelPage` e `TeacherPanelPage` viram `ClassPanel` e `TeacherPanel`.
- Verificação: rodada 2 `OK` (estado `10a1a16a8ae21614c4a1a56c53970750a212333a`). `lint` e `typecheck` sem erros; vitest com 2809 testes passando; Playwright dos specs de estado no endereço, minha conta, unidade, portal, pagamento com 13 passando; visual sem `--update-snapshots` em 156 execuções (rodada 1), sem mudança visual na rodada 2.
- Decisões: id de plano inexistente mostra o estado de erro com "tentar de novo", não "não encontrado" (o hook só distingue 403); ajuste do 404 fica para depois, se o dono quiser.
- Limitações: no E2E de Cobranças não há F5, porque a cobrança nasce de matrícula na sessão simulada e o MSW perde os dados no reload; o F5 de cobrança é coberto por teste de tela. O E2E do `Link` para a mesma lista usa "Ver todos os alunos" da turma; o caso da lista já aberta está em `QueryPage.test.tsx`.
- Regressão: não rodada nesta entrega (base sem avanço desde a verificação); `test:cov` e `e2e:full` não rodados na verificação.
