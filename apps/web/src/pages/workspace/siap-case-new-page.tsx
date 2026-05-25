import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@/lib/api/client';
import { siapApi } from '@/lib/api/siap';
import {
  ActionButton,
  ErrorAlert,
  PageHeader,
  SectionCard,
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
        title="Buat Kasus SIAP"
        description="Buat kasus layanan kepegawaian baru. Kasus akan dibuat dalam status DRAFT."
      />

      {error ? <ErrorAlert message={error} /> : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <SectionCard title="Informasi Kasus">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Jenis Layanan <span className="text-destructive">*</span>
              </label>
              <select
                className={inputClass}
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                required
              >
                <option value="">Pilih jenis layanan...</option>
                {SERVICE_TYPES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Judul Kasus <span className="text-destructive">*</span>
              </label>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kenaikan Pangkat Periode April 2026 - Ahmad Fauzi"
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground">{title.length}/200 karakter</p>
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium">Deskripsi</label>
              <textarea
                className={`${inputClass} min-h-[90px] resize-y`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Keterangan tambahan (opsional)..."
                maxLength={2000}
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">ID ASN Terkait</label>
              <input
                className={inputClass}
                value={asnId}
                onChange={(e) => setAsnId(e.target.value)}
                placeholder="ID ASN (opsional)"
                maxLength={36}
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan jika kasus tidak terkait ASN tertentu.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Prioritas</label>
              <select
                className={inputClass}
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
        </SectionCard>

        <div className="flex items-center gap-3">
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
