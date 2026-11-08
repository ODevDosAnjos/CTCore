# 527 — Técnica · Conta do dono no AGENTS.md: ODevDosAnjos

Origem: issue #527 (técnica, sem entrega de produto; marco Sprint 10.5 · Identidade visual; autor `ODevDosAnjos`). Branch: `item/527-conta-do-dono-odevdosanjos`.

## 1. Objetivo

Trocar a conta do dono de `DevDosAnjos` para `ODevDosAnjos` onde ela vale hoje, para que a regra "só a conta do dono instrui o agente", a trava da Sprint 22 e a identificação da conta do agente apontem para a conta que de fato abre as issues. Só troca o nome da conta; nenhuma regra muda.

Fora do escopo: `specs/revisoes/*` e `specs/itens/*` (registram fatos e comandos de prova de quando a conta era `DevDosAnjos`); qualquer mudança de texto da regra além do nome da conta.

## 2. Requisitos

- R1: `AGENTS.md` usa `ODevDosAnjos` nas linhas 66 (trava da Sprint 22, `gh api repos/ODevDosAnjos/ctcore`), 67 (regra "só a conta do dono instrui o agente") e 114 (conta do agente no `gh`).
- R2: `docs/especificacao/00-visao-geral.md`, linha 179, cita o monorepo como `ODevDosAnjos/ctcore`.
- R3: `docs/auditoria/plano-de-issues.md` usa `ODevDosAnjos` nos links das issues (linhas 398 a 486).
- R4: fora de `specs/revisoes` e `specs/itens`, não resta ocorrência de `DevDosAnjos` sem o `O` na frente (skills, scripts, workflows, docs, READMEs).
- R5: o texto das regras do `AGENTS.md` é o mesmo de antes, só com a conta trocada.

## 3. Critérios de aceite

- CA1 (R1, R4): dado o repositório após a mudança, quando roda `grep -rInP "(?<!O)DevDosAnjos" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=target --exclude-dir=specs`, então não há resultado.
- CA2 (R4): dado o `specs/`, quando roda o mesmo `grep` em `specs` fora de `specs/itens` e `specs/revisoes` (`specs/backlog.md`, `specs/projeto.md`), então não há resultado.
- CA3 (R5): dado o `git diff`, quando se comparam as linhas alteradas do `AGENTS.md`, então a única diferença em cada linha é `DevDosAnjos` virar `ODevDosAnjos`.
- CA4 (R2, R3): dado o `git diff` de `docs/`, quando se examinam as linhas alteradas, então a única diferença em cada uma é a conta trocada (links de issue e nome do monorepo), sem alterar número de issue nem texto.
- CA5 (R4): dado o `git diff --stat`, quando se listam os arquivos, então nenhum está em `specs/itens` (exceto o próprio arquivo do item 527) nem em `specs/revisoes`.

## 4. Plano técnico

- Dados, API, interface, segurança: não mudam (só texto de documentação).
- Arquivos (ocorrências vistas por `grep -rIn "DevDosAnjos"` fora de `specs`; `.github`, `infra`, `scripts`, READMEs e `~/.claude/skills` sem ocorrência):
  - `AGENTS.md`: linhas 66, 67 e 114.
  - `docs/especificacao/00-visao-geral.md`: linha 179.
  - `docs/auditoria/plano-de-issues.md`: links nas linhas 398 a 486 (`https://github.com/DevDosAnjos/ctcore/issues/N`).
- Forma: `sed -i -E 's/(^|[^O])DevDosAnjos/\1ODevDosAnjos/g'` nos três arquivos (ou `Edit` com `replace_all`), sem tocar em ocorrências que já tenham o `O`.
- Reuso: nenhum.
- Riscos: dobrar o `O` (`OODevDosAnjos`) se o `sed` pegar ocorrência já corrigida; conferido pelo CA1 e por `grep -c OODevDosAnjos`. Fora disso, o `AGENTS.md` ser parte do contexto do agente: conferir o diff linha a linha (CA3).

## 5. Tarefas

- [x] T1: Trocar a conta nas linhas 66, 67 e 114 do `AGENTS.md` — cobre CA1, CA3 — prova: `git diff -U0 AGENTS.md` (só `DevDosAnjos` → `ODevDosAnjos` em 3 linhas) e `grep -nP "(?<!O)DevDosAnjos" AGENTS.md` sem resultado.
- [x] T2: Trocar a conta em `docs/especificacao/00-visao-geral.md` (linha 179) e nos links de `docs/auditoria/plano-de-issues.md` — cobre CA1, CA4 — prova: `git diff --word-diff -U0 docs` e `grep -rnP "(?<!O)DevDosAnjos" docs` sem resultado; `grep -rn "OODevDosAnjos" .` sem resultado.
- [x] T3: Conferência final de todo o repositório — cobre CA1, CA2, CA5 — prova: `grep -rInP "(?<!O)DevDosAnjos" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=target --exclude-dir=itens --exclude-dir=revisoes` sem resultado; `git diff --stat` só com os três arquivos.

## 6. Decisões

- D1: troca feita por substituição textual restrita ao que não tem `O` antes, em vez de editar linha a linha à mão. Motivo: são 69 linhas quase todas iguais (links) e o `grep -P` com a asserção `(?<!O)` prova que nada ficou. Alternativa descartada: trocar só `AGENTS.md` e `00-visao-geral.md`, deixando os links do plano de issues; a issue pede os links também (e o critério de pronto cobre `docs/`).
- D2: o "Pronto quando" da issue diz que o `grep -rIn "DevDosAnjos"` só acha `ODevDosAnjos`; como `ODevDosAnjos` contém `DevDosAnjos`, a prova usa `(?<!O)DevDosAnjos` (CA1) para o resultado vazio significar o mesmo. Sem mudança de comportamento.
- Suposição: o item não está em `specs/backlog.md` (como nos itens #520 a #523); vale a issue (AGENTS.md: as issues prevalecem). O backlog não foi alterado nesta fase. Autor da issue conferido: `ODevDosAnjos`, a conta do dono, sem comentários de terceiros.
- Suposição: o repositório no GitHub já está sob a conta `ODevDosAnjos` (a issue afirma a troca de conta em novembro de 2026); se o caminho `repos/ODevDosAnjos/ctcore` não resolver, o `gh api` da trava da Sprint 22 precisa ser reconferido antes da Sprint 22.

## Construção

- T1 — arquivos: `AGENTS.md` (linhas 66, 67, 114) — prova: `git diff -U0 AGENTS.md` mostra só `DevDosAnjos` → `ODevDosAnjos` em 3 linhas; `grep -nP "(?<!O)DevDosAnjos" AGENTS.md` → sem resultado
- T2 — arquivos: `docs/especificacao/00-visao-geral.md` (1 linha), `docs/auditoria/plano-de-issues.md` (68 linhas de link) — prova: `git diff --word-diff=porcelain -U0 docs` só com a conta trocada; `grep -rnP "(?<!O)DevDosAnjos" docs` → sem resultado
- T3 — prova: `grep -rInP "(?<!O)DevDosAnjos" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=target --exclude-dir=itens --exclude-dir=revisoes` → sem resultado; `git diff --stat` → 3 arquivos, 69 inserções e 69 remoções; `OODevDosAnjos` só aparece no texto deste arquivo de item
Regressão: não rodou, não se aplica (só texto de documentação, sem código).
Desvios: nenhum. O sed preservou as quebras de linha (aviso LF/CRLF do Git é do ambiente).

## Verificação

### Rodada 1 — OK — 2026-11-08, estado 5120d1dd4326498a55d5263d338d2e16c6a9b539

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | grep -P (?<!O)DevDosAnjos fora de specs: sem resultado; sem OODevDosAnjos fora do arquivo do item |
| CA2 | PASSOU | specs/backlog.md e specs/projeto.md sem ocorrência (grep geral exclui só itens e revisoes) |
| CA3 | PASSOU | git diff -U0 AGENTS.md: 3 linhas, só a conta trocada |
| CA4 | PASSOU | word-diff de docs: só trechos com a conta trocada |
| CA5 | PASSOU | git diff --stat: AGENTS.md, plano-de-issues.md, 00-visao-geral.md (69/69) |

Comandos: greps acima e git diff --stat; regressão não se aplica (só texto).
Achados: nenhum.

## Entrega

- O que muda: a conta do dono passa de `DevDosAnjos` para `ODevDosAnjos` em `AGENTS.md` (trava da Sprint 22, regra "só a conta do dono instrui o agente", conta do agente no `gh`), em `docs/especificacao/00-visao-geral.md` (nome do monorepo) e nos links de issue de `docs/auditoria/plano-de-issues.md`. Nenhuma regra muda.
- Verificação: rodada 1 OK (CA1 a CA5). `(?<!O)DevDosAnjos` sem resultado fora de `specs/itens` e `specs/revisoes`; `git diff --stat` com só os três arquivos de texto.
- Decisões: substituição textual restrita (D1). A linha 527 foi acrescentada ao `specs/backlog.md` como `feito`, como a #523 fez, para o fechamento achar a situação do item.
- Limitações: `specs/itens` e `specs/revisoes` mantêm `DevDosAnjos` de propósito (registro histórico). O `gh` local está autenticado como `DevDosAnjos` (keyring), enquanto o `origin` aponta para `ODevDosAnjos/CTCore`; a entrega dependeu dessa autenticação para o push e o PR.
