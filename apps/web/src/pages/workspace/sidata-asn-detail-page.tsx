import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, FilePlus2 } from 'lucide-react';
import { ApiError, apiClient } from '@/lib/api/client';
import { sidataApi } from '@/lib/api/sidata';
import type { AsnRecord, SipensiunCaseDetail } from '@/lib/api/types';
import {
  ActionButton,
  ErrorAlert,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/workspace/ui';

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex gap-3 border-b border-zinc-100 py-2.5 last:border-0">
      <span className="w-40 shrink-0 text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-zinc-900">{value || '-'}</span>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">{title}</h3>
      {children}
    </div>
  );
}

export function SidataAsnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [asn, setAsn] = useState<AsnRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingId, setCreatingId] = useState('');

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setError('ID ASN tidak valid');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    sidataApi
      .getAsnById(id)
      .then((result) => {
        if (active) setAsn(result);
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat data ASN',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function handleCreateSipensiun() {
    if (!asn) return;

    setCreatingId(asn.id);
    setError('');

    try {
      const result = await apiClient.post<SipensiunCaseDetail>('/sipensiun/cases', {
        asnId: asn.id,
        jenisPensiun: 'BUP',
        tmtPensiun: asn.tmtPensiun ?? undefined,
        catatan: `Usulan pensiun BUP untuk ${asn.nama}`,
      });
      if (isMounted.current) {
        navigate(`/sipensiun/${result.sipensiunDetail.id}`);
      }
    } catch (caught) {
      if (isMounted.current) {
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Gagal membuat usulan pensiun',
        );
        setCreatingId('');
      }
    }
  }

  if (loading) {
    return <LoadingState label="Memuat profil ASN" />;
  }

  if (error && !asn) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Detail ASN"
          description="Profil lengkap Aparatur Sipil Negara"
        />
        <ErrorAlert message={error} />
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
          onClick={() => navigate('/sidata/asn')}
        >
          <ArrowLeft className="size-4" />
          Kembali ke Direktori
        </button>
      </div>
    );
  }

  if (!asn) return null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={asn.nama}
        description={`NIP ${asn.nip}${asn.unitKerja ? ` · ${asn.unitKerja.nama}` : ''}`}
        meta={
          <div className="flex items-center gap-2">
            {asn.jenisAsn ? (
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                  asn.jenisAsn === 'PNS'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                {asn.jenisAsn}
              </span>
            ) : null}
            <StatusBadge value={asn.statusAsn ?? '-'} />
          </div>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="Data Kepegawaian">
          <InfoRow label="NIP" value={asn.nip} />
          <InfoRow label="Jabatan" value={asn.jabatanNama} />
          <InfoRow label="Golongan" value={asn.golonganNama} />
          <InfoRow label="Jenis ASN" value={asn.jenisAsn} />
          <InfoRow label="Status ASN" value={asn.statusAsn} />
          <InfoRow label="Unit Kerja" value={asn.unitKerja?.nama} />
          <InfoRow label="TMT Pensiun" value={formatDate(asn.tmtPensiun)} />
        </SectionCard>

        <SectionCard title="Identitas &amp; Kontak">
          <InfoRow label="Tanggal Lahir" value={formatDate(asn.tanggalLahir)} />
          <InfoRow label="Email" value={asn.email} />
          <InfoRow label="Telepon" value={asn.phone} />
        </SectionCard>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700"
          onClick={() => navigate('/sidata/asn')}
        >
          <ArrowLeft className="size-4" />
          Kembali ke Direktori
        </button>

        {asn.statusAsn === 'AKTIF' && (
          <ActionButton
            icon={FilePlus2}
            onClick={() => void handleCreateSipensiun()}
            disabled={!!creatingId}
            variant="secondary"
          >
            {creatingId ? 'Membuat usulan…' : 'Buat Usulan Pensiun'}
          </ActionButton>
        )}
      </div>
    </div>
  );
}
