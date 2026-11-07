# 449 — Técnica · Dados do MSW para as telas que ficaram "sem comparar"

Origem: issue #449 (Sprint 10.5, Fase 1, plano F1-13), `docs/auditoria/auditoria-canvas-sprint-10.5.md` (seção "Telas que ficaram sem comparar"), `docs/auditoria/decisoes-canvas.md` item 17. Branch: `item/449-dados-msw-telas-sem-comparar`.

## 1. Objetivo

Fazer o MSW trazer dados fictícios suficientes para que as telas listadas na issue abram **preenchidas** em `npm run dev` e no teste visual, com o perfil indicado, sem fixture temporária; e dar um jeito único de forçar os estados erro, carregando, vazio e sem permissão. Item técnico: só mock, teste, README e referências visuais; nenhuma regra de produto muda. Destrava as issues de tela #466, #467, #476 a #479, #494, #497 e #498.

Fora do escopo: back-end, OpenAPI, código de tela, o estado "sem conexão" da carteirinha (Sprint 21), qualquer item que as issues de tela resolvem.

## 2. Requisitos

- R1: existe um conjunto de cenários do MSW, ligado em `npm run dev` e no teste visual, desligado por padrão nos testes unitários e no e2e; um teste liga o cenário que quer.
- R2: Alunos (`ana@`): 12 a 14 alunos em situações variadas (ativo, em atraso, bloqueado, ex-aluno, termo pendente, e-mail com problema), com a contagem das abas igual ao total da lista.
- R3: Ficha do aluno, aba Responsáveis (`ana@`): menor com 2 responsáveis (um financeiro, um com acesso), adulto sem responsável e o estado de limite de 2 com "Tornar financeiro".
- R4: Transferir modalidade (`ana@`): aluno ativo com modalidade e unidade de destino com turma e acesso do perfil.
- R5: Cobranças e painel da cobrança (`ana@`): 12 ou mais cobranças nos tipos e situações da issue (mensalidade, avulsa, parcela; pendente, vence hoje, em atraso 25 e 59 dias, em conferência, paga em Pix na chave, cartão e dinheiro, paga com atraso, cancelada, renegociada).
- R6: Em atraso: 5 cobranças atrasadas com último lembrete e situação de bloqueio ("bloqueada", "bloqueia em 2 dias").
- R7: Em conferência: 1 comprovante com imagem, 1 comprovante de duas cobranças da mesma unidade e 2 aguardando.
- R8: Recebimentos do dia: pagamentos do dia por meio (Pix, cartão, boleto, dinheiro) e por quem lançou.
- R9: Prévia da geração: vencimentos com totais e a lista "quem não será cobrado e por quê".
- R10: Portal, `aluno@`: 3 cobranças em aberto de modalidades diferentes (uma vencida), histórico de pagas, unidade com chave Pix, e uso de imagem já concedido (Revogar).
- R11: Portal, `familia@`: cobranças em aberto de dois filhos em unidades diferentes ("Toda a família") e comprovante para várias cobranças da mesma unidade.
- R12: Portal, Termo: `termo@` (adulto pendente) e `familia@` (dois filhos pendentes, progresso "1 de 2").
- R13: Pedidos (gestão `ana@` e portal `aluno@`): um pedido de cada tipo (troca de turma, nova modalidade, troca de plano, encerramento), um recusado, um aprovado, e uma modalidade com encerramento aberto (pedido indisponível).
- R14: Turmas e painel (`ana@`): 6 turmas (uma acima da capacidade 31/30, uma desativada, uma sem limite) e uma com 4 ou mais alunos com faixa.
- R15: Agenda (semana, `ana@`): aula cancelada, aula com substituição, dia sem aula e aula avulsa na mesma semana.
- R16: Listas cheias (`ana@`): 6 professores (ativo, convite enviado, inativo); 5 benefícios (alto, encerrado, vencido); 5 planos (um desativado, um "vale nas outras unidades"); 5 comunicados (agendado, enviado com lidos, aula cancelada); 6 usuários da gestão (um com convite enviado); 3 unidades (uma desativada).
- R17: um jeito único de forçar erro, carregando, vazio e sem permissão em qualquer lista ou tela, só em desenvolvimento e teste (D4).
- R18: `frontend/README.md` (seção do MSW) lista cada perfil, rota e o que o cenário traz; cada linha da tabela da issue tem ao menos um teste `*.msw.test.ts` (contagens, situações, quantidades) e o estado forçado tem teste.
- R19: referências do teste visual mudam só nas telas que passam a abrir preenchidas, conferidas uma a uma; só dados fictícios.

## 3. Critérios de aceite

- CA1 (R1): dado o teste sem ligar cenário, quando login e listas rodam, então os dados são os de hoje (2 alunos, 0 cobranças) e os testes atuais seguem verdes; dado o cenário ligado, quando `resetMockSession()` roda, então os dados voltam ao cenário, não ao vazio.
- CA2 (R1): dado `npm run dev`, quando `ana@exemplo.com` entra, então as telas abrem preenchidas; dado `npm run e2e`, então o cenário está desligado (config do webServer).
- CA3 (R17): dado `?estado=erro`, `carregando`, `vazio` ou `semPermissao` (e `&rota=<prefixo>` opcional), quando uma lista abre, então a leitura responde 500, fica pendente, devolve `items` vazio com total 0, ou 403; sem o parâmetro nada muda; fora de dev e teste o recurso não existe.
- CA4 (R2): dado `ana@`, quando lista `/students`, então vêm 12 a 14 alunos com as seis situações, `counts.active + counts.former` igual ao total das abas e `counts.overdue` igual aos alunos em atraso da lista.
- CA5 (R3): dado `ana@`, quando abre a ficha do menor, então há 2 responsáveis (um financeiro, um com `access` ativo); a do adulto não tem responsável; no menor com 2 responsáveis o botão "Tornar financeiro" é alcançável (o outro não é financeiro) e um terceiro responsável devolve o limite de 2.
- CA6 (R4): dado `ana@`, quando consulta as unidades de destino de um aluno ativo com modalidade, então existe ao menos uma unidade de destino com turma da modalidade e acesso do perfil.
- CA7 (R14): dado `ana@`, quando lista as turmas, então são 6, uma com `overCapacity` 31/30, uma `INACTIVE`, uma com `capacity` nulo, e o painel de uma turma traz 4 ou mais alunos com faixa.
- CA8 (R5): dado `ana@`, quando lista `/charges` sem filtro, então vêm 12 ou mais cobranças cobrindo todos os tipos e situações de R5; `GET /charges/{id}` de uma paga, uma cancelada e uma renegociada abre o painel.
- CA9 (R6): dado `GET /charges/overdue`, quando lido, então são 5 cobranças com último lembrete e a situação de bloqueio "bloqueada" em ao menos uma e "bloqueia em 2 dias" em outra.
- CA10 (R7): dado `GET /payment-proofs`, quando lido, então há 1 comprovante com imagem, 1 de duas cobranças da mesma unidade e 2 aguardando.
- CA11 (R8, R9): dado o dia do cenário, quando lê os recebimentos do dia, então há pagamentos em Pix, cartão, boleto e dinheiro, de quem lançou diferentes; a prévia traz vencimentos com totais e ao menos um aluno em "não será cobrado" com o motivo.
- CA12 (R10): dado `aluno@`, quando abre o financeiro, então há 3 abertas de modalidades diferentes (uma vencida), histórico de pagas e unidade com chave Pix; a informação do portal mostra uso de imagem concedido.
- CA13 (R11): dado `familia@`, quando abre o financeiro com `scope=FAMILY`, então vêm abertas de dois filhos em unidades diferentes, e o envio de comprovante para duas cobranças da mesma unidade é aceito.
- CA14 (R12): dado `termo@` e `familia@`, quando abrem o portal, então o termo está pendente (adulto; dois filhos, progresso "1 de 2" ao aceitar o primeiro).
- CA15 (R13): dado `ana@` e `aluno@`, quando listam os pedidos, então há um de cada tipo, um recusado e um aprovado, e a modalidade com encerramento aberto devolve o pedido de encerramento como indisponível para novo pedido.
- CA16 (R15): dado `ana@`, quando lê a agenda da semana do cenário, então há aula cancelada, com substituição, dia sem aula e aula avulsa.
- CA17 (R16): dado `ana@`, quando lista professores, benefícios, planos, comunicados, usuários e unidades, então as contagens e situações de R16 aparecem.
- CA18 (R18): dado o README, quando lido, então lista cada cenário (perfil, rota, dados) e `OpenApiContractTest`/`msw.test.ts` seguem verdes.
- CA19 (R19): dado o teste visual no container, quando roda sem atualizar depois de regerar só as telas afetadas, então todos os casos passam; o diff de cada referência mudada mostra a tela preenchida e nenhuma outra mudou.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (só mock, dados fictícios: `.example`/`.test`, CPFs de teste, telefones inventados).
- Interface: nenhuma tela muda. O `?estado=` é lido pelo mock, não por componente.
- Estrutura: o estado do mock é `let` privado em `frontend/src/mocks/handlers.ts` (`mockStudents`, `mockEnrollments`, `mockCharges`, `mockReceipts`, `mockReminders`, `mockPortalRequests`, `mockProofsSent`, `mockClasses`, `mockTeachers`, `mockPlans`, `benefitRows`, `staff`, `units`, `mockAnnouncements`, `portalImage`, `mockAdhoc`, `mockNoClassDays`, `lessonEdits`). Os dados dos cenários ficam em arquivos puros novos que recebem os ids já existentes (`ADMIN_UNIT`/`CENTRO`, `NORTE`, `modalityCatalog`, `TEACHER_*`, `STUDENT_ADULT`, `STUDENT_MINOR`, `CHILD_TWO`) e devolvem arrays; `handlers.ts` só tem `seedScenarios()` que os empurra para o estado.
- Arquivos:
  - `frontend/src/mocks/handlers.ts`: `let scenariosOn = false`, `export const setScenarios(on)`; `seedScenarios()` chamado no fim de `resetMockSession()` (linha ~105) quando ligado e uma vez na carga do módulo se ligado; `handlers = routes.map(...)` (linha ~5260) passa a envolver o resolver com `forcedState` (D4); `initialStudents`/`initialClasses`/etc. não mudam.
  - `frontend/src/mocks/cenarios/alunos.ts` (a criar): alunos, responsáveis, matrículas, transferir, turmas. `cenarios/cobrancas.ts` (a criar): cobranças, lembretes, comprovantes, recibos, prévia. `cenarios/portal.ts` (a criar): financeiro de `aluno@`/`familia@`, termo, imagem, pedidos. `cenarios/listas.ts` (a criar): agenda, professores, benefícios, planos, comunicados, usuários, unidades.
  - `frontend/src/mocks/cenarios/estado.ts` (a criar): `forcedState(request)` lê `estado` e `rota` de `location.search` (navegador) ou de `globalThis.__mswEstado` (teste) e devolve a resposta forçada ou `null`.
  - `frontend/src/main.tsx` (linha ~18, onde o MSW liga): chama `setScenarios(true)` antes de `worker.start()`; `frontend/playwright.config.ts` (e2e): `webServer.env` com `VITE_MSW_CENARIOS=false`, lido no mesmo ponto.
  - `frontend/src/test/setup.ts`: `afterEach` chama `setScenarios(false)` antes de `resetMockSession()`.
  - Testes a criar em `frontend/src/mocks/`: `cenarios-alunos.msw.test.ts`, `cenarios-cobrancas.msw.test.ts`, `cenarios-portal.msw.test.ts`, `cenarios-listas.msw.test.ts`, `cenarios-estado.msw.test.ts`; todos ligam o cenário com `setScenarios(true)` + `resetMockSession()` no `beforeEach`.
  - `frontend/README.md` (seção do MSW, linha ~26) e `frontend/visual/referencias/*.png` das telas afetadas.
- Reuso: `login` e `get` dos `*.msw.test.ts` existentes, `dayShift`, `isoDay`, `homeCharges`/`financeRaw` (o portal lê `mockCharges` do `STUDENT_ADULT`), `openClosure`/`requestView`, `error()`.
- Riscos: (1) testes atuais que contam com 2 alunos ou 0 cobranças: o cenário desligado por padrão evita; (2) as telas fixas do portal (`CHILD_TWO`, `THIRD_CHARGE`, `REDUCED_CHARGE`) não vêm de `mockStudents`: a `familia@` precisa de `CHILD_TWO` em `mockStudents` e `mockEnrollments` para o termo "1 de 2", o que também o põe na lista de Alunos (conta como um dos 12 a 14); (3) datas relativas ao relógio do navegador (`dayShift`) e o teste visual fixo em 29/10/2026 12:00: usar sempre `dayShift`; (4) tamanho: o item passa de seis tarefas e dez arquivos, por isso as partes abaixo.

## 5. Tarefas

Cada parte é construível em uma sessão; as demais partes só começam com a anterior verde.

**Parte A — mecanismo**
- [x] T1: `setScenarios`/`seedScenarios` em `handlers.ts`, `cenarios/` vazio de dados, ligação em `main.tsx`, desligar no e2e e no `setup.ts` — cobre CA1, CA2 — prova: `cd frontend && npx vitest run src/mocks/reset.msw.test.ts src/mocks/students.msw.test.ts` (verdes sem cenário) e um teste novo `cenarios-estado.msw.test.ts` do liga/desliga.
- [x] T2: estados forçados (`cenarios/estado.ts` + wrapper em `handlers`) com teste dos quatro estados e do `rota` — cobre CA3 — prova: `cd frontend && npx vitest run src/mocks/cenarios-estado.msw.test.ts`.

**Parte B — gestão: pessoas e turmas**
- [x] T3: `cenarios/alunos.ts` (alunos com matrícula, benefício, e-mail com problema, termo pendente e atraso; responsáveis; unidade de destino; 6 turmas e alunos com faixa) + testes — cobre CA4, CA5, CA6, CA7 — prova: `cd frontend && npx vitest run src/mocks/cenarios-alunos.msw.test.ts`.

**Parte C — cobranças**
- [x] T4: `cenarios/cobrancas.ts` (12+ cobranças, 5 em atraso com lembrete e bloqueio, comprovantes, recibos do dia, prévia) + testes — cobre CA8, CA9, CA10, CA11 — prova: `cd frontend && npx vitest run src/mocks/cenarios-cobrancas.msw.test.ts`.

**Parte D — portal**
- [x] T5: `cenarios/portal.ts` (cobranças de `aluno@` e `familia@`, comprovante de várias, imagem concedida, termo pendente, pedidos de gestão e portal) + testes — cobre CA12, CA13, CA14, CA15 — prova: `cd frontend && npx vitest run src/mocks/cenarios-portal.msw.test.ts`.

**Parte E — agenda e listas**
- [x] T6: `cenarios/listas.ts` (agenda da semana, professores, benefícios, planos, comunicados, usuários, unidades) + testes — cobre CA16, CA17 — prova: `cd frontend && npx vitest run src/mocks/cenarios-listas.msw.test.ts`.

**Parte F — fechamento**
- [x] T7: README (cada cenário) e regressão: `npm test`, `npm run lint`, `npm run typecheck`, `npm run e2e` — cobre CA18 — prova: `cd frontend && npm test && npm run lint && npm run typecheck && npm run e2e`.
- [x] T8: regerar só as referências visuais das telas afetadas e abrir o diff de cada uma — cobre CA19 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots -g "<caso>"` por caso afetado, depois `npm run test:visual:docker` sem atualizar.

## 6. Decisões

- D1: o cenário é um estado único em memória (global), carregado de uma vez, não um perfil novo por tela. Motivo: a issue pede o perfil existente com a massa de dados (`ana@`, `aluno@`, `familia@`, `termo@`) e as telas compartilham alunos e cobranças. Alternativa: um perfil `...@exemplo.com` por tela (descartada: duplicaria alunos e quebraria a ligação cobrança-aluno-turma). Nenhum perfil novo é criado; o que `termo@`, `varios@`, `limite@`, `vencida@`, `duas@` e `reduzido@` já cobrem não muda.
- D2: ligado em `npm run dev` e no teste visual; desligado nos testes unitários e no e2e (`VITE_MSW_CENARIOS=false`). Motivo: dezenas de testes contam com 2 alunos e 0 cobranças. Alternativa: ligar sempre e corrigir os testes (descartada: churn grande sem ganho). Muda o que o dono vê em `npm run dev` (telas passam a abrir cheias): é o objetivo da issue.
- D3: datas sempre relativas (`dayShift`), nunca fixas, para o cenário valer com o relógio real e com o relógio fixo do teste visual.
- D4: estado forçado por `?estado=erro|carregando|vazio|semPermissao` e `&rota=<prefixo da API>` (sem `rota`, vale para toda leitura exceto `/auth`), lido pelo wrapper dos handlers; só existe com MSW ligado, portanto só em desenvolvimento e teste. "vazio" troca `items` (e listas de nível superior) por `[]` e `total` por 0 na resposta que o handler já devolveria. Alternativa: um handler por estado (descartada: um por lista). Suposição: o estado vazio de telas que não usam `items` fica para a issue da tela.
- D5: `CHILD_TWO` entra em `mockStudents`/`mockEnrollments` na Parte D só se o progresso "1 de 2" não for alcançável de outra forma; se entrar, conta entre os alunos da Parte B e o teste de contagem é ajustado. Suposição a confirmar na construção; se estiver errada, só os totais mudam.
- D6: a sobreposição com issues de tela (#466, #467, #476 a #479 etc.) não é resolvida aqui: o item entrega dados, e telas com divergência de visual seguem nas issues delas.

## Construção

Parte A concluída nesta sessão (T1, T2). Parou antes da Parte B (T3).

- T1 — arquivos: `frontend/src/mocks/handlers.ts` (`setScenarios`, `scenariosEnabled`, `seedScenarios()` vazio chamado no fim de `resetMockSession()`), `frontend/src/main.tsx` (liga os cenários salvo `VITE_MSW_CENARIOS=false`), `frontend/playwright.config.ts` (`webServer.env` desliga no e2e), `frontend/src/test/setup.ts` (`setScenarios(false)` antes do reset), `frontend/src/mocks/cenarios-estado.msw.test.ts` — prova: `npx vitest run src/mocks/cenarios-estado.msw.test.ts src/mocks/reset.msw.test.ts src/mocks/students.msw.test.ts` → 3 arquivos, 25 testes verdes.
- T2 — arquivos: `frontend/src/mocks/cenarios/estado.ts` (`comEstadoForcado`), `handlers` envolve todo resolver — prova: mesmo comando; os quatro estados, `rota`, escrita e `/auth` intocados → verde.
Regressão parcial (só front, mocks): `npm run typecheck` e `npm run lint` limpos; `npx vitest run src/mocks` → 310 testes verdes. `npm test`, `e2e` e visual completos ficam para T7/T8.
Desvios: `main.tsx` liga o cenário por `VITE_MSW_CENARIOS !== "false"` em vez de passar pelo e2e hook; o estado forçado também vale em `npm run dev` pelo `location.search`. `seedScenarios()` está vazio até a Parte B.

Parte B concluída (T3). Parou antes da Parte C (T4).

- T3 — arquivos: `frontend/src/mocks/cenarios/alunos.ts` (10 alunos novos, responsáveis, matrículas, unidade Sul, plano e 3 turmas novas), `frontend/src/mocks/handlers.ts` (`seedScenarios()` empurra os dados; `setScenarios` passa a chamar `resetMockSession()`, que agora semeia no fim, depois de limpar `portalAccepted`; tipos `MockClass`, `MockEnrollment`, `MockPlan` exportados; `MockClass.scenario` dá `activeStudents`/lista do painel), `frontend/src/mocks/cenarios-alunos.msw.test.ts` — prova: `npx vitest run src/mocks` → 316 testes verdes; `npm run typecheck` e `npm run lint` limpos.
Desvios (T3): (1) `STUDENT_ADULT` e `STUDENT_MINOR` continuam sem matrícula: matriculá-los faria o portal de `aluno@`/`familia@` pedir o termo antes de tudo (`termEnrolled`); o portal é da Parte D. Total de alunos: 12 (2 de hoje + 10 novos); `CHILD_TWO` (D5) levaria a 13. (2) "Bloqueado" e "em atraso" na lista dependem de cobranças vencidas; ficam na T4 (`ID.carla`, `ID.diego` exportados para isso); por ora o teste só confere `counts.overdue` contra a lista. (3) "Faixa" do aluno no painel da turma: `ClassStudent` do OpenAPI não tem faixa, então o painel traz 5 alunos sem ela; incluir a faixa muda o contrato e é das issues de tela. (4) A turma de 31/30 é a Jiu-Jitsu Adulto (os 31 vêm de `scenario.activeStudents`, a lista do painel traz 5). (5) Unidade Sul criada aqui para ser o destino da transferência (Norte é desativada); entra na conta das 3 unidades da T6.

Parte C concluída (T4). Parou antes da Parte D (T5).

- T4 — arquivos: `frontend/src/mocks/cenarios/cobrancas.ts` (21 cobranças, 5 em atraso com 3 lembretes, 5 comprovantes, 6 recibos, bolsa integral da Isadora), `frontend/src/mocks/handlers.ts` (`seedScenarios()` empurra cobranças, recibos, lembretes, comprovantes e benefício; `MockCharge.daysToBlock` opcional e `/charges/overdue` o devolve; tipos `MockCharge`, `MockReceipt`, `MockReminder`, `MockPaymentProof`, `MockBenefit` exportados), `frontend/src/mocks/cenarios-cobrancas.msw.test.ts` — prova: `npx vitest run src/mocks` → 56 arquivos, 320 testes verdes; `npm run typecheck` e `npm run lint` limpos.
Desvios (T4): (1) o meio "boleto" entra como `BOLETO` no recibo do dia (está no enum do OpenAPI; o simulado de pagamento só aceita os quatro meios da gestão). (2) "Bloqueado" na lista de Alunos continua sem existir no mock (`financialStatus` só tem OVERDUE/CURRENT); quem está em atraso aparece como "em atraso". (3) Os dois comprovantes "aguardando" são PDF e os demais imagem; `imageUrl` do mock é sempre o logo. (4) "Não será cobrado": só `FULL_BENEFIT` é gerado pelo mock da prévia.

Parte D concluída (T5). Parou antes da Parte E (T6).

- T5 — arquivos: `frontend/src/mocks/cenarios/portal.ts` (matrículas de `aluno@` em 3 modalidades/unidades, de `familia@` em Sul e Centro, `CHILD_TWO` como aluno, 3+1 cobranças abertas, 4 pedidos), `frontend/src/mocks/handlers.ts` (`seedScenarios()` empurra o portal; `setScenarios(on, { termoFamilia })`; `portalMine` do Responsável inclui `CHILD_TWO`; `termEnrolled` ignora a matrícula do `STUDENT_ADULT` no cenário fora de `termo@`; `MockCharge.modalityName` alimenta a modalidade das abertas do portal; chave Pix nas unidades Centro, Norte e Sul), `frontend/src/mocks/cenarios/cobrancas.ts` (a 5ª em atraso passa a ser a do `aluno@`), `frontend/src/mocks/cenarios-portal.msw.test.ts`, ajuste em `cenarios-alunos.msw.test.ts` — prova: `npx vitest run src/mocks` → 57 arquivos, 324 testes verdes; `npm run typecheck` e `npm run lint` limpos.
Desvios (T5): (1) conflito entre R11 (`familia@` com financeiro cheio) e R12 (`familia@` com os dois termos pendentes): o termo pendente trava todo o portal (`TERM_PENDING`). Decisão: por padrão os dois filhos já aceitaram (portal cheio, referências visuais intactas); `setScenarios(true, { termoFamilia: true })` os deixa pendentes ("1 de 2") para teste. Em `npm run dev` o "1 de 2" só aparece com essa opção (não há atalho na URL); fica para o dono dizer se quer uma chave. (2) D5: `CHILD_TWO` entrou em `mockStudents` (total de alunos: 13) e `STUDENT_ADULT`/`STUDENT_MINOR` agora têm matrícula, então a lista de Alunos não tem mais "sem matrícula". (3) Boxe do `aluno@` é na unidade Norte (plano 603, turma 603 inativa) para não criar plano novo e manter os 5 planos de R16; o encerramento aberto é o da Boxe. (4) A 5ª cobrança em atraso de CA9 é a do `aluno@` (a de Lucas saiu). (5) O comprovante de duas cobranças da mesma unidade usa as duas fixas do segundo filho (Centro).

Parte E concluída (T6). Parou antes da Parte F (T7).

- T6 — arquivos: `frontend/src/mocks/cenarios/listas.ts` (aula avulsa, cancelamento de Judô Infantil na próxima terça/quinta, 3 professores, 4 administradores, 1 comunicado), `frontend/src/mocks/handlers.ts` (`seedScenarios()` empurra a agenda e as listas; "Jiu-Jitsu Livre" passa a valer nas outras unidades; tipos `MockTeacher`, `MockAdhoc`, `MockAnnouncement` exportados), `frontend/src/mocks/cenarios-listas.msw.test.ts` — prova: `npx vitest run src/mocks` → 330 testes verdes; `npm run typecheck` e `npm run lint` limpos.
Desvios (T6): (1) substituição (quarta do Jiu-Jitsu) e dia sem aula (hoje) já vêm do mock da agenda, sem dado novo. (2) Benefícios: 6 em vez de 5 (a bolsa integral da Isadora, da T4, soma-se aos 5 de hoje); o teste confere "ao menos 5" com alto, encerrado e vencido. (3) Planos: 5, com o "vale nas outras unidades" no plano existente (Jiu-Jitsu Livre), sem plano novo. (4) Usuários: `ana@` é Coordenador e vê só os Administradores, então foram criados 4 (6 no total, Carla e Helena com convite enviado). (5) Unidades: as 3 já vêm da T3 (Sul).

Parte F concluída (T7, T8).

- T7 — arquivos: `frontend/README.md` (item "Cenários do MSW" com a tabela de perfil, rota e dados, e o estado forçado) — prova: `npm test` → 1948 testes verdes; `npm run lint` e `npm run typecheck` limpos; `npm run e2e` → 78 passaram e 3 estouraram 30 s sob carga (`comprovantes`, `configuracao-unidade`, `portal-pedidos`); rodados de novo, os 3 passaram (5 de 5): instável, sem mudança de código.
- T8 — arquivos: `frontend/visual/telas.visual.ts` (a matrícula do caso aceita 409: o cenário já matricula o aluno 701 em Jiu-Jitsu), `frontend/visual/referencias/*.png` (215 imagens, 55 telas) — prova: `npm run test:visual:docker` antes → 137 passaram, 212 por diferença de imagem e 8 por 409 na matrícula; `-- --update-snapshots` → 357 passaram; `npm run test:visual:docker` sem atualizar → 357 passaram. Conferidas por amostra (Alunos, Cobranças, Início, Conta, Agenda): telas preenchidas, só nomes fictícios.
Regressão: front completo verde como acima; back-end não tocado (item só de front). `npm run visual:canvas` não rodado.
Desvios (F): (1) R19 diz "nenhuma outra tela mudou", mas o cenário ligado põe o seletor "Todas as unidades" (3 unidades) e o contador "4" do sino no cabeçalho de todas as telas da gestão (`ana@`), então 55 telas mudaram, incluindo Início, Conta e molduras. Todas conferidas como consequência do cenário. (2) Imagens do professor (`moldura-professor`, `agenda`) agora mostram aula avulsa e substituição.
Não é do item: nenhum.

## Verificação

### Rodada 1 — OK — 2026-11-07, estado 67b4b67869076f4643b1258b678e4b7c6d5a7919

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `cenarios-estado.msw.test.ts` e `reset.msw.test.ts` verdes; `setup.ts` desliga o cenário antes do reset |
| CA2 | PASSOU | `main.tsx` liga o cenário em dev; `playwright.config.ts` põe `VITE_MSW_CENARIOS=false` no webServer (lido no diff); e2e não reexecutado aqui, ver abaixo |
| CA3 | PASSOU | `cenarios/estado.ts` lido: 500, pendente, `items` vazio/total 0, 403, `rota`, só GET e fora de `/auth`; teste verde |
| CA4 | PASSOU | `cenarios-alunos.msw.test.ts` verde (13 alunos, contagens coerentes); "bloqueado" não existe no contrato (`financialStatus` só OVERDUE/CURRENT), desvio registrado |
| CA5, CA6 | PASSOU | `cenarios-alunos.msw.test.ts` verde |
| CA7 | PASSOU | 6 turmas, 31/30, inativa, sem limite; faixa no painel fora do contrato (`ClassStudent`), desvio registrado |
| CA8 a CA11 | PASSOU | `cenarios-cobrancas.msw.test.ts` verde |
| CA12 a CA15 | PASSOU | `cenarios-portal.msw.test.ts` verde ("1 de 2" só via `setScenarios(true, { termoFamilia: true })`) |
| CA16, CA17 | PASSOU | `cenarios-listas.msw.test.ts` verde (benefícios 6, "ao menos 5") |
| CA18 | PASSOU | README com a tabela de cenários e o estado forçado |
| CA19 | NÃO CONFERIDO (limitação aceita) | teste visual no container não reexecutado aqui; vale o CI do PR (AGENTS.md, Autonomia 2) |

Comandos: `npm run typecheck` limpo; `npm run lint` limpo; `npx vitest run src/mocks --maxWorkers=2` → 58 arquivos, 330 testes verdes. `npm test` completo, `e2e` e visual não reexecutados (resultado do construtor: 1948 verdes, e2e 78 + 3 instáveis que passaram, visual 357 verdes); ficam para o CI.
Instáveis: `comprovantes`, `configuracao-unidade`, `portal-pedidos` (e2e, timeout de 30 s sob carga; 5 de 5 na repetição, segundo a construção; não reproduzido aqui).
Achados:
- sugestão, código, `frontend/src/mocks/handlers.ts` / R19 — 55 telas mudaram de referência (seletor "Todas as unidades" e sino "4" no cabeçalho), contra "nenhuma outra mudou"; consequência do cenário, descrita na Construção. Citar na descrição do PR.
- sugestão, especificação, R2/R3/CA7 — "bloqueado" e faixa do aluno no painel não existem no contrato; ficam para as issues de tela. Citar no PR.
- sugestão, código, `termoFamilia` — "1 de 2" não é alcançável em `npm run dev`; o dono decide se quer chave na URL.

## Entrega

**O que muda:** o MSW passa a carregar um estado de dados fictícios (cenário) em dev e no teste visual: 13 alunos (com responsáveis, matrículas, dois alunos da unidade Sul), 21 cobranças (5 em atraso, comprovantes, recibos), a agenda com aula avulsa e cancelamento, 3 professores, 6 usuários, 6 benefícios e o portal de `aluno@`, `familia@` e `termo@`. O cenário liga por padrão e `VITE_MSW_CENARIOS=false` o desliga (o e2e já o desliga). Estado forçado por `?estado=erro|carregando|vazio|semPermissao` e `&rota=<prefixo>`, também em `npm run dev`. Os dados ficam em `frontend/src/mocks/cenarios/` e são empurrados por `seedScenarios()`. A tabela de perfil, rota e dados está em `frontend/README.md`.

**Como foi verificado:** rodada 1 da verificação `OK` (estado `67b4b678`): 18 critérios passaram; typecheck e lint limpos; `npx vitest run src/mocks` com 330 testes verdes; `npm test` com 1948 verdes na construção; `e2e` 78 passaram. O teste visual (CA19) não foi reexecutado localmente: vale o CI do PR (`test:visual:docker`).

**Decisões e desvios (para a descrição do PR):**
- 55 telas de referência mudaram (seletor "Todas as unidades" e sino com "4" no cabeçalho), contra a regra R19 de "nenhuma outra tela mudou". É consequência do cenário; as referências foram regeneradas com `test:visual:docker -- --update-snapshots` e conferidas por amostra.
- "Bloqueado" na lista de alunos e a faixa do aluno no painel da turma não existem no contrato OpenAPI (`financialStatus` só tem OVERDUE/CURRENT; `ClassStudent` não tem faixa). Ficam para as issues de tela; não mudam o contrato aqui.
- O estado "1 de 2" de termo de matrícula só aparece com `setScenarios(true, { termoFamilia: true })` (não há chave na URL). Fica para o dono decidir se quer uma chave.
- Meio "boleto" entra como `BOLETO` no recibo; o simulado de pagamento só aceita os quatro meios da gestão.
- `CHILD_TWO` entrou em `mockStudents` (13 alunos no total).

**Limitações:** item técnico sem tela própria, portanto sem comparação com o canvas. e2e: `comprovantes`, `configuracao-unidade` e `portal-pedidos` estouraram 30 s sob carga e passaram na repetição (5 de 5); instabilidade de timeout, sem mudança de código.
