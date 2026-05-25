import 'reflect-metadata';
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { validateEnv } from './config/env';
import { AppModule } from './modules/app.module';
import { GlobalHttpExceptionFilter } from './modules/shared/http-exception.filter';
import { requestIdMiddleware } from './modules/shared/request-id.middleware';
import { securityHeadersMiddleware } from './modules/shared/security-headers.middleware';

const appConfig = validateEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (appConfig.trustProxy) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  if (appConfig.securityHeadersEnabled) {
    app.use(securityHeadersMiddleware);
  }

  app.use(requestIdMiddleware);

  app.enableCors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (appConfig.webOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin tidak diizinkan'), false);
    },
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

  if (appConfig.nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Silakap API')
      .setDescription('API Sistem Layanan Kepegawaian (Silakap) — BKPSDM')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(appConfig.port);

  // eslint-disable-next-line no-console
  console.log(
    `${appConfig.appName} running on http://localhost:${appConfig.port}`,
  );

  if (appConfig.nodeEnv !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`Swagger docs: http://localhost:${appConfig.port}/api/docs`);
  }
}

bootstrap();