import { Field, inputClass, SectionCard } from '@/components/workspace/ui';

export function ServiceVerificationNotePanel({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <SectionCard
      title="Catatan Verifikasi"
      description="Catatan ini dipakai saat meminta perbaikan, menolak, memverifikasi, atau menyelesaikan pengajuan."
    >
      <Field label="Catatan staff/analis">
        <textarea
          className={`${inputClass} min-h-28 py-2`}
          disabled={disabled}
          placeholder="Tulis hasil cek data, dokumen, atau alasan aksi..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
      <p className="mt-2 text-xs text-[#6d7e68]">
        Catatan wajib untuk aksi Minta Perbaikan dan Tolak.
      </p>
    </SectionCard>
  );
}
