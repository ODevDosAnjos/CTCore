# 457 — Componente base: Abas com contagem, paginação e folha de filtros no celular

Origem: issue #457 (Sprint 10.5, Fase 2, plano C3b), `docs/auditoria/decisoes-canvas.md`, `docs/auditoria/plano-de-issues.md` (C3b). Branch: `item/457-abas-paginacao-filtros-celular`. Canvas das telas-piloto: `Alunos.dc.html` e `GMAlunosFiltros.dc.html` (P1), `Mensalidades.dc.html` (F1). Dependências #448 e #456: mescladas em `dev`.

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Criar os três componentes de lista que faltam do canvas: **abas em pílula com contagem** (Ativos 131 / Em atraso 9 / Bloqueados 3 / Ex-alunos 46), **paginação do canvas** ("1–25 de 131 · Por página [25] ‹ ›") e **folha de filtros do celular** (botão "Filtros" que abre folha inferior com os filtros, "Ver N alunos" e "Limpar filtros"). Aplicar nas telas-piloto Alunos (P1) e Cobranças (F1). As demais telas trocam nas próprias issues (#465 a #496).

Fora do escopo: migrar outras telas; mudar API, OpenAPI, MSW ou backend; filtros do canvas sem dado no sistema ("Financeiro" como seletor, botão "Colunas", cabeçalho com "Exportar CSV" e "Nova matrícula": #465); a aba "Bloqueados" funcional (Sprint 12; fica "Em breve" pelo `ComingSoon` da #450); as abas de painéis de Minha conta, Unidade e Financeiro do portal citadas na evidência (M43, M20, M146: #490, #483, #492, que usam o `Tabs` de painéis já existente); a tabela em cartões no celular (#458).

## 2. Requisitos

- R1: `QuickFilters` (existente, `components/ui/quick-filters.tsx`) é o componente de "abas em pílula com contagem": pílula com rótulo e contagem em chip, ativa por tokens; ganha a opção `soon: true` por item, que mostra o `ComingSoon variant="tab"` na posição da opção (D1). Sem `soon`, comportamento e visual atuais (UsersPage) não mudam.
- R2: Alunos mostra as abas na ordem do canvas: Ativos, Em atraso, Bloqueados (Em breve), Ex-alunos, com a contagem do servidor (`counts.active`, `counts.overdue`, `counts.former`); os parâmetros `status` e `financial` e o segundo clique que desliga seguem como hoje (D2).
- R3: Cobranças mostra as abas Todas, Em atraso, Vence hoje, Em conferência, Pagas no mês, com a contagem do servidor (`counts`); "Todas" limpa o atalho `quick`; o link para a conferência e os demais filtros ficam como hoje (D3).
- R4: existe a paginação do canvas, opt-in na `QueryPage` pela prop `canvasPagination`: à esquerda "1–25 de 131"; à direita "Por página" com seletor de 32 px (25, 50, 100) e botões de ícone de 32 px "Página anterior" e "Próxima página" (área de toque de 44 px). `pagina`, `tamanho` e os tamanhos do contrato não mudam. Sem a prop, a paginação atual fica (D4).
- R5: existe `FilterSheet`; a `QueryPage` passa a entregar `total` e `clear` ao `filters` (D5). A partir de 640 px os filtros ficam na linha como hoje; abaixo de 640 px a linha mostra o botão "Filtros" (com a quantidade de filtros ativos) e os filtros abrem numa folha inferior com título "Filtros", um campo por filtro, o botão "Ver N …" (N é o total da consulta atual; texto vem da tela), que fecha a folha, e "Limpar filtros".
- R6: dentro da folha, `PillFilter` se apresenta como campo com rótulo acima e seletor nativo; fora dela continua a pílula (D6). Parâmetros do endereço e regras (Nível desabilitado sem modalidade; trocar a modalidade limpa o nível) não mudam.
- R7: Alunos e Cobranças usam os três componentes; as 9 outras telas que usam `QueryPage` não mudam de aparência.
- R8: textos só em `pt-BR.json`; cores, fontes e tamanhos só por tokens; axe passa nos dois temas para abas (com `soon`), paginação e folha (fechada e aberta); a 360 px não há rolagem lateral e a folha cabe na tela (rolagem interna).
- R9: componentes e uso constam em `docs/design/README.md` (tabela Componentes) e na Vitrine.
- R10: referências visuais de `alunos`, `cobrancas` e dos casos que abrem `/alunos` ou `/cobrancas` regeradas e comparadas com o canvas (1440 e 390, pt-BR); divergência restante vira `limiteCanvas` com motivo e a issue que a remove.

## 3. Critérios de aceite

- CA1 (R1): dado `QuickFilters` com uma opção `soon`, então há um botão `aria-disabled` com o rótulo e o selo "Em breve", sem `onClick`; sem `soon`, os testes atuais de `quick-filters.test.tsx` e da UsersPage passam sem mudança.
- CA2 (R2): dada a página Alunos com MSW, então as abas aparecem na ordem Ativos, Em atraso, Bloqueados, Ex-alunos, com as contagens do servidor; clicar em "Ex-alunos" grava `status=FORMER` e clicar de novo limpa; "Em atraso" grava `financial=OVERDUE`; "Bloqueados" não responde ao clique.
- CA3 (R3): dada a página Cobranças com MSW, então as abas aparecem com contagem; "Em atraso" grava `quick=OVERDUE` e a lista filtra; "Todas" limpa `quick`; "Em conferência" mostra o link para a conferência.
- CA4 (R4): dado `canvasPagination` e 131 resultados com tamanho 25, então aparece "1–25 de 131"; "Próxima página" leva a "26–50 de 131"; "Página anterior" fica desabilitado na página 1; trocar o tamanho para 50 volta à página 1; na última página o intervalo termina no total ("126–131 de 131").
- CA5 (R4): dado `QueryPage` sem `canvasPagination`, então a paginação atual aparece e os testes atuais passam sem mudança.
- CA6 (R5): dada largura abaixo de 640 px, então a linha tem o botão "Filtros" (com dois filtros ativos, "Filtros 2") e os filtros não estão soltos; ao abrir, a folha tem título "Filtros", os campos, "Ver 9 alunos" (total atual) e "Limpar filtros"; "Ver…" e Esc fecham; "Limpar filtros" zera os filtros no endereço e o total se atualiza.
- CA7 (R5): dada largura a partir de 640 px, então não há botão "Filtros" e os filtros ficam na linha; nos dois casos cada filtro existe uma vez só no DOM.
- CA8 (R6): dada a folha aberta em Alunos, quando escolho Modalidade e Nível pelo seletor, então os parâmetros são os de hoje; Nível fica desabilitado sem modalidade e trocar a modalidade limpa o nível.
- CA9 (R7): `StudentsPage.test.tsx` e `ChargesPage.test.tsx` passam (ajustados só no que muda de controle); os testes das outras telas com `QueryPage` passam sem mudança.
- CA10 (R8): `npm run lint` sem texto literal; `tokens.test.ts` passa; axe sem violação nos dois temas para abas (com `soon`), paginação e folha aberta e fechada; Vitrine a 360 px sem rolagem lateral.
- CA11 (R9): `design-readme.test.ts` passa com `FilterSheet` e a paginação na tabela.
- CA12 (R10): `npm run test:visual:docker` passa com referências regeradas só de `alunos`, `cobrancas`, `alunos-filtros`, `vitrine` e dos casos que abrem essas rotas; `npm run visual:canvas` não piora `alunos` e `cobrancas`; capturas em `.capturas/457/`.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (visual; nenhuma rota, dado ou permissão nova; `counts` e `total` já vêm do servidor).
- Interface:
  - `components/ui/quick-filters.tsx` (existe): `QuickFilter` ganha `soon?: boolean`; item `soon` renderiza `ComingSoon variant="tab"`. Ajuste de altura e chip de contagem só se a captura mostrar diferença.
  - `components/query/Pagination.tsx` (existe): nova função `CanvasPagination` (mesmos props) com "a–b de total", `Select` de 32 px, botões de ícone (`ChevronLeft`/`ChevronRight` do lucide-react, `aria-label` de `query.prev` e `query.nextPage`). A `Pagination` atual não muda.
  - `components/query/FilterSheet.tsx` (a criar): `FilterSheet({ activeCount, total, resultsLabel, onClear, children })`; hook `useBelowSm` (matchMedia `(max-width: 639px)`, mesmo padrão do `useWide` de `features/portal/PortalAgendaPage.tsx`, com guarda para jsdom sem `matchMedia`). Acima de sm renderiza `children` direto; abaixo, botão "Filtros" e `Dialog` do `@radix-ui/react-dialog` (como o `UnitMenu`) em folha inferior com `Dialog.Title` e descrição. Fornece o contexto `FilterSheetContext` que o `PillFilter` lê.
  - `components/ui/pill-filter.tsx` (existe): dentro do contexto da folha, `<label>` com rótulo acima e `Select` de `field.tsx` (opção vazia = `allLabel`), `disabled` mantido; fora dele nada muda.
  - `components/query/QueryPage.tsx` (existe): prop opcional `canvasPagination?: boolean` (usa `CanvasPagination`); o callback `filters` recebe também `total` e `clear` (campos novos, ignorados pelas telas atuais). Cada tela decide se embrulha os filtros em pílula no `FilterSheet` (as abas ficam fora, acima, nos dois tamanhos, como no canvas).
  - `features/students/StudentFilters.tsx` (existe): o grupo de botões vira `QuickFilters` (Ativos, Em atraso, `soon` Bloqueados, Ex-alunos) com o toggle de `status`/`financial` no `onChange`; os `PillFilter` ficam dentro do `FilterSheet` (`resultsLabel` = "Ver N alunos"). `StudentsPage.tsx` (existe) passa `canvasPagination`.
  - `features/charges/ChargeFilters.tsx` (existe): os botões de atalho viram `QuickFilters` com "Todas" primeiro (`QUICK` em `types.ts` tem as demais); os campos de data e seletores ficam dentro do `FilterSheet` ("Ver N cobranças"); a folha usa o campo com rótulo que eles já têm. `ChargesPage.tsx` (existe) passa `canvasPagination`.
  - `frontend/src/i18n/pt-BR.json`: `query.range` ("{{from}}–{{to}} de {{total}}"), `query.pageSizeShort` ("Por página"), `query.filters`, `query.filtersCount`, `students.showResults`, `charges.showResults`, `charges.quick.ALL` ("Todas"); `query.clear` já existe ("Limpar filtros").
  - `frontend/src/dev/Vitrine.tsx` e `docs/design/README.md`: abas com `soon`, `CanvasPagination`, `FilterSheet`.
  - `frontend/visual/casos.ts`: `alunos` e `cobrancas` já existem; acrescentar `alunos-filtros` (390 px, passo clicar "Filtros", canvas `GMAlunosFiltros`) com dados do MSW que já existem.
  - `frontend/visual/referencias/`: `alunos`, `cobrancas`, `alunos-filtros`, `vitrine` e os casos de moldura e outros que abrem `/alunos` ou `/cobrancas`, 1440 e 390, claro e escuro.
  - Testes: `quick-filters.test.tsx`, `FilterSheet.test.tsx` (a criar), `QueryPage.test.tsx` (casos novos), `pill-filter.test.tsx` (modo folha), `StudentsPage.test.tsx`, `ChargesPage.test.tsx`, `test/a11y.test.tsx`; e2e em `frontend/e2e/` que clique nos botões de atalho ou na paginação por texto.
- Reuso: `QuickFilters`, `ComingSoon`, `PillFilter`, `usePopover`, `Select`, `Dialog` do Radix (já instalado), `useQueryParams.clear`, tokens existentes.
- Riscos: `QueryPage` serve 11 telas (por isso tudo é opt-in); testes de Alunos e Cobranças que clicam nos atalhos por nome (`Ativos, 131`) ou usam o texto da paginação antiga; jsdom sem `matchMedia` (helper de teste escolhe a largura); axe com `Dialog` aberto exige título e descrição; regerar referências no container reprova casos de moldura que abrem `/alunos` (como na #456); em Cobranças a barra de datas e seletores é longa e a folha precisa rolar por dentro.

## 5. Tarefas

- [ ] T1: `QuickFilters` com `soon` e chaves de pt-BR; testes — cobre CA1 — prova: `cd frontend && npx vitest run src/components/ui/quick-filters.test.tsx src/features/users`
- [ ] T2: `CanvasPagination` e prop `canvasPagination` na `QueryPage`; testes — cobre CA4, CA5 — prova: `cd frontend && npx vitest run src/components/query`
- [ ] T3: `FilterSheet`, contexto, modo folha do `PillFilter`, `total` e `clear` no `filters` da `QueryPage`; testes com largura estreita e larga — cobre CA6, CA7 — prova: `cd frontend && npx vitest run src/components/query src/components/ui/pill-filter.test.tsx`
- [ ] T4: aplicar em Alunos (`StudentFilters`, `StudentsPage`) e ajustar `StudentsPage.test.tsx` — cobre CA2, CA8, CA9 — prova: `cd frontend && npx vitest run src/features/students/StudentsPage.test.tsx`
- [ ] T5: aplicar em Cobranças (`ChargeFilters`, `ChargesPage`) e ajustar `ChargesPage.test.tsx` — cobre CA3, CA9 — prova: `cd frontend && npx vitest run src/features/charges/ChargesPage.test.tsx`
- [ ] T6: axe nos dois temas (abas com `soon`, paginação, folha fechada e aberta), Vitrine e `docs/design/README.md` — cobre CA10, CA11 — prova: `cd frontend && npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev`
- [ ] T7: caso visual `alunos-filtros`, regerar referências no container, comparar com o canvas (1440 e 390, pt-BR, `.capturas/457/`) e listar divergências no PR — cobre CA12 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots=all -g "alunos|cobrancas|moldura|vitrine|notificacoes|professor-novo"` e `npm run visual:canvas`
- [ ] T8: regressão do front — não cobre critério novo: confere CA5 e CA9 em conjunto, as outras telas e o e2e — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov && npm run e2e`

## 6. Decisões

- D1: as "abas em pílula com contagem" são o `QuickFilters` que já existe (pílula com contador e `aria-pressed`), com a opção `soon` para "Bloqueados"; não se cria um terceiro componente de abas. Motivo: no canvas as abas de Alunos e Cobranças filtram a lista (sem painéis), que é o que `QuickFilters` faz; o `Tabs` de painéis fica para telas com conteúdo por aba (#483, #490). Alternativa: `PillTabs` novo com `role="tablist"`, descartada (duplica o que existe).
- D2: em Alunos o segundo clique na aba ativa continua desligando o filtro, e "Em atraso" continua sendo `financial=OVERDUE` (não `status`). Ao escolher uma aba, a tela limpa o parâmetro da outra, para as quatro ficarem exclusivas como no canvas. Suposição: não muda regra nem API; só deixa de ser possível marcar "Ativos" e "Em atraso" juntas pela tela (o endereço ainda aceita as duas).
- D3 (muda o comportamento da tela): em Cobranças "Todas" entra como primeira aba e as abas passam a ser exclusivas (escolher outra troca; "Todas" limpa); some o segundo clique para desligar. Motivo: o canvas vence no visual. Alternativa: manter o toggle sem "Todas", descartada.
- D4: a paginação do canvas é opt-in por `canvasPagination`, não troca da `Pagination` global. Motivo: "nenhuma outra tela mudou de aparência sem a sua própria issue" (mesma lógica da D2 da #456); cada issue de tela liga a prop (#465 a #496) e a `Pagination` antiga sai quando a última migrar. Alternativa: trocar para todas, descartada (quebra o critério de pronto).
- D5: o `FilterSheet` é composto pela tela (não por prop da `QueryPage`), porque as abas ficam fora da folha e só os filtros em pílula entram nela; por isso o `filters` ganha `total` e `clear`. Abaixo de 640 px (mesmo ponto de quebra da #458) os filtros só existem dentro da folha. "Ver N alunos" só fecha a folha (os filtros já gravam no endereço ao escolher; o canvas só tem "Ver 9 alunos" e "Limpar filtros", sem "Aplicar"). "Limpar filtros" usa o `clear` da `QueryPage`, que zera também busca e abas (suposição: aceitável; se o dono quiser manter busca e abas, ajusta-se no componente). Alternativa: aplicar só ao fechar, descartada (estado duplicado sem ganho).
- D6: o `PillFilter` muda de forma por contexto (pílula fora da folha, campo com seletor nativo dentro dela), em vez de a tela escrever dois conjuntos de filtros. Motivo: um conjunto só, sem controles duplicados no DOM (axe e testes). Alternativa: renderizar duas vezes e esconder por CSS, descartada.
- D7: a evidência cita Minha conta, Unidade, Comunicados e Financeiro do portal (M43, M20, M17, M146); o que é abas de painéis, paginação ou folha dessas telas fica nas issues delas (#490, #483, #491, #492). Esta issue entrega o componente e as duas pilotos.
- Suposição: o canvas `GMAlunosFiltros` desenha a folha com Modalidade, Turma, Faixa etária, Situação financeira e Selo; o sistema mantém os seus filtros (Unidade, Faixa etária, Selo, Modalidade, Turma, Nível), e a #465 acerta o conjunto. O texto "Nenhum"/"Todas" na folha segue o `allLabel` já existente; se a captura mostrar diferença, ajusta-se só o texto.

## Construção

- T1 — arquivos: components/ui/quick-filters.tsx (+teste); pt-BR.json — prova: vitest quick-filters + features/users → passou
- T2 — arquivos: components/query/Pagination.tsx (CanvasPagination), QueryPage.tsx (canvasPagination), QueryPage.test.tsx — prova: vitest src/components/query → passou
- T3 — arquivos: components/query/FilterSheet.tsx (+teste), ui/pill-filter.tsx (+teste), QueryPage.tsx (total, clear), test/device.ts (setDeviceNarrow) — prova: vitest query + pill-filter → passou
- T4 — arquivos: features/students/StudentFilters.tsx, StudentsPage.tsx, StudentsPage.test.tsx — prova: vitest StudentsPage → 25 passaram
- T5 — arquivos: features/charges/ChargeFilters.tsx, ChargesPage.tsx, ChargesPage.test.tsx — prova: vitest ChargesPage → passou
- T6 — arquivos: dev/Vitrine.tsx, docs/design/README.md, FilterSheet.test.tsx (axe, dois temas, folha aberta e fechada) — prova: vitest a11y, design-readme, tokens, dev → passou
- T7 — arquivos: visual/casos.ts (caso alunos-filtros, passo seExistir), visual/telas.visual.ts, referências regeradas; capturas em .capturas/457/ — prova: test:visual:docker --update-snapshots=all -g ..., npm run visual:canvas → 97 comparadas, 0 reprovadas
- T8 — prova: npm run lint, typecheck → ok; test:cov → 2052 passaram, 1 instável diferente por rodada (ChargePreviewPage, LoginPage) que passa isolado; e2e → 98 passaram
Regressão: sem piora em relação à linha de base; as duas falhas do test:cov são de tempo e passaram ao rodar de novo.
Desvios: (1) Pagination do canvas e QuickFilters ajustados por axe label-content-name-mismatch: o texto visível passou a ter espaço antes da contagem; (2) FilterSheet recebe só resultsLabel pronto (sem prop total), a tela monta "Ver N alunos"; (3) passo visual ganhou seExistir para clicar em "Filtros" só abaixo de 640 px; (4) GMAlunosFiltros saiu da lista semCaso; (5) Vitrine troca a Pagination antiga pela CanvasPagination (duas nav iguais reprovam no axe); (6) abas ganham order-first para ficarem acima da busca, como no canvas.
Divergências do canvas (para o PR): Bloqueados Em breve tem altura de 44 px (o ComingSoon variant tab); título da folha, rótulos e botão Limpar ajustados; o canvas tem Situação financeira e Selo "Nenhum" e o conjunto de filtros de Alunos fica para a #465; o cabeçalho com Exportar CSV, Nova matrícula e Colunas fica para a #465.
Referências visuais: cobranca-avulsa e cobranca-antecipar (4 cada), alunos, cobrancas, alunos-filtros (novos), vitrine, moldura-administrador, moldura-coordenacao, moldura-celular-menu 1440, moldura-celular-unidade, notificacoes 1440 e 390 escuro (em frontend/visual/referencias/)

## Verificação

### Rodada 1 — OK — 2026-11-09, estado bfb13af261e35df3ff9598faab11c3246e657287

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA9 | PASSOU | vitest de src/components, features/students, charges, users, a11y, dev: 70 arquivos, 566 testes passaram |
| CA10 | PASSOU | lint e typecheck sem erro; tokens.test e a11y dentro dos 566 |
| CA11 | PASSOU | design-readme.test dentro dos 566 |
| CA12 | PASSOU | test:visual:docker: 365 passaram, 4 falharam por timeout de 30 s (vitrine) sob carga; rodando só vitrine: 4 passaram; capturas em .capturas/457/ (sem canvas 390 de alunos e cobrancas; relatório do construtor: 97 comparadas, 0 reprovadas, não rerodado) |

Comandos: npm run lint, npm run typecheck, vitest (escopo acima), npm run test:visual:docker (completo e -g vitrine). test:cov e e2e não rerodados (construtor: 2052 e 98 passaram).
Instáveis: vitrine (4 casos visuais) timeout em 1 de 2 execuções, passa isolado; ChargePreviewPage e LoginPage no test:cov (relato do construtor).
Achados:
- sugestão, código, .capturas/457 — faltam canvas 390 de alunos e cobrancas; confirmar que o canvas não tem versão de celular.

## Entrega

- O que muda: `QuickFilters` ganha `soon` (aba "Bloqueados" em breve, `ComingSoon variant="tab"`); `CanvasPagination` e a prop `canvasPagination` na `QueryPage`; `FilterSheet` (folha inferior abaixo de 640 px, com botão "Filtros N", título "Filtros", "Ver N …" e "Limpar filtros"); `PillFilter` vira campo com rótulo e seletor dentro da folha; Alunos e Cobranças usam abas, paginação e folha. As demais telas que usam `QueryPage` não mudam (opt-in).
- Verificação: rodada 1 OK (estado `bfb13af261e35df3ff9598faab11c3246e657287`). Lint e typecheck sem erro; vitest dos escopos 566 testes passaram; visual com MSW: 97 comparadas com o canvas, 0 reprovadas (relatório do construtor); `test:cov` 2052 passaram e `e2e` 98 passaram (relato do construtor).
- Decisões: D1 a D7 da especificação. Abas de Alunos e Cobranças passam a ser exclusivas (D2, D3). "Limpar filtros" zera também busca e abas (D5, suposição a confirmar pelo dono).
- Divergências do canvas: "Bloqueados" em breve com 44 px (`ComingSoon` tab); folha de Alunos sem Situação financeira e Selo "Nenhum", e cabeçalho sem Exportar CSV, Nova matrícula e Colunas (ficam para a #465).
- Limitações: não há canvas de celular próprio para Alunos e Cobranças em 390 px; a comparação de 390 usa o 1440 como referência (achado da verificação, registrado).
- Instabilidades: `ChargePreviewPage` e `LoginPage` no `test:cov` (passam ao rodar de novo); vitrine no visual sob carga (passa isolada).
- Regressão de entrega: a base `dev` não avançou desde a verificação (HEAD = `origin/dev` = `93b4670`), então a regressão da verificação vale e não foi rodada de novo.
