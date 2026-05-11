import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  FileText,
  Plus,
  RefreshCcw,
  Save,
  Send,
  X,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import type {
  CreateSiapWorklogPayload,
  PaginatedResult,
  SiapWorklog,
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

const defaultCategories = [
  'VERIFIKASI_BERKAS',
  'VALIDASI_DATA',
  'ARSIP_DIGITAL',
  'LAYANAN_ASN',
  'RAPAT_KOORDINASI',
  'LAPORAN',
  'LAINNYA',
];

type WorklogFormState = {
  workDate: string;
  category: string;
  title: string;
  description: string;
  output: string;
  volume: string;
  obstacle: string;
  caseId: string;
  taskId: string;
};

const initialForm: WorklogFormState = {
  workDate: toInputDate(new Date()),
  category: 'VERIFIKASI_BERKAS',
  title: '',
  description: '',
  output: '',
  volume: '',
  obstacle: '',
  caseId: '',
  taskId: '',
};

export function SiapWorklogsPage() {
  const [data, setData] = useState<PaginatedResult<SiapWorklog> | null>(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [form, setForm] = useState<WorklogFormState>(initialForm);
  const [editing, setEditing] = useState<SiapWorklog | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const result = await apiClient.get<PaginatedResult<SiapWorklog>>(
        '/siap/worklogs/my',
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
          : 'Gagal memuat buku kerja',
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
      draft: items.filter((item) => item.status === 'DRAFT').length,
      submitted: items.filter((item) => item.status === 'SUBMITTED').length,
      revision: items.filter((item) => item.status === 'REVISION_REQUIRED')
        .length,
      approved: items.filter((item) => item.status === 'APPROVED').length,
    };
  }, [data]);

  function openCreateForm() {
    setEditing(null);
    setForm(initialForm);
    setShowForm(true);
  }

  function openEditForm(item: SiapWorklog) {
    setEditing(item);
    setForm({
      workDate: toInputDate(item.workDate),
      category: item.category,
      title: item.title,
      description: item.description,
      output: item.output ?? '',
      volume: item.volume === null ? '' : String(item.volume),
      obstacle: item.obstacle ?? '',
      caseId: item.caseId ?? '',
      taskId: item.taskId ?? '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(initialForm);
  }

  function updateForm(field: keyof WorklogFormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveWorklog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = toPayload(form);

      if (editing) {
        await apiClient.patch<SiapWorklog>(
          `/siap/worklogs/${editing.id}`,
          payload,
        );
      } else {
        await apiClient.post<SiapWorklog>('/siap/worklogs', payload);
      }

      closeForm();
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal menyimpan buku kerja',
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitWorklog(id: string) {
    setWorkingId(id);
    setError('');

    try {
      await apiClient.post<SiapWorklog>(`/siap/worklogs/${id}/submit`);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal submit buku kerja',
      );
    } finally {
      setWorkingId('');
    }
  }

  const rows = data?.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Buku Kerja Saya"
        description="Catat aktivitas harian, output pekerjaan, volume, kendala, dan submit untuk direview Kabid."
        meta={<StatusBadge value={`${summary.total} WORKLOG`} tone="info" />}
        actions={
          <>
            <ActionButton icon={Plus} onClick={openCreateForm}>
              Tambah Buku Kerja
            </ActionButton>
            <ActionButton icon={RefreshCcw} onClick={() => void load()} variant="secondary">
              Refresh
            </ActionButton>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <section className="grid gap-3 md:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Draft"
          value={summary.draft}
          tone="warning"
        />
        <StatCard
          icon={Send}
          label="Submitted"
          value={summary.submitted}
          tone="info"
        />
        <StatCard
          icon={Edit3}
          label="Perlu Revisi"
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

      {showForm ? (
        <SectionCard
          title={editing ? 'Edit Buku Kerja' : 'Tambah Buku Kerja'}
          description="Isi data pekerjaan harian. Buku kerja masih dapat diedit selama DRAFT atau REVISION_REQUIRED."
          actions={
            <ActionButton icon={X} onClick={closeForm} variant="secondary">
              Tutup
            </ActionButton>
          }
        >
          <form className="grid gap-4" onSubmit={saveWorklog}>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Tanggal Kerja">
                <input
                  className={inputClass}
                  required
                  type="date"
                  value={form.workDate}
                  onChange={(event) => updateForm('workDate', event.target.value)}
                />
              </Field>

              <Field label="Kategori">
                <select
                  className={inputClass}
                  required
                  value={form.category}
                  onChange={(event) => updateForm('category', event.target.value)}
                >
                  {defaultCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Volume / Jumlah">
                <input
                  className={inputClass}
                  min={0}
                  type="number"
                  value={form.volume}
                  onChange={(event) => updateForm('volume', event.target.value)}
                  placeholder="Contoh: 12"
                />
              </Field>
            </div>

            <Field label="Judul Kegiatan">
              <input
                className={inputClass}
                required
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                placeholder="Contoh: Verifikasi berkas pensiun BUP"
              />
            </Field>

            <Field label="Uraian Pekerjaan">
              <textarea
                className={textareaClass}
                required
                value={form.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
                placeholder="Jelaskan pekerjaan yang dilakukan hari ini."
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Output / Hasil">
                <textarea
                  className={textareaClass}
                  value={form.output}
                  onChange={(event) => updateForm('output', event.target.value)}
                  placeholder="Contoh: 12 berkas diperiksa."
                />
              </Field>

              <Field label="Kendala">
                <textarea
                  className={textareaClass}
                  value={form.obstacle}
                  onChange={(event) =>
                    updateForm('obstacle', event.target.value)
                  }
                  placeholder="Isi jika ada kendala."
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Case ID Opsional">
                <input
                  className={inputClass}
                  value={form.caseId}
                  onChange={(event) => updateForm('caseId', event.target.value)}
                  placeholder="Isi jika terkait case SIAP"
                />
              </Field>

              <Field label="Task ID Opsional">
                <input
                  className={inputClass}
                  value={form.taskId}
                  onChange={(event) => updateForm('taskId', event.target.value)}
                  placeholder="Isi jika terkait task SIAP"
                />
              </Field>
            </div>

            <div className="flex justify-end">
              <ActionButton disabled={saving} icon={Save} type="submit">
                {saving ? 'Menyimpan...' : 'Simpan Buku Kerja'}
              </ActionButton>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <Toolbar>
        <FilterBar>
          <input
            className={inputClass}
            placeholder="Cari judul/output/kendala"
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

          <ActionButton icon={RefreshCcw} onClick={() => void load()} variant="secondary">
            Terapkan Filter
          </ActionButton>
        </FilterBar>
      </Toolbar>

      <SectionCard
        title="Daftar Buku Kerja"
        description="Submit buku kerja setelah data aktivitas dan output sudah benar."
      >
        {loading ? (
          <LoadingState label="Memuat buku kerja" />
        ) : (
          <DataTable
            items={rows}
            rowKey={(item) => item.id}
            empty="Belum ada buku kerja"
            columns={[
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
                key: 'title',
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
                key: 'review',
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
                    {canEdit(item) ? (
                      <ActionButton
                        icon={Edit3}
                        onClick={() => openEditForm(item)}
                        variant="secondary"
                      >
                        Edit
                      </ActionButton>
                    ) : null}

                    {canSubmit(item) ? (
                      <ActionButton
                        disabled={workingId === item.id}
                        icon={Send}
                        onClick={() => void submitWorklog(item.id)}
                      >
                        Submit
                      </ActionButton>
                    ) : null}

                    {!canEdit(item) && !canSubmit(item) ? (
                      <StatusBadge value="LOCKED" tone="neutral" />
                    ) : null}
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

function canEdit(item: SiapWorklog) {
  return item.status === 'DRAFT' || item.status === 'REVISION_REQUIRED';
}

function canSubmit(item: SiapWorklog) {
  return item.status === 'DRAFT' || item.status === 'REVISION_REQUIRED';
}

function toPayload(form: WorklogFormState): CreateSiapWorklogPayload {
  return {
    workDate: form.workDate,
    category: form.category,
    title: form.title.trim(),
    description: form.description.trim(),
    output: normalizeOptional(form.output),
    volume: form.volume ? Number(form.volume) : undefined,
    obstacle: normalizeOptional(form.obstacle),
    caseId: normalizeOptional(form.caseId),
    taskId: normalizeOptional(form.taskId),
  };
}

function normalizeOptional(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function toInputDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
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
