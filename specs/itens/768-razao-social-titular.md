# 768 — 636a · Razão social da unidade e nome do titular

Origem: issue #768 (parte a da #636; RN-MAT-21, RF-ORG-01, RF-ORG-04, RNF-56). Branch: `item/768-razao-social-titular`.

Tempos: especificar 2 · construir 27 · verificar 17 (regressão 15) (1 rodada) · entregar 3

Comparação com o canvas: 4

<!-- Fase 2: especificação. Item-mãe: `specs/itens/636-termo-dados-unidade.md` (P19, D1 de lá); entra no commit deste item. -->

## 1. Objetivo

Guardar os dois dados que a RN-MAT-21 usa e hoje não existem: a razão social da unidade e o nome (ou razão social) do titular da organização. A academia os informa em Unidade › Dados e em Organização › Geral; a #769 os usa no termo de matrícula.

Fora do escopo: campos automáticos no termo, prévia, termo preenchido no portal e texto no aceite (#769); usar os dados novos no recibo ou em outra tela; mover o titular para Assinatura; site, redes sociais e e-mail de faturas.

## 2. Requisitos

- R1 (RN-MAT-21, RF-ORG-04): a unidade tem razão social opcional, de até 160 caracteres, gravada e relida em Unidade › Dados.
- R2 (RN-MAT-21, RF-ORG-01): Organização › Geral tem os campos opcionais "Titular (razão social ou nome)", de até 160 caracteres, e "CNPJ ou CPF do titular" (o documento que já existe).
- R3 (issue #768): mudar a razão social ou o nome do titular grava na auditoria o antes e o depois; o documento do titular continua mascarado.
- R4 (issue #768): quem altera não muda. Razão social: quem pode editar a unidade; titular: só o Coordenador. Os demais perfis e outra organização são recusados sem efeito.
- R5 (RNF-56, AGENTS.md): as duas telas mantêm os quatro estados, funcionam a 360 px, passam no axe nos dois temas e seguem o padrão de rotas e telas; textos em `pt-BR.json`; comparação com o canvas.
- R6 (issue #768): migração, API, `docs/openapi.yaml`, MSW, seed e `01-organizacao-e-isolamento.md` mudam junto.

## 3. Critérios de aceite

- CA1 (R1, R3): dado quem pode editar a unidade, quando grava a razão social com espaços nas pontas, então a leitura devolve o valor aparado e `unit.update` registra antes e depois; vazio, só espaços, nulo ou campo omitido no PUT apagam (nulo); gravar o mesmo valor não gera auditoria.
- CA2 (R2, R3): dado o Coordenador, quando grava nome e documento do titular, então a leitura devolve os dois e `organization.update` registra antes e depois do nome e o documento mascarado; vazio, nulo ou omitido no PATCH apagam; um não exige o outro; mudar só o nome sobe a versão, e repetir o valor não sobe nem audita.
- CA3 (R1, R2): dado um valor com 161 caracteres, quando grava, então 400 `VALIDATION_ERROR` no campo `legalName` ou `holderName`, e nada é salvo nem auditado; com 160, grava; o banco também recusa texto vazio ou acima de 160.
- CA4 (R4): dado Professor, perfil de portal, Administrador de outra unidade (razão social) ou Administrador (titular), quando grava, então 403; unidade de outra organização responde 404; o PATCH de uma organização não altera a outra. Em todos os casos nada muda nem é auditado.
- CA5 (R1, R2, R5): dada a tela, quando a pessoa edita os campos e salva, então reabre com os valores; o erro 400 do servidor aparece no campo; a janela de conflito (409) lista a diferença dos campos novos; o Administrador vê os dois campos do titular desabilitados.
- CA6 (R5): dadas Organização › Geral e Unidade › Dados, então abrem dentro da moldura (e2e), os casos `configuracoes-organizacao` e `configuracoes-unidade` mostram os campos, passam no axe nos dois temas, funcionam a 360 px e foram comparados com `ConfigAcademia` e `ConfigUnidade` (1440 e 390 px, pt-BR); `shell.test.ts`, `noInternalAnchors.test.ts` e `routePattern.test.ts` verdes.
- CA7 (R6): o contrato descreve `legalName` e `holderName`, o MSW os valida, grava e devolve como o servidor, o seed aplica sem sobrescrever valor existente e a especificação cita os dois dados.

## 4. Plano técnico

- Dados: `V64__unit_legal_name_organization_holder_name.sql` (a criar): `unit.legal_name text` e `organization.holder_name text`, nulos, cada um com `check (char_length(...) between 1 and 160)`. Sem preenchimento retroativo. As permissões e a RLS das duas tabelas já valem para colunas novas. Reversão (comentário na migração): `drop column` das duas.
- API: nenhuma rota nova. `UnitDetail` e `UnitUpdate` ganham `legalName`; `OrganizationView` e `OrganizationUpdateRequest` ganham `holderName`. Nas respostas são obrigatórios e anuláveis; na escrita, opcionais, `maxLength: 160`, aparados, e omitido apaga (como o PUT e o `holderDocument` hoje). Sem caracteres exigidos além do tamanho. Mensagem: "no máximo 160 caracteres".
- Servidor:
  - `UnitUpdate`: componente `legalName` logo depois de `cnpj`; `validated()` apara, anula vazio e limita (mesma regra de `NewUnit.limited`, que passa a ser visível no pacote).
  - `UnitSettings`: `UnitDetail` (e `with`), `SELECT` (coluna nova no fim, para não deslocar os índices usados em `detail`), `update unit set ... legal_name`, `flat()`. `legalName` fica fora de `HIDDEN` (D3).
  - `OrganizationProfile`: `OrganizationView`, `Row`, `row()`, `update(...)` (parâmetro `holderName`, limite com `ApiValidationException("holderName", ...)`, `update organization set ... holder_name`), `view()` e `auditValues` (nome sem máscara). `setLogo` não muda.
  - `OrganizationController.UpdateRequest` e a chamada de `update`.
- Interface:
  - Unidade › Dados: `useUnitSettings.ts` (`UnitDetail`; `UnitUpdate` herda), `unitDraft.ts` (`Draft`, `toDraft`, `toBody`), `UnitDataTab.tsx` (campo "Razão social (opcional)", linha inteira depois de Nome e CNPJ, `maxLength={160}`, `errors.legalName`), `UnitSettingsPage.tsx` (linha em `differences`; `tabOfServerField` já leva à aba Dados), `unitTabKit.tsx` (`legalName: null`).
  - Organização › Geral: `useOrganization.ts` (`OrganizationView`, `OrganizationUpdate`), `BrandCard.tsx` (o campo de rótulo "Titular (razão social ou nome)" passa a ser o do nome, texto livre, `maxLength={160}`; o do documento, com a máscara e o erro atuais, ganha o rótulo "CNPJ ou CPF do titular"), `OrganizationSettingsPage.tsx` (estado, `dirty`, `discard`, `submit`, `reload`, `differences`).
  - `i18n/pt-BR.json`: `organization.holder` mantém o texto (agora do nome); novas `organization.holderDocument` e `unitSettings.legalName`. Chaves de erro atuais ficam.
- MSW: `mocks/handlers.ts` (`initialOrganization`, PATCH `/organization`, `makeUnitDetail`, PUT `/units/{id}`): aparar, anular vazio, recusar acima de 160 no campo; o nome do titular entra na comparação de mudança.
- Teste visual: `visual/telas.visual.ts`, nos overrides `organizacaoCanvas` (`holderName: "Leão Artes Marciais Ltda."`, o valor do canvas) e `unidadeCanvas` (`legalName` fictício). Os casos já existem em `casos.ts`. Referências que mudam: `configuracoes-organizacao`, `configuracoes-transferir-coordenacao` (a tela fica atrás da janela), `configuracoes-unidade` e `configuracoes-unidade-modalidades-recusa`; a moldura não muda. Os dois primeiros e o terceiro não têm `limiteCanvas`; se o campo a mais fizer `visual:canvas` passar do padrão, vale o item 4 da "Autonomia".
- Seed: `infra/seed/26-razao-social-titular.sql` (a criar), só dados fictícios: titular (nome e documento) da organização 1, se os dois estiverem nulos; CNPJ de teste e razão social da unidade `mare-alta-botafogo`, se os dois estiverem nulos. As outras unidades ficam sem CNPJ, o caso do titular na #769.
- Especificação: `docs/especificacao/01-organizacao-e-isolamento.md`: "Dados" (nome ou razão social do titular na organização; razão social opcional, até 160, na unidade), RF-ORG-01 (os dois campos do titular na aba Geral) e RF-ORG-04 (razão social na aba Dados).
- Contrato: `docs/openapi.yaml`, os quatro esquemas e as descrições de PATCH `/organization` e PUT `/units/{id}`.
- Segurança: permissões, filtro por organização, RLS e `If-Match` não mudam; entrada limitada no servidor e no banco; SQL parametrizado; saída escapada pelo React. O nome do titular pode ser de pessoa física: não entra em log, e testes e seed usam só dados fictícios.
- Arquivos contáveis: cerca de 28 (limite 30): os acima, mais os testes `UnitUpdateValidationTest` (construtor posicional), `UnitSettingsIT`, `OrganizationProfileIT` (os dois têm a lista exata de chaves), `UnitSettingsPage.test.tsx`, `BrandCard.test.tsx`, `OrganizationSettingsPage.test.tsx` (usa o rótulo antigo para o documento), `TransferCoordinationDialog.test.tsx` (fixture), `unit-settings.msw.test.ts`, `organization.msw.test.ts`, `e2e/organizacao.spec.ts` e `e2e/configuracao-unidade.spec.ts`.
- Reuso: `NewUnit.limited`, `Text`/`Field`/`Input`, auditoria e conflito de edição existentes.
- Riscos: coluna nova no meio do `SELECT` de `UnitSettings` trocaria valores (coberto pela leitura em `UnitSettingsIT`); cliente que omita o campo apaga o valor (só o front grava, e envia tudo).

Partes de construção: A (T1, T2), servidor; B (T3, T4), telas e MSW; C (T5, T6), seed, documentos e visual.

## 5. Tarefas

- [x] T1: migração `V64`; razão social em `UnitUpdate`, `NewUnit.limited` e `UnitSettings`, com testes (gravar, reler, apagar, 160/161, check do banco, auditoria, recusas de CA4 com o campo) — cobre CA1, CA3, CA4 — prova: `./backend/mvnw -f backend/pom.xml test -Dtest=UnitUpdateValidationTest` e `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=UnitSettingsIT -Djacoco.skip=true`
- [x] T2: nome do titular em `OrganizationProfile` e `OrganizationController`, e os quatro esquemas e descrições em `docs/openapi.yaml`, com os mesmos casos em `OrganizationProfileIT` — cobre CA2, CA3, CA4, CA7 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=OrganizationProfileIT -Djacoco.skip=true` e `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`
- [x] T3: campo na aba Dados da unidade (tipos, rascunho, tela, conflito, `unitTabKit`, texto) e MSW da unidade, com testes — cobre CA1, CA3, CA5, CA7 — prova (em `frontend/`): `npm test -- UnitSettingsPage unit-settings.msw`
- [x] T4: os dois campos do titular em Organização › Geral (tipos, `BrandCard`, página, conflito, texto, fixtures) e MSW da organização, com testes (Administrador em leitura) — cobre CA2, CA3, CA5, CA7 — prova (em `frontend/`): `npm test -- features/organization organization.msw` e `npm run lint && npm run typecheck`
- [x] T5: seed `26-razao-social-titular.sql` e `01-organizacao-e-isolamento.md` — cobre CA7 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=SeedDataIT -Djacoco.skip=true`
- [x] T6: preencher os campos nos dois e2e (reabrir e conferir, dentro da moldura, sem rolagem a 360 px) e nos overrides do teste visual; salvar as capturas do sistema e do canvas (1440 e 390 px, pt-BR, temas em que o canvas existe) em `.capturas/768/`, rodar `visual:canvas` e regerar só as quatro referências do plano; anotar divergências e o tempo da comparação — cobre CA6 — prova (em `frontend/`): `npm run e2e -- organizacao configuracao-unidade`, `npm test -- shell noInternalAnchors routePattern`, `npm run test:visual:docker -- --update-snapshots -g "configuracoes-(organizacao|transferir-coordenacao|unidade|unidade-modalidades-recusa) "` e `npm run visual:canvas`

## 6. Decisões

- D1: o campo que hoje se chama "Titular (razão social ou nome)", mas guarda o documento, passa a guardar o nome, como no canvas; o documento vai para o campo "CNPJ ou CPF do titular" (rótulo da issue). O valor já gravado em `holder_document` não muda.
- D2 (muda o comportamento): os três dados são independentes: nenhum exige outro, e a razão social vale mesmo sem CNPJ da unidade (quem decide qual usar é a #769, RN-MAT-21). Alternativa descartada: exigir os pares, que a regra não pede.
- D3: razão social e nome do titular entram na auditoria com o valor, porque a issue pede o antes e depois conferível; CNPJ da unidade e documento do titular continuam escondidos ou mascarados. Alternativa descartada: mostrar só "[alterado]".
- D4: a razão social não está em `ConfigUnidade`, e o documento do titular não está em `ConfigAcademia`; os dois são exigidos pela RN-MAT-21 e pela issue, e o PR lista as duas divergências. Sem texto de ajuda sobre o termo, que só passa a usar os dados na #769.
- D5: o seed preenche só a organização 1 e uma unidade, deixando prontos os dois casos da #769 (unidade com CNPJ e unidade que usa o titular).

## Construção

- T1 — arquivos: `V64__unit_legal_name_organization_holder_name.sql`, `UnitUpdate.java`, `NewUnit.java`, `UnitSettings.java`, `UnitUpdateValidationTest.java`, `UnitSettingsIT.java` — prova: `mvnw test -Dtest=UnitUpdateValidationTest` → passou; `verify -Dit.test=UnitSettingsIT` → 14/14
- T2 — arquivos: `OrganizationProfile.java`, `OrganizationController.java`, `docs/openapi.yaml`, `OrganizationProfileIT.java`, `OrganizationBase.java` — prova: `verify -Dit.test=OrganizationProfileIT` → 17/17; `test -Dtest='OpenApiContractTest,ContractRoutesTest'` → 7/7
- T3 — arquivos: `useUnitSettings.ts`, `unitDraft.ts`, `UnitDataTab.tsx`, `UnitSettingsPage.tsx`, `unitTabKit.tsx`, `pt-BR.json`, `mocks/handlers.ts`, `UnitSettingsPage.test.tsx`, `unit-settings.msw.test.ts`
- T4 — arquivos: `useOrganization.ts`, `BrandCard.tsx`, `OrganizationSettingsPage.tsx`, `pt-BR.json`, `mocks/handlers.ts`, `BrandCard.test.tsx`, `OrganizationSettingsPage.test.tsx`, `TransferCoordinationDialog.test.tsx`, `organization.msw.test.ts` — prova de T3 e T4: `npm test -- UnitSettingsPage unit-settings.msw features/organization organization.msw` → 145/145; `npm run lint` e `npm run typecheck` → sem erro
- T5 — arquivos: `infra/seed/26-razao-social-titular.sql`, `docs/especificacao/01-organizacao-e-isolamento.md` — prova: `verify -Dit.test=SeedDataIT` → 28/28
- T6 — arquivos: `e2e/organizacao.spec.ts`, `e2e/configuracao-unidade.spec.ts`, `visual/telas.visual.ts`, referências — prova: `npm run e2e -- organizacao configuracao-unidade` → 6/6 (o filtro também pega `escolha-organizacao`); `npm test -- shell noInternalAnchors routePattern telasCanvas tokens ...` → verde; `test:visual:docker -- --update-snapshots -g "configuracoes-(organizacao|transferir-coordenacao|unidade|unidade-modalidades-recusa) "` → 16/16 gerados; `npm run visual:canvas` → 164 comparadas, 0 reprovadas (1440 claro: organização 3,8%, unidade 2,1%, transferir 9,4%, recusa 2,1%; limite 15%, sem `limiteCanvas`). Segue o padrão de rotas e telas.

Capturas em `.capturas/768/`: `<caso>-1440-sistema.png`, `<caso>-390-sistema.png` e `<caso>-1440-canvas.png` dos quatro casos, e `configuracoes-unidade-390-canvas.png` (`GMConfigUnidade`, de 360 px, comparado à mão). Os canvas só existem no tema claro e, fora `GMConfigUnidade`, só em 1440.

Divergências do canvas deste item (D4): "Razão social (opcional)" não está em `ConfigUnidade` nem em `GMConfigUnidade`; "CNPJ ou CPF do titular" não está em `ConfigAcademia` nem no fundo de `TransferirCoordenacao`. O campo "Titular (razão social ou nome)" agora bate com o canvas em conteúdo (D1). As demais diferenças vistas nas capturas são anteriores ao item.

Testes do item (rodada final): `verify -Dtest='UnitUpdateValidationTest,OpenApiContractTest,ContractRoutesTest' -Dit.test='UnitSettingsIT,OrganizationProfileIT,SeedDataIT'` → BUILD SUCCESS (17 rápidos e 59 de integração); em `frontend/`, `lint`, `typecheck` sem erro e `npm test -- features/units features/organization unit-settings.msw organization.msw shell noInternalAnchors routePattern telasCanvas tokens casos` → 1017/1017
Regressão: não roda nesta fase (AGENTS, "Quem roda o quê").

Desvios: `OrganizationBase.row()` (apoio dos testes) passou a ler `holder_name`, para as recusas conferirem a coluna nova; arquivo fora da lista do plano. São 30 arquivos contáveis (no limite).

Referências visuais (12 arquivos em `frontend/visual/referencias/`): `configuracoes-organizacao` e `configuracoes-unidade` (1440 e 390, claro e escuro); `configuracoes-transferir-coordenacao` e `configuracoes-unidade-modalidades-recusa` (1440, claro e escuro; as de 390 não mudaram). A moldura não mudou.

Docker: nenhuma imagem nova nem container de prova sobrando (a imagem do Playwright já existia).

Não é do item: nada. `specs/backlog.md` e `specs/itens/636-termo-dados-unidade.md` vêm da fase 2 e entram no commit do item.



## Verificação

### Rodada 1 — OK — 27/11/2026, estado 0eab5624bdb46775f739e9dfe3de1e3f003038d1

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `UnitSettingsIT` (14/14): `legalName` grava aparado, é relido e audita antes e depois; vazio, espaços, nulo e omitido apagam; valor igual não audita. `UnitUpdateValidationTest` no `mvnw test`. |
| CA2 | PASSOU | `OrganizationProfileIT` (17/17) `holderName`: nome sem documento, versão sobe só quando muda, vazio/espaços/nulo/omitido apagam, auditoria com nome em claro e sem o documento completo. Máscara do documento no diff (`auditValues`) e nos casos anteriores do IT. |
| CA3 | PASSOU | Os dois ITs: 160 grava; 161 dá 400 no campo sem mudar linha nem auditoria; o banco recusa vazio e 161 (`V64`). |
| CA4 | PASSOU | `legalNameRefused`: Professor, aluno e Administrador de outra unidade 403, outra organização 404, sem efeito nem auditoria. `holderNameRefused`: Administrador, Professor, aluno e responsável 403; o PATCH de uma organização não altera a outra. |
| CA5 | PASSOU | `npm test` 3168/3168 (`UnitSettingsPage`, `OrganizationSettingsPage`, `BrandCard`: gravar, 400 no campo, diferenças no 409, Administrador desabilitado). e2e dos dois specs: reabre com os valores. |
| CA6 | PASSOU | e2e 6/6 (dentro da moldura, sem rolagem a 360 px nas duas telas); axe (jsdom) das duas telas e contraste dos tokens no `npm test`, com `shell`, `noInternalAnchors` e `routePattern`; casos do visual com os campos preenchidos. As 13 capturas de `.capturas/768/` foram abertas e comparadas (claro, 1440 e 390; canvas só no claro): as diferenças dos campos novos são as de D4; "Titular" bate com `ConfigAcademia`; sem sobreposição nem corte a 390. As demais diferenças são anteriores ao item. Visual contra as referências: no CI do PR. |
| CA7 | PASSOU | Contrato nos quatro esquemas (`OpenApiContractTest`/`ContractRoutesTest` no `mvnw test`); testes MSW das duas rotas no `npm test`; `SeedDataIT` 28/28; o seed só atualiza com os dois campos nulos (leitura do SQL) e `mare-alta-botafogo` existe em `02-configuracoes.sql`; especificação atualizada no diff. |

Comandos:
- `mvnw test` → BUILD SUCCESS, 161 testes no resumo final, 0 falhas
- `mvnw verify -Dtest=NaoExiste ... -Dit.test=UnitSettingsIT,OrganizationProfileIT,SeedDataIT -Djacoco.skip=true` → 59/59
- `npm run lint`, `npm run typecheck`, `npm run build` → sem erro
- `npm test` → 278 arquivos, 3168/3168
- `npm run e2e -- organizacao configuracao-unidade` → 6/6 (inclui `escolha-organizacao` pelo filtro)
- visual: no CI do PR
- Docker: imagens iguais antes e depois; nenhum container de prova sobrando

Especificação x card: sem divergência. Diff: 30 arquivos contáveis (no limite). O único outro chamador de `PUT /units/{id}` além da tela é o MSW/testes (o assistente de nova unidade só grava modalidades), e o `PATCH /organization` só sai da aba Geral: nada apaga os campos novos por omissão. Referências visuais alteradas só nas quatro telas do plano (conferidas pelas capturas do sistema; `configuracoes-unidade-1440-claro` aberta contra a anterior: só entra o campo novo e o resto desce).

Instáveis: nenhum.

Achados:
- sugestão, código, `infra/seed/26-razao-social-titular.sql` — o `SeedDataIT` só aplica o arquivo; nenhuma asserção confere os valores gravados nem que um valor existente é preservado.

## Entrega

O que muda: a unidade ganha razão social opcional (até 160 caracteres) em Unidade › Dados; a organização ganha "Titular (razão social ou nome)" (até 160) em Organização › Geral, ao lado do documento do titular, que passa a ter o rótulo "CNPJ ou CPF do titular". Migração `V64`, API, `docs/openapi.yaml`, MSW, seed (`infra/seed/26-razao-social-titular.sql`) e a especificação 01 mudam juntos. Gravar o nome do titular exige o Coordenador; a razão social segue quem pode editar a unidade. Mudanças são auditadas com antes e depois, sem o documento completo.

Verificação: rodada 1 OK (estado 0eab5624). Back-end: `mvnw test` verde; ITs `UnitSettingsIT`, `OrganizationProfileIT` e `SeedDataIT` 59/59. Front-end: `lint`, `typecheck`, `build`, `npm test` 3168/3168; e2e `organizacao` e `configuracao-unidade` 6/6. Comparação com o canvas feita (1440 e 390, claro): as diferenças dos campos novos são as de D4 da especificação. Referências visuais das quatro telas do plano regeradas; o visual inteiro roda no CI.

Decisões: campos novos são opcionais e nulos por padrão; o PATCH da organização não apaga os campos novos por omissão.

Limitações: nenhuma pendente. Sugestão opcional da verificação (o `SeedDataIT` não confere os valores gravados pelo seed) fica no arquivo do item.
