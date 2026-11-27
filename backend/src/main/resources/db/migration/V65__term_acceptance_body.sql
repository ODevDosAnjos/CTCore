-- RN-MAT-21, RN-LGP-01: o aceite do termo de matrícula guarda o texto final, com os campos já preenchidos. Registros antigos ficam sem texto.
-- Reversão: alter table term_acceptance drop column body;
alter table term_acceptance add column body text check (body is null or kind = 'ENROLLMENT');
