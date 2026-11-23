# 609 — RF-ORG-06 · Transferir coordenação: antigo Coordenador sem acesso por padrão, com escolha de unidades e custo

Origem: issue #609 (Sprint 10.5); `docs/especificacao/01-organizacao-e-isolamento.md` (RF-ORG-06, RN-ORG-06, RN-ORG-07), `02-contas-e-acesso.md` (RN-ACE-20), `16-assinatura.md` (RN-ASS-21); ajusta o item #33. Branch: `item/609-transferir-coordenacao`.

## 1. Objetivo

Hoje a transferência (#33) faz o antigo Coordenador virar Administrador de todas as unidades. Pela alteração de 19/11/2026, ele sai sem acesso de gestão, a menos que quem transfere marque as unidades em que ele continua como Administrador; cada unidade marcada é uma vaga paga (R$ 50/mês) e a tela mostra o total antes de confirmar. O item muda o servidor, o contrato, o MSW e a janela de transferência.

Fora do escopo: cobrança real da vaga e tabela de preços do painel (#140); transferência pelo painel da plataforma (#138, que vai reusar o serviço); tela Pessoas › Administradores (RF-ACE-06); convite com custo (RF-ORG-03).

## 2. Requisitos

- R1 (RN-ORG-06): o corpo de `POST /api/v1/organization/coordination-transfer` aceita `keepUnitIds` (lista de ids de unidade, opcional, vazia por padrão); o resto da rota (permissão, reauth, `TRANSFERIR`, alvo Administrador ativo) não muda.
- R2 (RN-ORG-06, D1): cada id de `keepUnitIds` precisa ser de unidade ativa da organização, sem repetição; senão 400 `VALIDATION_ERROR` no campo `keepUnitIds` e nada muda.
- R3 (RN-ORG-06, RN-ACE-20): com `keepUnitIds` vazio, o vínculo do antigo Coordenador é encerrado, ele fica sem vínculo de gestão nesta organização e as sessões abertas nesse vínculo são encerradas, inclusive a de quem transferiu (D4, D5).
- R4 (RN-ORG-06): com unidades marcadas, o antigo passa a ter vínculo ativo de Administrador só nelas (reaproveitando a linha de Administrador já existente da conta, se houver) e as sessões dele continuam válidas.
- R5 (RN-ORG-07, D2): se a troca deixasse unidade ativa sem Administrador ativo, a rota responde 409 `LAST_UNIT_ADMINISTRATOR` com as unidades afetadas e nada muda. Isso ocorre quando o novo Coordenador era o único Administrador de uma unidade que não foi marcada.
- R6 (RN-ASS-21, D3): `GET /api/v1/organization/admin-seat-price` devolve `{ "adminSeatCents": 5000 }`, lido da configuração `ctcore.billing.admin-seat-cents`; só o Coordenador.
- R7 (auditoria): `organization.coordination_transferred` passa a registrar também as unidades mantidas e a quantidade de vagas, sem senha, token nem código; recusas não gravam.
- R8 (RF-ORG-06, RNF-26): a janela de transferência traz a lista de unidades ativas, todas desmarcadas, e o texto "+R$ 50/mês por unidade" com o total em reais atualizado a cada marcação (n × valor do R6).
- R9 (RF-ORG-06): sem unidade marcada, a janela avisa que o antigo Coordenador perde o acesso à gestão; com unidade marcada, mostra o total e que ele segue como Administrador só nelas.
- R10 (R5, D2): na janela, a unidade que o escolhido administra sozinho aparece com aviso de que precisa ser marcada para não ficar sem Administrador; o 409 do R5 também é tratado com mensagem.
- R11 (D5): depois do sucesso sem unidade marcada, a tela leva ao login (sessão encerrada), com aviso de que a coordenação foi transferida; com unidade marcada, a sessão é recarregada como hoje.
- R12: o e-mail de confirmação ao novo Coordenador continua saindo só depois da troca gravada.
- R13: a janela mantém os quatro estados, funciona a partir de 360 px, passa no axe nos dois temas, textos em pt-BR e segue o canvas `TransferirCoordenacao` com a lista de unidades acrescentada.
- R14: OpenAPI e handlers MSW refletem `keepUnitIds`, o 409 e a rota de valor da vaga.

## 3. Critérios de aceite

- CA1 (R3): dado Coordenador A, Administrador B ativo e `keepUnitIds` vazio, quando A transfere, então 204; B é Coordenador; o vínculo de A fica `ENDED`, A não tem vínculo ativo de gestão na organização e a sessão de gestão de A sai (a chamada seguinte dá 401).
- CA2 (R3): dado A com sessão de portal na mesma conta, quando transfere sem unidades, então a sessão do portal segue válida.
- CA3 (R4): dado `keepUnitIds` com duas unidades, então A tem vínculo ativo de Administrador só nessas duas, a sessão de A segue válida e `GET /units/reachable` de A traz só elas.
- CA4 (R4): dado A com linha de Administrador encerrada de antes, quando transfere marcando uma unidade, então a linha é reativada com essa unidade, sem violar a unicidade conta/organização/perfil.
- CA5 (R2): dado id de unidade inativa, de outra organização, inexistente ou repetido, então 400 `VALIDATION_ERROR` em `keepUnitIds` e nenhum vínculo muda.
- CA6 (R5): dado B único Administrador da unidade X e X não marcada, então 409 `LAST_UNIT_ADMINISTRATOR` citando X, nada muda e o token de reauth não é queimado; marcando X, 204.
- CA7 (R5): dado unidade que tem outro Administrador ativo, quando não é marcada, então 204.
- CA8 (R6): dado Coordenador, `GET /organization/admin-seat-price` devolve 200 com 5000; Administrador, Professor e portal recebem 403; sem sessão, 401; com `ctcore.billing.admin-seat-cents` alterado devolve o novo valor.
- CA9 (R7): dado transferência com unidades, então a auditoria traz `keptUnitIds` e `seats`, sem senha, token nem código; recusas (CA5, CA6) não gravam linha.
- CA10 (R1, isolamento): dado A de outra organização, quando manda `keepUnitIds` de unidade da organização alheia, então 400 em `keepUnitIds` e as duas organizações ficam como estavam.
- CA11 (R1): dado chamada sem `keepUnitIds` (clientes antigos), então vale como lista vazia (CA1).
- CA12 (R8): dado a janela aberta, então a lista mostra as unidades ativas sem nenhuma marcada; marcar uma mostra "R$ 50,00/mês", duas "R$ 100,00/mês"; desmarcar volta ao total anterior.
- CA13 (R9): dado nenhuma unidade marcada, então a janela diz que o antigo Coordenador perde o acesso à gestão; com marcação, o texto de custo e de acesso só nas unidades marcadas.
- CA14 (R10): dado escolhido que administra a unidade X sozinho, então X aparece com o aviso; dado 409 do servidor, a mensagem cita as unidades.
- CA15 (R11): dado sucesso sem unidades, então o aplicativo vai para o login com o aviso; dado sucesso com unidades, a janela fecha com aviso e a tela segue na sessão.
- CA16 (R13): dado 360 px e os dois temas, sem rolagem horizontal e sem violações do axe; estados de carregando, erro (nova tentativa) e sem permissão presentes; o caso do teste visual compara com o canvas.
- CA17 (R12): dado troca concluída, então sai um e-mail ao novo Coordenador; dado recusa, nenhum.
- CA18 (R14): `OpenApiContractTest`, `ContractRoutesTest` e o teste do handler MSW passam.

## 4. Plano técnico

- Dados: não muda o esquema. O encerramento usa `account_link.status = 'ENDED'`, `ends_on` e `delete from account_session where active_link_id = :velho`, como `SessionService.endAll` já faz para a conta.
- API: `POST /organization/coordination-transfer` ganha `keepUnitIds`; novos erros 400 (`keepUnitIds`) e 409 `LAST_UNIT_ADMINISTRATOR`. Nova `GET /organization/admin-seat-price` (só Coordenador, `ORGANIZATION_SETTINGS` `FULL`). `CriticalActionGuard.consume` continua depois de todas as validações, inclusive R2 e R5, para não queimar o token numa recusa.
- Interface: `TransferCoordinationDialog` ganha a seção de unidades (checkboxes, todas desmarcadas), texto de custo e de perda de acesso, aviso por unidade (R10) e tratamento do 409; sucesso sem unidades limpa a sessão local e leva a `/entrar` com aviso. A lista de unidades vem de `GET /units` (que já traz `administrators`); o valor da vaga vem da rota nova. Estados: carregando, erro e sem permissão, como já na janela.
- Segurança: Coordenador apenas, no servidor; `keepUnitIds` resolvidos só dentro da organização (RLS e filtro); mesma mensagem de recusa para unidade alheia e inexistente; valor da vaga não é segredo; auditoria sem senha, token ou código. Sem dado pessoal novo.
- Arquivos (vistos no repositório):
  - `backend/src/main/java/br/com/ctcore/organization/CoordinationTransfer.java`: `transfer` recebe `keepUnitIds`; novo passo de validação de unidades e de RN-ORG-07 antes de `guard.consume`; `swap` troca "Administrador de todas as unidades" por encerrar o vínculo (sem unidades) ou `becomes(..., "ADMINISTRATOR")` com só as unidades marcadas; apaga as sessões do vínculo encerrado; auditoria com `keptUnitIds` e `seats`.
  - `backend/src/main/java/br/com/ctcore/organization/OrganizationController.java`: `TransferRequest` ganha `keepUnitIds`; novo `GET /admin-seat-price`.
  - `backend/src/main/java/br/com/ctcore/staff/StaffUsers.java` (linha ~236): só leitura, como modelo do `ApiStatusException` com `LAST_UNIT_ADMINISTRATOR`.
  - `backend/src/main/resources/application.yml`: `ctcore.billing.admin-seat-cents: ${ADMIN_SEAT_CENTS:5000}`.
  - `docs/openapi.yaml` (rota em `/organization/coordination-transfer`, ~linha 392), `frontend/src/mocks/handlers.ts` (~linha 2368), `frontend/src/features/organization/TransferCoordinationDialog.tsx` e `.test.tsx`, `frontend/src/i18n/pt-BR.json` (chaves `organization.transfer.*`), `frontend/visual/casos.ts` (caso da transferência), `frontend/e2e/organizacao.spec.ts`.
  - A criar: `backend/src/test/java/br/com/ctcore/organization/CoordinationTransferKeepUnitsIT.java`.
- Reuso: `CoordinationTransfer.becomes`, `CriticalActionGuard`, `ApiStatusException`, `GET /units`, `SummaryBox`, `Field`, `Modal`, `OrganizationBase` dos ITs.
- Riscos: (a) a sessão de quem transfere é encerrada: o front precisa tratar sem erro genérico (R11); (b) conta que também é Administrador de outra organização: só as sessões do vínculo encerrado saem (D4); (c) a validação do R5 e a troca precisam ler o mesmo estado, então rodam na mesma transação com a organização travada, e o token só é consumido depois de a validação passar (a ordem atual `find` → `consume` → `swap` precisa ganhar a checagem do R5 antes do `consume` e repetida no `swap`); (d) o teste visual da janela muda de imagem: regerar só o caso desta tela e registrar `Visual do CI` no arquivo do item.

## 5. Tarefas

- [x] T1: Servidor: `keepUnitIds` (validação R2), encerramento do vínculo e das sessões sem unidades, vínculo de Administrador só nas marcadas, RN-ORG-07 com 409, auditoria — cobre CA1, CA2, CA3, CA4, CA5, CA6, CA7, CA9, CA10, CA11, CA17 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='CoordinationTransfer*IT'` e `-Dtest=CoordinationTransferTest`
- [x] T2: `GET /organization/admin-seat-price` e configuração `ctcore.billing.admin-seat-cents` — cobre CA8 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=CoordinationTransferKeepUnitsIT`
- [x] T3: OpenAPI e MSW (corpo novo, 409, rota do valor) — cobre CA18 — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'` e `npm test -- organization.msw` (em `frontend/`)
- [x] T4: Janela: unidades desmarcadas, custo, aviso de perda de acesso, aviso por unidade, 409, fim de sessão e aviso no login, textos pt-BR — cobre CA12, CA13, CA14, CA15, CA16 — prova: `npm test -- TransferCoordinationDialog` (em `frontend/`)
- [x] T5: Caso visual e comparação com o canvas `TransferirCoordenacao` (1440 e 390 px, pt-BR, capturas em `.capturas/609/`) — cobre CA16 — prova: `npm run test:visual:docker -- -g "<caso>"` sem `--update-snapshots` e `npm run visual:canvas` (em `frontend/`)
- [x] T6: e2e da transferência dentro da moldura, sem unidade e com unidade; `shell.test.ts`, `noInternalAnchors.test.ts` e `routePattern.test.ts` verdes — cobre CA15 — prova: `npm run e2e -- organizacao` e `npm test -- shell noInternalAnchors routePattern` (em `frontend/`)

## 6. Decisões

- D1: unidade marcável é só a ativa da organização; inativa ou alheia é 400. Motivo: vaga paga é por unidade ativa (RN-ASS-21). Alternativa: aceitar inativas (cobraria vaga sem uso).
- D2 (muda o comportamento): se a troca deixa unidade sem Administrador (o novo Coordenador, que perde os vínculos de unidade por #33 D4, era o único), a rota recusa com 409 `LAST_UNIT_ADMINISTRATOR` e a tela avisa e indica marcar a unidade, em vez de marcar sozinha. Motivo: RN-ORG-07 vale para toda ação e "nenhuma unidade vem marcada por padrão" (RN-ORG-06). Alternativas: o novo Coordenador manter o vínculo de Administrador (reestrutura o vínculo duplo de #37 D7) ou marcar à força (contraria o padrão).
- D3: o valor da vaga vem de `ctcore.billing.admin-seat-cents` (padrão 5000), exposto em rota própria para a tela e o painel reusarem; sai da configuração quando a #140 existir. Alternativa: texto fixo na tela (o front repetiria o preço).
- D4 (muda o comportamento): sem unidade marcada, só as sessões do vínculo encerrado saem; se a conta tiver gestão em outra organização, aquela sessão continua (RN-ACE-20 fala em "último vínculo de gestão"). Sessão de portal fica. Alternativa: derrubar todas as sessões da conta.
- D5 (muda o comportamento): quem transfere sem unidades também perde a própria sessão e vai ao login. Motivo: RN-ACE-20 pede encerramento na hora.
- D6: o antigo não recebe e-mail novo; o e-mail ao novo Coordenador não muda. Aviso por e-mail ao antigo fica fora do escopo.
- Suposição: o canvas `TransferirCoordenacao` foi desenhado antes da regra e não tem a lista de unidades; ela segue os componentes base de `docs/design/README.md` e entra como divergência registrada no PR. Se o canvas for atualizado, só a tela muda.
- Suposição: a cobrança real ainda não existe; "vaga" aqui é só o valor mostrado, e o ajuste da fatura entra na Sprint de assinatura.

## Construção

- T1 — arquivos: backend/.../organization/CoordinationTransfer.java (keepUnitIds, checkUnits R2/R5 antes do guard.consume e de novo no swap, endManagement, vínculo de Administrador só nas marcadas, auditoria keptUnitIds/seats), OrganizationController.java (TransferRequest.keepUnitIds); testes: CoordinationTransferBase.java (novo, apoio extraído do CoordinationTransferIT), CoordinationTransferIT.java (ajustado: os testes que exigem o antigo ativo passam unidades), CoordinationTransferKeepUnitsIT.java (novo: CA1, CA2, CA3, CA4, CA5, CA6, CA7, CA9, CA10, CA11, CA17) — prova: compila (`mvnw verify -Dit.test=CoordinationTransfer*IT` chegou a rodar os ITs); `CoordinationTransferTest` 1/1 passou; os ITs NAO rodaram: sem Docker nesta máquina (Testcontainers: "docker-machine executable was not found"). Não rodou: limitação de ambiente; vale o CI do PR (Autonomia 2).
- T2 — arquivos: OrganizationController.java (GET /admin-seat-price, só ORGANIZATION_SETTINGS FULL), application.yml (ctcore.billing.admin-seat-cents), teste seatPrice no CoordinationTransferKeepUnitsIT — prova: IT não rodou (sem Docker); vale o CI do PR.
- T3 — arquivos: docs/openapi.yaml (keepUnitIds, 409, nova rota), frontend/src/mocks/handlers.ts (keepUnitIds, 400, 409, fim da sessão sem unidades, rota do valor), frontend/src/mocks/organization.msw.test.ts — prova: `mvnw test -Dtest=OpenApiContractTest,ContractRoutesTest,CoordinationTransferTest` → 8 passaram; `npx vitest run src/mocks/organization.msw.test.ts` → 11 passaram.
- T4 — arquivos: frontend/src/features/organization/TransferCoordinationDialog.tsx e .test.tsx, features/auth/SessionProvider.tsx (clear(transferred)), features/auth/LoginPage.tsx (aviso), src/i18n/pt-BR.json — prova: `npx vitest run src/features/organization/TransferCoordinationDialog.test.tsx` → 20 passaram (inclui axe a 360 px nos dois temas).
- T5 — arquivos: frontend/visual/referencias/configuracoes-transferir-coordenacao-{1440,390}-{claro,escuro}.png (regeradas só deste caso); capturas em .capturas/609/ (1440 e 390 sistema, 1440 canvas) — prova: `npm run test:visual:docker -- --update-snapshots -g "configuracoes-transferir-coordenacao"` e depois sem `--update-snapshots` → 4 passaram; `npm run visual:canvas` → 167 comparadas, 0 reprovadas. Divergências com o canvas: lista de unidades e textos de custo/perda de acesso (canvas anterior à regra, suposição do item). Sem `limiteCanvas`. Captura do canvas a 390 px não gerada pelo `visual:canvas` (só 1440 claro sai no lado a lado).
- T1/T2 (prova local, com Docker agora): `mvnw verify -Dit.test='CoordinationTransfer*IT' -Dtest=CoordinationTransferTest` → CoordinationTransferIT 10, CoordinationTransferKeepUnitsIT 5, CoordinationTransferTest 1, todos passaram (o ERROR no log é a sonda esperada de atomicidade).
- T6 — arquivos: frontend/e2e/organizacao.spec.ts (novo @critical da transferência dentro da moldura: aviso, 409, custo, sucesso com unidade) — prova: `npx playwright test --grep "transferir coordenação"` → 1 passou; `npm test` inclui shell, noInternalAnchors e routePattern → verdes.
Regressão: front `npm test` → 275 arquivos, 3003 testes passaram; `npm run typecheck` e `npm run lint` limpos. Back: só `OpenApiContractTest`, `ContractRoutesTest`, `CoordinationTransferTest` rodaram; `verify` completo e `test:cov` não rodaram (sem Docker / não pedidos aqui).
Desvios: (1) o e2e cobre a transferência com unidade marcada (e o 409 sem marcar); o caminho sem unidade (fim da sessão, aviso no login) está provado no teste da janela e no teste do MSW, porque na base simulada o único Administrador elegível administra a unidade sozinho e exige marcação (D2). (2) A lista de unidades do canvas não existe: divergência a registrar no PR (suposição do item). (3) Aviso por unidade usa Banner tone="warn" (componente base).
Referências visuais: frontend/visual/referencias/configuracoes-transferir-coordenacao-{1440,390}-{claro,escuro}.png
Visual do CI: configuracoes-transferir-coordenacao → passou
Não é do item: nenhum.

## Verificação

### Rodada 1 — OK — 2026-11-23, estado eac3b7ee01546f0cd005e397462379ae5b005a98

| Critério | Status | Evidência |
|---|---|---|
| CA1, CA2, CA11, CA17 | PASSOU | `CoordinationTransferKeepUnitsIT.withoutUnits` (IT rodado com Docker) |
| CA3, CA4, CA9 | PASSOU | `CoordinationTransferKeepUnitsIT.withUnits` |
| CA5, CA10 | PASSOU | `CoordinationTransferKeepUnitsIT.invalidUnits` |
| CA6, CA7 | PASSOU | `CoordinationTransferKeepUnitsIT.lastAdministrator` |
| CA8 | PASSOU | `CoordinationTransferKeepUnitsIT.seatPrice` |
| CA12, CA13, CA14, CA15 | PASSOU | `TransferCoordinationDialog.test.tsx` (20 testes) e e2e `@critical transferir coordenação` |
| CA16 | PASSOU | axe 360 px nos dois temas no teste da janela; visual 4/4; captura 1440 conferida contra o canvas: só a lista de unidades e os textos de custo/perda de acesso divergem (suposição do item); título e foco já divergiam antes do item |
| CA18 | PASSOU | `OpenApiContractTest`, `ContractRoutesTest` (7 testes) e `organization.msw.test.ts` |

Comandos:
- `mvnw verify -Dit.test='CoordinationTransfer*IT,Organization*IT,UnitsIT' -Dtest='CoordinationTransferTest,OpenApiContractTest,ContractRoutesTest'` → 8 unitários e 38 de integração, 0 falhas
- `vitest run TransferCoordinationDialog, organization.msw, shell, noInternalAnchors, routePattern, features/auth` → todos passaram; `typecheck` e `lint` limpos
- `npm run test:visual:docker -- -g "configuracoes-transferir-coordenacao"` → 4 passaram
- `npx playwright test --grep "transferir coordenação"` → 1 passou
- Não rodei `verify` completo nem `test:cov` (cobertura 100% não se aplica aos pacotes do item); vale o CI do PR.

Achados:
- sugestão, código, TransferCoordinationDialog.tsx — o caminho sem unidade (fim da sessão, aviso no login) não tem e2e; está coberto no teste da janela e no MSW (desvio já registrado em Construção).

## Entrega

- **O que muda:** a transferência de coordenação deixa o antigo Coordenador sem acesso por padrão. O dono escolhe, na janela, as unidades que ele mantém (`keepUnitIds`); as desmarcadas perdem o vínculo e, se ele era o último Administrador de uma unidade, a transferência é recusada (409). Ao manter unidades, o antigo Coordenador continua com vínculo de Administrador só nelas. Sem unidade marcada, a sessão dele é encerrada e o login avisa a troca. A cobrança por vaga de Administrador aparece na janela (`GET /admin-seat-price`, valor em `ctcore.billing.admin-seat-cents`). Auditoria grava `keptUnitIds` e `seats`.
- **Verificação:** rodada 1 OK (estado `eac3b7ee`). Testes de integração (`CoordinationTransferIT`, `CoordinationTransferKeepUnitsIT`), unitário, contrato OpenAPI, MSW, janela (20 testes com axe a 360 px nos dois temas), e2e `@critical` da transferência, visual do CI (`configuracoes-transferir-coordenacao` → passou) e `visual:canvas` (167 comparadas, 0 reprovadas).
- **Decisões que quem lê precisa saber:** D2 (na base simulada o único Administrador elegível administra a unidade sozinho, então a transferência exige marcação de unidade). O caminho sem unidade (fim da sessão, aviso no login) não tem e2e; está coberto pelo teste da janela e pelo MSW.
- **Divergências com o canvas:** a lista de unidades não existe no canvas (suposição do item) e os textos de custo e perda de acesso divergem do canvas anterior à regra. Ambos seguem o item; título e foco já divergiam antes. Sem `limiteCanvas`.
- **Limitações:** a verificação roda o CI do PR como prova final; `verify` completo e `test:cov` não foram rodados localmente.
- **Visual do CI:** configuracoes-transferir-coordenacao → passou
