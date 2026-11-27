-- Titular da organização 1 e razão social de uma unidade (RN-MAT-21), só dados fictícios. As outras unidades ficam sem CNPJ:
-- nelas o termo usa o titular. Só preenche o que está vazio.
update organization set holder_name = 'Maré Alta Artes Marciais Ltda.', holder_document = '11444777000161'
where id = md5('ctcore-seed-org-1')::uuid and holder_name is null and holder_document is null;
update unit set cnpj = '11222333000181', legal_name = 'Maré Alta Botafogo Ltda.'
where short_name = 'mare-alta-botafogo' and cnpj is null and legal_name is null;
