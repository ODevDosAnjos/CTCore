# 459 — Componente base: Linha de lista com avatar (usa os blocos da C10)

Origem: issue #459 (Sprint 10.5, Fase 2, plano C5b), `docs/auditoria/plano-de-issues.md` (C5b), `docs/auditoria/decisoes-canvas.md`. Branch: `item/459-linha-de-lista-com-avatar`. Canvas das telas-piloto: `Professores.dc.html` e `GMProfessores.dc.html` (P6); `Alunos.dc.html` e `GMAlunos.dc.html` (P1). Dependências #448, #452, #458: mescladas em `dev`.

## 1. Objetivo

Criar `PersonRow`, a composição de uma linha de lista com pessoa: avatar, nome (texto ou link), texto secundário, selos ao lado do nome e uma ação opcional à direita (ex.: WhatsApp). Ela usa o `Avatar` e os selos da #452 e não os recria. Aplicar nas telas-piloto Professores (P6) e Alunos (P1), onde hoje cada tela monta o seu avatar e o seu nome à mão (Alunos com avatar cinza próprio). As demais telas trocam nas próprias issues (#465 a #500).

Fora do escopo: migrar outras telas; recriar avatar, selos ou faixa (#452); mudar API, OpenAPI, MSW ou backend; o resto do visual de Professores e Alunos (cabeçalho, filtros em pílula, colunas Graduação e Financeiro em chips, paginação), que é das #465 e #470; o cartão do celular (`RowCard`, #458).

## 2. Requisitos

- R1: existe `PersonRow({ name, photoUrl?, title?, secondary?, badges?, action?, size? })`: avatar à esquerda (foto quando `photoUrl`, senão `Avatar` de iniciais coloridas, decorativo), `title` (padrão: o `name` em texto; a tela passa um `Link` quando o nome abre algo), `secondary` em texto menor abaixo, `badges` ao lado do nome e `action` no fim da linha. Só usa tokens; `min-w-0` e quebra de palavra longa, sem estourar a coluna (D1).
- R2: o avatar de `PersonRow` vem de `ui/avatar.tsx` (`Avatar`/`avatarTone`); nenhuma tela do piloto mantém avatar próprio (D2).
- R3: Professores usa `PersonRow` na coluna do nome e no `lead` do cartão do celular; o aspecto e o comportamento (link para o painel, foto quando existe) não mudam além do que o canvas pede (D3).
- R4: Alunos usa `PersonRow` na coluna do nome: avatar colorido com iniciais (ou foto), nome como link para a ficha com o `aria-label` de hoje, selos de hoje ao lado do nome e, abaixo, o texto secundário "idade · unidade" do canvas (D4).
- R5: ação à direita (WhatsApp) fica fora das duas telas-piloto, porque a lista não traz telefone (D5); o componente aceita `action` e a Vitrine mostra um exemplo com o `WhatsAppButton` existente.
- R6: textos só em `pt-BR.json`; cores, fontes e tamanhos só por tokens; axe passa nos dois temas (Vitrine, Professores e Alunos em 360 px); sem rolagem lateral a 360 px nas duas telas.
- R7: o componente e o seu uso constam em `docs/design/README.md` (tabela Componentes) e na Vitrine.
- R8: referências visuais de `alunos`, `professores` e dos casos que abrem `/alunos` ou `/professores` regeradas e comparadas com o canvas (1440 e 390, pt-BR); divergência restante vira `limiteCanvas` com motivo e a issue que a remove (#465, #470).
- R9: nenhuma outra tela muda de aparência (as telas que usam `Person`/`Avatar` seguem como estão).

## 3. Critérios de aceite

- CA1 (R1): dado `PersonRow` com nome, `secondary`, `badges` e `action`, então avatar, nome, texto secundário, selos e ação aparecem nessa ordem, a ação é o último elemento; sem `secondary`, `badges` ou `action` a linha renderiza sem lacunas; com `title` o nome padrão é substituído (o avatar usa o `name`).
- CA2 (R1): dado `photoUrl`, então a foto aparece no lugar das iniciais, com `alt` vazio; dado nome longo sem espaços, então o texto quebra e a linha não passa da largura do pai.
- CA3 (R2): dado o mesmo nome em duas linhas, então o avatar tem a mesma cor (`data-tone` igual ao de `Avatar`); `StudentsPage.tsx` não define mais `Avatar` nem `initials` próprios.
- CA4 (R3): dada Professores (MSW), então a coluna do nome mostra avatar, nome em link para `/professores/<id>`, e o cartão a 390 px usa a mesma linha como `lead`; `TeachersPage.test.tsx` passa sem mudança de comportamento.
- CA5 (R4): dada Alunos (MSW), então cada linha mostra avatar colorido com as iniciais, o link da ficha com o `aria-label` atual, os selos de hoje e "idade · unidade" abaixo; clicar no nome abre o painel e mantém busca e filtros.
- CA6 (R5): dado o MSW de Professores e de Alunos, então nenhuma linha mostra botão de WhatsApp e nenhum telefone é pedido à API; na Vitrine a `PersonRow` com `action` mostra o `WhatsAppButton`.
- CA7 (R6): `npm run lint` sem texto literal; `tokens.test.ts` passa; axe sem violação nos dois temas na Vitrine, em Professores e em Alunos; sem rolagem lateral a 360 px (teste de largura no Playwright, como na #458).
- CA8 (R7): `design-readme.test.ts` passa com `PersonRow` descrito.
- CA9 (R8): `npm run test:visual:docker` passa com referências regeradas só de `alunos`, `alunos-filtros` (se mudar), `professores`, `vitrine` e dos casos que abrem essas rotas; `npm run visual:canvas -- --exige` não piora `alunos` e `professores`; capturas em `.capturas/459/`.
- CA10 (R9): `npm run test:cov` e o e2e passam; nenhuma referência visual de outra tela mudou.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (visual; nenhuma rota, dado ou permissão nova; a lista continua sem contato, CPF ou telefone).
- Interface:
  - `components/ui/person-row.tsx` (a criar): `PersonRow`; usa `Avatar` de `ui/avatar.tsx` (o ramo da foto: `<img>` do mesmo tamanho do avatar `size="sm"`, hoje repetido em `TeachersPage.tsx`); sem estado nem hook. Cresce a partir de `Person` (avatar + nome + secundário): `Person` continua como está para as outras telas (R9) e não é reescrito aqui.
  - `features/teachers/TeachersPage.tsx` (existe): `TeacherAvatar` sai; `columns` (`name`) e `card` (`lead`) usam `PersonRow`/o avatar dele.
  - `features/students/StudentsPage.tsx` (existe): apagar `initials` e `Avatar` locais; `allColumns().name.render` usa `PersonRow` com `title` = o `Link` atual, `badges` = os selos atuais, `secondary` = `students.rowSecondary` ("{{age}} anos · {{unit}}").
  - `frontend/src/i18n/pt-BR.json`: `students.rowSecondary`.
  - `frontend/src/dev/Vitrine.tsx` e `docs/design/README.md`: `PersonRow` com e sem `action`.
  - `frontend/visual/casos.ts`: sem caso novo (`alunos` e `professores` já existem); só se a comparação pedir `limiteCanvas` com motivo e issue (#465 e #470).
  - `frontend/visual/referencias/`: `alunos`, `professores`, casos de moldura que abrem `/alunos` e `/professores`, `vitrine`, 1440 e 390, claro e escuro.
  - Testes: `ui/person-row.test.tsx` (a criar), `StudentsPage.test.tsx`, `TeachersPage.test.tsx`, `test/a11y.test.tsx`, `e2e/alunos.spec.ts` e `e2e/professores.spec.ts` (360 px, se ainda não houver o de Alunos).
- Reuso: `Avatar`, `avatarTone`, `Person`, `WhatsAppButton`, `StatusBadge`, `RowCard`, `setDeviceNarrow`, tokens existentes.
- Riscos: testes de Alunos que acham o nome por `getByRole("link")` ou por texto exato (a linha "idade · unidade" repete a unidade e pode causar ocorrência dupla em `getByText`); referências visuais de `moldura-*` que abrem `/alunos` e `/professores` mudam por ruído e precisam ser conferidas (como na #456 e #457); o canvas de Alunos mostra WhatsApp por linha, que o sistema não pode mostrar sem telefone na lista (divergência declarada, D5).

## 5. Tarefas

- [x] T1: `PersonRow` e chave de pt-BR; testes — cobre CA1, CA2, CA3 — prova: `cd frontend && npx vitest run src/components/ui/person-row.test.tsx`
- [x] T2: aplicar em Professores (coluna e `lead` do cartão) e ajustar `TeachersPage.test.tsx` — cobre CA4 — prova: `cd frontend && npx vitest run src/features/teachers/TeachersPage.test.tsx`
- [x] T3: aplicar em Alunos (remover avatar local) e ajustar `StudentsPage.test.tsx` — cobre CA3, CA5, CA6 — prova: `cd frontend && npx vitest run src/features/students/StudentsPage.test.tsx`
- [x] T4: axe nos dois temas, Vitrine e `docs/design/README.md` — cobre CA7, CA8 — prova: `cd frontend && npx vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev`
- [x] T5: teste de 360 px sem rolagem lateral em Alunos e Professores — cobre CA7 — prova: `cd frontend && npx playwright test e2e/alunos.spec.ts e2e/professores.spec.ts -g "360 px"`
- [x] T6: regerar referências no container, comparar com o canvas (1440 e 390, pt-BR, `.capturas/459/`) e listar divergências para o PR — cobre CA9 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots=all -g "alunos|professores|vitrine"` e `npm run visual:canvas -- --exige`
- [x] T7: regressão do front — cobre CA10: confere as outras telas e o e2e — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov && npm run e2e`

## 6. Decisões

- D1: `PersonRow` é um bloco de linha (não de tabela): a tela decide onde o põe (célula do nome, `lead` do `RowCard`). Motivo: assim serve às tabelas e aos cartões do celular sem outra prop de modo. Alternativa: dois componentes (célula e cartão), descartada por duplicar.
- D2: o avatar do piloto passa a ser sempre o `Avatar` da #452 (cor estável por nome), o que muda o avatar cinza de Alunos para o colorido do canvas. Motivo: "O avatar vem da C10; esta issue não o recria". Alternativa: manter o cinza, descartada (M5 pede avatar colorido).
- D3: em Professores o nome continua link no desktop e `PersonRow` só substitui o miolo da célula; no cartão do celular a linha entra como `lead` apenas com o avatar e o título segue do `RowCard` (para o nome não ficar duplicado, D2 da #458). Suposição: se a captura 390 pedir o nome dentro da linha, o ajuste é da #470.
- D4: Alunos ganha "idade · unidade" abaixo do nome, como no canvas (M5). Motivo: o canvas vence em layout (`decisoes-canvas.md`); os dados já vêm na lista. As colunas Idade e Unidade opcionais continuam (a troca por modalidades com ponto de cor, Graduação e chips é da #465).
- D5: o WhatsApp por linha do canvas fica fora das duas telas porque `StudentRow` e `Teacher` não trazem telefone ("CPF, e-mail, telefone ... nunca vêm na lista", RF-ALU-01), e levar o telefone para a lista ampliaria dados pessoais, o que é regra de negócio e segurança. A divergência entra na descrição do PR e vai para a #465 e a #470 decidirem (com o dono, se for mudar a API). Alternativa: botão "Em breve" desabilitado: descartada, pois a função existe (RNF-42) e o que falta é o dado, não a sprint. Se o dono preferir o "Em breve", é só passar `action` nas duas telas.
- Suposição: o ponto de quebra e o `RowCard` da #458 ficam como estão; se a comparação 390 mostrar o avatar menor que o do canvas, o tamanho é ajustado em `PersonRow` (tokens), sem mudar `Avatar`.

## Construção

- T1 — arquivos: `frontend/src/components/ui/person-row.tsx` (`PersonRow`, `PersonAvatar`), `person-row.test.tsx`, `pt-BR.json` (`students.rowSecondary`) — prova: `npx vitest run src/components/ui/person-row.test.tsx` → 4 testes passam
- T2 — arquivos: `TeachersPage.tsx` (`TeacherAvatar` saiu; coluna usa `PersonRow`, `lead` usa `PersonAvatar`) — prova: `vitest run src/features/teachers` → passa sem mudar o teste
- T3 — arquivos: `StudentsPage.tsx` (sem `Avatar`/`initials` locais; `PersonRow` com link, selos e "idade · unidade"), `StudentsPage.test.tsx` (+ asserção do secundário) — prova: `vitest run src/features/students/StudentsPage.test.tsx` → 25 passam
- T4 — arquivos: `dev/Vitrine.tsx` (`PersonRow` com `WhatsAppButton`), `docs/design/README.md` — prova: `vitest run src/test/a11y.test.tsx src/components/design-readme.test.ts src/components/tokens.test.ts src/dev` → passam (22 arquivos, 282 testes junto com T1 a T3)
- T5 — arquivos: `e2e/alunos.spec.ts` (teste 360 px; Professores já tinha da #458) — prova: `npx playwright test e2e/alunos.spec.ts e2e/professores.spec.ts -g "360 px"` → 2 passam
- T6 — prova: `npm run test:visual:docker -- --update-snapshots=all -g "alunos|professores|vitrine|moldura"` → 35 passaram, 1 estourou tempo (`vitrine 1440 claro`, instável); rerodado só ele → passou. `npm run visual:canvas -- --exige` → 97 comparadas, 0 reprovadas. Capturas copiadas para `.capturas/459/` (alunos 1440 e filtros, professores 1440 e 390; o relatório gera o claro). Não há captura 390 de Alunos no relatório lado a lado.
Regressão: `npm run lint && typecheck` ok; `npm run test:cov` → 2 falhas de tempo sob carga (`UnitSettingsPage.test.tsx`, `DailyReceiptsPage.test.tsx`), que passam rodadas sozinhas (33 testes); o limiar de cobertura não foi lido no log por causa disso (não rodou de novo completo); `npm run e2e` → 98 passam.
Desvios: casos `moldura-*` (administrador, coordenação, celular) também foram regerados porque abrem `/alunos` ou `/professores`, como previsto nos riscos; `PersonAvatar` exportado de `person-row.tsx` para o `lead` do cartão (D3). WhatsApp fora das telas (D5).
Referências visuais: `alunos-{1440,390}-{claro,escuro}`, `alunos-filtros-1440-{claro,escuro}`, `professores-1440-{claro,escuro}`, `moldura-{administrador,coordenacao}-{1440,390}-*`, `moldura-celular-menu-1440-*`, `moldura-celular-unidade-{1440,390}-*`, `vitrine-{1440,390}-{claro,escuro}` (todas em `frontend/visual/referencias/`). Conferir no fim da sprint se as `moldura-*` mudaram só pela lista.

## Verificação

### Rodada 1 — OK — 2026-11-09, estado 6fe8d27fa1fb811e0d0e765dddba8120871da7b6

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `person-row.test.tsx` (ordem, sem lacunas, `title`) |
| CA2 | PASSOU | `person-row.test.tsx` (foto `alt=""`, `min-w-0`, `break-words`) |
| CA3 | PASSOU | teste de `data-tone` igual; `StudentsPage.tsx` sem `Avatar`/`initials` no diff |
| CA4 | PASSOU | `src/features/teachers` passa sem mudança de teste; `lead` usa `PersonAvatar` |
| CA5 | PASSOU | `StudentsPage.test.tsx` (iniciais, `12 anos · Centro`, link e selos); captura `alunos-1440-claro-sistema.png` aberta |
| CA6 | PASSOU | nenhum `action` nas telas; Vitrine com `WhatsAppButton` |
| CA7 | PASSOU | lint e typecheck ok; axe 360 px nos dois temas em Alunos/Professores e `a11y`/Vitrine passam; e2e 360 px de Alunos presente |
| CA8 | PASSOU | `design-readme.test.ts` passa |
| CA9 | PASSOU | referências alteradas só de alunos, professores, moldura-* (abrem as rotas) e vitrine; `.capturas/459/` existe (sem 390 de Alunos: o relatório não gera; registrado na construção) |
| CA10 | NÃO CONFERIDO (limitação aceita, AGENTS.md Autonomia 2) | `test:cov`: 2068 passam, 1 falha em `DailyReceiptsPage.test.tsx` (fora do item) que passa 3 de 3 rodada sozinha; limiar de cobertura não foi emitido por causa da falha; CI prova |

Comandos: vitest dos arquivos do item e a11y/design-readme/tokens/dev (9 arquivos, 141 testes ok); `npm run lint` e `typecheck` ok; `npm run test:cov` (1 falha instável); e2e e visual não reexecutados (aceito o resultado da construção e do CI).
Instáveis: `DailyReceiptsPage.test.tsx` "CA10: carregando, erro com tentar de novo e dia sem pagamento" — 1 falha na suíte completa, 0 falhas em 3 execuções isoladas.
Achados:
- sugestão, código, `person-row.tsx` — `PersonAvatar` e `className` ficam além do R1; sem problema.
- sugestão, visual — o link com `min-h-11` empurra o nome para cima dos selos/secundário em Alunos (nome e secundário afastados na captura); ajuste cabe à #465.

## Entrega

- **O que muda:** componente base `PersonRow` (com `PersonAvatar`) em `frontend/src/components/ui/person-row.tsx`: avatar (foto ou iniciais), nome, texto secundário, selos e ação. Usado em Alunos (`StudentsPage`), Professores (`TeachersPage`, sai `TeacherAvatar`) e na Vitrine, com `WhatsAppButton`. Texto novo em pt-BR: `students.rowSecondary`.
- **Verificação:** rodada 1 `OK` (estado `6fe8d27fa1fb811e0d0e765dddba8120871da7b6`). CA1 a CA9 passaram; CA10 `NAO_CONFERIDO` por falha de tempo fora do item (limitação aceita, Autonomia 2). Comparação com o canvas: `npm run visual:canvas -- --exige` com 97 comparadas e 0 reprovadas; capturas em `.capturas/459/`.
- **Decisões:** D3, `PersonAvatar` exportado para o `lead` do cartão de Professores; D5, WhatsApp fora das telas (só na Vitrine).
- **Referências visuais** regeradas: alunos, professores, vitrine e `moldura-*` (abrem essas rotas). Conferir no fim da sprint se as `moldura-*` mudaram só pela lista.
- **Regressão:** `lint` e `typecheck` ok; `e2e` com 98 passando; `test:cov` com falhas de tempo sob carga, que passam isoladas. A base (`dev`) não avançou, então a regressão não foi rodada de novo.
  - `frontend/src/features/units/UnitSettingsPage.test.tsx`: falha de tempo limite na suíte completa (nome do teste não anotado na construção); passa isolado.
  - `frontend/src/features/charges/DailyReceiptsPage.test.tsx`, "CA10: carregando, erro com tentar de novo e dia sem pagamento": falha de tempo limite na suíte completa; passa em 3 de 3 execuções isoladas. Primeira linha do erro não capturada.
  - Registro: issue #540 (`técnica`), com os dois testes.
- **Limitação:** no fluxo da lista, o link com `min-h-11` empurra o nome para cima dos selos e do secundário em Alunos (achado da verificação). O ajuste cabe à #465.
