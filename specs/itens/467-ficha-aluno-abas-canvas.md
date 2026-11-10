# 467 — Ficha do aluno: abas Matrícula, Financeiro, Graduações, Responsáveis e Histórico no visual do canvas

Origem: issue #467 (Sprint 10.5, Fase 3, plano P3), `docs/auditoria/plano-de-issues.md`, `docs/auditoria/decisoes-canvas.md`. Branch: `item/467-ficha-aluno-abas-canvas`. Canvas: `AlunoMatricula`, `AlunoFinanceiro`, `AlunoHistorico`, `AlunoResponsaveis`, `AlunoGraduacoes` (aba que a issue cita sem link), `GMFichaMatricula`, `GMFichaFinanceiro`, `GMFichaResponsaveis`. Dependências já em `dev`: #449, #450, #452, #458, #459, #466 (backlog: feito). Partes: A (T1 a T3, Matrícula e Graduações), B (T4 e T5, Financeiro) e C (T6 a T9, Responsáveis, Histórico e prova visual); cada parte cabe em uma sessão, o item é um só.

## 1. Objetivo

Deixar as abas da ficha do aluno (painel lateral aberto de Alunos) iguais ao canvas em layout, textos, rótulos, botões e janelas, a 1440 e 390 px, nos dois temas: Matrícula (linha de limite, "Adicionar modalidade", cartões com selo, grade e ordem de botões, bloco "Situação do aluno"), Financeiro (cartões de resumo, nota, "Nova cobrança avulsa", tabela com ação por linha; no celular, "Em aberto" e "Pagos"), Graduações (aba visível com "Em breve"), Responsáveis (aviso, cartão por responsável, limite) e Histórico (filtros, tabela Quando/Quem/O que aconteceu/Área, "Ver na auditoria"). Para Coordenador e Administrador; o Professor segue só com Resumo e Responsáveis.

Fora do escopo: backend e dados novos na API (D1); janelas de encerrar, trocar, transferir e desligar (#468); inativar, reativar e "Cancelar cobranças acumuladas" funcionais e o alerta de bloqueio por modalidade (Sprint 12, #110 e #109); registro e linha do tempo de graduações (sprint futura); cabeçalho e Resumo (#466).

## 2. Requisitos

- R1: a aba Matrícula abre com a linha "Uma matrícula na organização · até 10 modalidades ativas" e o botão "Adicionar modalidade" à direita, que leva ao assistente de matrícula do aluno; fica desabilitado quando o aluno já tem 10 modalidades ativas e não aparece para quem só lê (`canEdit` falso em todas as modalidades).
- R2: cada modalidade é um cartão com o nome, selo "Ativa" em verde (ou "Encerrada" neutro, e "Encerramento solicitado"), grade de 3 colunas no desktop (Unidade, Turma principal, Outros horários, Plano, Vencimento; Benefício e Mensalidade só quando o contrato os trouxer, D1) e uma coluna no celular.
- R3: os botões do cartão ativo seguem a ordem "Trocar turma, Trocar plano, Conceder benefício, Transferir, Encerrar", com "Encerrar" em contorno vermelho (`danger`); "Conceder benefício" só com a permissão que já vale hoje; as janelas não mudam (#468).
- R4: a aba Matrícula fecha com o cartão "Situação do aluno": o texto "Ativo enquanto houver ao menos uma modalidade Ativa..." e "Inativar", "Reativar" e "Cancelar cobranças acumuladas" visíveis e desabilitados com "Em breve" (D3).
- R5: a aba Graduações deixa de ser estado vazio: mostra o texto do canvas ("Da mais recente para a mais antiga. Registros nunca são apagados; um erro vira um novo registro "Correção".") e "Registrar graduação" desabilitado com "Em breve", sem backend (D4).
- R6: a aba Financeiro abre com 3 cartões `Stat`: "Em aberto" (soma e "N cobranças"), "Em atraso" (soma e "N cobrança(s) · N dias" pelo maior atraso) e "Pago em {ano}" (soma e "N pagamentos"), calculados das cobranças do aluno; a nota "As taxas do meio de pagamento são somadas quando o aluno paga online." e o botão "Nova cobrança avulsa" (mesma regra do "Cobrar": só com Cobranças e gerência de alunos).
- R7: abaixo, a tabela Referência / Vencimento / Valor / Situação (selos coloridos, inclusive "Paga com atraso") com a ação por linha: "Registrar pagamento" nas em aberto (com a permissão que o painel da cobrança já exige), "Abrir" nas demais em aberto, "Recibo" nas pagas (abre o painel da cobrança, onde está o recibo, D2); no celular a tabela vira cartões agrupados em "Em aberto" e "Pagos".
- R8: a aba Histórico traz os filtros "Área" (Todas, Financeiro, Alunos) e "Período" (Últimos 12 meses, Todo o período), o link "Ver na auditoria" e a tabela Quando (data e hora) / Quem ("Nome · Perfil", "Sistema" sem ator) / O que aconteceu (com o motivo quando há) / Área; a Área sai do prefixo do código da ação (D5); paginação do componente base.
- R9: a aba Responsáveis traz o aviso azul "{Nome} tem {idade} anos. Só os responsáveis entram no portal dele. Até 2 responsáveis, um deles o financeiro." para menor de 18 anos; um cartão por responsável com avatar colorido, nome, telefone formatado, selo "Responsável financeiro" ou "Com acesso" e as ações "Reenviar convite" (acesso pendente), "Tornar financeiro" (não financeiro) e "Desvincular" em estilos diferentes, só para quem pode gerir; no celular, o telefone abre o WhatsApp.
- R10: "Vincular responsável" fica em largura total no celular; com 2 responsáveis fica desabilitado com "Limite de 2 responsáveis atingido" ao lado; a regra do canvas ("Até dois responsáveis com acesso. O menor nunca fica sem responsável.") aparece abaixo dele.
- R11: as abas mantêm os quatro estados (carregando, vazio, erro, sem permissão), o axe passa nos dois temas, todo texto vem do pt-BR e as regras seguem valendo: o servidor decide as permissões, o front não é a barreira (D6).
- R12: casos visuais das abas, referências regeradas só das telas do item, comparação com o canvas (1440 e 390, pt-BR, `.capturas/467/`) e divergências listadas no PR (D7).

## 3. Critérios de aceite

- CA1 (R1): dado aluno ativo com 3 modalidades ativas, quando abre Matrícula, então vê a linha de limite e "Adicionar modalidade" apontando para `/alunos/nova-matricula?aluno=<id>`; com 10 ativas o botão está desabilitado.
- CA2 (R1, R11): dado usuário que só lê a matrícula, quando abre Matrícula, então não há "Adicionar modalidade" nem botões de troca.
- CA3 (R2, R3): dado modalidade ativa editável, quando abre Matrícula, então o cartão mostra selo "Ativa", a grade com Unidade, Turma principal, Outros horários, Plano e Vencimento, e os botões na ordem do canvas com "Encerrar" em `danger`; "Conceder benefício" some sem a permissão.
- CA4 (R2): dado modalidade encerrada ou com encerramento solicitado, então o selo correspondente aparece e não há botões.
- CA5 (R4): dado a aba Matrícula, então "Situação do aluno" mostra os três itens com `aria-disabled` e "Em breve", e clicar neles não faz pedido.
- CA6 (R5): dado a aba Graduações, então aparece o texto do canvas e "Registrar graduação" com "Em breve" desabilitado; nenhuma rota é chamada.
- CA7 (R6): dado cobranças de 160 em atraso há 25 dias, 180 e 160 pendentes e 17 pagas em 2026 somando 2.940,00, então os cartões mostram "R$ 500,00 · 3 cobranças", "R$ 160,00 · 1 cobrança · 25 dias" e "R$ 2.940,00 · 17 pagamentos"; sem cobrança paga o cartão mostra "R$ 0,00 · 0 pagamentos".
- CA8 (R6): dado usuário com Cobranças, quando clica "Nova cobrança avulsa", então abre a cobrança avulsa já com o aluno; sem Cobranças o botão não aparece.
- CA9 (R7): dado cobrança em atraso, quando clica "Registrar pagamento", então abre o registro de pagamento daquela cobrança e, concluído, a lista e o selo da ficha recarregam; em cobrança paga "Recibo" abre o painel da cobrança; "Paga com atraso" aparece com selo próprio.
- CA10 (R7): dado 390 px, então a tabela vira cartões em dois grupos, "Em aberto" (valor em destaque, "venceu 10/09 · 28 dias" ou "vence 10/10", "Registrar pagamento") e "Pagos" ("Pix · 09/09"), sem rolagem lateral.
- CA11 (R8): dado histórico com ações de aluno e de cobrança, quando escolhe Área "Financeiro", então só as de cobrança aparecem; com Período "Últimos 12 meses" somem as mais antigas; "Sistema" aparece quando `actor` é nulo; "Ver na auditoria" é um link.
- CA12 (R8): dado histórico vazio ou filtro sem resultado, então estado vazio; sem permissão, estado "sem permissão"; erro, estado de erro com "Tentar de novo".
- CA13 (R9): dado menor de 9 anos com 2 responsáveis, então o aviso aparece com o nome e a idade, o financeiro tem o selo "Responsável financeiro", o pendente tem "Reenviar convite" e "Tornar financeiro" e todos têm "Desvincular"; adulto não tem o aviso.
- CA14 (R10): dado 2 responsáveis, então "Vincular responsável" está desabilitado com "Limite de 2 responsáveis atingido"; com 1 está habilitado e abre a janela de vínculo.
- CA15 (R9, R11): dado responsável sem permissão de gerir (Professor, ou leitura), então as ações e "Vincular responsável" não aparecem; recusa do servidor ao vincular, desvincular ou tornar financeiro continua aparecendo no aviso vermelho sem fechar o painel.
- CA16 (R11): dado cada aba, então os quatro estados funcionam e o axe passa nos temas claro e escuro.
- CA17 (R12): dado `npm run visual:canvas`, então as telas do item ficam dentro do limite; as divergências restantes entram como `limiteCanvas` com motivo e issue (D7), e o PR as lista.

## 4. Plano técnico

- Dados: não muda.
- API: não muda (D1). `docs/openapi.yaml` e MSW ficam como estão; o MSW só ganha dado onde o caso visual precisa (cobranças pagas e histórico com ações de cobrança, modalidades e responsáveis do aluno do caso).
- Interface: abas Matrícula, Financeiro, Graduações, Responsáveis e Histórico da ficha, no desktop e no celular; a ficha continua painel lateral (D1 da #466).
- Segurança: não se aplica além do que existe: o servidor decide `canEdit` e as permissões; o front só esconde o que a pessoa não pode usar. CPF do responsável não é exibido (D1: o contrato não o traz).
- Arquivos (todos vistos no repositório, em `frontend/src/features/students/` salvo indicação):
  - `RecordEnrollment.tsx`: `ModalityCard` (selo `StatusBadge`, grade 3 colunas, `Encerrar` em `variant="danger"`, ordem dos botões) e topo com a linha de limite e `NewEnrollmentLink` com `studentId`; novo bloco "Situação do aluno" com `ComingSoon`. `NewEnrollmentLink.tsx`: aceitar `disabled` e o ícone + (já tem o texto "Adicionar modalidade"? conferir `enrollmentWizard.open`; se o texto for outro, usar chave nova em `students.record.enrollment`).
  - `StudentRecordPanel.tsx`: aba `graduations` (hoje `LATER`) passa a renderizar o novo `RecordGraduations` (a criar, pequeno: texto e `ComingSoon`); `LATER` sai.
  - `StudentFinancialTab.tsx`: reescrito com `Stat` ×3, nota, "Nova cobrança avulsa" (`OneOffChargeDialog` com `student`, já feito na #466), `DataTable`/`RowCard` (#458) e seções "Em aberto" e "Pagos"; reutiliza `ChargePanel`, `StatusBadge` e `RegisterPaymentDialog` (`features/payments`). Funções puras de resumo (somas, atraso em dias com a data no fuso da unidade) em `studentFinancialSummary.ts` (a criar), com teste.
  - `RecordHistory.tsx`: filtros com `PillFilter` (#456), link "Ver na auditoria" (rota de auditoria existente; se não existir, `ComingSoon` link, conferir em `App.tsx`), `DataTable` e `CanvasPagination`; `useStudentRecord.ts`: `useStudentHistory` passa a pedir `size=100` e a paginação e os filtros ficam no front (D5).
  - `RecordGuardians.tsx`: aviso `Banner` info, `PersonRow` (#459) com avatar, selos `StatusBadge`, botões em estilos diferentes (`secondary`, `danger`), limite com texto ao lado, regra abaixo, `WhatsAppButton` no celular; mantém `run`, `ConfirmDialog` e `GuardianLinkDialog`.
  - `frontend/src/i18n/pt-BR.json`: chaves novas em `students.record.{enrollment,financial,history,guardians,graduations}`.
  - `frontend/src/mocks/handlers.ts` e fixtures: dados para os casos visuais.
  - `frontend/visual/casos.ts`: casos `ficha-aluno-matricula`, `-financeiro`, `-historico`, `-responsaveis` e `-graduacoes` (rota da ficha com `?aba=` ou passo que clica na aba, como `aluno-encerrar-modalidade` já faz), referências PNG em `frontend/visual/referencias/` e `docs/design/README.md` (lista de telas cobertas).
  - Testes: `RecordEnrollment.test.tsx`, `StudentFinancialTab.test.tsx`, `StudentGuardiansTab.test.tsx`, `StudentRecordPanel.test.tsx` atualizados; novos `RecordHistory.test.tsx`, `RecordGraduations.test.tsx`, `studentFinancialSummary.test.ts`.
- Reuso: `Stat`, `StatusBadge`, `Avatar`/`PersonRow`, `PillFilter`, `DataTable`/`RowCard`, `ComingSoon`, `Banner`, `Button` (`danger`), `ChargePanel`, `RegisterPaymentDialog`, `OneOffChargeDialog`, `GuardianLinkDialog`, `ConfirmDialog`, `LoadingState`/`EmptyState`/`ErrorState`/`ForbiddenState`.
- Riscos: (1) `size=100` nas cobranças e no histórico trunca contas muito antigas; "Pago em {ano}" e o filtro de período valem sobre as 100 mais recentes (limite aceito, D5); (2) as janelas de ação seguem as de hoje e a #468 as troca: não mexer nelas aqui para não gerar conflito; (3) testes existentes das abas procuram textos antigos ("Nova matrícula", "Financeiro"/"Acesso pendente"); serão atualizados; (4) o estado visual de `limiteCanvas` depende da medida real e pode exigir ajuste de limite.

## 5. Tarefas

### Parte A: Matrícula e Graduações

- [x] T1: `RecordEnrollment` no layout do canvas (linha de limite, "Adicionar modalidade", cartão com selo e grade, ordem dos botões, "Encerrar" em `danger`, celular em uma coluna) — cobre CA1, CA2, CA3, CA4 — prova: `cd frontend && npx vitest run src/features/students/RecordEnrollment`
- [x] T2: bloco "Situação do aluno" em Em breve e aba Graduações (`RecordGraduations`, `LATER` removido) — cobre CA5, CA6 — prova: `cd frontend && npx vitest run src/features/students/StudentRecordPanel src/features/students/RecordGraduations`
- [x] T3: textos pt-BR das duas abas e conferência de estados e axe — cobre CA16 (Matrícula e Graduações) — prova: `cd frontend && npx vitest run src/features/students/RecordEnrollment src/test/a11y.test.tsx src/i18n && npm run lint`

### Parte B: Financeiro

- [x] T4: `studentFinancialSummary.ts` (somas, contagens, dias de atraso no fuso da unidade, agrupamento Em aberto e Pagos) com teste — cobre CA7 — prova: `cd frontend && npx vitest run src/features/students/studentFinancialSummary`
- [x] T5: `StudentFinancialTab` com cartões, nota, "Nova cobrança avulsa", tabela e ação por linha, cartões agrupados no celular, estados — cobre CA8, CA9, CA10, CA16 — prova: `cd frontend && npx vitest run src/features/students/StudentFinancialTab src/features/students/StudentRecordPanel`

### Parte C: Responsáveis, Histórico e prova visual

- [x] T6: `RecordHistory` com filtros, link, tabela, Área pelo prefixo, `useStudentHistory` com `size=100` e paginação no front, estados — cobre CA11, CA12, CA16 — prova: `cd frontend && npx vitest run src/features/students/RecordHistory`
- [x] T7: `RecordGuardians` no layout do canvas (aviso, `PersonRow`, selos, ações em estilos diferentes, limite, regra, WhatsApp no celular) preservando recusas do servidor e permissões — cobre CA13, CA14, CA15, CA16 — prova: `cd frontend && npx vitest run src/features/students/StudentGuardiansTab src/features/students/StudentRecordPanel`
- [x] T8: casos visuais das cinco abas e dados do MSW, referências no container, comparação com o canvas (1440 e 390, pt-BR, `.capturas/467/`), `docs/design/README.md` — cobre CA17 — prova: `cd frontend && npx vitest run visual/casos.test.ts src/components/design-readme.test.ts && npm run test:visual:docker -- --update-snapshots -g "ficha-aluno" && npm run visual:canvas`
- [x] T9: regressão do que a pasta toca e e2e da ficha — não cobre critério novo: fecha a parte C com a regressão de `AGENTS.md` — prova: `cd frontend && npx vitest run src/features/students src/features/charges src/mocks && npm run lint && npm run typecheck && npx playwright test e2e/alunos.spec.ts e2e/matricula.spec.ts`

## 6. Decisões

- D1: o item é só de front-end e não muda o contrato nem o backend; os dados que o canvas mostra e a API não traz hoje ficam de fora e entram no PR como divergência com motivo: valor do plano, Benefício e Mensalidade do cartão, dias e horários da turma, bloqueio por modalidade, parentesco, CPF mascarado e situação do portal do responsável ("Acessou em...", "Convite enviado em... vale até..."), selo do canvas "Ativa/Bloqueia" por data. Motivo: a regra "a API muda para igualar o canvas" vale, mas exige backend, OpenAPI e MSW juntos e a issue é só `front-end` (a #466 fez o mesmo, D3 e D4). Alternativa: ampliar `EnrollmentModality`, `StudentGuardianRow` e o histórico no backend, descartada aqui por tamanho; vira item próprio (ver "Fora do item").
- D2: "Recibo" na linha paga abre o `ChargePanel`, onde já estão o número e o download do recibo, porque `ChargeRow.payment` não traz o código do recibo. Alternativa: baixar direto da linha, descartada (exige `receipt` na lista; contrato).
- D3 (muda o comportamento): "Inativar", "Reativar" e "Cancelar cobranças acumuladas" aparecem visíveis e desabilitados com "Em breve", porque dependem da inativação (Sprint 12, #110). Alternativa: omitir, descartada (R3 do canvas pede visível e desabilitado).
- D4: a aba Graduações mostra o texto e "Registrar graduação" em Em breve, sem linha do tempo, porque não há graduação do aluno no contrato. Alternativa: manter o estado vazio, descartada (o canvas já tem a tela).
- D5 (muda o comportamento): os filtros Área e Período do Histórico atuam no front sobre as 100 entradas mais recentes (a API só pagina), a Área vem do prefixo do código da ação (`student.*` e demais de aluno → "Alunos"; `charge.*`, `payment.*`, `reminder.*` → "Financeiro"; desconhecido → "Alunos") e a paginação passa a ser local. Teto: contas com mais de 100 registros nos 12 meses não mostram os mais antigos; plano B: item de API com `area`, `from` e `to` (sugerido abaixo). Alternativa: filtros em Em breve, descartada (o dado existe).
- D6: nenhuma permissão muda; o que a pessoa não pode usar continua oculto e o servidor segue como barreira. "Adicionar modalidade" aparece para quem tem alguma modalidade editável ou aluno ex-aluno ou sem matrícula (a lista atual de ex-aluno mostra "Nova matrícula" hoje).
- D7: divergências que o item não resolve (D1, D3, D4) entram como `limiteCanvas` com motivo e a issue que as remove; como nenhuma issue da Sprint 10.5 as cobre, o maestro cria o item sugerido abaixo (backend e contrato) e o limite cita seu número; antes disso o limite cita D1 desta especificação. Alternativa: pendência para o dono, descartada (é escolha de processo, `AGENTS.md`, Autonomia 4).
- Suposição: `NewEnrollmentLink` com `studentId` abre o assistente do aluno também quando ele está ativo (hoje só é usado para ex-aluno); se o assistente recusar aluno ativo, "Adicionar modalidade" passa a usar o caminho que o assistente já aceita para nova modalidade, sem mudar o assistente.
- Suposição: existe rota de auditoria da organização para "Ver na auditoria"; se não existir, o link vira `ComingSoon` (variant `link`) e entra no PR.
- Suposição: a aba Responsáveis do Professor segue só com nome, telefone e e-mail (visão reduzida), sem avatar de ações.
- Fora do item (sugestão): item de backend e contrato para o que o canvas mostra e a API não traz: `plan`/`benefit`/`monthly` e horários da turma por modalidade, parentesco, CPF mascarado e situação do portal por responsável, `receipt` na linha de cobrança paga, e `area`, `from`, `to` no histórico do aluno (remove os `limiteCanvas` das abas); item de graduações do aluno (linha do tempo e registro); inativação e reativação do aluno (já é a #109 e a #110).

## Construção

Partes A, B e C feitas (T1 a T9).

- T1 — arquivos: `RecordEnrollment.tsx`, `NewEnrollmentLink.tsx` (props `label` e `disabled`), `RecordEnrollment.test.tsx`, `pt-BR.json` — prova: `npx vitest run src/features/students/RecordEnrollment` → 15 passaram
- T2 — arquivos: `RecordGraduations.tsx` e teste, `StudentRecordPanel.tsx` (`LATER` removido), `StudentRecordPanel.test.tsx`, `pt-BR.json` (bloco `empty` trocado por `graduations`) — prova: `npx vitest run src/features/students/StudentRecordPanel src/features/students/RecordGraduations` → passaram
- T3 — prova: `npx vitest run src/features/students/RecordEnrollment src/features/students/StudentRecordPanel src/features/students/RecordGraduations src/test/a11y.test.tsx src/i18n` → 6 arquivos, 62 testes passaram; `npm run lint` e `npm run typecheck` limpos
- T4 — arquivos: `studentFinancialSummary.ts` e teste — prova: `npx vitest run src/features/students/studentFinancialSummary` → 4 passaram
- T5 — arquivos: `StudentFinancialTab.tsx` (prop `onCharge`, `useBelowSm` para os cartões do celular), `StudentRecordPanel.tsx`, `StudentFinancialTab.test.tsx`, `pt-BR.json` (chave `line` removida, chaves novas em `students.record.financial`) — prova: `npx vitest run src/features/students/StudentFinancialTab src/features/students/StudentRecordPanel src/test/a11y.test.tsx src/i18n` → 5 arquivos, 58 testes passaram; `npm run lint` e `npm run typecheck` limpos
Regressão: não rodada nesta parte (fica para a parte C, T9).
Desvios (parte B): "Em aberto" inclui "Em conferência"; cobranças canceladas, renegociadas e estornadas vão num terceiro grupo "Outras" no celular; "Registrar pagamento" na linha vale para pendente, vence hoje e em atraso (o servidor segue decidindo); dias de atraso e ano pago no fuso padrão da unidade (`DEFAULT_TZ`), pois a ficha não traz o fuso.
Desvios: o botão "Adicionar modalidade" aparece também para ex-aluno (D6) e o estado vazio sem modalidade mantém o link "Nova matrícula"; o teste da modalidade encerrada passou a olhar só os botões dentro do cartão, porque a página agora tem os botões "Em breve" de Situação do aluno.
Referências visuais: nenhuma regerada nesta parte (T8).
- T6 — arquivos: `RecordHistory.tsx` (filtros `PillFilter`, "Ver na auditoria" como `ComingSoon` link porque `/configuracoes/auditoria` ainda é "soon" no menu, `DataTable`, `CanvasPagination` local), `useStudentRecord.ts` (`useStudentHistory(id)` com `size=100`), `RecordHistory.test.tsx`, `StudentRecordPanel.test.tsx`, `pt-BR.json` (chaves `by`, `prev`, `next` removidas) — prova: `npx vitest run src/features/students/RecordHistory src/features/students/StudentRecordPanel` → 35 passaram
- T7 — arquivos: `RecordGuardians.tsx` (aviso `Banner` info, `PersonRow`, selos `StatusBadge`, ações `secondary`/`ghost`/`danger`, limite e regra, `WhatsAppButton` no celular), `StudentGuardiansTab.test.tsx` (selos novos e 2 testes novos), `pt-BR.json` — prova: `npx vitest run src/features/students/StudentGuardiansTab src/features/students/StudentRecordPanel src/test/a11y.test.tsx src/i18n` → 55 passaram; `npm run lint` e `npm run typecheck` limpos
- T8 — arquivos: `visual/casos.ts` (5 casos `ficha-aluno-{matricula,financeiro,graduacoes,responsaveis,historico}`; as 5 telas saem de `semCaso`; Responsáveis usa o aluno menor do MSW, Heitor) — prova: `npx vitest run visual/casos.test.ts src/components/design-readme.test.ts` → 109 passaram; `npm run test:visual:docker -- --update-snapshots -g "ficha-aluno"` → 24 passaram; `npm run visual:canvas` → 110 comparadas, 0 reprovadas. Capturas em `.capturas/467/` (1440 sistema e canvas; 390 só do sistema, porque o canvas do celular tem 360 px). `docs/design/README.md` não tem lista de telas cobertas por caso, então não mudou.
- T9 — prova: `npx vitest run src/features/students src/features/charges src/mocks` → 83 arquivos, 614 testes passaram; `npm run lint` e `npm run typecheck` limpos; `npx playwright test e2e/alunos.spec.ts e2e/matricula.spec.ts` → 10 passaram
Regressão (parte C): os comandos do T9 acima; `verify`, `test:cov` e `e2e` completos não foram rodados nesta sessão (o CI do PR cobre; AGENTS.md, Autonomia 2).
Desvios (parte C): "Ver na auditoria" é `ComingSoon` (sem rota de auditoria); selo "Acesso pendente" mantido além de "Com acesso" (o canvas mostra a situação do portal em texto à parte, D1); o filtro Período usa a data do relógio do navegador (365 dias); "Tornar financeiro" em `ghost` para diferenciar dos outros botões; `limiteCanvas` dos 5 casos em 0,5 sem medida real (a comparação reportou 0 reprovadas), motivo cita D1, D3 e D4 desta especificação.
Referências visuais: `frontend/visual/referencias/ficha-aluno-{matricula,financeiro,graduacoes,responsaveis,historico}-{1440,390}-{claro,escuro}.png` (20 arquivos novos); a referência `ficha-aluno-*` existente não mudou.
Não é do item: nenhum.

## Verificação

### Rodada 1 — OK — 2026-11-10, estado ec20c4e543639638ce92b9102502773276164111

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `RecordEnrollment.test.tsx` (linha de limite, link `/alunos/nova-matricula?aluno=`, desabilitado com 10); captura `.capturas/467/matricula-1440-sistema.png` |
| CA2 | PASSOU | teste de só leitura em `RecordEnrollment.test.tsx`; `canAdd` no diff |
| CA3 | PASSOU | testes de ordem dos botões e `danger`; captura mostra a ordem do canvas |
| CA4 | PASSOU | teste da modalidade encerrada/solicitada |
| CA5 | PASSOU | `ComingSoon` x3 em Situação do aluno (captura e teste) |
| CA6 | PASSOU | `RecordGraduations.test.tsx` |
| CA7 | PASSOU | `studentFinancialSummary.test.ts` e `StudentFinancialTab.test.tsx` |
| CA8 | PASSOU | `StudentFinancialTab.test.tsx`; `onCharge` só com Cobranças |
| CA9 | PASSOU | `StudentFinancialTab.test.tsx` (Registrar pagamento, Recibo, "Paga com atraso" na captura) |
| CA10 | PASSOU | teste a 390 px com grupos "Em aberto"/"Pagos" (`useBelowSm`) |
| CA11 | PASSOU | `RecordHistory.test.tsx`; "Ver na auditoria" é `ComingSoon` link (suposição da especificação: sem rota de auditoria) |
| CA12 | PASSOU | `RecordHistory.test.tsx` (vazio, filtro sem resultado, sem permissão, erro) |
| CA13 | PASSOU | `StudentGuardiansTab.test.tsx`; captura `responsaveis-390-sistema.png` |
| CA14 | PASSOU | teste do limite de 2 |
| CA15 | PASSOU | testes de permissão e recusa do servidor mantidos |
| CA16 | PASSOU | `src/test/a11y.test.tsx` e testes de estado, verdes |
| CA17 | PASSOU | `visual:canvas` informado: 110 comparadas, 0 reprovadas; casos com `limiteCanvas` e motivo citando D1/D3/D4; capturas 1440 do sistema e do canvas abertas e comparadas |

Comandos:
- `npx vitest run src/features/students src/features/charges src/mocks src/test/a11y.test.tsx src/i18n visual/casos.test.ts src/components/design-readme.test.ts` → 88 arquivos, 739 testes passaram
- `npm run lint` e `npm run typecheck` → limpos
- `verify`, `test:cov`, `e2e` completos, `test:visual:docker` e `visual:canvas` não reexecutados aqui (o CI do PR cobre; AGENTS.md, Autonomia 2 e 3)

Achados:
- sugestão, código, `frontend/visual/casos.ts` — os 5 `limiteCanvas` estão em 0,5 sem medida real; medir e apertar para o valor observado.
- sugestão, código, `RecordHistory.tsx` — `rowKey` `${at}-${action}` pode repetir para duas ações iguais no mesmo instante.
- sugestão, código, `RecordEnrollment`/`NewEnrollmentLink` — "Adicionar modalidade" é botão preto cheio; no canvas é de contorno.
- sugestão, código, `RecordEnrollment.tsx` — JSX dos botões do cartão com indentação quebrada (filhos em coluna 0).

Instáveis: nenhum.

## Entrega

- O que muda: a ficha do aluno ganha as abas Matrícula, Financeiro, Graduações, Responsáveis e Histórico no visual do canvas, com o celular a 390 px. Só front-end: sem mudança de contrato, backend ou permissão.
- Verificação: rodada 1 OK (estado `ec20c4e543639638ce92b9102502773276164111`), 17 critérios passaram; `vitest` nas áreas do item → 739 testes passaram; `lint` e `typecheck` limpos; `visual:canvas` → 110 comparadas, 0 reprovadas.
- Regressão: `verify`, `test:cov` e `e2e` completos não foram rodados nesta fase; a base `dev` não avançou desde a verificação, então a regressão da verificação vale. O CI do PR cobre o restante.
- Decisões que quem ler precisa saber: D1 a D7 da especificação. O que o canvas mostra e a API não traz (valor do plano, Benefício e Mensalidade, parentesco, CPF mascarado, situação do portal do responsável, recibo na linha paga, histórico sem `area`/`from`/`to`) fica de fora como divergência com `limiteCanvas`, e Graduações mostra "Registrar graduação" em Em breve.
- Limitação aberta: os `limiteCanvas` das cinco abas (0,5) citam "item de contrato sugerido na #467", sem número de issue. Nenhuma issue aberta cobre esse contrato hoje; ao criá-la, citar o número nos `limiteCanvas` e acrescentar a remoção ao "Pronto quando" dela (AGENTS.md, Autonomia 4).
- Sugestões da verificação não corrigidas (não bloqueiam): `rowKey` do Histórico pode repetir; botão "Adicionar modalidade" é preto cheio, no canvas é de contorno; indentação do JSX dos botões do cartão em `RecordEnrollment.tsx`; `limiteCanvas` em 0,5 sem medida real.
- Instáveis: nenhum.

### Correção da entrega
- CI do PR #550 vermelho (`frontend` e `visual`): (1) `telasCanvas421.test.ts` reprovava `RecordGraduations.tsx` porque o comentário "#467" casava com o regex de cor fixa — arquivos: `frontend/src/features/students/RecordGraduations.tsx` (comentário agora "item 467") — prova: `npx vitest run src/features/telasCanvas421` → 38 passaram; (2) a referência `aluno-encerrar-modalidade-1440-{claro,escuro}` mudou com a nova aba Matrícula e não foi regerada — arquivos: `frontend/visual/referencias/aluno-encerrar-modalidade-1440-claro.png` e `-escuro.png` — prova: `npm run test:visual:docker -- --update-snapshots -g "aluno-encerrar-modalidade"` → 4 passaram; `npm run visual:canvas -- --exige` → 110 comparadas, 0 reprovadas
Referências visuais: `frontend/visual/referencias/aluno-encerrar-modalidade-1440-{claro,escuro}.png`
Sugestões opcionais da verificação não feitas.

### Rodada 2 — OK — 2026-11-10, estado ec20c4e543639638ce92b9102502773276164111 + correção da entrega (comentário em `RecordGraduations.tsx` e 2 referências `aluno-encerrar-modalidade-1440-{claro,escuro}`)

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA16 | PASSOU | mantido da rodada 1; a mudança de código é só um comentário; testes das áreas reexecutados |
| CA17 | PASSOU | mantido da rodada 1; as referências regeradas só mudam o cartão da aba Matrícula (nova), coerente com o item; `test:visual:docker` e `visual:canvas` não reexecutados aqui (Autonomia 3; o CI do PR cobre) |

Correção da entrega: (1) comentário "#467" trocado por "item 467" em `RecordGraduations.tsx`; `telasCanvas421` passou dentro da execução abaixo. (2) referências do `aluno-encerrar-modalidade` regeradas, só nesses 2 arquivos, da tela tocada pelo item.

Comandos:
- `npx vitest run src/features/telasCanvas421 src/features/students src/test/a11y.test.tsx visual/casos.test.ts` → 20 arquivos, 355 testes passaram
- `npm run lint` e `npm run typecheck` → limpos
- `verify`, `test:cov`, `e2e`, `test:visual:docker` não reexecutados (CI do PR, Autonomia 2)

Achados:
- sugestão, código — mantidas as 4 sugestões da rodada 1 (não bloqueiam).

Instáveis: nenhum.

### Rodada 3 — OK — 2026-11-10, estado 5b4be183c1fa6bcbf53b56bcb6bda2090d65e3e7

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA16 | PASSOU | mantido da rodada 2; reexecutados `src/features/students`, `telasCanvas421`, `a11y` |
| CA17 | PASSOU | mantido da rodada 2; diff desde a rodada 1 é só o comentário de `RecordGraduations.tsx` e as 2 referências `aluno-encerrar-modalidade-1440-{claro,escuro}` (coerentes com a nova aba Matrícula) |

Comandos:
- `npx vitest run src/features/telasCanvas421 src/features/students src/test/a11y.test.tsx visual/casos.test.ts` → 20 arquivos, 355 testes passaram (inclui a regra de cor fixa que reprovava no CI)
- `npm run lint` e `npm run typecheck` → limpos
- `verify`, `test:cov`, `e2e`, `test:visual:docker`, `visual:canvas` não reexecutados (CI do PR, Autonomia 2 e 3)

Achados:
- sugestão, código — mantidas as 4 sugestões da rodada 1 (não bloqueiam).

Instáveis: nenhum.
