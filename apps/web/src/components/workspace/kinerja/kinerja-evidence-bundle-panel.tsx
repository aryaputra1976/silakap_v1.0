import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  FileMeta,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { kinerjaExecutiveReportApi } from '@/lib/api/kinerja-executive-report';
import type { EvidenceBundleItem, ExecutiveReportQuery } from '@/lib/kinerja-executive-report/types';
import { formatRhkPeriod } from '@/lib/kinerja-rhk-realizations/types';

function formatScore(score: number | null): string {
  return score == null ? '-' : `${score}%`;
}

function EvidenceSnapshotViewer({ data }: { data: unknown }) {
  if (data == null) {
    return <span className="text-xs text-[#6d7e68]">—</span>;
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>).slice(0, 6);
    return (
      <div className="space-y-0.5 text-xs text-[#51614c]">
        {entries.map(([key, value]) => (
          <div key={key}>
            <span className="font-medium">{key}:</span>{' '}
            <span className="text-[#6d7e68]">{String(value ?? '—')}</span>
          </div>
        ))}
        {Object.keys(data as Record<string, unknown>).length > 6 && (
          <div className="text-[#6d7e68]">…lebih banyak</div>
        )}
      </div>
    );
  }
  return <span className="text-xs text-[#51614c]">{String(data)}</span>;
}

export function KinerjaEvidenceBundlePanel() {
  const [items, setItems] = useState<EvidenceBundleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState<ExecutiveReportQuery>({
    periodYear: String(new Date().getFullYear()),
    periodMonth: String(new Date().getMonth() + 1),
  });

  function handleLoad() {
    let mounted = true;
    setLoading(true);
    setError('');

    kinerjaExecutiveReportApi
      .fetchEvidenceBundle(query)
      .then((result) => {
        if (mounted) setItems(result);
      })
      .catch((caught) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Gagal memuat bundle bukti');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }

  return (
    <SectionCard
      title="Bundle Bukti Dukung"
      description="Snapshot bukti dari realisasi RHK resmi yang telah disetujui."
      actions={
        <ActionButton
          icon={loading ? Loader2 : Search}
          disabled={loading}
          onClick={handleLoad}
        >
          Muat Bundle
        </ActionButton>
      }
    >
      {error ? <ErrorAlert message={error} /> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="h-9 w-24 rounded-md border border-[#cfe1da] bg-white px-3 text-sm text-[#18343a] outline-none focus:border-[#0e7c86]"
          inputMode="numeric"
          placeholder="Tahun"
          value={query.periodYear ?? ''}
          onChange={(e) => setQuery((prev) => ({ ...prev, periodYear: e.target.value }))}
        />
        <select
          className="h-9 rounded-md border border-[#cfe1da] bg-white px-2 text-sm text-[#18343a] outline-none focus:border-[#0e7c86]"
          value={query.periodMonth ?? ''}
          onChange={(e) => setQuery((prev) => ({ ...prev, periodMonth: e.target.value || undefined }))}
        >
          <option value="">Semua bulan</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          className="h-9 flex-1 rounded-md border border-[#cfe1da] bg-white px-3 text-sm text-[#18343a] outline-none focus:border-[#0e7c86]"
          placeholder="Filter kode RHK..."
          value={query.rhkCode ?? ''}
          onChange={(e) => setQuery((prev) => ({ ...prev, rhkCode: e.target.value || undefined }))}
        />
      </div>

      {items.length > 0 ? (
        <>
          <DataTable<EvidenceBundleItem>
            items={items}
            empty="Belum ada data bundle bukti"
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'rhk',
                header: 'RHK',
                render: (item) => <StatusBadge value={item.rhkCode} tone="info" />,
              },
              {
                key: 'title',
                header: 'Realisasi',
                render: (item) => (
                  <div>
                    <div className="font-medium text-[#18343a]">{item.title}</div>
                    <div className="mt-0.5 text-xs text-[#6d7e68]">
                      {item.moduleKey}
                      {item.sopCode ? ` · ${item.sopCode}` : ''}
                    </div>
                  </div>
                ),
              },
              {
                key: 'period',
                header: 'Periode',
                render: (item) => (
                  <span className="text-sm text-[#51614c]">
                    {formatRhkPeriod(item)}
                  </span>
                ),
              },
              {
                key: 'score',
                header: 'Skor',
                render: (item) => (
                  <span className="font-semibold text-[#18343a]">
                    {formatScore(item.finalScore)}
                  </span>
                ),
              },
              {
                key: 'evidence',
                header: 'Snapshot Bukti',
                render: (item) => (
                  <EvidenceSnapshotViewer data={item.evidenceSnapshotJson} />
                ),
              },
            ]}
          />
          <p className="mt-2 text-xs text-[#6d7e68]">Total: {items.length} realisasi</p>
        </>
      ) : (
        <div className="py-4 text-center text-sm text-[#6d7e68]">
          Klik "Muat Bundle" untuk menampilkan data bukti dukung.
        </div>
      )}

      <div className="mt-3 rounded-lg border border-[#e5ede0] bg-[#f9fdf6] p-3">
        <FileMeta
          label="Arsip ke DMS"
          value={
            <span className="text-xs text-[#6d7e68]">
              Belum tersedia — laporan eksekutif belum memiliki dokumen PDF yang dapat disimpan ke DMS.
            </span>
          }
        />
      </div>
    </SectionCard>
  );
}
