import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import { AppModule } from './modules/app.module';

config({ quiet: true });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const webOrigin = process.env.WEB_ORIGIN || '*';

  app.enableCors({
    origin: webOrigin === '*' ? true : webOrigin,
    credentials: true,
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
}

bootstrap();
