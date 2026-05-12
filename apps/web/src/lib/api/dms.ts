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

function cleanQuery(query: DmsDocumentListQuery): Record<string, string | number | undefined> {
  return {
    q: query.q,
    category: query.category || undefined,
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
};

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