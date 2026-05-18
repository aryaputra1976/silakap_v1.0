import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw, Loader2 } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  FilterBar,
  LoadingState,
  SectionCard,
  StatusBadge,
  formatDateTime,
} from '@/components/workspace/ui';
import { rhkCandidatesApi } from '@/lib/api/kinerja-rhk-candidates';
import type { KinerjaRhkCandidate, KinerjaRhkCandidateQuery } from '@/lib/kinerja-rhk-candidates/types';
import {
  formatScore,
  rhkCandidateStatusLabel,
  rhkCandidateStatusTone,
} from '@/lib/kinerja-rhk-candidates/types';
export function RhkCandidateTable({
  onSelect,
}: {
  onSelect?: (candidate: KinerjaRhkCandidate) => void;
}) {
  const [items, setItems] = useState<KinerjaRhkCandidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<KinerjaRhkCandidateQuery>({ status: 'CANDIDATE', page: 1, limit: 20 });

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    rhkCandidatesApi
      .fetchList(query)
      .then((result) => {
        if (mounted) {
          setItems(result.items);
          setTotal(result.total);
        }
      })
      .catch((caught) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Gagal memuat kandidat RHK');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [query]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  function updateQuery(updates: Partial<KinerjaRhkCandidateQuery>) {
    setQuery((prev) => ({ ...prev, ...updates, page: 1 }));
  }

  return (
    <SectionCard
      title="Daftar Kandidat RHK"
      description="Layanan OPD selesai yang menunggu divalidasi sebagai realisasi RHK bidang."
      actions={
        <ActionButton
          icon={loading ? Loader2 : RefreshCcw}
          variant="secondary"
          disabled={loading}
          onClick={load}
        >
          Refresh
        </ActionButton>
      }
    >
      {error ? <ErrorAlert message={error} /> : null}

      <FilterBar>
        <select
          className="h-9 rounded-md border border-[#c9d9c4] bg-white px-2 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
          value={query.status ?? ''}
          onChange={(e) => updateQuery({ status: e.target.value as KinerjaRhkCandidateQuery['status'] })}
        >
          <option value="">Semua status</option>
          <option value="CANDIDATE">Menunggu Validasi</option>
          <option value="APPROVED">Disetujui</option>
          <option value="REJECTED">Ditolak</option>
          <option value="ARCHIVED">Diarsipkan</option>
        </select>
        <input
          className="h-9 flex-1 rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e]"
          placeholder="Cari nama, OPD..."
          value={query.q ?? ''}
          onChange={(e) => updateQuery({ q: e.target.value })}
        />
      </FilterBar>

      {loading ? (
        <LoadingState label="Memuat kandidat RHK" />
      ) : (
        <>
          <DataTable<KinerjaRhkCandidate>
            items={items}
            empty="Belum ada kandidat RHK"
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'title',
                header: 'Layanan',
                render: (item) => (
                  <div>
                    <div className="font-medium text-[#173c36]">{item.title}</div>
                    <div className="mt-0.5 text-xs text-[#6d7e68]">
                      {item.moduleKey} · {item.serviceType}
                    </div>
                    {item.opdName ? (
                      <div className="mt-0.5 text-xs text-[#6d7e68]">{item.opdName}</div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'rhk',
                header: 'RHK',
                render: (item) =>
                  item.rhkCode ? (
                    <StatusBadge value={item.rhkCode} tone="info" />
                  ) : (
                    <span className="text-xs text-[#6d7e68]">—</span>
                  ),
              },
              {
                key: 'score',
                header: 'Skor',
                render: (item) => (
                  <div className="text-sm">
                    <div className="font-semibold text-[#173c36]">{formatScore(item.overallScore)}</div>
                    <div className="text-xs text-[#6d7e68]">
                      K:{formatScore(item.qualityScore)} / W:{formatScore(item.timeScore)} / E:{formatScore(item.evidenceScore)}
                    </div>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <StatusBadge
                    value={rhkCandidateStatusLabel(item.status)}
                    tone={rhkCandidateStatusTone(item.status)}
                  />
                ),
              },
              {
                key: 'completedAt',
                header: 'Selesai',
                render: (item) => formatDateTime(item.completedAt),
              },
              ...(onSelect
                ? [
                    {
                      key: 'actions',
                      header: '',
                      render: (item: KinerjaRhkCandidate) => (
                        <ActionButton
                          icon={RefreshCcw}
                          variant="secondary"
                          onClick={() => onSelect(item)}
                        >
                          Detail
                        </ActionButton>
                      ),
                    },
                  ]
                : []),
            ]}
          />
          <p className="mt-2 text-xs text-[#6d7e68]">Total: {total} kandidat</p>
        </>
      )}
    </SectionCard>
  );
}
