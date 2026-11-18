-- #489: last access per link (choose-organization screen) and read-only names for the account and invite scopes.
-- Revert (manual): drop both policies below; alter table account_link drop column last_access_at.
alter table account_link add column last_access_at timestamptz;

-- The invite-code scope may read (only read) the organization of that one invite, to show its name.
create policy organization_of_invite on organization for select
    using (exists (select 1 from account_invite i
        where i.organization_id = organization.id
        and i.code_hash = nullif(current_setting('app.invite_code_hash', true), '')));

-- Unit names: of the active links of the account, or of the link of the invite code; read only.
create policy unit_of_account_or_invite on unit for select
    using (exists (select 1 from account_link_unit u
        join account_link l on l.id = u.link_id
        left join account_invite i on i.link_id = l.id
        where u.unit_id = unit.id
        and ((l.status = 'ACTIVE' and l.account_id = nullif(current_setting('app.account_id', true), '')::uuid)
            or i.code_hash = nullif(current_setting('app.invite_code_hash', true), ''))));
