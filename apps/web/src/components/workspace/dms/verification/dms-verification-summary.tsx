import { CheckCircle2, XCircle } from 'lucide-react';
import type { DmsDocument } from '@/lib/api/dms';
import {
  ActionButton,
  Field,
  inputClass,
  SectionCard,
} from '@/components/workspace/ui';

type DmsVerificationSummaryProps = {
  selected: DmsDocument;
  note: string;
  working: boolean;
  onNoteChange: (value: string) => void;
  onVerify: () => void;
  onReject: () => void;
  onClose: () => void;
  onOpenDetail: () => void;
};

export function DmsVerificationSummary({
  selected,
  note,
  working,
  onNoteChange,
  onVerify,
  onReject,
  onClose,
  onOpenDetail,
}: DmsVerificationSummaryProps) {
  return (
    <SectionCard
      title="Panel Verifikasi"
      description={selected.title}
      actions={
        <ActionButton disabled={working} onClick={onClose} variant="ghost">
          Tutup
        </ActionButton>
      }
    >
      <div className="grid gap-4">
        <Field label="Catatan Verifikasi / Penolakan">
          <textarea
            className={`${inputClass} min-h-28 py-2`}
            disabled={working}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Isi catatan jika diperlukan. Catatan wajib untuk penolakan."
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          <ActionButton
            disabled={working}
            icon={CheckCircle2}
            onClick={onVerify}
          >
            Verifikasi
          </ActionButton>

          <ActionButton
            disabled={working}
            icon={XCircle}
            onClick={onReject}
            variant="danger"
          >
            Tolak
          </ActionButton>

          <ActionButton
            disabled={working}
            onClick={onOpenDetail}
            variant="secondary"
          >
            Buka Detail
          </ActionButton>
        </div>
      </div>
    </SectionCard>
  );
}
