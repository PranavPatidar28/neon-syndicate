import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { HealthResponse } from '@neon/contracts';
@ApiTags('system')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ schema: { example: { service: 'api', status: 'ok' } } })
  health(): HealthResponse {
    return { service: 'api', status: 'ok' };
  }
}
