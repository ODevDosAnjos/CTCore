-- Organizações e unidades de exemplo (Rio de Janeiro e Niterói); preserva todo valor já gravado.
-- Unidades 1 e 2 são as principais das organizações 1 e 2; as unidades 3 e 4 são extras da organização 1 (a principal, com 3 unidades).
insert into organization (id, name)
select md5('ctcore-seed-org-' || n)::uuid,
    case when n = 1 then 'Academia Maré Alta' else 'Academia Ponte Azul' end
from generate_series(1, 2) as n
on conflict do nothing;

insert into unit (id, organization_id, name, short_name)
select md5('ctcore-seed-unit-' || u.n)::uuid, md5('ctcore-seed-org-' || u.org)::uuid, u.name, u.short_name
from (values
    (1, 1, 'Maré Alta Tijuca', 'mare-alta-tijuca'),
    (2, 2, 'Ponte Azul Icaraí', 'ponte-azul-icarai'),
    (3, 1, 'Maré Alta Botafogo', 'mare-alta-botafogo'),
    (4, 1, 'Maré Alta Barra', 'mare-alta-barra')
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
