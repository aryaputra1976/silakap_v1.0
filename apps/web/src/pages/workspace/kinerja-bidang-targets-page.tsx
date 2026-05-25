import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react';
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
  kinerjaBidangApi,
  kinerjaTargetUnitLabel,
  type KinerjaBidangSop,
  type KinerjaBidangSopTarget,
  type KinerjaBidangTargetForInput,
  type KinerjaSopTargetUnit,
} from '@/lib/api/kinerja-bidang';
import { useAuth } from '@/lib/auth/session';
import { getPrimaryRole } from '@/lib/rbac/roles';
import { buildRealizationCreatePath } from '@/lib/sop/sop-realization-routes';

const MANAGE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'];
const CURRENT_YEAR = new Date().getFullYear();

type FormState = {
  sopId: string;
  rhkCode: string;
  year: number;
  targetQuantity: number;
  targetUnit: KinerjaSopTargetUnit;
  qualityTarget: string;
  timeTarget: string;
};

const emptyForm = (year = CURRENT_YEAR): FormState => ({
  sopId: '',
  rhkCode: '',
  year,
  targetQuantity: 1,
  targetUnit: 'LAPORAN',
  qualityTarget: '',
  timeTarget: '',
});

export function KinerjaBidangTargetsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = getPrimaryRole(user?.roles);
  const canManage = role ? MANAGE_ROLES.includes(role) : false;

  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [items, setItems] = useState<KinerjaBidangTargetForInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<KinerjaBidangSopTarget | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [sopList, setSopList] = useState<KinerjaBidangSop[]>([]);
  const [sopLoading, setSopLoading] = useState(false);

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    kinerjaBidangApi
      .listTargets({ year: year || undefined })
      .then((result) => {
        if (mounted) setItems(result);
      })
      .catch((caught) => {
        if (mounted) setError(caught instanceof Error ? caught.message : 'Gagal memuat target RHK');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [year]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  function openCreate() {
    setEditItem(null);
    setForm(emptyForm(year ? Number(year) : CURRENT_YEAR));
    setFormError('');
    setShowForm(true);
    loadSopList();
  }

  function openEdit(item: KinerjaBidangTargetForInput) {
    setEditItem(item);
    setForm({
      sopId: item.sopId,
      rhkCode: item.rhkCode,
      year: item.year,
      targetQuantity: item.targetQuantity,
      targetUnit: item.targetUnit,
      qualityTarget: item.qualityTarget,
      timeTarget: item.timeTarget,
    });
    setFormError('');
    setShowForm(true);
    loadSopList();
  }

  function loadSopList() {
    if (sopList.length > 0) return;
    setSopLoading(true);
    kinerjaBidangApi
      .listSop({ status: 'ACTIVE' })
      .then((result) => setSopList(result))
      .catch(() => {})
      .finally(() => setSopLoading(false));
  }

  const selectedSop = sopList.find((s) => s.id === form.sopId);
  const rhkOptions = selectedSop?.rhkMappings ?? [];

  async function handleSubmitForm() {
    if (!editItem && !form.sopId) {
      setFormError('SOP wajib dipilih');
      return;
    }
    if (!editItem && !form.rhkCode) {
      setFormError('Kode RHK wajib dipilih');
      return;
    }
    if (!form.qualityTarget || !form.timeTarget) {
      setFormError('Target kualitas dan waktu wajib diisi');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      if (editItem) {
        await kinerjaBidangApi.updateTarget(editItem.id, {
          targetQuantity: form.targetQuantity,
          targetUnit: form.targetUnit,
          qualityTarget: form.qualityTarget,
          timeTarget: form.timeTarget,
        });
      } else {
        await kinerjaBidangApi.createTarget({
          sopId: form.sopId,
          rhkCode: form.rhkCode,
          year: form.year,
          targetQuantity: form.targetQuantity,
          targetUnit: form.targetUnit,
          qualityTarget: form.qualityTarget,
          timeTarget: form.timeTarget,
        });
      }
      setShowForm(false);
      load();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Gagal menyimpan target');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(item: KinerjaBidangTargetForInput) {
    if (!confirm(`Hapus target "${item.sop.title}" (${item.rhkCode}) tahun ${item.year}?`)) return;
    setActionLoading(item.id);
    setActionError('');
    try {
      await kinerjaBidangApi.deleteTarget(item.id);
      load();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Gagal menghapus target');
    } finally {
      setActionLoading(null);
    }
  }

  const inputClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Target RHK"
        description="Kelola target tahunan SOP/RHK yang menjadi dasar input realisasi."
        meta={<StatusBadge value={year || 'Semua Tahun'} tone="success" />}
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
            {canManage ? (
              <ActionButton icon={Plus} variant="primary" onClick={openCreate}>
                Tambah Target
              </ActionButton>
            ) : null}
          </div>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}
      {actionError ? <ErrorAlert message={actionError} /> : null}

      <FilterBar>
        <div className="max-w-xs">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Tahun</label>
          <input
            className={inputClass}
            inputMode="numeric"
            maxLength={4}
            placeholder="e.g. 2025"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
      </FilterBar>

      {showForm ? (
        <SectionCard
          title={editItem ? 'Edit Target RHK' : 'Tambah Target RHK'}
          description={
            editItem
              ? `Edit target untuk ${editItem.rhkCode} tahun ${editItem.year}`
              : 'Tambah target tahunan baru untuk SOP/RHK'
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {!editItem ? (
              <>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    SOP <span className="text-destructive">*</span>
                  </label>
                  {sopLoading ? (
                    <div className="text-xs text-muted-foreground">Memuat daftar SOP...</div>
                  ) : (
                    <select
                      className={inputClass}
                      value={form.sopId}
                      onChange={(e) => setForm((f) => ({ ...f, sopId: e.target.value, rhkCode: '' }))}
                    >
                      <option value="">— Pilih SOP —</option>
                      {sopList.map((sop) => (
                        <option key={sop.id} value={sop.id}>
                          {sop.code} — {sop.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Kode RHK <span className="text-destructive">*</span>
                  </label>
                  {rhkOptions.length > 0 ? (
                    <select
                      className={inputClass}
                      value={form.rhkCode}
                      onChange={(e) => setForm((f) => ({ ...f, rhkCode: e.target.value }))}
                    >
                      <option value="">— Pilih RHK —</option>
                      {rhkOptions.map((rhk) => (
                        <option key={rhk.id} value={rhk.rhkCode}>
                          {rhk.rhkCode}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={inputClass}
                      placeholder="Contoh: RHK-01"
                      maxLength={30}
                      value={form.rhkCode}
                      onChange={(e) => setForm((f) => ({ ...f, rhkCode: e.target.value }))}
                    />
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Tahun <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    className={inputClass}
                    min={2020}
                    max={2040}
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                  />
                </div>
              </>
            ) : null}

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Target Kuantitas <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                className={inputClass}
                min={1}
                value={form.targetQuantity}
                onChange={(e) => setForm((f) => ({ ...f, targetQuantity: Number(e.target.value) }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Satuan <span className="text-destructive">*</span>
              </label>
              <select
                className={inputClass}
                value={form.targetUnit}
                onChange={(e) => setForm((f) => ({ ...f, targetUnit: e.target.value as KinerjaSopTargetUnit }))}
              >
                <option value="LAPORAN">Laporan</option>
                <option value="DOKUMEN">Dokumen</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Target Kualitas <span className="text-destructive">*</span>
              </label>
              <input
                className={inputClass}
                placeholder="Contoh: 85%"
                maxLength={80}
                value={form.qualityTarget}
                onChange={(e) => setForm((f) => ({ ...f, qualityTarget: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Target Waktu <span className="text-destructive">*</span>
              </label>
              <input
                className={inputClass}
                placeholder="Contoh: Sesuai jadwal"
                maxLength={150}
                value={form.timeTarget}
                onChange={(e) => setForm((f) => ({ ...f, timeTarget: e.target.value }))}
              />
            </div>
          </div>

          {formError ? <p className="mt-2 text-sm text-destructive">{formError}</p> : null}

          <div className="mt-4 flex gap-2">
            <ActionButton
              icon={formLoading ? Loader2 : Plus}
              variant="primary"
              disabled={formLoading}
              onClick={() => void handleSubmitForm()}
            >
              {editItem ? 'Simpan Perubahan' : 'Tambah Target'}
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

      {loading ? (
        <LoadingState label="Memuat target RHK" />
      ) : (
        <SectionCard
          title={`Daftar Target ${year ? `Tahun ${year}` : ''}`}
          description={`${items.length} target ditemukan`}
        >
          <DataTable<KinerjaBidangTargetForInput>
            items={items}
            empty="Belum ada target RHK untuk tahun ini"
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'rhk',
                header: 'RHK',
                render: (item) => <StatusBadge value={item.rhkCode} tone="info" />,
              },
              {
                key: 'sop',
                header: 'SOP',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-[#18343a]">{item.sop.title}</div>
                    <div className="mt-1 text-xs text-[#6d7e68]">{item.sop.code}</div>
                  </div>
                ),
              },
              { key: 'year', header: 'Tahun', render: (item) => String(item.year) },
              {
                key: 'target',
                header: 'Target',
                render: (item) =>
                  `${item.targetQuantity} ${kinerjaTargetUnitLabel(item.targetUnit)}`,
              },
              { key: 'quality', header: 'Kualitas', render: (item) => item.qualityTarget },
              { key: 'time', header: 'Waktu', render: (item) => item.timeTarget },
              {
                key: 'actions',
                header: '',
                render: (item) => (
                  <div className="flex gap-2">
                    <ActionButton
                      icon={Plus}
                      onClick={() =>
                        navigate(
                          buildRealizationCreatePath({
                            year,
                            targetId: item.id,
                            rhkCode: item.rhkCode,
                            source: 'monitoring',
                          }),
                        )
                      }
                    >
                      Input Realisasi
                    </ActionButton>
                    {canManage ? (
                      <>
                        <ActionButton
                          icon={Pencil}
                          variant="secondary"
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </ActionButton>
                        <ActionButton
                          icon={actionLoading === item.id ? Loader2 : Trash2}
                          variant="danger"
                          disabled={actionLoading === item.id}
                          onClick={() => void handleDelete(item)}
                        >
                          Hapus
                        </ActionButton>
                      </>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        </SectionCard>
      )}
    </div>
  );
}
