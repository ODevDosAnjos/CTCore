# 646 — RNF-45 · Cabeçalhos sem subtítulo de unidade e sem notas de regra interna

Origem: issue #646 (Sprint 10.5), RNF-45 em `docs/especificacao/00-visao-geral.md`, decisões 33 e 34 de `docs/auditoria/decisoes-canvas.md`.

## Item-mãe: dividido em partes

A #646 passa muito de 30 arquivos contáveis (AGENTS.md, "Tamanho do item"). O dono aprovou a divisão em 25/11/2026 (P6). **Este arquivo é só um ponteiro: a #646 não tem construção, verificação nem PR próprios.** Cada parte tem a sua issue, o seu PR, a sua especificação e o seu arquivo de item, escrita quando a parte chega ao `especificar`. A lista de chaves e a regra geral estão na issue #646.

| Parte | Issue | Telas | Arquivo do item |
|---|---|---|---|
| a | #717 | Pessoas: alunos, matrícula, professores, ficha | `specs/itens/717-cabecalhos-pessoas.md` (especificado) |
| b | #718 | Operação: agenda, feriados e recessos, turmas, faixas etárias, modalidades, pedidos do portal | `specs/itens/718-cabecalhos-operacao.md` (especificado) |
| c | #719 | Financeiro: planos, benefícios, cobranças e subtelas, pagamento, comprovante Pix | `specs/itens/719-cabecalhos-financeiro.md` (especificado) |
| d | #720 | Comunicação: comunicados, novo comunicado, aviso de aula | a especificar |
| e | #721 | Configurações, conta e portal; conferência final tela por tela; fecha a #646 | a especificar |

Ordem: #717, #718, #719, #720, #721 (cada uma depende da anterior). A #714 depende da #721. A #646 fecha no merge da #721 (o PR da #721 traz `Closes #721` e `Closes #646`).
