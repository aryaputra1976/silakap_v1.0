import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, BriefcaseBusiness, FilePlus2, History, Save, SquarePen } from 'lucide-react';
import { ApiError, apiClient } from '@/lib/api/client';
import {
  sidataApi,
  type SidataAsnHistory,
} from '@/lib/api/sidata';
import type { AsnRecord, SipensiunCaseDetail } from '@/lib/api/types';
import {
  ActionButton,
  DataTable,
  EmptyState,
  ErrorAlert,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/workspace/ui';

type DetailTab = 'profil' | 'riwayat' | 'edit';

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
  const [history, setHistory] = useState<SidataAsnHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [error, setError] = useState('');
  const [creatingId, setCreatingId] = useState('');
  const [activeTab, setActiveTab] = useState<DetailTab>('profil');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama: '',
    nik: '',
    jabatanNama: '',
    golonganNama: '',
    statusAsn: '',
    tmtPensiun: '',
  });

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
        if (active) {
          setAsn(result);
          setForm({
            nama: result.nama ?? '',
            nik: result.nik ?? '',
            jabatanNama: result.jabatanNama ?? '',
            golonganNama: result.golonganNama ?? '',
            statusAsn: result.statusAsn ?? '',
            tmtPensiun: result.tmtPensiun ? result.tmtPensiun.slice(0, 10) : '',
          });
        }
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

  useEffect(() => {
    if (!id || activeTab !== 'riwayat' || history) {
      return;
    }

    let active = true;
    setLoadingHistory(true);
    setHistoryError('');

    sidataApi
      .getAsnHistory(id)
      .then((result) => {
        if (active) setHistory(result);
      })
      .catch((caught) => {
        if (active) {
          setHistoryError(
            caught instanceof ApiError
              ? caught.message
              : 'Gagal memuat riwayat ASN',
          );
        }
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab, history, id]);

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

  async function handleSaveAsn() {
    if (!asn) return;
    setSaving(true);
    setError('');
    try {
      const updated = await sidataApi.updateAsn(asn.id, {
        nama: form.nama,
        nik: form.nik,
        jabatanNama: form.jabatanNama,
        golonganNama: form.golonganNama,
        statusAsn: form.statusAsn,
        tmtPensiun: form.tmtPensiun,
      });
      setAsn(updated);
      setActiveTab('profil');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Gagal menyimpan ASN');
    } finally {
      setSaving(false);
    }
  }

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
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

      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-white p-2">
        <button
          className={
            activeTab === 'profil'
              ? 'inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white'
              : 'inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-100'
          }
          type="button"
          onClick={() => setActiveTab('profil')}
        >
          <BriefcaseBusiness className="size-4" />
          Profil
        </button>
        <button
          className={
            activeTab === 'riwayat'
              ? 'inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white'
              : 'inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-100'
          }
          type="button"
          onClick={() => setActiveTab('riwayat')}
        >
          <History className="size-4" />
          Riwayat
        </button>
        <button
          className={
            activeTab === 'edit'
              ? 'inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white'
              : 'inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-100'
          }
          type="button"
          onClick={() => setActiveTab('edit')}
        >
          <SquarePen className="size-4" />
          Edit
        </button>
      </div>

      {activeTab === 'profil' ? (
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
      ) : activeTab === 'edit' ? (
        <SectionCard title="Edit Individual ASN">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['nama', 'Nama'],
              ['nik', 'NIK'],
              ['jabatanNama', 'Jabatan'],
              ['golonganNama', 'Golongan'],
              ['statusAsn', 'Status ASN'],
              ['tmtPensiun', 'TMT Pensiun'],
            ].map(([field, label]) => (
              <label key={field} className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">{label}</span>
                <input
                  className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-zinc-900"
                  type={field === 'tmtPensiun' ? 'date' : 'text'}
                  value={form[field as keyof typeof form]}
                  onChange={(event) => updateForm(field as keyof typeof form, event.target.value)}
                />
              </label>
            ))}
          </div>
          <div className="mt-4">
            <ActionButton icon={Save} onClick={() => void handleSaveAsn()} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan ASN'}
            </ActionButton>
          </div>
        </SectionCard>
      ) : (
        <div className="space-y-5">
          {historyError ? <ErrorAlert message={historyError} /> : null}
          {loadingHistory ? (
            <LoadingState label="Memuat riwayat ASN" />
          ) : history ? (
            <>
              <SectionCard title="Riwayat Jabatan & Unit Kerja">
                {history.assignment.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="Belum ada riwayat jabatan"
                    description="Riwayat akan terbentuk saat batch SIASN dicommit dan ada perubahan data assignment."
                  />
                ) : (
                  <DataTable
                    items={history.assignment}
                    rowKey={(item) => item.id}
                    columns={[
                      {
                        key: 'effective',
                        header: 'Tanggal',
                        render: (item) => formatDate(item.effectiveDate ?? item.tmtJabatan),
                      },
                      {
                        key: 'jabatan',
                        header: 'Jabatan',
                        render: (item) => (
                          <div>
                            <div className="font-semibold text-zinc-900">{item.jabatanNama ?? '-'}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{item.jenisJabatanNama ?? '-'}</div>
                          </div>
                        ),
                      },
                      {
                        key: 'unit',
                        header: 'Unit Kerja',
                        render: (item) => item.unitKerja?.nama ?? item.unorNama ?? '-',
                      },
                      {
                        key: 'batch',
                        header: 'Batch',
                        render: (item) => (
                          <div className="max-w-[220px]">
                            <div className="truncate text-xs font-semibold text-zinc-900">
                              {item.sourceBatch?.fileName ?? item.sourceBatch?.importType ?? '-'}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(item.syncedAt)}
                            </div>
                          </div>
                        ),
                      },
                    ]}
                  />
                )}
              </SectionCard>

              <SectionCard title="Riwayat Golongan">
                {history.golongan.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="Belum ada riwayat golongan"
                    description="Riwayat akan terbentuk saat batch SIASN dicommit dan ada perubahan data golongan."
                  />
                ) : (
                  <DataTable
                    items={history.golongan}
                    rowKey={(item) => item.id}
                    columns={[
                      {
                        key: 'effective',
                        header: 'Tanggal',
                        render: (item) => formatDate(item.effectiveDate ?? item.tmtGolongan),
                      },
                      {
                        key: 'golongan',
                        header: 'Golongan',
                        render: (item) => (
                          <div>
                            <div className="font-semibold text-zinc-900">{item.golonganNama ?? '-'}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {item.ruangNama ?? item.pangkatNama ?? '-'}
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: 'siasn',
                        header: 'Kode SIASN',
                        render: (item) => item.siasnGolonganId ?? '-',
                      },
                      {
                        key: 'batch',
                        header: 'Batch',
                        render: (item) => (
                          <div className="max-w-[220px]">
                            <div className="truncate text-xs font-semibold text-zinc-900">
                              {item.sourceBatch?.fileName ?? item.sourceBatch?.importType ?? '-'}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(item.syncedAt)}
                            </div>
                          </div>
                        ),
                      },
                    ]}
                  />
                )}
              </SectionCard>
            </>
          ) : null}
        </div>
      )}

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
