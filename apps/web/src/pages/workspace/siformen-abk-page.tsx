import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Plus, RefreshCcw, Loader2, Pencil, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
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
  type SiformenAbk,
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
  uraianTugas: string;
  volumeKerja: number;
  normaWaktu: number;
  waktuEfektif: number;
  pegawaiAda: number;
  keterangan: string;
};

const emptyForm = (tahun = CURRENT_YEAR): FormState => ({
  namaJabatan: '',
  unitKerja: '',
  tahun,
  uraianTugas: '',
  volumeKerja: 0,
  normaWaktu: 0,
  waktuEfektif: 1250,
  pegawaiAda: 0,
  keterangan: '',
});

function calcAbk(form: Pick<FormState, 'volumeKerja' | 'normaWaktu' | 'waktuEfektif' | 'pegawaiAda'>) {
  const bebanKerja = form.volumeKerja * form.normaWaktu;
  const kebutuhanPegawai = form.waktuEfektif > 0 ? bebanKerja / form.waktuEfektif : 0;
  const selisih = kebutuhanPegawai - form.pegawaiAda;
  return { bebanKerja, kebutuhanPegawai, selisih };
}

export function SiformenAbkPage() {
  const { user } = useAuth();
  const role = getPrimaryRole(user?.roles);
  const canWrite = role ? WRITE_ROLES.includes(role) : false;
  const canAdmin = role ? ADMIN_ROLES.includes(role) : false;

  const [items, setItems] = useState<SiformenAbk[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [tahun, setTahun] = useState(String(CURRENT_YEAR));
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<SiformenAbk | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncInfo, setSyncInfo] = useState<string | null>(null);

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    siformenApi
      .listAbk({ tahun: tahun || undefined, page, limit: 20 })
      .then((result) => {
        if (mounted) {
          setItems(result.items);
          setTotal(result.total);
        }
      })
      .catch((caught) => {
        if (mounted) setError(caught instanceof Error ? caught.message : 'Gagal memuat data ABK');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [tahun, page]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  function openCreate() {
    setEditItem(null);
    setForm(emptyForm(tahun ? Number(tahun) : CURRENT_YEAR));
    setFormError('');
    setSyncInfo(null);
    setShowForm(true);
  }

  function openEdit(item: SiformenAbk) {
    setEditItem(item);
    setForm({
      namaJabatan: item.namaJabatan,
      unitKerja: item.unitKerja,
      tahun: item.tahun,
      uraianTugas: item.uraianTugas ?? '',
      volumeKerja: item.volumeKerja,
      normaWaktu: item.normaWaktu,
      waktuEfektif: item.waktuEfektif,
      pegawaiAda: item.pegawaiAda,
      keterangan: item.keterangan ?? '',
    });
    setFormError('');
    setSyncInfo(null);
    setShowForm(true);
  }

  async function syncPegawaiAda() {
    if (!form.namaJabatan || !form.tahun) return;
    setSyncLoading(true);
    setSyncInfo(null);
    try {
      const result = await siformenApi.getFilledBezettingCount({
        namaJabatan: form.namaJabatan,
        tahun: form.tahun,
      });
      setForm((f) => ({ ...f, pegawaiAda: result.count }));
      setSyncInfo(
        result.count > 0
          ? `Ditemukan ${result.count} pegawai berstatus FILLED di Bezetting ${form.tahun}`
          : `Tidak ada pegawai terisi di Bezetting ${form.tahun} untuk jabatan ini`,
      );
    } catch {
      setSyncInfo('Gagal mengambil data dari Bezetting');
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleSubmit() {
    if (!form.namaJabatan || !form.unitKerja) {
      setFormError('Nama jabatan dan unit kerja wajib diisi');
      return;
    }
    if (form.volumeKerja <= 0 || form.normaWaktu <= 0) {
      setFormError('Volume kerja dan norma waktu harus lebih dari 0');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      if (editItem) {
        await siformenApi.updateAbk(editItem.id, {
          namaJabatan: form.namaJabatan,
          unitKerja: form.unitKerja,
          tahun: form.tahun,
          uraianTugas: form.uraianTugas || undefined,
          volumeKerja: form.volumeKerja,
          normaWaktu: form.normaWaktu,
          waktuEfektif: form.waktuEfektif,
          pegawaiAda: form.pegawaiAda,
          keterangan: form.keterangan || undefined,
        });
      } else {
        await siformenApi.createAbk({
          namaJabatan: form.namaJabatan,
          unitKerja: form.unitKerja,
          tahun: form.tahun,
          uraianTugas: form.uraianTugas || undefined,
          volumeKerja: form.volumeKerja,
          normaWaktu: form.normaWaktu,
          waktuEfektif: form.waktuEfektif,
          pegawaiAda: form.pegawaiAda,
          keterangan: form.keterangan || undefined,
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
    if (!confirm('Hapus data ABK ini?')) return;
    setActionLoading(id);
    setActionError('');
    try {
      await siformenApi.deleteAbk(id);
      load();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Gagal menghapus data');
    } finally {
      setActionLoading(null);
    }
  }

  const preview = calcAbk(form);
  const totalPages = Math.ceil(total / 20);

  function getSelisihTone(selisih: number): 'danger' | 'warning' | 'success' {
    if (selisih > 1) return 'danger';
    if (selisih > 0) return 'warning';
    return 'success';
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analisis Beban Kerja (ABK)"
        description="Hitung kebutuhan pegawai berdasarkan volume kerja, norma waktu, dan waktu kerja efektif per tahun."
        meta={
          <>
            <StatusBadge value="SIFORMEN" tone="dark" />
            <StatusBadge value={`${total} entri`} tone="info" />
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
                Tambah ABK
              </ActionButton>
            ) : null}
          </div>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}
      {actionError ? <ErrorAlert message={actionError} /> : null}

      {/* Form */}
      {showForm ? (
        <SectionCard
          title={editItem ? 'Edit Data ABK' : 'Input Data ABK'}
          description="Masukkan data beban kerja untuk menghitung kebutuhan pegawai"
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
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Uraian Tugas
              </label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.uraianTugas}
                onChange={(e) => setForm((f) => ({ ...f, uraianTugas: e.target.value }))}
                placeholder="Uraian tugas pokok"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Volume Kerja (per tahun) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={0}
                step="0.1"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.volumeKerja}
                onChange={(e) => setForm((f) => ({ ...f, volumeKerja: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Norma Waktu (jam) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={0}
                step="0.1"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.normaWaktu}
                onChange={(e) => setForm((f) => ({ ...f, normaWaktu: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Waktu Kerja Efektif (jam/tahun)
              </label>
              <input
                type="number"
                min={1}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.waktuEfektif}
                onChange={(e) => setForm((f) => ({ ...f, waktuEfektif: Number(e.target.value) }))}
              />
              <p className="mt-0.5 text-xs text-muted-foreground">Default: 1250 jam/tahun</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  Pegawai Ada
                </label>
                <button
                  type="button"
                  disabled={syncLoading || !form.namaJabatan}
                  onClick={() => void syncPegawaiAda()}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                  title="Ambil jumlah pegawai terisi dari data Bezetting"
                >
                  {syncLoading ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3" />
                  )}
                  Ambil dari Bezetting
                </button>
              </div>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
                value={form.pegawaiAda}
                onChange={(e) => setForm((f) => ({ ...f, pegawaiAda: Number(e.target.value) }))}
              />
              {syncInfo ? (
                <p className={`mt-0.5 text-xs ${syncInfo.startsWith('Gagal') ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {syncInfo}
                </p>
              ) : null}
            </div>
          </div>

          {/* Live calculation preview */}
          {form.volumeKerja > 0 && form.normaWaktu > 0 ? (
            <div className="mt-3 rounded-lg bg-muted p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Hasil Perhitungan</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {preview.bebanKerja.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Beban Kerja (jam)</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {preview.kebutuhanPegawai.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Kebutuhan Pegawai</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${preview.selisih > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    {preview.selisih > 0 ? '+' : ''}{preview.selisih.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {preview.selisih > 0 ? 'Kekurangan' : 'Kelebihan/Cukup'}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {formError ? <p className="mt-2 text-sm text-destructive">{formError}</p> : null}
          <div className="mt-4 flex gap-2">
            <ActionButton
              icon={formLoading ? Loader2 : CheckCircle}
              variant="primary"
              disabled={formLoading}
              onClick={() => void handleSubmit()}
            >
              {editItem ? 'Simpan Perubahan' : 'Tambah ABK'}
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => setShowForm(false)}>
              Batal
            </ActionButton>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Daftar Analisis Beban Kerja"
        description="Data ABK per jabatan dan tahun"
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
        </FilterBar>

        {loading ? (
          <LoadingState label="Memuat data ABK" />
        ) : (
          <DataTable<SiformenAbk>
            items={items}
            empty="Belum ada data ABK"
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'jabatan',
                header: 'Jabatan',
                render: (item) => (
                  <div>
                    <div className="font-medium text-foreground">{item.namaJabatan}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{item.unitKerja}</div>
                    {item.uraianTugas ? (
                      <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {item.uraianTugas}
                      </div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'tahun',
                header: 'Tahun',
                render: (item) => <span className="text-sm text-foreground">{item.tahun}</span>,
              },
              {
                key: 'beban',
                header: 'Beban Kerja',
                render: (item) => (
                  <div className="text-sm">
                    <div className="text-foreground">
                      {item.volumeKerja} × {item.normaWaktu} = {item.bebanKerja.toFixed(0)} jam
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Efektif: {item.waktuEfektif} jam/th
                    </div>
                  </div>
                ),
              },
              {
                key: 'kebutuhan',
                header: 'Kebutuhan',
                render: (item) => (
                  <div className="text-sm font-semibold text-foreground">
                    {item.kebutuhanPegawai.toFixed(2)}
                  </div>
                ),
              },
              {
                key: 'pegawai',
                header: 'Ada',
                render: (item) => (
                  <span className="text-sm text-foreground">{item.pegawaiAda}</span>
                ),
              },
              {
                key: 'selisih',
                header: 'Selisih',
                render: (item) => (
                  <StatusBadge
                    value={`${item.selisih > 0 ? '+' : ''}${item.selisih.toFixed(2)}`}
                    tone={getSelisihTone(item.selisih)}
                  />
                ),
              },
              ...(canWrite
                ? [
                    {
                      key: 'actions',
                      header: '',
                      render: (item: SiformenAbk) => {
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
            <span>Total: {total} entri</span>
            <div className="flex gap-1">
              <button className="rounded border border-border px-2 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</button>
              <span className="px-2 py-1">{page} / {totalPages}</span>
              <button className="rounded border border-border px-2 py-1 disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>→</button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Total: {total} entri</p>
        )}
      </SectionCard>
    </div>
  );
}

function getSelisihTone(selisih: number): 'danger' | 'warning' | 'success' {
  if (selisih > 1) return 'danger';
  if (selisih > 0) return 'warning';
  return 'success';
}
