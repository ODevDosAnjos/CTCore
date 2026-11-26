# 720 — 646d · Cabeçalhos sem subtítulo: Comunicação

Origem: issue #720 (parte d da #646, RNF-45; RF-COM-01 em `docs/especificacao/13-comunicacao-e-notificacoes.md`; decisões 33 e 34 de `docs/auditoria/decisoes-canvas.md`). Branch: `item/720-cabecalhos-comunicacao`. Item-mãe: `specs/itens/646-cabecalhos-sem-subtitulo.md`. Modelo: `specs/itens/719-cabecalhos-financeiro.md`.

## 1. Objetivo

Nas telas de Comunicação (Comunicados, Novo comunicado e Avisar turma), tirar o subtítulo com a unidade, a frase de regra interna e a nota de rodapé; o limite diário só aparece quando faltam 5 ou menos (RF-COM-01). Apagar do `pt-BR.json` as chaves sem uso. Fora: Configurações, conta e portal (parte e); mudar layout, API ou regra do limite.

## 2. Requisitos

- R1: `/comunicados` mostra só o título e a ação, no desktop e no celular: somem `announcements.subtitle`, `subtitleMobile` e o nome da unidade como subtítulo (`scopeUnit`, `scopeAll`, se sem uso).
- R2: Em `/comunicados`, com unidade escolhida e faltando 5 ou menos para o limite (e ainda sobrando vaga), o subtítulo é "{{used}} de {{limit}} enviados hoje" (`subtitleUsed`, sem o nome da unidade); com mais de 5 sobrando, ou em "Todas", não há subtítulo. Com o limite cheio vale a faixa amarela (`limitBanner`), que não muda.
- R3: A lista perde o rodapé `announcements.note` ("Enviado não é editado nem apagado…").
- R4: `/comunicados/novo` mostra só o título; com unidade e faltando 5 ou menos, o subtítulo é "{{used}} de {{limit}} comunicados hoje" (`announcements.new.subtitle`, sem "Unidade X"). Somem `new.subtitleUnit` e `new.intro`. No celular o cabeçalho compacto perde o nome da unidade.
- R5: Avisar turma (`announcements.lesson`) não muda: o subtítulo "Aberto a partir da aula…" identifica o registro e `cancelledNote` orienta onde agir (D2).
- R6: Chaves sem uso saem do `pt-BR.json` após `grep` (variantes `_one/_other`, `Mobile`).
- R7: Quatro estados, layout, rotas e API inalterados; padrão de rotas e telas do AGENTS.md.
- R8: Testes que conferiam os textos passam a conferir a ausência (ou o texto novo); só as referências visuais de Comunicados e Novo comunicado (e telas que os mostram) são regeradas; a lista tela por tela vai na descrição do PR.

## 3. Critérios de aceite

- CA1 (R1): dado `/comunicados` com unidade, em "Todas" e no celular, com poucos enviados, então o cabeçalho tem só "Comunicados" e a ação, sem "o aluno lê no portal", "limite de 20 por dia" nem nome de unidade.
- CA2 (R2): dado 3 de 20 enviados, então não há subtítulo; dado 15 de 20 (faltam 5) e 19 de 20, então o subtítulo é "15 de 20 enviados hoje" / "19 de 20 enviados hoje"; dado 20 de 20, então só a faixa amarela e o botão desabilitado, sem subtítulo de contagem.
- CA3 (R3): dada a lista, então não há "Enviado não é editado nem apagado".
- CA4 (R4): dado `/comunicados/novo` com unidade, 3 de 20, então só o título; com 16 de 20, subtítulo "16 de 20 comunicados hoje"; sem "Escolha para quem o aviso vai" nem "Unidade Tijuca". No celular o cabeçalho não traz o nome da unidade.
- CA5 (R5): dada a janela Avisar turma (aula normal e cancelada), então o subtítulo da aula e a nota da aula cancelada continuam.
- CA6 (R6): `npm run lint` e `npm test` passam e `grep` das chaves removidas em `src`, `e2e` e `visual` não acha uso.
- CA7 (R7, R8): os casos visuais `comunicados`, `comunicados-novo`, `comunicados-cancelar`, `comunicados-limite`, `comunicados-organizacao`, `comunicados-celular`, `comunicados-novo-celular` e `aula-avisar-turma` (nomes em `frontend/visual/casos.ts`) passam sem `--update-snapshots` depois de regerar; a comparação com o canvas (1440 e 390 px) não piora.

## 4. Plano técnico

- Dados, API e segurança: não mudam (só texto de tela).
- Interface (arquivos vistos, em `frontend/src`):
  - `features/announcements/AnnouncementsPage.tsx`: trocar o bloco `let subtitle` (~139-142) por `const left = limit - used; const subtitle = unitName && left > 0 && left <= 5 ? t("announcements.subtitleUsed", { used, limit }) : undefined;` e passar ao `PageHeader` (~146); tirar o `footer` com `announcements.note` (~172). `narrow` continua usado nos botões.
  - `features/announcements/NewAnnouncementPage.tsx`: `subtitle` (~252) vira `unitName && daily && daily.unit.limit - daily.unit.used > 0 && daily.unit.limit - daily.unit.used <= 5 ? t("announcements.new.subtitle", { used, limit }) : undefined` (limite cheio: ver D3); cabeçalho compacto (~332) sem `subtitle={unitName}`. `unitName` segue usado no `limitBanner` (~238).
  - `features/announcements/AnnounceLessonDialog.tsx`, `OrganizationAnnouncementDialog.tsx`: não mudam.
  - `i18n/pt-BR.json` (bloco `announcements`, ~3244): apagar `scopeUnit`, `scopeAll`, `subtitle`, `subtitleMobile`, `note`, `new.subtitleUnit`, `new.intro`; trocar o texto de `subtitleUsed` ("{{used}} de {{limit}} enviados hoje") e `new.subtitle` ("{{used}} de {{limit}} comunicados hoje"). Reconferir por `grep` se `scopeUnit`/`scopeAll` de `announcements` têm outro uso.
- Testes a ajustar (achados por `grep`, reconferir): `announcements/AnnouncementsPage.test.tsx` (~133, 136, 145-157, 180, 297), `announcements/NewAnnouncementPage.test.tsx` (se citar subtítulo ou intro); `e2e/comunicados.spec.ts` sem texto citado (reconferir).
- Visual: referências em `frontend/visual/referencias` dos casos de CA7; sem caso novo. Capturas em `.capturas/720/`. Moldura não muda; o CI confere a suíte inteira.
- Riscos: `used`/`limit` do `AnnouncementsPage` vêm de `useDailyLimit` (pode ser nulo ao carregar: `used = 0`, `limit = 20`, então sem subtítulo); item pequeno, bem abaixo de 30 arquivos (uns 3 de código, 2 de teste e o JSON).

## 5. Tarefas

- [x] T1: Tirar subtítulo, rodapé e `intro`, aplicar a regra de "faltam 5 ou menos" em `AnnouncementsPage` e `NewAnnouncementPage`, ajustar o JSON e apagar as chaves sem uso após `grep` — cobre CA1 a CA4, CA6 — prova: `cd frontend && npm run typecheck && npm run lint`
- [x] T2: Ajustar os testes (limiares 3, 15, 19 e 20 de 20; ausência dos textos removidos; celular) — cobre CA1 a CA4, CA5 — prova: `cd frontend && npm test -- AnnouncementsPage NewAnnouncementPage AnnounceLessonDialog OrganizationAnnouncementDialog`
- [x] T3: Capturas do sistema e do canvas em `.capturas/720/` (1440 e 390, pt-BR), `npm run visual:canvas`, regerar só as referências dos casos de CA7 com `-- --update-snapshots -g "<caso>"` e conferir os mesmos casos sem `--update-snapshots` — cobre CA7 — prova: `cd frontend && npm run test:visual:docker -- -g "comunicados|aula-avisar-turma"`
- [x] T4: Regressão local reduzida (`npm run lint && npm run typecheck && npm run build && npm test`; `npm run e2e -- comunicados.spec.ts`) e lista tela por tela para o PR, com `Regressão local` e `Comparação com o canvas` registrados — cobre CA6, CA7 — prova: os comandos acima

## 6. Decisões

- D1: Parte d da #646 (aprovada pelo dono em 25/11/2026); a #646 fecha na #721.
- D2: Avisar turma fica como está: o subtítulo "Aberto a partir da aula {{day}}, {{date}}" identifica o registro de onde a janela abriu (a #646 mantém esses subtítulos) e `lesson.cancelledNote` orienta que o aviso sai por ali, não é nota de regra interna. Alternativa descartada: tirar a nota; se o dono quiser, é item à parte.
- D3: A #646 e o RF-COM-01 pedem o limite "só quando faltam 5 ou menos". Leitura adotada: mostrar "N de 20" quando restam de 1 a 5 vagas; com 0 vagas a faixa amarela já diz o limite e o subtítulo some; na lista, o nome da unidade sai da frase (a unidade já está no seletor da moldura). Alternativa descartada: mostrar também com 0 vagas (repetiria a faixa). Se o limite da unidade vier diferente de 20, a regra usa `limit - used` do dia.
- D4: `OrganizationAnnouncementDialog` ("Limite próprio da organização: 1 de 20 hoje…") fica: é aviso dentro da janela, junto do campo, e não está na lista da #646.
- D5: Sem caso visual novo; a referência muda pela falta dos textos.

## Construção

- T1 — arquivos: `AnnouncementsPage.tsx`, `NewAnnouncementPage.tsx`, `i18n/pt-BR.json` (apagadas `scopeUnit`, `scopeAll`, `subtitle`, `subtitleMobile`, `note`, `new.intro`, `new.subtitleUnit`; textos novos de `subtitleUsed` e `new.subtitle`) — prova: `npm run typecheck && npm run lint` → passou; `grep` das chaves em src, e2e e visual sem uso.
- T2 — arquivos: `AnnouncementsPage.test.tsx`, `NewAnnouncementPage.test.tsx` (teste novo com 3 e 16 de 20) — prova: `npm test -- AnnouncementsPage NewAnnouncementPage AnnounceLessonDialog OrganizationAnnouncementDialog` → 70 de 70.
- T3 — referências regeradas com `--update-snapshots -g "comunicados|aula-avisar-turma"`; conferência sem `--update-snapshots` → 32 passaram; `npm run visual:canvas` → 165 comparadas, 0 reprovadas.
- T4 — `npm run build` ok; `npm test` → 277 arquivos, 3043 testes passaram; `npm run e2e -- comunicados.spec.ts` → 1 passou.
Regressão: lint, typecheck, build, npm test e e2e do spec, sem falhas.
Visual do CI: comunicados, comunicados-novo, comunicados-cancelar, comunicados-limite, comunicados-organizacao, comunicados-celular, comunicados-novo-celular, aula-avisar-turma → passou (local, container); suíte inteira fica para o CI.
Referências visuais: `frontend/visual/referencias/comunicados-{,cancelar-,celular-,limite-,novo-,novo-celular-}{1440,390}-{claro,escuro}.png` e `comunicados-organizacao-1440-{claro,escuro}.png`; `aula-avisar-turma` sem mudança.
Desvios: as capturas lado a lado em `.capturas/720/` não foram salvas à mão; a comparação foi pelo `visual:canvas` (0 reprovadas). Em `AnnouncementsPage.test.tsx` não se afirma ausência do texto "Tijuca" no celular, porque o seletor de unidade da moldura o mostra.
Não é do item: nada.

## Verificação

### Rodada 1 — OK — 2026-11-25, estado 0f2b8808d23687e735a90da81e84193dbfa3eac7

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `AnnouncementsPage.test.tsx` (CA1/CA3 e CA17 celular) verde; código só passa `subtitle` quando `unitName` e faltam 1 a 5 |
| CA2 | PASSOU | teste CA8: 3 sem subtítulo, 15 e 19 com "N de 20 enviados hoje", 20 só faixa e botão desabilitado |
| CA3 | PASSOU | `footer` com `announcements.note` removido; teste confere ausência |
| CA4 | PASSOU | `NewAnnouncementPage.test.tsx` (3 e 16 de 20); cabeçalho compacto sem `subtitle={unitName}` |
| CA5 | PASSOU | `AnnounceLessonDialog` fora do diff; visual `aula-avisar-turma` passou sem mudança |
| CA6 | PASSOU | lint e `npm test` verdes; `grep` das chaves removidas em src, e2e e visual sem resultado |
| CA7 | PASSOU | `test:visual:docker -g "comunicados\|aula-avisar-turma"` sem `--update-snapshots` → 32 passaram; lado a lado de `docs/design/prints/lado-a-lado/` aberto (comunicados e comunicados-novo 1440): só difere do canvas no subtítulo e no rodapé, que a #646 manda tirar |

Comandos: `npm run lint && npm run typecheck && npm run build` → ok; `npm test` → 277 arquivos, 3043 testes passaram; `npm run e2e -- comunicados.spec.ts` → 1 passou; visual acima → 32 passaram. Back-end não tocado.
Instáveis: nenhum.
Achados:
- sugestão, código, `AnnouncementsPage.tsx` (`cards={...}      />` na mesma linha) e `AnnouncementsPage.test.tsx` (CA17, `toBeNull();    expect(...)`) — quebras de linha perdidas na edição; arrumar o espaçamento. `NewAnnouncementPage.test.tsx` tem linha em branco dupla.
- sugestão, processo — `.capturas/720/` não existe (o item registra o desvio); a conferência foi feita pelos lado a lado do `visual:canvas`, aceitos pela autonomia 3.

## Entrega

- O que muda: cabeçalhos de Comunicados (`AnnouncementsPage`) e de Novo comunicado (`NewAnnouncementPage`) sem subtítulo, rodapé e `intro`; o contador "N de 20 enviados hoje" aparece só quando faltam de 1 a 5 vagas (com 0 vagas, a faixa amarela já diz o limite). Chaves de tradução sem uso apagadas.
- Verificação: rodada 1 OK (estado `0f2b8808`). Lint, typecheck, build e `npm test` (277 arquivos, 3043 testes) verdes; e2e `comunicados.spec.ts` verde; visual `comunicados|aula-avisar-turma` 32 passaram local; `visual:canvas` 165 comparadas, 0 reprovadas.
- Decisões: D1 a D5 do arquivo (parte d da #646; `OrganizationAnnouncementDialog` e `AnnounceLessonDialog` fora do escopo; sem caso visual novo).
- Limitações: `.capturas/720/` não foi salvo à mão; a comparação com o canvas foi pelo `visual:canvas`, aceita pela autonomia 3. Divergências restantes com o canvas (subtítulo e rodapé) são as que a #646 manda tirar. A conferência da suíte visual inteira fica para o job `visual` do CI.
- Não é do item: nada.
