import { StatusBadge } from '@/components/workspace/ui';
import {
  opdSubmissionStatusLabel,
  opdSubmissionStatusTone,
  type OpdSubmissionStatus,
} from '@/lib/opd-submissions/types';

export function ServiceStatusBadge({
  status,
}: {
  status: OpdSubmissionStatus | string;
}) {
  return (
    <StatusBadge
      value={opdSubmissionStatusLabel(status)}
      tone={opdSubmissionStatusTone(status)}
    />
  );
}
