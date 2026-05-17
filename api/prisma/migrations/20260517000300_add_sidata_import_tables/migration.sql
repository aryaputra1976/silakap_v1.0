CREATE TABLE `sidata_reference_import_batches` (
  `id` VARCHAR(36) NOT NULL,
  `source` VARCHAR(100) NOT NULL,
  `import_type` VARCHAR(100) NOT NULL,
  `file_name` VARCHAR(255) NULL,
  `status` VARCHAR(50) NOT NULL,
  `total_rows` INTEGER NOT NULL DEFAULT 0,
  `valid_rows` INTEGER NOT NULL DEFAULT 0,
  `invalid_rows` INTEGER NOT NULL DEFAULT 0,
  `duplicate_rows` INTEGER NOT NULL DEFAULT 0,
  `warning_rows` INTEGER NOT NULL DEFAULT 0,
  `imported_by_id` VARCHAR(36) NULL,
  `file_checksum` VARCHAR(64) NULL,
  `started_at` DATETIME(3) NULL,
  `finished_at` DATETIME(3) NULL,
  `error_message` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `sidata_reference_import_batches_source_idx`(`source`),
  INDEX `sidata_reference_import_batches_import_type_idx`(`import_type`),
  INDEX `sidata_reference_import_batches_status_idx`(`status`),
  INDEX `sidata_reference_import_batches_imported_by_id_idx`(`imported_by_id`),
  INDEX `sidata_reference_import_batches_file_checksum_idx`(`file_checksum`),
  INDEX `sidata_reference_import_batches_created_at_idx`(`created_at`),
  PRIMARY KEY (`id`)
);

CREATE TABLE `sidata_reference_import_staging` (
  `id` VARCHAR(36) NOT NULL,
  `batch_id` VARCHAR(36) NOT NULL,
  `row_number` INTEGER NOT NULL,
  `reference_type` VARCHAR(100) NOT NULL,
  `source_code` VARCHAR(100) NULL,
  `source_name` VARCHAR(300) NOT NULL,
  `source_description` TEXT NULL,
  `target_table` VARCHAR(100) NULL,
  `target_id` VARCHAR(36) NULL,
  `mapping_status` VARCHAR(50) NOT NULL DEFAULT 'UNMAPPED',
  `validation_status` VARCHAR(50) NOT NULL DEFAULT 'VALID',
  `validation_errors` JSON NULL,
  `raw_data` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `sidata_reference_import_staging_batch_id_idx`(`batch_id`),
  INDEX `sidata_reference_import_staging_reference_type_idx`(`reference_type`),
  INDEX `sidata_reference_import_staging_source_code_idx`(`source_code`),
  INDEX `sidata_reference_import_staging_source_name_idx`(`source_name`),
  INDEX `sidata_reference_import_staging_target_table_idx`(`target_table`),
  INDEX `sidata_reference_import_staging_target_id_idx`(`target_id`),
  INDEX `sidata_reference_import_staging_mapping_status_idx`(`mapping_status`),
  INDEX `sidata_reference_import_staging_validation_status_idx`(`validation_status`),
  INDEX `sidata_reference_import_staging_created_at_idx`(`created_at`),
  PRIMARY KEY (`id`)
);

CREATE TABLE `sidata_reference_mappings` (
  `id` VARCHAR(36) NOT NULL,
  `source_type` VARCHAR(100) NOT NULL,
  `source_code` VARCHAR(100) NULL,
  `source_name` VARCHAR(300) NOT NULL,
  `target_table` VARCHAR(100) NOT NULL,
  `target_id` VARCHAR(36) NOT NULL,
  `mapping_status` VARCHAR(50) NOT NULL DEFAULT 'MAPPED',
  `confidence_score` DOUBLE NULL,
  `note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `sidata_reference_mappings_source_type_idx`(`source_type`),
  INDEX `sidata_reference_mappings_source_code_idx`(`source_code`),
  INDEX `sidata_reference_mappings_source_name_idx`(`source_name`),
  INDEX `sidata_reference_mappings_target_table_idx`(`target_table`),
  INDEX `sidata_reference_mappings_target_id_idx`(`target_id`),
  INDEX `sidata_reference_mappings_mapping_status_idx`(`mapping_status`),
  PRIMARY KEY (`id`)
);

CREATE TABLE `sidata_asn_import_batch` (
  `id` VARCHAR(36) NOT NULL,
  `source` VARCHAR(50) NOT NULL,
  `import_type` VARCHAR(100) NOT NULL,
  `file_name` VARCHAR(255) NULL,
  `status` VARCHAR(50) NOT NULL,
  `total_rows` INTEGER NOT NULL DEFAULT 0,
  `valid_rows` INTEGER NOT NULL DEFAULT 0,
  `invalid_rows` INTEGER NOT NULL DEFAULT 0,
  `duplicate_rows` INTEGER NOT NULL DEFAULT 0,
  `warning_rows` INTEGER NOT NULL DEFAULT 0,
  `imported_by_id` VARCHAR(36) NULL,
  `file_checksum` VARCHAR(64) NULL,
  `started_at` DATETIME(3) NULL,
  `finished_at` DATETIME(3) NULL,
  `error_message` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `sidata_asn_import_batch_source_idx`(`source`),
  INDEX `sidata_asn_import_batch_import_type_idx`(`import_type`),
  INDEX `sidata_asn_import_batch_status_idx`(`status`),
  INDEX `sidata_asn_import_batch_file_checksum_idx`(`file_checksum`),
  INDEX `sidata_asn_import_batch_created_at_idx`(`created_at`),
  PRIMARY KEY (`id`)
);

CREATE TABLE `sidata_asn_import_staging` (
  `id` VARCHAR(36) NOT NULL,
  `batch_id` VARCHAR(36) NOT NULL,
  `row_number` INTEGER NOT NULL,
  `nip` VARCHAR(30) NULL,
  `nip_lama` VARCHAR(30) NULL,
  `nama` VARCHAR(300) NULL,
  `nama_jabatan` VARCHAR(300) NULL,
  `jenis_jabatan` VARCHAR(100) NULL,
  `kd_jabatan` VARCHAR(50) NULL,
  `kd_jabatan_siasn` VARCHAR(50) NULL,
  `tmt_jabatan` DATETIME(3) NULL,
  `nama_golongan` VARCHAR(100) NULL,
  `nama_ruang` VARCHAR(100) NULL,
  `kd_golongan` VARCHAR(20) NULL,
  `kd_golongan_siasn` VARCHAR(20) NULL,
  `tmt_golongan` DATETIME(3) NULL,
  `masa_kerja_golongan` VARCHAR(20) NULL,
  `masa_kerja_seluruh` VARCHAR(20) NULL,
  `nama_unor_eselon1` VARCHAR(300) NULL,
  `nama_unor_eselon2` VARCHAR(300) NULL,
  `nama_unor_eselon3` VARCHAR(300) NULL,
  `nama_unor_eselon4` VARCHAR(300) NULL,
  `kd_unor` VARCHAR(50) NULL,
  `tempat_lahir` VARCHAR(100) NULL,
  `tanggal_lahir` DATETIME(3) NULL,
  `jenis_kelamin` VARCHAR(20) NULL,
  `agama` VARCHAR(50) NULL,
  `status_kawin` VARCHAR(50) NULL,
  `pendidikan_terakhir` VARCHAR(100) NULL,
  `nama_sekolah` VARCHAR(300) NULL,
  `tmt_pns` DATETIME(3) NULL,
  `tmt_pensiun` DATETIME(3) NULL,
  `status_kepegawaian` VARCHAR(100) NULL,
  `jenis_asn` VARCHAR(50) NULL,
  `kedudukan_hukum` VARCHAR(100) NULL,
  `no_sk` VARCHAR(100) NULL,
  `tanggal_sk` DATETIME(3) NULL,
  `validation_status` VARCHAR(50) NOT NULL DEFAULT 'VALID',
  `validation_errors` JSON NULL,
  `mapping_status` VARCHAR(50) NOT NULL DEFAULT 'UNMAPPED',
  `matched_asn_id` VARCHAR(36) NULL,
  `raw_data` JSON NOT NULL,
  `mapped_data` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  INDEX `sidata_asn_import_staging_batch_id_idx`(`batch_id`),
  INDEX `sidata_asn_import_staging_nip_idx`(`nip`),
  INDEX `sidata_asn_import_staging_nama_idx`(`nama`),
  INDEX `sidata_asn_import_staging_validation_status_idx`(`validation_status`),
  INDEX `sidata_asn_import_staging_mapping_status_idx`(`mapping_status`),
  INDEX `sidata_asn_import_staging_created_at_idx`(`created_at`),
  PRIMARY KEY (`id`)
);

CREATE TABLE `sidata_import_audit_log` (
  `id` VARCHAR(36) NOT NULL,
  `batch_id` VARCHAR(36) NOT NULL,
  `batch_type` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `actor_id` VARCHAR(36) NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `sidata_import_audit_log_batch_id_idx`(`batch_id`),
  INDEX `sidata_import_audit_log_batch_type_idx`(`batch_type`),
  INDEX `sidata_import_audit_log_action_idx`(`action`),
  INDEX `sidata_import_audit_log_actor_id_idx`(`actor_id`),
  INDEX `sidata_import_audit_log_created_at_idx`(`created_at`),
  PRIMARY KEY (`id`)
);

ALTER TABLE `sidata_reference_import_staging`
  ADD CONSTRAINT `sidata_reference_import_staging_batch_id_fkey`
  FOREIGN KEY (`batch_id`) REFERENCES `sidata_reference_import_batches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sidata_asn_import_staging`
  ADD CONSTRAINT `sidata_asn_import_staging_batch_id_fkey`
  FOREIGN KEY (`batch_id`) REFERENCES `sidata_asn_import_batch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
