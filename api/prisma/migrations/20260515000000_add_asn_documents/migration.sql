ALTER TABLE `documents` ADD COLUMN `asn_id` VARCHAR(36) NULL;

CREATE INDEX `documents_asn_id_idx` ON `documents`(`asn_id`);

ALTER TABLE `documents`
  ADD CONSTRAINT `documents_asn_id_fkey`
  FOREIGN KEY (`asn_id`) REFERENCES `asn`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `roles` (`id`, `code`, `name`, `description`, `is_system`, `is_active`, `created_at`, `updated_at`)
SELECT UUID(), 'OPERATOR_IMPORT', 'Operator Import SIDATA', 'Dapat upload batch SIDATA tanpa kewenangan commit', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `code` = 'OPERATOR_IMPORT');

INSERT INTO `roles` (`id`, `code`, `name`, `description`, `is_system`, `is_active`, `created_at`, `updated_at`)
SELECT UUID(), 'REVIEWER_MAPPING', 'Reviewer Mapping SIDATA', 'Dapat review dan menjalankan mapping SIDATA tanpa kewenangan commit', true, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `code` = 'REVIEWER_MAPPING');
