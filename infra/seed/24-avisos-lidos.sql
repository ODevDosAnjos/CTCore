-- Synthetic announcement reads (RF-POR-06, #93, #644): student 2 and the active students whose number is a multiple of 4 read announcement 2 ("Recesso de fim de ano"),
-- so the management list shows readers. "on conflict do nothing" makes the seed repeatable.
insert into announcement_read (organization_id, announcement_id, student_id, account_id, opened_at)
select md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-announcement-2')::uuid, s.id, coalesce(s.account_id, md5('ctcore-seed-account-1')::uuid), now() - interval '1 day'
from student s
where (s.id = md5('ctcore-seed-student-2')::uuid
       or s.id in (select md5('ctcore-seed-student-' || n)::uuid from generate_series(7, 56) as n where n % 4 = 0 and n % 10 <> 0))
  and exists (select 1 from announcement where id = md5('ctcore-seed-announcement-2')::uuid)
  and exists (select 1 from account where id = coalesce(s.account_id, md5('ctcore-seed-account-1')::uuid))
on conflict do nothing;
