// src/kajian/dto/create-kajian.dto.ts
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateKajianDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  pemateri?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  jadwal?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
