import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ambil config ENV
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const frontendUrl = configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    // Prefix global untuk semua route
  app.setGlobalPrefix('api');

  // Header Keamanan
   app.use(helmet());

  // Aktifkan CORS
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

    // Validation pipe global (otomatis validasi DTO)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // hapus field yang tidak ada di DTO
      forbidNonWhitelisted: true, // error kalau ada field asing
      transform: true, // auto transform ke tipe DTO
    }),
  );


  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/api`);
  console.log(`✅ CORS enabled for: ${frontendUrl}`);
}

bootstrap();
