import {
  BarChart3,
  ClipboardCheck,
  FileText,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
} from 'lucide-react';

export interface SopWorkspaceNavItem {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
}

export const SOP_WORKSPACE_NAV_ITEMS: SopWorkspaceNavItem[] = [
  {
    title: 'Dashboard RHK',
    description: 'Ringkasan SOP, RHK, capaian, bukti dukung, dan status risiko.',
    path: '/kinerja-bidang',
    icon: LayoutDashboard,
  },
  {
    title: 'Peta SOP Bidang',
    description: 'Peta SOP Tahap 1, Tahap 2, dan Tahap 3 Bidang PPIK.',
    path: '/kinerja-bidang/sop/map',
    icon: GitBranch,
  },
  {
    title: 'Daftar SOP',
    description: 'Daftar seluruh paket SOP Bidang PPIK dan keterkaitan RHK.',
    path: '/kinerja-bidang/sop',
    icon: ListChecks,
  },
  {
    title: 'Monitoring Realisasi',
    description: 'Pemantauan target, realisasi, capaian, risiko, dan bukti dukung.',
    path: '/kinerja-bidang/monitoring',
    icon: BarChart3,
  },
  {
    title: 'Realisasi SOP/RHK',
    description: 'Input, submit, review, approve, dan tautkan bukti dukung DMS.',
    path: '/kinerja-bidang/realisasi',
    icon: ClipboardCheck,
  },
  {
    title: 'Laporan Kinerja',
    description: 'Draft laporan kinerja bidang untuk Kabid dan Kepala Badan.',
    path: '/kinerja-bidang/laporan',
    icon: FileText,
  },
];

export function getSopWorkspacePageLabel(pathname: string): string {
  if (pathname === '/kinerja-bidang') {
    return 'Dashboard RHK';
  }

  if (pathname === '/kinerja-bidang/sop/map') {
    return 'Peta SOP Bidang';
  }

  if (pathname === '/kinerja-bidang/sop') {
    return 'Daftar SOP';
  }

  if (pathname.startsWith('/kinerja-bidang/sop/')) {
    return 'Detail SOP';
  }

  if (pathname === '/kinerja-bidang/monitoring') {
    return 'Monitoring Realisasi';
  }

  if (pathname === '/kinerja-bidang/realisasi') {
    return 'Realisasi SOP/RHK';
  }

  if (pathname.startsWith('/kinerja-bidang/realisasi/')) {
    return 'Detail Realisasi SOP/RHK';
  }

  if (pathname === '/kinerja-bidang/laporan') {
    return 'Laporan Kinerja Bidang';
  }

  return 'Kinerja Bidang';
}

export function getSopStageLabel(stage: 1 | 2 | 3): string {
  const labels: Record<1 | 2 | 3, string> = {
    1: 'Tahap 1 - Manajemen Bidang',
    2: 'Tahap 2 - Pengelolaan Layanan',
    3: 'Tahap 3 - Fungsi Spesifik Bidang',
  };

  return labels[stage];
}

export function getSopStageTone(stage: 1 | 2 | 3): 'info' | 'success' | 'warning' {
  if (stage === 1) {
    return 'info';
  }

  if (stage === 2) {
    return 'success';
  }

  return 'warning';
}
