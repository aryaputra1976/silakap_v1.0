import { Body, Controller, Get, Inject, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { RefGajiPokokService } from './ref-gaji-pokok.service';
import { ImportGajiPokokPayload } from './ref-gaji-pokok.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/ref-gaji-pokok')
export class RefGajiPokokController {
  constructor(
    @Inject(RefGajiPokokService)
    private readonly service: RefGajiPokokService,
  ) {}

  @Get('periodes')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'OPERATOR_IMPORT', 'VIEWER')
  async listPeriodes() {
    return ok(await this.service.listPeriodes());
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'OPERATOR_IMPORT', 'VIEWER')
  async listAll(
    @Query('golonganKode') golonganKode?: string,
    @Query('berlakuSejak') berlakuSejak?: string,
  ) {
    return ok(await this.service.listAll(golonganKode || undefined, berlakuSejak || undefined));
  }

  @Get('matrix')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'OPERATOR_IMPORT', 'VIEWER')
  async getMatrix(@Query('berlakuSejak') berlakuSejak?: string) {
    return ok(await this.service.getMatrix(berlakuSejak || undefined));
  }

  @Get('lookup')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'OPERATOR_IMPORT', 'VIEWER')
  async lookup(
    @Query('golonganKode') golonganKode: string,
    @Query('masaKerja') masaKerja: string,
    @Query('berlakuSejak') berlakuSejak?: string,
  ) {
    return ok(await this.service.lookup(golonganKode, parseInt(masaKerja, 10), berlakuSejak || undefined));
  }

  @Get('summary')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID', 'OPERATOR_IMPORT', 'VIEWER')
  async getSummary() {
    return ok(await this.service.getSummary());
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM')
  async updateById(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { gajiPokok: number },
  ) {
    const result = await this.service.updateById(id, body.gajiPokok);
    return ok(result, `Gaji pokok berhasil diperbarui`);
  }

  @Post('import')
  @Roles('SUPER_ADMIN', 'ADMIN_BKPSDM')
  async bulkImport(@Body() body: { records: ImportGajiPokokPayload[]; berlakuSejak: string }) {
    const result = await this.service.bulkImport(body.records, body.berlakuSejak);
    return ok(result, `${result.count} record gaji pokok berhasil di-import`);
  }
}
