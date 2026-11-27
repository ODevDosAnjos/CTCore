# 626 — RNF-22 · Retirar a cor da organização: marca só com nome e logo

Origem: issue #626 (RNF-22, RF-ORG-01, RF-POR-03; decisão 20 de `docs/auditoria/decisoes-canvas.md`, 19/11/2026). Branch: `item/626-retirar-cor-organizacao`.

Tempos: especificar 4 (2 rodadas)

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

A marca da academia passa a ser só nome e logo. Configurações, portal, carteirinha, recibos e e-mails ao aluno usam só a identidade do ctcore, e o campo de cor sai da API, do contrato, do MSW e do banco.

Fora do escopo: cores de faixa e graduação (`graduation_level.color`), o token `--brand` do ctcore, pôr o logo nos e-mails, novos dados da organização (#627) e o histórico de auditoria já gravado.

## 2. Requisitos

- R1: a aba Geral de Configurações › Organização não tem escolha de cor, amostras, prévia nem regra de contraste; o formulário não envia cor (RF-ORG-01).
- R2: barra, abas, contadores de avisos, marca sem logo e carteirinha do portal usam só os tokens do ctcore (RNF-22, RF-POR-03).
- R3: o botão dos e-mails usa a cor da marca do ctcore (`#C8462C`, o valor de `--brand`) e o layout não aceita cor de fora; o rodapé "feito com ctcore" continua (RNF-22).
- R4: o recibo em PDF não usa cor vinda da organização (hoje `ReceiptPdf` já não usa cor).
- R5: a API não grava nem devolve a cor da organização (organização, moldura do portal e carteirinha), e o contrato e o MSW não têm o campo.
- R6: a coluna `organization.color` sai por migração.
- R7: o logo da organização continua aparecendo onde aparece hoje (configurações, portal, carteirinha, termo e recibo).
- R8: as telas com canvas seguem o canvas no resto do layout (`ConfigAcademia`, `TransferirCoordenacao`, telas do portal); a cor sai por decisão do dono, e só as referências visuais das telas afetadas mudam.

## 3. Critérios de aceite

- CA1 (R1): dado o Coordenador na aba Geral, quando a tela abre, então não há campo "Cor principal", amostras, selo de contraste nem prévia; ao salvar nome, titular ou regras, o corpo do PATCH não tem `color`.
- CA2 (R1): dado o Administrador na aba Geral, quando a tela abre, então vê os dados em leitura, sem nada de cor, e o axe passa a 360 px nos dois temas.
- CA3 (R2, R7): dada uma organização com logo e outra sem logo, quando o aluno abre o portal e a carteirinha, então o logo (ou as iniciais) e o nome aparecem, e aba ativa, contadores e marca usam `--brand`, sem `--org` nem estilo com cor vinda da API.
- CA4 (R3): dado um e-mail com link, quando o layout é montado, então o botão tem fundo `#C8462C` e o rodapé traz "feito com ctcore"; sem link não há botão.
- CA5 (R4, R7): dado um recibo de unidade com logo, quando o PDF é gerado, então sai como hoje, com o logo e sem cor da organização.
- CA6 (R5): dado o GET de `/organization`, `/portal/shell` e `/portal/card`, quando respondem, então não há a chave `color` na organização, e o teste de contrato e o MSW batem com o OpenAPI.
- CA7 (R5): dado um PATCH de `/organization` que ainda manda `color`, quando o Coordenador salva, então o campo é ignorado, sem erro de cor e sem entrada de cor na auditoria; Administrador e Professor continuam recebendo 403, e uma organização não altera a outra.
- CA8 (R6): dado um banco com organizações que tinham cor, quando a migração roda, então a coluna e a restrição `organization_color_format` deixam de existir, os demais dados ficam iguais, e a busca no código de produção não encontra o campo (as migrações antigas ficam como estão).
- CA9 (R8): dadas as telas afetadas a 1440 e 390 px em pt-BR, quando comparadas com o canvas, então a única diferença nova é a falta da cor; o caso `configuracoes-organizacao-contraste` sai e o canvas `ConfigOrgContraste` fica em `semCaso` com o motivo.

## 6. Decisões

- D1 (P16, divisão): o item passa do limite de 30 arquivos (cerca de 43) e é dividido em duas partes, nesta ordem, cada uma com a sua issue e o seu PR; a #626 vira item-mãe, sem construção própria, e fecha na 626b. Alternativa descartada: um PR só, acima do limite. Origem da resposta: repassada pelo agente que acionou esta fase, segundo o qual o dono, nesta conversa e antes de dormir, autorizou seguir com a opção recomendada em toda decisão que dependesse dele (aprovação por essa autorização geral, não uma resposta específica à P16; esta fase não viu a mensagem do dono).
  - 626a, telas e e-mail (cerca de 19 arquivos): R1 a R4, R7, R8; CA1 a CA5 e CA9. `contrastRatio` fica, porque o MSW o usa.
  - 626b, o campo (cerca de 29 arquivos): R5 e R6; CA6 a CA8. API, `BrandColor`, migração `V59`, contrato, MSW, `contrastRatio`, tipos do front e dados de exemplo dos testes.
- As seções 4 e 5 ficam no arquivo de cada parte, como na #625.
