-- Synthetic published terms (RF-MAT-05, #70, #644): version 1 of the enrollment terms and of the image-use term of the first seeded organization, published by the first seeded account.
insert into terms_version (id, organization_id, kind, version, body, reaccept, published_by_account_id)
select md5('ctcore-seed-terms-' || t.k)::uuid, md5('ctcore-seed-org-1')::uuid, t.kind, 1, t.body, false, md5('ctcore-seed-account-1')::uuid
from (values (1, 'ENROLLMENT', 'Termo de matrícula: o aluno ou o responsável declara conhecer o regulamento da academia e concorda com as condições de pagamento, frequência e uso das instalações.'),
             (2, 'IMAGE_USE', 'Termo de uso de imagem: o aluno ou o responsável autoriza o uso de fotos e vídeos dos treinos nos canais da academia.')) as t(k, kind, body)
on conflict do nothing;
