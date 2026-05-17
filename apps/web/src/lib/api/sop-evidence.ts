import {
  dmsApi,
  type DmsDocument,
  type DmsDocumentCategory,
  type DmsDocumentListResponse,
  type DmsDocumentStatus,
} from '@/lib/api/dms';

export interface SopEvidenceQuery {
  sopCode: string;
  rhkCode?: string;
  year?: string;
  month?: string;
  quarter?: string;
  category?: DmsDocumentCategory | '';
  status?: DmsDocumentStatus | '';
  page?: number;
  limit?: number;
}

export interface SopEvidenceUploadContext {
  sopCode: string;
  sopTitle: string;
  rhkCode?: string;
  year?: string;
  month?: string;
  quarter?: string;
}

export interface SopEvidenceSummary {
  total: number;
  draft: number;
  uploaded: number;
  submitted: number;
  verified: number;
  rejected: number;
  archived: number;
  withFile: number;
  withoutFile: number;
}

export function buildSopEvidenceTag(sopCode: string): string {
  return `[SOP:${sopCode}]`;
}

export function buildRhkEvidenceTag(rhkCode: string): string {
  return `[RHK:${rhkCode}]`;
}

export function buildSopEvidenceSearchText(query: Pick<SopEvidenceQuery, 'sopCode' | 'rhkCode'>): string {
  const parts = [query.sopCode];

  if (query.rhkCode) {
    parts.push(query.rhkCode);
  }

  parts.push(buildSopEvidenceTag(query.sopCode));

  if (query.rhkCode) {
    parts.push(buildRhkEvidenceTag(query.rhkCode));
  }

  return parts.join(' ');
}

export function buildSopEvidenceDefaultTitle(context: SopEvidenceUploadContext): string {
  const period = buildPeriodLabel(context);
  return `Bukti Dukung ${context.sopTitle}${period ? ` - ${period}` : ''}`;
}

export function buildSopEvidenceDescription(context: SopEvidenceUploadContext): string {
  const lines = [
    buildSopEvidenceTag(context.sopCode),
    context.rhkCode ? buildRhkEvidenceTag(context.rhkCode) : '',
    '',
    `Konteks SOP: ${context.sopTitle}`,
    `Kode SOP: ${context.sopCode}`,
    context.rhkCode ? `RHK: ${context.rhkCode}` : '',
    buildPeriodLabel(context) ? `Periode: ${buildPeriodLabel(context)}` : '',
    '',
    'Catatan:',
  ].filter(Boolean);

  return lines.join('\n');
}

export function buildSopEvidenceUploadUrl(context: SopEvidenceUploadContext): string {
  const params = new URLSearchParams();

  params.set('source', 'sop-rhk');
  params.set('sopCode', context.sopCode);
  params.set('sopTitle', context.sopTitle);

  if (context.rhkCode) {
    params.set('rhkCode', context.rhkCode);
  }

  if (context.year) {
    params.set('year', context.year);
  }

  if (context.month) {
    params.set('month', context.month);
  }

  if (context.quarter) {
    params.set('quarter', context.quarter);
  }

  return `/dms/upload?${params.toString()}`;
}

export async function listSopEvidenceDocuments(query: SopEvidenceQuery): Promise<DmsDocumentListResponse> {
  return dmsApi.listDocuments({
    q: buildSopEvidenceSearchText(query),
    category: query.category,
    status: query.status,
    year: query.year,
    month: query.month,
    quarter: query.quarter,
    page: query.page,
    limit: query.limit,
  });
}

export function summarizeSopEvidence(documents: DmsDocument[]): SopEvidenceSummary {
  return documents.reduce<SopEvidenceSummary>(
    (summary, document) => {
      summary.total += 1;

      if (document.status === 'DRAFT') summary.draft += 1;
      if (document.status === 'UPLOADED') summary.uploaded += 1;
      if (document.status === 'SUBMITTED') summary.submitted += 1;
      if (document.status === 'VERIFIED') summary.verified += 1;
      if (document.status === 'REJECTED') summary.rejected += 1;
      if (document.status === 'ARCHIVED') summary.archived += 1;

      if (document.fileName) {
        summary.withFile += 1;
      } else {
        summary.withoutFile += 1;
      }

      return summary;
    },
    {
      total: 0,
      draft: 0,
      uploaded: 0,
      submitted: 0,
      verified: 0,
      rejected: 0,
      archived: 0,
      withFile: 0,
      withoutFile: 0,
    },
  );
}

export function documentContainsSopEvidenceTag(document: DmsDocument, sopCode: string): boolean {
  const source = `${document.title} ${document.description ?? ''}`.toLowerCase();
  return source.includes(sopCode.toLowerCase()) || source.includes(buildSopEvidenceTag(sopCode).toLowerCase());
}

export function buildPeriodLabel(context: Pick<SopEvidenceUploadContext, 'year' | 'month' | 'quarter'>): string {
  if (context.year && context.month) {
    return `Bulan ${context.month} Tahun ${context.year}`;
  }

  if (context.year && context.quarter) {
    return `Triwulan ${context.quarter} Tahun ${context.year}`;
  }

  if (context.year) {
    return `Tahun ${context.year}`;
  }

  return '';
}
