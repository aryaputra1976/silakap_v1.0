import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Building2, CheckCircle, DatabaseZap, Link2, Loader2, Pencil, Plus, RefreshCcw, Trash2, X } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  FilterBar,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import {
  siformenApi,
  type SiformenJabatan,
  type SiformenJabatanFungsionalRef,
  type CreateJabatanPayload,
  type UpdateJabatanPayload,
} from '@/lib/api/siformen';
import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';



const WRITE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA'];
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM'];

const JENIS_JABATAN_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: 'STRUKTURAL', label: 'Struktural' },
  { value: 'FUNGSIONAL', label: 'Fungsional' },
  { value: 'PELAKSANA', label: 'Pelaksana' },
];

type FormState = CreateJabatanPayload & { isActive?: boolean };
const emptyForm = (): FormState => ({
  kodeJabatan: '',
  namaJabatan: '',
  jenisJabatan: 'FUNGSIONAL',
  unitKerja: '',
  eselonLevel: '',
  satuanKerja: '',
  kualifikasiPendidikan: '',
  isActive: true,
  jabatanFungsionalRefId: undefined,
});

export function SiformenJabatanPage() {
  const { user } = useAuth();
  const role = getPrimaryRole(user?.roles);
  const canWrite = role ? WRITE_ROLES.includes(role) : false;
  const canAdmin = role ? ADMIN_ROLES.includes(role) : false;

  const [items, setItems] = useState<SiformenJabatan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [jenisJabatan, setJenisJabatan] = useState('');
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<SiformenJabatan | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Generate state
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [generateResult, setGenerateResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);

  // Ref picker state
  const [selectedRef, setSelectedRef] = useState<SiformenJabatanFungsionalRef | null>(null);
  const [refSearch, setRefSearch] = useState('');
  const [refResults, setRefResults] = useState<SiformenJabatanFungsionalRef[]>([]);
  const [refSearchLoading, setRefSearchLoading] = useState(false);
  const [showRefDropdown, setShowRefDropdown] = useState(false);
  const refSearchRef = useRef<HTMLInputElement>(null);
  const refDropdownRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    siformenApi
      .listJabatan({ q: q || undefined, jenisJabatan: jenisJabatan || undefined, page, limit: 20 })
      .then((result) => {
        if (mounted) {
          setItems(result.items);
          setTotal(result.total);
        }
      })
      .catch((caught) => {
        if (mounted) setError(caught instanceof Error ? caught.message : 'Gagal memuat data jabatan');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [q, jenisJabatan, page]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  async function handleGenerate() {
    if (!confirm('Generate jabatan struktural dari data Unit Kerja? Jabatan yang sudah ada akan diperbarui.')) return;
    setGenerateLoading(true);
    setGenerateError('');
    setGenerateResult(null);
    try {
      const result = await siformenApi.generateJabatanFromUnitKerja();
      setGenerateResult(result);
      load();
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Gagal generate jabatan dari Unit Kerja');
    } finally {
      setGenerateLoading(false);
    }
  }

  function openCreate() {
    setEditItem(null);
    setForm(emptyForm());
    setFormError('');
    setSelectedRef(null);
    setRefSearch('');
    setShowForm(true);
  }

  function openEdit(item: SiformenJabatan) {
    setEditItem(item);
    setForm({
      kodeJabatan: item.kodeJabatan,
      namaJabatan: item.namaJabatan,
      jenisJabatan: item.jenisJabatan,
      unitKerja: item.unitKerja,
      eselonLevel: item.eselonLevel ?? '',
      satuanKerja: item.satuanKerja ?? '',
      kualifikasiPendidikan: item.kualifikasiPendidikan ?? '',
      isActive: item.isActive,
      jabatanFungsionalRefId: item.jabatanFungsionalRefId ?? undefined,
    });
    setSelectedRef(item.jabatanFungsionalRef ?? null);
    setRefSearch('');
    setFormError('');
    setShowForm(true);
  }

  // Search refs with debounce
  useEffect(() => {
    if (!refSearch.trim()) {
      setRefResults([]);
      return;
    }
    setRefSearchLoading(true);
    const timer = setTimeout(() => {
      siformenApi
        .listJabatanFungsionalRef({ q: refSearch, limit: 8 })
        .then((r) => setRefResults(r.items))
        .catch(() => setRefResults([]))
        .finally(() => setRefSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [refSearch]);

  function selectRef(ref: SiformenJabatanFungsionalRef) {
    setSelectedRef(ref);
    setForm((f) => ({
      ...f,
      namaJabatan: ref.namaJabatan,
      jabatanFungsionalRefId: ref.id,
      kualifikasiPendidikan: ref.pendidikanPengangkatan ?? f.kualifikasiPendidikan,
    }));
    setRefSearch('');
    setRefResults([]);
    setShowRefDropdown(false);
  }

  function clearRef() {
    setSelectedRef(null);
    setForm((f) => ({ ...f, jabatanFungsionalRefId: undefined }));
  }

  async function handleSubmit() {
    if (!form.kodeJabatan || !form.namaJabatan || !form.unitKerja) {
      setFormError('Kode, nama, dan unit kerja wajib diisi');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      if (editItem) {
        const payload: UpdateJabatanPayload = {
          namaJabatan: form.namaJabatan,
          jenisJabatan: form.jenisJabatan,
          unitKerja: form.unitKerja,
          eselonLevel: form.eselonLevel || undefined,
          satuanKerja: form.satuanKerja || undefined,
          kualifikasiPendidikan: form.kualifikasiPendidikan || undefined,
          isActive: form.isActive,
          jabatanFungsionalRefId: form.jabatanFungsionalRefId ?? null,
        };
        await siformenApi.updateJabatan(editItem.id, payload);
      } else {
        await siformenApi.createJabatan({
          kodeJabatan: form.kodeJabatan,
          namaJabatan: form.namaJabatan,
          jenisJabatan: form.jenisJabatan,
          unitKerja: form.unitKerja,
          eselonLevel: form.eselonLevel || undefined,
          satuanKerja: form.satuanKerja || undefined,
          kualifikasiPendidikan: form.kualifikasiPendidikan || undefined,
          jabatanFungsionalRefId: form.jabatanFungsionalRefId,
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

  async function handleDelete(id: string) {
    if (!confirm('Hapus data jabatan ini?')) return;
    setActionLoading(id);
    setActionError('');
    try {
      await siformenApi.deleteJabatan(id);
      load();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Gagal menghapus data');
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Peta Jabatan"
        description="Referensi jabatan struktural, fungsional, dan pelaksana di lingkungan BKPSDM."
        meta={
          <>
            <StatusBadge value="SIFORMEN" tone="dark" />
            <StatusBadge value={`${total} jabatan`} tone="info" />
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
            {canAdmin ? (
              <ActionButton
                icon={generateLoading ? Loader2 : DatabaseZap}
                variant="secondary"
                disabled={generateLoading}
                onClick={() => void handleGenerate()}
              >
                {generateLoading ? 'Generating…' : 'Generate dari Unit Kerja'}
              </ActionButton>
            ) : null}
            {canWrite ? (
              <ActionButton icon={Plus} variant="primary" onClick={openCreate}>
                Tambah Jabatan
              </ActionButton>
            ) : null}
          </div>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}
      {actionError ? <ErrorAlert message={actionError} /> : null}
      {generateError ? <ErrorAlert message={generateError} /> : null}

      {/* Generate result */}
      {generateResult ? (
        <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 px-4 py-3 dark:border-green-700 dark:bg-green-950">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Generate selesai — {generateResult.created} jabatan ditambahkan, {generateResult.updated} diperbarui, {generateResult.skipped} dilewati.
            </p>
          </div>
          <button onClick={() => setGenerateResult(null)} className="text-green-600 hover:text-green-800 dark:text-green-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Form */}
      {showForm ? (
        <SectionCard
          title={editItem ? 'Edit Jabatan' : 'Tambah Jabatan'}
          description="Isi data referensi jabatan"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Kode Jabatan <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring disabled:opacity-50"
                value={form.kodeJabatan}
                disabled={!!editItem}
                onChange={(e) => setForm((f) => ({ ...f, kodeJabatan: e.target.value }))}
                placeholder="cth. JAB-001"
              />
            </div>
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
                Jenis Jabatan <span className="text-destructive">*</span>
              </label>
              <select
                className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.jenisJabatan}
                onChange={(e) => {
                  setForm((f) => ({ ...f, jenisJabatan: e.target.value }));
                  if (e.target.value !== 'FUNGSIONAL') clearRef();
                }}
              >
                <option value="STRUKTURAL">Struktural</option>
                <option value="FUNGSIONAL">Fungsional</option>
                <option value="PELAKSANA">Pelaksana</option>
              </select>
            </div>

            {form.jenisJabatan === 'FUNGSIONAL' && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Referensi Jabatan Fungsional Nasional
                </label>
                {selectedRef ? (
                  <div className="flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 p-2.5 dark:border-green-700 dark:bg-green-950">
                    <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                        {selectedRef.namaJabatan}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {selectedRef.jenjang} · {selectedRef.kategori}
                        {selectedRef.golonganRuangAwal ? ` · Gol. ${selectedRef.golonganRuangAwal}` : ''}
                        {selectedRef.instansiPembina ? ` · ${selectedRef.instansiPembina}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearRef}
                      className="shrink-0 rounded p-0.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative" ref={refDropdownRef}>
                    <div className="relative">
                      <input
                        ref={refSearchRef}
                        type="text"
                        value={refSearch}
                        onChange={(e) => { setRefSearch(e.target.value); setShowRefDropdown(true); }}
                        onFocus={() => setShowRefDropdown(true)}
                        placeholder="Cari nama jabatan fungsional..."
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring pr-8"
                      />
                      {refSearchLoading && (
                        <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {showRefDropdown && refResults.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg dark:bg-gray-900">
                        {refResults.map((ref) => (
                          <button
                            key={ref.id}
                            type="button"
                            onMouseDown={() => selectRef(ref)}
                            className="w-full px-3 py-2.5 text-left hover:bg-accent first:rounded-t-lg last:rounded-b-lg"
                          >
                            <p className="text-sm font-medium text-foreground truncate">{ref.namaJabatan}</p>
                            <p className="text-xs text-muted-foreground">
                              {ref.jenjang} · {ref.kategori}
                              {ref.golonganRuangAwal ? ` · Gol. ${ref.golonganRuangAwal}` : ''}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {showRefDropdown && refSearch && !refSearchLoading && refResults.length === 0 && (
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground shadow-lg dark:bg-gray-900">
                        Tidak ada hasil untuk "{refSearch}"
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Opsional. Pilih referensi untuk menautkan ke data standar nasional BKN.
                </p>
              </div>
            )}

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
                Eselon
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.eselonLevel ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, eselonLevel: e.target.value }))}
                placeholder="cth. II, III, IV"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Satuan Kerja
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.satuanKerja ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, satuanKerja: e.target.value }))}
                placeholder="Satuan kerja"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Kualifikasi Pendidikan
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.kualifikasiPendidikan ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, kualifikasiPendidikan: e.target.value }))}
                placeholder="cth. S1 Administrasi Negara / Manajemen"
              />
            </div>
            {editItem ? (
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="size-4"
                />
                <label htmlFor="isActive" className="text-sm text-foreground">
                  Jabatan Aktif
                </label>
              </div>
            ) : null}
          </div>
          {formError ? <p className="mt-2 text-sm text-destructive">{formError}</p> : null}
          <div className="mt-4 flex gap-2">
            <ActionButton
              icon={formLoading ? Loader2 : CheckCircle}
              variant="primary"
              disabled={formLoading}
              onClick={() => void handleSubmit()}
            >
              {editItem ? 'Simpan Perubahan' : 'Tambah Jabatan'}
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => setShowForm(false)}
            >
              Batal
            </ActionButton>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Daftar Jabatan"
        description="Referensi jabatan yang terdaftar di sistem"
      >
        <FilterBar>
          <input
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
            placeholder="Cari kode / nama jabatan..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
          <select
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-ring"
            value={jenisJabatan}
            onChange={(e) => { setJenisJabatan(e.target.value); setPage(1); }}
          >
            {JENIS_JABATAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FilterBar>

        {loading ? (
          <LoadingState label="Memuat data jabatan" />
        ) : (
          <DataTable<SiformenJabatan>
            items={items}
            empty="Belum ada data jabatan"
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'kode',
                header: 'Kode',
                render: (item) => (
                  <span className="font-mono text-xs text-foreground">{item.kodeJabatan}</span>
                ),
              },
              {
                key: 'nama',
                header: 'Nama Jabatan',
                render: (item) => (
                  <div>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      {item.namaJabatan}
                      {item.jabatanFungsionalRefId && (
                        <span title={`Terhubung ke ref: ${item.jabatanFungsionalRef?.jenjang ?? ''}`}>
                          <Link2 className="h-3 w-3 text-green-500" />
                        </span>
                      )}
                    </div>
                    {/* Show unit kerja name from FK ref for disambiguation, fallback to denormalized string */}
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      {item.unitKerjaRef ? (
                        <>
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span>{item.unitKerjaRef.nama}</span>
                        </>
                      ) : (
                        <span>{item.unitKerja}</span>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                key: 'jenis',
                header: 'Jenis',
                render: (item) => (
                  <StatusBadge
                    value={item.jenisJabatan}
                    tone={
                      item.jenisJabatan === 'STRUKTURAL'
                        ? 'info'
                        : item.jenisJabatan === 'FUNGSIONAL'
                          ? 'success'
                          : 'neutral'
                    }
                  />
                ),
              },
              {
                key: 'eselon',
                header: 'Eselon',
                render: (item) => (
                  <span className="text-sm text-foreground">{item.eselonLevel ?? '—'}</span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <StatusBadge
                    value={item.isActive ? 'Aktif' : 'Nonaktif'}
                    tone={item.isActive ? 'success' : 'neutral'}
                  />
                ),
              },
              ...(canWrite
                ? [
                    {
                      key: 'actions',
                      header: '',
                      render: (item: SiformenJabatan) => {
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
            <span>Total: {total} jabatan</span>
            <div className="flex gap-1">
              <button
                className="rounded border border-border px-2 py-1 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ←
              </button>
              <span className="px-2 py-1">
                {page} / {totalPages}
              </span>
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
          <p className="mt-2 text-xs text-muted-foreground">Total: {total} jabatan</p>
        )}
      </SectionCard>
    </div>
  );
}
