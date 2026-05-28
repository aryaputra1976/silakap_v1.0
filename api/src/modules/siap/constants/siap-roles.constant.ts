/**
 * SIAP Role Assignment Constants
 * Defines which roles can perform assignment/reassignment operations
 * 
 * Prinsip:
 * - SUPER_ADMIN: hanya emergency teknis
 * - KABID: reassign, escalation, approval penting
 * - ANALIS_MADYA: reassign jika ada delegasi
 * - ADMIN_BKPSDM, ANALIS_MUDA, ANALIS_PERTAMA: tidak boleh assign rutin
 */

export const SIAP_ROLES = {
  // Technical Roles (tidak boleh aksi bisnis rutin)
  ADMIN_BKPSDM: 'ADMIN_BKPSDM',
  SUPER_ADMIN: 'SUPER_ADMIN',

  // Operational Execution Roles (fokus task, tidak penugasan)
  ANALIS_MUDA: 'ANALIS_MUDA',
  ANALIS_PERTAMA: 'ANALIS_PERTAMA',
  PENELAAH: 'PENELAAH',
  PPPK: 'PPPK',

  // Supervisory & Decision Roles
  ANALIS_MADYA: 'ANALIS_MADYA',
  KABID: 'KABID',
  KEPALA_BADAN: 'KEPALA_BADAN',

  // External Role
  OPD: 'OPD',
};

/**
 * Roles yang boleh melakukan assignment/reassignment task
 * 
 * SUPER_ADMIN: emergency only, controlled by business process
 * KABID: reassign manual, escalation, approval penting
 * ANALIS_MADYA: reassign jika ada formal delegasi
 */
export const SIAP_ASSIGN_ROLES = [
  SIAP_ROLES.SUPER_ADMIN,
  SIAP_ROLES.KABID,
  SIAP_ROLES.ANALIS_MADYA,
];

/**
 * Pool role untuk assignment awal
 * Roles dalam pool ini akan menerima assignment otomatis
 * berdasarkan beban kerja terringan
 * 
 * Pool Teknis Awal (ANALIS_PERTAMA_POOL):
 * - Analis SDMA Ahli Pertama
 * - Penelaah Teknis Kebijakan
 * - PPPK Analis SDMA Ahli Pertama
 * 
 * Note: PPPK Paruh Waktu dikecualikan via konfigurasi user
 */
export const SIAP_WORKLOAD_POOL_ROLES = [
  SIAP_ROLES.ANALIS_PERTAMA,
  SIAP_ROLES.PENELAAH,
  SIAP_ROLES.PPPK,
];

/**
 * Roles yang bisa supervisi tim dan monitoring pemerataan
 */
export const SIAP_SUPERVISOR_ROLES = [
  SIAP_ROLES.KABID,
  SIAP_ROLES.ANALIS_MADYA,
];

/**
 * Roles yang hanya boleh administrasi/teknis, bukan aksi bisnis
 */
export const SIAP_TECHNICAL_ADMIN_ROLES = [
  SIAP_ROLES.SUPER_ADMIN,
  SIAP_ROLES.ADMIN_BKPSDM,
];

/**
 * Task status yang dihitung sebagai "active workload"
 * Untuk menentukan assignment ke pegawai dengan beban ringan
 */
export const SIAP_ACTIVE_TASK_STATUSES = [
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING',
  'RETURNED',
  'OVERDUE',
];

/**
 * Task status yang sudah selesai (tidak menambah beban)
 */
export const SIAP_COMPLETED_TASK_STATUSES = [
  'COMPLETED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
];
