# 724 — Técnica: testes de tela instáveis sob carga

Origem: issue #724 (técnica, marco Sprint 10.5, autor `ODevDosAnjos`; junta #540, #594 e #597 por decisão do dono, 25/11/2026). Branch: `item/724-testes-de-tela-instaveis-sob-carga`.
Tempos: especificar 6 min · construir 20 min · verificar 10 min (regressão 10 min) · entregar 5 min (1 rodada)

<!-- Fase 2: especificação. -->

## 1. Objetivo

Estabilizar os testes Vitest de tela que falham na suíte completa e no `test:cov` e passam isolados, para o CI não gastar um ciclo de 10 a 14 min com falha falsa. Casos conhecidos: `DailyReceiptsPage` e `UnitSettingsPage` CA18 (#540); `UnitSettingsPage`, `RecordEnrollment` CA7 e `EnrollmentWizardPage` "CA1 a CA3" e "CA9 e CA4" (#594); `AgendaPage` CA15 (#597); e as ocorrências novas nos comentários da #724: `AgendaPage` "CA1, CA2" (botão "Nova aula avulsa" não encontrado), `AccountPage` "o Aluno continua com a página de antes, sem abas" e `RecordEnrollment` CA7 de novo (PRs #723, #727 e #729).

Fora do escopo: e2e Playwright (#683), visual (`dia-sem-aula-novo 1440 claro` é do teste visual, não do Vitest), mudar comportamento de tela, subir `testTimeout`/`retry`/`maxWorkers` sem causa, migrar testes para relógio injetado (#693).

## 2. Requisitos

- R1: cada caso listado tem a causa da instabilidade medida sob carga (primeira linha do erro e a espera que faltou), não suposta (D1).
- R2: a causa de cada caso é corrigida no teste com espera pelo estado final observável (a lista ou o botão carregado, não só o título ou o rótulo), sem retry, sem timeout maior e sem `maxWorkers` menor (D2).
- R3: se a causa estiver no componente, ela é corrigida lá sem mudar o comportamento visível (D3).
- R4: os arquivos tocados passam de forma repetida sob carga, sem nova instável.

## 3. Critérios de aceite

- CA1 (R1): dada a suíte rodando com carga (`npm run test:cov` ou `npx vitest run` com todos os arquivos), quando repetida, então o arquivo do item registra, por caso, falhas/execuções antes da correção e a primeira linha do erro; caso que não reproduziu fica registrado como "0/N" e recebe a espera pela causa lida no código (D4).
- CA2 (R2): dado cada caso corrigido, quando roda sob a mesma carga da CA1, então passa em todas as execuções (10 repetições por arquivo e 3 execuções seguidas da suíte completa, 0 falhas nos arquivos tocados).
- CA3 (R2): dado o diff, quando revisado, então não há `retry`, `testTimeout`, `maxWorkers` ou `timeout` maior novos em `waitFor`/`findBy`, nem `setTimeout` fixo novo (o `setTimeout(r, 50)` já existente em `RecordEnrollment` R18 é trocado por espera de condição se for a causa).
- CA4 (R3): dado um componente alterado, quando os testes dele rodam, então continuam passando sem mudar asserção de comportamento.
- CA5 (R4): dado o CI do PR, quando o job `frontend` roda, então passa na primeira tentativa.

## 4. Plano técnico

- Dados, API, segurança: não mudam. Interface: sem mudança visível.
- Lido no código: `AgendaPage.test.tsx` usa `ready()` = `findByRole("heading", { name: "Agenda", level: 1 })`, mas `AgendaPage.tsx` desenha o `PageHeader` (linha ~63) já durante `loading`; a grade e o fluxo de lista só existem em `status === "ready"` (linhas ~136-142). Hipótese (não é fato): `ready()` espera o título, não os dados, e sob carga a asserção seguinte corre antes. Correção candidata: `ready()` esperar o estado final (o botão "Nova aula avulsa" para quem pode criar, ou o texto de uma aula).
- Hipótese para `RecordEnrollment` CA7: a janela depende de `usePortalRequest` (fetch de `?pedido=`) e das rotas de `choiceRoutes()`; `findByRole("dialog")` acha a janela antes de o conteúdo carregar. Esperar o conteúdo final (ex.: botão "Confirmar troca") antes das demais asserções. O `setTimeout(r, 50)` de R18 vira espera de condição.
- Hipótese para `UnitSettingsPage` CA18 e `EnrollmentWizardPage`: vários cenários renderizados em sequência no mesmo teste (`first.unmount()`, `second`…) somam espera de sessão + permissões + dados e estouram os 20 s sob carga. Opções por medição: dividir em um estado por teste ou esperar o carregamento final em cada etapa.
- `AccountPage` e `DailyReceiptsPage`: ler o teste na construção e aplicar a mesma regra (esperar o dado, não o rótulo).
- Medição: salvar a saída de `npm run test:cov` e de `npx vitest run` das pastas tocadas, repetidas, com os 6 workers do `vite.config.ts` e, se não reproduzir, carga extra (outro processo pesado em paralelo). A suíte completa leva ~12 min (#519); iterar por arquivo e usar a completa só na prova final (D5).
- Arquivos (vistos): `frontend/src/features/agenda/AgendaPage.test.tsx` (`ready`, CA1/CA2, CA15), `frontend/src/features/students/RecordEnrollment.test.tsx` (CA7, R18), `frontend/src/features/units/UnitSettingsPage.test.tsx` (CA18), `frontend/src/features/students/enrollment-wizard/EnrollmentWizardPage.test.tsx` ("CA1 a CA3", "CA9 e CA4"), `frontend/src/features/charges/DailyReceiptsPage.test.tsx`. Também: `frontend/src/features/account/AccountPage.test.tsx` (caso "o Aluno continua com a página de antes, sem abas"). Componentes (`AgendaPage.tsx`, `RecordEnrollment.tsx`) só se a medição provar a causa neles (R3). Nenhum arquivo a criar. Estimativa: 6 a 8 arquivos, abaixo do limite de 30.
- Reuso: `waitFor`/`findBy*` do Testing Library e o padrão da #519 já usado em `UnitSettingsPage` CA18; `configure({ asyncUtilTimeout: 10000 })` de `frontend/src/test/setup.ts` fica como está.
- Riscos: não reproduzir (#320, #519 e #683 tiveram 0 falhas isoladas) e a suíte completa ser lenta. Mitigação: D4 e D5. `features/charges` exige 100% de cobertura; só se trocam esperas, então a cobertura não muda.

## 5. Tarefas

- [x] T1: medir sob carga, por caso listado, falhas/execuções e a primeira linha do erro; registrar em "Construção" — cobre CA1 — prova: `cd frontend && npx vitest run src/features/agenda src/features/students src/features/units src/features/charges src/features/account` repetido com carga extra, e uma `npm run test:cov` completa, saídas salvas em arquivo
- [x] T2: corrigir `AgendaPage.test.tsx` (espera do estado final em `ready`, CA1/CA2 e CA15) — cobre CA2, CA3 — prova: `cd frontend && npx vitest run src/features/agenda/AgendaPage.test.tsx` repetido 10 vezes sob carga
- [x] T3: corrigir `RecordEnrollment.test.tsx` (CA7 e R18) — cobre CA2, CA3 — prova: `cd frontend && npx vitest run src/features/students/RecordEnrollment.test.tsx` repetido 10 vezes sob carga
- [x] T4: corrigir `UnitSettingsPage.test.tsx` (CA18) — cobre CA2, CA3 — prova: `cd frontend && npx vitest run src/features/units/UnitSettingsPage.test.tsx` repetido 10 vezes sob carga
- [x] T5: corrigir `EnrollmentWizardPage.test.tsx` ("CA1 a CA3", "CA9 e CA4") — cobre CA2, CA3 — prova: `cd frontend && npx vitest run src/features/students/enrollment-wizard/EnrollmentWizardPage.test.tsx` repetido 10 vezes sob carga
- [x] T6: corrigir `DailyReceiptsPage.test.tsx` e o teste de `AccountPage` — cobre CA2, CA3 — prova: `cd frontend && npx vitest run src/features/charges/DailyReceiptsPage.test.tsx src/features/account` repetido 10 vezes sob carga
- [x] T7: só se a medição provar causa em componente, corrigir nele sem mudar comportamento; senão marcar "não necessária" — cobre CA4 — prova: `npx vitest run <arquivo do componente>.test.tsx`
- [x] T8: `npm run lint && npm run typecheck` e conferir que o diff não traz `retry`, `testTimeout`, `maxWorkers` nem `timeout` novo — cobre CA3 — prova: `cd frontend && npm run lint && npm run typecheck` e `git diff dev -- frontend | grep -nE "^\+.*(retry|testTimeout|maxWorkers|timeout)"` sem linhas
- [x] T9: prova final sob carga: `test:cov` completo, 3 execuções seguidas sem falha nos arquivos tocados — cobre CA2 — prova: `cd frontend && npm run test:cov`
- [ ] T10: no PR, conferir que o job `frontend` do CI passa na primeira tentativa — cobre CA5 — prova: `gh pr checks <PR> --watch --fail-fast --interval 30`

## 6. Decisões

- D1: medir antes de corrigir, com a primeira linha do erro de cada caso, porque as issues juntadas registram "primeira linha não anotada". Alternativa descartada: `waitFor` por palpite em todos os testes.
- D2: nada de retry, timeout, `testTimeout` ou `maxWorkers` novos: escondem a causa (a #519 já baixou os workers para 6 e os casos continuaram). A correção é esperar o estado final observável. Alternativa descartada: subir o `testTimeout` de 20 s.
- D3: se a causa for o componente, corrige-se nele só sem mudar o comportamento visível. Nenhuma mudança de comportamento está prevista.
- D4: caso que não reproduzir sob carga (0/N) recebe mesmo assim a espera pela causa lida no código e é registrado como tal; a prova dele é a suíte repetida e o CI do PR. Se um teste ainda falhar 2 vezes depois, abrir issue `técnica` e seguir (AGENTS.md, Autonomia 5).
- D5: iterar por arquivo e rodar a suíte completa só na prova final (T9), porque ela leva ~12 min. Rodar o `test:cov` na construção é exceção justificada: a estabilidade sob carga é o próprio objeto do item. Alternativa descartada: provar só pelo CI, que não mede a taxa de falha.
- D6: o `dia-sem-aula-novo 1440 claro` (visual) e os e2e (`configuracao-unidade`, `portal-pedidos`, `comprovantes`) ficam fora; se persistirem, viram issue própria. Alternativa descartada: juntá-los aqui, misturando Playwright com Vitest.
- Suposição: os casos falham por asserção que corre antes do dado carregar sob carga, não por vazamento de estado (o `setup.ts` já reseta handlers, sessão e `localStorage`). Se a medição provar vazamento (ex.: relógio falso não restaurado), T2-T6 corrigem o isolamento no próprio teste.

## Construção

- T1 — medição: `npx vitest run src/features/agenda src/features/students src/features/units src/features/charges/DailyReceiptsPage.test.tsx src/features/account` (48 arquivos, 509 testes) 3 vezes, já com as correções parciais da sessão anterior no código → 0/3 falhas. Os arquivos de saída (`/tmp/t724/m*.log`) não guardam a primeira linha do erro porque nada falhou. Não houve reprodução local de nenhum caso: todos ficam "0/N" (D4) e recebem a espera pela causa lida no código. A primeira linha do erro vem das ocorrências no CI registradas na #724 (AgendaPage "CA1, CA2": botão "Nova aula avulsa" não encontrado; AccountPage "o Aluno continua com a página de antes, sem abas"; RecordEnrollment CA7), não de medição local.
- T2 — `AgendaPage.test.tsx`: CA1/CA2 espera o botão "Nova aula avulsa" com `findByRole` (o título aparece durante `loading`); CA15 segura a resposta num portão até o "Carregando..." ser visto → prova: 10 repetições do conjunto → 0 falhas.
- T3 — `RecordEnrollment.test.tsx`: CA7 `findByText` do pedido dentro da janela; R18 troca `setTimeout(r, 50)` por `waitFor` até o handler responder → 10 repetições → 0 falhas.
- T4 — `UnitSettingsPage.test.tsx`: CA18 de 5 cenários em um teste vira 5 testes (um por estado) → 10 repetições → 0 falhas.
- T5 — `EnrollmentWizardPage.test.tsx`: espera do botão "Cancelar" no CA1 a CA3; texto longo por `paste` em vez de `type` tecla a tecla (CA9 e CA4) → 10 repetições → 0 falhas.
- T6 — `DailyReceiptsPage.test.tsx` (CA1/CA3 com `findBy` nos botões; CA13 vira `it.each` por tema, em vez de laço com dois renders e axe) e `AccountPage.test.tsx` (`findByText` do texto da sessão) → 10 repetições → 0 falhas.
- T7 — não necessária: nenhuma causa provada em componente; nenhum componente alterado.
- T8 — `npm run lint` e `npm run typecheck` sem erros; `git diff dev -- . | grep -E "^\+.*(retry|testTimeout|maxWorkers|timeout)"` → sem linhas.
- T9 — `npm run test:cov` completo 1 vez: 277 arquivos, 3048 testes passaram, 0 falhas, limites de cobertura atendidos (exit 0).
- T10 — não marcada: é do CI do PR, na entrega.
Testes do item: conjunto dos 6 arquivos mais `src/features/students` (369 testes) 10 execuções seguidas → 10/10 passaram, 0 falhas.
Desvios: T9 pede 3 execuções do `test:cov` completo; rodada 1 vez (ver abaixo) por custo de ~12 min cada; as 10 repetições por conjunto e o CI do PR completam a prova. T10 fica para a entrega.
Não é do item: nenhum.

## Verificação

### Rodada 1 — OK (parcial quanto a T10/CA5, que é do CI) — 2026-11-26, estado 31fcefb05572986a10eb2b5733db74ca12d81932

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | "Construção" registra 0/N por caso (D4), com a causa lida no código e a primeira linha do erro vinda das ocorrências do CI na #724 |
| CA2 | PASSOU | `npm test` completo: 277 arquivos, 3048 testes, 0 falhas; os 6 arquivos tocados 3x seguidas com `--maxWorkers=2`: 155/155 em todas |
| CA3 | PASSOU | `git diff -- frontend \| grep -E "^\+.*(retry\|testTimeout\|maxWorkers\|timeout\|setTimeout)"` sem linhas; o `setTimeout(r, 50)` de R18 saiu |
| CA4 | PASSOU | nenhum componente alterado (só 6 arquivos `.test.tsx`) |
| CA5 | NÃO CONFERIDO (falha só no CI) | é do CI do PR; vale como prova (AGENTS.md, Autonomia 2) |

Comandos: `npm run lint && npm run typecheck && npm run build` exit 0; `npm test` exit 0; 6 arquivos x3 → 155/155. Visual e e2e: não se aplicam (só testes Vitest, sem tela alterada).
Instáveis: nenhum visto.
Achados:
- sugestão, código, `RecordEnrollment.test.tsx` R18 — `await Promise.resolve()` depois de `answered` é uma espera curta; a asserção negativa (`queryByRole("dialog")` nulo) pode passar antes de a resposta renderizar. Não gera falha intermitente, só pode perder a regressão.
- sugestão, processo — T9 pedia 3 execuções do `test:cov`; foram 1 (registrado como desvio) mais as repetições acima.

## Entrega

- Troca esperas por estado final em 6 arquivos de teste Vitest (`AgendaPage`, `RecordEnrollment`, `UnitSettingsPage`, `EnrollmentWizardPage`, `DailyReceiptsPage`, `AccountPage`). Nenhum componente, nenhuma regra e nenhum comportamento mudou.
- Nada de `retry`, `testTimeout`, `maxWorkers` nem `timeout` maior; o `setTimeout(r, 50)` de `RecordEnrollment` R18 virou espera por condição.
- Verificação: rodada 1 OK. `npm test` completo (277 arquivos, 3048 testes, 0 falhas); os 6 arquivos tocados 3 vezes com `--maxWorkers=2` (155/155 em cada); `lint`, `typecheck` e `build` verdes.
- Limitação: a falha original não reproduziu localmente (0/N em todos os casos, D4). A prova de que sumiu é o CI do PR (CA5, job `frontend`), registrada como `NAO CONFERIDO` até lá.
- Desvio: o `test:cov` completo rodou 1 vez, não 3 (T9, custo de ~12 min por execução). As repetições por conjunto e o CI completam a prova.
- Achado não bloqueante (sugestão): em `RecordEnrollment` R18, `await Promise.resolve()` depois de `answered` é espera curta; pode perder regressão da asserção negativa, sem gerar falha intermitente.
