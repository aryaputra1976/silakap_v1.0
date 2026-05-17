export type SidataSopKey = 'DAT-002' | 'DAT-003' | 'SIK-002';

export interface SidataSopConfig {
  key: SidataSopKey;
  code: string;
  title: string;
  shortLabel: string;
  description: string;
  rhkCodes: string[];
  dmsQuery: string;
  lifecycle: Array<{ label: string; description: string; mapState: string[] }>;
}

export const SIDATA_SOP_LIST: SidataSopConfig[] = [
  {
    key: 'DAT-002',
    code: 'SOP-BKPSDM-DAT-002',
    title: 'Pemutakhiran Data ASN Umum / Non-Pensiun',
    shortLabel: 'Pemutakhiran Umum',
    description:
      'Mengatur pemutakhiran data ASN umum (jabatan, golongan, unit kerja, status) melalui pipeline import SIASN/MySAPK.',
    rhkCodes: ['RHK 6'],
    dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_3&q=DAT-002',
    lifecycle: [
      {
        label: 'Upload Data SIASN',
        description: 'File data ASN dari SIASN/MySAPK diupload ke sistem.',
        mapState: ['UPLOAD'],
      },
      {
        label: 'Mapping Referensi',
        description: 'Baris data dipetakan ke referensi master (jabatan, golongan, unit).',
        mapState: ['MAPPING'],
      },
      {
        label: 'Validasi Data',
        description: 'Data diperiksa konsistensi dan kelengkapannya.',
        mapState: ['VALIDATION'],
      },
      {
        label: 'Commit ke Master',
        description: 'Data valid di-commit ke master ASN SIDATA.',
        mapState: ['COMMIT'],
      },
      {
        label: 'Audit & Rekonsiliasi',
        description: 'Pembaruan direkonsiliasi dan diaudit trail.',
        mapState: ['DONE'],
      },
    ],
  },
  {
    key: 'DAT-003',
    code: 'SOP-BKPSDM-DAT-003',
    title: 'Pemutakhiran Data ASN Setelah Keputusan Pensiun/Pemberhentian',
    shortLabel: 'Pemutakhiran Pasca SK',
    description:
      'Mengatur pemutakhiran data ASN setelah terbit Surat Keputusan pensiun atau pemberhentian.',
    rhkCodes: ['RHK 6'],
    dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_3&q=DAT-003',
    lifecycle: [
      {
        label: 'Penerimaan SK',
        description: 'Surat Keputusan pensiun/pemberhentian diterima.',
        mapState: ['RECEIVE'],
      },
      {
        label: 'Verifikasi SK',
        description: 'SK diverifikasi keaslian dan kelengkapannya.',
        mapState: ['VERIFY'],
      },
      {
        label: 'Pemutakhiran Status',
        description: 'Status ASN diperbarui menjadi PENSIUN/BERHENTI.',
        mapState: ['UPDATE'],
      },
      {
        label: 'Sinkronisasi SIASN',
        description: 'Pembaruan disinkronkan ke SIASN/MySAPK.',
        mapState: ['SYNC'],
      },
      {
        label: 'Bukti Dukung DMS',
        description: 'SK dan bukti dukung diarsipkan ke DMS.',
        mapState: ['ARCHIVE'],
      },
    ],
  },
  {
    key: 'SIK-002',
    code: 'SOP-BKPSDM-SIK-002',
    title: 'Sinkronisasi Data Kepegawaian dengan SIASN/MySAPK',
    shortLabel: 'Sinkronisasi SIASN',
    description:
      'Mengatur sinkronisasi berkala data kepegawaian antara SIDATA lokal dengan SIASN/MySAPK BKN.',
    rhkCodes: ['RHK 5'],
    dmsQuery: 'category=DOKUMEN_KEBIJAKAN&subCategory=SOP_TAHAP_3&q=SIK-002',
    lifecycle: [
      {
        label: 'Persiapan Sinkronisasi',
        description: 'Jadwal dan parameter sinkronisasi disiapkan.',
        mapState: ['PREPARE'],
      },
      {
        label: 'Unduh Data SIASN',
        description: 'Data terbaru diunduh dari SIASN/MySAPK.',
        mapState: ['DOWNLOAD'],
      },
      {
        label: 'Validasi & Mapping',
        description: 'Data hasil unduhan divalidasi dan dipetakan.',
        mapState: ['VALIDATE'],
      },
      {
        label: 'Commit & Update Master',
        description: 'Data valid di-commit dan master SIDATA diperbarui.',
        mapState: ['COMMIT'],
      },
      {
        label: 'Laporan Sinkronisasi',
        description: 'Laporan hasil sinkronisasi disusun untuk RHK 5.',
        mapState: ['REPORT'],
      },
    ],
  },
];

export function getSidataSopConfig(key: string): SidataSopConfig | undefined {
  return SIDATA_SOP_LIST.find((item) => item.key === key);
}

/** Returns all SOPs relevant to a given RHK code */
export function getSopsByRhk(rhkCode: string): SidataSopConfig[] {
  return SIDATA_SOP_LIST.filter((sop) => sop.rhkCodes.includes(rhkCode));
}

/**
 * Schema vs AsnRecord discrepancy note:
 * The Prisma `Asn` model uses `jenisAsnNama` / `tipePegawai` / `siasnPnsId` / `syncedAt`
 * fields that are NOT present in the frontend `AsnRecord` type. The API backend maps
 * these: `jenisAsnNama` → `jenisAsn`, and derived fields (usia, tanggalLahir, email, phone)
 * likely come from the joined `AsnSiasnProfile` relation. No migration is needed here;
 * this is a documentation note for the developer.
 */
export const SIDATA_SCHEMA_NOTES = {
  asnRecordMissingFromSchema: [
    'email (from AsnSiasnProfile)',
    'phone (from AsnSiasnProfile)',
    'tanggalLahir (from AsnSiasnProfile)',
    'usia (computed from tanggalLahir)',
    'masaKerjaGolongan (computed from tmtGolongan)',
    'pendidikanNama (from AsnPendidikanHistory)',
  ],
  schemaMissingFromAsnRecord: [
    'siasnPnsId',
    'tipePegawai',
    'jenisAsnNama (mapped to jenisAsn in API response)',
    'kedudukanHukumNama',
    'siasnUnorId / unorNama',
    'syncedAt',
    'checksum',
  ],
} as const;
