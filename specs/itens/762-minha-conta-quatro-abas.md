# 762 — 630a · Minha conta em quatro abas, com Meus vínculos

Origem: issue #762, parte a da #630 (RF-ACE-04, RF-ACE-05, RN-ACE-17, RN-ACE-24, RN-COM-13, RNF-56; decisão 24 de `docs/auditoria/decisoes-canvas.md`). Divisão e plano de partida em `specs/itens/630-minha-conta-abas.md`. Branch: `item/762-minha-conta-quatro-abas`.

Tempos: especificar 4 · construir 33 (2 rodadas) · verificar 31 (regressão 26) (2 rodadas) · entregar 2
Comparação com o canvas: 7 min

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Minha conta, na gestão e no portal, passa a ter as abas Perfil, Segurança, Notificações e Privacidade, todas com conteúdo. O Perfil mostra, só para leitura, todos os vínculos ativos da conta; as outras abas reorganizam o que já existe. Vai antes da #636, da #763 e da #764.

Fora do escopo: nome, telefone e foto (#763); "Trocar de aparelho", contagem de códigos de reserva e "Baixar meus dados" ligado na gestão (#764); o arquivo de aluno e responsável (#117); "Excluir minha conta" (#118); Atividade recente (#631); Perfil de professor (#632); mudar Minhas informações.

## 2. Requisitos

- R1: Minha conta tem, na gestão e no portal, as abas Perfil, Segurança, Notificações e Privacidade, nessa ordem, com a aba em `?aba=perfil|seguranca|notificacoes|privacidade` (RNF-56); na gestão abaixo de 768 px, sem `aba` válida, a lista de atalhos continua e leva às quatro abas (D1, D6).
- R2: Perfil mostra Meus vínculos, só para leitura: um item por vínculo ativo da conta, de qualquer organização, com organização, papel, unidades (só Administrador e Professor), alunos ligados (só Responsável) e data de início, mais o atalho para trocar de organização ou área (RF-ACE-05); nada de outra conta, na consulta e na RLS; no portal o Perfil mostra só isso (D3, D4).
- R3: Segurança junta Acesso (e-mail e senha, com a data da última troca), Duas etapas e Sessões ativas, com o comportamento de hoje (D5).
- R4: "Desligar" só aparece para quem pode (RN-ACE-17, RN-ACE-24), e o servidor recusa os demais.
- R5: Notificações mostra o que já existe (na gestão, o sino e os itens "Em breve"; no portal, a chave de comunicados por e-mail, RN-COM-13) e a linha "Sempre enviamos: avisos de segurança da conta e da assinatura", sem chave, nas duas áreas (D2).
- R6: Privacidade mostra, desabilitados com "Em breve", "Baixar meus dados" e "Excluir minha conta" no portal e só "Baixar meus dados" na gestão; nenhum chama rota (D7).

## 3. Critérios de aceite

- CA1 (R1): dado um perfil de gestão ou de portal, quando abre `/conta?aba=<id>` com cada um dos quatro ids, então as abas aparecem nessa ordem, a pedida fica ativa, com conteúdo, dentro da moldura, e continua após F5; trocar de aba atualiza o endereço sem criar histórico.
- CA2 (R1): dado um id desconhecido ou antigo (`acesso`, `duas-etapas`, `sessoes`) ou nenhum, quando abre a tela, então no portal e na gestão a partir de 768 px abre o Perfil; na gestão abaixo de 768 px aparece a lista de atalhos, cujas linhas (Perfil, Senha, E-mail, Duas etapas, Sessões ativas, Notificações, Privacidade) abrem a aba correspondente, com "Voltar para Minha conta".
- CA3 (R2): dada a conta A, Administradora na organização 1 e Responsável na organização 2, quando lê `GET /auth/session` com a organização 1 ativa, a 2 ativa ou nenhuma, então vêm os dois vínculos com organização, papel, unidades, `startsOn` e, no de Responsável, os nomes dos alunos ligados a ela (também os da organização não ativa); vínculo pendente ou encerrado não vem; vínculo que não é de Responsável vem com a lista de alunos vazia, mesmo que a conta tenha ficha de responsável na mesma organização.
- CA4 (R2): dadas a conta A e a conta B, com o papel operacional do banco, quando a sessão de A é lida, então não há vínculo, unidade nem aluno de B (inclusive aluno de outro responsável na mesma organização); no escopo de conta de A, `select` direto em `guardian`, `student_guardian` e `student` só devolve as linhas ligadas a A como responsável, `update` nas de outra organização não afeta linha, e com o vínculo de Responsável encerrado não devolve nenhuma; sem sessão, 401.
- CA5 (R2): dado o Perfil, quando abre, então cada vínculo mostra os campos que se aplicam ao papel (unidades só para Administrador e Professor; alunos só para Responsável), sem a linha da data quando `startsOn` é vazio e sem controle de edição ou de encerrar; com dois ou mais vínculos há "Trocar organização ou área" dentro do conteúdo, que abre a escolha, e com um só não há; no portal o Perfil não tem outro cartão.
- CA6 (R3): dada a aba Segurança, então trocar e-mail, trocar senha (com "alterada em" a data da última troca, ou "nunca alterada"), ativar duas etapas, ver códigos novos e encerrar sessões funcionam como hoje, inclusive o carregando e o erro das sessões; trocar a senha atualiza a lista de sessões.
- CA7 (R4): dado o Coordenador, ou o Administrador com a exigência ligada, então "Desligar" não aparece e `DELETE /auth/two-factor` responde 403; os demais com duas etapas ligadas veem o botão.
- CA8 (R5): dada a aba Notificações na gestão, então o sino carrega e salva como hoje e a linha "Sempre enviamos" aparece sem chave; no portal, a chave de comunicados lê o valor gravado, grava a mudança e avisa a falha, a tela tem carregando, erro com "Tentar de novo" e sem permissão, e a linha aparece sem chave.
- CA9 (R6): dada a aba Privacidade, então no portal os dois botões e na gestão só "Baixar meus dados" aparecem com `aria-disabled="true"` e "Em breve" (no portal abaixo de 640 px, como linhas "Em breve"), e clicar neles não faz nenhuma requisição.
- CA10 (R1, R2, R3, R5, R6): dadas as quatro abas nas duas áreas, então a 360 px não há rolagem horizontal da página, o axe passa nos dois temas, cada aba tem caso no teste visual e as telas foram comparadas com `MinhaConta`, `MinhaContaNotificacoes`, `PortalConta`, `PortalMConta` e `GMConta` em 1440 e 390 px, pt-BR, com capturas em `.capturas/762/`; segue o padrão de rotas e telas.

## 4. Plano técnico

- Dados: migração `backend/src/main/resources/db/migration/V61__student_names_for_account.sql` (a criar), no molde de `V8` e `V55`, com três políticas `for select` e a reversão manual no comentário. `guardian`: `account_id` igual a `app.account_id` e existe `account_link` `ACTIVE` de papel `GUARDIAN` da mesma conta e organização. `student_guardian`: existe `guardian` dessa conta (mesma organização e id) que atende à mesma condição. `student`: existe `student_guardian` com `guardian` dessa conta que atende à condição. Em todas, `nullif(current_setting('app.account_id', true), '')::uuid` (vazio não abre nada). Sem coluna nova; a data é o `account_link.starts_on` que já existe (aceita nulo).
- API: `GET /auth/session` (e toda resposta `SessionView`): `LinkView` ganha `startsOn` (`date`, nulo permitido) e `studentNames` (lista obrigatória, nomes em ordem alfabética, vazia fora de `GUARDIAN`). Só nome: sem id, nascimento nem contato. Atualizar o schema em `docs/openapi.yaml`. Nenhuma rota nova; `GET`/`PUT /auth/email-preferences` e `DELETE /auth/two-factor` não mudam. Só leitura: sem auditoria nova.
- Interface:
  - `AccountPage`: uma só lista de abas (`Tabs` e `useTabParam`) para gestão e portal, padrão `perfil`. Cada área mantém o seu cabeçalho; o portal mantém "‹ Voltar" e o "Sair da conta" do celular (abaixo das abas) e mostra as abas também no celular; a gestão mantém a lista abaixo de 768 px. `useAccountSessions` continua no nível da página.
  - Perfil: `MyLinks.tsx` (a criar), lendo `state.session.links`; rótulos de papel de `chooseLink.roles`, data com `formatDate` (aceita data de calendário), atalho com `ChooseLinkTrigger`. Sem carga própria: os estados são os da sessão.
  - Segurança: composição em `AccountPage` de `AccessCard`, `TwoFactorSection` e `SessionsSection`, sem mudar os três (D5).
  - Notificações: gestão usa `NotificationsTab`; no portal, `PortalNotifications` (no mesmo arquivo) lê `GET /auth/email-preferences` com carregando, erro e sem permissão (não há lista, então não há vazio) e entrega o valor a `PortalPreferences`. A linha "Sempre enviamos" é um texto comum nas duas.
  - Privacidade: `PrivacyTab.tsx` (a criar) com os cartões `ComingSoon` de hoje; no portal abaixo de 640 px, o `MenuList` com `SoonRow` de hoje.
  - `AccountMenuList`: destinos novos e linhas Perfil e Privacidade (D6).
  - Textos em `pt-BR.json` (`account.tabs`, `account.menu`, `account.profile`, a linha "Sempre enviamos", texto de "Baixar meus dados" da gestão); chaves sem uso saem.
  - MSW: `startsOn` e `studentNames` nos vínculos das sessões de `handlers.ts`, com um Responsável que tenha alunos.
- Segurança: a rota age só sobre a conta da sessão e não recebe id. A consulta dos alunos parte de `account_link` filtrado por `id` e `account_id`, junta `guardian` pela mesma conta e organização, depois `student_guardian` e `student` pela organização, e só roda para vínculo `GUARDIAN`; a RLS repete a barreira. As políticas não permitem escrita. Nomes de alunos são dado pessoal: vão só para o próprio responsável; testes e mocks só com dados fictícios.
- Arquivos a alterar: `backend/src/main/java/br/com/ctcore/identity/SessionService.java` (`LinkView`, `view`, consulta dos alunos); `docs/openapi.yaml`; em `frontend/src/`: `features/account/AccountPage.tsx`, `AccountMenuList.tsx`, `NotificationsTab.tsx`, `features/auth/SessionProvider.tsx` (`SessionView.links`, campos novos opcionais no tipo, como `unitNames`), `i18n/pt-BR.json`, `mocks/handlers.ts`, `mocks/account.msw.test.ts`, `features/account/AccountPage.test.tsx`, `NotificationsTab.test.tsx`, `features/data-security/DataSecurityPage.test.tsx` (usa `?aba=duas-etapas`); `frontend/visual/casos.ts` (e `telas.visual.ts` só se um caso precisar de dado que o MSW não dá); `frontend/e2e/minha-conta.spec.ts`, `estado-no-endereco.spec.ts`.
- Arquivos a criar: `V61__student_names_for_account.sql`; `backend/src/test/java/br/com/ctcore/identity/AccountLinksIsolationIT.java` (sobre `AuthBase`); `frontend/src/features/account/MyLinks.tsx`; `PrivacyTab.tsx`. Cerca de 20 arquivos contáveis, dentro do limite de 30.
- Reuso: `AccessCard`, `TwoFactorSection`, `SessionsSection`, `NotificationsTab`, `PortalPreferences` e `setEmailAnnouncements`, `ChooseLinkTrigger`, `ComingSoon`, `MenuList`/`SoonRow`, `Tabs`, `useTabParam`, estados de `components/states`, `AccountTransactions.forAccount`.
- Riscos: política nova ampliar leitura ou criar recursão entre políticas (a cadeia é `student` > `student_guardian` > `guardian` > `account_link`, sem volta; provado no IT); as políticas só valem com `app.account_id` definido, que só existe dentro de `forAccount`, então conferir que nenhum outro uso dele passa a enxergar alunos; link ou teste que ainda use os ids antigos (buscar `aba=acesso|duas-etapas|sessoes`); "Trocar organização ou área" passa a existir duas vezes na tela (topo e Perfil), e teste que busca o botão precisa se limitar ao conteúdo; as referências visuais da conta mudam.

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

Duas sessões de construção: parte A (T1, back-end e contrato) e parte B (T2 a T6, interface). Mesmo item, um PR.

- [x] T1: `V61`, `startsOn` e `studentNames` em `LinkView`/`view`, schema no `docs/openapi.yaml` e `AccountLinksIsolationIT` (casos de CA3 e CA4) — cobre CA3, CA4 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=AccountLinksIsolationIT -Djacoco.skip=true` e `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`
- [x] T2: quatro abas nas duas áreas, Segurança agrupada, lista do celular, ids novos em `AccountPage.test.tsx` e `DataSecurityPage.test.tsx`, com os casos de "Desligar" por perfil; o 403 do servidor é conferido nos IT que já existem — cobre CA1, CA2, CA6, CA7 — prova: em `frontend/`, `npm test -- src/features/account/AccountPage.test.tsx src/features/data-security/DataSecurityPage.test.tsx`; na raiz, `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test='TwoFactorServiceIT,AdminTwoFactorPolicyIT' -Djacoco.skip=true`
- [x] T3: `MyLinks` no Perfil, tipo da sessão e vínculos do MSW — cobre CA5 — prova: em `frontend/`, `npm test -- src/features/account/AccountPage.test.tsx src/mocks/account.msw.test.ts`
- [x] T4: Notificações do portal e a linha "Sempre enviamos"; `PrivacyTab`, com teste de que os botões não fazem requisição — cobre CA8, CA9 — prova: em `frontend/`, `npm test -- src/features/account/NotificationsTab.test.tsx src/features/account/AccountPage.test.tsx`
- [x] T5: e2e da tela dentro da moldura, gestão e portal: as quatro abas, F5 e 360 px sem rolagem horizontal (`minha-conta.spec.ts`, com o fluxo de senha na aba Segurança) e ids novos em `estado-no-endereco.spec.ts`; axe das quatro abas nas duas áreas, claro e escuro, em `AccountPage.test.tsx` — cobre CA1, CA10 — prova: em `frontend/`, `npm run e2e:full -- minha-conta`, `npm run e2e:full -- estado-no-endereco -g "Abas"` e `npm test -- AccountPage shell.test noInternalAnchors routePattern`
- [x] T6: casos do teste visual: `conta`, `conta-aluno`, `conta-aluno-pagina`, `conta-duas-etapas` e `conta-codigos-reserva` apontam para `?aba=seguranca`; casos novos para Perfil e Privacidade (gestão e portal) e Notificações do portal (sem `canvas` onde não há tela); referências só dos casos da conta; capturas em `.capturas/762/` (1440 e 390 px, pt-BR, nos temas em que o canvas existe), comparação lado a lado, divergências registradas em "Construção" e a linha `Comparação com o canvas: <min>` (D8) — cobre CA10 — prova: em `frontend/`, `npm run test:visual:docker -- --update-snapshots -g "conta"` e `npm run visual:canvas`

## 6. Decisões

- D1: ids de aba em pt-BR, com `perfil` como padrão; endereço antigo cai no tratamento atual de aba desconhecida, sem redirecionamento (são links internos).
- D2 (muda o comportamento): no portal a chave de comunicados por e-mail aparece em Notificações; a de Minhas informações fica como está (RF-POR-07). As duas gravam a mesma preferência do vínculo ativo.
- D3 (muda o comportamento): nesta parte o Perfil da gestão mostra só Meus vínculos; nome, telefone e foto entram na #763, sem aviso "Em breve" no lugar (não há tela deles no canvas).
- D4 (muda o comportamento): alunos ligados são todos os que a conta tem hoje como responsável naquela organização (pagador ou não, ativo ou ex-aluno), só pelo nome. Coordenador, Aluno e Responsável não mostram unidades. Vínculo sem `starts_on` aparece sem a data, sem preenchimento retroativo. O atalho é o `ChooseLinkTrigger`, que leva à escolha geral (não há atalho por linha) e só existe com dois ou mais vínculos. Para ler os nomes, políticas de RLS só de leitura; alternativa descartada: função `security definer`, que com RLS forçada deixaria de ler outra organização se o dono das tabelas não for superusuário.
- D5: na gestão a aba Segurança segue o `MinhaConta`: Acesso e Duas etapas à esquerda e Sessões à direita em tela larga, uma coluna abaixo disso (o corte é o que não espreme a tabela de sessões). No portal fica o arranjo de hoje (`PortalConta`). Os textos de rodapé do canvas que a tela de hoje não mostra continuam fora: a issue pede o comportamento de hoje.
- D6: a lista do celular da gestão mantém as linhas e os rótulos do `GMConta` e ganha Perfil (primeira) e Privacidade (última antes de "Sair"), porque abaixo de 768 px as abas ficam escondidas e sem as linhas não haveria como chegar a elas. Senha, E-mail, Duas etapas e Sessões ativas abrem `?aba=seguranca`.
- D7 (muda o comportamento): "Excluir minha conta" não existe de verdade no código; segue "Em breve" até a #118. "Baixar meus dados" fica "Em breve" na gestão até a #764 e no portal até a #117. O texto da gestão cita só conta, vínculos, consentimentos e acessos (conteúdo da #764).
- D8: os canvas não têm abas nem telas de Perfil e Privacidade; a decisão 24 prevalece: os cartões do canvas valem dentro das abas, e o cartão "E-mails" do `MinhaConta` corresponde à aba Notificações. O caso `conta` compara com a aba Segurança. Se alguma largura passar do limite do `visual:canvas`, aplica-se a regra 4 da Autonomia, citando a decisão 24 como motivo. O `limiteCanvas` que `conta-aluno` já tem continua com a #642.
- Suposição: o MSW atual, com os campos novos, basta para os casos visuais; se um caso pedir dados do canvas que ele não tem, o ajuste vai em `telas.visual.ts`, como nos casos `informacoesCanvas`.

## Construção

- T1 — arquivos: `backend/src/main/resources/db/migration/V61__student_names_for_account.sql` (novo), `backend/src/main/java/br/com/ctcore/identity/SessionService.java`, `docs/openapi.yaml`, `backend/src/test/java/br/com/ctcore/identity/AccountLinksIsolationIT.java` (novo) — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=AccountLinksIsolationIT -Djacoco.skip=true` → 2 testes, 0 falhas; `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'` → 7 testes, 0 falhas

Sessão 1 (parte A) concluída: T1. Falta a parte B (T2 a T6, interface), em outra sessão.
Testes do item: os dois comandos de T1 → passaram. `lint` e `typecheck` do front-end não rodaram: a parte A não altera o front-end.
Desvios: nenhum. A limpeza do IT novo usa `truncateCascade` em `student` e `guardian` antes da limpeza herdada de `AuthBase`.
Conferência do risco de ampliar leitura: os demais usos de `AccountTransactions.forAccount` não consultam `guardian`, `student_guardian` nem `student` (o `ContactEmailSync` lê só `account_link` no escopo de conta e o resto no escopo de organização).
Docker: nenhuma imagem nova na máquina; os containers do Testcontainers saíram ao fim dos testes.

### Sessão 2 (parte B, interface)

- T2 — arquivos, em `frontend/src/`: `features/account/AccountPage.tsx` (uma lista de abas para as duas áreas), `AccountMenuList.tsx`, `i18n/pt-BR.json`, `features/account/AccountPage.test.tsx`, `features/data-security/DataSecurityPage.test.tsx` — prova: `npm test` dos dois arquivos (junto com o resto de `features/account`) → 87 testes, 0 falhas; `verify ... -Dit.test='TwoFactorServiceIT,AdminTwoFactorPolicyIT'` → 10 testes, 0 falhas
- T3 — arquivos: `features/account/MyLinks.tsx` (novo), `features/auth/SessionProvider.tsx`, `mocks/handlers.ts`, `mocks/account.msw.test.ts` — prova: `npm test -- src/features/account/AccountPage.test.tsx src/mocks/account.msw.test.ts` → 80 testes, 0 falhas
- T4 — arquivos: `features/account/PrivacyTab.tsx` (novo), `NotificationsTab.tsx` (`PortalNotifications`, com `useResource` e `PortalPreferences`), `NotificationsTab.test.tsx`, `AccountPage.test.tsx` — prova: `npm test -- src/features/account/NotificationsTab.test.tsx src/features/account/AccountPage.test.tsx` → 86 testes, 0 falhas
- T5 — arquivos: `frontend/e2e/minha-conta.spec.ts`, `estado-no-endereco.spec.ts`, `AccountPage.test.tsx` (axe: 4 abas, 2 áreas, 2 temas) — prova: `npm run e2e:full -- minha-conta` → 3 passaram; `npm run e2e:full -- estado-no-endereco -g "Abas"` → 1 passou; `npm test -- AccountPage shell.test noInternalAnchors routePattern` → 394 testes, 0 falhas. Segue o padrão de rotas e telas
- T6 — arquivos: `frontend/visual/casos.ts` (casos da conta em `?aba=seguranca`; novos `conta-perfil`, `conta-privacidade`, `conta-aluno-perfil`, `conta-aluno-notificacoes`, `conta-aluno-privacidade`, sem `canvas`), `visual/telas.visual.ts` (a espera de `/conta` reconhece o conteúdo das abas novas) e referências — prova: `npm run test:visual:docker -- --update-snapshots -g "conta"` → 56 passaram (o filtro também pega `convite-conta-existente` e `portal-editar-contato`, sem mudança nas referências); `npm run visual:canvas` → 164 comparadas, 0 reprovadas. Conta a 1440: `conta` 1,2%, `conta-notificacoes` 0,8%, `conta-aluno-pagina` 0,8% (390: 2,9%), `conta-duas-etapas` 5,4%, `conta-codigos-reserva` 2,9%, `conta-aluno` 68,0% (limite 70% que já existia, #642). Nenhum `limiteCanvas` novo

Capturas em `.capturas/762/`: `<caso>-<largura>-sistema.png` e `<caso>-escuro-<largura>-sistema.png` (1440 e 390) dos casos `conta`, `conta-aluno`, `conta-aluno-pagina`, `conta-aluno-perfil`, `conta-aluno-notificacoes`, `conta-aluno-privacidade`, `conta-celular`, `conta-codigos-reserva`, `conta-duas-etapas`, `conta-notificacoes`, `conta-perfil` e `conta-privacidade`; canvas (só há tema claro): `conta-1440-canvas` (MinhaConta), `conta-notificacoes-1440-canvas`, `conta-aluno-pagina-1440-canvas` (PortalConta), `conta-aluno-pagina-390-canvas` (PortalMConta) e `conta-celular-390-canvas` (GMConta).

Divergências com o canvas (conferidas nas capturas claras):
- Abas Perfil, Segurança, Notificações e Privacidade no lugar da página única (`MinhaConta`, `PortalConta`, `PortalMConta`) e das quatro abas antigas (`MinhaContaNotificacoes`): decisão 24. No portal, os cartões de dados passam para Privacidade.
- O cartão "E-mails" do `MinhaConta` corresponde à aba Notificações, só com o que existe (D8).
- Textos de rodapé e subtítulo do canvas continuam fora, como na tela de antes (D5).
- Linha "Sempre enviamos" em Notificações, que o canvas não desenha (D2).
- Lista do celular da gestão com Perfil e Privacidade a mais (D6).
- Diferenças que a tela já tinha: dados do MSW, itens "Em breve", acabamento dos componentes base (tabela de sessões, botões).

Referências visuais: em `frontend/visual/referencias/`, alteradas 27 (`conta`, `conta-aluno`, `conta-aluno-pagina`, `conta-notificacoes` e `conta-codigos-reserva`: as 4 de cada; `conta-duas-etapas`: 1440 claro e escuro e 390 claro; `conta-celular`: as 4, a 1440 abre o Perfil e a 390 a lista com as duas linhas novas) e 20 novas (4 de cada caso novo).

Testes do item (depois da última tarefa): `npm test -- features/account features/data-security PortalAccount PortalShell mocks/account.msw casos.test shell.test noInternalAnchors routePattern` → 592 testes, 0 falhas; `npm run e2e:full -- minha-conta estado-no-endereco sair-da-conta sessao-unica navegacao-sem-recarregar` → 29 passaram; `npm run lint` e `npm run typecheck` → sem erro; `AccountLinksIsolationIT` → 2 testes, 0 falhas; `OpenApiContractTest,ContractRoutesTest` → 7 testes, 0 falhas.
Regressão: não roda nesta fase.
Desvios: `visual/telas.visual.ts` mudou numa linha de espera, não por dado de caso. Um `GET /auth/email-preferences` entrou no `setup` do `AccountPage.test.tsx`, porque o teste troca só a sessão e o MSW responderia 403 pela sessão interna de Coordenador.

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 27/11/2026, estado 4987ca584d9951046d1403534d02e9183af32ea6

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `AccountPage.test.tsx` (4 ids x 2 perfis, ordem, ativa, dentro de `main`); e2e `minha-conta` (gestão e portal, F5, moldura) e `estado-no-endereco` (troca sem histórico): 8 passaram |
| CA2 | PASSOU | `AccountPage.test.tsx`: sem `aba`, `xyz` e ids antigos abrem o Perfil; lista do celular com as 7 linhas, destinos e "Voltar para Minha conta" |
| CA3 | PASSOU | `AccountLinksIsolationIT` (2 testes, 0 falhas): sem vínculo ativo, com o 1 e com o 2; `startsOn`; alunos só no de Responsável; pendente e encerrado de fora |
| CA4 | PASSOU | mesmo IT, com `JdbcClient` operacional: `select` só do ligado à conta, `update` sem linha, nada com o vínculo encerrado, 401 sem sessão |
| CA5 | PASSOU | `AccountPage.test.tsx` "Perfil, Meus vínculos": campos por papel, sem data, atalho com 2+ vínculos e sem ele com 1 |
| CA6 | PASSOU | `AccountPage.test.tsx` (e-mail, senha, duas etapas, códigos, sessões com carregando e erro) e e2e de troca de senha que atualiza as sessões |
| CA7 | PASSOU | `AccountPage.test.tsx` ("Desligar" por perfil) e `DataSecurityPage.test.tsx`; `TwoFactorServiceIT` (Coordenador, 403) e `AdminTwoFactorPolicyIT` (exigência ligada, 403): 10 testes, 0 falhas |
| CA8 | PASSOU | `NotificationsTab.test.tsx` e `AccountPage.test.tsx` "Notificações do portal" (lê, grava, falha, carregando, erro, 403, linha sem chave) |
| CA9 | PASSOU | `AccountPage.test.tsx` "Privacidade": portal, gestão e abaixo de 640 px, `aria-disabled`, "Em breve", nenhuma requisição ao clicar |
| CA10 | PASSOU | e2e a 360 px sem rolagem horizontal; axe 4 abas x 2 áreas x 2 temas; casos em `casos.ts`; capturas abertas e comparadas nesta rodada (`conta`, `conta-notificacoes`, `conta-aluno-pagina` 1440 e 390 e `conta-celular` 390 contra o canvas; Perfil, Privacidade, Notificações do portal e escuros por amostra), só com as divergências registradas em "Construção"; `shell`, `noInternalAnchors` e `routePattern` verdes no `npm test`. Visual contra as referências: no CI do PR |

Comandos (regressão local reduzida, inteira): `npm run lint`, `npm run typecheck` e `npm run build` → sem erro; `npm test` → 3123 passaram, 1 falhou (276 arquivos); `npm run e2e:full -- minha-conta estado-no-endereco` → 8 passaram; `mvnw test` → 160, 0 falhas; `AccountLinksIsolationIT` → 2, 0 falhas; `TwoFactorServiceIT,AdminTwoFactorPolicyIT` → 10, 0 falhas; `npx vitest run src/features/telasCanvas419.test.ts --maxWorkers=2` 3 vezes → 1 falha e 68 aprovados nas 3.
Instáveis: nenhum.

Achados:
- obrigatório, código, `frontend/src/features/account/PrivacyTab.tsx:8` — esperado: `npm test` verde; observado: falha `telasCanvas419.test.ts > account/PrivacyTab.tsx não usa cor fixa nem campo solto` (falha nova, do arquivo criado pelo item; 4 de 4 execuções); evidência: o teste procura `#[0-9a-fA-F]{3,8}` no fonte e acha `#764` no comentário (`#117` e `#118`, na mesma linha, também casam); corrigir: escrever o comentário sem `#` antes dos três números (ex.: "issues 764, 117 e 118"), sem mudar o teste, e rodar `npm test -- telasCanvas419`.
- sugestão, código, `frontend/src/features/account/AccountPage.test.tsx`, "Privacidade (#762 CA9)" — as esperas fixas de 200 ms e 50 ms em relógio real podem deixar o teste instável em máquina lenta; esperar a condição das cargas antes de contar as requisições.
- sugestão, código, `V61__student_names_for_account.sql` — o comentário diz que o escopo de conta só existe dentro de `forAccount`, mas `app.account_id` vale até o fim da transação externa quando há uma (`set_config` local, propagação padrão). Nos caminhos conferidos (`CriticalActionGuard`, `LinkService.sessionsAfter`, `InviteService.accept`) não há leitura de aluno ou responsável depois dele; vale registrar o cuidado no comentário de `AccountTransactions` (não na migração, depois de aplicada).

### Correção da rodada 1

- Achado obrigatório (`telasCanvas419`, `PrivacyTab.tsx:8`): o comentário passou a citar "issues 764, 117 e 118", sem `#`; o teste não mudou — arquivos: `frontend/src/features/account/PrivacyTab.tsx` — prova: em `frontend/`, `npm test -- telasCanvas419 AccountPage` → 149 testes, 0 falhas; `npm run lint` e `npm run typecheck` → sem erro
- Sugestões da rodada 1 (esperas fixas no teste de Privacidade; cuidado a registrar em `AccountTransactions`): opcionais, ficam só registradas em "Verificação".
- Regressão: não roda nesta fase. Só um comentário mudou: sem mudança visual, referências e capturas continuam as mesmas.

### Rodada 2 — OK — 27/11/2026, estado 52c01f66e4319a49f652bb0057f1dae1cfd7176d

Desde a rodada 1 (`git diff 4987ca58 52c01f66`) mudaram só o comentário da linha 8 de `PrivacyTab.tsx` e este arquivo.

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `npm test` verde; e2e `minha-conta` e `estado-no-endereco` rodados de novo: 8 passaram |
| CA2 | PASSOU | mantido da rodada 1; `AccountPage.test.tsx` verde no `npm test` |
| CA3 | PASSOU | `AccountLinksIsolationIT` rodado de novo: 2 testes, 0 falhas |
| CA4 | PASSOU | mesmo IT, 0 falhas |
| CA5 | PASSOU | mantido da rodada 1; `npm test` verde |
| CA6 | PASSOU | mantido da rodada 1; `npm test` e e2e de troca de senha verdes |
| CA7 | PASSOU | mantido da rodada 1 (back-end sem mudança desde então); testes de tela verdes no `npm test` |
| CA8 | PASSOU | mantido da rodada 1; `npm test` verde |
| CA9 | PASSOU | `PrivacyTab.tsx` mudou só no comentário; testes de Privacidade verdes no `npm test` |
| CA10 | PASSOU | comparação com o canvas mantida da rodada 1 (sem mudança visual); e2e a 360 px, axe, `shell`, `noInternalAnchors` e `routePattern` verdes. Visual contra as referências: no CI do PR |

Comandos (regressão local reduzida, inteira): `npm run lint`, `npm run typecheck` e `npm run build` → sem erro; `npm test` → 3124 passaram, 0 falhas (276 arquivos); `npm run e2e:full -- minha-conta estado-no-endereco` → 8 passaram; `mvnw test` → 160, 0 falhas; `AccountLinksIsolationIT` → 2, 0 falhas. Docker: nenhuma imagem nova na máquina.
Instáveis: nenhum.

Achados:
- Achado obrigatório da rodada 1 (`telasCanvas419`, `PrivacyTab.tsx:8`): corrigido, sem mudar o teste.
- Nenhum achado novo. As 2 sugestões da rodada 1 continuam opcionais.

## Entrega

O que muda: Minha conta passa a ter quatro abas (Perfil, Segurança, Notificações e Privacidade) em gestão e portal, com "Meus vínculos" na Privacidade. A aba ativa vai em `?aba=<id>`. A API de sessão (`SessionService`, `docs/openapi.yaml`) devolve os vínculos com os nomes dos alunos e das unidades; o MSW e os testes acompanham. Migração `V61` (nomes para a conta).

Como foi verificado: verificação rodada 2 (OK, estado `52c01f66`): `npm test` com 3124 testes verdes; e2e `minha-conta` e `estado-no-endereco` com 8 passando; `AccountLinksIsolationIT` (isolamento entre organizações e perfis) 2 testes verdes; `mvnw test` 160 verdes; lint, typecheck e build sem erro. A comparação com o canvas (rodada 1) não teve mudança visual depois. A conferência visual contra as referências é do CI.

Decisões: seguem `specs/itens/630-minha-conta-abas.md`. Achado da rodada 1 (`PrivacyTab.tsx`, `telasCanvas419`) corrigido na rodada 2.

Limitações: o visual contra as referências (`Visual do CI`) só sai do job `visual` do CI.
