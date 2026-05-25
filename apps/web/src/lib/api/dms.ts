import { apiClient } from './client';

export type DmsDocumentStatus =
  | 'DRAFT'
  | 'UPLOADED'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ARCHIVED';

export type DmsDocumentCategory =
  | 'SKP'
  | 'LAPORAN_BULANAN'
  | 'LAPORAN_TRIWULAN'
  | 'LAPORAN_TAHUNAN'
  | 'REKON_DATA'
  | 'DATA_ASN'
  | 'SURAT_DINAS'
  | 'NOTA_DINAS'
  | 'BUKTI_DUKUNG'
  | 'DOKUMEN_KEBIJAKAN'
  | 'ARSIP_KEPEGAWAIAN'
  | 'LAINNYA';

export type DmsAccessLevel =
  | 'INTERNAL'
  | 'TERBATAS'
  | 'SANGAT_TERBATAS'
  | 'PIMPINAN'
  | 'AUDIT';

export type DmsSubCategory =
  | 'SOP_TAHAP_1'
  | 'SOP_TAHAP_2'
  | 'SOP_TAHAP_3'
  | 'SOP_PENSIUN_PEMBERHENTIAN'
  | 'SOP_MATRIKS'
  | 'SK_PENSIUN'
  | 'CHECKLIST_VERIFIKASI'
  | 'LAPORAN_RHK'
  // Sprint 12 — SOP taxonomy subCategories
  | 'SOP_MANAJEMEN_PPIK'
  | 'SOP_LAYANAN_KEPEGAWAIAN'
  | 'SOP_PENGADAAN_ASN'
  | 'SOP_DATA_KEPEGAWAIAN'
  | 'SOP_SIASN'
  | 'SOP_DMS'
  | 'SOP_PENSIUN'
  | 'SOP_PEMBERHENTIAN'
  | 'SOP_MONITORING';

export const DMS_DOCUMENT_STATUSES: DmsDocumentStatus[] = [
  'DRAFT',
  'UPLOADED',
  'SUBMITTED',
  'VERIFIED',
  'REJECTED',
  'ARCHIVED',
];

export const DMS_DOCUMENT_CATEGORIES: DmsDocumentCategory[] = [
  'SKP',
  'LAPORAN_BULANAN',
  'LAPORAN_TRIWULAN',
  'LAPORAN_TAHUNAN',
  'REKON_DATA',
  'DATA_ASN',
  'SURAT_DINAS',
  'NOTA_DINAS',
  'BUKTI_DUKUNG',
  'DOKUMEN_KEBIJAKAN',
  'ARSIP_KEPEGAWAIAN',
  'LAINNYA',
];

export const DMS_ACCESS_LEVELS: DmsAccessLevel[] = [
  'INTERNAL',
  'TERBATAS',
  'SANGAT_TERBATAS',
  'PIMPINAN',
  'AUDIT',
];

export const DMS_SUB_CATEGORIES: DmsSubCategory[] = [
  'SOP_TAHAP_1',
  'SOP_TAHAP_2',
  'SOP_TAHAP_3',
  'SOP_PENSIUN_PEMBERHENTIAN',
  'SOP_MATRIKS',
  'SK_PENSIUN',
  'CHECKLIST_VERIFIKASI',
  'LAPORAN_RHK',
  'SOP_MANAJEMEN_PPIK',
  'SOP_LAYANAN_KEPEGAWAIAN',
  'SOP_PENGADAAN_ASN',
  'SOP_DATA_KEPEGAWAIAN',
  'SOP_SIASN',
  'SOP_DMS',
  'SOP_PENSIUN',
  'SOP_PEMBERHENTIAN',
  'SOP_MONITORING',
];

export interface DmsUnitKerja {
  id: string;
  kode: string;
  nama: string;
}

export interface DmsAsn {
  id: string;
  nip: string;
  nama: string;
  jabatanNama: string | null;
  golonganNama: string | null;
  unitKerjaId: string | null;
}

export interface DmsCase {
  id: string;
  caseNumber: string;
  serviceType: string;
  title: string;
  currentState: string;
  status: string;
}

export interface DmsWorklog {
  id: string;
  workDate: string;
  category: string;
  title: string;
  status: string;
  userId: string;
  unitKerjaId: string | null;
}

export interface DmsUser {
  id: string;
  username: string;
  name: string;
  unitKerjaId?: string | null;
}

export interface DmsDocument {
  id: string;
  title: string;
  description: string | null;
  category: DmsDocumentCategory;
  subCategory: DmsSubCategory | string | null;
  tags: string[] | unknown[] | null;
  accessLevel: DmsAccessLevel | string;
  status: DmsDocumentStatus;

  periodYear: number | null;
  periodMonth: number | null;
  periodQuarter: number | null;

  unitKerjaId: string | null;
  asnId: string | null;
  caseId: string | null;
  worklogId: string | null;

  fileName: string | null;
  originalFileName: string | null;
  storagePath: string | null;
  mimeType: string | null;
  fileSize: number | null;
  checksum: string | null;
  version: number;

  submittedAt: string | null;
  submittedById: string | null;
  verifiedAt: string | null;
  verifiedById: string | null;
  rejectedAt: string | null;
  rejectionNote: string | null;
  archivedAt: string | null;

  createdAt: string;
  createdById: string | null;
  updatedAt: string;
  updatedById: string | null;

  unitKerja: DmsUnitKerja | null;
  asn: DmsAsn | null;
  case: DmsCase | null;
  worklog: DmsWorklog | null;
  createdBy: DmsUser | null;
  submittedBy: DmsUser | null;
  verifiedBy: DmsUser | null;
}

export interface DmsDocumentListResponse {
  items: DmsDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface DmsDocumentListQuery {
  q?: string;
  category?: DmsDocumentCategory | '';
  subCategory?: DmsSubCategory | string | '';
  accessLevel?: DmsAccessLevel | '';
  status?: DmsDocumentStatus | '';
  unitKerjaId?: string;
  asnId?: string;
  caseId?: string;
  worklogId?: string;
  year?: string;
  month?: string;
  quarter?: string;
  page?: number;
  limit?: number;
}

export interface CreateDmsDocumentPayload {
  title: string;
  description?: string;
  category?: DmsDocumentCategory;
  subCategory?: DmsSubCategory | string;
  tags?: string[];
  accessLevel?: DmsAccessLevel | string;
  periodYear?: number;
  periodMonth?: number;
  periodQuarter?: number;
  unitKerjaId?: string;
  asnId?: string;
  caseId?: string;
  worklogId?: string;
}

export interface UpdateDmsDocumentPayload {
  title?: string;
  description?: string;
  category?: DmsDocumentCategory;
  subCategory?: DmsSubCategory | string;
  tags?: string[];
  accessLevel?: DmsAccessLevel | string;
  periodYear?: number;
  periodMonth?: number;
  periodQuarter?: number;
  unitKerjaId?: string;
  asnId?: string;
  caseId?: string;
  worklogId?: string;
}

export interface UploadDmsDocumentPayload {
  description?: string;
}

export interface VerifyDmsDocumentPayload {
  note?: string;
}

export interface RejectDmsDocumentPayload {
  note: string;
}

export interface DeleteDmsDocumentResponse {
  deleted: boolean;
  id: string;
}

export interface DmsDashboardQuery {
  year?: string;
  month?: string;
  quarter?: string;
  unitKerjaId?: string;
  category?: DmsDocumentCategory | '';
  status?: DmsDocumentStatus | '';
}

export interface DmsDashboardStatusSummary {
  status: DmsDocumentStatus;
  total: number;
}

export interface DmsDashboardCategorySummary {
  category: DmsDocumentCategory;
  total: number;
}

export interface DmsDashboardLatestDocument {
  id: string;
  title: string;
  category: DmsDocumentCategory;
  status: DmsDocumentStatus;
  originalFileName: string | null;
  fileName: string | null;
  periodYear: number | null;
  periodMonth: number | null;
  unitKerja: DmsUnitKerja | null;
  createdBy: {
    id: string;
    username: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface DmsDashboardSummary {
  total: number;
  byStatus: DmsDashboardStatusSummary[];
  byCategory: DmsDashboardCategorySummary[];
  waitingVerification: number;
  withoutFile: number;
  verifiedOrArchived: number;
  rejected: number;
  latestDocuments: DmsDashboardLatestDocument[];
}

export interface DmsAuditTimelineActor {
  id: string;
  username: string;
  name: string;
}

export interface DmsAuditTimelineItem {
  id: string;
  action: string;
  title: string;
  description: string | null;
  actor: DmsAuditTimelineActor | null;
  performedBy: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;
}

function cleanQuery(query: DmsDocumentListQuery): Record<string, string | number | undefined> {
  return {
    q: query.q,
    category: query.category || undefined,
    subCategory: query.subCategory || undefined,
    accessLevel: query.accessLevel || undefined,
    status: query.status || undefined,
    unitKerjaId: query.unitKerjaId,
    asnId: query.asnId,
    caseId: query.caseId,
    worklogId: query.worklogId,
    year: query.year,
    month: query.month,
    quarter: query.quarter,
    page: query.page,
    limit: query.limit,
  };
}

function cleanDashboardQuery(
  query: DmsDashboardQuery,
): Record<string, string | number | undefined> {
  return {
    year: query.year,
    month: query.month,
    quarter: query.quarter,
    unitKerjaId: query.unitKerjaId,
    category: query.category || undefined,
    status: query.status || undefined,
  };
}

function toReportExportQuery(query: DmsDashboardQuery = {}) {
  const params = new URLSearchParams();

  if (query.year) {
    params.set('year', query.year);
  }

  if (query.month) {
    params.set('month', query.month);
  }

  if (query.quarter) {
    params.set('quarter', query.quarter);
  }

  if (query.unitKerjaId) {
    params.set('unitKerjaId', query.unitKerjaId);
  }

  if (query.category) {
    params.set('category', query.category);
  }

  if (query.status) {
    params.set('status', query.status);
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export const dmsApi = {
  listDocuments(query: DmsDocumentListQuery = {}) {
    return apiClient.get<DmsDocumentListResponse>(
      '/dms/documents',
      cleanQuery(query),
    );
  },

  getDocument(id: string) {
    return apiClient.get<DmsDocument>(`/dms/documents/${id}`);
  },

  getDocumentAuditTimeline(id: string) {
    return apiClient.get<DmsAuditTimelineItem[]>(
      `/dms/documents/${id}/audit`,
    );
  },

  downloadDocument(id: string, fileName: string) {
    return apiClient.download(`/dms/documents/${id}/download`, fileName);
  },
    
  createDocument(payload: CreateDmsDocumentPayload) {
    return apiClient.post<DmsDocument>('/dms/documents', payload);
  },

  updateDocument(id: string, payload: UpdateDmsDocumentPayload) {
    return apiClient.patch<DmsDocument>(`/dms/documents/${id}`, payload);
  },

  uploadDocument(
    id: string,
    file: File,
    payload: UploadDmsDocumentPayload = {},
  ) {
    const formData = new FormData();
    formData.append('file', file);

    if (payload.description) {
      formData.append('description', payload.description);
    }

    return apiClient.upload<DmsDocument>(`/dms/documents/${id}/upload`, formData);
  },

  submitDocument(id: string) {
    return apiClient.post<DmsDocument>(`/dms/documents/${id}/submit`);
  },

  verifyDocument(id: string, payload: VerifyDmsDocumentPayload) {
    return apiClient.post<DmsDocument>(`/dms/documents/${id}/verify`, payload);
  },

  rejectDocument(id: string, payload: RejectDmsDocumentPayload) {
    return apiClient.post<DmsDocument>(`/dms/documents/${id}/reject`, payload);
  },

  archiveDocument(id: string) {
    return apiClient.post<DmsDocument>(`/dms/documents/${id}/archive`);
  },

  deleteDocument(id: string) {
    return apiClient.delete<DeleteDmsDocumentResponse>(`/dms/documents/${id}`);
  },

  getDashboardSummary(query: DmsDashboardQuery = {}) {
    return apiClient.get<DmsDashboardSummary>(
      '/dms/dashboard/summary',
      cleanDashboardQuery(query),
    );
  },

  exportReportsCsv(query: DmsDashboardQuery = {}) {
    const suffix = toReportExportQuery(query);
    const year = query.year ? `-${query.year}` : '';
    const month = query.month ? `-bulan-${query.month}` : '';
    const quarter = query.quarter ? `-triwulan-${query.quarter}` : '';
    const fileName = `laporan-dms${year}${month}${quarter}.csv`;

    return apiClient.download(`/dms/reports/export${suffix}`, fileName);
  },

  getFolderTree() {
    return apiClient.get<DmsFolderTree>('/dms/folders');
  },
};

// ---------------------------------------------------------------------------
// Folder tree types
// ---------------------------------------------------------------------------

export interface DmsCategoryNode {
  category: DmsDocumentCategory;
  count: number;
}

export interface DmsYearNode {
  year: number | null;
  total: number;
  categories: DmsCategoryNode[];
}

export interface DmsFolderNode {
  unitKerjaId: string | null;
  unitKerjaKode: string | null;
  unitKerjaNama: string | null;
  total: number;
  years: DmsYearNode[];
}

export interface DmsFolderTree {
  nodes: DmsFolderNode[];
  grandTotal: number;
}

export function dmsCategoryLabel(category: DmsDocumentCategory | string) {
  const labels: Record<DmsDocumentCategory, string> = {
    SKP: 'SKP',
    LAPORAN_BULANAN: 'Laporan Bulanan',
    LAPORAN_TRIWULAN: 'Laporan Triwulan',
    LAPORAN_TAHUNAN: 'Laporan Tahunan',
    REKON_DATA: 'Rekonsiliasi Data',
    DATA_ASN: 'Data ASN',
    SURAT_DINAS: 'Surat Dinas',
    NOTA_DINAS: 'Nota Dinas',
    BUKTI_DUKUNG: 'Bukti Dukung',
    DOKUMEN_KEBIJAKAN: 'Dokumen Kebijakan',
    ARSIP_KEPEGAWAIAN: 'Arsip Kepegawaian',
    LAINNYA: 'Lainnya',
  };

  return labels[category as DmsDocumentCategory] ?? category;
}

export function dmsStatusLabel(status: DmsDocumentStatus | string) {
  const labels: Record<DmsDocumentStatus, string> = {
    DRAFT: 'Draft',
    UPLOADED: 'Uploaded',
    SUBMITTED: 'Submitted',
    VERIFIED: 'Verified',
    REJECTED: 'Rejected',
    ARCHIVED: 'Archived',
  };

  return labels[status as DmsDocumentStatus] ?? status;
}

export function dmsSubCategoryLabel(subCategory: string) {
  const labels: Record<DmsSubCategory, string> = {
    SOP_TAHAP_1: 'SOP Tahap 1',
    SOP_TAHAP_2: 'SOP Tahap 2',
    SOP_TAHAP_3: 'SOP Tahap 3',
    SOP_PENSIUN_PEMBERHENTIAN: 'SOP Pensiun & Pemberhentian',
    SOP_MATRIKS: 'Matriks SOP',
    SK_PENSIUN: 'SK Pensiun',
    CHECKLIST_VERIFIKASI: 'Checklist Verifikasi',
    LAPORAN_RHK: 'Laporan RHK',
    SOP_MANAJEMEN_PPIK: 'Manajemen Bidang PPIK',
    SOP_LAYANAN_KEPEGAWAIAN: 'Layanan Kepegawaian',
    SOP_PENGADAAN_ASN: 'Pengadaan ASN',
    SOP_DATA_KEPEGAWAIAN: 'Data Kepegawaian',
    SOP_SIASN: 'SIASN / MySAPK',
    SOP_DMS: 'Pengelolaan Dokumen Digital',
    SOP_PENSIUN: 'Pensiun ASN',
    SOP_PEMBERHENTIAN: 'Pemberhentian ASN',
    SOP_MONITORING: 'Monitoring Status',
  };

  return labels[subCategory as DmsSubCategory] ?? subCategory.replace(/_/g, ' ');
}

export function dmsAccessLevelLabel(accessLevel: string) {
  const labels: Record<DmsAccessLevel, string> = {
    INTERNAL: 'Internal',
    TERBATAS: 'Terbatas',
    SANGAT_TERBATAS: 'Sangat Terbatas',
    PIMPINAN: 'Pimpinan',
    AUDIT: 'Audit',
  };

  return labels[accessLevel as DmsAccessLevel] ?? accessLevel.replace(/_/g, ' ');
}

export function dmsAccessLevelTone(
  accessLevel: string,
): 'neutral' | 'warning' | 'danger' | 'info' | 'dark' {
  switch (accessLevel as DmsAccessLevel) {
    case 'INTERNAL':
      return 'neutral';
    case 'TERBATAS':
      return 'warning';
    case 'SANGAT_TERBATAS':
      return 'danger';
    case 'PIMPINAN':
      return 'info';
    case 'AUDIT':
      return 'dark';
    default:
      return 'neutral';
  }
}

export function dmsAccessLevelDescription(accessLevel: string): string {
  const descriptions: Record<DmsAccessLevel, string> = {
    INTERNAL: 'Dapat diakses semua pengguna DMS yang telah login.',
    TERBATAS: 'Hanya KABID, Analis Madya/Muda, Admin, dan Kepala Badan.',
    SANGAT_TERBATAS: 'Hanya KABID, Admin BKPSDM, dan Kepala Badan.',
    PIMPINAN: 'Hanya KABID, Admin BKPSDM, dan Kepala Badan.',
    AUDIT: 'Hanya KABID, Admin BKPSDM, dan Kepala Badan (untuk keperluan audit).',
  };

  return descriptions[accessLevel as DmsAccessLevel] ?? 'Level akses dokumen ini.';
}

/** Returns the recommended accessLevel for a given subCategory. */
export function getDefaultAccessLevelForSubCategory(
  subCategory: string,
): DmsAccessLevel {
  switch (subCategory as DmsSubCategory) {
    case 'SK_PENSIUN':
    case 'SOP_PENSIUN_PEMBERHENTIAN':
    case 'CHECKLIST_VERIFIKASI':
      return 'TERBATAS';
    case 'SOP_PEMBERHENTIAN':
    case 'SOP_PENSIUN':
      return 'SANGAT_TERBATAS';
    case 'SOP_MANAJEMEN_PPIK':
    case 'SOP_LAYANAN_KEPEGAWAIAN':
    case 'SOP_PENGADAAN_ASN':
    case 'SOP_DATA_KEPEGAWAIAN':
    case 'SOP_SIASN':
    case 'SOP_DMS':
    case 'SOP_MONITORING':
      return 'TERBATAS';
    case 'LAPORAN_RHK':
    case 'SOP_TAHAP_1':
    case 'SOP_TAHAP_2':
    case 'SOP_TAHAP_3':
    case 'SOP_MATRIKS':
      return 'INTERNAL';
    default:
      return 'INTERNAL';
  }
}
