# 608 — RN-ACE-23 · Sessão única de gestão por conta

Origem: issue #608 (Sprint 10.5), `docs/especificacao/02-contas-e-acesso.md` (RN-ACE-22, RN-ACE-23, RN-ACE-25, RF-ACE-04). Branch: `item/608-sessao-unica-de-gestao`.

## 1. Objetivo

Cada conta passa a ter no máximo uma sessão de gestão ativa (Coordenador incluído). Entrar na gestão em outro aparelho encerra na hora a sessão de gestão anterior; quem estava nela vê "Sua sessão foi encerrada porque esta conta entrou em outro aparelho." e volta ao login. Sessões do portal não são tocadas. O encerramento vai para a auditoria. Serve de proteção contra compartilhamento de conta de Administrador (cobrança por vaga, `16-assinatura.md`).

Fora do escopo: a lista "Atividade recente" da RN-ACE-25 (item #630; este item só deixa o dado gravado), qualquer mudança no e-mail "Novo acesso" (RN-ACE-22 já funciona; só ganha teste), cobrança por vaga.

## 2. Requisitos

- R1 (RN-ACE-23): ao iniciar ou passar a usar um vínculo de gestão (Coordenador, Administrador, Professor), todas as outras sessões de gestão da mesma conta são encerradas na hora (D1).
- R2 (RN-ACE-23): sessões cujo vínculo ativo é do portal (Aluno, Responsável) e sessões ainda sem vínculo escolhido não são encerradas por essa regra.
- R3 (RN-ACE-23): a sessão encerrada por outro aparelho responde 401 `SESSION_REPLACED` na próxima requisição, e a tela mostra "Sua sessão foi encerrada porque esta conta entrou em outro aparelho." e leva ao login (D2).
- R4 (RN-ACE-23): cada encerramento grava na auditoria `account.session_replaced`, sem token nem IP completo.
- R5 (RF-ACE-04): a lista de sessões ativas em Minha conta mostra no máximo uma sessão de gestão; a encerrada por outro aparelho não aparece nela.
- R6 (RN-ACE-22): voltar a entrar num aparelho já usado pela conta, inclusive depois de ter a sessão encerrada por outro aparelho, não envia "Novo acesso à sua conta" de novo (só teste).
- R7: cada código desta issue tem ao menos um teste; o texto da mensagem fica no arquivo pt-BR.

## 3. Critérios de aceite

- CA1 (R1): dado Ana com sessão de gestão no aparelho A, quando ela entra na gestão no aparelho B, então a sessão de A deixa de valer e a de B vale; a conta tem uma só sessão de gestão ativa.
- CA2 (R1): dado Ana com dois vínculos de gestão que escolhe o vínculo só depois do login (modal), quando ela escolhe em B, então a sessão de gestão de A é encerrada nesse momento e não antes.
- CA3 (R2): dado Ana com sessão do portal (vínculo Aluno) aberta e outra de gestão, quando ela entra na gestão em outro aparelho, então a sessão do portal continua válida e só a de gestão anterior cai.
- CA4 (R2): dado Ana entrando no portal (vínculo Aluno) enquanto tem sessão de gestão, então a sessão de gestão continua válida.
- CA5 (R3): dado a sessão de A encerrada por B, quando A faz qualquer requisição autenticada (inclusive `GET /auth/session`), então recebe 401 com código `SESSION_REPLACED`; uma sessão apagada ou vencida por outro motivo continua 401 `UNAUTHENTICATED`.
- CA6 (R3): dado A com a tela aberta, quando a próxima ação volta `SESSION_REPLACED`, então a tela vai a `/entrar` e mostra a mensagem em alerta, sem `next`; ao recarregar a página o resultado é o mesmo.
- CA7 (R4): dado o encerramento de CA1, então há uma linha de auditoria `account.session_replaced` por organização da conta, com o ator da conta e sem token.
- CA8 (R5): dado A encerrada por B, quando B abre `GET /auth/sessions`, então a lista tem só a sessão de B (mais as do portal) e `DELETE /auth/sessions/{id}` da sessão encerrada responde 404.
- CA9 (R6): dado Ana que entrou em A e B, quando ela entra de novo em A depois de A ter sido encerrada por B, então nenhum e-mail "Novo acesso à sua conta" novo é enviado.
- CA10 (R1): dado a sessão de A e a de B de contas diferentes, quando uma delas entra, então a da outra conta não é tocada (isolamento entre contas).
- CA11 (R1): dado login com segundo fator (duas etapas) e redefinição de senha que criam sessão, então a regra vale também por esses caminhos (todos passam por `SessionService.create`).

## 4. Plano técnico

- Dados: migração `V57__account_session_area.sql` em `account_session`: `area text check (area in ('MANAGEMENT','PORTAL'))` (nula = sem vínculo escolhido), `ended_at timestamptz`, `ended_reason text check (ended_reason in ('REPLACED'))`. Preenche `area` das sessões existentes pelo papel do vínculo ativo. Índice parcial `(account_id) where area = 'MANAGEMENT' and ended_at is null`. `account_session` não tem RLS (o filtro por conta é a barreira, como hoje).
- API: nenhuma rota nova. Novo código de erro `SESSION_REPLACED` (401) em `ErrorCode`, devolvido por qualquer rota autenticada, e no OpenAPI (`docs/openapi.yaml`): enum de códigos (perto da linha 4070) e descrição da resposta 401 de `/auth/session`. `GET /auth/sessions` e `DELETE /auth/sessions/{id}` passam a ignorar sessão encerrada.
- Interface: `lib/api.ts` avisa o `SessionProvider` quando uma resposta traz `SESSION_REPLACED`; o provider vai a `anon` com `replaced: true` (também no `refresh`); `RequireSession` leva a `/entrar` com o aviso; `LoginPage` mostra o alerta com a chave `auth.sessionReplaced`. Sem tela nova: o aviso é um alerta da tela de login, com os estados que ela já tem.
- Segurança: o encerramento é feito no servidor, na mesma transação que cria/escolhe o vínculo; só mexe em `account_id` da própria conta. A mensagem não revela aparelho nem IP do outro aparelho. Auditoria sem token.
- Arquivos (vistos no repositório):
  - `backend/src/main/java/br/com/ctcore/identity/SessionService.java`: `create` grava `area` pelo vínculo ativo e chama `replaceManagement`; `selectLink` atualiza `area` e chama `replaceManagement`; novo `replaceManagement(accountId, keepSessionId, ip)` marca `ended_at/ended_reason` nas outras sessões `MANAGEMENT` ativas e audita `account.session_replaced`; `authenticate` trata sessão encerrada como não autenticada e guarda o motivo; `list` e `endOne` filtram `ended_at is null`; `endAll` continua apagando tudo.
  - `backend/src/main/java/br/com/ctcore/identity/SessionAuthenticationFilter.java`: se não autentica e o cookie é de sessão encerrada por troca, grava atributo na requisição.
  - `backend/src/main/java/br/com/ctcore/api/error/SecurityErrorHandlers.java`: `commence` usa `SESSION_REPLACED` quando o atributo existe.
  - `backend/src/main/java/br/com/ctcore/api/error/ErrorCode.java`: `SESSION_REPLACED(HttpStatus.UNAUTHORIZED)`.
  - `backend/src/main/java/br/com/ctcore/identity/AuthController.java` (login e `PUT /session/link`): passa o IP à criação e à escolha de vínculo, se ainda não passa.
  - `docs/openapi.yaml`, `frontend/src/lib/api.ts`, `frontend/src/features/auth/SessionProvider.tsx`, `RequireSession.tsx`, `LoginPage.tsx`, `frontend/src/i18n/pt-BR.json`, `frontend/src/mocks/handlers.ts` (caso de `SESSION_REPLACED` para teste de tela).
  - A criar: `backend/src/main/resources/db/migration/V57__account_session_area.sql`, `backend/src/test/java/br/com/ctcore/identity/SingleManagementSessionIT.java`, `frontend/e2e/sessao-unica.spec.ts`.
- Reuso: `SessionService.create`/`selectLink`, `AccountAudit.record`, `Role.management()`, `NewAccessNotifier` (já grava `account_device` por aparelho), `AuthBase` e `NewAccessIT` como base dos testes.
- Riscos: (a) sessão sem vínculo escolhido (várias organizações) só é contada como gestão ao escolher; coberto por CA2. (b) Sessão antiga criada antes da migração fica sem `area` se o preenchimento falhar; a migração a preenche. (c) Testes existentes que abrem duas sessões de gestão da mesma conta (`SessionListIT`, `AuthRoutesIT`, seeds de e2e) passam a derrubar a primeira; ajustar esses testes para usar o portal ou contas diferentes. (d) Auditoria dentro de uma requisição só escreve na organização da sessão (`AccountAudit`); no login ainda não há escopo, então todas as organizações da conta recebem a linha.

## 5. Tarefas

- [x] T1: Migração `V57` com `area`, `ended_at`, `ended_reason` e preenchimento das sessões existentes — não cobre critério: base dos demais — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=SeedLoginIT`
- [x] T2: `SessionService`: gravar `area` em `create` e `selectLink`, `replaceManagement` com auditoria `account.session_replaced`, `list`/`endOne` ignorando encerradas — cobre CA1, CA2, CA3, CA4, CA7, CA8, CA10, CA11 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=SingleManagementSessionIT`
- [x] T3: `SESSION_REPLACED`: `ErrorCode`, `authenticate`/filtro/`SecurityErrorHandlers`, e `docs/openapi.yaml` — cobre CA5 — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'` e `-Dit.test=SingleManagementSessionIT`
- [x] T4: Teste de que voltar a um aparelho já usado, depois de encerrado por outro, não reenvia "Novo acesso" — cobre CA9 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=NewAccessIT`
- [x] T5: Ajustar testes e seeds que usavam duas sessões de gestão da mesma conta — não cobre critério: evita regressão — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='SessionListIT,AuthRoutesIT'`
- [x] T6: Front: aviso global em `api.ts`, `SessionProvider`, `RequireSession`, `LoginPage`, texto em `pt-BR.json`, caso no MSW — cobre CA6 — prova: `npm test -- LoginPage SessionProvider` (em `frontend/`)
- [x] T7: e2e: dois contextos de navegador entram na gestão com a mesma conta; o primeiro faz uma ação e vê a mensagem; sessão do portal segue aberta; tela abre dentro da moldura do login (padrão de rotas e telas) — cobre CA3, CA6 — prova: `npm run e2e -- sessao-unica` (em `frontend/`)
- [x] T8: Conferir o "Pronto quando" da issue, `npm test` (`shell.test.ts`, `noInternalAnchors.test.ts`, `routePattern.test.ts`), `npm run lint` e cobertura — não cobre critério: fechamento — prova: `npm run lint && npm run typecheck && npm test`

## 6. Decisões

- D1 (muda o comportamento): "sessão de gestão" é a sessão cujo vínculo ativo é de gestão, marcada em `area`. Sessão sem vínculo escolhido (modal pendente) ainda não conta; a troca de sessões acontece ao escolher o vínculo. Quem troca de um vínculo de gestão para o do portal na mesma sessão deixa de ocupar a vaga de gestão. Motivo: a regra diz "login na gestão" e a área só existe depois da escolha (RF-ACE-05). Alternativa: encerrar a cada login de qualquer conta de gestão; derrubaria quem só vai ao portal.
- D2: a sessão encerrada fica gravada com `ended_at` e motivo `REPLACED` até vencer, em vez de ser apagada. Motivo: é o que permite dizer "outro aparelho" na próxima requisição (e, depois, a linha "Sessão encerrada por outro aparelho" da RN-ACE-25, item #630) sem tabela nova. Alternativa: apagar e dar 401 comum; a mensagem exigida não apareceria.
- D3: código de auditoria `account.session_replaced`, separado de `account.session_ended`, porque a pessoa não pediu o encerramento. A auditoria usa `AccountAudit` (uma linha por organização).
- Suposição: a "mesma conta" que vê a mensagem faz a próxima ação com a sessão de gestão de fato aberta na tela; uma tela do portal da mesma conta não é afetada. Se o dono quiser avisar sem esperar uma ação (empurrar pelo servidor), vira item novo.
- Suposição: as chaves de e-mail "Novo acesso" por aparelho (`account_device`) não mudam; se o comportamento atual não passar no teste do CA9, a correção entra neste item.

## Construção

- T1 — `backend/src/main/resources/db/migration/V57__account_session_area.sql` — prova: `verify -Dit.test='br.com.ctcore.identity.*IT'` (inclui SeedLoginIT) → passou
- T2 — `identity/SessionService.java` (area, `replaceManagement`, `auditReplaced`, `list`/`endOne` ignoram encerradas), `AuthController.java` (IP em `selectLink`), `SingleManagementSessionIT.java` (CA1, CA2, CA3, CA4, CA7, CA8, CA10, CA11) → passou
- T3 — `ErrorCode.SESSION_REPLACED`, `SessionAuthenticationFilter`, `SecurityErrorHandlers`, `messages.properties`, `docs/openapi.yaml` (enum e descrição do 401) — prova: `test -Dtest='OpenApiContractTest,ContractRoutesTest'` + `SingleManagementSessionIT` (CA5) → passou
- T4 — `NewAccessIT.returningAfterReplacedDoesNotNotifyAgain` (CA9) → passou
- T5 — `SessionListIT`, `AuthRoutesIT`, `AuthIsolationIT`, `EmailChangeIT`: vínculo `STUDENT` onde o teste abre duas sessões da mesma conta → passou
- T6 — `lib/api.ts` (`setSessionReplacedHandler`), `SessionProvider.tsx`, `RequireSession.tsx`, `LoginPage.tsx`, `pt-BR.json`, testes em `LoginPage.test.tsx` e `SessionReplaced.test.tsx` — prova: `npm test -- LoginPage SessionReplaced` → 23 passaram
- T7 — `frontend/e2e/sessao-unica.spec.ts` — prova: `npm run e2e -- sessao-unica` → 1 passou
- T8 — `npm run lint && npm run typecheck && npm test && npm run e2e -- sessao-unica` → verde (inclui shell, noInternalAnchors e routePattern)

Regressão: `./backend/mvnw -f backend/pom.xml verify` → exit 0 (JaCoCo incluso). Front: lint, typecheck e `npm test` verdes. Não rodei `test:cov`, `e2e` completo nem `test:visual` (nenhuma tela nova nem layout alterado; o aviso é um Banner existente na tela de login).
Desvios:
- T6: sem caso novo em `mocks/handlers.ts`; os testes usam `server.use` para devolver `SESSION_REPLACED`.
- T7: o MSW vive dentro da página, então dois contextos de navegador não compartilham sessão; o e2e simula "outro aparelho" respondendo `SESSION_REPLACED` no fetch da página. O comportamento de dois aparelhos reais está provado no `SingleManagementSessionIT`.
- T5: nenhum seed precisou mudar.
- Auditoria de `account.session_replaced`: uma linha por sessão encerrada (e por organização do escopo), gravada fora da transação de criação, como `account.session_ended`.

## Verificação

### Rodada 1 — OK — 2026-11-21, estado 624b30ab1160368c80ecc63775c25ba383ac76d8

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `SingleManagementSessionIT.replacesPreviousManagementSession` (verify verde) |
| CA2 | PASSOU | `replacesOnLinkChoice`: A segue 200 até a escolha em B |
| CA3 | PASSOU | `portalIsUntouched` |
| CA4 | PASSOU | `portalIsUntouched` (entrada no portal não derruba gestão) |
| CA5 | PASSOU | `replacesPreviousManagementSession` (401 SESSION_REPLACED) e `otherEndsStayUnauthenticated` (UNAUTHENTICATED) |
| CA6 | PASSOU | `LoginPage.test.tsx`, `SessionReplaced.test.tsx`, e2e `sessao-unica` (resposta simulada no MSW, desvio registrado) |
| CA7 | PASSOU | contagem de `account.session_replaced` por organização; teste não acha token no `ip` |
| CA8 | PASSOU | lista com 1 sessão de gestão; DELETE da encerrada 404 |
| CA9 | PASSOU | `NewAccessIT.returningAfterReplacedDoesNotNotifyAgain` |
| CA10 | PASSOU | bia segue 200 |
| CA11 | PASSOU | `twoFactorLogin`; redefinição de senha passa pelo mesmo `create` (lido no diff) |

Comandos: `./backend/mvnw -f backend/pom.xml verify` → BUILD SUCCESS (inclui JaCoCo e contrato OpenAPI); `npm run lint`, `npm run typecheck` → 0; `npm test` → 275 arquivos, 2996 testes passaram; `npm run e2e` → 114 passaram; `npx playwright test sessao-unica` → 1 passou; Visual do CI: entrar → passou (4), login-* → passou (12).
Achados:
- sugestão, código, `SessionService.create`/`selectLink` — duas entradas simultâneas na mesma conta podem deixar duas sessões de gestão (sem trava por conta); aceitável, sem critério afetado.
- sugestão, código, `SessionService.auditReplaced` — auditoria gravada fora da transação (já registrada em Construção); falha na auditoria não desfaz o encerramento.
Instáveis: nenhum.

## Entrega

Sessão única de gestão por conta (RN-ACE-23). Ao entrar na gestão, as sessões de gestão anteriores da mesma conta são encerradas (`ended_at`, motivo `REPLACED`). A próxima requisição delas responde 401 `SESSION_REPLACED`, e a tela de login mostra a mensagem de outro aparelho. Quem só entra no portal não é afetado. Entram a migração V57 (`area` na sessão), a auditoria `account.session_replaced`, a lista de sessões que mostra só a sessão de gestão ativa e o contrato OpenAPI do 401.

Verificação: rodada 1 OK (estado 624b30ab), 11 critérios passaram. `verify` do backend, lint, typecheck, `npm test` e o e2e `sessao-unica` estão verdes.

Decisões: D1 a D3 (sessão de gestão = vínculo ativo de gestão marcado em `area`; sessão encerrada fica gravada até vencer; auditoria separada de `account.session_ended`).

Limitações: sem trava por conta, então duas entradas simultâneas na mesma conta podem deixar duas sessões de gestão. A auditoria é gravada fora da transação, como `account.session_ended`; falha nela não desfaz o encerramento. O aviso sem ação do usuário (empurrar pelo servidor) fica para item novo. O e2e simula o outro aparelho pelo MSW; o comportamento de dois aparelhos está no `SingleManagementSessionIT`.

Regressão: a da verificação vale, a base `dev` não avançou desde ela. Sem falhas registradas.
