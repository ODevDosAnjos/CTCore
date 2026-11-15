# 481 — Benefícios: lista, conceder, encerrar e substituir no visual do canvas

Origem: issue #481 (Sprint 10.5, Fase 3, plano F6), `docs/auditoria/plano-de-issues.md`, `docs/auditoria/decisoes-canvas.md` (R1 a R4); evidências M12, M73, M74, B11. Branch: `item/481-beneficios-visual-canvas`. Canvas: `BeneficiosLista`, `BeneficioConceder`, `BeneficioSubstituir`, `BeneficioEncerrar` (só 1440 px; não há canvas de celular para benefícios, a captura de 390 px é conferida pelo sistema, D8). Dependências #456, #457, #460, #461, #452 já em `dev` (`PillFilter`, `QuickFilters`, `SearchBox`, `Avatar`/`PersonRow`, `Modal` com `size`/`footer`, `SummaryBox`, `ChoiceCards`, `DateField`, `Banner`, `ComingSoon` existem em `frontend/src/components/`). O item #480 (planos) é o modelo de padrão da tela (`QueryPage` com `canvasStates`, `canvasPagination`, `cards`, `useUnitScope`).

Uma especificação, uma entrega; a construção se divide em partes (A a C, nas tarefas).

## 1. Objetivo

Deixar Financeiro › Benefícios igual ao canvas para Coordenação e Administração, em 1440 px e 390 px e nos temas em que o canvas existe: lista com abas por situação e contagem, avatar do aluno e filtros em pílula; janela "Conceder benefício" com os campos lado a lado, escolha do tipo em dois cartões, caixa "Resumo" e rodapé "Lançado por"; janela de confirmação "Substituir benefício?" com os cartões "Atual" e "Novo" (RN-BEN-08); janela "Encerrar benefício" com resumo, motivo obrigatório e a nota do valor que a próxima cobrança volta a ter. Nenhuma regra de negócio muda.

Fora do escopo: regra de benefício (RN-BEN-01 a RN-BEN-09, já no servidor); cobrança e geração de mensalidade; a tela de Planos (#480); o uso de "Conceder benefício" na ficha do aluno (`RecordEnrollment`, que reaproveita a janela e só é conferido, D7); busca de aluno nas janelas de cobrança (`StudentSearch`, #477).

## 2. Requisitos

- R1 (M12): `/beneficios` mostra o título "Benefícios", o subtítulo "Unidade <nome> · no máximo um benefício ativo por modalidade · vale a partir da próxima cobrança gerada" (com "todas as unidades" quando o seletor está em "todas", D1) e o botão "Conceder benefício" sem ícone "+", só para quem gerencia.
- R2 (M12): abaixo, as abas por situação com contagem "Ativos N", "Benefícios altos N" e "Encerrados N" (`QuickFilters`); "Ativos" mostra os ativos, "Benefícios altos" os ativos com `high` e "Encerrados" os encerrados e os vencidos (D2); a aba inicial é "Ativos".
- R3 (M12): os filtros ficam em pílula com o rótulo acima, "Tipo" (Bolsa e desconto / Bolsa / Desconto) e "Modalidade" (Todas); o filtro de unidade sai e passa a vir do seletor de unidade da barra (`useUnitScope`); a caixa "Benefícios altos" e a aba de situação separada saem (D2); a caixa de busca é `SearchBox` sem placeholder "Aluno" (busca por nome continua).
- R4 (M12): a tabela traz Aluno (avatar com iniciais e nome, unidade abaixo só quando a tela mostra todas as unidades, D1), Modalidade (sem ponto colorido), Tipo, Valor ("Bolsa 50%", "Desconto R$ 30,00"; sem selo "Alto": a linha "Benefício alto" em texto pequeno sob o valor), Motivo, Decidido por, Validade ("até 12/2026", "sem validade", "venceu 30/09") e Situação ("Ativa", "Encerrado", texto com borda e não selo colorido); a nota de rodapé "Benefício acima de 50% (ou desconto acima de metade do plano) avisa o Coordenador e aparece em "Benefícios altos". Não precisa de aprovação." (RN-BEN-06).
- R5 (M12, RF-BEN-03): o ativo tem, na última coluna sem título, o botão de texto "Encerrar" com o nome do aluno no `aria-label`, no lugar do botão grande com coluna "Ações" (D3); só aparece para quem gerencia e para benefício ativo.
- R6 (M12): abaixo de 640 px, um cartão por benefício (avatar, aluno, modalidade, valor, situação, validade, "Encerrar") e "Conceder benefício" em largura total; nada de tabela cortada.
- R7 (M73, RF-BEN-02): a janela "Conceder benefício" (`Modal`) traz, nesta ordem: Aluno (busca com ícone) e Modalidade (seletor) lado a lado, sempre visíveis, com Modalidade desabilitada até haver aluno; o aviso amarelo "<Aluno> já tem uma bolsa de 50% nesta modalidade. Ela será encerrada ao conceder a nova." só quando o servidor diz que substitui; "Tipo" em dois cartões com botão de opção e descrição ("Bolsa · Percentual de 1 a 100%" e "Desconto em reais · Nunca deixa abaixo de zero", `ChoiceCards`); "Percentual" com sufixo "%" (ou "Valor" com "R$" no desconto) e "Validade" com ícone de calendário (`DateField`) lado a lado; "Decidido por" em seletor; "Motivo *" obrigatório; a caixa "Resumo" (D4) e o rodapé "Lançado por <nome da conta>" com "Cancelar" e "Conceder benefício".
- R8 (M73, RF-BEN-02): o "Resumo" aparece quando o servidor devolve a prévia e traz "Plano: <plano> · <valor>", "Benefício: bolsa de 70%" ou "desconto de R$ 30,00", "Nova mensalidade: <valor>", "Vale a partir de <mmm/aaaa>; a cobrança de <mês anterior> já gerada não muda." e, acima de 50% ou desconto acima de metade do plano, "Acima de 50%: o Coordenador recebe um aviso." (RN-BEN-04, RN-BEN-06); mensalidade zero mostra a nota da bolsa de 100% (RN-BEN-05) como hoje.
- R9 (M73): "Decidido por" é um seletor com as pessoas ativas que podem decidir: a conta que está lançando e os professores ativos; o valor enviado ao servidor continua sendo o nome (texto de 2 a 80), sem mudar a API (D5); "Desconto de professor (opcional)" (`teacherId`, RN-BEN-08, RN-PRO-08) continua como seletor opcional abaixo de "Decidido por", só quando há professores (D6).
- R10 (M74, RN-BEN-08): com benefício ativo na modalidade, "Conceder benefício" não grava de imediato: abre a janela "Substituir benefício?" (`Modal size="sm"`) com o subtítulo "<Aluno> · <Modalidade>", o texto "<Aluno> já tem um benefício ativo no <Modalidade>. Cada modalidade tem um benefício por vez.", os cartões "Atual" e "Novo" lado a lado (Tipo, Valor, Motivo, Validade), `SummaryBox` "Resumo" ("Confirmando, o novo substitui o atual a partir da próxima cobrança gerada: <nova mensalidade> em vez de <mensalidade atual>." e "O benefício atual fica encerrado, com o motivo, no histórico.") e os botões "Manter o atual" e "Substituir"; "Substituir" envia `replaceExisting: true`; "Manter o atual" fecha só esta janela, nada é gravado e o formulário continua preenchido (D9).
- R11 (B11, RF-BEN-03): a janela "Encerrar benefício" (`Modal size="sm"`, título em caixa alta) traz `SummaryBox` "Resumo" ("<Aluno> · <Modalidade> · desconto de R$ 30,00 · até 11/2026" ou "bolsa de 50% · sem validade"), "Motivo *" obrigatório, a nota "A próxima cobrança gerada (<mês>) volta a <valor do plano>. A de <mês anterior> não muda." e os botões "Voltar" e "Encerrar benefício" em perigo (contorno vermelho), desabilitado até haver motivo de 2 caracteres ou mais.
- R12: a API muda para igualar o canvas, sem contrariar a especificação (regra R2 do dono, D1 a D3): `GET /benefits` aceita `status=CLOSED` (encerrado ou vencido) e devolve `counts` (`active`, `high`, `closed`) calculados com os mesmos filtros de busca, tipo, modalidade e unidade, mas sem situação; cada `BenefitRow` ganha `planValueCents` e `nextChargeMonth` (`AAAA-MM`, a mesma regra do `effectiveFrom` da prévia) para a nota do encerramento.
- R13: permissões iguais às de hoje: só quem tem Benefícios vê a tela; sem permissão de gestão o botão "Conceder benefício" e "Encerrar" não aparecem e a tela mostra "sem permissão"; o servidor continua sendo a barreira.
- R14: os quatro estados (carregando, vazio, erro, sem permissão) funcionam na tela e em cada janela, com o axe passando nos dois temas e a partir de 360 px; todo texto em `pt-BR.json`.
- R15: a comparação com o canvas é feita e registrada; `beneficio-conceder` perde o `limiteCanvas` da #481 e a comparação automática passa com o limite padrão de 30% (o mesmo vale para os casos novos, D10).
- R16: as regras continuam valendo e testadas: RN-BEN-01 a RN-BEN-08, RF-BEN-01, RF-BEN-02, RF-BEN-03.

## 3. Critérios de aceite

- CA1 (R1): dado a unidade Tijuca escolhida, quando abre `/beneficios`, então o subtítulo diz "Unidade Tijuca · no máximo um benefício ativo por modalidade · vale a partir da próxima cobrança gerada" e "Conceder benefício" não tem ícone; com "todas" o subtítulo cita "todas as unidades".
- CA2 (R2, R12): dado 14 ativos, 2 altos e 9 encerrados ou vencidos, quando a tela carrega, então as abas mostram "Ativos 14", "Benefícios altos 2" e "Encerrados 9"; escolher "Encerrados" mostra encerrados e vencidos e a chamada leva `status=CLOSED`; "Benefícios altos" leva `status=ACTIVE&high=true`.
- CA3 (R3): a tela tem as pílulas "Tipo" e "Modalidade", sem filtro de unidade, sem caixa "Benefícios altos" e sem placeholder "Aluno"; escolher "Muay Thai" mantém só a modalidade (a chamada leva `modalityId`); com a unidade da barra mudada, a chamada leva `unitId`.
- CA4 (R4): dado o cenário do canvas, a tabela mostra as cinco linhas com avatar "DN", "Bolsa 50%", "Desconto R$ 30,00", "Benefício alto" sob os 100%, "até 12/2026", "sem validade", "venceu 30/09", "Ativa" e "Encerrado" sem selo colorido, sem ponto da modalidade, e a nota de rodapé.
- CA5 (R5, R13): dado Coordenador, um benefício ativo tem "Encerrar" na linha e um encerrado não; com `BENEFITS = NONE` a tela mostra "sem permissão" e nenhum dos dois botões.
- CA6 (R6): a 390 px aparecem cartões de benefício, "Conceder benefício" em largura total, sem tabela nem rolagem horizontal da página.
- CA7 (R7): "Conceder benefício" abre a janela com Aluno e Modalidade lado a lado a 1440 px, Modalidade desabilitada sem aluno, "Tipo" em dois cartões (padrão Bolsa), "Percentual" com "%", "Validade" com ícone de calendário, "Decidido por" em seletor, "Motivo *" e rodapé "Lançado por Carla Mendes"; sem aluno, tipo, valor, decidido por ou motivo, o botão fica desabilitado; mensagem de erro do servidor (400) aparece junto do campo.
- CA8 (R8): com aluno, modalidade e 70%, o "Resumo" mostra "Plano: Kids 2x · R$ 150,00", "Benefício: bolsa de 70%", "Nova mensalidade: R$ 45,00", "Vale a partir de nov/2026; a cobrança de out/2026 já gerada não muda." e "Acima de 50%: o Coordenador recebe um aviso."; com 30% a última linha não aparece; com desconto em reais mostra "desconto de R$ 30,00"; com 100% aparece a nota de mensalidade zero.
- CA9 (R7, R10): dado aluno com bolsa ativa na modalidade, quando escolhe a modalidade, então o aviso amarelo "Davi já tem uma bolsa de 50% nesta modalidade. Ela será encerrada ao conceder a nova." aparece na janela e, ao clicar "Conceder benefício", abre "Substituir benefício?" sem chamar `POST /benefits`.
- CA10 (R10): na janela "Substituir benefício?", o cartão "Atual" mostra Tipo, Valor, Motivo e Validade do ativo e o "Novo" os do digitado; o resumo diz "R$ 90,00 em vez de R$ 150,00"; "Substituir" chama `POST /benefits` com `replaceExisting: true`, fecha as duas janelas e recarrega; "Manter o atual" fecha só a de confirmação, não chama a API e o formulário continua preenchido; 403 e erro mostram o estado na janela e nada fecha.
- CA11 (R10): dado benefício ativo e `replaces` falso (modalidade sem benefício), "Conceder benefício" grava direto, sem janela de substituição, com `replaceExisting: false`; dado outro benefício criado por outra pessoa entre a prévia e o clique (409), a janela mostra o erro de conflito e nada muda.
- CA12 (R9): "Decidido por" lista a conta que lança e os professores ativos; a escolha segue como texto em `decidedBy`; "Desconto de professor (opcional)" só aparece com professores e envia `teacherId` quando escolhido.
- CA13 (R11): "Encerrar" na linha de Marina Teixeira abre a janela com o resumo "Marina Teixeira · Jiu-Jitsu · desconto de R$ 30,00 · até 11/2026", "Motivo *", a nota "A próxima cobrança gerada (nov/2026) volta a R$ 180,00. A de out/2026 não muda." e "Voltar"/"Encerrar benefício" em vermelho; sem motivo o botão fica desabilitado; confirmar chama `POST /benefits/{id}/end`, fecha e recarrega; 409 mostra o estado "já encerrado" e recarrega.
- CA14 (R12): `GET /benefits?status=CLOSED` devolve encerrados e vencidos; `counts` traz `active`, `high` e `closed` e ignora `status` e `high` do pedido mas respeita busca, tipo, modalidade e unidade; cada linha traz `planValueCents` e `nextChargeMonth`; isolamento entre organizações e unidades do Administrador e 403 por perfil continuam valendo; nada é auditado.
- CA15 (R14): a tela mostra carregando, vazio (aba sem benefícios, com texto próprio), erro com "Tentar de novo" e sem permissão; cada janela mostra carregando, erro e sem permissão; axe sem achados nos temas claro e escuro e, a 360 px, sem rolagem horizontal.
- CA16 (R15): `npm run test:visual:docker -- -g "beneficio"` passa com as referências novas (1440 e 390, claro e escuro) e `npm run visual:canvas -- --exige` passa para os casos desta tela; as capturas lado a lado em 1440 e 390 px estão em `.capturas/481/`.
- CA17 (R16): cada código de regra da lista tem ao menos um teste que o cita (os do back-end já existem e seguem verdes).

## 4. Plano técnico

- Dados: não muda (sem migração). `nextChargeMonth` sai de `enrollment_modality.due_day` e do fuso da unidade com `BenefitWrite.effectiveFrom(today, dueDay)`; `planValueCents` do plano da modalidade (`p.value_cents`, já lido no `SELECT`).
- Especificação e contrato (primeiro): `docs/especificacao/07-planos-e-beneficios.md` (RF-BEN-01: abas por situação com contagem, filtros de tipo e modalidade, unidade pelo seletor; RF-BEN-02: a substituição pede confirmação em janela própria com atual e novo; RF-BEN-03: o resumo mostra o valor que a próxima cobrança volta a ter); `docs/openapi.yaml`: `GET /benefits` (linha ~2124) ganha `CLOSED` em `status` e `counts` em `BenefitList`; `BenefitRow` (linha ~4880) ganha `planValueCents` e `nextChargeMonth` (`required`).
- API (`backend/src/main/java/br/com/ctcore/benefit/`, existe): `Benefits.java`: `Row` ganha `planValueCents` e `nextChargeMonth`; `SELECT` leva `em.due_day` e `u.timezone`, `mapRow` calcula o mês com `BenefitWrite.effectiveFrom`; `list` aceita `status=CLOSED` (`STATUS_SQL <> 'ACTIVE'`) e `high` só em ativos quando junto de `status=ACTIVE`; `PageResponse` ganha `counts` (três `count(*)` com os filtros menos situação e alto; ver como `charge` já devolve `counts`, para reaproveitar o tipo); `BenefitController.java`: aceita o valor novo, sem rota nova (logo o teste de rota é o do `GET` existente). `BenefitWrite.java`: `effectiveFrom` passa a ser visível ao pacote (hoje `static` privado do pacote, conferir). Permissão e alcance: os de hoje.
- Interface (`frontend/src/features/benefits/`, existe, salvo o dito "a criar"):
  - `BenefitsPage.tsx`: tela completa (`PageHeader` com subtítulo e ação sem ícone, `QueryPage` com `QuickFilters` em `header` lendo `counts`, `PillFilter`s, `SearchBox` sem placeholder, `canvasPagination`, `canvasStates`, `cards` para o celular, `Avatar`, nota de rodapé, "Encerrar" em texto); `BenefitFilters.tsx`: só as pílulas "Tipo" e "Modalidade" (`unitId` vem de `useUnitScope`, como `PlansPage`); `useBenefits.ts`: `BenefitRow` com `planValueCents` e `nextChargeMonth`, `status` com `CLOSED`, `counts` no retorno de `fetchBenefits` e `unitId` do escopo.
  - `GrantBenefitDialog.tsx`: refeito sobre `Modal` com `footer` (hoje usa `ModalityDialog`, da ficha do aluno, que continua em `students/ModalityPickers`): `Field`/`Input`/`Select`, `ChoiceCards` para o tipo, `DateField`, `Banner` amarelo, `SummaryBox`, `LastChange`-like "Lançado por" com o nome da conta (`useAuth`/sessão, conferir o hook usado em `LastChange`), seletor "Decidido por"; mantém exportados `GrantTarget` e `useStudentModalities` (usados em `RecordEnrollment` e nas janelas de cobrança), e o modo `fixed` (ficha do aluno) com aluno e modalidade em texto (D7).
  - `ReplaceBenefitDialog.tsx` (a criar): janela de confirmação com `Modal size="sm"`, dois cartões Atual e Novo, `SummaryBox` e botões; recebe `current` e `next` (de `useBenefitPreview`) e devolve `onConfirm`/`onKeep`.
  - `EndBenefitDialog.tsx`: `Modal size="sm"`, `SummaryBox`, `ReasonField` (existe em `components/ReasonField.tsx`, conferir se serve ao "Motivo *" do canvas), nota com `planValueCents` e `nextChargeMonth`, botões "Voltar" e "Encerrar benefício" (perigo).
  - `useGrantBenefit.ts`: tipos sem mudança de contrato do `POST`; `BenefitPreview.current` ganha os campos novos pelo `BenefitRow`.
  - `frontend/src/i18n/pt-BR.json` (`benefits.*`): textos do canvas; saem as chaves sem uso; lint de texto literal passa.
  - `frontend/src/mocks/handlers.ts` (linhas ~404 a 440 e ~2822 a 2960): `mockBenefits` ganha o cenário do canvas (Davi 50%, Pedro 100%, Theo 10%, Marina R$ 30,00, Olívia 60% vencida; "Marcos Leão" e "Carla Mendes"); `GET /benefits` com `CLOSED`, `counts`, `planValueCents`, `nextChargeMonth`; o `counts` do canvas (14, 2, 9) vem de um indicador do caso visual, como `planosCanvas` (D10); testes `*.msw.test.ts` do cenário.
  - `frontend/visual/casos.ts`: `beneficios` (canvas `BeneficiosLista`), `beneficio-conceder` (sem `limiteCanvas`), `beneficio-substituir` (`BeneficioSubstituir`) e `beneficio-encerrar` (`BeneficioEncerrar`, passo "Encerrar" da linha de Marina), com `beneficiosCanvas?: boolean` em `Caso` e o tratamento em `frontend/visual/*.spec.ts` (ver como `planosCanvas` foi ligado); `BeneficioSubstituir` e `BeneficioEncerrar` saem de `semCaso`, se estiverem lá.
  - Testes: `BenefitsPage.test.tsx` (reescrito: abas e contagem, pílulas, tabela, celular, estados, "Encerrar"), `GrantBenefitDialog.test.tsx` (ajustado: campos, resumo, tipo, "Decidido por", professor, substituição), novo `ReplaceBenefitDialog.test.tsx`, `EndBenefitDialog.test.tsx` (ajustado: resumo, nota, perigo), `src/test/a11y.test.tsx`; conferir `features/students/RecordEnrollment*.test.tsx`, `features/charges/*Dialog*.test.tsx` que importam de `GrantBenefitDialog`, e `frontend/e2e/*.spec.ts` (nenhum cita benefícios hoje).
- Back-end, testes: `BenefitListIT` (existe em `backend/src/test/java/br/com/ctcore/benefit/`) ganha `CLOSED`, `counts`, os dois campos novos e o isolamento; `ContractRoutesTest` e `OpenApiContractTest`.
- Segurança: permissão e alcance no servidor (as de hoje); `counts` respeita o alcance do Administrador; nenhum dado novo de aluno; dados de teste fictícios; o nome de "Lançado por" é o da conta já logada.
- Reuso: `QueryPage`/`RowCard`, `QuickFilters`, `PillFilter`, `SearchBox`, `Avatar`, `Modal`, `SummaryBox`, `ChoiceCards`, `DateField`, `Banner`, `states`, `PageHeader`, `useUnitScope`, `usePermissions`, `formatMoney`, `MoneyField`, `useResource`, `useStudentModalities`, `useBenefitPreview`.
- Riscos: (1) `GrantBenefitDialog` é usada na ficha do aluno (`fixed`) e a troca de `ModalityDialog` por `Modal` não pode quebrar seus testes nem o fluxo da matrícula. (2) Os três `count(*)` somam consultas à lista: medir em `BenefitListIT` e aceitar se a lista continuar abaixo de 500 ms com 5 mil benefícios (meta 300 ms; faixa até 500 ms; plano B: um só `count(*) filter (where ...)`). (3) O canvas `BeneficioSubstituir` mostra a tela de Planos ao fundo e a do sistema abre sobre Benefícios: a comparação pode reprovar só pelo fundo; plano B: registrar `limiteCanvas` com esse motivo (decisão do dono R1: o canvas vence no visual da janela, que é o que o verificador confere lado a lado). (4) O MSW tem poucos benefícios: ajustar o cenário antes de pedir exceção.

## 5. Tarefas

- [x] T1: Parte A, especificação e contrato: `07-planos-e-beneficios.md` e `openapi.yaml` (`status=CLOSED`, `counts`, `planValueCents`, `nextChargeMonth`) — não cobre critério: regra do AGENTS.md (muda primeiro a especificação e o contrato) — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`.
- [x] T2: Parte A, servidor: `Benefits.Row`, `SELECT`, `list` com `CLOSED` e `counts`, `BenefitController`, teste de integração com isolamento e perfis — cobre CA14, CA17 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='Benefit*IT' -Dtest=NoTest -Dsurefire.failIfNoSpecifiedTests=false`.
- [x] T3: Parte A, MSW e tipos: `useBenefits.ts`, `useGrantBenefit.ts`, `handlers.ts` (cenário do canvas, `CLOSED`, `counts`, campos novos), teste do cenário — cobre CA14 (dados) — prova: `npm test -- mocks benefits` (em `frontend/`).
- [x] T4: Parte B, tela: `BenefitsPage.tsx`, `BenefitFilters.tsx`, pt-BR, `BenefitsPage.test.tsx` — cobre CA1 a CA6, CA15 (tela) — prova: `npm test -- BenefitsPage`.
- [x] T5: Parte C, conceder e substituir: `GrantBenefitDialog.tsx` refeito, `ReplaceBenefitDialog.tsx` (novo) e testes, sem quebrar a ficha do aluno — cobre CA7 a CA12, CA15 (janelas) — prova: `npm test -- GrantBenefitDialog ReplaceBenefitDialog RecordEnrollment StudentSearch`.
- [x] T6: Parte C, encerrar: `EndBenefitDialog.tsx` e teste — cobre CA13, CA15 (janela) — prova: `npm test -- EndBenefitDialog`.
- [x] T7: Parte C, visual: casos de `visual/casos.ts` (`beneficios`, `beneficio-conceder` sem `limiteCanvas`, `beneficio-substituir`, `beneficio-encerrar`), indicador `beneficiosCanvas`, capturas em 1440 e 390 px em `.capturas/481/` com o navegador em pt-BR, `npm run test:visual:docker -- --update-snapshots -g "beneficio"` só destes casos, depois sem `--update-snapshots`, `npm run visual:canvas -- --exige`, `a11y.test.tsx` — cobre CA15 (axe), CA16 — prova: `npm run test:visual:docker -- -g "beneficio"` e `npm run visual:canvas -- --exige`.
- [x] T8: regressão do front e do back que tocam benefícios — cobre CA17 — prova: `./backend/mvnw -f backend/pom.xml verify` e, em `frontend/`, `npm run lint && npm run typecheck && npm run build && npm run test:cov && npm run e2e`.

## 6. Decisões

- D1 (muda o comportamento): o filtro de unidade sai da tela e a lista segue o seletor de unidade da barra (como `/planos` na #480); "todas" mostra a unidade sob o nome do aluno e o subtítulo cita "todas as unidades". Motivo: o canvas não tem filtro de unidade e tem "Unidade Tijuca" no subtítulo. Alternativa: manter o filtro e o seletor, descartada por duplicar a escolha.
- D2 (muda o comportamento): as situações viram abas (Ativos, Benefícios altos, Encerrados) e "Encerrados" junta encerrados e vencidos (o canvas mostra o vencido como "Encerrado, venceu 30/09"); "Benefícios altos" é a aba dos ativos altos, e a caixa e o filtro de situação saem. O servidor ganha `status=CLOSED` e `counts` (R2 do dono: a API muda para igualar o canvas). Alternativa: três chamadas de contagem no front, descartada por repetir filtros e por não somar encerrado e vencido num só `status`.
- D3: o canvas da lista não tem coluna de ações; "Encerrar" continua como botão de texto na última coluna sem título (RF-BEN-03 precisa de um caminho de acesso). Divergência registrada no PR. Alternativa: abrir pela linha inteira, descartada por não ser descobrível nem acessível ao teclado.
- D4: o "Resumo" do conceder vem da prévia do servidor (`POST /benefits/preview`), como hoje; os textos novos ("Vale a partir de nov/2026; a cobrança de out/2026 já gerada não muda") usam `effectiveFrom` e o mês anterior calculado no front; sem nova rota.
- D5 (muda o comportamento): "Decidido por" vira seletor com a conta que lança e os professores ativos, mas o valor enviado segue como texto em `decidedBy`; a API não muda e benefícios antigos com outro nome continuam válidos. Alternativa: seletor de todas as pessoas com papel de gestão, descartada por não haver rota de listagem de equipe nem regra de quem pode decidir.
- D6: "Desconto de professor (opcional)" não existe no canvas, mas é regra de negócio (RN-BEN-08, RN-PRO-08: inativar o professor encerra o benefício); fica como seletor opcional abaixo de "Decidido por" e a especificação vence a regra, o canvas o visual (R3 do dono). Divergência registrada no PR.
- D7: o modo `fixed` (janela aberta da ficha do aluno, com aluno e modalidade já escolhidos) usa a mesma janela nova, com aluno e modalidade em texto no lugar da busca; não é tela do canvas e só é conferido que continua funcionando.
- D8: não há canvas de celular dos benefícios nem canvas de 390 px: a captura de 390 px é a do sistema, sem comparação automática (como a #435 faz para telas sem `canvasCelular`); no celular valem os cartões de `RowCard` e os componentes base.
- D9: "Manter o atual" volta ao formulário preenchido (RN-BEN-08: cancelar mantém o atual). Alternativa: fechar as duas janelas, descartada por perder o que a pessoa digitou.
- D10: o cenário do canvas (contagens 14, 2 e 9) é ligado só no caso visual por `beneficiosCanvas`, para o cenário compartilhado do MSW não mudar; só dado ou fundo, com motivo e issue que o remova, vira `limiteCanvas` (regra 4 da Autonomia).
- Suposição: `ReasonField` e `QuickFilters` servem como estão; se o canvas pedir outro desenho, o ajuste é local na tela. Se a regra do mês de `nextChargeMonth` divergir da prévia, o servidor usa a da prévia (`BenefitWrite.effectiveFrom`).

## Construção

- T1 — arquivos: `docs/especificacao/07-planos-e-beneficios.md` (RF-BEN-01 a RF-BEN-03), `docs/openapi.yaml` (`status=CLOSED`, `counts` em `BenefitList`, `planValueCents` e `nextChargeMonth` em `BenefitRow`) — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest,BenefitsTest,BenefitWriteTest'` → 12 testes, verde.
- T2 — arquivos: `backend/.../benefit/Benefits.java` (`Row` com os dois campos, `Counts`, `BenefitList`, `CLOSED`, contagens num só `count(*) filter`), `BenefitController.java`, `BenefitListIT.java` (teste novo `closedCountsAndPlanFields`: CLOSED, counts com busca/unidade/alcance do Administrador, campos novos, outra organização) — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='Benefit*IT' -Dtest=NoTest -Dsurefire.failIfNoSpecifiedTests=false` → BenefitEndIT 6, BenefitGrantIT 8, BenefitListIT 7, todos verdes (o JaCoCo reprova só nessa execução parcial, esperado).
- T3 — arquivos: `useBenefits.ts` (tipos, `BENEFIT_VIEWS`, `fetchBenefits(q, unitId)` com aba, counts), `mocks/handlers.ts` (`CLOSED`, `counts`, `planValueCents`, `nextChargeMonth`), `mocks/benefits.msw.test.ts` — prova: `npx vitest run src/mocks/benefits.msw.test.ts` → 4 testes verdes.
- T4 — arquivos: `BenefitsPage.tsx`, `BenefitFilters.tsx`, `benefitFormat.ts` (novo), `BenefitsPage.test.tsx` (reescrito, 11 testes), `i18n/pt-BR.json` (`benefits.*`), `components/query/QueryPage.tsx` (`tabKeys` e `texts` como função, para o vazio de cada aba) — prova: `npx vitest run src/features/benefits/BenefitsPage.test.tsx` → 11 verdes (CA1 a CA6, CA15, axe 360 px nos dois temas).
- T5 — arquivos: `GrantBenefitDialog.tsx` (refeito sobre `ModalityDialog` size md: busca com `StudentSearch`, Modalidade desabilitada sem aluno, aviso amarelo, `ChoiceCards`, `DateField`, "Decidido por" em seletor, professor opcional, `ReasonField`, `SummaryBox`, "Lançado por"), `ReplaceBenefitDialog.tsx` (novo), `students/ModalityPickers.tsx` (`footerNote`, `beforeSubmit`, `scrim` em `ModalityDialog`), `students/RecordEnrollment.test.tsx` (envolve com `SessionProvider`), testes `GrantBenefitDialog.test.tsx` (reescrito) e `ReplaceBenefitDialog.test.tsx` (novo) — prova: `npx vitest run src/features/benefits src/features/students/RecordEnrollment.test.tsx src/features/charges` → verdes (CA7 a CA12, RN-BEN-08, RN-PRO-08).
- T6 — arquivos: `EndBenefitDialog.tsx` (Modal size sm, `SummaryBox`, `ReasonField`, nota do valor do plano, botão "Encerrar benefício" em vermelho cheio), `EndBenefitDialog.test.tsx` — prova: `npx vitest run src/features/benefits/EndBenefitDialog.test.tsx` → verde (CA13).
- T7 — arquivos: `visual/casos.ts` (`beneficios`, `beneficio-conceder` sem `limiteCanvas`, `beneficio-substituir`, `beneficio-encerrar`; `beneficios?: "lista"|"davi"|"marina"` em `Caso`; `BeneficioEncerrar` e `BeneficioSubstituir` saem de `semCaso`), `visual/telas.visual.ts` (cenário do canvas por override do MSW na página: unidade Tijuca, cinco benefícios, contagens 14/2/9, aluno, matrícula, prévia, professor), `visual/comparar.mjs` (remove todas as anotações `: Passo[]`, não só a primeira) — prova: `npm run test:visual:docker -- -g "beneficio"` e `npm run visual:canvas -- --exige` → ver abaixo. `a11y.test.tsx` não cita benefícios; o axe está nos testes de tela e de janela.
- T8 — regressão, ver abaixo.

Comparação com o canvas (1440 px, claro; `visual:canvas`): beneficios 1,6%, beneficio-conceder 10,6%, beneficio-encerrar 0,7%, beneficio-substituir 56,4% (limite do caso 70%, ver Desvios). Capturas do sistema e do canvas (1440 e 390 px; 390 só do sistema, D8) em `.capturas/481/`. Divergências achadas e como ficaram:
- Janela "Conceder": o canvas tem "Percentual / Validade / Decidido por" na mesma linha, Motivo de uma linha e fundo de janela mais claro: feitos (grade de 3 colunas, `rows={1}`, `scrim="canvas"`). "Desconto de professor (opcional)" não está no canvas e fica abaixo (D6, regra de negócio RN-BEN-08).
- Janela "Encerrar": o botão do canvas é vermelho cheio quando habilitado (a R11 dizia "contorno vermelho"): usei `dangerSolid`, o canvas vence no visual.
- Janela "Substituir": o canvas tem o subtítulo no cabeçalho e "Desconto de professor" como tipo do novo; o sistema põe o subtítulo no corpo e o tipo "Bolsa" (o tipo do canvas não existe na API).
- Lista: o canvas mostra a unidade sob o nome mesmo com uma unidade só; o sistema só mostra com "todas" (D1). Passa a 1,6%.
Visual do CI: beneficios → passou; beneficio-conceder → passou; beneficio-substituir → passou; beneficio-encerrar → passou (`npm run test:visual:docker -- -g "beneficio"`, 16 testes, sem `--update-snapshots`).
Referências visuais: `frontend/visual/referencias/beneficios-*`, `beneficio-conceder-*` (alteradas) e `beneficio-substituir-*`, `beneficio-encerrar-*` (novas), 1440 e 390, claro e escuro. Observação: `--update-snapshots` (modo "changed") não regrava imagem cuja diferença fica dentro da tolerância do Playwright (o escurecimento do fundo passou despercebido); `--update-snapshots=all` regerou.

Regressão (comparada com a linha de base: nenhuma falha anterior registrada):
- `npm run lint` → 0 erros; `npm run typecheck` → ok; `npm run build` → ok.
- `npm run test:cov` → 253 arquivos, 2415 testes verdes, limites de cobertura cumpridos (linhas 97,02%).
- `npm run e2e` → 96 passaram, 2 instáveis (`configuracao-unidade.spec.ts` e `portal-pedidos.spec.ts` dark, sem relação com benefícios); repetidos, passaram (3 de 3).
- `./backend/mvnw -f backend/pom.xml verify` → 886 testes de integração, 1 falha instável (`AnnouncementSendJobIT.sendsDueOnce`, comunicação, sem relação); repetida isolada, passou (2 de 2). Como o `verify` parou na falha, o passo do JaCoCo (100% em `billing`, `payment`, `subscription`, `deactivation`, `isolation`) não rodou nesta máquina; o item não toca esses pacotes e o CI do PR é a prova (AGENTS, autonomia 2).
Desvios:
- `limiteCanvas` (0,7) em `beneficio-substituir`: medido a 56,4% porque o canvas mostra a tela de Planos atrás da janela e o sistema abre a confirmação sobre a janela Conceder, que fica aberta para "Manter o atual" voltar ao formulário preenchido (D9). Prevista como plano B no risco 3. Falta acrescentar `beneficio-substituir` ao "Pronto quando" da #577 (`gh issue edit 577`), pela regra 4 da Autonomia: fica para a entrega.
- O "Resumo" do canvas vem antes do rodapé e depois de "Motivo": o `ModalityDialog` põe `summary` antes do motivo, então a janela Conceder monta `ReasonField` e `SummaryBox` no corpo, sem as props `summary` e `reason`.
- O aviso de substituição aparece ao escolher a modalidade (CA9), antes de haver valor: uma segunda prévia com 1% só para saber se há benefício ativo (`check` em `GrantBenefitDialog`); o resumo usa a prévia do valor digitado.
- `nextChargeMonth` usa a data do banco no fuso da unidade (mesma base do `STATUS_SQL`) e `BenefitWrite.effectiveFrom`, sem injetar o `Clock`.
- Subtítulo "todas": "Todas as unidades · no máximo um benefício ativo…" (a R1 só dizia "todas as unidades").
Não é do item: `specs/backlog.md` já estava alterado no início da sessão.

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-14, estado c9770f1338aa64bd67ba58d318377ed135b0b550

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA6 | PASSOU | `vitest run src/features/benefits` (BenefitsPage.test.tsx), capturas `.capturas/481/beneficios-*` conferidas lado a lado |
| CA7 a CA12 | PASSOU | `GrantBenefitDialog.test.tsx`, `ReplaceBenefitDialog.test.tsx`, `RecordEnrollment.test.tsx`; 20 arquivos, 190 testes verdes |
| CA13 | PASSOU | `EndBenefitDialog.test.tsx` (R$ 180,00 no teste); a captura visual mostra R$ 150,00 (ver sugestão) |
| CA14 | PASSOU | `BenefitListIT` 7, `BenefitEndIT` 6, `BenefitGrantIT` 8, `OpenApiContractTest` 4, `ContractRoutesTest` 3 verdes |
| CA15 | PASSOU | axe nos testes de tela e de janela (verdes) |
| CA16 | PASSOU | `test:visual:docker -- -g "beneficio"` 16 de 16 (1ª execução teve 3 timeouts de 30 s com o vitest rodando em paralelo; sozinha, passou); `visual:canvas --exige` 139 comparadas, 0 reprovadas; capturas lado a lado conferidas |
| CA17 | PASSOU | testes citam RN-BEN-* (BenefitListIT, GrantBenefitDialog, Replace, End) |

Comandos: vitest dos itens → 190 verdes; `npm run lint` → ok; `tsc --noEmit` → ok; Maven dos testes acima → BUILD SUCCESS. Regressão completa (`verify` inteiro, `test:cov`, `e2e`) não repetida: vale o registro da construção e o CI do PR.
Visual do CI (rodado aqui): beneficios, beneficio-conceder, beneficio-substituir, beneficio-encerrar → passaram.
Instáveis: os 3 timeouts da 1ª execução visual (conceder 1440 claro e escuro, substituir 1440 escuro) sumiram ao rodar sozinha; ligados à carga da máquina.
Achados:
- obrigatório, código, `docs/openapi.yaml` `BenefitRow.nextChargeMonth` — esperado: `pattern: '^\d{4}-\d{2}$'`; observado: `'^d{4}-d{2}$'` (sem a barra invertida), que não casa com "2026-11"; evidência: diff do arquivo; corrigir: `'^[0-9]{4}-[0-9]{2}$'` (estilo do resto do arquivo).
- obrigatório, código, `specs/itens/481` "Desvios" — esperado: `beneficio-substituir` no "Pronto quando" da #577 (regra 4 da Autonomia, uso de `limiteCanvas`); observado: pendente ("fica para a entrega"); corrigir: `gh issue edit 577` antes do merge (confirmar na entrega). Compare com a captura: o fundo do canvas é a tela de Planos, o sistema abre sobre Conceder.
- sugestão, código — visual do caso `beneficio-encerrar`: o cenário de `visual/telas.visual.ts` usa `planValueCents: 15000`, então a captura diz "volta a R$ 150,00" e o canvas "R$ 180,00" (CA13).
- sugestão, código — lista: a linha encerrada de Olívia mostra "Benefício alto" sob o 60%; o canvas não mostra. Também "Buscar por nome" como texto da busca e o rodapé "Por página" não existem no canvas.
- sugestão, código — janela Conceder: o canvas mostra "Aluno" como campo de busca com ícone já preenchido e o plano ("Kids 2x R$ 150,00") na modalidade; o sistema mostra cartão com "Trocar" e sem valor; "Decidido por *" tem asterisco que o canvas não tem; cartão "Bolsa" selecionado com fundo rosado, o canvas usa contorno escuro.

### Correção da rodada 1
- `nextChargeMonth` com padrão sem barra invertida — arquivos: `docs/openapi.yaml` (`'^[0-9]{4}-[0-9]{2}$'`) — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'` → verde.
- `beneficio-substituir` no "Pronto quando" da #577 — `gh issue edit 577` (linha acrescentada sobre o `limiteCanvas` do caso e o limite padrão) — prova: `gh issue view 577` mostra a linha.
- Sugestões (R$ 150,00 do cenário, detalhes da lista e da janela Conceder) não são obrigação: não feitas.

### Rodada 2 — OK — 2026-11-14, estado cb1a7d21c275fc2e283033e789b6a96b50500883

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA13, CA15, CA17 | PASSOU | mantido da rodada 1 (nenhum código do front nem do servidor mudou) |
| CA14 | PASSOU | `OpenApiContractTest` 4 e `ContractRoutesTest` 3 verdes com o padrão corrigido; restante mantido da rodada 1 |
| CA16 | PASSOU | mantido da rodada 1 (só `docs/openapi.yaml` mudou desde então; sem efeito visual) |

Comandos: `git diff c9770f1... cb1a7d2...` → só `docs/openapi.yaml` (uma linha) e o arquivo do item; `mvnw test -Dtest='OpenApiContractTest,ContractRoutesTest'` → 7 verdes, BUILD SUCCESS.
Achados da rodada 1: (1) `nextChargeMonth` com `'^[0-9]{4}-[0-9]{2}$'` em `docs/openapi.yaml` linha 4900 → corrigido; (2) `gh issue view 577` traz a linha sobre `beneficio-substituir` sem `limiteCanvas` → corrigido.
Achados obrigatórios: nenhum.
Sugestões: as 3 da rodada 1 seguem abertas, sem impedir a entrega.

### Rodada 3 — OK — 2026-11-14, estado 9330b8e8bc28b1913099d495d6244d697289fa31

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA15, CA17 | PASSOU | mantido das rodadas 1 e 2 (nenhum código de tela, servidor ou contrato mudou) |
| CA16 | PASSOU | `npm run test:visual:docker -- -g "dia-sem-aula|beneficio"` → 20 de 20 passaram, sem `--update-snapshots` (dia-sem-aula-novo 1440/390 claro e escuro, e os 16 de benefício) |

Comandos: `git diff HEAD` → só `frontend/visual/casos.ts` (`"Motivo"` volta a `"Motivo *"` em `dia-sem-aula-novo`, igual à base) e o arquivo do item; teste visual acima.
Achados da entrega (job `visual` do CI, `dia-sem-aula-novo`): corrigido, passou local.
Achados obrigatórios: nenhum.
Sugestões: as 3 da rodada 1 seguem abertas, sem impedir a entrega.

## Entrega

**O que muda.** Benefícios no visual do canvas: abas com contagens (Ativos, Encerrados, Todos), lista com pílulas, filtros, versão de celular e os quatro estados. Janela "Conceder" refeita sobre `ModalityDialog` (busca de aluno, tipo, validade, "Decidido por", resumo e motivo). Janela "Substituir benefício?" nova (`POST /benefits` com `replaceExisting: true`). Janela "Encerrar" com resumo, motivo e nota do valor do plano. Contrato: `GET /benefits` ganha `status=CLOSED`, `counts` e, em cada linha, `planValueCents` e `nextChargeMonth` (`docs/openapi.yaml`); RF-BEN-01 a 03 em `docs/especificacao/07-planos-e-beneficios.md`; MSW espelha o contrato.

**Verificação.** Vitest de tela, janelas e MSW (axe nos dois temas e em 360 px). Integração: `BenefitListIT` 7, `BenefitEndIT` 6, `BenefitGrantIT` 8. Contrato: `OpenApiContractTest` e `ContractRoutesTest` verdes. Visual do CI (`npm run test:visual:docker -- -g "beneficio"`, sem `--update-snapshots`): `beneficios`, `beneficio-conceder`, `beneficio-substituir` e `beneficio-encerrar` passaram (16 testes). `npm run visual:canvas -- --exige`: 139 comparadas, 0 reprovadas. Comparação com o canvas (1440 px, claro): beneficios 1,6%, beneficio-conceder 10,6%, beneficio-encerrar 0,7%, beneficio-substituir 56,4%. Capturas em `.capturas/481/`.

**Decisões.**
- Encerrar: botão vermelho cheio (`dangerSolid`), como no canvas; a RF-BEN dizia contorno vermelho.
- `beneficio-substituir` com `limiteCanvas` 0,7: o canvas mostra a tela de Planos atrás da janela, e o sistema abre a confirmação sobre "Conceder", que fica aberta para "Manter o atual" voltar com o formulário preenchido. A remoção desse limite está no "Pronto quando" da #577 (conferido em `gh issue view 577`).
- Aviso de substituição aparece ao escolher a modalidade (CA9), com uma prévia de 1% só para saber se há benefício ativo.
- `nextChargeMonth` usa a data do banco no fuso da unidade, a mesma base do `STATUS_SQL`.
- Subtítulo "todas": "Todas as unidades · no máximo um benefício ativo…" (a RF dizia só "todas as unidades").

**Divergências com o canvas que ficaram.**
- Janela Substituir: o canvas põe o subtítulo no cabeçalho e "Desconto de professor" como tipo do novo; o sistema põe o subtítulo no corpo e "Bolsa", porque o tipo do canvas não existe na API. Coberta pelo `limiteCanvas` acima.
- Janela Conceder: "Desconto de professor (opcional)" não está no canvas e fica (RN-BEN-08).
- Lista: o canvas não mostra "Benefício alto" sob o 60% da linha de Olívia, nem "Buscar por nome" e "Por página"; sugestões do verificador, não obrigatórias, não feitas.

**Regressão local.** `lint`, `typecheck` e `build` verdes. `test:cov`: 253 arquivos, 2415 testes, linhas 97,02%. `e2e`: 96 passaram; 2 instáveis (`configuracao-unidade.spec.ts` e `portal-pedidos.spec.ts`, tema escuro), passaram nas 3 repetições. `verify`: 886 testes de integração; 1 instável (`AnnouncementSendJobIT.sendsDueOnce`, comunicação), passou 2 de 2 isolado. A primeira linha de erro dessas falhas não ficou guardada na construção, então não é registrada aqui. O `verify` parou na falha, então o JaCoCo dos pacotes críticos não rodou local: a prova é o CI do PR. A base não avançou nesta entrega, então a regressão não foi repetida.

### Correção da entrega
- Job `visual` do CI do PR #580 reprovou 4 testes (`dia-sem-aula-novo`, 1440 e 390, claro e escuro): o passo `preencher` do caso usava o rótulo `"Motivo"` no lugar de `"Motivo *"` (alteração indevida em `visual/casos.ts` nesta branch; o campo `ReasonField` tem o asterisco no rótulo) — arquivos: `frontend/visual/casos.ts` (volta a `"Motivo *"`) — prova: `npm run test:visual:docker -- -g "dia-sem-aula"` → 4 passaram (sem `--update-snapshots`). Os 529 demais testes do job passaram no CI.
Visual do CI: dia-sem-aula-novo → passou.
