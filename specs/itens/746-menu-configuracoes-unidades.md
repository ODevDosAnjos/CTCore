# 746 — 625b · Menu de Configurações e Unidades abertas pela lista

Origem: issue #746 (parte b da #625; requisitos de partida em `specs/itens/625-configuracoes-quatro-itens-abas.md`). Branch: `item/746-menu-configuracoes-unidades`.

Tempos: especificar 3 · construir 45 (2 rodadas) · verificar 26 (regressão 22; 2 rodadas) · entregar 3
Comparação com o canvas: 4 min

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Para o Coordenador e o Administrador: a configuração de cada unidade passa a ser aberta pela lista de Unidades, em endereço próprio. O item "Unidade" sai do menu, o Administrador vê só as suas unidades (com uma, cai direto nela), e Assinatura e Dados e segurança aparecem "Em breve".

Fora do escopo: Organização em abas (#747; Modalidades, Faixas etárias, Termos e Textos continuam soltos no menu); abas Cobrança e Divulgação da unidade (#748; as abas atuais Dados, Pagamentos, Lembretes, Links e Permissões do Professor não mudam de nome, id nem conteúdo); Visão geral (#640); telas de Assinatura e de Dados e segurança.

## 2. Requisitos

- R1: o grupo Configurações do menu tem, nesta ordem, Organização, Unidades, Modalidades, Faixas etárias, Termos, Textos, Assinatura e Dados e segurança; saem "Unidade", Auditoria e Importar e exportar, e nenhum item aponta para endereço inexistente (RF-ORG-09; D1). A lista de `/configuracoes` segue o mesmo conjunto.
- R2: Assinatura (só o Coordenador) e Dados e segurança aparecem desabilitados com "Em breve" (RF-ORG-09).
- R3: cada unidade ativa é aberta pela lista em `/configuracoes/unidades/<id>`, dentro da moldura, com as abas atuais e a aba em `?aba=<id>`, com "Última alteração", `If-Match` e auditoria como hoje; a unidade mostrada e gravada é a do endereço (RF-ORG-04, RF-ORG-08; D2, D3). A tabela de permissões fica em `/configuracoes/unidades/<id>/permissoes` (D4).
- R4: o Administrador tem o item Unidades e vê na lista só as suas unidades, sem "Nova unidade" nem "Desativar"; com uma unidade só, e ativa, o item abre direto a configuração dela. O Coordenador vê a lista de todas, como hoje (RF-ORG-02; D5, D6).
- R5: `/configuracoes/unidade` e `/configuracoes/unidade/permissoes` (e o antigo `/configuracoes/usuarios/permissoes`) levam aos endereços novos, mantendo `?aba=` (D7).
- R6: o servidor é a barreira: a lista devolve ao Administrador só as unidades dele; ler ou alterar unidade que não é dele é recusado; unidade de outra organização responde 404; Professor e portal são recusados (RF-ORG-02).
- R7: as telas mexidas seguem o padrão de rotas e telas (RNF-56), mantêm os quatro estados, funcionam a partir de 360 px, passam no axe nos dois temas, têm textos em pt-BR, casos do teste visual e comparação com o canvas (decisões 19 a 23 de `docs/auditoria/decisoes-canvas.md`).

## 3. Critérios de aceite

- CA1 (R1): dado um Coordenador, quando abre o grupo Configurações, então vê os oito itens do R1, na ordem; todo item habilitado abre uma tela existente; `/configuracoes` mostra o mesmo conjunto que o perfil tem no menu.
- CA2 (R2): dado um Coordenador, quando vê o menu, então Assinatura e Dados e segurança estão desabilitados "Em breve"; dado um Administrador, então Dados e segurança está "Em breve" e Assinatura não aparece; dado um Professor, então o grupo não aparece.
- CA3 (R3): dado a lista, quando o usuário clica em "Abrir" numa unidade ativa que não é a primeira, então o endereço é `/configuracoes/unidades/<id dela>`, a tela mostra essa unidade na moldura, com "Última alteração"; trocar de aba grava `?aba=`, que sobrevive ao recarregar; salvar envia o `PUT` dessa unidade com `If-Match`.
- CA4 (R3): dado a configuração de uma unidade aberta, quando o usuário escolhe outra no seletor do topo, então o endereço e a tela passam a ser os dela, na mesma aba; quando escolhe "Todas as unidades", então volta à lista.
- CA5 (R3): dado a aba Permissões do Professor, quando segue "Ver tabela de permissões", então chega a `/configuracoes/unidades/<id>/permissoes`, e "Voltar à unidade" volta a `/configuracoes/unidades/<id>`; o link "Abrir a unidade" de Nova unidade leva ao endereço novo.
- CA6 (R4): dado um Administrador de uma unidade ativa, quando abre Unidades, então cai na configuração dela, sem a lista no histórico; dado um de duas ou mais, então vê a lista só com as dele, com "Abrir" e sem "Nova unidade" nem "Desativar"; dado um Coordenador com uma unidade só, então vê a lista.
- CA7 (R5): dado `/configuracoes/unidade?aba=payments`, quando há unidade escolhida no topo, então abre `/configuracoes/unidades/<id>?aba=payments`; com `?unidade=<id>`, abre essa; com "Todas as unidades", leva à lista (e dali o Administrador de uma unidade cai nela). Dado `/configuracoes/unidade/permissoes` ou `/configuracoes/usuarios/permissoes`, então abre a tabela no endereço novo, também com "Todas as unidades".
- CA8 (R6): dado um Administrador ligado a uma de duas unidades, quando chama `GET /api/v1/units`, então recebe só a dele; ler ou alterar a outra responde 403; unidade de outra organização responde 404 na leitura e na gravação; `POST /api/v1/units`, desativação e ajuste do nome curto continuam 403 para ele; Professor e portal recebem 403 na lista.
- CA9 (R7): dado a lista e a configuração da unidade, quando exibidas a 360 px e nos dois temas, então não há rolagem horizontal da página nem violação do axe; `shell.test.ts`, `noInternalAnchors.test.ts` e `routePattern.test.ts` passam e há e2e da unidade abrindo pela lista dentro da moldura.
- CA10 (R7): dado os casos visuais das telas mexidas, quando a comparação com o canvas é feita (1440 e 390 px, pt-BR), então há capturas em `.capturas/746/` e o PR lista as divergências que vêm das decisões do dono; as referências afetadas pela mudança do menu foram regeradas e listadas no PR.

## 4. Plano técnico

- Dados: não muda.
- API: só `GET /api/v1/units` muda. Em `backend/src/main/java/br/com/ctcore/organization/UnitList.java`, `list` deixa de chamar `requireFull`: recusa (403) o papel cuja linha `UNIT_SETTINGS` na `PermissionTable` é `NONE` (Professor, portal, sem organização; mesmo critério de `UnitSettings.requireRole`) e filtra as linhas por `permissions.grant(who, Permission.UNIT_SETTINGS, id) != Access.NONE` (mesmo filtro de `UnitSettings.mine`). `UnitSummary` não muda. `adjustShortName`, criação e desativação continuam exigindo `UNITS` FULL; `PermissionTable` não muda. Leitura e gravação de uma unidade (`UnitSettings`) já recusam 403/404: só conferir com IT. Em `docs/openapi.yaml`, atualizar `summary` e `description` de `get /units`.
- Interface:
  - `frontend/src/routes.ts`: `units` passa a permissão `UNIT_SETTINGS` (`newUnit` segue `UNITS`); `unitSettings` vira `sub` de `units` em `/configuracoes/unidades/:id` (sem `parent`: é tela inteira, como no canvas); `permissionsTable` em `/configuracoes/unidades/:id/permissoes` (`menu: "units"`, mantém `trail`); novas `sub` `unitLegacy` (`/configuracoes/unidade`) e `permissionsTableLegacy` (`/configuracoes/unidade/permissoes`), com tela e não `redirect`, porque o destino depende da unidade; `permissionsTableOld` mantém o `redirect` (cai na legada), com `menu: "units"`. `subscription` continua `soon`; saem `audit`, `import`, `exportFull` e `support`, e entra `m("dataSecurity", "/configuracoes/dados-e-seguranca", "AUDIT", "settings", "ScrollText", "soon")` por último. Ordem das linhas: organização, unidades, modalidades, faixas, termos, textos, assinatura, dados e segurança.
  - `frontend/src/features/permissions/buildMenu.ts`: o filtro também tira o nível `NOTICE` (só o Administrador em Assinatura, que é a faixa de aviso, não o item).
  - A criar `frontend/src/features/units/LegacyUnitRedirect.tsx` (nome sem `Page`, por causa do `shell.test.ts`): espera o `useUnitScope` (`LoadingState`); alvo = `?unidade=` ou `scope.selected` diferente de `ALL`; `<Navigate replace>` para `hrefOf(...)` com a busca sem `unidade`. Sem alvo: configuração vai para a lista; permissões usam `scope.units[0]` (a tabela é igual em todas) e, sem nenhuma, a lista. Erro e 403 do escopo: `ErrorState`/`ForbiddenState`.
  - `frontend/src/App.tsx` (`screens`): `unitLegacy` e `permissionsTableLegacy`.
  - `UnitSettingsPage.tsx` (`Content`): o id vem de `useParams`; saem os ramos por `scope.selected` (vazio e "Todas as unidades" com banner). Sincronia com o seletor (D3): quando o escopo está pronto e o id está em `scope.units`, `scope.select(id)` uma vez por id; depois disso, se `scope.selected` mudar, `navigate` para a outra unidade (mantendo a busca, `replace`) ou, em `ALL`, para a lista. Unidade desativada não está no escopo: não sincroniza. 403 e 404 seguem em `ForbiddenState` (`useUnitDetail`). Remover do pt-BR as chaves que ficarem sem uso (`unitScope.chooseToEdit`, `unitSettings.emptyTitle`/`emptyText`).
  - `UnitTeacherTab.tsx`: o link vira relativo ou usa o id, para o endereço novo (teste confere o `href`). `PermissionsTablePage.tsx`: "Voltar à unidade" usa `hrefOf("unitSettings", { id })` com o id de `useParams`.
  - `UnitsPage.tsx`: "Abrir" usa `hrefOf("unitSettings", { id: u.id })`; pelo papel da sessão (`useSession`), o Administrador não vê "Nova unidade", o aviso de limite nem os botões "Desativar"; Administrador com exatamente uma unidade ativa na resposta: `<Navigate replace>` para ela. Os quatro estados continuam.
  - `NewUnitPage.tsx`: "Abrir a unidade" no endereço novo.
  - `SettingsIndexPage.tsx`: `ORDER` = organizationSettings, units, modalities, ageRanges, terms, texts, subscription, dataSecurity; em `pt-BR.json`, `settingsIndex.items` e `menu.items` ganham `units`/`subscription`/`dataSecurity` ("Dados e segurança") conforme faltar e perdem `unitSettings`, `audit` e `import` (em `menu.items`, também `exportFull` e `support`). Conferir antes que nenhuma outra tela usa essas chaves.
  - `frontend/src/mocks/handlers.ts`: `get /units` devolve ao Administrador só a `ADMIN_UNIT` (Coordenador, tudo; demais, 403); `post` continua com `unitsAccess`.
  - `OverduePage.tsx` não muda: o link "Configurar" passa pela legada, que já escolhe a unidade (D7).
- Segurança: filtro no código (`organization_id` + vínculo) sobre a RLS já existente; o front esconder botões não é barreira. A lista dá ao Administrador nomes de outros Administradores só das unidades dele. Leitura, sem auditoria nova.
- Arquivos a alterar (contáveis, cerca de 27): `UnitList.java`, `UnitListIT.java`; `routes.ts`, `App.tsx`, `buildMenu.ts`, `UnitsPage.tsx`, `UnitSettingsPage.tsx`, `UnitTeacherTab.tsx`, `PermissionsTablePage.tsx`, `NewUnitPage.tsx`, `SettingsIndexPage.tsx`, `handlers.ts`, `pt-BR.json`; testes `routes.test.ts`, `buildMenu.test.ts`, `SettingsIndexPage.test.tsx`, `UnitsPage.test.tsx`, `UnitSettingsPage.test.tsx`, `UnitTeacherTab.test.tsx`, `PermissionsTablePage.test.tsx`, `NewUnitPage.test.tsx`; e2e `configuracao-unidade.spec.ts`, `unidades.spec.ts`, `estado-no-endereco.spec.ts`, `modalidades.spec.ts`; `visual/casos.ts` (e `visual/telas.visual.ts` só se o id da unidade do cenário precisar ser fixado). A criar: `LegacyUnitRedirect.tsx`. Fora da contagem: `docs/openapi.yaml`, referências visuais.
- Reuso: `UnitSettings.mine` como modelo do filtro, `UnitBase` (`list`, `addUnit`, `read`, `put`), `hrefOf`, `useUnitScope`, itens `soon` do menu.
- Riscos: laço entre a sincronia do seletor e o endereço (teste de CA4 e CA3 com a segunda unidade); testes que abrem `/configuracoes/unidade` seguem passando pela legada e escondem endereço velho (os testes e e2e das telas mexidas passam a abrir o novo); `routes.test.ts` tem a tabela `legacy`, em que `units` deixa de ser só do Coordenador; nos casos visuais a rota passa a ter o id da unidade, e o cenário `unidadeCanvas` de `telas.visual.ts` monta a "Tijuca" a partir de uma "Unidade Sul" do alcance: conferir que o id é fixo e, se não for, fixá-lo no override.

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

Parte 1 (servidor, endereços e menu):

- [x] T1: `GET /units` para o Administrador só com as suas unidades (`UnitList.list`), contrato no OpenAPI e MSW; em `UnitListIT`, casos de isolamento entre organizações e perfis — cobre CA8 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=UnitListIT -Djacoco.skip=true` e `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`
- [x] T2: mapa de rotas, menu (`buildMenu` sem `NOTICE`, Dados e segurança), lista de `/configuracoes` e textos — cobre CA1, CA2 — prova: em `frontend/`, `npx vitest run src/routes.test.ts src/features/permissions/buildMenu.test.ts src/features/units/SettingsIndexPage.test.tsx src/test/routePattern.test.ts`

Parte 2 (telas):

- [x] T3: configuração da unidade pelo endereço, sincronia com o seletor, tabela de permissões, `LegacyUnitRedirect` (testado em `UnitSettingsPage.test.tsx` e `PermissionsTablePage.test.tsx`) e links de Nova unidade e Permissões do Professor — cobre CA3, CA4, CA5, CA7 — prova: em `frontend/`, `npx vitest run UnitSettingsPage PermissionsTablePage UnitTeacherTab NewUnitPage OverduePage`
- [x] T4: lista de Unidades por perfil, "Abrir" no endereço novo e entrada direta do Administrador de uma unidade — cobre CA6 — prova: em `frontend/`, `npx vitest run UnitsPage`

Parte 3 (ponta a ponta e visual):

- [x] T5: e2e: unidade aberta pela lista dentro da moldura, Administrador caindo direto na dele (troca o trecho "Administrador sem acesso" de `unidades.spec.ts`), 360 px, e os specs que usam os endereços antigos — cobre CA3, CA6, CA9 — prova: em `frontend/`, `npm run e2e:full -- unidades configuracao-unidade estado-no-endereco modalidades` e `npm test -- shell noInternalAnchors routePattern`
- [x] T6: casos visuais das telas mexidas nos endereços novos; capturas e comparação com o canvas (`ConfigUnidades`, `ConfigUnidade`, abas, `PermissoesTabela`, `Sidebar`; 1440 e 390 px, pt-BR) em `.capturas/746/`, registrando `Comparação com o canvas: <min>`; como a moldura mudou, regerar as referências afetadas com `npm run test:visual:docker -- --update-snapshots --workers=2` e listá-las caso a caso, investigando mudança que o item não pede — cobre CA9, CA10 — prova: em `frontend/`, `npm run visual:canvas` e a lista das referências alteradas no `git status`

## 6. Decisões

- D1: até a #747 e a #640, o menu tem os soltos da Organização entre Unidades e Assinatura, sem Visão geral (a issue manda manter os soltos). Assim Organização, Unidades, Assinatura e Dados e segurança já ficam na ordem do RF-ORG-09. Os itens ocultos "Exportação completa" e "Acesso de suporte" saem do mapa por serem abas de Dados e segurança; essa entrada usa a permissão `AUDIT` (Coordenador e Administrador).
- D2: endereço `/configuracoes/unidades/<id>`, rota própria e não painel sobre a lista, porque o canvas `ConfigUnidade` é tela inteira. Alternativa: `?unidade=`, descartada por não ser o padrão de registro do RNF-56.
- D3 (muda o comportamento): o endereço define a unidade. Abrir uma unidade ativa também a escolhe no seletor do topo (RN-ORG-08: para alterar, entra numa unidade); trocar o seletor nessa tela leva à outra unidade, e "Todas as unidades" leva à lista. Edição não salva se perde na troca, como hoje. Alternativa: seletor sem efeito na tela, descartada porque mostraria uma unidade no topo e outra no conteúdo. Some o aviso "Escolha uma unidade no topo".
- D4: a tabela de permissões fica sob a unidade (`/<id>/permissoes`), para "Voltar à unidade" voltar à mesma. Alternativa: endereço único sem id.
- D5 (muda o comportamento): o Administrador passa a ter o item Unidades e a consultar a lista, só das suas (RF-ORG-02, decisão de 19/11/2026). A linha "Unidades" da tabela de permissões continua só do Coordenador e vale para criar, desativar e ajustar o nome curto; a lista passa a seguir "Configurações da unidade".
- D6 (muda o comportamento): a entrada direta é só do Administrador e conta as unidades da lista dele: exatamente uma, e ativa. Com uma ativa e outra desativada, ele vê a lista.
- D7: o endereço antigo usa `?unidade=` ou a unidade do seletor; sem nenhuma, vai à lista, porque escolher uma por ele poderia levar a alterar a unidade errada. Os ids das abas não mudam, então `?aba=` vale como está. Por isso o link "Configurar" de Cobranças em atraso não precisa mudar.
- D8: itens estimados em cerca de 27 arquivos contáveis, abaixo do limite de 30; as três partes das tarefas são só sessões de construção, com uma entrega.
- Suposição: a divergência com `ConfigUnidade` (trilha "Configurações › Unidade", perfil Administrador) e com o `Sidebar.dc.html`/`GMConfig.dc.html` (item "Unidade", lista de itens, "Assinatura e Unidades só para o Coordenador") vem da decisão 19 e do RF-ORG-02 e não é corrigida para o canvas.

## Construção

- T1 — arquivos: `UnitList.java`, `UnitListIT.java` (caso `administratorReach`), `UnitRouteIT.java`, `docs/openapi.yaml`, `mocks/handlers.ts` — prova: `verify ... -Dit.test=UnitListIT,UnitRouteIT -Djacoco.skip=true` → 7 testes, BUILD SUCCESS; `test -Dtest='OpenApiContractTest,ContractRoutesTest'` → 7 testes, BUILD SUCCESS
- T2 — arquivos: `routes.ts`, `buildMenu.ts`, `SettingsIndexPage.tsx`, `pt-BR.json`, `routes.test.ts`, `buildMenu.test.ts`, `SettingsIndexPage.test.tsx` — prova: `npx vitest run` dos 4 arquivos da tarefa → 63 passaram
- T3 — arquivos: `UnitSettingsPage.tsx`, `LegacyUnitRedirect.tsx` (novo), `UnitTeacherTab.tsx`, `PermissionsTablePage.tsx`, `NewUnitPage.tsx`, `App.tsx`, `pt-BR.json` e os testes `UnitSettingsPage`, `UnitTeacherTab`, `PermissionsTablePage`, `NewUnitPage` — prova: `npx vitest run UnitSettingsPage PermissionsTablePage UnitTeacherTab NewUnitPage OverduePage` → 87 passaram
- T4 — arquivos: `UnitsPage.tsx`, `UnitsPage.test.tsx` — prova: `npx vitest run UnitsPage` → 11 passaram
- T5 — arquivos: e2e `unidades.spec.ts` (abre pela lista na moldura, Administrador cai direto e a lista fica fora do histórico, 360 px), `configuracao-unidade.spec.ts`, `estado-no-endereco.spec.ts`, `modalidades.spec.ts` — prova: `npm run e2e:full -- unidades configuracao-unidade estado-no-endereco modalidades` → 12 passaram; `npm test -- shell noInternalAnchors routePattern` → 320 passaram
- T6 — arquivos: `visual/casos.ts` (casos da unidade e das permissões no endereço com o id fixo da Unidade Sul, `...023`; `telas.visual.ts` não mudou) — prova: `npm run test:visual:docker -- --update-snapshots --workers=2` → 664 passaram (25 min), 68 referências alteradas; `npm run visual:canvas -- --exige` → 165 comparadas, 0 reprovadas (telas da unidade, lista e permissões entre 1,1% e 7,2%)
- Capturas em `.capturas/746/` (pt-BR, tema claro): `-1440-sistema`, `-1440-canvas` e `-390-sistema` de `configuracoes-unidades`, `configuracoes-unidade`, `-pagamentos`, `-pagamentos-desconectado`, `-lembretes`, `-links`, `-professor`, `-modalidades-recusa` e `configuracoes-permissoes`; `sidebar-1440-{sistema,canvas}`; `configuracoes-1440-sistema`, `configuracoes-390-{sistema,canvas}` (canvas `GMConfig`, 360 px). Essas telas não têm canvas de 390 px.
- Divergências com o canvas vindas das decisões do dono (decisão 19, RF-ORG-02, D1 e D8), para o PR: o menu não tem "Unidade", "Usuários", "Auditoria" nem "Importar e exportar" (`Sidebar`, `ConfigUnidades`, `GMConfig`); Assinatura e Dados e segurança "Em breve"; a trilha de `ConfigUnidade` é "Configurações › Unidades" (o canvas mostra "Unidade" e perfil Administrador). O `Sidebar.dc.html` mostra o grupo recolhido; a lista de itens foi comparada com o menu aberto de `ConfigUnidades`. As demais diferenças das telas são anteriores ao item, que não muda o conteúdo delas. Nenhum `limiteCanvas` novo.
Testes do item: `npx vitest run` dos 12 arquivos (rotas, menu, índice, telas mexidas, `OverduePage`, `routePattern`, `shell`, `noInternalAnchors`) → 423 passaram; `npm run lint` e `npm run typecheck` → sem erros; ITs, contrato e e2e como acima
Regressão: não roda nesta fase (é da verificação)
Desvios:
- `UnitRouteIT.java`, fora da lista do plano: exigia 403 do Administrador em `GET /units`; agora espera 200 no GET e mantém 403 no PATCH.
- `NewUnitPage.tsx` também recarrega o seletor do topo (`scope.retry()`) depois de criar: sem isso a unidade nova não estava no escopo e "Abrir a unidade" mostraria uma unidade no topo e outra na tela (D3).
- `PermissionsTablePage.test.tsx` cobre as duas legadas da tabela em "Todas as unidades"; os casos de `?aba=` e `?unidade=` da legada de configuração estão em `UnitSettingsPage.test.tsx`.
- Contáveis: 29 arquivos (limite 30).
Referências visuais: 68 arquivos em `frontend/visual/referencias`, todos de casos `configuracoes*`; nenhuma outra tela mudou (o grupo Configurações só fica aberto nelas).
- 1440 px, claro e escuro (menu novo), 25 casos: `configuracoes`, `-faixa-nova`, `-faixas-etarias`, `-modalidade-desativar`, `-modalidades`, `-modalidades-administrador`, `-modalidades-graduacao`, `-modalidades-pedido`, `-organizacao`, `-organizacao-contraste`, `-permissoes`, `-termos`, `-textos`, `-transferir-coordenacao`, `-unidade`, `-unidade-desativar`, `-unidade-lembretes`, `-unidade-links`, `-unidade-modalidades-recusa`, `-unidade-nova`, `-unidade-pagamentos`, `-unidade-pagamentos-desconectado`, `-unidade-professor`, `-unidade-unica`, `configuracoes-unidades`.
- 390 px, claro e escuro: `configuracoes` (lista nova) e `-permissoes`, `-unidade`, `-unidade-lembretes`, `-unidade-links`, `-unidade-modalidades-recusa`, `-unidade-pagamentos`, `-unidade-pagamentos-desconectado`, `-unidade-professor` (o título da barra do topo vem do item do menu, agora "Unidades").
- Docker: container do teste visual com `--rm`; a lista de imagens ficou igual à de antes.

### Correção da rodada 1
- `#746` lido como cor fixa por `telasCanvas419.test.ts` — arquivos: `LegacyUnitRedirect.tsx`, `UnitSettingsPage.tsx`, `UnitsPage.tsx` (só os comentários, agora "item 746") — prova: `npx vitest run telasCanvas419` (nos 19 arquivos abaixo) → passou
- contrato do MSW desatualizado — arquivo: `src/mocks/units.msw.test.ts` (Administrador: 200 na lista só com a unidade dele e 403 no ajuste; Professor e portal: 403 nos dois) — prova: `npx vitest run units.msw` → passou
- CA14 de desativação desatualizado — arquivo: `DeactivateUnitDialog.test.tsx` (Administrador com duas unidades vê a lista, sem botão "Desativar") — prova: `npx vitest run DeactivateUnitDialog` → passou
- Testes do item, com os três arquivos da rodada: `npx vitest run` (rotas, menu, índice, telas mexidas, `OverduePage`, `routePattern`, `shell`, `noInternalAnchors`, `telasCanvas419`, `units.msw`, `DeactivateUnitDialog`) → 19 arquivos, 556 passaram; `npm run lint` e `npm run typecheck` → sem erros. Sem mudança visual, de back-end ou de e2e: referências, ITs e e2e não foram rodados de novo
- Contáveis: 30 arquivos (limite 30). A sugestão opcional da rodada (layout de Lembretes e Pagamentos a 390 px) não foi tratada

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 27/11/2026, estado e1a7f07164a4cb9b71d489a61a9e3d7b831b1a13

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `buildMenu.test.ts`, `SettingsIndexPage.test.tsx` e `routes.test.ts` no `npm test` (passaram); capturas do menu aberto |
| CA2 | PASSOU | mesmos testes (Coordenador, Administrador sem Assinatura); capturas com Assinatura e Dados e segurança desabilitados |
| CA3 | PASSOU | `UnitSettingsPage.test.tsx` "#746 CA3" (segunda unidade, `PUT` dela com `If-Match`); e2e `unidades` e `estado-no-endereco` (aba após recarregar) |
| CA4 | PASSOU | `UnitSettingsPage.test.tsx`, os dois casos "#746 CA4" |
| CA5 | PASSOU | `UnitTeacherTab`, `PermissionsTablePage` e `NewUnitPage` `.test.tsx` conferem os três `href` |
| CA6 | PASSOU | `UnitsPage.test.tsx` "#746 CA6"; e2e `unidades` (Administrador cai direto, lista fora do histórico) |
| CA7 | PASSOU | `UnitSettingsPage.test.tsx` "#746 CA7" (3 casos) e `PermissionsTablePage.test.tsx` (2 endereços antigos em "Todas as unidades") |
| CA8 | PASSOU | `UnitListIT` e `UnitRouteIT` → 7 testes, BUILD SUCCESS |
| CA9 | PASSOU | axe a 360 px nos dois temas em `UnitsPage`/`UnitSettingsPage` `.test.tsx`; `shell`, `noInternalAnchors`, `routePattern` passaram; e2e 360 px e unidade na moldura passou |
| CA10 | PASSOU | capturas de `.capturas/746/` abertas e comparadas (as 32); diferenças de menu e trilha vêm das decisões; 68 referências, todas `configuracoes*`, listadas em "Construção" (a lista no PR é da entrega). Visual: no CI do PR |

Comandos (regressão local reduzida, inteira):
- `mvnw test` → 164 testes, BUILD SUCCESS; `verify -Dit.test=UnitListIT,UnitRouteIT -Djacoco.skip=true` → 7 testes, BUILD SUCCESS
- `npm run lint`, `typecheck`, `build` → ok
- `npm test` → **falhou: 5 de 3064 testes, em 3 de 277 arquivos**
- os 3 arquivos, 3 vezes com `--maxWorkers=2` → 5 falhas nas 3 execuções (falha real, não instável)
- `npm run e2e:full -- unidades configuracao-unidade estado-no-endereco modalidades` → 12 passaram (inclui o de 360 px, que não é `@critical`)

Achados:
- obrigatório, código, comentários com `#746` em `frontend/src/features/units/LegacyUnitRedirect.tsx:6`, `UnitSettingsPage.tsx:241` e `UnitsPage.tsx:36` — esperado: `src/features/telasCanvas419.test.ts` verde; observado: 3 falhas "não usa cor fixa nem campo solto", porque a expressão de cor fixa (`#[0-9a-fA-F]{3,8}`) lê `#746` como cor; evidência: `npm test` e `grep` nas três linhas; corrigir: tirar o `#` do número nesses comentários (ex.: "item 746"), sem mexer no teste.
- obrigatório, código, `frontend/src/mocks/units.msw.test.ts:51` ("Administrador, Professor e portal recebem 403 na lista e no ajuste") — esperado: teste de contrato do MSW de acordo com o R4/R6; observado: `expected 200 to be 403` na lista do Administrador; corrigir: Administrador recebe 200 na lista, só com a `ADMIN_UNIT`, e continua 403 no ajuste; Professor e portal continuam 403 nos dois.
- obrigatório, código, `frontend/src/features/units/DeactivateUnitDialog.test.tsx:177` ("CA14: o Administrador não vê o botão") — esperado: teste de acordo com o R4; observado: procura "Esta área não está disponível para o seu perfil", que o Administrador não recebe mais; corrigir: esperar a lista (com duas ou mais unidades, ou uma ativa e outra desativada) e manter a conferência de que não há botão "Desativar".
- Com esses dois testes, os arquivos contáveis vão de 28 (contados no diff deste estado) para 30, no limite.
- sugestão, código, anterior ao item (a referência da base `7c8a3ce7` é igual) — a 390 px, na aba Lembretes o texto de cada linha quebra palavra a palavra e fica por baixo de "E-mail"; em Pagamentos desconectado o selo "Desconectado" encosta no botão "Reconectar". Não é deste item (que não muda as abas); busca nas issues abertas não achou o assunto: candidato à Dívida técnica ou comentário na #748.

### Rodada 2 — OK — 27/11/2026, estado 3c4506b9a343f67eeff81552aa18b0a7b9b1ba09

Lido só o que mudou desde o estado `e1a7f07164a4`: três comentários ("item 746"), `units.msw.test.ts` e `DeactivateUnitDialog.test.tsx`. O código de produção não mudou de comportamento.

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | mantido da rodada 1; testes passaram de novo no `npm test` |
| CA2 | PASSOU | mantido da rodada 1; testes passaram de novo no `npm test` |
| CA3 | PASSOU | mantido da rodada 1; `npm test` e e2e passaram de novo |
| CA4 | PASSOU | mantido da rodada 1; `npm test` passou de novo |
| CA5 | PASSOU | mantido da rodada 1; `npm test` passou de novo |
| CA6 | PASSOU | `UnitsPage.test.tsx` e `DeactivateUnitDialog.test.tsx` (Administrador com duas unidades vê os dois "Abrir" e nenhum "Desativar") no `npm test`; e2e `unidades` |
| CA7 | PASSOU | mantido da rodada 1; `npm test` passou de novo |
| CA8 | PASSOU | `UnitListIT` e `UnitRouteIT` → 7 testes, BUILD SUCCESS; `units.msw.test.ts` confere o mesmo no MSW (200 só com a própria unidade e 403 no ajuste; Professor e portal 403) |
| CA9 | PASSOU | mantido da rodada 1; `npm test` e e2e passaram de novo |
| CA10 | PASSOU | mantido da rodada 1 (nada visual mudou). Visual: no CI do PR |

Os três achados obrigatórios da rodada 1 estão corrigidos (`telasCanvas419`, `units.msw` e `DeactivateUnitDialog` verdes), sem enfraquecer teste.

Comandos (regressão local reduzida, inteira):
- `mvnw test` → 164 testes, BUILD SUCCESS; `verify -Dit.test=UnitListIT,UnitRouteIT -Djacoco.skip=true` → 7 testes, BUILD SUCCESS
- `npm run lint`, `typecheck`, `build` → ok
- `npm test` → 277 arquivos, 3064 testes, todos passaram
- `npm run e2e:full -- unidades configuracao-unidade estado-no-endereco modalidades` → 12 passaram
- Docker: lista de imagens igual à de antes. Arquivos contáveis: 30 (no limite, sem passar)

Instáveis: nenhum.

Achados:
- sugestão, código, anterior ao item (mantida da rodada 1) — a 390 px, na aba Lembretes o texto das linhas quebra palavra a palavra sob "E-mail", e em Pagamentos desconectado o selo encosta em "Reconectar"; candidato à Dívida técnica ou comentário na #748.

## Entrega

O que muda: a lista de unidades (`UnitsPage`) abre a configuração da unidade pelo endereço da própria unidade (rota da moldura), e o Administrador com uma só unidade ativa cai direto nela, sem passar pela lista no histórico. O menu de Configurações (`SettingsIndexPage`, `buildMenu`) lista só o que existe hoje; Assinatura e Dados e segurança aparecem desabilitados com "Em breve". A tabela de permissões, a aba do professor e Nova unidade apontam para os endereços novos; os endereços antigos de unidade viram `LegacyUnitRedirect`. No back-end, `UnitList` respeita o perfil (Administrador vê só a própria unidade na lista e recebe 403 no ajuste).

Verificação: rodada 2 OK (estado `3c4506b9a343f67eeff81552aa18b0a7b9b1ba09`). `npm test` 277 arquivos e 3064 testes; `mvnw test` 164 testes; IT de unidade 7 testes; e2e `unidades`, `configuracao-unidade`, `estado-no-endereco` e `modalidades` com 12 passando, incluindo o de 360 px. Capturas em `.capturas/746/` comparadas com o canvas; sem `limiteCanvas` novo. As referências visuais `configuracoes*` foram regeradas e listadas em "Construção". A suíte visual inteira roda só no CI.

Decisões: divergências de menu e de trilha com o canvas vêm das decisões do dono (decisão 19, RF-ORG-02, D1 e D8), listadas em "Construção".

Limitações: a 390 px, na aba Lembretes o texto das linhas quebra palavra a palavra sob "E-mail" e em Pagamentos desconectado o selo encosta em "Reconectar". Já existia antes do item (mesma base `7c8a3ce7`), não muda com ele; candidato à Dívida técnica ou comentário na #748.
