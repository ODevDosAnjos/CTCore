# 455 — Componente base: Moldura do portal e shell das telas de acesso

Origem: issue #455 (Sprint 10.5, Fase 2, plano C2), `docs/auditoria/decisoes-canvas.md`, `docs/auditoria/plano-de-issues.md` (C2). Branch: `item/455-componente-base-moldura-portal-acesso`. Canvas: `PortalNav`, `PortalMTopo`, `PortalInicio`, `PortalMInicio`, `Login`, `LoginM` (e `PortalFamilia`, `PortalMTabs`, `PortalAgenda` só para conferir a moldura). Telas-piloto: Início do portal (R1) e Login (H1). Depende de #448 (feita); o botão e a ação de sair são da #434 (feita).

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Levar a moldura do portal (`PortalLayout`, `PortalTabs`, `PortalFooter`) e a moldura das telas de acesso (`AuthShell`) ao visual do canvas. Portal: barra escura de 64 px (56 px no celular) com conteúdo alinhado à coluna de 1120 px, marca com logo e nome em fonte de título maiúscula, abas com sublinhado de 3 px na cor de marca na ativa, tema, sino com contador, divisória e avatar com iniciais + nome + perfil (link para a conta); título de cada tela com rótulo acima; rodapé com endereço à esquerda e "feito com ctcore" à direita; abas de baixo do celular com sino em "Avisos" e ativa marcada só por ícone e rótulo mais escuros. Acesso: coluna escura da marca com ícone "ct", slogan e contato de ajuda; formulário de 420 px no desktop e, no celular, tudo no topo, com marca e sem botão de tema. A moldura é compartilhada: as demais telas do portal e de acesso mudam junto; os prints delas só mudam pela moldura (D7).

Fora do item: migrar o conteúdo das outras telas (cada issue de tela faz a sua); campo de senha com "Mostrar" embutido e ajuda em uma linha (#453 e #489); Escolha de organização; regras de abas por perfil; recriar a ação de sair (é da #434, só se reposiciona); mudar API, OpenAPI, MSW ou back-end.

## 2. Requisitos

- R1: a barra do portal tem fundo escuro, altura 64 px (desktop) e 56 px (< 768 px), e o conteúdo alinhado à coluna de 1120 px (D1); o `main` e o rodapé usam a mesma coluna de 1120 px, não os 768 px de hoje.
- R2: a marca mostra o logo da organização (ou o quadrado com a inicial, 32 px, raio 8, cor da organização) e o nome em fonte de título (`font-heading`), maiúscula, com espaçamento entre letras; é link para o Início.
- R3: no desktop a ordem da barra é: marca, abas, tema, sino com contador, divisória, avatar com iniciais + nome + perfil; o botão de tema aparece com contraste nos dois temas (corrige M135: ícone escuro sobre a barra escura).
- R4: a aba ativa tem sublinhado de 3 px na cor de marca da organização, texto branco e peso 600; as inativas têm texto cinza claro e nenhuma pílula ou fundo cheio (D2).
- R5: o avatar usa `Avatar` (iniciais, cor estável pelo nome), com o nome e o perfil ("Aluno", "Responsável", "Aluno · Inativo" quando inativo) ao lado, e leva a `/conta`; o texto "Nome · Perfil" e o link sublinhado "Minha conta" saem (B23).
- R6: o botão "Sair da conta" da #434 continua na barra do desktop, em ícone com nome acessível "Sair da conta", no visual da barra escura; no celular a ação continua alcançável por Minha conta (D3). O seletor de vínculo (`ChooseLinkTrigger`) segue na barra quando há mais de um vínculo.
- R7: no celular (< 768 px) a barra tem 56 px numa única linha: marca (logo e nome, que trunca), sino com contador e avatar só com iniciais; sem tema, sem nome e sem `flex-wrap` (D4).
- R8: o rótulo acima do título da tela (por exemplo "SÓ CONSULTA", "FINANCEIRO", a data no Início) é um componente de cabeçalho reutilizável da moldura do portal, usado pelo Início; as outras telas o adotam nas suas issues (D5).
- R9: o rodapé tem organização, unidade, endereço e WhatsApp à esquerda e "feito com ctcore" à direita no desktop; no celular só "feito com ctcore" fica visível (sem endereço), sem passar atrás das abas de baixo (D6).
- R10: as abas de baixo (celular) são Início, Agenda, Financeiro, Avisos, Eu, com ícone de sino em "Avisos" e contador; a aba ativa é marcada só pelo ícone e rótulo mais escuros, sem traço no topo (B27); Agenda e Avisos somem no portal reduzido como hoje (RN-POR-08).
- R11: as telas de acesso mostram no desktop (>= 768 px) a coluna escura da marca (ícone "ct" na cor de marca + "ctcore", slogan em fonte de título maiúscula, linha de apoio e contato de ajuda) e à direita o formulário de 420 px; slogan e linha de apoio vêm do canvas ("A academia em dia, sem planilha." e "Gestão, portal do aluno e cobrança no mesmo lugar.").
- R12: no celular as telas de acesso mostram a marca (ícone "ct" + "ctcore") no topo, o título e o formulário logo abaixo, tudo no topo da página (não centralizado na vertical), e a ajuda no fim; sem o botão de tema (D8).
- R13: funciona a partir de 360 px sem rolagem horizontal, com os estados do `main` do portal (carregando, erro e sem permissão; o vazio fica com cada tela), nos dois temas, axe sem violação; textos nos arquivos pt-BR.
- R14: o uso consta em `docs/design/README.md`; Início do portal e Login, 1440 e 390 px, conferem com o canvas e têm as referências regeradas; nenhuma outra tela muda de conteúdo.

## 3. Critérios de aceite

- CA1 (R1, R2, R3): com aluno logado a 1440 px, a barra tem 64 px, marca, abas, tema, sino, divisória e avatar com nome e perfil, nessa ordem, dentro da coluna de 1120 px; conteúdo e rodapé na mesma coluna.
- CA2 (R3): nos temas claro e escuro, o botão de tema é visível na barra (ícone com contraste de pelo menos 4,5:1 contra o fundo da barra) e alterna o tema.
- CA3 (R4): a aba da rota atual tem `aria-current="page"` e sublinhado de 3 px; as demais não têm fundo nem sublinhado.
- CA4 (R5): com a conta de responsável a barra mostra as iniciais, o nome e "Responsável"; clicar leva a `/conta`; o link sublinhado "Minha conta" não existe.
- CA5 (R6): o botão "Sair da conta" existe na barra a 1440 px e encerra a sessão como na #434 (o e2e `sair-da-conta.spec.ts` continua passando com o seletor ajustado); a 390 px a ação está em Minha conta.
- CA6 (R7): a 390 e a 360 px a barra tem 56 px e uma linha só, com marca, sino com contador e avatar; sem rolagem horizontal; nome de organização longo trunca.
- CA7 (R7): sem avisos não lidos o sino não mostra contador; com mais de 99 mostra "99+"; no portal reduzido o sino não aparece.
- CA8 (R8): o Início mostra o rótulo acima do título (a data) no estilo do canvas; um teste do componente cobre rótulo, título e subtítulo opcional.
- CA9 (R9): o rodapé a 1440 px tem o endereço à esquerda e "feito com ctcore" à direita; a 390 px o endereço não aparece e o texto final não fica sob as abas.
- CA10 (R10): a 390 px as abas de baixo têm as cinco opções com sino em "Avisos"; a ativa não tem traço no topo; no reduzido só Início, Financeiro e Eu.
- CA11 (R11): `/entrar` a 1440 px mostra a coluna escura com ícone "ct", slogan e contato, e o formulário de 420 px; as demais telas que usam `AuthShell` mostram a mesma coluna.
- CA12 (R12): `/entrar` a 390 px mostra marca, título e formulário no topo, sem botão de tema e sem centralização vertical, e o contato de ajuda no fim.
- CA13 (R13): axe sem violação no `PortalLayout` e no `AuthShell`, nos dois temas, a 360 e a 1440 px; carregando, erro e sem permissão do `main` do portal continuam funcionando.
- CA14 (R14): os casos `portal-aluno`, `portal-celular-topo` e `entrar` (1440 e 390 px) passam no `npm run visual:canvas` e as referências só deles, mais as que mudam só pela moldura (D7), foram regeradas; capturas em `.capturas/455/`.

## 4. Plano técnico

- Dados / API / OpenAPI / MSW / back-end: não mudam. Nome, perfil e vínculo vêm da sessão (`useSession`); organização, unidade, avisos não lidos e `reduced` vêm de `usePortalShell`. Segurança: só visual; a permissão continua no servidor, as abas só escondem o que não vale (RN-POR-08).
- Interface, a alterar (todos vistos no repositório):
  - `frontend/src/features/portal/PortalLayout.tsx`: barra de 64/56 px com coluna de 1120 px, marca, `PortalTabs variant="bar"`, tema, sino, divisória, `PortalAccount`; remove `flex-wrap`, o texto `portalShell.person` e o `AccountLink` textual; `main` e `PortalFooter` na coluna de 1120 px; corrige M135: o seletor `[&_button]:text-sidebar-foreground` do wrapper do tema não alcança o ícone do botão (conferir `frontend/src/theme/ThemeToggle.tsx` e passar `className` se for preciso, sem mudar a gestão).
  - `frontend/src/features/portal/PortalTabs.tsx`: variante `bar` com sublinhado de 3 px na cor `var(--org,var(--brand))` e sem pílula; variante `bottom` com `Bell` em "Avisos" (hoje `Megaphone`), ativa sem `shadow-[inset_0_2px_0...]` e com cor de texto mais escura; contador mantido.
  - `frontend/src/features/portal/PortalFooter.tsx`: duas colunas (`justify-between`) no desktop, só "feito com ctcore" no celular; `pb` para as abas de baixo mantido.
  - `frontend/src/features/portal/OrgMark.tsx`: confirmar 32 px, raio 8 e fonte de título (ajuste de classe).
  - `frontend/src/components/layout/AuthShell.tsx`: coluna escura com ícone "ct" (o `BrandMark` não serve: mostra a inicial da organização; criar o ícone no próprio arquivo), slogan com `font-heading`, linha de apoio, contato dentro da coluna a partir de 768 px; no celular marca no topo, conteúdo no topo (sem `justify-center`), `ThemeToggle` removido; `SupportContact` aparece uma vez em cada tamanho.
  - `frontend/src/features/portal/PortalHomePage.tsx`: usa `PortalHeading`.
  - `frontend/src/i18n/pt-BR.json`: `authShell.tagline` e `authShell.text` com os textos do canvas, `portalShell.account.*`, perfil "Aluno · Inativo" se faltar; remover `portalShell.person` se ficar sem uso.
  - `frontend/visual/casos.ts`: caso `entrar` ganha `canvasCelular: "LoginM"` (o canvas de celular existe e o caso hoje não o usa).
  - `docs/design/README.md` (linhas "Barra e abas do portal" e "Moldura das telas de acesso"), `frontend/src/dev/Vitrine.tsx` se mostrar a moldura.
- Interface, a criar em `frontend/src/features/portal/`: `PortalAccount.tsx` (avatar + nome + perfil, link para `/conta`; reaproveita `Avatar` e `initials`) e `PortalHeading.tsx` (rótulo acima, título e subtítulo opcional).
- Testes: ampliar `PortalLayout.test.tsx`, `PortalFooter.test.tsx`, `AuthShell.test.tsx`; criar `PortalAccount.test.tsx` e `PortalHeading.test.tsx`; ajustar `PortalHomePage.test.tsx` e os testes de acesso que dependam do botão de tema ou dos textos antigos; e2e: `frontend/e2e/sair-da-conta.spec.ts` (seletor do botão na barra do portal) e o e2e de axe da moldura (360 e 1440 px, dois temas). Cobertura mínima de 80% do front.
- Reuso: `Avatar`/`initials`, `ThemeToggle`, `LogoutButton` e `useLogout` (#434), `ChooseLinkTrigger`, `OrgMark`/`orgStyle`, `SupportContact`, tokens `bg-sidebar`, `text-sidebar-foreground`, `font-heading`.
- Riscos: (1) a moldura é compartilhada: os prints do portal e de acesso mudam; regerar só os da moldura (D7), nenhum conteúdo; (2) o seletor do botão de sair e o `AccountLink` foram testados na #434 e no e2e; (3) o botão de tema sai do `AuthShell` (muda comportamento, D8): conferir os testes que o procuram; (4) o contraste do ícone de tema depende de como `ThemeToggle` recebe a cor; (5) o seletor de vínculo (`ChooseLinkTrigger`) no celular pode não caber na linha única: se não couber, vai para Minha conta junto do sair.

## 5. Tarefas

- [x] T1: `PortalAccount` e `PortalHeading` (avatar + nome + perfil com link para `/conta`; rótulo, título e subtítulo) e textos em `pt-BR.json` — cobre CA4, CA8 — prova: `cd frontend && npx vitest run src/features/portal/PortalAccount.test.tsx src/features/portal/PortalHeading.test.tsx`
- [x] T2: `PortalLayout`, `PortalTabs`, `PortalFooter` e `OrgMark` (barra 64/56 px, coluna de 1120 px, abas com sublinhado, tema visível, sino, divisória, sair, rodapé em duas colunas, abas de baixo com sino); `PortalHomePage` usa `PortalHeading` — cobre CA1, CA2, CA3, CA5, CA6, CA7, CA9, CA10 — prova: `npx vitest run src/features/portal`
- [x] T3: `AuthShell` (coluna escura com ícone "ct", slogan e contato; celular com marca, tudo no topo, sem tema) e ajuste dos testes de acesso — cobre CA11, CA12 — prova: `npx vitest run src/components/layout/AuthShell.test.tsx src/features/auth`
- [x] T4: e2e e axe: `e2e/sair-da-conta.spec.ts` e o e2e da moldura (portal e acesso, 360 e 1440 px, dois temas) — cobre CA5, CA13 — prova: `npx playwright test e2e/sair-da-conta.spec.ts`
- [x] T5: documentação e comparação: `docs/design/README.md`, `Vitrine`, `casos.ts` (`entrar` com `canvasCelular: "LoginM"`), capturas em `.capturas/455/`, `npm run test:visual:docker -- --update-snapshots -g "<caso>"` para os casos da moldura e `npm run visual:canvas -- --exige` — cobre CA14 — prova: `npm run visual:canvas -- --exige`
- [x] T6: regressão do front: `npm run lint && npm run typecheck && npm run build && npm run test:cov` — não cobre critério novo; confere que nada quebrou (cobertura e lint de textos literais).

## 6. Decisões

- D1: coluna de 1120 px para barra, conteúdo e rodapé (canvas `PortalNav`, `PortalInicio`; hoje 768 px). Motivo: o canvas vence em layout (M1). Alternativa: manter 768 px, descartada por divergência medida.
- D2: aba ativa com sublinhado de 3 px na cor da organização (`var(--org,var(--brand))`), não o vermelho fixo do canvas. Motivo: o portal já usa a cor da organização (RF-POR-01) e o canvas usa a cor de marca padrão, que é o valor de `--brand`. Alternativa: cor fixa, descartada por quebrar a cor por organização.
- D3 (muda o comportamento): no celular o botão de sair sai da barra (o canvas só tem marca, sino e avatar) e a ação fica em "Minha conta" (`AccountFrame` já tem o `LogoutButton`); no desktop continua na barra, em ícone. Motivo: caber a 360 px em uma linha, como o canvas. Alternativa: manter o botão na barra do celular, descartada por quebrar a linha única.
- D4 (muda o comportamento): no celular o botão de tema deixa de estar na barra (o canvas não tem); fica na barra do desktop. A troca manual no celular passa a depender da tela Minha conta do portal (#498); até lá vale a preferência salva ou a do sistema. Suposição: se o dono não quiser perder a troca manual no celular até a #498, é só manter o botão na barra.
- D5: `PortalHeading` nasce aqui (rótulo acima do título) e só o Início o usa; as outras telas do portal adotam nas suas issues (#493 a #501). Motivo: a issue manda não migrar as outras telas.
- D6: no celular o rodapé só mostra "feito com ctcore" (canvas `PortalMInicio` sem endereço); o endereço da unidade continua em Minhas informações. Suposição: o endereço já aparece lá; se não, vira ajuste da #498.
- D7: como a moldura é compartilhada, as referências regeradas são só as dos casos com barra, rodapé ou `AuthShell`, e só pela moldura (como na #454); o conteúdo de cada tela que a #455 não nomeia continua igual; divergência de conteúdo que sobrar entra como `limiteCanvas` com motivo e a issue que a remove (regra 4 da autonomia).
- D8 (muda o comportamento): o botão de tema sai do `AuthShell` (o canvas de acesso não o tem, M2); o tema vem da preferência salva ou do sistema. Motivo: o canvas vence em layout. Alternativa: manter, descartada por divergência medida em todas as telas de acesso. "Mostrar" embutido e ajuda em uma linha ficam para #453 e #489.
- Suposição: a cor do avatar vem de `Avatar` (estável pelo nome), não das cores fixas do canvas, para não criar token; se o canvas exigir as cores exatas, é ajuste de token no mesmo PR.
- Suposição: o ícone "ct" das telas de acesso usa `bg-brand` e a coluna escura usa `bg-sidebar`; se o tom não bater na comparação, ajuste de token no mesmo PR.

## Construção

- T1 — arquivos: `frontend/src/features/portal/PortalAccount.tsx`, `PortalHeading.tsx` (+ testes), `i18n/pt-BR.json` (`portalShell.inactive`, `authShell.*`) — prova: `npx vitest run src/features/portal/PortalAccount.test.tsx src/features/portal/PortalHeading.test.tsx` → passou (dentro de `npx vitest run src/features/portal ...`: 370 testes, 0 falhas)
- T2 — arquivos: `PortalLayout.tsx`, `PortalTabs.tsx`, `PortalFooter.tsx`, `OrgMark.tsx`, `PortalHomePage.tsx`, `LogoutButton.tsx` (prop `iconOnly`), `ThemeToggle.tsx` (prop `className`, corrige M135), testes de layout e rodapé — prova: `npx vitest run src/features/portal` → passou
- T3 — arquivos: `components/layout/AuthShell.tsx` (+ teste) — prova: `npx vitest run src/components/layout/AuthShell.test.tsx src/features/auth` → passou
- T4 — arquivos: `e2e/sair-da-conta.spec.ts` (360 px passa por Minha conta; novo teste de axe e rolagem do portal e do acesso, 360 e 1440 px, dois temas) — prova: `npx playwright test e2e/sair-da-conta.spec.ts e2e/portal-barra.spec.ts e2e/login.spec.ts` → 21 passaram
- T5 — arquivos: `docs/design/README.md`, `frontend/visual/casos.ts` (`entrar` com `canvasCelular: "LoginM"`), 120 referências em `frontend/visual/referencias`, capturas em `.capturas/455/` — prova: `npm run test:visual:docker -- --update-snapshots` → 365 passaram; `npm run visual:canvas -- --exige` → 97 comparadas, 0 reprovadas. `Vitrine` não mostra a moldura: sem mudança.
- T6 — prova: `npm run lint && npm run typecheck && npm run build` → ok; `npm run test:cov` → 212 arquivos, 2033 testes, 0 falhas, cobertura 96,87% de linhas.
Regressão: back-end não mudou (não rodado). Front: acima. A primeira rodada de `test:cov` falhou em 2 guardas (`#455` em comentário casou com a regra de cor fixa; `max-w-[1120px]` casou com a guarda de largura fixa); corrigido com `max-w-280` e comentário sem o número; segunda rodada verde. `e2e` completo não rodado; rodados os 3 arquivos ligados à moldura.
Desvios:
- Minha conta no portal não tinha o botão de sair (só a barra simples `plain`); para a D3 valer, `AccountFrame` passou a mostrar `LogoutButton` no fim do conteúdo no celular (`md:hidden`), na moldura do portal.
- `ChooseLinkTrigger` fica só a partir de 768 px na barra (risco 5); no celular o seletor de vínculo não está na barra e, fora a tela de escolha no login, não há outro lugar hoje: avaliar na #498.
- Contato de ajuda do `AuthShell`: na coluna escura usa o título "Ajuda" (`authShell.help`) e no celular o bloco original ("Precisa de ajuda?"), para não duplicar a região no axe.
- Largura da coluna: `max-w-280` (= 1120 px), porque a guarda de a11y reprova `w-[Npx]` acima de 360.
- Rótulo do Início: data do dia em pt-BR do navegador (`toLocaleDateString`), sem fuso da unidade.
Referências visuais: 120 PNGs regeradas, só dos casos com moldura: conta-aluno, convite*, entrar, esqueci-senha*, login-codigo-reserva, login-duas-etapas, login-travado, portal-* (agenda, aluno, avisos, carteirinha*, celular-*, conta, familia, financeiro, informacoes, inicio-responsavel, pedidos, reduzido*, responsavel), redefinir-senha*, sem-acesso.
Não é do item: nada.

## Verificação

### Rodada 1 — OK — 2026-11-09, estado 6b53a8054a448133bfc4884f6048247e82de9d2b

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA3, CA6 a CA10 | PASSOU | testes de portal (PortalLayout, Tabs, Footer, Account, Heading) dentro de 410 testes verdes; capturas `.capturas/455/portal-aluno-*` abertas: barra 64/56 px, coluna de 1120 px, sublinhado, sino, avatar, rodapé e abas de baixo batem com o canvas |
| CA4, CA5 | PASSOU | PortalAccount.test e e2e `sair-da-conta.spec.ts` (21 passaram) |
| CA11, CA12 | PASSOU | AuthShell.test; capturas `entrar-1440` e `entrar-390` abertas: coluna escura, ícone ct, slogan, contato; celular no topo, sem tema |
| CA13 | PASSOU | e2e axe e rolagem, 360 e 1440 px, dois temas (passaram) |
| CA14 | PASSOU | `npm run visual:canvas -- --exige`: 97 comparadas, 0 reprovadas; capturas dos 3 casos existem (`portal-celular-topo` só a 1440, pois o caso não tem canvasCelular) |

Comandos: npm run lint e typecheck ok; vitest portal/layout/auth/account 42 arquivos, 410 testes ok; playwright 3 arquivos, 21 ok; npm run build ok; npm run test:cov 212 arquivos, 2033 testes, linhas 96,87%.
Achados:
- sugestão, código, frontend/visual/casos.ts caso portal-celular-topo — sem captura a 390 px em .capturas/455/ (o canvas PortalMTopo é de celular); considerar canvasCelular.
- sugestão, código, PortalHeading — título usa tamanhos fixos `text-[28px]`/`text-[38px]`; conferir se há token.

## Entrega

- Muda: moldura do portal (barra de 64/56 px na coluna de 1120 px, abas com sublinhado de 3 px, tema no desktop, sino com contador, `PortalAccount` com avatar, nome e perfil, rodapé em duas colunas, abas de baixo com sino em "Avisos") e moldura das telas de acesso (coluna escura a partir de 768 px; no celular, marca no topo e sem tema). Novos `PortalAccount` e `PortalHeading`; o Início usa `PortalHeading`. Sem mudança em API, OpenAPI, MSW ou back-end.
- Verificado: testes de portal, layout, acesso e conta (410 testes); e2e de sair da conta, axe e rolagem (21 testes); `npm run visual:canvas -- --exige` (97 comparadas, 0 reprovadas); regressão do front (lint, typecheck, build e `test:cov` com 96,87% de linhas).
- Decisões: D1 a D8 da especificação. Desvio: `AccountFrame` mostra `LogoutButton` no celular, para a D3 valer.
- Limitações: `ChooseLinkTrigger` só aparece na barra a partir de 768 px (risco 5); no celular não há outro lugar para ele hoje, a avaliar na #498. O e2e completo não rodou localmente (fica para o CI). Achados da verificação não aplicados: caso `portal-celular-topo` sem `canvasCelular`, e tamanhos fixos de título em `PortalHeading`.

### Correção da entrega
- CI do PR #536 falhou no `e2e` (smoke, comprovantes, portal-pedidos, recuperar-senha). Causas: (1) `ChooseLinkTrigger` sumia da barra no celular (risco 5) e os e2e a 360 px trocam de vínculo pelo botão "Trocar organização ou área"; (2) `smoke` procurava o botão de tema em `/entrar`, que perdeu o tema pela D8.
- Correção 1 — arquivo: `frontend/src/features/portal/PortalLayout.tsx` (o seletor de vínculo aparece abaixo do conteúdo só no celular e só com 2 vínculos ou mais; `empty:hidden`) — prova: `npx playwright test e2e/comprovantes.spec.ts e2e/portal-pedidos.spec.ts` → passaram (3 rodadas)
- Correção 2 — arquivo: `frontend/e2e/smoke.spec.ts` (entra como `familia@exemplo.com` e alterna o tema na barra do portal a 1280 px) — prova: passou
- `recuperar-senha`: passou 3 vezes local; não foi alterado, tratado como instável do CI (anotar no PR).
- Regressão: `npm run lint`, `typecheck` ok; vitest portal e conta 216 ok; `npm run e2e` 98 passaram; `npm run test:visual:docker` 365 passaram, sem referência alterada (nenhum caso tem 2 vínculos no celular).
- Desvio: D3/risco 5 resolvido com o seletor no fim do conteúdo no celular, em vez de Minha conta.

### Rodada 2 — OK — 2026-11-09, estado 50e4605391d0c24593b1d714a26dfb3142bef924

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA14 | PASSOU (mantido da rodada 1) | a mudança desde a rodada 1 é só o seletor de vínculo no fim do conteúdo no celular (`PortalLayout.tsx`, `md:hidden`, `empty:hidden`) e o `smoke.spec.ts`; não toca barra, abas, rodapé nem acesso |
| CA5, CA13 (reconferidos) | PASSOU | playwright: smoke, comprovantes, portal-pedidos, sair-da-conta, portal-barra, recuperar-senha, 26 passaram (axe e rolagem a 360 e 1440 px, dois temas) |

Comandos: `npm run lint` e `npm run typecheck` ok; `npx vitest run src/features/portal src/features/account src/components/layout --maxWorkers=2` ok; playwright dos 6 arquivos acima, 26 ok. Não rodados nesta rodada: `test:cov`, `test:visual:docker` e `e2e` completo (a mudança não altera referência visual; o `ci-gate` do PR é a prova, AGENTS.md autonomia 2).
Instáveis: `recuperar-senha` passou aqui; sem falha reproduzida.
Achados:
- sugestão, código, `frontend/visual/casos.ts` caso `portal-celular-topo` — sem `canvasCelular` (da rodada 1, mantida).
- sugestão, código, `PortalHeading` — tamanhos fixos de título (da rodada 1, mantida).
- sugestão, código, `PortalLayout.tsx` — o `ChooseLinkTrigger` fica duplicado no DOM (barra e fim do conteúdo), cada um escondido por breakpoint; funciona, só confirmar que o axe não acusa id repetido (o axe passou).
