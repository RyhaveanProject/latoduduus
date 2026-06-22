import { Controller, Get, Head } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      status: 'ok',
      service: 'loto-backend',
      timestamp: new Date().toISOString(),
    };
  }

  @Head()
  rootHead() {
    return;
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  // /api endpoint-ə düzgün cavab ver (404 deyil, info göstər)
  @Get('api')
  apiInfo() {
    return {
      status: 'ok',
      service: 'loto-backend',
      version: '1.0.0',
      message: 'API is running. Use /api/* endpoints.',
      docs: process.env.NODE_ENV !== 'production' ? '/docs' : undefined,
      timestamp: new Date().toISOString(),
    };
  }
}
