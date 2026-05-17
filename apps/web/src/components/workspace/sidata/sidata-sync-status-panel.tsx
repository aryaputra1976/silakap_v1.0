import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import type { SiasnImportBatch } from '@/lib/api/sidata-import';

interface SidataSyncStatusPanelProps {
  batches: SiasnImportBatch[];
  loading?: boolean;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  COMMITTED: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  PROCESSING: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
  FAILED: <XCircle className="h-4 w-4 text-red-500" />,
  CANCELLED: <XCircle className="h-4 w-4 text-zinc-400" />,
};

function getStatusIcon(status: string) {
  return STATUS_ICON[status] ?? <Circle className="h-4 w-4 text-zinc-400" />;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getQualityRate(batch: SiasnImportBatch): string {
  if (!batch.totalRows) return '—';
  const rate = Math.round((batch.validRows / batch.totalRows) * 100);
  return `${rate}%`;
}

export function SidataSyncStatusPanel({ batches, loading }: SidataSyncStatusPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Memuat status sinkronisasi...
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
        Belum ada batch sinkronisasi. Upload file SIASN untuk memulai.
      </div>
    );
  }

  const recentBatches = batches.slice(0, 5);
  const committedCount = batches.filter((b) => b.status === 'COMMITTED').length;
  const failedCount = batches.filter((b) => b.status === 'FAILED').length;
  const processingCount = batches.filter((b) => b.status === 'PROCESSING').length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
          <p className="text-xl font-bold text-emerald-700">{committedCount}</p>
          <p className="mt-0.5 text-xs text-emerald-600">Committed</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 text-center">
          <p className={`text-xl font-bold ${processingCount > 0 ? 'text-blue-600' : 'text-zinc-700'}`}>
            {processingCount}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">Sedang Proses</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 text-center">
          <p className={`text-xl font-bold ${failedCount > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
            {failedCount}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">Failed</p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-100">
        <p className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          5 Batch Terakhir
        </p>
        {recentBatches.map((batch) => (
          <div key={batch.id} className="flex items-center gap-3 px-3 py-2.5">
            {getStatusIcon(batch.status)}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-800">
                {batch.fileName ?? batch.importType ?? batch.id.slice(0, 8)}
              </p>
              <p className="text-xs text-zinc-500">
                {formatDate(batch.createdAt)} · {batch.totalRows} baris · valid {getQualityRate(batch)}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
              batch.status === 'COMMITTED'
                ? 'bg-emerald-100 text-emerald-700'
                : batch.status === 'FAILED'
                  ? 'bg-red-100 text-red-700'
                  : batch.status === 'PROCESSING'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-zinc-100 text-zinc-600'
            }`}>
              {batch.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
