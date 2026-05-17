import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  BarChart3,
  FileCheck2,
  FileText,
  GitBranch,
} from 'lucide-react';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  getSopDetail,
  type SopDetail,
  type SopProcedureStep,
  type SopSignature,
} from '@/lib/sop/sop-data';
import { getSopStageLabel, getSopStageTone } from '@/lib/sop/sop-ui';
import { SopEvidencePanel } from '@/components/workspace/sop/sop-evidence-panel';
import {
  SopDataSourceBadge,
  type SopDataSource,
} from '@/components/workspace/sop/sop-data-source-badge';
import { kinerjaBidangApi } from '@/lib/api/kinerja-bidang';
import { backendSopToSopDetail } from '@/lib/sop/sop-backend-adapter';

type DetailTab =
  | 'ringkasan'
  | 'target'
  | 'prosedur'
  | 'bukti'
  | 'tanda-tangan';

const tabs: Array<{ key: DetailTab; label: string }> = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'target', label: 'Target RHK' },
  { key: 'prosedur', label: 'Langkah Prosedur' },
  { key: 'bukti', label: 'Bukti Dukung' },
  { key: 'tanda-tangan', label: 'Tanda Tangan' },
];

export function SopDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<DetailTab>('ringkasan');
  const [backendSop, setBackendSop] = useState<SopDetail | null>(null);
  const [source, setSource] = useState<SopDataSource>('static');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const staticSop = useMemo(() => getSopDetail(id), [id]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        let result;

        try {
          result = await kinerjaBidangApi.getSop(id);
        } catch (initialError) {
          if (!staticSop?.code || staticSop.code === id) {
            throw initialError;
          }

          result = await kinerjaBidangApi.getSop(staticSop.code);
        }

        if (!mounted) {
          return;
        }

        setBackendSop(backendSopToSopDetail(result));
        setSource('backend');
      } catch (caught) {
        if (!mounted) {
          return;
        }

        setBackendSop(null);
        setSource('static');
        setError(
          caught instanceof Error
            ? caught.message
            : 'Detail backend belum tersedia untuk SOP ini.',
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
  }, [id, staticSop?.code]);

  const sop = backendSop ?? staticSop;

  if (loading && !sop) {
    return <LoadingState label="Memuat detail SOP" />;
  }

  if (!sop) {
    return <Navigate to="/kinerja-bidang/sop" replace />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={sop.title}
        description={sop.shortDescription}
        meta={
          <>
            <StatusBadge value={sop.code} tone="dark" />
            <StatusBadge
              value={getSopStageLabel(sop.stage)}
              tone={getSopStageTone(sop.stage)}
            />
            {sop.rhkCodes.map((rhk) => (
              <StatusBadge key={rhk} value={rhk} tone="info" />
            ))}
            <StatusBadge
              value={sop.isRhkPrimary ? 'SOP Utama RHK' : 'SOP Pendukung'}
              tone={sop.isRhkPrimary ? 'success' : 'neutral'}
            />
            <SopDataSourceBadge source={source} error={error} />
          </>
        }
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => navigate('/kinerja-bidang/sop')}
            >
              Kembali
            </ActionButton>
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

      {error && !backendSop ? (
        <ErrorAlert
          message={`${error} Halaman memakai detail statis sebagai cadangan agar pengguna tetap bisa membaca SOP.`}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Target Kuantitas"
          value={`${sop.targetQuantity} ${sop.targetUnit}`}
          icon={FileCheck2}
        />
        <StatCard
          label="Target Kualitas"
          value={sop.qualityTarget}
          icon={FileCheck2}
          tone="success"
        />
        <StatCard
          label="Target Waktu"
          value={sop.timeTarget}
          icon={FileCheck2}
          tone="info"
        />
      </div>

      <SectionCard>
        <div className="mb-5 flex flex-wrap gap-2 border-b border-[#d8e5d3] pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'border-[#0f766e] bg-[#0f766e] text-white'
                  : 'border-[#c9d9c4] bg-white text-[#173c36] hover:bg-[#eef7ec]'
              }`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'ringkasan' ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase text-[#173c36]">
                Dasar Hukum
              </h3>
              <ul className="space-y-2 text-sm leading-6 text-[#51614c]">
                {sop.legalBasis.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-[#d8e5d3] bg-white px-3 py-2"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase text-[#173c36]">
                  Tujuan
                </h3>
                <p className="rounded-md border border-[#d8e5d3] bg-white p-4 text-sm leading-6 text-[#51614c]">
                  {sop.objective}
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase text-[#173c36]">
                  Ruang Lingkup
                </h3>
                <p className="rounded-md border border-[#d8e5d3] bg-white p-4 text-sm leading-6 text-[#51614c]">
                  {sop.scope}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'target' ? (
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="RHK Terkait" value={sop.rhkCodes.join(', ')} />
            <StatCard
              label="Kuantitas"
              value={`${sop.targetQuantity} ${sop.targetUnit}`}
            />
            <StatCard label="Kualitas" value={sop.qualityTarget} />
            <StatCard label="Waktu" value={sop.timeTarget} />
            <StatCard label="Tahap SOP" value={getSopStageLabel(sop.stage)} />
            <StatCard
              label="Jenis SOP"
              value={sop.isRhkPrimary ? 'SOP Utama RHK' : 'SOP Pendukung'}
            />
          </div>
        ) : null}

        {activeTab === 'prosedur' ? (
          <DataTable<SopProcedureStep>
            items={sop.procedureSteps}
            empty="Belum ada langkah prosedur"
            rowKey={(item) => String(item.no)}
            columns={[
              { key: 'no', header: 'No', render: (item) => item.no },
              { key: 'activity', header: 'Tahapan', render: (item) => item.activity },
              { key: 'actor', header: 'Pelaksana', render: (item) => item.actor },
              { key: 'input', header: 'Input', render: (item) => item.input },
              { key: 'process', header: 'Proses', render: (item) => item.process },
              { key: 'output', header: 'Output', render: (item) => item.output },
              { key: 'duration', header: 'Waktu', render: (item) => item.duration },
            ]}
          />
        ) : null}

        {activeTab === 'bukti' ? <SopEvidencePanel sop={sop} /> : null}

        {activeTab === 'tanda-tangan' ? (
          <DataTable<SopSignature>
            items={sop.signatures}
            empty="Belum ada data tanda tangan"
            rowKey={(item) => item.role}
            columns={[
              { key: 'role', header: 'Posisi', render: (item) => item.role },
              {
                key: 'name',
                header: 'Nama/Jabatan',
                render: (item) => item.namePlaceholder,
              },
              {
                key: 'signature',
                header: 'Tanda Tangan',
                render: () => (
                  <div className="h-16 rounded-md border border-dashed border-[#b7c9b1] bg-white" />
                ),
              },
            ]}
          />
        ) : null}

        {!activeTab ? <EmptyState title="Tab tidak tersedia" /> : null}
      </SectionCard>
    </div>
  );
}
