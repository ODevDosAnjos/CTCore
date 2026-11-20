-- Synthetic notifications (RF-NOT-01, #84, #644) for the seeded coordinator (link 1) and administrator (link 3) of the first organization:
-- today, this week and older than 7 days; some read. Nomes e valores inventados.
insert into notification (id, organization_id, link_id, unit_id, type, ref_type, ref_id, params, created_at, read_at)
select md5('ctcore-seed-notification-' || n.k)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-link-' || n.link)::uuid, n.unit, n.type, n.ref_type,
       md5('ctcore-seed-notification-ref-' || n.k)::uuid, n.params::jsonb, now() - n.age::interval, case when n.is_read then now() end
from (values
    (1, 3, md5('ctcore-seed-unit-1')::uuid, 'PAYMENT_RECEIVED', 'charge', '{"studentName":"Paulo Henrique Souza","amountCents":15000}', '1 hour', false),
    (2, 3, md5('ctcore-seed-unit-1')::uuid, 'EMAIL_PROBLEM', 'student', '{"studentName":"Letícia Azevedo"}', '3 days', false),
    (3, 3, md5('ctcore-seed-unit-1')::uuid, 'STUDENT_MAJORITY', 'student', '{"studentName":"Sofia Barbosa"}', '5 days', true),
    (4, 1, null::uuid, 'HIGH_BENEFIT', 'benefit', '{"studentName":"Juliana Moreira Pires"}', '2 hours', false),
    (5, 1, null::uuid, 'INVITE_PENDING', 'invite', '{"personName":"Henrique Valadares"}', '4 days', false),
    (6, 1, null::uuid, 'INVITE_PENDING', 'invite', '{"personName":"Isabela Menezes"}', '12 days', false),
    (7, 3, md5('ctcore-seed-unit-1')::uuid, 'CLOSURE_REQUEST', 'portal_request', '{"studentName":"Rafael Santos"}', '30 minutes', false),
    (8, 1, null::uuid, 'PAYMENT_RECEIVED', 'charge', '{"studentName":"Rogério Dantas","amountCents":20000}', '1 day', true)
) as n(k, link, unit, type, ref_type, params, age, is_read)
on conflict do nothing;
