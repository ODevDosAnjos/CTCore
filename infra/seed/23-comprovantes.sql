-- Synthetic payment proofs (RF-COB-05, #87, #644) of the first seeded organization, unit 1: student 2 sent a Pix proof for a one-off charge ("Kimono") and student 14
-- sent one for the monthly charge (18-cobrancas.sql); both charges are in review and both proofs are pending. The file keys point to files that do not exist in storage
-- (the management list shows "image unavailable"). Fixed ids and "on conflict do nothing" make the seed repeatable.
insert into charge (id, organization_id, unit_id, student_id, type, description, due_on, tolerance_days, plan_cents, benefit_cents, amount_cents, status, origin, notified_at)
select md5('ctcore-seed-charge-4')::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-unit-1')::uuid, md5('ctcore-seed-student-2')::uuid,
       'ONE_OFF', 'Kimono', current_date + 4, 5, 0, 0, 9000, 'IN_REVIEW', 'MANAGEMENT', now()
where exists (select 1 from student where id = md5('ctcore-seed-student-2')::uuid)
on conflict do nothing;

insert into payment_proof (id, organization_id, charge_id, student_id, unit_id, file_key, content_type, sent_by_account_id, sent_at, status)
select md5('ctcore-seed-payment-proof-' || p.k)::uuid, md5('ctcore-seed-org-1')::uuid, c.id, c.student_id, c.unit_id,
       'seed-payment-proof-' || p.k || '.png', 'image/png', md5('ctcore-seed-account-1')::uuid, now() - interval '1 day', 'PENDING'
from (values (1, md5('ctcore-seed-charge-4')::uuid), (2, md5('ctcore-seed-charge-m-14')::uuid)) as p(k, charge_id)
join charge c on c.id = p.charge_id
where exists (select 1 from account where id = md5('ctcore-seed-account-1')::uuid)
on conflict do nothing;
