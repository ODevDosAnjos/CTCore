-- Synthetic portal requests (RF-MAT-04, #86, #644) of the first seeded organization, every kind and every status: open plan change (student 1) and new modality
-- (student 3); open class change (33), closure (36); approved class change (45), refused new modality (47), expired plan change (51), closed closure (55).
-- Nothing changes in the enrollment. Fixed ids and "on conflict do nothing" make the seed repeatable.
insert into portal_request (id, organization_id, student_id, unit_id, kind, enrollment_modality_id, target_class_id, target_plan_id, target_modality_id, target_unit_id, reason, note, status,
                            requested_by_account_id, ip, created_at, decided_at, decided_by_account_id, response)
select md5('ctcore-seed-portal-request-' || r.k)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-student-' || r.student)::uuid, md5('ctcore-seed-unit-1')::uuid, r.kind,
       case when r.kind = 'NEW_MODALITY' then null else
            md5('ctcore-seed-enrollment-modality-' || case when r.student <= 4 then '1' else 's' || r.student end)::uuid end,
       case when r.kind = 'CLASS_CHANGE' then md5('ctcore-seed-class-1-9')::uuid end,
       case when r.kind = 'PLAN_CHANGE' then md5('ctcore-seed-plan-1-' || case when r.student = 1 then '2' else '1' end)::uuid end,
       case when r.kind = 'NEW_MODALITY' then (select id from modality where name = case when r.student = 3 then 'Jiu-Jitsu' else 'Muay Thai' end) end,
       case when r.kind = 'NEW_MODALITY' then md5('ctcore-seed-unit-' || case when r.student = 3 then '1' else '3' end)::uuid end,
       case when r.kind = 'CLOSURE' then r.reason end,
       r.note, r.status, md5('ctcore-seed-account-1')::uuid, '192.0.2.10', now() - r.age::interval,
       case when r.status <> 'OPEN' then now() - interval '1 day' end,
       case when r.status in ('APPROVED', 'REFUSED', 'CLOSED') then md5('ctcore-seed-account-1')::uuid end,
       r.response
from (values (1, 1, 'PLAN_CHANGE', 'OPEN', null, 'Quero treinar sem limite de dias.', null, '3 days'),
             (2, 3, 'NEW_MODALITY', 'OPEN', null, null, null, '2 days'),
             (3, 33, 'CLASS_CHANGE', 'OPEN', null, 'Prefiro treinar de manhã.', null, '1 day'),
             (4, 36, 'CLOSURE', 'OPEN', 'FINANCIAL', 'Preciso pausar por um tempo.', null, '5 hours'),
             (5, 45, 'CLASS_CHANGE', 'APPROVED', null, 'Mudança de horário no trabalho.', 'Aprovado, pode vir na turma da manhã.', '9 days'),
             (6, 47, 'NEW_MODALITY', 'REFUSED', null, null, 'A turma de Muay Thai está lotada neste momento.', '10 days'),
             (7, 51, 'PLAN_CHANGE', 'EXPIRED', null, null, null, '40 days'),
             (8, 55, 'CLOSURE', 'CLOSED', 'CITY_CHANGE', 'Mudança de cidade.', 'Encerramento concluído.', '20 days'))
       as r(k, student, kind, status, reason, note, response, age)
where exists (select 1 from account where id = md5('ctcore-seed-account-1')::uuid)
on conflict do nothing;
