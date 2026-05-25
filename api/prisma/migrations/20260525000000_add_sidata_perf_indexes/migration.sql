-- Composite index for ASN list main filter: deleted_at + unit_kerja_id
-- Covers the most common query pattern: WHERE deleted_at IS NULL AND unit_kerja_id IN (...)
CREATE INDEX `asn_deleted_at_unit_kerja_id_idx` ON `asn`(`deleted_at`, `unit_kerja_id`);

-- Composite index for ASN list secondary filter: deleted_at + tipe_pegawai
CREATE INDEX `asn_deleted_at_tipe_pegawai_idx` ON `asn`(`deleted_at`, `tipe_pegawai`);

-- Composite index for golongan history include queries (per ASN on page load)
-- Covers: WHERE asn_id = ? AND deleted_at IS NULL ORDER BY effective_date DESC
CREATE INDEX `asn_golongan_history_asn_id_deleted_at_idx` ON `asn_golongan_history`(`asn_id`, `deleted_at`);

-- Composite index for pendidikan history include queries
CREATE INDEX `asn_pendidikan_history_asn_id_deleted_at_idx` ON `asn_pendidikan_history`(`asn_id`, `deleted_at`);

-- Composite index for siasn profile join on sort query
CREATE INDEX `asn_siasn_profile_asn_id_deleted_at_idx` ON `asn_siasn_profile`(`asn_id`, `deleted_at`);
