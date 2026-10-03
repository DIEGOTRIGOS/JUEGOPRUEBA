import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { seedDemo } from './common/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: [process.env.CORS_ORIGIN ?? 'http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await seedDemo();
  await app.listen(Number(process.env.PORT ?? 4000));
}
bootstrap();
