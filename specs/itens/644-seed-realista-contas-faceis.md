# 644 — Seed com dados realistas e contas fáceis (coordenador@ctcore.test etc.) e seed para homologação

Origem: issue #644 (Sprint 10.5, técnica, "fazer antes da #498"; autor `ODevDosAnjos`). Branch: `item/644-seed-realista-contas-faceis`.

## 1. Objetivo

Trocar o seed pequeno (`infra/seed/01` a `24`, 3 organizações, 6 alunos) por um conjunto fictício com cara de uso real e 7 contas fáceis em `.test`, para o dono testar todos os fluxos à mão. Acrescentar `--url` ao `seed.sh` para rodar contra o banco de homologação, com trava contra produção.

Fora do escopo: rodar na homologação (#662, do dono); mudar regra de negócio, tela, API ou contrato; criar tabela nova; fotos e arquivos reais (comprovantes só como registro, sem arquivo).

## 2. Requisitos

- R1: o seed cria as 7 contas da issue (e-mail, senha e perfil exatos), todas ativas, com senha em hash Argon2 válido.
- R2: `admin@ctcore.test` é Administrador de uma unidade; `admin2@ctcore.test`, de duas; `professor@ctcore.test` tem 2 turmas; `aluno@ctcore.test` é aluno adulto ativo; `responsavel@ctcore.test` é responsável de 2 filhos menores; `multiplo@ctcore.test` é Professor numa unidade da organização principal e Aluno na segunda organização.
- R3: o Coordenador tem duas etapas já ativadas com segredo de teste fixo, documentado no README (só seed, só local).
- R4: o seed cria 2 organizações; a principal com 3 unidades; 6 professores; cerca de 60 alunos em todas as faixas etárias, nas situações ativo, inativo, ex-aluno e bloqueado, com menores com responsáveis e irmãos; turmas em várias modalidades e horários.
- R5: o seed cria planos e benefícios, e cobranças em todas as situações: pendente, vence hoje, atrasada, em conferência, paga em vários meios, renegociada com parcelas, cancelada e avulsa; com comprovantes.
- R6: o seed cria pedidos do portal de todos os tipos, comunicados enviados e agendados, recessos e feriados, graduações com histórico, notificações e convites pendentes.
- R7: todo nome, CPF, telefone e endereço é inventado (CPFs de teste válidos); nenhum e-mail fora de `.test` ou `.example`.
- R8: o seed é idempotente (`on conflict do nothing`, ids por `md5('ctcore-seed-...')`), e banco limpo e reaplicado dá os mesmos ids.
- R9: `infra/scripts/seed.sh --url <conexão>` aplica o seed no banco remoto e recusa quando a URL ou o banco parecer de produção; sem `--url`, o comportamento local não muda.
- R10: o README documenta contas, senhas, segredo de duas etapas e o passo a passo da homologação; avisa que as senhas simples valem só no seed.

## 3. Critérios de aceite

- CA1 (R1, R2): dado o seed aplicado, quando se faz login com cada uma das 7 contas e senha da tabela, então o login funciona e o vínculo ativo tem o papel certo (coordenador: `COORDINATOR`; admin: `ADMINISTRATOR` com 1 unidade; admin2: 2 unidades; professor: `TEACHER` ligado a professor com 2 turmas; aluno: `STUDENT` ligado a aluno adulto ativo; responsavel: `GUARDIAN` com 2 filhos menores; multiplo: `TEACHER` na organização principal e `STUDENT` na segunda).
- CA2 (R2): dado `multiplo@ctcore.test`, quando faz login, então a resposta traz dois vínculos (escolha de organização e área, RN-ACE-03); com os demais, um vínculo só (vai direto à área).
- CA3 (R3): dado o segredo de teste, quando se gera o código TOTP e se entra com `coordenador@ctcore.test`, então o login pede o código e aceita o gerado a partir do segredo documentado.
- CA4 (R4): dado o seed, então há 2 organizações, 3 unidades na principal, 6 professores, entre 55 e 65 alunos, ao menos um aluno em cada situação (ativo, inativo, ex-aluno, bloqueado), cada faixa etária do cadastro, menor com responsável, e dois irmãos com o mesmo responsável.
- CA5 (R5): dado o seed, então existe ao menos uma cobrança em cada situação e tipo da lista de R5 (pendente, vence hoje, atrasada, em conferência, paga com meios diferentes, renegociada com parcelas, cancelada, avulsa) e um comprovante pendente.
- CA6 (R6): dado o seed, então existem pedidos do portal de todos os tipos que a tabela aceita, comunicado enviado e agendado, recesso e feriado, aluno com histórico de mais de uma graduação, notificações e convite pendente.
- CA7 (R7): dado o seed, quando se busca todo e-mail nos arquivos `infra/seed/*.sql` e nas tabelas, então todo domínio termina em `.test` ou `.example`.
- CA8 (R8): dado o seed aplicado duas vezes, e depois em banco limpo, então contagens e conteúdo iguais, e valor alterado depois do primeiro run é mantido.
- CA9 (R9): dado `--url` com host ou banco de produção (nome com `prod`, ou `CTCORE_ENV=production` no banco), quando o script roda, então sai com erro, sem aplicar nenhum arquivo. Com URL de homologação, aplica todos.
- CA10 (R9): dado o script sem `--url`, então segue usando o PostgreSQL do compose.
- CA11 (R10): README traz as 7 contas, o segredo e o passo a passo.

## 4. Plano técnico

- Dados: não há migração nem tabela nova. Só SQL de seed. Reaproveitar os ids determinísticos atuais (`ctcore-seed-org-N`, `-unit-N`, `-account-N`, `-student-N`...) para o que já existe e acrescentar nos novos.
- API e interface: não mudam.
- Segurança: segredo real nunca entra; senhas simples só no seed e só em hash. O hash Argon2id de cada senha é gerado uma vez pelo `PasswordHasher` do back-end (classe que o `AuthService` usa) e colado no SQL (existe hoje um hash só, de `SenhaFicticia1`). O segredo TOTP fixo de teste é cifrado com a chave local de desenvolvimento (`application-local.yml`, já pública) via `SecretCipher`; como a chave de homologação é outra, esse insert fica em arquivo `*-local.sql` que o `--url` não aplica; na homologação o Coordenador configura as duas etapas no primeiro acesso (RN-ACE-17). Padrão de isolamento: RLS não muda; o seed roda com o papel administrativo, como hoje.
- Arquivos a alterar (vistos): `infra/seed/03-accounts.sql` (trocar as contas `.example` pelas 7 `.test`, com vínculos e `account_link_unit`; manter convidado e desativado se algum teste precisar, em `.example`), `04-unidades.sql` (3 unidades na principal), `01-organizations.sql` e `02-organization-unit-settings.sql` (de 3 para 2 organizações), `09-professores.sql` (6 professores; o do login `professor` com 2 turmas; o do `multiplo`), `10-turmas.sql` e `11-agenda.sql` (turmas em várias modalidades e horários, recessos e feriados), `12-alunos.sql` (cerca de 60 alunos, responsáveis, irmãos), `13-planos.sql`, `14-matriculas.sql`, `15-beneficios.sql`, `16-matricula-inicio.sql`, `06-graduacao.sql` e histórico em `student_graduation`, `18-cobrancas.sql` (todas as situações; renegociação com parcelas; cancelada; avulsa), `19-comunicados.sql`, `20-notificacoes.sql`, `21-aceites-termo.sql`, `22-pedidos-portal.sql`, `23-comprovantes.sql`, `24-avisos-lidos.sql`; `infra/scripts/seed.sh` (`--url`, trava de produção); `README.md` seção "Dados fictícios"; `backend/src/test/java/br/com/ctcore/db/SeedDataIT.java` (contagens novas e limpeza de tabelas).
- A criar: `infra/seed/25-duas-etapas-local.sql` (segredo TOTP do Coordenador); `backend/src/test/java/br/com/ctcore/db/SeedLoginIT.java` (CA1 a CA3, via rotas de login reais); `infra/scripts/seed.test.sh` (CA9, CA10, com `psql` e `docker` simulados por funções, como já se faz em `osv-high.test.sh`).
- Reuso: `SeedDataIT.apply`, `PostgresIT`, `AuthBase` e o cliente de login dos testes de identidade, `Totp` para gerar o código no teste, `SecretCipher`, o `generate_series`/`values` já usados nos arquivos atuais.
- Riscos: (1) os arquivos atuais têm tabelas ligadas entre si, então mudar a quantidade de organizações quebra os `SeedDataIT` por contagem; atualizar junto. (2) O limite de vagas de Administrador por assinatura (#608) pode recusar o 3º Administrador se o seed for lido por regra; conferir que a organização principal tem limite para 2 Administradores (`organization_limits`). (3) Situação de cobrança é calculada, então "atrasada" e "vence hoje" dependem da data: usar datas relativas a `current_date` nos inserts (`current_date - 10`) e, no teste, o fuso da unidade. (4) Aulas continuam nascendo pela tarefa diária (README já avisa); o seed não gera `lesson`.

Divisão em partes (construção em sessões separadas, um item só): parte A = T1 a T3 (contas, estrutura, 2FA, teste de login); parte B = T4 a T7 (pessoas, financeiro, comunicação e testes); parte C = T8 a T9 (homologação e README).

## 5. Tarefas

- [x] T1: gerar os hashes Argon2id das 7 senhas e o texto cifrado do segredo TOTP (uma vez, com o `PasswordHasher` e o `SecretCipher`, por um teste descartável ou jshell; só o resultado vai ao SQL) e reescrever `01`, `02`, `03`, `04` (2 organizações, 3 unidades, 7 contas e vínculos) — cobre CA1, CA2, CA7 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=SeedDataIT`
- [x] T2: criar `25-duas-etapas-local.sql` com o segredo fixo do Coordenador — cobre CA3 — prova: `SeedLoginIT#coordinatorTwoFactor`
- [x] T3: criar `SeedLoginIT`: login das 7 contas, vínculos por perfil, dois vínculos do `multiplo`, código TOTP do Coordenador — cobre CA1, CA2, CA3 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=SeedLoginIT`
- [x] T4: reescrever `05`, `06`, `07`, `08`, `09`, `10`, `11` (modalidades, graduação, faixas etárias, 6 professores, turmas, recessos e feriados; `professor` com 2 turmas; `multiplo` professor) — cobre CA4, CA6 — prova: `-Dit.test=SeedDataIT`
- [x] T5: reescrever `12`, `13`, `14`, `15`, `16` (cerca de 60 alunos, responsáveis, irmãos, planos, benefícios, matrículas e graduações com histórico) — cobre CA4, CA6 — prova: `-Dit.test=SeedDataIT`
- [x] T6: reescrever `18` e `23` (cobranças em todas as situações com datas relativas, pagamentos de meios diferentes, renegociação com parcelas, comprovante pendente) — cobre CA5 — prova: `-Dit.test=SeedDataIT#charges*`
- [x] T7: reescrever `17`, `19`, `20`, `21`, `22`, `24` (termos, comunicados enviados e agendados, notificações, pedidos do portal de todos os tipos, convites pendentes) e atualizar `SeedDataIT` (contagens, limpeza, busca de e-mails fora de `.test`/`.example`, reaplicação e banco limpo) — cobre CA6, CA7, CA8 — prova: `-Dit.test=SeedDataIT`
- [x] T8: `seed.sh --url` com trava de produção e `seed.test.sh` — cobre CA9, CA10 — prova: `bash infra/scripts/seed.test.sh`
- [x] T9: README (contas, senhas, segredo, passo a passo da homologação, aviso sobre senhas simples) — cobre CA11 — prova: conferência manual do texto e `bash infra/scripts/gitleaks-rules.test.sh`

## 6. Decisões

- D1: usar 2 organizações em vez das 3 atuais, como diz a issue; a terceira sai do seed e as contagens de `SeedDataIT` mudam. Alternativa descartada: manter 3 e ignorar a issue.
- D2: substituir as contas `.example` atuais em vez de somar as novas, para não existirem dois Coordenadores na mesma organização. Alternativa descartada: convivência das duas séries.
- D3: o segredo TOTP é cifrado com a chave local fixa e fica em arquivo `*-local.sql` que `--url` não aplica; na homologação o Coordenador configura as duas etapas no primeiro acesso. Motivo: a chave de homologação é segredo e não pode ir ao repositório. Alternativa descartada: reutilizar a chave de desenvolvimento em homologação (o segredo TOTP fixo ficaria público lá).
- D4: trava de produção do `--url`: recusa se o host ou o nome do banco contiver `prod` (sem diferenciar maiúsculas) ou se o banco tiver o marcador `CTCORE_ENV=production` (lido com `select current_setting('ctcore.env', true)` ou parâmetro do banco). Sem marcador e sem `prod` no nome, aplica. Alternativa descartada: pedir confirmação interativa (quebra automação).
- D5: o seed não gera aulas (README já explica); isso fica como está.
- D6 (muda o comportamento): senhas simples `coordenador123` etc. existem só no seed, e só em banco local e homologação; a política da RN-ACE-08 continua valendo para quem cria senha pelo sistema. Alguns exemplos ficam abaixo de 8 caracteres com maiúscula? Não: todas as senhas da issue têm 8 ou mais caracteres e número, mas sem maiúscula, então não passariam na política se fossem criadas pelo sistema; por isso valem só como hash gravado no seed.
- Suposição: "bloqueado" no aluno corresponde à situação que o cadastro de aluno já tem (inativação por inadimplência ou bloqueio manual); o construtor confere o nome exato da situação na tabela `student` antes de escrever. Se não houver essa situação, o item continua com as demais e o desvio é anotado.
- Suposição: "todos os tipos de pedido do portal" são os valores aceitos pela restrição de `portal_request.kind`; "meios de pagamento" são os valores aceitos por `payment.method`.
- Suposição: o limite de Administradores por assinatura (#608) já existe no código; se o seed passar do limite, subir `organization_limits` da organização principal no próprio seed.

## Construção

Parte A (T1 a T3) feita nesta sessão; faltam as partes B (T4 a T7) e C (T8 e T9).

- T1 — arquivos: `infra/seed/01`, `02`, `03`, `04` (2 organizações; unidades 1 e 2 principais, 3 e 4 extras da organização 1; 7 contas `.test` com hash Argon2id gerado pelo `SecurityConfig().passwordEncoder()` por teste descartável, já removido; vínculos e `account_link_unit`: admin 1 unidade, admin2 2 unidades; convidado e desativado mantidos em `.example`); ajustes mínimos só para o seed continuar aplicando com 2 organizações: `05`, `07`, `08`, `09`, `10`, `11`, `13` (`generate_series(1, 3)` de organizações passou a `(1, 2)`), `09` (teacher 1-2 ligado à conta `multiplo`), `12` (responsável 1 = conta `responsavel@ctcore.test`; responsável 2 convidado com ids 8 e link 18; aluno 1 ligado à conta `aluno`; aluno 101 na organização 2 ligado à conta `multiplo`); `SeedDataIT` (contagens novas; `cleanAll`, `apply` e `SEED_DIR` públicos para reuso) — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='SeedDataIT,SeedLoginIT' -Dtest=NoSuchTest -Dsurefire.failIfNoSpecifiedTests=false -Djacoco.skip=true` → 26 testes, 0 falhas.
- T2 — arquivo: `infra/seed/25-duas-etapas-local.sql` (segredo base32 `MN2GG33SMUWXGZLFMQWTEZTBFV2GK43U`, bytes ASCII de `ctcore-seed-2fa-test`, cifrado com a chave local de `application-local.yml`) — prova: `SeedLoginIT#coordinatorTwoFactor` → passou (decifra o texto do seed com a chave local e confere o segredo; como o teste usa outra chave, regrava o segredo com a chave de teste e faz o login real com código TOTP).
- T3 — arquivo: `backend/src/test/java/br/com/ctcore/identity/SeedLoginIT.java` (3 testes: login das contas e papéis, escolha de organização do `multiplo`, vínculos por unidade e por registro, TOTP do Coordenador) — prova: mesma linha da T1 → 3 testes, 0 falhas.

Regressão: só `SeedDataIT` e `SeedLoginIT` rodadas nesta parte (as 23 + 3 passam). A regressão completa (`verify`, front) fica para o fim da parte C.
Desvios: (1) `SeedLoginIT` está em `br.com.ctcore.identity`, não em `db`, porque `AuthBase` e `Totp` são do pacote `identity` (visibilidade de pacote); (2) o seed ainda tem os dados antigos de pessoas e financeiro (6 professores, 60 alunos etc. são das partes B); (3) a trava "professor com 2 turmas", "multiplo professor na unidade da principal" por `teacher_unit` e o responsável com "2 filhos menores" já existem em dados mínimos (guardian 1 tem os alunos 3 e 4, menores), mas a verificação de 2 turmas do `professor` entra na T4; o `SeedLoginIT` confere teacher ligado, aluno adulto, responsável com 2 menores e aluno da org 2.
Referências visuais: não se aplica (sem mudança de tela).
Não é do item: nenhuma mudança fora do escopo; `specs/itens/644-...md` ainda sem commit (fase 1/2).

### Parte B (T4 a T7) — sessão seguinte

- T4 — arquivos: `infra/seed/07` (Muay Thai oferecida em todas as unidades), `09` (6 professores: 5 na principal, 1 inativo, 1 na segunda; o 1-1 é `professor@`, o 1-2 é `multiplo@`), `10` (12 turmas: 9 na principal em 3 unidades e 3 modalidades, horários de seg a sáb; `professor@` titular das turmas 1 e 4), `11` (feriado e recesso de fim de ano em todas as unidades, datas relativas); `05`, `06`, `08` sem mudança além da parte A — prova: `SeedDataIT` (classesSeed, teachersSeed, noClassDaysSeed, modalitiesSeed) → passou.
- T5 — arquivos: `12` (60 alunos: 56 na principal com idades de 5 a 54, 4 na segunda; 12 responsáveis convidados novos, 24 menores em pares de irmãos; CPFs com dígitos verificadores calculados por função temporária `pg_temp.seed_cpf`), `13` (13 planos, 9 na principal em 3 unidades), `14` (matrículas: ativos, ex-alunos pelo último dígito 0, sem matrícula pelo 9), `15` (7 benefícios novos, um alto), `16` (14 graduações; 5 alunos com histórico) — prova: `SeedDataIT` (studentsSeed, enrollmentsSeed, benefitsSeed, enrollmentStartSeed, plansSeed) → passou.
- T6 — arquivos: `18` (cobranças com datas relativas a `current_date`: pendente, vence hoje, atrasada, em conferência, paga com os 8 meios, cancelada, renegociada com 3 parcelas, avulsas), `23` (2 comprovantes pendentes) — prova: `SeedDataIT#chargesSeed`, `paymentProofSeed` → passou.
- T7 — arquivos: `03` (convite pendente em `account_invite`), `17` (termo de imagem), `19` (3 enviados e 2 agendados, um por modalidade), `20` (8 notificações), `21` (24 aceites), `22` (8 pedidos: 4 tipos, 5 situações), `24` (12 leituras); `SeedDataIT` reescrito (contagens novas, busca de e-mails fora de `.test`/`.example` nos arquivos e nas tabelas, validade dos CPFs, reaplicação e banco limpo) — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='SeedDataIT,SeedLoginIT' -Dtest=NoSuchTest -Dsurefire.failIfNoSpecifiedTests=false -Djacoco.skip=true` → 29 testes, 0 falhas.

Desvios da parte B: (1) o cadastro só tem as situações calculadas ativo, ex-aluno e sem matrícula (NONE); "inativo" foi coberto por sem matrícula e "bloqueado" não é gravado (`blocked` é sempre falso, StudentSimple), então fica como ativo com cobrança atrasada (alunos com último dígito 8); (2) "6 professores" lido como 6 no total (5 na principal, 1 na segunda); (3) pagamentos gerados não ganham recibo (só o recibo fixo `SEEDRECEIPT00001`); (4) o seed ainda não foi aplicado no PostgreSQL local nem rodado `seed.sh`; (5) `SeedLoginIT` não mudou nesta parte.
Regressão: só `SeedDataIT` e `SeedLoginIT` rodadas (29 passam); `verify` completo, front e `gitleaks-rules.test.sh` ficam para o fim da parte C. Partes restantes: C (T8 e T9).
Referências visuais: não se aplica.
Não é do item: nenhuma.

### Parte C (T8 e T9) — sessão seguinte

- T8 — arquivos: `infra/scripts/seed.sh` (`--url`: recusa quando host ou banco contém `prod`, sem olhar a senha, ou quando `current_setting('ctcore.env')` é `production`; usa o `psql` da máquina, pula `*-local.sql`; sem `--url` o fluxo do compose é o mesmo de antes), `infra/scripts/seed.test.sh` (psql e docker simulados) — prova: `bash infra/scripts/seed.test.sh` → 7 casos ok (host prod, banco PROD, marcador, "prod" só na senha aplica, 24 arquivos aplicados e `-local` pulado, local usa docker, argumento inválido).
- T9 — arquivo: `README.md` (seção "Dados fictícios": 7 contas e senhas, segredo TOTP, passo a passo da homologação, aviso sobre senhas simples) — prova: texto conferido; `bash infra/scripts/gitleaks-rules.test.sh` → NAO_CONFERIDO local (gitleaks não instalado nesta máquina); vale o CI do PR (autonomia 2).

Regressão: `./backend/mvnw -f backend/pom.xml verify` → 2 falhas: `NoClassDayReadIT.lists` (linha 50, falha de novo ao rodar sozinha; o teste não toca o seed e depende da data de hoje, 20/11, que é feriado nacional e entra nas sugestões; falha anterior ao item, precisa de issue no formato das #318/#320 antes da rodada OK) e `EmailServiceIT.retries` (instável: passou ao rodar de novo). `SeedDataIT` e `SeedLoginIT` passam. Front-end não rodado: o item não toca o front.
Desvios da parte C: (1) `docker`/`psql` simulados no teste do script em vez de banco real; (2) `gitleaks` ausente local.
Referências visuais: não se aplica.
Não é do item: `NoClassDayReadIT.lists` (data), `EmailServiceIT.retries` (instável).

## Verificação

### Rodada 1 — OK — 2026-11-20, estado 8093a3db814e34e32d48711e9f1ec2dfcde4b8ad

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `SeedLoginIT.everyAccountLogsIn` e `linksPointToTheRightRecords`: login real das 7 contas, papéis, 1 e 2 unidades dos Administradores, professor ligado, aluno adulto, responsável com 2 menores |
| CA2 | PASSOU | `SeedLoginIT.everyAccountLogsIn`: `multiplo` sem vínculo ativo escolhido e com TEACHER+STUDENT; demais com um vínculo |
| CA3 | PASSOU | `SeedLoginIT.coordinatorTwoFactor`: decifra o seed com a chave local, confere o segredo do README e entra com o código TOTP |
| CA4 | PASSOU (com ressalva) | `SeedDataIT.studentsSeed`, `teachersSeed`, `organizationSettingsAreCompleteAndPreserved`. "Bloqueado" não é gravado no cadastro (suposição do item prevê o desvio); "inativo" coberto por sem matrícula; desvio anotado na Construção |
| CA5 | PASSOU | `SeedDataIT.chargesSeed`, `paymentProofSeed` (leitura de `18` e `23` confere as situações, 8 meios, renegociação em 3 parcelas, 2 comprovantes pendentes) |
| CA6 | PASSOU | `SeedDataIT.portalRequestSeed` (4 tipos, 5 situações), `announcementsSeed`, `noClassDaysSeed`, `enrollmentStartSeed` (5 alunos com histórico), `notificationsSeed`; convite pendente em `03` |
| CA7 | PASSOU | `SeedDataIT.fictitiousData` (arquivos e tabelas); busca própria por e-mail fora de `.test`/`.example` em `infra/seed` sem resultado |
| CA8 | PASSOU | `SeedDataIT.idempotent`, `keepsChanges`, `reproducible`, `fullSeedReproducible` |
| CA9 | PASSOU | `bash infra/scripts/seed.test.sh` (psql simulado): host prod, banco PROD, marcador recusam sem aplicar; homologação aplica 24 e pula `-local` |
| CA10 | PASSOU | `seed.test.sh`: sem `--url` usa `docker compose`, não `psql` |
| CA11 | PASSOU | README: 7 contas, segredo, passo a passo e aviso lidos no diff |

Comandos:
- `./backend/mvnw -f backend/pom.xml verify -Dit.test='SeedDataIT,SeedLoginIT' -Dtest=NoSuchTest -Dsurefire.failIfNoSpecifiedTests=false -Djacoco.skip=true` → 29 testes, 0 falhas, BUILD SUCCESS.
- `bash infra/scripts/seed.test.sh` → 7 casos ok.
- `gitleaks-rules.test.sh`: NAO CONFERIDO local (gitleaks ausente); limitação aceita, vale o CI do PR (autonomia 2).
- Regressão completa (`verify`, front) não reexecutada por mim: o item não toca código de produção nem front. A falha `NoClassDayReadIT.lists` já tem a issue aberta #582 (formato das #318/#320); `EmailServiceIT.retries` foi relatada como instável pela construção.
- Visual: não se aplica (sem tela).

Instáveis: `EmailServiceIT.retries` (relatado pela construção, passou ao rodar de novo; não reexecutado aqui).

Achados:
- sugestão, código, `infra/seed/12-alunos.sql` / `14-matriculas.sql` — o seed não tem aluno "bloqueado" nem "inativo" explícitos (limitação do cadastro, que só calcula ativo/ex-aluno/sem matrícula); registrar na descrição do PR.
- sugestão, código, `infra/scripts/seed.test.sh` — psql e docker simulados; a prova contra um banco real fica para a #662 (homologação).

## Entrega

**O que muda.** Seed com 2 organizações (a principal com 3 unidades) e 7 contas `.test` com Argon2id e vínculos certos (`03`, `04`). O Coordenador tem duas etapas de teste ativas (`25-duas-etapas-local.sql`, que o `--url` não aplica). Cerca de 60 alunos, 6 professores, 12 turmas, cobranças em todas as situações, pedidos do portal, comunicados, notificações e convites pendentes. `infra/scripts/seed.sh --url` aplica no banco remoto e recusa host ou banco com `prod`, ou `CTCORE_ENV=production`. O README traz contas, segredo e passo a passo da homologação.

**Como foi verificado.** Rodada 1 do `verificar`: `OK`, estado `8093a3db814e34e32d48711e9f1ec2dfcde4b8ad`, CA1 a CA11 passaram. Na entrega, repetido: `SeedDataIT` (26 testes passaram), `EmailServiceIT#retries` (passou isolado), `NoClassDayReadIT#lists` (falhou de novo isolado, ver abaixo). `seed.test.sh` e `SeedLoginIT` não foram repetidos aqui, a verificação já os cobriu.

**Regressão.** A base `dev` não avançou desde a branch, então vale a regressão da construção (`verify` completo, com 2 falhas):
- `backend/src/test/java/br/com/ctcore/agenda/NoClassDayReadIT.java:50`, `NoClassDayReadIT.lists`: `Expecting value to be true but was false`. Falha de linha de base, anterior ao item (não toca o seed da agenda). Registrada com comentário na #582 (https://github.com/ODevDosAnjos/CTCore/issues/582#issuecomment-7033336332).
- `backend/src/test/java/br/com/ctcore/mail/EmailServiceIT.java`, `EmailServiceIT.retries`: instável. Passou isolado nesta entrega. Issue técnica aberta: #667. A primeira linha do erro da execução completa não ficou anotada na construção.
- Front-end não rodado: o item não toca código de front.

**Decisões que quem ler precisa saber.** As da seção 6 (D1 a D6). Desvios da construção: o cadastro de aluno não grava "bloqueado" (o seed tem só ativo, ex-aluno e sem matrícula); os pagamentos gerados não têm recibo; o `seed.test.sh` usa `psql` e `docker` simulados.

**Limitações.** Sem tela: a comparação visual não se aplica. `gitleaks` não está instalado localmente: a prova de `gitleaks-rules.test.sh` e a varredura do segredo de teste em `25-duas-etapas-local.sql` ficam para o CI do PR. A prova contra banco real fica para a #662 (homologação, do dono). A #590 relata falha de `SeedDataIT.announcementsSeed` no CI de outro PR; aqui os 26 testes passaram, mas a confirmação fica para o CI.
