# 624 — Menu lateral e rolagem: ícones só nos grupos, painel flutuante no recolhido, um grupo aberto e barra de rolagem discreta em todo o sistema

Origem: issue #624 (Sprint 10.5), decisões 23 e 25 de `docs/auditoria/decisoes-canvas.md`, canvas `docs/design/canvas/Sidebar.dc.html`. Branch: `item/624-menu-lateral-e-rolagem`.

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Deixar o menu lateral da gestão como o canvas e as decisões do dono pedem: ícone só em Início e nos grupos, subitens só com texto, menu recolhido só com os ícones dos grupos e um painel flutuante com os subitens, um grupo aberto por vez. Em todo o sistema (gestão e portal), trocar a barra de rolagem do sistema operacional por uma barra fina nos tokens do tema, sem setas, visível só ao passar o mouse ou rolar, e tirar a rolagem onde ela não é necessária.

Fora do escopo: itens e agrupamento do menu (Configurações em quatro itens é a #625); animações de movimento (#645); recalibrar o `visual:canvas` (#714); portal não tem menu lateral (só a rolagem o atinge).

## 2. Requisitos

- R1: Só Início e os cabeçalhos de grupo têm ícone; os subitens ficam só com texto, recuados, com uma linha fina vertical à esquerda ligando-os ao grupo (D1). Vale no menu lateral aberto e no menu em tela cheia do celular.
- R2: Menu recolhido (72 px) mostra só os ícones de Início e dos grupos (Pessoas, Operação, Financeiro, Comunicação, Relatórios, Configurações, conforme o perfil) e o rodapé; sem lista de subitens e sem rolagem causada por eles.
- R3: No recolhido, clicar no ícone de um grupo abre um painel flutuante ao lado, com o nome do grupo e os subitens (contador quando houver; desabilitados com "Em breve"). Fecha com Esc, clique fora e ao navegar (D2).
- R4: Acessibilidade do painel: o botão do grupo tem `aria-expanded`; ao abrir o foco vai para o primeiro subitem habilitado; ao fechar por Esc ou ao fechar sem navegar o foco volta ao ícone; abre e fecha pelo teclado; sem violação no axe nos dois temas.
- R5: Início e Relatórios (grupos de um item só) continuam links diretos no recolhido, sem painel.
- R6: Um grupo aberto por vez (acordeão) no menu lateral aberto: abrir um fecha o outro; ao navegar, o grupo da página atual abre e os demais fecham (D3, muda o comportamento).
- R7: Barra de rolagem fina em todo o sistema, nos tokens do tema claro e escuro, sem setas, visível só ao passar o mouse ou rolar; no menu usa a cor dos tokens do menu escuro (D4).
- R8: Onde não há o que rolar não há barra: a linha de abas (`Tabs`) não mostra barra vertical; o menu só rola quando passa da altura da tela e o rodapé (Ajuda, Novidades, Recolher menu) continua fixo.
- R9: Análise de todas as áreas com rolagem (menu, abas, tabelas, janelas, painéis, portal) com lista dos lugares onde a rolagem foi tirada por não ser necessária, no PR e no arquivo do item.
- R10: Os quatro estados, 360 px e textos em `pt-BR.json` valem para o que muda; casos do teste visual do menu aberto, recolhido e do painel flutuante.

## 3. Critérios de aceite

- CA1 (R1): dado o menu aberto em 1440 px, quando se olha Início e os grupos, então cada um tem ícone, e nenhum subitem (Alunos, Pedidos, Agenda…) tem `svg`; os subitens estão recuados com a linha vertical à esquerda.
- CA2 (R1): dado o menu em tela cheia a 390 px, então os subitens também não têm ícone.
- CA3 (R2): dado o menu recolhido, então só há Início, um botão por grupo (com nome acessível e `title`) e o rodapé; nenhum link de subitem fica na árvore enquanto nenhum painel está aberto, e a coluna do menu não rola com o perfil Coordenador a 1440x900.
- CA4 (R3): dado o menu recolhido, quando clica no ícone de Operação, então abre o painel ao lado com o título "Operação" e os subitens; um subitem de sprint futura aparece desabilitado com "Em breve"; Pedidos mostra o contador quando houver.
- CA5 (R3): dado o painel aberto, quando pressiona Esc, clica fora ou clica num subitem, então ele fecha; ao navegar, a tela muda e o painel não reabre.
- CA6 (R4): dado o painel aberto pelo teclado (Enter no ícone), então o foco está no primeiro subitem habilitado; com Esc o painel fecha e o foco volta ao ícone do grupo; `aria-expanded` do botão é `true` aberto e `false` fechado.
- CA7 (R4): dado o painel aberto, axe sem violação nos tema claro e escuro.
- CA8 (R5): dado o recolhido, quando clica em Início, então navega direto, sem painel.
- CA9 (R6): dado Pessoas aberto, quando abre Financeiro, então Pessoas fecha (`aria-expanded` "false"); dado a navegação por link ou aba para outra área, então o grupo da página nova abre e os outros fecham; dentro do mesmo grupo nada fecha.
- CA10 (R6): dado o menu recolhido e depois expandido, então abre o grupo da página atual.
- CA11 (R7): dado qualquer tela da gestão e do portal, nos dois temas, quando se mede um elemento rolável, então `scrollbar-width` é `thin`, a cor da barra é transparente sem hover e a do token com hover, e o menu usa o token do menu.
- CA12 (R8): dado Minha conta (e qualquer tela com `Tabs`) sem excesso de abas, então a linha de abas não rola na vertical e não mostra barra; com abas demais a 360 px rola só na horizontal.
- CA13 (R8): dado o menu mais baixo que a lista (janela de 500 px de altura), então a navegação rola com a barra fina e o rodapé continua visível sem rolar.
- CA14 (R9): dado o arquivo do item, então ele traz a tabela "Rolagem analisada" (lugar, decisão: mantida/tirada, motivo).
- CA15 (R10): dado os casos novos, quando roda `npm run test:visual:docker -- -g "moldura-"` sem `--update-snapshots`, então passam; o 360 px não tem rolagem horizontal.

## 4. Plano técnico

- Dados e API: não mudam (OpenAPI e MSW sem alteração; o contador vem de `badges`, já existente).
- Interface: `Sidebar` ganha ícone só no grupo; subitem em texto com `border-l` do token do menu e recuo; no recolhido cada grupo vira um botão que abre `GroupFlyout` (painel `position: fixed` ancorado ao botão, à direita dos 72 px, `role="dialog"` com nome do grupo, não modal). Abertura focada no primeiro subitem; Esc e clique fora com `usePopover`; fecha ao navegar (efeito na troca de `location.pathname`). Acordeão: o estado `open` passa de `Set` a um único id (`string | null`), recalculado ao mudar `activeId` (hoje só acrescenta, linhas 42 a 47). O menu em tela cheia (`variant="menu"`) segue com todos os grupos abertos e sem ícone nos subitens.
- Rolagem: regras globais em `index.css` (`scrollbar-width: thin`, `scrollbar-color` transparente e, no `:hover`, com os tokens novos `--scrollbar-thumb` claro e escuro; variante `--sidebar-scrollbar` para o `nav` do menu, com `scrollbar-gutter` estável para o conteúdo não pular). Tokens documentados em `docs/design/README.md`; `tokens.test.ts` cobre. Tirar a rolagem sobrando: `tabs.tsx` linha 43 (`overflow-x-auto` faz o eixo vertical virar `auto`: acrescentar `overflow-y-hidden`); varrer as demais ocorrências de `overflow-*` listadas (DataTable, Modal, drawer, UnitMenu, pill-filter, MobileMenu, AgendaWeekGrid, PortalFamilyStrip e as telas) e tirar a barra vertical/horizontal sem conteúdo a rolar.
- Segurança: não se aplica (sem dado novo; permissão de item segue no mapa de rotas, sem mudança).
- Arquivos a alterar (vistos): `frontend/src/components/layout/Sidebar.tsx` (`link()` sem ícone nos subitens, estado do acordeão, botão de grupo no recolhido, remoção de `collapsed || expanded`), `frontend/src/components/layout/MobileMenu.tsx` (rolagem da folha), `frontend/src/components/ui/tabs.tsx`, `frontend/src/index.css`, `frontend/src/i18n/pt-BR.json` (rótulos do painel e do botão de grupo), `frontend/src/components/layout/Sidebar.test.tsx` (CA1 a CA10; o teste "RNF-43: … sem fechar os que já estavam abertos" muda para o acordeão, D3), `frontend/src/test/a11y.test.tsx` (painel aberto, dois temas), `frontend/e2e/moldura-fixa.spec.ts` (o trecho recolhido usa `a[href]` do subitem: passa a abrir o painel), `frontend/visual/casos.ts` (casos novos e referências em `frontend/visual/referencias`), `docs/design/README.md` (linha do menu e tokens de rolagem).
- Arquivos a criar: `frontend/src/components/layout/GroupFlyout.tsx` (painel), `frontend/src/components/layout/GroupFlyout.test.tsx`, `frontend/e2e/menu-lateral.spec.ts` (menu dentro da moldura, teclado e rolagem), e os testes de rolagem em `frontend/src/components/scrollbar.test.ts` (confere os tokens no CSS e a ausência de `overflow-*` sem motivo nas telas, por varredura de texto).
- Reuso: `usePopover` (Esc e clique fora), `iconFor` e `badgeText`, `ComingSoon`/`layout.soon`, tokens `sidebar*`, `NavGroup` do `AppLayout`, `Popover` base apenas como referência de comportamento.
- Riscos: clique no `<a>` do painel fechar antes da navegação (usar fechar ao mudar de rota, não só no clique); `scrollbar-color` ignorado em navegador sem suporte (cai na barra padrão: aceitável, D4); `overflow-y-hidden` nas abas cortar o anel de foco (conferir no visual e dar `py` ao `tablist`); a regressão local reduzida deve rodar o visual inteiro, porque a moldura muda (AGENTS.md).

## 5. Tarefas

- [x] T1: `Sidebar.tsx`: subitens sem ícone, recuo e linha vertical, no menu aberto e no menu em tela cheia — cobre CA1, CA2 — prova: `npm test -- Sidebar.test`
- [x] T2: `Sidebar.tsx`: acordeão (um grupo aberto; o da página atual abre e fecha os demais; expandir após recolher abre o da página) e ajuste do teste RNF-43 antigo — cobre CA9, CA10 — prova: `npm test -- Sidebar.test`
- [x] T3: `GroupFlyout.tsx` e recolhido só com ícones de grupos; Início e Relatórios diretos; painel com título, contador, "Em breve", foco, Esc, clique fora e fechar ao navegar; textos em `pt-BR.json` — cobre CA3, CA4, CA5, CA6, CA7, CA8 — prova: `npm test -- GroupFlyout Sidebar a11y`
- [x] T4: Rolagem global: tokens `--scrollbar-thumb` e `--sidebar-scrollbar` (claro e escuro), regras em `index.css`, `docs/design/README.md` e teste dos tokens — cobre CA11 — prova: `npm test -- tokens scrollbar`
- [x] T5: Análise de rolagem: corrigir `tabs.tsx` e demais áreas sem o que rolar, registrar a tabela "Rolagem analisada" no arquivo do item e a lista no PR; menu com rodapé fixo — cobre CA12, CA13, CA14 — prova: `npm test -- tabs scrollbar` e `npm run e2e -- menu-lateral`
- [x] T6: E2E `menu-lateral.spec.ts`, ajuste de `moldura-fixa.spec.ts`, casos visuais (`moldura-recolhido`, `moldura-painel-grupo` a 1440 e 390 px, referências só deles e das molduras afetadas) e comparação com o canvas `Sidebar` — cobre CA15, CA3, CA6, CA13 — prova: `npm run e2e -- menu-lateral moldura-fixa` e `npm run test:visual:docker -- -g "moldura-"`

## 6. Decisões

- D1: a linha vertical dos subitens vem do pedido do dono na issue; o `Sidebar.dc.html` só recua (42 px) e não a desenha. Escolhida a linha fina na cor `sidebar-accent`, recuo próximo dos 42 px do canvas. Alternativa: só recuar como no canvas (descartada: a issue pede a linha).
- D2 (muda o comportamento): no recolhido o clique no ícone abre o painel, no lugar de navegar para o primeiro subitem como faz o canvas. Vem da decisão 23. Início e Relatórios continuam navegando direto.
- D3 (muda o comportamento): o acordeão vale também ao navegar: o grupo da página atual abre e fecha os outros, no lugar da regra da #675 ("abre sem fechar os que já estavam abertos"). Prevalece a issue (decisão 23); o teste antigo muda. Dentro do mesmo grupo nada fecha, então o e2e da #675 segue verdadeiro. Alternativa: manter vários abertos ao navegar (descartada: contradiz "um grupo aberto por vez").
- D4: barra de rolagem por CSS padrão (`scrollbar-width`, `scrollbar-color`), sem biblioteca nem `::-webkit-scrollbar`; "visível ao passar o mouse ou rolar" é o estado `:hover` do elemento rolável (rolar com a roda exige o ponteiro sobre ele). Navegador sem suporte mostra a barra padrão. Alternativa: barra customizada em JS (descartada: custo e risco sem ganho).
- D5: no menu em tela cheia do celular os grupos continuam abertos (não há acordeão nem painel), só os subitens perdem o ícone, por coerência com o menu lateral.
- D6: a divergência de largura do painel flutuante com o canvas não existe (o canvas não mostra o painel): ele segue `docs/design/README.md` (menu suspenso: sombra `shadow-menu`, cantos 12 px, tokens do menu escuro); registrar no PR como "sem canvas".
- Suposição: o painel não precisa abrir em hover (só clique), porque a issue diz "clicar". Se o dono quiser hover, é item novo.
- Suposição: o `Tabs` de Minha conta é a causa da barra vertical com setas citada na issue; se a varredura achar outra causa, a tabela de T5 registra.

## Construção

- T1 — arquivos: `frontend/src/components/layout/Sidebar.tsx` (subitem sem ícone, recuo `ml-5 pl-2` e `border-l` na cor `sidebar-accent`; vale na variante `menu`), `Sidebar.test.tsx` — prova: `npm test -- Sidebar.test` → passou
- T2 — arquivos: `Sidebar.tsx` (estado `open` único; ao mudar o item ativo ou expandir depois de recolhido abre o grupo da página), `Sidebar.test.tsx` (RNF-43 antigo virou CA9/CA10), `features/permissions/ManagementShell.test.tsx` (ao ir ao Início o Pessoas fecha) — prova: `npm test -- Sidebar.test ManagementShell` → passou
- T3 — arquivos criados: `GroupFlyout.tsx`, `GroupFlyout.test.tsx`; alterados: `Sidebar.tsx` (recolhido só com Início, ícone por grupo e rodapé; Início e Relatórios diretos), `AppLayout.tsx` (`aside` com `z-30`: o painel `fixed` ficava sob o conteúdo, pois o `sticky` cria contexto de empilhamento), `src/test/a11y.test.tsx` (CA7, dois temas). Os textos do painel reutilizam `layout.soon` (nenhuma chave nova em `pt-BR.json`: o título e o nome do botão vêm do nome do grupo) — prova: `npm test -- GroupFlyout Sidebar a11y` → passou
- T4 — arquivos: `src/index.css` (`--scrollbar-thumb` claro `#B8B2A5` e escuro `#55555C`, `--sidebar-scrollbar` `#4A4A52`; regras `*`, `*:hover`, `[data-sidebar-scroll]`), `docs/design/README.md` (tokens, linha do menu e regra da barra), `src/components/scrollbar.test.ts` — prova: `npm test -- scrollbar tokens` → passou
- T5 — arquivos: `ui/tabs.tsx` e `features/students/StudentRecordPanel.tsx` (`overflow-y-hidden` na faixa de abas); no `tabs.tsx` o divisor passou de `border-b` + `-mb-px` para `shadow-[inset_0_-1px_0_var(--divider)]` sem `-mb-px` (o `-mb-px` deixava 1 px de excesso vertical, que `overflow-y-hidden` cortaria o traço da aba ativa; mesma posição visual) e o anel de foco da aba ficou `ring-inset` (não é cortado); `Sidebar.tsx`: `nav` com `data-sidebar-scroll`, rodapé fora da lista (já era) — prova: `npm test -- scrollbar` e `npm run e2e -- menu-lateral` → passou
- T6 — arquivos: `e2e/menu-lateral.spec.ts` (4 testes), `e2e/moldura-fixa.spec.ts` (recolhido abre o painel; acordeão), `visual/casos.ts` (`moldura-recolhido`, `moldura-painel-grupo`; os passos usam `seExistir` porque a 390 px não há botão de recolher, então a referência de 390 é a tela sem menu) — prova: `npm run e2e -- menu-lateral moldura-fixa` → 12 passaram; `npm run test:visual:docker -- -g "moldura-"` → 28 passaram

Regressão: `npm run lint`, `typecheck`, `build` → ok; `npm test` → 277 arquivos, 3042 testes, passou (1ª rodada: 1 falha instável em `RecordEnrollment.test` CA7 sob carga, passou isolada 2 vezes e na 2ª rodada completa); `npm run e2e` (critical, inteiro) → 122 passaram; `npm run test:visual:docker -- --workers=2` (suíte inteira, sem atualizar) → 434 passaram e 230 falharam, todas a 1440 px, só na região do menu (conferido o diff de `ficha-aluno-1440-claro`); as 115 telas afetadas (230 imagens) foram regeradas com `-- --update-snapshots -g "<casos> 1440"`. Não rodou: `mvnw` (sem mudança no back-end), `test:cov` (fica para o CI).
Regressão local: 49 min (visual inteiro 34 min, regeração 11 min, e2e 5,5 min, testes e build o resto)
Comparação com o canvas: 15 min (capturas em `.capturas/624/`: `moldura-coordenacao-1440-claro` e `moldura-professor-1440-claro` x canvas `Sidebar` e `GMMenu`, `moldura-celular-menu-390-claro` x `GMMenu`; `npm run visual:canvas` → 165 comparadas, 0 reprovadas)
Visual do CI: moldura-coordenacao → passou; moldura-administrador → passou; moldura-professor → passou; moldura-celular-menu → passou; moldura-celular-unidade → passou; moldura-recolhido → passou; moldura-painel-grupo → passou (todos por `-g "moldura-"`, 28 casos)
Referências visuais: 8 novas (`moldura-recolhido-*`, `moldura-painel-grupo-*`, 1440 e 390, claro e escuro) e 242 regeradas: as 4 de cada caso `moldura-*` existente e as telas de gestão a 1440 px (115 casos, claro e escuro) cujo menu lateral muda (subitens sem ícone, linha vertical, acordeão); a única mudança nelas é a região do menu. Lista completa: `git status --short frontend/visual/referencias`.
Padrão de rotas e telas: `shell.test.ts`, `noInternalAnchors.test.ts`, `routePattern.test.ts` verdes dentro do `npm test`; e2e `menu-lateral.spec.ts` abre o menu dentro da moldura.

### Rolagem analisada (R9, CA14)

| Lugar | Decisão | Motivo |
| --- | --- | --- |
| Menu lateral (`nav` do `Sidebar`) | mantida | só rola quando a lista passa da altura; rodapé fora da lista, fixo; barra do menu |
| Menu recolhido | tirada | sem subitens na lista, não há o que rolar (conferido a 1440x900 no e2e) |
| Painel flutuante do grupo | mantida | `max-h` até a borda da tela, rola só se passar |
| Menu em tela cheia do celular (`MobileMenu`) | mantida | a folha inteira rola quando a lista passa da tela |
| `Tabs` (faixa de abas) | tirada (vertical) | `overflow-x-auto` fazia o eixo vertical virar `auto`; agora `overflow-y-hidden`; na horizontal rola só com abas demais |
| Abas da ficha do aluno (`StudentRecordPanel`) | tirada (vertical) | mesma causa; `overflow-y-hidden` |
| Tabelas (`DataTable`, `FirstChargeTable`, `AgendaWeekGrid`, tabelas das janelas e das telas de configuração) | mantida | rolagem horizontal real em 360 px; vertical só pelo conteúdo |
| `Modal`, `drawer`, `SidePanel`, folhas de baixo (`UnitMenu`, `FilterSheet`) | mantida | corpo da janela rola quando passa da altura; cabeçalho e rodapé fixos |
| `Popover`, `pill-filter` (lista suspensa) | mantida | `max-h` com lista longa |
| Linhas de filtros em pílulas (`ChargeFilters`, `PortalAnnouncementsPage`, `PortalRequestsPage`, `PortalFamilyStrip`) | mantida | rolagem horizontal no celular; o eixo vertical não foi cortado porque há listas suspensas e anéis de foco dentro delas (cortaria) |
| `PortalTermPage` (texto do termo, `h-80`) | mantida | texto longo, rolagem pedida pelo termo |
| Barra de rolagem de todos esses | trocada | fina, sem setas, só com o ponteiro sobre o elemento (`index.css`) |

Desvios: (1) nenhuma chave nova em `pt-BR.json` (o plano previa rótulos do painel; o título e o nome do botão são o nome do grupo e "Em breve" já existe). (2) `aside` do `AppLayout` ganhou `z-30` (não estava no plano; necessário para o painel ficar sobre a tela). (3) Divisor das `Tabs` por `box-shadow` inset no lugar de `border-b` + `-mb-px` (ver T5). (4) Fechar o painel com clique fora não devolve o foco ao ícone (o foco vai a quem foi clicado); Esc devolve. (5) Divergências com o canvas (para o PR): o canvas Sidebar mostra todos os grupos fechados e Início ativo, o sistema mostra o grupo da página aberto (comportamento da #675 e do acordeão); painel flutuante e menu recolhido sem canvas (D6).
Não é do item: nenhum.

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-25, estado 8977147f6edc3f723fb2c417f8796fa851e66d83

| Critério | Status | Evidência |
|---|---|---|
| CA1, CA2 | PASSOU | `Sidebar.test` (subitens sem `svg`, `border-l`; variante menu) dentro de `npm test` verde |
| CA3 | PASSOU | `Sidebar.test` CA3 + e2e `menu-lateral` (sem `a[href='/alunos']`, `scrollHeight <= clientHeight` a 1440x900) |
| CA4, CA5, CA6 | PASSOU | `GroupFlyout.test` (CA4/5/6) e e2e `menu-lateral` recolhido (Enter, foco, Esc, clique fora, Início) |
| CA7 | PASSOU | `a11y.test` CA7, dois temas |
| CA8 | PASSOU | `Sidebar.test` CA8 |
| CA9, CA10 | PASSOU | `Sidebar.test` CA9/CA10, `ManagementShell.test` |
| CA11 | PASSOU (parcial) | `scrollbar.test` confere o CSS (`scrollbar-width: thin`, token, token do menu) e e2e mede `scrollbar-width` no menu e na faixa de abas; a medição da cor por tema em elemento real não é feita (ver sugestão) |
| CA12, CA13 | PASSOU | e2e `menu-lateral` (abas `overflow-y: hidden`, menu a 500 px rola e rodapé visível) |
| CA14 | PASSOU | tabela "Rolagem analisada" acima |
| CA15 | PASSOU | `npm run test:visual:docker -- -g "moldura-"` → 28 passaram, sem `--update-snapshots` |

Comandos: `npm run lint`, `typecheck`, `build` → ok; `npm test` → 277 arquivos, 3042 testes passaram; `npm run e2e -- menu-lateral moldura-fixa` → 3 execuções dos 2 specs juntos: 1ª falhou 1 de 12, 2ª passou 12, 3ª falhou 1 de 12 (o mesmo teste); só o teste `gestão no desktop` isolado, 3 execuções → 3 passaram; `test:visual:docker -- -g "moldura-"` → 28 passaram. Capturas de `.capturas/624/` e referências `moldura-painel-grupo-1440-claro.png` conferidas à mão (painel ao lado do ícone, tokens do menu, subitens sem ícone). Não rodou: `mvnw` (sem mudança no back-end), `test:cov` e `e2e` inteiro (ficam para o CI), suíte visual inteira (já rodada pela construção, 34 min; a verificação conferiu só os casos `moldura-`).
Instáveis: nenhum confirmado como da base; o e2e acima é falha do item (ver achado).
Achados:
- obrigatório, código, `frontend/src/components/layout/GroupFlyout.tsx` (`const start = useRef(pathname)` e o efeito `if (pathname !== start.current) onClose()`) — esperado: abrir um painel logo depois de navegar por outro painel não fecha o novo painel; observado: `e2e/moldura-fixa.spec.ts:44` (`gestão no desktop…`) falha por timeout de 60 s em `dialog "Operação" a[href='/agenda'].click()` ("html intercepts pointer events", depois "element was detached"), com a página em `/pedidos` e nenhum painel aberto; falhou em 2 de 3 execuções juntas com `menu-lateral`, passou 3 de 3 sozinho. Causa provável: o painel novo monta enquanto o roteador ainda entrega o `pathname` antigo, guarda esse valor em `start` e, quando o `pathname` novo chega, o efeito o fecha; evidência: `error-context.md` do teste (URL já em `/pedidos`, menu sem painel); corrigir: comparar com o `pathname` do roteador no momento da abertura de forma que não dependa do instante da montagem (por exemplo, fechar no `onClick` dos links do painel e/ou passar o `pathname` de abertura pelo `Sidebar`, que já o conhece), e repetir o e2e dos dois specs juntos algumas vezes. O e2e é `@critical` e roda no CI.
- sugestão, código, `Sidebar.tsx` `nav` com `scrollbar-gutter: stable` — no recolhido (72 px) os ícones ficam ~5 px à esquerda do centro do logotipo (ver `moldura-painel-grupo-1440-claro.png`); aplicar o gutter só no menu aberto.
- sugestão, código, `visual/casos.ts` — `moldura-recolhido` e `moldura-painel-grupo` a 390 px mostram a tela sem menu (não há recolher no celular): referências de 390 sem valor; o plano pedia 1440 e 390 só onde o canvas existe.
- sugestão, código, `scrollbar.test.ts` — CA11 pede a cor da barra transparente sem hover e do token com hover por tema; o teste só lê o texto do CSS.
- sugestão, código, `GroupFlyout.tsx` — clique fora não devolve o foco ao ícone (desvio 4, já registrado pela construção; R4 diz "ao fechar sem navegar o foco volta ao ícone"). Aceitável se o dono concordar; registrar como decisão no PR.


### Correção da rodada 1
- obrigatório: painel fechava o painel novo ao chegar o `pathname` antigo/novo — arquivos: `GroupFlyout.tsx` (sem efeito de `pathname`; fecha no clique de qualquer link do painel, que é a navegação por ele; Esc e clique fora seguem) — prova: `npm test -- Sidebar GroupFlyout scrollbar a11y ManagementShell` → 55 passaram; `npm run e2e -- menu-lateral moldura-fixa` 3 execuções → 12 passaram nas 3
- sugestão atendida: `scrollbar-gutter: stable` só no menu aberto — arquivos: `Sidebar.tsx` (classe condicional no `nav`), `index.css` (regra do gutter removida) — prova: visual `-- --update-snapshots -g "moldura-(recolhido|painel-grupo) 1440"` (4 referências regeradas, só o menu recolhido) e `npm run test:visual:docker -- -g "moldura-"` → 28 passaram; `lint`, `typecheck` → ok
- não atendidas (opcionais): referências de 390 sem menu; teste da cor por tema; foco ao fechar por clique fora (desvio 4 já registrado, decisão para o PR)
Visual do CI: moldura-* (28 casos) → passou
Referências visuais: regeradas `moldura-recolhido-1440-{claro,escuro}` e `moldura-painel-grupo-1440-{claro,escuro}`.
Regressão local da correção: 12 min

### Rodada 2 — OK — 2026-11-25, estado 20de961cfcfe9483dd22ade9bd36ef4ebfb6d98e

| Critério | Status | Evidência |
|---|---|---|
| CA1, CA2, CA7, CA8, CA9, CA10, CA14 | PASSOU | mantido da rodada 1 (a correção não toca); `npm test` verde |
| CA3, CA4, CA5, CA6 | PASSOU | `GroupFlyout.test`, `Sidebar.test` e e2e `menu-lateral`/`moldura-fixa` (painel fecha no clique do link; Esc e clique fora seguem) |
| CA11 | PASSOU (parcial) | como na rodada 1: CSS conferido por texto e `scrollbar-width` medido no e2e; cor por tema não medida (sugestão) |
| CA12, CA13 | PASSOU | e2e `menu-lateral` |
| CA15 | PASSOU | `test:visual:docker -- -g "moldura-"` → 28 passaram, sem `--update-snapshots` |

Achado obrigatório da rodada 1 (painel novo fechado pelo `pathname` antigo): corrigido. `GroupFlyout.tsx` não depende mais de `useLocation`; o `onClick` do painel fecha ao clicar num link. `npm run e2e -- menu-lateral moldura-fixa` 3 execuções → 12 passaram nas 3 (antes falhava 2 de 3).
Comandos: `lint`, `typecheck`, `build` → ok; `npx vitest run --maxWorkers=3` → 277 arquivos, 3042 testes passaram; e2e acima; visual `moldura-` → 28 passaram. Não rodou: `mvnw` (sem back-end), `test:cov` e `e2e` inteiro (ficam para o CI), suíte visual inteira (rodada pela construção; esta rodada só os casos `moldura-`, e a correção só muda o menu recolhido, já regerado).
Instáveis: nenhum.
Achados:
- sugestão, código, `scrollbar.test.ts` — medir a cor da barra por tema em elemento real (CA11).
- sugestão, código, `visual/casos.ts` — referências de 390 px de `moldura-recolhido` e `moldura-painel-grupo` mostram tela sem menu.
- sugestão, código, `GroupFlyout.tsx` — clique fora não devolve o foco ao ícone; registrar a decisão no PR.

## Entrega

Muda o menu lateral da gestão (ícone só em Início e nos grupos, subitens só com texto, menu recolhido com um painel flutuante por grupo, um grupo aberto por vez) e a barra de rolagem de todo o sistema (barra fina nos tokens do tema, visível ao passar o mouse ou rolar). Tabs de Minha conta e a faixa de abas de ficha do aluno deixam de rolar na vertical.

Verificação: rodada 2 OK (estado `20de961cfcfe9483dd22ade9bd36ef4ebfb6d98e`). A rodada 1 achou que o painel novo fechava sozinho ao trocar de rota; corrigido (o painel fecha no clique de um link, sem efeito de `pathname`) e o e2e `menu-lateral` + `moldura-fixa` passou 3 de 3 execuções juntas. Testes de unidade, lint, typecheck e build verdes; visual `moldura-` 28 casos passaram sem `--update-snapshots`; suíte visual inteira rodada na construção, com 115 telas de gestão a 1440 px regeradas só na região do menu.

Decisões:
- Recolhido: `scrollbar-gutter: stable` só no menu aberto (no recolhido o gutter deslocava os ícones cerca de 5 px).
- Clique fora do painel não devolve o foco ao ícone do grupo (desvio 4 da construção, registrado aqui para o dono confirmar no PR). Esc devolve.
- Referências de 390 px de `moldura-recolhido` e `moldura-painel-grupo` mostram a tela sem menu, porque não há recolher no celular; o canvas também não mostra esse caso.

Limitações:
- CA11 conferido por texto do CSS e por `scrollbar-width` medido no e2e; a cor da barra por tema em elemento real não foi medida.
- Comparação com o canvas: `npm run visual:canvas` → 165 comparadas, 0 reprovadas (`.capturas/624/`).
- Não rodou localmente: `mvnw` (sem mudança no back-end), `test:cov` e `e2e` inteiro, que ficam para o CI.

Regressão local: 49 min; correção da rodada 1: 12 min.
