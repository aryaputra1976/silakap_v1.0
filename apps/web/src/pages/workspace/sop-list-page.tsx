import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { BarChart3, FileText, GitBranch } from 'lucide-react';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { SopTable } from '@/components/workspace/sop/sop-table';
import {
  SopDataSourceBadge,
  type SopDataSource,
} from '@/components/workspace/sop/sop-data-source-badge';
import { kinerjaBidangApi, type KinerjaBidangSop } from '@/lib/api/kinerja-bidang';
import { backendSopToSopItem } from '@/lib/sop/sop-backend-adapter';

export function SopListPage() {
  const navigate = useNavigate();
  const [backendItems, setBackendItems] = useState<KinerjaBidangSop[]>([]);
  const [source, setSource] = useState<SopDataSource>('static');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const result = await kinerjaBidangApi.listSop({ status: 'ACTIVE' });

        if (!mounted) {
          return;
        }

        setBackendItems(result);
        setSource(result.length > 0 ? 'backend' : 'static');

        if (result.length === 0) {
          setError('Backend belum memiliki data SOP. Jalankan migration dan seed terlebih dahulu.');
        }
      } catch (caught) {
        if (!mounted) {
          return;
        }

        setBackendItems([]);
        setSource('static');
        setError(
          caught instanceof Error
            ? caught.message
            : 'Gagal membaca daftar SOP dari backend.',
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const items = useMemo(
    () => (backendItems.length > 0 ? backendItems.map(backendSopToSopItem) : undefined),
    [backendItems],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Daftar SOP Bidang PPIK"
        description="Daftar seluruh paket SOP Bidang PPIK berdasarkan Tahap 1, Tahap 2, Tahap 3, serta keterkaitannya dengan RHK."
        meta={
          <>
            <StatusBadge value="Paket SOP Bidang PPIK" tone="dark" />
            <StatusBadge value="Tahap 1-3" tone="info" />
            <StatusBadge value="SOP Utama & Pendukung" tone="success" />
            <SopDataSourceBadge source={source} error={error} />
          </>
        }
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={GitBranch}
              onClick={() => navigate('/kinerja-bidang/sop/map')}
            >
              Peta SOP
            </ActionButton>
            <ActionButton
              variant="secondary"
              icon={BarChart3}
              onClick={() => navigate('/kinerja-bidang/monitoring')}
            >
              Monitoring
            </ActionButton>
            <ActionButton
              icon={FileText}
              onClick={() => navigate('/kinerja-bidang/laporan')}
            >
              Laporan
            </ActionButton>
          </>
        }
      />

      {error ? (
        <ErrorAlert message={`${error} Data statis tetap ditampilkan sebagai fallback.`} />
      ) : null}

      {loading ? <LoadingState label="Memuat daftar SOP dari backend" /> : null}

      <SectionCard
        title="Master SOP Bidang PPIK"
        description="Daftar SOP dapat difilter berdasarkan tahap, SOP utama RHK, dan SOP pendukung."
      >
        <SopTable items={items} />
      </SectionCard>
    </div>
  );
}
