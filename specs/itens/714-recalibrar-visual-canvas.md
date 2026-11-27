# 714 — Técnica · Recalibrar o critério do visual:canvas depois da moldura

Origem: issue #714 (base: relatório da #568, `docs/auditoria/568-medicao-visual-canvas.md`). Branch: `item/714-recalibrar-visual-canvas`.
Tempos: especificar 9 (2 rodadas) · construir 7 · verificar 22 (regressão 18; 2 rodadas) · entregar 5 (estimativa; hora inicial não anotada)

## 1. Objetivo

Recalibrar o critério do `npm run visual:canvas` depois do menu (#624) e dos cabeçalhos (#646): ele passa a ser rede de erro grosseiro e de regressão (P12, D1), com limite padrão menor e exceções justas por largura. Remover do `AGENTS.md` a regra temporária de conferência à mão e rever a Autonomia 4. Serve a quem constrói e verifica item de tela.

Fora do escopo: corrigir telas (as divergências do painel e da tabela de turmas são as #566 e #567; as demais, as issues citadas em cada `limiteCanvas`); trocar o mecanismo por comparação de DOM (descartado na P5); mudar a métrica (bloco 32, limiar 40); regerar referências; ligar `--exige` no CI (continua relatório).

### Relatório da nova medição

Medição de 26/11/2026 (base `dev` b05c617b; script descartável fora do repositório; 165 variantes; critério atual: 0 reprovadas). Valores em % de blocos diferentes. Os "demais" são as 161 variantes fora dos quatro casos conhecidos; os conhecidos são medidos a 1440 claro.

| Candidato | turmas | turma-painel | configuracoes-organizacao | ficha-aluno | Demais que medem o mesmo ou mais que o menor conhecido (entre parênteses, só os sem `limiteCanvas`) |
|---|---|---|---|---|---|
| atual (bloco 32) | 1,3 | 0,8 | 4,0 | 36,3 | 150 (106) |
| bloco 8 | 9,0 | 9,5 | 11,6 | 42,6 | 111 (68) |
| bloco 16 | 7,2 | 7,3 | 9,3 | 42,8 | 117 (75) |
| região: menu (só 1440) | 9,3 | 5,8 | 12,1 | 3,8 | 93 de 139 (83) |
| região: topo (só 1440) | 8,3 | 20,1 | 9,1 | 56,5 | 85 de 139 (51) |
| região: conteúdo (só 1440) | 9,0 | 9,5 | 11,7 | 49,9 | 93 de 139 (53) |
| bordas, bloco 8 | 24,6 | 26,6 | 32,0 | 36,9 | 100 (65) |
| bordas, bloco 16 | 33,9 | 35,8 | 44,0 | 50,4 | 97 (61) |

- Nenhum candidato separa os dois grupos, como na #568. O que sobra de diferença nas imagens lado a lado (`turmas` e `turma-painel`, abertas) são dados diferentes (academia, unidade, linhas, itens de menu) e diferença fina de layout (cartão e cabeçalho da tabela, colunas do painel, ícones). A primeira pesa mais na medida que a segunda.
- No critério atual, sem `limiteCanvas`, o maior valor é 20,6% (`sem-acesso` 390), depois 18,5% (`portal-carteirinha` 390) e 14,7% (`turma-nova` 1440). Há 41 casos com `limiteCanvas` (corrigido na retomada; a primeira contagem dizia 45).
- Há limite frouxo de fato: `limiteCanvas` vale para todas as larguras do caso (`portal-pix-chave` 390 mede 15,4% com limite 70%; `portal-confirmar-modalidade` 1440 mede 5,1% com limite 50%), e 20 variantes têm folga acima de 5 pontos.
- A regra permanente "Canvas e decisões do dono" do `AGENTS.md` já manda o verificador abrir as capturas e comparar. Remover a regra temporária não acaba com a comparação à mão; só deixa de proibir, por escrito, a aprovação apenas pelo limite.

Retomada (26/11/2026, mesma base): `npm run visual:canvas` deu 165 comparadas e 0 reprovadas. A 15%, passam do padrão 44 variantes: 42 são dos 41 casos que já têm `limiteCanvas` (todos têm ao menos uma largura acima; só `portal-pix-chave` tem as duas, 1440 com 66,3% e 390 com 15,4%), mais `sem-acesso` 390 (20,6%) e `portal-carteirinha` 390 (18,5%). Nenhuma é do tema escuro. A mais próxima por baixo é `turma-nova` 1440 (14,7%).

## 2. Requisitos

- R1: o arquivo do item traz o relatório da nova medição, com os candidatos (bloco menor, região, bordas) e a conclusão (seção 1).
- R2: o limite padrão do `visual:canvas` passa de 30% para 15% (D1).
- R3: `limiteCanvas` vale por largura (1440 ou 390); a largura sem valor usa o padrão (D1, D2).
- R4: só tem `limiteCanvas` a largura que mede mais de 15%, com valor no máximo 3 pontos acima do medido, motivo e uma issue aberta que o remove (D1, D3, D4).
- R5: `npm run visual:canvas -- --exige` passa com o critério novo, sem variante aprovada só por limite frouxo.
- R6: o `AGENTS.md` deixa de ter a regra temporária; a regra permanente "Canvas e decisões do dono" não muda (D1).
- R7: a Autonomia 4 do `AGENTS.md` descreve o critério novo (D1, D5).

## 3. Critérios de aceite

- CA1 (R1): dado o arquivo do item, quando se lê "Relatório da nova medição", então há os valores de cada candidato para os quatro casos conhecidos, quantos dos demais medem o mesmo ou mais, e a conclusão de que nenhum separa os grupos.
- CA2 (R2): dado um caso sem `limiteCanvas`, quando se chama `limiteDoCaso(caso, 1440)` ou `limiteDoCaso(caso, 390)`, então devolve 0,15.
- CA3 (R3): dado um caso com valor só em 390, quando se chama `limiteDoCaso`, então 390 devolve esse valor e 1440 devolve 0,15.
- CA4 (R3, R4): dado um `limiteCanvas` sem nenhuma largura, com valor menor ou igual a 0,15 ou maior que 1, sem `#<número>` no motivo, ou em largura que o caso não compara (390 sem `canvasCelular`; 1440 sem `canvas`), quando roda `casos.test.ts`, então o teste reprova.
- CA5 (R5): dadas as referências commitadas, quando roda `npm run visual:canvas -- --exige` em `frontend/`, então sai 0, com 165 comparadas e 0 reprovadas.
- CA6 (R4, R5): dado o `resultado.json` dessa execução, quando roda o comando de prova da T2, então toda variante com limite diferente de 0,15 mede mais de 0,15 e tem `limite - diferenca <= 0.03` (esperado: 44 variantes, nenhuma frouxa).
- CA7 (R4): dada cada issue citada como a que remove um `limiteCanvas`, quando se roda `gh issue view <N>`, então ela está aberta e o "Pronto quando" dela pede esses casos (ou a largura) passando no limite padrão, sem `limiteCanvas`.
- CA8 (R6): dado o `AGENTS.md`, quando se lê, então não existe a "Regra temporária" de conferência lado a lado, e a regra "Canvas e decisões do dono" continua igual.
- CA9 (R7): dado o `AGENTS.md`, quando se lê a Autonomia 4, então ela traz o texto da seção 4.

## 4. Plano técnico

- Dados e API: não mudam. Interface do produto: não muda; nenhuma referência visual é regerada. Segurança: o repositório é público; as issues novas levam só nomes de casos e dados fictícios.
- Arquivos (todos vistos no repositório):
  - `frontend/visual/comparar.mjs`: `LIMITE_PADRAO = 0.15` (e o comentário, citando a #714 e o papel de rede de erro grosseiro); `limiteDoCaso = (c, largura) => c.limiteCanvas?.[largura] ?? LIMITE_PADRAO`.
  - `frontend/scripts/visual-canvas.mjs`: o cálculo `limiteDoCaso(c, largura)` passa para dentro do laço de `variantes` (hoje é feito uma vez por caso).
  - `frontend/visual/casos.ts`: o tipo vira `limiteCanvas?: { 1440?: number; 390?: number; motivo: string };`, **mantendo o comentário no fim da linha** (`carregarCasos` corta o tipo `Caso` no primeiro `};` seguido de quebra de linha); os 41 casos trocam `valor` pela largura; `sem-acesso` e `portal-carteirinha` ganham a entrada de 390.
  - `frontend/visual/comparar.test.ts`: o teste de `limiteDoCaso` cobre CA2 e CA3. `frontend/visual/casos.test.ts`: o teste "limiteCanvas traz valor entre 0 e 1 e motivo" passa a cobrir CA4.
  - `frontend/README.md`, item "Comparação automática com o canvas (#435)": 15%, formato por largura, folga de até 3 pontos, issue obrigatória, e que passar não prova fidelidade.
  - `AGENTS.md`: apagar o marcador "Regra temporária (até a #714 ser concluída...)" e trocar o item 4 de "Autonomia" por:

    > 4. Divergência com o canvas que outra issue vai resolver. O `visual:canvas` é rede de erro grosseiro e de regressão (limite padrão de 15%): passar nele não prova fidelidade, que o verificador confere nas capturas (regra "Canvas e decisões do dono"). Se a largura passa do padrão, usar `limiteCanvas` só nela, com valor até 3 pontos acima do medido, motivo e a issue que o remove, e acrescentar a remoção no "Pronto quando" dela. Se passa no padrão, não usar `limiteCanvas`: basta a issue com a correção e, no "Pronto quando" dela, uma verificação que não dependa do `visual:canvas`. Nos dois casos, citar a issue no PR e no arquivo do item.

  - `specs/backlog.md`: linhas das issues novas da T3, conforme o marco delas.
  - `.github/workflows/ci.yml` não muda.
- Valores: medir de novo antes de gravar; valor = `(Math.ceil(diferenca * 100) + 1) / 100` (folga de 1 a 2 pontos, dentro dos 3) (D2).
- Motivos: os dos 41 casos são mantidos, tirando menção ao limite padrão antigo e ajustando o que não valer para a largura. A issue que remove precisa estar aberta; item fechado pode ser citado como origem, não como removedor.
  - Já têm removedora aberta: #553, #556, #558, #560, #573, #577, #601, #622 (as duas larguras de `portal-pix-chave`), #642, #674.
  - Não têm (12 casos): `ficha-aluno`, `aluno-editar`, `ficha-aluno-matricula`, `ficha-aluno-financeiro`, `ficha-aluno-graduacoes`, `ficha-aluno-responsaveis`, `ficha-aluno-historico`, `aluno-encerrar-modalidade`, `aluno-trocar-turma`, `aluno-trocar-plano`, `aluno-transferir-modalidade`, `aluno-desligar-responsavel`. Uma issue nova para os doze (D3).
  - `sem-acesso` 390 (visto nas imagens): o canvas `SemAcessoM` é tela cheia sem moldura, com a marca no topo e a linha de suporte; o sistema mostra o cartão dentro da moldura, com o botão "Ver minhas turmas". Uma issue nova (D3).
  - `portal-carteirinha` 390 (visto nas imagens): dados do MSW diferentes (academia, aluno, unidades, faixas), logo no topo do cartão, botão "Baixar imagem" com "Em breve" e "feito com ctcore" em outro lugar. Uma issue nova (D3).
- Issues novas: marco "Atualizações · Polimento", etiqueta `front-end`, com "Pronto quando": os casos (e larguras) sem `limiteCanvas`, `npm run visual:canvas -- --exige` passando no limite padrão e uma conferência nas capturas, que não dependa do comando; onde a regra (RNF-56, especificação, "Em breve") vence o canvas, a issue o diz. Antes de criar, procurar de novo issue aberta do mesmo assunto (nas buscas desta especificação não havia).
- Reuso: `diferenca`, `carregarCasos`, `resultado.json` e as referências commitadas; nenhum código novo para a prova da folga (D6).
- Riscos: com folga curta, mudança legítima de tela ou de moldura (ex.: #625, #626) pode fazer uma variante passar do limite: aparece no `visual:canvas` do item (no CI é só relatório) e o item ajusta pela Autonomia 4. `turma-nova` 1440 (14,7%) e `portal-editar-contato` 390 (14,0%) ficam perto do padrão. Os prints do canvas são gerados na máquina e podem variar um pouco entre ambientes. As issues #553, #558 e #560 dizem "passando a 30%", e o padrão novo é mais exigente: a T3 deixa um comentário em cada uma avisando que vale o de 15%.

## 5. Tarefas

- [x] T1: padrão de 15% e `limiteDoCaso` por largura em `comparar.mjs` e `visual-canvas.mjs`, tipo em `casos.ts` e os dois testes — cobre CA2, CA3, CA4 — prova (verde só depois da T2): `cd frontend && npx vitest run visual/comparar.test.ts visual/casos.test.ts`
- [x] T2: medir de novo, converter os 41 casos para o formato por largura, incluir `sem-acesso` e `portal-carteirinha` em 390 e copiar para `.capturas/714/`, de `docs/design/prints/lado-a-lado/`, os pares de `sem-acesso`, `portal-carteirinha` e `portal-pix-chave` a 390 (`<tela>-390-sistema.png` e `<tela>-390-canvas.png`) — cobre CA5, CA6 — prova, em `frontend/`: `npm run visual:canvas -- --exige && node -e 'const r=require("../docs/design/prints/lado-a-lado/resultado.json");const l=r.filter(x=>x.limite!==0.15);const f=l.filter(x=>!(x.diferenca>0.15&&x.limite-x.diferenca<=0.03));console.log(r.length,l.length,f);process.exit(f.length?1:0)'`
- [x] T3: abrir as três issues novas, citar o número de cada uma nos motivos e no `specs/backlog.md`, conferir que o "Pronto quando" de cada removedora cobre os casos (acrescentar o que faltar) e comentar nas #553, #558 e #560 o padrão novo — cobre CA7 — prova: `gh issue view <N> --json state,milestone,body` de cada removedora e `cd frontend && npx vitest run visual/casos.test.ts`
- [x] T4: no `AGENTS.md`, remover a regra temporária e trocar a Autonomia 4; atualizar o `frontend/README.md` — cobre CA8, CA9 — prova: `grep -n "Regra temporária\|30%\|Autonomia\|limiteCanvas" AGENTS.md frontend/README.md` (sem a regra de conferência à mão nem o limite antigo do `visual:canvas`) e leitura do diff
- [x] T5: conferir o relatório da seção 1 contra a execução da T2 e registrar na seção de construção os valores finais de cada variante com `limiteCanvas` (medido, limite, issue) — cobre CA1 — prova: leitura do arquivo do item

## 6. Decisões

- D1 (decisão do dono, P12, 26/11/2026, opção a; muda o comportamento): o `visual:canvas` passa a ser rede de erro grosseiro e de regressão, sem precisar separar divergência fina, o que substitui o "critério que separa as divergências conhecidas" da issue. Limite padrão de 15%. `limiteCanvas` só para a largura que passa do padrão, até 3 pontos acima do medido, com motivo e issue que o remove (novos: `sem-acesso`, `portal-carteirinha` e `portal-pix-chave`, em 390). A #714 remove a regra temporária e revê a Autonomia 4; a fidelidade fina fica com a regra permanente (o verificador abre e compara as capturas); as divergências conhecidas seguem nas #566 e #567. Alternativas descartadas: manter 30% e só remover a regra; adiar a #714.
- D2: formato `{ 1440?, 390?, motivo }`, o menor que expressa o limite por largura (o tema escuro usa o valor de 1440, como hoje). Valor arredondado para cima ao ponto, mais 1, para absorver variação pequena de renderização. Alternativas: lista de objetos por variante; valor exatamente 3 pontos acima.
- D3: "com motivo e issue que o remove" vale também para os limites antigos. Os 12 casos que citam só item fechado ou um "item de contrato sugerido na #467", nunca criado, ganham uma issue; `sem-acesso` e `portal-carteirinha`, uma cada (telas diferentes). Alternativa descartada: manter sem removedora, o que contraria a P12.
- D4: as issues novas vão para "Atualizações · Polimento", onde estão as outras de "igualar ao canvas sem limiteCanvas" (ex.: #553, #558, #674), e não para "Manutenção · Dívida técnica", porque são ajuste de tela. Não ficam liberadas para o loop.
- D5: a Autonomia 4 deixa de falar em "issue da Sprint 10.5", porque as removedoras já estão em outro marco. A regra do que fazer (com ou sem `limiteCanvas`) continua, com o formato novo.
- D6: a folga de 3 pontos é conferida pelo comando da T2, sem virar regra do script, para o `--exige` não reprovar quem melhorar uma tela. Os testes cobrem só o que não depende dos prints (fora do Git). Alternativa, se as folgas voltarem a crescer: `visual-canvas.mjs` reprovar limite frouxo.
- Suposição: as medidas de 26/11/2026 se repetem na construção. Se a base mudar, vale a medida nova e a contagem de 44 variantes do CA6 muda junto, com registro (variante nova acima de 15% segue D1 e D3).

## Construção

- T1 — arquivos: `frontend/visual/comparar.mjs`, `frontend/scripts/visual-canvas.mjs`, `frontend/visual/casos.ts` (tipo), `frontend/visual/comparar.test.ts`, `frontend/visual/casos.test.ts` — prova (depois da T2): `npx vitest run visual/comparar.test.ts visual/casos.test.ts` → 175 testes, todos passam.
- T2 — arquivos: `frontend/visual/casos.ts` (43 casos: os 41 convertidos, mais `sem-acesso` e `portal-carteirinha` em 390) — prova: `npm run visual:canvas -- --exige` → saiu 0, 165 comparadas, 0 reprovadas; comando da folga → `165 44 []`, saiu 0. Capturas em `.capturas/714/`: `sem-acesso-390-{sistema,canvas}.png`, `portal-carteirinha-390-{sistema,canvas}.png`, `portal-pix-chave-390-{sistema,canvas}.png`.
- T3 — issues novas, marco "Atualizações · Polimento", etiqueta `front-end`: #739 (os doze casos da ficha), #740 (`sem-acesso`), #741 (`portal-carteirinha`); linhas em `specs/backlog.md`. Antes de criar, busca por issues abertas do mesmo assunto: nenhuma. Prova: `gh issue view` das removedoras #553, #556, #558, #560, #573, #577, #601, #622, #642, #674, #739, #740 e #741 → todas abertas, com "Pronto quando"; o das dez antigas já pedia os casos delas sem `limiteCanvas` (nenhum corpo editado). Comentário com o padrão de 15% nas #553, #556, #558 e #560.
- T4 — arquivos: `AGENTS.md` (regra temporária removida, Autonomia 4 com o texto da seção 4), `frontend/README.md` — prova: `grep -n "Regra temporária|30%|Autonomia|limiteCanvas"` → sem a regra temporária e sem "30%"; diff do `AGENTS.md` só nessas duas linhas.
- T5 — conferido contra a execução da T2: `turmas` 1,3, `turma-painel` 0,8, `configuracoes-organizacao` 4,0, `ficha-aluno` 36,3, `turma-nova` 1440 14,7 e `portal-editar-contato` 390 14,0 repetem a seção 1; 44 variantes acima de 15%, nenhuma no tema escuro. Os candidatos descartados (bloco 8 e 16, regiões, bordas) não foram medidos de novo: o script era descartável e a base não mudou.

Valores finais (medido em %, limite em fração, issue que remove):

| Caso | Largura | Medido | Limite | Issue |
|---|---|---|---|---|
| portal-confirmar-modalidade | 390 | 33,9 | 0.35 | #601 |
| portal-pix-chave | 1440 | 66,3 | 0.68 | #622 |
| portal-pix-chave | 390 | 15,4 | 0.17 | #622 |
| portal-carteirinha | 390 | 18,5 | 0.20 | #741 |
| portal-pedido-turma | 390 | 49,9 | 0.51 | #674 |
| portal-pedido-encerrar | 390 | 45,2 | 0.47 | #674 |
| cobrancas-conferencia-janela | 1440 | 56,1 | 0.58 | #573 |
| pedido-recusar | 1440 | 57,7 | 0.59 | #556 |
| pedido-trocar-turma | 1440 | 60,6 | 0.62 | #556 |
| sem-acesso | 390 | 20,6 | 0.22 | #740 |
| conta-aluno | 1440 | 68,1 | 0.70 | #642 |
| professor-inativar | 1440 | 41,5 | 0.43 | #553 |
| professor-modalidade-recusa | 1440 | 51,9 | 0.53 | #553 |
| portal-revogar-imagem | 1440 | 73,8 | 0.75 | #642 |
| agenda-aula-avulsa | 1440 | 49,0 | 0.51 | #560 |
| aula-cancelar | 1440 | 56,0 | 0.57 | #560 |
| aula-editar | 1440 | 53,9 | 0.55 | #560 |
| aula-editar-seguintes | 1440 | 53,5 | 0.55 | #560 |
| aula-corrigir | 1440 | 63,2 | 0.65 | #560 |
| aula-avisar-turma | 1440 | 51,8 | 0.53 | #560 |
| plano-novo | 1440 | 52,7 | 0.54 | #577 |
| plano-editar | 1440 | 43,4 | 0.45 | #577 |
| plano-desativar | 1440 | 61,3 | 0.63 | #577 |
| plano-desativado | 1440 | 45,4 | 0.47 | #577 |
| beneficio-substituir | 1440 | 56,4 | 0.58 | #577 |
| cobranca-avulsa | 1440 | 65,3 | 0.67 | #573 |
| cobranca-antecipar | 1440 | 62,4 | 0.64 | #573 |
| cobranca-cancelar | 1440 | 70,4 | 0.72 | #573 |
| cobranca-painel | 1440 | 45,4 | 0.47 | #573 |
| cobranca-registrar | 1440 | 59,9 | 0.61 | #573 |
| cobranca-renegociar | 1440 | 56,5 | 0.58 | #573 |
| aluno-encerrar-modalidade | 1440 | 51,2 | 0.53 | #739 |
| aluno-trocar-turma | 1440 | 58,3 | 0.60 | #739 |
| aluno-trocar-plano | 1440 | 62,2 | 0.64 | #739 |
| aluno-transferir-modalidade | 1440 | 58,3 | 0.60 | #739 |
| aluno-desligar-responsavel | 1440 | 65,5 | 0.67 | #739 |
| ficha-professor | 1440 | 41,8 | 0.43 | #558 |
| ficha-aluno | 1440 | 36,3 | 0.38 | #739 |
| aluno-editar | 1440 | 51,9 | 0.53 | #739 |
| ficha-aluno-matricula | 1440 | 36,9 | 0.38 | #739 |
| ficha-aluno-financeiro | 1440 | 37,0 | 0.39 | #739 |
| ficha-aluno-graduacoes | 1440 | 35,7 | 0.37 | #739 |
| ficha-aluno-responsaveis | 1440 | 36,7 | 0.38 | #739 |
| ficha-aluno-historico | 1440 | 35,6 | 0.37 | #739 |

Testes do item: `npx vitest run visual/comparar.test.ts visual/casos.test.ts` → 175 passam; `npm run lint` e `npm run typecheck` → sem erros; `npm run visual:canvas -- --exige` → 0 reprovadas.
Regressão: não roda nesta fase.
Referências visuais: nenhuma regerada (a interface não mudou).
Desvios:
- Comentário do padrão novo também na #556, que dizia "passando a 30%" como as #553, #558 e #560.
- Nos motivos com "medido a X%" sem item de origem, o X passou a ser o valor desta medição (15 casos), para não contradizer o limite gravado; os "medido a X% na #NNN" ficaram como histórico.
- Nos motivos novos de `sem-acesso` e `portal-carteirinha`, os nomes de botões vão sem aspas, porque o motivo é um texto entre aspas.

## Verificação

### Rodada 1 — OK — 26/11/2026, estado 861087081106be6c899ea646780b6f55ab8b8188

Base do diff: b05c617b.

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | Seção 1 lida: os oito candidatos (atual, bloco 8 e 16, três regiões, bordas 8 e 16) com os quatro casos, a coluna dos demais e a conclusão. No `resultado.json` desta rodada o critério atual repete 1,3 / 0,8 / 4,0 / 36,3, e `turma-nova` 1440 14,7 e `portal-editar-contato` 390 14,0. Os candidatos descartados não foram medidos de novo (script descartável). |
| CA2 | PASSOU | `comparar.test.ts` (`limiteDoCaso({}, 1440)` e `({}, 390)` = 0,15), nos 175 testes do item. |
| CA3 | PASSOU | `comparar.test.ts` (valor só em 390: 390 devolve o valor, 1440 devolve o padrão). |
| CA4 | PASSOU | `casos.test.ts` verde nos dados reais. Mutação em cópia na pasta temporária: controle passa; sem largura, 0.15, 1.01, motivo sem `#`, 390 sem `canvasCelular` e 1440 sem `canvas` reprovam, cada um na asserção esperada. |
| CA5 | PASSOU | `npm run visual:canvas -- --exige`: saiu 0, 165 comparadas, 0 reprovadas. |
| CA6 | PASSOU | Sobre o `resultado.json`: 44 variantes com limite diferente de 0,15, todas acima de 0,15, folga de 1,03 a 1,99 ponto, 0 frouxas; são 44 as variantes acima de 15%, nenhuma no tema escuro. |
| CA7 | PASSOU | `gh issue view` de #553, #556, #558, #560, #573, #577, #601, #622, #642, #674, #739, #740 e #741: todas abertas, autor `ODevDosAnjos`, "Pronto quando" pede os casos sem `limiteCanvas` no `--exige`. Cada um dos 43 motivos cita a sua removedora. As #553, #556, #558 e #560 ainda dizem "30%" no corpo e têm o comentário de que vale 15%; sem `limiteCanvas`, o padrão aplicado é o de 15%. |
| CA8 | PASSOU | Diff do `AGENTS.md`: só a regra temporária saiu e a Autonomia 4 mudou; "Canvas e decisões do dono" intacta. |
| CA9 | PASSOU | A Autonomia 4 do diff traz o texto da seção 4. |

Comandos (em `frontend/`): `npx vitest run visual/comparar.test.ts visual/casos.test.ts` → 175 passam; `npm run lint` → 0; `npm run typecheck` → 0; `npm run build` → 0 (só o aviso de tamanho de chunk); `npm test` → 277 arquivos, 3051 testes, todos passam; `npm run visual:canvas -- --exige` → 0. e2e: nenhuma tela criada ou mudada. Back-end não tocado. Visual: no CI do PR (nenhuma referência regerada). `casos.ts` comparado com a base: fora do tipo, só mudou o campo `limiteCanvas`.

Capturas: abertas as seis de `.capturas/714/` (idênticas às desta execução). Os motivos e as issues #740 (`sem-acesso`), #741 (`portal-carteirinha`) e #622 (`portal-pix-chave` 390) descrevem o que se vê.

Instáveis: nenhum.

Nota para a entrega (não é achado): `origin/dev` avançou para 7fe8b4af (só `specs/backlog.md`), e `git merge-tree` acusa conflito nesse arquivo: a linha da #735 entra no mesmo ponto das #739 a #741. Resolve mantendo todas as linhas.

Achados:
- sugestão, especificação, `specs/projeto.md`, `specs/backlog.md` e D1 deste arquivo — a decisão P12 está datada de 27/11/2026, e a especificação que a abriu e esta verificação são de 26/11/2026; conferir a data.
- sugestão, código, `frontend/visual/casos.ts`, `ficha-aluno-financeiro` (e `-graduacoes`, `-responsaveis`, `-historico`) — o motivo, já assim antes do item, repete trechos ("a lista atrás tem outro conteúdo" duas vezes); pode ser enxugado quando a #739 for feita.

### Rodada 2 — OK — 26/11/2026, estado 5d0963a241f0fbd77e4c247e3dbc0faee7e66fb7

Nova rodada depois do commit do item (6365ce15) e do merge da `dev` (a9ddf057, base 7fe8b4af). Sem achado obrigatório na rodada 1. Desde o estado dela só mudaram `specs/backlog.md`, `specs/projeto.md` e este arquivo (rodada 1, "Entrega", data); código, testes e `AGENTS.md` são os mesmos.

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | Mantido da rodada 1; no arquivo, depois dela, só mudaram a data da D1, os tempos, a rodada e "Entrega". |
| CA2, CA3 | PASSOU | 175 testes do item passam. |
| CA4 | PASSOU | `casos.test.ts` verde nesta rodada; mutações mantidas da rodada 1. |
| CA5 | PASSOU | `npm run visual:canvas -- --exige` saiu 0: 165 comparadas, 0 reprovadas. |
| CA6 | PASSOU | `resultado.json` desta rodada: 44 variantes com limite diferente de 0,15 (as mesmas 44 acima de 15%), folga de 1,03 a 1,99 ponto, 0 frouxas. |
| CA7 | PASSOU | As 13 removedoras seguem abertas, autor `ODevDosAnjos` (`gh issue view`); corpo e "Pronto quando" mantidos da rodada 1. |
| CA8, CA9 | PASSOU | Mantidos da rodada 1 (`AGENTS.md` sem mudança). |

Merge: `git diff origin/dev HEAD -- specs/backlog.md` mostra só a linha da #714 (`feito`), as três linhas #739 a #741 e a linha da P12; as da #735 e #736 continuam; sem marcador de conflito nem número repetido. A data da P12 agora é 26/11/2026 em `backlog.md`, `projeto.md` e D1 (resolve a primeira sugestão da rodada 1).

Comandos (em `frontend/`): `npx vitest run visual/comparar.test.ts visual/casos.test.ts` → 175 passam; `npm run lint`, `npm run typecheck`, `npm run build` → 0; `npm test` → 277 arquivos, 3051 testes, todos passam; `npm run visual:canvas -- --exige` → 0. e2e: nenhuma tela criada ou mudada. Back-end não tocado. Visual: no CI do PR.

Capturas: as seis de `.capturas/714/` têm o mesmo hash das geradas nesta rodada; abertas, e os motivos de `sem-acesso`, `portal-carteirinha` e `portal-pix-chave` a 390 batem com o que se vê.

Instáveis: nenhum.

Achados:
- sugestão, código (texto do PR), seção "Entrega", item "Resultado" — "todas com `limiteCanvas` por largura (...) ou sem removedora ainda" contradiz a R4 e o observado: as 44 têm `limiteCanvas` e removedora aberta; tirar "ou sem removedora ainda" da descrição do PR.
- sugestão, código, motivos repetidos em `casos.ts` — mantida da rodada 1.

## Entrega

Recalibra o `npm run visual:canvas` depois da moldura (#624) e dos cabeçalhos (#646). O limite padrão passa de 30% para 15% e vale como rede de erro grosseiro e de regressão. `limiteCanvas` passa a ser por largura (1440 ou 390), com valor no máximo 3 pontos acima do medido, motivo e issue aberta que o remove. Remove a regra temporária de conferência lado a lado do `AGENTS.md` e reescreve a Autonomia 4. A fidelidade fina segue com a regra permanente "Canvas e decisões do dono".

- Medição nova (relatório na seção 1): nenhum candidato (bloco 8 ou 16, regiões, bordas) separa os casos conhecidos dos demais; por isso o critério é o limite por largura com folga curta.
- Resultado: `npm run visual:canvas -- --exige` sai 0, 165 comparadas e 0 reprovadas. São 44 variantes acima de 15%, todas com `limiteCanvas` por largura (folga de 1,03 a 1,99 ponto) e issue aberta que o remove; nenhuma do tema escuro.
- Issues novas, marco "Atualizações · Polimento" (não liberado para o loop): #739 (os 12 casos da ficha do aluno), #740 (`sem-acesso` 390) e #741 (`portal-carteirinha` 390). Comentário de padrão de 15% nas #553, #556, #558 e #560.
- Decisões: D1 a D6 da seção 6 (opção a do dono, P12).
- Testes: `npx vitest run visual/comparar.test.ts visual/casos.test.ts` (175 passam), `lint`, `typecheck`, `build` e `npm test` verdes na verificação.
- Limitações: as referências visuais não mudaram, então a conferência do visual é do job `visual` do CI; a regressão completa (`verify`, `test:cov`, `e2e`) roda no CI. Passar no `visual:canvas` não prova fidelidade; isso segue com a comparação das capturas. O ambiente gera os prints do canvas localmente, então valores podem variar pouco entre máquinas.
- Desvio registrado: a #556 também recebeu o comentário de 15%, além das #553, #558 e #560.
