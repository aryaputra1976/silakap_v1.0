-- SIFORMEN: Sistem Informasi Formasi dan Bezetting ASN

-- 1. Referensi Jabatan Fungsional (parent, no FK)
CREATE TABLE `siformen_jabatan_fungsional_ref` (
  `id`                      VARCHAR(36)  NOT NULL,
  `nama_jabatan`            VARCHAR(200) NOT NULL,
  `jenjang`                 VARCHAR(30)  NOT NULL,
  `kategori`                VARCHAR(20)  NOT NULL,
  `jenjang_awal`            VARCHAR(30)  NULL,
  `jenjang_puncak`          VARCHAR(30)  NULL,
  `golongan_ruang_awal`     VARCHAR(10)  NULL,
  `rumpun_jabatan`          VARCHAR(150) NULL,
  `ruang_lingkup`           VARCHAR(100) NULL,
  `kedudukan`               TEXT         NULL,
  `pengisian_asn`           VARCHAR(50)  NULL,
  `instansi_pembina`        VARCHAR(200) NULL,
  `dasar_hukum`             VARCHAR(200) NULL,
  `tugas_jabatan`           TEXT         NULL,
  `pendidikan_pengangkatan` TEXT         NULL,
  `pendidikan_perpindahan`  TEXT         NULL,
  `perpres_tunjangan`       VARCHAR(200) NULL,
  `besaran_tunjangan`       VARCHAR(100) NULL,
  `created_at`              DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`              DATETIME(3)  NOT NULL,

  INDEX `siformen_jabatan_fungsional_ref_nama_jabatan_idx`(`nama_jabatan`),
  INDEX `siformen_jabatan_fungsional_ref_kategori_idx`(`kategori`),
  INDEX `siformen_jabatan_fungsional_ref_rumpun_jabatan_idx`(`rumpun_jabatan`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Master Jabatan (FK ke fungsional ref, soft delete)
CREATE TABLE `siformen_jabatan` (
  `id`                      VARCHAR(36)  NOT NULL,
  `kode_jabatan`            VARCHAR(40)  NOT NULL,
  `nama_jabatan`            VARCHAR(200) NOT NULL,
  `jenis_jabatan`           VARCHAR(40)  NOT NULL,
  `eselon_level`            VARCHAR(10)  NULL,
  `kelas_jabatan`           INT          NULL,
  `unit_kerja`              VARCHAR(200) NOT NULL,
  `satuan_kerja`            VARCHAR(200) NULL,
  `kualifikasi_pendidikan`  TEXT         NULL,
  `is_active`               TINYINT(1)   NOT NULL DEFAULT 1,
  `jabatan_fungsional_ref_id` VARCHAR(36) NULL,
  `created_at`              DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by`              VARCHAR(36)  NULL,
  `updated_at`              DATETIME(3)  NOT NULL,
  `updated_by`              VARCHAR(36)  NULL,
  `deleted_at`              DATETIME(3)  NULL,

  UNIQUE INDEX `siformen_jabatan_kode_jabatan_key`(`kode_jabatan`),
  INDEX `siformen_jabatan_jenis_jabatan_idx`(`jenis_jabatan`),
  INDEX `siformen_jabatan_unit_kerja_idx`(`unit_kerja`),
  INDEX `siformen_jabatan_jabatan_fungsional_ref_id_idx`(`jabatan_fungsional_ref_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `siformen_jabatan_jabatan_fungsional_ref_id_fkey`
    FOREIGN KEY (`jabatan_fungsional_ref_id`)
    REFERENCES `siformen_jabatan_fungsional_ref`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bezetting (pengisian jabatan per tahun)
CREATE TABLE `siformen_bezetting` (
  `id`          VARCHAR(36)  NOT NULL,
  `jabatan_id`  VARCHAR(36)  NULL,
  `nama_jabatan` VARCHAR(200) NOT NULL,
  `unit_kerja`  VARCHAR(200) NOT NULL,
  `tahun`       INT          NOT NULL,
  `nip`         VARCHAR(20)  NULL,
  `nama_asn`    VARCHAR(200) NULL,
  `pangkat`     VARCHAR(100) NULL,
  `golongan`    VARCHAR(20)  NULL,
  `tmt_jabatan` DATETIME(3)  NULL,
  `status_isi`  VARCHAR(20)  NOT NULL DEFAULT 'VACANT',
  `keterangan`  TEXT         NULL,
  `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by`  VARCHAR(36)  NULL,
  `updated_at`  DATETIME(3)  NOT NULL,
  `updated_by`  VARCHAR(36)  NULL,
  `deleted_at`  DATETIME(3)  NULL,

  INDEX `siformen_bezetting_tahun_idx`(`tahun`),
  INDEX `siformen_bezetting_unit_kerja_idx`(`unit_kerja`),
  INDEX `siformen_bezetting_status_isi_idx`(`status_isi`),
  INDEX `siformen_bezetting_jabatan_id_idx`(`jabatan_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `siformen_bezetting_jabatan_id_fkey`
    FOREIGN KEY (`jabatan_id`)
    REFERENCES `siformen_jabatan`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Formasi (usulan formasi dengan workflow)
CREATE TABLE `siformen_formasi` (
  `id`                     VARCHAR(36)  NOT NULL,
  `jabatan_id`             VARCHAR(36)  NULL,
  `nama_jabatan`           VARCHAR(200) NOT NULL,
  `unit_kerja`             VARCHAR(200) NOT NULL,
  `jenis_formasi`          VARCHAR(20)  NOT NULL,
  `tahun`                  INT          NOT NULL,
  `periode`                VARCHAR(20)  NULL,
  `jumlah_kebutuhan`       INT          NOT NULL DEFAULT 0,
  `jumlah_tersedia`        INT          NOT NULL DEFAULT 0,
  `jumlah_usulan`          INT          NOT NULL DEFAULT 0,
  `kualifikasi_pendidikan` VARCHAR(200) NULL,
  `kualifikasi_jurusan`    VARCHAR(200) NULL,
  `alasan_kebutuhan`       TEXT         NULL,
  `status`                 VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
  `catatan_verifikasi`     TEXT         NULL,
  `approved_by_id`         VARCHAR(36)  NULL,
  `approved_at`            DATETIME(3)  NULL,
  `submitted_at`           DATETIME(3)  NULL,
  `created_at`             DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by`             VARCHAR(36)  NULL,
  `updated_at`             DATETIME(3)  NOT NULL,
  `updated_by`             VARCHAR(36)  NULL,
  `deleted_at`             DATETIME(3)  NULL,

  INDEX `siformen_formasi_tahun_idx`(`tahun`),
  INDEX `siformen_formasi_jenis_formasi_idx`(`jenis_formasi`),
  INDEX `siformen_formasi_status_idx`(`status`),
  INDEX `siformen_formasi_jabatan_id_idx`(`jabatan_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `siformen_formasi_jabatan_id_fkey`
    FOREIGN KEY (`jabatan_id`)
    REFERENCES `siformen_jabatan`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ABK — Analisis Beban Kerja
CREATE TABLE `siformen_abk` (
  `id`                VARCHAR(36)   NOT NULL,
  `jabatan_id`        VARCHAR(36)   NULL,
  `nama_jabatan`      VARCHAR(200)  NOT NULL,
  `unit_kerja`        VARCHAR(200)  NOT NULL,
  `tahun`             INT           NOT NULL,
  `uraian_tugas`      TEXT          NULL,
  `volume_kerja`      DOUBLE        NOT NULL,
  `norma_waktu`       DOUBLE        NOT NULL,
  `beban_kerja`       DOUBLE        NOT NULL,
  `waktu_efektif`     DOUBLE        NOT NULL DEFAULT 1250,
  `kebutuhan_pegawai` DOUBLE        NOT NULL,
  `pegawai_ada`       INT           NOT NULL DEFAULT 0,
  `selisih`           DOUBLE        NOT NULL DEFAULT 0,
  `keterangan`        TEXT          NULL,
  `created_at`        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by`        VARCHAR(36)   NULL,
  `updated_at`        DATETIME(3)   NOT NULL,
  `updated_by`        VARCHAR(36)   NULL,

  INDEX `siformen_abk_tahun_idx`(`tahun`),
  INDEX `siformen_abk_unit_kerja_idx`(`unit_kerja`),
  INDEX `siformen_abk_jabatan_id_idx`(`jabatan_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `siformen_abk_jabatan_id_fkey`
    FOREIGN KEY (`jabatan_id`)
    REFERENCES `siformen_jabatan`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
