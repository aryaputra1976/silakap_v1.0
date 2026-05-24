import { apiClient } from './client';
import type { AsnRecord, PaginatedResult, SidataAsnDocument } from './types';

export type SidataUnitKerja = {
  id: string;
  kode: string;
  nama: string;
  parentId: string | null;
  level: number;
  isActive: boolean;
};

export type SidataUnitTreeNode = SidataUnitKerja & {
  children: SidataUnitTreeNode[];
};

export type SidataAsnListQuery = {
  q?: string;
  unitKerjaId?: string;
  statusAsn?: string;
  jenisAsn?: string;
  syncStatus?: string;
  page?: number;
  limit?: number;
};

export type SidataUpdateAsnPayload = Partial<{
  nipLama: string;
  nik: string;
  nama: string;
  jenisAsn: string;
  statusAsn: string;
  unitKerjaId: string;
  jabatanRefId: string;
  jabatanNama: string;
  golonganRefId: string;
  golonganNama: string;
  tmtJabatan: string;
  tmtGolongan: string;
  tmtPensiun: string;
  isActive: boolean;
  changeReason: string;
  evidenceDocumentId: string;
  needsReview: boolean;
  reviewNote: string;
}>;

export type SidataAsnChangeLog = {
  id: string;
  asnId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string;
  reason: string | null;
  evidenceDocumentId: string | null;
  source: string;
  sourceBatchId: string | null;
  metadata: unknown;
};

export type SidataAsnHistoryBatch = {
  id: string;
  fileName: string | null;
  importType: string;
  createdAt: string;
};

export type SidataAsnAssignmentHistory = {
  id: string;
  type: 'ASSIGNMENT';
  unitKerjaId: string | null;
  unitKerja: SidataUnitKerja | null;
  siasnUnorId: string | null;
  unorNama: string | null;
  jabatanRefId: string | null;
  siasnJabatanId: string | null;
  jabatanNama: string | null;
  jenisJabatanNama: string | null;
  tmtJabatan: string | null;
  effectiveDate: string | null;
  syncedAt: string;
  createdAt: string;
  sourceBatch: SidataAsnHistoryBatch | null;
};

export type SidataAsnGolonganHistory = {
  id: string;
  type: 'GOLONGAN';
  golonganRefId: string | null;
  siasnGolonganId: string | null;
  golonganNama: string | null;
  pangkatNama: string | null;
  ruangNama: string | null;
  tmtGolongan: string | null;
  effectiveDate: string | null;
  syncedAt: string;
  createdAt: string;
  sourceBatch: SidataAsnHistoryBatch | null;
};

export type SidataAsnHistory = {
  assignment: SidataAsnAssignmentHistory[];
  golongan: SidataAsnGolonganHistory[];
};

export type SidataAsnQualityBreakdownItem = {
  key: string;
  label: string;
  total: number;
  percentage: number;
};

export type SidataAsnQualityDashboard = {
  generatedAt: string;
  scope: {
    type: 'ALL' | 'UNIT';
    unitKerjaId: string | null;
  };
  period: {
    today: string;
    bupUntil: string;
    bupWindowMonths: number;
  };
  totals: {
    totalAsn: number;
    activeAsn: number;
    inactiveAsn: number;
    pns: number;
    pppk: number;
    pppkParuhWaktu: number;
  };
  completeness: {
    withoutUnitKerja: number;
    withoutJabatan: number;
    withoutGolongan: number;
    withoutNik: number;
    withoutTanggalLahir: number;
    withoutTmtPensiun: number;
    withoutSiasnProfile: number;
  };
  retirement: {
    bupNext12Months: number;
    bupOverdueActive: number;
  };
  quality: {
    completeCoreRows: number;
    issueRows: number;
    qualityScore: number;
  };
  sync: {
    synced: number;
    localCorrection: number;
    needReview: number;
    pendingSiasnUpdate: number;
    conflict: number;
  };
  breakdown: {
    byStatusAsn: SidataAsnQualityBreakdownItem[];
    byJenisAsn: SidataAsnQualityBreakdownItem[];
    bySyncStatus: SidataAsnQualityBreakdownItem[];
  };
};

export type RekapJKRow = { pria: number; wanita: number; lainnya: number; total: number; persenPria: number; persenWanita: number };
export type RekapGolonganRow = { golru: string; pria: number; wanita: number; total: number };
export type RekapPendidikanRow = { pddkn: string; pria: number; wanita: number; total: number };
export type RekapJenjangRow = { jenisAsn?: string; jabatan: string; pria: number; wanita: number; total: number; persenPria: number; persenWanita: number };
export type RekapStrukturalEselonRow = { eselon: string; terisi: number; pria: number; wanita: number };
export type RekapStrukturalPendidikanRow = { pddkn: string; ess1: number; ess2: number; ess3: number; ess4: number; total: number };
export type RekapFungsionalRow = { namaJabatan: string; ahliPria: number; ahliWanita: number; jumlahAhli: number; terampilPria: number; terampilWanita: number; jumlahTerampil: number; jumlahTotal: number };
export type RekapAsnResponse = {
  allJk: RekapJKRow;
  pnsGolonganDetail: RekapGolonganRow[];
  pnsGolonganGroup: RekapGolonganRow[];
  pnsPendidikanDetail: RekapPendidikanRow[];
  pnsPendidikanGroup: RekapPendidikanRow[];
  allJenjangJabatan: RekapJenjangRow[];
  strukturalEselonDetail: RekapStrukturalEselonRow[];
  strukturalEselonGroup: RekapStrukturalEselonRow[];
  strukturalPendidikan: RekapStrukturalPendidikanRow[];
  fungsionalJabatan: RekapFungsionalRow[];
  pppkJk: RekapJKRow;
  pppkGolongan: RekapGolonganRow[];
  pppkPendidikanDetail: RekapPendidikanRow[];
  pppkPendidikanGroup: RekapPendidikanRow[];
  pppkParuhWaktuGolongan: RekapGolonganRow[];
  pppkParuhWaktuPendidikanDetail: RekapPendidikanRow[];
  pppkParuhWaktuPendidikanGroup: RekapPendidikanRow[];
  pppkJenjangJabatan: RekapJenjangRow[];
};

export type RekapIkhtisarResponse = {
  allJk: RekapJKRow;
  pppkJk: RekapJKRow;
  allJenjangJabatan: RekapJenjangRow[];
  pppkJenjangJabatan: RekapJenjangRow[];
};

export type RekapPnsResponse = {
  pnsGolonganDetail: RekapGolonganRow[];
  pnsGolonganGroup: RekapGolonganRow[];
  pnsPendidikanDetail: RekapPendidikanRow[];
  pnsPendidikanGroup: RekapPendidikanRow[];
  strukturalEselonDetail: RekapStrukturalEselonRow[];
  strukturalEselonGroup: RekapStrukturalEselonRow[];
  strukturalPendidikan: RekapStrukturalPendidikanRow[];
  fungsionalJabatan: RekapFungsionalRow[];
};

export type RekapPppkResponse = {
  pppkGolongan: RekapGolonganRow[];
  pppkPendidikanDetail: RekapPendidikanRow[];
  pppkPendidikanGroup: RekapPendidikanRow[];
  pppkParuhWaktuGolongan: RekapGolonganRow[];
  pppkParuhWaktuPendidikanDetail: RekapPendidikanRow[];
  pppkParuhWaktuPendidikanGroup: RekapPendidikanRow[];
};

export const SIDATA_STATUS_ASN_OPTIONS = [
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'PENSIUN', label: 'Pensiun' },
  { value: 'CLTN', label: 'CLTN' },
  { value: 'BERHENTI', label: 'Berhenti' },
  { value: 'MENINGGAL', label: 'Meninggal' },
] as const;

export const SIDATA_JENIS_ASN_OPTIONS = [
  { value: 'PNS', label: 'PNS' },
  { value: 'PPPK', label: 'PPPK' },
  { value: 'PPPK_PARUH_WAKTU', label: 'PPPK Paruh Waktu' },
] as const;

export function formatJenisAsn(value: string | null | undefined) {
  return SIDATA_JENIS_ASN_OPTIONS.find((option) => option.value === value)?.label ?? value ?? '-';
}

export const sidataApi = {
  getAsnList(query: SidataAsnListQuery): Promise<PaginatedResult<AsnRecord>> {
    return apiClient.get<PaginatedResult<AsnRecord>>('/sidata/asn', {
      q: query.q,
      unitKerjaId: query.unitKerjaId,
      statusAsn: query.statusAsn,
      jenisAsn: query.jenisAsn,
      syncStatus: query.syncStatus,
      page: query.page,
      limit: query.limit,
    });
  },

  getAsnQualityDashboard(): Promise<SidataAsnQualityDashboard> {
    return apiClient.get<SidataAsnQualityDashboard>('/sidata/dashboard/quality');
  },

  getAsnById(id: string): Promise<AsnRecord> {
    return apiClient.get<AsnRecord>(`/sidata/asn/${id}`);
  },

  getAsnHistory(id: string): Promise<SidataAsnHistory> {
    return apiClient.get<SidataAsnHistory>(`/sidata/asn/${id}/history`);
  },

  getAsnChangeLogs(id: string): Promise<SidataAsnChangeLog[]> {
    return apiClient.get<SidataAsnChangeLog[]>(`/sidata/asn/${id}/change-logs`);
  },

  updateAsn(id: string, payload: SidataUpdateAsnPayload): Promise<AsnRecord> {
    return apiClient.patch<AsnRecord>(`/sidata/asn/${id}`, payload);
  },

  getAsnDocuments(id: string): Promise<SidataAsnDocument[]> {
    return apiClient.get<SidataAsnDocument[]>(`/sidata/asn/${id}/documents`);
  },

  uploadAsnDocument(id: string, file: File, documentType: string): Promise<SidataAsnDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', documentType);
    return apiClient.upload<SidataAsnDocument>(`/sidata/asn/${id}/documents`, form);
  },

  downloadAsnDocument(asnId: string, document: SidataAsnDocument) {
    return apiClient.download(
      `/sidata/asn/${asnId}/documents/${document.id}/download`,
      document.originalFileName ?? document.fileName,
    );
  },

  deleteAsnDocument(asnId: string, documentId: string): Promise<SidataAsnDocument> {
    return apiClient.delete<SidataAsnDocument>(`/sidata/asn/${asnId}/documents/${documentId}`);
  },

  exportAsnExcel(query: SidataAsnListQuery) {
    return apiClient.download('/sidata/asn/export', buildSidataAsnExcelFileName(), {
      q: query.q,
      unitKerjaId: query.unitKerjaId,
      statusAsn: query.statusAsn,
      jenisAsn: query.jenisAsn,
      syncStatus: query.syncStatus,
    });
  },

  getUnits(): Promise<SidataUnitKerja[]> {
    return apiClient.get<SidataUnitKerja[]>('/sidata/units');
  },

  getUnitTree(): Promise<SidataUnitTreeNode[]> {
    return apiClient.get<SidataUnitTreeNode[]>('/sidata/units/tree');
  },

  getRekapAsn(): Promise<RekapAsnResponse> {
    return apiClient.get<RekapAsnResponse>('/sidata/rekap');
  },

  getRekapIkhtisar(): Promise<RekapIkhtisarResponse> {
    return apiClient.get<RekapIkhtisarResponse>('/sidata/rekap/ikhtisar');
  },

  getRekapPns(): Promise<RekapPnsResponse> {
    return apiClient.get<RekapPnsResponse>('/sidata/rekap/pns');
  },

  getRekapPppk(): Promise<RekapPppkResponse> {
    return apiClient.get<RekapPppkResponse>('/sidata/rekap/pppk');
  },
};

function buildSidataAsnExcelFileName() {
  return `sidata-asn-${new Date().toISOString().slice(0, 10)}.xlsx`;
}
