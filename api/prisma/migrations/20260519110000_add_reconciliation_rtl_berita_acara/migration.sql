-- Migration: Add RTL fields to reconciliation_finding + add reconciliation_berita_acara

ALTER TABLE `reconciliation_finding`
  ADD COLUMN `rtl_pic`      VARCHAR(200) NULL,
  ADD COLUMN `rtl_deadline` DATE NULL,
  ADD COLUMN `rtl_action`   VARCHAR(50)  NULL,
  ADD COLUMN `rtl_notes`    TEXT NULL,
  ADD COLUMN `resolved_at`  DATETIME(3)  NULL;

CREATE TABLE `reconciliation_berita_acara` (
  `id`              VARCHAR(36)  NOT NULL,
  `period_id`       VARCHAR(36)  NOT NULL,
  `matching_run_id` VARCHAR(36)  NULL,
  `status`          VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
  `nomor_ba`        VARCHAR(100) NULL,
  `tanggal_ba`      DATE         NULL,
  `total_temuan`    INT          NOT NULL DEFAULT 0,
  `total_resolved`  INT          NOT NULL DEFAULT 0,
  `total_pending`   INT          NOT NULL DEFAULT 0,
  `summary_json`    JSON         NULL,
  `drafted_by_id`   VARCHAR(36)  NULL,
  `drafted_at`      DATETIME(3)  NULL,
  `finalized_by_id` VARCHAR(36)  NULL,
  `finalized_at`    DATETIME(3)  NULL,
  `notes`           TEXT         NULL,
  `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)  NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `reconciliation_berita_acara_period_id_idx` (`period_id`),
  INDEX `reconciliation_berita_acara_status_idx` (`status`),

  CONSTRAINT `reconciliation_berita_acara_period_id_fkey`
    FOREIGN KEY (`period_id`) REFERENCES `reconciliation_period` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
