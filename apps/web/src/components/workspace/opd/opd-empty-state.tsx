import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/workspace/ui';

export function OpdEmptyState({
  title = 'Belum ada data OPD',
  description = 'Data akan tampil setelah OPD membuat draft, mengunggah dokumen, atau menerima catatan verifikasi.',
}: {
  title?: string;
  description?: string;
}) {
  return <EmptyState icon={Inbox} title={title} description={description} />;
}
