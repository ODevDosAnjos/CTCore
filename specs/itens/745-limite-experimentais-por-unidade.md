# 745 — #625a · Limite de aulas experimentais por unidade e comprovante da graduação só por modalidade

Origem: issue #745 (parte a da #625, P13). Branch: `item/745-limite-experimentais-por-unidade`.

Tempos: especificar 4 · construir 17 (2 rodadas) · verificar 33 (regressão 27; 2 rodadas) · entregar 5
Comparação com o canvas: 3

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

O limite de aulas experimentais por pessoa (RN-AEX-02) passa da organização para cada unidade, do banco à tela, para cada unidade definir o seu. As regras da Organização deixam de mostrar o controle "Em breve" do comprovante da graduação de origem, porque a exigência é por modalidade e já funciona na tela de Modalidades. Parte de R3, R8, R11 e R12 e de CA4 e CA9 a CA11 de `specs/itens/625-configuracoes-quatro-itens-abas.md`.

Fora do escopo: menu e abertura das unidades pela lista (#746); Organização em abas (#747); renomear "Links" para "Divulgação", mover "Aparecer no diretório" e juntar a aba Cobrança (#748); aplicar o limite a pedidos de aula experimental ("Limite atingido", "Liberar mais uma": a funcionalidade ainda não existe); retirar a cor da organização (#626); mudar a tela ou o servidor de Modalidades.

## 2. Requisitos

- R1: o limite de aulas experimentais por pessoa é lido e gravado por unidade, de 1 a 3, e unidade nova nasce com 2 (RN-AEX-02).
- R2: a migração copia o valor de cada organização para todas as unidades dela, e a organização deixa de ter o campo no banco, no servidor, no contrato, no MSW e na tela (RN-AEX-02).
- R3: toda alteração do limite mostra "Última alteração" na unidade, grava na auditoria da unidade o valor antes e depois e segue o `If-Match` da unidade (RF-ORG-08).
- R4: só o Coordenador e o Administrador da própria unidade leem e alteram o limite, com a permissão conferida no servidor e isolamento entre organizações (RF-ORG-02; D2).
- R5: na tela, o campo está na aba Links da unidade e não está nas regras da Organização; erro do servidor no campo abre essa aba e aponta o campo (D4).
- R6: as regras gerais da Organização não têm controle de comprovante da graduação de origem; a exigência continua gravando só na modalidade escolhida (RF-MOD-01, RF-MOD-02, RN-GRA-09).
- R7: as telas mexidas continuam no padrão de rotas e telas (RNF-56), com os quatro estados, a partir de 360 px, sem violação do axe nos dois temas, com textos em pt-BR, casos no teste visual e comparação com o canvas (decisões de `docs/auditoria/decisoes-canvas.md`).

## 3. Critérios de aceite

- CA1 (R1, R3): dado duas unidades da mesma organização, quando o limite de uma é salvo como 3, então a leitura dela devolve 3, a outra continua com o valor anterior, a versão sobe e a auditoria `unit.update` dela registra `trialLimit` com antes e depois, com a "Última alteração" atualizada.
- CA2 (R1): dado limite 0, 4 ou ausente, quando a unidade é salva, então o servidor responde 400 com o campo `settings.trialLimit` e nada é gravado (nem outro campo do mesmo pedido, nem auditoria); o MSW responde o mesmo.
- CA3 (R1, R2): dado o banco na versão anterior, com uma organização de limite 3 e duas unidades e outra de limite 1 com uma unidade, quando a migração roda, então as unidades ficam com 3, 3 e 1 e `organization_settings` não tem mais `trial_limit`; unidade criada depois nasce com 2; o banco recusa 0 e 4.
- CA4 (R2): dado a organização, quando é lida e gravada, então `rules` tem só os quatro campos restantes, no servidor, no contrato e no MSW, e salvar as regras continua funcionando.
- CA5 (R3): dado uma unidade, quando o PUT vai sem `If-Match`, então responde 428; com versão velha, 409 sem gravar o limite; na tela, a janela de conflito lista o limite quando ele diverge.
- CA6 (R4): dado Professor, Aluno, Responsável ou Administrador de outra unidade, quando lê ou grava a unidade, então recebe 403; sem sessão, 401; unidade de outra organização, 404 igual a inexistente; nada muda. O Administrador da própria unidade grava o limite (200).
- CA7 (R2, R5): dado a aba Links de uma unidade, quando é aberta, então mostra "Limite de aulas experimentais por pessoa" com as opções 1, 2 e 3 e o valor gravado; salvar envia `settings.trialLimit`; um 400 nesse campo, com outra aba aberta, abre Links com a mensagem no campo; as regras da Organização não mostram campo de experimentais por telefone.
- CA8 (R6): dado as regras gerais, quando são exibidas, então não há interruptor nem nota do comprovante; quando a exigência é ligada numa modalidade, o pedido vai só para ela e outra modalidade continua com a exigência como estava.
- CA9 (R7): dado a aba Geral da organização e a aba Links da unidade, quando são exibidas a 360 px e nos dois temas, então não há violação do axe nem rolagem horizontal da página; `shell.test.ts`, `noInternalAnchors.test.ts` e `routePattern.test.ts` passam, e há e2e da tela da unidade dentro da moldura (o da organização já existe em `organizacao.spec.ts`).
- CA10 (R7): dado as telas mexidas, quando a comparação com o canvas é feita (1440 e 390 px, pt-BR), então há capturas em `.capturas/745/` e as divergências vindas da especificação e da issue (D4, D5) estão listadas para o PR.

## 4. Plano técnico

- Dados: migração a criar `backend/src/main/resources/db/migration/V58__unit_trial_limit.sql` (a última hoje é a V57; conferir que V58 segue livre). Na ordem: `unit_settings` ganha `trial_limit integer not null default 2 check (trial_limit between 1 and 3)`; `update unit_settings` copia `trial_limit` de `organization_settings` pela `organization_id`; `alter table organization_settings drop column trial_limit`. As duas tabelas têm `force row level security` (V3): cercar o `update` com `no force row level security` e `force row level security` nas duas, na mesma migração, para a cópia não afetar zero linhas em silêncio quando o usuário do Flyway for dono sem ser superusuário (a coluna antiga é apagada em seguida). Comentário de reversão manual no topo, como na V43. Os inserts de unidade (`Organizations`, `UnitCreation`) usam o padrão da coluna e não mudam; `infra/seed` não cita a coluna.
- API (`docs/openapi.yaml`, sem rota nova): `trialLimit` (`integer`, 1 a 3, obrigatório) sai de `OrganizationRules` e entra em `UnitSettingsView` e `UnitUpdateSettings` (e nos `required`); a descrição do `PUT /units/{id}` cita a faixa. Backend, pacote `organization`:
  - `OrganizationRules`: tirar `trialLimit` do record, do `Request`, de `validate` e de `auditValues`; o comentário passa a falar em quatro regras.
  - `OrganizationProfile`: tirar a coluna do `update` (em `update`) e do `select` de `rules()`, ajustando os índices.
  - `UnitUpdate.Settings`: `Integer trialLimit` ao fim do record; em `validated()`, obrigatório e de 1 a 3, com o campo `settings.trialLimit`.
  - `UnitSettings`: `Settings` ganha `int trialLimit`; entra em `SELECT` (como última coluna, para não mexer nos índices atuais de `detail()`), no `update unit_settings` e em `flat()` (é o que leva antes e depois à auditoria).
- Interface:
  - `features/organization`: `RulesCard` perde o campo de experimentais e o bloco do comprovante (`ComingSoon` e nota); "Guardar aulas experimentais sem matrícula" fica na primeira coluna da grade de duas. `rulesDraft.ts` (`RANGES`, `RulesDraft`, `toDraft`, `toRules`) e `useOrganization.ts` (`OrganizationRules`) perdem o campo.
  - `features/units`: `useUnitSettings.ts` (`UnitSettingsData`) ganha `trialLimit: number`; `unitDraft.ts` (`Draft`, `toDraft`, `toBody`) leva o valor; `UnitLinksTab` ganha um `Card` com `Field` e `Select` (1, 2, 3) depois dos dois links e antes da nota do link desligado, recebendo `errors` opcional; `UnitSettingsPage` passa `errors` à aba, faz `tabOfServerField("settings.trialLimit")` devolver `links` e inclui o campo em `differences()`; `unitTabKit.tsx` (`unitFixture`) ganha o campo.
  - `src/i18n/pt-BR.json`: remover `organization.rules.trialLimit`, `proof` e `proofNote`; criar em `unitSettings.links` o rótulo e a ajuda do limite (D4).
  - `src/mocks/handlers.ts`: tirar `trialLimit` de `initialOrganization.rules` e de `ruleRanges`; pôr `trialLimit: 2` em `defaultUnitSettings()`; no PUT de `/units/{id}`, recusar ausente, não inteiro ou fora de 1 a 3 com o campo `settings.trialLimit`.
  - Carregando, vazio, erro e sem permissão das duas telas não mudam, nem `GraduationDialog`. Os casos já existem em `visual/casos.ts` (`configuracoes-organizacao`, `configuracoes-organizacao-contraste`, `configuracoes-transferir-coordenacao`, `configuracoes-unidade-links`) e a unidade do canvas em `telas.visual.ts` copia `base.settings` do MSW, então nenhum dos dois arquivos muda.
- Segurança: reaproveita `UNIT_SETTINGS` (leitura, e `FULL` para gravar), o filtro por organização, a RLS de `unit_settings` e o `If-Match`; a faixa é validada no servidor, além do `check` do banco. Sem dado pessoal novo.
- Arquivos (30 contáveis, no limite):
  - a criar: `V58__unit_trial_limit.sql` (1).
  - backend (4), em `backend/src/main/java/br/com/ctcore/organization/`: `OrganizationRules.java`, `OrganizationProfile.java`, `UnitSettings.java`, `UnitUpdate.java`.
  - testes do backend (7), em `backend/src/test/java/br/com/ctcore/`: `organization/{OrganizationRulesTest,OrganizationProfileIT,OrganizationsIT,UnitBase,UnitSettingsIT,UnitUpdateValidationTest}.java` e `db/SeedDataIT.java` (grava a coluna antiga num `update organization_settings`). `UnitSettingsRouteIT` usa `UnitBase.payload()` e roda sem alteração.
  - front-end (10), em `frontend/src/`: `features/organization/{RulesCard.tsx,rulesDraft.ts,useOrganization.ts}`, `features/units/{useUnitSettings.ts,unitDraft.ts,UnitLinksTab.tsx,UnitSettingsPage.tsx,unitTabKit.tsx}`, `mocks/handlers.ts`, `i18n/pt-BR.json`.
  - testes do front-end (8): `features/organization/{RulesCard,OrganizationSettingsPage,BrandCard,TransferCoordinationDialog}.test.tsx` (no `OrganizationSettingsPage`, o teste do interruptor "Em breve" passa a provar a ausência), `features/units/UnitSettingsPage.test.tsx`, `mocks/organization.msw.test.ts`, `mocks/unit-settings.msw.test.ts` e `frontend/e2e/configuracao-unidade.spec.ts`. `UnitLinksTab.test.tsx` não muda (por isso `errors` é opcional) e já roda o axe da aba com o campo novo.
  - fora da conta: `docs/openapi.yaml` e as referências do visual. `docs/especificacao/` já traz a regra e não muda.
- Reuso: `UnitSettings.update` (versão, auditoria por campo mudado, "Última alteração"), `Field` e `Select` de `components/ui/field`, `Card`; para provar a CA3 dentro de `UnitSettingsIT`, o padrão de migração em esquema à parte de `GraduationCatalogIT.migrationBackfillsActiveModalities` (`Flyway` com `target("57")`, depois até o fim).
- Riscos: perda do valor antigo na cópia (CA3); o PUT é completo, então qualquer corpo sem `trialLimit` passa a dar 400 (aparece na compilação, no `typecheck` e nos testes); índices posicionais em `UnitSettings.detail` (`UnitSettingsIT`); o conteúdo removido pode aumentar a diferença com `ConfigAcademia` no `visual:canvas` (se passar de 15%, vale a Autonomia 4). Não há folga no limite de 30: arquivo contável fora desta lista precisa ser justificado no arquivo do item.

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

Parte A (banco, servidor e contrato): T1 e T2. Parte B (MSW e tela): T3 a T6. Cada parte cabe em uma sessão; são um item só.

- [x] T1: criar a V58 e levar o limite para a unidade em `UnitUpdate`, `UnitSettings` e nos esquemas da unidade do `openapi.yaml`; ajustar `UnitBase`, `UnitUpdateValidationTest` e `UnitSettingsIT` (limite por unidade, 0, 4 e ausente, auditoria, 428 e 409, unidade nova com 2, check do banco, migração com cópia) — cobre CA1, CA2, CA3, CA5, CA6 — prova: `./backend/mvnw -f backend/pom.xml test -Dtest=UnitUpdateValidationTest` e `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test='UnitSettingsIT,UnitSettingsRouteIT' -Djacoco.skip=true`
- [x] T2: tirar o campo da organização (`OrganizationRules`, `OrganizationProfile`, `openapi.yaml`) e ajustar `OrganizationRulesTest`, `OrganizationProfileIT`, `OrganizationsIT` e `SeedDataIT` — cobre CA3, CA4 — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OrganizationRulesTest,OpenApiContractTest,ContractRoutesTest'` e `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test='OrganizationProfileIT,OrganizationsIT,SeedDataIT' -Djacoco.skip=true`
- [x] T3: alinhar o MSW (`handlers.ts`) e seus testes, com a conferência em `organization.msw.test.ts` de que ligar o comprovante numa modalidade não muda outra — cobre CA2, CA4, CA8 — prova (em `frontend/`): `npx vitest run src/mocks/organization.msw.test.ts src/mocks/unit-settings.msw.test.ts src/mocks/modalities.msw.test.ts`
- [x] T4: tirar o limite e o comprovante das regras da Organização, com textos e testes — cobre CA7, CA8, CA9 — prova (em `frontend/`): `npx vitest run src/features/organization src/features/modalities/GraduationDialog.test.tsx`
- [x] T5: pôr o limite na aba Links da unidade (rascunho, envio, erro do servidor, conflito, textos), com testes e o e2e salvando o limite e conferindo a moldura — cobre CA5, CA7, CA9 — prova (em `frontend/`): `npx vitest run src/features/units/UnitSettingsPage.test.tsx src/features/units/UnitLinksTab.test.tsx src/i18n && npm run typecheck && npm run e2e -- configuracao-unidade.spec.ts`
- [x] T6: comparar com o canvas (`ConfigAcademia`, `ConfigOrgContraste`, `TransferirCoordenacao`, `ConfigLinks`; 1440 e 390 px, pt-BR, temas em que o canvas existe), salvar em `.capturas/745/` como `<tela>-<largura>-sistema.png` e `<tela>-<largura>-canvas.png`, regerar só as referências dos quatro casos que mudarem e registrar as divergências e a linha `Comparação com o canvas: <min>` — cobre CA9, CA10 — prova (em `frontend/`): `npm run test:visual:docker -- --update-snapshots -g "<caso>"` por caso alterado e `npm run visual:canvas`, com o relatório desses casos conferido

## 6. Decisões

- D1: o limite vai em `settings.trialLimit` do `GET` e do `PUT /units/{id}`, obrigatório no `PUT` como os demais campos de `settings`; sem rota nova, para reaproveitar versão, auditoria e permissão da unidade. Alternativa descartada: rota própria do limite.
- D2 (muda o comportamento): o Administrador passa a alterar o limite das suas unidades; antes só o Coordenador alterava, na organização. Motivo: a RN-AEX-02 diz que o limite é configurado em cada unidade (RF-ORG-04), e o Administrador configura as suas (RF-ORG-02). Alternativa descartada: só o Coordenador, que exigiria permissão que a especificação não prevê.
- D3: `rules.trialLimit` enviado ao `PATCH /organization` passa a ser campo desconhecido, tratado como qualquer outro; a coluna antiga sai na mesma migração, porque não há ambiente publicado até a Sprint 22. Alternativa descartada: manter coluna ou campo por compatibilidade.
- D4: o campo é um cartão próprio na aba Links (nome atual; vira "Divulgação" na #748), com lista de 1 a 3, rótulo "Limite de aulas experimentais por pessoa" e ajuda "Contado pelo telefone, somando as modalidades.". A ajuda não promete "Limite atingido" nem "Liberar mais uma", que ainda não existem. O `ConfigLinks` não desenha o campo e o `ConfigAcademia` o mostra na organização: a especificação vence na regra e o visual usa os componentes base.
- D5 (muda o comportamento): o controle "Exigir comprovante da graduação de origem" e a nota "Pode ser ligado por modalidade" saem inteiros das regras gerais, sem texto substituto. Pedido da issue, que prevalece sobre o `ConfigAcademia`; as diferenças de D4 e D5 no `ConfigAcademia`, no `ConfigOrgContraste`, no fundo do `TransferirCoordenacao` e no `ConfigLinks` são as esperadas e vão listadas no PR.
- D6: a gravação só na modalidade escolhida já funciona e não muda no servidor; a prova são os testes existentes da janela de graduação e uma conferência no `organization.msw.test.ts`, arquivo já alterado, para o item não passar de 30 arquivos.
- Suposição: o `visual:canvas` dos quatro casos continua dentro de 15%. Se não, aplica-se a Autonomia 4 do `AGENTS.md`.

## Construção

- T1: arquivos: `V58__unit_trial_limit.sql` (novo), `UnitUpdate.java`, `UnitSettings.java`, `docs/openapi.yaml`, `UnitBase.java`, `UnitUpdateValidationTest.java`, `UnitSettingsIT.java` (limite por unidade, 400/428/409, migração em esquema à parte). Prova: `mvnw test -Dtest='UnitUpdateValidationTest,OrganizationRulesTest,OpenApiContractTest,ContractRoutesTest'` passou; `UnitSettingsIT` 12/12 e `UnitSettingsRouteIT` 3/3.
- T2: arquivos: `OrganizationRules.java`, `OrganizationProfile.java`, `docs/openapi.yaml`, `OrganizationRulesTest.java`, `OrganizationProfileIT.java`, `OrganizationsIT.java` (o check de 0 e 4 passou para `unit_settings`), `SeedDataIT.java`. Prova: mesma execução da T1; `OrganizationProfileIT` 13/13, `OrganizationsIT` 5/5, `SeedDataIT` 28/28 (61 ITs, 0 falhas, `BUILD SUCCESS`).
- T3: arquivos: `mocks/handlers.ts`, `organization.msw.test.ts` (comprovante numa modalidade não muda outra), `unit-settings.msw.test.ts`. Prova: Vitest da linha abaixo.
- T4: arquivos: `RulesCard.tsx`, `rulesDraft.ts`, `useOrganization.ts`, `pt-BR.json`, `RulesCard.test.tsx`, `OrganizationSettingsPage.test.tsx`, `BrandCard.test.tsx`, `TransferCoordinationDialog.test.tsx`. Prova: Vitest da linha abaixo.
- T5: arquivos: `useUnitSettings.ts`, `unitDraft.ts`, `unitTabKit.tsx`, `UnitLinksTab.tsx`, `UnitSettingsPage.tsx`, `UnitSettingsPage.test.tsx`, `e2e/configuracao-unidade.spec.ts` (salva o limite e confere a moldura). Prova: Vitest da linha abaixo; `npm run typecheck` sem erro; `npm run e2e -- configuracao-unidade.spec.ts` 1/1.
- T6: `npm run test:visual:docker -- --update-snapshots --workers=2 -g " (configuracoes-organizacao|configuracoes-organizacao-contraste|configuracoes-transferir-coordenacao|configuracoes-unidade-links) (1440|390) "` 16 passaram; `npm run visual:canvas -- --exige` 165 comparadas, 0 reprovadas (1440 claro: organização 4,0%, contraste 3,4%, transferir 9,4%, links 2,3%; limite 15%, sem `limiteCanvas`). Capturas em `.capturas/745/`: `<caso>-1440-sistema.png`, `<caso>-390-sistema.png` e `<caso>-1440-canvas.png` dos quatro casos (esses canvas não têm 390 nem escuro). Abertas lado a lado a 1440; a 390, aberta a de transferir coordenação.

Testes do item: os unitários e ITs do back-end citados em T1 e T2 passaram; `npx vitest run` com os três `*.msw.test.ts`, `features/organization`, `GraduationDialog`, `UnitSettingsPage`, `UnitLinksTab` e `i18n` → 15 arquivos, 165/165; `shell.test.ts`, `noInternalAnchors.test.ts` e `routePattern.test.ts` → 268/268; `npm run lint` e `npm run typecheck` sem erro. Segue o padrão de rotas e telas. Não rodaram (são da verificação ou do CI): `build`, `npm test` inteiro, `mvnw test` inteiro e a conferência visual sem `--update-snapshots`.

Referências visuais (em `frontend/visual/referencias/`): `configuracoes-organizacao-1440-{claro,escuro}`, `configuracoes-organizacao-contraste-1440-{claro,escuro}`, `configuracoes-transferir-coordenacao-{1440,390}-{claro,escuro}`, `configuracoes-unidade-links-1440-{claro,escuro}`. As de 390 de organização e links não mudaram (o trecho alterado fica abaixo da dobra).

Divergências do canvas (para o PR): D4, o cartão "Limite de aulas experimentais por pessoa" está na aba Links (o `ConfigLinks` não o desenha e o `ConfigAcademia` o mostra na organização); D5, `ConfigAcademia`, `ConfigOrgContraste` e o fundo do `TransferirCoordenacao` ainda desenham o limite e/ou o comprovante da graduação de origem. As demais (QR e endereço do link, subtítulos, marca) são anteriores ao item.

Desvios: nenhum no plano. Arquivos contáveis: 30, os da lista da seção 4.

Não é do item: `specs/backlog.md`, `specs/projeto.md` e `specs/itens/625-*.md` já estavam alterados antes desta fase e não foram tocados.

### Correção da rodada 1

- CA28 de `EnrollmentWizardPage.test.tsx` quebrado pelo item (o corpo do PUT da unidade não tinha `trialLimit`, agora obrigatório): acrescentado `trialLimit: 2`. Arquivos: `frontend/src/features/students/enrollment-wizard/EnrollmentWizardPage.test.tsx`. É o 31º arquivo contável, fora da lista da seção 4 e acima do limite de 30: é ajuste de uma linha obrigado pela mudança de contrato (risco "o PUT é completo"; o `typecheck` não o pega porque o corpo é JSON solto) e precisa entrar neste PR para a `dev` ficar verde. Nenhum outro teste ou e2e do front-end monta esse corpo à mão (busca por `trialLinkEnabled`). Prova: `npx vitest run` com esse arquivo, os três `*.msw.test.ts` do item, `features/organization`, `GraduationDialog`, `UnitSettingsPage`, `UnitLinksTab`, `i18n` e os três testes de rotas → 16 arquivos, 192/192; `npm run lint` e `npm run typecheck` sem erro. Sem mudança visual.
- Sugestão da rodada 1 (para a descrição do PR): o `ConfigOrgContraste` só desenha o cartão Marca; tirar essa tela da frase de D5.

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 26/11/2026, estado 6e8d34f306bb468537e9af3fd244b531bf8eebde

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `UnitSettingsIT` 12/12 (`trialLimitPerUnit`: duas unidades, versão, auditoria antes e depois, última alteração) |
| CA2 | PASSOU | `UnitSettingsIT.trialLimitRefused`, `UnitUpdateValidationTest` 9/9; MSW em `unit-settings.msw.test.ts` (0, 4, 1.5, ausente; versão continua 0), no `npm test` |
| CA3 | PASSOU | `UnitSettingsIT.migrationCopiesTrialLimit` (V57 até o fim: 3, 3, 1; coluna antiga removida; 0 e 4 recusados) e `OrganizationsIT` 5/5 (unidade nova com 2); V58 é a única nova |
| CA4 | PASSOU | `OrganizationProfileIT` 13/13, `OrganizationRulesTest` e contrato no `mvnw test`; MSW no `npm test` |
| CA5 | PASSOU | `trialLimitRefused` (428 e 409 sem gravar); `UnitSettingsPage.test.tsx`: janela de conflito lista o limite |
| CA6 | PASSOU | `UnitSettingsRouteIT` 3/3 (401, 403 por perfil e Administrador de outra unidade, 404 de outra organização, 200 do Administrador da própria unidade) |
| CA7 | PASSOU | `UnitSettingsPage.test.tsx` (opções, envio, 400 abre Links), `RulesCard` e `OrganizationSettingsPage` no `npm test`; e2e salva e relê o limite |
| CA8 | PASSOU | testes das regras gerais sem interruptor nem nota; `organization.msw.test.ts` (ligar numa modalidade não muda outra) e `GraduationDialog.test.tsx` no `npm test` |
| CA9 | PASSOU | axe a 360 px nos dois temas (`UnitSettingsPage`, `UnitLinksTab`, `OrganizationSettingsPage`) e os três testes de rotas no `npm test`; e2e 5/5; sonda Playwright com MSW a 360 px, claro e escuro, em Organização e na aba Links: `scrollWidth` 360 = `innerWidth` |
| CA10 | PASSOU | capturas de `.capturas/745/` abertas e comparadas (4 telas: sistema 1440 e 390, canvas 1440). Diferenças do item: só D4 e D5; as demais (menu, subtítulos, endereço e QR do link, texto da janela de transferência, campo de cor) não vêm deste diff |

Comandos:
- `./backend/mvnw -f backend/pom.xml test` → 164/164, BUILD SUCCESS
- `verify -Dit.test=UnitSettingsIT,UnitSettingsRouteIT,OrganizationProfileIT,OrganizationsIT,SeedDataIT -Djacoco.skip=true` (comando do AGENTS.md) → 61/61, BUILD SUCCESS
- `frontend/`: `npm run lint`, `typecheck`, `build` → ok; `npm test` → **falhou**, 3051/3053, 2 falhas em 2 de 277 arquivos
- `npm run e2e -- configuracao-unidade.spec.ts organizacao.spec.ts` → 5/5
- visual: no CI do PR

Instáveis:
- `src/features/agenda/AgendaPage.test.tsx` › "CA15: carregando, vazio, erro com Tentar de novo e sem permissão" (não achou "Carregando..."): falhou 1 vez no `npm test` completo e 0 em 3 execuções do arquivo com `--maxWorkers=2` (24/24). O diff não toca `features/agenda`. Não é achado do item.

Achados:
- obrigatório, código, `frontend/src/features/students/enrollment-wizard/EnrollmentWizardPage.test.tsx`, teste "CA28: a etapa 5 lista as cobranças, registra o pagamento no balcão e mostra número e código do recibo" (corpo do PUT em `/api/v1/units/...0021`, perto das linhas 298 a 319) — esperado: `npm test` verde; observado: `expected 400 to be 200` na linha 319, no `npm test` completo e em 3 de 3 execuções do arquivo (26/27); evidência: o `settings` enviado pelo teste não tem `trialLimit`, que o MSW deste item passou a exigir (`mocks/handlers.ts`); regressão causada pelo item (risco "o PUT é completo" da seção 4, que o `typecheck` não pega porque o corpo é JSON solto); corrigir: acrescentar `trialLimit: 2` a esse `settings`. É o 31º arquivo contável, fora da lista da seção 4: justificar em "Construção", como a própria seção 4 pede (ajuste de uma linha obrigado pela mudança de contrato).
- sugestão, código, "Construção" deste arquivo (divergências para o PR) — a captura do `ConfigOrgContraste` só desenha o cartão Marca, sem regras: não mostra o limite nem o comprovante. Tirar essa tela da frase de D5 na descrição do PR.

### Rodada 2 — OK — 26/11/2026, estado 0d8e1c0fcee2efa838340499af308bbe1beb4b9e

Desde o estado 6e8d34f, só mudaram uma linha de `EnrollmentWizardPage.test.tsx` (`trialLimit: 2`) e este arquivo.

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA9 | PASSOU | mantidos da rodada 1; os testes que os provam rodaram de novo e passaram (`mvnw test`, 61 ITs, `npm test`, e2e) |
| CA10 | PASSOU | mantido da rodada 1; nenhuma mudança visual desde então e as capturas de `.capturas/745/` são as mesmas |

Achado obrigatório da rodada 1: corrigido (`npm test` 3053/3053, com o CA28 de `EnrollmentWizardPage.test.tsx`). Nenhum teste de `e2e`, `visual` ou `infra` monta o corpo do PUT da unidade (busca por `trialLinkEnabled`, `trialLimit` e `trial_limit`). O 31º arquivo contável está justificado em "Correção da rodada 1" (desvio de uma linha, obrigado pela mudança de contrato).

Comandos:
- `./backend/mvnw -f backend/pom.xml test` → 164/164, BUILD SUCCESS
- `verify -Dit.test=UnitSettingsIT,UnitSettingsRouteIT,OrganizationProfileIT,OrganizationsIT,SeedDataIT -Djacoco.skip=true` (comando do AGENTS.md) → 61/61, BUILD SUCCESS
- `frontend/`: `npm run lint`, `typecheck`, `build` → ok; `npm test` → 3053/3053 em 277 arquivos
- `npm run e2e -- configuracao-unidade.spec.ts organizacao.spec.ts` → 5/5
- visual: no CI do PR

Instáveis: nenhum nesta rodada (o de `AgendaPage.test.tsx` da rodada 1 não se repetiu).

Achados: nenhum obrigatório. Segue a sugestão da rodada 1 (tirar o `ConfigOrgContraste` da frase de D5 na descrição do PR), já anotada em "Correção da rodada 1".

## Entrega

O que muda: o limite de aulas experimentais por pessoa (RN-AEX-02) passa da organização para cada unidade (banco, servidor, contrato, MSW e tela). Unidade nova nasce com 2; a migração V58 copia o valor da organização para as unidades dela e remove o campo da organização. Toda alteração do limite mostra "Última alteração", grava na auditoria da unidade (antes e depois) e segue o `If-Match` da unidade. Só Coordenador e Administrador da própria unidade leem e alteram. As regras da Organização perdem o controle "Em breve" do comprovante da graduação de origem.

Verificação: rodada 2 `OK` (estado 0d8e1c0). Backend: `mvnw test` 164/164; `verify -Dit.test=UnitSettingsIT,UnitSettingsRouteIT,OrganizationProfileIT,OrganizationsIT,SeedDataIT -Djacoco.skip=true` 61/61. Frontend: lint, typecheck e build ok; `npm test` 3053/3053; e2e `configuracao-unidade` e `organizacao` 5/5. Comparação com o canvas: 165 comparadas, 0 reprovadas no `visual:canvas -- --exige` (limite 15%, sem `limiteCanvas`); capturas em `.capturas/745/`. Visual do CI: a conferir no PR.

Decisões: nenhuma nova. Desvio aceito: `EnrollmentWizardPage.test.tsx` é o 31º arquivo contável, por uma linha (`trialLimit: 2`) exigida pela mudança de contrato (ver "Correção da rodada 1").

Divergências do canvas (para o PR): D4, o cartão "Limite de aulas experimentais por pessoa" fica na aba Links, e o `ConfigLinks` do canvas não o desenha; D5, `ConfigAcademia` e o fundo do `TransferirCoordenacao` ainda desenham o limite e/ou o comprovante da graduação de origem. O `ConfigOrgContraste` só desenha o cartão Marca e não entra em D5. As demais (QR e endereço do link, subtítulos, marca) são anteriores ao item e não vêm deste diff.

Limitações: menu e abertura das unidades (#746), Organização em abas (#747) e a aba Cobrança e Divulgação (#748) ficam fora deste item. Aplicar o limite a pedidos de aula experimental depende de funcionalidade que ainda não existe.

Arquivos que entram no commit além do código do item: `specs/itens/625-configuracoes-quatro-itens-abas.md` (novo) e `specs/projeto.md` (uma linha), da divisão da #625 aprovada pelo dono (P13).

Instável (não bloqueia): `src/features/agenda/AgendaPage.test.tsx` › "CA15: carregando, vazio, erro com Tentar de novo e sem permissão", falhou 1 vez na rodada 1 e não se repetiu.
