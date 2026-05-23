import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SopGovernanceRepository } from './sop-governance.repository';
import type { CreateGovernanceRecordDto } from './dto/create-governance-record.dto';
import type { UpdateGovernanceRecordDto } from './dto/update-governance-record.dto';
import type { GovernanceActionDto } from './dto/governance-action.dto';
import type { GovernanceListQueryDto } from './dto/governance-list-query.dto';
import type { StartReviewDto } from './dto/start-review.dto';
import type { CompleteReviewDto } from './dto/complete-review.dto';
import type { KeepActiveDto } from './dto/keep-active.dto';
import type { RequestRevisionDto } from './dto/request-revision.dto';
import type { CreateReminderDto } from './dto/create-reminder.dto';

// ─── Role policy ───────────────────────────────────────────────────────────────

const BLOCKED_ROLES = new Set(['OPD', 'PPPK']);

const ACTIVATE_ARCHIVE_ROLES = new Set([
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
]);

const CREATE_UPDATE_ROLES = new Set([
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
]);

const MARK_REVIEW_ROLES = new Set([
  ...CREATE_UPDATE_ROLES,
  'ANALIS_MUDA',
]);

// Roles that can complete-review / keep-active / request-revision decisions
const COMPLETE_REVIEW_ROLES = new Set([
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
]);

// Roles that can start a review (lower threshold)
const START_REVIEW_ROLES = new Set([
  ...COMPLETE_REVIEW_ROLES,
  'ANALIS_MADYA',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPrimary(roles: string[]): string {
  return roles[0] ?? 'OPD';
}

function assertNotBlocked(roles: string[]): void {
  if (roles.some((r) => BLOCKED_ROLES.has(r))) {
    throw new ForbiddenException('Akses governance SOP tidak diizinkan untuk role ini.');
  }
}

function assertRole(roles: string[], allowed: Set<string>): void {
  if (!roles.some((r) => allowed.has(r))) {
    throw new ForbiddenException('Role Anda tidak memiliki izin untuk aksi ini.');
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class SopGovernanceService {
  constructor(
    @Inject(SopGovernanceRepository)
    private readonly repo: SopGovernanceRepository,
  ) {}

  list(q: GovernanceListQueryDto, roles: string[]) {
    assertNotBlocked(roles);
    return this.repo.findMany(q);
  }

  async getById(id: string, roles: string[]) {
    assertNotBlocked(roles);
    const record = await this.repo.findById(id);
    if (!record) throw new NotFoundException('Governance record tidak ditemukan.');
    return record;
  }

  create(dto: CreateGovernanceRecordDto, userId: string, roles: string[]) {
    assertNotBlocked(roles);
    assertRole(roles, CREATE_UPDATE_ROLES);
    return this.repo.create(dto, userId, getPrimary(roles));
  }

  async update(id: string, dto: UpdateGovernanceRecordDto, userId: string, roles: string[]) {
    assertNotBlocked(roles);
    assertRole(roles, CREATE_UPDATE_ROLES);

    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Governance record tidak ditemukan.');
    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException('Tidak dapat mengubah record yang sudah diarsipkan.');
    }

    return this.repo.update(id, dto, userId, getPrimary(roles));
  }

  async activate(id: string, dto: GovernanceActionDto, userId: string, roles: string[]) {
    assertNotBlocked(roles);
    assertRole(roles, ACTIVATE_ARCHIVE_ROLES);

    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Governance record tidak ditemukan.');
    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException('Tidak dapat mengaktifkan record yang sudah diarsipkan.');
    }
    if (existing.status === 'ACTIVE') {
      throw new BadRequestException('Record sudah berstatus ACTIVE.');
    }

    return this.repo.changeStatus(id, 'ACTIVE', userId, getPrimary(roles), dto.note ?? null, {
      approvedById: userId,
      approvedAt: new Date(),
    });
  }

  async archive(id: string, dto: GovernanceActionDto, userId: string, roles: string[]) {
    assertNotBlocked(roles);
    assertRole(roles, ACTIVATE_ARCHIVE_ROLES);

    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Governance record tidak ditemukan.');
    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException('Record sudah diarsipkan.');
    }

    return this.repo.changeStatus(id, 'ARCHIVED', userId, getPrimary(roles), dto.note ?? null);
  }

  async markReview(id: string, dto: GovernanceActionDto, userId: string, roles: string[]) {
    assertNotBlocked(roles);
    assertRole(roles, MARK_REVIEW_ROLES);

    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Governance record tidak ditemukan.');
    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException('Tidak dapat menandai review pada record yang sudah diarsipkan.');
    }

    return this.repo.changeStatus(id, 'NEEDS_REVIEW', userId, getPrimary(roles), dto.note ?? null);
  }

  getSummary(q: GovernanceListQueryDto, roles: string[]) {
    assertNotBlocked(roles);
    return this.repo.getSummary(q);
  }

  getDueReview(q: GovernanceListQueryDto, roles: string[]) {
    assertNotBlocked(roles);
    return this.repo.findDueReview(q);
  }

  getChangeLogs(governanceId: string | undefined, limit: number, roles: string[]) {
    assertNotBlocked(roles);
    return this.repo.getChangeLogs(governanceId, limit);
  }

  // ── Review workflow ──────────────────────────────────────────────────────────

  getReviewQueue(roles: string[]) {
    assertNotBlocked(roles);
    return this.repo.getReviewQueue();
  }

  async startReview(id: string, dto: StartReviewDto, userId: string, roles: string[]) {
    assertNotBlocked(roles);
    assertRole(roles, START_REVIEW_ROLES);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Governance record tidak ditemukan.');
    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException('Tidak dapat memulai review pada record yang sudah diarsipkan.');
    }
    return this.repo.startReview(id, userId, getPrimary(roles), dto.note ?? null);
  }

  async completeReview(id: string, dto: CompleteReviewDto, userId: string, roles: string[]) {
    assertNotBlocked(roles);
    assertRole(roles, COMPLETE_REVIEW_ROLES);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Governance record tidak ditemukan.');
    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException('Record sudah diarsipkan.');
    }
    return this.repo.completeReview(
      id,
      dto.decision,
      userId,
      getPrimary(roles),
      dto.note ?? null,
      dto.reviewDueDate ?? null,
    );
  }

  async keepActive(id: string, dto: KeepActiveDto, userId: string, roles: string[]) {
    assertNotBlocked(roles);
    assertRole(roles, COMPLETE_REVIEW_ROLES);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Governance record tidak ditemukan.');
    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException('Record sudah diarsipkan.');
    }
    return this.repo.keepActive(id, userId, getPrimary(roles), dto.note ?? null, dto.reviewDueDate ?? null);
  }

  async requestRevision(id: string, dto: RequestRevisionDto, userId: string, roles: string[]) {
    assertNotBlocked(roles);
    assertRole(roles, COMPLETE_REVIEW_ROLES);
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Governance record tidak ditemukan.');
    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException('Tidak dapat request revisi pada record yang sudah diarsipkan.');
    }
    return this.repo.requestRevision(id, userId, getPrimary(roles), dto.note ?? null);
  }

  // ── Reminders ────────────────────────────────────────────────────────────────

  createReminder(governanceId: string, dto: CreateReminderDto, userId: string, roles: string[]) {
    assertNotBlocked(roles);
    assertRole(roles, MARK_REVIEW_ROLES);
    return this.repo.createReminder(governanceId, dto, userId);
  }

  getReminders(
    params: { governanceId?: string; status?: string; moduleKey?: string },
    roles: string[],
  ) {
    assertNotBlocked(roles);
    return this.repo.getReminders(params);
  }

  async resolveReminder(id: string, userId: string, roles: string[]) {
    assertNotBlocked(roles);
    assertRole(roles, MARK_REVIEW_ROLES);
    return this.repo.resolveReminder(id, userId, getPrimary(roles));
  }

  async dismissReminder(id: string, userId: string, roles: string[]) {
    assertNotBlocked(roles);
    assertRole(roles, MARK_REVIEW_ROLES);
    return this.repo.dismissReminder(id, userId, getPrimary(roles));
  }
}
