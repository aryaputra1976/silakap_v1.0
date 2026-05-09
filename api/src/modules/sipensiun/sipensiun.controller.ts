import { Controller, Get } from '@nestjs/common';
import { ok } from '../shared/respond';

@Controller('api/v1/sipensiun')
export class SipensiunController {
  @Get('cases')
  findCases() {
    return ok([], 'SIPENSIUN pilot endpoint ready');
  }
}
