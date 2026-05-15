import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FolderSync,
  Layers3,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';
import type { AsnRecord, PaginatedResult } from '@/lib/api/types';
import {
  buildImportAggregate,
  getBatchFileName,
  getBatchTypeLabel,
  getErrorMessage,
  isProblemBatch,
  mergeImportBatches,
  shortId,
  toNumber,
  type SidataBatchListResponse,
  type SidataImportBatchWithKind,
} from '@/lib/sidata';
import {
  getQualityDescription,
  getQualityTitle,
  getQualityTone,
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

type AsnListResponse = PaginatedResult<AsnRecord>;

export function SidataValidasiPage() {
  const navigate = useNavigate();

  const [asnTotal, setAsnTotal] = useState(0);
  const [asnSamples, setAsnSamples] = useState<AsnRecord[]>([]);
  const [batches, setBatches] = useState<SidataImportBatchWithKind[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadValidationDashboard();
  }, []);

  const stats = useMemo(() => buildImportAggregate(batches), [batches]);

  const problemBatches = useMemo(() => {
    return batches.filter(isProblemBatch);
  }, [batches]);

  async function loadValidationDashboard() {
    setLoading(true);
    setError('');

    try {
      const [asnResponse, asnBatchResponse, referenceBatchResponse] =
        await Promise.all([
          apiClient.get<AsnListResponse>('/sidata/asn', { page: 1, limit: 10 }),
          apiClient.get<SidataBatchListResponse>('/sidata/import/asn-batches'),
          apiClient.get<SidataBatchListResponse>('/sidata/import/reference-batches'),
        ]);

      setAsnTotal(asnResponse.total);
      setAsnSamples(asnResponse.items);
      setBatches(mergeImportBatches(asnBatchResponse, referenceBatchResponse));
    } catch (caught) {
      setError(getErrorMessage(caught, 'Gagal memuat validasi data SIDATA'));
    } finally {
      setLoading(false);
    }
  }

  function openBatchAction(batch: SidataImportBatchWithKind) {
    if (batch.kind === 'ASN') {
      navigate('/sidata/import/mapping-referensi');
      return;
    }

    navigate('/sidata/import/referensi');
  }

  if (loading) {
    return <LoadingState label="Memuat validasi data SIDATA" />;
  }

  const qualityTone = getQualityTone(stats.qualityScore);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Validasi Data SIDATA"
        description="Monitoring kualitas data ASN, hasil validasi import, dan daftar batch yang memerlukan tindak lanjut."
        meta={
          <>
            <span className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-600">
              SIDATA ASN / Validasi Data
            </span>
            <StatusBadge value="Data Quality" tone="info" />
            <StatusBadge value="SIDATA" tone="dark" />
            <StatusBadge value="Monitoring" tone="success" />
          </>
        }
        actions={
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadValidationDashboard()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total ASN"
          value={asnTotal}
          tone="info"
          description="Jumlah ASN pada master SIDATA."
        />
        <StatCard
          icon={FolderSync}
          label="Total Batch"
          value={stats.totalBatch}
          description="Jumlah batch ASN dan referensi."
        />
        <StatCard
          icon={AlertTriangle}
          label="Invalid Rows"
          value={stats.invalidRows}
          tone="danger"
          description="Baris yang tidak lolos validasi."
        />
        <StatCard
          icon={ShieldAlert}
          label="Warning Rows"
          value={stats.warningRows}
          tone="warning"
          description="Baris dengan catatan validasi."
        />
        <StatCard
          icon={ShieldAlert}
          label="Needs Review"
          value={stats.needsReviewRows}
          tone="warning"
          description="Baris yang perlu pemeriksaan manual."
        />
        <StatCard
          icon={RefreshCcw}
          label="Unmapped Rows"
          value={stats.unmappedRows}
          description="Baris yang belum memiliki referensi."
        />
        <StatCard
          icon={Database}
          label="Quality Score"
          value={`${stats.qualityScore}%`}
          tone={qualityTone}
          description="Estimasi kualitas data import berdasarkan issue rows."
        />
        <StatCard
          icon={FileSpreadsheet}
          label="Batch Bermasalah"
          value={stats.problemBatch}
          tone={stats.problemBatch > 0 ? 'warning' : 'success'}
          description="Batch yang membutuhkan tindak lanjut."
        />
      </div>

      <SectionCard
        title="Status Kualitas Data"
        description="Ringkasan kualitas berdasarkan hasil import, validasi, dan mapping referensi."
      >
        <div
          className={
            qualityTone === 'success'
              ? 'rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-800'
              : qualityTone === 'warning'
                ? 'rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900'
                : 'rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800'
          }
        >
          <div className="flex items-start gap-3">
            {qualityTone === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            )}

            <div>
              <div className="text-base font-semibold">
                {getQualityTitle(stats.qualityScore)}
              </div>
              <p className="mt-1 text-sm leading-6">
                {getQualityDescription(stats.qualityScore)}
              </p>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-md border border-current/20 bg-white/50 p-3">
                  <div className="text-xs font-semibold uppercase">Total Rows</div>
                  <div className="mt-1 text-xl font-semibold">{stats.totalRows}</div>
                </div>
                <div className="rounded-md border border-current/20 bg-white/50 p-3">
                  <div className="text-xs font-semibold uppercase">Valid Rows</div>
                  <div className="mt-1 text-xl font-semibold">{stats.validRows}</div>
                </div>
                <div className="rounded-md border border-current/20 bg-white/50 p-3">
                  <div className="text-xs font-semibold uppercase">Mapped Rows</div>
                  <div className="mt-1 text-xl font-semibold">{stats.mappedRows}</div>
                </div>
                <div className="rounded-md border border-current/20 bg-white/50 p-3">
                  <div className="text-xs font-semibold uppercase">
                    Committed Rows
                  </div>
                  <div className="mt-1 text-xl font-semibold">
                    {stats.committedRows}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Batch Memerlukan Tindak Lanjut"
        description="Daftar batch ASN dan referensi yang masih memiliki invalid, warning, needs review, unmapped, atau status failed."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={`${problemBatches.length} Batch`} tone="warning" />
            <ActionButton
              icon={FolderSync}
              onClick={() => navigate('/sidata/import/riwayat')}
              variant="secondary"
            >
              Riwayat Import
            </ActionButton>
          </div>
        }
      >
        {problemBatches.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Tidak ada batch bermasalah"
            description="Semua batch saat ini tidak memiliki issue validasi yang perlu ditindaklanjuti."
          />
        ) : (
          <DataTable
            empty="Tidak ada batch bermasalah"
            items={problemBatches}
            rowKey={(item) => `${item.kind}-${item.id}`}
            columns={[
              {
                key: 'batch',
                header: 'Batch',
                render: (item) => (
                  <span className="font-mono text-xs font-semibold text-zinc-900">
                    {shortId(item.id)}
                  </span>
                ),
              },
              {
                key: 'kind',
                header: 'Jenis',
                render: (item) => (
                  <StatusBadge
                    value={item.kind === 'ASN' ? 'ASN' : 'Referensi'}
                    tone={item.kind === 'ASN' ? 'info' : 'dark'}
                  />
                ),
              },
              {
                key: 'file',
                header: 'File',
                render: (item) => (
                  <div className="max-w-[320px]">
                    <div className="truncate font-semibold text-zinc-900">
                      {getBatchFileName(item)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {getBatchTypeLabel(item)}
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
                key: 'invalid',
                header: 'Invalid',
                render: (item) => (
                  <span className="font-semibold text-rose-700">
                    {toNumber(item.invalidRows)}
                  </span>
                ),
              },
              {
                key: 'warning',
                header: 'Warning',
                render: (item) => (
                  <span className="font-semibold text-amber-700">
                    {toNumber(item.warningRows)}
                  </span>
                ),
              },
              {
                key: 'needsReview',
                header: 'Review',
                render: (item) => (
                  <span className="font-semibold text-amber-700">
                    {toNumber(item.needsReviewRows)}
                  </span>
                ),
              },
              {
                key: 'unmapped',
                header: 'Unmapped',
                render: (item) => (
                  <span className="font-semibold text-zinc-700">
                    {toNumber(item.unmappedRows)}
                  </span>
                ),
              },
              {
                key: 'createdAt',
                header: 'Tanggal',
                render: (item) => formatDateTime(item.createdAt),
              },
              {
                key: 'action',
                header: 'Action',
                render: (item) => (
                  <ActionButton
                    icon={ShieldCheck}
                    onClick={() => openBatchAction(item)}
                    variant="secondary"
                  >
                    Tindak Lanjut
                  </ActionButton>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.5fr)]">
        <SectionCard
          title="Sampling ASN"
          description="Contoh data ASN dari halaman pertama master SIDATA."
        >
          <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-800">
            Sampling ini berasal dari halaman pertama data ASN. Untuk validasi penuh
            seluruh ASN, diperlukan endpoint backend validasi khusus yang menghitung
            anomali pada seluruh dataset.
          </div>

          {asnSamples.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada data ASN"
              description="Data ASN belum tersedia atau belum berhasil dimuat."
            />
          ) : (
            <DataTable
              empty="Belum ada data ASN"
              items={asnSamples}
              rowKey={(item) => item.id}
              columns={[
                {
                  key: 'nip',
                  header: 'NIP',
                  render: (item) => (
                    <span className="font-mono text-xs font-semibold text-zinc-800">
                      {item.nip}
                    </span>
                  ),
                },
                {
                  key: 'nama',
                  header: 'Nama',
                  render: (item) => (
                    <div>
                      <div className="font-semibold text-zinc-900">{item.nama}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.email ?? '-'}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'unit',
                  header: 'Unit Kerja',
                  render: (item) => item.unitKerja?.nama ?? '-',
                },
                {
                  key: 'jabatan',
                  header: 'Jabatan',
                  render: (item) => item.jabatanNama ?? '-',
                },
                {
                  key: 'golongan',
                  header: 'Golongan',
                  render: (item) => item.golonganNama ?? '-',
                },
                {
                  key: 'jenisAsn',
                  header: 'Jenis ASN',
                  render: (item) => item.jenisAsn ?? '-',
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (item) => <StatusBadge value={item.statusAsn} />,
                },
              ]}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Aksi Perbaikan"
          description="Shortcut tindak lanjut validasi data."
        >
          <div className="grid gap-3">
            <ActionButton
              icon={ShieldCheck}
              onClick={() => navigate('/sidata/import/mapping-referensi')}
              variant="secondary"
            >
              Review Mapping
            </ActionButton>
            <ActionButton
              icon={FileSpreadsheet}
              onClick={() => navigate('/sidata/import/siasn')}
              variant="secondary"
            >
              Import SIASN
            </ActionButton>
            <ActionButton
              icon={Layers3}
              onClick={() => navigate('/sidata/import/referensi')}
              variant="secondary"
            >
              Import Referensi
            </ActionButton>
            <ActionButton
              icon={FolderSync}
              onClick={() => navigate('/sidata/import/riwayat')}
              variant="secondary"
            >
              Riwayat Import
            </ActionButton>
            <ActionButton
              icon={Database}
              onClick={() => navigate('/sidata/referensi')}
              variant="secondary"
            >
              Referensi Data
            </ActionButton>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
