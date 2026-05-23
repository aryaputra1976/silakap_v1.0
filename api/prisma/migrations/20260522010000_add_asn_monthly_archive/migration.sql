-- ─── asn_monthly_archive ─────────────────────────────────────────────────────
CREATE TABLE `asn_monthly_archive` (
  `id`                    VARCHAR(36)  NOT NULL,
  `bulan`                 INTEGER      NOT NULL,
  `tahun`                 INTEGER      NOT NULL,
  `label`                 VARCHAR(50)  NOT NULL,
  `status`                VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  `batch_id`              VARCHAR(36)  NULL,
  `total_asn`             INTEGER      NOT NULL DEFAULT 0,
  `total_pns`             INTEGER      NOT NULL DEFAULT 0,
  `total_pppk`            INTEGER      NOT NULL DEFAULT 0,
  `count_mutasi_jabatan`  INTEGER      NOT NULL DEFAULT 0,
  `count_mutasi_unit`     INTEGER      NOT NULL DEFAULT 0,
  `count_naik_pangkat`    INTEGER      NOT NULL DEFAULT 0,
  `count_pensiun`         INTEGER      NOT NULL DEFAULT 0,
  `count_asn_baru`        INTEGER      NOT NULL DEFAULT 0,
  `count_asn_keluar`      INTEGER      NOT NULL DEFAULT 0,
  `count_tugas_belajar`   INTEGER      NOT NULL DEFAULT 0,
  `count_kgb`             INTEGER      NOT NULL DEFAULT 0,
  `count_alih_jabatan`    INTEGER      NOT NULL DEFAULT 0,
  `count_status_berubah`  INTEGER      NOT NULL DEFAULT 0,
  `archived_by_id`        VARCHAR(36)  NULL,
  `archived_at`           DATETIME(3)  NULL,
  `finalized_at`          DATETIME(3)  NULL,
  `created_at`            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`            DATETIME(3)  NOT NULL,

  UNIQUE INDEX `asn_monthly_archive_bulan_tahun_key`(`bulan`, `tahun`),
  INDEX `asn_monthly_archive_tahun_idx`(`tahun`),
  INDEX `asn_monthly_archive_bulan_idx`(`bulan`),
  INDEX `asn_monthly_archive_status_idx`(`status`),
  INDEX `asn_monthly_archive_batch_id_idx`(`batch_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── asn_monthly_change ───────────────────────────────────────────────────────
CREATE TABLE `asn_monthly_change` (
  `id`            VARCHAR(36)  NOT NULL,
  `archive_id`    VARCHAR(36)  NOT NULL,
  `asn_id`        VARCHAR(36)  NULL,
  `nip`           VARCHAR(30)  NOT NULL,
  `nama`          VARCHAR(300) NOT NULL,
  `change_type`   VARCHAR(50)  NOT NULL,
  `field_sebelum` JSON         NULL,
  `field_sesudah` JSON         NULL,
  `detected_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `asn_monthly_change_archive_id_idx`(`archive_id`),
  INDEX `asn_monthly_change_asn_id_idx`(`asn_id`),
  INDEX `asn_monthly_change_change_type_idx`(`change_type`),
  INDEX `asn_monthly_change_archive_type_idx`(`archive_id`, `change_type`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── asn_monthly_snapshot ─────────────────────────────────────────────────────
CREATE TABLE `asn_monthly_snapshot` (
  `id`            VARCHAR(36)  NOT NULL,
  `archive_id`    VARCHAR(36)  NOT NULL,
  `asn_id`        VARCHAR(36)  NOT NULL,
  `nip`           VARCHAR(30)  NOT NULL,
  `nama`          VARCHAR(300) NOT NULL,
  `snapshot_data` JSON         NOT NULL,
  `checksum`      VARCHAR(128) NOT NULL,

  UNIQUE INDEX `asn_monthly_snapshot_archive_asn_key`(`archive_id`, `asn_id`),
  INDEX `asn_monthly_snapshot_archive_id_idx`(`archive_id`),
  INDEX `asn_monthly_snapshot_asn_id_idx`(`asn_id`),
  INDEX `asn_monthly_snapshot_nip_idx`(`nip`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Foreign Keys ─────────────────────────────────────────────────────────────
ALTER TABLE `asn_monthly_archive`
  ADD CONSTRAINT `asn_monthly_archive_batch_id_fkey`
    FOREIGN KEY (`batch_id`) REFERENCES `sidata_asn_import_batch`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `asn_monthly_change`
  ADD CONSTRAINT `asn_monthly_change_archive_id_fkey`
    FOREIGN KEY (`archive_id`) REFERENCES `asn_monthly_archive`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `asn_monthly_change_asn_id_fkey`
    FOREIGN KEY (`asn_id`) REFERENCES `asn`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `asn_monthly_snapshot`
  ADD CONSTRAINT `asn_monthly_snapshot_archive_id_fkey`
    FOREIGN KEY (`archive_id`) REFERENCES `asn_monthly_archive`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `asn_monthly_snapshot_asn_id_fkey`
    FOREIGN KEY (`asn_id`) REFERENCES `asn`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
