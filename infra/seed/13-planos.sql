-- Synthetic plans (RF-PLA-01, #644): nine in the main organization (units 1, 3 and 4; one inactive) and four in the second.
insert into plan (id, organization_id, unit_id, modality_id, name, name_key, value_cents, weekly_frequency, valid_other_units, status)
select md5('ctcore-seed-plan-' || p.o || '-' || p.k)::uuid, md5('ctcore-seed-org-' || p.o)::uuid, md5('ctcore-seed-unit-' || p.unit)::uuid,
       m.id, p.name, p.name_key, p.value_cents, p.freq, p.other, p.status
from (values (1, 1, 1, 'Jiu-Jitsu 2x', 'jiu-jitsu 2x', 'Jiu-Jitsu', 15000, 2, false, 'ACTIVE'),
             (1, 2, 1, 'Jiu-Jitsu Livre', 'jiu-jitsu livre', 'Jiu-Jitsu', 20000, null, true, 'ACTIVE'),
             (1, 3, 1, 'Judô 3x', 'judo 3x', 'Judô', 18000, 3, false, 'ACTIVE'),
             (1, 4, 1, 'Judô Antigo', 'judo antigo', 'Judô', 12000, 2, false, 'INACTIVE'),
             (1, 5, 1, 'Muay Thai 2x', 'muay thai 2x', 'Muay Thai', 14000, 2, false, 'ACTIVE'),
             (1, 6, 1, 'Jiu-Jitsu Kids 2x', 'jiu-jitsu kids 2x', 'Jiu-Jitsu', 12000, 2, false, 'ACTIVE'),
             (1, 7, 3, 'Jiu-Jitsu 2x Botafogo', 'jiu-jitsu 2x botafogo', 'Jiu-Jitsu', 15000, 2, false, 'ACTIVE'),
             (1, 8, 3, 'Muay Thai Livre Botafogo', 'muay thai livre botafogo', 'Muay Thai', 17000, null, true, 'ACTIVE'),
             (1, 9, 4, 'Judô 3x Barra', 'judo 3x barra', 'Judô', 17000, 3, false, 'ACTIVE'),
             (2, 1, 2, 'Jiu-Jitsu 2x', 'jiu-jitsu 2x', 'Jiu-Jitsu', 15000, 2, false, 'ACTIVE'),
             (2, 2, 2, 'Jiu-Jitsu Livre', 'jiu-jitsu livre', 'Jiu-Jitsu', 20000, null, true, 'ACTIVE'),
             (2, 3, 2, 'Judô 3x', 'judo 3x', 'Judô', 18000, 3, false, 'ACTIVE'),
             (2, 4, 2, 'Judô Antigo', 'judo antigo', 'Judô', 12000, 2, false, 'INACTIVE'))
       as p(o, k, unit, name, name_key, modality, value_cents, freq, other, status)
join modality m on m.name = p.modality
on conflict do nothing;
