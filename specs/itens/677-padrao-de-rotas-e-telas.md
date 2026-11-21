# 677 — Padrão de rotas e telas: regras no AGENTS.md e no design, RNF nova e testes que reprovam tela fora do padrão

Origem: issue #677 (Sprint 10.5, técnica, front-end), `specs/itens/675-moldura-fixa-mapa-de-rotas.md` e `specs/itens/676-estado-da-tela-no-endereco.md` (já entregues), RNF-27 e RNF-43. Branch: `item/677-padrao-de-rotas-e-telas`.

## 1. Objetivo

Escrever, no lugar onde todo agente lê, o padrão de rotas e telas que a #675 e a #676 criaram, e fazer o CI reprovar uma tela que fuja dele. Assim a #611, #624, #625, #630, #645, #640, #122 a #124 e #658 (telas sem especificação ainda) nascem no padrão em vez de copiar o que existia antes. Entrega: regras no `AGENTS.md` e em `docs/design/README.md` ("Rotas e telas"), RNF-56 na especificação, três testes de padrão no `npm test`, o critério "segue o padrão de rotas e telas" na definição de pronto e a correção das especificações que ensinavam o modelo antigo (#88 e D3 da #8).

Fora do escopo: mudar tela, API, contrato OpenAPI ou MSW; mudar o código das rotas (isso foi a #675 e a #676); transformar as telas de acesso (`features/auth`) em rota-pai com `<Outlet />` (D2); alterar a skill `verificar`, que fica fora do repositório (D4).

## 2. Requisitos

- R1: O `AGENTS.md` (regras para todo item) e `docs/design/README.md` (seção nova "Rotas e telas") descrevem o padrão com os sete pontos da issue: moldura da rota-pai; mapa único de rotas com redirecionamento; painel de registro como rota-filha; aba no endereço (`?aba=<id>`); filtros, busca, página e ordem no endereço sempre pelo roteador; carregamento só na área central; página não encontrada e troca de vínculo ao Início. O texto parte do que a #675 e a #676 fizeram.
- R2: A especificação ganha a RNF-56 (próximo número livre em `docs/especificacao/00-visao-geral.md`, depois da RNF-55), escrita do ponto de vista de quem usa, citando a RNF-27 e a RNF-43.
- R3: Um teste de padrão no `npm test` reprova `*Page.tsx` ou componente de tela que importe `ManagementLayout`, `ManagementShell`, `PortalLayout`, `PortalShell` ou `AuthShell` (só as rotas-pai podem), com um caso de prova que reprova um arquivo fora do padrão (D2 para o `AuthShell`).
- R4: Um teste de padrão no `npm test` reprova `window.history` e `window.location` em código de produção para rota interna (amplia o `noInternalAnchors.test.ts` da #643), com um caso de prova.
- R5: Um teste de padrão no `npm test` reprova: `<Route path="...">` do `App.tsx` com endereço literal fora do mapa (só as rotas de acesso e públicas da lista fixa passam, D3); item do menu, aba do celular (gestão e portal) e destino de notificação sem rota no mapa; com um caso de prova para cada reprovação.
- R6: A definição de pronto vale para todo item que cria ou muda tela ou rota: "segue o padrão de rotas e telas" (os testes dos R3 a R5 verdes e um e2e da tela nova abrindo dentro da moldura), registrado no arquivo do item. O critério fica no `AGENTS.md` e em `docs/plano-de-sprints.md` ("Pronto quando (vale para todo item)"), que o `verificar` lê (D4).
- R7: A especificação da #88 (`specs/itens/88-portal-barra-navegacao.md`) e a D3 da #8 (`specs/itens/8-componentes-base-padroes-tela.md`) levam uma nota dizendo que foram substituídas pela #675 e pela #676 e não servem de modelo.
- R8: O `design-readme.test.ts` continua passando com o README alterado.

## 3. Critérios de aceite

- CA1 (R1): dado o `AGENTS.md` e `docs/design/README.md`, então cada um traz os sete pontos do padrão (uma regra por ponto) e o README tem o título "Rotas e telas"; o `design-readme.test.ts` passa (R8).
- CA2 (R2): dado `00-visao-geral.md`, então existe uma única RNF-56 depois da RNF-55, que cita RNF-27 e RNF-43 e descreve só o que quem usa vê (a moldura não some, o endereço guarda o estado, endereço inexistente avisa).
- CA3 (R3): dado o repositório atual, então o teste passa; dado um arquivo `FooPage.tsx` de prova que importa `ManagementLayout`, `PortalShell` ou `AuthShell` (fora de `features/auth`), então a função do teste o reprova.
- CA4 (R4): dado o código de produção atual, então nenhum arquivo (fora de testes e de `src/test`) cita `window.history` nem `window.location`; dado um trecho de prova com `window.history.replaceState(...)` ou `window.location.search`, então o padrão o reprova; `<a href="#conteudo">` e `https://` continuam permitidos.
- CA5 (R5): dado o `App.tsx` atual, então todo `<Route path>` é `P("<id>")`, uma constante do mapa ou um dos endereços da lista fixa de acesso e públicos (`/entrar`, `/esqueci-senha`, `/redefinir-senha/:code`, `/convite/:code`, `/recibo/:codigo`, `/portal/termo`, `/dev/vitrine`, `*`); dado `<Route path="/novo-endereco">` de prova, então reprova.
- CA6 (R5): dado o menu da gestão, as abas do celular da gestão e do portal e `notificationTarget` para todos os tipos de notificação, então cada destino casa com uma rota do mapa (`findRoute`); dado um destino de prova que não existe no mapa, então reprova.
- CA7 (R6): dado `AGENTS.md` e `docs/plano-de-sprints.md`, então ambos trazem o critério "segue o padrão de rotas e telas" com os testes e o e2e dentro da moldura e o registro no arquivo do item.
- CA8 (R7): dado `88-portal-barra-navegacao.md` e `8-componentes-base-padroes-tela.md`, então cada um tem a nota de substituição no topo (a #88) ou junto da D3 (a #8), citando a #675 e a #676, sem alterar o resto do texto.
- CA9 (todos): `npm test`, `npm run lint` e `npm run typecheck` em `frontend/` passam sem tocar em tela, API, contrato ou MSW.

## 4. Plano técnico

- Dados: não muda.
- API: não muda (OpenAPI e MSW intactos).
- Interface: não muda; só documentação e testes.
- Segurança: não se aplica (nenhum acesso novo).
- Arquivos (todos vistos no repositório, exceto os "a criar"):
  - `AGENTS.md`: em "Regras que valem para todo item", novo marcador "Rotas e telas" com as sete regras (curtas, remetem ao README) e o critério de pronto do R6; mencionar os testes de padrão.
  - `docs/design/README.md`: seção nova `## Rotas e telas` depois de `## Regras`, com as sete regras e os nomes reais (`routes.ts`, `ManagementShell`, `PortalShell`, `RoleShell`, `useQueryParams`, `?aba=`). Cuidado: `design-readme.test.ts` lê a tabela "Componentes" a partir de `| No canvas |`; a seção nova fica fora da tabela e não cita nome de componente em tabela.
  - `docs/especificacao/00-visao-geral.md`: RNF-56 logo depois da RNF-55 (linha ~244), no mesmo formato "(Decisão do dono de 20/11/2026.)" das vizinhas; a origem é o teste do dono de 20/11/2026, na issue.
  - `docs/plano-de-sprints.md`: item novo em "### Pronto quando (vale para todo item)" (linha ~91).
  - `specs/itens/88-portal-barra-navegacao.md` e `specs/itens/8-componentes-base-padroes-tela.md`: nota de substituição (R7).
  - `frontend/src/components/layout/shell.test.ts` (ou arquivo novo ao lado, `padraoDeTelas.test.ts`, se ficar mais claro): hoje `describe("moldura fixa na rota (CA9)")` já reprova `ManagementLayout|PortalLayout` nos `*Page.tsx` de `src/features`. Ampliar: lista de nomes (`ManagementLayout`, `ManagementShell`, `PortalLayout`, `PortalShell`, `AuthShell`), todos os `*.tsx` de produção de `src/features` (não só `*Page.tsx`) exceto as rotas-pai (`features/permissions/ManagementShell.tsx`, `features/portal/PortalShell.tsx`, `RoleShell`) e os testes; `AuthShell` só vale dentro de `features/auth/` (D2). Função exportável/local `violaMoldura(caminho, texto)` e caso de prova com texto sintético.
  - `frontend/src/test/noInternalAnchors.test.ts`: acrescentar ao padrão `proibido` `window\.history` e `window\.location` (qualquer uso), com caso de prova; a lista de arquivos já ignora `src/test` e `*.test.*`. Confirmar com `grep` que `main.tsx` e o resto de produção não usam (a busca da especificação mostrou zero usos fora de `src/test`).
  - `frontend/src/test/routePattern.test.ts` (a criar): (a) lê `src/App.tsx` e extrai os `path="..."` de `<Route>`; reprova literal que não esteja na lista fixa de acesso/públicos; `P(...)`/`{...}` passam; (b) importa `routes`, `findRoute`, `hrefOf`, `menuGroups`, `notificationTarget`; checa que cada rota com `item` sem `state` tem rota própria e que o menu usa só ids do mapa; checa as abas do celular e do portal e os destinos de notificação (todos os `NotificationType`) com `findRoute`. Primeiro ler `src/components/layout/MobileTabs.tsx`, `src/features/portal/PortalTabs.tsx` e o hook de menu para saber de onde as abas tiram os destinos; se um destino for texto literal fora do mapa, vira falha real e é corrigido no mesmo PR (é código de produção de rota, não tela), ou, se exigir mudança de tela, registrar em "Fora do item".
- Reuso: `routes.ts` (`routes`, `findRoute`, `hrefOf`, `routeById`); `shell.test.ts` e `noInternalAnchors.test.ts` como base; texto da #675 (D1 a D7 e o R10) e da #676 (R1, R4, R5, R9) como texto-base das regras.
- Riscos: (1) teste de arquivo por regex dá falso positivo (comentário citando `window.history`): o padrão ignora linhas de comentário só se já houver ocorrência real, senão o comentário é reescrito; (2) o teste novo de abas/destinos pode achar destino literal hoje fora do mapa; (3) `design-readme.test.ts` quebra se a seção nova bagunçar a tabela; (4) texto do `AGENTS.md` já é longo: as regras entram curtas e remetem ao README.

## 5. Tarefas

- [x] T1: Escrever a RNF-56 em `00-visao-geral.md` depois da RNF-55 — cobre CA2 — prova: `grep -c "RNF-56" docs/especificacao/00-visao-geral.md` (esperado 1 definição) e leitura da linha
- [x] T2: Escrever as regras em `AGENTS.md` ("Rotas e telas" e o critério de pronto) e a seção `## Rotas e telas` em `docs/design/README.md` — cobre CA1, CA7 — prova: em `frontend/`, `npx vitest run src/components/design-readme.test.ts`
- [x] T3: Critério de pronto em `docs/plano-de-sprints.md` e notas de substituição na #88 e na D3 da #8 — cobre CA7, CA8 — prova: `grep -n "padrão de rotas e telas" docs/plano-de-sprints.md AGENTS.md` e `grep -n "#675" specs/itens/88-portal-barra-navegacao.md specs/itens/8-componentes-base-padroes-tela.md`
- [x] T4: Teste de padrão da moldura (ampliar `shell.test.ts`, com caso de prova) — cobre CA3 — prova: em `frontend/`, `npx vitest run src/components/layout/shell.test.ts`
- [x] T5: Ampliar `noInternalAnchors.test.ts` com `window.history` e `window.location` e caso de prova — cobre CA4 — prova: em `frontend/`, `npx vitest run src/test/noInternalAnchors.test.ts`
- [x] T6: Criar `src/test/routePattern.test.ts` (rotas do `App.tsx`, menu, abas do celular e do portal, destinos de notificação) com um caso de prova por reprovação — cobre CA5, CA6 — prova: em `frontend/`, `npx vitest run src/test/routePattern.test.ts`
- [x] T7: Regressão do front: `npm test`, `npm run lint`, `npm run typecheck` (só os erros antigos de `e2e/` são aceitos) e conferir que nenhuma tela, API, contrato ou MSW mudou (`git diff --stat`) — cobre CA9 — prova: em `frontend/`, `npm test && npm run lint && npm run typecheck`

## 6. Decisões

- D1: As regras do padrão ficam no `AGENTS.md` curtas (uma linha cada, sete pontos mais o critério de pronto) e completas em `docs/design/README.md`. Motivo: o `AGENTS.md` já é longo e o README é o documento de design que o agente abre por tela; a issue pede os dois. Alternativa: texto completo nos dois, descartada por duplicar e divergir.
- D2: O `AuthShell` só é proibido fora de `features/auth/`. As telas de acesso (`LoginPage`, `ForgotPasswordPage`, `InvitePage`, `ResetPasswordPage`, `TwoFactorRequiredPage`, `TwoFactorStep`) o importam hoje porque ele leva `title` e `subtitle` por tela; trocá-lo por rota-pai com `<Outlet />` mudaria a estrutura de todas elas e a issue diz "sem mudança de tela". O teste reprova `AuthShell` em qualquer outro lugar, e a conversão em rota-pai fica como sugestão de item. Alternativa: converter já, descartada por escopo e risco visual. Suposição: o dono aceita essa exceção; se não aceitar, a conversão vira item próprio antes de endurecer o teste.
- D3: A lista fixa de endereços literais permitidos no `App.tsx` são as rotas de acesso e públicas que ficam fora do mapa por não terem moldura nem menu (`/entrar`, `/esqueci-senha`, `/redefinir-senha/:code`, `/convite/:code`, `/recibo/:codigo`, `/portal/termo`, `/dev/vitrine`, `*`) e `TWO_FACTOR_REQUIRED_PATH`. Motivo: o mapa (`routes.ts`) só tem rotas com moldura; levar estas para ele mudaria o mapa da #675. Endereço novo de tela com moldura não entra na lista: entra no mapa.
- D4: O critério "segue o padrão de rotas e telas" é registrado no `AGENTS.md` e em `docs/plano-de-sprints.md`, não na skill `verificar`. Motivo: a skill fica no computador do dono (`~/.claude/skills`), fora do repositório e fora do alcance do agente neste item; o `AGENTS.md` vale para toda sessão e é lido pelo `verificar`. Alternativa: editar a skill, descartada por estar fora do repositório. Sugerir ao dono, no resumo, acrescentar a linha na skill se quiser a conferência explícita.
- D5: A RNF-56 não é regra de negócio nova: consolida a RNF-43 e a RNF-27 depois do que a #675 e a #676 entregaram, e a ordem do número segue a lista (próximo livre, 56). Não é decisão que muda o comportamento do produto.
- Suposição: nenhum arquivo de produção fora das telas importa as molduras além das rotas-pai; se a busca achar outro (por exemplo um componente de teste visual), ele entra na lista de exceções do teste com o motivo.

## Construção

- T1 — arquivos: `docs/especificacao/00-visao-geral.md` (RNF-56 depois da RNF-55) — prova: `grep -c "RNF-56"` → definição única, leitura da linha ok
- T2 — arquivos: `AGENTS.md` (marcador "Rotas e telas" com as sete regras e o critério de pronto), `docs/design/README.md` (`## Rotas e telas`) — prova: `npm test` (inclui `design-readme.test.ts`) → passou
- T3 — arquivos: `docs/plano-de-sprints.md`, `specs/itens/88-portal-barra-navegacao.md`, `specs/itens/8-componentes-base-padroes-tela.md` — prova: `grep -n "padrão de rotas" docs/plano-de-sprints.md AGENTS.md` e `grep -n "#675"` nas duas especificações → presentes
- T4 — arquivos: `frontend/src/components/layout/shell.test.ts` (`violaMoldura`, todos os `*.tsx` de `src/features`, caso de prova; `AuthShell` só em `features/auth/`) — prova: `npx vitest run src/components/layout/shell.test.ts` → passou
- T5 — arquivos: `frontend/src/test/noInternalAnchors.test.ts` (`window.history`/`window.location`, caso de prova) — prova: `npx vitest run src/test/noInternalAnchors.test.ts` → passou; produção sem nenhum uso
- T6 — arquivos: `frontend/src/test/routePattern.test.ts` (novo: `<Route path>` do App, menu, abas da gestão e do portal, notificações, um caso de prova cada) — prova: `npx vitest run src/test/routePattern.test.ts` → passou
- T7 — prova: em `frontend/`, `npm test` → 2993 passaram; `npm run lint` → 0; `npm run typecheck` → 0 erros; nenhuma tela, API, contrato ou MSW alterado (`git status`)
Regressão: só front-end e documentação tocados; back-end e e2e não rodaram (não afetados).
Desvios: abas do portal (`PortalTabs.tsx`) têm `TABS` não exportado; o teste lê os `to:` do arquivo por regex em vez de mudar código de produção. Menu conferido por `menuCatalog` (derivado do mapa), com o id da rota igual ao do item.
Referências visuais: nenhuma (sem mudança visual).

## Verificação

### Rodada 1 — OK — 2026-11-21, estado ab35a90cd342c7186821b7692a014ed514cb4964

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `AGENTS.md` e `docs/design/README.md` ("## Rotas e telas") trazem os sete pontos; `design-readme.test.ts` passou |
| CA2 | PASSOU | RNF-56 única depois da RNF-55, cita RNF-43 e RNF-27, só o que quem usa vê |
| CA3 | PASSOU | `shell.test.ts`: telas atuais passam; caso de prova reprova `ManagementLayout`, `PortalShell`, `AuthShell` fora de `features/auth` |
| CA4 | PASSOU | `noInternalAnchors.test.ts` passou, produção sem uso; prova reprova `window.history`/`window.location`, permite `#conteudo` e `https://` |
| CA5 | PASSOU | `routePattern.test.ts`: App só com literais da lista fixa; prova com `/novo-endereco` reprova |
| CA6 | PASSOU | menu, abas da gestão, abas do portal e todos os tipos de notificação casam com `findRoute`; prova reprova destino fora do mapa |
| CA7 | PASSOU | critério em `AGENTS.md` e `docs/plano-de-sprints.md` |
| CA8 | PASSOU | notas de #675/#676 na #88 (topo) e na D3 da #8, resto intacto |
| CA9 | PASSOU | sem alteração de tela, API, contrato ou MSW (diff só docs e 3 testes) |

Comandos (em `frontend/`): `npx vitest run` dos 4 arquivos do item → 267 passaram; `npm test` → 2993 passaram; `npm run lint` → 0; `npm run typecheck` → 0 erros. Back-end e e2e não afetados (só documentação e testes). Item sem mudança visual: teste visual não se aplica.
Achados:
- sugestão, código, `frontend/src/components/layout/shell.test.ts` `violaMoldura` — o regex de import é por linha; import de várias linhas (`import {\n ManagementShell\n} from`) só é pego se a tela montar `<ManagementShell>`. Aceitável.
- sugestão, especificação — o "Pronto quando" da issue pede o critério "nas regras do `verificar`"; D4 registra que a skill fica fora do repositório e o critério está no `AGENTS.md`, que o `verificar` lê. Sugerir ao dono acrescentar a linha na skill.

## Entrega

**O que muda:** padrão de rotas e telas no `AGENTS.md` (sete pontos) e no `docs/design/README.md` (seção "Rotas e telas"); RNF-56 na especificação, depois da RNF-55, citando RNF-43 e RNF-27; testes que reprovam tela fora da moldura (`shell.test.ts`), âncora interna que não passa pelo roteador (`noInternalAnchors.test.ts`) e endereço fora do mapa fixo de rotas (`routePattern.test.ts`, novo). Sem mudança de tela, API, contrato ou MSW.

**Verificação:** rodada 1 `OK` (estado `ab35a90cd342c7186821b7692a014ed514cb4964`). Desde então só este arquivo e o backlog mudaram. `npx vitest run` dos quatro arquivos do item: 267 passaram; `npm test`: 2993 passaram; `npm run lint` e `npm run typecheck`: sem erro. Item sem tela: teste visual não se aplica.

**Decisões:** a regra de verificação ("nas regras do `verificar`") fica no `AGENTS.md`, porque a skill `verificar` fica fora do repositório (D4 do item). Sugestão ao dono: acrescentar a linha também na skill.

**Limitações:** o teste `violaMoldura` reconhece import de uma linha só; import em várias linhas só é pego se a tela montar `<ManagementShell>` (achado de sugestão na verificação, aceito).

**Regressão:** a base (`origin/dev`, `7ddc2ed`) não avançou desde a verificação, então a regressão da verificação vale; não foi rodada de novo nesta entrega.
