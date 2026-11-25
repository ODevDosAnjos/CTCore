# 718 — 646b · Cabeçalhos sem subtítulo: Operação

Origem: issue #718 (parte b da #646, RNF-45; decisões 33 e 34 de `docs/auditoria/decisoes-canvas.md`). Branch: `item/718-cabecalhos-operacao`. Item-mãe: `specs/itens/646-cabecalhos-sem-subtitulo.md`. Modelo: `specs/itens/717-cabecalhos-pessoas.md`.

## 1. Objetivo

Nas telas de Operação (agenda, dias sem aula, turmas, faixas etárias, modalidades e pedidos do portal), tirar o subtítulo com a unidade, as contagens soltas, as frases de regra interna e as notas de regra, e apagar do `pt-BR.json` as chaves que ficarem sem uso. O gestor vê só título, ações e conteúdo. Ficam o que identifica o registro (subtítulo de janela e painel) e a dica de formato junto do campo.

Fora: Financeiro, Comunicação, Configurações, conta e portal (partes c a e); mudar layout, API ou regra.

## 2. Requisitos

- R1: `/agenda` mostra só o título (some "Unidade X · 8 semanas sempre criadas…" e a variante sem unidade).
- R2: `/dias-sem-aula` mostra só o título (some "Unidade X · a mensalidade não muda…"); some a nota "Feriados nacionais aparecem aqui…" dos feriados sugeridos; some a linha "A mensalidade não muda." da prévia da janela de dia sem aula (`noClassDays.dialog.fee`).
- R3: `/turmas` mostra só o título (some "Unidade X · N ativas · a turma não guarda presença", as variantes `subtitleAll` e `subtitleLoading`); a dica "A unidade não muda depois de criada." (`classes.form.unitFixed`) sai do formulário de edição.
- R4: `/faixas-etarias` mostra só o título (some "Administrativas: organizam turmas…").
- R5: `/modalidades` mostra só o título (somem `subtitle` e `subtitleReadOnly`) e some a nota de rodapé `modalities.note`; o aviso `readOnlyBanner` do Administrador fica.
- R6: Pedidos do portal mostram só o título (some "Tudo que chegou pelo portal e pelo link de matrícula…").
- R7: Chaves do `pt-BR.json` sem uso saem (no mínimo `agenda.subtitle*`, `noClassDays.subtitle`, `noClassDays.suggestions.note`, `noClassDays.dialog.fee`, `classes.subtitle*`, `classes.activeCount_*`, `classes.form.unitFixed`, `ageRanges.subtitle`, `modalities.subtitle*`, `modalities.note`, `portalRequests.subtitle`), depois de `grep` de cada uma.
- R8: Quatro estados, layout e rotas inalterados além da falta dos textos; padrão de rotas e telas do AGENTS.md.
- R9: Testes que conferiam os textos passam a conferir a ausência; só as referências visuais das telas da parte (e das que as mostram ao fundo) são regeradas; a lista tela por tela vai na descrição do PR.

## 3. Critérios de aceite

- CA1 (R1): dada a Agenda carregada, com ou sem unidade, então o cabeçalho tem "Agenda" e as ações, sem "8 semanas" nem nome da unidade.
- CA2 (R2): dados `/dias-sem-aula` e a janela de novo dia sem aula com a prévia pronta, então não há "a mensalidade não muda" no cabeçalho nem na prévia, nem "Feriados nacionais aparecem aqui"; a prévia mantém a contagem de aulas e de experimentais.
- CA3 (R3): dada `/turmas` carregando, carregada e em "Todas as unidades", então o cabeçalho não tem contagem, unidade nem "não guarda presença"; na edição de turma não há "A unidade não muda depois de criada."
- CA4 (R4): dada `/faixas-etarias`, então não há "Administrativas: organizam turmas".
- CA5 (R5): dada `/modalidades` como Coordenador e como Administrador, então não há subtítulo nem a nota "Variações como No-Gi…"; o banner do Administrador continua.
- CA6 (R6): dada a lista de pedidos do portal, então não há "Tudo que chegou pelo portal".
- CA7 (R7): `npm run lint` e `npm test` passam e `grep` das chaves removidas no código e nos testes não acha uso.
- CA8 (R8, R9): os casos visuais de agenda, dias sem aula, turmas, faixas etárias, modalidades e pedidos do portal (nomes exatos em `frontend/visual/casos.ts`) passam sem `--update-snapshots` depois de regerar; a comparação com o canvas (1440 e 390 px) não piora; nenhuma referência de outra parte muda sem explicação.

## 4. Plano técnico

- Dados, API e segurança: não mudam (só texto de tela).
- Interface (arquivos vistos, em `frontend/src`):
  - `features/agenda/AgendaPage.tsx`: apagar `const subtitle` (~52) e `subtitle={subtitle}` (~66).
  - `features/noClassDays/NoClassDaysPage.tsx`: tirar `subtitle=` (~101) e o `<p>` da nota (~126); `NoClassDayDialog.tsx`: tirar `<p>{t("noClassDays.dialog.fee")}</p>` (~222).
  - `features/classes/ClassesPage.tsx`: tirar `active`/`subtitle` (~95-99) e o que ficar sem uso (`counts`, `unitName`; se a consulta de contagem existir só para isso, remover a chamada); `ClassFormDialog.tsx`: tirar o `hint=` de `unitFixed` (~190).
  - `features/age-ranges/AgeRangesPage.tsx` (~65), `features/modalities/ModalitiesPage.tsx` (~198 e o `<p>` ~229), `features/portal-requests/PortalRequestsPage.tsx` (~167): tirar `subtitle=` e a nota, com o que ficar sem uso (ex.: `canManage` só se nada mais o usar).
  - `i18n/pt-BR.json`: apagar as chaves de R7 (blocos `agenda` ~1126, `noClassDays` ~1358, `classes` ~1774, `ageRanges` ~2064, `modalities` ~2112, `portalRequests` ~3574). Ficam `agenda.correct.subtitle`, `classes.*` de painel e diálogos e demais subtítulos que identificam o registro.
  - `PageHeader` já aceita `subtitle` opcional; nada a criar.
- Testes a ajustar (achados por `grep`): `agenda/AgendaPage.test.tsx` (~155), `noClassDays/NoClassDaysPage.test.tsx` (~108, 190, 241 e a mensagem do desfazer ~297, conferindo qual chave usa), `classes/ClassesPage.test.tsx` (~127, 140 e o teste ~262 que lê o `pt-BR.json`), `classes/ClassFormDialog.test.tsx` (~206), `age-ranges/AgeRangesPage.test.tsx` (~79), `modalities/ModalitiesPage.test.tsx` (~135, 141, 152), `portal-requests/PortalRequestsPage.test.tsx` (~98). O `grep` não achou esses textos em `e2e/` nem em `visual/*.ts`; reconferir.
- Visual: referências em `frontend/visual/referencias` dos casos da parte; sem caso novo. Janelas e painéis sobre essas listas e a moldura podem mudar: rodar a suíte visual inteira com `--workers=2` antes do push, para não repetir o que a #717 pegou só no CI. Capturas em `.capturas/718/`.
- Riscos: chave apagada usada por variante ou por outra tela só quebra na execução (grep antes); `ClassesPage` pode ficar com código sem uso; referências de outras telas que mostram Operação ao fundo.

## 5. Tarefas

- [x] T1: Tirar `subtitle` e notas de `AgendaPage`, `NoClassDaysPage`, `NoClassDayDialog`, `ClassesPage`, `ClassFormDialog`, `AgeRangesPage`, `ModalitiesPage` e `PortalRequestsPage`, com o código que ficar sem uso, e apagar as chaves de R7 após `grep` de cada uma — cobre CA1 a CA7 — prova: `cd frontend && npm run typecheck && npm run lint`
- [x] T2: Ajustar os testes listados no plano (e e2e ou `telasCanvas` que citem os textos) para conferir a ausência — cobre CA1 a CA6 — prova: `cd frontend && npm test -- AgendaPage NoClassDaysPage ClassesPage ClassFormDialog AgeRangesPage ModalitiesPage PortalRequestsPage`
- [x] T3: Capturas do sistema e do canvas em `.capturas/718/` (1440 e 390 px, pt-BR), `npm run visual:canvas`, regerar só as referências que mudaram (casos da parte e telas que os mostram ao fundo) com `-- --update-snapshots -g "<caso>"`; rodar a suíte inteira sem `--update-snapshots` — cobre CA8 — prova: `cd frontend && npm run test:visual:docker -- --workers=2`
- [x] T4: Regressão local reduzida (`npm run lint && npm run typecheck && npm run build && npm test`; `npm run e2e -- <specs de agenda, dias sem aula, turmas, faixas, modalidades e pedidos>`, nomes conferidos em `frontend/e2e`) e lista tela por tela para o PR, com `Regressão local` e `Comparação com o canvas` registrados — cobre CA7, CA8 — prova: os comandos acima

## 6. Decisões

- D1: Parte b da #646 (resposta do dono à P6, 25/11/2026); a #646 fecha na #721.
- D2 (muda o comportamento): além das chaves nominadas na #646, saem `ageRanges.subtitle`, `modalities.subtitle*`, `modalities.note` e `portalRequests.subtitle`, porque a issue manda tirar frase de regra interna e nota de regra de faixas, modalidades e pedidos do portal (RNF-45). Alternativa descartada: manter essas frases.
- D3: `modalities.readOnlyBanner` fica: é aviso de permissão com orientação de onde agir, não subtítulo.
- D4: Subtítulos de painel e diálogo que identificam o registro, a contagem de aulas afetadas na prévia e `agenda.correct.*` ficam.
- D5: Sem caso visual novo; a mudança de referência vem só da falta dos textos. A T3 roda a suíte inteira porque fundos de janela e moldura mudaram na #717.
- Suposição: `noClassDays.dialog.fee` é a linha da prévia da janela (`NoClassDayDialog.tsx` ~222); a mensagem do desfazer (teste ~297) pode usar outra chave. Se for a mesma, entra na T1 e a regra é a mesma. Previstos cerca de 16 arquivos contáveis (8 de código, 7 de teste, `pt-BR.json`), abaixo de 30.

## Construção

- T1 — arquivos: AgendaPage, NoClassDaysPage, NoClassDayDialog, ClassesPage (sem `counts`, `unitName` nem `active`; `header` sem argumento), ClassFormDialog, AgeRangesPage, ModalitiesPage, PortalRequestsPage (.tsx) e `i18n/pt-BR.json` (16 chaves: `agenda.subtitle*`, `noClassDays.subtitle`, `noClassDays.suggestions.note`, `noClassDays.dialog.fee`, `classes.subtitle*`, `classes.activeCount_*`, `classes.form.unitFixed`, `ageRanges.subtitle`, `modalities.subtitle*`, `modalities.note`, `portalRequests.subtitle`) — prova: `grep` das chaves em src, e2e e visual sem uso; `npm run typecheck && npm run lint` → passou
- T2 — arquivos: testes de AgendaPage, NoClassDaysPage, ClassesPage, ClassFormDialog, AgeRangesPage, ModalitiesPage, PortalRequestsPage e StudentRecordPanel (citava "8 semanas" ao fundo, achado pela regressão), `e2e/no-class-days.spec.ts` (`toHaveCount(0)`) — prova: `npm test -- <7 telas>` → 9 arquivos, 148 testes passaram
- T3 — suíte visual inteira com `--workers=2` sem `--update-snapshots`: 87 falhas (577 passaram, 29,6 min); regeradas só essas, 87 referências; reexecução dos mesmos casos sem `--update-snapshots`: 112 passaram. `npm run visual:canvas -- --exige` → 165 comparadas, 0 reprovadas. Capturas em `.capturas/718/` (1440 e 390 px, tema claro; 16 imagens).
- T4 — `npm run lint && typecheck && build && npm test` → 3042 testes, 1 falha (StudentRecordPanel, corrigida, 31 passaram depois); `npm run e2e -- no-class-days agenda classes modalit age-ranges portal-requests pedidos` → 11 passaram.
Regressão local: cerca de 50 min (visual inteiro 30 + regeração 6 + reconferência 5 + testes 10). Comparação com o canvas: cerca de 1 min (visual:canvas 20 s, cópia das capturas); conferência lado a lado a cargo da verificação.
Visual do CI (suíte inteira, local): passou depois de regerar.
Referências visuais (87 arquivos em `frontend/visual/referencias`), por caso (claro/escuro, 1440 e 390 conforme o caso): agenda, agenda-aula-avulsa, agenda-painel, agenda-painel-professor, aula-avisar-turma, aula-cancelar, aula-corrigir, aula-editar, aula-editar-seguintes, configuracoes-faixa-nova, configuracoes-faixas-etarias, configuracoes-modalidade-desativar, configuracoes-modalidades, configuracoes-modalidades-administrador, configuracoes-modalidades-graduacao, configuracoes-modalidades-pedido, dia-sem-aula-novo, dias-sem-aula, ficha-professor (agenda ao fundo), moldura-professor (agenda), pedido-recusar, pedidos, turma-desativar, turma-editar, turma-nova, turma-painel, turma-titular-inativo, turmas.
Desvios: StudentRecordPanel.test.tsx não estava na lista do plano; teve a linha que esperava "8 semanas" removida. A suíte visual falhou em casos de fundo (janelas e painéis sobre a agenda e a lista de turmas), como previsto no plano. Divergências com o canvas: nenhuma nova.
Não é do item: nada.

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-25, estado df802e956bb661ca1240317e8e59e7c26eefb8ab

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | AgendaPage.test (passou na suíte); `subtitle` removido do código |
| CA2 | PASSOU | NoClassDaysPage.test e e2e no-class-days (toHaveCount(0)); prévia mantém contagem e experimentais |
| CA3 | PASSOU | ClassesPage.test CA1 carregando e "todas" (o de "todas" falhou 1x na suíte, ver achado); ClassFormDialog.test passou |
| CA4 | PASSOU | AgeRangesPage.test passou |
| CA5 | PASSOU | ModalitiesPage.test passou; banner mantido |
| CA6 | PASSOU | PortalRequestsPage.test passou |
| CA7 | PASSOU | lint, typecheck, build ok; grep das 16 chaves em src, e2e e visual: sem uso (só `activeCount`/`unitFixed` de outros componentes/chaves) |
| CA8 | PASSOU | `test:visual:docker -g "turmas\|agenda\|dias-sem-aula\|pedidos\|modalidades\|faixas"` 64 passaram; capturas `.capturas/718` turmas 1440 sistema x canvas: só diferem pelo subtítulo removido, esperado; 87 referências alteradas, todas de casos da lista do item |

Comandos: `npm run lint && typecheck && build` ok; `npm test` 3041 passaram, 1 falhou (ClassesPage.test "todas", `calls.at(-1)` undefined); `npx vitest run ClassesPage.test.tsx --maxWorkers=2` x3: 20 passaram em todas; `npm run e2e -- no-class-days agenda classes modalit age-ranges portal-requests pedidos` 11 passaram; visual dos casos da parte 64 passaram. Suíte visual inteira, e2e inteiro, `test:cov` e backend: não rodaram (ficam para o CI; item só de front).
Instáveis: ClassesPage.test.tsx "CA1: com o escopo "todas"..." falhou 1 de 4 execuções (1 na suíte inteira, 3 isoladas ok).
Achados:
- obrigatório, código, `frontend/src/features/classes/ClassesPage.test.tsx` teste 'CA1: com o escopo "todas" não há subtítulo e a lista não filtra por unidade' — esperado: teste determinístico; observado: depois de tirar o `findByText` do subtítulo (que só aparecia depois da listagem, com a contagem), `await findByRole("button", {name:"Nova turma"})` não espera a chamada da lista, e `calls.at(-1)!.has("unitId")` lança TypeError quando `calls` está vazio (falhou na suíte inteira); evidência: log do `npm test`, linha 144; corrigir: esperar a chamada antes de ler, como no outro teste: `await waitFor(() => expect(calls.at(-1)!.has("unitId")).toBe(false))`. Mesmo risco no teste CA1 vizinho (usa waitFor, ok) e em "#676 CA3" (usa waitFor, ok).
- sugestão, código, `ClassesPage.test.tsx` título do teste RN-TUR-06 termina em "frequência, " (vírgula sobrando).

### Correção da rodada 1
- Teste instável de `ClassesPage.test.tsx` ("todas"): a leitura de `calls.at(-1)` passou a esperar a chamada com `waitFor`; título do teste RN-TUR-06 sem a vírgula sobrando — arquivos: `frontend/src/features/classes/ClassesPage.test.tsx` — prova: `npx vitest run ClassesPage.test.tsx` x3 → 20 passaram nas três; `npm run lint` → passou

### Rodada 2 — NAO_CONFERIDO — 2026-11-25, estado 138a231b3bfdac4dca550d141f3a7a227cb03692

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA6 | PASSOU | mantido da rodada 1; `npm test` 277 arquivos, 3042 testes passaram |
| CA7 | PASSOU | lint, typecheck, build ok; `npm test` verde |
| CA8 | PASSOU | mantido da rodada 1 (só mudou teste, sem efeito visual) |

Comandos: `npx vitest run ClassesPage.test.tsx --maxWorkers=2` x3: 20 passaram em todas; `npm run lint`, `typecheck`, `build` ok; `npm test` 3042 passaram. Diff desde a rodada 1: só `ClassesPage.test.tsx` (`waitFor` na leitura de `calls.at(-1)`; vírgula do título removida).
Não rodaram nesta rodada: e2e e visual dos casos (sem mudança de produto desde a rodada 1, onde passaram); suíte visual inteira, e2e inteiro e `test:cov` ficam para o CI. Por isso o resultado é parcial.
Instáveis: o da rodada 1 foi corrigido (3 de 3 execuções ok).
Achados: o obrigatório da rodada 1 está resolvido; a sugestão da vírgula também.

### Rodada 3 — OK — 2026-11-25, estado 278e37fd40f4f6722a5b94e1d48425d08c0a9521

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA6 | PASSOU | mantido das rodadas 1 e 2; `npm test` 3042 passaram (rodada 2) |
| CA7 | PASSOU | lint, typecheck, build e `npm test` verdes (rodada 2) |
| CA8 | PASSOU | `test:visual:docker -g "turmas\|turma-\|agenda\|dias-sem-aula\|dia-sem-aula\|pedidos\|pedido-\|modalidade\|faixa\|aula-"` sem `--update-snapshots`: 160 passaram; capturas em `.capturas/718` conferidas na rodada 1 |

Comandos: `npm run e2e -- no-class-days agenda classes modalit age-ranges portal-requests pedidos` 11 passaram; visual dos casos da tela 160 passaram. Diff desde a rodada 2: só este arquivo do item (`specs/itens/718-...md`); `specs/itens/646-cabecalhos-sem-subtitulo.md` é o arquivo do item-mãe, alterado pela fase 2, faz parte da entrega.
Pela regra de regressão local reduzida do AGENTS.md, suíte visual inteira, e2e inteiro e `test:cov` são só do CI; a ausência deles não gera NAO_CONFERIDO (resposta do dono à rodada 2).
Instáveis: nenhum nesta rodada.
Achados: nenhum.

## Entrega

- O que muda: os cabeçalhos de Agenda, Feriados e recessos, Turmas, Faixas etárias, Modalidades e Pedidos do portal deixam de mostrar o subtítulo com a unidade e a contagem (RNF-45), e as 16 chaves de texto correspondentes saem de `pt-BR.json`. Layout, rotas e demais textos ficam como estavam; o banner de Modalidades segue.
- Como foi verificado: rodada 3 da verificação `OK` (estado `278e37fd40f4f6722a5b94e1d48425d08c0a9521`): lint, typecheck e build verdes; `npm test` com 3042 testes passando (rodada 2, sem mudança de produto depois); `e2e` dos specs das sete telas com 11 passando; visual dos casos da tela, sem `--update-snapshots`, com 160 passando; `visual:canvas --exige` com 165 comparadas e 0 reprovadas. A suíte visual inteira rodou na construção, com 87 referências regeradas só dos casos da tela, e foi reconferida.
- Comparação com o canvas: capturas em `.capturas/718/`. A única diferença é o subtítulo removido, que segue a decisão 33/34 de `docs/auditoria/decisoes-canvas.md`. Nenhuma divergência nova e nenhuma exceção `limiteCanvas`.
- Escopo: 18 arquivos contáveis (código, testes, e2e e i18n), abaixo do limite de 30. As 87 referências visuais não entram na contagem.
- Instabilidade: `ClassesPage.test.tsx` todas corrigido na rodada 1 (espera a chamada antes de ler `calls.at(-1)`); 3 de 3 execuções isoladas passaram.
- Limitações: o canvas ainda mostra o subtítulo, por isso a diferença aparece na comparação e fica registrada. Telas de fundo (agenda e lista de turmas) foram conferidas pela suíte visual inteira local, não só pelos casos da tela.
- Regressão local: cerca de 50 min (construção).
