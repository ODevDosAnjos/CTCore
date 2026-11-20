-- Dias sem aula days (RF-AGE-01, #644), relative to the seed date: a holiday and a year-end recess (coordination) in every seeded unit.
-- The seed creates classes but no lessons: lessons come from the daily job (03:00 UTC), or when a class is created or its schedule changes in the app (see README, "Aulas").
insert into no_class_day (id, organization_id, unit_id, starts_on, ends_on, reason, origin)
select md5(d.key || u.id)::uuid, u.organization_id, u.id, current_date + d.from_days, current_date + d.to_days, d.reason, d.origin
from (values ('ctcore-seed-noclass-h', 10, 10, 'Feriado municipal', 'HOLIDAY'),
             ('ctcore-seed-noclass-r', 30, 37, 'Recesso de fim de ano', 'COORDINATOR')) as d(key, from_days, to_days, reason, origin)
join unit u on u.short_name in ('mare-alta-tijuca', 'ponte-azul-icarai', 'mare-alta-botafogo', 'mare-alta-barra')
on conflict do nothing;
