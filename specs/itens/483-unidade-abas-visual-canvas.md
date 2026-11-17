# 483 — Unidade: abas Dados, Pagamentos, Lembretes, Links e Permissões do Professor no visual do canvas

Origem: issue #483 (Sprint 10.5, Fase 3, plano G2), `docs/auditoria/plano-de-issues.md`, `docs/auditoria/decisoes-canvas.md` (R1 a R4, decisão 5); evidências M20, M53, M54, M55, M56, M57. Branch: `item/483-unidade-abas-visual-canvas`. Canvas: `ConfigUnidade`, `ConfigPagamentos`, `PagamentosDesconectado`, `LembretesAuto`, `ConfigLinks`, `ConfigPermProf` (1440 px, tema claro; não há versão escura), `GMConfigUnidade` e `GMConfig` (390 px). Dependências #450, #453, #458, #459 já em `dev` (`ComingSoon`, `Switch`, `Field`/`Input`/`Select`, `Tabs`, `PageHeader`, `Banner`, `SummaryBox`, `SegmentedChoice`, `Avatar`). O item #482 é o modelo de padrão de tela.

Uma especificação, uma entrega; a construção se divide em partes (A a D, nas tarefas).

## 1. Objetivo

Deixar Configurações › Unidade igual ao canvas para o Coordenador e o Administrador da unidade: cabeçalho "Unidade <nome>" com subtítulo e "Última alteração", cinco abas (Dados, Pagamentos, Lembretes, Links, Permissões do Professor) sobre **um só rascunho** com rodapé fixo "Descartar" / "Salvar alterações", e, no celular, a mesma tela responsiva (GMConfigUnidade) mais a página-índice `/configuracoes` (GMConfig). As regras de negócio não mudam; a API ganha só dois dados de leitura que o canvas mostra (fuso e contagens, D6).

Fora do escopo: conexão real, reconexão e desconexão do Mercado Pago (Sprints 22 e 23); diretório de academias; tela de links (QR, PDF, endereço público e contagem de pedidos, #162, Sprint 18); percentual de taxa (decisão 5); faixa global vermelha "Mercado Pago desconectado" (sem dado de expiração); texto dos lembretes (já na tela Textos, #83).

## 2. Requisitos

- R1 (M20, M56): a página tem título "Unidade <nome>", subtítulo "<nome curto> · cada unidade tem seus dados, recebimentos e links", "Última alteração em <data> às <hora> por <nome>" (`LastChange`) e as abas Dados, Pagamentos, Lembretes, Links e Permissões do Professor, nessa ordem, sobre um único rascunho: trocar de aba não perde o que foi digitado.
- R2 (M20, M56): rodapé fixo com "Descartar" (volta tudo ao último valor salvo) e "Salvar alterações", ambos ativos só quando algo mudou; salvar grava tudo num `PUT /units/{id}` com `If-Match`; conflito 409 abre a janela de conflito atual com as diferenças das cinco abas (RNF-15).
- R3 (M20): aba Dados: cartão "Dados da unidade" em duas colunas (Nome, CNPJ opcional com "Aparece no recibo", Endereço, CEP, Cidade, Telefone, WhatsApp da unidade, E-mail, Fuso horário somente leitura "Brasília (UTC−3)", nome curto somente leitura, coordenadas como hoje), cartão "Cobrança" (dias de vencimento em pílulas de 1 a 28 com "Escolha entre os dias 1 e 28"; "Cobrar taxa de matrícula" em interruptor com o texto "Nasce desligada...", e "Valor da taxa"), cartão "Modalidades oferecidas" (interruptor por modalidade, "N turmas · N planos" e a nota "Só aparecem as modalidades ativas na organização") e cartão "Diretório de academias" com o interruptor visível e desabilitado com "Em breve" (D8).
- R4 (M53, decisão 5): aba Pagamentos: cartão "Mercado Pago" (Conectado ou Desconectado conforme `paymentAccount`) com "Reconectar" e "Desconectar" visíveis e desabilitados com "Em breve"; quando desconectado, cartão "Enquanto estiver desconectado" com as quatro consequências do canvas; tabela "Taxas por meio de pagamento" com Pix, Cartão de crédito, Cartão de débito, Boleto e Débito automático (campo em R$ por meio e coluna "Exemplo: mensalidade de R$ 180,00" com o total calculado), faixa "No portal, o aluno vê: Pix: ... · Cartão: ... · Boleto: ..." e cartão "Chave Pix da unidade" com seletor "Tipo" e "Chave" (D3, D4). Os quatro meios de balcão (Dinheiro, Pix na chave, Maquininha, Transferência) continuam editáveis num bloco "Outros meios" (D3).
- R5 (M20, RN-COB-17, RN-COB-18): aba Lembretes: cartão "Lembretes de cobrança" com uma linha por dia (3 dias antes, no dia, 3 e 10 dias depois) com interruptor, e-mail como canal e "Push" visível e desabilitado com "Em breve"; linha fixa "5 dias antes do bloqueio" com "Sempre ligado" e o texto do SMS; seletor "Horário de envio" (00:00 a 23:00); campo "Menores de idade: Vão para o responsável financeiro" (somente leitura); aviso azul com o texto "Os lembretes param quando..." e o atalho "Editar textos" para `/configuracoes/textos`; interruptor geral "Enviar lembretes automáticos" mantido (D5).
- R6 (M54): aba Permissões do Professor: título "O que os Professores da <unidade> podem fazer", cinco interruptores com os rótulos e as descrições do canvas (Enviar comunicado, Editar e cancelar aulas, Ver contatos, Ver aulas experimentais, Ver ficha do aluno) e a faixa com cadeado "Em qualquer caso, o Professor nunca vê valores, plano, benefício, CPF, endereço nem situação financeira...".
- R7 (M55, R3): aba Links: dois cartões (Pedido de aula experimental, Autocadastro de matrícula) com interruptor real ligado às flags `trialLinkEnabled` e `selfRegistrationLinkEnabled`, selo "Ligado" quando ligado, a descrição do canvas e o texto "Desligado, o link mostra..." no autocadastro; "Copiar link", "QR code PNG" e "PDF para imprimir" visíveis e desabilitados com "Em breve" (D7).
- R8 (M57): a rota `/configuracoes` mostra a lista de links com seta do canvas (Organização, Unidade, Modalidades, Faixas etárias, Usuários, Termos, Textos, Auditoria, Importar e exportar), filtrada pela permissão do perfil, com Auditoria e Importar e exportar como "Em breve" e, para o Administrador, a nota "Assinatura e Unidades aparecem só para o Coordenador." (D10).
- R9: os quatro estados (carregando, vazio, erro, sem permissão) continuam, sem rolagem horizontal a partir de 360 px, axe sem violações nos dois temas; todos os textos em `pt-BR.json`; "Todas as unidades" continua só consulta com o aviso (RN-ORG-08); o Administrador de unidade vê o que a API permite como hoje.
- R10: as regras já existentes continuam: validações dos campos (nome, CNPJ, CEP, coordenadas, telefones, e-mail, dias, lembretes: até 8 dias de -30 a 60 sem repetição), centavos nas taxas, auditoria `unit.update`, isolamento entre organizações e entre perfis.

## 3. Critérios de aceite

- CA1 (R1): dado o Coordenador na unidade Tijuca, quando abre `/configuracoes/unidade`, então vê o título "Unidade Tijuca", o subtítulo, "Última alteração em ... por ..." e as cinco abas na ordem do canvas.
- CA2 (R1): dado um campo da aba Dados alterado, quando troca para Lembretes e volta, então o valor digitado continua.
- CA3 (R2): dado nada alterado, então "Descartar" e "Salvar alterações" estão desabilitados; alterado, ambos ativos; "Descartar" restaura o último valor salvo em todas as abas; "Salvar alterações" mostra "Salvo" e desabilita de novo.
- CA4 (R2): dado que outra pessoa salvou antes, quando salva, então a janela de conflito lista a diferença, inclusive de campos de outras abas, e "Sobrescrever" e "Recarregar" funcionam como hoje.
- CA5 (R3, R10): dado nome vazio, CNPJ ou e-mail inválido, nenhum dia de vencimento ou coordenadas incompletas, então o erro aparece no campo, o "Salvar" fica desabilitado e a aba com erro é marcada; Enter com erro leva o foco ao primeiro campo inválido, mesmo se estiver em outra aba (a aba abre).
- CA6 (R3): dado o interruptor de taxa de matrícula desligado, então "Valor da taxa" fica desabilitado; ligado e vazio, grava 0 como hoje.
- CA7 (R3): dado o cartão "Modalidades oferecidas", então cada linha mostra "N turmas · N planos" (singular com 1); o interruptor grava na hora como hoje (`UNIT_MODALITY_IN_USE` continua mostrando as turmas); o Administrador só lê.
- CA8 (R3): o interruptor do diretório aparece desabilitado com "Em breve", não responde a clique e o valor salvo continua o mesmo no `PUT`.
- CA9 (R4): dado `paymentAccount` = `NOT_CONNECTED`, então o cartão mostra "Desconectado", "Reconectar" desabilitado com "Em breve", e o cartão "Enquanto estiver desconectado" com as quatro consequências; com `CONNECTED`, "Conectado" e "Reconectar"/"Desconectar" desabilitados e sem o cartão de consequências.
- CA10 (R4): dada a taxa de Pix R$ 0,90 e a de crédito R$ 6,30, quando altera, então a coluna de exemplo mostra R$ 180,90 e R$ 186,30 e a faixa do portal repete Pix, Cartão e Boleto com os valores novos; taxa acima de R$ 1.000,00 mostra o erro do servidor no campo.
- CA11 (R4): dado o seletor "Tipo", quando escolhe "E-mail" ou "CPF", então a chave segue esse formato; chave inválida mostra o erro do servidor (400 em `settings.pixKey`); o tipo inicial vem da chave salva.
- CA12 (R5): dados os dias salvos -3, 0, 3 e 10, então os quatro interruptores aparecem ligados; desligar o de 3 dias antes tira o dia de `reminderDays` ao salvar; dia salvo fora dos quatro padrões aparece como linha própria e é mantido; "Push" é desabilitado com "Em breve".
- CA13 (R5): dado o interruptor geral desligado, então os interruptores de dia e o horário ficam desabilitados e o texto "Lembretes automáticos desligados" aparece; o horário salvo é a hora cheia escolhida.
- CA14 (R5): "Editar textos" leva a `/configuracoes/textos`.
- CA15 (R6): os cinco interruptores gravam `teacherPermissions` e a faixa do cadeado aparece com o texto do canvas.
- CA16 (R7): dado o link de experimental ligado, então o selo "Ligado" aparece; desligar e salvar grava `trialLinkEnabled = false`; os três botões de link são "Em breve" e não fazem nada.
- CA17 (R8): o Coordenador em `/configuracoes` vê os links permitidos a ele; o Administrador vê a nota; Professor recebe a tela "sem permissão"; Auditoria e Importar e exportar não navegam.
- CA18 (R9): em 390 px a tela não tem rolagem horizontal, as abas rolam na horizontal, o rodapé fica fixo acima da barra inferior e o cabeçalho tem o título e o seletor de unidade; carregando, erro (com "Tentar de novo"), vazio (sem unidade) e sem permissão (403 e 404) funcionam.
- CA19 (R10): `GET /units/{id}` devolve `timezone` e `GET /units/{id}/modalities` devolve `classCount` e `planCount` (só turmas e planos ativos da unidade e da modalidade); outra organização recebe 404/403 e Professor 403 como hoje.
- CA20 (R9): o teste visual com MSW tem um caso por aba (Dados, Pagamentos, Pagamentos desconectado, Lembretes, Links, Permissões) a 1440 e 390 px e a tela `/configuracoes` a 390 px, comparados com o canvas.

## 4. Plano técnico

- Dados: não muda o esquema. `unit.timezone` já existe (usada em `Agenda.java`); contagens saem de `training_class` e `plan` por consulta.
- API: `UnitDetail` ganha `timezone` (string IANA, somente leitura; o `PUT` o ignora); `UnitModality` ganha `classCount` e `planCount` (inteiros). Nenhuma rota nova. Atualizar `docs/openapi.yaml` (`UnitDetail`, `UnitModality`) e o MSW.
- Interface: `UnitSettingsPage` vira cabeçalho + `Tabs` sobre um só `Form`; cada aba é um componente em arquivo próprio recebendo `draft`/`set`; o rascunho fica no pai. Estados e conflito ficam no pai. Rodapé fixo novo, mesmo padrão do #482. Nova `SettingsIndexPage` em `/configuracoes`.
- Segurança: permissão continua no servidor (`UnitSettings.access`); a rota `/configuracoes` só lista o que `buildMenu` já permite. Nada de segredo novo; a chave Pix continua oculta na auditoria.
- Arquivos a alterar (vistos): `frontend/src/features/units/UnitSettingsPage.tsx` (separar em abas, trocar `Check`/`Checkbox` por `Switch`, pílulas de dia, rodapé), `UnitSettingsPage.test.tsx`, `useUnitSettings.ts` (`timezone`), `useUnitModalities.ts` e `UnitModalitiesSection.tsx` (contagens, `Switch`), `frontend/src/App.tsx` (rota `/configuracoes`), `frontend/src/features/permissions/menuCatalog.ts` (só se a gaveta do celular precisar apontar para o índice), `frontend/src/i18n/pt-BR.json` (`unitSettings.*`, `settingsIndex.*`), `frontend/src/mocks/handlers.ts` e `unit-settings.msw.test.ts` (campos novos), `frontend/visual/casos.ts` (casos e lista de telas "sem rota": tirar `ConfigPagamentos`, `LembretesAuto`, `ConfigLinks`), `backend/src/main/java/br/com/ctcore/organization/UnitSettings.java` (`UnitDetail` + consulta), `backend/src/main/java/br/com/ctcore/modality/UnitModalities.java` (`Item` + consulta), seus testes `*IT`, `docs/openapi.yaml`. A criar: `UnitDataTab.tsx`, `UnitPaymentsTab.tsx`, `UnitRemindersTab.tsx`, `UnitLinksTab.tsx`, `UnitTeacherTab.tsx` e `SettingsIndexPage.tsx` em `frontend/src/features/units/` (e o teste de cada um).
- Reuso: `Tabs`, `Switch`, `ComingSoon`, `Banner`, `PageHeader`, `LastChange`, `Field`/`Input`/`Select`, `MoneyField`, `PhoneField`, `EditConflictDialog`, `useEditConflict`, `formatCurrency`, `PixKey.normalize` no servidor, estados de `components/states`.
- Riscos: (1) `Tabs` desmonta o painel inativo; campos com valor inicial interno (`MoneyField`, `PhoneField`) leem `initial` do rascunho ao remontar, o que o teste de CA2 prova; (2) erro numa aba oculta: CA5 exige abrir a aba, e `Tabs` hoje só tem `defaultId`, então acrescentar `value`/`onValueChange` opcionais (mudança compatível); (3) o limite visual a 1440 px contra o canvas pode reprovar por densidade: usar `limiteCanvas` só com motivo e issue (AGENTS, autonomia 4); (4) a gaveta do celular hoje abre o grupo de Configurações, não uma página: conferir na construção e apontar o item para o índice só se o canvas GMConfig exigir.

## 5. Tarefas

Parte A — back-end e contrato

- [x] T1: `UnitDetail.timezone` e `UnitModality.classCount`/`planCount` no back-end, no `docs/openapi.yaml` e no MSW — cobre CA19 — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`, `./backend/mvnw -f backend/pom.xml verify -Dit.test='Unit*IT'` (inclui os testes de isolamento e perfil já existentes dessas rotas) e, de dentro de `frontend/`, `npx vitest run src/mocks/unit-settings.msw.test.ts`.

Parte B — moldura e abas simples

- [x] T2: dividir `UnitSettingsPage` em cabeçalho, `Tabs` (com `value`/`onValueChange` opcionais), rascunho único, rodapé fixo "Descartar"/"Salvar alterações" e marca de erro na aba — cobre CA1, CA2, CA3, CA4, CA5, CA18 — prova: `npx vitest run src/features/units/UnitSettingsPage.test.tsx`.
- [x] T3: aba Dados (campos em duas colunas, fuso, pílulas de dias, taxa de matrícula, modalidades com contagens, diretório "Em breve") — cobre CA6, CA7, CA8 — prova: `npx vitest run src/features/units/UnitSettingsPage.test.tsx src/features/units/UnitModalitiesSection.test.tsx`.
- [x] T4: abas Permissões do Professor e Links — cobre CA15, CA16 — prova: `npx vitest run src/features/units/UnitTeacherTab.test.tsx src/features/units/UnitLinksTab.test.tsx`.

Parte C — Pagamentos e Lembretes

- [x] T5: aba Pagamentos (cartão Mercado Pago, consequências, tabela de taxas com exemplo, faixa do portal, Outros meios, Chave Pix com tipo) — cobre CA9, CA10, CA11 — prova: `npx vitest run src/features/units/UnitPaymentsTab.test.tsx`.
- [x] T6: aba Lembretes (interruptor por dia, linha fixa, horário, menores, Push "Em breve", "Editar textos") — cobre CA12, CA13, CA14 — prova: `npx vitest run src/features/units/UnitRemindersTab.test.tsx`.

Parte D — índice e visual

- [x] T7: página `/configuracoes` (GMConfig) e rota — cobre CA17 — prova: `npx vitest run src/features/units/SettingsIndexPage.test.tsx`.
- [x] T8: casos visuais (seis de Unidade e um de `/configuracoes`, com `canvasCelular` onde há), referências só desta tela, comparação com o canvas em `.capturas/483/`, registro do resultado do `test:visual:docker -- -g "<caso>"` sem `--update-snapshots`, e axe nos dois temas — cobre CA20, CA18 — prova: de dentro de `frontend/`, `npm run test:visual:docker -- -g "configuracoes-unidade"` e `npm run visual:canvas`.
- [x] T9: regressão do que mudou — não cobre critério: confirma lint, tipos e testes da pasta — prova: `npm run lint && npm run typecheck && npx vitest run src/features/units`.

## 6. Decisões

- D1: uma só página com um só rascunho e um só "Salvar" (não uma rota por aba). Motivo: o canvas tem um rodapé único e a gravação é um `PUT` completo com `If-Match`. Alternativa descartada: abas com gravação própria, que quebraria o conflito de versão.
- D2 (muda o comportamento): Reconectar, Desconectar e a faixa global vermelha não funcionam agora. "Reconectar" e "Desconectar" aparecem desabilitados com "Em breve" (R3); a faixa global não é feita porque não há data de expiração. Motivo: conexão real é das Sprints 22 e 23 e o aviso atual "chega em uma próxima entrega" sai da tela. Divergência a registrar no PR.
- D3 (muda o comportamento): taxas continuam em valor fixo em R$ por meio (decisão 5; RF-ORG-04 diz que o percentual será decidido na #97). A tabela mostra os cinco meios online com o exemplo e a faixa do portal; Dinheiro, Pix na chave, Maquininha e Transferência vão para "Outros meios", abaixo, para não perder campo que a regra pede. Exemplo fixo de R$ 180,00; total = valor + taxa em centavos, sem arredondamento extra.
- D4: o seletor "Tipo" da chave Pix é só da interface (CPF, CNPJ, E-mail, Telefone, Chave aleatória), com o tipo inicial deduzido da chave salva; o servidor continua validando por `PixKey.normalize`. Motivo: o canvas mostra o seletor, mas a regra não tem campo de tipo. Alternativa descartada: gravar o tipo (exigiria migração sem ganho de regra).
- D5 (muda o comportamento): lembretes seguem a RN-COB-17: um interruptor por dia (desligar = tirar o dia da lista), mais o geral, a hora cheia e o aviso fixo. A lista em texto "-3, 0, 3, 10" sai da tela; dias fora do padrão já salvos continuam editáveis como linhas próprias. Canal Push "Em breve"; SMS do aviso de bloqueio só descrito.
- D6: `timezone` e as contagens entram como campos de leitura no contrato porque o canvas os mostra e não existe outra rota; o `PUT` ignora `timezone`.
- D7: Links: os interruptores continuam reais (as flags existem). Endereço, "Copiar link", QR, PDF e "64 pedidos nos últimos 6 meses" ficam para a #162; os três botões aparecem como "Em breve", sem endereço nem contagem.
- D8 (muda o comportamento): "Diretório de academias" fica desabilitado com "Em breve", conforme a decisão 5; o valor salvo de `directoryEnabled` é preservado no `PUT`.
- D9: só existe canvas claro; as abas Pagamentos, Lembretes, Links e Permissões a 390 px são conferidas pelo sistema (como no #482, D7), e Dados a 390 px contra `GMConfigUnidade`. O canvas de celular mostra um formulário curto e a tela responsiva mostra todos os campos: divergência a registrar, com `limiteCanvas` e motivo se reprovar.
- D10: `/configuracoes` é a lista do `GMConfig` para qualquer largura, montada do catálogo de menu já filtrado por permissão. Assinatura e Unidades (Coordenador) não entram na lista do canvas e ficam só no menu lateral.
- Suposição: a rota `/configuracoes` não precisa mudar a gaveta do celular; se o canvas exigir que a gaveta leve ao índice, muda só o destino do item em `menuCatalog.ts`.
- Suposição: "Aparece no recibo" no CNPJ é só texto de ajuda (RN-COB-16 já põe o CNPJ no recibo).

## Construção

- T1 — arquivos: `UnitSettings.java` (`UnitDetail.timezone`), `UnitModalities.java` (`classCount`/`planCount`, também na resposta do PUT), `docs/openapi.yaml`, `frontend/src/mocks/handlers.ts`, `UnitModalityIT` (teste `counts`), `UnitSettingsIT`, `UnitSettingsRouteIT`, `unit-modalities.msw.test.ts` — prova: `OpenApiContractTest,ContractRoutesTest` → 7 passaram; `verify -Dit.test='Unit*IT'` → passou (UnitSettingsIT corrigido para o campo novo, depois 9 de 9); `vitest run unit-settings.msw.test.ts unit-modalities.msw.test.ts` → 9 passaram.
- T2 — `UnitSettingsPage.tsx` (cabeçalho, `Tabs` controlada, rascunho único, rodapé fixo, marca de erro na aba, foco no primeiro inválido), `unitDraft.ts`, `components/ui/tabs.tsx` (`value`, `onValueChange`, `badge`), `Text.tsx` (`Err`), testes — prova: `vitest run UnitSettingsPage.test.tsx tabs.test.tsx` → passou (27 testes da página).
- T3 — `UnitDataTab.tsx`, `UnitModalitiesSection.tsx` (Switch, contagens, nota), `SwitchRow.tsx` — prova: `vitest run UnitSettingsPage.test.tsx UnitModalitiesSection.test.tsx` → passou.
- T4 — `UnitTeacherTab.tsx`, `UnitLinksTab.tsx`, `unitTabKit.tsx` (só testes) — prova: `vitest run UnitTeacherTab.test.tsx UnitLinksTab.test.tsx` → passou.
- T5 — `UnitPaymentsTab.tsx` — prova: `vitest run UnitPaymentsTab.test.tsx` → 7 passaram.
- T6 — `UnitRemindersTab.tsx` — prova: `vitest run UnitRemindersTab.test.tsx` → passou.
- T7 — `SettingsIndexPage.tsx`, rota em `App.tsx`, `settingsIndex.*` — prova: `vitest run SettingsIndexPage.test.tsx` → 6 passaram.
- T8 — `visual/casos.ts` (`unidadeCanvas`, 7 casos novos ou alterados), `visual/telas.visual.ts`, 28 referências — prova: `npm run test:visual:docker -- -g "<casos>"` → 28 passaram; `npm run visual:canvas` → 143 comparadas, 0 reprovadas (Dados 2,9%, Pagamentos 0,8%, Desconectado 7,0%, Lembretes 1,0%, Links 1,9%, Permissões 1,4%; limite padrão 30%, sem `limiteCanvas`). Capturas em `.capturas/483/` (sistema e canvas, 1440 e 390; as de 390 do canvas são GMConfig e GMConfigUnidade, de 360 px, comparadas à mão). axe 360 px nos dois temas em cada aba e no índice, nos testes.
- T9 — prova: `npm run lint && npm run typecheck && npx vitest run src/features/units` → passou (12 arquivos).
Regressão: back-end `verify` → 891 testes, 0 falhas, BUILD SUCCESS. Front-end: lint, typecheck e build ok; `test:cov` → 2498 passaram e 2 falharam: `telasCanvas419` (a nota "#162" num comentário de `UnitLinksTab.tsx` parecia cor; corrigida, 63 passaram) e `TeacherFormDialog` (timeout de 20 s sob carga; passou sozinho, 16 de 16, instável e fora do item). `e2e` → 96 passaram, 2 falharam em `portal-pedidos` (timeout sob carga; passou sozinho, 2 de 2, fora do item). `visual/casos.test.ts` → 142 passaram.
Visual do CI: configuracoes-unidade → passou; configuracoes-unidade-pagamentos → passou; configuracoes-unidade-pagamentos-desconectado → passou; configuracoes-unidade-lembretes → passou; configuracoes-unidade-links → passou; configuracoes-unidade-professor → passou; configuracoes → passou.
Referências visuais: novas `configuracoes-*`, `configuracoes-unidade-{pagamentos,pagamentos-desconectado,lembretes,links}-*` (1440 e 390, claro e escuro); regeradas `configuracoes-unidade-*` e `configuracoes-unidade-professor-*`.
Desvios:
- Título "Unidade <nome>" não repete "Unidade" quando o nome já começa com ela (os dados do MSW são "Unidade Centro").
- Horário de envio com as opções do canvas ("9h"), não "09:00" do R5.
- Aviso de salvo com o texto "Salvo" (CA3), no rodapé fixo; "Dados salvos." saiu. O texto de ajuda "A mudança vale na hora" das modalidades saiu para igualar o canvas.
- CNPJ do caso visual é 11.222.333/0001-81 (o do canvas é inválido pelo dígito verificador).
- GMConfig e GMConfigUnidade são de 360 px: seguem em `semCaso` (D5 da #435); comparação manual. Abas do celular são sublinhadas (componente `Tabs`), não pílulas como no canvas; a tela responsiva mostra todos os campos (D9).
- Canvas mostra "% + R$" por meio; o sistema só R$ (D3); chips de vencimento de 1 a 28 (R3) contra 5 no canvas; sem faixa global vermelha (D2).
- Troca de aba desmonta o painel; "Chave Pix: Tipo" volta ao deduzido da chave ao trocar de aba.
Não é do item: nenhum.

## Verificação

### Rodada 1 — OK — 2026-11-17, estado 4343b00c6493f6b003c85f0657f610a4e456e313

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA18 | PASSOU | `vitest run src/features/units src/components/ui/tabs.test.tsx src/mocks visual/casos.test.ts` → 71 arquivos, 588 testes passaram (testes por aba, página, índice e tabs); axe nos dois temas dentro desses testes |
| CA19 | PASSOU | `verify -Dit.test='Unit*IT'` + `OpenApiContractTest,ContractRoutesTest` → 45 testes, 0 falhas, BUILD SUCCESS (UnitModalityIT, UnitSettingsIT, UnitSettingsRouteIT incluídos) |
| CA20 | PASSOU | `npm run test:visual:docker -- -g "configuracoes"` sem `--update-snapshots` → 92 passaram; capturas em `.capturas/483/` abertas e comparadas (Dados, Pagamentos) |

Comandos: `npm run lint` ok; `npm run typecheck` ok; testes acima. Regressão completa (verify inteiro, test:cov, e2e) não reexecutada: vale o registro da Construção (891 testes ok; 2 falhas front por carga, passam isoladas) e o CI do PR.
Achados:
- sugestão, código, Switch ligado aparece laranja no sistema e verde no canvas (`configuracoes-unidade-1440`); é o componente base `Switch`, fora deste item.
- sugestão, código, 390 px: capturas de canvas só existem para `configuracoes-unidade` e `configuracoes`; demais abas conferidas só pelo sistema (D9, aceito).

## Entrega

- Configurações da unidade vira uma página com as abas Dados, Pagamentos, Lembretes, Links e Permissões do Professor, com um rascunho, um "Salvar" e rodapé fixo (D1). `/configuracoes` é a lista do GMConfig em qualquer largura (D10). Contrato: `timezone`, `classCount` e `planCount` entram como leitura (D6); o `PUT` ignora `timezone`. OpenAPI, MSW e testes de contrato batem.
- Verificação: `verify -Dit.test='Unit*IT'` e `OpenApiContractTest,ContractRoutesTest` com 45 testes de back-end sem falha; `vitest` de `src/features/units`, tabs e mocks passou; lint, typecheck e build ok; axe 360 px nos dois temas; visual do CI nos 7 casos `configuracoes*` passou; `visual:canvas` 143 comparadas, 0 reprovadas no limite padrão, sem `limiteCanvas`.
- Decisões que quem lê precisa saber: sem rota por aba (D1); Reconectar, Desconectar e a faixa vermelha ficam "Em breve" ou não entram (D2); taxas em R$ fixo, com "% + R$" do canvas fora (D3); seletor "Tipo" da chave Pix só de interface (D4); lembretes por dia no padrão RN-COB-17, Push "Em breve" (D5); Endereço, "Copiar link", QR, PDF e contagem de pedidos ficam para a #162 (D7); "Diretório de academias" "Em breve" com o valor salvo preservado (D8).
- Divergências com o canvas, registradas: Switch ligado laranja no sistema e verde no canvas (componente base, fora do item); abas do celular sublinhadas e não em pílula; a 390 px as abas Pagamentos, Lembretes, Links e Permissões são conferidas só pelo sistema (D9), com GMConfig e GMConfigUnidade (360 px) comparadas à mão; chips de vencimento de 1 a 28 contra 5 do canvas.
- Regressão local (construção): `test:cov` teve `telasCanvas419`, corrigido na própria nota de `UnitLinksTab.tsx`, e `TeacherFormDialog` (timeout de 20 s sob carga); `e2e` teve 2 falhas em `portal-pedidos` (timeout sob carga). Os três passaram isolados (instabilidade, anotada no PR). Base `dev` não avançou desde a verificação, então a regressão da verificação vale.
- Limitação: o PR para `dev` roda o CI das áreas alteradas (`ci-gate`); o `e2e:full` e a regressão inteira ficam para o PR de `dev` para `main`, na revisão da sprint.
