# 464 — Componente base: Estados: carregando, vazio, erro, sem permissão, bloqueio e link vencido

Origem: issue #464 (Sprint 10.5, Fase 2, plano C8), `docs/auditoria/plano-de-issues.md` (C8), `docs/auditoria/decisoes-canvas.md`. Branch: `item/464-estados-base`. Canvas: `EstadoSemAcesso`, `GMSemAcesso`, `SemAcessoM` (pilotos), `EstadoErro`, `GMErro`, `EstadoVazio`, `EstadoCarregando`, `LinkSenhaVencidoM`, `ConviteVencidoM`, `UnidadeDesativar` (referência dos dois últimos estados). Dependência #448 já está em `dev`.

## 1. Objetivo

Dar às telas os estados no padrão do canvas, com a ação de cada um: carregando, vazio, erro, sem permissão, bloqueio e link vencido. Pilotos: a lista de **Alunos** (P1: carregando, vazio, erro e sem permissão da lista) e **Sem acesso** (H1: a tela mantém menu e barra do app e ganha ícone, texto e botão de largura total).

Fora do escopo: migrar as outras telas (cada issue de tela troca na sua; por isso o visual novo é opt-in, D1); usar bloqueio e link vencido em telas reais (`UnidadeDesativar`, `ModalidadeDesativar`, `LinkSenhaVencido`, `ConviteVencido` são das #489 e das telas de unidade e modalidade); "Falar com o suporte" funcional, `retryAt` do login travado, faixa de limite de comunicados, estado sem conexão do portal; mudar API, OpenAPI, MSW (contrato), backend ou regra.

## 2. Requisitos

- R1: base `StateCard` em `components/states`: cartão (borda, canto e fundo dos tokens) com ícone sem círculo, título em caixa alta, texto, corpo livre (`children`) e área de ações; usado pelos seis estados (D2).
- R2: `LoadingState`, `EmptyState`, `ErrorState` e `ForbiddenState` ganham o visual do canvas por meio de `variant="card"` (D1). Sem a prop, nada muda para as telas que ainda não migraram.
  - Carregando: cartão com barras e texto "Carregando…" (`role="status"`); aceita `text`.
  - Vazio: ícone, título, texto e ação sugerida (`action`).
  - Erro: ícone vermelho, título (`title`, padrão "Não foi possível carregar"), texto "Nada foi alterado. Confira a sua conexão e tente de novo.", botão "Tentar de novo" com ícone de atualizar e ação secundária opcional (`secondary`).
  - Sem permissão: ícone de cadeado, título, texto, ação opcional (`action`); só exibe, quem recusa é o servidor.
- R3: novo `BlockedState`: ícone de proibido, título, texto, corpo livre (ex.: `BlockerChecklist`) e ações (ex.: "Entendi").
- R4: novo `LinkExpiredState`: título, texto da validade, corpo livre (campo de e-mail já preenchido, passado pela tela) e ações ("Enviar um link novo", "Voltar para o login").
- R5: **Alunos**: a lista usa os quatro estados no visual do canvas, via opt-in `canvasStates` em `QueryPage` (mesmo caminho do `canvasPagination`); os filtros e a busca seguem acima. Os demais usuários de `QueryPage` (cobranças ainda sem opt-in, etc.) não mudam.
- R6: **Sem acesso** (`AreaUnavailablePage`): estado sem permissão no visual do canvas (cadeado em quadro arredondado, "Esta área não está disponível para o seu perfil", "Se você acha que deveria ter acesso, fale com o Administrador da sua unidade.", botão "Ir para o Início" de largura total) dentro da casca do app: para Coordenador, Administrador e Professor, mantém menu e barra (`ManagementLayout`); para os demais perfis, a casca do portal (D3). O link de trocar organização ou área continua.
- R7: textos só em `pt-BR.json`; cores, fontes e tamanhos só por tokens; axe sem violação nos dois temas; funciona a 360 px sem rolagem lateral; alvo de toque de 44 px nos botões.
- R8: componentes e uso em `docs/design/README.md` (linha "Os quatro estados" passa a "Estados") e na Vitrine, com os seis estados.
- R9: caso visual `sem-acesso` regerado e comparado com o canvas (1440 e 390, pt-BR); caso de Alunos conferido (D4); divergência restante vira `limiteCanvas` com motivo e a issue que a remove.
- R10: nenhuma outra tela muda de aparência (nenhuma outra referência visual muda, salvo a Vitrine e `sem-acesso`).

## 3. Critérios de aceite

- CA1 (R1, R2): dado cada estado com `variant="card"`, então o cartão mostra título em caixa alta, texto e ação; o erro chama `onRetry` ao clicar em "Tentar de novo" e mostra a ação secundária só quando passada; o carregando tem `role="status"`; sem `variant`, a saída é a de hoje (`states.test.tsx` atual segue passando).
- CA2 (R3): dado `BlockedState` com checklist e "Entendi", então título, itens e botão aparecem e o botão dispara a ação.
- CA3 (R4): dado `LinkExpiredState` com campo de e-mail e dois botões, então título, texto, campo e botões aparecem e a ação de reenvio dispara.
- CA4 (R5): dada a lista de Alunos (MSW), quando carrega, está vazia (busca sem resultado), falha (500) ou devolve 403, então aparece o cartão correspondente; "Tentar de novo" recarrega; os filtros seguem visíveis.
- CA5 (R6): dado Professor ou Coordenador em `/sem-acesso` ou em rota negada, então a página mostra título, texto, "Ir para o Início" (largura total) e o menu e a barra do app; dado Aluno, mostra o mesmo estado na casca do portal; sem vínculo ativo, o estado aparece sem menu. `AreaUnavailablePage.test.tsx` segue passando, adaptado.
- CA6 (R7): `npm run lint` sem texto literal; `tokens.test.ts` passa; axe sem violação nos dois temas (Vitrine e `/sem-acesso`); a 360 px sem rolagem lateral em `/sem-acesso` e no estado de erro de Alunos.
- CA7 (R8): `design-readme.test.ts` passa com os blocos descritos.
- CA8 (R9): `npm run test:visual:docker -- --update-snapshots=all -g "sem-acesso|vitrine"` passa; `npm run visual:canvas -- --exige` não reprova; capturas em `.capturas/464/` (`<tela>-<largura>-{sistema,canvas}.png`).
- CA9 (R10): `npm run test:cov` e o e2e passam; `git status` mostra só os PNG previstos.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (visual; recusa e permissão seguem no servidor; sem rota nova, sem mudança em `docs/openapi.yaml`).
- Interface:
  - `frontend/src/components/states/states.tsx` (existe; `LoadingState`, `EmptyState`, `ErrorState`, `ForbiddenState`): cada um ganha `variant?: "card"`; a ramificação visual usa o novo `StateCard`. `ErrorState` ganha `title?`, `secondary?`; `ForbiddenState` ganha `action?`, `title?`, `text?`. Os ramos sem `variant` ficam como estão.
  - `frontend/src/components/states/StateCard.tsx` (a criar): `StateCard({ tone, icon, title, children, actions })`, tom por token (`danger`, `warn`, `neutral`, `ok`); `BlockedState` e `LinkExpiredState` podem ficar no mesmo `states.tsx`, só como wrappers finos; exportar em `components/states/index.ts` (existe).
  - `frontend/src/components/states/states.test.tsx` (existe): casos novos de CA1 a CA3.
  - `frontend/src/components/query/QueryPage.tsx` (existe; trecho `body`): prop `canvasStates` repassa `variant="card"` aos quatro estados e usa `retry` com ícone; `frontend/src/features/students/StudentsPage.tsx` (`Content`, `<QueryPage ...>`) liga `canvasStates`; teste novo ou ampliado em `QueryPage.test.tsx` e `StudentsPage.test.tsx`.
  - `frontend/src/features/auth/AreaUnavailablePage.tsx` (existe): usa `ForbiddenState variant="card"` com `action` "Ir para o Início" (`buttonVariants` de largura total) e `ChooseLinkTrigger`; a casca vem de um pequeno `AreaUnavailableShell` que escolhe `ManagementLayout` (gestão) ou `PortalLayout` (portal), lendo o vínculo ativo como `RequireArea.tsx` (existe). Cuidado: `ManagementLayout.tsx:34` já renderiza `AreaUnavailablePage` quando `groups.length === 0`; nesse caso a página não pode embrulhar-se em `ManagementLayout` de novo (laço): o `ManagementLayout` passa um indicador para renderizar só o estado, sem casca.
  - `frontend/src/i18n/pt-BR.json` (existe): `areaUnavailable.*` (texto novo), `states.*` (erro com "Confira a sua conexão", carregando, bloqueio, link vencido: apenas rótulos padrão, como `states.gotIt`).
  - `frontend/src/dev/Vitrine.tsx` e `docs/design/README.md` (existem): os seis estados e a linha "Estados".
  - `frontend/visual/casos.ts` (existe, linha 104): `sem-acesso` ganha `canvasCelular: "GMSemAcesso"` se o canvas de gestão for a comparação em 390 e `limiteCanvas` reduzido ao que medir; nome e motivo atualizados.
  - `frontend/visual/referencias/`: PNG regerados de `sem-acesso` e `vitrine`.
  - `frontend/e2e/area-indisponivel.spec.ts` (existe): 360 px sem rolagem lateral e menu visível para Professor.
- Reuso: `Card`, `Button`/`buttonVariants`, `BlockerChecklist`, `ComingSoon` (para "Falar com o suporte" nas telas que usarem), `ManagementLayout`, `PortalLayout`, tokens e ícones `lucide-react`.
- Riscos: laço entre `ManagementLayout` e `AreaUnavailablePage`; testes que buscam texto do erro genérico em telas migradas (nenhuma muda, pelo opt-in); axe com `section role="alert"` aninhado; `PortalLayout` exigir contexto que `/sem-acesso` não tem (testar com Aluno).

## 5. Tarefas

- [x] T1: `StateCard`, os quatro estados com `variant="card"`, `BlockedState` e `LinkExpiredState`, textos pt-BR e testes — cobre CA1, CA2, CA3 — prova: `cd frontend && npx vitest run src/components/states`
- [x] T2: opt-in `canvasStates` no `QueryPage` e uso na lista de Alunos — cobre CA4 — prova: `cd frontend && npx vitest run src/components/query src/features/students`
- [x] T3: Sem acesso dentro da casca do app (gestão e portal), sem laço com `ManagementLayout`, testes adaptados — cobre CA5 — prova: `cd frontend && npx vitest run src/features/auth/AreaUnavailablePage.test.tsx src/features/permissions`
- [x] T4: Vitrine, `docs/design/README.md` e axe nos dois temas — cobre CA6, CA7 — prova: `cd frontend && npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev`
- [x] T5: e2e de 360 px em `/sem-acesso` — cobre CA6 — prova: `cd frontend && npx playwright test e2e/area-indisponivel.spec.ts`
- [x] T6: caso visual, referências no container, comparação com o canvas (1440 e 390, pt-BR, `.capturas/464/`) e divergências para o PR — cobre CA8 — prova: `cd frontend && npx vitest run visual/casos.test.ts && npm run test:visual:docker -- --update-snapshots=all -g "sem-acesso|vitrine"` e `npm run visual:canvas -- --exige`
- [x] T7: regressão do front — cobre CA9 — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov && npm run e2e`, e conferir no `git status` que só mudaram os PNG previstos

## 6. Decisões

- D1: o visual novo é **opt-in** (`variant="card"`, `canvasStates` no `QueryPage`), como o `canvasPagination` da #458. Motivo: a issue pede "nenhuma outra tela mudou de aparência sem a sua própria issue" e "cada issue de tela faz a sua troca"; a frase "a mudança se espalha sozinha" vale só onde o componente já era exclusivo da tela. Alternativa: trocar o visual dos quatro estados de uma vez, descartada (mudaria dezenas de referências visuais fora das suas issues).
- D2: um cartão base (`StateCard`) com seis wrappers finos, no lugar de seis componentes novos. Motivo: o canvas repete a mesma estrutura (ícone, título, texto, ações); evita duplicar estilo.
- D3 (muda o comportamento): `/sem-acesso` e a rota negada deixam de usar o layout de login e passam a aparecer dentro da casca do app (gestão com menu e barra; portal com a casca do portal), como `GMSemAcesso`/`SemAcessoM` e o M4 da auditoria. Alternativa: manter o layout de login, descartada: o canvas vence em layout.
- D4: o MSW do teste visual não força erro, vazio nem carregando da lista; por isso os estados de Alunos são provados nos testes de unidade e na Vitrine, e o caso visual comparado com o canvas é o `sem-acesso` (tem `EstadoSemAcesso`, `GMSemAcesso`). Alternativa: criar mecanismo de falha forçada no teste visual, descartada: é infraestrutura de teste independente (sugestão de item `técnica` abaixo).
- D5: o texto da tela Sem acesso segue o canvas de gestão ("Se você acha que deveria ter acesso, fale com o Administrador da sua unidade."); a versão personalizada do `EstadoSemAcesso` (nome da pessoa que administra, botão "Ver minhas turmas" do Professor) e o texto do canvas de login travado dependem de dados e telas da #489 e ficam fora. O botão "Falar com o suporte" do erro não é ligado (sem suporte no sistema): o `secondary` existe no componente e cada tela decide, com `ComingSoon` se o canvas mostrar.
- Suposição: o canvas `EstadoCarregando` e `EstadoVazio` mostram o mesmo cartão do `GMErro` com outro ícone e conteúdo; se a leitura na construção mostrar outra estrutura, ajustar o `StateCard` sem mudar a API dos wrappers. Se estiver errada, o item cresce além de seis tarefas.
- Fora do item (sugestão): item `técnica` para o teste visual forçar erro, vazio e carregando via MSW, para comparar os estados das telas com o canvas.

## Construção

- T1 — arquivos: `components/states/StateCard.tsx` (novo), `states.tsx`, `index.ts`, `states.test.tsx`, `i18n/pt-BR.json` (`states.*`) — prova: `npx vitest run src/components/states` → 12 passam
- T2 — arquivos: `components/query/QueryPage.tsx` (`canvasStates`), `features/students/StudentsPage.tsx`, `QueryPage.test.tsx` — prova: `npx vitest run src/components/query src/features/students` → 197 passam
- T3 — arquivos: `features/auth/AreaUnavailablePage.tsx`, `AreaUnavailableShell.tsx` (novo), `permissions/ManagementLayout.tsx` (`bare`, sem laço), `StateCard`/`ForbiddenState` ganham `level` e `titleRef`, `AreaUnavailablePage.test.tsx`, `RequireArea.test.tsx` (handler de permissões), `telasCanvas419.test.ts` (a página deixou o AuthShell, D3) — prova: `npx vitest run src/features/auth src/features/permissions` → passam
- T4 — arquivos: `dev/Vitrine.tsx`, `docs/design/README.md` (linha "Estados") — prova: `npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev` → 67 passam
- T5 — arquivos: `e2e/area-indisponivel.spec.ts` — prova: `npx playwright test e2e/area-indisponivel.spec.ts` → 1 passa
- T6 — arquivos: `visual/casos.ts`, 8 PNG — prova: `npm run test:visual:docker -- --update-snapshots=all -g "sem-acesso|vitrine"` → 8 passam; `npm run visual:canvas -- --exige` → 103 comparadas, 0 reprovadas; capturas em `.capturas/464/`
Regressão: `npm run lint`, `npm run typecheck` → ok; `npm run test:cov` → 224 arquivos, 2109 testes passam (1ª rodada: `ChargePreviewPage.test.tsx` CA16 falhou por "vários role=status" sob carga e passou sozinho 2 vezes e na 2ª rodada completa; instável, sem relação com o item); `npm run e2e` → 98 passam.
Desvios: (1) `GMSemAcesso` tem 360 px, não 390; a comparação de 390 usa `SemAcessoM` (`canvasCelular`), e o `limiteCanvas` do `sem-acesso` foi removido porque a comparação passa sem ele. (2) `AreaUnavailableShell` em arquivo próprio (o `shell.test.ts` exige PageHeader em todo `*Page.tsx` com `<ManagementLayout`). (3) O botão de trocar organização só é desenhado pela página sem casca; com casca, o da barra já existe. (4) Texto de `areaUnavailable.text` trocado para o do canvas de gestão (D5).
Divergências com o canvas (para o PR): o canvas `EstadoSemAcesso` centraliza o estado na tela sem cartão, com ícone em quadro arredondado, título maior, texto personalizado com o nome de quem administra e botão "Ver minhas turmas" (D5, #489); o sistema mostra cartão no alto com cadeado sem quadro, texto genérico e botão de largura total, como pede R6. Barra de cima: o canvas mostra trilha e sino com contador; fora do item.
Referências visuais: `frontend/visual/referencias/sem-acesso-{1440,390}-{claro,escuro}.png` e `vitrine-{1440,390}-{claro,escuro}.png`
Não é do item: nenhum.

## Verificação

### Rodada 1 — NAO_CONFERIDO — 2026-11-09, estado d8a48bc2e6018f0ae58b0d980cd65e29c10ed512

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `states.test.tsx` (card: caixa alta, onRetry, secondary só quando passado, role=status); suíte de `src/components` verde |
| CA2 | PASSOU | teste "bloqueio" em `states.test.tsx` |
| CA3 | PASSOU | teste "link vencido" em `states.test.tsx` |
| CA4 | PASSOU | `QueryPage.test.tsx` (canvasStates: erro+Tentar de novo+busca visível, vazio, 403, carregando) e `StudentsPage.tsx` liga `canvasStates`; sem teste específico em `StudentsPage.test.tsx` (sugestão) |
| CA5 | PASSOU | `AreaUnavailablePage.test.tsx` (Professor com menu, link `w-full`, Aluno na casca do portal, sem sessão); `ManagementLayout` passa `bare` (sem laço) |
| CA6 | NÃO CONFERIDO | lint e typecheck sem erros; `tokens.test.ts` passa; axe em Vitrine (`Vitrine.test.tsx`) e `/sem-acesso` (`AreaUnavailablePage.test.tsx`, 360 px, dois temas) passam; e2e cobre 360 px sem rolagem em `/sem-acesso`; NÃO há prova de 360 px sem rolagem lateral no estado de erro de Alunos |
| CA7 | PASSOU | `design-readme.test.ts` passa |
| CA8 | PASSOU | capturas em `.capturas/464/` abertas (390 sistema x canvas SemAcessoM); `visual/casos.test.ts` passa; `test:visual:docker` e `visual:canvas` não reexecutados aqui (Docker), aceito o registro da Construção conforme AGENTS (autonomia 2 e 3) |
| CA9 | PASSOU (parcial) | vitest dos diretórios tocados: 89 arquivos, 717 testes passam; diff só toca os PNG previstos (sem-acesso e vitrine); `test:cov` e `e2e` completos não reexecutados, valem os da Construção |

Comandos: `npx vitest run src/components src/features/auth src/features/permissions src/features/students src/features/telasCanvas419.test.ts src/test/a11y.test.tsx src/dev --maxWorkers=2` → 89/717 passam; `npx vitest run visual/casos.test.ts src/components/design-readme.test.ts src/components/tokens.test.ts` → 154 passam; `npm run lint` e `npm run typecheck` → ok.
Instáveis: nenhum visto (ChargePreviewPage CA16 registrado na Construção, não reproduzido).
Achados:
- NÃO CONFERIDO — CA6, "a 360 px sem rolagem lateral no estado de erro de Alunos": nenhum teste (e2e ou unitário) exercita; falta e2e ou verificação em 360 px da lista de Alunos com erro (500).
- sugestão, código, `AreaUnavailablePage.tsx` / R6 — o R6 pede "cadeado em quadro arredondado", o sistema desenha o cadeado sem quadro; a nota de divergência da Construção diz "como pede R6", o que não bate com o texto do R6. Ajustar a nota do PR ou o ícone.
- sugestão, código — ampliar `StudentsPage.test.tsx` para provar o opt-in `canvasStates` (o plano técnico previa).

### Correção da rodada 1
- M4 conferido na tela: o cadeado estava sem quadro (o texto da nota estava errado). Corrigido: `StateCard` ganhou `framed` (quadro arredondado `rounded-card` com fundo do tom, acima do título) e o `ForbiddenState` em cartão o usa — arquivos: `components/states/StateCard.tsx`, `states.tsx`; referências regeradas e aberta `sem-acesso-390-claro.png` (cadeado em quadro âmbar arredondado acima do título) — prova: `npm run test:visual:docker -- --update-snapshots -g "sem-acesso|vitrine"` → 8 passam; `npm run visual:canvas -- --exige` → 103 comparadas, 0 reprovadas
- Nota de divergência corrigida: o cadeado agora está em quadro arredondado, como no canvas; o que ainda difere do canvas `EstadoSemAcesso` é o cartão no alto (sem centralizar na tela), título menor, texto genérico e botão "Ir para o Início" (D5, #489).
- `StudentsPage.test.tsx` ampliado — arquivos: `features/students/StudentsPage.test.tsx` (canvasStates: erro, vazio, carregando e 403 em cartão com a busca acima; quadro do cadeado acima do título; 360 px no estado de erro sem violações no axe) — prova: `npx vitest run src/features/students src/components/states src/components/query src/features/auth` → 344 passam
- Regressão: `npm run lint`, `npm run typecheck` → ok. `test:cov` e `e2e` completos não reexecutados nesta correção (mudança só no ícone do ForbiddenState em cartão).
- Limite: o teste de 360 px é de axe no jsdom; "sem rolagem lateral" no erro de Alunos não é medível em jsdom e continua sem e2e.
Referências visuais: `frontend/visual/referencias/sem-acesso-{1440,390}-{claro,escuro}.png`, `vitrine-{1440,390}-{claro,escuro}.png` (regeradas de novo)

### Rodada 2 — NAO_CONFERIDO — 2026-11-09, estado d0c057533febc48702fae7d678afb540158740ab

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA3 | PASSOU | mantido da rodada 1; `states.test.tsx` segue verde após `framed` |
| CA4 | PASSOU | `StudentsPage.test.tsx` agora prova canvasStates (erro, vazio, carregando, 403 com quadro e busca acima) |
| CA5 | PASSOU | mantido da rodada 1; `AreaUnavailablePage.test.tsx` verde |
| CA6 | NÃO CONFERIDO | lint, typecheck, tokens e axe passam (inclui axe a 360 px no erro de Alunos, jsdom); sem prova de ausência de rolagem lateral a 360 px no erro de Alunos (jsdom não mede; sem e2e) |
| CA7 | PASSOU | `design-readme.test.ts` verde |
| CA8 | PASSOU | `sem-acesso-390-claro.png` em `visual/referencias` aberto: cadeado em quadro arredondado acima do título; registro de `test:visual:docker` e `visual:canvas` (103/0) aceito (autonomia 2 e 3) |
| CA9 | PASSOU (parcial) | diff da rodada só em `StateCard`, `states.tsx`, teste de Students, 8 PNG previstos e o arquivo do item; `test:cov` e `e2e` completos não reexecutados |

Comandos: `npx vitest run src/features/students src/components/states src/components/query src/features/auth src/features/permissions src/components/tokens.test.ts src/components/design-readme.test.ts src/test/a11y.test.tsx src/dev --maxWorkers=2` → 41 arquivos, 434 testes passam; `npm run lint`, `npm run typecheck` → ok.
Instáveis: nenhum.
Achados:
- NÃO CONFERIDO — CA6, "360 px sem rolagem lateral no estado de erro de Alunos": igual à rodada 1; falta e2e (ou medição real de `scrollWidth <= innerWidth`) da lista de Alunos com erro 500 a 360 px.
- sugestão, código — `.capturas/464/sem-acesso-{1440,390}-sistema.png` são anteriores à correção do `framed` (cadeado sem quadro); regerar para o verificador comparar com a imagem atual.

### Correção da rodada 2
- CA6, 360 px sem rolagem lateral no erro de Alunos — arquivos: `frontend/e2e/alunos.spec.ts` (teste "Erro ao carregar a lista a 360 px sem rolagem lateral": `msw.override` GET `/students` 500, viewport 360x740, `scrollWidth <= innerWidth` com "Tentar de novo" visível; import trocado para `./support/msw`) — prova: `npx playwright test e2e/alunos.spec.ts` → 7 passam
- Capturas `.capturas/464/sem-acesso-{1440,390}-sistema.png` regeradas a partir das referências atuais (`visual/referencias/sem-acesso-*-claro.png`, pós-correção do `framed`)

### Rodada 3 — OK — 2026-11-09, estado a43ffdb926fabe34f0ab8f37a1d5b95d34a9f529

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA5 | PASSOU | mantido da rodada 2; vitest dos diretórios do item verde |
| CA6 | PASSOU | e2e novo "Erro ao carregar a lista a 360 px sem rolagem lateral" passa (500 forçado por `msw.override`, "Tentar de novo" visível, `scrollWidth <= innerWidth`); lint, typecheck, tokens e axe ok |
| CA7 | PASSOU | mantido; `design-readme.test.ts` verde |
| CA8 | PASSOU | mantido da rodada 2 (registro de `test:visual:docker` e `visual:canvas` aceito, autonomia 2 e 3) |
| CA9 | PASSOU (parcial) | diff desde a rodada 2 só em `e2e/alunos.spec.ts`; `test:cov` e `e2e` completos não reexecutados, valem os da Construção |

Comandos: `npx playwright test e2e/alunos.spec.ts e2e/area-indisponivel.spec.ts` → 8 passam; `npx vitest run` (students, states, query, auth, permissions, tokens, design-readme, a11y, dev) → 41 arquivos, 434 testes passam; `npm run lint`, `npm run typecheck` → ok.
Instáveis: nenhum.
Achados: nenhum obrigatório.

## Entrega

- **O que muda:** componente base de estados (`StateCard` e `states.tsx` em `components/states`, com carregando, vazio, erro, sem permissão, bloqueio e link vencido); a lista de Alunos e a busca de `QueryPage` ganham os estados no padrão do canvas (opt-in `canvasStates`, D1); a página Sem acesso sai do `AuthShell` e vai para `AreaUnavailableShell`, com o menu e a barra do app; `ManagementLayout` ganha `bare`; a Vitrine e a linha "Estados" em `docs/design/README.md` mostram os estados; casos `sem-acesso` e `vitrine` no teste visual, com 8 referências PNG.
- **Como foi verificado:** verificação rodada 3, OK, estado `a43ffdb926fabe34f0ab8f37a1d5b95d34a9f529`. CA6 (360 px sem rolagem lateral no erro de Alunos) passou pelo e2e `Erro ao carregar a lista a 360 px sem rolagem lateral` em `frontend/e2e/alunos.spec.ts`. Na construção: `npm run lint` e `npm run typecheck` ok; `npm run test:cov` com 224 arquivos e 2109 testes passando; `npm run e2e` com 98 passando; `npm run visual:canvas -- --exige` com 103 comparadas e 0 reprovadas; capturas em `.capturas/464/`.
- **Decisões:** visual novo é opt-in, para cada issue de tela trocar na sua (D1). A página Sem acesso mantém o cartão no alto, sem centralizar na tela, com texto genérico e botão "Ir para o Início"; o canvas `EstadoSemAcesso` centraliza, traz o nome de quem administra e o botão "Ver minhas turmas" (D5). Essa divergência fica para a #489. O cadeado está em quadro arredondado, como no canvas (correção da rodada 1). Desvios da construção: `GMSemAcesso` tem 360 px e a comparação de 390 px usa `SemAcessoM`; `AreaUnavailableShell` em arquivo próprio, porque `shell.test.ts` exige `PageHeader` em todo `*Page.tsx` com `<ManagementLayout`; o botão de trocar organização só aparece na página sem casca.
- **Limitações e falhas registradas:** `ChargePreviewPage.test.tsx` CA16 (`vários role=status` sob carga) falhou na primeira rodada completa da construção e passou sozinho duas vezes e na segunda rodada completa; é instável, sem relação com o item. A regressão completa não foi rodada de novo nesta entrega, porque a base não avançou desde a construção; vale a da construção.
