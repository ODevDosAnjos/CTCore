-- RF-ACE-04: photo of the account, valid in every organization. Holds the file name inside account/<id>/, never a URL.
-- Revert (manual, loses the reference to the photos): alter table account drop column photo;
alter table account add column photo text;
