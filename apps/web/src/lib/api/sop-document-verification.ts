import {
  dmsApi,
  type DmsDocument,
  type DmsDocumentCategory,
  type DmsDocumentStatus,
} from '@/lib/api/dms';

export type AsnDocumentVerificationStatus =
  | 'LENGKAP'
  | 'PERLU_PERBAIKAN'
  | 'BELUM_LENGKAP'
  | 'BELUM_TERKAIT_ASN';

export interface SopDocumentVerificationQuery {
  q?: string;
  year?: string;
  month?: string;
  quarter?: string;
  category?: DmsDocumentCategory | '';
  status?: DmsDocumentStatus | '';
  unitKerjaId?: string;
  asnId?: string;
  page?: number;
  limit?: number;
}

export interface SopDocumentVerificationSummary {
  totalDocuments: number;
  totalAsn: number;
  verifiedDocuments: number;
  rejectedDocuments: number;
  uploadedOrSubmittedDocuments: number;
  documentsWithFile: number;
  documentsWithoutFile: number;
  documentsLinkedToAsn: number;
  documentsWithoutAsn: number;
  completeAsn: number;
  needRevisionAsn: number;
  incompleteAsn: number;
  averageCompletenessPercent: number;
}

export interface SopDocumentVerificationRow {
  asnId: string;
  nip: string;
  name: string;
  unitKerjaName: string;
  totalDocuments: number;
  verifiedDocuments: number;
  rejectedDocuments: number;
  uploadedOrSubmittedDocuments: number;
  documentsWithFile: number;
  documentsWithoutFile: number;
  completenessPercent: number;
  status: AsnDocumentVerificationStatus;
  latestUpdatedAt: string | null;
  documents: DmsDocument[];
}

export interface SopDocumentVerificationResult {
  documents: DmsDocument[];
  rows: SopDocumentVerificationRow[];
  summary: SopDocumentVerificationSummary;
}

const TEMP_REQUIRED_DOCUMENT_COUNT = 20;

export async function getSopDocumentVerification(
  query: SopDocumentVerificationQuery = {},
): Promise<SopDocumentVerificationResult> {
  const response = await dmsApi.listDocuments({
    q: buildVerificationSearchQuery(query.q),
    category: query.category,
    status: query.status,
    unitKerjaId: query.unitKerjaId,
    asnId: query.asnId,
    year: query.year,
    month: query.month,
    quarter: query.quarter,
    page: query.page ?? 1,
    limit: query.limit ?? 100,
  });

  const documents = response.items;
  const rows = buildVerificationRows(documents);
  const summary = buildVerificationSummary(documents, rows);

  return { documents, rows, summary };
}

export function buildVerificationSearchQuery(q?: string): string {
  const normalized = q?.trim();
  return normalized || '';
}

export function buildVerificationRows(documents: DmsDocument[]): SopDocumentVerificationRow[] {
  const grouped = new Map<string, DmsDocument[]>();

  documents.forEach((document) => {
    if (!document.asnId) return;
    const current = grouped.get(document.asnId) ?? [];
    current.push(document);
    grouped.set(document.asnId, current);
  });

  return Array.from(grouped.entries())
    .map(([asnId, asnDocuments]) => buildVerificationRow(asnId, asnDocuments))
    .sort((left, right) => {
      if (!left.latestUpdatedAt && !right.latestUpdatedAt) return left.name.localeCompare(right.name);
      if (!left.latestUpdatedAt) return 1;
      if (!right.latestUpdatedAt) return -1;
      return new Date(right.latestUpdatedAt).getTime() - new Date(left.latestUpdatedAt).getTime();
    });
}

function buildVerificationRow(asnId: string, documents: DmsDocument[]): SopDocumentVerificationRow {
  const firstDocument = documents[0];
  const asn = firstDocument?.asn;

  const verifiedDocuments = documents.filter((document) => document.status === 'VERIFIED').length;
  const rejectedDocuments = documents.filter((document) => document.status === 'REJECTED').length;
  const uploadedOrSubmittedDocuments = documents.filter(
    (document) => document.status === 'UPLOADED' || document.status === 'SUBMITTED',
  ).length;
  const documentsWithFile = documents.filter((document) => Boolean(document.fileName)).length;
  const documentsWithoutFile = documents.length - documentsWithFile;

  const completenessPercent = Math.min(
    100,
    Math.round((verifiedDocuments / TEMP_REQUIRED_DOCUMENT_COUNT) * 100),
  );

  const latestUpdatedAt = documents.reduce<string | null>((latest, document) => {
    if (!latest) return document.updatedAt;
    return new Date(document.updatedAt).getTime() > new Date(latest).getTime()
      ? document.updatedAt
      : latest;
  }, null);

  return {
    asnId,
    nip: asn?.nip ?? '-',
    name: asn?.nama ?? 'ASN belum terbaca',
    unitKerjaName: asn?.unitKerjaId ?? firstDocument?.unitKerja?.nama ?? '-',
    totalDocuments: documents.length,
    verifiedDocuments,
    rejectedDocuments,
    uploadedOrSubmittedDocuments,
    documentsWithFile,
    documentsWithoutFile,
    completenessPercent,
    status: getVerificationStatus({
      verifiedDocuments,
      rejectedDocuments,
      documentsWithoutFile,
      completenessPercent,
    }),
    latestUpdatedAt,
    documents,
  };
}

export function buildVerificationSummary(
  documents: DmsDocument[],
  rows: SopDocumentVerificationRow[],
): SopDocumentVerificationSummary {
  const verifiedDocuments = documents.filter((document) => document.status === 'VERIFIED').length;
  const rejectedDocuments = documents.filter((document) => document.status === 'REJECTED').length;
  const uploadedOrSubmittedDocuments = documents.filter(
    (document) => document.status === 'UPLOADED' || document.status === 'SUBMITTED',
  ).length;
  const documentsWithFile = documents.filter((document) => Boolean(document.fileName)).length;
  const documentsWithoutFile = documents.length - documentsWithFile;
  const documentsLinkedToAsn = documents.filter((document) => Boolean(document.asnId)).length;
  const documentsWithoutAsn = documents.length - documentsLinkedToAsn;

  const completeAsn = rows.filter((row) => row.status === 'LENGKAP').length;
  const needRevisionAsn = rows.filter((row) => row.status === 'PERLU_PERBAIKAN').length;
  const incompleteAsn = rows.filter((row) => row.status === 'BELUM_LENGKAP').length;

  const averageCompletenessPercent =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((total, row) => total + row.completenessPercent, 0) / rows.length);

  return {
    totalDocuments: documents.length,
    totalAsn: rows.length,
    verifiedDocuments,
    rejectedDocuments,
    uploadedOrSubmittedDocuments,
    documentsWithFile,
    documentsWithoutFile,
    documentsLinkedToAsn,
    documentsWithoutAsn,
    completeAsn,
    needRevisionAsn,
    incompleteAsn,
    averageCompletenessPercent,
  };
}

function getVerificationStatus(input: {
  verifiedDocuments: number;
  rejectedDocuments: number;
  documentsWithoutFile: number;
  completenessPercent: number;
}): AsnDocumentVerificationStatus {
  if (input.rejectedDocuments > 0 || input.documentsWithoutFile > 0) return 'PERLU_PERBAIKAN';
  if (input.completenessPercent >= 100) return 'LENGKAP';
  return 'BELUM_LENGKAP';
}

export function verificationStatusLabel(status: AsnDocumentVerificationStatus): string {
  const labels: Record<AsnDocumentVerificationStatus, string> = {
    LENGKAP: 'Lengkap',
    PERLU_PERBAIKAN: 'Perlu Perbaikan',
    BELUM_LENGKAP: 'Belum Lengkap',
    BELUM_TERKAIT_ASN: 'Belum Terkait ASN',
  };
  return labels[status];
}

export function verificationStatusTone(
  status: AsnDocumentVerificationStatus,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'LENGKAP') return 'success';
  if (status === 'PERLU_PERBAIKAN') return 'warning';
  if (status === 'BELUM_TERKAIT_ASN') return 'neutral';
  return 'danger';
}

export function formatVerificationDate(value: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function getTemporaryRequiredDocumentCount(): number {
  return TEMP_REQUIRED_DOCUMENT_COUNT;
}
