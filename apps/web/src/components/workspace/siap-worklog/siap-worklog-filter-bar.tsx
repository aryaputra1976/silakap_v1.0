import { RefreshCcw } from 'lucide-react';
import type { SiapWorklogStatus } from '@/lib/api/types';
import {
  ActionButton,
  FilterBar,
  inputClass,
  Toolbar,
} from '@/components/workspace/ui';
import { worklogStatusLabel } from '@/lib/siap/siap-labels';

const worklogStatuses: SiapWorklogStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'REVISION_REQUIRED',
  'APPROVED',
  'REJECTED',
];

export function SiapWorklogFilterBar({
  q,
  status,
  onQChange,
  onStatusChange,
  onApply,
}: {
  q: string;
  status: string;
  onQChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onApply: () => void;
}) {
  return (
    <Toolbar>
      <FilterBar>
        <input
          className={inputClass}
          placeholder="Cari kegiatan, hasil, atau kendala"
          value={q}
          onChange={(event) => onQChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onApply();
            }
          }}
        />

        <select
          className={inputClass}
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="">Semua status</option>
          {worklogStatuses.map((item) => (
            <option key={item} value={item}>
              {worklogStatusLabel(item)}
            </option>
          ))}
        </select>

        <ActionButton icon={RefreshCcw} onClick={onApply} variant="secondary">
          Terapkan Filter
        </ActionButton>
      </FilterBar>
    </Toolbar>
  );
}
