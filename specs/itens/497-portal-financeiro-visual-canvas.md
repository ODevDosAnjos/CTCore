# 497 — Financeiro do portal e Pix na chave no visual do canvas

Origem: issue #497 (Sprint 10.5, Fase 3, R5), `docs/auditoria/decisoes-canvas.md` (R1, R3); evidência M30, M1, M146, M147, B24. Branch: `item/497-portal-financeiro-visual-canvas`. Dependências #449, #450, #458, #459, #460, #461 (todas feitas). Canvas: `PortalFinanceiro`, `PortalPixChave` (1440), `PortalMFinanceiro`, `PortalMPixChave` (390) e `PortalFamilia`/`PortalMFamilia` (responsável, já com o caso `portal-familia`). Regras: RF-POR-05, RN-POR-01, RN-POR-02, RN-POR-08 (`docs/especificacao/14-portal-do-aluno.md`), RF-COB-05, RN-COB-13, RN-COB-16 (`10-cobrancas.md`). Parte da tela feita na #92 (`specs/itens/92-portal-financeiro.md`); a estrutura do portal (barra, coluna de 1120 px, `PortalHeading` com rótulo) já está em `PortalLayout`/`PortalHeading` e aqui só se confere.

## 1. Objetivo

Deixar `/portal/financeiro` e a janela "Pix na chave com comprovante" iguais ao canvas: "Em aberto" em tabela com seleção, resumo "N selecionadas · R$", "Enviar comprovante de Pix" (real) e "Pagar R$" (Pix, cartão e boleto: "Em breve", Sprint 11); dois cartões lado a lado, "Débito automático" (botão "Ativar" em "Em breve") e "Recibos por e-mail"; "Histórico" em tabela com anos em abas e "Recibo" com ícone; a 390 px, linhas compactas em cartões. A janela do Pix ganha o aviso âmbar, o cartão da chave com "Copiar chave", a zona de envio e a nota "Em conferência"; no celular vira página cheia com "Voltar".

Fora do escopo: pagar online (Pix Mercado Pago, cartão, boleto) e ativar, trocar ou desativar o débito automático (Sprint 11: #98, #100, #101, #103); ligar e desligar o e-mail de recibo; total por meio com taxa (Pix, Cartão, Boleto: depende da taxa da Sprint 11); mudar a regra de seleção (mesma unidade, RN-POR-02) ou a de envio do comprovante; back-end.

## 2. Requisitos

- R1 (M30, M146): "Em aberto" é uma tabela (`DataTable`, em cartões no celular pelo componente da #458) com seleção, Cobrança ("modalidade · mês" e, na visão "Toda a família", o aluno), Vencimento, Valor e Situação. O subtítulo é "vencidas primeiro"; a ordem continua a do servidor. "Em conferência" não tem seleção (RN-COB-13).
- R2 (B24): a seleção usa o `Checkbox` base (caixa pequena, escura com check, certa nos dois temas), com nome acessível "Selecionar …"; sai a caixa crua de 24 px.
- R3 (M30): com cobranças marcadas aparece a barra "N selecionadas · R$ X" (`role="status"`) com "Enviar comprovante de Pix" e "Pagar R$ X". O primeiro abre a janela do Pix com as marcadas; o segundo é `ComingSoon` (visível, desabilitado, "Em breve"), sem backend. Marcadas de unidades diferentes mantêm o aviso e bloqueiam os dois botões (RN-POR-02). Saem a composição em `details`, o "Pagar" por linha e o "Pagar selecionadas" (D2, D3).
- R4 (M146): "Débito automático" e "Recibos por e-mail" são dois cartões lado a lado (empilhados no celular), cada um com ícone. Débito: texto "Cobra no cartão no dia do vencimento, com a taxa do cartão." e "Ativar" como `ComingSoon`; no celular "Desligado" e "Ativar". Recibos: "Chegam em {e-mail da conta} a cada pagamento." (e-mail da sessão, sem dado novo), sem interruptor (D4). Sai a tag "Inativo".
- R5 (M146): "Histórico" é uma tabela (Referência, Vencimento, Valor pago, Pago em, Meio, Situação, "Recibo" com ícone de download e nome acessível "Baixar recibo de …") com os anos em abas (um por ano de `years`) no lugar do seletor "Ano"; `?ano=` segue. A 390 px, linhas compactas (referência, "Meio · dd/mm", valor e ícone). A visão "Toda a família" continua sem histórico.
- R6 (M147): o responsável com mais de um aluno escolhe por chips (um por aluno e "Toda a família"), como o canvas `PortalFamilia`, no lugar do seletor nativo "Aluno"; `?aluno=` e `?visao=familia` não mudam. Na visão da família as abertas se agrupam por unidade (cada grupo com seu resumo e seus botões, pois o pagamento é por unidade) e o topo mostra "R$ X em aberto".
- R7 (M30): a janela do Pix (`Modal size="md"`, título em caixa alta, rodapé fixo "Cancelar | Enviar comprovante") traz: aviso âmbar (`Banner`: "O pagamento online da {unidade} está fora do ar agora. Pague na chave Pix da unidade e envie o comprovante."); cartão "Chave Pix ({tipo})" com chave, titular e "Copiar chave" com ícone; "Valor R$ X (sem taxa)"; lista das cobranças quando são várias; zona tracejada de envio ("Envie a foto ou o PDF do comprovante" e "JPG, PNG ou PDF · até 5 MB"); nota "Depois do envio, as cobranças ficam "Em conferência": lembretes e prazo de bloqueio param até a academia conferir.". Tipo e titular saem de dados já recebidos (D5). Arquivo inválido, falha, 409, 422 e unidade sem chave seguem como hoje (RF-COB-05).
- R8 (M30): no celular a janela é página cheia: "Voltar", "Pix na chave da unidade", valor grande, descrição das cobranças, cartão da chave com copiar em ícone, envio de foto ou PDF, bloco "Resumo" (`SummaryBox`) e botão largo "Enviar comprovante".
- R9: carregando, vazio ("Nenhuma cobrança em aberto", "Nenhum histórico neste ano"), erro com "Tentar de novo" e sem permissão (responsável não financeiro) funcionam; a partir de 360 px sem rolagem lateral; axe nos dois temas, na tela e na janela; textos em `pt-BR.json`; o portal reduzido abre o Financeiro (RN-POR-08); os controles ficam na tela durante o recarregamento.
- R10: o MSW de `aluno@` e `familia@` (3 abertas, histórico, chave Pix, dois filhos, #449) basta; nenhum campo de API é criado. Se a massa não bater com a do canvas (Muay Thai e Jiu-Jitsu, 2 abertas marcadas), o caso visual a ajusta por `__mswOverride`, sem mudar o cenário comum.
- R11: o caso `portal-financeiro` (1440 e 390) compara com `PortalFinanceiro`/`PortalMFinanceiro`; `portal-familia` com `PortalFamilia`/`PortalMFamilia`; o novo `portal-pix-chave` (passos: marcar duas, "Enviar comprovante de Pix") com `PortalPixChave`/`PortalMPixChave` (saem da lista de exceções de `visual/casos.ts`). Passam no limite padrão do `visual:canvas` ou com `limiteCanvas` justificado (D6).

## 3. Critérios de aceite

- CA1 (R1, R2): dado `aluno@` com 3 abertas (uma vencida), a tabela mostra Cobrança, Vencimento, Valor e Situação na ordem do servidor, subtítulo "vencidas primeiro" e caixas pequenas marcáveis por teclado; a "Em conferência" não tem caixa; a 390 px as linhas são cartões sem rolagem lateral.
- CA2 (R3): marcar duas da mesma unidade mostra "2 selecionadas · R$ 340,00"; "Pagar R$ 340,00" está desabilitado com "Em breve" e não chama a rede; "Enviar comprovante de Pix" abre a janela com as duas; unidades diferentes mostram o aviso e desabilitam os dois botões; desmarcar libera; não existem composição, "Pagar" por linha nem "Pagar selecionadas".
- CA3 (R4): a tela mostra "Débito automático" (com "Ativar" desabilitado e "Em breve") e "Recibos por e-mail" com o e-mail da conta, lado a lado a 1440 px; a 390 px "Desligado" e "Ativar"; não existe a tag "Inativo".
- CA4 (R5): o histórico é tabela com as sete colunas e "Recibo" com ícone que baixa `/portal/receipts/{code}/pdf`; as abas de ano trocam o ano, refazem a leitura e mudam `?ano=`; não existe o seletor "Ano"; sem histórico mostra "Nenhum histórico neste ano".
- CA5 (R6): dado `familia@` com dois filhos, os chips mostram os dois e "Toda a família"; escolher a família põe `?visao=familia`, mostra o total em aberto e as abertas agrupadas por unidade, sem histórico; com um aluno só não há chips.
- CA6 (R7): dado a janela com duas cobranças, ela mostra o aviso âmbar, "Chave Pix (CNPJ)", chave, titular, "Copiar chave" (copia e confirma), "R$ 340,00 (sem taxa)", a lista das duas, a zona de envio com "JPG, PNG ou PDF · até 5 MB" e a nota "Em conferência"; "Enviar comprovante" fica desabilitado sem arquivo; com arquivo válido envia, confirma e relê a lista; arquivo recusado mostra o erro no campo; unidade sem chave, seleção inválida e cobrança já em conferência mostram os avisos de hoje.
- CA7 (R8): a 390 px a janela é página cheia com "Voltar", valor grande, descrição, cartão da chave com copiar em ícone, "Resumo" e botão largo; "Voltar" fecha.
- CA8 (R9): cada estado aparece (carregando, vazio das duas listas, erro com "Tentar de novo" que refaz, 403 do responsável não financeiro); o portal reduzido mostra o Financeiro; sem rolagem horizontal a 360 px; axe sem violação nos dois temas, na tela e na janela.
- CA9 (R10, R11): `npm run test:visual:docker -- -g "portal-financeiro"`, `-g "portal-familia"` e `-g "portal-pix-chave"` passam sem `--update-snapshots`; capturas em `.capturas/497/` (`<tela>-{1440,390}-{sistema,canvas}.png`, pt-BR); `npm run visual:canvas` não reprova os casos no limite padrão; o verificador compara as imagens (regra temporária até a #568).

## 4. Plano técnico

- Dados: não mudam.
- API: não muda (sem rota nova nem alteração em `docs/openapi.yaml` ou no contrato do MSW). O e-mail dos recibos vem da sessão; tipo da chave e titular saem da chave e do nome da unidade já devolvidos (D5).
- Interface (`frontend/src/features/portal/`): `PortalFinancePage.tsx` (`PortalHeading` com rótulo da unidade, chips de aluno no lugar do `Select`, grade dos dois cartões); `PortalOpenCharges.tsx` (`DataTable` e cartões da #458, `Checkbox`, barra de seleção, `ComingSoon`, grupos por unidade na família); `PortalAutoDebitCard.tsx` (ícone, "Ativar" em `ComingSoon`); `PortalReceiptsCard.tsx` (a criar); `PortalChargeHistory.tsx` (tabela, abas de ano, ícone `Download`); `PixProofDialog.tsx` (`Modal size="md"` com `footer`, `Banner`, `SummaryBox`, `FileField` em zona tracejada, ícone `Copy`, página cheia no celular); `i18n/pt-BR.json` (chaves `portalFinance.*` e `pixProof.*`; saem as sem uso: `open.composition`, `plan`, `benefit`, `final`, `paySelected`, `history.year`, `autoDebit.inactive`). `PortalTag` só sai se ficar sem uso.
- Testes e visual: `PortalFinancePage.test.tsx` e `PixProofDialog.test.tsx` (existem) adaptados e ampliados; `src/test/a11y.test.tsx` cobre tela e janela; `frontend/e2e` (conferir specs que citam Financeiro e "Pagar") ajustado; `frontend/visual/casos.ts` (casos das linhas 81 e 224 com massa e `limiteCanvas` se preciso; novo `portal-pix-chave`; saem `PortalPixChave` e `PortalMPixChave` da lista de exceções ao fim do arquivo) e a massa por `__mswOverride`; referências regeradas só destes casos.
- Segurança: não muda; permissão continua no servidor (responsável não financeiro: 403). Nenhum dado de cartão no front; "Pagar R$" não chama rede.
- Reuso: `DataTable`/`RowCard`, `Checkbox`, `ComingSoon`, `Modal` com `size`/`footer`, `Banner`, `SummaryBox`, `FileField`, `Tabs`, `PillFilter`, `PortalHeading`, `Badge`, `Avatar`, `useResource`, `formatCurrency`/`formatDate`, `useSession`.
- Riscos: (1) o canvas mostra "Vence em 2 dias", "Paga com atraso", "Valor pago" e total por meio que a API não traz (D3, D7); (2) tabela com seleção e cartões do celular na mesma `DataTable`; (3) axe e nome curto/longo por largura (como na #496); (4) a janela vira página cheia no celular, cuidar de foco e de "Voltar"; (5) o e2e e os testes da #92 citam "Pagar selecionadas" e `details`.

## 5. Tarefas

Item grande: três partes, cada uma construível em uma sessão.

Parte A — Em aberto e janela do Pix
- [x] T1: textos `pt-BR` e `PortalOpenCharges` (tabela e cartões, `Checkbox`, barra de seleção, `ComingSoon`, grupos por unidade) — cobre CA1, CA2, CA5 (agrupamento) — prova: `cd frontend && npx vitest run src/features/portal/PortalFinancePage.test.tsx -t "abertas"`
- [x] T2: `PixProofDialog` (janela do canvas e página cheia no celular) — cobre CA6, CA7 — prova: `cd frontend && npx vitest run src/features/portal/PixProofDialog.test.tsx`

Parte B — resto da tela
- [x] T3: `PortalFinancePage` (cabeçalho, chips de aluno e família), `PortalAutoDebitCard`, `PortalReceiptsCard` — cobre CA3, CA5 — prova: `cd frontend && npx vitest run src/features/portal/PortalFinancePage.test.tsx -t "cartões|família"`
- [x] T4: `PortalChargeHistory` (tabela, abas de ano, ícone de recibo, linhas compactas) — cobre CA4 — prova: `cd frontend && npx vitest run src/features/portal/PortalFinancePage.test.tsx -t "histórico|ano"`

Parte C — estados, visual e regressão
- [x] T5: estados, axe e 360 px (testes, `a11y.test.tsx`, e2e ajustado) — cobre CA8 — prova: `cd frontend && npx vitest run src/test/a11y.test.tsx src/features/portal/PortalFinancePage.test.tsx` e `npx playwright test` do spec do Financeiro (ajustar o nome ao existente)
- [x] T6: massa, caso `portal-pix-chave`, casos `portal-financeiro` e `portal-familia`, referências e capturas em `.capturas/497/` — cobre CA9 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots -g "portal-financeiro"` (idem os outros dois), depois sem `--update-snapshots`, e `npm run visual:canvas`
- [x] T7: regressão completa — não cobre critério: exigência do AGENTS.md — prova: `./backend/mvnw -f backend/pom.xml verify` e, em `frontend/`, `npm run lint && npm run typecheck && npm run build && npm run test:cov && npm run e2e`

## 6. Decisões

- D1: nenhuma mudança de API ou de contrato; tudo sai de dados que a tela já recebe. Motivo: nada decisivo no canvas exige campo novo (D5, D7). Alternativa: campos `pixKeyType` e `holderName` na API.
- D2 (muda o comportamento): o botão "Pagar" por linha sai; o pagamento começa marcando a cobrança e usando a barra ("Enviar comprovante de Pix" real, "Pagar R$" em "Em breve"), como o canvas. Motivo: R1 do `decisoes-canvas.md`; "Pagar" online é Sprint 11. Alternativa: manter "Pagar" por linha abrindo o Pix na chave (confundiria com o "Pagar R$" do canvas, que é cartão, Pix ou boleto). No celular o canvas também tem as ações no rodapé da lista.
- D3 (muda o comportamento): saem a composição (plano, benefício, valor final) e "Pagar selecionadas", que o canvas não tem. Motivo: R1. A composição continua na ficha da cobrança do gestor; se o dono quiser de volta, vira detalhe da linha.
- D4: "Recibos por e-mail" é só informativo, sem interruptor: o recibo é sempre emitido (RN-COB-16) e não há preferência no contrato. Alternativa: interruptor em `ComingSoon`.
- D5: o tipo da chave sai do formato (14 dígitos CNPJ, 11 CPF, com @ e-mail, telefone, senão aleatória) e o titular é o nome da unidade. Se a unidade passar a guardar tipo e titular, a tela troca a fonte. Suposição: 11 dígitos ambíguos aparecem como CPF; o caso do canvas (CNPJ) fica certo.
- D6: divergência que reprovar no limite padrão do `visual:canvas` leva `limiteCanvas` com motivo e a issue da 10.5 que a remove; a que passa só é registrada na descrição do PR (autonomia 4 do `AGENTS.md`). A massa do canvas (Muay Thai e Jiu-Jitsu, set e out/2026) entra por `__mswOverride`.
- D7: "Vence em N dias" usa a situação do servidor (`DUE_SOON`, "Vencendo") com a data de vencimento, porque o servidor não devolve a contagem de dias; "Paga com atraso" e "Valor pago" mostram a situação e o valor da cobrança. Entram como divergência no PR. Se o dono quiser os dois exatos, abre-se item de contrato.
- D8: chips de aluno só com mais de um aluno; com um, nenhum seletor (como hoje).
- Suposição: o canvas `PortalFamilia` vale como referência do responsável (o caso `portal-familia` já existe); se o agrupamento por unidade divergir, o item registra o limite com motivo.
- Suposição: a estrutura do portal (barra, coluna de 1120 px, rótulo acima do título) já está pronta; o item só confere M1 nesta tela e corrige o que sobrar.

## Construção

- T1 — arquivos: `frontend/src/features/portal/PortalOpenCharges.tsx` (tabela `DataTable` com coluna de `Checkbox` própria, porque a seleção nativa da tabela marcaria também a linha em conferência; cartões `RowCard` abaixo de 640 px; barra com `ComingSoon`; grupos por unidade na família), `frontend/src/i18n/pt-BR.json` (`portalFinance.open.*`; saíram composition, plan, benefit, final, paySelected, pay, payItem), `PortalFinancePage.test.tsx` — prova: `npx vitest run src/features/portal/PortalFinancePage.test.tsx` → 12 passaram
- T2 — arquivos: `PixProofDialog.tsx` (estado levantado para o rodapé fixo; `Modal size=md fullOnMobile`; `Banner`, cartão da chave, `FileField` em zona tracejada, `SummaryBox` no celular), `usePixProof.ts` (`pixKeyType`, D5), `pt-BR.json` (`pixProof.*`), `PixProofDialog.test.tsx` — prova: `npx vitest run src/features/portal/PixProofDialog.test.tsx` → 8 passaram
Parcial: Parte A pronta (T1, T2). Faltam T3 a T7 (Partes B e C). `npx vitest run src/features/portal` → 214 passaram; `npm run typecheck` e `eslint src/features/portal` limpos.
Desvios: (1) as chaves `history.year` e `autoDebit.inactive` seguem no arquivo e o teste do histórico e do débito ainda usa o seletor Ano e a tag Inativo, porque saem em T3/T4; (2) o celular da janela mostra a descrição das cobranças (`description`, nomes das cobranças marcadas) passada por `PortalOpenCharges`, pois a API de instruções não devolve o rótulo; (3) a janela do Início (`PortalChargeCard`) usa o mesmo componente e herda o visual novo.
- T3 — arquivos: `PortalFinancePage.tsx` (`PortalHeading` com rótulo, chips de aluno e "Toda a família" no lugar do `Select`, "R$ X em aberto" no subtítulo da família, grade de dois cartões), `PortalAutoDebitCard.tsx` ("Ativar" em `ComingSoon`, "Desligado" no celular, sem tag), `PortalReceiptsCard.tsx` (novo, e-mail da sessão), `pt-BR.json` (`portalFinance.label/receipts/autoDebit`; saíram `autoDebit.inactive`) — prova: `npx vitest run src/features/portal/PortalFinancePage.test.tsx` → passou
- T4 — arquivos: `PortalChargeHistory.tsx` (`DataTable` de sete colunas, `Tabs` por ano no lugar do seletor, ícone `Download`, linhas compactas no celular), `pt-BR.json` (`history.columns`; saíram `dueOn`, `paidOn`, `method`, `receipt`), `PortalFinancePage.test.tsx` (teste novo do celular) — prova: `npx vitest run src/features/portal` → 215 passaram (13 na página); `npm run typecheck` e `eslint src/features/portal` limpos
Parcial: Partes A e B prontas (T1 a T4). Faltam T5 a T7 (Parte C). Desvio: o rótulo do cabeçalho é "Cobranças e recibos" (o canvas não fixa o texto; a unidade varia por aluno). `PortalTag` segue em uso por outras telas.
- T5 — arquivos: `frontend/e2e/portal-finance.spec.ts` (chips no lugar do seletor, abas de ano, barra "Enviar comprovante de Pix", "Pagar R$" desabilitado, janela "Pix na chave da unidade", "R$ X em aberto", débito "Ativar" desabilitado e recibos por e-mail); os estados, o 360 px e o axe da tela e da janela já estavam nos testes de `PortalFinancePage.test.tsx` e `PixProofDialog.test.tsx`, e `a11y.test.tsx` não cita telas do portal (sem mudança) — prova: `npx vitest run src/test/a11y.test.tsx src/features/portal/PortalFinancePage.test.tsx` → 25 passaram; `npx playwright test e2e/portal-finance.spec.ts` → 5 passaram
- T6 — arquivos: `frontend/visual/casos.ts` (campo `financeiroCanvas`; `portal-financeiro` com as duas marcadas; novo `portal-pix-chave`; `PortalPixChave` e `PortalMPixChave` saíram das exceções; `limiteCanvas` 0,7 no `portal-pix-chave` com motivo e a #622), `frontend/visual/telas.visual.ts` (massa do canvas por `__mswOverride`: Bruno Carvalho, 3 abertas, histórico de 2026, chave CNPJ), `PortalFinancePage.tsx` (cartões de débito e recibos entre "Em aberto" e "Histórico", como o canvas) — prova: `npm run test:visual:docker -- --update-snapshots --workers=2 -g "portal-financeiro|portal-pix-chave|portal-familia"` → 12 passaram (com 6 workers o servidor de desenvolvimento estourou o tempo no login; com 2 passou, instabilidade de carga); `npm run visual:canvas -- --exige` → 158 comparadas, 0 reprovadas; `npx vitest run src/features/portal` → 215 passaram. Capturas em `.capturas/497/` (`portal-{financeiro,familia,pix-chave}-{1440,390}-{sistema,canvas}.png`, pt-BR).
Referências visuais: `frontend/visual/referencias/portal-financeiro-*`, `portal-familia-*` (1440 e 390, claro e escuro, regeradas) e `portal-pix-chave-*` (novas, quatro).
Visual do CI: portal-financeiro → passou
Visual do CI: portal-familia → passou
Visual do CI: portal-pix-chave → passou
Divergências com o canvas (para o PR): (1) o canvas mostra "Vence em 2 dias" e "Paga com atraso" e o total por meio, que a API não traz (D7): a tela mostra "Vencendo" e "Paga"; (2) título da janela: o canvas diz "Pagar na chave da unidade", a tela usa "Pix na chave com comprovante" do contrato (R7); (3) caixa de seleção com o tom da marca (canvas: escura) e seletor de arquivo nativo visível na zona tracejada; (4) `PortalFamilia` mostra cartões por aluno e "Pagar" por unidade, a tela usa chips (R6) e a barra por unidade; passa no limite padrão; (5) o meio de cartão aparece como "Cartão de crédito" (rótulo base) e o e-mail dos recibos é o da sessão. A janela do Pix no 1440 reprova no limite padrão (65,9%): `limiteCanvas` 0,7 com motivo, removido pela #622 (criada, no marco 10.5, com a remoção no "Pronto quando").
- T7 — regressão: `./backend/mvnw -f backend/pom.xml verify` → passou (exit 0); em `frontend/`: `npm run lint` → 0; `npm run typecheck` → 0; `npm run build` → 0; `npm run test:cov` → 2648 passaram, 1 falhou (`ChargePanel.test.tsx` CA20, tempo de 20 s esgotado sob carga; sozinho, rodado de novo, os 22 passaram: instável, tela de cobranças, não é do item); `npm run e2e` → 97 passaram, 1 falhou (`portal-inicio.spec.ts` esperava o título "Pix na chave com comprovante" a 360 px, que agora é "Pix na chave da unidade": e2e do item ajustado e rerodado, 5 passaram).
Desvios: o título da janela no celular é "Pix na chave da unidade" (página cheia, R8) e `e2e/portal-inicio.spec.ts` foi ajustado por isso; `a11y.test.tsx` não ganhou caso do portal (o axe da tela e da janela está nos testes de `PortalFinancePage` e `PixProofDialog`).
Não é do item: o teste `ChargePanel` CA20 é instável sob carga (candidato a issue `técnica`, como a #519).

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-19, estado a18f32ee200c42b06e92fdbb46bfd5e148b5d6ac

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `PortalFinancePage.test.tsx` passa; captura 1440/390 mostra tabela, caixas pequenas e cartões no celular |
| CA2 | PASSOU | teste da barra "2 selecionadas · R$ 340,00", "Pagar" em "Em breve"; captura confere |
| CA3 | PASSOU | captura mostra os dois cartões lado a lado; "Desligado" no celular no código |
| CA4 | PASSOU | testes do histórico/ano; captura mostra tabela com abas e ícone |
| CA5 | PASSOU | captura `portal-familia` com chips; testes passam |
| CA6 | PASSOU | `PixProofDialog.test.tsx` passa; captura 1440 mostra aviso, cartão da chave, zona de envio e nota |
| CA7 | PASSOU | teste de página cheia no celular; captura 390 existe |
| CA8 | PASSOU | testes de estados e axe passam (19 arquivos, 227 testes do portal + a11y) |
| CA9 | PASSOU | `test:visual:docker -g "portal-financeiro|portal-familia|portal-pix-chave"` → 12 passaram; capturas em `.capturas/497/` abertas e comparadas |

Comandos: `npx vitest run src/features/portal src/test/a11y.test.tsx --maxWorkers=2` → 227 passaram; `npm run typecheck` e `npm run lint` limpos; visual docker → 12 passaram. Regressão completa (verify, test:cov, e2e) não reexecutada: vale o registro da T7 (falha instável de `ChargePanel` CA20 já anotada, não é do item).
Instáveis: nenhuma nova.
Achados:
- obrigatório, código, `PortalOpenCharges.tsx`, `PortalChargeHistory.tsx`, `PortalAutoDebitCard.tsx`, `PortalReceiptsCard.tsx` (`Card` base) — esperado: comparação lado a lado do `AGENTS.md` (regra temporária até a #568) com as divergências resolvidas ou registradas com motivo; observado: nas capturas 1440 o canvas tem títulos de seção "EM ABERTO" e "HISTÓRICO" em fonte de exibição grande (o de Histórico fora do cartão, com as abas de ano em controle segmentado à direita), cabeçalho de tabela em caixa normal, "Débito automático" e "Recibos" em cartão baixo de uma linha com ícone à esquerda, "Recibo" com texto ao lado do ícone, e a 390 px o Débito mostra só "Desligado" + "Ativar" (o sistema mostra a descrição também) e o Histórico vem em cartão compacto; o sistema mostra título pequeno em negrito, cabeçalhos em caixa alta, abas sublinhadas e cartões altos. Nada disso está em "Divergências com o canvas" nem tem `limiteCanvas`/issue; evidência: `.capturas/497/portal-financeiro-{1440,390}-{sistema,canvas}.png`; corrigir: alinhar ao canvas ou registrar cada divergência com motivo e a issue da 10.5 que a remove (autonomia 4), no arquivo do item e no PR.
- sugestão, código, `PortalAutoDebitCard.tsx` — no celular o texto da descrição aparece junto de "Desligado"; o canvas mostra só "Desligado" e "Ativar".
- sugestão, código, `portal-financeiro-1440` — coluna do conteúdo do sistema tem 1088 px (176 a 1264) e o canvas 1120 px (160 a 1280); conferir `PortalLayout`.

### Correção da rodada 1
- achado obrigatório (comparação lado a lado) — arquivos: `PortalOpenCharges.tsx` e `PortalChargeHistory.tsx` (títulos "EM ABERTO" e "HISTÓRICO" em `text-2xl uppercase`, como o canvas; "Recibo" com ícone e texto acima de 640 px), `PortalAutoDebitCard.tsx` e `PortalReceiptsCard.tsx` (cartão baixo de uma linha com ícone à esquerda, título e texto; "Ativar" à direita; no celular só "Desligado" e "Ativar"), `frontend/visual/referencias/portal-{financeiro,familia,pix-chave}-*` regeradas, `.capturas/497/*-sistema.png` atualizadas — prova: `npx vitest run src/features/portal src/test/a11y.test.tsx` → 227 passaram; `npx playwright test e2e/portal-finance.spec.ts` → 5 passaram (a primeira versão do cartão estourava a largura a 360 px; corrigido com `flex-wrap`); `npm run test:visual:docker -- --update-snapshots --workers=2 -g "portal-financeiro|portal-pix-chave|portal-familia"` e depois sem `--update-snapshots` → 12 passaram; `npm run visual:canvas -- --exige` → 158 comparadas, 0 reprovadas; eslint e typecheck limpos.
- sugestão do celular (descrição junto de "Desligado") — atendida no mesmo cartão.
Visual do CI: portal-financeiro → passou
Visual do CI: portal-familia → passou
Visual do CI: portal-pix-chave → passou
Divergências restantes, registradas com motivo e a issue que as remove (autonomia 4; os casos passam no limite padrão, então sem `limiteCanvas`): cabeçalho de tabela em caixa alta (componente `DataTable`, #567 e #622); "Histórico" dentro do cartão com abas sublinhadas (canvas: título fora do cartão e abas em controle segmentado à direita), caixa de seleção na cor da marca (canvas: escura) e coluna do conteúdo em 1088 px (canvas 1120; `px-4` do `PortalLayout`, afeta todo o portal): todas na #622, cujo "Pronto quando" ganhou a linha da remoção. Para o PR: citar as divergências de D7 e as acima.
Referências visuais: `frontend/visual/referencias/portal-financeiro-*`, `portal-familia-*`, `portal-pix-chave-*` regeradas de novo (claro e escuro, 1440 e 390).
Regressão completa (verify, test:cov, e2e): não reexecutada; mudança só de apresentação em quatro componentes do portal; vale o registro da T7.

### Rodada 2 — CORRIGIR_CODIGO — 2026-11-19, estado dddc6a75f35931942853b38038a117d27cdab23f

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | mantido da rodada 1; testes do portal passam; capturas 1440/390 conferidas |
| CA2 | PASSOU | mantido da rodada 1; barra "2 selecionadas · R$ 340,00" e "Pagar" em "Em breve" na captura |
| CA3 | PASSOU | captura 1440: cartões lado a lado e "Ativar"/"Em breve"; 390: só "Desligado" + "Ativar" (corrigido) |
| CA4 | PASSOU | mantido; tabela de sete colunas, abas e ícone de recibo na captura 1440 |
| CA5 | PASSOU | mantido da rodada 1 |
| CA6 | PASSOU | mantido; `PixProofDialog.test.tsx` passa |
| CA7 | PASSOU | captura 390 do Pix: página cheia, valor grande, cartão da chave, "Resumo", botão largo |
| CA8 | PASSOU | `vitest run src/features/portal src/test/a11y.test.tsx --maxWorkers=2` → 19 arquivos, 227 passaram |
| CA9 | PASSOU | `npm run test:visual:docker -- --workers=2 -g "portal-financeiro|portal-pix-chave|portal-familia"` sem `--update-snapshots` → 12 passaram; capturas abertas e comparadas |

Comandos: vitest do portal + a11y → 227 passaram; `npm run typecheck` e `eslint src/features/portal` limpos; visual docker → 12 passaram. Regressão completa (verify, test:cov, e2e) não reexecutada: a rodada 1 aceitou o registro da T7 e a correção é só de apresentação.
Instáveis: nenhuma nova.
Achados:
- obrigatório, código, arquivo do item (seção "Divergências restantes") e futura descrição do PR — esperado: toda divergência vista na comparação lado a lado registrada com motivo e a issue que a remove (regra temporária até a #568; autonomia 4); observado: as divergências do celular da janela do Pix (`portal-pix-chave-390`) não estão registradas: canvas tem "Voltar" em texto com chevron e rótulo "PIX NA CHAVE DA UNIDADE" pequeno acima do valor, o sistema tem seta, título grande em caixa alta no cabeçalho e botão de fechar; canvas mostra a chave com ícone de chave e "· Academia Leão Ltda." na mesma linha, o sistema mostra "CHAVE PIX (CNPJ)" e "Titular: Tijuca" em linhas separadas; o sistema lista as cobranças por linha (Aluno · data, valor), o canvas não; zona de envio com botão nativo "Escolher arquivo" visível (canvas: só texto); botão "Enviar comprovante" cinza (desabilitado, correto) mas sem registro; no Financeiro 390, canvas tem "Pagar R$" como botão principal e "Enviar comprovante de Pix" em texto, sistema inverte e mostra a tag de situação por linha, e a tela vem sem rótulo de unidade ("Cobranças e recibos" em vez de "Unidade Tijuca"; já em desvio da T4) e sem o texto "Em aberto" em fonte normal. Evidência: `.capturas/497/portal-pix-chave-390-{sistema,canvas}.png` e `portal-financeiro-390-{sistema,canvas}.png`; corrigir: alinhar ou registrar cada uma com motivo e a issue da 10.5 que a remove (a #622 só cobre o 1440 do Pix e a tabela do Financeiro; se o celular do Pix for ficar fora, acrescentar a linha ao "Pronto quando" da #622 ou de outra issue).
- sugestão, código, `PortalAutoDebitCard.tsx` a 1440 — a descrição quebra em duas linhas ao lado de "Ativar" + "Em breve"; o canvas cabe em uma linha.

### Correção da rodada 2
- achado obrigatório (divergências do celular não registradas) — arquivos: só este arquivo e a issue #622 (sem mudança de código: o caso passa no limite padrão, então sem `limiteCanvas`; autonomia 4) — prova: `gh issue edit 622` aplicado; o "Pronto quando" da #622 ganhou duas linhas com a remoção.
- Divergências do celular registradas com motivo (acabamento visual da janela e da tela no celular, fora do que a R8 e o CA7 exigem, que passaram) e a issue que as remove (#622): (1) janela do Pix 390: canvas com "Voltar" em texto com chevron e rótulo pequeno "PIX NA CHAVE DA UNIDADE" acima do valor, o sistema usa seta, título grande em caixa alta no cabeçalho do `Modal` e botão de fechar; (2) chave com ícone de chave e titular na mesma linha no canvas, o sistema tem "CHAVE PIX (CNPJ)" e "Titular: Tijuca" em linhas separadas (titular é o nome da unidade, D5); (3) o sistema lista as cobranças por linha, o canvas não; (4) zona de envio mostra o botão nativo "Escolher arquivo", o canvas só o texto; (5) "Enviar comprovante" cinza é o estado desabilitado correto sem arquivo; (6) Financeiro 390: o canvas tem "Pagar R$" como botão principal e "Enviar comprovante de Pix" em texto, o sistema inverte (o envio é a ação real; "Pagar" é "Em breve"), mostra a tag de situação por linha (D7) e o rótulo "Cobranças e recibos" no lugar de "Unidade Tijuca". Para o PR: listar também estas.
- sugestão (descrição do débito em duas linhas a 1440): não atendida; só acabamento, entra na #622.
Regressão completa: não reexecutada; sem mudança de código nesta rodada.

### Rodada 3 — OK — 2026-11-19, estado d34c85393a6e5f669a3161182a83fe26b3ee1990

Desde a rodada 2 só mudou este arquivo (correção só de registro). Critérios CA1 a CA9: mantidos da rodada 2 (PASSOU); CA9 reconferido.

Comandos: `npx vitest run src/features/portal src/test/a11y.test.tsx --maxWorkers=2` → passou; `npm run typecheck` → limpo; `npm run test:visual:docker -- --workers=2 -g "portal-financeiro|portal-pix-chave|portal-familia"` sem `--update-snapshots` → 12 passaram. Regressão completa não reexecutada: sem mudança de código desde a T7 e a rodada 1.
Instáveis: nenhuma nova.
Achados: o achado obrigatório da rodada 2 (divergências do celular da janela do Pix sem registro) foi atendido: o registro está neste arquivo e o "Pronto quando" da #622 traz as linhas da remoção (conferido com `gh issue view 622`). A descrição do PR deve citar essas divergências.
- sugestão, código, `PortalAutoDebitCard.tsx` a 1440 — descrição em duas linhas ao lado de "Ativar" (já na #622).

## Entrega

Muda: Financeiro do portal (`/portal/financeiro`) e janela do Pix na chave no visual do canvas. Em aberto em tabela com seleção e, no celular, cartões; barra com "Enviar comprovante de Pix" real e "Pagar R$" em "Em breve"; grupos por unidade na família; cabeçalho com rótulo e chips de aluno; cartões de débito automático ("Ativar" em "Em breve") e de recibos por e-mail; histórico com abas de ano e ícone de recibo. Janela do Pix com aviso, cartão da chave, zona de envio e nota; no celular, página cheia com "Voltar". Sem mudança de API nem de contrato (D1). Textos em `pt-BR.json`.

Verificado: `npx vitest run src/features/portal src/test/a11y.test.tsx` → 227 passaram; typecheck e lint limpos; `npm run test:visual:docker -- --workers=2 -g "portal-financeiro|portal-pix-chave|portal-familia"` sem `--update-snapshots` → 12 passaram (Visual do CI: `portal-financeiro`, `portal-familia`, `portal-pix-chave` → passou); `npm run visual:canvas -- --exige` → 158 comparadas, 0 reprovadas; `e2e/portal-finance.spec.ts` → 5 passaram. Capturas em `.capturas/497/`.

Decisões (detalhe em "Decisões"): D2 (o "Pagar" por linha sai), D3 (composição e "Pagar selecionadas" saem), D5 (tipo da chave pelo formato; titular é o nome da unidade), D7 ("Vencendo" e "Paga" no lugar de "Vence em N dias" e "Paga com atraso", porque a API não traz a contagem).

Divergências com o canvas, todas registradas:
- D7: "Vence em 2 dias", "Paga com atraso", "Valor pago" e total por meio, que a API não traz.
- Janela do Pix no 1440 (`portal-pix-chave`): reprova no limite padrão (66,3% contra 30%, `docs/design/prints/lado-a-lado/resultado.json`); `limiteCanvas` 0,7 com motivo, removido pela #622, cuja remoção já está no "Pronto quando" dela. No 390 passa (15,4%).
- Título da janela: "Pix na chave com comprovante" (contrato, R7) no 1440; "Pix na chave da unidade" no celular (R8).
- Acabamento do 1440 e do celular (cabeçalho de tabela em caixa alta, "Histórico" dentro do cartão, caixa de seleção na cor da marca, coluna de 1088 px, janela e Financeiro no celular, descrição do débito em duas linhas): já listado no "Pronto quando" da #622 (linhas de 1440 e de 390 px).
- Meio de cartão aparece como "Cartão de crédito" (rótulo base); e-mail dos recibos é o da sessão.

Correção de registro: as rodadas 2 e 3 dizem que `portal-pix-chave` passa no limite padrão. No 1440 não passa (66,3%), por isso o `limiteCanvas` fica, com a remoção na #622. O código está de acordo com o `AGENTS.md` (autonomia 4).

Regressão completa (T7, não reexecutada nesta entrega; a base não avançou):
- `frontend/src/features/charges/ChargePanel.test.tsx`, CA20: "tempo de 20 s esgotado sob carga". Isolado, 22 de 22 passaram: instável. Registrado em comentário na #594 (testes instáveis no `test:cov` sob carga).
- `frontend/e2e/portal-inicio.spec.ts`: esperava "Pix na chave com comprovante" a 360 px. Corrigido neste item (o título é "Pix na chave da unidade"); rodado de novo, passou.
- `./backend/mvnw -f backend/pom.xml verify` passou; `npm run lint`, `typecheck` e `build` passaram.

### Correção da entrega
- CI do PR #623: job `visual` falhou em `portal-responsavel` e `portal-celular-reduzido` (8 imagens, 1440/390, claro/escuro); os dois casos abrem `/portal/financeiro`, tela alterada pelo item, e as referências não tinham sido regeradas. Demais jobs verdes (e2e, frontend, security, imagens).
- Referências regeradas — arquivos: `frontend/visual/referencias/portal-responsavel-{1440,390}-{claro,escuro}.png` e `portal-celular-reduzido-{1440,390}-{claro,escuro}.png` — prova: `npm run test:visual:docker -- --workers=2 --update-snapshots -g "portal-responsavel|portal-celular-reduzido"` → 8 passaram; de novo sem `--update-snapshots` → ver abaixo.
Referências visuais: as 8 imagens acima (revisão do dono no fim da sprint).
Visual do CI: portal-responsavel → passou; portal-celular-reduzido → passou

### Rodada 4 — OK — 2026-11-19, estado 80f00b9143bd7e74f46d4b93acffab036cb72e16

Desde a rodada 3 (verificação após o PR #623 aberto): só mudaram 8 referências visuais (`portal-responsavel-*` e `portal-celular-reduzido-*`, 1440 e 390, claro e escuro) e este arquivo. Os dois casos abrem `/portal/financeiro`, tela alterada pelo item, então a mudança visual é a esperada. CA1 a CA9 mantidos da rodada 3 (PASSOU); CA9 reconferido.

Comandos: `npm run test:visual:docker -- --workers=2 -g "portal-financeiro|portal-pix-chave|portal-familia|portal-responsavel|portal-celular-reduzido"` sem `--update-snapshots` → 20 passaram (inclui os dois casos que falharam no CI).
Instáveis: nenhuma nova.
Achados: nenhum obrigatório. A correção da entrega responde à falha do job `visual` do CI. A regressão completa não foi reexecutada: não há mudança de código desde a T7.
