import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/workspace/ui';

type SidataPlaceholderPageProps = {
  title: string;
  description: string;
};

export function SidataPlaceholderPage({
  title,
  description,
}: SidataPlaceholderPageProps) {
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-white px-6 py-14 text-center">
        <Construction className="mb-3 size-8 text-zinc-300" />
        <p className="text-sm font-medium text-zinc-700">
          Modul dalam tahap pengembangan
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Fitur ini akan tersedia pada rilis berikutnya.
        </p>
      </div>
    </div>
  );
}
