import 'reflect-metadata';
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { validateEnv } from './config/env';
import { AppModule } from './modules/app.module';
import { GlobalHttpExceptionFilter } from './modules/shared/http-exception.filter';

const appConfig = validateEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: appConfig.webOrigins,
    credentials: true,
  });
  app.use(json({ limit: appConfig.requestBodyLimit }));
  app.use(urlencoded({ extended: true, limit: appConfig.requestBodyLimit }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: appConfig.nodeEnv === 'production',
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  await app.listen(appConfig.port);
}

bootstrap();
