import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FolderSync,
  Info,
  Layers3,
  RefreshCcw,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';
import type { AsnRecord, PaginatedResult } from '@/lib/api/types';
import {
  buildImportAggregate,
  getBatchFileName,
  getErrorMessage,
  getQualityTone,
  normalizeList,
  shortId,
  sortByCreatedAtDesc,
  toNumber,
  type SidataBatchListResponse,
  type SidataImportBatchWithKind,
} from '@/lib/sidata';
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
  formatDateTime,
} from '@/components/workspace/ui';
import { SidataSopPanel } from '@/components/workspace/sidata/sidata-sop-panel';
import { SIDATA_SOP_LIST } from '@/lib/sidata/sidata-sop-data';

// ── Types ─────────────────────────────────────────────────────────────────────

type AsnListResponse = PaginatedResult<AsnRecord>;

// ── Pipeline steps ────────────────────────────────────────────────────────────

type PipelineStep = {
  step: number;
  title: string;
  description: string;
  path: string;
};

const PIPELINE_STEPS: PipelineStep[] = [
  {
    step: 1,
    title: 'Upload SIASN',
    description: 'Upload file data ASN dari SIASN.',
    path: '/sidata/import/siasn',
  },
  {
    step: 2,
    title: 'Mapping Referensi',
    description: 'Petakan baris ke master referensi.',
    path: '/sidata/import/mapping-referensi',
  },
  {
    step: 3,
    title: 'Validasi Data',
    description: 'Periksa kualitas dan konsistensi data.',
    path: '/sidata/validasi',
  },
  {
    step: 4,
    title: 'Commit Data',
    description: 'Terapkan data ke master ASN SIDATA.',
    path: '/sidata/import/siasn',
  },
  {
    step: 5,
    title: 'Audit Log',
    description: 'Pantau audit trail seluruh proses.',
    path: '/sidata/import/log-sinkronisasi',
  },
];

// ── Quick actions ─────────────────────────────────────────────────────────────

type QuickAction = {
  label: string;
  description: string;
  path: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Import SIASN',
    description: 'Upload file ASN terbaru dari SIASN.',
    path: '/sidata/import/siasn',
  },
  {
    label: 'Mapping Referensi',
    description: 'Petakan baris batch ke master data.',
    path: '/sidata/import/mapping-referensi',
  },
  {
    label: 'Validasi Data',
    description: 'Periksa kualitas data ASN SIDATA.',
    path: '/sidata/validasi',
  },
  {
    label: 'Riwayat Import',
    description: 'Pantau seluruh batch import ASN.',
    path: '/sidata/import/riwayat',
  },
  {
    label: 'Log Sinkronisasi',
    description: 'Audit trail proses import dan commit.',
    path: '/sidata/import/log-sinkronisasi',
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export function SidataPemutakhiranPage() {
  const navigate = useNavigate();

  const [asnTotal, setAsnTotal] = useState(0);
  const [asnBatches, setAsnBatches] = useState<SidataImportBatchWithKind[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  const stats = useMemo(() => buildImportAggregate(asnBatches), [asnBatches]);

  const recentBatches = useMemo(
    () => [...asnBatches].sort(sortByCreatedAtDesc).slice(0, 10),
    [asnBatches],
  );

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [asnResponse, asnBatchResponse] = await Promise.all([
        apiClient.get<AsnListResponse>('/sidata/asn', { page: 1, limit: 1 }),
        apiClient.get<SidataBatchListResponse>('/sidata/import/asn-batches'),
      ]);

      setAsnTotal(asnResponse.total);
      setAsnBatches(
        normalizeList(asnBatchResponse).map((item) => ({
          ...item,
          kind: 'ASN' as const,
        })),
      );
    } catch (caught) {
      setError(getErrorMessage(caught, 'Gagal memuat data pemutakhiran ASN'));
    } finally {
      setLoading(false);
    }
  }

  const qualityTone = getQualityTone(stats.qualityScore);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pemutakhiran Data ASN"
        description="Pusat kontrol pemutakhiran data ASN melalui pipeline import SIASN, mapping referensi, validasi, dan commit ke master SIDATA."
        meta={
          <>
            <StatusBadge value="Pipeline Import" tone="info" />
            <StatusBadge value="ASN Update" tone="dark" />
            <StatusBadge value="Audit Trail" tone="success" />
          </>
        }
        actions={
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadData()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      <div className="text-xs text-muted-foreground">
        SIDATA ASN / Pemutakhiran Data
      </div>

      {error ? <ErrorAlert message={error} /> : null}

      {/* KPI cards */}
      {loading ? (
        <LoadingState label="Memuat data pemutakhiran ASN" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total ASN"
              value={asnTotal}
              tone="info"
              description="Jumlah data ASN aktif di master SIDATA."
            />
            <StatCard
              icon={Database}
              label="Batch ASN"
              value={stats.asnBatch}
              description="Total batch import ASN dari SIASN."
            />
            <StatCard
              icon={CheckCircle2}
              label="Batch Committed"
              value={stats.committedBatch}
              tone="success"
              description="Batch yang sudah masuk data utama."
            />
            <StatCard
              icon={FolderSync}
              label="Belum Commit"
              value={stats.notCommittedBatch}
              tone="warning"
              description="Batch yang masih perlu tindak lanjut."
            />
            <StatCard
              icon={ShieldAlert}
              label="Needs Review"
              value={stats.needsReviewRows}
              tone="warning"
              description="Akumulasi baris yang perlu review manual."
            />
            <StatCard
              icon={Layers3}
              label="Unmapped Rows"
              value={stats.unmappedRows}
              description="Akumulasi baris yang belum termapping."
            />
            <StatCard
              icon={AlertTriangle}
              label="Invalid Rows"
              value={stats.invalidRows}
              tone="danger"
              description="Akumulasi baris yang tidak valid."
            />
            <StatCard
              icon={BarChart3}
              label="Quality Score"
              value={`${stats.qualityScore}%`}
              tone={qualityTone}
              description="Estimasi kualitas data berdasarkan issue rows."
            />
          </div>

          {/* Pipeline + Quick Actions */}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
            <SectionCard
              title="Alur Pemutakhiran Data"
              description="Lima tahap pipeline pemutakhiran data ASN melalui import SIASN."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:overflow-x-auto sm:pb-2">
                {PIPELINE_STEPS.map((s, index) => (
                  <div key={s.step} className="flex shrink-0 items-start gap-3 sm:flex-col sm:items-center sm:gap-0">
                    <button
                      type="button"
                      className="group flex shrink-0 flex-col items-center text-center focus:outline-none"
                      onClick={() => navigate(s.path)}
                    >
                      <div className="flex size-10 items-center justify-center rounded-full border-2 border-zinc-800 bg-zinc-900 text-sm font-bold text-white transition-colors group-hover:bg-zinc-700">
                        {s.step}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-zinc-900 group-hover:underline">
                        {s.title}
                      </div>
                      <div className="mt-0.5 max-w-[120px] text-xs text-muted-foreground">
                        {s.description}
                      </div>
                    </button>
                    {index < PIPELINE_STEPS.length - 1 ? (
                      <div className="mt-5 flex shrink-0 items-center sm:mt-0 sm:px-2">
                        <ArrowRight className="size-5 text-zinc-400" />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Quality bar */}
              {stats.asnBatch > 0 ? (
                <div className="mt-5 border-t border-border pt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-700">
                    <span>Kualitas Data ASN</span>
                    <span
                      className={
                        qualityTone === 'success'
                          ? 'text-emerald-700'
                          : qualityTone === 'warning'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                      }
                    >
                      {stats.qualityScore}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        qualityTone === 'success'
                          ? 'bg-emerald-500'
                          : qualityTone === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${stats.qualityScore}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Valid:{' '}
                      <span className="font-semibold text-emerald-700">
                        {toNumber(stats.validRows)}
                      </span>
                    </span>
                    <span>
                      Invalid:{' '}
                      <span className="font-semibold text-rose-700">
                        {toNumber(stats.invalidRows)}
                      </span>
                    </span>
                    <span>
                      Needs Review:{' '}
                      <span className="font-semibold text-amber-700">
                        {toNumber(stats.needsReviewRows)}
                      </span>
                    </span>
                    <span>
                      Unmapped:{' '}
                      <span className="font-semibold text-zinc-600">
                        {toNumber(stats.unmappedRows)}
                      </span>
                    </span>
                  </div>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard
              title="Tindak Lanjut"
              description="Navigasi cepat ke workspace pemutakhiran data."
            >
              <div className="grid gap-2">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.path}
                    type="button"
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    onClick={() => navigate(qa.path)}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900">{qa.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{qa.description}</div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-zinc-400" />
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Batch ASN Terbaru */}
          <SectionCard
            title="Batch ASN Terbaru"
            description="10 batch import ASN terbaru beserta status dan kualitas data."
            actions={
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={`${asnBatches.length} Batch`} tone="info" />
                <StatusBadge
                  value={`${stats.committedBatch} Committed`}
                  tone="success"
                />
              </div>
            }
          >
            {recentBatches.length === 0 ? (
              <EmptyState
                icon={FileSpreadsheet}
                title="Belum ada batch ASN"
                description="Upload file SIASN untuk memulai proses pemutakhiran data ASN."
              />
            ) : (
              <DataTable
                empty="Belum ada batch ASN"
                items={recentBatches}
                rowKey={(item) => item.id ?? String(Math.random())}
                columns={[
                  {
                    key: 'id',
                    header: 'Batch',
                    render: (item) => (
                      <div>
                        <div className="font-mono text-xs font-semibold text-zinc-900">
                          {shortId(item.id ?? '-')}
                        </div>
                        <div className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground">
                          {getBatchFileName(item)}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => <StatusBadge value={item.status} />,
                  },
                  {
                    key: 'rows',
                    header: 'Rows',
                    render: (item) => (
                      <div className="grid gap-0.5 text-xs">
                        <span>Total: {toNumber(item.totalRows)}</span>
                        <span className="text-emerald-700">
                          Valid: {toNumber(item.validRows)}
                        </span>
                        <span className="text-rose-700">
                          Invalid: {toNumber(item.invalidRows)}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'mapping',
                    header: 'Mapping',
                    render: (item) => (
                      <div className="grid gap-0.5 text-xs">
                        <span className="text-sky-700">
                          Mapped: {toNumber(item.mappedRows)}
                        </span>
                        <span className="text-amber-700">
                          Review: {toNumber(item.needsReviewRows)}
                        </span>
                        <span className="text-zinc-500">
                          Unmapped: {toNumber(item.unmappedRows)}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'committed',
                    header: 'Committed',
                    render: (item) => (
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-700">
                          {toNumber(item.committedRows)}
                        </span>
                        {item.totalRows ? (
                          <span className="text-muted-foreground">
                            {' '}/ {toNumber(item.totalRows)}
                          </span>
                        ) : null}
                      </div>
                    ),
                  },
                  {
                    key: 'createdAt',
                    header: 'Tanggal',
                    render: (item) => (
                      <span className="whitespace-nowrap text-xs">
                        {formatDateTime(item.createdAt)}
                      </span>
                    ),
                  },
                  {
                    key: 'action',
                    header: 'Aksi',
                    render: () => (
                      <ActionButton
                        icon={ArrowRight}
                        onClick={() => navigate('/sidata/import/siasn')}
                        variant="secondary"
                      >
                        Workspace
                      </ActionButton>
                    ),
                  },
                ]}
              />
            )}
          </SectionCard>

          {/* Limitation notice */}
          <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-zinc-500" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-zinc-800">
                Catatan Batasan Pemutakhiran
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  Pemutakhiran data dilakukan melalui pipeline import — belum tersedia edit
                  individual ASN.
                </li>
                <li>
                  Riwayat perubahan per ASN membutuhkan endpoint tambahan yang belum
                  diimplementasi.
                </li>
                <li>
                  Gunakan alur Upload → Mapping → Validasi → Commit untuk memperbarui data
                  ASN secara teraudit.
                </li>
              </ul>
            </div>
          </div>

          {/* SOP Pemutakhiran */}
          <SidataSopPanel
            sops={SIDATA_SOP_LIST.filter((s) => s.key === 'DAT-002' || s.key === 'DAT-003')}
            title="SOP Pemutakhiran Data ASN"
          />
        </>
      )}
    </div>
  );
}
