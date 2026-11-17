-- RN-ORG-11 (#484): instant a unit was deactivated, shown in the unit list. Units deactivated before this column keep it null.
-- Revert (manual, only the date is lost): alter table unit drop column deactivated_at;
alter table unit add column deactivated_at timestamptz;
