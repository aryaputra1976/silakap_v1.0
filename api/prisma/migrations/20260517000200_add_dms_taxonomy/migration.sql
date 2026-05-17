ALTER TABLE `dms_documents`
  ADD COLUMN `sub_category` VARCHAR(120) NULL,
  ADD COLUMN `tags` JSON NULL,
  ADD COLUMN `access_level` VARCHAR(40) NOT NULL DEFAULT 'INTERNAL';

CREATE INDEX `dms_documents_sub_category_idx` ON `dms_documents`(`sub_category`);
CREATE INDEX `dms_documents_access_level_idx` ON `dms_documents`(`access_level`);
