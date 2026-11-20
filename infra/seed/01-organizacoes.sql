-- Recursos ligados e desligados das organizações de exemplo (item #12). Idempotente: nunca altera o que já existe (on conflict do nothing).
-- Organização n = md5('ctcore-seed-org-' || n)::uuid; a tabela de organizações vem na #13.
insert into organization_feature (organization_id, feature_key, enabled)
select md5('ctcore-seed-org-' || o.n)::uuid, f.key, f.enabled
from (values
    (1, 'online-payments', true),
    (1, 'whatsapp-button', true),
    (1, 'advanced-reports', false),
    (2, 'online-payments', false),
    (2, 'whatsapp-button', true)
) as f(n, key, enabled)
join (values (1), (2)) as o(n) on o.n = f.n
on conflict do nothing;
