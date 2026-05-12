import { ChangeEvent } from 'react';
import { Download, Trash2, Upload, X } from 'lucide-react';
import type { DmsDocument } from '@/lib/api/dms';
import type {
  SiapWorklog,
  SiapWorklogAttachment,
} from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  Field,
  formatDateTime,
  formatFileSize,
  inputClass,
  SectionCard,
} from '@/components/workspace/ui';
import { SiapWorklogDmsPanel } from './siap-worklog-dms-panel';

export function SiapWorklogAttachmentPanel({
  target,
  attachments,
  dmsDocuments,
  loadingDmsDocuments,
  uploading,
  label,
  description,
  onClose,
  onLabelChange,
  onDescriptionChange,
  onUpload,
  onDelete,
  onDownload,
  onRefreshDms,
  onOpenDmsUpload,
  onOpenDmsDocument,
}: {
  target: SiapWorklog;
  attachments: SiapWorklogAttachment[];
  dmsDocuments: DmsDocument[];
  loadingDmsDocuments: boolean;
  uploading: boolean;
  label: string;
  description: string;
  onClose: () => void;
  onLabelChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onUpload: (file: File) => void;
  onDelete: (attachmentId: string) => void;
  onDownload: (item: SiapWorklogAttachment) => void;
  onRefreshDms: () => void;
  onOpenDmsUpload: () => void;
  onOpenDmsDocument: (id: string) => void;
}) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      onUpload(file);
    }

    event.currentTarget.value = '';
  }

  return (
    <SectionCard
      title="Bukti Dukung Buku Kerja"
      description={target.title}
      actions={
        <ActionButton icon={X} onClick={onClose} variant="secondary">
          Tutup
        </ActionButton>
      }
    >
      <div className="grid gap-6">
        <section className="grid gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-normal text-zinc-900">
                Attachment SIARSIP Lama
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Bukti dukung lama tetap dipertahankan agar data existing tidak hilang.
              </p>
            </div>

            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50">
              <Upload className="size-4" />
              {uploading ? 'Mengunggah...' : 'Upload Bukti PDF/JPG/PNG'}
              <input
                accept="application/pdf,image/jpeg,image/png"
                className="sr-only"
                disabled={uploading}
                type="file"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Label Bukti">
              <input
                className={inputClass}
                value={label}
                onChange={(event) => onLabelChange(event.target.value)}
                placeholder="Contoh: Rekap verifikasi berkas"
              />
            </Field>

            <Field label="Deskripsi">
              <input
                className={inputClass}
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="Keterangan singkat bukti dukung"
              />
            </Field>
          </div>

          <DataTable
            items={attachments}
            rowKey={(item) => item.id}
            empty="Belum ada bukti dukung SIARSIP"
            columns={[
              {
                key: 'name',
                header: 'Bukti',
                render: (item) => (
                  <div>
                    <div className="font-semibold text-zinc-950">
                      {item.label ??
                        item.document.originalFileName ??
                        item.document.fileName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.document.mimeType ?? '-'} ·{' '}
                      {formatFileSize(item.document.fileSize)}
                    </div>
                    {item.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'date',
                header: 'Tanggal',
                render: (item) => formatDateTime(item.createdAt),
              },
              {
                key: 'actions',
                header: 'Aksi',
                render: (item) => (
                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      icon={Download}
                      onClick={() => onDownload(item)}
                      variant="secondary"
                    >
                      Download
                    </ActionButton>
                    <ActionButton
                      icon={Trash2}
                      onClick={() => onDelete(item.id)}
                      variant="danger"
                    >
                      Hapus
                    </ActionButton>
                  </div>
                ),
              },
            ]}
          />
        </section>

        <SiapWorklogDmsPanel
          documents={dmsDocuments}
          loading={loadingDmsDocuments}
          onOpenDmsDocument={onOpenDmsDocument}
          onOpenDmsUpload={onOpenDmsUpload}
          onRefresh={onRefreshDms}
        />
      </div>
    </SectionCard>
  );
}