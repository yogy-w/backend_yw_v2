import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  exports: [TypeOrmModule], // agar repository bisa digunakan di service lain
})
export class MediaModule {}
