# 733 — 721b · Cabeçalhos sem subtítulo: conta, duas etapas, convite e portal (fecha a #646)

Origem: issue #733 (parte b da #721, parte e da #646; RNF-45 em `docs/especificacao/00-visao-geral.md`; decisões 33 e 34 de `docs/auditoria/decisoes-canvas.md`). Branch: `item/733-cabecalhos-conta-portal`. Requisitos de partida: `specs/itens/721-cabecalhos-config-conta-portal.md`. Modelo: `specs/itens/732-cabecalhos-config-administradores-inicio.md`.
Tempos: especificar 4 · construir 46 (1 correção) · verificar 28 (regressão 23) (2 rodadas) · entregar 2
Comparação com o canvas: 8

## 1. Objetivo

Tirar o subtítulo com a unidade, as contagens soltas, as frases e as notas de regra interna de Minha conta (gestão e portal), da janela de ativar duas etapas, do convite e do portal, apagar do `pt-BR.json` as chaves sem uso e fazer a conferência final tela por tela de toda a #646, fechando a #721 e a #646.

Fora do escopo: mudar layout, API ou regra de negócio; redesenhar Minha conta (#630); a tela Pedidos do portal e o resto da gestão além do que a conferência acha (R7, R8).

## 2. Requisitos

- R1: Minha conta da gestão fica sem o subtítulo "nome · perfil da unidade", e Minha conta (gestão e portal) sem as notas do cartão Acesso, das Sessões (as duas) e das duas etapas; o cartão de perfil do celular não muda.
- R2: A janela de ativar duas etapas fica sem subtítulo.
- R3: Carteirinhas, Pedidos do portal do aluno e a janela Nova modalidade ficam sem subtítulo, e o `PortalHeading` perde a propriedade `subtitle`; no Financeiro da família, "R$ … em aberto" sai do cabeçalho e vira uma linha no corpo, com o mesmo texto e na mesma condição. (D4)
- R4: No portal saem "vencidas primeiro" (Em aberto) e as notas da Agenda, da lista de Avisos, do aviso aberto e da Carteirinha.
- R5: No Termo de matrícula do portal, a introdução do adulto e a do responsável continuam sem "Você aceita uma vez." e "Você aceita uma vez, por {{student}}."; a de vários alunos não muda.
- R6: Ficam: o subtítulo do convite e das telas de entrada; dicas junto de campo, chave ou opção (formato, consequência, custo e "sem devolução", motivo de botão desabilitado); avisos de estado com orientação (`portalFinance.reduced.note*`, `portalInfo.reducedNote`, `organization.readOnly`, `texts.welcomeNote`, `texts.editor.linkNote`); e subtítulos de painel ou janela que identificam o registro. (D5)
- R7: O portal reduzido fica sem o rótulo "Unidade {{unit}}" acima da saudação, e nome de unidade que já começa por "Unidade" não repete a palavra no convite com uma unidade, em "Unidade … criada.", no destino de comunicado e no destino do aviso de aula. (D1, D3)
- R8: Pedidos do portal na gestão ficam sem a nota de rodapé "Pedidos sem resposta expiram em 30 dias…". (D2)
- R9: Chaves sem uso saem do `pt-BR.json`; quatro estados, rotas e API não mudam e o padrão de rotas e telas do `AGENTS.md` é seguido; os testes passam a conferir a ausência; só as referências visuais das telas mexidas são regeradas, com a comparação com o canvas (1440 e 390 px, pt-BR).
- R10: A descrição do PR traz a conferência final tela por tela de toda a #646 (gestão e portal), com as divergências do canvas, e `Closes #733`, `Closes #721` e `Closes #646`.

## 3. Critérios de aceite

- CA1 (R1): dado `/conta` na gestão (Coordenador e Administrador, nas abas e no celular), então não há subtítulo no cabeçalho nem as notas de Acesso, Sessões e duas etapas; no celular sem `aba`, o cartão de perfil continua com "perfil · unidades"; o Coordenador continua sem "Desligar".
- CA2 (R1): dado `/conta` no portal, então "No portal, a sessão dura 30 dias." não aparece.
- CA3 (R2): dada a janela de ativar duas etapas, então "Obrigatória para o Coordenador · configurada no primeiro acesso" não aparece, e os passos e o aviso dos códigos de reserva continuam.
- CA4 (R3): dados um responsável em Carteirinhas, Pedidos (1440 e 390 px) e a janela Nova modalidade, então não há subtítulo; no Financeiro em "Toda a família", "R$ … em aberto" aparece uma vez, fora do `header` da página, e na visão de um aluno não aparece.
- CA5 (R4): dados Financeiro, Agenda, Avisos, um aviso aberto e Carteirinha do portal, então os cinco textos de R4 não aparecem.
- CA6 (R5): dado o termo pendente de adulto e de responsável, então a introdução aparece terminando em "para liberar o portal." (adulto) e "o termo de matrícula da {org}." (responsável), sem "Você aceita uma vez".
- CA7 (R6): dados o convite válido e o portal reduzido, então o subtítulo do convite e a nota do acesso reduzido continuam.
- CA8 (R7): dado o Financeiro reduzido, então não há "Unidade Tijuca" e o cartão de contato continua nomeando a unidade; dados um convite com a única unidade "Unidade Principal" e a criação de uma unidade chamada "Unidade 99", então aparecem "Unidade Principal" e "Unidade 99 criada.", sem "Unidade Unidade"; unidade "Centro" continua "Unidade Centro".
- CA9 (R8): dada a lista de Pedidos do portal na gestão, então a nota de rodapé não aparece e o prazo de cada linha continua.
- CA10 (R9): `npm run lint`, `npm run typecheck`, `npm run build` e `npm test` passam e o `grep` das chaves removidas (T5) em `src`, `e2e` e `visual` não acha uso.
- CA11 (R9): os casos visuais da T6 batem com as referências regeradas, `visual:canvas` não reprova nenhum (ou a divergência entra conforme a autonomia 4 do `AGENTS.md`) e os e2e `minha-conta`, `duas-etapas`, `convite` e `portal-*` passam, com as telas dentro da moldura.
- CA12 (R10): a seção "Construção" traz a lista tela por tela de toda a #646, que vai para a descrição do PR com os três `Closes`.

## 4. Plano técnico

- Dados: não muda.
- API: não muda (contrato e MSW inalterados).
- Segurança: não muda (nenhuma permissão, rota ou dado novo).
- Interface (arquivos vistos, em `frontend/src`; `Modal`, `PageHeader` e `AuthShell` mantêm `subtitle`):
  - `features/account/AccountPage.tsx` (`ManagementAccount`): tirar `subtitle` do `PageHeader` (~113).
  - `features/account/useManagementProfile.ts`: tirar o campo `subtitle` e ajustar o comentário; `line` fica.
  - `features/account/AccessCard.tsx` (~38), `SessionsSection.tsx` (~152), `TwoFactorSection.tsx` (~64): tirar o `<p>` da nota.
  - `features/auth/TwoFactorSetupDialog.tsx` (~130): tirar `subtitle` do `Modal`.
  - `features/portal/PortalHeading.tsx`: tirar a propriedade, o `<p>` e o "subtítulo" do comentário.
  - `features/portal/PortalCardPage.tsx`: tirar `subtitle` (~60) e o `<p>` de `installedNote` (~95).
  - `features/portal/PortalRequestsPage.tsx` (~80): tirar `subtitle`; `narrow` continua no "Voltar".
  - `features/portal/ModalityConfirmations.tsx` (~68): tirar `subtitle`.
  - `features/portal/PortalFinancePage.tsx`: `label={reduced ? undefined : t("portalFinance.label")}`; tirar `subtitle` e, logo abaixo do `PortalHeading`, antes dos chips, pôr `<p className="mb-4 text-sm text-muted-foreground">` com `portalFinance.familyTotal` quando `shown && family`. `shell` continua no cartão de contato.
  - `features/portal/PortalOpenCharges.tsx` (~113): tirar `actions` do `Card`.
  - `features/portal/PortalAgendaPage.tsx` (~129), `PortalAnnouncementsPage.tsx` (~142), `PortalAnnouncementView.tsx` (~110): tirar o `<p>` da nota.
  - `features/portal-requests/PortalRequestsPage.tsx` (~178): tirar a propriedade `footer` do `QueryPage`.
  - `i18n/index.ts`: depois do `init`, registrar o formatador `unit` (`i18n.services.formatter?.add("unit", (v) => String(v).replace(/^unidade\s+/i, ""))`).
  - `i18n/pt-BR.json`: usar `{{list, unit}}` em `invite.card.units_one` e `{{name, unit}}` em `units.new.created`, `announcements.target.UNIT` e `announcements.lesson.destUnit` (as telas que usam essas chaves não mudam de código); encurtar `portalTerm.introAdult` e `introGuardian` (`PortalTermPage.tsx` não muda); apagar `account.subtitle_one`, `account.subtitle_other`, `account.subtitleNoUnits`, `account.access.note`, `account.sessions.note`, `account.sessions.notePortal`, `account.twoFactor.note`, `twoFactor.setup.subtitle`, `portalCard.familyText`, `portalCard.installedNote`, `portalOwn.intro`, `portalOwn.introShort`, `portalConfirm.subtitle`, `portalFinance.reduced.label`, `portalFinance.open.subtitle`, `portalAgenda.note`, `portalAnnouncements.hint`, `portalAnnouncements.readNote`, `portalRequests.footerNote`. `portalFinance.familyTotal` fica.
- Testes (12, em `frontend/src/features`): `account/AccountPage.test.tsx` (~65, ~95, ~108, ~284, ~359; ausência do subtítulo da janela de duas etapas junto de ~299), `portal/ModalityConfirmations.test.tsx` (~23), `PortalAgendaPage.test.tsx` (~116, ~225), `PortalAnnouncementsPage.test.tsx` (~111, ~149), `PortalCardPage.test.tsx` (~146, ~181), `PortalFinancePage.test.tsx` (~114, ~262, ~319), `PortalHeading.test.tsx`, `PortalRequestsPage.test.tsx` (~72, ~85), `PortalTermPage.test.tsx` (~84, ~99), `portal-requests/PortalRequestsPage.test.tsx` (~119), `auth/InvitePage.test.tsx` (caso "Unidade Principal"; o de "Unidade Centro" fica), `units/NewUnitPage.test.tsx` (~128, ~214). Nenhum e2e cita texto removido (`portal-finance.spec.ts` usa "R$ 80,00 em aberto", que fica).
- Visual (sem caso novo; `frontend/visual/casos.ts` só muda se precisar de `limiteCanvas`): `conta`, `conta-aluno`, `conta-aluno-pagina`, `conta-celular`, `conta-codigos-reserva`, `conta-duas-etapas`, `conta-notificacoes`, `portal-agenda`, `portal-aviso-aberto`, `portal-avisos`, `portal-carteirinha`, `portal-carteirinha-filhos`, `portal-celular-abas`, `portal-confirmar-modalidade`, `portal-familia`, `portal-financeiro`, `portal-pedido-*`, `portal-pedidos`, `portal-pix-chave`, `portal-reduzido`, `portal-responsavel`, `portal-termo`, `portal-termo-filhos`, `pedidos`, `pedido-recusar`, `pedido-trocar-turma`. A moldura não muda.
- Conferência final: telas das #717 a #720 e #732 (seções "Entrega" ou "Construção" dos arquivos `specs/itens/71[789]*.md`, `720*.md`, `732*.md`) mais as deste item; para cada uma, o que saiu, o que ficou e por quê. Conferir também as chaves listadas na issue #646: as que restam são `charges.panel.compositionNote` (vencimento e geração), `charges.daily.subtitle` (só a data), `payments.dialog.valueLine` (sem a taxa), `announcements.new.subtitle` (só com 5 ou menos), `plans.cards` (sem `*Note`) e, até este item, `twoFactor.setup.subtitle`.
- Reuso: `PageHeader`, `PortalHeading`, `portalFinance.familyTotal`, formatador do i18next (dependência já instalada).
- Riscos: teste que usava o texto removido para esperar o carregamento passa a conferir cedo demais (esperar outro elemento antes de afirmar ausência); o canvas ainda mostra os textos e o `visual:canvas` pode passar do limite; referência fora da lista que mude é erro do item e é investigada.
- Tamanho: 30 arquivos contáveis (17 de código, `pt-BR.json` e 12 de teste), no limite; arquivo a mais pede justificar antes. (D6)

## 5. Tarefas

Duas partes, cada uma construível em uma sessão.

Parte 1: telas

- [x] T1: Minha conta e janela de duas etapas (cinco arquivos de `account/` e `TwoFactorSetupDialog.tsx`), com os testes conferindo a ausência — cobre CA1, CA2, CA3 — prova: `cd frontend && npm test -- AccountPage`
- [x] T2: Portal: `PortalHeading`, Carteirinha, Pedidos, Nova modalidade, Financeiro (total no corpo, sem rótulo no reduzido), Em aberto, Agenda e Avisos, com os testes — cobre CA4, CA5, CA7, CA8 — prova: `cd frontend && npm test -- ModalityConfirmations PortalAgendaPage PortalAnnouncementsPage PortalCardPage PortalFinancePage PortalHeading features/portal/PortalRequestsPage`
- [x] T3: Termo (textos), formatador `unit` com as quatro chaves, e testes de Termo, Convite (subtítulo continua) e Nova unidade — cobre CA6, CA7, CA8 — prova: `cd frontend && npm test -- PortalTermPage InvitePage NewUnitPage`
- [x] T4: Pedidos do portal na gestão: tirar o rodapé e ajustar o teste — cobre CA9 — prova: `cd frontend && npm test -- portal-requests`

Parte 2: fechamento

- [x] T5: Apagar do `pt-BR.json` as chaves da seção 4 — cobre CA10 — prova: `cd frontend && ! grep -rnE "account\.(subtitle|subtitleNoUnits|access\.note|sessions\.note|twoFactor\.note)|twoFactor\.setup\.subtitle|portalCard\.(familyText|installedNote)|portalOwn\.intro|portalConfirm\.subtitle|portalFinance\.(reduced\.label|open\.subtitle)|portalAgenda\.note\b|portalAnnouncements\.(hint|readNote)|portalRequests\.footerNote" src e2e visual && npm run typecheck && npm run lint`
- [x] T6: Capturas do sistema e do canvas em `.capturas/733/` (1440 e 390 px, pt-BR, `<tela>-<largura>-sistema.png` e `-canvas.png`), `visual:canvas`, regerar só as referências da seção 4, registrar `Comparação com o canvas: <min>` e rodar os e2e das telas — cobre CA11 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots --workers=2 -g " (conta[a-z-]*|portal-(agenda|aviso-aberto|avisos|carteirinha[a-z-]*|celular-abas|confirmar-modalidade|familia|financeiro|pedido[a-z-]*|pix-chave|reduzido|responsavel|termo[a-z-]*)|pedidos|pedido-[a-z-]+) (1440|390) " && npm run visual:canvas -- --exige && npm run e2e -- minha-conta duas-etapas convite portal-` (conferir no `git status` que só mudaram referências desses casos)
- [x] T7: Escrever na "Construção" a conferência final tela por tela de toda a #646 (gestão e portal), com a verificação das chaves da issue no `pt-BR.json`; sobra encontrada que caiba no item é corrigida, a que passar dos 30 arquivos vira issue (regra do `AGENTS.md`) — cobre CA12 — prova: conferência da tabela contra os arquivos das #717 a #720 e #732 e `grep` das chaves da #646

## 6. Decisões

- D1 (muda o comportamento): sai o rótulo "Unidade {{unit}}" do Financeiro reduzido. Não está nos requisitos de partida da #721, mas é subtítulo de unidade no cabeçalho, repete "Unidade Unidade Principal" (citado na #646) e a unidade continua no cartão de contato; o canvas `PortalReduzido` o mostra e vale a decisão 33. Alternativa descartada: manter o rótulo só sem a repetição.
- D2 (muda o comportamento): sai a nota de rodapé de Pedidos do portal na gestão. A #718 não a tratou e a conferência final a achou; é nota de regra, o prazo aparece em cada linha ("expira em N dias") e a mensagem ao aluno é pedida na janela de recusa. O canvas `PedidosPortal` a mostra (decisão 33). Alternativa descartada: manter.
- D3 (muda o comportamento): o "Unidade Unidade …" restante se resolve com um formatador do i18next que tira o "Unidade " do começo do nome só nos textos que já escrevem "Unidade". Não mexe nas telas. No convite com várias unidades ("Unidades A e B") o texto não muda; "Unidade: {{nome}}" é rótulo e valor e fica. Alternativa descartada: tratar em cada tela (passaria de 30 arquivos).
- D4 (muda o comportamento): o total da família não é contagem solta (é o valor devido, RN-POR-05) e vai para o corpo. Vem do R7 da #721.
- D5: Da varredura do portal ficam, além de R6: `portalInfo.personal.readOnlyHint`, `contact.note`, `preferences.note`, `trainings.changeHint` (dizem onde ou como alterar), `portalHome.family.totalText` (identifica o valor), os textos de débito automático, recibos e comprovante Pix (estado e consequência antes de confirmar). Na gestão, ficam as notas que as #717 a #720 mantiveram por decisão (ex.: #719 D3).
- D6: Estimativa em 30 arquivos, dentro do limite; não há nova divisão.
- D7: Sem caso visual novo. Minha conta continua no desenho atual (o redesenho é da #630). Onde o canvas ainda mostra os textos removidos, vale a decisão 33; `limiteCanvas` só se um caso reprovar, com esse motivo.

## Construção

Sessão 1: Parte 1 (T1 a T4). Falta a Parte 2 (T5, T6 e T7), a começar pela T5. Caminhos relativos a `frontend/src`.

- T1 — arquivos: `features/account/{AccountPage,AccessCard,SessionsSection,TwoFactorSection}.tsx`, `features/account/useManagementProfile.ts`, `features/auth/TwoFactorSetupDialog.tsx`, `features/account/AccountPage.test.tsx` — prova: `npm test -- AccountPage` → 37/37
- T2 — arquivos: `features/portal/{PortalHeading,PortalCardPage,PortalRequestsPage,ModalityConfirmations,PortalFinancePage,PortalOpenCharges,PortalAgendaPage,PortalAnnouncementsPage,PortalAnnouncementView}.tsx` e os testes `ModalityConfirmations`, `PortalAgendaPage`, `PortalAnnouncementsPage`, `PortalCardPage`, `PortalFinancePage`, `PortalHeading`, `PortalRequestsPage` — prova: `npm test -- ModalityConfirmations PortalAgendaPage PortalAnnouncementsPage PortalCardPage PortalFinancePage PortalHeading features/portal/PortalRequestsPage` → 75/75
- T3 — arquivos: `i18n/index.ts` (formatador `unit`), `i18n/pt-BR.json` (`invite.card.units_one`, `units.new.created`, `announcements.target.UNIT`, `announcements.lesson.destUnit`, `portalTerm.introAdult`, `portalTerm.introGuardian`), testes `PortalTermPage`, `InvitePage` (caso novo "Unidade Principal"; o de "Unidade Centro" fica) e `NewUnitPage` — prova: `npm test -- PortalTermPage InvitePage NewUnitPage` → 45/45
- T4 — arquivos: `features/portal-requests/PortalRequestsPage.tsx` e o teste — prova: `npm test -- portal-requests` → 18/18

Testes do item: as quatro provas acima → passam; `npm run lint` e `npm run typecheck` → sem erro. `npm test` inteiro, rodado uma vez para achar outro texto afetado pelo formatador → 277 arquivos, 3049/3049 (antes de tirar a variável `profile` sem uso do `AccountPage.tsx`; depois disso, lint, typecheck e as quatro provas de novo). Não rodaram nesta sessão: build, e2e e visual (e2e, capturas e referências são da T6).
Desvios: em `ManagementAccount` saíram também a chamada e o import de `useManagementProfile`, que ficaram sem uso (o `AccountMenuList` continua usando o hook); no hook saiu a variável `name`. As chaves sem uso continuam no `pt-BR.json` até a T5. Diff atual: 30 arquivos contáveis.

Sessão 2: Parte 2 (T5, T6 e T7).

- T5 — arquivo: `i18n/pt-BR.json` (19 chaves apagadas: as da seção 4) — prova: o `grep` da T5 em `src`, `e2e` e `visual` sem uso; `npm run typecheck` e `npm run lint` → sem erro
- T6 — prova: `npm run test:visual:docker -- --update-snapshots --workers=2 -g "<regex da T6>"` → 120 passaram; `npm run visual:canvas -- --exige` → 165 comparadas, 0 reprovadas; `npm run e2e -- minha-conta duas-etapas convite portal-` → 46 passaram (`e2e:full` com o mesmo filtro: também 46); `npm test -- shell.test noInternalAnchors routePattern` → 314 passaram. Segue o padrão de rotas e telas (as telas abrem dentro da moldura nos e2e `minha-conta` e `portal-*`). Capturas em `.capturas/733/`: `<caso>-1440-sistema.png` e `<caso>-390-sistema.png` dos casos da seção 4, e `-canvas.png` onde o caso tem canvas naquela largura (cópia do `visual:canvas`). Abertas aqui: `portal-familia` e `portal-reduzido` (390, sistema e canvas), `conta` e `portal-carteirinha` (1440, sistema e canvas), `conta-celular`, `conta-duas-etapas` e `portal-pedidos` (390, sistema) e `pedidos` (1440, sistema). No caso `portal-familia` o filtro "Toda a família" não está marcado, então a linha do total não aparece na imagem; ela é provada pelo `PortalFinancePage.test.tsx`. Nenhum `limiteCanvas` novo.
- T7 — conferência abaixo. Sobra achada e corrigida: "na unidade Unidade …" nas duas mensagens de aniversário (`birthdays.messageStudent` e `messageGuardian`) e no pedido de nova modalidade (`portalRequests.summary.NEW_MODALITY` e `detail.NEW_MODALITY`), com o mesmo formatador `unit`; só `pt-BR.json` e um caso novo em `features/portal-requests/PortalRequestsPage.test.tsx` — prova: `npm test -- portal-requests BirthdaysCard PortalRequestsPage` → 39/39; `typecheck` e `lint` → sem erro; visual dos casos de comunicados, aviso de aula, nova unidade, convite, início e demais telas do portal com `--update-snapshots` → 88 passaram, nenhuma referência mudou.

### Conferência final da #646, tela por tela (vai para a descrição do PR)

| Tela | Saiu | Ficou e por quê |
|---|---|---|
| Alunos, Professores, Nova matrícula (#717) | subtítulo com unidade e contagem | só o título |
| Ficha do aluno, painel do professor (#717) | nada a tirar | o subtítulo do painel do professor identifica o registro |
| Agenda, Feriados e recessos, Turmas, Faixas etárias, Modalidades (#718) | subtítulos; nota dos feriados sugeridos; "A mensalidade não muda."; dica da unidade na edição de turma; rodapé de Modalidades | aviso de somente leitura de Modalidades; subtítulos de painel e janela (aula, turma, correção) identificam o registro |
| Pedidos do portal, gestão (#718 e este item) | subtítulo (#718); nota de rodapé "Pedidos sem resposta expiram…" (D2) | prazo em cada linha |
| Planos, Benefícios (#719) | subtítulos, notas dos cartões, rodapés, nota do plano desativado | dicas junto de campo; subtítulos de painel e janela |
| Cobranças, Prévia, Em atraso, Conferência de comprovantes, Antecipar (#719) | subtítulos, contagens, nota de antecipação | notas de consequência na prévia, na avulsa e no cancelamento; subtítulo do painel da cobrança; vencimento e geração na composição |
| Recebimentos do dia, Registrar pagamento, Comprovante Pix (#719) | unidade no subtítulo; "sem taxa" | só a data; "Valor da cobrança" |
| Comunicados, Novo comunicado (#720 e este item) | subtítulos, rodapé, introdução; "Unidade Unidade …" no destino da lista (`announcements.targetList.UNIT`; sobra no seletor do celular: #735) | "N de 20" só com 1 a 5 vagas (RF-COM-01); avisar turma identifica a aula |
| Configurações, Organização, Unidades, Nova unidade, configuração da unidade, Permissões, Termos, Textos (#732) | subtítulos; notas da marca, do nome curto, do índice e do uso de imagem | legenda de permissões, somente leitura, limite de unidades, dicas de campo |
| Administradores, Início (#732) | subtítulo; linha da unidade | total no corpo; custo e "sem devolução" nas janelas |
| Minha conta, gestão e portal (este item) | subtítulo da gestão; notas de Acesso, Sessões e duas etapas | cartão de perfil do celular (identifica a conta) |
| Ativar duas etapas (este item) | subtítulo | passos e aviso dos códigos de reserva |
| Convite e telas de entrada (este item) | "Unidade Unidade …" | subtítulos das telas de entrada (R6) |
| Carteirinha, portal (este item) | subtítulo da família; nota do app instalado | texto de como mostrar na recepção |
| Pedidos do portal do aluno e Nova modalidade (este item) | subtítulos | avisos dentro das janelas (consequência antes de enviar) |
| Financeiro do portal e reduzido (este item) | rótulo "Unidade {{unit}}"; "vencidas primeiro"; o total sai do cabeçalho | total da família no corpo; nota do acesso reduzido (R6); o cartão de contato nomeia a unidade |
| Agenda, Avisos e aviso aberto do portal (este item) | notas de regra | só o conteúdo |
| Termo de matrícula (este item) | "Você aceita uma vez" | a introdução (diz o que fazer); a de vários alunos não muda |
| Início e Minhas informações do portal (este item, D5) | nada a tirar | o total da família identifica o valor; dicas de onde e como alterar |

Chaves da #646 no `pt-BR.json` (varredura por expressão sobre todas as chaves): das listadas, restam só `charges.panel.compositionNote` ("Vencimento {{due}} · gerada em {{created}}"), `charges.daily.subtitle` ("{{date}}"), `payments.dialog.valueLine` ("Valor da cobrança: {{value}}") e `announcements.new.subtitle` (com `subtitleUsed` na lista: limite, só com 5 ou menos). `twoFactor.setup.subtitle` saiu neste item e `plans.cards` não tem mais `*Note`. Nos `.tsx`, o `subtitle=` que resta é de painel ou janela que identifica o registro, das telas de entrada, da introdução do termo, do limite de comunicados, da data dos recebimentos e da Vitrine de desenvolvimento.

Divergências do canvas (para o PR): o canvas ainda mostra os subtítulos e notas removidos (`MinhaConta`, `PortalCarteirinha`, `PortalReduzido` com "Unidade Tijuca", `PedidosPortal` e as demais telas das partes); vale a decisão 33. As outras diferenças vistas nas capturas (desenho de Minha conta, que é da #630; dados do MSW) são anteriores ao item.

Testes do item (sessão 2): as provas de T5 a T7; `npm run build` → ok; `npm test` inteiro depois da T5 → 277 arquivos, 3049/3049 (a correção da T7 veio depois e foi provada pelos 39 testes citados, `typecheck` e `lint`).
Regressão: não roda nesta fase (AGENTS.md, "Quem roda o quê").
Referências visuais: 98 PNG em `frontend/visual/referencias/`, só de casos da seção 4: `conta`, `conta-aluno`, `conta-aluno-pagina`, `conta-celular`, `conta-codigos-reserva`, `conta-duas-etapas`, `conta-notificacoes`, `pedidos`, `pedido-recusar`, `portal-agenda`, `portal-aviso-aberto`, `portal-avisos`, `portal-carteirinha`, `portal-carteirinha-filhos`, `portal-celular-abas`, `portal-confirmar-modalidade`, `portal-familia`, `portal-financeiro`, `portal-pedido-{bloqueado,encerrar,modalidade,plano,turma}`, `portal-pedidos`, `portal-pix-chave`, `portal-reduzido`, `portal-responsavel`, `portal-termo` (claro e escuro; 1440 e 390 conforme o que mudou). `pedido-trocar-turma` e `portal-termo-filhos` não mudaram. A moldura não mudou.
Desvios (sessão 2): o R7 foi estendido às mensagens de aniversário e ao pedido de nova modalidade (sobra da conferência final, prevista na T7; a #646 manda sumir a palavra repetida). O diff continua em 30 arquivos contáveis.
Não é do item: nada.

### Correção da rodada 1

- `announcements.targetList.UNIT` (destino na tabela e no cartão da lista de Comunicados) passa a usar `{{name, unit}}` — arquivos: `i18n/pt-BR.json` e uma asserção no caso "não repetem Unidade" de `features/portal-requests/PortalRequestsPage.test.tsx` — prova: `npm test -- features/portal-requests` antes da correção → 1 falha ("Unidade · Unidade Norte"); `npm test -- features/portal-requests features/announcements` depois → 73/73; `npm run lint` e `npm run typecheck` → sem erro; `npm run test:visual:docker -- --update-snapshots --workers=2 -g " comunicados[a-z-]* (1440|390) "` → 28 passaram, nenhuma referência mudou. Continuam 30 arquivos contáveis.
- Sobra do mesmo tipo, fora dos 30 arquivos: no celular, o seletor de destino de Novo comunicado monta "Unidade · {nome}" em `features/announcements/AnnouncementTargetPicker.tsx` (ramo `compact`), que seria o 31º arquivo; virou a #735 (marco "Manutenção · Dívida técnica"), conforme a T7. Ainda sem linha no `specs/backlog.md`.
- Sugestão da verificação: os rótulos acima do título no portal ("Só consulta", "Da academia", "Cobranças e recibos") ficam, porque não são subtítulo, nota de regra nem nome de unidade; o R7 só tira o "Unidade {{unit}}".

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 26/11/2026, estado 55aca4463d276f3e06760d5f37920eb4eef85b5b

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `AccountPage.test.tsx` no `npm test` (sem subtítulo e sem as notas de Acesso, Sessões e duas etapas; sem "Desligar" para o Coordenador); captura `conta-celular-390-sistema` com o cartão "Coordenador · Centro"; e2e `minha-conta` |
| CA2 | PASSOU | `AccountPage.test.tsx` (portal) e captura `conta-aluno-pagina` |
| CA3 | PASSOU | `AccountPage.test.tsx`; captura `conta-duas-etapas` (1440 e 390) sem subtítulo, com os passos; e2e `duas-etapas` |
| CA4 | PASSOU | testes `PortalCardPage`, `PortalRequestsPage` (1440 e 390), `ModalityConfirmations`, `PortalFinancePage` (total uma vez, fora do `header`, ausente na visão do aluno) |
| CA5 | PASSOU | testes `PortalFinancePage`, `PortalAgendaPage`, `PortalAnnouncementsPage` (lista e aviso aberto), `PortalCardPage`; capturas |
| CA6 | PASSOU | `PortalTermPage.test.tsx` (adulto e responsável); captura `portal-termo` |
| CA7 | PASSOU | `InvitePage.test.tsx` (subtítulo do convite) e `PortalFinancePage.test.tsx` (nota do reduzido); captura `portal-reduzido` |
| CA8 | PASSOU | `PortalFinancePage.test.tsx` (sem "Unidade Tijuca", contato nomeia a unidade), `InvitePage.test.tsx` ("Unidade Principal" e "Unidade Centro"), `NewUnitPage.test.tsx` ("Unidade 99 criada."). O R7 vai além do CA8 no destino de comunicado: ver o achado |
| CA9 | PASSOU | `portal-requests/PortalRequestsPage.test.tsx` (sem rodapé, prazo por linha); captura `pedidos` |
| CA10 | PASSOU | `lint`, `typecheck`, `build` e `npm test` com saída 0; o `grep` da T5 em `src`, `e2e` e `visual` sem uso |
| CA11 | PASSOU | `visual:canvas -- --exige`: 165 comparadas, 0 reprovadas; e2e `minha-conta duas-etapas convite portal-` 46/46; rotas e telas no `npm test`; as 60 capturas `-sistema` de `.capturas/733/` são idênticas às referências claras, abertas ao lado do canvas (1440 e 390; onde o caso não tem canvas a 390, só o sistema). Referências contra o container: visual: no CI do PR |
| CA12 | PASSOU | tabela tela por tela conferida contra os requisitos das #717 a #720 e #732; varredura das chaves da #646 no `pt-BR.json`: restam só as quatro citadas |

Comandos (em `frontend/`): `npm run lint`, `npm run typecheck`, `npm run build` → 0; `npm test` → 277 arquivos, 3050/3050; `npm run e2e -- minha-conta duas-etapas convite portal-` → 46 passaram; `npm run e2e:full -- nova-unidade comunicados unidades` → 4 passaram; `npm run visual:canvas -- --exige` → 165 comparadas, 0 reprovadas. Visual contra as referências: no CI do PR. 30 arquivos contáveis; nenhum teste desativado; sem mudança de API, rota ou permissão.

Instáveis: nenhum.

Achados:
- obrigatório, código, `frontend/src/i18n/pt-BR.json` `announcements.targetList.UNIT` ("Unidade · {{name}}", usada em `features/announcements/AnnouncementsPage.tsx` linhas 28 e 30, destino na tabela e no cartão da lista de Comunicados) — esperado (R7 e #646): nome de unidade que já começa por "Unidade" não repete a palavra no destino de comunicado; observado: o formatador `unit` foi aplicado em `announcements.target.UNIT` (janela de cancelar) e em `lesson.destUnit`, mas não nesta chave; evidência: `i18n.t("announcements.targetList.UNIT", { name: "Unidade Principal" })` → "Unidade · Unidade Principal"; corrigir: usar `{{name, unit}}` nessa chave e provar com uma asserção em um teste já tocado pelo item (ex.: o caso "não repetem Unidade" de `portal-requests/PortalRequestsPage.test.tsx`, para não passar de 30 arquivos); se alguma referência visual de Comunicados mudar, regerar só ela. Citar a chave na conferência final.
- sugestão, código, conferência final — registrar que os rótulos acima do título no portal ("Só consulta", "Da academia", "Cobranças e recibos") ficam, e por quê.
- fora do item (anterior a ele; referência `pedidos-390` não mudou), para o maestro — na captura `pedidos-390-sistema`, os chips "Troca de turma" e "Troca de plano" aparecem com o texto cortado; conferir se já há issue.

### Rodada 2 — OK — 26/11/2026, estado 9099dfa5b4fb82d1c8ce37d7599c4c6a7626c25c

Desde a rodada 1 (`git diff 55aca446 9099dfa5`): só `announcements.targetList.UNIT` no `pt-BR.json`, uma asserção em `portal-requests/PortalRequestsPage.test.tsx` e este arquivo. O achado obrigatório está corrigido: a chave usa `{{name, unit}}`, a asserção exige "Unidade · Norte" (falharia sem a correção) e `AnnouncementsPage.tsx` (tabela e cartão) usa essa chave.

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | mantido da rodada 1; testes no `npm test` desta rodada |
| CA2 | PASSOU | mantido da rodada 1 |
| CA3 | PASSOU | mantido da rodada 1 |
| CA4 | PASSOU | mantido da rodada 1 |
| CA5 | PASSOU | mantido da rodada 1 |
| CA6 | PASSOU | mantido da rodada 1 |
| CA7 | PASSOU | mantido da rodada 1 |
| CA8 | PASSOU | reconferido: casos "Unidade Principal", "Unidade Centro" e "Unidade 99" e a asserção nova do destino na lista de Comunicados, no `npm test`; o achado de R7 da rodada 1 está resolvido |
| CA9 | PASSOU | mantido da rodada 1; `portal-requests/PortalRequestsPage.test.tsx` no `npm test` |
| CA10 | PASSOU | `lint`, `typecheck`, `build` e `npm test` com saída 0; a mudança desde a rodada 1 não volta nenhuma chave |
| CA11 | PASSOU | e2e das telas: 45/46 na primeira execução, a falha é instável (abaixo; o arquivo passou 6/6 em 3 de 3); `e2e:full -- nova-unidade comunicados unidades pedidos` 6/6; capturas, referências e `visual:canvas` mantidos da rodada 1 (nenhuma referência mudou desde então). Visual: no CI do PR |
| CA12 | PASSOU | mantido da rodada 1; a linha de Comunicados cita `announcements.targetList.UNIT` e a sobra #735 |

Comandos (em `frontend/`): `npm run lint`, `npm run typecheck`, `npm run build` → 0; `npm test` → 277 arquivos, 3050/3050; `npm run e2e -- minha-conta duas-etapas convite portal-` → 45 passaram, 1 falhou; `npm run e2e -- portal-minhas-informacoes --workers=2` (3 vezes) → 6/6, 6/6, 6/6; `npm run e2e:full -- nova-unidade comunicados unidades pedidos` → 6/6. 30 arquivos contáveis; nenhum teste desativado.

Instáveis: `e2e/portal-minhas-informacoes.spec.ts:75` "@critical portal reduzido abre a aba só com dados, contato da unidade, termos e conta" (1024 px): 1 falha em 4 execuções (título "Dados pessoais" não encontrado em 5 s, na execução com 4 workers); passou 3 de 3 rodando só o arquivo. O mesmo caso a 360 px passou na execução que falhou; o diff não toca `PortalInfoPage` e o `PortalHeading` que ela usa não recebia subtítulo. Sem retry nem aumento de timeout.

Achados:
- sugestão, código, `frontend/src/features/announcements/AnnouncementTargetPicker.tsx` (ramo `compact`) — o seletor do celular ainda monta "Unidade · {nome}" no código; desvio aceito porque seria o 31º arquivo, registrado na #735 (aberta, marco "Manutenção · Dívida técnica"), conforme a T7 e o `AGENTS.md`. Citar no PR; falta a linha da #735 no `specs/backlog.md`.

## Entrega

- O que muda: cabeçalhos da conta, da verificação em duas etapas, do convite e do portal sem subtítulo de unidade nem notas de regra interna; o destino de Comunicados passa a usar `{{name, unit}}` (`announcements.targetList.UNIT`), e as chaves sem uso saem do `pt-BR.json`. Fecha a #721 (item-mãe) e a #646.
- Verificação: rodada 2 `OK` no estado `9099dfa5`; desde então só este arquivo mudou. `lint`, `typecheck`, `build`, `npm test` (277 arquivos, 3050/3050), e2e das telas e `visual:canvas -- --exige` (165 comparadas, 0 reprovadas) conforme o arquivo do item.
- Regressão local: não rodada nesta fase (regra "Quem roda o quê": a regressão reduzida é da verificação e o conjunto completo é do CI do PR).
- Instável: `e2e/portal-minhas-informacoes.spec.ts:75` (1024 px), 1 falha em 4 execuções; passou 3 de 3 isolado. Registrado na rodada 2.
- Limitação aceita: `AnnouncementTargetPicker.tsx` (ramo `compact`, celular) ainda monta "Unidade · {nome}" no código, por ser o 31º arquivo. Virou a #735 (marco "Manutenção · Dívida técnica"), que está aberta. A linha dela ainda não entrou no `specs/backlog.md`.
- Visual: referências da própria tela regeneradas e conferidas contra o canvas localmente; a suíte visual inteira e a conferência contra as referências são do job `visual` do CI.
- CI do PR #737 (run 45902707519, head 8bab519c), job `visual (2/2)` falhou: 1 failed, 331 passed. Falha: `visual/telas.visual.ts` › `dia-sem-aula-novo 1440 claro` (`visual/referencias/dia-sem-aula-novo-1440-claro.png`, `toHaveScreenshot` fora do limite). Este item não mudou essa referência (`git diff` vazio em `dia-sem-aula`) nem a tela "Dias sem aula"; a causa ainda não foi investigada. Pode ser instabilidade da tela ou divergência da `dev` herdada de #732, a checar antes de qualquer correção. Job `visual (1/2)` ainda pendente no momento da leitura.
