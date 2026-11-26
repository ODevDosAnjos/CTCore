# 721 — 646e · Cabeçalhos sem subtítulo: Configurações, conta e portal

Origem: issue #721 (parte e da #646, RNF-45 em `docs/especificacao/00-visao-geral.md`; decisões 33 e 34 de `docs/auditoria/decisoes-canvas.md`). Branch: `item/721-cabecalhos-config-conta-portal`. Item-mãe: `specs/itens/646-cabecalhos-sem-subtitulo.md`.
Tempos: especificar 4

## Item-mãe: dividido em partes

O dono aprovou a divisão em 26/11/2026 (P11). **A #721 não tem construção, verificação nem PR próprios.** Cada parte tem a sua issue, o seu PR e o seu arquivo de item, escrito quando ela chega ao `especificar`; os requisitos e critérios abaixo são o ponto de partida das duas.

| Parte | Issue | Requisitos de partida | Arquivo do item |
|---|---|---|---|
| a | #732 (primeiro) | R1 a R4; de R10 e R11, o que toca as telas dela; CA1 a CA3, CA8, CA9 | a especificar |
| b | #733 | R5 a R9, R12; de R10 e R11, o que toca as telas dela; CA4 a CA10 | a especificar |

A #721 fecha no merge da #733, que também fecha a #646 (o PR traz `Closes #733`, `Closes #721` e `Closes #646`). A #714 depende da #733.

## 1. Objetivo

Tirar o subtítulo com a unidade, as contagens soltas, as frases e as notas de regra interna de Configurações, Administradores, Minha conta, duas etapas, convite e portal, e fazer a conferência final tela por tela de toda a #646 (gestão e portal), fechando a #646. Fora: mudar layout, API ou regra de negócio; redesenhar Minha conta (#630), Início (#122 a #124) e a tabela de permissões.

**Tamanho (motivo da divisão).** Cerca de 46 arquivos contáveis (27 de código, 18 de teste e o `pt-BR.json`), acima do limite de 30 do `AGENTS.md`. Só os subtítulos de cabeçalho, sem as notas e o portal, já dariam cerca de 21. Divisão aprovada (P11), cada parte com a sua issue e o seu PR, deixando a `dev` verde:

| Parte | Telas | Estimativa |
|---|---|---|
| #721a | Organização (com a nota do cartão da marca), Administradores, tabela de permissões, índice de Configurações, Unidades (lista, nova, configuração), Termos, Textos e Início (linha da unidade) | cerca de 22 (12 de código, 9 de teste, `pt-BR.json`) |
| #721b | Minha conta, duas etapas, convite, varredura do portal e a conferência final tela por tela; fecha a #721 e a #646 | cerca de 25 (15 de código, 9 de teste, `pt-BR.json`) |

## 2. Requisitos

- R1: Os cabeçalhos de Organização, Tabela de permissões, Unidades, Nova unidade, configuração da unidade, Termos e Textos ficam sem subtítulo (`organization.subtitle`, `permissionsTable.subtitle`, `units.subtitle_*`, `units.new.subtitle`, `unitSettings.subtitle`, `terms.subtitle`, `texts.subtitle`); título, "Última alteração" e ações continuam.
- R2: Administradores perde o subtítulo (`administrators.subtitle`); o total "Vagas ativas: R$ …/mês", pedido pela especificação da #611, sai do cabeçalho e vira uma linha no corpo da tela, com o mesmo texto; o custo por linha não muda.
- R3: O Início da gestão perde a linha "Unidade: …" / "Você está vendo todas as unidades, só para consulta." (`ScopeLine`, `unitScope.scopeOne`, `unitScope.scopeAll`): a unidade está no seletor da moldura.
- R4: Saem as notas de regra de Configurações: `organization.brandNote`, `terms.imageNote`, `units.shortNameNote` (a janela "Ajustar o nome curto" já diz que só se ajusta uma vez e que o endereço antigo leva ao novo) e `settingsIndex.adminNote`.
- R5: Minha conta da gestão perde o subtítulo "nome · perfil da unidade" (`account.subtitle_*`, `account.subtitleNoUnits`); saem as notas `account.access.note` (a janela Trocar e-mail já traz o resumo), `account.sessions.note`, `account.sessions.notePortal` e `account.twoFactor.note`; o cartão de perfil do celular não muda.
- R6: A janela de ativar duas etapas fica sem subtítulo (`twoFactor.setup.subtitle`).
- R7: No portal saem os subtítulos de Carteirinhas (`portalCard.familyText`), Pedidos (`portalOwn.intro`, `introShort`) e da janela Nova modalidade (`portalConfirm.subtitle`); o `PortalHeading` perde a propriedade `subtitle`, que fica sem uso. No Financeiro da família, "R$ … em aberto" sai do cabeçalho e vira linha no corpo, com o mesmo texto (o valor devido não é contagem solta, RN-POR-05).
- R8: No portal saem as notas `portalFinance.open.subtitle` ("vencidas primeiro"), `portalAgenda.note`, `portalAnnouncements.hint`, `portalAnnouncements.readNote` e `portalCard.installedNote`.
- R9: No Termo de matrícula do portal, a introdução continua (diz de quem é o termo e que o aceite libera o portal), sem as frases "Você aceita uma vez." e "Você aceita uma vez, por {{student}}."; a de vários alunos não muda.
- R10: Ficam: o subtítulo do convite e das telas de entrada (identificam o convite, o prazo ou o passo); dicas junto de campo, chave ou opção (formato, consequência da escolha, custo e "sem devolução" antes de confirmar, motivo de botão desabilitado, legenda da tabela de permissões); avisos de estado com orientação (`portalFinance.reduced.note*`, `portalInfo.reducedNote`, `organization.readOnly`, `texts.welcomeNote`, `texts.editor.linkNote`); e os subtítulos de painel ou janela que identificam o registro.
- R11: Chaves sem uso saem do `pt-BR.json`; quatro estados, rotas e API não mudam; padrão de rotas e telas do `AGENTS.md`; só as referências visuais das telas mexidas são regeradas, com a comparação com o canvas (1440 e 390 px).
- R12: A conferência final lista, tela por tela, toda a #646 (gestão e portal) na descrição do PR da última parte. Varredura de código feita nesta fase: nas telas das partes a a d, os subtítulos que restam são os que identificam o registro (painéis de aula, turma, professor, plano e cobrança; janela de desligar responsável), a data de Recebimentos do dia e o limite de comunicados quando faltam 5 ou menos.

## 3. Critérios de aceite

- CA1 (R1, R2): dado o Coordenador em cada tela de R1 e em Administradores, quando ela abre (1440 e 390 px), então o cabeçalho não tem subtítulo; em Administradores o total das vagas aparece no corpo.
- CA2 (R3): dado o Início da gestão com uma unidade escolhida ou em "Todas as unidades", então não há linha de unidade abaixo do título.
- CA3 (R4): dadas Organização, Termos, Unidades e o índice de Configurações (Coordenador e Administrador), então as notas de R4 não aparecem, e a janela Ajustar o nome curto continua com o aviso.
- CA4 (R5, R6): dados `/conta` (gestão e portal, nas abas e no celular) e a janela de ativar duas etapas, então o subtítulo e as notas de R5 e R6 não aparecem, e o Coordenador continua sem "Desligar".
- CA5 (R7): dado um responsável em Carteirinhas, Pedidos e Financeiro da família, e a janela Nova modalidade, então o cabeçalho não tem subtítulo; no Financeiro o total em aberto aparece no corpo.
- CA6 (R8): dados Financeiro, Agenda, Avisos, um aviso aberto e Carteirinha do portal, então as notas de R8 não aparecem.
- CA7 (R9): dado o termo pendente de adulto e de responsável, então a introdução aparece sem "Você aceita uma vez".
- CA8 (R10): dados o convite válido, o portal reduzido e as janelas de custo de Administrador, então os textos de R10 continuam.
- CA9 (R11): `npm run lint`, `npm run typecheck` e `npm test` passam, `grep` das chaves removidas em `src`, `e2e` e `visual` não acha uso e os casos visuais das telas mexidas batem com as referências regeradas.
- CA10 (R12): a descrição do PR traz a lista tela por tela de toda a #646.
