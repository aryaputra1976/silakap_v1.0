import { useState } from 'react';
import { ChevronRight, Folder, FolderOpen, Files } from 'lucide-react';
import {
  type DmsFolderNode,
  type DmsFolderTree,
  dmsCategoryLabel,
} from '@/lib/api/dms';

export interface DmsFolderSelection {
  unitKerjaId?: string;
  unitKerjaNama?: string;
  year?: number;
  category?: string;
}

interface Props {
  tree: DmsFolderTree;
  selection: DmsFolderSelection;
  onSelect: (sel: DmsFolderSelection) => void;
}

export function DmsFolderSidebar({ tree, selection, onSelect }: Props) {
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  function toggleUnit(key: string) {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleYear(key: string) {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const isAllSelected =
    !selection.unitKerjaId && !selection.year && !selection.category;

  return (
    <nav className="w-56 shrink-0 select-none">
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Folder
      </p>

      {/* Semua Dokumen */}
      <button
        type="button"
        onClick={() => onSelect({})}
        className={[
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          isAllSelected
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-foreground hover:bg-muted',
        ].join(' ')}
      >
        <Files className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-left">Semua Dokumen</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {tree.grandTotal}
        </span>
      </button>

      <div className="mt-1 space-y-0.5">
        {tree.nodes.map((node) => (
          <UnitNode
            key={node.unitKerjaId ?? '__shared__'}
            node={node}
            selection={selection}
            expanded={expandedUnits.has(node.unitKerjaId ?? '__shared__')}
            expandedYears={expandedYears}
            onToggleUnit={() => toggleUnit(node.unitKerjaId ?? '__shared__')}
            onToggleYear={(key) => toggleYear(key)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </nav>
  );
}

interface UnitNodeProps {
  node: DmsFolderNode;
  selection: DmsFolderSelection;
  expanded: boolean;
  expandedYears: Set<string>;
  onToggleUnit: () => void;
  onToggleYear: (key: string) => void;
  onSelect: (sel: DmsFolderSelection) => void;
}

function UnitNode({
  node,
  selection,
  expanded,
  expandedYears,
  onToggleUnit,
  onToggleYear,
  onSelect,
}: UnitNodeProps) {
  const unitKey = node.unitKerjaId ?? '__shared__';
  const isUnitSelected =
    selection.unitKerjaId === node.unitKerjaId && !selection.year && !selection.category;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          onToggleUnit();
          onSelect({
            unitKerjaId: node.unitKerjaId ?? undefined,
            unitKerjaNama: node.unitKerjaNama ?? undefined,
          });
        }}
        className={[
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors',
          isUnitSelected
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-foreground hover:bg-muted',
        ].join(' ')}
      >
        <ChevronRight
          className={['h-3.5 w-3.5 shrink-0 transition-transform', expanded ? 'rotate-90' : ''].join(' ')}
        />
        {expanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-amber-500" />
        )}
        <span className="flex-1 truncate text-left">{node.unitKerjaNama}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{node.total}</span>
      </button>

      {expanded && (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border pl-2">
          {node.years.map((yearNode) => {
            const yearLabel = yearNode.year != null ? String(yearNode.year) : 'Lainnya';
            const yearKey = `${unitKey}-${yearLabel}`;
            const isYearExpanded = expandedYears.has(yearKey);
            const isYearSelected =
              selection.unitKerjaId === node.unitKerjaId &&
              selection.year === yearNode.year &&
              !selection.category;

            return (
              <div key={yearKey}>
                <button
                  type="button"
                  onClick={() => {
                    onToggleYear(yearKey);
                    onSelect({
                      unitKerjaId: node.unitKerjaId ?? undefined,
                      unitKerjaNama: node.unitKerjaNama ?? undefined,
                      year: yearNode.year ?? undefined,
                    });
                  }}
                  className={[
                    'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors',
                    isYearSelected
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-foreground hover:bg-muted',
                  ].join(' ')}
                >
                  <ChevronRight
                    className={[
                      'h-3 w-3 shrink-0 transition-transform',
                      isYearExpanded ? 'rotate-90' : '',
                    ].join(' ')}
                  />
                  <span className="flex-1 text-left">{yearLabel}</span>
                  <span className="text-xs text-muted-foreground">{yearNode.total}</span>
                </button>

                {isYearExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">
                    {yearNode.categories.map((cat) => {
                      const isCatSelected =
                        selection.unitKerjaId === node.unitKerjaId &&
                        selection.year === yearNode.year &&
                        selection.category === cat.category;

                      return (
                        <button
                          key={cat.category}
                          type="button"
                          onClick={() =>
                            onSelect({
                              unitKerjaId: node.unitKerjaId ?? undefined,
                              unitKerjaNama: node.unitKerjaNama ?? undefined,
                              year: yearNode.year ?? undefined,
                              category: cat.category,
                            })
                          }
                          className={[
                            'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
                            isCatSelected
                              ? 'bg-primary/10 font-medium text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          ].join(' ')}
                        >
                          <span className="flex-1 truncate text-left">
                            {dmsCategoryLabel(cat.category)}
                          </span>
                          <span>{cat.count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
