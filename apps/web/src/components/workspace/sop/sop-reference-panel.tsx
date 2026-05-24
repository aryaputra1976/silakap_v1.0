import { BookOpen, Filter } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '@/components/workspace/ui';
import { dmsSubCategoryLabel } from '@/lib/api/dms';
import {
  canAccessSopDocument,
  getSopDmsMappingsByModule,
  SOP_DMS_MAPPINGS,
  SOP_DMS_CATEGORIES,
  SOP_MODULE_KEYS,
  SOP_MODULE_LABELS,
  sopAccessLevelLabel,
  sopCategoryLabel,
  type SopDmsMapping,
  type SopDmsAccessLevel,
  type SopModuleKey,
} from '@/lib/dms/sop-taxonomy';
import type { AppRole } from '@/lib/rbac/roles';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SopReferencePanelProps {
  /** Current user role for access filtering */
  userRole?: AppRole;
  /** Pre-filter by module — omit to show all */
  moduleKey?: SopModuleKey;
  /** Compact mode hides description */
  compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SopReferencePanel({
  userRole,
  moduleKey,
  compact = false,
}: SopReferencePanelProps) {
  const [selectedModule, setSelectedModule] = useState<SopModuleKey | ''>(
    moduleKey ?? '',
  );
  const [selectedCategory, setSelectedCategory] = useState('');

  const baseMappings = selectedModule
    ? getSopDmsMappingsByModule(selectedModule)
    : SOP_DMS_MAPPINGS;

  const filtered = baseMappings.filter((item) => {
    if (selectedCategory && item.dmsSubCategory !== selectedCategory) {
      return false;
    }
    if (userRole && !canAccessSopDocument(userRole, item.sopCode)) {
      return false;
    }
    return true;
  });

  const visibleCategories = [
    ...new Set(baseMappings.map((item) => item.dmsSubCategory)),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[#18343a]">
          <BookOpen className="h-4 w-4" />
          <span>Referensi SOP BKPSDM</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} SOP ditampilkan
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Filter:</span>
        </div>

        {!moduleKey ? (
          <select
            className="rounded border border-border bg-background px-2 py-1 text-xs"
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value as SopModuleKey | '');
              setSelectedCategory('');
            }}
          >
            <option value="">Semua Modul</option>
            {SOP_MODULE_KEYS.map((key) => (
              <option key={key} value={key}>
                {SOP_MODULE_LABELS[key]}
              </option>
            ))}
          </select>
        ) : null}

        <select
          className="rounded border border-border bg-background px-2 py-1 text-xs"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Semua Kategori</option>
          {visibleCategories.map((cat) => (
            <option key={cat} value={cat}>
              {dmsSubCategoryLabel(cat)}
            </option>
          ))}
        </select>
      </div>

      {/* SOP list grouped by category */}
      {filtered.length === 0 ? (
        <p className="rounded-lg border border-border bg-zinc-50 px-4 py-6 text-center text-sm text-muted-foreground">
          Tidak ada SOP yang dapat ditampilkan untuk peran dan filter yang dipilih.
        </p>
      ) : (
        <SopGroupedList
          mappings={filtered}
          compact={compact}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">Access level:</span>
        {(
          [
            'PUBLIC_INTERNAL',
            'BIDANG_PPIK',
            'CONFIDENTIAL',
            'LEADERSHIP_ONLY',
            'ADMIN_ONLY',
          ] as SopDmsAccessLevel[]
        ).map((level) => (
          <StatusBadge
            key={level}
            value={sopAccessLevelLabel(level)}
            tone={accessLevelTone(level)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Grouped list ─────────────────────────────────────────────────────────────

function SopGroupedList({
  mappings,
  compact,
}: {
  mappings: SopDmsMapping[];
  compact: boolean;
}) {
  const grouped = new Map<string, SopDmsMapping[]>();

  for (const item of mappings) {
    const key = item.dmsSubCategory;
    const existing = grouped.get(key) ?? [];
    existing.push(item);
    grouped.set(key, existing);
  }

  const orderedKeys = SOP_DMS_CATEGORIES.filter((cat) => grouped.has(cat));
  const remainingKeys = [...grouped.keys()].filter(
    (k) => !SOP_DMS_CATEGORIES.includes(k as never),
  );

  return (
    <div className="space-y-4">
      {[...orderedKeys, ...remainingKeys].map((cat) => (
        <div key={cat}>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {sopCategoryLabel(cat as never) ?? dmsSubCategoryLabel(cat)}
          </h4>
          <div className="space-y-2">
            {(grouped.get(cat) ?? []).map((item) => (
              <SopReferenceRow
                key={item.sopCode}
                item={item}
                compact={compact}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function SopReferenceRow({
  item,
  compact,
}: {
  item: SopDmsMapping;
  compact: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 rounded bg-[#e8f2e4] px-1.5 py-0.5 font-mono text-xs font-semibold text-[#2e6b3e]">
              {item.sopCode}
            </span>
            <span className="text-sm font-medium text-zinc-900">
              {item.title}
            </span>
          </div>
          {!compact && item.description ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {item.description}
            </p>
          ) : null}
          {!compact ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#cfe1da] bg-[#f4f8ef] px-1.5 py-0.5 text-xs text-[#51614c]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge
            value={sopAccessLevelLabel(item.accessLevel)}
            tone={accessLevelTone(item.accessLevel)}
          />
          <span className="text-xs text-muted-foreground">
            {SOP_MODULE_LABELS[item.moduleKey]}
          </span>
        </div>
      </div>
      {item.relatedRhkCodes && item.relatedRhkCodes.length > 0 ? (
        <div className="mt-1.5 text-xs text-muted-foreground">
          RHK: {item.relatedRhkCodes.join(', ')}
        </div>
      ) : null}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function accessLevelTone(
  level: SopDmsAccessLevel,
): 'neutral' | 'warning' | 'danger' | 'info' | 'dark' {
  switch (level) {
    case 'PUBLIC_INTERNAL':
      return 'neutral';
    case 'BIDANG_PPIK':
      return 'warning';
    case 'CONFIDENTIAL':
      return 'danger';
    case 'LEADERSHIP_ONLY':
      return 'info';
    case 'ADMIN_ONLY':
      return 'dark';
  }
}
