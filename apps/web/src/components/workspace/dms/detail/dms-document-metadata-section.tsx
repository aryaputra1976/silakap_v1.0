import { Edit3, Save } from 'lucide-react';
import { ActionButton, SectionCard } from '@/components/workspace/ui';
import {
  dmsAccessLevelLabel,
  dmsCategoryLabel,
  dmsSubCategoryLabel,
  type DmsDocument,
} from '@/lib/api/dms';
import {
  DmsMetadataForm,
  type DmsMetadataFormValue,
} from '@/components/workspace/dms/dms-metadata-form';

export function DmsDocumentMetadataSection({
  document,
  form,
  editMode,
  working,
  canEdit,
  onCancel,
  onEdit,
  onFormChange,
  onSave,
}: {
  document: DmsDocument;
  form: DmsMetadataFormValue;
  editMode: boolean;
  working: boolean;
  canEdit: boolean;
  onCancel: () => void;
  onEdit: () => void;
  onFormChange: (value: DmsMetadataFormValue) => void;
  onSave: () => void;
}) {
  return (
    <SectionCard
      title="Metadata Dokumen"
      description="Informasi utama yang digunakan untuk pencarian, klasifikasi, dan pelaporan."
      actions={
        canEdit ? (
          editMode ? (
            <>
              <ActionButton disabled={working} onClick={onCancel} variant="secondary">
                Batal
              </ActionButton>
              <ActionButton disabled={working} icon={Save} onClick={onSave}>
                Simpan Metadata
              </ActionButton>
            </>
          ) : (
            <ActionButton
              disabled={working}
              icon={Edit3}
              onClick={onEdit}
              variant="secondary"
            >
              Edit Metadata
            </ActionButton>
          )
        ) : null
      }
    >
      {editMode ? (
        <DmsMetadataForm
          disabled={working}
          value={form}
          onChange={onFormChange}
        />
      ) : (
        <DmsMetadataView document={document} />
      )}
    </SectionCard>
  );
}

function DmsMetadataView({ document }: { document: DmsDocument }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Meta label="Judul" value={document.title} />
      <Meta label="Kategori" value={dmsCategoryLabel(document.category)} />
      <Meta
        label="Subkategori"
        value={document.subCategory ? dmsSubCategoryLabel(document.subCategory) : '-'}
      />
      <Meta
        label="Level Akses"
        value={dmsAccessLevelLabel(document.accessLevel ?? 'INTERNAL')}
      />
      <Meta label="Status" value={document.status} />
      <Meta label="Tahun" value={document.periodYear?.toString() ?? '-'} />
      <Meta label="Bulan" value={document.periodMonth?.toString() ?? '-'} />
      <Meta label="Triwulan" value={document.periodQuarter?.toString() ?? '-'} />
      <div className="md:col-span-2">
        <Meta label="Deskripsi" value={document.description ?? '-'} />
      </div>
      <div className="md:col-span-2">
        <Meta label="Tags" value={formatTags(document.tags)} />
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-zinc-50/60 p-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-medium text-zinc-900">
        {value}
      </div>
    </div>
  );
}

function formatTags(tags: DmsDocument['tags']) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return '-';
  }

  return tags.map((item) => String(item)).join(', ');
}
