import type {
  KinerjaBidangDashboardSummary,
  KinerjaBidangReportResponse,
  KinerjaBidangRhkReportRow,
  KinerjaBidangSop,
  KinerjaSopStage,
  KinerjaSopTargetUnit,
} from '@/lib/api/kinerja-bidang';
import {
  kinerjaRhkReportStatusLabel,
  kinerjaRhkReportStatusTone,
  kinerjaTargetUnitLabel,
} from '@/lib/api/kinerja-bidang';
import type {
  SopDetail,
  SopItem,
  SopProcedureStep,
  SopProgress,
  SopRiskStatus,
  SopStage,
  SopTargetUnit,
} from '@/lib/sop/sop-data';
import type {
  SopReportEvidencePlan,
  SopReportNarrative,
  SopReportRhkRow,
  SopReportSummary,
} from '@/lib/sop/sop-report-data';

function toUiStage(stage: KinerjaSopStage): SopStage {
  if (stage === 'TAHAP_1') return 1;
  if (stage === 'TAHAP_2') return 2;
  return 3;
}

function toUiTargetUnit(unit: KinerjaSopTargetUnit | string): SopTargetUnit {
  return unit === 'DOKUMEN' ? 'Dokumen' : 'Laporan';
}

function toUiRiskStatus(status: KinerjaBidangRhkReportRow['status']): SopRiskStatus {
  if (status === 'AMAN' || status === 'TERLAMPAUI') return 'AMAN';
  if (status === 'BELUM_ADA_BUKTI') return 'BELUM_ADA_BUKTI';
  return 'PERLU_PERHATIAN';
}

function toProcedureStep(step: KinerjaBidangSop['steps'][number]): SopProcedureStep {
  return {
    no: step.stepNumber,
    activity: step.activity,
    actor: step.actor,
    input: step.input,
    process: step.process,
    output: step.output,
    duration: step.duration,
    note: step.note ?? undefined,
  };
}

function toFallbackProcedureSteps(sop: KinerjaBidangSop): SopProcedureStep[] {
  if (sop.steps.length > 0) return sop.steps.map(toProcedureStep);

  return [
    {
      no: 1,
      activity: 'Menyiapkan rencana kerja dan data awal',
      actor: 'Analis / Pelaksana',
      input: 'Target RHK, data awal, jadwal kerja, dan dokumen pendukung',
      process: `Mengidentifikasi kebutuhan, ruang lingkup, pelaksana, dan tahapan kerja ${sop.title}.`,
      output: 'Rencana kerja kegiatan',
      duration: '1 hari kerja',
    },
    {
      no: 2,
      activity: 'Mengumpulkan dan memeriksa data pendukung',
      actor: 'Analis / Pelaksana',
      input: 'Data ASN, dokumen, laporan, permohonan, atau bahan teknis',
      process: 'Memeriksa kelengkapan, kesesuaian, validitas, dan keterkaitan data/dokumen.',
      output: 'Daftar data/dokumen valid dan belum valid',
      duration: '1–3 hari kerja',
    },
    {
      no: 3,
      activity: 'Melaksanakan proses teknis sesuai SOP',
      actor: 'Analis terkait',
      input: 'Data/dokumen yang telah diperiksa',
      process: `Melaksanakan proses utama sesuai ruang lingkup ${sop.title}.`,
      output: 'Hasil pelaksanaan kegiatan',
      duration: 'Sesuai kompleksitas kegiatan',
    },
    {
      no: 4,
      activity: 'Menyusun rekapitulasi dan draft laporan',
      actor: 'Analis terkait',
      input: 'Hasil kegiatan teknis',
      process: 'Menyusun rekap capaian, kendala, tindak lanjut, dan daftar bukti dukung kegiatan.',
      output: 'Draft laporan kegiatan',
      duration: '1 hari kerja',
    },
    {
      no: 5,
      activity: 'Melakukan review dan validasi',
      actor: 'Kepala Bidang',
      input: 'Draft laporan dan bukti dukung',
      process:
        'Melakukan pemeriksaan substansi, capaian target, risiko, tindak lanjut, dan kelayakan bukti dukung.',
      output: 'Laporan tervalidasi',
      duration: '1 hari kerja',
    },
  ];
}

function toStringArray(value: string[] | null, fallback: string[]): string[] {
  if (Array.isArray(value) && value.length > 0) return value;
  return fallback;
}

export function backendSopToSopItem(sop: KinerjaBidangSop): SopItem {
  return {
    id: sop.id,
    code: sop.code,
    title: sop.title,
    stage: toUiStage(sop.stage),
    stageTitle: sop.stageTitle,
    rhkCodes: sop.rhkMappings.map((item) => item.rhkCode),
    targetQuantity: sop.targetQuantity ?? 0,
    targetUnit: toUiTargetUnit(sop.targetUnit),
    qualityTarget: sop.qualityTarget ?? '-',
    timeTarget: sop.timeTarget ?? '-',
    status: sop.status === 'ACTIVE' ? 'ACTIVE' : sop.status === 'DRAFT' ? 'DRAFT' : 'ARCHIVED',
    shortDescription: sop.shortDescription,
    isRhkPrimary: sop.isRhkPrimary,
  };
}

export function backendSopToSopDetail(sop: KinerjaBidangSop): SopDetail {
  return {
    ...backendSopToSopItem(sop),
    legalBasis: toStringArray(sop.legalBasis, [
      'Undang-Undang Nomor 20 Tahun 2023 tentang Aparatur Sipil Negara.',
      'Peraturan BKN dan ketentuan teknis pengelolaan kepegawaian yang berlaku.',
      'Dokumen perencanaan, perjanjian kinerja, dan RHK Bidang PPIK.',
    ]),
    objective:
      sop.objective ??
      `Menjamin ${sop.title.toLowerCase()} berjalan terarah, terukur, terdokumentasi, dan mendukung pencapaian RHK Bidang PPIK.`,
    scope:
      sop.scope ??
      `Meliputi perencanaan, pelaksanaan, monitoring, pelaporan, dan pengarsipan bukti dukung atas ${sop.title.toLowerCase()}.`,
    outputs: toStringArray(sop.outputs, [
      `Dokumen/laporan ${sop.title}.`,
      'Rekapitulasi capaian kegiatan.',
      'Bukti dukung kegiatan.',
    ]),
    evidenceExamples: toStringArray(sop.evidenceExamples, [
      'Laporan kegiatan.',
      'Nota dinas atau berita acara.',
      'Rekap data pendukung.',
      'Bukti dukung yang diunggah ke DMS.',
    ]),
    procedureSteps: toFallbackProcedureSteps(sop),
    signatures: [
      { role: 'Disusun oleh', namePlaceholder: 'Analis / Pelaksana terkait' },
      { role: 'Diperiksa oleh', namePlaceholder: 'Kepala Bidang PPIK' },
      { role: 'Disahkan oleh', namePlaceholder: 'Kepala BKPSDM' },
    ],
  };
}

export function backendReportRowToSopProgress(row: KinerjaBidangRhkReportRow): SopProgress {
  return {
    sopId: row.sopId,
    year: row.year,
    target: row.targetQuantity,
    realization: row.realizationQuantity,
    verifiedEvidence: row.evidenceCount,
    progressPercent: row.progressPercent,
    riskStatus: toUiRiskStatus(row.status),
  };
}

export function backendReportToSopProgress(report: KinerjaBidangReportResponse): SopProgress[] {
  return report.rows.map(backendReportRowToSopProgress);
}

export function backendSummaryToReportCards(summary: KinerjaBidangDashboardSummary) {
  return {
    totalSop: summary.totalSop,
    totalRhkPrimary: summary.totalRhkPrimary,
    totalTarget: summary.totalTarget,
    totalRealization: summary.totalRealization,
    totalApprovedRealization: summary.totalApprovedRealization,
    totalEvidence: summary.totalEvidence,
    averageProgressPercent: summary.averageProgressPercent,
    needAttention: summary.needAttention,
  };
}

export function backendReportRowStatusLabel(row: KinerjaBidangRhkReportRow): string {
  return kinerjaRhkReportStatusLabel(row.status);
}

export function backendReportRowStatusTone(row: KinerjaBidangRhkReportRow) {
  return kinerjaRhkReportStatusTone(row.status);
}

export function backendReportRowTargetLabel(row: KinerjaBidangRhkReportRow): string {
  return `${row.targetQuantity} ${kinerjaTargetUnitLabel(row.targetUnit)}`;
}

export function backendReportRowHasRealization(row: KinerjaBidangRhkReportRow): boolean {
  return row.realizationQuantity > 0;
}

export function backendReportRowNeedsInput(row: KinerjaBidangRhkReportRow): boolean {
  return row.realizationQuantity < row.targetQuantity;
}

export function backendReportToSopReportRows(
  report: KinerjaBidangReportResponse,
): SopReportRhkRow[] {
  return report.rows.map((row) => ({
    sopId: row.sopId,
    sopCode: row.sopCode,
    sopTitle: row.sopTitle,
    rhkCode: row.rhkCode,
    target: row.targetQuantity,
    realization: row.realizationQuantity,
    targetUnit: kinerjaTargetUnitLabel(row.targetUnit),
    progressPercent: row.progressPercent,
    verifiedEvidence: row.evidenceCount,
    qualityLabel:
      row.approvedRealizationQuantity > 0
        ? 'Realisasi sudah disetujui'
        : row.realizationQuantity > 0
          ? 'Menunggu review/persetujuan'
          : 'Belum ada realisasi',
    timeLabel:
      row.status === 'AMAN' || row.status === 'TERLAMPAUI'
        ? 'Sesuai rencana'
        : row.status === 'BELUM_ADA_BUKTI'
          ? 'Belum dapat dinilai'
          : 'Perlu pemantauan',
    riskStatus: toUiRiskStatus(row.status),
    riskLabel: kinerjaRhkReportStatusLabel(row.status),
    riskTone: kinerjaRhkReportStatusTone(row.status),
  }));
}

export function backendReportToSopReportSummary(
  report: KinerjaBidangReportResponse,
): SopReportSummary {
  return {
    totalRhk: report.summary.totalRhkPrimary,
    totalTarget: report.summary.totalTarget,
    totalRealization: report.summary.totalRealization,
    totalVerifiedEvidence: report.summary.totalEvidence,
    averageProgressPercent: report.summary.averageProgressPercent,
    completedRhk: report.rows.filter((row) => row.progressPercent >= 100).length,
    attentionRhk: report.rows.filter((row) => row.status === 'PERLU_PERHATIAN')
      .length,
    noEvidenceRhk: report.rows.filter((row) => row.status === 'BELUM_ADA_BUKTI')
      .length,
  };
}

export function backendReportToSopEvidencePlan(
  report: KinerjaBidangReportResponse,
): SopReportEvidencePlan[] {
  return report.rows.map((row) => ({
    id: row.sopId,
    rhkCode: row.rhkCode,
    sopCode: row.sopCode,
    sopTitle: row.sopTitle,
    dmsTag: `[SOP:${row.sopCode}] [RHK:${row.rhkCode}]`,
    requiredEvidence: [
      `Laporan ${row.sopTitle}.`,
      'Rekapitulasi capaian kegiatan.',
      'Nota dinas atau berita acara jika diperlukan.',
      'Bukti dukung yang telah diunggah ke DMS.',
    ],
    statusLabel:
      row.evidenceCount > 0
        ? `${row.evidenceCount} bukti tertaut`
        : 'Belum ada bukti tertaut',
    statusTone: row.evidenceCount > 0 ? 'success' : 'warning',
  }));
}

export function backendReportToSopNarrative(
  report: KinerjaBidangReportResponse,
): SopReportNarrative {
  return {
    title: report.narrative.title,
    opening: report.narrative.opening,
    achievement: report.narrative.achievement,
    constraints: report.narrative.constraint,
    followUp: report.narrative.followUp,
    closing:
      'Laporan ini menjadi bahan monitoring internal bidang dan bahan penyampaian kepada pimpinan untuk pengambilan keputusan, evaluasi capaian, dan perbaikan pelaksanaan kegiatan berikutnya.',
    recommendations: [
      'Melakukan pemutakhiran realisasi RHK secara berkala.',
      'Memastikan setiap realisasi memiliki bukti dukung yang tertaut dari DMS.',
      'Melakukan review Kabid terhadap RHK yang belum memiliki bukti dukung atau capaian rendah.',
    ],
  };
}
