-- RN-COB-17 (#638): cada um dos quatro lembretes ganha chave própria e dia guardado; sai a lista reminder_days.
-- Revert (manual): add column reminder_days integer[] not null default '{-3,0,3,10}'; with RLS not forced, rebuild it from the
-- enabled switches (-before_days, 0, after_first_days, after_second_days); drop the seven columns and unit_settings_after_days_distinct.
alter table unit_settings
    add column reminder_before_enabled boolean not null default true,
    add column reminder_due_enabled boolean not null default true,
    add column reminder_after_first_enabled boolean not null default true,
    add column reminder_after_second_enabled boolean not null default true,
    add column reminder_before_days smallint not null default 3 check (reminder_before_days between 1 and 30),
    add column reminder_after_first_days smallint not null default 3 check (reminder_after_first_days between 1 and 60),
    add column reminder_after_second_days smallint not null default 10 check (reminder_after_second_days between 1 and 60),
    add constraint unit_settings_after_days_distinct check (reminder_after_first_days <> reminder_after_second_days);

-- A tabela tem force RLS (V3): sem isto, um dono sem superusuário atualizaria zero linhas em silêncio.
alter table unit_settings no force row level security;

-- Cada dia padrão liga o seu lembrete; os outros ocupam, em ordem crescente, os lembretes livres do mesmo lado; o que sobra é descartado.
-- Lembrete sem dia fica desligado com o padrão (um dia fora do padrão nunca é 3 nem 10, então os dois de depois não colidem).
update unit_settings s set
    reminder_before_enabled = m.before_days is not null,
    reminder_before_days = coalesce(m.before_days, 3),
    reminder_due_enabled = m.due,
    reminder_after_first_enabled = m.first_days is not null,
    reminder_after_first_days = coalesce(m.first_days, 3),
    reminder_after_second_enabled = m.second_days is not null,
    reminder_after_second_days = coalesce(m.second_days, 10)
from (
    select unit_id,
        case when -3 = any(reminder_days) then 3 else -negative[1] end as before_days,
        0 = any(reminder_days) as due,
        case when 3 = any(reminder_days) then 3 else extra[1] end as first_days,
        case when 10 = any(reminder_days) then 10 when 3 = any(reminder_days) then extra[1] else extra[2] end as second_days
    from (
        select unit_id, reminder_days,
            array(select d from unnest(reminder_days) d where d between -30 and -1 order by d) as negative,
            array(select distinct d from unnest(reminder_days) d where d between 1 and 60 and d not in (3, 10) order by d) as extra
        from unit_settings
    ) lists
) m
where m.unit_id = s.unit_id;

alter table unit_settings force row level security;

alter table unit_settings drop column reminder_days;
