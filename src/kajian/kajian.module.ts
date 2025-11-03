import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kajian } from './entities/kajian.entity';
import { Media } from '../media/media.entity';
import { KajianService } from './kajian.service';
import { KajianController } from './kajian.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Kajian, Media])],
  controllers: [KajianController],
  providers: [KajianService],
})
export class KajianModule {}
