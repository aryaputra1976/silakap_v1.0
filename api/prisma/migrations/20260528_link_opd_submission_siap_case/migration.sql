ALTER TABLE `opd_submissions`
  ADD COLUMN `siap_case_id` VARCHAR(36) NULL;

CREATE UNIQUE INDEX `opd_submissions_siap_case_id_key`
  ON `opd_submissions`(`siap_case_id`);

CREATE INDEX `opd_submissions_siap_case_id_idx`
  ON `opd_submissions`(`siap_case_id`);

ALTER TABLE `opd_submissions`
  ADD CONSTRAINT `opd_submissions_siap_case_id_fkey`
  FOREIGN KEY (`siap_case_id`)
  REFERENCES `siap_cases`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
