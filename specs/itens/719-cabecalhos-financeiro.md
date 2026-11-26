# 719 — 646c · Cabeçalhos sem subtítulo: Financeiro

Origem: issue #719 (parte c da #646, RNF-45; decisões 33 e 34 de `docs/auditoria/decisoes-canvas.md`). Branch: `item/719-cabecalhos-financeiro`. Item-mãe: `specs/itens/646-cabecalhos-sem-subtitulo.md`. Modelos: `specs/itens/717-cabecalhos-pessoas.md` e `specs/itens/718-cabecalhos-operacao.md`.

## 1. Objetivo

Nas telas de Financeiro (planos, benefícios, cobranças e subtelas, pagamento manual e comprovante Pix), tirar o subtítulo com a unidade, as contagens soltas, as frases de regra interna e as notas de regra, e apagar do `pt-BR.json` as chaves que ficarem sem uso. O gestor vê título, ações e conteúdo; ficam o que identifica o registro (painel, janela) e a dica junto do campo.

Fora: Comunicação, Configurações, conta e portal (partes d e e); mudar layout, API ou regra.

## 2. Requisitos

- R1: `/planos` mostra só o título (somem `plans.subtitle`, `subtitleAll`, `mobileSubtitleAll`); os dois cartões-resumo perdem a nota (`plans.cards.plansNote*`, `benefitsNote`) e a tabela perde o rodapé `plans.table.footnote`; o painel de plano desativado perde `plans.inspect.note`.
- R2: `/beneficios` mostra só o título (somem `benefits.subtitle`, `subtitleAll`) e perde o rodapé `benefits.footnote`.
- R3: `/cobrancas` mostra só o título e as ações, no desktop e no celular (somem `charges.subtitle`, `subtitleAll`, `mobileSubtitle_*`).
- R4: O painel da cobrança mostra "Vencimento {{due}} · gerada em {{created}}" sem "a composição não muda depois de gerada" (`charges.panel.compositionNote`, texto trocado). O subtítulo do painel (aluno, unidade e responsável) identifica o registro e fica.
- R5: Recebimentos do dia mostra como subtítulo só a data (`charges.daily.subtitle` = "{{date}}"; `subtitleNoUnit` sai). Prévia das cobranças mostra só o título (somem `charges.preview.subtitle`, `subtitleNoUnit`). Em atraso mostra só o título (somem `charges.overdue.subtitle_*` e, se ficarem sem uso, `scopeUnit` e `scopeAll`).
- R6: Conferência de comprovantes mostra só o título, no desktop e no celular (somem `paymentProofs.subtitle_*` e o subtítulo do celular com `mobileCount`, se sem uso).
- R7: A janela "Antecipar mensalidades" perde a nota `charges.advance.note`.
- R8: A janela de registrar pagamento mostra "Valor da cobrança: {{value}}" sem "sem taxa no pagamento manual" (`payments.dialog.valueLine`, texto trocado). A janela do comprovante Pix do portal mostra só o valor, sem "(sem taxa)" (`pixProof.noFee` sai).
- R9: Chaves sem uso saem do `pt-BR.json` depois de `grep` de cada uma (incluindo variantes `*All`, `*NoUnit`, `*Loading`, `_one/_other`).
- R10: Quatro estados, layout e rotas inalterados além da falta dos textos; padrão de rotas e telas do AGENTS.md.
- R11: Testes que conferiam os textos passam a conferir a ausência (ou o texto novo); só as referências visuais das telas da parte (e das que as mostram ao fundo) são regeradas; a lista tela por tela vai na descrição do PR.

## 3. Critérios de aceite

- CA1 (R1): dado `/planos` com unidade, em "Todas" e no celular, então o cabeçalho tem "Planos e benefícios" sem "valores guardados em centavos" nem nome de unidade; os cartões não têm "só mensais, um por modalidade" nem "bolsas e descontos"; não há "A frequência é só informativa" no rodapé; o painel de plano desativado não tem "não mudam: para outra, crie um plano novo".
- CA2 (R2): dado `/beneficios` com unidade e em "Todas", então não há subtítulo nem a nota "Benefício acima de 50%…".
- CA3 (R3): dado `/cobrancas` no desktop (com e sem unidade) e no celular (carregando e carregada), então o cabeçalho não tem "sem juros, multa", nome de unidade, mês nem contagem.
- CA4 (R4): dado o painel de uma cobrança, então a linha mostra "Vencimento … · gerada em …" e não contém "a composição não muda"; o subtítulo com aluno e responsável continua.
- CA5 (R5): dadas Recebimentos do dia (com e sem unidade), Prévia e Em atraso, então Recebimentos mostra só a data, Prévia só o título e Em atraso só o título (sem "N cobranças · R$"); nenhuma menciona "abertura ou fechamento de caixa" nem "a geração é automática".
- CA6 (R6): dada a Conferência de comprovantes com comprovantes e no celular, então não há "Comprovantes de Pix na chave da unidade" nem contagem no cabeçalho.
- CA7 (R7): dada a janela Antecipar mensalidades, então não há "Se o plano for reajustado depois".
- CA8 (R8): dadas a janela de registrar pagamento e a de comprovante Pix, então a primeira mostra "Valor da cobrança: R$ …" sem "taxa" e a segunda mostra o valor sem "(sem taxa)".
- CA9 (R9): `npm run lint` e `npm test` passam e `grep` das chaves removidas em `src`, `e2e` e `visual` não acha uso.
- CA10 (R10, R11): os casos visuais `planos`, `beneficios`, `cobrancas*`, `plano-*`, `beneficio-*`, `cobranca-*`, `portal-pix-chave` e `aluno-trocar-plano` (nomes exatos em `frontend/visual/casos.ts`) passam sem `--update-snapshots` depois de regerar; a comparação com o canvas (1440 e 390 px) não piora; nenhuma referência de outra parte muda sem explicação.

## 4. Plano técnico

- Dados, API e segurança: não mudam (só texto de tela).
- Interface (arquivos vistos, em `frontend/src`):
  - `features/plans/PlansPage.tsx`: apagar `subtitle` (~146) e o `subtitle=` (~190); tirar `note=` dos dois `SummaryCard` (~170, ~177) e a prop `note` do `SummaryCard` local (~24) com o `<p>` que a mostra; tirar `footer=` (~224); `unitName` só fica se outro trecho o usar. `plans/PlanInspectDrawer.tsx`: tirar o `<p>` de `${k}note` (~192); o subtítulo do painel (unidade · valor · frequência) fica.
  - `features/benefits/BenefitsPage.tsx`: tirar `subtitle=` (~106) e `footer=` (~131); `unitName` e `all` só ficam se outro trecho os usar (`all` é usado nas linhas ~61 e ~87).
  - `features/charges/ChargesPage.tsx`: tirar `subtitle=` nas duas ramas do `header` (~58, ~63) e o que ficar sem uso (`period`/`month`, `unitName`, `total`).
  - `features/charges/ChargePanel.tsx`: só o texto de `compositionNote` muda no JSON (~100 já usa a chave); `charges.panel.subtitle` fica.
  - `features/charges/DailyReceiptsPage.tsx` (~139): `subtitle={when}`, ou texto da chave `charges.daily.subtitle` com `{{date}}`; tirar a ramificação por `unitName`.
  - `features/charges/ChargePreviewPage.tsx` (~78): tirar `subtitle=`; `monthYear` e `unitName` só ficam se outro trecho os usar.
  - `features/charges/OverduePage.tsx` (~91): tirar `subtitle=`; o parâmetro `counts`/`total` do `header` fica só se outro trecho os usar.
  - `features/payment-proofs/PaymentProofsPage.tsx` (~74, ~109): apagar `subtitle`/`scopeText` e o `subtitle=`.
  - `features/charges/AdvanceChargesDialog.tsx` (~62): tirar o `<p>` de `${k}note`.
  - `features/payments/RegisterPaymentDialog.tsx` (~137): só o texto de `valueLine` muda no JSON.
  - `features/portal/PixProofDialog.tsx` (~138): trocar `t("pixProof.noFee", …)` por `formatCurrency(data.amountCents)`.
  - `i18n/pt-BR.json`: apagar as chaves de R1 a R8 e as variantes sem uso (blocos `plans` ~1498, `benefits` ~1640, `charges` ~2825, `paymentProofs` ~3954, `pixProof` ~4019); trocar o texto de `charges.panel.compositionNote`, `charges.daily.subtitle` e `payments.dialog.valueLine`. Ficam: `charges.creation.note` ("Avulsa não conta para o bloqueio por atraso"), `plans.form.*Note`, `plans.form.impact.note`, `paymentProofs.intro` e demais notas junto de campo (D3).
  - `PageHeader` já aceita `subtitle` opcional; nada a criar. `SummaryCard` é local de `PlansPage`; confirmar por `grep` que não é usado fora.
- Testes a ajustar (achados por `grep`, reconferir): `plans/PlansPage.test.tsx`, `plans/PlanInspectDrawer.test.tsx`, `benefits/BenefitsPage.test.tsx`, `charges/ChargesPage.test.tsx`, `charges/ChargePanel.test.tsx`, `charges/DailyReceiptsPage.test.tsx`, `charges/ChargePreviewPage.test.tsx`, `charges/OneOffChargeDialog.test.tsx` (conferir se o texto citado é de uma chave removida), `payment-proofs/PaymentProofsPage.test.tsx`, `payments/RegisterPaymentDialog.test.tsx`, `portal/PixProofDialog.test.tsx`; `benefits/GrantBenefitDialog.test.tsx`, `portal/PortalFinancePage.test.tsx`, `students/enrollment-wizard/*.test.tsx` e `mocks/*.msw.test.ts` apareceram no `grep` e só mudam se citarem texto removido. Não há texto citado em `e2e/` nem em `visual/*.ts`; reconferir.
- Visual: referências em `frontend/visual/referencias` dos casos de CA10; sem caso novo. Janelas e painéis sobre essas telas mudam por tabela. Rodar a suíte visual inteira com `--workers=2` antes do push (a moldura não muda, mas a #717 e a #718 só acharam fundos no CI/na suíte inteira). Capturas em `.capturas/719/`.
- Riscos: chave apagada usada por outra variante só quebra na execução (`grep` antes); `ChargesPage`, `PlansPage`, `OverduePage` e `PaymentProofsPage` podem ficar com código sem uso (`lint` pega); item perto de 30 arquivos contáveis: cerca de 12 de código, 12 de teste e o `pt-BR.json`, uns 25; se a construção passar de 30, PARAR e propor divisão.

## 5. Tarefas

- [x] T1: Tirar `subtitle`, notas e rodapés de `PlansPage`, `PlanInspectDrawer`, `BenefitsPage`, `ChargesPage`, `DailyReceiptsPage`, `ChargePreviewPage`, `OverduePage`, `PaymentProofsPage` e `AdvanceChargesDialog`, trocar `noFee` em `PixProofDialog` e os textos de `compositionNote`, `daily.subtitle` e `valueLine`, com o código que ficar sem uso e as chaves apagadas após `grep` de cada uma — cobre CA1 a CA9 — prova: `cd frontend && npm run typecheck && npm run lint`
- [x] T2: Ajustar os testes listados no plano (e e2e ou `telasCanvas` que citem os textos) para conferir a ausência ou o texto novo — cobre CA1 a CA8 — prova: `cd frontend && npm test -- PlansPage PlanInspectDrawer BenefitsPage ChargesPage ChargePanel DailyReceiptsPage ChargePreviewPage OverduePage PaymentProofsPage AdvanceChargesDialog RegisterPaymentDialog PixProofDialog`
- [x] T3: Capturas do sistema e do canvas em `.capturas/719/` (1440 e 390 px, pt-BR), `npm run visual:canvas`, regerar só as referências que mudaram (casos da parte e telas que os mostram ao fundo) com `-- --update-snapshots -g "<caso>"`; rodar a suíte inteira sem `--update-snapshots` — cobre CA10 — prova: `cd frontend && npm run test:visual:docker -- --workers=2`
- [x] T4: Regressão local reduzida (`npm run lint && npm run typecheck && npm run build && npm test`; `npm run e2e -- <specs de planos, benefícios, cobranças, pagamento e comprovante>`, nomes conferidos em `frontend/e2e`) e lista tela por tela para o PR, com `Regressão local` e `Comparação com o canvas` registrados — cobre CA9, CA10 — prova: os comandos acima

## 6. Decisões

- D1: Parte c da #646 (resposta do dono à P6, 25/11/2026); a #646 fecha na #721.
- D2 (muda o comportamento): além das chaves nominadas na #646, saem os subtítulos de cabeçalho e as contagens das telas de Financeiro que a regra RNF-45 proíbe: `charges.mobileSubtitle_*`, `charges.overdue.subtitle_*`, `paymentProofs.subtitle_*` (e o subtítulo do celular), `plans.mobileSubtitleAll`, e `charges.preview.subtitleNoUnit`/`charges.daily.subtitleNoUnit`. Alternativa descartada: manter só as chaves nominadas e deixar contagem e unidade em Em atraso, Comprovantes e no celular.
- D3: Ficam, por serem dica junto do campo ou aviso que orienta onde agir: `charges.creation.note` ("Avulsa não conta para o bloqueio por atraso"), `plans.form.validOtherUnitsNote`, `plans.form.impact.note`, `paymentProofs.intro` (aviso de como o comprovante chega), `charges.preview.generatedNote`/`diffNote`/`note` (dados de comparação e orientação de "Ver alunos") e o subtítulo dos painéis e janelas que identifica o registro (`charges.panel.subtitle`, `plans.inspect.subtitle`, `plans.deactivateDialog.subtitle`). Alternativa descartada: tirar também essas; se o dono quiser, é item à parte.
- D4: Daily mantém só a data como subtítulo e `compositionNote` mantém vencimento e geração, como a #646 manda; Prévia sai sem subtítulo (a #646 lista a chave sem manter nada, e o período já está no seletor).
- D5: Sem caso visual novo; a mudança de referência vem da falta dos textos. A T3 roda a suíte inteira por causa dos fundos de painéis e janelas.
- Suposição: `charges.advance.note` é a nota de `AdvanceChargesDialog` ("Se o plano for reajustado depois, as cobranças pagas não mudam", linha ~2872 do JSON, usada em `${k}note`), e `charges.creation.note` é outra chave, a de `OneOffChargeDialog`; se estiver trocado, vale a regra de D3 para a avulsa. `OverduePage` e `PaymentProofsPage` não estão na lista da #646, mas são cobranças e subtelas do Financeiro; se o dono não quiser, D2 desfaz.

## Construção

- T1 — arquivos: `PlansPage`, `PlanInspectDrawer`, `BenefitsPage`, `ChargesPage`, `DailyReceiptsPage`, `ChargePreviewPage`, `OverduePage`, `PaymentProofsPage`, `AdvanceChargesDialog`, `PixProofDialog` (.tsx) e `i18n/pt-BR.json` (chaves de R1 a R8 apagadas; `compositionNote`, `daily.subtitle`, `valueLine` com texto novo) — prova: `npm run typecheck && npm run lint` → passou; `grep` das chaves removidas em `src`, `e2e`, `visual` → sem uso (os `scopeAll`/`scopeUnit` que restam são de Comunicação, Portal e unidade, outras partes).
- T2 — arquivos: `AdvanceChargesDialog`, `ChargePanel`, `ChargePreviewPage`, `ChargesPage`, `DailyReceiptsPage`, `OverduePage`, `BenefitsPage`, `RegisterPaymentDialog`, `PaymentProofsPage`, `PlanInspectDrawer`, `PlansPage`, `PixProofDialog`, `PortalFinancePage` (.test.tsx), passando a conferir a ausência ou o texto novo — prova: `npm test` (inteiro) → 277 arquivos, 3042 testes passaram. Primeira rodada: `TermsPage.test.tsx` falhou uma vez (toolbar do editor, não é do item) e passou nas rodadas seguintes: instável já conhecido.
- T3 — suíte visual inteira com `--workers=2` sem `--update-snapshots`: 80 falhas, todas nos casos esperados (planos, beneficios, cobrancas*, plano-*, beneficio-*, cobranca-*, portal-pix-chave); regerados só esses; `aluno-trocar-plano` passou sem mudança. Nova rodada dos 24 casos da parte sem `--update-snapshots` → 96 passaram. `npm run visual:canvas` → 165 comparadas, 0 reprovadas. Capturas em `.capturas/719/` (sete telas, 1440 e 390, sistema e canvas; conferido lado a lado em Cobranças: o canvas ainda mostra o subtítulo que a decisão 33/34 manda tirar, o resto do layout igual).
- T4 — `npm run lint && npm run typecheck && npm run build && npm test` → passaram; `npm run e2e -- comprovantes.spec.ts pagamento.spec.ts portal-finance.spec.ts` → 8 passaram (só tela de planos, benefícios e cobranças sem spec próprio de e2e).

Regressão: lint, typecheck, build, `npm test` (3042) e e2e dos specs acima passaram; sem back-end tocado.
Regressão local: ~75 min (suíte visual inteira 29 min + regeração + conferência dos 24 casos + testes).
Comparação com o canvas: ~5 min (`visual:canvas` 21 s + capturas e conferência).
Visual do CI: suíte inteira → passou (depois de regerar); planos, beneficios, cobrancas*, plano-*, beneficio-*, cobranca-*, portal-pix-chave, aluno-trocar-plano → passou.
Referências visuais: 80 PNG em `frontend/visual/referencias`: planos (4), plano-novo (4), plano-editar (2), plano-desativar (4), plano-desativado (4), beneficios (4), beneficio-conceder (2), beneficio-substituir (2), beneficio-encerrar (4), cobrancas (4), cobrancas-atrasados (4), cobrancas-recebimentos (4), cobrancas-previa (4), cobrancas-conferencia (4), cobrancas-conferencia-janela (2), cobrancas-erro (4), cobranca-avulsa (4), cobranca-antecipar (4), cobranca-cancelar (4), cobranca-painel (4), cobranca-registrar (4), cobranca-renegociar (2), portal-pix-chave (2).
Padrão de rotas e telas: rotas e moldura não mudaram; `npm test` (shell, noInternalAnchors, routePattern) verde e e2e de comprovantes e pagamento abrem dentro da moldura.
Tamanho: 24 arquivos contáveis (12 de código e `pt-BR.json`, 12 de teste), abaixo de 30.
Desvios: nenhum.
Não é do item: nenhum (a edição em `specs/itens/646-cabecalhos-sem-subtitulo.md` já estava na pasta antes da sessão).

## Verificação

### Rodada 1 — OK — 2026-11-25, estado 8729d56be8928703997395b0b9859b650f032dc4

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA8 | PASSOU | diff lido: subtítulos, notas e rodapés tirados nas telas citadas; `compositionNote`, `daily.subtitle`, `valueLine` com o texto novo; `noFee` trocado por `formatCurrency`; testes ajustados passam em `npm test` |
| CA9 | PASSOU | `npm run lint` e `npm test` (277 arquivos, 3042 testes) verdes; `grep` das chaves removidas em `src`, `e2e`, `visual` sem uso (restam só as chaves dinâmicas `${k}subtitle` do painel e da janela de desativar, que ficam) |
| CA10 | PASSOU | `npm run test:visual:docker -- --workers=2 -g "planos\|beneficio\|cobranca\|plano-\|portal-pix-chave\|aluno-trocar-plano"` → 100 passaram sem `--update-snapshots`; só as 23 famílias de casos esperadas têm PNG alterado; capturas `.capturas/719/` conferidas (Cobranças 1440 sem subtítulo) |

Comandos: `npm run lint && npm run typecheck && npm run build` → 0; `npm test` → 3042 passaram; visual dos casos da parte → 100 passaram; `npm run e2e -- comprovantes.spec.ts pagamento.spec.ts portal-finance.spec.ts` → 8 passaram.
Não rodou (fica para o CI, conforme AGENTS.md): suíte visual inteira, `test:cov`, e2e completo; a construção registra a suíte visual inteira passando.
Instáveis: nenhum visto nesta rodada.
Achados: nenhum.

## Entrega

- O que muda: nas telas de Financeiro (planos, benefícios, cobranças e subtelas, recebimentos, conferência, pagamento manual e comprovante Pix), saem o subtítulo com a unidade, as contagens soltas, as frases de regra interna e as notas de regra; as chaves de `pt-BR.json` que ficaram sem uso saem junto. Layout, API e regras não mudam.
- Verificação: rodada 1 OK (estado `8729d56`). `lint`, `typecheck`, `build` e `npm test` (3042 testes) verdes; e2e de comprovantes, pagamento e portal-finance verde; visual dos 24 casos da parte sem `--update-snapshots` verde; `visual:canvas` com 165 comparadas e 0 reprovadas.
- Divergência com o canvas que sobra: o canvas ainda mostra o subtítulo de Cobranças, que a decisão 33/34 manda tirar; a referência segue o sistema (sem subtítulo), conforme o AGENTS.md.
- Visual do CI: suíte inteira passou (depois de regerar as 80 referências listadas na construção).
- Commit inclui `specs/itens/646-cabecalhos-sem-subtitulo.md`: a edição já estava na pasta de trabalho antes da construção e entrou na rodada verificada; não é alteração de código.
- Base: `origin/dev` avançou para `c72abdf9` (backlog reescrito, `AGENTS.md`) depois da verificação. O merge de `origin/dev` na branch deu conflito em `specs/backlog.md`; merge abortado, sem alteração de código. Entrega bloqueada até a base ser incorporada.
