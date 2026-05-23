-- ─── sidata_asn_import_staging: add masa kerja, contact, tahun lulus, unor nama ─
ALTER TABLE `sidata_asn_import_staging`
  ADD COLUMN `masa_kerja_tahun`  INTEGER      NULL AFTER `masa_kerja_seluruh`,
  ADD COLUMN `masa_kerja_bulan`  INTEGER      NULL AFTER `masa_kerja_tahun`,
  ADD COLUMN `nomor_hp`          VARCHAR(30)  NULL AFTER `masa_kerja_bulan`,
  ADD COLUMN `email`             VARCHAR(150) NULL AFTER `nomor_hp`,
  ADD COLUMN `email_gov`         VARCHAR(150) NULL AFTER `email`,
  ADD COLUMN `alamat`            TEXT         NULL AFTER `email_gov`,
  ADD COLUMN `npwp_nomor`        VARCHAR(50)  NULL AFTER `alamat`,
  ADD COLUMN `bpjs_nomor`        VARCHAR(50)  NULL AFTER `npwp_nomor`,
  ADD COLUMN `tahun_lulus`       INTEGER      NULL AFTER `bpjs_nomor`,
  ADD COLUMN `unor_nama`         VARCHAR(300) NULL AFTER `tahun_lulus`;
