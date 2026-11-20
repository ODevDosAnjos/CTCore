# 10 · Cobranças

Entrega 1 · Fase 10 · Depende de: 07, 09 · Código: COB

## Objetivo

Gerar, acompanhar e receber o que os alunos devem à unidade. Os meios online e o Mercado Pago estão em `11`.

## Dados

- **Cobrança:** unidade, aluno, quem paga (aluno adulto ou responsável financeiro), tipo (Mensalidade, Taxa de matrícula, Avulsa, Parcela, Diferença de reajuste), modalidade da matrícula (quando houver), mês de referência, descrição, vencimento, composição (plano, benefício aplicado, valor final), valor em centavos, situação, cobrança de origem (para parcelas), motivo (cancelamento, renegociação).
- **Pagamento:** cobrança(s), valor, taxa repassada, meio (Pix Mercado Pago, cartão de crédito, cartão de débito, boleto, Pix na chave da unidade, dinheiro, cartão na maquininha, transferência), origem (portal, gestão, débito automático), quem lançou, data e hora, identificador no provedor, comprovante anexado (Pix na chave).
- **Recibo:** pagamento, número sequencial por unidade, código de conferência, PDF.
- **Lembrete:** cobrança, regra (3 dias antes, no dia, 3 depois, 10 depois, 5 dias antes do bloqueio, manual), canal, data.

## Situações da cobrança

| Situação | Quando |
| --- | --- |
| Pendente | Em aberto e antes do vencimento, inclusive a que venceu ontem e ainda está na tolerância |
| Vence hoje | Em aberto, calculada pela data |
| Em atraso | Calculada: passou do vencimento (mais a tolerância da primeira cobrança) sem pagamento |
| Em conferência | Comprovante de Pix na chave enviado, aguardando o Administrador |
| Paga | Paga até o vencimento |
| Paga com atraso | Paga depois do vencimento mais a tolerância (quem paga dentro da tolerância sai "Paga") |
| Cancelada | Cancelada pela gestão, com motivo |
| Renegociada | Substituída por parcelas ou por nova cobrança |
| Estornada | Pagamento devolvido (ver `11`) |

## Regras

### Geração

- **RN-COB-01.** Uma mensalidade por modalidade ativa da matrícula, recebida pela unidade daquela modalidade, no dia de vencimento da unidade (um dia só por unidade, de 5 a 28, em Configurações › Unidades › [unidade] › Cobrança; padrão 10). (Alterado em 20/11/2026.)
- **RN-COB-02.** Geração automática mensal: no dia 1º de cada mês, às 02:00 de Brasília, nascem as mensalidades daquele mês, com vencimento no dia da unidade. Se a tarefa não rodou, ela recupera o mês corrente, nunca meses futuros. Não existe geração de meses futuros por ninguém. A tela de prévia mostra o que vai nascer no próximo dia 1º para o Administrador conferir e ajustar antes (cancelar, aplicar benefício). (Alterado em 20/11/2026.)
- **RN-COB-03.** Valor = plano menos o benefício válido na data da geração, nunca abaixo de zero. A composição fica guardada e não muda se o plano ou o benefício mudarem depois.
- **RN-COB-04.** Não geram mensalidade: modalidade com bolsa de 100%, modalidade bloqueada, encerrada ou com encerramento solicitado. Valor final zero (bolsa de 100% ou desconto fixo igual ou maior que o plano) também não gera mensalidade, e o aluno continua ativo.
- **RN-COB-05.** A geração é idempotente: nunca existem duas mensalidades da mesma modalidade da matrícula para o mesmo mês de referência.
- **RN-COB-06.** **Retirado** (20/11/2026): não existe pagamento adiantado nem geração de mensalidades de meses futuros (RN-COB-02). A geração continua idempotente (RN-COB-05).
- **RN-COB-07.** Não existem juros, multa nem pagamento parcial.

### Alterações

- **RN-COB-08.** Cobrança paga nunca muda.
- **RN-COB-09.** Renegociação: o Administrador (e o Coordenador, que pode tudo o que o Administrador pode) altera valor e vencimento de uma cobrança em aberto, ou divide uma ou mais cobranças em até 6 parcelas mensais. Alterar valor e vencimento também é uma renegociação: a original fica "Renegociada" e nasce uma cobrança nova do tipo Parcela, sem editar a original nem a composição dela. As originais ficam "Renegociada". O primeiro vencimento não pode ser anterior a hoje. Motivo da lista (RNF-47) e auditoria; o painel mostra quem renegociou.
- **RN-COB-10.** Cancelar cobrança em aberto (Administrador e Coordenador): qualquer valor e idade, motivo da lista (RNF-47). O painel da cobrança mostra quem cancelou, quando e o motivo, e o relatório financeiro mostra "cancelado no período" por pessoa. (Alterado em 20/11/2026.)
- **RN-COB-11.** Cobrança avulsa (kimono, exame, seminário): aluno, unidade (entre aquelas em que o aluno tem matrícula), descrição (até 80 caracteres), valor (de R$ 0,01 a R$ 100.000,00), vencimento (de hoje em diante). Paga por Pix ou cartão e, até os meios online existirem, no balcão. Não conta para a inativação por atraso.

### Recebimento

- **RN-COB-12.** Pagamento manual guarda meio (dinheiro, Pix na chave, cartão na maquininha, transferência) e quem lançou. Registram o Coordenador e o Administrador das unidades; o Professor não registra. A data pode ser passada, nunca futura. Não existe abertura e fechamento de caixa.
- **RN-COB-13.** Pix na chave da unidade: o aluno paga, anexa o comprovante no portal e a cobrança fica "Em conferência". Lembretes e prazo de inativação param. O Administrador confirma (vira pagamento) ou recusa com motivo; recusado, o prazo volta a contar de onde parou. Envia o comprovante quem paga (adulto com conta ou responsável financeiro; o não financeiro não envia), e só cobrança aberta de unidade com chave Pix aceita comprovante. A gestão confirma ou recusa com a permissão de cobranças completo (a da RN-COB-12) no alcance da unidade; o Professor não vê. Confirmar grava o meio Pix na chave, a origem portal, a data do envio e quem confirmou, com recibo opcional por e-mail (padrão marcado). O "prazo volta de onde parou" é um contador de dias pausados, somado à data de bloqueio e contado pela data local da unidade, do envio à recusa; vencimento e valor não mudam. A cobrança em conferência continua visível ao aluno, sem "Pagar".
- **RN-COB-14.** Várias cobranças podem ser pagas de uma vez, num só Pix, boleto ou cartão, desde que sejam da mesma unidade. Até a Sprint 11 (pagamento online), "pagar junto" envia um comprovante de Pix na chave para várias cobranças da mesma unidade, gravado um por cobrança e decidido um a um.
- **RN-COB-15.** Pagamento em duplicidade é registrado como tal e vai para o "Precisa de atenção". O Administrador estorna ou usa como crédito na próxima cobrança da mesma modalidade.
- **RN-COB-16.** Todo pagamento gera recibo em PDF: logo, nome da unidade, CNPJ quando informado e endereço; número sequencial da unidade; nome e CPF de quem pagou (o CPF completo só no PDF aberto com sessão e acesso a cobranças da unidade; o PDF aberto pelo link público mostra o CPF mascarado, `***.456.789-**`); aluno e referência ("Jiu-Jitsu · nov/2026" ou a descrição da avulsa); valor, taxa repassada, meio, data e hora; "Este recibo não é nota fiscal."; código de conferência válido em `ctcore.com.br/recibo/{codigo}`. O recibo baixado pelo portal sai com o CPF mascarado; o completo só na sessão da gestão. O link do recibo não expira. O e-mail de pagamento confirmado leva o link, não o PDF anexado.

### Lembretes

- **RN-COB-17.** Lembretes por e-mail: 3 dias antes, no dia, 3 e 10 dias depois do vencimento, configuráveis por unidade. Cada lembrete sai no dia exato, na hora da unidade, uma só vez; dia perdido não é recuperado e não se lembra dia anterior à criação da cobrança. Há um interruptor geral da unidade e a hora; cada lembrete (3 dias antes, no dia, 3 dias depois e 10 dias depois) tem a própria chave de ligar e desligar e o dia ajustável, e desligar um lembrete não apaga o dia configurado (alterado em 19/11/2026: antes, desligar era tirar o dia da lista). Canais: só e-mail até a Sprint 22, quando a regra de canais (e push) volta a valer. Mais um aviso fixo 5 dias antes do bloqueio, só para mensalidade, parcela e diferença de reajuste, em unidade com conta de pagamento conectada; se o aluno não abriu os e-mails anteriores, esse aviso também vai por SMS (até o provedor registrar abertura, sai sempre que há telefone). O envio manual de lembrete é só por e-mail, para qualquer cobrança aberta; recusa cobrança não aberta (`NOT_OPEN`) e repetição em menos de 24 horas (`RECENT`), e não depende do interruptor da unidade.
- **RN-COB-18.** Lembretes de menor vão para o responsável financeiro.
- **RN-COB-19.** Lembretes param quando a cobrança é paga, cancelada, renegociada ou fica em conferência.
- **RN-COB-20.** SMS: no máximo 3 por aluno e por mês, contando todos os tipos (o aviso de bloqueio inclusive) (ver `00` §11).
- **RN-COB-21.** O link de pagamento nos e-mails de cobrança não expira: abre a cobrança atual da pessoa e pede login se não houver sessão. Se a cobrança já foi paga, mostra o recibo.

### Situação financeira do aluno

- **RN-COB-22.** Situação financeira do aluno: "Em atraso" quando há cobrança em aberto em atraso de qualquer tipo, avulsa inclusa; senão "Em dia". A regra de bloqueio por atraso (`12`) é outra e não conta a avulsa nem a taxa de matrícula.

## Requisitos

- **RF-COB-01.** Financeiro › Cobranças e pagamentos: título sem subtítulo (RNF-45); botões Recebimentos do dia, Prévia da geração, Ver atrasados (mesmo formato dos outros dois), Exportar CSV ("Em breve" até a #151) e Nova cobrança; abas Todas, Em atraso, Vence hoje, Em conferência e Pagas no mês, cada uma com a contagem do alcance; colunas aluno com foto, referência (modalidade, mês e tipo), valor final, vencimento, situação (cor e texto, com os dias de atraso quando em atraso), meio com o valor pago quando paga e "Criado por" ("Sistema" ou o nome, RNF-46); ordem padrão: a cobrança criada por último primeiro (RNF-51); filtros no botão Filtros; rodapé com os totais do que está filtrado, alinhados com as colunas de valor, incluindo Pago e Em aberto (pendente, vence hoje, em atraso e em conferência; cancelada, renegociada e estornada não somam). (Alterado em 20/11/2026.)
- **RF-COB-02.** Painel da cobrança, sempre com as seções na mesma ordem, qualquer que seja o tipo ou a situação: Composição (que não muda depois de gerada), Pagamentos e recibos, Lembretes enviados, Origem e histórico (quem criou, renegociou, cancelou ou estornou, com data e motivo). Ações Registrar pagamento, Enviar lembrete, Renegociar, Cancelar, Estornar (quando paga), Ver aluno. Estornar (Sprint 11) aparece desabilitado, com o motivo escrito, até o item que o entrega. (Alterado em 20/11/2026.)
- **RF-COB-03.** Prévia da geração: as mensalidades que nascem no próximo dia 1º (RN-COB-02), com o total previsto, a diferença para o mês anterior e quem não será cobrado e por quê; "Ver alunos" abre a lista com valores no formato brasileiro e alinhados. Cancelar grava a cobrança do mês como cancelada, com motivo, e ela não é recriada. (Alterado em 20/11/2026.)
- **RF-COB-04.** Registrar pagamento: meio, data, valor (igual ao da cobrança), observação e enviar recibo por e-mail (mostra o e-mail do pagador; sem e-mail cadastrado o recibo não é enviado). Quem lança é a pessoa logada e aparece na lista e no painel (RNF-46), não na janela. "Baixar recibo" baixa o PDF do recibo. (Alterado em 20/11/2026.)
- **RF-COB-05.** Em conferência: lista de comprovantes com imagem, aluno e valor; Confirmar ou Recusar. O primeiro da fila aparece em destaque (imagem, chave Pix da unidade e prazo de bloqueio pausado) e os demais em "Também aguardando". Um comprovante enviado de uma vez para várias cobranças do mesmo aluno (mesmo instante de envio) aparece como um só item, com o valor somado, e a janela "Conferir comprovante" decide cada cobrança separadamente; a gravação segue um comprovante por cobrança (RN-COB-14).
- **RF-COB-06.** Em atraso: dias de atraso, valor, modalidade, último lembrete (de qualquer resultado, inclusive e-mail com problema), dias até o bloqueio e o total do filtro; seleção múltipla e "Enviar lembrete" (e-mail, e WhatsApp com mensagem pronta por aluno).
- **RF-COB-07.** Nova cobrança avulsa (RN-COB-11), que mostra quem a criou na lista e no painel. "Gerar próximas mensalidades" não existe (RN-COB-06 retirada). (Alterado em 20/11/2026.)
- **RF-COB-08.** Recebimentos do dia: por meio e por pessoa que lançou. Quem tem acesso de consulta a Cobranças e pagamentos vê os recebimentos das suas unidades; pagamento sem lançador (portal, débito automático) aparece como "Portal (aluno pagou)". A tela mostra o total e a taxa repassada por meio (crédito e débito do portal somados em "Cartão pelo portal"), sem a lista de pagamentos. A data se escolhe pelas setas de dia anterior e próximo ou por um calendário, que só aceita datas de hoje para trás e não antes da criação da unidade, no fuso da unidade. (Alterado em 20/11/2026.)
- **RF-COB-09.** Configurações › Unidades › [unidade] › Lembretes.

## Pronto quando

- Rodar a geração duas vezes no mesmo dia não cria nada repetido.
- Aluno com bolsa de 100% não recebe mensalidade e continua ativo.
- Lembretes param no minuto do pagamento.
- O recibo confere pelo código na página pública, que mostra só unidade, número, referência, valor, data e as iniciais de quem pagou.
