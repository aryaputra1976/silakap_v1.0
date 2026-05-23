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
import { JenisPemberhentian, StatusPemberhentian } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../auth/auth.types';
import { ok } from '../shared/respond';
import { PemberhentianService } from './pemberhentian.service';
import {
  AddDokumenDto,
  CreatePemberhentianDto,
  TransisiStatusDto,
  UpdatePemberhentianDto,
} from './pemberhentian.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/pemberhentian')
export class PemberhentianController {
  constructor(
    @Inject(PemberhentianService)
    private readonly service: PemberhentianService,
  ) {}

  @Get('monitoring')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'OPERATOR_IMPORT', 'VIEWER')
  async monitoring(@Query('bulan') bulan?: string) {
    const bulanKedepan = bulan ? parseInt(bulan, 10) : 12;
    return ok(await this.service.getMonitoring(bulanKedepan));
  }

  @Get('proses')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'OPERATOR_IMPORT', 'VIEWER')
  async listProses(
    @Query('q') q?: string,
    @Query('status') status?: StatusPemberhentian,
    @Query('jenis') jenis?: JenisPemberhentian,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return ok(
      await this.service.listProses({
        q: q || undefined,
        status,
        jenisPemberhentian: jenis,
        page: Math.max(1, parseInt(page ?? '1', 10) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20)),
      }),
    );
  }

  @Post('proses')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
  async createProses(
    @Body() body: CreatePemberhentianDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.createProses(body, user), 'Proses pemberhentian berhasil dibuat');
  }

  @Get('proses/:id')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'OPERATOR_IMPORT', 'VIEWER')
  async getProses(@Param('id') id: string) {
    return ok(await this.service.getProses(id));
  }

  @Patch('proses/:id')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
  async updateProses(
    @Param('id') id: string,
    @Body() body: UpdatePemberhentianDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.updateProses(id, body, user), 'Proses berhasil diperbarui');
  }

  @Post('proses/:id/transisi')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
  async transisiStatus(
    @Param('id') id: string,
    @Body() body: TransisiStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(
      await this.service.transisiStatus(id, body, user),
      'Status berhasil diperbarui',
    );
  }

  @Delete('proses/:id')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM')
  async deleteProses(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.deleteProses(id, user), 'Proses berhasil dihapus');
  }

  @Post('proses/:id/dokumen')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
  async addDokumen(
    @Param('id') id: string,
    @Body() body: AddDokumenDto,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.addDokumen(id, body, user), 'Dokumen berhasil ditambahkan');
  }

  @Delete('proses/:id/dokumen/:dokId')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
  async deleteDokumen(
    @Param('id') id: string,
    @Param('dokId') dokId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return ok(await this.service.deleteDokumen(id, dokId, user), 'Dokumen berhasil dihapus');
  }
}
