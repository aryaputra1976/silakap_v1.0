export const OPD_MODULE_KEYS = [
  'LAYANAN_KEPEGAWAIAN',
  'SIPENSIUN',
  'SIDATA',
  'DMS',
] as const;

export type OpdModuleKey = (typeof OPD_MODULE_KEYS)[number];

export const PPIK_PEREMAJAAN_SERVICE_TYPES = [
  'PEREMAJAAN_NIK',
  'PEREMAJAAN_NAMA',
  'PEREMAJAAN_TANGGAL_LAHIR',
  'PEREMAJAAN_KELUARGA_TAMBAH_ANAK',
  'PEREMAJAAN_KELUARGA_MENIKAH',
  'PEREMAJAAN_KELUARGA_CERAI',
  'PEREMAJAAN_KONTAK_ALAMAT_EMAIL',
  'PEREMAJAAN_GOLONGAN',
  'PEREMAJAAN_PENDIDIKAN',
] as const;

export const PPIK_PEMBERHENTIAN_SERVICE_TYPES = [
  'PEMBERHENTIAN_BUP',
  'PEMBERHENTIAN_APS',
  'PEMBERHENTIAN_MENINGGAL',
  'PEMBERHENTIAN_TIDAK_CAKAP',
  'PEMBERHENTIAN_PIDANA_DISIPLIN',
  'PEMBERHENTIAN_HILANG_TEWAS',
  'PENSIUN_JANDA_DUDA_AHLI_WARIS',
] as const;

export const LAYANAN_SERVICE_TYPES = [
  ...PPIK_PEREMAJAAN_SERVICE_TYPES,
  ...PPIK_PEMBERHENTIAN_SERVICE_TYPES,
] as const;

export type PpikPeremajaanServiceType =
  (typeof PPIK_PEREMAJAAN_SERVICE_TYPES)[number];

export type PpikPemberhentianServiceType =
  (typeof PPIK_PEMBERHENTIAN_SERVICE_TYPES)[number];

export type LayananServiceType = (typeof LAYANAN_SERVICE_TYPES)[number];

export const PPIK_REQUIRED_DOCUMENT_TYPES: Record<
  LayananServiceType,
  readonly string[]
> = {
  PEREMAJAAN_NIK: ['KTP'],

  PEREMAJAAN_NAMA: ['AKTA_LAHIR'],

  PEREMAJAAN_TANGGAL_LAHIR: ['AKTA_LAHIR'],

  PEREMAJAAN_KELUARGA_TAMBAH_ANAK: [
    'AKTA_KELAHIRAN_ANAK',
    'KARTU_KELUARGA',
  ],

  PEREMAJAAN_KELUARGA_MENIKAH: [
    'BUKU_NIKAH_ATAU_AKTA_NIKAH',
    'KARTU_KELUARGA',
  ],

  PEREMAJAAN_KELUARGA_CERAI: [
    'AKTA_CERAI_ATAU_PUTUSAN_PENGADILAN',
    'KARTU_KELUARGA',
  ],

  PEREMAJAAN_KONTAK_ALAMAT_EMAIL: [
    'FORMULIR_PERUBAHAN_DATA',
  ],

  PEREMAJAAN_GOLONGAN: [
    'SK_PANGKAT_ATAU_SK_GOLONGAN',
  ],

  PEREMAJAAN_PENDIDIKAN: [
    'IJAZAH',
    'TRANSKRIP_NILAI',
  ],

  PEMBERHENTIAN_BUP: [
    'USULAN_OPD',
    'DATA_ASN',
    'SK_PANGKAT_TERAKHIR',
  ],

  PEMBERHENTIAN_APS: [
    'SURAT_PERMOHONAN',
    'REKOMENDASI_OPD',
    'DOKUMEN_KEPEGAWAIAN',
  ],

  PEMBERHENTIAN_MENINGGAL: [
    'AKTA_KEMATIAN_ATAU_SURAT_KETERANGAN_KEMATIAN',
    'DOKUMEN_AHLI_WARIS',
  ],

  PEMBERHENTIAN_TIDAK_CAKAP: [
    'SURAT_KETERANGAN_MEDIS_ATAU_PENETAPAN_RESMI',
    'REKOMENDASI_OPD',
  ],

  PEMBERHENTIAN_PIDANA_DISIPLIN: [
    'PUTUSAN_PENGADILAN_ATAU_KEPUTUSAN_DISIPLIN',
    'TELAAHAN',
  ],

  PEMBERHENTIAN_HILANG_TEWAS: [
    'DOKUMEN_PENETAPAN_ATAU_KETERANGAN_RESMI',
  ],

  PENSIUN_JANDA_DUDA_AHLI_WARIS: [
    'DOKUMEN_AHLI_WARIS',
    'DOKUMEN_KEPEGAWAIAN',
    'DOKUMEN_PENDUKUNG_PENSIUN',
  ],
};

export type SubmissionDocumentLike = {
  documentType: string;
  status: string;
};

export type RequiredDocumentAssessment = {
  serviceType: string;
  isKnownServiceType: boolean;
  required: string[];
  uploaded: string[];
  verified: string[];
  missing: string[];
  unverified: string[];
  rejected: string[];
  canComplete: boolean;
  reasons: string[];
};

export function isPpikPeremajaanServiceType(
  value: string | undefined | null,
): value is PpikPeremajaanServiceType {
  return PPIK_PEREMAJAAN_SERVICE_TYPES.includes(
    value as PpikPeremajaanServiceType,
  );
}

export function isPpikPemberhentianServiceType(
  value: string | undefined | null,
): value is PpikPemberhentianServiceType {
  return PPIK_PEMBERHENTIAN_SERVICE_TYPES.includes(
    value as PpikPemberhentianServiceType,
  );
}

export function isLayananServiceType(
  value: string | undefined | null,
): value is LayananServiceType {
  return LAYANAN_SERVICE_TYPES.includes(value as LayananServiceType);
}

export function getRequiredDocumentTypes(serviceType: string): string[] {
  if (!isLayananServiceType(serviceType)) {
    return [];
  }

  return [...PPIK_REQUIRED_DOCUMENT_TYPES[serviceType]];
}

export function assessRequiredDocuments(
  serviceType: string,
  documents: readonly SubmissionDocumentLike[],
): RequiredDocumentAssessment {
  const normalizedServiceType = normalizeCode(serviceType);
  const required = getRequiredDocumentTypes(normalizedServiceType);

  if (!isLayananServiceType(normalizedServiceType)) {
    return {
      serviceType: normalizedServiceType,
      isKnownServiceType: false,
      required: [],
      uploaded: [],
      verified: [],
      missing: [],
      unverified: [],
      rejected: [],
      canComplete: true,
      reasons: [],
    };
  }

  const uploaded = new Set<string>();
  const verified = new Set<string>();
  const rejected = new Set<string>();

  for (const document of documents) {
    const documentType = normalizeCode(document.documentType);
    const status = normalizeCode(document.status);

    if (!documentType) {
      continue;
    }

    uploaded.add(documentType);

    if (status === 'VERIFIED') {
      verified.add(documentType);
    }

    if (status === 'REJECTED') {
      rejected.add(documentType);
    }
  }

  const missing = required.filter((documentType) => !uploaded.has(documentType));

  const unverified = required.filter(
    (documentType) =>
      uploaded.has(documentType) && !verified.has(documentType),
  );

  const rejectedRequired = required.filter(
    (documentType) => rejected.has(documentType) && !verified.has(documentType),
  );

  const reasons: string[] = [];

  if (missing.length > 0) {
    reasons.push(
      `Dokumen wajib belum diunggah: ${missing.join(', ')}.`,
    );
  }

  if (unverified.length > 0) {
    reasons.push(
      `Dokumen wajib belum terverifikasi: ${unverified.join(', ')}.`,
    );
  }

  if (rejectedRequired.length > 0) {
    reasons.push(
      `Dokumen wajib ditolak dan perlu diperbaiki: ${rejectedRequired.join(', ')}.`,
    );
  }

  return {
    serviceType: normalizedServiceType,
    isKnownServiceType: true,
    required,
    uploaded: required.filter((documentType) => uploaded.has(documentType)),
    verified: required.filter((documentType) => verified.has(documentType)),
    missing,
    unverified,
    rejected: rejectedRequired,
    canComplete: reasons.length === 0,
    reasons,
  };
}

function normalizeCode(value: string | undefined | null): string {
  return value?.trim().toUpperCase() ?? '';
}