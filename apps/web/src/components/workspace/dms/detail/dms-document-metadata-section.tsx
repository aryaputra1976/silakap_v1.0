import { BookOpen, Edit3, Save } from 'lucide-react';
import { ActionButton, SectionCard, StatusBadge } from '@/components/workspace/ui';
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
import {
  getSopDmsMappingByCode,
  isSopSubCategory,
  sopAccessLevelLabel,
  SOP_MODULE_LABELS,
} from '@/lib/dms/sop-taxonomy';

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
        <>
          <DmsMetadataView document={document} />
          {isSopSubCategory(document.subCategory ?? '') ? (
            <SopMetadataPanel document={document} />
          ) : null}
        </>
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

function SopMetadataPanel({ document }: { document: DmsDocument }) {
  const tagsArray = Array.isArray(document.tags)
    ? document.tags.map((t) => String(t))
    : [];
  const sopCode = tagsArray.find((t) => t.startsWith('SOP-BKPSDM-'));
  const mapping = sopCode ? getSopDmsMappingByCode(sopCode) : undefined;

  return (
    <div className="mt-4 rounded-lg border border-[#d8e5d3] bg-[#fbfdf8] p-4">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#2e6b3e]" />
        <span className="text-sm font-semibold text-[#173c36]">
          Metadata SOP
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <SopMeta
          label="Kode SOP"
          value={sopCode ?? dmsSubCategoryLabel(document.subCategory ?? '')}
        />
        {mapping ? (
          <>
            <SopMeta
              label="Modul Terkait"
              value={SOP_MODULE_LABELS[mapping.moduleKey]}
            />
            <SopMeta
              label="Subkategori SOP"
              value={dmsSubCategoryLabel(mapping.dmsSubCategory)}
            />
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                Access Level SOP
              </p>
              <StatusBadge
                value={sopAccessLevelLabel(mapping.accessLevel)}
                tone={
                  mapping.accessLevel === 'CONFIDENTIAL'
                    ? 'danger'
                    : mapping.accessLevel === 'LEADERSHIP_ONLY'
                      ? 'info'
                      : mapping.accessLevel === 'ADMIN_ONLY'
                        ? 'dark'
                        : mapping.accessLevel === 'BIDANG_PPIK'
                          ? 'warning'
                          : 'neutral'
                }
              />
            </div>
            {mapping.relatedRhkCodes && mapping.relatedRhkCodes.length > 0 ? (
              <SopMeta
                label="RHK Terkait"
                value={mapping.relatedRhkCodes.join(', ')}
              />
            ) : null}
            {mapping.description ? (
              <div className="md:col-span-2">
                <SopMeta label="Deskripsi SOP" value={mapping.description} />
              </div>
            ) : null}
          </>
        ) : (
          <SopMeta
            label="Subkategori"
            value={dmsSubCategoryLabel(document.subCategory ?? '')}
          />
        )}
      </div>
    </div>
  );
}

function SopMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-zinc-900">{value}</p>
    </div>
  );
}
