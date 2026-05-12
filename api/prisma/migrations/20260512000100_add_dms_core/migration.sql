CREATE TABLE IF NOT EXISTS `dms_documents` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,

  `category` ENUM(
    'SKP',
    'LAPORAN_BULANAN',
    'LAPORAN_TRIWULAN',
    'LAPORAN_TAHUNAN',
    'REKON_DATA',
    'DATA_ASN',
    'SURAT_DINAS',
    'NOTA_DINAS',
    'BUKTI_DUKUNG',
    'DOKUMEN_KEBIJAKAN',
    'ARSIP_KEPEGAWAIAN',
    'LAINNYA'
  ) NOT NULL DEFAULT 'BUKTI_DUKUNG',

  `status` ENUM(
    'DRAFT',
    'UPLOADED',
    'SUBMITTED',
    'VERIFIED',
    'REJECTED',
    'ARCHIVED'
  ) NOT NULL DEFAULT 'DRAFT',

  `period_year` INT NULL,
  `period_month` INT NULL,
  `period_quarter` INT NULL,

  `unit_kerja_id` VARCHAR(36) NULL,
  `asn_id` VARCHAR(36) NULL,
  `case_id` VARCHAR(36) NULL,
  `worklog_id` VARCHAR(36) NULL,

  `file_name` VARCHAR(255) NULL,
  `original_file_name` VARCHAR(255) NULL,
  `storage_path` VARCHAR(500) NULL,
  `mime_type` VARCHAR(120) NULL,
  `file_size` INT NULL,
  `checksum` VARCHAR(128) NULL,
  `version` INT NOT NULL DEFAULT 1,

  `submitted_at` DATETIME(3) NULL,
  `submitted_by_id` VARCHAR(36) NULL,

  `verified_at` DATETIME(3) NULL,
  `verified_by_id` VARCHAR(36) NULL,

  `rejected_at` DATETIME(3) NULL,
  `rejection_note` TEXT NULL,

  `archived_at` DATETIME(3) NULL,

  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by_id` VARCHAR(36) NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `updated_by_id` VARCHAR(36) NULL,
  `deleted_at` DATETIME(3) NULL,

  PRIMARY KEY (`id`),

  INDEX `dms_documents_title_idx` (`title`),
  INDEX `dms_documents_category_idx` (`category`),
  INDEX `dms_documents_status_idx` (`status`),
  INDEX `dms_documents_period_year_idx` (`period_year`),
  INDEX `dms_documents_period_month_idx` (`period_month`),
  INDEX `dms_documents_period_quarter_idx` (`period_quarter`),
  INDEX `dms_documents_unit_kerja_id_idx` (`unit_kerja_id`),
  INDEX `dms_documents_asn_id_idx` (`asn_id`),
  INDEX `dms_documents_case_id_idx` (`case_id`),
  INDEX `dms_documents_worklog_id_idx` (`worklog_id`),
  INDEX `dms_documents_created_by_id_idx` (`created_by_id`),
  INDEX `dms_documents_submitted_by_id_idx` (`submitted_by_id`),
  INDEX `dms_documents_verified_by_id_idx` (`verified_by_id`),
  INDEX `dms_documents_created_at_idx` (`created_at`),
  INDEX `dms_documents_deleted_at_idx` (`deleted_at`)
);