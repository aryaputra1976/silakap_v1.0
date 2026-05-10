export const SIPENSIUN_REQUIREMENTS = {
  BUP: [
    { documentType: 'SK_TERAKHIR', label: 'SK terakhir' },
    { documentType: 'KP_TERAKHIR', label: 'KP terakhir' },
    { documentType: 'KARPEG_IDENTITAS', label: 'Kartu Pegawai / Identitas' },
  ],
  APS: [
    { documentType: 'SURAT_PERMOHONAN', label: 'Surat permohonan' },
    { documentType: 'SK_CPNS_PNS', label: 'SK CPNS/PNS' },
  ],
  JDU: [
    { documentType: 'AKTA_KEMATIAN', label: 'Akta kematian' },
    { documentType: 'KARTU_KELUARGA', label: 'Kartu keluarga' },
    { documentType: 'SURAT_NIKAH', label: 'Surat nikah' },
  ],
  TWS: [
    { documentType: 'SURAT_KETERANGAN_TEWAS', label: 'Surat keterangan tewas' },
    { documentType: 'SK_TERAKHIR', label: 'SK terakhir' },
  ],
  SAK: [
    { documentType: 'SURAT_KETERANGAN_DOKTER', label: 'Surat keterangan dokter' },
    { documentType: 'SK_TERAKHIR', label: 'SK terakhir' },
  ],
  HLG: [
    { documentType: 'SURAT_KETERANGAN_HILANG', label: 'Surat keterangan hilang' },
    { documentType: 'SK_TERAKHIR', label: 'SK terakhir' },
  ],
  PTDH: [
    { documentType: 'KEPUTUSAN_HUKUMAN_DISIPLIN', label: 'Keputusan hukuman disiplin' },
    { documentType: 'SK_TERAKHIR', label: 'SK terakhir' },
  ],
} as const;

export type SipensiunRequirementType = keyof typeof SIPENSIUN_REQUIREMENTS;
export type SipensiunRequirementItem =
  (typeof SIPENSIUN_REQUIREMENTS)[SipensiunRequirementType][number];
