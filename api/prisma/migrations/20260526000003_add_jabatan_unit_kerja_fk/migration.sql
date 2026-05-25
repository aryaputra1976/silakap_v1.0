ALTER TABLE `siformen_jabatan`
  ADD COLUMN `unit_kerja_id` VARCHAR(36) NULL;

CREATE INDEX `siformen_jabatan_unit_kerja_id_idx` ON `siformen_jabatan`(`unit_kerja_id`);

ALTER TABLE `siformen_jabatan`
  ADD CONSTRAINT `siformen_jabatan_unit_kerja_id_fkey`
  FOREIGN KEY (`unit_kerja_id`) REFERENCES `unit_kerja`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
