# Backlog — ctcore

Origem dos itens: issues do repositório no GitHub (194 issues: 17 fechadas e 177 abertas, nenhuma com responsável; metadados conferidos em 17/10/2026). A ordem das linhas é a ordem de trabalho: marco (sprint) crescente e, dentro dele, número da issue (na Sprint 10.5, as issues #437 a #501 seguem a ordem de execução do plano, ver "Dependências"). As issues prevalecem sobre este arquivo; ele só espelha e aponta, não copia o conteúdo. Regras e fluxo: `AGENTS.md` e `docs/plano-de-sprints.md`.

Sprint liberada: Sprint 10.5 (Identidade visual). O dono confirmou em 29/10/2026 que a Sprint 10 foi revisada e fechada e liberou a Sprint 10.5 (#414 a #423). Em 30/10/2026 o dono aprovou o plano de issues da auditoria do canvas e as #437 a #501 entraram nessa mesma sprint liberada (plano em `docs/auditoria/plano-de-issues.md`). Em 19/11/2026 o dono trocou a cobrança por alunos ativos pela cobrança por vaga de Administrador e mandou os ajustes no que já foi entregue para a 10.5: #608 a #611 (o resto entrou nas issues das Sprints 13 a 16 que ainda não foram feitas). Na mesma data, o dono reorganizou Configurações, tirou a cor da organização, pediu dados novos da unidade, a exigência de duas etapas para Administradores e o ajuste do menu lateral e da rolagem, e Minha conta em abas com conteúdo: #624 a #628, #630 a #636 e #638 a #640 (decisões 19 a 32 em `docs/auditoria/decisoes-canvas.md`). Em 20/11/2026, a partir das anotações de teste do dono, entraram #643 a #662 (padrões gerais de tela, navegação sem recarregar, movimento, seed e ajustes de Financeiro, Operação, Pessoas e Comunicação; a #643 e a #644 vêm antes da #498) e as #122 a #124 (Início) foram trazidas da Sprint 13, com o que depende de sprint futura em "Em breve" (decisões 33 e 34). Na mesma data entrou a #664, revisão de textos pelo guia `docs/design/textos.md`, por último no lote (decisão 35). Ainda em 20/11/2026 entrou a #671 (seed de homologação recriado automaticamente pela API e conteúdo com cara real, no Rio), logo depois da #499 e antes da #500; ela substitui a #662. Ainda em 20/11/2026 entraram as #675 a #677 (estrutura de rotas e telas do front: moldura montada uma vez na rota-pai, estado da tela no endereço e o padrão escrito e cobrado no CI), logo depois da #501 e antes da #608, porque a #611, a #624, a #625, a #630 e a #645 dependem delas. A 10.5 entra antes da Sprint 11. A Sprint 11 fica para depois da 10.5 e começa retomando a #96 do branch `item/96-porta-de-pagamento-simulador` (trabalho em andamento, já enviado, sem PR). Só o dono libera a seguinte.

Dependências: cada issue declara apenas dependência de sprint ("Depende de: Sprint anterior"), que a ordem já cobre; por isso a coluna fica "—". Exceção declarada no plano: #5 e #11 ficaram só com a parte que o agente faz sozinho; hospedagem e publicação são #192 e #193. Na Sprint 10.5, as issues #437 a #501 trazem na coluna as dependências entre itens do plano (as mesmas marcadas como "bloqueada por" no GitHub) e as linhas seguem a ordem de execução do plano `docs/auditoria/plano-de-issues.md`: Fase 1 (bugs, regras e itens técnicos, #437 a #449, com a #435 logo depois da #448), Fase 2 (componentes, na sequência #450, #452, #453, #434, #454, #455, #456, #457, #458, #459, #460, #451, #461, #462, #463, #464) e Fase 3 (telas por área, #465 a #501).

| ID | Item | Origem | Sprint | Depende de | Quem executa | Situação |
|---|---|---|---|---|---|---|
| 1 | Estrutura do monorepo e ambiente local | issue #1 | Sprint 00 | — | agente | feito |
| 2 | Projeto back-end: Spring Boot, Flyway e erros da API | issue #2 | Sprint 00 | — | agente | feito |
| 3 | Esqueleto do OpenAPI em /api/v1 | issue #3 | Sprint 00 | — | agente | feito |
| 4 | Agendador de tarefas com trava e recursos por organização | issue #4 | Sprint 00 | — | agente | feito |
| 5 | Logs estruturados e métricas de monitoramento | issue #5 | Sprint 00 | — | agente | feito |
| 6 | Portas das conexões externas com versões simuladas | issue #6 | Sprint 00 | — | agente | feito |
| 7 | Projeto front-end, tema claro e escuro e textos em pt-BR | issue #7 | Sprint 00 | — | agente | feito |
| 8 | Componentes base e padrões de tela | issue #8 | Sprint 00 | — | agente | feito |
| 9 | Campos e formatos brasileiros, datas relativas e botão de WhatsApp | issue #9 | Sprint 00 | — | agente | feito |
| 10 | Esteira de CI do monorepo | issue #10 | Sprint 00 | — | agente | feito |
| 11 | Branches dev e main e publicação preparada (sem hospedagem) | issue #11 | Sprint 00 | — | agente | feito |
| 12 | Script de dados fictícios | issue #12 | Sprint 00 | — | agente | feito |
| 13 | Organização, unidade, configurações e limites no banco | issue #13 | Sprint 01 | — | agente | feito |
| 14 | Isolamento entre organizações: contexto, filtro e row-level security | issue #14 | Sprint 01 | — | agente | feito |
| 15 | Teste-modelo de isolamento e permissão no servidor | issue #15 | Sprint 01 | — | agente | feito |
| 16 | Arquivos por organização com URLs temporárias assinadas | issue #16 | Sprint 01 | — | agente | feito |
| 17 | Serviço único de auditoria | issue #17 | Sprint 01 | — | agente | feito |
| 18 | Conta, vínculo, sessão e convite no servidor | issue #18 | Sprint 02 | — | agente | feito |
| 19 | Serviço de envio de e-mail e e-mails de conta | issue #19 | Sprint 02 | — | agente | feito |
| 20 | RF-ACE-01 · Tela de login | issue #20 | Sprint 02 | — | agente | feito |
| 21 | RF-ACE-02 · Criar senha pelo convite | issue #21 | Sprint 02 | — | agente | feito |
| 22 | RF-ACE-03 · Recuperação de senha e nova senha | issue #22 | Sprint 02 | — | agente | feito |
| 23 | RF-ACE-05 · Escolha de organização e área | issue #23 | Sprint 02 | — | agente | feito |
| 24 | RF-ACE-07 · Registrar o último acesso a cada login | issue #24 | Sprint 02 | — | agente | feito |
| 25 | RF-ACE-08 · Tela de área indisponível para o perfil | issue #25 | Sprint 02 | — | agente | feito |
| 231 | Limites de tempo (timeout) nos jobs do CI | issue #231 | Sprint 02 | — | agente | feito |
| 26 | Duas etapas (TOTP), códigos de reserva e senha nas ações críticas | issue #26 | Sprint 03 | — | agente | feito |
| 27 | Tabela de permissões aplicada no servidor | issue #27 | Sprint 03 | — | agente | feito |
| 28 | RF-ORG-01 · Configurações › Organização | issue #28 | Sprint 03 | — | agente | feito |
| 29 | RF-ORG-02 · Configurações › Unidades (lista) | issue #29 | Sprint 03 | — | agente | feito |
| 30 | RF-ORG-03 · Assistente de nova unidade | issue #30 | Sprint 03 | — | agente | feito |
| 31 | RF-ORG-04 · Configurações › Unidade | issue #31 | Sprint 03 | — | agente | feito |
| 32 | RF-ORG-05 · Seletor de unidade e "Todas as unidades" | issue #32 | Sprint 03 | — | agente | feito |
| 33 | RF-ORG-06 · Transferir coordenação | issue #33 | Sprint 03 | — | agente | feito |
| 34 | RF-ORG-07 · Desativar unidade | issue #34 | Sprint 03 | — | agente | feito |
| 35 | RF-ORG-08 · "Última alteração" e auditoria das configurações | issue #35 | Sprint 03 | — | agente | feito |
| 36 | RF-ACE-04 · Minha conta: senha, e-mail, duas etapas e sessões | issue #36 | Sprint 03 | — | agente | feito |
| 37 | RF-ACE-06 · Configurações › Usuários | issue #37 | Sprint 03 | — | agente | feito |
| 38 | RF-MOD-01 · Configurações › Modalidades | issue #38 | Sprint 04 | — | agente | feito |
| 39 | RF-MOD-02 · Graduação por modalidade e editor do sistema de graduação | issue #39 | Sprint 04 | — | agente | feito |
| 40 | RF-MOD-03 · Modalidades oferecidas pela unidade | issue #40 | Sprint 04 | — | agente | feito |
| 41 | RF-MOD-04 · Configurações › Faixas etárias | issue #41 | Sprint 04 | — | agente | feito |
| 42 | RF-PRO-01 · Pessoas › Professores (lista) | issue #42 | Sprint 04 | — | agente | feito |
| 43 | RF-PRO-02 · Painel do professor | issue #43 | Sprint 04 | — | agente | feito |
| 44 | RF-PRO-03 · Cadastro e edição de professor | issue #44 | Sprint 04 | — | agente | feito |
| 45 | RF-PRO-04 · Inativar professor | issue #45 | Sprint 04 | — | agente | feito |
| 46 | RF-TUR-01 · Operação › Turmas (lista) | issue #46 | Sprint 05 | — | agente | feito |
| 47 | RF-TUR-02 · Painel da turma | issue #47 | Sprint 05 | — | agente | feito |
| 48 | RF-TUR-03 · Janela de turma | issue #48 | Sprint 05 | — | agente | feito |
| 49 | RF-AGE-01 · Operação › Agenda | issue #49 | Sprint 05 | — | agente | feito |
| 50 | RF-AGE-02 · Painel da aula | issue #50 | Sprint 05 | — | agente | feito |
| 51 | RF-AGE-03 · Editar e cancelar aula | issue #51 | Sprint 05 | — | agente | feito |
| 52 | RF-AGE-04 · Nova aula avulsa | issue #52 | Sprint 05 | — | agente | feito |
| 53 | RF-AGE-05 · Dias sem aula | issue #53 | Sprint 05 | — | agente | feito |
| 54 | Cadastro de aluno e responsáveis no servidor | issue #54 | Sprint 06 | — | agente | feito |
| 55 | RF-PLA-01 · Financeiro › Planos e benefícios | issue #55 | Sprint 06 | — | agente | feito |
| 56 | RF-PLA-02 · Tabela de planos | issue #56 | Sprint 06 | — | agente | feito |
| 57 | RF-PLA-03 · Janela de plano | issue #57 | Sprint 06 | — | agente | feito |
| 58 | RF-ALU-01 · Pessoas › Alunos (lista e filtros) | issue #58 | Sprint 06 | — | agente | feito |
| 59 | RF-ALU-02 · Selos do aluno | issue #59 | Sprint 06 | — | agente | feito |
| 60 | RF-ALU-03 · Ficha do aluno em painel lateral | issue #60 | Sprint 06 | — | agente | feito |
| 61 | RF-ALU-04 · Editar dados pessoais do aluno | issue #61 | Sprint 06 | — | agente | feito |
| 62 | RF-ALU-06 · Aniversariantes do dia | issue #62 | Sprint 06 | — | agente | feito |
| 63 | Matrícula no servidor: modalidades, transferência e retorno | issue #63 | Sprint 07 | — | agente | feito |
| 64 | RF-BEN-01 · Tabela de benefícios | issue #64 | Sprint 07 | — | agente | feito |
| 65 | RF-BEN-02 · Conceder benefício | issue #65 | Sprint 07 | — | agente | feito |
| 66 | RF-BEN-03 · Encerrar benefício | issue #66 | Sprint 07 | — | agente | feito |
| 67 | RF-MAT-01 · Nova matrícula em etapas | issue #67 | Sprint 07 | — | agente | feito |
| 68 | RF-MAT-02 · Avisos de faixa etária e capacidade na matrícula | issue #68 | Sprint 07 | — | agente | feito |
| 69 | RF-MAT-03 · Encerrar modalidade | issue #69 | Sprint 07 | — | agente | feito |
| 70 | RF-MAT-05 · Configurações › Termos | issue #70 | Sprint 07 | — | agente | feito |
| 71 | Geração de cobranças e primeira cobrança no servidor | issue #71 | Sprint 08 | — | agente | feito |
| 72 | RF-COB-01 · Financeiro › Cobranças (lista) | issue #72 | Sprint 08 | — | agente | feito |
| 73 | RF-COB-02 · Painel da cobrança | issue #73 | Sprint 08 | — | agente | feito |
| 318 | Teste CA20 da aba Financeiro instável: medir e estabilizar | issue #318 | Sprint 08 | — | agente | feito |
| 320 | Teste e2e de recuperação de senha instável: medir e estabilizar | issue #320 | Sprint 08 | — | agente | feito |
| 74 | RF-COB-03 · Prévia da geração de mensalidades | issue #74 | Sprint 08 | — | agente | feito |
| 75 | RF-COB-04 · Registrar pagamento no balcão | issue #75 | Sprint 08 | — | agente | feito |
| 76 | RF-COB-07 · Cobrança avulsa e gerar mensalidades adiantadas | issue #76 | Sprint 08 | — | agente | feito |
| 77 | RF-COB-08 · Recebimentos do dia | issue #77 | Sprint 08 | — | agente | feito |
| 331 | Teste ChargeRenegotiationIT.invalid falha entre 21h e 24h de Brasília: data do teste em UTC contra a data da unidade | issue #331 | Sprint 08 | — | agente | feito |
| 333 | Testes de tela com "Carregando..." instáveis: delay curto e asserção do estado transitório | issue #333 | Sprint 08 | — | agente | feito |
| 338 | Recibo: CPF mascarado no PDF do link público e completo só com sessão | issue #338 | Sprint 08 | — | agente | feito |
| 340 | Piso de 100% de linhas em src/features/charges | issue #340 | Sprint 08 | — | agente | feito |
| 78 | E-mails automáticos e preferências de envio | issue #78 | Sprint 09 | — | agente | feito |
| 79 | RF-COB-06 · Cobranças em atraso e envio de lembrete | issue #79 | Sprint 09 | — | agente | feito |
| 80 | RF-COB-09 · Configurações › Unidade › Lembretes | issue #80 | Sprint 09 | — | agente | feito |
| 81 | RF-COM-01 · Comunicação › Comunicados (lista) | issue #81 | Sprint 09 | — | agente | feito |
| 82 | RF-COM-02 · Novo comunicado | issue #82 | Sprint 09 | — | agente | feito |
| 83 | RF-COM-03 · Configurações › Textos | issue #83 | Sprint 09 | — | agente | feito |
| 84 | RF-NOT-01 · Painel do sino (notificações) | issue #84 | Sprint 09 | — | agente | feito |
| 342 | Afirmar que o aluno com bolsa de 100% continua Ativo | issue #342 | Sprint 09 | — | agente | feito |
| 343 | Cache do Playwright que valha para PR novo e instalação do Chromium estável | issue #343 | Sprint 09 | — | agente | feito |
| 344 | aguardar-ci.sh: resultado recuperável de um watcher órfão | issue #344 | Sprint 09 | — | agente | feito |
| 352 | Cobertura de billing cai para 0,99 conforme o horário: o ramo "Cobrança" do ChargeNoticeJob só é coberto pelo agendador por acaso | issue #352 | Sprint 09 | — | agente | feito |
| 358 | AuditServiceIT.writesDiffWithoutSecrets instável: '4111' coincide com carimbo de hora do log | issue #358 | Sprint 09 | — | agente | feito |
| 362 | Teste e2e da matrícula instável: estouro horizontal a 360 px (CA24) | issue #362 | Sprint 09 | — | agente | feito |
| 372 | Log sem a exceção inteira nos jobs da Sprint 09 | issue #372 | Sprint 09 | — | agente | feito |
| 374 | Atualizar a especificação com as decisões da Sprint 09 | issue #374 | Sprint 09 | — | agente | feito |
| 378 | Encaixes da Sprint 09 no backlog | issue #378 | Sprint 09 | — | agente | feito |
| 363 | Fechar a medição do CA4 da #343: tempo do job e2e em mais 4 PRs | issue #363 | Sprint 10 | — | agente | feito |
| 368 | Testes e2e poderem sobrescrever respostas do MSW por teste (worker.use) | issue #368 | Sprint 10 | — | agente | feito |
| 85 | Aceite do termo e confirmações no portal | issue #85 | Sprint 10 | — | agente | feito |
| 86 | RF-MAT-04 · Pedidos do portal | issue #86 | Sprint 10 | — | agente | feito |
| 87 | RF-COB-05 · Comprovantes em conferência | issue #87 | Sprint 10 | — | agente | feito |
| 88 | RF-POR-01 · Portal: barra e navegação | issue #88 | Sprint 10 | — | agente | feito |
| 89 | RF-POR-02 · Portal: Início | issue #89 | Sprint 10 | — | agente | feito |
| 90 | RF-POR-03 · Portal: carteirinha | issue #90 | Sprint 10 | — | agente | feito |
| 91 | RF-POR-04 · Portal: Agenda | issue #91 | Sprint 10 | — | agente | feito |
| 92 | RF-POR-05 · Portal: Financeiro | issue #92 | Sprint 10 | — | agente | feito |
| 93 | RF-POR-06 · Portal: Avisos | issue #93 | Sprint 10 | — | agente | feito |
| 94 | RF-POR-07 · Portal: Minhas informações | issue #94 | Sprint 10 | — | agente | feito |
| 385 | Teste LessonPanelPage instável no test:cov: medir e estabilizar (antes da #95: trava a regressão do front) | issue #385 | Sprint 10 | — | agente | feito |
| 95 | RF-POR-08 · Portal: estados de tela | issue #95 | Sprint 10 | — | agente | feito |
| 386 | Teste e2e comprovantes instável: medir e estabilizar | issue #386 | Sprint 10 | — | agente | feito |
| 388 | Teste e2e "gestão recusa e confirma comprovantes (light)" estoura 30 s na suíte inteira | issue #388 | Sprint 10 | — | agente | feito |
| 390 | ChargeNoticeIT.minor instável: o agendador envia o aviso ao aluno menor antes de o teste ligar o responsável | issue #390 | Sprint 10 | — | agente | feito |
| 402 | Teste ChargeNoticeIT e BillingFixtures dependem da data de hoje: remover o vencimento fixo de 2026-11-10 | issue #402 | Sprint 10 | — | agente | feito |
| 403 | Teste UnitSettingsPage CA17 instável no test:cov: medir e estabilizar | issue #403 | Sprint 10 | — | agente | feito |
| 404 | Ajustar a especificação e o marco com as decisões da Sprint 10 (R10-3, D1, D2) | issue #404 | Sprint 10 | — | agente | feito |
| 405 | Agenda do portal mostra o nome do professor (D2) | issue #405 | Sprint 10 | 404 | agente | feito |
| 414 | Base visual: tokens de cor, fontes e tema escuro do canvas | issue #414 | Sprint 10.5 | — | agente | feito |
| 415 | Componentes base no padrão do canvas | issue #415 | Sprint 10.5 | — | agente | feito |
| 416 | Teste visual: referências das telas e comparação lado a lado com o canvas | issue #416 | Sprint 10.5 | — | agente | feito |
| 417 | Estrutura da gestão: menu lateral, barra de cima, cabeçalho e versão de celular | issue #417 | Sprint 10.5 | — | agente | feito |
| 418 | Estrutura do portal do aluno: barra com a marca, abas e versão de celular | issue #418 | Sprint 10.5 | — | agente | feito |
| 419 | Telas de acesso, conta, configurações e usuários no visual do canvas (Sprints 01 a 03) | issue #419 | Sprint 10.5 | — | agente | feito |
| 420 | Modalidades, faixas etárias, professores, turmas e agenda no visual do canvas (Sprints 04 e 05) | issue #420 | Sprint 10.5 | — | agente | feito |
| 421 | Planos, alunos, ficha, responsáveis, matrícula e benefícios no visual do canvas (Sprints 06 e 07) | issue #421 | Sprint 10.5 | — | agente | feito |
| 422 | Cobranças, comunicação, notificações, pedidos e conferência no visual do canvas (Sprints 08 a 10, gestão) | issue #422 | Sprint 10.5 | — | agente | feito |
| 423 | Páginas do portal do aluno e do responsável no visual do canvas (Sprint 10) | issue #423 | Sprint 10.5 | — | agente | feito |
| 437 | Cobranças e Comunicados somem do menu da gestão | issue #437 | Sprint 10.5 | — | agente | feito |
| 438 | "Avisar turma" abre o comunicado vazio em vez do aviso pronto | issue #438 | Sprint 10.5 | — | agente | feito |
| 439 | Prévia da geração fica em branco com um motivo sem chave de tradução | issue #439 | Sprint 10.5 | — | agente | feito |
| 440 | Botão de tema invisível na barra escura do portal, no tema claro | issue #440 | Sprint 10.5 | — | agente | feito |
| 448 | Técnica · Captura do teste visual com o navegador em pt-BR (antes da Fase 2) | issue #448 | Sprint 10.5 | — | agente | feito |
| 435 | Comparação automática com o canvas e cobertura do teste visual | issue #435 | Sprint 10.5 | #448 | agente | feito |
| 441 | Revogar uso de imagem no portal sem confirmação | issue #441 | Sprint 10.5 | — | agente | feito |
| 442 | MSW: agenda do Professor devolve todas as aulas da unidade | issue #442 | Sprint 10.5 | — | agente | feito |
| 443 | Professor chega à ficha do aluno pela aula (com a permissão "ver ficha do aluno") | issue #443 | Sprint 10.5 | — | agente | feito |
| 444 | Gerar códigos de reserva sem a confirmação de senha e código | issue #444 | Sprint 10.5 | — | agente | feito |
| 445 | Login travado devolve o horário de liberação (429) | issue #445 | Sprint 10.5 | — | agente | feito |
| 446 | Botão "Ver alunos" do painel da turma está sempre desabilitado | issue #446 | Sprint 10.5 | — | agente | feito |
| 447 | Retenção de 30 dias das notificações da equipe (RN-NOT-05) | issue #447 | Sprint 10.5 | — | agente | feito |
| 449 | Técnica · Dados do MSW para as telas que ficaram "sem comparar" | issue #449 | Sprint 10.5 | — | agente | feito |
| 450 | Componente base: Padrão "Em breve" (R3): item visível e desabilitado, sem backend | issue #450 | Sprint 10.5 | #448 | agente | feito |
| 452 | Componente base: Selos, avatar e graduação (faixa visual) | issue #452 | Sprint 10.5 | #448 | agente | feito |
| 453 | Componente base: Campos: data, arquivo, interruptor, caixa, cartão de escolha e código em 6 caixas | issue #453 | Sprint 10.5 | #448 | agente | feito |
| 434 | Botão de sair da conta na gestão e no portal | issue #434 | Sprint 10.5 | — | agente | feito |
| 454 | Componente base: Moldura da gestão: menu lateral, barra de cima, cabeçalho, seletor de unidade e menu do celular | issue #454 | Sprint 10.5 | #448 | agente | feito |
| 455 | Componente base: Moldura do portal e shell das telas de acesso | issue #455 | Sprint 10.5 | #448 | agente | feito |
| 456 | Componente base: Busca e filtro em pílula | issue #456 | Sprint 10.5 | #448 | agente | feito |
| 457 | Componente base: Abas com contagem, paginação e folha de filtros no celular | issue #457 | Sprint 10.5 | #448, #456 | agente | feito |
| 458 | Componente base: Tabela em cartões no celular | issue #458 | Sprint 10.5 | #448 | agente | feito |
| 459 | Componente base: Linha de lista com avatar (usa os blocos da C10) | issue #459 | Sprint 10.5 | #448, #458, #452 | agente | feito |
| 460 | Componente base: Janela base: tamanhos, título em caixa alta e rodapé fixo | issue #460 | Sprint 10.5 | #448 | agente | feito |
| 451 | Componente base: Botão destrutivo e confirmação de ação sensível | issue #451 | Sprint 10.5 | #448, #460 | agente | feito |
| 461 | Componente base: Janela: blocos de resumo, motivo e cartões de escolha | issue #461 | Sprint 10.5 | #448, #460 | agente | feito |
| 462 | Componente base: Janela: passos e bloqueio com checklist | issue #462 | Sprint 10.5 | #448, #460 | agente | feito |
| 463 | Componente base: Gaveta lateral e popover | issue #463 | Sprint 10.5 | #448 | agente | feito |
| 464 | Componente base: Estados: carregando, vazio, erro, sem permissão, bloqueio e link vencido | issue #464 | Sprint 10.5 | #448 | agente | feito |
| 465 | Alunos: lista, filtros, estados e celular no visual do canvas | issue #465 | Sprint 10.5 | #454, #456, #457, #458, #459, #464, #452, #450 | agente | feito |
| 466 | Ficha do aluno: cabeçalho, Resumo e celular no visual do canvas | issue #466 | Sprint 10.5 | #460, #461, #463, #452, #450, #449 | agente | feito |
| 467 | Ficha do aluno: abas Matrícula, Financeiro, Graduações, Responsáveis e Histórico no visual do canvas | issue #467 | Sprint 10.5 | #466, #458, #459, #452, #450, #449 | agente | feito |
| 468 | Janelas de ação do aluno: encerrar modalidade, trocar turma e plano, transferir, desligar responsável no visual do canvas | issue #468 | Sprint 10.5 | #460, #461, #451 | agente | feito |
| 469 | Assistente de matrícula (etapas 1 a 5) no visual do canvas | issue #469 | Sprint 10.5 | #453, #460, #461, #462, #450 | agente | feito |
| 470 | Professores: lista, novo, painel, inativar e recusa de modalidade no visual do canvas | issue #470 | Sprint 10.5 | #456, #457, #458, #459, #460, #461, #463, #452 | agente | feito |
| 471 | Pedidos do portal na gestão: lista e janelas de recusar e aprovar no visual do canvas | issue #471 | Sprint 10.5 | #456, #457, #460, #461, #450 | agente | feito |
| 472 | Agenda: grade semanal, celular e visão do Professor no visual do canvas | issue #472 | Sprint 10.5 | #454, #456, #457, #458, #459, #464 | agente | feito |
| 473 | Aula: painel, editar, cancelar, corrigir, avisar turma e aula avulsa no visual do canvas | issue #473 | Sprint 10.5 | #460, #461, #463, #451, #450 | agente | feito |
| 474 | Dias sem aula: lista, feriados sugeridos, novo dia no visual do canvas | issue #474 | Sprint 10.5 | #458, #459, #460, #461 | agente | feito |
| 475 | Turmas: lista, painel, editar, desativar e titular inativo no visual do canvas | issue #475 | Sprint 10.5 | #456, #457, #458, #459, #460, #461, #462, #463, #452 | agente | feito |
| 569 | Técnica: construir e verificar rodam o teste visual do CI contra as referências commitadas antes do push | issue #569 | Sprint 10.5 | — | agente | feito |
| 476 | Cobranças: lista, filtros, celular e estados no visual do canvas | issue #476 | Sprint 10.5 | #456, #457, #458, #459, #464, #450, #449 | agente | feito |
| 477 | Painel da cobrança e janelas: registrar, renegociar, cancelar, nova avulsa e gerar próximas no visual do canvas | issue #477 | Sprint 10.5 | #460, #461, #463, #451, #450, #449 | agente | feito |
| 478 | Em atraso, conferência de comprovantes e comprovante de várias cobranças no visual do canvas | issue #478 | Sprint 10.5 | #458, #459, #460, #461, #450, #449 | agente | feito |
| 479 | Recebimentos do dia e Prévia da geração no visual do canvas | issue #479 | Sprint 10.5 | #458, #459, #464, #449 | agente | feito |
| 480 | Planos e benefícios: resumo, tabela de planos, editar, desativar e reativar no visual do canvas | issue #480 | Sprint 10.5 | #458, #459, #460, #461, #451 | agente | feito |
| 481 | Benefícios: lista, conceder, encerrar e substituir no visual do canvas | issue #481 | Sprint 10.5 | #456, #457, #460, #461, #452 | agente | feito |
| 482 | Organização: marca, regras da organização, contraste e transferir coordenação no visual do canvas | issue #482 | Sprint 10.5 | #453, #460, #461, #450 | agente | feito |
| 483 | Unidade: abas Dados, Pagamentos, Lembretes, Links e Permissões do Professor no visual do canvas | issue #483 | Sprint 10.5 | #453, #458, #459, #450 | agente | feito |
| 484 | Unidades: lista, nova unidade, desativar e unidade única no visual do canvas | issue #484 | Sprint 10.5 | #460, #461, #462, #451, #450 | agente | feito |
| 485 | Modalidades: lista, graduação, recusa e desativar no visual do canvas | issue #485 | Sprint 10.5 | #458, #459, #460, #461, #462, #452 | agente | feito |
| 486 | Faixas etárias no visual do canvas | issue #486 | Sprint 10.5 | #458, #459 | agente | feito |
| 487 | Usuários: lista, convidar e tabela de permissões no visual do canvas | issue #487 | Sprint 10.5 | #456, #457, #458, #459, #460, #461, #452 | agente | feito |
| 488 | Termos e Textos no visual do canvas | issue #488 | Sprint 10.5 | #453, #460, #461 | agente | feito |
| 489 | Telas de acesso: login, duas etapas, travado, recuperar e nova senha, convite, escolha de organização e sem acesso no visual do canvas | issue #489 | Sprint 10.5 | #455, #453, #464 | agente | feito |
| 490 | Minha conta: abas, duas etapas, códigos de reserva, notificações e sessões no visual do canvas | issue #490 | Sprint 10.5 | #453, #460, #461, #450 | agente | feito |
| 491 | Comunicados: lista, novo, cancelar agendado, limite diário e organização inteira no visual do canvas | issue #491 | Sprint 10.5 | #456, #457, #453, #458, #459, #460, #461, #450 | agente | feito |
| 492 | Notificações: popover, grupos e "Marcar todas como lidas" no visual do canvas | issue #492 | Sprint 10.5 | #463, #450 | agente | feito |
| 493 | Início do portal: tudo em dia, estados, responsável e Toda a família no visual do canvas | issue #493 | Sprint 10.5 | #455, #464, #450 | agente | feito |
| 494 | Termo de matrícula no visual do canvas | issue #494 | Sprint 10.5 | #455, #453, #450, #449 | agente | feito |
| 495 | Agenda do portal no visual do canvas | issue #495 | Sprint 10.5 | #455, #456, #457, #458, #459 | agente | feito |
| 519 | Testes instáveis sob carga na regressão completa (e2e e test:cov) | issue #519 | Sprint 10.5 | — | agente | feito |
| 496 | Avisos e aviso aberto no visual do canvas | issue #496 | Sprint 10.5 | #456, #457, #460, #461, #450 | agente | feito |
| 497 | Financeiro do portal e Pix na chave no visual do canvas | issue #497 | Sprint 10.5 | #458, #459, #460, #461, #450, #449 | agente | feito |
| 498 | Minhas informações, editar contato e Minha conta do portal no visual do canvas | issue #498 | Sprint 10.5 | #455, #453, #460, #461, #450, #449 | agente | feito |
| 643 | RNF-43 · Navegação sem recarregar a página (links internos pelo roteador) | issue #643 | Sprint 10.5 | — | agente | feito |
| 582 | NoClassDayReadIT.lists falha: canEdit falso (agenda) | issue #582 | Sprint 10.5 | — | agente | feito |
| 644 | Seed com dados realistas e contas fáceis e seed para homologação | issue #644 | Sprint 10.5 | — | agente | feito |
| 499 | Carteirinha no visual do canvas | issue #499 | Sprint 10.5 | #455, #452, #450 | agente | feito |
| 671 | Seed de homologação: recriar o stg automaticamente e dados com cara real (Rio, nome.sobrenome) | issue #671 | Sprint 10.5 | #644 | agente | feito |
| 500 | Pedidos do portal e pedido indisponível no visual do canvas | issue #500 | Sprint 10.5 | #458, #459, #460, #461, #450 | agente | feito |
| 501 | Portal reduzido (aluno sem modalidade ativa) no visual do canvas | issue #501 | Sprint 10.5 | #455, #497, #498, #499 | agente | feito |
| 675 | RNF-43 · Moldura fixa na rota: menu e barra montados uma vez, mapa único de rotas e página não encontrada | issue #675 | Sprint 10.5 | #643 | agente | feito |
| 676 | RNF-27/43 · Estado da tela no endereço: painéis como rota-filha, filtros preservados e abas no endereço | issue #676 | Sprint 10.5 | #675 | agente | feito |
| 677 | Padrão de rotas e telas: regras no AGENTS.md e no design, RNF nova e testes que reprovam tela fora do padrão | issue #677 | Sprint 10.5 | #675, #676 | agente | feito |
| 608 | RN-ACE-23 · Sessão única de gestão por conta | issue #608 | Sprint 10.5 | — | agente | feito |
| 688 | Teste e2e da Agenda falha às segundas-feiras: mock trata hoje como dia sem aula; usar relógio fixo | issue #688 | Sprint 10.5 | — | agente | feito |
| 692 | Dia sem aula do mock fixo em 27/11: calcular do relógio e fixar o relógio em no-class-days e comunicados (antes de 30/11) | issue #692 | Sprint 10.5 | #688 | agente | feito |
| 693 | Migrar testes antigos que dependem de "hoje" para relógio fixo | issue #693 | Sprint 10.5 | #692 | agente | feito |
| 690 | Suspeita de instabilidade: SeedLoginIT e limpeza de banco dos ITs com chave estrangeira | issue #690 | Sprint 10.5 | #688 | agente | feito |
| 609 | RF-ORG-06 · Transferir coordenação: antigo Coordenador sem acesso por padrão, com escolha de unidades e custo | issue #609 | Sprint 10.5 | — | agente | feito |
| 610 | RF-PRO-02 · Remover acesso do professor sem inativar o cadastro | issue #610 | Sprint 10.5 | — | agente | feito |
| 611 | RF-ACE-06 · Pessoas › Administradores no lugar de Configurações › Usuários, com o custo da vaga | issue #611 | Sprint 10.5 | #610 | agente | a fazer |
| 624 | Menu lateral e rolagem: ícones só nos grupos, painel flutuante no recolhido, um grupo aberto e barra de rolagem discreta em todo o sistema | issue #624 | Sprint 10.5 | — | agente | a fazer |
| 625 | RF-ORG-09 · Configurações em quatro itens com abas: Organização, Unidades, Assinatura e Dados e segurança | issue #625 | Sprint 10.5 | #611, #624 | agente | a fazer |
| 626 | RNF-22 · Retirar a cor da organização: marca só com nome e logo | issue #626 | Sprint 10.5 | #625 | agente | a fazer |
| 627 | Dados novos: redes da organização; fotos, horário, apresentação e Instagram da unidade | issue #627 | Sprint 10.5 | #625 | agente | a fazer |
| 628 | RN-ACE-24 · Exigir duas etapas dos Administradores | issue #628 | Sprint 10.5 | #625 | agente | a fazer |
| 630 | RF-ACE-04 · Minha conta em abas com conteúdo: Perfil, Segurança, Notificações e Privacidade | issue #630 | Sprint 10.5 | #608 | agente | a fazer |
| 631 | RN-ACE-25 · Atividade recente em Minha conta › Segurança | issue #631 | Sprint 10.5 | #630 | agente | a fazer |
| 632 | RF-PRO-05 · Minha conta › Perfil de professor com o consentimento do diretório | issue #632 | Sprint 10.5 | #630 | agente | a fazer |
| 633 | RF-MOD-01 a 03 · Modalidades e graduação mais claras: cartões, janela, editor de níveis e modalidades da unidade | issue #633 | Sprint 10.5 | #625 | agente | a fazer |
| 634 | RF-ACE-09 · Tabela de permissões com selos em texto, por área e com o estado das chaves da unidade | issue #634 | Sprint 10.5 | #611, #625 | agente | a fazer |
| 635 | RF-ORG-04 · Bloco "Vale para todas as unidades" nas abas da unidade | issue #635 | Sprint 10.5 | #625 | agente | a fazer |
| 636 | RN-MAT-21 · Termo de matrícula com os dados da unidade (CNPJ e endereço) | issue #636 | Sprint 10.5 | — | agente | a fazer |
| 638 | RN-COB-17 · Uma chave por lembrete na aba Lembretes da unidade | issue #638 | Sprint 10.5 | — | agente | a fazer |
| 639 | RN-MAT-16a · Chaves dos pedidos pelo portal por unidade | issue #639 | Sprint 10.5 | #625 | agente | a fazer |
| 640 | RF-ORG-10 · Configurações › Visão geral: quadros por unidade e por pessoa | issue #640 | Sprint 10.5 | #625, #627, #628, #638, #639 | agente | a fazer |
| 645 | RNF-44 · Movimento e retorno: avisos no canto, carregamento e transições | issue #645 | Sprint 10.5 | #624, #643 | agente | a fazer |
| 646 | RNF-45 · Cabeçalhos sem subtítulo de unidade e sem notas de regra interna | issue #646 | Sprint 10.5 | — | agente | a fazer |
| 647 | RNF-48 a 50 · Campos de valor e número, campos dependentes e validação | issue #647 | Sprint 10.5 | — | agente | a fazer |
| 648 | RNF-47 · Motivos em lista com "Outro" em todo o sistema | issue #648 | Sprint 10.5 | — | agente | a fazer |
| 649 | RNF-46 · Quem fez: sem "Decidido por", com "Criado por" nas listas e no histórico | issue #649 | Sprint 10.5 | — | agente | a fazer |
| 650 | RNF-51 e 52 · Listas: filtros múltiplos, período, ordem, ações em "⋯", contraste e ficar na tela | issue #650 | Sprint 10.5 | #645 | agente | a fazer |
| 651 | RN-COB-01/02 · Vencimento único por unidade e geração mensal no dia 1º | issue #651 | Sprint 10.5 | — | agente | a fazer |
| 652 | RF-COB-01 a 08 · Cobranças e pagamentos: ordem, criado por, painel, recibo e calendário | issue #652 | Sprint 10.5 | #646 a #650 | agente | a fazer |
| 653 | RN-PLA-07 · Planos com nome gerado e tela só de planos | issue #653 | Sprint 10.5 | #647 | agente | a fazer |
| 654 | RN-BEN-01 a 08 · Benefícios: sem benefício alto, editar em vez de substituir, cascata e limites | issue #654 | Sprint 10.5 | #647, #649 | agente | a fazer |
| 655 | RF-AGE-01/04 · Agenda de domingo a sábado, filtros da unidade e aula avulsa | issue #655 | Sprint 10.5 | #647, #658 | agente | a fazer |
| 656 | RN-TUR-01/02 · Turmas com nome gerado, variação e capacidade de 1 a 30 | issue #656 | Sprint 10.5 | #647 | agente | a fazer |
| 657 | RN-AGE-09 · Feriados e recessos: feriados automáticos e aviso com 24 h | issue #657 | Sprint 10.5 | #648 | agente | a fazer |
| 658 | RF-COM-01/02 · Comunicados: tela única, destino por escopo, tipos novos, agendamento e imagem | issue #658 | Sprint 10.5 | #646, #647, #650 | agente | a fazer |
| 659 | RF-MAT-01 · Nova matrícula: CPF automático, retomar etapa, faixa etária da turma e sem etapa de vencimento | issue #659 | Sprint 10.5 | #651, #647, #648, #649 | agente | a fazer |
| 660 | RF-PRO-03 · Professor: graduação obrigatória, CPF e endereço opcionais e edição como a ficha | issue #660 | Sprint 10.5 | #647 | agente | a fazer |
| 661 | RF-MAT-04 · Pedidos: aprovar sem sair da tela | issue #661 | Sprint 10.5 | #645, #648 | agente | a fazer |
| 122 | RF-INI-01 · Início do Coordenador | issue #122 | Sprint 10.5 | — | agente | a fazer |
| 123 | RF-INI-02 · Início do Administrador | issue #123 | Sprint 10.5 | — | agente | a fazer |
| 124 | RF-INI-03 · Início do Professor | issue #124 | Sprint 10.5 | — | agente | a fazer |
| 662 | Popular a homologação com o seed novo (substituída pela #671, que a fecha) | issue #662 | Sprint 10.5 | #671 | dono | a fazer |
| 664 | RNF-55 · Revisão de textos: maiúsculas, botões curtos, frases simples e vocabulário único | issue #664 | Sprint 10.5 | #643 a #661, #122 a #124 | agente | a fazer |
| 613 | Aviso aberto do portal: autor em duas linhas, como o canvas | issue #613 | Sprint 10.5 | #496 | agente | a fazer |
| 614 | Aviso aberto do portal: avatar do autor com o tom do canvas | issue #614 | Sprint 10.5 | #496 | agente | a fazer |
| 615 | Avisos do portal: pílulas de filtro e Fixado com o tom do canvas | issue #615 | Sprint 10.5 | #496 | agente | a fazer |
| 616 | Aviso aberto do portal no celular: página sem cartão, como o canvas | issue #616 | Sprint 10.5 | #496 | agente | a fazer |
| 617 | Aviso aberto do portal: ícone do botão do grupo da turma como o canvas | issue #617 | Sprint 10.5 | #496 | agente | a fazer |
| 618 | Avisos do portal: linha de apoio do aviso de unidade como o canvas | issue #618 | Sprint 10.5 | #496 | agente | a fazer |
| 96 | Porta de pagamento com o simulador: baixa, webhook e conciliação | issue #96 | Sprint 11 | — | agente | a fazer |
| 97 | RF-PAG-01 · Configurações › Unidade › Pagamentos | issue #97 | Sprint 11 | — | agente | a fazer |
| 98 | RF-PAG-02 · Janela de pagamento no portal | issue #98 | Sprint 11 | — | agente | a fazer |
| 99 | RF-PAG-03 · Pagamento por Pix | issue #99 | Sprint 11 | — | agente | a fazer |
| 100 | RF-PAG-04 · Pagamento por cartão | issue #100 | Sprint 11 | — | agente | a fazer |
| 101 | RF-PAG-05 · Pagamento por boleto | issue #101 | Sprint 11 | — | agente | a fazer |
| 102 | RF-PAG-06 · Pagamento confirmado e recibo | issue #102 | Sprint 11 | — | agente | a fazer |
| 103 | RF-PAG-07 · Débito automático no portal | issue #103 | Sprint 11 | — | agente | a fazer |
| 104 | RF-PAG-08 · Estorno total ou parcial | issue #104 | Sprint 11 | — | agente | a fazer |
| 105 | RF-GRA-01 · Operação › Graduações (lista) | issue #105 | Sprint 12 | — | agente | a fazer |
| 106 | RF-GRA-02 · Registrar graduação | issue #106 | Sprint 12 | — | agente | a fazer |
| 107 | RF-GRA-03 · Graduar vários alunos | issue #107 | Sprint 12 | — | agente | a fazer |
| 108 | RF-GRA-04 · Linha do tempo de graduações na ficha | issue #108 | Sprint 12 | — | agente | a fazer |
| 109 | RF-INA-01 · Situação por modalidade e data de bloqueio na ficha | issue #109 | Sprint 12 | — | agente | a fazer |
| 110 | RF-INA-02 · Inativar, reativar e cancelar cobranças acumuladas | issue #110 | Sprint 12 | — | agente | a fazer |
| 111 | RF-INA-03 · Tarefa diária de bloqueio | issue #111 | Sprint 12 | — | agente | a fazer |
| 112 | Desempenho e paginação com a organização de referência | issue #112 | Sprint 13 | — | agente | a fazer |
| 113 | Prazos de guarda e procedimento de incidente (LGPD) | issue #113 | Sprint 13 | — | agente | a fazer |
| 114 | RF-AUD-01 · Configurações › Auditoria | issue #114 | Sprint 13 | — | agente | a fazer |
| 115 | RF-AUD-02 · Painel do registro de auditoria | issue #115 | Sprint 13 | — | agente | a fazer |
| 116 | RF-AUD-03 · Exportar auditoria em CSV | issue #116 | Sprint 13 | — | agente | a fazer |
| 117 | RF-LGP-01 · Baixar dados (portal e ficha) | issue #117 | Sprint 13 | — | agente | a fazer |
| 118 | RF-LGP-02 · Excluir minha conta no portal | issue #118 | Sprint 13 | — | agente | a fazer |
| 119 | RF-LGP-03 · Pedidos de exclusão no "Precisa de atenção" | issue #119 | Sprint 13 | — | agente | a fazer |
| 120 | RF-LGP-04 · Anonimizar aluno | issue #120 | Sprint 13 | — | agente | a fazer |
| 121 | RF-ALU-05 · Ações de LGPD na ficha do aluno | issue #121 | Sprint 13 | — | agente | a fazer |
| 125 | RF-BUS-01 · Busca global | issue #125 | Sprint 13 | — | agente | a fazer |
| 126 | RF-BUS-02 · Busca vazia: telas e ações rápidas | issue #126 | Sprint 13 | — | agente | a fazer |
| 335 | Limpar comprovantes de graduação de origem enviados e não usados | issue #335 | Sprint 13 | — | agente | a fazer |
| 375 | Editar comunicado agendado e limpar imagens de comunicado não usadas | issue #375 | Sprint 13 | — | agente | a fazer |
| 127 | Pico de alunos, faturas e situações da assinatura no servidor | issue #127 | Sprint 14 | — | agente | a fazer |
| 128 | RF-ASS-01 · Configurações › Assinatura | issue #128 | Sprint 14 | — | agente | a fazer |
| 129 | RF-ASS-02 · Pagar fatura da assinatura | issue #129 | Sprint 14 | — | agente | a fazer |
| 130 | RF-ASS-03 · Cancelar assinatura | issue #130 | Sprint 14 | — | agente | a fazer |
| 131 | RF-ASS-04 · Faixa de situação da assinatura | issue #131 | Sprint 14 | — | agente | a fazer |
| 132 | RF-ASS-05 · Modo somente leitura | issue #132 | Sprint 14 | — | agente | a fazer |
| 133 | Modo suporte: consulta, liberação pelo Coordenador e auditoria | issue #133 | Sprint 15 | — | agente | a fazer |
| 134 | RF-AJU-05 · "Falar com o suporte" (chamado) | issue #134 | Sprint 15 | — | agente | a fazer |
| 135 | RF-PNL-01 · Painel da plataforma: Início | issue #135 | Sprint 15 | — | agente | a fazer |
| 136 | RF-PNL-02 · Painel: lista de organizações | issue #136 | Sprint 15 | — | agente | a fazer |
| 137 | RF-PNL-03 · Painel: detalhe da organização | issue #137 | Sprint 15 | — | agente | a fazer |
| 138 | RF-PNL-04 · Painel: ações sobre a organização | issue #138 | Sprint 15 | — | agente | a fazer |
| 139 | RF-PNL-05 · Painel: catálogo de modalidades e graduação | issue #139 | Sprint 15 | — | agente | a fazer |
| 140 | RF-PNL-06 · Painel: preços da assinatura | issue #140 | Sprint 15 | — | agente | a fazer |
| 141 | RF-PNL-07 · Painel: modelos de termos e políticas | issue #141 | Sprint 15 | — | agente | a fazer |
| 142 | RF-PNL-08 · Painel: avisos e notas de versão | issue #142 | Sprint 15 | — | agente | a fazer |
| 143 | RF-PNL-09 · Painel: denúncias do diretório | issue #143 | Sprint 15 | — | agente | a fazer |
| 144 | RF-PNL-10 · Painel: chamados | issue #144 | Sprint 15 | — | agente | a fazer |
| 145 | RF-PNL-11 · Painel: equipe da plataforma | issue #145 | Sprint 15 | — | agente | a fazer |
| 146 | RF-CAD-01 · Formulário de cadastro da organização | issue #146 | Sprint 16 | — | agente | a fazer |
| 147 | RF-CAD-02 · Confirmação de telefone e e-mail | issue #147 | Sprint 16 | — | agente | a fazer |
| 148 | RF-CAD-03 · Aceite e pagamento da primeira fatura | issue #148 | Sprint 16 | — | agente | a fazer |
| 149 | RF-CAD-04 · Assistente de boas-vindas | issue #149 | Sprint 16 | — | agente | a fazer |
| 150 | RF-CAD-05 · Checklist "Primeiros passos" | issue #150 | Sprint 16 | — | agente | a fazer |
| 151 | Exportação CSV e pacote completo | issue #151 | Sprint 17 | — | agente | a fazer |
| 152 | RF-IMP-01 · Configurações › Importar e exportar | issue #152 | Sprint 17 | — | agente | a fazer |
| 153 | RF-IMP-02 · Assistente de importação | issue #153 | Sprint 17 | — | agente | a fazer |
| 154 | RF-IMP-03 · Convites do portal após importar | issue #154 | Sprint 17 | — | agente | a fazer |
| 155 | RF-AEX-01 · Página pública de aula experimental | issue #155 | Sprint 18 | — | agente | a fazer |
| 156 | RF-AEX-02 · Operação › Aulas experimentais | issue #156 | Sprint 18 | — | agente | a fazer |
| 157 | RF-AEX-03 · Agendar aula experimental | issue #157 | Sprint 18 | — | agente | a fazer |
| 158 | RF-AEX-04 · Painel da aula experimental | issue #158 | Sprint 18 | — | agente | a fazer |
| 159 | RF-AEX-05 · Experimental na agenda e no Início | issue #159 | Sprint 18 | — | agente | a fazer |
| 160 | RF-AUT-01 · Página pública de autocadastro | issue #160 | Sprint 18 | — | agente | a fazer |
| 161 | RF-AUT-02 · Aguardando aprovação (autocadastro) | issue #161 | Sprint 18 | — | agente | a fazer |
| 162 | RF-AUT-03 · Configurações › Unidade › Links | issue #162 | Sprint 18 | — | agente | a fazer |
| 163 | Base dos relatórios: período, comparação, gráfico com tabela e CSV | issue #163 | Sprint 19 | — | agente | a fazer |
| 164 | RF-REL-01 · Relatório financeiro | issue #164 | Sprint 19 | — | agente | a fazer |
| 165 | RF-REL-02 · Relatório de alunos | issue #165 | Sprint 19 | — | agente | a fazer |
| 166 | RF-REL-03 · Relatório de aulas experimentais | issue #166 | Sprint 19 | — | agente | a fazer |
| 167 | RF-REL-04 · Relatório de aulas | issue #167 | Sprint 19 | — | agente | a fazer |
| 168 | Site da plataforma pré-renderizado | issue #168 | Sprint 20 | — | agente | a fazer |
| 169 | Diretório de academias | issue #169 | Sprint 20 | — | agente | a fazer |
| 170 | Demonstração em /demo | issue #170 | Sprint 20 | — | agente | a fazer |
| 171 | App instalável (PWA) do portal com uso sem conexão | issue #171 | Sprint 21 | — | agente | a fazer |
| 172 | RF-AJU-01 · Central de ajuda | issue #172 | Sprint 21 | — | agente | a fazer |
| 173 | RF-AJU-02 · Ícones "?" de ajuda nas telas | issue #173 | Sprint 21 | — | agente | a fazer |
| 174 | RF-AJU-03 · Tour do primeiro acesso | issue #174 | Sprint 21 | — | agente | a fazer |
| 175 | RF-AJU-04 · Página Novidades | issue #175 | Sprint 21 | — | agente | a fazer |
| 176 | Conexão real de e-mail | issue #176 | Sprint 22 | — | pessoa (dono) | a fazer |
| 177 | Conexão real de SMS | issue #177 | Sprint 22 | — | pessoa (dono) | a fazer |
| 178 | Push real no navegador (Web Push) | issue #178 | Sprint 22 | — | pessoa (dono) | a fazer |
| 179 | Desafio invisível (Turnstile) nos formulários | issue #179 | Sprint 22 | — | pessoa (dono) | a fazer |
| 180 | Mapa e localização reais | issue #180 | Sprint 22 | — | pessoa (dono) | a fazer |
| 181 | Métricas de uso sem cookies no site e na gestão | issue #181 | Sprint 22 | — | pessoa (dono) | a fazer |
| 182 | Contas dos fornecedores, chaves e domínio | issue #182 | Sprint 22 | — | pessoa (dono) | a fazer |
| 192 | Hospedagem: contratar, ligar a publicação automática e o backup | issue #192 | Sprint 22 | — | pessoa (dono) | a fazer |
| 193 | Monitoramento em produção: alertas e disponibilidade | issue #193 | Sprint 22 | — | pessoa (dono) | a fazer |
| 183 | Mercado Pago: conexão da unidade por autorização (OAuth) | issue #183 | Sprint 23 | — | pessoa (dono) | a fazer |
| 184 | Mercado Pago: Pix, cartão, boleto, débito automático e estornos reais | issue #184 | Sprint 23 | — | pessoa (dono) | a fazer |
| 185 | Mercado Pago: webhooks e conciliação reais | issue #185 | Sprint 23 | — | pessoa (dono) | a fazer |
| 186 | Conta da plataforma no Mercado Pago para as faturas | issue #186 | Sprint 23 | — | pessoa (dono) | a fazer |
| 187 | Piloto em produção: organização, dados, Mercado Pago e convites | issue #187 | Sprint 24 | — | pessoa (dono) | a fazer |
| 188 | Suíte ponta a ponta completa e teste de restauração | issue #188 | Sprint 24 | — | pessoa (dono) | a fazer |
| 189 | Acompanhamento do primeiro ciclo e correções da piloto | issue #189 | Sprint 24 | — | pessoa (dono) | a fazer |
| 190 | Ajustes pedidos pela piloto e desconto fixo | issue #190 | Sprint 25 | — | pessoa (dono) | a fazer |
| 191 | Checklist de lançamento | issue #191 | Sprint 25 | — | pessoa (dono) | a fazer |
| 523 | Técnica · Testes com relógio real: AgendaPage CA14 e cenarios-cobrancas CA11 falham aos domingos | issue #523 | sem marco | — | agente | feito |
| 527 | Técnica · Conta do dono no AGENTS.md: ODevDosAnjos | issue #527 | Sprint 10.5 | — | agente | feito |
| 528 | Técnica · Teste visual em paralelo no CI | issue #528 | Sprint 10.5 | — | agente | feito |
| 530 | Técnica · Teste visual instável em conta-duas-etapas (1440) | issue #530 | Sprint 10.5 | — | agente | feito |
| 699 | Técnica · Decisão: relógio do banco vs Clock da aplicação (antes das #696 a #698; decisão do dono) | issue #699 | Sprint 10.5 | — | agente | a fazer |
| 696 | Técnica · Migrar ITs de organization e terms para Clock fixo (medição da #693) | issue #696 | Sprint 10.5 | #699 | agente | a fazer |
| 697 | Técnica · Migrar ITs de student (portal) para Clock fixo (medição da #693) | issue #697 | Sprint 10.5 | #699 | agente | a fazer |
| 698 | Técnica · Migrar ITs de billing, plan, notification, mail, agenda, communication e storage para Clock fixo (medição da #693) | issue #698 | Sprint 10.5 | #699 | agente | a fazer |

Situações: `a fazer`, `feito`, `bloqueado (P1)`. Item em andamento não é anotado aqui: é o que tem branch `item/<ID>-...` aberta.

Itens de pessoa (etiqueta `depende de você`, Sprints 22 a 25): o agente não começa sem o dono liberar.

## Pendências para o dono

Último número usado: P3. Quem acrescenta uma pendência atualiza esta linha; os números não se repetem, mesmo depois que a pendência sai da tabela.

| Nº | Pendência | Opção recomendada | Trava qual item | Enquanto isso |
|---|---|---|---|---|
| P2 | Com a #67, `student_graduation` aponta para `graduation_level`: salvar a graduação da modalidade sem um nível já usado por graduação de aluno (origem) falha na chave estrangeira (a resposta é a de conflito de dados, sem texto próprio). A #105/#106 decidem a mensagem (ex.: "nível em uso por N alunos"). | Tratar na #105, junto da tela de graduações do aluno. | nenhum | Salvar o sistema de graduação continua valendo; só a exclusão de nível em uso é recusada. |
| P3 | #84 (D3): o resumo diário por e-mail com o "Precisa de atenção" e a opção de desligá-lo (RN-NOT-01) ficaram fora do painel do sino, porque a lista "Precisa de atenção" ainda não existe. | Novo item, no marco em que o "Precisa de atenção" for criado. | nenhum | O sino e o contador funcionam; não sai resumo por e-mail. |

## Encaixes para as próximas sprints

- **Sprint 08, cobranças (#71 a #77):** o que ficou para depois está, com "Pronto quando", no fim do corpo das issues #78 (e-mails de reajuste e "Cobrança gerada", modelo "Pagamento confirmado") e #79 ("Enviar lembrete" no painel da cobrança). A limpeza de comprovante de graduação enviado e não usado (A4 da revisão da Sprint 07) é a #335, na Sprint 13. Sem issue nova além da #335. Ajustes menores da revisão (A6 a A8), no marco da Sprint 09: #342 (afirmar que a bolsa de 100% segue Ativa), #343 (cache do Playwright) e #344 (`aguardar-ci.sh`).
- **Sprint 06, ficha do aluno (#60, junto de #58 e #61):** permissão do Professor por unidade: ver ficha do aluno (padrão desligada); implementar junto da ficha, com migração do vetor `teacher_permissions` de 4 para 5, tela de configurações da unidade, `PermissionTable`, openapi e testes. Decisão do dono de 20/10/2026, só especificação até lá (`docs/especificacao/02`, `08`, `15`). Sem a chave, o Professor continua vendo os alunos da turma ou da aula como lista simples (RN-PRO-06). Ainda não há arquivo de item para #58 a #61; quem especificar a ficha lê este encaixe.
- **Sprint 07, matrícula (#63) e benefícios (#66):** os encaixes de `ModalityUsage.activeStudents` e da RN-PRO-08 estão no fim do corpo das issues #63 e #66.
- **Sprint 06, encaixes da lista, dos selos e da ficha do aluno (#58, #59, #60, #62):** o que ficou para depois está, com "Pronto quando", no fim do corpo das issues #63 (alcance do Professor e do Administrador, lista simples, modalidades e filtros, selo Novo, abas da ficha, datas no fuso da unidade), #65 (selo Bolsista), #67 (data de matrícula), #70 e #85 (selo Termo pendente), #72 (situação financeira e Em atraso), #73 (aba Financeiro e Cobrar) e #109 (Bloqueados). Sem issue nova.
- **Sprint 09, comunicação (#78 a #84):** o que ficou para depois está, com "Encaixe herdado da Sprint 09", no corpo das issues: #176 (retorno e abertura de e-mail), #177 (SMS e e-mail não aberto), #122 (resumo diário, RN-NOT-01), #93 (leitura do comunicado), #86, #87, #100, #157, #160, #118, #131 e #183 (notificações de cada fato), #99 (`{link_pagamento}`) e #85 (boas-vindas). A edição de comunicado agendado e a limpeza de imagens estão na #375. O aviso "turma sem professor" fica sem produtor aberto: a #45, que inativa o professor, foi entregue sem publicá-lo (RN-PRO-05, RN-NOT-04). Sem issue nova.
