-- Synthetic pilot and tenant; preserve every previously saved value.
-- Unidades 1 e 2 são as principais das organizações 1 e 2; as unidades 3 e 4 são extras da organização 1 (a principal, com 3 unidades).
insert into organization (id, name)
select md5('ctcore-seed-org-' || n)::uuid,
    case when n = 1 then 'Academia Piloto Fictícia' else 'Academia Fictícia ' || n end
from generate_series(1, 2) as n
on conflict do nothing;

insert into unit (id, organization_id, name, short_name)
select md5('ctcore-seed-unit-' || u.n)::uuid, md5('ctcore-seed-org-' || u.org)::uuid, u.name, u.short_name
from (values
    (1, 1, 'Unidade Principal', 'ficticia-1'),
    (2, 2, 'Unidade Principal', 'ficticia-2'),
    (3, 1, 'Unidade Centro', 'ficticia-1-centro'),
    (4, 1, 'Unidade Norte', 'ficticia-1-norte')
) as u(n, org, name, short_name)
on conflict do nothing;

insert into organization_settings (organization_id)
select md5('ctcore-seed-org-' || n)::uuid from generate_series(1, 2) as n
on conflict do nothing;

insert into unit_settings (organization_id, unit_id)
select md5('ctcore-seed-org-' || u.org)::uuid, md5('ctcore-seed-unit-' || u.n)::uuid
from (values (1, 1), (2, 2), (3, 1), (4, 1)) as u(n, org)
on conflict do nothing;

insert into organization_limits (organization_id)
select md5('ctcore-seed-org-' || n)::uuid from generate_series(1, 2) as n
on conflict do nothing;
