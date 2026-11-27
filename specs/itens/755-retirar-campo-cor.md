# 755 — 626b · Retirar o campo de cor da API, do contrato, do MSW e do banco (fecha a #626)

Origem: issue #755 (parte b da #626; requisitos de partida em `specs/itens/626-retirar-cor-organizacao.md`, R5, R6, CA6 a CA8). Branch: `item/755-retirar-campo-cor`.

Tempos: especificar 4 (2 rodadas)

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

A cor da organização deixa de existir fora das telas (já sem ela desde a #754): sai da API, do contrato, do MSW, do banco, do código que só servia a ela e dos dados de exemplo dos testes (RNF-22, RF-ORG-01, decisão 20 de `docs/auditoria/decisoes-canvas.md`).

Fora do escopo: cores de faixa e graduação, o token `--brand`, a cor fixa do e-mail, o histórico de auditoria já gravado, as migrações antigas, logo nos e-mails e dados novos da organização (#627).

## 2. Requisitos

- R1: a API não grava nem devolve a cor da organização em `/organization`, `/portal/shell` e `/portal/card`, e `BrandColor` deixa de existir.
- R2: um PATCH de `/organization` que ainda mande `color` é ignorado, sem erro de cor e sem entrada de cor na auditoria, com permissão e isolamento como hoje.
- R3: a migração `V59` tira a coluna `organization.color` e a restrição `organization_color_format`, sem mudar os demais dados.
- R4: o contrato, o MSW, os tipos do front, `contrastRatio` e os dados de exemplo dos testes não têm a cor da organização.
- R5: o logo da organização continua aparecendo onde aparece hoje.

## 3. Critérios de aceite

- CA1 (R1): dado o GET de `/organization`, `/portal/shell` e `/portal/card`, quando respondem, então a organização não tem a chave `color`.
- CA2 (R2): dado o Coordenador, quando envia um PATCH com `color` (válida, reprovada no contraste ou texto qualquer), então a resposta é 200, os outros campos são gravados, a resposta não tem `color` e a auditoria não tem `color`; um PATCH em que só a cor "muda" não sobe a versão nem grava auditoria.
- CA3 (R2): dado um Administrador ou Professor, quando envia o PATCH, então recebe 403; o PATCH do Coordenador de uma organização não altera a outra.
- CA4 (R3): dado um banco na versão 58 com organização que tem cor, nome, titular e logo, quando as migrações rodam, então a coluna e a restrição `organization_color_format` não existem e nome, titular e logo ficam iguais.
- CA5 (R4): dado o código de produção, quando se busca a cor da organização, `BrandColor` e `contrastRatio`, então nada é encontrado fora das migrações antigas; o contrato e o MSW não têm o campo, o teste do contrato e os testes `*.msw.test.ts` da organização, da moldura e da carteirinha passam, e `lint`, `typecheck` e os testes do front passam sem o campo nos dados de exemplo da organização.
- CA6 (R5): dada uma organização com logo, quando se abrem as configurações, o portal, a carteirinha, o termo e o recibo, então o logo continua aparecendo.

## 6. Decisões

- D1 (P17, divisão; decisão do dono, 27/11/2026): aprovada a opção recomendada. Mensagem do dono na conversa, repassada a esta fase pelo agente que a acionou: "avance sem interrupções, se precisar de alguma ação minha, faça o que você me recomendaria [...] se for necessario alguma decisão minha, pode seguir com 'sim' ou a opção que você me recomendaria". É uma autorização geral, não uma resposta específica à P17; esta fase não viu a mensagem original. A #755 passa do limite de 30 arquivos contáveis (cerca de 36) e vira item-mãe, sem construção própria, em duas partes, nesta ordem, cada uma com a sua issue e o seu PR, antes da #628. Alternativa descartada: um PR só, acima do limite.
  - 755a, dados de exemplo (13 arquivos): parte de R4. `src/test/portalShell.ts`; testes de `AreaUnavailablePage`, `NotFoundPage`, `PortalAgendaPage`, `PortalAnnouncementsPage`, `PortalFinancePage`, `PortalInfoPage`, `PortalRequestsPage`, `PortalStates` e `TransferCoordinationDialog`; `visual/telas.visual.ts`; o comentário de `visual/casos.ts`; `OrganizationRouteIT`. Conferido em 27/11/2026: são dados sem tipo, um corpo de PATCH e um comentário, e nada lê a cor deles, então a `dev` fica verde e sem mudança visual pedida. As cores de faixa nesses arquivos ficam.
  - 755b, o campo (cerca de 23 arquivos): R1 a R3, o restante de R4 e R5; CA1 a CA6. `BrandColor` e o seu teste, `OrganizationProfile`, `OrganizationController`, `V59`, `docs/openapi.yaml`, `OrganizationProfileIT`, `OrganizationBase`, `MigrationIT`, `PortalShellIT`, `PortalCardIT`, `contrastRatio.ts` e o seu teste, `handlers.ts`, `useOrganization.ts`, `usePortalShell.ts`, `usePortalCard.ts`, os testes MSW da organização, da moldura e da carteirinha, e os testes tipados `BrandCard`, `OrganizationSettingsPage`, `PortalShell` e `PortalCardPage`. O PR fecha também a #755 e a #626.
- As seções 4 e 5 ficam no arquivo de cada parte, como na #626.
