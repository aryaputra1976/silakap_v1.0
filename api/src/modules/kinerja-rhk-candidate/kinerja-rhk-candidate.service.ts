import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types';
import type { OpdSubmissionRecord } from '../opd-submission/opd-submission.repository';
import { calculateCompletionScores } from '../opd-submission/opd-completion.policy';
import type { RhkCandidateActionDto, RhkCandidateQueryDto, RhkCandidateRequiredNoteDto } from './dto/rhk-candidate-query.dto';
import { getRhkSopMapping } from './rhk-sop.mapping';
import {
  KinerjaRhkCandidateRepository,
  type KinerjaRhkCandidateRecord,
} from './kinerja-rhk-candidate.repository';
import { KinerjaRhkRealizationService } from '../kinerja-rhk-realization/kinerja-rhk-realization.service';

const APPROVE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'];
const VIEW_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];

function primaryRole(user: AuthUser): string | null {
  return user.roles?.[0] ?? null;
}

function ensureRole(user: AuthUser, roles: string[], action: string) {
  const role = primaryRole(user);
  if (!role || !roles.includes(role)) {
    throw new ForbiddenException(`Tidak ada izin untuk ${action}`);
  }
}

function ensureView(user: AuthUser) {
  ensureRole(user, VIEW_ROLES, 'melihat kandidat RHK');
}

function ensureApprove(user: AuthUser) {
  ensureRole(user, APPROVE_ROLES, 'memvalidasi kandidat RHK');
}

@Injectable()
export class KinerjaRhkCandidateService {
  constructor(
    @Inject(KinerjaRhkCandidateRepository)
    private readonly repo: KinerjaRhkCandidateRepository,
    @Inject(KinerjaRhkRealizationService)
    private readonly realizationService: KinerjaRhkRealizationService,
  ) {}

  async generateFromSubmission(
    submission: OpdSubmissionRecord,
    actorId: string | null,
    checklistPercent = 0,
  ): Promise<KinerjaRhkCandidateRecord> {
    const scores = calculateCompletionScores(submission, checklistPercent);
    const mapping = getRhkSopMapping(submission.moduleKey, submission.serviceType);

    const candidate = await this.repo.upsertFromSubmission({
      opdSubmissionId: submission.id,
      rhkCode: mapping.rhkCode,
      sopCode: mapping.sopCode,
      moduleKey: submission.moduleKey,
      serviceType: submission.serviceType,
      title: submission.title,
      opdName: submission.opdName,
      subjectName: submission.subjectName,
      subjectNip: submission.subjectNip,
      qualityScore: scores.qualityScore,
      timeScore: scores.timeScore,
      evidenceScore: scores.evidenceScore,
      overallScore: scores.overallScore,
      slaStatus: submission.slaStatus,
      slaElapsedHours: submission.slaElapsedHours,
      completedAt: submission.completedAt,
      createdById: actorId,
    });

    await this.repo.createAudit({
      candidateId: candidate.id,
      action: 'CANDIDATE_GENERATED',
      actorId,
      actorRole: null,
      afterJson: {
        opdSubmissionId: submission.id,
        qualityScore: scores.qualityScore,
        timeScore: scores.timeScore,
        evidenceScore: scores.evidenceScore,
        overallScore: scores.overallScore,
        rhkCode: mapping.rhkCode,
        sopCode: mapping.sopCode,
      },
    });

    return candidate;
  }

  async list(query: RhkCandidateQueryDto, user: AuthUser) {
    ensureView(user);
    return this.repo.findMany(query);
  }

  async getById(id: string, user: AuthUser) {
    ensureView(user);
    const candidate = await this.repo.findById(id);
    if (!candidate) {
      throw new NotFoundException('Kandidat RHK tidak ditemukan');
    }
    return candidate;
  }

  async getBySubmissionId(opdSubmissionId: string, user: AuthUser) {
    ensureView(user);
    return this.repo.findBySubmissionId(opdSubmissionId);
  }

  async getSummary(user: AuthUser) {
    ensureView(user);
    return this.repo.getSummary();
  }

  async approve(id: string, dto: RhkCandidateActionDto, user: AuthUser) {
    ensureApprove(user);
    const candidate = await this.repo.findById(id);
    if (!candidate) {
      throw new NotFoundException('Kandidat RHK tidak ditemukan');
    }

    if (candidate.status !== 'CANDIDATE') {
      throw new BadRequestException(
        `Hanya kandidat berstatus CANDIDATE yang dapat disetujui. Status saat ini: ${candidate.status}`,
      );
    }

    const role = primaryRole(user);
    const updated = await this.repo.updateStatus(id, {
      status: 'APPROVED',
      approvedById: user.id,
      approvedByRole: role,
      approvedAt: new Date(),
      approvalNote: dto.note ?? null,
    });

    await this.repo.createAudit({
      candidateId: id,
      action: 'CANDIDATE_APPROVED',
      actorId: user.id,
      actorRole: role,
      note: dto.note,
      beforeJson: { status: candidate.status },
      afterJson: { status: 'APPROVED' },
    });

    await this.realizationService.createApprovedRealization(updated, dto, user);

    return updated;
  }

  async reject(id: string, dto: RhkCandidateRequiredNoteDto, user: AuthUser) {
    ensureApprove(user);
    const candidate = await this.repo.findById(id);
    if (!candidate) {
      throw new NotFoundException('Kandidat RHK tidak ditemukan');
    }

    if (candidate.status !== 'CANDIDATE') {
      throw new BadRequestException(
        `Hanya kandidat berstatus CANDIDATE yang dapat ditolak. Status saat ini: ${candidate.status}`,
      );
    }

    if (!dto.note?.trim()) {
      throw new BadRequestException('Catatan penolakan wajib diisi');
    }

    const role = primaryRole(user);
    const updated = await this.repo.updateStatus(id, {
      status: 'REJECTED',
      rejectedById: user.id,
      rejectedByRole: role,
      rejectedAt: new Date(),
      rejectionNote: dto.note,
    });

    await this.repo.createAudit({
      candidateId: id,
      action: 'CANDIDATE_REJECTED',
      actorId: user.id,
      actorRole: role,
      note: dto.note,
      beforeJson: { status: candidate.status },
      afterJson: { status: 'REJECTED' },
    });

    return updated;
  }

  async archive(id: string, dto: RhkCandidateActionDto, user: AuthUser) {
    ensureApprove(user);
    const candidate = await this.repo.findById(id);
    if (!candidate) {
      throw new NotFoundException('Kandidat RHK tidak ditemukan');
    }

    if (candidate.status === 'ARCHIVED') {
      throw new BadRequestException('Kandidat sudah diarsipkan');
    }

    const role = primaryRole(user);
    const updated = await this.repo.updateStatus(id, {
      status: 'ARCHIVED',
    });

    await this.repo.createAudit({
      candidateId: id,
      action: 'CANDIDATE_ARCHIVED',
      actorId: user.id,
      actorRole: role,
      note: dto.note,
      beforeJson: { status: candidate.status },
      afterJson: { status: 'ARCHIVED' },
    });

    return updated;
  }
}
