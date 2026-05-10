import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ok } from '../shared/respond';
import { getAuditContext } from '../shared/request-context';
import { CreateSipensiunCaseDto } from './dto/create-sipensiun-case.dto';
import { SipensiunCaseListQueryDto } from './dto/sipensiun-case-list-query.dto';
import { UpdateSipensiunLetterDataDto } from './dto/update-sipensiun-letter-data.dto';
import { SipensiunService } from './sipensiun.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN_BKPSDM', 'KABID')
@Controller('api/v1/sipensiun')
export class SipensiunController {
  constructor(
    @Inject(SipensiunService)
    private readonly sipensiunService: SipensiunService,
  ) {}

  @Get('requirements')
  requirements() {
    return ok(this.sipensiunService.getRequirements());
  }

  @Get('templates')
  templates() {
    return ok(this.sipensiunService.getTemplates());
  }

  @Get('cases')
  async findCases(@Query() query: SipensiunCaseListQueryDto) {
    const result = await this.sipensiunService.findCases(query);

    return ok(result);
  }

  @Get('cases/:id/letter-preview')
  async getLetterPreview(@Param('id') id: string) {
    const result = await this.sipensiunService.getLetterPreview(id);

    return ok(result, 'Preview surat SIPENSIUN berhasil dimuat');
  }

  @Patch('cases/:id/letter-data')
  async updateLetterData(
    @Param('id') id: string,
    @Body() dto: UpdateSipensiunLetterDataDto,
    @CurrentUser() user: AuthUser,
  ) {
    const result = await this.sipensiunService.updateLetterData(id, dto, user);

    return ok(result, 'Data surat SIPENSIUN berhasil diperbarui');
  }

  @Get('cases/:id')
  async findCaseById(@Param('id') id: string) {
    const result = await this.sipensiunService.findCaseById(id);

    return ok(result);
  }

  @Post('cases')
  async createCase(
    @Body() dto: CreateSipensiunCaseDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.sipensiunService.createCase(
      dto,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Usulan pensiun berhasil dibuat');
  }

  @Post('cases/:id/submit')
  async submitCase(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.sipensiunService.submitCase(
      id,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Usulan pensiun berhasil disubmit');
  }

  @Post('cases/:id/generate-letter')
  async generateLetter(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    const result = await this.sipensiunService.generateLetter(
      id,
      user,
      getAuditContext(request),
    );

    return ok(result, 'Surat permohonan pensiun berhasil digenerate');
  }
}
