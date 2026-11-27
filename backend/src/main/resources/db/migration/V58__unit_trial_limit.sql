-- RN-AEX-02 (#745): o limite de aulas experimentais por pessoa passa da organização para cada unidade.
-- Revert (manual): alter table organization_settings add column trial_limit integer not null default 2 check (trial_limit between 1 and 3);
-- copy back one value per organization from unit_settings; alter table unit_settings drop column trial_limit.
alter table unit_settings add column trial_limit integer not null default 2 check (trial_limit between 1 and 3);

-- As duas tabelas têm force RLS (V3): sem isto, um dono sem superusuário copiaria zero linhas em silêncio.
alter table organization_settings no force row level security;
alter table unit_settings no force row level security;
update unit_settings u set trial_limit = o.trial_limit from organization_settings o where o.organization_id = u.organization_id;
alter table organization_settings force row level security;
alter table unit_settings force row level security;

alter table organization_settings drop column trial_limit;
