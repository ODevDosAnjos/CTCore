-- RN-ACE-23: one management session per account. area is set from the active link; null = no link chosen yet.
alter table account_session add column area text check (area in ('MANAGEMENT', 'PORTAL'));
alter table account_session add column ended_at timestamptz;
alter table account_session add column ended_reason text check (ended_reason in ('REPLACED'));

update account_session s set area = case when l.role in ('COORDINATOR', 'ADMINISTRATOR', 'TEACHER') then 'MANAGEMENT' else 'PORTAL' end
from account_link l where l.id = s.active_link_id;

create index account_session_management on account_session (account_id) where area = 'MANAGEMENT' and ended_at is null;
