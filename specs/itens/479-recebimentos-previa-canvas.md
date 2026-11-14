# 479 — Recebimentos do dia e Prévia da geração no visual do canvas

Origem: issue #479 (Sprint 10.5, Fase 3, plano F4), `docs/auditoria/decisoes-canvas.md` (R1 a R4); evidências M15 e B14. Branch: `item/479-recebimentos-previa-canvas`. Canvas: `RecebimentosDia` e `Fechamento` (a Prévia), ambos em 1440 px e tema claro; não há canvas de celular nem de tema escuro dessas telas (a captura do celular é a 390 px, componentes base, D10). Dependências #449, #458, #459 e #464 já estão em `dev` (`ComingSoon`, tabela em cartões, `PersonRow`, estados do canvas); a #477 já entregou o botão "Gerar próximas mensalidades" e a janela `AdvanceChargesDialog` na Prévia. Os casos `cobrancas-recebimentos` e `cobrancas-previa` já existem em `frontend/visual/casos.ts`.

Uma especificação, uma entrega; a construção se divide em partes (A a D, nas tarefas).

## 1. Objetivo

Deixar Financeiro › Cobranças › Recebimentos do dia e Prévia da geração iguais ao canvas, para Coordenação e Administração, em 1440 px e 390 px e no tema claro. Recebimentos do dia passa a ter a data por extenso, "Dia anterior", "Exportar CSV" (Em breve) e duas tabelas lado a lado com total e taxa repassada. A Prévia passa a ter o botão "Gerar próximas mensalidades" no topo, três cartões (Total previsto, Mensalidades, Já gerado), a tabela "Por dia de vencimento" com "gera em" e diferença, "Ver alunos" para ajustar, a tabela "Quem não será cobrado e por quê" e a nota de rodapé; e deixa de quebrar com um motivo sem texto (B14). Nenhuma regra de negócio muda (RF-COB-03, RF-COB-08, RN-COB-02, RN-COB-12).

Fora do escopo: exportar CSV de verdade (fica "Em breve" até a #151, como em Cobranças); abertura e fechamento de caixa (RN-COB-12); mudar a regra da geração automática; "Já gerado" como histórico de gerações (D5); mostrar quem "não lança" com 0 pagamento (D4); canvas escuro e de celular.

## 2. Requisitos

- R1: Recebimentos do dia mostra o cabeçalho "Recebimentos do dia" com o subtítulo "<dia da semana>, <dia> de <mês> de <ano> · <unidade> · sem abertura ou fechamento de caixa" (data por extenso, fuso da unidade) e os botões "Dia anterior" e "Exportar CSV"; o campo de data nativo e o botão "Voltar às cobranças" saem (D1).
- R2: "Dia anterior" volta um dia a cada clique; quando o dia mostrado não é hoje, aparece também "Próximo dia", que avança um dia até hoje (extra que o canvas não tem, para não perder o caminho de volta, D1).
- R3: "Exportar CSV" fica visível e desabilitado com "Em breve" (C11), sem backend.
- R4: a tabela "Por meio" tem as colunas Meio, Pagamentos, Valor e Taxa repassada e a linha Total (pagamentos, valor, taxa); os meios do portal aparecem como "Pix pelo portal", "Cartão pelo portal" (crédito e débito somados), "Boleto"; os manuais como "Dinheiro", "Cartão na maquininha", "Pix na chave" e "Transferência"; taxa zero aparece como "—" (D2).
- R5: a tabela "Por quem lançou" tem Lançado por, Pagamentos e Valor; o pagamento sem lançador aparece como "Portal (aluno pagou)" (D3); quem lançou aparece com nome; linha sem pagamento mostra "—" no valor. O texto "Pagamento online" da RF-COB-08 passa a "Portal (aluno pagou)" na especificação (D3).
- R6: a lista "Pagamentos do dia" e os dois cartões de total saem da tela, porque o canvas não os tem (D6); o total do dia fica só na linha Total da tabela "Por meio".
- R7: com "Todas as unidades" na barra, a tela pede para escolher uma unidade, como hoje (a rota exige `unitId`); os quatro estados (carregando, vazio, erro, sem permissão) usam o cartão do canvas, a partir de 360 px, e o axe passa nos dois temas.
- R8: a Prévia mostra o cabeçalho "Prévia da geração" com o subtítulo "<Mês>/<ano> · <unidade> · a geração é automática, todo dia, 10 dias antes de cada vencimento" (mês do primeiro vencimento previsto) e o botão "Gerar próximas mensalidades" no topo (só com cobranças completo, abre `AdvanceChargesDialog`); o seletor de período fica ao lado, com padrão de 30 dias (D7); o botão "Voltar às cobranças" sai.
- R9: três cartões: "Total previsto" (valor e "+ R$ X em relação a <mês anterior>", "− R$ X" ou "igual"), "Mensalidades" (quantidade e "N alunos não serão cobrados" ou "todos serão cobrados") e "Já gerado" (valor e "nada repete se gerar de novo"), todos em centavos (D5).
- R10: a tabela "Por dia de vencimento" tem Vencimento ("Dia N · gera em dd/mm"), Mensalidades, Total, "Diferença para <mês anterior>" (valor com sinal ou "igual") e "Ver alunos"; "gera em" é o vencimento menos 10 dias (RN-COB-02); a diferença é contra as mensalidades do mês anterior com o mesmo dia de vencimento (D8).
- R11: "Ver alunos" abre as linhas do dia (aluno, modalidade, plano, desconto, valor) com "Trocar vencimento", "Cancelar" e "Aplicar benefício" como hoje, só para cobranças completo e linha ajustável; fechar de novo recolhe (D9).
- R12: a tabela "Quem não será cobrado e por quê" tem Aluno, Modalidade e Motivo; um motivo sem texto de tradução mostra "Não será cobrado" e a tela não quebra (B14); a nota de rodapé do canvas aparece abaixo.
- R13: no celular as tabelas viram cartões compactos com as mesmas informações e ações; os quatro estados e o axe valem como em R7; a lista "Ver alunos" do celular empilha como cartão.
- R14: nenhuma regra muda: só quem tem cobranças com algum acesso vê as duas telas, no alcance das unidades; ajustes na Prévia só com completo e auditados como hoje; Professor, Aluno e Responsável recebem 403; todo texto em pt-BR; valores em centavos.

## 3. Critérios de aceite

- CA1 (R1): dado Ana (Administradora) em Tijuca, quando abre `/cobrancas/recebimentos` em 08/10/2026 (quinta), então vê "Quinta, 8 de outubro de 2026 · Unidade Tijuca · sem abertura ou fechamento de caixa" e os botões "Dia anterior" e "Exportar CSV"; não há campo de data nem "Voltar às cobranças".
- CA2 (R2): dado o dia de hoje, quando clica "Dia anterior", então o subtítulo mostra o dia anterior, a rota recebe `date` dele e aparece "Próximo dia"; clicar "Próximo dia" volta a hoje e o botão some.
- CA3 (R3): dado a tela, então "Exportar CSV" tem "Em breve", `aria-disabled` e não responde ao clique nem faz pedido.
- CA4 (R4): dado pagamentos Pix do portal, cartão de crédito e de débito do portal, boleto, dinheiro, maquininha e Pix na chave, então a tabela mostra as seis linhas do canvas (cartão crédito e débito somados), a taxa dos meios do portal e "—" nos manuais, e a linha Total com a soma de pagamentos, valor e taxa.
- CA5 (R5): dado pagamentos do portal e de duas pessoas, então "Por quem lançou" mostra "Portal (aluno pagou)" e os nomes com pagamentos e valor; dado ninguém do portal, a linha do portal não aparece (D4).
- CA6 (R6): dado a tela com pagamentos, então não há tabela "Pagamentos do dia" nem os cartões "Total recebido" e "Pagamentos".
- CA7 (R7, R14): dado "Todas as unidades", então pede para escolher a unidade; dado dia sem pagamentos, vazio do canvas; dada a API em erro, 403 e carregando, o estado correspondente; dada Professora em `/cobrancas/recebimentos`, então "sem permissão"; a 360 px sem rolagem horizontal; o axe passa nos dois temas.
- CA8 (R8): dado a Prévia de novembro de 2026 na unidade Tijuca, então vê "Novembro/2026 · Unidade Tijuca · a geração é automática, todo dia, 10 dias antes de cada vencimento", o botão "Gerar próximas mensalidades" (que abre a janela) e o seletor de período com 30 dias marcado; Professor não vê o botão.
- CA9 (R9): dado total previsto R$ 22.600,00 contra R$ 22.220,00 do mês anterior, então vê "Total previsto R$ 22.600,00 + R$ 380,00 em relação a outubro"; dado 132 mensalidades e 4 pulados, "Mensalidades 132 · 4 alunos não serão cobrados"; dado nada gerado, "Já gerado R$ 0,00 · nada repete se gerar de novo"; dado total menor ou igual, "−" ou "igual".
- CA10 (R10): dado quatro dias de vencimento, então a tabela mostra "Dia 10 · gera em 31/10", 84, R$ 14.230,00, "+ R$ 360,00"; "Dia 5 · gera em 26/10" com "igual"; e "Ver alunos" em cada linha.
- CA11 (R11): dado Administrador com completo, quando clica "Ver alunos" do dia 10, então as linhas aparecem com as três ações e "Trocar vencimento" abre a janela de hoje; clicar de novo recolhe; dado Coordenação com só consulta, as linhas aparecem sem as ações.
- CA12 (R12): dado quatro pulados, então a tabela mostra aluno, modalidade e "Bolsa de 100%", "Modalidade bloqueada por atraso", "Encerramento solicitado", "Modalidade encerrada"; dado `reason` "INVENTADO" sem chave, então a linha mostra "Não será cobrado" e a tela não fica em branco (teste do B14); a nota de rodapé aparece.
- CA13 (R13): dado 390 px, então as duas telas são cartões com as mesmas informações, sem rolagem horizontal; estados e axe passam nos dois temas.
- CA14 (R4, R14): dado Professor, Aluno ou Responsável, então `GET /billing/daily-receipts` e `GET /billing/generation-preview` respondem 403; dado Administrador de outra unidade, resposta vazia; os testes de isolamento entre organizações e perfis das duas rotas continuam passando e cobrem os campos novos.
- CA15 (R4, R9, R10): dado a API, então `GET /billing/daily-receipts` devolve `feePassedCents` em cada item de `byMethod`; `GET /billing/generation-preview` devolve `alreadyGeneratedCents` e, em cada dia, `generatesOn` (vencimento menos 10 dias) e `previousTotalCents`; nenhum campo expõe segredo.

## 4. Plano técnico

- Dados: não muda (sem migração). Usa `payment.fee_passed_cents` e `charge` já existentes.
- Especificação e contrato (primeiro, como manda o AGENTS.md): `docs/especificacao/10-cobrancas.md`: RF-COB-08 ("Pagamento online" passa a "Portal (aluno pagou)", taxa repassada por meio, total, sem lista de pagamentos no visual) e RF-COB-03 (cartão "Já gerado", "gera em", diferença por dia, janela padrão de 30 dias). `docs/openapi.yaml`: `DailyReceipts.byMethod[].feePassedCents` (obrigatório) e, em `GenerationPreview`, `alreadyGeneratedCents` e `days[].generatesOn`, `days[].previousTotalCents`; texto de `/billing/generation-preview` com o padrão de `days`.
- API:
  - `backend/src/main/java/br/com/ctcore/payment/DailyReceipts.java` (existe): `ByMethod` (linha 36) ganha `feePassedCents`; a consulta (linha ~66) acrescenta `p.fee_passed_cents` e o laço de soma acumula a taxa por meio (a lista `payments` continua igual, só leitura).
  - `backend/src/main/java/br/com/ctcore/billing/MonthlyGeneration.java` (existe): `Day` (linha 56) ganha `generatesOn` e `previousTotalCents`; `Preview` (linha 60) ganha `alreadyGeneratedCents`; em `preview` (linha ~189), `generatesOn = dueOn.minusDays(HORIZON_DAYS)`, `previousTotalCents` por uma consulta de soma das mensalidades não canceladas da unidade com `reference_month` do mês anterior e dia de `due_on` igual ao do dia, e `alreadyGeneratedCents` pela soma das mensalidades não canceladas da unidade com `due_on` entre hoje e `until` (só leitura). `HORIZON_DAYS` segue 10; o servidor mantém `days` padrão 10 (o padrão de 30 é do front, D7).
  - `DailyReceiptsController` e `ChargeController`: não mudam; `ContractRoutesTest` e `OpenApiContractTest` seguem verdes.
- Interface (`frontend/src/features/charges/`, todos existem salvo indicação):
  - `DailyReceiptsPage.tsx`: reescrita sobre `PageHeader` (subtítulo por extenso com `useUnitScope`), `ComingSoon` em "Exportar CSV", "Dia anterior" e "Próximo dia", duas tabelas lado a lado (`DataTable` que vira cartões no celular, `useBelowSm`), linha Total, estados do canvas; seletor de unidade só com "todas"; sem a lista de pagamentos.
  - `useDailyReceipts.ts`: não muda. `types.ts`: `DailyReceipts.byMethod[].feePassedCents`; `GenerationPreview.alreadyGeneratedCents`; `PreviewDay.generatesOn` e `previousTotalCents`.
  - `receiptRows.ts` (a criar): função pura que junta crédito e débito em "Cartão pelo portal", ordena os meios e monta a linha Total; teste de unidade.
  - `ChargePreviewPage.tsx`: reescrita: cabeçalho com subtítulo e botão "Gerar próximas mensalidades" no topo, três `Stat`, seletor de período (padrão 30, `PERIODS` em `useChargePreview.ts` passa a `[10, 30, 60]` com padrão 30), estados do canvas, nota de rodapé.
  - `ChargePreviewRows.tsx`: tabela "Por dia de vencimento" com "Ver alunos" (linha que expande, `aria-expanded`, linhas e ações atuais de `Line`, `ChangeDueDialog`, `CancelNextDialog`, `GrantBenefitDialog` inalterados) e tabela "Quem não será cobrado e por quê"; `reasonKey` com a queda para `OTHER` (B14) é mantido e ganha teste; cartões no celular.
  - `frontend/src/mocks/handlers.ts`: `/billing/daily-receipts` (linha ~4261) e `/billing/generation-preview` (linha ~4214) acrescentam os campos novos; `frontend/src/mocks/cenarios/cobrancas.ts` ganha dados do canvas (pagamentos de seis meios e três lançadores; quatro dias de vencimento e quatro pulados); `dailyReceipts.msw.test.ts`, `billing.msw.test.ts` e `cenarios-cobrancas.msw.test.ts` cobrem os campos.
  - `frontend/src/i18n/pt-BR.json` (`charges.daily.*`, `charges.preview.*`): textos do canvas e rótulos de meio da tela (`charges.daily.method.*`); saem as chaves não usadas (`byMethod`, `byRegistrar`, `list`, `date`, `back`, `total`, `count`, `online`, `diff`, `dayTitle`, `periodOption` se sobrar sem uso); o lint de texto literal passa.
  - `frontend/visual/casos.ts`: `cobrancas-recebimentos` e `cobrancas-previa` sem `limiteCanvas` (ou com, se sobrar divergência que outra issue da 10.5 remove, regra 4 do AGENTS.md); capturas em `.capturas/479/` (pt-BR); `npm run test:visual:docker -- -g "cobrancas-recebimentos|cobrancas-previa"` sem `--update-snapshots` antes do push, depois com `--update-snapshots` só dessas telas; `visual:canvas -- --exige`.
  - Testes: `DailyReceiptsPage.test.tsx`, `ChargePreviewPage.test.tsx`, `receiptRows.test.ts`, `src/test/a11y.test.tsx`, `visual/casos.test.ts` e o `e2e` que toque as duas telas (busca por `recebimentos` e `previa` em `frontend/e2e/`).
- Segurança: permissão e alcance conferidos no servidor como hoje (`COLLECTIONS` com algum acesso na consulta, completo nos ajustes); os campos novos são totais da unidade e não expõem dado novo de pessoa; nenhuma rota nova, nenhuma ação nova que grave; dados de teste fictícios.
- Reuso: `PageHeader`, `Stat`, `ComingSoon`, `DataTable` e cartões da #458, estados do canvas (#464), `useUnitScope`, `useBelowSm`, `AdvanceChargesDialog`, `ChangeDueDialog`, `CancelNextDialog`, `GrantBenefitDialog`, `ChargesPage.tsx` (#476) como modelo.
- Riscos: a diferença por dia depende de o dia de vencimento do mês anterior existir (mês com 28 dias: o dia 30 compara com nada, mostra a diferença cheia, D8); "Já gerado" pode vir diferente de 0 em produção porque a tarefa diária já gerou o que vence em 10 dias (D5); a comparação com o canvas depende de dados do MSW iguais aos do canvas (132 mensalidades, R$ 22.600,00; 18 pagamentos, R$ 3.292,00).

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

- [x] T1: Parte A, contrato e servidor: `docs/especificacao/10-cobrancas.md` (RF-COB-03, RF-COB-08), `docs/openapi.yaml`, `DailyReceipts.java` (`feePassedCents`) e `MonthlyGeneration.java` (`generatesOn`, `previousTotalCents`, `alreadyGeneratedCents`); casos novos em `DailyReceiptsIT` (taxa por meio) e `GenerationPreviewIT` (gera em, diferença por dia, já gerado); isolamento e 403 seguem em `DailyReceiptsIsolationIT` — cobre CA14, CA15 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='DailyReceiptsIT,DailyReceiptsIsolationIT,GenerationPreviewIT'` e `-Dtest='OpenApiContractTest,ContractRoutesTest'`
- [x] T2: Parte A, MSW e tipos: `types.ts`, `handlers.ts` (os dois handlers), `cenarios/cobrancas.ts` com os dados do canvas e testes MSW — cobre CA15 e dá dados a CA4, CA5, CA9, CA10, CA12 — prova: `npm test -- dailyReceipts.msw billing.msw cenarios-cobrancas` (de dentro de `frontend/`)
- [x] T3: Parte B, Recebimentos do dia: `receiptRows.ts` com teste, `DailyReceiptsPage.tsx` (cabeçalho, "Dia anterior", "Próximo dia", "Exportar CSV" Em breve, duas tabelas, cartões no celular, estados), pt-BR e testes — cobre CA1 a CA7, CA13 — prova: `npm test -- receiptRows DailyReceiptsPage`
- [x] T4: Parte C, Prévia: `ChargePreviewPage.tsx` (cabeçalho, botão no topo, três `Stat`, período 30) e `useChargePreview.ts`, pt-BR — cobre CA8, CA9 — prova: `npm test -- ChargePreviewPage`
- [x] T5: Parte C, tabelas da Prévia: `ChargePreviewRows.tsx` ("Por dia de vencimento" com "Ver alunos", "Quem não será cobrado e por quê", nota, cartões no celular, teste do motivo sem chave) — cobre CA10, CA11, CA12, CA13 — prova: `npm test -- ChargePreviewPage AdvanceChargesDialog`
- [x] T6: Parte D, visual: casos de `visual/casos.ts` (recebimentos e prévia, 1440 e 390 px), capturas em `.capturas/479/` com o navegador em pt-BR, `npm run test:visual:docker -- --update-snapshots -g "cobrancas-recebimentos|cobrancas-previa"` só dessas telas, `npm run visual:canvas -- --exige`, axe nos dois temas — cobre CA1, CA8, CA9, CA10, CA13 — prova: `npm run test:visual:docker -- -g "cobrancas-recebimentos|cobrancas-previa"` e `npm test -- casos a11y`
- [x] T7: Parte D, regressão: `npm run lint && npm run typecheck && npm run build && npm run test:cov` e o e2e que toque as telas; conferir que nenhuma chave de tradução ficou sem uso — não cobre critério: fecha o item com a regressão do front que o CI exige — prova: `npm run lint && npm run typecheck && npm run test:cov` e `npm run e2e`

## 6. Decisões

- D1 (muda o comportamento): o campo de data nativo e "Voltar às cobranças" saem de Recebimentos do dia, porque o canvas não os tem; a navegação é "Dia anterior" e, só quando o dia não é hoje, "Próximo dia" (extra para poder voltar a hoje). O retorno às Cobranças é pelo breadcrumb. Alternativa descartada: manter o campo de data (não está no canvas); sem "Próximo dia" não haveria como voltar a hoje sem recarregar.
- D2: crédito e débito do portal aparecem somados em "Cartão pelo portal" (o canvas tem uma linha só); a taxa é a repassada gravada em `payment.fee_passed_cents` (o canvas mostra "—" quando é zero, nos meios manuais). Alternativa descartada: duas linhas de cartão (diverge do canvas).
- D3: o rótulo "Portal (aluno pagou)" substitui "Pagamento online"; a RF-COB-08 muda primeiro. É texto, não regra. Alternativa descartada: manter "Pagamento online" (o canvas vence em texto, R1).
- D4: o canvas lista também quem pode lançar e não lançou ("Rafael Duarte (não lança) 0 —"); o servidor devolve só quem teve pagamento no dia, e listar quem tem permissão exigiria resolver a permissão de cada pessoa da unidade. Fica fora; a diferença entra na comparação com o canvas e no PR. Se o dono quiser, vira item de produto (a API passaria a devolver os lançadores da unidade).
- D5 (muda o comportamento): "Já gerado" é a soma das mensalidades não canceladas da unidade com vencimento entre hoje e o fim da janela da prévia, calculada no servidor (`alreadyGeneratedCents`); a especificação não definia esse número. Suposição: com a tarefa diária rodando, o valor tende a ser maior que zero para vencimentos em até 10 dias; se o dono quiser outra leitura (por exemplo, só o mês de referência), muda só a consulta. Alternativa descartada: texto fixo "R$ 0,00" (dado falso).
- D6 (muda o comportamento): a tabela "Pagamentos do dia" e os cartões "Total recebido" e "Pagamentos" saem, porque o canvas não os tem; a API continua devolvendo `payments`, `totalCents` e `count`. O total do dia fica na linha Total da tabela "Por meio". Alternativa descartada: manter a lista abaixo das tabelas (o canvas vence em layout, R1). Se o dono quiser a lista, volta como seção.
- D7 (muda o comportamento): o período da prévia passa a ter 30 dias como padrão no front (antes 10), porque o canvas mostra um mês de vencimentos (dias 1, 5, 10 e 15 com "gera em" de 22/10 a 05/11); o seletor 10, 30 e 60 dias fica ao lado do botão (o canvas não o tem, a RF-COB-03 fala em "próximos dias"). O servidor segue com padrão 10. Alternativa descartada: tirar o seletor (perde a faixa curta e a longa da RF-COB-03).
- D8: "Diferença para <mês anterior>" por dia compara com as mensalidades não canceladas do mês anterior com o mesmo dia de vencimento; no cartão "Total previsto" continua o `previousMonthTotalCents` já existente (mês inteiro). Mês anterior sem aquele dia (30 ou 31 em fevereiro) não tem comparação, e a diferença é o valor todo. Alternativa descartada: comparar por posição na lista (sem sentido).
- D9: "Ver alunos" expande a própria linha do dia em vez de abrir outra tela, mantendo as ações atuais de `Line`. O canvas mostra só o botão; a nota "abra Ver alunos" pede um lugar para ajustar, e o inline evita nova rota. Alternativa descartada: gaveta ou janela (o canvas não define; mais código).
- D10: o canvas das duas telas só existe em 1440 px e claro; no celular e no escuro seguem os componentes base (AGENTS.md, tela sem canvas).
- B14: já está tratado em `ChargePreviewRows.tsx` (`reasonKey` cai em `OTHER` quando `i18n.exists` é falso); este item mantém e fixa com teste (CA12), sem mexer em fornecedor ou regra.
- Suposição: o canvas é da unidade Tijuca; a captura do sistema usa Ana com o escopo do MSW e o texto do escopo vem de `useUnitScope`. Se o limite padrão do `visual:canvas` reprovar por nome de aluno, unidade ou dado, usar `limiteCanvas` com motivo conforme a regra 4 do AGENTS.md.
- Suposição: o MSW pode ganhar os dados do canvas sem quebrar outros testes que contam linhas do cenário `cobrancas`; se quebrar, o cenário novo fica separado em `cobrancas-recebimentos`.

## Construção

- T1 — arquivos: `docs/especificacao/10-cobrancas.md`, `docs/openapi.yaml`, `DailyReceipts.java`, `MonthlyGeneration.java`, `DailyReceiptsIT`, `GenerationPreviewIT` — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='DailyReceiptsIT,DailyReceiptsIsolationIT,GenerationPreviewIT' -Dtest='OpenApiContractTest,ContractRoutesTest'` → 10 IT e 7 testes de contrato passaram
- T2 — arquivos: `types.ts`, `mocks/handlers.ts`, `mocks/cenarios/cobrancas.ts`, testes `dailyReceipts`, `chargePreview`, `cenarios-cobrancas` — prova: `npx vitest run src/mocks` → 338 passaram (o caso CA11 do cenário passou a esperar os 7 meios)
- T3 — arquivos: `receiptRows.ts` e teste, `DailyReceiptsPage.tsx` e teste, `pt-BR.json` (`charges.daily`) — prova: `npx vitest run src/features/charges/DailyReceiptsPage src/features/charges/receiptRows` → 11 passaram
- T4 e T5 — arquivos: `ChargePreviewPage.tsx`, `ChargePreviewRows.tsx`, teste, `pt-BR.json` (`charges.preview`) — prova: `npx vitest run src/features/charges` → 135 passaram
- T6 — arquivos: `visual/casos.ts` (os dois casos passam a `admin`, unidade única), 8 referências — prova: `test:visual:docker -- --update-snapshots -g "cobrancas-recebimentos|cobrancas-previa"` e depois sem `--update-snapshots` → 8 passaram; `npm run visual:canvas` → 135 comparadas, 0 reprovadas; `npx vitest run visual/casos` → passou
- T7 — `npm run lint`, `typecheck`, `build` → ok; `npm run e2e` → 98 passaram; `test:cov` → 2385 de 2387 (ver abaixo); cobertura de `features/charges` com as 473 provas de charges e mocks → 100% das linhas

Regressão: `test:cov` completo teve 2 falhas fora do item (`LoginPage.test.tsx` "trava com horário" e `EnrollmentWizardPage.test.tsx` "menor sem responsável"), que passaram rodadas sozinhas (46 testes): instáveis sob carga da suíte inteira (regra 5 do AGENTS.md, anotar no PR). Um teste do item (`CA16` da Prévia) também falhou uma vez com mais de um `role=status` sob carga; passou a usar `getAllByRole`. Não rodei `mvnw verify` completo, só os IT do item e os de contrato.
Desvios: (1) Os dois casos visuais usam `admin@exemplo.com` (com Ana/Coordenação o escopo é "Todas as unidades" e a tela pede a unidade; o canvas é de Administrador em uma unidade). (2) "Ver alunos" pode abrir vários dias ao mesmo tempo (conjunto, não um só). (3) Os pagamentos do portal do cenário são recibos extras ligados a cobranças já pagas, para não mudar a lista de Cobranças. (4) `previousTotalCents` compara por `due_on` exato do mês anterior (mesmo dia), sem filtrar o `reference_month`. (5) Sem `limiteCanvas`: o limite padrão do `visual:canvas` aprovou; a comparação lado a lado foi conferida a olho em 1440 px.
Divergências com o canvas (dados do MSW, não de layout): totais, quantidades e nomes (o canvas tem 132 mensalidades e R$ 22.600,00; 18 pagamentos e R$ 3.292,00; Tijuca; "Rafael Duarte (não lança)" com 0, D4); "Bolsa de 100% até 12/2026" sem a data (a API não traz); ícones de "Exportar CSV" e do botão de gerar; a janela de 30 dias do MSW mostra dois meses (dias 1, 5 e 10 repetidos). Sistema e canvas em `.capturas/479/` (`recebimentos` e `previa`, 1440 sistema e canvas, 390 sistema; não há canvas de 390).
Referências visuais: `frontend/visual/referencias/cobrancas-recebimentos-{390,1440}-{claro,escuro}.png` e `cobrancas-previa-{390,1440}-{claro,escuro}.png`
Visual do CI: cobrancas-recebimentos → passou; cobrancas-previa → passou
Docker: imagens iguais antes e depois (nenhuma imagem nova).
Não é do item: nada.

## Verificação

### Rodada 1 — OK — 2026-11-14, estado 213eb93d339ea47c91b5947a8e855659627dbfdd

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA3, CA6 | PASSOU | `DailyReceiptsPage.test.tsx` e captura `.capturas/479/recebimentos-1440-sistema.png` (subtítulo por extenso, Dia anterior, Exportar CSV Em breve, sem lista nem data) |
| CA4, CA5 | PASSOU | `receiptRows.test.ts`, cenário MSW; captura mostra seis meios, Total e "Portal (aluno pagou)" |
| CA7, CA13 | PASSOU | testes das páginas, a11y e visual 390/1440 claro/escuro (8 passaram) |
| CA8 a CA12 | PASSOU | `ChargePreviewPage.test.tsx` (B14 coberto), captura da Prévia com cartões, "gera em", diferença, Ver alunos, motivos, nota |
| CA14, CA15 | PASSOU | `DailyReceiptsIT` 6, `GenerationPreviewIT` 3, `DailyReceiptsIsolationIT` 1; contrato 7 |

Comandos: vitest charges, mocks, visual/casos, a11y → 74 arquivos, 618 passaram; `npm run lint` e `typecheck` → ok; cobertura de `features/charges` → 100% das linhas; `mvnw verify -Dit.test=... -Dtest=OpenApiContractTest,ContractRoutesTest` → testes passaram (o JaCoCo global reprova só por rodada parcial); `test:visual:docker -- -g "cobrancas-recebimentos|cobrancas-previa"` sem update → 8 passaram. Capturas lado a lado abertas: estrutura confere com o canvas; diferenças são só dados do MSW (já listadas em Construção). Nenhum e2e toca as duas telas. Não rodei `test:cov` nem `verify` completos.
Achados:
- sugestão, código, `charges.preview.cardLine` — o cartão do celular mostra "1 mensalidades" (sem plural).
- sugestão, código, `ChargePreviewRows.tsx` — "Ver alunos" usa botão `ghost`; confira o estilo contra o canvas se quiser igualar.

## Entrega

- **O que muda:** Recebimentos do dia e Prévia da geração seguem o canvas: seis meios de pagamento com total e "Portal (aluno pagou)", Dia anterior, Exportar CSV "Em breve" (recebimentos); cartões, "gera em", diferença para o mês anterior, "Ver alunos", motivos e nota (prévia). API em `docs/openapi.yaml` e `docs/especificacao/10-cobrancas.md`; handlers e cenários MSW alinhados; `receiptRows.ts` novo.
- **Verificação:** rodada 1 `OK` (estado `213eb93d`), sem mudança de código desde então. Vitest de charges, mocks, visual e a11y: 618 passaram; lint e typecheck ok; cobertura de `features/charges` 100% das linhas; `DailyReceiptsIT` 6, `GenerationPreviewIT` 3, `DailyReceiptsIsolationIT` 1, contrato 7; `visual:canvas` 135 comparadas, 0 reprovadas; teste visual local dos 8 casos passou sem `--update-snapshots`; Visual do CI: `cobrancas-recebimentos` passou, `cobrancas-previa` passou.
- **Decisões:** os casos visuais usam `admin@exemplo.com` (unidade única, como o canvas); "Ver alunos" pode abrir vários dias ao mesmo tempo; `previousTotalCents` compara pelo `due_on` do mesmo dia no mês anterior, sem filtrar `reference_month`.
- **Divergências com o canvas (dados do MSW, não layout):** totais e quantidades (canvas: 132 mensalidades e R$ 22.600,00; 18 pagamentos e R$ 3.292,00); unidade Tijuca; "Bolsa de 100% até 12/2026" sem a data (a API não traz); ícones de Exportar CSV e de gerar; a janela de 30 dias do MSW mostra dois meses. Capturas em `.capturas/479/`.
- **Achados não aplicados:** "1 mensalidades" sem plural no cartão do celular (`charges.preview.cardLine`); o botão "Ver alunos" usa `ghost`, sem conferência com o canvas.
- **Regressão:** a base não avançou desde a verificação, então a regressão não foi rodada de novo. `test:cov` completo teve duas falhas fora do item, que passaram isoladas: `LoginPage.test.tsx` "trava com horário" (instabilidade já registrada na #563) e `EnrollmentWizardPage.test.tsx` "menor sem responsável" (#519). Um teste do item (CA16 da Prévia) falhou uma vez sob carga e passou a usar `getAllByRole`. Não rodado `mvnw verify` completo, só os IT do item e os de contrato.

**Verificações do PR (#576, `51fc78d`, run 43632724000): `ci-gate` falhou (código 1).**
- `backend`: `br.com.ctcore.communication.AnnouncementSendJobIT.sendsDueOnce:54`, `expected: 1 but was: 0` (log: `announcement send failed ... cause=IllegalStateException`). Teste fora deste item (comunicados).
- `visual`: 4 falhas em `cobranca-antecipar` (1440 claro, 1440 escuro, 390 claro, 390 escuro), `toHaveScreenshot` com 19389 pixels diferentes (ratio 0.02) no 1440 claro. Caso de outro item (cobranças), não da tela de recebimentos/prévia.
- Ação: rodar de novo o que falhou (`AnnouncementSendJobIT`, `cobranca-antecipar`) antes de corrigir código; se persistir, abrir issue de regressão. Sem mudança de código neste passo.

### Correção da entrega

- `cobranca-antecipar` (visual do CI) — causa real, não instabilidade: a janela "Gerar próximas mensalidades" abre sobre `/cobrancas/previa`, que este item reescreveu, então o fundo da referência mudou. Reproduzido localmente (`test:visual:docker -- -g "cobranca-antecipar"` → 4 falharam). Regerado só esse caso — arquivos: `frontend/visual/referencias/cobranca-antecipar-{390,1440}-{claro,escuro}.png` — prova: `test:visual:docker -- --update-snapshots -g "cobranca-antecipar"` e depois, sem update, `-g "cobranca-antecipar|cobrancas-recebimentos|cobrancas-previa"` → 12 passaram; `npm run visual:canvas -- --exige` → 135 comparadas, 0 reprovadas (o `limiteCanvas` do caso segue valendo).
- `AnnouncementSendJobIT.sendsDueOnce` (backend do CI) — fora do item (comunicados). Rodado 2 vezes local: `mvnw verify -Dit.test=AnnouncementSendJobIT` → 2 testes passaram nas duas. Instável sob o CI (regra 5 do AGENTS.md): sem mudança de código; rodar o CI de novo, e se falhar outra vez abrir issue `técnica`.
Referências visuais: `frontend/visual/referencias/cobranca-antecipar-{390,1440}-{claro,escuro}.png`
Visual do CI: cobranca-antecipar → passou; cobrancas-recebimentos → passou; cobrancas-previa → passou
Docker: imagens do compose e do projeto inalteradas; nada novo a remover.

### Rodada 2 — OK — 2026-11-14, estado aa470a7318f1f0f52e0c1c1b048a6de3a78e08df

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA15 | PASSOU (mantido da rodada 1) | desde a rodada 1 só mudaram as 4 referências `cobranca-antecipar-{390,1440}-{claro,escuro}.png` e o arquivo do item; nenhum código |

Comandos: `npm run test:visual:docker -- -g "cobranca-antecipar|cobrancas-recebimentos|cobrancas-previa"` (sem update) → 12 passaram; `npx vitest run src/features/charges --maxWorkers=2` → 14 arquivos, 135 passaram. Referência `cobranca-antecipar-1440-claro.png` aberta: a janela "Gerar próximas mensalidades" sobre a nova Prévia, sem divergência de layout inesperada. Backend e `AnnouncementSendJobIT` não foram tocados; instabilidade fora do item, tratada pela regra 5 (aceitar CI).
Instáveis: `AnnouncementSendJobIT.sendsDueOnce` (1 falha no CI, 2 passes locais, registrado na Entrega).
Achados:
- sugestão, código, `charges.preview.cardLine` — "1 mensalidades" sem plural (mantida da rodada 1).
- sugestão, código, `ChargePreviewRows.tsx` — "Ver alunos" em `ghost` (mantida da rodada 1).
