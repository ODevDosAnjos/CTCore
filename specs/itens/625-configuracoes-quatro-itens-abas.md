# 625 — RF-ORG-09 · Configurações em quatro itens com abas: Organização, Unidades, Assinatura e Dados e segurança

Origem: issue #625. Branch: `item/625-configuracoes-quatro-itens-abas`.

Tempos: especificar 2

<!-- Fase 2: especificação. Escrita por `especificar`, que grava só as seções 1 a 6. -->

## 1. Objetivo

Reorganizar o grupo Configurações do menu em quatro itens com abas (Organização, Unidades, Assinatura e Dados e segurança), para o Coordenador e o Administrador acharem cada configuração no lugar onde ela vale: na organização ou na unidade. O limite de aulas experimentais por pessoa passa da organização para cada unidade.

Fora do escopo: Configurações › Visão geral, o quinto item do RF-ORG-09 (#640); retirada da cor da organização (#626); site, redes, fotos, horário, apresentação e Instagram (#627); conteúdo da aba Duas etapas (#628); janelas e cartões novos de modalidades (#633); tabela de permissões nova (#634); bloco "Vale para todas as unidades" (#635); chaves dos pedidos pelo portal (#639); o que o RF-ORG-04 cita e ainda não existe na tela (chave por meio de pagamento, Pix na chave quando o online estiver fora, conexão real do Mercado Pago, QR code e PDF dos links, diretório); telas de Assinatura, Auditoria, Importar e exportar e Acesso do suporte (#128, #114, #152, #133).

## 2. Requisitos

- R1: o grupo Configurações do menu tem quatro itens, nesta ordem: Organização, Unidades, Assinatura e Dados e segurança; o item "Unidade" separado e os itens soltos de Modalidades, Faixas etárias, Termos, Textos, Auditoria e Importar deixam de existir, e nenhum item aponta para endereço inexistente (RF-ORG-09).
- R2: Organização tem as abas Geral, Modalidades, Faixas etárias, Termos e Textos; cada aba mostra o que a tela de origem mostrava, com "Última alteração" e auditoria como hoje; a aba Geral mantém nome, logo, regras gerais, coordenação e o titular (RF-ORG-01, RF-ORG-08).
- R3: "Exigir comprovante da graduação de origem" é configurado por modalidade, na aba Modalidades, e sai das regras gerais da organização (RF-MOD-01, RF-MOD-02, RN-GRA-09).
- R4: Unidades é a lista de unidades, e cada unidade é aberta por ela, com as abas Dados, Cobrança, Lembretes, Divulgação e Permissões do Professor, com "Última alteração" e auditoria como hoje (RF-ORG-02, RF-ORG-04, RF-ORG-08).
- R5: o Administrador vê no item Unidades só as suas unidades; com uma unidade só, o item abre direto a configuração dela (RF-ORG-02).
- R6: a aba Cobrança junta os dias de vencimento e a taxa de matrícula, que saem de Dados, com Mercado Pago, taxas e chave Pix (RF-ORG-04).
- R7: a aba Divulgação é a antiga "Links" mais "Aparecer no diretório", que sai de Dados e continua "Em breve", e o limite de aulas experimentais por pessoa (RF-ORG-04).
- R8: o limite de aulas experimentais por pessoa é lido e gravado por unidade (padrão 2, de 1 a 3), sai das regras da organização, e a migração copia o valor de cada organização para todas as unidades dela (RN-AEX-02).
- R9: Assinatura (só o Coordenador) e Dados e segurança (abas Auditoria, Importar e exportar, Acesso do suporte e Duas etapas, todas futuras) aparecem desabilitados com "Em breve" (RF-ORG-09).
- R10: os endereços antigos de Configurações (`/configuracoes/unidade`, `/configuracoes/unidade/permissoes`, `/configuracoes/modalidades`, `/configuracoes/faixas-etarias`, `/configuracoes/termos`, `/configuracoes/textos`) levam aos novos.
- R11: as permissões continuam conferidas no servidor: o Administrador vê Organização só em leitura e acessa só as suas unidades (RF-ORG-01, RF-ORG-02).
- R12: as telas mexidas seguem o padrão de rotas e telas (RNF-56), têm os quatro estados, funcionam a partir de 360 px, passam no axe nos dois temas, têm textos em pt-BR, casos no teste visual e comparação com o canvas segundo as decisões 19 a 23 de `docs/auditoria/decisoes-canvas.md`.

## 3. Critérios de aceite

- CA1 (R1): dado um Coordenador, quando abre o grupo Configurações, então vê só Organização, Unidades, Assinatura e Dados e segurança, nesta ordem, e cada item habilitado abre uma tela existente.
- CA2 (R2): dado um Coordenador em Organização, quando troca de aba, então a aba fica em `?aba=<id>`, continua a mesma depois de recarregar, e cada aba mostra o conteúdo e a "Última alteração" da tela de origem; salvar grava a auditoria de antes.
- CA3 (R2, R10): dado a aba Termos, que já tem abas internas por tipo de termo, quando o usuário troca o tipo, então ele continua na aba Termos e o tipo continua o mesmo depois de recarregar.
- CA4 (R3): dado a aba Geral, quando é exibida, então não há controle de comprovante da graduação de origem; na aba Modalidades, ligar a exigência de uma modalidade continua gravando só nela.
- CA5 (R4): dado a lista de Unidades, quando o usuário abre uma unidade ativa, então vê as cinco abas daquela unidade, com a aba no endereço, dentro da moldura da gestão.
- CA6 (R5): dado um Administrador de uma unidade, quando clica em Unidades, então cai na configuração dela; dado um Administrador de duas ou mais, então a lista traz só as dele.
- CA7 (R6): dado uma unidade, quando o usuário salva dias de vencimento e taxa de matrícula na aba Cobrança, então os valores são gravados, a aba Dados não os mostra, e um erro do servidor nesses campos abre a aba Cobrança.
- CA8 (R7): dado uma unidade, quando abre Divulgação, então vê "Aparecer no diretório" desabilitado "Em breve", os dois links e o limite de experimentais; a aba Dados não mostra o diretório.
- CA9 (R8): dado duas unidades da mesma organização, quando o limite de uma é salvo como 3, então a outra não muda, a leitura devolve o valor gravado e a auditoria da unidade registra antes e depois.
- CA10 (R8): dado um limite 0, 4 ou ausente, quando a unidade é salva, então o servidor responde 400 apontando o campo e nada é gravado.
- CA11 (R8): dado uma organização com limite diferente do padrão e unidades existentes, quando a migração roda, então cada unidade dela fica com esse valor; unidade criada depois nasce com 2; a leitura e a gravação da organização não têm mais o campo.
- CA12 (R9): dado um Coordenador, quando vê o menu, então Assinatura e Dados e segurança aparecem desabilitados "Em breve"; dado um Administrador, então Assinatura não aparece.
- CA13 (R10): dado cada endereço antigo, quando é aberto, então o usuário chega à tela e à aba novas correspondentes.
- CA14 (R11): dado um Administrador, quando tenta alterar a organização ou ler ou alterar unidade que não é dele, então o servidor recusa; unidade de outra organização responde 404; Professor e perfis do portal são recusados na lista e na configuração de unidades.
- CA15 (R12): dado cada aba, quando é exibida a 360 px e nos dois temas, então não há rolagem horizontal da página nem violação do axe; os testes de rotas (`shell.test.ts`, `noInternalAnchors.test.ts`, `routePattern.test.ts`) passam e há e2e da tela dentro da moldura.
- CA16 (R12): dado as abas, quando a comparação com o canvas é feita (1440 e 390 px, pt-BR), então há caso no teste visual para cada aba e o PR lista as divergências que vêm das decisões do dono.
