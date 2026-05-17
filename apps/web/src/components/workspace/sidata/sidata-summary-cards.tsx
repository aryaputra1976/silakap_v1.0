import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Database, RefreshCcw, ShieldAlert } from 'lucide-react';
import type { SidataAsnQualityDashboard } from '@/lib/api/sidata';

interface SidataSummaryCardsProps {
  quality: SidataAsnQualityDashboard;
}

export function SidataSummaryCards({ quality }: SidataSummaryCardsProps) {
  const navigate = useNavigate();

  const score = quality.quality.qualityScore;
  const scoreTone =
    score >= 90
      ? { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' }
      : score >= 70
        ? { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' }
        : { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200' };

  const QUICK_LINKS = [
    {
      label: 'Pemutakhiran Data',
      description: 'Pipeline import DAT-002/DAT-003',
      path: '/sidata/pemutakhiran',
      icon: RefreshCcw,
      tone: 'blue',
    },
    {
      label: 'Sinkronisasi SIASN',
      description: 'Upload & mapping SIK-002',
      path: '/sidata/import/siasn',
      icon: Database,
      tone: 'purple',
    },
    {
      label: 'Rekonsiliasi Data',
      description: 'Cek perbedaan master vs batch',
      path: '/sidata/rekonsiliasi',
      icon: ShieldAlert,
      tone: 'amber',
    },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* Quality Score */}
      <div className={`rounded-xl border p-4 ${scoreTone.bg}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Kualitas Data</p>
        <p className={`mt-1 text-3xl font-bold ${scoreTone.text}`}>{score}%</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
          <div className={`h-full rounded-full ${scoreTone.bar}`} style={{ width: `${score}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-zinc-500">
          {quality.quality.completeCoreRows} lengkap dari {quality.totals.totalAsn} ASN
        </p>
      </div>

      {/* Issue Rows */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Issue Data</p>
        <div className="mt-1 flex items-baseline gap-1">
          <p className={`text-3xl font-bold ${quality.quality.issueRows > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {quality.quality.issueRows}
          </p>
          <span className="text-xs text-zinc-500">baris</span>
        </div>
        {quality.quality.issueRows > 0 && (
          <button
            type="button"
            onClick={() => navigate('/sidata/validasi')}
            className="mt-2 flex items-center gap-1 text-xs text-amber-700 hover:underline"
          >
            <AlertTriangle className="h-3 w-3" />
            Lihat validasi
          </button>
        )}
        {quality.quality.issueRows === 0 && (
          <p className="mt-2 text-xs text-emerald-700">Tidak ada issue</p>
        )}
      </div>

      {/* BUP Summary */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">BUP 12 Bulan</p>
        <p className="mt-1 text-3xl font-bold text-zinc-900">{quality.retirement.bupNext12Months}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {quality.retirement.bupOverdueActive > 0 ? (
            <span className="font-semibold text-red-600">
              {quality.retirement.bupOverdueActive} overdue
            </span>
          ) : (
            'Tidak ada yang overdue'
          )}
        </p>
        <button
          type="button"
          onClick={() => navigate('/sipensiun?jenis=BUP')}
          className="mt-2 flex items-center gap-1 text-xs text-blue-700 hover:underline"
        >
          <ArrowRight className="h-3 w-3" />
          Lihat SIPENSIUN
        </button>
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Aksi Cepat</p>
        <div className="mt-2 space-y-1.5">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => navigate(link.path)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span className="font-medium">{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
