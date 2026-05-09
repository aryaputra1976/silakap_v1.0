import { Controller, Get } from '@nestjs/common';
import { ok } from '../shared/respond';

@Controller('api/v1/siarsip')
export class SiarsipController {
  @Get('documents')
  findDocuments() {
    return ok([], 'SIARSIP document endpoint ready');
  }
}
