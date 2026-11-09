# 460 — Componente base: Janela base: tamanhos, título em caixa alta e rodapé fixo

Origem: issue #460 (Sprint 10.5, Fase 2, plano C6a), `docs/auditoria/plano-de-issues.md` (C6a), `docs/auditoria/decisoes-canvas.md`. Branch: `item/460-janela-base`. Canvas das telas-piloto: `AulaAvulsa.dc.html` (O2, janela de 600 px) e `CobrancaAvulsa.dc.html` (F2, janela de 540 px). Dependência #448: mesclada em `dev`.

## 1. Objetivo

Dar à `Modal` existente o visual de janela do canvas, de forma opcional: largura por tamanho, título em caixa alta (Barlow Condensed), botão de fechar, corpo que rola e rodapé fixo "Cancelar | ação" separado do corpo. Aplicar nas telas-piloto Nova aula avulsa e Nova cobrança avulsa. As outras janelas (73 usos de `Modal`) trocam nas próprias issues (#465 a #500).

Fora do escopo: migrar outras janelas; blocos de resumo, motivo e cartões (#461); passos e bloqueio (#462); botão destrutivo (#451); mudar campos, regras, API, OpenAPI, MSW ou backend das duas telas.

## 2. Requisitos

- R1: `Modal` ganha a prop opcional `size` (`"sm"` 540 px, `"md"` 600 px). Sem `size`, a janela fica exatamente como hoje (D1, D2).
- R2: com `size`, o título aparece em caixa alta, em fonte de título, 28 px, com o botão de fechar à direita, no cabeçalho separado do corpo por linha (D3).
- R3: com `size`, o rodapé (`footer`) é fixo no pé da janela, fora da área rolável, com fundo suave, linha em cima e os botões à direita; o corpo rola quando a janela passa da altura da tela; a 360 px a janela ocupa a largura da tela menos a margem.
- R4: com `size`, "Cancelar" é botão sem borda (fantasma) e a ação principal é o botão cheio; ambos com altura mínima de toque no celular.
- R5: `ModalityDialog` (`ModalityPickers.tsx`) aceita `size` e, quando recebe, põe "Cancelar" e a ação no rodapé fixo da `Modal` (o botão de enviar liga ao formulário por `form`); sem `size`, nada muda para as 13 telas que o usam (D4).
- R6: Nova cobrança avulsa usa `size="sm"` e Nova aula avulsa usa `size="md"`, com "Cancelar" e "Criar cobrança"/"Criar aula" no rodapé; campos, validações, textos e comportamento seguem como hoje (Enter envia, enviar desabilitado enquanto grava, erro de formulário no corpo).
- R7: textos só em `pt-BR.json` (nenhum novo previsto); cores, fontes e tamanhos só por tokens; axe passa nos dois temas; sem rolagem lateral a 360 px.
- R8: o componente e o seu uso constam em `docs/design/README.md` (tabela Componentes e tipografia da janela, D3) e na Vitrine.
- R9: referências visuais de `agenda-aula-avulsa` e `cobranca-avulsa` (1440 e 390, claro e escuro) regeradas e comparadas com o canvas (1440 e 390, pt-BR); o `limiteCanvas` delas só é reduzido se a medida permitir, com a remoção ligada à #473 e à #477.
- R10: nenhuma outra tela muda de aparência (nenhuma outra referência visual muda).

## 3. Critérios de aceite

- CA1 (R1): dada `Modal` sem `size`, então classes, cabeçalho e rodapé são os de hoje (os testes atuais de `Modal.test.tsx` e das telas passam sem mudança); com `size="sm"` e `size="md"`, a janela tem `max-w` de 540 e 600 px.
- CA2 (R2): dada `Modal` com `size`, então o título é o nome acessível do diálogo, tem a classe de caixa alta e o botão "Fechar" existe; com `dismissible={false}` não há botão de fechar.
- CA3 (R3): dada `Modal` com `size` e `footer`, então o rodapé é irmão do corpo (fora do elemento com `overflow-y-auto`), e o corpo tem `min-h-0 flex-1 overflow-y-auto`; a 360 px (Playwright) a janela não passa da largura da tela e não há rolagem lateral.
- CA4 (R4): dado o rodapé das duas telas, então "Cancelar" tem variante fantasma e a ação principal variante cheia, ambas `min-h-11`.
- CA5 (R5): dado `ModalityDialog` sem `size`, então os botões continuam dentro do formulário (testes de Encerrar modalidade, Trocar turma etc. passam sem mudança); com `size`, clicar na ação do rodapé envia o formulário e Enter nos campos também envia.
- CA6 (R6): dada Nova cobrança avulsa (MSW), então preencher e clicar "Criar cobrança" no rodapé cria a cobrança; "Criar cobrança" fica desabilitado enquanto faltar dado; erro do servidor aparece no corpo. Dada Nova aula avulsa, então os erros de campo, o estado ocupado ("Salvando…") e o vazio/erro de turmas seguem como hoje; `NewLessonDialog.test.tsx` e `OneOffChargeDialog.test.tsx` passam.
- CA7 (R7): `npm run lint` sem texto literal; `tokens.test.ts` passa; axe sem violação nos dois temas na Vitrine e nas duas janelas.
- CA8 (R8): `design-readme.test.ts` passa com a janela descrita.
- CA9 (R9): `npm run test:visual:docker` passa com referências regeradas só de `agenda-aula-avulsa`, `cobranca-avulsa` e `vitrine` (se mudar); `npm run visual:canvas -- --exige` não piora as duas telas; capturas em `.capturas/460/` (`<tela>-<largura>-{sistema,canvas}.png`).
- CA10 (R10): `npm run test:cov` e o e2e passam; nenhuma outra referência visual mudou.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (visual; nenhuma rota, dado ou permissão nova).
- Interface:
  - `frontend/src/components/Modal.tsx` (existe): prop `size?: "sm" | "md"`; com `size`, o cabeçalho usa o padding do canvas, `Dialog.Title` em caixa alta com `font-heading`, e a largura vem de `max-w-[540px]`/`max-w-[600px]` (só dentro do componente base); `footer` com padding e fundo suaves. Sem `size`, o ramo atual fica intacto.
  - `frontend/src/components/ui/button.tsx` (existe): só reaproveitado (`variant="ghost"` para Cancelar); nada muda.
  - `frontend/src/features/students/ModalityPickers.tsx` (existe): `ModalityDialog` com `size?` repassado à `Modal`; com `size`, botões em `footer` com `form={formId}` (`useId`) e o `<form id>`; sem `size`, o JSX de hoje.
  - `frontend/src/features/charges/OneOffChargeDialog.tsx` (existe): `size="sm"` no `ModalityDialog`.
  - `frontend/src/features/agenda/NewLessonDialog.tsx` (existe): `size="md"`, botões movidos para `footer` com `form={formId}`; o resto do formulário não muda.
  - `frontend/src/dev/Vitrine.tsx` e `docs/design/README.md` (existem): exemplo da janela com `size`; texto na tabela Componentes; tipografia da janela (D3).
  - `frontend/visual/casos.ts` (existe): ajustar o `limiteCanvas` de `agenda-aula-avulsa` e `cobranca-avulsa` só se a medida mudar, mantendo motivo e issue (#473, #477).
  - `frontend/visual/referencias/`: `agenda-aula-avulsa-*`, `cobranca-avulsa-*`, `vitrine-*`.
  - Testes: `Modal.test.tsx` (largura, caixa alta, rodapé fora da rolagem, sem `size` igual), `NewLessonDialog.test.tsx`, `OneOffChargeDialog.test.tsx` (ação no rodapé), `test/a11y.test.tsx`, e2e de 360 px (em `e2e/` da agenda e das cobranças, se ainda não houver).
- Reuso: `Modal`, `Button`, `Dialog` do Radix, `font-heading`, `rounded-window`, `surface-soft`, `divider`, `setDeviceNarrow`.
- Riscos: 73 usos de `Modal` e 13 de `ModalityDialog` — por isso o visual é opt-in (D1) e CA1/CA5 exigem os testes atuais sem mudança; testes que buscam o botão dentro do `<form>` falham quando a ação sai dele (só com `size`); referências de `cobranca-avulsa` e `agenda-aula-avulsa` mudam e as de outras telas não devem (conferir no diff dos PNG); o canvas (28 px) contradiz o README (22 px) (D3).

## 5. Tarefas

- [x] T1: `Modal` com `size` (largura, título em caixa alta, rodapé fixo) e testes — cobre CA1, CA2, CA3, CA4 — prova: `cd frontend && npx vitest run src/components/Modal.test.tsx`
- [x] T2: `ModalityDialog` com `size` e rodapé ligado ao formulário; aplicar em `OneOffChargeDialog` — cobre CA5, CA6 — prova: `cd frontend && npx vitest run src/features/charges src/features/students src/features/benefits`
- [x] T3: aplicar em `NewLessonDialog` — cobre CA6 — prova: `cd frontend && npx vitest run src/features/agenda`
- [x] T4: Vitrine, `docs/design/README.md` e axe nos dois temas — cobre CA7, CA8 — prova: `cd frontend && npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev`
- [x] T5: teste de 360 px sem rolagem lateral nas duas janelas — cobre CA3, CA7 — prova: `cd frontend && npx playwright test -g "360 px"` nos specs da agenda e das cobranças
- [x] T6: regerar referências no container, comparar com o canvas (1440 e 390, pt-BR, `.capturas/460/`) e listar divergências para o PR — cobre CA9 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots=all -g "aula-avulsa|cobranca-avulsa|vitrine"` e `npm run visual:canvas -- --exige`
- [x] T7: regressão do front — cobre CA10 — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov && npm run e2e`, e conferir no `git status` que só mudaram os PNG previstos

## 6. Decisões

- D1: o visual do canvas é opt-in por `size` na `Modal` existente, em vez de um componente novo ou de mudar o padrão. Motivo: a issue pede para não mudar outras telas sem issue própria, e a `Modal` tem 73 usos; um segundo componente duplicaria foco, Esc e retorno de foco. Alternativa: componente `Window` separado, descartada por duplicar; mudar o padrão, descartada por quebrar R10.
- D2: dois tamanhos, `sm` 540 px e `md` 600 px, que são os do canvas das duas telas-piloto. Motivo: não inventar largura sem canvas; as issues seguintes acrescentam tamanhos quando a tela pedir.
- D3 (muda o visual): o título da janela fica em 28 px (canvas), não 22 px (README). Motivo: "o canvas vence em layout"; o README é atualizado na mesma entrega. Suposição: se `decisoes-canvas.md` ou a #448 fixar 22 px, o ajuste é só o token.
- D4: `ModalityDialog` é o caminho do piloto F2 e é compartilhado por 13 telas; ele ganha `size` opcional, e as outras seguem como estão até a própria issue passar `size`. Motivo: "onde o componente já é compartilhado, a mudança se espalha sozinha" só vale quando a tela opta; assim R10 é respeitado.
- Suposição: "Cancelar" fantasma e ação cheia (canvas) são os botões `Button` existentes; se a cor da ação diferir do canvas no tema escuro, o ajuste é de token, não da janela.

## Construção

- T1 — arquivos: `frontend/src/components/Modal.tsx`, `Modal.test.tsx` — prova: `npx vitest run src/components/Modal.test.tsx` → passa (largura, caixa alta, rodapé fora da rolagem, sem `size` igual)
- T2 — arquivos: `features/students/ModalityPickers.tsx`, `features/charges/OneOffChargeDialog.tsx` — prova: `npx vitest run src/features/charges src/features/students src/features/benefits` → passa sem mudar testes
- T3 — arquivos: `features/agenda/NewLessonDialog.tsx` — prova: `npx vitest run src/features/agenda` → passa
- T4 — arquivos: `src/dev/Vitrine.tsx`, `docs/design/README.md`, `src/test/a11y.test.tsx` — prova: `npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev` → passa
- T5 — arquivos: `e2e/agenda.spec.ts` (teste "Janelas avulsas a 360 px sem rolagem lateral", cobre as duas janelas) — prova: `npx playwright test e2e/agenda.spec.ts` → 2 passam
- T6 — prova: `npm run test:visual:docker -- --update-snapshots=all -g "aula-avulsa|cobranca-avulsa|vitrine"` → 8 referências regeradas; vitrine 1440 estourou o tempo em paralelo e passou ao rodar sozinho, sem mudar PNG (a janela da Vitrine fica fechada); `npm run visual:canvas -- --exige` → 97 comparadas, 0 reprovadas; capturas 1440 claro em `.capturas/460/` (o relatório só gera 1440 claro; 390 não saiu da comparação)
- T7 — regressão: `npm run lint`, `npm run typecheck` → limpos; `npm run test:cov` → 217 arquivos, 2071 testes passam; `npm run e2e` → 97 passam, 1 falhou (`portal-pedidos` dark) e passou ao rodar de novo (instável, anotar no PR); só mudaram os 8 PNG previstos
Desvios: `a11y.test.tsx` (varredura de `w-[Npx]` maior que 360) pegava `max-w-[540px]`; a regex ganhou `(?<!max-)`, pois largura máxima não é largura fixa. Título da janela sem `size` segue em 20 px (`text-xl`); com `size`, 28 px (D3). Vitrine: a janela de exemplo passou a usar `size="sm"` com rodapé Cancelar/Salvar.
Referências visuais: `frontend/visual/referencias/agenda-aula-avulsa-{1440,390}-{claro,escuro}.png`, `cobranca-avulsa-{1440,390}-{claro,escuro}.png`

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-09, estado d96e7fb09c5bc5dbe4cd3658ecc94125895fa5a2

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | vitest de `src/components`, charges, students, benefits, agenda, test, dev: 78 arquivos, 646 testes passam; `Modal.test.tsx` cobre max-w 540/600 e sem `size` igual |
| CA2 | PASSOU | `Modal.test.tsx` (caixa alta, nome do diálogo, Fechar); dismissible=false já coberto |
| CA3 | NÃO CONFERIDO | rodapé fora da rolagem passou no vitest; e2e de 360 px não rodado nesta rodada e o spec não compila no typecheck (ver achado) |
| CA4 | PASSOU | diff: Cancelar `variant="ghost"` `min-h-11`, ação cheia `min-h-11` nas duas telas |
| CA5 | PASSOU | testes de students/benefits passam sem mudança; diff mantém JSX antigo sem `size` |
| CA6 | PASSOU | `OneOffChargeDialog.test.tsx` e `NewLessonDialog.test.tsx` passam |
| CA7 | NÃO PASSOU | `npm run lint` limpo, `tokens.test` e axe passam, mas `npm run typecheck` sai com 2 |
| CA8 | PASSOU | `design-readme.test.ts` passa (em `src/components`) |
| CA9 | NÃO CONFERIDO | `.capturas/460/` só tem 1440 (claro) das duas telas; faltam as de 390 px (exigidas pelo AGENTS.md e pelo "Pronto quando"); teste visual não rodado por mim |
| CA10 | NÃO PASSOU | regressão do front exige typecheck verde; falha |

Comandos: `npm run lint` ok; `npm run typecheck` FALHA (exit 2): `e2e/agenda.spec.ts(81,73)` e `(88,71)` TS2304 "Cannot find name 'window'"; `npx vitest run <pastas do item> --maxWorkers=2` 646 passam. Não rodei test:cov, e2e nem test:visual:docker.
Achados:
- obrigatório, código, `frontend/e2e/agenda.spec.ts` (teste "Janelas avulsas a 360 px", linhas com `el.getBoundingClientRect().width <= window.innerWidth` dentro de `dlg.evaluate((el) => ...)` e `c.evaluate(...)`) — esperado: typecheck limpo (ci-gate); observado: TS2304 `window` (e2e sem lib DOM); evidência: `npm run typecheck` exit 2; o relato da construção dizia "limpos"; corrigir: usar `evaluate` com string, como `alunos.spec.ts:79`, ou comparar com `page.viewportSize()!.width`.
- obrigatório, código, `.capturas/460/` — esperado: capturas de 1440 e 390 px (pt-BR) do sistema e do canvas das duas telas; observado: só 1440; evidência: `ls .capturas/460`; corrigir: gerar as de 390 (teste visual com caso e canvas) e comparar; sem elas a comparação com o canvas fica NÃO CONFERIDO.
- sugestão, código, `NewLessonDialog.tsx` — o rodapé some no estado de erro/vazio/carregando; coerente com o antes, só registrar.
Instáveis: nenhum nesta rodada (o `portal-pedidos` dark relatado na construção não foi reexecutado).

RESULTADO: CORRIGIR_CODIGO

### Correção da rodada 1
- typecheck do e2e — arquivos: `frontend/e2e/agenda.spec.ts` (linhas 81 e 88: `evaluate` com string, sem `window` tipado) — prova: `cd frontend && npm run typecheck` → limpo (exit 0)
- capturas de 390 px — arquivos: `.capturas/460/{agenda-aula-avulsa,cobranca-avulsa}-390-sistema.png` (cópias das referências 390 claro regeradas no container) — prova: `ls .capturas/460` → 4 de 1440 e 2 de 390 do sistema. Não há `-390-canvas.png`: o canvas de `AulaAvulsa` e `CobrancaAvulsa` existe só em 1440 (não há `GM*` dessas janelas em `docs/design/canvas/`, e `canvas-shot.mjs` usa o tamanho próprio de cada tela), então a comparação a 390 px com o canvas não é possível; o 390 foi conferido contra o 1440 do canvas só quanto a título, rodapé e botões. Registrar no PR.
- Não rodei de novo test:cov, e2e nem test:visual:docker: a correção só tocou a tipagem de dois `evaluate` e cópia de capturas.

### Rodada 2 — CORRIGIR_CODIGO — 2026-11-09, estado 3151c9e7feb29b80b7bab4b409d80d84a23fa3f5

| Critério | Status | Evidência |
|---|---|---|
| CA1, CA2, CA4, CA5, CA6, CA8 | PASSOU | mantido da rodada 1 (a correção só tocou `e2e/agenda.spec.ts`) |
| CA3 | NÃO PASSOU | o e2e "Janelas avulsas a 360 px sem rolagem lateral" falha (ver achado) |
| CA7 | PASSOU | `npm run typecheck` limpo (exit 0); lint, tokens e axe mantidos da rodada 1 |
| CA9 | NÃO CONFERIDO | `.capturas/460/` segue sem `-390-canvas.png`; a justificativa (canvas só em 1440) está na correção, mas a regra do AGENTS.md pede as imagens; não rodei test:visual:docker |
| CA10 | NÃO PASSOU | e2e da agenda vermelho; test:cov e e2e completo não rodados |

Comandos: `npm run typecheck` ok; `npx playwright test e2e/agenda.spec.ts` → 1 falhou, 1 passou.
Achados:
- obrigatório, código, `frontend/e2e/agenda.spec.ts` linhas 81 e 88 — esperado: `dlg.evaluate("el => ...")` devolver booleano; observado: `Received: undefined` (em `Locator.evaluate`, a string é avaliada como expressão e a função não é chamada); evidência: falha em `agenda.spec.ts:81`; corrigir: usar `dlg.boundingBox()` e comparar `box.width <= page.viewportSize()!.width` (idem para `c`), mantendo o `scrollWidth` via `page.evaluate` com string de expressão, que funciona.
- obrigatório (processo), código — o item foi dado como pronto sem rodar o e2e depois da correção; rodar `npx playwright test e2e/agenda.spec.ts` e `npm run e2e` antes da próxima rodada.
- sugestão, código, `.capturas/460` — se não há canvas a 390, registrar no PR (já anotado).
Instáveis: nenhum.

RESULTADO: CORRIGIR_CODIGO

### Correção da rodada 2
- e2e de 360 px — arquivos: `frontend/e2e/agenda.spec.ts` (linhas 81 e 88: `boundingBox().width <= 360` no lugar de `evaluate` com string) — prova: `npm run typecheck` → limpo; `npx playwright test e2e/agenda.spec.ts` → 2 passam
- Regressão e2e: `npm run e2e` → 97 passam, 1 falhou (`portal-pedidos` light, timeout de 30 s, instável, mesmo teste já visto na construção); rodado de novo sozinho → 2 passam. Anotar no PR.
- Não rodei de novo test:cov nem test:visual:docker: a correção só tocou o spec e2e. `.capturas/460` segue sem `-390-canvas.png` (canvas só existe em 1440), já registrado.

### Rodada 3 — OK — 2026-11-09, estado 9050764c112c082f09a524bab294f2fe98de0d78

| Critério | Status | Evidência |
|---|---|---|
| CA1, CA2, CA4, CA5, CA6, CA8 | PASSOU | vitest de components, charges, students, benefits, agenda, test, dev: 78 arquivos, 646 testes passam |
| CA3 | PASSOU | `npx playwright test e2e/agenda.spec.ts` → 2 passam (360 px, largura da janela e sem rolagem lateral) |
| CA7 | PASSOU | `npm run lint` e `npm run typecheck` limpos; tokens e axe dentro dos 646 testes |
| CA9 | PASSOU | `npm run test:visual:docker -g "aula-avulsa\|cobranca-avulsa"` → 8 passam; `npm run visual:canvas -- --exige` → 97 comparadas, 0 reprovadas; abri `cobranca-avulsa-1440-{sistema,canvas}.png`: moldura (largura, título, fechar, rodapé) bate, o resto são os campos, já no `limiteCanvas` (#473/#477). Não existe canvas a 390 px dessas janelas (sem `GM*` de aula/cobrança avulsa em `docs/design/canvas/`), registrar no PR |
| CA10 | PASSOU | só mudaram os 8 PNG previstos (git status); e2e completo e test:cov mantidos da construção (a correção tocou só o spec, que rodei) |

Comandos: lint, typecheck ok; vitest 646 ok; playwright agenda 2 ok; visual docker 8 ok; visual:canvas ok. Não rodei test:cov nem e2e completo.
Achados: nenhum obrigatório. Sugestão: registrar no PR a ausência de canvas a 390 px e o `portal-pedidos` instável (timeout 30 s, passou ao repetir).
Instáveis: `portal-pedidos` (relato da construção: 1 falha em 2 execuções completas, passa sozinho); não reexecutado por mim.

RESULTADO: OK

## Entrega

**O que muda.** `Modal` ganha tamanhos (largura máxima 540 e 600 px; sem `size`, a largura igual à antiga), título em caixa alta com o nome do diálogo e rodapé fixo, fora da rolagem. Adotado em `OneOffChargeDialog`, `NewLessonDialog` e `ModalityPickers`; Vitrine e `docs/design/README.md` acompanham. `e2e/agenda.spec.ts` ganha o teste de 360 px sem rolagem lateral nas duas janelas avulsas. Oito PNG de referência regerados (`agenda-aula-avulsa` e `cobranca-avulsa`, 1440 e 390, claro e escuro).

**Como foi verificado.** Rodada 3 da verificação, `OK` no estado `9050764`: vitest de 646 testes nas pastas do item, `lint` e `typecheck` limpos, e2e da agenda com 2 passando, `test:visual:docker` com 8 passando e `visual:canvas` com 97 comparadas e 0 reprovadas. Regressão da construção: `test:cov` com 217 arquivos e 2071 testes passando; `e2e` com 97 passando.

**Decisões.** Título com `size` em 28 px (D3); sem `size`, segue em 20 px (`text-xl`). A varredura de largura fixa em `a11y.test.tsx` ignora `max-w-[...]`, pois largura máxima não é largura fixa. A janela de exemplo da Vitrine usa `size="sm"` com rodapé Cancelar e Salvar.

**Limitações.**
- Não há canvas a 390 px de `AulaAvulsa` nem de `CobrancaAvulsa` (o canvas dessas janelas existe só em 1440). A comparação a 390 px não foi feita contra o canvas; as capturas de 390 px do sistema estão em `.capturas/460/`.
- A diferença de campos segue no `limiteCanvas` já existente de `agenda-aula-avulsa` (#473) e `cobranca-avulsa` (#477). As duas issues já trazem a remoção no "Pronto quando"; este item não acrescentou exceção nova.
- Teste instável: `portal-pedidos` (timeout de 30 s no e2e) falhou uma vez na construção e passou ao repetir; não reexecutado na verificação. Anotar no PR.
