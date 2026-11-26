# 732 — 721a · Cabeçalhos sem subtítulo: Configurações, Administradores e Início

Origem: issue #732 (parte a da #721, parte e da #646; RNF-45 em `docs/especificacao/00-visao-geral.md`; decisões 33 e 34 de `docs/auditoria/decisoes-canvas.md`). Branch: `item/732-cabecalhos-config-administradores-inicio`. Requisitos de partida: `specs/itens/721-cabecalhos-config-conta-portal.md`. Modelo: `specs/itens/720-cabecalhos-comunicacao.md`.
Tempos: especificar 2 · construir 11 · verificar 15 (regressão 11; 1 rodada) · entregar 2
Comparação com o canvas: 6

## 1. Objetivo

Nas telas de Configurações (Organização, índice, Unidades, Nova unidade, configuração da unidade, tabela de permissões, Termos e Textos), em Administradores e no Início da gestão, tirar o subtítulo com a unidade, as contagens soltas, as frases e as notas de regra interna (RNF-45), e apagar do `pt-BR.json` as chaves que ficarem sem uso.

Fora do escopo: Minha conta, duas etapas, convite, portal e a conferência final tela por tela de toda a #646 (#733); mudar layout, API ou regra de negócio; redesenhar Início (#122 a #124) ou a tabela de permissões. A #732 não fecha a #721 nem a #646.

## 2. Requisitos

- R1: Os cabeçalhos de Organização, Tabela de permissões, Unidades, Nova unidade, configuração da unidade, Termos e Textos ficam sem subtítulo; título, "Última alteração" e ações continuam.
- R2: Administradores fica sem subtítulo; o total "Vagas ativas: R$ …/mês" sai do cabeçalho e vira uma linha no corpo da tela, com o mesmo texto; o custo por linha não muda. (D1)
- R3: O Início da gestão (Coordenador, Administrador e Professor) perde a linha "Unidade: …" / "Você está vendo todas as unidades, só para consulta.".
- R4: Saem as notas de regra: a do cartão da marca (Organização), a do uso de imagem (Termos), a do nome curto (lista de Unidades) e "Assinatura e Unidades aparecem só para o Coordenador." (índice de Configurações).
- R5: Ficam: dicas junto de campo, chave ou opção, a legenda da tabela de permissões, o aviso da janela "Ajustar o nome curto", os custos e o "sem devolução" das janelas de Administrador e os avisos de estado com orientação (`organization.readOnly`, `unitScope.chooseToEdit`, `units.limitReached`, `texts.welcomeNote`, `texts.editor.linkNote`, `texts.editor.readOnly`).
- R6: Chaves sem uso saem do `pt-BR.json`; quatro estados, rotas e API não mudam e o padrão de rotas e telas do `AGENTS.md` é seguido; os testes passam a conferir a ausência; só as referências visuais das telas desta parte são regeradas, com a comparação com o canvas (1440 e 390 px, pt-BR) e a lista tela por tela na descrição do PR.

## 3. Critérios de aceite

- CA1 (R1): dado o Coordenador em Organização, Tabela de permissões, Unidades (com uma e com várias ativas), Nova unidade, configuração de uma unidade, Termos e Textos, quando a tela abre, então o cabeçalho não tem o subtítulo anterior; "Última alteração" (onde existe), título e botões continuam.
- CA2 (R2): dado Administradores com vagas ocupadas, quando a tela abre, então não há "Quem gere as unidades com você", e "Vagas ativas: R$ 100,00/mês" aparece uma vez, fora do `header` da página; o custo por linha é o mesmo.
- CA3 (R3): dado o Início da gestão com uma unidade escolhida ou em "Todas as unidades", então não há linha "Unidade: …" nem "só para consulta" no conteúdo; o seletor da moldura continua mostrando a unidade e o cartão de aniversariantes do Administrador e do Professor continua.
- CA4 (R4): dadas Organização, Termos, a lista de Unidades e o índice de Configurações (como Administrador), então as quatro notas de R4 não aparecem.
- CA5 (R5): dados a janela "Ajustar o nome curto", a tabela de permissões, a configuração da unidade em "Todas as unidades", o texto de boas-vindas e as janelas de convite, alteração de unidades e desativação de Administrador, então os textos de R5 continuam.
- CA6 (R6): `npm run lint`, `npm run typecheck`, `npm run build` e `npm test` passam e o `grep` das chaves removidas (comando da T4) em `src`, `e2e` e `visual` não acha uso.
- CA7 (R6): os casos visuais das telas desta parte batem com as referências regeradas, `visual:canvas` não reprova nenhum deles (ou a divergência entra conforme a autonomia 4 do `AGENTS.md`) e os e2e `organizacao`, `unidades`, `nova-unidade`, `configuracao-unidade` e `usuarios` passam, com as telas dentro da moldura.

## 4. Plano técnico

- Dados: não muda.
- API: não muda (contrato e MSW inalterados).
- Segurança: não muda (nenhuma permissão, rota ou dado novo; a barreira continua no servidor).
- Interface (arquivos vistos, em `frontend/src`; `PageHeader` mantém a propriedade `subtitle`, usada em outras telas):
  - `features/organization/OrganizationSettingsPage.tsx`: tirar `subtitle` do `PageHeader` (~197).
  - `features/organization/BrandCard.tsx`: tirar o `<p>` de `organization.brandNote` (~128).
  - `features/users/PermissionsTablePage.tsx`: tirar `subtitle` (~20); a legenda fica.
  - `features/users/AdministratorsPage.tsx`: tirar `subtitle` (~116) e, logo abaixo do `PageHeader`, antes do aviso, pôr `<p className="text-sm text-muted-foreground">` com `administrators.total`; `total` não muda.
  - `features/units/UnitsPage.tsx`: tirar `subtitle` (~38) e o `<p>` de `units.shortNameNote` (~134); `active` continua nos botões de desativar.
  - `features/units/NewUnitPage.tsx`: tirar `subtitle` em `Content` (~316).
  - `features/units/UnitSettingsPage.tsx`: tirar `subtitle` em `Detail` (~229); o nome curto continua no campo da aba Dados (`UnitDataTab`).
  - `features/units/SettingsIndexPage.tsx`: tirar o `<p>` de `settingsIndex.adminNote` (~56) e o que fica sem uso (`role`, `state`, `useSession`).
  - `features/terms/TermsPage.tsx`: tirar o `<p>` de `terms.imageNote` (~156) e `subtitle` (~166).
  - `features/texts/TextsPage.tsx`: tirar `subtitle` (~217).
  - `App.tsx` (`Home`): tirar `<ScopeLine />` (~87) e o import (~19).
  - `features/units/UnitSwitcher.tsx`: apagar `ScopeLine` e o import de `useTranslation`.
  - `i18n/pt-BR.json`: apagar `organization.subtitle`, `organization.brandNote`, `permissionsTable.subtitle`, `administrators.subtitle`, `units.subtitle_one`, `units.subtitle_other`, `units.shortNameNote`, `units.new.subtitle`, `unitSettings.subtitle`, `terms.subtitle`, `terms.imageNote`, `texts.subtitle`, `settingsIndex.adminNote`, `unitScope.scopeAll`, `unitScope.scopeOne`. `administrators.total` e `portalAgenda.scopeAll` ficam.
- Testes a ajustar (achados por `grep`): `OrganizationSettingsPage.test.tsx` (~414), `BrandCard.test.tsx` (~40), `PermissionsTablePage.test.tsx` (~43), `AdministratorsPage.test.tsx` (~115), `UnitsPage.test.tsx` (~60, ~75, ~82-86), `NewUnitPage.test.tsx` (~89), `UnitSettingsPage.test.tsx` (~108), `SettingsIndexPage.test.tsx` (~57, ~66), `TermsPage.test.tsx` (~132-149), `TextsPage.test.tsx` (~87), `features/units/UnitScope.test.tsx` (~52 usa "Unidade: Unidade A" como sinal de carregado: trocar pelo `group` "Unidade ativa: Unidade A" com `findAllByRole`; ~66 passa a conferir a ausência). Nenhum e2e cita os textos removidos. `NoClassDaysPage`, `OneOffChargeDialog`, `PlanFormDialog` e `PortalFinancePage` têm "Unidade: …" de outras chaves e não mudam.
- Visual (`frontend/visual/casos.ts`, sem caso novo; referências em `frontend/visual/referencias`): `inicio`, `inicio-professor`, `configuracoes`, `configuracoes-organizacao`, `-organizacao-contraste`, `-transferir-coordenacao`, `configuracoes-unidades`, `configuracoes-unidade` e todos os `configuracoes-unidade-*`, `configuracoes-permissoes`, `configuracoes-termos`, `configuracoes-textos`, `administradores` e `administradores-*`. `sem-acesso` não tem cabeçalho e as telas de modalidades e faixas etárias não mudam. A moldura não muda. Título de cada teste: `<caso> <largura> <tema>`.
- Reuso: `PageHeader`, `administrators.total`, `formatCurrency`.
- Riscos: teste que usava o texto removido para esperar o carregamento passa a falhar ou a conferir cedo demais (esperar por outro elemento antes de afirmar ausência); referência de tela de outra parte que mude é erro do item e é investigada.
- Tamanho: 24 arquivos contáveis (12 de código, `pt-BR.json` e 11 de teste), dentro do limite de 30.

## 5. Tarefas

Duas partes, cada uma construível em uma sessão (podem ser feitas na mesma).

Parte 1: Organização e Unidades

- [x] T1: Organização (cabeçalho e cartão da marca), Unidades, Nova unidade, configuração da unidade e índice de Configurações: tirar subtítulos e notas, e ajustar os testes para a ausência — cobre CA1, CA4, CA5 — prova: `cd frontend && npm test -- OrganizationSettingsPage BrandCard UnitsPage NewUnitPage UnitSettingsPage SettingsIndexPage`

Parte 2: Termos, Textos, Administradores, Início e fechamento

- [x] T2: Termos, Textos, Tabela de permissões e Administradores (total no corpo, com teste de que está fora do `header`): tirar subtítulos e nota, e ajustar os testes — cobre CA1, CA2, CA4, CA5 — prova: `cd frontend && npm test -- TermsPage TextsPage PermissionsTablePage AdministratorsPage`
- [x] T3: Início: tirar `ScopeLine` de `App.tsx` e `UnitSwitcher.tsx` e ajustar `UnitScope.test.tsx` — cobre CA3 — prova: `cd frontend && npm test -- UnitScope`
- [x] T4: Apagar do `pt-BR.json` as chaves da seção 4, depois de conferir por `grep` — cobre CA6 — prova: `cd frontend && ! grep -rnE "(organization|permissionsTable|administrators|units|units\.new|unitSettings|terms|texts|unitScope|settingsIndex)\.(subtitle(_one|_other)?|brandNote|imageNote|shortNameNote|adminNote|scopeOne|scopeAll)\b" src e2e visual && npm run typecheck && npm run lint`
- [x] T5: Gerar as capturas do sistema e do canvas em `.capturas/732/` (1440 e 390 px, pt-BR, `<tela>-<largura>-sistema.png` e `-canvas.png`), rodar `npm run visual:canvas`, regerar só as referências dos casos da seção 4, registrar `Comparação com o canvas: <min>` e a lista tela por tela (com as divergências e como foram resolvidas) para o PR — cobre CA7 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots -g " (inicio|inicio-professor|configuracoes|administradores[a-z-]*|configuracoes-(organizacao|organizacao-contraste|transferir-coordenacao|unidades|unidade|unidade-[a-z-]+|permissoes|termos|textos)) (1440|390) " && npm run visual:canvas -- --exige` (conferir no `git status` que só mudaram referências desses casos)

## 6. Decisões

- D1 (muda o comportamento): o total "Vagas ativas: R$ …/mês", pedido pela especificação da #611, não é contagem solta (é o custo que o Coordenador paga) e passa para uma linha no corpo, com o mesmo texto, mostrada nas mesmas situações de hoje, inclusive com a lista vazia. Vem do R2 da #721. Alternativa descartada: apagar o total.
- D2: Em "nova unidade", o item cobre o cabeçalho; os textos dos passos do assistente e das abas da configuração são dicas de campo ou de escolha e ficam (R5).
- D3: A nota do nome curto sai da lista porque a janela "Ajustar o nome curto" já diz que só se ajusta uma vez e que o endereço antigo leva ao novo (RN-ORG-15 não muda). O link de exemplo da nota não ganha substituto.
- D4: `ScopeLine` é apagado, não escondido: só o Início o usa e a unidade já está no seletor da moldura.
- D5: Sem caso visual novo; Administradores continua sem canvas (#611) e segue a especificação e os componentes base. Onde o canvas ainda mostra os subtítulos, vale a decisão 33.
- D6: A divisão da #721 (P11, dono, 26/11/2026) já deixa este item dentro do limite de 30 arquivos; as mudanças de código são remoções, por isso as duas partes da seção 5 não viram novas issues.

## Construção

- T1 — arquivos: `OrganizationSettingsPage.tsx`, `BrandCard.tsx`, `UnitsPage.tsx`, `NewUnitPage.tsx`, `UnitSettingsPage.tsx`, `SettingsIndexPage.tsx` e os seis testes — prova: `npm test` dos itens de T1 a T3 numa execução só → 11 arquivos, 161 testes passaram.
- T2 — arquivos: `TermsPage.tsx`, `TextsPage.tsx`, `PermissionsTablePage.tsx`, `AdministratorsPage.tsx` (total em `<p>` abaixo do `PageHeader`) e os quatro testes (CA2 confere que o total está fora do `header`) — prova: a mesma execução → passou.
- T3 — arquivos: `App.tsx`, `UnitSwitcher.tsx` (`ScopeLine` apagado), `UnitScope.test.tsx` — prova: a mesma execução → passou.
- T4 — arquivo: `i18n/pt-BR.json` (15 chaves apagadas) — prova: `grep` das chaves em src, e2e e visual sem resultado; `npm run typecheck` e `npm run lint` → passaram.
- T5 — prova: `npm run test:visual:docker -- --update-snapshots --workers=2 -g "<regex da T5>"` → 96 passaram, só mudaram referências dos casos da seção 4; `npm run visual:canvas -- --exige` → 165 comparadas, 0 reprovadas. Capturas em `.capturas/732/` (sistema 1440 e 390 de todos os casos; canvas onde ele existe; Início também no escuro).
Testes do item: `npm test -- OrganizationSettingsPage BrandCard UnitsPage NewUnitPage UnitSettingsPage SettingsIndexPage TermsPage TextsPage PermissionsTablePage AdministratorsPage UnitScope` → 161 passaram; `npm test -- shell.test noInternalAnchors routePattern` → 314 passaram; `npm run e2e -- organizacao.spec unidades nova-unidade configuracao-unidade usuarios` → 8 passaram (o filtro `organizacao.spec` também pega `escolha-organizacao.spec.ts`). Segue o padrão de rotas e telas.
Regressão: não roda nesta fase (AGENTS.md, "Quem roda o quê"); `build` e `npm test` inteiro ficam para a verificação.
Referências visuais: 94 arquivos em `frontend/visual/referencias/`, claro e escuro, 1440 e 390 px, dos casos `inicio`, `inicio-professor`, `configuracoes`, `configuracoes-organizacao`, `-organizacao-contraste`, `-transferir-coordenacao` (2 dos 4 arquivos deste caso não mudaram), `configuracoes-unidades`, `configuracoes-unidade`, `configuracoes-unidade-{pagamentos,pagamentos-desconectado,lembretes,links,nova,desativar,unica,professor,modalidades-recusa}`, `configuracoes-permissoes`, `configuracoes-termos`, `configuracoes-textos`, `administradores` e `administradores-{alterar-unidades,desativar,convidar}`.

Comparação com o canvas, tela por tela (para o PR). Abertas lado a lado aqui: Unidades e Organização (1440), Configurações e configuração da unidade (390), Início (1440) e Administradores (só sistema, 1440 e 390); as demais foram conferidas pelo `visual:canvas`.

| Tela | O que saiu | Divergência com o canvas e solução |
|---|---|---|
| Organização (e contraste, transferir coordenação) | subtítulo e nota da marca | o canvas ainda mostra os dois; vale a decisão 33 |
| Configurações (índice) | nota sobre Assinatura e Unidades | `GMConfig` (360 px, comparação à mão) ainda a mostra; decisão 33 |
| Unidades (lista, desativar, única) | subtítulo e nota do nome curto | idem; decisão 33 (D3) |
| Nova unidade | subtítulo | idem; decisão 33 (D2) |
| Configuração da unidade (todas as abas e recusa de modalidade) | subtítulo | idem; decisão 33 |
| Tabela de permissões | subtítulo | idem; a legenda fica |
| Termos | subtítulo e nota do uso de imagem | idem; decisão 33 |
| Textos | subtítulo | idem; decisão 33 |
| Início (Coordenador e Professor) | linha da unidade | os painéis do canvas são das #122 a #124, fora do escopo |
| Administradores (e janelas) | subtítulo; total passa ao corpo | sem canvas (#611, D5) |

Nenhum `limiteCanvas` novo.

Desvios: o container da T5 rodou com `--workers=2`; os testes de T1 a T3 rodaram juntos numa execução só.
Não é do item: nada. As mudanças em `specs/backlog.md`, `specs/projeto.md`, `specs/itens/646-cabecalhos-sem-subtitulo.md` e o arquivo da #721 já estavam na pasta antes desta sessão (fases anteriores).

## Verificação

### Rodada 1 — OK — 2026-11-26, estado 11817e4685a58089718ffc3595d934d3e36be16f

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | testes das telas conferem a ausência (161 do item verdes); diff tira só o `subtitle` de cada `PageHeader`; capturas 1440 e 390 sem subtítulo, com título, "Última alteração" e botões |
| CA2 | PASSOU | `AdministratorsPage.test.tsx` (total uma vez, fora do `header`, sem "Quem gere..."; custo por linha); capturas `administradores-*` |
| CA3 | PASSOU | `UnitScope.test.tsx` (uma unidade e "Todas as unidades"); `ScopeLine` apagado; capturas `inicio` e `inicio-professor` sem a linha, com o seletor na moldura e o cartão de aniversariantes no Professor (condição do cartão em `App.tsx` não mudou) |
| CA4 | PASSOU | `BrandCard`, `TermsPage`, `UnitsPage` e `SettingsIndexPage` (como Administrador) conferem a ausência das quatro notas; capturas confirmam |
| CA5 | PASSOU | testes de legenda, "Escolha uma unidade no topo", somente leitura, limite de 10 unidades e "sem devolução" verdes; capturas `administradores-convidar/-alterar-unidades/-desativar` com custo e "sem devolução"; `ShortNameDialog` e as janelas de Administrador sem diff; `texts.welcomeNote` e `linkNote` sem diff em `TextsPage.tsx` e no `pt-BR.json` (`linkNote` aparece na captura de Textos) |
| CA6 | PASSOU | `lint`, `typecheck`, `build` → 0; `npm test` → 277 arquivos, 3048 testes; `grep` da T4 sem resultado |
| CA7 | PASSOU | `npm run e2e -- organizacao unidades nova-unidade configuracao-unidade usuarios` → 8 passaram; `visual:canvas -- --exige` → 165 comparadas, 0 reprovadas; só mudaram referências dos casos da seção 4; as 49 capturas `-sistema.png` são idênticas byte a byte às referências regeradas. Visual: no CI do PR |

Comandos: `npm run lint`, `npm run typecheck`, `npm run build` → 0; testes do item (11 arquivos) → 161 passaram; `npm test` → 3048 passaram; e2e das telas → 8 passaram; `npm run e2e -- moldura-fixa menu-permissoes menu-lateral smoke` (Início dentro da moldura) → 14 passaram; `grep` das chaves → sem uso; `npm run visual:canvas -- --exige` → 0 reprovadas. Back-end não tocado.
Canvas: capturas de `.capturas/732/` abertas lado a lado (1440, Início também no escuro; 390 do sistema em todos os casos; canvas de 390 em Configurações e configuração da unidade). As diferenças ligadas ao item são os subtítulos e notas que o canvas ainda mostra (decisão 33); as demais são anteriores ao item. As sobreposições a 390 px em `configuracoes-unidade-lembretes` e `-pagamentos-desconectado` já estão nas referências da base `54575550`.
Achados:
- sugestão, código, `TextsPage.test.tsx` e testes de `ShortNameDialog` — nenhum teste afirma o texto de `texts.welcomeNote`; uma asserção protegeria o R5.
- sugestão, código, `frontend/e2e` — Termos, Textos e Tabela de permissões não têm spec próprio de e2e (anterior ao item; rotas não mudaram e `shell`/`routePattern` passam no `npm test`).
- sugestão, código, `configuracoes-unidade-lembretes` e `-pagamentos-desconectado` a 390 px — texto sobreposto, anterior ao item; vale conferir se já há issue.

## Entrega

- O que muda: os subtítulos saem dos cabeçalhos de Configurações (índice, Organização, Unidades, Nova unidade, configuração da unidade, Permissões, Termos, Textos) e de Administradores; a linha da unidade sai de Início (Coordenador e Professor); o total de Administradores passa ao corpo da tela; 15 chaves de tradução sem uso saem do `pt-BR.json`.
- Verificação: rodada 1 OK (estado `11817e4685a58089718ffc3595d934d3e36be16f`). `lint`, `typecheck`, `build`, `npm test` (3048 testes), e2e das telas (8) e de moldura (14) passaram; `visual:canvas -- --exige` deu 165 comparadas e 0 reprovadas. O visual por caso sai do job `visual` do CI.
- Decisões: as diferenças com o canvas que sobram (subtítulos e notas que o canvas ainda mostra) seguem a decisão 33 de `docs/auditoria/decisoes-canvas.md`. Nenhum `limiteCanvas` novo.
- Limitações e sugestões da verificação (não bloqueiam): nenhum teste afirma o texto de `texts.welcomeNote`; Termos, Textos e Tabela de permissões não têm spec próprio de e2e; `configuracoes-unidade-lembretes` e `-pagamentos-desconectado` têm texto sobreposto a 390 px, já presente na base.
- Na pasta de trabalho, junto com o item, estavam as mudanças de planejamento da divisão da #721 (`specs/backlog.md`, `specs/projeto.md`, `specs/itens/646-*.md`, `specs/itens/721-*.md`); entram no mesmo commit.
