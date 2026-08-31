import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import pinoHttp from 'pino-http';
import { AppModule } from './app.module.js';
import { appLogger, PinoLoggerService } from './pino-logger.service.js';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new PinoLoggerService());
  app.use(
    pinoHttp({
      logger: appLogger,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    }),
  );
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Neon Syndicate API')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );
  await app.listen(Number(process.env.API_PORT ?? 4000), '0.0.0.0');
}
void bootstrap();
