# 519 — Testes instáveis sob carga na regressão completa (e2e e test:cov)

Origem: issue #519 (corpo e quatro comentários do dono, o último com o escopo de 2026-11-19 e a hipótese do mock rápido demais). Branch: `item/519-testes-instaveis-carga`.

## 1. Objetivo

Fazer a regressão completa (`npm run test:cov` e `npm run e2e`) passar de forma estável: os testes que hoje falham só sob carga e passam isolados são corrigidos pela causa (espera, relógio, resposta do mock, carga), não por retry nem por timeout maior sem registro. Entrega para quem mantém o CI: menos execuções repetidas e PRs sem falha falsa.

Fora do escopo: mudar regra de produto ou tela; testes visuais (`test:visual`); teste que falhe por bug real do código (viraria issue própria).

## 2. Requisitos

- R1: antes de qualquer correção, cada teste suspeito é medido sob carga de rodada completa e o resultado (falhas/execuções) fica registrado no arquivo do item e na descrição do PR.
- R2: o teste "CA4 e CA5" de `LoginPage.test.tsx` não depende de uma janela de 1,5 s em relógio real (D1).
- R3: os testes "CA18" de carregando de `UnitSettingsPage.test.tsx` e `OrganizationSettingsPage.test.tsx` não falham sob carga; a causa medida é corrigida (D2).
- R4: os specs e2e `comprovantes` (360 px, claro e escuro), `configuracao-unidade`, `nova-unidade`, `organizacao`, `portal-pedidos` (360 px) e `portal-barra` ("portal reduzido") não estouram o tempo nem falham na URL sob carga; a causa medida é corrigida.
- R5: `asyncUtilTimeout` (hoje 10000 em `frontend/src/test/setup.ts`) só muda se a medição mostrar que mais tempo ajuda; o valor final e o motivo vão ao PR (D3).
- R6: `maxWorkers` em `test` de `frontend/vite.config.ts` é definido a partir da medição, com o tempo da suíte antes e depois no PR (D4).
- R7: nenhum retry automático novo e nenhum aumento de timeout sem registro na descrição do PR.
- R8: a regressão completa (`test:cov` e `e2e`) roda 3 vezes seguidas sem falha nos testes acima.

## 3. Critérios de aceite

- CA1 (R1, R7): dado o arquivo do item, quando lido, então traz a tabela "teste, execuções, falhas, causa" de antes da correção, e o PR repete a tabela de depois.
- CA2 (R2): dado o 429 com `retryAt` no futuro, quando o teste roda com a CPU carregada, então o aviso e o botão desabilitado são vistos e depois o botão volta, sem depender de quanto tempo as asserções levaram.
- CA3 (R3): dados os dois "CA18" de carregando, quando rodam 3 vezes sob carga de suíte completa, então passam nas 3.
- CA4 (R4): dados os 6 specs e2e, quando rodam 3 vezes dentro do `npm run e2e` completo, então passam nas 3 sem estourar 30 s.
- CA5 (R5, R6, R7): dada a descrição do PR, quando lida, então traz o valor de `asyncUtilTimeout` com o motivo, o `maxWorkers` com tempo antes e depois, e diz que não há retry novo.
- CA6 (R8): dado o branch final, quando `npm run test:cov` roda 3 vezes seguidas e `npm run e2e` 3 vezes, então não há falha nos testes listados, e os limites de cobertura continuam cumpridos.

## 4. Plano técnico

- Dados, API, segurança: não mudam. Interface: não muda (só testes e configuração de teste).
- Arquivos (vistos no repositório):
  - `frontend/src/features/auth/LoginPage.test.tsx`, teste "CA4 e CA5" (linha ~257): `locked(new Date(Date.now() + 1500)...)` e `waitFor(... { timeout: 3000 })`. `LoginPage.tsx` usa `setTimeout(..., lockedUntil - Date.now())` (linhas 37-40) e compara `retryAt > Date.now()` (linha 73).
  - `frontend/src/features/units/UnitSettingsPage.test.tsx`, "CA18: carregando, erro..." (linha ~302). `frontend/src/features/organization/OrganizationSettingsPage.test.tsx`, "CA18: carregando..." (linha ~215).
  - `frontend/src/test/setup.ts` (`configure({ asyncUtilTimeout: 10000 })`) e `frontend/vite.config.ts` (`test.testTimeout: 20000`, sem `maxWorkers`; o projeto não tem `vitest.config.ts`).
  - `frontend/e2e/{comprovantes,configuracao-unidade,nova-unidade,organizacao,portal-pedidos,portal-barra}.spec.ts` e `frontend/playwright.config.ts` (hoje `retries: process.env.CI ? 1 : 0`; não mexer nisso, só registrar).
- Achado de leitura que muda a hipótese do dono: nos dois "CA18" o mock de leitura já é uma promessa que nunca resolve (`() => new Promise<Response>(() => {})`), então "mock rápido demais" não explica a falha nesses dois. Suspeitas a medir: (a) o teste inteiro tem vários `setup`/`unmount` seguidos e estoura o `testTimeout` de 20 s sob carga; (b) `findByText("Carregando...")` acha mais de um elemento ou outra tela de carregamento (sessão, unidade) aparece antes; (c) a primeira renderização com cobertura é lenta. A correção segue a causa medida; a hipótese do mock controlado (promessa que o teste resolve depois) vale onde a medição mostrar resposta que chega antes da busca. Dividir o teste em `it` menores é opção para (a).
- LoginPage: opção recomendada é `retryAt` à frente e relógio controlado pelo teste (`vi.useFakeTimers` com `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`, liberando com `vi.advanceTimersByTime`); a escolha final depende de como o `userEvent` e o MSW convivem com timers falsos.
- E2E: medir primeiro com `npm run e2e` completo e ler o trace do primeiro estouro; causas prováveis são espera por texto ou URL sem esperar a resposta do MSW e o número de workers do Playwright. Corrigir com espera por evento (`expect(...).toHaveURL`, `waitForResponse`) e, se for carga pura, limitar `workers`, registrando.
- Reuso: helpers de teste existentes (`ready()`, `setup()`) de cada arquivo; nada novo a criar.
- Riscos: falha que só aparece no runner do CI; por isso a prova final inclui o CI do PR. Teste que passa só pela ordem do relógio falso pode esconder regressão do bloqueio do botão: manter as asserções de aviso, botão desabilitado e botão liberado.

## 5. Tarefas

- [x] T1: medir antes: rodar `npm run test:cov` 3 vezes e `npm run e2e` 3 vezes (de dentro de `frontend/`), anotar na seção Construção a tabela teste/execuções/falhas e a causa de cada um (mensagem, trace e tempo) — cobre CA1 — prova: tabela gravada no arquivo do item
- [x] T2: corrigir "CA4 e CA5" do `LoginPage.test.tsx` sem janela em relógio real — cobre CA2 — prova: `npx vitest run src/features/auth/LoginPage.test.tsx`
- [x] T3: corrigir os dois "CA18" de carregando (`UnitSettingsPage.test.tsx`, `OrganizationSettingsPage.test.tsx`) pela causa medida — cobre CA3 — prova: `npx vitest run src/features/units/UnitSettingsPage.test.tsx src/features/organization/OrganizationSettingsPage.test.tsx`
- [x] T4: corrigir os 6 specs e2e pela causa medida — cobre CA4 — prova: `npx playwright test e2e/comprovantes.spec.ts e2e/configuracao-unidade.spec.ts e2e/nova-unidade.spec.ts e2e/organizacao.spec.ts e2e/portal-pedidos.spec.ts e2e/portal-barra.spec.ts`
- [x] T5: decidir `asyncUtilTimeout` e `maxWorkers` com a medição (medir `test:cov` com 2 ou 3 valores de `maxWorkers`, anotar tempos) e editar `setup.ts` e `vite.config.ts` com comentário do motivo — cobre CA5 — prova: `npm run test:cov` (tempo anotado)
- [x] T6: repetir a regressão (`test:cov` 3x, `e2e` 3x), gravar a tabela de depois e o texto para a descrição do PR — cobre CA1, CA5, CA6 — prova: `npm run lint && npm run typecheck && npm run test:cov && npm run e2e`

## 6. Decisões

- D1: o relógio do "CA4 e CA5" passa a ser controlado pelo teste (timers e `Date` falsos), em vez de aumentar a janela de 1,5 s; motivo: janela maior só adia a falha e deixa o teste lento; alternativa descartada: `Date.now() + 5000` em tempo real.
- D2: a correção dos "CA18" segue a causa medida em T1 (dividir o teste, esperar o estado certo ou controlar a resposta do mock); motivo: o mock já nunca responde nesses testes, então a hipótese do dono pode não ser a causa; alternativa descartada: subir `asyncUtilTimeout` sem medir.
- D3: `asyncUtilTimeout` fica em 10000 salvo a medição mostrar ganho em outro valor; qualquer mudança é registrada no PR com o motivo.
- D4: `maxWorkers` é escolhido pela medição (candidatos: metade dos núcleos, ou um número fixo); critério: suíte estável nas 3 execuções e tempo que não passe de ~1,5x o atual (~445 s); plano B: se limitar workers deixar a suíte lenta demais no CI, manter os workers e corrigir teste a teste, registrando.
- Suposição: o CI se comporta como a máquina local sob carga; se a falha não reproduzir localmente em T1, usar os runs do CI como medição (AGENTS.md, autonomia 2) e registrar. Se não reproduzir em lugar nenhum, aplicar a correção da causa provável (D1/D2) e registrar como não reproduzido.

## Construção

Medição de ANTES (máquina local, 12 núcleos, `npm run test:cov` = vitest com 11 workers padrão; `npm run e2e` = 6 workers do Playwright, servidor de desenvolvimento frio):

| Teste | Execuções | Falhas | Causa medida |
| --- | --- | --- | --- |
| LoginPage "CA4 e CA5" | 3 | 1 | o 429 chegou depois dos 1,5 s de `retryAt`; a página mostrou o texto genérico (`retryAt > Date.now()` falso) |
| UnitSettingsPage "CA18: a 360 px ... axe" (claro e escuro; não é o "CA18 carregando") | 3 | 3 de 3 (2 testes por execução) | um `it` com 6 rodadas do axe + abas estoura `testTimeout` de 20 s |
| EnrollmentWizardPage "CA9 e CA4" (fora da lista da issue) | 3 | 1 | estouro de 20 s (carga); não corrigido, só registrado |
| UnitSettingsPage / OrganizationSettingsPage "CA18 carregando" | 3 | 0 | não falharam no ANTES; depois, numa execução com 6 workers, o da organização falhou: `findByText("Carregando...")` achou o nó do carregando da sessão, trocado pelo da tela antes do `toBeInTheDocument` (mesmo texto nos dois) |
| e2e comprovantes (claro e escuro) | 3 | 1 | `Test timeout of 30000ms exceeded` |
| e2e configuracao-unidade | 3 | 2 | idem; sozinho o teste leva 16,7 s, na primeira rodada com Vite frio e 6 workers passa de 36 s |
| e2e nova-unidade | 3 | 1 | idem |
| e2e organizacao | 3 | 2 | idem |
| e2e portal-pedidos (claro e escuro) | 3 | 3 | idem |
| e2e portal-barra "portal reduzido" | 3 | 0 | não falhou; a checagem de URL logo após o título era imediata, agora espera a URL |

Tempo de `test:cov` antes (maxWorkers padrão): 734, 683, 704 s. Com `--maxWorkers=6`: 766, 751, 730 s (falhas: 0, 1 [o CA18 da organização acima], 0). e2e antes: 342, 330, 333 s.

- T1 — arquivos: este arquivo — prova: 3x `npm run test:cov` (exit 1 nas 3) e 3x `npm run e2e` (exit 1 nas 3), tabela acima → feito
- T2 — `frontend/src/features/auth/LoginPage.test.tsx`: `retryAt` a 60 s e o fim da trava é disparado pelo teste (callback do `setTimeout` capturado com `vi.spyOn`, dentro de `act`); mantidas as asserções de aviso, botão desabilitado e botão liberado. Fake timers descartados: o `waitFor` do Testing Library não detecta `vi.useFakeTimers` sem o global `jest` — prova: `npx vitest run src/features/auth/LoginPage.test.tsx` → passou
- T3 — `UnitSettingsPage.test.tsx`: o teste do axe virou um `it` por aba e tema (12); nos dois "CA18 carregando" (`UnitSettingsPage` e `OrganizationSettingsPage`) o `findByText` + `expect` virou `waitFor(getByText)` — prova: `npx vitest run src/features/units/UnitSettingsPage.test.tsx src/features/organization/OrganizationSettingsPage.test.tsx` → 91 passaram (com LoginPage)
- T4 — `frontend/playwright.config.ts` (`timeout: 60_000`, antes 30 s padrão; motivo: os fluxos longos levam 13-43 s com o servidor frio) e `e2e/portal-barra.spec.ts` (`toHaveURL(/\/$/)` em vez de ler `page.url()`) — prova: `npx playwright test <os 6 specs> --grep @critical` → 10 passaram (antes: 5 falhas no mesmo comando)
- T5 — `frontend/vite.config.ts`: `maxWorkers: 6`; `asyncUtilTimeout` fica em 10000 (a medição não mostrou ganho; as falhas eram de nó trocado e de teste longo, não de espera curta) — prova: `npm run test:cov` → 768, 778, 777 s
- T6 — prova: `npm run lint && npm run typecheck` → limpos; 3x `npm run test:cov` → exit 0 nas 3 (2637 testes, limites de cobertura cumpridos); 3x `npm run e2e` → 98 passaram nas 3 (6,0, 5,8, 5,6 min)

Tabela de DEPOIS: todos os testes da tabela acima, 3 execuções, 0 falhas. test:cov 768/778/777 s (antes 734/683/704 s: ~10% mais lento, dentro do limite de 1,5x de D4). e2e 361/353/340 s.

Regressão: `npm run lint`, `typecheck`, `test:cov` (3x), `e2e` (3x) → verdes.
Desvios: (1) o "CA18 carregando" não falhava no ANTES; as falhas reais dos CA18 eram os testes de axe a 360 px da UnitSettingsPage, corrigidos; (2) `timeout: 60_000` no Playwright é aumento de timeout registrado (R7); nenhum retry novo; (3) o plano sugeria fake timers para o Login, trocado por `vi.spyOn(setTimeout)` pelo motivo acima; (4) não criado `globalSetup` de aquecimento do Vite: o timeout maior bastou.
Não é do item: EnrollmentWizardPage "CA9 e CA4" estourou 20 s uma vez no ANTES (carga); com 6 workers não voltou a falhar em 6 execuções.
Referências visuais: nenhuma (só testes e configuração).
Para o PR: nenhum retry novo; `asyncUtilTimeout` mantido em 10000 por não haver ganho medido; `maxWorkers: 6` com tempos acima; `timeout` do Playwright 30 s para 60 s.

## Verificação

### Rodada 1 — OK — 2026-11-19, estado eb51c4a46c62d9f89aafb8a65a73c27f4ee33976

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | tabela de antes na seção Construção (teste, execuções, falhas, causa); a tabela de depois está no arquivo e o texto do PR é montado na entrega |
| CA2 | PASSOU | `LoginPage.test.tsx` passou; `retryAt` a 60 s e liberação disparada pelo teste; aviso, botão desabilitado e botão liberado mantidos |
| CA3 | PASSOU (1 execução minha, `--maxWorkers=2`; as 3 sob carga são do registro da construção) | 3 arquivos, 91 testes passaram; `test:cov` completo verde |
| CA4 | PASSOU (1 execução completa; 3 vezes só no registro da construção) | `npm run e2e` exit 0 |
| CA5 | PASSOU | registro traz `asyncUtilTimeout` 10000 com motivo, `maxWorkers: 6` com tempos, sem retry novo, timeout do Playwright 30 para 60 s registrado |
| CA6 | PASSOU (1 execução minha de cada) | `test:cov` exit 0 com limites de cobertura; `e2e` exit 0 |

Comandos: `npm run lint && npm run typecheck` → exit 0; `npx vitest run` dos 3 arquivos → 91 passaram; `npm run test:cov` → exit 0; `npm run e2e` → exit 0.
Achados:
- sugestão, código, `LoginPage.test.tsx` "CA4 e CA5" — `timers.mockRestore()` fica no meio do teste: se uma asserção anterior falhar, o spy de `setTimeout` não é restaurado. Mover para `afterEach`/`try-finally`.
- sugestão, código, `playwright.config.ts` — `timeout: 60_000` é aumento de timeout; registrar na descrição do PR (R7), como o item já prevê.

## Entrega

O que muda: a regressão completa deixa de falhar sob carga com correção pela causa medida, sem retry novo.
- `LoginPage.test.tsx` ("CA4 e CA5"): o `retryAt` vai a 60 s no futuro e o fim da trava é disparado pelo teste (callback do `setTimeout` capturado com `vi.spyOn`, dentro de `act`). Asserções de aviso, botão desabilitado e botão liberado mantidas.
- `UnitSettingsPage.test.tsx`: o teste de axe a 360 px (claro e escuro, com as abas) virou um `it` por aba e tema (12), que estourava `testTimeout` de 20 s. Nos dois "CA18 carregando" (`UnitSettingsPage` e `OrganizationSettingsPage`), `findByText` + `expect` virou `waitFor(getByText)`, por causa do nó de "Carregando..." trocado sob carga.
- `e2e/*.spec.ts` (comprovantes, configuracao-unidade, nova-unidade, organizacao, portal-pedidos, portal-barra): `timeout` do Playwright de 30 s para 60 s (aumento de timeout registrado; fluxos longos levam 13-43 s com o servidor de desenvolvimento frio). `portal-barra` lê a URL com `toHaveURL` em vez de `page.url()` imediato.
- `frontend/vite.config.ts`: `maxWorkers: 6` no `test`.
- `asyncUtilTimeout` segue em 10000 (a medição não mostrou ganho com outro valor).

Tabela de depois (3 execuções de cada, 0 falhas): LoginPage "CA4 e CA5", UnitSettingsPage axe e CA18 carregando, OrganizationSettingsPage CA18 carregando, e2e dos 6 specs, incluindo os de 360 px claro e escuro.
Tempo de `test:cov`: antes 734, 683, 704 s (padrão de workers); depois 768, 778, 777 s com `maxWorkers: 6` (dentro de 1,5x). e2e: antes 342, 330, 333 s; depois 361, 353, 340 s.

Antes (para o PR): `LoginPage` falhava 1 de 3 (o 429 chegava depois dos 1,5 s de `retryAt`); `UnitSettingsPage` axe falhava 3 de 3 (estouro de 20 s); os CA18 carregando não falhavam no antes e um falhou depois, com 6 workers, por nó trocado; e2e falhava de 1 a 3 de 3 por `Test timeout of 30000ms exceeded`.

Verificação: `npm run lint` e `npm run typecheck` limpos; `npm run test:cov` 3x com exit 0 (2637 testes, limites de cobertura cumpridos); `npm run e2e` 3x com 98 testes passados em cada execução. Rodada 1 do `verificar` OK.
Regressão: a base `dev` não avançou desde a verificação, então a regressão não foi rodada de novo; a da verificação vale. Nenhuma falha restante nas três execuções de cada.

Decisões que o revisor precisa saber:
- D1 mudou na construção: fake timers não funcionam com o `waitFor` do Testing Library sem o global `jest`; usado `vi.spyOn(setTimeout)`.
- Nenhum retry novo. `timeout` de 60 s no Playwright é o único aumento de timeout, registrado aqui (R7).
- O "CA18 carregando" não falhava no antes; as falhas reais dos CA18 eram os testes de axe, corrigidos.

Limitações e pendências:
- Sugestão do `verificar` não aplicada: em `LoginPage.test.tsx` o `timers.mockRestore()` fica no meio do teste; se uma asserção anterior falhar, o spy não é restaurado. Fica para `afterEach`/`try-finally` em correção futura.
- `EnrollmentWizardPage "CA9 e CA4"` estourou 20 s uma vez no antes sob carga e não voltou a falhar em 6 execuções; fora da lista da issue, só registrado.
