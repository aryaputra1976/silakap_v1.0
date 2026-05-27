import { useEffect, useRef, useState } from 'react';
import { Building2, CheckCircle, DatabaseZap, Loader2, Pencil, Plus, RefreshCcw, Trash2, Users, X } from 'lucide-react';
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
  type SiformenJabatan,
  type UpdateBezettingPayload,
  type SiformenBezettingStatus,
} from '@/lib/api/siformen';
import {
  useBezettingList,
  useCreateBezetting,
  useUpdateBezetting,
  useDeleteBezetting,
  useGenerateBezettingFromJabatan,
} from '@/lib/siformen/hooks';
import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';

const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA'];
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM'];
const CURRENT_YEAR = new Date().getFullYear();

type FormState = {
  jabatanId: string;
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

const emptyForm = (tahun = CURRENT_YEAR): FormState => ({
  jabatanId: '',
  namaJabatan: '',
  unitKerja: '',
  tahun,
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

  const [tahunFilter, setTahunFilter] = useState(String(CURRENT_YEAR));
  const [statusIsiFilter, setStatusIsiFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<SiformenBezetting | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [generateResult, setGenerateResult] = useState<{ created: number; skipped: number } | null>(null);

  // Jabatan picker
  const [jabatanSearch, setJabatanSearch] = useState('');
  const [jabatanResults, setJabatanResults] = useState<SiformenJabatan[]>([]);
  const [jabatanSearchLoading, setJabatanSearchLoading] = useState(false);
  const [showJabatanDropdown, setShowJabatanDropdown] = useState(false);
  const jabatanDropdownRef = useRef<HTMLDivElement>(null);

  // ── Queries & mutations ────────────────────────────────────────────────────
  const { data, isLoading, error, refetch } = useBezettingList({
    tahun: tahunFilter || undefined,
    statusIsi: statusIsiFilter || undefined,
    page,
    limit: 20,
  });
  const createBez = useCreateBezetting();
  const updateBez = useUpdateBezetting();
  const deleteBez = useDeleteBezetting();
  const generateMut = useGenerateBezettingFromJabatan();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);
  const errMsg = (error as Error)?.message ?? '';

  const filled = items.filter((i) => i.statusIsi === 'FILLED').length;
  const vacant = items.filter((i) => i.statusIsi === 'VACANT').length;
  const acting = items.filter((i) => i.statusIsi === 'ACTING').length;

  // Jabatan search autocomplete
  useEffect(() => {
    if (!jabatanSearch.trim()) { setJabatanResults([]); return; }
    setJabatanSearchLoading(true);
    const timer = setTimeout(() => {
      siformenApi.listJabatan({ q: jabatanSearch, jenisJabatan: 'STRUKTURAL', isActive: 'true', limit: 10 })
        .then((r) => setJabatanResults(r.items))
        .catch(() => setJabatanResults([]))
        .finally(() => setJabatanSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [jabatanSearch]);

  function selectJabatan(jabatan: SiformenJabatan) {
    setForm((f) => ({
      ...f,
      jabatanId: jabatan.id,
      namaJabatan: jabatan.namaJabatan,
      unitKerja: jabatan.unitKerjaRef?.nama ?? jabatan.unitKerja,
    }));
    setJabatanSearch('');
    setJabatanResults([]);
    setShowJabatanDropdown(false);
  }

  function clearJabatan() {
    setForm((f) => ({ ...f, jabatanId: '', namaJabatan: '', unitKerja: '' }));
  }

  function handleGenerate() {
    const tahun = tahunFilter ? Number(tahunFilter) : CURRENT_YEAR;
    if (!confirm(`Generate bezetting KOSONG untuk semua jabatan struktural aktif tahun ${tahun}?`)) return;
    setGenerateResult(null);
    generateMut.mutate(tahun, {
      onSuccess: (r) => setGenerateResult(r),
    });
  }

  function openCreate() {
    setEditItem(null);
    setForm(emptyForm(tahunFilter ? Number(tahunFilter) : CURRENT_YEAR));
    setFormError('');
    setJabatanSearch('');
    setShowForm(true);
  }

  function openEdit(item: SiformenBezetting) {
    setEditItem(item);
    setForm({
      jabatanId: item.jabatanId ?? '',
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
    setJabatanSearch('');
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.namaJabatan || !form.unitKerja) {
      setFormError('Nama jabatan dan unit kerja wajib diisi');
      return;
    }
    setFormError('');

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
      updateBez.mutate(
        { id: editItem.id, payload },
        {
          onSuccess: () => setShowForm(false),
          onError: (e) => setFormError((e as Error).message),
        },
      );
    } else {
      createBez.mutate(
        {
          jabatanId: form.jabatanId || undefined,
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
        },
        {
          onSuccess: () => setShowForm(false),
          onError: (e) => setFormError((e as Error).message),
        },
      );
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus data bezetting ini?')) return;
    setDeletingId(id);
    deleteBez.mutate(id, {
      onSettled: () => setDeletingId(null),
    });
  }

  const formLoading = createBez.isPending || updateBez.isPending;

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
            <ActionButton icon={isLoading ? Loader2 : RefreshCcw} variant="secondary" disabled={isLoading} onClick={() => refetch()}>
              Refresh
            </ActionButton>
            {canAdmin ? (
              <ActionButton icon={generateMut.isPending ? Loader2 : DatabaseZap} variant="secondary" disabled={generateMut.isPending} onClick={handleGenerate}>
                {generateMut.isPending ? 'Generating…' : 'Generate dari Jabatan'}
              </ActionButton>
            ) : null}
            {canWrite ? (
              <ActionButton icon={Plus} variant="primary" onClick={openCreate}>
                Tambah Posisi
              </ActionButton>
            ) : null}
          </div>
        }
      />

      {errMsg ? <ErrorAlert message={errMsg} /> : null}
      {generateMut.error ? <ErrorAlert message={(generateMut.error as Error).message} /> : null}
      {deleteBez.error ? <ErrorAlert message={(deleteBez.error as Error).message} /> : null}

      {generateResult ? (
        <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 px-4 py-3 dark:border-green-700 dark:bg-green-950">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Generate selesai — {generateResult.created} posisi dibuat, {generateResult.skipped} sudah ada (dilewati).
            </p>
          </div>
          <button onClick={() => setGenerateResult(null)} className="text-green-600 hover:text-green-800 dark:text-green-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Terisi" value={String(filled)} tone="success" icon={Users} />
        <StatCard label="Kosong" value={String(vacant)} tone="danger" icon={Users} />
        <StatCard label="Plt" value={String(acting)} tone="warning" icon={Users} />
      </div>

      {showForm ? (
        <SectionCard title={editItem ? 'Edit Bezetting' : 'Tambah Posisi Bezetting'} description="Isi data pengisian jabatan">
          <div className="grid gap-3 sm:grid-cols-2">
            {!editItem ? (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Pilih Jabatan <span className="text-destructive">*</span>
                </label>
                {form.jabatanId ? (
                  <div className="flex items-start gap-2 rounded-lg border border-blue-300 bg-blue-50 p-2.5 dark:border-blue-700 dark:bg-blue-950">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">{form.namaJabatan}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{form.unitKerja}</p>
                    </div>
                    <button type="button" onClick={clearJabatan} className="shrink-0 rounded p-0.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative" ref={jabatanDropdownRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={jabatanSearch}
                        onChange={(e) => { setJabatanSearch(e.target.value); setShowJabatanDropdown(true); }}
                        onFocus={() => setShowJabatanDropdown(true)}
                        placeholder="Cari nama jabatan struktural..."
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring pr-8"
                      />
                      {jabatanSearchLoading && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    {showJabatanDropdown && jabatanResults.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg dark:bg-gray-900 max-h-60 overflow-y-auto">
                        {jabatanResults.map((jabatan) => (
                          <button key={jabatan.id} type="button" onMouseDown={() => selectJabatan(jabatan)} className="w-full px-3 py-2.5 text-left hover:bg-accent first:rounded-t-lg last:rounded-b-lg">
                            <p className="text-sm font-medium text-foreground truncate">{jabatan.namaJabatan}</p>
                            <p className="text-xs text-muted-foreground">{jabatan.unitKerjaRef?.nama ?? jabatan.unitKerja}{jabatan.eselonLevel ? ` · Eselon ${jabatan.eselonLevel}` : ''}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {showJabatanDropdown && jabatanSearch && !jabatanSearchLoading && jabatanResults.length === 0 && (
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground shadow-lg dark:bg-gray-900">
                        Tidak ada jabatan untuk "{jabatanSearch}"
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">Pilih dari peta jabatan struktural. Nama jabatan dan unit kerja akan terisi otomatis.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Nama Jabatan</label>
                  <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" value={form.namaJabatan} onChange={(e) => setForm((f) => ({ ...f, namaJabatan: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Unit Kerja</label>
                  <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" value={form.unitKerja} onChange={(e) => setForm((f) => ({ ...f, unitKerja: e.target.value }))} />
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Tahun <span className="text-destructive">*</span></label>
              <input type="number" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" value={form.tahun} onChange={(e) => setForm((f) => ({ ...f, tahun: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Status Isi</label>
              <select className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-ring" value={form.statusIsi} onChange={(e) => setForm((f) => ({ ...f, statusIsi: e.target.value as SiformenBezettingStatus }))}>
                <option value="VACANT">Kosong</option>
                <option value="FILLED">Terisi</option>
                <option value="ACTING">Plt</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">NIP</label>
              <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" value={form.nip} onChange={(e) => setForm((f) => ({ ...f, nip: e.target.value }))} placeholder="NIP ASN" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Nama ASN</label>
              <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" value={form.namaAsn} onChange={(e) => setForm((f) => ({ ...f, namaAsn: e.target.value }))} placeholder="Nama lengkap ASN" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Pangkat</label>
              <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" value={form.pangkat} onChange={(e) => setForm((f) => ({ ...f, pangkat: e.target.value }))} placeholder="cth. Penata Muda Tk.I" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Golongan</label>
              <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" value={form.golongan} onChange={(e) => setForm((f) => ({ ...f, golongan: e.target.value }))} placeholder="cth. III/b" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">TMT Jabatan</label>
              <input type="date" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" value={form.tmtJabatan} onChange={(e) => setForm((f) => ({ ...f, tmtJabatan: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Keterangan</label>
              <input className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))} placeholder="Catatan tambahan" />
            </div>
          </div>
          {formError ? <p className="mt-2 text-sm text-destructive">{formError}</p> : null}
          <div className="mt-4 flex gap-2">
            <ActionButton icon={formLoading ? Loader2 : CheckCircle} variant="primary" disabled={formLoading} onClick={handleSubmit}>
              {editItem ? 'Simpan Perubahan' : 'Tambah Posisi'}
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => setShowForm(false)}>Batal</ActionButton>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Daftar Bezetting" description="Data pengisian jabatan berdasarkan filter tahun dan status">
        <FilterBar>
          <select className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-ring" value={tahunFilter} onChange={(e) => { setTahunFilter(e.target.value); setPage(1); }}>
            <option value="">Semua Tahun</option>
            {[CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1].map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <select className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-ring" value={statusIsiFilter} onChange={(e) => { setStatusIsiFilter(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            <option value="FILLED">Terisi</option>
            <option value="VACANT">Kosong</option>
            <option value="ACTING">Plt</option>
          </select>
        </FilterBar>

        {isLoading ? (
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
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span>{item.unitKerja}</span>
                    </div>
                  </div>
                ),
              },
              { key: 'tahun', header: 'Tahun', render: (item) => <span className="text-sm text-foreground">{item.tahun}</span> },
              {
                key: 'asn',
                header: 'ASN',
                render: (item) => item.namaAsn ? (
                  <div className="text-sm">
                    <div className="text-foreground">{item.namaAsn}</div>
                    <div className="text-xs text-muted-foreground">{item.nip ?? '—'} · {item.golongan ?? '—'}</div>
                  </div>
                ) : <span className="text-xs text-muted-foreground">—</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => <StatusBadge value={bezettingStatusLabel(item.statusIsi)} tone={bezettingStatusTone(item.statusIsi)} />,
              },
              ...(canWrite
                ? [{
                    key: 'actions',
                    header: '',
                    render: (item: SiformenBezetting) => {
                      const busy = deletingId === item.id;
                      return (
                        <div className="flex gap-1">
                          <ActionButton icon={Pencil} variant="ghost" disabled={busy} onClick={() => openEdit(item)} />
                          {canAdmin ? (
                            <ActionButton icon={busy ? Loader2 : Trash2} variant="danger" disabled={busy} onClick={() => handleDelete(item.id)} />
                          ) : null}
                        </div>
                      );
                    },
                  }]
                : []),
            ]}
          />
        )}

        {totalPages > 1 ? (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total: {total} posisi</span>
            <div className="flex gap-1">
              <button className="rounded border border-border px-2 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</button>
              <span className="px-2 py-1">{page} / {totalPages}</span>
              <button className="rounded border border-border px-2 py-1 disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>→</button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Total: {total} posisi</p>
        )}
      </SectionCard>
    </div>
  );
}
