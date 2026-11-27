# 747 — 625c · Organização em abas

Origem: issue #747 (parte c da #625; requisitos de partida em `specs/itens/625-configuracoes-quatro-itens-abas.md`). Branch: `item/747-organizacao-em-abas`.

Tempos: especificar 2 · construir 37 (2 rodadas) · verificar 22 (regressão 18; 2 rodadas) · entregar 4
Comparação com o canvas: 4 min (fora a geração da suíte visual, 23 min)

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Para o Coordenador e o Administrador: o que vale para a organização inteira fica numa tela só, Configurações › Organização, com as abas Geral, Modalidades, Faixas etárias, Termos e Textos. O menu de Configurações fica com quatro itens, e os endereços antigos levam às abas.

Fora do escopo: abas Cobrança e Divulgação da unidade (#748); Visão geral (#640); retirada da cor (#626); site e redes sociais (#627); Duas etapas (#628); mudança no conteúdo das telas que viram abas (#633 e demais); telas de Assinatura e de Dados e segurança. O titular continua na aba Geral.

## 2. Requisitos

- R1: o grupo Configurações do menu tem só Organização, Unidades, Assinatura e Dados e segurança, nesta ordem; Modalidades, Faixas etárias, Termos e Textos deixam de ser itens, e nenhum item aponta para endereço inexistente. A lista de `/configuracoes` segue o mesmo conjunto. Assinatura e Dados e segurança continuam como hoje ("Em breve"; Assinatura só do Coordenador) (RF-ORG-09).
- R2: `/configuracoes/organizacao` tem as abas Geral, Modalidades, Faixas etárias, Termos e Textos, com a aba em `?aba=<id>`; cada aba mostra o que a tela de origem mostrava (ações, mensagens, janelas, estados e "Última alteração"), com a auditoria como hoje. A Geral mantém nome, logo, cor, titular, regras gerais, coordenação e titular da coordenação com "Transferir coordenação" (RF-ORG-01, RF-ORG-08; D1, D3).
- R3: o tipo de termo da aba Termos continua no endereço, sem tirar o usuário da aba (D2).
- R4: `/configuracoes/modalidades`, `/configuracoes/faixas-etarias`, `/configuracoes/termos` e `/configuracoes/textos` levam à aba correspondente, e os links internos apontam direto para a aba (D4).
- R5: o Administrador vê as cinco abas só em leitura; o servidor continua sendo a barreira, e Professor e portal não entram na tela (RF-ORG-01).
- R6: a tela segue o padrão de rotas e telas (RNF-56), tem os quatro estados, funciona a partir de 360 px, passa no axe nos dois temas, tem textos em pt-BR, casos do teste visual e comparação com o canvas (decisões 19 a 23 de `docs/auditoria/decisoes-canvas.md`).

## 3. Critérios de aceite

- CA1 (R1): dado um Coordenador, quando abre o grupo Configurações, então vê só Organização, Unidades, Assinatura e Dados e segurança, nesta ordem, com os dois últimos desabilitados "Em breve", e `/configuracoes` mostra os mesmos quatro; dado um Administrador, então vê Organização, Unidades e Dados e segurança.
- CA2 (R2): dado um Coordenador em Organização, quando abre sem `?aba=` ou com valor inválido, então vê a Geral; quando troca de aba, então `?aba=` recebe `geral`, `modalidades`, `faixas-etarias`, `termos` ou `textos`, sem entrada nova no histórico, e a aba continua a mesma depois de recarregar. O título (h1) é "Organização" em todas, dentro da moldura, com o item Organização marcado.
- CA3 (R2): dado cada aba, quando é exibida e usada, então o conteúdo, as ações e a "Última alteração" são os da tela de origem, e salvar chama a mesma rota da API de antes. Carregando, vazio, erro e sem permissão da aba aparecem abaixo das abas, que continuam utilizáveis.
- CA4 (R3): dado a aba Termos, quando o usuário troca para "Uso de imagem", então o endereço é `?aba=termos&termo=IMAGE_USE`, ele continua na aba Termos e o tipo continua o mesmo depois de recarregar; `termo` inválido mostra o termo de matrícula.
- CA5 (R4): dado cada um dos quatro endereços antigos, quando é aberto, então o endereço vira `/configuracoes/organizacao?aba=<id>` e a aba correspondente aparece; "Ir para Configurações › Modalidades" (modalidades da unidade) e "Editar textos" (Lembretes) apontam para a aba.
- CA6 (R5): dado um Administrador, quando percorre as cinco abas, então não há controle de alteração que a tela de origem escondia ou desabilitava para ele; dado um Professor ou um perfil do portal, quando abre Organização ou um endereço antigo, então a área é recusada como hoje.
- CA7 (R6): dado cada aba a 360 px e nos dois temas, então não há rolagem horizontal da página nem violação do axe; `shell.test.ts`, `noInternalAnchors.test.ts` e `routePattern.test.ts` passam e há e2e da tela dentro da moldura, trocando de aba e recarregando.
- CA8 (R6): dado os casos visuais das telas mexidas, quando a comparação com o canvas é feita (1440 e 390 px, pt-BR), então há capturas em `.capturas/747/`, o PR lista as divergências que vêm das decisões do dono, e as referências afetadas pela mudança do menu e das abas foram regeradas e listadas no PR.

## 4. Plano técnico

- Dados: não muda.
- API: não muda (nenhuma rota, contrato nem MSW). Cada aba usa os mesmos hooks (`useOrganization`, `useModalities`, `useAgeRanges`, `useTerms`, `useTexts`).
- Interface (caminhos a partir de `frontend/src/`):
  - `routes.ts`: `modalities`, `ageRanges`, `terms` e `texts` deixam de ser `m(...)` e viram `sub(id, <endereço antigo>, "organizationSettings", "ORGANIZATION_SETTINGS", { redirect: "/configuracoes/organizacao?aba=<id>" })`. Com isso saem do menu (`menuCatalog` é derivado). `organizationSettings` não muda.
  - `App.tsx` (`screens`): saem as quatro entradas e os imports; `managementRoutes` já trata `redirect`.
  - `features/organization/OrganizationSettingsPage.tsx`: `OrganizationSettingsPage` passa a ter o `PageHeader` (`organization.title`) e o `Tabs` controlado por `useTabParam(["geral","modalidades","faixas-etarias","termos","textos"])`. O `Content` atual vira a aba Geral no mesmo arquivo: sem o `PageHeader`, com a `LastChange` numa linha no alto, alinhada à direita; o resto (aviso de leitura, formulário, estados) não muda.
  - Renomear (`git mv`) `modalities/ModalitiesPage`, `age-ranges/AgeRangesPage`, `terms/TermsPage` e `texts/TextsPage` para `ModalitiesTab`, `AgeRangesTab`, `TermsTab` e `TextsTab` (componente e teste), porque o `shell.test.ts` exige `PageHeader` em todo `*Page.tsx`. Em cada um sai o `PageHeader`; o botão que era ação dele ("Não achei minha modalidade", "Nova faixa etária") vai para uma linha no alto da aba, alinhada à direita, com a mesma condição de exibição. Os invólucros `Content` + `export` podem virar um componente só. O `shell.test.ts` não muda: ficam 45 páginas e 25 da gestão, exatamente os mínimos dele.
  - `components/ui/useTabParam.ts`: terceiro argumento opcional `param = "aba"`. `TermsTab` usa `useTabParam(KINDS, KINDS[0], "termo")` (D2).
  - `features/units/UnitModalitiesSection.tsx` e `UnitRemindersTab.tsx`: os links viram `` `${hrefOf("organizationSettings")}?aba=modalidades` `` e `...?aba=textos`.
  - `features/units/SettingsIndexPage.tsx`: `ORDER` = organizationSettings, units, subscription, dataSecurity.
  - `i18n/pt-BR.json`: criar `organization.tabs` (rótulo da lista de abas e os cinco nomes: "Geral", "Modalidades", "Faixas etárias", "Termos", "Textos"); tirar de `menu.items` e `settingsIndex.items` as chaves `modalities`, `ageRanges`, `terms` e `texts` (conferir antes que nada mais as usa). Os `*.title` que ficarem sem uso também saem.
- Segurança: não muda. As cinco abas usam a mesma permissão de rota (`ORGANIZATION_SETTINGS`, guarda `RequireArea`); leitura do Administrador e isolamento são do servidor, já cobertos pelos testes das rotas, que continuam no CI. Sem rota nova, não há teste de isolamento novo.
- Arquivos a alterar (contáveis, 28): `routes.ts`, `App.tsx`, `useTabParam.ts`, `OrganizationSettingsPage.tsx`, `ModalitiesTab.tsx`, `AgeRangesTab.tsx`, `TermsTab.tsx`, `TextsTab.tsx`, `SettingsIndexPage.tsx`, `UnitModalitiesSection.tsx`, `UnitRemindersTab.tsx`, `pt-BR.json`; testes `routes.test.ts`, `buildMenu.test.ts`, `SettingsIndexPage.test.tsx`, `useTabParam.test.tsx`, `OrganizationSettingsPage.test.tsx`, `ModalitiesTab.test.tsx`, `AgeRangesTab.test.tsx`, `TermsTab.test.tsx`, `TextsTab.test.tsx`, `modalities/GraduationDialog.test.tsx` (h1 e endereço), `UnitModalitiesSection.test.tsx`, `UnitRemindersTab.test.tsx`; `frontend/e2e/organizacao.spec.ts`, `modalidades.spec.ts`, `faixas-etarias.spec.ts`; `frontend/visual/casos.ts`. Nenhum arquivo novo. Fora da contagem: referências visuais. `TransferCoordinationDialog.test.tsx` e `ManagementShell.test.tsx` usam o endereço e o h1 que não mudam. `e2e/turmas.spec.ts` abre o endereço antigo e passa pelo redirecionamento, sem mudar.
- Reuso: `Tabs`, `useTabParam`, `redirect` do mapa de rotas, `hrefOf`, `LastChange`, os quatro componentes atuais; `UnitSettingsPage` como modelo de abas no endereço.
- Riscos: Termos tem abas dentro de abas e as duas não podem disputar `?aba=` (CA4); testes que abrem o endereço antigo passam pelo redirecionamento e escondem endereço velho, por isso os testes das abas passam a abrir `?aba=`; trocar de aba desmonta a anterior e descarta edição não salva, como hoje acontece ao trocar de item no menu; o limite de 30 arquivos deixa folga de 2 (se o `git status` mostrar o par renomeado como apagado e criado, conta um só); a linha de abas empurra o conteúdo para baixo na comparação com o canvas: se alguma largura passar de 15% no `visual:canvas`, vale a regra 4 de "Autonomia" do `AGENTS.md`.

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

Parte 1 (endereços, menu e abas):

- [x] T1: mapa de rotas (quatro redirecionamentos), `App.tsx`, lista de `/configuracoes` e links internos da unidade — cobre CA1, CA5 — prova: em `frontend/`, `npx vitest run src/routes.test.ts src/features/permissions/buildMenu.test.ts src/features/units/SettingsIndexPage.test.tsx src/features/units/UnitModalitiesSection.test.tsx src/features/units/UnitRemindersTab.test.tsx src/test/routePattern.test.ts`
- [x] T2: Organização com as cinco abas, componentes renomeados para `*Tab`, `useTabParam` com nome de parâmetro, textos e testes das abas (inclui Administrador, estados abaixo das abas, redirecionamento de cada endereço antigo, 360 px e axe nos dois temas) — cobre CA2, CA3, CA4, CA5, CA6, CA7 — prova: em `frontend/`, `npx vitest run useTabParam OrganizationSettingsPage TransferCoordinationDialog ModalitiesTab GraduationDialog AgeRangesTab TermsTab TextsTab shell noInternalAnchors routePattern`

Parte 2 (ponta a ponta e visual):

- [x] T3: e2e: Organização na moldura, troca de aba, tipo de termo após recarregar, endereço antigo, Administrador em leitura, e os specs que usam o menu ou o título antigos — cobre CA2, CA4, CA5, CA6, CA7 — prova: em `frontend/`, `npm run e2e:full -- organizacao modalidades faixas-etarias`
- [x] T4: casos visuais das abas nos endereços `?aba=`; capturas e comparação com o canvas (`ConfigAcademia`, `ConfigOrgContraste`, `TransferirCoordenacao`, `ConfigModalidades`, `ConfigModalidadesAdmin`, `ModalidadeDesativar`, `ModalidadeGraduacao`, `ConfigFaixas`, `ConfigTermos`, `ConfigTextos`, `Sidebar`, `GMConfig`; 1440 e 390 px, pt-BR) em `.capturas/747/`, registrando `Comparação com o canvas: <min>`; como a moldura mudou, regerar as referências afetadas com `npm run test:visual:docker -- --update-snapshots --workers=2` e listá-las caso a caso, investigando mudança que o item não pede — cobre CA7, CA8 — prova: em `frontend/`, `npm run visual:canvas` e a lista das referências alteradas no `git status`

## 6. Decisões

- D1: ids das abas em português no endereço (`geral`, `modalidades`, `faixas-etarias`, `termos`, `textos`), como os trechos dos endereços antigos e as abas de Minha conta. Alternativa: ids em inglês, como na unidade.
- D2 (muda o comportamento): o tipo de termo passa de `?aba=` para `?termo=` (os valores `ENROLLMENT` e `IMAGE_USE` não mudam), porque `?aba=` agora é da aba da Organização. Alternativa: um `?aba=` composto, descartada por fugir do padrão do RNF-56.
- D3: o título da tela é "Organização" em todas as abas e o título de cada tela antiga vira o rótulo da aba; a ação que ficava no cabeçalho passa para o alto da aba. Alternativa: levar o estado de cada aba ao cabeçalho, descartada por exigir mexer nos dados de todas sem mudar o que se vê além da posição.
- D4: o endereço antigo leva só à aba; a busca dele é descartada, inclusive o `?aba=IMAGE_USE` de um favorito antigo de Termos, que abre o termo de matrícula. Alternativa: tela de redirecionamento que converte o parâmetro, descartada por ser código só para favorito de um sistema ainda não publicado.
- D5: as notificações que apontam para Organização não mudam (abrem a Geral).
- Suposição: os canvas das cinco telas não têm a linha de abas, mostram cada uma como item do menu e na trilha, e `ConfigAcademia` mostra "Experimentais por telefone" e o comprovante nas regras (retirados na #745). A divergência vem da decisão 19 e do RF-ORG-01 e não é corrigida para o canvas.

## Construção

- T1 — arquivos (em `frontend/src/`): `routes.ts`, `App.tsx`, `features/units/SettingsIndexPage.tsx`, `UnitModalitiesSection.tsx`, `UnitRemindersTab.tsx`; testes `routes.test.ts`, `features/permissions/buildMenu.test.ts`, `features/units/SettingsIndexPage.test.tsx`, `UnitModalitiesSection.test.tsx`, `UnitRemindersTab.test.tsx` — prova: comando da T1 → 6 arquivos, 78 testes passando.
- T2 — arquivos: `features/organization/OrganizationSettingsPage.tsx` e teste; `ModalitiesTab`, `AgeRangesTab`, `TermsTab`, `TextsTab` (`git mv` dos `*Page`, com os testes); `components/ui/useTabParam.ts` e teste; `i18n/pt-BR.json`; `features/modalities/GraduationDialog.test.tsx`; um caso a mais em `routes.test.ts` (perfil do portal, CA6) — prova: comando da T2 → 15 arquivos, 441 testes passando; `routes.test.ts` → 40 passando.
- T3 — arquivos: `frontend/e2e/organizacao.spec.ts`, `modalidades.spec.ts`, `faixas-etarias.spec.ts` — prova: `npm run e2e:full -- organizacao modalidades faixas-etarias` → 9 passando (o filtro também pega `escolha-organizacao`). `npm run e2e:full -- turmas.spec menu` → 11 passando (`turmas` abre o endereço antigo, sem mudança).
- T4 — arquivos: `frontend/visual/casos.ts` (9 casos passam a abrir `?aba=`) e as referências abaixo — prova: `npx vitest run visual/casos.test.ts` → 169 passando; `npm run test:visual:docker -- --update-snapshots --workers=2` → 664 passando (geração, 23 min); `npm run visual:canvas` → 165 comparadas, 0 reprovadas, nenhum `limiteCanvas` novo. Nas telas mexidas (1440): organização 4,7%, contraste 4,1%, transferir 9,7%, modalidades 1,0%, Administrador 0,2%, desativar 1,3%, graduação 6,4%, faixas 1,8%, termos 0,8%, textos 1,3%.

Testes do item (rodada final): `npm run lint` e `npm run typecheck` sem erro; `npx vitest run` dos arquivos das T1, T2 e `visual/casos.test.ts` → 21 arquivos, 682 testes passando.
Regressão: não roda nesta fase (AGENTS.md, "Quem roda o quê"). A conferência do visual contra as referências commitadas é só do CI.
Tamanho: 28 arquivos contáveis (os pares renomeados contam um).

Capturas em `.capturas/747/`: `<caso>-1440-sistema.png`, `<caso>-390-sistema.png` e `<caso>-1440-canvas.png` para `configuracoes-organizacao`, `-organizacao-contraste`, `-transferir-coordenacao`, `-modalidades`, `-modalidades-administrador`, `-modalidade-desativar`, `-modalidades-graduacao`, `-faixas-etarias`, `-termos`, `-textos` (prefixo `configuracoes`) e `moldura-coordenacao` (`Sidebar`); `configuracoes-1440-sistema`, `configuracoes-390-sistema` e `configuracoes-390-canvas` (`GMConfig`, desenhado a 360 px). Os demais canvas só existem em 1440.

Divergências com o canvas (para o PR), todas de decisão do dono ou de item anterior:
- linha de abas, título "Organização" e trilha "Configurações › Organização" nas cinco telas, e menu com quatro itens (decisão 19, RF-ORG-01 e RF-ORG-09; o canvas ainda mostra cada tela como item do menu);
- a ação que era do cabeçalho ("Não achei minha modalidade", "Nova faixa etária") e a "Última alteração" da Geral ficam no alto da aba, abaixo das abas (D3);
- sem subtítulos (#721); sem "Experimentais por telefone" e comprovante nas regras (#745). Dados do MSW (nomes do topo, titular) diferem, como antes.

Referências visuais: 72 arquivos regerados em `frontend/visual/referencias/`, só de configurações (menu aberto com quatro itens, telas que viraram abas e a lista de `/configuracoes`); nenhuma fora do que o item pede.
- 1440 e 390, claro e escuro: configuracoes, configuracoes-faixa-nova, configuracoes-faixas-etarias, configuracoes-modalidade-desativar, configuracoes-modalidades, configuracoes-modalidades-administrador, configuracoes-modalidades-pedido, configuracoes-organizacao, configuracoes-organizacao-contraste, configuracoes-termos, configuracoes-textos.
- só 1440, claro e escuro (muda o menu lateral; em 390 não há mudança): configuracoes-modalidades-graduacao, configuracoes-permissoes, configuracoes-transferir-coordenacao, configuracoes-unidade, configuracoes-unidade-desativar, configuracoes-unidade-lembretes, configuracoes-unidade-links, configuracoes-unidade-modalidades-recusa, configuracoes-unidade-nova, configuracoes-unidade-pagamentos, configuracoes-unidade-pagamentos-desconectado, configuracoes-unidade-professor, configuracoes-unidade-unica, configuracoes-unidades.

Desvios: o título antigo (`*.title`) das quatro telas saiu do `pt-BR.json`, por ficar sem uso (previsto no plano). `routes.test.ts` ganhou o caso do perfil do portal para o CA6.
Fora do escopo, anotado em "Pendências para o dono": P14 (faixa do Administrador cita "Configurações › Unidade") e P15 (aba ativa fora da vista na linha de abas a 390 px).
Docker: a lista de `docker images` ficou igual antes e depois da suíte visual.

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 27/11/2026, estado e321636aed120780002b54c76d143a93ede457b6

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `buildMenu.test.ts` e `SettingsIndexPage.test.tsx` no `npm test` (só falharam os 2 testes dos achados); e2e `modalidades` e `faixas-etarias`; captura `configuracoes-*` (Administrador: Organização, Unidades, Dados e segurança "Em breve") e menu do Coordenador com os quatro |
| CA2 | PASSOU | `OrganizationSettingsPage.test.tsx` "abas (#747)" (valor inválido, cinco ids, sem entrada no histórico, h1, remontagem) e e2e "organização em abas" (moldura, item marcado, F5) |
| CA3 | PASSOU | testes das cinco abas no `npm test` (ações, rotas gravadas, carregando, vazio, erro e 403 com a linha de abas); o diff dos componentes só tira o `PageHeader` e reposiciona a ação |
| CA4 | PASSOU | `TermsTab.test.tsx` (`?aba=termos&termo=IMAGE_USE`, inválido, favorito antigo), `useTabParam.test.tsx` e e2e com `reload` |
| CA5 | PASSOU | `routes.test.ts`, casos do endereço antigo (o de Organização não muda; os quatro redirecionam), `UnitModalitiesSection.test.tsx`, `UnitRemindersTab.test.tsx` e e2e de `/configuracoes/textos` |
| CA6 | PASSOU | casos de Administrador e Professor por aba, `routes.test.ts` (portal) e e2e do Administrador nas cinco abas |
| CA7 | PASSOU | axe a 360 px nos dois temas nos testes das cinco telas; `shell`, `noInternalAnchors` e `routePattern` sem falha; e2e na moldura; Chromium real a 360 px (script temporário fora do repositório, Vite com MSW), cinco abas, claro e escuro: `scrollWidth` 360 de 360 e 0 violações do axe |
| CA8 | PASSOU | abri as capturas de `.capturas/747/` (sistema 1440 e 390; canvas 1440, e `GMConfig` a 360): as divergências são as listadas em "Construção" (abas, título, trilha, menu, D3) ou anteriores ao item; 72 referências alteradas, todas `configuracoes*`. visual: no CI do PR. A lista no PR fica para a `entregar` |

Comandos (em `frontend/`): `npm run lint`, `npm run typecheck` e `npm run build` sem erro; `npm test` → 2 falhas e 3061 passando (3063; 275 de 277 arquivos); `npm run e2e -- organizacao modalidades faixas-etarias` → 9 passando. Back-end não tocado.
Instáveis: nenhum.
Achados:
- obrigatório, código, `frontend/src/components/ui/useTabParam.ts` linha 6 (comentário) — esperado: `npm test` verde; observado: `src/components/tokens.test.ts` "useTabParam.ts não usa cor fixa" falha, porque `#747` casa com a regex de cor hexadecimal `#[0-9a-fA-F]{3,8}`; evidência: falha no `npm test` e em 3 de 3 execuções do arquivo com `--maxWorkers=2`; corrigir: tirar o `#747` do comentário (ex.: "item 747"), sem mexer no teste.
- obrigatório, código, `frontend/src/features/terms/TermsTab.tsx` linha 162 (comentário) — esperado: `npm test` verde; observado: `src/features/telasCanvas421.test.ts` "terms/TermsTab.tsx não usa cor fixa nem campo solto" falha pelo mesmo `#747`; evidência: falha no `npm test` e em 3 de 3 execuções; corrigir: igual ao anterior.
- sugestão, código, `frontend/src/components/ui` (`Tabs`) — a 390 px, abrindo direto em `?aba=textos`, a aba ativa fica fora da parte visível (captura `configuracoes-textos-390-sistema.png`); já registrada como P15.
- sugestão, código, `frontend/src/i18n/pt-BR.json` `modalities.readOnlyBanner` — cita "Configurações › Unidade"; anterior ao item, já registrada como P14.

### Correção da rodada 1
- os dois achados obrigatórios (`#747` em comentário lido como cor hexadecimal) — arquivos: `frontend/src/components/ui/useTabParam.ts`, `frontend/src/features/terms/TermsTab.tsx` (só o comentário; os testes de guarda não mudaram) — prova: em `frontend/`, `npx vitest run src/components/tokens.test.ts src/features/telasCanvas421.test.ts` junto com os testes do item (T1, T2, `visual/casos.test.ts`) → 23 arquivos, 781 testes passando; `npm run lint` e `npm run typecheck` sem erro.
- Sugestões da rodada (P15 e P14): opcionais, sem mudança. Sem mudança visual: referências e capturas continuam as mesmas.

### Rodada 2 — OK — 27/11/2026, estado 15baca075a07c10442de0c0445240f206918a319

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | mantido da rodada 1; `npm test` e e2e verdes nesta rodada |
| CA2 | PASSOU | mantido da rodada 1; `useTabParam.ts` só mudou no comentário; testes e e2e "organização em abas" verdes |
| CA3 | PASSOU | mantido da rodada 1; testes das cinco abas no `npm test` |
| CA4 | PASSOU | mantido da rodada 1; `TermsTab.tsx` só mudou no comentário; testes e e2e verdes |
| CA5 | PASSOU | mantido da rodada 1; `npm test` e e2e verdes |
| CA6 | PASSOU | mantido da rodada 1; `npm test` e e2e verdes |
| CA7 | PASSOU | mantido da rodada 1; `shell`, `noInternalAnchors`, `routePattern` e axe no `npm test`; e2e na moldura |
| CA8 | PASSOU | mantido da rodada 1 (sem mudança visual desde então). visual: no CI do PR |

Achados da rodada 1: os dois obrigatórios estão corrigidos (comentários sem `#747`; testes de guarda sem alteração e verdes).
Comandos (em `frontend/`): `npm run lint`, `npm run typecheck` e `npm run build` sem erro; `npm test` → 277 arquivos, 3063 testes passando; `npm run e2e -- organizacao modalidades faixas-etarias` → 9 passando. Back-end não tocado. `git diff e321636a 15baca07`: só os dois comentários e o arquivo do item.
Instáveis: nenhum.
Achados: nenhum obrigatório. Sugestões da rodada 1 (P15 e P14) continuam opcionais.

## Entrega

- O que muda: Configurações › Organização vira uma tela com as abas Geral, Modalidades, Faixas etárias, Termos e Textos (`?aba=<id>`, `useTabParam`). Modalidades, Faixas etárias, Termos e Textos saem do menu, que fica com Organização, Unidades, Assinatura e Dados e segurança. Os endereços antigos redirecionam para a aba certa; `/configuracoes/organizacao` não muda de endereço. Os componentes das telas antigas viram `*Tab` sem mudar o que se vê além do título, da trilha e da posição da ação (D3).
- Verificação: rodada 2 da verificação, `OK`, estado `15baca07`. `npm test` 277 arquivos e 3063 testes passando; e2e `organizacao`, `modalidades` e `faixas-etarias` com 9 passando; lint, typecheck e build sem erro; axe a 360 px nos dois temas; Chromium real a 360 px com `scrollWidth` 360 de 360.
- Visual: 72 referências de configurações regeradas e listadas na construção. O resultado do CI por caso vai no comentário de merge.
- Canvas: divergências previstas no PR (linha de abas, título, trilha, menu com quatro itens, ação e "Última alteração" no alto da aba). Nenhum `limiteCanvas` novo.
- Decisões: D3 (ação do cabeçalho no alto da aba). Sem exceção temporária.
- Limitações: P14 (texto da faixa do Administrador cita "Configurações › Unidade") e P15 (a 390 px a aba ativa pode ficar fora da vista na linha de abas) ficam em "Pendências para o dono". Regressão completa roda só no CI.
- Instáveis: nenhum.
