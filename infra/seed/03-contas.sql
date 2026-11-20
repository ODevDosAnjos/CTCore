-- Contas de teste fáceis (item #644), todas em .test. As senhas simples (README, "Dados fictícios") valem só aqui, gravadas em hash Argon2id;
-- a política de senha (RN-ACE-08) continua valendo para quem cria senha pelo sistema. Preserva o que já existe.
insert into account (id, email, name, password_hash, status)
select md5('ctcore-seed-account-' || e.n)::uuid, e.email, e.name, e.hash, e.status
from (values
    (1, 'coordenador@ctcore.test', 'Jorge Almeida', '$argon2id$v=19$m=16384,t=2,p=1$R01awtXDO1K0iD+JNeZQzw$izLQNYeLUpNBoIdr1b4InNNL6X+E4ynTXw97BIk8Yug', 'ACTIVE'),
    (2, 'professor@ctcore.test', 'Ricardo Fonseca', '$argon2id$v=19$m=16384,t=2,p=1$BDXaKn87Sv6pAnU6IcFJ1w$j+eL8MIIH+IylBPIH+h/Nq9TOUN69G1AO4lo4jLpsAc', 'ACTIVE'),
    (3, 'admin@ctcore.test', 'Mariana Costa', '$argon2id$v=19$m=16384,t=2,p=1$LkI1B26R7o87vfgNEQFKKw$HxCM61LXMPDcRtReQQfw6nIjjD5nUf7vmcXdQN1yn5g', 'ACTIVE'),
    (4, 'admin2@ctcore.test', 'Fernanda Lima', '$argon2id$v=19$m=16384,t=2,p=1$LkI1B26R7o87vfgNEQFKKw$HxCM61LXMPDcRtReQQfw6nIjjD5nUf7vmcXdQN1yn5g', 'ACTIVE'),
    (5, 'aluno@ctcore.test', 'Paulo Henrique Souza', '$argon2id$v=19$m=16384,t=2,p=1$lm87s+r8WMFhC0x0AL2myw$4Q9pM93uM6Cyl06LP5zE2EjdRykwMdHVs6qJTeYQTEQ', 'ACTIVE'),
    (6, 'responsavel@ctcore.test', 'Camila Barbosa', '$argon2id$v=19$m=16384,t=2,p=1$vf5v9g3DEo88dTPYHbcViw$ZCYvl0VXFKnYgnc7QLIlDLXGSnXD3mUBcCYGUdFee0g', 'ACTIVE'),
    (7, 'multiplo@ctcore.test', 'Eduardo Martins', '$argon2id$v=19$m=16384,t=2,p=1$mMqnrGtz1WOXl8FoBR9G9Q$P8V0Evo3oKNKvb2LDnHsnYVmCfxLw4AOPPBUVfcyc8Q', 'ACTIVE'),
    (10, 'henrique.valadares@ctcore.test', 'Henrique Valadares', null, 'INVITED'),
    (11, 'claudia.rezende@ctcore.test', 'Cláudia Rezende', null, 'DEACTIVATED')
) as e(n, email, name, hash, status)
on conflict do nothing;

insert into account_link (id, account_id, organization_id, role, status, starts_on)
select md5('ctcore-seed-link-' || l.n)::uuid, md5('ctcore-seed-account-' || l.account_n)::uuid,
    md5('ctcore-seed-org-' || l.org_n)::uuid, l.role, l.status, date '2026-01-01'
from (values
    (1, 1, 1, 'COORDINATOR', 'ACTIVE'),
    (2, 2, 1, 'TEACHER', 'ACTIVE'),
    (3, 3, 1, 'ADMINISTRATOR', 'ACTIVE'),
    (4, 4, 1, 'ADMINISTRATOR', 'ACTIVE'),
    (5, 5, 1, 'STUDENT', 'ACTIVE'),
    (6, 6, 1, 'GUARDIAN', 'ACTIVE'),
    (7, 7, 1, 'TEACHER', 'ACTIVE'),
    (8, 7, 2, 'STUDENT', 'ACTIVE'),
    (9, 10, 1, 'ADMINISTRATOR', 'PENDING'),
    (10, 11, 1, 'ADMINISTRATOR', 'ENDED')
) as l(n, account_n, org_n, role, status)
on conflict do nothing;

-- Unidades de quem tem escopo por unidade: Administrador de uma unidade (3), de duas (4) e os Professores (2 e 7).
insert into account_link_unit (link_id, organization_id, unit_id)
select md5('ctcore-seed-link-' || u.link_n)::uuid, md5('ctcore-seed-org-1')::uuid, md5('ctcore-seed-unit-' || u.unit_n)::uuid
from (values (2, 1), (3, 1), (4, 1), (4, 3), (7, 1)) as u(link_n, unit_n)
on conflict do nothing;

-- Convite pendente (#644): o Administrador convidado ainda não aceitou (o código é de teste e não serve para entrar).
insert into account_invite (id, account_id, link_id, organization_id, code_hash, expires_at, sent_by)
select md5('ctcore-seed-invite-1')::uuid, md5('ctcore-seed-account-10')::uuid, md5('ctcore-seed-link-9')::uuid, md5('ctcore-seed-org-1')::uuid,
       md5('ctcore-seed-invite-code-1'), now() + interval '7 days', md5('ctcore-seed-account-1')::uuid
on conflict do nothing;
