import { FormEvent } from 'react';
import { Save, X } from 'lucide-react';
import type {
  CreateSiapWorklogPayload,
  SiapWorklog,
} from '@/lib/api/types';
import {
  ActionButton,
  Field,
  inputClass,
  SectionCard,
} from '@/components/workspace/ui';

const defaultCategories = [
  { value: 'VERIFIKASI_BERKAS', label: 'Verifikasi Berkas' },
  { value: 'VALIDASI_DATA', label: 'Validasi Data' },
  { value: 'ARSIP_DIGITAL', label: 'Arsip Digital' },
  { value: 'LAYANAN_ASN', label: 'Layanan ASN' },
  { value: 'RAPAT_KOORDINASI', label: 'Rapat / Koordinasi' },
  { value: 'LAPORAN', label: 'Laporan' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

export type WorklogFormState = {
  workDate: string;
  category: string;
  title: string;
  description: string;
  output: string;
  volume: string;
  obstacle: string;
  caseId: string;
  taskId: string;
};

export const initialWorklogForm: WorklogFormState = {
  workDate: toInputDate(new Date()),
  category: 'VERIFIKASI_BERKAS',
  title: '',
  description: '',
  output: '',
  volume: '',
  obstacle: '',
  caseId: '',
  taskId: '',
};

export function SiapWorklogForm({
  form,
  editing,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  form: WorklogFormState;
  editing: SiapWorklog | null;
  saving?: boolean;
  onChange: (form: WorklogFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function update(field: keyof WorklogFormState, value: string) {
    onChange({
      ...form,
      [field]: value,
    });
  }

  return (
    <SectionCard
      title={editing ? 'Edit Buku Kerja' : 'Tambah Buku Kerja'}
      actions={
        <ActionButton icon={X} onClick={onClose} variant="secondary">
          Tutup
        </ActionButton>
      }
    >
      <form className="grid max-w-4xl gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Tanggal">
            <input
              className={inputClass}
              required
              type="date"
              value={form.workDate}
              onChange={(event) => update('workDate', event.target.value)}
            />
          </Field>

          <Field label="Kategori">
            <select
              className={inputClass}
              required
              value={form.category}
              onChange={(event) => update('category', event.target.value)}
            >
              {defaultCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Jumlah">
            <input
              className={inputClass}
              min={0}
              type="number"
              value={form.volume}
              onChange={(event) => update('volume', event.target.value)}
              placeholder="Contoh: 12"
            />
          </Field>
        </div>

        <Field label="Kegiatan">
          <input
            className={inputClass}
            required
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="Contoh: Verifikasi berkas pensiun"
          />
        </Field>

        <Field label="Uraian singkat">
          <textarea
            className={textareaClass}
            required
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="Tuliskan pekerjaan yang dilakukan"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Hasil">
            <textarea
              className={textareaClass}
              value={form.output}
              onChange={(event) => update('output', event.target.value)}
              placeholder="Contoh: 12 berkas diperiksa"
            />
          </Field>

          <Field label="Kendala">
            <textarea
              className={textareaClass}
              value={form.obstacle}
              onChange={(event) => update('obstacle', event.target.value)}
              placeholder="Isi bila ada"
            />
          </Field>
        </div>

        <details className="rounded-lg border border-slate-200 bg-slate-50/70">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
            Hubungkan ke kasus/tugas
          </summary>
          <div className="grid gap-4 border-t border-slate-200 p-4 md:grid-cols-2">
            <Field label="ID Kasus">
              <input
                className={`${inputClass} bg-white`}
                value={form.caseId}
                onChange={(event) => update('caseId', event.target.value)}
                placeholder="Tempel ID kasus bila perlu"
              />
            </Field>

            <Field label="ID Tugas">
              <input
                className={`${inputClass} bg-white`}
                value={form.taskId}
                onChange={(event) => update('taskId', event.target.value)}
                placeholder="Tempel ID tugas bila perlu"
              />
            </Field>
          </div>
        </details>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <ActionButton disabled={saving} icon={Save} type="submit">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </ActionButton>
        </div>
      </form>
    </SectionCard>
  );
}

export function toWorklogFormValue(item: SiapWorklog): WorklogFormState {
  return {
    workDate: toInputDate(item.workDate),
    category: item.category,
    title: item.title,
    description: item.description,
    output: item.output ?? '',
    volume: item.volume === null ? '' : String(item.volume),
    obstacle: item.obstacle ?? '',
    caseId: item.caseId ?? '',
    taskId: item.taskId ?? '',
  };
}

export function toWorklogPayload(
  form: WorklogFormState,
): CreateSiapWorklogPayload {
  return {
    workDate: form.workDate,
    category: form.category,
    title: form.title.trim(),
    description: form.description.trim(),
    output: normalizeOptional(form.output),
    volume: form.volume ? Number(form.volume) : undefined,
    obstacle: normalizeOptional(form.obstacle),
    caseId: normalizeOptional(form.caseId),
    taskId: normalizeOptional(form.taskId),
  };
}

function normalizeOptional(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function toInputDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

const textareaClass = `${inputClass} min-h-28 py-2`;
