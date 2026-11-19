# 493 — Início do portal no visual do canvas

Origem: issue #493 (Sprint 10.5, Fase 3, R1), `docs/auditoria/decisoes-canvas.md` (R1); evidência M34, M30, M1, M133 a M142, B25, B26. Branch: `item/493-portal-inicio-visual-canvas`. Dependências #450, #455 e #464 fechadas (`ComingSoon`, moldura do portal, `components/states`). Canvas: `PortalInicio`, `PortalEmDia`, `PortalResponsavel`, `PortalMInicio`, `PortalMResponsavel`, `PortalConfirmarModalidade`, `PortalEstados`, `PortalNav`. Regras: RF-POR-02, RN-POR-04, RN-POR-05, RN-POR-06a, RN-POR-09, RN-INA-08 (`docs/especificacao/14-portal-do-aluno.md`, `12-inativacao.md`). A issue pede só visual (front-end); o que o canvas mostra e a API não entrega fica fora (D1).

## 1. Objetivo

Deixar o Início do portal igual ao canvas: rótulo com a data e título "OLÁ, <nome>"; painel em duas colunas (cobrança em destaque e próximas aulas em cima; avisos e graduação embaixo); cartão de cobrança com referência do mês, selo de situação, valor grande e "Pagar" em largura total; "Tudo em dia" com próximo vencimento e "Ver financeiro"; próximas aulas com dia e hora curtos à esquerda; avisos com ponto de não lido e data curta; graduação com a faixa desenhada e "Ver carteirinha"; responsável com um cartão por filho e "Toda a família"; confirmação de modalidade nova como janela com "Depois"; estados dentro de cartão com o nome do módulo; rodapé em linha única.

Fora do escopo: dado novo na API (D1); Financeiro e demais abas (outras issues); pagamento online e valores por meio (Sprint 11, D2); regra do filtro RN-POR-04 (D3).

## 2. Requisitos

- R1: o topo traz o rótulo com a data ("QUINTA-FEIRA, 8 DE OUTUBRO") e o título "OLÁ, <primeiro nome>" (nome da conta do usuário); sai "BEM-VINDO AO CTCORE", o link "Ver carteirinha" solto e "Meus pedidos" solto (M136).
- R2: a página é um painel de duas colunas a partir de 768 px (cobrança e próximas aulas; avisos e graduação) dentro da coluna de 1120 px da moldura, e uma coluna no celular (M137).
- R3: o cartão de cobrança mostra o rótulo "<modalidade> · <mês/ano>" (ou a descrição, sem modalidade), o selo de situação à direita, o valor em destaque, "Vence em dd/mm/aaaa" (ou "Venceu em"), "Também em aberto: …" com a soma das demais cobranças e "Pagar" em largura total, que segue abrindo o Pix com comprovante (M138). A linha "Pix · Cartão · Boleto" aparece como item "Em breve" (D2).
- R4: sem cobrança pendente o cartão se chama "Financeiro", com selo verde "Tudo em dia", "Próximo vencimento: dd/mm/aaaa" quando existe e o botão "Ver financeiro" para `/portal/financeiro` (M34).
- R5: cada aula mostra à esquerda o dia e a hora curtos ("Hoje 19h30", "Sex 7h", "Seg 12/10" para datas depois de 6 dias), o título, a linha "unidade · modalidade", a pílula "Alterada" à direita; cancelada mostra "Sem aula" com o motivo; o cabeçalho traz o link "Ver agenda ›" (M139).
- R6: cada aviso mostra ponto vermelho (com texto acessível "Não lido") se não lido, título, pílula "Fixado" com ícone de alfinete, data curta dd/mm à direita, e o cabeçalho traz "Ver todos ›"; saem o contador "N avisos não lidos" e o link do rodapé do cartão (M140).
- R7: o cartão "Graduação" mostra por modalidade o ponto colorido, a faixa desenhada (`GraduationBelt`, com tarja e grau), "Faixa <cor> · N grau(s)", a pílula "Nova" e o link "Ver carteirinha" com ícone, que leva à carteirinha do aluno escolhido (M141).
- R8: responsável com mais de um cartão vê uma faixa de cartões por aluno (avatar com iniciais, nome, situação "Em dia" ou "R$ x vencendo"), o cartão "Toda a família" com o total em aberto e o cartão "Em aberto na família"; no celular, pílulas por aluno e "Família". "Toda a família" mostra o total e leva ao Financeiro `?aluno=all`; as demais seções seguem o cartão escolhido (RN-POR-05) (M142).
- R9: nova modalidade pendente abre sozinha como janela central (celular: gaveta de baixo) "Nova modalidade" com subtítulo "Não bloqueia o portal e não tem prazo.", tabela Modalidade, Plano e Mensalidade, caixa "Confirmo o plano e o valor" que habilita "Confirmar", e botão "Depois" que fecha sem confirmar e não reabre até recarregar; sai o cartão fixo (M133).
- R10: carregando, vazio, erro e sem permissão aparecem dentro do cartão do módulo, com os textos do canvas ("Carregando suas cobranças…", "Não conseguimos carregar o Financeiro. Nada foi alterado…", "Tentar de novo", "Voltar ao Início") (M134).
- R11: na barra, o botão de tema fica visível no tema claro (M135) e o rodapé é uma linha única na coluna com "feito com ctcore" à direita e filete acima (B26); o que o #455 já entrega só se confere (M1).
- R12: os quatro estados, 360 px sem rolagem lateral, axe nos dois temas, textos em `pt-BR.json`; casos visuais do Início aluno, em dia, responsável e confirmação passam sem `limiteCanvas` ou com `limiteCanvas` justificado (D1).

## 3. Critérios de aceite

- CA1 (R1): dado um aluno "Bruno Lima", então o rótulo traz o dia da semana e a data e o título "Olá, Bruno" (em caixa alta por CSS); não há "Ver carteirinha" nem "Meus pedidos" fora dos cartões.
- CA2 (R2): a 1440 px cobrança e aulas ficam lado a lado e avisos e graduação embaixo; a 390 px uma coluna.
- CA3 (R3): dado uma cobrança vencida, então vê-se o rótulo, "Vencida", o valor, "Venceu em", "Também em aberto" (se houver outra) e "Pagar" que abre o Pix com comprovante; "Pix · Cartão · Boleto" está desabilitado com "Em breve".
- CA4 (R4): dado nenhuma cobrança, então "Tudo em dia", o próximo vencimento e "Ver financeiro" (leva a `/portal/financeiro`); sem próximo vencimento a linha não aparece.
- CA5 (R5): dado aula hoje às 19:30 e uma de sexta às 07:00, então "Hoje 19h30" e "Sex 7h"; alterada tem a pílula; cancelada mostra "Sem aula" e o motivo; "Ver agenda" leva à Agenda; portal reduzido não mostra aulas (RN-INA-08).
- CA6 (R6): dado aviso fixado e não lido, então ponto com nome "Não lido", pílula "Fixado", data dd/mm; lido não tem ponto; "Ver todos" leva a `/portal/avisos`.
- CA7 (R7): dado faixa roxa grau 1 e outra nova, então a faixa desenhada, "Faixa roxa · 1 grau", "Nova" e "Ver carteirinha" com `?aluno=` do escolhido.
- CA8 (R8): dado responsável com dois filhos, então dois cartões com situação, "Toda a família" e "Em aberto na família R$ x"; escolher um filho refaz o painel; escolher "Toda a família" mostra o total e o link ao Financeiro; aluno com um só cartão não vê a faixa.
- CA9 (R9): dado pendência, então a janela abre com a tabela; "Confirmar" fica desabilitado até marcar a caixa; confirmar chama `POST /portal/modality-confirmations/{id}` e fecha; falha mostra o erro e não fecha; "Depois" fecha sem chamada; sem pendência não abre; Esc fecha e devolve o foco.
- CA10 (R10): dado 403, erro, carregando e vazio, então cada estado dentro do cartão com o texto do canvas e "Tentar de novo" refaz a leitura; "Voltar ao Início" no sem acesso.
- CA11 (R11): dado tema claro, então o botão de tema é visível na barra (contraste verificado no axe); rodapé em uma linha a 1440 px.
- CA12 (R12): axe sem violação nos dois temas, sem rolagem lateral a 360 px; `npm run test:visual:docker -- -g "portal-aluno|portal-inicio"` passa sem `--update-snapshots`; capturas em `.capturas/493/` (`portal-inicio-{1440,390}-{sistema,canvas}.png`, pt-BR); `npm run visual:canvas` sem reprovar os casos do Início com o limite padrão ou com `limiteCanvas` justificado.

## 4. Plano técnico

- Dados, API, Segurança: não mudam (rotas e permissão no servidor intactas; `docs/openapi.yaml` e o MSW de contrato não mudam; a massa MSW do Início cresce só para as capturas).
- Interface (todos em `frontend/src/features/portal/`, existentes):
  - `PortalHomePage.tsx` (`PortalHomePage`, `Sections`): rótulo e título com `useSession` (nome da conta, primeiro nome) e data; grade de duas colunas; tira o link solto da carteirinha; mantém o filtro RN-POR-04 como `PillFilter` (D3).
  - `PortalChargeCard.tsx`: cartão de cobrança do canvas e variante "Financeiro / Tudo em dia"; `ComingSoon` na linha dos meios.
  - `PortalNextLessons.tsx`, `PortalLessonItem.tsx` (existe; usado pelo cartão, conferir antes): linha com dia/hora curtos; helper de dia curto em `frontend/src/lib/format.ts` ou local, a conferir na construção.
  - `PortalNoticesCard.tsx`: ponto, pílula com ícone, data curta, "Ver todos ›".
  - `PortalBelts.tsx`: cartão "Graduação" com `GraduationBelt` e `ModalityDot` (`components/ui`), "Ver carteirinha".
  - `PortalFamilyStrip.tsx`: cartões com `Avatar`/`PersonAvatar`, situação, "Toda a família", "Em aberto na família"; no celular `PillFilter`/pílulas.
  - `ModalityConfirmations.tsx`: `Modal` (`components/Modal.tsx`) ou gaveta (`ui/drawer.tsx`) no celular, tabela, caixa e "Depois".
  - `PortalLayout.tsx`, `PortalFooter.tsx`: botão de tema visível e rodapé de linha única (só o que a #455 deixou).
  - `frontend/src/i18n/pt-BR.json` (`portalHome`, `portalConfirm`, `portalStates`): textos novos; remover `app.welcomeTitle` do Início se não for usado em outro lugar.
  - `frontend/src/mocks/handlers.ts` (perto da linha 1440 a 1560): massa para o aluno com cobrança vencida e "Também em aberto", aula de hoje, aviso fixado, duas faixas; pendência de modalidade no caso da janela.
  - `frontend/visual/casos.ts` (linhas 62 a 69): casos `portal-aluno` (Início), `portal-inicio-responsavel`, novo `portal-inicio-em-dia` (canvas `PortalEmDia`) e `portal-confirmar-modalidade` (canvas `PortalConfirmarModalidade`, passo para abrir); remover da lista de exceções o que passar a ter caso; referências regeradas só destes casos.
  - Testes: `PortalHomePage.test.tsx`, `ModalityConfirmations.test.tsx`, `PortalLayout.test.tsx`, `PortalFooter.test.tsx`, `PortalStates.test.tsx` (existem) adaptados; `frontend/e2e/portal-inicio.spec.ts` ajustado se os rótulos mudarem.
- Reuso: `GraduationBelt`, `ModalityDot`, `Avatar`, `PillFilter`, `ComingSoon`, `Modal`/`Drawer`, `components/states`, `PortalHeading`, `PortalTag`, `formatCurrency`, `formatDate`.
- Riscos: (1) o canvas mostra dados que a API não tem (professor, idade, "bloqueia em", "1 experimental", turma principal) e o limite padrão pode reprovar: usar `limiteCanvas` com motivo (D1); (2) o item é grande, por isso as partes abaixo; (3) o filtro e os estados são usados por outras telas do portal, conferir `PortalStates.test.tsx` e `portalPages.test.ts`; (4) captura de 390 px do responsável com pílulas.

## 5. Tarefas

Parte A (sessão 1: página e cartões). Parte B (sessão 2: família, janela, estados, visual).

- [x] T1 (A): textos `pt-BR`, topo (rótulo, "Olá, <nome>"), grade de duas colunas e filtro em pílulas; sem links soltos — cobre CA1, CA2 — prova: `cd frontend && npx vitest run src/features/portal/PortalHomePage.test.tsx`
- [x] T2 (A): cartão de cobrança e "Tudo em dia" — cobre CA3, CA4 — prova: `cd frontend && npx vitest run src/features/portal/PortalHomePage.test.tsx src/features/portal/PixProofDialog.test.tsx`
- [x] T3 (A): próximas aulas, avisos e graduação — cobre CA5, CA6, CA7 — prova: `cd frontend && npx vitest run src/features/portal/PortalHomePage.test.tsx`
- [x] T4 (B): faixa de cartões por filho, "Toda a família" e pílulas no celular — cobre CA8 — prova: `cd frontend && npx vitest run src/features/portal/PortalHomePage.test.tsx`
- [x] T5 (B): janela "Nova modalidade" com "Depois" — cobre CA9 — prova: `cd frontend && npx vitest run src/features/portal/ModalityConfirmations.test.tsx`
- [x] T6 (B): estados no cartão do módulo, botão de tema e rodapé — cobre CA10, CA11 — prova: `cd frontend && npx vitest run src/features/portal/PortalStates.test.tsx src/features/portal/PortalLayout.test.tsx src/features/portal/PortalFooter.test.tsx src/test/a11y.test.tsx`
- [x] T7 (B): massa MSW, casos visuais, referências e capturas em `.capturas/493/` — cobre CA12 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots -g "portal-aluno|portal-inicio|portal-confirmar"`, depois sem `--update-snapshots`, e `npm run visual:canvas`
- [x] T8 (B): regressão do front — não cobre critério: exigência do AGENTS.md — prova: `cd frontend && npm run lint && npm run typecheck && npm run build && npm run test:cov && npm run e2e`

## 6. Decisões

- D1: dado que o canvas mostra e a API não entrega (nome do professor na aula e no aviso, idade e modalidade do filho, "bloqueia em", "1 experimental", "Turma principal" e a nota da primeira mensalidade na janela) fica fora: a linha usa "unidade · modalidade" e a janela só Modalidade, Plano e Mensalidade. Motivo: a issue é de front-end e mudar API pede back-end, contrato e IT. Alternativa: acrescentar os campos. Sugestão de novo item: "Portal Início: dados de professor, idade e turma na API" (back-end, `PortalHome.java`, OpenAPI, MSW); até lá, divergência que reprovar no limite padrão leva `limiteCanvas` com motivo e a issue que a remove (AGENTS.md, autonomia 4).
- D2: "Pix · Cartão · Boleto" com valores por meio é pagamento online da Sprint 11; entra como item `ComingSoon` (visível, desabilitado), sem backend (regra do AGENTS.md).
- D3: o filtro "modalidade e unidade" fica porque a RN-POR-04 o exige e a especificação vence na regra; só muda o visual (pílulas). O canvas do aluno com duas modalidades não o mostra: divergência registrada no PR (B25).
- D4 (muda o comportamento): a confirmação de modalidade passa de cartão fixo a janela que abre sozinha, com "Depois" que fecha sem confirmar; a pendência continua não bloqueando nada e volta a abrir a cada carga da página. Alternativa: manter o cartão (contraria o canvas, R1).
- D5 (muda o comportamento): "Toda a família" no Início só mostra o total e leva ao Financeiro; a visão de pagamento junto é da issue do Financeiro.
- Suposição: o primeiro nome vem da conta da sessão (`account.name`); se vier vazio, o título cai para "Olá". Se o nome do aluno ligado for preferido no canvas, muda só o texto.

## Construção

Parte A (sessão 1) e Parte B (sessão 2) feitas.

- T1 — arquivos: `frontend/src/features/portal/PortalHomePage.tsx` (rótulo com a data no fuso da unidade, "Olá, <primeiro nome>" pela sessão, grade `md:grid-cols-2`, filtro RN-POR-04 como `PillFilter`, link solto da carteirinha removido), `frontend/src/i18n/pt-BR.json`, `PortalHomePage.test.tsx`, `PortalLayout.test.tsx`, `PortalTermPage.test.tsx`, `e2e/portal-{barra,pedidos,termo}.spec.ts` (título do Início) — prova: `npx vitest run src/features/portal/PortalHomePage.test.tsx` → passou
- T2 — `PortalChargeCard.tsx` (cartão com "<modalidade> · mm/aaaa", selo, valor, "Vence/Venceu em", "Também em aberto", "Pagar" em largura total, `ComingSoon` "Pix · Cartão · Boleto"; variante "Financeiro / Tudo em dia" com "Ver financeiro") — prova: `npx vitest run src/features/portal/PortalHomePage.test.tsx src/features/portal/PixProofDialog.test.tsx` → passou
- T3 — `PortalNextLessons.tsx` (dia e hora curtos, "Sem aula", "Ver agenda ›"), `PortalNoticesCard.tsx` (ponto "Não lido", pílula com alfinete, dd/mm, "Ver todos ›"), `PortalBelts.tsx` (`ModalityDot`, `GraduationBelt`, "Faixa <cor> · N grau(s)", "Ver carteirinha" com `?aluno=`), `e2e/portal-avisos.spec.ts` — prova: `npx vitest run src/features/portal src/test/a11y.test.tsx` → 19 arquivos, 213 testes passaram
Regressão: `npm run lint` e `npm run typecheck` sem erro. `npx vitest run` (suíte inteira): 2 falhas em `LoginPage.test.tsx` (CA7) e `TwoFactorLogin.test.tsx` (CA24), que esperavam o título antigo do Início do portal; ajustadas para "Olá" e rodadas de novo: 34 testes passaram. `npm run e2e` e `test:cov` ficam para T8 (Parte B); os e2e do portal só tiveram o texto do título e do link ajustados, sem rodar.
Desvios: (1) no portal reduzido o Início mantém um link "Ver carteirinha" simples, porque o cartão Graduação não aparece nele (RN-INA-08) e o e2e `portal-carteirinha` exige o acesso; (2) a descrição da cobrança com modalidade não aparece mais no cartão (o canvas mostra "<modalidade> · mês/ano"; a descrição segue no nome acessível de "Pagar"); (3) a chave `portalHome.belts.line` fica (usada por `PortalMemberCard`), a nova é `portalHome.belts.grade`; (4) o título da página usa o primeiro nome da conta (suposição do item).
Referências visuais: não regeradas nesta parte (T7, Parte B).
Não é do item: nenhum.

### Parte B (sessão 2)

- T4 — `PortalFamilyStrip.tsx` (cartão por aluno com `Avatar`, situação "Em dia" ou "R$ x vencendo", "Toda a família", "Em aberto na família R$ x"; no celular os mesmos botões viram pílulas), `PortalHomePage.tsx` (visão "Toda a família": total e link ao Financeiro, sem refazer a leitura), `pt-BR.json`, `PortalHomePage.test.tsx` — prova: `npx vitest run src/features/portal/PortalHomePage.test.tsx` → 13 passaram
- T5 — `ModalityConfirmations.tsx` (`Modal` que abre sozinho, no celular colado embaixo; tabela Modalidade, Plano, Mensalidade; caixa "Confirmo o plano e o valor" habilita "Confirmar"; "Depois" e Esc fecham até recarregar; várias pendências: uma por vez), `App.tsx` (sai o link solto "Meus pedidos"), `pt-BR.json` (`portalConfirm`; sai `portalOwn.link`), `ModalityConfirmations.test.tsx` — prova: `npx vitest run src/features/portal/ModalityConfirmations.test.tsx` → 6 passaram
- T6 — `PortalHomePage.tsx` e `PortalFinancePage.tsx` (estados em cartão com os textos do canvas e "Voltar ao Início" no sem acesso do Financeiro), `pt-BR.json` (`portalHome.states`, `portalFinance.states`), `PortalStates.test.tsx`, `PortalFinancePage.test.tsx`; botão de tema e rodapé de linha única já estavam como o canvas (#455), só conferidos — prova: `npx vitest run src/features/portal src/test/a11y.test.tsx` → passou
- T7 — `visual/casos.ts` (casos `portal-inicio-em-dia` e `portal-confirmar-modalidade`; saem `PortalEmDia`, `PortalConfirmarModalidade` e `PortalMConfirmarModalidade` da lista de exceções), `visual/telas.visual.ts` (campo `inicioCanvas` que ajusta o MSW do caso; o título esperado após o login aceita "Olá"), capturas em `.capturas/493/` — prova: `npm run test:visual:docker -- --update-snapshots -g ...`, depois sem `--update-snapshots`, e `npm run visual:canvas -- --exige` → 154 comparadas, 0 reprovadas
- T8 — `e2e/portal-inicio.spec.ts`, `portal-pedidos.spec.ts`, `comprovantes.spec.ts` ajustados — provas abaixo.

Visual do CI: portal-aluno → passou; portal-inicio-responsavel → passou; portal-inicio-em-dia → passou; portal-confirmar-modalidade → passou (1 falha em 1440 escuro na rodada de `-g "portal"`, passou na repetição, instável anotada); portal-reduzido → passou depois de regerar (o Início reduzido mudou de propósito).
Referências visuais: `frontend/visual/referencias/` portal-aluno, portal-inicio-responsavel, portal-reduzido (alteradas) e portal-inicio-em-dia, portal-confirmar-modalidade (novas), nas quatro combinações de largura e tema.
Comparação com o canvas (capturas em `.capturas/493/`, abertas e comparadas): iguais em estrutura (rótulo com data, "OLÁ, <nome>", duas colunas, cobrança com selo, "Pagar" largo, aulas com dia/hora, avisos com ponto e "Fixado", graduação com faixa e "Ver carteirinha", "Tudo em dia", janela "Nova modalidade"). Divergências que ficam: (1) títulos dos cartões menores que os do canvas (fonte de título em caixa alta) e colunas 50/50 em vez de ~55/45; (2) dia e hora das aulas na fonte do corpo, não na de título; (3) dados que a API não entrega (professor, "bloqueia em", valores por meio, turma, idade), D1; (4) janela no celular sem alça e com linhas em tabela: `limiteCanvas` 0.5 no caso `portal-confirmar-modalidade`, motivo no `casos.ts`; sem issue da 10.5 que a remova (sugestão: o item de API do D1).
Regressão: `npm run lint`, `npm run typecheck`, `npm run build` → sem erro. `npm run test:cov` → 2 rodadas: 2 falhas na primeira (`LoginPage.test.tsx` trava com horário; `UnitSettingsPage.test.tsx` timeout) e 1 na segunda (`RecordEnrollment.test.tsx`), todas fora do item e todas passando sozinhas na repetição (instáveis sob carga); não ficou uma rodada completa verde nem o relatório de cobertura conferido. `npm run e2e` → 96 passaram e 2 falharam na última rodada completa (`portal-inicio` responsável, ajustado depois); `npx playwright test e2e/portal-inicio.spec.ts` → 5 passaram e `portal-pedidos`, `comprovantes` → passaram.
Desvios: (1) o link de "Toda a família" é `/portal/financeiro?visao=familia` (o Financeiro usa `visao=familia`; o item dizia `?aluno=all`, que o Financeiro não lê); (2) com a janela de modalidade aberta sozinha, os e2e `portal-pedidos` e `comprovantes` clicam em "Depois" depois do termo; (3) `Meus pedidos` saiu do Início (R1) e a rota `/portal/pedidos` ficou sem entrada na tela: o e2e abre por histórico; precisa de uma entrada (aba Pedidos de Minhas informações no canvas), decisão do dono; (4) casos de estado de carregando, erro e sem permissão só nas telas Início e Financeiro; as outras telas do portal seguem com os estados antigos (outras issues); (5) estados do Início sem "Voltar ao Início" (é a própria tela).
Não é do item: nenhum.

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-18, estado 392cc630884eb520b8018302ddb5afd5102f0010

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA11 | PASSOU | `npx vitest run src/features/portal src/features/auth src/test/a11y.test.tsx --maxWorkers=2` → 33 arquivos, 355 testes passaram (inclui axe e estados) |
| CA12 | NÃO PASSOU (parcial) | visual passou, mas capturas incompletas e divergências sem `limiteCanvas`/issue (achados 1 a 3) |

Comandos: `npm run lint` e `npm run typecheck` → sem erro. `npm run test:visual:docker -- -g "portal-aluno|portal-inicio|portal-confirmar|portal-reduzido"` → 24 passaram (portal-aluno, portal-inicio-responsavel, portal-inicio-em-dia, portal-confirmar-modalidade, portal-reduzido-info). Capturas `.capturas/493/` abertas e comparadas lado a lado (portal-inicio 1440). Regressão completa (`test:cov`, `e2e`, `build`) não rodada nesta rodada: o item mesmo relata `test:cov` sem rodada completa verde.
Instáveis: nenhum visto nesta rodada (o item anota 1 falha única em portal-confirmar-modalidade 1440 escuro).
Achados:
- obrigatório, código, `frontend/visual/casos.ts` caso `portal-confirmar-modalidade` (`limiteCanvas` 0.5) — esperado: AGENTS.md (autonomia 4): `limiteCanvas` cita a issue da Sprint 10.5 que remove a divergência, e essa issue traz a remoção no "Pronto quando"; observado: motivo diz "sem issue da 10.5 que a remova" (Construção); evidência: texto do `casos.ts` e da Construção; corrigir: criar/usar issue da 10.5 (ex.: dados de API do D1 / alça da gaveta), citá-la no motivo e acrescentar a remoção no "Pronto quando" dela; ou igualar o canvas (alça, empilhamento) e tirar o limite.
- obrigatório, código, cartões do Início (`PortalChargeCard`, `PortalNextLessons`, `PortalNoticesCard`, `PortalBelts`) — esperado: títulos dos cartões ("PRÓXIMAS AULAS", "AVISOS") na fonte de título grande e dia/hora ("Hoje 19h30") na fonte condensada, como no canvas (R1: canvas vence no visual); observado: na captura 1440 os títulos aparecem pequenos em negrito e dia/hora na fonte do corpo; o item registra como "divergência que fica" sem issue; evidência: `.capturas/493/portal-inicio-1440-sistema.png` x `-canvas.png`; corrigir: ajustar pelos componentes base (tokens/fonte de título) ou registrar issue da 10.5 e `limiteCanvas` conforme autonomia 4. Também: "Pix · Cartão · Boleto" aparece como link sublinhado, não como linha com valores; conferir `ComingSoon`.
- obrigatório, código, `.capturas/493/` — esperado: capturas 1440 e 390 de cada tela comparada (AGENTS.md); observado: `portal-inicio-em-dia` só tem 1440 (sem 390) e não há captura 390 de `portal-aluno` alem de `portal-inicio-390`; corrigir: gerar `portal-inicio-em-dia-390-{sistema,canvas}.png` e comparar.
- sugestão, código — `/portal/pedidos` ficou sem entrada na interface após sair "Meus pedidos" do Início (Desvio 3 da Construção); decisão do dono pendente; abrir issue da 10.5 para a entrada (aba Pedidos).
- sugestão — `link de "Toda a família"` usa `?visao=familia` em vez de `?aluno=all` (Desvio 1): atualizar a especificação (CA8/R8) do item.

### Correção da rodada 1

- Achado 1 (`limiteCanvas` do `portal-confirmar-modalidade`) — aberta a issue #601 da Sprint 10.5 ("Início do portal: janela Nova modalidade e dados da API iguais ao canvas, sem limiteCanvas") com a remoção do `limiteCanvas` no "Pronto quando"; o motivo em `frontend/visual/casos.ts` agora cita a #601 — prova: `npm run test:visual:docker -- -g "portal-aluno|portal-inicio|portal-confirmar|portal-reduzido"` → 24 passaram
- Achado 2 (fontes) — `frontend/src/components/Card.tsx` (`Section`/`Card` ganham `titleClassName` opcional), `PortalNextLessons.tsx` e `PortalNoticesCard.tsx` (títulos "Próximas aulas" e "Avisos" em `text-2xl uppercase`, na fonte de título), `PortalNextLessons.tsx` (dia e hora em `font-heading text-xl`); referências regeradas dos casos portal-aluno, portal-inicio-responsavel, portal-inicio-em-dia, portal-confirmar-modalidade e portal-reduzido-info — prova: `npx vitest run src/features/portal src/components src/test/a11y.test.tsx` (ver linha de testes abaixo), `npm run lint`, `npm run typecheck` → sem erro. "Pix · Cartão · Boleto" continua como item `ComingSoon` variante link (D2: valores por meio são da Sprint 11; o componente base não tem outra forma).
- Achado 3 (capturas) — `.capturas/493/` reatualizada com as capturas novas (1440 e 390 de portal-inicio, responsável e janela). `portal-inicio-em-dia`: o canvas só existe a 1440 (`PortalEmDia`; não há `PortalMEmDia`), então a 390 só há a captura do sistema (`portal-inicio-em-dia-390-sistema.png`) e não há canvas para comparar; o celular do estado com cobrança é o `PortalMInicio`.
Visual do CI: portal-aluno, portal-inicio-responsavel, portal-inicio-em-dia, portal-confirmar-modalidade, portal-reduzido-info → passou (24 de 24, sem `--update-snapshots`). `npm run visual:canvas -- --exige` → 154 comparadas, 0 reprovadas.
Referências visuais: portal-aluno, portal-inicio-responsavel, portal-inicio-em-dia, portal-confirmar-modalidade, portal-reduzido (quatro combinações cada) regeradas.
Sugestões (não obrigatórias): `?visao=familia` no lugar de `?aluno=all` fica para a fase 2 atualizar a especificação; a entrada para `/portal/pedidos` segue como decisão do dono. `test:cov` e `e2e` completos não foram rodados de novo (mudança só de classe de fonte).

### Rodada 2 — OK — 2026-11-18, estado 4ea0c6cf799fa343caf1449287e0f22f6ba0d9b6

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA11 | PASSOU | `npx vitest run src/features/portal src/features/auth src/components src/test/a11y.test.tsx --maxWorkers=2` → 695 testes passaram (inclui axe) |
| CA12 | PASSOU | `npm run test:visual:docker -- -g "portal-aluno|portal-inicio|portal-confirmar|portal-reduzido"` → 24 passaram; `limiteCanvas` do `portal-confirmar-modalidade` cita a #601 (Sprint 10.5, autor ODevDosAnjos), que traz a remoção no "Pronto quando"; capturas 1440 e 390 em `.capturas/493/` (em-dia 390 sem canvas, que não existe: aceito) |

Comandos: `npm run lint`, `npm run typecheck` → sem erro. `build`, `test:cov` e `e2e` não rodados nesta rodada: o diff desde a rodada 1 é só classe de fonte (`Card.tsx` com `titleClassName`, `PortalNextLessons`, `PortalNoticesCard`); a regressão completa do item foi relatada na Construção.
Instáveis: nenhum visto.
Achados:
- sugestão, código — títulos "Graduação" e rótulo do cartão de cobrança ainda menores que no canvas (captura 1440), cobertos pela comparação visual passando; ajustar numa issue da 10.5 se o dono quiser.
- sugestão — `/portal/pedidos` sem entrada na interface (decisão do dono); `?visao=familia` no lugar de `?aluno=all`: atualizar a especificação.

## Entrega

**O que muda:** Início do portal no visual do canvas (rótulo com a data, "Olá, <nome>", duas colunas, cartão de cobrança com selo e "Pagar" largo, "Tudo em dia", aulas, avisos com ponto de não lido, graduação com faixa, responsável com um cartão por filho e "Toda a família"); "Nova modalidade" como janela que abre sozinha, com "Depois"; estados do Início e do Financeiro em cartão; casos visuais `portal-inicio-em-dia` e `portal-confirmar-modalidade`. Sai o link solto "Meus pedidos" do Início (R1).

**Verificação:** rodada 2 `OK` (estado `4ea0c6cf799fa343caf1449287e0f22f6ba0d9b6`). Testes de portal, auth, components e a11y: 695 passaram (com axe). Lint e typecheck sem erro; build sem erro na construção. Visual do CI (`-g "portal-aluno|portal-inicio|portal-confirmar|portal-reduzido"`): 24 passaram.

**Visual do CI, por caso:** portal-aluno → passou; portal-inicio-responsavel → passou; portal-inicio-em-dia → passou; portal-confirmar-modalidade → passou (uma falha instável em 1440 escuro, passou na repetição); portal-reduzido → passou depois de regerar a referência (mudança visual pedida).

**Comparação com o canvas (1440 e 390 px, pt-BR, `.capturas/493/`):** `visual:canvas` com 154 comparadas e 0 reprovadas. Divergências que ficam: (1) títulos dos cartões menores e colunas 50/50 em vez de ~55/45 (passa no limite padrão, sem `limiteCanvas`); (2) dia e hora das aulas na fonte do corpo; (3) dados que a API não entrega (professor, "bloqueia em", valores por meio, turma, idade), D1; (4) janela no celular sem alça e com linhas em tabela: `limiteCanvas` 0,5 em `portal-confirmar-modalidade`, citando a #601, que remove a exceção no "Pronto quando" dela.

**Decisões:** D1 a D5 da seção 6. A janela de modalidade muda de cartão para janela (D4). "Toda a família" no Início só mostra o total e leva ao Financeiro (D5). O link é `/portal/financeiro?visao=familia`, que é o parâmetro que o Financeiro lê; a seção 1 cita `?aluno=all`, que o Financeiro não lê.

**Regressão:** `test:cov` teve falhas instáveis fora do item (`LoginPage.test.tsx`, horário; `UnitSettingsPage.test.tsx`, timeout; `RecordEnrollment.test.tsx`), todas passando isoladas na repetição; nenhuma rodada completa de `test:cov` ficou verde. `e2e`: a última rodada completa teve 2 falhas em `portal-inicio` (responsável), corrigidas; `portal-inicio` 5 passaram, `portal-pedidos` e `comprovantes` passaram. A base (`origin/dev`) não avançou desde a verificação, então a regressão não foi repetida.

**Limitações:** `/portal/pedidos` ficou sem entrada na interface (decisão do dono: aba Pedidos em Minhas informações). Estados de carregando, erro e sem permissão só nas telas Início e Financeiro; as demais telas do portal ficam para as próprias issues. Dados de professor, idade, turma e valores por meio dependem de API (D1, #601).
