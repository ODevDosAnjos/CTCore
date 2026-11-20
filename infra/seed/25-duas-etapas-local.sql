-- Só desenvolvimento local (o seed.sh --url não aplica arquivos *-local.sql). Duas etapas do Coordenador (RN-ACE-17) com o segredo de teste
-- fixo MN2GG33SMUWXGZLFMQWTEZTBFV2GK43U (base32; README, "Dados fictícios"), cifrado com a chave de desenvolvimento do application-local.yml,
-- que é pública. Em outro ambiente a chave é outra: o Coordenador configura as duas etapas no primeiro acesso.
insert into account_two_factor (account_id, secret_encrypted, enabled_at)
values (md5('ctcore-seed-account-1')::uuid, 'tuOhPdVkbkSAFgW1ytCe6oXHrhLrMm2QZt6PmQ5xBIT2pNbt2R18OzRL5s+1cpyu', timestamptz '2026-01-01 12:00:00+00')
on conflict do nothing;
