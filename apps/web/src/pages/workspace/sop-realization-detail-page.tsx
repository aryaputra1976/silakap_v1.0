import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { SopRealizationStatusActions } from '@/components/workspace/sop/sop-realization-status-actions';
import { SopRealizationValidationPanel } from '@/components/workspace/sop/sop-realization-validation-panel';
import { ApiError } from '@/lib/api/client';
import {
  kinerjaBidangApi,
  kinerjaRealizationStatusLabel,
  kinerjaRealizationStatusTone,
  kinerjaTargetUnitLabel,
  type KinerjaBidangEvidence,
  type KinerjaBidangRealization,
} from '@/lib/api/kinerja-bidang';
import {
  getCurrentKinerjaRole,
  getRealizationPermissions,
} from '@/lib/sop/sop-realization-permissions';

function periodLabel(item: KinerjaBidangRealization) {
  if (item.month) {
    return `Bulan ${item.month}`;
  }

  if (item.quarter) {
    return `Triwulan ${item.quarter}`;
  }

  return `Tahun ${item.year}`;
}

export function SopRealizationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [realization, setRealization] = useState<KinerjaBidangRealization | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const role = getCurrentKinerjaRole();

  const permissions = useMemo(
    () => (realization ? getRealizationPermissions(realization, role) : null),
    [realization, role],
  );

  async function loadDetail() {
    if (!id) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await kinerjaBidangApi.getRealization(id);
      setRealization(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat detail realisasi',
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeEvidence(evidenceId: string) {
    if (!realization) {
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const result = await kinerjaBidangApi.removeEvidence(
        realization.id,
        evidenceId,
      );
      setRealization(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal melepas bukti dukung',
      );
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <LoadingState label="Memuat detail realisasi SOP/RHK" />;
  }

  if (!realization) {
    return (
      <ErrorAlert message={error || 'Realisasi SOP/RHK tidak ditemukan'} />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={realization.title}
        description="Detail realisasi resmi SOP/RHK, status review, dan bukti dukung DMS."
        meta={
          <>
            <StatusBadge value={realization.rhkCode} tone="info" />
            <StatusBadge value={realization.sop.code} tone="dark" />
            <StatusBadge
              value={kinerjaRealizationStatusLabel(realization.status)}
              tone={kinerjaRealizationStatusTone(realization.status)}
            />
            <StatusBadge value={`Role: ${role}`} tone="dark" />
          </>
        }
        actions={
          <>
            <ActionButton
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => navigate('/kinerja-bidang/realisasi')}
            >
              Kembali
            </ActionButton>
            <ActionButton
              variant="secondary"
              icon={RefreshCw}
              disabled={loading || actionLoading}
              onClick={() => void loadDetail()}
            >
              Refresh
            </ActionButton>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <SopRealizationValidationPanel realization={realization} role={role} />

      <SectionCard
        title="Aksi Status"
        description="Alur status: Draft/Revisi → Submit → Review → Approve."
      >
        <SopRealizationStatusActions
          realization={realization}
          role={role}
          loading={actionLoading}
          onLoading={setActionLoading}
          onUpdated={setRealization}
          onError={setError}
        />
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Periode" value={periodLabel(realization)} />
        <StatCard
          label="Kuantitas"
          value={`${realization.realizationQuantity} ${kinerjaTargetUnitLabel(realization.target.targetUnit)}`}
        />
        <StatCard
          label="Kualitas"
          value={
            realization.qualityPercent === null
              ? '-'
              : `${realization.qualityPercent}%`
          }
        />
        <StatCard label="Bukti Dukung" value={realization.evidence.length} />
      </div>

      <SectionCard title="Uraian Realisasi">
        <div className="grid gap-4 text-sm leading-6 text-[#51614c] xl:grid-cols-2">
          <div className="rounded-lg border border-[#d8e5d3] bg-white p-4">
            <div className="mb-1 font-semibold text-[#173c36]">SOP/RHK</div>
            <p>{realization.sop.title}</p>
            <p className="mt-1 text-xs text-[#6d7e68]">{realization.sop.code}</p>
          </div>

          <div className="rounded-lg border border-[#d8e5d3] bg-white p-4">
            <div className="mb-1 font-semibold text-[#173c36]">Status Waktu</div>
            <p>{realization.timeStatus ?? '-'}</p>
          </div>

          <div className="rounded-lg border border-[#d8e5d3] bg-white p-4">
            <div className="mb-1 font-semibold text-[#173c36]">Deskripsi</div>
            <p>{realization.description ?? '-'}</p>
          </div>

          <div className="rounded-lg border border-[#d8e5d3] bg-white p-4">
            <div className="mb-1 font-semibold text-[#173c36]">Kendala</div>
            <p>{realization.constraint ?? '-'}</p>
          </div>

          <div className="rounded-lg border border-[#d8e5d3] bg-white p-4">
            <div className="mb-1 font-semibold text-[#173c36]">Tindak Lanjut</div>
            <p>{realization.followUp ?? '-'}</p>
          </div>

          <div className="rounded-lg border border-[#d8e5d3] bg-white p-4">
            <div className="mb-1 font-semibold text-[#173c36]">Catatan Review</div>
            <p>{realization.reviewNote ?? '-'}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Bukti Dukung DMS"
        description="Dokumen DMS yang ditautkan ke realisasi ini."
      >
        <DataTable<KinerjaBidangEvidence>
          items={realization.evidence}
          empty="Belum ada bukti dukung tertaut"
          rowKey={(item) => item.id}
          columns={[
            {
              key: 'document',
              header: 'Dokumen',
              render: (item) => (
                <div>
                  <div className="font-semibold text-[#173c36]">
                    {item.dmsDocument.title}
                  </div>
                  <div className="mt-1 text-xs text-[#6d7e68]">
                    {item.dmsDocument.originalFileName ??
                      item.dmsDocument.fileName ??
                      '-'}
                  </div>
                </div>
              ),
            },
            {
              key: 'label',
              header: 'Label',
              render: (item) => item.label ?? '-',
            },
            {
              key: 'primary',
              header: 'Utama',
              render: (item) => (
                <StatusBadge
                  value={item.isPrimary ? 'Utama' : 'Pendukung'}
                  tone={item.isPrimary ? 'success' : 'neutral'}
                />
              ),
            },
            {
              key: 'action',
              header: 'Aksi',
              className: 'text-right',
              render: (item) => (
                <div className="flex justify-end gap-2">
                  <ActionButton
                    variant="secondary"
                    icon={FileText}
                    onClick={() => navigate(`/dms/documents/${item.dmsDocumentId}`)}
                  >
                    DMS
                  </ActionButton>
                  {permissions?.canChangeEvidence ? (
                    <ActionButton
                      variant="danger"
                      disabled={actionLoading}
                      onClick={() => void removeEvidence(item.id)}
                    >
                      Lepas
                    </ActionButton>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}
