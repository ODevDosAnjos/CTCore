# 07 · Planos e benefícios

Entrega 1 · Fase 7 · Depende de: 01, 04 · Código: PLA, BEN

## Objetivo

Definir quanto cada modalidade custa em cada unidade e os benefícios individuais que reduzem esse valor.

## Dados

- **Plano:** unidade, modalidade, nome (gerado, RN-PLA-07), faixa etária (opcional), valor mensal (em centavos), frequência semanal informativa (1x, 2x, 3x, livre), vale em outras unidades (quando a organização usa "Depende do plano"), situação (Ativo, Desativado), histórico de valores com data de início.
- **Benefício:** modalidade da matrícula, tipo (Bolsa em percentual de 1 a 100, ou Desconto em reais), valor, motivo (da lista ou "Outro"), lançado por (a pessoa logada), início, validade (sem prazo ou data), situação (Ativo, Vencido, Encerrado).

## Regras

### Planos

- **RN-PLA-01.** Um plano por modalidade da matrícula. Só mensal. Não existe plano combo de várias modalidades.
- **RN-PLA-02.** A frequência semanal é só informativa. Nada controla quantas aulas o aluno faz.
- **RN-PLA-03.** Todo valor é guardado em centavos inteiros.
- **RN-PLA-04.** Troca de plano e reajuste valem a partir da próxima cobrança gerada. O reajuste avisa por e-mail os alunos afetados, com o valor novo e a partir de quando vale.
- **RN-PLA-05.** Cobrança paga nunca muda. Se houver cobranças já geradas e ainda não pagas (geração do mês já feita), o Administrador escolhe: mantê-las no valor antigo (padrão) ou ajustá-las. Para cobranças já pagas de meses futuros, ele escolhe se cobra a diferença numa cobrança separada "Diferença de reajuste, referência [mês]", com aviso ao aluno. O padrão é não cobrar, e a escolha vai para a auditoria. "Ainda não pagas" são as abertas com vencimento de hoje em diante; "pagas de meses futuros" são as pagas com referência depois do mês de hoje; vencidas e abertas de meses passados nunca mudam. Ajustar recalcula com o benefício que a cobrança já tem; a diferença é cobrada uma vez por reajuste, só da parte que falta, com vencimento em 7 dias.
- **RN-PLA-06.** Plano com alunos ou histórico não é excluído, só desativado. Plano desativado some das escolhas e continua nas matrículas que já o usam até troca. Desativar e reativar são ações próprias: reativar só se não houver plano ativo com o mesmo nome, e plano desativado não é editável (reativa-se antes). A unidade e a modalidade do plano não mudam depois de criado: para outra, cria-se outro plano e desativa-se o antigo. Cada mudança de valor fica no histórico de valor do plano. A consulta do plano desativado mostra quem desativou, quando, e o histórico de valor.
- **RN-PLA-07.** O nome do plano é gerado da modalidade, da frequência e da faixa etária (se houver), como "Jiu-Jitsu · 2x por semana" ou "Judô · Livre · Infantil", e nunca é digitado (RNF-54). Na unidade não existem dois planos ativos com a mesma modalidade, frequência e faixa etária. (Decisão do dono de 20/11/2026.)

### Benefícios

- **RN-BEN-01.** No máximo um benefício ativo por modalidade da matrícula. Ao conceder a quem já tem, a janela avisa que o aluno já tem um benefício naquela modalidade e oferece "Editar o benefício atual"; não se cria outro. Não existe regra de combinação. (Alterado em 20/11/2026.)
- **RN-BEN-02.** Bolsa em percentual inteiro de 1 a 100% ou desconto em reais até o valor do plano (RNF-48); nos dois, "Integral" cobre o plano inteiro (bolsa de 100%). Não existe desconto por faixa nem por pontualidade. (Alterado em 20/11/2026.)
- **RN-BEN-03.** Todo benefício guarda motivo, quem lançou (a pessoa logada, RNF-46) e validade. Editar um benefício (tipo, valor, validade, motivo) vale a partir da próxima cobrança gerada e vai para a auditoria. (Alterado em 20/11/2026.)
- **RN-BEN-04.** O benefício vale a partir da próxima cobrança gerada. Cobrança já gerada não muda. Benefício vencido deixa de ser aplicado.
- **RN-BEN-05.** Com bolsa de 100%, a modalidade não gera mensalidade, mas o aluno segue Ativo.
- **RN-BEN-06.** **Retirado** (20/11/2026): não existe "benefício alto": sem aviso ao Coordenador, sem filtro e sem selo.
- **RN-BEN-07.** Desconto em reais nunca deixa a mensalidade negativa: o valor mínimo é zero.
- **RN-BEN-08.** O desconto para um professor que também é aluno é um benefício comum, com o motivo "Professor da academia" da lista; não existe marcação "desconto de professor". (Alterado em 20/11/2026.)
- **RN-BEN-09.** Desconto de família (irmãos) também é o benefício comum, dado em cada matrícula. Não existe cobrança por família.

## Requisitos

- **RF-PLA-01.** Financeiro › Planos: só planos (os benefícios ficam em Financeiro › Benefícios), sem subtítulo nem notas de regra (RNF-45) e com um só botão "Novo plano". A permissão de planos é Coordenador; Administrador nas suas unidades; Professor sem acesso. Uma unidade fora do alcance do Administrador dá lista vazia, sem erro. (Alterado em 20/11/2026.)
- **RF-PLA-02.** Planos: tabela com nome (gerado), modalidade, faixa etária, valor, frequência, "Outras unidades" (Sim ou Não), alunos usando e situação; "Editar" como botão visível em cada linha; filtros por modalidade e por "Outras unidades". (Alterado em 20/11/2026.)
- **RF-PLA-03.** Janela de plano: modalidade, frequência, faixa etária (opcional), valor ("R$ 0,00" no campo vazio, RNF-48) e "Vale em outras unidades" (Sim ou Não), com o nome gerado mostrado enquanto se preenche; na edição, o nome não se edita. Mudar o valor mostra quantos alunos serão afetados, a partir de quando e as escolhas da RN-PLA-05. Só Coordenador e Administrador (nas suas unidades) criam e editam plano. Com "Treinar em outra unidade" em "Sim" ou "Não" (RN-ORG-13), o plano grava "vale em outras unidades" como falso e a janela não oferece o controle. (Alterado em 20/11/2026.)
- **RF-BEN-01.** Financeiro › Benefícios: sem subtítulo nem notas de regra (RNF-45); tabela com aluno, unidade, modalidade, plano, tipo, valor, motivo, lançado por, validade e situação, com "Editar" em cada linha (encerrar fica dentro da edição); abas Ativos e Encerrados (que junta encerrados e vencidos), com contagem; filtros por tipo e modalidade. (Alterado em 20/11/2026.)
- **RF-BEN-02.** Conceder benefício, com campos separados e em cascata (RNF-49): aluno, unidade (entre as dele), modalidade (entre as dele naquela unidade) e o plano mostrado só para leitura, com o valor; tipo (Bolsa em % ou Desconto em R$, RN-BEN-02, com "Integral"); motivo da lista ("Bolsa atleta", "Professor da academia", "Família (irmãos)", "Parceria ou convênio", "Situação financeira", "Promoção", "Outro"); validade. Antes de confirmar, mostra plano, benefício, nova mensalidade e a partir de qual mês vale. Se o aluno já tem benefício na modalidade, segue a RN-BEN-01. (Alterado em 20/11/2026.)
- **RF-BEN-03.** Editar benefício (RN-BEN-03), com "Encerrar benefício" dentro da edição, com motivo da lista; ao encerrar, mostra o valor que a próxima cobrança gerada volta a ter. (Alterado em 20/11/2026.)

## Pronto quando

- Mudar um plano não altera nenhuma cobrança já gerada sem a escolha explícita do Administrador.
- Não existe tela nem API que aceite dois benefícios ativos na mesma modalidade da matrícula.
- O Professor não vê planos nem benefícios.
