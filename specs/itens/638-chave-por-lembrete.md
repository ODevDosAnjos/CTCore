# 638 — RN-COB-17 · Uma chave por lembrete na aba Lembretes da unidade

Origem: issue #638 (Sprint 10.5) e o comentário do dono de 27/11/2026 nela (quebra do texto a 390 px); `docs/especificacao/10-cobrancas.md` (RN-COB-17, RF-COB-09), `01-organizacao-e-isolamento.md` (RF-ORG-04), `docs/auditoria/decisoes-canvas.md` (decisão 30). Branch: `item/638-chave-por-lembrete`.
Tempos: especificar 3 min · construir 22 min · verificar 28 min (regressão 24 min) (1 rodada) · entregar 4 min
Comparação com o canvas: 5 min

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Quem configura a unidade (Coordenador e Administrador) liga, desliga e ajusta o dia de cada um dos quatro lembretes de cobrança. Desligar deixa de apagar o dia: ao religar, ele volta como estava. O item também corrige o texto da aba que quebra palavra por palavra a 390 px.

Fora do escopo: mudar o aviso fixo de bloqueio, o SMS, o envio manual, os canais (Push segue "Em breve"), os textos dos e-mails, a lista Em atraso e o início do portal; criar ou remover lembretes além dos quatro; Configurações › Visão geral (#640).

## 2. Requisitos

- R1 (RN-COB-17): a unidade tem quatro lembretes fixos (antes do vencimento, no dia, primeiro depois e segundo depois), cada um com a própria chave; o padrão é 3 dias antes, no dia, 3 e 10 dias depois, todos ligados (RF-ORG-04, tabela de padrões).
- R2 (RN-COB-17, D1, D2): o dia dos lembretes antes, primeiro depois e segundo depois é ajustável (antes: 1 a 30; depois: 1 a 60; os dois de depois diferentes entre si); o lembrete do dia do vencimento só liga e desliga.
- R3 (RN-COB-17): desligar um lembrete mantém o dia configurado, na tela e no banco; religar o traz com o mesmo dia.
- R4 (RN-COB-17): o envio automático manda só os lembretes ligados, no dia configurado de cada um; o interruptor geral e a hora continuam valendo, e o aviso de bloqueio não muda.
- R5 ("Pronto quando", D3): a migração mantém ligados os lembretes que estão na lista de hoje e desligados os que não estão, sem mudar o que a unidade envia nos casos que a tela permite montar com os quatro padrões.
- R6 ("Pronto quando" e `AGENTS.md`): `PUT /units/{id}` grava na auditoria, com antes e depois, cada chave e cada dia que mudar; permissões, isolamento, versão (`If-Match`) e validação no servidor continuam; contrato e MSW acompanham.
- R7 (decisão 30, RNF-56): a aba Lembretes mostra a chave e o campo do dia por lembrete, com os textos em pt-BR, os estados que a tela já tem, a partir de 360 px, axe nos dois temas, dentro da moldura.
- R8 (comentário do dono na issue): a 390 px, o texto da aba Lembretes não quebra palavra por palavra nem se sobrepõe a outro elemento.
- R9 ("Pronto quando"): a aba tem casos no teste visual, com as referências só dela atualizadas.

## 3. Critérios de aceite

- CA1 (R1): dado uma unidade nova, quando se lê `GET /units/{id}`, então `settings.reminders` traz `before` (ligado, 3), `due` (ligado), `afterFirst` (ligado, 3) e `afterSecond` (ligado, 10), e `reminderDays` não existe mais.
- CA2 (R3, R4): dado o primeiro lembrete depois configurado em 5 e desligado, quando o agendador roda 5 dias após o vencimento, então nada sai e `charge_reminder` fica vazio para a cobrança; religado, a leitura mostra 5 e a cobrança que está 5 dias vencida recebe `SCHEDULED` com `offset_days` 5.
- CA3 (R4): dado os dias ajustados (antes 1, primeiro depois 5), quando o agendador roda, então saem 1 dia antes e 5 depois e não saem 3 antes nem 3 depois; com `due` desligado, nada sai no dia; com o interruptor geral desligado, nada automático sai.
- CA4 (R2, R6): dado `before.days` 0 ou 31, `afterFirst.days` ou `afterSecond.days` 0 ou 61, os dois de depois iguais (mesmo com um desligado), ou `reminders`, um lembrete, `enabled` ou `days` ausente, quando se faz o `PUT`, então responde 400 com o campo (`settings.reminders...`) e nada é gravado; os limites 1, 30 e 60 passam. Vale no servidor e no MSW.
- CA5 (R6): dado um `PUT` que desliga um lembrete e muda o dia de outro, quando grava, então `unit.update` na auditoria traz antes e depois só das chaves e dias mudados; os testes de perfil e de isolamento entre organizações da rota continuam passando.
- CA6 (R5): dado, no esquema na V65, unidades com as listas `{-3,0,3,10}`, `{0,10}`, `{}`, `{-1,5}` e `{-5,-3,3,7,15}`, quando a V66 roda, então ficam, na ordem antes / no dia / 1º / 2º: `{-3,0,3,10}` → 3, ligado, 3, 10 (todos ligados); `{0,10}` → antes desligado em 3, no dia ligado, 1º desligado em 3, 2º ligado em 10; `{}` → todos desligados, com 3, 3 e 10; `{-1,5}` → antes ligado em 1, no dia desligado, 1º ligado em 5, 2º desligado em 10; `{-5,-3,3,7,15}` → antes ligado em 3, no dia desligado, 1º ligado em 3, 2º ligado em 7. `reminder_days` não existe mais, e o banco recusa dia fora da faixa e os dois de depois iguais.
- CA7 (R3, R7): dado a aba aberta, quando se desliga um lembrete, muda o dia dele, religa, salva e reabre, então a chave e o dia aparecem como salvos, o título da linha acompanha o dia (com singular para 1) e o corpo do `PUT` leva os quatro lembretes.
- CA8 (R2, R7): dado um campo de dia vazio, fora da faixa ou os dois de depois iguais, quando se digita, então a mensagem aparece na aba, a aba fica marcada com erro e salvar não envia; erro 400 do servidor em `settings.reminders...` abre a aba Lembretes. Com o interruptor geral desligado, chaves, dias e horário ficam desabilitados.
- CA9 (R7): dado a aba a 360 px, nos temas claro e escuro, então o axe não acha violação, cada campo de dia tem nome acessível único e a página não rola na horizontal; a tela abre dentro da moldura.
- CA10 (R8): dado a aba a 390 px, então, em cada linha, o bloco de título e ajuda tem ao menos 150 px de largura e não se sobrepõe à chave, ao "E-mail" nem ao "Push"; a captura do teste visual mostra isso (não depende do `visual:canvas`).
- CA11 (R9): dado o teste visual, então o caso `configuracoes-unidade-lembretes` e um caso novo com um lembrete desligado (`configuracoes-unidade-lembretes-desligado`, página inteira) têm referências em 1440 e 390, claro e escuro, e nenhuma referência de outra tela muda.

## 4. Plano técnico

Duas partes de construção, uma entrega: A (T1 e T2: regra, contrato e servidor) e B (T3 a T6: front). Estimativa: cerca de 24 arquivos contáveis, abaixo do limite de 30.

- Dados: `backend/src/main/resources/db/migration/V66__reminder_switches.sql` (a criar; conferir o próximo número livre).
  - Em `unit_settings`: `reminder_before_enabled`, `reminder_due_enabled`, `reminder_after_first_enabled`, `reminder_after_second_enabled` (boolean not null default true); `reminder_before_days` (smallint not null default 3, check 1 a 30), `reminder_after_first_days` (default 3) e `reminder_after_second_days` (default 10), os dois com check 1 a 60; check de 1º diferente do 2º.
  - Backfill de `reminder_days` conforme D3, cercado por `no force row level security` / `force row level security`, como em `V58__unit_trial_limit.sql` (sem isso, um dono sem superusuário atualiza zero linhas em silêncio). Depois, `drop column reminder_days`. Comentário com o caminho de reversão.
- API: `GET` e `PUT /units/{id}`.
  - `settings.reminderDays` sai e entra `settings.reminders` = `{ before: {enabled, days}, due: {enabled}, afterFirst: {enabled, days}, afterSecond: {enabled, days} }`, tudo obrigatório; `remindersEnabled` e `remindersHour` não mudam.
  - Erros: 400 com o campo (`settings.reminders`, `settings.reminders.before.days`; dias iguais em `settings.reminders.afterSecond.days`). Quem pode chamar não muda.
  - `docs/openapi.yaml`: `UnitSettingsView`, `UnitUpdateSettings`, esquemas novos e a descrição do `PUT`.
- Servidor (`backend/src/main/java/br/com/ctcore/`):
  - `organization/UnitUpdate.java`: records dos lembretes (o de `due` só com `enabled`); `Settings.validated()` valida faixas e distintos; sai `MAX_REMINDERS`; `days(...)` segue só para `dueDays`.
  - `organization/UnitSettings.java`: record `Settings`, `SELECT` e `detail()` (índices de coluna posicionais: conferir todos), `update()` e `flat()` (uma chave de auditoria por chave e por dia).
  - `billing/ReminderJob.java`, `candidates()`: no lugar de `= any(us.reminder_days)`, comparar a diferença de dias com cada lembrete ligado (menos `before_days`, 0, `after_first_days`, `after_second_days`); atualizar o comentário da classe. `remind()`, `ReminderSender` e o índice `charge_reminder_once` não mudam.
- Interface (`frontend/src/`):
  - `features/units/useUnitSettings.ts` (`UnitSettingsData`), `unitDraft.ts` (`Draft`, `toDraft`, `toBody`, `Problems`; os dias ficam como texto no rascunho; saem `reminderDays`, `MAX_REMINDERS` e `STANDARD_REMINDER_DAYS`) e `unitTabKit.tsx`.
  - `features/units/UnitSettingsPage.tsx`: `problems` ganha os lembretes; `localErrors` manda esse problema para a aba `reminders`; a lista do conflito de edição troca a linha "Dias de lembrete" por uma por chave e por dia. `tabOfServerField` (prefixo `settings.reminder`) já serve.
  - `features/units/UnitRemindersTab.tsx`: quatro linhas fixas, na ordem antes, no dia, 1º e 2º depois; ajuda por lembrete (não mais pelo número do dia); `Field` + `Input type="number"` (de `components/ui/field.tsx`) nas três linhas ajustáveis, sob a ajuda, habilitado mesmo com o lembrete desligado e desabilitado com o geral desligado. Correção do 390 px: o bloco de texto deixa de ser `flex-1` com base zero e ganha base mínima (ex.: `flex-[1_1_12rem]`), para "E-mail" e "Push" descerem de linha; vale também para a linha do aviso fixo.
  - `i18n/pt-BR.json` (`unitSettings`): título com singular e plural para antes e depois, rótulos únicos dos três campos de dia, mensagens de erro, rótulos do conflito; `reminderHelp` por lembrete, sem `custom`. Comentário no front cita "issue 638", sem `#`.
  - `mocks/handlers.ts`: `defaultUnitSettings` e a validação do `PUT`.
- Segurança: permissões e RLS não mudam (colunas em tabela já protegida); validação no servidor; sem dado pessoal novo.
- Testes a alterar ou criar: `billing/ReminderJobIT` (o CA3 atual grava `reminder_days` por SQL), `organization/UnitSettingsIT`, `UnitUpdateValidationTest` (helper `with` e os `new Settings(...)`), `UnitBase.payload()`, `OrganizationsIT` (lê `reminder_days`), `db/MigrationIT` (caso da V66, no padrão de `v59DropsOrganizationColor`); no front, `UnitRemindersTab.test.tsx`, `UnitSettingsPage.test.tsx`, `mocks/unit-settings.msw.test.ts`, `EnrollmentWizardPage.test.tsx`; `e2e/configuracao-unidade.spec.ts`; `visual/casos.ts` (o override `unidadeCanvas` de `visual/telas.visual.ts` herda `base.settings` do MSW).
- Reuso: `Switch`, `Field`, `Input`, `Err`, `SwitchRow`, `problems` da página, auditoria `unit.update`.
- Riscos: índice de coluna errado em `UnitSettings.detail()` (aparece no `UnitSettingsIT`); backfill vazio por RLS (CA6); os campos novos aumentam a altura da tela e podem afastar o `visual:canvas` (limite de 15%; vale a Autonomia 4 do `AGENTS.md`).

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

Parte A

- [x] T1: completar a RN-COB-17 em `10-cobrancas.md` com D1 e D2 e atualizar `docs/openapi.yaml` — não cobre critério: especificação e contrato mudam antes do código — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`
- [x] T2: V66, `UnitUpdate`, `UnitSettings`, `ReminderJob` e os testes do back-end — cobre CA1, CA2, CA3, CA4 (servidor), CA5, CA6 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=UnitUpdateValidationTest -Dsurefire.failIfNoSpecifiedTests=false -Dit.test='ReminderJobIT,UnitSettingsIT,OrganizationsIT,MigrationIT' -Djacoco.skip=true`

Parte B

- [x] T3: MSW, tipos, rascunho e `UnitSettingsPage` (corpo do `PUT`, validação, aba com erro, conflito), com `unitTabKit` e testes — cobre CA4 (MSW), CA7, CA8 — prova: em `frontend/`, `npm test -- unit-settings.msw UnitSettingsPage EnrollmentWizardPage`
- [x] T4: `UnitRemindersTab` (quatro linhas, campo do dia, layout a 390 px) e textos pt-BR — cobre CA7, CA8, CA9 — prova: em `frontend/`, `npm test -- UnitRemindersTab telasCanvas tokens`
- [x] T5: no e2e da configuração da unidade, desligar, ajustar, religar, salvar e reabrir dentro da moldura, e a 390 px medir a largura e a sobreposição das linhas — cobre CA7, CA9, CA10 — prova: em `frontend/`, `npm run e2e -- configuracao-unidade`
- [x] T6: os dois casos visuais da aba, referências só deles e comparação com `LembretesAuto` em 1440 e 390, pt-BR, com as capturas `<tela>-<largura>-sistema.png` e `<tela>-<largura>-canvas.png` em `.capturas/638/`; abrir as de 390 e conferir o texto — cobre CA10, CA11 — prova: em `frontend/`, `npm run test:visual:docker -- --update-snapshots -g "configuracoes-unidade-lembretes"` e `npm run visual:canvas`

## 6. Decisões

- D1 (muda o comportamento): o lembrete "no dia" só liga e desliga; o dia dele é o do vencimento. Motivo: com outro dia deixaria de ser "no dia" (texto e modelo de e-mail) e poderia repetir um dos outros três; "dia ajustável" vale para os que têm número. Alternativa: campo de dia também nele, descartada.
- D2 (muda o comportamento): são exatamente quatro lembretes; antes aceita 1 a 30 e depois 1 a 60 (a faixa de hoje, -30 a 60), e os dois de depois não podem ser iguais, mesmo desligados. Deixa de existir lembrete extra (a API aceita hoje até 8 dias livres; a tela atual não cria nenhum). Não se exige que o 1º venha antes do 2º. Motivo: a RN-COB-17 lista quatro; dois no mesmo dia mandariam um só e-mail. Alternativa: lista livre de pares dia/chave, descartada por perder a identidade de cada lembrete.
- D3 (muda o comportamento): na migração, cada dia padrão presente na lista liga o seu lembrete. Os dias fora do padrão ocupam, em ordem crescente, os lembretes ainda livres do mesmo lado (negativo no "antes", positivo no 1º e depois no 2º), ligados. Lembrete sem dia fica desligado com o dia padrão. O que sobrar (segundo dia negativo, terceiro positivo; em `{-5,-3,...,15}`, o -5 e o 15) é descartado. Motivo: dias extras só vêm da API ou da antiga lista em texto, e não há ambiente publicado (sem dado real até a Sprint 22). Alternativa: guardar as sobras em estrutura extra, descartada.
- D4: colunas próprias em `unit_settings` e objeto `reminders` na API, no lugar de uma segunda lista de dias desligados. Motivo: com listas, mudar um dia troca a identidade e a ordem das linhas; com colunas o banco garante as faixas. `reminder_days` sai na mesma migração, porque o único consumidor é este repositório.
- D5: o canvas `LembretesAuto` não tem campo de dia; a decisão 30 do dono pede "dia ajustável" e vence. O campo entra sob o texto de ajuda de cada linha, sem mudar o resto do desenho; a divergência vai na descrição do PR.
- D6: mudar o dia depois de um envio pode fazer a mesma cobrança receber o lembrete de novo no dia novo, porque o "uma só vez" é por cobrança e dia (como já é hoje). Não muda neste item.

## Construção

- T1 — arquivos: `docs/especificacao/10-cobrancas.md` (RN-COB-17 com D1 e D2), `docs/openapi.yaml` (`UnitReminders` e os três esquemas de lembrete, `UnitSettingsView`, `UnitUpdateSettings`, descrição do `PUT`) — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'` → saída 0.
- T2 — arquivos: `V66__reminder_switches.sql`, `UnitUpdate.java`, `UnitSettings.java`, `ReminderJob.java`, `ReminderJobIT`, `UnitSettingsIT`, `UnitUpdateValidationTest`, `UnitBase`, `OrganizationsIT`, `MigrationIT` (caso da V66, CA6), `backend/README.md` — prova: comando da tarefa → BUILD SUCCESS; `UnitUpdateValidationTest` 10/10 e ITs 36/36 (`ReminderJobIT` 10, `UnitSettingsIT` 15, `MigrationIT` 6, `OrganizationsIT` 5).
- T3 — arquivos: `useUnitSettings.ts`, `unitDraft.ts`, `UnitSettingsPage.tsx` e teste, `unitTabKit.tsx`, `mocks/handlers.ts`, `mocks/unit-settings.msw.test.ts`, `EnrollmentWizardPage.test.tsx` — prova: `npm test -- unit-settings.msw UnitSettingsPage EnrollmentWizardPage UnitRemindersTab telasCanvas tokens` (junto com a da T4) → 10 arquivos, 399 testes passaram.
- T4 — arquivos: `UnitRemindersTab.tsx` e teste, `i18n/pt-BR.json` — prova: o mesmo comando → 399/399.
- T5 — arquivos: `e2e/configuracao-unidade.spec.ts` (teste novo `@critical`: dentro da moldura, desligar, ajustar, religar, salvar, reabrir; a 390 px largura e sobreposição das cinco linhas) — prova: `npm run e2e -- configuracao-unidade` → 2/2. Com o layout antigo (`flex-1`), posto só para a prova e depois restaurado, o teste novo falhou: bloco de texto com 6,9 px (esperado >= 150).
- T6 — arquivos: `visual/casos.ts` (caso `configuracoes-unidade-lembretes-desligado` e o papel `switch` nos passos) e as referências — prova: `npm run test:visual:docker -- --update-snapshots -g "configuracoes-unidade-lembretes"` → 8/8; `npm run visual:canvas` → 164 comparadas, 0 reprovadas; `configuracoes-unidade-lembretes` 1440 claro com 1,8% (limite 15%), sem `limiteCanvas`. Capturas de 390 e 1440 abertas e conferidas.

Testes do item: os comandos acima passaram; depois da última tarefa, `npm run lint` e `npm run typecheck` → saída 0. Padrão de rotas e telas (nenhuma rota mudou): `npm test -- shell.test noInternalAnchors routePattern` → 6 arquivos, 315 testes passaram; e2e da tela dentro da moldura na T5.

Regressão: não roda nesta fase (AGENTS, "Quem roda o quê").

Desvios: nas colunas lidas por `UnitSettings.detail()`, a primeira coluna nova ocupa a posição da antiga `reminder_days` e as demais vão ao fim, lidas pelo nome, sem deslocar índice. Com o dia inválido no campo, o título da linha mostra o nome do lembrete (ex.: "Lembrete antes do vencimento").

Referências visuais: `frontend/visual/referencias/configuracoes-unidade-lembretes-{1440,390}-{claro,escuro}.png` (regeradas) e `configuracoes-unidade-lembretes-desligado-{1440,390}-{claro,escuro}.png` (novas); nenhuma de outra tela mudou.

Capturas para o canvas, em `.capturas/638/`: `configuracoes-unidade-lembretes-{1440,390}-{sistema,canvas}.png` e `configuracoes-unidade-lembretes-desligado-{1440,390}-sistema.png` (estado sem canvas). `LembretesAuto` é só de desktop: a captura do canvas a 390 saiu de uma cópia temporária do `canvas-shot.mjs` com a janela de 390 (removida) e mostra o desenho de desktop espremido, sem servir de referência de layout para o celular. A 390 o sistema mostra o texto em linhas normais, com "E-mail" e "Push" na linha de baixo.

Divergência do item com o canvas (D5): o campo do dia sob a ajuda das três linhas ajustáveis, que deixa as linhas mais altas. As demais diferenças vistas a 1440 (menu, nomes das abas, subtítulo, cores da chave, Push "Em breve") já existiam antes do item.

Tamanho: 23 arquivos contáveis.

Não é do item: nada.

## Verificação

### Rodada 1 — OK — 27/11/2026, estado bbd69ae46115f4dc4fab1c8a1cace1be2d78e364

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `UnitSettingsIT` 15/15 (campos de `settings` e padrões exatos, sem `reminderDays`) e `OrganizationsIT` 5/5 (colunas da unidade nova). |
| CA2 | PASSOU | `ReminderJobIT` 10/10, caso "#638 CA2": desligado não envia, dia 5 continua no banco, religado grava `SCHEDULED` com `offset_days` 5. A leitura do dia com a chave desligada pela API está em `UnitSettingsIT`, caso CA5. |
| CA3 | PASSOU | `ReminderJobIT`: caso "#638 CA3" (saem 1 antes e 5 depois; não saem os padrões nem o do dia desligado) e caso "CA5: reminders_enabled falso". |
| CA4 | PASSOU | `UnitUpdateValidationTest` 10/10 (limites, iguais mesmo desligados, cada ausência com o campo), `UnitSettingsIT` (400 e nada gravado) e `unit-settings.msw.test.ts` (no `npm test`). |
| CA5 | PASSOU | `UnitSettingsIT`, caso "#638 CA5" (antes e depois só do que mudou); os casos de perfil e de isolamento da classe passam. |
| CA6 | PASSOU | `MigrationIT` 6/6, caso da V66: as cinco listas, coluna removida, banco recusa fora da faixa e dias iguais. Backfill lido no SQL: confere com D3. |
| CA7 | PASSOU | `UnitSettingsPage.test.tsx` e `UnitRemindersTab.test.tsx` (no `npm test`) e e2e "lembretes da unidade". |
| CA8 | PASSOU | Os mesmos testes: vazio, fora da faixa e iguais mostram a mensagem, marcam a aba e não enviam; 400 do servidor abre a aba; geral desligado desabilita chaves, campos e horário. |
| CA9 | PASSOU | axe a 360 px nos dois temas (`UnitRemindersTab.test.tsx`), nomes únicos dos três campos (mesmo arquivo), sem rolagem a 360 px em todas as abas e dentro da moldura (e2e `configuracao-unidade`, 2/2). |
| CA10 | PASSOU | e2e a 390 px (bloco >= 150 px e sem sobreposição nas cinco linhas); captura `.capturas/638/configuracoes-unidade-lembretes-desligado-390-sistema.png` aberta: texto em linhas normais, "E-mail" e "Push" abaixo. |
| CA11 | PASSOU | `casos.ts` tem os dois casos; o diff traz só as 8 referências da aba (4 alteradas, 4 novas). Conferência contra as referências: no CI do PR. |

Comandos:
- `./backend/mvnw -f backend/pom.xml test` → 161 testes, 0 falhas.
- `verify -Dtest=NaoExiste -Dit.test='ReminderJobIT,UnitSettingsIT,OrganizationsIT,MigrationIT' -Djacoco.skip=true` → 36/36.
- `npm run lint`, `typecheck`, `build` → saída 0; `npm test` → 278 arquivos, 3182 testes, 0 falhas (inclui `shell`, `noInternalAnchors`, `routePattern`).
- `npm run e2e -- configuracao-unidade` → 2/2.
- visual: no CI do PR.

Canvas: abertas as 6 capturas de `.capturas/638/`. A 1440, a única diferença do item é o campo do dia nas três linhas ajustáveis (D5); as demais não são deste item. A captura do canvas a 390 é o desenho de desktop espremido e não serve de referência de layout; a 390 vale o CA10. O estado "desligado" não tem canvas.

Especificação x card: requisitos do card e do comentário do dono cobertos. D1 (o lembrete "no dia" não tem campo de dia) é a leitura de "dia ajustável" adotada, registrada com o motivo e escrita na RN-COB-17; vai na descrição do PR junto com D2, D3 e D5.

Instáveis: nenhum.

Achados:
- sugestão, código, `frontend/src/features/units/UnitRemindersTab.tsx` (`title`) — com os dois dias de depois iguais (estado inválido, que não salva), as duas chaves ficam com o mesmo nome acessível; usar o `reminderName` também nesse caso resolveria.

## Entrega

- **O que muda:** a aba Lembretes da unidade tem quatro lembretes fixos (antes, no dia, depois e um segundo depois do vencimento), cada um com chave própria. Os que têm número ganham campo de dia ajustável; o "no dia" só liga e desliga (D1). A V66 troca `reminder_days` por colunas em `unit_settings`, com o backfill da D3. A API passa a expor o objeto `reminders` (contrato em `docs/openapi.yaml`, MSW alinhado) e o `ReminderJob` não envia pela chave desligada.
- **Verificação:** rodada 1 OK (estado `bbd69ae`), com CA1 a CA11 passando. Testes: `mvnw test` 161/0 falhas; `npm test` 3182/0 falhas; lint, typecheck e build com saída 0; e2e `configuracao-unidade` 2/2. A conferência das referências visuais (job `visual` do CI) fica para o CI do PR.
- **Decisões que o leitor precisa conhecer:** D1 (o "no dia" não tem campo de dia), D2 (exatamente quatro lembretes, dias iguais inválidos mesmo desligados), D3 (migração), D4 (colunas em vez de lista) e D5 (divergência do canvas `LembretesAuto`: o campo de dia entra por causa da decisão 30 do dono).
- **Limitações:** D6 (mudar o dia depois de um envio pode reenviar a mesma cobrança no dia novo; não muda aqui). Achado de sugestão não aplicado: o `title` de `UnitRemindersTab.tsx` fica igual quando os dois dias de depois são iguais (estado inválido, não salva).
- **Instáveis:** nenhum. **Falhas de regressão:** nenhuma.
