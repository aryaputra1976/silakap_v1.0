import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { CreateSopRealizationDto } from './dto/create-sop-realization.dto';
import {
  KinerjaBidangReportQueryDto,
  KinerjaBidangSopQueryDto,
  KinerjaBidangTargetQueryDto,
} from './dto/kinerja-bidang-query.dto';
import { AddSopEvidenceDto, RealizationReviewDto, UpdateSopRealizationDto } from './dto/update-sop-realization.dto';
import { KinerjaBidangService } from './kinerja-bidang.service';
import {
  KINERJA_BIDANG_READ_ROLES,
  KINERJA_BIDANG_REVIEW_ROLES,
  KINERJA_BIDANG_SEED_ROLES,
  KINERJA_BIDANG_WRITE_ROLES,
} from './constants/kinerja-bidang-roles.constant';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...KINERJA_BIDANG_READ_ROLES)
@Controller('api/v1/kinerja-bidang')
export class KinerjaBidangController {
  constructor(
    @Inject(KinerjaBidangService)
    private readonly service: KinerjaBidangService,
  ) {}

  @Post('seed-default')
  @Roles(...KINERJA_BIDANG_SEED_ROLES)
  async seedDefault(@CurrentUser() user: AuthUser) {
    const result = await this.service.seedDefault(user);
    return ok(result, 'Seed SOP/RHK Bidang PPIK berhasil');
  }

  @Get('sop')
  async listSop(@Query() query: KinerjaBidangSopQueryDto) {
    const result = await this.service.listSop(query);
    return ok(result);
  }

  @Get('sop/:idOrCode')
  async getSop(@Param('idOrCode') idOrCode: string) {
    const result = await this.service.getSop(idOrCode);
    return ok(result);
  }

  @Get('dashboard')
  async dashboard(@Query() query: KinerjaBidangReportQueryDto) {
    const result = await this.service.getDashboard(query);
    return ok(result);
  }

  @Get('report')
  async report(@Query() query: KinerjaBidangReportQueryDto) {
    const result = await this.service.getReport(query);
    return ok(result);
  }

  @Get('targets')
  async listTargets(@Query() query: KinerjaBidangTargetQueryDto) {
    const result = await this.service.listTargets(query);
    return ok(result);
  }

  @Get('realizations')
  async listRealizations(@Query() query: KinerjaBidangReportQueryDto) {
    const result = await this.service.listRealizations(query);
    return ok(result);
  }

  @Get('realizations/:id')
  async getRealization(@Param('id') id: string) {
    const result = await this.service.getRealization(id);
    return ok(result);
  }

  @Post('realizations')
  @Roles(...KINERJA_BIDANG_WRITE_ROLES)
  async createRealization(@Body() dto: CreateSopRealizationDto, @CurrentUser() user: AuthUser) {
    const result = await this.service.createRealization(dto, user);
    return ok(result, 'Realisasi SOP/RHK berhasil dibuat');
  }

  @Patch('realizations/:id')
  @Roles(...KINERJA_BIDANG_WRITE_ROLES)
  async updateRealization(
    @Param('id') id: string,
    @Body() dto: UpdateSopRealizationDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.updateRealization(id, dto, user);
    return ok(result, 'Realisasi SOP/RHK berhasil diperbarui');
  }

  @Post('realizations/:id/submit')
  @Roles(...KINERJA_BIDANG_WRITE_ROLES)
  async submitRealization(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.service.submitRealization(id, user);
    return ok(result, 'Realisasi SOP/RHK berhasil disubmit');
  }

  @Post('realizations/:id/review')
  @Roles(...KINERJA_BIDANG_REVIEW_ROLES)
  async reviewRealization(
    @Param('id') id: string,
    @Body() dto: RealizationReviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.reviewRealization(id, dto, user);
    return ok(result, 'Realisasi SOP/RHK berhasil direview');
  }

  @Post('realizations/:id/approve')
  @Roles(...KINERJA_BIDANG_REVIEW_ROLES)
  async approveRealization(
    @Param('id') id: string,
    @Body() dto: RealizationReviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.approveRealization(id, dto, user);
    return ok(result, 'Realisasi SOP/RHK berhasil disetujui');
  }

  @Post('realizations/:id/request-revision')
  @Roles(...KINERJA_BIDANG_REVIEW_ROLES)
  async requestRevision(
    @Param('id') id: string,
    @Body() dto: RealizationReviewDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.requestRevision(id, dto, user);
    return ok(result, 'Realisasi SOP/RHK dikembalikan untuk revisi');
  }

  @Post('realizations/:id/evidence')
  @Roles(...KINERJA_BIDANG_WRITE_ROLES)
  async addEvidence(
    @Param('id') id: string,
    @Body() dto: AddSopEvidenceDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.addEvidence(id, dto, user);
    return ok(result, 'Bukti dukung berhasil ditautkan');
  }

  @Delete('realizations/:id/evidence/:evidenceId')
  @Roles(...KINERJA_BIDANG_WRITE_ROLES)
  async removeEvidence(@Param('id') id: string, @Param('evidenceId') evidenceId: string) {
    const result = await this.service.removeEvidence(id, evidenceId);
    return ok(result, 'Bukti dukung berhasil dilepas');
  }
}
