UPDATE `asn`
SET `eselon_nama` = CASE
  WHEN UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'SEKRETARIS DAERAH%' THEN 'II.a'
  WHEN UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'KEPALA DINAS%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'KEPALA BADAN%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'KEPALA SATUAN%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'INSPEKTUR%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'SEKRETARIS DPRD%' THEN 'II.b'
  WHEN UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'ASISTEN%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'STAF AHLI%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'SEKRETARIS DINAS%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'SEKRETARIS BADAN%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'SEKRETARIS INSPEKTORAT%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'KEPALA BAGIAN%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'CAMAT%' THEN 'III.a'
  WHEN UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'KEPALA BIDANG%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'INSPEKTUR PEMBANTU%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'SEKRETARIS CAMAT%' THEN 'III.b'
  WHEN UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'KEPALA SUB BAGIAN%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'KEPALA SUBBAGIAN%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'KEPALA SUB BIDANG%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'KEPALA SUBBIDANG%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'KEPALA SEKSI%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'LURAH%'
    OR UPPER(COALESCE(`jabatan_nama`, '')) LIKE 'SEKRETARIS LURAH%' THEN 'IV.a'
  ELSE `eselon_nama`
END
WHERE `deleted_at` IS NULL
  AND (`eselon_nama` IS NULL OR `eselon_nama` = '')
  AND UPPER(COALESCE(`jenis_jabatan_nama`, '')) LIKE '%STRUKTURAL%';
