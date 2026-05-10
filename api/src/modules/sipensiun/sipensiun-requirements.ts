export type SipensiunRequirementCategory =
  | 'KEPEGAWAIAN'
  | 'KELUARGA'
  | 'PERNYATAAN'
  | 'KEMATIAN'
  | 'FOTO'
  | 'FISIK'
  | 'LAINNYA';

export type SipensiunRequirementItem = {
  documentType: string;
  label: string;
  category: SipensiunRequirementCategory;
  required: boolean;
  digital: boolean;
  notes?: string;
};

export const SIPENSIUN_REQUIREMENTS = {
  BUP: [
    requirement('DPCP', 'Data Perorangan Calon Penerima Pensiun', 'KEPEGAWAIAN'),
    requirement('SK_CPNS', 'SK CPNS', 'KEPEGAWAIAN'),
    requirement('SK_PNS', 'SK PNS', 'KEPEGAWAIAN'),
    requirement('SK_PANGKAT_TERAKHIR', 'SK pangkat terakhir', 'KEPEGAWAIAN'),
    requirement('SKP_TERAKHIR', 'SKP terakhir', 'KEPEGAWAIAN'),
    requirement('DAFTAR_RIWAYAT_HIDUP', 'Daftar riwayat hidup', 'KEPEGAWAIAN'),
    requirement('DAFTAR_SUSUNAN_KELUARGA', 'Daftar susunan keluarga', 'KELUARGA'),
    requirement('KARTU_KELUARGA', 'Kartu keluarga', 'KELUARGA'),
    requirement('AKTA_NIKAH_CERAI_KEMATIAN', 'Akta nikah/cerai/kematian pasangan', 'KELUARGA'),
    requirement('PAS_FOTO', 'Pas foto terbaru', 'FOTO'),
    requirement('SURAT_TIDAK_HUKDIS', 'Surat keterangan tidak sedang hukuman disiplin', 'PERNYATAAN'),
    requirement('SURAT_TIDAK_PIDANA', 'Surat keterangan tidak sedang proses pidana', 'PERNYATAAN'),
  ],
  APS: [
    requirement('SURAT_PERMOHONAN_APS', 'Surat permohonan pensiun atas permintaan sendiri', 'PERNYATAAN'),
    requirement('DPCP', 'Data Perorangan Calon Penerima Pensiun', 'KEPEGAWAIAN'),
    requirement('SK_CPNS', 'SK CPNS', 'KEPEGAWAIAN'),
    requirement('SK_PNS', 'SK PNS', 'KEPEGAWAIAN'),
    requirement('SK_PANGKAT_TERAKHIR', 'SK pangkat terakhir', 'KEPEGAWAIAN'),
    requirement('SKP_TERAKHIR', 'SKP terakhir', 'KEPEGAWAIAN'),
    requirement('KARTU_KELUARGA', 'Kartu keluarga', 'KELUARGA'),
    requirement('PAS_FOTO', 'Pas foto terbaru', 'FOTO'),
    requirement('MAP_SNELHEKTER', 'Map/snelhecter berkas fisik', 'FISIK', true, false),
  ],
  JDU: [
    requirement('AKTA_KEMATIAN', 'Akta kematian PNS/pensiunan', 'KEMATIAN'),
    requirement('SURAT_KETERANGAN_JANDA_DUDA', 'Surat keterangan janda/duda', 'KEMATIAN'),
    requirement('AKTA_NIKAH_CERAI_KEMATIAN', 'Akta nikah/cerai/kematian pasangan', 'KELUARGA'),
    requirement('DAFTAR_SUSUNAN_KELUARGA', 'Daftar susunan keluarga', 'KELUARGA'),
    requirement('KARTU_KELUARGA', 'Kartu keluarga', 'KELUARGA'),
    requirement('SK_PANGKAT_TERAKHIR', 'SK pangkat terakhir', 'KEPEGAWAIAN'),
    requirement('PAS_FOTO', 'Pas foto janda/duda', 'FOTO'),
  ],
  YATIM_PIATU: [
    requirement('AKTA_KEMATIAN', 'Akta kematian PNS/pensiunan dan pasangan', 'KEMATIAN'),
    requirement('AKTA_KELAHIRAN_ANAK', 'Akta kelahiran anak', 'KELUARGA'),
    requirement('KARTU_KELUARGA', 'Kartu keluarga', 'KELUARGA'),
    requirement('SURAT_KETERANGAN_JANDA_DUDA', 'Surat keterangan ahli waris/yatim piatu', 'KEMATIAN'),
    requirement('SK_PANGKAT_TERAKHIR', 'SK pangkat terakhir', 'KEPEGAWAIAN'),
    requirement('PAS_FOTO', 'Pas foto penerima manfaat', 'FOTO'),
  ],
  TWS: [
    requirement('SURAT_KETERANGAN_TEWAS', 'Surat keterangan tewas', 'KEMATIAN'),
    requirement('DPCP', 'Data Perorangan Calon Penerima Pensiun', 'KEPEGAWAIAN'),
    requirement('SK_CPNS', 'SK CPNS', 'KEPEGAWAIAN'),
    requirement('SK_PNS', 'SK PNS', 'KEPEGAWAIAN'),
    requirement('SK_PANGKAT_TERAKHIR', 'SK pangkat terakhir', 'KEPEGAWAIAN'),
    requirement('KARTU_KELUARGA', 'Kartu keluarga', 'KELUARGA'),
    requirement('PAS_FOTO', 'Pas foto terbaru', 'FOTO'),
  ],
  SAK: [
    requirement('SURAT_KETERANGAN_DOKTER', 'Surat keterangan dokter/tim penguji kesehatan', 'LAINNYA'),
    requirement('DPCP', 'Data Perorangan Calon Penerima Pensiun', 'KEPEGAWAIAN'),
    requirement('SK_CPNS', 'SK CPNS', 'KEPEGAWAIAN'),
    requirement('SK_PNS', 'SK PNS', 'KEPEGAWAIAN'),
    requirement('SK_PANGKAT_TERAKHIR', 'SK pangkat terakhir', 'KEPEGAWAIAN'),
    requirement('SKP_TERAKHIR', 'SKP terakhir', 'KEPEGAWAIAN'),
    requirement('PAS_FOTO', 'Pas foto terbaru', 'FOTO'),
  ],
  HLG: [
    requirement('SURAT_KETERANGAN_HILANG', 'Surat keterangan hilang dari pejabat berwenang', 'LAINNYA'),
    requirement('SK_PANGKAT_TERAKHIR', 'SK pangkat terakhir', 'KEPEGAWAIAN'),
    requirement('KARTU_KELUARGA', 'Kartu keluarga', 'KELUARGA'),
    requirement('PAS_FOTO', 'Pas foto terbaru', 'FOTO'),
  ],
  PTDH: [
    requirement('KEPUTUSAN_HUKDIS', 'Keputusan hukuman disiplin/PTDH', 'PERNYATAAN'),
    requirement('SK_CPNS', 'SK CPNS', 'KEPEGAWAIAN'),
    requirement('SK_PNS', 'SK PNS', 'KEPEGAWAIAN'),
    requirement('SK_PANGKAT_TERAKHIR', 'SK pangkat terakhir', 'KEPEGAWAIAN'),
    requirement('DAFTAR_RIWAYAT_HIDUP', 'Daftar riwayat hidup', 'KEPEGAWAIAN'),
    requirement('MAP_SNELHEKTER', 'Map/snelhecter berkas fisik', 'FISIK', true, false),
  ],
} as const satisfies Record<string, readonly SipensiunRequirementItem[]>;

export type SipensiunRequirementType = keyof typeof SIPENSIUN_REQUIREMENTS;

function requirement(
  documentType: string,
  label: string,
  category: SipensiunRequirementCategory,
  required = true,
  digital = true,
  notes?: string,
): SipensiunRequirementItem {
  return {
    documentType,
    label,
    category,
    required,
    digital,
    ...(notes ? { notes } : {}),
  };
}
