-- AlterTable: SiformenJabatan — tambah flagDelayering, statusPosisi, levelKesetaraan
ALTER TABLE `siformen_jabatan`
  ADD COLUMN `flag_delayering` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `status_posisi` VARCHAR(20) NOT NULL DEFAULT 'aktif',
  ADD COLUMN `level_kesetaraan` INTEGER NULL;

ALTER TABLE `siformen_jabatan`
  ADD INDEX `siformen_jabatan_status_posisi_idx` (`status_posisi`);

-- AlterTable: UnitKerja — tambah tipe dan flag_delayering
ALTER TABLE `unit_kerja`
  ADD COLUMN `tipe` VARCHAR(50) NULL,
  ADD COLUMN `flag_delayering` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: SiformenBup
CREATE TABLE `siformen_bup` (
  `id` VARCHAR(36) NOT NULL,
  `jabatan_id` VARCHAR(36) NOT NULL,
  `tahun` INTEGER NOT NULL,
  `jumlah_pensiun` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `created_by` VARCHAR(36) NULL,
  `updated_by` VARCHAR(36) NULL,

  UNIQUE INDEX `siformen_bup_jabatan_id_tahun_key`(`jabatan_id`, `tahun`),
  INDEX `siformen_bup_tahun_idx`(`tahun`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `siformen_bup`
  ADD CONSTRAINT `siformen_bup_jabatan_id_fkey`
  FOREIGN KEY (`jabatan_id`) REFERENCES `siformen_jabatan`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
