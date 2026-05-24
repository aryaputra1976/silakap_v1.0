import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, BriefcaseBusiness, FilePlus2, History, Save, SquarePen } from 'lucide-react';
import { ApiError, apiClient } from '@/lib/api/client';
import {
  formatJenisAsn,
  sidataApi,
  type SidataAsnChangeLog,
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

function formatChangeValue(value: string | null): string {
  if (!value) return '-';
  return value.length > 80 ? `${value.slice(0, 77)}...` : value;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null | undefined;
}) {
  const displayValue = typeof value === 'string' ? (value || '-') : (value ?? '-');

  return (
    <div className="flex gap-3 border-b border-[#e4eeea] py-2.5 last:border-0">
      <span className="w-40 shrink-0 text-sm text-[#62766f]">{label}</span>
      <span className="min-w-0 text-sm font-medium text-[#18343a]">{displayValue}</span>
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
    <div className="overflow-hidden rounded-lg border border-[#cfe1da] bg-white shadow-[0_12px_28px_rgba(14,124,134,0.08)]">
      <div className="border-b border-[#cfe1da] bg-[linear-gradient(90deg,#eef8f6_0%,#ffffff_100%)] px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-normal text-[#075e66]">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function SidataAsnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [asn, setAsn] = useState<AsnRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<SidataAsnHistory | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [changeLogs, setChangeLogs] = useState<SidataAsnChangeLog[]>([]);
  const [changeLogsLoaded, setChangeLogsLoaded] = useState(false);
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
    changeReason: '',
    reviewNote: '',
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
            changeReason: '',
            reviewNote: result.reviewNote ?? '',
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
    if (!id || activeTab !== 'riwayat' || (historyLoaded && changeLogsLoaded)) {
      return;
    }

    let active = true;
    setLoadingHistory(true);
    setHistoryError('');

    Promise.all([
      historyLoaded ? Promise.resolve(history) : sidataApi.getAsnHistory(id),
      changeLogsLoaded ? Promise.resolve(changeLogs) : sidataApi.getAsnChangeLogs(id),
    ])
      .then(([historyResult, logResult]) => {
        if (active) {
          setHistory(historyResult);
          setHistoryLoaded(true);
          setChangeLogs(logResult);
          setChangeLogsLoaded(true);
        }
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
  }, [activeTab, changeLogs, changeLogsLoaded, history, historyLoaded, id]);

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
        changeReason: form.changeReason,
        needsReview: true,
        reviewNote: form.reviewNote,
      });
      setAsn(updated);
      setForm((current) => ({
        ...current,
        changeReason: '',
        reviewNote: updated.reviewNote ?? '',
      }));
      setChangeLogs([]);
      setChangeLogsLoaded(false);
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
        description={`NIP ${asn.nip}${asn.unitKerja ? ` / ${asn.unitKerja.nama}` : ''}`}
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
                {formatJenisAsn(asn.jenisAsn)}
              </span>
            ) : null}
            <StatusBadge value={asn.statusAsn ?? '-'} />
            <StatusBadge value={asn.syncStatus ?? 'NEED_REVIEW'} />
          </div>
        }
      />

      {error ? <ErrorAlert message={error} /> : null}

      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-white p-2">
        <button
          className={
            activeTab === 'profil'
              ? 'inline-flex h-10 items-center gap-2 rounded-md bg-[#0e7c86] px-4 text-sm font-semibold text-white'
              : 'inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-[#4c625c] hover:bg-[#eef8f6]'
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
              ? 'inline-flex h-10 items-center gap-2 rounded-md bg-[#0e7c86] px-4 text-sm font-semibold text-white'
              : 'inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-[#4c625c] hover:bg-[#eef8f6]'
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
              ? 'inline-flex h-10 items-center gap-2 rounded-md bg-[#0e7c86] px-4 text-sm font-semibold text-white'
              : 'inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-[#4c625c] hover:bg-[#eef8f6]'
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
            <InfoRow label="Jenis ASN" value={formatJenisAsn(asn.jenisAsn)} />
            <InfoRow label="Status ASN" value={asn.statusAsn} />
            <InfoRow label="Unit Kerja" value={asn.unitKerja?.nama} />
            <InfoRow label="TMT Pensiun" value={formatDate(asn.tmtPensiun)} />
          </SectionCard>

          <SectionCard title="Identitas &amp; Kontak">
            <InfoRow label="Tanggal Lahir" value={formatDate(asn.tanggalLahir)} />
            <InfoRow label="Email" value={asn.email} />
            <InfoRow label="Telepon" value={asn.phone} />
          </SectionCard>

          <SectionCard title="Status Sinkronisasi">
            <InfoRow label="Status" value={<StatusBadge value={asn.syncStatus ?? 'NEED_REVIEW'} />} />
            <InfoRow label="Batch SIASN" value={asn.lastSiasnBatchId ?? asn.sourceBatchId} />
            <InfoRow label="Sinkron Terakhir" value={formatDateTime(asn.lastSiasnSyncedAt ?? asn.syncedAt)} />
            <InfoRow label="Koreksi Lokal" value={formatDateTime(asn.localCorrectionAt)} />
            <InfoRow label="Alasan Koreksi" value={asn.localCorrectionReason} />
            <InfoRow label="Perlu Review" value={asn.needsReview ? 'Ya' : 'Tidak'} />
            <InfoRow label="Catatan Review" value={asn.reviewNote} />
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
                  className="h-10 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-[#0e7c86]"
                  type={field === 'tmtPensiun' ? 'date' : 'text'}
                  value={form[field as keyof typeof form]}
                  onChange={(event) => updateForm(field as keyof typeof form, event.target.value)}
                />
              </label>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-zinc-700">Alasan Perubahan</span>
              <textarea
                className="min-h-24 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-[#0e7c86]"
                value={form.changeReason}
                onChange={(event) => updateForm('changeReason', event.target.value)}
                placeholder="Contoh: TMT pensiun diperbaiki berdasarkan SK Pensiun."
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-zinc-700">Catatan Review Internal</span>
              <textarea
                className="min-h-20 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-[#0e7c86]"
                value={form.reviewNote}
                onChange={(event) => updateForm('reviewNote', event.target.value)}
              />
            </label>
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
              <SectionCard title="Audit Perubahan ASN">
                {changeLogs.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="Belum ada audit perubahan"
                    description="Audit terbentuk dari koreksi manual atau commit import SIASN."
                  />
                ) : (
                  <DataTable
                    items={changeLogs}
                    empty="Belum ada audit perubahan"
                    rowKey={(item) => item.id}
                    columns={[
                      {
                        key: 'changedAt',
                        header: 'Waktu',
                        render: (item) => formatDateTime(item.changedAt),
                      },
                      {
                        key: 'field',
                        header: 'Field',
                        render: (item) => (
                          <div>
                            <div className="font-semibold text-zinc-900">{item.fieldName}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{item.reason ?? '-'}</div>
                          </div>
                        ),
                      },
                      {
                        key: 'source',
                        header: 'Sumber',
                        render: (item) => <StatusBadge value={item.source} />,
                      },
                      {
                        key: 'old',
                        header: 'Nilai Lama',
                        render: (item) => formatChangeValue(item.oldValue),
                      },
                      {
                        key: 'new',
                        header: 'Nilai Baru',
                        render: (item) => formatChangeValue(item.newValue),
                      },
                    ]}
                  />
                )}
              </SectionCard>

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
                    empty="Belum ada riwayat jabatan"
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
                    empty="Belum ada riwayat golongan"
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
            {creatingId ? 'Membuat usulan...' : 'Buat Usulan Pensiun'}
          </ActionButton>
        )}
      </div>
    </div>
  );
}
