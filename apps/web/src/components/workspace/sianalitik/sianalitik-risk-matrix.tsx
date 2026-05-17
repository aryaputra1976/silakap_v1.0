import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { SectionCard } from '@/components/workspace/ui';
import type { AnalyticsDashboard } from '@/lib/api/types';
import type { KinerjaBidangDashboardSummary, KinerjaBidangRhkReportRow } from '@/lib/api/kinerja-bidang';
import type { SidataAsnQualityDashboard } from '@/lib/api/sidata';
import type { DmsDashboardSummary } from '@/lib/api/dms';

type RiskLevel = 'high' | 'medium' | 'low' | 'ok';

interface RiskItem {
  id: string;
  level: RiskLevel;
  module: string;
  title: string;
  detail: string;
  link: string;
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; icon: typeof AlertTriangle }> =
  {
    high: { label: 'Tinggi', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: AlertTriangle },
    medium: { label: 'Sedang', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: AlertCircle },
    low: { label: 'Rendah', color: 'text-[#096672] bg-[#e7f6f5] border-[#9fd6dc]', icon: Info },
    ok: { label: 'Aman', color: 'text-[#087052] bg-[#e6f6ee] border-[#9ed9c4]', icon: CheckCircle2 },
  };

function buildRisks(
  analytics: AnalyticsDashboard,
  kinerja: KinerjaBidangDashboardSummary,
  rhkRows: KinerjaBidangRhkReportRow[],
  quality: SidataAsnQualityDashboard | null,
  dms: DmsDashboardSummary | null,
): RiskItem[] {
  const risks: RiskItem[] = [];

  const overdue = analytics.summary.slaOverdue ?? 0;
  if (overdue > 5) {
    risks.push({
      id: 'sla-high',
      level: 'high',
      module: 'Layanan',
      title: `${overdue} tugas SLA terlambat`,
      detail: 'Layanan kepegawaian melewati batas waktu penyelesaian',
      link: '/layanan/sla',
    });
  } else if (overdue > 0) {
    risks.push({
      id: 'sla-med',
      level: 'medium',
      module: 'Layanan',
      title: `${overdue} tugas SLA terlambat`,
      detail: 'Perlu diselesaikan segera',
      link: '/layanan/sla',
    });
  }

  const belumBukti = rhkRows.filter((r) => r.status === 'BELUM_ADA_BUKTI');
  if (belumBukti.length > 3) {
    risks.push({
      id: 'rhk-high',
      level: 'high',
      module: 'Kinerja',
      title: `${belumBukti.length} target RHK belum ada bukti`,
      detail: 'Realisasi tanpa bukti tidak dapat disetujui',
      link: '/kinerja-bidang/laporan',
    });
  } else if (belumBukti.length > 0) {
    risks.push({
      id: 'rhk-med',
      level: 'medium',
      module: 'Kinerja',
      title: `${belumBukti.length} target RHK belum ada bukti`,
      detail: 'Segera lengkapi bukti dukung',
      link: '/kinerja-bidang/laporan',
    });
  }

  if (kinerja.needAttention > 3) {
    risks.push({
      id: 'rhk-attn',
      level: 'medium',
      module: 'Kinerja',
      title: `${kinerja.needAttention} RHK perlu perhatian`,
      detail: 'Progres di bawah target yang diharapkan',
      link: '/kinerja-bidang',
    });
  }

  if (quality !== null) {
    if (quality.quality.qualityScore < 60) {
      risks.push({
        id: 'data-high',
        level: 'high',
        module: 'SIDATA',
        title: `Kualitas data ASN ${quality.quality.qualityScore}%`,
        detail: 'Banyak data ASN tidak lengkap — perlu pemutakhiran',
        link: '/sidata',
      });
    } else if (quality.quality.qualityScore < 80) {
      risks.push({
        id: 'data-med',
        level: 'medium',
        module: 'SIDATA',
        title: `Kualitas data ASN ${quality.quality.qualityScore}%`,
        detail: 'Ada beberapa data yang perlu dilengkapi',
        link: '/sidata',
      });
    }

    if (quality.retirement.bupOverdueActive > 0) {
      risks.push({
        id: 'bup-high',
        level: 'high',
        module: 'SIPENSIUN',
        title: `${quality.retirement.bupOverdueActive} ASN melewati BUP masih aktif`,
        detail: 'Segera proses pensiun BUP yang tertunggak',
        link: '/sipensiun?jenis=BUP',
      });
    }

    if (quality.retirement.bupNext12Months > 0) {
      risks.push({
        id: 'bup-low',
        level: 'low',
        module: 'SIPENSIUN',
        title: `${quality.retirement.bupNext12Months} ASN pensiun BUP dalam 12 bulan`,
        detail: 'Perlu dipersiapkan proses pensiunnya',
        link: '/sipensiun?jenis=BUP',
      });
    }
  }

  if (dms !== null && dms.rejected > 0) {
    risks.push({
      id: 'dms-rej',
      level: 'medium',
      module: 'DMS',
      title: `${dms.rejected} dokumen ditolak`,
      detail: 'Dokumen perlu direvisi dan diunggah ulang',
      link: '/dms',
    });
  }

  if (risks.length === 0) {
    risks.push({
      id: 'ok',
      level: 'ok',
      module: 'Semua',
      title: 'Tidak ada risiko signifikan terdeteksi',
      detail: 'Semua modul berjalan dalam batas normal',
      link: '/sianalitik',
    });
  }

  return risks.sort((a, b) => {
    const order: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2, ok: 3 };
    return order[a.level] - order[b.level];
  });
}

interface Props {
  analytics: AnalyticsDashboard;
  kinerja: KinerjaBidangDashboardSummary;
  rhkRows: KinerjaBidangRhkReportRow[];
  quality: SidataAsnQualityDashboard | null;
  dms: DmsDashboardSummary | null;
}

export function SianalitikRiskMatrix({ analytics, kinerja, rhkRows, quality, dms }: Props) {
  const risks = buildRisks(analytics, kinerja, rhkRows, quality, dms);
  const highCount = risks.filter((r) => r.level === 'high').length;
  const medCount = risks.filter((r) => r.level === 'medium').length;

  return (
    <SectionCard
      title={`Matriks Risiko Operasional${highCount > 0 ? ` — ${highCount} Risiko Tinggi` : ''}`}
      className="flex flex-col gap-3"
    >
      {highCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {highCount} risiko tinggi dan {medCount} risiko sedang memerlukan tindak lanjut segera.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {risks.map((risk) => {
          const cfg = RISK_CONFIG[risk.level];
          const Icon = cfg.icon;
          return (
            <Link
              key={risk.id}
              to={risk.link}
              className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-opacity hover:opacity-80 ${cfg.color}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    {risk.module}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-60">
                    [{cfg.label}]
                  </span>
                </div>
                <p className="font-medium">{risk.title}</p>
                <p className="text-xs opacity-70">{risk.detail}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </SectionCard>
  );
}
