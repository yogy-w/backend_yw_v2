import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';
import { Banner } from './entities/banner.entity';
import { Media } from './entities/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Banner, Media])],
  controllers: [BannersController],
  providers: [BannersService],
})
export class BannersModule {}
