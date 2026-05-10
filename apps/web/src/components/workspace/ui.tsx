import type { ChangeEvent, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileUp,
  Loader2,
  Upload,
} from 'lucide-react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'dark';

const toneClass: Record<Tone, string> = {
  neutral: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  dark: 'border-zinc-800 bg-zinc-900 text-white',
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function badgeTone(value: string | null | undefined): Tone {
  const normalized = (value ?? '').toUpperCase();

  if (
    normalized.includes('COMPLETED') ||
    normalized.includes('UPLOADED') ||
    normalized.includes('ACTIVE') ||
    normalized.includes('AKTIF') ||
    normalized.includes('CONNECTED')
  ) {
    return 'success';
  }

  if (
    normalized.includes('DRAFT') ||
    normalized.includes('ASSIGNED') ||
    normalized.includes('IN_PROGRESS') ||
    normalized.includes('SUBMITTED') ||
    normalized.includes('MISSING') ||
    normalized.includes('PENDING')
  ) {
    return 'warning';
  }

  if (
    normalized.includes('OVERDUE') ||
    normalized.includes('CANCELLED') ||
    normalized.includes('FAILED') ||
    normalized.includes('REJECTED') ||
    normalized.includes('ERROR')
  ) {
    return 'danger';
  }

  if (normalized.includes('SUPER_ADMIN') || normalized.includes('ADMIN') || normalized.includes('KABID')) {
    return 'dark';
  }

  if (normalized.includes('BUP') || normalized.includes('APS') || normalized.includes('SIPENSIUN')) {
    return 'info';
  }

  return 'neutral';
}

export function PageHeader({
  title,
  description,
  meta,
  actions,
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/80 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {meta ? <div className="mb-2 flex flex-wrap gap-2">{meta}</div> : null}
        <h1 className="truncate text-2xl font-semibold tracking-normal text-zinc-950">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-border bg-white shadow-sm shadow-zinc-200/40', className)}>
      {(title || description || actions) ? (
        <div className="flex flex-col gap-3 border-b border-border/80 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-semibold uppercase tracking-normal text-zinc-900">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm shadow-zinc-200/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-zinc-950">{value}</div>
        </div>
        {Icon ? (
          <div className={cn('flex size-10 items-center justify-center rounded-lg border', toneClass[tone])}>
            <Icon className="size-5" />
          </div>
        ) : null}
      </div>
      {description ? <p className="mt-3 text-sm leading-5 text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function StatusBadge({ value, tone }: { value: string | null | undefined; tone?: Tone }) {
  const normalized = value ?? 'UNKNOWN';
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold', toneClass[tone ?? badgeTone(normalized)])}>
      {normalized}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return <StatusBadge value={role.replaceAll('_', ' ')} tone={badgeTone(role)} />;
}

export function WorkflowBadge({ value }: { value: string | null | undefined }) {
  return <StatusBadge value={value} tone={badgeTone(value)} />;
}

export function SlaBadge({ dueDate, status }: { dueDate?: string | null; status?: string | null }) {
  if (!dueDate) {
    return <StatusBadge value={status ?? 'NO SLA'} tone="neutral" />;
  }

  const overdue = new Date(dueDate).getTime() < Date.now() && status !== 'COMPLETED';
  return <StatusBadge value={overdue ? 'OVERDUE' : `DUE ${formatDate(dueDate)}`} tone={overdue ? 'danger' : 'info'} />;
}

export function LoadingState({ label = 'Memuat data' }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 rounded-lg border border-border bg-white text-sm text-muted-foreground shadow-sm">
      <Loader2 className="size-5 animate-spin text-zinc-500" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/70 p-8 text-center">
      {Icon ? (
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500">
          <Icon className="size-5" />
        </div>
      ) : null}
      <div className="font-semibold text-zinc-900">{title}</div>
      {description ? <div className="mt-1 text-sm text-muted-foreground">{description}</div> : null}
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function DataTable<T>({
  items,
  columns,
  empty,
  rowKey,
}: {
  items: T[];
  columns: Array<{
    key: string;
    header: string;
    render: (item: T) => ReactNode;
    className?: string;
  }>;
  empty: string;
  rowKey?: (item: T, index: number) => string;
}) {
  if (items.length === 0) {
    return <EmptyState title={empty} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm shadow-zinc-200/40">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-border bg-zinc-50 text-xs font-semibold uppercase tracking-normal text-zinc-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cn('px-4 py-3', column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item, index) => (
              <tr key={rowKey ? rowKey(item, index) : index} className="bg-white transition-colors hover:bg-zinc-50/80">
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3.5 align-top text-zinc-700', column.className)}>
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ActionButton({
  children,
  icon: Icon,
  variant = 'primary',
  disabled,
  type = 'button',
  onClick,
}: {
  children: ReactNode;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}) {
  const variantClass = {
    primary: 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800',
    secondary: 'border-border bg-white text-zinc-800 hover:bg-zinc-50',
    danger: 'border-rose-600 bg-rose-600 text-white hover:bg-rose-700',
    ghost: 'border-transparent bg-transparent text-zinc-700 hover:bg-zinc-100',
  };

  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-55',
        variantClass[variant],
      )}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {Icon ? <Icon className="size-4" /> : null}
      {children}
    </button>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm shadow-zinc-200/40 md:flex-row md:items-center md:justify-between">
      {children}
    </div>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="grid w-full gap-3 md:grid-cols-3">{children}</div>;
}

export function Timeline({
  items,
  empty = 'Belum ada timeline',
}: {
  items: Array<{
    id: string;
    title: string;
    description?: string | null;
    type?: string | null;
    timestamp?: string | null;
    actor?: string | null;
  }>;
  empty?: string;
}) {
  if (items.length === 0) {
    return <EmptyState title={empty} />;
  }

  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <div key={item.id} className="grid grid-cols-[24px_1fr] gap-3">
          <div className="flex flex-col items-center">
            <div className="mt-1 flex size-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500">
              {index === 0 ? <Clock3 className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </div>
            {index < items.length - 1 ? <div className="h-full min-h-8 w-px bg-border" /> : null}
          </div>
          <div className="pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold text-zinc-900">{item.title}</div>
              {item.type ? <StatusBadge value={item.type} /> : null}
            </div>
            {item.description ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {item.timestamp ? <span>{formatDateTime(item.timestamp)}</span> : null}
              {item.actor ? <span>oleh {item.actor}</span> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChecklistItem({
  label,
  documentType,
  category,
  required,
  digital,
  uploaded,
  notes,
  actions,
}: {
  label: string;
  documentType: string;
  category?: string;
  required?: boolean;
  digital?: boolean;
  uploaded: boolean;
  notes?: string | null;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {uploaded ? <CheckCircle2 className="size-4 text-emerald-600" /> : <AlertCircle className="size-4 text-amber-600" />}
          <div className="font-semibold text-zinc-900">{label}</div>
          <StatusBadge value={uploaded ? 'UPLOADED' : 'MISSING'} tone={uploaded ? 'success' : 'warning'} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{documentType}</span>
          {category ? <span>{category}</span> : null}
          <span>{required ? 'Wajib' : 'Opsional'}</span>
          <span>{digital ? 'Digital' : 'Fisik'}</span>
        </div>
        {notes ? <p className="mt-2 text-sm text-muted-foreground">{notes}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function FileUploadButton({
  onSelect,
  disabled,
  label = 'Upload',
}: {
  onSelect: (file: File) => void;
  disabled?: boolean;
  label?: string;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onSelect(file);
    }
    event.currentTarget.value = '';
  }

  return (
    <label
      className={cn(
        'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50',
        disabled && 'pointer-events-none cursor-not-allowed opacity-55',
      )}
    >
      <Upload className="size-4" />
      {label}
      <input
        className="sr-only"
        disabled={disabled}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        onChange={handleChange}
      />
    </label>
  );
}

export function DownloadButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <ActionButton disabled={disabled} icon={Download} onClick={onClick} variant="secondary">
      Download
    </ActionButton>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-semibold text-zinc-800">{label}</span>
      {children}
    </label>
  );
}

export function FileMeta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-zinc-900">{value}</div>
    </div>
  );
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(value: number | null | undefined) {
  if (!value) {
    return '-';
  }
  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export const inputClass =
  'h-10 rounded-md border border-input bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500';

export const buttonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-900 bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-55';

export const secondaryButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-55';

export const uploadIcon = FileUp;
