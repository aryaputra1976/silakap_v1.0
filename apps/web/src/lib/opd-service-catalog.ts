export type PpikServiceOption = {
  value: string;
  label: string;
};

export type PpikServiceOptionGroup = {
  group: string;
  items: PpikServiceOption[];
};

export const PPIK_SERVICE_OPTIONS: PpikServiceOptionGroup[] = [
  {
    group: 'Peremajaan Data ASN',
    items: [
      { value: 'PEREMAJAAN_NIK', label: 'Perubahan NIK' },
      { value: 'PEREMAJAAN_NAMA', label: 'Perubahan Nama' },
      {
        value: 'PEREMAJAAN_TANGGAL_LAHIR',
        label: 'Perubahan Tanggal Lahir',
      },
      {
        value: 'PEREMAJAAN_KELUARGA_TAMBAH_ANAK',
        label: 'Tambah Anak',
      },
      {
        value: 'PEREMAJAAN_KELUARGA_MENIKAH',
        label: 'Perubahan Status Menikah',
      },
      {
        value: 'PEREMAJAAN_KELUARGA_CERAI',
        label: 'Perubahan Status Cerai',
      },
      {
        value: 'PEREMAJAAN_KONTAK_ALAMAT_EMAIL',
        label: 'Perubahan Kontak, Alamat, Email',
      },
      { value: 'PEREMAJAAN_GOLONGAN', label: 'Perubahan Golongan' },
      { value: 'PEREMAJAAN_PENDIDIKAN', label: 'Perubahan Pendidikan' },
    ],
  },
  {
    group: 'Pemberhentian/Pensiun ASN',
    items: [
      { value: 'PEMBERHENTIAN_BUP', label: 'Pemberhentian/Pensiun BUP' },
      {
        value: 'PEMBERHENTIAN_APS',
        label: 'Pemberhentian Atas Permintaan Sendiri',
      },
      {
        value: 'PEMBERHENTIAN_MENINGGAL',
        label: 'Pemberhentian Karena Meninggal Dunia',
      },
      {
        value: 'PEMBERHENTIAN_TIDAK_CAKAP',
        label: 'Pemberhentian Karena Tidak Cakap Jasmani/Rohani',
      },
      {
        value: 'PEMBERHENTIAN_PIDANA_DISIPLIN',
        label: 'Pemberhentian Karena Pidana/Disiplin',
      },
      {
        value: 'PEMBERHENTIAN_HILANG_TEWAS',
        label: 'Pemberhentian Karena Hilang/Tewas',
      },
      {
        value: 'PENSIUN_JANDA_DUDA_AHLI_WARIS',
        label: 'Pensiun Janda/Duda/Ahli Waris',
      },
    ],
  },
];

export const PPIK_SERVICE_OPTIONS_FLAT: PpikServiceOption[] =
  PPIK_SERVICE_OPTIONS.flatMap((group) => group.items);

export function getPpikServiceLabel(value: string): string {
  return (
    PPIK_SERVICE_OPTIONS_FLAT.find((item) => item.value === value)?.label ??
    value
  );
}