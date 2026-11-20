-- Synthetic teachers (RF-PRO-01, #644): six, five in the main organization (one inactive) and one in the second.
-- Teacher 1-1 is the account professor@ctcore.test (heads two classes); teacher 1-2 is multiplo@ctcore.test (teacher in the main organization, student in the second).
insert into teacher (id, organization_id, name, name_key, email, phone, directory_consent, consent_declared_by_management, status, account_id)
select md5('ctcore-seed-teacher-' || t.o || '-' || t.k)::uuid, md5('ctcore-seed-org-' || t.o)::uuid, t.name, t.name_key,
       t.email, '+55 11 90000-00' || t.o || t.k, t.k = 1, t.k = 1, t.status,
       case when t.account_n is not null then md5('ctcore-seed-account-' || t.account_n)::uuid end
from (values (1, 1, 'Ricardo Fonseca', 'ricardo fonseca', 'ricardo.fonseca@ficticia.example', 'ACTIVE', 2),
             (1, 2, 'Eduardo Martins', 'eduardo martins', 'eduardo.martins@ficticia.example', 'ACTIVE', 7),
             (1, 3, 'Patrícia Nogueira', 'patricia nogueira', 'patricia.nogueira@ficticia.example', 'ACTIVE', null),
             (1, 4, 'Marcos Teixeira', 'marcos teixeira', 'marcos.teixeira@ficticia.example', 'ACTIVE', null),
             (1, 5, 'Sérgio Lopes', 'sergio lopes', 'sergio.lopes@ficticia.example', 'INACTIVE', null),
             (2, 1, 'Helena Prado', 'helena prado', 'helena.prado@ficticia.example', 'ACTIVE', null))
       as t(o, k, name, name_key, email, status, account_n)
on conflict do nothing;

insert into teacher_unit (organization_id, teacher_id, unit_id)
select md5('ctcore-seed-org-' || t.o)::uuid, md5('ctcore-seed-teacher-' || t.o || '-' || t.k)::uuid, md5('ctcore-seed-unit-' || t.unit)::uuid
from (values (1, 1, 1), (1, 2, 1), (1, 3, 3), (1, 4, 4), (1, 5, 1), (2, 1, 2)) as t(o, k, unit)
on conflict do nothing;

-- Jiu-Jitsu with the purple belt (when the organization has the level) for the Jiu-Jitsu teachers.
insert into teacher_modality (organization_id, teacher_id, modality_id, level_id, degree)
select md5('ctcore-seed-org-' || t.o)::uuid, md5('ctcore-seed-teacher-' || t.o || '-' || t.k)::uuid, m.id, g.id, 1
from (values (1, 1), (1, 2), (1, 3), (1, 5), (2, 1)) as t(o, k)
join modality m on m.name = 'Jiu-Jitsu'
left join graduation_level g on g.organization_id = md5('ctcore-seed-org-' || t.o)::uuid and g.modality_id = m.id and g.name = 'Roxa'
on conflict do nothing;

-- Judô and Muay Thai without graduation.
insert into teacher_modality (organization_id, teacher_id, modality_id)
select md5('ctcore-seed-org-' || t.o)::uuid, md5('ctcore-seed-teacher-' || t.o || '-' || t.k)::uuid, m.id
from (values (1, 2, 'Judô'), (1, 4, 'Judô'), (2, 1, 'Judô'), (1, 3, 'Muay Thai'), (1, 4, 'Muay Thai')) as t(o, k, modality)
join modality m on m.name = t.modality
on conflict do nothing;
