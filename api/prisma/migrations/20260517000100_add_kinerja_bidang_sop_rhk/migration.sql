CREATE TABLE `kinerja_bidang_sop` (
  `id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(80) NOT NULL,
  `title` VARCHAR(250) NOT NULL,
  `stage` ENUM('TAHAP_1', 'TAHAP_2', 'TAHAP_3') NOT NULL,
  `stage_title` VARCHAR(150) NOT NULL,
  `short_description` TEXT NOT NULL,
  `objective` TEXT NULL,
  `scope` TEXT NULL,
  `legal_basis` JSON NULL,
  `outputs` JSON NULL,
  `evidence_examples` JSON NULL,
  `status` ENUM('ACTIVE', 'DRAFT', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `is_rhk_primary` BOOLEAN NOT NULL DEFAULT false,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `target_quantity` INTEGER NULL,
  `target_unit` ENUM('LAPORAN', 'DOKUMEN') NOT NULL DEFAULT 'LAPORAN',
  `quality_target` VARCHAR(80) NULL,
  `time_target` VARCHAR(150) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by` VARCHAR(36) NULL,
  `updated_at` DATETIME(3) NOT NULL,
  `updated_by` VARCHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,

  UNIQUE INDEX `kinerja_bidang_sop_code_key`(`code`),
  INDEX `kinerja_bidang_sop_code_idx`(`code`),
  INDEX `kinerja_bidang_sop_stage_idx`(`stage`),
  INDEX `kinerja_bidang_sop_status_idx`(`status`),
  INDEX `kinerja_bidang_sop_is_rhk_primary_idx`(`is_rhk_primary`),
  INDEX `kinerja_bidang_sop_sort_order_idx`(`sort_order`),
  INDEX `kinerja_bidang_sop_deleted_at_idx`(`deleted_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `kinerja_bidang_sop_rhk` (
  `id` VARCHAR(36) NOT NULL,
  `sop_id` VARCHAR(36) NOT NULL,
  `rhk_code` VARCHAR(30) NOT NULL,
  `title` VARCHAR(200) NULL,
  `description` TEXT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `kinerja_bidang_sop_rhk_sop_id_rhk_code_key`(`sop_id`, `rhk_code`),
  INDEX `kinerja_bidang_sop_rhk_sop_id_idx`(`sop_id`),
  INDEX `kinerja_bidang_sop_rhk_rhk_code_idx`(`rhk_code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `kinerja_bidang_sop_steps` (
  `id` VARCHAR(36) NOT NULL,
  `sop_id` VARCHAR(36) NOT NULL,
  `step_number` INTEGER NOT NULL,
  `activity` VARCHAR(250) NOT NULL,
  `actor` VARCHAR(150) NOT NULL,
  `input` TEXT NOT NULL,
  `process` TEXT NOT NULL,
  `output` TEXT NOT NULL,
  `duration` VARCHAR(120) NOT NULL,
  `note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `kinerja_bidang_sop_steps_sop_id_step_number_key`(`sop_id`, `step_number`),
  INDEX `kinerja_bidang_sop_steps_sop_id_idx`(`sop_id`),
  INDEX `kinerja_bidang_sop_steps_step_number_idx`(`step_number`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `kinerja_bidang_sop_targets` (
  `id` VARCHAR(36) NOT NULL,
  `sop_id` VARCHAR(36) NOT NULL,
  `rhk_code` VARCHAR(30) NOT NULL,
  `year` INTEGER NOT NULL,
  `target_quantity` INTEGER NOT NULL,
  `target_unit` ENUM('LAPORAN', 'DOKUMEN') NOT NULL DEFAULT 'LAPORAN',
  `quality_target` VARCHAR(80) NOT NULL,
  `time_target` VARCHAR(150) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by` VARCHAR(36) NULL,
  `updated_at` DATETIME(3) NOT NULL,
  `updated_by` VARCHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,

  UNIQUE INDEX `kinerja_bidang_sop_targets_sop_id_rhk_code_year_key`(`sop_id`, `rhk_code`, `year`),
  INDEX `kinerja_bidang_sop_targets_sop_id_idx`(`sop_id`),
  INDEX `kinerja_bidang_sop_targets_rhk_code_idx`(`rhk_code`),
  INDEX `kinerja_bidang_sop_targets_year_idx`(`year`),
  INDEX `kinerja_bidang_sop_targets_deleted_at_idx`(`deleted_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `kinerja_bidang_sop_realizations` (
  `id` VARCHAR(36) NOT NULL,
  `target_id` VARCHAR(36) NOT NULL,
  `sop_id` VARCHAR(36) NOT NULL,
  `rhk_code` VARCHAR(30) NOT NULL,
  `year` INTEGER NOT NULL,
  `month` INTEGER NULL,
  `quarter` INTEGER NULL,
  `realization_quantity` INTEGER NOT NULL DEFAULT 0,
  `quality_percent` DOUBLE NULL,
  `time_status` VARCHAR(80) NULL,
  `status` ENUM('DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'REVISION_REQUIRED') NOT NULL DEFAULT 'DRAFT',
  `title` VARCHAR(250) NOT NULL,
  `description` TEXT NULL,
  `constraint` TEXT NULL,
  `follow_up` TEXT NULL,
  `review_note` TEXT NULL,
  `submitted_at` DATETIME(3) NULL,
  `reviewed_at` DATETIME(3) NULL,
  `approved_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by` VARCHAR(36) NULL,
  `updated_at` DATETIME(3) NOT NULL,
  `updated_by` VARCHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,

  INDEX `kinerja_bidang_sop_realizations_target_id_idx`(`target_id`),
  INDEX `kinerja_bidang_sop_realizations_sop_id_idx`(`sop_id`),
  INDEX `kinerja_bidang_sop_realizations_rhk_code_idx`(`rhk_code`),
  INDEX `kinerja_bidang_sop_realizations_year_idx`(`year`),
  INDEX `kinerja_bidang_sop_realizations_month_idx`(`month`),
  INDEX `kinerja_bidang_sop_realizations_quarter_idx`(`quarter`),
  INDEX `kinerja_bidang_sop_realizations_status_idx`(`status`),
  INDEX `kinerja_bidang_sop_realizations_created_at_idx`(`created_at`),
  INDEX `kinerja_bidang_sop_realizations_deleted_at_idx`(`deleted_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `kinerja_bidang_sop_evidence` (
  `id` VARCHAR(36) NOT NULL,
  `realization_id` VARCHAR(36) NOT NULL,
  `dms_document_id` VARCHAR(36) NOT NULL,
  `label` VARCHAR(150) NULL,
  `description` TEXT NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by` VARCHAR(36) NULL,

  UNIQUE INDEX `kinerja_bidang_sop_evidence_realization_id_dms_document_id_key`(`realization_id`, `dms_document_id`),
  INDEX `kinerja_bidang_sop_evidence_realization_id_idx`(`realization_id`),
  INDEX `kinerja_bidang_sop_evidence_dms_document_id_idx`(`dms_document_id`),
  INDEX `kinerja_bidang_sop_evidence_created_at_idx`(`created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `kinerja_bidang_sop_rhk`
  ADD CONSTRAINT `kinerja_bidang_sop_rhk_sop_id_fkey`
  FOREIGN KEY (`sop_id`) REFERENCES `kinerja_bidang_sop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kinerja_bidang_sop_steps`
  ADD CONSTRAINT `kinerja_bidang_sop_steps_sop_id_fkey`
  FOREIGN KEY (`sop_id`) REFERENCES `kinerja_bidang_sop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kinerja_bidang_sop_targets`
  ADD CONSTRAINT `kinerja_bidang_sop_targets_sop_id_fkey`
  FOREIGN KEY (`sop_id`) REFERENCES `kinerja_bidang_sop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kinerja_bidang_sop_realizations`
  ADD CONSTRAINT `kinerja_bidang_sop_realizations_target_id_fkey`
  FOREIGN KEY (`target_id`) REFERENCES `kinerja_bidang_sop_targets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kinerja_bidang_sop_realizations`
  ADD CONSTRAINT `kinerja_bidang_sop_realizations_sop_id_fkey`
  FOREIGN KEY (`sop_id`) REFERENCES `kinerja_bidang_sop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kinerja_bidang_sop_evidence`
  ADD CONSTRAINT `kinerja_bidang_sop_evidence_realization_id_fkey`
  FOREIGN KEY (`realization_id`) REFERENCES `kinerja_bidang_sop_realizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kinerja_bidang_sop_evidence`
  ADD CONSTRAINT `kinerja_bidang_sop_evidence_dms_document_id_fkey`
  FOREIGN KEY (`dms_document_id`) REFERENCES `dms_documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
