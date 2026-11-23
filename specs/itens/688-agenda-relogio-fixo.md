# 688 — Teste e2e da Agenda falha às segundas-feiras: usar relógio fixo

Origem: issue #688 (front-end, técnica, Sprint 10.5). Branch: `item/688-agenda-relogio-fixo`. Mesmo formato da #318 e da #320.

## 1. Objetivo

Fazer `@critical Coordenador abre a Agenda` (`frontend/e2e/agenda.spec.ts`) passar em qualquer dia da semana, corrigindo a causa: o mock da agenda trata "hoje" como dia sem aula. O dia sem aula passa a ser uma data cancelada fixa no mock, e os testes da agenda (e2e, MSW) usam relógio fixo.

Decisão do dono (comentário na issue #688, 23/11/2026): corrigir a causa, não só o teste; relógio fixo no e2e (`page.clock.install`) e nos testes de MSW e de tela (`vi.setSystemTime`); prova com o relógio numa segunda, numa terça e numa quarta.

Fora do escopo: corrigir outros testes que dependem de "hoje" mas não falham (só listar); aumentar timeout ou retry; mudar a regra de dia sem aula do produto (o mock apenas deixa de inventar "hoje" como feriado).

## 2. Requisitos

- R1: a falha é reproduzida numa segunda-feira e a passagem numa terça, antes da correção, e o resultado é registrado na issue (D1).
- R2: `mockLesson` e o `noClassDays` do `GET /agenda` no mock não tratam "hoje" como cancelado; o dia sem aula do cenário vem de uma data cancelada fixa, `SYNTHETIC_HOLIDAY = "2026-11-27"` (D2). Aula de hoje segue a regra comum (futura = agendada; de hoje ou passada = realizada).
- R3: o e2e da agenda fixa o relógio do navegador com `page.clock.install` e passa com o relógio numa segunda (23/11/2026), numa terça (24/11) e numa quarta (25/11) (D3).
- R4: `agenda.msw.test.ts` fixa a data com `vi.setSystemTime` e passa a esperar a data cancelada fixa, não "hoje"; `AgendaPage.test.tsx` já fixa o relógio e usa dados próprios, só é conferido (D4).
- R5: os testes que esperavam "Sem aula" em hoje por causa do mock passam a esperar a data cancelada fixa, mantendo o CA de cada regra (RF-AGE-01 a RF-AGE-05); os outros testes de `frontend/e2e` e `frontend/src/mocks` que dependem do dia da semana são listados na issue, sem corrigir os que não falham.
- R6: nenhum retry automático nem aumento de timeout.

## 3. Critérios de aceite

- CA1 (R1): dado o relógio do navegador na segunda-feira, quando roda `npx playwright test e2e/agenda.spec.ts` sem a correção, então falha; na terça, passa.
- CA2 (R2): dado o mock sem relógio fixo, quando se pede a semana que contém 27/11/2026, então a data 27/11 vem em `noClassDays` com "Feriado sintético" e as aulas dela vêm `CANCELLED`; e as aulas de hoje (se hoje não for 27/11) não vêm canceladas por serem de hoje.
- CA3 (R3, R6): dado o e2e com `page.clock.install` em 23, 24 e 25/11/2026, quando roda, então passa nos três dias: a semana atual mostra "Sem aula", Jiu-Jitsu Adulto visível e nunca riscado por ser de hoje, "Próxima semana" não mostra "Sem aula", e "Hoje" volta à semana de 27/11.
- CA4 (R4): dado `agenda.msw.test.ts` com data fixa, quando roda em qualquer dia da semana, então passa e confere `noClassDays[0].startsOn === "2026-11-27"` e as aulas dessa data canceladas.
- CA5 (R5): dado o conjunto de testes que usa a agenda do mock, quando roda `npm test` e os e2e da agenda, então passa; os que esperavam "Sem aula" em hoje esperam a data fixa.
- CA6 (R5): dado o `grep` de dependência de data, quando a busca termina, então a issue lista os arquivos que dependem do dia da semana.

## 4. Plano técnico

- Dados, API, segurança: não mudam (só o mock). Interface: não muda.
- Causa (lida em `frontend/src/mocks/handlers.ts`): `mockLesson` (linha ~767) faz `cancelled = date === today || !!day`; o handler de `GET /agenda` (linha ~3295) acrescenta `{ startsOn: today, ... "Feriado sintético" }` em `noClassDays`. Jiu-Jitsu Adulto tem aula seg (1) e qua (3); na segunda o primeiro card dele é o de hoje, cancelado (riscado), e o e2e o lê como oculto.
- `frontend/src/mocks/handlers.ts`: criar `const SYNTHETIC_HOLIDAY = "2026-11-27"` perto de `coveringDay`; em `mockLesson` trocar `date === today` por `date === SYNTHETIC_HOLIDAY`; no handler de `GET /agenda` trocar a entrada de `noClassDays` por `from <= SYNTHETIC_HOLIDAY && SYNTHETIC_HOLIDAY <= to` com `startsOn/endsOn = SYNTHETIC_HOLIDAY`; atualizar os comentários das linhas ~683 e ~3249 ("hoje é dia sem aula"). `adhocLesson` não trata hoje como cancelado (sem mudança); o painel da aula (~linha 836) usa `mockLesson` e herda a mudança.
- `frontend/e2e/agenda.spec.ts`: o teste `@critical Coordenador abre a Agenda` vira um `for` sobre `["2026-11-23", "2026-11-24", "2026-11-25"]` (segunda, terça, quarta, 12:00 local), cada um com `await page.clock.install({ time: new Date(`${dia}T12:00:00`) })` antes de `page.goto`; o dia entra no título. A aula avulsa "na data de hoje" segue valendo (hoje = o relógio).
- `frontend/src/mocks/agenda.msw.test.ts`: `vi.useFakeTimers({ toFake: ["Date"] })` e `vi.setSystemTime(new Date("2026-11-24T15:00:00Z"))` no `beforeEach`, `vi.useRealTimers()` no `afterEach` (padrão de `AgendaPage.test.tsx` linhas 93-94); o teste da linha 21 passa a esperar `noClassDays[0].startsOn` = `"2026-11-27"` e as aulas dessa data canceladas.
- Outros que podem esperar "Sem aula" em hoje por causa do mock: `e2e/no-class-days.spec.ts` (usa `new Date()`), `e2e/portal-agenda.spec.ts`, `e2e/portal-inicio.spec.ts`, `e2e/portal-avisos.spec.ts` e casos de `frontend/visual/` (`telas.visual.ts` já usa `page.clock.setFixedTime`). A fase 3 roda `grep -rn "Sem aula\|Feriado sint" frontend/e2e frontend/src frontend/visual`, ajusta os que falharem por causa da mudança e lista os demais.
- Reuso: padrão `vi.useFakeTimers({ toFake: ["Date"] })` de `AgendaPage.test.tsx`; `page.clock` do Playwright (`@playwright/test` ^1.64.1).
- Riscos: `page.clock.install` pode congelar timers e travar o MSW ou o roteador (teste trava); nesse caso, `page.clock.install` seguido de `page.clock.resume()`. A data fixa 27/11/2026 envelhece: com o relógio real fora dessa semana o mock deixa de mostrar "Sem aula" (aceito: testes que dependem dele fixam o relógio). Se um caso visual da agenda mudar, a fase 3 confere com `npm run test:visual:docker -- -g "<caso>"` e atualiza só a referência dele.

## 5. Tarefas

- [x] T1: reproduzir antes de mudar o código: segunda-feira falha, terça passa (`page.clock.install` temporário no spec) e registrar na issue — cobre CA1 — prova: `cd frontend && npx playwright test e2e/agenda.spec.ts` nos dois dias
- [x] T2: mock: `SYNTHETIC_HOLIDAY` fixa no lugar de "hoje" em `mockLesson` e em `noClassDays` do `GET /agenda`, comentários atualizados — cobre CA2 — prova: `cd frontend && npx vitest run src/mocks/agenda.msw.test.ts`
- [x] T3: `agenda.msw.test.ts` com data fixa e esperando 27/11; conferir `AgendaPage.test.tsx` — cobre CA4 — prova: `cd frontend && npx vitest run src/mocks/agenda.msw.test.ts src/features/agenda/AgendaPage.test.tsx`
- [x] T4: `agenda.spec.ts` com relógio fixo em segunda, terça e quarta — cobre CA3 — prova: `cd frontend && npx playwright test e2e/agenda.spec.ts` (três casos passam)
- [x] T5: achar e ajustar os testes que esperavam "Sem aula" em hoje por causa do mock; listar na issue os que dependem do dia da semana e não falham — cobre CA5 e CA6 — prova: `cd frontend && npm test` e `npx playwright test e2e/no-class-days.spec.ts e2e/portal-agenda.spec.ts e2e/portal-inicio.spec.ts e2e/portal-avisos.spec.ts`

## 6. Decisões

- D1: reproduzir pelo relógio do navegador (`page.clock`), porque o mock lê `Date` no navegador; alternativa descartada: mudar a data da máquina.
- D2 (muda o comportamento do mock; ajustada pela decisão do dono em 23/11/2026, antes: só relógio fixo e mock intocado): o dia sem aula do cenário é uma data fixa, 27/11/2026 (sexta, sem Jiu-Jitsu Adulto, que tem aula seg e qua); motivo: o mock não decide a agenda pelo dia de hoje, e a data cai na mesma semana de 23, 24 e 25/11. Alternativa: lançar a data como `MockDay` em `mockNoClassDays`, descartada porque `reset` zera a lista e `coveringDay` só cobre datas a partir de hoje, o que reintroduziria dependência do relógio.
- D3: a prova nos três dias está no próprio spec (um teste por data, 23, 24 e 25/11), commitada; o relógio do navegador é o que o mock lê, então vale como "relógio em cada dia". Alternativa: variar o relógio do Windows, descartada por ser frágil.
- D4: `AgendaPage.test.tsx` não muda: usa dados próprios (cenário de 11/11/2026) e não passa pelo mock.
- Suposição: o único teste que falha por dia da semana é este; se outro falhar na medição, vira issue `técnica` à parte (regra de autonomia 5), sem travar este item. Se a data fixa mudar algum caso visual da agenda, a fase 3 atualiza só a referência desse caso e registra o resultado.

## Construção

- T1 — reprodução antes do mock: `e2e/agenda.spec.ts` com `page.clock.install` → `npx playwright test e2e/agenda.spec.ts -g "Coordenador abre"`: 23/11 falhou (Jiu-Jitsu Adulto riscado/oculto), 24/11 e 25/11 passaram; sem relógio, a segunda real (23/11) também falhou. Registrado na issue #688.
- T2 — `frontend/src/mocks/handlers.ts`: `SYNTHETIC_HOLIDAY = "2026-11-27"` em `mockLesson` e em `noClassDays` do `GET /agenda`, três comentários atualizados — prova: `npx vitest run src/mocks/agenda.msw.test.ts` → passou.
- T3 — `frontend/src/mocks/agenda.msw.test.ts`: `vi.useFakeTimers({ toFake: ["Date"] })` + `setSystemTime(2026-11-24)`, espera `noClassDays[0].startsOn === "2026-11-27"` e aulas dessa data canceladas — prova: `npx vitest run src/mocks/agenda.msw.test.ts src/features/agenda/AgendaPage.test.tsx` → 40 passaram.
- T4 — `frontend/e2e/agenda.spec.ts`: um teste por dia (23, 24 e 25/11/2026) com `page.clock.install` — prova: `npx playwright test e2e/agenda.spec.ts` → 4 passaram (3 da agenda + 360 px).
- T5 — `frontend/src/mocks/cenarios-listas.msw.test.ts` (CA16 esperava 1 dia sem aula em "hoje" fixo 11/11; passa a pedir a semana de 27/11) — prova: `npm test` → 2995 passaram, 1 falhou (esse), corrigido e rodado de novo → 7 passaram; `npx playwright test e2e/no-class-days.spec.ts e2e/portal-agenda.spec.ts e2e/portal-inicio.spec.ts e2e/portal-avisos.spec.ts` → 21 passaram. Lista dos que dependem de data publicada na issue.
Regressão: `npm run lint` e `npm run typecheck` → limpos; `npm test` (exceto o ajuste acima) → verde. Não rodei `test:cov`, `build`, `e2e` completo nem o back-end (o item só muda mock e testes do front).
Desvios: a sexta 27/11 não tem aula ativa no mock (Boxe Noturno, sexta, está inativa), então "aulas dessa data canceladas" (CA2/CA4) é vazio; o teste confere `every` sobre o conjunto vazio e que hoje não vem cancelado. Atualização da issue por comentário.
Referências visuais: `frontend/visual/referencias/agenda-390-claro.png`, `agenda-390-escuro.png`, `agenda-painel-1440-claro.png`, `agenda-painel-professor-1440-claro.png` (a aula de hoje deixou de nascer cancelada).
Visual do CI: agenda → passou; agenda-painel → passou; agenda-painel-professor → passou; aula-cancelar → passou (`npm run test:visual:docker -- -g "agenda|aula-cancelar"` → 24 passaram, depois de regerar as quatro referências).
Não é do item: `specs/backlog.md` e este arquivo (fase 2).

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-23, estado 8ade67b27335265508ad015d3927b20a6ef1815b

| Critério | Status | Evidência |
|---|---|---|
| CA1 | NÃO CONFERIDO (registro da Construção) | reprodução anterior à correção só vem do relato em "Construção"; não refeita (o código já está corrigido) |
| CA2 | PASSOU | `agenda.msw.test.ts` e `cenarios-listas.msw.test.ts` verdes; diff de `handlers.ts` usa `SYNTHETIC_HOLIDAY` em `mockLesson` e em `noClassDays` |
| CA3 | PASSOU | `npx playwright test e2e/agenda.spec.ts` → 23, 24 e 25/11 passam |
| CA4 | PASSOU | `npx vitest run src/mocks src/features/agenda` → 64 arquivos, 439 testes passaram |
| CA5 | NÃO PASSOU | passa só porque o relógio real é 23/11; ver achado 1 |
| CA6 | NÃO CONFERIDO | lista na issue não verificada aqui (sem acesso conferido); a lista deve incluir os e2e do achado 1 |

Comandos: vitest `src/mocks src/features/agenda` → 439 passaram; playwright `agenda`, `no-class-days`, `portal-agenda`, `portal-inicio`, `portal-avisos` → 25 passaram (relógio real 23/11); `npm run test:visual:docker -- -g "agenda|aula-cancelar"` → 24 passaram (agenda, agenda-painel, agenda-painel-professor, aula-cancelar). Não rodei `npm test` inteiro, lint, typecheck nem `test:cov`.
Achados:
- obrigatório, código, `frontend/e2e/portal-agenda.spec.ts` linha ~86 (`getByText("Sem aula")`) e `frontend/e2e/portal-inicio.spec.ts` linha ~33 (`getByText("Sem aula", { exact: true })`) — esperado: passar em qualquer dia (o item troca "hoje" por 27/11 fixo, e o plano diz que testes que dependem dele fixam o relógio); observado: os dois não fixam o relógio e leem a data real; "Sem aula" só existe no mock na semana de 27/11/2026 (`SYNTHETIC_HOLIDAY`), então passam hoje (23/11) por coincidência e passam a falhar a partir de segunda 30/11/2026 (ex.: portal-inicio mostra só as próximas aulas a partir de hoje); evidência: leitura do diff de `handlers.ts` (único uso de `SYNTHETIC_HOLIDAY`: `mockLesson` e `GET /agenda`) e `grep` sem `clock` nesses specs; não rodei com data posterior, é dedução do código; corrigir: `page.clock.install({ time: new Date("2026-11-24T12:00:00") })` nesses testes (e conferir `no-class-days.spec.ts` e o `portal-avisos.spec.ts`, que passam mas dependem de datas), listar na issue o que ficou.
- sugestão, código, `frontend/e2e/agenda.spec.ts` — `for ... test(...)` em linha única, difícil de ler; formato opcional.
- sugestão, especificação, "Desvios": sexta 27/11 sem aula ativa torna "aulas dessa data canceladas" um `every` sobre conjunto vazio; o teste não prova o cancelamento.

### Correção da rodada 1
- achado obrigatório (portal-agenda e portal-inicio dependiam da data real para "Sem aula") — arquivos: `frontend/e2e/portal-agenda.spec.ts` (os dois `@critical` que leem "Sem aula" ou trocam de dia) e `frontend/e2e/portal-inicio.spec.ts` (o `@critical` do aluno) com `page.clock.install({ time: new Date("2026-11-24T12:00:00") })` — prova: `npx playwright test e2e/no-class-days.spec.ts e2e/portal-agenda.spec.ts e2e/portal-inicio.spec.ts e2e/agenda.spec.ts` → 15 passaram, 3 rodadas seguidas; `portal-avisos.spec.ts` passou (não lê "Sem aula"); `npm run lint` e `npm run typecheck` limpos.
- `frontend/e2e/no-class-days.spec.ts`: só trocada a ordem das asserções finais (espera "Cancelada", que só vem depois do feriado confirmado, antes de "Sem aula", que o mock já mostra na semana de 27/11), para não depender da corrida. Tentei fixar o relógio nele; com 24/11 o feriado sugerido muda para uma semana de 2027 sem aula cancelada e o teste falha, então o relógio foi retirado. Ele segue dependendo da data real (usa `new Date()` e a lista de feriados sugeridos): fica na lista da issue como dependente de data que não falha hoje. Numa rodada paralela anterior, falhou uma vez em "Cancelada" (instável); sozinho e nas três rodadas finais passou.
- sugestões (formato do `for` do agenda.spec e `every` sobre conjunto vazio): não atendidas, opcionais.

### Rodada 2 — OK — 2026-11-23, estado b6632b981e3938c3a5582d151eabcfde4d1d8355

| Critério | Status | Evidência |
|---|---|---|
| CA1 | NÃO CONFERIDO (registro da Construção, mantido da rodada 1) | reprodução anterior à correção só vem do relato |
| CA2 | PASSOU (mantido da rodada 1) | `vitest run src/mocks src/features/agenda` → 64 arquivos, 439 testes |
| CA3 | PASSOU | `playwright test e2e/agenda.spec.ts` → 23, 24 e 25/11 passam |
| CA4 | PASSOU | idem CA2 |
| CA5 | PASSOU | `portal-agenda` e `portal-inicio` agora fixam o relógio em 24/11; 25 e2e passaram (agenda, no-class-days, portal-agenda, portal-inicio, portal-avisos) |
| CA6 | NÃO CONFERIDO | lista na issue não conferida aqui; `no-class-days.spec.ts` (depende da data real) deve constar |

Comandos: vitest mocks+agenda → 439 passaram; playwright dos 5 specs → 25 passaram; `npm run lint` e `npm run typecheck` limpos. Visual não rerodado: a rodada 2 só mudou e2e, nenhum código de tela ou mock.
Achados:
- achado obrigatório da rodada 1: resolvido (portal-agenda e portal-inicio com `page.clock.install`).
- sugestão, código, `no-class-days.spec.ts` segue dependente da data real (aceito, listado na issue); `every` sobre conjunto vazio em CA2/CA4 continua sem provar o cancelamento.

## Entrega

- O que muda: o mock deixa de tratar "hoje" como dia sem aula. O dia sem aula do cenário é a data fixa 27/11/2026 (`SYNTHETIC_HOLIDAY`, em `frontend/src/mocks/handlers.ts`), em `mockLesson` e no `noClassDays` do `GET /agenda`. O e2e da agenda roda um teste por dia (23, 24 e 25/11/2026) com `page.clock.install`. `agenda.msw.test.ts` fixa a data com `vi.setSystemTime` e espera 27/11. `portal-agenda.spec.ts` e `portal-inicio.spec.ts` fixam o relógio em 24/11.
- Verificação: rodada 2 `OK` (`estado b6632b981e3938c3a5582d151eabcfde4d1d8355`). Vitest de mocks e agenda: 439 testes passaram. Playwright de agenda, no-class-days, portal-agenda, portal-inicio e portal-avisos: 25 passaram. `npm run lint` e `npm run typecheck` limpos. Visual do CI: agenda, agenda-painel, agenda-painel-professor e aula-cancelar passaram (24 casos); referências regeradas só dessas quatro telas.
- Decisões: D2 (data fixa em vez de "hoje") e D3 (um teste por dia com relógio do navegador), registradas na seção 6. Dono decidiu corrigir a causa e usar relógio fixo (comentário na issue #688).
- Limitações: `CA1` (reprodução antes da correção) e `CA6` (lista de dependência de data na issue) ficaram `NÃO CONFERIDO` na verificação; a reprodução foi registrada na construção. `no-class-days.spec.ts` continua dependente da data real (não falha hoje; listado na issue). A data fixa 27/11/2026 envelhece: fora dessa semana o mock deixa de mostrar "Sem aula" e os testes que dependem dele precisam fixar o relógio.
- Regressão: `npm test` e `npm run lint`/`typecheck` rodados na construção; a base não avançou desde a verificação, então a regressão completa não foi refeita.
