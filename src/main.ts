// src/main.ts  (static + debug middleware, dengan proteksi path traversal)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const frontendUrl = configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

  // --- Static uploads debug / safe file serving ---
  const rootUploads = join(process.cwd(), 'uploads');      // project_root/uploads (preferred)
  const distUploads1 = join(__dirname, 'uploads');        // dist/uploads (if present)
  const distUploads2 = join(__dirname, '..', 'uploads');  // dist/../uploads (alternate)

  console.log('Static upload paths (checked in order):');
  console.log(' - rootUploads:', rootUploads, 'exists=', existsSync(rootUploads));
  console.log(' - distUploads1:', distUploads1, 'exists=', existsSync(distUploads1));
  console.log(' - distUploads2:', distUploads2, 'exists=', existsSync(distUploads2));

  /**
   * Middleware: serve file from any of the candidate upload folders.
   * - debug logs
   * - protect against path traversal by resolving absolute paths and ensuring they remain under the intended upload folders
   * - return 404 JSON when not found
   *
   * Note: this middleware is mounted at "/uploads", not under "/api"
   * (because we call app.setGlobalPrefix('api') later).
   */
  app.use('/uploads', (req, res, next) => {
    const rel = req.path.replace(/^\/+/, ''); // e.g. banners/xxx.jpg
    const tried: string[] = [];

    const candidates = [
      { base: rootUploads, rel },
      { base: distUploads1, rel },
      { base: distUploads2, rel },
    ];

    // debug log basic request
    console.log('[UPLOADS DEBUG] req=', req.method, req.originalUrl);

    for (const c of candidates) {
      try {
        const candidatePath = join(c.base, c.rel);
        const resolvedCandidate = resolve(candidatePath);
        const resolvedBase = resolve(c.base);

        // proteksi path traversal: pastikan resolvedCandidate masih berada di bawah resolvedBase
        if (!resolvedCandidate.startsWith(resolvedBase + (process.platform === 'win32' ? '' : pathSeparator()))) {
          // On some environments startsWith-resolvedBase alone is ok, but we normalize with separator check.
          // treat as not found for this candidate
          tried.push(resolvedCandidate + ' (rejected - traversal)');
          continue;
        }

        tried.push(resolvedCandidate);
        if (existsSync(resolvedCandidate)) {
          console.log('[UPLOADS DEBUG] serving file ->', resolvedCandidate);
          return res.sendFile(resolvedCandidate);
        } else {
          // file not exists for this candidate
          continue;
        }
      } catch (err) {
        // log and continue to next candidate
        console.warn('[UPLOADS DEBUG] candidate check error:', err?.message ?? err);
        continue;
      }
    }

    // not found in any candidate
    console.log('[UPLOADS DEBUG] not found, tried:', tried);
    res.status(404).json({
      message: 'Not Found',
      error: 'Not Found',
      tried,
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

/**
 * Helper to return platform-specific path separator as string.
 * We use this to make a conservative check for startsWith(base + sep) to avoid
 * accidental true positives (e.g. /uploads1 startingWith /uploads).
 */
function pathSeparator() {
  return process.platform === 'win32' ? '\\' : '/';
}

bootstrap();
