export type {
  KinerjaRhkMonthlyReport,
  KinerjaRhkPrintSummary,
  KinerjaRhkQuarterlyReport,
  KinerjaRhkRealizationSummary,
} from '@/lib/kinerja-rhk-realizations/types';

export type ExecutiveReportQuery = {
  rhkCode?: string;
  moduleKey?: string;
  periodType?: string;
  periodYear?: number | string;
  periodMonth?: number | string;
  periodQuarter?: number | string;
};

export type EvidenceBundleItem = {
  id: string;
  rhkCode: string;
  title: string;
  moduleKey: string;
  periodYear: number;
  periodMonth: number | null;
  periodQuarter: number | null;
  periodType: string;
  sopCode: string | null;
  evidenceSnapshotJson: unknown;
  finalScore: number | null;
  approvedAt: string | null;
};

export type ExecutiveExportLogPayload = {
  reportType: 'MONTHLY' | 'QUARTERLY' | 'SUMMARY' | 'EVIDENCE_BUNDLE';
  format?: string;
  rhkCode?: string;
  moduleKey?: string;
  note?: string;
};
