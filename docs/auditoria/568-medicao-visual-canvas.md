# #568 · Medição do limite do visual:canvas

Medição de 25/11/2026 sobre o commit `7907041b` (referências regeradas na #710): `frontend/visual/referencias` x `docs/design/prints`, 165 casos e variantes (tela, largura, tema). O script de medição foi descartável (não está no repositório). Nada no critério mudou.

## Decisão

**30% mantido por ora.** Motivo: o menu e o cabeçalho do sistema diferem do canvas em quase toda tela; sem tirar esse ruído, qualquer limite que reprove `turmas` reprova cerca de 2/3 dos 165 casos, a maioria sem divergência real. A regra temporária do `AGENTS.md` (conferência lado a lado) continua valendo até a #714.

## Critérios medidos

- **Atual:** blocos de 32 px, cor média, limiar 40, reprova com mais de 30% de blocos diferentes (`frontend/visual/comparar.mjs`).
- **(a) Bloco menor:** blocos de 8 e de 16 px, limiar de cor 25.
- **(b) Por região (blocos de 8 px, limiar 25):** menu (x < 240, só em 1440), topo (y < 64) e conteúdo (o resto).
- **(c) Bordas:** máscara de blocos "com borda" (gradiente médio de luminância maior que 12), comparada bloco a bloco, em 8 e 16 px; e nas regiões menu e topo.

Os valores são a fração de blocos diferentes. O grupo "conhecidos" são os quatro casos com divergência achada à mão que hoje passam, medidos em 1440 claro: `turma-painel`, `turmas`, `ficha-aluno` e `configuracoes-organizacao`. `ficha-aluno` só passa porque tem `limiteCanvas` de 0,40 (mede 36,4% no critério atual); os outros três passam no limite padrão.

## Resultado

| Candidato | turma-painel | turmas | ficha-aluno | configuracoes-organizacao | Menor | Demais >= menor | Demais >= maior |
|---|---|---|---|---|---|---|---|
| Atual (32 px, cor) | 0,8% | 1,0% | 36,4% | 3,8% | 0,8% | 143 de 161 | 37 de 161 |
| (a) bloco 8 | 9,3% | 8,4% | 42,5% | 12,3% | 8,4% | 112 de 161 | 37 de 161 |
| (a) bloco 16 | 7,1% | 7,0% | 42,8% | 9,4% | 7,0% | 111 de 161 | 37 de 161 |
| (b) menu | 6,2% | 9,8% | 3,7% | 13,4% | 3,7% | 97 de 139 | 10 de 139 |
| (b) topo | 20,1% | 8,3% | 56,5% | 9,1% | 8,3% | 107 de 161 | 39 de 161 |
| (b) conteúdo | 9,2% | 8,1% | 49,9% | 12,3% | 8,1% | 120 de 161 | 35 de 161 |
| (c) bordas 8 | 13,8% | 11,0% | 16,4% | 16,6% | 11,0% | 107 de 161 | 41 de 161 |
| (c) bordas 16 | 18,6% | 14,8% | 19,1% | 18,2% | 14,8% | 83 de 161 | 33 de 161 |
| (c) bordas menu | 12,6% | 13,8% | 10,0% | 18,6% | 10,0% | 74 de 139 | 0 de 139 |
| (c) bordas topo | 14,8% | 11,9% | 17,6% | 11,9% | 11,9% | 77 de 161 | 20 de 161 |

"Demais" são as 161 variantes fora dos conhecidos (menos nas colunas de menu, que só existem em 1440). A coluna "Demais >= menor" conta quantos desses medem o mesmo ou mais que o menor dos conhecidos: um limite que reprove o conhecido de menor valor reprova esses também.

- **Nenhum candidato separa os dois grupos.** Em todos, de 74 a 143 dos casos "demais" medem o mesmo ou mais que o menor conhecido, e de 0 a 41 medem o mesmo ou mais que o maior. Os conhecidos ficam no meio da distribuição.
- **Atual:** os três conhecidos sem `limiteCanvas` medem de 0,8% a 3,8%, abaixo do limite; 143 de 161 demais medem mais que `turma-painel`.
- **Por que:** todas as telas do sistema medem de 3% a 20% nos candidatos finos, porque o menu lateral e o cabeçalho do sistema diferem do canvas em quase toda tela e os dados do MSW diferem em todas. A divergência real dos conhecidos é de layout fino (em `turmas`: a tabela sem o cartão com borda do canvas, outros itens de menu, linhas e cabeçalho deslocados de 10 a 20 px, outra altura de linha), que pixel, bloco ou borda confundem com esse ruído.
- **Sem lista de telas corretas:** não há ground truth para calibrar. A afirmação "a estrutura confere lado a lado" de itens anteriores foi desmentida pelas capturas (ver `specs/itens/477`), e os "Visual do CI: passou" medem o teste visual do sistema, não a comparação com o canvas.

## Próximos passos

1. **#624** (menu lateral) e **#646** (cabeçalhos) corrigem a moldura, que é o ruído sistêmico.
2. **#714** (Sprint 10.5; depende de #624, #646 e #568) recalibra o critério com esta medição como base, decide se o método varia por variante (1440 claro, 1440 escuro, 390), revisa a Autonomia 4 e remove a regra temporária do `AGENTS.md`.

## Tabela por caso e variante

Valores em % de blocos diferentes. Colunas: Atual; a8 e a16 (bloco 8 e 16); menu, topo e cont. (região, bloco 8); b8 e b16 (bordas); b-menu e b-topo (bordas por região). "-" quando a região não existe (390 px não tem menu lateral).

| Tela | Larg. | Tema | Conhecido | Atual | a8 | a16 | menu | topo | cont. | b8 | b16 | b-menu | b-topo |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| entrar | 1440 | claro |  | 4,9% | 6,8% | 6,5% | 9,5% | 0,0% | 6,7% | 5,1% | 6,4% | 5,9% | 0,0% |
| entrar | 390 | claro |  | 0,3% | 5,6% | 5,5% | - | 9,2% | 5,3% | 4,8% | 4,2% | - | 6,1% |
| inicio | 1440 | claro |  | 1,9% | 7,3% | 6,8% | 7,9% | 8,0% | 7,1% | 11,7% | 15,3% | 11,2% | 11,4% |
| inicio | 1440 | escuro |  | 3,1% | 10,5% | 12,1% | 7,9% | 9,4% | 11,1% | 11,6% | 15,0% | 11,2% | 17,0% |
| portal-aluno | 1440 | claro |  | 4,5% | 10,6% | 9,7% | 8,3% | 13,0% | 10,9% | 11,1% | 14,5% | 8,6% | 11,3% |
| portal-aluno | 390 | claro |  | 10,0% | 27,2% | 25,7% | - | 16,1% | 28,1% | 23,0% | 29,5% | - | 12,5% |
| portal-responsavel | 1440 | claro |  | 1,5% | 3,8% | 2,9% | 4,1% | 16,6% | 2,8% | 5,4% | 7,3% | 4,8% | 12,8% |
| portal-reduzido | 1440 | claro |  | 5,6% | 10,3% | 9,2% | 9,0% | 10,3% | 10,6% | 10,1% | 12,2% | 9,6% | 8,0% |
| portal-reduzido | 390 | claro |  | 7,4% | 21,2% | 21,3% | - | 13,5% | 21,9% | 20,5% | 24,4% | - | 10,7% |
| portal-inicio-responsavel | 1440 | claro |  | 4,4% | 10,3% | 10,0% | 8,6% | 13,5% | 10,4% | 12,2% | 15,9% | 9,4% | 11,6% |
| portal-inicio-responsavel | 390 | claro |  | 11,1% | 23,2% | 21,1% | - | 15,6% | 23,9% | 23,8% | 28,4% | - | 12,5% |
| portal-inicio-em-dia | 1440 | claro |  | 1,6% | 7,3% | 6,2% | 5,8% | 13,3% | 7,2% | 9,7% | 12,5% | 7,6% | 11,3% |
| portal-confirmar-modalidade | 1440 | claro |  | 4,8% | 9,8% | 7,6% | 3,8% | 6,7% | 11,3% | 10,1% | 9,7% | 6,8% | 10,7% |
| portal-confirmar-modalidade | 390 | claro |  | 34,5% | 38,3% | 36,0% | - | 8,4% | 40,9% | 22,2% | 23,3% | - | 8,2% |
| portal-termo | 1440 | claro |  | 1,5% | 7,4% | 5,4% | 0,0% | 3,4% | 9,3% | 9,2% | 10,1% | 0,0% | 2,1% |
| portal-termo | 390 | claro |  | 8,3% | 25,6% | 25,8% | - | 12,5% | 26,7% | 26,8% | 32,6% | - | 7,1% |
| portal-termo-filhos | 1440 | claro |  | 2,5% | 7,7% | 6,7% | 0,0% | 3,0% | 9,7% | 8,5% | 11,4% | 0,0% | 0,6% |
| portal-agenda | 1440 | claro |  | 1,7% | 9,9% | 9,3% | 5,5% | 12,8% | 10,6% | 9,4% | 11,4% | 5,4% | 11,3% |
| portal-agenda | 390 | claro |  | 4,0% | 17,8% | 14,1% | - | 16,1% | 17,9% | 18,8% | 20,7% | - | 12,5% |
| portal-avisos | 1440 | claro |  | 0,6% | 6,7% | 5,1% | 7,4% | 13,8% | 6,0% | 8,8% | 11,5% | 7,8% | 11,2% |
| portal-avisos | 390 | claro |  | 1,5% | 14,6% | 14,9% | - | 16,1% | 14,4% | 20,1% | 24,2% | - | 12,5% |
| portal-aviso-aberto | 1440 | claro |  | 1,0% | 5,6% | 3,3% | 5,5% | 13,8% | 5,1% | 6,6% | 7,4% | 5,9% | 11,2% |
| portal-aviso-aberto | 390 | claro |  | 2,8% | 17,1% | 18,3% | - | 16,1% | 17,2% | 23,1% | 25,7% | - | 12,5% |
| portal-financeiro | 1440 | claro |  | 2,8% | 9,5% | 9,1% | 9,1% | 13,8% | 9,3% | 11,5% | 14,7% | 9,7% | 11,3% |
| portal-financeiro | 390 | claro |  | 11,4% | 24,2% | 21,4% | - | 16,1% | 24,9% | 21,3% | 26,9% | - | 12,5% |
| portal-pix-chave | 1440 | claro |  | 66,3% | 75,5% | 76,3% | 91,6% | 7,3% | 76,7% | 14,4% | 15,0% | 7,8% | 10,3% |
| portal-pix-chave | 390 | claro |  | 15,4% | 25,8% | 26,3% | - | 88,8% | 20,2% | 20,1% | 27,1% | - | 25,8% |
| portal-informacoes | 1440 | claro |  | 0,9% | 9,8% | 7,8% | 8,2% | 14,4% | 9,9% | 12,8% | 14,9% | 9,3% | 11,1% |
| portal-informacoes | 390 | claro |  | 1,7% | 15,3% | 12,4% | - | 16,1% | 15,2% | 19,2% | 20,8% | - | 12,5% |
| portal-carteirinha | 1440 | claro |  | 7,1% | 10,3% | 9,6% | 11,5% | 15,3% | 9,8% | 8,1% | 10,5% | 5,9% | 11,3% |
| portal-carteirinha | 390 | claro |  | 18,5% | 27,1% | 28,6% | - | 16,1% | 28,1% | 18,7% | 22,4% | - | 12,5% |
| portal-carteirinha-filhos | 1440 | claro |  | 11,0% | 14,0% | 13,2% | 10,7% | 15,8% | 14,6% | 9,6% | 11,7% | 6,8% | 11,7% |
| portal-pedidos | 1440 | claro |  | 0,6% | 6,9% | 4,8% | 5,9% | 14,4% | 6,6% | 9,3% | 11,5% | 7,4% | 10,9% |
| portal-pedidos | 390 | claro |  | 0,6% | 13,2% | 8,2% | - | 15,8% | 13,0% | 16,3% | 14,9% | - | 12,0% |
| portal-pedido-turma | 1440 | claro |  | 2,6% | 7,9% | 6,2% | 3,2% | 7,8% | 8,9% | 12,0% | 10,4% | 5,9% | 10,8% |
| portal-pedido-turma | 390 | claro |  | 49,9% | 51,7% | 52,6% | - | 100,0% | 47,4% | 24,4% | 26,3% | - | 23,0% |
| portal-pedido-plano | 1440 | claro |  | 0,6% | 6,5% | 4,8% | 3,1% | 7,8% | 7,2% | 9,8% | 9,6% | 5,9% | 10,8% |
| portal-pedido-modalidade | 1440 | claro |  | 2,2% | 7,8% | 6,5% | 3,1% | 7,8% | 8,8% | 11,8% | 9,6% | 5,9% | 10,8% |
| portal-pedido-encerrar | 1440 | claro |  | 2,9% | 9,5% | 7,1% | 3,2% | 7,8% | 10,9% | 11,1% | 10,9% | 5,9% | 10,8% |
| portal-pedido-encerrar | 390 | claro |  | 45,2% | 53,5% | 58,4% | - | 98,5% | 49,5% | 28,4% | 32,2% | - | 21,2% |
| portal-pedido-bloqueado | 1440 | claro |  | 0,1% | 4,8% | 3,7% | 3,1% | 7,8% | 5,0% | 8,2% | 7,4% | 5,9% | 10,8% |
| alunos | 1440 | claro |  | 3,5% | 14,8% | 12,7% | 9,7% | 8,4% | 16,4% | 17,8% | 22,2% | 13,7% | 11,8% |
| professores | 1440 | claro |  | 1,6% | 8,1% | 6,9% | 10,0% | 8,3% | 7,7% | 10,2% | 13,3% | 14,1% | 11,8% |
| agenda | 1440 | claro |  | 3,5% | 13,2% | 10,2% | 9,4% | 8,5% | 14,3% | 9,6% | 12,8% | 13,6% | 11,9% |
| agenda-painel | 1440 | claro |  | 3,4% | 11,2% | 10,1% | 5,9% | 16,0% | 12,0% | 11,5% | 15,7% | 12,3% | 14,2% |
| dias-sem-aula | 1440 | claro |  | 2,9% | 10,7% | 10,0% | 10,1% | 8,3% | 11,0% | 14,0% | 17,3% | 13,7% | 11,8% |
| turmas | 1440 | claro | sim | 1,0% | 8,4% | 7,0% | 9,8% | 8,3% | 8,1% | 11,0% | 14,8% | 13,8% | 11,9% |
| planos | 1440 | claro |  | 0,6% | 8,5% | 6,1% | 10,4% | 7,9% | 8,1% | 9,9% | 11,7% | 13,9% | 11,3% |
| beneficios | 1440 | claro |  | 1,6% | 10,2% | 8,7% | 10,8% | 8,3% | 10,2% | 14,3% | 17,9% | 13,9% | 12,2% |
| cobrancas | 1440 | claro |  | 2,1% | 13,3% | 11,2% | 9,6% | 9,0% | 14,3% | 16,8% | 21,2% | 13,6% | 12,7% |
| cobrancas | 1440 | escuro |  | 2,3% | 14,1% | 12,7% | 9,6% | 10,5% | 15,3% | 19,1% | 21,0% | 13,6% | 18,3% |
| cobrancas-erro | 1440 | claro |  | 2,5% | 7,2% | 5,3% | 10,1% | 9,1% | 6,4% | 8,7% | 10,6% | 13,8% | 12,8% |
| cobrancas-sem-acesso | 1440 | claro |  | 3,9% | 6,1% | 5,7% | 5,2% | 7,7% | 6,2% | 7,1% | 9,3% | 7,3% | 12,8% |
| cobrancas-atrasados | 1440 | claro |  | 2,0% | 14,2% | 14,4% | 10,3% | 9,4% | 15,3% | 17,7% | 22,3% | 14,9% | 12,3% |
| cobrancas-conferencia | 1440 | claro |  | 13,1% | 19,0% | 18,2% | 10,3% | 10,4% | 21,4% | 13,6% | 16,8% | 14,9% | 12,8% |
| cobrancas-conferencia-janela | 1440 | claro |  | 56,0% | 62,6% | 63,4% | 2,7% | 96,8% | 73,1% | 10,9% | 13,1% | 10,3% | 13,7% |
| cobrancas-recebimentos | 1440 | claro |  | 0,5% | 6,2% | 4,7% | 10,1% | 10,0% | 5,1% | 7,5% | 10,0% | 13,9% | 13,2% |
| cobrancas-previa | 1440 | claro |  | 3,6% | 11,4% | 10,9% | 9,7% | 9,7% | 11,9% | 13,6% | 17,9% | 13,3% | 12,7% |
| pedidos | 1440 | claro |  | 1,3% | 8,8% | 7,0% | 9,9% | 8,4% | 8,6% | 11,1% | 14,4% | 14,0% | 11,8% |
| pedido-recusar | 1440 | claro |  | 59,1% | 66,6% | 66,0% | 2,9% | 97,1% | 78,2% | 9,6% | 9,3% | 10,3% | 12,0% |
| pedido-trocar-turma | 1440 | claro |  | 60,6% | 65,2% | 65,9% | 2,9% | 96,6% | 76,4% | 19,0% | 21,4% | 5,7% | 21,9% |
| comunicados | 1440 | claro |  | 1,0% | 9,4% | 8,3% | 9,2% | 6,7% | 9,7% | 11,6% | 14,2% | 12,4% | 9,6% |
| comunicados-novo | 1440 | claro |  | 3,7% | 12,4% | 11,3% | 8,6% | 9,0% | 13,5% | 17,5% | 19,0% | 12,2% | 12,3% |
| comunicados-cancelar | 1440 | claro |  | 0,1% | 5,0% | 3,4% | 4,0% | 2,5% | 5,3% | 8,0% | 6,9% | 10,3% | 8,8% |
| comunicados-limite | 1440 | claro |  | 0,9% | 7,4% | 6,5% | 9,2% | 6,8% | 7,1% | 8,8% | 11,9% | 12,5% | 9,7% |
| comunicados-organizacao | 1440 | claro |  | 8,3% | 14,9% | 13,9% | 4,0% | 3,0% | 18,1% | 14,0% | 13,7% | 9,6% | 9,7% |
| configuracoes-organizacao | 1440 | claro | sim | 3,8% | 12,3% | 9,4% | 13,4% | 9,1% | 12,3% | 16,6% | 18,2% | 18,6% | 11,9% |
| configuracoes-unidades | 1440 | claro |  | 0,7% | 5,9% | 4,1% | 13,4% | 9,2% | 4,1% | 7,3% | 9,7% | 18,0% | 11,7% |
| configuracoes-unidade | 1440 | claro |  | 2,7% | 10,5% | 9,7% | 12,6% | 6,8% | 10,3% | 17,7% | 19,5% | 17,3% | 9,8% |
| configuracoes-unidade-pagamentos | 1440 | claro |  | 0,8% | 9,5% | 7,6% | 12,6% | 8,1% | 8,9% | 16,6% | 17,4% | 17,3% | 11,4% |
| configuracoes-unidade-pagamentos-desconectado | 1440 | claro |  | 7,0% | 13,6% | 11,8% | 13,1% | 85,2% | 8,8% | 15,3% | 17,7% | 17,5% | 34,0% |
| configuracoes-unidade-lembretes | 1440 | claro |  | 1,0% | 10,5% | 9,4% | 13,1% | 7,8% | 10,1% | 13,5% | 17,1% | 17,5% | 11,1% |
| configuracoes-unidade-links | 1440 | claro |  | 1,9% | 8,2% | 6,8% | 13,1% | 7,2% | 7,3% | 10,0% | 12,8% | 17,5% | 10,4% |
| configuracoes-modalidades | 1440 | claro |  | 0,3% | 8,3% | 6,3% | 14,0% | 9,2% | 7,1% | 12,0% | 14,9% | 18,1% | 11,8% |
| configuracoes-faixas-etarias | 1440 | claro |  | 0,5% | 5,9% | 4,2% | 13,8% | 8,5% | 4,0% | 7,1% | 9,0% | 17,5% | 11,8% |
| configuracoes-permissoes | 1440 | claro |  | 5,2% | 14,2% | 13,2% | 36,6% | 9,8% | 9,7% | 12,5% | 15,8% | 13,3% | 12,6% |
| configuracoes-termos | 1440 | claro |  | 1,5% | 9,7% | 6,9% | 13,2% | 9,0% | 8,9% | 12,2% | 13,7% | 18,1% | 11,8% |
| configuracoes-textos | 1440 | claro |  | 1,4% | 11,3% | 9,7% | 13,2% | 7,7% | 11,1% | 16,4% | 21,1% | 16,9% | 11,2% |
| conta | 1440 | claro |  | 0,4% | 5,4% | 4,8% | 8,3% | 8,8% | 4,5% | 9,8% | 12,4% | 11,5% | 12,2% |
| escolha-organizacao | 1440 | claro |  | 0,6% | 3,0% | 1,6% | 0,4% | 0,0% | 3,8% | 3,3% | 3,5% | 0,4% | 0,0% |
| escolha-organizacao | 390 | claro |  | 5,5% | 14,7% | 12,3% | - | 7,9% | 15,3% | 19,2% | 19,8% | - | 6,6% |
| login-travado | 1440 | claro |  | 3,3% | 7,2% | 6,5% | 9,5% | 0,0% | 7,2% | 5,8% | 5,8% | 5,9% | 0,0% |
| login-travado | 390 | claro |  | 8,0% | 17,9% | 15,0% | - | 9,2% | 18,7% | 16,3% | 16,5% | - | 6,1% |
| login-duas-etapas | 1440 | claro |  | 4,2% | 6,2% | 5,3% | 9,5% | 0,0% | 5,9% | 6,0% | 6,7% | 5,9% | 0,0% |
| login-codigo-reserva | 1440 | claro |  | 2,1% | 5,2% | 4,5% | 9,5% | 0,0% | 4,6% | 4,6% | 4,9% | 5,9% | 0,0% |
| esqueci-senha | 1440 | claro |  | 4,4% | 7,0% | 6,9% | 9,5% | 0,0% | 7,0% | 5,0% | 6,7% | 5,9% | 0,0% |
| esqueci-senha-enviado | 1440 | claro |  | 5,2% | 7,3% | 6,5% | 9,5% | 0,0% | 7,4% | 5,5% | 6,9% | 5,9% | 0,0% |
| redefinir-senha | 1440 | claro |  | 5,6% | 7,6% | 7,8% | 9,5% | 0,0% | 7,7% | 5,9% | 6,5% | 5,9% | 0,0% |
| redefinir-senha-vencida | 1440 | claro |  | 5,7% | 7,2% | 6,7% | 9,5% | 0,0% | 7,3% | 4,7% | 5,8% | 5,9% | 0,0% |
| convite | 1440 | claro |  | 6,6% | 7,9% | 7,7% | 9,5% | 0,0% | 8,1% | 6,1% | 7,5% | 5,9% | 0,0% |
| convite-conta-existente | 1440 | claro |  | 4,0% | 7,0% | 6,8% | 9,5% | 0,0% | 6,9% | 5,8% | 6,9% | 5,9% | 0,0% |
| convite-vencido | 1440 | claro |  | 6,1% | 7,6% | 7,0% | 9,5% | 0,0% | 7,7% | 5,4% | 5,4% | 5,9% | 0,0% |
| sem-acesso | 1440 | claro |  | 3,9% | 6,0% | 5,6% | 5,2% | 7,7% | 6,0% | 6,6% | 8,6% | 7,3% | 12,8% |
| sem-acesso | 390 | claro |  | 20,6% | 22,2% | 22,2% | - | 12,5% | 23,1% | 13,4% | 15,7% | - | 14,0% |
| conta-aluno | 1440 | claro |  | 68,1% | 76,4% | 75,6% | 93,3% | 8,1% | 77,4% | 12,8% | 12,3% | 5,1% | 10,3% |
| conta-duas-etapas | 1440 | claro |  | 5,2% | 11,3% | 10,3% | 3,1% | 3,9% | 13,6% | 13,2% | 12,6% | 9,8% | 11,0% |
| conta-codigos-reserva | 1440 | claro |  | 2,9% | 8,2% | 5,7% | 3,1% | 3,7% | 9,6% | 9,4% | 10,4% | 9,8% | 11,3% |
| conta-notificacoes | 1440 | claro |  | 1,3% | 5,8% | 4,3% | 8,3% | 8,1% | 5,1% | 6,9% | 9,0% | 11,6% | 11,8% |
| configuracoes-organizacao-contraste | 1440 | claro |  | 3,2% | 10,5% | 8,5% | 13,5% | 9,1% | 10,0% | 15,3% | 17,3% | 18,2% | 11,9% |
| configuracoes-transferir-coordenacao | 1440 | claro |  | 9,3% | 16,6% | 14,1% | 4,9% | 3,9% | 20,0% | 18,3% | 20,9% | 15,3% | 10,8% |
| configuracoes-unidade-nova | 1440 | claro |  | 1,2% | 6,1% | 5,1% | 13,4% | 10,6% | 4,2% | 11,1% | 10,3% | 18,0% | 13,5% |
| configuracoes-unidade-desativar | 1440 | claro |  | 6,3% | 9,9% | 7,8% | 4,6% | 3,9% | 11,5% | 12,0% | 13,5% | 15,2% | 10,8% |
| configuracoes-unidade-unica | 1440 | claro |  | 4,7% | 8,2% | 7,0% | 4,6% | 4,0% | 9,2% | 10,1% | 11,1% | 15,2% | 10,8% |
| configuracoes-unidade-professor | 1440 | claro |  | 1,7% | 8,2% | 6,3% | 13,1% | 9,3% | 7,1% | 9,2% | 11,7% | 17,5% | 12,8% |
| configuracoes-modalidades-administrador | 1440 | claro |  | 0,4% | 4,3% | 2,6% | 13,4% | 7,8% | 2,2% | 5,5% | 7,2% | 17,5% | 11,4% |
| configuracoes-modalidade-desativar | 1440 | claro |  | 1,3% | 4,1% | 3,2% | 4,9% | 4,0% | 4,0% | 8,0% | 8,8% | 15,4% | 10,8% |
| configuracoes-unidade-modalidades-recusa | 1440 | claro |  | 2,3% | 10,6% | 8,3% | 13,1% | 6,8% | 10,4% | 13,9% | 15,7% | 16,9% | 9,7% |
| configuracoes-modalidades-graduacao | 1440 | claro |  | 6,4% | 11,4% | 10,1% | 5,0% | 60,5% | 9,5% | 18,9% | 17,6% | 15,4% | 16,1% |
| professor-novo | 1440 | claro |  | 3,3% | 9,3% | 7,6% | 4,0% | 3,7% | 10,8% | 12,9% | 13,3% | 11,1% | 11,3% |
| professor-painel | 1440 | claro |  | 4,0% | 10,9% | 8,9% | 6,6% | 16,4% | 11,5% | 12,2% | 15,6% | 12,7% | 15,3% |
| professor-inativar | 1440 | claro |  | 41,3% | 62,2% | 61,5% | 2,9% | 95,9% | 72,5% | 13,7% | 13,1% | 10,5% | 24,4% |
| professor-modalidade-recusa | 1440 | claro |  | 51,9% | 68,1% | 68,3% | 2,9% | 95,9% | 80,1% | 15,0% | 15,0% | 10,5% | 24,4% |
| portal-revogar-imagem | 1440 | claro |  | 73,8% | 80,7% | 78,5% | 93,0% | 8,1% | 83,0% | 8,3% | 7,1% | 6,7% | 10,3% |
| turma-desativar | 1440 | claro |  | 0,5% | 8,1% | 6,3% | 3,7% | 3,6% | 9,3% | 11,7% | 11,7% | 11,3% | 11,3% |
| turma-nova | 1440 | claro |  | 14,2% | 18,7% | 19,6% | 3,8% | 3,6% | 23,0% | 16,3% | 16,2% | 11,4% | 11,3% |
| turma-editar | 1440 | claro |  | 7,9% | 16,5% | 17,9% | 3,8% | 3,6% | 20,2% | 17,6% | 15,6% | 11,4% | 11,3% |
| turma-titular-inativo | 1440 | claro |  | 10,5% | 13,3% | 11,6% | 3,7% | 3,6% | 16,0% | 13,2% | 14,8% | 11,3% | 11,3% |
| turma-painel | 1440 | claro | sim | 0,8% | 9,3% | 7,1% | 6,2% | 20,1% | 9,2% | 13,8% | 18,6% | 12,6% | 14,8% |
| agenda-aula-avulsa | 1440 | claro |  | 48,7% | 57,4% | 56,4% | 2,6% | 96,8% | 66,4% | 14,2% | 14,1% | 10,1% | 12,0% |
| aula-cancelar | 1440 | claro |  | 55,9% | 60,9% | 61,6% | 2,5% | 97,6% | 70,9% | 15,2% | 16,4% | 8,3% | 17,4% |
| aula-editar | 1440 | claro |  | 53,8% | 60,8% | 60,8% | 2,5% | 97,6% | 70,7% | 16,2% | 16,2% | 8,3% | 17,4% |
| aula-editar-seguintes | 1440 | claro |  | 53,6% | 62,5% | 62,1% | 2,5% | 97,6% | 73,0% | 15,6% | 18,3% | 8,3% | 17,4% |
| aula-corrigir | 1440 | claro |  | 63,3% | 66,0% | 66,7% | 2,5% | 97,6% | 77,4% | 14,6% | 16,2% | 8,3% | 18,7% |
| aula-avisar-turma | 1440 | claro |  | 51,8% | 55,6% | 56,6% | 2,5% | 98,1% | 64,0% | 15,6% | 17,1% | 8,3% | 17,3% |
| dia-sem-aula-novo | 1440 | claro |  | 6,5% | 14,7% | 12,0% | 3,5% | 15,7% | 17,0% | 17,3% | 17,8% | 10,8% | 17,2% |
| plano-novo | 1440 | claro |  | 54,1% | 64,3% | 63,3% | 2,3% | 96,3% | 75,4% | 17,2% | 16,6% | 10,0% | 13,6% |
| plano-editar | 1440 | claro |  | 43,6% | 59,4% | 56,3% | 2,3% | 96,3% | 69,0% | 19,5% | 20,4% | 10,0% | 13,6% |
| plano-desativar | 1440 | claro |  | 61,1% | 68,4% | 66,0% | 2,6% | 96,4% | 80,5% | 10,0% | 9,4% | 10,7% | 13,6% |
| plano-desativado | 1440 | claro |  | 45,4% | 51,3% | 51,7% | 4,6% | 65,7% | 60,3% | 11,5% | 12,8% | 11,3% | 15,8% |
| beneficio-conceder | 1440 | claro |  | 10,6% | 19,0% | 16,5% | 3,5% | 3,2% | 23,4% | 17,4% | 17,8% | 11,0% | 17,5% |
| beneficio-substituir | 1440 | claro |  | 56,4% | 61,2% | 62,9% | 2,6% | 98,1% | 71,2% | 13,1% | 14,2% | 10,0% | 17,8% |
| beneficio-encerrar | 1440 | claro |  | 0,7% | 7,2% | 5,2% | 3,6% | 3,2% | 8,2% | 12,4% | 11,5% | 11,6% | 11,5% |
| cobranca-avulsa | 1440 | claro |  | 66,2% | 71,5% | 71,0% | 2,4% | 97,3% | 84,4% | 15,1% | 14,2% | 9,6% | 12,8% |
| cobranca-antecipar | 1440 | claro |  | 63,4% | 71,4% | 70,4% | 2,4% | 97,3% | 84,4% | 14,2% | 15,6% | 9,6% | 12,8% |
| notificacoes | 1440 | claro |  | 3,1% | 17,7% | 16,9% | 9,4% | 8,8% | 20,1% | 21,1% | 27,5% | 13,6% | 11,9% |
| cobranca-cancelar | 1440 | claro |  | 70,6% | 73,1% | 73,8% | 2,9% | 96,4% | 86,5% | 16,0% | 18,8% | 6,0% | 21,5% |
| cobranca-painel | 1440 | claro |  | 45,5% | 49,9% | 50,1% | 4,0% | 66,1% | 58,6% | 17,2% | 21,1% | 9,9% | 18,8% |
| cobranca-registrar | 1440 | claro |  | 59,9% | 64,8% | 65,1% | 2,9% | 96,4% | 75,8% | 18,5% | 21,4% | 6,0% | 21,5% |
| cobranca-renegociar | 1440 | claro |  | 56,5% | 59,8% | 60,1% | 2,9% | 96,4% | 69,5% | 17,7% | 20,2% | 6,0% | 21,5% |
| aluno-encerrar-modalidade | 1440 | claro |  | 51,2% | 56,1% | 57,0% | 1,3% | 98,2% | 64,9% | 16,5% | 18,6% | 5,0% | 11,8% |
| aluno-trocar-turma | 1440 | claro |  | 58,3% | 62,0% | 62,6% | 1,3% | 98,2% | 72,5% | 16,7% | 18,6% | 5,0% | 11,8% |
| aluno-trocar-plano | 1440 | claro |  | 62,0% | 67,0% | 67,4% | 1,3% | 98,2% | 78,9% | 15,8% | 18,9% | 5,0% | 11,8% |
| aluno-transferir-modalidade | 1440 | claro |  | 58,3% | 62,7% | 63,5% | 1,3% | 98,2% | 73,4% | 17,3% | 18,8% | 5,0% | 11,8% |
| aluno-desligar-responsavel | 1440 | claro |  | 65,5% | 68,8% | 69,8% | 1,3% | 98,3% | 81,2% | 16,1% | 18,7% | 5,0% | 12,1% |
| inicio-professor | 1440 | claro |  | 1,5% | 6,5% | 6,3% | 4,8% | 6,7% | 6,8% | 9,5% | 13,0% | 7,1% | 10,6% |
| matricula-aluno | 1440 | claro |  | 1,0% | 8,0% | 6,2% | 10,2% | 9,0% | 7,4% | 18,8% | 14,8% | 13,9% | 12,6% |
| matricula-modalidades | 1440 | claro |  | 2,6% | 10,0% | 8,5% | 10,2% | 9,0% | 10,0% | 11,6% | 13,1% | 13,9% | 12,6% |
| matricula-vencimento | 1440 | claro |  | 2,0% | 10,0% | 7,8% | 9,9% | 9,0% | 10,1% | 12,1% | 15,8% | 13,0% | 12,6% |
| matricula-resumo | 1440 | claro |  | 3,8% | 11,9% | 10,7% | 10,2% | 9,0% | 12,4% | 11,6% | 13,1% | 13,9% | 12,6% |
| matricula-concluida | 1440 | claro |  | 4,7% | 10,0% | 9,6% | 10,2% | 9,0% | 10,0% | 11,3% | 13,8% | 13,9% | 12,6% |
| conta-aluno-pagina | 1440 | claro |  | 0,6% | 6,6% | 4,9% | 7,3% | 14,4% | 5,9% | 9,7% | 11,9% | 9,2% | 11,1% |
| conta-aluno-pagina | 390 | claro |  | 2,9% | 14,9% | 16,1% | - | 16,1% | 14,8% | 23,1% | 22,9% | - | 12,5% |
| portal-editar-contato | 390 | claro |  | 14,0% | 20,4% | 21,5% | - | 87,0% | 14,9% | 24,7% | 20,7% | - | 24,7% |
| portal-familia | 1440 | claro |  | 3,1% | 9,0% | 7,5% | 7,5% | 14,4% | 9,0% | 10,8% | 15,3% | 7,7% | 11,6% |
| portal-familia | 390 | claro |  | 10,8% | 21,1% | 19,9% | - | 15,6% | 21,6% | 21,6% | 26,9% | - | 12,5% |
| portal-reduzido-info | 1440 | claro |  | 1,0% | 8,5% | 6,7% | 8,0% | 11,0% | 8,4% | 11,3% | 14,2% | 9,6% | 8,3% |
| agenda-painel-professor | 1440 | claro |  | 4,3% | 12,2% | 12,4% | 4,1% | 14,8% | 13,7% | 11,8% | 15,4% | 8,5% | 13,6% |
| ficha-professor | 1440 | claro |  | 41,9% | 46,7% | 46,9% | 3,1% | 60,6% | 55,1% | 9,0% | 11,7% | 6,9% | 13,6% |
| ficha-aluno | 1440 | claro | sim | 36,4% | 42,5% | 42,8% | 3,7% | 56,5% | 49,9% | 16,4% | 19,1% | 10,0% | 17,6% |
| aluno-editar | 1440 | claro |  | 51,9% | 56,4% | 58,0% | 1,3% | 98,2% | 65,3% | 19,2% | 20,7% | 5,0% | 11,8% |
| ficha-aluno-matricula | 1440 | claro |  | 37,0% | 43,4% | 43,6% | 3,7% | 56,5% | 51,0% | 17,8% | 21,7% | 10,0% | 17,6% |
| ficha-aluno-financeiro | 1440 | claro |  | 37,1% | 42,6% | 43,4% | 3,7% | 56,5% | 49,9% | 16,3% | 19,1% | 10,0% | 17,6% |
| ficha-aluno-graduacoes | 1440 | claro |  | 35,8% | 40,9% | 41,4% | 3,7% | 56,5% | 47,8% | 15,0% | 17,5% | 10,0% | 17,6% |
| ficha-aluno-responsaveis | 1440 | claro |  | 36,8% | 43,6% | 43,8% | 3,7% | 56,3% | 51,3% | 15,1% | 17,6% | 10,0% | 18,2% |
| ficha-aluno-historico | 1440 | claro |  | 35,6% | 41,0% | 41,5% | 3,7% | 56,5% | 47,9% | 15,1% | 17,8% | 10,0% | 17,6% |
