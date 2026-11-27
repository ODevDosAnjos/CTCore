# 758 — 755b · Retirar o campo de cor da API, do contrato, do MSW e do banco (fecha a #755 e a #626)

Origem: issue #758 (parte b da #755; requisitos de partida em `specs/itens/755-retirar-campo-cor.md`, R1 a R5, CA1 a CA6, D1). Branch: `item/758-retirar-campo-cor-contrato-banco`.

Tempos: especificar 2 · construir 11 · verificar 13 (regressão 11) · entregar 1 (1 rodada)

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

A cor da organização, que as telas já não usam desde a #754, deixa de existir na API, no contrato, no MSW, no banco, nos tipos e testes do front e no código que só servia a ela (RNF-22, RF-ORG-01, decisão 20 de `docs/auditoria/decisoes-canvas.md`).

Fora do escopo: cores de faixa e graduação, o token `--brand`, a cor fixa do e-mail (`EmailLayout.BRAND_COLOR`), o histórico de auditoria já gravado, as migrações antigas, logo nos e-mails e dados novos da organização (#627). Os dados de exemplo sem tipo já saíram na #757.

## 2. Requisitos

- R1: a API não grava nem devolve a cor da organização em `/organization`, `/portal/shell` e `/portal/card`, e `BrandColor` deixa de existir.
- R2: um PATCH de `/organization` que ainda mande `color` é ignorado, sem erro de cor e sem entrada de cor na auditoria, com permissão e isolamento como hoje.
- R3: a migração `V59` tira a coluna `organization.color` e a restrição `organization_color_format`, sem mudar os demais dados.
- R4: o contrato, o MSW, os tipos do front e os testes que dependem deles não têm a cor da organização, e `contrastRatio` deixa de existir.
- R5: o logo da organização continua aparecendo onde aparece hoje.

## 3. Critérios de aceite

- CA1 (R1): dado o GET de `/organization`, `/portal/shell` e `/portal/card`, quando respondem, então a organização não tem a chave `color`.
- CA2 (R2): dado o Coordenador, quando envia um PATCH com `color` (válida, reprovada no contraste ou texto qualquer), então a resposta é 200, os outros campos são gravados, a resposta não tem `color` e a auditoria da gravação não tem `color`; um PATCH em que só a cor "muda" não sobe a versão nem grava auditoria.
- CA3 (R2): dado um Administrador ou Professor, quando envia o PATCH com `color`, então recebe 403; o PATCH do Coordenador de uma organização não altera a outra.
- CA4 (R3): dado um banco na versão 58 com uma organização que tem cor, nome, titular e logo, quando a `V59` roda, então a coluna `color` e a restrição `organization_color_format` não existem e o resto da linha fica igual.
- CA5 (R1, R4): dado o código de produção, quando se busca a cor da organização, `BrandColor` e `contrastRatio`, então nada é encontrado fora das migrações antigas e da `V59`; o contrato e o MSW não têm o campo, e o teste do contrato, os testes MSW da organização, da moldura e da carteirinha, `lint`, `typecheck` e os testes do front alterados passam.
- CA6 (R5): dada uma organização com logo, quando se abrem as configurações, o portal e a carteirinha, então o logo continua aparecendo (termo e recibo não passam por código alterado).

## 4. Plano técnico

- Dados: `backend/src/main/resources/db/migration/V59__drop_organization_color.sql` (a criar; a última é a V58): `alter table organization drop constraint organization_color_format, drop column color;`, com comentário de reversão no padrão da V12 (recriar coluna e restrição; os valores apagados não voltam). Sem backfill. Nenhuma outra migração, seed de `infra/` ou grant por coluna usa `organization.color`.
- API: `GET` e `PATCH /organization`, `GET /portal/shell` e `GET /portal/card` perdem `color` em `organization`. Sem rota, erro ou permissão novos. O campo extra no PATCH é ignorado pelo padrão do Spring Boot (não há `FAIL_ON_UNKNOWN_PROPERTIES` nem `JsonIgnoreProperties` no back-end, e nada se acrescenta para isso).
- Interface: nenhuma tela muda (sem cor desde a #754). Só os tipos. Sem comparação com o canvas nem capturas; nenhuma referência visual é regerada.
- Segurança: permissões, RLS e filtros iguais; o teste de permissão e isolamento da rota continua cobrindo (CA3).
- Arquivos (24):
  - Back-end, em `backend/src/main/java/br/com/ctcore/organization/`:
    - `BrandColor.java`: apagar.
    - `OrganizationProfile.java`: tirar `color` de `OrganizationView`, `Brand` (comentário de `brand()`: "nome e logo") e `Row`; em `update`, o parâmetro, `newColor` e a coluna no `update organization`; `brand()`, `row()` (select e índices do `ResultSet`), `view()` e `auditValues()`. `field()` fica (titular e logo usam).
    - `OrganizationController.java`: tirar `color` de `UpdateRequest` e da chamada `profile.update`.
    - `PortalShell.java` e `PortalCard.java` (pacote `student`) só repassam `Brand`: não mudam.
  - Testes do back-end, em `backend/src/test/java/br/com/ctcore/`:
    - `organization/BrandColorTest.java`: apagar.
    - `organization/OrganizationBase.java`: `row()`, tirar `color` do select.
    - `organization/OrganizationProfileIT.java`: `read` (chaves sem `color`), `update`, `validation` (sai o laço de cores; o último PATCH inválido fica só com o nome), `databaseChecks` (sai as duas asserções de cor; fica a do titular), `auditTrail`; o PATCH com `color` (CA2, três valores e o "só a cor muda") e o 403 com `color` (CA3) são provados aqui.
    - `db/MigrationIT.java`: teste novo da V59. Flyway em schema próprio (como `changedMigrationFailsValidation`), `drop schema if exists ... cascade` antes, `target("58")`, inserir a organização com cor, titular e logo, guardar `to_jsonb(o) - 'color'`, `target("59")`, comparar com `to_jsonb(o)` e conferir `information_schema.columns` e `pg_constraint` daquele schema.
    - `student/PortalShellIT.java` e `student/PortalCardIT.java`: afirmar que `organization` não tem `color` (a cor de faixa em `PortalCardIT` fica).
    - `organization/OrganizationRouteIT.java` usa `OrganizationBase.row()` e não muda; entra só na prova.
    - `organization/LastChangeIT.java` já afirma a ausência de `color`: não muda.
  - Contrato, `docs/openapi.yaml`: resumo e descrição do `patch /organization`; `OrganizationView` (`required` e propriedade); `OrganizationUpdateRequest.color`; `organization.color` (e `required`) em `PortalShell` e `PortalCard`. Os `color` de faixa ficam.
  - Front-end, em `frontend/src/`:
    - `mocks/handlers.ts`: import de `contrastRatio`; `initialOrganization` (valor e comentário); resolver do `patch /organization` (tipo do corpo, `color`, validação, `next`, `changed`); `organization` das respostas de `/portal/shell` e `/portal/card`.
    - `features/organization/contrastRatio.ts` e `contrastRatio.test.ts`: apagar (só o MSW e o teste importam).
    - `features/organization/useOrganization.ts`, `features/portal/usePortalShell.ts`, `features/portal/usePortalCard.ts`: tirar `color` do tipo da organização (o de `CardBelt` fica).
    - `mocks/organization.msw.test.ts`: o PATCH com `color` válida e inválida responde 200 sem a chave; só a cor não sobe a versão; saem os dois casos inválidos de cor.
    - `mocks/portal-shell.msw.test.ts`: propriedades do contrato `["name", "logoUrl"]` e resposta sem `color`.
    - `mocks/portal-card.msw.test.ts`: `organization` da resposta com as chaves `logoUrl` e `name`.
    - `features/organization/BrandCard.test.tsx` e `OrganizationSettingsPage.test.tsx`: tirar `color` das constantes.
    - `features/portal/PortalShell.test.tsx` e `PortalCardPage.test.tsx`: tirar `color` da organização; em `expectNoOrgColor`, sai a busca pelo hexadecimal que não é mais passado (ficam `--org` e as classes `brand`).
- Reuso: padrão de schema isolado do `MigrationIT`; asserções de logo que já existem.
- Riscos: SQL que ainda leia a coluna (os ITs da organização e do portal acusam; a regressão inteira é do CI); índices do `ResultSet` em `row()` (CA2); apagar cor de faixa por engano (CA5, typecheck e testes). A `V59` apaga os valores gravados: é o que a issue pede e não há ambiente publicado (até a Sprint 22).

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

Duas partes, uma sessão cada, no mesmo branch e no mesmo PR: parte 1, back-end (T1 e T2); parte 2, contrato e front-end (T3 a T5).

- [x] T1: criar a `V59`, apagar `BrandColor` e o teste, tirar o campo de `OrganizationProfile` e `OrganizationController` e ajustar `OrganizationBase`, `OrganizationProfileIT` e `MigrationIT` — cobre CA1, CA2, CA3, CA4, CA6 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=OrganizationProfileIT,OrganizationRouteIT,MigrationIT -Djacoco.skip=true`
- [x] T2: afirmar a ausência de `color` em `PortalShellIT` e `PortalCardIT` — cobre CA1 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=PortalShellIT,PortalCardIT -Djacoco.skip=true`
- [x] T3: tirar o campo do contrato e do MSW e ajustar os três testes MSW — cobre CA1, CA2, CA5 — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`; em `frontend/`, `npx vitest run organization.msw portal-shell.msw portal-card.msw`
- [x] T4: apagar `contrastRatio` e o teste, tirar o campo dos três tipos e dos quatro testes de tela — cobre CA5, CA6 — prova (em `frontend/`): `npm run lint && npm run typecheck && npx vitest run BrandCard OrganizationSettingsPage PortalShell PortalCardPage`
- [x] T5: conferir a busca no código de produção — cobre CA5 — prova (na raiz): a busca abaixo sem resultado; e `git grep -niE "\bcolor\b" -- backend/src/main/java/br/com/ctcore/organization` também sem resultado:
  `git grep -nE "BrandColor|contrastRatio|passesContrast|isHexColor|organization\??\.color|organization: \{ name: string; color" -- backend/src/main/java frontend/src docs/openapi.yaml infra`

## 6. Decisões

- D1: nenhum código novo para ignorar `color` no PATCH: o Jackson do Spring Boot já ignora propriedade desconhecida, e o IT prova. Alternativa descartada: manter o campo no `record` só para descartá-lo.
- D2: a `V59` apaga coluna e restrição direto, sem cópia dos valores nem etapa de transição: não há ambiente publicado e a cor não tem mais uso. Alternativa descartada: manter a coluna morta.
- D3: a estimativa é de 24 arquivos contáveis (a issue fala em cerca de 23; entra `portal-card.msw.test.ts`, um dos "testes MSW" que ela cita), abaixo do limite de 30; sem nova divisão.
- Suposição: os testes de logo do termo e do recibo, que não tocam o código alterado, ficam como prova no CI; se algum falhar por causa do item, volta para correção.

## Construção

Duas partes, uma sessão cada: parte 1 (back-end, T1 e T2) e parte 2 (contrato e front-end, T3 a T5), ambas feitas.

- T1 — arquivos: `V59__drop_organization_color.sql` (novo); `BrandColor.java` e `BrandColorTest.java` (apagados); `OrganizationProfile.java`, `OrganizationController.java`, `OrganizationBase.java`, `OrganizationProfileIT.java` (testes novos `colorIgnored` e `colorPatchPermissions`), `MigrationIT.java` (teste novo `v59DropsOrganizationColor`) — prova: o comando da T1, rodado junto com o da T2 (`verify ... -Dit.test=OrganizationProfileIT,OrganizationRouteIT,MigrationIT,PortalShellIT,PortalCardIT -Djacoco.skip=true`) → BUILD SUCCESS; `OrganizationProfileIT` 15, `OrganizationRouteIT` 3, `MigrationIT` 5, sem falha
- T2 — arquivos: `PortalShellIT.java`, `PortalCardIT.java` — prova: mesma execução → `PortalShellIT` 7, `PortalCardIT` 4, sem falha
Testes do item (parte 1): os cinco ITs acima → 34 testes, 0 falhas, 0 pulados. Contrato, MSW e front ficam para a parte 2; até lá o `docs/openapi.yaml` ainda descreve `color` (mesmo branch e mesmo PR).
Regressão: não roda na construção (`AGENTS.md`, "Quem roda o quê").
Desvios: nenhum no produto.

### Parte 2 (contrato e front-end)

- T3 — arquivos: `docs/openapi.yaml`; `frontend/src/mocks/handlers.ts`, `organization.msw.test.ts`, `portal-shell.msw.test.ts`, `portal-card.msw.test.ts` — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'` → 7 testes, 0 falhas; `npx vitest run organization.msw portal-shell.msw portal-card.msw` → 3 arquivos, 22 testes, 0 falhas
- T4 — arquivos: `contrastRatio.ts` e `contrastRatio.test.ts` (apagados); `useOrganization.ts`, `usePortalShell.ts`, `usePortalCard.ts`, `BrandCard.test.tsx`, `OrganizationSettingsPage.test.tsx`, `PortalShell.test.tsx`, `PortalCardPage.test.tsx` — prova: `npm run lint` e `npm run typecheck` sem erro; `npx vitest run BrandCard OrganizationSettingsPage PortalShell PortalCardPage organization.msw portal-shell.msw portal-card.msw` → 7 arquivos, 99 testes, 0 falhas; depois do último ajuste em `PortalCardPage.test.tsx`, o arquivo de novo → 12 testes, 0 falhas, e lint e typecheck sem erro
- T5 — prova: as duas buscas da tarefa, na raiz → sem resultado
Testes do item (final): os cinco ITs de novo (`verify ... -Dit.test=OrganizationProfileIT,OrganizationRouteIT,MigrationIT,PortalShellIT,PortalCardIT -Djacoco.skip=true`) → BUILD SUCCESS, 34 testes, 0 falhas, 0 pulados; contrato, front, lint e typecheck como acima.
Regressão: não roda na construção (`AGENTS.md`, "Quem roda o quê").
Desvios: nenhum no produto. Sem mudança de tela: sem capturas nem referências visuais. `AGENTS.md` e `specs/projeto.md` não citam o que saiu; nada a atualizar. 24 arquivos contáveis, como estimado.

## Verificação

### Rodada 1 — OK — 2026-11-27, estado b75fa7002c87d1434d53920e251482a3d53f5837

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `OrganizationProfileIT` (lista exata de chaves do GET), `PortalShellIT` e `PortalCardIT` (`has("color")` falso), nos 34 ITs verdes |
| CA2 | PASSOU | `OrganizationProfileIT.colorIgnored`: três valores com 200, nome gravado, resposta e 3 registros de auditoria sem `color`; só a cor não sobe a versão nem audita |
| CA3 | PASSOU | `colorPatchPermissions`: 403 para Administrador e Professor, linha intacta; PATCH do Coordenador de A não altera B nem audita em B. `OrganizationRouteIT` 3/3 |
| CA4 | PASSOU | `MigrationIT.v59DropsOrganizationColor`: Flyway 58 → 59, linha igual (menos `color`), coluna e `organization_color_format` ausentes, `organization_holder_format` mantida |
| CA5 | PASSOU | busca da T5 (com não rastreados, repositório sem `specs/`): só `docs/design/textos-maiusculas.md` (inventário de textos, não é produção); sem `color` no pacote `organization`; no contrato e no MSW só cor de faixa; `OpenApiContractTest` 4 e `ContractRoutesTest` 3 sem falha; `lint`, `typecheck` e `npm test` (com os testes MSW e de tela alterados) verdes |
| CA6 | PASSOU | `OrganizationProfileIT` (logo) e, no `npm test`, `OrganizationSettingsPage`, `BrandCard`, `PortalShell` (`header img`) e `PortalCardPage` (logo); `brand()` segue usando o mesmo `logoUrl(row)`, com o índice novo de `row()` coberto pelo GET. Termo e recibo sem código alterado (ficam no CI) |

Comandos (regressão local reduzida, inteira):
- `./backend/mvnw -f backend/pom.xml test` → BUILD SUCCESS, 160 testes, 0 falhas
- `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=OrganizationProfileIT,OrganizationRouteIT,MigrationIT,PortalShellIT,PortalCardIT -Djacoco.skip=true` → BUILD SUCCESS, 34 testes, 0 falhas, 0 pulados
- em `frontend/`: `npm run lint`, `npm run typecheck`, `npm run build` → sem erro; `npm test` → 275 arquivos, 3056 testes, 0 falhas
- e2e de spec: não se aplica (nenhuma tela criada ou alterada, só tipos). Sem comparação com o canvas. visual: no CI do PR

Especificação x issue e requisitos da #755: sem divergência. Diff: só arquivos do item (24 contáveis e este); migração nova, nenhuma antiga editada; sem segredo nem dado real.

Achados:
- sugestão, código, `backend/src/test/java/br/com/ctcore/student/PortalShellIT.java` — nenhum IT do portal afirma `logoUrl` preenchido em `/portal/shell` ou `/portal/card` (já era assim antes do item).

## Entrega

- O que muda: a cor da organização sai da API (`/organization`, `/portal/shell`, `/portal/card`), do contrato, do MSW, dos tipos do front e do banco (`V59` tira a coluna `color` e a restrição `organization_color_format`). `BrandColor` e `contrastRatio` são apagados. Um PATCH com `color` é ignorado sem erro e sem auditoria de cor. O logo segue igual. Sem mudança de tela.
- Verificação: rodada 1 `OK` (estado `b75fa700`), CA1 a CA6 passaram. Back-end: `test` 160 testes verdes; os cinco ITs do item, 34 testes verdes. Front-end: `lint`, `typecheck`, `build` sem erro; `npm test` 275 arquivos, 3056 testes verdes.
- Decisões: D1 (Jackson ignora o campo extra, sem código novo), D2 (`V59` apaga coluna e restrição sem transição, já que não há ambiente publicado). Migração antiga não foi editada.
- Limitações: termo e recibo não têm teste novo de logo (ficam no CI); a conferência visual da suíte inteira é do job `visual` do CI.
- Issues: o PR referencia a #758; as partes-mãe #755 e #626 são fechadas no merge por comentário, porque o item as fecha.
