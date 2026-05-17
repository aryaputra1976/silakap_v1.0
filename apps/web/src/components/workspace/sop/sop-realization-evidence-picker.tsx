import { useEffect, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import {
  ActionButton,
  DataTable,
  ErrorAlert,
  Field,
  LoadingState,
  SectionCard,
  StatusBadge,
  inputClass,
} from '@/components/workspace/ui';
import {
  DMS_DOCUMENT_CATEGORIES,
  DMS_DOCUMENT_STATUSES,
  dmsApi,
  dmsCategoryLabel,
  dmsStatusLabel,
  type DmsDocument,
  type DmsDocumentCategory,
  type DmsDocumentStatus,
} from '@/lib/api/dms';
import { ApiError } from '@/lib/api/client';
import type { SopEvidenceInputPayload } from '@/lib/api/kinerja-bidang';

export interface SopEvidenceFormValue extends SopEvidenceInputPayload {
  documentTitle?: string;
  originalFileName?: string | null;
  status?: string;
}

interface EvidenceSearchFilter {
  q: string;
  year: string;
  category: DmsDocumentCategory | '';
  status: DmsDocumentStatus | '';
}

const initialFilter: EvidenceSearchFilter = {
  q: '',
  year: String(new Date().getFullYear()),
  category: 'BUKTI_DUKUNG',
  status: '',
};

export function SopRealizationEvidencePicker({
  value,
  disabled,
  onChange,
}: {
  value: SopEvidenceFormValue[];
  disabled?: boolean;
  onChange: (value: SopEvidenceFormValue[]) => void;
}) {
  const [filter, setFilter] = useState<EvidenceSearchFilter>(initialFilter);
  const [documents, setDocuments] = useState<DmsDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateFilter<K extends keyof EvidenceSearchFilter>(
    key: K,
    nextValue: EvidenceSearchFilter[K],
  ) {
    setFilter((current) => ({
      ...current,
      [key]: nextValue,
    }));
  }

  async function loadDocuments() {
    setLoading(true);
    setError('');

    try {
      const result = await dmsApi.listDocuments({
        q: filter.q,
        year: filter.year,
        category: filter.category,
        status: filter.status,
        page: 1,
        limit: 20,
      });

      setDocuments(result.items);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat dokumen DMS',
      );
    } finally {
      setLoading(false);
    }
  }

  function isSelected(documentId: string) {
    return value.some((item) => item.dmsDocumentId === documentId);
  }

  function addDocument(document: DmsDocument) {
    if (isSelected(document.id)) {
      return;
    }

    onChange([
      ...value,
      {
        dmsDocumentId: document.id,
        label: document.title,
        description: document.description ?? undefined,
        isPrimary: value.length === 0,
        documentTitle: document.title,
        originalFileName: document.originalFileName,
        status: document.status,
      },
    ]);
  }

  function removeDocument(documentId: string) {
    const nextValue = value.filter((item) => item.dmsDocumentId !== documentId);

    if (nextValue.length > 0 && !nextValue.some((item) => item.isPrimary)) {
      nextValue[0] = {
        ...nextValue[0],
        isPrimary: true,
      };
    }

    onChange(nextValue);
  }

  function setPrimary(documentId: string) {
    onChange(
      value.map((item) => ({
        ...item,
        isPrimary: item.dmsDocumentId === documentId,
      })),
    );
  }

  useEffect(() => {
    void loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SectionCard
      title="Bukti Dukung DMS"
      description="Pilih dokumen DMS yang menjadi bukti dukung realisasi SOP/RHK."
      actions={
        <ActionButton
          variant="secondary"
          icon={Search}
          disabled={disabled || loading}
          onClick={() => void loadDocuments()}
        >
          Cari Dokumen
        </ActionButton>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Cari Dokumen">
            <input
              className={inputClass}
              disabled={disabled || loading}
              placeholder="Judul, tag SOP/RHK, atau kata kunci"
              value={filter.q}
              onChange={(event) => updateFilter('q', event.target.value)}
            />
          </Field>

          <Field label="Tahun">
            <input
              className={inputClass}
              disabled={disabled || loading}
              inputMode="numeric"
              maxLength={4}
              value={filter.year}
              onChange={(event) => updateFilter('year', event.target.value)}
            />
          </Field>

          <Field label="Kategori">
            <select
              className={inputClass}
              disabled={disabled || loading}
              value={filter.category}
              onChange={(event) =>
                updateFilter(
                  'category',
                  event.target.value as DmsDocumentCategory | '',
                )
              }
            >
              <option value="">Semua kategori</option>
              {DMS_DOCUMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {dmsCategoryLabel(category)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              className={inputClass}
              disabled={disabled || loading}
              value={filter.status}
              onChange={(event) =>
                updateFilter(
                  'status',
                  event.target.value as DmsDocumentStatus | '',
                )
              }
            >
              <option value="">Semua status</option>
              {DMS_DOCUMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {dmsStatusLabel(status)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {error ? <ErrorAlert message={error} /> : null}

        <div className="grid gap-5 xl:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase text-[#173c36]">
              Hasil Pencarian DMS
            </h3>

            {loading ? (
              <LoadingState label="Memuat dokumen DMS" />
            ) : (
              <DataTable<DmsDocument>
                items={documents}
                empty="Belum ada dokumen DMS sesuai filter"
                rowKey={(item) => item.id}
                columns={[
                  {
                    key: 'document',
                    header: 'Dokumen',
                    render: (item) => (
                      <div>
                        <div className="font-semibold text-[#173c36]">
                          {item.title}
                        </div>
                        <div className="mt-1 text-xs text-[#6d7e68]">
                          {item.originalFileName ?? item.fileName ?? 'Tanpa file'}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => (
                      <StatusBadge value={dmsStatusLabel(item.status)} />
                    ),
                  },
                  {
                    key: 'action',
                    header: 'Aksi',
                    className: 'text-right',
                    render: (item) => (
                      <div className="flex justify-end">
                        <ActionButton
                          variant="secondary"
                          icon={Plus}
                          disabled={disabled || isSelected(item.id)}
                          onClick={() => addDocument(item)}
                        >
                          Pilih
                        </ActionButton>
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase text-[#173c36]">
              Bukti Terpilih
            </h3>

            <DataTable<SopEvidenceFormValue>
              items={value}
              empty="Belum ada bukti dukung dipilih"
              rowKey={(item) => item.dmsDocumentId}
              columns={[
                {
                  key: 'document',
                  header: 'Dokumen',
                  render: (item) => (
                    <div>
                      <div className="font-semibold text-[#173c36]">
                        {item.documentTitle ?? item.label ?? item.dmsDocumentId}
                      </div>
                      <div className="mt-1 text-xs text-[#6d7e68]">
                        {item.originalFileName ?? '-'}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'primary',
                  header: 'Utama',
                  render: (item) => (
                    <button
                      className="rounded-md border border-[#c9d9c4] bg-white px-2 py-1 text-xs font-semibold text-[#173c36] disabled:opacity-60"
                      disabled={disabled || item.isPrimary}
                      onClick={() => setPrimary(item.dmsDocumentId)}
                      type="button"
                    >
                      {item.isPrimary ? 'Utama' : 'Jadikan Utama'}
                    </button>
                  ),
                },
                {
                  key: 'action',
                  header: 'Aksi',
                  className: 'text-right',
                  render: (item) => (
                    <div className="flex justify-end">
                      <ActionButton
                        variant="danger"
                        icon={Trash2}
                        disabled={disabled}
                        onClick={() => removeDocument(item.dmsDocumentId)}
                      >
                        Hapus
                      </ActionButton>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
