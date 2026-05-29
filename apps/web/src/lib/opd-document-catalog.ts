export type OpdDocumentOption = {
  value: string;
  label: string;
};

export const OPD_REQUIRED_DOCUMENT_OPTIONS: Record<string, OpdDocumentOption[]> =
  {
    PEREMAJAAN_NIK: [{ value: 'KTP', label: 'KTP' }],

    PEREMAJAAN_NAMA: [{ value: 'AKTA_LAHIR', label: 'Akta Lahir' }],

    PEREMAJAAN_TANGGAL_LAHIR: [
      { value: 'AKTA_LAHIR', label: 'Akta Lahir' },
    ],

    PEREMAJAAN_KELUARGA_TAMBAH_ANAK: [
      { value: 'AKTA_KELAHIRAN_ANAK', label: 'Akta Kelahiran Anak' },
      { value: 'KARTU_KELUARGA', label: 'Kartu Keluarga' },
    ],

    PEREMAJAAN_KELUARGA_MENIKAH: [
      {
        value: 'BUKU_NIKAH_ATAU_AKTA_NIKAH',
        label: 'Buku Nikah/Akta Nikah',
      },
      { value: 'KARTU_KELUARGA', label: 'Kartu Keluarga' },
    ],

    PEREMAJAAN_KELUARGA_CERAI: [
      {
        value: 'AKTA_CERAI_ATAU_PUTUSAN_PENGADILAN',
        label: 'Akta Cerai/Putusan Pengadilan',
      },
      { value: 'KARTU_KELUARGA', label: 'Kartu Keluarga' },
    ],

    PEREMAJAAN_KONTAK_ALAMAT_EMAIL: [
      {
        value: 'FORMULIR_PERUBAHAN_DATA',
        label: 'Formulir Perubahan Data',
      },
    ],

    PEREMAJAAN_GOLONGAN: [
      {
        value: 'SK_PANGKAT_ATAU_SK_GOLONGAN',
        label: 'SK Pangkat/SK Golongan',
      },
    ],

    PEREMAJAAN_PENDIDIKAN: [
      { value: 'IJAZAH', label: 'Ijazah' },
      { value: 'TRANSKRIP_NILAI', label: 'Transkrip Nilai' },
    ],

    PEMBERHENTIAN_BUP: [
      { value: 'USULAN_OPD', label: 'Usulan OPD' },
      { value: 'DATA_ASN', label: 'Data ASN' },
      { value: 'SK_PANGKAT_TERAKHIR', label: 'SK Pangkat Terakhir' },
    ],

    PEMBERHENTIAN_APS: [
      { value: 'SURAT_PERMOHONAN', label: 'Surat Permohonan' },
      { value: 'REKOMENDASI_OPD', label: 'Rekomendasi OPD' },
      { value: 'DOKUMEN_KEPEGAWAIAN', label: 'Dokumen Kepegawaian' },
    ],

    PEMBERHENTIAN_MENINGGAL: [
      {
        value: 'AKTA_KEMATIAN_ATAU_SURAT_KETERANGAN_KEMATIAN',
        label: 'Akta Kematian/Surat Keterangan Kematian',
      },
      { value: 'DOKUMEN_AHLI_WARIS', label: 'Dokumen Ahli Waris' },
    ],

    PEMBERHENTIAN_TIDAK_CAKAP: [
      {
        value: 'SURAT_KETERANGAN_MEDIS_ATAU_PENETAPAN_RESMI',
        label: 'Surat Keterangan Medis/Penetapan Resmi',
      },
      { value: 'REKOMENDASI_OPD', label: 'Rekomendasi OPD' },
    ],

    PEMBERHENTIAN_PIDANA_DISIPLIN: [
      {
        value: 'PUTUSAN_PENGADILAN_ATAU_KEPUTUSAN_DISIPLIN',
        label: 'Putusan Pengadilan/Keputusan Disiplin',
      },
      { value: 'TELAAHAN', label: 'Telaahan' },
    ],

    PEMBERHENTIAN_HILANG_TEWAS: [
      {
        value: 'DOKUMEN_PENETAPAN_ATAU_KETERANGAN_RESMI',
        label: 'Dokumen Penetapan/Keterangan Resmi',
      },
    ],

    PENSIUN_JANDA_DUDA_AHLI_WARIS: [
      { value: 'DOKUMEN_AHLI_WARIS', label: 'Dokumen Ahli Waris' },
      { value: 'DOKUMEN_KEPEGAWAIAN', label: 'Dokumen Kepegawaian' },
      {
        value: 'DOKUMEN_PENDUKUNG_PENSIUN',
        label: 'Dokumen Pendukung Pensiun',
      },
    ],
  };

export function getRequiredDocumentOptions(
  serviceType: string | undefined | null,
): OpdDocumentOption[] {
  if (!serviceType) {
    return [];
  }

  return OPD_REQUIRED_DOCUMENT_OPTIONS[serviceType] ?? [];
}