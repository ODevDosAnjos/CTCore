-- Synthetic enrollments (RF-MAT, #63, #644). Students 1 to 4 are fixed: three active (one with two modalities) and one former student. Students 5 and 6 have no enrollment.
-- Students 7 to 56 by the last digit of the number: 9 = no enrollment, 0 = former student (modality ended), any other = active (8 also gets overdue charges in 18-cobrancas.sql).
-- Students 101 to 104 (second organization): three active and one former. Classes come from 10-turmas.sql, plans from 13-planos.sql; the unit follows the rule of 12-alunos.sql.
insert into enrollment (id, organization_id, student_id, enrolled_at)
select md5('ctcore-seed-enrollment-' || s.n)::uuid, md5('ctcore-seed-org-' || s.o)::uuid, md5('ctcore-seed-student-' || s.n)::uuid, s.enrolled_at::timestamptz
from (values (1, 1, '2026-01-10T12:00:00Z'), (2, 1, '2026-01-10T12:00:00Z'), (3, 1, '2026-02-02T12:00:00Z'), (4, 1, '2025-06-01T12:00:00Z')) as s(n, o, enrolled_at)
on conflict do nothing;

insert into enrollment (id, organization_id, student_id, enrolled_at)
select md5('ctcore-seed-enrollment-' || n)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-student-' || n)::uuid,
       make_date(2025, 1 + n % 12, 1 + n % 27)::timestamptz + interval '12 hours'
from generate_series(7, 56) as n
where n % 10 <> 9
on conflict do nothing;

insert into enrollment (id, organization_id, student_id, enrolled_at)
select md5('ctcore-seed-enrollment-' || n)::uuid, md5('ctcore-seed-org-2')::uuid, md5('ctcore-seed-student-' || n)::uuid,
       make_date(2025, 1 + n % 12, 1 + n % 27)::timestamptz + interval '12 hours'
from generate_series(101, 104) as n
on conflict do nothing;

insert into enrollment_modality (id, organization_id, enrollment_id, student_id, unit_id, modality_id, primary_class_id, plan_id, due_day, status, started_at, ended_at)
select md5('ctcore-seed-enrollment-modality-' || e.k)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-enrollment-' || e.student)::uuid,
       md5('ctcore-seed-student-' || e.student)::uuid, md5('ctcore-seed-unit-1')::uuid, m.id, md5('ctcore-seed-class-1-' || e.class)::uuid,
       md5('ctcore-seed-plan-1-' || e.plan)::uuid, e.due_day, e.status, e.started_at::timestamptz, e.ended_at::timestamptz
from (values (1, 1, 'Jiu-Jitsu', 1, 1, 5, 'ACTIVE', '2026-01-10T12:00:00Z', null),
             (2, 2, 'Jiu-Jitsu', 1, 2, 5, 'ACTIVE', '2026-01-10T12:00:00Z', null),
             (3, 2, 'Judô', 2, 3, 5, 'ACTIVE', '2026-01-10T12:00:00Z', null),
             (4, 3, 'Judô', 2, 3, 10, 'ACTIVE', '2026-02-02T12:00:00Z', null),
             (5, 4, 'Jiu-Jitsu', 1, 1, 10, 'ENDED', '2025-06-01T12:00:00Z', '2026-03-01T12:00:00Z'))
       as e(k, student, modality, class, plan, due_day, status, started_at, ended_at)
join modality m on m.name = e.modality
on conflict do nothing;

-- Students 7 to 56: unit, class, plan and modality by age group (same unit rule as 12-alunos.sql).
insert into enrollment_modality (id, organization_id, enrollment_id, student_id, unit_id, modality_id, primary_class_id, plan_id, due_day, status, started_at, ended_at)
select md5('ctcore-seed-enrollment-modality-s' || c.n)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-enrollment-' || c.n)::uuid,
       md5('ctcore-seed-student-' || c.n)::uuid, md5('ctcore-seed-unit-' || c.unit)::uuid, m.id, md5('ctcore-seed-class-1-' || c.class)::uuid,
       md5('ctcore-seed-plan-1-' || c.plan)::uuid, (array[5, 10, 15])[1 + c.n % 3],
       case when c.n % 10 = 0 then 'ENDED' else 'ACTIVE' end,
       make_date(2025, 1 + c.n % 12, 1 + c.n % 27)::timestamptz + interval '12 hours',
       case when c.n % 10 = 0 then make_date(2026, 1 + c.n % 9, 1 + c.n % 27)::timestamptz + interval '12 hours' end
from (select n,
             case when n <= 22 then (case n % 2 when 1 then 1 else 1 end)
                  when n <= 30 then 3
                  when n <= 46 then case n % 3 when 0 then 1 when 1 then 3 else 4 end
                  else case n % 2 when 1 then 1 else 4 end end as unit,
             case when n <= 22 then (case n % 2 when 1 then 4 else 2 end)
                  when n <= 30 then 6
                  when n <= 46 then case n % 3 when 0 then 1 when 1 then 5 else 7 end
                  else case n % 2 when 1 then 1 else 7 end end as class,
             case when n <= 22 then (case n % 2 when 1 then 6 else 3 end)
                  when n <= 30 then 7
                  when n <= 46 then case n % 3 when 0 then 1 when 1 then 8 else 9 end
                  else case n % 2 when 1 then 2 else 9 end end as plan,
             case when n <= 22 then (case n % 2 when 1 then 'Jiu-Jitsu' else 'Judô' end)
                  when n <= 30 then 'Jiu-Jitsu'
                  when n <= 46 then case n % 3 when 0 then 'Jiu-Jitsu' when 1 then 'Muay Thai' else 'Judô' end
                  else case n % 2 when 1 then 'Jiu-Jitsu' else 'Judô' end end as modality
      from generate_series(7, 56) as n where n % 10 <> 9) as c
join modality m on m.name = c.modality
on conflict do nothing;

-- Second organization: Jiu-Jitsu in the main unit (class 1, plan 1); 104 is a former student.
insert into enrollment_modality (id, organization_id, enrollment_id, student_id, unit_id, modality_id, primary_class_id, plan_id, due_day, status, started_at, ended_at)
select md5('ctcore-seed-enrollment-modality-s' || n)::uuid, md5('ctcore-seed-org-2')::uuid, md5('ctcore-seed-enrollment-' || n)::uuid,
       md5('ctcore-seed-student-' || n)::uuid, md5('ctcore-seed-unit-2')::uuid, m.id, md5('ctcore-seed-class-2-1')::uuid, md5('ctcore-seed-plan-2-1')::uuid, 10,
       case when n = 104 then 'ENDED' else 'ACTIVE' end, timestamptz '2026-02-01T12:00:00Z', case when n = 104 then timestamptz '2026-08-01T12:00:00Z' end
from generate_series(101, 104) as n
join modality m on m.name = 'Jiu-Jitsu'
on conflict do nothing;
