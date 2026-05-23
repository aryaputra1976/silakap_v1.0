ALTER TABLE `asn`
  ADD COLUMN `masa_kerja_tahun` INTEGER NULL,
  ADD COLUMN `masa_kerja_bulan` INTEGER NULL,
  ADD COLUMN `masa_kerja_total_bulan` INTEGER NULL,
  ADD COLUMN `kelas_jabatan` INTEGER NULL,
  ADD COLUMN `siasn_eselon_id` VARCHAR(30) NULL,
  ADD COLUMN `eselon_nama` VARCHAR(80) NULL,
  ADD COLUMN `jenis_pegawai_nama` VARCHAR(180) NULL,
  ADD COLUMN `detail_status_nama` VARCHAR(180) NULL,
  ADD COLUMN `pendidikan_ref_id` VARCHAR(36) NULL,
  ADD COLUMN `pendidikan_nama` VARCHAR(180) NULL,
  ADD COLUMN `tingkat_pendidikan_ref_id` VARCHAR(36) NULL,
  ADD COLUMN `tingkat_pendidikan_nama` VARCHAR(120) NULL,
  ADD COLUMN `tahun_lulus` INTEGER NULL,
  ADD COLUMN `nama_sekolah` VARCHAR(300) NULL;

CREATE INDEX `asn_kelas_jabatan_idx` ON `asn`(`kelas_jabatan`);
CREATE INDEX `asn_siasn_eselon_id_idx` ON `asn`(`siasn_eselon_id`);
CREATE INDEX `asn_pendidikan_ref_id_idx` ON `asn`(`pendidikan_ref_id`);
CREATE INDEX `asn_tingkat_pendidikan_ref_id_idx` ON `asn`(`tingkat_pendidikan_ref_id`);
CREATE INDEX `asn_masa_kerja_total_bulan_idx` ON `asn`(`masa_kerja_total_bulan`);

ALTER TABLE `asn`
  ADD CONSTRAINT `asn_pendidikan_ref_id_fkey`
    FOREIGN KEY (`pendidikan_ref_id`) REFERENCES `ref_pendidikan`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `asn_tingkat_pendidikan_ref_id_fkey`
    FOREIGN KEY (`tingkat_pendidikan_ref_id`) REFERENCES `ref_pendidikan_tingkat`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
