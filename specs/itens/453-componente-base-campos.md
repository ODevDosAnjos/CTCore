# 453 — Componente base: Campos: data, arquivo, interruptor, caixa, cartão de escolha e código em 6 caixas

Origem: issue #453 (Sprint 10.5, Fase 2, plano C4), `docs/auditoria/decisoes-canvas.md`, `docs/auditoria/plano-de-issues.md` (C4). Branch: `item/453-componente-base-campos`. Canvas das telas-piloto: `ComunicadoNovo.dc.html` (Novo comunicado) e `LoginDuasEtapas.dc.html` (Verificação em duas etapas).

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Fechar a família de campos do canvas: **data** (aspecto do canvas, ícone de calendário legível nos dois temas), **arquivo** (botão "Escolher arquivo" e nome do arquivo, com texto do pt-BR.json), **interruptor**, **caixa** e **cartão de escolha** (os três já existem como `Switch`, `Checkbox` e `RadioCard`; ganham o que falta do canvas) e **código em 6 caixas**. Aplicar nas telas-piloto Novo comunicado (imagem, data de fixação, data de envio, canais, "quando enviar") e Verificação em duas etapas do login (código em 6 caixas). As demais telas trocam nas próprias issues (#469, #482, #483, #488 a #491, #494, #498 etc.).

Fora do escopo: migrar outras telas; mudar API, OpenAPI ou backend; o campo de código de reserva (10 caracteres, continua texto simples); o seletor de unidade e as janelas citadas na Evidência (issues de tela).

## 2. Requisitos

- R1: existe `DateField` em `frontend/src/components/ui/` sobre o `<input type="date">` nativo (e `datetime-local` pela prop `type`), com o aspecto de campo do canvas; o texto "dd/mm/aaaa" vem do navegador em pt-BR e do idioma do navegador nos demais (Passo C); o ícone de calendário é legível no tema claro e no escuro.
- R2: existe `FileField` com botão "Escolher arquivo" e texto "Nenhum arquivo escolhido" ou o nome do arquivo, ambos de `pt-BR.json` (não dependem do idioma do navegador); o `<input type="file">` real continua no DOM e acessível (rótulo, `accept`, foco, erro).
- R3: `Switch` aceita `description` opcional, visível; a API atual (`checked`, `onCheckedChange`, `label`, `disabled`) continua valendo.
- R4: `Checkbox` e `RadioCard` seguem o aspecto do canvas só por tokens; `RadioCard` continua com `label` e `description`.
- R5: existe `CodeInput` com 6 caixas visuais para o código TOTP: digitar avança, colar preenche as 6, Backspace apaga, só dígitos; por baixo há **um** campo real com `autocomplete="one-time-code"` e `inputMode="numeric"` (D2).
- R6: Novo comunicado usa `FileField` na imagem, `DateField` na fixação e no envio agendado, `Checkbox` nos canais e `RadioCard` em "quando enviar"; nenhuma regra, requisição ou texto muda.
- R7: o passo do código do login (`TwoFactorStep`) mostra o `CodeInput` no modo TOTP; o modo "código de reserva" continua como campo de texto. Como `CodeField` é compartilhado, as demais telas de código (ativar duas etapas, reautenticação, trocar e-mail) ganham as 6 caixas sem outra mudança (D4).
- R8: textos só em `pt-BR.json`; cores, fontes e tamanhos só por tokens.
- R9: axe passa nos dois temas para cada componente; funciona a partir de 360 px (as 6 caixas cabem em 360 px sem rolagem lateral).
- R10: componentes e uso constam em `docs/design/README.md` (tabela Componentes) e na Vitrine.
- R11: referências visuais de `comunicados-novo` e `login-duas-etapas` (e das telas que usam `CodeField`, se mudarem) regeradas e comparadas com o canvas; nenhuma outra tela muda de aparência.

## 3. Critérios de aceite

- CA1 (R1): dado `DateField` com valor `2026-11-09`, então o campo nativo recebe e devolve o valor ISO; `onChange` entrega a string; `min` e `aria-invalid` passam adiante; com `type="datetime-local"` o valor tem o formato do campo nativo.
- CA2 (R1): dado o tema escuro, então o campo declara o esquema de cor escuro (ícone de calendário legível); conferido na captura do tema escuro.
- CA3 (R2): dado `FileField` sem arquivo, então aparecem "Escolher arquivo" e "Nenhum arquivo escolhido"; ao escolher um arquivo, aparece o nome dele; clicar no botão abre o seletor (clique no input real).
- CA4 (R2): dado `accept` e `aria-describedby`, então chegam ao `<input type="file">`; o rótulo da `Field` o nomeia.
- CA5 (R3): dado `Switch` com `description`, então o texto aparece e liga ao controle por `aria-describedby`; clique alterna; `disabled` bloqueia.
- CA6 (R4): dado `RadioCard` marcado, então tem o destaque por token; setas trocam a escolha dentro do mesmo `name`.
- CA7 (R5): dado `CodeInput` vazio, então há 6 caixas visuais; digitar "482" preenche 3; colar "482 913" entrega "482913"; letras são ignoradas; com 6 dígitos chama `onComplete`, se informado; Backspace apaga o último dígito.
- CA8 (R5, R7): dado o login com duas etapas, então o leitor de tela encontra o campo pelo rótulo "Código do app autenticador" (o de hoje) e os testes atuais de `TwoFactorLogin`, `TwoFactorDialogs` e `ReauthDialog` continuam passando.
- CA9 (R6): dada a página Novo comunicado com MSW, então imagem, datas, canais e "quando enviar" funcionam como antes (testes atuais passam) e a imagem mostra "Escolher arquivo".
- CA10 (R9): axe sem violação nos dois temas para `DateField`, `FileField`, `Switch` com descrição, `RadioCard`, `Checkbox` e `CodeInput`; a 360 px o `CodeInput` não causa rolagem lateral (caixas com `min-w-0` e `flex-1`).
- CA11 (R8): `npm run lint` sem texto literal; `tokens.test.ts` passa.
- CA12 (R10): `design-readme.test.ts` passa com os componentes na tabela.
- CA13 (R11): `npm run test:visual:docker` passa com referências regeradas só das telas afetadas; `npm run visual:canvas` sem nova reprovação em `comunicados-novo` e `login-duas-etapas`.

## 4. Plano técnico

- Dados / API / Segurança: não mudam (puramente visual; nenhuma rota nova). O código TOTP segue enviado como hoje e não vai para log.
- Interface:
  - `DateField({ type = "date", ...props })`: `Input` com `[color-scheme:light]` no claro e `dark:[color-scheme:dark]` no escuro (classe dentro do componente base), para o ícone nativo acompanhar o tema (B7); sem biblioteca de data (a data nativa dá o "dd/mm/aaaa" pelo idioma do navegador, Passo C).
  - `FileField({ id, accept, onFile, fileName?, ...aria })`: `<input type="file" className="sr-only" tabIndex={-1}>` + `Button` secundário "Escolher arquivo" que chama `click()` no input + texto de estado com o nome; chaves `fields.file.choose` e `fields.file.none`. O `htmlFor` da `Field` continua apontando ao input real.
  - `Switch`: nova prop `description`, ligada por `aria-describedby`; sem ela o botão fica como hoje (usos existentes não mudam).
  - `Checkbox` e `RadioCard`: só ajuste de tokens se a comparação com o canvas pedir; API igual.
  - `CodeInput({ id, value, onChange, onComplete?, length = 6, ...aria })`: `<div>` relativo com 6 `<span aria-hidden>` (cada um mostra um dígito; a caixa da vez ganha anel) e **um `<input>` real** por cima, transparente, com `inputMode="numeric"`, `autoComplete="one-time-code"`, `maxLength={length}` e filtro de não dígitos. `CodeField` com `kind="totp"` renderiza `CodeInput` dentro da `Field` atual (rótulo e erro continuam).
- Arquivos:
  - `frontend/src/components/ui/date-field.tsx`, `file-field.tsx`, `code-input.tsx` e `*.test.tsx` de cada um (a criar).
  - `frontend/src/components/ui/switch.tsx` (existe; `description`) e `switch.test.tsx` (a criar); `checkbox.tsx` e `radio-card.tsx` (existem; só se preciso).
  - `frontend/src/features/auth/CodeField.tsx` (existe; modo TOTP usa `CodeInput`, modo `any` fica `Input`).
  - `frontend/src/features/announcements/NewAnnouncementPage.tsx`: `FileField` (~linha 235), `DateField` (~269 e ~282), `Checkbox` nos canais (~250 a 257) e `RadioCard` em "quando enviar"; `NewAnnouncementPage.test.tsx` (só ajuste de seletor, se precisar).
  - `frontend/src/i18n/pt-BR.json`: grupo `fields` (`file.choose`, `file.none`, `code.digit`).
  - `frontend/src/dev/Vitrine.tsx` e `docs/design/README.md` (linhas `DateField`, `FileField`, `CodeInput`; ajuste da linha de `Checkbox`, `RadioCard`, `Switch`).
  - `frontend/visual/casos.ts`: sem caso novo (`comunicados-novo` e `login-duas-etapas` já existem); passo extra de digitar 3 dígitos no caso do login só se for preciso para igualar o canvas (4 8 2).
  - `frontend/visual/referencias/`: `comunicados-novo`, `login-duas-etapas`, `vitrine` e as telas que usam `CodeField` (`conta-duas-etapas`, `conta-codigos-reserva`, se mudarem), 1440 e 390, claro e escuro.
- Reuso: `Field`, `Input`, `Button`, `ComingSoon`, `cn`, tokens; `Switch`, `Checkbox`, `RadioCard` existentes; `CodeField` como ponto único das telas de código.
- Riscos: testes que digitam no campo de código por `getByLabelText` + `user.type` (continua um só `<input>`, devem passar); colar "482 913" deve virar 6 dígitos; `FileField` com input `sr-only` precisa seguir operável por teclado (foco no botão) e `userEvent.upload` usa o input; a caixa da vez com anel difere do canvas, tratar na comparação; referências de várias telas que usam `CodeField` podem mudar (listar no PR).

## 5. Tarefas

- [x] T1: `DateField`, `FileField` e `Switch` com `description`, com chaves `fields.*` e testes (valor ISO, esquema de cor, nome do arquivo, descrição, axe nos dois temas) — cobre CA1, CA2, CA3, CA4, CA5, CA10, CA11 — prova: `cd frontend && npx vitest run src/components/ui/date-field.test.tsx src/components/ui/file-field.test.tsx src/components/ui/switch.test.tsx`
- [x] T2: `CodeInput` (6 caixas, colar, Backspace, só dígitos, 360 px) e ligação em `CodeField` no modo TOTP — cobre CA7, CA8, CA10 — prova: `cd frontend && npx vitest run src/components/ui/code-input.test.tsx src/features/auth src/features/account`
- [x] T3: aplicar em Novo comunicado (`FileField`, `DateField`, `Checkbox`, `RadioCard`) e conferir `RadioCard` e `Checkbox` contra o canvas — cobre CA6, CA9 — prova: `cd frontend && npx vitest run src/features/announcements src/components/ui/radio-card.test.tsx`
- [x] T4: Vitrine e `docs/design/README.md` — cobre CA12 — prova: `cd frontend && npx vitest run src/components/design-readme.test.ts src/components/tokens.test.ts`
- [x] T5: regerar referências no container, comparar com o canvas (1440 e 390, pt-BR, capturas em `.capturas/453/`) e listar divergências no PR — cobre CA2, CA13 — prova: `cd frontend && npm run test:visual:docker -- --update-snapshots=all -g "comunicados-novo|login-duas-etapas|vitrine|conta-"` e `npm run visual:canvas`
- [x] T6: regressão do front — não cobre critério novo: confere CA8 e CA11 — prova: `cd frontend && npm run lint && npm run typecheck && npm run test:cov`

## 6. Decisões

- D1: data e arquivo seguem o **navegador** onde a issue manda: `DateField` fica sobre o campo nativo (o "dd/mm/aaaa" vem do idioma do navegador, Passo C) e só ganha aspecto e esquema de cor; `FileField` usa botão próprio com texto do pt-BR.json. Alternativa: calendário próprio com máscara, descartada (biblioteca nova, acessibilidade pior, sem pedido).
- D2: o código em 6 caixas é **um campo real com 6 caixas desenhadas**, não seis `<input>`. Motivo: preenchimento automático (`one-time-code`), colar e leitor de tela funcionam sem lógica de foco entre campos, e os testes atuais continuam achando o campo pelo rótulo. Alternativa: seis inputs com foco automático, descartada (frágil e maior).
- D3: `Switch`, `Checkbox` e `RadioCard` já existem; este item os mantém e acrescenta só o que falta (`description` no `Switch`); a troca nas telas que ainda usam `<input type="checkbox">` nativo é de cada issue de tela, exceto Novo comunicado (piloto). Alternativa: reescrever os três, descartada (muda telas fora do piloto).
- D4 (muda o comportamento visual, não a regra): como `CodeField` é compartilhado, as 6 caixas também chegam a ativar duas etapas, reautenticação e trocar e-mail, coerente com "onde o componente já é compartilhado, a mudança se espalha sozinha"; as referências dessas telas que mudarem entram no PR como mudança esperada. Alternativa: `CodeInput` só no login, descartada (duas aparências do mesmo campo).
- D5: o código de reserva (10 caracteres) não ganha caixas (o canvas não as mostra para ele); segue `Input`.
- Suposição: o canvas de `ComunicadoNovo` usa campo de data com ícone e o de `LoginDuasEtapas` mostra 6 caixas com 3 preenchidas; se a comparação mostrar outro tamanho de caixa, ajusta-se o tamanho sem mudar a API do componente.

## Construção

- T1 — arquivos: `components/ui/date-field.tsx`, `file-field.tsx`, `switch.tsx` (+ testes), `i18n/pt-BR.json` (`fields.file.*`) — prova: `npx vitest run` dos três testes → 8 passaram
- T2 — arquivos: `components/ui/code-input.tsx` (+ teste), `features/auth/CodeField.tsx` — prova: `npx vitest run src/components/ui/code-input.test.tsx src/features/auth src/features/account` → 151 passaram
- T3 — arquivos: `features/announcements/NewAnnouncementPage.tsx`, `components/ui/radio-card.test.tsx` — prova: `npx vitest run src/features/announcements src/components/ui/radio-card.test.tsx` → passou
- T4 — arquivos: `dev/Vitrine.tsx`, `docs/design/README.md` — prova: `design-readme.test.ts` e `tokens.test.ts` → passaram
- T5 — arquivos: 20 PNGs em `frontend/visual/referencias/` (comunicados-novo, login-duas-etapas, vitrine, conta-duas-etapas, conta-codigos-reserva) — prova: `npm run test:visual:docker -- --update-snapshots=all -g "..."` → 28 passaram; `npm run visual:canvas` → 96 comparadas, 0 reprovadas; capturas em `.capturas/453/` (1440 claro; o resto no relatório lado-a-lado). Caixas do código conferidas contra o canvas (mesmo tamanho e disposição); o restante do login difere do canvas (logo, textos, link "Usar um código de reserva") e é de issue de tela do login.
Regressão: `npm run lint && npm run typecheck && npm run test:cov` → verde na segunda rodada (206 arquivos, 1999 testes). Primeira rodada: `LoginPage.test.tsx` "trava com horário (#445)" falhou sob carga e passou isolado e na repetição (instável, sem relação com o item).
Desvios: `CodeInput` sem `maxLength` no input (truncava "482 913" colado; o filtro corta em 6); chave `fields.code.digit` não criada (caixas são `aria-hidden`, sem texto); `FileField` guarda o nome em estado próprio (sem prop `fileName`/`onFile`, usa `onChange` nativo). `conta-codigos-reserva` mudou de referência por usar `CodeField`.
Não rodou: `npm run e2e` (fora da prova do item; o CI roda).

## Verificação

### Rodada 1 — CORRIGIR_CODIGO — 2026-11-08, estado a530ec44ca19e5cfd1e3bab4a5e4374a6a86d2b8

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | date-field.test.tsx (vitest, 430 testes verdes nas pastas tocadas) |
| CA2 | NÃO CONFERIDO | classe `[color-scheme:light] dark:[color-scheme:dark]` testada; sem captura do tema escuro em `.capturas/453/` |
| CA3 | PASSOU | file-field.test.tsx |
| CA4 | PASSOU | file-field.test.tsx |
| CA5 | PASSOU | switch.test.tsx |
| CA6 | PASSOU | radio-card.test.tsx |
| CA7 | PASSOU | code-input.test.tsx (6 caixas, letras, Backspace, colar, onComplete) |
| CA8 | PASSOU | src/features/auth e account verdes |
| CA9 | PASSOU | src/features/announcements verde; imagem mostra "Escolher arquivo" na captura |
| CA10 | PASSOU | axe nos testes; `min-w-0 flex-1` presente |
| CA11 | PASSOU | `npm run lint` e `typecheck` saem 0 |
| CA12 | PASSOU | design-readme.test.ts e tokens.test.ts dentro de src/components, verdes |
| CA13 | NÃO CONFERIDO | `test:visual:docker` e `visual:canvas` não rodados nesta rodada; capturas incompletas (ver achados) |

Comandos: `npx vitest run src/components src/features/auth src/features/account src/features/announcements --maxWorkers=2` → 55 arquivos, 430 testes verdes; `npm run lint` → 0; `npm run typecheck` → 0. Não rodados: `test:cov` completo, `e2e`, container visual.
Achados:
- obrigatório, código, `frontend/src/components/ui/code-input.tsx` (caixas `h-12`, borda `border-input`, texto `text-lg font-semibold`) — esperado: caixa igual à do canvas `LoginDuasEtapas` (Construção diz "mesmo tamanho e disposição"; a suposição da spec manda ajustar o tamanho se divergir); observado: em `.capturas/453/login-duas-etapas-1440-claro-*.png` o canvas tem caixas de cerca de 56x64 px, borda escura nas preenchidas e dígito em fonte de título condensada, o sistema tem 58x48 px, borda clara e fonte comum; evidência: as duas imagens; corrigir: ajustar altura, borda e fonte por tokens, ou registrar `limiteCanvas` com motivo e issue que remove; corrigir também a frase da Construção.
- obrigatório, código, `.capturas/453/` — esperado: capturas 1440 e 390, claro e escuro, de `comunicados-novo` e `login-duas-etapas` (AGENTS.md); observado: só 1440 claro, e a de `comunicados-novo` corta em 1000 px, sem mostrar data de fixação, "quando enviar" nem `RadioCard`; `docs/design/prints/lado-a-lado/` tem 1440 claro e `comunicados-novo-claro` apenas; corrigir: gerar as capturas completas (390 e escuro) e conferir `DateField` (canvas tem ícone de calendário) e `RadioCard` contra o canvas; divergência restante vira `limiteCanvas` com motivo.
- sugestão, código, `FileField` — o canvas mostra área tracejada com ícone "Enviar imagem · até 5 MB"; a spec (D1) escolheu botão; manter se registrado como divergência no PR.
- sugestão, código, caso do login no teste visual não digita "482", então a referência mostra 6 caixas vazias contra 3 preenchidas no canvas.
Instáveis: nenhum visto nesta rodada.

### Correção da rodada 1
- Caixas do `CodeInput` igualadas ao canvas `LoginDuasEtapas` (altura 64 px = `h-16`, borda 1,5 px, `border-foreground` nas preenchidas e `border-border` nas vazias, dígito em `font-heading text-3xl`, `rounded-lg`), só por tokens — arquivos: `frontend/src/components/ui/code-input.tsx` — prova: `npx vitest run src/components/ui src/features/auth src/features/account` → 33 arquivos, 227 testes verdes; `npm run lint` e `npm run typecheck` → 0. A frase anterior "mesmo tamanho e disposição" valia só para a disposição; agora vale também para tamanho, borda e fonte. Resta a caixa da vez com anel (`ring`), que o canvas não mostra, mantida para foco visível.
- Caso do login no teste visual passa a digitar "482" (3 caixas preenchidas como no canvas) — arquivos: `frontend/visual/casos.ts` — prova: `npm run test:visual:docker -- --update-snapshots=all -g "comunicados-novo|login-duas-etapas|vitrine|conta-"` (referências regeradas; login 4 passou após corrigir o rótulo para "Código do app"); `npm run visual:canvas` → 96 comparadas, 0 reprovadas.
- Capturas completas em `.capturas/453/`: sistema 1440 e 390, claro e escuro, de `comunicados-novo` e `login-duas-etapas`; canvas 1440 claro de ambas (o canvas dessas telas só existe em 1440 claro; não há canvas 390 nem escuro). Limite: as capturas do teste visual cobrem só a primeira tela (1000 px a 1440, 844 px a 390), então data de fixação, "quando enviar" e `RadioCard` de `comunicados-novo` ficam abaixo do corte e não foram vistos na comparação; valem os testes de componente e a Vitrine. Divergência registrada para o PR: `FileField` é botão (D1) e o canvas mostra área tracejada "Enviar imagem · até 5 MB".

### Rodada 2 — OK — 2026-11-08, estado c5bb157a5823f34907eb29ae645e398cecd50479

| Critério | Status | Evidência |
|---|---|---|
| CA1, CA3 a CA12 | PASSOU | mantido da rodada 1; 430 testes verdes nas pastas tocadas; lint e typecheck 0 |
| CA2 | PASSOU | classe de esquema de cor testada; capturas do tema escuro existem em `.capturas/453/` |
| CA13 | NÃO CONFERIDO (limitação aceita) | container visual não rodado aqui; AGENTS.md, Autonomia 2: vale o CI; capturas e relatório do construtor mostram 0 reprovadas |

Comandos: `npx vitest run src/components src/features/auth src/features/account src/features/announcements --maxWorkers=2` → 430 verdes; `npm run lint` e `npm run typecheck` → 0; `npm run test:cov` → 206 arquivos, 1999 testes verdes.
Achados:
- Achado 1 da rodada 1 (caixas do código): resolvido; captura 1440 do sistema e do canvas abertas: mesmo tamanho, borda e fonte, 3 caixas preenchidas.
- Achado 2 da rodada 1 (capturas): resolvido em parte; 390 e escuro existem; canvas só existe em 1440 claro; data de fixação e RadioCard abaixo do corte, cobertos por testes de componente e Vitrine (registrado na Construção).
- sugestão, código, `FileField` botão em vez de área tracejada: manter e listar no PR.
Instáveis: nenhum.

## Entrega

- **O que muda:** componentes base de campos em `frontend/src/components/ui/`: `DateField` (sobre `<input type="date">`/`datetime-local`), `FileField` (botão "Escolher arquivo" e nome do arquivo), `Switch` com `description`, `RadioCard` e `Checkbox` pelos tokens do canvas, e `CodeInput` com 6 caixas e um campo real (`one-time-code`). Aplicados em Novo comunicado (imagem, datas, canais, "quando enviar") e no código do login em duas etapas; `CodeField` ganha as 6 caixas nas demais telas de código. Textos em `pt-BR.json`; `docs/design/README.md` e Vitrine atualizados.
- **Verificação:** rodada 2 `OK` (estado `c5bb157a5823f34907eb29ae645e398cecd50479`): 430 testes verdes nas pastas tocadas, `test:cov` com 1999 testes verdes, lint e typecheck com 0; referências do teste visual regeradas (`comunicados-novo`, `login-duas-etapas`, `vitrine`, `conta-*`) e `visual:canvas` com 96 comparadas e 0 reprovadas.
- **Decisões:** `FileField` fica como botão (D1), não como área tracejada do canvas; listado como divergência. Caixa com anel de foco mantida, por acessibilidade.
- **Limitações:** o canvas de `comunicados-novo` só existe em 1440 claro e a captura do teste visual corta na primeira tela, então data de fixação, "quando enviar" e `RadioCard` foram conferidos por testes de componente e Vitrine, não por captura lado a lado. Container visual de CA13 aceito pelo CI (Autonomia 2).
