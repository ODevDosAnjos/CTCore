# 528 — Técnica · Teste visual em paralelo no CI

Origem: issue #528 (Sprint 10.5, etiqueta `técnica`, autor `ODevDosAnjos`). Branch: `item/528-teste-visual-em-paralelo`.

## 1. Objetivo

Reduzir o tempo do job `visual` do CI (hoje 13 a 16 min, 810 a 830 s só no `npm run test:visual`) para 11 min ou menos (D8(c), D9; a meta já foi 7 e 9 min), rodando os 356 casos de `frontend/visual/telas.visual.ts` em paralelo. Para o time: o `visual` deixa de definir o tempo total do CI. Fora do item: regerar referências, mexer em cache, jobs de imagem, filtro por pasta ou na renderização das telas.

## 2. Requisitos

- R1: `frontend/playwright.visual.config.ts` liga `fullyParallel: true`.
- R2: no CI usa `workers: 2` (D6); fora do CI, o padrão do Playwright (`undefined`). O motivo (2 dos 4 vCPUs do runner; o resto fica para o Vite e o navegador) fica comentado na configuração.
- R3: nenhuma referência em `frontend/visual/referencias` muda; qualquer diferença de print é instabilidade, não mudança visual.
- R4 (ajustado, D7): além da configuração, só muda `abrir()` em `frontend/visual/telas.visual.ts` (R6); cache, jobs de imagem e filtro por pasta ficam como estão.
- R5: o tempo do `visual` antes e depois fica registrado na descrição do PR.
- R6 (novo, D7): em `abrir()`, o primeiro `assentar()` só roda quando há passos (`passos.length > 0`); a espera da lista de sessões em `/conta` e o resto ficam como estão.

## 3. Critérios de aceite

- CA1 (R1, R2): dado o arquivo de configuração, então contém `fullyParallel: true` e `workers: process.env.CI ? 2 : undefined`, com comentário do motivo.
- CA2 (R3, R4, ajustado, D7): o diff do PR altera só `frontend/playwright.visual.config.ts` e `frontend/visual/telas.visual.ts` (mais este arquivo do item); nenhum `.png` alterado.
- CA3 (R3, ajustado, D3): o job `visual` do CI do PR, com `workers: 2`, passa sem diferença de print, e nenhum `.png` de `frontend/visual/referencias` aparece alterado. A prova é o CI do PR (autonomia 2), não a execução local. (Texto anterior: `test:visual:docker` local 2 vezes seguidas.)
- CA4 (ajustado, D8): CI do PR verde (`ci-gate`), com o job `visual` em 11 min ou menos, com 2 workers (D8(c), D9). Medições no D9.
- CA6 (R6, novo, D7): dado `abrir()` em `telas.visual.ts`, então o primeiro `assentar()` só é chamado quando `passos.length > 0`, o segundo e a espera de `/conta` continuam, e nenhum `.png` muda.
- CA5 (R5): a descrição do PR traz o tempo do `visual` antes (13 a 16 min, runs 42505900681, 42490683846 e 42497574697) e depois.

## 4. Plano técnico

- **Dados / API / Segurança.** Não mudam.
- **Front-end (teste visual).** `frontend/playwright.visual.config.ts` (visto): acrescentar `fullyParallel: true` e `workers: process.env.CI ? 2 : undefined` ao `defineConfig`, com comentário. Cada teste de `visual/telas.visual.ts` já é independente (MSW vive na página; relógio fixo por `page.clock.setFixedTime`), então não há mudança nos testes.
- **Ajuste D7.** `frontend/visual/telas.visual.ts` (visto), função `abrir()`: o primeiro `assentar(page, perfil)` (antes do `for` dos passos) passa a `if (passos.length > 0)`; o segundo e a linha de `/conta` ficam. Risco: caso sem passos que dependia desse `networkidle` extra oscilar; a prova é o CI, e a regra de decisão está em D8.
- **Infra.** `.github/workflows/ci.yml` (job `visual`, `timeout-minutes: 20`) não muda; manter o limite, o tempo menor só dá folga.
- **Riscos.** (1) Instabilidade sob carga (3 workers oscilou; ficou 2): a espera fixa de 300 ms em `abrir()` (`telas.visual.ts`, linha 52) pode oscilar sob carga. Mitigação da issue: baixar para 2 workers e medir de novo; se continuar instável, PARAR e mostrar quais casos oscilaram. (2) `test:visual:docker` local usa `workers` padrão (metade dos núcleos), podendo diferir do CI; a prova local vale pelo ausência de diferença, não pelo tempo. (3) `--update-snapshots` em paralelo continua válido.

## 5. Tarefas

- [x] T1: Editar `frontend/playwright.visual.config.ts` com `fullyParallel` e `workers` e o comentário do motivo — cobre CA1, CA2 — prova: `grep -n "fullyParallel\|workers" frontend/playwright.visual.config.ts` e `git diff --stat`.
- [x] T2 (ajustada, D3): a execução local do `test:visual:docker` já foi feita na construção e vale só como informação; não é mais prova do CA3. Nenhuma ação nova — cobre CA3 — prova: `git status` sem `.png` alterado.
- [ ] T3 (ajustada, D3, D4): (D6) `workers` do CI em 2 (comentário e CA1 dizem 2); rodar o CI do PR; se oscilar em casos que não sejam `conta-*`, PARAR e mostrar os casos — cobre o risco 1 e CA3 — prova: `gh run view <run> --log-failed` com a lista dos casos.
- [x] T5 (novo, D7): em `frontend/visual/telas.visual.ts`, `abrir()`, trocar a linha `await assentar(page, perfil);` anterior ao `for (const p of passos)` por `if (passos.length > 0) await assentar(page, perfil);`, ajustando o comentário (só serve para evitar a rolagem errada no clique); manter a espera da lista de sessões em `/conta` e o segundo `assentar()` — cobre CA6, CA2 — prova: `cd frontend && npx tsc --noEmit && npx eslint visual/telas.visual.ts` e `git diff --stat` sem `.png`.
- [x] T6 (novo, D9): voltar `workers` do CI para 2 em `frontend/playwright.visual.config.ts` (valor e comentário: 2 dos 4 vCPUs; 3 workers não ganharam de 2, D9) — cobre CA1 — prova: `grep -n "workers" frontend/playwright.visual.config.ts` e `cd frontend && npx tsc --noEmit && npx eslint playwright.visual.config.ts`.
- [ ] T4 (ajustada, D8, D9): registrar na descrição do PR o tempo de cada medição do D9 e por que a meta mudou; `ci-gate` verde; `visual` em 11 min ou menos (CA4) — cobre CA3, CA4, CA5 — prova: `gh pr checks` e a duração do job `visual`. É da fase de entrega, junto de T3.

## 6. Decisões

- D1: começou em `workers: 3` conforme a issue; recuou para 2 (D4, D6). Alternativa: dividir o arquivo em vários (mais invasivo, não pedido).
- D2: não trocar a espera fixa de 300 ms nesta entrega; só entra em jogo se houver oscilação (a issue manda parar e mostrar os casos).
- D3 (ajuste, resposta do dono, opção 1): o CI do PR é a prova do CA3; o `visual-docker.sh` (`test:visual:docker`) não muda e não passa `CI=1`. Motivo: a execução local não exercita os `workers` do CI, e a autonomia 2 aceita o CI como prova. Alternativa descartada: passar `CI=1` no script local.
- D4 (ajuste, resposta do dono): na entrega, abrir o PR e medir o `visual` no CI com 3 workers; se oscilar, 2 workers; se continuar instável com 2, PARAR e mostrar os casos. O tempo medido vai para o PR.
- D5 (ajuste): a oscilação local de `conta-duas-etapas` (1440 claro no #526, 1440 escuro na execução local do #528) é pré-existente e virou a issue #530 (técnica, Sprint 10.5); fica fora deste item e não bloqueia o CA3.
- D6 (ajuste, resposta do dono; muda o critério): CA4 passa de 7 para "job `visual` em 9 min ou menos" (a meta de 7 min era estimativa; medido: 3 workers 8 min 9 s, 2 workers 7 min 56 s, antes 13 a 16 min). O CI fica com 2 workers (mesmo tempo que 3, menos disputa de CPU). A #530 já está em `dev` (a214d51) e estabilizou `conta-*`; oscilação de `conta-*` deixa de ser motivo de parada deste item. Texto de CA1 e da Construção (T1) atualizado de 3 para 2 a pedido do dono.
- D7 (ajuste, resposta do dono ao parar no CA4; muda o escopo): a causa do tempo extra está no `abrir()` da #530: `assentar()` roda duas vezes em todo caso, e cada `networkidle` espera pelo menos 500 ms sem requisição. O primeiro só serve a casos com passos (evita a rolagem errada no clique). Entra no escopo: chamá-lo só com `passos.length > 0`, sem mexer no resto (a espera da lista de sessões em `/conta` fica). Continuar com 2 workers e medir o `visual` no CI do PR. Alternativas do dono descartadas: as 3 opções anteriores. Substitui a parte de D2 que dizia não mexer em `abrir()` (a espera fixa de 300 ms continua como está).
- D8 (ajuste, resposta do dono; muda o critério, precede D6 em caso de conflito): regra de decisão sem nova parada. (a) `visual` em 9 min ou menos e CI verde: merge com 2 workers. (b) Passou de 9 min: testar 3 workers uma vez; se ficar em 9 min ou menos, sem oscilar, merge com 3 (CA1 e o comentário passam a 3). (c) Se ainda passar de 9 min, ou oscilar com 3: voltar para 2 workers, CA4 vira "11 min ou menos", registrar no PR o tempo de cada medição e por que a meta mudou, e fazer o merge. Em todos os casos, o tempo de cada medição vai para a descrição do PR (R5, CA5).
- D9 (ajuste, resposta do dono, aplica D8(c); muda o critério): o job `visual` com 3 workers e T5 levou 10 min 11 s (testes 491 s, run 42534724284), sem oscilar, acima de 9 min; com 2 workers e T5, 10 min 8 s (testes 504 s, run 42533770714). Voltam 2 workers (T6), CA4 vira "11 min ou menos" e o merge segue. Medições do job `visual`: sequencial antes da #530 13 a 16 min (testes 810 a 830 s); sequencial depois da #530 14 min (PR #532); 3 workers antes da #530 8 min 9 s (testes 6,7 min); 2 workers antes da #530 7 min 56 s (testes 7,1 min); 2 workers depois da #530 9 min 4 s e 10 min 42 s (testes 8,8 min); 2 workers com T5 10 min 8 s; 3 workers com T5 10 min 11 s. Por que a meta mudou: a de 7 min era estimativa; as esperas novas da #530 (assentar a tela, imagens e animações, elemento final) valem para todos os casos e custam cerca de 1,7 min nos testes; o T5 tirou pouco; 3 workers não ganham de 2. Todas as medições vão para a descrição do PR (R5, CA5).
- Suposição: o runner `ubuntu-latest` tem 4 vCPUs; se tiver menos, o tempo muda e o resultado é registrado no PR.

## Construção

- T1 — arquivos: `frontend/playwright.visual.config.ts` (`fullyParallel: true`, `workers: process.env.CI ? 2 : undefined` (na entrega inicial era 3; ver "Correção da entrega"), comentário) — prova: `grep -n "fullyParallel\|workers"` mostra as duas linhas; `git diff --stat` mostra só esse arquivo (+3) → ok
- T2 (não marcada) — `npm run test:visual:docker` duas vezes, em `frontend/`, com o padrão de workers (12 núcleos na máquina): execução 1 reprovou 1 de 357 (`conta-duas-etapas 1440 escuro`, 12766 px, razão 0,01, sem mudança de código); execução 2 passou 357 de 357 (9,5 min). Nenhum `.png` alterado (`git status`). Houve oscilação, então CA3 não foi atendido.
- T3 (não marcada) — não rodou: o `test:visual:docker` local não passa `CI`, então `workers: 3` (ou 2) do CI não é exercitado localmente; baixar o valor do CI para 2 não muda o que a máquina mede. A oscilação vista foi com o padrão local (paralelismo maior que o do CI). Isso é parada prevista pela issue: mostrar o caso que oscilou. Caso: `conta-duas-etapas 1440 escuro`.
- T4 (não marcada) — é da fase de entrega (PR e CI).
Regressão: só o teste visual foi rodado (única área alterada, configuração do teste visual); resultado acima.
Desvios: tempo local de 9,5 a 10,7 min não serve de medida do CI.
Pedido de ajuste: CA3 — a prova local não reproduz a configuração do CI; decidir se o `visual-docker.sh` passa `CI=1` para a prova valer, ou se o CI do PR é a prova (autonomia 2).

Retomada: T1 e T2 conferidos pelo código (`git diff` só em `frontend/playwright.visual.config.ts`, +3 linhas; nenhum `.png` alterado). Pedido de ajuste do CA3 atendido pela fase 2 (D3). T3 e T4 dependem do CI do PR e são da fase de entrega (D4); ficam por marcar.

### Correção da entrega
- CI run 42514042113 reprovou `conta-codigos-reserva 1440 claro` (7802 px, 356 de 357 passaram, 6,7 min) com 3 workers; conforme D4/T3, `workers` do CI baixou para 2 — arquivos: `frontend/playwright.visual.config.ts` (valor e comentário) — prova: `tsc --noEmit` e `eslint` sem erro; a prova do CA3 é o CI de novo (T3 e T4 ficam por marcar até o run passar).
- Não marquei T3: o recuo só vale com o job `visual` verde. Se oscilar com 2 workers, PARAR e mostrar os casos (D4).
Desvios: CA1 e a seção Entrega ainda dizem 3 workers; passam a 2 (pedido do T3), a fase 2/5 deve atualizar o texto.

### Construção D7 (T5)
- T5 — arquivos: `frontend/visual/telas.visual.ts` (`abrir()`: primeiro `assentar()` só com `passos.length > 0`, comentário ajustado; segundo `assentar()` e espera de `/conta` mantidos) — prova: `cd frontend && npx tsc --noEmit && npx eslint visual/telas.visual.ts` → sem erro; `git status` sem `.png` alterado → ok
- T3 e T4 ficam por marcar: dependem do CI do PR (entrega, D8). Teste visual local não rodado (D3: a prova é o CI).

### Rodada 1 — OK — 2026-11-08, estado db0e540317570239a657b736819016458c5227b6

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | diff de `frontend/playwright.visual.config.ts` traz `fullyParallel: true`, `workers: process.env.CI ? 3 : undefined` e comentário do motivo |
| CA2 | PASSOU | `git diff --stat` contra a base: só a configuração e este arquivo; nenhum `.png` |
| CA3 | NÃO CONFERIDO (autonomia 2, D3) | a prova é o job `visual` do CI do PR, que ainda não existe; fase de entrega (T3/T4) |
| CA4 | NÃO CONFERIDO (autonomia 2) | depende do CI do PR |
| CA5 | NÃO CONFERIDO | descrição do PR, fase de entrega |

Comandos: `tsc --noEmit` e `eslint playwright.visual.config.ts` sem erro; `playwright test -c playwright.visual.config.ts --list` lista 357 testes (config válida). Não rodei o teste visual local (D3: não exercita os workers do CI; oscilação de `conta-duas-etapas` é a #530, fora do item).
Achados:
- sugestão, código, `telas.visual.ts` `abrir()` — espera fixa de 300 ms pode oscilar sob carga; só mexer se o CI do PR oscilar (D2/D4).

## Entrega

**O que muda:** `frontend/playwright.visual.config.ts` liga `fullyParallel: true` e, no CI, `workers: 2` (fora do CI, o padrão do Playwright). `frontend/visual/telas.visual.ts` (`abrir()`) chama o primeiro `assentar()` só quando há passos (D7). Nenhum print de referência, job ou script muda.

**Como foi verificado:** Rodada 4 da verificação, OK (estado 285e2a3b). A base (`dev`, a214d51) já está contida na branch, então a regressão não foi rodada de novo. Prova do CI no head cdea2f2 (run 42535669005): job `visual` passou sem diferença de print, `ci-gate` verde, `visual` em 10m47s.

**Tempo do `visual` (R5, CA5):** antes, 13 a 16 min (testes 810 a 830 s; runs 42505900681, 42490683846 e 42497574697). Depois, com 2 workers e `abrir()` ajustado: 10m47s (run 42535669005). Todas as medições estão no D9 do arquivo do item.

**Decisões:**
- Meta mudou de 7 para 11 min (D6, D8(c), D9): a de 7 min era estimativa. As esperas novas da #530 custam cerca de 1,7 min nos testes, e o ajuste de `abrir()` tirou pouco.
- Workers 2 no CI: 3 workers oscilaram no run 42514042113 (`conta-codigos-reserva 1440 claro`, 1 de 357) e não ganharam de 2 (10m11s contra 10m8s, D9).
- `visual-docker.sh` não passa `CI=1` (D3). A espera fixa de 300 ms em `abrir()` (D2) fica como está.

**Limitações:**
- O tempo ficou acima da meta original de 7 min (D9).
- O teste visual local não exercita o número de workers do CI (D3); a prova é o CI.
- A oscilação local de `conta-duas-etapas` é a #530, já em `dev`.
- A espera de 300 ms pode oscilar sob carga (risco 1). Se o CI oscilar, a regra é parar e mostrar os casos (D4).

**Verificações do PR (run 42535669005, head cdea2f2):** `ci-gate` e `visual` verdes; o commit desta entrega só muda a especificação do item.

### Rodada 2 — NAO_CONFERIDO — 2026-11-08, estado 7d42744b00a7b4854fc689d1bd2d70314bafe4ad

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | config traz `fullyParallel: true`, `workers: process.env.CI ? 2 : undefined` e comentário; texto do CA1 já diz 2 |
| CA2 | PASSOU | `git diff --stat a214d51 HEAD` fora de specs: só `frontend/playwright.visual.config.ts` (+3); nenhum `.png` alterado |
| CA3 | NÃO CONFERIDO (autonomia 2) | o único CI com 2 workers (run 42515008793, head e5118a5) reprovou 1 de 357: `conta-duas-etapas 1440 claro` (13098 px, 356 passaram, 7,1 min). Esse run é anterior ao merge da #530 (a214d51); o HEAD local 9ae2a64 não foi enviado, então não há CI do estado atual |
| CA4 | NÃO CONFERIDO | `ci-gate` vermelho no run 42515008793; falta CI verde no head atual |
| CA5 | NÃO CONFERIDO | descrição do PR #531, fase de entrega |

Comandos: `tsc --noEmit` e `eslint playwright.visual.config.ts` sem erro; `playwright test --list` lista 357 testes. Teste visual local não rodado (D3).
Achados:
- sugestão, processo — enviar o merge 9ae2a64 (traz a #530) e esperar o CI do PR; se `conta-*` ainda oscilar após a #530, mostrar ao dono (D6 só dispensa a parada para `conta-*` com a #530 aplicada).

### Rodada 3 — NAO_CONFERIDO — 2026-11-08, estado 0426c148d633ef7e57750cf4e3bef5196f7c882a

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU (mantido da rodada 2) | config com `fullyParallel: true`, `workers: process.env.CI ? 2 : undefined` e comentário do motivo; diff conferido |
| CA2 | PASSOU | `git diff --stat` contra a base: só `playwright.visual.config.ts`, `telas.visual.ts`, este arquivo e `specs/backlog.md` (linha do item); nenhum `.png` |
| CA6 | PASSOU | diff de `abrir()`: `if (passos.length > 0) await assentar(page, perfil);`; segundo `assentar()` e a espera de `/conta` intactos; `tsc --noEmit` e `eslint` sem erro |
| CA3 | NÃO CONFERIDO (autonomia 2, D3) | o CI do PR #531 (run 42531238718, head 9ae2a64) passou, mas é anterior ao T5: a mudança de `telas.visual.ts` está só na pasta de trabalho, sem commit/push; não há CI do estado atual |
| CA4 | NÃO CONFERIDO | no run 42531238718 `visual` = 10 min 42 s (sem T5), `ci-gate` verde; falta medir o estado com o T5 (meta D8: 9 min; ou 11 min com 2 workers) |
| CA5 | NÃO CONFERIDO | descrição do PR #531, fase de entrega |

Comandos: `tsc --noEmit` e `eslint visual/telas.visual.ts playwright.visual.config.ts` sem erro; `gh pr checks 531` (run 42531238718: tudo verde, `visual` 10m42s). Teste visual local não rodado (D3).
Achados:
- sugestão, processo — commitar/enviar o T5 e medir o `visual` no CI do PR; aplicar D8 (a/b/c) com o tempo medido e registrar cada medição na descrição do PR.

### Correção da entrega (D8)
- Run 42533770714 (head 7464e45, 2 workers, com T5): CI verde, `visual` 10 min 8 s, acima de 9 min; conforme D8(b), `workers` do CI sobe para 3 uma vez para medir — arquivos: `frontend/playwright.visual.config.ts` (valor e comentário) — prova: `tsc --noEmit` e `eslint` sem erro; a prova é o CI do PR de novo. Se `visual` ficar em 9 min ou menos sem oscilar, vale 3 (CA1 passa a 3); senão voltar a 2 e CA4 vira "11 min ou menos" (D8(c)).
- T3 e T4 ficam por marcar (CI do PR, entrega).
Desvios: CA1 e T1 ainda dizem 2 workers; a fase 2/5 atualiza se o 3 valer.

### Correção da entrega (D9, T6)
- T6 — arquivos: `frontend/playwright.visual.config.ts` (`workers: process.env.CI ? 2 : undefined`, comentário: 2 dos 4 vCPUs; 3 workers não ganharam de 2, D9) — prova: `grep -n workers` mostra o valor 2; `cd frontend && npx tsc --noEmit && npx eslint playwright.visual.config.ts` → sem erro → ok
- T3 e T4 ficam por marcar: dependem do CI do PR e da descrição (entrega, D8(c)/D9). Teste visual local não rodado (D3). Nenhum `.png` alterado.
Desvios: nenhum.

### Rodada 4 — OK — 2026-11-08, estado 285e2a3b827692fa45606735a2ddebe13101c2f3

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | config com `fullyParallel: true`, `workers: process.env.CI ? 2 : undefined` e comentário do motivo (2 dos 4 vCPUs; D9) |
| CA2 | PASSOU | `git diff --stat` contra a base: só `playwright.visual.config.ts`, `telas.visual.ts`, este arquivo e `specs/backlog.md`; nenhum `.png` |
| CA3 | PASSOU | run 42535669005 (head cdea2f2 = HEAD local, 2 workers): job `visual` pass, sem diferença de print, nenhum `.png` alterado |
| CA4 | PASSOU | mesmo run: `ci-gate` pass, `visual` 10m47s (meta D9: 11 min ou menos); `gh pr checks 531` tudo verde |
| CA5 | NÃO CONFERIDO (entrega) | corpo do PR #531 traz o "antes" (13 a 16 min e os 3 runs), mas ainda não traz o "depois" nem as medições do D9; é da fase de entrega (T4) |
| CA6 | PASSOU (mantido da rodada 3) | `abrir()`: `if (passos.length > 0) await assentar(page, perfil);`; segundo `assentar()` e espera de `/conta` intactos |

Comandos: `cd frontend && npx tsc --noEmit && npx eslint visual/telas.visual.ts playwright.visual.config.ts` sem erro; `gh pr checks 531` (run 42535669005, headSha cdea2f2, success). Teste visual local não rodado (D3).
Achados:
- sugestão, processo — atualizar a descrição do PR #531 com as medições do D9 e o motivo da mudança da meta (7, 9, 11 min); o texto atual ainda fala em 7 min e 3 workers (CA5).
