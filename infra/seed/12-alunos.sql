-- Alunos (RF-ALU-01, #644, #671): 56 na organização principal (5 a 54 anos, menores com responsável, irmãos com o mesmo responsável e o sobrenome dele) e 4 na segunda.
-- Nomes inventados, sem repetir nome completo; e-mails nome.sobrenome@ctcore.test; endereços do Rio de Janeiro (Tijuca, Botafogo, Barra da Tijuca) e de Niterói (Icaraí), telefones com DDD 21.
-- As situações vêm das matrículas em 14-matriculas.sql (o sistema calcula): ativo, ex-aluno, sem matrícula e ativo com cobranças em atraso.
-- O responsável 1 é a conta responsavel@ctcore.test; os demais são contas convidadas (sem senha). Todo CPF é um número inventado válido (dígitos verificadores calculados).
create function pg_temp.seed_cpf(seed bigint) returns text language plpgsql as $$
declare base text := lpad((((seed * 7919 + 123456789) % 900000000) + 100000000)::text, 9, '0'); sum1 int := 0; sum2 int := 0; d1 int; d2 int;
begin
    for i in 1..9 loop
        sum1 := sum1 + substr(base, i, 1)::int * (11 - i);
        sum2 := sum2 + substr(base, i, 1)::int * (12 - i);
    end loop;
    d1 := case when sum1 % 11 < 2 then 0 else 11 - sum1 % 11 end;
    sum2 := sum2 + d1 * 2;
    d2 := case when sum2 % 11 < 2 then 0 else 11 - sum2 % 11 end;
    return base || d1 || d2;
end $$;

create function pg_temp.seed_key(name text) returns text language sql immutable as $$
    select lower(translate(name, 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'))
$$;

-- nome.sobrenome@ctcore.test, sem acento.
create function pg_temp.seed_email(name text) returns text language sql immutable as $$
    select replace(pg_temp.seed_key(name), ' ', '.') || '@ctcore.test'
$$;

-- Endereço de quem treina na unidade (1 Tijuca, 3 Botafogo, 4 Barra da Tijuca, 2 Icaraí em Niterói): {rua, CEP, bairro, cidade, UF}.
-- Quatro ruas por unidade, escolhidas pelo número do aluno.
create function pg_temp.seed_addr(unit_n int, n int) returns text[] language sql immutable as $$
    select string_to_array((case unit_n
        when 1 then array['Rua Conde de Bonfim|20520054', 'Rua Uruguai|20510060', 'Rua General Roca|20521070', 'Rua Professor Gabizo|20271062']
        when 3 then array['Rua Voluntários da Pátria|22270010', 'Rua São Clemente|22260001', 'Rua Real Grandeza|22281034', 'Rua Farani|22231020']
        when 4 then array['Avenida das Américas|22640102', 'Rua Jorge Curi|22631260', 'Avenida Olegário Maciel|22621200', 'Rua Bruno Giorgi|22775040']
        else array['Rua Miguel de Frias|24220001', 'Rua Moreira César|24230052', 'Avenida Roberto Silveira|24230150', 'Rua Gavião Peixoto|24230100'] end)[1 + n % 4], '|')
        || array[case unit_n when 1 then 'Tijuca' when 3 then 'Botafogo' when 4 then 'Barra da Tijuca' else 'Icaraí' end,
                 case unit_n when 2 then 'Niterói' else 'Rio de Janeiro' end, 'RJ']
$$;

-- Responsáveis 3 a 14: uma conta convidada cada; cada um tem dois filhos (menores consecutivos 7..30, que levam o sobrenome do responsável).
insert into account (id, email, name, status)
select md5('ctcore-seed-account-' || (100 + g.n))::uuid, pg_temp.seed_email(g.name), g.name, 'INVITED'
from (select n, (array['Marcelo','Renata','Sandro','Aline','Fábio','Tatiane','Leandro','Cíntia','Rodrigo','Viviane','Alexandre','Daniela'])[n - 2]
             || ' ' || (array['Tavares','Siqueira','Moura','Cavalcanti','Peixoto','Bastos','Figueiredo','Albuquerque','Medeiros','Duarte','Pacheco','Rangel'])[n - 2] as name
      from generate_series(3, 14) as n) as g
on conflict do nothing;

insert into account (id, email, name, status)
select md5('ctcore-seed-account-' || g.n)::uuid, g.email, g.name, 'INVITED'
from (values (8, 'roberto.barbosa@ctcore.test', 'Roberto Barbosa')) as g(n, email, name)
on conflict do nothing;

insert into account_link (id, account_id, organization_id, role, status, starts_on)
select md5('ctcore-seed-link-' || (200 + g.n))::uuid, md5('ctcore-seed-account-' || (100 + g.n))::uuid, md5('ctcore-seed-org-1')::uuid, 'GUARDIAN', 'PENDING', date '2026-01-01'
from generate_series(3, 14) as g(n)
on conflict do nothing;

insert into account_link (id, account_id, organization_id, role, status, starts_on)
select md5('ctcore-seed-link-' || (g.n + 10))::uuid, md5('ctcore-seed-account-' || g.n)::uuid, md5('ctcore-seed-org-1')::uuid, 'GUARDIAN', 'PENDING', date '2026-01-01'
from (values (8)) as g(n)
on conflict do nothing;

insert into guardian (id, organization_id, account_id, name, cpf, phone)
select md5('ctcore-seed-guardian-' || g.n)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-account-' || g.account_n)::uuid, g.name, g.cpf, g.phone
from (values (1, 6, 'Camila Barbosa', '98765432100', '21900000011'),
             (2, 8, 'Roberto Barbosa', '12345678909', '21900000012')) as g(n, account_n, name, cpf, phone)
on conflict do nothing;

insert into guardian (id, organization_id, account_id, name, cpf, phone)
select md5('ctcore-seed-guardian-' || g.n)::uuid, md5('ctcore-seed-org-1')::uuid, a.id, a.name, pg_temp.seed_cpf(1000 + g.n), '219000' || lpad((100 + g.n)::text, 5, '0')
from generate_series(3, 14) as g(n)
join account a on a.id = md5('ctcore-seed-account-' || (100 + g.n))::uuid
on conflict do nothing;

-- Os seis primeiros alunos são fixos (login, menores da conta responsavel, cadastro incompleto, e-mail com problema), todos na unidade 1 (Tijuca).
insert into student (id, organization_id, registered_unit_id, name, name_key, birth_date, cpf, email, phone,
                     postal_code, street, number, district, city, state, majority_notice_at)
select md5('ctcore-seed-student-' || s.n)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-unit-1')::uuid, s.name, pg_temp.seed_key(s.name), s.birth_date::date, s.cpf, s.email, s.phone,
       x.a[2], x.a[1], (10 + s.n * 13)::text, x.a[3], x.a[4], x.a[5], null
from (values (1, 'Paulo Henrique Souza', '1990-03-10', '52998224725', 'aluno@ctcore.test', '21900000001'),
             (2, 'Juliana Moreira Pires', '1985-07-21', '11144477735', 'juliana.pires@ctcore.test', '21900000002'),
             (3, 'Davi Barbosa', '2014-05-02', null, null, null),
             (4, 'Sofia Barbosa', '2016-11-15', null, null, null)) as s(n, name, birth_date, cpf, email, phone)
cross join lateral (select pg_temp.seed_addr(1, s.n) as a) as x
on conflict do nothing;

-- O responsável 1 tem os dois menores (o financeiro em cada um); o responsável 2 também tem o terceiro aluno.
insert into student_guardian (organization_id, student_id, guardian_id, financial)
select md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-student-' || l.s)::uuid, md5('ctcore-seed-guardian-' || l.g)::uuid, l.financial
from (values (3, 1, true), (4, 1, true), (3, 2, false)) as l(s, g, financial)
on conflict do nothing;

-- RF-ALU-02: um adulto sem CPF (selo "Cadastro incompleto") e um com e-mail marcado com problema (selo "E-mail com problema").
insert into student (id, organization_id, registered_unit_id, name, name_key, birth_date, cpf, email, phone,
                     postal_code, street, number, district, city, state, email_problem_at)
select md5('ctcore-seed-student-' || s.n)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-unit-1')::uuid, s.name, pg_temp.seed_key(s.name), s.birth_date::date, s.cpf, s.email, s.phone,
       x.a[2], x.a[1], (10 + s.n * 13)::text, x.a[3], x.a[4], x.a[5], s.problem::timestamptz
from (values (5, 'Rogério Dantas', '1992-08-05', null, 'rogerio.dantas@ctcore.test', '21900000005', null),
             (6, 'Letícia Azevedo', '1988-12-01', '39053344705', 'leticia.azevedo@ctcore.test', '21900000006', '2026-01-05T12:00:00Z')) as s(n, name, birth_date, cpf, email, phone, problem)
cross join lateral (select pg_temp.seed_addr(1, s.n) as a) as x
on conflict do nothing;

-- Alunos 7 a 56 (grupos: 7-22 crianças, 23-30 adolescentes, 31-46 adultos, 47-56 master). A unidade segue a turma em que treinam (14-matriculas.sql usa a mesma regra).
-- Menores (7..30): primeiro nome próprio e o sobrenome do responsável (3 + (n - 7) / 2). Adultos: nome completo da lista.
insert into student (id, organization_id, registered_unit_id, name, name_key, birth_date, cpf, email, phone,
                     postal_code, street, number, district, city, state)
select md5('ctcore-seed-student-' || g.n)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-unit-' || g.unit_n)::uuid, g.name, pg_temp.seed_key(g.name),
       make_date(2026 - g.age, 1 + g.n % 12, 1 + g.n % 28),
       case when g.n >= 31 then pg_temp.seed_cpf(g.n) end,
       case when g.n >= 23 then pg_temp.seed_email(g.name) end,
       case when g.n >= 23 then '2190000' || lpad(g.n::text, 4, '0') end,
       x.a[2], x.a[1], (10 + g.n * 13)::text, x.a[3], x.a[4], x.a[5]
from (select n,
             case when n <= 22 then 5 + (n - 7) / 2 when n <= 30 then 13 + (n - 23) / 2 when n <= 46 then 18 + (n - 31) else 36 + (n - 47) * 2 end as age,
             case when n <= 22 then 1 when n <= 30 then 3
                  when n <= 46 then case n % 3 when 0 then 1 when 1 then 3 else 4 end
                  else case n % 2 when 1 then 1 else 4 end end as unit_n,
             case when n <= 30
                  then (array['Pedro','Lucas','Miguel','Helena','Arthur','Laura','Heitor','Valentina','Bernardo','Alice','Enzo','Manuela','Gael','Cecília','Théo','Lívia',
                              'Matheus','Isabela','Guilherme','Giovanna','Caio','Yasmin','Nicolas','Eduarda'])[n - 6]
                       || ' ' || (array['Tavares','Siqueira','Moura','Cavalcanti','Peixoto','Bastos','Figueiredo','Albuquerque','Medeiros','Duarte','Pacheco','Rangel'])[1 + (n - 7) / 2]
                  else (array['Bruno Carvalho','Fernanda Lacerda','Thiago Nogueira','Amanda Vasconcelos','Felipe Andrade','Rafael Santos','Carolina Mendes','Gustavo Barros',
                              'Mariana Teixeira','Diego Ramos','Larissa Freitas','André Machado','Patrícia Coelho','Vinícius Azevedo','Beatriz Cunha','Leonardo Pinheiro',
                              'Waldir Cordeiro','Elaine Magalhães','Cláudio Veiga','Sônia Bittencourt','Marcelo Xavier','Adriana Louzada','Jair Sampaio','Rosana Peçanha',
                              'Humberto Leal','Lúcia Fernandes'])[n - 30] end as name
      from generate_series(7, 56) as n) as g
cross join lateral (select pg_temp.seed_addr(g.unit_n, g.n) as a) as x
on conflict do nothing;

-- Menores 7 a 30: dois irmãos por responsável (responsável 3 + (n - 7) / 2), que é o financeiro.
insert into student_guardian (organization_id, student_id, guardian_id, financial)
select md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-student-' || n)::uuid, md5('ctcore-seed-guardian-' || (3 + (n - 7) / 2))::uuid, true
from generate_series(7, 30) as n
on conflict do nothing;

-- Contas fáceis (03-contas.sql): aluno@ctcore.test é o aluno 1; multiplo@ctcore.test é aluno da segunda organização.
update student set account_id = md5('ctcore-seed-account-5')::uuid
where id = md5('ctcore-seed-student-1')::uuid and account_id is null;

-- Segunda organização (Niterói, Icaraí): Eduardo Martins (multiplo@ctcore.test) e mais três alunos.
insert into student (id, organization_id, registered_unit_id, name, name_key, birth_date, cpf, email, phone,
                     postal_code, street, number, district, city, state, account_id)
select md5('ctcore-seed-student-' || s.n)::uuid, md5('ctcore-seed-org-2')::uuid, md5('ctcore-seed-unit-2')::uuid, s.name, pg_temp.seed_key(s.name), s.birth_date::date,
       s.cpf, s.email, '2190000' || s.n, x.a[2], x.a[1], (10 + s.n)::text, x.a[3], x.a[4], x.a[5], s.account_n
from (values (101, 'Eduardo Martins', '1987-04-18', '11144477735', 'multiplo@ctcore.test', md5('ctcore-seed-account-7')::uuid),
             (102, 'Nathália Campos', '1995-02-09', pg_temp.seed_cpf(2102), 'nathalia.campos@ctcore.test', null::uuid),
             (103, 'Otávio Brandão', '1999-09-30', pg_temp.seed_cpf(2103), 'otavio.brandao@ctcore.test', null::uuid),
             (104, 'Marta Guedes', '1979-06-12', pg_temp.seed_cpf(2104), 'marta.guedes@ctcore.test', null::uuid)) as s(n, name, birth_date, cpf, email, account_n)
cross join lateral (select pg_temp.seed_addr(2, s.n) as a) as x
on conflict do nothing;
