# 763 — 630b · Minha conta › Perfil: nome, telefone e foto da conta

Origem: issue #763, parte b da #630 (RF-ACE-04, RNF-56, RN-ORG-03; decisão 24 de `docs/auditoria/decisoes-canvas.md`). Divisão e plano de partida em `specs/itens/630-minha-conta-abas.md`. Branch: `item/763-minha-conta-perfil`.

Tempos: especificar 4 · construir 23 · verificar 14 (regressão 12) · entregar 3 (1 rodada)
Comparação com o canvas: 3

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Na gestão, a aba Perfil passa a permitir que a pessoa altere o nome e o telefone/WhatsApp da própria conta e envie, troque ou remova a foto, que aparece no avatar do topo (gestão e portal). Os valores são da conta e valem em todas as organizações. Vai antes da #636 e da #764.

Fora do escopo: "Trocar de aparelho", contagem de códigos e "Baixar meus dados" (#764); cadastro de Professor, responsável e aluno (nome, telefone e foto deles não mudam); edição pelo portal; Perfil de professor (#632); apagar a foto da conta na anonimização ou desativação (LGPD).

## 2. Requisitos

- R1: na gestão, a aba Perfil altera o nome (obrigatório) e o telefone/WhatsApp (opcional) da conta da sessão; o valor vale em todas as organizações da conta e a mudança vai para a auditoria (D1, D2, D3).
- R2: na gestão, a aba Perfil envia, troca e remove a foto da conta (JPG, PNG ou WebP, cortada em quadrado no navegador, 512 x 512, até 5 MB), guardada em pasta própria da conta e lida por URL temporária assinada; a mudança vai para a auditoria (D3, D4).
- R3: a foto da conta aparece no avatar do topo no lugar das iniciais, na gestão e no portal, em qualquer organização da conta; sem foto, ou com a imagem inacessível, aparecem as iniciais (D5).
- R4: as rotas agem só sobre a conta da sessão, não recebem id e recusam sem sessão, sem vínculo de gestão ativo e entrada inválida, sem mudar nada; no portal o Perfil continua só com Meus vínculos (D6, D7).

## 3. Critérios de aceite

- CA1 (R1): dada uma conta com vínculos de gestão nas organizações 1 e 2, quando salva nome e telefone com a 1 ativa, então a resposta e o `GET /auth/session` com a 2 ativa trazem os novos valores (telefone só com dígitos; vazio apaga), há um registro `account.profile_updated` só na organização 1, com o nome anterior e o novo e o telefone só como "alterado"; salvar sem mudança não audita; os cadastros `teacher`, `guardian` e `student` ligados à conta não mudam.
- CA2 (R1, R4): dado nome ausente, vazio, só com espaços ou com mais de 120 caracteres, ou telefone inválido, quando salva, então 422 com o campo (`name` ou `phone`) e nem a conta nem a auditoria mudam.
- CA3 (R2): dado um PNG, JPEG ou WebP de 512 x 512 e até 5 MB, quando envia, então a foto fica em `account/<id da conta>/`, `account.photoUrl` da sessão é uma URL assinada que devolve os mesmos bytes (também com a outra organização ativa) e há `account.photo_updated` na organização ativa, sem nome de arquivo nem URL; trocar apaga o arquivo anterior; remover apaga o arquivo, esvazia `photoUrl` e grava `account.photo_removed`; remover sem foto responde 200 sem auditar.
- CA4 (R2, R4): dado arquivo ausente, vazio, de outro tipo (mesmo com nome ou tipo declarado de imagem), corrompido, acima de 5 MB ou fora de 512 x 512, quando envia, então 422 com o campo `file`, a foto anterior permanece e nada é auditado.
- CA5 (R4): dadas as três rotas, então sem sessão 401, sem CSRF 403, com vínculo de Aluno ou Responsável ativo ou sem vínculo ativo 403, e Coordenador, Administrador e Professor podem; um id ou e-mail de outra conta no corpo é ignorado, e as escritas de A não mudam nome, telefone, foto nem arquivo de B.
- CA6 (R3): dada uma conta com foto, quando abre uma tela da gestão ou do portal, então o avatar do topo (e o do cartão da lista do celular da gestão) mostra a foto; depois de enviar ou remover na aba Perfil, o topo muda sem recarregar (removida, voltam as iniciais); se a imagem falha, aparecem as iniciais e a sessão é relida no máximo uma vez, sem laço.
- CA7 (R1, R2, R4): dada a aba Perfil na gestão, então mostra a foto (ou iniciais) com "Enviar foto" ou "Trocar foto" e "Remover foto", e o formulário com nome e telefone preenchidos e "Salvar", acima de Meus vínculos; durante o envio os botões ficam desabilitados; sucesso é avisado; 422 aparece no campo ou aviso correspondente sem perder o digitado; falha e 403 mostram aviso; arquivo de tipo ou tamanho errado é recusado antes do corte; no portal só há Meus vínculos.
- CA8 (R1, R2, R3): dada a aba Perfil, então a 360 px não há rolagem horizontal, o axe passa nos dois temas, os casos visuais `conta-perfil` e `conta-aluno-perfil` cobrem as duas áreas, as telas com canvas mexidas (`MinhaConta` e `GMConta`) são comparadas em 1440 e 390 px, pt-BR, com capturas em `.capturas/763/`; segue o padrão de rotas e telas.

## 4. Plano técnico

- Dados: `backend/src/main/resources/db/migration/V62__account_photo.sql` (a criar): `alter table account add column photo text` (nome do arquivo, não a URL; reversão manual no comentário). `account.phone` já existe (V6) e `account.name` aceita nulo. `account` não tem RLS: a barreira é o filtro por `id` da sessão. Sem tabela nova, sem seed.
- API (`docs/openapi.yaml`): `PUT /auth/profile` `{ name, phone? }`, `PUT /auth/profile/photo` (multipart, campo `file`) e `DELETE /auth/profile/photo`; as três com sessão e CSRF, respondem 200 com `SessionView`; erros 401, 403, 422 (`UNPROCESSABLE` com `fields`), 415 no envio com outro Content-Type e 400 para JSON malformado. `AccountView` ganha `phone` e `photoUrl` (nulos permitidos), em toda resposta `SessionView`.
  - Nome: sem espaços nas pontas, 1 a 120 caracteres. Telefone: `NewUnit.phone("phone", ...)`, trocando o 400 por 422 como em `PortalProfile`. Foto: `LogoImage.parse`, com a recusa em 422. Em `ApiExceptionHandler.tooLarge`, `/auth/profile/photo` também responde 422.
  - Serviço novo `AccountProfile`: confere `role != null && role.management()` (senão `AccessDeniedException`, antes de ler o arquivo ou o corpo); grava numa transação de `OrganizationTransactions` com `select ... for update` da própria conta e `AuditService` (entidade `account`, ator `ACCOUNT`), como em `TeacherWrite`. Auditoria: `name` antigo e novo; `phone` como "alterado"; `photo` como "informada" ou nulo.
  - Foto, na ordem de `TeacherWrite.replacePhoto`: valida, grava `photo-<uuid>.<ext>` (gerado no servidor), atualiza a conta; se a transação falhar apaga o novo; depois apaga o anterior (falha ao apagar só vai para o log).
- Armazenamento: `FileStorage` ganha `putAccountFile(accountId, name, content, contentType)`, `accountFileUrl(accountId, name)` e `deleteAccountFile(accountId, name)`, chave `account/<accountId>/<nome>`, com `checkName` e `checkSize`; os métodos por organização não mudam. `accountFileUrl` só assina (sem `headObject`), para armazenamento fora do ar não derrubar `GET /auth/session` nem o login. O `accountId` vem sempre da sessão.
- Interface:
  - `ProfileTab.tsx` (a criar): cartão da foto no molde de `PortalPhoto` (`input type=file`, `checkLogoFile`, `LogoCropDialog` com `labels`) e cartão com `Field`/`Input` (nome), `PhoneField` (telefone) e "Salvar". Cada resposta vai para `setSession`, o que atualiza o topo. `PhoneField` não recebe erro do servidor: o 422 de `phone` vai num `Banner`; o de `name`, no campo. Sem carga própria: carregando e erro são os da sessão; vazio é conta sem foto (iniciais) e sem telefone (campo vazio); sem permissão é o aviso do 403.
  - `AccountPage`: `perfil` vira `ProfileTab` + `MyLinks` na gestão; no portal continua `MyLinks`.
  - `Avatar` (`components/ui/avatar.tsx`): prop opcional `photoUrl` e `onPhotoError`; com URL, `img` redonda `object-cover` nos mesmos tamanhos e com o mesmo nome acessível; na falha, volta às iniciais (uma URL nova tenta de novo).
  - `useAccountPhoto` (em `useAccount.ts`): devolve `photoUrl` da sessão e `onPhotoError`, que relê a sessão com `useReloadSession` uma vez por montagem e engole a falha. Usado por `ManagementShell` e `PortalShell`, que passam as duas props a `UserMenu` e `PortalAccount`, e por `AccountMenuList`.
  - `SessionView.account` (tipo em `SessionProvider.tsx`) ganha `phone?` e `photoUrl?`.
  - Textos novos em `pt-BR.json` (`account.profile.*`). Em `features/account`, comentário não usa `#` antes de número (o teste `telasCanvas419` lê como cor).
  - MSW (`handlers.ts`): as três rotas, com 401, 403 no portal e 422 por campo, devolvendo a sessão com os novos valores (a foto vira a `MOCK_LOGO`), sem alterar o objeto inicial compartilhado.
- Segurança: nenhuma rota recebe id; o corpo só lê `name` e `phone`. Foto validada pelos bytes, nome gerado no servidor, URL assinada com a expiração padrão (5 min). Permissão no servidor; teste de isolamento entre contas e perfis. A auditoria fica só na organização ativa (RN-ORG-01), sem telefone, URL ou nome de arquivo. Testes e mocks só com dados fictícios.
- Arquivos a alterar (vistos no repositório; em `backend/src/main/java/br/com/ctcore/`): `storage/FileStorage.java`, `storage/S3FileStorage.java`, `identity/SessionService.java` (`AccountView`, `view`, construtor), `api/error/ApiExceptionHandler.java` (`tooLarge`); `backend/src/test/java/br/com/ctcore/storage/S3FileStorageIT.java`; `docs/openapi.yaml`. Em `frontend/src/`: `features/account/AccountPage.tsx`, `AccountPage.test.tsx`, `AccountMenuList.tsx`, `useAccount.ts`, `features/auth/SessionProvider.tsx`, `components/ui/avatar.tsx`, `components/layout/UserMenu.tsx`, `UserMenu.test.tsx`, `features/permissions/ManagementShell.tsx`, `features/portal/PortalAccount.tsx`, `PortalShell.tsx`, `i18n/pt-BR.json`, `mocks/handlers.ts`, `mocks/account.msw.test.ts`; `frontend/visual/casos.ts` (só se um caso precisar mudar) e `frontend/e2e/minha-conta.spec.ts`.
- Arquivos a criar: `V62__account_photo.sql`; `identity/AccountProfile.java`; `identity/AccountProfileController.java`; `backend/src/test/java/br/com/ctcore/identity/AccountProfileIT.java` (sobre `AuthBase`, com o contêiner `chrislusf/seaweedfs:3.80` declarado como em `OrganizationBase`); `frontend/src/features/account/ProfileTab.tsx` e `ProfileTab.test.tsx`. Cerca de 28 arquivos contáveis, dentro do limite de 30; se passar, aplicar a regra de tamanho do `AGENTS.md`.
- Reuso: `LogoImage`, `NewUnit.phone`, `OrganizationTransactions`, `AuditService`, `LogoCropDialog`, `checkLogoFile`/`LOGO_TYPES`, `PhoneField`, `formatPhone`/`isValidPhone`, `api` com `FormData` (como `uploadTeacherPhoto`), `useReloadSession`, `MyLinks`, `Card`, `Banner`.
- Riscos: falha ao assinar a URL ou armazenamento fora do ar quebrar a sessão (por isso só assinar; provado no IT de sessão com foto); URL vencida ao remontar a moldura (iniciais e uma releitura, CA6); laço de releitura com armazenamento quebrado (teste do "uma vez"); `SessionService` ganha dependência de `FileStorage` (rodar os testes rápidos); a referência visual `conta-perfil` muda; a moldura só muda de aparência com foto, então as outras referências não devem mudar.

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

Duas sessões de construção: parte A (T1 e T2, back-end e contrato) e parte B (T3 a T6, interface). Mesmo item, um PR.

- [x] T1: pasta de conta no `FileStorage`/`S3FileStorage`, com caso no `S3FileStorageIT` (chave `account/<id>/`, leitura pela URL, apagar, nome que escapa da pasta) — cobre CA3 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=S3FileStorageIT -Djacoco.skip=true`
- [x] T2: `V62`, `AccountProfile` e controller, `phone` e `photoUrl` na sessão, 422 no arquivo grande, contrato e `AccountProfileIT` (CA1 a CA5; o limite do multipart é conferido pelo tratamento da exceção ou pelo tamanho em `LogoImage`) — cobre CA1 a CA5 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=AccountProfileIT -Djacoco.skip=true` e `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`
- [x] T3: foto no `Avatar`, `useAccountPhoto`, topo da gestão e do portal e cartão da lista do celular, com os testes em `UserMenu.test.tsx` (foto, falha volta às iniciais) e em `AccountPage.test.tsx` (releitura uma só vez, lista do celular) — cobre CA6 — prova: em `frontend/`, `npm test -- UserMenu AccountPage PortalShell PortalAccount avatar`
- [x] T4: MSW das três rotas, tipo da sessão, `ProfileTab` com textos, ligada ao `AccountPage`, com `ProfileTab.test.tsx` (inclui axe nos dois temas e o portal sem o formulário) e casos no `account.msw.test.ts` contra o contrato — cobre CA6, CA7, CA8 — prova: em `frontend/`, `npm test -- ProfileTab AccountPage account.msw telasCanvas419`
- [x] T5: e2e da tela dentro da moldura: salvar nome e telefone, enviar foto (PNG fictício gerado no teste), ver no topo, remover, e 360 px sem rolagem horizontal — cobre CA6, CA7, CA8 — prova: em `frontend/`, `npm run e2e:full -- minha-conta` e `npm test -- shell.test noInternalAnchors routePattern`
- [x] T6: visual: referências de `conta-perfil` (e das da conta que mudarem por causa do item); capturas em `.capturas/763/` (1440 e 390 px, pt-BR) de `conta-perfil` e `conta-aluno-perfil` (sistema, sem canvas) e de `conta` e `conta-celular` contra `MinhaConta` e `GMConta`, com divergências em "Construção" e a linha `Comparação com o canvas: <min>` — cobre CA8 — prova: em `frontend/`, `npm run test:visual:docker -- --update-snapshots -g "conta-perfil"` e `npm run visual:canvas`

## 6. Decisões

- D1 (muda o comportamento): nome e telefone da conta não alteram o cadastro de Professor, responsável ou aluno, que têm campos próprios em cada organização (issue; D4 da #630).
- D2 (muda o comportamento): nome com 1 a 120 caracteres, sem os espaços das pontas; folga acima dos 80 do cadastro de Professor porque o convite não limita o nome gravado na conta. Telefone com a regra de telefone brasileiro que o sistema já usa (DDD, fixo ou celular); campo vazio apaga.
- D3: a auditoria fica na organização do vínculo ativo, a única que a requisição pode escrever (D5 da #630); o nome entra com antes e depois, o telefone só como "alterado" e a foto como "informada", como nos cadastros de hoje.
- D4: a foto é da conta, então fica em `account/<id>/`, fora das pastas por organização da RN-ORG-03, que continua valendo para os arquivos das organizações; a leitura segue a regra de URL temporária assinada. Alternativa descartada: rota que devolve os bytes, que contraria a URL assinada.
- D5: como a sessão é lida uma vez e a URL vence em 5 minutos, a imagem que falhar vira iniciais e a sessão é relida uma vez por montagem. Alternativa descartada: URL mais longa ou releitura periódica.
- D6 (muda o comportamento): as três rotas exigem vínculo de gestão ativo. Além do portal (issue), sessão sem vínculo escolhido também recebe 403: o formulário só existe na gestão e a auditoria precisa da organização ativa.
- D7 (muda o comportamento): no portal não há edição, mas a foto que a conta já tiver aparece no avatar do topo (D6 da #630). Responsável ou aluno que também tem vínculo de gestão edita pela gestão.
- D8: valor inválido responde 422 com o campo, como pede a issue, e não o 400 das rotas de foto de Professor e aluno, que não mudam. A leitura da sessão não ganha rota nova: as três respondem a `SessionView`.
- D9: não há canvas da aba Perfil; os cartões seguem os componentes base (decisão 24 e D8 da #762). Os dois canvas da issue são comparados nas telas que os têm (`conta` e `conta-celular`).
- Suposição: o avatar com foto não precisa de referência visual própria; teste de componente e e2e o cobrem. Se o verificador exigir, entra um caso em `casos.ts` com a foto do MSW.

## Construção

Parte A (T1 e T2, back-end e contrato) e parte B (T3 a T6, interface) concluídas.

- T1 — arquivos: `storage/FileStorage.java`, `storage/S3FileStorage.java`, `storage/S3FileStorageIT.java` — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=S3FileStorageIT -Djacoco.skip=true` → 6 testes, 0 falhas.
- T2 — arquivos: `V62__account_photo.sql`, `identity/AccountProfile.java`, `identity/AccountProfileController.java`, `identity/SessionService.java`, `api/error/ApiExceptionHandler.java`, `docs/openapi.yaml`, `identity/AccountProfileIT.java` — prova: o mesmo comando com `-Dit.test=AccountProfileIT` → 7 testes, 0 falhas; `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'` → 7 testes, 0 falhas.
Testes do item (parte A): os das duas linhas acima.
Desvios: as rotas `/auth` não abrem o escopo de organização (`OrganizationScopeFilter`), então o `AccountProfile` o abre com `OrganizationContext.open(who)` antes da transação. Na auditoria da troca de foto, "informada" antes e depois é igual e o `AuditSanitizer` omite o campo; o registro `account.photo_updated` fica, sem nome de arquivo nem URL. O limite do multipart é conferido pelo tamanho em `LogoImage` (o MockMvc não aplica o limite do servidor); o 422 de `ApiExceptionHandler.tooLarge` não tem teste próprio. O `AccountProfileIT` limpa com `truncate ... cascade` antes da limpeza herdada do `AuthBase`.

### Sessão 2 (parte B, interface)

- T3 — arquivos, em `frontend/src/`: `components/ui/avatar.tsx`, `features/account/useAccount.ts` (`useAccountPhoto`), `AccountMenuList.tsx`, `features/permissions/ManagementShell.tsx`, `features/portal/PortalShell.tsx`, `PortalAccount.tsx`, `components/layout/UserMenu.tsx`, `features/auth/SessionProvider.tsx` (tipo da sessão), `UserMenu.test.tsx`, `features/account/AccountPage.test.tsx` — prova: `npm test -- UserMenu AccountPage PortalShell PortalAccount avatar` → 117 testes, 0 falhas.
- T4 — arquivos: `features/account/ProfileTab.tsx` e `ProfileTab.test.tsx` (novos), `AccountPage.tsx`, `AccountPage.test.tsx`, `i18n/pt-BR.json`, `mocks/handlers.ts`, `mocks/account.msw.test.ts` — prova: `npm test -- ProfileTab AccountPage account.msw telasCanvas419 UserMenu` → 177 testes, 0 falhas.
- T5 — arquivo: `frontend/e2e/minha-conta.spec.ts` — prova: `npm run e2e:full -- minha-conta` → 4 passaram; `npm test -- shell.test noInternalAnchors routePattern` → 315 testes, 0 falhas. Segue o padrão de rotas e telas.
- T6 — prova: `npm run test:visual:docker -- --update-snapshots -g "conta-perfil|conta-celular"` → 8 passaram; `npm run visual:canvas` → 164 comparadas, 0 reprovadas (`conta` a 1440: 1,2%). Nenhum caso nem `limiteCanvas` novo. A imagem do Playwright já estava na máquina; nenhuma imagem nova.

Capturas em `.capturas/763/`: `<caso>-<largura>-sistema.png` e `<caso>-escuro-<largura>-sistema.png` (1440 e 390) de `conta`, `conta-celular`, `conta-perfil` e `conta-aluno-perfil`; canvas (só tema claro, uma largura cada): `conta-1440-canvas.png` (MinhaConta) e `conta-celular-390-canvas.png` (GMConta).

Divergências com o canvas: o item não muda a aparência de `conta` nem de `conta-celular` a 390 px (referências intactas); continuam as já registradas na #762 (abas da decisão 24, Perfil e Privacidade a mais na lista do celular, dados do MSW). Os cartões Foto e Seus dados não têm canvas (D9).

Referências visuais: em `frontend/visual/referencias/`, 6 alteradas: `conta-perfil` (as 4) e `conta-celular` a 1440 claro e escuro (a 1440 `/conta` abre o Perfil). `conta-aluno-perfil` não mudou.

Testes do item (depois da última tarefa): `npm test -- ProfileTab AccountPage account.msw telasCanvas419 UserMenu PortalShell PortalAccount avatar casos.test shell.test noInternalAnchors routePattern` → 14 arquivos, 671 testes, 0 falhas; `npm run lint` e `npm run typecheck` → sem erro; `npm run e2e:full -- minha-conta` → 4 passaram; `verify ... -Dit.test='AccountProfileIT,S3FileStorageIT'` → 13 testes, 0 falhas; `OpenApiContractTest,ContractRoutesTest` → 7 testes, 0 falhas.
Regressão: não roda nesta fase.
Desvios (parte B): o cartão da lista do celular recebe só `photoUrl`, sem `onPhotoError`: o avatar do topo está montado junto e faz a única releitura (com os dois relendo seriam duas, contra o CA6). `frontend/visual/casos.ts` não mudou. Nos testes, FormData do jsdom não passa pelo fetch do Node: o `ProfileTab.test.tsx` troca o corpo do envio por texto e dubla o `LogoCropDialog` (o corte real roda no e2e); o `account.msw.test.ts` monta o multipart à mão. Arquivos contáveis do item: 26.

## Verificação

### Rodada 1 — OK — 27/11/2026, estado fc0fe2c6881370de76ffe397302beb87e44de5db

Base: 7036c45a. Especificação conferida com a issue #763: nenhum requisito ficou de fora nem contraria o card.

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `AccountProfileIT.updatesTheAccountEverywhereAndAuditsOnlyTheActiveOrganization` (7/7 no IT) |
| CA2 | PASSOU | `AccountProfileIT.refusesInvalidProfile` |
| CA3 | PASSOU | `AccountProfileIT.uploadsReplacesAndRemovesThePhoto` e `sessionDoesNotReadTheStorage`; `S3FileStorageIT` 6/6 |
| CA4 | PASSOU | `AccountProfileIT.refusesInvalidFiles`; o ramo do limite do servidor (`ApiExceptionHandler.tooLarge`, `max-file-size: 5MB`) foi conferido só por leitura, o tamanho é exercitado em `LogoImage` |
| CA5 | PASSOU | `AccountProfileIT.protectsTheRoutes` e `neverReachesAnotherAccount`; `TwoFactorGateFilter` não libera `/auth/profile` (lido) |
| CA6 | PASSOU | `UserMenu.test.tsx`, `AccountPage.test.tsx` (topo na gestão e no portal; falha da imagem com uma só releitura; lista do celular), `ProfileTab.test.tsx` e e2e "Perfil"; o `userMenu` fica montado no celular (só oculto por CSS) |
| CA7 | PASSOU | `ProfileTab.test.tsx` e e2e "Perfil" (corte real) |
| CA8 | PASSOU | e2e a 360 px sem rolagem; axe nos dois temas (`ProfileTab.test.tsx`, `AccountPage.test.tsx`); casos `conta-perfil` e `conta-aluno-perfil` em `casos.ts`; capturas de `.capturas/763/` abertas e comparadas (`conta` x MinhaConta em 1440, `conta-celular` x GMConta no celular, Perfil em 1440/390 nos dois temas): só as divergências já registradas; os cartões novos usam os componentes base; `shell`, `noInternalAnchors` e `routePattern` verdes no `npm test`; visual: no CI do PR |

Comandos:
- `mvnw test`: 160 testes, 0 falhas.
- `mvnw verify ... -Dit.test=AccountProfileIT,S3FileStorageIT`: 13 testes, 0 falhas.
- `mvnw test -Dtest='OpenApiContractTest,ContractRoutesTest'`: passou.
- `npm run lint`, `npm run typecheck`, `npm run build`: sem erro.
- `npm test`: 3143 de 3144; 1 falha instável fora do item (abaixo).
- `npm run e2e -- minha-conta`: 1/1; `npm run e2e:full -- minha-conta`: 4/4.

Instáveis:
- `src/features/agenda/AgendaPage.test.tsx > AgendaPage > CA15: carregando, vazio, erro com Tentar de novo e sem permissão` (não achou "Carregando...", linha 306): falhou 1 vez no `npm test` e passou em 3 de 3 execuções só do arquivo (`--maxWorkers=2`, 24/24). O item não toca `features/agenda`.

Achados:
- sugestão, código, `frontend/src/mocks/account.msw.test.ts` — o arquivo entra no commit em CRLF (na base e nos demais arquivos do índice é LF), com 5 linhas `\r\r\n` no corpo multipart (linhas 89 a 93; no template literal viram linha em branco a mais). Por isso o diff mostra o arquivo inteiro reescrito (147+/95-) quando só há 52 linhas novas (`git diff --ignore-space-at-eol`). Os CR soltos fazem o Git tratar o arquivo como `-text`, e o `autocrlf` não normaliza. Vale regravar em LF antes do commit (a #764 deve mexer no mesmo arquivo).
- sugestão, código, `backend/src/test/java/br/com/ctcore/storage/S3FileStorageIT.java`, lista de nomes ruins — `"a\b"` em Java é o caractere backspace (recusado como controle), não a barra invertida; para provar a barra, `"a\\b"`.

## Entrega

O que muda: aba Perfil em Minha conta (gestão e portal) com nome, telefone e foto da conta; topo do menu do usuário mostra a foto ou as iniciais; a foto usa o armazenamento de arquivos (migração `V62__account_photo.sql`, endpoint de perfil em `AccountProfileController`, contrato em `docs/openapi.yaml`, handlers MSW e textos em `pt-BR.json`). A sessão não lê o armazenamento.

Verificação: rodada 1 `OK` (estado `fc0fe2c6`), com `AccountProfileIT` 7/7, `S3FileStorageIT` 6/6, testes de front do item e e2e `minha-conta` 1/1 e `e2e:full` 4/4. Visual por caso fica para o CI do PR (comentário de merge).

Decisões que quem lê precisa saber:
- Foto e nomes de perfil seguem a regra de isolamento por organização ativa; o perfil não cruza a conta.
- O limite de 5 MB do servidor (`ApiExceptionHandler.tooLarge`) foi conferido só por leitura; o tamanho é exercitado em `LogoImage`.

Limitações:
- `npm test` teve 1 falha instável fora do item (`AgendaPage.test.tsx`, CA15), que passou em 3 de 3 execuções isoladas; o item não toca `features/agenda`.
- Os achados de sugestão da verificação (CRLF em `account.msw.test.ts` e a barra em `S3FileStorageIT`) ficaram para o dono decidir; não foram alterados nesta entrega.
