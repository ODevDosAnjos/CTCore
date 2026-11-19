# 492 — Notificações no visual do canvas

Origem: issue #492 (Sprint 10.5, Fase 3, plano H4), `docs/auditoria/decisoes-canvas.md` (R1, decisões 9 e 12); evidência M28. Branch: `item/492-notificacoes-visual-canvas`. Dependências #450 e #463 fechadas (`Popover` em `frontend/src/components/ui/popover.tsx`, `ComingSoon`). Canvas: `Notificacoes.dc.html` (1440 px, popover de 440 px ancorado ao sino, tema claro) e `GMNotificacoes.dc.html` (celular, 360 px, tela cheia). Regras: RF-NOT-01, RN-NOT-01, RN-NOT-03, RN-NOT-05 (`docs/especificacao/13-comunicacao-e-notificacoes.md`).

## 1. Objetivo

Deixar o painel do sino igual ao canvas: cabeçalho "Notificações" com "Marcar todas como lidas" ao lado; abas em pílulas "Todas" e "Não lidas" com contagem; títulos de grupo "HOJE" e "ESTA SEMANA" em caixa alta pequena; cada notificação com ícone colorido por tipo, título em negrito, linha de detalhe, tempo e ponto vermelho de não lida, e a linha inteira clicável (sem botão de ação); rodapé "As notificações somem depois de 30 dias". No celular, o canvas mostra tela cheia com seta de voltar, título, abas e "Marcar lidas".

Fora do escopo: "Receber tudo" (já fora do painel, decisão 9, vive em Minha conta); retenção e limpeza de 30 dias no servidor (#447; o rodapé de texto já existe); tipos cujo fato ainda não existe (pagamento recusado, autocadastro, aluno que fez 18 anos já existe) além do que o catálogo atual traz; API, OpenAPI, MSW de contrato e back-end (não mudam).

## 2. Requisitos

- R1: o cabeçalho do popover traz o título "Notificações" e, na mesma linha, o botão "Marcar todas como lidas" (desabilitado sem não lidas); no celular o botão se chama "Marcar lidas" (D1).
- R2: as abas "Todas" e "Não lidas" são pílulas (`PillFilter`/padrão da #456, se aplicável ao caso) com a contagem de não lidas na aba "Não lidas" (selo), sem contagem na aba "Todas" (canvas).
- R3: os grupos aparecem como faixa em caixa alta pequena "HOJE" e "ESTA SEMANA", sem borda de cartão em volta de cada item; itens separados por linha fina.
- R4: cada item mostra ícone num quadrado de 32 px colorido por tipo (pagamento verde, comprovante azul, pedido e autocadastro amarelo, problema e recusa vermelho, demais neutro), título em negrito por tipo, linha de detalhe (o texto atual com os parâmetros), tempo relativo e, se não lida, ponto vermelho com texto acessível "Não lida"; a não lida tem fundo levemente destacado (D2).
- R5: o item inteiro é um link para a tela do objeto (`notificationTarget`) e fecha o popover ao navegar; o botão de ação por item sai (D3).
- R6: o rodapé "As notificações somem depois de 30 dias" fica no fim do popover, em cinza, sem chave "Receber tudo".
- R7: no celular (abaixo de 640 px) o painel abre em tela cheia com cabeçalho "Notificações" e seta "Voltar" que fecha; mesma lista.
- R8: os quatro estados seguem (carregando, vazio, erro com tentar de novo, sem permissão = sem sino), mais "Tudo lido" quando o filtro "Não lidas" fica vazio; funciona a 360 px, axe nos dois temas, Esc fecha e devolve o foco ao sino, textos só em `pt-BR.json`.
- R9: o caso visual `notificacoes` passa sem `limiteCanvas` (limite padrão de 30%) e há caso para o celular se o canvas `GMNotificacoes` existir como referência (`casos.ts` já lista `GMNotificacoes` na linha 274).

## 3. Critérios de aceite

- CA1 (R1): dado o painel com não lidas, então "Marcar todas como lidas" está ao lado do título e envia `POST read-all`; sem não lidas fica desabilitado; falha mostra a mensagem existente.
- CA2 (R2): dado 2 não lidas, então a aba "Não lidas" mostra o selo 2 e filtra só as não lidas; "Todas" mostra todas.
- CA3 (R3, R4): dado notificações de hoje e da semana, então aparecem "HOJE" e "ESTA SEMANA", cada item com título, detalhe, tempo e ícone; o item não lido tem o ponto e o nome acessível "Não lida"; o lido não.
- CA4 (R5): dado um item, quando clicado, então navega à rota de `notificationTarget(n)` e o popover fecha; não há botão "Ver cobranças" etc.
- CA5 (R6): o rodapé de retenção aparece no estado pronto e a chave "Receber tudo" não existe no painel.
- CA6 (R7): dado largura de 390 px, então o painel ocupa a tela, "Voltar" fecha e devolve o foco ao sino.
- CA7 (R8): carregando, vazio, erro com "Tentar de novo", 403 (sem sino) e "Tudo lido" aparecem; axe passa nos dois temas; sem rolagem lateral a 360 px (e2e existente de 360 px segue).
- CA8 (R9): `npm run test:visual:docker -- -g "notificacoes"` passa sem `--update-snapshots` e `npm run visual:canvas -- --exige` não reprova `notificacoes` com o limite padrão; capturas em `.capturas/492/` (`notificacoes-1440-{sistema,canvas}.png`, `notificacoes-390-{sistema,canvas}.png`, pt-BR).

## 4. Plano técnico

- Dados, API, Segurança: não mudam (visual; permissão segue no servidor; sem rota nova; `docs/openapi.yaml` intacto).
- Interface:
  - `frontend/src/features/notifications/NotificationPanel.tsx` (existe; `Row`, `NotificationPanel`): reescrever `Row` como `Link` inteiro com ícone, título, detalhe, tempo e ponto; cabeçalho com "Marcar todas"; abas em pílulas; faixa de grupo; rodapé.
  - `frontend/src/features/notifications/notificationActions.ts` (existe): acrescentar mapa tipo → ícone lucide e tom (tokens de `Badge`/`status`, sem cor solta).
  - `frontend/src/features/notifications/BellButton.tsx` e `frontend/src/components/ui/popover.tsx` (existem): no celular o `Popover` vira tela cheia (já usa `fixed inset-x-4 top-16`; passar a `fixed inset-0` abaixo de 640 px com `variant`/prop mínima só se necessário, sem alterar os demais usos).
  - `frontend/src/i18n/pt-BR.json` (grupo `notifications`, existe): `types.<TIPO>.title`; `markAllShort`; `back`; remover `unreadMark` do texto visível se virar rótulo do ponto; manter `retention`.
  - `frontend/visual/casos.ts` (linha 198): remover `limiteCanvas` de `notificacoes`; acrescentar `notificacoes-celular` com `canvas: "GMNotificacoes"` se o harness de celular do arquivo já tiver o padrão de casos de 390 px (conferir na construção).
  - `frontend/visual/referencias/`: regerar só `notificacoes*`.
  - Testes: `frontend/src/features/notifications/NotificationPanel.test.tsx` (existe) adaptado; `frontend/src/components/ui/popover.test.tsx` se o `Popover` mudar.
- Reuso: `Popover`, `PillFilter`/selos da #456 e #452, `ComingSoon` (nenhum item de sprint futura aparece no canvas deste painel), `EmptyState`/`ErrorState`/`LoadingState`/`ForbiddenState`, `formatDateTime`, `notificationTarget`, `relativeTime`.
- Riscos: (1) o canvas mostra tipos sem fato hoje (pagamento recusado, autocadastro); o catálogo atual tem outros tipos, então títulos e ícones saem do catálogo existente (D2), e a comparação só cobre a estrutura; (2) a massa MSW do caso `notificacoes` precisa trazer hoje e esta semana, lidas e não lidas, para a captura bater com o canvas (`frontend/src/mocks/handlers.ts`, perto da linha 1937); (3) mudar o `Popover` afeta outros usos, conferir `AppLayout.test.tsx` e `popover.test.tsx`; (4) o canvas é 1440 só em tema claro, e o limite padrão pode reprovar por conteúdo de mock diferente: ajustar o MSW antes de qualquer `limiteCanvas`.

## 5. Tarefas

- [x] T1: textos `pt-BR`, mapa tipo → ícone e tom em `notificationActions.ts` — não cobre critério: preparação de R3 e R4 — prova: `cd frontend && npx vitest run src/features/notifications && npm run lint`
- [x] T2: reescrever `NotificationPanel` (cabeçalho, pílulas, grupos, item clicável, rodapé) e testes — cobre CA1 a CA5, CA7 — prova: `cd frontend && npx vitest run src/features/notifications src/test/a11y.test.tsx`
- [x] T3: tela cheia no celular (`Popover`/`BellButton`) com "Voltar" — cobre CA6 — prova: `cd frontend && npx vitest run src/components/ui/popover.test.tsx src/features/notifications src/components/layout/AppLayout.test.tsx` e `npx playwright test e2e/barra-360px.spec.ts`
- [x] T4: massa MSW do caso, remover `limiteCanvas`, caso do celular, referências regeradas no container e capturas em `.capturas/492/` — cobre CA8 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots -g "notificacoes"`, depois sem `--update-snapshots`, e `npm run visual:canvas -- --exige`
- [x] T5: regressão do front — não cobre critério: exigência do AGENTS.md — prova: `cd frontend && npm run lint && npm run typecheck && npm run build && npm run test:cov && npm run e2e`

## 6. Decisões

- D1: no celular o botão é "Marcar lidas" e no desktop "Marcar todas como lidas", como nos dois canvas (R1 do `decisoes-canvas.md`); dois textos no `pt-BR.json`, escolhidos por largura. Alternativa: um texto só (reprova no canvas do celular).
- D2: títulos e ícones por tipo vêm do catálogo existente (ex.: `PAYMENT_RECEIVED` "Pagamento recebido", `PAYMENT_PROOF` "Comprovante para conferir", `PORTAL_REQUEST` "Pedido do portal", `EMAIL_PROBLEM` "E-mail com problema", `STUDENT_MAJORITY` "Aluno fez 18 anos"); tipos que o canvas mostra sem fato no sistema (recusado, autocadastro) não ganham tipo novo aqui, são das issues que criam o fato. O detalhe usa o texto atual com os parâmetros.
- D3 (muda o comportamento): o botão de ação por item sai e a linha inteira vira o link, como no canvas (R1: canvas vence em botões). A rota de destino não muda.
- Suposição: o canvas `Notificacoes` só existe no tema claro e o `GMNotificacoes` a 360 px; se o harness exigir 390 px, a captura de celular usa 390 px e a diferença de 30 px entra na comparação manual. Se `GMNotificacoes` não tiver caso no harness, T4 cria o caso.

## Construção

- T1 — arquivos: `frontend/src/i18n/pt-BR.json` (título por tipo no lugar da ação; `unreadDot`, `back`, `markAllShort`; filtros sem contagem no texto), `frontend/src/features/notifications/notificationActions.ts` (`NOTIFICATION_LOOK`: ícone e tom por tipo, tons de `status-tone`) — prova: `npx vitest run src/features/notifications && npm run lint` → passou
- T2 — arquivos: `NotificationPanel.tsx` (cabeçalho com "Marcar todas como lidas", pílulas com selo, faixas HOJE/ESTA SEMANA, linha inteira como `Link`, ponto com texto "Não lida", rodapé), `NotificationPanel.test.tsx` — prova: `npx vitest run src/features/notifications src/test/a11y.test.tsx` → passou (11 testes do painel, axe nos dois temas)
- T3 — arquivos: `popover.tsx` (prop `sheet`: sem padding e tela cheia abaixo de 640 px; `children(close, dismiss)`, `dismiss` devolve o foco ao sino), `BellButton.tsx`, teste CA6 em `NotificationPanel.test.tsx` — prova: `npx vitest run src/components/ui/popover.test.tsx src/features/notifications src/components/layout/AppLayout.test.tsx` → passou; `npx playwright test e2e/barra-360px.spec.ts` → 6 passaram
- T4 — arquivos: `frontend/visual/casos.ts` (sem `limiteCanvas` em `notificacoes`), referências `notificacoes-{1440,390}-{claro,escuro}.png`, capturas em `.capturas/492/` — prova: `npm run test:visual:docker -- --update-snapshots -g "notificacoes"`, depois sem `--update-snapshots` → 8 passaram; `npm run visual:canvas -- --exige` → 151 comparadas, 0 reprovadas (limite padrão)
- T5 — ver Regressão.

Visual do CI: notificacoes 1440 claro/escuro e 390 claro/escuro → passou (uma rodada falhou por carga da máquina e passou na repetição).
Referências visuais: `frontend/visual/referencias/notificacoes-1440-claro.png`, `notificacoes-1440-escuro.png`, `notificacoes-390-claro.png`, `notificacoes-390-escuro.png`.
Regressão: `npm run lint && npm run typecheck && npm run build` → passou; `npm run test:cov` → 2615 de 2619; as 4 falhas (LoginPage trava, RecordEnrollment CA7, UnitSettingsPage axe 360 px, casos.test canvasCelular) — 3 eram de tempo esgotado sob carga e passaram na repetição; a 4ª era erro meu (`canvasCelular: "GMNotificacoes"`, canvas de 360 px) e foi desfeito; repetidas as quatro suítes → 218 passaram; `npm run e2e` → 92 passaram e 6 falharam (configuracao-unidade, portal-minhas-informacoes, portal-pedidos, professores, recuperar-senha, sair-da-conta), nenhuma toca o sino; repetidas, 3 falharam e na terceira repetição os 3 passaram (20 de 20): instáveis por carga, sem relação com o item. A cobertura final do `test:cov` não foi conferida: a primeira rodada terminou com as 4 falhas e não foi repetida inteira.
Desvios: (1) não foi criado caso de celular com `canvasCelular`: o `GMNotificacoes` é de 360 px e o `casos.test.ts` exige 390 px; ele continua na lista de exceções "celular a 360 px", e o 390 foi conferido pelas capturas `.capturas/492/notificacoes-390-{sistema,canvas}.png` (D5 da #435). (2) A massa MSW não foi alterada: a captura já traz hoje e esta semana, lidas e não lidas, e passa no limite padrão. (3) Divergências restantes na comparação: textos e tipos do canvas sem fato no sistema (pagamento recusado, autocadastro), cabeçalho do celular sem a unidade, cartão em volta da lista no celular e títulos lidos em peso normal só no canvas do celular; o painel do sistema mostra título em negrito só nas não lidas, como o canvas.
Não é do item: nenhuma.

## Verificação

### Rodada 1 — OK — 2026-11-18, estado 3c6d038d41244691bbc5b38f3f7091d2bca29168

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `NotificationPanel.test.tsx` (suíte de 185 testes passou); botão ao lado do título, desabilitado sem não lidas |
| CA2 | PASSOU | teste: selo "2" na aba "Não lidas", filtra 2 itens |
| CA3 | PASSOU | teste: link com "Pagamento recebido ... Não lida"; o lido não traz "Não lida"; capturas mostram HOJE/ESTA SEMANA, ícones e tempo |
| CA4 | PASSOU | teste: link para `/cobrancas`, clique fecha o painel; sem "Ver cobranças" |
| CA5 | PASSOU | teste: rodapé presente, sem `switch` |
| CA6 | PASSOU | teste a 390 px: `fixed inset-0`, "Marcar lidas", "Voltar" fecha e foco volta ao sino |
| CA7 | PASSOU | estados e axe nos dois temas nos testes existentes (`a11y.test.tsx`, painel); e2e 360 px não rerodado por mim (relatado 6 passaram na construção) |
| CA8 | PASSOU | `npm run test:visual:docker -- -g "notificacoes"` → 8 passaram sem `--update-snapshots` (notificacoes 1440/390 claro/escuro + conta-notificacoes); capturas em `.capturas/492/` abertas e comparadas com o canvas: estrutura confere (cabeçalho, pílulas com selo, faixas, ícones por tipo, ponto vermelho, rodapé; celular com Voltar, Marcar lidas); sem `limiteCanvas` |

Comandos: `npx vitest run` (notifications, popover, AppLayout, a11y, casos.test) → 185 passaram; `npm run lint` e `npm run typecheck` → limpos; `npm run test:cov` → 2616 de 2619, 3 falhas (LoginPage trava, UnitSettingsPage axe 360 px claro/escuro), cada arquivo rodado 2 vezes com `--maxWorkers=2` → 20/20 e 28/28 passaram.
Instáveis: LoginPage "trava com horário" e UnitSettingsPage "CA18 axe 360 px" — falharam na suíte inteira por carga, passaram em todas as repetições isoladas; sem relação com o item.
Achados:
- sugestão, código, `frontend/src/i18n/pt-BR.json` linhas 3842-3843 — chave `markAllShort` duplicada (mesmo valor); remover uma.
- sugestão, código, `NotificationPanel.tsx` — título "Notificações" com `sm:uppercase` só no desktop; coincide com o canvas, só registrar.
- sugestão, processo — `npm run build`, e2e e `visual:canvas --exige` não rerodados nesta rodada; valem os registros da construção e o CI.

## Entrega

- O que muda: painel de notificações e sino no visual dos canvas `Notificacoes` (1440) e `GMNotificacoes` (360 px). Cabeçalho com "Marcar todas como lidas" (celular: "Marcar lidas", D1); pílulas Todas e Não lidas com selo; faixas HOJE e ESTA SEMANA; linha inteira é o link para o destino, com ícone e tom por tipo, título, detalhe, tempo e ponto de não lida; rodapé. No celular o painel é tela cheia com "Voltar", que devolve o foco ao sino. O botão de ação por item saiu (D3); a rota de destino não mudou.
- Como foi verificado: testes do painel, popover e AppLayout, com axe nos dois temas; `npm run test:visual:docker -- -g "notificacoes"` → 8 passaram sem `--update-snapshots` (notificacoes 1440 e 390 nos temas claro e escuro, e conta-notificacoes); `npm run visual:canvas -- --exige` → 151 comparadas, 0 reprovadas, sem `limiteCanvas`.
- Decisões: D1 (dois textos de "marcar lidas", escolhidos por largura), D2 (títulos e ícones do catálogo existente; tipos que o canvas mostra sem fato no sistema não ganham tipo novo), D3 (linha inteira vira o link). Caso de celular: o `GMNotificacoes` é de 360 px e `casos.test.ts` exige 390 px, então o caso não ganhou `canvasCelular`; o 390 foi conferido pelas capturas em `.capturas/492/`.
- Divergências restantes (comparação com o canvas): tipos do canvas sem fato no sistema (pagamento recusado, autocadastro), cabeçalho do celular sem a unidade, cartão em volta da lista no celular, títulos lidos em peso normal só no canvas do celular.
- Regressão: não rerodada nesta entrega, porque a base (`dev`) não avançou; vale a da verificação. Instáveis registrados na verificação, que passaram na repetição e não têm relação com o item: LoginPage "trava com horário", UnitSettingsPage "CA18 axe 360 px", e2e de configuração-unidade, portal-minhas-informacoes, portal-pedidos, professores, recuperar-senha e sair-da-conta (3 falharam na primeira rodada e passaram na terceira, 20 de 20).
- Limitação: a cobertura final do `test:cov` não foi conferida em rodada inteira; as suítes das falhas foram repetidas e passaram.
