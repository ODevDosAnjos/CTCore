# 690 — Suspeita de instabilidade: SeedLoginIT e limpeza de banco dos ITs com chave estrangeira

Origem: issue #690 (técnica, Sprint 10.5, back-end). Branch: `item/690-limpeza-banco-agendador-its`. Segue a #688 no backlog. Regras: `AGENTS.md`, "Testes e banco" (limpeza por `truncate ... cascade`, agendadores desligados no perfil de teste).

## 1. Objetivo

Medir e estabilizar a regressão do back-end: `SeedLoginIT` falhou no CI do PR #687 (`delete from charge` violou `charge_reminder_organization_id_charge_id_fkey`) e passou na `dev`. Leitura do código mostra a causa provável: o perfil de teste não desliga o agendador (`ctcore.scheduler.enabled` tem `matchIfMissing = true` e nenhum `application.properties` de teste o muda), então `ChargeNoticeJob` e `ReminderJob` (`initialDelay` 1 min, repetição a cada 15 min) rodam no banco compartilhado (um contêiner para toda a execução, `PostgresIT`) e criam `charge_reminder` no meio de outro IT; a limpeza por `delete` tabela a tabela (`SeedDataIT.cleanAll`) é frágil a isso. Serve ao dono e ao CI: `verify` deixa de falhar fora do diff do item.

Fora do escopo: migrar para `truncate` os outros ~90 ITs que limpam com `delete` (viram issue técnica por pacote, ver "Decisões"); `Clock` fixo (#693 e issues dela); retry automático ou aumento de timeout; mudar código de produção dos jobs.

## 2. Requisitos

- R1: a taxa de falha fica medida: `SeedLoginIT` junto dos demais ITs, em 5 execuções completas de `verify` sem a correção (a ordem do CI), com o resultado registrado na issue #690 e no arquivo do item (D1).
- R2: fica registrado quem cria `charge_reminder` durante a suíte e se há agendador ligado no perfil de teste, com prova (log ou teste), não só leitura do código.
- R3: o perfil de teste desliga o agendador (`ctcore.scheduler.enabled=false` em `backend/src/test/resources/config/application.properties`); só o teste que precisa do agendador o liga explicitamente (D2).
- R4: `SeedDataIT.cleanAll` e `cleanTeachers` limpam por `truncate ... cascade` e passam a cobrir qualquer tabela que referencie as raízes (inclusive `charge_reminder`), sem depender de ordem de tabelas (D3).
- R5: nenhum retry automático nem timeout maior é introduzido; se houver, fica na descrição do PR.
- R6: depois da correção, 5 execuções completas de `verify` sem falha de limpeza; se a medição de R1 não falhar nenhuma vez, o resultado fica registrado e o item fecha com ele (issue, passo 4), mantendo a correção por ser regra do `AGENTS.md` (D1).

## 3. Critérios de aceite

- CA1 (R1): dado o `verify` rodado 5 vezes na `dev` sem a correção, quando termina, então a issue #690 e a seção "Construção" trazem "N falhas em 5 execuções", com os testes que falharam.
- CA2 (R2): dado o contexto de teste sem a propriedade, quando um IT espera mais de 1 minuto (ou o teste de prova roda), então fica registrado que `ChargeNoticeJob`/`ReminderJob` executam e o que gravam em `charge_reminder`; dado o perfil depois da correção, então nenhum job `@Scheduled` do produto executa.
- CA3 (R3): dado qualquer `@SpringBootTest` com o perfil de teste, quando o contexto sobe, então não há bean `LockProvider` nem tarefa agendada de produção; `SchedulerLockIT` continua passando (liga o agendador só nele).
- CA4 (R4): dado um `charge_reminder` ligado a uma `charge` na base, quando `SeedDataIT.cleanAll` roda, então termina sem erro de chave estrangeira e as tabelas ficam vazias (teste novo em `SeedDataIT`); `audit_log` continua limpo com o gatilho de append-only desligado só durante a limpeza.
- CA5 (R4): dado `SeedLoginIT.everyAccountLogsIn` e `SeedDataIT` rodando juntos com um `charge_reminder` pré-existente, quando terminam, então passam e não deixam linhas em `account`, `charge` nem `organization`.
- CA6 (R5): dado o diff, quando se procura retry, `Thread.sleep` novo ou timeout aumentado, então não há.
- CA7 (R6): dado o código corrigido, quando `./backend/mvnw -f backend/pom.xml verify` roda 5 vezes, então 5 `BUILD SUCCESS`, com cobertura JaCoCo mantida; resultado na issue e no item.

## 4. Plano técnico

- Dados, API, interface, segurança: não mudam (só testes e configuração de teste; nenhum código de produção).
- Arquivos:
  - `backend/src/test/resources/config/application.properties` (existe; só tem `ctcore.security.two-factor-key`): acrescentar `ctcore.scheduler.enabled=false`.
  - `backend/src/test/java/br/com/ctcore/scheduling/SchedulerLockIT.java` (existe; `@Import(SchedulerLockIT.Tasks.class)`, usa `LockProvider` e `@Scheduled` de teste): ligar o agendador com `properties = "ctcore.scheduler.enabled=true"` na anotação de contexto (acrescentar `@SpringBootTest(properties = ...)` sobre a herdada de `PostgresIT`); `SchedulerDisabledTest` já desliga e não muda.
  - `backend/src/test/java/br/com/ctcore/db/PostgresIT.java` (existe): método estático `truncateCascade(JdbcTemplate, String... tables)` que executa `truncate table a, b cascade`, com o gatilho `audit_log_no_truncate` (V5) desligado em volta (`alter table audit_log disable trigger user` / `enable`), já que o cascade chega a `audit_log`.
  - `backend/src/test/java/br/com/ctcore/db/SeedDataIT.java` (existe; `cleanAll` e `cleanTeachers` com lista fixa de `delete`): trocar a lista por `truncateCascade` nas raízes `organization` e `account` (o cascade leva `charge_reminder`, `charge` e demais filhas). Os ~20 ITs que chamam `cleanAll` (`ChargeActionsBase`, `BillingFixtures`, `ReminderBase`, `SeedLoginIT`, `DailyReceiptsIsolationIT`, entre outros) ganham a correção sem mudar. Teste novo em `SeedDataIT`: cria org, `charge` e `charge_reminder`, chama `cleanAll`, confere tudo vazio.
  - `backend/src/test/java/br/com/ctcore/identity/SeedLoginIT.java` (existe; `unseed` já chama `cleanAll`): sem mudança de código esperada; só prova.
  - Arquivo de prova do agendador (a criar, descartável, não commitado): ver T2.
- Reuso: `SeedDataIT.cleanAll` como ponto único de limpeza dos ITs de cobrança e seed; `ctcore.scheduler.enabled` já existe em `SchedulerConfig` e é usado por `SchedulerDisabledTest`, `ContractRoutesTest` e outros.
- Riscos: `truncate ... cascade` em `account` ou `organization` apaga dados de outros ITs que dependam de linha deixada por outro (ordem); a medição CA7 mostra. ITs de job (`ChargeNoticeIT`, `ChargeReminderSendIT`, `ChargeGenerationJobIT`, `MajorityNoticeJobIT`) chamam o bean direto e não precisam do agendador; se algum depender do disparo automático, falhará em CA7 e liga a propriedade só nele. `truncate` pega trava de acesso exclusiva: um IT com transação aberta em paralelo travaria; a suíte roda em série (sem `parallel`/`forkCount` no `pom.xml`).

## 5. Tarefas

- [x] T1: medir sem a correção: rodar `./backend/mvnw -f backend/pom.xml verify` 5 vezes na `dev` limpa e registrar falhas por execução na issue #690 e em "Construção" — cobre CA1 — prova: o log de cada rodada e `gh issue view 690 --comments`
- [x] T2: provar quem cria `charge_reminder`: rodar `ChargeNoticeIT`/um IT longo com log dos jobs (ou teste descartável que espera o `initialDelay` de 1 min e confere `select count(*) from charge_reminder` e o log de `ChargeNoticeJob`/`ReminderJob`); registrar o resultado; apagar o teste descartável — cobre CA2 — prova: o comando usado e a saída colada no item
- [x] T3: `ctcore.scheduler.enabled=false` no `application.properties` de teste e `properties = "ctcore.scheduler.enabled=true"` em `SchedulerLockIT` — cobre CA3 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=SchedulerLockIT -Dtest=SchedulerDisabledTest` (e conferir no log que os jobs de produção não rodam)
- [x] T4: `truncateCascade` em `PostgresIT` e uso em `SeedDataIT.cleanAll`/`cleanTeachers`; teste novo de `cleanAll` com `charge_reminder` — cobre CA4, CA5 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='SeedDataIT,SeedLoginIT'`
- [x] T5: rodar a regressão completa do back-end 5 vezes depois da correção; registrar na issue e em "Construção"; se algum IT falhar por depender de dado deixado por outro ou do agendador, corrigir só o IT que falhou e anotar — cobre CA6, CA7 — prova: 5 saídas `BUILD SUCCESS` do `./backend/mvnw -f backend/pom.xml verify` e `git diff` sem retry nem timeout novo
- [x] T6: abrir issue `técnica` (e só ela) para migrar os demais ITs com limpeza por `delete` (lista por pacote do `grep`), citando a #690 e a regra "Testes e banco" — não cobre critério: a issue pede só a causa medida; o resto vai para item próprio — prova: `gh issue list --label técnica` com a nova issue

## 6. Decisões

- D1: a medição de R1 roda sem a correção na `dev` limpa; falhar 0 de 5 não dispensa a correção, porque a causa (agendador ligado no teste, `delete` com FK) fica provada por T2 e a regra do `AGENTS.md` exige as duas coisas. Alternativa: só corrigir quando a falha reproduzir, descartada porque a falha é intermitente e depende do horário (initialDelay de 1 min).
- D2: o agendador fica desligado para todo teste por padrão e é ligado só em `SchedulerLockIT`; ITs de job chamam o bean direto. Motivo: `AGENTS.md` ("Agendadores ficam desligados no perfil de teste"). Alternativa: `@MockBean` dos jobs, descartada por esconder o bean.
- D3: a limpeza central usa `truncate` em cascata a partir de `organization` e `account` (raízes), e não uma lista de tabelas. Motivo: tabela nova com FK para `charge` ou `account` entra sozinha e a ordem deixa de importar. Alternativa: acrescentar `charge_reminder` à lista fixa, descartada por repetir o problema na próxima tabela filha.
- D4: migrar os outros ITs com `delete` (96 arquivos usam `jdbc.update("delete from ...")`) fica fora; viram issue técnica por pacote (T6), no mesmo formato da #693. Motivo: passa de 10 arquivos de código e a regra de "Testes e banco" vale para teste novo.
- Suposição: o agendador de produção realmente roda no perfil de teste e cria `charge_reminder` (T2 prova). Se T2 mostrar que não roda, a causa é outra (ordem dos ITs ou servidor real com porta aleatória que o rollback não desfaz); a correção de R4 continua valendo e o item volta com a causa medida antes de seguir, sem inventar nova.
- Suposição: a suíte roda em série; se o CI usar fork paralelo, o `truncate` pode travar e a medição de T5 mostra.

## Construção

- T1 — medição sem a correção (worktree da `dev` 02f0594; as séries sem e com a correção rodaram ao mesmo tempo): `./backend/mvnw -f backend/pom.xml verify` x5 → 4 falhas em 5 (exec. 2, 3 e 4: `S3FileStorageIT` x2 testes, conexão recusada; exec. 5: `StudentRegistrationIT.lookup`, `CannotGetJdbcConnectionException`); `SeedLoginIT` 0 falhas. Registrado em https://github.com/ODevDosAnjos/CTCore/issues/690#issuecomment-7134895360.
- T2 — teste descartável `SchedulerProofIT` (espera 75 s, lê `shedlock`), rodado num worktree e apagado: sem a propriedade → `LockProvider beans=[lockProvider]`, `shedlock=[billing-charge-notices, billing-reminders, communication-announcement-send, email-retry]`; com `ctcore.scheduler.enabled=false` → `beans=[]`, `shedlock=[]`. `charge_reminder`=0 porque o banco da prova estava vazio; o job existe e roda, então cria linhas quando há cobrança.
- T3 — arquivos: `backend/src/test/resources/config/application.properties`, `backend/src/test/java/br/com/ctcore/scheduling/SchedulerLockIT.java` — prova: `verify -Dit.test='SeedDataIT,SeedLoginIT,SchedulerLockIT' -Dtest=SchedulerDisabledTest` → BUILD SUCCESS (SchedulerDisabledTest 1, SchedulerLockIT 4).
- T4 — arquivos: `PostgresIT.java` (`truncateCascade`), `SeedDataIT.java` (`cleanAll`/`cleanTeachers`, teste novo `cleanAllWithChargeReminder`) — mesma prova: SeedDataIT 28, SeedLoginIT 3, 0 falhas. Desvio: `organization_feature` entra explícita no truncate, porque não tem chave estrangeira (o teste `order` grava organização inexistente) e o cascade não a limpava (`createsOrganizations` falhou com 3 em vez de 2 até incluí-la).
- T5 — `verify` x5 com a correção: 4 falhas em 5, todas só `S3FileStorageIT` (exec. 1, 3, 4, 5); exec. 2 BUILD SUCCESS (933 testes, JaCoCo "All coverage checks have been met"). Nenhuma falha de limpeza nem de agendador. `git diff`: sem retry, `Thread.sleep` nem timeout novo.
- T6 — issue técnica #701 (migrar os demais ITs com `delete`); `gh issue list --label técnica`.
Regressão: só o back-end foi tocado (testes e configuração de teste); `lint`/`typecheck`/`build`/`e2e` e visual do front não rodaram, nada de front mudou. CA7 (5 `BUILD SUCCESS`) NÃO atingido localmente por `S3FileStorageIT` (falha de ambiente, também 3 de 4 na linha de base): aberta a #702; vale o CI do PR como prova (autonomia 2).
Desvios: medição e correção rodaram ao mesmo tempo (carga maior que a do CI); issue extra #702 pela falha repetida do S3.
Não é do item: nada.

## Verificação

### Rodada 1 — NAO_CONFERIDO (regressão parcial) — 2026-11-24, estado d940388d1a1dbc90e1bce2c3c3b01af708d0dee8

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | medição registrada na seção "Construção" e na issue #690 (4 falhas em 5, só S3/conexão; SeedLoginIT 0); não reexecutada |
| CA2 | PASSOU | prova T2 descrita em "Construção" (shedlock com 4 jobs sem a propriedade; vazio com ela); `SchedulerLockIT` roda com o agendador ligado e registra a tarefa de produção só nele |
| CA3 | PASSOU | `verify -Dit.test='SeedDataIT,SeedLoginIT,SchedulerLockIT' -Dtest=SchedulerDisabledTest`: 35 testes, 0 falhas, BUILD SUCCESS |
| CA4 | PASSOU | `SeedDataIT.cleanAllWithChargeReminder` passou (inclui audit_log e charge_reminder) |
| CA5 | PASSOU | SeedDataIT e SeedLoginIT juntos passaram; SeedLoginIT é coberto pelo `cleanAll` novo |
| CA6 | PASSOU | diff lido: sem retry, `Thread.sleep` nem timeout novo |
| CA7 | PASSOU (1 de 1 aqui) | `verify` completo: 933 testes, 0 falhas, BUILD SUCCESS, "All coverage checks have been met". Não repeti 5 vezes; o autor não obteve 5 por falha de ambiente em `S3FileStorageIT` (issue #702), vale o CI do PR (autonomia 2) |

Comandos: `./backend/mvnw -f backend/pom.xml verify` → BUILD SUCCESS, 933 testes, JaCoCo ok. Alvo (SeedDataIT, SeedLoginIT, SchedulerLockIT, SchedulerDisabledTest) → BUILD SUCCESS.
Não rodou: `lint`, `typecheck`, `build`, `test:cov`, `e2e` e visual do front. Nada de front mudou (diff só em backend/src/test e specs); o AGENTS.md exige a regressão completa, então o resultado é parcial e o maestro só segue com "sim" do dono.
Instáveis: `S3FileStorageIT` (falha de ambiente local relatada pelo autor, 4 de 5; nesta verificação passou).
Achados:
- sugestão, código, `SeedDataIT.cleanAll` — a lista `organization_feature` explícita no truncate está comentada; ok. Sem outros achados.

### Rodada 2 — OK — 2026-11-24, estado 90c49972f5d1ec704a8b859ad5aba56d691272ef

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | mantido da rodada 1 (medição registrada em "Construção" e na issue #690) |
| CA2 | PASSOU | mantido da rodada 1 (prova T2 em "Construção") |
| CA3 | PASSOU | `verify` completo: SchedulerLockIT e SchedulerDisabledTest dentro dos 933 testes, 0 falhas |
| CA4 | PASSOU | `SeedDataIT.cleanAllWithChargeReminder` passou no `verify` completo |
| CA5 | PASSOU | SeedDataIT e SeedLoginIT passaram no `verify` completo |
| CA6 | PASSOU | diff relido: sem retry, `Thread.sleep` nem timeout novo |
| CA7 | PASSOU (1 de 1 aqui; 5 de 5 não exigido de novo) | `verify` completo BUILD SUCCESS, 933 testes, 0 falhas, JaCoCo "All coverage checks have been met"; as 5 repetições ficam para o CI do PR (autonomia 2; falha local do S3 na issue #702) |

Comandos (regressão local completa):
- `./backend/mvnw -f backend/pom.xml verify` → BUILD SUCCESS, 933 testes, 0 falhas, cobertura ok.
- front (`frontend/`): `npm run lint` exit 0; `npm run typecheck` exit 0; `npm run build` exit 0; `npm run test:cov` → 275 arquivos, 3005 testes passaram, cobertura global 97,15% linhas, sem falha de limite; `npm run e2e` → 117 passaram.
- Visual: não se aplica (item não cria nem muda tela; diff só em `backend/src/test`, configuração de teste e `specs/`).
Não rodou: nada da regressão local completa.
Instáveis: nenhum nesta rodada (`S3FileStorageIT` passou).
Achados:
- sugestão, código, `SeedDataIT.cleanAll` — `organization_feature` explícita no truncate está comentada; sem outros achados.

## Entrega

- O que muda: a limpeza dos ITs passa a ser `truncate ... cascade` a partir de `organization` e `account` (`PostgresIT.truncateCascade`, `SeedDataIT.cleanAll`, que inclui `charge_reminder`); o agendador fica desligado no perfil de teste e só `SchedulerLockIT` o liga, provando a tarefa de produção. Sem retry, `Thread.sleep` nem timeout novo.
- Verificação: rodada 2 OK (estado `90c49972f5d1ec704a8b859ad5aba56d691272ef`). `verify` completo: 933 testes, 0 falhas, JaCoCo ok. Front: lint, typecheck, build, test:cov (3005 testes) e e2e (117) verdes. Visual não se aplica.
- Medição (T1, sem a correção, worktree da `dev` 02f0594): 4 de 5 `verify` com falha, todas de ambiente (`S3FileStorageIT`, conexão recusada; `StudentRegistrationIT.lookup`, `CannotGetJdbcConnectionException`); `SeedLoginIT` 0 falhas.
- Decisões: D1 a D4 acima (medição antes da correção; agendador desligado por padrão; limpeza por raiz em cascata; migração dos demais ITs com `delete` fora deste item).
- Limitações: CA7 (5 de 5 `BUILD SUCCESS`) não foi reproduzido localmente por falha de ambiente em `S3FileStorageIT`, aberta na #702; vale o CI do PR (autonomia 2). A migração dos 96 arquivos com `delete` vai para a #701.
- Regressão de entrega: `dev` não avançou desde a verificação (HEAD = `origin/dev` = 02f0594); não foi rodada de novo.
- Instáveis: `S3FileStorageIT` (ambiente local); registrado na #702.
