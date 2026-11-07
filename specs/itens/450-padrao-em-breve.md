# 450 — Componente base: Padrão "Em breve" (R3): item visível e desabilitado, sem backend

Origem: issue #450 (Sprint 10.5, Fase 2, plano C11), `docs/auditoria/decisoes-canvas.md` (R3 e item 8), `docs/auditoria/auditoria-canvas-sprint-10.5.md` seção 4. Branch: `item/450-padrao-em-breve`.

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Criar o componente base `ComingSoon`, que mostra um botão, aba, interruptor, link ou item de menu **visível e desabilitado**, com o selo "Em breve" e uma dica, sem backend, para os itens do canvas de sprints futuras (R3). Aplicá-lo como piloto em Alunos ("Exportar CSV", aba "Bloqueados") e Comunicados (canal "Push", "Salvar rascunho"). As demais telas trocam para ele nas suas próprias issues.

Fora do escopo: trocar `DISABLED = ["refund"]` de `ChargePanel.tsx` e qualquer outra tela; coluna Graduação, "Editar" de comunicado agendado e demais itens da seção 4 (issues de tela); back-end, OpenAPI, MSW.

## 2. Requisitos

- R1: existe `ComingSoon` em `frontend/src/components/ui/` com as variantes `button`, `tab`, `switch`, `link` e `menuitem`.
- R2: todas as variantes ficam `disabled` ou `aria-disabled="true"`, sem `onClick`/`href`/navegação; o clique e Enter/Espaço são ignorados.
- R3: todas mostram o selo "Em breve" e a dica "Disponível em uma próxima versão", visível ao passar o mouse e ao receber foco, ligada ao item por `aria-describedby`.
- R4: o item continua alcançável por teclado (não usa `disabled` nativo que tira do foco).
- R5: textos só em `pt-BR.json`; cores só por tokens (selo com `Badge`).
- R6: Alunos mostra "Exportar CSV" (botão) no cabeçalho e a aba "Bloqueados" junto dos filtros rápidos, ambos "Em breve", sem chamada de API (D1).
- R7: Comunicados (novo) mostra o canal "Push" (interruptor) e "Salvar rascunho" (botão) ao lado de "Enviar", ambos "Em breve", sem chamada de API (D2).
- R8: o selo tem contraste suficiente e o axe passa nos dois temas; funciona a partir de 360 px.
- R9: o componente e a regra R3 constam em `docs/design/README.md` (tabela Componentes e Regras).
- R10: as referências visuais de `alunos` e `comunicados-novo` são regeradas e comparadas com o canvas; nenhuma outra tela muda.

## 3. Critérios de aceite

- CA1 (R1, R2): dado cada variante com um `onClick` espião, quando clicada e acionada por Enter/Espaço, então o espião não é chamado e nenhuma navegação ocorre.
- CA2 (R3): dado cada variante, quando recebe foco ou mouse, então aparece "Disponível em uma próxima versão", o selo "Em breve" existe e `aria-describedby` aponta para a dica.
- CA3 (R4): dado o item, quando se navega com Tab, então ele recebe foco.
- CA4 (R2): dada a variante `link` e `menuitem`, então não há `href` e o `menuitem` tem `role="menuitem"` e `aria-disabled="true"`.
- CA5 (R8): dado o componente nos temas claro e escuro, então `axe` não acusa violação (inclui contraste do selo).
- CA6 (R6): dado Alunos aberto com MSW, quando a página carrega, então "Exportar CSV" e "Bloqueados" estão desabilitados com "Em breve" e cliques não geram requisição.
- CA7 (R7): dado Novo comunicado, então "Push" e "Salvar rascunho" estão desabilitados com "Em breve", e enviar o formulário não inclui `PUSH` nos canais nem chama rascunho.
- CA8 (R5): `npm run lint` passa sem texto literal.
- CA9 (R9): o teste `design-readme.test.ts` passa com `ComingSoon` na tabela.
- CA10 (R10): `npm run test:visual:docker` passa com as referências regeradas só de `alunos` e `comunicados-novo`; `npm run visual:canvas` sem nova reprovação.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (puramente visual; nenhuma rota nova).
- Interface: `ComingSoon({ variant, label, className })`. `button`: `<button aria-disabled>` com visual de `Button` secondary (`buttonVariants`) mais selo; `tab`: pílula igual à do filtro rápido, `aria-disabled`; `switch`: `role="switch" aria-checked=false aria-disabled`; `link`: `<span role="link" aria-disabled>` sem href; `menuitem`: `role="menuitem" aria-disabled`. Dica: `<span role="tooltip" id>` mostrado por CSS `group-hover`/`group-focus-visible` (e também lida pelo `aria-describedby`). Selo: `Badge tone="neutral"` com `t("comingSoon.badge")`.
- Arquivos:
  - `frontend/src/components/ui/coming-soon.tsx` e `coming-soon.test.tsx` (a criar).
  - `frontend/src/i18n/pt-BR.json`: grupo novo `comingSoon` (`badge`: "Em breve", `hint`: "Disponível em uma próxima versão"). O `layout.soon` existente fica como está.
  - `frontend/src/features/students/StudentsPage.tsx` (`Content`, `PageHeader actions`): `ComingSoon button` "Exportar CSV"; `frontend/src/features/students/StudentFilters.tsx` (grupo de filtros rápidos, após "Em atraso"): `ComingSoon tab` "Bloqueados"; chaves em `students.exportCsv` e `students.quick.BLOCKED` no JSON.
  - `frontend/src/features/announcements/NewAnnouncementPage.tsx`: `ComingSoon switch` "Push" no `fieldset` de canais (após WhatsApp) e `ComingSoon button` "Salvar rascunho" antes do botão Enviar (linha ~292); chaves em `announcements.new.channelPush` e `announcements.new.saveDraft`.
  - Testes das telas: `StudentsPage.test.tsx`, `NewAnnouncementPage.test.tsx` (casos novos).
  - `docs/design/README.md`: linha `ComingSoon` na tabela Componentes e regra 2 reescrita com R3 (item de sprint futura aparece desabilitado com "Em breve").
  - `frontend/visual/referencias/` (`alunos`, `comunicados-novo`, 1440 e 390, claro e escuro quando existirem).
- Reuso: `Badge`, `buttonVariants`, `cn`, tokens de `tailwind`, `useTranslation`, padrão `aria-disabled`/`disabledReason` de `Button`.
- Riscos: testes existentes que contam botões ou usam `getByRole("button", { name })` em Alunos/Comunicados podem passar a achar nomes duplicados (selo dentro do nome acessível); percebido em `StudentsPage.test.tsx` e `NewAnnouncementPage.test.tsx`. Os nomes acessíveis dos novos itens incluem "Em breve" via descrição, não via nome, para evitar isso.

## 5. Tarefas

- [x] T1: criar `ComingSoon` (cinco variantes), chaves `comingSoon.*` e testes de unidade (sem ação, selo e dica, foco por teclado, axe nos dois temas, 360 px) — cobre CA1, CA2, CA3, CA4, CA5, CA8 — prova: `cd frontend && npx vitest run src/components/ui/coming-soon.test.tsx`
- [x] T2: aplicar em Alunos (Exportar CSV e aba Bloqueados) com teste — cobre CA6 — prova: `cd frontend && npx vitest run src/features/students/StudentsPage.test.tsx`
- [x] T3: aplicar em Novo comunicado (Push e Salvar rascunho) com teste — cobre CA7 — prova: `cd frontend && npx vitest run src/features/announcements/NewAnnouncementPage.test.tsx`
- [x] T4: registrar `ComingSoon` e a R3 em `docs/design/README.md` — cobre CA9 — prova: `cd frontend && npx vitest run src/components/design-readme.test.ts`
- [x] T5: regerar referências de `alunos` e `comunicados-novo` no container, comparar com o canvas (1440 e 390, pt-BR, capturas em `.capturas/450/`) e listar divergências no PR — cobre CA10 — prova: `cd frontend && npm run test:visual:docker -- -g "alunos|comunicados-novo"` e `npm run visual:canvas`
- [x] T6: regressão do front — não cobre critério novo: confere que nada mais quebrou (CA8) — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov`

## 6. Decisões

- D1: a aba "Bloqueados" entra no grupo de filtros rápidos (Ativos, Ex-alunos, Em atraso), que é a "aba" do canvas e hoje é um grupo de botões `aria-pressed`, não um `tablist`. A variante `tab` renderiza então uma pílula desabilitada, sem `role="tab"` (o axe exige `tablist` como pai desse papel). Alternativa descartada: trocar os filtros por `Tabs` (muda outra tela, é da #465).
- D2: o canal "Push" usa a variante `switch` (única das cinco que representa liga/desliga), no lugar do checkbox dos outros canais. O visual final é da #491. Alternativa: variante nova `checkbox`, descartada por não estar na issue.
- D3: `link` e `menuitem` renderizam sem `href` (`span role="link"` e `role="menuitem"`), para não navegar nem aparecer como âncora válida.
- D4: a dica é um tooltip de CSS (foco e mouse) mais `aria-describedby`; não se adiciona biblioteca de tooltip.
- Suposição: o canvas `Alunos` e `ComunicadoNovo` posicionam "Exportar CSV" no cabeçalho e "Salvar rascunho" ao lado de "Enviar"; se a comparação mostrar outro lugar, ajustar a posição sem mudar o componente.

## Construção

- T1 — arquivos: `frontend/src/components/ui/coming-soon.tsx`, `coming-soon.test.tsx`, `frontend/src/i18n/pt-BR.json` (`comingSoon.*`) — prova: `npx vitest run src/components/ui/coming-soon.test.tsx` → passou (axe claro/escuro incluso)
- T2 — arquivos: `StudentsPage.tsx`, `StudentFilters.tsx`, `StudentsPage.test.tsx`, `pt-BR.json` — prova: `npx vitest run src/features/students/StudentsPage.test.tsx` → passou
- T3 — arquivos: `NewAnnouncementPage.tsx`, `NewAnnouncementPage.test.tsx`, `pt-BR.json` — prova: `npx vitest run src/features/announcements/NewAnnouncementPage.test.tsx` → passou
- T4 — arquivo: `docs/design/README.md` — prova: `npx vitest run src/components/design-readme.test.ts` → passou (os 4 arquivos de T1 a T4 juntos: 61 testes passando)
- T5 — arquivos: `frontend/visual/referencias/alunos-{1440,390}-{claro,escuro}.png`, `comunicados-novo-1440-{claro,escuro}.png`; capturas em `.capturas/450/` — prova: `npm run test:visual:docker -- --update-snapshots=all -g "alunos|comunicados-novo"` → 8 passaram; `npm run visual:canvas` → 96 comparadas, 0 reprovadas. Só as referências das duas telas mudaram (comunicados-novo 390 ficou dentro da tolerância de 0,1% e não foi reescrita). Divergências para o PR: "Exportar CSV" e "Bloqueados" aparecem como no canvas (nome e posição), mas com o selo "Em breve" ao lado (decisão R3); "Push" e "Salvar rascunho" idem; demais diferenças de layout das duas telas já existiam e são das issues de tela (#465, #491).
- T6 — prova: `npm run lint && npm run typecheck` → passaram; `npm run test:cov` → 109 falhas, 79 por "Test timed out in 20000ms" (máquina sobrecarregada), sem relação com o item; os 40 arquivos que falharam, rodados de novo com `--maxWorkers=2`, passaram (588 testes). Cobertura não foi medida de novo depois da repetição (o `test:cov` terminou vermelho pelas falhas de tempo); fica para o CI.
Regressão: ver T6. Teste instável por carga (timeout), sem mudança no código.
Desvios: no T5 foi preciso `--update-snapshots=all`: o modo padrão não reescreve imagem que passa dentro da tolerância, e as referências de 1440 ficariam sem o novo botão.
Não é do item: nenhum.

## Verificação

### Rodada 1 — OK — 2026-11-07, estado def35602fea720dec3acba619a2dfdc376a82bb4

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | coming-soon.test.tsx: clique, Enter e Espaço sem efeito (vitest, 4 arquivos, 61 passaram) |
| CA2 | PASSOU | coming-soon.test.tsx: selo, dica e aria-describedby; StudentsPage confere descrição acessível |
| CA3 | PASSOU | coming-soon.test.tsx: recebe foco por Tab |
| CA4 | PASSOU | link e menuitem sem href, aria-disabled (código lido e teste) |
| CA5 | PASSOU | axe claro e escuro no teste de unidade |
| CA6 | PASSOU | StudentsPage.test.tsx CA6 (#450): sem nova requisição |
| CA7 | PASSOU | NewAnnouncementPage.test.tsx CA7 (#450): envio sem PUSH |
| CA8 | PASSOU | npm run lint sem erro |
| CA9 | PASSOU | design-readme.test.ts passou |
| CA10 | NÃO CONFERIDO (limitação aceita) | test:visual:docker e visual:canvas não rodados aqui (AGENTS.md, autonomia 2/3); abri .capturas/450/alunos-1440-sistema.png e -canvas.png: botão e aba na posição do canvas, com selo; só as 6 referências das duas telas mudaram no git status |

Comandos: vitest dos 4 arquivos (61 passaram); npm run lint e typecheck (limpos); npm run test:cov --maxWorkers=2 (saiu 0; linhas 96,82%).
Instáveis: nenhum nesta rodada (os timeouts da construção não se repetiram com 2 workers).
Achados:
- sugestão, código, coming-soon.tsx variante switch — o rótulo aparece como texto e também como aria-label; funciona, mas é redundante.

## Entrega

- Componente `ComingSoon` (`frontend/src/components/ui/coming-soon.tsx`): item visível e desabilitado, com selo "Em breve" e dica em tooltip de CSS ligada por `aria-describedby`; sem navegação, sem requisição e sem efeito no clique, Enter e Espaço. Variantes: `button`, `tab`, `link`, `menuitem`, `switch`.
- Aplicado em "Exportar CSV" e aba "Bloqueados" (Alunos) e nos canais "Push" e "Salvar rascunho" (Novo comunicado), com textos em `pt-BR.json` (`comingSoon.*`).
- Verificação: testes de unidade do componente (axe claro e escuro), testes das duas telas, `design-readme.test.ts`; lint e typecheck limpos; cobertura 96,82% de linhas na rodada.
- Comparação com o canvas (1440 e 390 px, pt-BR): 96 imagens comparadas, 0 reprovadas; referências de 1440 das duas telas regeradas. Divergências mantidas por decisão R3 (selo "Em breve" ao lado do nome do canvas) e layout das duas telas que é das issues #465 e #491.
- Decisões: D1 a D4 no arquivo (variante `tab` sem `role="tab"`, canal Push com variante `switch`, `link` e `menuitem` sem `href`, tooltip de CSS sem biblioteca).
- Limitação aceita: CA10 (teste visual via container) não rodou localmente; o CI do PR é a prova.
- Instabilidade: 79 timeouts de 20 s na construção por carga da máquina; os arquivos repetidos com 2 workers passaram.

### Correção da entrega
- CI do PR #521, job `visual` vermelho: `moldura-coordenacao` e `moldura-administrador` em 390 (claro e escuro) usam a rota `/alunos`, que ganhou o chip "Bloqueados"; as 4 referências ficaram antigas (≈0,05% de pixels). Regeradas — arquivos: `frontend/visual/referencias/moldura-{coordenacao,administrador}-390-{claro,escuro}.png` — prova: `npm run test:visual:docker -- --update-snapshots=all -g "moldura-(coordenacao|administrador) 390"` → 4 passaram; só essas 4 imagens mudaram.
Regressão: o resto do CI do PR estava verde (frontend, e2e, security, image-frontend); só `visual` e `ci-gate` falharam.

### Rodada 2 — OK — 2026-11-07, estado e6b5613b82e61c26d84536f23539e8d0a7176643

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA9 | PASSOU (mantido da rodada 1) | vitest dos 4 arquivos do item: 61 passaram com --maxWorkers=2; nada de código mudou desde a rodada 1 |
| CA10 | NÃO CONFERIDO (limitação aceita) | test:visual:docker não roda aqui (autonomia 2/3); o CI do PR é a prova. Diff desde a rodada 1: só as 4 referências moldura-{coordenacao,administrador}-390-{claro,escuro}.png; abri moldura-coordenacao-390-claro.png e ela mostra "Exportar CSV" e "Bloqueados" com selo, o esperado da mudança |

Comandos: vitest dos 4 arquivos (61 passaram); git diff --stat da rodada 1 ao estado atual (4 PNGs mais arquivo do item e backlog).
Instáveis: nenhum.
Achados:
- Achado da rodada 1 (sugestão, switch com rótulo redundante) segue como sugestão, sem impedir.
