# 748 — 625d · Abas Cobrança e Divulgação da unidade (fecha a #625)

Origem: issue #748 (parte d da #625; requisitos de partida em `specs/itens/625-configuracoes-quatro-itens-abas.md`). Branch: `item/748-abas-cobranca-divulgacao`.

Tempos: especificar 3 · construir 16 · verificar 12 (regressão 9; 1 rodada) · entregar 3
Comparação com o canvas: 3

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Para o Coordenador e o Administrador: o que é de cobrança da unidade fica na aba Cobrança, e o que a expõe ao público fica na aba Divulgação. É a última parte da #625: troca o atalho que ainda usa endereço antigo e confere o "Pronto quando" dela.

Fora do escopo: chave por meio de pagamento online e "Aceitar Pix na chave quando o pagamento online estiver fora" (RN-PAG-04a, RN-PAG-17a, #97 e #98); conexão real do Mercado Pago; QR code, PDF e cópia dos links; diretório; bloco "Vale para todas as unidades" (#635); chaves dos pedidos pelo portal (#639); chaves e layout da aba Lembretes (#638); dados novos da unidade (#627).

## 2. Requisitos

- R1: a unidade tem as abas Dados, Cobrança, Lembretes, Divulgação e Permissões do Professor, nesta ordem, com a aba no endereço, "Última alteração" e um único salvar como hoje (RF-ORG-04, RF-ORG-08; D1).
- R2: a aba Cobrança junta os dias de vencimento e a taxa de matrícula, que saem de Dados, com Mercado Pago, taxas por meio de pagamento e chave Pix, com os mesmos limites e mensagens (RF-ORG-04; D2).
- R3: a aba Divulgação é a antiga Links (os dois links e o limite de aulas experimentais por pessoa, padrão 2, de 1 a 3) mais "Aparecer no diretório", que sai de Dados e continua "Em breve" (RF-ORG-04, RN-AEX-02; D3).
- R4: a marca de erro, a aba aberta após a recusa do servidor e o Enter com erro apontam para a aba onde o campo agora está (RF-ORG-04; D4).
- R5: nenhum atalho interno usa endereço antigo de Configurações, e os endereços antigos continuam levando à tela e à aba correspondentes (D5).
- R6: as abas mexidas seguem o padrão de rotas e telas (RNF-56), mantêm os quatro estados, funcionam a partir de 360 px, passam no axe nos dois temas, têm textos em pt-BR, casos no teste visual e comparação com o canvas (decisões 19 a 23 de `docs/auditoria/decisoes-canvas.md`).
- R7: o "Pronto quando" da #625 é conferido ponto a ponto, e o PR o traz, com `Closes #748`, `Closes #625` e as divergências com o canvas que vêm das decisões do dono.

## 3. Critérios de aceite

- CA1 (R1): dado uma unidade, quando é aberta, então as abas são Dados, Cobrança, Lembretes, Divulgação e Permissões do Professor; trocar de aba não perde o que foi digitado, a aba continua após recarregar e um único "Salvar alterações" grava tudo num só PUT, com `If-Match`.
- CA2 (R2): dado a aba Cobrança, quando é exibida, então tem dias de vencimento, taxa de matrícula (interruptor e valor, desabilitado com a taxa desligada), Mercado Pago, taxas, outros meios e chave Pix; dado a aba Dados, então não há vencimento, taxa de matrícula nem diretório. Salvar vencimento e taxa grava os valores.
- CA3 (R3): dado a aba Divulgação, quando é exibida, então tem os dois links, o limite de experimentais (1 a 3, com o valor gravado) e "Aparecer no diretório" desabilitado com "Em breve"; clicar nele não muda nada, e o valor salvo de `directoryEnabled` segue igual no PUT.
- CA4 (R4): dado outra aba aberta, quando o servidor recusa `settings.dueDays`, `settings.enrollmentFeeEnabled` ou `settings.enrollmentFeeCents`, então abre Cobrança, a aba fica marcada com "Há erro nesta aba" e a mensagem do vencimento ou do valor da taxa aparece junto do campo; recusa de `settings.directoryEnabled`, dos links ou de `settings.trialLimit` leva a Divulgação.
- CA5 (R4): dado nenhum dia de vencimento marcado, então Cobrança (e não Dados) fica marcada, "Escolha ao menos um dia de vencimento." aparece nela e o salvar fica bloqueado; Enter num campo, havendo erro local, abre a primeira aba com erro (Dados antes de Cobrança), com o foco no primeiro campo inválido quando for Dados.
- CA6 (R5): dado Cobranças em atraso com uma unidade escolhida (ou com uma só ao alcance), quando usa "Configurar", então abre a aba Lembretes dela; com "Todas as unidades" e mais de uma, abre a lista de Unidades.
- CA7 (R5): dado cada endereço antigo (`/configuracoes/unidade`, com ou sem `?aba=payments` ou `?aba=links`, `/configuracoes/unidade/permissoes`, `/configuracoes/modalidades`, `/configuracoes/faixas-etarias`, `/configuracoes/termos`, `/configuracoes/textos`), quando é aberto, então chega à tela e à aba novas; e, fora do mapa de rotas e dos testes, nenhum link ou navegação do front aponta para eles.
- CA8 (R6): dado cada aba da unidade a 360 px e nos dois temas, então não há rolagem horizontal da página nem violação do axe, e em Cobrança com o Mercado Pago desconectado o selo "Desconectado" não encosta em "Reconectar" a 390 px; `shell.test.ts`, `noInternalAnchors.test.ts` e `routePattern.test.ts` passam e há e2e da unidade dentro da moldura, usando Cobrança e Divulgação e recarregando.
- CA9 (R6): dado os casos visuais das abas mexidas, quando a comparação com o canvas é feita (1440 e 390 px, pt-BR), então há capturas em `.capturas/748/` e as referências alteradas são só as da configuração da unidade.
- CA10 (R7): dado o "Pronto quando" da #625 (cinco pontos), quando o item termina, então o arquivo do item tem a evidência de cada ponto (teste ou item que o entregou) e a lista reunida das divergências com o canvas por decisão do dono das quatro partes (#745 a #748), para o PR.

## 4. Plano técnico

- Dados: não muda.
- API: não muda (rota, contrato e MSW). `PUT /units/{id}` segue completo, com `If-Match`; os campos de erro do servidor (`backend/.../organization/UnitUpdate.java`) são os de hoje.
- Interface (em `frontend/src/`):
  - `features/units/UnitPaymentsTab.tsx` (aba Cobrança): recebe o cartão "Cobrança" de `UnitDataTab` (dias de vencimento com `DAYS` e `cn`, `SwitchRow` e `MoneyField` da taxa, usando `problems.dueDays` e `errors`), depois do cartão da chave Pix (D2). No cartão do Mercado Pago, o bloco de texto ganha largura mínima para os botões passarem à linha de baixo a 390 px (D6).
  - `features/units/UnitDataTab.tsx`: saem o cartão "Cobrança" (e a grade de duas colunas: "Dados da unidade" fica em largura total) e o cartão do diretório. Modalidades oferecidas continuam no alto.
  - `features/units/UnitLinksTab.tsx` (aba Divulgação): ganha no fim o cartão "Diretório de academias" (`ComingSoon variant="switch"` e a ajuda), com as mesmas chaves de texto.
  - `features/units/UnitSettingsPage.tsx`: `tabOfServerField` manda `settings.dueDays` e `settings.enrollmentFee*` para `payments`; `settings.directoryEnabled`, `settings.trialLi*` (link e limite) e `settings.selfRegistrationLinkEnabled` para `links` (hoje só `trialLimit` vai para lá). Em `withError` e no `onKeyDown`, o problema local `dueDays` é de `payments` e os demais de `data`; Enter abre a primeira aba com erro local, na ordem de `TABS`; o efeito do foco continua só para Dados. `TABS` não muda.
  - `features/charges/OverduePage.tsx`: "Configurar" vira `hrefOf("unitSettings", { id })` + `?aba=reminders`, com `id` = a unidade escolhida (`unitId`) ou a única de `scope.units`; sem isso, `hrefOf("units")` (D5).
  - `i18n/pt-BR.json`: `unitSettings.tabs.payments` = "Cobrança" e `unitSettings.tabs.links` = "Divulgação". Nenhuma chave nova.
- Segurança: não muda. Sem rota nova; permissões e isolamento são os do servidor (CA14 da #625, entregue na #746), cobertos no CI.
- Arquivos (contáveis, 13): os 6 acima; testes `UnitSettingsPage.test.tsx`, `UnitPaymentsTab.test.tsx`, `UnitLinksTab.test.tsx`, `features/charges/OverduePage.test.tsx`; `frontend/e2e/configuracao-unidade.spec.ts`, `frontend/e2e/estado-no-endereco.spec.ts`; `frontend/visual/casos.ts` (os `passos` passam a clicar "Cobrança" e "Divulgação"; os nomes dos casos não mudam). `unitDraft.ts` e `unitTabKit.tsx` não mudam.
- Reuso: `Tabs`, `useTabParam`, `Card`, `SwitchRow`, `ComingSoon`, `MoneyField`, `hrefOf`, `useUnitScope` (já usado na `OverduePage`), `LegacyUnitRedirect` (sem mudança).
- Riscos: o `visual:canvas` de `ConfigUnidade` (Dados perde a coluna da direita; o canvas ainda mostra Cobrança e diretório em Dados), `ConfigPagamentos` e `ConfigLinks` (um cartão a mais no fim) pode subir; se alguma largura passar de 15%, vale a regra 4 de "Autonomia" do `AGENTS.md`. As abas só montam quando ativas: os campos movidos têm de manter o valor ao trocar de aba (o `MoneyField` recebe `initial` do rascunho, como as taxas). A lista de Unidades leva o Administrador de uma só unidade à aba Dados, por isso "Configurar" usa o id dela para não perder a aba.

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

- [x] T1: abas Cobrança e Divulgação: mover os campos, trocar os rótulos, ajustar o destino dos erros e o Enter, e a largura do cartão do Mercado Pago, com os testes (ordem das abas, um PUT, erro de cada campo movido, vencimento vazio, diretório "Em breve" e preservado, axe das cinco abas a 360 px nos dois temas) — cobre CA1, CA2, CA3, CA4, CA5, CA8 — prova: em `frontend/`, `npx vitest run UnitSettingsPage UnitPaymentsTab UnitLinksTab`
- [x] T2: "Configurar" de Cobranças em atraso com o endereço novo e teste dos três casos; um caso do endereço antigo com `?aba=links` em `UnitSettingsPage.test.tsx`; conferir por busca que não sobra link para endereço antigo fora de `routes.ts` e dos testes — cobre CA6, CA7 — prova: em `frontend/`, `npx vitest run OverduePage UnitSettingsPage PermissionsTablePage routes shell noInternalAnchors routePattern`
- [x] T3: e2e: taxa de matrícula em Cobrança, limite em Divulgação, dentro da moldura, com a aba mantida após recarregar — cobre CA1, CA2, CA3, CA8 — prova: em `frontend/`, `npm run e2e:full -- configuracao-unidade estado-no-endereco`
- [x] T4: casos visuais; capturas e comparação com o canvas (`ConfigUnidade`, `ConfigPagamentos`, `PagamentosDesconectado`, `ConfigLinks`, `LembretesAuto`, `ConfigPermProf`, `ModalidadesOferecidasRecusa`; 1440 e 390 px, pt-BR; `GMConfigUnidade`, de 360 px, à mão) em `.capturas/748/`, registrando `Comparação com o canvas: <min>`; regerar só as referências dos casos `configuracoes-unidade`, `configuracoes-unidade-pagamentos`, `-pagamentos-desconectado`, `-links`, `-lembretes`, `-professor` e `-modalidades-recusa` (`npm run test:visual:docker -- --update-snapshots -g "<caso>"`) e listá-las — cobre CA8, CA9 — prova: em `frontend/`, `npx vitest run visual/casos.test.ts`, `npm run visual:canvas` e a lista das referências no `git status`
- [x] T5: conferência final da #625: registrar em "Construção" a tabela dos cinco pontos do "Pronto quando" da issue #625 com a evidência de cada um (menu, abas com "Última alteração" e auditoria, limite por unidade com migração, permissões no servidor, casos visuais) e a lista reunida das divergências com o canvas das #745 a #748 — cobre CA10 — prova: conferência da tabela contra `gh issue view 625` e as seções "Construção" de `specs/itens/745-*.md`, `746-*.md` e `747-*.md`

## 6. Decisões

- D1: os ids das abas não mudam (`data`, `payments`, `reminders`, `links`, `teacher`); mudam só os rótulos. `?aba=payments` e `?aba=links`, inclusive nos endereços antigos, continuam valendo sem apelido, e componentes e casos visuais não são renomeados. Alternativa: ids novos com conversão dos antigos, descartada por ser código sem efeito na tela (mantém a D7 da #746).
- D2: na aba Cobrança, vencimento e taxa de matrícula ficam num cartão no fim, depois da chave Pix. O `ConfigPagamentos` não os desenha e o canvas vence no layout do que mostra, então o alto da aba fica como nele. Alternativa: no alto, na ordem do texto do RF-ORG-04, descartada por deslocar tudo o que o canvas desenha.
- D3: o diretório fica num cartão no fim de Divulgação, pelo mesmo motivo (`ConfigLinks`). As chaves por meio de pagamento, o Pix na chave com o online fora, o QR code e o PDF que o RF-ORG-04 cita não são criados aqui: são de itens próprios, e os canvas destas abas não mostram essas chaves.
- D4: o Enter com erro abre a primeira aba com erro local; sem foco automático em Cobrança, porque o único erro local dela (nenhum dia marcado) não tem um campo inválido. Hoje ele já não recebe foco.
- D5 (muda o comportamento): "Configurar", no aviso dos lembretes automáticos de Cobranças em atraso, passa a abrir a aba Lembretes da unidade; com "Todas as unidades" e mais de uma, a lista. Substitui a parte da D7 da #746 que mantinha o link antigo. O redirecionamento de `/configuracoes/usuarios/permissoes` continua apontando para o endereço antigo da tabela, que é quem escolhe a unidade: não é atalho de tela.
- D6: entra o ajuste do selo "Desconectado" encostado em "Reconectar" a 390 px (sugestão da verificação da #746), por estar numa aba que este item entrega. A quebra de texto da aba Lembretes a 390 px, da mesma sugestão, fica fora: a #638 refaz essa aba.
- Suposição: `ConfigUnidade` mostra Cobrança e diretório em Dados, e os canvas da unidade têm as abas "Pagamentos" e "Links", a trilha "Configurações › Unidade" e subtítulo. A divergência vem das decisões 19 e 33 e do RF-ORG-04 e não é corrigida para o canvas.

## Construção

- T1 — arquivos (em `frontend/src/`): `features/units/UnitDataTab.tsx`, `UnitPaymentsTab.tsx`, `UnitLinksTab.tsx`, `UnitSettingsPage.tsx`, `i18n/pt-BR.json`; testes `UnitSettingsPage.test.tsx`, `UnitPaymentsTab.test.tsx`, `UnitLinksTab.test.tsx` — prova: `npx vitest run UnitSettingsPage UnitPaymentsTab UnitLinksTab` → 3 arquivos, 68/68.
- T2 — arquivos: `features/charges/OverduePage.tsx` e teste; caso de `?aba=links` em `UnitSettingsPage.test.tsx` — prova: `npx vitest run OverduePage UnitSettingsPage PermissionsTablePage routes shell noInternalAnchors routePattern` → 11 arquivos, 434/434. Busca em `frontend/src` por `/configuracoes/{unidade,modalidades,faixas-etarias,termos,textos}` (e por `hrefOf` das rotas antigas), fora de `routes.ts` e dos testes → nenhuma ocorrência.
- T3 — arquivos: `frontend/e2e/configuracao-unidade.spec.ts` (taxa em Cobrança, limite e diretório em Divulgação, moldura e, a 360 px, as cinco abas sem rolagem horizontal), `estado-no-endereco.spec.ts` (aba Cobrança mantida após recarregar) — prova: `npm run e2e:full -- configuracao-unidade estado-no-endereco` → 6/6. Segue o padrão de rotas e telas.
- T4 — arquivos: `frontend/visual/casos.ts` — prova: `npx vitest run visual/casos.test.ts` → 169/169; `npm run test:visual:docker -- --update-snapshots -g " configuracoes-unidade(-pagamentos|-pagamentos-desconectado|-links|-lembretes|-professor|-modalidades-recusa)? "` → 28/28; `npm run visual:canvas` → 165 comparadas, 0 reprovadas (1440 claro: unidade 2,1%, pagamentos 1,5%, desconectado 7,2%, lembretes 1,1%, links 2,2%, professor 1,3%, recusa 2,1%; limite 15%, nenhum `limiteCanvas`). Lista de imagens do Docker igual antes e depois (a do Playwright já existia).
  - Capturas em `.capturas/748/`, para os sete casos: `<caso>-1440-sistema.png`, `<caso>-390-sistema.png` e `<caso>-1440-canvas.png` (esses canvas só existem em 1440); e `configuracoes-unidade-390-canvas.png` (`GMConfigUnidade`, de 360 px, comparado à mão). A 390 px, em Cobrança, os botões do Mercado Pago passam à linha de baixo e o selo não encosta neles (D6). Os cartões novos no fim de Cobrança ficam abaixo da dobra das capturas.

Testes do item (rodada final): `npx vitest run` dos arquivos das T1, T2 e `visual/casos.test.ts` → 14 arquivos, 616/616; `npm run lint` e `npm run typecheck` sem erro; e2e da T3 (já com a conferência a 360 px) → 6/6.
Regressão: não roda nesta fase. A conferência do visual contra as referências commitadas é só do CI.
Tamanho: 13 arquivos contáveis.
Desvios: no e2e, além do plano, a conferência de rolagem horizontal a 360 px (prova do CA8, que o axe no jsdom não dá).

Referências visuais: 28 arquivos em `frontend/visual/referencias/` (1440 e 390, claro e escuro) dos casos `configuracoes-unidade`, `-unidade-pagamentos`, `-unidade-pagamentos-desconectado`, `-unidade-links`, `-unidade-lembretes`, `-unidade-professor` e `-unidade-modalidades-recusa`.

### "Pronto quando" da #625 (T5, CA10)

| Ponto | Evidência |
|---|---|
| O menu de Configurações tem os quatro itens e nenhum aponta para endereço inexistente | #746: `routes.test.ts`, `features/permissions/buildMenu.test.ts`, `SettingsIndexPage.test.tsx` e e2e `unidades.spec.ts`; Assinatura e Dados e segurança "Em breve", sem rota. #747: Modalidades, Faixas, Termos e Textos viraram abas, com redirecionamento. #748: o último atalho com endereço antigo ("Configurar" de Cobranças em atraso) trocado; `shell` e `noInternalAnchors` verdes |
| Cada aba mostra o que mostrava a tela de origem, com "Última alteração" e auditoria (RF-ORG-08) | #747: `OrganizationSettingsPage.test.tsx` (CA9, "Última alteração") e os testes das abas movidas. #748: `UnitSettingsPage.test.tsx` (CA1 com "Última alteração"; CA17 num único PUT; CA2 a CA5 dos campos movidos). Auditoria sem mudança no servidor: `UnitSettingsIT` (CA15, `unit.update`) e `LastChangeIT`, no CI |
| O limite de experimentais é lido e gravado por unidade, com o valor antigo migrado | #745: migração `V58__unit_trial_limit.sql`; `UnitSettingsIT` (limite por unidade, auditoria e migração); e2e `configuracao-unidade.spec.ts` grava e relê o limite em Divulgação |
| Permissões por perfil no servidor (Administrador vê Organização em leitura e só as suas unidades) | `OrganizationProfileIT` (Administrador lê e recebe 403 ao gravar regras), `UnitSettingsRouteIT` (outra unidade 403, outra organização 404); #746: `UnitListIT` (`administratorReach`) e `UnitRouteIT`; na tela, `OrganizationSettingsPage.test.tsx` (CA17, leitura). ITs rodam no CI; este item não muda o servidor |
| Casos do teste visual das abas; o PR lista as divergências com o canvas | #747: casos das abas de Organização em `visual/casos.ts`. #746 e #748: casos das cinco abas da unidade e da lista. Divergências reunidas abaixo |

Divergências com o canvas por decisão do dono, partes #745 a #748 (para o PR):
- #745: o limite de aulas experimentais fica na aba da unidade (o `ConfigLinks` não o desenha); `ConfigAcademia` e o fundo do `TransferirCoordenacao` ainda desenham o limite e/ou o comprovante da graduação de origem nas regras da organização.
- #746: o menu não tem "Unidade", "Usuários", "Auditoria" nem "Importar e exportar" (`Sidebar`, `ConfigUnidades`, `GMConfig`); Assinatura e Dados e segurança "Em breve"; trilha da unidade "Configurações › Unidades".
- #747: linha de abas, título "Organização" e trilha "Configurações › Organização" nas cinco telas; ação do cabeçalho e "Última alteração" da Geral no alto da aba; sem os experimentais por telefone e o comprovante nas regras.
- #748: abas "Cobrança" e "Divulgação" (o canvas mostra "Pagamentos" e "Links"); vencimento e taxa de matrícula num cartão no fim de Cobrança e o diretório num cartão no fim de Divulgação (`ConfigUnidade` os mostra em Dados, em duas colunas; D2, D3); "Dados da unidade" em largura total. Origem: decisões 19 e 33 e RF-ORG-04.
- Anteriores a estas partes, mantidas: sem subtítulos (#721); endereço e QR dos links, QR e PDF "Em breve"; taxas em valor fixo em reais; dados do MSW (nomes do topo, titular).

## Verificação

### Rodada 1 — OK — 27/11/2026, estado bc0e77b2b4453511de73f9181c929153859575b0

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `UnitSettingsPage.test.tsx` (ordem das cinco abas, "Última alteração", valores mantidos ao trocar de aba, um PUT; `?aba=` no F5), no `npm test`; e2e `estado-no-endereco` (aba Cobrança após recarregar). `submit` e `If-Match` não mudaram no diff |
| CA2 | PASSOU | `UnitPaymentsTab.test.tsx` (#748 CA2: último cartão, valor desabilitado com a taxa desligada), `UnitSettingsPage.test.tsx` (Dados sem vencimento, taxa e diretório) e e2e (taxa gravada e relida) |
| CA3 | PASSOU | `UnitLinksTab.test.tsx` (#748 CA3), "CA8: o valor salvo do diretório segue o mesmo no PUT", limite de 1 a 3 (RN-AEX-02); captura de Divulgação a 1440 |
| CA4 | PASSOU | `it.each` #748 CA4 (seis campos) e caso do `trialLimit`; os nomes de `tabOfServerField` batem com os de `UnitUpdate.java` |
| CA5 | PASSOU | #748 CA5 (Cobrança marcada, mensagem, salvar bloqueado, nenhum PUT) e caso do Enter com Dados antes de Cobrança, com foco no E-mail |
| CA6 | PASSOU | `OverduePage.test.tsx`, #748 CA6, três casos |
| CA7 | PASSOU | casos "#746 CA7" (com `?aba=links`) e testes de rotas no `npm test`; busca em `frontend/src`, fora de `routes.ts` e testes, e em `backend/src/main`: nenhuma ocorrência |
| CA8 | PASSOU | axe das cinco abas e de "Dados com erros" nos dois temas (CA18); e2e com `scrollWidth` <= 360 nas cinco abas; `shell`, `noInternalAnchors` e `routePattern` no `npm test`; e2e dentro da moldura; captura 390 do desconectado com "Reconectar" na linha de baixo do selo |
| CA9 | PASSOU | abertas por mim as 22 imagens de `.capturas/748/` (1440 sistema e canvas, 390 sistema e `GMConfigUnidade`); diferenças são as listadas em "Construção" ou anteriores; as 28 referências alteradas são só da configuração da unidade. Os cartões novos no fim de Cobrança ficam abaixo da dobra: conferidos por teste e diff (mesmo JSX que estava em Dados). visual: no CI do PR |
| CA10 | PASSOU | tabela dos cinco pontos e lista de divergências em "Construção", conferidas contra a issue #625; migração V58, ITs e specs citados existem (ITs: no CI) |

Comandos (em `frontend/`): `npm run lint`, `npm run typecheck`, `npm run build` sem erro; `npm test` 277 arquivos, 3076/3076; `npm run e2e:full -- configuracao-unidade estado-no-endereco` 6/6. Back-end não foi tocado. Visual: no CI do PR.
Achados:
- sugestão, código, "Divergências com o canvas" (lista do PR) — citar também o `GMConfigUnidade` (360 px), que mostra "Dias de vencimento" em Dados e as abas "Pagamentos" e "Links".
- sugestão, anterior ao item (D6), `features/units/UnitRemindersTab.tsx` — a 390 px o texto dos lembretes quebra palavra a palavra e fica sobreposto ao "E-mail" (`configuracoes-unidade-lembretes-390-sistema.png`); conferir que a #638 traz isso no "Pronto quando" (o `visual:canvas` não compara essa largura).

## Entrega

- O que muda: última parte da #625. A configuração da unidade passa a ter as abas Cobrança e Divulgação, com `?aba=` no endereço. Vencimento e taxa de matrícula saem de Dados e vão para um cartão no fim de Cobrança; o diretório vai para um cartão no fim de Divulgação. "Dados da unidade" fica em largura total. O atalho "Configurar" de Cobranças em atraso troca o endereço antigo pelo novo.
- Verificação: rodada 1, OK (estado `bc0e77b2b4453511de73f9181c929153859575b0`). `npm test` 277 arquivos, 3076/3076; `lint`, `typecheck` e `build` sem erro; e2e `configuracao-unidade` e `estado-no-endereco` 6/6, com a conferência de rolagem horizontal a 360 px. Visual por caso: no CI do PR.
- Sem mudança no servidor nesta parte. Sem `limiteCanvas`.
- Divergências com o canvas por decisão do dono, listadas no "Pronto quando" acima: abas Cobrança e Divulgação no lugar de Pagamentos e Links; cartões de vencimento, taxa e diretório; "Dados da unidade" em largura total.
- Achado (sugestão, anterior ao item): lembretes a 390 px quebram palavra a palavra e encostam no "E-mail", e o `visual:canvas` não compara essa largura. Conferir que a #638 traz isso no "Pronto quando".
