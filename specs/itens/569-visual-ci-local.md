# 569 — Técnica: construir e verificar rodam o teste visual do CI contra as referências commitadas antes do push

Origem: issue #569 (etiqueta `técnica`, Sprint 10.5; origem PR #565 / item #475). Branch: `item/569-visual-ci-local`.

## 1. Objetivo

Hoje `construir` e `verificar` só rodam `npm run visual:canvas -- --exige`, que compara o sistema com o canvas e não com `frontend/visual/referencias`. Referência desatualizada só aparece no job `visual` do CI (caso da #475: 14 referências). O item faz as duas fases rodarem, antes do push, o mesmo comando do job `visual` e registrarem o resultado por caso. Só regra e processo (`AGENTS.md` e duas skills), sem código do produto.

Fora do escopo: alterar o `ci.yml`, `visual-docker.sh` ou os casos; remover a regra temporária da #568; regerar referências de qualquer tela.

## 2. Requisitos

- R1: o `AGENTS.md` (seção Comandos e regra de canvas) manda rodar, de dentro de `frontend/`, `npm run test:visual:docker` sem `--update-snapshots` (mesmo teste do job `visual` do `ci.yml`, `npm run test:visual` no container) antes do push, e registrar o resultado por caso no arquivo do item.
- R2: a skill `construir` exige esse comando ao fechar a tarefa de teste visual e antes de terminar, e o registro por caso em "Construção".
- R3: a skill `verificar` roda o mesmo comando em item que toca tela, registra o resultado por caso em "Verificação", e reprova (achado de código) se alguma referência commitada divergir.
- R4: escopo mínimo: os casos da tela do item (`-- -g "<caso>"`); a regressão completa dos casos continua no CI (D1).
- R5: referência que muda só se regera com `-- --update-snapshots -g "<caso>"`, e só para a tela do item; o texto das três fontes diz isso (D2).

## 3. Critérios de aceite

- CA1 (R1, R4, R5): dado o `AGENTS.md`, quando se lê a seção Comandos e a regra "Canvas e decisões do dono", então ambas citam `npm run test:visual:docker` sem `--update-snapshots` antes do push, o filtro `-g "<caso>"`, o registro por caso e a regra de regerar só a tela do item.
- CA2 (R2, R4, R5): dado `~/.claude/skills/construir/SKILL.md`, então o passo "Referências visuais" exige o comando antes de terminar e a linha de registro por caso.
- CA3 (R3, R4): dado `~/.claude/skills/verificar/SKILL.md`, então o passo 2 manda rodar o comando para item de tela, registrar por caso e tratar divergência como achado de código.
- CA4 (R1 a R3): dado um item de tela cuja referência commitada ficou desatualizada, quando se roda `cd frontend && npm run test:visual:docker -- -g "<caso>"`, então o comando sai diferente de 0 e nomeia o caso (prova de que a exigência pega o erro da #475).
- CA5 (R1 a R3): dado o mesmo comando em tela com referência em dia, então sai 0 e o caso aparece como passou.

## 4. Plano técnico

- Dados, API, interface, segurança: não mudam.
- Arquivos (vistos): `AGENTS.md` (linha da regra "Canvas e decisões do dono", que cita `test:visual:docker` para gerar referências, e a linha de Comandos do front-end `Front-end (de dentro de frontend/...)`); `C:\Users\natha\.claude\skills\construir\SKILL.md` (passo 4, parágrafo "Referências visuais"); `C:\Users\natha\.claude\skills\verificar\SKILL.md` (passo 2). As skills ficam fora do repositório: a alteração não entra no commit; o PR traz só o `AGENTS.md` e este arquivo, e a descrição do PR cita o texto aplicado nas skills.
- Comando de referência (visto em `frontend/package.json` e `frontend/scripts/visual-docker.sh`): `npm run test:visual:docker` roda `playwright test -c playwright.visual.config.ts` na imagem do CI; argumentos após `--` vão ao Playwright, então `-- -g "<caso>"` filtra. O script remove a imagem se ela foi baixada só para a prova.
- Reuso: o script e o `-g` existentes; nada novo no código.
- Riscos: Docker indisponível na máquina da fase vira `NAO_CONFERIDO`; vale o CI como prova (Autonomia 2 do `AGENTS.md`). O nome do caso em `-g` precisa bater com `visual/casos.ts`; o texto manda usar o nome do caso.

## 5. Tarefas

- [x] T1: editar o `AGENTS.md` (Comandos e regra de canvas) com o comando, o escopo mínimo, o registro por caso e a regra de regerar — cobre CA1 — prova: `grep -n "test:visual:docker" AGENTS.md` mostra as linhas novas e leitura do trecho.
- [x] T2: editar a skill `construir` (passo 4, "Referências visuais") — cobre CA2 — prova: `grep -n "test:visual:docker" ~/.claude/skills/construir/SKILL.md`.
- [x] T3: editar a skill `verificar` (passo 2) — cobre CA3 — prova: `grep -n "test:visual:docker" ~/.claude/skills/verificar/SKILL.md`.
- [x] T4: provar o comando contra uma referência desatualizada e uma em dia, sem deixar alteração no repositório — cobre CA4, CA5 — prova: `cd frontend && npm run test:visual:docker -- -g "<caso de tela com referência em dia>"` sai 0; alterar temporariamente a referência (cópia fora do repositório, restaurada com `git checkout -- frontend/visual/referencias`) e repetir sai 1 com o caso nomeado.

## 6. Decisões

- D1: o escopo é o filtro `-g` dos casos da tela do item, não a suíte visual inteira. Motivo: a issue pede "no mínimo os casos da tela" e a regressão completa já é do CI. Alternativa: rodar todos os casos (mais lento, sem ganho para o erro da #475).
- D2: a exigência vale para itens que mudam ou criam tela; item sem tela dispensa. Motivo: sem tela não há caso a conferir. Alternativa: exigir sempre (custo sem benefício).
- D3: sem Docker na máquina, o resultado fica `NAO_CONFERIDO` e o CI do PR serve de prova (Autonomia 2). Alternativa: bloquear o item (contraria a Autonomia 2).
- Suposição: as skills `construir` e `verificar` em `~/.claude/skills` são as usadas pelo agente; a cópia em `anthropic-skills:*` (se for outra) não é tocada. Se for outra fonte, o dono sincroniza.

## Construção

- T1 — arquivos: `AGENTS.md` (regra "Canvas e decisões do dono" e linha de Comandos do front-end) — prova: `grep -n "test:visual:docker" AGENTS.md` → 2 linhas com o comando sem `--update-snapshots`, `-g "<caso>"`, registro por caso e regerar só a tela do item.
- T2 — arquivos: `~/.claude/skills/construir/SKILL.md` (passo 4, "Referências visuais"; fora do repositório) — prova: `grep -n "test:visual:docker"` → linha 30 com o comando, a linha `Visual do CI:` e `NAO_CONFERIDO` sem Docker.
- T3 — arquivos: `~/.claude/skills/verificar/SKILL.md` (passo 2; fora do repositório) — prova: `grep -n "test:visual:docker"` → passo 2 manda rodar, registrar por caso em "Verificação" e tratar divergência como achado de código.
- T4 — arquivos: nenhum (referência trocada por cópia temporária e restaurada) — prova: `cd frontend && npm run test:visual:docker -- -g "entrar"` → exit 0, 4 passaram; com `entrar-390-claro.png` trocada por outra imagem → exit 1, `entrar 390 claro` nomeado como falha; restaurada, `git status` de `frontend/` limpo.
Visual do CI: entrar (1440/390, claro/escuro) → passou
Regressão: não se aplica (só regra e processo, sem código do produto).
Desvios: nenhum.
Texto aplicado nas skills (para a descrição do PR): construir — "Antes de terminar (e ao fechar a tarefa de teste visual), rodar ... `npm run test:visual:docker -- -g "<caso>"`, sem `--update-snapshots` ... Registrar em "Construção" uma linha `Visual do CI: <caso> → passou/falhou` por caso"; verificar — "Item que toca tela: rodar também ... registrar o resultado por caso em "Verificação" e tratar referência commitada divergente como achado de código".

## Verificação

### Rodada 1 — OK — 2026-11-12, estado d9cc58563458a7a92c1ae9b7d3b6a9d37b5d1362

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | diff do AGENTS.md: regra de canvas e linha de Comandos citam `test:visual:docker -- -g "<caso>"` sem `--update-snapshots`, registro por caso e regerar só a tela do item |
| CA2 | PASSOU | construir/SKILL.md linha 30 |
| CA3 | PASSOU | verificar/SKILL.md passo 2 |
| CA4 | PASSOU | referência entrar-390-claro trocada por cópia: `-g entrar` falha, "entrar 390 claro" nomeado; restaurada, git status limpo |
| CA5 | PASSOU | `-g entrar` → 4 passed, exit 0 |

Comandos: `npm run test:visual:docker -- -g "entrar"` (exit 0, 4 passaram; com referência adulterada, 1 falha nomeada). Regressão não se aplica (só regra e processo).
Achados:
- sugestão, especificação — o arquivo cita branch `item/569-visual-ci-local`, a atual é `item/569-visual-ci-antes-do-push`.

## Entrega

- O que muda: o `AGENTS.md` passa a exigir, antes do push de item que cria ou muda tela, o teste visual do CI (`npm run test:visual:docker -- -g "<caso>"`, sem `--update-snapshots`) para os casos da tela, com o resultado por caso em "Construção"; a regra de canvas e a linha de Comandos do front-end trazem isso. As skills `construir` e `verificar` (fora do repositório) foram ajustadas nos passos citados em "Construção".
- Verificação: rodada 1 `OK` (CA1 a CA5 passaram). Visual do CI de `entrar` (1440/390, claro/escuro): passou.
- Decisões: D1 a D3 acima. A exigência vale só para item com tela; sem Docker, o resultado seria `NAO_CONFERIDO` com prova no CI do PR.
- Limitações: as skills não estão no repositório; se a fonte usada pelo agente for outra, o dono sincroniza. Achado de sugestão da verificação (nome da branch citado na especificação) não corrigido aqui.
- Regressão: não se aplica (só regra e processo, sem código do produto).
