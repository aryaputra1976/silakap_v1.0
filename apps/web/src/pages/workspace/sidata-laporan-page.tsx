import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
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
  getQualityTone,
  mergeImportBatches,
  shortId,
  toNumber,
  type SidataBatchListResponse,
  type SidataImportBatchWithKind,
} from '@/lib/sidata';
import {
  getExecutiveCondition,
  getExecutiveRecommendation,
  getTodayLabel,
} from '@/lib/sidata';
import { SidataReportPanel } from '@/components/workspace/sidata/sidata-report-panel';
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

type JenisJabatanRow = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  isActive: boolean;
};

type JabatanRow = {
  id: string;
  kode: string | null;
  nama: string;
  isActive: boolean;
};

type UnitRow = {
  id: string;
  kode: string | null;
  nama: string;
  parentId?: string | null;
  level?: number | null;
  isActive?: boolean | null;
};

type AsnListResponse = PaginatedResult<AsnRecord>;
type JabatanListResponse = PaginatedResult<JabatanRow>;

export function SidataLaporanPage() {
  const navigate = useNavigate();

  const [asnTotal, setAsnTotal] = useState(0);
  const [unitTotal, setUnitTotal] = useState(0);
  const [jabatanTotal, setJabatanTotal] = useState(0);
  const [jenisJabatanTotal, setJenisJabatanTotal] = useState(0);
  const [batches, setBatches] = useState<SidataImportBatchWithKind[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadReport();
  }, []);

  const stats = useMemo(() => buildImportAggregate(batches), [batches]);
  const recentBatches = useMemo(() => batches.slice(0, 10), [batches]);
  const qualityTone = getQualityTone(stats.qualityScore);

  async function loadReport() {
    setLoading(true);
    setError('');

    try {
      const [
        asnResponse,
        asnBatchResponse,
        referenceBatchResponse,
        jenisJabatanResponse,
        jabatanResponse,
        unitsResponse,
      ] = await Promise.all([
        apiClient.get<AsnListResponse>('/sidata/asn', { page: 1, limit: 1 }),
        apiClient.get<SidataBatchListResponse>('/sidata/import/asn-batches'),
        apiClient.get<SidataBatchListResponse>('/sidata/import/reference-batches'),
        apiClient.get<JenisJabatanRow[]>('/sidata/references/jenis-jabatan'),
        apiClient.get<JabatanListResponse>('/sidata/references/jabatan', {
          page: 1,
          limit: 1,
        }),
        apiClient.get<UnitRow[]>('/sidata/units'),
      ]);

      setAsnTotal(asnResponse.total);
      setUnitTotal(unitsResponse.length);
      setJabatanTotal(jabatanResponse.total);
      setJenisJabatanTotal(jenisJabatanResponse.length);
      setBatches(mergeImportBatches(asnBatchResponse, referenceBatchResponse));
    } catch (caught) {
      setError(getErrorMessage(caught, 'Gagal memuat laporan SIDATA'));
    } finally {
      setLoading(false);
    }
  }

  function openBatchWorkspace(batch: SidataImportBatchWithKind) {
    if (batch.kind === 'ASN') {
      navigate('/sidata/import/mapping-referensi');
      return;
    }

    navigate('/sidata/import/referensi');
  }

  if (loading) {
    return <LoadingState label="Memuat laporan SIDATA" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Laporan SIDATA"
        description="Ringkasan eksekutif data ASN, referensi, import, dan kualitas data SIDATA."
        meta={
          <>
            <span className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-600">
              SIDATA ASN / Laporan
            </span>
            <StatusBadge value="Executive Report" tone="info" />
            <StatusBadge value="SIDATA" tone="dark" />
            <StatusBadge value="BKPSDM" tone="success" />
          </>
        }
        actions={
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadReport()}
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
          icon={Building2}
          label="Unit Organisasi"
          value={unitTotal}
          description="Jumlah unit organisasi aktif."
        />
        <StatCard
          icon={Layers3}
          label="Total Jabatan"
          value={jabatanTotal}
          tone="dark"
          description="Jumlah referensi jabatan."
        />
        <StatCard
          icon={Database}
          label="Jenis Jabatan"
          value={jenisJabatanTotal}
          description="Jumlah jenis jabatan aktif."
        />
        <StatCard
          icon={FolderSync}
          label="Total Batch Import"
          value={stats.totalBatch}
          description="Batch ASN dan referensi."
        />
        <StatCard
          icon={CheckCircle2}
          label="Committed Batch"
          value={stats.committedBatch}
          tone="success"
          description="Batch yang sudah masuk data utama."
        />
        <StatCard
          icon={ShieldAlert}
          label="Batch Bermasalah"
          value={stats.problemBatch}
          tone={stats.problemBatch > 0 ? 'warning' : 'success'}
          description="Batch yang membutuhkan tindak lanjut."
        />
        <StatCard
          icon={BarChart3}
          label="Quality Score"
          value={`${stats.qualityScore}%`}
          tone={qualityTone}
          description="Estimasi kualitas data import."
        />
      </div>

      <SectionCard
        title="Kualitas Data Import"
        description="Rekapitulasi kualitas data berdasarkan seluruh batch import ASN dan referensi."
      >
        {batches.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="Belum ada data import"
            description="Belum tersedia batch import ASN atau referensi untuk dihitung dalam laporan."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={FileSpreadsheet}
              label="Total Rows"
              value={stats.totalRows}
              description="Akumulasi seluruh baris import."
            />
            <StatCard
              icon={CheckCircle2}
              label="Valid Rows"
              value={stats.validRows}
              tone="success"
              description="Baris yang lolos validasi."
            />
            <StatCard
              icon={AlertTriangle}
              label="Invalid Rows"
              value={stats.invalidRows}
              tone="danger"
              description="Baris yang tidak lolos validasi."
            />
            <StatCard
              icon={ShieldCheck}
              label="Warning Rows"
              value={stats.warningRows}
              tone="warning"
              description="Baris dengan catatan validasi."
            />
            <StatCard
              icon={Layers3}
              label="Mapped Rows"
              value={stats.mappedRows}
              tone="info"
              description="Baris yang berhasil dimapping."
            />
            <StatCard
              icon={ShieldAlert}
              label="Needs Review"
              value={stats.needsReviewRows}
              tone="warning"
              description="Baris yang perlu review manual."
            />
            <StatCard
              icon={RefreshCcw}
              label="Unmapped Rows"
              value={stats.unmappedRows}
              description="Baris yang belum memiliki referensi."
            />
            <StatCard
              icon={CheckCircle2}
              label="Committed Rows"
              value={stats.committedRows}
              tone="success"
              description="Baris yang sudah masuk data utama."
            />
          </div>
        )}
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.55fr)]">
        <SectionCard
          title="Rekap Import"
          description="Komposisi status batch import SIDATA."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={Database}
              label="Batch ASN"
              value={stats.asnBatch}
              tone="info"
              description="Batch import data ASN SIASN."
            />
            <StatCard
              icon={Layers3}
              label="Batch Referensi"
              value={stats.referenceBatch}
              tone="dark"
              description="Batch import master referensi."
            />
            <StatCard
              icon={CheckCircle2}
              label="Committed"
              value={stats.committedBatch}
              tone="success"
              description="Batch yang sudah committed."
            />
            <StatCard
              icon={AlertTriangle}
              label="Failed"
              value={stats.failedBatch}
              tone="danger"
              description="Batch dengan status gagal."
            />
            <StatCard
              icon={RefreshCcw}
              label="Belum Commit"
              value={stats.notCommittedBatch}
              tone="warning"
              description="Batch yang belum committed."
            />
            <StatCard
              icon={ShieldAlert}
              label="Butuh Review"
              value={stats.problemBatch}
              tone={stats.problemBatch > 0 ? 'warning' : 'success'}
              description="Batch dengan issue validasi."
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Aksi Laporan"
          description="Shortcut untuk menindaklanjuti hasil laporan."
        >
          <div className="grid gap-3">
            <ActionButton
              icon={Database}
              onClick={() => navigate('/sidata/dashboard')}
              variant="secondary"
            >
              Dashboard SIDATA
            </ActionButton>
            <ActionButton
              icon={ShieldCheck}
              onClick={() => navigate('/sidata/validasi')}
              variant="secondary"
            >
              Validasi Data
            </ActionButton>
            <ActionButton
              icon={FolderSync}
              onClick={() => navigate('/sidata/import/riwayat')}
              variant="secondary"
            >
              Riwayat Import
            </ActionButton>
            <ActionButton
              icon={Layers3}
              onClick={() => navigate('/sidata/import/mapping-referensi')}
              variant="secondary"
            >
              Mapping Referensi
            </ActionButton>
            <ActionButton
              icon={ClipboardList}
              onClick={() => navigate('/sidata/referensi')}
              variant="secondary"
            >
              Referensi Data
            </ActionButton>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Narasi Executive"
        description="Ringkasan formal yang dapat digunakan sebagai bahan laporan bulanan, triwulan, atau bahan pimpinan."
      >
        <div className="space-y-5 rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm leading-7 text-zinc-800">
          <div>
            <h3 className="font-semibold text-zinc-950">Ringkasan Kondisi Data</h3>
            <p className="mt-2">
              Berdasarkan data SIDATA per tanggal {getTodayLabel()}, jumlah ASN
              tercatat sebanyak <strong>{asnTotal}</strong> orang pada{' '}
              <strong>{unitTotal}</strong> unit organisasi. Referensi jabatan yang
              tersedia sebanyak <strong>{jabatanTotal}</strong> data, dengan{' '}
              <strong>{jenisJabatanTotal}</strong> jenis jabatan sebagai dasar
              klasifikasi. Proses sinkronisasi dan import data telah menghasilkan{' '}
              <strong>{stats.totalBatch}</strong> batch import, terdiri dari{' '}
              <strong>{stats.asnBatch}</strong> batch ASN dan{' '}
              <strong>{stats.referenceBatch}</strong> batch referensi.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-950">Catatan Tindak Lanjut</h3>
            <p className="mt-2">
              Tingkat kualitas data import berada pada skor{' '}
              <strong>{stats.qualityScore}%</strong> dan dikategorikan{' '}
              <strong>{getExecutiveCondition(stats.qualityScore)}</strong>. Terdapat{' '}
              <strong>{stats.invalidRows}</strong> baris invalid,{' '}
              <strong>{stats.warningRows}</strong> baris warning,{' '}
              <strong>{stats.needsReviewRows}</strong> baris perlu review, dan{' '}
              <strong>{stats.unmappedRows}</strong> baris belum termapping. Batch yang
              telah committed sebanyak <strong>{stats.committedBatch}</strong> batch,
              sedangkan <strong>{stats.notCommittedBatch}</strong> batch masih belum
              committed dan <strong>{stats.problemBatch}</strong> batch memerlukan
              tindak lanjut.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-950">Rekomendasi</h3>
            <p className="mt-2">{getExecutiveRecommendation(stats.qualityScore)}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Batch Import Terbaru"
        description="Sepuluh batch import terbaru sebagai ringkasan operasional."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={`${recentBatches.length} Ditampilkan`} tone="info" />
            <StatusBadge value={`${batches.length} Total`} tone="neutral" />
          </div>
        }
      >
        {recentBatches.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="Belum ada batch import"
            description="Belum tersedia riwayat import untuk ditampilkan."
          />
        ) : (
          <DataTable
            empty="Belum ada batch import"
            items={recentBatches}
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
                  <div className="max-w-[300px]">
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
                key: 'total',
                header: 'Total',
                render: (item) => toNumber(item.totalRows),
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
                key: 'createdAt',
                header: 'Tanggal',
                render: (item) => formatDateTime(item.createdAt),
              },
              {
                key: 'action',
                header: 'Action',
                render: (item) => (
                  <ActionButton
                    onClick={() => openBatchWorkspace(item)}
                    variant="secondary"
                  >
                    Buka
                  </ActionButton>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      {/* RHK 5 / RHK 6 Reporting */}
      <SectionCard
        title="Laporan RHK SIDATA"
        description="Kaitkan data pemutakhiran dan sinkronisasi dengan realisasi RHK 5 (SIK) dan RHK 6 (DAT) di Kinerja Bidang."
      >
        <SidataReportPanel />
      </SectionCard>
    </div>
  );
}
