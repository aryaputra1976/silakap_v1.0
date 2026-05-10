import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, Play, Send, UploadCloud } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import type { DocumentChecklist, DocumentRecord, SipensiunCaseDetail } from '@/lib/api/types';
import {
  ActionButton,
  ChecklistItem,
  DataTable,
  DownloadButton,
  EmptyState,
  ErrorAlert,
  FileMeta,
  FileUploadButton,
  formatDate,
  formatDateTime,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
  Timeline,
  WorkflowBadge,
} from '@/components/workspace/ui';

const categoryOrder = ['KEPEGAWAIAN', 'KELUARGA', 'PERNYATAAN', 'KEMATIAN', 'FOTO', 'FISIK', 'LAINNYA'];

export function SipensiunDetailPage() {
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<SipensiunCaseDetail | null>(null);
  const [checklist, setChecklist] = useState<DocumentChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [taskActionId, setTaskActionId] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.get<SipensiunCaseDetail>(`/sipensiun/cases/${id}`);
      setDetail(result);
      const checklistResult = await apiClient.get<DocumentChecklist>(`/siarsip/cases/${result.siapCase.id}/checklist`);
      setChecklist(checklistResult);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal memuat detail');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const uploadedByType = useMemo(() => {
    const map = new Map<string, DocumentRecord>();
    for (const document of checklist?.uploadedDocuments ?? []) {
      map.set(document.documentType, document);
    }
    return map;
  }, [checklist]);

  const groupedChecklist = useMemo(() => {
    const groups = new Map<string, DocumentChecklist['required']>();
    for (const item of checklist?.required ?? []) {
      const category = item.category || 'LAINNYA';
      groups.set(category, [...(groups.get(category) ?? []), item]);
    }

    return Array.from(groups.entries()).sort(([left], [right]) => {
      const leftIndex = categoryOrder.indexOf(left);
      const rightIndex = categoryOrder.indexOf(right);
      return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
    });
  }, [checklist]);

  async function submitCase() {
    if (!detail) {
      return;
    }
    setWorking(true);
    setError('');
    try {
      await apiClient.post<SipensiunCaseDetail>(`/sipensiun/cases/${detail.sipensiunDetail.id}/submit`);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal submit case');
    } finally {
      setWorking(false);
    }
  }

  async function uploadDocument(documentType: string, file: File) {
    if (!detail) {
      return;
    }
    setWorking(true);
    setError('');

    const formData = new FormData();
    formData.set('documentType', documentType);
    formData.set('file', file);

    try {
      await apiClient.upload(`/siarsip/cases/${detail.siapCase.id}/upload`, formData);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal upload dokumen');
    } finally {
      setWorking(false);
    }
  }

  async function downloadDocument(documentId: string, fileName: string) {
    setError('');
    try {
      const blob = await apiClient.download(`/siarsip/documents/${documentId}/download`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal download dokumen');
    }
  }

  async function mutateTask(taskId: string, action: 'start' | 'complete') {
    setTaskActionId(taskId);
    setError('');
    try {
      await apiClient.post(`/siap/tasks/${taskId}/${action}`, action === 'complete' ? { note: 'Selesai dari workspace SIPENSIUN' } : undefined);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Aksi task gagal');
    } finally {
      setTaskActionId('');
    }
  }

  if (loading) {
    return <LoadingState label="Memuat workspace SIPENSIUN" />;
  }

  if (!detail) {
    return <ErrorAlert message={error || 'Data tidak tersedia'} />;
  }

  const requiredItems = checklist?.required.filter((item) => item.required !== false) ?? [];
  const uploadedRequired = requiredItems.filter((item) => item.uploaded).length;
  const progress = requiredItems.length > 0 ? Math.round((uploadedRequired / requiredItems.length) * 100) : 0;
  const activeTasks = detail.tasks.filter((task) => task.status !== 'COMPLETED' && task.status !== 'CANCELLED');

  return (
    <div className="space-y-5">
      <PageHeader
        title={detail.siapCase.caseNumber}
        description={`${detail.asn.nama} / ${detail.asn.nip}`}
        meta={
          <>
            <StatusBadge value={detail.sipensiunDetail.jenisPensiun} tone="info" />
            <WorkflowBadge value={detail.siapCase.currentState} />
            <StatusBadge value={detail.siapCase.status} />
          </>
        }
        actions={
          <ActionButton
            disabled={working || detail.siapCase.currentState !== 'DRAFT'}
            icon={Send}
            onClick={submitCase}
          >
            Submit Case
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
        <SectionCard title="ASN Profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <FileMeta label="Nama" value={detail.asn.nama} />
            <FileMeta label="NIP" value={<span className="font-mono text-xs">{detail.asn.nip}</span>} />
            <FileMeta label="Unit Kerja" value={detail.asn.unitKerja?.nama ?? '-'} />
            <FileMeta label="Jabatan" value={detail.asn.jabatanNama ?? '-'} />
            <FileMeta label="Golongan" value={detail.asn.golonganNama ?? '-'} />
            <FileMeta label="Status ASN" value={<StatusBadge value={detail.asn.statusAsn} />} />
          </div>
        </SectionCard>

        <SectionCard title="SIPENSIUN Detail">
          <div className="grid gap-4 sm:grid-cols-2">
            <FileMeta label="Jenis Pensiun" value={<StatusBadge value={detail.sipensiunDetail.jenisPensiun} tone="info" />} />
            <FileMeta label="TMT Pensiun" value={formatDate(detail.sipensiunDetail.tmtPensiun)} />
            <FileMeta label="Catatan" value={detail.sipensiunDetail.catatan ?? '-'} />
            <FileMeta label="Dibuat" value={formatDateTime(detail.sipensiunDetail.createdAt)} />
          </div>
        </SectionCard>

        <SectionCard title="Recipient Rule">
          {detail.recipient ? (
            <div className="grid gap-4">
              <FileMeta label="Kategori" value={<StatusBadge value={detail.recipient.category} tone="info" />} />
              <FileMeta label="Tujuan" value={detail.recipient.recipientName} />
              <FileMeta label="Kota" value={detail.recipient.recipientCity} />
              <FileMeta
                label="Review"
                value={<StatusBadge value={detail.recipient.needsReview ? 'NEEDS REVIEW' : 'READY'} tone={detail.recipient.needsReview ? 'warning' : 'success'} />}
              />
            </div>
          ) : (
            <EmptyState title="Recipient rule belum tersedia" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Requirement Checklist"
        description={`${uploadedRequired}/${requiredItems.length} dokumen wajib sudah terunggah`}
        actions={<StatusBadge value={`${progress}% COMPLETE`} tone={progress === 100 ? 'success' : 'warning'} />}
      >
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="space-y-6">
          {groupedChecklist.length > 0 ? (
            groupedChecklist.map(([category, items]) => (
              <div key={category}>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-normal text-zinc-500">{category}</h3>
                  <StatusBadge value={`${items.filter((item) => item.uploaded).length}/${items.length}`} />
                </div>
                <div className="grid gap-3">
                  {items.map((item) => {
                    const uploadedDocument = uploadedByType.get(item.documentType);
                    return (
                      <ChecklistItem
                        key={item.documentType}
                        label={item.label}
                        documentType={item.documentType}
                        category={item.category}
                        required={item.required}
                        digital={item.digital}
                        uploaded={item.uploaded}
                        notes={item.notes}
                        actions={
                          <>
                            <FileUploadButton
                              disabled={working}
                              label="Upload"
                              onSelect={(file) => uploadDocument(item.documentType, file)}
                            />
                            {uploadedDocument ? (
                              <DownloadButton
                                disabled={working}
                                onClick={() => downloadDocument(uploadedDocument.id, uploadedDocument.originalFileName ?? uploadedDocument.fileName)}
                              />
                            ) : null}
                          </>
                        }
                      />
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="Checklist belum tersedia" />
          )}
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="SIAP Task"
          description={activeTasks.length > 0 ? `${activeTasks.length} task aktif` : 'Semua task selesai atau belum dibuat'}
        >
          {detail.tasks.length > 0 ? (
            <DataTable
              items={detail.tasks}
              rowKey={(task) => task.id}
              empty="Belum ada task"
              columns={[
                {
                  key: 'task',
                  header: 'Task',
                  render: (task) => (
                    <div>
                      <div className="font-semibold text-zinc-950">{task.title}</div>
                      <div className="text-xs text-muted-foreground">{task.taskType}</div>
                    </div>
                  ),
                },
                { key: 'status', header: 'Status', render: (task) => <WorkflowBadge value={task.status} /> },
                { key: 'due', header: 'Due', render: (task) => formatDate(task.dueDate) },
                {
                  key: 'action',
                  header: 'Action',
                  render: (task) => (
                    <div className="flex flex-wrap gap-2">
                      {task.status === 'ASSIGNED' ? (
                        <ActionButton disabled={taskActionId === task.id} icon={Play} onClick={() => mutateTask(task.id, 'start')} variant="secondary">
                          Start
                        </ActionButton>
                      ) : null}
                      {task.status === 'IN_PROGRESS' ? (
                        <ActionButton disabled={taskActionId === task.id} icon={CheckCircle2} onClick={() => mutateTask(task.id, 'complete')}>
                          Complete
                        </ActionButton>
                      ) : null}
                      {task.status !== 'ASSIGNED' && task.status !== 'IN_PROGRESS' ? <StatusBadge value="NO ACTION" /> : null}
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            <EmptyState title="Belum ada task" />
          )}
        </SectionCard>

        <SectionCard title="Timeline">
          <Timeline
            items={detail.timelines.map((timeline) => ({
              id: timeline.id,
              title: timeline.title,
              description: timeline.description,
              type: timeline.eventType,
              timestamp: timeline.createdAt,
              actor: timeline.performedBy,
            }))}
          />
        </SectionCard>
      </div>

      <SectionCard title="Workflow Log">
        <DataTable
          items={detail.workflowLogs}
          rowKey={(log) => log.id}
          empty="Belum ada workflow log"
          columns={[
            { key: 'action', header: 'Action', render: (log) => <span className="font-semibold text-zinc-950">{log.action}</span> },
            { key: 'from', header: 'From', render: (log) => <WorkflowBadge value={log.fromState ?? 'START'} /> },
            { key: 'to', header: 'To', render: (log) => <WorkflowBadge value={log.toState} /> },
            { key: 'note', header: 'Note', render: (log) => log.note ?? '-' },
            { key: 'by', header: 'Actor', render: (log) => log.performedBy ?? '-' },
            { key: 'at', header: 'Performed At', render: (log) => formatDateTime(log.performedAt) },
          ]}
        />
      </SectionCard>

      <SectionCard title="Dokumen Terunggah">
        {checklist && checklist.uploadedDocuments.length > 0 ? (
          <DataTable
            items={checklist.uploadedDocuments}
            rowKey={(document) => document.id}
            empty="Belum ada dokumen"
            columns={[
              {
                key: 'file',
                header: 'File',
                render: (document) => (
                  <div>
                    <div className="font-semibold text-zinc-950">{document.originalFileName ?? document.fileName}</div>
                    <div className="text-xs text-muted-foreground">{document.fileName}</div>
                  </div>
                ),
              },
              { key: 'type', header: 'Tipe', render: (document) => <StatusBadge value={document.documentType} /> },
              { key: 'uploaded', header: 'Uploaded', render: (document) => formatDateTime(document.uploadedAt) },
              {
                key: 'download',
                header: 'Action',
                render: (document) => (
                  <ActionButton
                    icon={Download}
                    onClick={() => downloadDocument(document.id, document.originalFileName ?? document.fileName)}
                    variant="secondary"
                  >
                    Download
                  </ActionButton>
                ),
              },
            ]}
          />
        ) : (
          <EmptyState title="Belum ada dokumen" description="Upload dokumen melalui checklist requirement." icon={UploadCloud} />
        )}
      </SectionCard>
    </div>
  );
}
