export const SIDATA_IMPORT_SOURCE = {
  SIASN: 'SIASN',
} as const;

export const SIDATA_IMPORT_TYPE = {
  SIASN_REFERENCE_JABATAN_STRUKTURAL: 'SIASN_REFERENCE_JABATAN_STRUKTURAL',
  SIASN_REFERENCE_JABATAN_FUNGSIONAL: 'SIASN_REFERENCE_JABATAN_FUNGSIONAL',
  SIASN_REFERENCE_JABATAN_PELAKSANA: 'SIASN_REFERENCE_JABATAN_PELAKSANA',
  SIASN_REFERENCE_JF_PROFILE: 'SIASN_REFERENCE_JF_PROFILE',
} as const;

export const SIDATA_IMPORT_STATUS = {
  UPLOADED: 'UPLOADED',
  PROCESSING: 'PROCESSING',
  VALIDATED: 'VALIDATED',
  COMMITTED: 'COMMITTED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export const SIDATA_MAPPING_STATUS = {
  UNMAPPED: 'UNMAPPED',
  MAPPED: 'MAPPED',
  IGNORED: 'IGNORED',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
} as const;

export const SIDATA_VALIDATION_STATUS = {
  VALID: 'VALID',
  INVALID: 'INVALID',
  WARNING: 'WARNING',
} as const;

export const SIDATA_REFERENCE_TYPE = {
  JABATAN_STRUKTURAL: 'JABATAN_STRUKTURAL',
  JABATAN_FUNGSIONAL: 'JABATAN_FUNGSIONAL',
  JABATAN_PELAKSANA: 'JABATAN_PELAKSANA',
  JF_PROFILE: 'JF_PROFILE',
} as const;

export const SIDATA_JENIS_JABATAN = {
  STRUKTURAL: 'STRUKTURAL',
  FUNGSIONAL: 'FUNGSIONAL',
  PELAKSANA: 'PELAKSANA',
} as const;

export type SidataJenisJabatan =
  (typeof SIDATA_JENIS_JABATAN)[keyof typeof SIDATA_JENIS_JABATAN];

export type SidataImportType =
  (typeof SIDATA_IMPORT_TYPE)[keyof typeof SIDATA_IMPORT_TYPE];

export type SidataReferenceType =
  (typeof SIDATA_REFERENCE_TYPE)[keyof typeof SIDATA_REFERENCE_TYPE];

export type SidataValidationStatus =
  (typeof SIDATA_VALIDATION_STATUS)[keyof typeof SIDATA_VALIDATION_STATUS];

export type SidataUploadReferenceJabatanDto = {
  jenisJabatan?: string;
};

export type SidataBufferedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type ParsedReferenceJabatanRow = {
  rowNumber: number;
  sourceCode: string | null;
  sourceName: string | null;
  sourceDescription: string | null;
  jenjang: string | null;
  bup: string | null;
  rawData: Record<string, unknown>;
};

export type ValidatedReferenceJabatanRow = ParsedReferenceJabatanRow & {
  validationStatus: SidataValidationStatus;
  validationErrors: string[];
  isDuplicate: boolean;
};

export type ReferenceJabatanUploadResult = {
  batchId: string;
  importType: SidataImportType;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warningRows: number;
};

export type CommitReferenceJabatanResult = {
  batchId: string;
  status: string;
  totalRows: number;
  committedRows: number;
  skippedRows: number;
  createdRows: number;
  updatedRows: number;
  invalidRows: number;
  mappedRows: number;
};

export type CommitReferenceJabatanRowResult = {
  stagingId: string;
  refJabatanId: string | null;
  action: 'CREATED' | 'UPDATED' | 'SKIPPED';
  reason?: string;
};

export const SIDATA_COMMIT_ACTION = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  SKIPPED: 'SKIPPED',
} as const;

// ─── Phase 3B: JF Profile Types ───────────────────────────────────────────────

export type ParsedJfProfileRow = {
  rowNumber: number;
  namaJabatan: string | null;
  jenjang: string | null;
  namaLengkap: string | null;
  rawData: Record<string, unknown>;
};

export type ValidatedJfProfileRow = ParsedJfProfileRow & {
  validationStatus: SidataValidationStatus;
  validationErrors: string[];
  isDuplicate: boolean;
  sourceName: string;
  sourceDescription: string | null;
};

export type CommitJfProfileResult = {
  batchId: string;
  status: string;
  totalRows: number;
  committedRows: number;
  matchedRows: number;
  unmatchedRows: number;
  createdRows: number;
  updatedRows: number;
  skippedRows: number;
  invalidRows: number;
};

// ─── Phase 4: Generic Reference Types ─────────────────────────────────────────

export const SIDATA_REFERENCE_MASTER_TARGET = {
  REF_JABATAN: 'ref_jabatan',
  REF_UNIT_ORGANISASI: 'ref_unit_organisasi',
  REF_GOLONGAN: 'ref_golongan',
  REF_PANGKAT: 'ref_pangkat',
  REF_PENDIDIKAN: 'ref_pendidikan',
  REF_AGAMA: 'ref_agama',
  REF_JENIS_KELAMIN: 'ref_jenis_kelamin',
  REF_STATUS_KAWIN: 'ref_status_kawin',
  REF_KEDUDUKAN_HUKUM: 'ref_kedudukan_hukum',
  REF_JENIS_ASN: 'ref_jenis_asn',
} as const;

export const SIDATA_GENERIC_REFERENCE_TYPE = {
  UNIT_ORGANISASI: 'UNIT_ORGANISASI',
  GOLONGAN: 'GOLONGAN',
  PANGKAT: 'PANGKAT',
  PENDIDIKAN: 'PENDIDIKAN',
  AGAMA: 'AGAMA',
  JENIS_KELAMIN: 'JENIS_KELAMIN',
  STATUS_KAWIN: 'STATUS_KAWIN',
  KEDUDUKAN_HUKUM: 'KEDUDUKAN_HUKUM',
  JENIS_ASN: 'JENIS_ASN',
} as const;

export const SIDATA_GENERIC_IMPORT_TYPE = {
  SIASN_REFERENCE_UNIT_ORGANISASI: 'SIASN_REFERENCE_UNIT_ORGANISASI',
  SIASN_REFERENCE_GOLONGAN: 'SIASN_REFERENCE_GOLONGAN',
  SIASN_REFERENCE_PANGKAT: 'SIASN_REFERENCE_PANGKAT',
  SIASN_REFERENCE_PENDIDIKAN: 'SIASN_REFERENCE_PENDIDIKAN',
  SIASN_REFERENCE_AGAMA: 'SIASN_REFERENCE_AGAMA',
  SIASN_REFERENCE_JENIS_KELAMIN: 'SIASN_REFERENCE_JENIS_KELAMIN',
  SIASN_REFERENCE_STATUS_KAWIN: 'SIASN_REFERENCE_STATUS_KAWIN',
  SIASN_REFERENCE_KEDUDUKAN_HUKUM: 'SIASN_REFERENCE_KEDUDUKAN_HUKUM',
  SIASN_REFERENCE_JENIS_ASN: 'SIASN_REFERENCE_JENIS_ASN',
} as const;

export type SidataGenericReferenceType =
  (typeof SIDATA_GENERIC_REFERENCE_TYPE)[keyof typeof SIDATA_GENERIC_REFERENCE_TYPE];

export type SidataReferenceMasterTarget =
  (typeof SIDATA_REFERENCE_MASTER_TARGET)[keyof typeof SIDATA_REFERENCE_MASTER_TARGET];

export type SidataGenericReferenceUploadDto = {
  referenceType?: string;
};

export type GenericReferenceConfig = {
  referenceType: SidataGenericReferenceType;
  importType: string;
  targetTable: SidataReferenceMasterTarget;
  label: string;
};

export type CommitGenericReferenceResult = {
  batchId: string;
  status: string;
  targetTable: string;
  totalRows: number;
  committedRows: number;
  skippedRows: number;
  createdRows: number;
  updatedRows: number;
  invalidRows: number;
  mappedRows: number;
};

// ─── Phase 5: ASN Import Types ────────────────────────────────────────────────

export const SIDATA_ASN_IMPORT_TYPE = {
  SIASN_ASN: 'SIASN_ASN',
  SIASN_ASN_PNS: 'SIASN_ASN_PNS',
  SIASN_ASN_PPPK: 'SIASN_ASN_PPPK',
  SIASN_ASN_PPPK_PARUH_WAKTU: 'SIASN_ASN_PPPK_PARUH_WAKTU',
} as const;

export const SIDATA_ASN_TIPE_PEGAWAI = {
  PNS: 'PNS',
  PPPK: 'PPPK',
  PPPK_PARUH_WAKTU: 'PPPK_PARUH_WAKTU',
} as const;

export type SidataAsnTipePegawai =
  (typeof SIDATA_ASN_TIPE_PEGAWAI)[keyof typeof SIDATA_ASN_TIPE_PEGAWAI];

export const SIDATA_ASN_MAPPING_STATUS = {
  UNMAPPED: 'UNMAPPED',
  MATCHED: 'MATCHED',
  UNMATCHED: 'UNMATCHED',
  DUPLICATE: 'DUPLICATE',
} as const;

export type SidataAsnUploadDto = {
  tipePegawai?: string;
  note?: string;
};

export type ParsedSiasnAsnRow = {
  rowNumber: number;
  nip: string | null;
  nipLama: string | null;
  nama: string | null;
  namaJabatan: string | null;
  jenisJabatan: string | null;
  kdJabatan: string | null;
  kdJabatanSiasn: string | null;
  tmtJabatan: Date | null;
  namaGolongan: string | null;
  namaRuang: string | null;
  kdGolongan: string | null;
  kdGolonganSiasn: string | null;
  tmtGolongan: Date | null;
  masaKerjaGolongan: string | null;
  masaKerjaSeluruh: string | null;
  namaUnorEselon1: string | null;
  namaUnorEselon2: string | null;
  namaUnorEselon3: string | null;
  namaUnorEselon4: string | null;
  kdUnor: string | null;
  tempatLahir: string | null;
  tanggalLahir: Date | null;
  jenisKelamin: string | null;
  agama: string | null;
  statusKawin: string | null;
  pendidikanTerakhir: string | null;
  namaSekolah: string | null;
  tmtPns: Date | null;
  tmtPensiun: Date | null;
  statusKepegawaian: string | null;
  jenisAsn: string | null;
  kedudukanHukum: string | null;
  noSk: string | null;
  tanggalSk: Date | null;
  rawData: Record<string, unknown>;
};

export type ValidatedSiasnAsnRow = ParsedSiasnAsnRow & {
  validationStatus: SidataValidationStatus;
  validationErrors: string[];
  isDuplicate: boolean;
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

export type SiasnAsnBatchResponse = {
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

export type SiasnAsnStagingResponse = {
  id: string;
  batchId: string;
  rowNumber: number;
  nip: string | null;
  nama: string | null;
  namaJabatan: string | null;
  namaGolongan: string | null;
  namaUnorEselon1: string | null;
  validationStatus: string;
  validationErrors: unknown;
  mappingStatus: string;
  matchedAsnId: string | null;
  rawData: unknown;
  createdAt: string;
  updatedAt: string;
};

// ─── Phase 6: ASN Mapping Types ───────────────────────────────────────────────

export const SIDATA_ASN_MAP_STATUS = {
  MAPPED: 'MAPPED',
  UNMAPPED: 'UNMAPPED',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  IGNORED: 'IGNORED',
} as const;

export type SidataAsnMappedData = {
  unitKerjaId: string | null;
  jabatanId: string | null;
  golonganId: string | null;
  pangkatId: string | null;
  jenisAsnId: string | null;
  kedudukanHukumId: string | null;
  jenisKelaminId: string | null;
  agamaId: string | null;
  statusKawinId: string | null;
  pendidikanId: string | null;
};

export type SidataAsnReferenceLookupResult = {
  id: string | null;
  status: 'FOUND' | 'NOT_FOUND' | 'EMPTY';
  by: 'CODE' | 'NAME' | 'NONE';
};

export type SidataAsnRowMappingResult = {
  rowId: string;
  rowNumber: number;
  nip: string | null;
  nama: string | null;
  mappingStatus: string;
  validationStatus: string;
  validationErrors: string[];
  mappedData: SidataAsnMappedData;
  matchedAsnId: string | null;
};

export type MapSiasnAsnBatchResult = {
  batchId: string;
  totalRows: number;
  mappedRows: number;
  needsReviewRows: number;
  unmappedRows: number;
  invalidRows: number;
  existingAsnRows: number;
  missingReferenceRows: number;
};

// ─── Phase 7: ASN Commit Types ────────────────────────────────────────────────

export const SIDATA_ASN_COMMIT_ACTION = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  SKIPPED: 'SKIPPED',
} as const;

export type CommitSiasnAsnBatchResult = {
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

export type CommitSiasnAsnRowResult = {
  stagingId: string;
  rowNumber: number;
  nip: string | null;
  asnId: string | null;
  action: 'CREATED' | 'UPDATED' | 'SKIPPED';
  reason?: string;
};

export type SiasnAsnMappedDataForCommit = {
  unitKerjaId?: string | null;
  jabatanId?: string | null;
  golonganId?: string | null;
  pangkatId?: string | null;
  jenisAsnId?: string | null;
  kedudukanHukumId?: string | null;
  jenisKelaminId?: string | null;
  agamaId?: string | null;
  statusKawinId?: string | null;
  pendidikanId?: string | null;
};

// ─── Phase 8: Audit & Review Types ────────────────────────────────────────────

export const SIDATA_IMPORT_AUDIT_ACTION = {
  UPLOAD_REFERENCE: 'UPLOAD_REFERENCE',
  COMMIT_REFERENCE: 'COMMIT_REFERENCE',
  UPLOAD_ASN: 'UPLOAD_ASN',
  MAP_ASN: 'MAP_ASN',
  COMMIT_ASN: 'COMMIT_ASN',
  REMAP_ASN: 'REMAP_ASN',
  VIEW_ISSUES: 'VIEW_ISSUES',
  EXTRACT_REFERENCES: 'EXTRACT_REFERENCES',
  CANCEL_BATCH: 'CANCEL_BATCH',
} as const;

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
  };
  totalExtracted: number;
};

export type SidataImportAuditAction =
  (typeof SIDATA_IMPORT_AUDIT_ACTION)[keyof typeof SIDATA_IMPORT_AUDIT_ACTION];

export type SidataImportSummaryResponse = {
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

export type SidataStagingQueryDto = {
  page?: string;
  limit?: string;
};

export type SidataImportIssueQueryDto = {
  page?: string;
  limit?: string;
  status?: string;
  q?: string;
};

export type SidataAsnReconciliationQueryDto = {
  page?: string;
  limit?: string;
  type?: string;
  q?: string;
};

export type NormalizedSidataImportIssueQuery = {
  page: number;
  limit: number;
  status?: string;
  q?: string;
};

export type SidataAsnImportIssueRow = {
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

export type PaginatedImportIssuesResponse = {
  items: SidataAsnImportIssueRow[];
  page: number;
  limit: number;
  total: number;
};

export type SidataAsnReconciliationType =
  | 'ONLY_IN_BATCH'
  | 'ONLY_IN_MASTER'
  | 'DIFFERENT'
  | 'SAME';

export type SidataAsnReconciliationFieldDiff = {
  field: 'unitKerja' | 'jabatan' | 'golongan' | 'statusAsn';
  label: string;
  master: string | null;
  batch: string | null;
};

export type SidataAsnReconciliationRow = {
  key: string;
  type: SidataAsnReconciliationType;
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
  diffs: SidataAsnReconciliationFieldDiff[];
};

export type SidataAsnReconciliationSummary = {
  batchId: string;
  totalBatchRows: number;
  totalMasterRows: number;
  onlyInBatch: number;
  onlyInMaster: number;
  different: number;
  same: number;
  attentionRows: number;
};

export type SidataAsnReconciliationResponse = {
  summary: SidataAsnReconciliationSummary;
  items: SidataAsnReconciliationRow[];
  page: number;
  limit: number;
  total: number;
};

export type PaginatedStagingResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type SidataImportAuditPayload = {
  action: SidataImportAuditAction;
  batchId: string;
  batchType: 'ASN' | 'REFERENCE';
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

export type RemapSiasnAsnBatchResult = MapSiasnAsnBatchResult & {
  remapped: boolean;
};

export type SidataImportJobAction = 'MAP_ASN' | 'REMAP_ASN' | 'COMMIT_ASN';

export type SidataImportJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type SidataImportJobResponse = {
  jobId: string;
  batchId: string;
  action: SidataImportJobAction;
  status: SidataImportJobStatus;
  batchStatus: string;
  message: string;
};

// ─── Phase 11A: Audit Log Query Types ─────────────────────────────────────────

export type SidataAuditLogQueryDto = {
  batchId?: string;
  batchType?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
};

export type NormalizedAuditLogFilters = {
  batchId?: string;
  batchType?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
};

export type AuditLogRow = {
  id: string;
  batchId: string | null;
  batchType: string | null;
  action: string;
  actorId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type PaginatedAuditLogResponse = {
  items: AuditLogRow[];
  page: number;
  limit: number;
  total: number;
};
