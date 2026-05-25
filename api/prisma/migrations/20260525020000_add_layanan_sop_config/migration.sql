CREATE TABLE `layanan_sop_config` (
  `id`          VARCHAR(36)  NOT NULL,
  `sop_key`     VARCHAR(20)  NOT NULL,
  `code`        VARCHAR(60)  NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `short_label` VARCHAR(100) NOT NULL,
  `description` TEXT         NOT NULL,
  `rhk_codes`   JSON         NOT NULL,
  `sort_order`  INT          NOT NULL DEFAULT 0,
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
  `updated_at`  DATETIME(3)  NOT NULL,

  UNIQUE INDEX `layanan_sop_config_sop_key_key`(`sop_key`),
  UNIQUE INDEX `layanan_sop_config_code_key`(`code`),
  INDEX `layanan_sop_config_is_active_idx`(`is_active`),
  INDEX `layanan_sop_config_sort_order_idx`(`sort_order`),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed awal: 5 SOP Layanan Kepegawaian
INSERT INTO `layanan_sop_config` (`id`, `sop_key`, `code`, `title`, `short_label`, `description`, `rhk_codes`, `sort_order`, `is_active`, `updated_at`) VALUES
  (UUID(), 'LAY-001', 'SOP-BKPSDM-LAY-001', 'Penerimaan Permohonan Layanan Kepegawaian',   'Permohonan Masuk',  'Mengatur penerimaan permohonan layanan kepegawaian dari OPD/ASN.',                        '["RHK 1","RHK 3","RHK 4","RHK 8"]', 1, 1, NOW()),
  (UUID(), 'LAY-002', 'SOP-BKPSDM-LAY-002', 'Verifikasi Kelengkapan Berkas Layanan',        'Verifikasi Berkas', 'Mengatur pemeriksaan kelengkapan dan kesesuaian berkas layanan.',                         '["RHK 1","RHK 3"]',                 2, 1, NOW()),
  (UUID(), 'LAY-003', 'SOP-BKPSDM-LAY-003', 'Monitoring SLA Layanan Kepegawaian',           'Monitoring SLA',    'Mengatur pemantauan ketepatan waktu layanan dan pelaporan SLA.',                          '["RHK 8"]',                         3, 1, NOW()),
  (UUID(), 'LAY-004', 'SOP-BKPSDM-LAY-004', 'Penanganan Keterlambatan Layanan',             'Keterlambatan',     'Mengatur tindak lanjut atas layanan yang melewati batas waktu.',                          '["RHK 8"]',                         4, 1, NOW()),
  (UUID(), 'LAY-005', 'SOP-BKPSDM-LAY-005', 'Evaluasi Kepuasan Layanan',                   'Kepuasan Layanan',  'Mengatur evaluasi kepuasan pengguna layanan dan rekomendasi perbaikan.',                   '["RHK 8"]',                         5, 1, NOW());
