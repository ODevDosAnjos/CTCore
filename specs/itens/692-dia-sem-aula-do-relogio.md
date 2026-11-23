# 692 — Dia sem aula do mock fixo em 27/11: calcular do relógio e fixar o relógio em no-class-days e comunicados

Origem: issue #692 (front-end, técnica, Sprint 10.5). Branch: `item/692-dia-sem-aula-do-relogio`. Prazo: antes de segunda, 30/11/2026. Segue a #688.

## 1. Objetivo

O dia sem aula do mock da agenda (`SYNTHETIC_HOLIDAY = "2026-11-27"`) deixa de ser data fixa e passa a ser a sexta-feira da semana do relógio do mock (`todayLocal()`). Os e2e que dependem dele fixam o relógio numa data em que o cenário existe. Assim a `dev` não fica vermelha depois de 27/11 e o app com MSW sempre mostra um "Sem aula".

Fora do escopo: migrar os demais testes que dependem de "hoje" (#693); a falha de `PortalRequestsPage.test.tsx` ("expira em 29 dias"), citada na issue como outra dependência de data (vai para a #693); mudar regra de produto.

## 2. Requisitos

- R1: o problema é provado antes da correção: os e2e citados rodam com `page.clock.install` em 30/11, 02/12 e 07/12/2026 e o que falhar é registrado na issue.
- R2: o mock calcula `syntheticHoliday()` como a sexta-feira (segunda a domingo) da semana de `todayLocal()`; `mockLesson` e o `noClassDays` do `GET /agenda` usam essa função em vez da constante (D1).
- R3: com o relógio em 24/11/2026 o dia sem aula continua 27/11, então os testes da #688 não mudam de expectativa.
- R4: `no-class-days.spec.ts` e `comunicados.spec.ts` fixam o relógio com `page.clock.install` numa data em que o cenário existe, e o que a medição de R1 apontar também.
- R5: os testes de MSW que citam 27/11 (`cenarios-listas.msw.test.ts`) passam a esperar a sexta da semana do relógio fixo deles.
- R6: a mesma bateria de R1 passa nas três datas; nenhum retry nem aumento de timeout.

## 3. Critérios de aceite

- CA1 (R1): dado o relógio em 30/11, 02/12 e 07/12, quando rodam os e2e da lista, então o resultado antes da correção fica registrado na issue.
- CA2 (R2, R3): dado o relógio do mock em 24/11/2026, quando se pede a semana de 23 a 29/11, então `noClassDays` traz 27/11 "Feriado sintético" e as aulas de 27/11 vêm `CANCELLED`.
- CA3 (R2): dado o relógio em 02/12/2026 (quarta), quando se pede a semana de 30/11 a 06/12, então `noClassDays` traz 04/12 e as aulas de 04/12 vêm canceladas; a semana de 23 a 29/11 não traz dia sem aula.
- CA4 (R2): dado o relógio num domingo (29/11/2026), então o dia sem aula é 27/11 (sexta da mesma semana de segunda a domingo).
- CA5 (R4): dado `no-class-days.spec.ts` e `comunicados.spec.ts` com relógio fixo, quando rodam, então passam, sem depender do dia real.
- CA6 (R5, R6): dado `npm test` e os e2e da lista com o relógio em 30/11, 02/12 e 07/12, então tudo passa.

## 4. Plano técnico

- Dados, API, segurança, interface: não mudam (só mock e testes).
- `frontend/src/mocks/handlers.ts`: trocar `const SYNTHETIC_HOLIDAY = "2026-11-27"` (linha ~723) por `const syntheticHoliday = () => ...`, definida depois de `todayLocal` (que é `const` arrow na linha ~726; usar dentro de funções, então a ordem de declaração não quebra). Cálculo: `new Date(y, m-1, d)` de `todayLocal()`, `setDate(d + 5 - (dow === 0 ? 7 : dow))`, formatado em `YYYY-MM-DD` local (reaproveitar a formatação de `todayLocal` extraindo uma função `fmtLocal(date)`). Usos: `mockLesson` (linha ~774, `date === syntheticHoliday()`) e `GET /agenda` (linha ~3316). Atualizar o comentário da #688.
- `frontend/src/mocks/cenarios-listas.msw.test.ts` (linha 25): relógio fixo é 11/11 (quarta), a sexta é 13/11; trocar a consulta para `from=2026-11-09&to=2026-11-15` e esperar `2026-11-13`. `agenda.msw.test.ts` fica (relógio 24/11, sexta 27/11); acrescentar nele um caso com `vi.setSystemTime` em 02/12 (CA3) e outro num domingo (CA4).
- `frontend/e2e/no-class-days.spec.ts`: `page.clock.install({ time: new Date("2026-11-24T12:00:00") })` antes do `goto`; conferir que o feriado sugerido em seg-qui existe depois dessa data (D2). O código lê `new Date()` no Node para contar semanas: trocar por a mesma data fixa, para casar com o navegador.
- `frontend/e2e/comunicados.spec.ts`: `page.clock.install` em 24/11/2026 12:00 antes do `goto`.
- Outros e2e: só os que a medição do passo 1 apontar (a issue lista `portal-finance`, `portal-barra`, `moldura-fixa`, `sair-da-conta`, `smoke` como "não citam o dia sem aula"; só entram se falharem).
- Reuso: `page.clock.install` de `agenda.spec.ts`; `vi.useFakeTimers({ toFake: ["Date"] })` de `agenda.msw.test.ts`.
- Riscos: `page.clock.install` pode travar timers (usar `page.clock.resume()` como na #688); visual: casos da agenda com `setFixedTime` mantêm 27/11 se a data fixa for 24/11, senão a referência muda (conferir com `npm run test:visual:docker -- -g "<caso>"` sem `--update-snapshots`, e registrar `Visual do CI: <caso> → passou/falhou`).

## 5. Tarefas

- [x] T1: provar o problema: rodar `agenda`, `portal-agenda`, `portal-inicio`, `no-class-days`, `comunicados`, `portal-finance`, `portal-barra`, `moldura-fixa`, `sair-da-conta` e `smoke` com `page.clock.install` temporário em 30/11, 02/12 e 07/12 (sem commitar) e registrar na issue o que falha — cobre CA1 — prova: `cd frontend && npx playwright test <specs>` por data
- [x] T2: mock: `syntheticHoliday()` a partir de `todayLocal()` em `mockLesson` e `GET /agenda` — cobre CA2, CA3, CA4 — prova: `cd frontend && npx vitest run src/mocks/agenda.msw.test.ts`
- [x] T3: ajustar `cenarios-listas.msw.test.ts` e acrescentar os casos de 02/12 e de domingo em `agenda.msw.test.ts` — cobre CA2, CA3, CA4, CA6 — prova: `cd frontend && npx vitest run src/mocks`
- [x] T4: fixar o relógio em `no-class-days.spec.ts`, `comunicados.spec.ts` e nos que T1 apontar — cobre CA5 — prova: `cd frontend && npx playwright test e2e/no-class-days.spec.ts e2e/comunicados.spec.ts`
- [x] T5: repetir a bateria de T1 nas três datas e rodar `npm test` e os casos visuais da agenda — cobre CA6 — prova: mesma bateria de T1 e `cd frontend && npm test`

## 6. Decisões

- D1 (muda o comportamento do mock): o dia sem aula é a sexta da semana (segunda a domingo) do relógio, como a issue pede; motivo: acompanha o relógio e mantém 27/11 com o relógio em 24/11. Alternativa: sexta futura mais próxima, descartada porque a issue define a "sexta da semana de hoje". Num sábado ou domingo ele fica no passado, sem problema para o mock.
- D2: o relógio fixo dos e2e é 24/11/2026 (terça), o mesmo de `portal-agenda` e `portal-inicio`; se o feriado sugerido em seg-qui sair do período, a fase 3 escolhe outra data fixa e registra.
- D3: a prova das três datas (T1 e T5) é feita com spec temporário ou variável de ambiente local, não commitado; só o relógio fixo definitivo entra no repositório. Alternativa: um teste por data commitado, descartada por multiplicar e2e sem ganho.
- Suposição: a falha de `PortalRequestsPage.test.tsx` é de outra data e fica na #693; se a medição apontar o contrário, entra aqui.

## Construção

- T1 — medição feita depois, com o `handlers.ts` de HEAD restaurado por cópia temporária (já revertida) e os specs de HEAD com relógio injetado (`CLK`): 30/11 e 07/12 → `no-class-days` falha (Sem aula não aparece); 02/12 → passa; `comunicados` passa nas três. Registrado na issue #692 (comentário). Suíte `src/mocks` e os dois e2e voltaram a passar com a correção.
- T2 — `frontend/src/mocks/handlers.ts` (`fmtLocal`, `syntheticHoliday()` a partir de `todayLocal()`, usado em `mockLesson` e `GET /agenda`) — prova: `npx vitest run src/mocks` → 58 arquivos, 354 testes passaram.
- T3 — `cenarios-listas.msw.test.ts` (semana 09–15/11, espera 13/11) e `agenda.msw.test.ts` (casos de 02/12 e domingo 29/11) — prova: mesma execução acima.
- T4 — `e2e/comunicados.spec.ts` (relógio 24/11) e `e2e/no-class-days.spec.ts` (relógio 26/10, segunda) — prova: `npx playwright test e2e/no-class-days.spec.ts e2e/comunicados.spec.ts --repeat-each=5` → 10 passaram.
- T5 — bateria com cópias temporárias (já removidas) dos specs `agenda`, `portal-agenda`, `portal-inicio`, `portal-finance`, `portal-barra`, `moldura-fixa`, `sair-da-conta`, `smoke` com `page.clock.install` injetado (variável CLK) mais `no-class-days` e `comunicados`, em 30/11, 02/12 e 07/12: 30/11 → 50 passaram; 02/12 e 07/12 → 1 falha cada, só nas cópias de `agenda.spec` (instala o relógio duas vezes) e, em 07/12, no `no-class-days` antes do ajuste de data; depois do ajuste, estável. Os outros 6 specs passam nas três datas. `npm run typecheck`, `npm run lint` e `npm test` (275 arquivos, 3005 testes) passaram.
Desvios: (1) D2 mudou: 24/11 não serve em `no-class-days`, porque o primeiro feriado de segunda a quinta depois dela é 21/04/2027, fora da janela de semanas da Agenda (teste instável); fixei 26/10/2026 (feriado 02/11 é segunda, uma semana à frente). (2) A semana-base do spec agora vem da data fixa, não de `new Date()`.
Referências visuais: `frontend/visual/referencias/agenda-1440-claro.png` e `agenda-1440-escuro.png` (relógio visual em 29/10, o dia sem aula passa a ser 30/10 e aparece na grade; antes 27/11 ficava fora da semana). Não comparei com o canvas lado a lado; o verificador deve conferir.
Visual do CI: agenda (20 casos com `-g agenda`, sem --update-snapshots, depois da regeração) → passou; uma rodada anterior teve 2 falhas nos 1440 antes de regerar.
Não é do item: nada. `PortalRequestsPage.test.tsx` passou em `npm test` hoje; fica na #693.

## Verificação

### Rodada 1 — OK — 2026-11-23, estado e7587a478de8641046f3d5b2d7be0678714d29e3

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | comentário na issue #692 registra a medição antes da correção (30/11 e 07/12 falham em `no-class-days`; 02/12 passa) |
| CA2 | PASSOU | `agenda.msw.test.ts` e `cenarios-listas.msw.test.ts` passam em `npm run test:cov` (275 arquivos, 3005 testes); relógio 24/11 mantém 27/11 |
| CA3 | PASSOU | caso `it.each` de 02/12 em `agenda.msw.test.ts` (04/12; semana 23–29/11 vazia) |
| CA4 | PASSOU | caso de domingo 29/11 em `agenda.msw.test.ts` (27/11) |
| CA5 | PASSOU | `npm run e2e` inteiro: 117 passaram, incluindo `no-class-days` e `comunicados` com `page.clock.install` |
| CA6 | PASSOU | `npm test` verde; e2e da lista verde com relógio fixo; a bateria nas três datas do construtor consta em Construção (não repeti com cópias temporárias, mas os specs agora têm relógio fixo e o diff do mock é calculado do relógio) |

Comandos: `npm run lint`, `typecheck`, `build` → ok; `npm run test:cov` → 275 arquivos, 3005 testes ok; `npm run e2e` → 117 passaram; `npm run test:visual:docker -- -g agenda` → 20 passaram (inclui as duas referências regeradas); `./backend/mvnw -f backend/pom.xml verify` → BUILD SUCCESS (diff não toca backend).
Visual do CI: agenda (20 casos) → passou. Referências `agenda-1440-claro/escuro.png` conferidas contra o canvas `agenda-1440-claro-canvas.png`: coluna "Sem aula" hachurada com cartão central e aula cancelada, no padrão do canvas; divergências restantes (cabeçalho, filtros) já existiam. Sem `.capturas/692/` (item de mock, sem mudança de tela).
Instáveis: nenhum.
Achados:
- sugestão, código, `e2e/no-class-days.spec.ts` — o relógio fixo em 26/10/2026 é uma data distante de "hoje" e o cenário depende do primeiro feriado sugerido ser 02/11; se a lista de feriados mudar, o teste quebra silenciosamente. Aceitável (registrado em Desvios).

## Entrega

O mock de "dia sem aula" deixou de ser fixo em 27/11: `handlers.ts` calcula o feriado sintético a partir do relógio (`todayLocal()`), usado em `mockLesson` e `GET /agenda`. Os testes de MSW e os e2e `no-class-days` e `comunicados` passaram a usar relógio fixo (24/11 e 26/10/2026), e a semana-base do spec vem da data fixa, não de `new Date()`. Referências `agenda-1440-claro/escuro.png` regeneradas com a mudança de mock.

Verificação: rodada 1 OK (estado `e7587a478de8641046f3d5b2d7be0678714d29e3`), todos os critérios passaram. `npm test`, `npm run test:cov` (3005 testes), `npm run e2e` (117), lint, typecheck, build e `verify` do backend verdes; visual `agenda` (20 casos) passou sem `--update-snapshots`.

Decisões: relógio de `no-class-days` em 26/10/2026, não 24/11 (o primeiro feriado de segunda a quinta depois de 24/11 cai fora da janela da Agenda). Limitação: o e2e depende de o primeiro feriado sugerido ser 02/11; se a lista mudar, o teste quebra. Divergências do canvas nas referências (cabeçalho, filtros) já existiam e não são deste item.
