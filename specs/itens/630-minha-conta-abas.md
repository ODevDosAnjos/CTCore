# 630 — RF-ACE-04 · Minha conta em abas com conteúdo: Perfil, Segurança, Notificações e Privacidade

Origem: issue #630 (RF-ACE-04, RF-LGP-01, RF-LGP-02, RN-ACE-17, RN-ACE-24; decisão 24 de `docs/auditoria/decisoes-canvas.md`). Branch: `item/630-minha-conta-abas`.

Tempos: especificar 5 (2 rodadas)

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. Item-mãe: dividido em 630a, 630b e 630c (D10), sem construção própria. A seção 4 é o ponto de partida de cada parte; as tarefas (seção 5) ficam no arquivo de cada parte. -->

## 1. Objetivo

Minha conta, na gestão e no portal, passa a ter as abas Perfil, Segurança, Notificações e Privacidade, cada uma com conteúdo. A pessoa passa a editar nome, telefone e foto da própria conta, ver os próprios vínculos, trocar o aparelho das duas etapas, ver quantos códigos de reserva restam e, fora do portal, baixar os próprios dados.

Fora do escopo: Atividade recente e "Não fui eu" (#631, RN-ACE-25); aba Perfil de professor (#632, RF-PRO-05); "Excluir minha conta" (#118) e o arquivo de aluno e responsável com o botão na ficha (#117, RN-LGP-04), que continuam "Em breve" (D1, D2); resumo diário e e-mails de boas-vindas ("Em breve"); dados pessoais do aluno, que ficam em Minhas informações.

## 2. Requisitos

- R1: Minha conta tem, na gestão e no portal, as abas Perfil, Segurança, Notificações e Privacidade, nessa ordem, com a aba em `?aba=perfil|seguranca|notificacoes|privacidade` (RNF-56); abaixo de 768 px, na gestão, a lista de atalhos sem `aba` continua e leva às novas abas (D3).
- R2: na gestão, Perfil permite alterar nome e telefone/WhatsApp da conta; o valor vale em todas as organizações da conta e a mudança vai para a auditoria (D4, D5).
- R3: na gestão, Perfil permite enviar, trocar e remover a foto (JPG, PNG ou WebP, cortada em quadrado, 512 x 512, até 5 MB); ela aparece no avatar do topo no lugar das iniciais, em qualquer organização da conta, e a mudança vai para a auditoria (D6).
- R4: Meus vínculos mostra, só para leitura, cada vínculo ativo da conta com organização, papel, unidades (Administrador e Professor), alunos ligados (Responsável) e data de início, com o atalho para trocar de organização ou área (RF-ACE-05); não mostra nada de outra conta. No portal, o Perfil mostra só Meus vínculos.
- R5: Segurança junta e-mail e senha (com a data da última troca), duas etapas e sessões, com o comportamento de hoje.
- R6: em duas etapas ligadas, "Trocar de aparelho" pede senha e código atual, configura um app novo e, ao confirmar o código dele, o segredo anterior deixa de valer (D7).
- R7: em duas etapas ligadas, a tela mostra "códigos de reserva: N de 10", com N igual ao número de códigos não usados no banco.
- R8: "Desligar" só aparece para quem pode (RN-ACE-17, RN-ACE-24), e o servidor continua recusando os demais.
- R9: Notificações mostra o que já existe (na gestão, o sino e os itens "Em breve"; no portal, a chave de comunicados por e-mail, RN-COM-13) e a linha "Sempre enviamos: avisos de segurança da conta e da assinatura", sem chave (D8).
- R10: em Privacidade, na gestão (Coordenador, Administrador e Professor), "Baixar meus dados" entrega um arquivo com a conta (nome, e-mail, telefone, foto), os vínculos, os consentimentos e os acessos registrados da própria conta, e o download vai para a auditoria (RF-LGP-01, D2, D9).
- R11: no portal, Privacidade mostra "Baixar meus dados" e "Excluir minha conta" visíveis e desabilitados com "Em breve" (D1, D2).

## 3. Critérios de aceite

- CA1 (R1): dado um perfil de gestão ou de portal, quando abre `/conta?aba=<id>` com cada um dos quatro ids, então a aba abre dentro da moldura, com conteúdo, e continua aberta após F5; um id desconhecido (inclusive os antigos) não quebra a tela; a 360 px não há rolagem horizontal e o axe passa nos dois temas.
- CA2 (R2): dada uma conta com vínculos em duas organizações, quando salva nome e telefone numa delas, então a sessão na outra mostra os mesmos valores e a auditoria da organização ativa registra a mudança, sem dado sensível além do alterado.
- CA3 (R2, R3): dado nome vazio, telefone inválido, arquivo que não é JPG, PNG ou WebP, acima de 5 MB ou fora de 512 x 512, quando envia, então recebe 422 com o campo e nada muda; sem sessão, 401; com vínculo de portal ativo, 403; nenhuma das rotas aceita o id de outra conta.
- CA4 (R3): dada uma foto salva, quando se abre qualquer tela da gestão ou do portal da própria conta, então o avatar do topo mostra a foto; removida a foto, voltam as iniciais.
- CA5 (R4): dadas duas contas e duas organizações, quando a conta A (Administrador numa, Responsável noutra) abre o Perfil, então vê os dois vínculos ativos com papel, unidades, alunos ligados e data de início, também os da organização que não é a ativa, e nenhum vínculo, unidade ou aluno da conta B; vínculo encerrado ou pendente não aparece; vínculo sem data de início aparece sem a linha da data.
- CA6 (R4): dado o portal, quando se abre o Perfil, então só há Meus vínculos, sem nome, telefone ou foto editáveis.
- CA7 (R5): dada a aba Segurança, então trocar e-mail, trocar senha, ativar duas etapas, ver códigos novos e encerrar sessões funcionam como hoje.
- CA8 (R6): dadas duas etapas ligadas, quando troca de aparelho com senha e código atual e confirma o código do app novo, então o código do app anterior deixa de ser aceito no login, o do novo é aceito, os códigos de reserva não usados continuam valendo e a troca vai para a auditoria; antes de confirmar, o anterior continua valendo.
- CA9 (R6): dada senha ou código errado (que contam na trava da RN-ACE-10), código do app novo errado, ou duas etapas desligadas, quando tenta trocar, então é recusado e o segredo anterior continua valendo.
- CA10 (R7): dado um código de reserva usado, quando a sessão é relida, então a tela mostra "9 de 10", igual à contagem no banco; ao gerar códigos novos, volta a "10 de 10"; a contagem de uma conta não muda com o uso de outra.
- CA11 (R8): dado o Coordenador, ou o Administrador com a exigência ligada, então não vê "Desligar" e a rota responde 403; os demais veem e desligam.
- CA12 (R9): dada a aba Notificações, então a linha "Sempre enviamos" aparece sem chave; na gestão, o sino funciona como hoje; no portal, a chave de comunicados por e-mail lê e grava a preferência.
- CA13 (R10): dado um Coordenador, um Administrador e um Professor, quando cada um baixa os dados, então o arquivo tem conta, vínculos, consentimentos e acessos dele e nada de outra conta, sem senha, hash, segredo, token, código ou IP inteiro, e a auditoria registra o download; sem sessão, 401; com vínculo de portal ativo, 403.
- CA14 (R11): dado o portal, então os dois botões de Privacidade estão desabilitados com "Em breve" e não chamam nenhuma rota.
- CA15 (R1): dadas as quatro abas, então têm caso no teste visual, os quatro estados onde há carga do servidor, e foram comparadas com o canvas (`MinhaConta`, `MinhaContaNotificacoes`, `PortalConta`, `PortalMConta`, `GMConta`) em 1440 e 390 px, pt-BR, com capturas em `.capturas/630*/`; segue o padrão de rotas e telas.

## 4. Plano técnico

**Estimativa: cerca de 52 arquivos contáveis, acima do limite de 30. Dividido em três partes (D10).**

### Camadas

- Dados: migração `V61` (a criar): `account.photo`; coluna do segredo pendente em `account_two_factor` (o ativo fica intacto até a confirmação); políticas de leitura por escopo de conta em `student`, `guardian` e `student_guardian`, só para o responsável da própria conta, no molde de `V8` e `V55` (`unit` já tem `unit_of_account_or_invite`). Sem isso a RLS esconde os alunos da organização que não é a ativa.
- API (`docs/openapi.yaml`, não conta no limite): alterar nome e telefone; enviar e remover a foto; baixar os dados; `POST /auth/two-factor/replace` (senha e código, devolve o `TwoFactorSetup`) e a confirmação dele. `SessionView` ganha telefone, URL da foto, `backupCodesRemaining` e, por vínculo, data de início e alunos ligados. Todas agem só sobre a conta da sessão; perfil e download recusam vínculo de portal ativo (403).
- Arquivos no S3: `FileStorage` hoje só grava em `org/<id>/` com a organização do contexto. A foto é da conta: precisa de pasta `account/<id>/`, com a conta vinda sempre da sessão.
- Interface: `AccountPage` passa a quatro abas nas duas áreas; telas com os quatro estados, 360 px e axe; textos em `pt-BR.json`; foto cortada no front com o `LogoCropDialog`.
- Segurança: senha e código de "Trocar de aparelho" passam por `TwoFactorService.confirm` (trava da RN-ACE-10); foto validada pelos bytes (`LogoImage.parse`); arquivo de dados com lista explícita de campos; `account`, `account_session` e `login_attempt` não têm RLS, então o filtro por conta é a barreira e tem teste de isolamento.

### Reuso

`AccessCard`, `TwoFactorSection`, `TwoFactorSetupDialog`, `SessionsSection`, `NotificationsTab`, `PortalPreferences` (`/auth/email-preferences`), `ChooseLinkTrigger`, `LogoCropDialog`, `LogoImage`, `NewUnit.phone`, `AccountAudit` (audita só na organização ativa da requisição, D5), `TwoFactorService.confirm` e `backupCodesRemaining`, `Tabs` e `useTabParam`.

### Arquivos por parte

Caminhos de back-end em `backend/src/main/java/br/com/ctcore/`; os de front em `frontend/src/`. "(novo)" é a criar.

**630a · Quatro abas na gestão e no portal, com Meus vínculos** (R1, R4, R5, R8, R9, R11; CA1, CA5 a CA7, CA11, CA12, CA14): cerca de 24 arquivos.
- Back: `V61` (políticas) (novo); `identity/SessionService.java` (`LinkView`, `view`) e a consulta dos alunos ligados (novo); `MigrationIT`; IT de isolamento dos vínculos (novo).
- Front: `features/account/AccountPage.tsx`, abas Segurança, Privacidade e Meus vínculos (3 novos), `NotificationsTab.tsx`, `AccountMenuList.tsx`, `AccessCard.tsx`, `TwoFactorSection.tsx`, `SessionsSection.tsx`, `features/auth/SessionProvider.tsx`, `i18n/pt-BR.json`, `mocks/handlers.ts`, `AccountPage.test.tsx`, `NotificationsTab.test.tsx`, `mocks/account.msw.test.ts`, `frontend/visual/casos.ts`, `frontend/e2e/minha-conta.spec.ts`, `estado-no-endereco.spec.ts`, `menu-lateral.spec.ts`.
- A `dev` fica verde: o Perfil nasce com Meus vínculos, que já é conteúdo, e Privacidade nasce com os botões "Em breve" (os dois de R11 no portal; na gestão, "Baixar meus dados", que a 630c liga).

**630b · Perfil: nome, telefone e foto da conta** (R2, R3; CA2 a CA4): cerca de 24 arquivos.
- Back: `V62` (`account.photo`) (novo); serviço e controller do perfil da conta (2 novos); `storage/FileStorage.java`, `storage/S3FileStorage.java`; `identity/SessionService.java` (`AccountView`); `MigrationIT`; IT do perfil e da foto com isolamento (novo); teste do armazenamento.
- Front: aba Perfil e o seu teste (2 novos), `AccountPage.tsx`, `AccountMenuList.tsx`, `SessionProvider.tsx`, `components/ui/avatar.tsx`, `components/layout/UserMenu.tsx`, `UserMenu.test.tsx`, `features/permissions/ManagementShell.tsx`, `features/portal/PortalAccount.tsx`, `PortalShell.tsx`, `pt-BR.json`, `handlers.ts`, `account.msw.test.ts`, `casos.ts`, `e2e/minha-conta.spec.ts`.

**630c · Trocar de aparelho, códigos de reserva e Baixar meus dados; fecha a #630** (R6, R7, R10; CA8 a CA10, CA13): cerca de 23 arquivos.
- Back: `V63` (segredo pendente) (novo); `identity/TwoFactorService.java`, `TwoFactorController.java`, `SessionService.java` (`TwoFactorView`); serviço e rota do download (2 novos); `MigrationIT`; IT da troca de aparelho e contagem (novo) e do download com isolamento (novo).
- Front: `TwoFactorSection.tsx`, `features/auth/TwoFactorSetupDialog.tsx`, a janela de troca (novo), aba Privacidade, `SessionProvider.tsx`, `pt-BR.json`, `handlers.ts`, `TwoFactorDialogs.test.tsx`, `AccountPage.test.tsx`, `twofactor.msw.test.ts`, teste da Privacidade (novo), `casos.ts`, `e2e/duas-etapas.spec.ts`.

CA15 vale em cada parte, para as telas que ela muda.

### Riscos

- Política nova de RLS em `student`, `guardian` e `student_guardian`: não pode abrir aluno a conta que não é o responsável dele nem permitir escrita (só `for select`), e não pode criar recursão entre políticas. Prova: IT de isolamento com o papel operacional.
- Os ids de `?aba=` mudam (`acesso`, `duas-etapas`, `sessoes` saem): conferir links internos, e2e e casos visuais.
- Trocar de aparelho sem manter o segredo anterior até a confirmação trancaria a pessoa fora da conta (D7).

## 6. Decisões

- D1 (muda o comportamento): a issue chama "Excluir minha conta" de "já existente", mas no código ele está "Em breve" e é a #118 (Sprint 13). Continua "Em breve" (R3 do canvas). Alternativa descartada: antecipar a #118, com anonimização e prazos que a issue não pede.
- D2 (muda o comportamento): "Baixar meus dados" é ligado só na gestão, com o arquivo de quem não é aluno (o "Pronto quando" cita Coordenador, Administrador e Professor). No portal segue "Em breve" até a #117, que traz o conteúdo da RN-LGP-04. Conta que também é responsável recebe na gestão o arquivo da conta; os dados de aluno entram na #117.
- D3: ids de aba em pt-BR; endereço antigo cai no tratamento atual de aba desconhecida, sem redirecionamento (são links internos).
- D4 (muda o comportamento): nome e telefone da conta não alteram o cadastro de Professor, responsável ou aluno, que tem campos próprios em cada organização. Nome é obrigatório; telefone é opcional.
- D5: a auditoria usa a regra já existente de `AccountAudit`: dentro de uma requisição, só a organização ativa é gravada (RLS, RN-ORG-01).
- D6 (muda o comportamento): no portal a foto não é editada, mas a que a conta já tiver aparece no avatar do topo. O servidor recusa alterar o perfil com vínculo de portal ativo.
- D7 (muda o comportamento): o segredo anterior vale até o código do app novo ser confirmado; só então é invalidado. Os códigos de reserva não mudam.
- D8 (muda o comportamento): no portal, a chave de comunicados por e-mail aparece também em Notificações; a de Minhas informações fica como está (RF-POR-07).
- D9 (muda o comportamento): o arquivo é um JSON. "Acessos" são as tentativas de login e as sessões da conta, com data, resultado e aparelho, com o IP mascarado (RN-ACE-25 não mostra o IP inteiro). "Consentimentos" são os aceites da conta, a preferência de e-mail dos vínculos e o consentimento do diretório de professor. O download é auditado.
- Suposição: o consentimento do diretório (`teacher.directory_consent`) de organização que não é a ativa também pode precisar de política de leitura por conta; se precisar, entra na migração da 630c.
- D10 (P18, divisão; decisão do dono, 27/11/2026): aprovada a opção recomendada. Mensagem do dono na conversa, repassada a esta fase pelo agente que a acionou: "avance sem interrupções, se precisar de alguma ação minha, faça o que você me recomendaria [...] se for necessario alguma decisão minha, pode seguir com 'sim' ou a opção que você me recomendaria". É uma autorização geral, que o agente que acionou a fase apresentou como a resposta à P18; esta fase não viu a mensagem original. A #630 vira item-mãe, sem construção própria, em três partes, nesta ordem, cada uma com a sua issue e o seu PR, antes da #636: 630a (R1, R4, R5, R8, R9, R11; CA1, CA5 a CA7, CA11, CA12, CA14), 630b (R2, R3; CA2 a CA4) e 630c (R6, R7, R10; CA8 a CA10, CA13), com CA15 em cada uma. O PR da 630c fecha também a #630. Alternativa descartada: um PR só, acima do limite.
