-- Migration: Add reconciliation_matching_run and reconciliation_finding tables

CREATE TABLE `reconciliation_matching_run` (
  `id`             VARCHAR(36) NOT NULL,
  `period_id`      VARCHAR(36) NOT NULL,
  `batch_id`       VARCHAR(36) NOT NULL,
  `status`         VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  `total_bkpsdm`   INT NOT NULL DEFAULT 0,
  `total_bpkad`    INT NOT NULL DEFAULT 0,
  `total_matched`  INT NOT NULL DEFAULT 0,
  `total_r01`      INT NOT NULL DEFAULT 0,
  `total_r02`      INT NOT NULL DEFAULT 0,
  `total_r03`      INT NOT NULL DEFAULT 0,
  `total_r04`      INT NOT NULL DEFAULT 0,
  `total_r05`      INT NOT NULL DEFAULT 0,
  `total_r06`      INT NOT NULL DEFAULT 0,
  `total_r08`      INT NOT NULL DEFAULT 0,
  `total_r09`      INT NOT NULL DEFAULT 0,
  `total_findings` INT NOT NULL DEFAULT 0,
  `run_at`         DATETIME(3) NULL,
  `run_by_id`      VARCHAR(36) NULL,
  `error_message`  TEXT NULL,
  `created_at`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `reconciliation_matching_run_period_id_idx` (`period_id`),
  INDEX `reconciliation_matching_run_batch_id_idx` (`batch_id`),
  INDEX `reconciliation_matching_run_status_idx` (`status`),

  CONSTRAINT `reconciliation_matching_run_period_id_fkey`
    FOREIGN KEY (`period_id`) REFERENCES `reconciliation_period` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `reconciliation_finding` (
  `id`              VARCHAR(36) NOT NULL,
  `matching_run_id` VARCHAR(36) NOT NULL,
  `period_id`       VARCHAR(36) NOT NULL,
  `finding_code`    VARCHAR(5) NOT NULL,
  `priority`        VARCHAR(20) NOT NULL,
  `status`          VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  `nip`             VARCHAR(30) NULL,
  `nama_bkpsdm`     VARCHAR(250) NULL,
  `nama_bpkad`      VARCHAR(250) NULL,
  `bkpsdm_value`    VARCHAR(500) NULL,
  `bpkad_value`     VARCHAR(500) NULL,
  `description`     VARCHAR(500) NULL,
  `asn_id`          VARCHAR(36) NULL,
  `bpkad_row_id`    VARCHAR(36) NULL,
  `notes`           TEXT NULL,
  `created_at`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `reconciliation_finding_matching_run_id_idx` (`matching_run_id`),
  INDEX `reconciliation_finding_period_id_idx` (`period_id`),
  INDEX `reconciliation_finding_finding_code_idx` (`finding_code`),
  INDEX `reconciliation_finding_priority_idx` (`priority`),
  INDEX `reconciliation_finding_status_idx` (`status`),
  INDEX `reconciliation_finding_nip_idx` (`nip`),

  CONSTRAINT `reconciliation_finding_matching_run_id_fkey`
    FOREIGN KEY (`matching_run_id`) REFERENCES `reconciliation_matching_run` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
