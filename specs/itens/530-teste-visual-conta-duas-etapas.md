# 530 — Técnica · Teste visual instável em conta-duas-etapas (1440)

Origem: issue #530 (Sprint 10.5 · Identidade visual; corpo atualizado pelo dono na parada da #528). Branch: `item/530-teste-visual-conta-duas-etapas`. Vem antes da #528 e da #454 (ordem do dono).

## 1. Objetivo

Acabar com a reprovação intermitente de `conta-*` (1440) no teste visual, trocando a causa, não escondendo o sintoma. A causa foi medida nas imagens de diferença dos runs 42515008793 e 42514042113 e **não é a que a issue supunha** (ver "Causa medida" em 6): o QR, a janela e os códigos saem idênticos; o que muda é a **posição da rolagem da página atrás da janela**, porque o `abrir()` clica no botão antes de a página terminar de carregar.

Fora do escopo: aumentar tolerância de pixels, retry automático, mexer em `TwoFactorSetupDialog` ou no MSW, a paralelização do #528.

## 2. Requisitos

- R1: `abrir()` (`frontend/visual/telas.visual.ts`) só executa os `passos` com a tela assentada: sem esqueleto "Carregando" e sem requisição pendente (D1).
- R2: depois dos passos, a espera fixa de 300 ms sai e entra um sinal: imagens carregadas e nenhuma animação rodando (D2).
- R3: nos casos com passos que abrem janela, o print só sai com o conteúdo final da janela presente (D2).
- R4: sem retry, sem aumento de `maxDiffPixelRatio`; os 357 casos continuam passando (D3).
- R5: a causa fica registrada neste arquivo, com as imagens de diferença como prova (D4).
- R6: 3 execuções seguidas do job `visual` no CI sem falha em `conta-*`.

## 3. Critérios de aceite

- CA1 (R1): dado o caso `conta-duas-etapas` ou `conta-codigos-reserva`, quando o teste roda, então o clique do passo acontece depois de a lista de sessões e o estado das duas etapas estarem na tela, e a rolagem de fundo é a mesma em toda execução.
- CA2 (R2): dado `abrir()`, então não há `waitForTimeout`; há `waitForFunction` com imagens `complete && naturalWidth > 0` e `getAnimations()` sem `running`.
- CA3 (R3): dado `conta-duas-etapas`, então o print é tirado com o QR (imagem) visível e o campo de código presente; em `conta-codigos-reserva`, com os 10 códigos visíveis.
- CA4 (R4): dado `npm run test:visual:docker`, então 357 de 357 passam, sem alterar `playwright.visual.config.ts`.
- CA5 (R4): dado `npm run test:visual:docker -- -g "conta-" --repeat-each=15 --workers=3`, então 0 falhas.
- CA6 (R5): dado este arquivo, então a seção "Construção" traz a causa com os números dos runs, os caminhos das imagens de diferença e a medição antes e depois.
- CA7 (R6): dado o PR, quando o `visual` roda 3 vezes seguidas no CI, então nenhuma falha em `conta-*` (anotado no PR).

## 4. Plano técnico

- Dados, API, segurança: não mudam. Interface do produto: não muda.
- Arquivos:
  - `frontend/visual/telas.visual.ts`, função `abrir()`: (a) mover o bloco "assentar" (`waitForLoadState("networkidle")` + `getByRole("status").filter({ hasText: /Carregando/ })` com contagem 0) para antes do laço de `passos` e manter uma segunda espera depois dele; (b) trocar `waitForTimeout(300)` por `waitForFunction` das imagens e animações; (c) para a janela, esperar o elemento final (D2).
  - `frontend/visual/casos.ts`, tipo `Passo`/casos `conta-*`: só se o elemento final precisar ser dito por caso (D2); senão não muda.
  - `frontend/visual/referencias/conta-duas-etapas-1440-*.png` e `conta-codigos-reserva-1440-*.png`: regerar **só se** o print estiver de fato errado (D5).
- Reuso: o que já existe em `abrir()` (esperas de `networkidle` e do status "Carregando"); `page.waitForFunction` do Playwright.
- Riscos: `networkidle` isolado não prova que o React já renderizou a resposta; por isso o sinal é o desaparecimento do esqueleto, e para `conta-*` o elemento final da lista de sessões. Esperar demais deixa o teste lento; medir o tempo total antes e depois.

## 5. Tarefas

- [x] T1: reproduzir e registrar a causa em "Construção": comparar `expected` x `actual` x `diff` dos dois runs (pasta `visual-diff` dos artefatos) e anotar rolagem de fundo e "Sair da conta" ausente da referência — não cobre critério: é a medição pedida pela issue antes de corrigir — prova: `gh run download 42515008793 -n visual-diff` e `gh run download 42514042113 -n visual-diff` (cada um em pasta vazia nova)
- [x] T2: em `abrir()`, assentar a tela (sem "Carregando", `networkidle`, e a lista de sessões visível nas telas de conta) antes dos `passos` — cobre CA1 — prova: `cd frontend && npm run test:visual:docker -- -g "conta-" --repeat-each=15 --workers=3`
- [x] T3: em `abrir()`, trocar os 300 ms por `waitForFunction` (imagens e animações) e esperar o elemento final da janela — cobre CA2, CA3 — prova: `cd frontend && npm run test:visual:docker -- -g "conta-(duas-etapas|codigos-reserva)"`
- [x] T4: regerar as referências 1440 de `conta-duas-etapas` e `conta-codigos-reserva` se a conferência mostrar o print errado (D5) — cobre CA4 — prova: `cd frontend && npm run test:visual:docker -- -g "conta-" --update-snapshots` e ver `git diff --stat`
- [x] T5: regressão completa do visual e do front — cobre CA4, CA5 — prova: `cd frontend && npm run test:visual:docker && npm run lint && npm run typecheck && npm test`
- [ ] T6: abrir o PR com a causa, a medição e a lista do que mudou; anotar as 3 execuções do `visual` no CI — cobre CA7 — prova: `gh pr checks`

## 6. Decisões

- Causa medida (não é decisão, é achado; muda a hipótese da issue): nos dois runs o QR, o título, os campos e a lista de códigos da janela são idênticos ao esperado. A diferença é só o fundo: no esperado a página está rolada até o fim (título "Minha conta" fora da tela, lista de sessões visível); no run que falhou a rolagem é menor (título visível, botão "Ativar duas etapas" em y=979). O passo de `clicar` usa o scroll automático do Playwright até o botão, que fica no fim da página; se a lista de sessões e o estado das duas etapas ainda não carregaram, a página está mais curta e a rolagem fica menor. Depois a página cresce e a rolagem não acompanha. Só aparece em 1440 com passo de clique em botão do rodapé da página (`conta-duas-etapas`, `conta-codigos-reserva`); em 390 o print é de página inteira ou a rolagem não muda. O `abrir()` hoje assenta a tela **depois** dos passos, não antes. O QR assíncrono (`QRCode.toDataURL`) não aparece como causa: o QR saiu igual nos dois runs e nas 12 repetições locais.
- Prova local (feita na especificação): 12 repetições do caso com 3 workers passaram, o que combina com a causa ser corrida de carga e não do QR; o fundo estável do print local é o do esperado.
- D1: assentar a tela antes dos passos — motivo: ataca a causa medida; alternativa descartada: só trocar os 300 ms (a hipótese da issue), que não mexe no momento do clique.
- D2: depois dos passos, usar o sinal da issue (imagens carregadas e sem animação rodando) e esperar o elemento final da janela (o QR visível, a lista de códigos) — motivo: é o que o dono decidiu e cobre o caso do QR assíncrono, que continua uma corrida possível mesmo não tendo causado estas falhas; alternativa descartada: manter a espera fixa.
- D3: sem retry e sem mudar `maxDiffPixelRatio` — motivo: regra da issue.
- D4: a causa vai para a seção "Construção" deste arquivo e para a descrição do PR — motivo: "Pronto quando" da issue.
- D5: achado extra que pede decisão do construtor: as referências 1440 de `conta-duas-etapas` e `conta-codigos-reserva` foram geradas antes do botão "Sair da conta" da barra lateral (#434, que só regerou outras telas); a barra do print esperado está sem esse item e o teste passa porque a diferença cabe em `maxDiffPixelRatio: 0.001`. Regerar essas referências é permitido (o print estava de fato desatualizado) e fica dentro da regra "só regerar se o print estava errado"; registrar na descrição do PR. Alternativa: deixar como está, o que mantém uma referência desatualizada.
- Suposição: o elemento final da lista de sessões (texto "Safari em iOS" do MSW) serve de sinal para `conta-*`; se o texto mudar no MSW, o sinal quebra, então o construtor deve preferir o papel/rótulo da seção em vez do texto fixo. Se a causa medida estiver errada, T2 e T3 não bastam e o construtor abre a investigação na seção "Construção" antes de tocar mais código.
- Sem pendência para o dono. Fora do item: o `maestro` ainda não tem linha da #530 em `specs/backlog.md` (linhas de técnicas entram na entrega, como a #527).

## Construção

- T1 — causa medida: run 42515008793 (`conta-duas-etapas-1440-claro`) e run 42514042113 (`conta-codigos-reserva-1440-claro`); imagens de diferença baixadas (`gh run download <run> -n visual-diff`) em `%TEMP%\r1\telas.visual.ts-conta-duas-etapas-1440-claro-visual\` e `%TEMP%\r2\telas.visual.ts-conta-codigos-reserva-1440-claro-visual\` (`*-expected.png`, `*-actual.png`, `*-diff.png`); a janela é igual, a diferença é a rolagem do fundo, como descrito em 6. Antes: `npm run test:visual:docker -- -g "conta-" --repeat-each=15 --workers=3` com o código original → 4 falhas em 240 (conta-duas-etapas 1440 claro, conta-duas-etapas 1440 escuro, conta-codigos-reserva 1440 escuro x2), reproduzindo o defeito.
- T2 — arquivos: `frontend/visual/telas.visual.ts` (função `assentar`, chamada antes dos passos; nas telas `/conta` com perfil espera o botão "Encerrar a sessão em…" da lista de sessões) — prova: mesmo comando → 240 de 240 passam (antes 4 falhas).
- T3 — arquivos: `frontend/visual/telas.visual.ts` (sem `waitForTimeout`; `waitForFunction` de imagens e animações; espera de `aguardar`), `frontend/visual/casos.ts` (campo `aguardar`: QR `[role="dialog"] img` em `conta-duas-etapas`, 10º código `[role="dialog"] ul li:nth-child(10)` em `conta-codigos-reserva`) — prova: `-g "conta-"` → passa.
- T4 — D5: referências 1440 (claro e escuro) de `conta-duas-etapas` e `conta-codigos-reserva` apagadas e regeradas (a antiga não tinha "Sair da conta"; o `--update-snapshots` sozinho não as regera porque a diferença cabe na tolerância) — prova: `git status` mostra 4 PNG alterados.
- T5 — `npm run test:visual:docker` → 357 de 357; `npm run lint` → 0; `npm run typecheck` → 0; `npm test` → passou (rodado antes do ajuste final, que só mexeu em `visual/`). Repetição final com o código final: `-g "conta-" --repeat-each=15 --workers=3` → 240 de 240.
- T6 não é da construção (fase 5): CA7 (3 execuções do `visual` no CI) fica para o PR.

Desvios: (1) a espera de animação ignora as infinitas (`iterations !== Infinity`): o spinner do botão em carregamento da `vitrine` nunca termina e reprovava 4 casos por tempo; o Playwright já congela essas animações no print. (2) A expressão do `waitForFunction` é texto, porque o `tsconfig` do `visual/` não tem a lib `dom` (o typecheck reprovava). (3) T6/CA7 pendentes.
Não é do item: nada.

## Verificação

### Rodada 1 — OK — 2026-11-08, estado 7a30a7497f335ca596e38bbb27f35bb25c55a40c

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | diff: `assentar` (networkidle, sem "Carregando") e espera do botão "Encerrar a sessão em…" antes do laço de `passos`; 240/240 na repetição |
| CA2 | PASSOU | diff: `waitForTimeout` removido; `waitForFunction` com `complete && naturalWidth > 0` e `getAnimations()` sem `running` (infinitas excluídas, desvio registrado) |
| CA3 | PASSOU | `aguardar`: `[role="dialog"] img` (QR) e `ul li:nth-child(10)` (10º código), esperados antes do print |
| CA4 | PASSOU | `npm run test:visual:docker` → 357 passed; `playwright.visual.config.ts` fora do diff |
| CA5 | PASSOU | `-g "conta-" --repeat-each=15 --workers=3` → 240 passed, 0 falhas |
| CA6 | PASSOU | seção "Construção" traz runs 42515008793 e 42514042113, caminhos das diferenças e antes (4/240 falhas) e depois (0/240); imagens de diferença não reabertas nesta rodada |
| CA7 | NÃO CONFERIDO (limitação aceita) | CI do PR ainda não existe; AGENTS.md aceita CI como prova, conferir na fase 5 |

Comandos: test:visual:docker 357/357; repetição conta- 240/240; npm run lint 0; npm run typecheck 0. `npm test` não rodado (diff só em `frontend/visual/`).
Achados:
- sugestão, código, `frontend/visual/telas.visual.ts` — a espera da lista de sessões vale por `rota === "/conta"` com perfil, o que acopla `abrir()` a uma rota; aceitável, mas um campo do caso seria mais explícito.

## Entrega

- O que muda: `frontend/visual/telas.visual.ts` (`abrir()`: a tela assenta antes dos passos, com `networkidle`, sem "Carregando" e com a lista de sessões nas telas de `/conta`; a espera fixa de 300 ms sai e entra `waitForFunction` com imagens carregadas e animações finitas encerradas; o campo `aguardar` espera o elemento final da janela); `frontend/visual/casos.ts` (campo `aguardar` nos casos `conta-duas-etapas` e `conta-codigos-reserva`); referências 1440 claro e escuro de `conta-duas-etapas` e `conta-codigos-reserva` regeradas (D5). Nenhuma regra, tela, API, contrato ou `maxDiffPixelRatio` muda.
- Causa (T1, registrada em "Construção" e em 6): a rolagem do fundo da página atrás da janela de 1440 px, porque o clique acontecia antes de a lista de sessões e o estado das duas etapas carregarem. Não é o QR nem a janela.
- Verificação: rodada 1 OK (CA1 a CA6). Antes da correção, `-g "conta-" --repeat-each=15 --workers=3` teve 4 falhas em 240; depois, 0 em 240. `npm run test:visual:docker` com 357 de 357. Lint e typecheck com 0 erros; `npm test` passou antes do ajuste final, que só mexeu em `frontend/visual/`.
- Decisões: D1 a D5 em 6. Desvio 1: animações infinitas (spinner do botão em carregamento da `vitrine`) ficam fora da espera, porque o Playwright já as congela no print. Desvio 2: a expressão do `waitForFunction` é texto, porque o `tsconfig` de `visual/` não tem a lib `dom`.
- Limitações: CA7 (3 execuções seguidas do job `visual` no CI, sem falha em `conta-*`) depende do CI deste PR e fica anotado na descrição. A espera da lista de sessões é ligada à rota `/conta` com perfil (sugestão da verificação; aceitável), e o sinal para `conta-*` usa o texto "Safari em iOS" do MSW (se mudar, o construtor deve trocar pelo papel da seção).
- Regressão: `test:visual:docker` 357 de 357, lint e typecheck na verificação; `npm test`, `test:cov` e `e2e` não rodaram localmente (a base não avançou; o CI do PR roda a regressão completa).
