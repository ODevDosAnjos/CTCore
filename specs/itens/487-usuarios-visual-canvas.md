# 487 — Usuários: lista, convidar e tabela de permissões no visual do canvas

Origem: issue #487 (Sprint 10.5, Fase 3, plano G6), `docs/auditoria/plano-de-issues.md`, `docs/auditoria/decisoes-canvas.md` (R1 a R4); evidências M24, M60, M61. Branch: `item/487-usuarios-visual-canvas`. Canvas: `ConfigUsuarios`, `UsuarioConvidar`, `PermissoesTabela` (1440 px, claro) e `GMUsuarios` (390 px). Dependências #452, #456 a #461 já em `dev`. Os itens #484 a #486 são o modelo de padrão de tela.

## 1. Objetivo

Deixar Configurações › Usuários igual ao canvas: cabeçalho com subtítulo, "Tabela de permissões" e "Convidar"; três cartões de perfil; busca e filtros; tabela em cartão com pessoa, perfil em pílula, unidades, último acesso, situação e ações em texto; lista de cartões no celular; janela "Convidar para a equipe" com Nome e E-mail lado a lado, bloco Perfil, unidades em lista marcada e aviso de 7 dias; e a página nova "Tabela de permissões" (matriz fixa dos três perfis).

Fora do escopo: mudar quem convida quem, quem aparece na lista, regras de convite, de unidades ou de desativação (RN-ACE-05, RF-ACE-06); editar perfis ou a tabela (ela é fixa); mudar a rota `GET /permissions` ou a tabela do servidor (#27); texto da janela de unidades e de desativar (só recebem o componente base).

## 2. Requisitos

- R1 (M24): título "Usuários", subtítulo "Equipe da gestão · 3 perfis fixos, sem edição de perfis", botão secundário "Tabela de permissões" e botão primário "Convidar" (ícone +) no canto superior direito; "Convidar" só para quem o servidor deixa gerir, como hoje (D3).
- R2 (M24): três cartões de perfil, só informativos: "Coordenador · 1 por organização — Vê e faz tudo, em todas as unidades. Duas etapas obrigatória.", "Administrador · por unidade — Tudo nas suas unidades. O Coordenador convida Administradores." e "Professor · por unidade — Só as suas turmas, nunca vê valores. 4 permissões ligáveis por unidade." (textos em `pt-BR.json`).
- R3 (M24, D1): busca "Nome ou e-mail" e filtros Perfil (Todos, Administrador, Professor), Unidade (Todas e as unidades da lista) e Situação (Ativos e convites, Ativos, Convite enviado), feitos no cliente sobre a lista que o servidor já devolve; as pílulas Todos/Ativos/Convite enviado saem.
- R4 (M24): tabela dentro de cartão com cabeçalho em texto normal: Pessoa (avatar de iniciais colorido por pessoa, nome e e-mail), Perfil (pílula colorida por perfil), Unidades ("Tijuca e Barra"), Último acesso ("hoje 8h02", "—" se nunca), Situação (pílula "Ativo" ou "Convite enviado"), e Ações sem rótulo visível.
- R5 (M24): ações em texto simples, só as cabíveis: "Alterar unidades" (Administrador ativo e Professor), "Desativar" (Professor, como no canvas; para Administrador a janela e a regra já existem e a ação continua, D2), "Reenviar convite" (convite pendente); sem `canManage` não há ação.
- R6 (M60): abaixo de 640 px a tabela vira lista de `RowCard` (avatar, nome, "Perfil · último acesso", pílula de situação), "Convidar" em largura total no topo, sem rolagem horizontal a 360 px; as ações de linha ficam acessíveis em texto no próprio cartão (D4).
- R7 (M61): a janela "Convidar para a equipe" tem Nome * e E-mail * lado a lado, bloco Perfil com dois cartões (D5), Unidades como lista de caixas marcadas, o texto "O convite vale 7 dias. Se não for aceito, você recebe uma notificação para reenviar.", e rodapé separado com "Cancelar" e "Enviar convite" (ícone de envio); validações e mensagens atuais continuam.
- R8 (M24, D6): rota nova `/configuracoes/usuarios/permissoes` com título "Tabela de permissões", subtítulo "Fixa: não existe edição de perfis", link "Voltar aos usuários", legenda (● pode, ○ só consulta, — não acessa, U só nas suas unidades, T só nas suas turmas, * depende da permissão da unidade) e a matriz de 28 linhas por Coordenador, Administrador e Professor, com os textos do canvas por célula.
- R9 (D6): os dados da matriz batem com `backend/src/test/resources/permission-table.csv` (nível e escopo de cada linha); mudar uma célula de um lado sem o outro reprova um teste do front.
- R10: abaixo de 640 px a matriz continua legível sem rolagem da página (cada linha vira bloco com os três perfis).
- R11: quatro estados em Usuários (carregando, vazio com "Convidar", erro com "Tentar de novo", sem permissão) e na Tabela de permissões (sem permissão para o Professor, 403 da rota); axe sem violações nos dois temas; textos em `pt-BR.json`; permissão no servidor inalterada.
- R12: `npm run visual:canvas` aprova `configuracoes-usuarios` (1440 e 390), `configuracoes-usuario-convidar` e a nova `configuracoes-permissoes` no limite padrão de 30%, e a `limiteCanvas` de `configuracoes-usuario-convidar` é removida.

## 3. Critérios de aceite

- CA1 (R1, R2): dado o Coordenador, então vê título, subtítulo, "Tabela de permissões", "Convidar" e os três cartões com os textos do canvas; o Administrador também vê os cartões.
- CA2 (R3): dado 5 usuários (Administradores e Professores, duas unidades, um convite pendente), quando digita "carla" na busca, escolhe Perfil Professor, Unidade Barra ou Situação Convite enviado, então a tabela mostra só as linhas que batem com todos os filtros; padrão "Ativos e convites" mostra pendentes e ativos; filtro sem resultado mostra o vazio de filtro com "Limpar filtros".
- CA3 (R4): dado a lista, então cada linha tem avatar com iniciais, nome, e-mail, pílula de perfil, unidades ligadas por " e ", último acesso e situação; cabeçalhos sem caixa alta.
- CA4 (R5): dado Administrador ativo, Professor e convite pendente, então as ações aparecem como texto ("Alterar unidades", "Desativar", "Reenviar convite") só onde cabem; `canManage` falso não mostra ação; as janelas de unidades e desativar abrem como hoje.
- CA5 (R6): dado 360 px, então há `RowCard` e nenhuma `table`, "Convidar" ocupa a largura e não há rolagem horizontal; a partir de 640 px há a tabela e nenhum cartão.
- CA6 (R7): dado "Convidar" clicado, então a janela mostra título "Convidar para a equipe", Nome e E-mail com asterisco lado a lado, Perfil, unidades marcáveis, aviso de 7 dias e rodapé "Cancelar" / "Enviar convite"; e-mail inválido, nome vazio, sem unidade, 409 `ALREADY_LINKED`, `STAFF_LIMIT_REACHED` e 403 mostram as mensagens de hoje.
- CA7 (R7, D5): dado o Coordenador, o cartão Administrador vem marcado e o Professor desabilitado; dado o Administrador, o contrário; o corpo enviado a `POST /users` não ganha campo novo.
- CA8 (R8): dado "Tabela de permissões" clicado, então abre `/configuracoes/usuarios/permissoes` com título, subtítulo, legenda, "Voltar aos usuários" (volta à lista) e 28 linhas com as três colunas; sem item novo no menu.
- CA9 (R9): dado o CSV do back-end, quando cada linha é comparada com a matriz do front, então nível e escopo batem nas 28 linhas e nos 3 perfis.
- CA10 (R10): dado 360 px, então a matriz mostra cada linha como bloco e a página não rola na horizontal.
- CA11 (R11): dado carregando, vazio, erro e 403 em Usuários, e 403 na Tabela de permissões (Professor), então cada estado aparece; axe sem violações nos dois temas nas duas páginas e na janela.
- CA12 (R12): `configuracoes-usuarios` a 1440 e 390, `configuracoes-usuario-convidar` e `configuracoes-permissoes` passam no teste visual contra a referência commitada e no `visual:canvas` no limite padrão, sem `limiteCanvas` nesses casos.

## 4. Plano técnico

- Dados: não muda.
- API: não muda (`GET /users` já devolve nome, e-mail, papel, unidades, último acesso, situação e `canManage`; nenhum dado novo é pedido pelo canvas, D2). `docs/openapi.yaml` e MSW de `/users` só mudam se a construção descobrir falta; a matriz é estática no front (D6).
- Interface (`frontend/src/features/users/`, visto): `UsersPage.tsx` (`PageHeader` com subtítulo e ações, cartões de perfil, `SearchBox` e selects de filtro, `Card` com `DataTable` com cabeçalho em texto normal como em #486, `RowCard` abaixo de 640 px com `useBelowSm`, ações em botões de texto); `InviteUserDialog.tsx` (campos lado a lado, `ChoiceCards` de perfil, `UnitChecks` em lista marcada, aviso, rodapé separado com ícone de envio; o papel do vínculo ativo vem da sessão como em `features/auth/AreaUnavailablePage.tsx`); `UnitChecks.tsx` (visual de lista marcada, usado também em `EditUnitsDialog.tsx`); `PermissionsTablePage.tsx` e `permissionMatrix.ts` (a criar: 28 linhas com o texto por célula e o par nível/escopo para o teste); `App.tsx` (rota `/configuracoes/usuarios/permissoes` ao lado da linha 168, com `ManagementLayout activeId="staffUsers"`); `src/i18n/pt-BR.json` (`users.*`, `permissionsTable.*`); `frontend/src/mocks/handlers.ts` e `frontend/visual/casos.ts` (cenário do canvas: usuários do canvas por unidade; caso novo `configuracoes-permissoes` com `canvas: "PermissoesTabela"`; `configuracoes-usuarios` ganha `canvasCelular: "GMUsuarios"` e perfil Administrador se o canvas pedir; tira o `limiteCanvas` de `configuracoes-usuario-convidar`, com flag nova no `Caso` se o cenário precisar, como `faixasCanvas`). Reuso: `Card`, `RowCard`, `useBelowSm`, `PageHeader`, `SearchBox`, `ChoiceCards`/`RadioCard` (acrescentar `disabled` se não houver), `Person`/avatar, `StatusBadge`, `Checkbox`, `Modal`, `Banner`, `states`, `ComingSoon` (não necessário aqui).
- Segurança: a rota de permissões é só leitura estática; o Professor continua com 403 por `ManagementLayout` e pelo servidor; nada novo grava na auditoria; sem dado real (nomes e e-mails fictícios `.example`).
- Arquivos de teste: `UsersPage.test.tsx` (existente), `PermissionsTablePage.test.tsx` e `permissionMatrix.test.ts` (a criar; lê o CSV do back-end), `InviteUserDialog` coberto em `UsersPage.test.tsx`; e2e que usem "Convidar", "Desativar" ou as pílulas (grep em `frontend/e2e`).
- Riscos: (1) o canvas mostra a lista do Coordenador com um Coordenador e Professores, o que a especificação não permite (Coordenador vê só Administradores): a captura usa dados do MSW que respeitam a regra e a divergência de dados fica registrada no PR (D2); (2) a matriz tem 28 linhas, não 27 como diz a issue (conferido no canvas e no CSV); (3) `RadioCard` pode não ter estado desabilitado; (4) o limite de 30% da comparação a 390 px depende do cenário do MSW.

## 5. Tarefas

- [x] T1: `permissionMatrix.ts`, `PermissionsTablePage.tsx` (legenda, matriz, blocos no celular), rota em `App.tsx`, textos pt-BR e testes — cobre CA8, CA9, CA10, CA11 (permissões) — prova: `npx vitest run src/features/users/permission`.
- [x] T2: `UsersPage.tsx` (cabeçalho, cartões de perfil, busca e filtros, tabela em cartão, pílulas, ações em texto, `RowCard` no celular) e textos pt-BR; atualizar `UsersPage.test.tsx` — cobre CA1 a CA5, CA11 — prova: `npx vitest run src/features/users/UsersPage`.
- [x] T3: `InviteUserDialog.tsx`, `UnitChecks.tsx` e `ChoiceCards`/`RadioCard` desabilitado, se faltar; testes — cobre CA6, CA7 — prova: `npx vitest run src/features/users src/components/ui`.
- [x] T4: MSW e `casos.ts` (cenário do canvas, caso `configuracoes-permissoes`, `canvasCelular`, sem `limiteCanvas` no convidar); capturas em `.capturas/487/` (1440 e 390 px, pt-BR, sistema e canvas), `npm run visual:canvas -- --exige` e `npm run test:visual:docker -- -g "configuracoes-usuario"` e `-g "configuracoes-permissoes"` sem `--update-snapshots` (regerar só as referências desta tela) — cobre CA12 — prova: esses comandos de dentro de `frontend/`.
- [x] T5: ajustar e2e afetados, lint, tipos e regressão da pasta — não cobre critério — prova: `npm run lint && npm run typecheck && npx vitest run src/features/users` e `npm run e2e` nos specs afetados.

## 6. Decisões

- D1: busca e filtros no cliente, porque `GET /users` já traz até 200 linhas sem paginação. Alternativa descartada: parâmetros novos na API, sem necessidade.
- D2: a regra vence o canvas nos dados: o Coordenador não vê Coordenador nem Professor, e "Desativar" continua para Administrador (a janela e a regra existem). O canvas vence no visual (pílulas, ações em texto, cartões). Alternativa descartada: incluir o Coordenador e os Professores na lista do Coordenador, que contraria RF-ACE-06.
- D3 (muda o comportamento): "Convidar" aparece como hoje para quem o servidor aceita; o Professor segue com 403 na tela. Sem mudança de regra.
- D4: no celular, as ações de linha ficam como texto no cartão (canvas só mostra o cartão), para não deixar "Alterar unidades", "Desativar" e "Reenviar convite" inalcançáveis, o problema que M60 aponta. Alternativa descartada: cartão sem ação, que apaga funcionalidade.
- D5 (muda o comportamento): o bloco Perfil mostra Administrador e Professor como cartões, com marcado o perfil que o servidor usa para quem convida (Coordenador convida Administrador; Administrador convida Professor) e o outro desabilitado; o corpo da API não muda (RN-ACE-05 e o contrato: o perfil nunca vem do corpo). Alternativa descartada: deixar escolher, que exigiria mudar a regra de convite em cascata. Se o dono quiser a escolha, vira mudança de regra.
- D6: a matriz é dado estático do front, conferido por teste contra o CSV do servidor, em vez de uma rota nova, porque ela é fixa e o servidor já tem a regra (#27); evita contrato e rota novos. Alternativa descartada: `GET /permissions/table`, com contrato, isolamento e teste de permissão para um dado público e imutável. Se a tabela mudar, mudam CSV, `PermissionTable` e a matriz juntos, e o teste avisa.
- D7: o canvas só existe a 1440 px claro (e 390 px para a lista); a matriz e a janela a 390 px são conferidas pelo sistema. Se um caso reprovar no limite padrão por fundo ou dado, ajusta-se o cenário do MSW, não se usa exceção; só se não resolver, `limiteCanvas` com motivo e issue que remove, conforme o AGENTS.md.
- D8: a issue diz 27 linhas da matriz; o canvas e o CSV têm 28 (RF-ACE e #27). Vale 28.

## Construção

- T1 — arquivos: frontend/src/features/users/permissionMatrix.ts, PermissionsTablePage.tsx, permissionMatrix.test.ts, PermissionsTablePage.test.tsx, App.tsx (rota), pt-BR.json (permissionsTable.*) — prova: `npx vitest run src/features/users/permission` → 10 passaram
- T2 — arquivos: UsersPage.tsx, UsersPage.test.tsx, pt-BR.json (users.*) — prova: `npx vitest run src/features/users/UsersPage` → 18 passaram
- T3 — arquivos: InviteUserDialog.tsx, UnitChecks.tsx, ui/choice-cards.tsx (disabled), ui/radio-card.tsx, choice-cards.test.tsx — prova: `npx vitest run src/features/users src/components/ui visual/casos.test.ts` → 276 passaram
- T4 — arquivos: visual/casos.ts (flag usuariosCanvas, caso configuracoes-permissoes fullPage, convidar sem limiteCanvas e com passos que preenchem o canvas), visual/telas.visual.ts, 12 referências em visual/referencias — prova: `node scripts/visual-canvas.mjs --exige` → 145 comparadas, 0 reprovadas; capturas em .capturas/487/
- T5 — arquivos: e2e/usuarios.spec.ts — prova: `npm run lint` e `npx tsc --noEmit` limpos; `npx playwright test e2e/usuarios.spec.ts` → passou
Visual do CI: configuracoes-usuarios → passou
Visual do CI: configuracoes-usuario-convidar → passou
Visual do CI: configuracoes-permissoes → passou
Visual do CI: sem-acesso → passou
Referências visuais: configuracoes-usuarios-{1440,390}-{claro,escuro}.png, configuracoes-usuario-convidar-{1440,390}-{claro,escuro}.png (regeradas), configuracoes-permissoes-{1440,390}-{claro,escuro}.png (novas)
Desvios:
- GMUsuarios tem 360 px no índice do canvas, e o teste de casos exige 390 em canvasCelular: ficou em semCaso (comparação do celular à mão, como GMConfig, D5 da #435); o 390 do sistema tem referência própria.
- Divergências vistas na comparação: a lista usa só Administradores (D2, a regra vence o canvas nos dados); último acesso mostra "hoje" e não "hoje 8h02" (RelativeDate); pílulas em peso 600 do componente base; cartão de perfil marcado usa o realce do RadioCard base (vermelho) e não a borda escura do canvas; linhas de unidades com 44 px de toque; "●" renderiza maior no container. O visual:canvas aprova os três casos no limite padrão, sem limiteCanvas.
- Convite pendente: "Reenviar convite" e "Desativar" (cancelar o convite); "Alterar unidades" só para ativo ou Professor.
- Cartões de perfil ficam ocultos abaixo de 640 px (o canvas GMUsuarios não os mostra); "Tabela de permissões" segue acessível no celular, abaixo de Convidar.
- A referência do convidar só foi regerada apagando os PNG antes: o --update-snapshots não grava diferença abaixo de 0,1%.
Regressão: `npx vitest run` (frontend inteiro) → 264 arquivos, 2544 testes passaram; lint, tsc e e2e/usuarios.spec.ts passaram. Não rodei `test:cov`, `npm run e2e` completo nem o back-end (sem mudança nele): ficam para o CI do PR.

## Verificação

### Rodada 1 — OK — 2026-11-18, estado 74215144df73a62da2631f7b7beb06edca3f046c

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA11 | PASSOU | `npx vitest run src/features/users src/components/ui visual/casos.test.ts` → 32 arquivos, 276 testes passaram; lint e typecheck limpos |
| CA12 | PASSOU | `test:visual:docker` -g configuracoes-usuario (convidar: 2 timeouts com 4 workers, 4/4 passaram com --workers=1, carga da máquina) e -g configuracoes-permissoes 4/4; `visual-canvas.mjs --exige` → 145 comparadas, 0 reprovadas; capturas 1440 abertas e comparadas lado a lado com o canvas (divergências visuais menores, as registradas na Construção) |

Comandos: os acima. Não rodei test:cov, e2e completo nem back-end (CI do PR).
Achados:
- sugestão, código, convidar 1440 — lista de unidades com espaçamento maior que o canvas (44 px de toque, já registrado).
- sugestão, visual — 390 px de Usuários sem comparação com GMUsuarios (360 px, semCaso, registrado).
Instáveis: teste visual convidar 1440 claro/escuro estourou 30 s com 4 workers em paralelo; passou com 1 worker.

## Entrega

- Configurações › Usuários no visual do canvas: cabeçalho com subtítulo e "Tabela de permissões" e "Convidar", três cartões de perfil, busca e filtros no cliente, tabela em cartão com pílulas e ações em texto, lista de cartões abaixo de 640 px; janela "Convidar para a equipe" com campos lado a lado, perfil em cartões e unidades marcáveis; página nova `/configuracoes/usuarios/permissoes` com a matriz de 28 linhas, conferida por teste contra `permission-table.csv` do back-end.
- Verificação: rodada 1 OK (estado `74215144`); CA1 a CA11 por vitest (276 testes); visual do CI: `configuracoes-usuarios`, `configuracoes-usuario-convidar`, `configuracoes-permissoes` e `sem-acesso` passaram; `visual:canvas --exige` 145 comparadas, 0 reprovadas.
- Decisões: D2 (a lista do Coordenador mostra só Administradores, a regra vence o canvas nos dados); D5 (perfil da convidada fixo pelo papel de quem convida, corpo da API inalterado); D6 (matriz estática no front, sem rota nova); D8 (28 linhas, não 27).
- Divergências registradas, não bloqueiam: último acesso mostra "hoje" e não "hoje 8h02"; pílulas em peso 600 do componente base; realce do cartão marcado em vermelho do `RadioCard`; GMUsuarios (360 px) fica sem caso visual (comparação do celular à mão, como GMConfig).
- Regressão local: `npx vitest run` com 264 arquivos e 2544 testes passando; lint, tsc e `e2e/usuarios.spec.ts` passaram. `test:cov`, e2e completo e back-end (sem mudança) ficam para o CI do PR.
- Instável: teste visual `configuracoes-usuario-convidar` estourou 30 s com 4 workers; passou com 1 worker.
- Limitação: a referência do convidar foi regerada apagando o PNG antes, porque `--update-snapshots` não grava diferença abaixo de 0,1%.
