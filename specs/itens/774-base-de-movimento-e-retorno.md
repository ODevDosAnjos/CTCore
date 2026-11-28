# 774 — 645a · Base de movimento e retorno: aviso no canto, barra, esqueleto e transições

Origem: issue #774 (Sprint 10.5), parte a da #645 (`specs/itens/645-movimento-e-retorno.md`, D1); RNF-44 e RNF-20 em `docs/especificacao/00-visao-geral.md`; decisão 33 de `docs/auditoria/decisoes-canvas.md`; padrão de rotas e telas (RNF-56). Branch: `item/774-base-de-movimento-e-retorno`.
Tempos: especificar 8 min · construir 52 min (2 rodadas) · verificar 62 min (regressão 55 min) (3 rodadas) · entregar 4 min (1 rodada)

## 1. Objetivo

Entregar só a base de movimento e retorno do front: `Toast` (provider e `useToast`) montado nas molduras, barra fina de troca de tela, `Skeleton` e esqueleto em listas e painéis, `Button loading` conferido, transições de 150 a 250 ms e corte total com "reduzir movimento". Fora: trocar as mensagens soltas das telas por aviso (#775 a #778), ações em "⋯" e ficar na tela (#650), API, contrato e MSW.

## 2. Requisitos

- **R1.** `Toast` e `useToast` com sucesso, erro e atenção: canto inferior, sucesso e atenção somem sozinhos, erro fica até fechar, todos fecháveis, região `aria-live`.
- **R2.** Provider montado em `ManagementShell`, `PortalShell` e na moldura de acesso (`AuthShell`/`RoleShell`), uma vez por moldura.
- **R3.** Barra fina no topo durante a troca de tela, removida ao terminar.
- **R4.** `Skeleton` base e esqueleto no carregamento de listas e painéis (no lugar de texto solto).
- **R5.** `Button loading`: indicador, desabilitado e `aria-busy` (conferir; já existe).
- **R6.** Transições de 150 a 250 ms: menu lateral (recolher/abrir), painel flutuante, janelas, painéis laterais, menus e popovers.
- **R7.** Rolagem suave; `prefers-reduced-motion: reduce` zera transições, animações e rolagem suave (RNF-20).
- **R8.** Texto em pt-BR; `Toast` documentado em `docs/design/README.md` (RNF-44).

## 3. Critérios de aceite

- **CA1** (R1). Disparar os três tipos: aparecem no canto inferior; sucesso e atenção somem após 5 s (relógio fixo); erro permanece; o botão de fechar remove cada um; a região tem `aria-live`.
- **CA2** (R2). `useToast` dentro de cada uma das três molduras exibe o aviso; fora de provider, o hook falha com erro claro.
- **CA3** (R3). Navegar para outra rota mostra `role="progressbar"` enquanto a rota carrega e o remove depois.
- **CA4** (R4). `LoadingState` e `QueryPage` em carregamento mostram `Skeleton` (sem a frase "Carregando" visível, só `sr-only`).
- **CA5** (R5). `Button loading`: `aria-busy`, desabilitado e indicador; sem `loading`, volta ao normal.
- **CA6** (R6). Cada componente listado usa duração entre 150 e 250 ms (teste de classe).
- **CA7** (R7). Com `prefers-reduced-motion: reduce`, o CSS global define duração e atraso nulos e `scroll-behavior: auto` (teste lendo `index.css`); sem a preferência, `scroll-behavior: smooth`.
- **CA8** (R1 a R4). Axe sem violação com `Toast` aberto nos dois temas; telas a 360 px sem rolagem horizontal; casos do teste visual do que mudou, comparação com o canvas quando há tela.
- **CA9** (R8). `docs/design/README.md` lista `Toast`, `Skeleton` e a barra de rota; lint sem texto literal.

## 4. Plano técnico

Só front-end (`frontend/src`); API, OpenAPI e MSW não mudam. Lido no repositório: `components/ui/button.tsx` (`loading` já com `aria-busy`, `Loader2` e `sr-only`), `components/states/states.tsx` (`LoadingState` com `animate-pulse` solto), `components/query/QueryPage.tsx` e `DataTable.tsx` (`TableSkeleton`), `components/Modal.tsx`, `components/SidePanel.tsx`, `components/ui/drawer.tsx`, `ui/popover.tsx`, `layout/Sidebar.tsx` (só `transition-transform` no chevron), `layout/GroupFlyout.tsx`, `layout/AuthShell.tsx`, `features/auth/RoleShell.tsx`, `features/permissions/ManagementShell.tsx`, `features/portal/PortalShell.tsx`, `main.tsx` (`BrowserRouter`, sem data router), `index.css` (importa `tw-animate-css`, sem regra de reduzir movimento), `visual/casos.ts`.

- A criar: `components/ui/toast.tsx` (`ToastProvider`, `useToast`, região `aria-live="polite"` para sucesso e atenção e `role="alert"` para erro; constante `TOAST_MS = 5000`; cores só por tokens); `components/ui/skeleton.tsx`; `components/layout/RouteProgress.tsx` (barra fina ligada a `useLocation`); um teste para cada.
- A alterar: as três molduras (montar `ToastProvider` e `RouteProgress` uma vez, regra 1 do RNF-56); `states.tsx` (`LoadingState` usa `Skeleton`); `QueryPage.tsx` e `DataTable.tsx` (`TableSkeleton` usa `Skeleton`); `Modal.tsx`, `SidePanel.tsx`, `drawer.tsx`, `popover.tsx`, `Sidebar.tsx` (recolher), `GroupFlyout.tsx`, `UserMenu.tsx` e `UnitMenu.tsx` com `duration-200` e os `data-[state]` de `tw-animate-css`; `index.css` (`html { scroll-behavior: smooth }` e bloco `@media (prefers-reduced-motion: reduce)` com `animation-duration`, `transition-duration` e `scroll-behavior` zerados com `!important`); `i18n/pt-BR.json` (`toast.*`, `routeProgress.label`); `docs/design/README.md` (linha em Componentes); `visual/casos.ts` (caso com `Toast` aberto na moldura da gestão a 1440 e 390 px e o esqueleto de lista).
- Reutilizar: tons do `Banner`, `cn`, `useTranslation`, `Button loading`. Dependência nova: nenhuma.
- Segurança, isolamento e auditoria: não se aplica (sem rota nem dado).
- Riscos: (1) `RouteProgress` sem data router é aproximação: barra na troca de `pathname` até a rota assentar; (2) com reduzir movimento, o `animate-spin` do botão para; o texto `sr-only` segue; (3) mudar a moldura obriga regerar referências (`--update-snapshots --workers=2`) e listar no PR; (4) testes antigos com `getByText("Carregando")` podem quebrar com o esqueleto: ajustar só o que quebrar.

## 5. Tarefas

- [x] T1: `toast.tsx` e testes (CA1, CA2, CA8 axe). Prova: `npx vitest run src/components/ui/toast.test.tsx`.
- [x] T2: `skeleton.tsx`; usar em `LoadingState`, `QueryPage` e `TableSkeleton` (CA4). Prova: `npx vitest run src/components/ui/skeleton.test.tsx src/components/states src/components/query`.
- [x] T3: `RouteProgress` e montagem de `ToastProvider` e da barra nas três molduras (CA2, CA3). Prova: `npx vitest run src/components/layout src/features/permissions src/features/portal`.
- [x] T4: conferir `Button loading` e completar o teste se faltar (CA5). Prova: `npx vitest run src/components/ui/button.test.tsx`.
- [x] T5: transições da R6 e `index.css` com rolagem suave e reduzir movimento (CA6, CA7). Prova: `npx vitest run src/components/ui src/components/layout src/components/Modal.test.tsx src/index.css.test.ts` (teste novo de CSS).
- [x] T6: textos pt-BR e `docs/design/README.md` (CA9). Prova: `npm run lint`.
- [x] T7: casos do teste visual; capturas em `.capturas/774/` (1440 e 390 px, pt-BR, temas em que o canvas existe) e `npm run visual:canvas`; gerar só as referências do que mudou com `npm run test:visual:docker -- --update-snapshots -g "<caso>"` (CA8). Prova: `npm run visual:canvas`.
- [x] T8: e2e da moldura da gestão mostrando o aviso e a barra (padrão de rotas e telas). Prova: `npm run e2e -- <spec novo>` e `npx vitest run shell.test.ts noInternalAnchors.test.ts routePattern.test.ts`.

## 6. Decisões

- **D1.** Sem biblioteca de aviso: componente próprio, cerca de 100 linhas (recomendada). Alternativa: `sonner`, dependência nova sem necessidade.
- **D2.** Tempo de sumiço de 5 s (herda a D2 da #645); suposição, só muda a constante.
- **D3.** `RouteProgress` por mudança de `pathname`, sem migrar para data router (migrar sairia do escopo). Se estiver errada, a barra só aparece por menos tempo.
- **D4.** Reduzir movimento por regra global em `index.css`, não por classe em cada componente (um lugar só).
- **D5.** Estimativa de 20 a 25 arquivos contáveis, abaixo do limite de 30; se passar na construção, parar e avisar.

## Construção

- T1 — `components/ui/toast.tsx`, `toast.test.tsx` — prova: `npx vitest run src/components/ui/toast.test.tsx` → passou (relógio fixo, fechar, hook fora do provider, axe claro e escuro)
- T2 — `components/ui/skeleton.tsx`, `skeleton.test.tsx`; `states.tsx` e `DataTable.tsx` (`TableSkeleton`) usam `Skeleton`; `QueryPage` já usa `TableSkeleton`/`LoadingState` — prova: `npx vitest run src/components/ui src/components/states src/components/query` → passou
- T3 — `components/layout/RouteProgress.tsx` + teste, `shells-toast.test.tsx`; `ToastProvider` e `RouteProgress` em `ManagementShell` e `PortalShell`, `ToastProvider` em `AuthShell`; testes novos nos dois testes de moldura — prova: `npx vitest run src/components/layout src/features/permissions src/features/portal` → passou
- T4 — `button.test.tsx` (aria-disabled e indicador no `loading`; volta ao normal sem `loading`) — prova: `npx vitest run src/components/ui/button.test.tsx` → passou
- T5 — `duration-200` com `animate-in/out` em `Modal` (janela e painel lateral), `drawer`, `popover`, `Sidebar` (largura e chevron), `GroupFlyout`, `UserMenu`, `UnitMenu`, `toast`; `index.css` (rolagem suave e bloco de reduzir movimento); testes `components/motion.test.ts` e `index.css.test.ts` → passaram
- T6 — `i18n/pt-BR.json` (`toast.close`, `routeProgress.label`); `docs/design/README.md` (Toast, Skeleton, barra de rota) — prova: `npm run lint` → limpo; `design-readme.test.ts` → passou
- T7 — `dev/Vitrine.tsx` (botão "Mostrar avisos" dentro de `ToastProvider`, só dev), caso `vitrine-avisos` em `visual/casos.ts`; referências regeradas com `npm run test:visual:docker -- --update-snapshots --workers=2 -g "vitrine"` → 9 passaram. Não há tela de Toast no canvas: comparação com o canvas não se aplica (sem capturas em `.capturas/774/`; o `visual:canvas` não tem caso novo). Primeira tentativa com 4 workers deu timeout em 5 casos; com `--workers=2` passou.
- T8 — `e2e/movimento-e-retorno.spec.ts` — prova: `npm run e2e -- movimento-e-retorno` → 1 passou (barra aparece ao navegar e some; região de avisos na moldura)
Testes do item: `npm run lint`, `npm run typecheck` limpos; vitest de ui, layout, states, query, motion, index.css, tokens, design-readme, telasCanvas419, permissions, PortalShell, dev, test → 64 arquivos, 695 testes passaram.
Desvios: (1) a região `aria-live` não tem `role="status"` fixo, e a de erro (`role="alert"`) só existe com erro aberto, para não quebrar os muitos testes que buscam `role=status`/`alert` únicos; (2) `Toast` não tem tela real que o dispare ainda (#775 a #778), então o caso visual e o aviso aberto usam a vitrine de desenvolvimento; (3) `QueryPage` não foi editado, pois já delega ao `TableSkeleton`/`LoadingState`.
Referências visuais: `frontend/visual/referencias/vitrine-{1440,390}-{claro,escuro}.png` (alteradas, novo botão) e `vitrine-avisos-{1440,390}-{claro,escuro}.png` (novas). Moldura sem mudança visual: demais referências não regeradas; a suíte inteira fica para o CI.
Não rodou: `npm test` completo, `build`, `e2e` inteiro, suíte visual inteira (da verificação e do CI).

## Verificação

### Rodada 1 — OK — 2026-11-27, estado 1cd3cbdf722a7ae98a612985024bcca8f4c084a3

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `toast.test.tsx` (relógio fixo, 5 s, erro permanece, fechar, `aria-live`); `npm test` completo verde |
| CA2 | PASSOU | testes das três molduras (`ManagementShell`, `PortalShell`, `shells-toast`) e erro fora do provider |
| CA3 | PASSOU | `RouteProgress.test.tsx` e e2e `movimento-e-retorno` (1 passou) |
| CA4 | PASSOU | `skeleton.test.tsx`; `LoadingState` e `TableSkeleton` usam `Skeleton`, frase só `sr-only`; `QueryPage` delega a eles |
| CA5 | PASSOU | `button.test.tsx` |
| CA6 | PASSOU | `motion.test.ts` (duration-200 em Modal, drawer, popover, toast, Sidebar, GroupFlyout, UserMenu, UnitMenu; SidePanel passa pelo Modal) |
| CA7 | PASSOU | `index.css.test.ts`; bloco `prefers-reduced-motion` lido no diff |
| CA8 | PASSOU (visual no CI do PR) | axe do Toast nos dois temas em `toast.test.tsx`; visual: no CI do PR; sem tela de Toast no canvas, comparação não se aplica (desvio registrado) |
| CA9 | PASSOU | README lista Toast, Skeleton e barra; `npm run lint` limpo |

Comandos: `npm run lint` limpo; `npm run typecheck` limpo; `npm run build` ok; `npm test` 284 arquivos, 3208 testes passaram; `npm run e2e -- movimento-e-retorno` 1 passou.
Instáveis: nenhum.
Achados:
- sugestão, código, `ui/toast.tsx` — com janela modal (Radix) aberta, o aviso fica fora do diálogo e pode ficar `aria-hidden`; avaliar nas issues #775 a #778 ao disparar avisos de dentro de janelas.
- sugestão, código, `RouteProgress.tsx` — barra por tempo fixo de 400 ms (D3 aceito), não acompanha o carregamento real.

### Rodada 2 — OK — 2026-11-27, estado 0599f0b3d25ec5117c0b71365fa3d2b6521d78b6

Mudou desde a rodada 1 (`git diff 1cd3cbdf... 0599f0b3...`): `RouteProgress.tsx` (barra dentro de `role="region"` com nome) e `visual/telas.visual.ts` (espera a barra sair antes do print). Critérios que isso toca foram reconferidos; os demais mantêm o status da rodada 1.

| Critério | Status | Evidência |
|---|---|---|
| CA1, CA2, CA4 a CA7, CA9 | PASSOU | mantido da rodada 1; `npm test` completo sem falha nova |
| CA3 | PASSOU | `RouteProgress.test.tsx` e e2e `movimento-e-retorno` (1 passou) com a barra dentro da região; `routeProgress.label` = "Carregando a tela" bate com o seletor do teste visual |
| CA8 | PASSOU (visual no CI do PR) | axe: e2e `portal-barra` e `comprovantes` (light e dark) passaram, que eram as falhas do CI por regra `region`; visual: no CI do PR (a espera da barra só evita captura com a barra; nenhuma referência muda) |

Comandos: `npm run lint` limpo; `typecheck` limpo; `build` ok; `npm test` 284 arquivos, 3207 de 3208 passaram (1 instável, abaixo); `npm run e2e -- movimento-e-retorno comprovantes portal-barra` 6 passaram.
Instáveis: `AgendaPage.test.tsx` > "CA15: carregando, vazio, erro..." falhou 1 vez na suíte inteira (`findByText("Carregando...")` não achou; suíte de 841 s sob carga); passou 3 de 3 rodando só o arquivo com `--maxWorkers=2`; passou na rodada 1. O item não toca a Agenda: o `maestro` registra na issue de instabilidade.
Achados:
- sugestão, código, `RouteProgress.tsx` — a barra continua por tempo fixo de 400 ms (D3), como na rodada 1.

## Entrega

Base da parte a da #645: aviso no canto (`Toast`, 5 s, com relógio injetado nos testes), barra de progresso de rota (`RouteProgress`, 400 ms fixos) nas molduras `ManagementShell` e `PortalShell`, esqueleto (`Skeleton`) em `LoadingState` e `TableSkeleton`, `aria-disabled` e indicador no `Button` com `loading`, transições de 200 ms com bloco de reduzir movimento em `index.css`, README do design atualizado, caso visual `vitrine-avisos` e e2e `movimento-e-retorno`.

Verificação: rodada 3 OK (estado `c31bb61b907e9d0e28262cdf5c773444fa241086`), a última; a árvore atual difere dela só neste arquivo. A rodada 1 e a 2 ficam registradas acima.
Regressão local da verificação: `npm run lint`, `typecheck`, `build`, `npm test` (3208 testes) e e2e do spec da tela passaram. A base `dev` não avançou desde a verificação, então não houve merge nem nova regressão.
Decisões: D3 (barra por tempo fixo de 400 ms) aceita; a `role=status` não é fixa na região de avisos, para não quebrar os testes que buscam `status`/`alert` únicos.
Limitações: sem tela de Toast no canvas, a comparação com o canvas não se aplica; o visual das referências `vitrine-*` e `vitrine-avisos-*` é conferido no job `visual` do CI. Sem `limiteCanvas`. Os avisos ainda não são disparados por telas reais (chega com #775 a #778). Achado de sugestão: aviso dentro de janela modal (Radix) pode ficar `aria-hidden`, a avaliar em #775 a #778.

### Correção da entrega
- CI do PR #779 vermelho (e2e e visual 2/2). Causa: a barra `RouteProgress` (400 ms, `role="progressbar"` solto) aparecia após redirecionamentos de rota durante o axe (regra `region`, impacto moderado) e dentro dos prints (780 px de diferença a 390 px). CI pegou o que o local não pegou: axe e visual com a barra visível logo após navegar.
- `RouteProgress.tsx` agora envolve a barra numa `role="region"` com nome (marco para o axe); `visual/telas.visual.ts` espera a barra sair (`waitFor detached`) antes do print — prova: `npm run lint`, `typecheck`, `npx vitest run src/components/layout src/features/permissions src/features/portal` (570 passaram); `npm run e2e -- movimento-e-retorno comprovantes portal-barra` → 6 passaram.
- Referências visuais: nenhuma regerada (o print agora não tem a barra, igual às referências existentes). Visual do CI confere.
- Nova entrega: a `dev` avançou para `40687009` (backlog da #780); a branch recebe `origin/dev` por merge, sem conflito. Regressão local não repetida: "Quem roda o quê" deixa a prova do conjunto para o CI do PR.

### Correção da entrega (2)
- CI do PR #779 (estado `d2522ea8`) ainda vermelho: e2e `comprovantes` (axe `color-contrast`, janela aberta) e visual 2/2 (`cobranca-cancelar` e `cobranca-registrar`, 8 casos). Causa: a janela (`Modal`) e a sombra passaram a ter `animate-in fade-in-0` de 200 ms; o axe e a captura pegavam a janela no meio do fade (cores misturadas). CI pegou o que o local não pegou: axe e visual com janela ainda em fade.
- Correção na causa comum: `reducedMotion: "reduce"` em `playwright.config.ts` e `playwright.visual.config.ts`, que aciona o bloco de reduzir movimento do `index.css` (D4) e deixa janelas sem animação nos testes — prova: `npm run lint`, `typecheck` limpos; `npm run e2e -- comprovantes movimento-e-retorno` → 3 passaram.
- Referências visuais: nenhuma regerada. Visual do CI confere (`cobranca-*` e suíte inteira).

### Rodada 3 — OK — 2026-11-27, estado c31bb61b907e9d0e28262cdf5c773444fa241086

Mudou desde a rodada 2 (`git diff 0599f0b3... c31bb61b...`): só `reducedMotion: "reduce"` em `frontend/playwright.config.ts` e `frontend/playwright.visual.config.ts` (correção da entrega 2), backlog e este arquivo. Nenhum código de produto nem teste mudou; CA1 a CA7 e CA9 mantidos da rodada 2.

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA7, CA9 | PASSOU | mantido da rodada 2; `npm test` 284 arquivos, 3208 testes passaram |
| CA8 | PASSOU (visual no CI do PR) | e2e `comprovantes` (light e dark, axe com janela aberta, a falha do CI) passou com `reducedMotion`; visual: no CI do PR (`cobranca-*` e suíte inteira) |

Comandos: `npm run lint`, `typecheck`, `build` ok; `npm test` 3208 passaram; `npm run e2e -- movimento-e-retorno comprovantes portal-barra` 6 passaram.
Instáveis: nenhum nesta rodada.
Achados:
- sugestão, código, `playwright.config.ts` — `reducedMotion: "reduce"` global em todos os e2e e no visual faz o CI não exercitar as animações reais (o bloco de reduzir movimento fica coberto, as transições não); aceitável (D4), mas vale um caso e2e sem a preferência se a #775 a #778 dependerem de animação.
- sugestão, código, `RouteProgress.tsx` — barra por tempo fixo de 400 ms (D3), como antes.
