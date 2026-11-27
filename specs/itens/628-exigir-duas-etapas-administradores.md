# 628 — RN-ACE-24 · Exigir duas etapas dos Administradores

Origem: issue #628 (autor `ODevDosAnjos`); RN-ACE-24 e RN-ACE-17 em `docs/especificacao/02-contas-e-acesso.md`, RF-ORG-08 e RF-ORG-09 em `01-organizacao-e-isolamento.md`; decisões 19 e 22 de `docs/auditoria/decisoes-canvas.md`. Branch: `item/628-exigir-duas-etapas-administradores`.
Tempos: especificar 3 · construir 43 (2 rodadas) · verificar 26 (regressão 22; 2 rodadas) · entregar 6
Comparação com o canvas: 4

## 1. Objetivo

O Coordenador passa a exigir duas etapas (TOTP) de todos os Administradores da organização, em Configurações › Dados e segurança › Duas etapas. A exigência é desligada por padrão e reaproveita o bloqueio que já vale para o Coordenador.

Fora do escopo: abas Auditoria, Importar e exportar e Acesso do suporte (só aparecem "Em breve"); o novo desenho da tabela de permissões (#634); "Trocar de aparelho" e Minha conta em abas (#631); Configurações › Visão geral (#640); rolar a aba ativa até ficar visível no `Tabs` (P15).

## 2. Requisitos

- R1: a organização tem a opção "exigir duas etapas dos Administradores", desligada por padrão; só o Coordenador a lê e a altera, só na própria organização, com a recusa no servidor (RN-ACE-24; D2).
- R2: com a opção ligada, o Administrador com vínculo ativo e sem duas etapas configura no próximo login, antes de entrar na gestão, como o Coordenador no primeiro acesso; o servidor recusa as demais rotas até configurar (RN-ACE-24, RN-ACE-17; D1, D3, D4).
- R3: enquanto a exigência vale, o Administrador não desliga as duas etapas: Minha conta não oferece "Desligar" e a API recusa (RN-ACE-24).
- R4: desligar a exigência não desliga as duas etapas de ninguém; só libera o "Desligar" e acaba com a configuração obrigatória (RN-ACE-24).
- R5: ligar e desligar vai para a auditoria com o valor antes e depois, e a aba mostra a última alteração (RN-ACE-24, RF-ORG-08).
- R6: o item Dados e segurança passa a ter tela, com as abas Auditoria, Importar e exportar e Acesso do suporte desabilitadas com "Em breve" e a aba Duas etapas ativa (issue, RF-ORG-09; D5).
- R7: a tabela de permissões ganha a linha "Exigir duas etapas dos Administradores", só Coordenador, no servidor, no contrato e na tela (issue; D2). A RN-ACE-17, a RN-ACE-24 e a tabela da especificação já trazem a mudança: `docs/especificacao/` não muda.

## 3. Critérios de aceite

- CA1 (R1): dada uma organização nova ou existente, quando o Coordenador lê a opção, então vem `required: false` e `lastChange: null`; quando grava `true` e depois `false`, a leitura devolve o valor gravado.
- CA2 (R1): sem sessão, GET e PUT respondem 401; Administrador, Professor, Aluno e Responsável recebem 403 e nada muda; PUT sem `required` booleano é recusado como erro de validação.
- CA3 (R1): dadas as organizações A e B, quando o Coordenador de A liga, então B continua desligada, o Administrador de B segue sem bloqueio e as sessões dele continuam valendo.
- CA4 (R2): dada a exigência desligada e um Administrador sem duas etapas com sessão aberta, quando o Coordenador liga, então essa sessão deixa de valer (401); no login seguinte a sessão traz `twoFactor.required: true` e qualquer rota fora da sessão, da saída e das duas etapas responde 403 `TWO_FACTOR_SETUP_REQUIRED`; depois de ativar, as rotas respondem. A sessão do Administrador que já usa duas etapas, a do Coordenador e a do Professor continuam valendo.
- CA5 (R2): dada a exigência ligada, quando um Administrador sem duas etapas entra pelo navegador e abre um endereço da gestão, então fica em "Ative as duas etapas para continuar", com o texto da exigência da organização (não o do perfil de Coordenador) e sem "Agora não"; depois de ativar e guardar os códigos, entra na gestão (ponta a ponta).
- CA6 (R2): quem tem vínculo de Administrador ativo numa organização que exige é obrigado mesmo com outro vínculo aberto; vínculo de Administrador encerrado, e Professor, Aluno ou Responsável sem vínculo de Administrador, não são obrigados.
- CA7 (R3): dada a exigência ligada e um Administrador com duas etapas, quando chama `DELETE /api/v1/auth/two-factor` com senha e código certos, então recebe 403 e elas continuam ligadas; a sessão traz `required: true`, e com isso Minha conta não mostra "Desligar".
- CA8 (R4): quando o Coordenador desliga a exigência, então quem usa duas etapas continua usando (o login segue pedindo o código), `required` volta a `false`, o Administrador consegue desligar e quem não configurou entra sem configurar.
- CA9 (R5): ligar e desligar gravam cada um um registro `organization.admin_two_factor.update`, com autor, organização e `required` antes e depois, e `lastChange` passa a vir preenchido; gravar o valor que já está não grava registro nem encerra sessão.
- CA10 (R6): o Coordenador abre `/configuracoes/dados-e-seguranca` pelo menu, dentro da moldura, com Duas etapas ativa e as três outras abas desabilitadas com "Em breve" (clique e teclado não trocam o painel; `?aba=auditoria` mostra Duas etapas). Ligar pede confirmação (cancelar não grava); desligar grava direto.
- CA11 (R6): a aba mostra carregando, erro com "Tentar de novo" e sem permissão (403); falha ao salvar mostra erro e o interruptor fica no valor anterior; funciona a 360 px e passa no axe nos dois temas.
- CA12 (R6): para o Administrador, Dados e segurança continua no menu e em `/configuracoes` desabilitado "Em breve", e o endereço direto mostra "Esta área não está disponível para o seu perfil"; o Professor não vê o item.
- CA13 (R7): `REQUIRE_ADMIN_TWO_FACTOR` vale `FULL/ALL` para o Coordenador e `NONE` para Administrador e Professor no servidor, no CSV, no contrato e no MSW, e a tela da tabela mostra a linha "Exigir duas etapas dos Administradores" com ●, — e —.

## 4. Plano técnico

- Dados: a criar `backend/src/main/resources/db/migration/V60__require_admin_two_factor.sql`:
  - `organization_settings.require_admin_two_factor boolean not null default false` (a RLS `organization_scope` da V3 já cobre a escrita);
  - política só de `select` em `organization_settings`, no molde da `V8__organization_name_for_account.sql`: o escopo da conta (`app.account_id`) lê a linha da organização em que a conta tem vínculo `ADMINISTRATOR` ativo. É necessária porque `TwoFactorService.requiredFor` roda no escopo da conta e vale para vínculos de várias organizações;
  - comentário de como desfazer; sem tabela nova, então sem seed.
- API (`docs/openapi.yaml`):
  - a criar `GET` e `PUT /organization/admin-two-factor`; resposta `AdminTwoFactorPolicy { required, lastChange }`; PUT recebe `{ required: boolean }`; 401, 403 e o erro de validação do padrão; sem `If-Match` (D6).
  - `Permission.enum` ganha `REQUIRE_ADMIN_TWO_FACTOR` no fim; atualizar as descrições de `TwoFactorState.required`, de `DELETE /auth/two-factor` (403 também para o Administrador obrigado) e do PUT novo (encerra sessões, D1).
- Back-end:
  - `identity/TwoFactorService.requiredFor`: a consulta passa a aceitar `role = 'COORDINATOR'` ou `role = 'ADMINISTRATOR'` com `organization_settings.require_admin_two_factor`. É o único lugar: `TwoFactorGateFilter`, `SessionService.view` e `disable` seguem sem mudança e entregam R2, R3 e R4.
  - a criar `organization/AdminTwoFactorPolicy` (serviço, no molde de `OrganizationProfile`): `read` e `update` com `permissions.require(who, Permission.REQUIRE_ADMIN_TWO_FACTOR, null)`; na transação da organização, `update ... where organization_id = :org and require_admin_two_factor <> :v`; só quando mudou uma linha, `AuditService.record` (ação `organization.admin_two_factor.update`, entidade `organization`) e, ao ligar, a lista dos `account_id` com vínculo `ADMINISTRATOR` ativo. `lastChange` sai de `LastChange.find` com essa ação (não entra em `ORGANIZATION_ACTIONS`, que é a da aba Geral).
  - Depois do commit (fora da transação: `AccountTransactions` não troca de conta dentro de uma), para cada conta da lista sem `twoFactor.enabled`, `identity/SessionService.endAll(accountId, null)`. Se falhar no meio, o filtro continua barrando a sessão.
  - `organization/OrganizationController`: as duas rotas.
  - `permission/Permission` e `permission/PermissionTable` (`row(REQUIRE_ADMIN_TWO_FACTOR, ALL_FULL, Grant.NONE, Grant.NONE)`); `backend/src/test/resources/permission-table.csv` e `PermissionTableTest` (29 para 30).
- Interface (sem canvas, decisão 22: componentes base da 10.5):
  - `routes.ts`: `dataSecurity` sai de `"soon"`, passa a usar `REQUIRE_ADMIN_TWO_FACTOR` e ganha em `MenuItemDef` o campo `soonFor: "AUDIT"`; `features/permissions/menuCatalog.ts` leva o campo; `features/permissions/buildMenu.ts` mostra o item desabilitado quando a permissão é `NONE` e a de `soonFor` não é (D5).
  - `App.tsx`: `screens.dataSecurity`.
  - `components/ui/tabs.tsx`: `TabItem.soon`: aba com `aria-disabled`, selo e dica "Em breve" (textos `comingSoon.*`), alcançável pelas setas, mas sem selecionar.
  - a criar `features/data-security/DataSecurityPage.tsx`: `PageHeader` "Dados e segurança"; `Tabs` na ordem auditoria, importar-exportar, acesso-suporte, duas-etapas, com `useTabParam(["duas-etapas"])`; no painel, `Card` com `SwitchRow` (`features/units/SwitchRow.tsx`), texto do efeito, `LastChange`, `LoadingState`, `ErrorState`, `ForbiddenState` e aviso de salvo ou de erro com `Banner`. Ligar abre `Modal` de confirmação dizendo que os Administradores sem duas etapas são desconectados e configuram no próximo login. Não há estado vazio: é uma opção só.
  - `features/auth/TwoFactorRequiredPage.tsx`: sem vínculo `COORDINATOR` em `session.links`, usa o texto novo ("A sua organização exige a verificação em duas etapas dos Administradores. Ative para usar o sistema.").
  - `features/account/TwoFactorSection.tsx` não muda: já esconde "Desligar" quando `required`.
  - `features/users/permissionMatrix.ts` (linha `requireAdminTwoFactor`, `["FULL/ALL", "NONE", "NONE"]`, no fim) e `permissionMatrix.test.ts` (28 para 29); `features/permissions/types.ts`; textos em `i18n/pt-BR.json`.
  - MSW: `mocks/permissions.ts` ganha a linha; `mocks/handlers.ts` ganha as duas rotas (com `organizationAccess(true)`), a opção em memória (zerada no reset) e, com ela ligada, a sessão de conta com vínculo de Administrador vem com `required: true` (login, segundo passo e `GET /auth/session`), o que também faz o `DELETE /auth/two-factor` do mock responder 403.
- Segurança: permissão no servidor nas duas rotas; organização sempre a do vínculo ativo (sem id na URL); filtro explícito por organização mais RLS; CSRF no PUT como nas demais escritas; auditoria sem segredo. A política nova é só de leitura e só para a organização em que a conta é Administrador ativo.
- Arquivos: os citados acima, vistos no repositório, salvo os "a criar". Testes: a criar `backend/src/test/java/br/com/ctcore/organization/AdminTwoFactorPolicyIT.java` e `frontend/src/features/data-security/DataSecurityPage.test.tsx` (cobre também a aba `soon` do `Tabs` e o texto da página obrigatória); a alterar `buildMenu.test.ts`, `routes.test.ts` (mapa `legacy`: `dataSecurity: ["COORDINATOR"]`), `SettingsIndexPage.test.tsx`, `permissionMatrix.test.ts`, `mocks/twofactor.msw.test.ts`, `e2e/duas-etapas.spec.ts` e `visual/casos.ts`. Estimativa: 29 arquivos contáveis (limite 30).
- Reuso: bloqueio e telas de configuração obrigatória das duas etapas (`TwoFactorGateFilter`, `RequireTwoFactor`, `TwoFactorRequiredPage`, `TwoFactorSetupDialog required`), `SessionService.endAll`, `LastChange`, `AuditService`, `SwitchRow`, `Modal`, `useTabParam`.
- Riscos: `requiredFor` roda em toda requisição autenticada, então erro na consulta ou na política bloqueia todo mundo (percebido pelos `TwoFactor*IT`); a política nova soma-se à `organization_scope` (percebido no CA3); o menu e a tabela de permissões mudam referências do visual.

## 5. Tarefas

Duas partes, cada uma construível em uma sessão; um PR só.

### Parte A — servidor e contrato

- [x] T1: migração V60, `requiredFor`, `Permission`, `PermissionTable`, CSV, `PermissionTableTest` e o enum `Permission` do contrato — cobre CA6, CA13 (servidor) — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='PermissionTableTest'`
- [x] T2: `AdminTwoFactorPolicy`, as duas rotas, o contrato e `AdminTwoFactorPolicyIT` (padrão, perfis, isolamento, bloqueio, sessões encerradas, vários vínculos, recusa do `DELETE`, desligar, auditoria e repetição sem efeito; `truncate ... cascade` se usar servidor real) — cobre CA1, CA2, CA3, CA4, CA6, CA7, CA8, CA9 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=AdminTwoFactorPolicyIT -Djacoco.skip=true` e `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`

### Parte B — telas

- [x] T3: permissão no front (`types.ts`, `mocks/permissions.ts`, matriz, textos) e menu (`routes.ts`, `menuCatalog.ts`, `buildMenu.ts` com `soonFor`, testes deles e de `SettingsIndexPage`) — cobre CA12, CA13 — prova: em `frontend/`, `npx vitest run src/features/permissions src/features/users/permissionMatrix.test.ts src/features/units/SettingsIndexPage.test.tsx src/routes.test.ts`
- [x] T4: handlers MSW, `Tabs` com `soon`, `DataSecurityPage`, `App.tsx`, texto da página obrigatória e testes — cobre CA7 (tela), CA10, CA11 — prova: em `frontend/`, `npx vitest run src/features/data-security src/mocks/twofactor.msw.test.ts src/components/ui/tabs.test.tsx src/components/layout/shell.test.ts`; `npm run lint && npm run typecheck`
- [x] T5: ponta a ponta em `e2e/duas-etapas.spec.ts` (`@critical`): o Coordenador abre a aba pela moldura, liga e confirma; sai pela interface, sem recarregar (a opção do MSW vive em memória); `admin@exemplo.com` entra, é barrado, ativa com o código do mock e entra na gestão — cobre CA5, CA10 — prova: em `frontend/`, `npm run e2e -- duas-etapas`
- [x] T6: visual: caso novo `configuracoes-dados-seguranca` (sem canvas) em `visual/casos.ts`; como a rota do menu mudou, regerar as referências afetadas com `npm run test:visual:docker -- --update-snapshots --workers=2`, conferir que só mudou o que o item pede (tela nova, menu com Configurações aberto, lista de Configurações e tabela de permissões) e listar caso a caso; salvar as capturas a 1440 e 390 px, pt-BR, nos dois temas, em `.capturas/628/` (não há canvas desta aba para comparar; na tabela `PermissoesTabela` a única divergência nova é a linha, pedida pela issue); conferir a 360 px — cobre CA11 — prova: em `frontend/`, `npm run test:visual:docker -- -g "configuracoes-dados-seguranca"`

## 6. Decisões

- D1 (muda o comportamento): ao ligar, as sessões abertas dos Administradores da organização que não têm duas etapas são encerradas (todas as da conta). Assim vale ao pé da letra o "configura no próximo login, antes de entrar", sem sessão antiga seguir sem a segunda etapa. O bloqueio por requisição do Coordenador continua como garantia. A janela de confirmação avisa. A tela aberta do desconectado reage como em qualquer sessão encerrada hoje. Descartado: só barrar a sessão aberta com 403 (pega a pessoa no meio do uso, pede tratamento novo no front e não é "no próximo login"); valer só para sessões criadas depois (deixa sessão antiga sem exigência por tempo indefinido).
- D2: linha própria `REQUIRE_ADMIN_TWO_FACTOR` na tabela de permissões, como a especificação e a issue pedem. Leitura e escrita só do Coordenador. Descartado: reaproveitar `ORGANIZATION_SETTINGS`, que dá leitura ao Administrador, ou `AUDIT`.
- D3 (muda o comportamento): a obrigação é da conta, como na regra do Coordenador: um vínculo de Administrador ativo numa organização que exige obriga em qualquer vínculo aberto, inclusive no portal ou em outra organização. Descartado: valer só com o vínculo daquela organização aberto (a troca de vínculo viraria atalho e o filtro atual não funciona assim).
- D4: quem vira Administrador depois (convite aceito, nova função) numa organização que exige cai na mesma configuração obrigatória, sem código extra, porque `requiredFor` é calculado a cada requisição.
- D5: a aba Duas etapas é só do Coordenador e as outras três são futuras, então para o Administrador o item inteiro segue "Em breve" (RF-ORG-09: item com todas as abas futuras). Descartado: tirar o item do menu dele; abrir a tela só com abas desabilitadas.
- D6: a opção é um interruptor que grava na hora, com PUT idempotente e sem `If-Match` (a RF-ORG-08 o exige na edição de organização e de unidade, que são formulários; aqui não há campo digitado a perder nem diferença a mostrar) e sem mexer em `organization.version`, para não gerar conflito na aba Geral.
- D7: confirmação só ao ligar, porque desconecta pessoas; desligar não tira nada de ninguém.
- Suposição: a rolagem da aba ativa a 390 px continua na P15: a aba Duas etapas é a quarta e pode ficar fora da parte visível da linha de abas, com o conteúdo dela à mostra. Se o dono quiser a correção junto, é mudança no `Tabs` base.

## Construção

- T1 — arquivos: `V60__require_admin_two_factor.sql`, `TwoFactorService.java`, `Permission.java`, `PermissionTable.java`, `permission-table.csv`, `PermissionTableTest.java`, `docs/openapi.yaml` — prova: `mvnw test -Dtest='PermissionTableTest'` → 2 testes, 0 falhas
- T2 — arquivos: `AdminTwoFactorPolicy.java`, `OrganizationController.java`, `docs/openapi.yaml`, `AdminTwoFactorPolicyIT.java`, `CoordinationTransferKeepUnitsIT.java` — prova: `mvnw verify ... -Dit.test=AdminTwoFactorPolicyIT` → 7 testes, 0 falhas; `mvnw test -Dtest='OpenApiContractTest,ContractRoutesTest'` → 7 testes, 0 falhas
- T3 — arquivos: `features/permissions/{types,menuCatalog,buildMenu,buildMenu.test}.ts`, `mocks/permissions.ts`, `features/users/permissionMatrix{,.test}.ts`, `routes{,.test}.ts`, `SettingsIndexPage.test.tsx`, `i18n/pt-BR.json` — prova: o `vitest run` da tarefa → 7 arquivos, 80 testes, 0 falhas
- T4 — arquivos: `mocks/handlers.ts`, `mocks/twofactor.msw.test.ts`, `components/ui/tabs.tsx`, `features/data-security/DataSecurityPage{,.test}.tsx`, `App.tsx`, `TwoFactorRequiredPage.tsx`, `i18n/pt-BR.json`, `docs/design/README.md` (a opção `soon` do `Tabs`) — prova: o `vitest run` da tarefa → 4 arquivos, 273 testes, 0 falhas; `npm run lint && npm run typecheck` → sem erros
- T5 — arquivos: `e2e/duas-etapas.spec.ts` — prova: `npm run e2e -- duas-etapas` → 2 passaram. Padrão de rotas e telas: o e2e abre a tela pelo menu, dentro da moldura; `vitest run noInternalAnchors routePattern shell.test` → 6 arquivos, 312 testes, 0 falhas
- T6 — arquivos: `visual/casos.ts` e as referências abaixo — prova: `npm run test:visual:docker -- --update-snapshots --workers=2` (suíte inteira) → 664 passaram em 22,4 min; depois, `-- --update-snapshots -g " (configuracoes-dados-seguranca|configuracoes-modalidades-pedido|configuracoes-unidade-pagamentos) "` → 12 passaram e nenhum PNG foi regravado (sha1 igual). A prova escrita na tarefa, sem `--update-snapshots`, não rodou: o `AGENTS.md` deixa essa conferência só para o CI. `npm run visual:canvas` → 164 comparadas, 0 reprovadas; `configuracoes-permissoes` 1440 claro 5,5% (limite 15%). 360 px e axe no navegador real (spec temporário, já apagado), claro e escuro, na aba, na janela de confirmação e depois de salvar: 2 passaram, sem rolagem horizontal e sem violações. Docker: nenhuma imagem, contêiner ou volume novo ficou.
  - Capturas em `.capturas/628/`: `configuracoes-dados-seguranca-{1440,390}-sistema.png`, `configuracoes-dados-seguranca-escuro-{1440,390}-sistema.png` (aba sem canvas), `configuracoes-permissoes-{1440,390}-sistema.png` e `configuracoes-permissoes-1440-canvas.png` (o caso não tem canvas de celular).
  - Comparação de `PermissoesTabela`: a única divergência criada pelo item é a linha "Exigir duas etapas dos Administradores", no fim, pedida pela issue. As demais já existiam (menu, "Voltar à unidade", linha "Administradores", subtítulo) e não foram tocadas.
  - A 390 px a aba Duas etapas fica fora da parte visível da linha de abas, com o conteúdo à mostra (P15, como a especificação previu).

Testes do item: `mvnw verify` só com `AdminTwoFactorPolicyIT,CoordinationTransferKeepUnitsIT` → 12 testes, 0 falhas; `mvnw test -Dtest='PermissionTableTest,OpenApiContractTest,ContractRoutesTest'` → 9, 0 falhas; `vitest run` dos testes do item e de `visual/casos.test.ts` → 12 arquivos, 522 testes, 0 falhas; `lint`, `typecheck` → sem erros; `e2e -- duas-etapas` → 2 passaram.
Regressão: não roda nesta fase (`AGENTS.md`, "Quem roda o quê").
Desvios: (1) `CoordinationTransferKeepUnitsIT.java` ganhou um `null` na chamada do construtor de `OrganizationController`, que mudou; com ele são 30 arquivos contáveis (estimativa 29, limite 30). (2) A confirmação usa o `ConfirmDialog` (feito sobre o `Modal`), que já mantém a janela aberta quando o salvar falha; o erro aparece dentro dela. (3) A aba "Em breve" do `Tabs` usa a dica nativa (`title`), porque a lista de abas rola na horizontal e cortaria um balão próprio. (4) O IT usa sessões reais pelo login e um código de reserva conhecido, sem calcular TOTP, e limpa o banco com `truncate ... cascade`. (5) O PUT recebe `required` como `JsonNode`, para o Jackson não aceitar `"true"` nem `1` como booleano.
Referências visuais: novas `configuracoes-dados-seguranca-{1440,390}-{claro,escuro}.png`. Alteradas, a 1440 claro e escuro (menu com Configurações aberto: "Dados e segurança" deixa de estar "Em breve"): `configuracoes-organizacao`, `-transferir-coordenacao`, `-faixas-etarias`, `-faixa-nova`, `-modalidades`, `-modalidade-desativar`, `-modalidades-graduacao`, `-modalidades-pedido`, `-termos`, `-unidades`, `-unidade`, `-unidade-nova`, `-unidade-desativar`, `-unidade-unica`, `-unidade-pagamentos`, `-unidade-pagamentos-desconectado`, `-unidade-lembretes`, `-unidade-links`, `-unidade-modalidades-recusa`, `-unidade-professor`. Alteradas a 1440 e 390, claro e escuro (linha nova na tabela): `configuracoes-permissoes`. Conferência pixel a pixel contra o `HEAD`: fora do menu só mudou `configuracoes-permissoes`, além de ruído de renderização em `modalidades-pedido` 1440 escuro (13 pixels) e junto à borda do menu em `unidade-pagamentos` 1440 claro; as duas saíram iguais na segunda geração. A lista de Configurações (`configuracoes`, vista pelo Administrador) não mudou.

### Correção da rodada 1

- achado obrigatório (`npm test` vermelho com a linha nova da tabela) — arquivos: `frontend/src/features/users/PermissionsTablePage.test.tsx` (29 linhas no título, 30 contando o cabeçalho, `29 * 3` definições e a linha ancorada em `/^Administradores/`; as células conferidas não mudaram) — prova: `npx vitest run src/features/users/PermissionsTablePage.test.tsx` → 8 testes, 0 falhas
- Testes do item: `npx vitest run` das pastas e arquivos do item (`permissions`, `users`, `data-security`, `SettingsIndexPage`, `routes`, `twofactor.msw`, `tabs`, `shell`, `visual/casos`) → 14 arquivos, 547 testes, 0 falhas; `npm run lint` e `npm run typecheck` → sem erros. Back-end sem mudança nesta correção: os testes dele não rodaram de novo. Regressão: não roda nesta fase.
- Desvio aceito: 31 arquivos contáveis (limite 30). Motivo: o 31º é só a atualização de um teste que o próprio item quebrou. Decisão do dono, pela autorização geral dada na conversa em 27/11/2026 ("se for necessario alguma decisão minha, pode seguir com 'sim' ou a opção que você me recomendaria").
- Sugestão opcional da rodada 1 (aviso de erro que reaparece depois de "Cancelar", em `DataSecurityPage.tsx`): não aplicada; fica registrada na verificação.
- Referências visuais: nenhuma mudou nesta correção (só teste).

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-27, estado 183ecd6d30d4954eec9bd934d76b3eab93c509fd

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `AdminTwoFactorPolicyIT` (7 testes, 0 falhas), `defaultsOffAndSaves`; a coluna nasce `not null default false` na V60, o que cobre a organização existente |
| CA2 | PASSOU | IT `onlyTheCoordinator`: 401, 403 nos quatro perfis, 400 `VALIDATION_ERROR` para `{}`, `null`, `"true"` e `1`, nada gravado nem auditado |
| CA3 | PASSOU | IT `isolation`, com id de B forjado no corpo, no cabeçalho e na query |
| CA4 | PASSOU | IT `endsSessionsAndGates` |
| CA5 | PASSOU | `npm run e2e -- duas-etapas` (2 passaram), mais `DataSecurityPage.test.tsx` (endereço `/alunos`, texto da organização, sem "Agora não") no `npm test` |
| CA6 | PASSOU | IT `whoIsRequired` |
| CA7 | PASSOU | IT `disableAndSwitchOff` (403, segue ligado) e `DataSecurityPage.test.tsx` (Minha conta sem "Desligar") |
| CA8 | PASSOU | IT `disableAndSwitchOff` |
| CA9 | PASSOU | IT `auditAndRepeat` |
| CA10 | PASSOU | `DataSecurityPage.test.tsx` no `npm test` e o e2e (abre pelo menu, dentro da moldura) |
| CA11 | PASSOU | `DataSecurityPage.test.tsx` (estados e falha ao salvar). Sonda própria fora do repositório (Playwright e axe no Chromium, Vite com MSW, 360 px, claro e escuro; aba, janela e depois de salvar): 6 medições, sem rolagem horizontal e sem violações |
| CA12 | PASSOU | `buildMenu.test.ts` (Administrador "Em breve"; Professor sem o grupo), `SettingsIndexPage.test.tsx` e `DataSecurityPage.test.tsx` (endereço direto) no `npm test` |
| CA13 | PASSOU | `PermissionTableTest` (2), `OpenApiContractTest` (4) e `ContractRoutesTest` (3) no `mvnw test`; `permissionMatrix.test.ts`; a linha com ● — — aparece nas capturas de `configuracoes-permissoes` |

Comandos: `npm run lint`, `typecheck` e `build` → sem erros; `npm test` → **falhou**: 3 de 3071 testes, 1 de 276 arquivos; `npm run e2e -- duas-etapas` → 2 passaram; `mvnw test` → 160 testes, 0 falhas; `mvnw verify` só com `AdminTwoFactorPolicyIT,CoordinationTransferKeepUnitsIT` (`-Djacoco.skip=true`) → 12 testes, 0 falhas. Visual: no CI do PR. Docker: os contêineres do Testcontainers saíram sozinhos; nenhuma imagem nova.
Canvas: abertas as 7 imagens de `.capturas/628/`. A aba não tem canvas e usa os componentes base; a 390 px a aba ativa fica fora da parte visível (P15, previsto). Em `PermissoesTabela` a única divergência criada pelo item é a última linha.
Instáveis: nenhum.
Achados:
- obrigatório, código, `frontend/src/features/users/PermissionsTablePage.test.tsx` — esperado: `npm test` verde com a linha nova da tabela; observado: 3 testes falham, também nas 3 execuções só do arquivo com `--maxWorkers=2` (3 falhas e 5 aprovações em cada uma): "CA8: ... matriz de 28 linhas" (`toHaveLength(29)` linhas contando o cabeçalho, agora são 30), "CA10: a 360 px" (`28 * 3` = 84 definições, vieram 87) e "CA11 (#611)" (`getByRole("row", { name: /Administradores/ })` passa a casar também com "Exigir duas etapas dos Administradores"); evidência: saída do `npm test` e das 3 execuções; a causa é a linha que o item acrescentou à matriz. A construção rodou só `permissionMatrix.test.ts` dessa pasta. Corrigir: no teste, 30 linhas e `29 * 3` definições (e o título), e ancorar o nome da linha em `/^Administradores/`, sem enfraquecer a conferência das células. Atenção ao limite do `AGENTS.md`: o item está com 30 arquivos contáveis e este é o 31º; é correção de teste que o próprio item quebrou, e quem conduz deve registrar o desvio ou levar ao dono.
- sugestão, código, `frontend/src/features/data-security/DataSecurityPage.tsx` — depois de falhar ao ligar e clicar em "Cancelar", `notice` continua `"error"` e o aviso reaparece fora da janela; limpar o aviso ao fechar a janela.

### Rodada 2 — OK — 2026-11-27, estado b13e3f8b44594b61c41a9a32234d5bd7cc5328ab

Desde a rodada 1 mudaram só `PermissionsTablePage.test.tsx` e este arquivo.

| Critério | Status | Evidência |
|---|---|---|
| CA1, CA2, CA3, CA4, CA6, CA7, CA8, CA9 | PASSOU | `AdminTwoFactorPolicyIT` rodado de novo (7 testes, 0 falhas); a parte de tela do CA7 está no `npm test` |
| CA5 | PASSOU | `npm run e2e -- duas-etapas` (2 passaram) e `npm test` |
| CA10 | PASSOU | `npm test` e o e2e |
| CA11 | PASSOU | `npm test` (estados e falha ao salvar); 360 px e axe: mantido da rodada 1 (tela sem mudança) |
| CA12 | PASSOU | `npm test` |
| CA13 | PASSOU | `mvnw test`, `npm test` (inclui `PermissionsTablePage.test.tsx` e `permissionMatrix.test.ts`) |

Comandos: `npm run lint`, `typecheck` e `build` → sem erros; `npm test` → 276 arquivos, 3071 testes, 0 falhas; `npm run e2e -- duas-etapas` → 2 passaram; `mvnw test` → 160 testes, 0 falhas; `mvnw verify` só com `AdminTwoFactorPolicyIT,CoordinationTransferKeepUnitsIT` (`-Djacoco.skip=true`) → 12 testes, 0 falhas. A regressão da verificação rodou inteira. Visual: no CI do PR. Docker: nenhuma imagem nova (10 antes e depois do IT).
Achado obrigatório da rodada 1: resolvido. O teste passou a 30 linhas e `29 * 3` definições, e a linha foi ancorada em `/^Administradores/`; as células conferidas (●, —, —) não mudaram e nenhum teste foi enfraquecido ou pulado.
Canvas: mantido da rodada 1 (nenhuma mudança de tela).
Tamanho: 31 arquivos contáveis (conferido pelo `git diff --name-only`), com o desvio registrado em "Correção da rodada 1"; a autorização do dono citada ali é de conversa que esta verificação não vê.
Instáveis: nenhum.
Achados:
- obrigatório: nenhum.
- sugestão, código, `frontend/src/features/data-security/DataSecurityPage.tsx` — mantida da rodada 1 (aviso de erro que reaparece depois de "Cancelar").

## Entrega

- O que muda: Administradores passam a exigir duas etapas quando a organização liga a opção (RN-ACE-24). O servidor grava a configuração (V60, `not null default false`), confere a permissão só do Coordenador, desconecta Administradores sem duas etapas ao ligar e registra na auditoria. O contrato (`docs/openapi.yaml`) e o MSW batem. A tela nova "Dados e segurança" tem a aba "Duas etapas" (ligar abre confirmação), e a matriz de permissões ganha a linha "Exigir duas etapas dos Administradores". Menu e rotas seguem o padrão de rotas e telas.
- Verificação: rodada 2 `OK` (estado `b13e3f8b`). `npm test` com 276 arquivos e 3071 testes verdes; `mvnw test` com 160 testes; ITs do item (`AdminTwoFactorPolicyIT`, `CoordinationTransferKeepUnitsIT`) com 12 testes; e2e `duas-etapas` com 2 passando; `visual:canvas` com 164 comparadas e nenhuma reprovada. Visual por caso fica para o CI do PR.
- Decisões: a confirmação usa o `ConfirmDialog`, que mantém a janela aberta quando o salvar falha. A aba "Em breve" usa a dica nativa (`title`), porque a lista de abas rola na horizontal. O IT usa sessões reais e código de reserva conhecido, sem calcular TOTP, e limpa com `truncate ... cascade`.
- Tamanho: 31 arquivos contáveis, acima do limite de 30. O desvio foi aceito na correção da rodada 1 pela autorização geral do dono dada na conversa (ver "Correção da rodada 1").
- Limitações: a sugestão de limpar o aviso de erro ao fechar a janela ("Cancelar") não foi aplicada; fica registrada na verificação.
