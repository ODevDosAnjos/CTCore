# 451 — Componente base: Botão destrutivo e confirmação de ação sensível

Origem: issue #451 (Sprint 10.5, Fase 2, plano C9), `docs/auditoria/plano-de-issues.md` (C9), `docs/auditoria/decisoes-canvas.md`. Branch: `item/451-botao-destrutivo-confirmacao`. Canvas das telas-piloto: `ProfessorInativar.dc.html` (P6) e `PortalRevogarImagem.dc.html` (F1-05). Dependências: #448 e #460 já mescladas em `dev`.

## 1. Objetivo

Dar à confirmação de ação sensível (`ConfirmDialog`, hoje com resumo, motivo e texto digitado) o visual de perigo do canvas: janela base (#460) com título em caixa alta, subtítulo opcional, ação principal em vermelho e "Cancelar" fantasma no rodapé fixo. Aplicar em Inativar professor e Revogar uso de imagem. As demais telas (M47, M70, M74, M80, M101, M110, M127, M130, B3, B11) trocam nas próprias issues.

Fora do escopo: migrar outras janelas; escolher novo titular e campo "Motivo" do Inativar professor (o canvas os mostra, mas exigem mudar API e regra; ficam no `limiteCanvas`, removido pela #470); blocos de resumo e motivo novos (#461); mudar OpenAPI, MSW ou backend.

## 2. Requisitos

- R1: `ConfirmDialog` ganha as props opcionais `tone="danger"`, `size` (repassado à `Modal`), `subtitle`, `cancelLabel`, `confirmDisabled` e `children` (conteúdo extra do corpo, depois do resumo). Sem elas, a janela fica como hoje (D1).
- R2: com `tone="danger"`, a ação principal usa a variante vermelha de `Button` e "Cancelar" usa a variante fantasma; o rodapé segue fixo (`Modal` com `size`). Sem `tone`, os botões continuam `secondary` e `primary` (D2).
- R3: com `typedText`, a ação fica desabilitada até o texto bater, como hoje; vale também em `tone="danger"`.
- R4: Inativar professor usa `ConfirmDialog` com `tone="danger"` e `size="sm"`: título em caixa alta "Inativar <nome>", frase "O acesso dele é desligado agora. O histórico de aulas e graduações continua.", turmas sem titular em aviso, resumo e botão "Inativar professor". Mantém prévia (carregando/erro com tentar de novo), bloqueio `canDeactivate`, erros do servidor e o POST atual sem corpo (D3, D4).
- R5: Revogar uso de imagem usa `tone="danger"`; o texto de efeito, o resumo de 3 itens e "Cancelar"/"Revogar" seguem o canvas; continua exigindo confirmação antes de revogar (já feita na #441).
- R6: textos só em `pt-BR.json`; cores, fontes e tamanhos só por tokens; axe passa nos dois temas; sem rolagem lateral a 360 px; alvo de toque de 44 px.
- R7: componente e uso constam em `docs/design/README.md` (linhas Botão e Janela) e na Vitrine.
- R8: referências visuais das duas telas regeradas e comparadas com o canvas (1440 e 390 px, pt-BR); divergência restante entra como `limiteCanvas` com motivo e issue.
- R9: nenhuma outra tela muda de aparência (nenhuma outra referência visual muda).

## 3. Critérios de aceite

- CA1 (R1): dado `ConfirmDialog` sem as props novas, então os testes atuais de `ConfirmDialog.test.tsx`, `AgeRangesPage`, `OrganizationSettingsPage`, `SessionsSection`, `RecordGuardians` e `TextsPage` passam sem mudança.
- CA2 (R1, R2): dado `tone="danger"` e `size="sm"`, quando a janela abre, então o título está em caixa alta, o subtítulo aparece sob ele, "Cancelar" é fantasma, a ação principal é a variante vermelha e ambas ficam no rodapé fora da rolagem.
- CA3 (R3): dado `typedText="DESATIVAR"` com `tone="danger"`, quando o texto está vazio ou diferente, então a ação fica desabilitada e o status diz o que falta; com o texto certo, habilita e chama `onConfirm`.
- CA4 (R1): dado `confirmDisabled`, então a ação principal fica desabilitada mesmo com motivo e texto corretos.
- CA5 (R4): dado professor com turmas de titular (MSW), quando abre Inativar, então as turmas sem titular aparecem, a frase do acesso aparece e "Inativar professor" chama a API; com `canDeactivate` falso a ação fica desabilitada e o aviso de alcance aparece; falha da prévia mostra erro com "Tentar de novo"; erro do POST aparece na janela e ela segue aberta.
- CA6 (R5): dado aluno com uso de imagem autorizado, quando clica "Revogar", então abre a janela com resumo; "Cancelar" não revoga; "Revogar" revoga e atualiza.
- CA7 (R6): `npm run lint` sem texto literal; `tokens.test.ts` passa; axe sem violação nos dois temas (Vitrine e as duas janelas); a 360 px (Playwright) sem rolagem lateral.
- CA8 (R7): `design-readme.test.ts` passa com o componente descrito.
- CA9 (R8): `npm run test:visual:docker` passa com referências regeradas só de `professor-inativar`, `portal-revogar-imagem` e `vitrine` (se mudar); `npm run visual:canvas -- --exige` não reprova; capturas em `.capturas/451/` (`<tela>-<largura>-{sistema,canvas}.png`).
- CA10 (R9): `npm run test:cov` e o e2e passam; nenhuma outra referência visual mudou.

## 4. Plano técnico

- Dados e API: não mudam (D3).
- Segurança: não se aplica; permissão e reconferência seguem no servidor (`POST /teachers/{id}/deactivate`, RF-PRO-04). Sem senha, token ou dado novo na tela.
- Interface:
  - `frontend/src/components/ConfirmDialog.tsx` (existe): props novas; `Modal` recebe `size`; `subtitle` entra sob o título (se a `Modal` não tiver subtítulo, como primeiro parágrafo do corpo, em texto de apoio); botões do rodapé por `tone` (`danger` + `ghost`); `children` depois do `SummaryBox`.
  - `frontend/src/components/Modal.tsx` (existe): só se faltar suporte a subtítulo com `size`; sem `size`, intacta.
  - `frontend/src/features/teachers/DeactivateTeacherDialog.tsx` (existe): trocar `Modal` e botões por `ConfirmDialog`; prévia, lista e avisos viram `children`; `onConfirm` lança em erro para a janela ficar aberta, e o erro de formulário fica nos `children`. Separar turmas de titular das de auxiliar só se `DeactivationPreview` permitir (D4).
  - `frontend/src/features/portal/PortalSettings.tsx` (existe): `ConfirmDialog` de `PortalTermsAccepted` com `tone="danger"`; ajustar `portalInfo.terms.revoke*` ao canvas.
  - `frontend/src/i18n/pt-BR.json` (existe): chaves de `teachers.panel.deactivateDialog` e `portalInfo.terms.revoke*`.
  - `frontend/src/dev/Vitrine.tsx` (existe, já usa `ConfirmDialog`) e `docs/design/README.md` (linhas Botão e Janela): exemplo `tone="danger"`.
  - `frontend/visual/casos.ts` (existe): casos novos `professor-inativar` (canvas `ProfessorInativar`, passos: abrir o painel do professor e clicar "Inativar") e `portal-revogar-imagem` (canvas `PortalRevogarImagem`, passo: clicar "Revogar"), com `limiteCanvas` de motivo e issue (#470 para o professor).
  - `frontend/visual/referencias/`: PNG novos dos dois casos e `vitrine-*` se mudar.
  - Testes: `ConfirmDialog.test.tsx`, `TeacherPanelPage.test.tsx`, `PortalInfoPage.test.tsx`, `src/test/a11y.test.tsx`, e2e de 360 px.
- Reuso: `ConfirmDialog`, `Modal` com `size` (#460), `Button` variantes `danger` e `ghost` (já existem), `SummaryBox`, `Banner`, `LoadingState`, `ErrorState`.
- Riscos: 7 usos de `ConfirmDialog`, por isso tudo é opt-in (CA1); testes do diálogo do professor que procuram "Inativar" ou "Cancelar" mudam de nome do botão; o CA9 depende de o MSW ter professor com turmas e aluno do portal com imagem autorizada; qual vermelho (contorno ou cheio) o canvas usa, medir na comparação (D2).

## 5. Tarefas

- [x] T1: `ConfirmDialog` com `tone`, `size`, `subtitle`, `cancelLabel`, `confirmDisabled`, `children` e testes — cobre CA1, CA2, CA3, CA4 — prova: `cd frontend && npx vitest run src/components/ConfirmDialog.test.tsx src/features/age-ranges src/features/organization src/features/account src/features/texts`
- [x] T2: Inativar professor sobre `ConfirmDialog` de perigo, textos pt-BR e testes — cobre CA5 — prova: `cd frontend && npx vitest run src/features/teachers`
- [x] T3: Revogar uso de imagem com `tone="danger"` e textos do canvas — cobre CA6 — prova: `cd frontend && npx vitest run src/features/portal src/features/students`
- [x] T4: Vitrine, `docs/design/README.md`, axe nos dois temas e e2e de 360 px — cobre CA7, CA8 — prova: `cd frontend && npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev && npx playwright test -g "360 px"`
- [x] T5: casos visuais, referências no container, comparação com o canvas (1440 e 390, pt-BR, `.capturas/451/`) e lista de divergências para o PR — cobre CA9 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots=all -g "professor-inativar|portal-revogar-imagem|vitrine"` e `npm run visual:canvas -- --exige`
- [x] T6: regressão do front — cobre CA10 — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov && npm run e2e`, e conferir no `git status` que só mudaram os PNG previstos

## 6. Decisões

- D1: evoluir o `ConfirmDialog` existente, em vez de criar outro componente. Motivo: ele já tem resumo, motivo e texto digitado, e já é a confirmação do produto (RNF-26); tudo é opt-in para as 7 telas que o usam. Alternativa: componente novo, descartada por duplicar a lógica de motivo e texto.
- D2 (muda o visual): ação principal de `tone="danger"` na variante `danger` de `Button` (contorno vermelho; M47, M80 e M130 descrevem assim) e "Cancelar" fantasma. Motivo: a variante já existe nos tokens. Suposição: se a captura do canvas das duas pilotos mostrar vermelho cheio, troca-se para `dangerSolid` só neste ponto.
- D3: Inativar professor não ganha "Motivo" nem escolha de novo titular agora. Motivo: exigem corpo novo no POST e regra de troca de titular, que a especificação (RF-PRO-04) não define e está na #470; a issue pede só o componente e o visual. Fica no `limiteCanvas` com a #470, que já cobre M125.
- D4: se a prévia da API não separar turmas de titular e de auxiliar, a lista continua como hoje e a separação (M125) fica para a #470. Suposição: conferida na construção no tipo `DeactivationPreview`.
- Suposição: o canvas de celular de `ProfessorInativar` e `PortalRevogarImagem` pode não existir (como na #460); a comparação a 390 px então só registra a captura do sistema.

## Construção

- T1 — arquivos: frontend/src/components/ConfirmDialog.tsx, ConfirmDialog.test.tsx — prova: `npx vitest run src/components/ConfirmDialog.test.tsx src/features/age-ranges src/features/organization src/features/account src/features/texts` → 8 arquivos, 93 testes passam. Subtítulo entra como primeiro parágrafo do corpo (Modal sem subtítulo; Modal intacta).
- T2 — arquivos: features/teachers/DeactivateTeacherDialog.tsx, TeacherPanelPage.test.tsx, i18n/pt-BR.json (accessEnds novo, confirm "Inativar professor") — prova: `npx vitest run src/features/teachers` → 51 passam. D4: DeactivationPreview traz role HEAD/ASSISTANT, mas a lista segue como hoje (separação fica na #470).
- T3 — arquivos: features/portal/PortalSettings.tsx (tone="danger", size="sm"; textos já batiam com o canvas) — prova: `npx vitest run src/features/portal src/features/students` → 362 passam.
- T4 — arquivos: dev/Vitrine.tsx, docs/design/README.md, e2e/professores.spec.ts (teste "Inativar professor a 360 px") — prova: `vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev` → 61 passam; `playwright test -g "360 px" e2e/professores.spec.ts` → 2 passam.
- T5 — arquivos: visual/casos.ts (professor-inativar, portal-revogar-imagem) + 8 PNG novos em visual/referencias — prova: `npm run test:visual:docker -- --update-snapshots=all -g "professor-inativar|portal-revogar-imagem|vitrine"` → 12 passam (vitrine não mudou); `npm run visual:canvas -- --exige` → 99 comparadas, 0 reprovadas. Capturas em .capturas/451/ (1440 sistema e canvas; 390 só do sistema: canvas de celular não existe).
Divergências da comparação: (1) professor-inativar: canvas usa vermelho cheio e traz escolha de novo titular, tabela de turmas e Motivo; sistema usa contorno vermelho (D2) e lista simples — limiteCanvas 0.70, #470. (2) portal-revogar-imagem: janela confere (contorno vermelho, resumo, rodapé); página atrás é mais longa — limiteCanvas 0.85 com motivo, #498.
Desvios: portal-revogar-imagem usa limiteCanvas citando #498 (o plano citava #470 só para o professor). A #498 deve ganhar a remoção no "Pronto quando".
Referências visuais: visual/referencias/professor-inativar-{1440,390}-{claro,escuro}.png e portal-revogar-imagem-{1440,390}-{claro,escuro}.png (novas).
Correção durante a regressão: visual/casos.ts tinha ProfessorInativar e PortalRevogarImagem na lista de telas sem caso; removidos (visual/casos.test.ts passa, 98 testes).
- T6 — Regressão: `npm run lint` e `typecheck` ok; `npm run test:cov` 2075 de 2076 na última rodada, com testes instáveis alheios ao item que mudaram de rodada (LoginPage trava com horário, ChargePreviewPage, DailyReceiptsPage); cada um passou ao rodar de novo (DailyReceiptsPage isolado: 5 passam), e a rodada completa final tinha 1 instável de timeout em DailyReceiptsPage. `npm run e2e` → 98 passam. git status só traz os arquivos previstos e os 8 PNG novos. Instáveis: reportar para a regra 5 (issue técnica se repetirem).

## Verificação

### Rodada 1 — OK — 2026-11-09, estado b618424f4b5da82e8142ba5dcec71010ac2c5783

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | vitest de components, age-ranges, organization, account, texts: sem mudança nos testes antigos, todos passam |
| CA2 | PASSOU | ConfirmDialog.test "R1/R2" (caixa alta, subtítulo, ghost, danger) |
| CA3 | PASSOU | ConfirmDialog.test "R3" |
| CA4 | PASSOU | ConfirmDialog.test "R1: confirmDisabled" |
| CA5 | PASSOU | TeacherPanelPage.test (turmas, frase, canDeactivate, tentar de novo, erro do POST com janela aberta) |
| CA6 | PASSOU | testes de features/portal e students passam |
| CA7 | PASSOU | lint e typecheck ok; a11y.test, tokens.test, src/dev passam; playwright "360 px" 2 passam |
| CA8 | PASSOU | design-readme.test passa |
| CA9 | PASSOU | capturas em .capturas/451 conferidas visualmente; 8 PNG novos; casos.test passa. test:visual:docker e visual:canvas não reexecutados (resultado do construtor aceito, CI do PR comprova: AGENTS autonomia 2/3) |
| CA10 | PASSOU | git status: só arquivos previstos e os 8 PNG; test:cov/e2e completos não reexecutados (construtor: e2e 98 passam; CI comprova) |

Comandos: `npx vitest run src/components src/features/{teachers,portal,students,age-ranges,organization,account,texts} src/test/a11y.test.tsx src/dev visual/casos.test.ts --maxWorkers=2` → 92 arquivos, 912 testes passam; `npm run lint`, `npm run typecheck` ok; `npx playwright test -g "360 px" e2e/professores.spec.ts` → 2 passam.
Achados:
- sugestão, código, ConfirmDialog tone danger — o canvas de ProfessorInativar mostra vermelho cheio e o de PortalRevogarImagem contorno; D2 previa trocar para `dangerSolid` se o canvas mostrasse cheio. Ficou contorno nos dois e a divergência está registrada no limiteCanvas (#470).
- sugestão, processo — a #498 precisa ganhar a remoção do limiteCanvas de portal-revogar-imagem no "Pronto quando"; listar no PR.

## Entrega

**O que muda.** `ConfirmDialog` ganha `tone="danger"`, `size`, `subtitle`, `cancelLabel`, `confirmDisabled` e `children`, todos opcionais: as telas que já usam o componente seguem iguais. Inativar professor e Revogar uso de imagem passam a usar a janela de perigo: título em caixa alta, ação principal vermelha (contorno), "Cancelar" fantasma e rodapé fixo. Vitrine e `docs/design/README.md` acompanham. Casos visuais novos `professor-inativar` e `portal-revogar-imagem`, com 8 PNG de referência (1440 e 390 px, claro e escuro).

**Como foi verificado.** Rodada 1 da verificação, `OK` no estado `b618424`: vitest das pastas do item (912 testes passam), `lint`, `typecheck`, Playwright "360 px" (2 passam), `visual:canvas -- --exige` com 99 comparadas e 0 reprovadas. A regressão completa (`test:cov`, `e2e`) foi rodada na construção, com as instabilidades abaixo.

**Divergências com o canvas.**
- `professor-inativar`: o canvas usa vermelho cheio e traz escolha de novo titular, tabela de turmas e campo Motivo; o sistema usa contorno vermelho (D2) e lista simples. `limiteCanvas` 0,70, removido pela #470 (acrescentado ao "Pronto quando" dela neste PR).
- `portal-revogar-imagem`: a janela confere com o canvas; a página atrás é mais longa. `limiteCanvas` 0,85, removido pela #498 (acrescentado ao "Pronto quando" dela neste PR).
- 390 px: o canvas de celular dessas duas janelas não existe; só a captura do sistema está em `.capturas/451/`.

**Decisões.** Contorno vermelho (`danger`) no lugar de vermelho cheio, como previsto em D2: a variante já existe nos tokens e a comparação não pediu troca. Inativar professor sem "Motivo" nem escolha de titular (D3), que dependem de API e regra da #470.

**Regressão e instabilidades.** Na última rodada da construção, `test:cov` deu 2075 de 2076, com testes instáveis alheios ao item: `LoginPage` (trava com horário), `ChargePreviewPage` e `DailyReceiptsPage` (timeout; passou isolado, 5 de 5). `e2e`: 98 passam. Registrados aqui e no PR como instáveis (regra 5); nenhuma falha nova atribuída ao item.

**Limitações.** Nenhuma exceção nova além das duas acima. Os 8 PNG de referência são regerados só para as duas telas do item.
