// Casos do teste visual (#416). Cada issue de tela da Sprint 10.5 acrescenta os seus.
// `perfil`: e-mail do login do MSW (senha segredo123); ausente = sem login.
// `canvas`: nome da tela em docs/design/canvas (sem .dc.html); `canvasEscuro`: versão escura, quando existe.
// D4 (#419): passos antes do print, para chegar a janelas e estados. `preencher`: [rótulo exato, valor]; `clicar`: início do nome do botão.
// seExistir: o botão só aparece em parte das larguras (ex.: "Filtros" abaixo de 640 px)
// escolher: [rótulo exato do select, trecho do texto da opção] (select não aceita `fill`); papel "radio" marca o seletor segmentado (#469)
export type Passo = { preencher: [string, string] } | { escolher: [string, string] } | { clicar: string, seExistir?: boolean, papel?: "tab" | "radio" | "checkbox" };
export type Caso = {
  nome: string;
  rota: string;
  perfil?: string;
  canvas?: string;
  canvasEscuro?: string;
  canvasCelular?: string; // tela do canvas feita para 390 px (comparada com a referência 390 do caso)
  limiteCanvas?: { 1440?: number; 390?: number; motivo: string }; // limite por largura, no lugar do padrão (#435, #714)
  fullPage?: boolean;
  matricula?: boolean; // #443: antes do print, matricula o aluno fictício na turma do Professor (o MSW começa sem matrículas)
  oferta?: boolean; // #469: antes do print, a Unidade Centro passa a oferecer Jiu-Jitsu (o MSW começa sem modalidade ligada nas unidades)
  dias?: boolean; // #474: antes do print, lança os dias sem aula e ignora os feriados que o canvas mostra (o MSW começa sem dias)
  titularInativo?: boolean; // #475: antes do print, a turma 607 (Jiu-Jitsu Manhã) responde com o titular inativo; só no caso, sem mexer no cenário compartilhado
  planosCanvas?: boolean; // #480: antes de abrir a tela, a Coordenação enxerga só a unidade "Tijuca" com os quatro planos ativos e o desativado do canvas e o resumo 4 e 14 (o cenário compartilhado tem mais planos)
  beneficios?: "lista" | "davi" | "marina"; // #481: antes de abrir a tela, a unidade "Tijuca" e os cinco benefícios do canvas (14, 2 e 9); davi e marina põem o aluno, a matrícula, o resumo e o professor das janelas
  organizacaoCanvas?: boolean; // #482: antes de abrir a tela, a organização "Academia Leão" do canvas (Marcos Leão, cor #C8462C, regras 30, 12, 6, 2 e "Depende do plano") e a Administradora Carla Mendes (Tijuca e Barra) na lista de quem pode receber a coordenação
  unidadeCanvas?: "conectada" | "desconectada"; // #483: antes de abrir a tela, a unidade "Tijuca" do canvas (dados, taxas, modalidades com turmas e planos) com a conta do Mercado Pago conectada ou desconectada
  unidadesCanvas?: "lista" | "unica"; // #484: antes de abrir a tela, a lista de unidades do canvas (Tijuca, Barra e Méier desativada) ou só a unidade única; a Barra tem 83 alunos e 5 turmas ativos
  faixasCanvas?: boolean; // #486: antes de abrir a tela, as três faixas do canvas com "Usada em" e a última alteração de Marcos Leão
  modalidadesCanvas?: "lista" | "administrador" | "desativar" | "recusa"; // #485: antes de abrir a tela, Jiu-Jitsu (19 níveis) e Muay Thai (8) ativas em Tijuca e Barra e o resto do catálogo disponível; administrador mostra só as duas, em consulta; desativar recusa o Muay Thai (3 turmas, 63 alunos); recusa não deixa a Tijuca largar o Muay Thai (turma da noite, 26 alunos)
  usuariosCanvas?: boolean; // #487: antes de abrir a tela, as unidades Tijuca e Barra e a equipe do canvas que a regra permite à Coordenação (Carla Mendes e Diego Alves, Administradores, e o convite pendente de Paula Ribeiro)
  termosCanvas?: boolean; // #488: antes de abrir a tela, o termo de matrícula na versão 3 e as versões 3, 2 e 1 do canvas com 187, 142 e 96 aceites
  textosCanvas?: boolean; // #488: antes de abrir a tela, os nove modelos do canvas (Boas-vindas, Lembrete antes e depois com texto próprio), como o Administrador os vê
  comunicadosCanvas?: "lista" | "curta" | "limite" | "organizacao" | "novo" | "novo-celular"; // #491: antes de abrir a tela, a unidade "Tijuca" e os comunicados do canvas (lista: cinco, 0 hoje; curta: agendado e enviado, 3 de 20; limite: 20 de 20; organizacao: janela com 286 pessoas; novo e novo-celular: a turma e a prévia do canvas)
  termoCanvas?: "um" | "filhos"; // #494: antes de abrir a tela, o termo de matrícula na versão 3 do canvas pendente para o Theo (um) ou para Davi e Lia Nogueira (filhos)
  inicioCanvas?: "em-dia" | "confirmar"; // #493: antes de abrir a tela, o Início sem cobrança e com o próximo vencimento (em-dia) ou com uma modalidade nova pendente (confirmar)
  agendaCanvas?: boolean; // #495: antes de abrir a tela, a semana de 12 a 18 de outubro do canvas (hoje, sexta 16)
  avisosCanvas?: boolean; // #496: antes de abrir a tela, os 6 avisos do canvas e o aviso aberto "Aula de quinta cancelada"
  financeiroCanvas?: boolean; // #497: antes de abrir a tela, o Financeiro do canvas (Bruno Carvalho: 3 abertas, histórico de 2026 e chave Pix CNPJ da Tijuca)
  informacoesCanvas?: boolean; // #498: antes de abrir a tela, Minhas informações e Minha conta do canvas (Bruno Carvalho: dados, Jiu-Jitsu e Muay Thai com plano, termos e duas sessões)
  feriadoHoje?: boolean; // #688: antes de abrir a tela, hoje (29/10, o relógio do teste) é um dia sem aula "Feriado sintético" na unidade Centro
  reduzidoCanvas?: boolean; // #501: antes de abrir a tela, o Financeiro reduzido do canvas (Gabriel Rocha, Academia Leão, Tijuca: Muay Thai ago/2026 vencida e o recibo de jul/2026)
  pedidosCanvas?: "lista" | "turma" | "plano" | "modalidade" | "encerrar" | "bloqueado"; // #500: antes de abrir a tela, Bruno Carvalho com Jiu-Jitsu e Muay Thai (Tijuca), os três pedidos do canvas e a unidade Tijuca da Academia Leão; o variante decide o que a janela mostra (bloqueado: encerramento aberto no Muay Thai; modalidade: só o Jiu-Jitsu e a oferta do Muay Thai)
  falha?: { path: string; status: number }; // #476: antes de abrir a tela, o MSW responde com este status nesta rota (estado de erro)
  passos?: Passo[];
  aguardar?: string; // seletor do conteúdo final da janela aberta pelos passos (ex.: o QR); o print só sai com ele presente
};

const ana = "ana@exemplo.com"; // Coordenador, todas as áreas
const admin = "admin@exemplo.com"; // Administrador
const prof = "prof@exemplo.com"; // Professor
const aluno = "aluno@exemplo.com"; // Aluno adulto, portal completo
const familia = "familia@exemplo.com"; // Responsável com dois filhos
const reduzido = "reduzido@exemplo.com"; // Aluno sem modalidade ativa, portal reduzido

// #469: aluno fictício adulto (Carla, só com Judô, do MSW) e os passos que preenchem a etapa 2
const matriculaRota = "/alunos/nova-matricula?aluno=00000000-0000-0000-0000-000000000722";
// #481: o aluno do canvas na janela Conceder benefício (o MSW do caso devolve só ele na busca)
const escolhaDavi: Passo[] = [{ preencher: ["Buscar aluno pelo nome (mínimo 2 letras)", "Davi"] }, { clicar: "Davi Nogueira" }, { escolher: ["Modalidade", "Jiu-Jitsu"] }];
const modalidade: Passo[] = [{ escolher: ["Unidade", "Centro"] }, { escolher: ["Modalidade", "Jiu-Jitsu"] }, { escolher: ["Turma principal", "Jiu-Jitsu Adulto"] }, { escolher: ["Plano", "Jiu-Jitsu Livre"] }];

// #746: a unidade "Tijuca" do `unidadeCanvas` é a Unidade Sul do MSW, de id fixo.
const UNIDADE = "/configuracoes/unidades/00000000-0000-0000-0000-000000000023";

export const casos: Caso[] = [
  { nome: "vitrine", rota: "/dev/vitrine", fullPage: true },
  { nome: "entrar", rota: "/entrar", canvas: "Login", canvasCelular: "LoginM" },
  { nome: "inicio", rota: "/", perfil: ana, canvas: "Main", canvasEscuro: "MainEscuro" },
  // Moldura da gestão (#417): menu, barra de cima, abas e menu de celular por perfil
  { nome: "moldura-coordenacao", rota: "/alunos", perfil: ana, canvas: "Sidebar" },
  // #624: menu recolhido (só os ícones dos grupos) e o painel flutuante de um grupo; o canvas não mostra o recolhido (sem comparação, D6)
  { nome: "moldura-recolhido", rota: "/alunos", perfil: ana, passos: [{ clicar: "Recolher menu", seExistir: true }] },
  { nome: "moldura-painel-grupo", rota: "/alunos", perfil: ana, passos: [{ clicar: "Recolher menu", seExistir: true }, { clicar: "Operação", seExistir: true }] },
  { nome: "moldura-administrador", rota: "/alunos", perfil: admin, canvas: "Topbar" },
  { nome: "moldura-professor", rota: "/agenda", perfil: prof, canvas: "GMMenu", feriadoHoje: true },
  // #454: no celular o menu em tela cheia e a folha de unidade; a 1440 px o mesmo passo abre o menu da conta e a lista de unidade (o canvas é de 360 px, sem comparação automática)
  { nome: "moldura-celular-menu", rota: "/alunos", perfil: ana, canvas: "GMMenu", passos: [{ clicar: "Menu" }] },
  { nome: "moldura-celular-unidade", rota: "/alunos", perfil: ana, canvas: "GMUnidade", passos: [{ clicar: "Unidade ativa" }] },
  // Moldura do portal (#418): barra com a marca, abas, sino, rodapé e faixa de acesso reduzido; a 390 px, barra de cima e abas embaixo
  { nome: "portal-aluno", rota: "/", perfil: aluno, canvas: "PortalInicio", canvasCelular: "PortalMInicio" },
  { nome: "portal-responsavel", rota: "/portal/financeiro", perfil: familia, canvas: "PortalNav" },
  { nome: "portal-reduzido", rota: "/portal/financeiro", perfil: reduzido, canvas: "PortalReduzido", canvasCelular: "PortalMReduzido", reduzidoCanvas: true },
  { nome: "portal-celular-topo", rota: "/portal/minhas-informacoes", perfil: aluno, canvas: "PortalMTopo" },
  { nome: "portal-celular-abas", rota: "/portal/agenda", perfil: familia, canvas: "PortalMTabs" },
  // Páginas do portal do aluno e do responsável (#423). Janelas e estados que o MSW não alcança (comprovante com envio, pedidos por id gerado) ficam sem caso (D2).
  { nome: "portal-inicio-responsavel", rota: "/", perfil: familia, canvas: "PortalResponsavel", canvasCelular: "PortalMResponsavel" },
  { nome: "portal-inicio-em-dia", rota: "/", perfil: aluno, canvas: "PortalEmDia", inicioCanvas: "em-dia" },
  { nome: "portal-confirmar-modalidade", rota: "/", perfil: aluno, canvas: "PortalConfirmarModalidade", canvasCelular: "PortalMConfirmarModalidade", inicioCanvas: "confirmar", limiteCanvas: { 390: 0.35, motivo: "a janela usa o Modal base (no celular, gaveta de baixo sem alça, linhas em tabela e botões lado a lado); o canvas empilha os campos, traz alça e dados que a API não entrega (turma principal, dia de vencimento, nota da primeira mensalidade, D1 do item #493); a #601 trata a tela e remove esta exceção" } },
  { nome: "portal-termo", rota: "/portal/termo", perfil: familia, canvas: "PortalTermo", canvasCelular: "PortalMTermo", termoCanvas: "um" },
  { nome: "portal-termo-filhos", rota: "/portal/termo", perfil: familia, canvas: "PortalTermoFilhos", termoCanvas: "filhos", passos: [{ clicar: "Li e aceito", papel: "checkbox" }, { clicar: "Aceitar e continuar" }] },
  { nome: "portal-agenda", rota: "/portal/agenda", perfil: aluno, canvas: "PortalAgenda", canvasCelular: "PortalMAgenda", agendaCanvas: true },
  { nome: "portal-avisos", rota: "/portal/avisos", perfil: aluno, canvas: "PortalAvisos", canvasCelular: "PortalMAvisos", avisosCanvas: true },
  { nome: "portal-aviso-aberto", rota: "/portal/avisos?aviso=00000000-0000-0000-0000-0000000007d2", perfil: aluno, canvas: "PortalAvisoAberto", canvasCelular: "PortalMAvisoAberto", avisosCanvas: true },
  { nome: "portal-financeiro", rota: "/portal/financeiro", perfil: aluno, canvas: "PortalFinanceiro", canvasCelular: "PortalMFinanceiro", financeiroCanvas: true, passos: [{ clicar: "Selecionar Muay Thai · set/2026", papel: "checkbox" }, { clicar: "Selecionar Jiu-Jitsu · out/2026", papel: "checkbox" }] },
  { nome: "portal-pix-chave", rota: "/portal/financeiro", perfil: aluno, canvas: "PortalPixChave", canvasCelular: "PortalMPixChave", financeiroCanvas: true, limiteCanvas: { 1440: 0.68, 390: 0.17, motivo: "a janela do Pix usa o Modal base com o título do contrato (Pix na chave com comprovante), cartão da chave, seletor de arquivo nativo e o fundo do Financeiro com as tabelas do sistema; o canvas tem título, cartão e fundo próprios (#622 trata a tela e remove esta exceção)" }, passos: [{ clicar: "Selecionar Muay Thai · set/2026", papel: "checkbox" }, { clicar: "Selecionar Jiu-Jitsu · out/2026", papel: "checkbox" }, { clicar: "Enviar comprovante de Pix" }], aguardar: "[role=dialog] button[aria-label='Copiar chave'], [role=dialog] button:has-text('Copiar chave')" },
  { nome: "portal-informacoes", rota: "/portal/minhas-informacoes", perfil: aluno, canvas: "PortalInfo", canvasCelular: "PortalMInfo", informacoesCanvas: true },
  { nome: "portal-carteirinha", rota: "/portal/carteirinha", perfil: aluno, canvas: "PortalCarteirinha", canvasCelular: "PortalMCarteirinhaOk", limiteCanvas: { 390: 0.20, motivo: "medido a 18,5% a 390 px: dados do MSW diferentes (academia, aluno, unidades, faixas), logo no topo do cartão, botão Baixar imagem com Em breve e a assinatura feito com ctcore em outro lugar; a #741 trata a tela e remove este limite" } },
  { nome: "portal-carteirinha-filhos", rota: "/portal/carteirinha", perfil: familia, canvas: "PortalCarteirinhaFilhos" },
  { nome: "portal-pedidos", rota: "/portal/pedidos", perfil: aluno, canvas: "PortalPedidos", canvasCelular: "PortalMPedidos", pedidosCanvas: "lista" },
  // #500: janelas dos pedidos
  { nome: "portal-pedido-turma", rota: "/portal/pedidos", perfil: aluno, canvas: "PortalPedidoTurma", canvasCelular: "PortalMPedidoTurma", pedidosCanvas: "turma", passos: [{ clicar: "Pedir: Trocar de turma" }, { escolher: ["Nova turma principal *", "Adulto · Manhã"] }, { preencher: ["Mensagem para a academia (opcional)", "Mudei de horário no trabalho."] }], limiteCanvas: { 390: 0.51, motivo: "medido a 49,9% a 390 px: o canvas mostra a janela como gaveta que sobe da base, com alça e botão largo, e o sistema a mostra ocupando a tela (D8 do item #500); a #674 trata a gaveta e remove este limite" } },
  { nome: "portal-pedido-plano", rota: "/portal/pedidos", perfil: aluno, canvas: "PortalPedidoPlano", pedidosCanvas: "plano", passos: [{ clicar: "Pedir: Trocar de plano" }] },
  { nome: "portal-pedido-modalidade", rota: "/portal/pedidos", perfil: aluno, canvas: "PortalPedidoModalidade", pedidosCanvas: "modalidade", passos: [{ clicar: "Pedir: Nova modalidade" }, { escolher: ["Unidade *", "Tijuca"] }, { escolher: ["Modalidade *", "Muay Thai"] }, { preencher: ["Mensagem para a academia (opcional)", "Queria começar no horário da noite."] }] },
  { nome: "portal-pedido-encerrar", rota: "/portal/pedidos", perfil: aluno, canvas: "PortalEncerrar", canvasCelular: "PortalMEncerrar", pedidosCanvas: "encerrar", passos: [{ clicar: "Pedir: Solicitar encerramento" }, { escolher: ["Modalidade *", "Muay Thai"] }, { escolher: ["Motivo *", "Horário"] }, { preencher: ["Quer contar mais? (opcional)", "Mudei de emprego e não consigo mais às 19h."] }], limiteCanvas: { 390: 0.47, motivo: "medido a 45,2% a 390 px: o canvas mostra a janela como gaveta que sobe da base, com alça e botão largo, e o sistema a mostra ocupando a tela (D8 do item #500); a #674 trata a gaveta e remove este limite" } },
  { nome: "portal-pedido-bloqueado", rota: "/portal/pedidos", perfil: aluno, canvas: "PortalPedidoBloqueado", pedidosCanvas: "bloqueado", passos: [{ clicar: "Pedir: Trocar de turma" }] },
  { nome: "alunos", rota: "/alunos", perfil: ana, canvas: "Alunos" },
  { nome: "alunos-filtros", rota: "/alunos", perfil: ana, canvas: "GMAlunosFiltros", passos: [{ clicar: "Filtros", seExistir: true }] }, // #457: folha de filtros do celular (no 1440 os filtros ficam na linha)
  { nome: "professores", rota: "/professores", perfil: ana, canvas: "Professores" },
  { nome: "agenda", rota: "/agenda", perfil: ana, canvas: "Agenda" },
  { nome: "agenda-painel", rota: "/agenda/aulas/00000000-0000-0000-0000-000000000601-2026-11-02-19:00", perfil: ana, canvas: "AgendaPainel", matricula: true },
  { nome: "dias-sem-aula", rota: "/dias-sem-aula", perfil: ana, canvas: "DiasSemAula", dias: true },
  { nome: "turmas", rota: "/turmas", perfil: ana, canvas: "Turmas" },
  { nome: "planos", rota: "/planos", perfil: ana, canvas: "Planos", planosCanvas: true },
  { nome: "beneficios", rota: "/beneficios", perfil: ana, canvas: "BeneficiosLista", beneficios: "lista" },
  { nome: "cobrancas", rota: "/cobrancas", perfil: ana, canvas: "Mensalidades", canvasEscuro: "CobrancasEscuro" },
  { nome: "cobrancas-erro", rota: "/cobrancas", perfil: ana, canvas: "EstadoErro", falha: { path: "/charges", status: 500 } },
  { nome: "cobrancas-sem-acesso", rota: "/cobrancas", perfil: prof, canvas: "EstadoSemAcesso" },
  { nome: "cobrancas-atrasados", rota: "/cobrancas/atrasados", perfil: ana, canvas: "Atrasados" },
  { nome: "cobrancas-conferencia", rota: "/cobrancas/conferencia", perfil: ana, canvas: "EmConferencia" },
  { nome: "cobrancas-conferencia-janela", rota: "/cobrancas/conferencia", perfil: ana, canvas: "ComprovanteVarias", passos: [{ clicar: "Conferir comprovante de Lucas" }], limiteCanvas: { 1440: 0.58, motivo: "medido a 56,1%: dados e fundo: o canvas mostra a lista atrás sem o destaque, outra unidade e outro aluno; a estrutura da janela confere lado a lado (capturas em .capturas/478); removido pela #573" } },
  { nome: "cobrancas-recebimentos", rota: "/cobrancas/recebimentos", perfil: admin, canvas: "RecebimentosDia" },
  { nome: "cobrancas-previa", rota: "/cobrancas/previa", perfil: admin, canvas: "Fechamento" },
  { nome: "pedidos", rota: "/pedidos", perfil: ana, canvas: "PedidosPortal" },
  { nome: "pedido-recusar", rota: "/pedidos", perfil: ana, canvas: "PedidoRecusar", passos: [{ clicar: "Recusar" }], limiteCanvas: { 1440: 0.59, motivo: "medido a 57,7%: dados do mock (2 pedidos abertos, não 4) e a lista atrás diferem do canvas; contador N/500 do componente base (o canvas escreve N de 500); sem contagem na aba Aguardando aprovação (D3 e D5 da #471; removido pela #556)" } }, // #471: primeira linha (troca de turma); PedidoEncerramentoRecusar fica em semCaso (o encerramento não é a primeira linha)
  { nome: "pedido-trocar-turma", rota: "/alunos/00000000-0000-0000-0000-000000000701?pedido=00000000-0000-0000-0000-00000000f0c1", perfil: ana, canvas: "PedidoAprovadoFluxo", aguardar: '[role="dialog"]', limiteCanvas: { 1440: 0.62, motivo: "medido a 60,6%: o canvas mostra a janela sobre a lista de Alunos e o sistema a abre sobre a ficha do aluno (gaveta); \"Pedido aprovado.\" em negrito no canvas; Outros horários e a nota do rodapé diferem (D8 da #471; removido pela #556)" } },
  // Comunicados (#491): lista, formulário, janelas de cancelar e da organização inteira, faixa do limite e os dois de celular (390 px)
  { nome: "comunicados", rota: "/comunicados", perfil: ana, canvas: "Comunicados", comunicadosCanvas: "lista" },
  { nome: "comunicados-novo", rota: "/comunicados/novo?classId=00000000-0000-0000-0000-000000000c91&type=CANCELED_CLASS&date=2026-10-15&time=19:00", perfil: ana, canvas: "ComunicadoNovo", comunicadosCanvas: "novo" },
  { nome: "comunicados-cancelar", rota: "/comunicados", perfil: ana, canvas: "ComunicadoCancelar", comunicadosCanvas: "curta", passos: [{ clicar: "Cancelar" }], aguardar: "[role=dialog]" },
  { nome: "comunicados-limite", rota: "/comunicados", perfil: ana, canvas: "ComunicadoLimite", comunicadosCanvas: "limite" },
  { nome: "comunicados-organizacao", rota: "/comunicados?novo=organizacao", perfil: ana, canvas: "ComunicadoOrganizacao", comunicadosCanvas: "organizacao", aguardar: "form#org-announcement" },
  { nome: "comunicados-celular", rota: "/comunicados", perfil: ana, comunicadosCanvas: "curta" },
  { nome: "comunicados-novo-celular", rota: "/comunicados/novo?classId=00000000-0000-0000-0000-000000000c93&type=GENERAL", perfil: ana, comunicadosCanvas: "novo-celular" },
  { nome: "configuracoes-organizacao", rota: "/configuracoes/organizacao", perfil: ana, canvas: "ConfigAcademia", organizacaoCanvas: true },
  { nome: "configuracoes-unidades", rota: "/configuracoes/unidades", perfil: ana, canvas: "ConfigUnidades", unidadesCanvas: "lista" },
  { nome: "configuracoes", rota: "/configuracoes", perfil: admin }, // GMConfig e GMConfigUnidade são de 360 px: a comparação é feita à mão (D5 da #435)
  { nome: "configuracoes-unidade", rota: UNIDADE, perfil: ana, canvas: "ConfigUnidade", unidadeCanvas: "conectada" },
  { nome: "configuracoes-unidade-pagamentos", rota: UNIDADE, perfil: ana, canvas: "ConfigPagamentos", unidadeCanvas: "conectada", passos: [{ clicar: "Cobrança", papel: "tab" }] },
  { nome: "configuracoes-unidade-pagamentos-desconectado", rota: UNIDADE, perfil: ana, canvas: "PagamentosDesconectado", unidadeCanvas: "desconectada", passos: [{ clicar: "Cobrança", papel: "tab" }] },
  { nome: "configuracoes-unidade-lembretes", rota: UNIDADE, perfil: ana, canvas: "LembretesAuto", unidadeCanvas: "conectada", passos: [{ clicar: "Lembretes", papel: "tab" }] },
  { nome: "configuracoes-unidade-links", rota: UNIDADE, perfil: ana, canvas: "ConfigLinks", unidadeCanvas: "conectada", passos: [{ clicar: "Divulgação", papel: "tab" }] },
  { nome: "configuracoes-modalidades", rota: "/configuracoes/organizacao?aba=modalidades", perfil: ana, canvas: "ConfigModalidades", modalidadesCanvas: "lista" },
  { nome: "configuracoes-faixas-etarias", rota: "/configuracoes/organizacao?aba=faixas-etarias", perfil: ana, canvas: "ConfigFaixas", faixasCanvas: true },
  { nome: "administradores", rota: "/administradores", perfil: ana, usuariosCanvas: true }, // #611: sem canvas (a tela nasceu depois do desenho: o canvas ConfigUsuarios é a tela antiga, com cartões de perfil e sem custo; segue a especificação e os componentes base)
  { nome: "configuracoes-permissoes", rota: `${UNIDADE}/permissoes`, perfil: ana, canvas: "PermissoesTabela", fullPage: true },
  { nome: "configuracoes-termos", rota: "/configuracoes/organizacao?aba=termos", perfil: ana, canvas: "ConfigTermos", termosCanvas: true },
  { nome: "configuracoes-textos", rota: "/configuracoes/organizacao?aba=textos", perfil: admin, canvas: "ConfigTextos", textosCanvas: true, passos: [{ clicar: "Lembrete: antes do vencimento" }] },
  { nome: "conta", rota: "/conta", perfil: ana, canvas: "MinhaConta" },
  // Acesso, conta, organização, unidades e usuários (#419). Estados e janelas abrem pelos passos.
  // Escolha de organização (#489): o login de "varios@" entra sem vínculo ativo e cai na página de escolha.
  { nome: "escolha-organizacao", rota: "/entrar", canvas: "EscolhaOrganizacao", canvasCelular: "EscolhaOrgM", passos: [{ preencher: ["E-mail", "varios@exemplo.com"] }, { preencher: ["Senha", "segredo123"] }, { clicar: "Entrar" }] },
  { nome: "login-travado", rota: "/entrar", canvas: "LoginTravado", canvasCelular: "LoginTravadoM", passos: [{ preencher: ["E-mail", "limite@exemplo.com"] }, { preencher: ["Senha", "segredo123"] }, { clicar: "Entrar" }] },
  { nome: "login-duas-etapas", rota: "/entrar", canvas: "LoginDuasEtapas", passos: [{ preencher: ["E-mail", "duas@exemplo.com"] }, { preencher: ["Senha", "segredo123"] }, { clicar: "Entrar" }, { preencher: ["Código", "482"] }] },
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
    passos: [{ preencher: ["Nova senha", "Senhaforte1"] }, { preencher: ["Repita a nova senha", "Senhaforte1"] }, { clicar: "Criar senha e entrar" }],
  },
  { nome: "convite", rota: "/convite/valido", canvas: "PrimeiroAcesso" },
  { nome: "convite-conta-existente", rota: "/convite/existente", canvas: "PrimeiroAcessoConta" },
  { nome: "convite-vencido", rota: "/convite/vencido", canvas: "ConviteVencido" },
  { nome: "pagina-nao-encontrada", rota: "/pagina-que-nao-existe", perfil: prof }, // #675: sem canvas (D6); segue a especificação e os estados base
  { nome: "sem-acesso", rota: "/administradores", perfil: prof, canvas: "EstadoSemAcesso", canvasCelular: "SemAcessoM", limiteCanvas: { 390: 0.22, motivo: "medido a 20,6% a 390 px: o canvas SemAcessoM é tela cheia sem moldura, com a marca no topo e a linha de suporte; o sistema mostra o cartão dentro da moldura, com o botão Ver minhas turmas; a #740 trata a tela e remove este limite" } },
  { nome: "conta-aluno", rota: "/conta", perfil: aluno, canvas: "PortalTrocarEmail", informacoesCanvas: true, passos: [{ clicar: "Trocar e-mail" }], limiteCanvas: { 1440: 0.70, motivo: "fundo: a janela confere com o canvas (Novo e-mail, Senha atual com a dica, Resumo de 4 avisos, rodapé fixo); atrás dela o canvas mostra só o cartão Acesso, e o sistema mostra a página inteira (medido a 68,5% na #498; a #642 remove este limite)" } },
  { nome: "conta-duas-etapas", rota: "/conta?aba=duas-etapas", perfil: ana, canvas: "DuasEtapas", passos: [{ clicar: "Ativar duas etapas" }], aguardar: '[role="dialog"] img' },
  { nome: "conta-codigos-reserva", rota: "/conta?aba=duas-etapas", perfil: "duas@exemplo.com", canvas: "CodigosReserva", passos: [{ clicar: "Ver códigos de reserva novos" }, { clicar: "Guardei os códigos em lugar seguro", papel: "checkbox" }], aguardar: '[role="dialog"] ul li:nth-child(10)' },
  // #490: aba Notificações (Administrador: Receber tudo desabilitado) e a lista de atalhos do celular (GMConta é de 390 px: a 1440 não há comparação, o 390 é conferido nas capturas)
  { nome: "conta-notificacoes", rota: "/conta?aba=notificacoes", perfil: admin, canvas: "MinhaContaNotificacoes", aguardar: '[role="switch"]' },
  { nome: "conta-celular", rota: "/conta", perfil: ana, canvas: "GMConta" },
  { nome: "configuracoes-organizacao-contraste", rota: "/configuracoes/organizacao", perfil: ana, canvas: "ConfigOrgContraste", organizacaoCanvas: true, passos: [{ preencher: ["Cor principal", "#F4C430"] }] },
  { nome: "configuracoes-transferir-coordenacao", rota: "/configuracoes/organizacao", perfil: "duas@exemplo.com", canvas: "TransferirCoordenacao", organizacaoCanvas: true, passos: [{ clicar: "Transferir coordenação" }, { escolher: ["Novo Coordenador", "Carla Mendes"] }, { preencher: ["Sua senha", "segredo123"] }] },
  { nome: "configuracoes-unidade-nova", rota: "/configuracoes/unidades/nova", perfil: ana, canvas: "UnidadeNova" },
  { nome: "configuracoes-unidade-desativar", rota: "/configuracoes/unidades", perfil: ana, canvas: "UnidadeDesativar", unidadesCanvas: "lista", passos: [{ clicar: "Desativar a Barra" }] },
  { nome: "configuracoes-unidade-unica", rota: "/configuracoes/unidades", perfil: ana, canvas: "UnidadeUnica", unidadesCanvas: "unica", passos: [{ clicar: "Desativar a Academia" }] },
  { nome: "configuracoes-unidade-professor", rota: UNIDADE, perfil: ana, canvas: "ConfigPermProf", unidadeCanvas: "conectada", passos: [{ clicar: "Permissões do Professor", papel: "tab" }], fullPage: true },
  { nome: "administradores-alterar-unidades", rota: "/administradores", perfil: ana, usuariosCanvas: true, passos: [{ clicar: "Alterar unidades Carla Mendes" }, { clicar: "Tijuca", papel: "checkbox" }] },
  { nome: "administradores-desativar", rota: "/administradores", perfil: ana, usuariosCanvas: true, passos: [{ clicar: "Desativar Carla Mendes" }] },
  { nome: "administradores-convidar", rota: "/administradores", perfil: ana, usuariosCanvas: true, passos: [{ clicar: "Convidar" }, { preencher: ["Nome *", "Fernanda Rocha"] }, { preencher: ["E-mail *", "fernanda@academialeao.example"] }, { clicar: "Tijuca", papel: "checkbox" }] },
  // Modalidades, faixas, professores, turmas, agenda e dias sem aula (#420). Janelas abrem pelos passos.
  // Sem caso: painel da aula, editar, cancelar e corrigir aula (o id da aula é gerado pelo MSW, sem rota fixa); GM* são as mesmas telas a 390 px (D1).
  { nome: "configuracoes-modalidades-administrador", rota: "/configuracoes/organizacao?aba=modalidades", perfil: admin, canvas: "ConfigModalidadesAdmin", modalidadesCanvas: "administrador" },
  { nome: "configuracoes-modalidade-desativar", rota: "/configuracoes/organizacao?aba=modalidades", perfil: ana, canvas: "ModalidadeDesativar", modalidadesCanvas: "desativar", passos: [{ clicar: "Desativar Muay Thai" }] },
  { nome: "configuracoes-unidade-modalidades-recusa", rota: UNIDADE, perfil: ana, canvas: "ModalidadesOferecidasRecusa", unidadeCanvas: "conectada", modalidadesCanvas: "recusa", passos: [{ clicar: "Muay Thai", papel: "checkbox" }] },
  { nome: "configuracoes-modalidades-graduacao", rota: "/configuracoes/organizacao?aba=modalidades", perfil: ana, canvas: "ModalidadeGraduacao", modalidadesCanvas: "lista", passos: [{ clicar: "Graduação Jiu-Jitsu" }] },
  { nome: "configuracoes-modalidades-pedido", rota: "/configuracoes/organizacao?aba=modalidades", perfil: ana, modalidadesCanvas: "lista", passos: [{ clicar: "Não achei minha modalidade" }] }, // D7: o canvas não desenha esta janela; o caso só guarda a referência do teste visual
  { nome: "configuracoes-faixa-nova", rota: "/configuracoes/organizacao?aba=faixas-etarias", perfil: ana, faixasCanvas: true, passos: [{ clicar: "Nova faixa etária" }] }, // #486: o canvas ConfigFaixas não desenha esta janela (só a lista), como na modalidades-pedido; o caso só guarda a referência do teste visual
  { nome: "professor-novo", rota: "/professores", perfil: ana, canvas: "ProfessorNovo", passos: [{ clicar: "Novo professor" }] },
  { nome: "professor-painel", rota: "/professores/00000000-0000-0000-0000-000000000502", perfil: ana, canvas: "ProfessorPainel" },
  { nome: "professor-inativar", rota: "/professores/00000000-0000-0000-0000-000000000502", perfil: ana, canvas: "ProfessorInativar", passos: [{ clicar: "Inativar" }], limiteCanvas: { 1440: 0.43, motivo: "fundo: a ação nasce no painel, então a janela abre sobre a gaveta do professor e o canvas a mostra sobre a lista; dados do mock diferem do canvas (medido a 41,3% na #470; a #553 remove este limite)" } },
  { nome: "professor-remover-acesso", rota: "/professores/00000000-0000-0000-0000-000000000501", perfil: ana, passos: [{ clicar: "Remover acesso" }] }, // #610: sem canvas (a janela nasceu depois do desenho; segue a especificação e os componentes base, D-610)
  { nome: "professor-modalidade-recusa", rota: "/professores/00000000-0000-0000-0000-000000000502", perfil: ana, canvas: "ProfessorModalidadeRecusa", passos: [{ clicar: "Editar" }, { clicar: "Judô", papel: "checkbox" }], limiteCanvas: { 1440: 0.53, motivo: "janela e fundo: o canvas mostra uma janela curta (Nome, Unidades, modalidades) sobre a lista, e o sistema reaproveita o formulário completo (R9) sobre a gaveta do painel (medido a 51,9% na #470; a #553 remove este limite)" } },
  { nome: "portal-revogar-imagem", rota: "/portal/minhas-informacoes", perfil: aluno, canvas: "PortalRevogarImagem", passos: [{ clicar: "Termos e uso de imagem", seExistir: true }, { clicar: "Revogar" }], informacoesCanvas: true, limiteCanvas: { 1440: 0.75, motivo: "fundo: a janela confere com o canvas; atrás dela o canvas mostra só o cartão Termos, e o sistema mostra Minhas informações inteira (medido a 73,6% na #498; a #642 remove este limite)" } },
  { nome: "turma-desativar", rota: "/turmas/00000000-0000-0000-0000-000000000602", perfil: ana, canvas: "TurmaDesativar", passos: [{ clicar: "Desativar" }] },
  { nome: "turma-nova", rota: "/turmas", perfil: ana, canvas: "TurmaEditar", passos: [{ clicar: "Nova turma" }] },
  { nome: "turma-editar", rota: "/turmas/00000000-0000-0000-0000-000000000601", perfil: ana, canvas: "TurmaEditar", passos: [{ clicar: "Editar" }, { preencher: ["Término de Segunda-feira", "21:00"] }] },
  { nome: "turma-titular-inativo", rota: "/turmas/00000000-0000-0000-0000-000000000607", perfil: ana, canvas: "TurmaTitularInativo", titularInativo: true, passos: [{ clicar: "Editar" }] },
  { nome: "turma-painel", rota: "/turmas/00000000-0000-0000-0000-000000000601", perfil: ana, canvas: "TurmaPainel" },
  { nome: "agenda-aula-avulsa", rota: "/agenda", perfil: ana, canvas: "AulaAvulsa", passos: [{ clicar: "Nova aula avulsa" }], limiteCanvas: { 1440: 0.51, motivo: "medido a 49,0%: fundo: a agenda atrás tem outra semana e outras aulas (dados do MSW); a #560 trata a tela e remove esta exceção" } },
  // Janelas da aula (#473). Hoje no teste é 29/10/2026: a futura é a de segunda, 02/11; a concluída, a de quarta, 28/10; a cancelada, a da Judô Infantil de hoje. GMAulaPainel, GMAulaCancelar e GMAulaEditar têm 360 px (D5 da #435).
  { nome: "aula-cancelar", rota: "/agenda/aulas/00000000-0000-0000-0000-000000000601-2026-11-02-19:00", perfil: ana, canvas: "AulaCancelar", passos: [{ clicar: "Cancelar aula" }], limiteCanvas: { 1440: 0.57, motivo: "medido a 56,0%: fundo: a janela abre a partir do painel, então a gaveta da aula fica atrás (o canvas mostra só a agenda) e a agenda tem outras aulas (dados do MSW); a #560 trata a tela e remove esta exceção" } },
  { nome: "aula-editar", rota: "/agenda/aulas/00000000-0000-0000-0000-000000000601-2026-11-02-19:00", perfil: ana, canvas: "AulaEditar", passos: [{ clicar: "Editar" }], limiteCanvas: { 1440: 0.55, motivo: "medido a 53,9%: fundo: a janela abre a partir do painel, então a gaveta da aula fica atrás (o canvas mostra só a agenda) e a agenda tem outras aulas (dados do MSW); a #560 trata a tela e remove esta exceção" } },
  { nome: "aula-editar-seguintes", rota: "/agenda/aulas/00000000-0000-0000-0000-000000000601-2026-11-02-19:00", perfil: ana, canvas: "AulaEditarSeguintes", passos: [{ clicar: "Editar" }, { clicar: "Esta e as seguintes", papel: "radio" }], limiteCanvas: { 1440: 0.55, motivo: "medido a 53,5%: fundo: a janela abre a partir do painel, então a gaveta da aula fica atrás (o canvas mostra só a agenda) e a agenda tem outras aulas (dados do MSW); a #560 trata a tela e remove esta exceção" } },
  { nome: "aula-corrigir", rota: "/agenda/aulas/00000000-0000-0000-0000-000000000601-2026-10-28-19:00", perfil: ana, canvas: "AulaCorrigir", passos: [{ clicar: "Corrigir professor" }], limiteCanvas: { 1440: 0.65, motivo: "medido a 63,2%: fundo: a janela abre a partir do painel, então a gaveta da aula fica atrás (o canvas mostra só a agenda) e a agenda tem outras aulas (dados do MSW); a #560 trata a tela e remove esta exceção" } },
  { nome: "aula-avisar-turma", rota: "/agenda/aulas/00000000-0000-0000-0000-000000000602-2026-10-29-18:00", perfil: ana, canvas: "AulaAvisarTurma", feriadoHoje: true, passos: [{ clicar: "Avisar turma" }], limiteCanvas: { 1440: 0.53, motivo: "medido a 51,8%: fundo: a janela abre a partir do painel, então a gaveta da aula fica atrás (o canvas mostra só a agenda) e a agenda tem outras aulas (dados do MSW); a #560 trata a tela e remove esta exceção" } },
  { nome: "dia-sem-aula-novo", rota: "/dias-sem-aula", perfil: ana, canvas: "DiaSemAulaNovo", dias: true, passos: [{ clicar: "Novo dia sem aula" }, { preencher: ["De *", "2026-12-24"] }, { preencher: ["Até (opcional)", "2027-01-03"] }, { preencher: ["Motivo *", "Recesso de fim de ano"] }] },
  // Planos, alunos, matrícula, benefícios e termos (#421). Janelas abrem pelos passos.
  // Sem caso: trocar turma/plano, transferir, encerrar e passos da matrícula (id gerado ou fluxo longo no MSW); GM* são as mesmas telas a 390 px (D1).
  { nome: "plano-novo", rota: "/planos", perfil: ana, canvas: "PlanosRegras", passos: [{ clicar: "Novo plano" }], limiteCanvas: { 1440: 0.54, motivo: "medido a 52,7%: fundo e dados: a lista atrás tem 11 linhas do cenário do MSW (o canvas, 4 ou 5 da unidade) e o fundo do canvas desta tela difere do canvas Planos; a estrutura da janela confere lado a lado (capturas em .capturas/480); removido pela #577" } },
  { nome: "plano-editar", rota: "/planos", perfil: ana, canvas: "PlanosRegras", passos: [{ clicar: "Editar o plano Adulto 3x" }, { preencher: ["Novo valor *", "19500"] }], aguardar: "#plan-form", limiteCanvas: { 1440: 0.45, motivo: "medido a 43,4%: fundo e dados: a lista atrás tem 11 linhas do cenário do MSW (o canvas, 4 ou 5 da unidade) e o fundo do canvas desta tela difere do canvas Planos; a estrutura da janela confere lado a lado (capturas em .capturas/480); removido pela #577" } }, // #480: com valor novo, como no canvas, para mostrar o aviso e as escolhas do reajuste
  { nome: "plano-desativar", rota: "/planos", perfil: ana, canvas: "PlanoDesativar", passos: [{ clicar: "Editar o plano Adulto livre" }, { clicar: "Desativar plano" }], limiteCanvas: { 1440: 0.63, motivo: "medido a 61,3%: fundo e dados: a lista atrás tem 11 linhas do cenário do MSW (o canvas, 4 ou 5 da unidade) e o fundo do canvas desta tela difere do canvas Planos; a estrutura da janela confere lado a lado (capturas em .capturas/480); removido pela #577" } },
  { nome: "plano-desativado", rota: "/planos", perfil: ana, canvas: "PlanoDesativado", passos: [{ clicar: "Editar o plano Adulto 2x \\(antigo\\)" }], aguardar: "#plan-history-title", limiteCanvas: { 1440: 0.47, motivo: "medido a 45,4%: fundo e dados: a lista atrás tem 11 linhas do cenário do MSW (o canvas, 4 ou 5 da unidade) e o fundo do canvas desta tela difere do canvas Planos; a estrutura da janela confere lado a lado (capturas em .capturas/480); removido pela #577" } },
  { nome: "beneficio-conceder", rota: "/beneficios", perfil: ana, canvas: "BeneficioConceder", beneficios: "davi", passos: [{ clicar: "Conceder benefício" }, ...escolhaDavi, { preencher: ["Percentual", "70"] }, { escolher: ["Decidido por *", "Marcos Leão"] }, { preencher: ["Validade", "2026-12-31"] }, { preencher: ["Motivo *", "Atleta da equipe kids · campeão estadual"] }] },
  { nome: "beneficio-substituir", rota: "/beneficios", perfil: ana, canvas: "BeneficioSubstituir", beneficios: "marina", passos: [{ clicar: "Conceder benefício" }, { preencher: ["Buscar aluno pelo nome (mínimo 2 letras)", "Marina" ] }, { clicar: "Marina Teixeira" }, { escolher: ["Modalidade", "Jiu-Jitsu"] }, { preencher: ["Percentual", "50"] }, { escolher: ["Decidido por *", "Ana"] }, { preencher: ["Motivo *", "Auxilia na turma Kids"] }, { clicar: "Conceder benefício" }], limiteCanvas: { 1440: 0.58, motivo: "medido a 56,4%: fundo: o canvas mostra a tela de Planos atrás da janela de confirmação, e o sistema abre a confirmação sobre a janela Conceder benefício (que continua aberta para o \"Manter o atual\" voltar ao formulário preenchido, D9); a estrutura da janela confere lado a lado (capturas em .capturas/481); removido pela #577" } },
  { nome: "beneficio-encerrar", rota: "/beneficios", perfil: ana, canvas: "BeneficioEncerrar", beneficios: "lista", passos: [{ clicar: "Encerrar o benefício de Marina Teixeira" }, { preencher: ["Motivo *", "Indicações não se matricularam"] }] },
  // Cobranças, comunicação, notificações e pedidos (#422). Janelas abrem pelos passos.
  // Sem caso: recusar pedido e recusar comprovante (o MSW não tem pedido nem comprovante em aberto), recibo público (o MSW começa sem recibo, o código nasce no pagamento), painel da cobrança, registrar pagamento, cancelar, alterar vencimento e renegociar (id gerado ou fluxo longo), lembrete (seleção em lote) e imagem do comprovante; GM* são as mesmas telas a 390 px (D1).
  { nome: "cobranca-avulsa", rota: "/cobrancas", perfil: ana, canvas: "CobrancaAvulsa", passos: [{ clicar: "Nova cobrança" }], limiteCanvas: { 1440: 0.67, motivo: "medido a 65,3%: dados e fundo: o canvas mostra outra cobrança, outra unidade e a lista atrás com 12 linhas e filtros do mês; a estrutura da janela confere lado a lado (capturas em .capturas/477); removido pela #573" } },
  { nome: "cobranca-antecipar", rota: "/cobrancas/previa", perfil: ana, canvas: "GerarProximas", passos: [{ clicar: "Gerar próximas mensalidades" }], limiteCanvas: { 1440: 0.64, motivo: "medido a 62,4%: dados e fundo: o canvas mostra outra cobrança, outra unidade e a lista atrás com 12 linhas e filtros do mês; a estrutura da janela confere lado a lado (capturas em .capturas/477); removido pela #573" } },
  { nome: "notificacoes", rota: "/alunos", perfil: ana, canvas: "Notificacoes", passos: [{ clicar: "Notificações" }] },
  // Janelas de ação com os blocos Resumo, Motivo e cartões de escolha (#461). Bruno (cenário do MSW) tem cobrança em aberto ligada à modalidade.
  { nome: "cobranca-cancelar", rota: "/cobrancas", perfil: ana, canvas: "CobrancaCancelar", passos: [{ clicar: "Abrir cobrança de" }, { clicar: "Cancelar cobrança" }], limiteCanvas: { 1440: 0.72, motivo: "medido a 70,4%: dados e fundo: o canvas mostra outra cobrança, outra unidade e a lista atrás com 12 linhas e filtros do mês; a estrutura da janela confere lado a lado (capturas em .capturas/477); removido pela #573" } },
  { nome: "cobranca-painel", rota: "/cobrancas", perfil: ana, canvas: "CobrancaPainel", passos: [{ clicar: "Abrir cobrança de" }], limiteCanvas: { 1440: 0.47, motivo: "medido a 45,4%: dados e fundo: o canvas mostra outra cobrança, outra unidade e a lista atrás com 12 linhas e filtros do mês; a estrutura da janela confere lado a lado (capturas em .capturas/477); removido pela #573" } },
  { nome: "cobranca-registrar", rota: "/cobrancas", perfil: ana, canvas: "PagamentoRegistrar", passos: [{ clicar: "Abrir cobrança de" }, { clicar: "Registrar pagamento" }], limiteCanvas: { 1440: 0.61, motivo: "medido a 59,9%: dados e fundo: o canvas mostra outra cobrança, outra unidade e a lista atrás com 12 linhas e filtros do mês; a estrutura da janela confere lado a lado (capturas em .capturas/477); removido pela #573" } },
  { nome: "cobranca-renegociar", rota: "/cobrancas", perfil: ana, canvas: "Renegociar", passos: [{ clicar: "Abrir cobrança de" }, { clicar: "Renegociar" }], limiteCanvas: { 1440: 0.58, motivo: "medido a 56,5%: dados e fundo: o canvas mostra outra cobrança, outra unidade e a lista atrás com 12 linhas e filtros do mês; a estrutura da janela confere lado a lado (capturas em .capturas/477); removido pela #573" } },
  { nome: "aluno-encerrar-modalidade", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "EncerrarModalidade", passos: [{ clicar: "Matrícula", papel: "tab" }, { clicar: "Encerrar" }], limiteCanvas: { 1440: 0.53, motivo: "janela ou fundo: a ficha atrás tem outro conteúdo e dados que a API não traz (D1 da #467) e o canvas traz outras cobranças; medido a 51,2% na #468; a #739 remove este limite" } },
  { nome: "aluno-trocar-turma", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "TrocarTurma", passos: [{ clicar: "Matrícula", papel: "tab" }, { clicar: "Trocar turma" }], limiteCanvas: { 1440: 0.60, motivo: "medido a 58,3%: janela ou fundo: a ficha atrás tem outro conteúdo e a ocupação e os horários das turmas vêm do MSW, não do canvas (D7 da #468); a #739 remove este limite" } },
  { nome: "aluno-trocar-plano", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "TrocarPlano", passos: [{ clicar: "Matrícula", papel: "tab" }, { clicar: "Trocar plano" }], limiteCanvas: { 1440: 0.64, motivo: "medido a 62,2%: janela ou fundo: sem a linha de taxa por meio de pagamento no Resumo (D3 da #468) e a ficha atrás tem outro conteúdo; a #739 remove este limite" } },
  { nome: "aluno-transferir-modalidade", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "TransferirModalidade", passos: [{ clicar: "Matrícula", papel: "tab" }, { clicar: "Transferir" }], limiteCanvas: { 1440: 0.60, motivo: "medido a 58,3%: janela ou fundo: a unidade de destino ainda não foi escolhida no print e a ficha atrás tem outro conteúdo (D4 da #468); a #739 remove este limite" } },
  { nome: "aluno-desligar-responsavel", rota: "/alunos/00000000-0000-0000-0000-000000000727", perfil: ana, canvas: "ResponsavelDesligar", passos: [{ clicar: "Responsáveis", papel: "tab" }, { clicar: "Desligar" }], limiteCanvas: { 1440: 0.67, motivo: "medido a 65,5%: janela ou fundo: a ficha atrás tem outro conteúdo e o cartão do responsável fica para a #739, que remove este limite" } },
  // Telas do canvas já construídas que o MSW alcança por rota (#435). Fora delas, ver semCaso.
  { nome: "inicio-professor", rota: "/", perfil: prof, canvas: "ProfessorInicio" },
  { nome: "matricula-aluno", rota: "/alunos/nova-matricula", perfil: ana, canvas: "MatriculaAluno" },
  { nome: "matricula-modalidades", rota: matriculaRota, perfil: ana, canvas: "MatriculaModalidades", oferta: true, passos: modalidade },
  { nome: "matricula-vencimento", rota: matriculaRota, perfil: ana, canvas: "MatriculaVencimento", oferta: true, passos: [...modalidade, { clicar: "Continuar" }, { clicar: "Dia 5", papel: "radio" }] },
  { nome: "matricula-resumo", rota: matriculaRota, perfil: ana, canvas: "MatriculaResumo", oferta: true, passos: [...modalidade, { clicar: "Continuar" }, { clicar: "Dia 5", papel: "radio" }, { clicar: "Continuar" }] },
  { nome: "matricula-concluida", rota: matriculaRota, perfil: ana, canvas: "MatriculaConcluida", oferta: true, passos: [...modalidade, { clicar: "Continuar" }, { clicar: "Dia 5", papel: "radio" }, { clicar: "Continuar" }, { clicar: "Concluir matrícula" }] },
  { nome: "conta-aluno-pagina", rota: "/conta", perfil: aluno, canvas: "PortalConta", canvasCelular: "PortalMConta", informacoesCanvas: true },
  { nome: "portal-editar-contato", rota: "/portal/minhas-informacoes", perfil: aluno, canvas: "PortalMEditar", canvasCelular: "PortalMEditar", informacoesCanvas: true, passos: [{ clicar: "Editar(?: contato)?$" }] },
  { nome: "portal-familia", rota: "/portal/financeiro", perfil: familia, canvas: "PortalFamilia", canvasCelular: "PortalMFamilia" },
  { nome: "portal-reduzido-info", rota: "/portal/minhas-informacoes", perfil: reduzido, canvas: "PortalReduzidoInfo" },
  // Professor (#443): painel da aula e ficha pela aula, com STUDENT_RECORD ligada no MSW. Aula de segunda, 02/11/2026, da turma Jiu-Jitsu Adulto.
  { nome: "agenda-painel-professor", rota: "/agenda/aulas/00000000-0000-0000-0000-000000000601-2026-11-02-19:00", perfil: prof, canvas: "AgendaPainelProfessor", matricula: true },
  { nome: "ficha-professor", rota: "/agenda/aulas/00000000-0000-0000-0000-000000000601-2026-11-02-19:00/alunos/00000000-0000-0000-0000-000000000701", perfil: prof, canvas: "FichaProfessor", matricula: true, limiteCanvas: { 1440: 0.43, motivo: "conteúdo da ficha: a agenda e a gaveta já são as do canvas (agenda visível atrás); sobra o miolo da ficha do Professor (abas Resumo e Responsáveis, gaveta de 680 px) contra os cartões Dados e Modalidades do canvas, em gaveta de 600 px (medido a 41,9% na #472; pedido de ajuste registrado no item 472, removido pela #558)" } },
  // Ficha do aluno e janela Editar dados pessoais (#466). GMFicha e GMAlunoEditar têm 360 px: a comparação a 390 px é pelas capturas (D5 da #435).
  { nome: "ficha-aluno", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "AlunoDetalhes", limiteCanvas: { 1440: 0.38, motivo: "ficha: o canvas traz Pendências de bloqueio, coluna Faixa, termo aceito e botões no canto do cabeçalho, que dependem da inativação, das graduações e do aceite do termo (D3 e D5 da #466; Sprint 12), e a lista atrás tem outros dados e altura (medido a 36,3% na #466); a #739 remove este limite" } },
  { nome: "aluno-editar", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "AlunoEditar", passos: [{ clicar: "Editar dados pessoais" }], limiteCanvas: { 1440: 0.53, motivo: "janela ou fundo: o sistema mantém o bloco de foto e o campo Número (D6 da #466), omite a Última alteração (a API do aluno não traz esse dado) e a ficha atrás tem outro conteúdo (medido a 51,9% na #466); a #739 remove este limite" } },
  // Abas da ficha do aluno (#467): AlunoMatricula, AlunoFinanceiro, AlunoGraduacoes, AlunoHistorico e AlunoResponsaveis. GMFicha* têm 360 px (D5 da #435).
  { nome: "ficha-aluno-matricula", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "AlunoMatricula", passos: [{ clicar: "Matrícula", papel: "tab" }], limiteCanvas: { 1440: 0.38, motivo: "ficha: Benefício, Mensalidade, dias e horários da turma e o valor do plano: o canvas traz dados que a API não traz (D1 da #467) e a lista atrás tem outro conteúdo; a #739 remove este limite" } },
  { nome: "ficha-aluno-financeiro", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "AlunoFinanceiro", passos: [{ clicar: "Financeiro", papel: "tab" }], limiteCanvas: { 1440: 0.39, motivo: "ficha: as cobranças e os valores do canvas são outros e a lista atrás tem outro conteúdo: o canvas traz dados que a API não traz (D1 da #467) e a lista atrás tem outro conteúdo; a #739 remove este limite" } },
  { nome: "ficha-aluno-graduacoes", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "AlunoGraduacoes", passos: [{ clicar: "Graduações", papel: "tab" }], limiteCanvas: { 1440: 0.37, motivo: "ficha: sem linha do tempo de graduações (D4 da #467): o canvas traz dados que a API não traz (D1 da #467) e a lista atrás tem outro conteúdo; a #739 remove este limite" } },
  { nome: "ficha-aluno-responsaveis", rota: "/alunos/00000000-0000-0000-0000-000000000727", perfil: ana, canvas: "AlunoResponsaveis", passos: [{ clicar: "Responsáveis", papel: "tab" }], limiteCanvas: { 1440: 0.38, motivo: "ficha: parentesco, CPF mascarado e situação do portal do responsável: o canvas traz dados que a API não traz (D1 da #467) e a lista atrás tem outro conteúdo; a #739 remove este limite" } },
  { nome: "ficha-aluno-historico", rota: "/alunos/00000000-0000-0000-0000-000000000721", perfil: ana, canvas: "AlunoHistorico", passos: [{ clicar: "Histórico", papel: "tab" }], limiteCanvas: { 1440: 0.37, motivo: "ficha: o histórico do MSW tem poucas ações e a lista atrás tem outro conteúdo: o canvas traz dados que a API não traz (D1 da #467) e a lista atrás tem outro conteúdo; a #739 remove este limite" } },
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
    "InicioCoordenador", "AguardandoAprovacao", "SuporteAcesso",
    "PortalMExcluir",
  ],
  // tela de funcionalidade ainda sem rota em App.tsx (sprint futura)
  "tela de funcionalidade ainda sem rota em App.tsx (sprint futura)": [
    "Busca", "FaixasTopo", "Experimentais", "Graduacoes", "GraduacaoLote", "Financeiro",
    "Relatorios", "RelatoriosAlunos", "RelatoriosExperimentais", "RelatoriosAulas", "RelatorioConsolidado", "RelatorioProfessor",
    "ConfigAssinatura", "Historico", "ImportarDados",
    "ConvitesPortal", "Ajuda", "AjudaTour", "Novidades", "PortalMInstalar",
    "PortalMPush",
  ],
  // janela, painel, ficha ou etapa que o MSW não alcança por rota ou passo (id gerado, fluxo longo ou dado ausente)
  "janela, painel, ficha ou etapa que o MSW não alcança por rota ou passo (id gerado, fluxo longo ou dado ausente)": [
    "BuscaVazia","EstadoCarregando", "EstadoSemResultados", "ExportarAlunos",
    "AlunoInativar", "AlunoReativar",
    "AlunoAnonimizar",
    "PedidoEncerramentoRecusar",
    "EstadoVazio", "ExperimentalAgendar", "ExperimentalPainel",
    "GraduacaoRegistrar", "ExportarGraduacoes", "SomenteLeitura",
    "Estornar", "ExportarMensalidades",
    "ExportarRelatorios",
    "AssinaturaCancelar", "AuditoriaPainel", "ImportarGraduacoes", "ImportarPagamentos",
    "AlunosImportar", "PacoteCompleto", "FalarSuporte", "PortalExcluir",
    "PortalEstados", "PortalMCarteirinha", "PortalMEstados",
  ],
  // tela antiga que a #611 substituiu: os casos "administradores*" não têm canvas (a tela Pessoas › Administradores nasceu depois do desenho)
  "tela antiga que a #611 substituiu (Configurações › Usuários); o canvas ainda não foi redesenhado": ["ConfigUsuarios", "UsuarioConvidar"],
  // celular a 360 px: o teste visual captura 390 (D5 da #435)
  "celular a 360 px: o teste visual captura 390 (D5 da #435)": [
    "GMInicio", "GMBusca", "GMInicioCoord", "GMInicioProfessor", "GMNotificacoes",
    "GMAlunos", "GMFicha", "GMFichaMatricula", "GMFichaFinanceiro",
    "GMFichaResponsaveis", "GMAlunoEditar", "GMEncerrar", "GMAgenda", "GMAulaPainel", "GMAulaEditar",
    "GMAulaCancelar", "GMDiasSemAula", "GMAgendaProfessor", "GMAulaProfessor", "GMCobrancas", "GMPagamento",
    "GMMatricula1", "GMMatricula2", "GMMatricula4", "GMProfessores", "GMProfessorPainel", "GMPedidos",
    "GMPedidoRecusar", "GMTurmas", "GMTurmaPainel", "GMExperimentais", "GMExperimental", "GMGraduacoes",
    "GMGraduar", "GMFinanceiro", "GMCobrancaPainel", "GMRenegociar", "GMConferencia", "GMPlanos",
    "GMComunicados", "GMNovoComunicado",
    "GMRelatorios", "GMConfig", "GMConfigUnidade", "GMUsuarios",
    "GMAuditoria", "GMAssinatura", "GMSomenteLeitura", "GMSemAcesso", "GMErro",
  ],
  // pagamento do portal: depende de cobrança em aberto e do pagamento simulado, que o MSW não deixa em estado fixo
  "pagamento do portal: depende de cobrança em aberto e do pagamento simulado, que o MSW não deixa em estado fixo": [
    "PortalPagamento", "PortalPix", "PortalBoleto", "PortalPagamentoOk", "PortalPagamentoErro",
    "PortalDebito", "PortalComprovanteVarias", "PortalMPagamento", "PortalMPix", "PortalMBoleto", "PortalMPagamentoOk",
    "PortalMCartaoRecusado", "PortalMDebito",
  ],
};
