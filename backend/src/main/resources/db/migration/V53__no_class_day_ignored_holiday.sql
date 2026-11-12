-- RF-AGE-05 (#474): "Ignorar" um feriado sugerido esconde so a sugestao daquela unidade; batch_id liga os dias lancados juntos (a origem mostra "N unidades").
-- Sem preenchimento retroativo: batch_id nulo vale uma unidade.
-- Revert (manual, no data loss outside these objects): drop table no_class_day_ignored_holiday; alter table no_class_day drop column batch_id;
create table no_class_day_ignored_holiday (
    organization_id uuid not null references organization(id),
    unit_id uuid not null,
    holiday_date date not null,
    created_by uuid,
    created_at timestamptz not null default now(),
    primary key (organization_id, unit_id, holiday_date),
    foreign key (organization_id, unit_id) references unit(organization_id, id)
);
alter table no_class_day_ignored_holiday enable row level security;
alter table no_class_day_ignored_holiday force row level security;
create policy organization_scope on no_class_day_ignored_holiday
    using (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid)
    with check (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid);

alter table no_class_day add column batch_id uuid;
create index no_class_day_batch on no_class_day (organization_id, batch_id) where batch_id is not null;
