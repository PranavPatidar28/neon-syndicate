import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './app.module.js';
async function bootstrap() {
  await NestFactory.createApplicationContext(WorkerModule);
  Logger.log(
    'Worker foundation online; queues unlock in Ghost Workers.',
    'Bootstrap',
  );
}
void bootstrap();
