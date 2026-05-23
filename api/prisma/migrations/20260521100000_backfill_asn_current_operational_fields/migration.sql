UPDATE `asn` a
LEFT JOIN `ref_jabatan` rj
  ON rj.`id` = a.`jabatan_ref_id`
LEFT JOIN `asn_siasn_profile` sp
  ON sp.`asn_id` = a.`id`
 AND sp.`deleted_at` IS NULL
LEFT JOIN `asn_golongan_history` gh
  ON gh.`id` = (
    SELECT gh2.`id`
    FROM `asn_golongan_history` gh2
    WHERE gh2.`asn_id` = a.`id`
      AND gh2.`deleted_at` IS NULL
    ORDER BY gh2.`effective_date` DESC, gh2.`synced_at` DESC, gh2.`created_at` DESC
    LIMIT 1
  )
LEFT JOIN `asn_pendidikan_history` ph
  ON ph.`id` = (
    SELECT ph2.`id`
    FROM `asn_pendidikan_history` ph2
    WHERE ph2.`asn_id` = a.`id`
      AND ph2.`deleted_at` IS NULL
    ORDER BY ph2.`effective_date` DESC, ph2.`synced_at` DESC, ph2.`created_at` DESC
    LIMIT 1
  )
SET
  a.`masa_kerja_tahun` = COALESCE(
    a.`masa_kerja_tahun`,
    CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.mk_tahun_seluruh')), '') AS SIGNED),
    CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.masa_kerja_tahun')), '') AS SIGNED),
    CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."masa kerja tahun"')), '') AS SIGNED),
    gh.`mk_tahun`
  ),
  a.`masa_kerja_bulan` = COALESCE(
    a.`masa_kerja_bulan`,
    CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.mk_bulan_seluruh')), '') AS SIGNED),
    CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.masa_kerja_bulan')), '') AS SIGNED),
    CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."masa kerja bulan"')), '') AS SIGNED),
    gh.`mk_bulan`
  ),
  a.`masa_kerja_total_bulan` = COALESCE(
    a.`masa_kerja_total_bulan`,
    CASE
      WHEN COALESCE(
        CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.mk_tahun_seluruh')), '') AS SIGNED),
        CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.masa_kerja_tahun')), '') AS SIGNED),
        CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."masa kerja tahun"')), '') AS SIGNED),
        gh.`mk_tahun`,
        CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.mk_bulan_seluruh')), '') AS SIGNED),
        CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.masa_kerja_bulan')), '') AS SIGNED),
        CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."masa kerja bulan"')), '') AS SIGNED),
        gh.`mk_bulan`
      ) IS NULL THEN NULL
      ELSE
        COALESCE(
          CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.mk_tahun_seluruh')), '') AS SIGNED),
          CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.masa_kerja_tahun')), '') AS SIGNED),
          CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."masa kerja tahun"')), '') AS SIGNED),
          gh.`mk_tahun`,
          0
        ) * 12
        + COALESCE(
          CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.mk_bulan_seluruh')), '') AS SIGNED),
          CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.masa_kerja_bulan')), '') AS SIGNED),
          CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."masa kerja bulan"')), '') AS SIGNED),
          gh.`mk_bulan`,
          0
        )
    END
  ),
  a.`kelas_jabatan` = COALESCE(
    a.`kelas_jabatan`,
    rj.`kelas_jabatan`,
    CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.kelas_jabatan')), '') AS SIGNED),
    CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."kelas jabatan"')), '') AS SIGNED)
  ),
  a.`siasn_eselon_id` = COALESCE(
    NULLIF(a.`siasn_eselon_id`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.eselon_id')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."eselon id"')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.id_eselon')), '')
  ),
  a.`eselon_nama` = COALESCE(
    NULLIF(a.`eselon_nama`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.eselon_nama')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."eselon nama"')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.eselon')), '')
  ),
  a.`jenis_pegawai_nama` = COALESCE(
    NULLIF(a.`jenis_pegawai_nama`, ''),
    NULLIF(a.`jenis_asn_nama`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.jenis_pegawai_nama')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.jenis_asn_nama')), '')
  ),
  a.`detail_status_nama` = COALESCE(
    NULLIF(a.`detail_status_nama`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.detail_status_nama')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."detail status nama"')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.status_detail')), ''),
    NULLIF(a.`status_asn`, '')
  ),
  a.`pendidikan_ref_id` = COALESCE(a.`pendidikan_ref_id`, ph.`pendidikan_ref_id`),
  a.`pendidikan_nama` = COALESCE(
    NULLIF(a.`pendidikan_nama`, ''),
    NULLIF(ph.`pendidikan_nama`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.pendidikan_nama')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.pendidikan_terakhir')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.pendidikan')), '')
  ),
  a.`tingkat_pendidikan_ref_id` = COALESCE(a.`tingkat_pendidikan_ref_id`, ph.`tingkat_pendidikan_ref_id`),
  a.`tingkat_pendidikan_nama` = COALESCE(
    NULLIF(a.`tingkat_pendidikan_nama`, ''),
    NULLIF(ph.`tingkat_pendidikan_nama`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.tingkat_pendidikan_nama')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.tingkat_pendidikan')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."tingkat pendidikan"')), '')
  ),
  a.`tahun_lulus` = COALESCE(
    a.`tahun_lulus`,
    ph.`tahun_lulus`,
    CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.tahun_lulus')), '') AS SIGNED),
    CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."tahun lulus"')), '') AS SIGNED)
  ),
  a.`nama_sekolah` = COALESCE(
    NULLIF(a.`nama_sekolah`, ''),
    NULLIF(ph.`nama_sekolah`, ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$.nama_sekolah')), ''),
    NULLIF(JSON_UNQUOTE(JSON_EXTRACT(sp.`raw_data`, '$."nama sekolah"')), '')
  )
WHERE a.`deleted_at` IS NULL;
