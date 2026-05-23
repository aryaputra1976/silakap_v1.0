UPDATE `asn` a
LEFT JOIN `asn_siasn_profile` sp
  ON sp.`asn_id` = a.`id`
 AND sp.`deleted_at` IS NULL
SET
  a.`masa_kerja_tahun` = COALESCE(
    a.`masa_kerja_tahun`,
    CAST(NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."MK TAHUN"')), 'null'), '') AS SIGNED)
  ),
  a.`masa_kerja_bulan` = COALESCE(
    a.`masa_kerja_bulan`,
    CAST(NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."MK BULAN"')), 'null'), '') AS SIGNED)
  ),
  a.`masa_kerja_total_bulan` = COALESCE(
    a.`masa_kerja_total_bulan`,
    CASE
      WHEN JSON_EXTRACT(sp.`raw_data`, '$."MK TAHUN"') IS NULL
       AND JSON_EXTRACT(sp.`raw_data`, '$."MK BULAN"') IS NULL THEN NULL
      ELSE
        COALESCE(CAST(NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."MK TAHUN"')), 'null'), '') AS SIGNED), 0) * 12
        + COALESCE(CAST(NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."MK BULAN"')), 'null'), '') AS SIGNED), 0)
    END
  ),
  a.`siasn_eselon_id` = COALESCE(
    NULLIF(a.`siasn_eselon_id`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."ESELON ID"')), '')
  ),
  a.`eselon_nama` = COALESCE(
    NULLIF(a.`eselon_nama`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."ESELON NAMA"')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."ESELON"')), '')
  ),
  a.`jenis_pegawai_nama` = COALESCE(
    NULLIF(a.`jenis_pegawai_nama`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."JENIS PEGAWAI NAMA"')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."JENIS ASN NAMA"')), ''),
    NULLIF(a.`jenis_asn_nama`, '')
  ),
  a.`detail_status_nama` = COALESCE(
    NULLIF(a.`detail_status_nama`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."DETAIL STATUS NAMA"')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."STATUS DETAIL"')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."STATUS CPNS PNS"')), ''),
    NULLIF(a.`status_asn`, '')
  ),
  a.`pendidikan_nama` = COALESCE(
    NULLIF(a.`pendidikan_nama`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."PENDIDIKAN NAMA"')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."PENDIDIKAN TERAKHIR"')), '')
  ),
  a.`tingkat_pendidikan_nama` = COALESCE(
    NULLIF(a.`tingkat_pendidikan_nama`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."TINGKAT PENDIDIKAN NAMA"')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."TINGKAT PENDIDIKAN"')), '')
  ),
  a.`tahun_lulus` = COALESCE(
    a.`tahun_lulus`,
    CAST(NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."TAHUN LULUS"')), 'null'), '') AS SIGNED)
  ),
  a.`nama_sekolah` = COALESCE(
    NULLIF(a.`nama_sekolah`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."NAMA SEKOLAH"')), '')
  )
WHERE a.`deleted_at` IS NULL;
