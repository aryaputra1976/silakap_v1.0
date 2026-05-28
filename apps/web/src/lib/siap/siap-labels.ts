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
    ANALIS_PERTAMA: 'Analis Pertama',
    ANALIS_MUDA: 'Analis Muda',
    ANALIS_MADYA: 'Analis Madya',
    KABID: 'Kabid',
    KEPALA_BADAN: 'Kepala Badan',
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
    ASSIGN_TASK: 'Tugaskan',
    START: 'Mulai',
    COMPLETE: 'Selesaikan',
    COMPLETE_TASK: 'Selesaikan Tugas',
    APPROVE: 'Setujui',
    REJECT: 'Tolak',
    RETURN: 'Kembalikan',
    RETURN_TASK: 'Kembalikan Tugas',
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
    ANALIS_PERTAMA: 'Analis Pertama',
    ANALIS_MUDA: 'Analis Muda',
    ANALIS_MADYA: 'Analis Madya',
    KABID: 'Kabid',
    KEPALA_BADAN: 'Kepala Badan',
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

export function slaStatusLabel(value: string | null | undefined) {
  if (!value) return '-';
  const labels: Record<string, string> = {
    ON_TRACK: 'Sesuai Jadwal',
    WARNING: 'Perlu Perhatian',
    OVERDUE: 'Terlambat',
    ESCALATED: 'Dieskalasi',
    COMPLETED: 'Selesai',
  };
  return labels[value] ?? humanizeCode(value);
}

export function slaStatusTone(value: string | null | undefined): BadgeTone {
  if (value === 'COMPLETED') return 'success';
  if (value === 'WARNING') return 'warning';
  if (value === 'OVERDUE' || value === 'ESCALATED') return 'danger';
  return 'info';
}

export function timelineEventLabel(value: string | null | undefined) {
  if (!value) return '-';
  const labels: Record<string, string> = {
    CASE_CREATED: 'Kasus Dibuat',
    CASE_SUBMITTED: 'Kasus Dikirim',
    CASE_COMPLETED: 'Kasus Selesai',
    CASE_CANCELLED: 'Kasus Dibatalkan',
    TASK_CREATED: 'Tugas Dibuat',
    TASK_STARTED: 'Tugas Mulai Dikerjakan',
    TASK_COMPLETED: 'Tugas Diselesaikan',
    TASK_ASSIGNED: 'Tugas Ditugaskan',
    TASK_RETURNED: 'Tugas Dikembalikan',
    DOCUMENT_UPLOADED: 'Dokumen Diunggah',
    WORKLOG_CREATED: 'Buku Kerja Dibuat',
  };
  return labels[value] ?? humanizeCode(value);
}

export function timelineTitleLabel(value: string | null | undefined) {
  if (!value) return '-';
  const knownLabel = timelineEventLabel(value);
  if (knownLabel !== humanizeCode(value)) return knownLabel;

  return value
    .replaceAll('Case', 'Kasus')
    .replaceAll('case', 'kasus')
    .replaceAll('Task', 'Tugas')
    .replaceAll('task', 'tugas')
    .replaceAll('Verifikasi Admin', 'Verifikasi Administrasi')
    .replaceAll('Admin Bkpsdm', 'Admin BKPSDM')
    .replaceAll('DRAFT', 'Draft')
    .replaceAll('SUBMITTED', 'Dikirim')
    .replaceAll('VERIFIKASI_ADMIN', 'Verifikasi Administrasi')
    .replaceAll('ADMIN_BKPSDM', 'Admin BKPSDM');
}

export function timelineDescriptionLabel(value: string | null | undefined) {
  if (!value) return null;

  return value
    .replaceAll('Case', 'Kasus')
    .replaceAll('case', 'kasus')
    .replaceAll('Task', 'Tugas')
    .replaceAll('task', 'tugas')
    .replaceAll('disubmit', 'dikirim')
    .replaceAll('submit', 'kirim')
    .replaceAll('Verifikasi Admin', 'Verifikasi Administrasi')
    .replaceAll('Admin Bkpsdm', 'Admin BKPSDM')
    .replaceAll('DRAFT', 'Draft')
    .replaceAll('SUBMITTED', 'Dikirim')
    .replaceAll('VERIFIKASI_ADMIN', 'Verifikasi Administrasi')
    .replaceAll('ADMIN_BKPSDM', 'Admin BKPSDM')
    .replaceAll('ASSIGNED', 'Belum Dikerjakan')
    .replaceAll('IN_PROGRESS', 'Sedang Dikerjakan')
    .replaceAll('COMPLETED', 'Selesai')
    .replaceAll('ON_TRACK', 'Sesuai Jadwal');
}

export function actorDisplayName(value: string | null | undefined) {
  return value ? 'Petugas Sistem' : undefined;
}

export function humanizeCode(value: string) {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
