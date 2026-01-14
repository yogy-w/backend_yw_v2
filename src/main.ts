// src/main.ts (safe + restored)
// static + debug middleware, dengan proteksi path traversal
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 4000;
  const frontendUrl = configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

  // --- candidate upload folders (debug) ---
  const rootUploads = join(process.cwd(), 'uploads');      // project_root/uploads
  const distUploads1 = join(__dirname, 'uploads');        // dist/uploads (if present)
  const distUploads2 = join(__dirname, '..', 'uploads');  // dist/../uploads (alternate)

  console.log('Static upload paths (checked in order):');
  console.log(' - rootUploads:', rootUploads, 'exists=', existsSync(rootUploads));
  console.log(' - distUploads1:', distUploads1, 'exists=', existsSync(distUploads1));
  console.log(' - distUploads2:', distUploads2, 'exists=', existsSync(distUploads2));

  // --- body parser (with raw capture) to ensure Nest parses JSON correctly ---
  app.use(bodyParser.json({
    verify: (req: any, _res, buf) => {
      try { req.rawBody = buf?.toString(); } catch { req.rawBody = undefined; }
    }
  }));

  // --- cookie parser ---
  app.use(cookieParser());

  // --- uploads middleware (only handles /uploads, otherwise passes through) ---
  // --- uploads + auth nocache middleware (FIXED ORDER & SAFE) ---
app.use((req: any, res: any, next: any) => {
  const url = req.originalUrl || '';

  // ================================================================
  // 1) NO-CACHE untuk /api/auth (HARUS di atas, supaya tidak tertelan upload logic)
  // ================================================================
  if (url.startsWith('/api/auth')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', '');
    // lanjutkan ke controller auth
    return next();
  }

  // ================================================================
  // 2) HANDLE FILE UPLOADS (seperti logic kamu sebelumnya)
  // ================================================================
  if (url.startsWith('/uploads')) {
    // ini adalah request untuk file upload → lanjutkan ke pengecekan file
    const rel = req.path.replace(/^\/uploads\//, ''); // e.g. banners/xxx.jpg
    const tried: string[] = [];
    const candidates = [
      { base: rootUploads, rel },
      { base: distUploads1, rel },
      { base: distUploads2, rel },
    ];

    console.log('[UPLOADS DEBUG] req=', req.method, req.originalUrl);

    for (const c of candidates) {
      try {
        const candidatePath = join(c.base, c.rel);
        const resolvedCandidate = resolve(candidatePath);
        const resolvedBase = resolve(c.base);

        const sep = pathSeparator();
        if (!resolvedCandidate.startsWith(resolvedBase + (process.platform === 'win32' ? '' : sep)) &&
            resolvedCandidate !== resolvedBase) {
          tried.push(resolvedCandidate + ' (rejected - traversal)');
          continue;
        }

        tried.push(resolvedCandidate);
        if (existsSync(resolvedCandidate)) {
          console.log('[UPLOADS DEBUG] serving file ->', resolvedCandidate);
          return res.sendFile(resolvedCandidate);
        }
      } catch (err) {
        console.warn('[UPLOADS DEBUG] candidate check error:', err?.message ?? err);
        continue;
      }
    }

    console.log('[UPLOADS DEBUG] not found, tried:', tried);
    return res.status(404).json({
      message: 'Not Found',
      error: 'Not Found',
      tried,
    });
  }

  // ================================================================
  // 3) SEMUA ROUTE LAIN → lanjut
  // ================================================================
  return next();
});


  // --- global settings ---
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // helmet last so it won't interfere with body parsing / middleware ordering
  app.use(helmet());

  await app.listen(port);
  console.log(`🚀 Server running at http://localhost:${port}/api`);
  console.log(`✅ CORS allowed for: ${frontendUrl}`);
}

/** platform-specific separator helper */
function pathSeparator() {
  return process.platform === 'win32' ? '\\' : '/';
}

bootstrap();
