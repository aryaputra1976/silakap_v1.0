import { useLocation, useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { SectionCard } from '@/components/workspace/ui';
import {
  SOP_WORKSPACE_NAV_ITEMS,
  getSopWorkspacePageLabel,
} from '@/lib/sop/sop-ui';

export function SopWorkspaceNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <SectionCard
      title="Navigasi Kinerja Bidang"
      description={`Posisi saat ini: ${getSopWorkspacePageLabel(pathname)}`}
      className="no-print"
    >
      <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3">
        {SOP_WORKSPACE_NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              className={`group min-w-0 rounded-lg border p-4 text-left transition ${
                active
                  ? 'border-[#0f766e] bg-[#e7f6f5] shadow-sm'
                  : 'border-[#d8e5d3] bg-white hover:-translate-y-0.5 hover:border-[#9bc9bf] hover:bg-[#fbfdf8] hover:shadow-sm'
              }`}
              onClick={() => navigate(item.path)}
              type="button"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div
                  className={`flex size-9 items-center justify-center rounded-lg border ${
                    active
                      ? 'border-[#0f766e] bg-[#0f766e] text-white'
                      : 'border-[#d8e5d3] bg-[#f5faf1] text-[#0f766e]'
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <ChevronRight className="size-4 text-[#7a8b74] transition group-hover:translate-x-0.5" />
              </div>

              <div className="break-words font-semibold text-[#173c36]">{item.title}</div>
              <p className="mt-1 line-clamp-3 text-xs leading-5 text-[#6d7e68]">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
