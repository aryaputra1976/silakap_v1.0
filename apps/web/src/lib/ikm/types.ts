export interface IkmSurveyPeriod {
  id: string;
  year: number;
  semester: number;
  label: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface IkmSurveyScores {
  u1: number;
  u2: number;
  u3: number;
  u4: number;
  u5: number;
  u6: number;
  u7: number;
  u8: number;
  u9: number;
}

export interface IkmSurvey {
  id: string;
  periodId: string;
  opdName: string;
  serviceType: string | null;
  submissionId: string | null;
  respondentId: string | null;
  scores: IkmSurveyScores;
  ikmScore: number | null;
  ikmConvert: number | null;
  predikat: string | null;
  comments: string | null;
  submittedAt: string;
  createdAt: string;
}

export interface IkmSummaryByOpd {
  opdName: string;
  respondenCount: number;
  avgIkmConvert: number;
}

export interface IkmSummary {
  periodId: string;
  totalResponden: number;
  avgIkmScore: number;
  avgIkmConvert: number;
  predikat: string;
  avgPerUnsur: Record<string, number>;
  predikatDistribution: Record<string, number>;
  byOpd: IkmSummaryByOpd[];
}

export interface SubmitIkmSurveyPayload {
  periodId: string;
  opdName: string;
  serviceType?: string;
  submissionId?: string;
  u1: number;
  u2: number;
  u3: number;
  u4: number;
  u5: number;
  u6: number;
  u7: number;
  u8: number;
  u9: number;
  comments?: string;
}

export interface CreateIkmPeriodPayload {
  year: number;
  semester: number;
  label: string;
}

export interface IkmSurveyQuery {
  periodId?: string;
  opdName?: string;
  serviceType?: string;
}

// PermenPANRB No. 14/2017 — 9 unsur layanan
export const IKM_UNSUR_LABELS: Record<string, string> = {
  u1: 'Persyaratan',
  u2: 'Sistem, Mekanisme & Prosedur',
  u3: 'Waktu Penyelesaian',
  u4: 'Biaya / Tarif',
  u5: 'Produk Spesifikasi Jenis Layanan',
  u6: 'Kompetensi Pelaksana',
  u7: 'Perilaku Pelaksana',
  u8: 'Penanganan Pengaduan, Saran & Masukan',
  u9: 'Sarana & Prasarana',
};

export const IKM_SCALE_LABELS: Record<number, string> = {
  1: 'Tidak Sesuai / Tidak Mudah / Sangat Lama / dst.',
  2: 'Kurang Sesuai / Kurang Mudah / Cukup Lama / dst.',
  3: 'Sesuai / Mudah / Cepat / dst.',
  4: 'Sangat Sesuai / Sangat Mudah / Sangat Cepat / dst.',
};

export const IKM_PREDIKAT_LABELS: Record<string, string> = {
  A: 'Sangat Baik (88,31 – 100)',
  B: 'Baik (76,61 – 88,30)',
  C: 'Kurang Baik (65,00 – 76,60)',
  D: 'Tidak Baik (25,00 – 64,99)',
};
