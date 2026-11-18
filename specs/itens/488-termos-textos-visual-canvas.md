# 488 — Termos e Textos no visual do canvas

Origem: issue #488 (Sprint 10.5, Fase 3, plano G7), `docs/auditoria/plano-de-issues.md`, `docs/auditoria/decisoes-canvas.md` (R1 a R4); evidências M25, M26, B9. Branch: `item/488-termos-textos-visual-canvas`. Canvas: `ConfigTermos` (Coordenador) e `ConfigTextos` (Administrador), 1440 px, tema claro; não há canvas de celular nem de tema escuro para as duas. Dependências #453, #460, #461 já em `dev` (fechadas). Os itens #484 a #487 são o modelo de padrão de tela.

## 1. Objetivo

Deixar Configurações › Termos e Configurações › Textos iguais ao canvas. Termos: cabeçalho com subtítulo, abas com sublinhado, editor com barra, linha "Versão N publicada em ... por ...", "Salvar rascunho" e "Publicar versão N+1", cartão "Ao publicar a versão N+1" com a escolha de quem aceita, tabela de versões com aceites e nota sobre o uso de imagem. Textos: subtítulo, lista única à esquerda com selos e editor ao lado (Assunto, Texto, chips de campos, "Voltar ao texto da plataforma", Prévia, "Última alteração", "Salvar texto"). As regras (RF-MAT-05, RN-MAT-14, RF-COM-03) não mudam; a API de Termos ganha só a contagem de aceites por versão (D1).

Fora do escopo: editor de texto formatado e rascunho gravado (D2, D3); mudar quem edita (Coordenador publica e edita; Administrador só consulta); texto, campos ou catálogo dos nove modelos; a tela de Lembretes da unidade (só confere que o rótulo dos modelos continua certo); aceite do aluno no portal (#494).

## 2. Requisitos

- R1 (M25): Termos tem título "Termos" e subtítulo "Termo de matrícula e termo de uso de imagem · cada alteração vira uma nova versão"; abas com sublinhado "Termo de matrícula" e "Uso de imagem" (componente `Tabs`), no lugar dos botões em pílula.
- R2 (M25, D2): o editor é uma caixa de texto com a barra "B · I · Lista · Link" acima, visível e desabilitada com "Em breve"; o texto continua simples e o corpo enviado à API não muda.
- R3 (M25): abaixo do editor, a linha "Versão N publicada em dd/mm/aaaa por Nome" (sem versão publicada, a mensagem de hoje do texto padrão) e, para quem publica, os botões "Salvar rascunho" (visível e desabilitado com "Em breve", D3) e "Publicar versão N+1" (N+1 = versão atual + 1), ao lado um do outro.
- R4 (M25): cartão "Ao publicar a versão N+1" com a escolha de quem aceita em duas opções com título e descrição: "Só para novos alunos — Quem já aceitou continua na versão N" e "Todos aceitam de novo — No próximo acesso ao portal, antes de qualquer outra tela"; nenhuma vem marcada e "Publicar" segue desabilitado até haver escolha e mudança no texto, como hoje (D4).
- R5 (M25, D1): tabela "Versões" com Versão, Publicada (dd/mm/aaaa) e Aceites (quantidade de alunos que aceitaram aquela versão), da mais nova para a mais antiga; sem versão publicada, o estado vazio de hoje.
- R6 (M25): nota "O uso de imagem é uma caixa separada e opcional, que o aluno pode revogar no portal. Cada aceite guarda conta, versão, data, hora e IP." ao final da tela.
- R7 (M25): quem só consulta (Administrador) vê o texto atual e a tabela de versões, sem editor, rascunho, publicação nem escolha de quem aceita, como hoje.
- R8 (D1): `GET /organization/terms/{kind}` devolve `acceptances` (inteiro, 0 ou mais) em cada versão de `versions` e em `current`; a versão 0 (texto da plataforma) traz 0. A contagem é de alunos distintos da organização com aceite (`ACCEPTED`) daquele tipo e versão, sem vazar outra organização.
- R9 (M26): Textos tem o subtítulo "Nove modelos que a organização edita, iguais para todas as unidades · ficam fora: conta e segurança, recibo, cobrança gerada, reajuste, diferença e aviso de bloqueio".
- R10 (M26): lista única à esquerda, na ordem do canvas (Boas-vindas, três lembretes, cinco comunicados), com os rótulos do canvas ("Boas-vindas", "Lembrete: antes do vencimento", "Lembrete: no dia", "Lembrete: depois do vencimento", "Comunicado: Aula cancelada", "Comunicado: Troca de professor", "Comunicado: Alteração de horário", "Comunicado: Dia sem aula", "Comunicado: Aviso geral") e selo "Editado" ou "Texto da plataforma" em cada linha; o item aberto fica realçado; os três cartões por grupo e o botão "Editar" saem.
- R11 (M26): o editor ao lado tem o título do modelo, "Voltar ao texto da plataforma" (só com texto próprio, com a confirmação de hoje), Assunto, Texto, "Campos:" com os chips `{nome}`, `{valor}` etc. do modelo, cartão "Prévia" preenchido com dados de exemplo, "Última alteração em dd/mm/aaaa às HHhMM por Nome" (só com texto próprio) e "Salvar texto". Validações, mensagens, inserção do chip no campo ativo e os textos de erro de hoje continuam.
- R12 (M26): ao abrir a tela, o primeiro modelo da lista já vem aberto (o canvas nunca mostra o editor vazio); o Administrador vê o mesmo layout com campos e botões desabilitados e o aviso de somente leitura (RF-COM-03, D5).
- R13 (M26): abaixo de 1024 px a lista e o editor ficam empilhados (lista primeiro); a tela funciona a 360 px sem rolagem horizontal.
- R14 (B9): os botões de opção e as caixas de marcação das duas telas usam os componentes base (`ChoiceCards`/`RadioCard`, `Checkbox`, `Switch`), não controles nativos; botões desabilitados com a aparência do componente base nos dois temas.
- R15: quatro estados nas duas telas (carregando, vazio, erro com "Tentar de novo", sem permissão); axe sem violações nos dois temas; textos em `pt-BR.json`; permissão no servidor inalterada.
- R16: `npm run visual:canvas` aprova `configuracoes-termos` e `configuracoes-textos` (1440) no limite padrão de 30%, sem `limiteCanvas`.

## 3. Critérios de aceite

- CA1 (R1): dado o Coordenador, então vê título, subtítulo e duas abas com sublinhado; clicar em "Uso de imagem" mostra o termo de uso de imagem, e a aba marcada tem `aria-selected`.
- CA2 (R2): dado o Coordenador, então a barra "B · I · Lista · Link" está acima do editor desabilitada com "Em breve" e digitar no editor continua mudando o texto a publicar.
- CA3 (R3): dado versão atual 3, então a linha mostra "Versão 3 publicada em 01/09/2026 por <nome>", "Salvar rascunho" (desabilitado, "Em breve") e "Publicar versão 4" lado a lado; sem versão publicada, mostra a mensagem do texto padrão e "Publicar versão 1".
- CA4 (R4): dado texto alterado, quando escolhe "Só para novos alunos" ou "Todos aceitam de novo", então "Publicar versão 4" habilita e envia `reaccept` falso ou verdadeiro; sem escolha ou sem mudança fica desabilitado; 400 e 409 mostram as mensagens de hoje (409 recarrega).
- CA5 (R5, R8): dado 3 versões com aceites 187, 142 e 96, então a tabela mostra as linhas 3, 2 e 1 com data e aceites; sem versão, mostra o vazio; após publicar, a nova versão entra no topo com 0 aceites.
- CA6 (R6): então a nota do uso de imagem aparece nas duas abas.
- CA7 (R7): dado o Administrador, então vê o texto atual e a tabela e nenhum editor, botão de publicar, rascunho nem escolha.
- CA8 (R8): teste de integração: dois alunos aceitam a versão 2 do termo de matrícula, um aceita a 1 e um aluno de outra organização aceita a 2; `GET` devolve `acceptances` 2 e 1 só da organização consultada; sem publicação, `current.acceptances` é 0.
- CA9 (R9, R10): dado a lista de 9 modelos, então vê o subtítulo, a lista única com os 9 rótulos do canvas na ordem do canvas, selo "Editado" nos com texto próprio e "Texto da plataforma" nos demais, e nenhum botão "Editar".
- CA10 (R11): dado um modelo com texto próprio, então o editor mostra título, "Voltar ao texto da plataforma", Assunto, Texto, chips de campos, Prévia preenchida, "Última alteração em ... às ...h... por ..." e "Salvar texto"; clicar num chip insere `{campo}` no campo em foco; salvar com campo vazio, 400 e erro genérico mostram as mensagens de hoje; "Voltar ao texto da plataforma" pede confirmação e volta ao texto da plataforma; sem texto próprio, o botão e a "Última alteração" não aparecem.
- CA11 (R12): dado a lista carregada, então o primeiro modelo já está aberto no editor; clicar em outro troca o editor e realça o item; dado o Administrador, os campos, os chips e "Salvar texto" ficam desabilitados e o aviso de somente leitura aparece.
- CA12 (R13): dado 360 px, então lista e editor ficam um abaixo do outro, a lista primeiro, e a página não rola na horizontal; a partir de 1024 px ficam lado a lado.
- CA13 (R14): então nenhuma das duas telas tem `input[type=radio]` ou `input[type=checkbox]` fora dos componentes base, e "Publicar" desabilitado usa o estilo do botão base.
- CA14 (R15): dado carregando, vazio, erro e 403 nas duas telas, então cada estado aparece; axe sem violações nos dois temas nas duas telas.
- CA15 (R16): `configuracoes-termos` e `configuracoes-textos` passam no teste visual (1440 e 390, claro e escuro) contra a referência commitada e no `visual:canvas` no limite padrão, sem `limiteCanvas`.

## 4. Plano técnico

- Dados: não muda (a contagem sai de `term_acceptance`, V48, que já guarda tipo, versão, aluno e organização; sem migração).
- API: `GET /organization/terms/{kind}` ganha `acceptances` em `TermsVersion` (R8); o `POST .../versions` devolve a versão nova com `acceptances` 0. `docs/openapi.yaml` (`TermsVersion`: campo `acceptances`, integer, mínimo 0, obrigatório) e o MSW mudam junto. Permissões, erros e auditoria inalterados. Textos: não muda.
- Interface (`frontend/src/features/terms/`, `frontend/src/features/texts/`, vistos):
  - `TermsPage.tsx` e `useTerms.ts`: `TermsVersion` ganha `acceptances`; `Content` usa `PageHeader` com subtítulo e `Tabs`; `TermEditor` ganha a barra desabilitada (`ComingSoon`), a linha de versão, o rodapé "Salvar rascunho" (`ComingSoon`) e "Publicar versão N+1", o cartão de escolha com `ChoiceCards` e a nota do uso de imagem; `History` vira tabela em `Card` (Versão, Publicada, Aceites) sem o "Ler o texto" (D6).
  - `TextsPage.tsx`: `Content` vira grade lista + editor (`lg:grid-cols-[...]`), lista com `Badge` de selo, primeiro modelo aberto por padrão; `Editor` reorganizado em Assunto, Texto, chips, Prévia, "Última alteração" e "Salvar texto", sem trocar a lógica de `save`, `reset`, `insert` e `fill`.
  - `frontend/src/i18n/pt-BR.json`: `terms.*` e `texts.*` (novos textos; `texts.models.*` com os rótulos do canvas; `texts.groups.*` e `texts.edit` saem se ficarem sem uso; conferir `UnitRemindersTab.tsx` e `SettingsIndexPage.test.tsx`, que usam `texts.models`).
  - `frontend/src/mocks/handlers.ts`: `termsVersions` com `acceptances`; cenário do canvas (versões 3, 2 e 1 com 187, 142 e 96 aceites; Textos com 4 editados e 5 da plataforma, "Lembrete: antes do vencimento" com texto próprio); `frontend/visual/casos.ts` e `telas.visual.ts`: cenário por flag no `Caso` (como `usuariosCanvas`), `configuracoes-textos` com perfil Administrador como no canvas, sem `limiteCanvas`.
- Backend (`backend/src/main/java/br/com/ctcore/terms/Terms.java`, visto): `Version` ganha `acceptances`; `versions(...)` ganha subconsulta `select count(distinct student_id) from term_acceptance` por tipo e versão (já filtrada por RLS e por `organization_id`); `model(kind)` e o retorno do `publish` com 0; `TermsController.java` só se serializar o record exigir. `Students.java`, `PortalTerms.java` e `PortalInfo.java` usam `Terms.Version`: conferir o construtor ao compilar. Teste: `TermsIT.java` (existente) ganha o caso de contagem (CA8).
- Segurança: nenhuma rota nova; a contagem é agregada, sem dado de pessoa, e respeita a organização por filtro e RLS; sem dado real nos cenários (nomes fictícios).
- Arquivos de teste: `TermsPage.test.tsx`, `TextsPage.test.tsx`, `terms.msw.test.ts` (existentes), `visual/casos.test.ts`, `TermsIT.java`; e2e que usem "Publicar nova versão", "Editar" de Textos ou as pílulas (grep em `frontend/e2e`).
- Reuso: `Tabs`, `PageHeader`, `ComingSoon`, `ChoiceCards`, `Card`, `Badge`, `Banner`, `Input`/`Textarea`/`Field`, `ConfirmDialog`, `states`.
- Riscos: (1) a escolha de reaceite como `ChoiceCards` troca o `input` nativo: os testes que acham por "radio" precisam ser ajustados; (2) alterar o record `Version` quebra quem o constrói em outros pacotes (compilação acusa); (3) o canvas de Textos mostra "Salvar texto" para o Administrador, que a especificação deixa só consultando (D5); a captura de comparação usa o perfil do canvas e o aviso de somente leitura entra como divergência registrada; (4) o limite de 30% a 390 px depende do cenário do MSW; (5) o canvas só existe a 1440 px claro, a 390 px é conferida pelo sistema.

## 5. Tarefas

- [x] T1: back-end: `acceptances` em `Terms.Version`, consulta, `openapi.yaml` e MSW de Termos — cobre CA8 — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'` e `./backend/mvnw -f backend/pom.xml verify -Dit.test=TermsIT -Dtest=NoSuchTest -Dsurefire.failIfNoSpecifiedTests=false`.
- [x] T2: `TermsPage.tsx`, `useTerms.ts` e textos pt-BR de Termos (abas, barra, linha de versão, rodapé, escolha, tabela, nota); atualizar `TermsPage.test.tsx` — cobre CA1 a CA7, CA13, CA14 (Termos) — prova: `npx vitest run src/features/terms src/mocks/terms.msw.test.ts`.
- [x] T3: `TextsPage.tsx` e textos pt-BR de Textos (subtítulo, lista com selos, editor ao lado, primeiro aberto, somente leitura); ajustar `TextsPage.test.tsx`, `UnitRemindersTab.test.tsx` e `SettingsIndexPage.test.tsx` se os rótulos mudarem — cobre CA9 a CA14 (Textos) — prova: `npx vitest run src/features/texts src/features/units/UnitRemindersTab src/features/units/SettingsIndexPage`.
- [x] T4: MSW e `casos.ts` (cenário do canvas por flag, perfil Administrador em Textos, sem `limiteCanvas`); capturas em `.capturas/488/` (1440 e 390 px, pt-BR, sistema e canvas), `npm run visual:canvas -- --exige` e `npm run test:visual:docker -- -g "configuracoes-termos"` e `-g "configuracoes-textos"` sem `--update-snapshots` (regerar só as referências desta tela) — cobre CA15 — prova: esses comandos de dentro de `frontend/`.
- [x] T5: ajustar e2e afetados, lint, tipos e regressão da pasta — não cobre critério: fecha o item sem quebrar o que existe — prova: `npm run lint && npm run typecheck && npx vitest run src/features/terms src/features/texts` e os specs de e2e afetados.

## 6. Decisões

- D1 (muda o comportamento da API, só leitura): a coluna "Aceites" do canvas pede um dado que a API não tinha; pela R2 a API muda: `acceptances` por versão, contado de `term_acceptance`. Não contraria a especificação (RN-MAT-14, RN-LGP-01 só definem o registro do aceite). Alternativa descartada: deixar a coluna vazia ou "—", que contraria o canvas.
- D2: a barra "B · I · Lista · Link" entra desabilitada com "Em breve" (R3 das decisões), porque o termo é texto simples no servidor, no portal e no aceite; formatação mudaria o formato do corpo e a renderização do portal. Alternativa descartada: formatação em Markdown agora, que muda contrato e portal sem regra pedindo.
- D3: "Salvar rascunho" entra desabilitado com "Em breve": a especificação (RF-MAT-05) não prevê rascunho e não há tabela para ele. Alternativa descartada: rascunho só no navegador, que perderia o texto ao trocar de máquina e confundiria com versão.
- D4: a escolha de quem aceita continua obrigatória e sem opção pré-marcada (RN-MAT-14 pede que o Coordenador escolha); o canvas mostra a primeira opção marcada, que aqui é só aparência de exemplo. A regra vence no comportamento, o canvas no visual.
- D5: o Administrador continua só consultando Termos e Textos (RF-MAT-05, RF-COM-03), apesar de o canvas de Textos mostrar "Salvar texto" ativo para esse perfil: R4 das decisões, a regra vence e o layout do canvas vale com campos desabilitados e aviso. Se o dono quiser que o Administrador edite, é mudança de regra.
- D6: o "Ler o texto" de cada versão antiga sai da tabela, porque o canvas tem três colunas e nenhum acesso ao texto antigo; os textos continuam na API. Alternativa descartada: manter a coluna extra, que contraria o canvas (R1). Se o dono quiser consultar versões antigas, vira item novo.
- D7: rótulos dos modelos de Textos seguem o canvas (R1), inclusive "Alteração de horário" no lugar de "Mudança de horário" e "Boas-vindas" no lugar de "Boas-vindas ao aluno"; os mesmos rótulos valem na tela de Lembretes da unidade, que reutiliza `texts.models.*`.
- D8: a abertura do primeiro modelo por padrão (R12) é leitura do canvas, que nunca mostra o editor vazio; é só estado inicial, sem regra de negócio.
- Suposição: "Aceites" conta alunos distintos que aceitaram aquela versão do termo de matrícula, e concessões (`ACCEPTED`) do uso de imagem; revogações não entram. Se o dono quiser outra definição (ex.: aceites vigentes), muda só a subconsulta.
- Suposição: o canvas só traz 1440 px, tema claro; 390 px e tema escuro são conferidos pelo sistema, sem canvas de celular (nenhum `GM*` para as duas telas), como na #487.

## Construção

- T1 — arquivos: `backend/.../terms/Terms.java` (`Version.acceptances`, subconsulta por `term_acceptance` com `event = 'ACCEPTED'`, 0 no modelo), `docs/openapi.yaml` (`TermsVersion.acceptances`, obrigatório), `frontend/src/mocks/handlers.ts`, `TermsIT.java` (caso `acceptances`, CA8) — prova: `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'` → passou (4 testes do contrato); `verify -Dit.test=TermsIT` → `TermsIT` 8 de 8 e `PortalTermsIT` 6 de 6 passaram.
- T2 — arquivos: `frontend/src/features/terms/TermsPage.tsx`, `useTerms.ts`, `TermsPage.test.tsx`, `src/i18n/pt-BR.json` — prova: `npx vitest run src/features/terms src/mocks/terms.msw.test.ts` → 16 de 16.
- T3 — arquivos: `frontend/src/features/texts/TextsPage.tsx`, `TextsPage.test.tsx`, `pt-BR.json` (rótulos do canvas, `texts.sample` com os dados do canvas) — prova: `npx vitest run src/features/texts src/features/units` → passou.
- T4 — arquivos: `frontend/visual/casos.ts` (`termosCanvas`, `textosCanvas`, Textos com perfil Administrador e passo "Lembrete: antes do vencimento"), `visual/telas.visual.ts`; capturas em `.capturas/488/` (`termos|textos-1440|390-sistema.png`, `-1440-canvas.png`) — prova: `npm run visual:canvas -- --exige` → 145 comparadas, 0 reprovadas (termos 1,46%, textos 1,39%, limite 30%, sem `limiteCanvas`).
- T5 — prova: `npm run lint`, `typecheck`, `build` → 0; `npm run test:cov` → 264 arquivos, 2547 testes passaram, limites de cobertura atendidos.

Visual do CI: configuracoes-termos → passou
Visual do CI: configuracoes-textos → passou
Visual do CI: configuracoes-unidade-lembretes → passou (rótulos dos modelos mudaram, referência intacta)
Regressão: front completo (lint, typecheck, build, test:cov) verde; back-end só `TermsIT`, `PortalTermsIT` e contrato rodados, `verify` completo e `e2e` não rodaram nesta sessão (valem o CI do PR); nenhum e2e usa as telas de Termos e Textos do gestor.
Desvios:
- O canvas de Textos mostra 3 modelos "Editado" (Boas-vindas, antes e depois do vencimento), não 4 como o plano técnico dizia; o cenário segue o canvas.
- O canvas abre "Lembrete: antes do vencimento"; o sistema abre o primeiro da lista (R12) e o caso visual clica no modelo do canvas por passo.
- "Voltar ao texto da plataforma" aparece desabilitado para o Administrador quando há texto próprio (layout do canvas, D5).
- `bg-background` é vetado por `telasCanvas421/422`; Prévia, barra do editor e cabeçalho da tabela usam `bg-muted`.
- `texts.sample` passou a usar os dados de exemplo do canvas (Marina, Jiu-Jitsu, Academia Leão Tijuca, R$ 180,00, 10/10/2026).
Referências visuais: `frontend/visual/referencias/configuracoes-termos-{1440,390}-{claro,escuro}.png` e `configuracoes-textos-{1440,390}-{claro,escuro}.png`.
Divergências com o canvas (visual): a fonte dos títulos de cartão segue o `h2` global (fonte de título); a barra do editor é uma linha de botões desabilitados com um selo "Em breve" e não um texto simples; "Publicar versão N+1" fica cinza porque nenhuma opção vem marcada (D4); o shell do sistema (menu, cabeçalho) segue o do sistema.

## Verificação

### Rodada 1 — OK — 2026-11-18, estado c2ecd3ba9297d6c6d1ff7931223cd4e6ee098398

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA7 (Termos) | PASSOU | `TermsPage.test.tsx` (abas, barra desabilitada, linha da versão, escolha com `radio` do componente base, tabela com aceites, nota nas duas abas, Administrador sem editor); 71 arquivos / 473 testes verdes |
| CA8 | PASSOU | `verify -Dit.test=TermsIT` → 8 de 8; contrato `OpenApiContractTest,ContractRoutesTest` → 7 verdes |
| CA9 a CA12 (Textos) | PASSOU | `TextsPage.test.tsx`; lista única na ordem do canvas, primeiro aberto, Administrador desabilitado com aviso |
| CA13 | PASSOU | testes de `radio` do componente base; sem controle nativo fora dele |
| CA14 | PASSOU | testes de estados e axe (claro e escuro) nas duas telas |
| CA15 | PASSOU | `npm run test:visual:docker -- -g configuracoes-termos` → 4 passaram; `-g configuracoes-textos` → 4 passaram; `visual:canvas --exige` → 145 comparadas, 0 reprovadas; capturas em `.capturas/488/` abertas e comparadas com o canvas |

Comandos: `npx vitest run src/features/terms src/features/texts src/features/units src/mocks` → 473 passaram; `npm run lint` e `typecheck` → 0; mvnw contrato e `TermsIT` → verdes. `verify` completo, `test:cov` e `e2e` não rodados nesta verificação (valem o CI do PR; o item registra `test:cov` verde).
Achados:
- sugestão, código, `TextsPage.tsx` item da lista selecionado — usa `bg-acc` (rosado na captura), enquanto o canvas só destaca com negrito; ajustar se o dono notar.
- sugestão, código, `TextsPage.tsx` Prévia — mostra o rodapé "feito com ctcore" e o campo `{link_pagamento}` vazio, que o canvas não mostra; divergência pequena, dentro do limite.

## Entrega

**O que muda:** as telas Termos (Coordenador) e Textos (Administrador) seguem o canvas `ConfigTermos` e `ConfigTextos`: abas, barra do editor com botões desabilitados e selo "Em breve", linha da versão, escolha de modelo com `radio` do componente base, tabela de aceites, nota nas duas abas e Administrador sem editor. Back-end: `Version.acceptances` (contagem de aceites `ACCEPTED`, 0 no modelo), no contrato `TermsVersion.acceptances` (obrigatório). MSW e `texts.sample` usam os dados do canvas.

**Como foi verificado:** rodada 1 da Verificação, OK. `npm run visual:canvas -- --exige`: 145 comparadas, 0 reprovadas (termos 1,46%, textos 1,39%), sem `limiteCanvas`. Visual do CI: `configuracoes-termos`, `configuracoes-textos` e `configuracoes-unidade-lembretes` passaram. Front: lint, typecheck, build e `test:cov` verdes (2547 testes). Back-end: `TermsIT` 8 de 8, `PortalTermsIT` 6 de 6, contrato verde.

**Decisões:** os desvios do canvas estão na Construção (modelos "Editado" são 3, não 4; abre "Lembrete: antes do vencimento"; "Voltar ao texto da plataforma" desabilitado para o Administrador; `bg-muted` no lugar de `bg-background`, vetado pelo teste de canvas).

**Divergências visuais que ficam:** fonte dos títulos de cartão segue o `h2` global; barra do editor é linha de botões desabilitados; "Publicar versão N+1" cinza enquanto nenhuma opção vem marcada (D4); shell do sistema segue o do sistema.

**Achados não bloqueantes (sugestão):** item selecionado da lista usa `bg-acc` (o canvas só usa negrito); Prévia mostra "feito com ctcore" e `{link_pagamento}` vazio.

**Regressão:** a base (`origin/dev`, 752c8f0) não avançou desde a verificação, então a regressão da verificação vale. Nenhuma falha registrada. `verify` completo e `e2e` ficam para o CI do PR.
