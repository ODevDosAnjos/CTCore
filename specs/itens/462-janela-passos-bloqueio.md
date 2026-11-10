# 462 — Componente base: Janela: passos e bloqueio com checklist

Origem: issue #462 (Sprint 10.5, Fase 2, plano C6c), `docs/auditoria/plano-de-issues.md` (C6c), `docs/auditoria/decisoes-canvas.md`. Branch: `item/462-janela-passos-bloqueio`. Canvas das telas-piloto: `TurmaDesativar.dc.html` (O4) e `UnidadeDesativar.dc.html` (G3). Dependências #448 e #460 (e #461, #451) já estão em `dev`.

## 1. Objetivo

Dar às janelas dois blocos que o canvas repete: o indicador de **passos** das janelas em assistente (DuasEtapas, CodigosReserva, matrícula) e o **bloqueio com checklist** ("O que impede agora": cada impedimento com marca vermelha ou verde e, se houver, link para resolver). Aplicar o bloqueio em Desativar turma e Desativar unidade. As demais janelas (M37, M44, M45, M64, M66, M114) trocam nas próprias issues (#465 a #500), usando estes blocos.

Fora do escopo: migrar outras janelas; mudar API, OpenAPI, MSW (contrato), backend ou regra; trocar a confirmação por nome da unidade pela de "DESATIVAR" (regra, #484); janela "Unidade única" (M64, #484); janela de Modalidade (M66, #485); lista de nomes de alunos na recusa da turma e item "cobrança em conferência" da unidade (o contrato só traz contagens; D3).

## 2. Requisitos

- R1: novo `WindowSteps` (`components/ui/window-steps.tsx`): lista ordenada de passos numerados em círculo (marca nos concluídos, destaque no atual, rótulo ao lado), com `aria-current="step"` no atual e texto "Passo N de M" para leitor de tela; só tokens (D1).
- R2: novo `BlockerChecklist` (`components/ui/blocker-checklist.tsx`): bloco com rótulo ("O que impede agora") e uma linha por item, `ok` (✓ verde) ou impedimento (✗ vermelho), com texto e link opcional. O estado não depende só da cor: ícone e texto para leitor de tela ("Impede"/"Livre") (D2).
- R3: Desativar turma usa `Modal size="sm"` com título em caixa alta "Desativar <turma>", texto de orientação do canvas e, havendo alunos com a turma como principal, `BlockerChecklist` com a linha "N aluno(s) com esta turma como principal" e link "Ver alunos" (lista de alunos filtrada pela turma); rodapé "Fechar" quando há bloqueio, ou "Cancelar" + "Desativar turma" quando não há. Regra RN-TUR-03 mantida: com bloqueio não oferece confirmar; o servidor reconfere (`HAS_PRIMARY_STUDENTS` volta ao bloqueio com a contagem).
- R4: Desativar unidade usa `Modal size="sm"` com título em caixa alta "Desativar <unidade>", texto de orientação e `BlockerChecklist` "O que impede agora" com as linhas alunos com modalidade ativa (link "Ver alunos"), turmas ativas (link "Ver turmas") e única unidade ativa, cada uma ✓ quando livre; campo de confirmação pelo nome da unidade e senha mantidos (RNF-26); rodapé "Fechar" + "Desativar unidade" (desabilitado até poder e o nome conferir), no lugar de Cancelar/Continuar (D4).
- R5: regras e fluxo mantidos nas duas janelas: 403 e erro de carga com os estados padrão, 409 recarrega o que impede, nome inválido (400) no campo, reautenticação antes da chamada, sem permissão não confirma.
- R6: textos só em `pt-BR.json` (plural correto, sem "(s)"); cores, fontes e tamanhos só por tokens; axe passa nos dois temas; sem rolagem lateral a 360 px.
- R7: os blocos e o seu uso constam em `docs/design/README.md` (tabela Componentes) e na Vitrine.
- R8: casos visuais `turma-desativar` (novo) e `configuracoes-unidade-desativar` (regerado), comparados com o canvas (1440 e 390, pt-BR; celular só onde o canvas existe, nenhum para estas duas); divergência restante entra como `limiteCanvas` com motivo e a issue que a remove (#475 turma, #484 unidade).
- R9: nenhuma outra tela muda de aparência (nenhuma outra referência visual muda, salvo a Vitrine).

## 3. Critérios de aceite

- CA1 (R1): dado `WindowSteps` com 3 passos e o 2º atual, então o 1º mostra marca, o 2º tem `aria-current="step"`, o 3º mostra o número 3 e o texto "Passo 2 de 3" está disponível ao leitor de tela.
- CA2 (R2): dado `BlockerChecklist` com um impedimento com link e um item livre, então o link tem o `href` e o rótulo, o impedimento é anunciado como "Impede" e o livre como "Livre"; sem itens, não renderiza.
- CA3 (R3): dada turma com 2 alunos principais (MSW), quando se abre "Desativar", então vê o título em caixa alta, a linha "2 alunos com esta turma como principal", o link "Ver alunos" para `/alunos?classId=<id>`, só o botão "Fechar" e nenhum "Desativar turma". Dada turma sem bloqueio, vê "Cancelar" e "Desativar turma"; confirmar desativa, fecha e avisa. Resposta `HAS_PRIMARY_STUDENTS` troca para o bloqueio com a contagem; `FORBIDDEN` e `CONFLICT` aparecem na janela aberta.
- CA4 (R4): dada unidade com alunos e turmas ativas, quando se abre "Desativar", então a lista mostra as linhas com "Ver alunos" (`/alunos?unitId=<id>&status=ACTIVE`) e "Ver turmas" (`/turmas?unitId=<id>&status=ACTIVE`), "Desativar unidade" e o campo do nome ficam desabilitados. Dada unidade sem impedimento, as linhas aparecem ✓; com o nome certo, "Desativar unidade" habilita e leva à reautenticação; nome errado no servidor (400) mostra o erro no campo.
- CA5 (R5): dado 403 em `deactivation-check` ou no POST, então aparece o estado sem permissão; dado erro de carga, o estado de erro com "Tentar de novo"; dado 409, a janela recarrega e mostra o que impede agora. Os testes atuais de `DeactivateUnitDialog.test.tsx` seguem passando, só com os rótulos novos.
- CA6 (R6): `npm run lint` sem texto literal; `tokens.test.ts` passa; axe sem violação nos dois temas (Vitrine e as duas janelas); a 360 px (Playwright) sem rolagem lateral nas duas janelas.
- CA7 (R7): `design-readme.test.ts` passa com os blocos descritos.
- CA8 (R8): `npm run test:visual:docker` passa com referências novas de `turma-desativar` e regeradas de `configuracoes-unidade-desativar` e `vitrine`; `npm run visual:canvas -- --exige` não reprova; capturas em `.capturas/462/` (`<tela>-<largura>-{sistema,canvas}.png`); `visual/casos.test.ts` passa (`TurmaDesativar` sai da lista "sem caso"); o `limiteCanvas` de `configuracoes-unidade-desativar` é reduzido se a medida permitir.
- CA9 (R9): `npm run test:cov` e o e2e passam; nenhuma outra referência visual mudou.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (visual; permissão, reconferência e reautenticação seguem no servidor; sem dado novo, sem rota nova, sem mudança em `docs/openapi.yaml`).
- Interface:
  - `frontend/src/components/ui/window-steps.tsx` (a criar) e `window-steps.test.tsx`: lista `ol` com o círculo do `Stepper` (`frontend/src/components/Stepper.tsx`, existe; mesmos tokens `bg-primary`, `bg-ok`), sem lógica de avanço (quem usa controla o passo atual).
  - `frontend/src/components/ui/blocker-checklist.tsx` (a criar) e teste: ícones `X`/`Check` do lucide, tokens de perigo e ok, link por `Link` do react-router com `to`.
  - `frontend/src/features/classes/DeactivateClassDialog.tsx` (existe): `Modal size="sm"` com `footer`; o corpo usa `BlockerChecklist`; mantém `blocked`, `error`, `confirm()` e `HAS_PRIMARY_STUDENTS`; usa `klass.id` para o link.
  - `frontend/src/features/units/DeactivateUnitDialog.tsx` (existe): `Modal size="sm"` com `footer` ("Fechar" e "Desativar unidade", o submit liga ao formulário por `form`); troca o `Banner` por `BlockerChecklist` sempre visível com as três linhas; `phase`, `send` e `ReauthDialog` intactos.
  - `frontend/src/i18n/pt-BR.json` (existe): `classes.panel.deactivateDialog.*` (título, orientação, `blockedRow_one/other`, `seeStudents`, `confirm`) e `units.deactivate.*` (`blockedHead`, linhas com plural, `seeStudents`, `seeClasses`, `confirm`); chaves de passos em `ui.*`.
  - `frontend/src/dev/Vitrine.tsx` e `docs/design/README.md` (existem): exemplo dos dois blocos e linha na tabela Componentes.
  - `frontend/visual/casos.ts` (existe): caso `turma-desativar` (turma do MSW com aluno principal, ver `blocking` em `frontend/src/mocks/handlers.ts:595`; passo "Desativar"); ajusta `limiteCanvas` de `configuracoes-unidade-desativar`; tira `TurmaDesativar` da lista "sem caso". Se faltar dado no MSW, só acrescentar, sem mudar o contrato.
  - `frontend/visual/referencias/`: PNG novos e regerados.
  - Testes: `DeactivateUnitDialog.test.tsx` (existe), teste de `DeactivateClassDialog` (hoje coberto por `ClassPanelPage.test.tsx`), `src/test/a11y.test.tsx`, e2e de 360 px em `frontend/e2e/`.
- Reuso: `Modal size` (#460), `Button`, `Field`/`Input`, `ReauthDialog`, estados padrão, tokens do `Stepper`.
- Riscos: o link "Ver alunos" navega com a janela aberta (fechar ao navegar e conferir o foco); sem `limiteCanvas` ajustado o `visual:canvas --exige` reprova; testes que procuram "Continuar"/"Cancelar" na unidade mudam de rótulo; o MSW precisa de turma com aluno principal para o caso visual.

## 5. Tarefas

- [x] T1: `WindowSteps` e `BlockerChecklist` com testes — cobre CA1, CA2 — prova: `cd frontend && npx vitest run src/components/ui/window-steps.test.tsx src/components/ui/blocker-checklist.test.tsx`
- [x] T2: Desativar turma sobre o bloqueio, textos pt-BR e testes — cobre CA3, CA5 — prova: `cd frontend && npx vitest run src/features/classes`
- [x] T3: Desativar unidade sobre o bloqueio, textos pt-BR e testes — cobre CA4, CA5 — prova: `cd frontend && npx vitest run src/features/units`
- [x] T4: Vitrine, `docs/design/README.md` e axe nos dois temas — cobre CA6, CA7 — prova: `cd frontend && npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev`
- [x] T5: e2e de 360 px sem rolagem lateral nas duas janelas — cobre CA6 — prova: `cd frontend && npx playwright test -g "360 px"` nos specs tocados
- [x] T6: casos visuais, referências no container, comparação com o canvas (1440 e 390, pt-BR, `.capturas/462/`) e lista de divergências para o PR — cobre CA8 — prova: `cd frontend && npx vitest run visual/casos.test.ts && npm run test:visual:docker -- --update-snapshots=all -g "turma-desativar|configuracoes-unidade-desativar|vitrine"` e `npm run visual:canvas -- --exige`
- [x] T7: regressão do front — cobre CA9 — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov && npm run e2e`, e conferir no `git status` que só mudaram os PNG previstos

## 6. Decisões

- D1: `WindowSteps` só mostra o indicador (o passo atual vem de fora); não é um assistente com botões. Motivo: o `Stepper` da página já cobre o fluxo; as janelas DuasEtapas e CodigosReserva controlam o próprio avanço. Nenhum piloto usa passos; o componente nasce testado, documentado e na Vitrine para as issues de tela. Alternativa: estender o `Stepper`, descartada (o da janela leva rótulo ao lado e não tem botões).
- D2: `BlockerChecklist` recebe os itens prontos (`{ text, ok, link?: { to, label } }`) e não calcula nada. Motivo: cada tela sabe o seu impedimento; a regra fica no servidor.
- D3 (muda o comportamento): o canvas mostra nomes de alunos na recusa da turma ("e mais 20 alunos") e a linha "cobrança em conferência" na unidade, mas o contrato só traz contagens (`blockingStudents`, `UnitDeactivationCheck`). Fica a linha com a contagem e o link "Ver alunos"; nomes e a linha de conferência entram como `limiteCanvas` com motivo, ligados à #475 e à #484, que ganham a remoção no "Pronto quando" (AGENTS.md, Autonomia 4). Alternativa: mudar a API agora, descartada por ser mais que um componente base e tocar regra de desativação.
- D4 (muda o comportamento): a confirmação da unidade continua pelo nome digitado e a senha (RNF-26 e comportamento atual); o canvas diz "DESATIVAR e sua senha", e trocar a palavra é regra de confirmação, fica para a #484. Os botões passam a "Fechar" e "Desativar unidade" como no canvas, e "Desativar unidade" abre a reautenticação, como "Continuar" fazia. Alternativa: manter "Continuar", descartada porque o canvas vence em rótulos.
- D5: o texto de orientação da turma ("Desativar tira a turma das escolhas de matrícula e da agenda. Ela continua na lista, com o histórico, e não pode ser reativada nem editada.") vem do canvas; se divergir da especificação (RN-TUR-03), a especificação vence na regra e a construção registra o texto usado.
- Suposição: não há canvas de celular de Desativar turma nem de Desativar unidade; a comparação a 390 px só registra a captura do sistema, como na #460 e na #461. Se o `limiteCanvas` de `configuracoes-unidade-desativar` não puder baixar, fica como está com o motivo atualizado.

## Construção

- T1 — arquivos: `frontend/src/components/ui/{window-steps,blocker-checklist}.tsx` e testes; `ui.stepOf/blockerFree/blockerBlocks` em `pt-BR.json` — prova: `npx vitest run src/components/ui/window-steps.test.tsx src/components/ui/blocker-checklist.test.tsx` → 3 passaram
- T2 — arquivos: `features/classes/DeactivateClassDialog.tsx`, `ClassPanelPage.test.tsx`, `pt-BR.json` (`classes.panel.deactivateDialog.*`) — prova: `npx vitest run src/features/classes` → 45 passaram
- T3 — arquivos: `features/units/DeactivateUnitDialog.tsx`, `DeactivateUnitDialog.test.tsx`, `pt-BR.json` (`units.deactivate.*`) — prova: `npx vitest run src/features/units` → 69 passaram
- T4 — arquivos: `dev/Vitrine.tsx`, `docs/design/README.md` — prova: `npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev` → passaram
- T5 — arquivos: `e2e/turmas.spec.ts`, `e2e/unidades.spec.ts` — prova: `npx playwright test e2e/turmas.spec.ts e2e/unidades.spec.ts -g "360 px"` → 3 passaram
- T6 — arquivos: `visual/casos.ts` (caso `turma-desativar`, `limiteCanvas` da unidade de 0,75 para 0,70, `TurmaDesativar` fora de "sem caso"), referências PNG — prova: `vitest run visual/casos.test.ts` → 101 passaram; `test:visual:docker -- --update-snapshots=all -g ...` → passou; `visual:canvas -- --exige` → 102 comparadas, 0 reprovadas (turma 64,9% com limite 70%; unidade 62,2% com limite 70%). Capturas em `.capturas/462/` (1440 sistema e canvas; 390 só sistema, sem canvas de celular).
- T7 — prova: `npm run lint && npm run typecheck` → ok; `npm run test:cov` → 2095 passaram; `npm run e2e` → 97 passaram, 1 falhou (`portal-pedidos.spec.ts` @critical, 360 px) e passou ao rodar de novo sozinho (instável, anotar no PR)
Regressão: `ChargePreviewPage.test.tsx` falhou uma vez no `test:cov` e passou na repetição (instável, não é do item).
Desvios: (1) a Vitrine usa `MaybeRouter` (só cria `MemoryRouter` se não houver roteador) porque `BlockerChecklist` usa `Link`. (2) Na unidade, o campo de confirmação segue pelo nome (D4); "Fechar" e "Desativar unidade" ficam no rodapé e o submit liga ao formulário por `form`. (3) A linha "única unidade ativa" livre usa o texto "Há outra unidade ativa na organização". (4) Texto da turma segue D5 (canvas), sem conflito com RN-TUR-03.
Referências visuais: `configuracoes-unidade-desativar-{1440,390}-{claro,escuro}.png` (regeradas), `turma-desativar-{1440,390}-{claro,escuro}.png` (novas), `vitrine-{1440,390}-{claro,escuro}.png` (regeradas).
Pendência para a entrega: acrescentar no "Pronto quando" das issues #475 (remover `limiteCanvas` de `turma-desativar`, nomes de alunos) e #484 (idem para `configuracoes-unidade-desativar`, linha "cobrança em conferência" e confirmação por DESATIVAR) — Autonomia 4. Não feito aqui.

## Verificação

### Rodada 1 — OK — 2026-11-09, estado aafd6267f75a8854abde816dc79f6b4b37151cf9

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `window-steps.test.tsx` passa (marca, `aria-current`, número 3, "Passo 2 de 3" sr-only) |
| CA2 | PASSOU | `blocker-checklist.test.tsx` passa (href, "Impede"/"Livre", vazio não renderiza) |
| CA3 | PASSOU | `ClassPanelPage.test.tsx` passa: título em caixa alta, linha "3 alunos...", link `/alunos?classId=c1`, sem "Desativar turma"/"Cancelar"; HAS_PRIMARY_STUDENTS; erro na janela; captura mostra o bloqueio |
| CA4 | PASSOU | `DeactivateUnitDialog.test.tsx` passa (links, botão e campo desabilitados, nome, reautenticação, 400); e2e unidades 360 px passa |
| CA5 | PASSOU | testes 403, erro de carga, 409 em `DeactivateUnitDialog.test.tsx` e `ClassPanelPage.test.tsx` passam |
| CA6 | PASSOU | lint ok, typecheck ok, `tokens.test.ts`, `a11y.test.tsx` passam; e2e "360 px" das duas janelas passam |
| CA7 | PASSOU | `design-readme.test.ts` passa |
| CA8 | PASSOU | `test:visual:docker` 389 passaram; `visual:canvas -- --exige` 102 comparadas, 0 reprovadas; capturas em `.capturas/462/` abertas e comparadas; `casos.test.ts` passa |
| CA9 | PASSOU | só os PNG previstos mudaram; visual completo passa; e2e: ver Instáveis |

Comandos: `vitest run` (components/ui, features/classes, features/units, a11y, design-readme, tokens, dev, visual/casos) → 40 arquivos, 377 passaram; `npm run lint`, `npm run typecheck` → ok; `npm run visual:canvas -- --exige` → 0 reprovadas; `npm run test:visual:docker` → 389 passaram; `playwright test e2e/turmas.spec.ts e2e/unidades.spec.ts` → 6 passaram, 1 falhou (@critical unidades), passou ao rodar o arquivo sozinho (2 passaram).
Instáveis: `unidades.spec.ts` "@critical configurações das unidades: Coordenador lista e ajusta, Administrador sem acesso" — 1 falha em 2 execuções, a falha ocorreu com o teste visual docker rodando em paralelo (carga); passou isolado. Não é do item.
Achados:
- sugestão, código, `frontend/visual/casos.ts` (motivos de `limiteCanvas` de `turma-desativar` e `configuracoes-unidade-desativar`) — o motivo cita só nomes de alunos e "cobrança em conferência"/DESATIVAR; as capturas mostram também divergências não registradas: título vermelho (unidade), subtítulo "Jiu-Jitsu Kids · Tijuca" e caixa de recusa em tom de perigo, frase "Troque a turma principal desses alunos e tente de novo.", botão "Fechar" em destaque (turma) e checklist em cartão com borda e negrito na contagem. A descrição do PR deve listar essas divergências e como foram tratadas (AGENTS.md).
- sugestão, especificação — o "Construção" não traz a lista de divergências com o canvas pedida para o PR (T6); registrar na entrega.

## Entrega

Componentes base `Janela: passos` (`components/ui/window-steps.tsx`) e `Janela: bloqueio com checklist` (`components/ui/blocker-checklist.tsx`), com testes. Ligados às janelas Desativar turma (painel da turma) e Desativar unidade (configurações de unidades), que passam a mostrar o bloqueio como checklist com links e os rótulos do canvas. Textos em `pt-BR.json`; Vitrine e `docs/design/README.md` atualizados; caso visual `turma-desativar` novo e referências regeradas.

Verificação: rodada 1, OK, no estado `aafd6267f75a8854abde816dc79f6b4b37151cf9`. CA1 a CA9 passaram. `lint`, `typecheck`, `test:cov` (2095 testes), `test:visual:docker` (389) e `visual:canvas -- --exige` (102 comparadas, 0 reprovadas; turma 64,9% e unidade 62,2%, contra limite de 70%).

Decisões (seção Decisões): D3, nomes de alunos na recusa e a linha "cobrança em conferência" ficam como `limiteCanvas`, ligados à #475 e à #484. D4, a confirmação da unidade segue pelo nome e pela senha; os botões são "Fechar" e "Desativar unidade". D5, o texto de orientação da turma vem do canvas. A #475 ganhou o caso `turma-desativar` no "Pronto quando" nesta entrega. A #484 já listava `configuracoes-unidade-desativar`.

Divergências com o canvas, para a descrição do PR (achadas na comparação da verificação):
- Turma: caixa de recusa em tom de perigo; subtítulo "Jiu-Jitsu Kids · Tijuca" diferente; frase "Troque a turma principal desses alunos e tente de novo."; "Fechar" sem o destaque do canvas; checklist em cartão com borda e contagem em negrito.
- Unidade: título em vermelho; caixa de recusa em tom de perigo.
- Status: não resolvidas nesta entrega. Os motivos de `limiteCanvas` em `frontend/visual/casos.ts` citam só nomes de alunos (turma) e cobrança e DESATIVAR (unidade), não essas diferenças. Ficam para a #475 e a #484 ao remover a exceção.

Instáveis (Autonomia 5, anotados no PR; passaram na repetição, sem issue): `e2e` `portal-pedidos.spec.ts` @critical 360 px falhou uma vez e passou isolado; `unidades.spec.ts` "@critical configurações das unidades: Coordenador lista e ajusta, Administrador sem acesso" falhou 1 de 2 com o teste visual em paralelo e passou isolado; `ChargePreviewPage.test.tsx` falhou uma vez no `test:cov` e passou na repetição. Nenhum é do item.

Limitações: não há canvas de celular das duas janelas; a 390 px só há captura do sistema. A Vitrine usa `MaybeRouter`, porque `BlockerChecklist` usa `Link`.

Regressão: a da verificação. A base `dev` (107cbb2) não avançou desde a branch, então não foi rodada de novo.
