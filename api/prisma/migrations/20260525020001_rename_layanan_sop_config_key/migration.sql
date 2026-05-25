-- Rename reserved-word column `key` → `sop_key`
-- Conditional: only executes the ALTER if the old `key` column still exists.
-- On fresh installs (migration 20260525020000 already uses sop_key), this is a no-op.

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'layanan_sop_config'
    AND COLUMN_NAME  = 'key'
);

SET @sql = IF(
  @col_exists > 0,
  'ALTER TABLE `layanan_sop_config`
     DROP INDEX `layanan_sop_config_key_key`,
     CHANGE COLUMN `key` `sop_key` VARCHAR(20) NOT NULL,
     ADD UNIQUE INDEX `layanan_sop_config_sop_key_key` (`sop_key`)',
  'SELECT 1 /* sop_key already exists, no-op */'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
