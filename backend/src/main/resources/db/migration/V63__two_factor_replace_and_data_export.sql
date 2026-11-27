-- #764 (RF-ACE-04, RF-LGP-01): the secret of a new device waits apart from the active one, and the account scope may read what
-- "Baixar meus dados" shows. The policy account_scope of V11 already covers the new columns. The new policies are read only
-- (for select): with app.account_id empty nothing opens, and no policy here allows writing. No cycle: unit and organization
-- only look at account_link and account_link_unit.
-- Revert (manual, loses only pending device replacements): drop policy unit_of_account_any_link on unit;
-- drop policy organization_of_account_any_link on organization; drop policy teacher_of_account on teacher;
-- drop policy modality_confirmation_of_account on modality_confirmation; drop policy term_acceptance_of_account on term_acceptance;
-- alter table account_two_factor drop column pending_secret_encrypted, drop column pending_expires_at;
alter table account_two_factor add column pending_secret_encrypted text;
alter table account_two_factor add column pending_expires_at timestamptz;

create policy term_acceptance_of_account on term_acceptance for select
    using (account_id = nullif(current_setting('app.account_id', true), '')::uuid);

create policy modality_confirmation_of_account on modality_confirmation for select
    using (account_id = nullif(current_setting('app.account_id', true), '')::uuid);

create policy teacher_of_account on teacher for select
    using (account_id = nullif(current_setting('app.account_id', true), '')::uuid);

-- Organizations and units of any link of the account, whatever its status (V8 and V55 only cover active links).
create policy organization_of_account_any_link on organization for select
    using (exists (select 1 from account_link l
        where l.organization_id = organization.id
        and l.account_id = nullif(current_setting('app.account_id', true), '')::uuid));

create policy unit_of_account_any_link on unit for select
    using (exists (select 1 from account_link_unit u
        join account_link l on l.id = u.link_id
        where u.unit_id = unit.id
        and l.account_id = nullif(current_setting('app.account_id', true), '')::uuid));
