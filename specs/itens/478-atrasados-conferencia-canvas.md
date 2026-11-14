# 478 — Em atraso, conferência de comprovantes e comprovante de várias cobranças no visual do canvas

Origem: issue #478 (Sprint 10.5, Fase 3, plano F3), `docs/auditoria/plano-de-issues.md`, `docs/auditoria/decisoes-canvas.md` (R1 a R4); evidências M14, M71, M72. Branch: `item/478-atrasados-conferencia-canvas`. Canvas: `Atrasados` (1440 px), `EmConferencia` (1440 px), `ComprovanteVarias` (janela, 1440 px) e `GMConferencia` (celular, 360 px; a captura é a 390, D5 da #435). Não há canvas de celular de Atrasados. Dependências #449, #450, #458, #459, #460, #461 já estão fechadas e em `dev` (`ComingSoon`, `RowCard`/tabela em cartões, `PersonRow`, `Modal` com `size`/`footer`, `SummaryBox`). Os casos `cobrancas-atrasados` e `cobrancas-conferencia` já existem em `frontend/visual/casos.ts`.

Uma especificação, uma entrega; a construção se divide em partes (A a D, nas tarefas).

## 1. Objetivo

Deixar Financeiro › Cobranças › Em atraso e Em conferência iguais ao canvas, para Coordenação e Administração, em 1440 px e 390 px e no tema claro (o canvas não tem escuro dessas telas). Em atraso passa a ter o aviso dos lembretes automáticos, a tabela Aluno, Atraso, Valor, Último lembrete e Bloqueio, as ações "Lembrete" (WhatsApp, mensagem pronta), "Registrar" e "Renegociar" por linha, a seleção múltipla e o "Enviar lembrete" como hoje (RF-COB-06) e o painel "Mensagem pronta do lembrete". Em conferência passa a mostrar o primeiro comprovante em destaque para confirmar ou recusar, a lista "Também aguardando" e a janela "Conferir comprovante", em que um comprovante enviado para várias cobranças aparece agrupado e cada cobrança é decidida uma a uma (RN-COB-14). Nenhuma regra de negócio muda.

Fora do escopo: texto do WhatsApp editável (fica "Em breve", D6); o botão "Enviar lembrete por e-mail a todos" do canvas (o dono manteve a seleção múltipla da RF-COB-06; se for o caso, vira item de produto separado, D2); ver o extrato bancário; estorno; canvas escuro dessas telas; mudar o servidor para gravar um comprovante por arquivo (a gravação segue uma linha por cobrança, RN-COB-14).

## 2. Requisitos

- R1: Em atraso mostra o cabeçalho "Em atraso" com o subtítulo "<escopo de unidade> · N cobranças · R$ total" (total do filtro, não só da página), e o link para voltar às Cobranças; sem breadcrumb próprio além do da barra (D1).
- R2: o aviso dos lembretes automáticos (texto do canvas) traz o link "Configurar" para as configurações da unidade, onde ficam os dias dos lembretes (D5).
- R3: a tabela tem as colunas Aluno (avatar colorido, nome e "Modalidade · Unidade"), Atraso ("N dias"), Valor, Último lembrete ("dd/mm · e-mail", "hoje · e-mail", "dd/mm · e-mail com problema", "—" se nunca) e Bloqueio ("Bloqueada" com 0 dia, "Bloqueia em N dias" até 5 dias, "em N dias" depois, "—" sem prazo), com a coluna de seleção como hoje (D2), sem a unidade, a referência e o vencimento como colunas; os valores não quebram em duas linhas a 1440 px (D3).
- R4: cada linha tem "Lembrete" (abre a conversa do WhatsApp com a mensagem pronta; some sem telefone válido ou com WhatsApp desligado, RN-COM-03), "Registrar" (abre Registrar pagamento) e, na cobrança já bloqueada, "Renegociar" no lugar de "Registrar" (abre Renegociar), como no canvas (D4).
- R5: abaixo da tabela, "Mensagem pronta do lembrete" mostra o texto do WhatsApp da cobrança escolhida (a primeira por padrão; clicar numa linha escolhe) e "Editar texto" fica visível e desabilitado com "Em breve" (D6).
- R6: a seleção múltipla e o botão "Enviar lembrete" (e-mail às cobranças marcadas, até 100, resultado por cobrança) continuam como hoje, sem mudança de regra nem de `SendReminderDialog` (RF-COB-06, D2).
- R7: no celular a tabela vira cartões compactos com as mesmas informações e ações; os quatro estados (carregando, vazio, erro, sem permissão) usam o cartão do canvas, a partir de 360 px, e o axe passa.
- R8: Em conferência mostra o cabeçalho "Em conferência", o subtítulo "Comprovantes de Pix na chave da unidade · N aguardando" (N = comprovantes agrupados, D7), o texto explicativo do canvas e o link para voltar.
- R9: o primeiro comprovante da fila aparece em destaque: a imagem do comprovante em tamanho de conferência (ou "Imagem indisponível"), aluno com avatar, "Unidade · Modalidade · mês", selo "Em conferência", Valor da cobrança, Enviado em ("dd/mm/aaaa às HHhMM pelo portal"), Chave da unidade, Prazo de bloqueio ("pausado enquanto estiver em conferência"), o aviso "Confira no extrato do banco da <unidade> se o valor entrou antes de confirmar." e os botões "Confirmar pagamento" e "Recusar" (D8).
- R10: "Também aguardando" lista os demais comprovantes (Aluno, Cobrança, Valor, Enviado: "hoje", "ontem" ou "dd/mm") cada um com "Conferir", que abre a janela "Conferir comprovante".
- R11: um comprovante enviado de uma vez para várias cobranças do mesmo aluno (mesmo instante de envio) é mostrado como um só item, com a cobrança "Jiu-Jitsu e Muay Thai · out/2026" e o valor somado; o servidor continua gravando e decidindo um por cobrança (RN-COB-14, D7).
- R12: a janela "Conferir comprovante" (aluno, "Unidade · enviado pelo portal em dd/mm às HHhMM", selo "N comprovante · N cobranças", cartão "Comprovante Pix · R$ total", uma linha por cobrança com "vence dd/mm", valor, Confirmar e Recusar, o aviso "Cada cobrança é decidida uma a uma…" e "Fechar") deixa decidir cada cobrança separadamente; Confirmar e Recusar usam as janelas de confirmação e de motivo de hoje (RN-COB-13: Recusar exige motivo de 3 a 200 caracteres e o prazo do bloqueio volta de onde parou).
- R13: no celular a lista é a do canvas `GMConferencia` (cabeçalho com unidade e contagem, "N comprovantes", cartões com avatar, aluno, "Modalidade · mês · enviado hoje HHhMM", valor, "Comprovante", Confirmar e Recusar); os quatro estados e o axe valem como em R7.
- R14: nenhuma regra muda: Confirmar grava o meio Pix na chave, a origem portal e quem confirmou; Recusar devolve a cobrança a aberta; só quem tem cobranças completo na unidade confirma, recusa ou envia lembrete; Professor, Aluno e Responsável recebem 403; todo texto em pt-BR; valores em centavos; ações auditadas como hoje.

## 3. Critérios de aceite

- CA1 (R1): dado Ana (Administradora) com 11 cobranças em atraso, quando abre `/cobrancas/atrasados`, então vê "Em atraso", o subtítulo com o escopo, "11 cobranças" e a soma de todas (não só da página).
- CA2 (R2): dado o aviso, quando clica "Configurar", então vai às configurações da unidade.
- CA3 (R3): dado cobranças em atraso, então cada linha mostra avatar e "Muay Thai · Tijuca", "59 dias", "R$ 160,00" numa linha só a 1440 px, o último lembrete ("05/10 · e-mail"; "hoje · e-mail"; "e-mail com problema" quando o último envio falhou por endereço com problema) e o bloqueio ("Bloqueada" com 0 dia; "Bloqueia em 2 dias"; "em 18 dias"; "—" sem prazo); a coluna de seleção continua à esquerda.
- CA4 (R4): dado Bruno com telefone válido, quando clica "Lembrete", então abre `wa.me` com a mensagem pronta dele; sem telefone ou com WhatsApp desligado, o botão não aparece; dado cobrança com bloqueio 0, então a linha tem "Renegociar" e as demais "Registrar"; "Registrar" abre Registrar pagamento e "Renegociar" abre Renegociar, e ao concluir a lista recarrega.
- CA5 (R5): dado a lista, então "Mensagem pronta do lembrete" mostra o texto da primeira cobrança; clicar noutra linha troca o texto; "Editar texto" tem "Em breve", `aria-disabled` e não responde ao clique.
- CA6 (R6): dado 3 cobranças marcadas, quando clica "Enviar lembrete" e confirma, então o pedido leva os 3 ids e a tela mostra o resultado por cobrança, como hoje; dado nenhuma marcada ou mais de 100, o botão fica desabilitado; "Selecionar todos" marca as da página.
- CA7 (R7): dado 390 px, então a lista são cartões com as mesmas informações e ações, sem rolagem horizontal; dada a API em erro, 403, lista vazia e carregando, então aparece o estado correspondente do canvas; dada Professora em `/cobrancas/atrasados`, então vê "sem permissão"; o axe passa nos dois temas.
- CA8 (R8, R9): dado 3 comprovantes pendentes, quando abre `/cobrancas/conferencia`, então vê "Comprovantes de Pix na chave da unidade · 3 aguardando", o texto explicativo e, em destaque, o primeiro com imagem, aluno, "Barra · Jiu-Jitsu · out/2026", selo, valor, enviado em, chave da unidade, o prazo pausado, o aviso do extrato com o nome da unidade e os botões.
- CA9 (R9, R14): dado o destaque, quando clica "Confirmar pagamento", então abre a confirmação (com a opção do recibo por e-mail) e, ao concluir, a fila recarrega sem o item; quando clica "Recusar", exige motivo de 3 a 200 caracteres e, ao concluir, o item sai; dado comprovante sem imagem, então vê "Imagem indisponível" e os botões continuam.
- CA10 (R10): dado os outros dois, então "Também aguardando" mostra Aluno, Cobrança, Valor e Enviado ("ontem", "06/10") e "Conferir" abre a janela.
- CA11 (R11): dado dois comprovantes do mesmo aluno com o mesmo instante de envio, então aparecem como um só item "Jiu-Jitsu e Muay Thai · out/2026 · R$ 360,00"; dado dois do mesmo aluno em instantes diferentes, então são dois itens; a contagem de "aguardando" conta itens agrupados.
- CA12 (R12): dado o item agrupado, quando clica "Conferir", então a janela mostra "1 comprovante · 2 cobranças", o cartão "Comprovante Pix · R$ 360,00" e duas linhas com "vence 10/10", valor, Confirmar e Recusar; confirmar uma cobrança deixa a outra pendente na janela; recusar a outra pede o motivo e só ela volta a contar o prazo; ao decidir a última, a janela fecha e a fila recarrega; "Fechar" fecha sem decidir.
- CA13 (R13, R7): dado 390 px, então a conferência mostra o cabeçalho com unidade e contagem, "3 comprovantes" e os cartões do canvas, com "Comprovante" abrindo a imagem; os quatro estados e o axe passam nos dois temas.
- CA14 (R14): dado Professor, Aluno ou Responsável, então `GET /charges/overdue` e `GET /payment-proofs` respondem 403; dado Administrador de outra unidade, então não vê as cobranças nem os comprovantes dela; os testes de isolamento entre organizações e perfis das duas rotas continuam passando e cobrem os campos novos.
- CA15 (R3, R9, R14): dado a API, então `GET /charges/overdue` devolve `modality`, `lastReminder.status` e `lastReminder.reason` (último lembrete de qualquer resultado) e `totalCents` do filtro, e `GET /payment-proofs` devolve `unitPixKey`; nenhum campo expõe segredo.

## 4. Plano técnico

- Dados: não muda (sem migração). `unit_settings.pix_key`, `charge_reminder` e `payment_proof` já existem.
- Especificação e contrato (primeiro, como manda o AGENTS.md): `docs/especificacao/10-cobrancas.md`: RF-COB-05 (comprovantes agrupados no visual, destaque, janela de conferência, chave da unidade); RF-COB-06 não muda (seleção múltipla e "Enviar lembrete" ficam, D2); RN-COB-14 não muda. `docs/openapi.yaml`: `OverdueCharge` ganha `modality` ({id, name}, nulo) e `lastReminder.status` (SENT, SKIPPED) e `reason` (nulo ou NO_ADDRESS, EMAIL_PROBLEM, NO_PHONE, SMS_LIMIT); `OverdueList` ganha `totalCents`; `PaymentProof` ganha `unitPixKey` (nulo).
- API:
  - `backend/src/main/java/br/com/ctcore/billing/OverdueCharges.java` (existe): `LastReminder` (linha 41) ganha `status` e `reason`; `Item` (linha 45) ganha `modality`; `OverdueList` (linha 48) ganha `totalCents`; em `list`, o `left join lateral` de `charge_reminder` (linha ~100) passa a pegar o último de qualquer `status` (a trava de 24 horas do `send` continua olhando só `SENT`), o `select` acrescenta a modalidade (`charge.modality_row_id` até o nome da modalidade, nula nas avulsas) e uma segunda consulta soma `c.amount_cents` do mesmo `where` (só leitura).
  - `backend/src/main/java/br/com/ctcore/payment/PaymentProofs.java` (existe): `Proof` (linha 68) ganha `unitPixKey`; `SELECT` (linha ~75) junta `unit_settings` e `map` o preenche. A chave vem só na rota da gestão, que já exige cobranças completo.
  - Controladores `ChargeController` e `PaymentProofController`: não mudam (os registros são devolvidos como estão); `ContractRoutesTest` e `OpenApiContractTest` seguem verdes.
- Interface (`frontend/src/features/`, todos existem salvo indicação):
  - `charges/OverduePage.tsx`: reescrita sobre `PageHeader` (subtítulo com `useUnitScope`), aviso com "Configurar", `QueryPage` mantendo a seleção e sem filtro de unidade (a unidade vem do escopo da barra, como `ChargesPage` da #476), colunas novas, `onRowClick` para escolher a mensagem, cartões no celular, estados do canvas (`canvasStates`); o painel "Mensagem pronta do lembrete" com `ComingSoon` em "Editar texto".
  - `charges/OverdueRows.tsx`: `Select` (seleção) fica; `Student` passa a `Person` com "Modalidade · Unidade"; entram `LateCell`, `BlockCell` e `LastReminder` com o texto do canvas; `Whatsapp` vira o botão "Lembrete"; entra `RowActions` (Registrar ou Renegociar); `OverdueCard` vira o cartão compacto.
  - `charges/ChargeRowMenu.tsx`: extrair o trecho que monta `RegisterPaymentDialog` e `RenegotiateDialog` (hoje inline, linhas ~110 a 150) para um componente `ChargeActionDialogs` (a criar no mesmo arquivo ou em `ChargeActionDialogs.tsx`) usado também por `RowActions`; para a janela de Renegociar, que pede `ChargeRow`, `RowActions` monta o `ChargeRow` mínimo a partir de `OverdueCharge` (o painel `ChargePanel` já mostra esse caminho). `ChargeRowMenu.test.tsx` continua verde.
  - `charges/types.ts`: `OverdueCharge.modality`, `lastReminder.status/reason`, `OverdueList.totalCents`; `charges/useOverdue.ts`: `fetchOverdue` devolve o total em reais (subtítulo).
  - `charges/SendReminderDialog.tsx` e `useChargeActions.ts`: não mudam (D2).
  - `payment-proofs/PaymentProofsPage.tsx`: reescrita: cabeçalho, texto explicativo, destaque, "Também aguardando" e lista de cartões no celular; busca `GET /payment-proofs` com `size=100` (D7) em vez de `QueryPage`, com os quatro estados do canvas.
  - `payment-proofs/groupProofs.ts` (a criar): `groupProofs(list)` agrupa por `studentId` e `sentAt`, na ordem de envio; devolve `{ key, studentName, unit, sentAt, items, totalCents, label }`; teste de unidade.
  - `payment-proofs/ProofFeatured.tsx` (a criar): cartão em destaque (R9); `payment-proofs/ProofReviewDialog.tsx` (a criar): janela "Conferir comprovante" (R12) sobre `Modal` (`size`, `footer`) e `SummaryBox`; `payment-proofs/ProofRows.tsx` (a criar): linha de "Também aguardando" e cartão do celular.
  - `payment-proofs/ProofImage.tsx`: ganha a variante grande (conferência), mantendo "Imagem indisponível", PDF ("Abrir arquivo") e `onError`.
  - `payment-proofs/ProofDialogs.tsx`: `ConfirmProofDialog` e `RefuseProofDialog` não mudam (R12 as reaproveita); `types.ts`: `PaymentProof.unitPixKey`.
  - `frontend/src/mocks/handlers.ts`: `/charges/overdue` (linha ~4045) acrescenta `modality`, `lastReminder.status/reason` e `totalCents`; `proofView` (linha ~1334) acrescenta `unitPixKey`; `frontend/src/mocks/cenarios/cobrancas.ts` ganha os dados do canvas: 11 cobranças em atraso (Gabriel 59 dias bloqueado, Bruno 25, Igor com e-mail com problema, Juliana, Rafaela…) e três comprovantes pendentes, dois deles do mesmo aluno e do mesmo `sentAt`; `billing.msw.test.ts`, `payment-proofs.msw.test.ts` e `cenarios-cobrancas.msw.test.ts` cobrem os campos e o cenário.
  - `frontend/src/i18n/pt-BR.json` (`charges.overdue.*`, `paymentProofs.*`): textos do canvas; saem as chaves não usadas (`columns.unit/dueOn/daysToBlock`, `unit`, `allUnits`, `cardLine`, `cardDates`, `columns.*` antigas); o lint de texto literal passa.
  - `frontend/visual/casos.ts`: `cobrancas-atrasados` e `cobrancas-conferencia` sem `limiteCanvas` (ou com, se sobrar divergência que outra issue da 10.5 remove, regra 4 do AGENTS.md); casos novos `cobrancas-conferencia-janela` (canvas `ComprovanteVarias`, passo "Conferir" no item agrupado) e `cobrancas-conferencia-celular` (canvas `GMConferencia`, 390 px) se o teste visual aceitar; senão entram em `semCaso` com o motivo. Capturas em `.capturas/478/` (pt-BR); `npm run test:visual:docker -- -g "cobrancas-atrasados|cobrancas-conferencia"` sem `--update-snapshots` antes do push, depois com `--update-snapshots` só dessas telas.
  - Testes: `OverduePage.test.tsx`, `PaymentProofsPage.test.tsx`, `groupProofs.test.ts`, `ProofReviewDialog.test.tsx`, `ChargeRowMenu.test.tsx`, `visual/casos.test.ts`, `src/test/a11y.test.tsx` e o `e2e` que toque as duas telas (busca por `atrasados` e `conferencia` em `frontend/e2e/`).
- Segurança: permissão e alcance conferidos no servidor como hoje (`requireCollections` e `requireManager`); campos novos não expõem dado novo de pessoa; `unitPixKey` é da unidade, só chega a quem tem cobranças completo e não vai para a auditoria nem para o log; nenhuma rota nova, nenhuma ação nova que grave (as de confirmar, recusar e lembrete já auditam); a chave do arquivo do comprovante segue fora da resposta (só a URL assinada); dados de teste fictícios (telefones e CPFs inventados, domínios `.example`).
- Reuso: `PageHeader`, `QueryPage`, `ComingSoon`, `Person`/`PersonRow`, `RowCard`, `StatusBadge`, `Modal`, `SummaryBox`, `Avatar`, `WhatsAppButton`, `SendReminderDialog`, `RegisterPaymentDialog`, `RenegotiateDialog`, `ConfirmProofDialog`, `RefuseProofDialog`, `ProofImage`, `useUnitScope`, `ChargesPage.tsx` (#476) e `ChargePanel`/`ChargeRowMenu` (#477) como modelo.
- Riscos: o agrupamento por `studentId` e `sentAt` depende de o servidor gravar o mesmo `sent_at` num envio (`saveAll` usa um só `now`; o teste `PortalMultiProofIT` cobre) e de a página trazer o grupo inteiro (por isso `size=100`, D7); `RenegotiateDialog` pede `ChargeRow`, então o adaptador precisa dos campos que a janela lê (ver `RenegotiateDialog.tsx` antes); a comparação com o canvas de Atrasados depende de dados do MSW iguais aos do canvas (11 cobranças, R$ 1.910,00).

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

- [x] T1: Parte A, contrato e servidor: `docs/especificacao/10-cobrancas.md` (RF-COB-05, RF-COB-06), `docs/openapi.yaml`, `OverdueCharges.java` (`modality`, `lastReminder.status/reason`, `totalCents`) e `PaymentProofs.java` (`unitPixKey`); casos novos em `OverdueChargesIT` (modalidade, último lembrete com falha, soma do filtro e do alcance do Administrador) e `PaymentProofsIT`/`PaymentProofControllerIT` (chave da unidade só na gestão; 403 e isolamento) — cobre CA14, CA15 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='OverdueChargesIT,PaymentProofsIT,PaymentProofControllerIT'` e `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`
- [x] T2: Parte A, MSW e tipos: `types.ts` (charges e payment-proofs), `useOverdue.ts`, `handlers.ts` (`/charges/overdue`, `proofView`), `cenarios/cobrancas.ts` com os dados do canvas e testes MSW — cobre CA15 e dá dados a CA3, CA8, CA11 — prova: `npm test -- billing.msw payment-proofs.msw cenarios-cobrancas` (de dentro de `frontend/`)
- [x] T3: Parte B, Em atraso: `OverduePage.tsx`, `OverdueRows.tsx`, extração de `ChargeActionDialogs` em `ChargeRowMenu.tsx`, pt-BR e testes (seleção e "Enviar lembrete" intactos) — cobre CA1 a CA7 — prova: `npm test -- OverduePage ChargeRowMenu`
- [x] T4: Parte C, agrupamento e destaque: `groupProofs.ts` com teste, `ProofImage.tsx` (variante grande), `ProofFeatured.tsx`, `ProofRows.tsx` e a nova `PaymentProofsPage.tsx` (lista, estados, celular), pt-BR — cobre CA8, CA9, CA10, CA11, CA13 — prova: `npm test -- groupProofs PaymentProofsPage`
- [x] T5: Parte C, janela de conferência: `ProofReviewDialog.tsx` (cada cobrança decidida uma a uma, recarga ao fim) ligada ao "Conferir" e ao destaque do item agrupado — cobre CA12 — prova: `npm test -- ProofReviewDialog PaymentProofsPage`
- [x] T6: Parte D, visual: casos de `visual/casos.ts` (atrasados, conferência, janela e celular), capturas 1440 e 390 px em `.capturas/478/` com o navegador em pt-BR, `npm run test:visual:docker -- --update-snapshots -g "cobrancas-atrasados|cobrancas-conferencia"` só dessas telas, `npm run visual:canvas -- --exige`, axe nos dois temas — cobre CA3, CA7, CA8, CA12, CA13 — prova: `npm run test:visual:docker -- -g "cobrancas-atrasados|cobrancas-conferencia"` e `npm test -- casos a11y`
- [x] T7: Parte D, regressão: `npm run lint && npm run typecheck && npm run build && npm run test:cov` e o e2e que toque as telas; conferir que nada ficou de chave de tradução sem uso — não cobre critério: fecha o item com a regressão do front que o CI exige — prova: `npm run lint && npm run typecheck && npm run test:cov` e `npm run e2e`

## 6. Decisões

- D1: o canvas de Atrasados mostra só o breadcrumb da barra ("Financeiro › Cobranças › Em atraso") e o título "Em atraso"; o título "Cobranças em atraso" e o botão "Voltar às cobranças" saem do corpo, e o retorno é pelo breadcrumb. Alternativa descartada: manter o botão (não está no canvas).
- D2 (decisão do dono): o canvas vale só no visual; a RF-COB-06 não muda. A coluna de seleção, o "Selecionar todos" e o botão "Enviar lembrete" ficam como hoje (até 100 por envio, trava de 24 horas, `NOT_OPEN` e `RECENT` no servidor). O botão "Enviar lembrete por e-mail a todos" do canvas fica fora do escopo e, se for o caso, vira item de produto separado. `totalCents` continua necessário só para o subtítulo (total do filtro). Alternativa descartada: trocar a seleção pelo "a todos" (muda regra de negócio).
- D3: "R$ / 160,00" e "E- / mail" quebrando em duas linhas vêm de a tabela ter dez colunas; com as do canvas mais a seleção e `whitespace-nowrap` nos valores, a quebra some. Alternativa: só ajustar largura (não resolve a causa).
- D4 (muda o comportamento): "Registrar" e "Renegociar" aparecem por linha como no canvas: "Renegociar" quando o bloqueio está em 0 dia (cobrança já bloqueada) e "Registrar" nas demais; as duas janelas e as regras são as da #477 (uma cobrança por vez, RN-COB-09). O canvas não mostra os dois juntos; se o dono quiser os dois em todas, vira ajuste. Alternativa descartada: sempre os dois (não é o canvas).
- D5: "Configurar" leva a `/configuracoes/unidade`, onde ficam os dias dos lembretes (`reminderDays`). Alternativa: a tela de lembretes automáticos do canvas (`LembretesAuto`) só existe como item de outra issue; se existir rota própria quando este item for construído, usar a rota própria. Suposição: se a rota de lembretes já existir, o aviso aponta para ela.
- D6 (muda o comportamento): "Editar texto" fica visível, desabilitado, com "Em breve" (C11), porque a especificação não define texto de WhatsApp editável (RN-COM-03: a mensagem é montada no front). O texto mostrado é o de `charges.overdue.whatsappMessage`, com o nome do pagador, o aluno, o valor, o vencimento e a unidade, e não o texto de exemplo do canvas. Alternativa descartada: inventar edição de texto (regra de negócio nova, vai ao dono).
- D7 (muda o comportamento): o agrupamento de um comprovante enviado para várias cobranças é feito no front por aluno e instante de envio, sem mudar a gravação (um por cobrança, decidido um a um, RN-COB-14). "N aguardando" conta itens agrupados. A lista pede `size=100`; com mais de 100 pendentes, o fim da fila pode partir um grupo e o restante aparece depois de decidir os primeiros. Alternativa descartada: campo de grupo no servidor (migração e regra nova sem necessidade agora). Plano B se passar de 100 pendentes na prática: abrir item para paginar por grupo.
- D8: o "cartão do comprovante Pix" do canvas (Para, Chave, De, ID da transação) é a imagem do comprovante que o aluno enviou; o sistema mostra a imagem real, em tamanho de conferência, e não inventa esses campos. A "Chave da unidade" sai de `unitPixKey` como cadastrada (sem rótulo "CNPJ"). Alternativa descartada: texto de comprovante gerado (dado falso).
- D9: o `lastReminder` da lista de atrasos passa a considerar qualquer resultado (enviado ou não) para mostrar "e-mail com problema" como no canvas; a regra de 24 horas do envio (`recent`) continua só sobre os enviados. Alternativa: manter só os enviados e perder "e-mail com problema" (divergência de texto do canvas).
- D10: o canvas de celular de Atrasados não existe; a tabela vira cartões pelo componente da #458, com os dados e as ações da tabela, conforme o AGENTS.md ("celular é a mesma aplicação responsiva"). Decisão de tela sem canvas: segue os componentes base.
- Suposição: o canvas de Atrasados é de Carla (Coordenação, "Todas as unidades da Carla"); a captura do sistema usa Ana com o escopo do MSW, e o texto do escopo vem de `useUnitScope`. Se o limite padrão do `visual:canvas` reprovar por esse nome, usar `limiteCanvas` com motivo conforme a regra 4 do AGENTS.md.
- Suposição: o MSW pode ter 11 cobranças em atraso sem quebrar outros testes que contam linhas do cenário `cobrancas`; se quebrar, o cenário novo fica separado em `cobrancas-atrasados`.

## Construção

- T1 — arquivos: `docs/especificacao/10-cobrancas.md`, `docs/openapi.yaml`, `OverdueCharges.java` (`modality`, `lastReminder.status/reason` de qualquer resultado, `totalCents`), `PaymentProofs.java` (`unitPixKey`; `reference` das mensalidades passa a "Modalidade · MM/AAAA"), `OverdueChargesIT`, `PaymentProofControllerIT` — prova: `mvnw verify -Dit.test='OverdueChargesIT,PaymentProofsIT,PaymentProofControllerIT'` + `-Dtest='OpenApiContractTest,ContractRoutesTest'` → 20 ITs e 7 testes verdes.
- T2 — arquivos: `charges/types.ts`, `charges/useOverdue.ts` (total do filtro em `counts.totalCents`, em centavos), `payment-proofs/types.ts`, `mocks/handlers.ts`, `mocks/cenarios/cobrancas.ts` (um envio pulado por e-mail com problema), testes MSW — prova: `npx vitest run src/mocks` → 58 arquivos, 335 testes verdes.
- T3 — arquivos: `OverduePage.tsx`, `OverdueRows.tsx`, `ChargeRowMenu.tsx` (extraído `ChargeActionDialogs`), `WhatsAppButton.tsx` (props `label` e `ariaLabel`), `pt-BR.json`, `OverduePage.test.tsx` — prova: `npx vitest run src/features/charges` → verde.
- T4 e T5 — arquivos: `groupProofs.ts` (+teste), `ProofImage.tsx`, `ProofFeatured.tsx`, `ProofRows.tsx`, `ProofReviewDialog.tsx`, `PaymentProofsPage.tsx`, `usePaymentProofs.ts`, `pt-BR.json`, `PaymentProofsPage.test.tsx`, `e2e/comprovantes.spec.ts` (título novo) — prova: `npx vitest run src/features/payment-proofs` → 15 testes verdes.
- T6 — `visual/casos.ts`: caso novo `cobrancas-conferencia-janela` (`ComprovanteVarias` sai de `semCaso`); `GMConferencia` segue em `semCaso` (360 px, comparado pelas capturas em `.capturas/478/`, D5 da #435). `visual:canvas -- --exige` → 135 comparadas, 0 reprovadas. `cobrancas-atrasados` (2,0%) e `cobrancas-conferencia` (13,1%) passam no limite padrão, sem `limiteCanvas`. A janela mede 56,0% (fundo e dados) e usa `limiteCanvas` 0,60 com motivo; a #573 foi atualizada no corpo para removê-lo.
- T7 — `npm run lint`, `typecheck`, `build` → verdes; `test:cov` → 2366 de 2373 (7 falhas por tempo esgotado ou carga em 5 arquivos que não são do item; reexecutados isolados: 91 verdes); `npm run e2e` → 96 passaram, 2 instáveis (`configuracao-unidade`, `portal-pedidos`) que passaram na repetição.

Visual do CI: cobrancas-atrasados → passou; cobrancas-conferencia → passou; cobrancas-conferencia-janela → passou (suíte visual inteira: 517 passaram).
Referências visuais: `frontend/visual/referencias/cobrancas-atrasados-*`, `cobrancas-conferencia-*`, `cobrancas-conferencia-janela-*` (1440 e 390, claro e escuro).
Regressão do back-end: `mvnw verify` completo rodou em segundo plano (resultado abaixo, se registrado).
Desvios: (1) o cenário do MSW não ganhou as 11 cobranças do canvas (R$ 1.910,00): ficou com as 5 existentes, para não quebrar outros testes (suposição do plano); a diferença de dados entra na comparação com o canvas e a #573 trata o que sobrar. (2) `PaymentProofs` passou a juntar a modalidade em `reference` (a tela precisa de "Barra · Jiu-Jitsu · out/2026" e o servidor só devolvia o mês); sem IT próprio de mensalidade. (3) A seleção em lote, a barra "Enviar lembrete" e o aviso ficam no cabeçalho do `QueryPage`; o botão "Voltar às cobranças" saiu (D1). (4) A janela "Conferir comprovante" usa `size="lg"` com `max-w-[900px]` (o canvas tem 900 px).
Não é do item: nada além dos arquivos acima.
Regressão do back-end: `mvnw verify` completo → 881 testes, 0 falhas, BUILD SUCCESS (JaCoCo incluso).

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-14, estado 26cfbdd3cad2e30ed0f2a276d0a59e443ef5b537

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `OverduePage.test.tsx` (subtítulo "Todas as unidades · 2 cobranças · R$ 210,00", soma do filtro vem de `totalCents`); IT `modalityAndTotal` cobre soma do filtro. Com 2 linhas, não com 11 (cenário MSW ficou com 5, Desvio 1) |
| CA2 | PASSOU | teste: link "Configurar" com `href=/configuracoes/unidade` |
| CA3 | PASSOU | testes de linha e de bloqueio/último lembrete; captura 1440 mostra os valores numa linha só |
| CA4 | PASSOU | teste Registrar/Renegociar e link WhatsApp com mensagem pronta; some sem telefone/desligado |
| CA5 | PASSOU | teste: troca de texto ao clicar na linha, "Editar texto" `aria-disabled` sem abrir janela |
| CA6 | PASSOU | testes CA26 e afins de `OverduePage.test.tsx` mantidos e verdes |
| CA7 | PASSOU | teste a 360 px com axe nos dois temas; estados erro, vazio, 403 testados |
| CA8 | PASSOU | teste CA8 + captura 1440 (imagem do MSW é preta, dado do mock) |
| CA9 | PASSOU | testes CA9 (confirmar, recusar, erro, sem imagem) |
| CA10 | PASSOU | teste CA10 e captura |
| CA11 | PASSOU | `groupProofs.test.ts` e `PaymentProofsPage.test.tsx` (CA11, CA12) |
| CA12 | PASSOU | teste CA11/CA12 completo (uma a uma, fecha na última) e "Fechar" |
| CA13 | PASSOU (com ressalva) | teste a 360 px com axe; captura 390 compara com `GMConferencia`: cartão com link "Comprovante" no lugar do bloco da imagem e item agrupado só com "Conferir" (RN-COB-14); aceito |
| CA14 | NÃO CONFERIDO (limitação aceita, regra 2 da Autonomia) | ITs não rodam aqui (Testcontainers não acha o Docker: "Could not find a valid Docker environment"); vale o CI; a Construção registra `mvnw verify` 881 testes verdes |
| CA15 | PASSOU (parcial local) | contrato e MSW verdes; IT do servidor só no CI |

Comandos:
- `npx vitest run src/features/charges src/features/payment-proofs src/mocks/{payment-proofs,charge-reminders,cenarios-cobrancas}.msw.test.ts visual/casos.test.ts src/test/a11y.test.tsx --maxWorkers=2` → 20 arquivos, 300 testes verdes
- `npm run lint` e `npm run typecheck` → verdes
- `mvnw test -Dtest='OpenApiContractTest,ContractRoutesTest'` → 7 testes verdes
- `mvnw verify -Dit.test='OverdueChargesIT,PaymentProofsIT,PaymentProofControllerIT,PortalMultiProofIT'` → 24 erros `NoClassDefFound` (Testcontainers sem Docker); ambiente, não defeito
- `npm run test:visual:docker -- -g "cobrancas-atrasados|cobrancas-conferencia"` → 12 passaram (atrasados, conferencia, conferencia-janela; 1440 e 390, claro e escuro)
- Capturas lado a lado abertas e comparadas (`.capturas/478/`: atrasados 1440, conferencia 1440 e 390, janela 1440). Estrutura confere; divergências restantes são dados do MSW e itens abaixo.

Achados:
- obrigatório, código, `frontend/src/features/payment-proofs/PaymentProofsPage.tsx` (`fetchPendingProofs()` e o subtítulo do celular com `unitName`) e `usePaymentProofs.ts` — esperado: com uma unidade escolhida na barra, a lista e a contagem são dessa unidade (como em Em atraso, que manda `unitId`), ou o nome da unidade não aparece; observado: o celular escreve "Unidade X · N comprovantes" (R13) mas `GET /payment-proofs?size=100` não leva `unitId`, então lista todas as unidades; o escopo da barra é só do navegador (`UnitScopeProvider`) e o servidor aceita `unitId` (`PaymentProofController.list`); evidência: leitura do código; nenhum teste escolhe unidade nessa tela; corrigir: passar `unitId` do `useUnitScope` (e recarregar ao trocar) e cobrir com teste.
- sugestão, especificação, R1/R8 x D1: R1 e R8 pedem "o link para voltar às Cobranças", mas D1 e o Desvio 3 tiram o botão e mandam voltar pelo breadcrumb; na captura o breadcrumb é "Financeiro › Cobranças e pagamentos", sem "Cobranças › Em atraso". Ajustar R1/R8 ou o breadcrumb (item da barra, não deste).
- sugestão, código, `OverduePage.tsx` coluna de ações: "Lembrete" muda de posição entre linhas (x=1190 na linha com "Renegociar", 1203 nas com "Registrar"); fixar a largura da ação para alinhar como no canvas.
- sugestão, código, `PaymentProofs.java` `SELECT`: `reference` da mensalidade virou "Modalidade · MM/AAAA" sem IT que exerça mensalidade com modalidade (Desvio 2); acrescentar um caso.
- sugestão, código: CA1 e CA8 do plano pedem 11 cobranças e 3 comprovantes no cenário do MSW (Desvio 1); fica para a #573. A janela usa `limiteCanvas` 0,60, com a remoção já no corpo da #573 (conferido).

Instáveis: nenhum.

### Correção da rodada 1
- obrigatório: Conferência respeita a unidade da barra — arquivos: `frontend/src/features/payment-proofs/usePaymentProofs.ts` (`fetchPendingProofs(unitId?)` manda `unitId`), `PaymentProofsPage.tsx` (usa `useUnitScope`, espera o escopo carregar e recarrega ao trocar de unidade), `PaymentProofsPage.test.tsx` (caso novo: unidade escolhida manda `unitId` e nenhuma chamada sai sem ele) — prova: `npx vitest run src/features/payment-proofs src/test/a11y.test.tsx visual/casos.test.ts` → 161 verdes; `npm run lint` e `npm run typecheck` verdes.
- Visual do CI: cobrancas-conferencia (e -janela) → passou (8 passaram, sem mudança visual).
- Sugestões não adotadas (opcionais): alinhar largura da ação "Lembrete"; IT de mensalidade com modalidade em `reference`; R1/R8 x D1 e dados do MSW ficam para a fase 2 e a #573.

### Rodada 2 — OK — 2026-11-14, estado 7e51e7ef8e51e3e68b416916fe9d6171e3de665c

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA13, CA15 | PASSOU (mantido da rodada 1) | a mudança desde a rodada 1 toca só a Conferência (`unitId`); testes de charges e payment-proofs verdes de novo |
| CA13 | PASSOU | caso novo "manda unitId da unidade escolhida e não manda com Todas as unidades"; sem chamada antes do escopo carregar |
| CA14 | NÃO CONFERIDO (limitação aceita, regra 2 da Autonomia) | ITs exigem Docker/Testcontainers; vale o CI do PR |

Comandos:
- `npx vitest run src/features/payment-proofs src/features/charges src/test/a11y.test.tsx visual/casos.test.ts --maxWorkers=2` → 17 arquivos, 286 testes verdes
- `npm run lint` e `npm run typecheck` → verdes
- `npm run test:visual:docker -- -g "cobrancas-conferencia"` → 8 passaram (sem mudança visual)

Achados:
- Obrigatório da rodada 1 (unidade da barra na Conferência): resolvido. `fetchPendingProofs(unitId)` manda `unitId`, espera o escopo carregar e recarrega ao trocar.
- sugestão: as sugestões da rodada 1 seguem abertas (opcionais).

Instáveis: nenhum.

## Entrega

- Em atraso (`/cobrancas/atrasados`): lista no visual do canvas, colunas novas, "Configurar" no aviso, cartões no celular, painel "Mensagem pronta do lembrete" com "Editar texto" desabilitado ("Em breve") e os quatro estados. A soma do filtro vem de `counts.totalCents`, em centavos; a modalidade vem do servidor.
- Conferência (`/comprovantes`): cabeçalho com unidade e contagem, destaque e agrupamento por cobrança, cartões no celular com "Comprovante" abrindo a imagem, janela de conferência (`size="lg"`, 900 px) e os quatro estados. Respeita a unidade da barra (`unitId`, correção da rodada 1).
- Janela "comprovante de várias cobranças": caso novo `cobrancas-conferencia-janela` no teste visual.
- Verificação: rodada 2 OK (estado 7e51e7ef). `visual:canvas -- --exige`: 135 comparadas, 0 reprovadas. Visual do CI: `cobrancas-atrasados`, `cobrancas-conferencia` e `cobrancas-conferencia-janela` passaram. Back-end: `mvnw verify` 881 testes verdes, JaCoCo incluso. Front-end: lint, typecheck e build verdes.
- Decisões: a janela usa `limiteCanvas` 0,60 com motivo (56,0% de divergência de fundo e dados); a #573 traz a remoção no corpo. O cenário do MSW ficou com 5 cobranças, não 11, para não quebrar outros testes; a diferença de dados fica para a #573. `reference` da mensalidade passa a "Modalidade · MM/AAAA".
- Limitações: CA14 (ITs com Testcontainers) NÃO CONFERIDO localmente, sem Docker; vale o `mvnw verify` do CI. Sugestões opcionais não adotadas: largura fixa da ação "Lembrete", IT de mensalidade com modalidade, e R1/R8 x D1 (botão "Voltar às cobranças") para a fase 2.
- Regressão local, da construção e da verificação (a base não avançou, então não foi repetida): `test:cov` 2366 de 2373, com 7 falhas por tempo esgotado sob carga em 5 arquivos fora do item, que passaram isoladas (91 testes); a construção não anotou arquivo, nome nem linha de erro dessas falhas. `e2e`: 96 passaram, 2 instáveis (`configuracao-unidade`, `portal-pedidos`) que passaram na repetição. Registrado como instabilidade sob carga na #540.
