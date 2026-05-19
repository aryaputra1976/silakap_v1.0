import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import {
  CreateBeritaAcaraDto,
  CreateReconciliationPeriodDto,
  FinalizeBeritaAcaraDto,
  FindingsQueryDto,
  PatchFindingDto,
  ReconciliationQueryDto,
  RunMatchingDto,
  UploadBpkadSimgajiDto,
} from './dto/reconciliation-query.dto';
import { ReconciliationBpkadService } from './reconciliation-bpkad.service';
import { ReconciliationBufferedFile } from './reconciliation-bpkad.types';

const INTERNAL_ROLES = [
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

const UPLOAD_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
  'PPPK',
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...INTERNAL_ROLES)
@Controller('api/v1/reconciliation/bpkad')
export class ReconciliationBpkadController {
  constructor(
    @Inject(ReconciliationBpkadService)
    private readonly service: ReconciliationBpkadService,
  ) {}

  @Get('periods')
  async findPeriods(@CurrentUser() user: AuthUser) {
    return ok(await this.service.findPeriods(user));
  }

  @Post('periods')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA')
  async createPeriod(
    @Body() body: CreateReconciliationPeriodDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.createPeriod(body, user));
  }

  @Get('imports/bpkad-simgaji')
  async findBpkadImportBatches(
    @Query() query: ReconciliationQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.findBpkadImportBatches(query, user));
  }

  @Post('imports/bpkad-simgaji/upload')
  @Roles(...UPLOAD_ROLES)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async uploadBpkadSimgaji(
    @UploadedFile() file: ReconciliationBufferedFile | undefined,
    @Body() body: UploadBpkadSimgajiDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.uploadBpkadSimgaji(file, body, user));
  }

  @Get('imports/bpkad-simgaji/:id')
  async findBpkadImportBatch(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.findBpkadImportBatch(id, user));
  }

  @Get('imports/bpkad-simgaji/:id/rows')
  async findBpkadImportRows(
    @Param('id') id: string,
    @Query() query: ReconciliationQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.findBpkadImportRows(id, query, user));
  }

  @Post('imports/bpkad-simgaji/:id/cancel')
  @Roles(...UPLOAD_ROLES)
  async cancelBpkadImportBatch(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.cancelImportBatch(id, user));
  }

  @Post('periods/:id/matching/run')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA')
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  async runMatching(
    @Param('id') id: string,
    @Body() body: RunMatchingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.runMatching(id, body, user));
  }

  @Get('periods/:id/matching')
  async getMatchingRun(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getMatchingRun(id, user));
  }

  @Get('periods/:id/findings')
  async findFindings(
    @Param('id') id: string,
    @Query() query: FindingsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.findFindings(id, query, user));
  }

  @Get('periods/:id/findings/summary')
  async getFindingsSummary(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getFindingsSummary(id, user));
  }

  @Get('periods/:id/findings/export')
  async exportFindings(
    @Param('id') id: string,
    @Query('findingCode') findingCode: string | undefined,
    @Query('status') status: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.exportFindings(id, { findingCode, status }, user));
  }

  @Patch('periods/:periodId/findings/:findingId')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA')
  async patchFinding(
    @Param('periodId') periodId: string,
    @Param('findingId') findingId: string,
    @Body() body: PatchFindingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.patchFinding(periodId, findingId, body, user));
  }

  @Post('periods/:id/berita-acara')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'ANALIS_MADYA', 'ANALIS_MUDA')
  async createBeritaAcara(
    @Param('id') id: string,
    @Body() body: CreateBeritaAcaraDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.createBeritaAcara(id, body, user));
  }

  @Post('periods/:id/berita-acara/finalize')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
  async finalizeBeritaAcara(
    @Param('id') id: string,
    @Body() body: FinalizeBeritaAcaraDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.finalizeBeritaAcara(id, body, user));
  }

  @Get('periods/:id/berita-acara')
  async getBeritaAcara(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getBeritaAcara(id, user));
  }

  @Get('periods/:id/laporan')
  async getLaporanStats(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.getLaporanStats(id, user));
  }
}
