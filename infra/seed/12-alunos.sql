-- Synthetic students (RF-ALU-01, #644): 56 in the main organization (ages 5 to 54, minors with guardians, siblings sharing a guardian) and 4 in the second.
-- Situations come from the enrollments in 14-matriculas.sql (the system calculates them): active, former student (all modalities ended), no enrollment and active with overdue charges.
-- Guardian 1 is the account responsavel@ctcore.test; the other guardians are invited accounts (no password). Every CPF is a made-up valid number (check digits computed).
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

-- Guardians 3 to 14: one invited account each; each has two children (consecutive minors 7..30).
insert into account (id, email, name, status)
select md5('ctcore-seed-account-' || (100 + g.n))::uuid, 'responsavel' || g.n || '@ficticia-1.example', g.name, 'INVITED'
from (select n, (array['Marcelo','Renata','Sandro','Aline','Fábio','Tatiane','Leandro','Cíntia','Rodrigo','Viviane','Alexandre','Daniela'])[n - 2]
             || ' ' || (array['Silva','Oliveira','Santos','Pereira','Ferreira','Rodrigues','Almeida','Nascimento','Lima','Araújo','Ribeiro','Carvalho'])[n - 2] as name
      from generate_series(3, 14) as n) as g
on conflict do nothing;

insert into account (id, email, name, status)
select md5('ctcore-seed-account-' || g.n)::uuid, g.email, g.name, 'INVITED'
from (values (8, 'responsavel2@ficticia-1.example', 'Roberto Barbosa')) as g(n, email, name)
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
from (values (1, 6, 'Camila Barbosa', '98765432100', '11900000011'),
             (2, 8, 'Roberto Barbosa', '12345678909', '11900000012')) as g(n, account_n, name, cpf, phone)
on conflict do nothing;

insert into guardian (id, organization_id, account_id, name, cpf, phone)
select md5('ctcore-seed-guardian-' || g.n)::uuid, md5('ctcore-seed-org-1')::uuid, a.id, a.name, pg_temp.seed_cpf(1000 + g.n), '119000' || lpad((100 + g.n)::text, 5, '0')
from generate_series(3, 14) as g(n)
join account a on a.id = md5('ctcore-seed-account-' || (100 + g.n))::uuid
on conflict do nothing;

-- The first six students are fixed (login, minors of the responsavel account, incomplete record, e-mail problem).
insert into student (id, organization_id, registered_unit_id, name, name_key, birth_date, cpf, email, phone,
                     postal_code, street, number, district, city, state, majority_notice_at)
select md5('ctcore-seed-student-' || s.n)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-unit-1')::uuid, s.name, pg_temp.seed_key(s.name), s.birth_date::date, s.cpf, s.email, s.phone,
       '13010000', 'Rua das Acácias', s.n::text, 'Centro', 'Campinas', 'SP', null
from (values (1, 'Paulo Henrique Souza', '1990-03-10', '52998224725', 'aluno@ctcore.test', '11900000001'),
             (2, 'Juliana Moreira Pires', '1985-07-21', '11144477735', 'aluno2@ficticia-1.example', '11900000002'),
             (3, 'Davi Barbosa', '2014-05-02', null, null, null),
             (4, 'Sofia Barbosa', '2016-11-15', null, null, null)) as s(n, name, birth_date, cpf, email, phone)
on conflict do nothing;

-- Guardian 1 has both minors (the financial one in each); guardian 2 also has the third student.
insert into student_guardian (organization_id, student_id, guardian_id, financial)
select md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-student-' || l.s)::uuid, md5('ctcore-seed-guardian-' || l.g)::uuid, l.financial
from (values (3, 1, true), (4, 1, true), (3, 2, false)) as l(s, g, financial)
on conflict do nothing;

-- RF-ALU-02: um adulto sem CPF (selo "Cadastro incompleto") e um com e-mail marcado com problema (selo "E-mail com problema").
insert into student (id, organization_id, registered_unit_id, name, name_key, birth_date, cpf, email, phone,
                     postal_code, street, number, district, city, state, email_problem_at)
select md5('ctcore-seed-student-' || s.n)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-unit-1')::uuid, s.name, pg_temp.seed_key(s.name), s.birth_date::date, s.cpf, s.email, s.phone,
       '13010000', 'Rua das Acácias', s.n::text, 'Centro', 'Campinas', 'SP', s.problem::timestamptz
from (values (5, 'Rogério Dantas', '1992-08-05', null, 'aluno5@ficticia-1.example', '11900000005', null),
             (6, 'Letícia Azevedo', '1988-12-01', '39053344705', 'aluno6@ficticia-1.example', '11900000006', '2026-01-05T12:00:00Z')) as s(n, name, birth_date, cpf, email, phone, problem)
on conflict do nothing;

-- Students 7 to 56 (age groups: 7-22 children, 23-30 teens, 31-46 adults, 47-56 masters). The unit follows the class they train in (14-matriculas.sql keeps the same rule).
insert into student (id, organization_id, registered_unit_id, name, name_key, birth_date, cpf, email, phone,
                     postal_code, street, number, district, city, state)
select md5('ctcore-seed-student-' || g.n)::uuid, md5('ctcore-seed-org-1')::uuid, u.id, g.name, pg_temp.seed_key(g.name),
       make_date(2026 - g.age, 1 + g.n % 12, 1 + g.n % 28),
       case when g.n >= 31 then pg_temp.seed_cpf(g.n) end,
       case when g.n >= 23 then 'aluno' || g.n || '@ficticia-1.example' end,
       case when g.n >= 23 then '1190000' || lpad(g.n::text, 4, '0') end,
       '13010000', 'Rua das Acácias', g.n::text, u.district, u.city, 'SP'
from (select n,
             case when n <= 22 then 5 + (n - 7) / 2 when n <= 30 then 13 + (n - 23) / 2 when n <= 46 then 18 + (n - 31) else 36 + (n - 47) * 2 end as age,
             case when n <= 22 then 1 when n <= 30 then 3
                  when n <= 46 then case n % 3 when 0 then 1 when 1 then 3 else 4 end
                  else case n % 2 when 1 then 1 else 4 end end as unit_n,
             (array['Lucas','Beatriz','Gabriel','Larissa','Rafael','Juliana','Thiago','Amanda','Felipe','Carolina','Bruno','Fernanda','Gustavo','Letícia','Diego','Mariana','André','Patrícia','Vinícius','Camila'])[1 + n % 20]
             || ' ' || (array['Silva','Oliveira','Santos','Pereira','Ferreira','Rodrigues','Almeida','Nascimento','Lima','Araújo','Ribeiro','Carvalho','Gomes','Martins','Rocha','Dias','Moreira','Cardoso','Teixeira','Vieira'])
                       [1 + case when n <= 30 then (3 + (n - 7) / 2) % 20 else (n * 3) % 20 end] as name
      from generate_series(7, 56) as n) as g
join (select md5('ctcore-seed-unit-' || n)::uuid as id, n,
             case n when 1 then 'Centro' when 3 then 'Cambuí' else 'Jardim Norte' end as district,
             case n when 4 then 'Valinhos' else 'Campinas' end as city
      from generate_series(1, 4) as n) as u on u.n = g.unit_n
on conflict do nothing;

-- Minors 7 to 30: two siblings per guardian (guardian 3 + (n - 7) / 2), the guardian is the financial one.
insert into student_guardian (organization_id, student_id, guardian_id, financial)
select md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-student-' || n)::uuid, md5('ctcore-seed-guardian-' || (3 + (n - 7) / 2))::uuid, true
from generate_series(7, 30) as n
on conflict do nothing;

-- Contas fáceis (03-accounts.sql): aluno@ctcore.test é o aluno 1; multiplo@ctcore.test é aluno da segunda organização.
update student set account_id = md5('ctcore-seed-account-5')::uuid
where id = md5('ctcore-seed-student-1')::uuid and account_id is null;

-- Segunda organização: Eduardo Martins (multiplo@ctcore.test) e mais três alunos.
insert into student (id, organization_id, registered_unit_id, name, name_key, birth_date, cpf, email, phone,
                     postal_code, street, number, district, city, state, account_id)
select md5('ctcore-seed-student-' || s.n)::uuid, md5('ctcore-seed-org-2')::uuid, md5('ctcore-seed-unit-2')::uuid, s.name, pg_temp.seed_key(s.name), s.birth_date::date,
       s.cpf, s.email, '1190000' || s.n, '18010000', 'Rua das Palmeiras', s.n::text, 'Centro', 'Sorocaba', 'SP', s.account_n
from (values (101, 'Eduardo Martins', '1987-04-18', '11144477735', 'multiplo@ctcore.test', md5('ctcore-seed-account-7')::uuid),
             (102, 'Nathália Campos', '1995-02-09', pg_temp.seed_cpf(2102), 'aluno102@ficticia-2.example', null::uuid),
             (103, 'Otávio Brandão', '1999-09-30', pg_temp.seed_cpf(2103), 'aluno103@ficticia-2.example', null::uuid),
             (104, 'Marta Guedes', '1979-06-12', pg_temp.seed_cpf(2104), 'aluno104@ficticia-2.example', null::uuid)) as s(n, name, birth_date, cpf, email, account_n)
on conflict do nothing;
