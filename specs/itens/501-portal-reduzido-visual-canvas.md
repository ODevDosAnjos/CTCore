# 501 — Portal reduzido (aluno sem modalidade ativa) no visual do canvas

Origem: issue #501 (Sprint 10.5, Fase 3, R9), `docs/auditoria/decisoes-canvas.md` (R1, R2, decisão 2); evidência M143. Branch: `item/501-portal-reduzido-visual-canvas`. Dependências #455, #497, #498, #499 (feitas). Canvas: `PortalReduzido` (1440), `PortalMReduzido` (390); `PortalReduzidoInfo` já é da #498. Regras: RN-INA-08, RN-POR-08, RF-POR-01, RF-POR-05, RNF-22.

## 1. Objetivo

Deixar o portal reduzido (Aluno ou Responsável sem nenhuma modalidade ativa) igual ao canvas: duas áreas, Financeiro e Minhas informações, nos dois tamanhos; o Financeiro reduzido abre com "Olá, {nome}", a cobrança em aberto com "Pagar", o cartão "Fale com a academia" (botão verde "WhatsApp da unidade", telefone e e-mail), "Histórico e recibos" em tabela (Referência, Pago em, Valor, Recibo; no celular, "Recibos") e a nota de que Agenda, avisos e graduação ficam ocultos. O contato da unidade passa a existir também no rodapé do reduzido.

Fora do item: o motivo "porque o Muay Thai está bloqueado por atraso" na faixa (o bloqueio por atraso e sua data são da Sprint 12, #109 e #111; hoje a modalidade só é Ativa ou Encerrada); reativação e fim do acesso do ex-aluno (Sprint 12); Minhas informações reduzido e carteirinha (#498 e #499); mudar quem é reduzido (RN-POR-08).

## 2. Requisitos

- R1: no portal reduzido as abas são só Financeiro e Minhas informações, em cima (1440) e embaixo (390); o logo da barra e o endereço `/` levam ao Financeiro; `/portal/agenda` e `/portal/avisos` continuam levando para fora delas, agora ao Financeiro (D1, decisão 2 do canvas).
- R2: faixa de aviso do reduzido no topo, em todas as telas, com o texto genérico atual ("Seu acesso está reduzido: nenhuma modalidade está ativa no momento."); sem sino (avisos ficam ocultos, RN-INA-08); nome e papel "Aluno · Inativo" na barra (D2, D6).
- R3: o Financeiro reduzido tem rótulo com o nome da unidade, título "Olá, {primeiro nome}" e, nesta ordem, a cobrança em aberto (`PortalOpenCharges`, "Pagar"), o cartão "Fale com a academia", o histórico e a nota "Agenda, avisos e graduação ficam ocultos enquanto o acesso estiver reduzido. A carteirinha continua visível, com o selo "Inativo"." (celular: "Agenda, avisos e graduação ficam ocultos. A carteirinha mostra o selo "Inativo"."). Débito automático e o cartão de recibos por e-mail não aparecem (D3).
- R4: "Fale com a academia": texto "Quer combinar o pagamento ou voltar a treinar? A equipe da {unidade} responde pelo WhatsApp." (celular, sem a primeira frase), botão "WhatsApp da unidade" (abre `wa.me`, só com WhatsApp cadastrado, o mesmo botão da #498) e, em 1440, WhatsApp e e-mail da unidade (D7); o que não está cadastrado não aparece; sem unidade, o cartão não aparece.
- R5: "Histórico e recibos" lista só o que foi pago, em tabela Referência, Pago em, Valor, Recibo (1440) e, no celular, "Recibos" em cartões com "pago em dd/mm" e o recibo; seletor de ano como no Financeiro completo; vazio com a mensagem atual (D4).
- R6 (R2 das decisões do canvas): `GET /portal/shell` devolve `unit` também no portal reduzido, com a unidade de cadastro do primeiro aluno ligado (a mesma de `unitContacts` da #498), e `unit` ganha `email` (anulável); com modalidade ativa continua a unidade da primeira modalidade ativa. Contrato, MSW e especificação mudam junto. O rodapé do reduzido passa a mostrar organização, unidade, endereço e WhatsApp (RN-INA-08; D8).
- R7: as regras não mudam: Agenda e Avisos seguem barrados no servidor para o reduzido (RN-POR-08); dados só do próprio aluno e da própria organização; o 403 do responsável não financeiro e o 404 de aluno fora da conta seguem como estão.
- R8: carregando, vazio, erro com "Tentar de novo" e sem permissão funcionam no Financeiro reduzido; textos em `pt-BR.json`; temas claro e escuro sem violação do axe; a partir de 360 px sem rolagem lateral; alvos de toque de 44 px.
- R9: caso visual `portal-reduzido` (1440 e 390 contra `PortalReduzido` e `PortalMReduzido`) comparado em pt-BR; só as referências desta tela mudam (D5).

## 3. Critérios de aceite

- CA1 (R1): dado o aluno reduzido, quando abre `/`, então vai a `/portal/financeiro`; as abas são só Financeiro e Minhas informações a 1440 e a 390 px; o logo leva ao Financeiro; `/portal/agenda` e `/portal/avisos` levam ao Financeiro.
- CA2 (R2): então a faixa genérica aparece acima do conteúdo, não há sino, e a barra mostra "Aluno · Inativo".
- CA3 (R3): então o Financeiro reduzido mostra o nome da unidade como rótulo, "Olá, Gabriel", a cobrança vencida com "Pagar", o cartão "Fale com a academia", "Histórico e recibos" e a nota; não mostra "Débito automático" nem o cartão de recibos por e-mail.
- CA4 (R4): dado unidade com WhatsApp e e-mail, então o cartão mostra o botão "WhatsApp da unidade" com o endereço `wa.me` do número, o WhatsApp e o e-mail; dado unidade sem WhatsApp, não há botão; dado `unit` nulo, não há cartão; a 390 px só o texto curto e o botão.
- CA5 (R5): dado histórico com uma cobrança paga e uma cancelada, então só a paga aparece, com Referência, Pago em, Valor e o link do recibo; a 390 px vira a lista "Recibos"; ano sem pagamento mostra o vazio.
- CA6 (R6, R7): `GET /portal/shell` do aluno reduzido devolve `unit` com nome, endereço, WhatsApp e e-mail da unidade de cadastro; do aluno ativo, a da primeira modalidade ativa; conta de outra organização não vê a unidade (isolamento) e Professor e gestão seguem com 403; `GET /portal/agenda` e `/portal/announcements` do reduzido seguem barrados (testes existentes passam); o rodapé mostra "Organização · Unidade · endereço · WhatsApp" no reduzido.
- CA7 (R8): carregando mostra o estado de carregando; falha do Financeiro mostra "Tentar de novo" que refaz; 403 mostra sem permissão; axe sem violação nos temas claro e escuro; sem rolagem horizontal a 360 px.
- CA8 (R9): `portal-reduzido` confere com o canvas a 1440 e 390 px (capturas em `.capturas/501/`), `npm run test:visual:docker -- -g "portal-reduzido"` passa sem `--update-snapshots` e `visual:canvas -- --exige` não reprova; a diferença da faixa (motivo do atraso) fica registrada no PR e em D6.

## 4. Plano técnico

- Dados: não muda.
- API: `backend/src/main/java/br/com/ctcore/student/PortalShell.java`: o record `Unit` ganha `email`; `view` passa a chamar `unit(who, reduced)`: no reduzido, a consulta de `name, address, whatsapp, email` em `unit` pela `registered_unit_id` do primeiro aluno ligado (ordem estável `s.name, s.id`); senão, a consulta atual. `PortalStudentController` não muda. `backend/src/test/java/br/com/ctcore/student/PortalShellIT.java`: casos do reduzido (unidade de cadastro, e-mail), do ativo e de isolamento entre organizações e perfis. Contrato: `docs/openapi.yaml`, schema `PortalShell.unit` (~6785): `email` anulável, em `required`, descrição nova. Teste de contrato: `OpenApiContractTest,ContractRoutesTest`.
- Especificação: `docs/especificacao/14-portal-do-aluno.md` (RF-POR-01 rodapé do reduzido, RN-POR-08 abas e `/`, RF-POR-05 Financeiro reduzido); muda antes do código.
- Interface (`frontend/src/features/portal/`): `usePortalShell.ts` (`unit` com `email`); `PortalTabs.tsx` (aba `home` com `full: true`, some no reduzido); `PortalLayout.tsx` (logo leva a `/portal/financeiro` no reduzido); `RequireFullPortal.tsx` e `PortalHomePage.tsx` (`Navigate` a `/portal/financeiro` no reduzido; sai o ramo `data.reduced` de `Sections`, cujo link da carteirinha já está em Minhas informações pela #498); `PortalFinancePage.tsx` (ramo reduzido: `PortalHeading` com unidade e "Olá"; sem `PortalAutoDebitCard` e `PortalReceiptsCard`; cartão de contato e nota); `PortalChargeHistory.tsx` (prop `reduced`: só pagos, quatro colunas, título "Histórico e recibos" e "Recibos" no celular); `PortalFooter.tsx` não muda (já mostra `unit`); a criar `PortalContactCard.tsx` (reaproveita `WhatsAppButton` e o padrão de `PortalUnitContacts` em `PortalTrainings.tsx`); chaves em `frontend/src/i18n/pt-BR.json` (`portalFinance.reduced.*`, `portalFinance.contact.*`). Reaproveita `PortalHeading`, `Card`, `PortalOpenCharges`, `useBelowSm`.
- MSW: `frontend/src/mocks/handlers.ts` (`/portal/shell`, ~4902): reduzido devolve `unit` fictícia com e-mail `.example`; ativo ganha `email`; o teste do shell em `frontend/src/mocks` (conferir o nome com `grep`) atualiza os campos.
- Testes: `PortalLayout.test.tsx` (abas, logo, redirecionamentos, rodapé), `PortalHomePage.test.tsx` (CA12 vira redirecionamento), `PortalFinancePage.test.tsx` (CA7 reduzido, e os novos), novo `PortalContactCard.test.tsx`, `src/test/a11y.test.tsx` (tela reduzida), e2e que abra `/` com o reduzido, se existir (`grep -ril reduzido frontend/e2e`).
- Visual: `frontend/visual/casos.ts`: `portal-reduzido` passa a `rota: "/portal/financeiro"` com `canvasCelular: "PortalMReduzido"`; o caso `portal-celular-reduzido` sai e suas 4 referências são removidas (D5); `portal-reduzido-info` muda só no rodapé (agora com a unidade) e tem a referência regerada. Regerar só esses casos.
- Segurança e isolamento: a regra de acesso não muda; o dado novo é contato público da unidade do próprio aluno, lido na transação da organização (RLS); teste de isolamento no `PortalShellIT`.
- Riscos: o rodapé muda em todas as telas do portal reduzido (referência de `portal-reduzido-info`); testes e e2e antigos que esperam o Início do reduzido ou a aba Início; a cobrança "59 dias", "Pix/Cartão/Boleto" vem da #497 (só conferir).

## 5. Tarefas

- [x] T1: especificação (RF-POR-01, RN-POR-08, RF-POR-05), contrato `PortalShell.unit.email`, back-end `PortalShell` com a unidade de cadastro no reduzido, MSW e tipo do hook. Cobre CA6. Prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`; `./backend/mvnw -f backend/pom.xml verify -Dit.test=PortalShellIT`; em `frontend/`, `npx vitest run src/mocks`.
- [x] T2: abas só Financeiro e Minhas informações no reduzido; logo, `/`, Agenda e Avisos levam ao Financeiro. Cobre CA1, CA2. Prova: em `frontend/`, `npx vitest run src/features/portal/PortalLayout.test.tsx src/features/portal/PortalHomePage.test.tsx`.
- [x] T3: `PortalContactCard` e Financeiro reduzido (rótulo, título, ordem, sem débito automático e sem cartão de recibos, nota). Cobre CA3, CA4. Prova: `npx vitest run src/features/portal/PortalFinancePage.test.tsx src/features/portal/PortalContactCard.test.tsx`.
- [x] T4: histórico reduzido (só pagos, quatro colunas, "Recibos" no celular). Cobre CA5. Prova: `npx vitest run src/features/portal/PortalFinancePage.test.tsx -t "reduzido"`.
- [x] T5: estados e acessibilidade do reduzido (carregando, erro, 403, axe nos dois temas, 360 px) e ajuste dos testes e e2e antigos. Cobre CA7. Prova: `npx vitest run src/test/a11y.test.tsx src/features/portal`; `npm run lint && npm run typecheck`.
- [x] T6: casos visuais, capturas em `.capturas/501/`, referências só de `portal-reduzido` e `portal-reduzido-info`, `npm run test:visual:docker -- -g "portal-reduzido"` sem `--update-snapshots`, `npm run visual:canvas -- --exige`. Cobre CA8.

## 6. Decisões

- D1 (muda o comportamento): o Início deixa de existir no reduzido; `/` e o logo levam ao Financeiro, como manda a decisão 2 do dono (duas áreas, Financeiro e Minhas informações, nos dois tamanhos). O link da carteirinha que ficava no Início já está em Minhas informações (#498). Alternativa: manter o Início reduzido só com a cobrança (contraria o canvas e a decisão).
- D2 (muda o comportamento): o reduzido continua sem sino. O canvas mostra o sino, mas RN-INA-08 manda ocultar os avisos e o sino só leva a eles; a especificação vence na regra e o canvas no visual (avatar, nome e "Aluno · Inativo" ficam). Alternativa: sino sem destino.
- D3: Débito automático e "recibos por e-mail" saem do Financeiro reduzido porque o canvas não os traz e, sem modalidade ativa, não fazem sentido.
- D4: o histórico reduzido lista só cobranças pagas, que é o que o canvas mostra e o que gera recibo; as demais situações ficam no Financeiro completo. Alternativa: todas as situações (mais perto do completo, mais longe do canvas).
- D5: o caso `portal-celular-reduzido` é fundido em `portal-reduzido` com `canvasCelular`, porque as duas telas passam a ser a mesma rota (`/portal/financeiro`) nos dois canvases.
- D6 (muda o comportamento): a faixa fica com o texto genérico. O canvas diz "porque o Muay Thai está bloqueado por atraso. Pagando, tudo volta na hora", mas hoje a modalidade só tem Ativa e Encerrada; afirmar atraso seria falso para ex-aluno e inativado à mão (RN-INA-06). O motivo entra com o bloqueio na Sprint 12 (#109, #111). Divergência a registrar no PR; se o `visual:canvas` reprovar só por ela, `limiteCanvas` com este motivo e a #111 citada (autonomia 4: a #111 não é da 10.5, então a conferência exige aprovação do dono se reprovar).
- D7 (suposição): o número mostrado em 1440 junto do e-mail é o WhatsApp da unidade (o canvas mostra um só). Se o dono quiser também o telefone fixo, `unit` ganha `phone`; `unitContacts` já o traz.
- D8 (suposição): o contato é o da unidade de cadastro do primeiro aluno ligado (ordem do nome), a mesma do contato da #498; com filhos em unidades diferentes o rodapé mostra só uma, e o de cada unidade está em Minhas informações.

## Construção

- T1 — arquivos: `docs/especificacao/14-portal-do-aluno.md` (RN-POR-08, RF-POR-01, RF-POR-05), `docs/openapi.yaml` (`PortalShell.unit.email`), `PortalShell.java` (`unit(who, reduced)`: unidade de cadastro no reduzido), `PortalShellIT.java`, `handlers.ts` (reduzido devolve `unit`; conta reduzida chama-se "Gabriel Rocha"), `usePortalShell.ts`, `portal-shell.msw.test.ts` — prova: `OpenApiContractTest,ContractRoutesTest` → 7 testes verdes; `verify -Dit.test=PortalShellIT` → BUILD SUCCESS; `npx vitest run src/mocks/portal-shell.msw.test.ts` → verde.
- T2 — arquivos: `PortalTabs.tsx` (aba `home` só no completo), `PortalLayout.tsx` (logo ao Financeiro), `RequireFullPortal.tsx`, `PortalHomePage.tsx` (reduzido: `Navigate` ao Financeiro; sai o ramo reduzido de `Sections`), `usePortalHome.ts` (`HomeSituation` ganha `PENDING`), testes `PortalLayout`, `PortalHomePage`, `OrgMark` — prova: `npx vitest run src/features/portal` → 19 arquivos, 235 testes verdes.
- T3 — arquivos: `PortalContactCard.tsx` (+ teste), `PortalFinancePage.tsx` (ramo reduzido: rótulo "Unidade {nome}", "Olá, {primeiro nome}", `PortalChargeCard` ao lado do contato, histórico, nota e link "Ver carteirinha"; sem débito automático e sem recibos por e-mail), `pt-BR.json` — prova: `PortalFinancePage.test.tsx` e `PortalContactCard.test.tsx` → verdes.
- T4 — arquivos: `PortalChargeHistory.tsx` (prop `reduced`: só pagos, Referência, Pago em, Valor, Recibo; "Recibos" e "pago em dd/mm" no celular) — prova: `PortalFinancePage.test.tsx` (casos do reduzido) → verde.
- T5 — arquivos: testes do reduzido em `PortalFinancePage.test.tsx` (carregando, erro com "Tentar de novo", 403, axe claro e escuro), e2e `portal-agenda|avisos|barra|carteirinha|finance|inicio` ajustados ao Financeiro — prova: `npm run lint && npm run typecheck` → limpos; `npx playwright test ... -g reduzido` → 9 passaram.
- T6 — arquivos: `visual/casos.ts` (`portal-reduzido` em `/portal/financeiro` com `canvasCelular` e `reduzidoCanvas`; `portal-celular-reduzido` removido), `visual/telas.visual.ts` (`reduzidoCanvas` e espera do redirecionamento do reduzido), referências — prova: ver abaixo.

Regressão: `./backend/mvnw -f backend/pom.xml verify` → 921 testes, 0 falhas, BUILD SUCCESS. Em `frontend/`: `npm run lint && npm run typecheck && npm run build && npm run test:cov` → verde, 270 arquivos, 2685 testes, cobertura 94,36% (linhas 97,07%). `npm run e2e` → 100 passaram, 1 falhou (`no-class-days.spec.ts`, Coordenador confirma feriado, sem relação com o item); rodado de novo sozinho → passou (instável, anotado para o PR).
Visual do CI: portal-reduzido (1440 e 390, claro e escuro) → passou; portal-reduzido-info (1440 e 390, claro e escuro) → passou. `npm run visual:canvas -- --exige` → 167 comparadas, 0 reprovadas (portal-reduzido 1440: 3,8% e 390: 7,7%; portal-reduzido-info 1440: 1,0%; limite padrão 30%). Capturas em `.capturas/501/` (portal-reduzido e portal-reduzido-info, 1440 e 390, sistema e canvas; o canvas de Info só existe a 1440).
Referências visuais: regeradas `visual/referencias/portal-reduzido-{1440,390}-{claro,escuro}.png` e `portal-reduzido-info-{1440,390}-{claro,escuro}.png` (o rodapé agora tem a unidade); removidas `portal-celular-reduzido-{1440,390}-{claro,escuro}.png` (D5).

Desvios (para o PR):
- D9: o canvas do Financeiro reduzido mostra o cartão da cobrança do Início (valor grande, "Pagar") ao lado de "Fale com a academia", não a tabela "Em aberto". Pelo canvas, o reduzido usa `PortalChargeCard` (o do Início) e não `PortalOpenCharges` como o plano técnico dizia; `HomeSituation` ganhou `PENDING` para aceitar as cobranças do Financeiro.
- D10: o link da carteirinha não está em Minhas informações do reduzido (a #498 não o pôs lá; só o completo tem `PortalPhoto`). Sem o Início, a carteirinha ficaria inalcançável, contra RN-INA-08; por isso o Financeiro reduzido traz "Ver carteirinha" abaixo da nota. É um link a mais que o canvas não mostra; o dono pode preferir levá-lo para Minhas informações (mudança no visual da #498).
- D11: o rótulo é "Unidade {nome}" e o texto do cartão usa só o nome ("A equipe da Tijuca"), como o canvas; o plano dizia "o nome da unidade" no rótulo.
- D12: `src/test/a11y.test.tsx` não ganhou caso: o axe do Financeiro reduzido (claro e escuro) está em `PortalFinancePage.test.tsx` e no e2e `portal-finance`.
- D13: o mock da conta `reduzido@exemplo.com` passou a se chamar "Gabriel Rocha" (canvas: "Olá, Gabriel"). O caso visual do reduzido espera o redirecionamento de "/" ao Financeiro antes de navegar (sem isso o redirecionamento chegava depois e a referência de Minhas informações saía errada a 390 px).
- Divergências com o canvas que ficam (nenhuma reprovou o limite padrão, sem `limiteCanvas`): faixa sem "porque o Muay Thai está bloqueado por atraso" (D6, #109/#111, Sprint 12); sem o sino (D2); "Pix · Cartão · Boleto" com "Em breve" no lugar dos valores por meio (#497, Sprint 11); "59 dias" (o relógio do visual é 29/10); seletor de ano mantido no histórico (R5); link "Ver carteirinha" (D10).
Não é do item: nada.

## Verificação

### Rodada 1 — OK — 2026-11-21, estado c99540d4263406575f607795332d7cee89bc5a6d

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | PortalLayout/PortalHomePage tests verdes; diff: aba home só no completo, logo e RequireFullPortal ao Financeiro |
| CA2 | PASSOU | captura 1440/390: faixa genérica, sem sino, "Aluno · Inativo" |
| CA3 | PASSOU | captura 1440/390 e PortalFinancePage.test (rótulo, Olá, Pagar, cartão, histórico, nota; sem débito automático) |
| CA4 | PASSOU | PortalContactCard.test verde; captura (390 só texto curto e botão) |
| CA5 | PASSOU | PortalFinancePage.test (reduzido); captura: tabela 1440, "Recibos" 390 |
| CA6 | PASSOU | `verify -Dit.test=PortalShellIT` + OpenApiContractTest,ContractRoutesTest: BUILD SUCCESS |
| CA7 | PASSOU | testes de estados/axe em PortalFinancePage.test verdes |
| CA8 | PASSOU | `test:visual:docker -g portal-reduzido`: 8 passaram; capturas em .capturas/501 conferidas a olho (faixa sem motivo, sem sino, sem "59 dias"/valores por meio, "Ver carteirinha" extra: divergências registradas no item) |

Comandos: `npm run lint && npm run typecheck` limpos; `vitest run src/features/portal src/mocks src/test/a11y.test.tsx` 78 arquivos, 596 testes verdes; backend e visual acima. Regressão completa (verify, test:cov, e2e) não reexecutada nesta rodada; vale o relato da Construção (921 testes, 2685 testes, e2e 100/101 com instável `no-class-days.spec.ts`) e o CI do PR.
Instáveis: `no-class-days.spec.ts` (Coordenador confirma feriado), 1 falha e passou ao rodar de novo (relato da construção).
Achados:
- sugestão, código, PortalFinancePage.tsx — "Ver carteirinha" (D10) é link extra fora do canvas; avaliar o dono.
- sugestão, código, PortalFinancePage.tsx — título do reduzido usa nome completo da conta (primeiro nome) e não o do aluno ligado; para responsável o "Olá" mostra o nome do responsável.

## Entrega

O portal do aluno sem modalidade ativa (reduzido) ganha o visual do canvas: o Início sai da rota do reduzido (entra no Financeiro), a aba Início só aparece no completo, o Financeiro reduzido traz o cartão da cobrança, o contato da academia, o histórico só de pagos, a nota e o link "Ver carteirinha". O mock do reduzido passa a devolver a unidade de cadastro e um nome de conta.

Verificado na rodada 1 (`OK`, estado `c99540d`): testes de unidade e MSW verdes, `PortalShellIT` e contrato OpenAPI verdes, visual do CI (`portal-reduzido` e `portal-reduzido-info`, 1440 e 390, claro e escuro) passou, `visual:canvas --exige` com 167 comparadas e 0 reprovadas.

Decisões: o Financeiro reduzido usa o `PortalChargeCard` do Início, não a tabela "Em aberto" (D9); "Unidade {nome}" no rótulo e só o nome da unidade no cartão (D11); "Ver carteirinha" fica no Financeiro reduzido, porque sem o Início a carteirinha ficaria inalcançável (D10).

Limitações: divergências que ficam, todas de outras issues: faixa sem o motivo do bloqueio (Sprint 12), sem o sino (D2), meios de pagamento "Em breve" (#497), "59 dias" pelo relógio do visual, seletor de ano no histórico (R5) e o link extra "Ver carteirinha" (D10, para o dono decidir).

Regressão: a base (`dev`) não avançou desde a verificação, então a regressão não foi refeita aqui. Construção: `verify` 921 testes verdes; `test:cov` 2685 testes verdes; `e2e` 100 de 101, com `no-class-days.spec.ts` falhando uma vez e passando ao rodar sozinho (instável, não relacionado ao item).
