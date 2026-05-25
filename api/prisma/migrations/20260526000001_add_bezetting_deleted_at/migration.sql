-- Add soft-delete support to siformen_bezetting
ALTER TABLE `siformen_bezetting`
  ADD COLUMN `deleted_at` DATETIME(3) NULL;

CREATE INDEX `siformen_bezetting_deleted_at_idx` ON `siformen_bezetting`(`deleted_at`);
