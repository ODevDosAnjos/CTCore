# Decisões do dono sobre a auditoria do canvas

Origem: `auditoria-canvas-sprint-10.5.md` (rodadas 1 e 2). Registradas em 30/10/2026. Valem para a Sprint 10.5 e, pela regra do `AGENTS.md`, para as sprints seguintes.

## Escopo

- **Telas já construídas:** todas ajustadas ao canvas na Sprint 10.5.
- **Telas que ainda não existem no repositório:** feitas na sprint delas, seguindo a especificação e o canvas.
- **Telas que não existem nem no canvas:** feitas na sprint delas, seguindo a especificação e os componentes base padronizados na 10.5.

## Regras gerais

- **R1.** O canvas é o contrato das telas já construídas: em layout, textos, rótulos, botões, janelas e confirmações, o canvas vence.
- **R2.** Se a tela só fica igual ao canvas mudando a API, a API muda, desde que não contrarie uma regra da especificação. (Pelo `AGENTS.md`, mudou regra, muda primeiro a especificação; o contrato em `docs/openapi.yaml` e o MSW mudam junto.)
- **R3.** Itens do canvas que pertencem a sprints futuras entram agora na tela, visíveis e desabilitados com "Em breve", sem backend. A funcionalidade chega na sprint dela.
- **R4.** Quando o canvas contradiz uma regra de negócio da especificação, a especificação vence na regra e o canvas vence no visual. O visual do canvas é adaptado à regra.

## Decisões pontuais e como foram aplicadas

1. **Prazo dos pedidos do portal:** vale a especificação. RN-MAT-16: pedidos de troca de turma, nova modalidade e troca de plano expiram em 30 dias sem resposta. RN-MAT-18: encerramento tem 7 dias para a gestão conversar e encerra sozinho no 8º dia. A tela mostra "expira em N dias" com o prazo de cada tipo; o texto geral do canvas ("expiram em 30 dias") fica restrito aos três primeiros tipos.
2. **Portal reduzido:** RN-INA-08 e RN-POR-08 mandam mostrar cobranças em aberto com "Pagar", histórico financeiro, recibos, dados da conta, contato da unidade e a carteirinha com selo "Inativo"; Agenda, avisos e graduação ficam ocultos. **Escolha de layout:** as mesmas duas áreas em desktop e celular, "Financeiro" e "Minhas informações" (com carteirinha, dados da conta e o cartão "Fale com a academia"), sem Agenda nem Avisos nas abas. Motivo: o canvas do desktop (2 abas) já está de acordo com a regra e o do celular (5 abas) a contradiz (R4); usar o mesmo conjunto nos dois evita que o aluno inativo veja abas que levam a telas vazias.
3. **Gerar códigos de reserva:** segue o canvas (mostra os códigos novos direto). A especificação não exige confirmar com senha e código ao gerar: RF-ACE-04 só cita "ver códigos de reserva novos", RN-ACE-18 trata da entrega na ativação e RN-ACE-21 lista as ações críticas (transferir coordenação, cancelar assinatura, exportação completa, desconectar o Mercado Pago, anonimizar aluno, desativar unidade) sem incluir esta. **Aviso:** hoje o sistema pede senha e código antes de gerar; a remoção dessa confirmação muda o comportamento da API.
4. **Duas etapas:** mantida a regra RN-ACE-17 (TOTP por app autenticador; obrigatória para Coordenador e equipe da plataforma, que configuram no primeiro acesso; opcional para os demais). A especificação não prevê adiar para o Coordenador: ele não tem "Agora não" na janela de ativação; o botão existe só para os perfis opcionais.
5. **Taxas por meio de pagamento:** mantido o modelo do sistema (valor fixo em R$ por meio, 9 meios). Entra do canvas a prévia do total para um valor de exemplo, que o RF-PAG-01 já pede.
6. **Vencimento da primeira cobrança:** vale a especificação (RN-MAT-05: primeiro mês cheio, vence no dia da matrícula, com 5 dias de tolerância antes de contar como atraso; RN-MAT-07: segundo vencimento sugerido a pelo menos 15 dias da matrícula, ajustável de 15 a 60), com a apresentação do canvas.
7. **Etapa 1 da matrícula:** vale a especificação (RF-MAT-01 e RN-ALU-06: busca por CPF; se existir, confirma nome e foto), com a apresentação do canvas o mais próxima possível: um só cartão com CPF e "Buscar" no alto e o restante do cadastro (nascimento com idade e faixa, endereço, responsáveis, foto, "Como conheceu", emergência) logo abaixo, e o aviso de duplicidade no mesmo lugar do canvas.
8. **Menu "⋯" da ficha:** não está no canvas nem na especificação. Não inventar: o botão aparece desabilitado com "Em breve". O botão "Cobrar" (RF-ALU-03) abre a nova cobrança avulsa já com o aluno.
9. **"Receber tudo" das notificações:** fica em **Minha conta › Notificações** (card "Sino da gestão", como no canvas) e sai do painel do sino. Motivo: R1, o canvas põe a preferência em Minha conta e o sino do canvas só tem lista e "Marcar todas como lidas"; RN-NOT-03 diz que é preferência por vínculo que só o Coordenador muda, o que combina com um lugar de configuração, não com um atalho no painel. A chave só aparece para o Coordenador. "Resumo diário por e-mail" e "E-mails de boas-vindas" do canvas entram desabilitados com "Em breve" (R3).
10. **Telas que ainda não existem (ex.: experimentais, graduações, relatórios):** ficam para a sprint delas.
11. **Professor chegando à ficha do aluno:** pela **aula** (painel da aula, lista simples de alunos) e, na Sprint 13, pelo **Início** do Professor (RF-INI-03). Motivo: a especificação (`02-contas-e-acesso.md`, seção do Professor) diz que ele não tem lista nem painel de turma e que "vê os alunos pela agenda, pela aula e pelo Início"; a turma, portanto, fica de fora. Continua valendo RF-ALU-03: só os alunos das suas turmas e só com a permissão "ver ficha do aluno" (desligada por padrão); a ficha dele omite valores, plano, benefício, CPF, endereço e situação financeira.

## Correções feitas no relatório (passo A)

- Resumo: a rodada 1 tinha 2 altas (A1 e A2); a tabela agora mostra isso.
- B10 estava vazia (era a lista de "telas não construídas" lida como achado); removida, mantendo a numeração dos demais.
- M36 (Início da gestão): média e fora da 10.5, prevista nas #122 a #124 (Sprint 13); a frase "alta para alta" saiu.
- A menção "alta" de PermissoesTabela em "sem comparar" foi trocada por média (M24).
- Reclassificadas como **alta** pelo dono: B14, M7, M123, M153 e M135. Os IDs foram mantidos; as entradas passaram para a seção de gravidade alta.
- M85 (agenda do Professor mostra todas as aulas): **é só o mock**. O back-end filtra (`Agenda.java`, filtro `mine` para o papel Professor) e RN-AGE-07 e a tabela de permissões (`Agenda: ver · Professor T`) mandam mostrar só as turmas dele; o handler do MSW não filtra. Vira correção do MSW, não de regra.

## Decisões de 30/10/2026 sobre os pontos pendentes e a revisão do plano

12. **Retenção das notificações: aprovada.** A notificação do sino é apagada 30 dias depois de criada, lida ou não, por limpeza diária; o painel mostra "As notificações somem depois de 30 dias". Registrada na especificação como **RN-NOT-05** (`docs/especificacao/13-comunicacao-e-notificacoes.md`) e no RF-NOT-01. O plano ganha uma issue para implementar (limpeza no back-end e rodapé no painel).
13. **Renegociar várias cobranças: não aprovado agora.** Vale a especificação: uma cobrança por vez, até 6 parcelas (RN-COB-09). A janela de renegociar segue o visual do canvas adaptado a essa regra (uma cobrança, sem seleção múltipla). **Melhoria futura:** "renegociar várias cobranças de uma vez"; precisa entrar antes na especificação (rateio do valor, vencimento de cada parcela, efeito no bloqueio por atraso, RN-INA-01), e só depois no contrato e na tela.
14. **Passo F: aprovado.** Cobranças e Comunicados estavam escondidos no menu por esquecimento; a issue F1-01 do plano os liga.
15. **Itens altos.** A **M7** ganha issue própria na Fase 1: o botão "Ver alunos" do painel da turma está sempre desabilitado (`ClassPanelPage.tsx:61-63`); passa a abrir a lista de Alunos filtrada pela turma (o filtro `classId` já existe em `StudentsPage.tsx`). A **A2** (Dias sem aula sem "Ignorar") volta para **média** e fica só na issue O3.
16. **Migração dos componentes.** A issue de componente cria o componente e o aplica em uma ou duas telas como piloto (onde o componente já é compartilhado, a mudança se espalha sozinha); cada issue de tela troca o que a tela usa pelo componente novo e confere com o canvas.
17. **Issues técnicas** (sem a etiqueta "entrega 1 · produto"): (a) captura do teste visual com o navegador em pt-BR, antes da Fase 2; (b) dados do MSW para as telas que ficaram "sem comparar". A correção do MSW da agenda do Professor (F1-06) também é técnica.
18. **Prints de referência.** Cada PR de tela regera só os prints de referência da própria tela, depois da comparação com o canvas. A captura para comparar com o canvas usa o navegador em pt-BR.

## Decisões de 19/11/2026: Configurações, marca, menu lateral, rolagem, Minha conta, modalidades, permissões e termo

Valem sobre o canvas nos pontos que tratam (o resto do layout do canvas continua valendo, R1). Nenhum agente deve "corrigir" de volta para o canvas.

19. **Configurações em quatro itens com abas (#625).** O grupo Configurações do menu passa a ter Organização (abas Geral, Modalidades, Faixas etárias, Termos, Textos), Unidades (lista; cada unidade com Dados, Cobrança, Lembretes, Divulgação, Permissões do Professor), Assinatura e Dados e segurança (Auditoria, Importar e exportar, Acesso do suporte, Duas etapas). Some o item "Unidade" separado do `Sidebar.dc.html` e do `GMConfig.dc.html`. "Usuários" vira Pessoas › Administradores (#611). Regras: RF-ORG-01, RF-ORG-02, RF-ORG-04 e RF-ORG-09.
20. **Sem cor da organização (#626).** A marca da academia é só nome e logo (RNF-22). Onde o canvas mostra a cor da academia (`ConfigAcademia`, `ConfigOrgContraste`, barra e telas do portal, carteirinha), vale a identidade do ctcore.
21. **Dados novos (#627).** Organização com site e redes sociais; unidade com fotos, horário de funcionamento, apresentação e Instagram. Entram nas abas Geral e Dados, embora o canvas não os mostre.
22. **Duas etapas dos Administradores (#628).** Aba Duas etapas em Dados e segurança (RN-ACE-24), sem canvas.
23. **Menu lateral (#624).** Corrige a divergência com o `Sidebar.dc.html` (subitens sem ícone; recolhido só com os ícones dos grupos) e acrescenta: no recolhido, clicar no ícone do grupo abre um painel flutuante com os subitens; um grupo aberto por vez; barra de rolagem discreta, sem a padrão do sistema.
24. **Minha conta em abas com conteúdo (#630, #631, #632).** No lugar da página única do `MinhaConta.dc.html` (e das quatro abas de um cartão cada da construção), as abas Perfil (foto, nome, telefone, Meus vínculos), Segurança (acesso, duas etapas, sessões e atividade recente), Notificações e Privacidade, mais Perfil de professor para quem é Professor. Os cartões do canvas continuam valendo dentro das abas. Regras: RF-ACE-04, RN-ACE-25, RF-PRO-05, RF-LGP-01.
25. **Rolagem em todo o sistema (#624).** A barra de rolagem padrão do sistema operacional não aparece em nenhuma tela: barra fina nos tokens do tema, sem setas, visível ao passar o mouse ou rolar; onde não há o que rolar, não há barra.
26. **Modalidades e graduação (#633).** Cartões com unidades, turmas e alunos, "Desativar" no menu "⋯" e selo de graduação só quando ligada; janela de graduação sem níveis nem comprovante quando desligada; editor de níveis agrupado por faixa etária, com a sequência de cores e linhas compactas; modalidades da unidade em grade com turmas e planos. Prevalece sobre `ConfigModalidades`, `ConfigUnidade` e as janelas de graduação do canvas nesses pontos. Regras: RF-MOD-01 a RF-MOD-03.
27. **Tabela de permissões (#634).** Selos com texto no lugar dos símbolos, linhas por área e o estado das chaves da unidade; aberta pela aba Permissões do Professor. Regra: RF-ACE-09.
28. **"Vale para todas as unidades" (#635).** Cada aba da unidade mostra, só para leitura, as regras da organização que a afetam. Regra: RF-ORG-04.
29. **Termo com dados da unidade (#636).** Um termo só por organização, com campos automáticos da unidade (nome, razão social, CNPJ e endereço). Regra: RN-MAT-21.

## Decisões de 20/11/2026: padrões gerais de tela e ajustes das anotações de teste do dono

33. **Padrões gerais (RNF-43 a RNF-54; #643, #645 a #650).** Valem em toda tela, construída ou não, e prevalecem sobre o canvas onde ele mostra o contrário: sem recarregar a página ao navegar; avisos no canto inferior, carregamento e transições; cabeçalho sem subtítulo de unidade, contagens soltas ou regra interna (o canvas tem vários desses subtítulos: não reproduzir); quem faz é a pessoa logada, sem "Decidido por"; motivos em lista com "Outro"; campos de valor, percentual e número com máscara e limites; campos dependentes e validação só depois de usar; listas com filtros múltiplos num botão, atalhos de período, mais recentes primeiro, ações em "⋯", tabela com contraste e vazio só quando não há nada; ficar na tela depois da ação; agendamentos com limites; nomes de turma e plano gerados.
34. **Ajustes de domínio (#651 a #661 e #122 a #124).** Vencimento único por unidade e geração no dia 1º, sem gerar meses futuros (RN-COB-01, RN-COB-02, RN-MAT-22); Cobranças com "Criado por", painel em ordem fixa e recibo funcionando; Planos só com planos e nome gerado (RN-PLA-07); Benefícios sem "benefício alto", sem "desconto de professor", com edição no lugar de substituir; Agenda de domingo a sábado; turmas com nome gerado, variação e capacidade de 1 a 30; "Feriados e recessos" com feriados automáticos; comunicado numa tela só, com destino do mais amplo ao mais restrito e tipos "Aula avulsa" e "Outro"; matrícula sem etapa de vencimento, com CPF automático, retomada na etapa e faixa etária da turma obrigatória; professor com CPF e endereço opcionais e edição no padrão da ficha; aprovar pedido sem sair da tela; Início trazido para a 10.5 com "Em breve" no que depende de sprint futura. Onde o canvas mostra o contrário (nome digitado, "Gerar próximas mensalidades", etapa de vencimento, "Benefícios altos", semana começando na segunda, "Confirmar" feriado), vale esta decisão.
