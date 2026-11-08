# 523 — Técnica · Testes com relógio real: AgendaPage CA14 e cenarios-cobrancas CA11 falham aos domingos

Origem: issue #523 (técnica, front-end; sem marco). Branch: `item/523-testes-relogio-fixo`.

## 1. Objetivo

Fazer os dois testes que falham conforme o dia e a hora do relógio real passarem sempre, e varrer os testes do front e do back-end por outras leituras do relógio real, corrigindo as que dependem da data ou da hora. O diagnóstico da issue (domingo) é uma das causas; a outra, no CA11, é rodar perto da meia-noite da unidade (00:27, 00:43 e 03:08 UTC de 08/11 são 21:27, 21:43 e 00:08 em São Paulo, e o cenário cria recebimentos de "30 a 120 minutos atrás", que cruzam o dia). A correção é no teste, não no produto.

Fora do escopo: mudar código de produção, o cenário do MSW ou o `Clock` do back-end; reescrever testes que usam datas só como valor relativo sem comparar com o dia da unidade.

## 2. Requisitos

- R1: `AgendaPage.test.tsx` CA14 (360 px) fixa o relógio e passa em qualquer dia da semana e hora.
- R2: `cenarios-cobrancas.msw.test.ts` CA11 fixa o relógio e passa em qualquer dia e hora do relógio real (inclusive perto da meia-noite de São Paulo, porque o valor fixado fica longe dela).
- R3: nenhum dos dois testes compara com a data UTC do sistema; a data da unidade vem do relógio fixado e do fuso da unidade (D1).
- R4: varredura de `Date.now`, `new Date()`, `LocalDate.now`, `Instant.now`, `ZonedDateTime.now` (e `LocalDateTime.now`, `OffsetDateTime.now`) nos testes do front e do back-end, com lista do que foi achado e corrigido (ou deixado, com o motivo) na seção Construção.
- R5: o que a varredura achar que falha por dia ou hora é corrigido no mesmo PR; o que não for, é listado como "não depende de dia/hora" com o motivo (D2).

## 3. Critérios de aceite

- CA1 (R1, R3): dado o relógio real em qualquer dia da semana e hora, quando roda o CA14 a 360 px, então passa, porque o teste fixa `Date` em quarta 11/11/2026 12:00 de São Paulo; o valor fixado é o que fica no código. (Ajustado: a prova com o relógio fixado em outro dia não vale, pois o MSW depende do dia; ver D3.)
- CA2 (R2, R3): dado o relógio real em qualquer dia e hora, quando roda o CA11, então os quatro meios (`BOLETO`, `CARD_MACHINE`, `CASH`, `PIX_KEY`) aparecem nos recebimentos do dia, porque o teste fixa `Date` em 15:00Z (12:00 em São Paulo), onde "30 a 120 minutos atrás" cai no mesmo dia. (Ajustado: a prova às 00:30 SP não vale; ver D3.)
- CA3 (R1, R2): `npm test` roda os dois arquivos com `TZ=UTC` e com `TZ=America/Sao_Paulo` e passa (a fixação não depende do fuso da máquina).
- CA4 (R4, R5): a seção Construção traz a lista da varredura (arquivo, uso, corrigido ou não e por quê) para o front e para o back-end.
- CA5 (R5): cada teste do front corrigido pela varredura passa em `TZ=UTC`, `America/Sao_Paulo`, `Pacific/Kiritimati` e `Pacific/Pago_Pago` (relógio fixado no teste); no back-end, `./backend/mvnw -f backend/pom.xml test` e os `*IT` alterados passam.

## 4. Plano técnico

- Dados / API / Segurança: não mudam.
- Interface: não muda (só testes).
- Arquivos (todos vistos no repositório):
  - `frontend/src/features/agenda/AgendaPage.test.tsx`: no CA14 (linhas ~138 a 155) e, por consistência, no `describe` inteiro, `vi.useFakeTimers({ toFake: ["Date"] })` e `vi.setSystemTime(new Date("2026-11-11T15:00:00Z"))` (quarta, meio-dia em São Paulo) no `beforeEach`; `vi.useRealTimers()` no `afterEach`. `todayIso()` de `agendaDates.ts` usa `new Date()` local, então segue o relógio fixado. Só `Date` é falseado, para não travar `userEvent`, `findBy*` e o MSW (mesmo padrão de `frontend/src/mocks/charge-reminders.msw.test.ts`).
  - `frontend/src/mocks/cenarios-cobrancas.msw.test.ts`: `beforeEach` fixa `Date` em `2026-11-11T15:00:00Z` antes de `setScenarios(true)` (o cenário `cobrancasCenario` usa `Date.now()` em `minutesAgo`, e o handler `/billing/daily-receipts` em `handlers.ts` usa `new Date()` e `America/Sao_Paulo`); `afterEach` volta ao real. 15:00Z é 12:00 em São Paulo: 30 a 120 minutos atrás cai no mesmo dia. Conferir também o CA8, CA9 e CA10 do mesmo arquivo com o relógio fixo.
  - Varredura front (achados iniciais, `grep -nE "Date\.now|new Date\(\)"` em `*.test.ts(x)`): `features/auth/LoginPage.test.tsx` (249, 277: bloqueio por tempo relativo), `features/notifications/NotificationPanel.test.tsx` (25), `mocks/announcements-send.msw.test.ts` (83), `mocks/birthdays.msw.test.ts` (28), `mocks/cenarios-listas.msw.test.ts` (6), `mocks/chargePreview.msw.test.ts` (22: `toISOString` UTC, compara com dia da unidade), `mocks/enrollment-wizard.msw.test.ts` (62), `mocks/login.msw.test.ts` (10), `mocks/noClassDays.msw.test.ts` (92, 104), `mocks/oneOffCharge.msw.test.ts` (12), `mocks/portal-finance.msw.test.ts` (15: `getFullYear` na virada do ano), `mocks/students.msw.test.ts` (178). Para cada um: decidir se o resultado muda com o dia/hora (principalmente `toISOString().slice(0,10)`, que é data UTC, contra handlers que usam o dia de São Paulo). Os que mudam ganham o mesmo `useFakeTimers` + `setSystemTime`.
  - Varredura back-end (`grep -rnE "(LocalDate|Instant|ZonedDateTime|LocalDateTime|OffsetDateTime)\.now\(" backend/src/test`, 81 usos em 27 arquivos; 55 sem fuso, que usam o da JVM, UTC): `agenda/` (`AgendaLessonEditIT`, `LessonGenerationIT`, `NoClassDayNoticeIT`, `NoClassDayReadIT`, `NoClassDayWriteIT`), `benefit/BenefitGrantIT`, `billing/` (`ChargeActionsIsolationIT`, `ChargeCancelIT`, `ChargePanelIT`, `OneOffChargeIsolationIT`, `OneOffChargeIT`), `db/MigrationIT`, `payment/` (`DailyReceiptsIsolationIT`, `DailyReceiptsIT`, `PaymentIT`), `plan/RepricingIT`, `scheduling/SchedulerLockIT`, `storage/S3FileStorageIT`, `student/` (`ClassWarningsIT`, `EmailBouncesIT`, `EnrollmentConclusionIT`, `MajorityNoticeJobIT`, `StudentEditIT`, `StudentGuardiansIT`, `StudentRecordTeacherIT`, `StudentRegistrationIT`, `StudentSimpleListIT`). Regra do AGENTS.md: teste não compara a data da JVM com a data da unidade; o que usa `LocalDate.now()` sem fuso como "hoje" (ex.: pagamento de hoje em `PaymentIT`, `validUntil` de hoje, aniversário de hoje, `dueOn` de hoje) passa a usar `LocalDate.now(ZoneId.of("America/Sao_Paulo"))`, como já fazem `TODAY` e `NightClock` em outros testes; datas com folga de dias (`plusDays(20)`, `minusYears(10)`) e instantes de `SchedulerLockIT`/`S3FileStorageIT`/`MigrationIT` não dependem do dia e só entram na lista como "não depende".
- Reuso: padrão `useFakeTimers({ toFake: ["Date"] })` de `charge-reminders.msw.test.ts`; `ZoneId.of("America/Sao_Paulo")` e `NightClock` (`backend/src/test/java/br/com/ctcore/billing/ChargeRenegotiationIT.java`) no back-end.
- Riscos: fixar o relógio num teste que depende de tempo real (debounce, espera do `findBy`) travar; por isso só `Date` é falseado. Mudar o "hoje" do back-end para São Paulo reprovar teste que já passava por acaso: rodar cada `*IT` alterado. `*IT` exige Docker; sem ele, vale o CI do PR (AGENTS.md, Autonomia 2).

## 5. Tarefas

- [x] T1: Fixar o relógio em `AgendaPage.test.tsx` — cobre CA1, CA3 — prova: `cd frontend && npx vitest run src/features/agenda/AgendaPage.test.tsx` (e com `TZ=America/Sao_Paulo`; e com o relógio temporariamente num domingo para ver passar).
- [x] T2: Fixar o relógio em `cenarios-cobrancas.msw.test.ts` — cobre CA2, CA3 — prova: `cd frontend && npx vitest run src/mocks/cenarios-cobrancas.msw.test.ts` (com o relógio temporariamente em 00:30 de São Paulo, ou seja `T03:30:00Z`, para ver passar).
- [x] T3: Varredura do front: classificar cada uso da lista, corrigir os que dependem de dia/hora e registrar a lista — cobre CA4, CA5 — prova: `cd frontend && npx vitest run` nos arquivos alterados, também com o relógio em `T03:30:00Z` e `T02:30:00Z`.
- [x] T4: Varredura do back-end: classificar os 55 usos sem fuso, corrigir os que representam "hoje" da unidade e registrar a lista — cobre CA4, CA5 — prova: `./backend/mvnw -f backend/pom.xml test` e `./backend/mvnw -f backend/pom.xml verify -Dit.test=<classes alteradas>` (ou o CI do PR, se não houver Docker).
- [x] T5: Regressão do front — não cobre critério: confirmar que nada mais quebrou — prova: `cd frontend && npm run lint && npm run typecheck && npm test`.

## 6. Decisões

- D1: fixar o relógio com `vi.useFakeTimers({ toFake: ["Date"] })` + `vi.setSystemTime` em quarta-feira 11/11/2026 às 12:00 de São Paulo (`15:00Z`), em vez de injetar um relógio no código de produção. Motivo: o item é só de teste e o padrão já existe no repositório. Alternativa descartada: mudar `todayIso` e o cenário para receber um relógio (muda produção sem necessidade).
- D2: na varredura, só se muda o que falha por dia ou hora do relógio; uso com folga de dias, instante relativo curto ou que só gera valor único não é alterado e entra na lista com o motivo. Alternativa descartada: trocar todos os 81 + 12 usos por relógio fixo (mexe em dezenas de testes sem ganho).
- D3 (ajuste, pedido da Verificação rodada 1, achado obrigatório): os critérios CA1, CA2 e CA5 deixam de exigir que o teste passe com o relógio fixado em domingo, 00:30 ou 23:30. Motivo: o cenário e o handler do MSW (produção do mock, fora do escopo) dependem do dia e da hora da unidade, então o teste só é determinístico no valor fixo (quarta 12:00 SP). Vale o que o construtor provou: passa com qualquer relógio real, nos 4 fusos. Alternativa descartada: fazer o MSW aceitar um relógio injetado (item à parte, se o dono quiser). Nenhuma tarefa nova; T1 a T5 seguem marcadas. As duas sugestões da verificação (constante de fuso por classe no back-end; comentário junto ao `beforeEach`) são estéticas e opcionais, fora das tarefas.
- Suposição: o domingo da issue e a meia-noite de São Paulo (00:08 em 08/11) são as duas causas do CA11; o CA14 falha por domingo (o dia seguinte cruza a semana). Se a reprodução no T1/T2 mostrar outra causa, registrar na Construção.
- Suposição: o item não está em `specs/backlog.md` (que não lista #520 a #523); vale a issue (AGENTS.md: as issues prevalecem). O backlog não foi alterado nesta fase.

## Construção

- T1 — `frontend/src/features/agenda/AgendaPage.test.tsx` (`beforeEach` fixa `Date` em 2026-11-11T15:00Z, `afterEach` volta ao real) — prova: `npx vitest run` do arquivo com TZ=UTC e TZ=America/Sao_Paulo → passa.
- T2 — `frontend/src/mocks/cenarios-cobrancas.msw.test.ts` (mesmo padrão) — prova: `npx vitest run` do arquivo → passa.
- T3 — varredura do front. Arquivo extra corrigido: `mocks/cenarios-listas.msw.test.ts` (CA16 usa `day()` UTC contra o cenário; mesmo `useFakeTimers`). Prova: os 14 arquivos da lista com TZ=UTC, America/Sao_Paulo, Pacific/Kiritimati e Pacific/Pago_Pago → 115 testes passam em todos.
  - Corrigido: `cenarios-listas.msw.test.ts:6`.
  - Não depende de dia/hora (D2; usa tempo relativo curto, ou teste e handler leem o mesmo relógio e o mesmo fuso, e passou nos 4 fusos): `LoginPage.test.tsx:249,277`, `NotificationPanel.test.tsx:25`, `announcements-send.msw.test.ts:83`, `birthdays.msw.test.ts:28`, `chargePreview.msw.test.ts:22`, `enrollment-wizard.msw.test.ts:62`, `login.msw.test.ts:10`, `noClassDays.msw.test.ts:92,104`, `oneOffCharge.msw.test.ts:12`, `portal-finance.msw.test.ts:15` (ano corrente, o handler usa o mesmo), `students.msw.test.ts:178`.
- T4 — varredura do back-end (`grep` de `.now()` sem fuso em `backend/src/test`). Corrigidos para o fuso da unidade ("hoje" da unidade): `BenefitGrantIT`, `ChargeCancelIT`, `RepricingIT`, `OneOffChargeIT.due()`. Prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='BenefitGrantIT,ChargeCancelIT,RepricingIT,OneOffChargeIT' -Dtest=NoSuchTest -Dsurefire.failIfNoSpecifiedTests=false -Djacoco.skip=true` → 22 testes, 0 falhas, BUILD SUCCESS.
  - Não depende de dia/hora (folga de dias, instante relativo, ou só valor único): `AgendaLessonEditIT:169`, `NoClassDayReadIT:119`, `NoClassDayNoticeIT:36`, `NoClassDayWriteIT:159,160,176` (Instant relativo), `LessonGenerationIT:173` (-20 dias), `ChargeActionsIsolationIT`, `ChargePanelIT:61`, `OneOffChargeIsolationIT:36` (+2 a +5 dias), `OneOffChargeIT:116` (-10 anos), `MigrationIT:65`, `DailyReceiptsIT:163`, `DailyReceiptsIsolationIT:42` (Instant que o próprio serviço converte), `PaymentIT:100,104,119` (relativo ao OffsetDateTime, ±1/2 dias), `SchedulerLockIT:70`, `S3FileStorageIT:74,77`, `ClassWarningsIT:72`, `EmailBouncesIT:94`, `EnrollmentConclusionIT:432,455`, `MajorityNoticeJobIT:50`, `StudentEditIT:60,65,138`, `StudentGuardiansIT:62`, `StudentRecordTeacherIT:66`, `StudentRegistrationIT:104,143,154,180`, `StudentSimpleListIT:50` (idades em anos e data futura +1: a data UTC é sempre igual ou posterior à da unidade, então segue futura).
- T5 — `npm run lint && npm run typecheck && npm test` → lint e typecheck passam; `npm test` com todos os workers: 119 testes de 50 arquivos (todos sem relação com o item, ex.: UnitSettingsPage, ClassFormDialog) estouraram o limite de 20 s por carga da máquina; repetido com `npx vitest run --maxWorkers=4` → 199 arquivos, 1972 testes passam. Back-end: `./backend/mvnw -f backend/pom.xml test` → 162 testes, 0 falhas.
Regressão: front 1972/1972 e back-end rápido 162/162; `verify` completo e `e2e` não rodados nesta fase (só testes de teste foram alterados; vale o CI do PR).
Desvios: (1) CA1/CA2/CA5 pediam passar com o relógio fixado em outros horários; feito como prova temporária e o AgendaPage fixado num domingo, o cenario-cobrancas às 00:30 SP e o cenarios-listas às 23:30 SP falham, porque o próprio cenário/handler do MSW (produção do mock, fora do escopo) depende do dia e da hora. O teste agora é determinístico no valor fixo (quarta, 12:00 SP); o código do MSW não foi alterado. (2) Mudança extra: `cenarios-listas.msw.test.ts`, fora da lista inicial do plano.
Não é do item: nenhum.

## Verificação

### Rodada 1 — CORRIGIR_ESPEC — 2026-11-08, estado working-tree (sem commit; diff de 7 arquivos contra HEAD f90eead)

| Critério | Status | Evidência |
|---|---|---|
| CA1 | NÃO PASSOU (parte "fixado num domingo") | O relógio fica na quarta e o CA14 passa (vitest, TZ=UTC e America/Sao_Paulo). A prova num domingo falha, segundo o registro do construtor em "Desvios"; não foi reproduzida aqui porque esta fase não altera código |
| CA2 | NÃO PASSOU (parte "00:30 São Paulo") | Meio-dia passa (4 meios nos recebimentos). O registro do construtor diz que às 00:30 falha, porque o cenário e o handler do MSW (fora do escopo) usam o dia da unidade |
| CA3 | PASSOU | `TZ=UTC` e `TZ=America/Sao_Paulo`: 3 arquivos, 25 testes passam em cada |
| CA4 | PASSOU | Seção Construção traz as listas do front (T3) e do back-end (T4), com motivo |
| CA5 | NÃO PASSOU (parte "00:30 e 23:30") | Back-end: 4 `*IT` alterados passam (BenefitGrantIT, ChargeCancelIT, OneOffChargeIT, RepricingIT; failsafe-reports de 11:29, 0 falhas). Front: o relógio em horário de risco falha para `cenarios-listas` às 23:30 SP, segundo "Desvios" |

Comandos:
- `TZ=UTC|America/Sao_Paulo npx vitest run` dos 3 arquivos alterados do front: 25/25 em cada fuso.
- `npm run typecheck` e `npm run lint`: sem erros.
- `./backend/mvnw -f backend/pom.xml verify -Dit.test='BenefitGrantIT,ChargeCancelIT,RepricingIT,OneOffChargeIT' ...`: 0 falhas nos 4.
- Regressão completa do front e `verify` completo não repetidos aqui; o construtor registrou 1972/1972 no front e 162/162 no back-end rápido.

Achados:
- obrigatório, especificação, seção 3, CA1, CA2 e CA5 — esperado: critérios que o item consegue cumprir dentro do escopo; observado: os critérios exigem passar com o relógio em domingo, 00:30 e 23:30, mas o plano proíbe mudar o MSW e o cenário/handler do MSW dependem do dia e da hora da unidade, então a execução do próprio construtor mostra que esses cenários falham; evidência: "Desvios" (1) em Construção; corrigir: reescrever os critérios para o que vale (o teste fixa o relógio em quarta 12:00 SP e passa em qualquer relógio real, nos 4 fusos), e tirar o requisito de "passar com o relógio em outros horários" ou abrir item à parte para o MSW aceitar o relógio.
- sugestão, código, back-end (`BenefitGrantIT`, `ChargeCancelIT`, `OneOffChargeIT`, `RepricingIT`) — `java.time.ZoneId.of("America/Sao_Paulo")` repetido inline ~17 vezes; uma constante `SP`/`TODAY` por classe deixaria o diff menor e legível. O plano citava `TODAY` e `NightClock` como padrão.
- sugestão, código, `cenarios-cobrancas.msw.test.ts` e `cenarios-listas.msw.test.ts` — o comentário fica acima do `afterEach`, longe do `beforeEach` que fixa o relógio; só estético.

### Correção da rodada 1
- Achado obrigatório (CA1, CA2, CA5 exigiam passar com relógio em domingo, 00:30 e 23:30): já atendido na fase 2 pela decisão D3; os critérios agora valem para o relógio fixado (quarta 12:00 SP). Nenhuma mudança de código — prova: `TZ=UTC` e `TZ=America/Sao_Paulo npx vitest run` de AgendaPage, cenarios-cobrancas e cenarios-listas → 3 arquivos, 25 testes passam em cada fuso.
- Sugestões opcionais (constante de fuso por classe no back-end; comentário junto ao `beforeEach`): não aplicadas, fora das tarefas (D3).
Regressão: sem mudança de código nesta correção; vale o registro da construção (front 1972/1972, back-end rápido 162/162) e o CI do PR.
Não é do item: nenhum.

### Rodada 2 — OK — 2026-11-08, estado 64238bc7386f3448b1a8c0cd98453a7f9a600f79

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | CA14 com `Date` fixado em 2026-11-11T15:00Z; passa nos 4 fusos (D3 ajustou o critério) |
| CA2 | PASSOU | CA11 com o mesmo relógio fixado; 25/25 nos 4 fusos |
| CA3 | PASSOU | `TZ=UTC` e `America/Sao_Paulo`: 3 arquivos, 25 testes |
| CA4 | PASSOU | listas do front e do back-end na Construção |
| CA5 | PASSOU | front: `TZ=UTC`, `America/Sao_Paulo`, `Pacific/Kiritimati`, `Pacific/Pago_Pago` 25/25; back-end: 4 `*IT` alterados rodados de novo, ver Comandos |

Comandos:
- `TZ=<4 fusos> npx vitest run` dos 3 arquivos: 25/25 em cada.
- `./backend/mvnw ... verify -Dit.test='BenefitGrantIT,ChargeCancelIT,RepricingIT,OneOffChargeIT'`: BenefitGrantIT 8, ChargeCancelIT 4, OneOffChargeIT 6 sem falhas; RepricingIT e BUILD conforme o resumo do log.
- Regressão completa não repetida (só testes alterados); vale o registro da construção e o CI do PR.
Achados:
- obrigatório da rodada 1 (critérios): resolvido por D3.
- sugestão, código, back-end: `ZoneId.of("America/Sao_Paulo")` inline repetido; constante por classe seria mais legível.

## Entrega

- O que muda: `AgendaPage.test.tsx`, `cenarios-cobrancas.msw.test.ts` e `cenarios-listas.msw.test.ts` fixam só o `Date` em quarta 11/11/2026 12:00 de São Paulo e voltam ao relógio real depois. No back-end, `BenefitGrantIT`, `ChargeCancelIT`, `RepricingIT` e `OneOffChargeIT` usam o "hoje" do fuso da unidade. Nenhum código de produção, nenhum cenário nem handler do MSW muda.
- Verificação: rodada 2 `OK`. Front: os 3 arquivos passam em 4 fusos (25/25 em cada). Back-end: os 4 `*IT` alterados passam. Na construção, regressão do front 1972/1972 e do back-end rápido 162/162. `verify` completo e `e2e` ficam para o CI do PR.
- Decisão: CA1, CA2 e CA5 valem para o relógio fixado (D3). O teste é determinístico no valor fixo; passar com o relógio real em domingo, 00:30 ou 23:30 depende do MSW, que está fora do escopo.
- Limitação: o cenário de cobranças e o handler continuam dependentes do dia e da hora da unidade quando rodam com relógio real fora do fixado; corrigir isso é item à parte, se o dono quiser.
- Backlog: a issue não tinha linha em `specs/backlog.md`; a linha foi incluída sem marco, no fim da tabela, como `feito`.
