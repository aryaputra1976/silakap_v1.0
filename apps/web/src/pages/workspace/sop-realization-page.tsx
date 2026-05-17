import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { BarChart3, FileText, Plus, RefreshCw } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { SopRealizationForm } from '@/components/workspace/sop/sop-realization-form';
import { SopRealizationTable } from '@/components/workspace/sop/sop-realization-table';
import { ApiError } from '@/lib/api/client';
import {
  kinerjaBidangApi,
  type KinerjaBidangRealization,
} from '@/lib/api/kinerja-bidang';

type ViewMode = 'list' | 'create';

export function SopRealizationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryYear = searchParams.get('year');
  const queryMode = searchParams.get('mode');
  const queryTargetId = searchParams.get('targetId') ?? undefined;

  const [year, setYear] = useState(queryYear || String(new Date().getFullYear()));
  const [items, setItems] = useState<KinerjaBidangRealization[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(queryMode === 'create' ? 'create' : 'list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedTargetInfo = useMemo(() => {
    if (!queryTargetId) {
      return null;
    }

    return 'Target SOP/RHK sudah dipilih dari halaman Monitoring/Laporan.';
  }, [queryTargetId]);

  function syncUrl(nextMode: ViewMode, nextYear = year) {
    const params = new URLSearchParams(searchParams);

    params.set('year', nextYear);
    params.set('mode', nextMode);

    if (queryTargetId) {
      params.set('targetId', queryTargetId);
    }

    setSearchParams(params);
  }

  async function loadRealizations() {
    setLoading(true);
    setError('');

    try {
      const result = await kinerjaBidangApi.listRealizations({ year });
      setItems(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat realisasi SOP/RHK',
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    const nextMode = viewMode === 'create' ? 'list' : 'create';
    setViewMode(nextMode);
    syncUrl(nextMode);
  }

  function updateYear(value: string) {
    setYear(value);

    const params = new URLSearchParams(searchParams);
    params.set('year', value);
    setSearchParams(params);
  }

  useEffect(() => {
    void loadRealizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Realisasi SOP/RHK"
        description="Input, submit, review, approve, dan tautkan bukti dukung DMS untuk realisasi kinerja bidang."
        meta={
          <>
            <StatusBadge value="Kinerja Bidang" tone="dark" />
            <StatusBadge value="Realisasi Resmi" tone="info" />
            <StatusBadge value={year} tone="success" />
          </>
        }
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={BarChart3}
              onClick={() => navigate('/kinerja-bidang/monitoring')}
            >
              Monitoring
            </ActionButton>
            <ActionButton
              variant="secondary"
              icon={FileText}
              onClick={() => navigate('/kinerja-bidang/laporan')}
            >
              Laporan
            </ActionButton>
            <ActionButton icon={viewMode === 'create' ? RefreshCw : Plus} onClick={toggleMode}>
              {viewMode === 'create' ? 'Lihat Daftar' : 'Input Realisasi'}
            </ActionButton>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <SectionCard
        title="Filter Tahun"
        description="Pilih tahun target SOP/RHK yang akan dilihat atau diinput realisasinya."
        actions={
          <ActionButton
            variant="secondary"
            icon={RefreshCw}
            disabled={loading}
            onClick={() => void loadRealizations()}
          >
            Refresh
          </ActionButton>
        }
      >
        <div className="max-w-xs">
          <input
            className="h-10 w-full rounded-md border border-[#c9d9c4] bg-white px-3 text-sm text-[#173c36] outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#a9d7cc]"
            inputMode="numeric"
            maxLength={4}
            value={year}
            onChange={(event) => updateYear(event.target.value)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Alur Realisasi" description="Panduan singkat status realisasi SOP/RHK.">
        <div className="grid gap-3 text-sm leading-6 text-[#51614c] md:grid-cols-5">
          <div className="rounded-lg border border-[#d8e5d3] bg-white p-3">
            <strong className="text-[#173c36]">Draft</strong>
            <p>Input awal dan masih bisa diedit.</p>
          </div>
          <div className="rounded-lg border border-[#d8e5d3] bg-white p-3">
            <strong className="text-[#173c36]">Submitted</strong>
            <p>Dikirim untuk review.</p>
          </div>
          <div className="rounded-lg border border-[#d8e5d3] bg-white p-3">
            <strong className="text-[#173c36]">Reviewed</strong>
            <p>Sudah diperiksa reviewer.</p>
          </div>
          <div className="rounded-lg border border-[#d8e5d3] bg-white p-3">
            <strong className="text-[#173c36]">Approved</strong>
            <p>Final dan terkunci.</p>
          </div>
          <div className="rounded-lg border border-[#d8e5d3] bg-white p-3">
            <strong className="text-[#173c36]">Perlu Revisi</strong>
            <p>Dikembalikan untuk perbaikan.</p>
          </div>
        </div>
      </SectionCard>

      {selectedTargetInfo && viewMode === 'create' ? (
        <div className="rounded-lg border border-[#9fd6dc] bg-[#e7f6f5] p-4 text-sm text-[#096672]">
          {selectedTargetInfo}
        </div>
      ) : null}

      {viewMode === 'create' ? (
        <SopRealizationForm
          year={year}
          initialTargetId={queryTargetId}
          onCreated={(id) => navigate(`/kinerja-bidang/realisasi/${id}`)}
        />
      ) : loading ? (
        <LoadingState label="Memuat realisasi SOP/RHK" />
      ) : (
        <SectionCard
          title="Daftar Realisasi SOP/RHK"
          description="Realisasi yang sudah dibuat dari target SOP/RHK backend."
        >
          <SopRealizationTable items={items} />
        </SectionCard>
      )}
    </div>
  );
}
