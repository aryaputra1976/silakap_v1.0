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
import { CreateAbkDto, UpdateAbkDto } from './dto/abk.dto';
import { BulkUpsertBupDto, GenerateBupFromAsnDto, UpsertBupDto } from './dto/bup.dto';
import { CreateBezettingDto, GenerateBezettingDto, UpdateBezettingDto } from './dto/bezetting.dto';
import { CreateFormasiDto, ReviewFormasiDto, UpdateFormasiDto } from './dto/formasi.dto';
import {
  BulkImportJabatanFungsionalRefDto,
  CreateJabatanFungsionalRefDto,
  UpdateJabatanFungsionalRefDto,
} from './dto/jabatan-fungsional-ref.dto';
import { AddJabatanFromRefDto, BulkImportJabatanDto, CreateJabatanDto, UpdateJabatanDto } from './dto/jabatan.dto';
import {
  AbkQueryDto,
  BezettingQueryDto,
  BupQueryDto,
  FormasiQueryDto,
  JabatanFungsionalRefQueryDto,
  JabatanQueryDto,
  ProyeksiQueryDto,
} from './dto/query.dto';
import { SiformenService } from './siformen.service';

const READ_ROLES = [
  'SUPER_ADMIN',
  'ADMIN_BKPSDM',
  'KEPALA_BADAN',
  'KABID',
  'ANALIS_MADYA',
  'ANALIS_MUDA',
  'ANALIS_PERTAMA',
  'PENELAAH',
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...READ_ROLES)
@Controller('api/v1/siformen')
export class SiformenController {
  constructor(
    @Inject(SiformenService)
    private readonly service: SiformenService,
  ) {}

  // ── Jabatan Fungsional Ref ────────────────────────────────────────────

  @Get('jabatan-fungsional-ref/filter-options')
  async getFilterOptions() {
    const result = await this.service.getFilterOptions();
    return ok(result);
  }

  @Get('jabatan-fungsional-ref')
  async listJabatanFungsionalRef(@Query() query: JabatanFungsionalRefQueryDto) {
    const result = await this.service.listJabatanFungsionalRef(query);
    return ok(result);
  }

  @Get('jabatan-fungsional-ref/:id')
  async getJabatanFungsionalRef(@Param('id') id: string) {
    const result = await this.service.getJabatanFungsionalRef(id);
    return ok(result);
  }

  @Post('jabatan-fungsional-ref')
  async createJabatanFungsionalRef(
    @Body() dto: CreateJabatanFungsionalRefDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.createJabatanFungsionalRef(dto, user);
    return ok(result, 'Data referensi jabatan fungsional berhasil ditambahkan');
  }

  @Post('jabatan-fungsional-ref/import')
  async bulkImportJabatanFungsionalRef(
    @Body() dto: BulkImportJabatanFungsionalRefDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.bulkImportJabatanFungsionalRef(dto, user);
    return ok(result, `Import selesai: ${result.created} ditambahkan, ${result.skipped} diperbarui`);
  }

  @Patch('jabatan-fungsional-ref/:id')
  async updateJabatanFungsionalRef(
    @Param('id') id: string,
    @Body() dto: UpdateJabatanFungsionalRefDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.updateJabatanFungsionalRef(id, dto, user);
    return ok(result, 'Data referensi jabatan fungsional berhasil diperbarui');
  }

  @Delete('jabatan-fungsional-ref/:id')
  async deleteJabatanFungsionalRef(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.service.deleteJabatanFungsionalRef(id, user);
    return ok(null, 'Data referensi jabatan fungsional berhasil dihapus');
  }

  // ── Dashboard / Proyeksi ─────────────────────────────────────────────────

  @Get('dashboard')
  async dashboard(@Query('tahun') tahun?: string) {
    const year = tahun ? parseInt(tahun, 10) : new Date().getFullYear();
    const result = await this.service.getDashboard(year);
    return ok(result);
  }

  @Get('proyeksi/summary')
  async proyeksiSummary() {
    const result = await this.service.getProyeksiSummary();
    return ok(result);
  }

  @Get('proyeksi')
  async proyeksi(@Query() query: ProyeksiQueryDto) {
    const result = await this.service.getProyeksiPerUnitKerja(query);
    return ok(result);
  }

  @Get('bup')
  async bupList(@Query() query: BupQueryDto) {
    const result = await this.service.getBupList(query);
    return ok(result);
  }

  @Get('bup/jabatan/:jabatanId')
  async bupPerJabatan(@Param('jabatanId') jabatanId: string) {
    const result = await this.service.getBupPerJabatan(jabatanId);
    return ok(result);
  }

  @Post('bup/upsert')
  async upsertBup(@Body() dto: UpsertBupDto, @CurrentUser() user: AuthUser) {
    const result = await this.service.upsertBup(dto, user);
    return ok(result, 'Data BUP berhasil disimpan');
  }

  @Post('bup/bulk-upsert')
  async bulkUpsertBup(@Body() dto: BulkUpsertBupDto, @CurrentUser() user: AuthUser) {
    const result = await this.service.bulkUpsertBup(dto, user);
    return ok(result, `${result.upserted} data BUP berhasil disimpan`);
  }

  @Post('bup/generate-from-asn')
  async generateBupFromAsn(@Body() dto: GenerateBupFromAsnDto, @CurrentUser() user: AuthUser) {
    const result = await this.service.generateBupFromAsn(dto, user);
    return ok(result, `${result.created} entri BUP di-generate dari data ASN`);
  }

  @Get('rekap-pegawai')
  async rekapPegawai() {
    const result = await this.service.getRekapPegawai();
    return ok(result);
  }

  // ── Jabatan ───────────────────────────────────────────────────────────

  @Get('jabatan')
  async listJabatan(@Query() query: JabatanQueryDto) {
    const result = await this.service.listJabatan(query);
    return ok(result);
  }

  @Get('jabatan/:id')
  async getJabatan(@Param('id') id: string) {
    const result = await this.service.getJabatan(id);
    return ok(result);
  }

  @Post('jabatan/generate-from-unit-kerja')
  async generateJabatanFromUnitKerja(@CurrentUser() user: AuthUser) {
    const result = await this.service.generateJabatanFromUnitKerja(user);
    return ok(
      result,
      `Generate selesai: ${result.created} jabatan dibuat, ${result.updated} diperbarui`,
    );
  }

  @Post('jabatan/import')
  async bulkImportJabatan(@Body() dto: BulkImportJabatanDto, @CurrentUser() user: AuthUser) {
    const result = await this.service.bulkImportJabatan(dto, user);
    return ok(result, `Import selesai: ${result.created} ditambahkan, ${result.updated} diperbarui`);
  }

  @Post('jabatan/from-ref')
  async addJabatanFromRef(@Body() dto: AddJabatanFromRefDto, @CurrentUser() user: AuthUser) {
    const result = await this.service.addJabatanFromRef(dto, user);
    return ok(result, 'Jabatan berhasil ditambahkan ke Peta Jabatan');
  }

  @Post('jabatan/sync-from-asn')
  async syncJabatanFromAsn(@CurrentUser() user: AuthUser) {
    const result = await this.service.syncJabatanFromAsn(user);
    return ok(
      result,
      `Sinkronisasi selesai: ${result.created} jabatan dibuat, ${result.matched} ter-link ke referensi`,
    );
  }

  @Post('jabatan')
  async createJabatan(@Body() dto: CreateJabatanDto, @CurrentUser() user: AuthUser) {
    const result = await this.service.createJabatan(dto, user);
    return ok(result, 'Data jabatan berhasil ditambahkan');
  }

  @Patch('jabatan/:id')
  async updateJabatan(
    @Param('id') id: string,
    @Body() dto: UpdateJabatanDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.updateJabatan(id, dto, user);
    return ok(result, 'Data jabatan berhasil diperbarui');
  }

  @Delete('jabatan/:id')
  async deleteJabatan(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.service.deleteJabatan(id, user);
    return ok(null, 'Data jabatan berhasil dihapus');
  }

  // ── Bezetting ─────────────────────────────────────────────────────────

  @Post('bezetting/generate-from-jabatan')
  async generateBezettingFromJabatan(
    @Body() dto: GenerateBezettingDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.generateBezettingFromJabatan(dto, user);
    return ok(
      result,
      `Generate selesai: ${result.created} posisi dibuat, ${result.skipped} dilewati`,
    );
  }

  @Get('bezetting')
  async listBezetting(@Query() query: BezettingQueryDto) {
    const result = await this.service.listBezetting(query);
    return ok(result);
  }

  @Get('bezetting/:id')
  async getBezetting(@Param('id') id: string) {
    const result = await this.service.getBezetting(id);
    return ok(result);
  }

  @Post('bezetting')
  async createBezetting(@Body() dto: CreateBezettingDto, @CurrentUser() user: AuthUser) {
    const result = await this.service.createBezetting(dto, user);
    return ok(result, 'Data bezetting berhasil ditambahkan');
  }

  @Patch('bezetting/:id')
  async updateBezetting(
    @Param('id') id: string,
    @Body() dto: UpdateBezettingDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.updateBezetting(id, dto, user);
    return ok(result, 'Data bezetting berhasil diperbarui');
  }

  @Delete('bezetting/:id')
  async deleteBezetting(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.service.deleteBezetting(id, user);
    return ok(null, 'Data bezetting berhasil dihapus');
  }

  // ── Formasi ───────────────────────────────────────────────────────────

  @Get('formasi')
  async listFormasi(@Query() query: FormasiQueryDto) {
    const result = await this.service.listFormasi(query);
    return ok(result);
  }

  @Get('formasi/:id')
  async getFormasi(@Param('id') id: string) {
    const result = await this.service.getFormasi(id);
    return ok(result);
  }

  @Post('formasi')
  async createFormasi(@Body() dto: CreateFormasiDto, @CurrentUser() user: AuthUser) {
    const result = await this.service.createFormasi(dto, user);
    return ok(result, 'Usulan formasi berhasil ditambahkan');
  }

  @Patch('formasi/:id')
  async updateFormasi(
    @Param('id') id: string,
    @Body() dto: UpdateFormasiDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.updateFormasi(id, dto, user);
    return ok(result, 'Usulan formasi berhasil diperbarui');
  }

  @Post('formasi/:id/submit')
  async submitFormasi(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.service.submitFormasi(id, user);
    return ok(result, 'Usulan formasi berhasil disubmit');
  }

  @Post('formasi/:id/approve')
  async approveFormasi(
    @Param('id') id: string,
    @Body() dto: ReviewFormasiDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.approveFormasi(id, dto, user);
    return ok(result, 'Usulan formasi berhasil disetujui');
  }

  @Post('formasi/:id/reject')
  async rejectFormasi(
    @Param('id') id: string,
    @Body() dto: ReviewFormasiDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.rejectFormasi(id, dto, user);
    return ok(result, 'Usulan formasi ditolak');
  }

  @Delete('formasi/:id')
  async deleteFormasi(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.service.deleteFormasi(id, user);
    return ok(null, 'Usulan formasi berhasil dihapus');
  }

  // ── ABK ───────────────────────────────────────────────────────────────

  @Get('abk/bezetting-count')
  async getFilledBezettingCount(
    @Query('namaJabatan') namaJabatan: string,
    @Query('tahun') tahun: string,
    @Query('jabatanId') jabatanId?: string,
  ) {
    const result = await this.service.getFilledBezettingCount({
      jabatanId: jabatanId || undefined,
      namaJabatan: namaJabatan ?? '',
      tahun: parseInt(tahun, 10) || new Date().getFullYear(),
    });
    return ok(result);
  }

  @Get('abk')
  async listAbk(@Query() query: AbkQueryDto) {
    const result = await this.service.listAbk(query);
    return ok(result);
  }

  @Get('abk/:id')
  async getAbk(@Param('id') id: string) {
    const result = await this.service.getAbk(id);
    return ok(result);
  }

  @Post('abk')
  async createAbk(@Body() dto: CreateAbkDto, @CurrentUser() user: AuthUser) {
    const result = await this.service.createAbk(dto, user);
    return ok(result, 'Data ABK berhasil ditambahkan');
  }

  @Patch('abk/:id')
  async updateAbk(
    @Param('id') id: string,
    @Body() dto: UpdateAbkDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.service.updateAbk(id, dto, user);
    return ok(result, 'Data ABK berhasil diperbarui');
  }

  @Delete('abk/:id')
  async deleteAbk(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.service.deleteAbk(id, user);
    return ok(null, 'Data ABK berhasil dihapus');
  }
}
