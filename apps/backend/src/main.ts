import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { seedDemo } from './common/seed';
import { corsOrigins } from './common/cors-origins';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET?.trim() || process.env.JWT_SECRET === 'change-me-in-development')) {
    throw new Error('Configure a unique JWT_SECRET before starting the backend in production.');
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: corsOrigins(), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await seedDemo();
  await app.listen(Number(process.env.PORT ?? 4000));
}
bootstrap();
