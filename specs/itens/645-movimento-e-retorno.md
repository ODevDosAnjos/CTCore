# 645 — RNF-44 · Movimento e retorno: avisos no canto, carregamento e transições

Origem: issue #645 (Sprint 10.5), `docs/especificacao/00-visao-geral.md` RNF-44 e RNF-52, decisão 33 de `docs/auditoria/decisoes-canvas.md`. Branch: `item/645-movimento-e-retorno` (sem construção própria; cada parte tem o seu branch).
Tempos: especificar 10 min

<!-- Fase 2: especificação. Item-mãe: dividido em #774 (645a), #775 (645b), #776 (645c), #777 (645d) e #778 (645e) (D1), sem construção própria. A seção 4 é o ponto de partida de cada parte; as tarefas (seção 5) ficam no arquivo de cada parte, escrito quando o loop chegar nela. -->

## 1. Objetivo

Dar retorno e movimento ao sistema todo (gestão, portal e telas de acesso): aviso (toast) no canto inferior como componente base e usado em toda ação com efeito, barra fina no topo ao trocar de tela, esqueleto nas listas e painéis, botão que salva mostrando que trabalha, transições de 150 a 250 ms (menu lateral, janelas, painéis, menus, painel flutuante, rolagem suave) e corte das animações com "reduzir movimento" (RNF-20).

Fora do escopo: ações em "⋯", ficar na tela depois da ação com janela sobre a lista (#650, RNF-51/52); regra de negócio nova; mudança de API, contrato ou MSW.

**Estimativa: acima de 30 arquivos contáveis** (sem biblioteca de aviso no `package.json`; `Banner` em 81 arquivos de `src/features`; chamadas de escrita da API em 55 arquivos). Dividido em cinco partes (D1).

## 2. Requisitos

- **R1.** Componente base `Toast` (provider e `useToast`) com sucesso, erro e atenção; no canto inferior; sucesso e atenção somem sozinhos, erro fica até fechar; todos fecháveis; leitor de tela anuncia (`aria-live`). (645a)
- **R2.** Barra fina no topo ao trocar de tela. (645a)
- **R3.** Esqueleto (`Skeleton`) nas listas e painéis em carregamento. (645a)
- **R4.** Botão que salva mostra indicador e fica desabilitado enquanto trabalha. (645a confere o `Button loading`; 645b a 645e aplicam)
- **R5.** Transições de 150 a 250 ms: menu lateral recolhe e abre, janelas, painéis, menus e painel flutuante entram e saem; rolagem suave. (645a)
- **R6.** Com `prefers-reduced-motion`, nenhuma animação (RNF-20). (645a)
- **R7.** Toda ação com efeito (salvar, criar, cancelar, aprovar, enviar...) mostra o aviso, no lugar da mensagem solta na tela quando couber. (645b a 645e, por área)
- **R8.** Componente documentado em `docs/design/README.md`; cada PR lista as telas cobertas. (645a documenta; 645b a 645e listam)

## 3. Critérios de aceite

- **CA1** (R1). Disparar sucesso, atenção e erro: aparecem no canto inferior; os dois primeiros somem sozinhos; o erro fica até fechar; o botão de fechar remove qualquer um; a região é `aria-live`.
- **CA2** (R2). Trocar de rota mostra a barra durante o carregamento e a remove ao terminar.
- **CA3** (R3). Lista e painel em carregamento mostram esqueleto, não texto "Carregando" solto.
- **CA4** (R4). Ação em andamento: botão com indicador e desabilitado; ao terminar, volta.
- **CA5** (R5). Menu lateral, janela, painel, menu e painel flutuante têm transição entre 150 e 250 ms.
- **CA6** (R6). Com `prefers-reduced-motion: reduce`, transições e animações têm duração nula (teste) e a rolagem não é suave.
- **CA7** (R7). Em cada tela das partes b a e, a ação com efeito (sucesso e erro) mostra o aviso (teste por tela).
- **CA8** (R1 a R6). Axe sem violação nos dois temas, a 360 px e a 1440 px.
- **CA9** (R8). `docs/design/README.md` descreve o `Toast`; o PR de cada parte lista as telas cobertas.

## 4. Plano técnico

Só front-end; API, contrato e MSW não mudam. Pontos de partida vistos no repositório:

- Sem componente de aviso hoje: `Banner` em `frontend/src/components/ui/banner.tsx`; `Button` já tem `loading` com `aria-busy` (`ui/button.tsx`); sem `Skeleton`; o único `prefers-reduced-motion` em `src/index.css` e poucos componentes.
- Molduras: `src/features/permissions/ManagementShell.tsx`, `src/features/portal/PortalShell.tsx`, `src/components/layout/AuthShell.tsx` (ou `features/auth/RoleShell.tsx`); estados em `src/components/states/states.tsx`; listas em `src/components/query/QueryPage.tsx` e `DataTable.tsx`; janelas em `Modal.tsx`, `SidePanel.tsx`, `ui/drawer.tsx`, `ui/popover.tsx`; menu em `layout/Sidebar.tsx` e `GroupFlyout.tsx`.
- Textos em `src/i18n/pt-BR.json`.

**645a (#774), cerca de 20 a 25 arquivos.** Criar `components/ui/toast.tsx` (provider, `useToast`, região `aria-live`, tempo configurável por tipo) e montá-lo nas três molduras; criar `ui/skeleton.tsx` e usá-lo em `states.tsx` (`LoadingState`) e `QueryPage`; criar a barra de rota (componente em `components/layout`, ligado ao roteador); transições em `Sidebar`, `GroupFlyout`, `Modal`, `SidePanel`, `drawer`, `popover` e menus; `scroll-behavior: smooth` e bloco `prefers-reduced-motion` global em `index.css`; textos pt-BR; `docs/design/README.md`; testes unitários, de reduzir movimento e de axe; casos do teste visual. Mudou a moldura: regerar as referências afetadas (regra de `AGENTS.md`).

**645b a 645e (#775 a #778).** Em cada área, trocar a mensagem solta por `useToast()` nas mutações (`onSuccess` e `onError`) e passar `loading` ao botão que salva; telas por parte: b Pessoas (alunos, professores, usuários, Minha conta); c Operação (agenda, turmas, dias sem aula, comunicados, modalidades, planos, benefícios); d Financeiro e pedidos (cobranças, pagamentos, comprovantes, pedidos do portal na gestão); e Configurações, acesso e portal (organização, unidades, termos, textos, faixas etárias, dados e segurança, acesso, portal). Cada parte inventaria as suas mutações ao ser especificada. Riscos: erro de campo continua no campo (o aviso não o substitui); `Banner` de estado permanente (ex.: faixa de leitura) fica.

## 5. Tarefas

Sem tarefas neste arquivo: item-mãe sem construção própria. As tarefas de cada parte ficam no arquivo da parte (`specs/itens/774-*.md` a `778-*.md`), escrito quando o loop chegar nela.

## 6. Decisões

- **D1** (divisão; decisão do dono, 27/11/2026, "sim" à P20, registrada por engano como P16 no backlog): dividir em cinco partes, a opção recomendada, cada uma com o seu PR, na ordem #774, #775, #776, #777, #778, todas na Sprint 10.5, a #774 antes da #650. A #645 vira item-mãe, sem construção própria; o PR da #778 fecha também a #645 e reúne a lista de telas cobertas. Alternativa descartada: um PR só, acima do limite de 30 arquivos.
- **D2.** Erro fica até fechar e sucesso e atenção somem sozinhos (texto da issue). Tempo de sumiço (suposição: 5 s para sucesso e atenção) fixado na #774; se errado, só muda a constante.
- **D3.** A #650 (RNF-51/52) e a #661 passam a esperar a #778 (a #645 fecha nela); a #650 só precisa do `Toast`, entregue na #774, mas a dependência de backlog segue a issue-mãe.
