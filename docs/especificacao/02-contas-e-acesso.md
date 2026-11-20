# 02 · Contas, acesso e permissões

Entrega 1 · Fase 2 · Depende de: 01 · Código: ACE

## Objetivo

Uma conta por pessoa, um login único para gestão e portal, convites, segurança da conta e a tabela de permissões de todos os perfis.

## Dados

- **Conta:** e-mail (único na plataforma, sem diferença entre maiúsculas e minúsculas), hash da senha (Argon2), nome, telefone, situação (Convite enviado, Ativa, Desativada), duas etapas (ligada ou não, segredo criptografado, códigos de reserva com hash), último acesso.
- **Vínculo:** conta, organização, papel (Coordenador, Administrador, Professor, Aluno, Responsável), unidades (para Administrador e Professor), situação, data de início e fim.
- **Sessão:** conta, aparelho (navegador e sistema), IP, início, último uso, validade.
- **Convite:** conta, vínculo, código (hash), validade, usado em, cancelado em.
- **Tentativa de acesso:** e-mail, IP, data, resultado.

## Regras

### Conta e vínculos

- **RN-ACE-01.** Uma conta por pessoa, identificada pelo e-mail, válida em toda a plataforma.
- **RN-ACE-02.** A mesma conta pode ter vários vínculos, na mesma organização ou em outras. Exemplo: professor em uma unidade e aluno em outra organização. Não existe segunda conta para segundo papel.
- **RN-ACE-03.** Quem tem um vínculo só vai direto para a sua área depois do login. Quem tem mais de um escolhe organização e área num modal logo após o login, e pode reabri-lo pelo menu sem novo login.
- **RN-ACE-04.** Não existe cadastro aberto para gestão nem portal. Toda conta nasce de um convite, do autocadastro aprovado (`20`) ou do cadastro da organização (`18`).
- **RN-ACE-05.** Convites em cascata: o Coordenador convida Administradores; o Administrador convida Professores da própria unidade; o convite do portal sai ao concluir a matrícula (ver `09`).
- **RN-ACE-06.** Aluno menor de idade não tem conta. O acesso é do responsável. Aos 18 anos, o sistema avisa o Administrador e o responsável, e a academia decide se convida o aluno.
- **RN-ACE-07.** Se o e-mail convidado já tem conta, o convite cria só o novo vínculo, e a pessoa aceita com a senha que já tem.

### Senha e login

- **RN-ACE-08.** Senha com 8 ou mais caracteres, pelo menos 1 número e 1 letra maiúscula, sem símbolo obrigatório. Senhas presentes em vazamentos conhecidos são recusadas ("Essa senha é muito conhecida. Escolha outra.").
- **RN-ACE-09.** A senha é guardada com hash Argon2. Ninguém, nem a plataforma, lê a senha. A academia não define nem redefine a senha de ninguém.
- **RN-ACE-10.** 5 senhas erradas seguidas travam aquele e-mail por 15 minutos. Há também limite por IP: 20 falhas em 15 minutos. O 429 do login informa o horário em que a trava acaba (`retryAt`), igual para e-mail existente ou não. O mesmo vale para o pedido de link de nova senha (RN-ACE-11), sem o horário. O login e os formulários públicos usam desafio invisível (Turnstile), que só aparece se o acesso parecer de robô.
- **RN-ACE-11.** Login e recuperação de senha mostram sempre a mesma mensagem, sem revelar se o e-mail existe: "E-mail ou senha incorretos." e "Se esse e-mail tiver uma conta, você vai receber um link em instantes."
- **RN-ACE-12.** Conta com convite não aceito ou desativada não entra; a mensagem é a mesma do erro de senha.
- **RN-ACE-13.** Convite vale 7 dias e é de uso único. Reenviar cancela o anterior. Máximo de 3 reenvios por dia por pessoa.
- **RN-ACE-14.** Link de nova senha vale 1 hora, é de uso único, e um novo pedido cancela o anterior. Conta desativada não recebe link; conta com convite pendente recebe o convite de novo.
- **RN-ACE-15.** Troca de e-mail só vale depois de confirmada pelo link enviado ao endereço novo (válido 24 horas). O endereço antigo recebe um aviso.
- **RN-ACE-16.** Quem abre um link interno sem sessão faz login e cai na tela pedida. Quem já tem sessão e abre o login vai para a sua área.

### Duas etapas

- **RN-ACE-17.** Verificação em duas etapas por app autenticador (TOTP). Obrigatória para Coordenador e equipe da plataforma, que configuram no primeiro acesso. Opcional para Administrador (salvo a RN-ACE-24), Professor, Aluno e Responsável. O login com duas etapas tem dois passos: a senha gera um bilhete de 5 minutos, que 5 erros de código invalidam; os erros contam na trava da RN-ACE-10. Um código TOTP não vale duas vezes no mesmo passo.
- **RN-ACE-18.** Ao ativar, a pessoa recebe 10 códigos de reserva de uso único. Sem o celular e sem códigos, abre chamado; o suporte confirma a identidade (documento e dados da organização) antes de desativar. Não existe código por e-mail.
- **RN-ACE-24.** O Coordenador pode exigir duas etapas de todos os Administradores da organização, em Configurações › Dados e segurança › Duas etapas (desligado por padrão). Ligada, o Administrador sem duas etapas configura no próximo login, antes de entrar, como o Coordenador no primeiro acesso, e não pode desligá-la em Minha conta enquanto a exigência valer. Desligar a exigência não desliga as duas etapas de quem já usa. Ligar e desligar vai para a auditoria. (Decisão do dono de 19/11/2026.)

### Sessão

- **RN-ACE-19.** Sessão sem uso expira em 30 dias para contas que só têm vínculos de Aluno ou Responsável e em 12 horas para quem tem algum vínculo de gestão ou do painel da plataforma. O prazo vem dos vínculos da conta, não da área aberta. Não existe "Manter conectado".
- **RN-ACE-20.** Trocar a senha, desativar a conta ou remover o último vínculo de gestão encerra na hora todas as sessões em outros aparelhos. A pessoa recebe e-mail avisando da troca de senha.
- **RN-ACE-21.** Ações críticas pedem a senha de novo (e o código de duas etapas, se ligado), o que gera um token de uso único, válido por 5 minutos e preso à sessão e à ação: transferir coordenação, cancelar assinatura, exportação completa, desconectar o Mercado Pago, anonimizar aluno, desativar unidade. Gerar códigos de reserva novos (RN-ACE-18) não é ação crítica: pede só a sessão.
- **RN-ACE-22.** Login em aparelho novo gera e-mail "Novo acesso à sua conta", com aparelho, cidade aproximada e hora. O primeiro acesso da conta não gera o e-mail; enquanto não houver localizador por IP, a cidade sai como "local não identificado". Cada aparelho gera o e-mail uma vez só: ele fica guardado na conta e os acessos seguintes dele não geram novo aviso, mesmo quando a sessão foi encerrada por outro aparelho (RN-ACE-23).
- **RN-ACE-23.** Uma sessão de gestão ativa por conta, Coordenador incluído. O login na gestão em outro aparelho ou navegador encerra na hora a sessão de gestão anterior da mesma conta; quem estava nela vê "Sua sessão foi encerrada porque esta conta entrou em outro aparelho." e volta ao login. Sessões só do portal (Aluno, Responsável) não entram nessa regra e não são encerradas por ela. O encerramento vai para a auditoria. Regra decidida pelo dono em 19/11/2026, junto com a cobrança por vaga (`16`).
- **RN-ACE-25.** Atividade recente: Minha conta › Segurança mostra os acessos dos últimos 30 dias à conta (até 20 linhas, do mais novo ao mais antigo), com data e hora, aparelho, local aproximado e resultado: "Entrou", "Senha errada", "Código de duas etapas errado", "Conta travada" e "Sessão encerrada por outro aparelho" (RN-ACE-23). Vem das tentativas de acesso e das sessões já gravadas; o IP não aparece inteiro. Uma linha que a pessoa não reconhece tem o atalho "Não fui eu", que leva a trocar a senha. (Decisão do dono de 19/11/2026.)

## Requisitos

- **RF-ACE-01.** Login: e-mail, senha com "Mostrar"/"Ocultar", "Entrar", "Esqueci minha senha". Antes do login aparece o suporte da plataforma; depois, o contato da unidade. O suporte vem da configuração do ambiente.
- **RF-ACE-02.** Criar senha pelo convite: nome e e-mail já preenchidos, validade do convite, exigências da senha marcadas enquanto digita, "Criar senha e entrar" só habilitado com a senha válida e igual nos dois campos. Quem já tem conta informa só a senha atual. Convite vencido, usado ou cancelado explica e orienta pedir outro.
- **RF-ACE-03.** Recuperação de senha (RN-ACE-11, RN-ACE-14) e tela de nova senha com as mesmas exigências. A resposta ao pedido é a mesma para qualquer e-mail. A validade do link só aparece ao enviar a nova senha. Depois de criar, a pessoa entra direto.
- **RF-ACE-04.** Minha conta (gestão e portal), em abas com conteúdo, não um cartão por aba (alterado em 19/11/2026):
  - **Perfil:** foto (JPG, PNG ou WebP, cortada em quadrado, 512 px; aparece no avatar do topo no lugar das iniciais), nome e telefone/WhatsApp da conta, que valem em todas as organizações da conta. Abaixo, **Meus vínculos**: cada organização com o papel, as unidades (Administrador e Professor), os alunos ligados (Responsável) e a data de início, e o atalho para trocar de organização ou área (RF-ACE-05). Os vínculos só são mostrados: a pessoa não encerra o próprio vínculo por aqui. No portal, o Perfil mostra só Meus vínculos; os dados pessoais do aluno ficam em Minhas informações (RF-POR-07).
  - **Segurança:** e-mail e senha, com "Trocar e-mail" e "Trocar senha" e a data da última troca de senha (a troca de e-mail exige senha e código; senha atual errada conta na trava da RN-ACE-10); duas etapas: situação, "Ativar", "Trocar de aparelho" (configura um app novo, com senha e código atual, e invalida o anterior), quantos códigos de reserva restam ("7 de 10"), "Ver códigos de reserva novos" (gerados ao abrir, só com a sessão: sem senha nem código) e "Desligar" só quando o perfil permite (RN-ACE-17 e RN-ACE-24); sessões ativas com "Encerrar" e "Encerrar todas as outras" (a sessão atual não se encerra pela lista); e **Atividade recente** (RN-ACE-25).
  - **Notificações:** o sino da gestão e os e-mails que a pessoa pode ligar e desligar, mais a linha "Sempre enviamos: avisos de segurança da conta e da assinatura", que não se desliga.
  - **Privacidade:** "Baixar meus dados" para qualquer conta (RF-LGP-01) e, no portal, "Excluir minha conta" (RF-LGP-02).
  - Quem tem vínculo de Professor tem também a aba **Perfil de professor** (RF-PRO-05).
- **RF-ACE-05.** Modal de escolha de organização e área (RN-ACE-03). A área vem do papel do vínculo: gestão para Coordenador, Administrador e Professor; portal para Aluno e Responsável. Depois do login com mais de um vínculo o modal é obrigatório; reaberto pelo menu, pode ser fechado.
- **RF-ACE-06.** Pessoas › Administradores (só o Coordenador): lista dos Administradores com nome, unidades, último acesso, situação e o custo de cada um (R$ 50 por unidade, RN-ASS-21); convidar, reenviar convite, alterar unidades e desativar. Convidar, ou incluir uma unidade, mostra antes de confirmar quanto a próxima fatura sobe ("+R$ 50/mês por unidade"); tirar uma unidade ou desativar mostra que não há devolução no ciclo (RN-ASS-23). "Desativar" encerra o vínculo, não a conta. Substitui a antiga tela Configurações › Usuários (alteração de 19/11/2026): o acesso dos Professores passa a ser gerido só em Pessoas › Professores (RF-PRO-02), e o atalho para a tabela de permissões fica na aba Permissões do Professor da unidade (RF-ORG-04).
- **RF-ACE-07.** Atualizar o último acesso a cada login.
- **RF-ACE-08.** Tela "Esta área não está disponível para o seu perfil", com atalhos para o Início, quando alguém abre um endereço fora do seu alcance. A tela aparece no mesmo endereço, sem redirecionar, e não diz qual área ou recurso foi negado.
- **RF-ACE-09.** Tabela de permissões (consulta, sem edição de perfis), aberta pela aba Permissões do Professor da unidade: as linhas agrupadas por área (Alunos, Financeiro, Operação, Comunicação, Pessoas, Configurações), e no lugar dos símbolos, selos com texto: "Tudo", "Só consulta", "Nas suas unidades", "Nas turmas dele" e "Não acessa". As linhas do Professor que dependem de uma chave mostram o estado da chave na unidade aberta ("Ligada nesta unidade" ou "Desligada nesta unidade"), com o link para a aba Permissões do Professor. (Decisão do dono de 19/11/2026.)

## Permissões

`●` pode · `○` só consulta · `—` não acessa · `U` só nas suas unidades · `T` só nas suas turmas · `*` depende da permissão da unidade

| Área / ação | Coordenador | Administrador | Professor |
| --- | --- | --- | --- |
| Início da unidade | ● | U | T |
| "Todas as unidades" (consolidado) | ○ | — | — |
| Alunos: lista simples (nome e ativo ou bloqueado na modalidade) | ● | U | T (sempre, sem chave) |
| Alunos: abrir a ficha | ● | U | T* (ver ficha do aluno; sem valores, plano, benefício, CPF, endereço nem situação financeira) |
| Alunos: contatos e emergência | ● | U | T* (ver contatos) |
| Alunos: cadastrar, editar, matricular, encerrar | ● | U | — |
| Benefícios | ● | U | — |
| Planos e resumo de benefícios (unidade fora do alcance: vazio, não erro) | ● | U | — |
| Cobranças e pagamentos | ● | U | — |
| Estorno, renegociação, cancelar cobrança | ● | U | — |
| Turmas: ver lista e painel, criar, editar e desativar | ● | U | — |
| Agenda: ver | ● | U | T |
| Agenda: editar e cancelar aula | ● | U | T* |
| Dias sem aula | ● (várias unidades de uma vez) | U | — |
| Graduação: registrar | ● | U | — (consulta T) |
| Comunicados | ● (todas as unidades) | U | T* |
| Aulas experimentais | ● | U | T* (ver) |
| Professores | ● | U | — |
| Administradores (Pessoas › Administradores) | ● | — | — |
| Configurações da unidade | ● | U | — |
| Configurações da organização | ● | ○ | — |
| Unidades | ● | — | — |
| Assinatura e faturas | ● | faixa de aviso | — |
| Auditoria | ● | U | — |
| Relatórios | ● (consolidado) | U | o próprio resumo |
| Exportar listas | ● | U | — |
| Exportação completa | ● | — | — |
| Importar | ● | U | — |
| Liberar acesso de suporte | ● | — | — |
| Exigir duas etapas dos Administradores | ● | — | — |

Permissões do Professor por unidade, ligadas ou desligadas pelo Administrador da unidade: **enviar comunicado**, **editar e cancelar aulas**, **ver contatos** e **ver aulas experimentais** (as quatro ligadas por padrão) e **ver ficha do aluno** (desligada por padrão). Ligada, o Professor abre a ficha dos alunos das suas turmas; desligada, não abre a ficha, mas continua vendo os alunos da turma ou da aula como lista simples, e isso não depende de chave. Contatos e emergência continuam sendo a chave própria "ver contatos", também na ficha.

O Professor nunca vê valores em reais, plano, benefício, CPF, endereço nem situação financeira, nem na ficha. Na lista simples vê o nome e se o aluno está ativo ou bloqueado na modalidade (nas telas do Início, também foto e faixa, RF-INI-03). A lista simples só passa a existir com a matrícula (Sprint 07), dentro da turma e da aula. Ele não tem lista nem painel de turma (ver `06`): vê os alunos pela agenda, pela aula e pelo Início.

## Pronto quando

- Um usuário de Professor não encontra nenhum valor em reais em nenhuma tela, busca ou resposta da API.
- Com "ver ficha do aluno" desligada na unidade, o Professor não abre a ficha (a API recusa) e continua vendo a lista simples dos alunos das suas turmas.
- Tentar abrir uma rota fora do perfil pelo endereço ou pela API é recusado no servidor.
- Coordenador sem duas etapas não passa do primeiro acesso sem configurar.
- Trocar a senha derruba as outras sessões no mesmo minuto (teste ponta a ponta).
- Entrar na gestão num segundo aparelho encerra a sessão de gestão do primeiro, e uma sessão do portal da mesma conta continua aberta.
- A mensagem de erro do login é idêntica para e-mail inexistente e senha errada.
