-- Synthetic announcements (RF-COM-01, #81; RF-COM-02, #82; #644) in the first seeded organization, dates relative to the seed date: three sent (a canceled class, the whole
-- organization, a modality) and two scheduled (the unit, and two classes). Authors are the seeded coordinator and teacher accounts. Reads: see 24-avisos-lidos.sql.
insert into announcement (id, organization_id, unit_id, modality_id, target_kind, class_id, type, title, body, channels, scheduled_for, sent_at, recipient_count, author_account_id)
select md5('ctcore-seed-announcement-' || a.k)::uuid, md5('ctcore-seed-org-1')::uuid, a.unit, a.modality_id, a.kind, a.class, a.type, a.title, a.body, '{EMAIL,PORTAL}',
       a.scheduled, a.sent, a.recipients, md5('ctcore-seed-account-' || a.author)::uuid
from (values
    (1, md5('ctcore-seed-unit-1')::uuid, null::uuid, 'CLASS', md5('ctcore-seed-class-1-1')::uuid, 'CANCELED_CLASS', 'Aula de sexta cancelada', 'Sem aula nesta sexta por motivo de manutenção do tatame.', null::timestamptz, now() - interval '20 days', 12, 2),
    (2, null::uuid, null::uuid, 'ORGANIZATION', null::uuid, 'GENERAL', 'Recesso de fim de ano', 'A academia fecha entre o Natal e o Ano Novo. As aulas voltam na primeira semana de janeiro.', null::timestamptz, now() - interval '15 days', 40, 1),
    (3, md5('ctcore-seed-unit-1')::uuid, null::uuid, 'UNIT', null::uuid, 'SCHEDULE_CHANGE', 'Novo horário a partir do mês que vem', 'As turmas do início da noite passam a começar às 19h30.', now() + interval '7 days', null::timestamptz, null::int, 1),
    (5, null::uuid, (select id from modality where name = 'Judô'), 'MODALITY', null::uuid, 'TEACHER_CHANGE', 'Novo professor no Judô', 'O professor Marcos Teixeira assume as turmas de Judô a partir desta semana.', null::timestamptz, now() - interval '5 days', 18, 1)
) as a(k, unit, modality_id, kind, class, type, title, body, scheduled, sent, recipients, author)
on conflict do nothing;

-- RF-COM-02 (#82): um agendado para duas turmas (destino CLASSES).
insert into announcement (id, organization_id, unit_id, target_kind, type, title, body, channels, scheduled_for, author_account_id)
values (md5('ctcore-seed-announcement-4')::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-unit-1')::uuid, 'CLASSES', 'NO_CLASS_DAY',
        'Sem aula no feriado', 'Sem aula nas duas turmas no feriado da próxima semana.', '{PORTAL}', now() + interval '8 days', md5('ctcore-seed-account-1')::uuid)
on conflict do nothing;
insert into announcement_class (organization_id, announcement_id, class_id)
select md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-announcement-4')::uuid, md5('ctcore-seed-class-1-' || k)::uuid from generate_series(1, 2) as c(k)
on conflict do nothing;
