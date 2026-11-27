# 764 — 630c · Trocar de aparelho, códigos de reserva e Baixar meus dados (fecha a #630)

Origem: issue #764, parte c da #630 (RF-ACE-04, RF-LGP-01, RN-ACE-10, RN-ACE-17, RN-ACE-24, RN-ACE-25; decisão 24 de `docs/auditoria/decisoes-canvas.md`). Divisão e plano de partida em `specs/itens/630-minha-conta-abas.md`. Branch: `item/764-minha-conta-seguranca-dados`.

Tempos: especificar 3 · construir 32 · verificar 26 (regressão 24; 1 rodada) · entregar 3
Comparação com o canvas: 3

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Em Minha conta › Segurança, quem usa duas etapas passa a trocar o aparelho sem desligá-las e a ver quantos códigos de reserva restam. Em Privacidade, na gestão, Coordenador, Administrador e Professor passam a baixar os próprios dados. Vai antes da #636 e fecha a #630.

Fora do escopo: Atividade recente e "Não fui eu" (#631); dados de aluno e responsável e o botão na ficha (#117, RN-LGP-04); "Excluir minha conta" (#118); botões do portal, que seguem "Em breve"; e-mail de aviso da troca de aparelho (a especificação não pede).

## 2. Requisitos

- R1: com as duas etapas ligadas, na gestão e no portal, "Trocar de aparelho" pede senha e código atual, mostra o QR e a chave de um app novo e, ao confirmar o código dele, o segredo anterior deixa de valer; até a confirmação o anterior continua valendo e os códigos de reserva não são trocados (D1, D2, D3).
- R2: senha ou código atual errado na troca conta na trava da RN-ACE-10 e não muda nada.
- R3: com as duas etapas ligadas, a tela mostra "códigos de reserva: N de 10", com N igual ao número de códigos não usados da conta no banco.
- R4: na gestão, Coordenador, Administrador e Professor baixam em Privacidade um arquivo JSON com a conta (nome, e-mail, telefone, foto), os vínculos, os consentimentos e os acessos registrados da própria conta, de todas as organizações dela (D4, D5, D6).
- R5: o arquivo não tem senha, hash, segredo, token, código, URL assinada nem IP inteiro, e não tem dado de outra conta nem dados de aluno (D5, D6, D7).
- R6: cada download e cada troca de aparelho vão para a auditoria (D8).
- R7: vínculo de portal ativo, ou nenhum vínculo ativo, recebe 403 no download; no portal o botão segue "Em breve" (D9).

## 3. Critérios de aceite

- CA1 (R1, R6): dadas as duas etapas ligadas, quando pede a troca com senha e código atual e confirma o código do app novo em até 10 minutos, então o login recusa o código do segredo anterior e aceita o do novo, o código usado na confirmação não vale de novo no mesmo passo, os códigos de reserva não usados continuam valendo, a data de ativação não muda e há `account.two_factor_replaced` na auditoria; antes da confirmação, o login aceita o anterior e recusa o novo.
- CA2 (R2): dada senha errada ou código atual errado ou ausente, quando pede a troca, então responde 401 (`INVALID_CREDENTIALS` ou `INVALID_TWO_FACTOR_CODE`), grava a tentativa em `login_attempt` e nada muda; depois de 5 erros seguidos, 429.
- CA3 (R1): dadas as duas rotas da troca, então sem sessão 401, sem CSRF 403 e com as duas etapas desligadas 409; confirmar sem pedido pendente ou depois de 10 minutos responde 409 e código novo errado 401, sempre com o segredo anterior valendo; um pedido novo substitui o pendente; a troca de uma conta não muda o segredo de outra.
- CA4 (R1): dado um Coordenador, um Administrador obrigado (RN-ACE-24) ou uma conta de portal com as duas etapas, então todos podem trocar de aparelho.
- CA5 (R3): dado um código de reserva usado (no login ou como código atual), então `twoFactor.backupCodesRemaining` da sessão relida é igual à contagem no banco (9 depois de um uso), gerar códigos novos volta a 10, o uso por outra conta não muda o número, e com as duas etapas desligadas o campo é 0.
- CA6 (R1, R3): dada a aba Segurança com as duas etapas ligadas, então mostra "códigos de reserva: N de 10" e "Trocar de aparelho" (com elas desligadas, nenhum dos dois); a janela pede senha e código, depois mostra QR, chave e código novo; erros de senha, código e muitas tentativas aparecem sem fechar; 409 na confirmação volta ao passo da senha com aviso; falha e 403 têm estado próprio; concluída, a janela fecha, avisa o sucesso e relê a sessão; ao fechar a janela de códigos novos a sessão também é relida e a contagem volta a 10.
- CA7 (R4, R5): dados um Coordenador, um Administrador e um Professor com vínculos em duas organizações (um deles encerrado), consentimentos, tentativas de acesso e sessões, quando cada um baixa, então recebe 200 com anexo JSON que tem nome, e-mail, telefone, a foto com o conteúdo embutido (nulo sem foto ou com o arquivo ausente), todos os vínculos com organização, papel, situação, datas e unidades, os aceites e confirmações feitos pela conta, a preferência de e-mail dos vínculos de portal, o consentimento do diretório de professor, as tentativas de acesso e as sessões, também das organizações que não são a ativa.
- CA8 (R5): dadas as contas A e B nas mesmas e em outras organizações, quando A baixa, então o arquivo não tem nenhum dado de B; não contém hash de senha, segredo, hash de sessão ou de código, URL assinada, nome de aluno nem IP inteiro (IPv4 sem o último número; IPv6 só com o prefixo /48); tentativas anteriores à criação da conta ou à última troca de e-mail confirmada não entram.
- CA9 (R6, R7): então o download grava `account.data_downloaded` só na organização ativa, sem o conteúdo do arquivo; sem sessão 401; com vínculo de Aluno ou Responsável ativo, ou sem vínculo ativo, 403 sem auditoria; a rota não aceita id de conta.
- CA10 (R4, R7): dada a aba Privacidade na gestão, quando clica em "Baixar meus dados", então o botão fica desabilitado enquanto prepara e o navegador salva `meus-dados-ctcore.json`; falha mostra o erro com "Tentar de novo" e 403 o aviso de sem permissão; no portal os dois botões seguem "Em breve" e não chamam rota.
- CA11 (R1, R3, R4): dadas as telas mexidas, então a 360 px não há rolagem horizontal, o axe passa nos dois temas (aba Segurança ligada, janela de troca e Privacidade), há casos no teste visual, o MSW bate com o contrato, as capturas e a comparação com o canvas estão em `.capturas/764/` e segue o padrão de rotas e telas.

## 4. Plano técnico

Caminhos de back-end em `backend/src/main/java/br/com/ctcore/`; de front em `frontend/src/`.

### Dados

`backend/src/main/resources/db/migration/V63__two_factor_replace_and_data_export.sql` (a criar; a última é a V62):

- `account_two_factor` ganha `pending_secret_encrypted text` e `pending_expires_at timestamptz`. O segredo ativo fica intacto até a confirmação; a política de conta da V11 já cobre.
- Políticas só `for select`, no molde de `V8`, `V55` e `V61`, para o escopo `app.account_id` (com ele vazio nada abre): `term_acceptance`, `modality_confirmation` e `teacher` com `account_id` igual à conta; `organization` para organização em que a conta tem vínculo em qualquer situação; `unit` para unidade ligada a um vínculo da conta em qualquer situação. Hoje `organization_of_account_link` (V8) e `unit_of_account_or_invite` (V55) só cobrem vínculo ativo. `account_link` e `account_link_unit` já são legíveis. Sem recursão: as novas só consultam `account_link` e `account_link_unit`. Reversão manual no comentário.
- Sem tabela nova, sem seed. `MigrationIT` só muda se alguma asserção dele quebrar.

### API (`docs/openapi.yaml`)

- `POST /auth/two-factor/replace` `{ password, code }` (`PasswordAndCode`): 200 `TwoFactorSetup`; 400, 401, 403 (CSRF), 409, 429.
- `POST /auth/two-factor/replace/confirm` `{ code }` (`TwoFactorCode`): 204; 400, 401, 403, 409 (desligadas, sem pendente ou vencido).
- `GET /auth/data-export`: 200 `application/json` (`AccountDataExport`, esquema novo) com `Content-Disposition: attachment`; 401, 403.
- `TwoFactorState` ganha `backupCodesRemaining` (inteiro de 0 a 10, obrigatório).
- Formato do arquivo (chaves em inglês): `generatedAt`; `account {name, email, phone, photo {contentType, base64} ou null}`; `links [{organization, role, status, startsOn, endsOn, units[]}]`; `consents {termAcceptances [{organization, kind, event, version, at}], modalityConfirmations [{organization, at}], emailPreferences [{organization, role, announcements}], teacherDirectory [{organization, consent, declaredByManagement}]}`; `access {attempts [{at, result, ip}], sessions [{device, createdAt, lastUsedAt, endedAt, ip}]}`.
- As três agem só sobre a conta da sessão e não recebem id. O `TwoFactorGateFilter` já libera `/auth/two-factor/*` e não libera o download (não muda).

### Back-end

- `identity/TwoFactorService.java`: `replace(accountId, password, code, ip)` = `requireEnabled`, `confirm` (trava da RN-ACE-10; sem checar `requiredFor`), gera segredo, grava o pendente com validade de 10 minutos pelo `Clock` e devolve `Setup` (extrair do `setup` a montagem do `otpauthUri`). `confirmReplace(accountId, code, ip)`: numa transação da conta, lê o pendente não vencido `for update`, confere com `Totp.match`, copia para `secret_encrypted`, grava `last_used_step` com o passo conferido, limpa o pendente e não toca `enabled_at` nem `account_backup_code`; depois `audit.record(..., "account.two_factor_replaced")`, como nos outros eventos de duas etapas. Erros pelo `IdentityException` de hoje (`TWO_FACTOR_STATE` vira 409).
- `identity/TwoFactorController.java`: as duas rotas, com `require(principal)` e os records que já existem.
- `identity/SessionService.java`: `TwoFactorView` ganha `backupCodesRemaining`, preenchido com `twoFactor.backupCodesRemaining(accountId)` quando ligadas, 0 se desligadas.
- `identity/AccountDataExport.java` e `AccountDataExportController.java` (a criar): `AccountProfile.requireAccess(who)` primeiro; consultas dentro de `AccountTransactions.forAccount`, cada uma com lista explícita de colunas e filtro por `account_id` (`account`, `account_session` e `login_attempt` não têm RLS: o filtro é a barreira). Sessões: todas as linhas da conta, com `DeviceLabel.of` e IP mascarado. Tentativas: `login_attempt.email = LoginAttempts.normalize(email atual)` e `occurred_at` a partir do maior entre `account.created_at` e o último `used_at` de `account_email_change` da conta (D7). Máscara de IP num método do próprio serviço (não há outra no código); valor que não é IP vira nulo. Foto lida do armazenamento e embutida em base64; `NotFound` vira nulo e outra falha responde erro, sem arquivo incompleto. Auditoria por `ScopedAudit.record(who.organizationId(), ...)`, como em `EmailPreferences` (D8).
- `storage/FileStorage.java` e `S3FileStorage.java`: `getAccountFile(accountId, name)`, chave `account/<accountId>/<nome>`, com `checkName` e `NotFound`.

### Interface

- `features/account/TwoFactorSection.tsx`: com `enabled`, a linha "códigos de reserva: N de 10" e o botão "Trocar de aparelho" ao lado dos atuais (gestão e portal); sucesso da troca avisado no cartão; fechar `BackupCodesDialog` chama `changed()`.
- `features/auth/TwoFactorSetupDialog.tsx`: prop `replace`. Com ela, a janela abre no passo de senha e código (`Field`, `CodeField kind="any"`, erros como no `DisableDialog`), sem chamar `/two-factor/setup`; o POST de `replace` leva à fase de QR já existente; confirmar usa `replace/confirm` e chama `onEnabled` sem a fase de códigos; passos sem "guardar códigos", título "Trocar de aparelho" e botão "Cancelar". Sem a prop, nada muda. Uma janela só, para não copiar QR, chave e estados.
- `features/account/PrivacyTab.tsx`: na gestão o `ComingSoon` de "Baixar meus dados" vira `Button`: `api("/auth/data-export")`, `Blob` com `JSON.stringify(dados, null, 2)` e clique num `<a download>` criado no código, como em `BackupCodesDialog.download` (sem `<a href="/...">` no JSX, regra de rotas). Estados: preparando, `ErrorState` com repetição, `ForbiddenState`, 401 com `refresh` da sessão. Sem carga ao abrir a aba, então não há estado vazio. Portal não muda.
- `features/auth/SessionProvider.tsx`: `twoFactor.backupCodesRemaining?: number` (opcional só no tipo, para não reescrever as sessões de exemplo dos testes).
- `i18n/pt-BR.json`: textos em `account.twoFactor.*`, `twoFactor.setup.*` e `account.privacy.*`, com o nome do arquivo. Em `features/account` e `features/auth`, comentário escreve "issue 764", sem `#`.
- `mocks/handlers.ts`: as três rotas (401, 403 no portal, 409 sem duas etapas ou sem pendente, 401 com senha "errada" ou código fora de `VALID_CODES`, 429 com "limite") e `backupCodesRemaining` calculado em `sessionView` (0 desligadas; 8 nas contas já ligadas, como o login do MSW; 10 depois de ativar ou gerar), sem alterar os objetos iniciais compartilhados.

### Segurança

Permissão no servidor nas três rotas; senha e código só por `TwoFactorService.confirm`; segredo pendente cifrado com `SecretCipher`, mostrado só na resposta do pedido e com validade; auditoria sem segredo, código nem conteúdo do arquivo; resposta sem cache (cabeçalhos padrão do Spring Security, a conferir no IT); foto embutida em vez de URL assinada. Testes, MSW e capturas só com dados fictícios.

### Arquivos (cerca de 25 contáveis, dentro do limite de 30)

- A alterar (vistos no repositório): `TwoFactorService.java`, `TwoFactorController.java`, `SessionService.java`, `FileStorage.java`, `S3FileStorage.java`, `backend/src/test/java/br/com/ctcore/storage/S3FileStorageIT.java`, `docs/openapi.yaml`; `TwoFactorSection.tsx`, `TwoFactorSetupDialog.tsx`, `TwoFactorDialogs.test.tsx`, `PrivacyTab.tsx`, `AccountPage.test.tsx` (o caso "#762 CA9" da gestão muda), `SessionProvider.tsx`, `pt-BR.json`, `handlers.ts`, `mocks/twofactor.msw.test.ts`, `mocks/account.msw.test.ts`, `frontend/visual/casos.ts`, `frontend/e2e/duas-etapas.spec.ts`, `frontend/e2e/minha-conta.spec.ts`.
- A criar: a migração V63; `AccountDataExport.java`; `AccountDataExportController.java`; em `backend/src/test/java/br/com/ctcore/identity/`, `TwoFactorReplaceIT.java` e `AccountDataExportIT.java` (sobre `AuthBase`, que já aponta para o armazenamento único `OrganizationBase.storageEndpoint()`: não criar contêiner de armazenamento nem contexto Spring próprios); `features/account/PrivacyTab.test.tsx`.

### Reuso

`TwoFactorService.confirm`, `backupCodesRemaining`, `Totp`, `SecretCipher`, `AccountProfile.requireAccess`, `AccountTransactions`, `ScopedAudit`, `AccountAudit`, `DeviceLabel`, `LoginAttempts.normalize`, `TwoFactorSetupDialog`, `CodeField`, `Modal`, `states`, `useReloadSession`.

### Riscos

- Política nova de RLS: não pode abrir linha de outra conta nem permitir escrita. Prova: `AccountDataExportIT` com o papel operacional, conferindo no escopo da conta A que as tabelas das novas políticas não mostram linhas de B e que `update` não alcança; rodar `AccountLinksIsolationIT` e `TwoFactorIsolationIT`.
- Trocar o segredo antes da confirmação trancaria a pessoa fora da conta (CA1, CA3).
- `login_attempt` é ligado por e-mail: sem o corte de data, quem herdasse um e-mail veria acessos do dono anterior (CA8).
- IT com `Clock` fixo: `account.created_at` vem do banco; o teste grava as datas que o corte compara. O IT avança o relógio entre o código atual e o do app novo e o login.
- Referências visuais que mudam: `conta-privacidade` e `conta-codigos-reserva` (fundo, se mudar). `conta` (duas etapas desligadas) não deve mudar.

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

Duas sessões de construção: parte A (T1 e T2, back-end e contrato) e parte B (T3 a T6, interface). Mesmo item, um PR. O PR traz `Closes #764` e `Closes #630`.

- [x] T1: V63 (colunas do pendente), `replace` e `confirmReplace`, rotas, contagem na sessão, contrato das duas rotas e de `backupCodesRemaining`, `TwoFactorReplaceIT` — cobre CA1 a CA5 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=TwoFactorReplaceIT -Djacoco.skip=true`
- [x] T2: políticas de leitura na V63, `getAccountFile` (com caso no `S3FileStorageIT`), serviço e rota do download, contrato, `AccountDataExportIT` — cobre CA7, CA8, CA9 — prova: o mesmo comando com `-Dit.test='AccountDataExportIT,S3FileStorageIT,AccountLinksIsolationIT,TwoFactorIsolationIT'` e `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`
- [x] T3: MSW da troca e da contagem, tipo da sessão, contagem, "Trocar de aparelho" e a janela, com testes (axe nos dois temas) e casos no `twofactor.msw.test.ts` — cobre CA6, CA11 — prova: em `frontend/`, `npm test -- TwoFactorDialogs AccountPage twofactor.msw telasCanvas419`
- [x] T4: MSW do download, botão em Privacidade, `PrivacyTab.test.tsx` (preparando, sucesso, erro, 403, portal, axe nos dois temas) e caso no `account.msw.test.ts` — cobre CA10, CA11 — prova: em `frontend/`, `npm test -- PrivacyTab AccountPage account.msw telasCanvas419`
- [x] T5: e2e dentro da moldura: em `duas-etapas.spec.ts`, trocar de aparelho a partir de Segurança com a contagem visível; em `minha-conta.spec.ts`, baixar o arquivo (evento de download); os dois sem rolagem horizontal a 360 px — cobre CA6, CA10, CA11 — prova: em `frontend/`, `npm run e2e:full -- duas-etapas minha-conta` e `npm test -- shell.test noInternalAnchors routePattern`
- [x] T6: casos visuais `conta-seguranca-ligada` e `conta-trocar-aparelho` (conta `duas@exemplo.com`, a segunda no passo de senha e código), referências desses, de `conta-privacidade` e de `conta-codigos-reserva`; capturas em `.capturas/764/` (1440 e 390 px, pt-BR, claro e escuro) desses casos e de `conta` e `conta-celular`, com o canvas `MinhaConta` e `GMConta` (`node scripts/canvas-shot.mjs`); divergências em "Construção" e a linha `Comparação com o canvas: <min>` — cobre CA11 — prova: em `frontend/`, `npm run test:visual:docker -- --update-snapshots -g "conta-seguranca-ligada|conta-trocar-aparelho|conta-privacidade|conta-codigos-reserva"` e `npm run visual:canvas`

## 6. Decisões

- D1 (muda o comportamento): o segredo anterior vale até o código do app novo ser confirmado (D7 da #630). O pedido pendente vale 10 minutos, para não ficar um segredo confirmável sem prazo; vencido, recomeça pela senha. Alternativa descartada: pendente sem validade.
- D2 (muda o comportamento): o "código atual" aceita o do app ou um código de reserva, como em desligar e na troca de e-mail (RN-ACE-18: é o caminho de quem perdeu o aparelho). O de reserva usado é gasto e a contagem cai em 1; "os códigos de reserva não mudam" quer dizer que a troca não gera nem invalida os demais. Alternativa descartada: só o código do app, que trancaria quem perdeu o celular.
- D3 (muda o comportamento): quem é obrigado a ter duas etapas também troca de aparelho. A troca não encerra sessões nem envia e-mail (a especificação não pede). Código do app novo errado não conta na trava, como na ativação; senha e código atual contam.
- D4: o arquivo é um JSON (issue; D9 da #630). A foto vai embutida em base64: URL assinada vence em 5 minutos e carrega assinatura, que o arquivo não pode ter.
- D5 (muda o comportamento): "vínculos" são todos os da conta, também encerrados e pendentes, com a situação, porque o arquivo é a cópia dos dados registrados; a tela Meus vínculos continua só com os ativos. Não entram alunos ligados nem o aluno de cada aceite: dados de aluno são da #117 (D2 da #630).
- D6 (muda o comportamento): "consentimentos" são os aceites de termos e as confirmações de modalidade feitos pela conta (só tipo, evento, versão, organização e data), a preferência de comunicados por e-mail dos vínculos de portal e o consentimento do diretório de professor. "Acessos" são as tentativas de login (data, resultado, IP mascarado) e as sessões ainda registradas (aparelho, datas, IP mascarado). IPv4 perde o último número; IPv6 fica com o prefixo /48 (RN-ACE-25). O aparelho vai como o rótulo de hoje, não o texto bruto do navegador.
- D7 (muda o comportamento): como `login_attempt` guarda só o e-mail, entram apenas as tentativas do e-mail atual a partir da criação da conta e da última troca de e-mail confirmada; as do e-mail antigo ficam de fora. Alternativa descartada: incluir sem corte, que poderia entregar acessos de outra pessoa que usou o mesmo endereço.
- D8: o download é auditado só na organização ativa (D5 da #630). A troca de aparelho segue os outros eventos de duas etapas (`AccountAudit`, como ativar e desligar).
- D9 (muda o comportamento): o download exige vínculo de gestão ativo; sessão sem vínculo escolhido também recebe 403, como no Perfil (D6 da #763). Conta que também é responsável recebe na gestão o arquivo da conta.
- D10: a leitura das organizações que não são a ativa usa políticas só de leitura no escopo da conta, o padrão das V8, V55, V60 e V61. Isso confirma a suposição da #630 sobre `teacher.directory_consent`. Alternativa descartada: abrir o contexto de cada organização dentro da requisição.
- D11: os canvas `MinhaConta` e `GMConta` não têm "Trocar de aparelho", a contagem nem a janela de troca: o acréscimo vem da RF-ACE-04 e da decisão 24, com os componentes base. Os casos novos não declaram `canvas` nem `limiteCanvas`; a comparação é feita nas capturas.
- Suposição: não há outro caminho que troque `account.email` além da confirmação em `EmailChangeService` (o único `update` encontrado). Se houver, o corte da D7 precisa considerá-lo.

## Construção

Parte A (T1 e T2, back-end e contrato) e parte B (T3 a T6, interface) feitas em 27/11/2026, em duas sessões. As notas "parte A" abaixo valem para a primeira.

- T1 — arquivos: `V63__two_factor_replace_and_data_export.sql` (colunas do pendente), `TwoFactorService.java`, `TwoFactorController.java`, `SessionService.java`, `docs/openapi.yaml` (duas rotas e `backupCodesRemaining`), `TwoFactorReplaceIT.java` (novo), `TwoFactorServiceIT.java` e `TwoFactorGateIT.java` — prova: `verify -Dit.test='TwoFactorReplaceIT,TwoFactorServiceIT,TwoFactorGateIT'` (com as opções do AGENTS.md) → 12 testes, 0 falhas.
- T2 — arquivos: `V63` (cinco políticas só de leitura), `FileStorage.java`, `S3FileStorage.java`, `S3FileStorageIT.java`, `AccountDataExport.java`, `AccountDataExportController.java`, `docs/openapi.yaml` (`GET /auth/data-export` e `AccountDataExport`), `AccountDataExportIT.java` (novo) — prova: `verify -Dit.test='AccountDataExportIT,S3FileStorageIT,AccountLinksIsolationIT,TwoFactorIsolationIT'` → 16 testes, 0 falhas; `test -Dtest='OpenApiContractTest,ContractRoutesTest'` → 7 testes, 0 falhas.

Testes do item (parte A): os ITs e o contrato acima, todos verdes. `lint` e `typecheck` do front não rodaram: nenhum arquivo do front mudou nesta parte.
Desvios:
- `TwoFactorServiceIT` e `TwoFactorGateIT` comparam o JSON exato de `twoFactor`; as três asserções ganharam `backupCodesRemaining` (fora da lista de arquivos do plano).
- No arquivo baixado, o IPv4 mascarado sai com três números (`203.0.113`), sem completar com zero; endereço IPv4 escrito como IPv6 (`::ffff:a.b.c.d`) segue a regra do IPv4.
- `MigrationIT` não foi mudado nem rodado nesta fase (fica para o CI).
- O MSW ainda não tem as três rotas nem `backupCodesRemaining`: é T3 e T4.

### Parte B (interface)

Caminhos em `frontend/`.

- T3 — arquivos: `src/features/account/TwoFactorSection.tsx`, `src/features/auth/TwoFactorSetupDialog.tsx`, `src/features/auth/SessionProvider.tsx`, `src/i18n/pt-BR.json`, `src/mocks/handlers.ts`, `TwoFactorDialogs.test.tsx`, `AccountPage.test.tsx`, `src/mocks/twofactor.msw.test.ts` — prova: `npm test -- TwoFactorDialogs AccountPage twofactor.msw telasCanvas419 PrivacyTab account.msw` (junto com a da T4) → 6 arquivos, 201 testes, 0 falhas.
- T4 — arquivos: `src/features/account/PrivacyTab.tsx`, `PrivacyTab.test.tsx` (novo), `src/mocks/handlers.ts`, `src/mocks/account.msw.test.ts`, `AccountPage.test.tsx` (o caso "#762 CA9" da gestão saiu; a gestão é provada em `PrivacyTab.test.tsx`) — prova: o comando acima.
- T5 — arquivos: `e2e/duas-etapas.spec.ts`, `e2e/minha-conta.spec.ts` — prova: `npm run e2e:full -- duas-etapas minha-conta` → 8 passaram; `npm test -- shell.test noInternalAnchors routePattern telasCanvas tokens` → 12 arquivos, 607 testes, 0 falhas. Segue o padrão de rotas e telas (nenhuma rota nova).
- T6 — arquivos: `visual/casos.ts` e as referências abaixo — prova: `npm run test:visual:docker -- --update-snapshots --workers=2 -g "conta-seguranca-ligada|conta-trocar-aparelho|conta-privacidade|conta-codigos-reserva"` → 16 passaram; `npm run visual:canvas` → 164 comparadas, 0 reprovadas.

Testes do item (parte B): os comandos acima, verdes; `npm run lint` e `npm run typecheck` sem erros; `npm test -- casos comparar` → 182 testes, 0 falhas; `npm test -- src/mocks/msw.test.ts` → 6 testes, 0 falhas. O back-end não mudou nesta parte. Regressão não rodou (é da verificação).

Referências visuais: alteradas `conta-privacidade` (botão ligado) e `conta-codigos-reserva` (fundo com contagem e "Trocar de aparelho"); novas `conta-seguranca-ligada` e `conta-trocar-aparelho`; cada uma em 1440 e 390 px, claro e escuro (16 arquivos em `frontend/visual/referencias/`). `conta` não mudou.

Capturas em `.capturas/764/`: `<caso>-<1440|390>-sistema.png` e `<caso>-escuro-<1440|390>-sistema.png` de `conta-seguranca-ligada`, `conta-trocar-aparelho`, `conta-privacidade`, `conta-codigos-reserva`, `conta` e `conta-celular` (cópias das referências do teste visual; as de `conta` e `conta-celular` são as commitadas, sem mudança neste item); `conta-1440-canvas.png` (`MinhaConta`) e `conta-celular-390-canvas.png` (`GMConta`).

Comparação com o canvas (abertas nesta fase: segurança ligada 1440 e 390 escuro, janela de troca 390, privacidade 1440, códigos de reserva 1440, `conta` 1440 e `conta-celular` 390, estas duas com o canvas): a divergência deste item é a esperada na D11 (o canvas não tem a contagem, "Trocar de aparelho" nem a janela de troca; usados os componentes base). As demais diferenças para `MinhaConta` e `GMConta` (abas, subtítulo, cartão de e-mails, linhas Perfil e Privacidade, dados do mock) são das telas já entregues na #762 e não mudaram aqui.

Desvios (parte B):
- MSW: as respostas de aceitar convite, redefinir senha e trocar de vínculo passaram a sair por `sessionView`, para toda sessão trazer `backupCodesRemaining`, obrigatório no contrato.
- A contagem só aparece quando a sessão traz o campo (opcional só no tipo, como no plano).
- Na janela de troca, o indicador de passos só aparece a partir do QR (o passo da senha não é um dos passos).
- As provas das T3 e T4 rodaram num comando só.

Docker: o teste visual usou a imagem `mcr.microsoft.com/playwright:v1.64.1-noble`; o script remove só a que ele mesmo baixa, e há uma imagem do Playwright na máquina depois da prova (nenhum contêiner dela ficou).

## Verificação

### Rodada 1 — OK — 27/11/2026, estado 03cfb5a14acb17fa31bfbe8b9021c6586b06f91d

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `TwoFactorReplaceIT.replacesOnlyAfterConfirmation` (login antes e depois, repetição do código, reserva e `enabled_at` iguais, auditoria) |
| CA2 | PASSOU | `TwoFactorReplaceIT.wrongCredentialsCountInTheLock` (401 com os dois códigos de erro, 5 tentativas gravadas, 429, nada muda) |
| CA3 | PASSOU | `TwoFactorReplaceIT.statesAndIsolation` (401, CSRF 403, 409, vencido, pedido substituído, conta B intacta) |
| CA4 | PASSOU | `TwoFactorReplaceIT.everyProfileReplaces` (Coordenador, Administrador obrigado, Aluno) |
| CA5 | PASSOU | `TwoFactorReplaceIT.remainingBackupCodes` (10, 9, 8, uso por outra conta, 10); 0 desligadas também em `TwoFactorServiceIT` e `TwoFactorGateIT` |
| CA6 | PASSOU | `AccountPage.test.tsx` e `TwoFactorDialogs.test.tsx` (casos "issue 764"), no `npm test`; e2e de `duas-etapas.spec.ts` |
| CA7 | PASSOU | `AccountDataExportIT.bringsTheWholeAccount` (três papéis, duas organizações, foto embutida e arquivo ausente) |
| CA8 | PASSOU | `AccountDataExportIT.nothingElse`, `rowLevelSecurity` e `masksAddresses` |
| CA9 | PASSOU | `AccountDataExportIT.accessAndAudit`; id enviado na consulta é ignorado (`nothingElse`) |
| CA10 | PASSOU | `PrivacyTab.test.tsx`; e2e de `minha-conta.spec.ts` salva `meus-dados-ctcore.json` |
| CA11 | PASSOU | e2e a 360 px dentro da moldura; axe nos dois temas (`AccountPage.test.tsx`, `TwoFactorDialogs.test.tsx`, `PrivacyTab.test.tsx`); casos em `visual/casos.ts`; `twofactor.msw`, `account.msw` e testes de rotas no `npm test`; capturas abertas nesta rodada |

Comandos:
- `mvnw test` → 160 testes, 0 falhas (inclui o teste de contrato).
- `mvnw verify -Dit.test='TwoFactorReplaceIT,TwoFactorServiceIT,TwoFactorGateIT,AccountDataExportIT,S3FileStorageIT,AccountLinksIsolationIT,TwoFactorIsolationIT' -Djacoco.skip=true` (com as opções do AGENTS.md) → 28 testes, 0 falhas.
- `npm run lint`, `npm run typecheck`, `npm run build` → saída 0; `npm test` → 278 arquivos, 3163 testes, 0 falhas.
- `npm run e2e:full -- duas-etapas minha-conta` → 8 passaram.
- Visual: no CI do PR. `mvnw verify` completo (com `MigrationIT`), `e2e` inteiro, `test:cov`, gitleaks e OSV: no CI.

Capturas: as de `.capturas/764/` foram abertas (as `-sistema` são idênticas às referências do teste visual). Contra `MinhaConta` e `GMConta`, a diferença deste item é a da D11 (contagem, "Trocar de aparelho" e janela, que o canvas não tem); as demais são de telas que este item não mudou.

RLS da V63: as políticas novas são só `for select`. Nos usos de `forAccount` conferidos, as consultas filtram por conta, vínculo ou id; `CriticalActionGuard.consume` e a leitura das duas etapas do Coordenador em `OrganizationProfile` rodam fora da transação da organização.

Instáveis: nenhum.

Achados:
- nenhum obrigatório.
- sugestão, código, `frontend/src/features/auth/TwoFactorSetupDialog.tsx` (`requestReplace`) — um 401 de sessão expirada (diferente de senha ou código errado) cai no erro genérico com "Tentar de novo"; `PrivacyTab` relê a sessão nesse caso.
- sugestão, código, `frontend/src/features/account/AccountPage.test.tsx` (caso de axe das abas) — a sessão do caso não traz `backupCodesRemaining`, então a linha da contagem não passa pelo axe desse teste.

## Entrega

O que muda: troca de aparelho com confirmação em duas etapas (`TwoFactorService`, `TwoFactorController`, `SessionService`; migração `V63`, com as colunas do pedido pendente e cinco políticas só de leitura para a exportação), `GET /auth/data-export` (`AccountDataExport`, `AccountDataExportController`, `FileStorage`/`S3FileStorage`), contrato `docs/openapi.yaml` (duas rotas de troca, `backupCodesRemaining` e `AccountDataExport`), interface da aba Segurança (contagem de códigos de reserva, janela "Trocar de aparelho" sobre `TwoFactorSetupDialog` com a prop `replace`) e da aba Privacidade ("Baixar meus dados" com `<a download>` criado no código), MSW, i18n, e2e e casos visuais.

Verificação: rodada 1 OK, estado `03cfb5a14acb17fa31bfbe8b9021c6586b06f91d`; desde então só este arquivo mudou. Entrega: a base `dev` não avançou desde a verificação, então a regressão não foi rodada de novo. Visual e a suíte completa ficam para o CI.

Decisões: a janela de troca e a contagem não estão no canvas `MinhaConta`/`GMConta` (D11); usados os componentes base, sem `limiteCanvas`. Desvios de construção estão na seção "Construção".

Limitações: `MigrationIT`, `mvnw verify` completo, `e2e` inteiro, `test:cov`, visual por caso e OSV/gitleaks ficam para o CI do PR.

Fecha a #764 e a #630 (item-mãe dividido em #762 a #764).
