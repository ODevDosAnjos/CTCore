-- Cidade, endereço e telefone das unidades (RF-ORG-02): Rio de Janeiro (Tijuca, Botafogo, Barra da Tijuca) e Niterói (Icaraí). Só preenche o que está vazio.
update unit u set city = d.city, address = d.address, postal_code = d.postal_code, phone = d.phone, whatsapp = d.phone
from (values ('mare-alta-tijuca', 'Rio de Janeiro', 'Rua Conde de Bonfim, 480 - Tijuca', '20520054', '+55 21 3000-1001'),
             ('mare-alta-botafogo', 'Rio de Janeiro', 'Rua Voluntários da Pátria, 210 - Botafogo', '22270010', '+55 21 3000-1002'),
             ('mare-alta-barra', 'Rio de Janeiro', 'Avenida das Américas, 3500 - Barra da Tijuca', '22640102', '+55 21 3000-1003'),
             ('ponte-azul-icarai', 'Niterói', 'Rua Miguel de Frias, 90 - Icaraí', '24220001', '+55 21 3000-2001')) as d(short_name, city, address, postal_code, phone)
where u.short_name = d.short_name and u.city is null;
