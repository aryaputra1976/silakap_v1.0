import { useCallback, useEffect, useState } from 'react';
import { FileCheck, Plus, RefreshCcw, Loader2, Pencil, Trash2, CheckCircle, XCircle, Send } from 'lucide-react';
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
  siformenApi,
  formasiStatusLabel,
  formasiStatusTone,
  jenisFormasiLabel,
  type SiformenFormasi,
  type SiformenFormasiJenis,
  type SiformenFormasiStatus,
} from '@/lib/api/siformen';
import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';

const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA'];
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM'];
const APPROVE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN'];

const CURRENT_YEAR = new Date().getFullYear();

type FormState = {
  namaJabatan: string;
  unitKerja: string;
  jenisFormasi: SiformenFormasiJenis;
  tahun: number;
  periode: string;
  jumlahKebutuhan: number;
  jumlahTersedia: number;
  jumlahUsulan: number;
  kualifikasiPendidikan: string;
  kualifikasiJurusan: string;
  alasanKebutuhan: string;
};

const emptyForm = (tahun = CURRENT_YEAR): FormState => ({
  namaJabatan: '',
  unitKerja: '',
  jenisFormasi: 'CPNS',
  tahun,
  periode: '',
  jumlahKebutuhan: 1,
  jumlahTersedia: 0,
  jumlahUsulan: 1,
  kualifikasiPendidikan: '',
  kualifikasiJurusan: '',
  alasanKebutuhan: '',
});

type ReviewAction = { id: string; type: 'approve' | 'reject' };

export function SiformenFormasiPage() {
  const { user } = useAuth();
  const role = getPrimaryRole(user?.roles);
  const canWrite = role ? WRITE_ROLES.includes(role) : false;
  const canAdmin = role ? ADMIN_ROLES.includes(role) : false;
  const canApprove = role ? APPROVE_ROLES.includes(role) : false;

  const [items, setItems] = useState<SiformenFormasi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [tahun, setTahun] = useState(String(CURRENT_YEAR));
  const [jenisFormasi, setJenisFormasi] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<SiformenFormasi | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    siformenApi
      .listFormasi({
        tahun: tahun || undefined,
        jenisFormasi: jenisFormasi || undefined,
        status: status || undefined,
        page,
        limit: 20,
      })
      .then((result) => {
        if (mounted) {
          setItems(result.items);
          setTotal(result.total);
        }
      })
      .catch((caught) => {
        if (mounted) setError(caught instanceof Error ? caught.message : 'Gagal memuat data formasi');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [tahun, jenisFormasi, status, page]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  function openCreate() {
    setEditItem(null);
    setForm(emptyForm(tahun ? Number(tahun) : CURRENT_YEAR));
    setFormError('');
    setShowForm(true);
  }

  function openEdit(item: SiformenFormasi) {
    setEditItem(item);
    setForm({
      namaJabatan: item.namaJabatan,
      unitKerja: item.unitKerja,
      jenisFormasi: item.jenisFormasi,
      tahun: item.tahun,
      periode: item.periode ?? '',
      jumlahKebutuhan: item.jumlahKebutuhan,
      jumlahTersedia: item.jumlahTersedia,
      jumlahUsulan: item.jumlahUsulan,
      kualifikasiPendidikan: item.kualifikasiPendidikan ?? '',
      kualifikasiJurusan: item.kualifikasiJurusan ?? '',
      alasanKebutuhan: item.alasanKebutuhan ?? '',
    });
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmitForm() {
    if (!form.namaJabatan || !form.unitKerja) {
      setFormError('Nama jabatan dan unit kerja wajib diisi');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      if (editItem) {
        await siformenApi.updateFormasi(editItem.id, {
          namaJabatan: form.namaJabatan,
          unitKerja: form.unitKerja,
          jenisFormasi: form.jenisFormasi,
          tahun: form.tahun,
          periode: form.periode || undefined,
          jumlahKebutuhan: form.jumlahKebutuhan,
          jumlahTersedia: form.jumlahTersedia,
          jumlahUsulan: form.jumlahUsulan,
          kualifikasiPendidikan: form.kualifikasiPendidikan || undefined,
          kualifikasiJurusan: form.kualifikasiJurusan || undefined,
          alasanKebutuhan: form.alasanKebutuhan || undefined,
        });
      } else {
        await siformenApi.createFormasi({
          namaJabatan: form.namaJabatan,
          unitKerja: form.unitKerja,
          jenisFormasi: form.jenisFormasi,
          tahun: form.tahun,
          periode: form.periode || undefined,
          jumlahKebutuhan: form.jumlahKebutuhan,
          jumlahTersedia: form.jumlahTersedia,
          jumlahUsulan: form.jumlahUsulan,
          kualifikasiPendidikan: form.kualifikasiPendidikan || undefined,
          kualifikasiJurusan: form.kualifikasiJurusan || undefined,
          alasanKebutuhan: form.alasanKebutuhan || undefined,
        });
      }
      setShowForm(false);
      load();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Gagal menyimpan data');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleSubmitFormasi(id: string) {
    setActionLoading(id);
    setActionError('');
    try {
      await siformenApi.submitFormasi(id);
      load();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Gagal mengajukan formasi');
    } finally {
      setActionLoading(null);
    }
  }

  async function executeReview() {
    if (!reviewAction) return;
    setActionLoading(reviewAction.id);
    setActionError('');
    try {
      if (reviewAction.type === 'approve') {
        await siformenApi.approveFormasi(reviewAction.id, { catatanVerifikasi: reviewNote || undefined });
      } else {
        await siformenApi.rejectFormasi(reviewAction.id, { catatanVerifikasi: reviewNote || undefined });
      }
      setReviewAction(null);
      setReviewNote('');
      load();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Aksi gagal');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus usulan formasi ini?')) return;
    setActionLoading(id);
    setActionError('');
    try {
      await siformenApi.deleteFormasi(id);
      load();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Gagal menghapus data');
    } finally {
      setActionLoading(null);
    }
  }

  const draftCount = items.filter((i) => i.status === 'DRAFT').length;
  const submittedCount = items.filter((i) => i.status === 'SUBMITTED').length;
  const approvedCount = items.filter((i) => i.status === 'APPROVED').length;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usulan Formasi"
        description="Kelola usulan formasi CPNS dan PPPK — dari penyusunan draft hingga persetujuan pimpinan."
        meta={
          <>
            <StatusBadge value="SIFORMEN" tone="dark" />
            <StatusBadge value={`${submittedCount} menunggu`} tone="warning" />
          </>
        }
        actions={
          <div className="flex gap-2">
            <ActionButton
              icon={loading ? Loader2 : RefreshCcw}
              variant="secondary"
              disabled={loading}
              onClick={load}
            >
              Refresh
            </ActionButton>
            {canWrite ? (
              <ActionButton icon={Plus} variant="primary" onClick={openCreate}>
                Buat Usulan
              </ActionButton>
            ) : null}
          </div>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}
      {actionError ? <ErrorAlert message={actionError} /> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Draft" value={String(draftCount)} tone="neutral" icon={FileCheck} />
        <StatCard label="Diajukan" value={String(submittedCount)} tone="warning" icon={Send} />
        <StatCard label="Disetujui" value={String(approvedCount)} tone="success" icon={CheckCircle} />
      </div>

      {/* Review modal */}
      {reviewAction ? (
        <SectionCard
          title={reviewAction.type === 'approve' ? 'Setujui Formasi' : 'Tolak Formasi'}
          description="Tambahkan catatan verifikasi (opsional)"
        >
          <div className="space-y-3">
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              rows={3}
              placeholder="Catatan verifikasi (opsional)..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
            <div className="flex gap-2">
              <ActionButton
                icon={reviewAction.type === 'approve' ? CheckCircle : XCircle}
                variant={reviewAction.type === 'approve' ? 'primary' : 'danger'}
                disabled={!!actionLoading}
                onClick={() => void executeReview()}
              >
                {reviewAction.type === 'approve' ? 'Setujui' : 'Tolak'}
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => setReviewAction(null)}>
                Batal
              </ActionButton>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {/* Form */}
      {showForm ? (
        <SectionCard
          title={editItem ? 'Edit Usulan Formasi' : 'Buat Usulan Formasi'}
          description="Isi detail usulan formasi CPNS atau PPPK"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Nama Jabatan <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.namaJabatan}
                onChange={(e) => setForm((f) => ({ ...f, namaJabatan: e.target.value }))}
                placeholder="Nama jabatan"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Unit Kerja <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.unitKerja}
                onChange={(e) => setForm((f) => ({ ...f, unitKerja: e.target.value }))}
                placeholder="Unit kerja"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Jenis Formasi <span className="text-destructive">*</span>
              </label>
              <select
                className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.jenisFormasi}
                onChange={(e) => setForm((f) => ({ ...f, jenisFormasi: e.target.value as SiformenFormasiJenis }))}
              >
                <option value="CPNS">CPNS</option>
                <option value="PPPK">PPPK</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Tahun <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.tahun}
                onChange={(e) => setForm((f) => ({ ...f, tahun: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Jumlah Kebutuhan <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.jumlahKebutuhan}
                onChange={(e) => setForm((f) => ({ ...f, jumlahKebutuhan: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Jumlah Tersedia
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.jumlahTersedia}
                onChange={(e) => setForm((f) => ({ ...f, jumlahTersedia: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Jumlah Usulan
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.jumlahUsulan}
                onChange={(e) => setForm((f) => ({ ...f, jumlahUsulan: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Kualifikasi Pendidikan
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.kualifikasiPendidikan}
                onChange={(e) => setForm((f) => ({ ...f, kualifikasiPendidikan: e.target.value }))}
                placeholder="cth. S1"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Kualifikasi Jurusan
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.kualifikasiJurusan}
                onChange={(e) => setForm((f) => ({ ...f, kualifikasiJurusan: e.target.value }))}
                placeholder="cth. Administrasi Negara"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Alasan Kebutuhan
              </label>
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                rows={3}
                value={form.alasanKebutuhan}
                onChange={(e) => setForm((f) => ({ ...f, alasanKebutuhan: e.target.value }))}
                placeholder="Jelaskan alasan kebutuhan formasi ini..."
              />
            </div>
          </div>
          {formError ? <p className="mt-2 text-sm text-destructive">{formError}</p> : null}
          <div className="mt-4 flex gap-2">
            <ActionButton
              icon={formLoading ? Loader2 : CheckCircle}
              variant="primary"
              disabled={formLoading}
              onClick={() => void handleSubmitForm()}
            >
              {editItem ? 'Simpan Perubahan' : 'Buat Usulan'}
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => setShowForm(false)}>
              Batal
            </ActionButton>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Daftar Usulan Formasi"
        description="Seluruh usulan formasi berdasarkan filter tahun, jenis, dan status"
      >
        <FilterBar>
          <select
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-ring"
            value={tahun}
            onChange={(e) => { setTahun(e.target.value); setPage(1); }}
          >
            <option value="">Semua Tahun</option>
            {[CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1].map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-ring"
            value={jenisFormasi}
            onChange={(e) => { setJenisFormasi(e.target.value); setPage(1); }}
          >
            <option value="">Semua Jenis</option>
            <option value="CPNS">CPNS</option>
            <option value="PPPK">PPPK</option>
          </select>
          <select
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-ring"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Diajukan</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </FilterBar>

        {loading ? (
          <LoadingState label="Memuat data formasi" />
        ) : (
          <DataTable<SiformenFormasi>
            items={items}
            empty="Belum ada usulan formasi"
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'jabatan',
                header: 'Jabatan',
                render: (item) => (
                  <div>
                    <div className="font-medium text-foreground">{item.namaJabatan}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{item.unitKerja}</div>
                  </div>
                ),
              },
              {
                key: 'jenis',
                header: 'Jenis',
                render: (item) => (
                  <StatusBadge
                    value={jenisFormasiLabel(item.jenisFormasi)}
                    tone={item.jenisFormasi === 'CPNS' ? 'info' : 'warning'}
                  />
                ),
              },
              {
                key: 'tahun',
                header: 'Tahun',
                render: (item) => <span className="text-sm text-foreground">{item.tahun}</span>,
              },
              {
                key: 'jumlah',
                header: 'Kebutuhan / Usulan',
                render: (item) => (
                  <div className="text-sm">
                    <span className="font-medium text-foreground">{item.jumlahUsulan}</span>
                    <span className="text-muted-foreground"> / {item.jumlahKebutuhan}</span>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <StatusBadge
                    value={formasiStatusLabel(item.status)}
                    tone={formasiStatusTone(item.status)}
                  />
                ),
              },
              {
                key: 'diajukan',
                header: 'Diajukan',
                render: (item) =>
                  item.submittedAt ? (
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.submittedAt)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  ),
              },
              {
                key: 'actions',
                header: '',
                render: (item: SiformenFormasi) => {
                  const busy = actionLoading === item.id;
                  const status = item.status as SiformenFormasiStatus;

                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {canWrite && status === 'DRAFT' ? (
                        <>
                          <ActionButton
                            icon={Pencil}
                            variant="ghost"
                            disabled={busy}
                            onClick={() => openEdit(item)}
                          >
                            Edit
                          </ActionButton>
                          <ActionButton
                            icon={busy ? Loader2 : Send}
                            variant="secondary"
                            disabled={busy}
                            onClick={() => void handleSubmitFormasi(item.id)}
                          >
                            Ajukan
                          </ActionButton>
                        </>
                      ) : null}
                      {canApprove && status === 'SUBMITTED' ? (
                        <>
                          <ActionButton
                            icon={CheckCircle}
                            variant="primary"
                            disabled={busy}
                            onClick={() => { setReviewAction({ id: item.id, type: 'approve' }); setReviewNote(''); }}
                          >
                            Setujui
                          </ActionButton>
                          <ActionButton
                            icon={XCircle}
                            variant="danger"
                            disabled={busy}
                            onClick={() => { setReviewAction({ id: item.id, type: 'reject' }); setReviewNote(''); }}
                          >
                            Tolak
                          </ActionButton>
                        </>
                      ) : null}
                      {canAdmin && status !== 'APPROVED' ? (
                        <ActionButton
                          icon={busy ? Loader2 : Trash2}
                          variant="danger"
                          disabled={busy}
                          onClick={() => void handleDelete(item.id)}
                        >
                          Hapus
                        </ActionButton>
                      ) : null}
                    </div>
                  );
                },
              },
            ]}
          />
        )}

        {totalPages > 1 ? (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total: {total} usulan</span>
            <div className="flex gap-1">
              <button className="rounded border border-border px-2 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</button>
              <span className="px-2 py-1">{page} / {totalPages}</span>
              <button className="rounded border border-border px-2 py-1 disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>→</button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Total: {total} usulan</p>
        )}
      </SectionCard>
    </div>
  );
}
