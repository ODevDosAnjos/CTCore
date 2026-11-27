-- RN-MAT-21: razão social da unidade e nome (ou razão social) do titular da organização, os dois opcionais.
-- Reversão: alter table unit drop column legal_name; alter table organization drop column holder_name;
alter table unit add column legal_name text check (char_length(legal_name) between 1 and 160);
alter table organization add column holder_name text check (char_length(holder_name) between 1 and 160);
