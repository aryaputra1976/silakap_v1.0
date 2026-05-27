export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'dark';

export function serviceTypeLabel(value: string | null | undefined) {
  if (!value) return '-';
  const labels: Record<string, string> = {
    KENAIKAN_PANGKAT: 'Kenaikan Pangkat',
    MUTASI: 'Mutasi Jabatan',
    PENSIUN: 'Pensiun',
    CUTI: 'Cuti',
    IZIN_BELAJAR: 'Izin Belajar / Tugas Belajar',
    SURAT_KETERANGAN: 'Surat Keterangan',
    PEMBUATAN_KARPEG: 'Pembuatan KARPEG',
    LAIN_LAIN: 'Lain-lain',
  };
  return labels[value] ?? humanizeCode(value);
}

export function caseStatusLabel(value: string | null | undefined) {
  if (!value) return '-';
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    ACTIVE: 'Aktif',
    COMPLETED: 'Selesai',
    CLOSED: 'Ditutup',
    CANCELLED: 'Dibatalkan',
    ARCHIVED: 'Diarsipkan',
  };
  return labels[value] ?? humanizeCode(value);
}

export function caseStatusTone(value: string | null | undefined): BadgeTone {
  if (value === 'COMPLETED' || value === 'CLOSED') return 'success';
  if (value === 'ACTIVE') return 'info';
  if (value === 'CANCELLED') return 'danger';
  if (value === 'ARCHIVED') return 'dark';
  return 'neutral';
}

export function priorityLabel(value: string | null | undefined) {
  if (!value) return '-';
  const labels: Record<string, string> = {
    LOW: 'Rendah',
    NORMAL: 'Normal',
    HIGH: 'Urgen',
    URGENT: 'Urgen',
    CRITICAL: 'Kritis',
  };
  return labels[value] ?? humanizeCode(value);
}

export function priorityTone(value: string | null | undefined): BadgeTone {
  if (value === 'CRITICAL') return 'danger';
  if (value === 'HIGH' || value === 'URGENT') return 'warning';
  return 'neutral';
}

export function workflowStateLabel(value: string | null | undefined) {
  if (!value) return '-';
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Dikirim',
    VERIFIKASI_ADMIN: 'Verifikasi Administrasi',
    VERIFIKASI: 'Verifikasi',
    APPROVAL: 'Persetujuan',
    APPROVED: 'Disetujui',
    COMPLETED: 'Selesai',
    RETURNED: 'Dikembalikan',
    CANCELLED: 'Dibatalkan',
    ARCHIVED: 'Diarsipkan',
  };
  return labels[value] ?? humanizeCode(value);
}

export function workflowActionLabel(value: string | null | undefined) {
  if (!value) return '-';
  const labels: Record<string, string> = {
    SUBMIT: 'Kirim',
    ASSIGN: 'Tugaskan',
    START: 'Mulai',
    COMPLETE: 'Selesaikan',
    APPROVE: 'Setujui',
    REJECT: 'Tolak',
    RETURN: 'Kembalikan',
    CANCEL: 'Batalkan',
    REOPEN: 'Buka Kembali',
    ESCALATE: 'Eskalasi',
  };
  return labels[value] ?? humanizeCode(value);
}

export function taskTypeLabel(value: string | null | undefined) {
  if (!value) return '-';
  const labels: Record<string, string> = {
    DISPOSISI: 'Disposisi & Arahan',
    TINDAK_LANJUT: 'Tindak Lanjut',
    VERIFIKASI: 'Verifikasi',
    VERIFIKASI_ADMIN: 'Verifikasi Administrasi',
    APPROVAL: 'Persetujuan',
  };
  return labels[value] ?? humanizeCode(value);
}

export function taskStatusLabel(value: string | null | undefined) {
  if (!value) return '-';
  const labels: Record<string, string> = {
    CREATED: 'Baru',
    ASSIGNED: 'Belum Dikerjakan',
    IN_PROGRESS: 'Sedang Dikerjakan',
    WAITING: 'Menunggu',
    RETURNED: 'Dikembalikan',
    COMPLETED: 'Selesai',
    OVERDUE: 'Terlambat',
    CANCELLED: 'Batal',
  };
  return labels[value] ?? humanizeCode(value);
}

export function taskStatusTone(value: string | null | undefined): BadgeTone {
  if (value === 'COMPLETED') return 'success';
  if (value === 'ASSIGNED' || value === 'IN_PROGRESS') return 'info';
  if (value === 'WAITING') return 'warning';
  if (value === 'RETURNED' || value === 'OVERDUE' || value === 'CANCELLED') return 'danger';
  return 'neutral';
}

export function worklogStatusLabel(value: string | null | undefined) {
  if (!value) return '-';
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Menunggu Tinjauan',
    REVISION_REQUIRED: 'Perlu Perbaikan',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
  };
  return labels[value] ?? humanizeCode(value);
}

export function worklogStatusTone(value: string | null | undefined): BadgeTone {
  if (value === 'APPROVED') return 'success';
  if (value === 'SUBMITTED') return 'info';
  if (value === 'REVISION_REQUIRED' || value === 'REJECTED') return 'danger';
  return 'warning';
}

export function worklogCategoryLabel(value: string | null | undefined) {
  if (!value) return '-';
  const labels: Record<string, string> = {
    VERIFIKASI_BERKAS: 'Verifikasi Berkas',
    VALIDASI_DATA: 'Validasi Data',
    ARSIP_DIGITAL: 'Arsip Digital',
    LAYANAN_ASN: 'Layanan ASN',
    RAPAT_KOORDINASI: 'Rapat / Koordinasi',
    LAPORAN: 'Laporan',
    LAINNYA: 'Lainnya',
  };
  return labels[value] ?? humanizeCode(value);
}

export function humanizeCode(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
