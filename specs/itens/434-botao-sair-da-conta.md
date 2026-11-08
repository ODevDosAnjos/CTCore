# 434 — Botão de sair da conta na gestão e no portal

Origem: issue #434 (Sprint 10.5, Fase 2, achado do teste manual do dono). Branch: `item/434-botao-sair-da-conta`.

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Dar à pessoa logada uma ação "Sair da conta" visível na gestão (barra de cima e menu lateral, que no celular é o menu em tela cheia) e na barra do portal do aluno, para trocar de usuário sem apagar cookies. Ao clicar: `POST /auth/logout`, limpar a sessão no front e ir para `/entrar`.

Fora do item: menu do usuário com avatar e outros itens (só a ação de sair; D1), encerrar outras sessões, mudar servidor, contrato ou MSW (já cobrem a rota).

## 2. Requisitos

- R1: a barra de cima da gestão (`ManagementLayout`) mostra o botão "Sair da conta", com o texto de `pt-BR.json`.
- R2: o menu lateral da gestão, no desktop e no menu em tela cheia do celular, mostra "Sair da conta" no rodapé (D1).
- R3: a barra do portal (`PortalLayout`) mostra o botão "Sair da conta", inclusive no portal reduzido e a 360 px.
- R4: ao acionar, o front chama `POST /auth/logout`, deixa a sessão anônima e navega para `/entrar` sem `next` (D2).
- R5: se a chamada falhar, a sessão não é limpa, a pessoa continua onde está e vê erro com "Tentar de novo".
- R6: depois de sair, abrir `/agenda` ou `/portal/agenda` leva a `/entrar?next=...` e entrar com outro usuário abre a área dele.
- R7: funciona em 360 px e desktop, nos temas claro e escuro, passa no axe, com alvo de toque de pelo menos 44 px e foco visível; texto só em `pt-BR.json`, cores só por tokens.
- R8: o contrato e o MSW de `POST /auth/logout` são conferidos e seguem batendo.

## 3. Critérios de aceite

- CA1 (R1, R4): dado a gestão aberta, quando se aciona "Sair da conta" na barra, então sai `POST /auth/logout` e a URL passa a ser `/entrar`.
- CA2 (R2): dado o `Sidebar` com `onLogout`, então o rodapé mostra "Sair da conta" (só o ícone, com nome acessível, quando recolhido); no `MobileMenu` aberto o item também aparece e aciona a saída; sem `onLogout` a linha não aparece.
- CA3 (R3, R4): dado o portal aberto, quando se aciona "Sair da conta" na barra, então vale o mesmo de CA1; no portal reduzido o botão continua visível.
- CA4 (R5): dado `POST /auth/logout` respondendo 500 ou rede fora, então a sessão continua válida, a URL não muda e aparece erro com "Tentar de novo" que repete a chamada.
- CA5 (R4): dado a saída a partir de `/agenda`, então a URL final é `/entrar` sem `next`.
- CA6 (R6): e2e: entrar na gestão, sair, abrir `/agenda` e cair em `/entrar?next=%2Fagenda`; entrar com outro usuário e ver a área dele; o mesmo no portal com `/portal/agenda`.
- CA7 (R7): dado a barra da gestão e a do portal a 360 px e em desktop, nos dois temas, então o axe não aponta violação, não há rolagem horizontal e o botão tem pelo menos 44 px de altura.
- CA8 (R8): `src/mocks/msw.test.ts` e `OpenApiContractTest` seguem verdes sem mudança em `docs/openapi.yaml` (`POST /auth/logout`: 204 e 401).

## 4. Plano técnico

- **Dados, API, OpenAPI, back-end.** Não mudam: `POST /auth/logout` já está em `docs/openapi.yaml` (204/401) e no MSW (`frontend/src/mocks/handlers.ts`, zera `loggedIn`). Só conferir (CA8). A barreira é o servidor (encerra a sessão e remove o cookie); o front só limpa o estado e envia o `X-XSRF-TOKEN` pelo `api()` existente.
- **Front-end, a criar.** `src/features/auth/useLogout.ts`: hook com `{ logout, pending, failed }`; chama `api("/auth/logout", { method: "POST" })` e, em sucesso, `clear()` do `SessionProvider` e `navigate("/entrar", { replace: true })`. `src/features/auth/LogoutButton.tsx`: `Button` (`variant="ghost"` ou `outline`, `size="sm"`, ícone `LogOut` do lucide, texto `auth.logout.label`, "Saindo..." enquanto `pending`) e, com `failed`, o `ErrorState` padrão com "Tentar de novo".
- **Front-end, a alterar.**
  - `src/features/auth/SessionProvider.tsx`: expor `clear()` (`setState({ status: "anon" })`) no contexto.
  - `src/features/permissions/ManagementLayout.tsx`: `<LogoutButton />` no `headerExtra`, ao lado de `AccountLink`; passar `onLogout` ao `AppLayout`.
  - `src/components/layout/AppLayout.tsx`, `Sidebar.tsx` (`SidebarProps`; rodapé com a linha ativa "Sair da conta" no mesmo molde da função `footer`) e `MobileMenu.tsx` (já repassa as props). `Sidebar` e `AppLayout` não usam `useSession` (os testes atuais seguem sem provider): recebem `onLogout` opcional por prop.
  - `src/features/portal/PortalLayout.tsx`: `<LogoutButton />` junto de `AccountLink` e `ChooseLinkTrigger`, com as classes de contraste da barra (`text-sidebar-foreground`, como o `ThemeToggle` ali).
  - `src/features/account/AccountFrame.tsx` (cabeçalho simples `plain`, termo pendente): `<LogoutButton />` também (D4).
  - `src/features/auth/TwoFactorRequiredPage.tsx`: passa a usar `useLogout` (D3).
  - `src/i18n/pt-BR.json`: `auth.logout.label` e `auth.logout.pending` (a chave `twoFactor.required.logout` pode apontar para o mesmo texto ou ser removida se nada mais a usar).
- **Interface.** Componentes base apenas (`Button`, `ErrorState`), sem cor ou tamanho solto. Estados: carregando (botão desabilitado e "Saindo..."), erro (CA4); vazio e sem permissão não se aplicam (qualquer sessão pode sair). Comparar com o canvas conforme o AGENTS.md; se o canvas mostrar menu do usuário, a divergência entra como `limiteCanvas` com motivo (D1).
- **Testes.** A criar: `src/features/auth/LogoutButton.test.tsx`, `frontend/e2e/sair-da-conta.spec.ts` (`@critical`, usa os logins fictícios de `portal-barra.spec.ts` e `login.spec.ts`, axe e 360 px como neles). A ampliar: `ManagementLayout.test.tsx`, `PortalLayout.test.tsx`, `Sidebar.test.tsx`, `AppLayout.test.tsx`, `TwoFactorLogin.test.tsx`.
- **Riscos.** Corrida entre `clear()` e `navigate`: com a sessão anônima, `RequireSession` redireciona para `/entrar?next=<rota atual>`, e o `next` mandaria o próximo usuário para a rota do anterior; o resultado tem de ser `/entrar` limpo (CA5) e o teste prova. A barra da gestão a 360 px já é apertada: o botão da barra pode ficar oculto no celular (`hidden md:inline-flex`), onde a saída fica no menu (R2); o portal não tem menu e mostra o botão sempre (R3).
- **Doc.** Não muda.

## 5. Tarefas

- [x] T1: `clear()` no `SessionProvider`, `useLogout`, `LogoutButton` e textos em `pt-BR.json` — cobre CA1, CA4, CA5 — prova: `npx vitest run src/features/auth/LogoutButton.test.tsx`.
- [x] T2: `LogoutButton` na barra da gestão e `onLogout` em `AppLayout`/`Sidebar`/`MobileMenu` — cobre CA1, CA2 — prova: `npx vitest run src/features/permissions/ManagementLayout.test.tsx src/components/layout/Sidebar.test.tsx src/components/layout/AppLayout.test.tsx`.
- [x] T3: `LogoutButton` no `PortalLayout` e no cabeçalho simples do `AccountFrame`; `TwoFactorRequiredPage` usando o hook — cobre CA3 — prova: `npx vitest run src/features/portal/PortalLayout.test.tsx src/features/auth/TwoFactorLogin.test.tsx`.
- [x] T4: e2e `@critical`: entrar, sair, abrir rota protegida, entrar com outro usuário, na gestão e no portal, 360 px e desktop, axe nos dois temas — cobre CA6, CA7 — prova: `npx playwright test e2e/sair-da-conta.spec.ts` em `frontend/`.
- [x] T5: conferir contrato e MSW e rodar a regressão do front — cobre CA8 — prova: `npx vitest run src/mocks/msw.test.ts` e `npm run lint && npm run typecheck && npm run build && npm run test:cov`.

## 6. Decisões

- D1: só a ação "Sair da conta", sem menu do usuário com avatar; fica na barra da gestão, no rodapé do menu lateral (que é o menu do celular) e na barra do portal. Motivo: é o que a issue pede e o item é pequeno. Alternativa: menu suspenso do usuário, descartada por exigir componente base novo e itens ainda sem tela. Suposição: o canvas não define esse menu; se definir, entra `limiteCanvas` (autonomia 4).
- D2 (muda o comportamento): depois de sair vai sempre para `/entrar` sem `next`, para o próximo usuário não herdar a rota do anterior. Alternativa: manter `next`, descartada por levar outro usuário a uma rota que talvez ele não possa abrir.
- D3: a `TwoFactorRequiredPage` passa a usar o mesmo hook, uma só implementação da saída; o comportamento visível (volta ao login) continua. Se atrapalhar `TwoFactorLogin.test.tsx`, manter a tela como está e registrar.
- D4: o cabeçalho simples do `AccountFrame` (termo de matrícula pendente) também ganha o botão. Suposição: sem ele, quem entrou com a conta errada e cai no aceite do termo não consegue sair; se o dono achar excesso, remover não afeta o resto.
- D5: durante a saída o botão fica desabilitado e mostra "Saindo...", contra envio duplo, no padrão do login.

## Construção

- T1 — arquivos: `features/auth/useLogout.ts`, `LogoutButton.tsx` (com `LogoutError`), `LogoutButton.test.tsx`, `SessionProvider.tsx` (`clear()`), `RequireSession.tsx`, `i18n/pt-BR.json` — prova: `npx vitest run src/features/auth/LogoutButton.test.tsx` → 3 passaram
- T2 — arquivos: `ManagementLayout.tsx`, `AppLayout.tsx`, `Sidebar.tsx` (MobileMenu já repassa as props) e os testes de `Sidebar` e `ManagementLayout` — prova: `npx vitest run src/components/layout src/features/permissions/ManagementLayout.test.tsx` → passaram
- T3 — arquivos: `PortalLayout.tsx` (+ teste, Tab agora inclui "Sair da conta"), `AccountFrame.tsx`, `TwoFactorRequiredPage.tsx` (usa `useLogout`; chave `twoFactor.required.logout` removida) — prova: `npx vitest run src/features/portal/PortalLayout.test.tsx src/features/auth` → passaram
- T4 — arquivos: `e2e/sair-da-conta.spec.ts` — prova: `npx playwright test e2e/sair-da-conta.spec.ts` → 5 passaram
- T5 — prova: `npx vitest run src/mocks/msw.test.ts` → passou; `npm run lint && npm run typecheck && npm run build` → ok; `docs/openapi.yaml` e MSW sem mudança (`OpenApiContractTest` do back-end não rodou: nada mudou no contrato)

Regressão: `npm run test:cov` → 1971 passaram, 9 falharam em 4 arquivos (`LoginPage`, `OverduePage`, `TeacherFormDialog`, `UnitSettingsPage`), todos de outros itens e instáveis sob carga: rodados de novo isolados, 75/75 passaram. `npm run e2e` completo não rodou (só o spec do item).
Desvios:
- D2 exigiu `out` no estado anônimo do `SessionProvider` (`clear()` marca `out`) e um desvio no `RequireSession` para `/entrar` sem `next`; só `navigate` + `clear` ainda gerava `?next=` (a transição do router chegava depois do estado).
- `LogoutButton` tem `min-h-11` (44 px de altura, CA7).
- A barra da gestão mostra o botão só em `md` para cima; no celular a saída fica no menu (R2). O erro da saída aparece como aviso fixo (`LogoutError`) para não quebrar a barra.
- Comparação com o canvas (capturas em `.capturas/434/`) não feita nesta sessão.
Não é do item: o botão "Buscar, Em breve" da `Topbar` reprova `label-content-name-mismatch` no axe real (desktop); o e2e do item ignora essa regra com comentário.

## Verificação

### Rodada 1 — NAO_CONFERIDO — 2026-11-07, estado 4ea189d0023bd8c1a425d120b6add819367263bd

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | e2e gestão (light/dark) 5/5 verdes; ManagementLayout.test |
| CA2 | PASSOU | Sidebar.test e e2e do menu em tela cheia |
| CA3 | PASSOU | PortalLayout.test e e2e do portal |
| CA4 | PASSOU | LogoutButton.test (falha mantém sessão, "Tentar de novo") |
| CA5 | PASSOU | e2e: URL final `/entrar$` |
| CA6 | PASSOU | e2e: `/entrar?next=%2Fagenda` e `%2Fportal%2Fagenda`, outro usuário entra |
| CA7 | PASSOU (parcial) | axe portal 360 px sem violação; gestão desktop com `label-content-name-mismatch` ignorado (Topbar, fora do item); 44 px conferido na gestão |
| CA8 | PASSOU | msw.test verde; sem mudança em openapi |

Comandos: vitest (auth, layout, ManagementLayout, PortalLayout, msw, account) 24 arquivos/241 testes verdes; `tsc --noEmit` sem erros; playwright sair-da-conta 5/5. Regressão completa não rodada por mim (construção relata 9 falhas instáveis de outros itens).
Achados:
- obrigatório pelo AGENTS.md, processo: `.capturas/434/` não existe; comparação com o canvas (1440 e 390 px, pt-BR) não foi feita, e a descrição do PR exige a lista de divergências. Sem as imagens o resultado é NAO_CONFERIDO. Fazer: caso no `frontend/visual/casos.ts` para a barra da gestão e do portal, `npm run visual:canvas`, salvar em `.capturas/434/`; registrar `limiteCanvas` se o canvas tiver menu do usuário.
- sugestão, código, `useLogout.ts`: `navigate` antes de `clear()` depende do campo `out`; funciona e está testado.

### Correção da rodada 1
- Comparação com o canvas feita (achado de processo) — capturas em `.capturas/434/` (`moldura-coordenacao-1440`, `portal-aluno-1440`, `portal-aluno-390`, `-sistema` e `-canvas`, a partir do teste visual com MSW em pt-BR e de `npm run visual:canvas`) — prova: `npm run test:visual:docker -- --update-snapshots` → 357 passaram; `npm run visual:canvas -- --exige` → 96 comparadas, 0 reprovadas (portal-aluno 1440: 5,6%; 390: 23,1%, limite 30%). Sem `limiteCanvas` novo.
- Divergências achadas e como foram resolvidas:
  - O canvas do portal (`PortalInicio`) e da barra da gestão (`Topbar`) mostra avatar e nome do usuário sem ação de sair; o sistema acrescenta "Sair da conta" (D1, decisão do item: sem menu do usuário). Mantida; dentro do limite do caso, sem exceção nova.
  - O canvas `Sidebar` (menu lateral) não traz "Sair da conta" no rodapé; o sistema traz (R2, é o menu do celular). Mantida pelo mesmo motivo.
  - O canvas não define o menu do usuário; se o dono quiser o menu suspenso, é outro item.
- Desvio: a barra da gestão e a do portal mudaram, então os prints de referência de todas as telas que as exibem foram regerados (146 arquivos em `frontend/visual/referencias`), não só os da própria tela; sem isso o teste visual reprova 140 casos.
- Sugestão do verificador (`navigate` antes de `clear()`): sem mudança, depende do `out` e está testado.

### Rodada 2 — OK — 2026-11-07, estado 474b5ed1b017d6eb9772b7935af617084a385aab

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA8 | PASSOU | mantidos da rodada 1; código sem mudança desde 4ea189d (o diff entre os estados só traz prints de referência e o arquivo do item) |
| CA7 | PASSOU (parcial) | mantido da rodada 1; `label-content-name-mismatch` da Topbar fora do item, ignorado no e2e com comentário |

Comandos: vitest (auth, layout, ManagementLayout, PortalLayout, account, msw.test) 24 arquivos/241 testes verdes; `tsc --noEmit` sem erros; `npm run lint` sem erros. e2e não repetido (código inalterado; 5/5 na rodada 1).
Achados:
- achado de processo da rodada 1 resolvido: `.capturas/434/` existe (moldura-coordenacao 1440, portal-aluno 1440 e 390, sistema e canvas); abertas e comparadas; divergências (Sair da conta ausente no canvas da barra, do portal e do menu lateral) registradas na correção, decididas em D1, sem `limiteCanvas` novo.
- sugestão: a barra da gestão a 390 px não tem captura própria (o botão fica oculto, saída no menu lateral, coberto pelo caso 1440 do menu); sem impacto.
- sugestão, código, `useLogout.ts`: `navigate` antes de `clear()` depende do campo `out`; testado.

## Entrega

- O que muda: botão "Sair da conta" na barra da gestão (a partir de `md`), no rodapé do menu lateral e do menu do celular, e na barra do portal e no cabeçalho simples do termo pendente. Saída: `POST /auth/logout`, sessão anônima e `/entrar` sem `next`. Falha mantém a sessão e mostra "Tentar de novo". A tela de dois fatores usa o mesmo hook.
- Verificação: rodada 2 OK (estado 474b5ed1). Vitest das áreas tocadas 241 verdes, `tsc`, `lint`, e2e `sair-da-conta` 5/5 na rodada 1. Comparação com o canvas feita (`.capturas/434/`, `npm run visual:canvas -- --exige` sem reprovação; 146 prints de referência regerados por causa da barra).
- Decisões: D1 (só a ação de sair, sem menu do usuário), D2 (sempre `/entrar` sem `next`), D3, D4, D5. Divergências com o canvas (barra, portal e menu lateral sem "Sair da conta") ficam como decisão D1 do item, sem `limiteCanvas`.
- Limitações: a regressão completa (`npm run test:cov`) teve 9 falhas em `LoginPage`, `OverduePage`, `TeacherFormDialog` e `UnitSettingsPage`, de outros itens; passaram 75/75 isolados (autonomia 5). O `npm run e2e` completo não rodou (só o spec do item). A barra da gestão a 390 px não tem captura própria (a saída fica no menu do celular).
