-- ─── 1. ref_eselon: BKN structural level reference table ─────────────────────
CREATE TABLE `ref_eselon` (
  `id`         VARCHAR(36)  NOT NULL,
  `kode`       VARCHAR(10)  NOT NULL,
  `nama`       VARCHAR(20)  NOT NULL,
  `level`      INTEGER      NOT NULL,
  `is_active`  BOOLEAN      NOT NULL DEFAULT true,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)  NOT NULL,

  UNIQUE INDEX `ref_eselon_kode_key`(`kode`),
  INDEX `ref_eselon_kode_idx`(`kode`),
  INDEX `ref_eselon_level_idx`(`level`),
  INDEX `ref_eselon_is_active_idx`(`is_active`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed BKN eselon reference data
INSERT INTO `ref_eselon` (`id`, `kode`, `nama`, `level`, `created_at`, `updated_at`) VALUES
  (UUID(), '11', 'I.a',  1, NOW(), NOW()),
  (UUID(), '12', 'I.b',  1, NOW(), NOW()),
  (UUID(), '21', 'II.a', 2, NOW(), NOW()),
  (UUID(), '22', 'II.b', 2, NOW(), NOW()),
  (UUID(), '31', 'III.a',3, NOW(), NOW()),
  (UUID(), '32', 'III.b',3, NOW(), NOW()),
  (UUID(), '41', 'IV.a', 4, NOW(), NOW()),
  (UUID(), '42', 'IV.b', 4, NOW(), NOW());

-- ─── 2. asn: new operational & PPPK fields ────────────────────────────────────
ALTER TABLE `asn`
  ADD COLUMN `eselon_ref_id`            VARCHAR(36)  NULL AFTER `eselon_nama`,
  ADD COLUMN `nama_unor_eselon1`        VARCHAR(300) NULL,
  ADD COLUMN `nama_unor_eselon2`        VARCHAR(300) NULL,
  ADD COLUMN `nama_unor_eselon3`        VARCHAR(300) NULL,
  ADD COLUMN `nama_unor_eselon4`        VARCHAR(300) NULL,
  ADD COLUMN `pangkat_nama`             VARCHAR(120) NULL,
  ADD COLUMN `ruang_nama`               VARCHAR(80)  NULL,
  ADD COLUMN `nomor_sk`                 VARCHAR(120) NULL,
  ADD COLUMN `tanggal_sk`               DATETIME(3)  NULL,
  ADD COLUMN `nomor_perjanjian_kerja`   VARCHAR(120) NULL,
  ADD COLUMN `tmt_perjanjian_kerja`     DATETIME(3)  NULL,
  ADD COLUMN `akhir_perjanjian_kerja`   DATETIME(3)  NULL,
  ADD COLUMN `masa_hubungan_kerja_bulan` INTEGER     NULL;

CREATE INDEX `asn_eselon_ref_id_idx`          ON `asn`(`eselon_ref_id`);
CREATE INDEX `asn_akhir_perjanjian_kerja_idx`  ON `asn`(`akhir_perjanjian_kerja`);

ALTER TABLE `asn`
  ADD CONSTRAINT `asn_eselon_ref_id_fkey`
    FOREIGN KEY (`eselon_ref_id`) REFERENCES `ref_eselon`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── 3. ref_jabatan: eselon_level for jabatan classification ─────────────────
ALTER TABLE `ref_jabatan`
  ADD COLUMN `eselon_level` VARCHAR(10) NULL;

CREATE INDEX `ref_jabatan_eselon_level_idx` ON `ref_jabatan`(`eselon_level`);

-- ─── 4. asn_assignment_history: SK + eselon tracking ────────────────────────
ALTER TABLE `asn_assignment_history`
  ADD COLUMN `nomor_sk`      VARCHAR(120) NULL AFTER `effective_date`,
  ADD COLUMN `tanggal_sk`    DATETIME(3)  NULL AFTER `nomor_sk`,
  ADD COLUMN `siasn_eselon_id` VARCHAR(30) NULL AFTER `tanggal_sk`,
  ADD COLUMN `eselon_ref_id` VARCHAR(36)  NULL AFTER `siasn_eselon_id`,
  ADD COLUMN `eselon_nama`   VARCHAR(80)  NULL AFTER `eselon_ref_id`;

CREATE INDEX `asn_assignment_history_eselon_ref_id_idx` ON `asn_assignment_history`(`eselon_ref_id`);

ALTER TABLE `asn_assignment_history`
  ADD CONSTRAINT `asn_assignment_history_eselon_ref_id_fkey`
    FOREIGN KEY (`eselon_ref_id`) REFERENCES `ref_eselon`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── 5. asn_golongan_history: SK tracking ────────────────────────────────────
ALTER TABLE `asn_golongan_history`
  ADD COLUMN `nomor_sk`   VARCHAR(120) NULL AFTER `effective_date`,
  ADD COLUMN `tanggal_sk` DATETIME(3)  NULL AFTER `nomor_sk`;

-- ─── 6. sidata_asn_import_staging: identity, eselon, pangkat, SK, PPPK ──────
ALTER TABLE `sidata_asn_import_staging`
  ADD COLUMN `nik`                    VARCHAR(30)  NULL AFTER `nip_lama`,
  ADD COLUMN `gelar_depan`            VARCHAR(80)  NULL AFTER `nama`,
  ADD COLUMN `gelar_belakang`         VARCHAR(120) NULL AFTER `gelar_depan`,
  ADD COLUMN `nomor_sk_jabatan`       VARCHAR(120) NULL AFTER `tmt_jabatan`,
  ADD COLUMN `tanggal_sk_jabatan`     DATETIME(3)  NULL AFTER `nomor_sk_jabatan`,
  ADD COLUMN `siasn_eselon_id`        VARCHAR(30)  NULL AFTER `tanggal_sk_jabatan`,
  ADD COLUMN `eselon_nama`            VARCHAR(80)  NULL AFTER `siasn_eselon_id`,
  ADD COLUMN `nama_pangkat`           VARCHAR(120) NULL AFTER `nama_golongan`,
  ADD COLUMN `nomor_sk_golongan`      VARCHAR(120) NULL AFTER `tmt_golongan`,
  ADD COLUMN `tanggal_sk_golongan`    DATETIME(3)  NULL AFTER `nomor_sk_golongan`,
  ADD COLUMN `nomor_perjanjian_kerja` VARCHAR(120) NULL AFTER `kedudukan_hukum`,
  ADD COLUMN `tmt_perjanjian_kerja`   DATETIME(3)  NULL AFTER `nomor_perjanjian_kerja`,
  ADD COLUMN `akhir_perjanjian_kerja` DATETIME(3)  NULL AFTER `tmt_perjanjian_kerja`,
  ADD COLUMN `masa_hubungan_kerja_bulan` INTEGER   NULL AFTER `akhir_perjanjian_kerja`;

-- ─── 7. Backfill asn.eselon_ref_id from siasn_eselon_id → ref_eselon.kode ──
UPDATE `asn` a
  JOIN `ref_eselon` re ON re.`kode` = a.`siasn_eselon_id`
SET a.`eselon_ref_id` = re.`id`
WHERE a.`siasn_eselon_id` IS NOT NULL
  AND a.`eselon_ref_id` IS NULL
  AND a.`deleted_at` IS NULL;
