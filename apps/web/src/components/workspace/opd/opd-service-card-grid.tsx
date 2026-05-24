import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { OpdServiceCard } from '@/lib/opd/opd-portal-data';

export function OpdServiceCardGrid({ items }: { items: OpdServiceCard[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className="group rounded-lg border border-[#cfe1da] bg-white p-4 transition hover:border-[#9cc7bd] hover:bg-[#eef8f6]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#cfe1da] bg-[#fbfdf8] text-[#0e7c86]">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#18343a]">
                    {item.title}
                  </div>
                  <p className="mt-1 text-sm leading-5 text-[#687967]">
                    {item.description}
                  </p>
                </div>
              </div>
              <ArrowRight className="mt-1 size-4 shrink-0 text-[#7f9278] transition group-hover:translate-x-0.5 group-hover:text-[#0e7c86]" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
