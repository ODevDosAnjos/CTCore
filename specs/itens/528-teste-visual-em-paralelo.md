# 528 — Técnica · Teste visual em paralelo no CI

Origem: issue #528 (Sprint 10.5, etiqueta `técnica`, autor `ODevDosAnjos`). Branch: `item/528-teste-visual-em-paralelo`.

## 1. Objetivo

Reduzir o tempo do job `visual` do CI (hoje 13 a 16 min, 810 a 830 s só no `npm run test:visual`) para 7 min ou menos, rodando os 356 casos de `frontend/visual/telas.visual.ts` em paralelo. Para o time: o `visual` deixa de definir o tempo total do CI. Fora do item: regerar referências, mexer em cache, jobs de imagem, filtro por pasta ou na renderização das telas.

## 2. Requisitos

- R1: `frontend/playwright.visual.config.ts` liga `fullyParallel: true`.
- R2: no CI usa `workers: 3`; fora do CI, o padrão do Playwright (`undefined`). O motivo (3 dos 4 vCPUs do runner; um fica para o Vite) fica comentado na configuração.
- R3: nenhuma referência em `frontend/visual/referencias` muda; qualquer diferença de print é instabilidade, não mudança visual.
- R4: nada além da configuração muda (cache, jobs de imagem, filtro por pasta ficam como estão).
- R5: o tempo do `visual` antes e depois fica registrado na descrição do PR.

## 3. Critérios de aceite

- CA1 (R1, R2): dado o arquivo de configuração, então contém `fullyParallel: true` e `workers: process.env.CI ? 3 : undefined`, com comentário do motivo.
- CA2 (R3, R4): o diff do PR altera só `frontend/playwright.visual.config.ts` (mais este arquivo do item); nenhum `.png` alterado.
- CA3 (R3, ajustado, D3): o job `visual` do CI do PR, com `workers: 3` (ou 2, se houver recuo), passa sem diferença de print, e nenhum `.png` de `frontend/visual/referencias` aparece alterado. A prova é o CI do PR (autonomia 2), não a execução local. (Texto anterior: `test:visual:docker` local 2 vezes seguidas.)
- CA4: CI do PR verde (`ci-gate`), com o job `visual` em 7 min ou menos.
- CA5 (R5): a descrição do PR traz o tempo do `visual` antes (13 a 16 min, runs 42505900681, 42490683846 e 42497574697) e depois.

## 4. Plano técnico

- **Dados / API / Segurança.** Não mudam.
- **Front-end (teste visual).** `frontend/playwright.visual.config.ts` (visto): acrescentar `fullyParallel: true` e `workers: process.env.CI ? 3 : undefined` ao `defineConfig`, com comentário. Cada teste de `visual/telas.visual.ts` já é independente (MSW vive na página; relógio fixo por `page.clock.setFixedTime`), então não há mudança nos testes.
- **Infra.** `.github/workflows/ci.yml` (job `visual`, `timeout-minutes: 20`) não muda; manter o limite, o tempo menor só dá folga.
- **Riscos.** (1) Instabilidade com 3 workers: a espera fixa de 300 ms em `abrir()` (`telas.visual.ts`, linha 52) pode oscilar sob carga. Mitigação da issue: baixar para 2 workers e medir de novo; se continuar instável, PARAR e mostrar quais casos oscilaram. (2) `test:visual:docker` local usa `workers` padrão (metade dos núcleos), podendo diferir do CI; a prova local vale pelo ausência de diferença, não pelo tempo. (3) `--update-snapshots` em paralelo continua válido.

## 5. Tarefas

- [x] T1: Editar `frontend/playwright.visual.config.ts` com `fullyParallel` e `workers` e o comentário do motivo — cobre CA1, CA2 — prova: `grep -n "fullyParallel\|workers" frontend/playwright.visual.config.ts` e `git diff --stat`.
- [x] T2 (ajustada, D3): a execução local do `test:visual:docker` já foi feita na construção e vale só como informação; não é mais prova do CA3. Nenhuma ação nova — cobre CA3 — prova: `git status` sem `.png` alterado.
- [ ] T3 (ajustada, D3, D4): se o job `visual` do PR oscilar com 3 workers, baixar `workers` do CI para 2 (comentário e CA1 passam a dizer 2) e rodar o CI de novo; se ainda oscilar, PARAR e mostrar os casos que oscilaram — cobre o risco 1 e CA3 — prova: `gh run view <run> --log-failed` com a lista dos casos.
- [ ] T4: abrir o PR, medir o job `visual` no CI e registrar o tempo antes/depois na descrição (`gh run view` do run do PR); `ci-gate` verde — cobre CA3, CA4, CA5 — prova: `gh pr checks` e a duração do job `visual`. É da fase de entrega, junto de T3.

## 6. Decisões

- D1: usar `workers: 3` no CI, conforme a issue; recuo previsto para 2 se instável. Alternativa: dividir o arquivo em vários (mais invasivo, não pedido).
- D2: não trocar a espera fixa de 300 ms nesta entrega; só entra em jogo se houver oscilação (a issue manda parar e mostrar os casos).
- D3 (ajuste, resposta do dono, opção 1): o CI do PR é a prova do CA3; o `visual-docker.sh` (`test:visual:docker`) não muda e não passa `CI=1`. Motivo: a execução local não exercita os `workers` do CI, e a autonomia 2 aceita o CI como prova. Alternativa descartada: passar `CI=1` no script local.
- D4 (ajuste, resposta do dono): na entrega, abrir o PR e medir o `visual` no CI com 3 workers; se oscilar, 2 workers; se continuar instável com 2, PARAR e mostrar os casos. Com 2 workers a meta de 7 min (CA4) pode não ser atingida; o tempo medido vai para o PR.
- D5 (ajuste): a oscilação local de `conta-duas-etapas` (1440 claro no #526, 1440 escuro na execução local do #528) é pré-existente e virou a issue #530 (técnica, Sprint 10.5); fica fora deste item e não bloqueia o CA3.
- Suposição: o runner `ubuntu-latest` tem 4 vCPUs; se tiver menos, 3 workers pode não alcançar 7 min, e o resultado é registrado no PR.

## Construção

- T1 — arquivos: `frontend/playwright.visual.config.ts` (`fullyParallel: true`, `workers: process.env.CI ? 3 : undefined`, comentário) — prova: `grep -n "fullyParallel\|workers"` mostra as duas linhas; `git diff --stat` mostra só esse arquivo (+3) → ok
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

## Verificação

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

**O que muda:** `frontend/playwright.visual.config.ts` liga `fullyParallel: true` e, no CI, `workers: 2` (fora do CI, o padrão do Playwright). Nenhum print de referência, teste, job ou script muda.

**Como foi verificado:** Rodada 2 da verificação, OK (estado fd5228c6). A base (`dev`) não avançou desde então, então a regressão não foi rodada de novo. As provas do CA3 e do CA4 são o job `visual` e o `ci-gate` do CI deste PR, já com 2 workers.

**Decisões:**
- Workers 2 no CI, e não 3: o run 42514042113 (head 3fe0eb2, com 3 workers) reprovou `conta-codigos-reserva 1440 claro` (7802 px, 0,01 da imagem). O recuo é o previsto pelo item (D4); o CI deste push é a prova.
- O `visual-docker.sh` não passa `CI=1` (D3): a prova local não exercita o número de workers do CI.
- A espera fixa de 300 ms em `abrir()` fica como está (D2).

**Limitações:**
- O texto do CA1 e a seção Construção ainda dizem `workers: 3`. Esta fase só altera a seção Entrega do arquivo do item, então o texto fica para a especificação.
- CA3, CA4 e CA5 dependem do CI deste PR e da descrição final. T3 e T4 ficam por marcar até o run passar.
- Execução local com o padrão de workers oscilou em `conta-duas-etapas 1440 escuro` (T2): é a #530, fora deste item.
- Tempo do job `visual` com 2 workers: medir no CI deste PR e registrar na descrição (meta de 7 min).

**Verificações do PR (run 42514042113, head 3fe0eb2):** o job `visual` reprovou 1 de 357 (`conta-codigos-reserva 1440 claro`) e o `ci-gate` ficou vermelho por causa dele. A correção deste commit é `workers` de 3 para 2.
