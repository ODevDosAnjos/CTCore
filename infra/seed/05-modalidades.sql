-- Modalidades ativas (RF-MOD-01) nas organizações de exemplo.
insert into organization_modality (organization_id, modality_id, active)
select md5('ctcore-seed-org-' || n)::uuid, m.id, true
from generate_series(1, 2) as n
join modality m on m.name in ('Jiu-Jitsu', 'Judô', 'Muay Thai')
on conflict do nothing;
