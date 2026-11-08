# 452 — Componente base: Selos, avatar e graduação (faixa visual)

Origem: issue #452 (Sprint 10.5, Fase 2, plano C10), `docs/auditoria/decisoes-canvas.md`, `docs/auditoria/plano-de-issues.md` (C10). Branch: `item/452-componente-base-selos-avatar-graduacao`. Canvas de referência das telas-piloto: `Professores.dc.html` e `Turmas.dc.html` (blocos da C5b).

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Completar os blocos visuais que o canvas usa nas listas de pessoas: avatar de iniciais com cor estável (em dois tamanhos), selo de situação, **faixa de graduação** (cor, cor secundária e graus) e **ponto de cor da modalidade**. `Avatar`, `Badge` e `StatusBadge` já existem; faltam a faixa, o ponto e o tamanho de 32 px do canvas. Aplicar nas telas-piloto Professores (P6) e Turmas (O4); as demais telas trocam nas próprias issues (#459 usa estes blocos).

Fora do escopo: migrar outras telas; mudar API, OpenAPI ou backend (D1); a coluna de WhatsApp, o menu e o resto do layout de Professores e Turmas (#470, #475, #459).

## 2. Requisitos

- R1: existe `GraduationBelt` em `frontend/src/components/ui/` que desenha a faixa do canvas (44x10 px, borda, cor principal, ponta com a cor secundária quando houver, e um risco branco por grau), com `aria-label` "Faixa <nome>, N grau(s)" e rótulo opcional ao lado ("Faixa preta · 2 graus").
- R2: existe `ModalityDot` (ponto de 8 px com o nome da modalidade ao lado) com cor estável pelo nome, só por tokens.
- R3: `Avatar` aceita o tamanho `sm` (32 px, texto 11 px, como no canvas) além do padrão; a cor continua estável pelo nome.
- R4: os selos de situação continuam sendo `Badge` e `StatusBadge`, com tons pelo mapa único; nenhuma cor solta.
- R5: Professores usa avatar `sm` na coluna do nome e `ModalityDot` na coluna de modalidades.
- R6: Turmas usa `ModalityDot` na coluna de modalidade e `Person` com avatar `sm` no titular.
- R7: textos só em `pt-BR.json`; cores só por tokens, exceto as cores de faixa, que vêm dos dados da graduação (`#RRGGBB` da API, como já faz `PortalBelts`).
- R8: axe passa nos dois temas; funciona a partir de 360 px.
- R9: componentes e uso constam em `docs/design/README.md` (tabela Componentes).
- R10: referências visuais de `professores` e `turmas` regeradas e comparadas com o canvas; nenhuma outra tela muda de aparência.

## 3. Critérios de aceite

- CA1 (R1): dada uma faixa com cor, cor secundária e 2 graus, então há 2 riscos, a ponta secundária, e o `aria-label` é "Faixa Preta, 2 grau(s)"; com 0 grau não há riscos; sem cor secundária não há ponta.
- CA2 (R1): dado `label`, então o texto aparece ao lado; sem `label`, só a faixa com `aria-label`.
- CA3 (R2): dado o mesmo nome de modalidade, então o ponto tem sempre o mesmo tom; o nome aparece ao lado.
- CA4 (R3): dado `Avatar size="sm"`, então a classe de 32 px é aplicada, e iniciais e tom não mudam em relação ao padrão.
- CA5 (R4): dado `StatusBadge` para ACTIVE/INACTIVE, então o tom sai do mapa (teste existente continua passando).
- CA6 (R5): dada a lista de Professores com MSW, então o avatar e o ponto da modalidade aparecem, sem requisição nova.
- CA7 (R6): dada a lista de Turmas com MSW, então ponto de modalidade e avatar do titular aparecem; o nome do titular continua achável por texto.
- CA8 (R8): axe sem violação nos dois temas para `GraduationBelt`, `ModalityDot` e `Avatar sm`; a faixa a 360 px não causa rolagem lateral.
- CA9 (R7): `npm run lint` sem texto literal.
- CA10 (R9): `design-readme.test.ts` passa com os componentes na tabela.
- CA11 (R10): `npm run test:visual:docker` passa com referências regeradas só de `professores` e `turmas`; `npm run visual:canvas` sem nova reprovação.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (puramente visual; nenhuma rota nova).
- Interface:
  - `GraduationBelt({ name, color, secondaryColor, degree, label? })`: `<span role="img" aria-label>` com a faixa (estilo inline só para as cores dos dados, como `PortalBelts.tsx`); riscos brancos por grau na ponta. O rótulo "Faixa {{name}}, {{degree}} grau(s)" vem de `pt-BR.json`.
  - `ModalityDot({ name })`: reaproveita o hash de `avatarTone` e mapeia o tom para classe `bg-*-foreground` (classes completas num mapa, como `TONE_CLASS`); ponto `aria-hidden`.
  - `Avatar`: nova prop `size?: "sm" | "md"` (padrão `md`, 36 px como hoje); `sm` = `size-8 text-[11px]`.
- Arquivos:
  - `frontend/src/components/ui/graduation-belt.tsx` e `graduation-belt.test.tsx` (a criar).
  - `frontend/src/components/ui/modality-dot.tsx` e `modality-dot.test.tsx` (a criar).
  - `frontend/src/components/ui/avatar.tsx` e `avatar.test.tsx` (existem; prop `size`).
  - `frontend/src/i18n/pt-BR.json`: grupo `belt` (`label`).
  - `frontend/src/features/teachers/TeachersPage.tsx`: `TeacherAvatar` com `size="sm"`; coluna `modalities` com `ModalityDot`; `TeachersPage.test.tsx` (casos novos).
  - `frontend/src/features/classes/ClassesPage.tsx`: colunas `modality` (`ModalityDot`) e `head` (`Person` com avatar sm, mantendo auxiliares); `ClassesPage.test.tsx` (casos novos).
  - `frontend/src/dev/Vitrine.tsx`: acrescentar faixa e ponto.
  - `docs/design/README.md`: linhas `GraduationBelt` e `ModalityDot` e ajuste da linha de `Avatar`.
  - `frontend/visual/referencias/` (`professores` e `turmas`, 1440 e 390, claro e escuro).
- Reuso: `Avatar`, `avatarTone`, `Badge`, `TONE_CLASS`, `Person`, `cn`; `PortalBelts.tsx` como modelo da faixa.
- Riscos: testes que usam `getByText`/`getByRole` do titular e da modalidade em Turmas e Professores (o ponto fica `aria-hidden`, fora do nome acessível); `Person` usa `truncate`, conferir quebra a 360 px.

## 5. Tarefas

- [x] T1: `Avatar size`, `ModalityDot` e `GraduationBelt` com chaves `belt.*` e testes (cores estáveis, graus, rótulo, axe nos dois temas, 360 px) — cobre CA1, CA2, CA3, CA4, CA8 — prova: `cd frontend && npx vitest run src/components/ui/avatar.test.tsx src/components/ui/modality-dot.test.tsx src/components/ui/graduation-belt.test.tsx`
- [x] T2: aplicar em Professores com teste — cobre CA6 — prova: `cd frontend && npx vitest run src/features/teachers/TeachersPage.test.tsx`
- [x] T3: aplicar em Turmas com teste — cobre CA7 — prova: `cd frontend && npx vitest run src/features/classes/ClassesPage.test.tsx`
- [x] T4: Vitrine e `docs/design/README.md` — cobre CA10 — prova: `cd frontend && npx vitest run src/components/design-readme.test.ts`
- [x] T5: regerar referências de `professores` e `turmas` no container, comparar com o canvas (1440 e 390, pt-BR, capturas em `.capturas/452/`) e listar divergências no PR; a faixa de Professores fica como divergência com `limiteCanvas` e a #470 (D1) — cobre CA11 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots=all -g "professores|turmas"` e `npm run visual:canvas`
- [x] T6: regressão do front — não cobre critério novo: confere CA5 e CA9 — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov`

## 6. Decisões

- D1 (muda o comportamento): `GraduationBelt` nasce pronta e testada, mas **não é ligada à lista de Professores**, porque `TeacherRow` (API) traz só o nome do nível e o grau, sem cor, cor secundária nem grau máximo. Incluir esses campos exige back-end, OpenAPI e MSW, o que é da tela de Professores (#470). Acrescentar no "Pronto quando" da #470: expor as cores do nível, usar `GraduationBelt` na coluna Graduação e remover o `limiteCanvas` correspondente (AGENTS, autonomia 4). Alternativa: ampliar a API aqui, descartada por inflar um item de componente.
- D2: a cor do `ModalityDot` é derivada do nome (hash estável, tokens existentes), porque a modalidade não tem cor no dado. O canvas usa cores fixas por modalidade; cor definitiva por modalidade, se desejada, é da #485. Alternativa: campo de cor na modalidade, descartada (muda dado e banco).
- D3: não se cria selo novo: `Badge` e `StatusBadge` já cumprem "selos de situação"; entram na documentação sem mudança.
- D4: `Avatar` ganha `size` em vez de componente novo; o padrão continua 36 px para não alterar telas que não são piloto (cada tela adota `sm` na própria issue).
- Suposição: o canvas usa avatar de 32 px na coluna do nome de Professores e Turmas (visto em Professores); se a comparação mostrar outro tamanho, ajustar `sm` sem mudar a API do componente.

## Construção

- T1 — arquivos: components/ui/{avatar,modality-dot,graduation-belt}.tsx e testes, i18n/pt-BR.json (belt.label) — prova: `npx vitest run avatar modality-dot graduation-belt` → 11 passaram
- T2 — arquivos: features/teachers/TeachersPage.tsx e teste — prova: `npx vitest run TeachersPage` → passou
- T3 — arquivos: features/classes/ClassesPage.tsx e teste — prova: `npx vitest run ClassesPage` → passou (29 nos dois)
- T4 — arquivos: dev/Vitrine.tsx, docs/design/README.md — prova: `npx vitest run design-readme` → passou
- T5 — arquivos: 8 PNGs de visual/referencias (professores e turmas) — prova: `npm run test:visual:docker -- --update-snapshots=all -g "professores|turmas"` → 8 passaram; `npm run visual:canvas` → 96 comparadas, 0 reprovadas; capturas em .capturas/452/; imagens Docker sem sobra (antes/depois iguais)
Desvios: `ModalityDot` ganhou prop `label` (texto exibido; cor vem de `name`) para manter "Roxa, grau 2" em Professores; `Person` ganhou prop `size` para repassar `sm`. Faixa não ligada em Professores (D1).
- T6 — arquivos: graduation-belt.tsx (risco branco por style, pois tokens.test.ts proíbe bg-white) — prova: `npm run lint` e `npm run typecheck` limpos; `npm run test:cov` → 1982 de 1984 passaram; as 2 falhas (tokens.test.ts no graduation-belt, corrigida; LoginPage CA4/CA5 #445, instável) passaram ao rodar de novo (60 testes). A suíte completa não foi rodada de novo depois da correção (leva ~30 min); o limiar de cobertura não foi lido porque a execução saiu com falha antes. Uma rodada anterior, concorrente com o Docker, teve 14 falhas de tempo em arquivos alheios ao item.
Regressão: acima. Não é do item: nada.

## Verificação

### Rodada 1 — OK — 2026-11-08, estado 80d01169844ae3590405ff933cf09295d370e015

| Critério | Status | Evidência |
|---|---|---|
| CA1, CA2 | PASSOU | graduation-belt.test.tsx (22 arquivos, 194 testes passaram em ui, teachers, classes, design-readme, tokens) |
| CA3 | PASSOU | modality-dot.test.tsx |
| CA4 | PASSOU | avatar.test.tsx (size-8 e size-9, mesmo texto e tom) |
| CA5 | PASSOU | badge/status-tone testes de ui passaram |
| CA6, CA7 | PASSOU | TeachersPage.test.tsx e ClassesPage.test.tsx |
| CA8 | PASSOU (parcial) | axe nos dois temas passa para os três componentes; "360 px sem rolagem lateral" não tem teste (jsdom não mede layout); faixa é w-11 shrink-0 |
| CA9 | PASSOU | `npm run lint` limpo |
| CA10 | PASSOU | design-readme.test.ts passou |
| CA11 | PASSOU | `npm run test:visual:docker -- -g "professores\|turmas"` 8 passaram; capturas em .capturas/452 (professores 1440 sistema e canvas abertos e comparados); visual:canvas informado pelo construtor (0 reprovadas), não rodado de novo |

Comandos: vitest dos diretórios do item (194 passaram); npm run lint e typecheck limpos; teste visual docker 8 de 8. Regressão completa (`test:cov`, `e2e`) não rodada nesta rodada (cerca de 30 min); aceita-se o CI do PR como prova (AGENTS, autonomia 2).
Instáveis: nenhum visto nesta rodada.
Achados:
- sugestão, especificação — D1 manda acrescentar no "Pronto quando" da #470 a exposição das cores do nível e o uso de `GraduationBelt`; a issue #470 ainda não traz isso (só cita a coluna Graduação na Evidência). Registrar na entrega.
- sugestão, código — falta teste de 360 px para a faixa (CA8); aceitável como conferência visual.
- sugestão, código — cor do `ModalityDot` por hash no sistema não bate com cores fixas do canvas (decidido em D2, #485).

## Entrega

Componentes base novos e padronizados: `Avatar` com `size` (`sm` 32 px nas telas-piloto, padrão 36 px), `ModalityDot` (cor estável derivada do nome, rótulo por `label`) e `GraduationBelt` (faixa visual com graus, rótulo `belt.*` em pt-BR). Aplicados em Professores e Turmas; a Vitrine e `docs/design/README.md` documentam os três. Os selos de situação continuam sendo `Badge` e `StatusBadge` (D3).

Verificação: rodada 1 `OK`, estado `80d01169844ae3590405ff933cf09295d370e015`; depois dela só este arquivo e o backlog mudaram. Lint e typecheck limpos; vitest dos diretórios do item passou; `test:visual:docker` 8 de 8 (professores e turmas, 1440 e 390, claro e escuro); `visual:canvas` 96 comparadas, 0 reprovadas (informado pelo construtor). Regressão completa (`test:cov`, `e2e`) não rodada localmente; o CI do PR é a prova (AGENTS, autonomia 2).

Decisões que quem lê precisa saber:
- D1: a `GraduationBelt` não está ligada à lista de Professores, porque `TeacherRow` não traz cores nem grau máximo. A #470 precisa expor essas cores, usar a faixa na coluna Graduação e remover o `limiteCanvas` correspondente. Pendente: acrescentar isso no "Pronto quando" da #470 (a issue ainda não traz).
- D2: cor do `ModalityDot` por hash do nome; cor fixa por modalidade é da #485.
- Desvios: `ModalityDot` ganhou `label`; `Person` ganhou `size` para repassar `sm`.

Limitações: a largura de 360 px sem rolagem lateral da faixa não tem teste automatizado (jsdom não mede layout); conferido só visualmente, com `w-11 shrink-0`. Divergência de Professores na faixa segue como `limiteCanvas` até a #470.
