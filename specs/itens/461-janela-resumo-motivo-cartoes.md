# 461 — Componente base: Janela: blocos de resumo, motivo e cartões de escolha

Origem: issue #461 (Sprint 10.5, Fase 2, plano C6b), `docs/auditoria/plano-de-issues.md` (C6b), `docs/auditoria/decisoes-canvas.md`. Branch: `item/461-janela-resumo-motivo-cartoes`. Canvas das telas-piloto: `CobrancaCancelar.dc.html` (F2) e `EncerrarModalidade.dc.html` (P4); o de celular de Encerrar é `GMEncerrar`. Dependências #448 e #460: mescladas em `dev`. A #451 (botão destrutivo, `ConfirmDialog tone="danger"`) também já está em `dev`.

## 1. Objetivo

Dar às janelas de ação os três blocos que o canvas repete (23 achados M/B): "Resumo" (o que vai acontecer), campo "Motivo *" obrigatório (com nota e contador) e escolha em cartões/alternador. Os blocos entram sobre a `Modal` com `size` (#460) e o botão de perigo da #451. Aplicar em Cancelar cobrança e Encerrar modalidade. As demais janelas (M73, M78, M80, M86, M87, M120 a M127 etc.) trocam nas próprias issues (#465 a #500).

Fora do escopo: migrar outras janelas; mudar API, OpenAPI, MSW (dados), backend ou regra; passos e bloqueio (#462); "Cobrança escolhida" em tabela do Renegociar (#477).

## 2. Requisitos

- R1: `SummaryBox` (existe) passa a ser o bloco "Resumo" do canvas: rótulo em caixa alta pequena e itens; as janelas passam `label` com o texto "Resumo" do pt-BR. Sem `label`, igual a hoje (D1).
- R2: novo `ReasonField`: rótulo com asterisco de obrigatório, `CharCounter` (contador "n/200"), nota de apoio opcional sob o campo e mensagem de erro do campo ligada por `aria-describedby`. Usa só os tokens de `CHAR_COUNTER_FIELD` (D2).
- R3: novo `ChoiceCards`: grupo (`fieldset` + `legend`) de `RadioCard` (existe) em grade de 1 ou 2 colunas, com setas trocando a escolha e alvo de toque de 44 px.
- R4: novo `SegmentedChoice`: alternador de 2 ou 3 opções (ex.: Manter | Cancelar) feito de botões de opção nativos, com rótulo acessível, opção marcada em destaque e alvo de 44 px (D3).
- R5: Cancelar cobrança usa `Modal size="sm"` com título em caixa alta, bloco da cobrança (aluno, descrição ou modalidade/referência, valor, vencimento), `ReasonField` com a nota do canvas ("A cobrança sai do portal do aluno. O relatório financeiro mostra o valor em "cancelado no período", com o seu nome."), rodapé "Voltar" (fantasma) e "Cancelar cobrança" na variante de perigo da #451. Regra mantida: motivo obrigatório até 200, enviar desabilitado até haver motivo e enquanto grava, erro do servidor (campo `reason` ou do alto) na janela (D4).
- R6: Encerrar modalidade usa `ModalityDialog size="sm"|"md"` com título em caixa alta "Encerrar <modalidade>" (nome da modalidade), motivo em `ChoiceCards` (6 motivos, 2 colunas), observação opcional, cobranças em aberto em lista com `SegmentedChoice` Manter/Cancelar por cobrança, um só `ReasonField` "Motivo do cancelamento *" que aparece quando alguma cobrança é cancelada, e `SummaryBox` "Resumo" com as linhas de efeito do canvas (D5, D6).
- R7: Encerrar modalidade mantém as regras: motivo obrigatório; cobrança com pedido de encerramento (`afterRequest`) aparece como "será cancelada" sem escolha; o POST leva `reason`, `note` e a decisão de cada cobrança (as canceladas com o mesmo motivo de cancelamento); botão desabilitado até motivo e, havendo cancelamento, motivo do cancelamento.
- R8: textos só em `pt-BR.json`; cores, fontes e tamanhos só por tokens; axe passa nos dois temas; sem rolagem lateral a 360 px.
- R9: os blocos e o seu uso constam em `docs/design/README.md` (tabela Componentes) e na Vitrine.
- R10: casos visuais novos `cobranca-cancelar` e `aluno-encerrar-modalidade` no teste visual, referências geradas e comparadas com o canvas (1440 e 390, pt-BR; celular só onde o canvas existe); divergência restante entra como `limiteCanvas` com motivo e a issue que a remove.
- R11: nenhuma outra tela muda de aparência (nenhuma outra referência visual muda).

## 3. Critérios de aceite

- CA1 (R1): dado `SummaryBox` sem `label`, então o teste atual passa sem mudança; com `label`, o rótulo aparece em caixa alta.
- CA2 (R2): dado `ReasonField` vazio com erro, então o campo tem `aria-required`, `aria-invalid` e `aria-describedby` apontando para o erro; o contador mostra "0/200"; a nota aparece sob o campo; não aceita mais de 200 caracteres.
- CA3 (R3): dado `ChoiceCards` com 3 opções, quando se escolhe uma pelo clique ou pelas setas, então `onChange` recebe o valor e só uma fica marcada; o grupo tem nome acessível pela legenda.
- CA4 (R4): dado `SegmentedChoice` com Manter e Cancelar, quando se clica em Cancelar, então `onChange("cancel")` é chamado e a opção fica marcada; setas trocam; cada opção tem altura mínima de 44 px.
- CA5 (R5): dada uma cobrança em aberto (MSW), quando a pessoa abre "Cancelar cobrança" no painel, então vê título em caixa alta, resumo da cobrança, "Motivo *" e a nota; "Cancelar cobrança" fica desabilitado sem motivo; com motivo, cancela e a lista atualiza; "Voltar" fecha sem cancelar; erro 400 do campo `reason` aparece no campo; 409 e 404 aparecem no alto, com a janela aberta.
- CA6 (R6, R7): dado aluno com modalidade ativa e cobranças em aberto (MSW), quando abre "Encerrar", então os motivos aparecem em cartões, cada cobrança tem Manter (marcado) e Cancelar, o "Motivo do cancelamento *" só aparece ao marcar Cancelar em alguma, e o resumo lista "<modalidade> fica Encerrada hoje, <data>", "Mantida: … Cancelada: …", a outra modalidade continua Ativa e o aviso por e-mail.
- CA7 (R7): dado Encerrar sem motivo, então o botão fica desabilitado; com motivo e sem cobranças canceladas, habilita e o POST sai sem `reason` por cobrança; marcando Cancelar sem o motivo do cancelamento, desabilita; com ele, o POST leva `CANCEL` e o mesmo motivo para cada cobrança cancelada; `afterRequest` aparece sem escolha; erro do servidor aparece na janela aberta.
- CA8 (R8): `npm run lint` sem texto literal; `tokens.test.ts` passa; axe sem violação nos dois temas (Vitrine e as duas janelas); a 360 px (Playwright) sem rolagem lateral nas duas janelas.
- CA9 (R9): `design-readme.test.ts` passa com os blocos descritos.
- CA10 (R10): `npm run test:visual:docker` passa com referências novas de `cobranca-cancelar` e `aluno-encerrar-modalidade` (e `vitrine` só se mudar); `npm run visual:canvas -- --exige` não reprova; capturas em `.capturas/461/` (`<tela>-<largura>-{sistema,canvas}.png`); `visual/casos.test.ts` passa (as duas telas saem da lista "sem caso").
- CA11 (R11): `npm run test:cov` e o e2e passam; nenhuma outra referência visual mudou.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (visual; a permissão e a regra seguem no servidor; sem dado novo). O envio de Encerrar continua com o mesmo corpo (`endModality`), só com o motivo de cancelamento único copiado a cada cobrança cancelada (D5).
- Interface:
  - `frontend/src/components/ui/summary-box.tsx` (existe): só ajusta o rótulo ao canvas se faltar (caixa alta já existe); sem `label`, intacto.
  - `frontend/src/components/ReasonField.tsx` (a criar) e `ReasonField.test.tsx`: sobre `CharCounter` e `CHAR_COUNTER_FIELD` (existem), com rótulo "*", `note`, `error`.
  - `frontend/src/components/ui/choice-cards.tsx` (a criar): `fieldset`/`legend` + `RadioCard` (existe); `segmented-choice.tsx` (a criar); testes ao lado.
  - `frontend/src/features/charges/CancelChargeDialog.tsx` (existe): trocar `Modal` sem `size` por `Modal size="sm"` com `footer`, `ReasonField` e bloco da cobrança; `Failure`, `failureOf`, `FieldError` e `NO_FAILURE` continuam exportados (usados por outras janelas); botão de perigo como o `ConfirmDialog tone="danger"` da #451 usa.
  - `frontend/src/features/students/EndModalityDialog.tsx` (existe): `ModalityDialog size`, `ChoiceCards`, `SegmentedChoice`, `ReasonField`, `SummaryBox`; estado `choices` perde o motivo por cobrança e ganha um `cancelReason`; o resumo vem de `preview` e das escolhas (data de hoje no fuso da unidade pelo `formatDate` de `@/lib/format`).
  - `frontend/src/features/students/ModalityPickers.tsx` (existe): `ModalityDialog` já aceita `size`; sem mudança prevista. Título com o nome da modalidade e `effect` vazio (o resumo substitui) se o `effect` atrapalhar o canvas.
  - `frontend/src/i18n/pt-BR.json` (existe): chaves de `charges.cancel.*` e `students.record.enrollment.end.*` (resumo, nota, rótulos), e `common.back` ("Voltar") se não existir.
  - `frontend/src/dev/Vitrine.tsx` e `docs/design/README.md` (existem): exemplo dos três blocos e linha na tabela Componentes.
  - `frontend/visual/casos.ts` (existe): casos `cobranca-cancelar` (rota `/cobrancas`, passos: abrir a cobrança e clicar "Cancelar cobrança") e `aluno-encerrar-modalidade` (rota da ficha do aluno fictício com cobrança em aberto, passos: aba Matrícula, "Encerrar"; `canvasCelular: "GMEncerrar"`); tirar `CobrancaCancelar` e `EncerrarModalidade` das listas "sem caso" (e `GMEncerrar` da de celular, se o caso passar a cobri-lo); `limiteCanvas` com motivo e issue (#477 para a cobrança, #468 para Encerrar) onde a medida pedir. O MSW precisa de um aluno com cobranças em aberto para o caso: usar o que já existe; se faltar dado, só acrescentar ao MSW sem mudar contrato.
  - `frontend/visual/referencias/`: PNG novos dos dois casos.
  - Testes: `CancelChargeDialog` (hoje coberto por `ChargePanel.test.tsx`), `EndModalityDialog.test.tsx`, `SummaryBox`, `ReasonField`, `ChoiceCards`, `SegmentedChoice`, `src/test/a11y.test.tsx`, e2e de 360 px (em `e2e/` de cobranças e alunos).
- Reuso: `Modal size` (#460), `RadioCard`, `SummaryBox`, `CharCounter`, `Banner`, `Button` (variantes `danger` e `ghost`), `ModalityDialog`, `failureOf`.
- Riscos: `CancelChargeDialog` exporta `failureOf`/`FieldError`, usados por outras janelas (renegociar, trocar vencimento): não mudar essas assinaturas; testes que acham "Cancelar" ou o motivo por cobrança em Encerrar mudam de rótulo; o texto "não pode ser reaberta" some do efeito (a regra RN-COB-10 não a exige; vai para o Resumo se a especificação pedir, conferir na construção); `ModalityDialog` serve 13 telas (só `size` ativa o rodapé novo, como na #460).

## 5. Tarefas

- [x] T1: `ReasonField`, `ChoiceCards`, `SegmentedChoice` e rótulo do `SummaryBox` com testes — cobre CA1, CA2, CA3, CA4 — prova: `cd frontend && npx vitest run src/components/ReasonField.test.tsx src/components/ui/choice-cards.test.tsx src/components/ui/segmented-choice.test.tsx src/components/ui/summary-box.test.tsx`
- [x] T2: Cancelar cobrança sobre os blocos, textos pt-BR e testes — cobre CA5 — prova: `cd frontend && npx vitest run src/features/charges`
- [x] T3: Encerrar modalidade sobre os blocos, textos pt-BR e testes — cobre CA6, CA7 — prova: `cd frontend && npx vitest run src/features/students`
- [x] T4: Vitrine, `docs/design/README.md` e axe nos dois temas — cobre CA8, CA9 — prova: `cd frontend && npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev`
- [x] T5: e2e de 360 px sem rolagem lateral nas duas janelas — cobre CA8 — prova: `cd frontend && npx playwright test -g "360 px"` nos specs de cobranças e alunos
- [x] T6: casos visuais, referências no container, comparação com o canvas (1440 e 390, pt-BR, `.capturas/461/`) e lista de divergências para o PR — cobre CA10 — prova: `cd frontend && npx vitest run visual/casos.test.ts && npm run test:visual:docker -- --update-snapshots=all -g "cobranca-cancelar|aluno-encerrar-modalidade"` e `npm run visual:canvas -- --exige`
- [x] T7: regressão do front — cobre CA11 — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov && npm run e2e`, e conferir no `git status` que só mudaram os PNG previstos

## 6. Decisões

- D1: os blocos nascem como componentes pequenos e opt-in (um arquivo cada), reaproveitando `SummaryBox`, `RadioCard`, `CharCounter` e `Modal size` que já existem, em vez de um componente "Janela de ação" único. Motivo: cada tela do canvas combina os blocos de um jeito; a issue pede só os blocos e dois pilotos. Alternativa: um `ActionDialog` que recebe tudo por props, descartada por virar outro `Modal`.
- D2: `ReasonField` cobre só motivo de texto livre (até 200, ou o `max` recebido). O campo de mensagem com texto sugerido e "164 de 500" (M127) é da #471. Motivo: não inventar o que nenhum piloto usa.
- D3: `SegmentedChoice` é feito de botões de opção nativos (`input type=radio` estilizados), não de botões soltos. Motivo: teclado, leitor de tela e formulário de graça; é o mesmo caminho do `RadioCard`.
- D4: Cancelar cobrança fica com o botão de perigo da #451 (`Button danger`, contorno vermelho) e "Voltar" fantasma; a medida na comparação diz se o canvas pede vermelho cheio, e então muda-se só ali. A regra "não pode ser reaberta" deixa o efeito e a nota passa a ser a do canvas; se a especificação disser que a frase é regra, ela entra no Resumo.
- D5 (muda o comportamento): Encerrar modalidade passa a ter **um** "Motivo do cancelamento *" para todas as cobranças canceladas, como no canvas, em vez de um motivo por cobrança. O envio ao servidor não muda (o mesmo motivo é copiado para cada cobrança cancelada), então RN-MAT-17 continua valendo (cada cobrança cancelada tem motivo). Alternativa: manter um campo por cobrança, descartada porque o canvas vence em layout e o contrato não muda.
- D6: o `ModalityDialog` mantém a linha "<aluno> · <modalidade> (<unidade>)" só se o canvas a trouxer; o resumo vem das escolhas na tela, sem chamar a API. Suposição: se o `useEndPreview` não trouxer a outra modalidade ativa do aluno, a linha "continua Ativa" usa os dados da ficha já carregada; se não houver, a linha sai e vai para o `limiteCanvas` da #468.
- D7: divergências que outra issue da 10.5 resolve (tabela de turmas, chips do motivo, `GM*`) entram como `limiteCanvas` com a issue (#468 para Encerrar, #477 para Cancelar cobrança), e essas issues ganham a remoção no "Pronto quando" (AGENTS.md, Autonomia 4).
- Suposição: o canvas de celular de Cancelar cobrança não existe (não há `GM*` dela); o de Encerrar é `GMEncerrar`. Onde não houver canvas a 390 px, a comparação só registra a captura do sistema, como na #460 e na #451.

## Construção

- T1 — arquivos: `frontend/src/components/ReasonField.tsx`, `ui/choice-cards.tsx`, `ui/segmented-choice.tsx` (+ testes ao lado), `ui/summary-box.test.tsx` (`SummaryBox` já tinha o rótulo em caixa alta; só ganhou teste) — prova: `npx vitest run src/components/ReasonField.test.tsx src/components/ui/choice-cards.test.tsx src/components/ui/segmented-choice.test.tsx src/components/ui/summary-box.test.tsx` → 6 testes passam
- T2 — arquivos: `features/charges/CancelChargeDialog.tsx` (`Modal size="sm"`, rodapé "Voltar" + "Cancelar cobrança" em `dangerSolid`, bloco "Cobrança", `ReasonField` com a nota do canvas; `Failure`, `failureOf`, `FieldError`, `NO_FAILURE` intactos), `ChargePanel.test.tsx` (CA5 e axe nos dois temas), `i18n/pt-BR.json` — prova: `npx vitest run src/features/charges` → 8 arquivos, 86 testes passam
- T3 — arquivos: `features/students/EndModalityDialog.tsx` (`ChoiceCards`, `SegmentedChoice`, um só `ReasonField` "Motivo do cancelamento *", `SummaryBox` "Resumo"; prop opcional `others` com as outras modalidades ativas), `RecordEnrollment.tsx` (passa `others`), `ModalityPickers.tsx` (rodapé com `size` usa "Voltar"), `EndModalityDialog.test.tsx`, `RecordEnrollment.test.tsx`, `i18n/pt-BR.json` — prova: `npx vitest run src/features/students` → 14 arquivos, 167 testes passam
- T4 — arquivos: `src/dev/Vitrine.tsx`, `docs/design/README.md` (linha nova e `SummaryBox` com `label`) — prova: `npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev` → 63 testes passam (axe das duas janelas nos dois temas em `ChargePanel.test.tsx` e `EndModalityDialog.test.tsx`)
- T5 — arquivos: `frontend/e2e/alunos.spec.ts` (dois testes "360 px"; o cenário matricula o aluno adulto pela API simulada, porque no e2e os cenários do MSW ficam desligados) — prova: `npx playwright test e2e/alunos.spec.ts -g "360 px"` → 3 passam
- T6 — arquivos: `visual/casos.ts` (casos `cobranca-cancelar` e `aluno-encerrar-modalidade`; `CobrancaCancelar` e `EncerrarModalidade` saem de "sem caso"), `visual/telas.visual.ts` e o tipo `Passo` (`papel: "tab"` para clicar a aba Matrícula) — prova: `npx vitest run visual/casos.test.ts` → 100 passam; `npm run test:visual:docker -- --update-snapshots=all -g ...` → referências geradas; `npm run visual:canvas -- --exige` → 101 comparadas, 0 reprovadas. Capturas em `.capturas/461/`.
Referências visuais: novas `cobranca-cancelar-{1440,390}-{claro,escuro}.png` e `aluno-encerrar-modalidade-{1440,390}-{claro,escuro}.png`; regeradas `vitrine-{1440,390}-{claro,escuro}.png` (blocos novos na Vitrine).
- T7 — `npm run lint` → ok; `npm run typecheck` → ok; `npm run test:cov` → 220 arquivos, 2089 testes passam (cobertura acima do exigido); `npm run e2e` → 96 passam, 2 falharam por tempo esgotado (`organizacao.spec.ts` e `portal-pedidos.spec.ts`, fora do item) e passaram ao rodar de novo.
Regressão: na primeira rodada do `test:cov`, `LoginPage.test.tsx` (#445, "trava com horário") falhou uma vez e passou isolado e na segunda rodada completa (instável, fora do item). No `git status` só mudaram os PNG previstos; o back-end não foi tocado e não rodou.
Desvios:
- D4 pedia "Voltar"/perigo da #451 e a medida dizia se o canvas pedia vermelho cheio: o canvas pede vermelho cheio, então Cancelar cobrança usa `Button dangerSolid` (só ali). No Encerrar modalidade o botão de ação continua o primário do `ModalityDialog` (canvas: vermelho cheio) e entra na divergência da #468.
- "Voltar" no rodapé de Encerrar exigiu trocar o rótulo no `ModalityDialog` quando há `size` (só o Encerrar usa `size`); sem `size` segue "Cancelar".
- `GMEncerrar` é de 360 px, não 390: continua em "sem caso" (celular a 360 px) em vez de `canvasCelular`; a captura de 390 do sistema fica só como registro.
- A linha "<aluno> · <modalidade> (<unidade>)" saiu (o canvas não a traz). A frase "não pode ser reaberta" saiu do efeito de Cancelar cobrança (nota do canvas no lugar; RN-COB-10 não a exige).
- Motivos de encerramento mantêm os rótulos do sistema (6 motivos, "Motivo financeiro"); o canvas mostra 5 e "Financeiro".
- `limiteCanvas`: `cobranca-cancelar` 0,75 (medido 70,2%) e `aluno-encerrar-modalidade` 0,55 (medido 52,7%), ambos com motivo; as issues #477 e #468 ganharam a remoção no "Pronto quando" (editadas via `gh issue edit`).
Divergências achadas na comparação (para o PR): Cancelar cobrança — a cobrança exibida e a lista atrás são outras (dados do MSW), o canvas mostra ícone no bloco Cobrança e o texto do motivo já preenchido; resolvidos: título em caixa alta, bloco, "Motivo *", nota, rodapé Voltar + vermelho cheio. Encerrar — o canvas traz motivo em lista suspensa (a issue e o item pedem cartões), cobranças em tabela com Valor e "O que fazer" (#468), "Cobranças em aberto desta modalidade" e botão de ação em vermelho cheio (#468); resolvidos: título "Encerrar <modalidade>", Manter/Cancelar em alternador, um só "Motivo do cancelamento *", Resumo com as quatro linhas, rodapé Voltar.
Não é do item: nenhum.

## Verificação

### Rodada 1 — OK — 2026-11-09, estado 62f3bf9bc25f409cc8d643ce3482061e96152a92

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `summary-box.test.tsx` passa (vitest src/components) |
| CA2 | PASSOU | `ReasonField.test.tsx` passa; diff: `aria-required`, `aria-invalid`, `aria-describedby`, `CharCounter` max 200 |
| CA3 | PASSOU | `choice-cards.test.tsx` passa; `fieldset`/`legend` + `RadioCard` nativo |
| CA4 | PASSOU | `segmented-choice.test.tsx` passa; `min-h-11`, radios nativos |
| CA5 | PASSOU | `ChargePanel.test.tsx` (src/features/charges) passa; diff do `CancelChargeDialog` confere |
| CA6 | PASSOU | `EndModalityDialog.test.tsx` e `RecordEnrollment.test.tsx` passam; captura 1440 mostra cartões, Manter/Cancelar, Resumo |
| CA7 | PASSOU | `EndModalityDialog.test.tsx`; `canSubmit` e `decisions` conferidos no diff |
| CA8 | PASSOU | `npm run lint` e `typecheck` ok; `tokens.test.ts` ok; axe em `a11y.test.tsx`/testes das janelas; e2e `-g "360 px"` 3 passam |
| CA9 | PASSOU | `design-readme.test.ts` passa (49 testes com `tokens.test.ts`) |
| CA10 | PASSOU | `visual/casos.test.ts` passa; PNG novos presentes; capturas em `.capturas/461/` abertas e comparadas; `limiteCanvas` com motivo e issue registrados na Construção. `visual:canvas --exige` e `test:visual:docker` não reexecutados (aceito o resultado da Construção: 101 comparadas, 0 reprovadas) |
| CA11 | PASSOU | só mudaram PNG previstos (vitrine + 8 novos); vitest de components, charges, students, a11y, casos passam |

Comandos: `npm run lint && npm run typecheck` ok; `npx vitest run src/components src/features/charges src/features/students src/test/a11y.test.tsx visual/casos.test.ts --maxWorkers=2` na primeira execução 2 falhas (outro arquivo, teste "Tentar de novo"), repetida por pasta e a11y/casos: tudo passa; `npx playwright test e2e/alunos.spec.ts -g "360 px"` 3 passam.
Instáveis: 2 testes falharam na execução ampla e passaram na repetição (1 falha em 2 execuções); arquivo não identificado no log curto, fora do escopo do item.
Achados:
- sugestão, código, `EndModalityDialog.tsx` — `formatDate(new Date())` usa o fuso padrão (DEFAULT_TZ), não o da unidade; conferir se coincide.
- sugestão, código — a captura do sistema usa dados MSW diferentes do canvas (só uma cobrança; sem outra modalidade ativa); já registrado como divergência.

## Entrega

**O que muda.** Três blocos de janela no `frontend/src/components/`: `ReasonField` (campo "Motivo *", com nota e contador de 200 caracteres, `aria-required`, `aria-invalid` e `aria-describedby`), `ChoiceCards` (escolha em cartões, `fieldset`/`legend` com radios nativos) e `SegmentedChoice` (alternador, `min-h-11`). `SummaryBox` vira o bloco "Resumo". Aplicados em `CancelChargeDialog` e `EndModalityDialog`; `EndModalityDialog` perde o motivo por cobrança e ganha um `cancelReason` único. Textos em `pt-BR.json`. Oito PNG novos de referência (cobrança-cancelar e aluno-encerrar-modalidade, 1440 e 390, claro e escuro) e a vitrine regenerada.

**Como foi verificado.** Rodada 1 da Verificação, `OK`, estado `62f3bf9bc25f409cc8d643ce3482061e96152a92`: CA1 a CA11 passaram. `npm run lint` e `typecheck` limpos; vitest das pastas tocadas; e2e `-g "360 px"` com 3 passando; teste visual com 101 telas comparadas e 0 reprovadas (feito na Construção). Capturas em `.capturas/461/`.

**Decisões.** `limiteCanvas` com motivo em `cobranca-cancelar` (0,75; medido 70,2%) e `aluno-encerrar-modalidade` (0,55; medido 52,7%). As issues #477 e #468 ganharam a remoção no "Pronto quando". As divergências com o canvas e como foram resolvidas estão na seção "Construção".

**Instáveis.** Na execução ampla da Verificação, 2 testes falharam e passaram na repetição (arquivo não identificado no log curto). Fora do escopo do item; anotado aqui e no PR.

**A conferir.** `EndModalityDialog.tsx` usa `formatDate(new Date())` com o fuso padrão (`DEFAULT_TZ`), não o da unidade. A Verificação marcou como sugestão; não muda o resultado do item.

**Limitações.** Divergências que a tela ainda não resolve estão na lista de `limiteCanvas` acima. A regressão completa não foi rodada de novo nesta fase: a base `dev` não avançou desde a verificação.
