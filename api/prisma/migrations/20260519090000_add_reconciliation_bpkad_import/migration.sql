-- Sprint 34: Rekonsiliasi BKPSDM-BPKAD import baseline

CREATE TABLE `reconciliation_period` (
  `id` VARCHAR(36) NOT NULL,
  `period_year` INTEGER NOT NULL,
  `period_month` INTEGER NULL,
  `period_quarter` INTEGER NULL,
  `period_type` VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
  `title` VARCHAR(200) NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  `cut_off_date` DATE NULL,
  `notes` TEXT NULL,
  `created_by_id` VARCHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `reconciliation_import_batch` (
  `id` VARCHAR(36) NOT NULL,
  `period_id` VARCHAR(36) NULL,
  `source` VARCHAR(50) NOT NULL,
  `import_type` VARCHAR(100) NOT NULL,
  `file_name` VARCHAR(255) NULL,
  `original_file_name` VARCHAR(255) NULL,
  `mime_type` VARCHAR(120) NULL,
  `size_bytes` INTEGER NULL,
  `file_checksum` VARCHAR(64) NULL,
  `sheet_name` VARCHAR(120) NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'UPLOADED',
  `total_rows` INTEGER NOT NULL DEFAULT 0,
  `valid_rows` INTEGER NOT NULL DEFAULT 0,
  `invalid_rows` INTEGER NOT NULL DEFAULT 0,
  `duplicate_rows` INTEGER NOT NULL DEFAULT 0,
  `warning_rows` INTEGER NOT NULL DEFAULT 0,
  `required_columns_json` JSON NULL,
  `missing_columns_json` JSON NULL,
  `uploaded_by_id` VARCHAR(36) NULL,
  `uploaded_at` DATETIME(3) NULL,
  `error_message` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `reconciliation_bpkad_payroll_record` (
  `id` VARCHAR(36) NOT NULL,
  `batch_id` VARCHAR(36) NOT NULL,
  `row_number` INTEGER NOT NULL,
  `tgl_gaji` DATE NULL,
  `nip` VARCHAR(30) NULL,
  `nip_lama` VARCHAR(30) NULL,
  `nama` VARCHAR(250) NULL,
  `kd_skpd` VARCHAR(50) NULL,
  `kd_satker` VARCHAR(50) NULL,
  `nm_skpd` VARCHAR(250) NULL,
  `nm_satker` VARCHAR(250) NULL,
  `kd_stapeg` VARCHAR(50) NULL,
  `tmt_stop` DATE NULL,
  `kd_pangkat` VARCHAR(50) NULL,
  `gapok` DECIMAL(18, 2) NULL,
  `kotor` DECIMAL(18, 2) NULL,
  `potongan` DECIMAL(18, 2) NULL,
  `bersih` DECIMAL(18, 2) NULL,
  `npwp` VARCHAR(50) NULL,
  `no_ktp` VARCHAR(50) NULL,
  `validation_status` VARCHAR(30) NOT NULL DEFAULT 'VALID',
  `validation_errors` JSON NULL,
  `raw_data` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `reconciliation_audit_log` (
  `id` VARCHAR(36) NOT NULL,
  `period_id` VARCHAR(36) NULL,
  `batch_id` VARCHAR(36) NULL,
  `action` VARCHAR(100) NOT NULL,
  `actor_id` VARCHAR(36) NULL,
  `actor_role` VARCHAR(50) NULL,
  `note` TEXT NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `reconciliation_period_period_year_period_month_idx` ON `reconciliation_period`(`period_year`, `period_month`);
CREATE INDEX `reconciliation_period_period_year_period_quarter_idx` ON `reconciliation_period`(`period_year`, `period_quarter`);
CREATE INDEX `reconciliation_period_period_type_idx` ON `reconciliation_period`(`period_type`);
CREATE INDEX `reconciliation_period_status_idx` ON `reconciliation_period`(`status`);
CREATE INDEX `reconciliation_period_created_at_idx` ON `reconciliation_period`(`created_at`);

CREATE INDEX `reconciliation_import_batch_period_id_idx` ON `reconciliation_import_batch`(`period_id`);
CREATE INDEX `reconciliation_import_batch_source_idx` ON `reconciliation_import_batch`(`source`);
CREATE INDEX `reconciliation_import_batch_import_type_idx` ON `reconciliation_import_batch`(`import_type`);
CREATE INDEX `reconciliation_import_batch_status_idx` ON `reconciliation_import_batch`(`status`);
CREATE INDEX `reconciliation_import_batch_file_checksum_idx` ON `reconciliation_import_batch`(`file_checksum`);
CREATE INDEX `reconciliation_import_batch_created_at_idx` ON `reconciliation_import_batch`(`created_at`);

CREATE UNIQUE INDEX `reconciliation_bpkad_payroll_record_batch_id_row_number_key` ON `reconciliation_bpkad_payroll_record`(`batch_id`, `row_number`);
CREATE INDEX `reconciliation_bpkad_payroll_record_batch_id_idx` ON `reconciliation_bpkad_payroll_record`(`batch_id`);
CREATE INDEX `reconciliation_bpkad_payroll_record_nip_idx` ON `reconciliation_bpkad_payroll_record`(`nip`);
CREATE INDEX `reconciliation_bpkad_payroll_record_nama_idx` ON `reconciliation_bpkad_payroll_record`(`nama`);
CREATE INDEX `reconciliation_bpkad_payroll_record_kd_skpd_idx` ON `reconciliation_bpkad_payroll_record`(`kd_skpd`);
CREATE INDEX `reconciliation_bpkad_payroll_record_kd_satker_idx` ON `reconciliation_bpkad_payroll_record`(`kd_satker`);
CREATE INDEX `reconciliation_bpkad_payroll_record_validation_status_idx` ON `reconciliation_bpkad_payroll_record`(`validation_status`);

CREATE INDEX `reconciliation_audit_log_period_id_idx` ON `reconciliation_audit_log`(`period_id`);
CREATE INDEX `reconciliation_audit_log_batch_id_idx` ON `reconciliation_audit_log`(`batch_id`);
CREATE INDEX `reconciliation_audit_log_action_idx` ON `reconciliation_audit_log`(`action`);
CREATE INDEX `reconciliation_audit_log_actor_id_idx` ON `reconciliation_audit_log`(`actor_id`);
CREATE INDEX `reconciliation_audit_log_created_at_idx` ON `reconciliation_audit_log`(`created_at`);

ALTER TABLE `reconciliation_import_batch`
  ADD CONSTRAINT `reconciliation_import_batch_period_id_fkey`
  FOREIGN KEY (`period_id`) REFERENCES `reconciliation_period`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `reconciliation_bpkad_payroll_record`
  ADD CONSTRAINT `reconciliation_bpkad_payroll_record_batch_id_fkey`
  FOREIGN KEY (`batch_id`) REFERENCES `reconciliation_import_batch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
