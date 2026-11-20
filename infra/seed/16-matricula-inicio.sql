-- Synthetic enrollment starts (RF-MAT-01, #67, #644) over the enrollments of 14-matriculas.sql (first seeded organization, unit 1): no fee, second charge on day 10.
-- Graduation history (RF-MOD-02) of Jiu-Jitsu students, registered by the first seeded account: student 1 has the origin graduation (proof) plus two later ones.
insert into enrollment_start (id, organization_id, enrollment_id, unit_id, concluded_at, fee_cents, fee_exempt_reason, second_due_on)
select md5('ctcore-seed-enrollment-start-' || e.n)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-enrollment-' || e.n)::uuid,
       md5('ctcore-seed-unit-1')::uuid, e.concluded_at::timestamptz, e.fee, e.reason, e.second_due_on::date
from (values (1, '2026-01-10T12:00:00Z', 0, null, '2026-02-10'),
             (2, '2026-01-10T12:00:00Z', 5000, null, '2026-02-10'),
             (3, '2026-02-02T12:00:00Z', 0, 'Bolsa da turma', '2026-03-10')) as e(n, concluded_at, fee, reason, second_due_on)
on conflict do nothing;

insert into student_graduation (id, organization_id, student_id, modality_id, level_id, degree, achieved_on, origin, proof_file, has_proof, registered_by_account_id)
select md5('ctcore-seed-student-graduation-1')::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-student-1')::uuid, l.modality_id, l.id, 1,
       date '2025-06-01', true, null, false, md5('ctcore-seed-account-1')::uuid
from graduation_level l
where l.organization_id = md5('ctcore-seed-org-1')::uuid and l.position = 0
  and l.modality_id = (select id from modality where name = 'Jiu-Jitsu')
on conflict do nothing;

-- History: (student, belt, degree, date, origin). Adults train Jiu-Jitsu in the main organization (belts by name, present in the default levels).
insert into student_graduation (id, organization_id, student_id, modality_id, level_id, degree, achieved_on, origin, proof_file, has_proof, registered_by_account_id)
select md5('ctcore-seed-student-graduation-' || g.k)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-student-' || g.student)::uuid, l.modality_id, l.id, g.degree,
       g.achieved_on::date, g.origin, null, false, md5('ctcore-seed-account-1')::uuid
from (values (2, 1, 'Azul', 2, '2026-03-14', false),
             (3, 1, 'Azul', 3, '2026-08-22', false),
             (4, 33, 'Branca', 1, '2024-02-10', true),
             (5, 33, 'Azul', 0, '2025-05-17', false),
             (6, 36, 'Branca', 2, '2024-09-01', true),
             (7, 36, 'Azul', 1, '2026-01-31', false),
             (8, 42, 'Azul', 0, '2023-11-04', true),
             (9, 42, 'Roxa', 0, '2026-06-20', false),
             (10, 45, 'Branca', 0, '2022-03-12', true),
             (11, 45, 'Azul', 0, '2024-04-27', false),
             (12, 45, 'Roxa', 2, '2026-09-05', false),
             (13, 51, 'Azul', 1, '2025-12-13', true),
             (14, 55, 'Roxa', 0, '2025-10-25', true)) as g(k, student, belt, degree, achieved_on, origin)
join graduation_level l on l.organization_id = md5('ctcore-seed-org-1')::uuid and l.name = g.belt
     and l.modality_id = (select id from modality where name = 'Jiu-Jitsu')
on conflict do nothing;
