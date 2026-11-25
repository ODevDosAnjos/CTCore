# 717 — 646a · Cabeçalhos sem subtítulo: Pessoas

Origem: issue #717 (parte a da #646, RNF-45; decisões 33 e 34 de `docs/auditoria/decisoes-canvas.md`). Branch: `item/717-cabecalhos-pessoas`. Item-mãe: `specs/itens/646-cabecalhos-sem-subtitulo.md`.

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Nas telas de Pessoas (lista de alunos, assistente de matrícula, lista de professores, ficha do aluno e painel do professor), tirar o subtítulo com o nome da unidade, as contagens soltas e as frases de regra interna, e apagar do `pt-BR.json` as chaves que ficarem sem uso. O gestor vê só o título e as ações; o que identifica o registro (aluno · modalidade) e a dica de formato junto do campo continuam.

Fora do escopo: telas de Operação, Financeiro, Comunicação, Configurações, conta e portal (partes b a e); mudar layout, API ou regra de negócio.

## 2. Requisitos

- R1: `/alunos` mostra só o título "Alunos" no cabeçalho, sem subtítulo (some "Unidade X · N ativos · 1 ficha por pessoa na organização", a variante "Todas as unidades" e o "carregando…").
- R2: `/professores` mostra só o título, sem subtítulo (some "N professores · M com acesso" e o "carregando…").
- R3: `/alunos/nova-matricula` mostra só o título "Nova matrícula", sem "Unidade X · o aluno fica Ativo ao concluir" nem a variante sem unidade.
- R4: Ficha do aluno e painel do professor não têm subtítulo de unidade, contagem solta, frase de regra interna nem nota de regra; ficam o que identifica o registro e as dicas de formato junto do campo (D2).
- R5: As chaves do `pt-BR.json` que ficarem sem uso saem (no mínimo `students.subtitle*`, `students.activeCount_*`, `teachers.subtitle*`, `enrollmentWizard.subtitle*`), com `npm run lint` e `npm test` verdes.
- R6: As telas seguem com os quatro estados, sem mudança de layout além da falta do subtítulo, e o padrão de rotas e telas do AGENTS.md.
- R7: Os testes que conferiam os textos removidos passam a conferir a ausência; só os prints de referência das telas da parte são regerados; a lista tela por tela vai na descrição do PR.

## 3. Critérios de aceite

- CA1 (R1): dado o Coordenador com a unidade X ou "Todas", quando abre `/alunos` (carregando e carregado), então o cabeçalho tem "Alunos" e as ações e nenhum texto com "ficha por pessoa", "ativos" ou nome da unidade.
- CA2 (R2): dado o Coordenador em `/professores`, quando a lista carrega, então não há "professores · … com acesso" nem "carregando…" no cabeçalho.
- CA3 (R3): dado `/alunos/nova-matricula`, com ou sem unidade escolhida, então o cabeçalho tem só "Nova matrícula".
- CA4 (R4): dadas a ficha do aluno (abas Resumo, Matrícula, Financeiro, Graduações, Responsáveis, Histórico) e o painel do professor abertos, então nenhuma traz subtítulo de unidade, contagem ou regra interna; o subtítulo "aluno · modalidade" das janelas e a dica de formato (ex.: tipos de arquivo da foto) continuam.
- CA5 (R5): dado o `pt-BR.json`, quando rodam `npm run lint` e `npm test`, então passam, e `grep` das chaves removidas no código não acha uso.
- CA6 (R6): dados os casos visuais `alunos`, `alunos-filtros`, `professores`, `professor-*`, `matricula-*`, `ficha-aluno*` e `aluno-*`, quando rodam sem `--update-snapshots` depois de regerar, então passam; a comparação com o canvas (1440 e 390 px) não piora e o `limiteCanvas` que existir segue valendo.
- CA7 (R7): dado o PR, então a descrição lista as telas conferidas e as referências regeradas, e nenhuma referência de tela de outra parte mudou.

## 4. Plano técnico

- Dados, API e segurança: não mudam (só texto de tela).
- Interface (arquivos vistos no repositório, em `frontend/src`):
  - `features/students/StudentsPage.tsx` (~linhas 114-119): remover o cálculo de `active`/`subtitle` e o `subtitle=` do `PageHeader`; `counts` e `unitName` só ficam se outro trecho os usar.
  - `features/teachers/TeachersPage.tsx` (~linha 123): tirar o `subtitle`; `counts` só fica se outro trecho o usar.
  - `features/students/enrollment-wizard/EnrollmentWizardPage.tsx` (~linhas 112-118): tirar o `subtitle` e o `unitLabel` se ficar sem uso.
  - Ficha (`students/StudentRecordPanel.tsx`, `RecordSummary.tsx`, `RecordEnrollment.tsx`, `RecordHistory.tsx`, `RecordGraduations.tsx`, `RecordGuardians.tsx`, `StudentFinancialTab.tsx`) e `teachers/TeacherPanel.tsx`: conferir por leitura e `grep` se há subtítulo de unidade, contagem ou nota de regra. O levantamento não achou nenhum, então a tarefa pode terminar sem mudança de código (registrar no arquivo).
  - `i18n/pt-BR.json`: apagar as chaves de R5 (blocos `students` ~linha 507, `teachers` ~938, `enrollmentWizard` ~2643) e as que a conferência da ficha achar.
- Testes que conferem os textos: `features/students/StudentsPage.test.tsx` (CA1 da #465, ~405-415), `features/teachers/TeachersPage.test.tsx` (~120-124), `features/students/enrollment-wizard/EnrollmentWizardPage.test.tsx` (~85). Procurar também em `e2e/alunos.spec.ts`, `e2e/professores.spec.ts`, `e2e/matricula.spec.ts` e `features/telasCanvas4xx.test.ts` por `grep` dos textos removidos.
- Visual: referências em `frontend/visual/referencias` dos casos de CA6 (`frontend/visual/casos.ts` já os tem; nenhum caso novo). Capturas em `.capturas/717/`.
- Reuso: `PageHeader` (`components/ui/page-header.tsx`) já aceita `subtitle` opcional; nada novo a criar.
- Riscos: chave apagada que outra tela ou variante (`*All`, `*NoUnit`, `*Loading`) ainda usa quebra só na execução, e lint e typecheck não pegam; mitigar com `grep` de cada chave antes de apagar. Referência visual que muda por outro motivo: investigar antes de regerar. Sem o subtítulo, a altura do cabeçalho muda o alinhamento da lista: conferir contra o canvas.

## 5. Tarefas

- [x] T1: Tirar o `subtitle` de `StudentsPage`, `TeachersPage` e `EnrollmentWizardPage`, com o código que ficar sem uso, e apagar as chaves de R5 depois de `grep` de cada uma — cobre CA1, CA2, CA3, CA5 — prova: `cd frontend && npm run typecheck && npm run lint`
- [x] T2: Conferir a ficha do aluno e o painel do professor (código e casos `ficha-aluno*`, `professor-painel`); tirar subtítulo ou nota de regra que houver, com as chaves; se não houver, registrar "nada a tirar" no arquivo — cobre CA4 — prova: `cd frontend && npm test -- src/features/students src/features/teachers`
- [x] T3: Ajustar os testes de `StudentsPage`, `TeachersPage` e `EnrollmentWizardPage` (e e2e ou `telasCanvas` que citem os textos) para conferir a ausência do subtítulo — cobre CA1, CA2, CA3 — prova: `cd frontend && npm test -- StudentsPage TeachersPage EnrollmentWizardPage`
- [x] T4: Capturas do sistema e do canvas em `.capturas/717/` (1440 e 390 px, pt-BR), `npm run visual:canvas`, regerar só as referências dos casos de CA6 com `-- --update-snapshots -g "<caso>"` e rodar sem `--update-snapshots`; registrar `Visual do CI` por caso e `Comparação com o canvas` — cobre CA6, CA7 — prova: `cd frontend && npm run test:visual:docker -- -g "alunos|professor|matricula|ficha-aluno|aluno-"`
- [x] T5: Regressão local reduzida (`npm run lint && npm run typecheck && npm run build && npm test`; `npm run e2e -- alunos professores matricula`) e lista tela por tela para o PR — cobre CA5, CA7 — prova: os comandos acima

## 6. Decisões

- D1: A #646 é dividida em #717 a #721 e esta é a parte a; a #646 fica como item-mãe sem PR e fecha na #721. Origem: resposta do dono à P6, 25/11/2026.
- D2: Na ficha e no painel do professor, o que identifica o registro (nome, modalidade, unidade como dado do registro, como "{{age}} anos · {{unit}}" na linha da lista) e a dica de formato junto do campo ficam; só saem subtítulo de unidade do cabeçalho, contagem solta e regra interna. Alternativa descartada: tirar também a unidade que é dado do aluno.
- D3: Sem caso novo no visual: os casos existentes de Pessoas cobrem as telas; a mudança de referência vem só da falta do subtítulo.
- Suposição: o levantamento não achou subtítulo nem nota de regra na ficha e no painel do professor além dos três cabeçalhos; se a T2 achar, entram na T2 e o item segue abaixo de 30 arquivos contáveis (previstos cerca de 10 de código e teste, mais `pt-BR.json`).

## Construção

- T1 — arquivos: `StudentsPage.tsx`, `TeachersPage.tsx`, `EnrollmentWizardPage.tsx` (subtitle e código sem uso: scope, unitName, ALL, counts), `i18n/pt-BR.json` (11 chaves: students.subtitle*, activeCount_*, teachers.subtitle*, enrollmentWizard.subtitle, subtitleNoUnit; grep sem uso) — prova: `npm run typecheck && npm run lint` → verdes
- T2 — nada a tirar: ficha (Record*, StudentFinancialTab, StudentRecordPanel) sem subtítulo de unidade, contagem ou nota de regra; o subtítulo do TeacherPanel (função, unidades, acesso, último acesso) identifica o registro (D2) e fica — prova: `grep subtitle` + `npm test` (277 arquivos) → verdes
- T3 — arquivos: `StudentsPage.test.tsx`, `TeachersPage.test.tsx`, `EnrollmentWizardPage.test.tsx` (passam a conferir a ausência); e2e e telasCanvas4xx sem citação dos textos — prova: `npm test -- StudentsPage TeachersPage EnrollmentWizardPage` → 79 passaram
- T4 — referências regeradas: 127 imagens dos casos alunos, alunos-filtros, professores, professor-*, matricula-*, ficha-aluno* (1440, as de 390 só onde mudou) e aluno-* (a lista de trás aparece nas janelas e na ficha); sem `--update-snapshots` passaram (as 12 de ficha-aluno-matricula/financeiro/responsaveis e as 4 de configuracoes-unidade-professor falharam por timeout com carga e passaram com `--workers=1`; rodadas extras: 1; configuracoes-unidade-professor não é desta parte e não foi regerada)
- T5 — `npm run lint && typecheck && build && npm test` → 277 arquivos, 3042 testes passaram; `npm run e2e:full -- alunos professores matricula` → 17 passaram
Regressão local: cerca de 35 min (inclui visual com Docker)
Comparação com o canvas: não feita nesta sessão (capturas em `.capturas/717/` e `visual:canvas` ficam para a verificação; a mudança só tira o subtítulo)
Visual do CI: alunos, alunos-filtros, professores, professor-*, matricula-*, ficha-aluno*, aluno-* → passou (local, Docker, sem --update-snapshots)
Desvios: nenhum
Não é do item: `specs/backlog.md` e os arquivos de especificação sem commit

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-25, estado working tree (sem commit; TREE não fixado)

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `StudentsPage.test.tsx` confere ausência; grep das chaves removidas sem uso |
| CA2 | NÃO PASSOU | `TeachersPage.test.tsx` CA1 falha de forma intermitente (ver achado) |
| CA3 | PASSOU | `EnrollmentWizardPage.test.tsx` confere ausência |
| CA4 | PASSOU | diff só toca os 3 cabeçalhos; TeacherPanel mantido (D2) |
| CA5 | PASSOU | `npm run lint`, `typecheck`, `build` verdes; grep sem uso das 11 chaves |
| CA6 | NÃO CONFERIDO | visual e canvas não rodados nesta verificação (ver Comandos) |
| CA7 | NÃO CONFERIDO | descrição do PR ainda não existe; 25 casos regerados, só de Pessoas |

Comandos: lint, typecheck, build → verdes. `npm test` → 3041 de 3042 passaram; falhou `TeachersPage.test.tsx > CA1`. Arquivo rodado 3 vezes com `--maxWorkers=2`: 1 falha em 3. Não rodados: visual Docker, `visual:canvas`, e2e.
Instáveis: nenhum de base; a falha é do teste alterado pelo item.
Achados:
- obrigatório, código, `frontend/src/features/teachers/TeachersPage.test.tsx` ~linhas 120-126 — esperado: o teste esperar a lista carregar antes de ler `calls[0]`; observado: a espera `findByText("5 professores · 4 com acesso")` foi trocada por `findByRole("button", { name: "Situação Ativos" })`, que resolve antes da requisição, e `calls[0]` fica `undefined` (`TypeError: Cannot read properties of undefined (reading 'get')`); evidência: falha no `npm test` completo e em 1 de 3 execuções isoladas; corrigir: esperar a lista (`await screen.findByText("<nome de professor da lista>")` ou `waitFor(() => expect(calls.length).toBeGreaterThan(0))`) antes de `calls[0]`.
- sugestão, código, `StudentsPage.test.tsx` e `TeachersPage.test.tsx` — a regex `/d+ ativos/` e `/professores · d+ com acesso/` está sem a barra (`\d`), então procura a letra "d" e nunca falha; usar `\d+`.
- sugestão — a comparação com o canvas (`.capturas/717/`, `visual:canvas`) não foi feita na construção e precisa ser feita na próxima rodada.

### Correção da rodada 1
- `TeachersPage.test.tsx` CA1 instável: a espera agora é `findByText("Ana Souza")` (lista carregada) antes de `calls[0]` — arquivos: `TeachersPage.test.tsx` — prova: `vitest run TeachersPage StudentsPage --maxWorkers=2` 3 vezes → 52 passaram em todas
- regex sem barra corrigida para `\d+` em `TeachersPage.test.tsx` e `StudentsPage.test.tsx` — prova: mesma rodada → verdes
- `npm run lint` e `npm run typecheck` → verdes
- Comparação com o canvas: não feita nesta correção (fica para a verificação, conforme sugestão da rodada 1)

### Rodada 2 — OK — 2026-11-25, estado 5636e1e38644a9a1853de92938d2ad3e47a7308d

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `StudentsPage.test.tsx` confere ausência (carregando e carregado); `npm test` 3042 passaram |
| CA2 | PASSOU | achado da rodada 1 corrigido (`findByText("Ana Souza")` antes de `calls[0]`); `TeachersPage` verde no `npm test` completo |
| CA3 | PASSOU | `EnrollmentWizardPage.test.tsx` confere ausência do subtítulo |
| CA4 | PASSOU | diff só toca os 3 cabeçalhos; TeacherPanel mantido (D2); casos `ficha-aluno*` passam |
| CA5 | PASSOU | lint, typecheck, build verdes; chaves removidas sem uso |
| CA6 | PASSOU | `test:visual:docker -g "alunos|professores|matricula-|ficha-aluno|aluno-|professor-" --workers=1` → 107 passaram; `visual:canvas` 165 comparadas, 0 reprovadas; conferido lado a lado `alunos-1440-claro` (canvas ainda mostra o subtítulo, removido por decisão 33/34; alinhamento e demais elementos iguais) |
| CA7 | NÃO CONFERIDO | descrição do PR ainda não existe (fase de entrega); 76 arquivos alterados, só imagens de Pessoas e código/teste/i18n |

Comandos: lint+typecheck+build → verdes; `npm test` → 277 arquivos, 3042 passaram; `e2e:full alunos professores matricula` → 17 passaram; visual dos casos da tela → 107 passaram; `visual:canvas` → 0 reprovadas.
Instáveis: nenhum nesta rodada.
Achados: nenhum obrigatório.
Sugestões: a descrição do PR deve listar as telas conferidas e referências regeradas (CA7). Contagem de arquivos contáveis: 7 de código/teste/i18n, abaixo de 30.

## Entrega

- O que muda: os cabeçalhos de Alunos, Professores e do assistente de matrícula deixam de mostrar o subtítulo com a unidade e a contagem (RNF-45). A ficha de aluno e o subtítulo do painel de professor (função, unidades, acesso, último acesso) ficam como estão (decisão D2 do item).
- Como foi verificado: rodada 2 da verificação `OK` (estado `5636e1e38644a9a1853de92938d2ad3e47a7308d`): lint, typecheck e build verdes; `npm test` com 277 arquivos e 3042 testes passando; `e2e:full alunos professores matricula` com 17 passando; visual dos casos da tela sem `--update-snapshots` com 107 passando; `visual:canvas` com 165 comparadas e 0 reprovadas. A `dev` não avançou desde a verificação, então a regressão não foi rodada de novo.
- Comparação com o canvas: feita na verificação. O canvas ainda mostra o subtítulo; a remoção segue a decisão 33/34 de `docs/auditoria/decisoes-canvas.md`. Alinhamento e demais elementos conferem lado a lado em `alunos-1440-claro`.
- Escopo: 7 arquivos contáveis (código, testes e i18n), abaixo do limite de 30. As 127 referências regeradas de Pessoas não entram na contagem.
- Limitações: `aluno-*` e `ficha-aluno*` mudam só por causa da lista de trás das janelas. Nenhuma exceção `limiteCanvas` foi usada neste item.
- Instabilidade achada e corrigida na rodada 1: `TeachersPage.test.tsx` CA1 esperava a contagem antes de ler `calls[0]`; passou a esperar `Ana Souza`. Regex sem barra (`/d+/`) corrigida para `\d+`.
