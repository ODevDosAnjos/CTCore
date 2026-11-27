# 769 — 636b · Campos automáticos no termo de matrícula (fecha a #636)

Origem: issue #769 (parte b da #636; RN-MAT-21, RN-MAT-11, RN-LGP-01, RNF-56; decisões 26 a 29 de `docs/auditoria/decisoes-canvas.md`). Branch: `item/769-campos-automaticos-termo`.

Tempos: especificar 2 · construir 21 · verificar 24 (regressão 19) (1 rodada) · entregar 3
Comparação com o canvas: 4 min

<!-- Fase 2: especificação. Item-mãe: `specs/itens/636-termo-dados-unidade.md` (P19). A #768 (dados da unidade e do titular) já está na `dev`. -->

## 1. Objetivo

O termo de matrícula, um só por organização, passa a ser preenchido com os dados da unidade da matrícula do aluno, para cada sede com CNPJ próprio aparecer como contratante. O Coordenador insere os campos no editor e vê a prévia por unidade; o portal mostra o texto preenchido e o aceite guarda esse texto final. Fecha a #636.

Fora do escopo: termo por unidade; campos no termo de uso de imagem; editor com formatação, rascunho e "Baixar PDF" (seguem "Em breve"); modelo da plataforma editável (RF-PNL-07); preencher o texto de aceites já gravados; tela para reler o texto aceito e o texto em "Baixar meus dados"; cadastro da razão social e do titular (#768, feito).

## 2. Requisitos

- R1 (RN-MAT-21): o termo de matrícula aceita os campos `{unidade}`, `{razao_social}`, `{cnpj}` e `{endereco}`; publicar com campo desconhecido ou chave sem fecho (D8) é recusado com 400 no campo `body`.
- R3 (RN-MAT-21): unidade com CNPJ preenche razão social e CNPJ com os dados dela; sem CNPJ, os dois vêm do titular da organização; os dois nunca se misturam. Dado em branco sai como "não informado" (D3) e o formato é o de D4.
- R4 (RN-MAT-21, RN-MAT-11): o portal mostra o termo pendente preenchido com a unidade da matrícula de cada aluno (D2).
- R5 (RN-MAT-21, RN-LGP-01): o aceite guarda o texto final, igual ao mostrado (D6); mudar depois a unidade ou o titular não altera o que já foi aceito.
- R6 (issue #769): o editor de Termos insere os campos no texto e mostra a prévia com os dados de uma unidade escolhida, entre as que a conta alcança.
- R7 (RNF-56, AGENTS.md): as telas mexidas mantêm os quatro estados, funcionam a 360 px, passam no axe nos dois temas e seguem o padrão de rotas e telas; textos em `pt-BR.json`; OpenAPI, MSW e especificação mudam junto.
- R8 (D5): o modelo padrão da plataforma (versão 0) traz um cabeçalho com os quatro campos.

(A numeração segue a do item-mãe: o R2 e o CA5 de lá são da #768; R8 e CA8 a CA10 são novos aqui.)

## 3. Critérios de aceite

- CA1 (R3, R4, R5): dadas duas unidades com CNPJs e razões sociais diferentes e um aluno matriculado em cada, quando cada um lê e aceita o termo, então o texto mostrado e o gravado em `term_acceptance.body` são iguais e têm o nome, a razão social, o CNPJ formatado e o endereço da própria unidade (teste de integração).
- CA2 (R3): dada uma unidade sem CNPJ, mas com razão social, então o termo mostrado e o gravado trazem a razão social (`holder_name`) e o documento do titular (CNPJ ou CPF, formatado), sem a razão social da unidade; unidade com CNPJ e sem razão social sai "não informado", sem usar o nome do titular; titular, documento ou endereço em branco saem "não informado" e o aceite funciona.
- CA3 (R5): dado um termo já aceito, quando o CNPJ, a razão social, o nome ou o endereço da unidade, ou o titular, mudam, então o texto gravado continua igual; repetir o aceite responde 200 sem gravar. Registros antigos e de uso de imagem ficam com `body` nulo.
- CA4 (R1): dado um texto com os quatro campos, então publica e é guardado com os campos, sem preencher; com `{telefone}`, `{CNPJ}` ou `{cnpj` sem fecho, 400 no campo `body`, sem versão nem auditoria. Publicar o uso de imagem não muda.
- CA6 (R6): dado o Coordenador no editor do termo de matrícula, quando toca num campo, então ele entra na posição do cursor (ou no lugar da seleção); ao escolher uma unidade, a prévia mostra o texto em edição com os dados dela e avisa o que sai "não informado". O Administrador vê a prévia da versão atual só das unidades ativas do vínculo dele, sem botões de campo; nenhuma resposta traz unidade de outra organização; a aba "Uso de imagem" não tem campos nem prévia.
- CA7 (R7): dadas as telas Termos e aceite no portal, então os casos `configuracoes-termos`, `portal-termo` e `portal-termo-filhos` do teste visual passam no axe nos dois temas, funcionam a 360 px e foram comparados com `ConfigTermos`, `PortalTermo`, `PortalMTermo` (e `PortalTermoFilhos`); o e2e abre Termos dentro da moldura; `shell.test.ts`, `noInternalAnchors.test.ts` e `routePattern.test.ts` verdes; contrato, MSW e especificação batem.
- CA8 (R4, R5): dado um aluno com modalidades ativas em duas unidades, então vale a da modalidade ativa mais antiga; com todas encerradas, a unidade de cadastro. Continua um aceite por aluno, e mudar de unidade depois do aceite não deixa o termo pendente.
- CA9 (R5): dado o termo mostrado, quando o dado usado nele muda antes do aceite e o portal envia o `hash` antigo, então 409 `TERMS_VERSION_CONFLICT` sem gravar nada; o portal avisa, lê o texto de novo, com a caixa de aceite desmarcada, e o novo aceite funciona. Sem `hash` no pedido, grava o texto preenchido no momento.
- CA10 (R8): dada uma organização sem versão publicada, então o editor mostra o modelo com os quatro campos e o portal o mostra preenchido; versões já publicadas não mudam.

Acesso: quem lê, publica e aceita não muda; as recusas (401, 403, 404 e isolamento) são as de hoje, cobertas por `TermsIT` e `PortalTermsIT`, que continuam verdes.

## 4. Plano técnico

- Dados: `backend/src/main/resources/db/migration/V65__term_acceptance_body.sql` (a criar): `term_acceptance.body text` nulo, com `check (body is null or kind = 'ENROLLMENT')`. Sem preenchimento retroativo. A tabela já é só de inserção e tem RLS (`V48`), o que vale para a coluna nova. Reversão em comentário: `drop column body`.
- Servidor:
  - `terms/TermFields` (a criar): único lugar que monta os valores e troca os campos. Lista dos quatro campos; `validate(texto)` (400 em `body`; mesma lógica de `mail/TextModels.validate`, para campo desconhecido e chave sem fecho); valores de várias unidades de uma organização (`unit.name, legal_name, cnpj, address, city, postal_code` e `organization.holder_name, holder_document`, com filtro por organização no SQL, dentro da transação de quem chama), devolvendo para cada uma os valores prontos e a lista dos campos em falta. A troca reusa `TextModels.fill` (uma passada só: valor com chaves não é trocado de novo). Formato: documento com 14 dígitos como `00.000.000/0000-00`, com 11 como `000.000.000-00`; endereço = endereço, cidade e `CEP 00000-000`, separados por vírgula, sem as partes vazias; vazio vira "não informado" (o `ReceiptPdf.cnpj` é privado do pacote `payment` e só cobre CNPJ).
  - `terms/Terms`: `publish` chama `TermFields.validate` só para `ENROLLMENT`; `ENROLLMENT_TEMPLATE` ganha o cabeçalho com os quatro campos, com o rótulo "CNPJ ou CPF: {cnpj}" (o titular pode ser pessoa física); `View` ganha `units` (`id`, `name`, `values`, `missing`): para `ENROLLMENT`, as unidades de `organization/UnitScope.reachable(who)` (chamado depois da checagem de acesso); para `IMAGE_USE`, vazia. `current` e `versions` seguem com os campos sem preencher.
  - `student/PortalTerms`: `Text` ganha `hash` (`identity/Codes.hash` do texto preenchido). A unidade do aluno é a de `enrollment_modality` `ACTIVE` mais antiga (`started_at, created_at, id`), senão `student.registered_unit_id`. `pending` preenche o texto por aluno. `accept(..., hash, ...)`: mantém a ordem atual (sem matrícula 200, versão 409, sem pendência 200) e, só então, preenche o texto uma vez, compara o `hash` se veio (diferente: 409) e grava esse mesmo texto em `body`. `insert` ganha o parâmetro `body` (nulo no uso de imagem). A auditoria continua sem o texto. `imageUse` não muda.
  - `student/PortalTermController`: `AcceptBody` ganha `hash` opcional.
- API (`docs/openapi.yaml`), sem rota nova: `TermsView.units` obrigatório (esquema novo `TermsUnitPreview`); `PortalTermText.hash` obrigatório na resposta, texto opaco; `PortalTermAcceptInput.hash` opcional; descrições de GET `/organization/terms/{kind}`, POST `.../versions` (campos aceitos e 400), GET `/portal/term` e POST `term-acceptance` (409 também quando o texto preenchido mudou).
- Interface:
  - `features/terms/useTerms.ts`: tipo `units` em `TermsView` (o `publish` já preserva o resto da resposta).
  - `features/terms/TermsTab.tsx` (`TermEditor`, só em `ENROLLMENT`): botões dos quatro campos junto do editor, só com `canManage`, inserindo no cursor como `features/texts/TextsTab.insert` (`ref` no `Textarea`); cartão "Prévia por unidade" na coluna do editor, com `Select` (`components/ui/field`) rotulado, texto preenchido (troca em uma passada dos `{campo}` conhecidos por `values`, `whitespace-pre-wrap break-words`) e aviso dos campos em `missing`. Sem unidade na lista: frase de vazio no cartão. Carregando, erro e sem permissão são os da aba.
  - `features/portal/usePortalTerm.ts`: `term.hash` no tipo e no corpo do aceite. `PortalTermPage.tsx`: no 409, chamar `term.retry()` e mostrar o aviso no nível da página (hoje ele fica no `TermBlock`, que some na releitura, e o texto não é lido de novo); o aviso sai no próximo aceite.
  - `i18n/pt-BR.json`: chaves novas em `terms.fields` e `terms.preview`; `portalTerm.errors.conflict` passa a falar em "texto atualizado", mantendo o começo "O termo mudou".
- MSW (`mocks/handlers.ts`): `TERMS_TEMPLATES.ENROLLMENT` com os campos; uma função só de preenchimento sobre `units`, `unitDetail` e `organization` do mock, usada em `units` do GET de termos (Administrador: só a unidade dele) e no `/portal/term`; mesma recusa de campo na publicação; `hash` derivado do texto preenchido, conferido no aceite. `mocks/browser.ts` não precisa mudar (o `hash` do gancho é dispensável no aceite simulado).
- Especificação: `docs/especificacao/09-matricula.md`: RN-MAT-21 ganha as escolhas aprovadas (nomes dos campos, unidade da matrícula, "não informado", titular pessoa física, aceite recusado se o texto mudou) e RF-MAT-05 cita os campos e a prévia.
- Testes e visual: `terms/TermsIT`, `student/PortalTermsIT` (apoio em `PortalTermBase`; `@AfterEach` existente, sem teste novo com limpeza por `delete`: se for preciso classe nova, usa `truncate ... cascade`), `features/terms/TermsTab.test.tsx`, `features/portal/PortalTermPage.test.tsx`, `mocks/terms.msw.test.ts`, `mocks/portal-term.msw.test.ts`, `e2e/organizacao.spec.ts`, `e2e/portal-termo.spec.ts`, `visual/telas.visual.ts` (o override `termosCanvas` precisa de `units`, senão a tela quebra). Os três casos já existem em `visual/casos.ts`. Mudam as referências de `configuracoes-termos`; as do portal não devem mudar (se mudarem, investigar). A moldura não muda.
- Segurança: permissões, vínculo aluno-conta, RLS e CSRF não mudam; os valores da prévia saem só das unidades de `UnitScope` e do titular da organização da sessão (o Administrador já o lê em Organização › Geral); o preenchimento é do servidor e o cliente nunca envia o texto aceito; SQL parametrizado; texto puro, escapado pelo React. O titular pode ser pessoa física: o texto preenchido não entra em log nem auditoria, e os testes usam só dados fictícios. O seed da #768 já cobre os dois casos (unidade com CNPJ e unidade que usa o titular).
- Arquivos contáveis: cerca de 22 (limite 30).
- Reuso: `TextModels.fill`, `UnitScope.reachable`, `Codes.hash`, `TERMS_VERSION_CONFLICT`, `Select`, o padrão de inserção de `TextsTab`.
- Riscos: prévia e portal divergirem (os valores saem só de `TermFields`, e a tela só troca os campos); versão já publicada que contenha `{cnpj}` literal passa a ser preenchida no portal; o cabeçalho e a prévia podem afastar `configuracoes-termos` do canvas além de 15% no `visual:canvas` (vale o item 4 da "Autonomia").

Partes de construção: A (T1, T2), servidor e contrato; B (T3, T4), telas e MSW; C (T5), e2e e visual.

## 5. Tarefas

- [x] T1: `TermFields`, validação na publicação, modelo padrão e `units` em `Terms`; contrato das rotas de gestão; RN-MAT-21 e RF-MAT-05 em `09-matricula.md`; testes em `TermsIT` (campos aceitos e recusados, modelo, valores por unidade nos casos de CA2, Administrador só com as suas, outra organização fora, `IMAGE_USE` vazio) — cobre CA2, CA4, CA6, CA7, CA10 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=TermsIT -Djacoco.skip=true`
- [x] T2: `V65`, texto preenchido e `hash` em `PortalTerms` e `PortalTermController`, contrato do portal, com testes em `PortalTermsIT` (duas unidades, titular, "não informado", modalidade mais antiga e sem ativa, texto imutável, repetição, 409 por mudança de dado, sem `hash`, `body` nulo no uso de imagem, auditoria sem o texto) — cobre CA1, CA2, CA3, CA8, CA9, CA10 — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste -Dsurefire.failIfNoSpecifiedTests=false -Dit.test=PortalTermsIT -Djacoco.skip=true` e `./backend/mvnw -f backend/pom.xml test -Dtest='OpenApiContractTest,ContractRoutesTest'`
- [x] T3: botões de campo e prévia na aba Termos, textos e MSW de gestão (modelo, `units`, recusa de campo), com testes (inserção no cursor, troca de unidade, aviso do que falta, Administrador, uso de imagem, axe nos dois temas) — cobre CA4, CA6, CA7, CA10 — prova (em `frontend/`): `npm test -- features/terms terms.msw`
- [x] T4: `hash` no aceite do portal, releitura e aviso no 409, texto e MSW do portal (preenchido por aluno), com testes — cobre CA1, CA7, CA9 — prova (em `frontend/`): `npm test -- PortalTermPage portal-term.msw` e `npm run lint && npm run typecheck`
- [x] T5: e2e (em `organizacao.spec.ts`, inserir campo e trocar a unidade da prévia dentro da moldura, sem rolagem a 360 px; em `portal-termo.spec.ts`, termo sem `{` e com os dados da unidade) e `units` no override `termosCanvas`; salvar em `.capturas/769/` as capturas do sistema e do canvas (1440 e 390 px, pt-BR, temas em que o canvas existe), rodar `visual:canvas`, regerar só as referências de `configuracoes-termos` e anotar divergências e o tempo da comparação — cobre CA6, CA7 — prova (em `frontend/`): `npm run e2e -- organizacao portal-termo`, `npm test -- shell noInternalAnchors routePattern telasCanvas tokens casos`, `npm run test:visual:docker -- --update-snapshots -g "configuracoes-termos "` e `npm run visual:canvas`

## 6. Decisões

As D2 a D7 são as do item-mãe, já aprovadas pelo dono (D1 de lá, 27/11/2026), com a mesma numeração.

- D2 (muda o comportamento): a unidade da matrícula é a da modalidade ativa mais antiga (`enrollment_modality` por `started_at`, `created_at`, `id`); sem modalidade ativa, a de cadastro do aluno. Um aceite por aluno (RN-MAT-11); trocar de unidade não pede aceite de novo. Alternativa descartada: sempre a unidade de cadastro.
- D3 (muda o comportamento): dado em branco sai como "não informado", sem travar a publicação nem o portal; a prévia avisa o que falta. Alternativa descartada: bloquear o aceite.
- D4 (muda o comportamento): `{endereco}` é endereço, cidade e CEP, sem as partes vazias; `{cnpj}` sai formatado e, se o titular for pessoa física, é o CPF dele, mostrado no termo.
- D5 (muda o comportamento): o modelo padrão (versão 0) ganha o cabeçalho com os quatro campos; versões publicadas não mudam.
- D6 (muda o comportamento): o termo pendente leva um hash do texto preenchido e o portal o devolve no aceite; se o texto mudou, 409 `TERMS_VERSION_CONFLICT` e releitura. O campo é opcional no pedido.
- D7: campos e prévia (decisão 29) não estão no `ConfigTermos`; o PR lista a divergência. A prévia fica abaixo do editor, para não mexer no desenho do canvas.
- D8 (muda o comportamento): além do campo desconhecido, chave sem fecho (`{cnpj`) é recusada, como nos textos de e-mail (`TextModels.validate`), para um campo digitado pela metade não ir parar no contrato. O uso de imagem não é validado. Alternativa descartada: aceitar a chave solta como texto.
- D9: a unidade escolhida na prévia é estado da tela, não vai ao endereço: não é filtro, registro nem aba (RNF-56). A prévia lista só unidades ativas ao alcance (`UnitScope`).
- Suposição: "Baixar meus dados" (#764) segue listando o aceite sem o texto, que a issue não pede; se o dono quiser o texto na exportação, é item novo.

## Construção

- T1 — arquivos: `terms/TermFields.java` (novo), `terms/Terms.java`, `mail/TextModels.java`, `docs/openapi.yaml`, `docs/especificacao/09-matricula.md`, `terms/TermsIT.java` — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=NaoExiste ... -Dit.test=TermsIT -Djacoco.skip=true` → 10 testes, 0 falhas.
- T2 — arquivos: `V65__term_acceptance_body.sql` (novo), `student/PortalTerms.java`, `student/PortalTermController.java`, `docs/openapi.yaml`, `student/PortalTermsIT.java` — prova: mesmo comando com `-Dit.test=PortalTermsIT` → 10 testes, 0 falhas; `test -Dtest='OpenApiContractTest,ContractRoutesTest'` → passou.
- T3 — arquivos: `features/terms/TermsTab.tsx`, `useTerms.ts`, `TermsTab.test.tsx`, `i18n/pt-BR.json`, `mocks/handlers.ts`, `mocks/terms.msw.test.ts` — prova: `npm test -- features/terms terms.msw PortalTermPage portal-term.msw` → 4 arquivos, 39 testes, 0 falhas.
- T4 — arquivos: `features/portal/PortalTermPage.tsx`, `usePortalTerm.ts`, `PortalTermPage.test.tsx`, `mocks/handlers.ts`, `mocks/portal-term.msw.test.ts`, `i18n/pt-BR.json` — prova: o mesmo `npm test` acima; `npm run lint` e `npm run typecheck` sem erros.
- T5 — arquivos: `e2e/organizacao.spec.ts`, `e2e/portal-termo.spec.ts`, `visual/telas.visual.ts`, 4 referências — prova: `npm run e2e -- organizacao portal-termo` → 8 passaram (o filtro "organizacao" também pega `escolha-organizacao`); `npm test -- shell noInternalAnchors routePattern telasCanvas tokens casos` → 14 arquivos, 788 testes, 0 falhas; `npm run test:visual:docker -- --update-snapshots -g "configuracoes-termos "` → 4 passaram; `npm run visual:canvas` → 164 comparadas, 0 reprovadas (`configuracoes-termos` 1440: 1,7%; `portal-termo` 1440: 1,5% e 390: 8,3%; `portal-termo-filhos` 1440: 2,5%). Segue o padrão de rotas e telas.

Testes do item: os das tarefas acima, todos passando; depois de reindentar `TermsTab.tsx`, `lint`, `typecheck` e os 39 testes do item rodaram de novo e passaram. Regressão e conferência do visual sem `--update-snapshots` não rodaram aqui (verificação e CI).
Capturas (`.capturas/769/`): `configuracoes-termos-1440-{sistema,canvas}`, `configuracoes-termos-390-sistema` (sem canvas de celular), `portal-termo-{1440,390}-{sistema,canvas}`, `portal-termo-filhos-1440-{sistema,canvas}` e `portal-termo-filhos-390-sistema`. Nenhuma das três telas tem canvas escuro no teste visual. As do portal vêm das referências commitadas (a tela não mudou de visual; só o fluxo do 409), e o CI confere.
Divergências do canvas: botões "Campos automáticos" e cartão "Prévia por unidade" não estão no `ConfigTermos` (D7); no 390 a prévia fica abaixo do rodapé do editor. As demais diferenças da tela são anteriores ao item.
Desvios: `mail/TextModels` ganhou `checkFields` (público), extraído de `validate`, para o termo reusar a mesma checagem em vez de copiá-la (arquivo a mais no plano). O aviso de "não informado" da prévia usa o tom `info` (papel `status`), para não competir com o alerta de erro da publicação. No e2e, a segunda unidade ativa da prévia é criada pela rota simulada `POST /units`. Arquivos contáveis: 21.
Referências visuais: `configuracoes-termos-{1440,390}-{claro,escuro}.png`.

## Verificação

### Rodada 1 — OK — 27/11/2026, estado f9e0bac344ed0abdce35239976750891212f0779

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `PortalTermsIT` "769 CA1, CA3" (duas unidades, mostrado igual ao `term_acceptance.body`) |
| CA2 | PASSOU | `PortalTermsIT` "769 CA2, CA10" e `TermsIT` "769 CA2, CA6, CA10" (titular CPF e CNPJ, sem razão social, "não informado", aceite 201) |
| CA3 | PASSOU | `PortalTermsIT` "769 CA1, CA3" (texto imutável, repetição 200, uso de imagem com `body` nulo); registros antigos ficam nulos pela `V65` (coluna nula, sem preenchimento) |
| CA4 | PASSOU | `TermsIT` "769 CA4" (os três casos 400 em `body`, sem versão nem auditoria; uso de imagem livre) |
| CA6 | PASSOU | `TermsTab.test.tsx` (cursor e seleção, unidade, aviso, Administrador, uso de imagem), `TermsIT` (Administrador e outra organização), e2e "termos: inserir campo automático" |
| CA7 | PASSOU | e2e `organizacao` e `portal-termo` 8/8 (moldura, 360 px, dois temas no portal); axe nos dois temas nos testes das duas telas; `shell`, `noInternalAnchors` e `routePattern` no `npm test`; contrato (`mvnw test` e testes MSW); capturas de `.capturas/769/` abertas e comparadas, as diferenças novas são só as da D7; visual: no CI do PR |
| CA8 | PASSOU | `PortalTermsIT` "769 CA8" |
| CA9 | PASSOU | `PortalTermsIT` "769 CA9"; `PortalTermPage.test.tsx` "769 CA9"; `portal-term.msw.test.ts` |
| CA10 | PASSOU | `PortalTermsIT` (versão 0 preenchida) e `TermsIT` (modelo com os quatro campos; `units`) |

Comandos: `mvnw test` → 161, 0 falhas; `verify -Dit.test=TermsIT` → 10, 0 falhas; `-Dit.test=PortalTermsIT` → 10, 0 falhas; `npm run lint`, `typecheck` e `build` → sem erros; `npm test` → 278 arquivos, 3173 testes, 0 falhas; `npm run e2e -- organizacao portal-termo` → 8 passaram. Visual: no CI do PR. Regressão local reduzida rodou inteira.
Especificação x issue: os requisitos de partida (R1, R3 a R7; CA1 a CA4, CA6, CA7) estão cobertos; D2 a D6 seguem o item-mãe. 21 arquivos contáveis (limite 30).
Achados:
- sugestão, código, `frontend/src/features/terms/TermsTab.tsx` (`badField`) — a tela escolhe o aviso de campo inválido por regex sobre o texto da mensagem do servidor ("campo automático|sem fecho"); se a mensagem mudar, cai no aviso genérico de texto inválido.

## Entrega

Campos automáticos no termo de matrícula: o termo ganha os campos automáticos (unidade, razão social, CNPJ e endereço, pela `TermFields`; sem CNPJ, nome e documento do titular), com a prévia por unidade no editor e o texto aceito gravado no aceite (`V65`, coluna `body`), que fica imutável. Registros antigos ficam sem texto gravado, sem preenchimento retroativo.

Verificado na rodada 1 (OK, estado `f9e0bac3`): `TermsIT` e `PortalTermsIT` (10 testes cada), `mvnw test` (161), `npm test` (3173), lint, typecheck, build e e2e `organizacao` e `portal-termo` (8). O visual fica para o CI do PR.

Decisões: `mail/TextModels` ganhou `checkFields` público, extraído de `validate`, para o termo reusar a checagem. O aviso de "não informado" da prévia usa o tom `info`, para não competir com o alerta de erro. A segunda unidade do e2e é criada pela rota simulada `POST /units`.

Divergências do canvas (comparação com o canvas): os botões "Campos automáticos" e o cartão "Prévia por unidade" não existem no `ConfigTermos` (D7), e no 390 a prévia fica abaixo do rodapé do editor. As demais diferenças são anteriores ao item.

Limitações: nenhuma para o escopo. Arquivos contáveis: 21 (limite 30).
