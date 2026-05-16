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
}>;

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
  breakdown: {
    byStatusAsn: SidataAsnQualityBreakdownItem[];
    byJenisAsn: SidataAsnQualityBreakdownItem[];
  };
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
    });
  },

  getUnits(): Promise<SidataUnitKerja[]> {
    return apiClient.get<SidataUnitKerja[]>('/sidata/units');
  },

  getUnitTree(): Promise<SidataUnitTreeNode[]> {
    return apiClient.get<SidataUnitTreeNode[]>('/sidata/units/tree');
  },
};

function buildSidataAsnExcelFileName() {
  return `sidata-asn-${new Date().toISOString().slice(0, 10)}.xlsx`;
}
