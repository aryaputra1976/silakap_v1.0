-- Sprint 38: IKM Survei Kepuasan Layanan

CREATE TABLE `ikm_survey_period` (
  `id`         VARCHAR(36)  NOT NULL,
  `year`       INT          NOT NULL,
  `semester`   INT          NOT NULL,
  `label`      VARCHAR(100) NOT NULL,
  `status`     VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL,

  UNIQUE INDEX `ikm_survey_period_year_semester_key`(`year`, `semester`),
  INDEX `ikm_survey_period_status_idx`(`status`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ikm_survey` (
  `id`            VARCHAR(36)  NOT NULL,
  `period_id`     VARCHAR(36)  NOT NULL,
  `opd_name`      VARCHAR(200) NOT NULL,
  `service_type`  VARCHAR(50)  NULL,
  `submission_id` VARCHAR(36)  NULL,
  `respondent_id` VARCHAR(36)  NULL,

  `u1`  INT NOT NULL,
  `u2`  INT NOT NULL,
  `u3`  INT NOT NULL,
  `u4`  INT NOT NULL,
  `u5`  INT NOT NULL,
  `u6`  INT NOT NULL,
  `u7`  INT NOT NULL,
  `u8`  INT NOT NULL,
  `u9`  INT NOT NULL,

  `ikm_score`   DOUBLE NULL,
  `ikm_convert` DOUBLE NULL,
  `predikat`    VARCHAR(2)   NULL,
  `comments`    LONGTEXT     NULL,

  `submitted_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3)  NOT NULL,

  INDEX `ikm_survey_period_id_idx`(`period_id`),
  INDEX `ikm_survey_service_type_idx`(`service_type`),
  INDEX `ikm_survey_respondent_id_idx`(`respondent_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `ikm_survey_period_id_fkey`
    FOREIGN KEY (`period_id`) REFERENCES `ikm_survey_period`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
