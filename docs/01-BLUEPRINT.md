Baik, saya akan membuat blueprint implementasi lengkap berdasarkan dokumentasi audit yang sudah saya baca. Saya akan struktur ini berdasarkan rencana patch bertahap yang jelas.

---

# 🏗️ **BLUEPRINT IMPLEMENTASI LENGKAP - SILAKAP v1.0 PATCH**

## **FASE 0: PERSIAPAN & PLANNING**

### **Timeline & Deliverables**

```
FASE 1 (Minggu 1-2): Patch RBAC & Workflow Seed
├── Task 1.1: Constants RBAC
├── Task 1.2: Update Seed Workflow
├── Task 1.3: Update SiapService assign methods
└── Task 1.4: Testing & Documentation

FASE 2 (Minggu 3-4): Auto-Assignment Berbasis Beban
├── Task 2.1: Repository Method untuk Workload
├── Task 2.2: Assignment Service
├── Task 2.3: Update CreateTask Logic
└── Task 2.4: E2E Testing OPD → SIAP

FASE 3 (Minggu 5-6): Dashboard Pemerataan
├── Task 3.1: Backend Endpoint /siap/workload
├── Task 3.2: Frontend Components & Pages
├── Task 3.3: Visualization & Charts
└── Task 3.4: Testing & Performance

FASE 4 (Minggu 7-8): Frontend UX/RBAC Alignment
├── Task 4.1: Action Rights Contract
├── Task 4.2: Tab Navigation (Tugas/Supervisi/Pemerataan)
├── Task 4.3: Button/Action Visibility Rules
└── Task 4.4: QA & UAT
```

---

## **FASE 1: PATCH RBAC & WORKFLOW SEED**

### **Task 1.1: Constants RBAC**

**File:** `api/src/siap/constants/siap-roles.constant.ts`

```typescript
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
```

---

### **Task 1.2: Update Seed Workflow**

**File:** `api/src/siap/seeds/workflow-seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { SIAP_ROLES } from '../constants/siap-roles.constant';

const prisma = new PrismaClient();

export async function seedSiapWorkflow() {
  console.log('Seeding SIAP Workflow Transitions...');

  // ===== WORKFLOW AWAL: DRAFT -> VERIFIKASI_AWAL =====
  // PERUBAHAN PENTING:
  // - Dari: DRAFT -> VERIFIKASI_ADMIN (allowedRole: ADMIN_BKPSDM) ❌
  // - Ke:   DRAFT -> VERIFIKASI_AWAL (allowedRole: ANALIS_PERTAMA) ✅
  // - Tujuan: Admin teknis bukan aktor bisnis

  await prisma.workflowTransition.upsert({
    where: {
      fromState_toState: {
        fromState: 'DRAFT',
        toState: 'VERIFIKASI_AWAL',
      },
    },
    update: {
      allowedRole: SIAP_ROLES.ANALIS_PERTAMA, // DIUBAH dari ADMIN_BKPSDM
      actionCode: 'SUBMIT_AWAL',
      slaDays: 3,
      description: 'Submission from OPD to initial analyst team',
    },
    create: {
      fromState: 'DRAFT',
      toState: 'VERIFIKASI_AWAL',
      allowedRole: SIAP_ROLES.ANALIS_PERTAMA, // DIUBAH dari ADMIN_BKPSDM
      actionCode: 'SUBMIT_AWAL',
      slaDays: 3,
      description: 'Submission from OPD to initial analyst team',
      isActive: true,
    },
  });

  // ===== WORKFLOW LANJUTAN =====
  // State transitions sudah ada, hanya pastikan ADMIN_BKPSDM tidak muncul

  // VERIFIKASI_AWAL -> VERIFIKASI_SUBSTANSI
  await prisma.workflowTransition.upsert({
    where: {
      fromState_toState: {
        fromState: 'VERIFIKASI_AWAL',
        toState: 'VERIFIKASI_SUBSTANSI',
      },
    },
    update: {
      allowedRole: SIAP_ROLES.ANALIS_MUDA,
      slaDays: 5,
    },
    create: {
      fromState: 'VERIFIKASI_AWAL',
      toState: 'VERIFIKASI_SUBSTANSI',
      allowedRole: SIAP_ROLES.ANALIS_MUDA,
      actionCode: 'SUBMIT_SUBSTANSI',
      slaDays: 5,
      description: 'Technical review for content verification',
      isActive: true,
    },
  });

  // VERIFIKASI_SUBSTANSI -> APPROVAL_KABID
  await prisma.workflowTransition.upsert({
    where: {
      fromState_toState: {
        fromState: 'VERIFIKASI_SUBSTANSI',
        toState: 'APPROVAL_KABID',
      },
    },
    update: {
      allowedRole: SIAP_ROLES.KABID,
      slaDays: 2,
    },
    create: {
      fromState: 'VERIFIKASI_SUBSTANSI',
      toState: 'APPROVAL_KABID',
      allowedRole: SIAP_ROLES.KABID,
      actionCode: 'REQUEST_KABID_APPROVAL',
      slaDays: 2,
      description: 'Division head approval for important decisions',
      isActive: true,
    },
  });

  // APPROVAL_KABID -> COMPLETED
  await prisma.workflowTransition.upsert({
    where: {
      fromState_toState: {
        fromState: 'APPROVAL_KABID',
        toState: 'COMPLETED',
      },
    },
    update: {
      allowedRole: SIAP_ROLES.KABID,
      slaDays: 1,
    },
    create: {
      fromState: 'APPROVAL_KABID',
      toState: 'COMPLETED',
      allowedRole: SIAP_ROLES.KABID,
      actionCode: 'FINALIZE',
      slaDays: 1,
      description: 'Final completion and archival',
      isActive: true,
    },
  });

  // ===== ROLLBACK: Hapus atau nonaktifkan workflow lama yang salah =====
  // Jika ada transition DRAFT -> VERIFIKASI_ADMIN dengan allowedRole ADMIN_BKPSDM
  await prisma.workflowTransition.updateMany({
    where: {
      fromState: 'DRAFT',
      allowedRole: SIAP_ROLES.ADMIN_BKPSDM,
    },
    data: {
      isActive: false,
    },
  });

  console.log('✅ SIAP Workflow Transitions seeded');
}

// Run if executed directly
if (require.main === module) {
  seedSiapWorkflow()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
```

---

### **Task 1.3: Update SiapService Methods**

**File:** `api/src/siap/services/siap.service.ts` (snippet penting)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { SIAP_ASSIGN_ROLES, SIAP_ROLES } from '../constants/siap-roles.constant';

@Injectable()
export class SiapService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user role can perform assignment/reassignment
   * 
   * @param userRole - User's role code
   * @returns true jika user boleh melakukan assign/reassign
   * 
   * Aturan:
   * - SUPER_ADMIN: yes, but should be emergency only (controlled by process)
   * - KABID: yes, untuk reassign dan escalation
   * - ANALIS_MADYA: yes, jika ada formal delegasi
   * - Roles lain: no
   */
  canAssignTask(userRole: string): boolean {
    return SIAP_ASSIGN_ROLES.includes(userRole);
  }

  /**
   * Check if user role can perform reassignment
   * Same as canAssignTask for now, but separable for future refinement
   */
  canReassignTask(userRole: string): boolean {
    return SIAP_ASSIGN_ROLES.includes(userRole);
  }

  /**
   * Validate that admin roles don't perform business action
   * 
   * @param userRole - User's role code
   * @param actionType - Type of action (assign, reassign, approve, etc)
   * @returns true jika role boleh melakukan action
   * 
   * Prevents ADMIN_BKPSDM from doing business logic
   */
  canPerformBusinessAction(userRole: string, actionType: string): boolean {
    // Technical admin roles tidak boleh aksi bisnis
    if (userRole === SIAP_ROLES.ADMIN_BKPSDM) {
      // Hanya bisa: get data, read logs, administrasi teknis
      return false;
    }

    // Check specific action permissions
    switch (actionType) {
      case 'ASSIGN_TASK':
      case 'REASSIGN_TASK':
        return this.canAssignTask(userRole);
      case 'APPROVE_TASK':
        return [
          SIAP_ROLES.KABID,
          SIAP_ROLES.KEPALA_BADAN,
          SIAP_ROLES.ANALIS_MADYA,
        ].includes(userRole);
      case 'COMPLETE_TASK':
        return true; // Semua pegawai operasional bisa complete task mereka
      default:
        return false;
    }
  }

  /**
   * Update task assignment dengan validation RBAC
   * 
   * @param taskId - Task ID
   * @param newAssigneeId - User ID yang akan menerima task
   * @param updatedByUserId - User yang melakukan update
   * @param updatedByRole - Role yang melakukan update
   */
  async reassignTask(
    taskId: string,
    newAssigneeId: string,
    updatedByUserId: string,
    updatedByRole: string,
  ) {
    // Validasi permission
    if (!this.canReassignTask(updatedByRole)) {
      throw new Error(
        `Role ${updatedByRole} tidak boleh melakukan reassign task`,
      );
    }

    // Validasi target assignee memiliki role yang tepat
    const assignee = await this.prisma.user.findUnique({
      where: { id: newAssigneeId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!assignee) {
      throw new Error(`User ${newAssigneeId} not found`);
    }

    // Update task
    return await this.prisma.siapTask.update({
      where: { id: taskId },
      data: {
        assignedTo: newAssigneeId,
        assignedBy: updatedByUserId,
        assignedAt: new Date(),
      },
    });
  }
}
```

---

### **Task 1.4: Guard & Decorator untuk RBAC**

**File:** `api/src/siap/guards/siap-assign.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SiapService } from '../services/siap.service';

@Injectable()
export class SiapAssignGuard implements CanActivate {
  constructor(private siapService: SiapService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!this.siapService.canAssignTask(user.role)) {
      throw new ForbiddenException(
        `Role ${user.role} tidak diizinkan melakukan assignment task`,
      );
    }

    return true;
  }
}
```

**File:** `api/src/siap/decorators/require-siap-action.decorator.ts`

```typescript
import { UseGuards, SetMetadata } from '@nestjs/common';
import { SiapAssignGuard } from '../guards/siap-assign.guard';

export const SIAP_ACTION_KEY = 'siapAction';

export const RequireSiapAction = (actionType: string) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(SIAP_ACTION_KEY, actionType)(target, propertyKey, descriptor);
    UseGuards(SiapAssignGuard)(target, propertyKey, descriptor);
  };
};
```

**Usage dalam Controller:**

```typescript
@Post('tasks/:id/assign')
@RequireSiapAction('ASSIGN_TASK')
async assignTask(
  @Param('id') taskId: string,
  @Body() dto: AssignTaskDto,
  @CurrentUser() user: User,
) {
  return this.siapService.reassignTask(
    taskId,
    dto.assignToUserId,
    user.id,
    user.role,
  );
}
```

---

### **Task 1.5: Unit Tests untuk RBAC**

**File:** `api/src/siap/services/siap.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SiapService } from './siap.service';
import { PrismaService } from 'src/database/prisma.service';
import { SIAP_ROLES } from '../constants/siap-roles.constant';

describe('SiapService - RBAC', () => {
  let service: SiapService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiapService,
        {
          provide: PrismaService,
          useValue: {
            siapTask: { update: jest.fn() },
            user: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<SiapService>(SiapService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('canAssignTask', () => {
    it('should allow SUPER_ADMIN to assign', () => {
      expect(service.canAssignTask(SIAP_ROLES.SUPER_ADMIN)).toBe(true);
    });

    it('should allow KABID to assign', () => {
      expect(service.canAssignTask(SIAP_ROLES.KABID)).toBe(true);
    });

    it('should allow ANALIS_MADYA to assign', () => {
      expect(service.canAssignTask(SIAP_ROLES.ANALIS_MADYA)).toBe(true);
    });

    it('should NOT allow ADMIN_BKPSDM to assign', () => {
      expect(service.canAssignTask(SIAP_ROLES.ADMIN_BKPSDM)).toBe(false);
    });

    it('should NOT allow ANALIS_MUDA to assign', () => {
      expect(service.canAssignTask(SIAP_ROLES.ANALIS_MUDA)).toBe(false);
    });

    it('should NOT allow ANALIS_PERTAMA to assign', () => {
      expect(service.canAssignTask(SIAP_ROLES.ANALIS_PERTAMA)).toBe(false);
    });

    it('should NOT allow PENELAAH to assign', () => {
      expect(service.canAssignTask(SIAP_ROLES.PENELAAH)).toBe(false);
    });

    it('should NOT allow OPD to assign', () => {
      expect(service.canAssignTask(SIAP_ROLES.OPD)).toBe(false);
    });
  });

  describe('canPerformBusinessAction', () => {
    it('should NOT allow ADMIN_BKPSDM for any business action', () => {
      expect(
        service.canPerformBusinessAction(SIAP_ROLES.ADMIN_BKPSDM, 'ASSIGN_TASK'),
      ).toBe(false);
      expect(
        service.canPerformBusinessAction(SIAP_ROLES.ADMIN_BKPSDM, 'APPROVE_TASK'),
      ).toBe(false);
    });

    it('should allow KABID for ASSIGN_TASK', () => {
      expect(
        service.canPerformBusinessAction(SIAP_ROLES.KABID, 'ASSIGN_TASK'),
      ).toBe(true);
    });

    it('should allow KABID for APPROVE_TASK', () => {
      expect(
        service.canPerformBusinessAction(SIAP_ROLES.KABID, 'APPROVE_TASK'),
      ).toBe(true);
    });

    it('should allow ANALIS_PERTAMA for COMPLETE_TASK', () => {
      expect(
        service.canPerformBusinessAction(
          SIAP_ROLES.ANALIS_PERTAMA,
          'COMPLETE_TASK',
        ),
      ).toBe(true);
    });

    it('should NOT allow ANALIS_PERTAMA for ASSIGN_TASK', () => {
      expect(
        service.canPerformBusinessAction(SIAP_ROLES.ANALIS_PERTAMA, 'ASSIGN_TASK'),
      ).toBe(false);
    });
  });

  describe('reassignTask', () => {
    it('should throw error if user role cannot reassign', async () => {
      await expect(
        service.reassignTask('task-123', 'user-456', 'user-100', SIAP_ROLES.ANALIS_MUDA),
      ).rejects.toThrow(
        'Role ANALIS_MUDA tidak boleh melakukan reassign task',
      );
    });

    it('should throw error if target assignee not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.reassignTask('task-123', 'user-invalid', 'user-100', SIAP_ROLES.KABID),
      ).rejects.toThrow('User user-invalid not found');
    });

    it('should successfully reassign task if all validation pass', async () => {
      const mockAssignee = {
        id: 'user-456',
        userRoles: [{ role: { code: SIAP_ROLES.ANALIS_PERTAMA } }],
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockAssignee as any);
      jest.spyOn(prismaService.siapTask, 'update').mockResolvedValue({
        id: 'task-123',
        assignedTo: 'user-456',
      } as any);

      const result = await service.reassignTask(
        'task-123',
        'user-456',
        'user-100',
        SIAP_ROLES.KABID,
      );

      expect(result.assignedTo).toBe('user-456');
    });
  });
});
```

---

## **FASE 2: AUTO-ASSIGNMENT BERBASIS BEBAN KERJA**

### **Task 2.1: Repository Method untuk Workload**

**File:** `api/src/siap/repositories/siap-task.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { SIAP_ACTIVE_TASK_STATUSES } from '../constants/siap-roles.constant';

export interface UserWorkload {
  userId: string;
  userName: string;
  activeTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  avgCompletionHours: number;
}

@Injectable()
export class SiapTaskRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Hitung jumlah task aktif per user
   * 
   * Task aktif = status dalam: ASSIGNED, IN_PROGRESS, WAITING, RETURNED, OVERDUE
   * 
   * @param userId - User ID
   * @returns Jumlah task aktif
   */
  async countActiveTasksByUser(userId: string): Promise<number> {
    return await this.prisma.siapTask.count({
      where: {
        assignedTo: userId,
        status: {
          in: SIAP_ACTIVE_TASK_STATUSES,
        },
      },
    });
  }

  /**
   * Hitung jumlah task selesai per user
   * 
   * @param userId - User ID
   * @param fromDate - Optional: filter dari tanggal
   * @returns Jumlah task selesai
   */
  async countCompletedTasksByUser(
    userId: string,
    fromDate?: Date,
  ): Promise<number> {
    return await this.prisma.siapTask.count({
      where: {
        assignedTo: userId,
        status: {
          in: ['COMPLETED', 'APPROVED', 'REJECTED'],
        },
        completedAt: fromDate ? { gte: fromDate } : undefined,
      },
    });
  }

  /**
   * Hitung jumlah task terlambat per user
   * 
   * @param userId - User ID
   * @returns Jumlah task overdue
   */
  async countOverdueTasksByUser(userId: string): Promise<number> {
    return await this.prisma.siapTask.count({
      where: {
        assignedTo: userId,
        status: {
          in: SIAP_ACTIVE_TASK_STATUSES,
        },
        dueDate: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Hitung rata-rata waktu penyelesaian task user
   * 
   * @param userId - User ID
   * @returns Rata-rata jam
   */
  async avgCompletionTimeByUser(userId: string): Promise<number> {
    const tasks = await this.prisma.siapTask.findMany({
      where: {
        assignedTo: userId,
        status: {
          in: ['COMPLETED', 'APPROVED', 'REJECTED'],
        },
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    if (tasks.length === 0) return 0;

    const totalHours = tasks.reduce((sum, task) => {
      if (!task.startedAt || !task.completedAt) return sum;
      const diffMs = task.completedAt.getTime() - task.startedAt.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return sum + diffHours;
    }, 0);

    return totalHours / tasks.length;
  }

  /**
   * Cari user aktif dengan beban kerja paling ringan dalam role/pool tertentu
   * 
   * Algoritma:
   * 1. Filter user dengan role target yang aktif
   * 2. Hitung task aktif per user
   * 3. Urutkan ascending (paling sedikit task duluan)
   * 4. Jika task sama, urutkan berdasarkan due date paling ringan
   * 5. Return user dengan beban paling ringan
   * 
   * @param roleCode - Role code untuk filter
   * @param excludeUserIds - Optional: user IDs yang dikecualikan (e.g. PPPK Paruh Waktu)
   * @returns User ID dengan beban paling ringan
   */
  async findLeastLoadedActiveUserByRole(
    roleCode: string,
    excludeUserIds?: string[],
  ): Promise<string | null> {
    // 1. Cari semua user dengan role target yang aktif
    const activeUsers = await this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              code: roleCode,
            },
          },
        },
        isActive: true,
        ...(excludeUserIds && excludeUserIds.length > 0
          ? { id: { notIn: excludeUserIds } }
          : {}),
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (activeUsers.length === 0) {
      return null;
    }

    // 2. Hitung workload per user
    const userWorkloads = await Promise.all(
      activeUsers.map(async (user) => ({
        userId: user.id,
        name: user.name,
        activeCount: await this.countActiveTasksByUser(user.id),
        earliestDueDate: await this.getEarliestDueDate(user.id),
      })),
    );

    // 3. Sort: active count ascending, then earliest due date
    userWorkloads.sort((a, b) => {
      // First: compare active task count
      if (a.activeCount !== b.activeCount) {
        return a.activeCount - b.activeCount;
      }
      // Second: compare earliest due date
      if (a.earliestDueDate && b.earliestDueDate) {
        return (
          a.earliestDueDate.getTime() - b.earliestDueDate.getTime()
        );
      }
      // If one has no due date, prioritize the one with due date
      if (a.earliestDueDate) return 1;
      if (b.earliestDueDate) return -1;
      return 0;
    });

    return userWorkloads[0].userId;
  }

  /**
   * Helper: Dapatkan due date paling awal dari task aktif user
   * 
   * @param userId - User ID
   * @returns Earliest due date atau null
   */
  private async getEarliestDueDate(userId: string): Promise<Date | null> {
    const task = await this.prisma.siapTask.findFirst({
      where: {
        assignedTo: userId,
        status: {
          in: SIAP_ACTIVE_TASK_STATUSES,
        },
        dueDate: { not: null },
      },
      orderBy: {
        dueDate: 'asc',
      },
      select: {
        dueDate: true,
      },
    });

    return task?.dueDate || null;
  }

  /**
   * Get workload summary untuk satu user
   * 
   * @param userId - User ID
   * @returns Workload summary
   */
  async getUserWorkloadSummary(userId: string): Promise<UserWorkload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const activeTaskCount = await this.countActiveTasksByUser(userId);
    const completedTaskCount = await this.countCompletedTasksByUser(userId);
    const overdueTaskCount = await this.countOverdueTasksByUser(userId);
    const avgCompletionHours = await this.avgCompletionTimeByUser(userId);

    return {
      userId: user.id,
      userName: user.name,
      activeTaskCount,
      completedTaskCount,
      overdueTaskCount,
      avgCompletionHours,
    };
  }

  /**
   * Get workload summary untuk semua user dalam role tertentu
   * 
   * @param roleCode - Role code
   * @returns Array of workload summary
   */
  async getTeamWorkloadSummary(roleCode: string): Promise<UserWorkload[]> {
    const users = await this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              code: roleCode,
            },
          },
        },
        isActive: true,
      },
      select: { id: true },
    });

    return await Promise.all(
      users.map((user) => this.getUserWorkloadSummary(user.id)),
    );
  }
}
```

---

### **Task 2.2: Assignment Service**

**File:** `api/src/siap/services/siap-assignment.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { SiapTaskRepository } from '../repositories/siap-task.repository';
import {
  SIAP_WORKLOAD_POOL_ROLES,
  SIAP_ACTIVE_TASK_STATUSES,
} from '../constants/siap-roles.constant';

export interface AssignmentResult {
  taskId: string;
  assignedToUserId: string;
  assignedToUserName: string;
  assignedAt: Date;
  assignmentMethod: 'AUTO_LEAST_LOADED' | 'MANUAL' | 'SYSTEM_DEFAULT';
  workloadAtAssignment: number;
}

@Injectable()
export class SiapAssignmentService {
  constructor(
    private prisma: PrismaService,
    private taskRepository: SiapTaskRepository,
  ) {}

  /**
   * Auto-assign task ke user dengan beban kerja paling ringan dalam pool
   * 
   * Proses:
   * 1. Validate task ada dan belum di-assign
   * 2. Cari user dengan role/pool dan beban ringan
   * 3. Assign task ke user
   * 4. Record assignment di timeline
   * 
   * @param taskId - Task ID
   * @param poolRoles - Array role yang eligible untuk assignment (default: ANALIS_PERTAMA_POOL)
   * @param excludeUserIds - User yang dikecualikan
   * @returns Assignment result
   */
  async autoAssignTaskToLeastLoaded(
    taskId: string,
    poolRoles: string[] = SIAP_WORKLOAD_POOL_ROLES,
    excludeUserIds?: string[],
  ): Promise<AssignmentResult> {
    // 1. Validate task exists and not yet assigned
    const task = await this.prisma.siapTask.findUnique({
      where: { id: taskId },
      include: { case: true },
    });

    if (!task) {
      throw new BadRequestException(`Task ${taskId} not found`);
    }

    if (task.assignedTo) {
      throw new BadRequestException(
        `Task ${taskId} sudah di-assign ke ${task.assignedTo}`,
      );
    }

    // 2. Try each pool role to find user with least loaded
    let assignedUserId: string | null = null;
    let selectedRole: string | null = null;

    for (const roleCode of poolRoles) {
      const userId = await this.taskRepository.findLeastLoadedActiveUserByRole(
        roleCode,
        excludeUserIds,
      );
      if (userId) {
        assignedUserId = userId;
        selectedRole = roleCode;
        break;
      }
    }

    if (!assignedUserId) {
      throw new BadRequestException(
        `Tidak ada user aktif dengan role ${poolRoles.join(', ')} untuk assignment`,
      );
    }

    // 3. Assign task
    const assignedUser = await this.prisma.user.findUnique({
      where: { id: assignedUserId },
    });

    const updatedTask = await this.prisma.siapTask.update({
      where: { id: taskId },
      data: {
        assignedTo: assignedUserId,
        assignedAt: new Date(),
        status: 'ASSIGNED',
      },
    });

    // 4. Record timeline
    await this.prisma.timeline.create({
      data: {
        caseId: task.caseId,
        eventType: 'TASK_AUTO_ASSIGNED',
        description: `Task otomatis di-assign ke ${assignedUser?.name} (${selectedRole}) - beban: ${await this.taskRepository.countActiveTasksByUser(assignedUserId)} task aktif`,
        actor: 'SYSTEM',
        actorId: 'SYSTEM',
      },
    });

    // 5. Get workload at assignment time
    const workloadAtAssignment = await this.taskRepository.countActiveTasksByUser(
      assignedUserId,
    );

    return {
      taskId: updatedTask.id,
      assignedToUserId: assignedUserId,
      assignedToUserName: assignedUser?.name || 'Unknown',
      assignedAt: updatedTask.assignedAt || new Date(),
      assignmentMethod: 'AUTO_LEAST_LOADED',
      workloadAtAssignment,
    };
  }

  /**
   * Manual assignment dengan validation RBAC
   * 
   * @param taskId - Task ID
   * @param assignToUserId - Target user ID
   * @param assignedByUserId - User yang melakukan assignment
   * @param assignedByRole - Role user yang melakukan assignment
   * @returns Assignment result
   */
  async manualAssignTask(
    taskId: string,
    assignToUserId: string,
    assignedByUserId: string,
    assignedByRole: string,
  ): Promise<AssignmentResult> {
    // Validate task
    const task = await this.prisma.siapTask.findUnique({
      where: { id: taskId },
      include: { case: true },
    });

    if (!task) {
      throw new BadRequestException(`Task ${taskId} not found`);
    }

    // Validate target user exists and active
    const targetUser = await this.prisma.user.findUnique({
      where: { id: assignToUserId },
    });

    if (!targetUser) {
      throw new BadRequestException(`User ${assignToUserId} not found`);
    }

    if (!targetUser.isActive) {
      throw new BadRequestException(
        `User ${targetUser.name} tidak aktif dan tidak bisa menerima assignment`,
      );
    }

    // Update task
    const updatedTask = await this.prisma.siapTask.update({
      where: { id: taskId },
      data: {
        assignedTo: assignToUserId,
        assignedBy: assignedByUserId,
        assignedAt: new Date(),
        status: 'ASSIGNED',
      },
    });

    // Record timeline
    const assignedByUser = await this.prisma.user.findUnique({
      where: { id: assignedByUserId },
    });

    await this.prisma.timeline.create({
      data: {
        caseId: task.caseId,
        eventType: 'TASK_MANUALLY_ASSIGNED',
        description: `Task di-reassign ke ${targetUser.name} oleh ${assignedByUser?.name} (${assignedByRole})`,
        actor: assignedByRole,
        actorId: assignedByUserId,
      },
    });

    // Get workload
    const workloadAtAssignment = await this.taskRepository.countActiveTasksByUser(
      assignToUserId,
    );

    return {
      taskId: updatedTask.id,
      assignedToUserId: assignToUserId,
      assignedToUserName: targetUser.name,
      assignedAt: updatedTask.assignedAt || new Date(),
      assignmentMethod: 'MANUAL',
      workloadAtAssignment,
    };
  }
}
```

---

### **Task 2.3: Update CreateTask untuk OPD → SIAP**

**File:** `api/src/siap/services/siap.service.ts` (updated method)

```typescript
/**
 * Create task untuk transition pertama workflow
 * 
 * PERUBAHAN PENTING:
 * - Assignment LANGSUNG ke pool teknis dengan beban ringan (bukan ke ADMIN_BKPSDM)
 * - Auto-assignment menggunakan metode least-loaded workload
 * - Timeline mencatat assignment otomatis
 * 
 * @param siapCaseId - SIAP Case ID
 * @param workflowTransition - Workflow transition definition
 */
async createTaskForFirstTransition(
  siapCaseId: string,
  workflowTransition: any,
) {
  // 1. Create task dengan status UNASSIGNED dulu
  const task = await this.prisma.siapTask.create({
    data: {
      caseId: siapCaseId,
      taskType: workflowTransition.actionCode,
      status: 'UNASSIGNED', // Will be updated after assignment
      priority: 'NORMAL',
      dueDate: this.calculateDueDate(workflowTransition.slaDays),
      description: workflowTransition.description,
    },
  });

  console.log(`[SIAP] Task created (unassigned): ${task.id}`);

  // 2. Auto-assign ke pool teknis dengan beban paling ringan
  try {
    const assignmentResult = await this.assignmentService.autoAssignTaskToLeastLoaded(
      task.id,
      [workflowTransition.allowedRole], // Use role from transition as pool
    );

    console.log(
      `[SIAP] Task auto-assigned to ${assignmentResult.assignedToUserName} (workload: ${assignmentResult.workloadAtAssignment})`,
    );

    return {
      taskId: task.id,
      assignedTo: assignmentResult.assignedToUserId,
      assignedToName: assignmentResult.assignedToUserName,
      assignmentMethod: 'AUTO_LEAST_LOADED',
      workloadAtAssignment: assignmentResult.workloadAtAssignment,
    };
  } catch (error) {
    console.error(`[SIAP] Auto-assignment failed: ${error.message}`);

    // Fallback: jangan fail keseluruhan, task tetap ada tapi unassigned
    // Admin atau system dapat reassign manual nanti
    await this.prisma.timeline.create({
      data: {
        caseId: siapCaseId,
        eventType: 'TASK_ASSIGNMENT_FAILED',
        description: `Auto-assignment gagal: ${error.message}. Perlu manual assignment.`,
        actor: 'SYSTEM',
        actorId: 'SYSTEM',
      },
    });

    return {
      taskId: task.id,
      assignedTo: null,
      assignedToName: null,
      assignmentMethod: null,
      error: error.message,
    };
  }
}

/**
 * Update submitCase untuk OPD Submission
 * Dipanggil dari OpdSubmissionService.submitMine
 */
async submitCaseFromOpdSubmission(opdSubmissionId: string) {
  const opdSubmission = await this.prisma.opdSubmission.findUnique({
    where: { id: opdSubmissionId },
  });

  if (!opdSubmission) {
    throw new NotFoundException(`OPD Submission ${opdSubmissionId} not found`);
  }

  // 1. Create SIAP Case
  const siapCase = await this.prisma.siapCase.create({
    data: {
      caseNumber: this.generateCaseNumber(),
      serviceType: opdSubmission.serviceType,
      currentState: 'DRAFT',
      status: 'ACTIVE',
      priority: 'NORMAL',
      asnId: opdSubmission.opdUserId,
    },
  });

  console.log(`[SIAP] Case created: ${siapCase.caseNumber}`);

  // 2. Submit case (update state)
  const updatedCase = await this.prisma.siapCase.update({
    where: { id: siapCase.id },
    data: {
      currentState: 'VERIFIKASI_AWAL', // Changed from VERIFIKASI_ADMIN
    },
  });

  // 3. Get workflow transition definition
  const transition = await this.prisma.workflowTransition.findFirst({
    where: {
      fromState: 'DRAFT',
      toState: 'VERIFIKASI_AWAL',
    },
  });

  // 4. Create and auto-assign task
  let taskResult: any;
  if (transition) {
    taskResult = await this.createTaskForFirstTransition(
      siapCase.id,
      transition,
    );
  }

  // 5. Update OPD Submission dengan siapCaseId
  await this.prisma.opdSubmission.update({
    where: { id: opdSubmissionId },
    data: {
      siapCaseId: siapCase.id,
    },
  });

  // 6. Create timeline
  await this.prisma.timeline.create({
    data: {
      caseId: siapCase.id,
      eventType: 'SIAP_CASE_CREATED',
      description: `SIAP Case dibuat dari OPD Submission ${opdSubmission.submissionNumber}`,
      actor: 'SYSTEM',
      actorId: 'SYSTEM',
    },
  });

  if (taskResult) {
    await this.prisma.timeline.create({
      data: {
        caseId: siapCase.id,
        eventType: 'TASK_CREATED_AND_ASSIGNED',
        description: `Task otomatis dibuat dan di-assign ke ${taskResult.assignedToName || 'Pending'}`,
        actor: 'SYSTEM',
        actorId: 'SYSTEM',
      },
    });
  }

  return {
    siapCaseId: siapCase.id,
    caseNumber: siapCase.caseNumber,
    currentState: updatedCase.currentState,
    task: taskResult || null,
  };
}
```

---

### **Task 2.4: E2E Test OPD → SIAP**

**File:** `api/src/opd-submission/opd-submission.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/database/prisma.service';
import { SIAP_ROLES } from 'src/siap/constants/siap-roles.constant';

describe('OPD → SIAP Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let opdUserId: string;
  let analisPertamaUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Setup test data
    // Create OPD user
    const opdUser = await prisma.user.create({
      data: {
        name: 'OPD Test User',
        email: 'opd@test.gov.id',
        isActive: true,
        userRoles: {
          create: {
            roleId: (
              await prisma.role.findUnique({
                where: { code: SIAP_ROLES.OPD },
              })
            )?.id,
          },
        },
      },
    });
    opdUserId = opdUser.id;

    // Create Analis Pertama user
    const analisPertamaUser = await prisma.user.create({
      data: {
        name: 'Analis Pertama Test',
        email: 'analis@test.gov.id',
        isActive: true,
        userRoles: {
          create: {
            roleId: (
              await prisma.role.findUnique({
                where: { code: SIAP_ROLES.ANALIS_PERTAMA },
              })
            )?.id,
          },
        },
      },
    });
    analisPertamaUserId = analisPertamaUser.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('OPD Submit → SIAP Case Creation → Task Auto-Assignment', () => {
    it('should create OPD Submission in DRAFT state', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/opd-submissions')
        .set('Authorization', `Bearer ${opdUserId}`)
        .send({
          serviceType: 'MUTASI_JABATAN',
          moduleKey: 'kepegawaian',
          description: 'Pengajuan mutasi jabatan',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('DRAFT');
    });

    it('should submit OPD and auto-create SIAP Case', async () => {
      // First create OPD Submission
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/opd-submissions')
        .set('Authorization', `Bearer ${opdUserId}`)
        .send({
          serviceType: 'MUTASI_JABATAN',
          moduleKey: 'kepegawaian',
          description: 'Pengajuan mutasi jabatan',
        });

      const submissionId = createRes.body.id;

      // Then submit it
      const submitRes = await request(app.getHttpServer())
        .post(`/api/v1/opd-submissions/${submissionId}/submit`)
        .set('Authorization', `Bearer ${opdUserId}`);

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.status).toBe('SUBMITTED');
      expect(submitRes.body.siapCaseId).toBeDefined();
    });

    it('should create SIAP Task and auto-assign to least-loaded Analis Pertama', async () => {
      // Create and submit OPD
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/opd-submissions')
        .set('Authorization', `Bearer ${opdUserId}`)
        .send({
          serviceType: 'MUTASI_JABATAN',
          moduleKey: 'kepegawaian',
        });

      const submissionId = createRes.body.id;

      const submitRes = await request(app.getHttpServer())
        .post(`/api/v1/opd-submissions/${submissionId}/submit`)
        .set('Authorization', `Bearer ${opdUserId}`);

      const siapCaseId = submitRes.body.siapCaseId;

      // Verify SIAP Case created
      const siapCase = await prisma.siapCase.findUnique({
        where: { id: siapCaseId },
      });

      expect(siapCase).toBeDefined();
      expect(siapCase?.currentState).toBe('VERIFIKASI_AWAL');

      // Verify Task created and assigned
      const tasks = await prisma.siapTask.findMany({
        where: { caseId: siapCaseId },
      });

      expect(tasks.length).toBeGreaterThan(0);
      
      const firstTask = tasks[0];
      expect(firstTask.assignedTo).toBeDefined();
      expect(firstTask.assignedTo).toBe(analisPertamaUserId);
      expect(firstTask.status).toBe('ASSIGNED');
    });

    it('should NOT allow ADMIN_BKPSDM in initial workflow', async () => {
      // Create ADMIN_BKPSDM user
      const adminUser = await prisma.user.create({
        data: {
          name: 'Admin BKPSDM Test',
          email: 'admin@bkpsdm.gov.id',
          isActive: true,
          userRoles: {
            create: {
              roleId: (
                await prisma.role.findUnique({
                  where: { code: SIAP_ROLES.ADMIN_BKPSDM },
                })
              )?.id,
            },
          },
        },
      });

      // Try to assign task as ADMIN_BKPSDM
      const task = await prisma.siapTask.findFirst({
        where: { assignedTo: null },
      });

      if (task) {
        const res = await request(app.getHttpServer())
          .post(`/api/v1/siap/tasks/${task.id}/assign`)
          .set('Authorization', `Bearer ${adminUser.id}`)
          .send({ assignToUserId: analisPertamaUserId });

        expect(res.status).toBe(403);
        expect(res.body.message).toContain('tidak diizinkan');
      }
    });

    it('should only allow KABID for manual reassignment', async () => {
      // Create KABID user
      const kabidUser = await prisma.user.create({
        data: {
          name: 'Kabid Test',
          email: 'kabid@test.gov.id',
          isActive: true,
          userRoles: {
            create: {
              roleId: (
                await prisma.role.findUnique({
                  where: { code: SIAP_ROLES.KABID },
                })
              )?.id,
            },
          },
        },
      });

      // Create another Analis Pertama
      const otherAnalisUser = await prisma.user.create({
        data: {
          name: 'Other Analis Pertama',
          email: 'other-analis@test.gov.id',
          isActive: true,
          userRoles: {
            create: {
              roleId: (
                await prisma.role.findUnique({
                  where: { code: SIAP_ROLES.ANALIS_PERTAMA },
                })
              )?.id,
            },
          },
        },
      });

      // Get assigned task
      const task = await prisma.siapTask.findFirst({
        where: { assignedTo: { not: null } },
      });

      if (task) {
        // KABID can reassign
        const res = await request(app.getHttpServer())
          .post(`/api/v1/siap/tasks/${task.id}/assign`)
          .set('Authorization', `Bearer ${kabidUser.id}`)
          .send({ assignToUserId: otherAnalisUser.id });

        expect(res.status).toBe(200);
        expect(res.body.assignedToUserId).toBe(otherAnalisUser.id);
      }
    });
  });
});
```

---

## **FASE 3: DASHBOARD PEMERATAAN KERJA**

### **Task 3.1: Backend Endpoint**

**File:** `api/src/siap/controllers/siap-workload.controller.ts`

```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { SiapWorkloadService } from '../services/siap-workload.service';
import { SIAP_SUPERVISOR_ROLES } from '../constants/siap-roles.constant';

@Controller('api/v1/siap/workload')
@UseGuards(JwtAuthGuard)
export class SiapWorkloadController {
  constructor(private workloadService: SiapWorkloadService) {}

  /**
   * GET /api/v1/siap/workload/my
   * 
   * Get workload summary untuk current user
   * 
   * Response:
   * {
   *   userId: string,
   *   userName: string,
   *   activeTaskCount: number,
   *   completedTaskCount: number,
   *   completedThisMonth: number,
   *   overdueTaskCount: number,
   *   avgCompletionHours: number,
   *   workloadScore: number (0-100),
   *   canViewTeam: boolean
   * }
   */
  @Get('my')
  async getMyWorkload(@CurrentUser() user: User) {
    return await this.workloadService.getUserWorkloadWithScore(user.id);
  }

  /**
   * GET /api/v1/siap/workload/team
   * 
   * Get workload summary untuk semua user dalam team/role
   * Hanya bisa diakses oleh KABID dan ANALIS_MADYA
   * 
   * Query:
   * - roleCode: string (optional, default: semua)
   * 
   * Response:
   * {
   *   teamRole: string,
   *   members: [{
   *     userId: string,
   *     userName: string,
   *     activeTaskCount: number,
   *     completedTaskCount: number,
   *     overdueTaskCount: number,
   *     workloadScore: number,
   *     status: 'UNDERLOAD' | 'BALANCED' | 'OVERLOAD'
   *   }],
   *   teamStats: {
   *     totalActiveTask: number,
   *     totalCompletedTask: number,
   *     totalOverdueTask: number,
   *     avgWorkloadScore: number,
   *     imbalanceLevel: 'LOW' | 'MEDIUM' | 'HIGH'
   *   }
   * }
   */
  @Get('team')
  async getTeamWorkload(
    @CurrentUser() user: User,
    @Query('roleCode') roleCode?: string,
  ) {
    // Verify permission
    if (!SIAP_SUPERVISOR_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        `Role ${user.role} tidak bisa melihat team workload`,
      );
    }

    return await this.workloadService.getTeamWorkloadWithBalance(
      user.id,
      roleCode,
    );
  }

  /**
   * GET /api/v1/siap/workload/dashboard
   * 
   * Get comprehensive dashboard data
   * Hanya untuk KABID dan supervisor
   * 
   * Response:
   * {
   *   summary: { ... },
   *   workloadDistribution: [ ... ],
   *   serviceTypeDistribution: [ ... ],
   *   overloadedUsers: [ ... ],
   *   underloadedUsers: [ ... ],
   *   overdueAlerts: [ ... ],
   *   recommendations: [ ... ]
   * }
   */
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: User) {
    if (!SIAP_SUPERVISOR_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        `Role ${user.role} tidak bisa melihat dashboard pemerataan`,
      );
    }

    return await this.workloadService.getDashboardData(user.id);
  }

  /**
   * GET /api/v1/siap/workload/my-team
   * 
   * Get team workload untuk direct reports user
   * Difilter berdasarkan unit kerja user
   */
  @Get('my-team')
  async getMyTeamWorkload(@CurrentUser() user: User) {
    if (!SIAP_SUPERVISOR_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        `Role ${user.role} tidak bisa melihat team workload`,
      );
    }

    return await this.workloadService.getMyTeamWorkloadSummary(user.id);
  }
}
```

**File:** `api/src/siap/services/siap-workload.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { SiapTaskRepository } from '../repositories/siap-task.repository';

export interface WorkloadWithScore {
  userId: string;
  userName: string;
  role: string;
  activeTaskCount: number;
  completedTaskCount: number;
  completedThisMonth: number;
  overdueTaskCount: number;
  avgCompletionHours: number;
  workloadScore: number; // 0-100
  status: 'UNDERLOAD' | 'BALANCED' | 'OVERLOAD';
  canViewTeam: boolean;
}

export interface TeamMemberWorkload {
  userId: string;
  userName: string;
  role: string;
  activeTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  workloadScore: number;
  status: 'UNDERLOAD' | 'BALANCED' | 'OVERLOAD';
}

export interface TeamWorkloadSummary {
  teamRole: string;
  totalMembers: number;
  members: TeamMemberWorkload[];
  teamStats: {
    totalActiveTask: number;
    totalCompletedTask: number;
    totalOverdueTask: number;
    avgWorkloadScore: number;
    imbalanceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

@Injectable()
export class SiapWorkloadService {
  constructor(
    private prisma: PrismaService,
    private taskRepository: SiapTaskRepository,
  ) {}

  /**
   * Calculate workload score untuk user
   * 
   * Formula:
   * score = (activeTask / avgTaskPerPerson) * 100
   * 
   * Jika average task per person = 5, dan user punya 3 task:
   * score = (3/5) * 100 = 60 (BALANCED)
   * 
   * score < 40: UNDERLOAD
   * score 40-80: BALANCED
   * score > 80: OVERLOAD
   * 
   * @param activeTaskCount - Jumlah task aktif user
   * @param avgTaskCount - Rata-rata task dalam team/role
   * @returns score (0-100) dan status
   */
  private calculateWorkloadScore(
    activeTaskCount: number,
    avgTaskCount: number,
  ): { score: number; status: 'UNDERLOAD' | 'BALANCED' | 'OVERLOAD' } {
    let score: number;

    if (avgTaskCount === 0) {
      score = activeTaskCount * 100; // Jika tidak ada baseline, assume worst case
    } else {
      score = (activeTaskCount / avgTaskCount) * 100;
    }

    // Cap score at 200
    score = Math.min(score, 200);

    let status: 'UNDERLOAD' | 'BALANCED' | 'OVERLOAD';
    if (score < 40) {
      status = 'UNDERLOAD';
    } else if (score <= 80) {
      status = 'BALANCED';
    } else {
      status = 'OVERLOAD';
    }

    return { score: Math.round(score), status };
  }

  /**
   * Get detailed workload untuk user dengan score
   */
  async getUserWorkloadWithScore(userId: string): Promise<WorkloadWithScore> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const workload = await this.taskRepository.getUserWorkloadSummary(userId);

    // Calculate avg task count untuk role user
    const userRoles = user.userRoles.map((ur) => ur.role.code);
    const avgActiveTask = await this.calculateAverageActiveTaskByRoles(
      userRoles,
    );

    const { score, status } = this.calculateWorkloadScore(
      workload.activeTaskCount,
      avgActiveTask,
    );

    // Count completed this month
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const completedThisMonth = await this.taskRepository.countCompletedTasksByUser(
      userId,
      thisMonthStart,
    );

    return {
      userId: user.id,
      userName: user.name,
      role: userRoles.join(', '),
      ...workload,
      completedThisMonth,
      workloadScore: score,
      status,
      canViewTeam: ['KABID', 'ANALIS_MADYA'].includes(userRoles[0] || ''),
    };
  }

  /**
   * Calculate average active task count untuk roles
   */
  private async calculateAverageActiveTaskByRoles(
    roleCodes: string[],
  ): Promise<number> {
    const users = await this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              code: {
                in: roleCodes,
              },
            },
          },
        },
        isActive: true,
      },
      select: { id: true },
    });

    if (users.length === 0) return 0;

    let totalTasks = 0;
    for (const user of users) {
      totalTasks += await this.taskRepository.countActiveTasksByUser(user.id);
    }

    return Math.round(totalTasks / users.length);
  }

  /**
   * Get team workload dengan balance analysis
   */
  async getTeamWorkloadWithBalance(
    supervisorUserId: string,
    roleCode?: string,
  ): Promise<TeamWorkloadSummary> {
    // Get team members berdasarkan role atau unit kerja supervisor
    let teamUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        userRoles: {
          some: {
            role: {
              code: roleCode,
            },
          },
        },
      },
      select: { id: true, name: true, userRoles: { include: { role: true } } },
    });

    if (teamUsers.length === 0) {
      return {
        teamRole: roleCode || 'UNKNOWN',
        totalMembers: 0,
        members: [],
        teamStats: {
          totalActiveTask: 0,
          totalCompletedTask: 0,
          totalOverdueTask: 0,
          avgWorkloadScore: 0,
          imbalanceLevel: 'LOW',
        },
      };
    }

    // Calculate workload untuk setiap member
    const memberWorkloads: TeamMemberWorkload[] = [];
    let totalActiveTask = 0;
    let totalCompletedTask = 0;
    let totalOverdueTask = 0;
    let totalScores = 0;

    const avgActiveTask = await this.calculateAverageActiveTaskByRoles([
      roleCode || 'ANALIS_PERTAMA',
    ]);

    for (const user of teamUsers) {
      const workload = await this.taskRepository.getUserWorkloadSummary(user.id);
      const { score, status } = this.calculateWorkloadScore(
        workload.activeTaskCount,
        avgActiveTask,
      );

      memberWorkloads.push({
        userId: user.id,
        userName: user.name,
        role: user.userRoles[0]?.role.code || 'UNKNOWN',
        ...workload,
        workloadScore: score,
        status,
      });

      totalActiveTask += workload.activeTaskCount;
      totalCompletedTask += workload.completedTaskCount;
      totalOverdueTask += workload.overdueTaskCount;
      totalScores += score;
    }

    // Calculate imbalance level
    const scores = memberWorkloads.map((m) => m.workloadScore);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const imbalance = maxScore - minScore;

    let imbalanceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (imbalance < 20) {
      imbalanceLevel = 'LOW';
    } else if (imbalance < 50) {
      imbalanceLevel = 'MEDIUM';
    } else {
      imbalanceLevel = 'HIGH';
    }

    // Sort by score descending (overloaded first)
    memberWorkloads.sort((a, b) => b.workloadScore - a.workloadScore);

    return {
      teamRole: roleCode || 'TEAM',
      totalMembers: teamUsers.length,
      members: memberWorkloads,
      teamStats: {
        totalActiveTask,
        totalCompletedTask,
        totalOverdueTask,
        avgWorkloadScore: Math.round(totalScores / teamUsers.length),
        imbalanceLevel,
      },
    };
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(supervisorUserId: string) {
    const supervisor = await this.prisma.user.findUnique({
      where: { id: supervisorUserId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!supervisor) {
      throw new Error(`Supervisor ${supervisorUserId} not found`);
    }

    const supervisorRoles = supervisor.userRoles.map((ur) => ur.role.code);

    // Get team summary
    const teamWorkload = await this.getTeamWorkloadWithBalance(
      supervisorUserId,
    );

    // Get overloaded users
    const overloadedUsers = teamWorkload.members.filter(
      (m) => m.status === 'OVERLOAD',
    );

    // Get underloaded users
    const underloadedUsers = teamWorkload.members.filter(
      (m) => m.status === 'UNDERLOAD',
    );

    // Get overdue alerts
    const overdueTasks = await this.prisma.siapTask.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RETURNED', 'OVERDUE'],
        },
      },
      include: { assignedToUser: true, case: true },
      take: 10,
    });

    // Service type distribution
    const serviceDistribution = await this.prisma.siapTask.groupBy({
      by: ['taskType'],
      _count: true,
      where: {
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RETURNED', 'OVERDUE'],
        },
      },
    });

    return {
      summary: {
        totalActiveTask: teamWorkload.teamStats.totalActiveTask,
        totalCompletedTask: teamWorkload.teamStats.totalCompletedTask,
        totalOverdueTask: teamWorkload.teamStats.totalOverdueTask,
        avgWorkloadScore: teamWorkload.teamStats.avgWorkloadScore,
        imbalanceLevel: teamWorkload.teamStats.imbalanceLevel,
      },
      workloadDistribution: teamWorkload.members,
      serviceTypeDistribution: serviceDistribution,
      overloadedUsers,
      underloadedUsers,
      overdueAlerts: overdueTasks.map((t) => ({
        taskId: t.id,
        caseNumber: t.case?.caseNumber,
        assignedTo: t.assignedToUser?.name,
        daysOverdue: Math.ceil(
          (new Date().getTime() - t.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      })),
      recommendations: this.generateRecommendations(overloadedUsers, underloadedUsers),
    };
  }

  /**
   * Generate recommendations untuk rebalancing
   */
  private generateRecommendations(
    overloadedUsers: TeamMemberWorkload[],
    underloadedUsers: TeamMemberWorkload[],
  ): string[] {
    const recommendations: string[] = [];

    if (overloadedUsers.length > 0 && underloadedUsers.length > 0) {
      recommendations.push(
        `Pertimbangkan reassign task dari ${overloadedUsers[0].userName} (${overloadedUsers[0].workloadScore} poin) ke ${underloadedUsers[0].userName} (${underloadedUsers[0].workloadScore} poin)`,
      );
    }

    if (overloadedUsers.length >= 2) {
      recommendations.push(
        `${overloadedUsers.length} pegawai dalam kondisi overload. Pertimbangkan penambahan staf atau optimalisasi proses.`,
      );
    }

    const idleCount = underloadedUsers.filter((u) => u.activeTaskCount === 0)
      .length;
    if (idleCount > 0) {
      recommendations.push(
        `${idleCount} pegawai tidak memiliki task aktif. Pertimbangkan assignment task baru atau training.`,
      );
    }

    return recommendations;
  }

  /**
   * Get my team workload summary
   */
  async getMyTeamWorkloadSummary(supervisorUserId: string) {
    const supervisor = await this.prisma.user.findUnique({
      where: { id: supervisorUserId },
      include: { unitKerja: true },
    });

    if (!supervisor) {
      throw new Error(`Supervisor ${supervisorUserId} not found`);
    }

    // Get users dalam unit kerja yang sama (jika applicable)
    // atau dapat juga berdasarkan direct reports jika data tersedia
    return await this.getTeamWorkloadWithBalance(supervisorUserId);
  }
}
```

---

## **FASE 4: FRONTEND UX/RBAC**

### **Task 4.1: Action Rights Helper Hook**

**File:** `apps/web/src/hooks/useSiapActionRights.ts`

```typescript
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { SIAP_ROLES } from '../constants/siap-roles';

export interface ActionRights {
  canStartTask: boolean;
  canCompleteTask: boolean;
  canReturnTask: boolean;
  canReassignTask: boolean;
  canEscalateTask: boolean;
  canApproveTask: boolean;
  canViewTeamWorkload: boolean;
  canViewDashboard: boolean;
  canEditTask: boolean;
}

/**
 * Hook untuk mendapatkan action rights berdasarkan user role
 * Gunakan di component untuk conditional rendering button/action
 * 
 * Usage:
 * const rights = useSiapActionRights();
 * if (rights.canReassignTask) {
 *   // Show reassign button
 * }
 */
export const useSiapActionRights = (): ActionRights => {
  const { user } = useAuth();

  return useMemo(() => {
    const role = user?.role || '';

    const ASSIGN_ROLES = [
      SIAP_ROLES.SUPER_ADMIN,
      SIAP_ROLES.KABID,
      SIAP_ROLES.ANALIS_MADYA,
    ];

    const SUPERVISOR_ROLES = [SIAP_ROLES.KABID, SIAP_ROLES.ANALIS_MADYA];

    return {
      // All operational staff can start their own task
      canStartTask: ![SIAP_ROLES.ADMIN_BKPSDM, SIAP_ROLES.OPD].includes(role),

      // All operational staff can complete their own task
      canCompleteTask: ![SIAP_ROLES.ADMIN_BKPSDM, SIAP_ROLES.OPD].includes(role),

      // KABID, ANALIS_MADYA can return task for rework
      canReturnTask: [SIAP_ROLES.KABID, SIAP_ROLES.ANALIS_MADYA].includes(role),

      // Only specific roles can reassign task
      canReassignTask: ASSIGN_ROLES.includes(role),

      // KABID can escalate to higher level
      canEscalateTask: role === SIAP_ROLES.KABID,

      // KABID, ANALIS_MADYA can approve task
      canApproveTask: [SIAP_ROLES.KABID, SIAP_ROLES.ANALIS_MADYA].includes(role),

      // Supervisors can view team workload
      canViewTeamWorkload: SUPERVISOR_ROLES.includes(role),

      // KABID can view dashboard
      canViewDashboard: role === SIAP_ROLES.KABID,

      // Only KABID, ANALIS_MADYA can edit task metadata
      canEditTask: [SIAP_ROLES.KABID, SIAP_ROLES.ANALIS_MADYA].includes(role),
    };
  }, [user?.role]);
};
```

---

### **Task 4.2: SIAP Tasks Page dengan Tabs**

**File:** `apps/web/src/pages/siap/SiapTasksPage.tsx`

```typescript
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSiapActionRights } from '@/hooks/useSiapActionRights';
import { useAuth } from '@/hooks/useAuth';
import { SIAP_ROLES } from '@/constants/siap-roles';
import MyTasksTab from './tabs/MyTasksTab';
import TeamSupervisionTab from './tabs/TeamSupervisionTab';
import WorkloadDashboardTab from './tabs/WorkloadDashboardTab';
import OverdueTasksTab from './tabs/OverdueTasksTab';

/**
 * SIAP Tasks Page dengan Tab Navigation
 * 
 * Tab Structure:
 * - [Tugas Saya] - default untuk semua operational staff
 * - [Supervisi Tim] - untuk KABID, ANALIS_MADYA
 * - [Pemerataan Kerja] - untuk KABID
 * - [Terlambat] - untuk all staff (optional)
 */
const SiapTasksPage: React.FC = () => {
  const { user } = useAuth();
  const rights = useSiapActionRights();
  const [activeTab, setActiveTab] = useState<string>('my-tasks');

  // Determine default tab based on role
  React.useEffect(() => {
    if (
      [SIAP_ROLES.KABID, SIAP_ROLES.ANALIS_MADYA].includes(user?.role || '')
    ) {
      setActiveTab('supervision');
    } else {
      setActiveTab('my-tasks');
    }
  }, [user?.role]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">SIAP - Manajemen Tugas</h2>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 gap-4">
          <TabsTrigger value="my-tasks">
            <span className="flex items-center gap-2">
              📋 Tugas Saya
            </span>
          </TabsTrigger>

          {rights.canViewTeamWorkload && (
            <TabsTrigger value="supervision">
              <span className="flex items-center gap-2">
                👥 Supervisi Tim
              </span>
            </TabsTrigger>
          )}

          {rights.canViewDashboard && (
            <TabsTrigger value="workload">
              <span className="flex items-center gap-2">
                📊 Pemerataan Kerja
              </span>
            </TabsTrigger>
          )}

          <TabsTrigger value="overdue" className="relative">
            <span className="flex items-center gap-2">
              ⏰ Terlambat
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Tugas Saya */}
        <TabsContent value="my-tasks" className="space-y-4">
          <div className="text-sm text-gray-600">
            Daftar tugas yang ditugaskan kepada Anda
          </div>
          <MyTasksTab />
        </TabsContent>

        {/* Tab: Supervisi Tim */}
        {rights.canViewTeamWorkload && (
          <TabsContent value="supervision" className="space-y-4">
            <div className="text-sm text-gray-600">
              Pantau pekerjaan tim, progress, dan SLA. Reassign jika diperlukan.
            </div>
            <TeamSupervisionTab />
          </TabsContent>
        )}

        {/* Tab: Pemerataan Kerja */}
        {rights.canViewDashboard && (
          <TabsContent value="workload" className="space-y-4">
            <div className="text-sm text-gray-600">
              Pantau distribusi beban kerja, identifikasi overload/underload, dan rekomendasi rebalancing.
            </div>
            <WorkloadDashboardTab />
          </TabsContent>
        )}

        {/* Tab: Terlambat */}
        <TabsContent value="overdue" className="space-y-4">
          <div className="text-sm text-gray-600">
            Task yang melewati deadline atau dalam status overdue
          </div>
          <OverdueTasksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiapTasksPage;
```

---

### **Task 4.3: MyTasksTab Component**

**File:** `apps/web/src/pages/siap/tabs/MyTasksTab.tsx`

```typescript
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSiapActionRights } from '@/hooks/useSiapActionRights';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { api } from '@/lib/api-client';

interface Task {
  id: string;
  taskType: string;
  status: string;
  priority: string;
  dueDate: string;
  startedAt?: string;
  case: { caseNumber: string };
}

const MyTasksTab: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const rights = useSiapActionRights();
  const { user } = useAuth();

  React.useEffect(() => {
    loadMyTasks();
  }, [statusFilter]);

  const loadMyTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/siap/tasks/my', {
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await api.patch(`/api/v1/siap/tasks/${taskId}/start`, {});
      await loadMyTasks();
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await api.patch(`/api/v1/siap/tasks/${taskId}/complete`, {});
      await loadMyTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, any> = {
      ASSIGNED: { label: 'Ditugaskan', variant: 'default' },
      IN_PROGRESS: { label: 'Sedang Dikerjakan', variant: 'warning' },
      COMPLETED: { label: 'Selesai', variant: 'success' },
      OVERDUE: { label: 'Terlambat', variant: 'destructive' },
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, string> = {
      URGENT: '🔴 Urgen',
      HIGH: '🟠 Tinggi',
      NORMAL: '🟡 Normal',
      LOW: '🟢 Rendah',
    };
    return <span>{priorityConfig[priority] || priority}</span>;
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  if (loading) {
    return <div>Memuat tugas...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-600">Task Aktif</div>
          <div className="text-2xl font-bold">
            {tasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status))
              .length}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-600">Task Selesai</div>
          <div className="text-2xl font-bold">
            {tasks.filter((t) => t.status === 'COMPLETED').length}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-600">Task Terlambat</div>
          <div className="text-2xl font-bold text-red-600">
            {tasks.filter(
              (t) =>
                ['ASSIGNED', 'IN_PROGRESS'].includes(t.status) &&
                isOverdue(t.dueDate),
            ).length}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="ASSIGNED">Ditugaskan</SelectItem>
            <SelectItem value="IN_PROGRESS">Sedang Dikerjakan</SelectItem>
            <SelectItem value="COMPLETED">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Kasus</TableHead>
              <TableHead>Jenis Tugas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioritas</TableHead>
              <TableHead>Batas Waktu</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.case.caseNumber}</TableCell>
                <TableCell>{task.taskType}</TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                <TableCell className={isOverdue(task.dueDate) ? 'text-red-600 font-semibold' : ''}>
                  {formatDistanceToNow(new Date(task.dueDate), {
                    addSuffix: true,
                    locale: id,
                  })}
                </TableCell>
                <TableCell className="space-x-2">
                  {task.status === 'ASSIGNED' && rights.canStartTask && (
                    <Button
                      size="sm"
                      onClick={() => handleStartTask(task.id)}
                    >
                      Mulai
                    </Button>
                  )}
                  {task.status === 'IN_PROGRESS' && rights.canCompleteTask && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      Selesai
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MyTasksTab;
```

---

### **Task 4.4: WorkloadDashboardTab Component**

**File:** `apps/web/src/pages/siap/tabs/WorkloadDashboardTab.tsx`

```typescript
import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';

interface TeamMember {
  userId: string;
  userName: string;
  activeTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  workloadScore: number;
  status: 'UNDERLOAD' | 'BALANCED' | 'OVERLOAD';
}

interface DashboardData {
  summary: {
    totalActiveTask: number;
    totalCompletedTask: number;
    totalOverdueTask: number;
    avgWorkloadScore: number;
    imbalanceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  workloadDistribution: TeamMember[];
  serviceTypeDistribution: Array<{ taskType: string; _count: number }>;
  overloadedUsers: TeamMember[];
  underloadedUsers: TeamMember[];
  recommendations: string[];
}

const WorkloadDashboardTab: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/siap/workload/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return <div>Memuat dashboard...</div>;
  }

  const { summary, workloadDistribution, overloadedUsers, underloadedUsers, recommendations } =
    dashboardData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OVERLOAD':
        return '#ef4444';
      case 'BALANCED':
        return '#3b82f6';
      case 'UNDERLOAD':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const chartData = workloadDistribution.map((m) => ({
    name: m.userName.split(' ')[0], // First name only for chart
    activeTask: m.activeTaskCount,
    completedTask: m.completedTaskCount,
    score: m.workloadScore,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4 bg-blue-50">
          <div className="text-sm text-gray-600">Total Task Aktif</div>
          <div className="text-3xl font-bold text-blue-600">{summary.totalActiveTask}</div>
        </div>
        <div className="rounded-lg border p-4 bg-green-50">
          <div className="text-sm text-gray-600">Selesai (Bulan Ini)</div>
          <div className="text-3xl font-bold text-green-600">
            {summary.totalCompletedTask}
          </div>
        </div>
        <div className="rounded-lg border p-4 bg-red-50">
          <div className="text-sm text-gray-600">Terlambat</div>
          <div className="text-3xl font-bold text-red-600">{summary.totalOverdueTask}</div>
        </div>
        <div className="rounded-lg border p-4 bg-purple-50">
          <div className="text-sm text-gray-600">Rata-rata Beban</div>
          <div className="text-3xl font-bold text-purple-600">
            {summary.avgWorkloadScore}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Imbalance: {summary.imbalanceLevel}
          </div>
        </div>
      </div>

      {/* Workload Chart */}
      <div className="rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Distribusi Beban Kerja</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="activeTask" fill="#ef4444" name="Task Aktif" />
            <Bar dataKey="completedTask" fill="#10b981" name="Task Selesai" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Rekomendasi Sistem</h3>
          {recommendations.map((rec, idx) => (
            <Alert key={idx} className="border-yellow-200 bg-yellow-50">
              <AlertDescription>{rec}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Overloaded Users */}
      {overloadedUsers.length > 0 && (
        <div className="rounded-lg border p-4 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-4">
            🔴 Pegawai dengan Beban Tinggi
          </h3>
          <div className="space-y-2">
            {overloadedUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between rounded-lg bg-white p-3"
              >
                <div>
                  <div className="font-medium">{user.userName}</div>
                  <div className="text-sm text-gray-600">
                    {user.activeTaskCount} task aktif • Skor: {user.workloadScore}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Reassign
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Underloaded Users */}
      {underloadedUsers.length > 0 && (
        <div className="rounded-lg border p-4 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            🟢 Pegawai dengan Kapasitas Tersedia
          </h3>
          <div className="space-y-2">
            {underloadedUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between rounded-lg bg-white p-3"
              >
                <div>
                  <div className="font-medium">{user.userName}</div>
                  <div className="text-sm text-gray-600">
                    {user.activeTaskCount} task aktif • Skor: {user.workloadScore}
                  </div>
                </div>
                <Badge variant="secondary">Kapasitas Tersedia</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Workload Table */}
      <div className="rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Detail Beban Kerja Tim</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="text-right">Task Aktif</TableHead>
              <TableHead className="text-right">Selesai</TableHead>
              <TableHead className="text-right">Terlambat</TableHead>
              <TableHead className="text-right">Skor Beban</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workloadDistribution.map((member) => (
              <TableRow key={member.userId}>
                <TableCell className="font-medium">{member.userName}</TableCell>
                <TableCell className="text-right">{member.activeTaskCount}</TableCell>
                <TableCell className="text-right">{member.completedTaskCount}</TableCell>
                <TableCell className="text-right">{member.overdueTaskCount}</TableCell>
                <TableCell className="text-right font-semibold">
                  {member.workloadScore}
                </TableCell>
                <TableCell>
                  <Badge
                    style={{
                      backgroundColor: getStatusColor(member.status),
                      color: 'white',
                    }}
                  >
                    {member.status === 'OVERLOAD'
                      ? 'Overload'
                      : member.status === 'UNDERLOAD'
                      ? 'Underload'
                      : 'Seimbang'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default WorkloadDashboardTab;
```

---

## **RINGKASAN BLUEPRINT IMPLEMENTASI**

### **Phase Timeline**

```
PHASE 1 (Weeks 1-2): RBAC & Workflow Foundation
├── Constants & Guards: 2 hari
├── Seed Migration: 1 hari
├── Service Updates: 2 hari
├── Unit Tests: 2 hari
└── Code Review & Merge: 1 hari

PHASE 2 (Weeks 3-4): Auto-Assignment & Workload
├── Repository Methods: 2 hari
├── Assignment Service: 2 hari
├── OPD Integration: 2 hari
├── E2E Testing: 2 hari
└── Performance Testing: 1 hari

PHASE 3 (Weeks 5-6): Dashboard Backend
├── Workload Service: 3 hari
├── Dashboard Endpoints: 2 hari
├── Testing & Optimization: 2 hari
└── Documentation: 1 hari

PHASE 4 (Weeks 7-8): Frontend Implementation
├── Components & Pages: 3 hari
├── Integration Testing: 2 hari
├── UI/UX Polish: 2 hari
└── UAT & Deployment: 1 hari
```

### **Deliverables per Phase**

**Phase 1:**
- ✅ `siap-roles.constant.ts` - Role definitions
- ✅ `siap.service.ts` - Updated methods with RBAC
- ✅ `siap-assign.guard.ts` - Guard implementation
- ✅ Unit tests (100% coverage untuk RBAC)
- ✅ Updated seed workflow
- ✅ Migration script (rollback lama, setup baru)

**Phase 2:**
- ✅ `siap-task.repository.ts` - Workload calculation
- ✅ `siap-assignment.service.ts` - Auto & manual assignment
- ✅ Updated OPD submission flow
- ✅ E2E tests (OPD → SIAP → Task)
- ✅ Performance benchmarks

**Phase 3:**
- ✅ `siap-workload.service.ts` - Workload aggregation
- ✅ `siap-workload.controller.ts` - REST endpoints
- ✅ Dashboard data endpoints
- ✅ Integration tests

**Phase 4:**
- ✅ `useSiapActionRights.ts` - Hook untuk permissions
- ✅ `SiapTasksPage.tsx` - Main page dengan tabs
- ✅ `MyTasksTab`, `TeamSupervisionTab`, `WorkloadDashboardTab`
- ✅ Responsive design
- ✅ Performance optimization

### **Key Technical Decisions**

| Decision | Rationale |
|----------|-----------|
| **Auto-assign to least-loaded** | Pemerataan beban kerja secara otomatis |
| **Role-based action visibility** | Backend adalah sumber kebenaran RBAC |
| **Timeline events untuk audit** | Traceable workflow execution |
| **Opsi A untuk workload calculation** | Fast MVP, dapat naik ke Opsi B nanti |
| **Tab-based navigation** | Setiap role punya context berbeda |
| **Recommendation engine** | Actionable insights untuk supervisor |

### **Success Metrics**

```
RBAC:
- ✓ 100% ADMIN_BKPSDM tidak bisa aksi bisnis
- ✓ 100% assignment hanya dari role yang tepat
- ✓ 100% test coverage untuk permission logic

Auto-Assignment:
- ✓ 95%+ task auto-assign pada OPD submit
- ✓ Workload variance < 30% dalam team
- ✓ Response time < 2 detik untuk assignment

Dashboard:
- ✓ Load time < 3 detik
- ✓ 100% akurasi metrik workload
- ✓ Rekomendasi meaningful untuk 80%+ kasus

UX:
- ✓ 0 button visible untuk role yang tidak boleh
- ✓ Mobile responsive design
- ✓ < 2 klik untuk action utama
```

---

Ini adalah **blueprint lengkap dan production-ready** untuk implementasi patch SILAKAP v1.0. Setiap phase dapat dikerjakan secara paralel jika ada tim yang cukup, dan deliverable sudah clear serta testable.
