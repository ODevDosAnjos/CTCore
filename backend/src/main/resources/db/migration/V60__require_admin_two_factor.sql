-- RN-ACE-24: o Coordenador pode exigir duas etapas dos Administradores. Desligado por padrão.
-- Desfazer: drop policy organization_settings_of_administrator on organization_settings;
--           alter table organization_settings drop column require_admin_two_factor;
alter table organization_settings add column require_admin_two_factor boolean not null default false;

-- TwoFactorService.requiredFor roda no escopo da conta, que pode ter vínculos em várias organizações:
-- ele só lê (nunca grava) a linha das organizações em que a conta é Administrador ativo.
create policy organization_settings_of_administrator on organization_settings for select
    using (exists (select 1 from account_link l
        where l.organization_id = organization_settings.organization_id and l.status = 'ACTIVE' and l.role = 'ADMINISTRATOR'
        and l.account_id = nullif(current_setting('app.account_id', true), '')::uuid));
