-- #758: a organização deixa de ter cor (RNF-22, RF-ORG-01); a restrição da V12 sai junto.
-- Reversão: alter table organization add column color text, add constraint organization_color_format check (color is null or color ~ '^#[0-9a-f]{6}$');
-- Os valores apagados não voltam.
alter table organization
    drop constraint organization_color_format,
    drop column color;
