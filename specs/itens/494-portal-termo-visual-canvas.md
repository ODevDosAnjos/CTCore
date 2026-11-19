# 494 — Termo de matrícula do portal no visual do canvas

Origem: issue #494 (Sprint 10.5, Fase 3, R2), `docs/auditoria/decisoes-canvas.md` (R1); evidência M144, M145, M35. Branch: `item/494-portal-termo-visual-canvas`. Dependências #455, #453, #450, #449 fechadas (moldura do portal, campos, `ComingSoon`, massa MSW). Canvas: `PortalTermo` (1440), `PortalMTermo` (390), `PortalTermoFilhos` (1440). Regras: RN-MAT-11, RN-POR-03 (`docs/especificacao/`). A issue pede só visual (front-end); API e contrato não mudam (D1).

## 1. Objetivo

Deixar a tela de aceite do termo (`/portal/termo`) igual ao canvas: marca da academia no topo (desktop), rótulo "ANTES DE COMEÇAR", título, texto de abertura personalizado ("Olá, Juliana! Para liberar o portal do Theo…"), termo numa caixa rolável com "Termo de matrícula · versão N", "Baixar PDF" (Em breve) e a versão, as duas caixas de aceite com dica abaixo, e "Sair" ao lado de "Aceitar e continuar". Com dois filhos pendentes, cartão "Alunos · 1 de 2 aceitos" com avatar e selos, e um único termo por vez, do aluno atual. O caso visual passa a mostrar o termo de verdade (M35).

Fora do escopo: dado novo na API (data de publicação, turma, unidade do aluno: D1); gerar o PDF (Em breve); mudar a regra do aceite.

## 2. Requisitos

- R1: o topo (desktop, a partir de 768 px) traz a marca da organização (`OrgMark` + nome em fonte de título maiúscula, nome vindo do vínculo ativo), o rótulo "Antes de começar" e o título "Termo de matrícula" em fonte de título grande; no celular uma barra escura com a marca e o nome da organização ocupa o lugar dela; sino e avatar da barra do canvas `PortalMTermo` ficam para a #603 (M144, D5).
- R2: o texto de abertura é personalizado: aluno adulto, "Leia e aceite o termo de matrícula da <organização> para liberar o portal. Você aceita uma vez."; responsável com um aluno, "Olá, <primeiro nome>! Para liberar o portal de <aluno>, leia e aceite o termo de matrícula da <organização>. Você aceita uma vez, por <aluno>." (M144).
- R3: o termo fica numa caixa rolável de altura fixa (320 px, rolagem vertical, acessível por teclado) com o texto corrido e, acima dele, "Termo de matrícula · versão N" (com o nome do aluno quando há mais de um pendente, como "Termo de matrícula · Lia Nogueira · versão 3"); sob a caixa, "Baixar PDF" como `ComingSoon` ("Em breve", desabilitado, sem backend) e "Versão N" (M144, D1, D2).
- R4: duas caixas de aceite, cada uma com dica: "Li e aceito o termo de matrícula" (obrigatória) com "Fica registrado com data, hora e versão"; "Autorizo o uso de imagem de <aluno> (opcional)" com o texto do uso de imagem vigente da API como dica e a menção de que dá para revogar em Minhas informações. A caixa de uso de imagem deixa de ser seção separada com título (M144).
- R5: o rodapé de ações tem "Sair" (botão sem destaque que encerra a sessão, à esquerda) e "Aceitar e continuar" (principal, à direita), que segue desabilitado até marcar o aceite do termo e segue chamando `POST /portal/students/{id}/term-acceptance` com a versão e o uso de imagem (M144).
- R6: com mais de um aluno pendente, um cartão "Alunos" com "N de M aceitos" lista cada aluno com avatar de iniciais, nome e selo "Aceito agora" (verde) ou "Falta aceitar"; abaixo, um único termo, do primeiro aluno que falta. O texto de abertura traz "Você é responsável por M alunos com termo pendente. O portal libera depois que você aceitar por todos." Cada aceite recarrega a lista; ao aceitar o último vai para o Início (M145).
- R7: carregando, vazio ("Nenhum termo para aceitar"), erro (com "Tentar de novo") e sem permissão seguem como hoje, nos componentes de estado; o 409 de versão mudada e o erro genérico seguem com a mensagem atual.
- R8: 360 px sem rolagem lateral, axe nos dois temas, textos em `pt-BR.json`.
- R9: os casos visuais `portal-termo` (aluno com termo pendente) e `portal-termo-filhos` (responsável com dois filhos, primeiro já aceito) mostram o termo e passam no limite padrão do `visual:canvas`, ou com `limiteCanvas` justificado (D1); `portal-termo` ganha captura de 390 px (M35).

## 3. Critérios de aceite

- CA1 (R1): dado aluno da "Academia Alfa" com termo pendente, a 1440 px aparecem a marca e o nome da organização, "Antes de começar" e o título; no celular aparece a barra com a marca e o nome da organização, sem a marca duplicada no corpo da tela (sino e avatar: #603).
- CA2 (R2): dado aluno adulto, o texto cita a organização; dado responsável "Juliana" com um aluno "Theo", o texto traz "Olá, Juliana!" e "portal de Theo".
- CA3 (R3): o termo está numa região rolável com nome acessível e foco por teclado, com "Termo de matrícula · versão 3"; "Baixar PDF" está desabilitado com "Em breve" e "Versão 3" aparece.
- CA4 (R4): as duas caixas trazem a dica; o uso de imagem não tem título próprio; marcar só o uso de imagem não habilita o envio.
- CA5 (R5): "Aceitar e continuar" fica desabilitado até marcar o termo; marcar e enviar faz o POST com `{ version, imageUse }`; "Sair" encerra a sessão e leva ao login.
- CA6 (R6): dado responsável com dois filhos pendentes, vê "Alunos", "0 de 2 aceitos", os dois nomes com "Falta aceitar" e um único termo e botão, do primeiro; depois do aceite do primeiro mostra "1 de 2 aceitos", o primeiro com "Aceito agora" e o termo do segundo (com as caixas desmarcadas); depois do segundo vai ao Início.
- CA7 (R7): dado 403, erro, carregando e lista vazia, cada estado aparece como hoje; falha 409 mostra "O termo mudou…" e mantém a tela.
- CA8 (R8): axe sem violação nos dois temas e sem rolagem lateral a 360 px.
- CA9 (R9): `npm run test:visual:docker -- -g "portal-termo"` passa sem `--update-snapshots`; capturas em `.capturas/494/` (`portal-termo-{1440,390}-{sistema,canvas}.png`, `portal-termo-filhos-1440-{sistema,canvas}.png`, pt-BR); `npm run visual:canvas` sem reprovar os casos com o limite padrão ou com `limiteCanvas` justificado.

## 4. Plano técnico

- Dados, API, Segurança: não mudam (`docs/openapi.yaml`, `usePortalTerm` e as rotas ficam; a permissão segue no servidor). MSW: só a massa do caso visual, nos cenários que já existem (`termo@exemplo.com` e `setScenarios(..., { termoFamilia: true })` em `frontend/src/mocks/handlers.ts`, por volta das linhas 60 e 177), com texto de termo parecido com o do canvas.
- Interface (existentes, em `frontend/src/features/portal/`):
  - `PortalTermPage.tsx` (`PortalTermPage`, `TermBlock`): reescrever o layout (marca, rótulo, título, abertura, cartão "Alunos", caixa rolável, `ComingSoon` "Baixar PDF", caixas com dica, "Sair" + "Aceitar e continuar"); guardar a lista inicial de alunos (`useRef`/estado) para montar o progresso, pois a API devolve só os pendentes; aluno atual = primeiro da lista pendente; `key` pelo id para zerar as caixas ao trocar de aluno.
  - Reuso: `OrgMark` (mesma pasta), `Avatar` e `Person` (`components/ui/avatar.tsx`), `ComingSoon` (`components/ui/coming-soon.tsx`), `LogoutButton` (`features/auth/LogoutButton`; conferir como fica discreto), `useSession` (nome da conta e da organização do vínculo), `components/states`, campos base da #453 (conferir em `components/ui/` se há caixa de seleção com descrição). `AccountFrame plain` sai desta tela no desktop (o canvas não tem barra); no celular conferir a barra do portal da #455 (`PortalLayout`) e reusar, sem criar moldura nova.
  - `frontend/src/i18n/pt-BR.json` (`portalTerm`): chaves novas (rótulo, aberturas por caso, "Termo de matrícula · versão", "Baixar PDF", "Versão", dicas, "Alunos", "N de M aceitos", selos, "Sair"); saem `studentHeading`, `intro` e `imageUseTitle` se ficarem sem uso.
  - `frontend/visual/casos.ts` (linhas 73 e 74) e `telas.visual.ts`: `portal-termo` com o perfil `termo@exemplo.com`; `portal-termo-filhos` com o cenário `termoFamilia` e um passo que aceita o primeiro filho (para o "1 de 2"); `canvasCelular: "PortalMTermo"` já existe; `limiteCanvas` só com motivo e issue. Referências regeradas só destes casos.
  - Testes: `PortalTermPage.test.tsx` (existe) adaptado e ampliado; `frontend/e2e/portal-termo.spec.ts` ajustado se os rótulos mudarem.
- Riscos: (1) a barra do desktop não existe no canvas desta tela e existe nas outras do portal; (2) o "N de M" conta só os pendentes ao abrir a tela (D3); (3) dados que o canvas mostra e a API não tem (D1) podem reprovar no limite padrão; (4) caixas marcadas de um aluno não podem vazar para o seguinte.

## 5. Tarefas

- [x] T1: textos `pt-BR` e a página nova para o aluno com um termo (marca, abertura, caixa rolável, `ComingSoon`, dicas, "Sair" e "Aceitar e continuar") — cobre CA1 a CA5, CA7 — prova: `cd frontend && npx vitest run src/features/portal/PortalTermPage.test.tsx`
- [x] T2: cartão "Alunos" com progresso e um termo por vez — cobre CA6 — prova: `cd frontend && npx vitest run src/features/portal/PortalTermPage.test.tsx`
- [x] T3: axe, 360 px e e2e do termo — cobre CA8 — prova: `cd frontend && npx vitest run src/test/a11y.test.tsx src/features/portal/PortalTermPage.test.tsx` e `npx playwright test e2e/portal-termo.spec.ts`
- [x] T4: massa MSW e casos visuais, referências e capturas em `.capturas/494/` — cobre CA9 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots -g "portal-termo"`, depois sem `--update-snapshots`, e `npm run visual:canvas`
- [x] T5: regressão do front — não cobre critério: exigência do AGENTS.md — prova: `cd frontend && npm run lint && npm run typecheck && npm run build && npm run test:cov && npm run e2e`

## 6. Decisões

- D1: o que o canvas mostra e a API não entrega (data "publicada em", turma e unidade do aluno na lista, "aceite registrado com conta, versão, data, hora e IP") fica fora: a linha traz só "Versão N" e a lista de alunos só avatar e nome. Motivo: a issue é de front-end; mudar API pede back-end, contrato e IT. Alternativa: acrescentar `publishedAt` e a turma em `PortalTermPending` (sugestão de novo item de API). Divergência que reprovar no limite padrão leva `limiteCanvas` com motivo e a issue da 10.5 que a remove (AGENTS.md, autonomia 4); se não houver essa issue, abrir uma.
- D2: "Baixar PDF" entra como `ComingSoon` (visível, desabilitado), sem backend, conforme a issue e o AGENTS.md.
- D3: o progresso "N de M" conta os alunos pendentes ao abrir a tela; aceite feito em outra sessão não entra. Motivo: a API devolve só os pendentes. Alternativa: campo novo na API.
- D4: "Sair" reutiliza a ação de sair já existente (#434); não cria rota nova.
- D5 (ajuste, pedido da rodada 2 da verificação): a barra do celular traz só marca e nome da organização, sem sino e avatar, porque o shell do portal só responde depois do aceite. Motivo: divergência que passa no limite padrão do `visual:canvas`; pela autonomia 4 do AGENTS.md não usa `limiteCanvas` e vai para a issue da Sprint 10.5 #603, que traz a correção e a verificação no "Pronto quando". A #603 é citada na descrição do PR. R1 e CA1 ajustados; nenhuma tarefa nova (código e capturas já corrigidos na "Correção da rodada 2").
- Suposição: o primeiro nome vem da conta da sessão (`account.name`); sem nome, a abertura omite "Olá, <nome>!". A frase do responsável por vários alunos é neutra de gênero ("Você é responsável por M alunos"), em vez de "responsável financeira" do canvas, por não haver gênero no dado.

## Construção

- T1 e T2 — arquivos: `frontend/src/features/portal/PortalTermPage.tsx` (reescrita: marca, rótulo, `PageHeader`, abertura por caso, cartão "Alunos" com progresso em estado, região rolável, `ComingSoon`, caixas com dica, "Sair" + "Aceitar e continuar"), `frontend/src/features/auth/LogoutButton.tsx` (prop `label`, para "Sair"), `frontend/src/i18n/pt-BR.json` (`portalTerm`), `PortalTermPage.test.tsx` (4 casos novos) — prova: `npx vitest run src/features/portal/PortalTermPage.test.tsx` → 12 passaram
- T3 — prova: `npx vitest run src/test/a11y.test.tsx src/features/auth` → 153 passaram; `npx playwright test e2e/portal-termo.spec.ts` → 2 passaram (360 px sem rolagem, axe claro e escuro); e2e sem mudança
- T4 — arquivos: `frontend/src/mocks/browser.ts` (gancho `__mswTermo`, só teste visual), `frontend/visual/casos.ts` (`termoCanvas`; `portal-termo` agora com `familia` e um filho "Theo"; `portal-termo-filhos` com passo que aceita o primeiro), `frontend/visual/telas.visual.ts` — prova: `npm run test:visual:docker -- --update-snapshots -g "portal-termo"` e depois sem `--update-snapshots` → 8 passaram; `npm run visual:canvas` → 154 comparadas, 0 reprovadas; capturas em `.capturas/494/` (`portal-termo-{1440,390}-{sistema,canvas}.png`, `portal-termo-filhos-1440-{sistema,canvas}.png`)
- T5 — `npm run lint`, `npm run typecheck`, `npm run build` → ok; `npm run test:cov` → 267 arquivos, 2627 testes passaram; `npm run e2e` → 98 passaram
Regressão: front-end inteiro verde, sem piora; back-end não mudou (não rodado).
Visual do CI: portal-termo → passou
Visual do CI: portal-termo-filhos → passou
Referências visuais: `frontend/visual/referencias/portal-termo-{1440,390}-{claro,escuro}.png` e `portal-termo-filhos-{1440,390}-{claro,escuro}.png`
Desvios: (1) o canvas de `PortalTermo` é o responsável com um filho, então o caso `portal-termo` passou do perfil `aluno` para `familia` com o filho "Theo" (D1: nome da conta vem da massa, "Ana", e a organização é "Academia Alfa", não "Juliana"/"Academia Leão"). (2) Os dois casos usam o gancho `__mswTermo` em vez de `termoFamilia`, para ter o termo na versão 3 do canvas e o aceite que tira o aluno da lista. (3) O título usa `PageHeader` (regra de `portalPages.test.ts`), logo sai em caixa alta, como no canvas. (4) Sem `AccountFrame`: a tela não tem barra no desktop nem no celular (o canvas de 390 px mostra a barra do portal, que não existe antes do aceite; fica como divergência, dentro do limite padrão). (5) Sem `limiteCanvas`: todos os casos passam no limite padrão. Divergências de D1 (data "publicada em", turma, "aceite registrado com conta, versão, data, hora e IP", frase "responsável financeira") seguem como no plano.
Não é do item: nenhum.

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-19, estado 6108a3affc97ae1999048e7fd66a06a54c0ec1c0

| Critério | Status | Evidência |
|---|---|---|
| CA1 | NÃO PASSOU (parcial) | 1440 px: marca, "Antes de começar" e título conferidos na captura. Celular: não há marca duplicada, mas também não há a barra do portal que R1 e o canvas `PortalMTermo` mostram (captura `portal-termo-390-sistema.png` sem barra) |
| CA2 | PASSOU | `PortalTermPage.test.tsx` (abertura adulto e "Olá, Juliana!"/"portal de Theo") |
| CA3 | PASSOU | teste: região com nome, `tabindex=0`, "Baixar PDF" `aria-disabled`, "Em breve", "Versão 1"; captura |
| CA4 | PASSOU | teste: dicas por descrição acessível, sem título de uso de imagem, só imagem não habilita |
| CA5 | PASSOU | testes de POST `{version,imageUse}` e "Sair" leva ao login |
| CA6 | PASSOU | teste de dois filhos; captura `portal-termo-filhos-1440-sistema.png` mostra "1 de 2 aceitos", "Aceito agora", termo da Lia |
| CA7 | PASSOU | testes de estados existentes seguem verdes |
| CA8 | PASSOU | `a11y.test.tsx` e `e2e/portal-termo.spec.ts` (360 px, axe claro e escuro): 2 passaram |
| CA9 | PASSOU | `test:visual:docker -- -g "portal-termo"` sem update: 8 passaram; `visual:canvas --exige`: 154 comparadas, 0 reprovadas |

Comandos: `npx vitest run src/features/portal/PortalTermPage.test.tsx src/test/a11y.test.tsx src/features/auth` → 165 passaram; `npm run lint`, `npm run typecheck` → ok; e2e do termo → 2 passaram. Não rerodados: `build`, `test:cov` e `e2e` completo (valem os resultados da Construção e o CI do PR).
Visual do CI: portal-termo (1440/390, claro/escuro) → passou; portal-termo-filhos → passou.
Achados:
- obrigatório, código, `frontend/src/features/portal/PortalTermPage.tsx` (sem `AccountFrame`/barra no celular) — esperado: R1 e AGENTS.md (canvas vence em layout): no celular a barra do portal (marca, sino, avatar) como em `PortalMTermo`; observado: nenhuma barra no celular, só o rótulo e o título; evidência: capturas `.capturas/494/portal-termo-390-{sistema,canvas}.png`; corrigir: reusar a barra do portal sem chamar rotas bloqueadas pelo termo (a barra fica fora do `RequirePortalTerm`), ou, se inviável, registrar a divergência pela regra de autonomia 4 (`limiteCanvas`/issue da 10.5 e "Pronto quando") e ajustar R1 na especificação do item e no PR; hoje só consta em "Desvios".
- sugestão, código, caixas de aceite em cartão com borda e "Baixar PDF" como botão desabilitado diferem do canvas (aceites sem cartão, link "Baixar PDF" com data); termo dentro do mesmo cartão do canvas. Passa no limite padrão.

### Correção da rodada 1
- achado obrigatório (barra do portal no celular) — arquivos: `frontend/src/features/portal/PortalTermPage.tsx` (barra escura `md:hidden` com `OrgMark` e nome da organização, fora do `main`, sem chamar rotas bloqueadas pelo termo; sino e avatar ficam de fora por dependerem do shell, bloqueado antes do aceite), `PortalTermPage.test.tsx` (confere a barra só no celular) — prova: `npx vitest run src/features/portal/PortalTermPage.test.tsx src/test/a11y.test.tsx` → 24 passaram; `npm run lint`, `npm run typecheck` → ok; `npx playwright test e2e/portal-termo.spec.ts` → 2 passaram
- Referências visuais regeradas: `frontend/visual/referencias/portal-termo-390-{claro,escuro}.png` e `portal-termo-filhos-390-{claro,escuro}.png` (as de 1440 não mudam de propósito)
- Visual do CI: portal-termo → passou; portal-termo-filhos → passou (8 passaram sem `--update-snapshots`); `visual:canvas --exige` → 154 comparadas, 0 reprovadas
- Desvio: no celular a barra traz só a marca (sem sino e avatar do canvas), pois o shell do portal só responde depois do aceite; divergência dentro do limite padrão. Sugestão (caixas em cartão, "Baixar PDF") não atendida, opcional.
- Regressão completa (`build`, `test:cov`, `e2e`) não rerodada: mudança só de marcação de uma tela; vale a Construção e o CI do PR.

### Rodada 2 — CORRIGIR_CODIGO — 2026-11-19, estado 861dbd592fff5dcc1be54cc7d8296337525e6df7

| Critério | Status | Evidência |
|---|---|---|
| CA1 | NÃO PASSOU (parcial) | 1440: mantido da rodada 1. Celular: barra escura com marca e nome da organização agora existe (referência `portal-termo-390-claro.png` aberta e comparada com `.capturas/494/portal-termo-390-canvas.png`); faltam sino e avatar do canvas, divergência sem issue da 10.5 nem "Pronto quando" (achado 1) |
| CA2 a CA8 | PASSOU | mantidos da rodada 1; vitest do termo, a11y e auth: 16 arquivos, 165 passaram; e2e do termo: 2 passaram |
| CA9 | PASSOU (com ressalva) | `test:visual:docker -- -g "portal-termo"` sem update: 8 passaram. Capturas de 390 em `.capturas/494/` estão defasadas (achado 2) |

Comandos: `npx vitest run src/features/portal/PortalTermPage.test.tsx src/test/a11y.test.tsx src/features/auth` → 165 passaram; `npm run lint`, `npm run typecheck` → ok; `npx playwright test e2e/portal-termo.spec.ts` → 2 passaram; `npm run test:visual:docker -- -g "portal-termo"` → 8 passaram. `build`, `test:cov`, `e2e` completo não rerodados (valem Construção e CI).
Visual do CI: portal-termo → passou; portal-termo-filhos → passou.
Achados:
- obrigatório, código, `frontend/src/features/portal/PortalTermPage.tsx` (barra do celular sem sino e avatar) — esperado: AGENTS.md autonomia 4 e regra temporária da #568: divergência com o canvas que passa no limite padrão exige issue da Sprint 10.5 com a correção e verificação no "Pronto quando", citada no PR e no arquivo do item; R1 ajustado; observado: o item só diz "divergência dentro do limite padrão", sem issue citada (só #494 e #498 aparecem na busca por "termo"), e R1 continua dizendo que a barra do portal substitui a marca; corrigir: abrir (ou apontar) a issue da 10.5 para sino e avatar na barra do termo, citá-la no arquivo do item e no PR, e ajustar R1/desvios.
- obrigatório, código, `.capturas/494/portal-termo-390-sistema.png` e `portal-termo-filhos-*` — esperado: capturas atuais do sistema (AGENTS.md) para o verificador comparar; observado: `portal-termo-390-sistema.png` é de 00:44, anterior à barra (mesmo tamanho, 59907 bytes, da referência antiga); corrigir: regerar as capturas de 390 em `.capturas/494/` a partir da referência nova.
- sugestão, código: caixas de aceite em cartão e "Baixar PDF" como botão desabilitado seguem diferindo do canvas (inalterado da rodada 1).
- sugestão, código: o diff de `PortalTermPage.tsx` reformata linhas sem mudança funcional (quebras de linha), aumentando o diff.

### Correção da rodada 2
- achado obrigatório (barra do celular sem sino e avatar) — divergência registrada pela autonomia 4 (passa no limite padrão, sem `limiteCanvas`): issue da Sprint 10.5 #603 ("Termo de matrícula do portal: barra do celular com sino e avatar como no canvas PortalMTermo"), com a verificação no "Pronto quando" (capturas de 390 px lado a lado e `visual:canvas --exige` sem `limiteCanvas`); citar #603 na descrição do PR. Texto de R1 ("a barra do portal substitui a marca") fica para a fase 2 ajustar; no código a barra do celular traz marca e nome da organização, sem sino e avatar até a #603.
- achado obrigatório (capturas defasadas) — `.capturas/494/portal-termo-390-sistema.png`, `portal-termo-filhos-390-sistema.png` (nova), e as de 1440 do sistema regeradas a partir das referências atuais do teste visual (`frontend/visual/referencias/*-claro.png`); `portal-termo-390-canvas.png` atualizada de `docs/design/prints/lado-a-lado/` — prova: tamanhos iguais aos das referências (59040 e 57878 bytes).
- Sem mudança de código nesta rodada; testes e referências não mudam. Sugestões (cartões das caixas, "Baixar PDF", reformatação do diff) não atendidas, opcionais.

### Rodada 3 — OK — 2026-11-19, estado c8e9f6e9e3eb1a47c496e8498f151a99a76dc8a1

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | R1/CA1/D5 ajustados no item; divergência (sino e avatar) registrada na #603 (aberta, Sprint 10.5, "Pronto quando" com capturas de 390 px e `visual:canvas --exige` sem `limiteCanvas`); captura `portal-termo-390-sistema.png` aberta: barra com marca e nome |
| CA2 a CA8 | PASSOU | mantidos das rodadas 1 e 2; vitest do termo, a11y e auth: 16 arquivos, 165 passaram; lint e typecheck ok |
| CA9 | PASSOU | `test:visual:docker -- -g "portal-termo"` sem update: 8 passaram; capturas em `.capturas/494/` atuais (tamanhos iguais às referências: 72268, 59040, 81621, 57878 bytes) e comparadas com o canvas |

Comandos: vitest (termo, a11y, auth) → 165 passaram; `npm run lint`, `npm run typecheck` → ok; `npm run test:visual:docker -- -g "portal-termo"` → 8 passaram. `build`, `test:cov`, `e2e` completo não rerodados (sem mudança de código desde a rodada 2; valem Construção e CI do PR). Desde a rodada 2 só mudou o arquivo do item.
Visual do CI: portal-termo → passou; portal-termo-filhos → passou.
Achados: nenhum obrigatório. Lembrete: citar a #603 na descrição do PR.
- sugestão, código: caixas de aceite em cartão e "Baixar PDF" como botão desabilitado diferem do canvas (inalterado).

## Entrega

Muda: a tela de aceite do termo (`/portal/termo`) no visual do canvas. Desktop: marca da organização, "Antes de começar" e título "Termo de matrícula". Celular: barra escura com marca e nome da organização. Abertura personalizada por caso; para responsável com vários alunos, cartão "Alunos" com progresso e um termo por vez. Termo numa caixa rolável, "Baixar PDF" como `ComingSoon`, caixas de aceite com dica, "Sair" e "Aceitar e continuar". Os casos `portal-termo` e `portal-termo-filhos` mostram o termo real (gancho `__mswTermo` no MSW, só teste visual). API, contrato e regras não mudam.

Verificado: rodada 3 `OK` (estado c8e9f6e9e3eb1a47c496e8498f151a99a76dc8a1). Vitest do termo, a11y e auth: 165 passaram; lint e typecheck ok; `npm run test:visual:docker -- -g "portal-termo"` sem update: 8 passaram; `visual:canvas --exige`: 154 comparadas, 0 reprovadas. Na construção, `build`, `test:cov` (2627 testes) e `e2e` (98) passaram. A base (`dev`) não avançou desde a verificação, então a regressão não foi rerodada; o CI do PR vale.

Decisões:
- Barra do celular sem sino e avatar (D5): divergência que passa no limite padrão, sem `limiteCanvas`; a correção é a #603, com a verificação no "Pronto quando" dela.
- Dados que a API não entrega (data de publicação, turma, unidade, dados do aceite) ficam fora (D1). Sugestão: item de API próprio.
- "N de M aceitos" conta os pendentes ao abrir a tela (D3).

Divergências restantes, dentro do limite padrão: caixas de aceite em cartão e "Baixar PDF" como botão desabilitado (o canvas usa link com data).

Regressão: sem falhas registradas. Limitações: nenhuma além das acima.
