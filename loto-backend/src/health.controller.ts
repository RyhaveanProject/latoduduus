import { Controller, Get, Head } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

// Bu controller global prefix-dən ('api') KƏNARDA qalır.
// Render platforması / və /health endpoint-lərini yoxlayır.
// main.ts-də: app.setGlobalPrefix('api', { exclude: ['/'] })
@ApiTags('Health')
@Controller()
export class HealthController {
  // Render health probe: GET /
  @Get()
  root() {
    return {
      status: 'ok',
      service: 'loto-backend',
      timestamp: new Date().toISOString(),
    };
  }

  // Render health probe: HEAD /
  @Head()
  rootHead() {
    return;
  }

  // Əlavə health endpoint: GET /health (prefix-dən kənarda)
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
