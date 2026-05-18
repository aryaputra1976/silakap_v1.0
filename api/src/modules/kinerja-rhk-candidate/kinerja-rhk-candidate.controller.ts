import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { AuthUser } from '../auth/auth.types';
import {
  RhkCandidateActionDto,
  RhkCandidateQueryDto,
  RhkCandidateRequiredNoteDto,
} from './dto/rhk-candidate-query.dto';
import { KinerjaRhkCandidateService } from './kinerja-rhk-candidate.service';

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

const APPROVE_ROLES = ['SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID'];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/internal/rhk-candidates')
export class KinerjaRhkCandidateController {
  constructor(private readonly service: KinerjaRhkCandidateService) {}

  @Get()
  @Roles(...VIEW_ROLES)
  async list(
    @Query() query: RhkCandidateQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.list(query, user));
  }

  @Get('summary')
  @Roles(...VIEW_ROLES)
  async summary(@CurrentUser() user: AuthUser) {
    return ok(await this.service.getSummary(user));
  }

  @Get('by-submission/:submissionId')
  @Roles(...VIEW_ROLES)
  async getBySubmission(
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getBySubmissionId(submissionId, user));
  }

  @Get(':id')
  @Roles(...VIEW_ROLES)
  async getById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return ok(await this.service.getById(id, user));
  }

  @Post(':id/approve')
  @Roles(...APPROVE_ROLES)
  async approve(
    @Param('id') id: string,
    @Body() dto: RhkCandidateActionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(
      await this.service.approve(id, dto, user),
      'Kandidat RHK berhasil disetujui',
    );
  }

  @Post(':id/reject')
  @Roles(...APPROVE_ROLES)
  async reject(
    @Param('id') id: string,
    @Body() dto: RhkCandidateRequiredNoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(
      await this.service.reject(id, dto, user),
      'Kandidat RHK berhasil ditolak',
    );
  }

  @Post(':id/archive')
  @Roles(...APPROVE_ROLES)
  async archive(
    @Param('id') id: string,
    @Body() dto: RhkCandidateActionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(
      await this.service.archive(id, dto, user),
      'Kandidat RHK berhasil diarsipkan',
    );
  }
}
