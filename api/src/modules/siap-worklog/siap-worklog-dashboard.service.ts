import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { SiapWorklogStatus } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { WorklogDashboardQueryDto } from './dto/worklog-dashboard-query.dto';
import {
  DashboardStaffRecord,
  DashboardUnitRecord,
  DashboardWorklogRecord,
  SiapWorklogDashboardRepository,
  WorklogDashboardScope,
} from './siap-worklog-dashboard.repository';

const TEAM_DASHBOARD_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
];

const EXECUTIVE_DASHBOARD_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
];

@Injectable()
export class SiapWorklogDashboardService {
  constructor(
    @Inject(SiapWorklogDashboardRepository)
    private readonly dashboardRepository: SiapWorklogDashboardRepository,
  ) {}

  async getTeamDashboard(query: WorklogDashboardQueryDto, user: AuthUser) {
    this.ensureCanViewTeamDashboard(user);

    const scope = this.buildScope(query, user, 'TEAM');

    const [staff, todayWorklogs, periodWorklogs, pendingReview, obstacles] =
      await Promise.all([
        this.dashboardRepository.findStaff(scope),
        this.dashboardRepository.findTodayWorklogs(scope),
        this.dashboardRepository.findPeriodWorklogs(scope),
        this.dashboardRepository.findPendingReview(scope, 10),
        this.dashboardRepository.findRecentObstacles(scope, 10),
      ]);

    return this.buildDashboardPayload({
      scope,
      staff,
      todayWorklogs,
      periodWorklogs,
      pendingReview,
      obstacles,
    });
  }

  async getExecutiveDashboard(query: WorklogDashboardQueryDto, user: AuthUser) {
    this.ensureCanViewExecutiveDashboard(user);

    const scope = this.buildScope(query, user, 'EXECUTIVE');

    const [units, staff, todayWorklogs, periodWorklogs, pendingReview, obstacles] =
      await Promise.all([
        this.dashboardRepository.findUnits(),
        this.dashboardRepository.findStaff(scope),
        this.dashboardRepository.findTodayWorklogs(scope),
        this.dashboardRepository.findPeriodWorklogs(scope),
        this.dashboardRepository.findPendingReview(scope, 20),
        this.dashboardRepository.findRecentObstacles(scope, 20),
      ]);

    const base = this.buildDashboardPayload({
      scope,
      staff,
      todayWorklogs,
      periodWorklogs,
      pendingReview,
      obstacles,
    });

    return {
      ...base,
      byUnit: this.buildUnitRows(units, staff, todayWorklogs, periodWorklogs),
      strategicIssues: obstacles.map((item) => this.toWorklogResponse(item)),
      executiveNotes: {
        attentionNeededUnits: this.countAttentionNeededUnits(
          units,
          staff,
          todayWorklogs,
          periodWorklogs,
        ),
        highRiskUnitCount: this.buildUnitRows(
          units,
          staff,
          todayWorklogs,
          periodWorklogs,
        ).filter(
          (item) =>
            item.notUpdatedToday > 0 ||
            item.pendingReview > 0 ||
            item.obstacleCount > 0 ||
            item.revisionRequired > 0,
        ).length,
      },
    };
  }

  private buildDashboardPayload({
    scope,
    staff,
    todayWorklogs,
    periodWorklogs,
    pendingReview,
    obstacles,
  }: {
    scope: WorklogDashboardScope;
    staff: DashboardStaffRecord[];
    todayWorklogs: DashboardWorklogRecord[];
    periodWorklogs: DashboardWorklogRecord[];
    pendingReview: DashboardWorklogRecord[];
    obstacles: DashboardWorklogRecord[];
  }) {
    const todayUserIds = new Set(todayWorklogs.map((item) => item.userId));
    const notUpdatedToday = staff.filter((item) => !todayUserIds.has(item.id));

    return {
      scope: {
        unitKerjaId: scope.unitKerjaId ?? null,
        from: scope.from,
        to: scope.to,
        date: scope.todayStart,
      },
      summary: {
        totalStaff: staff.length,
        updatedToday: todayUserIds.size,
        notUpdatedToday: notUpdatedToday.length,
        pendingReview: pendingReview.length,
        approvedInPeriod: this.countByStatus(
          periodWorklogs,
          SiapWorklogStatus.APPROVED,
        ),
        revisionInPeriod: this.countByStatus(
          periodWorklogs,
          SiapWorklogStatus.REVISION_REQUIRED,
        ),
        submittedInPeriod: this.countByStatus(
          periodWorklogs,
          SiapWorklogStatus.SUBMITTED,
        ),
        draftInPeriod: this.countByStatus(periodWorklogs, SiapWorklogStatus.DRAFT),
        rejectedInPeriod: this.countByStatus(
          periodWorklogs,
          SiapWorklogStatus.REJECTED,
        ),
        totalWorklogsInPeriod: periodWorklogs.length,
        totalVolumeInPeriod: this.sumVolume(periodWorklogs),
        obstacleCountInPeriod: periodWorklogs.filter((item) =>
          item.obstacle?.trim(),
        ).length,
      },
      notUpdatedToday: notUpdatedToday.map((item) => this.toStaffResponse(item)),
      byStaff: this.buildStaffRows(staff, todayWorklogs, periodWorklogs),
      pendingReview: pendingReview.map((item) => this.toWorklogResponse(item)),
      recentObstacles: obstacles.map((item) => this.toWorklogResponse(item)),
      statusDistribution: this.buildStatusDistribution(periodWorklogs),
      categoryDistribution: this.buildCategoryDistribution(periodWorklogs),
    };
  }

  private buildScope(
    query: WorklogDashboardQueryDto,
    user: AuthUser,
    mode: 'TEAM' | 'EXECUTIVE',
  ): WorklogDashboardScope {
    const today = query.date
      ? this.parseDateOnly(query.date, 'Tanggal dashboard tidak valid')
      : new Date();

    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const from = query.from
      ? startOfDay(this.parseDateOnly(query.from, 'Tanggal awal tidak valid'))
      : startOfDay(addDays(today, -6));

    const to = query.to
      ? endOfDay(this.parseDateOnly(query.to, 'Tanggal akhir tidak valid'))
      : todayEnd;

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException(
        'Tanggal awal tidak boleh melebihi tanggal akhir',
      );
    }

    const requestedUnitKerjaId = query.unitKerjaId?.trim() || undefined;

    if (mode === 'EXECUTIVE') {
      return {
        unitKerjaId: requestedUnitKerjaId,
        from,
        to,
        todayStart,
        todayEnd,
      };
    }

    if (this.hasAnyRole(user, ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KEPALA_BADAN'])) {
      return {
        unitKerjaId: requestedUnitKerjaId,
        from,
        to,
        todayStart,
        todayEnd,
      };
    }

    if (
      this.hasAnyRole(user, ['KABID', 'ANALIS_MADYA', 'ANALIS_MUDA']) &&
      user.unitKerjaId
    ) {
      return {
        unitKerjaId: user.unitKerjaId,
        from,
        to,
        todayStart,
        todayEnd,
      };
    }

    throw new ForbiddenException('Unit kerja user belum tersedia');
  }

  private buildStaffRows(
    staff: DashboardStaffRecord[],
    todayWorklogs: DashboardWorklogRecord[],
    periodWorklogs: DashboardWorklogRecord[],
  ) {
    const todayByUser = groupByUser(todayWorklogs);
    const periodByUser = groupByUser(periodWorklogs);

    return staff.map((user) => {
      const todayRows = todayByUser.get(user.id) ?? [];
      const periodRows = periodByUser.get(user.id) ?? [];
      const lastWorklog = [...periodRows].sort(
        (left, right) =>
          right.workDate.getTime() - left.workDate.getTime() ||
          right.createdAt.getTime() - left.createdAt.getTime(),
      )[0];

      return {
        user: this.toStaffResponse(user),
        hasUpdatedToday: todayRows.length > 0,
        todayWorklogCount: todayRows.length,
        worklogCount: periodRows.length,
        totalVolume: this.sumVolume(periodRows),
        draft: this.countByStatus(periodRows, SiapWorklogStatus.DRAFT),
        submitted: this.countByStatus(periodRows, SiapWorklogStatus.SUBMITTED),
        revisionRequired: this.countByStatus(
          periodRows,
          SiapWorklogStatus.REVISION_REQUIRED,
        ),
        approved: this.countByStatus(periodRows, SiapWorklogStatus.APPROVED),
        rejected: this.countByStatus(periodRows, SiapWorklogStatus.REJECTED),
        obstacleCount: periodRows.filter((item) => item.obstacle?.trim()).length,
        lastWorklogAt: lastWorklog?.workDate ?? null,
      };
    });
  }

  private buildUnitRows(
    units: DashboardUnitRecord[],
    staff: DashboardStaffRecord[],
    todayWorklogs: DashboardWorklogRecord[],
    periodWorklogs: DashboardWorklogRecord[],
  ) {
    return units
      .map((unit) => {
        const unitStaff = staff.filter((item) => item.unitKerjaId === unit.id);
        const unitTodayRows = todayWorklogs.filter(
          (item) => item.unitKerjaId === unit.id,
        );
        const unitPeriodRows = periodWorklogs.filter(
          (item) => item.unitKerjaId === unit.id,
        );
        const todayUserIds = new Set(unitTodayRows.map((item) => item.userId));
        const notUpdatedToday = unitStaff.filter(
          (item) => !todayUserIds.has(item.id),
        ).length;

        return {
          unit: {
            id: unit.id,
            kode: unit.kode,
            nama: unit.nama,
            parentId: unit.parentId,
            level: unit.level,
          },
          totalStaff: unitStaff.length,
          updatedToday: todayUserIds.size,
          notUpdatedToday,
          worklogCount: unitPeriodRows.length,
          totalVolume: this.sumVolume(unitPeriodRows),
          draft: this.countByStatus(unitPeriodRows, SiapWorklogStatus.DRAFT),
          submitted: this.countByStatus(
            unitPeriodRows,
            SiapWorklogStatus.SUBMITTED,
          ),
          pendingReview: this.countByStatus(
            unitPeriodRows,
            SiapWorklogStatus.SUBMITTED,
          ),
          revisionRequired: this.countByStatus(
            unitPeriodRows,
            SiapWorklogStatus.REVISION_REQUIRED,
          ),
          approved: this.countByStatus(
            unitPeriodRows,
            SiapWorklogStatus.APPROVED,
          ),
          rejected: this.countByStatus(
            unitPeriodRows,
            SiapWorklogStatus.REJECTED,
          ),
          obstacleCount: unitPeriodRows.filter((item) => item.obstacle?.trim())
            .length,
          healthScore: this.calculateUnitHealthScore({
            totalStaff: unitStaff.length,
            notUpdatedToday,
            pendingReview: this.countByStatus(
              unitPeriodRows,
              SiapWorklogStatus.SUBMITTED,
            ),
            revisionRequired: this.countByStatus(
              unitPeriodRows,
              SiapWorklogStatus.REVISION_REQUIRED,
            ),
            obstacleCount: unitPeriodRows.filter((item) => item.obstacle?.trim())
              .length,
          }),
        };
      })
      .filter(
        (item) =>
          item.totalStaff > 0 ||
          item.worklogCount > 0 ||
          item.pendingReview > 0 ||
          item.obstacleCount > 0,
      )
      .sort((left, right) => {
        return (
          left.healthScore - right.healthScore ||
          right.obstacleCount - left.obstacleCount ||
          right.pendingReview - left.pendingReview
        );
      });
  }

  private calculateUnitHealthScore(input: {
    totalStaff: number;
    notUpdatedToday: number;
    pendingReview: number;
    revisionRequired: number;
    obstacleCount: number;
  }) {
    if (input.totalStaff === 0) {
      return 100;
    }

    let score = 100;
    score -= input.notUpdatedToday * 12;
    score -= input.pendingReview * 4;
    score -= input.revisionRequired * 8;
    score -= input.obstacleCount * 6;

    return Math.max(score, 0);
  }

  private countAttentionNeededUnits(
    units: DashboardUnitRecord[],
    staff: DashboardStaffRecord[],
    todayWorklogs: DashboardWorklogRecord[],
    periodWorklogs: DashboardWorklogRecord[],
  ) {
    return this.buildUnitRows(units, staff, todayWorklogs, periodWorklogs).filter(
      (item) =>
        item.notUpdatedToday > 0 ||
        item.pendingReview > 0 ||
        item.revisionRequired > 0 ||
        item.obstacleCount > 0,
    ).length;
  }

  private buildStatusDistribution(rows: DashboardWorklogRecord[]) {
    const statuses: SiapWorklogStatus[] = [
      SiapWorklogStatus.DRAFT,
      SiapWorklogStatus.SUBMITTED,
      SiapWorklogStatus.REVISION_REQUIRED,
      SiapWorklogStatus.APPROVED,
      SiapWorklogStatus.REJECTED,
    ];

    return statuses.map((status) => ({
      key: status,
      label: status,
      total: this.countByStatus(rows, status),
    }));
  }

  private buildCategoryDistribution(rows: DashboardWorklogRecord[]) {
    const map = new Map<string, number>();

    for (const row of rows) {
      map.set(row.category, (map.get(row.category) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([key, total]) => ({
        key,
        label: key,
        total,
      }))
      .sort((left, right) => right.total - left.total);
  }

  private countByStatus(
    rows: DashboardWorklogRecord[],
    status: SiapWorklogStatus,
  ) {
    return rows.filter((item) => item.status === status).length;
  }

  private sumVolume(rows: DashboardWorklogRecord[]) {
    return rows.reduce((sum, item) => sum + (item.volume ?? 0), 0);
  }

  private toStaffResponse(record: DashboardStaffRecord) {
    return {
      id: record.id,
      username: record.username,
      name: record.name,
      unitKerjaId: record.unitKerjaId,
      unitKerja: record.unitKerja,
      roles: record.userRoles.map((item) => item.role.code),
    };
  }

  private toWorklogResponse(record: DashboardWorklogRecord) {
    return {
      id: record.id,
      userId: record.userId,
      unitKerjaId: record.unitKerjaId,
      caseId: record.caseId,
      taskId: record.taskId,
      workDate: record.workDate,
      category: record.category,
      title: record.title,
      description: record.description,
      output: record.output,
      volume: record.volume,
      obstacle: record.obstacle,
      status: record.status,
      submittedAt: record.submittedAt,
      reviewedBy: record.reviewedBy,
      reviewedAt: record.reviewedAt,
      reviewNote: record.reviewNote,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      user: record.user,
      unitKerja: record.unitKerja,
      reviewer: record.reviewer,
    };
  }

  private ensureCanViewTeamDashboard(user: AuthUser) {
    if (!this.hasAnyRole(user, TEAM_DASHBOARD_ROLES)) {
      throw new ForbiddenException(
        'Anda tidak berwenang melihat dashboard buku kerja',
      );
    }
  }

  private ensureCanViewExecutiveDashboard(user: AuthUser) {
    if (!this.hasAnyRole(user, EXECUTIVE_DASHBOARD_ROLES)) {
      throw new ForbiddenException(
        'Anda tidak berwenang melihat dashboard pimpinan',
      );
    }
  }

  private parseDateOnly(value: string, message: string) {
    const parsed = new Date(`${value}T00:00:00.000`);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(message);
    }

    return parsed;
  }

  private hasAnyRole(user: AuthUser, roles: string[]) {
    return user.roles.some((role) => roles.includes(role));
  }
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function groupByUser(rows: DashboardWorklogRecord[]) {
  const map = new Map<string, DashboardWorklogRecord[]>();

  for (const row of rows) {
    const current = map.get(row.userId) ?? [];
    current.push(row);
    map.set(row.userId, current);
  }

  return map;
}