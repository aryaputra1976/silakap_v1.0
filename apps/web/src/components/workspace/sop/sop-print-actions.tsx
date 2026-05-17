import { Printer } from 'lucide-react';
import { ActionButton } from '@/components/workspace/ui';

export function SopPrintActions() {
  return (
    <div className="flex flex-wrap gap-2 no-print">
      <ActionButton icon={Printer} onClick={() => window.print()}>
        Cetak
      </ActionButton>
    </div>
  );
}
