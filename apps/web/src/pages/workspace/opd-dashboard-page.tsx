import { useEffect, useState } from 'react';
import { SectionCard } from '@/components/workspace/ui';
import { ApiError } from '@/lib/api/client';
import { opdSubmissionsApi } from '@/lib/api/opd-submissions';
import { OpdEmptyState } from '@/components/workspace/opd/opd-empty-state';
import { OpdPageHeader } from '@/components/workspace/opd/opd-page-header';
import { OpdRequestTable } from '@/components/workspace/opd/opd-request-table';
import { OpdServiceCardGrid } from '@/components/workspace/opd/opd-service-card-grid';
import { OpdStatusTimeline } from '@/components/workspace/opd/opd-status-timeline';
import { OpdSummaryCards } from '@/components/workspace/opd/opd-summary-cards';
import {
  emptyOpdSummary,
  opdServiceCards,
  opdTimeline,
} from '@/lib/opd/opd-portal-data';
import type { OpdSubmission } from '@/lib/opd-submissions/types';

export function OpdDashboardPage() {
  const [summary, setSummary] = useState(emptyOpdSummary);
  const [items, setItems] = useState<OpdSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    Promise.all([
      opdSubmissionsApi.fetchMyOpdSubmissionSummary(),
      opdSubmissionsApi.fetchMyOpdSubmissions({ limit: 5 }),
    ])
      .then(([summaryResult, listResult]) => {
        if (!active) {
          return;
        }

        setSummary(summaryResult);
        setItems(listResult.items);
      })
      .catch((caught) => {
        if (!active) {
          return;
        }

        setSummary(emptyOpdSummary);
        setItems([]);
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Gagal memuat dashboard OPD',
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <OpdPageHeader
        title="Dashboard OPD"
        description="Ringkasan layanan, usulan, dokumen, dan status pengajuan milik OPD yang sedang login."
      />

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}. Dashboard menampilkan empty state aman.
        </div>
      ) : null}

      <OpdSummaryCards summary={summary} />

      <SectionCard
        title="Layanan OPD"
        description="Akses cepat untuk membuat pengajuan dan memantau dokumen OPD."
      >
        <OpdServiceCardGrid items={opdServiceCards} />
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard
          title="Permohonan Terbaru"
          description="Daftar ini hanya menampilkan permohonan milik OPD."
        >
          {loading ? (
            <OpdEmptyState
              title="Memuat permohonan OPD"
              description="Daftar permohonan sedang diambil dari API."
            />
          ) : items.length > 0 ? (
            <OpdRequestTable items={items} />
          ) : (
            <OpdEmptyState
              title="Belum ada permohonan"
              description="Mulai dari Ajukan Layanan atau Ajukan Usulan Pensiun untuk membuat draft OPD."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Status Terakhir"
          description="Jejak status layanan OPD."
        >
          <OpdStatusTimeline items={opdTimeline} />
        </SectionCard>
      </div>
    </div>
  );
}
