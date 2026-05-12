import type { ChangeEvent } from 'react';
import { AlertCircle, UploadCloud } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'];

export function DmsUploadDropzone({
  file,
  disabled,
  error,
  onError,
  onSelect,
}: {
  file: File | null;
  disabled?: boolean;
  error?: string;
  onError?: (message: string) => void;
  onSelect: (file: File | null) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    event.currentTarget.value = '';

    if (!selected) {
      onSelect(null);
      return;
    }

    const validationError = validateFile(selected);

    if (validationError) {
      onSelect(null);
      onError?.(validationError);
      return;
    }

    onError?.('');
    onSelect(selected);
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
            Format: PDF, JPG, PNG, DOCX, XLSX. Maksimal 10 MB.
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

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {file ? (
        <div className="mt-4 flex justify-center">
          <button
            className="text-sm font-semibold text-rose-700 hover:text-rose-800"
            disabled={disabled}
            type="button"
            onClick={() => {
              onError?.('');
              onSelect(null);
            }}
          >
            Hapus pilihan file
          </button>
        </div>
      ) : null}
    </div>
  );
}

function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Ukuran file maksimal 10 MB.';
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension || !allowedExtensions.includes(extension)) {
    return 'Ekstensi file tidak didukung. Gunakan PDF, JPG, PNG, DOCX, atau XLSX.';
  }

  if (file.type && !allowedTypes.includes(file.type)) {
    return 'Tipe MIME file tidak didukung. Gunakan PDF, JPG, PNG, DOCX, atau XLSX.';
  }

  return '';
}

function formatFileSize(value: number) {
  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
