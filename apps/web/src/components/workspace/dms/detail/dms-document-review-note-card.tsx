import { Field, inputClass, SectionCard } from '@/components/workspace/ui';
import type { DmsDocument } from '@/lib/api/dms';

export function DmsDocumentReviewNoteCard({
  document,
  reviewNote,
  working,
  onChange,
}: {
  document: DmsDocument;
  reviewNote: string;
  working: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <SectionCard
      title="Catatan Verifikasi"
      description="Catatan opsional untuk verifikasi dan wajib untuk penolakan."
    >
      <Field label="Catatan">
        <textarea
          className={`${inputClass} min-h-32 py-2`}
          disabled={working || document.status !== 'SUBMITTED'}
          value={reviewNote}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Isi catatan verifikasi atau alasan penolakan."
        />
      </Field>
    </SectionCard>
  );
}
