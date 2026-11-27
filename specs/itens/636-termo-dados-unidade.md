# 636 — RN-MAT-21 · Termo de matrícula com os dados da unidade (CNPJ e endereço)

Origem: issue #636 (RN-MAT-21, RN-LGP-01; decisão 29 de `docs/auditoria/decisoes-canvas.md`). Branch: `item/636-termo-dados-unidade`.

Tempos: especificar 5 (2 rodadas)

<!-- Fase 2: especificação. Escrita por `especificar`. Item-mãe: dividido em #768 (636a) e #769 (636b) (D1), sem construção própria. A seção 4 é o ponto de partida de cada parte; as tarefas (seção 5) ficam no arquivo de cada parte. -->

## 1. Objetivo

O termo de matrícula continua um só por organização, mas passa a trazer os dados da unidade da matrícula do aluno (nome, razão social, CNPJ e endereço), para cada sede com CNPJ próprio aparecer como contratante. O Coordenador insere os campos no editor e vê a prévia por unidade; o portal mostra o texto preenchido e o aceite guarda esse texto final.

Fora do escopo: termo por unidade; campos no termo de uso de imagem; editor com formatação, rascunho e "Baixar PDF" (seguem "Em breve"); modelo da plataforma editável (RF-PNL-07); preencher o texto de aceites já gravados; tela para reler o texto aceito.

## 2. Requisitos

- R1 (RN-MAT-21): o texto do termo de matrícula aceita os campos `{unidade}`, `{razao_social}`, `{cnpj}` e `{endereco}`; publicar com um campo desconhecido é recusado com 400 no campo `body`.
- R2 (RN-MAT-21): a unidade tem razão social e o titular da organização tem razão social ou nome, os dois opcionais, gravados com auditoria.
- R3 (RN-MAT-21): unidade com CNPJ preenche razão social e CNPJ com os dados dela; sem CNPJ, os dois vêm do titular da organização. Os dois nunca se misturam.
- R4 (RN-MAT-21): o portal mostra o termo pendente com os campos preenchidos pela unidade da matrícula de cada aluno.
- R5 (RN-MAT-21, RN-LGP-01): o aceite guarda o texto final, como foi mostrado; mudar depois a unidade ou o titular não altera o que já foi aceito.
- R6 (issue #636): o editor de Termos oferece os campos para inserir no texto e mostra a prévia com os dados de uma unidade escolhida, entre as que a conta alcança.
- R7 (RNF-56, AGENTS.md): as telas mexidas mantêm os quatro estados, funcionam a 360 px e passam no axe nos dois temas; textos em `pt-BR.json`; OpenAPI, MSW e especificação mudam junto.

## 3. Critérios de aceite

- CA1 (R3, R4, R5): dadas duas unidades com CNPJs e razões sociais diferentes e um aluno matriculado em cada, quando cada um aceita, então o texto gravado de cada aceite tem o CNPJ, a razão social, o nome e o endereço da própria unidade (teste de integração).
- CA2 (R3): dada uma unidade sem CNPJ, então o termo mostrado e o gravado trazem a razão social e o documento do titular, mesmo que a unidade tenha razão social preenchida.
- CA3 (R5): dado um termo já aceito, quando o CNPJ, a razão social, o nome ou o endereço da unidade mudam, então o texto gravado continua igual.
- CA4 (R1): dado um texto com `{cnpj}` e os outros três campos, então publica; com `{telefone}`, 400 no campo `body` e nada é gravado.
- CA5 (R2): dado o Coordenador (titular) ou quem pode editar a unidade (razão social), quando grava, então a leitura devolve o valor e a auditoria registra antes e depois; acima de 160 caracteres, 400 no campo; os demais perfis e outra organização continuam recusados sem efeito.
- CA6 (R6): dado o editor, quando o Coordenador toca num campo, então ele entra na posição do cursor; ao escolher uma unidade, a prévia mostra o texto em edição com os dados dela. O Administrador vê a prévia só das unidades dele, sem inserir; nenhuma resposta traz unidade de outra organização.
- CA7 (R7): dadas as telas Termos, aceite no portal, Organização › Geral e Unidade › Dados, então têm caso no teste visual, funcionam a 360 px, passam no axe nos dois temas e foram comparadas com o canvas (`ConfigTermos`, `PortalTermo`, `PortalMTermo`, `ConfigAcademia`, `ConfigUnidade`); segue o padrão de rotas e telas.

## 4. Plano técnico

**Estimativa: cerca de 45 arquivos contáveis, acima do limite de 30. Dividido em duas partes (D1).**

A estimativa passa do limite por uma falta no dado: a RN-MAT-21 usa a razão social da unidade e a do titular, e o sistema não guarda nenhuma das duas. `unit` só tem `cnpj`; `organization` só tem `holder_document`, embora a tela chame esse campo de "Titular (razão social ou nome)" (`BrandCard.tsx`, com máscara de CPF/CNPJ). No canvas `ConfigAcademia`, esse rótulo traz um nome ("Leão Artes Marciais Ltda.").

### Divisão

| Parte | O que entrega | Requisitos e critérios | Arquivos contáveis |
|---|---|---|---|
| #768 · 636a · Razão social da unidade e nome do titular | Migração (`unit.legal_name`, `organization.holder_name`), API, contrato, MSW, auditoria, campo em Unidade › Dados, e em Organização › Geral os campos "Titular (razão social ou nome)" e "CNPJ ou CPF do titular"; seed; RF-ORG-01, RF-ORG-04 e "Dados" em `01-organizacao-e-isolamento.md` | R2, CA5, CA7 (duas telas) | cerca de 25 |
| #769 · 636b · Campos automáticos no termo (fecha a #636; depois da #768) | Preenchimento no servidor, texto final no aceite, campos e prévia no editor, termo preenchido no portal | R1, R3 a R6, CA1 a CA4, CA6, CA7 (Termos e portal) | cerca de 22 |

Cada parte deixa a `dev` verde: na 636a os dois dados novos são opcionais e nada depende deles; a 636b só passa a usá-los.

### Ponto de partida da 636a

- Servidor: `organization/UnitUpdate`, `UnitSettings` (`UnitDetail`, leitura, `update`, auditoria), `OrganizationProfile` (`Row`, `OrganizationView`, `update`), `OrganizationController.UpdateRequest`; migração `V64` (a criar).
- Testes: `UnitUpdateValidationTest` (usa o construtor posicional), `UnitSettingsIT`, `OrganizationProfileIT`.
- Front: `units/{useUnitSettings,unitDraft,UnitDataTab,unitTabKit}`, `organization/{useOrganization,BrandCard,OrganizationSettingsPage}` e os testes deles, `mocks/handlers.ts`, `unit-settings.msw.test.ts`, `organization.msw.test.ts`, `pt-BR.json`, `visual/telas.visual.ts`.

### Ponto de partida da 636b

- Dados: `V65` (a criar): `term_acceptance.body` nulo nos registros antigos e no uso de imagem; a tabela já não aceita `update` nem `delete` (`V48`).
- Servidor: `terms/TermFields` (a criar, única função que monta os valores e troca os campos), usada por `terms/Terms` (validação no `publish`, campos no modelo padrão e valores por unidade no `View`) e por `student/PortalTerms` (`pending` e `accept`); `PortalTermController.AcceptBody`. Formato do CNPJ: ver `payment/ReceiptPdf.cnpj`. O padrão `\{([^{}]*)}` de `mail/TextModels` serve para achar campo desconhecido.
- Front: `terms/{TermsTab,useTerms}` (botões de campo como em `texts/TextsTab.insert`), `portal/usePortalTerm`, `mocks/{handlers,browser}.ts`, testes, `pt-BR.json`, `visual/telas.visual.ts`, `e2e/portal-termo.spec.ts`.
- Segurança: os valores por unidade saem só das unidades que a conta alcança, com filtro no código e RLS; o texto é puro (o React já escapa).
- Risco: o portal e a prévia precisam sair da mesma função do servidor; a prévia recebe os valores prontos e só troca os campos.

## 6. Decisões

- D1 (P19, divisão; decisão do dono, 27/11/2026): dividir em duas partes, a opção recomendada; as escolhas que estavam propostas na seção 4 passam a valer nas partes (D2 a D7). A resposta chegou a esta fase pelo agente que a acionou. A #636 vira item-mãe, sem construção própria: #768 (636a; R2, R7; CA5 e CA7 nas duas telas) e depois #769 (636b; R1, R3 a R7; CA1 a CA4, CA6 e CA7 em Termos e portal), cada uma com o seu PR, as duas antes da #638. O PR da #769 fecha também a #636. Alternativa descartada: um PR só, acima do limite.
- D2 (muda o comportamento; #769): com mais de uma unidade, a unidade da matrícula é a da modalidade ativa mais antiga (`enrollment_modality` por `started_at`, `created_at`, `id`); sem modalidade ativa, a unidade de cadastro do aluno. Continua um aceite por aluno (RN-MAT-11); trocar de unidade não pede aceite de novo. Alternativa descartada: sempre a unidade de cadastro, que pode não ser onde ele treina.
- D3 (muda o comportamento; #769): dado em branco sai como "não informado", sem travar a publicação nem o portal; a prévia avisa o que falta na unidade escolhida. Alternativa descartada: bloquear o aceite, que deixaria o aluno sem portal por um cadastro da academia.
- D4 (muda o comportamento; #769): `{endereco}` é endereço, cidade e CEP da unidade, sem as partes vazias. `{cnpj}` sai formatado; se o titular for pessoa física, sai o CPF dele, porque a regra manda usar os dados do titular.
- D5 (muda o comportamento; #769): o modelo padrão da plataforma (versão 0) ganha um cabeçalho com os quatro campos. Versões já publicadas não mudam.
- D6 (muda o comportamento; #769): o termo pendente leva um hash do texto preenchido, o portal o devolve no aceite e, se a unidade mudou entre os dois, a resposta é 409 `TERMS_VERSION_CONFLICT` e o texto é lido de novo. O campo é opcional no contrato.
- D7: os campos, a prévia (decisão 29) e a razão social da unidade (exigida pela RN-MAT-21) não estão no `ConfigTermos` nem no `ConfigUnidade`; o PR de cada parte lista as divergências que lhe cabem.
