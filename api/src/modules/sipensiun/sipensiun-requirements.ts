export const SIPENSIUN_REQUIREMENTS = {
  BUP: ['SK terakhir', 'KP terakhir', 'Kartu Pegawai / Identitas'],
  APS: ['Surat permohonan', 'SK CPNS/PNS'],
  JDU: ['Akta kematian', 'Kartu keluarga', 'Surat nikah'],
  TWS: ['Surat keterangan tewas', 'SK terakhir'],
  SAK: ['Surat keterangan dokter', 'SK terakhir'],
  HLG: ['Surat keterangan hilang', 'SK terakhir'],
  PTDH: ['Keputusan hukuman disiplin', 'SK terakhir'],
} as const;

export type SipensiunRequirementType = keyof typeof SIPENSIUN_REQUIREMENTS;
