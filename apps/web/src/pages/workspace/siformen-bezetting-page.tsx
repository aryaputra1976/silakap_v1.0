import { useCallback, useEffect, useState } from 'react';
import { Users, Plus, RefreshCcw, Loader2, Pencil, Trash2, CheckCircle } from 'lucide-react';
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
} from '@/components/workspace/ui';
import {
  siformenApi,
  bezettingStatusLabel,
  bezettingStatusTone,
  type SiformenBezetting,
  type CreateBezettingPayload,
  type UpdateBezettingPayload,
  type SiformenBezettingStatus,
} from '@/lib/api/siformen';
import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';

const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA'];
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM'];

const CURRENT_YEAR = new Date().getFullYear();

type FormState = {
  namaJabatan: string;
  unitKerja: string;
  tahun: number;
  nip: string;
  namaAsn: string;
  pangkat: string;
  golongan: string;
  tmtJabatan: string;
  statusIsi: SiformenBezettingStatus;
  keterangan: string;
};

const emptyForm = (): FormState => ({
  namaJabatan: '',
  unitKerja: '',
  tahun: CURRENT_YEAR,
  nip: '',
  namaAsn: '',
  pangkat: '',
  golongan: '',
  tmtJabatan: '',
  statusIsi: 'VACANT',
  keterangan: '',
});

export function SiformenBezettingPage() {
  const { user } = useAuth();
  const role = getPrimaryRole(user?.roles);
  const canWrite = role ? WRITE_ROLES.includes(role) : false;
  const canAdmin = role ? ADMIN_ROLES.includes(role) : false;

  const [items, setItems] = useState<SiformenBezetting[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [tahun, setTahun] = useState(String(CURRENT_YEAR));
  const [statusIsi, setStatusIsi] = useState('');
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<SiformenBezetting | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    siformenApi
      .listBezetting({
        tahun: tahun || undefined,
        statusIsi: statusIsi || undefined,
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
        if (mounted) setError(caught instanceof Error ? caught.message : 'Gagal memuat data bezetting');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [tahun, statusIsi, page]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  function openCreate() {
    setEditItem(null);
    setForm({ ...emptyForm(), tahun: tahun ? Number(tahun) : CURRENT_YEAR });
    setFormError('');
    setShowForm(true);
  }

  function openEdit(item: SiformenBezetting) {
    setEditItem(item);
    setForm({
      namaJabatan: item.namaJabatan,
      unitKerja: item.unitKerja,
      tahun: item.tahun,
      nip: item.nip ?? '',
      namaAsn: item.namaAsn ?? '',
      pangkat: item.pangkat ?? '',
      golongan: item.golongan ?? '',
      tmtJabatan: item.tmtJabatan ? item.tmtJabatan.slice(0, 10) : '',
      statusIsi: item.statusIsi,
      keterangan: item.keterangan ?? '',
    });
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.namaJabatan || !form.unitKerja) {
      setFormError('Nama jabatan dan unit kerja wajib diisi');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      if (editItem) {
        const payload: UpdateBezettingPayload = {
          namaJabatan: form.namaJabatan,
          unitKerja: form.unitKerja,
          tahun: form.tahun,
          nip: form.nip || undefined,
          namaAsn: form.namaAsn || undefined,
          pangkat: form.pangkat || undefined,
          golongan: form.golongan || undefined,
          tmtJabatan: form.tmtJabatan || undefined,
          statusIsi: form.statusIsi,
          keterangan: form.keterangan || undefined,
        };
        await siformenApi.updateBezetting(editItem.id, payload);
      } else {
        const payload: CreateBezettingPayload = {
          namaJabatan: form.namaJabatan,
          unitKerja: form.unitKerja,
          tahun: form.tahun,
          nip: form.nip || undefined,
          namaAsn: form.namaAsn || undefined,
          pangkat: form.pangkat || undefined,
          golongan: form.golongan || undefined,
          tmtJabatan: form.tmtJabatan || undefined,
          statusIsi: form.statusIsi,
          keterangan: form.keterangan || undefined,
        };
        await siformenApi.createBezetting(payload);
      }
      setShowForm(false);
      load();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Gagal menyimpan data');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus data bezetting ini?')) return;
    setActionLoading(id);
    setActionError('');
    try {
      await siformenApi.deleteBezetting(id);
      load();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Gagal menghapus data');
    } finally {
      setActionLoading(null);
    }
  }

  const filled = items.filter((i) => i.statusIsi === 'FILLED').length;
  const vacant = items.filter((i) => i.statusIsi === 'VACANT').length;
  const acting = items.filter((i) => i.statusIsi === 'ACTING').length;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bezetting Jabatan"
        description="Daftar pengisian jabatan ASN per tahun. Pantau posisi terisi, kosong, dan pejabat Plt."
        meta={
          <>
            <StatusBadge value="SIFORMEN" tone="dark" />
            <StatusBadge value={`${total} posisi`} tone="info" />
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
                Tambah Posisi
              </ActionButton>
            ) : null}
          </div>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}
      {actionError ? <ErrorAlert message={actionError} /> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Terisi" value={String(filled)} tone="success" icon={Users} />
        <StatCard label="Kosong" value={String(vacant)} tone="danger" icon={Users} />
        <StatCard label="Plt" value={String(acting)} tone="warning" icon={Users} />
      </div>

      {/* Form */}
      {showForm ? (
        <SectionCard
          title={editItem ? 'Edit Bezetting' : 'Tambah Posisi Bezetting'}
          description="Isi data pengisian jabatan"
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
                Status Isi
              </label>
              <select
                className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.statusIsi}
                onChange={(e) => setForm((f) => ({ ...f, statusIsi: e.target.value as SiformenBezettingStatus }))}
              >
                <option value="VACANT">Kosong</option>
                <option value="FILLED">Terisi</option>
                <option value="ACTING">Plt</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">NIP</label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.nip}
                onChange={(e) => setForm((f) => ({ ...f, nip: e.target.value }))}
                placeholder="NIP ASN"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Nama ASN
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.namaAsn}
                onChange={(e) => setForm((f) => ({ ...f, namaAsn: e.target.value }))}
                placeholder="Nama lengkap ASN"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Pangkat
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.pangkat}
                onChange={(e) => setForm((f) => ({ ...f, pangkat: e.target.value }))}
                placeholder="cth. Penata Muda Tk.I"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Golongan
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.golongan}
                onChange={(e) => setForm((f) => ({ ...f, golongan: e.target.value }))}
                placeholder="cth. III/b"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                TMT Jabatan
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.tmtJabatan}
                onChange={(e) => setForm((f) => ({ ...f, tmtJabatan: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Keterangan
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.keterangan}
                onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                placeholder="Catatan tambahan"
              />
            </div>
          </div>
          {formError ? <p className="mt-2 text-sm text-destructive">{formError}</p> : null}
          <div className="mt-4 flex gap-2">
            <ActionButton
              icon={formLoading ? Loader2 : CheckCircle}
              variant="primary"
              disabled={formLoading}
              onClick={() => void handleSubmit()}
            >
              {editItem ? 'Simpan Perubahan' : 'Tambah Posisi'}
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => setShowForm(false)}>
              Batal
            </ActionButton>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Daftar Bezetting"
        description="Data pengisian jabatan berdasarkan filter tahun dan status"
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
            value={statusIsi}
            onChange={(e) => { setStatusIsi(e.target.value); setPage(1); }}
          >
            <option value="">Semua Status</option>
            <option value="FILLED">Terisi</option>
            <option value="VACANT">Kosong</option>
            <option value="ACTING">Plt</option>
          </select>
        </FilterBar>

        {loading ? (
          <LoadingState label="Memuat data bezetting" />
        ) : (
          <DataTable<SiformenBezetting>
            items={items}
            empty="Belum ada data bezetting"
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
                key: 'tahun',
                header: 'Tahun',
                render: (item) => (
                  <span className="text-sm text-foreground">{item.tahun}</span>
                ),
              },
              {
                key: 'asn',
                header: 'ASN',
                render: (item) =>
                  item.namaAsn ? (
                    <div className="text-sm">
                      <div className="text-foreground">{item.namaAsn}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.nip ?? '—'} · {item.golongan ?? '—'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <StatusBadge
                    value={bezettingStatusLabel(item.statusIsi)}
                    tone={bezettingStatusTone(item.statusIsi)}
                  />
                ),
              },
              ...(canWrite
                ? [
                    {
                      key: 'actions',
                      header: '',
                      render: (item: SiformenBezetting) => {
                        const busy = actionLoading === item.id;
                        return (
                          <div className="flex gap-1.5">
                            <ActionButton
                              icon={Pencil}
                              variant="ghost"
                              disabled={busy}
                              onClick={() => openEdit(item)}
                            >
                              Edit
                            </ActionButton>
                            {canAdmin ? (
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
                  ]
                : []),
            ]}
          />
        )}

        {totalPages > 1 ? (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total: {total} posisi</span>
            <div className="flex gap-1">
              <button
                className="rounded border border-border px-2 py-1 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ←
              </button>
              <span className="px-2 py-1">{page} / {totalPages}</span>
              <button
                className="rounded border border-border px-2 py-1 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Total: {total} posisi</p>
        )}
      </SectionCard>
    </div>
  );
}
