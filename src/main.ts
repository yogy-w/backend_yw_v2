// src/main.ts  (replace bagian static + debug middleware)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const frontendUrl = configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

// ... setelah app dibuat
const rootUploads = join(process.cwd(), "uploads");      // <-- project_root/uploads (preferred)
const distUploads1 = join(__dirname, "uploads");        // <-- dist/uploads (if present)
const distUploads2 = join(__dirname, "..", "uploads");  // <-- dist/../uploads (if structure berbeda)
// dist/uploads

console.log("Static upload paths (checked in order):");
console.log(" - rootUploads:", rootUploads, "exists=", existsSync(rootUploads));
console.log(" - distUploads1:", distUploads1, "exists=", existsSync(distUploads1));
console.log(" - distUploads2:", distUploads2, "exists=", existsSync(distUploads2));

  // simple request logger + file-exists checker
  app.use('/uploads', (req, res, next) => {
    const rel = req.path.replace(/^\/+/, ''); // e.g. banners/xxx.jpg
    const pRoot = join(rootUploads, rel);
    const pDist1 = join(distUploads1, rel);
    const pDist2 = join(distUploads2, rel);

    const rootExists = existsSync(pRoot);
    const dist1Exists = existsSync(pDist1);
    const dist2Exists = existsSync(pDist2);

 console.log(
    "[UPLOADS DEBUG] req=",
    req.method,
    req.originalUrl,
    "-> rootExists=",
    rootExists,
    "dist1Exists=",
    dist1Exists,
    "dist2Exists=",
    dist2Exists
  );

    if (rootExists) return res.sendFile(pRoot);
  if (dist1Exists) return res.sendFile(pDist1);
  if (dist2Exists) return res.sendFile(pDist2);

  // not found
  res.status(404).json({
    message: "Not Found",
    error: "Not Found",
    tried: [pRoot, pDist1, pDist2],
  });
});
  // --- rest of your setup ---
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({ origin: frontendUrl, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/api`);
  console.log(`✅ CORS enabled for: ${frontendUrl}`);
}
bootstrap();
