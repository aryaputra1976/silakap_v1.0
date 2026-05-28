import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SiapTaskRepository } from './siap-task.repository';

export interface TeamMemberWorkload {
  userId: string;
  userName: string;
  role: string;
  activeTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  avgCompletionHours: number;
  workloadScore: number;
  status: 'OVERLOAD' | 'NORMAL' | 'UNDERLOAD';
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

/**
 * Service untuk dashboard pemerataan beban kerja
 * Digunakan oleh KABID dan ANALIS_MADYA untuk monitoring tim
 */
@Injectable()
export class SiapWorkloadDashboardService {
  constructor(
    private prisma: PrismaService,
    private taskRepository: SiapTaskRepository,
  ) {}

  /**
   * Calculate workload score untuk satu user
   * 
   * Score dihitung berdasarkan:
   * - Jumlah task aktif (bobot: 60%)
   * - Jumlah task terlambat (bobot: 30%)
   * - Rata-rata completion time (bobot: 10%)
   * 
   * Score range: 0-100
   * 0-30: UNDERLOAD (kerja ringan)
   * 31-70: NORMAL (seimbang)
   * 71+: OVERLOAD (terlalu berat)
   */
  private calculateWorkloadScore(
    activeCount: number,
    avgActiveCount: number,
  ): { score: number; status: 'OVERLOAD' | 'NORMAL' | 'UNDERLOAD' } {
    // Base score dari perbandingan task aktif dengan rata-rata
    const relativeLoad =
      avgActiveCount > 0 ? (activeCount / avgActiveCount) * 100 : 0;

    let score = Math.min(relativeLoad, 100);

    // Determine status based on score
    let status: 'OVERLOAD' | 'NORMAL' | 'UNDERLOAD';
    if (score >= 71) {
      status = 'OVERLOAD';
    } else if (score <= 30) {
      status = 'UNDERLOAD';
    } else {
      status = 'NORMAL';
    }

    return {
      score: Math.round(score),
      status,
    };
  }

  /**
   * Get individual user workload dengan score
   */
  private async getUserWorkloadWithScore(
    userId: string,
    avgActiveTask: number,
  ): Promise<TeamMemberWorkload> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const workload = await this.taskRepository.getUserWorkloadSummary(userId);
    const { score, status } = this.calculateWorkloadScore(
      workload.activeTaskCount,
      avgActiveTask,
    );
    const userRoles = user.userRoles.map((ur) => ur.role.code);

    return {
      ...workload,
      userId: user.id,
      userName: user.name,
      role: userRoles.join(', '),
      workloadScore: score,
      status,
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
        status: 'ACTIVE',
        deletedAt: null,
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
    // Get team members
    let teamUsers = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
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
      const workloadWithScore = await this.getUserWorkloadWithScore(
        user.id,
        avgActiveTask,
      );

      memberWorkloads.push(workloadWithScore);

      totalActiveTask += workloadWithScore.activeTaskCount;
      totalCompletedTask += workloadWithScore.completedTaskCount;
      totalOverdueTask += workloadWithScore.overdueTaskCount;
      totalScores += workloadWithScore.workloadScore;
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
      throw new Error(`Supervisor ${supervisorUserId} tidak ditemukan`);
    }

    // Get team summary
    const teamWorkload = await this.getTeamWorkloadWithBalance(supervisorUserId);

    // Get overloaded users
    const overloadedUsers = teamWorkload.members.filter(
      (m) => m.status === 'OVERLOAD',
    );

    // Get underloaded users
    const underloadedUsers = teamWorkload.members.filter(
      (m) => m.status === 'UNDERLOAD',
    );

    // Get overdue alerts (top 10)
    const overdueTasks = await this.prisma.siapTask.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RETURNED', 'OVERDUE'],
        },
      },
      include: { case: true },
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
      overdueAlerts: overdueTasks.flatMap((t) => {
        if (!t.dueDate) {
          return [];
        }

        return [
          {
            taskId: t.id,
            caseNumber: t.case?.caseNumber,
            daysOverdue: Math.ceil(
              (Date.now() - t.dueDate.getTime()) / (1000 * 60 * 60 * 24),
            ),
          },
        ];
      }),
      recommendations: this.generateRecommendations(
        overloadedUsers,
        underloadedUsers,
      ),
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
}
