# 754 — 626a · Marca sem cor nas telas e nos e-mails

Origem: issue #754 (parte a da #626; requisitos de partida em `specs/itens/626-retirar-cor-organizacao.md`). Branch: `item/754-marca-sem-cor-telas-emails`.

Tempos: especificar 2 · construir 8 · verificar 11 (regressão 10) (1 rodada) · entregar 1
Comparação com o canvas: 2

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

A marca da academia passa a ser, no que se vê, só nome e logo: Configurações, portal, carteirinha, recibos e e-mails usam a identidade do ctcore (RNF-22, RF-ORG-01, decisão 20 de `docs/auditoria/decisoes-canvas.md`).

Fora do escopo (#755): o campo `color` na API, `BrandColor`, banco, contrato, MSW, `contrastRatio.ts`, o campo nos tipos de leitura do front e nos dados de exemplo dos testes. Também fora: cores de faixa e graduação, o token `--brand`, logo nos e-mails e dados novos da organização (#627).

## 2. Requisitos

- R1: a aba Geral de Configurações › Organização não tem escolha de cor, amostras, prévia nem regra de contraste; o formulário não envia `color` (RF-ORG-01).
- R2: barra, abas, contadores de avisos, marca sem logo e carteirinha do portal usam só os tokens do ctcore, mesmo que a API ainda devolva cor (RNF-22).
- R3: o botão dos e-mails usa `#C8462C` (o valor de `--brand`), o layout não aceita cor de fora e o rodapé "feito com ctcore" continua (RNF-22).
- R4: o recibo em PDF não usa cor vinda da organização (RNF-22).
- R5: o logo da organização continua aparecendo onde aparece hoje (configurações, portal, carteirinha, termo e recibo).
- R6: sai o caso visual `configuracoes-organizacao-contraste`, `ConfigOrgContraste` vai para `semCaso` com o motivo e só mudam as referências de `configuracoes-organizacao` e `configuracoes-transferir-coordenacao`; o resto das telas segue o canvas.
- R7: a tela segue o padrão de rotas e telas (RNF-56), mantém os estados, funciona a partir de 360 px e passa no axe nos dois temas.

## 3. Critérios de aceite

- CA1 (R1): dado o Coordenador na aba Geral, quando a tela abre, então não há campo "Cor principal", amostras, selo de contraste nem prévia; ao salvar nome, titular ou regras, o corpo do PATCH não tem a chave `color`, e a janela de conflito (409) não lista cor.
- CA2 (R1, R7): dado o Administrador na aba Geral, quando a tela abre, então vê os dados em leitura, sem nada de cor; a 360 px e nos dois temas o axe não acha violação, para Coordenador (também com erro de campo à vista) e Administrador.
- CA3 (R2, R5): dado um portal em que a API devolve uma cor (por exemplo `#1d4ed8`), com e sem logo, quando o aluno abre o portal e a carteirinha, então o logo (ou as iniciais) e o nome aparecem; aba ativa, contadores e marca usam `brand`; e a página não tem `--org` nem estilo com a cor recebida.
- CA4 (R3): dado um e-mail com link, quando o layout é montado, então o botão tem `background:#C8462C` e o rodapé traz "feito com ctcore"; sem link não há botão, o rodapé continua e `EmailLayout.html` não tem parâmetro de cor.
- CA5 (R4, R5): dado um recibo de unidade com logo, quando o PDF é gerado, então sai como hoje, com o logo e sem cor da organização (`ReceiptPdf` não muda).
- CA6 (R6): dado os casos visuais, quando `visual/casos.test.ts` roda, então passa sem o caso do contraste e com `ConfigOrgContraste` em `semCaso`; as 4 referências do caso removido são apagadas, as únicas alteradas são as de `configuracoes-organizacao` e `configuracoes-transferir-coordenacao`, e a comparação com o canvas (`ConfigAcademia`, `TransferirCoordenacao`; capturas em `.capturas/754/`, 1440 e 390 px, pt-BR) não mostra diferença nova além da falta da cor.
- CA7 (R7): dado o e2e da organização, quando o Coordenador abre a tela dentro da moldura, muda o nome, salva e volta a ela, então vê o nome salvo; o Administrador só lê; `shell`, `noInternalAnchors` e `routePattern` passam.

## 4. Plano técnico

- Dados: não muda (#755).
- API: não muda (rota, contrato e MSW). `PATCH /organization` sem `color` já é aceito pelo servidor (`OrganizationProfile.update` e o handler do MSW) e grava nulo (D1).
- Back-end: `backend/src/main/java/br/com/ctcore/mail/EmailLayout.java`: fica só `html(text, link, button)`, com o fundo do botão fixo em `#C8462C` (constante `BRAND_COLOR` no lugar de `DEFAULT_COLOR`); saem a sobrecarga com `color`, a validação por regex e a menção no Javadoc. Os dois chamadores em `EmailService` já usam três argumentos. `ReceiptPdf` não muda. Em `EmailLayoutTest`, `brandColorAndFooter` passa a conferir `#C8462C` e o rodapé, e `unsafeColorIsIgnored` sai (não há mais cor de fora; mantém a asserção do texto escapado em outro teste se ela se perder).
- Interface (em `frontend/src/`):
  - Apagar `features/organization/ColorField.tsx`, `ColorField.test.tsx` e `brandSwatches.ts`.
  - `features/organization/BrandCard.tsx`: saem as props `color`, `onColor`, `colorError`, o `<ColorField>`, o `style`/`--amostra`; o quadrado sem logo fica sempre `bg-brand`; atualizar o comentário.
  - `features/organization/OrganizationSettingsPage.tsx` (`OrganizationForm`): saem o estado `color`, `colorBad`, a parte de `dirty`, `discard`, `reload`, `differences` e do corpo de `save`, as props de cor do `BrandCard` e o import de `contrastRatio`.
  - `features/organization/useOrganization.ts`: sai `color` só de `OrganizationUpdate` (o de `OrganizationView` fica até a #755).
  - `features/portal/OrgMark.tsx`: saem `orgColor`, `orgStyle` e o import de `contrastRatio`; a marca usa `bg-brand`. `PortalShell.tsx`: sai o `style={orgStyle(...)}`; contador usa `bg-brand`. `PortalTabs.tsx`: contador `bg-brand` e sublinhado `aria-[current=page]:border-brand`. `PortalMemberCard.tsx` já usa `bg-brand`: não muda.
  - `i18n/pt-BR.json`, em `organization`: saem `color`, `colorHex`, `colorSwatches`, `colorSwatch`, `colorDefault`, `colorFormat`, `previewLabel`, `previewPay`, `previewPayShort`, `contrastBadge`, `contrastAlert`, `previewIllegible` e `suggestion`.
- Visual: em `frontend/visual/casos.ts`, remover o caso `configuracoes-organizacao-contraste` e acrescentar em `semCaso` a chave com o motivo ("tela do canvas retirada: não há cor por organização, decisão 20 (#626)") com `ConfigOrgContraste`; ajustar o comentário de `organizacaoCanvas` se citar a cor como algo visível. `telas.visual.ts` não muda (o `color` do cenário é dado de exemplo, #755). Apagar `visual/referencias/configuracoes-organizacao-contraste-*.png`. A cor padrão do MSW é nula, então as referências do portal não mudam; se alguma mudar, investigar antes de regerar.
- Documentação: `docs/design/README.md`, linha de "Barra e abas do portal": o sublinhado das abas é na cor `brand`.
- Testes do front: `OrganizationSettingsPage.test.tsx` (tirar os passos e o caso de cor; o axe usa nome vazio como erro à vista; o corpo do PATCH sem `color`), `BrandCard.test.tsx` (sem as props), `OrgMark.test.tsx` (saem os casos de `orgColor`/`orgStyle`; ficam logo/iniciais e `PortalTabs`), `PortalShell.test.tsx` (classe `border-brand`; no caso que recebe cor, conferir que não há `--org` nem a cor no HTML). `frontend/e2e/organizacao.spec.ts`: sai o trecho de cor; o resto fica.
- Reuso: token `brand` (`bg-brand`, `border-brand`, em `index.css`); nada novo.
- Segurança: não muda (sem rota nova; permissões e isolamento são os do servidor).
- Arquivos (contáveis, 18): os 2 do back-end; no front, os 3 apagados, `BrandCard.tsx` e teste, `OrganizationSettingsPage.tsx` e teste, `useOrganization.ts`, `OrgMark.tsx` e teste, `PortalShell.tsx` e teste, `PortalTabs.tsx`, `pt-BR.json`, `e2e/organizacao.spec.ts`, `visual/casos.ts`.
- Riscos: o `visual:canvas` de `ConfigAcademia` pode subir porque o cartão Marca encurta e o canvas ainda desenha a cor; se passar de 15%, vale a regra 4 de "Autonomia" do `AGENTS.md`. Os tipos de leitura ainda têm `color`: não remover aqui, para não puxar MSW e dados de teste da #755.

## 5. Tarefas

<!-- Só as tarefas usam caixa de marcar neste arquivo: é por elas que o `maestro` sabe o que falta construir. -->

- [x] T1: e-mail com cor fixa do ctcore, sem parâmetro de cor, com o teste — cobre CA4, CA5 — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='EmailLayoutTest,ReceiptPdfTest'`
- [x] T2: retirar a cor da aba Geral (componentes, formulário, tipo de envio, textos) e ajustar os testes — cobre CA1, CA2, CA5 — prova: em `frontend/`, `npx vitest run OrganizationSettingsPage BrandCard TransferCoordinationDialog`
- [x] T3: portal só com `brand` (OrgMark, PortalShell, PortalTabs), com os testes, e a linha de `docs/design/README.md` — cobre CA3 — prova: em `frontend/`, `npx vitest run OrgMark PortalShell PortalTabs PortalCardPage`
- [x] T4: e2e da organização sem a cor, e conferência por busca de que, em `frontend/src` fora de `mocks/`, testes e `contrastRatio.ts`, nada usa a cor da organização — cobre CA7 — prova: em `frontend/`, `npm run e2e -- organizacao` e `npx vitest run shell noInternalAnchors routePattern`
- [x] T5: caso visual removido e `semCaso`; capturas e comparação com o canvas em `.capturas/754/` (`configuracoes-organizacao` e `configuracoes-transferir-coordenacao`: `<caso>-1440-sistema.png`, `<caso>-390-sistema.png` e `<caso>-1440-canvas.png`; os canvas só existem em 1440 e claro), registrando `Comparação com o canvas: <min>`; apagar as referências do contraste e regerar só as dos dois casos com `npm run test:visual:docker -- --update-snapshots -g " configuracoes-(organizacao|transferir-coordenacao) "` — cobre CA6 — prova: em `frontend/`, `npx vitest run visual/casos.test.ts`, `npm run visual:canvas` e a lista de referências no `git status`

## 6. Decisões

- D1 (muda o comportamento): até a #755, a API ainda tem o campo e o front deixa de enviá-lo; o primeiro salvar da organização grava a cor como nula e a auditoria registra essa mudança uma vez. Sem efeito na tela, porque nada mais lê a cor, e a #755 apaga a coluna. Alternativa: reenviar o valor lido para preservá-lo, descartada porque a issue pede que o front deixe de enviar `color`.
- D2: `color` continua nos tipos de leitura (`OrganizationView`, `usePortalShell`, `usePortalCard`), no MSW, em `contrastRatio.ts` (o MSW o usa; `suggestColor` fica sem uso na tela até lá) e nos dados de exemplo dos testes, como a divisão da #626 manda para a parte b.
- D3: a cor do e-mail é uma constante no `EmailLayout`, igual a `--brand`; e-mail não lê variável CSS. Alternativa: configuração por ambiente, descartada por ser valor que não muda.
- D4: o item não cria teste novo para o PDF: `ReceiptPdf` não usa cor e não é alterado; o `ReceiptPdfTest` existente é a prova.
- Suposição: `ConfigAcademia` e o fundo de `TransferirCoordenacao` ainda desenham a cor; a divergência vem da decisão 20 e não é corrigida para o canvas.

## Construção

- T1 — arquivos: `mail/EmailLayout.java`, `EmailLayoutTest.java` — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='EmailLayoutTest,ReceiptPdfTest'` → 6 testes, 0 falhas (2 e 4); `ReceiptPdf` não mudou.
- T2 — arquivos: apagados `ColorField.tsx`, `ColorField.test.tsx`, `brandSwatches.ts`; alterados `BrandCard.tsx` e teste, `OrganizationSettingsPage.tsx` e teste, `useOrganization.ts`, `pt-BR.json` (13 chaves removidas) — prova: `npx vitest run OrganizationSettingsPage BrandCard TransferCoordinationDialog` → 3 arquivos, 59 testes aprovados. O axe do Administrador passou a rodar a 360 px nos dois temas (CA2).
- T3 — arquivos: `OrgMark.tsx` e teste, `PortalShell.tsx` e teste, `PortalTabs.tsx`, `PortalCardPage.test.tsx`, `docs/design/README.md` — prova: `npx vitest run OrgMark PortalShell PortalTabs PortalCardPage` → 3 arquivos (os testes de `PortalTabs` ficam em `OrgMark.test.tsx`), 41 aprovados; depois da asserção da carteirinha, `npx vitest run PortalCardPage` → 12 aprovados.
- T4 — arquivos: `e2e/organizacao.spec.ts` — prova: `npm run e2e -- organizacao` → 5 aprovados (3 de `organizacao.spec.ts` e 2 de `escolha-organizacao.spec.ts`, que o filtro também pega); `npx vitest run shell noInternalAnchors routePattern` → 7 arquivos, 315 aprovados. Busca em `src` fora de `mocks/`, testes e `contrastRatio.ts`: da cor da organização só restam os três tipos de leitura (`useOrganization.ts`, `usePortalShell.ts`, `usePortalCard.ts`, D2) e o dado de exemplo de `src/test/portalShell.ts`; o resto é cor de faixa e graduação.
- T5 — arquivos: `visual/casos.ts`, referências — prova: `npx vitest run visual/casos.test.ts` → 168 aprovados; `npm run test:visual:docker -- --update-snapshots -g " configuracoes-(organizacao|transferir-coordenacao) "` → 8 aprovados; `npm run visual:canvas` → 164 comparadas, 0 reprovadas. `configuracoes-organizacao` 1440: 4,65% → 3,75%; `configuracoes-transferir-coordenacao` 1440: 9,72% → 9,58% (limite 15%, sem `limiteCanvas`). Capturas em `.capturas/754/`: `<caso>-1440-sistema.png`, `<caso>-390-sistema.png` e `<caso>-1440-canvas.png` dos dois casos (6 imagens), abertas e conferidas: a divergência nova é só a falta de "Cor principal", amostras, prévia e selo (o cartão Marca encurta); as demais já existiam antes do item.

Testes do item: `npm run lint` e `npm run typecheck` → sem erros; `npx vitest run OrganizationSettingsPage BrandCard TransferCoordinationDialog OrgMark PortalShell PortalCardPage shell noInternalAnchors routePattern visual/casos.test.ts` → 13 arquivos, 557 aprovados; back-end e e2e como em T1 e T4. O item não cria nem altera IT.
Regressão: não roda nesta fase (AGENTS.md, "Quem roda o quê"). A conferência do visual sem `--update-snapshots` é do CI.
Desvios: `PortalCardPage.test.tsx`, fora da lista do plano, ganhou uma asserção para provar a parte da carteirinha do CA3 (19 arquivos contáveis, não 18). O comentário de `organizacaoCanvas` em `casos.ts` ficou como estava: cita a cor só como dado de exemplo (#755).
Referências visuais: alteradas `configuracoes-organizacao-{1440,390}-{claro,escuro}.png` e `configuracoes-transferir-coordenacao-{1440-claro,1440-escuro,390-claro}.png` (a 390 escuro saiu idêntica); apagadas as 4 `configuracoes-organizacao-contraste-*.png`. Nenhuma referência do portal foi regerada.
Não é do item: `specs/backlog.md` e `specs/itens/626-retirar-cor-organizacao.md` já estavam alterados ao começar (divisão da #626, fase de especificação); não foram tocados.


## Verificação

### Rodada 1 — OK — 27/11/2026, estado 8c2d343adf876cfa5d86977106a19a8a27e95fc4

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `OrganizationSettingsPage.test.tsx` (em `npm test`): sem "Cor principal", amostras, selo nem prévia; corpo do PATCH conferido por `toEqual`, sem `color`. No diff, a linha de cor saiu de `differences` (janela de 409); o estado `color`, a regra de contraste e a chave no envio saíram do formulário |
| CA2 | PASSOU | mesmo arquivo: Administrador com campos desabilitados e nenhum texto "cor"; axe a 360 px nos dois temas para Coordenador (também com o erro do nome à vista) e Administrador |
| CA3 | PASSOU | `PortalShell.test.tsx` (API devolve `#1d4ed8`, com e sem logo: sem `--org` nem a cor no HTML; aba `border-brand`, contadores `bg-brand`, iniciais `bg-brand`), `PortalCardPage.test.tsx` (carteirinha com cor: nada dela na página, iniciais), `OrgMark.test.tsx`; `PortalMemberCard.tsx` já usa `bg-brand`. Busca em `frontend/src`: da cor da organização restam os tipos de leitura (D2) e o MSW (#755) |
| CA4 | PASSOU | `EmailLayoutTest` 2 testes, 0 falhas: `background:#C8462C` e "feito com ctcore"; sem link, sem botão e com rodapé. `EmailLayout.html(text, link, button)` é a única assinatura; os dois chamadores de `EmailService` usam três argumentos |
| CA5 | PASSOU | `ReceiptPdfTest` 4 testes, 0 falhas; `ReceiptPdf.java` fora do diff e sem uso de cor da organização |
| CA6 | PASSOU | `npx vitest run visual/casos.test.ts shell noInternalAnchors routePattern --maxWorkers=2` → 8 arquivos, 483 aprovados; `ConfigOrgContraste` em `semCaso` com o motivo; no `--stat`, 4 referências do contraste apagadas e alteradas só as de `configuracoes-organizacao` (4) e `configuracoes-transferir-coordenacao` (3). As 6 capturas de `.capturas/754/` e a referência anterior de `configuracoes-organizacao` foram abertas: a única diferença nova é a falta de cor, amostras, prévia e selo; as demais diferenças para o canvas já existiam |
| CA7 | PASSOU | `npm run e2e -- organizacao` → 5 aprovados (inclui Coordenador salva o nome e volta, Administrador só lê, abas dentro da moldura); `shell`, `noInternalAnchors` e `routePattern` aprovados |

Comandos: `./backend/mvnw -f backend/pom.xml test` → 180 testes, 0 falhas, 0 erros; em `frontend/`, `npm run lint`, `npm run typecheck`, `npm run build` → saída 0; `npm test` → 276 arquivos, 3060 aprovados (inclui os testes do item); `npm run e2e -- organizacao` → 5 aprovados. O item não cria nem altera IT. Visual: no CI do PR.
Instáveis: nenhum.
Especificação x issue: sem requisito perdido nem contrariado (a API, o banco, o contrato e o MSW são da #755).
Achados:
- sugestão, código, `frontend/src/features/organization/BrandCard.tsx` (comentário do componente) — ainda cita "a nota da marca", que o cartão não mostra (já não mostrava na base).

## Entrega

Retira a cor da organização das telas e dos e-mails: a aba Geral de Configurações › Organização não tem mais escolha de cor, amostras, prévia nem regra de contraste, e o formulário não envia `color`. Barra, abas, contadores e marca do portal e da carteirinha usam só o token `brand`; o botão dos e-mails é `#C8462C` fixo e `EmailLayout.html` não aceita cor. O caso visual do contraste sai (`semCaso`), e as referências de `configuracoes-organizacao` e `configuracoes-transferir-coordenacao` são regeradas.

Verificado na rodada 1 (OK, estado `8c2d343a`): critérios CA1 a CA7 passaram; `EmailLayoutTest` e `ReceiptPdfTest` verdes; `npm test` 3060 aprovados; e2e da organização 5 aprovados; `visual:canvas` sem reprovação (1440: `configuracoes-organizacao` 4,65% → 3,75%; `configuracoes-transferir-coordenacao` 9,72% → 9,58%, abaixo do limite de 15%).

Decisões: `color` continua nos tipos de leitura, no MSW e em `contrastRatio.ts` até a #755 (D2). A cor do e-mail é constante no código (D3). Na primeira gravação, a cor da organização vai para nulo, registrado na auditoria (D1).

Limitações: a comparação com o canvas de `ConfigAcademia` e `TransferirCoordenacao` mostra a falta da cor (decisão 20), que a #755 não muda. A conferência do visual (`Visual do CI`) é do job `visual` do PR. O arquivo `specs/itens/626-retirar-cor-organizacao.md` (requisitos de partida da divisão da #626) vai neste commit junto com o item.
