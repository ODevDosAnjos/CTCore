-- Synthetic classes (RF-TUR-01, #644): nine in the main organization (units 1, 3 and 4; one inactive) and three in the second.
-- Head and assistant teachers teach the class modality (RN-TUR-05). professor@ctcore.test (teacher 1-1) heads classes 1 and 4.
insert into training_class (id, organization_id, unit_id, name, name_key, modality_id, age_range_id, capacity, head_teacher_id, status)
select md5('ctcore-seed-class-' || c.o || '-' || c.k)::uuid, md5('ctcore-seed-org-' || c.o)::uuid, md5('ctcore-seed-unit-' || c.unit)::uuid,
       c.name, c.name_key, m.id, a.id, c.capacity, md5('ctcore-seed-teacher-' || c.o || '-' || c.head)::uuid, c.status
from (values
    (1, 1, 1, 'Jiu-Jitsu Adulto', 'jiu-jitsu adulto', 'Jiu-Jitsu', 'adulto', 30, 1, 'ACTIVE'),
    (1, 2, 1, 'Judô Infantil', 'judo infantil', 'Judô', 'infantil', 20, 2, 'ACTIVE'),
    (1, 3, 1, 'Jiu-Jitsu Avançado', 'jiu-jitsu avancado', 'Jiu-Jitsu', null, null, 5, 'INACTIVE'),
    (1, 4, 1, 'Jiu-Jitsu Infantil', 'jiu-jitsu infantil', 'Jiu-Jitsu', 'infantil', 20, 1, 'ACTIVE'),
    (1, 5, 3, 'Muay Thai Adulto', 'muay thai adulto', 'Muay Thai', 'adulto', 25, 3, 'ACTIVE'),
    (1, 6, 3, 'Jiu-Jitsu Juvenil', 'jiu-jitsu juvenil', 'Jiu-Jitsu', 'juvenil', 20, 3, 'ACTIVE'),
    (1, 7, 4, 'Judô Adulto', 'judo adulto', 'Judô', 'adulto', 25, 4, 'ACTIVE'),
    (1, 8, 4, 'Muay Thai Master', 'muay thai master', 'Muay Thai', 'master', 15, 4, 'ACTIVE'),
    (1, 9, 1, 'Jiu-Jitsu Adulto Manhã', 'jiu-jitsu adulto manha', 'Jiu-Jitsu', 'adulto', 20, 2, 'ACTIVE'),
    (2, 1, 2, 'Jiu-Jitsu Adulto', 'jiu-jitsu adulto', 'Jiu-Jitsu', 'adulto', 30, 1, 'ACTIVE'),
    (2, 2, 2, 'Judô Infantil', 'judo infantil', 'Judô', 'infantil', 20, 1, 'ACTIVE'),
    (2, 3, 2, 'Jiu-Jitsu Avançado', 'jiu-jitsu avancado', 'Jiu-Jitsu', null, null, 1, 'INACTIVE'))
       as c(o, k, unit, name, name_key, modality, age_key, capacity, head, status)
join modality m on m.name = c.modality
left join age_range a on a.organization_id = md5('ctcore-seed-org-' || c.o)::uuid and a.name_key = c.age_key
on conflict do nothing;

-- weekday: 1 = Monday ... 7 = Sunday.
insert into training_class_schedule (organization_id, class_id, weekday, starts_at, ends_at)
select md5('ctcore-seed-org-' || s.o)::uuid, md5('ctcore-seed-class-' || s.o || '-' || s.k)::uuid, s.weekday, s.starts_at::time, s.ends_at::time
from (values
    (1, 1, 1, '19:00', '20:00'), (1, 1, 3, '19:00', '20:00'),
    (1, 2, 2, '18:00', '19:00'), (1, 2, 4, '18:00', '19:00'),
    (1, 3, 5, '20:00', '21:30'),
    (1, 4, 3, '17:00', '18:00'), (1, 4, 6, '09:00', '10:00'),
    (1, 5, 1, '20:00', '21:00'), (1, 5, 3, '20:00', '21:00'),
    (1, 6, 2, '17:00', '18:00'), (1, 6, 4, '17:00', '18:00'),
    (1, 7, 2, '20:00', '21:00'), (1, 7, 4, '20:00', '21:00'),
    (1, 8, 6, '10:00', '11:30'),
    (1, 9, 2, '07:00', '08:00'), (1, 9, 4, '07:00', '08:00'),
    (2, 1, 1, '19:00', '20:00'), (2, 1, 3, '19:00', '20:00'),
    (2, 2, 2, '18:00', '19:00'), (2, 2, 4, '18:00', '19:00'),
    (2, 3, 5, '20:00', '21:30')) as s(o, k, weekday, starts_at, ends_at)
on conflict do nothing;

-- One assistant: the second teacher on the adult Jiu-Jitsu class of the main organization.
insert into training_class_assistant (organization_id, class_id, teacher_id)
select md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-class-1-1')::uuid, md5('ctcore-seed-teacher-1-2')::uuid
on conflict do nothing;

-- RF-TUR-02: só as turmas 1 e 5 da principal e a 1 da segunda têm grupo; as demais ficam sem.
update training_class set group_link = 'https://chat.example.com/ctcore-seed-grupo'
where id in (md5('ctcore-seed-class-1-1')::uuid, md5('ctcore-seed-class-1-5')::uuid, md5('ctcore-seed-class-2-1')::uuid) and group_link is null;
