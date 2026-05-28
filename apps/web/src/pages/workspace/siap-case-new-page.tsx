import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@/lib/api/client';
import { sidataApi } from '@/lib/api/sidata';
import { siapApi } from '@/lib/api/siap';
import type { AsnRecord } from '@/lib/api/types';
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
  { value: 'HIGH', label: 'Urgen' },
  { value: 'CRITICAL', label: 'Kritis' },
];

export function SiapCaseNewPage() {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [asnSearch, setAsnSearch] = useState('');
  const [asnResults, setAsnResults] = useState<AsnRecord[]>([]);
  const [selectedAsn, setSelectedAsn] = useState<AsnRecord | null>(null);
  const [asnLoading, setAsnLoading] = useState(false);
  const [priority, setPriority] = useState('NORMAL');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const keyword = asnSearch.trim();
    if (keyword.length < 3) {
      setAsnResults([]);
      setAsnLoading(false);
      return;
    }

    let active = true;
    setAsnLoading(true);

    const timer = window.setTimeout(() => {
      sidataApi
        .getAsnList({ q: keyword, page: 1, limit: 6 })
        .then((result) => {
          if (active) {
            setAsnResults(result.items);
          }
        })
        .catch(() => {
          if (active) {
            setAsnResults([]);
          }
        })
        .finally(() => {
          if (active) {
            setAsnLoading(false);
          }
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [asnSearch]);

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
        asnId: selectedAsn?.id,
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

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium">ASN terkait</label>
                <p className="text-xs text-slate-500">
                  Opsional. Pilih ASN jika kasus ini terkait pegawai tertentu.
                </p>
                <input
                  className={`${inputClass} bg-white`}
                  value={asnSearch}
                  onChange={(e) => setAsnSearch(e.target.value)}
                  placeholder="Cari nama atau NIP ASN"
                  maxLength={120}
                />
                {selectedAsn ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {selectedAsn.nama}
                      </div>
                      <div className="text-xs text-slate-600">
                        NIP {selectedAsn.nip}
                        {selectedAsn.unitKerja?.nama ? ` - ${selectedAsn.unitKerja.nama}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-emerald-100"
                      onClick={() => setSelectedAsn(null)}
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">Belum ada ASN terkait</div>
                )}
                {asnSearch.trim().length >= 3 ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {asnLoading ? (
                      <div className="px-3 py-2 text-sm text-slate-500">Mencari ASN...</div>
                    ) : asnResults.length > 0 ? (
                      asnResults.map((asn) => (
                        <button
                          key={asn.id}
                          type="button"
                          className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                          onClick={() => {
                            setSelectedAsn(asn);
                            setAsnSearch('');
                            setAsnResults([]);
                          }}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              {asn.nama}
                            </span>
                            <span className="block truncate text-xs text-slate-500">
                              NIP {asn.nip}
                              {asn.unitKerja?.nama ? ` - ${asn.unitKerja.nama}` : ''}
                            </span>
                          </span>
                          <span className="shrink-0 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                            Pilih
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        ASN tidak ditemukan
                      </div>
                    )}
                  </div>
                ) : null}
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
