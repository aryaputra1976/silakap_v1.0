import { SectionCard } from '@/components/workspace/ui';
import type { AnalyticsDashboard } from '@/lib/api/types';
import type { KinerjaBidangDashboardSummary, KinerjaBidangRhkReportRow } from '@/lib/api/kinerja-bidang';
import type { SidataAsnQualityDashboard } from '@/lib/api/sidata';
import type { DmsDashboardSummary } from '@/lib/api/dms';

interface Note {
  id: string;
  icon: string;
  text: string;
}

function buildNotes(
  analytics: AnalyticsDashboard,
  kinerja: KinerjaBidangDashboardSummary,
  rhkRows: KinerjaBidangRhkReportRow[],
  quality: SidataAsnQualityDashboard | null,
  dms: DmsDashboardSummary | null,
): Note[] {
  const notes: Note[] = [];

  const overdue = analytics.summary.slaOverdue ?? 0;
  if (overdue > 0) {
    notes.push({
      id: 'sla',
      icon: '⏱',
      text: `Terdapat ${overdue} tugas layanan kepegawaian yang melewati SLA. Segera distribusikan ke petugas yang bertanggung jawab untuk diselesaikan.`,
    });
  }

  const pct = Math.round(kinerja.averageProgressPercent);
  if (pct < 50) {
    notes.push({
      id: 'rhk-low',
      icon: '📉',
      text: `Rata-rata progres RHK baru mencapai ${pct}%. Perlu evaluasi realisasi dan pelengkapan bukti dukung agar target bidang tercapai.`,
    });
  } else if (pct >= 80) {
    notes.push({
      id: 'rhk-good',
      icon: '✅',
      text: `Rata-rata progres RHK sebesar ${pct}% — capaian yang baik. Pastikan bukti dukung sudah diverifikasi untuk semua realisasi yang diajukan.`,
    });
  }

  const belumBukti = rhkRows.filter((r) => r.status === 'BELUM_ADA_BUKTI').length;
  if (belumBukti > 0) {
    notes.push({
      id: 'rhk-bukti',
      icon: '📎',
      text: `${belumBukti} target RHK belum dilengkapi bukti dukung. Dokumen bukti harus diunggah ke DMS sebelum realisasi dapat disetujui.`,
    });
  }

  if (quality !== null) {
    if (quality.quality.qualityScore < 70) {
      notes.push({
        id: 'data',
        icon: '🗂',
        text: `Kualitas data ASN di SIDATA mencapai ${quality.quality.qualityScore}% — di bawah standar. Prioritaskan pemutakhiran data yang belum lengkap, terutama NIK, jabatan, dan TMT pensiun.`,
      });
    }

    if (quality.retirement.bupOverdueActive > 0) {
      notes.push({
        id: 'bup',
        icon: '⚠️',
        text: `${quality.retirement.bupOverdueActive} ASN telah melewati batas usia pensiun namun masih tercatat aktif. Segera proses administrasi pensiunnya.`,
      });
    } else if (quality.retirement.bupNext12Months > 0) {
      notes.push({
        id: 'bup-plan',
        icon: '📅',
        text: `${quality.retirement.bupNext12Months} ASN akan memasuki masa pensiun BUP dalam 12 bulan ke depan. Mulai persiapkan berkas dan proses administrasi.`,
      });
    }
  }

  if (dms !== null) {
    if (dms.waitingVerification > 5) {
      notes.push({
        id: 'dms',
        icon: '📄',
        text: `${dms.waitingVerification} dokumen DMS menunggu verifikasi. Segera tindaklanjuti agar alur pengelolaan dokumen tidak tersumbat.`,
      });
    }
  }

  if (notes.length === 0) {
    notes.push({
      id: 'all-ok',
      icon: '🎯',
      text: 'Semua indikator operasional berada dalam kondisi baik. Pertahankan konsistensi pencatatan dan pemutakhiran data secara berkala.',
    });
  }

  return notes;
}

interface Props {
  analytics: AnalyticsDashboard;
  kinerja: KinerjaBidangDashboardSummary;
  rhkRows: KinerjaBidangRhkReportRow[];
  quality: SidataAsnQualityDashboard | null;
  dms: DmsDashboardSummary | null;
  generatedAt: string;
}

export function SianalitikExecutiveNotes({
  analytics,
  kinerja,
  rhkRows,
  quality,
  dms,
  generatedAt,
}: Props) {
  const notes = buildNotes(analytics, kinerja, rhkRows, quality, dms);

  const dateStr = new Date(generatedAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SectionCard
      title="Catatan Eksekutif"
      className="flex flex-col gap-3"
    >
      <p className="text-xs text-slate-400">
        Digenerate otomatis dari data live — {dateStr}
      </p>
      <div className="flex flex-col gap-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
          >
            <span className="mt-0.5 text-base leading-none">{note.icon}</span>
            <p className="text-sm leading-relaxed text-slate-700">{note.text}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
