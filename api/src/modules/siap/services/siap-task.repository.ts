import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SIAP_ACTIVE_TASK_STATUSES } from '../constants/siap-roles.constant';

export interface UserWorkload {
  userId: string;
  userName: string;
  activeTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  avgCompletionHours: number;
}

/**
 * Repository untuk SIAP Task dengan fokus pada workload calculation
 * Digunakan untuk auto-assignment ke user dengan beban kerja paling ringan
 */
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
          in: SIAP_ACTIVE_TASK_STATUSES as any,
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
          in: ['COMPLETED', 'APPROVED', 'REJECTED'] as any,
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
          in: SIAP_ACTIVE_TASK_STATUSES as any,
        },
        dueDate: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Hitung rata-rata waktu penyelesaian task user (dalam jam)
   * 
   * @param userId - User ID
   * @returns Rata-rata jam
   */
  async avgCompletionTimeByUser(userId: string): Promise<number> {
    const tasks = await this.prisma.siapTask.findMany({
      where: {
        assignedTo: userId,
        status: {
          in: ['COMPLETED', 'APPROVED', 'REJECTED'] as any,
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
   * Dapatkan due date paling awal dari task aktif user
   * 
   * @param userId - User ID
   * @returns Earliest due date atau null
   */
  async getEarliestDueDate(userId: string): Promise<Date | null> {
    const task = await this.prisma.siapTask.findFirst({
      where: {
        assignedTo: userId,
        status: {
          in: SIAP_ACTIVE_TASK_STATUSES as any,
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
   * Cari user aktif dengan beban kerja paling ringan dalam role tertentu
   * 
   * Algoritma:
   * 1. Filter user dengan role target yang aktif
   * 2. Hitung task aktif per user
   * 3. Urutkan ascending (paling sedikit task duluan)
   * 4. Jika task sama, urutkan berdasarkan due date paling ringan
   * 5. Return user dengan beban paling ringan
   * 
   * @param roleCode - Role code untuk filter
   * @param excludeUserIds - Optional: user IDs yang dikecualikan
   * @returns User ID dengan beban paling ringan, atau null jika tidak ada
   */
  async findLeastLoadedActiveUserByRole(
    roleCode: string,
    excludeUserIds?: string[],
  ): Promise<string | null> {
    // 1. Cari semua user dengan role target yang aktif
    const activeUsers = await this.prisma.user.findMany({
      where: {
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
        isActive: true,
      },
      select: { id: true },
    });

    return await Promise.all(
      users.map((user) => this.getUserWorkloadSummary(user.id)),
    );
  }
}
