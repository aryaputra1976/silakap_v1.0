import { useEffect, useState } from 'react';
import { CheckCircle2, Pencil, X, Save, AlertTriangle } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import {
  ErrorAlert,
  LoadingState,
  PageHeader,
  SectionCard,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from '@/components/workspace/ui';
import type { LayananSopConfigItem } from '@/lib/api/layanan-sop-config';

type EditState = {
  title: string;
  shortLabel: string;
  description: string;
  rhkCodes: string;
  sortOrder: number;
  isActive: boolean;
};

function toEditState(item: LayananSopConfigItem): EditState {
  return {
    title: item.title,
    shortLabel: item.shortLabel,
    description: item.description,
    rhkCodes: item.rhkCodes.join(', '),
    sortOrder: item.sortOrder,
    isActive: true,
  };
}

export function AdminLayananSopConfigPage() {
  const [items, setItems] = useState<LayananSopConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    apiClient
      .get<LayananSopConfigItem[]>('/internal/layanan-kepegawaian/sop-configs')
      .then((data) => { if (active) { setItems(data); setLoading(false); } })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Gagal memuat konfigurasi SOP');
          setLoading(false);
        }
      });

    return () => { active = false; };
  }, []);

  function startEdit(item: LayananSopConfigItem) {
    setEditingKey(item.key);
    setEditState(toEditState(item));
    setSaveError('');
    setSavedKey(null);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditState(null);
    setSaveError('');
  }

  async function saveEdit(key: string) {
    if (!editState) return;
    setSaving(true);
    setSaveError('');

    try {
      const payload = {
        title: editState.title.trim(),
        shortLabel: editState.shortLabel.trim(),
        description: editState.description.trim(),
        rhkCodes: editState.rhkCodes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        sortOrder: editState.sortOrder,
        isActive: editState.isActive,
      };

      const updated = await apiClient.patch<LayananSopConfigItem>(
        `/internal/layanan-kepegawaian/sop-configs/${key}`,
        payload,
      );

      setItems((prev) => prev.map((item) => (item.key === key ? updated : item)));
      setSavedKey(key);
      setEditingKey(null);
      setEditState(null);
      setTimeout(() => setSavedKey(null), 3000);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Konfigurasi SOP Layanan Kepegawaian"
        description="Kelola judul, label, dan deskripsi SOP yang ditampilkan di portal layanan kepegawaian. Perubahan langsung terlihat tanpa perlu deploy ulang."
      />

      {loading && <LoadingState />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && (
        <SectionCard title={`${items.length} SOP terdaftar`}>
          <div className="divide-y divide-zinc-100">
            {items.map((item) => {
              const isEditing = editingKey === item.key;
              const justSaved = savedKey === item.key;

              return (
                <div key={item.key} className="py-4 first:pt-0 last:pb-0">
                  {isEditing && editState ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-500">{item.key}</span>
                        <span className="text-xs text-zinc-400">{item.code}</span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-600">Judul SOP</label>
                          <input
                            className={inputClass}
                            value={editState.title}
                            onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                            maxLength={255}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-600">Label singkat</label>
                          <input
                            className={inputClass}
                            value={editState.shortLabel}
                            onChange={(e) => setEditState({ ...editState, shortLabel: e.target.value })}
                            maxLength={100}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-600">Deskripsi</label>
                        <textarea
                          className={`${inputClass} h-auto py-2`}
                          rows={2}
                          value={editState.description}
                          onChange={(e) => setEditState({ ...editState, description: e.target.value })}
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-600">Kode RHK (pisahkan koma)</label>
                          <input
                            className={inputClass}
                            value={editState.rhkCodes}
                            onChange={(e) => setEditState({ ...editState, rhkCodes: e.target.value })}
                            placeholder="RHK 1, RHK 3, RHK 8"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-600">Urutan tampil</label>
                          <input
                            type="number"
                            className={inputClass}
                            value={editState.sortOrder}
                            min={0}
                            onChange={(e) => setEditState({ ...editState, sortOrder: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      {saveError && (
                        <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          {saveError}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={buttonClass}
                          disabled={saving}
                          onClick={() => saveEdit(item.key)}
                        >
                          <Save className="h-4 w-4" />
                          {saving ? 'Menyimpan…' : 'Simpan'}
                        </button>
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          disabled={saving}
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-500">{item.key}</span>
                          <span className="text-sm font-semibold text-zinc-900">{item.title}</span>
                          {justSaved && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Tersimpan
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">{item.shortLabel} · {item.code}</p>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-600">{item.description}</p>
                        {item.rhkCodes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.rhkCodes.map((r) => (
                              <span key={r} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">{r}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
