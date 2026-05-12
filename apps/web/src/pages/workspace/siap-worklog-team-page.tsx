import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  Edit3,
  Paperclip,
  RefreshCcw,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import type {
  PaginatedResult,
  ReviewSiapWorklogPayload,
  SiapWorklog,
  SiapWorklogAttachment,
  SiapWorklogStatus,
} from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  Field,
  FilterBar,
  formatDate,
  formatDateTime,
  formatFileSize,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
  Toolbar,
} from '@/components/workspace/ui';

const worklogStatuses: SiapWorklogStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'REVISION_REQUIRED',
  'APPROVED',
  'REJECTED',
];

type ReviewMode = 'APPROVE' | 'REVISION';

export function SiapWorklogTeamPage() {
  const [data, setData] = useState<PaginatedResult<SiapWorklog> | null>(null);
  const [status, setStatus] = useState('SUBMITTED');
  const [q, setQ] = useState('');
  const [reviewTarget, setReviewTarget] = useState<SiapWorklog | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>('APPROVE');
  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState('');
  const [error, setError] = useState('');
  const [attachmentTarget, setAttachmentTarget] =
    useState<SiapWorklog | null>(null);
  const [attachments, setAttachments] = useState<SiapWorklogAttachment[]>([]);

  async function load() {
    setLoading(true);
    setError('');

    try {
      const result = await apiClient.get<PaginatedResult<SiapWorklog>>(
        '/siap/worklogs/team',
        {
          q,
          status,
          page: 1,
          limit: 25,
        },
      );

      setData(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat review buku kerja',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const summary = useMemo(() => {
    const items = data?.items ?? [];

    return {
      total: data?.total ?? 0,
      submitted: items.filter((item) => item.status === 'SUBMITTED').length,
      revision: items.filter((item) => item.status === 'REVISION_REQUIRED')
        .length,
      approved: items.filter((item) => item.status === 'APPROVED').length,
    };
  }, [data]);

  function openReview(item: SiapWorklog, mode: ReviewMode) {
    setReviewTarget(item);
    setReviewMode(mode);
    setReviewNote('');
  }

  function closeReview() {
    setReviewTarget(null);
    setReviewNote('');
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reviewTarget) {
      return;
    }

    if (reviewMode === 'REVISION' && !reviewNote.trim()) {
      setError('Catatan revisi wajib diisi');
      return;
    }

    setWorkingId(reviewTarget.id);
    setError('');

    try {
      const payload: ReviewSiapWorklogPayload = {
        note: reviewNote.trim() || undefined,
      };

      await apiClient.post<SiapWorklog>(
        `/siap/worklogs/${reviewTarget.id}/${
          reviewMode === 'APPROVE' ? 'approve' : 'revision'
        }`,
        payload,
      );

      closeReview();
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memproses review',
      );
    } finally {
      setWorkingId('');
    }
  }

  async function openAttachments(item: SiapWorklog) {
    setAttachmentTarget(item);
    await loadAttachments(item.id);
  }

  async function loadAttachments(worklogId: string) {
    setError('');

    try {
      const result = await apiClient.get<SiapWorklogAttachment[]>(
        `/siap/worklogs/${worklogId}/attachments`,
      );

      setAttachments(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat bukti dukung',
      );
    }
  }

  async function downloadAttachment(item: SiapWorklogAttachment) {
    await apiClient.download(
      `/siarsip/documents/${item.documentId}/download`,
      item.document.originalFileName ?? item.document.fileName,
    );
  }

  const rows = data?.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Review Buku Kerja Staf"
        description="Kabid/Admin memeriksa, menyetujui, atau mengembalikan buku kerja staf untuk revisi."
        meta={<StatusBadge value={`${summary.total} WORKLOG`} tone="info" />}
        actions={
          <ActionButton icon={RefreshCcw} onClick={() => void load()} variant="secondary">
            Refresh
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <section className="grid gap-3 md:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Terlihat"
          value={summary.total}
          tone="neutral"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Menunggu Review"
          value={summary.submitted}
          tone="info"
        />
        <StatCard
          icon={RotateCcw}
          label="Revisi"
          value={summary.revision}
          tone="danger"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={summary.approved}
          tone="success"
        />
      </section>

      <Toolbar>
        <FilterBar>
          <input
            className={inputClass}
            placeholder="Cari staf/kegiatan/output"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void load();
              }
            }}
          />

          <select
            className={inputClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Semua status</option>
            {worklogStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <ActionButton icon={Search} onClick={() => void load()} variant="secondary">
            Cari
          </ActionButton>
        </FilterBar>
      </Toolbar>

      {attachmentTarget ? (
        <SectionCard
          title="Bukti Dukung Buku Kerja"
          description={`${attachmentTarget.user.name} · ${attachmentTarget.title}`}
          actions={
            <ActionButton
              icon={X}
              onClick={() => {
                setAttachmentTarget(null);
                setAttachments([]);
              }}
              variant="secondary"
            >
              Tutup
            </ActionButton>
          }
        >
          <DataTable
            items={attachments}
            rowKey={(item) => item.id}
            empty="Belum ada bukti dukung"
            columns={[
              {
                key: 'name',
                header: 'Bukti',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-zinc-950">
                      {item.label ??
                        item.document.originalFileName ??
                        item.document.fileName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.document.mimeType ?? '-'} ·{' '}
                      {formatFileSize(item.document.fileSize)}
                    </div>
                    {item.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'date',
                header: 'Tanggal',
                render: (item) => formatDateTime(item.createdAt),
              },
              {
                key: 'actions',
                header: 'Aksi',
                render: (item) => (
                  <ActionButton
                    icon={Download}
                    onClick={() => void downloadAttachment(item)}
                    variant="secondary"
                  >
                    Download
                  </ActionButton>
                ),
              },
            ]}
          />
        </SectionCard>
      ) : null}

      {reviewTarget ? (
        <SectionCard
          title={
            reviewMode === 'APPROVE'
              ? 'Setujui Buku Kerja'
              : 'Kembalikan untuk Revisi'
          }
          description={reviewTarget.title}
          actions={
            <ActionButton onClick={closeReview} variant="secondary">
              Tutup
            </ActionButton>
          }
        >
          <form className="grid gap-4" onSubmit={submitReview}>
            <div className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <div>
                <span className="font-semibold">Staf:</span>{' '}
                {reviewTarget.user.name}
              </div>
              <div>
                <span className="font-semibold">Tanggal:</span>{' '}
                {formatDate(reviewTarget.workDate)}
              </div>
              <div>
                <span className="font-semibold">Output:</span>{' '}
                {reviewTarget.output ?? '-'}
              </div>
              <div>
                <span className="font-semibold">Kendala:</span>{' '}
                {reviewTarget.obstacle ?? '-'}
              </div>
            </div>

            <Field
              label={
                reviewMode === 'APPROVE'
                  ? 'Catatan Review Opsional'
                  : 'Catatan Revisi'
              }
            >
              <textarea
                className={textareaClass}
                required={reviewMode === 'REVISION'}
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                placeholder={
                  reviewMode === 'APPROVE'
                    ? 'Contoh: Buku kerja sudah sesuai.'
                    : 'Jelaskan bagian yang harus diperbaiki.'
                }
              />
            </Field>

            <div className="flex justify-end gap-2">
              <ActionButton onClick={closeReview} variant="secondary">
                Batal
              </ActionButton>
              <ActionButton
                disabled={workingId === reviewTarget.id}
                icon={reviewMode === 'APPROVE' ? CheckCircle2 : RotateCcw}
                type="submit"
                variant={reviewMode === 'APPROVE' ? 'primary' : 'danger'}
              >
                {reviewMode === 'APPROVE' ? 'Approve' : 'Minta Revisi'}
              </ActionButton>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Antrian Review"
        description="Gunakan approve jika buku kerja sudah sesuai, atau revision jika perlu perbaikan."
      >
        {loading ? (
          <LoadingState label="Memuat antrian review" />
        ) : (
          <DataTable
            items={rows}
            rowKey={(item) => item.id}
            empty="Belum ada buku kerja staf"
            columns={[
              {
                key: 'staff',
                header: 'Staf',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-zinc-950">
                      {item.user.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.unitKerja?.nama ?? item.user.unitKerja?.nama ?? '-'}
                    </div>
                  </div>
                ),
              },
              {
                key: 'workDate',
                header: 'Tanggal',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-zinc-900">
                      {formatDate(item.workDate)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.category}
                    </div>
                  </div>
                ),
              },
              {
                key: 'activity',
                header: 'Kegiatan',
                render: (item) => (
                  <div className="max-w-xl">
                    <div className="font-semibold text-zinc-950">
                      {item.title}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                    {item.output ? (
                      <p className="mt-1 text-xs font-medium text-zinc-700">
                        Output: {item.output}
                      </p>
                    ) : null}
                    {item.obstacle ? (
                      <p className="mt-1 text-xs text-amber-700">
                        Kendala: {item.obstacle}
                      </p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'volume',
                header: 'Volume',
                render: (item) => item.volume ?? '-',
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <StatusBadge
                    value={item.status}
                    tone={worklogStatusTone(item.status)}
                  />
                ),
              },
              {
                key: 'reviewed',
                header: 'Review',
                render: (item) => (
                  <div className="text-sm">
                    <div>{item.reviewer?.name ?? '-'}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(item.reviewedAt)}
                    </div>
                    {item.reviewNote ? (
                      <div className="mt-1 max-w-xs text-xs text-rose-700">
                        {item.reviewNote}
                      </div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Aksi',
                render: (item) => (
                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      icon={Paperclip}
                      onClick={() => void openAttachments(item)}
                      variant="secondary"
                    >
                      Bukti
                    </ActionButton>

                    {item.status === 'SUBMITTED' ? (
                      <>
                        <ActionButton
                          icon={CheckCircle2}
                          onClick={() => openReview(item, 'APPROVE')}
                        >
                          Approve
                        </ActionButton>
                        <ActionButton
                          icon={Edit3}
                          onClick={() => openReview(item, 'REVISION')}
                          variant="danger"
                        >
                          Revisi
                        </ActionButton>
                      </>
                    ) : (
                      <StatusBadge value="NO ACTION" tone="neutral" />
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
}

function worklogStatusTone(status: SiapWorklogStatus) {
  if (status === 'APPROVED') {
    return 'success' as const;
  }

  if (status === 'SUBMITTED') {
    return 'info' as const;
  }

  if (status === 'REVISION_REQUIRED' || status === 'REJECTED') {
    return 'danger' as const;
  }

  return 'warning' as const;
}

const textareaClass = `${inputClass} min-h-28 py-2`;
