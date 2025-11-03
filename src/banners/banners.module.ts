// src/banners/banners.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';
import { Banner } from './entities/banner.entity';
import { Media } from 'src/media/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Banner, Media])],
  controllers: [BannersController],
  providers: [BannersService],
})
export class BannersModule {}
