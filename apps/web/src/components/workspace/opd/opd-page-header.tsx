import type { ReactNode } from 'react';
import { Building2 } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/workspace/ui';

export function OpdPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <PageHeader
      title={title}
      description={description}
      meta={
        <>
          <StatusBadge value="PORTAL OPD" tone="info" />
          <StatusBadge value="Data OPD Sendiri" tone="success" />
        </>
      }
      actions={actions ?? <Building2 className="size-5 text-[#587052]" />}
    />
  );
}
