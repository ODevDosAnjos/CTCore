# Revisão de textos · Lista A: iniciais maiúsculas

Gerada em 20/11/2026 a partir de `frontend/src/i18n/pt-BR.json` com a regra M1 do `docs/design/textos.md`. São as propostas para tudo o que **não é frase**: títulos, menu, abas, colunas, botões, rótulos de campo e opções. O item que aplicar a lista confere cada linha: se o texto for, na tela, uma frase (descreve um fato, tem verbo conjugado e é lido como sentença), ele fica como está e o PR registra o motivo.

Total: 1198 textos.

## `account`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `account.title` | Minha conta | Minha Conta |
| `account.link` | Minha conta | Minha Conta |
| `account.password.current` | Senha atual | Senha Atual |
| `account.password.submit` | Trocar senha | Trocar Senha |
| `account.password.modalTitle` | Trocar senha | Trocar Senha |
| `account.email.new` | Novo e-mail | Novo E-mail |
| `account.email.password` | Sua senha | Sua Senha |
| `account.email.submit` | Enviar link de confirmação | Enviar Link de Confirmação |
| `account.email.modalTitle` | Trocar e-mail | Trocar E-mail |
| `account.twoFactor.title` | Verificação em duas etapas | Verificação em Duas Etapas |
| `account.twoFactor.enable` | Ativar duas etapas | Ativar Duas Etapas |
| `account.twoFactor.newCodes` | Ver códigos de reserva novos | Ver Códigos de Reserva Novos |
| `account.twoFactor.disableTitle` | Desligar duas etapas | Desligar Duas Etapas |
| `account.sessions.title` | Sessões ativas | Sessões Ativas |
| `account.sessions.current` | Este aparelho | Este Aparelho |
| `account.sessions.lastUse` | Último uso | Último Uso |
| `account.sessions.endOne` | Encerrar a sessão em {{device}} | Encerrar a Sessão em {{device}} |
| `account.sessions.endAll` | Encerrar todas as outras | Encerrar Todas as Outras |
| `account.sessions.list` | Sessões ativas | Sessões Ativas |
| `account.confirm.title` | Confirmar novo e-mail | Confirmar Novo E-mail |
| `account.confirm.submit` | Confirmar troca | Confirmar Troca |
| `account.confirm.back` | Ir para Minha conta | Ir para Minha Conta |
| `account.tabs.label` | Seções de Minha conta | Seções de Minha Conta |
| `account.tabs.twoFactor` | Duas etapas | Duas Etapas |
| `account.back` | Voltar para Minha conta | Voltar para Minha Conta |
| `account.access.changeEmail` | Trocar e-mail | Trocar E-mail |
| `account.access.changePassword` | Trocar senha | Trocar Senha |
| `account.menu.twoFactor` | Duas etapas | Duas Etapas |
| `account.menu.sessions` | Sessões ativas | Sessões Ativas |
| `account.notifications.bell.title` | Sino da gestão | Sino da Gestão |
| `account.notifications.bell.unit` | Notificações da minha unidade | Notificações da Minha Unidade |
| `account.notifications.bell.receiveAll` | Receber tudo | Receber Tudo |
| `account.notifications.daily.title` | Resumo diário por e-mail | Resumo Diário por E-mail |
| `account.notifications.welcome.title` | E-mails de boas-vindas | E-mails de Boas-vindas |
| `account.notifications.welcome.label` | Dicas dos primeiros dias | Dicas dos Primeiros Dias |
| `account.notifications.save` | Salvar alterações | Salvar Alterações |

## `ageRanges`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `ageRanges.title` | Faixas etárias | Faixas Etárias |
| `ageRanges.columns.minAge` | Idade mínima | Idade Mínima |
| `ageRanges.columns.maxAge` | Idade máxima | Idade Máxima |
| `ageRanges.usedIn.none` | Sem turmas | Sem Turmas |
| `ageRanges.create` | Nova faixa etária | Nova Faixa Etária |
| `ageRanges.saved` | Faixa etária salva | Faixa Etária Salva |
| `ageRanges.deleted` | Faixa {{name}} apagada | Faixa {{name}} Apagada |
| `ageRanges.emptyTitle` | Nenhuma faixa etária | Nenhuma Faixa Etária |
| `ageRanges.confirm.title` | Apagar faixa etária | Apagar Faixa Etária |
| `ageRanges.dialog.createTitle` | Nova faixa etária | Nova Faixa Etária |
| `ageRanges.dialog.editTitle` | Editar faixa etária | Editar Faixa Etária |
| `ageRanges.dialog.name` | Nome da faixa | Nome da Faixa |
| `ageRanges.dialog.minAge` | Idade mínima | Idade Mínima |
| `ageRanges.dialog.maxAge` | Idade máxima (opcional) | Idade Máxima (Opcional) |

## `agenda`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `agenda.noClassDays` | Dias sem aula | Dias sem Aula |
| `agenda.weekSwitch` | Semana exibida | Semana Exibida |
| `agenda.thisWeek` | Esta semana | Esta Semana |
| `agenda.prevWeek` | Semana anterior | Semana Anterior |
| `agenda.nextWeek` | Próxima semana | Próxima Semana |
| `agenda.prevDay` | Dia anterior | Dia Anterior |
| `agenda.nextDay` | Próximo dia | Próximo Dia |
| `agenda.noClass` | Sem aula | Sem Aula |
| `agenda.new.open` | Nova aula avulsa | Nova Aula Avulsa |
| `agenda.new.title` | Nova aula avulsa | Nova Aula Avulsa |
| `agenda.new.visibility` | Quem vê na agenda e no portal | Quem Vê na Agenda e no Portal |
| `agenda.new.visibilityAll` | Todas as turmas da unidade | Todas as Turmas da Unidade |
| `agenda.new.visibilityClass` | Uma turma | Uma Turma |
| `agenda.new.save` | Criar aula | Criar Aula |
| `agenda.new.classPick` | Escolha a turma | Escolha a Turma |
| `agenda.new.notify` | Avisar os alunos | Avisar os Alunos |
| `agenda.cancelReasons.TEACHER_UNAVAILABLE` | Professor indisponível | Professor Indisponível |
| `agenda.cancelReasons.ACADEMY_EVENT` | Evento na academia | Evento na Academia |
| `agenda.edit.title` | Editar aula | Editar Aula |
| `agenda.edit.teacher` | Professor da aula | Professor da Aula |
| `agenda.edit.scopes.THIS.label` | Só esta aula | Só Esta Aula |
| `agenda.edit.scopes.FOLLOWING.label` | Esta e as seguintes | Esta e as Seguintes |
| `agenda.edit.notify` | Avisar a turma | Avisar a Turma |
| `agenda.edit.save` | Salvar aula | Salvar Aula |
| `agenda.edit.saveFollowing` | Salvar {{count}} aulas | Salvar {{count}} Aulas |
| `agenda.correct.title` | Corrigir professor | Corrigir Professor |
| `agenda.correct.teacher` | Professor que deu a aula | Professor que Deu a Aula |
| `agenda.correct.save` | Salvar correção | Salvar Correção |
| `agenda.cancel.title` | Cancelar aula | Cancelar Aula |
| `agenda.cancel.trialCancel` | Cancelar experimental | Cancelar Experimental |
| `agenda.cancel.confirm` | Cancelar aula | Cancelar Aula |
| `agenda.emptyTitle` | Nenhuma aula neste período | Nenhuma Aula Neste Período |
| `agenda.filters.allTeachers` | Todos os professores | Todos os Professores |
| `agenda.filters.allModalities` | Todas as modalidades | Todas as Modalidades |
| `agenda.panel.back` | Voltar à agenda | Voltar à Agenda |
| `agenda.panel.head` | Titular da turma | Titular da Turma |
| `agenda.panel.visibility` | Quem vê no portal | Quem Vê no Portal |
| `agenda.panel.visibilityAll` | Todas as turmas da unidade | Todas as Turmas da Unidade |
| `agenda.panel.students` | Alunos da turma | Alunos da Turma |
| `agenda.panel.trials` | Aulas experimentais | Aulas Experimentais |
| `agenda.panel.notify` | Avisar turma | Avisar Turma |
| `agenda.panel.edit` | Editar aula | Editar Aula |
| `agenda.panel.correct` | Corrigir professor | Corrigir Professor |
| `agenda.panel.cancel` | Cancelar aula | Cancelar Aula |
| `agenda.panel.viewClass` | Ver turma | Ver Turma |
| `agenda.panel.notFoundTitle` | Aula não encontrada | Aula Não Encontrada |
| `agenda.panel.statuses.IN_PROGRESS` | Em andamento | Em Andamento |
| `agenda.panel.teacher` | Professor da aula | Professor da Aula |
| `agenda.panel.activeCount_zero` | 0 ativos | 0 Ativos |
| `agenda.panel.trialsNone` | Nenhuma marcada | Nenhuma Marcada |

## `announcements`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `announcements.scopeAll` | Todas as unidades | Todas as Unidades |
| `announcements.newAction` | Novo comunicado | Novo Comunicado |
| `announcements.openGroup` | Abrir o grupo da turma | Abrir o Grupo da Turma |
| `announcements.new.title` | Novo comunicado | Novo Comunicado |
| `announcements.new.back` | Voltar aos comunicados | Voltar aos Comunicados |
| `announcements.new.emptyTitle` | Nenhum destino liberado | Nenhum Destino Liberado |
| `announcements.new.organization` | Todas as unidades | Todas as Unidades |
| `announcements.new.typeChangeYes` | Trocar o texto | Trocar o Texto |
| `announcements.new.typeChangeNo` | Manter meu texto | Manter Meu Texto |
| `announcements.new.image` | Imagem (opcional) | Imagem (Opcional) |
| `announcements.new.imageAlt` | Imagem do comunicado | Imagem do Comunicado |
| `announcements.new.imageRemove` | Remover imagem | Remover Imagem |
| `announcements.new.channelPortal` | Portal do aluno (sempre) | Portal do Aluno (Sempre) |
| `announcements.new.saveDraft` | Salvar rascunho | Salvar Rascunho |
| `announcements.new.pinnedUntil` | Fixar no topo do portal até (opcional) | Fixar no Topo do Portal Até (Opcional) |
| `announcements.new.when` | Quando enviar | Quando Enviar |
| `announcements.new.now` | Enviar agora | Enviar Agora |
| `announcements.new.sendAt` | Data e hora do envio | Data e Hora do Envio |
| `announcements.new.send` | Enviar comunicado | Enviar Comunicado |
| `announcements.new.scheduleSend` | Agendar comunicado | Agendar Comunicado |
| `announcements.new.targetKind.ORGANIZATION` | Todas as unidades | Todas as Unidades |
| `announcements.new.editor.toolbar` | Formatação do texto | Formatação do Texto |
| `announcements.new.editor.bullet` | Lista com marcador | Lista com Marcador |
| `announcements.new.editor.numbered` | Lista numerada | Lista Numerada |
| `announcements.new.imageChoose` | Enviar imagem · até 5 MB | Enviar Imagem · Até 5 MB |
| `announcements.new.channelWhatsappMobile` | Abrir o grupo no WhatsApp | Abrir o Grupo no WhatsApp |
| `announcements.new.previewWho` | Para quem vai | Para Quem Vai |
| `announcements.new.previewAsShown` | Como aparece no portal | Como Aparece no Portal |
| `announcements.new.previewNoTitle` | Sem título | Sem Título |
| `announcements.new.previewWhatsapp.GROUP` | WhatsApp: grupo da turma | WhatsApp: Grupo da Turma |
| `announcements.new.previewWhatsapp.CONVERSATION` | WhatsApp: conversa | WhatsApp: Conversa |
| `announcements.new.scheduleTitle` | Agendar comunicado | Agendar Comunicado |
| `announcements.new.scheduleHintRadio` | Escolha data e hora | Escolha Data e Hora |
| `announcements.new.org.title` | Novo comunicado | Novo Comunicado |
| `announcements.new.org.options.ORGANIZATION` | Organização inteira | Organização Inteira |
| `announcements.new.org.options.UNIT` | Uma unidade | Uma Unidade |
| `announcements.new.org.options.MODALITY` | Uma modalidade de uma unidade | Uma Modalidade de uma Unidade |
| `announcements.new.org.options.CLASS` | Uma turma | Uma Turma |
| `announcements.emptyTitle` | Nenhum comunicado ainda | Nenhum Comunicado Ainda |
| `announcements.noResultTitle` | Nenhum comunicado com estes filtros | Nenhum Comunicado com Estes Filtros |
| `announcements.filters.last30` | Últimos 30 dias | Últimos 30 Dias |
| `announcements.pinnedUntil` | Fixado até {{date}} | Fixado Até {{date}} |
| `announcements.targetList.ORGANIZATION` | Todas as unidades | Todas as Unidades |
| `announcements.target.ORGANIZATION` | Todas as unidades | Todas as Unidades |
| `announcements.types.CANCELED_CLASS` | Aula cancelada | Aula Cancelada |
| `announcements.types.TEACHER_CHANGE` | Troca de professor | Troca de Professor |
| `announcements.types.SCHEDULE_CHANGE` | Alteração de horário | Alteração de Horário |
| `announcements.types.NO_CLASS_DAY` | Dia sem aula | Dia sem Aula |
| `announcements.types.GENERAL` | Aviso geral | Aviso Geral |
| `announcements.cancel.title` | Cancelar comunicado agendado | Cancelar Comunicado Agendado |
| `announcements.cancel.submit` | Cancelar comunicado | Cancelar Comunicado |
| `announcements.lesson.title` | Avisar turma | Avisar Turma |
| `announcements.lesson.whatsapp` | Abrir o grupo no WhatsApp | Abrir o Grupo no WhatsApp |
| `announcements.lesson.confirmSchedule` | Confirmar agendamento | Confirmar Agendamento |
| `announcements.lesson.sendNow` | Enviar agora | Enviar Agora |

## `areaUnavailable`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `areaUnavailable.classes` | Ver minhas turmas | Ver Minhas Turmas |

## `auth`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `auth.logout.label` | Sair da conta | Sair da Conta |
| `auth.forgot` | Esqueci minha senha | Esqueci Minha Senha |
| `auth.createPassword` | Criar nova senha | Criar Nova Senha |

## `belt`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `belt.label` | Faixa {{name}}, {{degree}} grau(s) | Faixa {{name}}, {{degree}} Grau(s) |

## `benefits`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `benefits.tabsLabel` | Situação dos benefícios | Situação dos Benefícios |
| `benefits.search` | Buscar por nome | Buscar por Nome |
| `benefits.views.HIGH` | Benefícios altos | Benefícios Altos |
| `benefits.empty.ACTIVE.title` | Nenhum benefício ativo | Nenhum Benefício Ativo |
| `benefits.empty.HIGH.title` | Nenhum benefício alto | Nenhum Benefício Alto |
| `benefits.empty.CLOSED.title` | Nenhum benefício encerrado | Nenhum Benefício Encerrado |
| `benefits.highBadge` | Benefício alto | Benefício Alto |
| `benefits.grant.button` | Conceder benefício | Conceder Benefício |
| `benefits.grant.title` | Conceder benefício | Conceder Benefício |
| `benefits.grant.modalityChoose` | Escolha o aluno primeiro | Escolha o Aluno Primeiro |
| `benefits.grant.noModalityTitle` | Sem modalidade ativa | Sem Modalidade Ativa |
| `benefits.grant.typeAmount` | Desconto em reais | Desconto em Reais |
| `benefits.grant.decidedByChoose` | Escolha quem decidiu | Escolha Quem Decidiu |
| `benefits.grant.teacher` | Desconto de professor (opcional) | Desconto de Professor (Opcional) |
| `benefits.grant.submit` | Conceder benefício | Conceder Benefício |
| `benefits.grant.summary.percent` | Benefício: bolsa de {{value}}% | Benefício: Bolsa de {{value}}% |
| `benefits.grant.summary.amount` | Benefício: desconto de {{value}} | Benefício: Desconto de {{value}} |
| `benefits.grant.summary.monthly` | Nova mensalidade: {{value}} | Nova Mensalidade: {{value}} |
| `benefits.replace.types.AMOUNT` | Desconto fixo | Desconto Fixo |
| `benefits.replace.keep` | Manter o atual | Manter o Atual |
| `benefits.end.title` | Encerrar benefício | Encerrar Benefício |
| `benefits.end.submit` | Encerrar benefício | Encerrar Benefício |
| `benefits.end.goneTitle` | Benefício já encerrado | Benefício Já Encerrado |
| `benefits.filters.allTypes` | Bolsa e desconto | Bolsa e Desconto |

## `birthdays`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `birthdays.title` | Aniversariantes de hoje | Aniversariantes de Hoje |
| `birthdays.empty` | Ninguém faz aniversário hoje | Ninguém Faz Aniversário Hoje |

## `charges`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `charges.showResults` | Ver {{count}} cobranças | Ver {{count}} Cobranças |
| `charges.search` | Aluno, CPF ou referência | Aluno, CPF ou Referência |
| `charges.creation.open` | Nova cobrança | Nova Cobrança |
| `charges.creation.title` | Nova cobrança avulsa | Nova Cobrança Avulsa |
| `charges.creation.search` | Buscar aluno pelo nome (mínimo 2 letras) | Buscar Aluno pelo Nome (Mínimo 2 Letras) |
| `charges.creation.change` | Trocar o aluno {{name}} | Trocar o Aluno {{name}} |
| `charges.creation.submit` | Criar cobrança | Criar Cobrança |
| `charges.advance.open` | Gerar próximas mensalidades | Gerar Próximas Mensalidades |
| `charges.advance.title` | Gerar próximas mensalidades | Gerar Próximas Mensalidades |
| `charges.advance.noModalityTitle` | Sem modalidade ativa | Sem Modalidade Ativa |
| `charges.advance.count` | Quantos meses | Quantos Meses |
| `charges.advance.preview` | Prévia das mensalidades | Prévia das Mensalidades |
| `charges.advance.submit_one` | Gerar {{count}} mensalidade | Gerar {{count}} Mensalidade |
| `charges.advance.submit_other` | Gerar {{count}} mensalidades | Gerar {{count}} Mensalidades |
| `charges.advance.doneTitle` | Mensalidades geradas | Mensalidades Geradas |
| `charges.footerPaidOpen` | Pago {{paid}} · Em aberto {{open}} | Pago {{paid}} · Em Aberto {{open}} |
| `charges.seeOverdue` | Ver atrasados | Ver Atrasados |
| `charges.menu.label` | Ações da cobrança de {{student}}: {{reference}} | Ações da Cobrança de {{student}}: {{reference}} |
| `charges.menu.open` | Abrir cobrança | Abrir Cobrança |
| `charges.menu.pay` | Registrar pagamento | Registrar Pagamento |
| `charges.menu.cancel` | Cancelar cobrança | Cancelar Cobrança |
| `charges.quick.label` | Atalhos de cobrança | Atalhos de Cobrança |
| `charges.quick.OVERDUE` | Em atraso | Em Atraso |
| `charges.quick.DUE_TODAY` | Vence hoje | Vence Hoje |
| `charges.quick.IN_REVIEW` | Em conferência | Em Conferência |
| `charges.quick.PAID_MONTH` | Pagas no mês | Pagas no Mês |
| `charges.quick.openReview` | Abrir conferência | Abrir Conferência |
| `charges.filters.allPeriods` | Todo o período | Todo o Período |
| `charges.status.DUE_TODAY` | Vence hoje | Vence Hoje |
| `charges.status.OVERDUE` | Em atraso | Em Atraso |
| `charges.status.IN_REVIEW` | Em conferência | Em Conferência |
| `charges.status.PAID_LATE` | Paga com atraso | Paga com Atraso |
| `charges.types.ENROLLMENT_FEE` | Taxa de matrícula | Taxa de Matrícula |
| `charges.types.READJUSTMENT_DIFF` | Diferença de reajuste | Diferença de Reajuste |
| `charges.stored.OPEN` | Em aberto | Em Aberto |
| `charges.stored.IN_REVIEW` | Em conferência | Em Conferência |
| `charges.panel.open` | Abrir cobrança de {{student}}: {{reference}} | Abrir Cobrança de {{student}}: {{reference}} |
| `charges.panel.final` | Valor final | Valor Final |
| `charges.panel.history` | Origem e histórico | Origem e Histórico |
| `charges.panel.noPayments` | Nenhum pagamento registrado | Nenhum Pagamento Registrado |
| `charges.panel.receiptCode` | Código de conferência: {{code}} | Código de Conferência: {{code}} |
| `charges.panel.reminders` | Lembretes enviados | Lembretes Enviados |
| `charges.panel.noReminders` | Nenhum lembrete enviado | Nenhum Lembrete Enviado |
| `charges.panel.reminderKind.today` | No dia do vencimento | No Dia do Vencimento |
| `charges.panel.cancel` | Cancelar cobrança | Cancelar Cobrança |
| `charges.panel.seeStudent` | Ver aluno | Ver Aluno |
| `charges.panel.registerPayment` | Registrar pagamento | Registrar Pagamento |
| `charges.panel.sendReminder` | Enviar lembrete | Enviar Lembrete |
| `charges.reminder.title` | Enviar lembrete | Enviar Lembrete |
| `charges.reminder.status.NO_ADDRESS` | Sem e-mail | Sem E-mail |
| `charges.reminder.status.EMAIL_PROBLEM` | E-mail com problema | E-mail com Problema |
| `charges.reminder.status.NO_PHONE` | Sem telefone | Sem Telefone |
| `charges.reminder.status.SMS_LIMIT` | Limite de SMS do mês | Limite de SMS do Mês |
| `charges.reminder.status.SKIPPED` | Não enviado | Não Enviado |
| `charges.reminder.result.NO_ADDRESS` | Sem e-mail | Sem E-mail |
| `charges.reminder.result.EMAIL_PROBLEM` | E-mail com problema | E-mail com Problema |
| `charges.reminder.result.RECENT` | Enviado há pouco | Enviado Há Pouco |
| `charges.reminder.result.NOT_OPEN` | Não está aberta | Não Está Aberta |
| `charges.overdue.open` | Em atraso | Em Atraso |
| `charges.overdue.title` | Em atraso | Em Atraso |
| `charges.overdue.scopeAll` | Todas as unidades | Todas as Unidades |
| `charges.overdue.emptyTitle` | Nenhuma cobrança em atraso | Nenhuma Cobrança em Atraso |
| `charges.overdue.selectAll` | Selecionar todas da página | Selecionar Todas da Página |
| `charges.overdue.send` | Enviar lembrete | Enviar Lembrete |
| `charges.overdue.blocksIn_one` | Bloqueia em {{count}} dia | Bloqueia em {{count}} Dia |
| `charges.overdue.blocksIn_other` | Bloqueia em {{count}} dias | Bloqueia em {{count}} Dias |
| `charges.overdue.columns.lastReminder` | Último lembrete | Último Lembrete |
| `charges.overdue.message.title` | Mensagem pronta do lembrete | Mensagem Pronta do Lembrete |
| `charges.overdue.message.edit` | Editar texto | Editar Texto |
| `charges.daily.open` | Recebimentos do dia | Recebimentos do Dia |
| `charges.daily.title` | Recebimentos do dia | Recebimentos do Dia |
| `charges.daily.previous` | Dia anterior | Dia Anterior |
| `charges.daily.next` | Próximo dia | Próximo Dia |
| `charges.daily.chooseUnit` | Escolha uma unidade | Escolha uma Unidade |
| `charges.daily.pickUnit` | Escolha uma unidade | Escolha uma Unidade |
| `charges.daily.empty` | Nenhum recebimento neste dia | Nenhum Recebimento Neste Dia |
| `charges.daily.byMethod` | Por meio | Por Meio |
| `charges.daily.byRegistrar` | Por quem lançou | Por Quem Lançou |
| `charges.daily.portal` | Portal (aluno pagou) | Portal (Aluno Pagou) |
| `charges.daily.method.PIX_MP` | Pix pelo portal | Pix pelo Portal |
| `charges.daily.method.CARD` | Cartão pelo portal | Cartão pelo Portal |
| `charges.daily.method.CARD_MACHINE` | Cartão na maquininha | Cartão na Maquininha |
| `charges.daily.method.PIX_KEY` | Pix na chave | Pix na Chave |
| `charges.daily.columns.fee` | Taxa repassada | Taxa Repassada |
| `charges.preview.open` | Prévia da geração | Prévia da Geração |
| `charges.preview.title` | Prévia da geração | Prévia da Geração |
| `charges.preview.chooseUnit` | Escolha uma unidade | Escolha uma Unidade |
| `charges.preview.pickUnit` | Escolha uma unidade | Escolha uma Unidade |
| `charges.preview.periodOption` | Próximos {{count}} dias | Próximos {{count}} Dias |
| `charges.preview.empty` | Nada a gerar nos próximos {{days}} dias | Nada a Gerar nos Próximos {{days}} Dias |
| `charges.preview.total` | Total previsto | Total Previsto |
| `charges.preview.generated` | Já gerado | Já Gerado |
| `charges.preview.byDay` | Por dia de vencimento | Por Dia de Vencimento |
| `charges.preview.dayLabel` | Dia {{day}} · gera em {{date}} | Dia {{day}} · Gera em {{date}} |
| `charges.preview.viewStudents` | Ver alunos | Ver Alunos |
| `charges.preview.viewStudentsDay` | Ver alunos do dia {{day}} | Ver Alunos do Dia {{day}} |
| `charges.preview.skipped` | Quem não será cobrado e por quê | Quem Não Será Cobrado e por Quê |
| `charges.preview.reasons.OVERDUE_BLOCK` | Modalidade bloqueada por atraso | Modalidade Bloqueada por Atraso |
| `charges.preview.reasons.END_REQUESTED` | Encerramento solicitado | Encerramento Solicitado |
| `charges.preview.reasons.MODALITY_ENDED` | Modalidade encerrada | Modalidade Encerrada |
| `charges.preview.reasons.OTHER` | Não será cobrado | Não Será Cobrado |
| `charges.preview.changeDue.title` | Trocar vencimento | Trocar Vencimento |
| `charges.preview.changeDue.open` | Trocar vencimento de {{student}} | Trocar Vencimento de {{student}} |
| `charges.preview.changeDue.field` | Novo vencimento | Novo Vencimento |
| `charges.preview.changeDue.submit` | Trocar vencimento | Trocar Vencimento |
| `charges.preview.cancel.title` | Cancelar mensalidade | Cancelar Mensalidade |
| `charges.preview.cancel.open` | Cancelar mensalidade de {{student}} | Cancelar Mensalidade de {{student}} |
| `charges.preview.cancel.submit` | Cancelar mensalidade | Cancelar Mensalidade |
| `charges.preview.benefit.title` | Aplicar benefício | Aplicar Benefício |
| `charges.preview.benefit.open` | Aplicar benefício a {{student}} | Aplicar Benefício a {{student}} |
| `charges.cancel.title` | Cancelar cobrança | Cancelar Cobrança |
| `charges.cancel.submit` | Cancelar cobrança | Cancelar Cobrança |
| `charges.renegotiate.chosen` | Cobrança escolhida | Cobrança Escolhida |
| `charges.renegotiate.howSingle` | Alterar valor e vencimento | Alterar Valor e Vencimento |
| `charges.renegotiate.howSplit` | Dividir em parcelas | Dividir em Parcelas |
| `charges.renegotiate.single` | 1 (novo valor e vencimento) | 1 (Novo Valor e Vencimento) |
| `charges.renegotiate.newValue` | Novo valor | Novo Valor |
| `charges.renegotiate.firstDueOn` | Primeiro vencimento | Primeiro Vencimento |
| `charges.renegotiate.preview` | Prévia das parcelas | Prévia das Parcelas |

## `chooseLink`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `chooseLink.never` | Nunca entrou | Nunca Entrou |
| `chooseLink.lastToday` | Último acesso hoje às {{time}} | Último Acesso Hoje às {{time}} |
| `chooseLink.lastOn` | Último acesso em {{date}} | Último Acesso em {{date}} |
| `chooseLink.remember` | Lembrar esta escolha neste aparelho | Lembrar Esta Escolha Neste Aparelho |
| `chooseLink.trigger` | Trocar organização ou área | Trocar Organização ou Área |
| `chooseLink.retry` | Tentar de novo | Tentar de Novo |

## `classes`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `classes.search` | Nome da turma | Nome da Turma |
| `classes.showResults` | Ver {{count}} turmas | Ver {{count}} Turmas |
| `classes.columns.ageRange` | Faixa etária | Faixa Etária |
| `classes.columns.schedule` | Dias e horários | Dias e Horários |
| `classes.columns.students` | Alunos ativos | Alunos Ativos |
| `classes.over` | Acima da capacidade ({{count}}/{{capacity}}) | Acima da Capacidade ({{count}}/{{capacity}}) |
| `classes.panel.editNarrow` | Editar turma | Editar Turma |
| `classes.panel.viewAllStudents` | Ver todos os alunos | Ver Todos os Alunos |
| `classes.panel.notify` | Avisar turma | Avisar Turma |
| `classes.panel.openGroup` | Abrir grupo | Abrir Grupo |
| `classes.panel.deactivateNarrow` | Desativar turma | Desativar Turma |
| `classes.panel.nextClass` | Próxima aula | Próxima Aula |
| `classes.panel.noNext` | Sem próxima aula | Sem Próxima Aula |
| `classes.panel.noCapacity` | Sem limite | Sem Limite |
| `classes.panel.noGroup` | Sem grupo | Sem Grupo |
| `classes.panel.activeStudents` | Alunos ativos | Alunos Ativos |
| `classes.panel.primary` | Turma principal | Turma Principal |
| `classes.panel.otherSlot` | Outro horário | Outro Horário |
| `classes.panel.belt_one` | Faixa {{level}} · {{count}} grau | Faixa {{level}} · {{count}} Grau |
| `classes.panel.belt_other` | Faixa {{level}} · {{count}} graus | Faixa {{level}} · {{count}} Graus |
| `classes.panel.notFoundTitle` | Turma não encontrada | Turma Não Encontrada |
| `classes.panel.deactivateDialog.title` | Desativar turma | Desativar Turma |
| `classes.panel.deactivateDialog.confirm` | Desativar turma | Desativar Turma |
| `classes.filters.allModalities` | Todas as modalidades | Todas as Modalidades |
| `classes.filters.allTeachers` | Todos os professores | Todos os Professores |
| `classes.filters.ageRange` | Faixa etária | Faixa Etária |
| `classes.filters.allAgeRanges` | Todas as faixas etárias | Todas as Faixas Etárias |
| `classes.filters.allWeekdays` | Todos os dias | Todos os Dias |
| `classes.filters.allStatuses` | Ativas e desativadas | Ativas e Desativadas |
| `classes.newButton` | Nova turma | Nova Turma |
| `classes.form.newTitle` | Nova turma | Nova Turma |
| `classes.form.editTitle` | Editar turma | Editar Turma |
| `classes.form.name` | Nome da turma | Nome da Turma |
| `classes.form.ageRange` | Faixa etária | Faixa Etária |
| `classes.form.noAgeRange` | Sem faixa etária | Sem Faixa Etária |
| `classes.form.schedule` | Dias e horários | Dias e Horários |
| `classes.form.dayOf` | Dia do horário de {{day}} | Dia do Horário de {{day}} |
| `classes.form.removeRow` | Remover horário de {{day}} | Remover Horário de {{day}} |
| `classes.form.addRow` | Adicionar horário | Adicionar Horário |
| `classes.form.notify` | Avisar a turma | Avisar a Turma |
| `classes.form.headSwap` | Para salvar, troque o titular | Para Salvar, Troque o Titular |
| `classes.form.assistantsSearch` | Buscar professor | Buscar Professor |
| `classes.form.assistantsChosen` | Auxiliares escolhidos | Auxiliares Escolhidos |
| `classes.form.head` | Professor titular | Professor Titular |
| `classes.form.assistants` | Professores auxiliares | Professores Auxiliares |
| `classes.form.link` | Link do grupo de WhatsApp (opcional) | Link do Grupo de WhatsApp (Opcional) |
| `classes.form.save` | Salvar turma | Salvar Turma |

## `comingSoon`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `comingSoon.badge` | Em breve | Em Breve |

## `confirm`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `confirm.typeLabel` | Digite {{text}} para confirmar | Digite {{text}} para Confirmar |

## `editConflict`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `editConflict.title` | Estes dados foram alterados por outra pessoa | Estes Dados Foram Alterados por Outra Pessoa |
| `editConflict.differences` | O que está diferente | O que Está Diferente |
| `editConflict.mine` | Seu valor | Seu Valor |
| `editConflict.currentValue` | Valor atual | Valor Atual |

## `enrollmentWizard`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `enrollmentWizard.title` | Nova matrícula | Nova Matrícula |
| `enrollmentWizard.open` | Nova matrícula | Nova Matrícula |
| `enrollmentWizard.trail` | Nova matrícula | Nova Matrícula |
| `enrollmentWizard.sofar.title` | Até aqui | Até Aqui |
| `enrollmentWizard.sofar.financial` | Responsável financeira | Responsável Financeira |
| `enrollmentWizard.student.cpf` | CPF do aluno | CPF do Aluno |
| `enrollmentWizard.student.cpfOptional` | CPF do aluno (opcional para menor) | CPF do Aluno (Opcional para Menor) |
| `enrollmentWizard.student.foundTitle` | Aluno encontrado | Aluno Encontrado |
| `enrollmentWizard.student.confirm` | É este aluno, continuar | É Este Aluno, Continuar |
| `enrollmentWizard.student.status.NONE` | Matrícula nova | Matrícula Nova |
| `enrollmentWizard.student.status.ACTIVE` | Nova modalidade para quem já é aluno | Nova Modalidade para Quem Já É Aluno |
| `enrollmentWizard.student.status.FORMER` | Retorno de ex-aluno | Retorno de Ex-aluno |
| `enrollmentWizard.student.form.useExisting` | Usar o aluno existente | Usar o Aluno Existente |
| `enrollmentWizard.student.form.createAnyway` | Cadastrar mesmo assim | Cadastrar Mesmo Assim |
| `enrollmentWizard.student.form.unit` | Unidade de cadastro | Unidade de Cadastro |
| `enrollmentWizard.student.form.name` | Nome completo | Nome Completo |
| `enrollmentWizard.student.form.birthDate` | Data de nascimento | Data de Nascimento |
| `enrollmentWizard.student.form.guardianFinancial` | Responsável financeira | Responsável Financeira |
| `enrollmentWizard.student.form.guardianAdd` | Adicionar segundo responsável | Adicionar Segundo Responsável |
| `enrollmentWizard.student.form.guardianRemove` | Remover responsável | Remover Responsável |
| `enrollmentWizard.student.form.photo` | Foto (opcional) | Foto (Opcional) |
| `enrollmentWizard.student.form.referral` | Como conheceu (opcional) | Como Conheceu (Opcional) |
| `enrollmentWizard.student.form.emergency` | Contato de emergência (opcional) | Contato de Emergência (Opcional) |
| `enrollmentWizard.student.form.guardianName` | Nome do responsável | Nome do Responsável |
| `enrollmentWizard.student.form.guardianCpf` | CPF do responsável | CPF do Responsável |
| `enrollmentWizard.student.form.guardianEmail` | E-mail do responsável | E-mail do Responsável |
| `enrollmentWizard.student.form.guardianPhone` | Celular do responsável | Celular do Responsável |
| `enrollmentWizard.modalities.emptyTitle` | Nenhuma unidade disponível | Nenhuma Unidade Disponível |
| `enrollmentWizard.modalities.class` | Turma principal | Turma Principal |
| `enrollmentWizard.modalities.add` | Adicionar outra modalidade | Adicionar Outra Modalidade |
| `enrollmentWizard.modalities.benefit.title` | Benefício (opcional) | Benefício (Opcional) |
| `enrollmentWizard.modalities.benefit.percent` | Bolsa em porcentagem | Bolsa em Porcentagem |
| `enrollmentWizard.modalities.benefit.amount` | Desconto em valor | Desconto em Valor |
| `enrollmentWizard.modalities.benefit.amountValue` | Valor do desconto | Valor do Desconto |
| `enrollmentWizard.modalities.benefit.validUntil` | Válido até (opcional) | Válido Até (Opcional) |
| `enrollmentWizard.modalities.origin.title` | Graduação de origem | Graduação de Origem |
| `enrollmentWizard.modalities.origin.achievedOn` | Data da graduação (opcional) | Data da Graduação (Opcional) |
| `enrollmentWizard.modalities.origin.proofRequired` | Comprovante da graduação (obrigatório) | Comprovante da Graduação (Obrigatório) |
| `enrollmentWizard.modalities.origin.proofOptional` | Comprovante da graduação (opcional) | Comprovante da Graduação (Opcional) |
| `enrollmentWizard.billing.dueDay` | Dia de vencimento | Dia de Vencimento |
| `enrollmentWizard.billing.firstCharge` | Primeira cobrança | Primeira Cobrança |
| `enrollmentWizard.billing.feeRow` | Taxa de matrícula | Taxa de Matrícula |
| `enrollmentWizard.billing.exempt` | Isentar a taxa de matrícula | Isentar a Taxa de Matrícula |
| `enrollmentWizard.billing.secondCharge` | Segunda cobrança | Segunda Cobrança |
| `enrollmentWizard.billing.secondDue` | Data da segunda cobrança | Data da Segunda Cobrança |
| `enrollmentWizard.summary.financial` | Responsável financeira | Responsável Financeira |
| `enrollmentWizard.summary.origin` | Graduação de origem | Graduação de Origem |
| `enrollmentWizard.summary.fee` | Taxa de matrícula | Taxa de Matrícula |
| `enrollmentWizard.summary.feeExempt` | Taxa de matrícula (isenta) | Taxa de Matrícula (Isenta) |
| `enrollmentWizard.summary.openDebt_one` | Débito anterior: {{count}} cobrança em aberto, {{value}} | Débito Anterior: {{count}} Cobrança em Aberto, {{value}} |
| `enrollmentWizard.summary.openDebt_other` | Débito anterior: {{count}} cobranças em aberto, {{value}} | Débito Anterior: {{count}} Cobranças em Aberto, {{value}} |
| `enrollmentWizard.summary.term` | Termo de matrícula | Termo de Matrícula |
| `enrollmentWizard.summary.payNow` | Registrar pagamento agora | Registrar Pagamento Agora |
| `enrollmentWizard.summary.payPortalGuardian` | Responsável paga pelo portal | Responsável Paga pelo Portal |
| `enrollmentWizard.summary.payPortalStudent` | Aluno paga pelo portal | Aluno Paga pelo Portal |
| `enrollmentWizard.summary.conclude` | Concluir matrícula | Concluir Matrícula |
| `enrollmentWizard.done.fee` | Taxa de matrícula | Taxa de Matrícula |
| `enrollmentWizard.done.receipt` | Recibo nº {{number}} | Recibo Nº {{number}} |
| `enrollmentWizard.done.payNow` | Registrar pagamento agora | Registrar Pagamento Agora |
| `enrollmentWizard.done.register` | Registrar pagamento | Registrar Pagamento |
| `enrollmentWizard.done.portal` | Aluno paga pelo portal | Aluno Paga pelo Portal |
| `enrollmentWizard.done.back` | Pronto, voltar aos alunos | Pronto, Voltar aos Alunos |
| `enrollmentWizard.done.record` | Abrir ficha de {{name}} | Abrir Ficha de {{name}} |
| `enrollmentWizard.table.methods` | Por meio, com a taxa | Por Meio, com a Taxa |

## `errors`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `errors.generic.title` | Não foi possível carregar | Não Foi Possível Carregar |

## `fields`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `fields.file.choose` | Escolher arquivo | Escolher Arquivo |
| `fields.file.none` | Nenhum arquivo escolhido | Nenhum Arquivo Escolhido |

## `forgot`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `forgot.title` | Esqueci minha senha | Esqueci Minha Senha |
| `forgot.submit` | Enviar link | Enviar Link |
| `forgot.back` | Voltar para o login | Voltar para o Login |

## `invite`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `invite.title` | Criar sua senha | Criar Sua Senha |
| `invite.titleExisting` | Aceitar convite | Aceitar Convite |
| `invite.validUntil` | Vale até {{date}} | Vale Até {{date}} |
| `invite.submit` | Criar senha e entrar | Criar Senha e Entrar |
| `invite.submitExisting` | Aceitar e entrar | Aceitar e Entrar |
| `invite.currentPassword` | Sua senha atual | Sua Senha Atual |
| `invite.confirm` | Repita a senha | Repita a Senha |
| `invite.invalid.title` | Este convite venceu | Este Convite Venceu |
| `invite.invalid.login` | Ir para o login | Ir para o Login |

## `layout`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `layout.openMenu` | Abrir menu | Abrir Menu |
| `layout.closeMenu` | Fechar menu | Fechar Menu |
| `layout.main` | Menu principal | Menu Principal |
| `layout.breadcrumb` | Você está em | Você Está em |
| `layout.skip` | Ir para o conteúdo | Ir para o Conteúdo |
| `layout.soon` | Em breve | Em Breve |
| `layout.collapse` | Recolher menu | Recolher Menu |
| `layout.expand` | Expandir menu | Expandir Menu |
| `layout.darkTheme` | Tema escuro | Tema Escuro |
| `layout.userMenu.label` | Menu da conta | Menu da Conta |
| `layout.myAccount` | Minha conta | Minha Conta |
| `layout.tabs.label` | Abas principais | Abas Principais |

## `menu`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `menu.items.noClassDays` | Dias sem aula | Dias sem Aula |
| `menu.items.trialClasses` | Aulas experimentais | Aulas Experimentais |
| `menu.items.collections` | Cobranças e pagamentos | Cobranças e Pagamentos |
| `menu.items.allUnits` | Todas as unidades | Todas as Unidades |
| `menu.items.ageRanges` | Faixas etárias | Faixas Etárias |
| `menu.items.import` | Importar e exportar | Importar e Exportar |
| `menu.items.exportFull` | Exportação completa | Exportação Completa |

## `modalities`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `modalities.graduationOn` | Graduação ligada | Graduação Ligada |
| `modalities.graduationOff` | Graduação desligada | Graduação Desligada |
| `modalities.tableLabel` | Modalidades da organização | Modalidades da Organização |
| `modalities.table.units` | Unidades que oferecem | Unidades que Oferecem |
| `modalities.deactivateDialog.title` | Desativar modalidade | Desativar Modalidade |
| `modalities.deactivateDialog.head` | Não dá para desativar o {{name}} agora | Não Dá para Desativar o {{name}} Agora |
| `modalities.mine` | Suas modalidades | Suas Modalidades |
| `modalities.available` | Disponíveis para ativar | Disponíveis para Ativar |
| `modalities.emptyTitle` | Nenhuma modalidade no catálogo | Nenhuma Modalidade no Catálogo |
| `modalities.notFound` | Não achei minha modalidade | Não Achei Minha Modalidade |
| `modalities.graduation.view` | Ver graduação | Ver Graduação |
| `modalities.graduation.title` | Sistema de graduação | Sistema de Graduação |
| `modalities.graduation.tableLabel` | Níveis da graduação | Níveis da Graduação |
| `modalities.graduation.levelHeader` | Nível e cor | Nível e Cor |
| `modalities.graduation.maxDegreeHeader` | Grau máximo | Grau Máximo |
| `modalities.graduation.backToDefault` | Voltar ao padrão do catálogo | Voltar ao Padrão do Catálogo |
| `modalities.graduation.saved` | Sistema de graduação salvo | Sistema de Graduação Salvo |
| `modalities.graduation.enabled` | Graduação ligada | Graduação Ligada |
| `modalities.graduation.requireProof` | Exigir comprovante da graduação de origem | Exigir Comprovante da Graduação de Origem |
| `modalities.graduation.empty` | Nenhum nível ainda | Nenhum Nível Ainda |
| `modalities.graduation.levelName` | Nome do nível {{n}} | Nome do Nível {{n}} |
| `modalities.graduation.color` | Cor do nível {{n}} | Cor do Nível {{n}} |
| `modalities.graduation.maxDegree` | Grau máximo do nível {{n}} | Grau Máximo do Nível {{n}} |
| `modalities.graduation.minAge` | Idade mínima do nível {{n}} | Idade Mínima do Nível {{n}} |
| `modalities.graduation.maxAge` | Idade máxima do nível {{n}} | Idade Máxima do Nível {{n}} |
| `modalities.graduation.kids` | Nível {{n}} é infantil | Nível {{n}} É Infantil |
| `modalities.graduation.up` | Subir nível {{n}} | Subir Nível {{n}} |
| `modalities.graduation.down` | Descer nível {{n}} | Descer Nível {{n}} |
| `modalities.graduation.remove` | Remover nível {{n}} | Remover Nível {{n}} |
| `modalities.graduation.add` | Adicionar nível | Adicionar Nível |
| `modalities.dialog.title` | Não achei minha modalidade | Não Achei Minha Modalidade |
| `modalities.dialog.name` | Nome da modalidade | Nome da Modalidade |
| `modalities.dialog.send` | Enviar pedido | Enviar Pedido |

## `noClassDays`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `noClassDays.title` | Dias sem aula | Dias sem Aula |
| `noClassDays.new` | Novo dia sem aula | Novo Dia sem Aula |
| `noClassDays.suggestions.title` | Feriados sugeridos | Feriados Sugeridos |
| `noClassDays.suggestions.titleMobile` | Feriados para confirmar | Feriados para Confirmar |
| `noClassDays.suggestions.affected` | Aulas afetadas | Aulas Afetadas |
| `noClassDays.suggestions.affected_zero` | Nenhuma aula | Nenhuma Aula |
| `noClassDays.list.date` | Data ou período | Data ou Período |
| `noClassDays.origins.HOLIDAY` | Feriado sugerido | Feriado Sugerido |
| `noClassDays.origins.COORDINATOR_BATCH` | Coordenador ({{count}} unidades) | Coordenador ({{count}} Unidades) |
| `noClassDays.noticeStatus.NOT_NOTIFIED` | Ainda não avisado | Ainda Não Avisado |
| `noClassDays.emptyTitle` | Nenhum dia sem aula | Nenhum Dia sem Aula |
| `noClassDays.dialog.titleNew` | Novo dia sem aula | Novo Dia sem Aula |
| `noClassDays.dialog.titleEdit` | Editar dia sem aula | Editar Dia sem Aula |
| `noClassDays.dialog.endsOn` | Até (opcional) | Até (Opcional) |
| `noClassDays.dialog.classesAll` | Todas as turmas da unidade | Todas as Turmas da Unidade |
| `noClassDays.dialog.classesSome` | Só algumas turmas | Só Algumas Turmas |
| `noClassDays.dialog.previewLoading` | Conferindo as aulas… | Conferindo as Aulas… |
| `noClassDays.dialog.previewRetry` | Tentar de novo | Tentar de Novo |
| `noClassDays.dialog.notices.NONE` | Não avisar agora | Não Avisar Agora |
| `noClassDays.dialog.save` | Lançar dia sem aula | Lançar Dia sem Aula |
| `noClassDays.dialog.saveEdit` | Salvar alterações | Salvar Alterações |
| `noClassDays.undoDialog.title` | Desfazer dia sem aula | Desfazer Dia sem Aula |
| `noClassDays.undoDialog.notify` | Avisar as turmas | Avisar as Turmas |
| `noClassDays.undoDialog.confirm` | Desfazer dia | Desfazer Dia |

## `notifications`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `notifications.bell.withCount` | Notificações, {{count}} não lidas | Notificações, {{count}} Não Lidas |
| `notifications.unreadDot` | Não lida | Não Lida |
| `notifications.retention` | As notificações somem depois de 30 dias | As Notificações Somem Depois de 30 Dias |
| `notifications.filters.label` | Filtrar notificações | Filtrar Notificações |
| `notifications.filters.unread` | Não lidas | Não Lidas |
| `notifications.groups.WEEK` | Esta semana | Esta Semana |
| `notifications.markAll` | Marcar todas como lidas | Marcar Todas Como Lidas |
| `notifications.markAllShort` | Marcar lidas | Marcar Lidas |
| `notifications.allRead.title` | Tudo lido | Tudo Lido |
| `notifications.empty.title` | Nenhuma notificação | Nenhuma Notificação |
| `notifications.types.PAYMENT_RECEIVED.title` | Pagamento recebido | Pagamento Recebido |
| `notifications.types.HIGH_BENEFIT.title` | Benefício acima de 50% | Benefício Acima de 50% |
| `notifications.types.STUDENT_MAJORITY.title` | Aluno fez 18 anos | Aluno Fez 18 Anos |
| `notifications.types.EMAIL_PROBLEM.title` | E-mail com problema | E-mail com Problema |
| `notifications.types.INVITE_PENDING.title` | Convite sem aceite | Convite sem Aceite |
| `notifications.types.CLOSURE_REQUEST.title` | Pedido de encerramento | Pedido de Encerramento |
| `notifications.types.PORTAL_REQUEST.title` | Pedido do portal | Pedido do Portal |
| `notifications.types.PAYMENT_PROOF.title` | Comprovante para conferir | Comprovante para Conferir |
| `notifications.types.MP_DISCONNECTED.title` | Pagamentos desconectados | Pagamentos Desconectados |
| `notifications.types.SUBSCRIPTION_OVERDUE.title` | Assinatura em atraso | Assinatura em Atraso |

## `organization`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `organization.name` | Nome da organização | Nome da Organização |
| `organization.holder` | Titular (razão social ou nome) | Titular (Razão Social ou Nome) |
| `organization.color` | Cor principal | Cor Principal |
| `organization.colorHex` | Cor principal | Cor Principal |
| `organization.colorSwatches` | Amostras de cor | Amostras de Cor |
| `organization.colorSwatch` | Usar a cor {{hex}} | Usar a Cor {{hex}} |
| `organization.previewLabel` | Prévia no portal | Prévia no Portal |
| `organization.previewIllegible` | Prévia: o texto fica ilegível | Prévia: o Texto Fica Ilegível |
| `organization.save` | Salvar alterações | Salvar Alterações |
| `organization.logoAlt` | Logo da organização | Logo da Organização |
| `organization.logoFile` | Arquivo da logo | Arquivo da Logo |
| `organization.logoUpload` | Enviar logo | Enviar Logo |
| `organization.logoReplace` | Trocar logo | Trocar Logo |
| `organization.logoRemove` | Remover logo | Remover Logo |
| `organization.rules.title` | Regras da organização | Regras da Organização |
| `organization.rules.deactivationDays` | Prazo para bloquear por atraso | Prazo para Bloquear por Atraso |
| `organization.rules.formerStudentRetentionMonths` | Acesso de ex-aluno ao histórico | Acesso de Ex-aluno ao Histórico |
| `organization.rules.trialRetentionMonths` | Guardar aulas experimentais sem matrícula | Guardar Aulas Experimentais sem Matrícula |
| `organization.rules.trialLimit` | Experimentais por telefone, por unidade | Experimentais por Telefone, por Unidade |
| `organization.rules.crossUnitTraining` | Treinar em outra unidade | Treinar em Outra Unidade |
| `organization.rules.crossUnit.plan` | Depende do plano | Depende do Plano |
| `organization.rules.proof` | Exigir comprovante da graduação de origem | Exigir Comprovante da Graduação de Origem |
| `organization.coordination.line` | Coordenador · {{email}} · duas etapas {{state}} | Coordenador · {{email}} · Duas Etapas {{state}} |
| `organization.transfer.title` | Transferir coordenação | Transferir Coordenação |
| `organization.transfer.open` | Transferir coordenação | Transferir Coordenação |
| `organization.transfer.noneActive` | Nenhum Administrador ativo | Nenhum Administrador Ativo |
| `organization.transfer.confirmBefore` | Para confirmar, digite  | Para Confirmar, Digite  |
| `organization.transfer.password` | Sua senha | Sua Senha |
| `organization.transfer.code` | Código de duas etapas | Código de Duas Etapas |
| `organization.transfer.submit` | Transferir coordenação | Transferir Coordenação |
| `organization.crop.title` | Cortar a logo | Cortar a Logo |
| `organization.crop.preview` | Prévia do corte da logo | Prévia do Corte da Logo |
| `organization.crop.horizontal` | Posição horizontal | Posição Horizontal |
| `organization.crop.vertical` | Posição vertical | Posição Vertical |
| `organization.crop.confirm` | Usar este corte | Usar Este Corte |

## `password`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `password.confirm` | Confirmar senha | Confirmar Senha |
| `password.rules.title` | Regras da senha | Regras da Senha |
| `password.rules.length` | 8 ou mais caracteres | 8 ou Mais Caracteres |
| `password.rules.number` | 1 número | 1 Número |
| `password.rules.upper` | 1 letra maiúscula | 1 Letra Maiúscula |
| `password.rules.leak` | Não aparece em vazamentos conhecidos | Não Aparece em Vazamentos Conhecidos |

## `paymentProofs`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `paymentProofs.title` | Em conferência | Em Conferência |
| `paymentProofs.scopeAll` | Todas as unidades | Todas as Unidades |
| `paymentProofs.emptyTitle` | Nenhum comprovante em conferência | Nenhum Comprovante em Conferência |
| `paymentProofs.waiting` | Também aguardando | Também Aguardando |
| `paymentProofs.featured.label` | Comprovante de {{student}} em destaque | Comprovante de {{student}} em Destaque |
| `paymentProofs.featured.amount` | Valor da cobrança | Valor da Cobrança |
| `paymentProofs.featured.key` | Chave da unidade | Chave da Unidade |
| `paymentProofs.featured.block` | Prazo de bloqueio | Prazo de Bloqueio |
| `paymentProofs.featured.confirm` | Confirmar pagamento | Confirmar Pagamento |
| `paymentProofs.review.title` | Conferir comprovante | Conferir Comprovante |
| `paymentProofs.review.badge_one` | 1 comprovante · {{count}} cobrança | 1 Comprovante · {{count}} Cobrança |
| `paymentProofs.review.badge_other` | 1 comprovante · {{count}} cobranças | 1 Comprovante · {{count}} Cobranças |
| `paymentProofs.image.zoom` | Ampliar comprovante de {{student}} | Ampliar Comprovante de {{student}} |
| `paymentProofs.image.unavailable` | Imagem indisponível | Imagem Indisponível |
| `paymentProofs.image.openFile` | Abrir arquivo | Abrir Arquivo |
| `paymentProofs.confirm.title` | Confirmar comprovante | Confirmar Comprovante |
| `paymentProofs.confirm.sendReceipt` | Enviar o recibo por e-mail | Enviar o Recibo por E-mail |
| `paymentProofs.confirm.submit` | Confirmar pagamento | Confirmar Pagamento |
| `paymentProofs.refuse.title` | Recusar comprovante | Recusar Comprovante |
| `paymentProofs.refuse.submit` | Recusar comprovante | Recusar Comprovante |

## `payments`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `payments.method.CREDIT_CARD` | Cartão de crédito | Cartão de Crédito |
| `payments.method.DEBIT_CARD` | Cartão de débito | Cartão de Débito |
| `payments.method.PIX_KEY` | Pix pela chave | Pix pela Chave |
| `payments.method.CARD_MACHINE` | Maquininha de cartão | Maquininha de Cartão |
| `payments.dialog.title` | Registrar pagamento | Registrar Pagamento |
| `payments.dialog.methods.PIX_KEY` | Pix na chave da unidade | Pix na Chave da Unidade |
| `payments.dialog.methods.CARD_MACHINE` | Cartão na maquininha | Cartão na Maquininha |
| `payments.dialog.receiptToPayer` | Para o e-mail cadastrado do pagador | Para o E-mail Cadastrado do Pagador |
| `payments.dialog.confirm` | Registrar pagamento | Registrar Pagamento |
| `payments.dialog.day` | Data do pagamento | Data do Pagamento |
| `payments.dialog.observation` | Observação (opcional) | Observação (Opcional) |
| `payments.dialog.sendReceipt` | Enviar recibo por e-mail | Enviar Recibo por E-mail |
| `payments.dialog.download` | Baixar recibo | Baixar Recibo |
| `payments.dialog.receiptNumber` | Recibo número {{number}} | Recibo Número {{number}} |
| `payments.dialog.receiptCode` | Código de conferência: {{code}} | Código de Conferência: {{code}} |

## `permissionsTable`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `permissionsTable.title` | Tabela de permissões | Tabela de Permissões |
| `permissionsTable.back` | Voltar aos usuários | Voltar aos Usuários |
| `permissionsTable.area` | Área ou ação | Área ou Ação |
| `permissionsTable.rows.home.label` | Início da unidade | Início da Unidade |
| `permissionsTable.rows.consolidated.label` | "Todas as unidades" (consolidado) | "Todas as Unidades" (Consolidado) |
| `permissionsTable.rows.studentsSimple.TEACHER` | T, sempre | T, Sempre |
| `permissionsTable.rows.studentsFull.label` | Alunos: lista completa | Alunos: Lista Completa |
| `permissionsTable.rows.studentRecord.label` | Alunos: abrir a ficha | Alunos: Abrir a Ficha |
| `permissionsTable.rows.studentContacts.label` | Alunos: contatos e emergência | Alunos: Contatos e Emergência |
| `permissionsTable.rows.studentManage.label` | Alunos: cadastrar, editar, matricular, encerrar | Alunos: Cadastrar, Editar, Matricular, Encerrar |
| `permissionsTable.rows.plansBenefits.label` | Planos e benefícios | Planos e Benefícios |
| `permissionsTable.rows.collections.label` | Cobranças, pagamentos, estorno, renegociação | Cobranças, Pagamentos, Estorno, Renegociação |
| `permissionsTable.rows.classes.label` | Turmas: lista, painel, criar, editar e desativar | Turmas: Lista, Painel, Criar, Editar e Desativar |
| `permissionsTable.rows.classes.TEACHER` | — (vê as suas pela Agenda) | — (Vê as Suas pela Agenda) |
| `permissionsTable.rows.agendaView.label` | Agenda: ver | Agenda: Ver |
| `permissionsTable.rows.agendaEdit.label` | Agenda: editar e cancelar aula | Agenda: Editar e Cancelar Aula |
| `permissionsTable.rows.noClassDays.label` | Dias sem aula | Dias sem Aula |
| `permissionsTable.rows.graduation.label` | Graduação: registrar | Graduação: Registrar |
| `permissionsTable.rows.graduation.TEACHER` | — (consulta T) | — (Consulta T) |
| `permissionsTable.rows.trial.label` | Aulas experimentais | Aulas Experimentais |
| `permissionsTable.rows.trial.TEACHER` | T* (ver) | T* (Ver) |
| `permissionsTable.rows.staffUsers.label` | Usuários da gestão | Usuários da Gestão |
| `permissionsTable.rows.unitSettings.label` | Configurações da unidade | Configurações da Unidade |
| `permissionsTable.rows.orgSettings.label` | Configurações da organização | Configurações da Organização |
| `permissionsTable.rows.subscription.label` | Assinatura e faturas | Assinatura e Faturas |
| `permissionsTable.rows.exportLists.label` | Exportar listas | Exportar Listas |
| `permissionsTable.rows.exportFull.label` | Exportação completa | Exportação Completa |
| `permissionsTable.rows.support.label` | Liberar acesso de suporte | Liberar Acesso de Suporte |

## `pixProof`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `pixProof.title` | Pix na chave com comprovante | Pix na Chave com Comprovante |
| `pixProof.titleMobile` | Pix na chave da unidade | Pix na Chave da Unidade |
| `pixProof.dropMobile` | Enviar foto ou PDF do comprovante | Enviar Foto ou PDF do Comprovante |
| `pixProof.submit` | Enviar comprovante | Enviar Comprovante |
| `pixProof.noKeyTitle` | Esta unidade não tem chave Pix cadastrada | Esta Unidade Não Tem Chave Pix Cadastrada |
| `pixProof.charges` | Cobranças deste pagamento | Cobranças Deste Pagamento |
| `pixProof.badSelectionTitle` | Estas cobranças não podem ser pagas juntas | Estas Cobranças Não Podem Ser Pagas Juntas |
| `pixProof.notPayableTitle` | Esta cobrança não está aberta | Esta Cobrança Não Está Aberta |

## `plans`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `plans.title` | Planos e benefícios | Planos e Benefícios |
| `plans.newButton` | Novo plano | Novo Plano |
| `plans.tabsLabel` | Planos e benefícios | Planos e Benefícios |
| `plans.cards.seeBenefits` | Ver benefícios | Ver Benefícios |
| `plans.table.emptyTitle` | Nenhum plano ainda | Nenhum Plano Ainda |
| `plans.table.otherYes` | Vale nas outras unidades | Vale nas Outras Unidades |
| `plans.table.otherNo` | Só nesta unidade | Só Nesta Unidade |
| `plans.table.columns.otherUnits` | Outras unidades | Outras Unidades |
| `plans.form.newTitle` | Novo plano | Novo Plano |
| `plans.form.editTitle` | Editar plano | Editar Plano |
| `plans.form.valueCurrent` | Valor atual | Valor Atual |
| `plans.form.valueNew` | Novo valor | Novo Valor |
| `plans.form.valueNewCreate` | Valor mensal | Valor Mensal |
| `plans.form.frequencyOptions.2` | 2x por semana | 2x por Semana |
| `plans.form.frequencyOptions.3` | 3x por semana | 3x por Semana |
| `plans.form.validOtherUnits` | Vale também nas outras unidades | Vale Também nas Outras Unidades |
| `plans.form.impact.unpaid` | Cobranças já geradas e não pagas ({{count}}) | Cobranças Já Geradas e Não Pagas ({{count}}) |
| `plans.form.impact.unpaidKeep` | Manter no valor antigo (padrão) | Manter no Valor Antigo (Padrão) |
| `plans.form.impact.unpaidAdjust` | Ajustar para o valor novo | Ajustar para o Valor Novo |
| `plans.form.impact.paid` | Cobranças de meses futuros já pagas ({{count}}) | Cobranças de Meses Futuros Já Pagas ({{count}}) |
| `plans.form.impact.paidNone` | Não cobrar a diferença (padrão) | Não Cobrar a Diferença (Padrão) |
| `plans.form.impact.paidCharge` | Cobrar "Diferença de reajuste" numa cobrança separada | Cobrar "Diferença de Reajuste" Numa Cobrança Separada |
| `plans.form.impact.paidAside` | O aluno é avisado | O Aluno É Avisado |
| `plans.form.required` | Campo obrigatório | Campo Obrigatório |
| `plans.form.save` | Salvar plano | Salvar Plano |
| `plans.form.create` | Criar plano | Criar Plano |
| `plans.form.deactivate` | Desativar plano | Desativar Plano |
| `plans.deactivateDialog.title` | Desativar plano | Desativar Plano |
| `plans.deactivateDialog.confirm` | Desativar plano | Desativar Plano |
| `plans.inspect.students` | Alunos que ainda usam | Alunos que Ainda Usam |
| `plans.inspect.otherUnits` | Vale em outras unidades | Vale em Outras Unidades |
| `plans.inspect.history` | Histórico de valor | Histórico de Valor |
| `plans.inspect.reactivate` | Reativar plano | Reativar Plano |

## `portalAgenda`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `portalAgenda.scopeLabel` | Aulas mostradas | Aulas Mostradas |
| `portalAgenda.scopeMain` | Só minha turma | Só Minha Turma |
| `portalAgenda.scopeAll` | Todos os meus horários | Todos os Meus Horários |
| `portalAgenda.prevWeek` | Semana anterior | Semana Anterior |
| `portalAgenda.nextWeek` | Próxima semana | Próxima Semana |
| `portalAgenda.kind.OTHER` | Outro horário | Outro Horário |
| `portalAgenda.past` | Já aconteceu | Já Aconteceu |
| `portalAgenda.noClass` | Sem aula | Sem Aula |
| `portalAgenda.substituteName` | Professor substituto: {{name}} | Professor Substituto: {{name}} |
| `portalAgenda.changedGeneric` | Aula alterada | Aula Alterada |
| `portalAgenda.viewNoticeOf` | Ver aviso sobre {{title}} | Ver Aviso Sobre {{title}} |
| `portalAgenda.emptyTitle` | Nenhuma aula nesta semana | Nenhuma Aula Nesta Semana |
| `portalAgenda.label` | Só consulta | Só Consulta |
| `portalAgenda.prevDay` | Dia anterior | Dia Anterior |
| `portalAgenda.nextDay` | Próximo dia | Próximo Dia |
| `portalAgenda.typeOther` | Outro horário | Outro Horário |
| `portalAgenda.typeAdhoc` | Aula avulsa | Aula Avulsa |
| `portalAgenda.mainPill` | Turma principal | Turma Principal |

## `portalAnnouncements`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `portalAnnouncements.label` | Da academia | Da Academia |
| `portalAnnouncements.filterLabel` | Avisos mostrados | Avisos Mostrados |
| `portalAnnouncements.filter.UNREAD` | Não lidos | Não Lidos |
| `portalAnnouncements.markAll` | Marcar todos como lidos | Marcar Todos Como Lidos |
| `portalAnnouncements.markAllShort` | Marcar lidos | Marcar Lidos |
| `portalAnnouncements.pinnedUntil` | Fixado até {{date}} | Fixado Até {{date}} |
| `portalAnnouncements.unreadDot` | Não lido | Não Lido |
| `portalAnnouncements.allClasses` | Todas as turmas | Todas as Turmas |
| `portalAnnouncements.listLabel` | Lista de avisos | Lista de Avisos |
| `portalAnnouncements.back` | Voltar aos avisos | Voltar aos Avisos |
| `portalAnnouncements.type.CANCELED_CLASS` | Aula cancelada | Aula Cancelada |
| `portalAnnouncements.type.TEACHER_CHANGE` | Troca de professor | Troca de Professor |
| `portalAnnouncements.type.SCHEDULE_CHANGE` | Mudança de horário | Mudança de Horário |
| `portalAnnouncements.type.NO_CLASS_DAY` | Dia sem aula | Dia sem Aula |
| `portalAnnouncements.viewAgenda` | Ver na agenda | Ver na Agenda |
| `portalAnnouncements.openGroup` | Abrir o grupo da turma | Abrir o Grupo da Turma |
| `portalAnnouncements.pageNav` | Páginas de avisos | Páginas de Avisos |
| `portalAnnouncements.prev` | Página anterior | Página Anterior |
| `portalAnnouncements.next` | Próxima página | Próxima Página |
| `portalAnnouncements.emptyTitle` | Nenhum aviso | Nenhum Aviso |
| `portalAnnouncements.emptyUnreadTitle` | Nenhum aviso não lido | Nenhum Aviso Não Lido |
| `portalAnnouncements.imageAlt` | Imagem do aviso | Imagem do Aviso |
| `portalAnnouncements.notFoundTitle` | Aviso indisponível | Aviso Indisponível |

## `portalCard`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `portalCard.link` | Ver carteirinha | Ver Carteirinha |
| `portalCard.noBelt` | Sem faixa registrada | Sem Faixa Registrada |
| `portalCard.emptyTitle` | Nenhuma modalidade ativa | Nenhuma Modalidade Ativa |

## `portalConfirm`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `portalConfirm.title` | Nova modalidade | Nova Modalidade |
| `portalConfirm.agree` | Confirmo o plano e o valor | Confirmo o Plano e o Valor |

## `portalFinance`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `portalFinance.states.loading` | Carregando suas cobranças… | Carregando Suas Cobranças… |
| `portalFinance.states.forbiddenTitle` | Esta área não está disponível para você | Esta Área Não Está Disponível para Você |
| `portalFinance.label` | Cobranças e recibos | Cobranças e Recibos |
| `portalFinance.family` | Toda a família | Toda a Família |
| `portalFinance.open.title` | Em aberto | Em Aberto |
| `portalFinance.open.emptyTitle` | Nenhuma cobrança em aberto | Nenhuma Cobrança em Aberto |
| `portalFinance.open.sendProof` | Enviar comprovante de Pix | Enviar Comprovante de Pix |
| `portalFinance.open.situation.DUE_TODAY` | Vence hoje | Vence Hoje |
| `portalFinance.open.situation.PENDING` | A vencer | A Vencer |
| `portalFinance.open.situation.IN_REVIEW` | Em conferência | Em Conferência |
| `portalFinance.history.emptyTitle` | Nenhum histórico neste ano | Nenhum Histórico Neste Ano |
| `portalFinance.autoDebit.title` | Débito automático | Débito Automático |
| `portalFinance.receipts.title` | Recibos por e-mail | Recibos por E-mail |

## `portalHome`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `portalHome.states.loading` | Carregando o seu início… | Carregando o Seu Início… |
| `portalHome.family.label` | Alunos da família | Alunos da Família |
| `portalHome.family.upToDate` | Em dia | Em Dia |
| `portalHome.family.all` | Toda a família | Toda a Família |
| `portalHome.family.total` | Em aberto na família {{value}} | Em Aberto na Família {{value}} |
| `portalHome.family.seeFinance` | Ver financeiro da família | Ver Financeiro da Família |
| `portalHome.filter.label` | Modalidade e unidade | Modalidade e Unidade |
| `portalHome.charges.upToDate` | Tudo em dia | Tudo em Dia |
| `portalHome.charges.nextDue` | Próximo vencimento: {{date}} | Próximo Vencimento: {{date}} |
| `portalHome.charges.viewFinance` | Ver financeiro | Ver Financeiro |
| `portalHome.charges.alsoOpen` | Também em aberto: {{value}} | Também em Aberto: {{value}} |
| `portalHome.charges.situation.DUE_TODAY` | Vence hoje | Vence Hoje |
| `portalHome.charges.situation.IN_REVIEW` | Em conferência | Em Conferência |
| `portalHome.lessons.title` | Próximas aulas | Próximas Aulas |
| `portalHome.lessons.emptyTitle` | Nenhuma aula por enquanto | Nenhuma Aula por Enquanto |
| `portalHome.lessons.noLesson` | Sem aula | Sem Aula |
| `portalHome.lessons.viewAgenda` | Ver agenda | Ver Agenda |
| `portalHome.notices.emptyTitle` | Nenhum aviso novo | Nenhum Aviso Novo |
| `portalHome.notices.unread` | Não lido | Não Lido |
| `portalHome.notices.viewAll` | Ver todos | Ver Todos |
| `portalHome.belts.emptyTitle` | Nenhuma faixa registrada | Nenhuma Faixa Registrada |
| `portalHome.belts.grade_one` | Faixa {{level}} · {{count}} grau | Faixa {{level}} · {{count}} Grau |
| `portalHome.belts.grade_other` | Faixa {{level}} · {{count}} graus | Faixa {{level}} · {{count}} Graus |
| `portalHome.belts.swatch` | Cor da faixa {{level}} | Cor da Faixa {{level}} |

## `portalInfo`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `portalInfo.title` | Minhas informações | Minhas Informações |
| `portalInfo.cardLink` | Ver carteirinha | Ver Carteirinha |
| `portalInfo.none` | Não informado | Não Informado |
| `portalInfo.emptyTitle` | Nenhuma modalidade ativa | Nenhuma Modalidade Ativa |
| `portalInfo.personal.title` | Dados pessoais | Dados Pessoais |
| `portalInfo.personal.edit` | Editar contato | Editar Contato |
| `portalInfo.personal.emergency` | Contato de emergência | Contato de Emergência |
| `portalInfo.personal.photoChoose` | Escolher foto | Escolher Foto |
| `portalInfo.personal.photoReplace` | Trocar foto | Trocar Foto |
| `portalInfo.personal.photoRemove` | Remover foto | Remover Foto |
| `portalInfo.personal.photoFile` | Arquivo da foto | Arquivo da Foto |
| `portalInfo.personal.cropTitle` | Cortar a foto | Cortar a Foto |
| `portalInfo.personal.cropPreview` | Prévia do corte da foto | Prévia do Corte da Foto |
| `portalInfo.contact.title` | Editar contato | Editar Contato |
| `portalInfo.contact.emergency` | Contato de emergência | Contato de Emergência |
| `portalInfo.contact.emergencyName` | Nome do contato | Nome do Contato |
| `portalInfo.contact.emergencyPhone` | Telefone do contato | Telefone do Contato |
| `portalInfo.units.title` | Contato da academia | Contato da Academia |
| `portalInfo.trainings.main` | Turma principal | Turma Principal |
| `portalInfo.trainings.others` | Outros horários | Outros Horários |
| `portalInfo.trainings.noSchedule` | Sem horário definido | Sem Horário Definido |
| `portalInfo.plans.title` | Plano e mensalidade | Plano e Mensalidade |
| `portalInfo.plans.noBenefit` | Sem benefício | Sem Benefício |
| `portalInfo.plans.next` | Plano seguinte | Plano Seguinte |
| `portalInfo.graduation.current` | Faixa atual | Faixa Atual |
| `portalInfo.graduation.none` | Sem faixa registrada | Sem Faixa Registrada |
| `portalInfo.graduation.origin` | De origem | De Origem |
| `portalInfo.preferences.emailAnnouncements` | Receber comunicados por e-mail | Receber Comunicados por E-mail |
| `portalInfo.terms.title` | Termos aceitos | Termos Aceitos |
| `portalInfo.terms.enrollment` | Termo de matrícula | Termo de Matrícula |
| `portalInfo.terms.enrollmentAccepted` | Aceito (versão {{version}}) em {{date}} | Aceito (Versão {{version}}) em {{date}} |
| `portalInfo.terms.enrollmentNone` | Ainda não aceito | Ainda Não Aceito |
| `portalInfo.terms.imageUse` | Uso de imagem | Uso de Imagem |
| `portalInfo.terms.imageGranted` | Concedido (versão {{version}}) em {{date}} | Concedido (Versão {{version}}) em {{date}} |
| `portalInfo.terms.imageNotGranted` | Não concedido | Não Concedido |
| `portalInfo.terms.revoke` | Revogar uso de imagem | Revogar Uso de Imagem |
| `portalInfo.terms.grant` | Conceder uso de imagem | Conceder Uso de Imagem |
| `portalInfo.terms.revokeTitle` | Revogar uso de imagem | Revogar Uso de Imagem |
| `portalInfo.requests.title` | Pedidos à academia | Pedidos à Academia |
| `portalInfo.requests.make` | Fazer um pedido | Fazer um Pedido |
| `portalInfo.account.title` | Minha conta | Minha Conta |
| `portalInfo.data.title` | Seus dados | Seus Dados |
| `portalInfo.data.download` | Baixar meus dados | Baixar Meus Dados |
| `portalInfo.data.delete` | Excluir minha conta | Excluir Minha Conta |

## `portalOwn`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `portalOwn.title` | Meus pedidos | Meus Pedidos |
| `portalOwn.noStudentTitle` | Nenhum aluno ligado à conta | Nenhum Aluno Ligado à Conta |
| `portalOwn.actionsTitle` | Fazer um pedido | Fazer um Pedido |
| `portalOwn.actions.CLASS_CHANGE` | Pedir troca de turma | Pedir Troca de Turma |
| `portalOwn.actions.PLAN_CHANGE` | Pedir troca de plano | Pedir Troca de Plano |
| `portalOwn.actions.CLOSURE` | Solicitar encerramento | Solicitar Encerramento |
| `portalOwn.actions.NEW_MODALITY` | Pedir nova modalidade | Pedir Nova Modalidade |
| `portalOwn.listTitle` | Pedidos feitos | Pedidos Feitos |
| `portalOwn.emptyTitle` | Nenhum pedido ainda | Nenhum Pedido Ainda |
| `portalOwn.response` | Resposta da academia: {{response}} | Resposta da Academia: {{response}} |
| `portalOwn.dialog.CLASS_CHANGE.title` | Pedir troca de turma | Pedir Troca de Turma |
| `portalOwn.dialog.CLASS_CHANGE.field` | Turma desejada | Turma Desejada |
| `portalOwn.dialog.CLASS_CHANGE.submit` | Enviar pedido | Enviar Pedido |
| `portalOwn.dialog.PLAN_CHANGE.title` | Pedir troca de plano | Pedir Troca de Plano |
| `portalOwn.dialog.PLAN_CHANGE.field` | Plano desejado | Plano Desejado |
| `portalOwn.dialog.PLAN_CHANGE.submit` | Enviar pedido | Enviar Pedido |
| `portalOwn.dialog.NEW_MODALITY.title` | Pedir nova modalidade | Pedir Nova Modalidade |
| `portalOwn.dialog.NEW_MODALITY.field` | Modalidade e unidade | Modalidade e Unidade |
| `portalOwn.dialog.NEW_MODALITY.submit` | Enviar pedido | Enviar Pedido |
| `portalOwn.dialog.CLOSURE.title` | Solicitar encerramento | Solicitar Encerramento |
| `portalOwn.dialog.CLOSURE.submit` | Solicitar encerramento | Solicitar Encerramento |

## `portalRequests`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `portalRequests.emptyTitle` | Nenhum pedido | Nenhum Pedido |
| `portalRequests.kinds.CLASS_CHANGE` | Troca de turma | Troca de Turma |
| `portalRequests.kinds.NEW_MODALITY` | Nova modalidade | Nova Modalidade |
| `portalRequests.kinds.PLAN_CHANGE` | Troca de plano | Troca de Plano |
| `portalRequests.actions.openRecord` | Ver ficha | Ver Ficha |
| `portalRequests.refuse.title` | Recusar pedido | Recusar Pedido |
| `portalRequests.refuse.closureTitle` | Recusar encerramento | Recusar Encerramento |
| `portalRequests.refuse.submit` | Recusar pedido | Recusar Pedido |
| `portalRequests.refuse.closureSubmit` | Recusar e enviar mensagem | Recusar e Enviar Mensagem |
| `portalRequests.tabs.requests` | Pedidos do portal | Pedidos do Portal |
| `portalRequests.tabs.pending` | Aguardando aprovação | Aguardando Aprovação |

## `portalShell`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `portalShell.logoAlt` | Logo da organização | Logo da Organização |
| `portalShell.navBottom` | Portal, abas | Portal, Abas |
| `portalShell.skip` | Ir para o conteúdo | Ir para o Conteúdo |
| `portalShell.footer.label` | Rodapé do portal | Rodapé do Portal |
| `portalShell.bell.withCount` | Avisos, {{count}} não lidos | Avisos, {{count}} Não Lidos |

## `portalTerm`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `portalTerm.title` | Termo de matrícula | Termo de Matrícula |
| `portalTerm.eyebrow` | Antes de começar | Antes de Começar |
| `portalTerm.doneNow` | Aceito agora | Aceito Agora |
| `portalTerm.missing` | Falta aceitar | Falta Aceitar |
| `portalTerm.termTitle` | Termo de matrícula · versão {{version}} | Termo de Matrícula · Versão {{version}} |
| `portalTerm.accept` | Li e aceito o termo de matrícula | Li e Aceito o Termo de Matrícula |
| `portalTerm.submit` | Aceitar e continuar | Aceitar e Continuar |
| `portalTerm.emptyTitle` | Nenhum termo para aceitar | Nenhum Termo para Aceitar |
| `portalTerm.emptyAction` | Ir para o início | Ir para o Início |

## `publicReceipt`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `publicReceipt.title` | Recibo número {{number}} | Recibo Número {{number}} |
| `publicReceipt.notFoundTitle` | Recibo não encontrado | Recibo Não Encontrado |

## `query`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `query.clear` | Limpar filtros | Limpar Filtros |
| `query.noResultTitle` | Nenhum resultado | Nenhum Resultado |
| `query.prev` | Página anterior | Página Anterior |
| `query.nextPage` | Próxima página | Próxima Página |
| `query.pageSize` | Itens por página | Itens por Página |
| `query.pageSizeShort` | Por página | Por Página |

## `reauth`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `reauth.title` | Confirme que é você | Confirme que É Você |
| `reauth.code` | Código do app ou de reserva | Código do App ou de Reserva |

## `reset`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `reset.title` | Nova senha | Nova Senha |
| `reset.password` | Nova senha | Nova Senha |
| `reset.confirm` | Repita a nova senha | Repita a Nova Senha |
| `reset.submit` | Criar senha e entrar | Criar Senha e Entrar |
| `reset.invalid.title` | Este link venceu | Este Link Venceu |
| `reset.invalid.ask` | Enviar um link novo | Enviar um Link Novo |

## `settingsIndex`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `settingsIndex.items.ageRanges` | Faixas etárias | Faixas Etárias |
| `settingsIndex.items.import` | Importar e exportar | Importar e Exportar |

## `states`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `states.sendNewLink` | Enviar um link novo | Enviar um Link Novo |
| `states.backToLogin` | Voltar para o login | Voltar para o Login |
| `states.emptyTitle` | Nada por aqui ainda | Nada por Aqui Ainda |
| `states.retry` | Tentar de novo | Tentar de Novo |
| `states.forbiddenTitle` | Você não tem acesso | Você Não Tem Acesso |

## `students`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `students.showResults` | Ver {{count}} alunos | Ver {{count}} Alunos |
| `students.activeCount_zero` | 0 ativos | 0 Ativos |
| `students.search` | Nome, CPF, e-mail ou telefone | Nome, CPF, E-mail ou Telefone |
| `students.columns.ageRange` | Faixa etária | Faixa Etária |
| `students.columns.modalities` | Modalidades e turmas | Modalidades e Turmas |
| `students.filters.allUnits` | Todas as unidades | Todas as Unidades |
| `students.filters.ageRange` | Faixa etária | Faixa Etária |
| `students.filters.allAgeRanges` | Todas as faixas | Todas as Faixas |
| `students.filters.allSeals` | Todos os selos | Todos os Selos |
| `students.filters.allModalities` | Todas as modalidades | Todas as Modalidades |
| `students.filters.allClasses` | Todas as turmas | Todas as Turmas |
| `students.filters.allLevels` | Todos os níveis | Todos os Níveis |
| `students.seals.INCOMPLETE_REGISTRATION` | Cadastro incompleto | Cadastro Incompleto |
| `students.seals.EMAIL_PROBLEM` | E-mail com problema | E-mail com Problema |
| `students.seals.BIRTHDAY_TODAY` | Aniversário hoje | Aniversário Hoje |
| `students.seals.TERM_PENDING` | Termo pendente | Termo Pendente |
| `students.edit.button` | Editar dados | Editar Dados |
| `students.edit.title` | Editar dados pessoais | Editar Dados Pessoais |
| `students.edit.name` | Nome completo | Nome Completo |
| `students.edit.birthDate` | Data de nascimento | Data de Nascimento |
| `students.edit.gender` | Sexo ou gênero | Sexo ou Gênero |
| `students.edit.referral` | Como conheceu | Como Conheceu |
| `students.edit.none` | Não informado | Não Informado |
| `students.edit.genders.PREFER_NOT_TO_SAY` | Prefere não informar | Prefere Não Informar |
| `students.edit.referrals.WALK_BY` | Passou em frente | Passou em Frente |
| `students.edit.emergency` | Contato de emergência | Contato de Emergência |
| `students.edit.emergencyName` | Nome do contato | Nome do Contato |
| `students.edit.emergencyPhone` | Telefone do contato | Telefone do Contato |
| `students.edit.openRecord` | Abrir ficha | Abrir Ficha |
| `students.edit.confirmDuplicate` | É outra pessoa, salvar mesmo assim | É Outra Pessoa, Salvar Mesmo Assim |
| `students.edit.photoFile` | Arquivo da foto | Arquivo da Foto |
| `students.edit.photoChoose` | Escolher foto | Escolher Foto |
| `students.edit.photoReplace` | Trocar foto | Trocar Foto |
| `students.edit.photoRemove` | Remover foto | Remover Foto |
| `students.edit.photoRetry` | Tentar enviar a foto de novo | Tentar Enviar a Foto de Novo |
| `students.edit.closeWithoutPhoto` | Fechar sem a foto | Fechar sem a Foto |
| `students.edit.cropTitle` | Cortar a foto | Cortar a Foto |
| `students.edit.cropPreview` | Prévia do corte da foto | Prévia do Corte da Foto |
| `students.record.title` | Ficha do aluno | Ficha do Aluno |
| `students.record.open` | Abrir a ficha de {{name}} | Abrir a Ficha de {{name}} |
| `students.record.close` | Fechar a ficha | Fechar a Ficha |
| `students.record.tabsLabel` | Seções da ficha | Seções da Ficha |
| `students.record.back` | Voltar para a lista | Voltar para a Lista |
| `students.record.moreActions` | Mais ações | Mais Ações |
| `students.record.financial.emptyTitle` | Sem cobranças | Sem Cobranças |
| `students.record.financial.open` | Em aberto | Em Aberto |
| `students.record.financial.late` | Em atraso | Em Atraso |
| `students.record.financial.newCharge` | Nova cobrança avulsa | Nova Cobrança Avulsa |
| `students.record.financial.actions.pay` | Registrar pagamento | Registrar Pagamento |
| `students.record.financial.groups.open` | Em aberto | Em Aberto |
| `students.record.financial.overdue` | Em atraso | Em Atraso |
| `students.record.financial.current` | Em dia | Em Dia |
| `students.record.graduations.register` | Registrar graduação | Registrar Graduação |
| `students.record.enrollment.add` | Adicionar modalidade | Adicionar Modalidade |
| `students.record.enrollment.primaryClass` | Turma principal | Turma Principal |
| `students.record.enrollment.situation.title` | Situação do aluno | Situação do Aluno |
| `students.record.enrollment.situation.cancelCharges` | Cancelar cobranças acumuladas | Cancelar Cobranças Acumuladas |
| `students.record.enrollment.emptyTitle` | Sem matrícula | Sem Matrícula |
| `students.record.enrollment.otherClasses` | Outros horários | Outros Horários |
| `students.record.enrollment.nextPlan` | A partir da próxima cobrança: {{plan}} | A Partir da Próxima Cobrança: {{plan}} |
| `students.record.enrollment.actions.class` | Trocar turma | Trocar Turma |
| `students.record.enrollment.actions.plan` | Trocar plano | Trocar Plano |
| `students.record.enrollment.actions.benefit` | Conceder benefício | Conceder Benefício |
| `students.record.enrollment.closureRequested` | Encerramento solicitado | Encerramento Solicitado |
| `students.record.enrollment.class.title` | Trocar turma | Trocar Turma |
| `students.record.enrollment.class.current` | Turma principal atual | Turma Principal Atual |
| `students.record.enrollment.class.primary` | Nova turma principal | Nova Turma Principal |
| `students.record.enrollment.class.submit` | Trocar turma | Trocar Turma |
| `students.record.enrollment.class.confirm` | Confirmar troca | Confirmar Troca |
| `students.record.enrollment.plan.title` | Trocar plano | Trocar Plano |
| `students.record.enrollment.plan.next` | Plano novo | Plano Novo |
| `students.record.enrollment.plan.summary.current` | Plano atual: {{plan}} | Plano Atual: {{plan}} |
| `students.record.enrollment.plan.summary.next` | Novo plano: {{plan}} | Novo Plano: {{plan}} |
| `students.record.enrollment.plan.submit` | Trocar plano | Trocar Plano |
| `students.record.enrollment.end.charges` | Cobranças em aberto desta modalidade | Cobranças em Aberto Desta Modalidade |
| `students.record.enrollment.end.colAction` | O que fazer | O que Fazer |
| `students.record.enrollment.end.noCharges` | Nenhuma cobrança em aberto | Nenhuma Cobrança em Aberto |
| `students.record.enrollment.end.reasons.CITY_CHANGE` | Mudança de cidade | Mudança de Cidade |
| `students.record.enrollment.end.reasons.FINANCIAL` | Motivo financeiro | Motivo Financeiro |
| `students.record.enrollment.end.submit` | Encerrar modalidade | Encerrar Modalidade |
| `students.record.enrollment.transfer.title` | Transferir modalidade | Transferir Modalidade |
| `students.record.enrollment.transfer.class` | Turma principal na {{unit}} | Turma Principal na {{unit}} |
| `students.record.enrollment.transfer.dueDay` | Dia de vencimento | Dia de Vencimento |
| `students.record.enrollment.transfer.dueDayNumber` | Dia de vencimento (1 a 28) | Dia de Vencimento (1 a 28) |
| `students.record.enrollment.transfer.allowedDays` | Dias permitidos na {{unit}} | Dias Permitidos na {{unit}} |
| `students.record.summary.unit` | Unidade de cadastro | Unidade de Cadastro |
| `students.record.summary.emergencyContact` | Contato de emergência | Contato de Emergência |
| `students.record.summary.nextDue` | Próximo vencimento | Próximo Vencimento |
| `students.record.summary.term` | Termo de matrícula | Termo de Matrícula |
| `students.record.summary.termView` | Ver termo | Ver Termo |
| `students.record.summary.editData` | Editar dados pessoais | Editar Dados Pessoais |
| `students.record.summary.download` | Baixar dados do aluno | Baixar Dados do Aluno |
| `students.record.summary.anonymize` | Anonimizar aluno | Anonimizar Aluno |
| `students.record.summary.ageRange` | Faixa etária | Faixa Etária |
| `students.record.summary.none` | Não informado | Não Informado |
| `students.record.guardians.financial` | Responsável financeiro | Responsável Financeiro |
| `students.record.guardians.accessPending` | Acesso pendente | Acesso Pendente |
| `students.record.guardians.accessActive` | Com acesso | Com Acesso |
| `students.record.guardians.limit` | Limite de 2 responsáveis atingido | Limite de 2 Responsáveis Atingido |
| `students.record.guardians.resend` | Reenviar convite | Reenviar Convite |
| `students.record.guardians.makeFinancial` | Tornar financeiro | Tornar Financeiro |
| `students.record.guardians.link` | Vincular responsável | Vincular Responsável |
| `students.record.guardians.unlinkTitle` | Desligar responsável | Desligar Responsável |
| `students.record.guardians.linkTitle` | Vincular responsável | Vincular Responsável |
| `students.record.guardians.makeItFinancial` | É o responsável financeiro | É o Responsável Financeiro |
| `students.simple.title` | Alunos da aula | Alunos da Aula |
| `students.simple.emptyTitle` | Nenhum aluno ativo | Nenhum Aluno Ativo |
| `students.statuses.NONE` | Sem matrícula | Sem Matrícula |
| `students.quick.label` | Situação do aluno | Situação do Aluno |
| `students.quick.OVERDUE` | Em atraso | Em Atraso |
| `students.financial.OVERDUE` | Em atraso | Em Atraso |
| `students.financial.CURRENT` | Em dia | Em Dia |

## `teachers`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `teachers.invited` | Convite enviado | Convite Enviado |
| `teachers.belt_one` | Faixa {{level}} · {{count}} grau | Faixa {{level}} · {{count}} Grau |
| `teachers.belt_other` | Faixa {{level}} · {{count}} graus | Faixa {{level}} · {{count}} Graus |
| `teachers.form.newButton` | Novo professor | Novo Professor |
| `teachers.form.newTitle` | Novo professor | Novo Professor |
| `teachers.form.editTitle` | Editar professor | Editar Professor |
| `teachers.form.name` | Nome completo | Nome Completo |
| `teachers.form.bio` | Apresentação (aparece no diretório) | Apresentação (Aparece no Diretório) |
| `teachers.form.modalities` | Modalidades que ensina | Modalidades que Ensina |
| `teachers.form.levelChoose` | Escolha o nível | Escolha o Nível |
| `teachers.form.access` | Dar acesso à gestão como Professor | Dar Acesso à Gestão Como Professor |
| `teachers.form.saveInvite` | Salvar e enviar convite | Salvar e Enviar Convite |
| `teachers.form.inviteRetry` | Tentar de novo | Tentar de Novo |
| `teachers.form.leaves` | O {{modality}} não pode sair do {{name}} | O {{modality}} Não Pode Sair do {{name}} |
| `teachers.form.declared` | O professor autorizou | O Professor Autorizou |
| `teachers.form.photo` | Foto (opcional) | Foto (Opcional) |
| `teachers.form.photoFile` | Arquivo da foto | Arquivo da Foto |
| `teachers.form.photoChoose` | Enviar foto | Enviar Foto |
| `teachers.form.photoReplace` | Trocar foto | Trocar Foto |
| `teachers.form.photoRemove` | Remover foto | Remover Foto |
| `teachers.form.photoRetry` | Tentar enviar a foto de novo | Tentar Enviar a Foto de Novo |
| `teachers.form.closeWithoutPhoto` | Fechar sem a foto | Fechar sem a Foto |
| `teachers.form.cropTitle` | Cortar a foto | Cortar a Foto |
| `teachers.form.cropPreview` | Prévia do corte da foto | Prévia do Corte da Foto |
| `teachers.filters.allModalities` | Todas as modalidades | Todas as Modalidades |
| `teachers.filters.allUnits` | Todas as unidades | Todas as Unidades |
| `teachers.panel.back` | Voltar aos professores | Voltar aos Professores |
| `teachers.panel.deactivateDialog.columnNewHead` | Novo titular | Novo Titular |
| `teachers.panel.deactivateDialog.chooseLater` | Escolher depois | Escolher Depois |
| `teachers.panel.deactivateDialog.confirm` | Inativar professor | Inativar Professor |
| `teachers.panel.resend` | Reenviar convite | Reenviar Convite |
| `teachers.panel.none` | Não informado | Não Informado |
| `teachers.panel.graduations` | Graduação por modalidade | Graduação por Modalidade |
| `teachers.panel.upcoming` | Próximas aulas | Próximas Aulas |
| `teachers.panel.accessStates.NONE` | Sem acesso | Sem Acesso |
| `teachers.panel.accessStates.PENDING` | Convite enviado | Convite Enviado |
| `teachers.panel.accessStates.ACTIVE` | Acesso ativo | Acesso Ativo |
| `teachers.panel.accessStates.ENDED` | Acesso encerrado | Acesso Encerrado |
| `teachers.panel.notFoundTitle` | Professor não encontrado | Professor Não Encontrado |
| `teachers.panel.grant.button` | Dar acesso | Dar Acesso |
| `teachers.panel.grant.title` | Dar acesso a {{name}} | Dar Acesso a {{name}} |
| `teachers.panel.grant.send` | Enviar convite | Enviar Convite |
| `teachers.panel.inDirectory` | No diretório | No Diretório |
| `teachers.panel.listed` | Aparece no diretório | Aparece no Diretório |
| `teachers.panel.notListed` | Não aparece no diretório | Não Aparece no Diretório |

## `terms`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `terms.tabs` | Tipo de termo | Tipo de Termo |
| `terms.kinds.ENROLLMENT` | Termo de matrícula | Termo de Matrícula |
| `terms.kinds.IMAGE_USE` | Uso de imagem | Uso de Imagem |
| `terms.current.title` | Texto atual | Texto Atual |
| `terms.current.published` | Versão {{version}} publicada em {{date}} por {{by}} | Versão {{version}} Publicada em {{date}} por {{by}} |
| `terms.editor.label` | Texto do termo | Texto do Termo |
| `terms.editor.toolbar` | Formatação do texto | Formatação do Texto |
| `terms.draft` | Salvar rascunho | Salvar Rascunho |
| `terms.publish` | Publicar versão {{version}} | Publicar Versão {{version}} |
| `terms.reaccept.newOnly` | Só para novos alunos | Só para Novos Alunos |
| `terms.reaccept.everyone` | Todos aceitam de novo | Todos Aceitam de Novo |

## `texts`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `texts.models.REMINDER_BEFORE` | Lembrete: antes do vencimento | Lembrete: Antes do Vencimento |
| `texts.models.REMINDER_DUE` | Lembrete: no dia | Lembrete: no Dia |
| `texts.models.REMINDER_OVERDUE` | Lembrete: depois do vencimento | Lembrete: Depois do Vencimento |
| `texts.models.ANNOUNCEMENT_CANCELED_CLASS` | Comunicado: Aula cancelada | Comunicado: Aula Cancelada |
| `texts.models.ANNOUNCEMENT_TEACHER_CHANGE` | Comunicado: Troca de professor | Comunicado: Troca de Professor |
| `texts.models.ANNOUNCEMENT_SCHEDULE_CHANGE` | Comunicado: Alteração de horário | Comunicado: Alteração de Horário |
| `texts.models.ANNOUNCEMENT_NO_CLASS_DAY` | Comunicado: Dia sem aula | Comunicado: Dia sem Aula |
| `texts.models.ANNOUNCEMENT_GENERAL` | Comunicado: Aviso geral | Comunicado: Aviso Geral |
| `texts.origin.platform` | Texto da plataforma | Texto da Plataforma |
| `texts.emptyTitle` | Nenhum modelo de texto | Nenhum Modelo de Texto |
| `texts.editor.insert` | Inserir o campo {{field}} | Inserir o Campo {{field}} |
| `texts.save` | Salvar texto | Salvar Texto |
| `texts.reset` | Voltar ao texto da plataforma | Voltar ao Texto da Plataforma |
| `texts.resetConfirm.title` | Voltar ao texto da plataforma | Voltar ao Texto da Plataforma |
| `texts.resetConfirm.confirm` | Voltar ao padrão | Voltar ao Padrão |
| `texts.list` | Modelos de texto | Modelos de Texto |

## `theme`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `theme.toDark` | Usar tema escuro | Usar Tema Escuro |
| `theme.toLight` | Usar tema claro | Usar Tema Claro |

## `twoFactor`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `twoFactor.login.title` | Duas etapas | Duas Etapas |
| `twoFactor.login.backupTitle` | Código de reserva | Código de Reserva |
| `twoFactor.login.backupLabel` | Código de reserva | Código de Reserva |
| `twoFactor.login.useBackup` | Usar um código de reserva | Usar um Código de Reserva |
| `twoFactor.login.useApp` | Voltar para o código do app | Voltar para o Código do App |
| `twoFactor.setup.title` | Ativar duas etapas | Ativar Duas Etapas |
| `twoFactor.setup.stepRead` | Ler o QR code | Ler o QR Code |
| `twoFactor.setup.stepConfirm` | Confirmar código | Confirmar Código |
| `twoFactor.setup.stepSave` | Guardar códigos | Guardar Códigos |
| `twoFactor.setup.qrAlt` | QR code para ativar as duas etapas | QR Code para Ativar as Duas Etapas |
| `twoFactor.setup.keyLabel` | Chave para digitar | Chave para Digitar |
| `twoFactor.setup.later` | Agora não | Agora Não |
| `twoFactor.codes.title` | Códigos de reserva | Códigos de Reserva |
| `twoFactor.codes.list` | Seus códigos de reserva | Seus Códigos de Reserva |
| `twoFactor.codes.saved` | Guardei os códigos em lugar seguro | Guardei os Códigos em Lugar Seguro |
| `twoFactor.required.title` | Ative as duas etapas para continuar | Ative as Duas Etapas para Continuar |
| `twoFactor.required.activate` | Ativar duas etapas | Ativar Duas Etapas |

## `ui`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `ui.selectRow` | Selecionar linha | Selecionar Linha |
| `ui.selectAll` | Selecionar todas as linhas | Selecionar Todas as Linhas |

## `unitModalities`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `unitModalities.title` | Modalidades oferecidas na {{unit}} | Modalidades Oferecidas na {{unit}} |
| `unitModalities.graduationOn` | Graduação ligada | Graduação Ligada |
| `unitModalities.graduationOff` | Graduação desligada | Graduação Desligada |
| `unitModalities.emptyTitle` | Nenhuma modalidade ativa | Nenhuma Modalidade Ativa |
| `unitModalities.inUseClass` | Turma ativa: {{name}} ({{students}}) | Turma Ativa: {{name}} ({{students}}) |

## `unitScope`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `unitScope.label` | Unidade ativa | Unidade Ativa |
| `unitScope.all` | Todas as unidades | Todas as Unidades |
| `unitScope.readOnly` | Só consulta | Só Consulta |
| `unitScope.readOnlyCoordinator` | Só consulta · Coordenador | Só Consulta · Coordenador |

## `unitSettings`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `unitSettings.generalTitle` | Configurações da unidade | Configurações da Unidade |
| `unitSettings.tabsLabel` | Seções da unidade | Seções da Unidade |
| `unitSettings.emptyTitle` | Nenhuma unidade para configurar | Nenhuma Unidade para Configurar |
| `unitSettings.sections.data` | Dados da unidade | Dados da Unidade |
| `unitSettings.sections.reminders` | Lembretes de cobrança | Lembretes de Cobrança |
| `unitSettings.sections.directory` | Diretório de academias | Diretório de Academias |
| `unitSettings.shortName` | Nome curto | Nome Curto |
| `unitSettings.cnpj` | CNPJ (opcional) | CNPJ (Opcional) |
| `unitSettings.coordinatesToggle` | Ajustar latitude e longitude | Ajustar Latitude e Longitude |
| `unitSettings.whatsapp` | WhatsApp da unidade | WhatsApp da Unidade |
| `unitSettings.timezone` | Fuso horário | Fuso Horário |
| `unitSettings.dueDays` | Dias de vencimento permitidos | Dias de Vencimento Permitidos |
| `unitSettings.enrollmentFee` | Cobrar taxa de matrícula | Cobrar Taxa de Matrícula |
| `unitSettings.enrollmentFeeValue` | Valor da taxa | Valor da Taxa |
| `unitSettings.directory` | Aparecer no diretório ctcore.com.br/academias | Aparecer no Diretório Ctcore.com.br/Academias |
| `unitSettings.whileDisconnected` | Enquanto estiver desconectado | Enquanto Estiver Desconectado |
| `unitSettings.feesTitle` | Taxas por meio de pagamento | Taxas por Meio de Pagamento |
| `unitSettings.feePassed` | Taxa repassada ao aluno | Taxa Repassada ao Aluno |
| `unitSettings.feeExample` | Exemplo: mensalidade de {{value}} | Exemplo: Mensalidade de {{value}} |
| `unitSettings.fees.creditCard` | Cartão de crédito | Cartão de Crédito |
| `unitSettings.fees.debitCard` | Cartão de débito | Cartão de Débito |
| `unitSettings.fees.automaticDebit` | Débito automático | Débito Automático |
| `unitSettings.fees.manualPix` | Pix na chave | Pix na Chave |
| `unitSettings.otherMethods` | Outros meios | Outros Meios |
| `unitSettings.pixTitle` | Chave Pix da unidade | Chave Pix da Unidade |
| `unitSettings.pixTypes.RANDOM` | Chave aleatória | Chave Aleatória |
| `unitSettings.reminders` | Dias de lembrete | Dias de Lembrete |
| `unitSettings.remindersEnabled` | Enviar lembretes automáticos | Enviar Lembretes Automáticos |
| `unitSettings.remindersEnabledField` | Lembretes automáticos | Lembretes Automáticos |
| `unitSettings.remindersHour` | Horário de envio | Horário de Envio |
| `unitSettings.reminderOnDue` | No dia do vencimento | No Dia do Vencimento |
| `unitSettings.reminderHelp.0` | Com o link de pagamento | Com o Link de Pagamento |
| `unitSettings.reminderHelp.3` | Tom cordial, sem ameaça | Tom Cordial, sem Ameaça |
| `unitSettings.reminderHelp.10` | Informa a data de bloqueio | Informa a Data de Bloqueio |
| `unitSettings.reminderHelp.-3` | Com o link de pagamento | Com o Link de Pagamento |
| `unitSettings.reminderHelp.custom` | Dia salvo antes, fora do padrão | Dia Salvo Antes, Fora do Padrão |
| `unitSettings.blockNoticeTitle` | 5 dias antes do bloqueio | 5 Dias Antes do Bloqueio |
| `unitSettings.alwaysOn` | Sempre ligado | Sempre Ligado |
| `unitSettings.minors` | Menores de idade | Menores de Idade |
| `unitSettings.minorsValue` | Vão para o responsável financeiro | Vão para o Responsável Financeiro |
| `unitSettings.editTexts` | Editar textos | Editar Textos |
| `unitSettings.teacher.announcements` | Enviar comunicado | Enviar Comunicado |
| `unitSettings.teacher.agendaEdit` | Editar e cancelar aulas | Editar e Cancelar Aulas |
| `unitSettings.teacher.studentContacts` | Ver contatos | Ver Contatos |
| `unitSettings.teacher.trialClasses` | Ver aulas experimentais | Ver Aulas Experimentais |
| `unitSettings.teacher.studentRecord` | Ver ficha do aluno | Ver Ficha do Aluno |
| `unitSettings.teacherHelp.announcements` | Só para as turmas dele | Só para as Turmas Dele |
| `unitSettings.teacherHelp.trialClasses` | Das aulas dele, com "Não compareceu" | Das Aulas Dele, com "Não Compareceu" |
| `unitSettings.trialLink` | Link público de aula experimental | Link Público de Aula Experimental |
| `unitSettings.selfRegistrationLink` | Link público de autocadastro | Link Público de Autocadastro |
| `unitSettings.links.trial.title` | Pedido de aula experimental | Pedido de Aula Experimental |
| `unitSettings.links.selfRegistration.title` | Autocadastro de matrícula | Autocadastro de Matrícula |
| `unitSettings.links.qr` | QR code PNG | QR Code PNG |
| `unitSettings.links.pdf` | PDF para imprimir | PDF para Imprimir |
| `unitSettings.save` | Salvar alterações | Salvar Alterações |

## `units`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `units.noCity` | Não informada | Não Informada |
| `units.activeStudents` | Alunos ativos | Alunos Ativos |
| `units.shortName` | Nome curto | Nome Curto |
| `units.adjust` | Ajustar nome curto | Ajustar Nome Curto |
| `units.history` | Ver histórico | Ver Histórico |
| `units.tableLabel` | Unidades da organização | Unidades da Organização |
| `units.emptyTitle` | Nenhuma unidade | Nenhuma Unidade |
| `units.newButton` | Nova unidade | Nova Unidade |
| `units.deactivate.blockedHead` | O que impede agora | O que Impede Agora |
| `units.deactivate.studentsFree` | Nenhum aluno com modalidade ativa | Nenhum Aluno com Modalidade Ativa |
| `units.deactivate.classesFree` | Nenhuma turma ativa | Nenhuma Turma Ativa |
| `units.deactivate.proofsFree` | Nenhuma cobrança em conferência | Nenhuma Cobrança em Conferência |
| `units.deactivate.seeStudents` | Ver alunos | Ver Alunos |
| `units.deactivate.seeClasses` | Ver turmas | Ver Turmas |
| `units.deactivate.typeLabel` | Digite DESATIVAR para confirmar | Digite DESATIVAR para Confirmar |
| `units.deactivate.confirm` | Desativar unidade | Desativar Unidade |
| `units.deactivate.only.subscription` | Ir para a assinatura | Ir para a Assinatura |
| `units.new.title` | Nova unidade | Nova Unidade |
| `units.new.steps.unit` | Nome e endereço | Nome e Endereço |
| `units.new.name` | Nome da unidade | Nome da Unidade |
| `units.new.shortName` | Nome curto | Nome Curto |
| `units.new.mapTitle` | Localização no mapa | Localização no Mapa |
| `units.new.mapSoon` | Mapa com pino | Mapa com Pino |
| `units.new.email` | E-mail da unidade | E-mail da Unidade |
| `units.new.inviteTitle` | Convidar um Administrador (opcional) | Convidar um Administrador (Opcional) |
| `units.new.finish` | Criar unidade | Criar Unidade |
| `units.new.toList` | Ir para a lista de unidades | Ir para a Lista de Unidades |
| `units.new.toUnit` | Abrir a unidade | Abrir a Unidade |
| `units.dialog.title` | Ajustar o nome curto de {{name}} | Ajustar o Nome Curto de {{name}} |
| `units.dialog.current` | Nome curto atual: {{value}} | Nome Curto Atual: {{value}} |
| `units.dialog.label` | Novo nome curto | Novo Nome Curto |

## `users`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `users.permissionsTable` | Tabela de permissões | Tabela de Permissões |
| `users.profiles.COORDINATOR.scope` | 1 por organização | 1 por Organização |
| `users.search` | Nome ou e-mail | Nome ou E-mail |
| `users.filter.allStatuses` | Ativos e convites | Ativos e Convites |
| `users.noMatchTitle` | Nenhum usuário encontrado | Nenhum Usuário Encontrado |
| `users.clearFilters` | Limpar filtros | Limpar Filtros |
| `users.filters.PENDING` | Convite enviado | Convite Enviado |
| `users.lastAccess` | Último acesso | Último Acesso |
| `users.never` | Nunca entrou | Nunca Entrou |
| `users.statuses.PENDING` | Convite enviado | Convite Enviado |
| `users.emptyTitle` | Nenhum usuário | Nenhum Usuário |
| `users.resend` | Reenviar convite | Reenviar Convite |
| `users.invite.title` | Convidar para a equipe | Convidar para a Equipe |
| `users.invite.roleAdministrator` | Tudo nas unidades marcadas | Tudo nas Unidades Marcadas |
| `users.invite.send` | Enviar convite | Enviar Convite |
| `users.editUnits.button` | Alterar unidades | Alterar Unidades |
| `users.lastAdmin.appoint` | Nomear a mim mesmo | Nomear a Mim Mesmo |

## `whatsapp`

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `whatsapp.open` | Abrir conversa no WhatsApp | Abrir Conversa no WhatsApp |
