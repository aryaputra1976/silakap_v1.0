import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCcw, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/api/client';
import {
  dmsApi,
  type DmsDocument,
  type DmsDocumentListResponse,
} from '@/lib/api/dms';
import {
  ActionButton,
  ErrorAlert,
  Field,
  inputClass,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from '@/components/workspace/ui';
import { DmsDocumentTable } from '@/components/workspace/dms/dms-document-table';

export function DmsVerificationPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<DmsDocumentListResponse | null>(null);
  const [selected, setSelected] = useState<DmsDocument | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  async function loadDocuments() {
    setLoading(true);
    setError('');

    try {
      const result = await dmsApi.listDocuments({
        status: 'SUBMITTED',
        page: 1,
        limit: 50,
      });

      setData(result);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memuat dokumen verifikasi',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  async function verifyDocument() {
    if (!selected) {
      return;
    }

    setWorking(true);
    setError('');

    try {
      await dmsApi.verifyDocument(selected.id, {
        note: note || undefined,
      });

      setSelected(null);
      setNote('');
      await loadDocuments();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Gagal memverifikasi dokumen',
      );
    } finally {
      setWorking(false);
    }
  }

  async function rejectDocument() {
    if (!selected) {
      return;
    }

    if (note.trim().length < 3) {
      setError('Catatan penolakan wajib diisi minimal 3 karakter');
      return;
    }

    setWorking(true);
    setError('');

    try {
      await dmsApi.rejectDocument(selected.id, {
        note,
      });

      setSelected(null);
      setNote('');
      await loadDocuments();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Gagal menolak dokumen',
      );
    } finally {
      setWorking(false);
    }
  }

  const documents = data?.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Verifikasi Dokumen DMS"
        description="Tinjau dokumen SUBMITTED dan tetapkan apakah dokumen sah sebagai bukti dukung."
        meta={<StatusBadge value={`${data?.total ?? 0} MENUNGGU`} tone="info" />}
        actions={
          <ActionButton
            disabled={loading}
            icon={RefreshCcw}
            onClick={() => void loadDocuments()}
            variant="secondary"
          >
            Refresh
          </ActionButton>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      {selected ? (
        <SectionCard
          title="Panel Verifikasi"
          description={selected.title}
          actions={
            <ActionButton
              disabled={working}
              onClick={() => {
                setSelected(null);
                setNote('');
              }}
              variant="ghost"
            >
              Tutup
            </ActionButton>
          }
        >
          <div className="grid gap-4">
            <Field label="Catatan Verifikasi / Penolakan">
              <textarea
                className={`${inputClass} min-h-28 py-2`}
                disabled={working}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Isi catatan jika diperlukan. Catatan wajib untuk penolakan."
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              <ActionButton
                disabled={working}
                icon={CheckCircle2}
                onClick={() => void verifyDocument()}
              >
                Verifikasi
              </ActionButton>

              <ActionButton
                disabled={working}
                icon={XCircle}
                onClick={() => void rejectDocument()}
                variant="danger"
              >
                Tolak
              </ActionButton>

              <ActionButton
                disabled={working}
                onClick={() => navigate(`/dms/documents/${selected.id}`)}
                variant="secondary"
              >
                Buka Detail
              </ActionButton>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Dokumen Menunggu Verifikasi"
        description="Klik buka untuk melihat detail, atau pilih dokumen untuk proses cepat."
      >
        {loading ? (
          <LoadingState label="Memuat dokumen menunggu verifikasi" />
        ) : (
          <div className="space-y-4">
            <DmsDocumentTable
              documents={documents}
              onOpenDocument={(id) => {
                const document = documents.find((item) => item.id === id);
                if (document) {
                  setSelected(document);
                }
              }}
            />
          </div>
        )}
      </SectionCard>
    </div>
  );
}