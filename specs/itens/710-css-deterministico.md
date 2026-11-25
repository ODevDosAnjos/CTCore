# 710 — Técnica · Teste visual deixa referências envelhecerem (tolerância frouxa)

Origem: issue #710 (achada no PR #709, item #611). Branch: `item/710-css-deterministico`.

## 1. Objetivo

Fazer o teste visual reprovar quando uma referência deixa de refletir o código. A causa real (medida na construção e em 25/11/2026) não é o CSS: a tolerância do `toHaveScreenshot` (`threshold` 0,2 e `maxDiffPixelRatio` 0,001) deixava referências envelhecidas passarem, e o #611 só fez o acúmulo aparecer. Decisão do dono (25/11/2026, opção b): apertar a tolerância e regerar as referências que reprovam, com o critério **"a referência reflete o código atual"**. Divergências entre o sistema e o canvas ficam com a #568 e as issues da Sprint 10.5; **uma retomada não deve parar de novo aqui**.

Fora do escopo: mudar CSS, tokens ou telas; corrigir divergência com o canvas.

## 2. Requisitos

- R1: a causa fica registrada neste arquivo (tolerância frouxa, com os números medidos).
- R2: `playwright.visual.config.ts` usa `maxDiffPixelRatio: 0` e `threshold: 0.05`; a suíte inteira roda duas vezes seguidas no container com o mesmo resultado.
- R3: as referências que passam a reprovar são regeradas (158) e listadas por grupo no PR.
- R4: `frontend/visual/css.visual.ts` fica como guarda extra (cor computada de `bg-warn`/`bg-info` e `text-align` do rodapé do painel).
- R5: nos 3 PRs seguintes, caso visual que reprovar sem mudança de tela é registrado como possível instabilidade da tolerância nova, sem regerar.

## 3. Critérios de aceite

- CA1 (R1): a seção Construção traz os números: `notificacoes` 1131 e 1094 px contra o limite de 1440 px; `alunos` passava até com limite 0 (o `threshold` escondia o bege contra o amarelo); 44 casos divergiam abaixo do limite.
- CA2 (R2): duas rodadas da suíte, com a tolerância nova e as referências antigas, reprovam exatamente os mesmos 158 casos.
- CA3 (R3): com as referências regeradas, `npm run test:visual:docker` inteiro, sem `--update-snapshots`, passa; `git status` só mostra mudança nas 158 referências.
- CA4 (R4): `npm run test:visual:docker -- -g "css"` passa.
- CA5: lint, typecheck, build e `npm test` passam.

## 4. Plano técnico

- Dados, API, interface e segurança: não mudam.
- Arquivos: `frontend/playwright.visual.config.ts` (tolerância); `frontend/visual/css.visual.ts` (novo); 158 imagens em `frontend/visual/referencias`; este arquivo; `specs/backlog.md`.
- Referências regeradas, por grupo (para o PR): etiquetas e estilos que passaram a aparecer (`alunos`, `notificacoes`, `moldura-*`, `plano-*`); menu (`configuracoes-*`, `moldura-*` 390); conteúdo (`ficha-aluno-*`, `aluno-*`, `professor-*`, `pedido-*`, `aula-*`, `agenda-*`, `portal-*`, `conta-aluno`, `sem-acesso`, `cobrancas-sem-acesso`, `comunicados-novo*`, `vitrine`).
- `sem-acesso`: o segundo botão ("Ver minhas turmas", Professor) veio do #476, que o pediu citando o canvas `EstadoSemAcesso`; o #611 só trocou a rota do caso para `/administradores`, que mostra essa tela.

## 5. Tarefas

- [x] T1: medir a causa (limite 0 na `dev` de `0c857ea0`, suíte inteira) e registrar — cobre CA1.
- [x] T2: apertar a tolerância e rodar a suíte duas vezes com as referências antigas (158 reprovam nas duas) — cobre CA2.
- [x] T3: regerar as 158 referências, conferir por amostragem e registrar a decisão do dono — cobre CA3.
- [x] T4: suíte visual sem `--update-snapshots`, `-g "css"`, lint, typecheck, build e `npm test` — cobre CA4, CA5. Prova: `npm test` 275 arquivos, 3023 testes passaram (log da construção). A rodada local da suíte visual inteira foi encerrada por falta de memória; a prova dela é o job visual do CI, e não se roda a suíte inteira local de novo (decisão do dono, 25/11/2026).

## 6. Decisões

- D1 (dono, 25/11/2026): opção (b). Critério das referências: "reflete o código atual". Alternativa descartada: fechar como não reproduzível mantendo só o `css.visual.ts`.
- D2: `threshold: 0.05` (e não 0,2) porque o bege `236,233,226` contra o amarelo `250,235,200` tem distância de cor menor que o `threshold` padrão; `maxDiffPixelRatio: 0` porque o antialiasing já é ignorado pelo comparador. As duas rodadas iguais mostram que não há serrilhado.
- D3: divergências com o canvas (ex.: layout inteiro de `ficha-aluno` e `configuracoes-organizacao`) não são desta issue; a #568 recebeu o acréscimo.

## Construção

- T1 (investigação, não marcada) — worktree de `0c857ea0` e branch (`ca27ad03`), no container do visual (`npm run test:visual:docker`), cache frio: o CSS servido em `/src/index.css` já tem `.bg-warn`, `.bg-info`, `.bg-danger`, `.text-center` e `.uppercase` na primeira requisição, antes de qualquer rota; o mesmo no `vite` local. Em `0c857ea0`, no fluxo do próprio teste visual (login, vitrine, rota), `getComputedStyle` das etiquetas `[data-tone=warn]` dá `rgb(250, 235, 200)` e o rodapé do painel dá `text-align: center`. Um print tirado nesse momento é amarelo em (330,441) e igual, pixel a pixel fora do menu, à referência nova do #611 (0 pixels diferentes). Ou seja: a `dev` de antes do #611 renderizava certo; não achei CSS ausente nem dependente de rota, nem code splitting (só a Vitrine é `lazy`).
- O que difere é a referência antiga: `alunos-1440-claro.png` (do #465, 10/11) tem a etiqueta bege `236,233,226`; a de `notificacoes` (do #492) tem a mesma etiqueta amarela. O teste da `dev` passava com a referência bege contra um render amarelo porque `toHaveScreenshot` aceita a diferença (`threshold` padrão de 0,2 por pixel e `maxDiffPixelRatio: 0.001` em `playwright.visual.config.ts`): a troca de cor, o título em caixa alta e o rodapé centralizado somam menos de 0,1% dos pixels. O #611 mudou o menu, passou do limite, e o CI mostrou de uma vez as diferenças acumuladas; ao regerar, as referências ficaram certas.
- Teste escrito: `frontend/visual/css.visual.ts` (3 casos: `/alunos` e `/` em duas ordens, e vitrine antes de `/alunos`; confere `bg-warn`/`bg-info` por cor computada e `text-align` do rodapé do painel). Prova: `npm run test:visual:docker -- -g "css"` → 3 passaram no branch **e também em `0c857ea0`** (não cumpre CA4/R4, ver pedido). Nenhuma correção em `index.css` foi aplicada (T3 não tem causa a corrigir). T2, T3 e T4 ficam por marcar.

Pedido de ajuste: R2, R3, R4, CA2, CA4 e a premissa da issue. O CSS não é indeterminístico no que consegui reproduzir (cold start, três ordens de rota, dev server local e no container): a `dev` de antes do #611 já renderiza `bg-warn`, `bg-info` e `text-center`, então não existe correção de CSS que faça o teste "falhar em `0c857ea0` e passar depois" (R4/CA4). A causa observável é a tolerância do `toHaveScreenshot`, que deixou referências desatualizadas (bege, caixa baixa) passarem; as referências de `0c857ea0` já estavam velhas, e o #611 as renovou. Como a origem da referência bege no #465 (render realmente sem a classe naquele dia, ou referência gerada com outra máquina) não é reproduzível agora, falta decisão do dono: (a) fechar a #710 como não reproduzível, mantendo `css.visual.ts` como guarda; ou (b) endurecer a comparação (`threshold`/`maxDiffPixelRatio` menores em `playwright.visual.config.ts`), o que reprova referências antigas e exige regerá-las, contra o R5 e o "Pronto quando" da issue. Requer reescrever R2–R5.

Não é do item: nenhum.

### Retomada após a decisão do dono (25/11/2026)

- Medição em `0c857ea0` com `maxDiffPixelRatio: 0` na suíte inteira: `notificacoes` 1131 px (claro) e 1094 (escuro) contra o limite de 1440 px; `alunos` passa até com limite 0 (o `threshold` 0,2 esconde bege contra amarelo); 44 casos divergem abaixo do limite.
- Tolerância nova: `maxDiffPixelRatio: 0`, `threshold: 0.05`. Duas rodadas no container, com as referências antigas: 158 reprovados e 498 aprovados nas duas, o mesmo conjunto (`diff` vazio). `--update-snapshots`: 656 passaram, 158 arquivos regerados.
- Amostra contra o canvas: `alunos` (etiquetas amarela e azul) e `notificacoes` (título em caixa alta, bolinha vermelha, rodapé centralizado) batem no que mudou; `moldura-professor`, `agenda-aula-avulsa`, `configuracoes-termos`, `conta-aluno` e `sem-acesso` não puderam ser confirmadas contra o canvas (outro estado ou layout já divergente). Decisão do dono: aceitar (opção 1), critério "reflete o código atual".
- `sem-acesso`: segundo botão "Ver minhas turmas" vem do #476 (pediu e citou o canvas `EstadoSemAcesso`); o #611 trocou a rota do caso para `/administradores`. Origem justificada, regerado.

## Entrega

- Muda: tolerância do teste visual (`maxDiffPixelRatio: 0`, `threshold: 0.05`); 158 referências regeradas por grupo (ver Construção); guarda `frontend/visual/css.visual.ts`; este arquivo e a linha 710 do backlog (`feito`).
- Causa (R1): a tolerância antiga do `toHaveScreenshot` deixava referências envelhecidas passarem. Medido em `0c857ea0` com limite 0: `notificacoes` 1131/1094 px contra 1440 px; `alunos` passava até com limite 0; 44 casos divergiam abaixo do limite.
- Verificação: rodadas da construção (duas com referências antigas, uma de regeração) registradas acima. `npm test`: 275 arquivos, 3023 testes passaram. Lint, typecheck e build sem erro no log da construção.
- Visual do CI: a prova da suíte visual inteira é o job visual do CI deste PR (`Visual do CI: suíte inteira → <resultado do job>`). A rodada local foi encerrada por falta de memória e não se repete.
- Decisão do dono (25/11/2026): o item segue sem rodada de Verificação separada, autorizado na chamada da entrega; esta seção registra isso.
- Limitações: `css.visual.ts` passa também em `0c857ea0`, então não prova a correção de CSS; a guarda fica como regressão de cor e alinhamento. Divergências com o canvas continuam com a #568 e a Sprint 10.5.
- Regressão local: não medida nesta entrega (tempo não registrado).
