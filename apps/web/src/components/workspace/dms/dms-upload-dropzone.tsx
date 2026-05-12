import type { ChangeEvent } from 'react';
import { UploadCloud } from 'lucide-react';

const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function DmsUploadDropzone({
  file,
  disabled,
  onSelect,
}: {
  file: File | null;
  disabled?: boolean;
  onSelect: (file: File | null) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    onSelect(selected);
    event.currentTarget.value = '';
  }

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/70 p-6">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600">
          <UploadCloud className="size-6" />
        </div>

        <div>
          <div className="font-semibold text-zinc-950">
            {file ? file.name : 'Pilih file dokumen'}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Format: PDF, JPG, PNG, DOCX, XLSX. Maksimal mengikuti aturan backend.
          </div>
        </div>

        {file ? (
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700">
            {file.type || 'unknown'} · {formatFileSize(file.size)}
          </div>
        ) : null}

        <input
          accept={allowedTypes.join(',')}
          className="sr-only"
          disabled={disabled}
          type="file"
          onChange={handleChange}
        />
      </label>

      {file ? (
        <div className="mt-4 flex justify-center">
          <button
            className="text-sm font-semibold text-rose-700 hover:text-rose-800"
            disabled={disabled}
            type="button"
            onClick={() => onSelect(null)}
          >
            Hapus pilihan file
          </button>
        </div>
      ) : null}
    </div>
  );
}

function formatFileSize(value: number) {
  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}