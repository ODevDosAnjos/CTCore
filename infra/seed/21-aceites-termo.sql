-- Synthetic term acceptance (RN-MAT-11, RN-MAT-12, #85, #644): student 1 accepted version 1 of the enrollment term and granted image use; every
-- active generated student whose number is a multiple of 3 accepted the enrollment term (by the guardian, for minors), and the multiples of 6 also granted image use.
-- Records are insert-only; fixed ids and "on conflict do nothing" make the seed repeatable.
insert into term_acceptance (id, organization_id, student_id, kind, event, version, account_id, accepted_at, ip)
select md5('ctcore-seed-term-acceptance-' || k.kind)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-student-1')::uuid,
       k.kind, 'ACCEPTED', 1, md5('ctcore-seed-account-1')::uuid, timestamptz '2026-01-12 12:00:00+00', '192.0.2.10'
from (values ('ENROLLMENT'), ('IMAGE_USE')) as k(kind)
where exists (select 1 from enrollment where id = md5('ctcore-seed-enrollment-1')::uuid)
on conflict do nothing;

insert into term_acceptance (id, organization_id, student_id, kind, event, version, account_id, accepted_at, ip)
select md5('ctcore-seed-term-acceptance-s' || n || k.kind)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-student-' || n)::uuid,
       k.kind, 'ACCEPTED', 1, md5('ctcore-seed-account-1')::uuid, timestamptz '2026-02-01 12:00:00+00' + n * interval '1 day', '192.0.2.10'
from generate_series(7, 56) as n
cross join (values ('ENROLLMENT'), ('IMAGE_USE')) as k(kind)
where n % 3 = 0 and (k.kind = 'ENROLLMENT' or n % 6 = 0)
  and exists (select 1 from enrollment where id = md5('ctcore-seed-enrollment-' || n)::uuid)
on conflict do nothing;
