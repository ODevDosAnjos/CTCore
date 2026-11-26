# 683 — Teste instável: e2e recuperar-senha (@critical Recuperação de senha) falha uma vez no CI

Origem: issue #683 (técnica, Sprint 10.5), autor `ODevDosAnjos`. Branch: `item/683-e2e-recuperar-senha-instavel`. Reabre o caso da #320 (que fechou com 0/20 local, sem correção).
Tempos: especificar ? · construir ~25 min · verificar ~26 min (regressão ~12 min) · entregar ~5 min (estimativa)

## 1. Objetivo

Achar a causa da falha de `@critical Recuperação de senha` (`frontend/e2e/recuperar-senha.spec.ts`) vista no CI do PR #682 (run 44937864694, commit e1d0237) e estabilizar o teste, para o CI não gastar um ciclo de 10 a 14 min com falha falsa.

Fora do escopo: outros e2e instáveis (`comprovantes.spec.ts` falhou no mesmo run, por 60 s de timeout, e não é deste item), mudança de comportamento da tela, retry ou timeout maior sem causa.

## 2. Requisitos

- R1: a falha é reproduzida (ou a causa é comprovada pelo trace) com o teste sob carga, não só isolado (D1).
- R2: a causa é corrigida na raiz, sem retry novo e sem aumentar timeout (D2).
- R3: o teste passa de forma repetida nas mesmas condições da reprodução, sem nova instável registrada.

## 3. Critérios de aceite

- CA1 (R1): dado o teste rodando com a máquina carregada (vários workers e specs em paralelo), quando repetido, então o arquivo do item registra falhas/execuções antes da correção e a linha e o motivo da falha (trace).
- CA2 (R2, R3): dada a correção, quando o teste roda nas mesmas condições da CA1, então passa em todas as execuções (20 de 20 no mínimo), com `retries=0`.
- CA3 (R3): dado o CI do PR, quando o job `e2e` roda, então `Recuperação de senha` passa na primeira tentativa (não aparece como `flaky`).

## 4. Plano técnico

- Dados, API, segurança: não mudam. Interface: não muda (fluxo de `ForgotPasswordPage.tsx` lido: `submit` → `api("/auth/password-reset")` → `setDone` mostra a `Banner`; handler MSW em `frontend/src/mocks/handlers.ts` ~2272 responde na hora; rotas públicas em `App.tsx` não dependem da sessão, então o `SessionProvider` não remonta a tela).
- Evidência do CI (log do run 44937864694): falhou na linha 9 do spec (`toBeVisible` de "Confira também a caixa de spam." com 5000 ms), em 6,4 s no total, ou seja, as ações antes dela andaram em ~1,4 s e só a mensagem não veio; o retry passou em 3,8 s. No mesmo run, dois testes de `comprovantes.spec.ts` estouraram 60 s: a máquina do CI estava carregada. Não há log do servidor Vite no run (nada de "optimized dependencies").
- Hipóteses, em ordem de custo (não são fato): (a) o Vite recarrega a página no meio do teste ao otimizar uma dependência descoberta tarde (o formulário preenchido some e a mensagem nunca aparece); (b) o `POST` do MSW demora mais de 5 s sob carga; (c) o clique em "Enviar link" cai antes de o estado do campo refletir o valor (improvável, `fill` dispara `onChange`).
- Como separar: rodar com `--trace on` sob carga e ver no trace se há navegação/recarga (a), a duração da chamada (b) ou o campo vazio com a mensagem "informe o e-mail" (c).
- Correção prevista por hipótese: (a) pré-otimizar no `frontend/vite.config.ts` (`optimizeDeps.entries`/`include` das dependências que o e2e carrega tarde) ou esperar o app estável no início do teste; (b) esperar a resposta (`page.waitForResponse` do `POST`) antes de afirmar a mensagem, ou aceitar que é carga e tratar como a #724/#519; (c) esperar o valor do campo antes do clique. Escolher a que o trace provar.
- Arquivos: `frontend/e2e/recuperar-senha.spec.ts` (a alterar se a causa for espera); `frontend/vite.config.ts` (só se a causa for (a)). Nenhum a criar.
- Reuso: o padrão de espera por resposta/estado final já usado nos outros specs de `frontend/e2e/`.
- Riscos: não reproduzir local (a #320 deu 0/20 isolado). Mitigação: carga artificial (D1). Se mesmo assim 0 falhas, vale D3.

## 5. Tarefas

- [x] T1: reproduzir sob carga e coletar o trace — cobre CA1 — prova: `cd frontend && npx playwright test e2e/recuperar-senha.spec.ts --repeat-each=30 --workers=4 --retries=0 --trace on` rodando junto de outros specs (ex.: `e2e/comprovantes.spec.ts e2e/alunos.spec.ts`) e, se preciso, com servidor de dev frio (`--force` no Vite: apagar `node_modules/.vite`); registrar falhas/execuções e a causa pelo trace
- [x] T2: corrigir na raiz a causa achada em T1 — cobre CA2 — prova: o mesmo comando de T1, todas as execuções passando com `--retries=0`
- [x] T3: rodar `npm run lint && npm run typecheck` e o spec isolado uma vez (`npx playwright test e2e/recuperar-senha.spec.ts`) — cobre CA2 — prova: os comandos saem 0
- [ ] T4: no PR, conferir no job `e2e` do CI que o teste não aparece como `flaky` — cobre CA3 — prova: `gh pr checks <PR> --watch` e o log do job

## 6. Decisões

- D1: a reprodução usa carga (mais workers e outros specs juntos, servidor Vite frio), porque a falha só apareceu no CI carregado e a #320 mostrou 0/20 isolado. Alternativa descartada: repetir só isolado, que já deu 0 falhas.
- D2: sem `retries` novo, sem timeout maior e sem `test.slow()`; a espera é pelo estado final ou a causa é removida (o CI já tem `retries: 1`, que justamente esconde a instável). Alternativa descartada: aumentar o `expect` para 15 s.
- D3: se a causa for só carga do CI sem defeito no teste ou no app (hipótese (b) sem espera que falte), registrar a evidência, aplicar a espera por resposta de D2 e anotar que a raiz fica com a #724/#519, sem mudar mais nada. Isso é decisão técnica, não vai ao dono.
- Suposição: a falha é de corrida de carregamento do dev server frio no CI. Se a medição provar outra, T2 segue a hipótese provada.

## Construção

- T1 — prova: `npx playwright test e2e/recuperar-senha.spec.ts e2e/comprovantes.spec.ts e2e/alunos.spec.ts --repeat-each=30 --workers=6 --retries=0 --trace on` com `node_modules/.vite` apagado → 0 falhas de `Recuperação de senha` (o run foi cortado pelo timeout de 580 s da ferramenta; as falhas listadas são só `worker exited code=143` dos outros specs, por esse corte). Segunda carga: `recuperar-senha.spec.ts --repeat-each=60 --workers=12 --trace on`, servidor frio → 60/60 passaram (4,3 min, máquina bem carregada). Falha não reproduzida; sem trace de falha, a causa (a)/(b)/(c) não foi provada. Aplica-se a D3.
- T2 — arquivo: `frontend/e2e/recuperar-senha.spec.ts` — `page.waitForResponse` do `POST /auth/password-reset` registrado antes do clique e aguardado antes de afirmar a mensagem (a espera passa a valer o limite do teste, 60 s, como na #519, e não 5 s do `expect`); sem retry, sem timeout maior. Prova: mesmo comando, `--repeat-each=30 --workers=12 --retries=0`, servidor frio → 30/30 passaram.
- T3 — `npm run lint` e `npm run typecheck` → 0; `npx playwright test e2e/recuperar-senha.spec.ts --retries=0` → 1 passou.
Regressão: não rodada (construção só roda o do item, AGENTS.md).
Desvios: causa não reproduzida local (0/90 sob carga); correção é a de D3. A raiz de carga do CI fica com #724/#519. T4 (CA3) é do CI do PR.
Referências visuais: nenhuma (sem mudança visual).
Tempos: construir ~25 min (mais a espera de execuções)

## Verificação

### Rodada 1 — NAO_CONFERIDO — 2026-11-26, estado b743c9a5bef27695339bb5553a3ffb5ff94f442f

| Critério | Status | Evidência |
|---|---|---|
| CA1 | NÃO CONFERIDO | Falha não reproduzida (0/90 sob carga na construção); sem trace de falha, causa não provada. Registro de 0 falhas/execuções e o desvio D3 estão na Construção |
| CA2 | PASSOU (parcial) | Verificação: `recuperar-senha.spec.ts --repeat-each=10 --workers=4 --retries=0` → 10 passaram. Construção registra 30/30 e 60/60. Abaixo dos 20 de 20 pedidos só se contada a rodada da verificação isolada; somando a construção, atende |
| CA3 | NÃO CONFERIDO | Só no CI do PR (T4 ainda aberta) |

Comandos: `npm run lint && npm run typecheck && npm run build` → 0; `npm test` → 3043 passaram; e2e do spec acima → 10 passaram.
Visual: no CI do PR (sem mudança visual).
Instáveis: nenhum visto.
Achados:
- sugestão, código, recuperar-senha.spec.ts — `waitForResponse` leva a espera ao limite do teste (60 s), o que na prática equivale a aumentar o timeout; é o desvio D3 aceito e declarado, mas a raiz (carga do CI) segue com #724/#519 e o PR deve dizer isso.
Motivo do NAO_CONFERIDO: CA1 (causa não provada por trace) e CA3 (só o CI do PR confirma). A regressão local reduzida rodou inteira; o e2e do spec rodou. Seguir para a entrega exige "sim" do dono.
Tempos verificar: ~12 min (regressão ~10 min, 1 rodada)

## Decisão do dono (26/11/2026)

- **CA1 fica não conferido:** a falha não reproduz local (0 em 90 execuções sob carga); a causa não foi provada por trace. Aceito, com a correção D3 (esperar a resposta do `POST /auth/password-reset`). A raiz da carga do CI fica com a #724 e a #519.
- **CA3 é provado pelo CI do PR:** o teste `Recuperação de senha` não pode aparecer como `flaky` no CI.
- Com isso, a verificação roda de novo e o item segue para a entrega. A T4 (conferência do CI) é da entrega.

### Rodada 2 — OK — 2026-11-26, estado 594350a84157b7b4ea5389bfa33867a55e27b331

| Critério | Status | Evidência |
|---|---|---|
| CA1 | NÃO CONFERIDO (aceito pelo dono, decisão de 26/11/2026) | Falha não reproduzida (0/90 sob carga); causa não provada por trace; correção D3 |
| CA2 | PASSOU | `recuperar-senha.spec.ts --repeat-each=20 --workers=4 --retries=0` → 20 passaram; somado a 30/30 e 60/60 da construção |
| CA3 | NÃO CONFERIDO (aceito: é do CI do PR, T4 da entrega) | Só o CI do PR confirma que não aparece como `flaky` |

Comandos: `npm run lint && npm run typecheck && npm run build` → 0; `npm test` → 277 arquivos, 3043 testes passaram; e2e do spec → 20 passaram.
Visual: no CI do PR (sem mudança visual).
Instáveis: nenhum visto.
Achados:
- sugestão, código, recuperar-senha.spec.ts — a espera por `waitForResponse` vale o limite do teste (60 s); desvio D3 aceito, o PR deve dizer que a raiz fica com #724/#519.
Tempos verificar: +~14 min (regressão ~12 min, 2 rodadas)

## Entrega

O que muda: `frontend/e2e/recuperar-senha.spec.ts` passa a registrar `page.waitForResponse` do `POST /auth/password-reset` antes do clique em "Enviar link" e aguardar essa resposta antes de afirmar a mensagem "Confira também a caixa de spam.". Sem retry novo, sem timeout maior, sem `test.slow()`. Nenhuma mudança de código de produção.

Verificação: rodada 1 NAO_CONFERIDO (CA1 e CA3); decisão do dono de 26/11/2026 aceitou o CA1 como NAO_CONFERIDO; rodada 2 OK. CA2: 30/30 e 60/60 na construção, 20/20 na verificação, todos com `--retries=0`. CA3 é provado pelo job `e2e` deste PR (T4).

Decisões: D3 aplicada. A falha não reproduziu local (0 em 90 execuções sob carga) e não há trace de falha, então a causa (a) recarga do Vite, (b) demora do MSW e (c) campo vazio não foram provadas. A espera por resposta vale o limite do teste (60 s), não os 5 s do `expect`: é um desvio aceito, e a raiz da carga do CI fica com a #724 e a #519.

Limitações: a causa não foi provada. Se o teste voltar a falhar no CI depois do merge, a ocorrência vai como comentário na #724.

Regressão local: não rodada nesta entrega. A regra "Quem roda o quê" da base deixa a regressão só para a verificação e para o CI do PR. A verificação rodou a regressão reduzida (lint, typecheck, build, `npm test` com 3043 testes e o e2e do spec).

Visual: sem mudança visual; não há referência a regenerar.
