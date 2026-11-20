# Textos da interface · guia e revisão

Decisão do dono de 20/11/2026 (RNF-55). Vale para todo texto que aparece para a pessoa: gestão, portal, telas públicas, e-mails, PDFs e mensagens de erro da API mostradas na tela. Complementa a RNF-24 (tom) e a RNF-45 (cabeçalhos sem regra interna).

## Regras

**M1 · Maiúsculas.** Tudo o que não é frase leva inicial maiúscula em cada palavra: títulos (tela, janela, seção, cartão), itens de menu, abas, colunas, botões, links de ação, rótulos de campo, opções de lista, de rádio e de caixa de marcar, situações e selos. Ficam minúsculas, salvo quando abrem o texto: a, o, as, os, e, ou, de, da, do, das, dos, em, no, na, nos, nas, por, pelo, pela, para, com, sem, ao, à, aos, às, um, uma, que, se. Siglas e marcas ficam como são (CPF, PDF, QR, Pix, WhatsApp, Mercado Pago, ctcore). Depois de "·", "›", "/" e "—", a palavra seguinte volta a ser a primeira. Exemplos: "Feriados e Recessos", "Ver Atrasados", "Criado Por", "Nome Completo", "Não Avisar".

**M2 · Frases ficam normais.** Descrições, ajudas, avisos, mensagens de erro e de sucesso, textos de estado vazio, confirmações e mensagens enviadas a pessoas (e-mail, WhatsApp) começam com maiúscula e seguem em minúsculas, terminando com ponto.

**C1 · Botão curto quando o contexto já diz o que é.** Dentro de uma janela ou tela cujo título nomeia a coisa, o botão leva só o verbo: na janela "Novo Comunicado", "Enviar" e "Agendar"; na janela "Desativar Turma", "Desativar". O botão de criar no topo de uma lista leva "Novo"/"Nova" com o ícone "+" (na tela Planos, "+ Novo"). O nome da coisa fica quando há mais de um tipo de coisa na tela (na ficha do aluno, "Nova Matrícula") ou quando a contagem informa algo ("Salvar 4 Aulas").

**C2 · Leitor de tela continua completo.** Quando o texto visível fica curto, o `aria-label` mantém o contexto ("Enviar comunicado", "Cancelar a cobrança de Jorge Almeida, março"). As chaves terminadas em `For` são desse tipo e ficam em frase.

**C3 · "Cancelar" tem um sentido só por janela.** Em janela cuja ação é cancelar algo (cobrança, aula, comunicado, mensalidade), o botão que fecha sem fazer nada é "Voltar"; "Cancelar" é a ação. Nas demais janelas, o botão de fechar é "Cancelar".

**F1 · Frase curta.** Uma ideia por frase, no máximo duas frases por ajuda ou aviso, de preferência até 15 palavras. Corta-se o que a tela já mostra, o que repete o título e a explicação de regra interna. Fica o que a pessoa precisa para decidir ou para resolver o problema.

**F2 · Erros.** Dizem o que aconteceu e o que fazer, e terminam com "Nada foi salvo." quando nada mudou (uma forma só: sai "Nada foi gravado", "Nada foi alterado", "Nada foi publicado"). Erros de segurança não revelam se uma conta existe ("Se houver conta com este e-mail…").

**V1 · Vocabulário único.**

| Uso | Termo | Não usar |
| --- | --- | --- |
| Pessoa deixa de estar ativa (aluno, professor) | Inativar | Desativar |
| Coisa deixa de valer (turma, plano, unidade, modalidade, Administrador) | Desativar | Inativar |
| Modalidade da matrícula ou benefício termina | Encerrar | Cancelar |
| Cobrança, aula ou comunicado deixa de existir | Cancelar | Excluir |
| Gravar uma tela ou janela | Salvar | Salvar Alterações, Gravar |
| Repetir após erro | Tentar de Novo | Tentar Novamente |
| Endereço eletrônico | e-mail (E-mail no começo) | email |
| Reticências | … (um caractere) | ... |
| Aspas | “ ” | " " |
| Período sem aula lançado pela unidade | Recesso | Dia sem aula |

## Lista A · Maiúsculas

Em `docs/design/textos-maiusculas.md`: 1.198 propostas geradas pela regra M1, por área, para conferência.

## Lista B · Botões encurtados (C1 e C3)

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `teachers.form.newButton` | Novo professor | + Novo |
| `teachers.panel.deactivateDialog.confirm` | Inativar professor | Inativar |
| `agenda.new.open` | Nova aula avulsa | + Aula Avulsa |
| `agenda.new.save` | Criar aula | Criar |
| `agenda.edit.save` | Salvar aula | Salvar |
| `agenda.edit.saveFollowing` | Salvar {{count}} aulas | Salvar {{count}} Aulas |
| `agenda.cancel.confirm` | Cancelar aula | Cancelar (fechar: Voltar) |
| `agenda.panel.edit` / `agenda.panel.cancel` | Editar aula / Cancelar aula | Editar / Cancelar |
| `noClassDays.new` | Novo dia sem aula | + Novo Recesso |
| `noClassDays.dialog.save` | Lançar dia sem aula | Lançar |
| `noClassDays.dialog.saveEdit` | Salvar alterações | Salvar |
| `plans.newButton` | Novo plano | + Novo |
| `plans.form.save` / `plans.form.create` | Salvar plano / Criar plano | Salvar / Criar |
| `plans.form.deactivate` / `plans.deactivateDialog.confirm` | Desativar plano | Desativar |
| `plans.inspect.reactivate` | Reativar plano | Reativar |
| `benefits.grant.button` / `benefits.grant.submit` | Conceder benefício | + Conceder / Conceder |
| `benefits.end.submit` | Encerrar benefício | Encerrar |
| `classes.newButton` | Nova turma | + Nova |
| `classes.form.save` | Salvar turma | Salvar |
| `classes.panel.editNarrow` / `classes.panel.deactivateNarrow` | Editar turma / Desativar turma | Editar / Desativar |
| `classes.panel.deactivateDialog.confirm` | Desativar turma | Desativar |
| `texts.save` | Salvar texto | Salvar |
| `ageRanges.create` | Nova faixa etária | + Nova |
| `units.newButton` | Nova unidade | + Nova |
| `units.new.finish` | Criar unidade | Criar |
| `units.new.toUnit` | Abrir a unidade | Abrir |
| `units.deactivate.confirm` | Desativar unidade | Desativar |
| `charges.creation.open` | Nova cobrança | + Nova |
| `charges.creation.submit` | Criar cobrança | Criar |
| `charges.menu.open` / `charges.menu.cancel` | Abrir cobrança / Cancelar cobrança | Abrir / Cancelar |
| `charges.panel.cancel` / `charges.cancel.submit` | Cancelar cobrança | Cancelar (fechar: Voltar) |
| `charges.preview.cancel.submit` | Cancelar mensalidade | Cancelar (fechar: Voltar) |
| `announcements.newAction` | Novo comunicado | + Novo |
| `announcements.new.send` | Enviar comunicado | Enviar |
| `announcements.new.scheduleSend` | Agendar comunicado | Agendar |
| `announcements.cancel.submit` | Cancelar comunicado | Cancelar (fechar: Voltar) |
| `payments.dialog.confirm` | Registrar pagamento | Registrar |
| `portalRequests.refuse.submit` | Recusar pedido | Recusar |
| `pixProof.submit` | Enviar comprovante | Enviar |
| `students.record.summary.download` | Baixar dados do aluno | Baixar Dados |
| `organization.save`, `unitSettings.save`, `account.notifications.save` | Salvar alterações | Salvar |

Os títulos das janelas continuam com o nome da coisa ("Novo Comunicado", "Desativar Turma"), e os `aria-label` (chaves `*For`) continuam completos.

## Lista C · Frases mais curtas (F1 e F2)

Textos que outros itens já tiram ou reescrevem (subtítulos da #646, cobrança e matrícula das #651 e #659, transferência da #609, modalidades da #633) ficam de fora. Mensagens enviadas a pessoas (WhatsApp, recusas sugeridas, aniversário) mantêm o tom cordial.

| Chave | Hoje | Proposta |
| --- | --- | --- |
| `auth.errors.locked` | Muitas tentativas. Por segurança, este e-mail fica travado por 15 minutos. Tente de novo às {{time}} ou crie uma nova senha. | Muitas tentativas. Tente de novo às {{time}} ou crie uma nova senha. |
| `areaUnavailable.financeText` | Valores e cobranças ficam com a gestão da unidade. Se você precisa de alguma informação daqui, fale com a Administração da sua unidade. | Valores e cobranças ficam com a gestão. Fale com a sua unidade. |
| `chooseLink.intro` | Olá, {{name}}. Sua conta tem acesso a mais de um lugar. Você pode trocar depois pelo menu da sua foto. | Olá, {{name}}. Escolha onde entrar; dá para trocar depois pelo menu da sua foto. |
| `twoFactor.login.note` | O código vale 5 minutos depois da senha. Errando 5 vezes, você volta para o login. | O código vale 5 minutos. Depois de 5 erros, você volta ao login. |
| `twoFactor.codes.description` | Cada código vale uma vez. Use quando estiver sem o celular. Os códigos anteriores deixam de valer. | Cada código vale uma vez, para quando estiver sem o celular. Os anteriores deixam de valer. |
| `twoFactor.codes.support` | Sem o celular e sem códigos, só o suporte desliga as duas etapas, depois de confirmar sua identidade. | Sem celular e sem códigos, fale com o suporte. |
| `invite.invalid.help` | Peça um novo convite para quem te convidou. Se você já criou a sua senha, é só entrar. | Peça um novo convite. Se já criou sua senha, é só entrar. |
| `forgot.sent` | Se este e-mail tiver conta, você vai receber o link em alguns minutos. Confira também a caixa de spam. | Se houver conta com este e-mail, o link chega em alguns minutos. Confira o spam. |
| `editConflict.intro` | Alguém salvou alterações depois que você abriu esta tela. Nada do que você digitou foi salvo. | Outra pessoa salvou esta tela depois de você abri-la. Nada foi salvo. |
| `editConflict.help` | Recarregar descarta o que você digitou e mostra os dados atuais. Sobrescrever salva o que você digitou por cima das alterações da outra pessoa. | Recarregar mostra os dados atuais. Sobrescrever salva o seu por cima. |
| `organization.transfer.summary.mail` | {{name}} recebe um e-mail para confirmar e precisa ativar a verificação em duas etapas no próximo acesso. | {{name}} recebe um e-mail e ativa as duas etapas no próximo acesso. |
| `users.deactivate.summary` | A pessoa perde o acesso a esta organização. A conta dela e os acessos em outras organizações continuam. Para voltar, convide o mesmo e-mail de novo. | A pessoa perde o acesso a esta organização; a conta continua. Para voltar, convide de novo. |
| `students.record.graduations.text` | Da mais recente para a mais antiga. Registros nunca são apagados; um erro vira um novo registro "Correção". | Da mais recente para a mais antiga. Um erro vira um registro de “Correção”. |
| `students.record.enrollment.situation.text` | Ativo enquanto houver ao menos uma modalidade Ativa. As ações abaixo valem para as modalidades desta unidade. | Ativo enquanto tiver uma modalidade ativa. As ações valem para esta unidade. |
| `students.record.enrollment.class.approved` | Pedido aprovado. Termine a troca abaixo; se desistir, o pedido continua Aprovado e a matrícula não muda. | Pedido aprovado. Conclua a troca abaixo. |
| `students.record.enrollment.plan.summary.from` | Vale a partir da próxima cobrança gerada: {{month}}. A cobrança de {{previous}} já gerada não muda. | Vale a partir de {{month}}. {{previous}} não muda. |
| `students.record.enrollment.end.effect` | Para de gerar cobrança. As cobranças já geradas continuam devidas; escolha o que fazer com cada uma. | Para de gerar cobranças. Decida abaixo o que fazer com as já geradas. |
| `students.record.enrollment.end.afterRequest` | Há um pedido de encerramento do aluno. As cobranças com vencimento depois do pedido são canceladas ao encerrar; as anteriores seguem a sua decisão. | Há um pedido de encerramento: as cobranças que vencem depois dele serão canceladas. |
| `students.record.guardians.minorNotice` | {{name}} tem {{age}} anos. Só os responsáveis entram no portal dele. Até 2 responsáveis, um deles o financeiro. | {{name}} tem {{age}} anos: o portal é dos responsáveis (até 2, um financeiro). |
| `students.record.guardians.unlinkPromoted` | {{other}}, o outro responsável, passa a ser o responsável financeiro: cobranças e lembretes vão para ele. | {{other}} passa a ser o responsável financeiro. |
| `students.record.guardians.errors.MINOR_NEEDS_GUARDIAN` | Aluno menor de 18 anos precisa de ao menos um responsável. Vincule outro antes de desligar este. | Menor de 18 anos precisa de um responsável. Vincule outro antes. Nada foi salvo. |
| `teachers.form.leavesHelp` | Troque o professor dessas turmas antes. Turmas desativadas não impedem, e o histórico de aulas fica como está. | Troque o professor dessas turmas antes. |
| `teachers.form.modalityInUse` | O professor não pode deixar de ensinar uma modalidade enquanto for titular ou auxiliar de turmas ativas dela. Nada foi alterado. Troque o professor nestas turmas antes: | Ele é titular ou auxiliar destas turmas. Troque o professor nelas antes: |
| `agenda.new.errors.404` | A unidade ou a turma não existe ou não está mais disponível para você. Nada foi gravado. | Unidade ou turma indisponível. Nada foi salvo. |
| `agenda.edit.teacherHelp` | Pode ser de outra unidade, se ensina {{modality}}. Ele vê a turma só no dia da aula. | Pode ser de outra unidade, se ensina {{modality}}. |
| `agenda.edit.errors.409` | A aula não pode mais ser editada ou já existe aula da turma neste dia e horário. Nada foi alterado. | Já existe aula da turma neste horário, ou a aula não pode mais ser editada. Nada foi salvo. |
| `agenda.correct.errors.409` | A correção não é mais possível: só vale para aulas concluídas nos últimos 30 dias. Nada foi alterado. | Só dá para corrigir aulas dos últimos 30 dias. Nada foi salvo. |
| `noClassDays.dialog.errors.409` | Já existe um dia sem aula neste período, ou o dia já começou. Nada foi gravado. | Já existe recesso neste período, ou o dia já começou. Nada foi salvo. |
| `noClassDays.undoDialog.summary` | O dia {{period}} ({{reason}}) deixa de existir e as aulas que ele cancelou voltam para Agendada. Aula cancelada à mão continua cancelada. A mensalidade não muda. | As aulas canceladas por este recesso voltam a Agendada. |
| `plans.form.crossUnit.allowed` / `denied` | Esta organização permite (não permite) treinar em outra unidade… Para mudar, use as configurações da organização. | Definido nas regras da organização. |
| `plans.form.impact.students_one` | {{count}} aluno será afetado a partir da próxima cobrança gerada. Ele recebe um e-mail com o valor novo. | {{count}} aluno afetado a partir da próxima cobrança. Ele recebe um e-mail. |
| `plans.form.impact.students_other` | {{count}} alunos serão afetados a partir da próxima cobrança gerada. Eles recebem um e-mail com o valor novo. | {{count}} alunos afetados a partir da próxima cobrança. Eles recebem um e-mail. |
| `benefits.grant.errors.409` | Outra pessoa concedeu um benefício a esta modalidade agora. Feche a janela e confira a lista. | Outra pessoa acabou de mudar este benefício. Feche e confira. Nada foi salvo. |
| `classes.panel.deactivateDialog.explain` | Desativar tira a turma das escolhas de matrícula e da agenda. Ela continua na lista, com o histórico, e não pode ser reativada nem editada. | A turma sai da matrícula e da agenda e fica só no histórico. Não dá para reativar. |
| `classes.form.headGone` | {{name}} está inativo e não pode ser titular. Escolha outro professor que ensine {{modality}} na {{unit}}. | {{name}} está inativo. Escolha outro titular. |
| `terms.errors.invalid` | O texto precisa ter de 20 a 20000 caracteres e ser diferente do atual. Nada foi publicado. | O texto precisa ter de 20 a 20.000 caracteres e ser diferente do atual. Nada foi salvo. |
| `terms.errors.conflict` | Outra pessoa publicou uma versão agora há pouco. A tela foi atualizada; confira e publique de novo. Nada foi alterado. | Outra pessoa publicou uma versão agora. Confira e publique de novo. Nada foi salvo. |
| `terms.imageNote` | O uso de imagem é uma caixa separada e opcional, que o aluno pode revogar no portal. Cada aceite guarda conta, versão, data, hora e IP. | O uso de imagem é opcional e o aluno pode revogar no portal. |
| `texts.welcomeNote` | O envio das boas-vindas começa com o convite do portal; o texto já pode ser preparado. | As boas-vindas saem com o convite do portal. |
| `texts.resetConfirm.summary` | O texto próprio de {{name}} será apagado e os próximos e-mails usarão o texto da plataforma. | Os próximos e-mails voltam ao texto da plataforma. |
| `texts.errors.subject` | Confira o assunto: não pode ficar vazio, passar do limite de caracteres nem ter campo automático que este modelo não aceita. | Confira o assunto: vazio, longo demais ou com campo que este modelo não aceita. |
| `texts.errors.body` | Confira o texto: não pode ficar vazio, passar de 2000 caracteres, ter campo automático que este modelo não aceita, chave sem fecho ou link que não comece com http:// ou https://. | Confira o texto: vazio, acima de 2.000 caracteres, com campo não aceito ou link sem http(s)://. |
| `ageRanges.competitionNote` | Categorias de competição (IBJJF, CBJ e outras) não entram no cadastro: variam por modalidade e regulamento. Fora da faixa, o sistema só avisa. | Categorias de competição não entram no cadastro. |
| `modalities.readOnlyBanner` | Quem ativa e desativa modalidades e edita a graduação é o Coordenador. Você marca as modalidades oferecidas na sua unidade em Configurações › Unidade. | Só o Coordenador ativa modalidades e edita a graduação. Você marca as oferecidas na sua unidade. |
| `modalities.deactivateDialog.guidance` | Desative as turmas e encerre ou transfira as matrículas de {{name}} antes. As marcações das unidades ficam guardadas e voltam se a modalidade for reativada. | Desative as turmas e encerre ou transfira as matrículas de {{name}} antes. |
| `units.shortNameNote` | O nome curto aparece nos links públicos (ctcore.com.br/aula/{{shortName}}). É único na plataforma e pode ser ajustado uma vez; o antigo redireciona. | Usado nos links públicos (ctcore.com.br/aula/{{shortName}}). Pode ser ajustado uma vez. |
| `units.limitReached` | A organização já tem 10 unidades, o máximo do plano. Para abrir outra, fale com o suporte. | Limite de 10 unidades. Para abrir outra, fale com o suporte. |
| `units.deactivate.summary` | Desativar exige que não haja alunos com modalidade ativa nem turmas ativas. O histórico fica para consulta. | Só dá para desativar sem alunos nem turmas ativas. O histórico fica. |
| `units.deactivate.guidance` | Transfira ou encerre as modalidades antes. Depois volte aqui para confirmar digitando DESATIVAR e sua senha. | Transfira ou encerre as modalidades antes. |
| `units.deactivate.only.text` | Toda organização tem ao menos uma unidade ativa. Para encerrar o uso do ctcore, cancele a assinatura em Configurações › Assinatura. | É a única unidade ativa. Para parar de usar o ctcore, cancele a assinatura. |
| `units.new.inviteFailed` | A unidade foi criada, mas o convite não foi enviado. Convide o Administrador depois, em Usuários da gestão. | Unidade criada, mas o convite não saiu. Convide em Pessoas › Administradores. |
| `units.new.modalitiesFailed` | A unidade foi criada, mas não foi possível ligar todas as modalidades. Abra a unidade para ligar as que faltam. | Unidade criada, mas faltou ligar algumas modalidades. Abra a unidade para concluir. |
| `units.dialog.warning` | Você só pode ajustar o nome curto uma vez. O endereço antigo continua valendo e leva ao novo. | Só dá para ajustar uma vez. O endereço antigo leva ao novo. |
| `units.dialog.formatInvalid` | Use até 60 letras minúsculas sem acento, números e hífen, sem hífen no começo ou no fim. | Até 60 letras minúsculas sem acento, números e hífen (não no começo nem no fim). |
| `unitSettings.feesHelp` | A taxa de cada meio é somada ao valor que o aluno paga online e aparece no recibo. É um valor fixo em reais. | Somada ao valor pago online e mostrada no recibo. |
| `unitSettings.otherMethodsHelp` | Recebidos no balcão ou direto na conta da unidade. Taxa fixa somada à cobrança; deixe R$ 0,00 para não cobrar. | Para pagamentos no balcão. Deixe R$ 0,00 para não cobrar. |
| `unitSettings.pixKeyHelp` | Usada quando o Mercado Pago está desconectado ou fora do ar: o aluno paga direto na chave e envia o comprovante, que fica "Em conferência". | Usada quando o pagamento online está fora: o aluno paga na chave e envia o comprovante. |
| `unitSettings.blockNoticeText` | Fixo. Vai por SMS também se o aluno não abriu os e-mails anteriores (até 3 SMS por mês). | Fixo. Vai também por SMS se o aluno não abriu os e-mails. |
| `unitSettings.remindersStop` | Os lembretes param quando a cobrança é paga, cancelada, renegociada ou fica em conferência. O WhatsApp é sempre manual, pela tela Em atraso. | Param quando a cobrança é paga, cancelada, renegociada ou vai para conferência. |
| `unitSettings.teacherHelp.studentRecord` | Abre a ficha dos alunos das turmas dele, sem valores, plano, benefício, CPF, endereço nem situação financeira. Desligada, ele vê só a lista simples da turma e da aula. | Abre a ficha dos alunos das turmas dele, sem dados financeiros, CPF nem endereço. |
| `unitSettings.teacherLock` | Em qualquer caso, o Professor nunca vê valores, plano, benefício, CPF, endereço nem situação financeira. Vê só se o aluno está ativo ou bloqueado na modalidade. | O Professor nunca vê valores, plano, benefício, CPF, endereço nem situação financeira. |
| `unitSettings.links.offNote` | Desligado, o link mostra "Esta unidade não está recebendo pedidos por aqui" com o contato da unidade. | Desligado, o link mostra o contato da unidade. |
| `enrollmentWizard.student.form.possibleDuplicate` | Já existe um aluno chamado {{name}} com a mesma data de nascimento. É a mesma pessoa? | Já existe {{name}} com esta data de nascimento. É a mesma pessoa? |
| `enrollmentWizard.modalities.noModality` | Esta unidade não oferece modalidade disponível para este aluno. Ligue uma modalidade na unidade e tente de novo. | Esta unidade não tem modalidade para este aluno. |
| `enrollmentWizard.modalities.warnCapacity` | Turma acima da capacidade com esta matrícula: {{count}} de {{capacity}}. Você pode seguir; a capacidade só avisa. | Com esta matrícula, a turma fica com {{count}} de {{capacity}}. |
| `enrollmentWizard.summary.termText` | {{who}} aceita o termo no primeiro acesso ao portal, antes de qualquer outra tela. Até lá, {{student}} aparece com o selo "Termo pendente". | {{who}} aceita o termo no primeiro acesso ao portal. |
| `enrollmentWizard.done.invite.FAILED` | A matrícula foi gravada, mas o convite do portal não foi enviado. Reenvie pela ficha do aluno. | Matrícula salva, mas o convite não saiu. Reenvie pela ficha do aluno. |
| `enrollmentWizard.done.forbidden` | Você não tem permissão para registrar pagamentos. O aluno paga pelo portal ou a coordenação registra depois. | Sem permissão para registrar pagamentos. O aluno paga pelo portal. |
| `charges.creation.errors.404` | O aluno ou a unidade não existe ou não está ao seu alcance. Nada foi gravado. | Aluno ou unidade fora do seu alcance. Nada foi salvo. |
| `charges.creation.errors.409` | Este pedido já foi usado com outros dados. Feche a janela e abra de novo. Nada foi gravado. | Feche a janela e abra de novo. Nada foi salvo. |
| `charges.creation.errors.422` | O aluno precisa ter matrícula na unidade e, sendo menor de 18 anos, um responsável financeiro. Nada foi gravado. | O aluno precisa de matrícula na unidade e, se menor, de um responsável financeiro. Nada foi salvo. |
| `charges.errorText` | A conexão caiu no meio do caminho. Nada foi alterado. Se continuar, fale com o suporte. | A conexão caiu. Nada foi salvo. Tente de novo. |
| `charges.reminder.effect` | O lembrete vai ao e-mail do pagador. Cobrança que já recebeu lembrete nas últimas 24 horas não recebe outro. | Vai ao e-mail do pagador, no máximo um a cada 24 horas. |
| `charges.overdue.notice` | Lembretes automáticos: 3 dias antes, no dia, 3 e 10 dias depois e 5 dias antes do bloqueio. O WhatsApp é sempre manual: o botão abre a conversa com a mensagem pronta. | Os lembretes por e-mail são automáticos. O WhatsApp abre a conversa pronta. |
| `charges.cancel.note` | A cobrança sai do portal do aluno. O relatório financeiro mostra o valor em "cancelado no período", com o seu nome. | A cobrança sai do portal e fica no relatório como cancelada por você. |
| `charges.renegotiate.effect` | Divida a cobrança em aberto em até 6 parcelas mensais, ou mude o valor e o vencimento dela. | Divida em até 6 parcelas ou mude valor e vencimento. |
| `announcements.limitBanner` | A {{unit}} chegou a {{limit}} comunicados hoje, contando os agendados para hoje. Amanhã o limite volta. Cancelar um agendado de hoje libera a vaga. | Limite de {{limit}} comunicados hoje. Cancele um agendado de hoje ou envie amanhã. |
| `announcements.note` | Enviado não é editado nem apagado. Agendado pode ser editado ou cancelado até sair. A gestão vê só quantos leram. | Enviado não se edita. Agendado pode ser editado ou cancelado até sair. |
| `announcements.new.intro` | Escolha para quem o aviso vai, escreva o texto e veja quantas pessoas o recebem antes de enviar. | Escolha o destino, escreva e confira quantas pessoas recebem. |
| `portalRequests.footerNote` | Pedidos sem resposta expiram em 30 dias e o aluno é avisado. Ao recusar, você escreve a mensagem que o aluno vai ver. | Sem resposta, o pedido expira em 30 dias. |
| `account.email.sent` | Se o endereço {{email}} puder ser usado, enviamos um link de confirmação. Ele vale por 24 horas. | Se {{email}} puder ser usado, o link de confirmação chega em instantes (vale 24 horas). |
| `account.confirm.invalid` | Este link venceu, já foi usado ou não é desta conta. Peça um novo na tela Minha conta. | Link vencido, já usado ou de outra conta. Peça um novo em Minha Conta. |
| `account.access.note` | O novo e-mail só vale depois de confirmado pelo link (24 horas). O endereço antigo recebe um aviso. | O novo e-mail vale depois de confirmado (24 horas). O antigo recebe um aviso. |
| `portalTerm.introAdult` | Leia e aceite o termo de matrícula da {{org}} para liberar o portal. Você aceita uma vez. | Aceite o termo de matrícula da {{org}} para liberar o portal. |
| `portalTerm.introGuardian` | Para liberar o portal de {{student}}, leia e aceite o termo de matrícula da {{org}}. Você aceita uma vez, por {{student}}. | Aceite o termo de matrícula da {{org}} para liberar o portal de {{student}}. |
| `portalTerm.introMany` | Você é responsável por {{count}} alunos com termo pendente. O portal libera depois que você aceitar por todos. | Aceite o termo por cada um dos {{count}} alunos para liberar o portal. |
| `paymentProofs.intro` | Quando o Mercado Pago está desconectado ou o aluno paga direto na chave, ele envia o comprovante pelo portal. Ao recusar, o prazo de bloqueio volta de onde parou. | Comprovantes de Pix na chave enviados pelo portal. |
| `paymentProofs.review.note` | Cada cobrança é decidida uma a uma. Confirmar grava o meio "Pix na chave", a origem portal e quem confirmou; recusar pede o motivo e só aquela cobrança volta a contar o prazo. | Cada cobrança é decidida separadamente. |
| `paymentProofs.confirm.effect` | A cobrança passa a Paga, com recibo, no meio Pix na chave e na data do envio do comprovante. | A cobrança fica Paga, com recibo, na data do comprovante. |
| `paymentProofs.refuse.effect` | A cobrança volta a aberta, o prazo de bloqueio segue de onde parou e o aluno recebe o motivo por e-mail. | A cobrança volta a aberta e o aluno recebe o motivo por e-mail. |
| `pixProof.offline` | O pagamento online da {{unit}} está fora do ar agora. Pague na chave Pix da unidade e envie o comprovante. | O pagamento online está fora do ar. Pague na chave Pix e envie o comprovante. |
| `pixProof.effect` | Depois do envio, as cobranças ficam "Em conferência": lembretes e prazo de bloqueio param até a academia conferir. | As cobranças ficam em conferência até a academia confirmar. |
| `portalShell.reduced` | Seu acesso está reduzido: você vê Início, Financeiro e Minhas informações. Fale com a academia para voltar a treinar. | Acesso reduzido. Fale com a academia para voltar a treinar. |
| `portalOwn.intro` | Peça troca de turma, nova modalidade, troca de plano ou encerramento. O pedido não altera a sua matrícula: a academia responde e conclui com você. | Peça troca de turma, nova modalidade, troca de plano ou encerramento. A academia responde. |
| `portalOwn.dialog.CLASS_CHANGE.effect` | É só um pedido: a turma só muda quando a academia concluir a troca com você. | A turma só muda quando a academia concluir. |
| `portalOwn.dialog.PLAN_CHANGE.effect` | É só um pedido: o plano e o valor só mudam quando a academia concluir a troca com você. | O plano só muda quando a academia concluir. |
| `portalFinance.open.emptyText` | Quando houver uma cobrança, ela aparece aqui. Se o responsável financeiro cuida dos pagamentos, é ele quem as vê. | Nenhuma cobrança em aberto. |
| `portalInfo.terms.revokeSummary` | A academia deixa de usar fotos e vídeos em que você aparece a partir de hoje. O que já foi publicado antes não é apagado automaticamente: se quiser, peça à unidade. | A academia deixa de usar sua imagem a partir de hoje. O que já foi publicado não é apagado sozinho. |

Ficam como estão, por ser regra que a pessoa precisa saber para decidir: `portalOwn.dialog.CLOSURE.effect` (prazo de 7 dias e cobranças vencidas) e as confirmações de ações que não se desfazem.

## Lista D · Consistência

- **"Nada foi…"**: 54 textos com "Nada foi alterado" e 21 com "Nada foi gravado", mais "publicado" e "enviado" → "Nada foi salvo." (F2).
- **Reticências**: 40 textos com "..." (ex.: "Enviando...") → "…".
- **Aspas**: 32 textos com aspas retas → “ ”.
- **"email"**: 15 textos → "e-mail".
- **"Salvar alterações"** (4) → "Salvar"; "Tentar de novo" já é o padrão.
- **"Cancelar" com dois sentidos** nas janelas de cancelar cobrança, aula, mensalidade e comunicado → fechar vira "Voltar" (C3).
- **Gênero**: "deseja a ele(a) um feliz aniversário" (`birthdays.messageGuardian`) → "deseja um feliz aniversário a {{name}}!".
- **Nomes desatualizados nos textos**: "Configurações › Unidade" (`modalities.readOnlyBanner`), "Usuários da gestão" (`units.new.inviteFailed`, `permissionsTable.rows.staffUsers.label`), "Dias sem aula"/"dia sem aula" (15 textos; vira "Feriados e Recessos"/"recesso"), "Benefícios altos", "Decidido por", "10 dias antes", "dia de vencimento do aluno". Os itens que mudam essas regras atualizam os textos; esta revisão confere que nenhum sobrou.
- **Fora do `pt-BR.json`**: assuntos e corpos de e-mail (`backend/src/main/java/br/com/ctcore/mail/` (`TextModels`, `EmailTemplate`, `EmailLayout`)), PDFs de recibo e mensagens de erro da API que aparecem na tela seguem as mesmas regras.
