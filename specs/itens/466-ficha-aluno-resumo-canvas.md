# 466 — Ficha do aluno: cabeçalho, Resumo e celular no visual do canvas

Origem: issue #466 (Sprint 10.5, Fase 3, plano P2), `docs/auditoria/plano-de-issues.md`, `docs/auditoria/decisoes-canvas.md` (decisão 8). Branch: `item/466-ficha-aluno-resumo-canvas`. Canvas: `AlunoDetalhes`, `GMFicha`, `FichaProfessor` (mesma ficha com perfil Professor), `AlunoEditar`, `GMAlunoEditar`. Dependências já em `dev`: #449, #450, #452, #460, #461, #463 (confirmado no backlog). Partes: A (T1 a T4, ficha) e B (T5 a T7, janela Editar dados e prova visual); cada parte cabe em uma sessão, o item é um só.

## 1. Objetivo

Deixar a ficha do aluno (painel lateral aberto de Alunos e do Professor pela aula) igual ao canvas no cabeçalho (avatar colorido, nome em fonte de título, "idade · aluno desde mm/aaaa · unidade", selos coloridos, "WhatsApp" verde, "Cobrar", "⋯" em "Em breve"), nas abas (rótulo "Matrícula", sublinhado de marca, rolagem lateral no celular) e no Resumo (Modalidades, Contato em grade, Próximo vencimento, Termo, ações no rodapé), inclusive a 390 px, e a janela "Editar dados pessoais" no layout do canvas. Para a gestão e o Professor.

Fora do escopo: conteúdo das abas Matrícula, Financeiro, Graduações, Responsáveis e Histórico (#467); janelas de encerrar, trocar, transferir e desligar (#468); aviso "Pendências" de bloqueio (depende da inativação, Sprint 12, #109; D3); faixa na tabela de Modalidades (Sprint 12); "Baixar dados do aluno" e "Anonimizar aluno" funcionais (D4); menu "⋯" funcional; backend, OpenAPI e MSW de rotas (nenhum dado novo).

## 2. Requisitos

- R1: o painel não tem faixa de título no desktop: o cabeçalho traz `Avatar` grande (foto quando existe), o nome em fonte de título e caixa alta, a linha "{idade} anos · aluno desde {mm/aaaa} · {unidade}" (sem "aluno desde" quando não há matrícula ou data, e sem a data para o Professor, que não lê a matrícula) e o botão de fechar; o título "Ficha do aluno" continua como nome acessível do painel.
- R2: os selos usam `StatusBadge`/selos da #452 pelo mapa único de tons (Ativo, Ex-aluno, Sem matrícula; Em dia, Em atraso; selos do aluno como Bolsista, Novo, Termo pendente), sem contorno neutro.
- R3: "WhatsApp" é o botão verde (`variant="whatsapp"`) com ícone; "Cobrar" (com ícone, só para quem tem Cobranças e gerência de alunos) abre a janela de cobrança avulsa já com o aluno escolhido (decisão 8; RN-COB-11); "⋯" aparece como `ComingSoon` desabilitado com "Em breve"; "Editar dados" sai do cabeçalho.
- R4: o Resumo traz, na ordem do canvas, a tabela "Modalidades" (Modalidade com `ModalityDot`, Turma com unidade, Situação "Ativa" com selo; Faixa fora, D3), a seção "Contato" em grade de 2 colunas com rótulo pequeno e valor (Celular, E-mail, Endereço, Contato de emergência, Próximo vencimento, Termo de matrícula) e a linha final "Editar dados pessoais" (ação real, só gestão), "Baixar dados do aluno" e "Anonimizar aluno" (`ComingSoon`, D4).
- R5: Endereço mostra "rua, número, complemento · bairro · cidade/UF" quando `address` vem; Próximo vencimento mostra "dd/mm/aaaa · R$ valor ({N} modalidades)" da menor cobrança em aberto do aluno, "—" quando não há cobrança em aberto e não aparece para quem não lê cobranças (Professor); Termo de matrícula mostra `ComingSoon` "Em breve" (D5); campo sem dado mostra "—".
- R6: a visão do Professor (sem STUDENT_MANAGE) continua igual em regra: só Resumo e Responsáveis, sem CPF, endereço, valores, "Cobrar", "Editar dados pessoais" nem Próximo vencimento; o aviso "Visão do Professor" continua, e Dados/Modalidades do canvas `FichaProfessor` são os blocos Contato e Modalidades.
- R7: a aba "Matrícula e modalidades" passa a "Matrícula" e a aba ativa tem sublinhado de marca (token `brand`); as abas são uma faixa que rola na horizontal, sem quebrar linha, mantendo setas, Home e End.
- R8: abaixo de 640 px a ficha é tela cheia com barra "Ficha do aluno · {unidade}" e seta de voltar (fecha o painel); o cabeçalho empilha avatar, nome e linha, os selos, e os botões "WhatsApp", "Cobrar" e "⋯" abaixo; o nome não quebra por sílaba; sem rolagem lateral a 360 px; alvos de 44 px.
- R9: os quatro estados da ficha (carregando, vazio/não encontrada, erro, sem permissão) continuam com os cartões da #464.
- R10: a janela "Editar dados pessoais" usa `Modal` `size="md"` com título em caixa alta, rodapé fixo Cancelar | Salvar, campos em 2 a 4 colunas na ordem do canvas (Nome | Nascimento; CPF | Celular | E-mail; CEP | Endereço | Complemento; Bairro | Cidade | UF), asteriscos nos obrigatórios, subtítulo "Opcionais", nota "Não guardamos dados de saúde. Atestados ficam fora do sistema."; abaixo de 640 px é tela cheia com seta de voltar e barra fixa; validação e foto (RF-ALU-04) não mudam (D6). "Última alteração em ... por ..." e o diálogo de edição concorrente ficam fora: a API do aluno não traz data, autor nem versão (D8).
- R11: B21: no tema escuro "Isentar taxa" usa o campo base (sem caixa branca nativa) e o ícone do calendário dos campos de data fica visível.
- R12: nada muda na API, no contrato, no MSW de rotas, nas permissões (o servidor é a barreira); textos só em `pt-BR.json`; cores, fontes e tamanhos só por tokens; axe sem violação nos dois temas.
- R13: o caso visual `ficha-professor` mantém `limiteCanvas` 0,45 com motivo (gaveta sobre a agenda no canvas, página vazia da aula no sistema) e a remoção do limite entra no "Pronto quando" da #472 (autonomia 4, D9); entram casos `ficha-aluno` (`AlunoDetalhes`/`GMFicha`) e `aluno-editar` (`AlunoEditar`/`GMAlunoEditar`); só as referências dessas telas são regeradas.

## 3. Critérios de aceite

- CA1 (R1, R2): dada a ficha de um aluno com matrícula ativa, em atraso e selo Bolsista, então não há faixa de título visível, há avatar com iniciais coloridas, o nome em caixa alta, "34 anos · aluno desde 03/2022 · Tijuca" e os selos "Ativo" (ok), "Em atraso" (perigo) e "Bolsista" (info) por tom; o painel é achado pelo nome "Ficha do aluno"; sem matrícula, a linha é "{idade} anos · {unidade}".
- CA2 (R3): dado o perfil com STUDENT_MANAGE e COLLECTIONS, então "WhatsApp" é verde com ícone, "Cobrar" abre a janela de cobrança avulsa com o aluno já escolhido (o envio chama `POST /students/{id}/charges` com o id da ficha) e "⋯" está desabilitado com "Em breve" e sem chamada; sem COLLECTIONS, "Cobrar" não aparece.
- CA3 (R4, R5): dado o Resumo, então "Modalidades" e "Contato" estão na ordem do canvas; Endereço e Contato de emergência aparecem formatados; Próximo vencimento mostra "10/10/2026 · R$ 340,00 (2 modalidades)" para as cobranças em aberto do caso e "—" sem cobrança; Termo mostra "Em breve" desabilitado; "Baixar dados do aluno" e "Anonimizar aluno" estão desabilitados com "Em breve" e "Editar dados pessoais" abre a janela de edição.
- CA4 (R6): dado o perfil Professor, quando abro a ficha pela aula, então só vejo as abas Resumo e Responsáveis, sem "Cobrar", "Editar dados pessoais", CPF, endereço nem Próximo vencimento, com o aviso da visão do Professor; a 360 px não há rolagem lateral.
- CA5 (R7): dada a ficha, então a aba "Matrícula" substitui "Matrícula e modalidades", a aba ativa tem o sublinhado de marca, as abas ficam em uma linha que rola na horizontal a 390 px, e ArrowRight, ArrowLeft, Home e End seguem movendo foco e seleção.
- CA6 (R8): dada a janela de 390 px, então a ficha ocupa a tela, a barra mostra "Ficha do aluno" e "Tijuca" com a seta que fecha o painel e volta à lista, o nome aparece inteiro, quebrando só entre palavras, os botões ficam abaixo do cabeçalho e a 360 px não há rolagem lateral.
- CA7 (R9): dadas as respostas 500, 403 e 404 e a consulta em andamento, então aparecem o erro com "Tentar de novo" que recarrega, o sem permissão, "aluno não encontrado" e o carregando.
- CA8 (R10): dada a janela "Editar dados pessoais", então o título é em caixa alta, os campos estão na grade do canvas com asterisco nos obrigatórios, "Opcionais" e a nota de saúde aparecem, Cancelar e Salvar ficam no rodapé fixo; salvar com dado inválido mostra os erros de hoje e salvar com sucesso fecha e atualiza a ficha; a 390 px é tela cheia.
- CA9 (R11): dado o tema escuro, então o axe passa nas janelas de benefício (Isentar taxa) e de edição (data de nascimento) e o campo de data tem ícone com contraste.
- CA10 (R12): dada qualquer ação, então chamadas e parâmetros são os de hoje; `ContractRoutesTest` e o contrato não mudam; `npm run lint` sem texto literal; `tokens.test.ts` passa; axe nos dois temas na ficha e nas duas janelas.
- CA11 (R13): `npm run test:visual:docker -- --update-snapshots=all -g "ficha|aluno-editar"` passa; `npm run visual:canvas -- --exige` não reprova com `ficha-professor` no `limiteCanvas` 0,45 com motivo, e o "Pronto quando" da #472 traz a remoção desse limite; capturas em `.capturas/466/` (`<tela>-<largura>-{sistema,canvas}.png`, pt-BR, 1440 e 390); `git status` mostra só os PNG previstos.

## 4. Plano técnico

- Dados / API / Segurança: não mudam. A ficha continua lendo `StudentRecord` (reduzido para o Professor), `useEnrollment` (só gestão) e `useStudentCharges` (só quem tem Cobranças); nenhum dado novo é pedido ao Professor; telefone e endereço só aparecem quando o servidor os manda.
- Interface:
  - `frontend/src/features/students/StudentRecordPanel.tsx` (existe; `Header`, `Tabs`, `Body`, `StudentRecordPanel`): `Header` com `Avatar`/foto grandes, nome em `font-heading uppercase`, linha de idade/desde/unidade, `StatusBadge` e selos pelo mapa; botões `WhatsAppButton variant="whatsapp"`, "Cobrar" (ícone) e `ComingSoon` "⋯"; remove o botão "Editar dados" (a ação vai para `RecordSummary` por `onEdit`); `Tabs` interna com `overflow-x-auto flex-nowrap` e aba ativa com `border-brand`; barra do celular com seta de voltar (`ArrowLeft` do lucide), "Ficha do aluno" e unidade; estado de "Cobrar" abre `OneOffChargeDialog` com `student`.
  - `frontend/src/components/SidePanel.tsx` e `frontend/src/components/Modal.tsx` (existem): opção para esconder a faixa de título no desktop mantendo `Dialog.Title` só para leitor de tela e deixar o fechar com o chamador; sem a opção, nada muda (outras telas usam).
  - `frontend/src/features/students/RecordSummary.tsx` (existe; `Line`, `RecordSummary`): reescrito em blocos "Modalidades" (tabela com `ModalityDot`, turma e unidade, `StatusBadge` "Ativa"), "Contato" (`dl` em grade de 2 colunas, rótulo pequeno) e linha final de ações; recebe `charges`, `onEdit`, `canEdit`; Responsáveis continua; emergência entra no Contato; unidade, faixa etária e nascimento ficam como últimas linhas do Contato (D7).
  - `frontend/src/features/charges/OneOffChargeDialog.tsx` e `StudentSearch.tsx` (existem): prop opcional `student?: { id: string; name: string }` que pré-escolhe o aluno e esconde a busca; sem ela, nada muda (`ChargesPage.tsx` usa).
  - `frontend/src/features/students/StudentEditDialog.tsx` (existe; `StudentEditDialog`, `Form`): `Modal size="md"` com `footer` Cancelar | Salvar, grade `grid-cols-1 sm:grid-cols-N` por linha do canvas, asteriscos, "Opcionais", nota de saúde; tela cheia com barra e seta abaixo de 640 px; o bloco de foto fica (D6).
  - `frontend/src/components/ui/date-field.tsx` e `frontend/src/features/benefits/GrantBenefitDialog.tsx` (existem): "Isentar taxa" pelo componente base e ícone do calendário legível no escuro (B21); o builder confere qual dos dois já resolve.
  - `frontend/src/i18n/pt-BR.json` (blocos `students.record` e `students.edit`): `tabs.enrollment` "Matrícula", linha "desde", "Cobrar", "Mais ações", chaves de `summary` (modalidades, contato, endereço, próximo vencimento, termo, ações), `edit.title` "Editar dados pessoais", "Opcionais", nota de saúde.
  - `frontend/visual/casos.ts` (existe): `ficha-professor` mantém `limiteCanvas` com motivo e a #472 leva a remoção (D9); acrescenta `ficha-aluno` e `aluno-editar` (`canvasCelular` só se a largura do canvas permitir, senão comparação visual a 390 px registrada, como na #465); dados no MSW só se faltarem (endereço, emergência e cobranças em aberto do aluno do caso); o comentário "Sem caso: ficha..." é atualizado.
  - `frontend/visual/referencias/`: PNG de `ficha-professor`, `ficha-aluno` e `aluno-editar`.
  - `docs/design/README.md` (existe): nota do cabeçalho sem faixa da ficha; `frontend/src/components/design-readme.test.ts` confere.
- Reuso: `Avatar`, `PersonAvatar`, `StatusBadge`, `ModalityDot`, `ComingSoon`, `Banner`, `Button variant="whatsapp"`, estados da #464, `LastChange`, `OneOffChargeDialog`, `useStudentCharges`, `useEnrollment`, `formatDate`, `formatPhone`.
- Riscos: `StudentRecordPanel.test.tsx` (413 linhas), `StudentEditDialog.test.tsx` e e2e que procuram "Editar dados", "Matrícula e modalidades" ou o botão no cabeçalho (atualizar junto); `Modal`/`SidePanel` são usados por outras telas (a opção só liga quando pedida); `useStudentCharges` só roda com `canEdit && canCollect`, então "Cobrar" e Próximo vencimento dependem dele; foco ao fechar o painel; o Professor não lê a matrícula, então sua tabela de Modalidades segue como hoje (só aparece com `modalities`).

## 5. Tarefas

### Parte A: ficha (cabeçalho, abas, Resumo, celular)

- [x] T1: `SidePanel`/`Modal` com cabeçalho livre; novo `Header` da ficha (avatar, nome em título, linha idade/desde/unidade, selos por tom, WhatsApp verde, Cobrar, "⋯" Em breve), barra do celular com voltar e unidade, textos pt-BR — cobre CA1, CA6, CA7 — prova: `cd frontend && npx vitest run src/features/students/StudentRecordPanel src/components/Modal`
- [x] T2: abas com rótulo "Matrícula", sublinhado de marca e faixa rolável — cobre CA5 — prova: `cd frontend && npx vitest run src/features/students/StudentRecordPanel`
- [x] T3: `OneOffChargeDialog` com `student` e ligação do botão "Cobrar" — cobre CA2 — prova: `cd frontend && npx vitest run src/features/charges/OneOffChargeDialog src/features/students/StudentRecordPanel`
- [x] T4: `RecordSummary` no layout do canvas (Modalidades, Contato em grade, Próximo vencimento, Termo, ações no rodapé) e visão do Professor — cobre CA3, CA4 — prova: `cd frontend && npx vitest run src/features/students/StudentRecordPanel` e `npx playwright test e2e/alunos.spec.ts` (360 px sem rolagem lateral)

### Parte B: janela Editar dados e prova visual

- [x] T5: `StudentEditDialog` na grade do canvas (título em caixa alta, rodapé fixo, "Opcionais", nota, tela cheia no celular) — cobre CA8 — prova: `cd frontend && npx vitest run src/features/students/StudentEditDialog`
- [x] T6: B21 (tema escuro: "Isentar taxa" e ícone do calendário) e conferência de contrato, lint, tokens e axe nos dois temas — cobre CA9, CA10 — prova: `cd frontend && npx vitest run src/features/benefits src/components/ui/date-field src/test/a11y.test.tsx src/components/tokens.test.ts` e `npm run lint && npm run typecheck`
- [x] T7: casos visuais (`ficha-professor` sem `limiteCanvas`, `ficha-aluno`, `aluno-editar`), referências no container, comparação com o canvas (1440 e 390, pt-BR, `.capturas/466/`), `docs/design/README.md` e divergências para o PR — cobre CA11 — prova: `cd frontend && npx vitest run visual/casos.test.ts src/components/design-readme.test.ts && npm run test:visual:docker -- --update-snapshots=all -g "ficha|aluno-editar"` e `npm run visual:canvas -- --exige`
- [x] T8 (ajuste): acrescentar ao "Pronto quando" da #472 a remoção do `limiteCanvas` de `ficha-professor` (`gh issue edit 472`, mantendo o texto atual) e listar no PR as divergências de `ficha-aluno`, `aluno-editar` e `ficha-professor` — cobre CA11 — prova: `gh issue view 472` mostra a linha

## 6. Decisões

- D1: a ficha continua painel lateral (`SidePanel`), não vira rota nem `Drawer` de 560 px. Motivo: o canvas mostra a ficha sobre a lista na largura de hoje (680 px) e a #465 já a abre por `?id`. Alternativa: `Drawer` da #463, descartada (largura e cabeçalho da ficha são outros).
- D2 (muda o comportamento): "Cobrar" abre a cobrança avulsa já com o aluno, para quem tem Cobranças e gerência de alunos; sem COLLECTIONS o botão não aparece. Motivo: decisão 8 e RF-ALU-03; o servidor segue como barreira. Alternativa: mostrar desabilitado, descartada (a ação é real).
- D3: "Pendências" (aviso de bloqueio com "Ver cobranças") e a coluna Faixa de Modalidades não entram: dependem da inativação (Sprint 12, #109) e das graduações. Registrados no PR como divergência com o motivo. Alternativa: bloco "Em breve", descartada (é aviso de dado, não ação).
- D4: "Baixar dados do aluno" e "Anonimizar aluno" aparecem como `ComingSoon`, sem backend: a regra de LGPD não está na especificação desta sprint. Alternativa: omitir, descartada (o canvas os mostra).
- D5: Termo de matrícula fica "Em breve"; se o MSW e o contrato já trouxerem o aceite, o builder mostra o dado real (decisão 8 permite as duas).
- D6: a janela de edição mantém o bloco de foto (RF-ALU-04 prevê; o canvas não mostra) e o mesmo conjunto de campos, só reorganizado; divergência vai para o PR. Vence a especificação na regra e o canvas no visual. Alternativa: tirar a foto, descartada (perde função).
- D7: unidade de cadastro, faixa etária e nascimento seguem no Resumo (RF-ALU-03), como últimas linhas do Contato, mesmo fora do canvas. Alternativa: remover, descartada (contraria a especificação).
- D8 (ajuste, verificação rodada 1): "Última alteração em ... por ..." (`LastChange`) e o diálogo de conflito de edição saem de R10/CA8, porque `StudentDetail` não traz data, autor nem versão e R12 proíbe mudar a API; a construção já os omitiu. Alternativa: item de API próprio, sugerido abaixo.
- D9 (ajuste, verificação rodada 1): `ficha-professor` mantém `limiteCanvas` 0,45 (medido 42,0%) com motivo; a #472 trata o painel da aula e a agenda, então a remoção do limite entra no "Pronto quando" dela (autonomia 4). Alternativa: remover o limite aqui, descartada (o canvas é outra composição).
- Suposição: "aluno desde" vem de `enrollment.enrolledAt` (só gestão); se vier nulo em aluno com matrícula ativa, a linha omite a data.
- Suposição: o canvas de celular `GMFicha` tem 360 px e `casos.test.ts` exige 390 px em `canvasCelular`; se for o caso, a comparação a 390 px é visual pelas capturas, como na #465.
- Fora do item (sugestão): item de API para data, autor e versão de alteração do aluno (aí entram "Última alteração" e o conflito de edição); itens próprios para o aceite do termo de matrícula (data e versão no aluno) e para "Baixar dados" e "Anonimizar" (LGPD).

## Construção

Parte A (T1 a T4) feita na primeira sessão; parte B (T5 a T7) feita na segunda.

- T1 — arquivos: `components/Modal.tsx` (opção `headless`, título só para leitor de tela; Modal.test), `components/ui/avatar.tsx` (tamanho `lg`), `components/ui/status-tone.ts` (selos NEW/SCHOLARSHIP em info, INCOMPLETE_REGISTRATION/TERM_PENDING em warn), `StudentRecordPanel.tsx` (novo `Header`, barra do celular com voltar e unidade, fechar no canto), `pt-BR.json` — prova: `npx vitest run src/features/students/StudentRecordPanel src/components/Modal` → passou
- T2 — `StudentRecordPanel.tsx` (`Tabs` em faixa `flex-nowrap overflow-x-auto`, `border-brand`), aba "Matrícula" no pt-BR; testes e `e2e/matricula.spec.ts` atualizados — prova: `npx vitest run src/features/students/StudentRecordPanel` → 30 passaram (teclado, Home e End incluídos)
- T3 — `OneOffChargeDialog.tsx` (prop `student`, esconde a busca), botão "Cobrar" só com STUDENT_MANAGE e COLLECTIONS — prova: teste "466 CA2, CA3" e `src/features/charges` → passou
- T4 — `RecordSummary.tsx` reescrito (Modalidades em tabela, Contato em grade, Próximo vencimento, Termo e ações em "Em breve"), visão do Professor sem Cobrar/Editar/Próximo vencimento — prova: `npx vitest run src/features/students/StudentRecordPanel` e `npx playwright test e2e/alunos.spec.ts e2e/matricula.spec.ts` → 10 passaram
Regressão (parcial, só o que a parte A toca): `npx vitest run src/features/students src/components src/features/charges src/features/benefits` → 615 testes, todos passaram após os ajustes; `npm run typecheck` e `npm run lint` limpos. Não rodei ainda `test:cov`, `e2e` completo nem teste visual (a parte B faz, com as referências).
Desvios: tom dos selos do aluno ajustado no mapa único (`status-tone.ts`), o que também muda a lista de Alunos (consistente com o CA1). "Editar dados" no cabeçalho saiu; o teste da janela de edição abre por "Editar dados pessoais" no Resumo (título da janela só muda na parte B).
Referências visuais: nenhuma regerada nesta parte (T7).

### Parte B
- T5 — arquivos: `StudentEditDialog.tsx` (Modal md headless com cabeçalho próprio: título em caixa alta, seta de voltar só no celular, tela cheia abaixo de 640 px; rodapé fixo Cancelar | Salvar por portal para o rodapé do Modal; grade 2/3/4/4 colunas, asteriscos em Nome, Data de nascimento, CPF, Celular e E-mail, "Opcionais", nota de saúde), `units/Text.tsx` (repassa `required` ao Field), `pt-BR.json` (título "Editar dados pessoais", rótulos do canvas, optional, healthNote), `StudentEditDialog.test.tsx` (rótulos novos e teste "466 CA8") — prova: `npx vitest run src/features/students` → 176 passaram
- T6 — arquivos: `ui/field.tsx` (Input declara esquema claro e escuro, o que deixa o ícone do calendário legível no escuro), `ui/checkbox.tsx` (mesmo), `enrollment-wizard/StepBilling.tsx` ("Isentar taxa" pelo `Checkbox` base), `ui/field.test.tsx` (teste "466 CA9") — prova: `npx vitest run src/components/ui src/features/benefits src/test/a11y.test.tsx src/components/tokens.test.ts src/features/students/enrollment-wizard` → 220 passaram; `npm run lint` e `npm run typecheck` limpos
- T7 — arquivos: `visual/casos.ts` (casos `ficha-aluno` e `aluno-editar`; `AlunoDetalhes` e `AlunoEditar` saem do semCaso; `GMFicha` e `GMAlunoEditar` ficam em "360 px"), `docs/design/README.md`, referências PNG de `ficha-professor`, `ficha-aluno` e `aluno-editar` (1440 e 390, claro e escuro); capturas em `.capturas/466/` — prova: `npx vitest run visual/casos.test.ts src/components/design-readme.test.ts` → passou; `npm run test:visual:docker -- --update-snapshots=all -g "ficha|aluno-editar"` → 12 passaram (uma rodada com 2 timeouts de 30 s em aluno-editar 1440, instáveis por carga; rodou de novo e passou); `npm run visual:canvas -- --exige` → 105 comparadas, 0 reprovadas
Regressão (parte B): `npx vitest run` completo estourou os 540 s (não terminou); em lotes, `src/components src/test src/features/{charges,benefits,agenda,units} visual` → 687 de 688 passaram; a falha (DailyReceiptsPage CA10) e um timeout de 20 s em UnitSettingsPage CA17 vieram da carga e passaram rodando os dois arquivos sozinhos (33 testes). `src/features/students` → 176 passaram. e2e `alunos.spec.ts` (7) e `matricula.spec.ts` passaram (a 1ª rodada achou o botão Fechar coberto pelo cabeçalho `relative`; corrigido). Não rodei `test:cov`, `e2e:full` nem o back-end (nada mudou nele): o CI prova (limitação aceita 2).
Desvios: (1) `limiteCanvas` mantido em `ficha-professor` (0,45; medido 42,0%): o canvas mostra gaveta de 600 px sobre a agenda da semana e o sistema abre sobre página vazia da aula; a #472 trata o painel da aula e a agenda — falta acrescentar a remoção do limite no "Pronto quando" da #472 (autonomia 4; não editei a issue). O R13 pedia a remoção. (2) `limiteCanvas` novos: `ficha-aluno` 0,40 (medido 36,3%; Pendências, coluna Faixa, termo aceito e botões no canto do cabeçalho, D3/D5) e `aluno-editar` 0,55 (medido 51,9%; foto e Número mantidos D6, sem "Última alteração", fundo diferente). (3) "Última alteração em ... por ..." (R10) não aparece: `StudentDetail` não traz esse dado e a API não muda neste item; `LastChange` com nulo diria "Ainda sem alterações", o que seria falso. (4) A checagem de edição concorrente com diálogo de conflito não existe hoje na edição de aluno (a API não tem versão); o CA8 cita-a como se existisse: nada a preservar, nada criado. (5) Botões WhatsApp, Cobrar e "Mais ações" ficam abaixo do cabeçalho também a 1440 px (no canvas ficam no canto); o "Em breve" do `ComingSoon` é largo e sobreporia o nome. (6) B21: a correção está no `Input` base e no `Checkbox`, e "Isentar taxa" é a caixa do passo de cobrança da matrícula (não a janela de benefício). (7) Rótulos do canvas na edição: "Nome completo", "Data de nascimento", "Endereço" (logradouro); Número ganhou coluna própria.
Referências visuais: `frontend/visual/referencias/ficha-professor-{1440,390}-{claro,escuro}.png` (regeradas); novas: `ficha-aluno-{1440,390}-{claro,escuro}.png` e `aluno-editar-{1440,390}-{claro,escuro}.png`. GMFicha e GMAlunoEditar têm 360 px: comparação a 390 px pelas capturas em `.capturas/466/`.
Não é do item: nenhuma mudança alheia na pasta; `docs/design/prints/` e `.capturas/` são ignorados pelo Git.

## Verificação

### Rodada 1 — CORRIGIR_ESPEC — 2026-11-10, estado 9d02705c3a86558bac02a9b22dd264c99bd0970a

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | testes de `StudentRecordPanel` (83 arquivos, 743 testes passaram) |
| CA2 | PASSOU | teste "466 CA2, CA3" no `StudentRecordPanel.test.tsx` |
| CA3 | PASSOU | mesmo arquivo de teste |
| CA4 | PASSOU | testes da visão do Professor; e2e não reexecutado nesta rodada (aceito pelo relato da construção) |
| CA5 | PASSOU | testes de teclado das abas |
| CA6 | PASSOU | testes do painel e capturas `ficha-aluno-390-*` em `.capturas/466/` (não reabertas) |
| CA7 | PASSOU | testes dos quatro estados |
| CA8 | NÃO PASSOU | "Última alteração em ... por ..." não aparece; diálogo de conflito de edição não existe para aluno (a spec presume ambos) |
| CA9 | PASSOU | `field.test.tsx` "466 CA9", `a11y.test.tsx` |
| CA10 | PASSOU | lint e typecheck limpos, `tokens.test.ts` passou; backend/contrato intocados (diff) |
| CA11 | NÃO PASSOU | `ficha-professor` mantém `limiteCanvas` 0,45 em `frontend/visual/casos.ts` (o CA exige sem limite); `visual:canvas` e container visual não reexecutados (ver abaixo) |

Comandos:
- `npx vitest run src/features/students src/features/charges src/features/benefits src/components visual src/test --maxWorkers=2` — 83 arquivos, 743 testes, todos passaram
- `npm run typecheck` e `npm run lint` — limpos
- Não rodei `test:visual:docker`, `visual:canvas`, e2e nem back-end: NÃO CONFERIDO, aceito pela autonomia 2 (CI do PR) e 3 (capturas em `.capturas/466/` existem, 1440 e 390).
Achados:
- obrigatório, especificação, R10/CA8 — esperado: "Última alteração em ... por ..." e diálogo de conflito de edição; observado: `StudentDetail` no `docs/openapi.yaml` não traz data/autor de alteração nem versão, e R12 proíbe mudar a API, então a spec se contradiz; evidência: grep no OpenAPI sem campo de atualização, `StudentEditDialog.tsx` sem `LastChange`/`EditConflictDialog`; corrigir: ajustar R10/CA8 (tirar os dois pontos ou abrir item de API) e registrar a decisão.
- obrigatório, código/processo, `frontend/visual/casos.ts` `ficha-professor` — esperado: R13/CA11 sem `limiteCanvas`, ou (autonomia 4) limite com motivo e remoção acrescentada ao "Pronto quando" da #472; observado: limite mantido (0,45) e a #472 só cita `agenda-painel-professor` (gh issue view 472); corrigir: acrescentar a remoção do limite de `ficha-professor` no "Pronto quando" da #472 e ajustar R13/CA11 da spec para refletir isso.
- sugestão, código — `visual/casos.ts` `ficha-aluno` e `aluno-editar` entram com `limiteCanvas` (0,40 e 0,55) com motivo; aceitável, mas as divergências devem estar listadas no PR.

### Correção da rodada 1
- Achado "R10/CA8 sem Última alteração e conflito": já resolvido na especificação (D8); nada no código a mudar — prova: nenhuma.
- Achado "#472 sem a remoção do limite de `ficha-professor`" (T8) — arquivos: nenhum no repositório; issue #472 editada (`gh issue edit 472`), "Pronto quando" agora cita `agenda-painel-professor` e `ficha-professor` — prova: `gh issue view 472` mostra a linha com `ficha-professor`.
- Sugestão (divergências de `ficha-aluno`, `aluno-editar`, `ficha-professor` no PR): fica para a descrição do PR (fase 5); os motivos estão nos Desvios (2), (5), (7) acima.
Regressão: `npx vitest run src/features/students src/features/charges src/components visual --maxWorkers=2` → 703 passaram, 0 falhas. Não rodei de novo `test:visual:docker`, `visual:canvas`, e2e nem `test:cov`: nada de código mudou nesta correção (limitação aceita 2/3, CI do PR).
Referências visuais: nenhuma regerada nesta correção.

### Rodada 2 — OK — 2026-11-10, estado bfa7b4def486b4e5748e3b154a7bc316396a6e5c

Desde a rodada 1 só o arquivo do item mudou (`git diff --stat` entre os estados); o código é o mesmo.

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA7, CA9, CA10 | PASSOU | mantidos da rodada 1; testes reexecutados: 703 passaram |
| CA8 | PASSOU | R10/CA8 ajustados por D8 (sem "Última alteração" e conflito, que a API não suporta e R12 proíbe mudar); teste "466 CA8" passou |
| CA11 | PASSOU | R13/CA11 ajustados por D9; `gh issue view 472` traz a remoção do `limiteCanvas` de `ficha-professor` no "Pronto quando"; capturas em `.capturas/466/` (autonomia 3); `test:visual:docker` e `visual:canvas` NÃO CONFERIDO, aceito pela autonomia 2 (CI do PR) |

Comandos:
- `npx vitest run src/features/students src/features/charges src/components visual --maxWorkers=2` — 703 passaram
- `npm run typecheck`, `npm run lint` — limpos
Achados obrigatórios: nenhum.
Achados:
- sugestão — listar na descrição do PR as divergências de `ficha-aluno`, `aluno-editar` e `ficha-professor` (limiteCanvas com motivo).

## Entrega

**O que muda:** a ficha do aluno (painel lateral de Alunos e do Professor pela aula) no visual do canvas: cabeçalho (avatar, nome, "idade · aluno desde · unidade", selos, WhatsApp, Cobrar, "⋯" em "Em breve"), abas com "Matrícula" e rolagem lateral no celular, Resumo (Modalidades, Contato em grade, Próximo vencimento, Termo, ações no rodapé); janela "Editar dados pessoais" no layout do canvas (grade 2/3/4/4, asteriscos, "Opcionais", tela cheia abaixo de 640 px); `Input` e `Checkbox` base com esquema claro e escuro (B21; "Isentar taxa" é a caixa do passo de cobrança da matrícula).

**Verificação:** rodada 2 `OK` (estado `bfa7b4def486b4e5748e3b154a7bc316396a6e5c`). `npx vitest run src/features/students src/features/charges src/components visual --maxWorkers=2` passou com 703 testes; lint e typecheck limpos. Comparação com o canvas: `npm run visual:canvas -- --exige` com 105 comparadas e 0 reprovadas; capturas em `.capturas/466/` (1440 e 390 px, pt-BR). Referências regeradas com `test:visual:docker` (12 passaram; um caso deu timeout por carga e passou ao repetir). E2E `alunos.spec.ts` e `matricula.spec.ts` passaram na construção.

**Decisões (opção recomendada, autonomia 1):**
- D8: "Última alteração em ... por ..." e o diálogo de conflito de edição (R10/CA8) ficam fora: a API não traz data, autor nem versão de alteração, e R12 proíbe mudar a API. Nada foi criado para eles.
- D9: `limiteCanvas` de `ficha-professor` (0,45; medido 42,0%) fica até a #472, que já tem a remoção no "Pronto quando" (conferido em `gh issue view 472`).
- `limiteCanvas` novos, com motivo: `ficha-aluno` 0,40 (medido 36,3%) e `aluno-editar` 0,55 (medido 51,9%).

**Divergências do canvas que restam (listar no PR):**
- Botões WhatsApp, Cobrar e "Mais ações" ficam abaixo do cabeçalho também a 1440 px (no canvas, no canto). O "Em breve" do `ComingSoon` é largo e sobreporia o nome.
- Edição: foto e campo Número mantidos (D6); sem "Última alteração"; fundo diferente do canvas.
- Rótulos da edição: "Nome completo", "Data de nascimento", "Endereço" (logradouro); Número ganhou coluna própria.

**Regressão local:** a suíte completa (`vitest run`) estourou 540 s na construção; `test:cov`, `e2e:full` e `verify` do back-end não foram rodados aqui e ficam para o CI do PR (limitação aceita 2). A base não avançou desde a verificação (`dev` em `35990f2`), então a regressão não foi rodada de novo.

**Limitações:** as divergências acima; `ficha-aluno` e `aluno-editar` ficam com `limiteCanvas` sem issue que o remova (o motivo está no "Desvios" da construção).
