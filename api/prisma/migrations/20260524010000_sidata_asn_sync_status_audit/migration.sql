ALTER TABLE `asn`
  ADD COLUMN `sync_status` VARCHAR(40) NOT NULL DEFAULT 'SYNCED' AFTER `checksum`,
  ADD COLUMN `last_siasn_batch_id` VARCHAR(36) NULL AFTER `sync_status`,
  ADD COLUMN `last_siasn_synced_at` DATETIME(3) NULL AFTER `last_siasn_batch_id`,
  ADD COLUMN `local_correction_at` DATETIME(3) NULL AFTER `last_siasn_synced_at`,
  ADD COLUMN `local_correction_by` VARCHAR(36) NULL AFTER `local_correction_at`,
  ADD COLUMN `local_correction_reason` TEXT NULL AFTER `local_correction_by`,
  ADD COLUMN `needs_review` BOOLEAN NOT NULL DEFAULT false AFTER `local_correction_reason`,
  ADD COLUMN `review_note` TEXT NULL AFTER `needs_review`;

CREATE INDEX `asn_sync_status_idx` ON `asn`(`sync_status`);
CREATE INDEX `asn_last_siasn_batch_id_idx` ON `asn`(`last_siasn_batch_id`);
CREATE INDEX `asn_last_siasn_synced_at_idx` ON `asn`(`last_siasn_synced_at`);
CREATE INDEX `asn_local_correction_at_idx` ON `asn`(`local_correction_at`);
CREATE INDEX `asn_local_correction_by_idx` ON `asn`(`local_correction_by`);
CREATE INDEX `asn_needs_review_idx` ON `asn`(`needs_review`);

CREATE TABLE `asn_change_log` (
  `id` VARCHAR(36) NOT NULL,
  `asn_id` VARCHAR(36) NOT NULL,
  `field_name` VARCHAR(120) NOT NULL,
  `old_value` TEXT NULL,
  `new_value` TEXT NULL,
  `changed_by` VARCHAR(36) NULL,
  `changed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reason` TEXT NULL,
  `evidence_document_id` VARCHAR(36) NULL,
  `source` VARCHAR(60) NOT NULL DEFAULT 'MANUAL',
  `source_batch_id` VARCHAR(36) NULL,
  `metadata` JSON NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `asn_change_log_asn_id_idx` ON `asn_change_log`(`asn_id`);
CREATE INDEX `asn_change_log_field_name_idx` ON `asn_change_log`(`field_name`);
CREATE INDEX `asn_change_log_changed_by_idx` ON `asn_change_log`(`changed_by`);
CREATE INDEX `asn_change_log_changed_at_idx` ON `asn_change_log`(`changed_at`);
CREATE INDEX `asn_change_log_source_idx` ON `asn_change_log`(`source`);
CREATE INDEX `asn_change_log_source_batch_id_idx` ON `asn_change_log`(`source_batch_id`);
CREATE INDEX `asn_change_log_evidence_document_id_idx` ON `asn_change_log`(`evidence_document_id`);

ALTER TABLE `asn_change_log`
  ADD CONSTRAINT `asn_change_log_asn_id_fkey`
  FOREIGN KEY (`asn_id`) REFERENCES `asn`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE `asn`
SET
  `sync_status` = CASE
    WHEN `source_batch_id` IS NULL AND `synced_at` IS NULL THEN 'NEED_REVIEW'
    ELSE 'SYNCED'
  END,
  `last_siasn_batch_id` = `source_batch_id`,
  `last_siasn_synced_at` = `synced_at`,
  `needs_review` = CASE
    WHEN `source_batch_id` IS NULL AND `synced_at` IS NULL THEN true
    ELSE false
  END;
