import { useEffect, useState } from 'react';
import { BookOpenCheck, FolderArchive, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api/client';
import type {
  PaginatedResult,
  SiapTask,
  SiapWorklog,
} from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  formatDate,
  LoadingState,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  taskTypeLabel,
  worklogCategoryLabel,
  worklogStatusLabel,
  worklogStatusTone,
} from '@/lib/siap/siap-labels';

export function SiapCaseWorklogsPanel({
  caseId,
  caseNumber,
  tasks,
}: {
  caseId: string;
  caseNumber: string;
  tasks: SiapTask[];
}) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SiapWorklog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const result = await loadRelatedWorklogs(caseId);
      setRows(result.items);
      setTotal(result.total);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat buku kerja terkait',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  function openDmsUpload(item: SiapWorklog) {
    const params = new URLSearchParams();
    params.set('caseId', caseId);
    params.set('worklogId', item.id);
    navigate(`/dms/upload?${params.toString()}`);
  }

  const taskById = new Map(tasks.map((task) => [task.id, task]));

  return (
    <SectionCard
      title="Buku Kerja Terkait"
      description={`Aktivitas staf yang terhubung dengan kasus ${caseNumber}.`}
      actions={
        <div className="flex flex-wrap gap-2">
          <ActionButton
            icon={BookOpenCheck}
            onClick={() => navigate(`/siap/worklogs?caseId=${caseId}`)}
            variant="secondary"
          >
            Kelola Buku Kerja
          </ActionButton>
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void load()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        </div>
      }
    >
      {error ? <ErrorAlert message={error} /> : null}

      {loading ? (
        <LoadingState label="Memuat buku kerja terkait" />
      ) : (
        <DataTable
          items={rows}
          rowKey={(item) => item.id}
          empty="Belum ada buku kerja yang terhubung dengan kasus ini"
          columns={[
            {
              key: 'workDate',
              header: 'Tanggal / Kategori',
              render: (item) => (
                <div>
                  <div className="font-semibold text-zinc-900">
                    {formatDate(item.workDate)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {worklogCategoryLabel(item.category)}
                  </div>
                </div>
              ),
            },
            {
              key: 'activity',
              header: 'Kegiatan',
              render: (item) => (
                <div className="max-w-xl">
                  <div className="font-semibold text-zinc-950">{item.title}</div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.task
                      ? taskTypeLabel(item.task.taskType)
                      : item.taskId
                        ? taskTypeLabel(taskById.get(item.taskId)?.taskType)
                        : 'Tanpa tugas khusus'}
                  </div>
                </div>
              ),
            },
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
              key: 'status',
              header: 'Status',
              render: (item) => (
                <StatusBadge
                  value={worklogStatusLabel(item.status)}
                  tone={worklogStatusTone(item.status)}
                />
              ),
            },
            {
              key: 'output',
              header: 'Hasil',
              render: (item) => (
                <div className="max-w-xs text-sm">
                  <div>{item.output ?? '-'}</div>
                  {item.obstacle ? (
                    <div className="mt-1 text-xs text-amber-700">
                      Kendala: {item.obstacle}
                    </div>
                  ) : null}
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Aksi',
              render: (item) => (
                <ActionButton
                  icon={FolderArchive}
                  onClick={() => openDmsUpload(item)}
                  variant="secondary"
                >
                  Upload Bukti
                </ActionButton>
              ),
            },
          ]}
        />
      )}

      {!loading && total > rows.length ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Menampilkan {rows.length} dari {total} buku kerja. Gunakan menu Buku Kerja untuk melihat semua data.
        </p>
      ) : null}
    </SectionCard>
  );
}

async function loadRelatedWorklogs(caseId: string) {
  try {
    return await apiClient.get<PaginatedResult<SiapWorklog>>(
      '/siap/worklogs/team',
      {
        caseId,
        page: 1,
        limit: 25,
      },
    );
  } catch (caught) {
    if (caught instanceof ApiError && [401, 403].includes(caught.status)) {
      return apiClient.get<PaginatedResult<SiapWorklog>>('/siap/worklogs/my', {
        caseId,
        page: 1,
        limit: 25,
      });
    }

    throw caught;
  }
}
