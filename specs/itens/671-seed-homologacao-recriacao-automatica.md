# 671 — Seed de homologação: recriar o stg automaticamente e dados com cara real (Rio, nome.sobrenome)

Origem: issue #671 (Sprint 10.5, técnica, infra; autor `ODevDosAnjos`). Substitui a #662. Parte da #644 (`specs/itens/644-seed-realista-contas-faceis.md`, D3, D5 e D6 mantidas). Branch: `item/671-seed-homologacao-recriacao-automatica`.

## 1. Objetivo

Fazer a homologação (stg) ficar com o seed novo sem o dono rodar nada: com uma variável de ambiente ligada, a API, ao subir, compara a impressão digital (hash) dos arquivos `infra/seed/*.sql` com a última aplicada e, se mudou, apaga tudo, recria as tabelas pelas migrações e aplica o seed. O seed ganha dados com cara real (Rio de Janeiro, `nome.sobrenome@ctcore.test`, famílias coerentes, sem "Fictício"). O `seed.sh --url` passa a fazer o mesmo, corrigindo os problemas do Windows.

Fora do escopo: mudar tela, rota, contrato ou regra de negócio; mudar as 7 contas, senhas e perfis da #644; rodar na homologação (o dono liga a variável depois do merge); qualquer coisa em produção.

## 2. Requisitos

- R1: sem `CTCORE_SEED=homologacao`, a API sobe como hoje e não toca os dados.
- R2: com a variável, depois das migrações, a API calcula o hash dos `*.sql` do diretório do seed (sem `*-local.sql`, em ordem de nome) e compara com o gravado no banco. Igual: não faz nada. Diferente ou ausente: apaga tudo, recria as tabelas pelas migrações, aplica o seed e grava o hash novo.
- R3: o seed é aplicado pelo usuário de migração (dono das tabelas, sem superusuário), numa transação, tirando o `FORCE ROW LEVEL SECURITY` só durante a aplicação e devolvendo-o às mesmas tabelas antes do commit. O usuário da API (`ctcore_app`) não ganha privilégio novo.
- R4: com a variável e o banco com `ctcore.env=production` (ou `CTCORE_ENV=production` no ambiente), nada é aplicado e a API não sobe, com mensagem clara no log.
- R5: um só processo aplica por vez (trava consultiva no banco).
- R6: fonte única: os arquivos de `infra/seed/` entram na imagem do back-end no build, sem cópia no repositório.
- R7: conteúdo: organização principal com 3 unidades em bairros do Rio (Tijuca, Botafogo, Barra da Tijuca) e a segunda em Niterói; CEPs do RJ, telefones com DDD 21; nomes inventados de academias e unidades (sem nome de equipe conhecida), sem "Fictíci" em nada que aparece na tela; sem nome completo repetido; menor com o sobrenome de ao menos um responsável; endereços variados; e-mails `nome.sobrenome@ctcore.test` (alunos, responsáveis, professores, convidados), todo e-mail do seed em `.test`; as 7 contas, senhas e perfis da #644 inalterados.
- R8: `seed.sh --url` passa a URL com `-d` e as opções antes dela, define `PGCLIENTENCODING=UTF8`, mostra o erro real do `psql` e, com `--url`, recria do zero com o mesmo tratamento de RLS e as mesmas travas da API; sem `--url`, o fluxo local fica como está.
- R9: o README explica a variável, que o stg é recriado quando o seed muda (dados feitos à mão se perdem) e o caminho manual como alternativa.
- R10: as duas etapas do Coordenador continuam configuradas no primeiro acesso, também depois de cada recriação (D3 da #644; `25-duas-etapas-local.sql` segue só local).

## 3. Critérios de aceite

- CA1 (R1): dado o contexto normal de testes (sem a variável), quando a API sobe com dados no banco, então nada é apagado e o bean do seed não existe.
- CA2 (R4): dado `ctcore.env=production` no banco, quando o seed de homologação roda, então lança erro com a mensagem, nada é apagado nem aplicado.
- CA3 (R2): dado um banco com o seed antigo (mesmos ids, dados de outras contas) e linhas extras, quando roda, então só existe o seed novo e as 7 contas entram; as linhas extras somem.
- CA4 (R2): dado seed já aplicado com o mesmo hash, quando roda de novo, então não recria: uma linha criada depois continua lá.
- CA5 (R2): dado um arquivo `*.sql` alterado (hash diferente), quando roda, então recria e grava o hash novo; mudar só um `*-local.sql` não muda o hash.
- CA6 (R3): dado um dono das tabelas sem superusuário e com `FORCE ROW LEVEL SECURITY`, quando aplica, então funciona; ao fim, as mesmas tabelas seguem com `FORCE`, e `ctcore_app` lê os dados do seed pela RLS.
- CA7 (R3): dado erro num arquivo do seed, quando aplica, então a transação desfaz e o `FORCE` continua nas tabelas.
- CA8 (R5): dado outro processo segurando a trava, quando roda, então espera ou desiste sem aplicar duas vezes.
- CA9 (R7): `SeedDataIT`: nenhum nome completo repetido (alunos, responsáveis, professores); cada menor tem o sobrenome de um responsável; todo e-mail em `.test`; nenhum texto com "Fictíci"; unidades e CEPs do RJ, DDD 21; endereços com mais de uma rua e CEP.
- CA10 (R7, R10): `SeedLoginIT` segue passando com as 7 contas (e-mails, senhas, perfis).
- CA11 (R8): `seed.test.sh`: a URL vai com `-d` antes dos argumentos posicionais, o erro real do `psql` aparece, `-local.sql` é pulado, as travas de produção seguem.
- CA12 (R6): `docker build -f backend/Dockerfile .` gera imagem com `/app/seed/*.sql`; sem `*-local.sql` desnecessário não é problema, o código os ignora.
- CA13 (R9): README lido no diff com variável, aviso de perda de dados e caminho manual.

## 4. Plano técnico

- Dados: sem migração. A API cria, só no modo seed, a tabela fora do Flyway `ctcore_seed_state (hash text, applied_at timestamptz)` (uma linha). O `flyway clean` a apaga junto; ela é recriada depois de aplicar. D1.
- API: não muda (sem rota, sem OpenAPI).
- Interface: não muda.
- Segurança: segredo nenhum; o seed só roda com a variável, nunca em produção (R4); `ctcore_app` sem privilégio novo; o `flyway clean` exige `spring.flyway.clean-disabled=false`, ligado só no modo seed, nunca no `application.yml` padrão.
- Arquivos:
  - a criar `backend/src/main/java/br/com/ctcore/seed/HomologationSeed.java`: calcula o hash, lê o estado, pega `pg_advisory_lock`, checa produção, chama `flyway.clean()` + `migrate()`, e aplica os `.sql` numa transação (`NO FORCE`/`FORCE` nas tabelas com `relforcerowsecurity`, lista lida do catálogo antes), grava o hash. Recebe `Flyway`, `DataSource` do usuário de migração e o diretório.
  - a criar `backend/src/main/java/br/com/ctcore/seed/HomologationSeedConfig.java`: `@ConditionalOnProperty("ctcore.seed.mode", havingValue = "homologacao")`, bean `FlywayMigrationStrategy` que chama o `HomologationSeed` (migração normal quando o hash é igual) e propriedades `spring.flyway.clean-disabled=false` aplicadas no modo.
  - alterar `backend/src/main/resources/application.yml`: `ctcore.seed.mode: ${CTCORE_SEED:}` e `ctcore.seed.dir: ${CTCORE_SEED_DIR:/app/seed}`.
  - alterar `backend/Dockerfile`: contexto passa a ser a raiz do repositório (`COPY backend/...`, `COPY infra/seed /app/seed`); criar `.dockerignore` na raiz (exclui `frontend/node_modules`, `.git`, `.capturas`, `docs`, etc.).
  - alterar `.github/workflows/ci.yml` (linha 195), `.github/workflows/publish.yml` (linha 74), `infra/scripts/publish-image.sh` (linha 13) e `README.md` (linha 106): `docker build -f backend/Dockerfile` com contexto `.` só para o back-end; o front-end não muda. Conferir `infra/scripts/changed-areas.sh` para que mudança em `infra/seed` rode o job do back-end.
  - alterar `infra/seed/*.sql` (conteúdo, R7), renomeando para português mantendo a ordem: `01-organizacoes`, `02-configuracoes`, `03-contas`, ... `25-duas-etapas-local`; atualizar as referências (`SeedDataIT`, `SeedLoginIT`, `seed.sh`, README).
  - alterar `infra/scripts/seed.sh` e `infra/scripts/seed.test.sh`: ver R8.
  - alterar `backend/src/test/java/br/com/ctcore/db/SeedDataIT.java` e `identity/SeedLoginIT.java`: asserts de nome da organização e de e-mail; novos testes do R7.
  - a criar `backend/src/test/java/br/com/ctcore/seed/HomologationSeedIT.java` (herda `PostgresIT`; banco extra com dono sem superusuário para CA6).
  - alterar `README.md` seção Homologação.
- Reuso: `SeedDataIT.apply/cleanAll`, `PostgresIT` (Testcontainers), travas e mensagens de `seed.sh`, `pg_temp.seed_cpf/seed_key` dos arquivos do seed.
- Riscos: (a) Render precisa do contexto do Docker na raiz e do arquivo `backend/Dockerfile`: se o dono não ajustar, o build do stg falha e o deploy anterior continua no ar (D2); (b) `flyway clean` pode apagar o `default privileges` do `ctcore_app` se Flyway apagar o schema: CA6 prova que `ctcore_app` lê depois; (c) renomear os arquivos do seed quebra referências por nome: a busca por `infra/seed/` e pelos nomes antigos entra na T7; (d) trabalho de conteúdo é grande (12 dos 25 arquivos citam "ficticia") e deve ser conferido pelo `SeedDataIT`.

## 5. Tarefas

Item grande: três partes, cada uma numa sessão de construção. Parte 1 (T1 a T3, infra Java e imagem), Parte 2 (T4 a T6, conteúdo do seed), Parte 3 (T7 a T9, script e README).

- [x] T1: `HomologationSeed` (hash, estado, trava, produção, clean+migrate, aplicação transacional com NO FORCE/FORCE) e `HomologationSeedConfig` com as propriedades — cobre CA1 a CA8 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=HomologationSeedIT -Dtest=NoSuchTest -Dsurefire.failIfNoSpecifiedTests=false -Djacoco.skip=true`
- [x] T2: `HomologationSeedIT` com os casos CA1 a CA8 (seed antigo com mesmos ids e dados extras; segunda subida; hash alterado; `-local` ignorado; dono sem superusuário; falha na transação; produção; trava) — cobre CA1 a CA8 — prova: mesma da T1
- [x] T3: Dockerfile com contexto na raiz, `.dockerignore`, ajuste de `ci.yml`, `publish.yml`, `publish-image.sh`, `changed-areas.sh` e comando do README — cobre CA12 — prova: `docker build -f backend/Dockerfile -t ctcore-backend .` e `docker run --rm --entrypoint ls ctcore-backend /app/seed`, com a limpeza da imagem anterior como manda o AGENTS.md; `bash infra/scripts/changed-areas.test.sh`
- [x] T4: reescrever 01 a 11 (organizações, unidades no Rio, contas das 7 pessoas inalteradas, professores, turmas, agenda) sem "Fictíci", com nomes inventados de academias e unidades, CEPs e DDD do RJ/Niterói; renomear em português — cobre CA9, CA10 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='SeedDataIT,SeedLoginIT' -Dtest=NoSuchTest -Dsurefire.failIfNoSpecifiedTests=false -Djacoco.skip=true`
- [x] T5: reescrever 12 a 17 (alunos e responsáveis sem nome repetido, famílias coerentes, endereços variados, e-mails `nome.sobrenome@ctcore.test`; planos, matrículas, benefícios, termos sem "Fictício") — cobre CA9 — prova: mesma da T4
- [x] T6: reescrever 18 a 24 (cobranças, comunicados, notificações, aceites, pedidos, comprovantes, avisos) sem "Fictíci" e com nomes plausíveis; novos testes em `SeedDataIT` (nome repetido, sobrenome do responsável, `.test`, "Fictíci", RJ/DDD 21, endereços) — cobre CA9, CA10 — prova: mesma da T4
- [x] T7: `seed.sh`: `-d`, opções antes da URL, `PGCLIENTENCODING=UTF8`, erro real do `psql`, recriação do zero com `--url` (NO FORCE/FORCE, travas) — cobre CA11 — prova: `bash infra/scripts/seed.test.sh`
- [x] T8: `seed.test.sh` com os casos novos (URL por `-d`, erro real, `-local` pulado, recriação) — cobre CA11 — prova: `bash infra/scripts/seed.test.sh`
- [x] T9: README (variável `CTCORE_SEED`, recriação, aviso de perda, caminho manual, comando de build da imagem) e anotar em "Para o dono" o que fazer no Render — cobre CA13 — prova: conferência do diff do README

## 6. Decisões

- D1: o hash fica numa tabela `ctcore_seed_state` criada pela própria API no modo seed, fora do Flyway, porque o `clean` a leva junto e ela não existe na produção. Alternativa descartada: migração Flyway (cria tabela em toda instalação por causa de um recurso de homologação).
- D2 (muda o comportamento): o contexto de build da imagem do back-end passa a ser a raiz do repositório (`docker build -f backend/Dockerfile .`), para a imagem levar `infra/seed/` sem cópia. O dono precisa trocar, uma vez, o contexto e o caminho do Dockerfile do serviço no Render. Alternativa descartada: mover o seed para `backend/src/main/resources` (muda o caminho `infra/seed/` que o AGENTS.md e a #644 usam).
- D3: o diretório do seed na imagem é `/app/seed` (`ctcore.seed.dir`); nos testes aponta para `../infra/seed`.
- D4: sinais de produção: `ctcore.env=production` no banco (`current_setting('ctcore.env', true)`), igual ao `seed.sh`, e `CTCORE_ENV=production` no ambiente (já tratado no `seed.sh`). Não existe outro sinal no código.
- D5: nomes de arquivos do seed passam para português (permitido pela issue), mantendo o prefixo numérico; `25-duas-etapas-local.sql` mantém o sufixo `-local`.
- D6: o hash é SHA-256 sobre pares nome do arquivo + bytes, em ordem de nome, sem `*-local.sql`; renomear arquivo muda o hash e recria (esperado).
- Suposição: o usuário de migração do Render é dono das tabelas e pode criar tabela no schema `public`; se não for, a aplicação não sobe com mensagem do PostgreSQL e o dono precisa conceder o papel. Também se supõe que o `flyway clean` mantém os `default privileges` do `ctcore_app`; se não mantiver, a CA6 falha e a T1 reaplica os `grant`s depois do `migrate` (sem privilégio novo, só os que o papel já tinha).

## Construção

Partes 1, 2 e 3 feitas (T1 a T9).

- T1 — arquivos: `backend/src/main/java/br/com/ctcore/seed/HomologationSeed.java`, `HomologationSeedConfig.java`, `backend/src/main/resources/application.yml` (`ctcore.seed.mode/dir`) — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=HomologationSeedIT -Dtest=NoSuchTest -Dsurefire.failIfNoSpecifiedTests=false -Djacoco.skip=true` → 8 testes, 0 falhas
- T2 — arquivo: `backend/src/test/java/br/com/ctcore/seed/HomologationSeedIT.java` (CA1 a CA8; banco novo por caso, dono `seed_owner` sem superusuário) — prova: mesma da T1 → 8 de 8 passaram
- T3 — arquivos: `backend/Dockerfile` (contexto na raiz, `COPY infra/seed /app/seed`), `.dockerignore` (raiz), `.github/workflows/ci.yml`, `.github/workflows/publish.yml`, `infra/scripts/publish-image.sh`, `infra/scripts/changed-areas.sh` e `.test.sh` (caso `infra/seed/` roda o back-end), `README.md` (comando de build) — prova: `docker build -f backend/Dockerfile -t ctcore-backend .` → ok; `docker run --rm --entrypoint ls ctcore-backend /app/seed` → 25 arquivos; `bash infra/scripts/changed-areas.test.sh` → todos ok. Limpeza: `ctcore-backend` reconstruída (mesma etiqueta, nenhum `<none>` deixado).
Desvios:
- O `HomologationSeed` recebe o `Flyway` (e usa o `DataSource` dele, que é o do usuário de migração) em vez de um `DataSource` separado; o `clean` é ligado com `Flyway.configure().configuration(...).cleanDisabled(false)` dentro da estratégia, em vez da propriedade `spring.flyway.clean-disabled`, para nunca existir no `application.yml`.
- Além do plano: o `flyway clean` leva os privilégios do `ctcore_app` junto (ex.: sem DELETE em `student`). O seed lê os privilégios do papel da API antes do clean e os devolve exatamente depois do migrate (a CA6 prova com `revoke delete on student`); a tabela `ctcore_seed_state` fica sem acesso para o `ctcore_app`. Sem privilégio novo.
- Trava consultiva bloqueante (`pg_advisory_lock`): o segundo processo espera e, ao entrar, vê o hash já gravado e não aplica de novo.
Regressão (parte 1): `./backend/mvnw -f backend/pom.xml verify` → BUILD SUCCESS (165 testes rápidos e 920 de integração, 0 falhas, JaCoCo ok). Front-end não tocado nesta parte; não rodou.
Pendências do dono (parte 3 registra em "Para o dono"): no Render, trocar o contexto do Docker do serviço do back-end para a raiz do repositório e o caminho do Dockerfile para `backend/Dockerfile`; depois ligar `CTCORE_SEED=homologacao`.

Parte 2 (T4 a T6, sessão seguinte):
- T4 — arquivos: `infra/seed/01-organizacoes.sql`, `02-configuracoes.sql`, `03-contas.sql` (renomeados com `git mv`), `04-unidades.sql` (cidade, endereço, CEP e telefone DDD 21), `09-professores.sql`, `11-agenda.sql`, comentários de `05` a `10`. Organizações `Academia Maré Alta` (unidades Tijuca, Botafogo, Barra da Tijuca; `short_name` `mare-alta-*`) e `Academia Ponte Azul` (Icaraí, Niterói). As 7 contas, senhas e perfis não mudaram; convidado e desativado agora são `henrique.valadares@ctcore.test` e `claudia.rezende@ctcore.test`. Prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test='SeedDataIT,SeedLoginIT,HomologationSeedIT' -Dtest=NoSuchTest -Dsurefire.failIfNoSpecifiedTests=false -Djacoco.skip=true` → 38 testes, 0 falhas.
- T5 — arquivos: `12-alunos.sql` (reescrito: nomes por lista, sem repetição; menores com o sobrenome do responsável; funções `pg_temp.seed_email` e `seed_addr` com 4 ruas/CEP por unidade; telefones 21; RJ), `13-planos.sql` (Centro/Norte viram Botafogo/Barra), `15-beneficios.sql`, `17-termos.sql` — prova: mesma da T4 → passou.
- T6 — arquivos: `20-notificacoes.sql` (nomes), `backend/src/test/java/br/com/ctcore/db/SeedDataIT.java` (novo `realisticData`: nome completo único por organização entre alunos, responsáveis e professores; 26 menores todos com o sobrenome de um responsável; nada com "Fictíci" nas colunas de tela; Rio de Janeiro e Niterói, CEP 2x, DDD 21; mais de 4 ruas e CEPs; e-mails `nome.sobrenome@ctcore.test`; a verificação de e-mail dos arquivos e das tabelas agora exige `.test`), `HomologationSeedIT.java` (nome do arquivo `01-organizacoes.sql`) — prova: mesma da T4 → passou.
Desvios (parte 2): `cleanAll` e `cleanTeachers` do `SeedDataIT` passaram a apagar `charge_reminder` antes de `charge`: o FK da tabela (V43) impedia a limpeza quando o job de lembretes grava linhas sobre cobranças do seed. Arquivos de `19`, `21` a `24` não precisaram de mudança (já sem "Fictíci" e sem nome de pessoa). Comentários em inglês dos arquivos do seed ficaram como estavam.
Regressão da parte 2: só os três ITs de seed rodaram (38 de 38); a regressão completa fica para a parte 3.

Parte 3 (T7 a T9, sessão seguinte):
- T7 — arquivo: `infra/scripts/seed.sh`: `PGCLIENTENCODING=UTF8`; com `--url`, `psql -v ON_ERROR_STOP=1 -tA -d "$url" ...` (opções antes, URL por `-d`), sem `2>&1`/`/dev/null` no erro do `psql`; recriação do zero numa transação (`pg_advisory_xact_lock(6710671)`, mesma chave da API; `NO FORCE` nas tabelas com `relforcerowsecurity`; `truncate ... restart identity cascade` de todas as tabelas do `public` menos `flyway_schema_history` e `ctcore_seed_state`; `\i` de cada arquivo sem `-local`; `FORCE` de volta; `commit`); sem `--url` o fluxo local não mudou. Prova do SQL gerado contra PostgreSQL 16.4 real (tabela de teste com `FORCE`): linha antiga some, nova entra, `relforcerowsecurity` volta a `t`; container `seedtest` removido.
- T8 — arquivo: `infra/scripts/seed.test.sh` (psql simulado agora registra o stdin de `-f -`; casos: URL por `-d`, recriação com NO FORCE/FORCE/truncate/trava, `PGCLIENTENCODING=UTF8`, erro real do `psql`, `-local` pulado, travas de produção) — prova: `bash infra/scripts/seed.test.sh` → 11 `ok`, 0 falhas.
- T9 — arquivo: `README.md` (seção Homologação: `CTCORE_SEED=homologacao`, hash, recriação, aviso de perda de dados, produção, caminho manual, build com contexto na raiz e Render) — conferência do diff feita.
Desvios (parte 3): a "recriação do zero" do `seed.sh --url` apaga os dados (truncate) e mantém o esquema, em vez de `flyway clean`, porque o script não roda o Flyway; o esquema já vem das migrações do back-end implantado. Mesma trava e mesmo tratamento de RLS da API.
Para o dono (Render): trocar, uma vez, o contexto do Docker do serviço do back-end para a raiz do repositório e o caminho do Dockerfile para `backend/Dockerfile`; depois ligar `CTCORE_SEED=homologacao`.
Regressão final (parte 3): `./backend/mvnw -f backend/pom.xml verify` → BUILD SUCCESS (165 testes rápidos e 921 de integração, 0 falhas, JaCoCo ok); `bash infra/scripts/seed.test.sh` → 11 ok; `bash infra/scripts/changed-areas.test.sh` → ok. Front-end não tocado; não rodou. Visual do CI: não se aplica (item sem tela).
Não é do item: nenhum.

## Verificação

### Rodada 1 — OK — 2026-11-20, estado 8105c275b267cf50444c806c2ac659d02dfadd3d

| Critério | Status | Evidência |
|---|---|---|
| CA1 a CA8 | PASSOU | `HomologationSeedIT` dentro do `verify` completo (921 ITs, 0 falhas) |
| CA9 | PASSOU | `SeedDataIT.realisticData` no `verify` completo; `grep Fictíci/ficticia` em `infra/seed/*.sql` sem resultado |
| CA10 | PASSOU | `SeedLoginIT` no `verify` completo |
| CA11 | PASSOU | `bash infra/scripts/seed.test.sh` → 11 ok (`-d`, erro real, `-local` pulado, travas) |
| CA12 | PASSOU | `docker build -f backend/Dockerfile -t ctcore-backend .` ok; `ls /app/seed` na imagem → 25 arquivos; só uma imagem `ctcore-backend`, sem `<none>` |
| CA13 | PASSOU | diff do README: variável, aviso de perda de dados, caminho manual, comando de build |

Comandos: `./backend/mvnw -f backend/pom.xml verify` → BUILD SUCCESS (921 ITs, 0 falhas, JaCoCo ok); `bash infra/scripts/seed.test.sh` → ok; `bash infra/scripts/changed-areas.test.sh` → ok; build da imagem acima. Front-end não tocado (não rodou); sem tela, visual não se aplica.
Achados:
- sugestão, código, `HomologationSeed.run` — o `CTCORE_ENV` é lido só no `HomologationSeedConfig`; ok, mas o trecho `flyway.clean` só roda depois da checagem de produção (conferido), sem ação.
- sugestão, especificação — a 25ª entrada na imagem é `25-duas-etapas-local.sql`, ignorada pelo código; sem ação.

## Entrega

- **O que muda:** com `CTCORE_SEED=homologacao`, a API, depois das migrações, compara o hash SHA-256 dos `infra/seed/*.sql` (sem `*-local.sql`) com o gravado em `ctcore_seed_state`; se mudou ou falta, faz `flyway clean` + `migrate`, aplica o seed numa transação (NO FORCE/FORCE só durante a aplicação) e grava o hash novo. Trava consultiva; `ctcore.env=production` bloqueia. A imagem do back-end passa a ser construída com contexto na raiz (`backend/Dockerfile` leva `infra/seed` em `/app/seed`). Dados do seed: organizações no Rio e Niterói, nomes inventados, e-mails `nome.sobrenome@ctcore.test`, sem "Fictício". `seed.sh --url` recria do zero com a mesma trava e o mesmo tratamento de RLS; corrige `-d`, `PGCLIENTENCODING=UTF8` e o erro real do `psql`.
- **Verificado:** rodada 1 OK (estado `8105c275b267cf50444c806c2ac659d02dfadd3d`): `verify` completo (921 ITs, 0 falhas, JaCoCo ok); `bash infra/scripts/seed.test.sh` → 11 ok; `bash infra/scripts/changed-areas.test.sh` → ok; `docker build -f backend/Dockerfile -t ctcore-backend .` e `/app/seed` com 25 arquivos. Front-end não tocado.
- **Decisões (detalhe na especificação, D1 a D6):** hash em tabela `ctcore_seed_state` criada só no modo seed (D1); contexto de build na raiz (D2); `/app/seed` (D3); produção pelo `ctcore.env` no banco e pelo `CTCORE_ENV` (D4); arquivos do seed em português mantendo a ordem (D5); SHA-256 sobre nome + bytes (D6).
- **Limitações:** a recriação apaga dados feitos à mão no stg. `seed.sh --url` recria só os dados (mantém o esquema das migrações do back-end implantado). O dono precisa, uma vez, trocar no Render o contexto do Docker para a raiz e o Dockerfile para `backend/Dockerfile` antes de ligar `CTCORE_SEED=homologacao`.
- **Regressão:** a base `dev` não avançou desde a verificação (`dev` = `4b32a41`), então a regressão da rodada 1 vale.
- **Fora do item:** a #662 segue aberta (o backlog a marca como substituída pela #671); este PR não a fecha.
