-- Run once in DBeaver (select database crwn_eco first)
-- If column already exists, ignore the error.

ALTER TABLE users
  ADD COLUMN display_name_ar VARCHAR(190) DEFAULT '' AFTER display_name;
