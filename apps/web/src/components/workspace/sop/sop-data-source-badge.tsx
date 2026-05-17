import { StatusBadge } from '@/components/workspace/ui';

export type SopDataSource = 'backend' | 'static';

export function SopDataSourceBadge({
  source,
  error,
}: {
  source: SopDataSource;
  error?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusBadge
        value={source === 'backend' ? 'Data Backend' : 'Fallback Statis'}
        tone={source === 'backend' ? 'success' : 'warning'}
      />
      {error ? <StatusBadge value="API fallback aktif" tone="warning" /> : null}
    </div>
  );
}