import { Link } from 'react-router-dom';
import { SectionCard } from '@/components/workspace/ui';
import type { AnalyticsDashboard } from '@/lib/api/types';

interface Props {
  analytics: AnalyticsDashboard;
}

const JENIS_LABEL: Record<string, string> = {
  BUP: 'Batas Usia Pensiun',
  APS: 'Atas Permintaan Sendiri',
  JDU: 'Janda / Duda / Yatim Piatu',
  TWS: 'Tidak Dengan Hormat',
  SAK: 'Sakit / Tidak Mampu',
  HLG: 'Meninggal Dunia',
  PTDH: 'Pemberhentian Tidak Dengan Hormat',
  YATIM_PIATU: 'Yatim Piatu',
};

const BAR_COLORS = [
  'bg-[#087052]',
  'bg-[#1e4620]',
  'bg-teal-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-slate-400',
  'bg-orange-500',
];

export function SianalitikSipensiunStatus({ analytics }: Props) {
  const byJenis = analytics.sipensiunByJenis ?? [];
  const total = analytics.summary.totalSipensiun;
  const maxCount = byJenis.length > 0 ? Math.max(...byJenis.map((j) => j.total)) : 1;

  return (
    <SectionCard title="Status SIPENSIUN per Jenis" className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-[#d6e2d1] bg-[#f4f8ef] px-4 py-3">
        <p className="text-sm text-[#51614c]">Total Proses Pensiun</p>
        <p className="text-xl font-bold text-[#1e4620]">{total.toLocaleString('id-ID')}</p>
      </div>

      {byJenis.length > 0 ? (
        <div className="flex flex-col gap-2">
          {byJenis.map((item, i) => {
            const pct = maxCount > 0 ? Math.round((item.total / maxCount) * 100) : 0;
            const color = BAR_COLORS[i % BAR_COLORS.length];
            return (
              <div key={item.key} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {JENIS_LABEL[item.key] ?? item.label}
                  </span>
                  <span className="font-medium text-slate-700">{item.total}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-sm text-slate-400">
          {total > 0 ? `${total} proses aktif` : 'Belum ada data SIPENSIUN.'}
        </p>
      )}

      <div className="border-t border-slate-100 pt-2">
        <Link to="/sipensiun" className="text-xs font-medium text-[#087052] hover:underline">
          Lihat detail SIPENSIUN →
        </Link>
      </div>
    </SectionCard>
  );
}
