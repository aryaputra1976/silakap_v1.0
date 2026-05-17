import { ThumbsUp, TrendingUp, BarChart2 } from 'lucide-react';

interface SatisfactionMetric {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

const METRICS: SatisfactionMetric[] = [
  {
    label: 'Indeks Kepuasan',
    value: '—',
    description: 'Data survei belum tersedia. Hubungkan dengan sistem survei kepuasan.',
    icon: ThumbsUp,
    colorClass: 'text-blue-600 bg-blue-50',
  },
  {
    label: 'Tren Kepuasan',
    value: '—',
    description: 'Perbandingan semester ini vs semester lalu.',
    icon: TrendingUp,
    colorClass: 'text-emerald-600 bg-emerald-50',
  },
  {
    label: 'Jumlah Responden',
    value: '—',
    description: 'Total responden survei kepuasan periode berjalan.',
    icon: BarChart2,
    colorClass: 'text-amber-600 bg-amber-50',
  },
];

export function LayananSatisfactionPanel() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {METRICS.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className={`inline-flex rounded-lg p-2 ${metric.colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-zinc-900">{metric.value}</p>
              <p className="mt-1 text-sm font-medium text-zinc-700">{metric.label}</p>
              <p className="mt-1 text-xs text-zinc-500">{metric.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
        <ThumbsUp className="mx-auto h-8 w-8 text-zinc-400" />
        <p className="mt-2 text-sm font-medium text-zinc-600">Data Survei Kepuasan</p>
        <p className="mt-1 text-xs text-zinc-500">
          Fitur ini memerlukan integrasi dengan sistem survei kepuasan layanan.
          Data akan ditampilkan setelah backend diperluas sesuai SOP-BKPSDM-LAY-005.
        </p>
      </div>
    </div>
  );
}
