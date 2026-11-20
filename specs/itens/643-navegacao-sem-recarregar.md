# 643 — RNF-43 · Navegação sem recarregar a página (links internos pelo roteador)

Origem: issue #643 (Sprint 10.5), `docs/especificacao/00-visao-geral.md` RNF-43, decisão 33 de `docs/auditoria/decisoes-canvas.md`. Branch: `item/643-navegacao-sem-recarregar`.

## 1. Objetivo

Trocar de item do menu, aba ou tela na gestão e no portal passa a ser navegação do roteador: só a área central muda, a página não recarrega. Vale para quem usa a gestão e o portal, em todo uso. Foco e `aria-current` continuam corretos, e o foco vai para o título da tela nova.

Fora do escopo: links externos, `mailto:`, `tel:`, WhatsApp, PDFs, `target="_blank"` e o pular para o conteúdo (`#conteudo`); transições e carregamento (#645).

## 2. Requisitos

- R1: Os itens do menu lateral, "Minha conta", abas do celular, trilha (breadcrumb) e botão de voltar do cabeçalho navegam pelo roteador (`Link`), sem recarregar a página.
- R2: O portal já usa `Link` em `PortalLayout`; nenhum link interno restante no front usa `<a href="/...">`.
- R3: `aria-current="page"`, `aria-label`, `title` e estilos dos links são mantidos.
- R4: Voltar e avançar do navegador continuam funcionando.
- R5: Ao mudar de rota, o foco vai para o título (`h1`) da tela nova; se não houver `h1`, para a área central (D1).
- R6: Teste de busca no CI reprova `<a href="/...">` interno e `window.location` para rota interna em código de produção.

## 3. Critérios de aceite

- CA1 (R1, R3): dado o menu da gestão, quando se clica num item, então a URL muda, o item fica com `aria-current="page"` e um marcador em `window` sobrevive.
- CA2 (R1): idem para "Minha conta", abas do celular (360 px), trilha e voltar do cabeçalho.
- CA3 (R2): dado o portal, quando se navega por todos os itens do menu, então o marcador em `window` sobrevive.
- CA4 (R4): dado duas telas visitadas, quando se usa voltar e avançar, então a URL e a tela acompanham sem recarregar.
- CA5 (R5): dado uma navegação por link, então o foco fica no `h1` da tela nova (ou em `#conteudo`).
- CA6 (R6): dado um `<a href="/x">` em arquivo de produção, quando roda o teste de busca, então ele falha.

## 4. Plano técnico

- Dados, API: não mudam.
- Interface: troca de `<a>` por `Link` do `react-router`; novo hook de foco por rota.
- Segurança: não se aplica.
- Arquivos (vistos): `frontend/src/components/layout/Sidebar.tsx` (item do menu ~l.62 e "Minha conta" ~l.126), `MobileTabs.tsx` (~l.28), `Breadcrumb.tsx` (~l.26), `Topbar.tsx` (~l.41), `AppLayout.tsx` (foco na mudança de rota usando o `main` ref que já existe; o `<a href="#conteudo">` fica). `PortalLayout.tsx` já usa `Link`. Links restantes (`target="_blank"`, PDFs, `mailto:`) ficam. A criar: `frontend/src/test/noInternalAnchors.test.ts` (varre `src/**/*.tsx` fora de testes atrás de `href="/`, `href={"/` e `window.location.(assign|replace|href =)`; `PublicReceiptPage`/`PortalChargeHistory`/recibos usam URL de PDF da API e não casam) e `frontend/e2e/navegacao-sem-recarregar.spec.ts`.
- Reuso: `Link` já usado em `UserMenu.tsx` e `PortalLayout.tsx`; `BrowserRouter` em `main.tsx`; login e helpers dos e2e do portal (`portal-inicio.spec.ts`).
- Riscos: testes unitários que renderizam `Sidebar`, `MobileTabs`, `Breadcrumb`, `Topbar` sem router quebram (`Link` exige contexto; `AppLayout.test.tsx` já usa `MemoryRouter`); embrulhar em `MemoryRouter`. Foco automático não pode roubar foco no primeiro carregamento nem em mudança só de query string (comparar `pathname`).

## 5. Tarefas

- [x] T1: Trocar `<a>` por `Link` em Sidebar (menu e "Minha conta"), MobileTabs, Breadcrumb e Topbar, mantendo atributos; ajustar os testes unitários desses componentes com `MemoryRouter` — cobre CA1, CA2 — prova: `cd frontend && npx vitest run src/components/layout`
- [x] T2: Foco no `h1` (ou `#conteudo`) ao mudar o `pathname`, em `AppLayout` e no layout do portal se ele não usa `AppLayout` — cobre CA5 — prova: `cd frontend && npx vitest run src/components/layout/AppLayout.test.tsx src/features/portal/PortalLayout.test.tsx`
- [x] T3: Teste de busca que reprova link interno recarregando — cobre CA6 — prova: `cd frontend && npx vitest run src/test/noInternalAnchors.test.ts`
- [x] T4: E2E `@critical`: marcador em `window`, navegar por todos os itens do menu da gestão (desktop), abas a 360 px, "Minha conta", portal; voltar e avançar — cobre CA1 a CA4 — prova: `cd frontend && npx playwright test e2e/navegacao-sem-recarregar.spec.ts`
- [x] T5: Rodar a regressão do front e os casos visuais de telas com layout (sem mudança visual esperada; sem `--update-snapshots`) — não cobre critério: garante que o layout não mudou — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov`

## 6. Decisões

- D1: Foco vai para o `h1` da tela nova, caindo em `#conteudo` (já focável) quando não há `h1`; motivo: cobre telas sem título sem criar regra nova. Alternativa: exigir `h1` em toda tela (maior alcance, fora do item).
- D2: O teste de busca é teste do vitest e não regra de lint, pois roda no `npm test` do CI sem plugin novo.
- Suposição: o portal já navega por `Link` (visto em `PortalLayout.tsx`); se algum item dele recarregar, o e2e de T4 mostra e entra em T1.

## Construção

- T1 — arquivos: `components/layout/{Sidebar,MobileTabs,Breadcrumb,Topbar}.tsx` (`<a>` virou `Link`), testes `Sidebar/MobileTabs/Breadcrumb.test.tsx` com `MemoryRouter`, `test/a11y.test.tsx` (Showcase em `MemoryRouter`) — prova: `npx vitest run src/components/layout` → 84 passaram
- T2 — arquivos: `components/layout/useFocusOnRoute.ts` (+ `.test.tsx`), usado em `AppLayout.tsx` e `features/portal/PortalLayout.tsx` — prova: `npx vitest run src/components/layout src/features/portal/PortalLayout.test.tsx` → passou
- T3 — arquivos: `src/test/noInternalAnchors.test.ts` — prova: `npx vitest run src/test/noInternalAnchors.test.ts` → 2 passaram (nenhum achado em produção)
- T4 — arquivos: `e2e/navegacao-sem-recarregar.spec.ts` (gestão desktop com grupos do menu, voltar/avançar; 360 px abas e Minha conta; portal) — prova: `npx playwright test e2e/navegacao-sem-recarregar.spec.ts` → 3 passaram
- T5 — prova: `npm run lint && npm run typecheck && npm run test:cov` → lint e tipos ok; 2661 de 2662 testes passaram
Regressão: a única falha, `RecordEnrollment.test.tsx` CA7 (texto de data "07/10"), passa isolada (16/16); instável por data, sem relação com o item. Não rodei `e2e` completo nem o visual (`test:visual:docker`): sem mudança visual; vale o CI do PR (limitação aceita 2).
Desvios: "Minha conta" só existe como link na variante menu do celular (no desktop vem do `UserMenu`, que já usa `Link`); o e2e a cobre a 360 px. O hook foi criado em `components/layout/useFocusOnRoute.ts` e reutilizado pelo portal, que não usa `AppLayout`. Comentário "D1: sem roteador" de `AppLayout.tsx` atualizado.
Referências visuais: nenhuma regerada.

## Verificação

### Rodada 1 — OK — 2026-11-20, estado fdb0ef56de8947bf7955df751d467e8247b86184

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | e2e desktop: percorre todos os itens do menu, URL muda, marcador em window vivo; testes de Sidebar com aria-current |
| CA2 | PASSOU | e2e 360 px (abas, Minha conta); Breadcrumb.test CA1; voltar do Topbar é Link (diff), sem teste próprio (sugestão) |
| CA3 | PASSOU | e2e portal "Portal, abas" a 360 px, marcador vivo |
| CA4 | PASSOU | e2e: goBack/goForward com URL e marcador |
| CA5 | PASSOU | useFocusOnRoute.test CA5 |
| CA6 | PASSOU | noInternalAnchors.test (2 testes); grep manual não achou `<a href` interno restante |

Comandos: vitest layout/portal/test (99 passaram); lint e typecheck ok; `npm run test:cov` 2662/2662; playwright navegacao-sem-recarregar 3 passaram; `test:visual:docker -g "moldura|portal-aluno|portal-celular-topo"` 28 passaram (sem --update-snapshots).
Achados:
- sugestão, código, e2e — não cobre trilha e voltar do cabeçalho pelo navegador; só testes unitários/diff.
- sugestão, código, e2e do portal — só a 360 px, não no desktop.

## Entrega

Muda: os links internos da gestão e do portal (itens do menu lateral, "Minha conta", abas do celular, trilha e voltar do cabeçalho) deixam de ser `<a href>` e passam a ser `Link` do roteador, sem recarregar a página. O foco vai para o `h1` da tela nova, ou para `#conteudo` quando não há `h1`, pelo hook `useFocusOnRoute`, usado em `AppLayout` e no portal. O teste `src/test/noInternalAnchors.test.ts` reprova `<a href="/...">` interno e `window.location` para rota interna em código de produção.

Verificação: rodada 1 `OK` (estado `fdb0ef56`), CA1 a CA6 passaram. `vitest` de layout e portal, `lint`, `typecheck` e `test:cov` com 2662 de 2662; e2e `navegacao-sem-recarregar` com 3 passando; `test:visual:docker -g "moldura|portal-aluno|portal-celular-topo"` com 28 passando, sem `--update-snapshots`.

Decisões: D1 (foco no `h1`, com `#conteudo` como reserva) e D2 (teste de busca no vitest, não regra de lint), ambas em "Decisões".

Limitações: trilha e voltar do cabeçalho têm só teste unitário e revisão do diff, sem e2e; o e2e do portal cobre só 360 px. Na regressão da construção, `RecordEnrollment.test.tsx` CA7 (texto de data "07/10") falhou na suíte completa e passou isolado (16 de 16); é instabilidade por data, sem relação com o item. A base não avançou desde a verificação, então a regressão não foi rodada de novo nesta entrega.
