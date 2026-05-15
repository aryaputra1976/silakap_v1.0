import { ApiError } from '@/lib/api/client';
import type { PaginatedResult } from '@/lib/api/types';

export type SidataBatchKind = 'ASN' | 'REFERENCE';

export type SidataImportBatch = {
  id: string;
  fileName?: string | null;
  originalFileName?: string | null;
  importType?: string | null;
  referenceType?: string | null;
  jenisJabatan?: string | null;
  source?: string | null;
  status?: string | null;
  totalRows?: number | null;
  validRows?: number | null;
  invalidRows?: number | null;
  warningRows?: number | null;
  mappedRows?: number | null;
  needsReviewRows?: number | null;
  unmappedRows?: number | null;
  committedRows?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SidataImportBatchWithKind = SidataImportBatch & {
  kind: SidataBatchKind;
};

export type SidataImportSummary = {
  totalRows?: number | null;
  validRows?: number | null;
  invalidRows?: number | null;
  warningRows?: number | null;
  mappedRows?: number | null;
  needsReviewRows?: number | null;
  unmappedRows?: number | null;
  committedRows?: number | null;
};

export type SidataImportIssueRow = {
  id?: string | null;
  rowNumber: number;
  nip?: string | null;
  nama?: string | null;
  unitOrganisasiNama?: string | null;
  jabatanNama?: string | null;
  golonganNama?: string | null;
  jenisAsnNama?: string | null;
  mappingStatus?: string | null;
  validationStatus?: string | null;
  validationErrors?: string[] | string | null;
};

export type SidataUploadResponse = {
  batch?: SidataImportBatch;
  id?: string;
  batchId?: string;
  fileName?: string;
  status?: string;
  message?: string;
};

export type SidataActionResult = {
  success?: boolean;
  message?: string;
  batch?: SidataImportBatch;
  summary?: SidataImportSummary;
  updated?: number;
  committed?: number;
  skipped?: number;
};

export type SidataBatchListResponse =
  | SidataImportBatch[]
  | PaginatedResult<SidataImportBatch>;

export type SidataIssueListResponse =
  | SidataImportIssueRow[]
  | PaginatedResult<SidataImportIssueRow>;

export type SidataQualityTone = 'success' | 'warning' | 'danger';

export type SidataImportMetricKey =
  | 'totalRows'
  | 'validRows'
  | 'invalidRows'
  | 'warningRows'
  | 'mappedRows'
  | 'needsReviewRows'
  | 'unmappedRows'
  | 'committedRows';

export type SidataImportAggregate = {
  totalBatch: number;
  asnBatch: number;
  referenceBatch: number;
  committedBatch: number;
  failedBatch: number;
  problemBatch: number;
  notCommittedBatch: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;
  mappedRows: number;
  needsReviewRows: number;
  unmappedRows: number;
  committedRows: number;
  qualityScore: number;
};

export function normalizeList<T>(response: T[] | PaginatedResult<T>): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  return response.items;
}

export function getPaginationMeta<T>(
  response: T[] | PaginatedResult<T>,
  fallbackLimit = 20,
) {
  if (Array.isArray(response)) {
    return {
      page: 1,
      limit: response.length || fallbackLimit,
      total: response.length,
    };
  }

  return {
    page: response.page,
    limit: response.limit,
    total: response.total,
  };
}

export function toNumber(value: number | null | undefined) {
  return value ?? 0;
}

export function shortId(id: string) {
  if (id.length <= 12) {
    return id;
  }

  return `${id.slice(0, 8)}…`;
}

export function getErrorMessage(caught: unknown, fallback: string) {
  return caught instanceof ApiError ? caught.message : fallback;
}

export function getBatchFileName(batch: SidataImportBatch) {
  return batch.originalFileName ?? batch.fileName ?? '-';
}

export function getBatchTypeLabel(batch: SidataImportBatchWithKind) {
  if (batch.kind === 'ASN') {
    return batch.source ?? batch.importType ?? 'SIASN';
  }

  return batch.jenisJabatan ?? batch.referenceType ?? batch.importType ?? 'REFERENCE';
}

export function sortByCreatedAtDesc<
  T extends {
    createdAt?: string | null;
  },
>(left: T, right: T) {
  const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
  const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;

  return rightTime - leftTime;
}

export function normalizeSearchValue(value: string | null | undefined) {
  return (value ?? '').toLowerCase();
}

export function isCommitted(batch: SidataImportBatch) {
  return (batch.status ?? '').toUpperCase() === 'COMMITTED';
}

export function isFailed(batch: SidataImportBatch) {
  return (batch.status ?? '').toUpperCase() === 'FAILED';
}

export function isProblemBatch(batch: SidataImportBatch) {
  return (
    isFailed(batch) ||
    toNumber(batch.invalidRows) > 0 ||
    toNumber(batch.warningRows) > 0 ||
    toNumber(batch.needsReviewRows) > 0 ||
    toNumber(batch.unmappedRows) > 0
  );
}

export function needsReviewBatch(batch: SidataImportBatch) {
  return isProblemBatch(batch) || !isCommitted(batch);
}

export function sumRows(
  items: SidataImportBatch[],
  key: SidataImportMetricKey,
) {
  return items.reduce((total, item) => total + toNumber(item[key]), 0);
}

export function calculateQualityScore(items: SidataImportBatch[]) {
  const totalRows = sumRows(items, 'totalRows');
  const issueRows =
    sumRows(items, 'invalidRows') +
    sumRows(items, 'warningRows') +
    sumRows(items, 'needsReviewRows') +
    sumRows(items, 'unmappedRows');

  if (totalRows <= 0) {
    return 0;
  }

  return Math.max(0, Math.round(((totalRows - issueRows) / totalRows) * 100));
}

export function getQualityTone(score: number): SidataQualityTone {
  if (score >= 90) {
    return 'success';
  }

  if (score >= 70) {
    return 'warning';
  }

  return 'danger';
}

export function buildImportAggregate(
  batches: SidataImportBatchWithKind[],
): SidataImportAggregate {
  const totalBatch = batches.length;
  const asnBatch = batches.filter((item) => item.kind === 'ASN').length;
  const referenceBatch = batches.filter((item) => item.kind === 'REFERENCE').length;
  const committedBatch = batches.filter(isCommitted).length;
  const failedBatch = batches.filter(isFailed).length;
  const problemBatch = batches.filter(isProblemBatch).length;

  return {
    totalBatch,
    asnBatch,
    referenceBatch,
    committedBatch,
    failedBatch,
    problemBatch,
    notCommittedBatch: totalBatch - committedBatch,
    totalRows: sumRows(batches, 'totalRows'),
    validRows: sumRows(batches, 'validRows'),
    invalidRows: sumRows(batches, 'invalidRows'),
    warningRows: sumRows(batches, 'warningRows'),
    mappedRows: sumRows(batches, 'mappedRows'),
    needsReviewRows: sumRows(batches, 'needsReviewRows'),
    unmappedRows: sumRows(batches, 'unmappedRows'),
    committedRows: sumRows(batches, 'committedRows'),
    qualityScore: calculateQualityScore(batches),
  };
}

export function mergeImportBatches(
  asnResponse: SidataBatchListResponse,
  referenceResponse: SidataBatchListResponse,
) {
  const asnBatches: SidataImportBatchWithKind[] = normalizeList(asnResponse).map(
    (item) => ({
      ...item,
      kind: 'ASN' as const,
    }),
  );

  const referenceBatches: SidataImportBatchWithKind[] =
    normalizeList(referenceResponse).map((item) => ({
      ...item,
      kind: 'REFERENCE' as const,
    }));

  return [...asnBatches, ...referenceBatches].sort(sortByCreatedAtDesc);
}

export function normalizeIssueErrors(
  value: string[] | string | null | undefined,
) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
  } catch {
    return [value];
  }

  return [value];
}

export function matchesIssueSearch(
  issue: SidataImportIssueRow,
  query: string,
) {
  const q = query.trim().toLowerCase();

  if (!q) {
    return true;
  }

  const searchable = [
    String(issue.rowNumber),
    issue.nip,
    issue.nama,
    issue.unitOrganisasiNama,
    issue.jabatanNama,
    issue.golonganNama,
    issue.jenisAsnNama,
    issue.mappingStatus,
    issue.validationStatus,
    normalizeIssueErrors(issue.validationErrors).join(' '),
  ]
    .map(normalizeSearchValue)
    .join(' ');

  return searchable.includes(q);
}

export function getCommitBlockReason(summary: SidataImportSummary | null) {
  if (!summary) {
    return 'Summary batch belum tersedia.';
  }

  const reasons: string[] = [];

  if (toNumber(summary.invalidRows) > 0) {
    reasons.push(`${toNumber(summary.invalidRows)} baris invalid`);
  }

  if (toNumber(summary.needsReviewRows) > 0) {
    reasons.push(`${toNumber(summary.needsReviewRows)} baris perlu review`);
  }

  if (toNumber(summary.unmappedRows) > 0) {
    reasons.push(`${toNumber(summary.unmappedRows)} baris belum termapping`);
  }

  if (toNumber(summary.mappedRows) <= 0) {
    reasons.push('belum ada baris mapped');
  }

  return reasons.join(', ') || 'Batch siap commit.';
}

export function isCommitSafe(summary: SidataImportSummary | null) {
  if (!summary) {
    return false;
  }

  return (
    toNumber(summary.invalidRows) === 0 &&
    toNumber(summary.needsReviewRows) === 0 &&
    toNumber(summary.unmappedRows) === 0 &&
    toNumber(summary.mappedRows) > 0
  );
}
