import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { apiClient, ApiError } from '@/lib/api/client';
import { dmsApi, type DmsDocument } from '@/lib/api/dms';
import type {
  PaginatedResult,
  SiapWorklog,
  SiapWorklogAttachment,
} from '@/lib/api/types';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { SiapWorklogAttachmentPanel } from '@/components/workspace/siap-worklog/siap-worklog-attachment-panel';
import { SiapWorklogFilterBar } from '@/components/workspace/siap-worklog/siap-worklog-filter-bar';
import {
  initialWorklogForm,
  SiapWorklogForm,
  toWorklogFormValue,
  toWorklogPayload,
  type WorklogFormState,
} from '@/components/workspace/siap-worklog/siap-worklog-form';
import {
  SiapWorklogStats,
  type SiapWorklogSummary,
} from '@/components/workspace/siap-worklog/siap-worklog-stats';
import { SiapWorklogTable } from '@/components/workspace/siap-worklog/siap-worklog-table';

export function SiapWorklogsPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<PaginatedResult<SiapWorklog> | null>(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [form, setForm] = useState<WorklogFormState>(initialWorklogForm);
  const [editing, setEditing] = useState<SiapWorklog | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState('');
  const [error, setError] = useState('');

  const [attachmentTarget, setAttachmentTarget] =
    useState<SiapWorklog | null>(null);
  const [attachments, setAttachments] = useState<SiapWorklogAttachment[]>([]);
  const [dmsDocuments, setDmsDocuments] = useState<DmsDocument[]>([]);
  const [loadingDmsDocuments, setLoadingDmsDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachmentLabel, setAttachmentLabel] = useState('');
  const [attachmentDescription, setAttachmentDescription] = useState('');

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

  const rows = data?.items ?? [];

  const summary = useMemo<SiapWorklogSummary>(() => {
    return {
      total: data?.total ?? 0,
      draft: rows.filter((item) => item.status === 'DRAFT').length,
      submitted: rows.filter((item) => item.status === 'SUBMITTED').length,
      revision: rows.filter((item) => item.status === 'REVISION_REQUIRED').length,
      approved: rows.filter((item) => item.status === 'APPROVED').length,
    };
  }, [data?.total, rows]);

  function openCreateForm() {
    setEditing(null);
    setForm(initialWorklogForm);
    setShowForm(true);
  }

  function openEditForm(item: SiapWorklog) {
    setEditing(item);
    setForm(toWorklogFormValue(item));
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(initialWorklogForm);
  }

  function closeAttachmentPanel() {
    setAttachmentTarget(null);
    setAttachments([]);
    setDmsDocuments([]);
    setAttachmentLabel('');
    setAttachmentDescription('');
  }

  async function saveWorklog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = toWorklogPayload(form);

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
          : 'Gagal mengirim buku kerja',
      );
    } finally {
      setWorkingId('');
    }
  }

  async function openAttachments(item: SiapWorklog) {
    setAttachmentTarget(item);
    setAttachmentLabel('');
    setAttachmentDescription('');
    setAttachments([]);
    setDmsDocuments([]);

    await Promise.all([
      loadAttachments(item.id),
      loadDmsDocuments(item.id),
    ]);
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

  async function loadDmsDocuments(worklogId: string) {
    setLoadingDmsDocuments(true);
    setError('');

    try {
      const result = await dmsApi.listDocuments({
        worklogId,
        page: 1,
        limit: 25,
      });

      setDmsDocuments(result.items);
    } catch (caught) {
      setDmsDocuments([]);
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat dokumen DMS terkait buku kerja',
      );
    } finally {
      setLoadingDmsDocuments(false);
    }
  }

  async function uploadAttachment(file: File) {
    if (!attachmentTarget) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('label', attachmentLabel || file.name);
      formData.append('description', attachmentDescription);

      await apiClient.upload<SiapWorklogAttachment>(
        `/siap/worklogs/${attachmentTarget.id}/attachments`,
        formData,
      );

      setAttachmentLabel('');
      setAttachmentDescription('');
      await loadAttachments(attachmentTarget.id);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal upload bukti dukung',
      );
    } finally {
      setUploading(false);
    }
  }

  async function deleteAttachment(attachmentId: string) {
    if (!attachmentTarget) {
      return;
    }

    setError('');

    try {
      await apiClient.delete(
        `/siap/worklogs/${attachmentTarget.id}/attachments/${attachmentId}`,
      );

      await loadAttachments(attachmentTarget.id);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal menghapus bukti dukung',
      );
    }
  }

  async function downloadAttachment(item: SiapWorklogAttachment) {
    await apiClient.download(
      `/siarsip/documents/${item.documentId}/download`,
      item.document.originalFileName ?? item.document.fileName,
    );
  }

  function openDmsUpload() {
    if (!attachmentTarget) {
      navigate('/dms/upload');
      return;
    }

    const params = new URLSearchParams();
    params.set('worklogId', attachmentTarget.id);

    if (attachmentTarget.caseId) {
      params.set('caseId', attachmentTarget.caseId);
    }

    navigate(`/dms/upload?${params.toString()}`);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Buku Kerja Saya"
        description="Catat aktivitas harian, hasil pekerjaan, volume, kendala, lalu kirim untuk ditinjau Kabid."
        meta={<StatusBadge value={`${summary.total} buku kerja`} tone="info" />}
        actions={
          <>
            <ActionButton icon={Plus} onClick={openCreateForm}>
              Tambah Buku Kerja
            </ActionButton>
            <ActionButton
              icon={RefreshCcw}
              onClick={() => void load()}
              variant="secondary"
            >
              Refresh
            </ActionButton>
          </>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <SiapWorklogStats summary={summary} />

      {showForm ? (
        <SiapWorklogForm
          editing={editing}
          form={form}
          saving={saving}
          onChange={setForm}
          onClose={closeForm}
          onSubmit={saveWorklog}
        />
      ) : null}

      <SiapWorklogFilterBar
        q={q}
        status={status}
        onApply={() => void load()}
        onQChange={setQ}
        onStatusChange={setStatus}
      />

      {attachmentTarget ? (
        <SiapWorklogAttachmentPanel
          attachments={attachments}
          description={attachmentDescription}
          dmsDocuments={dmsDocuments}
          label={attachmentLabel}
          loadingDmsDocuments={loadingDmsDocuments}
          target={attachmentTarget}
          uploading={uploading}
          onClose={closeAttachmentPanel}
          onDelete={(attachmentId) => void deleteAttachment(attachmentId)}
          onDescriptionChange={setAttachmentDescription}
          onDownload={(item) => void downloadAttachment(item)}
          onLabelChange={setAttachmentLabel}
          onOpenDmsDocument={(id) => navigate(`/dms/documents/${id}`)}
          onOpenDmsUpload={openDmsUpload}
          onRefreshDms={() => void loadDmsDocuments(attachmentTarget.id)}
          onUpload={(file) => void uploadAttachment(file)}
        />
      ) : null}

      <SectionCard
        title="Daftar Buku Kerja"
        description="Kirim buku kerja setelah kegiatan dan hasil pekerjaan sudah benar."
      >
        {loading ? (
          <LoadingState label="Memuat buku kerja" />
        ) : (
          <SiapWorklogTable
            rows={rows}
            workingId={workingId}
            onEdit={openEditForm}
            onOpenAttachments={(item) => void openAttachments(item)}
            onSubmit={(id) => void submitWorklog(id)}
          />
        )}
      </SectionCard>
    </div>
  );
}
