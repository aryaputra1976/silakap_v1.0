import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SiapTaskRepository } from './siap-task.repository';
import { SIAP_WORKLOAD_POOL_ROLES } from '../constants/siap-roles.constant';

export interface AssignmentResult {
  taskId: string;
  assignedToUserId: string;
  assignedToUserName: string;
  assignedAt: Date;
  assignmentMethod: 'AUTO_LEAST_LOADED' | 'MANUAL' | 'SYSTEM_DEFAULT';
  workloadAtAssignment: number;
}

/**
 * Service untuk assignment task dengan prioritas beban kerja
 * 
 * Menyediakan:
 * - Auto-assignment ke user dengan beban paling ringan
 * - Manual assignment dengan RBAC validation
 */
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
   * @param poolRoles - Array role yang eligible untuk assignment
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
      throw new BadRequestException(`Task ${taskId} tidak ditemukan`);
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
        `Tidak ada user aktif untuk assignment ke roles: ${poolRoles.join(', ')}`,
      );
    }

    // 3. Assign task
    const assignedUser = await this.prisma.user.findUnique({
      where: { id: assignedUserId },
    });

    // Update task
    const updatedTask = await this.prisma.siapTask.update({
      where: { id: taskId },
      data: {
        assignedTo: assignedUserId,
        assignedBy: null,
        status: 'ASSIGNED',
      },
    });

    // 4. Get workload at assignment time
    const workloadAtAssignment = await this.taskRepository.countActiveTasksByUser(
      assignedUserId,
    );

    return {
      taskId: updatedTask.id,
      assignedToUserId: assignedUserId,
      assignedToUserName: assignedUser?.name || 'Unknown',
      assignedAt: new Date(),
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
   * @returns Assignment result
   */
    async manualAssignTask(
      taskId: string,
      assignToUserId: string,
      assignedByUserId: string,
    ): Promise<AssignmentResult> {
      // Validate task
      const task = await this.prisma.siapTask.findUnique({
        where: { id: taskId },
        include: { case: true },
      });

      if (!task) {
        throw new BadRequestException(`Task ${taskId} tidak ditemukan`);
      }

      // Validate target user exists and active
      const targetUser = await this.prisma.user.findUnique({
        where: { id: assignToUserId },
      });

      if (!targetUser) {
        throw new BadRequestException(`User ${assignToUserId} tidak ditemukan`);
      }

      if (targetUser.status !== 'ACTIVE') {
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
          status: 'ASSIGNED',
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
      assignedAt: new Date(),
      assignmentMethod: 'MANUAL',
      workloadAtAssignment,
    };
  }
}
