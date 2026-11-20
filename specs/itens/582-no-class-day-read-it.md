# 582 — NoClassDayReadIT.lists falha: canEdit falso (agenda)

Origem: issue #582 (corpo e comentário do dono sobre a regressão da #644). Branch: `item/582-no-class-day-read-it`.

## 1. Objetivo

Fazer `NoClassDayReadIT.lists` passar em qualquer dia do ano, corrigindo o dado do teste, sem enfraquecer a asserção de `canEdit`.

Causa achada na leitura (não é bug de produção): `NoClassDays.items` calcula `canEdit = start.isAfter(today)` com `today` no fuso da unidade, o que cumpre RN-AGE-10 ("editar e desfazer só valem antes do dia"). O teste usa `Holidays.next12Months(TODAY).get(0)`, e essa lista inclui o dia de hoje (`!isBefore(from)`). Em 20/11 (Consciência Negra, `BLACK_AWARENESS`) o primeiro feriado é hoje, então o dia confirmado começa hoje e `canEdit` é falso, como deve ser. O teste falha só quando hoje é feriado; não depende de hora do dia nem de UTC (`TODAY` já usa `America/Sao_Paulo`).

Fora do escopo: mudar a regra de `canEdit`; os outros ITs que usam `next12Months(TODAY).get(0)` e passam em dia de feriado (ver Riscos).

## 2. Requisitos

- R1: o teste `lists` escolhe um feriado estritamente depois de `TODAY`, para o dia confirmado ser editável (D1).
- R2: `suggestionDetails`, que também parte do primeiro feriado e depende do futuro para o dia confirmado e a sugestão, usa o mesmo critério (D1).
- R3: a asserção `canEdit` continua `isTrue()`; o código de produção não muda.
- R4: o teste não depende da data da JVM: usa `TODAY` no fuso da unidade.

## 3. Critérios de aceite

- CA1 (R1, R3): dado que hoje é feriado nacional, quando `NoClassDayReadIT.lists` roda, então passa, com `canEdit` verdadeiro para o dia confirmado no feriado seguinte.
- CA2 (R1, R2): dado um dia comum, quando `lists` e `suggestionDetails` rodam, então passam como antes.
- CA3 (R1, R4): dado o relógio do teste fixado em 20/11/2026 (feriado), quando os dois testes rodam, então passam (prova do caso de hoje feriado).
- CA4: dada a regressão `verify`, quando roda, então `NoClassDayReadIT` passa 5 de 5.

## 4. Plano técnico

- Dados, API, interface, segurança: não mudam.
- Arquivos (vistos no repositório):
  - `backend/src/test/java/br/com/ctcore/agenda/NoClassDayBase.java`: acrescentar `static Holidays.Holiday futureHoliday(int n)` (ou `LocalDate`) que devolve o n-ésimo de `Holidays.next12Months(TODAY.plusDays(1))`. `TODAY` já está na linha 25.
  - `backend/src/test/java/br/com/ctcore/agenda/NoClassDayReadIT.java`: `lists` (`holiday`) e `suggestionDetails` (`hs`) passam a usar `Holidays.next12Months(TODAY.plusDays(1))`.
- Reuso: `Holidays.next12Months(from)` aceita qualquer data de início; nada novo em produção.
- Riscos: `NoClassDayIgnoreIT` (linhas 26, 50, 65) usa `get(0)` de `TODAY`; hoje passa por não depender de `canEdit` nem de ser futuro. Se falhar em outro feriado, vira issue própria. A prova de dia de feriado: `next12Months` é estático e usa o parâmetro, então CA3 é coberto com um teste de unidade rápido de `Holidays` com `from = 2026-11-20` mostrando que o primeiro item é hoje (documenta a causa), sem mexer no relógio do IT.

## 5. Tarefas

- [x] T1: acrescentar o feriado futuro ao `NoClassDayBase` e usá-lo em `lists` e `suggestionDetails` — cobre CA1, CA2, CA4 — prova: `./backend/mvnw -f backend/pom.xml verify -Dit.test=NoClassDayReadIT`
- [x] T2: teste em `HolidaysTest` com `from = 2026-11-20`: o primeiro feriado é `BLACK_AWARENESS` em 20/11 e `from.plusDays(1)` o exclui — cobre CA3 — prova: `./backend/mvnw -f backend/pom.xml test -Dtest=HolidaysTest`

## 6. Decisões

- D1: corrigir o dado do teste (feriado depois de hoje), não a regra de `canEdit`. Motivo: RN-AGE-10 diz que editar só vale antes do dia, então o produto está certo e a falha era do dado. Alternativa descartada: relógio fixo no teste (mais código, e o teste de hoje-feriado fica em T2).
- Suposição: a falha de 15/11 relatada na issue tinha outra causa ou foi o feriado da República (15/11, também `next12Months(TODAY).get(0)`); a mesma correção cobre os dois casos.

## Construção

- T1 — arquivos: `backend/src/test/java/br/com/ctcore/agenda/NoClassDayReadIT.java` (`lists` e `suggestionDetails` usam `next12Months(TODAY.plusDays(1))`) — prova: `./backend/mvnw -f backend/pom.xml verify -Dtest=HolidaysTest -Dit.test=NoClassDayReadIT` → NoClassDayReadIT 5 de 5, rodado em 20/11/2026 (hoje é feriado, o caso do bug)
- T2 — arquivos: `backend/src/test/java/br/com/ctcore/agenda/HolidaysTest.java` (`windowIncludesToday`) — prova: mesmo comando → HolidaysTest 3 de 3
Regressão: `verify` completo não rodado nesta sessão; só os testes do item (a mudança é só de teste).
Desvios: o plano pedia um ajudante em `NoClassDayBase`; não foi criado, pois só dois pontos usam a expressão (`TODAY.plusDays(1)` direto no `NoClassDayReadIT`).

## Verificação

### Rodada 1 — OK — 2026-11-20, estado f17f6b6d660df9d7fa13444db2e3e34a348ee1d6

| Critério | Status | Evidência |
|---|---|---|
| CA1 | PASSOU | `NoClassDayReadIT.lists` passou em 20/11/2026 (hoje é feriado); asserção `canEdit` isTrue intacta, produção sem mudança |
| CA2 | PASSOU | `lists` e `suggestionDetails` passam; o diff só desloca a janela para `TODAY.plusDays(1)` |
| CA3 | PASSOU | `HolidaysTest.windowIncludesToday` (from 2026-11-20 → BLACK_AWARENESS hoje; +1 dia exclui); o IT rodou no próprio dia de feriado |
| CA4 | PASSOU | `NoClassDayReadIT` 5 de 5 (ver log) |

Comandos: `./backend/mvnw -f backend/pom.xml verify -Dtest=HolidaysTest -Dit.test='NoClassDay*IT' -Djacoco.skip=true` → BUILD SUCCESS; ITs NoClassDay* 23 de 23, 0 falhas. Regressão completa (`verify` inteiro, front) não rodada: mudança só em testes do back-end, CI do PR cobre.
Achados:
- sugestão, código, `NoClassDayIgnoreIT` — também usa `next12Months(TODAY).get(0)`; passou hoje (feriado), sem ação.

## Entrega

O que muda: só testes do back-end. `NoClassDayReadIT` passa a usar `TODAY.plusDays(1)` como início da janela de feriados, em vez de `TODAY`. Hoje (20/11) é feriado (Consciência Negra), então a agenda marcava o dia como sem aula e o `canEdit` ficava falso. Produção não mudou. `HolidaysTest.windowIncludesToday` cobre o caso: com início em hoje, o feriado aparece; com início em amanhã, sai.

Verificação: rodada 1 OK (estado `f17f6b6d`). Os ITs `NoClassDay*` passaram 23 de 23 e `HolidaysTest` passou, com `-Djacoco.skip=true`.

Regressão: `verify` completo não rodado localmente; a base (`dev`) não avançou desde a verificação. O CI do PR roda a suíte.

Decisões: sem ajudante em `NoClassDayBase`, porque só dois pontos usam a expressão.

Limitação: o teste continua dependendo da data da JVM. O ajuste `plusDays(1)` cobre o feriado do dia, não qualquer data futura de feriado.
