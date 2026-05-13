import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/api/client';
import {
  dmsApi,
  type DmsDocument,
  type DmsDocumentListResponse,
} from '@/lib/api/dms';
import { ErrorAlert } from '@/components/workspace/ui';
import { DmsVerificationHeader } from '@/components/workspace/dms/verification/dms-verification-header';
import { DmsVerificationSection } from '@/components/workspace/dms/verification/dms-verification-section';
import { DmsVerificationSummary } from '@/components/workspace/dms/verification/dms-verification-summary';

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
      await dmsApi.rejectDocument(selected.id, { note });

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
      <DmsVerificationHeader
        totalWaiting={data?.total ?? 0}
        loading={loading}
        onRefresh={() => void loadDocuments()}
      />

      {error ? <ErrorAlert message={error} /> : null}

      {selected ? (
        <DmsVerificationSummary
          note={note}
          selected={selected}
          working={working}
          onClose={() => {
            setSelected(null);
            setNote('');
          }}
          onNoteChange={setNote}
          onOpenDetail={() => navigate(`/dms/documents/${selected.id}`)}
          onReject={() => void rejectDocument()}
          onVerify={() => void verifyDocument()}
        />
      ) : null}

      <DmsVerificationSection
        documents={documents}
        loading={loading}
        onSelectDocument={setSelected}
      />
    </div>
  );
}
