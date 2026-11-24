# 610 — RF-PRO-02 · Remover acesso do professor sem inativar o cadastro

Origem: issue #610 (Sprint 10.5), `docs/especificacao/05-professores.md` (RF-PRO-02, RN-PRO-02) e `02-contas-e-acesso.md` (RN-ACE-20). Branch: `item/610-remover-acesso-professor`.

## 1. Objetivo

O Coordenador e o Administrador passam a tirar o acesso de um professor pelo painel dele ("Remover acesso"), sem inativar o cadastro: o professor segue nas turmas e na agenda, perde o vínculo de Professor e as sessões, e o painel volta a oferecer "Dar acesso". É o único lugar que gere o acesso de Professor, já que a tela Configurações › Usuários saiu (RF-ACE-06, #611).

Fora do escopo: a tela Pessoas › Administradores e o custo da vaga (#611); inativar o professor (RF-PRO-04, já existe); mudar o convite ou a janela "Dar acesso".

## 2. Requisitos

- R1: `DELETE /api/v1/teachers/{id}/access` encerra o acesso do professor sem mudar `teacher.status`, turmas, auxiliares nem agenda; o painel passa a `access = ENDED`.
- R2: o Coordenador remove o acesso em todas as unidades: o vínculo de Professor vai a `ENDED`.
- R3: o Administrador remove só nas unidades dele: tira dos `account_link_unit` do vínculo só as unidades do alcance dele; o acesso nas demais continua (vínculo segue `ACTIVE` e `access` segue `ACTIVE`). Se não sobra unidade, o vínculo vai a `ENDED` como em R2 (RN-PRO-02).
- R4: ao encerrar o vínculo (R2 ou R3 sem sobra), as sessões de gestão da pessoa saem na hora (RN-ACE-20); vínculo de aluno ou responsável da mesma conta continua. Na remoção parcial as sessões não saem.
- R5: acesso `PENDING` também pode ser removido (cancela o convite e encerra o vínculo); `NONE` e `ENDED` recusam com 409.
- R6: fora do alcance, o servidor recusa: Administrador sem unidade em comum com o professor recebe 404 (mesma resposta de quem não existe); outra organização, 404; perfil sem `TEACHERS`, 403; Administrador cujo alcance não toca nenhuma unidade do vínculo, 409.
- R7: grava `teacher.access_removed` na auditoria (unidades removidas e mantidas, se o vínculo encerrou; sem dado de sessão ou token).
- R8: `GET /api/v1/teachers/{id}/access-removal` devolve, sem alterar nada, o resumo da confirmação: unidades que perdem o acesso, unidades que ficam e se o acesso acaba.
- R9: no painel, o botão "Remover acesso" aparece com acesso `ACTIVE` ou `PENDING`, desabilitado sem permissão de escrita, e abre confirmação com o resumo do que acontece (RNF-26: cadastro e turmas ficam; sessões saem; unidades que mantêm o acesso). Depois da remoção o painel mostra "Dar acesso".
- R10: textos em pt-BR; quatro estados do painel mantidos (o resumo da janela tem carregando, erro com nova tentativa e sem permissão); funciona a 360 px e passa no axe nos dois temas.
- R11: contrato: rotas novas no `docs/openapi.yaml` e nos handlers MSW.

## 3. Critérios de aceite

- CA1 (R1, R2): dado professor ativo com vínculo `ACTIVE` em duas unidades e turma ativa, quando o Coordenador remove o acesso, então 200, `access = ENDED`, vínculo `ENDED`, `teacher.status` e as turmas iguais.
- CA2 (R3): dado vínculo nas unidades A e B e Administrador só de A, quando remove, então o vínculo fica `ACTIVE` só com B, `access = ACTIVE`, e as sessões da conta continuam.
- CA3 (R3): dado vínculo só em A e Administrador de A, quando remove, então o vínculo vai a `ENDED`.
- CA4 (R3): dado vínculo em A, B e C, Administrador X de A e Administrador Y de B, quando X remove, então B e C continuam com acesso e Y ainda alcança o professor.
- CA5 (R4): dado conta com sessões de gestão e vínculo de aluno ativo, quando o vínculo de Professor encerra, então as sessões de gestão somem e o vínculo de aluno segue `ACTIVE`; dado conta que ainda tem outro vínculo de gestão, as sessões ficam.
- CA6 (R5): dado acesso `PENDING`, quando remove, então o convite é cancelado e `access = ENDED`; dado `NONE` ou `ENDED`, então 409.
- CA7 (R6): dado Administrador sem unidade em comum, dado professor de outra organização, dado vínculo sem unidade no alcance do Administrador e dado perfil sem `TEACHERS`, então 404, 404, 409 e 403, e nada muda.
- CA8 (R7): dada remoção feita, então existe `teacher.access_removed` com as unidades e sem token, código ou id de sessão.
- CA9 (R8): dado o resumo, quando o Administrador consulta, então vê só as unidades dele como removidas e as outras como mantidas; o Coordenador vê todas como removidas; nada muda no banco.
- CA10 (R1): dado acesso `ENDED` depois da remoção, quando se dá acesso de novo, então 200 e `access = PENDING` (o fluxo atual de #43 já serve).
- CA11 (R9): dado painel com acesso ativo, quando clica em "Remover acesso" e confirma, então a janela mostra o resumo, a chamada sai, a janela fecha e o painel mostra "Dar acesso" e o aviso; dado erro 409/403/404 do servidor, a mensagem fica na janela, que segue aberta.
- CA12 (R9): dado acesso `NONE` ou `ENDED`, então o botão "Remover acesso" não aparece; dado perfil sem escrita, então aparece desabilitado.
- CA13 (R10): dado 360 px e os dois temas, sem rolagem horizontal e sem violações do axe; carregando, erro e sem permissão do resumo presentes; caso visual da janela comparado com o canvas.
- CA14 (R11): `OpenApiContractTest`, `ContractRoutesTest` e o teste do handler MSW passam.

## 4. Plano técnico

- Dados: não muda o esquema. Usa `account_link.status/ends_on`, `account_link_unit` e `account_session`.
- API: `DELETE /teachers/{id}/access` (200 `TeacherDetail`; 401, 403, 404, 409) e `GET /teachers/{id}/access-removal` (200 `{ removed: UnitRef[], kept: UnitRef[], endsAccess: boolean }`; 401, 403, 404, 409 quando não há acesso a remover). Quem chama: Coordenador e Administrador (`teachers.requireAccess`).
- Interface: `TeacherPanel` ganha o botão e a janela `RemoveTeacherAccessDialog` (`ConfirmDialog` com o resumo, no molde de `DeactivateTeacherDialog`). Sem tela nova nem rota nova: a janela abre sobre o painel (`/professores/:id`).
- Segurança: alcance no servidor com `teachers.find` (404 fora do alcance) e checagem das unidades do vínculo; tudo na transação da organização com `for update` na organização, como `grant`; a auditoria não leva sessão, token nem código.
- Arquivos (vistos no repositório):
  - `backend/src/main/java/br/com/ctcore/teacher/TeacherAccess.java`: novos `remove` e `removalPreview` (vínculo do professor em `account_link`; unidades em `account_link_unit` x alcance; parcial apaga só essas linhas; total usa `LinkService.endInScope` e depois `sessionsAfter`; `PENDING` usa `InviteService.cancelTeacher`, como `TeacherDeactivation`).
  - `backend/src/main/java/br/com/ctcore/teacher/TeacherController.java`: duas rotas novas.
  - `docs/openapi.yaml` (perto de `/teachers/{id}/access`, ~linha 1953), `frontend/src/mocks/handlers.ts` (~linha 3654), `frontend/src/mocks/teachers.msw.test.ts`.
  - `frontend/src/features/teachers/useTeachers.ts` (`removeAccess`, `fetchAccessRemoval`), `TeacherPanel.tsx` (botão no rodapé), `TeacherPanel.test.tsx`, `frontend/src/i18n/pt-BR.json` (`teachers.panel.removeAccess.*`), `frontend/visual/casos.ts` (caso novo), `frontend/e2e` (spec dos professores).
  - A criar: `backend/src/test/java/br/com/ctcore/teacher/TeacherAccessRemovalIT.java`, `frontend/src/features/teachers/RemoveTeacherAccessDialog.tsx` e `.test.tsx`.
- Reuso: `Teachers.find/detail`, `LinkService.endInScope/sessionsAfter`, `InviteService.cancelTeacher`, `ConfirmDialog`, `OrganizationBase` dos ITs (banco limpo com `truncate ... cascade`, sem `delete` por tabela; relógio fixo).
- Riscos: (a) `endInScope` zera `active_link_id` das sessões; `sessionsAfter` apaga todas as sessões da conta se não sobra outro vínculo de gestão, como na inativação (mesmo comportamento já aceito); (b) remoção parcial precisa deixar o `access` visto pelo outro Administrador como `ACTIVE`, o que vale porque o vínculo segue `ACTIVE`; (c) o canvas `ProfessorPainel` não tem o botão (ver Suposição).

## 5. Tarefas

- [x] T1: Servidor: `remove` (total, parcial, `PENDING`), alcance, 404/409, sessões e auditoria; `removalPreview`; rotas no controller — cobre CA1 a CA9, CA10 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=TeacherAccessRemovalIT`
- [x] T2: OpenAPI e MSW (as duas rotas, resposta de 409/404, estado `ENDED` e parcial do Administrador) — cobre CA14 — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'` e `npm test -- teachers.msw` (em `frontend/`)
- [x] T3: Botão no painel e `RemoveTeacherAccessDialog` com resumo, erros, quatro estados e textos pt-BR — cobre CA11, CA12, CA13 — prova: `npm test -- TeacherPanel RemoveTeacherAccessDialog` (em `frontend/`)
- [x] T4: Caso visual da janela, comparação com o canvas (1440 e 390 px, pt-BR, `.capturas/610/`) e e2e do fluxo dentro da moldura; `shell`, `noInternalAnchors` e `routePattern` verdes — cobre CA13 — prova: `npm run test:visual:docker -- -g "<caso>"` sem `--update-snapshots`, `npm run visual:canvas`, `npm run e2e -- professores` e `npm test -- shell noInternalAnchors routePattern`

## 6. Decisões

- D1: rota `DELETE /teachers/{id}/access` (par de `POST /teachers/{id}/access`) com resumo em `GET /teachers/{id}/access-removal`, no molde de `deactivation`. Alternativa: `POST .../access/remove` (foge do par REST).
- D2 (muda o comportamento): `PENDING` pode ser removido (cancela o convite). Motivo: dá ao gestor uma saída sem esperar o convite vencer; hoje só há "Reenviar". Alternativa: só `ACTIVE`.
- D3 (muda o comportamento): Administrador cujo alcance não toca nenhuma unidade do vínculo recebe 409, não 404, porque ele vê o professor mas não tem o que remover. Alternativa: 403.
- D4: remoção parcial não encerra sessões; elas só saem quando o vínculo encerra (RN-ACE-20 fala em "último vínculo de gestão"). Sessão aberta numa unidade removida continua até o próximo carregamento do alcance, que já é lido do vínculo.
- D5: o cadastro mantém `account_id`; só o vínculo muda, como na inativação, para "Dar acesso" reaproveitar a conta.
- Suposição: o canvas `ProfessorPainel` e `ProfessorInativar` foram desenhados antes da regra e não trazem "Remover acesso"; a janela segue os componentes base (`docs/design/README.md`) e entra como divergência registrada no PR. Se o canvas for atualizado, só a tela muda.
- Suposição: o botão fica no rodapé do painel, ao lado de "Dar acesso"/"Reenviar convite", que ocupam o mesmo lugar conforme o estado.

## Construção

- T1 — arquivos: `backend/.../teacher/TeacherAccess.java` (`remove`, `removalPreview`, `plan`), `TeacherController.java` (duas rotas), `TeacherAccessRemovalIT.java` (7 testes; banco limpo com `truncateCascade`, sem `delete` por tabela) — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=TeacherAccessRemovalIT` → 7 testes, 0 falhas (CA1 a CA10).
- T2 — arquivos: `docs/openapi.yaml` (`DELETE /teachers/{id}/access`, `GET /teachers/{id}/access-removal`), `frontend/src/mocks/handlers.ts` (`teacherRemovalPlan`, remoção parcial do Administrador, reinício no reset), `teachers.msw.test.ts` — prova: `OpenApiContractTest,ContractRoutesTest` → 7 testes passam; `npm test -- teachers.msw` → 18 passam.
- T3 — arquivos: `useTeachers.ts` (`fetchAccessRemoval`, `removeTeacherAccess`), `RemoveTeacherAccessDialog.tsx`, `TeacherPanel.tsx` (botão no rodapé, janela), `pt-BR.json` (`teachers.panel.removeAccess.*`), testes em `TeacherPanel.test.tsx` — prova: `npm test -- TeacherPanel` → 28 passam (resumo, parcial, erro e nova tentativa, 403 sem permissão, 409/403 na janela, botão ausente com `ENDED`, axe 360 px claro e escuro).
- T4 — arquivos: `frontend/visual/casos.ts` (caso `professor-remover-acesso`), 4 referências em `frontend/visual/referencias/professor-remover-acesso-{390,1440}-{claro,escuro}.png`, `frontend/e2e/professores.spec.ts` (remoção dentro da moldura) — prova: `npm test -- shell noInternalAnchors routePattern` (7 arquivos, 318 testes verdes); `npm run e2e -- professores` → 5 passam.

Visual do CI: professor-remover-acesso → passou (4 de 4, sem `--update-snapshots`, depois de gerar as referências).
Visual do CI: professor-painel, professor-inativar, professores → passou (as referências existentes não mudaram).
Referências visuais: `frontend/visual/referencias/professor-remover-acesso-{390,1440}-{claro,escuro}.png` (novas).
Regressão: `./backend/mvnw -f backend/pom.xml verify` → 940 testes, 0 falhas, JaCoCo ok. `npm run lint`, `typecheck`, `build` ok. `npm run test:cov` → 275 arquivos e 3016 testes passam (a primeira rodada teve 2 estouros de tempo em `ClassFormDialog` e `EnrollmentWizardPage` por rodar junto com o `verify`; repetido sozinho, passou). `npm run e2e` → 118 passam. Imagens do Docker iguais antes e depois do teste visual.
Padrão de rotas e telas: `shell`, `noInternalAnchors`, `routePattern` verdes e e2e da tela abrindo dentro da moldura (gaveta sobre `/professores`, menu principal presente).
Desvios:
- Os testes da janela ficaram em `TeacherPanel.test.tsx` (que já traz o `setup` do painel) e não em `RemoveTeacherAccessDialog.test.tsx`, como o plano previa.
- CA12 "sem escrita, botão desabilitado": o painel usa a mesma regra do "Inativar" (`TEACHERS !== NONE`) e quem tem `NONE` nem abre o painel, então só o estado de carregamento das permissões deixa o botão desabilitado; não há teste dedicado.
- Canvas: `ProfessorPainel` e `ProfessorInativar` não trazem "Remover acesso" (Suposição do item). O caso visual entra sem `canvas` e sem `limiteCanvas`; não há captura de canvas em `.capturas/610/` porque a janela não existe no canvas. A divergência (janela e botão sem desenho) vai na descrição do PR; a janela segue os componentes base (`ConfirmDialog`, tom danger, como a inativação).
- Remoção parcial de acesso `PENDING` pelo Administrador apaga só as unidades dele do vínculo (o convite segue); o convite só é cancelado quando não sobra unidade.
- Auditoria `teacher.access_removed` leva `removedUnitIds`, `keptUnitIds` e `accessEnded`.
Não é do item: nenhum.

## Verificação

### Rodada 1 — OK — 2026-11-24, estado 615c3953346325ce95c8e475e74717d268cff206

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA10 | PASSOU | `TeacherAccessRemovalIT` (7 testes, um por grupo de CA) dentro do `verify` completo: 940 testes, 0 falhas, JaCoCo "All coverage checks have been met" |
| CA11, CA12 | PASSOU | `TeacherPanel.test.tsx` (CA11 x3, CA12) dentro do `test:cov`: 275 arquivos, 3016 testes |
| CA13 | PASSOU | axe 360 px claro e escuro no teste do painel; visual `professor` 4 casos novos + existentes passaram; referência `professor-remover-acesso-1440-claro.png` aberta: janela com resumo, tom danger. Sem canvas para a janela (Suposição do item, registrada) |
| CA14 | PASSOU | `verify` inclui `OpenApiContractTest` e `ContractRoutesTest`; `teachers.msw.test.ts` dentro do `test:cov` |

Comandos: `./backend/mvnw -f backend/pom.xml verify` (1ª vez: 1 falha em `TextModelsIT.audit`; 2ª vez: 940/0 falhas, JaCoCo ok); `npm run lint`, `typecheck`, `build` ok; `npm run test:cov` ok; `npm run e2e` 118 passam; `npm run test:visual:docker -- -g "professor"` 43 passaram, 1 falhou (`configuracoes-unidade-professor 1440 escuro`, "Failed to take two consecutive stable screenshots"), passou 4/4 rodando só ele.
Instáveis:
- `TextModelsIT.audit` (`order by occurred_at` com duas gravações seguidas): falhou 1 de 5 execuções (1 no verify completo, 3 isoladas e 1 no verify completo seguinte passaram). Não toca arquivo do item.
- Visual `configuracoes-unidade-professor 1440 escuro`: falhou 1 vez em carga de 44 casos, passou isolado. Não toca arquivo do item.
Achados:
- sugestão, código, `RemoveTeacherAccessDialog.tsx` — enquanto o resumo carrega, a lista de itens mostra a linha das sessões mesmo para remoção parcial; some só depois de carregar.
- sugestão, código — `RemoveTeacherAccessDialog.test.tsx` previsto no plano não existe (desvio já registrado); testes ficaram em `TeacherPanel.test.tsx`.

## Entrega

- O que muda: `DELETE /api/v1/teachers/{id}/access` e `GET /api/v1/teachers/{id}/access-removal` (servidor, contrato e MSW); botão "Remover acesso" e janela de confirmação no painel do professor. Sem mudança de esquema, sem tela nova e sem rota nova.
- Regras: remoção total encerra o vínculo de Professor e as sessões de gestão (RN-ACE-20); Administrador remove só nas unidades dele, e o vínculo só encerra quando não sobra unidade. `PENDING` cancela o convite; `NONE` e `ENDED` recusam com 409. Cadastro, turmas e agenda ficam.
- Verificação: rodada 1 `OK` (estado `615c3953346325ce95c8e475e74717d268cff206`). `verify` completo do back-end 940 testes e 0 falhas, JaCoCo ok; `test:cov` 3016 testes; `e2e` 118; visual `professor-remover-acesso` 4 de 4 sem `--update-snapshots`.
- Decisões que o revisor precisa saber: D2 (`PENDING` pode ser removido), D3 (Administrador sem unidade no alcance recebe 409), D4 (remoção parcial não encerra sessões). Ver "Decisões".
- Divergência com o canvas: `ProfessorPainel` e `ProfessorInativar` não desenham "Remover acesso" nem a janela. O caso visual entra sem `canvas` e sem `limiteCanvas`, e não há captura de canvas em `.capturas/610/`. A janela segue `ConfirmDialog` (tom danger, como a inativação).
- Limitação: enquanto o resumo carrega, a lista mostra a linha das sessões mesmo na remoção parcial (sugestão da verificação, não bloqueia).
- Instáveis registradas, sem arquivo do item: `TextModelsIT.audit` (1 falha em 5 execuções) e visual `configuracoes-unidade-professor 1440 escuro` (1 falha em carga, passou isolado).
