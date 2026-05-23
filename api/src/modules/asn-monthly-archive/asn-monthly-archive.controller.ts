import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { AsnMonthlyArchiveService } from './asn-monthly-archive.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'OPERATOR_IMPORT')
@Controller('api/v1/asn-archive')
export class AsnMonthlyArchiveController {
  constructor(
    @Inject(AsnMonthlyArchiveService)
    private readonly service: AsnMonthlyArchiveService,
  ) {}

  @Get()
  async listArchives() {
    return ok(await this.service.listArchives());
  }

  @Get('eligible-batches')
  async listEligibleBatches() {
    return ok(await this.service.listEligibleBatches());
  }

  @Post()
  async createArchive(
    @Body() body: { bulan: number; tahun: number; batchId?: string },
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.createArchive({
      bulan: body.bulan,
      tahun: body.tahun,
      batchId: body.batchId,
      userId: user.id,
    });
    const msg = result.isNew
      ? `Arsip ${result.label} berhasil dibuat (${result.totalChanges} perubahan terdeteksi)`
      : `Arsip ${result.label} berhasil diperbarui (${result.totalChanges} perubahan terdeteksi)`;
    return ok(result, msg);
  }

  @Post('from-batch')
  async createArchiveFromBatch(
    @Body() body: { bulan: number; tahun: number; batchId: string },
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.createArchiveFromBatch({
      bulan: body.bulan,
      tahun: body.tahun,
      batchId: body.batchId,
      userId: user.id,
    });
    const msg = result.isNew
      ? `Arsip ${result.label} berhasil dibuat dari batch import (${result.totalChanges} perubahan terdeteksi)`
      : `Arsip ${result.label} berhasil diperbarui dari batch import (${result.totalChanges} perubahan terdeteksi)`;
    return ok(result, msg);
  }

  @Get('mendekati-pensiun')
  async getMendekatiPensiun(
    @Query('bulanKedepan') bulanKedepan?: string,
  ) {
    const bk = bulanKedepan ? parseInt(bulanKedepan, 10) : 6;
    return ok(await this.service.getMendekatiPensiun(isNaN(bk) ? 6 : bk));
  }

  @Get(':id')
  async getArchiveDetail(@Param('id') id: string) {
    return ok(await this.service.getArchiveDetail(id));
  }

  @Post(':id/finalize')
  async finalizeArchive(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.finalizeArchive(id, user.id);
    return ok(result, `Arsip ${result.label} berhasil di-finalisasi`);
  }

  @Get(':id/changes')
  async getChanges(
    @Param('id') id: string,
    @Query('changeType') changeType?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return ok(await this.service.getChanges({
      archiveId: id,
      changeType: changeType || undefined,
      search: search || undefined,
      page: isNaN(p) || p < 1 ? 1 : p,
      limit: isNaN(l) || l < 1 ? 20 : Math.min(l, 100),
    }));
  }
}
