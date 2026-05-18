import type { AppRole } from '@/lib/rbac/roles';
import type { SopChecklistTemplate } from './checklist-types';

// ─── Shared role sets ─────────────────────────────────────────────────────────

const ALL_INTERNAL: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];

const BIDANG_EDITORS: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
];

const BIDANG_APPROVERS: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
];

const EXECUTIVE_APPROVERS: AppRole[] = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
];

// ─── Template 1: SOP-BKPSDM-PAN-002 ──────────────────────────────────────────

export const CHECKLIST_PAN_002: SopChecklistTemplate = {
  sopCode: 'SOP-BKPSDM-PAN-002',
  title: 'Verifikasi Berkas Usulan Pensiun ASN',
  moduleKey: 'SIPENSIUN',
  description:
    'Checklist verifikasi kelengkapan dan keabsahan berkas usulan pensiun ASN sebelum diproses lebih lanjut.',
  relatedDmsRequired: true,
  defaultOverallStatus: 'DRAFT',
  rolePolicy: {
    viewers: ALL_INTERNAL,
    editors: BIDANG_EDITORS,
    approvers: BIDANG_APPROVERS,
  },
  items: [
    {
      id: 'surat-pengantar',
      label: 'Surat pengantar OPD tersedia',
      description: 'Surat resmi dari OPD yang mengusulkan pensiun ASN bersangkutan.',
      category: 'BERKAS_UTAMA',
      required: true,
      allowNotes: true,
      allowDmsLink: true,
    },
    {
      id: 'data-asn-valid',
      label: 'Data ASN sesuai identitas/NIP',
      description: 'NIP, nama, dan data identitas ASN sesuai dengan master data kepegawaian.',
      category: 'BERKAS_UTAMA',
      required: true,
      allowNotes: true,
    },
    {
      id: 'jenis-pensiun-sesuai',
      label: 'Jenis pensiun sesuai ketentuan',
      description: 'Jenis pensiun (BUP, APS, dll.) sesuai dengan kondisi dan peraturan yang berlaku.',
      category: 'BERKAS_UTAMA',
      required: true,
      allowNotes: true,
    },
    {
      id: 'sk-cpns-pns',
      label: 'Dokumen SK CPNS/PNS tersedia',
      description: 'Salinan sah SK pengangkatan CPNS dan PNS.',
      category: 'BERKAS_SK',
      required: true,
      allowNotes: true,
      allowDmsLink: true,
    },
    {
      id: 'sk-pangkat-terakhir',
      label: 'Dokumen SK Pangkat terakhir tersedia',
      description: 'SK kenaikan pangkat/golongan terakhir yang dimiliki ASN.',
      category: 'BERKAS_SK',
      required: true,
      allowNotes: true,
      allowDmsLink: true,
    },
    {
      id: 'gaji-berkala',
      label: 'Dokumen gaji berkala tersedia jika diperlukan',
      description: 'SK Gaji Berkala terakhir jika relevan dengan jenis pensiun.',
      category: 'BERKAS_PENDUKUNG',
      required: false,
      allowNotes: true,
      allowDmsLink: true,
    },
    {
      id: 'dokumen-keluarga',
      label: 'Dokumen keluarga/ahli waris tersedia jika relevan',
      description: 'Kartu keluarga, akta nikah, akta lahir anak, atau dokumen ahli waris.',
      category: 'BERKAS_PENDUKUNG',
      required: false,
      allowNotes: true,
      allowDmsLink: true,
    },
    {
      id: 'bebas-temuan',
      label: 'Dokumen bebas temuan/administrasi tersedia jika diperlukan',
      description: 'Surat keterangan bebas temuan dari BPK/APIP jika disyaratkan.',
      category: 'BERKAS_PENDUKUNG',
      required: false,
      allowNotes: true,
      allowDmsLink: true,
    },
    {
      id: 'berkas-terbaca',
      label: 'Berkas digital terbaca jelas',
      description: 'Seluruh dokumen digital dapat dibaca dengan jelas, tidak buram/terpotong.',
      category: 'KUALITAS',
      required: true,
      allowNotes: true,
    },
    {
      id: 'status-verifikasi',
      label: 'Status verifikasi ditentukan',
      description: 'Verifikator menentukan apakah berkas lengkap untuk dilanjutkan atau dikembalikan.',
      category: 'KESIMPULAN',
      required: true,
      allowNotes: true,
    },
  ],
};

// ─── Template 2: SOP-BKPSDM-LAY-001 ──────────────────────────────────────────

export const CHECKLIST_LAY_001: SopChecklistTemplate = {
  sopCode: 'SOP-BKPSDM-LAY-001',
  title: 'Penerimaan Permohonan Layanan Kepegawaian',
  moduleKey: 'LAYANAN_KEPEGAWAIAN',
  description:
    'Checklist pencatatan dan konfirmasi penerimaan awal permohonan layanan kepegawaian dari ASN atau OPD.',
  relatedDmsRequired: true,
  defaultOverallStatus: 'DRAFT',
  rolePolicy: {
    viewers: ALL_INTERNAL,
    editors: BIDANG_EDITORS,
    approvers: BIDANG_APPROVERS,
  },
  items: [
    {
      id: 'permohonan-tercatat',
      label: 'Permohonan tercatat',
      description: 'Permohonan telah dimasukkan ke sistem dengan nomor penerimaan.',
      category: 'PENERIMAAN',
      required: true,
      allowNotes: true,
    },
    {
      id: 'opd-teridentifikasi',
      label: 'OPD pengusul teridentifikasi',
      description: 'OPD yang mengajukan permohonan telah diidentifikasi dan tervalidasi.',
      category: 'PENERIMAAN',
      required: true,
      allowNotes: true,
    },
    {
      id: 'jenis-layanan',
      label: 'Jenis layanan dipilih',
      description: 'Jenis layanan kepegawaian yang dimohon telah ditentukan (pensiun, mutasi, kenaikan pangkat, dll.).',
      category: 'PENERIMAAN',
      required: true,
      allowNotes: true,
    },
    {
      id: 'asn-teridentifikasi',
      label: 'ASN/pegawai terkait teridentifikasi',
      description: 'Data NIP/nama ASN yang menjadi subyek layanan telah dicocokkan dengan master data.',
      category: 'PENERIMAAN',
      required: true,
      allowNotes: true,
    },
    {
      id: 'dokumen-awal-diunggah',
      label: 'Dokumen awal diunggah',
      description: 'Minimal satu dokumen awal permohonan telah diunggah ke DMS.',
      category: 'DOKUMEN',
      required: true,
      allowNotes: true,
      allowDmsLink: true,
    },
    {
      id: 'nomor-tanggal-penerimaan',
      label: 'Nomor/tanggal penerimaan tercatat',
      description: 'Nomor agenda dan tanggal penerimaan resmi permohonan telah dicatat.',
      category: 'ADMINISTRASI',
      required: true,
      allowNotes: true,
    },
    {
      id: 'status-awal',
      label: 'Status awal layanan ditentukan',
      description: 'Status awal (DRAFT/SUBMITTED) telah ditetapkan di sistem.',
      category: 'ADMINISTRASI',
      required: true,
      allowNotes: true,
    },
  ],
};

// ─── Template 3: SOP-BKPSDM-LAY-002 ──────────────────────────────────────────

export const CHECKLIST_LAY_002: SopChecklistTemplate = {
  sopCode: 'SOP-BKPSDM-LAY-002',
  title: 'Verifikasi Kelengkapan Berkas Layanan',
  moduleKey: 'LAYANAN_KEPEGAWAIAN',
  description:
    'Checklist pemeriksaan kelengkapan berkas permohonan layanan kepegawaian oleh verifikator.',
  relatedDmsRequired: true,
  defaultOverallStatus: 'DRAFT',
  rolePolicy: {
    viewers: ALL_INTERNAL,
    editors: BIDANG_EDITORS,
    approvers: BIDANG_APPROVERS,
  },
  items: [
    {
      id: 'persyaratan-wajib',
      label: 'Persyaratan wajib dicek',
      description: 'Seluruh berkas wajib sesuai jenis layanan telah diperiksa satu per satu.',
      category: 'VERIFIKASI',
      required: true,
      allowNotes: true,
    },
    {
      id: 'persyaratan-tambahan',
      label: 'Persyaratan tambahan dicek jika ada',
      description: 'Berkas tambahan yang disyaratkan untuk kondisi khusus (janda/duda, ahli waris, dll.) telah dicek.',
      category: 'VERIFIKASI',
      required: false,
      allowNotes: true,
    },
    {
      id: 'dokumen-tidak-terbaca',
      label: 'Dokumen tidak terbaca ditandai',
      description: 'Berkas yang buram, rusak, atau tidak terbaca jelas telah ditandai untuk dikembalikan.',
      category: 'KUALITAS',
      required: true,
      allowNotes: true,
    },
    {
      id: 'kekurangan-berkas',
      label: 'Kekurangan berkas dicatat',
      description: 'Daftar berkas yang kurang telah dicatat untuk dikomunikasikan ke OPD/ASN.',
      category: 'KUALITAS',
      required: true,
      allowNotes: true,
    },
    {
      id: 'rekomendasi',
      label: 'Rekomendasi lanjut/kembali ditentukan',
      description: 'Verifikator menentukan apakah berkas cukup untuk dilanjutkan proses atau dikembalikan.',
      category: 'KESIMPULAN',
      required: true,
      allowNotes: true,
    },
    {
      id: 'catatan-verifikator',
      label: 'Catatan verifikator diisi',
      description: 'Catatan resmi verifikator mengenai hasil pemeriksaan berkas.',
      category: 'KESIMPULAN',
      required: true,
      allowNotes: true,
    },
  ],
};

// ─── Template 4: SOP-BKPSDM-DAT-002 ──────────────────────────────────────────

export const CHECKLIST_DAT_002: SopChecklistTemplate = {
  sopCode: 'SOP-BKPSDM-DAT-002',
  title: 'Pemutakhiran Data ASN Umum / Non-Pensiun',
  moduleKey: 'SIDATA',
  description:
    'Checklist verifikasi dan pemutakhiran data ASN aktif pada sistem SIDATA/SIASN.',
  relatedDmsRequired: true,
  defaultOverallStatus: 'DRAFT',
  rolePolicy: {
    viewers: ALL_INTERNAL,
    editors: BIDANG_EDITORS,
    approvers: BIDANG_APPROVERS,
  },
  items: [
    {
      id: 'identitas-asn',
      label: 'Identitas ASN diverifikasi',
      description: 'NIP, nama, NIK, tanggal lahir, dan status ASN sesuai dokumen sumber.',
      category: 'DATA_POKOK',
      required: true,
      allowNotes: true,
    },
    {
      id: 'data-jabatan',
      label: 'Data jabatan diverifikasi',
      description: 'Nama jabatan, jenis jabatan, dan TMT jabatan sesuai SK terakhir.',
      category: 'DATA_POKOK',
      required: true,
      allowNotes: true,
    },
    {
      id: 'data-unit-kerja',
      label: 'Data unit kerja diverifikasi',
      description: 'Kode dan nama unit kerja/OPD tempat ASN bertugas telah diverifikasi.',
      category: 'DATA_POKOK',
      required: true,
      allowNotes: true,
    },
    {
      id: 'data-pangkat-golongan',
      label: 'Data pangkat/golongan diverifikasi',
      description: 'Pangkat, golongan/ruang, dan TMT golongan sesuai SK kenaikan pangkat terakhir.',
      category: 'DATA_POKOK',
      required: true,
      allowNotes: true,
    },
    {
      id: 'data-pendidikan',
      label: 'Data pendidikan/pelatihan dicek jika relevan',
      description: 'Tingkat pendidikan dan riwayat pelatihan/diklat dicek apabila ada perubahan.',
      category: 'DATA_TAMBAHAN',
      required: false,
      allowNotes: true,
    },
    {
      id: 'sumber-data',
      label: 'Sumber data pembanding dicatat',
      description: 'Dokumen sumber yang digunakan sebagai acuan pemutakhiran dicatat (SK, laporan SIASN, dll.).',
      category: 'AUDIT',
      required: true,
      allowNotes: true,
    },
    {
      id: 'perubahan-dicatat',
      label: 'Perubahan data dicatat',
      description: 'Field apa saja yang diubah/diperbarui telah dicatat dalam log pemutakhiran.',
      category: 'AUDIT',
      required: true,
      allowNotes: true,
    },
    {
      id: 'bukti-dukung-dms',
      label: 'Bukti dukung tersimpan di DMS',
      description: 'Dokumen pendukung (SK, laporan rekonsiliasi) telah diunggah ke DMS dengan kategori DATA_ASN.',
      category: 'AUDIT',
      required: true,
      allowNotes: true,
      allowDmsLink: true,
    },
  ],
};

// ─── Template 5: SOP-BKPSDM-DMS-001 ──────────────────────────────────────────

export const CHECKLIST_DMS_001: SopChecklistTemplate = {
  sopCode: 'SOP-BKPSDM-DMS-001',
  title: 'Pengelolaan Dokumen Digital Kepegawaian',
  moduleKey: 'DMS',
  description:
    'Checklist tata kelola penyimpanan dan pengelolaan dokumen digital kepegawaian di DMS.',
  relatedDmsRequired: true,
  defaultOverallStatus: 'DRAFT',
  rolePolicy: {
    viewers: ALL_INTERNAL,
    editors: BIDANG_EDITORS,
    approvers: EXECUTIVE_APPROVERS,
  },
  items: [
    {
      id: 'kategori-dokumen',
      label: 'Kategori dokumen dipilih',
      description: 'Kategori utama dokumen (ARSIP_KEPEGAWAIAN, DOKUMEN_KEBIJAKAN, dll.) telah dipilih dengan benar.',
      category: 'METADATA',
      required: true,
      allowNotes: true,
    },
    {
      id: 'sub-category',
      label: 'SubCategory dipilih',
      description: 'SubCategory yang sesuai dengan jenis dokumen (SOP_PENSIUN, SOP_PEMBERHENTIAN, dll.) telah dipilih.',
      category: 'METADATA',
      required: true,
      allowNotes: true,
    },
    {
      id: 'access-level',
      label: 'Access level ditentukan',
      description: 'Level akses dokumen (INTERNAL/TERBATAS/SANGAT_TERBATAS/PIMPINAN) telah ditetapkan sesuai sensitivitas.',
      category: 'KEAMANAN',
      required: true,
      allowNotes: true,
    },
    {
      id: 'file-diunggah',
      label: 'File berhasil diunggah',
      description: 'File dokumen telah berhasil diunggah dan status DMS berubah ke UPLOADED.',
      category: 'UPLOAD',
      required: true,
      allowNotes: true,
      allowDmsLink: true,
    },
    {
      id: 'metadata-lengkap',
      label: 'Metadata dokumen lengkap',
      description: 'Judul, deskripsi, tahun periode, dan metadata lainnya telah diisi dengan lengkap.',
      category: 'METADATA',
      required: true,
      allowNotes: true,
    },
    {
      id: 'tags-sesuai',
      label: 'Tags dokumen sesuai',
      description: 'Tags yang diterapkan relevan dan konsisten dengan kode SOP/RHK terkait.',
      category: 'METADATA',
      required: false,
      allowNotes: true,
    },
    {
      id: 'preview-download',
      label: 'Dokumen dapat dipreview/download sesuai akses',
      description: 'Dokumen dapat diakses melalui preview atau download oleh role yang berwenang.',
      category: 'KUALITAS',
      required: true,
      allowNotes: true,
    },
    {
      id: 'akses-sensitif',
      label: 'Dokumen sensitif tidak terbuka untuk role tidak berhak',
      description: 'Dokumen dengan level TERBATAS/SANGAT_TERBATAS tidak dapat diakses oleh OPD/PPPK.',
      category: 'KEAMANAN',
      required: true,
      allowNotes: true,
    },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const ALL_CHECKLIST_TEMPLATES: SopChecklistTemplate[] = [
  CHECKLIST_PAN_002,
  CHECKLIST_LAY_001,
  CHECKLIST_LAY_002,
  CHECKLIST_DAT_002,
  CHECKLIST_DMS_001,
];
