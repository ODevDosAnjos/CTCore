# 456 — Componente base: Busca e filtro em pílula

Origem: issue #456 (Sprint 10.5, Fase 2, plano C3a), `docs/auditoria/decisoes-canvas.md`, `docs/auditoria/plano-de-issues.md` (C3a). Branch: `item/456-busca-filtro-pilula`. Canvas das telas-piloto: `Alunos.dc.html` (P1) e `Professores.dc.html` (P6).

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Criar os dois componentes de consulta do canvas: **busca** (caixa de 40 px com lupa à esquerda e texto de ajuda) e **filtro em pílula** (botão de 36 px "Rótulo **Valor** ⌄" que abre um popover com as opções), no lugar do seletor nativo com rótulo acima. Aplicar nas telas-piloto Alunos e Professores. As demais telas (Cobranças, Turmas, Benefícios etc.) trocam nas próprias issues (#470 a #496).

Fora do escopo: abas em pílula com contagem, paginação e folha de filtros do celular (#457); migrar outras telas; mudar API, OpenAPI ou backend; os filtros rápidos Ativos/Ex-alunos/Em atraso de Alunos (já existem; #457/#465); filtros que o canvas mostra e o sistema não tem dado (ex.: "Financeiro" em Alunos, "Situação financeira") — a tela de Alunos fica com os filtros que já existem (#465 trata o restante).

## 2. Requisitos

- R1: existe `SearchBox` em `frontend/src/components/ui/` com lupa à esquerda, `placeholder` (texto de ajuda) e `aria-label`, `type="search"`, 40 px de altura, borda e fundo por tokens.
- R2: existe `PillFilter` com botão em pílula "Rótulo Valor ⌄" (rótulo em `muted`, valor em peso 500, 36 px de altura) que abre um popover com a lista de opções, a opção "todas" primeiro; escolher uma opção chama `onChange(id)` e fecha o popover (D1).
- R3: o popover do `PillFilter` fecha com Esc (foco volta ao botão) e com clique fora; o botão tem `aria-haspopup="listbox"` e `aria-expanded`; as opções são `role="option"` com `aria-selected`; setas e Enter funcionam por teclado; alvo de toque de pelo menos 44 px (área clicável, mesmo que o visual seja 36 px).
- R4: `PillFilter` aceita `disabled` (ex.: Nível sem modalidade) e mostra o valor escolhido (nome da opção) ou o texto "todas"; filtro ativo ganha destaque por token (borda e fundo `primary` suave).
- R5: `QueryPage` ganha a prop opcional `searchPlaceholder`; com ela a busca usa `SearchBox`, sem ela fica o `<input>` de hoje, para nenhuma outra tela mudar de aparência (D2).
- R6: Alunos (`StudentFilters`) e Professores (`TeacherFilters`) usam `PillFilter` em todos os filtros e `SearchBox` com os textos "Nome, CPF, e-mail ou telefone" e "Nome" (os do canvas); parâmetros de endereço, chamadas à API e regras (Nível desabilitado sem modalidade, trocar a modalidade limpa o nível) não mudam.
- R7: textos só em `pt-BR.json`; cores, fontes e tamanhos só por tokens (nada de cor solta fora do componente base).
- R8: axe passa nos dois temas para `SearchBox` e `PillFilter` (fechado e aberto); a 360 px as pílulas quebram de linha sem rolagem lateral e o popover não sai da tela.
- R9: componentes e uso constam em `docs/design/README.md` (tabela Componentes) e na Vitrine.
- R10: referências visuais de `alunos` e `professores` (1440 e 390, claro e escuro) regeradas e comparadas com o canvas; nenhuma outra tela muda de aparência.

## 3. Critérios de aceite

- CA1 (R1): dado `SearchBox` com `placeholder="Nome"` e valor "ana", quando digito, então `onChange` recebe o texto; a lupa é decorativa (`aria-hidden`) e o campo é achado por `getByRole("searchbox", { name })`.
- CA2 (R2): dado `PillFilter` com rótulo "Modalidade" e valor vazio, então o botão mostra "Modalidade Todas"; ao escolher "Jiu-Jitsu" o `onChange` recebe o id e o botão passa a mostrar "Modalidade Jiu-Jitsu".
- CA3 (R2): dado o popover aberto, então a primeira opção é "todas" com `aria-selected` quando não há valor.
- CA4 (R3): dado o popover aberto, quando aperto Esc, então fecha e o foco volta ao botão; clique fora também fecha; setas movem a opção e Enter escolhe.
- CA5 (R4): dado `disabled`, quando clico, então o popover não abre; dado valor escolhido, então o botão tem o estilo de ativo.
- CA6 (R5): dado `QueryPage` sem `searchPlaceholder`, então a busca é o `<input type="search">` atual (testes atuais de `QueryPage` passam sem mudança); com `searchPlaceholder`, aparece o `SearchBox` e a busca continua gravando `q` no endereço.
- CA7 (R6): dada a página Alunos com MSW, quando escolho Unidade, Faixa etária, Selo, Modalidade, Turma e Nível pelas pílulas, então os parâmetros do endereço e as chamadas são os de hoje; Nível fica desabilitado sem modalidade e trocar a modalidade limpa o nível.
- CA8 (R6): dada a página Professores com MSW, quando escolho Modalidade, Unidade e Situação, então endereço e chamadas são os de hoje; a busca tem o texto "Nome".
- CA9 (R7): `npm run lint` sem texto literal; `tokens.test.ts` passa.
- CA10 (R8): axe sem violação nos dois temas para `SearchBox`, `PillFilter` fechado e aberto; a 360 px a Vitrine não tem rolagem lateral.
- CA11 (R9): `design-readme.test.ts` passa com os dois componentes na tabela.
- CA12 (R10): `npm run test:visual:docker` passa com referências regeradas só de `alunos` e `professores` (e `vitrine`); `npm run visual:canvas` não piora `alunos` e `professores`; divergência restante vira `limiteCanvas` com motivo e a issue que a remove.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (puramente visual; nenhuma rota nova, nenhum dado novo).
- Interface:
  - `SearchBox({ value, onChange, placeholder, "aria-label"?, className })`: `<span relative>` com `Search` (lucide, `aria-hidden`, `absolute left-3`) e `<input type="search" className="h-10 w-full pl-9 …">`; mesmo estilo de `Input` do `field.tsx`.
  - `PillFilter({ label, value, onChange, allLabel, options, disabled })`: usa `usePopover` (existe, `components/layout/usePopover.ts`, Esc e clique fora); botão com `ChevronDown`; lista `role="listbox"` com `role="option"`; setas por `onKeyDown` na lista; popover `absolute left-0 top-full z-40 … shadow-menu`, `max-h-64 overflow-auto`, `max-w-[calc(100vw-2rem)]`. Visual de 36 px com área de toque de 44 px por pseudo-elemento, como no `QuickFilters`.
  - `QueryPage`: nova prop `searchPlaceholder?: string`; o `<form role="search">` troca `items-end` por `items-center` só nesse modo (os filtros em pílula não têm rótulo acima).
- Arquivos:
  - `frontend/src/components/ui/search-box.tsx`, `pill-filter.tsx` e os `*.test.tsx` de cada um (a criar).
  - `frontend/src/components/layout/usePopover.ts` (existe; só reutilizado, sem mudança).
  - `frontend/src/components/query/QueryPage.tsx` (existe; prop `searchPlaceholder`, linhas ~134-143) e `QueryPage.test.tsx` (caso novo).
  - `frontend/src/features/students/StudentFilters.tsx` (existe; função `Filter` vira `PillFilter`) e `StudentsPage.tsx` (existe; passa `searchPlaceholder`, ~linha 112); `StudentsPage.test.tsx` (linhas 106-183 usam `getByRole("combobox")` + `selectOptions`: trocar por clicar na pílula e escolher a opção).
  - `frontend/src/features/teachers/TeacherFilters.tsx` e `TeachersPage.tsx` (existem; idem) e `TeachersPage.test.tsx` (linhas 120-126 usam `getByLabelText` + `selectOptions`).
  - `frontend/src/i18n/pt-BR.json`: `students.search`/`teachers.search` (placeholders), `query.filterAll` se preciso; as chaves `*.filters.all*` existentes servem de `allLabel` (o canvas mostra só "Todas"/"Todos": ver D3).
  - `frontend/src/dev/Vitrine.tsx` e `docs/design/README.md` (linhas `SearchBox`, `PillFilter`).
  - `frontend/visual/casos.ts`: casos `alunos` e `professores` já existem; sem caso novo (passo para abrir um popover só se necessário para a comparação).
  - `frontend/visual/referencias/`: `alunos`, `professores`, `vitrine`, 1440 e 390, claro e escuro.
- Reuso: `usePopover`, `cn`, tokens (`border-input`, `bg-card`, `shadow-menu`, `bg-popover`), `QuickFilters` como modelo do alvo de toque, `Select`/`Field` (não mudam).
- Riscos: testes de Alunos e Professores que dependem de `combobox`/`selectOptions` (reescrever com cuidado, sem perder cobertura); `QueryPage` é usado por 11 telas (por isso a prop é opt-in e as demais não mudam); popover cortado por `overflow-hidden` de pais, visto na captura a 390 px; pílula de rótulo longo ("Faixa etária Todas") em 360 px (quebra de linha com `flex-wrap`, `min-w-0`); a lista de Turma pode ser longa (`max-h` com rolagem); o teste visual do canvas tem filtros que o sistema não tem (Financeiro etc.), tratar como `limiteCanvas` se passar do limite.

## 5. Tarefas

- [x] T1: `SearchBox` e `PillFilter` com chaves em `pt-BR.json` e testes (digitar, escolher, Esc, clique fora, teclado, disabled, ativo, axe nos dois temas, aberto e fechado) — cobre CA1, CA2, CA3, CA4, CA5, CA10, CA9 — prova: `cd frontend && npx vitest run src/components/ui/search-box.test.tsx src/components/ui/pill-filter.test.tsx`
- [x] T2: `QueryPage` com `searchPlaceholder` opt-in e teste novo — cobre CA6 — prova: `cd frontend && npx vitest run src/components/query`
- [x] T3: aplicar em Alunos (`StudentFilters`, `StudentsPage`) e ajustar `StudentsPage.test.tsx` — cobre CA7 — prova: `cd frontend && npx vitest run src/features/students/StudentsPage.test.tsx`
- [x] T4: aplicar em Professores (`TeacherFilters`, `TeachersPage`) e ajustar `TeachersPage.test.tsx` — cobre CA8 — prova: `cd frontend && npx vitest run src/features/teachers`
- [x] T5: Vitrine e `docs/design/README.md` — cobre CA11 — prova: `cd frontend && npx vitest run src/components/design-readme.test.ts src/components/tokens.test.ts`
- [x] T6: regerar referências no container, comparar com o canvas (1440 e 390, pt-BR, capturas em `.capturas/456/`) e listar divergências no PR — cobre CA12 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots=all -g "alunos|professores|vitrine"` e `npm run visual:canvas`
- [x] T7: regressão do front — não cobre critério novo: confere CA6 a CA9 em conjunto e que nenhuma outra tela quebrou — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov`

## 6. Decisões

- D1: o popover do `PillFilter` é **uma lista de uma escolha** (como o canvas: "Modalidade Todas ⌄"), feita com o `usePopover` que o projeto já tem; sem biblioteca nova (nem `@radix-ui/react-popover`). Motivo: o padrão de menu suspenso já existe (`UserMenu`, `UnitMenu`), a lista é simples e o pacote não está instalado. Alternativa: Radix Popover, descartada (dependência nova sem necessidade); `<select>` nativo estilizado, descartado (a issue manda popover e o nativo não segue o canvas).
- D2 (muda o visual só das pilotos): `QueryPage` troca a busca apenas quando a tela passa `searchPlaceholder`; as outras 9 telas mantêm a caixa atual até as próprias issues. Motivo: "Nenhuma outra tela mudou de aparência sem a sua própria issue". Alternativa: trocar a busca em todas, descartada (quebra o critério de pronto).
- D3: o texto "todas" da pílula vem das chaves `*.filters.all*` já existentes ("Todas as modalidades"); o canvas mostra "Todas". Se a captura mostrar diferença, cria-se a chave curta `query.filterAll.*`/ajusta-se o texto sem mudar a API do componente. Suposição: não muda regra nem dado.
- D4: a ordem e o conjunto de filtros de Alunos e Professores ficam os que existem hoje (Alunos tem Unidade, Faixa etária, Selo, Modalidade, Turma, Nível; o canvas mostra Modalidade, Turma, Nível, Faixa etária, Financeiro, ...). Reordenar para a ordem do canvas é dentro do item (só visual); acrescentar "Financeiro" ou remover "Unidade"/"Selo" é da #465. Alternativa: mudar o conjunto agora, descartada (escopo de tela e pode mexer em regra).
- D5: o ícone de lupa e a seta usam `lucide-react`, já instalado e usado nas molduras.
- Suposição: o canvas só mostra a pílula fechada (o conteúdo do popover não está desenhado em `Alunos`/`Professores`); o popover segue os tokens de menu do projeto (`bg-popover`, `shadow-menu`). Se o dono quiser outro desenho do popover, ajusta-se no componente sem mudar a API.

## Construção

- T1 — arquivos: `frontend/src/components/ui/{search-box,pill-filter}.tsx` e `*.test.tsx` — prova: `npx vitest run src/components/ui/search-box.test.tsx src/components/ui/pill-filter.test.tsx` → 5 passam (axe aberto e fechado). Textos do `PillFilter` vêm por props; chaves novas `query.allF`/`query.allM` ("Todas"/"Todos"), `students.search`, `teachers.search`.
- T2 — `QueryPage.tsx` (prop `searchPlaceholder`, `SearchBox` com `w-full sm:w-80`) e `QueryPage.test.tsx` (CA6) — prova: `npx vitest run src/components` → passa.
- T3 — `StudentFilters.tsx`, `StudentsPage.tsx`, `StudentsPage.test.tsx`; novo helper `frontend/src/test/pill.ts` (`pickPill`, `expectPillOptions`) — prova: `npx vitest run src/features/students` → passa.
- T4 — `TeacherFilters.tsx`, `TeachersPage.tsx`, `TeachersPage.test.tsx` — prova: `npx vitest run src/features/teachers` → passa (17 arquivos de students+teachers, 212 testes).
- T5 — `Vitrine.tsx`, `docs/design/README.md` — prova: `npx vitest run src/components/design-readme.test.ts src/components/tokens.test.ts src/dev src/test` → 65 passam.
- T6 — `npm run test:visual:docker -- --update-snapshots=all -g "alunos|professores|vitrine"` → referências regeradas (vitrine precisou de nova rodada por timeout de 30 s na primeira); rodada sem atualizar → 12 passam; `npm run visual:canvas` → 97 comparadas, 0 reprovadas. Capturas em `.capturas/456/`.
- T7 — `npm run lint` ok; `npm run typecheck` ok; `npm run test:cov` → 214 arquivos, 2041 testes passam (na primeira rodada `LoginPage.test.tsx` "CA4 e CA5" falhou sob carga e passa isolado e na repetição: instável, não é do item).
Regressão: só o front foi tocado; back-end não mudou, não rodado.
Desvios: D3 aplicado com chaves curtas `query.allF`/`query.allM` já na construção (o canvas mostra "Todas"/"Todos"); as chaves `*.filters.all*` de students/teachers ficaram sem uso. O `SearchBox` na `QueryPage` tem largura `sm:w-80` (canvas: caixa de ~300 px na mesma linha das pílulas). `aria-label` da busca continua "Buscar" (placeholder é o texto do canvas) para manter os testes.
Divergências com o canvas (alunos): o canvas tem "Financeiro", "Selos" e botão "Colunas" na barra e abas em pílula com contagem; ficam para #457/#465 (D4). Não precisou `limiteCanvas` novo (`visual:canvas` 0 reprovadas).
Referências visuais: `frontend/visual/referencias/{alunos,professores,vitrine}-{1440,390}-{claro,escuro}.png`
Não é do item: nenhum.

## Verificação

### Rodada 1 — OK — 2026-11-09, estado 696f1a3a334d5738e8a31198613a46bea83195ca

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA5 | PASSOU | `search-box.test.tsx` e `pill-filter.test.tsx` dentro de `vitest run src/components ...`: 64 arquivos, 512 testes passam |
| CA6 | PASSOU | `QueryPage.test.tsx` (caso novo; os antigos intactos) passa |
| CA7, CA8 | PASSOU | `vitest run src/features/students src/features/teachers`: 17 arquivos, 212 testes passam |
| CA9 | PASSOU | `npm run lint` e `npm run typecheck` sem erro; `tokens.test.ts` passa |
| CA10 | PASSOU | axe aberto/fechado nos testes; 360 px sem teste dedicado, coberto pela referência visual `vitrine-390` (nenhuma rolagem lateral vista nas capturas) |
| CA11 | PASSOU | `design-readme.test.ts` passa; linha na tabela Componentes |
| CA12 | NÃO CONFERIDO (limitação aceita, AGENTS.md "Autonomia" 2/3) | Docker visual não rodado aqui; capturas em `.capturas/456/` abertas e conferidas (pílulas, busca 40 px, Nível desabilitado, sem rolagem lateral a 390). Registrado pela construção: visual 12 passam, `visual:canvas` 0 reprovadas; o CI do PR é a prova |

Comandos: `npx vitest run src/components src/features/students src/features/teachers src/dev src/test` (512 passam); `npm run lint`; `npm run typecheck`. `test:cov` completo não repetido (construção: 2041 passam).
Achados:
- sugestão, código, `StudentFilters.tsx` e `TeacherFilters.tsx` — sobrou linha em branco dupla onde a função `Filter` foi removida.
- sugestão, código, `pt-BR.json` — chaves `students.filters.all*` e `teachers.filters.all*` ficaram sem uso (já anotado nos Desvios).
- sugestão, código, `pill-filter.tsx` — a 360 px sem teste automatizado de rolagem lateral (CA10 só pela captura).

## Entrega

Componentes base `SearchBox` (busca com ícone e largura padrão) e `PillFilter` (filtro em pílulas com contagem opcional e estado desabilitado), usados em `QueryPage`, na lista de alunos e na de professores. Os textos do `PillFilter` vêm por props; as chaves novas são `query.allF`/`query.allM`, `students.search` e `teachers.search`. Telas de alunos e professores e a vitrine atualizadas; referências visuais regeradas em `frontend/visual/referencias/` (alunos, professores e vitrine, 1440 e 390, claro e escuro).

Verificação: rodada 1 OK (estado `696f1a3a334d5738e8a31198613a46bea83195ca`). CA1 a CA11 passaram com os testes de componente, de tela e de tokens; lint e typecheck sem erro. Comparação com o canvas: `npm run visual:canvas` com 97 comparadas e 0 reprovadas; capturas em `.capturas/456/`.

Decisões: `query.allF`/`query.allM` usados já na construção (o canvas mostra "Todas"/"Todos"); as chaves `students.filters.all*` e `teachers.filters.all*` ficaram sem uso e saem numa limpeza futura. `aria-label` da busca segue "Buscar" (o placeholder é o texto do canvas) para manter os testes. Nenhuma `limiteCanvas` nova.

Limitações: CA12 (`test:visual:docker`) não rodou localmente; é `NAO_CONFERIDO` por falta de ambiente, conforme Autonomia 2, e o CI do PR é a prova. Divergências do canvas em alunos (botão "Colunas", "Financeiro", "Selos" e abas em pílula com contagem) ficam para #457 e #465. Regressão: só o front foi tocado; `test:cov` da construção passou com 2041 testes. Instável registrado: `LoginPage.test.tsx` ("CA4 e CA5") falhou uma vez sob carga e passou isolado e na repetição; não é deste item. Sugestões de código da verificação: linha em branco dupla em `StudentFilters.tsx` e `TeacherFilters.tsx`, chaves sem uso em `pt-BR.json`, e falta de teste automatizado de rolagem lateral a 360 px (CA10 só pela captura).
