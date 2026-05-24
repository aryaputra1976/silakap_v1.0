import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  inputClass,
} from '@/components/workspace/ui';
import {
  addDokumen,
  deleteProses,
  getProses,
  JENIS_LABEL,
  KATEGORI_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  transisiStatus,
  updateProses,
  type DokumenItem,
  type JenisPemberhentian,
  type NextTransition,
  type ProsesDetail,
  type StatusHistoryItem,
  type StatusPemberhentian,
  deleteDokumen,
} from '@/lib/api/pemberhentian';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function StatusBadge({ status }: { status: StatusPemberhentian }) {
  return (
    <span className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-40 shrink-0 text-xs text-[#687967]">{label}</span>
      <span className="text-sm text-[#18343a]">{value ?? '—'}</span>
    </div>
  );
}

// ─── Transisi Status Modal ────────────────────────────────────────────────────

function TransisiModal({
  open,
  prosesId,
  transitions,
  onClose,
  onSuccess,
}: {
  open: boolean;
  prosesId: string;
  transitions: NextTransition[];
  onClose: () => void;
  onSuccess: (detail: ProsesDetail) => void;
}) {
  const [selected, setSelected] = useState<StatusPemberhentian | ''>('');
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) { setSelected(''); setCatatan(''); }
    else if (transitions.length === 1) setSelected(transitions[0].status);
  }, [open, transitions]);

  async function handleSubmit() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await transisiStatus(prosesId, { statusKe: selected, catatan: catatan || undefined });
      toast.success(`Status berubah ke "${STATUS_LABEL[selected]}"`);
      onSuccess(res);
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Gagal mengubah status');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#cfe1da] px-5 py-4">
          <h2 className="text-base font-semibold text-[#18343a]">Pindah Status</h2>
          <button onClick={onClose} className="text-[#687967] hover:text-[#18343a]"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#18343a]">Status Baru</label>
            <div className="space-y-1.5">
              {transitions.map((t) => (
                <button
                  key={t.status}
                  onClick={() => setSelected(t.status)}
                  className={`flex w-full items-center justify-between rounded border px-3 py-2 text-sm transition-colors ${selected === t.status ? 'border-[#3a6b52] bg-[#e8f0e5] text-[#3a6b52]' : 'border-[#cfe1da] text-[#687967] hover:bg-[#f4f8ef]'}`}
                >
                  {t.label}
                  {selected === t.status && <CheckCircle2 className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#18343a]">Catatan <span className="font-normal text-[#687967]">(opsional)</span></label>
            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} className={inputClass} placeholder="Catatan perubahan status..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#cfe1da] px-5 py-3">
          <button onClick={onClose} className="rounded border border-[#c8d8c3] px-4 py-2 text-sm text-[#687967] hover:bg-[#f4f8ef]">Batal</button>
          <button
            onClick={handleSubmit}
            disabled={!selected || saving}
            className="rounded bg-[#3a6b52] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5340] disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Info Modal ──────────────────────────────────────────────────────────

function EditInfoModal({
  open,
  proses,
  onClose,
  onSuccess,
}: {
  open: boolean;
  proses: ProsesDetail;
  onClose: () => void;
  onSuccess: (detail: ProsesDetail) => void;
}) {
  const [form, setForm] = useState({
    tmtPemberhentian: proses.tmtPemberhentian?.slice(0, 10) ?? '',
    nomorSk: proses.nomorSk ?? '',
    tanggalSk: proses.tanggalSk?.slice(0, 10) ?? '',
    nomorUsul: proses.nomorUsul ?? '',
    tanggalUsul: proses.tanggalUsul?.slice(0, 10) ?? '',
    nomorPengembalian: proses.nomorPengembalian ?? '',
    alasanPengembalian: proses.alasanPengembalian ?? '',
    catatan: proses.catatan ?? '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        tmtPemberhentian: proses.tmtPemberhentian?.slice(0, 10) ?? '',
        nomorSk: proses.nomorSk ?? '',
        tanggalSk: proses.tanggalSk?.slice(0, 10) ?? '',
        nomorUsul: proses.nomorUsul ?? '',
        tanggalUsul: proses.tanggalUsul?.slice(0, 10) ?? '',
        nomorPengembalian: proses.nomorPengembalian ?? '',
        alasanPengembalian: proses.alasanPengembalian ?? '',
        catatan: proses.catatan ?? '',
      });
    }
  }, [open, proses]);

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await updateProses(proses.id, {
        tmtPemberhentian: form.tmtPemberhentian || null,
        nomorSk: form.nomorSk || null,
        tanggalSk: form.tanggalSk || null,
        nomorUsul: form.nomorUsul || null,
        tanggalUsul: form.tanggalUsul || null,
        nomorPengembalian: form.nomorPengembalian || null,
        alasanPengembalian: form.alasanPengembalian || null,
        catatan: form.catatan || null,
      });
      toast.success('Data berhasil diperbarui');
      onSuccess(res);
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#cfe1da] px-5 py-4">
          <h2 className="text-base font-semibold text-[#18343a]">Edit Informasi Proses</h2>
          <button onClick={onClose} className="text-[#687967] hover:text-[#18343a]"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto space-y-3 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#687967]">TMT Pemberhentian</label>
              <input type="date" {...f('tmtPemberhentian')} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#687967]">Nomor Usul</label>
              <input type="text" {...f('nomorUsul')} className={inputClass} placeholder="Nomor surat usul" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#687967]">Tanggal Usul</label>
              <input type="date" {...f('tanggalUsul')} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#687967]">Nomor SK</label>
              <input type="text" {...f('nomorSk')} className={inputClass} placeholder="Nomor SK BKN/BKD" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#687967]">Tanggal SK</label>
              <input type="date" {...f('tanggalSk')} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#687967]">Nomor Pengembalian</label>
              <input type="text" {...f('nomorPengembalian')} className={inputClass} placeholder="Jika dikembalikan" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#687967]">Alasan Pengembalian</label>
            <textarea {...f('alasanPengembalian')} rows={2} className={inputClass} placeholder="Alasan dikembalikan BKN" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#687967]">Catatan</label>
            <textarea {...f('catatan')} rows={2} className={inputClass} placeholder="Catatan tambahan" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#cfe1da] px-5 py-3">
          <button onClick={onClose} className="rounded border border-[#c8d8c3] px-4 py-2 text-sm text-[#687967] hover:bg-[#f4f8ef]">Batal</button>
          <button onClick={handleSubmit} disabled={saving} className="rounded bg-[#3a6b52] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5340] disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Dokumen Modal ────────────────────────────────────────────────────────

const JENIS_DOKUMEN_OPTIONS = [
  'SK CPNS', 'SK PNS', 'SK Pangkat Terakhir', 'SKP Terakhir',
  'DPCP (Data Perorangan Calon Penerima Pensiun)',
  'Surat Permohonan APS', 'Surat Keterangan Dokter',
  'Kartu Keluarga', 'Akta Nikah/Cerai/Kematian',
  'Daftar Riwayat Hidup', 'Surat Tidak Hukdis', 'Surat Tidak Pidana',
  'Keputusan Hukuman Disiplin', 'Nota Usul Pemberhentian',
  'Surat Pengantar BKN', 'Tanda Terima BKN', 'Lainnya',
];

function AddDokumenModal({
  open,
  prosesId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  prosesId: string;
  onClose: () => void;
  onSuccess: (dok: DokumenItem) => void;
}) {
  const [jenisDokumen, setJenisDokumen] = useState(JENIS_DOKUMEN_OPTIONS[0]);
  const [customJenis, setCustomJenis] = useState('');
  const [namaFile, setNamaFile] = useState('');
  const [storagePath, setStoragePath] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!open) { setJenisDokumen(JENIS_DOKUMEN_OPTIONS[0]); setCustomJenis(''); setNamaFile(''); setStoragePath(''); setKeterangan(''); } }, [open]);

  const resolvedJenis = jenisDokumen === 'Lainnya' ? customJenis : jenisDokumen;

  async function handleSubmit() {
    if (!resolvedJenis || !namaFile || !storagePath) {
      toast.error('Jenis dokumen, nama file, dan path wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const res = await addDokumen(prosesId, { jenisDokumen: resolvedJenis, namaFile, storagePath, keterangan: keterangan || undefined });
      toast.success('Dokumen berhasil ditambahkan');
      onSuccess(res);
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Gagal menambah dokumen');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#cfe1da] px-5 py-4">
          <h2 className="text-base font-semibold text-[#18343a]">Tambah Dokumen</h2>
          <button onClick={onClose} className="text-[#687967] hover:text-[#18343a]"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#18343a]">Jenis Dokumen</label>
            <select value={jenisDokumen} onChange={(e) => setJenisDokumen(e.target.value)} className={inputClass}>
              {JENIS_DOKUMEN_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>
          {jenisDokumen === 'Lainnya' && (
            <div>
              <input type="text" value={customJenis} onChange={(e) => setCustomJenis(e.target.value)} className={inputClass} placeholder="Jenis dokumen lainnya..." />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#18343a]">Nama File</label>
            <input type="text" value={namaFile} onChange={(e) => setNamaFile(e.target.value)} className={inputClass} placeholder="contoh: SK_Pangkat_Terakhir.pdf" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#18343a]">Path / Referensi</label>
            <input type="text" value={storagePath} onChange={(e) => setStoragePath(e.target.value)} className={inputClass} placeholder="Lokasi penyimpanan atau nomor referensi" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#18343a]">Keterangan <span className="font-normal text-[#687967]">(opsional)</span></label>
            <input type="text" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className={inputClass} placeholder="Keterangan tambahan..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#cfe1da] px-5 py-3">
          <button onClick={onClose} className="rounded border border-[#c8d8c3] px-4 py-2 text-sm text-[#687967] hover:bg-[#f4f8ef]">Batal</button>
          <button onClick={handleSubmit} disabled={saving} className="rounded bg-[#3a6b52] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5340] disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Tambah'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ history }: { history: StatusHistoryItem[] }) {
  return (
    <div className="space-y-3">
      {history.map((h, i) => (
        <div key={h.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold ${i === history.length - 1 ? 'bg-[#3a6b52]' : 'bg-[#c8d8c3]'}`}>
              {i + 1}
            </div>
            {i < history.length - 1 && <div className="mt-1 h-full w-px bg-[#e8f0e5]" />}
          </div>
          <div className="pb-3 flex-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[h.statusKe]}`}>
                {STATUS_LABEL[h.statusKe]}
              </span>
              <span className="text-xs text-[#687967]">{fmt(h.createdAt)}</span>
            </div>
            {h.catatan && <p className="mt-0.5 text-xs text-[#687967]">{h.catatan}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PemberhentianProsesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proses, setProses] = useState<ProsesDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTransisi, setShowTransisi] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddDok, setShowAddDok] = useState(false);
  const [deletingDokId, setDeletingDokId] = useState<string | null>(null);
  const [deletingProses, setDeletingProses] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await getProses(id);
      setProses(res);
    } catch {
      setError('Gagal memuat detail proses');
      toast.error('Gagal memuat detail proses');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleDeleteDok(dokId: string) {
    if (!proses) return;
    setDeletingDokId(dokId);
    try {
      await deleteDokumen(proses.id, dokId);
      toast.success('Dokumen dihapus');
      setProses((prev) => prev ? { ...prev, dokumen: prev.dokumen.filter((d) => d.id !== dokId) } : prev);
    } catch {
      toast.error('Gagal menghapus dokumen');
    } finally {
      setDeletingDokId(null);
    }
  }

  async function handleDeleteProses() {
    if (!proses || !confirm('Hapus proses ini? Tindakan tidak dapat dibatalkan.')) return;
    setDeletingProses(true);
    try {
      await deleteProses(proses.id);
      toast.success('Proses dihapus');
      navigate('/pemberhentian/proses');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Gagal menghapus proses');
      setDeletingProses(false);
    }
  }

  if (loading) return <LoadingState message="Memuat detail proses..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!proses) return null;

  const isEditable = !['SELESAI', 'DIBATALKAN'].includes(proses.status);
  const isDraft = proses.status === 'DRAFT';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Proses Pemberhentian — ${proses.asn.nama}`}
        description={`${JENIS_LABEL[proses.jenisPemberhentian]} · ${KATEGORI_LABEL[proses.kategori]}`}
        meta={<StatusBadge status={proses.status} />}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/pemberhentian/proses')} className="flex items-center gap-1 text-sm text-[#687967] hover:text-[#18343a]">
              <ArrowLeft className="h-4 w-4" />Kembali
            </button>
            {isEditable && (
              <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 rounded border border-[#c8d8c3] px-3 py-1.5 text-sm text-[#3a6b52] hover:bg-[#e8f0e5]">
                <Edit3 className="h-3.5 w-3.5" />Edit
              </button>
            )}
            {proses.nextTransitions.length > 0 && (
              <button onClick={() => setShowTransisi(true)} className="flex items-center gap-1.5 rounded bg-[#3a6b52] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2d5340]">
                <ChevronRight className="h-4 w-4" />Pindah Status
              </button>
            )}
            {isDraft && (
              <button onClick={handleDeleteProses} disabled={deletingProses} className="flex items-center gap-1.5 rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" />Hapus
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Info ASN */}
          <SectionCard title="Informasi ASN">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f0e5] text-[#3a6b52]">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-lg font-semibold text-[#18343a]">{proses.asn.nama}</p>
                  <p className="text-sm text-[#687967]">{proses.asn.nip}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  <DetailRow label="Jabatan" value={proses.asn.jabatanNama} />
                  <DetailRow label="Jenis Jabatan" value={proses.asn.jenisJabatanNama} />
                  <DetailRow label="Golongan/Ruang" value={proses.asn.golonganNama} />
                  <DetailRow label="Unit Kerja" value={proses.asn.unitKerja?.nama} />
                  <DetailRow label="TMT Pensiun (SIDATA)" value={fmt(proses.asn.tmtPensiun)} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Info Proses */}
          <SectionCard
            title="Informasi Proses"
            actions={isEditable ? (
              <button onClick={() => setShowEdit(true)} className="flex items-center gap-1 text-xs text-[#3a6b52] hover:underline">
                <Edit3 className="h-3 w-3" />Edit
              </button>
            ) : undefined}
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <DetailRow label="Jenis Pemberhentian" value={JENIS_LABEL[proses.jenisPemberhentian as JenisPemberhentian]} />
              <DetailRow label="Kategori" value={KATEGORI_LABEL[proses.kategori]} />
              <DetailRow label="TMT Pemberhentian" value={fmt(proses.tmtPemberhentian)} />
              <DetailRow label="Nomor Usul" value={proses.nomorUsul} />
              <DetailRow label="Tanggal Usul" value={fmt(proses.tanggalUsul)} />
              <DetailRow label="Nomor SK" value={proses.nomorSk} />
              <DetailRow label="Tanggal SK" value={fmt(proses.tanggalSk)} />
              {proses.nomorPengembalian && (
                <>
                  <DetailRow label="Nomor Pengembalian" value={proses.nomorPengembalian} />
                  <DetailRow label="Alasan Pengembalian" value={proses.alasanPengembalian} />
                </>
              )}
              {proses.catatan && <DetailRow label="Catatan" value={proses.catatan} />}
            </div>
          </SectionCard>

          {/* Dokumen */}
          <SectionCard
            title={`Dokumen (${proses.dokumen.length})`}
            actions={isEditable ? (
              <button onClick={() => setShowAddDok(true)} className="flex items-center gap-1 text-xs text-[#3a6b52] hover:underline">
                <Plus className="h-3 w-3" />Tambah
              </button>
            ) : undefined}
          >
            {proses.dokumen.length === 0 ? (
              <p className="py-3 text-sm text-[#687967]">Belum ada dokumen yang dilampirkan</p>
            ) : (
              <div className="space-y-2">
                {proses.dokumen.map((dok) => (
                  <div key={dok.id} className="flex items-center justify-between rounded border border-[#e8f0e5] p-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-[#687967]" />
                      <div>
                        <p className="text-sm font-medium text-[#18343a]">{dok.namaFile}</p>
                        <p className="text-xs text-[#687967]">{dok.jenisDokumen}{dok.keterangan ? ` · ${dok.keterangan}` : ''}</p>
                      </div>
                    </div>
                    {isEditable && (
                      <button
                        onClick={() => handleDeleteDok(dok.id)}
                        disabled={deletingDokId === dok.id}
                        className="text-red-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Status & next transitions */}
          <SectionCard title="Status Saat Ini">
            <div className="space-y-3">
              <StatusBadge status={proses.status} />
              {proses.nextTransitions.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-[#687967]">Langkah berikutnya:</p>
                  <div className="space-y-1">
                    {proses.nextTransitions.map((t) => (
                      <div key={t.status} className={`rounded px-2.5 py-1.5 text-xs font-medium ${STATUS_COLOR[t.status]}`}>
                        {t.label}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowTransisi(true)}
                    className="mt-3 w-full rounded bg-[#3a6b52] px-3 py-2 text-sm font-medium text-white hover:bg-[#2d5340]"
                  >
                    Pindah Status
                  </button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Timeline */}
          <SectionCard title="Riwayat Status">
            {proses.statusHistory.length === 0 ? (
              <p className="text-sm text-[#687967]">Belum ada riwayat</p>
            ) : (
              <StatusTimeline history={proses.statusHistory} />
            )}
          </SectionCard>
        </div>
      </div>

      {/* Modals */}
      <TransisiModal
        open={showTransisi}
        prosesId={proses.id}
        transitions={proses.nextTransitions}
        onClose={() => setShowTransisi(false)}
        onSuccess={(updated) => setProses(updated)}
      />
      <EditInfoModal
        open={showEdit}
        proses={proses}
        onClose={() => setShowEdit(false)}
        onSuccess={(updated) => setProses(updated)}
      />
      <AddDokumenModal
        open={showAddDok}
        prosesId={proses.id}
        onClose={() => setShowAddDok(false)}
        onSuccess={(dok) => setProses((prev) => prev ? { ...prev, dokumen: [...prev.dokumen, dok] } : prev)}
      />
    </div>
  );
}
