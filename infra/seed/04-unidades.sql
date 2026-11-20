-- Synthetic cities for the seeded units (RF-ORG-02).
update unit set city = case short_name when 'ficticia-1' then 'Campinas' when 'ficticia-1-centro' then 'Campinas'
    when 'ficticia-1-norte' then 'Valinhos' else 'Sorocaba' end
where short_name in ('ficticia-1', 'ficticia-2', 'ficticia-1-centro', 'ficticia-1-norte') and city is null;
