# 499 — Carteirinha no visual do canvas

Origem: issue #499 (Sprint 10.5, Fase 3, R7), `docs/auditoria/decisoes-canvas.md` (R1, R2, R3, decisão 20); evidência M32, M148, M149. Branch: `item/499-portal-carteirinha-visual-canvas`. Dependências #455, #452, #450 (fechadas). Canvas: `PortalCarteirinha` (1440), `PortalCarteirinhaFilhos` (1440, responsável), `PortalMCarteirinhaOk` e `PortalMCarteirinha` (390, online e sem conexão). Regras: RF-POR-03, RN-POR-01, RN-POR-09, RN-POR-11, RN-INA-08, RNF-22.

## 1. Objetivo

Deixar `/portal/carteirinha` igual ao canvas para Aluno e Responsável: cartão escuro com faixa da marca (logo e nome da academia, selo "Ativo"), avatar, nome em caixa alta, "Aluno desde MM/AAAA · unidade", modalidades com bolinha e faixa desenhada com grau, "Válida em dd/mm/aaaa" e "feito com ctcore"; ao lado, o texto de recepção e os botões "Baixar imagem" (Em breve) e "Voltar" (no celular, "‹ Voltar" no topo). Responsável vê "Carteirinhas" com um cartão por filho lado a lado. Sem conexão, faixa amarela no topo da página.

Fora do item: gerar a imagem ("Baixar imagem" só desabilitado, sprint futura); portal reduzido fora da carteirinha (#501); QR code (a regra é não ter); mudar quem vê qual carteirinha.

## 2. Requisitos

- R1. Cartão visual do canvas: faixa superior com a identidade do ctcore (não a cor da organização, decisão 20 / #626) trazendo o logo (ou iniciais) e o nome da academia, e o selo "Ativo" ou "Inativo"; corpo escuro com avatar (foto, ou iniciais pelo componente `Avatar`), nome em caixa alta e a linha "Aluno desde MM/AAAA · <unidade>".
- R2. Modalidades: bolinha (`ModalityDot`), nome e faixa desenhada com grau (`GraduationBelt`) ou "Sem faixa registrada"; sem modalidade ativa, o texto de vazio atual.
- R3. Rodapé do cartão: "Válida em <data do dia na unidade de cadastro>" e "feito com ctcore". Sem QR code. O "Atualizada em" sai do cartão e fica só na faixa de sem conexão (R6).
- R4. Ao lado do cartão (1440) ou abaixo (390): texto "Mostre na recepção quando pedirem. Não tem QR code: a situação e a data do dia já valem como conferência." (no celular, "Sem QR code. Mostre na recepção quando pedirem."), botão "Baixar imagem" desabilitado com "Em breve" (`ComingSoon`, sem backend) e botão "Voltar" (no celular "‹ Voltar" no topo).
- R5. Responsável com mais de um aluno: rótulo "Responsável", título "Carteirinhas", texto "Você vê a carteirinha de cada filho ligado à sua conta, seja ou não o responsável financeiro.", chips por aluno e um cartão por aluno lado a lado (empilhados no celular). Aluno ou responsável de um só aluno: rótulo "Minhas informações", título "Carteirinha".
- R6. Sem conexão (falha de rede com cópia guardada, RN-POR-11): faixa amarela no topo "Sem conexão · Atualizada em <data e hora>" e, no lugar do texto de recepção, "Sem internet, o app mostra a última versão do Início, da agenda e da carteirinha. Pagar e enviar pedidos precisam de conexão."
- R7. Os quatro estados (carregando, vazio/inativo, erro, sem permissão), a rota aberta para inativo e ex-aluno (RN-INA-08), `?aluno=` e as regras de dados (sem presença, frequência, progresso, CPF, telefone, e-mail) continuam como estão.
- R8. A API informa desde quando é aluno: campo novo `memberSince` (data, anulável) em `PortalCard`, com contrato, MSW e especificação alinhados (R2 das decisões do canvas).
- R9. Textos nos arquivos pt-BR; temas claro e escuro sem violação do axe; funciona a partir de 360 px.

## 3. Critérios de aceite

- CA1 (R1, R2, R3): aluno ativo com duas modalidades vê faixa da marca com nome, selo "Ativo", nome em caixa alta, "Aluno desde 03/2022 · Centro", cada modalidade com bolinha e faixa com os graus, "Válida em 27/10/2026" e "feito com ctcore"; não vê QR code nem "Atualizada em".
- CA2 (R1, R3): logo ou foto que falha cai para as iniciais, sem erro.
- CA3 (R2, R7): aluno sem modalidade ativa vê o selo "Inativo", o texto de vazio, e a rota continua aberta com o portal reduzido.
- CA4 (R4): a tela traz o texto de recepção, "Baixar imagem" com "Em breve" que não faz nada ao ser acionado, e "Voltar" que volta à tela anterior (sem histórico, vai para Minhas informações).
- CA5 (R5): responsável com dois filhos vê "Responsável", "Carteirinhas", o texto, um chip e um cartão por filho; `?aluno=<id>` mostra só o cartão desse aluno e o chip selecionado; acionar o chip selecionado volta a mostrar todos.
- CA6 (R6): falha de rede com cópia mostra a faixa "Sem conexão · Atualizada em ..." e o texto de sem internet; 403 e 500 não usam a cópia; sem cópia, erro com "Tentar de novo".
- CA7 (R7): carregando mostra o estado de carregando; 403 mostra sem permissão.
- CA8 (R8): `GET /portal/card` devolve `memberSince` (primeira matrícula do aluno, na data da unidade de cadastro) ou nulo; sem `memberSince` a linha mostra só a unidade; outra organização continua 404 e a resposta segue sem presença, frequência, progresso, CPF, telefone e e-mail.
- CA9 (R9): sem violações de acessibilidade nos temas claro e escuro; sem rolagem horizontal a 360 px.
- CA10 (canvas): `portal-carteirinha` e `portal-carteirinha-filhos` conferem com o canvas a 1440 e 390 px, e `visual:canvas` passa no limite padrão sem `limiteCanvas`.

## 4. Plano técnico

- Back-end: `backend/src/main/java/br/com/ctcore/student/PortalCard.java`: `View` ganha `LocalDate memberSince`; dentro da transação, `select min(e.enrolled_at)` em `enrollment` do aluno, convertido para a data no fuso `zone` (nulo sem matrícula). `backend/src/test/java/br/com/ctcore/student/PortalCardIT.java` ganha o caso do campo e mantém os de isolamento. O controller (`PortalStudentController`) não muda: devolve `View`.
- Contrato: `docs/openapi.yaml`, schema `PortalCard` (linha ~6453): `memberSince: { type: string, format: date, nullable: true }`, em `required`. `frontend/src/mocks/handlers.ts` (`/portal/card`, ~5006) devolve `memberSince` (`"2022-03-14"`; nulo para o inativo); `frontend/src/mocks/portal-card.msw.test.ts` atualiza a lista de campos obrigatórios.
- Especificação: `docs/especificacao/14-portal-do-aluno.md`, RF-POR-03: "Aluno desde", "Válida em", texto de recepção, "Baixar imagem" em "Em breve", "Voltar", faixa de sem conexão e a linha de que a cor da organização não é usada na carteirinha (decisão 20). Muda antes do código.
- Front: `frontend/src/features/portal/usePortalCard.ts` (tipo com `memberSince`); `PortalMemberCard.tsx` (reescrever: cartão escuro com tokens do tema, `OrgMark`, `Avatar` com foto, `ModalityDot`, `GraduationBelt`, selo pelo `Badge`; sai o uso de cor da organização e o `initials` próprio; "Válida em" no lugar de "Atualizada em"); `PortalCardPage.tsx` (`PortalHeading` com rótulo; faixa de sem conexão com `Banner`; coluna lateral com texto, `ComingSoon variant="button"` e "Voltar" por `useNavigate`; modo responsável com chips e um `usePortalCard` por aluno, num componente filho por cartão); chaves em `frontend/src/i18n/pt-BR.json`, seção `portalCard` (`since`, `validOn`, `reception`, `receptionMobile`, `download`, `back`, `offlineBanner`, `offlineText`, `familyLabel`, `familyTitle`, `familyText`). Reaproveita `PortalHeading`, `PortalLayout`, `OrgMark`, `Avatar`, `ModalityDot`, `GraduationBelt`, `ComingSoon`, `Banner`, `useBelowSm`. Sai o `Select` e a chave `selector`.
- Teste visual: `frontend/visual/casos.ts` linha 86: tirar `limiteCanvas`; `canvasCelular: "PortalMCarteirinhaOk"` já está. `portal-carteirinha-filhos` (linha 87): conferir se precisa de limite próprio (hoje não tem canvas de 390 px). Regerar só as referências desses dois casos.
- Riscos: o canvas do responsável mostra os filhos lado a lado e a API devolve um aluno por chamada (uma leitura por aluno, sem mudar a API); o estado sem conexão não é alcançado no teste visual com MSW (provado por teste de unidade e leitura do canvas); contraste do cartão escuro nos dois temas passa no axe só com tokens.
- Segurança e isolamento: a regra da rota não muda; `PortalCardIT` segue cobrindo organização e perfil; o dado novo é a data de matrícula do próprio aluno.

## 5. Tarefas

- [x] T1: Especificação RF-POR-03, contrato, MSW e back-end `memberSince`. Cobre CA8. Prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`; `./backend/mvnw -f backend/pom.xml verify -Dit.test=PortalCardIT`; em `frontend/`, `npx vitest run src/mocks/portal-card.msw.test.ts`.
- [x] T2: Reescrever `PortalMemberCard` no visual do canvas, com textos pt-BR e o campo no hook. Cobre CA1, CA2, CA3. Prova: em `frontend/`, `npx vitest run src/features/portal/PortalCardPage.test.tsx`.
- [x] T3: Página: rótulo e título, coluna lateral, "Baixar imagem" em "Em breve", "Voltar" (no topo do celular). Cobre CA4, CA7. Prova: mesma classe de teste.
- [x] T4: Faixa e texto de sem conexão. Cobre CA6. Prova: mesma classe de teste.
- [x] T5: Modo responsável: chips, cartões lado a lado, `?aluno=`. Cobre CA5. Prova: mesma classe de teste.
- [x] T6: Casos visuais: remover `limiteCanvas`, capturas em `.capturas/499/`, atualizar só as referências dos dois casos, `npm run test:visual:docker -- -g "portal-carteirinha"` sem `--update-snapshots`, `npm run visual:canvas -- --exige`, axe e 360 px, `npm run lint && npm run typecheck`. Cobre CA9, CA10.

## 6. Decisões

- D1 (muda o comportamento): "Aluno desde MM/AAAA" exige dado que a API não tinha; a API ganha `memberSince` (primeira matrícula, no fuso da unidade de cadastro), pela R2 das decisões do canvas. Alternativa: omitir a frase (contraria R1).
- D2 (muda o comportamento): a unidade da linha "Aluno desde" é a das modalidades ativas, sem repetição e separadas por vírgula; sem modalidade ativa, só a data. Alternativa: unidade de cadastro, que exigiria outro campo.
- D3: "Atualizada em" sai do cartão online e aparece só no sem conexão, como no canvas; a RF-POR-03 é ajustada na T1.
- D4 (muda o comportamento): a faixa do cartão usa a identidade do ctcore e não a cor da organização (decisão 20 do dono, #626); o campo `color` segue no contrato, sem uso aqui.
- D5 (muda o comportamento): responsável com mais de um aluno vê todos os cartões (uma leitura por aluno); chips filtram por `?aluno=` e o chip ativo, acionado de novo, volta a mostrar todos. Alternativa: um cartão e seletor (contraria o canvas).
- D6: "Voltar" usa o histórico e, sem histórico, vai a Minhas informações (a carteirinha abre do Início e de Minhas informações).
- D7: suposição: o estado sem conexão fica provado por teste de unidade e leitura do canvas, não por captura (o MSW não o alcança). Se o verificador exigir captura, é limite de infraestrutura de teste, não do item.

## Construção

- T1 — arquivos: `docs/especificacao/14-portal-do-aluno.md` (RF-POR-03), `docs/openapi.yaml` (`PortalCard.memberSince`), `backend/.../student/PortalCard.java`, `PortalCardIT.java`, `frontend/src/mocks/handlers.ts`, `portal-card.msw.test.ts` — prova: `OpenApiContractTest,ContractRoutesTest` → 7 passaram; `verify -Dit.test=PortalCardIT` → 4 passaram; `vitest run src/mocks/portal-card.msw.test.ts` → 5 passaram.
- T2 — arquivos: `PortalMemberCard.tsx` (reescrito), `usePortalCard.ts`, `pt-BR.json` (`portalCard`) — prova: `vitest run src/features/portal/PortalCardPage.test.tsx` → 12 passaram.
- T3, T4, T5 — arquivos: `PortalCardPage.tsx` (`PortalHeading`, coluna lateral, `ComingSoon`, "Voltar", `Banner` de sem conexão, chips e `FamilyCard` por aluno), `PortalCardPage.test.tsx` (CA4, CA5, CA6 novos/ajustados) — prova: mesma classe de teste → 12 passaram.
- T6 — arquivos: `frontend/visual/casos.ts` (sai o `limiteCanvas` de `portal-carteirinha`), referências dos dois casos regeradas; capturas em `.capturas/499/` — prova: `npm run visual:canvas -- --exige` → 159 comparadas, 0 reprovadas; `npm run lint && npm run typecheck` → sem erros.
Visual do CI: portal-carteirinha → passou (1440/390, claro/escuro, sem `--update-snapshots`)
Visual do CI: portal-carteirinha-filhos → passou (idem)
Referências visuais: `frontend/visual/referencias/portal-carteirinha-{1440,390}-{claro,escuro}.png` e `portal-carteirinha-filhos-{1440,390}-{claro,escuro}.png`
Regressão: `vitest run src/features/portal src/mocks` → 76 arquivos, 570 testes passaram. Não rodou: `verify` completo do back-end e `e2e` (CI do PR é a prova, autonomia 2).
Não rodou: `npm run test:cov` completo (não terminou nesta máquina em tempo útil, interrompido) e `e2e`; vale o CI do PR (autonomia 2).
Desvios: modo responsável usa `compact` no cartão (sem "feito com ctcore", como o canvas); estado sem conexão provado por teste de unidade (D7); "Baixar imagem" também aparece no celular (R4).

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-20, estado a527f684139ab963eff65e8464df2fc0eb20ea71

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `PortalCardPage.test.tsx` (CA1) e captura 1440 claro conferida contra o canvas |
| CA2 | PASSOU | teste CA2 (logo e foto quebradas caem para iniciais) |
| CA3 | PASSOU | testes CA3 (Inativo, vazio, portal reduzido) |
| CA4 | PASSOU | testes CA4 (recepção, Baixar imagem inerte com "Em breve", Voltar, texto curto no celular) |
| CA5 | PASSOU | teste CA5 (chips, `?aluno=`, chip volta a mostrar todos) |
| CA6 | PASSOU | teste CA6 (faixa e texto sem conexão; 403/500 sem cópia; erro sem cópia) |
| CA7 | PASSOU | testes de carregando e axe |
| CA8 | PASSOU | `PortalCardIT` 4 passaram (memberSince, fuso, isolamento); `OpenApiContractTest,ContractRoutesTest` sem falha; `portal-card.msw.test.ts` passou |
| CA9 | PASSOU | axe claro e escuro nos testes; 360 px coberto pelo visual a 390 e pelo lint de layout (sem teste dedicado de 360 px, não conferido isoladamente) |
| CA10 | NÃO PASSOU | `casos.ts` sem `limiteCanvas` e visual passa, mas há divergência de texto com o canvas (achado 1) |

Comandos:
- `vitest run PortalCardPage.test.tsx portal-card.msw.test.ts --maxWorkers=2` → 17 passaram
- `npm run lint` e `npm run typecheck` → sem erros
- `npm run test:visual:docker -- -g "portal-carteirinha"` → 8 passaram (sem `--update-snapshots`)
  - Visual do CI: portal-carteirinha → passou; portal-carteirinha-filhos → passou
- `./backend/mvnw ... verify -Dit.test=PortalCardIT` → 4 passaram
- Não rodou: `verify` completo, `test:cov`, `e2e` (CI do PR, autonomia 2)
- Capturas abertas e comparadas: `.capturas/499/` (1440 e 390 de portal-carteirinha, 1440 do filhos) contra o canvas

Achados:
- obrigatório, código, `frontend/src/features/portal/PortalCardPage.tsx` (coluna lateral, ramo `ready`) — esperado: o canvas `PortalCarteirinha` a 1440 traz, abaixo do texto de recepção, o texto cinza "No app instalado, a carteirinha abre mesmo sem internet, com "Sem conexão · Atualizada em..."." (o canvas vence em textos); observado: a tela não o mostra e o arquivo do item não o registra como divergência; evidência: `.capturas/499/portal-carteirinha-1440-canvas.png` x `frontend/visual/referencias/portal-carteirinha-1440-claro.png`; corrigir: acrescentar o texto (chave pt-BR, só 1440; o canvas de 390 não o tem) ou, se for deliberado, registrar a divergência e o motivo no item e no PR, e na RF-POR-03/R4.
- sugestão, código, `PortalCardPage.tsx` — o canvas de 390 px não tem "Baixar imagem" nem "Em breve" (só a recepção curta); o item já cita como desvio, mas o canvas vence em botões; avaliar tirar no celular.
- sugestão, código, `PortalCardPage.tsx` — no modo responsável, o estado sem conexão só mostra a faixa se o hook do topo tiver cópia; os `FamilyCard` ignoram `offline` e não têm teste próprio.

### Correção da rodada 1
- Achado obrigatório (texto "No app instalado, a carteirinha abre mesmo sem internet..." do canvas a 1440) — arquivos: `PortalCardPage.tsx` (parágrafo só em 1440 e online, entre a recepção e os botões), `pt-BR.json` (`portalCard.installedNote`), `PortalCardPage.test.tsx` (CA4 confere o texto; CA1 restringe "Sem conexão · Atualizada em" ao início do texto) — prova: `vitest run src/features/portal/PortalCardPage.test.tsx` → 12 passaram; `npm run lint` e `typecheck` sem erros.
- Referências regeradas (só 1440): `portal-carteirinha-1440-{claro,escuro}.png`. Visual do CI: portal-carteirinha → passou; portal-carteirinha-filhos → passou (8 passaram, sem `--update-snapshots`). `npm run visual:canvas -- --exige` → 159 comparadas, 0 reprovadas.
- Sugestões (opcionais, não feitas): tirar "Baixar imagem" no celular; `offline` nos `FamilyCard`.
- Não rodou: `verify` completo, `test:cov`, `e2e` (CI do PR, autonomia 2).

### Rodada 2 — OK — 2026-11-20, estado d55e87db143e38f2f3494576bd74fd6f28b6a18e

| Critério | Status | Evidência |
|---|---|---|
| CA1-CA9 | PASSOU | mantidos da rodada 1; `PortalCardPage.test.tsx` e `portal-card.msw.test.ts` → 17 passaram |
| CA4 | PASSOU | teste agora confere o texto "No app instalado..."; referência 1440 claro aberta mostra o texto sob a recepção, como no canvas |
| CA10 | PASSOU | achado 1 da rodada 1 corrigido (parágrafo só em 1440 e online, igual ao canvas); `test:visual:docker -g portal-carteirinha` → 8 passaram |

Comandos: `npm run lint` e `typecheck` sem erros; visual sem `--update-snapshots` → portal-carteirinha passou, portal-carteirinha-filhos passou. Não rodou: `verify` completo, `test:cov`, `e2e` (CI do PR, autonomia 2).
Achados: nenhum obrigatório. Sugestões da rodada 1 mantidas (Baixar imagem no celular; `offline` nos `FamilyCard`).

## Entrega

- O que muda: `/portal/carteirinha` no visual do canvas para Aluno e Responsável (cartão escuro com faixa da marca do ctcore, selo, modalidades com bolinha e faixa, "Válida em", "feito com ctcore"; coluna com recepção, "Baixar imagem" em "Em breve" e "Voltar"; modo responsável com um cartão por filho; faixa de sem conexão). Back-end e contrato ganham `PortalCard.memberSince` (primeira matrícula, no fuso da unidade).
- Verificado: rodada 3 da verificação, estado `c8e1cb543717184de01e9ce89d3b028fd2eb3752`; o único arquivo alterado depois dele é o do item (rodada 3 e esta seção). Visual do CI: `portal-carteirinha` → passou; `portal-carteirinha-filhos` → passou (sem `--update-snapshots`). `visual:canvas --exige` → 159 comparadas, 0 reprovadas.
- Base: `dev` não avançou desde a verificação (merge-base igual ao `dev`); a regressão local não foi refeita.
- Regressão não rodada localmente: `verify` completo, `test:cov` e `e2e`; o CI do PR é a prova (autonomia 2).
- Decisões: D1 a D7 acima; `limiteCanvas` removido de `portal-carteirinha`, sem exceção nova.
- Limitações: estado sem conexão provado por teste de unidade e leitura do canvas (D7); 360 px sem teste dedicado, coberto pelo visual a 390 px e pelo lint de layout.
- Sugestões não feitas: tirar "Baixar imagem" no celular; `offline` nos `FamilyCard`.
- CI do PR #670 (run 44755859442, `f170b0c`), rodada 1 — vermelho, `CORRIGIR_CODIGO`:
  - `frontend` (`npm run test:cov`), 2 falhas, ambas nos arquivos do item:
    - `src/test/a11y.test.tsx` › "casca (CA13)" › "sem largura fixa maior que 360 px": `frontend/src/features/portal/PortalCardPage.tsx: w-[420px]: expected 420 to be less than or equal to 360`.
    - `src/features/telasCanvas423.test.ts` › "telas do portal do aluno e do responsável (#423, CA8)" › "portal/PortalMemberCard.tsx não usa cor fixa nem campo solto": `AssertionError: expected [ Array(6) ] to be null`.
  - `e2e` (`e2e/portal-carteirinha.spec.ts`), 4 casos a 360 px (aluno com axe e responsável com troca de aluno e sem conexão, em light e dark), com retry: `expect(locator).toBeVisible() failed — element(s) not found` e `locator.selectOption: Test timeout of 60000ms exceeded`. Provável efeito do `w-[420px]` em 360 px; não confirmado localmente.
  - `backend` (`./mvnw -B verify`), 96 erros em 912 testes, em `identity`, `plan` e outros: `PlanWriteIT.clean:34` e `RepricingIT.clean:29` com `ERROR: update or delete on table "plan" violates foreign key constraint "enrollment_modality_organization_id_plan_id_fkey"`, e `RepricingIT.clean` com `violates foreign key constraint "portal_request_organization_id_enrollment_modality_id_fkey" on table "portal_request"`. Sinal de dado deixado por outro teste na limpeza (`clean`), não confirmado se vem do item; a investigar localmente com `./backend/mvnw -f backend/pom.xml verify`.
  - `ci-gate`: vermelho pela falha acima.
  - Verde: `visual` (17m), `security`, `image-backend`, `image-frontend`, `changes`, Vercel.

### Correção da entrega
- `src/test/a11y.test.tsx` "sem largura fixa maior que 360 px" — arquivos: `PortalCardPage.tsx` (`md:w-[420px]` virou `md:max-w-[420px]`, o teste só aceita `max-w-` acima de 360 px) — prova: `vitest run src/test/a11y.test.tsx` → passou.
- `telasCanvas423.test.ts` "PortalMemberCard.tsx não usa cor fixa" — arquivos: `PortalMemberCard.tsx` (`bg-white/20` virou `bg-brand-foreground/20`, token do tema) — prova: `vitest run src/features/telasCanvas423.test.ts src/test/a11y.test.tsx src/features/portal/PortalCardPage.test.tsx` → 66 passaram.
- e2e `e2e/portal-carteirinha.spec.ts` (o seletor "Aluno" saiu na D5; a carteirinha não traz mais "Atualizada em" no cartão) — arquivos: `frontend/e2e/portal-carteirinha.spec.ts` (aluno confere "Válida em"; responsável vê "Carteirinhas", aciona o chip "Filho Fictício Dois" e, sem conexão, aciona outro chip e vê "Sem conexão · Atualizada em") — prova: `npx playwright test e2e/portal-carteirinha.spec.ts` → 5 passaram; `eslint e2e src/features/portal` e `tsc --noEmit` sem erros.
- Visual do CI: portal-carteirinha → passou; portal-carteirinha-filhos → passou (`test:visual:docker -- -g "portal-carteirinha"`, 8 passaram, sem `--update-snapshots`; sem referência regerada).
- Backend (96 erros no `verify` do CI): não é do item. O primeiro erro é `SeedLoginIT.coordinatorTwoFactor` com `delete from charge` violando `charge_reminder` (dado deixado por outro IT, mesmo padrão das #621 e #667); o item só leu `enrollment` em `PortalCard` e o `PortalCardIT` só ganhou asserções. #668 e #669 passaram o backend. Pela autonomia 5: rodar o job de novo (até 2 vezes); se falhar de novo, abrir issue `técnica`. Não reproduzido localmente (`verify` completo não rodou).

### Rodada 3 — OK — 2026-11-20, estado c8e1cb543717184de01e9ce89d3b028fd2eb3752

| Critério | Status | Evidência |
|---|---|---|
| CA1-CA8 | PASSOU | mantidos da rodada 2; `PortalCardPage.test.tsx`, `telasCanvas423.test.ts`, `a11y.test.tsx`, `portal-card.msw.test.ts` → 71 passaram |
| CA9 | PASSOU | `a11y.test.tsx` "sem largura fixa maior que 360 px" passa (`md:max-w-[420px]`); e2e a 360 px com axe e sem overflow, claro e escuro → 5 passaram |
| CA10 | PASSOU | `test:visual:docker -- -g "portal-carteirinha"` sem `--update-snapshots` → 8 passaram (a troca para `max-w` não alterou as referências) |

Comandos: `npm run lint` e `npm run typecheck` sem erros; `npx playwright test e2e/portal-carteirinha.spec.ts` → 5 passaram. Visual do CI: portal-carteirinha → passou; portal-carteirinha-filhos → passou. Não rodou: `verify` do back-end, `test:cov` completo (CI do PR, autonomia 2).
Achados: nenhum obrigatório. As 2 falhas do `test:cov` e os 4 casos do e2e do CI estão corrigidos e provados. A falha do back-end do CI (`clean` de ITs, FK `charge_reminder`/`enrollment_modality`) não toca arquivos do item (só `PortalCard` leu `enrollment`); não reproduzida aqui, tratar pela autonomia 5.
Sugestões mantidas: Baixar imagem no celular; `offline` nos `FamilyCard`.
