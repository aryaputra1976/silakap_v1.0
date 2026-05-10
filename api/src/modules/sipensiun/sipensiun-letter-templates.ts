import { resolvePensiunRecipient } from './sipensiun-recipient';

export type SipensiunTemplateMetadata = {
  jenisPensiun: 'BUP' | 'APS' | 'JDU' | 'YATIM_PIATU';
  title: string;
  requiredFields: string[];
  recipientRule: ReturnType<typeof resolvePensiunRecipient>;
  notes: string;
};

const commonFields = [
  'nama',
  'nip',
  'nomorSeriKarpeg',
  'pangkatGolRuang',
  'unitOrganisasi',
  'alamatSekarang',
  'noHp',
  'tmtPensiun',
] as const;

export const SIPENSIUN_LETTER_TEMPLATES = {
  BUP: {
    jenisPensiun: 'BUP',
    title: 'Permohonan Pensiun BUP',
    requiredFields: [
      ...commonFields,
      'alamatSesudahPensiun',
      'masaKerja',
      'tanggalLahir',
    ],
    recipientRule: resolvePensiunRecipient(null),
    notes:
      'Recipient final ditentukan dari golongan ASN: IV/b ke atas BKN pusat, IV/a ke bawah Kanreg IV BKN.',
  },
  APS: {
    jenisPensiun: 'APS',
    title: 'Permohonan Pensiun Atas Permintaan Sendiri',
    requiredFields: [
      ...commonFields,
      'alasanPermohonan',
      'alamatSesudahPensiun',
    ],
    recipientRule: resolvePensiunRecipient(null),
    notes: 'Template metadata untuk permohonan pensiun atas permintaan sendiri.',
  },
  JDU: {
    jenisPensiun: 'JDU',
    title: 'Permohonan Pensiun Janda/Duda',
    requiredFields: [
      ...commonFields,
      'namaPasangan',
      'tanggalKematian',
      'nomorAktaKematian',
      'alamatPenerima',
    ],
    recipientRule: resolvePensiunRecipient(null),
    notes: 'Template metadata untuk penerima pensiun janda/duda.',
  },
  YATIM_PIATU: {
    jenisPensiun: 'YATIM_PIATU',
    title: 'Permohonan Pensiun Yatim Piatu',
    requiredFields: [
      ...commonFields,
      'namaAnak',
      'tanggalLahirAnak',
      'namaWali',
      'tanggalKematianOrangTua',
      'alamatPenerima',
    ],
    recipientRule: resolvePensiunRecipient(null),
    notes: 'Template metadata awal untuk usulan pensiun yatim piatu.',
  },
} as const satisfies Record<string, SipensiunTemplateMetadata>;
