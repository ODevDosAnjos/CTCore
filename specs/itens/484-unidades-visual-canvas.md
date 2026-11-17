# 484 — Unidades: lista, nova unidade, desativar e unidade única no visual do canvas

Origem: issue #484 (Sprint 10.5, Fase 3, plano G3), `docs/auditoria/plano-de-issues.md`, `docs/auditoria/decisoes-canvas.md` (R1 a R4); evidências M21, M62, M63, M64. Branch: `item/484-unidades-visual-canvas`. Canvas: `ConfigUnidades`, `UnidadeNova`, `UnidadeDesativar`, `UnidadeUnica` (1440 px, tema claro; não há versão escura nem de celular). Dependências #450, #451, #460, #461, #462 já em `dev` (`ComingSoon`, `ConfirmDialog` destrutivo, `Modal` com tamanhos e rodapé, `SummaryBox`, `WindowSteps`, `BlockerChecklist`). Os itens #482 e #483 são o modelo de padrão de tela.

## 1. Objetivo

Deixar Configurações › Unidades (Coordenador) igual ao canvas: lista com cabeçalho, subtítulo, tabela em cartão e ações "Abrir"/"Ver histórico"; assistente "Nova unidade" de 4 etapas em cartão; janela "Desativar a <unidade>" com checklist "O que impede agora" e confirmação por "DESATIVAR" e senha (RN-ACE-21); janela informativa da unidade única. Duas regras mudam para igualar o canvas (D1 e D2), e a API ganha só os dados que o canvas mostra.

Fora do escopo: mapa real com pino (D5); tela de assinatura e "Ir para a assinatura" funcional; tela de histórico da unidade desativada; reativar unidade.

## 2. Requisitos

- R1 (M21): título "Unidades" com "Nova unidade" (ícone +) no canto superior direito e subtítulo "N ativas · até 10 unidades e 200 usuários por organização · unidades não mudam o preço" (com uma só: "1 unidade ativa"); tabela dentro de cartão, cabeçalho em texto normal (Unidade, Cidade, Alunos ativos, Administradores, Situação, Nome curto); selo "Ativa" ou "Desativada em dd/mm/aaaa".
- R2 (M21): ações por linha: "Abrir" na ativa (vai para Configurações › Unidade daquela unidade) e "Ver histórico" na desativada, visível e desabilitado com "Em breve" (D4); sem "Configurar", "Desativar" nem "Ajustar nome curto" na linha.
- R3 (M21): abaixo da tabela, a nota "O nome curto aparece nos links públicos (ctcore.com.br/aula/<nome curto>). É único na plataforma e pode ser ajustado uma vez; o antigo redireciona." e, por unidade ativa, o botão vermelho "Desativar <nome>…"; o ajuste do nome curto (uma vez, RN-ORG-15) continua possível, agora a partir da unidade aberta (D3).
- R4 (M62, RF-ORG-03): "Nova unidade" é um cartão com assistente de 4 etapas em linha (Nome e endereço, Contato, Modalidades, Administrador), subtítulo "Assistente curto · o resto entra nos "Primeiros passos" da unidade", "Cancelar" e "Continuar" com seta; etapa 1 com Nome da unidade, "Nome curto" (gerado já do nome, "Gerado do nome; ajustável uma vez"), CEP e Endereço lado a lado e a área do mapa (D5) com latitude e longitude.
- R5 (M62): etapa Modalidades oferece as modalidades ativas da organização (interruptor por modalidade, nenhuma obrigatória); etapa Administrador traz o convite opcional (nome e e-mail, ambos ou nenhum); a unidade só é criada no fim, e as modalidades escolhidas são ligadas logo depois da criação (D6).
- R6 (M63, RN-ORG-11): "Desativar <nome>…" abre a janela "Desativar a <nome>" (título em caixa alta, vermelho) com o texto "Desativar exige que não haja alunos com modalidade ativa nem turmas ativas. O histórico fica para consulta.", o bloco "O que impede agora" com uma linha por item (N alunos com modalidade ativa e "Ver alunos"; N turmas ativas e "Ver turmas"; N cobranças em conferência ou "Nenhuma cobrança em conferência"), cada uma ✓ verde ou ✗ vermelha, o texto "Transfira ou encerre as modalidades antes. Depois volte aqui para confirmar digitando DESATIVAR e sua senha." e rodapé "Fechar" e "Desativar unidade" (vermelho, desabilitado enquanto algo impede ou a confirmação não bate).
- R7 (M63, RN-ORG-11, RN-ACE-21, D1): sem impedimento, a janela pede digitar `DESATIVAR` (sem diferenciar maiúsculas, sem espaços nas pontas), depois a senha (`ReauthDialog`) e só então chama `POST /units/{id}/deactivation` com `X-Reauth-Token`; a confirmação digitada que o servidor exige passa a ser `DESATIVAR`, não mais o nome da unidade.
- R8 (M63, D2): cobrança em conferência (status `IN_REVIEW` da unidade) impede desativar; `GET /units/{id}/deactivation-check` devolve `pendingProofs`, e `POST …/deactivation` responde 409 `UNIT_HAS_BLOCKERS` com a contagem.
- R9 (M64, RN-ORG-11): quando a unidade é a única ativa, o botão abre a janela só informativa "A única unidade ativa não pode ser desativada", "Toda organização tem ao menos uma unidade ativa. Para encerrar o uso do ctcore, cancele a assinatura em Configurações › Assinatura.", com "Fechar" e "Ir para a assinatura" visível e desabilitado com "Em breve" (D4); sem campo de confirmação.
- R10 (M21): a lista mostra "Desativada em <data>": `UnitSummary.deactivatedAt` (D7); a cidade é mostrada como salva (D8).
- R11: os quatro estados (carregando, vazio, erro, sem permissão), sem rolagem horizontal a partir de 360 px, axe sem violações nos dois temas, textos em `pt-BR.json`; Administrador, Professor e Aluno continuam sem acesso (RN: linha `UNITS`).
- R12: continuam valendo: limite de 10 unidades (409 `UNIT_LIMIT_REACHED`), validação dos campos do assistente, auditoria `unit.deactivated` e `unit.created`, isolamento entre organizações e perfis, token de reautenticação consumido por último.
- R13: `docs/especificacao/01-organizacao-e-isolamento.md` (RN-ORG-11), `docs/openapi.yaml` e o MSW mudam junto, antes do código (D1, D2, D7).
- R14: no teste visual, o caso `configuracoes-unidade-desativar` perde o `limiteCanvas` e `npm run visual:canvas` o aprova no limite padrão de 30%; há casos para lista, nova unidade (4 etapas na primeira), desativar e unidade única.

## 3. Critérios de aceite

- CA1 (R1, R10): dado o Coordenador com Tijuca, Barra e Méier (desativada em 30/06/2026), então vê o subtítulo "2 ativas · …", a tabela em cartão com os seis cabeçalhos, "Ativa" nas duas e "Desativada em 30/06/2026" na terceira; com uma só ativa, o subtítulo é "1 unidade ativa".
- CA2 (R2): dado a lista, então as ativas têm "Abrir" (leva a `/configuracoes/unidade` na unidade escolhida), a desativada tem "Ver histórico" desabilitado com "Em breve" e nenhuma linha tem "Configurar", "Desativar" ou "Ajustar nome curto".
- CA3 (R3): dado a lista, então a nota do nome curto aparece abaixo da tabela com o nome curto da primeira unidade ativa e há um botão vermelho "Desativar <nome>…" por unidade ativa; o ajuste do nome curto continua único (409 na segunda vez, RN-ORG-15) pela unidade aberta (D3).
- CA4 (R4): dado "Nova unidade", quando digita "Academia Leão — Tijuca" na etapa 1, então "Nome curto" mostra `academia-leao-tijuca`; as quatro etapas aparecem em linha com a ativa marcada; "Cancelar" volta à lista; "Continuar" só habilita com nome válido; a etapa 1 mostra CEP e Endereço lado a lado e a área do mapa.
- CA5 (R5): dado a etapa Modalidades, então lista só modalidades ativas da organização com interruptor; nenhuma marcada permite continuar; dado a etapa Administrador com só um de nome e e-mail, então "Continuar" fica desabilitado.
- CA6 (R5, R12): dado o assistente concluído com duas modalidades e administrador, então `POST /units` recebe os dados, as duas modalidades são ligadas na unidade criada, aparece a confirmação e a lista mostra a nova unidade; dado 409 `UNIT_LIMIT_REACHED`, aparece a mensagem do limite e nada é criado; dado 400 em um campo, o erro aparece na etapa do campo.
- CA7 (R6): dado Barra com 83 alunos, 5 turmas e 0 cobranças em conferência, quando abre "Desativar a Barra…", então vê o título em caixa alta e vermelho, o texto, o checklist com ✗ em alunos e turmas, ✓ em "Nenhuma cobrança em conferência", os links "Ver alunos" e "Ver turmas", a orientação e "Fechar" e "Desativar unidade" desabilitado.
- CA8 (R7): dado unidade sem impedimentos, quando digita "desativar" (qualquer caixa, com espaços) e confirma com a senha, então `POST …/deactivation` vai com `X-Reauth-Token` e `confirmation`, a janela fecha, a lista recarrega com "Desativada em <hoje>" e aparece aviso; texto diferente de DESATIVAR mantém o botão desabilitado.
- CA9 (R7, R12): dado `confirmation` em branco ou diferente de "DESATIVAR" (qualquer caixa, espaços nas pontas aceitos), então o servidor responde 400 `VALIDATION_ERROR` em `confirmation` e nada muda; dado o nome da unidade no lugar, também 400; token ausente, vencido ou usado, 403 `REAUTH_REQUIRED`.
- CA10 (R8): dado uma cobrança `IN_REVIEW` na unidade, então `deactivation-check` traz `pendingProofs = 1` e `canDeactivate = false`, `POST` dá 409 `UNIT_HAS_BLOCKERS` com `pendingProofs`, a unidade segue ativa e o token não é consumido; cobrança em conferência de outra unidade ou organização não conta.
- CA11 (R9): dado só uma unidade ativa, quando clica "Desativar <nome>…", então abre a janela informativa com o título e o texto do canvas, "Fechar" e "Ir para a assinatura" desabilitado com "Em breve", sem campo de confirmação e sem chamar a rota de desativação.
- CA12 (R10): `GET /units` devolve `deactivatedAt` (instante) nas desativadas e nulo nas ativas; a desativação grava `deactivated_at`; unidades já desativadas antes da migração ficam com nulo e a lista mostra "Desativada" sem data.
- CA13 (R11): dado carregando, vazio, erro (com "Tentar de novo") e 403, então cada estado aparece; em 360 px sem rolagem horizontal da página; axe sem violações nos dois temas na lista, no assistente e nas duas janelas.
- CA14 (R11): dado Administrador, Professor ou Aluno, então `GET /units` e as rotas de desativação respondem 403 e "Unidades" não aparece no menu.
- CA15 (R13): `OpenApiContractTest` e `ContractRoutesTest` passam com `deactivatedAt`, `pendingProofs` e a nova descrição de `confirmation`.
- CA16 (R14): o teste visual com MSW tem os casos `configuracoes-unidades`, `configuracoes-unidade-nova`, `configuracoes-unidade-desativar` e `configuracoes-unidade-unica` a 1440 e 390 px, comparados com o canvas; `configuracoes-unidade-desativar` sem `limiteCanvas` e aprovado no limite padrão.

## 4. Plano técnico

- Dados: migração `V54__unit_deactivated_at.sql` (a criar): `alter table unit add column deactivated_at timestamptz`, com reversão descrita no arquivo; sem política nova (RLS da tabela `unit` já cobre a coluna). Seed `infra/seed/` não muda.
- Especificação (primeiro): `docs/especificacao/01-organizacao-e-isolamento.md`, RN-ORG-11: acrescentar "nem cobranças em conferência" e trocar "Confirmação digitada: o nome da unidade" por "Confirmação digitada: DESATIVAR, e a senha (RN-ACE-21)".
- API (`docs/openapi.yaml`): `UnitSummary.deactivatedAt` (date-time, nullable); `UnitDeactivationCheck.pendingProofs` (integer ≥ 0, obrigatório); `UnitHasBlockers` ganha `pendingProofs`; descrição de `confirmation` em `/units/{id}/deactivation` passa a "DESATIVAR". Sem rota nova.
- Back-end (pacote `br.com.ctcore.organization`, vistos): `UnitDeactivation.java` (confirmação `DESATIVAR`, `pendingProofs` no check e no 409, grava `deactivated_at = now()` na mesma transação da auditoria); `UnitDeactivationBlockers.java` (`pendingProofs(unitId)`: `select count(*) from charge where unit_id = :id and status = 'IN_REVIEW'`; versão `Jdbc` e a que devolve zero, se existir); `UnitList.java` (`UnitSummary.deactivatedAt`); `UnitController.java` só se o corpo mudar de forma. Testes alterados: `UnitDeactivationIT`, `UnitListIT`, `UnitRouteIT`; teste de isolamento da contagem de conferência entre organizações e unidades dentro de `UnitDeactivationIT`.
- Interface (`frontend/src/features/units/`, vistos): `UnitsPage.tsx` (`PageHeader` com ação e subtítulo, tabela em `Card`, selo, "Abrir", nota, botões vermelhos); `NewUnitPage.tsx` (cartão, `WindowSteps` em linha, 4 etapas, "Nome curto" gerado no cliente igual a `ShortName`, área do mapa com `ComingSoon`, chamadas das modalidades após a criação); `DeactivateUnitDialog.tsx` (`Modal` com título em caixa alta vermelho, `BlockerChecklist`, campo DESATIVAR, `ReauthDialog`, rodapé fixo; ramo "única unidade"); `ShortNameDialog.tsx` (mantido; passa a abrir pela unidade aberta, D3); `useUnits.ts` (`deactivatedAt`); `frontend/src/features/units/UnitDataTab.tsx` só se o ajuste do nome curto precisar do ponto de entrada (D3); `pt-BR.json` (`units.*`); `frontend/src/mocks/handlers.ts` (`deactivatedAt`, `pendingProofs`, confirmação `DESATIVAR`, cidade "Rio de Janeiro/RJ" nos dados do caso); `frontend/visual/casos.ts` (casos, `limiteCanvas` removido do desativar, cenário "unidadesCanvas" com Tijuca, Barra e Méier, e cenário de unidade única); testes `UnitsPage.test.tsx`, `NewUnitPage.test.tsx`, `DeactivateUnitDialog.test.tsx`; e2e `unidades.spec.ts`, `nova-unidade.spec.ts` (ajustar os textos). Reuso: `ComingSoon`, `ConfirmDialog` destrutivo, `Modal`, `WindowSteps`, `BlockerChecklist`, `SummaryBox`, `Switch`, `Field`/`Input`, `PageHeader`, `Card`, `ReauthDialog`, `states`, `UnitScope`.
- Segurança: permissão no servidor (`UNITS` FULL); token de uso único `DEACTIVATE_UNIT` consumido por último; a confirmação `DESATIVAR` é só trava de interface e de erro de digitação, a barreira é a senha; auditoria sem senha nem token; id de unidade conferido contra a organização (404); a contagem de conferência respeita organização e RLS.
- Riscos: (1) o conjunto de modalidades pós-criação não é atômico: se uma chamada falhar, a unidade existe e a tela avisa e leva à unidade (D6); (2) `limiteCanvas` do desativar a 1440 px pode seguir reprovando por fundo (a lista atrás tem outros dados): corrigir com o cenário do MSW, não com exceção; (3) `Cidade/UF` fica nos dados (D8); (4) mudar a confirmação quebra testes e e2e que digitam o nome da unidade: ajustar todos.

## 5. Tarefas

Parte A: regra, contrato e back-end

- [x] T1: atualizar RN-ORG-11 na especificação e o `docs/openapi.yaml` (`deactivatedAt`, `pendingProofs`, `confirmation`), conferindo o texto antes de mexer no código — não cobre critério: regra muda primeiro na especificação (R13) — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'` depois de T2.
- [x] T2: migração `V54`, `UnitDeactivation` (confirmação `DESATIVAR`, `pendingProofs`, `deactivated_at`), `UnitDeactivationBlockers.pendingProofs` e `UnitList.deactivatedAt` — cobre CA9, CA10, CA12, CA14, CA15 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='UnitDeactivationIT,UnitListIT,UnitRouteIT'` e `test -Dtest='OpenApiContractTest,ContractRoutesTest'`.
- [x] T3: MSW: `deactivatedAt`, `pendingProofs`, confirmação `DESATIVAR`, cenários de lista e de unidade única — cobre CA1, CA11 (dados) — prova: `npx vitest run src/mocks`.

Parte B: lista e janelas

- [x] T4: `UnitsPage` no visual do canvas (cabeçalho, subtítulo, cartão, selo, "Abrir", "Ver histórico" Em breve, nota, botões vermelhos, quatro estados) — cobre CA1, CA2, CA3, CA13, CA14 — prova: `npx vitest run src/features/units/UnitsPage.test.tsx`.
- [x] T5: `DeactivateUnitDialog` (checklist, DESATIVAR, senha, rodapé, ramo da única unidade) — cobre CA7, CA8, CA11, CA13 — prova: `npx vitest run src/features/units/DeactivateUnitDialog.test.tsx`.

Parte C: assistente

- [x] T6: `NewUnitPage` em 4 etapas em cartão (nome curto gerado, CEP e endereço lado a lado, área do mapa "Em breve", Modalidades, Administrador, "Cancelar"/"Continuar") e ligação das modalidades após criar — cobre CA4, CA5, CA6, CA13 — prova: `npx vitest run src/features/units/NewUnitPage.test.tsx`.

Parte D: visual e regressão

- [x] T7: casos visuais (lista, nova, desativar sem `limiteCanvas`, única), capturas do sistema e do canvas em `.capturas/484/` (1440 e 390 px, pt-BR), `visual:canvas` e registro de `test:visual:docker -- -g "<caso>"` sem `--update-snapshots` — cobre CA16 — prova: de dentro de `frontend/`, `npm run test:visual:docker -- -g "configuracoes-unidade"` e `npm run visual:canvas`.
- [x] T8: ajustar e2e e testes que digitam o nome da unidade para desativar — cobre CA8 — prova: `npm run e2e -- unidades nova-unidade`.
- [x] T9: regressão do que mudou — não cobre critério: lint, tipos e testes da pasta — prova: `npm run lint && npm run typecheck && npx vitest run src/features/units`.

## 6. Decisões

- D1 (muda o comportamento): a confirmação digitada de desativar unidade passa de "o nome da unidade" para "DESATIVAR" (mais a senha, RN-ACE-21), como a issue pede e o canvas mostra; RN-ORG-11 é atualizada primeiro (T1). Motivo: R1 do canvas vence em confirmações e a issue é do dono. Alternativa descartada: manter o nome e só mudar o texto, que contradiz o canvas.
- D2 (muda o comportamento): cobrança em conferência passa a impedir desativar a unidade, porque o canvas a lista em "O que impede agora" e a issue a exige. Entra em RN-ORG-11. Se o dono não quiser que bloqueie, a linha vira só informativa e muda apenas `canDeactivate` e o 409. Alternativa descartada: mostrar a linha sem bloquear (a regra e a tela divergiriam).
- D3: o canvas tira "Ajustar nome curto" da linha. O ajuste (uma vez, RN-ORG-15) continua existindo na tela da unidade aberta, no campo "nome curto" da aba Dados; a nota da lista só explica a regra. Suposição: o ajuste cabe ali sem novo componente; se não couber, só o ponto de entrada muda, não a regra.
- D4: "Ver histórico" e "Ir para a assinatura" aparecem visíveis e desabilitados com "Em breve" (R3 do canvas, sem backend): não existem a tela de histórico da unidade desativada nem a de assinatura (`menuCatalog.ts`, `available=false`).
- D5: o mapa com pino arrastável não é feito: exige provedor de mapas externo, que só entra pela porta nas Sprints 22 e 23. A área do mapa aparece com "Em breve" e as coordenadas ficam em latitude e longitude (como RF-ORG-03 já prevê). Divergência a registrar no PR.
- D6: as modalidades do assistente são ligadas por `PUT /units/{id}/modalities/{modalityId}` depois de `POST /units`, sem mudar o contrato de criação. Falha parcial: a unidade existe, a tela avisa e abre a unidade para ligar o que faltou. Alternativa descartada: `modalityIds` no `POST /units` (atômico, mas amplia o contrato e a validação sem pedido da issue).
- D7: `deactivated_at` é coluna nova (e `deactivatedAt` entra no contrato) porque o canvas mostra "Desativada em 30/06/2026" e a data não existe em outro lugar além da auditoria. Alternativa descartada: ler da auditoria, que é mais cara e frágil. Unidades já desativadas ficam sem data.
- D8: "Cidade" continua texto livre; o "/RJ" do canvas vem do dado (o MSW do caso usa "Rio de Janeiro/RJ"). Alternativa descartada: coluna de UF, regra nova sem base na especificação.
- D9: botão vermelho "Desativar <nome>…" por unidade ativa abaixo da nota, inclusive com uma só (que abre a janela informativa), em vez de "Desativar unidade" na linha do canvas da unidade única. O canvas não define qual unidade o único botão de `ConfigUnidades` desativa. Suposição: um botão por unidade ativa; muda só a posição se o dono preferir outra.
- D10: só existe canvas claro e a 1440 px; os 390 px são conferidos pelo sistema (como em #482 e #483), com `limiteCanvas` e motivo só se a comparação automática reprovar.

## Construção

- T1 — arquivos: docs/especificacao/01-organizacao-e-isolamento.md (RN-ORG-11), docs/openapi.yaml (UnitSummary.deactivatedAt, UnitDeactivationCheck.pendingProofs, UnitHasBlockers via fields, confirmation DESATIVAR) — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=UnitDeactivationIT -Dtest='OpenApiContractTest,ContractRoutesTest'` → 7 testes de contrato passam, BUILD SUCCESS
- T2 — arquivos: backend/src/main/resources/db/migration/V54__unit_deactivated_at.sql; organization/UnitDeactivation.java, UnitDeactivationBlockers.java (pendingProofs), UnitList.java (deactivatedAt), UnitCreation.java; testes UnitDeactivationIT, UnitListIT, UnitPendingProofsIT (novo, contagem real e isolamento entre unidades e organizações) — prova: `verify -Dit.test='UnitDeactivationIT,UnitListIT,UnitRouteIT,UnitPendingProofsIT,UnitCreateIT,EnrollmentCountsIT'` → 26 testes passam depois de ajustar minha asserção de nulos; `UnitDeactivationIT` 7 de 7
- T3 — arquivos: frontend/src/mocks/handlers.ts, mocks/cenarios/alunos.ts, mocks/units.msw.test.ts — prova: `npx vitest run src/mocks` → 58 arquivos passam (inclui deactivatedAt, pendingProofs, DESATIVAR, 400 com o nome, 403 sem token, 204 com data)
- T4 — arquivos: features/units/UnitsPage.tsx, UnitsPage.test.tsx, useUnits.ts, UnitDataTab.tsx, ShortNameDialog.tsx (D3: ajuste do nome curto na aba Dados da unidade), UnitSettingsPage.test.tsx, i18n/pt-BR.json — prova: `npx vitest run src/features/units/UnitsPage.test.tsx` → 8 de 8; `UnitSettingsPage.test.tsx` → 28 de 28
- T5 — arquivos: features/units/DeactivateUnitDialog.tsx, DeactivateUnitDialog.test.tsx, components/Modal.tsx (prop `tone="danger"`, título vermelho) — prova: `npx vitest run src/features/units/DeactivateUnitDialog.test.tsx` → 9 de 9
- T6 — arquivos: features/units/NewUnitPage.tsx, NewUnitPage.test.tsx — prova: `npx vitest run src/features/units/NewUnitPage.test.tsx` → 14 de 14
- T7 — arquivos: frontend/visual/casos.ts, telas.visual.ts (cenário `unidadesCanvas`: lista e unidade única; `limiteCanvas` do desativar removido; UnidadeUnica saiu de semCaso) — prova: `npm run test:visual:docker -- --update-snapshots -g ...` (só dos casos da tela) e `npm run visual:canvas` → 144 comparadas, 0 reprovadas; desativar sem `limiteCanvas` (62,2% antes de `scrim="canvas"`, agora abaixo de 30%)
- T8 — arquivos: frontend/e2e/unidades.spec.ts, nova-unidade.spec.ts — prova: `npx playwright test unidades nova-unidade` → 3 de 3 (inclui a de 360 px)
- T9 — prova: `npm run lint && npm run typecheck && npx vitest run src/features/units` → limpo, 0 erros

Capturas em `.capturas/484/`: `configuracoes-unidades`, `configuracoes-unidade-nova`, `configuracoes-unidade-desativar`, `configuracoes-unidade-unica`, cada um `-1440-sistema.png`, `-1440-canvas.png` e `-390-sistema.png` (canvas só existe em 1440 e claro, D10). Comparação a olho feita nas imagens de lado a lado de desativar, lista e nova unidade.

Visual do CI: configuracoes-unidades → passou
Visual do CI: configuracoes-unidade-nova → passou
Visual do CI: configuracoes-unidade-desativar → passou
Visual do CI: configuracoes-unidade-unica → passou
Visual do CI: configuracoes-unidade → passou (referência 1440 regerada: a aba Dados ganhou o botão "Ajustar nome curto", D3)

Referências visuais: frontend/visual/referencias/configuracoes-unidades-{1440,390}-{claro,escuro}.png, configuracoes-unidade-nova-*, configuracoes-unidade-desativar-*, configuracoes-unidade-unica-* (novas), configuracoes-unidade-1440-{claro,escuro}.png

Regressão: `./backend/mvnw -f backend/pom.xml verify` → 892 testes, 0 falhas, BUILD SUCCESS (JaCoCo incluído). Front: `npm run build` ok, `npm run lint` e `npm run typecheck` limpos, `npm run test:cov` → 2505 de 2506 (a 1ª rodada, com o back-end rodando em paralelo, teve 6 falhas por tempo esgotado e 1 real corrigida: o comentário "#484" em UnitDataTab.tsx era lido como cor fixa pelo teste telasCanvas419; a 2ª rodada, sozinha, teve só RecordEnrollment CA7, que passa isolado 16 de 16: teste instável, anotado para o PR). e2e `@critical` de unidades e nova unidade passam.

Desvios:
- Divergências com o canvas a registrar no PR: (1) o canvas mostra um só botão "Desativar a Barra…"; o sistema mostra um por unidade ativa (D9); (2) o checklist "O que impede agora" é o componente base da #462 (rótulo em caixa alta, contagem sem negrito), diferente do cartão do canvas; (3) a área do mapa é um quadro tracejado com "Em breve", sem pino (D5); (4) o canvas da Nova unidade não tem o campo Cidade; ele fica na etapa 1 junto de Latitude e Longitude (D8); (5) os passos do assistente não têm as linhas de ligação do canvas (componente `WindowSteps` base); (6) a linha de ações da tabela do canvas não tem borda no "Abrir" e sem botão "Em breve" ao lado de "Ver histórico"; o sistema usa o componente `ComingSoon`. Nenhum usou `limiteCanvas`.
- As janelas de desativar usam `scrim="canvas"` e `tone="danger"` (prop nova do Modal): o fundo do canvas é mais claro e o título é vermelho.
- Não há tela de assinatura nem de histórico: "Ir para a assinatura" e "Ver histórico" ficam com `ComingSoon` (D4).
- D3: o botão "Ajustar nome curto" aparece sempre na aba Dados da unidade; a tela da unidade não traz `shortNameAdjusted`, então depois de ajustado em outra visita o servidor responde 409 e a janela explica. Isso mudou o print de referência de `configuracoes-unidade` (1440), que não tem a ver com a tela do item mas foi consequência do ponto de entrada.
- Os `resultado.json` e imagens de `docs/design/prints/lado-a-lado/` são saída ignorada pelo Git.
- O contrato não ganhou `pendingProofs` em `UnitHasBlockers` como schema: ele já vem em `fields` do 409 (documentado na rota).
Não é do item: nenhum.

## Verificação

### Rodada 1 — OK — 2026-11-17, estado 4e8561a8f70e769d3e56d8e6dfde327b53c7112b

| Critério | Status | Evidência |
|---|---|---|
| CA1, CA2, CA3 | PASSOU | `UnitsPage.test.tsx` e `.capturas/484/configuracoes-unidades-1440-*.png` abertas: subtítulo, cartão, selos, "Abrir", "Ver histórico" + "Em breve", nota e botões vermelhos conferem com o canvas |
| CA4, CA5, CA6 | PASSOU | `NewUnitPage.test.tsx` (vitest da pasta units: 110 passam); captura da etapa 1 aberta (passos em linha, CEP/Endereço lado a lado, mapa "Em breve") |
| CA7, CA8, CA11 | PASSOU | `DeactivateUnitDialog.test.tsx`; captura do desativar aberta: título vermelho em caixa alta, checklist ✗/✓, rodapé com botão desabilitado |
| CA9, CA10, CA12, CA14 | PASSOU | `UnitDeactivationIT` 7/7, `UnitPendingProofsIT` 1/1, `UnitListIT` 4/4, `UnitRouteIT` 2/2, `UnitCreateIT` 11/11 |
| CA13 | PASSOU | testes de estados e axe nos testes da pasta e nos casos visuais (claro e escuro) |
| CA15 | PASSOU | `OpenApiContractTest` 4/4, `ContractRoutesTest` 3/3 |
| CA16 | PASSOU | `test:visual:docker -- -g "configuracoes-unidade"` 40 passaram; `visual:canvas --exige` 144 comparadas, 0 reprovadas; sem `limiteCanvas` nos casos da tela |

Comandos: `npm run lint` e `npm run typecheck` limpos; `npx vitest run src/features/units src/mocks/units.msw.test.ts` 12 arquivos, 110 testes; `mvnw verify` dos ITs acima, BUILD SUCCESS; regressão completa não repetida aqui, vale o registro da construção (892 backend, 2505/2506 front com instável anotado) e o CI do PR.
Visual do CI: configuracoes-unidades, -nova, -desativar, -unica, -unidade → passou.
Instáveis: nenhum visto nesta rodada (RecordEnrollment CA7 já anotado na construção).
Achados:
- sugestão, código, `Modal`/checklist — o checklist do canvas tem cartão com bordas e contagem em negrito; o sistema usa o componente base da #462 (divergência já registrada em "Desvios").
- sugestão, código — o desvio D3 faz "Ajustar nome curto" aparecer sempre na aba Dados; o servidor responde 409 se já ajustado (aceito e registrado).

## Entrega

**O que muda:** Configurações › Unidades igual ao canvas: lista em cartão com selos e "Abrir", "Ver histórico" em "Em breve"; assistente "Nova unidade" em 4 etapas; janela "Desativar" com checklist "O que impede agora", confirmação por "DESATIVAR" e senha; janela da unidade única. Back-end: coluna `deactivated_at` (V54), `deactivatedAt` na lista, `pendingProofs` no bloqueio de desativação; cobrança em conferência passa a impedir desativar (RN-ORG-11 atualizada); confirmação digitada passa de nome da unidade para "DESATIVAR". Contrato OpenAPI e MSW acompanham.

**Verificação:** Rodada 1 OK (estado `4e8561a8f70e769d3e56d8e6dfde327b53c7112b`). Contrato, ITs de unidade, vitest da pasta `units`, visual do CI dos casos `configuracoes-unidade*` e `visual:canvas` com 144 comparadas e 0 reprovadas.

**Decisões que o dono precisa conhecer:** D1 e D2 mudam regra de negócio para igualar o canvas (confirmação e bloqueio por conferência). D5: mapa com pino não é feito (provedor externo, Sprints 22 e 23). D9: um botão "Desativar" por unidade ativa, inclusive na unidade única. D10: 390 px sem canvas, conferidos pelo sistema.

**Limitações:** "Ver histórico" e "Ir para a assinatura" em "Em breve" (D4). Divergências com o canvas listadas em "Desvios" (componentes base das #450, #462 e `WindowSteps`). Nenhum `limiteCanvas`.

**Regressão:** base `dev` sem commits novos desde a construção, então a regressão não foi repetida. Resultado da construção: `verify` do back-end 892 testes, 0 falhas; front `test:cov` 2505 de 2506. Falha instável anotada: `RecordEnrollment` CA7 (passa isolado, 16 de 16).
