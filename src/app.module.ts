import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule,ThrottlerGuard  } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

//banner
import { ServeStaticModule } from '@nestjs/serve-static';
import { BannersModule } from './banners/banners.module';
import { join } from 'path';
import { KajianModule } from './kajian/kajian.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      load: [configuration],
       validationSchema, // aktifkan validasi env
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url')!, // 🔥 ambil dari configuration.ts
        entities: [__dirname + '/**/*.entity{.ts,.js}'], // otomatis scan semua entity,
        synchronize: false,// pakai migration di production
      }),
    }),
     ThrottlerModule.forRoot([{
      ttl: 60,   // waktu dalam detik (1 menit)
      limit: 5,  // maksimal 5 request per IP per menit
    }]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads'),
      serveRoot: '/uploads', // URL prefix: /uploads/...
    }),
    BannersModule,
    AuthModule,
    KajianModule,
  ],
})
export class AppModule {}
