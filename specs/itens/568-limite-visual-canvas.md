# 568 — Técnica · Avaliar se o limite padrão do visual:canvas está frouxo demais

Origem: issue #568 (origem: PR #565, item #475) e o acréscimo do dono de 25/11/2026 (na #710). Branch: `item/568-limite-visual-canvas`.

## 1. Objetivo

Medir se o critério do `npm run visual:canvas` (blocos de 32 px, cor média, 30% de blocos diferentes) separa telas com divergência de telas corretas, e registrar o resultado. Hoje ele aprova 165 de 165 casos; `turma-painel` mede 0,8%, `turmas` 1,0% e `configuracoes-organizacao` 3,8%, mesmo com as diferenças achadas à mão. A medição (feita na construção, ver "Construção") mostra que nenhum critério por imagem separa esses casos dos demais enquanto o menu e o cabeçalho do sistema diferirem do canvas em quase toda tela. Por decisão do dono (P5, caminho 3), a #568 entrega agora **o relatório da medição e a decisão "30% mantido por ora"**; a moldura é corrigida pelas #624 (menu) e #646 (cabeçalhos), e a recalibração e a remoção da regra temporária são da #714.

Fora do escopo: mudar o critério, `comparar.mjs`, `casos.ts` (`limiteCanvas`), o `AGENTS.md` (a regra temporária continua valendo) e as referências; corrigir telas; abrir issues novas (a #714 já existe).

## 2. Requisitos

- R1: um relatório em `docs/auditoria/` traz, para cada caso comparado (165 hoje), a diferença medida pelo critério atual e pelos candidatos (bloco menor, por região, por borda), e lista os casos de divergência conhecida que hoje passam (`turma-painel`, `turmas`, `ficha-aluno`, `configuracoes-organizacao`).
- R2: o relatório mostra, com números, que nenhum candidato abre folga entre os casos de divergência conhecida e os demais, e diz por quê (menu e cabeçalho do sistema diferem do canvas em quase toda tela; não há lista de telas "corretas").
- R3: o relatório e a descrição do PR registram a decisão "30% mantido por ora", com o motivo (D1).
- R4: nada no critério muda: `npm run visual:canvas -- --exige` continua saindo 0 e a regra temporária do `AGENTS.md` continua valendo (D2).
- R5: o relatório aponta as issues que seguem a decisão: #624 e #646 (corrigem a moldura) e #714 (recalibra o critério e remove a regra temporária, com o relatório como base); no `specs/backlog.md`, #624 e #646 vêm logo depois da #568 e a #714 entra na Sprint 10.5 depois delas, com dependências #624, #646 e #568 (D3).
- R6: removido (a #714 remove a regra temporária; `AGENTS.md` e `frontend/README.md` não mudam aqui).
- R7: removido (não há critério novo para testar).

## 3. Critérios de aceite

- CA1 (R1): dado o relatório `docs/auditoria/568-medicao-visual-canvas.md`, quando se abre, então há uma linha por caso e variante (tela, largura, tema) com a diferença atual e a de cada candidato, e uma seção com os casos de divergência conhecida que passavam.
- CA2 (R2): dado o relatório, quando se lê a seção "Resultado", então ela traz, por candidato, os valores dos casos conhecidos e quantos dos demais casos medem o mesmo ou mais, e conclui que nenhum separa os dois grupos.
- CA3 (R3): dado o relatório e a descrição do PR, quando se leem, então ambos dizem "30% mantido por ora" e o motivo.
- CA4 (R4): dado o repositório sem mudança em `frontend/visual/` e em `AGENTS.md`, quando roda `npm run visual:canvas -- --exige` de dentro de `frontend/`, então sai 0 (165 comparadas, 0 reprovadas).
- CA5 (R5): dado o relatório, quando se lê "Próximos passos", então cita #624, #646 e #714 (`gh issue view 714` mostra o marco da Sprint 10.5); e o `specs/backlog.md` traz #624 e #646 logo depois da #568 e a #714 depois delas, com dependências #624, #646 e #568.
- CA6 (R4): dado o `AGENTS.md`, quando se lê, então a "Regra temporária (até a #568 ser concluída...)" ainda existe; quem a remove é a #714 (D2).

## 4. Plano técnico

- Dados, API e interface: não mudam. Segurança: não se aplica; o relatório usa só nomes de casos e números.
- Arquivos:
  - a criar: `docs/auditoria/568-medicao-visual-canvas.md` (relatório: tabela por caso e variante, "Resultado" por candidato, casos conhecidos, "Decisão", "Próximos passos"); um script de medição descartável no scratchpad (não entra no repositório), o mesmo da construção, que roda a `diferenca` atual e os candidatos (a) bloco de 8 e 16 px com limiar 25, (b) por região (menu x<240, topo y<64, conteúdo) e (c) máscara de bordas por luminância (bloco 8 e 16, gradiente 12) sobre `visual/referencias` x `docs/design/prints`.
  - a alterar: `specs/backlog.md` (situação da #568, P5 decidida e fora da tabela, linhas #624, #646 e #714 na ordem).
  - não mudam: `frontend/visual/comparar.mjs`, `frontend/scripts/visual-canvas.mjs`, `frontend/visual/casos.ts`, `AGENTS.md`, `frontend/README.md`.
- Reuso: `resultado.json` do `visual:canvas`, capturas e referências existentes.
- Riscos: relatório longo (165 linhas); mitigação: tabela compacta, uma linha por caso e variante. Os números dependem das referências atuais (regeradas na #710); o relatório registra a data e o commit.

## 5. Tarefas

- [x] T1: rodar `npm run visual:canvas` (resultado atual) e o script descartável com os candidatos (a), (b) e (c) sobre os 165 casos; guardar a tabela por caso — cobre CA1, CA2 — prova: tabela completa, com os quatro casos conhecidos marcados
- [x] T2: escrever `docs/auditoria/568-medicao-visual-canvas.md` com a tabela, o "Resultado" (por candidato: conhecidos x demais), a "Decisão" (30% mantido por ora e o motivo) e os "Próximos passos" (#624, #646, #714) — cobre CA1, CA2, CA3, CA5 — prova: conferência do arquivo (tabela, resultado, decisão, próximos passos)
- [x] T3: ajustar `specs/backlog.md`: P5 decidida (sai da tabela; "Último número usado" fica), #624 e #646 logo depois da #568, #714 na Sprint 10.5 depois deles com dependências #624, #646 e #568 — cobre CA5 — prova: `grep -n "^| \(568\|624\|646\|714\) " specs/backlog.md` na ordem esperada
- [x] T4: conferir que nenhum critério mudou — cobre CA4, CA6 — prova: `cd frontend && npm run visual:canvas -- --exige` sai 0; `git diff --stat` sem `frontend/visual` nem `AGENTS.md`; `grep -n "Regra temporária" AGENTS.md` ainda acha a regra
- Item só de documentação: lint, typecheck, build e testes do front não se aplicam (nada de código muda).

## 6. Decisões

- D1 (muda o comportamento; decisão do dono, P5, caminho 3): o limite padrão fica em 30% por ora. Motivo: menu e cabeçalho do sistema diferem do canvas em quase toda tela; sem tirar esse ruído, qualquer limite que reprove `turmas` reprova cerca de 2/3 dos 165 casos, a maioria sem divergência real. Alternativas descartadas pelo dono: comparação estrutural por DOM/regiões (muda o mecanismo e o teste visual) e manter a conferência à mão para sempre.
- D2 (muda o comportamento): a regra temporária de conferência lado a lado continua valendo até a #714, que a remove junto com a recalibração do critério e a revisão da Autonomia 4. Motivo: sem critério novo, a conferência à mão é a única barreira para divergência visual. O D2 anterior (lista de telas "corretas" como ground truth) fica removido: não há lista confiável e, sem critério novo, ela não é necessária.
- D3: a correção da moldura são as issues já existentes #624 (menu) e #646 (cabeçalhos), sem issue nova; nenhuma depende de issue aberta e ambas vão logo depois da #568. A #714 "Técnica: recalibrar o critério do visual:canvas depois da moldura" (Sprint 10.5; dependências #624, #646 e #568; o relatório da #568 é a base) já foi criada pelo dono e entra no backlog depois delas. Os `limiteCanvas` novos e as issues por tela (antigo D3) ficam para a #714.
- D4 (anterior): removida. Valia para o critério novo; a #714 decide se o método varia por variante (1440 claro, 1440 escuro, 390).
- D5 (resolvida, P5): o dono respondeu em 25/11/2026 pelo caminho 3 (usando as issues existentes). R2, R4, R5, CA2, CA4, CA5 e D2 foram reescritos para o escopo "relatório e decisão"; por consequência, o objetivo, R6, R7, CA6 a CA8, D1, D3, D4 e as tarefas saíram ou foram refeitos, sem renumerar o que sobrou.
- Suposição: as referências em `visual/referencias` e os prints do canvas em `docs/design/prints` estão atualizados (a #710 as regerou). Se estiverem velhos, os números do relatório mudam, mas não a decisão.

## Construção

- T1 (parcial, não marcada) — script descartável fora do repositório (scratchpad) rodou o critério atual e os candidatos (a) bloco de 8 e 16 px com limiar 25, (b) por região (menu x<240, topo y<64, conteúdo) e (c) máscara de bordas por luminância (bloco 8 e 16, gradiente 12) sobre os 165 casos de `visual/referencias` x `docs/design/prints`. `npm run visual:canvas` hoje: 165 comparadas, 0 reprovadas, 12,7 s. Nada foi alterado no repositório.
- Medição (1440 claro, 141 casos; três conhecidos com 1440: `turma-painel`, `turmas`, `configuracoes-organizacao`; `ficha-aluno` já tem `limiteCanvas` 0,40 e mede 36,4%):
  - atual: conhecidos 0,8% / 1,0% / 3,8%; 122 dos 138 outros casos medem mais que o menor conhecido.
  - (a) bloco 8: conhecidos 8,4% / 9,3% / 12,3%; 90 de 138 outros medem mais que o menor. Bloco 16: 89 de 138.
  - (b) por região: menu dos conhecidos 6,2% / 9,8% / 13,4% (outros 0 a 13,9%, 67 de 138 acima do menor); topo 8,3% / 9,1% / 20,1% (85 de 138 acima); conteúdo 8,1% / 9,2% / 12,3% (98 de 138 acima).
  - (c) bordas: bloco 8 conhecidos 11,0% / 13,8% / 16,6% (85 de 138 acima do menor); bloco 16: 14,8% / 18,6% / 18,2% (61 de 138 acima).
  - Nenhum candidato abre folga entre os conhecidos e os demais: os conhecidos ficam no meio da distribuição (todas as telas do sistema medem de 3% a 20% nos candidatos finos, porque o menu lateral e o cabeçalho do sistema diferem do canvas em quase toda tela, e os dados do MSW diferem em todas). Um limite que reprove `turmas` (8,4% no candidato a) reprovaria cerca de 2/3 dos 165 casos, a maioria sem ground truth de "errada".
  - Conferidos lado a lado (D2): não há lista confiável. O arquivo `specs/itens/477` mostra que a afirmação "a estrutura confere lado a lado" de itens anteriores foi desmentida pelas capturas; a única lista possível seria a dos 48 `Visual do CI` que passaram, que mede o teste visual do sistema e não a conferência com o canvas.
- Diferença visual de `turmas` (aberta lado a lado): o canvas traz a tabela dentro de um cartão com borda, outros itens de menu (Aulas experimentais, Graduações), linhas e cabeçalho deslocados de 10 a 20 px e outra altura de linha. São deslocamentos pequenos que a comparação por pixels, blocos ou bordas confunde com a diferença de dados do MSW.

Pedido de ajuste: R2 e CA2 (e, por consequência, R4, R5, CA4, CA5 e D2). Os quatro casos conhecidos não se separam dos demais por nenhum critério de pixel, bloco, região ou borda medido (candidatos a, b e c do plano técnico), porque a divergência real é de layout fino (menu, cartão da tabela, espaçamento) e o menu e o topo do sistema diferem do canvas em quase todas as telas; a calibração também não tem ground truth de "tela correta" (D2 sem lista). O que o código mostra: com o critério mais estrutural, os conhecidos medem 11% a 17% e 85 dos 138 outros casos medem o mesmo ou mais. Opções para a fase 2 decidir: (1) trocar o critério por comparação de estrutura do DOM/regiões (por exemplo, posição e tamanho de blocos nomeados da moldura medidos no teste visual) em vez de pixels; (2) manter o limite e a conferência lado a lado à mão, e mudar a #568 para só registrar a medição (sem remover a regra temporária); (3) primeiro corrigir o menu e o cabeçalho (issue de moldura da Sprint 10.5) e só depois recalibrar o critério por pixel, quando o ruído sistêmico sair.

Tarefas: nenhuma marcada.

## Ajuste da especificação (fase 2)

- 25/11/2026: pendência P5 respondida pelo dono (caminho 3). Seções 1 a 6 reescritas para o escopo "relatório da medição e decisão 30% mantido por ora" (D1 a D5). T1 a T4 por marcar; a medição parcial da construção serve de base para o relatório. A #714 lê a medição em `docs/auditoria/568-medicao-visual-canvas.md` e na seção "Construção" deste arquivo.

### Construção após o ajuste (fase 2)

- T1 — arquivos: nenhum no repositório (script descartável no scratchpad) — prova: medição dos 165 casos e variantes, 4 conhecidos marcados (`turma-painel`, `turmas`, `ficha-aluno`, `configuracoes-organizacao`) → tabela completa gerada. Os números do "Resultado" do relatório contam todas as 161 variantes fora dos conhecidos (a medição parcial acima contava só 1440 claro).
- T2 — arquivos: `docs/auditoria/568-medicao-visual-canvas.md` — prova: conferência do arquivo (decisão "30% mantido por ora", critérios, resultado por candidato, próximos passos #624, #646, #714, tabela de 165 linhas) → ok.
- T3 — arquivos: `specs/backlog.md` (já ajustado na fase 2) — prova: `grep -n "^| \(568\|624\|646\|714\) " specs/backlog.md` → linhas 227 a 230 na ordem 568, 624, 646, 714; #714 com dependências #624, #646, #568; P5 fora da tabela; `gh issue view 714` → Sprint 10.5.
- T4 — prova: `cd frontend && npm run visual:canvas -- --exige` → 165 comparadas, 0 reprovadas; `git status` sem `frontend/visual` nem `AGENTS.md`; `grep -n "Regra temporária" AGENTS.md` → linha 82.
Regressão: item só de documentação; lint, typecheck, build, testes e visual do front não se aplicam. Regressão local: 5 min. Comparação com o canvas: não se aplica (sem tela).
Desvios: nenhum. Referências visuais: nenhuma regerada.

## Verificação

### Rodada 1 — OK — 25/11/2026, estado f10ed71956bfec91cc897390384c3041499aeae9

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | relatório tem 165 linhas de tabela por caso e variante, com os 4 conhecidos marcados "sim" (turmas, configuracoes-organizacao, turma-painel, ficha-aluno) |
| CA2 | PASSOU | seção "Resultado": por candidato, valores dos conhecidos, "Demais >= menor" e "Demais >= maior", e conclusão "nenhum candidato separa os dois grupos" |
| CA3 | PASSOU (relatório); descrição do PR ainda não existe | relatório, seção "Decisão": "30% mantido por ora" com motivo; a fase de entrega deve repetir na descrição do PR |
| CA4 | PASSOU | `npm run visual:canvas -- --exige` em frontend/: 165 comparadas, 0 reprovadas, saída 0 |
| CA5 | PASSOU | "Próximos passos" cita #624, #646, #714; backlog: 568, 624, 646, 714 em sequência, #714 com dependências #624, #646, #568; `gh issue view 714` marco "Sprint 10.5 · Identidade visual" |
| CA6 | PASSOU | `grep -n "Regra temporária" AGENTS.md` acha a linha 82; AGENTS.md e frontend/visual fora do diff |

Comandos: git status (só specs/backlog.md, o relatório e este arquivo); visual:canvas --exige (saída 0); grep da regra temporária; gh issue view 714. Lint, typecheck, build, testes e visual do front não se aplicam (item só de documentação, sem código nem tela).
Achados:
- sugestão, docs — a descrição do PR deve trazer "30% mantido por ora" e o motivo (CA3), na fase de entrega.
Instáveis: nenhum.

## Entrega

- O que muda: nenhum código nem tela. Entram o relatório `docs/auditoria/568-medicao-visual-canvas.md` (medição dos 165 casos de `visual/referencias` x `docs/design/prints`, com os 4 conhecidos marcados) e a decisão de manter o limite padrão do `visual:canvas` em 30% por ora. No backlog, #568 vira feita; #624 e #646 vêm logo depois; #714 entra na Sprint 10.5 com dependências #624, #646 e #568.
- Verificação: rodada 1 OK (estado f10ed71956bfec91cc897390384c3041499aeae9); desde então mudou só este arquivo e o backlog. `npm run visual:canvas -- --exige` deu 165 comparadas, 0 reprovadas.
- Decisão (D1): limite padrão fica em 30% por ora. Motivo: o menu e o cabeçalho do sistema diferem do canvas em quase toda tela, e nenhum candidato de limite (bloco, região ou bordas) separa os 4 casos conhecidos dos demais. Descartadas: comparação estrutural por DOM (muda o mecanismo) e conferência à mão para sempre.
- Regra temporária (D2): a conferência lado a lado com o canvas continua valendo até a #714, que a remove junto com a recalibração do critério e a revisão da Autonomia 4 do `AGENTS.md`.
- Limitações: lint, typecheck, build e testes do front não se aplicam (item só de documentação). Comparação com o canvas: não se aplica (sem tela). Regressão local: 5 min. Nada foi rodado de novo na entrega: a base (`dev`) não avançou desde a verificação.
- Para a descrição do PR: "30% mantido por ora" e o motivo acima (CA3).
