import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@/lib/api/client';
import { siapApi } from '@/lib/api/siap';
import {
  ActionButton,
  ErrorAlert,
  PageHeader,
  inputClass,
} from '@/components/workspace/ui';

const SERVICE_TYPES = [
  { value: 'KENAIKAN_PANGKAT', label: 'Kenaikan Pangkat' },
  { value: 'MUTASI', label: 'Mutasi Jabatan' },
  { value: 'PENSIUN', label: 'Pensiun' },
  { value: 'CUTI', label: 'Cuti' },
  { value: 'IZIN_BELAJAR', label: 'Izin Belajar / Tugas Belajar' },
  { value: 'SURAT_KETERANGAN', label: 'Surat Keterangan' },
  { value: 'PEMBUATAN_KARPEG', label: 'Pembuatan KARPEG' },
  { value: 'LAIN_LAIN', label: 'Lain-lain' },
];

const PRIORITIES = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'URGENT', label: 'Urgen' },
  { value: 'CRITICAL', label: 'Kritis' },
];

export function SiapCaseNewPage() {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [asnId, setAsnId] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceType || !title.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await siapApi.createCase({
        serviceType,
        title: title.trim(),
        description: description.trim() || undefined,
        asnId: asnId.trim() || undefined,
        priority,
      });
      navigate(`/siap/cases/${res.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal membuat kasus');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Buat Kasus"
        description="Isi jenis layanan dan judul kasus. Detail lain bisa dilengkapi setelah kasus dibuat."
      />

      {error ? <ErrorAlert message={error} /> : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Jenis Layanan <span className="text-destructive">*</span>
            </label>
            <select
              className={inputClass}
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              required
            >
              <option value="">Pilih layanan</option>
              {SERVICE_TYPES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Judul Kasus <span className="text-destructive">*</span>
            </label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kenaikan pangkat Ahmad Fauzi"
              maxLength={200}
              required
            />
          </div>

          <details className="rounded-lg border border-slate-200 bg-slate-50/70">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
              Tambahan opsional
            </summary>
            <div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium">Catatan</label>
                <textarea
                  className={`${inputClass} min-h-[90px] resize-y bg-white`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tambahkan informasi singkat bila perlu"
                  maxLength={2000}
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">ASN terkait</label>
                <input
                  className={`${inputClass} bg-white`}
                  value={asnId}
                  onChange={(e) => setAsnId(e.target.value)}
                  placeholder="Tempel ID ASN bila ada"
                  maxLength={36}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Prioritas</label>
                <select
                  className={`${inputClass} bg-white`}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </details>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <ActionButton type="submit" disabled={submitting || !serviceType || !title.trim()}>
            {submitting ? 'Menyimpan...' : 'Buat Kasus'}
          </ActionButton>
          <ActionButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/siap/cases')}
          >
            Batal
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
