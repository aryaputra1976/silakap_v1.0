import {
  SOP_PROGRESS,
  SOP_RHK_PRIMARY_ITEMS,
  formatRiskStatus,
  getRiskTone,
  type SopItem,
  type SopProgress,
  type SopRiskStatus,
} from '@/lib/sop/sop-data';

export type SopReportPeriodType = 'TAHUNAN' | 'TRIWULAN' | 'BULANAN';

export interface SopReportFilter {
  year: string;
  periodType: SopReportPeriodType;
  month: string;
  quarter: string;
}

export interface SopReportRhkRow {
  sopId: string;
  sopCode: string;
  sopTitle: string;
  rhkCode: string;
  target: number;
  realization: number;
  targetUnit: string;
  progressPercent: number;
  verifiedEvidence: number;
  qualityLabel: string;
  timeLabel: string;
  riskStatus: SopRiskStatus;
  riskLabel: string;
  riskTone: 'success' | 'warning' | 'danger' | 'neutral';
}

export interface SopReportSummary {
  totalRhk: number;
  totalTarget: number;
  totalRealization: number;
  totalVerifiedEvidence: number;
  averageProgressPercent: number;
  completedRhk: number;
  attentionRhk: number;
  noEvidenceRhk: number;
}

export interface SopReportEvidencePlan {
  id: string;
  rhkCode: string;
  sopCode: string;
  sopTitle: string;
  requiredEvidence: string[];
  dmsTag: string;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'dark';
}

export interface SopReportNarrative {
  title: string;
  opening: string;
  achievement: string;
  constraints: string;
  followUp: string;
  closing: string;
  recommendations: string[];
}

function findProgressBySopId(sopId: string): SopProgress | undefined {
  return SOP_PROGRESS.find((item) => item.sopId === sopId);
}

function getDefaultProgress(item: SopItem): SopProgress {
  return {
    sopId: item.id,
    year: Number(new Date().getFullYear()),
    target: item.targetQuantity,
    realization: 0,
    verifiedEvidence: 0,
    progressPercent: 0,
    riskStatus: 'BELUM_ADA_BUKTI',
  };
}

function getQualityLabel(progress: SopProgress): string {
  if (progress.realization <= 0) {
    return 'Belum ada realisasi';
  }

  if (progress.verifiedEvidence >= progress.realization) {
    return 'Bukti dukung memadai';
  }

  return 'Bukti dukung perlu dilengkapi';
}

function getTimeLabel(progress: SopProgress): string {
  if (progress.riskStatus === 'AMAN') {
    return 'Sesuai rencana';
  }

  if (progress.riskStatus === 'TERLAMBAT') {
    return 'Terlambat';
  }

  if (progress.riskStatus === 'BELUM_ADA_BUKTI') {
    return 'Belum dapat dinilai';
  }

  return 'Perlu pemantauan';
}

export function buildSopReportRows(): SopReportRhkRow[] {
  return SOP_RHK_PRIMARY_ITEMS.map((sop) => {
    const progress = findProgressBySopId(sop.id) ?? getDefaultProgress(sop);
    const rhkCode = sop.rhkCodes[0] ?? '-';

    return {
      sopId: sop.id,
      sopCode: sop.code,
      sopTitle: sop.title,
      rhkCode,
      target: progress.target,
      realization: progress.realization,
      targetUnit: sop.targetUnit,
      progressPercent: progress.progressPercent,
      verifiedEvidence: progress.verifiedEvidence,
      qualityLabel: getQualityLabel(progress),
      timeLabel: getTimeLabel(progress),
      riskStatus: progress.riskStatus,
      riskLabel: formatRiskStatus(progress.riskStatus),
      riskTone: getRiskTone(progress.riskStatus),
    };
  });
}

export function buildSopReportSummary(rows: SopReportRhkRow[]): SopReportSummary {
  const totalTarget = rows.reduce((total, row) => total + row.target, 0);
  const totalRealization = rows.reduce((total, row) => total + row.realization, 0);
  const totalVerifiedEvidence = rows.reduce((total, row) => total + row.verifiedEvidence, 0);

  const averageProgressPercent =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((total, row) => total + row.progressPercent, 0) / rows.length);

  return {
    totalRhk: rows.length,
    totalTarget,
    totalRealization,
    totalVerifiedEvidence,
    averageProgressPercent,
    completedRhk: rows.filter((row) => row.progressPercent >= 100).length,
    attentionRhk: rows.filter(
      (row) => row.riskStatus === 'PERLU_PERHATIAN' || row.riskStatus === 'TERLAMBAT',
    ).length,
    noEvidenceRhk: rows.filter((row) => row.riskStatus === 'BELUM_ADA_BUKTI').length,
  };
}

export function buildReportTitle(filter: SopReportFilter): string {
  if (filter.periodType === 'BULANAN' && filter.month) {
    return `Laporan Kinerja Bidang PPIK Bulan ${filter.month} Tahun ${filter.year}`;
  }

  if (filter.periodType === 'TRIWULAN' && filter.quarter) {
    return `Laporan Kinerja Bidang PPIK Triwulan ${filter.quarter} Tahun ${filter.year}`;
  }

  return `Laporan Kinerja Bidang PPIK Tahun ${filter.year}`;
}

export function buildSopReportEvidencePlan(): SopReportEvidencePlan[] {
  return SOP_RHK_PRIMARY_ITEMS.map((sop) => {
    const progress = findProgressBySopId(sop.id) ?? getDefaultProgress(sop);
    const rhkCode = sop.rhkCodes[0] ?? '-';

    return {
      id: sop.id,
      rhkCode,
      sopCode: sop.code,
      sopTitle: sop.title,
      dmsTag: `[SOP:${sop.code}] [RHK:${rhkCode}]`,
      requiredEvidence: buildRequiredEvidenceList(sop),
      statusLabel:
        progress.verifiedEvidence > 0
          ? `${progress.verifiedEvidence} bukti valid`
          : 'Belum ada bukti valid',
      statusTone: progress.verifiedEvidence > 0 ? 'success' : 'warning',
    };
  });
}

function buildRequiredEvidenceList(sop: SopItem): string[] {
  if (sop.id === 'pengadaan-asn') {
    return [
      'Laporan rencana/pelaksanaan pengadaan ASN.',
      'Rekap koordinasi dan tahapan pengadaan.',
      'Nota dinas atau berita acara terkait pengadaan ASN.',
      'Dokumentasi hasil pelaksanaan kegiatan.',
    ];
  }

  if (sop.id === 'evaluasi-kinerja-bidang') {
    return [
      'Laporan evaluasi kinerja bidang.',
      'Rekap capaian RHK.',
      'Matriks kendala dan tindak lanjut.',
      'Dokumen validasi Kabid.',
    ];
  }

  if (sop.id === 'pemberhentian-asn') {
    return [
      'Rekap usulan pensiun/pemberhentian ASN.',
      'Laporan monitoring status usulan.',
      'Daftar kendala dan tindak lanjut.',
      'Dokumen koordinasi dengan instansi terkait.',
    ];
  }

  if (sop.id === 'pengelolaan-dms-data-kepegawaian') {
    return [
      'Rekapitulasi dokumen dan data kepegawaian ASN.',
      'Daftar ASN/data/dokumen yang perlu pemutakhiran.',
      'Laporan bulanan pengelolaan DMS & data kepegawaian.',
      'Dokumen pendukung program nasional BKN.',
    ];
  }

  return [
    `Laporan ${sop.title}.`,
    'Rekapitulasi capaian kegiatan.',
    'Nota dinas atau berita acara.',
    'Bukti dukung yang telah diunggah ke DMS.',
  ];
}

export function buildSopReportNarrative(
  filter: SopReportFilter,
  summary: SopReportSummary,
): SopReportNarrative {
  const title = buildReportTitle(filter);

  return {
    title,
    opening:
      'Laporan ini disusun sebagai bentuk pengendalian pelaksanaan tugas Bidang Pengadaan, Pemberhentian, dan Informasi Kepegawaian dalam mendukung pencapaian RHK, tertib administrasi, serta akuntabilitas pelaksanaan kegiatan bidang.',
    achievement: `Berdasarkan data monitoring sementara, terdapat ${summary.totalRhk} RHK utama dengan total target ${summary.totalTarget} output. Realisasi yang telah tercatat sebanyak ${summary.totalRealization} output dengan rata-rata capaian ${summary.averageProgressPercent}%. Bukti dukung yang telah tervalidasi sebanyak ${summary.totalVerifiedEvidence} dokumen.`,
    constraints:
      summary.attentionRhk > 0 || summary.noEvidenceRhk > 0
        ? `Masih terdapat ${summary.attentionRhk} RHK yang memerlukan perhatian dan ${summary.noEvidenceRhk} RHK yang belum memiliki bukti dukung valid. Kondisi ini perlu ditindaklanjuti melalui pemutakhiran laporan, penegasan jadwal penyelesaian, serta kelengkapan dokumen pendukung.`
        : 'Secara umum pelaksanaan kegiatan berada dalam kondisi terkendali. Pemantauan tetap diperlukan agar realisasi, kualitas output, dan bukti dukung tetap konsisten sampai akhir periode.',
    followUp:
      'Tindak lanjut yang perlu dilakukan adalah memperbarui realisasi secara berkala, memastikan setiap output memiliki bukti dukung yang sah, melakukan review Kabid terhadap laporan periodik, serta mengarsipkan dokumen final pada DMS Bukti Dukung.',
    closing:
      'Laporan ini menjadi bahan monitoring internal bidang dan bahan penyampaian kepada pimpinan untuk pengambilan keputusan, evaluasi capaian, dan perbaikan pelaksanaan kegiatan berikutnya.',
    recommendations: buildRecommendations(summary),
  };
}

function buildRecommendations(summary: SopReportSummary): string[] {
  const recommendations = [
    'Melakukan pemutakhiran realisasi RHK secara berkala minimal setiap bulan.',
    'Memastikan setiap realisasi output memiliki bukti dukung yang diunggah ke DMS Bukti Dukung.',
    'Melakukan review Kabid terhadap RHK yang berstatus perlu perhatian atau belum memiliki bukti valid.',
  ];

  if (summary.noEvidenceRhk > 0) {
    recommendations.push('Memprioritaskan pelengkapan bukti dukung untuk RHK yang belum memiliki dokumen valid.');
  }

  if (summary.attentionRhk > 0) {
    recommendations.push('Menyusun rencana tindak lanjut untuk RHK yang capaian realisasinya masih rendah.');
  }

  return recommendations;
}
