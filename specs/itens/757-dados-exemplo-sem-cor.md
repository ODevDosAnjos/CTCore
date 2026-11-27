# 757 — 755a · Tirar a cor da organização dos dados de exemplo dos testes

Origem: issue #757 (parte a da #755; requisitos de partida em `specs/itens/755-retirar-campo-cor.md`, parte de R4, D1). Branch: `item/757-dados-exemplo-sem-cor`.

Tempos: especificar 1 · construir 4 · verificar 12 (regressão 11) (1 rodada) · entregar 2

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Tirar a cor da organização dos dados de exemplo que nenhum tipo exige, antes de o campo sair da API, do contrato, do MSW e do banco na #758 (RNF-22, RF-ORG-01, decisão 20 de `docs/auditoria/decisoes-canvas.md`).

Fora do escopo (fica para a #758): código de produção, API, contrato, MSW, banco, `BrandColor`, `contrastRatio`, os testes tipados (`BrandCard`, `OrganizationSettingsPage`, `PortalShell`, `PortalCardPage`), os testes MSW e os demais ITs. Cores de faixa e graduação não mudam em parte nenhuma.

## 2. Requisitos

- R1: os 13 arquivos da issue (listados no plano) não têm a cor da organização, nem em dado de exemplo, nem no corpo de PATCH, nem em comentário.
- R2: as cores de faixa e graduação nesses arquivos ficam como estão.
- R3: nada fora desses 13 arquivos muda em código ou teste, nenhuma referência visual muda e os testes continuam conferindo o mesmo que hoje.

## 3. Critérios de aceite

- CA1 (R1): dados os 13 arquivos, quando se roda a busca da prova de T3, então ela não encontra nada (hoje encontra ao menos uma linha em cada um dos 13).
- CA2 (R2, R3): dado o diff do item contra a `dev`, quando se lê, então fora de `specs/` só aparecem os 13 arquivos, cada linha alterada difere apenas por tirar a cor da organização, e nenhum arquivo de `frontend/visual/referencias` aparece.
- CA3 (R3): dados os dados de exemplo sem a cor, quando se rodam `lint`, `typecheck` e os testes do front alterados ou que importam `src/test/portalShell.ts`, então todos passam.
- CA4 (R3): dado o corpo do PATCH de `OrganizationRouteIT` sem `color`, quando o IT roda, então os casos de anônimo 401, perfis sem permissão 403, Administrador só leitura e organização forjada passam.

## 4. Plano técnico

- Dados: não muda.
- API: não muda.
- Interface: não muda. As telas já ignoram a cor desde a #754; sem comparação com o canvas nem capturas, porque nenhuma tela é criada ou alterada.
- Segurança: não muda; a cobertura de permissão e isolamento do `OrganizationRouteIT` continua a mesma (CA4).
- Arquivos (13):
  - `frontend/src/test/portalShell.ts`: `portalShellOk`, tirar `color: null`.
  - Em `organization: { name, color: null, logoUrl }`, tirar `color: null`: `frontend/src/features/auth/AreaUnavailablePage.test.tsx`, `frontend/src/features/auth/NotFoundPage.test.tsx` e, em `frontend/src/features/portal/`, `PortalAgendaPage.test.tsx`, `PortalAnnouncementsPage.test.tsx` (duas ocorrências), `PortalFinancePage.test.tsx`, `PortalInfoPage.test.tsx` (só a da moldura; a de `level` é faixa e fica), `PortalRequestsPage.test.tsx` e `PortalStates.test.tsx` (duas ocorrências: o `empty` da carteirinha e a moldura).
  - `frontend/src/features/organization/TransferCoordinationDialog.test.tsx`: constante `view`, tirar a linha `color: null`.
  - `frontend/visual/telas.visual.ts`: bloco `if (organizacaoCanvas)`, tirar a linha `color: "#c8462c"`. Os `color` de `nivel(...)` são faixas e ficam.
  - `frontend/visual/casos.ts`: comentário de `organizacaoCanvas`, tirar `cor #C8462C, `. A nota sobre `ConfigOrgContraste` ("não há cor por organização") fica: registra a retirada da tela.
  - `backend/src/test/java/br/com/ctcore/organization/OrganizationRouteIT.java`: `writes()`, tirar `color` do corpo do PATCH.
- Reuso: nada novo.
- Riscos: tirar cor de faixa por engano (CA2). No visual, o corpo sobrescrito parte de `...base`, que até a #758 ainda traz `color: null` do MSW; a tela não lê o campo, então as referências de `configuracoes-organizacao` e `configuracoes-transferir-coordenacao` não mudam. Quem prova é o job `visual` do CI.

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

- [x] T1: tirar a cor da organização de `src/test/portalShell.ts` e dos nove testes do front — cobre CA2, CA3 — prova (em `frontend/`): `npm run lint && npm run typecheck && npx vitest run AreaUnavailablePage NotFoundPage PortalAgendaPage PortalAnnouncementsPage PortalFinancePage PortalInfoPage PortalRequestsPage PortalStates TransferCoordinationDialog AccountPage LoginPage TwoFactorLogin PortalTermPage`
- [x] T2: tirar a cor da organização de `visual/telas.visual.ts` e do comentário de `visual/casos.ts` — cobre CA2 — prova (em `frontend/`): `npm run lint && npm run typecheck` (o `tsconfig.node.json` inclui `visual/`); nenhuma referência é regerada, e a conferência visual é do CI
- [x] T3: tirar `color` do corpo do PATCH em `OrganizationRouteIT` e conferir os 13 arquivos — cobre CA1, CA2, CA4 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=OrganizationRouteIT -Djacoco.skip=true`; e, na raiz, a busca abaixo sem resultado, seguida de `git diff --stat dev` com só os 13 arquivos fora de `specs/`:
  `git grep -nE -e 'color: null, logoUrl' -e '^\s*color: (null|"#c8462c"),\s*$' -e 'cor #C8462C' -e 'color\\":' -- frontend/src/test/portalShell.ts '*/AreaUnavailablePage.test.tsx' '*/NotFoundPage.test.tsx' '*/PortalAgendaPage.test.tsx' '*/PortalAnnouncementsPage.test.tsx' '*/PortalFinancePage.test.tsx' '*/PortalInfoPage.test.tsx' '*/PortalRequestsPage.test.tsx' '*/PortalStates.test.tsx' '*/TransferCoordinationDialog.test.tsx' frontend/visual/telas.visual.ts frontend/visual/casos.ts '*/OrganizationRouteIT.java'`

## 6. Decisões

- D1: os dados de exemplo só perdem a cor; nenhum teste ganha asserção nova, porque o comportamento não muda. O "a API ignora `color`" é provado na #758. Alternativa descartada: antecipar para cá a prova da #758.
- D2: `specs/itens/755-retirar-campo-cor.md` (ainda fora do Git) e o ajuste de `specs/backlog.md` já na pasta de trabalho entram no commit deste item, por serem o registro da divisão (D1 da #755). Não contam no limite de arquivos. Alternativa descartada: PR só de especificação.
- Suposição: a #758 remove o `color: null` do MSW; até lá a resposta do mock continua com o campo. Se a tela passasse a lê-lo, o job `visual` do CI acusaria.

## Construção

- T1 — arquivos (em `frontend/src/`): `test/portalShell.ts`, `features/auth/{AreaUnavailablePage,NotFoundPage}.test.tsx`, `features/portal/{PortalAgendaPage,PortalAnnouncementsPage,PortalFinancePage,PortalInfoPage,PortalRequestsPage,PortalStates}.test.tsx`, `features/organization/TransferCoordinationDialog.test.tsx` — prova: `npm run lint && npm run typecheck && npx vitest run ...` (filtros da T1) → lint e tipos sem erro; 14 arquivos e 250 testes passaram (o filtro `PortalRequestsPage` pega também o de `features/portal-requests`, sem alteração)
- T2 — arquivos: `frontend/visual/telas.visual.ts`, `frontend/visual/casos.ts` — prova: `npm run lint && npm run typecheck` → sem erro; nenhuma referência regerada
- T3 — arquivos: `backend/src/test/java/br/com/ctcore/organization/OrganizationRouteIT.java` — prova: `mvnw verify ... -Dit.test=OrganizationRouteIT -Djacoco.skip=true` → 3 testes, 0 falhas, BUILD SUCCESS; `git grep` da T3 → sem resultado; `git diff --stat dev` → fora de `specs/` só os 13 arquivos
Testes do item: os das provas acima → todos passaram. Visual só no CI.
Regressão: não roda nesta fase (é da verificação).
Desvios: nenhum.

## Verificação

### Rodada 1 — OK — 27/11/2026, estado efb904e2cd53be79f5addcb2dd70dd6f33003c4d

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `git grep` da T3 nos 13 arquivos: sem resultado (rc=1); a mesma busca em `origin/dev` acha 1 ou 2 linhas em cada um dos 13. Busca ampla por `color`, `cor` e hexadecimal nos 13: sobram só faixas, `colorScheme` e a nota de `ConfigOrgContraste` |
| CA2 | PASSOU | diff `60be3a9c`..`efb904e2` lido inteiro: fora de `specs/` só os 13 arquivos, cada linha só perde a cor da organização; faixas intactas; nenhum arquivo de `referencias` |
| CA3 | PASSOU | `lint`, `typecheck` e `build` sem erro; `npm test` inteiro: 276 arquivos e 3060 testes passaram (inclui os 9 alterados e os 4 que importam `portalShell.ts`) |
| CA4 | PASSOU | `verify ... -Dit.test=OrganizationRouteIT -Djacoco.skip=true`: 3 testes, 0 falhas, BUILD SUCCESS (anônimo 401 e perfis 403, Administrador só leitura, organização forjada) |

Comandos: em `frontend/`, `npm run lint`, `npm run typecheck`, `npm run build` e `npm test` → passaram; `./backend/mvnw -f backend/pom.xml test` → 163 testes, 0 falhas; o IT acima → passou. e2e: não se aplica (nenhuma tela criada ou alterada, sem comparação com o canvas). visual: no CI do PR.
Especificação e card: os três "Pronto quando" e a lista de 13 arquivos da #757 estão cobertos por R1 a R3; sem achado.
Instáveis: nenhum.
Achados: nenhum.

## Entrega

- O que muda: tira a cor da organização dos dados de exemplo de 13 arquivos (`portalShell.ts`, nove testes do front, `telas.visual.ts`, comentário de `casos.ts` e o corpo do PATCH de `OrganizationRouteIT`). Sem código de produção, API, contrato, MSW nem banco: isso é da #758.
- Verificação: rodada 1 `OK` no estado `efb904e2`. `lint`, `typecheck`, `build` e `npm test` (276 arquivos, 3060 testes) passaram; `OrganizationRouteIT` passou (3 testes); a busca da T3 não acha mais nada nos 13 arquivos.
- Visual: nenhuma referência muda. O job `visual` do CI confere (as telas de organização não leem o campo).
- Base: `dev` em `60be3a9c`, sem avanço desde a branch. Sem conflito; a regressão completa fica para o CI, conforme "Quem roda o quê".
- Decisões: D1 e D2 da especificação. O `specs/itens/755-retirar-campo-cor.md` e a linha 757 do backlog entram neste commit, como registro da divisão.
- Limitações: a cor só sai da API na #758; até lá o MSW ainda devolve `color: null`.
