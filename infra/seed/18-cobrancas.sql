-- Synthetic charges (RN-COB, #71, #644) over the enrollments of 14-matriculas.sql (first seeded organization). Status is stored only for the action taken; Pending,
-- Due today and Overdue come from the due date, so every date below is relative to the seed date (current_date).
-- Student 1: paid October charge (fixed, receipt public code SEEDRECEIPT00001) and a pending charge; student 2: charge due today.
-- Students 7 to 56 (active modalities, by number): 14 in review (proof in 23-comprovantes.sql), 18 renegotiated into 3 installments, 15 canceled,
-- last digit 8 overdue, multiples of 7 plus 3 or of 5 plus 2 paid (all eight payment methods), every 11th plus 1 due today, the rest pending.
-- One-off charges: 21 open (shirt), 33 paid (belt exam); the "Kimono" one is in 23-comprovantes.sql.
insert into charge (id, organization_id, unit_id, student_id, type, enrollment_modality_id, plan_id, reference_month, due_on, tolerance_days, plan_cents, benefit_cents, amount_cents, status, origin, notified_at)
select md5('ctcore-seed-charge-' || c.k)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-unit-1')::uuid, md5('ctcore-seed-student-' || c.student)::uuid,
       'MONTHLY', md5('ctcore-seed-enrollment-modality-' || c.modality)::uuid, p.id, c.ref::date, c.due::date, 5, p.value_cents, 0, p.value_cents, c.status, 'GENERATION', now()
from (values (1, 1, 1, 1, '2026-10-01', '2026-10-05', 'PAID'),
             (2, 1, 1, 1, date_trunc('month', current_date)::date, current_date + 3, 'OPEN'),
             (3, 2, 2, 2, date_trunc('month', current_date)::date, current_date, 'OPEN')) as c(k, student, modality, plan, ref, due, status)
join plan p on p.id = md5('ctcore-seed-plan-1-' || c.plan)::uuid
on conflict do nothing;

insert into payment (id, organization_id, charge_id, student_id, unit_id, amount_cents, method, origin, paid_at, registered_by_account_id)
select md5('ctcore-seed-payment-1')::uuid, md5('ctcore-seed-org-1')::uuid, c.id, c.student_id, c.unit_id, c.amount_cents, 'CASH', 'MANAGEMENT',
       timestamptz '2026-10-04T15:00:00Z', md5('ctcore-seed-account-1')::uuid
from charge c
where c.id = md5('ctcore-seed-charge-1')::uuid
on conflict do nothing;

insert into receipt (id, organization_id, payment_id, unit_id, number, code)
select md5('ctcore-seed-receipt-1')::uuid, md5('ctcore-seed-org-1')::uuid, p.id, p.unit_id, 1, 'SEEDRECEIPT00001'
from payment p
where p.id = md5('ctcore-seed-payment-1')::uuid
on conflict do nothing;

insert into receipt_counter (unit_id, organization_id, last_number)
values (md5('ctcore-seed-unit-1')::uuid, md5('ctcore-seed-org-1')::uuid, 1)
on conflict do nothing;

update enrollment_modality
set next_charge_ref = date '2026-12-01', next_charge_due_on = date '2026-12-05'
where id = md5('ctcore-seed-enrollment-modality-1')::uuid and next_charge_ref is null;

-- Monthly charges of students 7 to 56 with an active modality.
insert into charge (id, organization_id, unit_id, student_id, type, enrollment_modality_id, plan_id, reference_month, due_on, tolerance_days, plan_cents, benefit_cents, amount_cents,
                    status, origin, reason, created_by_account_id, canceled_at, canceled_by_account_id, renegotiation_id, notified_at)
select md5('ctcore-seed-charge-m-' || k.n)::uuid, em.organization_id, em.unit_id, em.student_id, 'MONTHLY', em.id, em.plan_id,
       case when k.kind = 'reneg' then date_trunc('month', current_date - interval '2 months')::date
            when k.kind = 'overdue' then date_trunc('month', current_date - interval '1 month')::date
            else date_trunc('month', current_date)::date end,
       case k.kind when 'review' then current_date + 2 when 'reneg' then current_date - 40 when 'overdue' then current_date - 12
                   when 'today' then current_date when 'cancel' then current_date + 5
                   when 'paid' then case when k.n % 2 = 0 then current_date - 5 else current_date + 3 end
                   else current_date + 1 + k.n % 12 end,
       5, p.value_cents, 0, p.value_cents,
       case k.kind when 'review' then 'IN_REVIEW' when 'reneg' then 'RENEGOTIATED' when 'cancel' then 'CANCELED' when 'paid' then 'PAID' else 'OPEN' end,
       'GENERATION', case when k.kind = 'cancel' then 'Lançada em duplicidade' end,
       case when k.kind = 'cancel' then md5('ctcore-seed-account-1')::uuid end,
       case when k.kind = 'cancel' then now() - interval '1 day' end,
       case when k.kind = 'cancel' then md5('ctcore-seed-account-1')::uuid end,
       case when k.kind = 'reneg' then md5('ctcore-seed-renegotiation-1')::uuid end,
       now()
from (select n, case when n = 14 then 'review' when n = 18 then 'reneg' when n = 15 then 'cancel' when n % 10 = 8 then 'overdue'
                     when n % 7 = 3 or n % 5 = 2 then 'paid' when n % 11 = 1 then 'today' else 'pending' end as kind
      from generate_series(7, 56) as n) as k
join enrollment_modality em on em.id = md5('ctcore-seed-enrollment-modality-s' || k.n)::uuid and em.status = 'ACTIVE'
join plan p on p.id = em.plan_id
on conflict do nothing;

-- Payments of the paid ones, rotating the eight methods (the portal ones come from the portal).
insert into payment (id, organization_id, charge_id, student_id, unit_id, amount_cents, method, origin, paid_at, registered_by_account_id)
select md5('ctcore-seed-payment-m-' || x.n)::uuid, c.organization_id, c.id, c.student_id, c.unit_id, c.amount_cents, x.method,
       case when x.method in ('PIX_MP', 'CREDIT_CARD', 'BOLETO') then 'PORTAL' else 'MANAGEMENT' end,
       now() - interval '2 days', case when x.method in ('PIX_MP', 'CREDIT_CARD', 'BOLETO') then null else md5('ctcore-seed-account-1')::uuid end
from (select n, (array['PIX_MP', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO', 'PIX_KEY', 'CASH', 'CARD_MACHINE', 'TRANSFER'])[1 + (row_number() over (order by n))::int % 8] as method
      from generate_series(7, 56) as n
      where exists (select 1 from charge c where c.id = md5('ctcore-seed-charge-m-' || n)::uuid and c.status = 'PAID')) as x
join charge c on c.id = md5('ctcore-seed-charge-m-' || x.n)::uuid
on conflict do nothing;

-- Student 18: the overdue charge of two months ago was renegotiated into three installments (RN-COB-09/10).
insert into charge (id, organization_id, unit_id, student_id, type, description, plan_cents, benefit_cents, due_on, tolerance_days, amount_cents, status, origin, origin_charge_id,
                    renegotiation_id, reason, created_by_account_id, notified_at)
select md5('ctcore-seed-charge-i-' || k)::uuid, c.organization_id, c.unit_id, c.student_id, 'INSTALLMENT', 'Parcela ' || k || '/3', 0, 0, current_date + 10 + 30 * (k - 1), 5,
       c.amount_cents / 3 + case when k = 1 then c.amount_cents % 3 else 0 end, 'OPEN', 'MANAGEMENT', c.id, c.renegotiation_id, 'Renegociação em 3 parcelas',
       md5('ctcore-seed-account-1')::uuid, now()
from charge c cross join generate_series(1, 3) as k
where c.id = md5('ctcore-seed-charge-m-18')::uuid and c.status = 'RENEGOTIATED'
on conflict do nothing;

-- One-off charges: a shirt (open) and a belt exam fee (paid by Pix key).
insert into charge (id, organization_id, unit_id, student_id, type, description, due_on, tolerance_days, plan_cents, benefit_cents, amount_cents, status, origin, notified_at)
select md5('ctcore-seed-charge-o-' || o.n)::uuid, s.organization_id, s.registered_unit_id, s.id, 'ONE_OFF', o.description, current_date + o.due, 5, 0, 0, o.amount, o.status, 'MANAGEMENT', now()
from (values (21, 'Camiseta da academia', 7, 7000, 'OPEN'), (33, 'Taxa de exame de faixa', -3, 12000, 'PAID')) as o(n, description, due, amount, status)
join student s on s.id = md5('ctcore-seed-student-' || o.n)::uuid
on conflict do nothing;

insert into payment (id, organization_id, charge_id, student_id, unit_id, amount_cents, method, origin, paid_at, registered_by_account_id)
select md5('ctcore-seed-payment-o-33')::uuid, c.organization_id, c.id, c.student_id, c.unit_id, c.amount_cents, 'PIX_KEY', 'MANAGEMENT', now() - interval '3 days', md5('ctcore-seed-account-1')::uuid
from charge c where c.id = md5('ctcore-seed-charge-o-33')::uuid
on conflict do nothing;
