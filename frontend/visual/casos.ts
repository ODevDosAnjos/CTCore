// Casos do teste visual (#416). Cada issue de tela da Sprint 10.5 acrescenta os seus.
// `perfil`: e-mail do login do MSW (senha segredo123); ausente = sem login.
// `canvas`: nome da tela em docs/design/canvas (sem .dc.html); `canvasEscuro`: versão escura, quando existe.
// D4 (#419): passos antes do print, para chegar a janelas e estados. `preencher`: [rótulo exato, valor]; `clicar`: início do nome do botão.
// seExistir: o botão só aparece em parte das larguras (ex.: "Filtros" abaixo de 640 px)
export type Passo = { preencher: [string, string] } | { clicar: string, seExistir?: boolean, papel?: "tab" };
export type Caso = {
  nome: string;
  rota: string;
  perfil?: string;
  canvas?: string;
  canvasEscuro?: string;
  canvasCelular?: string; // tela do canvas feita para 390 px (comparada com a referência 390 do caso)
  limiteCanvas?: { valor: number; motivo: string }; // limite de diferença do caso, no lugar do padrão (#435)
  fullPage?: boolean;
  matricula?: boolean; // #443: antes do print, matricula o aluno fictício na turma do Professor (o MSW começa sem matrículas)
  passos?: Passo[];
  aguardar?: string; // seletor do conteúdo final da janela aberta pelos passos (ex.: o QR); o print só sai com ele presente
};

const ana = "ana@exemplo.com"; // Coordenador, todas as áreas
const admin = "admin@exemplo.com"; // Administrador
const prof = "prof@exemplo.com"; // Professor
const aluno = "aluno@exemplo.com"; // Aluno adulto, portal completo
const familia = "familia@exemplo.com"; // Responsável com dois filhos
const reduzido = "reduzido@exemplo.com"; // Aluno sem modalidade ativa, portal reduzido

export const casos: Caso[] = [
  { nome: "vitrine", rota: "/dev/vitrine", fullPage: true },
  { nome: "entrar", rota: "/entrar", canvas: "Login", canvasCelular: "LoginM" },
  { nome: "inicio", rota: "/", perfil: ana, canvas: "Main", canvasEscuro: "MainEscuro" },
  // Moldura da gestão (#417): menu, barra de cima, abas e menu de celular por perfil
  { nome: "moldura-coordenacao", rota: "/alunos", perfil: ana, canvas: "Sidebar" },
  { nome: "moldura-administrador", rota: "/alunos", perfil: admin, canvas: "Topbar" },
  { nome: "moldura-professor", rota: "/agenda", perfil: prof, canvas: "GMMenu" },
  // #454: no celular o menu em tela cheia e a folha de unidade; a 1440 px o mesmo passo abre o menu da conta e a lista de unidade (o canvas é de 360 px, sem comparação automática)
  { nome: "moldura-celular-menu", rota: "/alunos", perfil: ana, canvas: "GMMenu", passos: [{ clicar: "Menu" }] },
  { nome: "moldura-celular-unidade", rota: "/alunos", perfil: ana, canvas: "GMUnidade", passos: [{ clicar: "Unidade ativa" }] },
  // Moldura do portal (#418): barra com a marca, abas, sino, rodapé e faixa de acesso reduzido; a 390 px, barra de cima e abas embaixo
  { nome: "portal-aluno", rota: "/", perfil: aluno, canvas: "PortalInicio", canvasCelular: "PortalMInicio" },
  { nome: "portal-responsavel", rota: "/portal/financeiro", perfil: familia, canvas: "PortalNav" },
  { nome: "portal-reduzido", rota: "/", perfil: reduzido, canvas: "PortalReduzido" },
  { nome: "portal-celular-topo", rota: "/portal/minhas-informacoes", perfil: aluno, canvas: "PortalMTopo" },
  { nome: "portal-celular-abas", rota: "/portal/agenda", perfil: familia, canvas: "PortalMTabs" },
  { nome: "portal-celular-reduzido", rota: "/portal/financeiro", perfil: reduzido, canvas: "PortalMReduzido" },
  // Páginas do portal do aluno e do responsável (#423). Janelas e estados que o MSW não alcança (comprovante com envio, pedidos por id gerado) ficam sem caso (D2).
  { nome: "portal-inicio-responsavel", rota: "/", perfil: familia, canvas: "PortalResponsavel", canvasCelular: "PortalMResponsavel" },
  { nome: "portal-termo", rota: "/portal/termo", perfil: aluno, canvas: "PortalTermo", canvasCelular: "PortalMTermo" },
  { nome: "portal-termo-filhos", rota: "/portal/termo", perfil: familia, canvas: "PortalTermoFilhos" },
  { nome: "portal-agenda", rota: "/portal/agenda", perfil: aluno, canvas: "PortalAgenda", canvasCelular: "PortalMAgenda" },
  { nome: "portal-avisos", rota: "/portal/avisos", perfil: aluno, canvas: "PortalAvisos", canvasCelular: "PortalMAvisos" },
  { nome: "portal-financeiro", rota: "/portal/financeiro", perfil: aluno, canvas: "PortalFinanceiro", canvasCelular: "PortalMFinanceiro" },
  { nome: "portal-informacoes", rota: "/portal/minhas-informacoes", perfil: aluno, canvas: "PortalInfo", canvasCelular: "PortalMInfo" },
  { nome: "portal-carteirinha", rota: "/portal/carteirinha", perfil: aluno, canvas: "PortalCarteirinha", canvasCelular: "PortalMCarteirinhaOk", limiteCanvas: { valor: 0.5, motivo: "celular: sistema e canvas diferem na carteirinha a 390 px (medido na #435; a #499 trata a tela e remove esta exceção)" } },
  { nome: "portal-carteirinha-filhos", rota: "/portal/carteirinha", perfil: familia, canvas: "PortalCarteirinhaFilhos" },
  { nome: "portal-pedidos", rota: "/portal/pedidos", perfil: aluno, canvas: "PortalPedidos", canvasCelular: "PortalMPedidos" },
  { nome: "alunos", rota: "/alunos", perfil: ana, canvas: "Alunos" },
  { nome: "alunos-filtros", rota: "/alunos", perfil: ana, canvas: "GMAlunosFiltros", passos: [{ clicar: "Filtros", seExistir: true }] }, // #457: folha de filtros do celular (no 1440 os filtros ficam na linha)
  { nome: "professores", rota: "/professores", perfil: ana, canvas: "Professores" },
  { nome: "agenda", rota: "/agenda", perfil: ana, canvas: "Agenda" },
  { nome: "dias-sem-aula", rota: "/dias-sem-aula", perfil: ana, canvas: "DiasSemAula" },
  { nome: "turmas", rota: "/turmas", perfil: ana, canvas: "Turmas" },
  { nome: "planos", rota: "/planos", perfil: ana, canvas: "Planos" },
  { nome: "beneficios", rota: "/beneficios", perfil: ana, canvas: "BeneficiosLista" },
  { nome: "cobrancas", rota: "/cobrancas", perfil: ana, canvas: "Mensalidades", canvasEscuro: "CobrancasEscuro" },
  { nome: "cobrancas-atrasados", rota: "/cobrancas/atrasados", perfil: ana, canvas: "Atrasados" },
  { nome: "cobrancas-conferencia", rota: "/cobrancas/conferencia", perfil: ana, canvas: "EmConferencia" },
  { nome: "cobrancas-recebimentos", rota: "/cobrancas/recebimentos", perfil: ana, canvas: "RecebimentosDia" },
  { nome: "cobrancas-previa", rota: "/cobrancas/previa", perfil: ana, canvas: "Fechamento" },
  { nome: "pedidos", rota: "/pedidos", perfil: ana, canvas: "PedidosPortal" },
  { nome: "comunicados", rota: "/comunicados", perfil: ana, canvas: "Comunicados" },
  { nome: "comunicados-novo", rota: "/comunicados/novo", perfil: ana, canvas: "ComunicadoNovo" },
  { nome: "configuracoes-organizacao", rota: "/configuracoes/organizacao", perfil: ana, canvas: "ConfigAcademia" },
  { nome: "configuracoes-unidades", rota: "/configuracoes/unidades", perfil: ana, canvas: "ConfigUnidades" },
  { nome: "configuracoes-unidade", rota: "/configuracoes/unidade", perfil: ana, canvas: "ConfigUnidade" },
  { nome: "configuracoes-modalidades", rota: "/configuracoes/modalidades", perfil: ana, canvas: "ConfigModalidades" },
  { nome: "configuracoes-faixas-etarias", rota: "/configuracoes/faixas-etarias", perfil: ana, canvas: "ConfigFaixas" },
  { nome: "configuracoes-usuarios", rota: "/configuracoes/usuarios", perfil: ana, canvas: "ConfigUsuarios" },
  { nome: "configuracoes-termos", rota: "/configuracoes/termos", perfil: ana, canvas: "ConfigTermos" },
  { nome: "configuracoes-textos", rota: "/configuracoes/textos", perfil: ana, canvas: "ConfigTextos" },
  { nome: "conta", rota: "/conta", perfil: ana, canvas: "MinhaConta" },
  // Acesso, conta, organização, unidades e usuários (#419). Estados e janelas abrem pelos passos.
  // Fora: EscolhaOrganizacao/EscolhaOrgM (o login simulado já entra com o vínculo ativo) e UnidadeUnica (o MSW tem mais de uma unidade).
  { nome: "login-travado", rota: "/entrar", canvas: "LoginTravado", canvasCelular: "LoginTravadoM", passos: [{ preencher: ["E-mail", "limite@exemplo.com"] }, { preencher: ["Senha", "segredo123"] }, { clicar: "Entrar" }] },
  { nome: "login-duas-etapas", rota: "/entrar", canvas: "LoginDuasEtapas", passos: [{ preencher: ["E-mail", "duas@exemplo.com"] }, { preencher: ["Senha", "segredo123"] }, { clicar: "Entrar" }, { preencher: ["Código do app", "482"] }] },
  {
    nome: "login-codigo-reserva",
    rota: "/entrar",
    canvas: "LoginCodigoReserva",
    passos: [{ preencher: ["E-mail", "duas@exemplo.com"] }, { preencher: ["Senha", "segredo123"] }, { clicar: "Entrar" }, { clicar: "Usar um código de reserva" }],
  },
  { nome: "esqueci-senha", rota: "/esqueci-senha", canvas: "RecuperarSenha" },
  { nome: "esqueci-senha-enviado", rota: "/esqueci-senha", canvas: "RecuperarSenha", passos: [{ preencher: ["E-mail", ana] }, { clicar: "Enviar link" }] },
  { nome: "redefinir-senha", rota: "/redefinir-senha/valido", canvas: "NovaSenha" },
  {
    nome: "redefinir-senha-vencida",
    rota: "/redefinir-senha/vencido",
    canvas: "LinkSenhaVencido",
    passos: [{ preencher: ["Senha", "Senhaforte1"] }, { preencher: ["Confirmar senha", "Senhaforte1"] }, { clicar: "Criar senha e entrar" }],
  },
  { nome: "convite", rota: "/convite/valido", canvas: "PrimeiroAcesso" },
  { nome: "convite-conta-existente", rota: "/convite/existente", canvas: "PrimeiroAcessoConta" },
  { nome: "convite-vencido", rota: "/convite/vencido", canvas: "ConviteVencido" },
  { nome: "sem-acesso", rota: "/configuracoes/usuarios", perfil: prof, canvas: "EstadoSemAcesso", canvasCelular: "SemAcessoM" },
  { nome: "conta-aluno", rota: "/conta", perfil: aluno, canvas: "PortalTrocarEmail", limiteCanvas: { valor: 0.80, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #498 trata a tela e remove esta exceção)" } },
  { nome: "conta-duas-etapas", rota: "/conta", perfil: ana, canvas: "DuasEtapas", passos: [{ clicar: "Ativar duas etapas" }], aguardar: '[role="dialog"] img', limiteCanvas: { valor: 0.70, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #490 trata a tela e remove esta exceção)" } },
  { nome: "conta-codigos-reserva", rota: "/conta", perfil: "duas@exemplo.com", canvas: "CodigosReserva", passos: [{ clicar: "Gerar códigos de reserva novos" }], aguardar: '[role="dialog"] ul li:nth-child(10)', limiteCanvas: { valor: 0.75, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #490 trata a tela e remove esta exceção)" } },
  { nome: "configuracoes-organizacao-contraste", rota: "/configuracoes/organizacao", perfil: ana, canvas: "ConfigOrgContraste", passos: [{ preencher: ["Cor principal (#RRGGBB)", "#F5E663"] }] },
  { nome: "configuracoes-transferir-coordenacao", rota: "/configuracoes/organizacao", perfil: ana, canvas: "TransferirCoordenacao", passos: [{ clicar: "Transferir coordenação" }], limiteCanvas: { valor: 0.70, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #482 trata a tela e remove esta exceção)" } },
  { nome: "configuracoes-unidade-nova", rota: "/configuracoes/unidades/nova", perfil: ana, canvas: "UnidadeNova" },
  { nome: "configuracoes-unidade-desativar", rota: "/configuracoes/unidades", perfil: ana, canvas: "UnidadeDesativar", passos: [{ clicar: "Desativar" }], limiteCanvas: { valor: 0.70, motivo: "janela ou fundo: o canvas traz a linha cobrança em conferência e a confirmação por DESATIVAR, que exigem regra nova (medido a 62,2% na #462; a #484 trata a tela e remove esta exceção)" } },
  { nome: "configuracoes-unidade-professor", rota: "/configuracoes/unidade", perfil: ana, canvas: "ConfigPermProf", fullPage: true },
  { nome: "configuracoes-usuario-convidar", rota: "/configuracoes/usuarios", perfil: ana, canvas: "UsuarioConvidar", passos: [{ clicar: "Convidar" }], limiteCanvas: { valor: 0.70, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #487 trata a tela e remove esta exceção)" } },
  // Modalidades, faixas, professores, turmas, agenda e dias sem aula (#420). Janelas abrem pelos passos.
  // Sem caso: painel da aula, editar, cancelar e corrigir aula (o id da aula é gerado pelo MSW, sem rota fixa); GM* são as mesmas telas a 390 px (D1).
  { nome: "configuracoes-modalidades-administrador", rota: "/configuracoes/modalidades", perfil: admin, canvas: "ConfigModalidadesAdmin" },
  { nome: "configuracoes-modalidades-graduacao", rota: "/configuracoes/modalidades", perfil: ana, canvas: "ModalidadeGraduacao", passos: [{ clicar: "Ativar" }, { clicar: "Graduação" }], limiteCanvas: { valor: 0.70, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #485 trata a tela e remove esta exceção)" } },
  { nome: "configuracoes-modalidades-pedido", rota: "/configuracoes/modalidades", perfil: ana, canvas: "ModalidadesOferecidasRecusa", passos: [{ clicar: "Não achei minha modalidade" }], limiteCanvas: { valor: 0.80, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #485 trata a tela e remove esta exceção)" } },
  { nome: "configuracoes-faixa-nova", rota: "/configuracoes/faixas-etarias", perfil: ana, canvas: "ConfigFaixas", passos: [{ clicar: "Nova faixa" }], limiteCanvas: { valor: 0.80, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #486 trata a tela e remove esta exceção)" } },
  { nome: "professor-novo", rota: "/professores", perfil: ana, canvas: "ProfessorNovo", passos: [{ clicar: "Novo professor" }], limiteCanvas: { valor: 0.60, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #470 trata a tela e remove esta exceção)" } },
  { nome: "professor-painel", rota: "/professores/00000000-0000-0000-0000-000000000502", perfil: ana, canvas: "ProfessorPainel", limiteCanvas: { valor: 0.45, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #470 trata a tela e remove esta exceção)" } },
  { nome: "professor-inativar", rota: "/professores/00000000-0000-0000-0000-000000000502", perfil: ana, canvas: "ProfessorInativar", passos: [{ clicar: "Inativar" }], limiteCanvas: { valor: 0.70, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela; o canvas traz escolha de novo titular e Motivo, que exigem API e regra nova (divergência medida na #435; a #470 trata a tela e remove esta exceção)" } },
  { nome: "portal-revogar-imagem", rota: "/portal/minhas-informacoes", perfil: aluno, canvas: "PortalRevogarImagem", passos: [{ clicar: "Revogar" }], limiteCanvas: { valor: 0.85, motivo: "fundo: a janela confere com o canvas; a página atrás (Minhas informações) é mais longa que a do canvas (medido na #451; a #498 trata a tela e remove esta exceção)" } },
  { nome: "turma-desativar", rota: "/turmas/00000000-0000-0000-0000-000000000602", perfil: ana, canvas: "TurmaDesativar", passos: [{ clicar: "Desativar" }], limiteCanvas: { valor: 0.75, motivo: "janela ou fundo: o canvas lista nomes de alunos na recusa e o contrato só traz a contagem; atrás, a gaveta da turma e a lista de turmas têm outro conteúdo (medido a 70,2% na #463; a #475 trata a tela e remove esta exceção)" } },
  { nome: "turma-nova", rota: "/turmas", perfil: ana, canvas: "TurmaEditar", passos: [{ clicar: "Nova turma" }], limiteCanvas: { valor: 0.55, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #475 trata a tela e remove esta exceção)" } },
  { nome: "turma-painel", rota: "/turmas/00000000-0000-0000-0000-000000000601", perfil: ana, canvas: "TurmaPainel", limiteCanvas: { valor: 0.45, motivo: "gaveta: o conteúdo interno difere do canvas (faixa e graus dos alunos, avatar, próxima aula, dados novos) e a lista atrás tem outras linhas (medido a 43,6% na #463; a #475 trata a tela e remove esta exceção)" } },
  { nome: "agenda-aula-avulsa", rota: "/agenda", perfil: ana, canvas: "AulaAvulsa", passos: [{ clicar: "Nova aula avulsa" }], limiteCanvas: { valor: 0.65, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #473 trata a tela e remove esta exceção)" } },
  { nome: "dia-sem-aula-novo", rota: "/dias-sem-aula", perfil: ana, canvas: "DiaSemAulaNovo", passos: [{ clicar: "Novo dia sem aula" }], limiteCanvas: { valor: 0.60, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #474 trata a tela e remove esta exceção)" } },
  // Planos, alunos, matrícula, benefícios e termos (#421). Janelas abrem pelos passos.
  // Sem caso: trocar turma/plano, transferir, encerrar e passos da matrícula (id gerado ou fluxo longo no MSW); GM* são as mesmas telas a 390 px (D1).
  { nome: "planos-lista", rota: "/planos/lista", perfil: ana, canvas: "PlanosRegras", limiteCanvas: { valor: 0.55, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #480 trata a tela e remove esta exceção)" } },
  { nome: "plano-novo", rota: "/planos/lista", perfil: ana, canvas: "PlanosRegras", passos: [{ clicar: "Novo plano" }], limiteCanvas: { valor: 0.65, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #480 trata a tela e remove esta exceção)" } },
  { nome: "beneficio-conceder", rota: "/beneficios", perfil: ana, canvas: "BeneficioConceder", passos: [{ clicar: "Conceder benefício" }], limiteCanvas: { valor: 0.60, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #481 trata a tela e remove esta exceção)" } },
  // Cobranças, comunicação, notificações e pedidos (#422). Janelas abrem pelos passos.
  // Sem caso: recusar pedido e recusar comprovante (o MSW não tem pedido nem comprovante em aberto), recibo público (o MSW começa sem recibo, o código nasce no pagamento), painel da cobrança, registrar pagamento, cancelar, alterar vencimento e renegociar (id gerado ou fluxo longo), lembrete (seleção em lote) e imagem do comprovante; GM* são as mesmas telas a 390 px (D1).
  { nome: "cobranca-avulsa", rota: "/cobrancas", perfil: ana, canvas: "CobrancaAvulsa", passos: [{ clicar: "Nova cobrança avulsa" }], limiteCanvas: { valor: 0.70, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #477 trata a tela e remove esta exceção)" } },
  { nome: "cobranca-antecipar", rota: "/cobrancas", perfil: ana, canvas: "GerarProximas", passos: [{ clicar: "Gerar próximas mensalidades" }], limiteCanvas: { valor: 0.70, motivo: "janela ou fundo: sistema e canvas não mostram a mesma janela (divergência medida na #435; a #477 trata a tela e remove esta exceção)" } },
  { nome: "notificacoes", rota: "/alunos", perfil: ana, canvas: "Notificacoes", passos: [{ clicar: "Notificações" }], limiteCanvas: { valor: 0.10, motivo: "popover: grupos e visual interno das notificações ainda diferem do canvas (medido a 3,7% na #463; a #492 trata a tela e remove esta exceção)" } },
  // Janelas de ação com os blocos Resumo, Motivo e cartões de escolha (#461). Bruno (cenário do MSW) tem cobrança em aberto ligada à modalidade.
  { nome: "cobranca-cancelar", rota: "/cobrancas", perfil: ana, canvas: "CobrancaCancelar", passos: [{ clicar: "Abrir cobrança de" }, { clicar: "Cancelar cobrança" }], limiteCanvas: { valor: 0.75, motivo: "janela ou fundo: a cobrança aberta é outra e a lista atrás tem outras linhas e filtros (medido a 70,2% na #461; a #477 trata a tela e remove esta exceção)" } },
  { nome: "aluno-encerrar-modalidade", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "EncerrarModalidade", passos: [{ clicar: "Matrícula", papel: "tab" }, { clicar: "Encerrar" }], limiteCanvas: { valor: 0.55, motivo: "janela ou fundo: o canvas traz a cobrança em tabela e o botão de encerrar em vermelho cheio, e a ficha atrás tem outro conteúdo (medido a 52,7% na #461; a #468 trata a tela e remove esta exceção)" } },
  // Telas do canvas já construídas que o MSW alcança por rota (#435). Fora delas, ver semCaso.
  { nome: "inicio-professor", rota: "/", perfil: prof, canvas: "ProfessorInicio" },
  { nome: "matricula-aluno", rota: "/alunos/nova-matricula", perfil: ana, canvas: "MatriculaAluno" },
  { nome: "portal-conta", rota: "/conta", perfil: aluno, canvas: "PortalConta", canvasCelular: "PortalMConta" },
  { nome: "portal-familia", rota: "/portal/financeiro", perfil: familia, canvas: "PortalFamilia", canvasCelular: "PortalMFamilia" },
  { nome: "portal-reduzido-info", rota: "/portal/minhas-informacoes", perfil: reduzido, canvas: "PortalReduzidoInfo" },
  // Professor (#443): painel da aula e ficha pela aula, com STUDENT_RECORD ligada no MSW. Aula de segunda, 02/11/2026, da turma Jiu-Jitsu Adulto.
  { nome: "agenda-painel-professor", rota: "/agenda/aulas/00000000-0000-0000-0000-000000000601-2026-11-02-19:00", perfil: prof, canvas: "AgendaPainelProfessor", matricula: true, limiteCanvas: { valor: 0.55, motivo: "gaveta: o canvas mostra o painel da aula como gaveta sobre a agenda, com faixa e situação por aluno; o sistema mostra uma página (medido a 46,9% na #443; a #472 trata a tela e remove esta exceção)" } },
  { nome: "ficha-professor", rota: "/agenda/aulas/00000000-0000-0000-0000-000000000601-2026-11-02-19:00/alunos/00000000-0000-0000-0000-000000000701", perfil: prof, canvas: "FichaProfessor", matricula: true, limiteCanvas: { valor: 0.45, motivo: "fundo e largura: o canvas mostra a ficha em gaveta de 600 px sobre a agenda da semana; o sistema abre a ficha de 680 px sobre uma página da aula vazia (medido a 42,0% na #466; a #472 trata a agenda e o painel da aula e remove esta exceção)" } },
  // Ficha do aluno e janela Editar dados pessoais (#466). GMFicha e GMAlunoEditar têm 360 px: a comparação a 390 px é pelas capturas (D5 da #435).
  { nome: "ficha-aluno", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "AlunoDetalhes", limiteCanvas: { valor: 0.4, motivo: "ficha: o canvas traz Pendências de bloqueio, coluna Faixa, termo aceito e botões no canto do cabeçalho, que dependem da inativação, das graduações e do aceite do termo (D3 e D5 da #466; Sprint 12), e a lista atrás tem outros dados e altura (medido a 36,3% na #466)" } },
  { nome: "aluno-editar", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "AlunoEditar", passos: [{ clicar: "Editar dados pessoais" }], limiteCanvas: { valor: 0.55, motivo: "janela ou fundo: o sistema mantém o bloco de foto e o campo Número (D6 da #466), omite a Última alteração (a API do aluno não traz esse dado) e a ficha atrás tem outro conteúdo (medido a 51,9% na #466)" } },
];

export const larguras = [
  { nome: "1440", width: 1440, height: 1000 },
  { nome: "390", width: 390, height: 844 },
] as const;
export const temas = [
  { nome: "claro", colorScheme: "light" },
  { nome: "escuro", colorScheme: "dark" },
] as const;

// Telas de gestão e portal do canvas sem caso, por motivo (#435). casos.test.ts exige que toda tela dessas páginas esteja em um caso ou aqui.
export const semCaso: Record<string, string[]> = {
  // variante de perfil, estado ou dado que o MSW não alcança por rota hoje
  "variante de perfil, estado ou dado que o MSW não alcança por rota hoje": [
    "InicioCoordenador", "AguardandoAprovacao", "PlanoDesativado", "ComunicadoOrganizacao", "PermissoesTabela", "SuporteAcesso",
    "PortalEmDia", "PortalMConfirmarModalidade", "PortalMPedidoTurma", "PortalMEncerrar", "PortalMExcluir",
  ],
  // tela de funcionalidade ainda sem rota em App.tsx (sprint futura)
  "tela de funcionalidade ainda sem rota em App.tsx (sprint futura)": [
    "Busca", "FaixasTopo", "Experimentais", "Graduacoes", "GraduacaoLote", "Financeiro",
    "Relatorios", "RelatoriosAlunos", "RelatoriosExperimentais", "RelatoriosAulas", "RelatorioConsolidado", "RelatorioProfessor",
    "ConfigPagamentos", "LembretesAuto", "ConfigLinks", "ConfigAssinatura", "Historico", "ImportarDados",
    "ConvitesPortal", "MinhaContaNotificacoes", "Ajuda", "AjudaTour", "Novidades", "PortalMInstalar",
    "PortalMPush",
  ],
  // janela, painel, ficha ou etapa que o MSW não alcança por rota ou passo (id gerado, fluxo longo ou dado ausente)
  "janela, painel, ficha ou etapa que o MSW não alcança por rota ou passo (id gerado, fluxo longo ou dado ausente)": [
    "BuscaVazia", "EscolhaOrganizacao", "EstadoCarregando", "EstadoSemResultados", "ExportarAlunos",
    "AlunoMatricula", "AlunoFinanceiro", "AlunoGraduacoes", "AlunoResponsaveis", "AlunoHistorico",
    "TrocarTurma", "TrocarPlano", "TransferirModalidade", "AlunoInativar", "AlunoReativar",
    "AlunoAnonimizar", "ResponsavelDesligar", "MatriculaModalidades", "MatriculaVencimento", "MatriculaResumo",
    "MatriculaConcluida", "PedidoRecusar", "PedidoEncerramentoRecusar", "PedidoAprovadoFluxo", "ProfessorModalidadeRecusa",
    "AgendaPainel", "AulaEditar", "AulaCancelar", "AulaEditarSeguintes", "AulaCorrigir",
    "AulaAvisarTurma", "TurmaTitularInativo", "EstadoVazio", "ExperimentalAgendar", "ExperimentalPainel",
    "GraduacaoRegistrar", "ExportarGraduacoes", "CobrancaPainel", "SomenteLeitura", "EstadoErro", "PagamentoRegistrar",
    "Renegociar", "Estornar", "ExportarMensalidades", "ComprovanteVarias", "BeneficioEncerrar",
    "PlanoDesativar", "BeneficioSubstituir", "ComunicadoCancelar", "ComunicadoLimite", "ExportarRelatorios", "UnidadeUnica",
    "PagamentosDesconectado", "ModalidadeDesativar", "AssinaturaCancelar", "AuditoriaPainel", "ImportarGraduacoes", "ImportarPagamentos",
    "AlunosImportar", "PacoteCompleto", "FalarSuporte", "PortalConfirmarModalidade", "PortalExcluir", "PortalAvisoAberto",
    "PortalEncerrar", "PortalPedidoTurma", "PortalPedidoModalidade", "PortalPedidoPlano", "PortalPedidoBloqueado",
    "PortalEstados", "PortalMAvisoAberto", "PortalMCarteirinha", "PortalMEditar", "PortalMEstados",
  ],
  // celular a 360 px: o teste visual captura 390 (D5 da #435)
  "celular a 360 px: o teste visual captura 390 (D5 da #435)": [
    "GMInicio", "GMBusca", "GMInicioCoord", "GMInicioProfessor", "GMNotificacoes",
    "GMConta", "GMAlunos", "GMFicha", "GMFichaMatricula", "GMFichaFinanceiro",
    "GMFichaResponsaveis", "GMAlunoEditar", "GMEncerrar", "GMAgenda", "GMAulaPainel", "GMAulaEditar",
    "GMAulaCancelar", "GMDiasSemAula", "GMAgendaProfessor", "GMAulaProfessor", "GMCobrancas", "GMPagamento",
    "GMMatricula1", "GMMatricula2", "GMMatricula4", "GMProfessores", "GMProfessorPainel", "GMPedidos",
    "GMPedidoRecusar", "GMTurmas", "GMTurmaPainel", "GMExperimentais", "GMExperimental", "GMGraduacoes",
    "GMGraduar", "GMFinanceiro", "GMCobrancaPainel", "GMRenegociar", "GMConferencia", "GMPlanos",
    "GMComunicados", "GMNovoComunicado", "GMRelatorios", "GMConfig", "GMConfigUnidade", "GMUsuarios",
    "GMAuditoria", "GMAssinatura", "GMSomenteLeitura", "GMSemAcesso", "GMErro",
  ],
  // pagamento do portal: depende de cobrança em aberto e do pagamento simulado, que o MSW não deixa em estado fixo
  "pagamento do portal: depende de cobrança em aberto e do pagamento simulado, que o MSW não deixa em estado fixo": [
    "PortalPagamento", "PortalPix", "PortalBoleto", "PortalPagamentoOk", "PortalPagamentoErro", "PortalPixChave",
    "PortalDebito", "PortalComprovanteVarias", "PortalMPagamento", "PortalMPix", "PortalMBoleto", "PortalMPagamentoOk",
    "PortalMCartaoRecusado", "PortalMPixChave", "PortalMDebito",
  ],
};
