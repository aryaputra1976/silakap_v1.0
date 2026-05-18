CREATE TABLE `kinerja_rhk_realizations` (
  `id` VARCHAR(36) NOT NULL,
  `candidate_id` VARCHAR(36) NULL,
  `rhk_code` VARCHAR(80) NOT NULL,
  `rhk_title` VARCHAR(200) NULL,
  `module_key` VARCHAR(80) NOT NULL,
  `period_year` INTEGER NOT NULL,
  `period_month` INTEGER NULL,
  `period_quarter` INTEGER NULL,
  `period_type` VARCHAR(20) NOT NULL,
  `quantity_value` INTEGER NULL,
  `quality_score` INTEGER NULL,
  `time_score` INTEGER NULL,
  `evidence_score` INTEGER NULL,
  `compliance_score` INTEGER NULL,
  `final_score` INTEGER NULL,
  `status` VARCHAR(30) NOT NULL,
  `source_type` VARCHAR(80) NULL,
  `source_id` VARCHAR(36) NULL,
  `submission_number` VARCHAR(80) NULL,
  `sop_code` VARCHAR(80) NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `evidence_snapshot_json` JSON NULL,
  `approved_by_id` VARCHAR(36) NULL,
  `approved_at` DATETIME(3) NULL,
  `created_by_id` VARCHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `kinerja_rhk_realizations_candidate_id_key`(`candidate_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `kinerja_rhk_realizations_rhk_code_idx` ON `kinerja_rhk_realizations`(`rhk_code`);
CREATE INDEX `kinerja_rhk_realizations_module_key_idx` ON `kinerja_rhk_realizations`(`module_key`);
CREATE INDEX `kinerja_rhk_realizations_period_year_period_month_idx` ON `kinerja_rhk_realizations`(`period_year`, `period_month`);
CREATE INDEX `kinerja_rhk_realizations_period_year_period_quarter_idx` ON `kinerja_rhk_realizations`(`period_year`, `period_quarter`);
CREATE INDEX `kinerja_rhk_realizations_period_type_idx` ON `kinerja_rhk_realizations`(`period_type`);
CREATE INDEX `kinerja_rhk_realizations_status_idx` ON `kinerja_rhk_realizations`(`status`);
CREATE INDEX `kinerja_rhk_realizations_created_at_idx` ON `kinerja_rhk_realizations`(`created_at`);

CREATE TABLE `kinerja_rhk_realization_audits` (
  `id` VARCHAR(36) NOT NULL,
  `realization_id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `before_json` JSON NULL,
  `after_json` JSON NULL,
  `actor_id` VARCHAR(36) NULL,
  `actor_role` VARCHAR(80) NULL,
  `note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `kinerja_rhk_realization_audits_realization_id_idx` ON `kinerja_rhk_realization_audits`(`realization_id`);
CREATE INDEX `kinerja_rhk_realization_audits_action_idx` ON `kinerja_rhk_realization_audits`(`action`);
CREATE INDEX `kinerja_rhk_realization_audits_created_at_idx` ON `kinerja_rhk_realization_audits`(`created_at`);

ALTER TABLE `kinerja_rhk_realizations`
  ADD CONSTRAINT `kinerja_rhk_realizations_candidate_id_fkey`
  FOREIGN KEY (`candidate_id`) REFERENCES `kinerja_rhk_candidates`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `kinerja_rhk_realization_audits`
  ADD CONSTRAINT `kinerja_rhk_realization_audits_realization_id_fkey`
  FOREIGN KEY (`realization_id`) REFERENCES `kinerja_rhk_realizations`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
