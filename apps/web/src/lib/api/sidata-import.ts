import { apiClient } from './client';

export type SiasnImportBatch = {
  id: string;
  source: string;
  importType: string;
  fileName: string | null;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warningRows: number;
  importedById: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SiasnImportSummary = {
  batchId: string;
  batchType: 'ASN' | 'REFERENCE';
  source: string;
  importType: string;
  fileName: string | null;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warningRows: number;
  mappedRows: number;
  needsReviewRows: number;
  unmappedRows: number;
  committedRows: number;
  existingAsnRows?: number;
  createdAt: string;
  updatedAt: string;
};

export type SiasnImportIssueRow = {
  id: string;
  rowNumber: number;
  nip: string | null;
  nama: string | null;
  unitOrganisasiNama: string | null;
  jabatanNama: string | null;
  golonganNama: string | null;
  jenisAsnNama: string | null;
  statusAsnNama: string | null;
  mappingStatus: string;
  validationStatus: string;
  validationErrors: unknown;
  matchedAsnId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedIssues = {
  items: SiasnImportIssueRow[];
  page: number;
  limit: number;
  total: number;
};

export type SiasnAsnUploadResult = {
  batchId: string;
  importType: string;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warningRows: number;
};

export type MapBatchResult = {
  batchId: string;
  totalRows: number;
  mappedRows: number;
  needsReviewRows: number;
  unmappedRows: number;
  invalidRows: number;
  existingAsnRows: number;
  missingReferenceRows: number;
};

export type RemapBatchResult = MapBatchResult & {
  remapped: boolean;
};

export type CommitBatchResult = {
  batchId: string;
  status: string;
  totalRows: number;
  eligibleRows: number;
  committedRows: number;
  createdRows: number;
  updatedRows: number;
  skippedRows: number;
  invalidRows: number;
  needsReviewRows: number;
  unmappedRows: number;
};

export type ImportJobResult = {
  jobId: string;
  batchId: string;
  action: 'MAP_ASN' | 'REMAP_ASN' | 'COMMIT_ASN';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  batchStatus: string;
  message: string;
  mappedRows?: number;
  needsReviewRows?: number;
  unmappedRows?: number;
  committedRows?: number;
  createdRows?: number;
  updatedRows?: number;
};

export type ExtractReferencesResult = {
  batchId: string;
  extracted: {
    agama: number;
    statusKawin: number;
    jenisKelamin: number;
    jenisAsn: number;
    kedudukanHukum: number;
    golongan: number;
    pendidikanTingkat: number;
    pendidikan: number;
    jenisJabatan: number;
    jabatan: number;
  };
  totalExtracted: number;
};

export type ResolveUnitKerjaMappingPayload = {
  unitKerjaId: string;
  note?: string;
};

export type ReconciliationType =
  | 'ONLY_IN_BATCH'
  | 'ONLY_IN_MASTER'
  | 'DIFFERENT'
  | 'SAME';

export type ReconciliationFieldDiff = {
  field: 'unitKerja' | 'jabatan' | 'golongan' | 'statusAsn';
  label: string;
  master: string | null;
  batch: string | null;
};

export type ReconciliationRow = {
  key: string;
  type: ReconciliationType;
  nip: string | null;
  nama: string | null;
  batch: {
    rowId: string;
    rowNumber: number;
    nama: string | null;
    unitKerjaId: string | null;
    unitKerjaNama: string | null;
    jabatanNama: string | null;
    golonganNama: string | null;
    statusAsn: string | null;
    mappingStatus: string;
    validationStatus: string;
  } | null;
  master: {
    asnId: string;
    nama: string;
    unitKerjaId: string | null;
    unitKerjaNama: string | null;
    jabatanNama: string | null;
    golonganNama: string | null;
    statusAsn: string | null;
  } | null;
  diffs: ReconciliationFieldDiff[];
};

export type ReconciliationSummary = {
  batchId: string;
  totalBatchRows: number;
  totalMasterRows: number;
  onlyInBatch: number;
  onlyInMaster: number;
  different: number;
  same: number;
  attentionRows: number;
};

export type ReconciliationResponse = {
  summary: ReconciliationSummary;
  items: ReconciliationRow[];
  page: number;
  limit: number;
  total: number;
};

type IssueQueryParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
};

type ReconciliationQueryParams = {
  page?: number;
  limit?: number;
  q?: string;
  type?: ReconciliationType | '';
};

export const sidataImportApi = {
  uploadAsnFile(file: File, tipePegawai: string): Promise<SiasnAsnUploadResult> {
    const form = new FormData();
    form.append('file', file);
    form.append('tipePegawai', tipePegawai);
    return apiClient.upload<SiasnAsnUploadResult>('/sidata/import/asn/upload', form);
  },

  listAsnBatches(): Promise<SiasnImportBatch[]> {
    return apiClient.get<SiasnImportBatch[]>('/sidata/import/asn-batches');
  },

  getAsnBatch(id: string): Promise<SiasnImportBatch> {
    return apiClient.get<SiasnImportBatch>(`/sidata/import/asn-batches/${id}`);
  },

  getAsnBatchSummary(id: string): Promise<SiasnImportSummary> {
    return apiClient.get<SiasnImportSummary>(`/sidata/import/asn-batches/${id}/summary`);
  },

  mapAsnBatch(id: string): Promise<ImportJobResult> {
    return apiClient.post<ImportJobResult>(`/sidata/import/asn-batches/${id}/map`);
  },

  remapAsnBatch(id: string): Promise<ImportJobResult> {
    return apiClient.post<ImportJobResult>(`/sidata/import/asn-batches/${id}/remap`);
  },

  commitAsnBatch(id: string): Promise<ImportJobResult> {
    return apiClient.post<ImportJobResult>(`/sidata/import/asn-batches/${id}/commit`);
  },

  extractReferences(id: string): Promise<ExtractReferencesResult> {
    return apiClient.post<ExtractReferencesResult>(
      `/sidata/import/asn-batches/${id}/extract-references`,
    );
  },

  getAsnReconciliation(
    id: string,
    params?: ReconciliationQueryParams,
  ): Promise<ReconciliationResponse> {
    return apiClient.get<ReconciliationResponse>(
      `/sidata/import/asn-batches/${id}/reconciliation`,
      {
        page: params?.page,
        limit: params?.limit,
        q: params?.q,
        type: params?.type || undefined,
      },
    );
  },

  getAsnIssues(id: string, params?: IssueQueryParams): Promise<PaginatedIssues> {
    return apiClient.get<PaginatedIssues>(`/sidata/import/asn-batches/${id}/issues`, {
      page: params?.page,
      limit: params?.limit,
      q: params?.q,
      status: params?.status,
    });
  },

  exportAsnIssuesCsv(id: string, params?: IssueQueryParams) {
    return apiClient.download(
      `/sidata/import/asn-batches/${id}/export-issues`,
      `sidata-asn-issues-${id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`,
      {
        q: params?.q,
        status: params?.status,
      },
    );
  },

  resolveUnitKerjaMapping(
    batchId: string,
    rowId: string,
    payload: ResolveUnitKerjaMappingPayload,
  ): Promise<SiasnImportIssueRow> {
    return apiClient.post<SiasnImportIssueRow>(
      `/sidata/import/asn-batches/${batchId}/issues/${rowId}/resolve-unit-kerja`,
      payload,
    );
  },

  getAsnNeedsReview(id: string, params?: IssueQueryParams): Promise<PaginatedIssues> {
    return apiClient.get<PaginatedIssues>(`/sidata/import/asn-batches/${id}/needs-review`, {
      page: params?.page,
      limit: params?.limit,
      q: params?.q,
    });
  },

  getAsnInvalid(id: string, params?: IssueQueryParams): Promise<PaginatedIssues> {
    return apiClient.get<PaginatedIssues>(`/sidata/import/asn-batches/${id}/invalid`, {
      page: params?.page,
      limit: params?.limit,
      q: params?.q,
    });
  },

  cancelAsnBatch(id: string): Promise<{ batchId: string; status: string }> {
    return apiClient.post(`/sidata/import/asn-batches/${id}/cancel`);
  },
};
