# 693 — Migrar testes antigos que dependem de "hoje" para relógio fixo

Origem: issue #693 (técnica, Sprint 10.5). Branch: `item/693-testes-antigos-relogio-fixo`. Segue a #692 (que já tratou `no-class-days`, `comunicados` e o mock do dia sem aula; não repetir aqui). Regra de relógio fixo: `AGENTS.md`, "Testes e relógio".

## 1. Objetivo

Os testes antigos que leem o relógio real passam ou falham conforme o dia (a #688 mostrou o custo). Este item gera a lista completa e MEDE quais testes falham com o relógio em datas de risco (ajuste do dono: o item é só medição). Front: a medição já feita (T1 a T5) mostrou que nada falha por data. Back-end: mede-se a suíte com o relógio do contêiner movido (libfaketime, só diagnóstico) e os ITs que falharem viram issues técnicas de migração para `Clock` fixo. Nenhum IT é migrado aqui. Serve ao dono e ao CI: a `dev` deixa de ficar vermelha por causa do calendário.

Fora do escopo: migrar qualquer IT; criar `Clock` fixo compartilhado; usar libfaketime como mecanismo permanente; `SeedLoginIT`, ITs de agendador e limpeza de banco (#690); `no-class-days`, `comunicados` e o mock do dia sem aula (#692); mudar código de produção que não precise de relógio injetável para o teste fixar a data; regra de produto.

## 2. Requisitos

- R1: existe uma lista completa, gerada pelo método da issue (`grep` de `new Date()`, `Date.now`, `LocalDate.now`, `Instant.now` em `frontend/e2e`, `frontend/src`, `backend/src/test`), colada na issue #693 e no arquivo do item, separando "já fixa o relógio", "depende do dia" e "depende só da data de hoje" (D1).
- R2: cada teste da lista que falha com o relógio em 30/11, 02/12 ou 07/12/2026 passa a fixar o relógio (frontend) ou o `Clock` (back-end).
- R3: o que cada teste afirma não muda; só a fonte do tempo.
- R4: teste migrado não usa retry nem aumento de timeout.
- R5: a suíte do front passa com o relógio em três datas diferentes (D2, já medido em T2). No back-end, a medição usa libfaketime em contêiner, só como diagnóstico (D6), com o relógio em: uma segunda, um domingo, 30/11, 31/12, 01/01/2027 e 29/02/2028; registra-se quais ITs falham e em qual data.
- R7 (D6): para os ITs que falharem, abrir issues técnicas (etiqueta `técnica`) de migração para `Clock` fixo, agrupadas por pacote, com no máximo 25 arquivos cada; a que quebrar em data próxima (ex.: virada de ano) vai na frente dos itens de produto, as demais depois do próximo item de produto.
- R8 (D6): anotar se algum teste ou consulta depende de `now()`/`current_date` do PostgreSQL, que o `Clock` da aplicação não cobre.
- R6: a medição também cobre testes que não citam o relógio mas dependem de produção que lê "hoje" (a lista do `grep` não os acha); o que falhar entra na migração (D3).

## 3. Critérios de aceite

- CA1 (R1): dada a lista colada na issue, quando se compara com o `grep` do método, então todo arquivo de teste achado está classificado.
- CA2 (R2, R6): dado o relógio forçado em 30/11, 02/12 e 07/12/2026 (mecanismo temporário, não commitado), quando rodam `npm test`, os e2e e o `verify` do back-end, então a lista de falhas antes da correção fica registrada na issue, incluindo `PortalRequestsPage.test.tsx` ("expira em 29 dias") se falhar.
- CA3 (R2, R3, R4): dado cada teste que falhou, quando é migrado, então passa com relógio fixo e com as mesmas expectativas, sem retry nem timeout maior.
- CA4 (R5): dado o mesmo mecanismo temporário nas três datas, quando rodam as suítes do front depois da migração, então tudo passa nas três. No back-end não há migração neste item (D6).
- CA7 (R5, D6): dado o contêiner com libfaketime, quando a suíte do back-end roda com o relógio em segunda, domingo, 30/11, 31/12, 01/01/2027 e 29/02/2028, então a lista de ITs que falham e a data de cada falha ficam registradas na issue #693 e na seção "Construção"; se o contêiner não funcionar em 1 hora, a medição para e o motivo fica registrado no item.
- CA8 (R7): dada a lista de falhas, quando a medição termina, então existem issues `técnica` por pacote (até 25 arquivos cada), a de data próxima priorizada na frente dos itens de produto e as demais depois do próximo item de produto, e nenhum IT foi alterado no PR.
- CA9 (R8): dado o código dos ITs e das consultas, quando se procura `now()` e `current_date` em SQL de teste e de produção, então o resultado (depende ou não) está registrado no item.
- CA5 (R2): dado um teste migrado, quando se procura `new Date()`, `Date.now`, `LocalDate.now` ou `Instant.now` no arquivo, então ele fixa o relógio, ou o uso não depende de data (D1).
- CA6: dado o PR, quando o CI roda, então `ci-gate` fica verde com a regressão completa do `AGENTS.md`.

## 4. Plano técnico

- Dados, API, segurança, interface: não mudam (só testes e, se preciso, um `Clock` fixo de teste).
- Lista do `grep` hoje (92 arquivos; produção entra só como pista, o que migra é teste):
  - Front, unitários: `features/auth/LoginPage.test.tsx`, `features/charges/DailyReceiptsPage.test.tsx`, `features/charges/OverduePage.test.tsx`, `features/classes/ClassPanel.test.tsx`, `features/notifications/NotificationPanel.test.tsx`, `features/portal-requests/PortalRequestsPage.test.tsx` (usa `DAYS()` do relógio real; espera "expira em 29 dias"), `features/students/RecordHistory.test.tsx`.
  - Front, MSW (`frontend/src/mocks/`): `announcements-send`, `birthdays`, `chargePreview`, `enrollment-wizard`, `login`, `noClassDays`, `oneOffCharge`, `portal-finance`, `students` (`*.msw.test.ts`); `cenarios-listas.msw.test.ts` já fixa (#692).
  - Front, e2e: `frontend/e2e/portal-finance.spec.ts` (`new Date().getFullYear()`, sem `page.clock.install`).
  - Back-end (`backend/src/test/java/br/com/ctcore/`): `agenda/*IT` (`AgendaIT`, `AgendaLessonAdhocIT`, `AgendaLessonCancelIT`, `AgendaLessonEditIT`, `AgendaLessonIT`, `LessonGenerationIT`, `NoClassDay*`), `benefit/BenefitGrantIT`, `billing/Charge*IT`, `NextCharge*IT`, `OneOffCharge*IT`, `communication/Announcement*IT`, `payment/*IT`, `plan/PlanWriteIT`, `plan/RepricingIT` (10 usos), `student/*IT`, `trainingclass/TrainingClassDetailIT`, `db/MigrationIT`, `storage/S3FileStorageIT`, `scheduling/SchedulerLockIT` (esta e as de agendador: #690). Já fixam o `Clock`: `ChargeRenegotiationIT`, `NextChargeAdjustIT` (parcial), `OneOffChargeIT`, `DailyReceiptsIT`, `MajorityNoticeJobIT`.
  - Produção que lê o relógio (só pista para R6, não migra): `frontend/src/lib/format.ts`, `components/RelativeDate.tsx`, `features/agenda/agendaDates.ts`, `mocks/handlers.ts` e outros; o back-end já tem `Clock` (`config/ClockConfig.java`, `Clock.systemUTC()`).
- Ajuste (D6, pedido do dono): a #693 é só medição. Back-end: contêiner com libfaketime (JVM e, se preciso, PostgreSQL do Testcontainers) rodando `./backend/mvnw verify` com o relógio nas datas de R5; descartável, não commitado, imagem e contêiner removidos ao fim (regras de Docker local do `AGENTS.md`). Limite de 1 hora para fazê-lo funcionar. Saída: lista IT x data, issues `técnica` por pacote, nota sobre `now()`/`current_date`. Código do produto e dos testes não mudam; o PR só traz este arquivo.
- Mecanismo de medição (temporário, não commitado, D2; back-end: ver D6): front unitário, variável `CLK` lida num `setupFiles` local que faz `vi.useFakeTimers({ toFake: ["Date"] })` e `vi.setSystemTime`; e2e, `page.clock.install` injetado por variável; back-end, `@TestConfiguration` com `@Primary Clock` fixo lido de propriedade de sistema.
- Migração: só para o front, e nada falhou (T3 a T5). Back-end: nenhuma (D6).
- Reuso: `page.clock.install` e `page.clock.resume()` (#688/#692); `vi.useFakeTimers({ toFake: ["Date"] })` de `agenda.msw.test.ts`; `Clock.fixed(...)` dos ITs que já fixam.
- Partes: A = T1 a T5 (feitas); B = T9 a T11 (medição do back-end e issues).
- Riscos: fixar `Date` pode travar `setTimeout`/`waitFor` (ver acima); referência visual pode mudar se um caso visual usa o relógio real (conferir com `npm run test:visual:docker -- -g "<caso>"` sem `--update-snapshots` e registrar `Visual do CI: <caso> → passou/falhou`); muitos ITs só usam a data para montar dados e passam em qualquer dia, e ficam fora da migração (D1); `PortalRequestsPage.test.tsx` pode passar hoje e falhar em outra data, por isso a medição é obrigatória.

## 5. Tarefas

- [x] T1: gerar a lista pelo método da issue, classificar cada arquivo de teste (já fixa / depende do dia / depende só da data) e colar na issue #693 e na seção "Construção" — cobre CA1 — prova: o `grep` da issue e `gh issue view 693` mostrando o comentário
- [x] T2: medir: rodar `npm test`, `npm run e2e` e `./backend/mvnw -f backend/pom.xml verify` com o relógio forçado em 30/11, 02/12 e 07/12/2026 pelo mecanismo temporário e registrar na issue o que falha — cobre CA2 — prova: o mesmo comando por data, registro no comentário da issue
- [x] T3: migrar os testes unitários do front que falharam em T2 (candidatos: `PortalRequestsPage`, `LoginPage`, `DailyReceiptsPage`, `OverduePage`, `ClassPanel`, `NotificationPanel`, `RecordHistory`) — cobre CA3, CA5 — prova: `cd frontend && npx vitest run <arquivos>` nas três datas
- [x] T4: migrar os `*.msw.test.ts` que falharam em T2 — cobre CA3, CA5 — prova: `cd frontend && npx vitest run src/mocks` nas três datas
- [x] T5: migrar os e2e que falharam em T2 (candidato: `portal-finance.spec.ts`) — cobre CA3, CA5 — prova: `cd frontend && npx playwright test <specs>` nas três datas
- ~~T6, T7, T7b, T8~~: removidas (D6 ajustado: sem `Clock` compartilhado e sem migração de IT neste item).
- [x] T9: back-end: montar contêiner descartável com libfaketime (limite de 1 hora; se não funcionar, parar e registrar o motivo) e rodar `./backend/mvnw -f backend/pom.xml verify` com o relógio em segunda, domingo, 30/11, 31/12, 01/01/2027 e 29/02/2028; registrar IT x data na issue #693 e em "Construção"; remover imagem e contêiner — cobre CA7 — prova: log de cada rodada e `gh issue view 693` mostrando o comentário
- [x] T10: abrir as issues `técnica` de migração para `Clock` fixo por pacote (até 25 arquivos cada), apontando a de data próxima como prioritária (na frente dos itens de produto) e as demais para depois do próximo item de produto; citar a #693 e a regra de relógio — cobre CA8 — prova: `gh issue list --label técnica` com as novas issues
- [x] T11: procurar e anotar se há teste ou consulta que dependa de `now()` ou `current_date` do PostgreSQL (`grep` em `backend/src`), com a lista de arquivos — cobre CA9 — prova: o `grep` e a nota no item

## 6. Decisões

- D1: "depende só da data de hoje" (o teste monta dados relativos a hoje e passa em qualquer dia) migra só se a medição falhar; a lista o classifica, e a regra "teste novo não lê o relógio" vale daqui em diante. Motivo: a issue manda migrar os que falham ou já falharam, em lotes pequenos. Alternativa: migrar todos os 92 arquivos, descartada por custo sem ganho de segurança.
- D2: a prova das três datas usa mecanismo temporário local (variável de ambiente ou propriedade de sistema), não commitado, como na #692; só o relógio fixo definitivo entra no repositório.
- D3: a medição vale pela suíte inteira, não só pelos arquivos do `grep`, porque teste que chama produção que lê `new Date()` também depende do dia; o que falhar e não estiver na lista entra como "depende do dia".
- D4: a issue pede lotes de até 10 arquivos por PR; pelo `AGENTS.md` o item sai por um único PR, então os lotes viram partes de construção neste arquivo (A a E), cada uma com até 10 arquivos. Se o total a migrar passar de uns 25 arquivos, a fase 3 devolve o excesso como sugestão de novo item em vez de ampliar este.
- D5: data fixa padrão 24/11/2026 12:00 -03:00 (terça), a mesma de `portal-agenda` e `portal-inicio`; outra data só se o teste pedir, registrada na construção.
- D6 (ajuste, resposta do dono; desfaz a opção (b) anterior) (muda o comportamento): a #693 vira só medição. (1) libfaketime em contêiner só como diagnóstico, nunca permanente, com limite de 1 hora. (2) ITs que falharem viram issues `técnica` por pacote, até 25 arquivos cada; a de data próxima na frente dos itens de produto, as demais depois do próximo item de produto. (3) Anotar dependência de `now()`/`current_date` do PostgreSQL. (4) ITs que não falharem migram quando forem tocados, pela regra de relógio. (5) Nenhum IT é migrado e nenhum `Clock` compartilhado é criado aqui. Front unitário e e2e: mantém-se T1 a T5. Alternativa anterior (b): descartada pelo dono.
- Suposição: `PortalRequestsPage.test.tsx` falha em outras datas como a issue diz; se a medição mostrar que não, sai da lista com o motivo registrado. Suposição: libfaketime funciona no contêiner dentro de 1 hora; se não, registra-se o motivo e a medição do back-end fica `NAO_CONFERIDO` (o dono decide o próximo passo).

## Construção

- T1 — lista pelo `grep` do método (127 arquivos, 79 de teste: 19 já fixam, 60 não fixam; 0 dependem do dia no front) colada na issue #693 — prova: `gh issue comment 693` → https://github.com/ODevDosAnjos/CTCore/issues/693#issuecomment-7119034355
- T2 — medição com relógio forçado em 30/11, 02/12 e 07/12/2026 (mecanismos temporários, removidos; `git status` só mostra este arquivo): front unitário (`vi.useFakeTimers({ toFake: ["Date"] })` num `setupFiles` temporário, 275 arquivos) → 1 falha instável em 30/11 (`AccountPage`, passou 2 de 2 ao rodar de novo), 0 nas outras; e2e completo (`page.clock.install` numa cópia temporária dos specs, 135 testes) → 1 falha instável em 02/12 (`moldura-fixa`, passou 2 de 2), 0 nas outras; `PortalRequestsPage.test` passou nas três datas. Back-end (`ClockConfig` temporário lendo `-Dclk`, 932 ITs): 95 a 97 falhas e 3 a 4 erros em ~40 ITs, o mesmo conjunto nas três datas.
- T3, T4, T5 — nada a migrar: nenhum teste do front falhou por data (D1, D3). Marcadas por não terem arquivo.
- T6, T7, T8 — não feitas, por causa do pedido de ajuste abaixo.

Regressão: nenhuma mudança de código; nada a comparar com a linha de base.
Desvios: mecanismo do back-end (D2) só move o `Clock` do app; ver pedido de ajuste. Uma primeira medição do back-end saiu inválida (edição do `ClockConfig` não aplicada) e foi refeita.
Não é do item: `AnnouncementSendJobIT.sendsDueOnce` instável sem relógio forçado (o `@Scheduled` real fica ligado no teste), tema da #690.
Pedido de ajuste: D2/CA2/CA4 (back-end) — fixar só o bean `Clock` não simula o avanço do calendário: os ITs leem `LocalDate.now()` no código do teste e `now()` no banco, então com o `Clock` do app em 30/11, 02/12 ou 07/12 falham os mesmos ~40 ITs nas três datas (ex.: `CoordinationTransferIT` com REAUTH_REQUIRED, `OneOffChargeIT`, `Agenda*IT`, `LessonGenerationIT`, `NoClassDayWriteIT`, `PortalHomeIT`, `UnitDeactivationIT`, `EnrollmentConclusionIT`, `PaymentIT`, `PlanWriteIT`, `RepricingIT`). A medição não separa dependência de data de acoplamento entre relógios. A spec precisa escolher: (a) mecanismo que mova o tempo da JVM e do banco (ex.: libfaketime em contêiner), ou (b) definir que o escopo do back-end é migrar esses ITs para um `Clock` fixo compartilhado (acoplamento, não data), o que passa de 25 arquivos (D4) e viraria novo item.
- T9 — contêiner `maven:3.9-eclipse-temurin-21` + `faketime` (descartável, imagem removida), `mvn verify` com `FAKETIME="@2026-12-14 12:00:00"`: 932 testes, 36 falhas, 5 erros em 21 ITs (CoordinationTransfer*, UnitDeactivation, Portal*, ContactEmailSync, Notifications, AgendaLessonEdit, ChargePanel, ChargeReminderSend, AnnouncementSendJob, EmailService, LastChange, OrganizationProfile, Repricing, Terms, S3FileStorage). Só a JVM foi adiantada (PostgreSQL com relógio real). Cada data leva ~2 h; domingo, 30/11, 31/12, 01/01/2027 e 29/02/2028 não rodaram: NAO_CONFERIDO (tempo). Registro: https://github.com/ODevDosAnjos/CTCore/issues/693#issuecomment-7121798197
- T10 — issues `técnica` #696 (organization, terms), #697 (student), #698 (billing, plan, notification, mail, agenda, communication, storage); nenhuma marcada como data próxima (sem medição de 31/12 e 01/01/2027) — prova: `gh issue list --label técnica`
- T11 — depende: 17 classes de produção e 82 arquivos de teste com `now()`/`current_date` em SQL (lista na issue); o `Clock` não cobre.
Desvios (parte B): só 1 das 6 datas do back-end foi medida (~2 h por data com libfaketime); S3FileStorageIT provável artefato da medição.

### Registro do dono antes da verificação (decisão: opção 1)
- Medição parcial aceita como "OK parcial". Datas do back-end **não medidas**: domingo, 30/11, 31/12, 01/01/2027 e 29/02/2028. Motivo: cada data leva cerca de 2 h de suíte com libfaketime (cerca de 10 h para as cinco), acima do limite de 1 hora do dono; só segunda 14/12/2026 foi medida.
- A medição moveu só o relógio da JVM, com o PostgreSQL no relógio real. Parte das falhas (ex.: `REAUTH_REQUIRED`) pode vir dessa diferença entre JVM e banco, e não da data. Registrado nas #696, #697 e #698, que devem confirmar a causa antes de migrar.
- Aberta a #699 (Técnica · Decisão: relógio do banco vs Clock da aplicação), antes das #696 a #698, com as 19 ocorrências em código Java, as 30 migrações, alternativas A/B/C e proposta de texto para "Testes e relógio". Nada aplicado; decisão do dono.
- #696 a #698 e #699 não ficam na frente dos itens de produto. Se o CI da `dev` quebrar na virada do ano, vale a regra 8.

## Verificação

### Rodada 1 — OK parcial — 2026-11-24, estado cef2100d378a23972462709b8ab48616a112add8

OK parcial aceito pelo dono (título regravado sem nova execução; nenhum código mudou desde esta rodada). Não medidas no back-end: cinco das seis datas do CA7: domingo, 30/11, 31/12, 01/01/2027 e 29/02/2028. A sexta (segunda-feira, medida em 14/12/2026) rodou só com a JVM movida. Motivo: cada data leva cerca de 2 h de `verify`, e a medição moveu só o relógio da JVM, com o PostgreSQL no relógio real, o que não vale como medição de data (ver #699). Também não rodou a regressão local completa (`verify`, `lint`, `typecheck`, `build`, `test:cov`, `e2e`, visual): dispensada pelo dono por não haver código de produto nem de teste alterado; o `ci-gate` do PR vale como prova.

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | comentário da #693 (issuecomment-7119034355) existe; lista registrada em "Construção" (79 arquivos de teste classificados) |
| CA2 | PASSOU (front) / NÃO CONFERIDO (back-end, aceito pelo dono) | front medido nas 3 datas, 2 falhas instáveis; back-end só moveu o `Clock` do app, medição inválida para data (ver Pedido de ajuste) |
| CA3, CA5 | PASSOU (vazio) | diff só traz `specs/`; nada falhou no front, nada migrado (D1, D3) |
| CA4 | PASSOU (front, mantido da medição T2) | 0 falhas por data no front nas 3 datas |
| CA7 | NÃO CONFERIDO (aceito pelo dono) | 1 de 6 datas (14/12/2026); demais ~2 h cada, motivo em "Construção"; JVM movida, PostgreSQL não |
| CA8 | PASSOU parcial | #696, #697, #698 abertas (back-end, técnica), nenhum IT alterado; nenhuma marcada como data próxima por falta de medição de 31/12 e 01/01 (aceito pelo dono) |
| CA9 | PASSOU | nota T11 em "Construção" (17 classes de produção e 82 arquivos de teste com `now()`/`current_date`) |
| CA6 | NÃO CONFERIDO | PR ainda não aberto; `ci-gate` vale como prova (Autonomia 2) |

Comandos: `git diff --stat` base..estado (só `specs/backlog.md` +4 e o arquivo do item +92); `gh issue view 693/696/697/698/699` (abertas, etiquetas `back-end,técnica`); comentários da #693 conferidos. Regressão local completa (`verify`, `lint`, `typecheck`, `build`, `test:cov`, `e2e`, visual) NÃO rodou: dispensada pelo dono por não haver código de produto nem de teste alterado; CI do PR vale.
Instáveis: `AccountPage` (30/11) e `moldura-fixa` (02/12), instáveis na medição, passaram 2 de 2 depois; `AnnouncementSendJobIT.sendsDueOnce` (tema da #690). Não são achados do item.
Achados:
- sugestão, processo, issue #699 — `AGENTS.md` ("Backlog") veda issues de "decisão"; a #699 traz "Decisão" no título e propõe texto de regra. Foi aberta e registrada pelo dono; sugiro mover a decisão para o arquivo do item se o dono preferir seguir a regra à risca.
- sugestão, especificação — CA7/CA8 ficam cumpridos só em parte (1 de 6 datas; sem issue de data próxima). Aceito pelo dono; a #699 deve confirmar a causa (JVM x banco) antes de #696 a #698.

## Entrega

- O que muda: só a medição da #693. Nenhum código de produto nem de teste mudou (nenhum IT migrado, D6). Entram o arquivo do item e a linha 693 do backlog (`feito`).
- Como foi verificado: rodada 1 de "Verificação" (OK parcial, aceita pelo dono). Front medido nas três datas (30/11, 02/12, 07/12/2026): nenhuma falha por data; falhas instáveis `AccountPage` (30/11) e `moldura-fixa` (02/12) passaram ao repetir. Back-end medido só em segunda, 14/12/2026, com libfaketime (JVM movida, PostgreSQL no relógio real): 36 falhas e 5 erros em 21 ITs.
- Decisões que o leitor precisa saber: o dono aceitou OK parcial (opção 1) e registrou que a medição do back-end não vale como prova de data (ver #699). Issues abertas: #696, #697, #698 (técnica, `Clock` fixo por pacote, sem data próxima, depois do próximo item de produto) e #699 (decisão do dono, antes delas). Dependência de `now()`/`current_date` do PostgreSQL anotada em "Construção" (T11).
- Limitações: CA7 cumprido em 1 de 6 datas (domingo, 30/11, 31/12, 01/01/2027 e 29/02/2028 não medidas); CA6 vale pelo `ci-gate` do PR; a regressão local completa não rodou (dispensada pelo dono, sem código alterado).
- Base: `dev` em `fd4541f`, sem avanço desde o item; sem regressão nova.
