# 01 · Organização, unidades e isolamento

Entrega 1 · Fase 1 · Depende de: Fase 0 · Código: ORG

## Objetivo

Criar a base multi-cliente: organizações isoladas entre si, cada uma com uma ou mais unidades, e as configurações que valem para a organização ou para cada unidade.

## Quem usa

Coordenador (tudo), Administrador (vê as configurações da organização e altera as das suas unidades), Equipe da plataforma (pelo painel).

## Dados

- **Organização:** nome, logo, site e redes sociais (Instagram, Facebook, YouTube; opcionais), CNPJ ou CPF do titular e e-mail que recebe as faturas da assinatura, Coordenador, situação da assinatura, data de entrada, configurações da organização.
- **Unidade:** organização, nome, nome curto para endereços públicos, endereço completo com coordenadas, telefone, e-mail de contato, WhatsApp de contato, CNPJ opcional (sai nos recibos), fuso horário (padrão America/Sao_Paulo), fotos (uma de capa e até 6 da estrutura, JPG, PNG ou WebP, cortadas em 4:3), horário de funcionamento (por dia da semana, com mais de um período por dia), apresentação (até 300 caracteres), Instagram (opcional; vazio, vale o da organização), situação (Ativa, Desativada), configurações da unidade.

### Configurações da organização (só o Coordenador altera)

| Configuração | Padrão |
| --- | --- |
| Faixas etárias (nome, idade mínima e máxima) | Infantil 4–12, Juvenil 13–17, Adulto 18+ |
| Modalidades ativas e graduação de cada uma | Ver `04` |
| Termo de matrícula e termo de uso de imagem | Modelo da plataforma |
| Prazo de inativação por atraso | 30 dias (de 15 a 90) |
| Prazo de acesso do ex-aluno ao histórico | 12 meses |
| Guarda de aula experimental não convertida | 6 meses |
| Treinar em outra unidade | Depende do plano |

### Configurações da unidade (Administrador da unidade ou Coordenador)

| Configuração | Padrão |
| --- | --- |
| Dia de vencimento (um só por unidade, RN-COB-01) | 10 (de 5 a 28) |
| Taxa de matrícula | Desligada (a unidade pode ligar e definir o valor) |
| Taxa repassada por meio de pagamento | 0 em todos até a unidade informar |
| Chave Pix | Não cadastrada |
| Conta do Mercado Pago | Não conectada |
| Lembretes de cobrança | 3 dias antes, no dia, 3 e 10 dias depois |
| Permissões do Professor | As quatro primeiras ligadas (comunicado, editar e cancelar aulas, ver contatos, aulas experimentais); "ver ficha do aluno" desligada |
| Aparecer no diretório | Desligado |
| Link de aula experimental e de autocadastro | Ligados |
| Limite de aulas experimentais por pessoa (RN-AEX-02) | 2 (de 1 a 3) |

## Regras

- **RN-ORG-01.** Organizações nunca se enxergam. Toda tabela de negócio tem `organization_id`, e as operacionais também `unit_id`.
- **RN-ORG-02.** O isolamento é aplicado na camada de dados do back-end e confirmado pelo PostgreSQL (row-level security). Uma consulta sem organização definida não retorna nada.
- **RN-ORG-03.** Arquivos ficam em pastas por organização. A URL de um arquivo é temporária e assinada.
- **RN-ORG-04.** Toda organização nasce com uma unidade. Com uma unidade só, a interface não mostra seletor de unidade e fala "academia".
- **RN-ORG-05.** Máximo de 10 unidades (409 `UNIT_LIMIT_REACHED`) e 200 usuários da gestão por organização; convites pendentes contam entre os usuários. Acima disso, só pelo suporte.
- **RN-ORG-06.** O Coordenador é um só por organização. Ele pode transferir a coordenação a outra conta com confirmação digitada, senha e e-mail de confirmação ao novo Coordenador. A troca é imediata, sem aceite do novo Coordenador, que é um Administrador ativo da organização. O antigo Coordenador sai sem acesso de gestão, a menos que quem transfere marque as unidades em que ele continua como Administrador; cada unidade marcada é uma vaga paga (RN-ASS-21) e a tela mostra o custo antes de confirmar. Nenhuma unidade vem marcada por padrão. (Alterado em 19/11/2026: antes, o antigo virava Administrador de todas as unidades.)
- **RN-ORG-07.** Nenhuma ação de usuário deixa uma unidade ativa com zero Administradores. Para desativar o último, o Coordenador nomeia outro, podendo ser ele mesmo; o Coordenador nomeado Administrador não ocupa vaga paga (RN-ASS-21). A unidade recém-criada pode nascer sem Administrador, quando o convite opcional do assistente (RF-ORG-03) é omitido ou falha; ela aparece com o aviso "sem Administrador" nos Primeiros passos.
- **RN-ORG-08.** "Todas as unidades" existe só para o Coordenador e só para consulta: Início, financeiro e relatórios somados e comparados. Para cadastrar ou alterar, ele entra numa unidade.
- **RN-ORG-09.** Administrador de duas ou mais unidades escolhe a unidade no seletor do topo. Ele não tem visão somada.
- **RN-ORG-10.** Planos, turmas, cobranças, dia de vencimento e conta de pagamento são da unidade. Faixas etárias, graduação, termos e prazos são da organização.
- **RN-ORG-11.** Desativar uma unidade exige que não haja alunos com modalidade ativa nem turmas ativas nela (transferidos ou encerrados antes), nem cobranças em conferência. A única unidade ativa da organização não pode ser desativada. O histórico fica para consulta. Confirmação digitada: DESATIVAR, e a senha (RN-ACE-21).
- **RN-ORG-12.** Transferência: uma modalidade da matrícula pode ir para outra unidade da mesma organização, mantendo histórico e graduação. Cobranças já geradas ficam na unidade de origem. A nova unidade escolhe turma, plano e vencimento.
- **RN-ORG-13.** "Treinar em outra unidade": com "Depende do plano", cada plano diz se vale também em outras unidades. Com "Sim" ou "Não", vale para todos os planos.
- **RN-ORG-14.** O endereço da unidade é guardado com latitude e longitude (geocodificação no cadastro, ajustável no mapa), para o diretório.
- **RN-ORG-15.** O nome curto da unidade é único na plataforma, gerado do nome e ajustável uma vez pelo Coordenador. O nome antigo redireciona para o novo.
- **RN-ORG-16.** Quando um padrão da plataforma muda, organizações existentes mantêm os valores que já salvaram.
- **RN-ORG-17.** As faixas etárias são administrativas: servem para organizar turmas, diretório e aula experimental, e a organização cria, renomeia ou apaga as suas. Categorias de competição (IBJJF, CBJ, World Boxing e outras) não entram no cadastro do aluno, porque variam por modalidade e regulamento. A idade do aluno é sempre calculada pelo nascimento.

## Requisitos

- **RF-ORG-01.** Configurações › Organização, em abas: **Geral**, **Modalidades** (RF-MOD-01 e RF-MOD-02, com "Exigir comprovante da graduação de origem" por modalidade), **Faixas etárias** (RF-MOD-04), **Termos** (RF-MAT-05) e **Textos** (RF-COM-03). A aba Geral tem: nome, logo (JPG, PNG ou WebP, cortado em quadrado, 512 px), site e redes sociais; as regras da organização: prazo para bloquear por atraso (15 a 90 dias), acesso de ex-aluno ao histórico (1 a 60 meses, padrão 12), guarda de experimentais sem matrícula (1 a 60 meses, padrão 6) e "Treinar em outra unidade" (sim, não ou depende do plano, RN-ORG-13); e o cartão do Coordenador atual com "Transferir coordenação". Só o Coordenador altera; o Administrador vê em leitura. Não existe cor da organização: a marca da academia é o nome e o logo (RNF-22). O titular é editado em Configurações › Assinatura (RF-ASS-01); até a tela de Assinatura existir, fica na aba Geral. (Alterado em 19/11/2026.)
- **RF-ORG-02.** Configurações › Unidades: lista com nome, cidade, alunos ativos, Administradores e situação, com "Nova unidade", "Abrir" e "Desativar" (o Coordenador vê todas). O Administrador vê só as suas: com uma unidade, o item abre direto a configuração dela. O nome curto antigo fica reservado à unidade que o usou.
- **RF-ORG-03.** Nova unidade: assistente curto com nome, endereço, contato, modalidades oferecidas e convite opcional do Administrador, que mostra o custo da vaga ("+R$ 50/mês", RN-ASS-21) antes de enviar. Até a Sprint 04 as modalidades ficam fora do assistente e latitude e longitude ocupam o lugar do mapa. O resto vai para os "Primeiros passos" da unidade.
- **RF-ORG-04.** Configuração de uma unidade, aberta pela lista de Unidades (não há mais item de menu próprio), em abas: **Dados** (nome, CNPJ, endereço, WhatsApp, e-mail, fuso horário, fotos, horário de funcionamento, apresentação, Instagram e modalidades oferecidas, com o link "Gerenciar modalidades da organização"); **Cobrança** (dia de vencimento, taxa de matrícula, conexão do Mercado Pago (ver `11`), taxas por meio de pagamento (por ora só em valor fixo, em centavos, até R$ 1.000,00 por meio; a taxa de matrícula vai até R$ 1.000.000,00; o percentual e a prévia do total serão decididos na #97) e chave Pix); **Lembretes**; **Divulgação** (aparecer no diretório, links de aula experimental e de autocadastro com QR code e PDF, e o limite de aulas experimentais por pessoa); **Permissões do Professor** (com o atalho para a tabela de permissões dos perfis, RF-ACE-09). Cada aba termina com o bloco "Vale para todas as unidades": as regras da organização que afetam aquela aba, só para leitura, com "Alterar em Organização" para o Coordenador (por exemplo, em Cobrança, o prazo para bloquear por atraso; em Divulgação, a guarda de experimentais sem matrícula e "Treinar em outra unidade"). (Alterado em 19/11/2026.)
- **RF-ORG-05.** Seletor de unidade no topo da gestão, visível com duas ou mais unidades ao alcance do usuário. O Coordenador vê também "Todas as unidades", que é o seu padrão.
- **RF-ORG-06.** Transferir coordenação (RN-ORG-06): escolher o novo Coordenador entre os Administradores ativos e, numa lista de unidades sem nenhuma marcada, as unidades em que o antigo continua como Administrador, com o total de "+R$ 50/mês por unidade" atualizado a cada marcação. Sem nenhuma marcada, a confirmação diz que o antigo Coordenador perde o acesso à gestão.
- **RF-ORG-07.** Desativar unidade (RN-ORG-11), mostrando o que impede.
- **RF-ORG-08.** Toda alteração de configuração mostra "Última alteração em [data] por [pessoa]" e vai para a auditoria com o valor antes e depois. A edição de organização e de unidade exige `If-Match` (428 sem ele).
- **RF-ORG-09.** O grupo Configurações do menu tem quatro itens, cada um com abas: **Organização** (RF-ORG-01), **Unidades** (RF-ORG-02 e RF-ORG-04), **Assinatura** (RF-ASS-01, só o Coordenador) e **Dados e segurança** (abas Auditoria, RF-AUD-01; Importar e exportar, RF-IMP-01; Acesso do suporte, RN-PNL-03; e Duas etapas, RN-ACE-24). Uma aba de sprint futura aparece desabilitada com "Em breve"; um item cujas abas são todas futuras também. Administradores ficam em Pessoas › Administradores (RF-ACE-06). (Decisão do dono de 19/11/2026.)

## Pronto quando

- Testes provam, para cada rota, que a organização A não lê nem altera nada da B, inclusive por identificador adivinhado.
- O banco recusa uma consulta sem organização definida.
- Com uma unidade, nenhum seletor aparece; com duas, aparece.
- O Coordenador não altera nada em "Todas as unidades".
- Não é possível ficar com uma unidade ativa sem Administrador.
