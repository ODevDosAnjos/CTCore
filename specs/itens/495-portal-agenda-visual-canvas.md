# 495 — Agenda do portal no visual do canvas

Origem: issue #495 (Sprint 10.5, Fase 3, R3), `docs/auditoria/decisoes-canvas.md` (R1); evidência M29, M131. Branch: `item/495-portal-agenda-visual-canvas`. Dependências #455 a #459 (moldura do portal, componentes base). Canvas: `PortalAgenda` (1440) e `PortalMAgenda` (390). Regras: RF-POR-04, RN-POR-06, RN-POR-09, RN-AGE-03 a RN-AGE-05 (`docs/especificacao/14-portal-do-aluno.md`, `06-turmas-e-agenda.md`). A issue pede só visual (front-end); API e contrato não mudam (D1). Parte da tela feita na #91 (`specs/itens/91-portal-agenda.md`).

## 1. Objetivo

Deixar `/portal/agenda` igual ao canvas. Desktop: rótulo "Só consulta", título "Agenda" e o alternador "Só minha turma / Todos os meus horários" (controle segmentado) na mesma linha; abaixo, setas "<" ">" com a legenda do período ("12 a 18 de outubro") e o filtro "Modalidade: Todas" à direita; uma grade de 7 colunas iguais (um cabeçalho "Seg 12" por dia, um cartão por aula com barra lateral colorida por tipo, dia sem aula como faixa listrada com o motivo, "—" nos dias vazios); nota final "Sem presença nem frequência. Para mudar de turma, faça um pedido em Minhas informações.". Celular: lista do dia com "< SEXTA, 16/10 >", o alternador e cartões com horário em negrito ("7h–8h30"), pílula de situação, título e linha de professor e unidade.

Fora do escopo: API, contrato e regra (D1); a tela Avisos (#93 e #496, o link "Ver aviso" só leva a `/portal/avisos?aviso=`); presença, frequência e ação sobre a aula; filtro de modalidade no servidor.

## 2. Requisitos

- R1 (M131): o cabeçalho traz "Só consulta" acima de "Agenda" (`PortalHeading`) e, na mesma linha, à direita, o alternador "Só minha turma" | "Todos os meus horários" em controle segmentado (`SegmentedChoice`); o padrão segue "Todos os meus horários", e a escolha continua em `?escopo=` e refaz a leitura com `scope=MAIN`.
- R2 (M131): a navegação de semana é um botão "<" ("Semana anterior") e um ">" ("Próxima semana"), só com ícone e nome acessível, com o período entre eles como "12 a 18 de outubro" (`rangeLabel`, mesmo mês; atravessando meses, "28 de setembro a 4 de outubro"); `?semana=` continua mudando. Os três botões de texto e a linha "Semana de dd/mm/aaaa a dd/mm/aaaa" saem (D2).
- R3 (M131): à direita da navegação, o filtro "Modalidade: Todas" (`PillFilter`) lista as modalidades das aulas da semana carregada; escolher uma mostra só as aulas dela, na grade e na lista do dia; o filtro é do cliente, não vai à API (D3).
- R4 (M29): a partir de 768 px, a grade tem 7 colunas iguais (`minmax(0, 1fr)`) ocupando a largura, sem rolagem horizontal; cada coluna tem o cabeçalho "Seg 12" e uma pilha de cartões por horário de início; texto não quebra no meio da palavra ou da data.
- R5 (M29): cada cartão de aula traz o horário em destaque ("19h", "19h30" com `hourLabel`), título em negrito, linha do professor com o tipo ("Rafael Duarte · turma principal", "Outro horário · Rafael", "Aula avulsa") e barra lateral colorida por tipo: principal em azul, outro horário e avulsa em neutro; cancelada com título riscado, fundo neutro e o selo "Cancelada" com o motivo; alterada com o selo "Alterada" (amarelo) e o resumo e, havendo `noticeId`, o link "Ver aviso" sublinhado ao lado. A aula que já passou mantém o texto "Já aconteceu" (RN-AGE-03), discreto, sem depender só da cor (D4).
- R6 (M29): dia sem aula é uma faixa listrada na altura do dia com "Sem aula" em negrito e o motivo; dia sem aula nem dia sem aula mostra "—".
- R7 (M29, celular): abaixo de 768 px a tela mostra a lista do dia: "< SEXTA, 16/10 >" (setas "Dia anterior" e "Próximo dia", dia da semana por extenso e data em caixa alta), o alternador, e um cartão por aula com barra lateral colorida, horário em negrito ("7h–8h30"), pílula de situação ("Alterada", "Turma principal", "Cancelada"), título em negrito e linha de professor e unidade; as sete pílulas de dia, os botões de semana, a legenda e o filtro de modalidade somem da tela (D5). Começa em hoje, ou na segunda se a semana não tem hoje; a seta do dia passa de uma semana para outra quando chega à segunda ou ao domingo.
- R8 (M131): a legenda em chips (Principal, Outro horário, Avulsa, Alterada, Cancelada, Sem aula) sai da tela; cada cartão já diz o tipo em texto (D2).
- R9 (M131): a nota "Sem presença nem frequência. Para mudar de turma, faça um pedido em Minhas informações." aparece no fim da tela, em texto discreto.
- R10 (RF-POR-04): o seletor de aluno (responsável com mais de um aluno), os links `?aluno=`, `?semana=` e `?escopo=`, o resumo da alteração, o motivo do cancelamento e o "Ver aviso" seguem funcionando como na #91; o seletor de aluno fica na linha de navegação, antes do filtro de modalidade, só com mais de um aluno.
- R11 (RF-POR-08): carregando, vazio ("Nenhuma aula nesta semana"), erro com "Tentar de novo" e sem permissão seguem como hoje; os controles ficam na tela durante o carregamento da semana nova; a partir de 360 px sem rolagem lateral, axe nos dois temas, textos em `pt-BR.json`.
- R12: o caso visual `portal-agenda` (1440 e 390) compara com `PortalAgenda` e `PortalMAgenda` e passa no limite padrão do `visual:canvas`, ou com `limiteCanvas` justificado (D6), com a massa do MSW parecida com a do canvas (uma semana com dia sem aula, aula alterada com aviso, cancelada, avulsa).

## 3. Critérios de aceite

- CA1 (R1): dado aluno, a tela mostra "Só consulta", "Agenda" e o alternador com "Todos os meus horários" marcado; escolher "Só minha turma" muda `?escopo=MAIN` e refaz a leitura com `scope=MAIN`; voltar a "Todos os meus horários" tira o parâmetro.
- CA2 (R2): dada a semana de 12 a 18 de outubro, a legenda é "12 a 18 de outubro"; semana de 28/9 a 4/10, "28 de setembro a 4 de outubro"; ">" e "<" mudam `?semana=` em 7 dias e refazem a leitura; não existem "Hoje" nem "Semana de …".
- CA3 (R3): dado aulas de Jiu-Jitsu e Judô na semana, "Modalidade: Todas" lista as duas; escolher "Judô" deixa só as de Judô na grade; a requisição não ganha parâmetro novo; voltar a "Todas" mostra tudo.
- CA4 (R4): a 1024 px a grade tem 7 colunas com os cabeçalhos de segunda a domingo e os cartões de cada dia na própria coluna; sem rolagem horizontal; a data de "Era em 26/10/2026 às 18:00" não é partida.
- CA5 (R5): dado aula principal, outro horário, avulsa, alterada (com `originalDate`, substituto e `noticeId`) e cancelada (`HOLIDAY`), então cada cartão mostra o horário, o título, o tipo na linha do professor, "Alterada" com o resumo e "Ver aviso" levando a `/portal/avisos?aviso=<id>`, "Cancelada" com o motivo traduzido e o título riscado; sem `noticeId`, sem o link; aula passada traz "Já aconteceu".
- CA6 (R6): dado dia sem aula na quarta, a coluna da quarta mostra a faixa com "Sem aula" e o motivo; os dias sem aula e sem dia sem aula mostram "—".
- CA7 (R7): a 390 px a tela mostra "Sexta, 16/10" (maiúsculo por CSS), setas, o alternador e os cartões do dia com "7h–8h30", pílula e linha de professor e unidade; não há pílulas de dia, legenda nem filtro de modalidade; a seta ">" no domingo vai para a segunda da semana seguinte (`?semana=` muda) e a "<" na segunda volta ao domingo da anterior; dia sem aula mostra "Sem aula" e o motivo, e dia vazio "Nenhuma aula neste dia.".
- CA8 (R8, R9): a legenda não existe e a nota final está na tela, nas duas larguras.
- CA9 (R10): responsável com dois filhos vê o seletor de aluno na linha da navegação; trocar de aluno refaz a leitura e mantém semana e escopo; com um aluno, sem seletor.
- CA10 (R11): carregando, erro ("Tentar de novo" refaz), 403 e semana sem aulas mostram cada estado; ao trocar de semana os controles continuam; sem rolagem horizontal a 360 px e axe sem violação nos dois temas.
- CA11 (R12): `npm run test:visual:docker -- -g "portal-agenda"` passa sem `--update-snapshots`; capturas em `.capturas/495/` (`portal-agenda-{1440,390}-{sistema,canvas}.png`, pt-BR); `npm run visual:canvas` não reprova o caso no limite padrão, e o verificador compara as imagens (regra temporária até a #568).

## 4. Plano técnico

- Dados, API, Segurança: não mudam (`GET /portal/schedule`, `usePortalSchedule` e o OpenAPI ficam; permissão no servidor). Texto livre (motivo) continua como texto. MSW: só a massa do caso visual em `frontend/src/mocks/handlers.ts` (`/portal/schedule`, por volta da linha 5058): semana parecida com a do canvas (segunda sem aula "Nossa Senhora Aparecida", terça Muay Thai alterada com aviso, quinta cancelada, sexta com outro horário substituído e turma principal, sábado outro horário e avulsa, domingo vazio); conferir que `agenda.msw`/`portal-schedule.msw.test.ts` e os testes existentes de `PortalAgendaPage.test.tsx` seguem batendo (os dados do cenário comum não precisam mudar se o caso visual usar um gancho como o `__mswTermo` da #494).
- Interface (em `frontend/src/features/portal/`):
  - `PortalAgendaPage.tsx` (`PortalAgendaPage`): trocar `PageHeader` por `PortalHeading` com `label`; alternador por `SegmentedChoice` (mesmo na linha do título, `flex` com `justify-between`); navegação com dois botões de ícone (`ChevronLeft`/`ChevronRight` de lucide, 36 px visuais com área de toque de 44 px) e `rangeLabel` (hoje devolve o ano; acrescentar um parâmetro `withYear = true` em `agendaDates.ts` e chamar sem o ano aqui, sem mudar a agenda da gestão); `PillFilter` de modalidade (opções derivadas de `data.lessons`, estado local, zera ao trocar de aluno); seletor de aluno antes do filtro; sai a legenda; nota final com `t("portalAgenda.note")`; o filtro aplica `lessons.filter` antes de entregar a `PortalAgendaGrid`/`PortalAgendaDayList`; o estado "vazio" considera as aulas da semana, não as filtradas. Mantém `useWide` (`matchMedia`), `last`/`shown` e `dayOf`; a seta do dia calcula o dia vizinho e, fora da semana, troca `?semana=` e guarda o dia.
  - `PortalAgendaGrid.tsx`: trocar a tabela por 7 colunas (`grid grid-cols-7 gap-3`, cada uma `min-w-0`), cabeçalho do dia como título da coluna, lista de cartões por horário (ordenadas por `startsAt`), faixa listrada do dia sem aula (`bg-[repeating-linear-gradient(...)]` com tokens, altura mínima), "—" nos dias vazios; marcar o dia de hoje. Acessibilidade: cada coluna é uma `section` com `aria-label` do dia (ou lista com cabeçalho), sem `role="table"`.
  - `PortalAgendaDayList.tsx`: sem pílulas de dia; cabeçalho "< dia da semana, dd/mm >" com `aria-live`, faixa de dia sem aula e cartões do dia.
  - `PortalLessonItem.tsx`: duas variantes (`variant="grid" | "list"`): grade com horário pequeno, título, linha do professor com o tipo e selo; lista com cartão branco, horário em negrito com intervalo, pílula e linha de professor e unidade; cores só por token (`--info`/azul para principal, neutro para outro e avulsa, `--warning` para "Alterada"): conferir em `docs/design/README.md` e nos tokens existentes de `PortalTag`/`StatusTone` e reaproveitar, sem cor solta.
  - `PortalTag.tsx`: acrescentar um tom `warning` (Alterada) e `info` (Turma principal) só se os tons atuais não cobrirem o canvas; conferir antes.
  - `frontend/src/i18n/pt-BR.json` (`portalAgenda`): chaves novas (`label` "Só consulta", `modality`, `allModalities`, `previousDay`, `nextDay`, `note`, `typeMain` "turma principal", `typeOther` "Outro horário", `typeAdhoc` "Aula avulsa"); saem `today`, `weekRange`, `legendTitle`, `timeColumn`, `gridLabel`, `daysLabel`, `weekNav` se ficarem sem uso.
  - `frontend/visual/casos.ts` (linha 76) e `telas.visual.ts`: `portal-agenda` com a massa nova; `canvasCelular: "PortalMAgenda"` já existe; referências regeradas só de `portal-agenda`.
  - Testes: `PortalAgendaPage.test.tsx` (existe, 230 linhas) adaptado (rótulos e controles novos: radiogroup, setas, filtro) e ampliado (filtro, dia vizinho, nota); `frontend/e2e/portal-agenda.spec.ts` ajustado se os seletores mudarem; `src/test/a11y.test.tsx` segue cobrindo a tela.
- Reuso: `PortalHeading`, `SegmentedChoice`, `PillFilter`, `rangeLabel`/`hourLabel`/`weekDays`/`weekday`/`brShort`/`addDays` de `features/agenda/agendaDates.ts`, `PortalTag`, `EmptyState`/`ErrorState`/`ForbiddenState`/`LoadingState`, `PortalLayout`.
- Riscos: (1) o `SegmentedChoice` tem altura de 44 px e cor de marca; o canvas usa 32 px em trilho cinza (ver se a divergência passa no limite padrão, senão D6); (2) a faixa "Sem aula" do canvas tem 300 px de altura, definir por `min-h` sem forçar altura quando a coluna tem aulas ao lado; (3) trocar a tabela por colunas muda a leitura por leitor de tela, cuidar da ordem e dos nomes; (4) o canvas mostra o professor em todo cartão e a #91 já entrega `teacherName`, sem dado novo; (5) a seta do dia entre semanas faz uma leitura nova e momentaneamente mostra o dia da semana antiga (usar `last`).

## 5. Tarefas

- [x] T1: textos `pt-BR` e `PortalAgendaPage` nova (cabeçalho com "Só consulta", `SegmentedChoice`, setas e período, `PillFilter` de modalidade, seletor de aluno, nota; sem legenda nem "Hoje") — cobre CA1, CA2, CA3, CA8, CA9 — prova: `cd frontend && npx vitest run src/features/portal/PortalAgendaPage.test.tsx -t "controles"`
- [x] T2: `PortalAgendaGrid` em 7 colunas e `PortalLessonItem` com as duas variantes e cores por token — cobre CA4, CA5, CA6 — prova: `cd frontend && npx vitest run src/features/portal/PortalAgendaPage.test.tsx -t "grade"`
- [x] T3: `PortalAgendaDayList` com "< dia >", troca de semana pelas setas e cartões do celular — cobre CA7 — prova: `cd frontend && npx vitest run src/features/portal/PortalAgendaPage.test.tsx -t "lista do dia"`
- [x] T4: estados, axe e 360 px (testes e e2e ajustados) — cobre CA10 — prova: `cd frontend && npx vitest run src/test/a11y.test.tsx src/features/portal/PortalAgendaPage.test.tsx` e `npx playwright test e2e/portal-agenda.spec.ts`
- [x] T5: massa MSW do caso visual, referências e capturas em `.capturas/495/` — cobre CA11 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots -g "portal-agenda"`, depois sem `--update-snapshots`, e `npm run visual:canvas`
- [x] T6: regressão do front — não cobre critério: exigência do AGENTS.md — prova: `cd frontend && npm run lint && npm run typecheck && npm run build && npm run test:cov && npm run e2e`

## 6. Decisões

- D1: só front-end. Motivo: a issue pede visual e `GET /portal/schedule` já entrega tudo o que o canvas mostra (`teacherName`, `kind`, `noticeId`, `noClassDays`). Alternativa: nenhuma; se algo faltar, entra como divergência registrada.
- D2 (muda o comportamento): saem os botões "Hoje" e "Semana de dd/mm/aaaa a dd/mm/aaaa", a legenda em chips e a navegação por texto; ficam setas e o período por extenso (R1 de `decisoes-canvas.md`: o canvas vence em layout, textos e botões). Perde-se o atalho "Hoje"; a semana de hoje continua o padrão ao abrir a tela. Alternativa: manter "Hoje" como botão extra (contraria o canvas).
- D3 (muda o comportamento): o filtro de modalidade é do cliente e lista só as modalidades das aulas da semana carregada; "Todas" é o padrão e não vai para a URL. Motivo: o contrato não tem parâmetro de modalidade e a issue pede só o filtro na tela. Alternativa: parâmetro `modalityId` na API (back-end, contrato e IT; sugestão de novo item).
- D4: "Já aconteceu" (RN-AGE-03, R7 da #91) continua no cartão em texto discreto, embora o canvas não o mostre. Motivo: regra de negócio e acessibilidade vencem no conteúdo, o canvas no visual. Pode reprovar um pouco o limite padrão; se reprovar, D6.
- D5 (muda o comportamento): no celular somem as pílulas de dia, a legenda e o filtro de modalidade (o canvas `PortalMAgenda` não os traz); o dia se escolhe pelas setas. Motivo: canvas vence em layout. Alternativa: manter o filtro no celular (contraria o canvas).
- D6: divergência que reprovar no limite padrão leva `limiteCanvas` com motivo e a issue da 10.5 que a remove, ou nova issue; a que passa no limite padrão só é registrada na descrição do PR (autonomia 4 do AGENTS.md).
- Suposição: o seletor de aluno do responsável não aparece no canvas (ele mostra um aluno); fica na linha da navegação. Se o dono preferir outro lugar, só muda o arquivo da página.
- Suposição: o ano some da legenda do período ("12 a 18 de outubro") como no canvas; a semana pedida em `?semana=` continua sem ambiguidade pelo ano da URL.

## Construção

- T1 — arquivos: `frontend/src/i18n/pt-BR.json`, `features/agenda/agendaDates.ts` (`rangeLabel(..., withYear)`, `weekdayLong`), `features/portal/PortalAgendaPage.tsx` — prova: `npx vitest run src/features/portal/PortalAgendaPage.test.tsx -t "controles"` → passou (2 testes)
- T2 — arquivos: `PortalAgendaGrid.tsx`, `PortalLessonItem.tsx` (variantes `grid`/`list`, `Badge` e tokens `info`/`neutral`/`warn`) — prova: `-t "grade"` → passou
- T3 — arquivos: `PortalAgendaDayList.tsx` (sem pílulas de dia, setas e "SEXTA, 16/10") — prova: `-t "lista do dia"` → passou
- T4 — arquivos: `PortalAgendaPage.test.tsx` (adaptado e ampliado), `e2e/portal-agenda.spec.ts` — prova: `npx vitest run src/test/a11y.test.tsx src/features/portal/PortalAgendaPage.test.tsx` → passou; `npx playwright test e2e/portal-agenda.spec.ts` → 5 passaram
- T5 — arquivos: `visual/casos.ts` (campo `agendaCanvas`), `visual/telas.visual.ts` (semana de 12 a 18/10 do canvas por `__mswOverride`, hoje sexta 16), referências do caso — prova: `npm run test:visual:docker -- --update-snapshots -g "portal-agenda"` e depois sem `--update-snapshots` → 4 passaram; `npm run visual:canvas` → 154 comparadas, 0 reprovadas
- T6 — `npm run lint && npm run typecheck && npm run build` → verdes; `npm run test:cov` → 5 falhas de timeout em 4 arquivos sem relação com o item (LoginPage, EnrollmentWizardPage, TeacherFormDialog, UnitSettingsPage), que passaram ao rodar de novo isoladas (91 testes); `npm run e2e` → 93 passaram, 5 falharam (agenda, comprovantes, configuracao-unidade, portal-pedidos x2), todos passaram ao rodar de novo (6 passaram). Instáveis por carga da máquina, não pelo item.
Regressão: sem piora em relação à linha de base; instabilidade anotada acima. A cobertura de 80% não foi avaliada pelo `test:cov` por causa das falhas de timeout da rodada completa.
Visual do CI: portal-agenda 1440 claro → passou; portal-agenda 1440 escuro → passou; portal-agenda 390 claro → passou; portal-agenda 390 escuro → passou
Capturas: `.capturas/495/portal-agenda-{1440,390}-{sistema,canvas}.png` (pt-BR, do teste visual com MSW).
Divergências com o canvas (passam no limite padrão, sem `limiteCanvas`): alternador com seleção na cor da marca (o canvas usa cartão branco no trilho cinza); "Já aconteceu" nos cartões de dias passados (D4); cartão de cancelada traz o motivo por extenso em vez de "Cancelada · motivo"; no celular o alternador fica acima da navegação do dia, no canvas abaixo; cores de cartão por tipo (o canvas usa também cor da modalidade).
Desvios: massa do caso visual via `__mswOverride` no `telas.visual.ts` (campo `agendaCanvas`), sem mexer em `handlers.ts`; arquivos novos de teste não criados.
Referências visuais: `frontend/visual/referencias/portal-agenda-{1440,390}-{claro,escuro}.png`
Não é do item: nada.

## Verificação

### Rodada 1 — OK — 2026-11-19, estado 513cea2c0ad4db29e6666572185b705af923e7dd

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA10 | PASSOU | `PortalAgendaPage.test.tsx` e `a11y.test.tsx` (23 testes verdes); `e2e/portal-agenda.spec.ts` (5 verdes, 360 e 1024 px, axe claro e escuro); diff lido contra R1 a R11 |
| CA11 | PASSOU | `test:visual:docker -g portal-agenda` sem `--update-snapshots` → 4 passaram; `visual:canvas` → 154 comparadas, 0 reprovadas; capturas em `.capturas/495/` abertas e comparadas |

Comandos: vitest dos dois arquivos, `npm run lint`, `npm run typecheck` → verdes. Regressão completa (`test:cov`, `e2e`) não reexecutada; vale o registro da construção (instabilidades por carga, passaram isoladas) e o CI do PR.
Achados:
- sugestão, código, `PortalAgendaPage.tsx` — o filtro de modalidade não zera ao trocar de semana; se a modalidade escolhida não existir na semana nova, a grade fica vazia sem aviso e a opção some da lista.
- sugestão, código — divergências visuais com o canvas já registradas na Construção (alternador na cor da marca, "Já aconteceu", cor por modalidade, alternador acima das setas no celular); aceitas, passam no limite padrão.

## Entrega

- O que muda: agenda do portal (`PortalAgendaPage`, `PortalAgendaGrid`, `PortalAgendaDayList`, `PortalLessonItem`) no visual do canvas `PortalAgenda` (1440) e `PortalMAgenda` (390): cabeçalho com `PortalHeading`, alternador Semana/Dia, navegação com setas, seletor de aluno, filtro por modalidade, grade e lista do dia, estados carregando/vazio/erro/sem permissão e nota final. Textos novos em `pt-BR.json`. API, contrato e MSW não mudam.
- Verificação: rodada 2 `OK` (estado `e8b0c47168f76db3ae05962a1ef95ebe2d433f85`); CA1 a CA11 passaram (a rodada 2 só trocou as referências `portal-celular-abas`, achado do CI do PR #605). Comparação com o canvas: `npm run visual:canvas` → 154 comparadas, 0 reprovadas; capturas em `.capturas/495/` comparadas.
- Visual do CI (referências commitadas): portal-agenda 1440 claro, 1440 escuro, 390 claro, 390 escuro → passou.
- Regressão local (construção): `test:cov` e `e2e` tiveram falhas de timeout por carga da máquina em testes sem relação com o item (LoginPage, EnrollmentWizardPage, TeacherFormDialog, UnitSettingsPage; agenda, comprovantes, configuracao-unidade, portal-pedidos); todas passaram ao rodar de novo isoladas. Base não avançou desde a verificação, então a regressão não foi refeita.
- Divergências com o canvas aceitas (passam no limite padrão, sem `limiteCanvas`): alternador com seleção na cor da marca (canvas usa cartão branco no trilho cinza); "Já aconteceu" nos cartões de dias passados; cartão de cancelada com o motivo por extenso; no celular o alternador fica acima da navegação do dia (canvas: abaixo); cor de cartão por tipo (canvas também usa cor da modalidade).
- Limitação conhecida (sugestão da verificação, não bloqueia): o filtro de modalidade não zera ao trocar de semana; se a modalidade escolhida não existir na semana nova, a grade fica vazia sem aviso.

### Correção da entrega
- CI do PR #605: job `visual` reprovou os 4 casos `portal-celular-abas` (rota `/portal/agenda`, tela afetada pelo item, referência antiga) — arquivos: `frontend/visual/referencias/portal-celular-abas-{1440,390}-{claro,escuro}.png` regerados — prova: `npm run test:visual:docker -- --update-snapshots -g "portal-celular-abas"` e depois sem `--update-snapshots` → 4 passaram; `npm run visual:canvas -- --exige` → 154 comparadas, 0 reprovadas
Visual do CI: portal-celular-abas 1440 claro/escuro e 390 claro/escuro → passou
Referências visuais: `frontend/visual/referencias/portal-celular-abas-{1440,390}-{claro,escuro}.png`

### Rodada 2 — OK — 2026-11-19, estado e8b0c47168f76db3ae05962a1ef95ebe2d433f85

Mudança desde a rodada 1 (`git diff 513cea2… e8b0c47…`): só as 4 referências `portal-celular-abas-{1440,390}-{claro,escuro}.png` e o registro da "Correção da entrega". Código do item inalterado.

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA10 | PASSOU (mantido da rodada 1) | código não mudou; `PortalAgendaPage.test.tsx` e `a11y.test.tsx` reexecutados → 23 verdes |
| CA11 | PASSOU | `npm run test:visual:docker -- -g "portal-celular-abas\|portal-agenda"` sem `--update-snapshots` → 8 passaram |
| Achado da entrega (CI #605, `portal-celular-abas` com referência antiga) | PASSOU | referências regeradas abertas (390 e 1440 claro): mostram a agenda nova (Só consulta, Agenda, alternador, setas, filtro, nota); mudança visual pedida pelo item, só de tela afetada |

Comandos: vitest dos dois arquivos → 23 verdes; visual docker dos 2 casos → 8 verdes.
Achados:
- sugestão, código — a da rodada 1 (filtro de modalidade não zera ao trocar de semana) continua aberta, não bloqueia.
