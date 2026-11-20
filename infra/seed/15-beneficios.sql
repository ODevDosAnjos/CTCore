-- Synthetic benefits (RF-BEN-01, #64) over the enrollment modalities of 14-matriculas.sql (first seeded organization):
-- common scholarship, high scholarship, high amount discount, one expired and one ended. Granted by the first seeded account.
insert into benefit (id, organization_id, enrollment_modality_id, student_id, unit_id, type, value, reason, decided_by, granted_by_account_id, valid_until, status, ended_at, end_reason)
select md5('ctcore-seed-benefit-' || b.k)::uuid, md5('ctcore-seed-org-1')::uuid, em.id, em.student_id, em.unit_id, b.type, b.value, b.reason, b.decided_by,
       md5('ctcore-seed-account-1')::uuid, b.valid_until::date, b.status, b.ended_at::timestamptz, b.end_reason
from (values (1, 1, 'PERCENT', 30, 'Aluno de projeto social', 'Mestre Antônio Reis', null, 'ACTIVE', null, null),
             (2, 2, 'PERCENT', 60, 'Atleta da equipe de competição', 'Mestre Antônio Reis', null, 'ACTIVE', null, null),
             (3, 3, 'AMOUNT', 12000, 'Situação financeira da família', 'Direção da academia', null, 'ACTIVE', null, null),
             (4, 4, 'PERCENT', 20, 'Promoção de matrícula', 'Direção da academia', '2026-02-28', 'ACTIVE', null, null),
             (5, 5, 'PERCENT', 10, 'Convênio encerrado', 'Direção da academia', null, 'ENDED', '2026-03-01T12:00:00Z', 'Aluno saiu'))
       as b(k, em_k, type, value, reason, decided_by, valid_until, status, ended_at, end_reason)
join enrollment_modality em on em.id = md5('ctcore-seed-enrollment-modality-' || b.em_k)::uuid
on conflict do nothing;

-- #644: more benefits over the generated students (every sixth active enrollment gets a common percent scholarship; one gets a high one).
insert into benefit (id, organization_id, enrollment_modality_id, student_id, unit_id, type, value, reason, decided_by, granted_by_account_id, valid_until, status)
select md5('ctcore-seed-benefit-s' || n)::uuid, md5('ctcore-seed-org-1')::uuid, em.id, em.student_id, em.unit_id, 'PERCENT',
       case when n = 36 then 70 else 10 + (n % 3) * 5 end,
       case when n = 36 then 'Atleta da equipe de competição' else 'Convênio com empresa parceira' end,
       'Direção da academia', md5('ctcore-seed-account-1')::uuid, null, 'ACTIVE'
from generate_series(7, 56) as n
join enrollment_modality em on em.id = md5('ctcore-seed-enrollment-modality-s' || n)::uuid and em.status = 'ACTIVE'
where n % 6 = 0
on conflict do nothing;
