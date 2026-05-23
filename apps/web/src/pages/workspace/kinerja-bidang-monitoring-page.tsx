import { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCcw, Loader2, CheckCircle, Clock, FileEdit, XCircle } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  FilterBar,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  formatDateTime,
} from '@/components/workspace/ui';
import {
  kinerjaBidangApi,
  kinerjaRealizationStatusLabel,
  kinerjaRealizationStatusTone,
  type KinerjaBidangRealization,
  type KinerjaBidangReportQuery,
} from '@/lib/api/kinerja-bidang';
import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';

const MONTHS = [
  { value: '', label: 'Semua Bulan' },
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const REVIEWER_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN', 'SEKRETARIS', 'KABID'];

type ReviewAction = 'review' | 'approve' | 'revision';

function statusCount(items: KinerjaBidangRealization[], status: string) {
  return items.filter((item) => item.status === status).length;
}

export function KinerjaBidangMonitoringPage() {
  const { user } = useAuth();
  const role = getPrimaryRole(user?.roles);
  const canReview = role ? REVIEWER_ROLES.includes(role) : false;

  const currentYear = String(new Date().getFullYear());

  const [items, setItems] = useState<KinerjaBidangRealization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [activeAction, setActiveAction] = useState<{ id: string; type: ReviewAction } | null>(null);

  const [query, setQuery] = useState<KinerjaBidangReportQuery>({
    year: currentYear,
    status: '',
    month: '',
  });

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    kinerjaBidangApi
      .listRealizations(query)
      .then((result) => {
        if (mounted) setItems(result);
      })
      .catch((caught) => {
        if (mounted)
          setError(caught instanceof Error ? caught.message : 'Gagal memuat data monitoring');
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

  function updateQuery(updates: Partial<KinerjaBidangReportQuery>) {
    setQuery((prev) => ({ ...prev, ...updates }));
  }

  async function handleAction(id: string, type: ReviewAction) {
    if (type !== 'review') {
      setActiveAction({ id, type });
      setReviewNote('');
      return;
    }
    await executeAction(id, type, '');
  }

  async function executeAction(id: string, type: ReviewAction, note: string) {
    setActionLoading(id);
    setActionError('');
    try {
      if (type === 'review') {
        await kinerjaBidangApi.reviewRealization(id, { reviewNote: note || undefined });
      } else if (type === 'approve') {
        await kinerjaBidangApi.approveRealization(id, { reviewNote: note || undefined });
      } else {
        await kinerjaBidangApi.requestRevision(id, { reviewNote: note || undefined });
      }
      setActiveAction(null);
      setReviewNote('');
      load();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Aksi gagal dilakukan');
    } finally {
      setActionLoading(null);
    }
  }

  const submitted = statusCount(items, 'SUBMITTED');
  const reviewed = statusCount(items, 'REVIEWED');
  const approved = statusCount(items, 'APPROVED');
  const needsRevision = statusCount(items, 'REVISION_REQUIRED');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Monitoring Kegiatan"
        description="Pantau realisasi kegiatan bidang — dari draft hingga disetujui. Review dan tindak lanjuti realisasi yang menunggu validasi."
        meta={
          <>
            <StatusBadge value="Monitoring" tone="dark" />
            <StatusBadge value={`${submitted} menunggu review`} tone="warning" />
          </>
        }
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
      />

      {error ? <ErrorAlert message={error} /> : null}
      {actionError ? <ErrorAlert message={actionError} /> : null}

      {/* Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Menunggu Review"
          value={String(submitted)}
          tone="warning"
          icon={Clock}
        />
        <StatCard
          label="Sudah Direview"
          value={String(reviewed)}
          tone="info"
          icon={Activity}
        />
        <StatCard
          label="Disetujui"
          value={String(approved)}
          tone="success"
          icon={CheckCircle}
        />
        <StatCard
          label="Perlu Revisi"
          value={String(needsRevision)}
          tone="danger"
          icon={XCircle}
        />
      </div>

      {/* Review Note Modal Inline */}
      {activeAction ? (
        <SectionCard
          title={activeAction.type === 'approve' ? 'Konfirmasi Persetujuan' : 'Minta Revisi'}
          description="Tambahkan catatan (opsional) sebelum melanjutkan."
        >
          <div className="space-y-3">
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              rows={3}
              placeholder="Catatan review (opsional)..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
            <div className="flex gap-2">
              <ActionButton
                icon={activeAction.type === 'approve' ? CheckCircle : XCircle}
                variant={activeAction.type === 'approve' ? 'primary' : 'destructive'}
                disabled={!!actionLoading}
                onClick={() => void executeAction(activeAction.id, activeAction.type, reviewNote)}
              >
                {activeAction.type === 'approve' ? 'Setujui' : 'Minta Revisi'}
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => setActiveAction(null)}
              >
                Batal
              </ActionButton>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {/* Table */}
      <SectionCard
        title="Daftar Realisasi Kegiatan"
        description="Seluruh realisasi kegiatan bidang berdasarkan filter tahun, bulan, dan status."
      >
        <FilterBar>
          <select
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-ring"
            value={query.year ?? currentYear}
            onChange={(e) => updateQuery({ year: e.target.value })}
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={String(Number(currentYear) - 1)}>{Number(currentYear) - 1}</option>
          </select>

          <select
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-ring"
            value={query.month ?? ''}
            onChange={(e) => updateQuery({ month: e.target.value })}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-ring"
            value={query.status ?? ''}
            onChange={(e) => updateQuery({ status: e.target.value as KinerjaBidangReportQuery['status'] })}
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="APPROVED">Approved</option>
            <option value="REVISION_REQUIRED">Perlu Revisi</option>
          </select>
        </FilterBar>

        {loading ? (
          <LoadingState label="Memuat data realisasi" />
        ) : (
          <DataTable<KinerjaBidangRealization>
            items={items}
            empty="Belum ada realisasi kegiatan untuk filter yang dipilih"
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'kegiatan',
                header: 'Kegiatan',
                render: (item) => (
                  <div>
                    <div className="font-medium text-foreground">{item.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {item.sop.code} · {item.sop.stage}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">RHK: {item.rhkCode}</div>
                  </div>
                ),
              },
              {
                key: 'period',
                header: 'Periode',
                render: (item) => (
                  <div className="text-sm">
                    <div className="text-foreground">{item.year}</div>
                    {item.month ? (
                      <div className="text-xs text-muted-foreground">
                        Bulan {item.month}
                      </div>
                    ) : null}
                    {item.quarter ? (
                      <div className="text-xs text-muted-foreground">
                        TW {item.quarter}
                      </div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'realisasi',
                header: 'Realisasi',
                render: (item) => (
                  <div className="text-sm">
                    <div className="font-semibold text-foreground">
                      {item.realizationQuantity} / {item.target.targetQuantity}{' '}
                      {item.target.targetUnit === 'LAPORAN' ? 'Lap.' : 'Dok.'}
                    </div>
                    {item.qualityPercent != null ? (
                      <div className="text-xs text-muted-foreground">
                        Kualitas: {item.qualityPercent}%
                      </div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'bukti',
                header: 'Bukti',
                render: (item) => (
                  <span className="text-sm text-foreground">{item.evidence.length} file</span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <StatusBadge
                    value={kinerjaRealizationStatusLabel(item.status)}
                    tone={kinerjaRealizationStatusTone(item.status)}
                  />
                ),
              },
              {
                key: 'waktu',
                header: 'Disubmit',
                render: (item) =>
                  item.submittedAt ? (
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.submittedAt)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  ),
              },
              ...(canReview
                ? [
                    {
                      key: 'actions',
                      header: '',
                      render: (item: KinerjaBidangRealization) => {
                        const busy = actionLoading === item.id;
                        if (item.status === 'SUBMITTED') {
                          return (
                            <div className="flex gap-1.5">
                              <ActionButton
                                icon={busy ? Loader2 : Activity}
                                variant="secondary"
                                disabled={busy}
                                onClick={() => void handleAction(item.id, 'review')}
                              >
                                Review
                              </ActionButton>
                              <ActionButton
                                icon={busy ? Loader2 : CheckCircle}
                                variant="primary"
                                disabled={busy}
                                onClick={() => void handleAction(item.id, 'approve')}
                              >
                                Setujui
                              </ActionButton>
                            </div>
                          );
                        }
                        if (item.status === 'REVIEWED') {
                          return (
                            <div className="flex gap-1.5">
                              <ActionButton
                                icon={busy ? Loader2 : CheckCircle}
                                variant="primary"
                                disabled={busy}
                                onClick={() => void handleAction(item.id, 'approve')}
                              >
                                Setujui
                              </ActionButton>
                              <ActionButton
                                icon={busy ? Loader2 : XCircle}
                                variant="danger"
                                disabled={busy}
                                onClick={() => void handleAction(item.id, 'revision')}
                              >
                                Revisi
                              </ActionButton>
                            </div>
                          );
                        }
                        return (
                          <span className="text-xs text-muted-foreground">
                            <FileEdit className="inline size-3 mr-1" />
                            {kinerjaRealizationStatusLabel(item.status)}
                          </span>
                        );
                      },
                    },
                  ]
                : []),
            ]}
          />
        )}
        <p className="mt-2 text-xs text-muted-foreground">Total: {items.length} realisasi</p>
      </SectionCard>
    </div>
  );
}
