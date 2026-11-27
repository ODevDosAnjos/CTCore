-- #762 (RF-ACE-05): "Meus vínculos" shows, to the guardian, the names of the students linked to the account in every
-- organization where its GUARDIAN link is active. Read only: no policy here allows writing. The account scope exists only
-- inside AccountTransactions.forAccount; with app.account_id empty nothing opens. No cycle: student > student_guardian >
-- guardian > account_link.
-- Revert (manual, no data involved): drop policy student_of_guardian_account on student;
-- drop policy student_guardian_of_account on student_guardian; drop policy guardian_of_account on guardian;
create policy guardian_of_account on guardian for select
    using (account_id = nullif(current_setting('app.account_id', true), '')::uuid
        and exists (select 1 from account_link l
            where l.account_id = guardian.account_id and l.organization_id = guardian.organization_id
            and l.role = 'GUARDIAN' and l.status = 'ACTIVE'));

create policy student_guardian_of_account on student_guardian for select
    using (exists (select 1 from guardian g
        join account_link l on l.account_id = g.account_id and l.organization_id = g.organization_id
        where g.organization_id = student_guardian.organization_id and g.id = student_guardian.guardian_id
        and g.account_id = nullif(current_setting('app.account_id', true), '')::uuid
        and l.role = 'GUARDIAN' and l.status = 'ACTIVE'));

create policy student_of_guardian_account on student for select
    using (exists (select 1 from student_guardian sg
        join guardian g on g.organization_id = sg.organization_id and g.id = sg.guardian_id
        join account_link l on l.account_id = g.account_id and l.organization_id = g.organization_id
        where sg.organization_id = student.organization_id and sg.student_id = student.id
        and g.account_id = nullif(current_setting('app.account_id', true), '')::uuid
        and l.role = 'GUARDIAN' and l.status = 'ACTIVE'));
