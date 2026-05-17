export interface KinerjaBidangDashboardSummary {
  totalSop: number;
  totalRhkPrimary: number;
  totalTarget: number;
  totalRealization: number;
  totalApprovedRealization: number;
  totalEvidence: number;
  averageProgressPercent: number;
  needAttention: number;
}

export interface KinerjaBidangRhkReportRow {
  targetId: string;
  sopId: string;
  sopCode: string;
  sopTitle: string;
  rhkCode: string;
  year: number;
  targetQuantity: number;
  targetUnit: string;
  realizationQuantity: number;
  approvedRealizationQuantity: number;
  evidenceCount: number;
  progressPercent: number;
  status: 'AMAN' | 'PERLU_PERHATIAN' | 'BELUM_ADA_BUKTI' | 'TERLAMPAUI';
}
