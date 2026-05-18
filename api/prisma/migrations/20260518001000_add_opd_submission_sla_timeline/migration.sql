ALTER TABLE `opd_submissions`
  ADD COLUMN `sla_started_at` DATETIME(3) NULL,
  ADD COLUMN `sla_paused_at` DATETIME(3) NULL,
  ADD COLUMN `sla_resumed_at` DATETIME(3) NULL,
  ADD COLUMN `sla_stopped_at` DATETIME(3) NULL,
  ADD COLUMN `sla_due_at` DATETIME(3) NULL,
  ADD COLUMN `sla_target_hours` INTEGER NULL,
  ADD COLUMN `sla_elapsed_hours` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `sla_paused_hours` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `sla_status` VARCHAR(40) NULL,
  ADD COLUMN `last_status_changed_at` DATETIME(3) NULL,
  ADD COLUMN `last_status_changed_by_id` VARCHAR(36) NULL;

CREATE INDEX `opd_submissions_sla_status_idx` ON `opd_submissions`(`sla_status`);
CREATE INDEX `opd_submissions_sla_due_at_idx` ON `opd_submissions`(`sla_due_at`);

CREATE TABLE `opd_submission_timelines` (
  `id` VARCHAR(36) NOT NULL,
  `submission_id` VARCHAR(36) NOT NULL,
  `from_status` VARCHAR(40) NULL,
  `to_status` VARCHAR(40) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `actor_id` VARCHAR(36) NULL,
  `actor_role` VARCHAR(80) NULL,
  `note` TEXT NULL,
  `public_note` TEXT NULL,
  `is_visible_to_opd` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `opd_submission_timelines_submission_id_idx` ON `opd_submission_timelines`(`submission_id`);
CREATE INDEX `opd_submission_timelines_to_status_idx` ON `opd_submission_timelines`(`to_status`);
CREATE INDEX `opd_submission_timelines_action_idx` ON `opd_submission_timelines`(`action`);
CREATE INDEX `opd_submission_timelines_created_at_idx` ON `opd_submission_timelines`(`created_at`);

ALTER TABLE `opd_submission_timelines`
  ADD CONSTRAINT `opd_submission_timelines_submission_id_fkey`
  FOREIGN KEY (`submission_id`) REFERENCES `opd_submissions`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
