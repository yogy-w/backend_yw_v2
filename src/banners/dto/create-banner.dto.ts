// src/banners/dto/create-banner.dto.ts
import { IsBoolean, IsOptional, IsString, IsUrl, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBannerDto {
  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  caption?: string | null;

  @IsOptional()
  @IsUUID()
  media_id?: string | null; // jika frontend sudah ada media id (misal dari upload manual sebelumnya)

  @IsOptional()
  @IsUrl()
  image_url?: string | null; // jika frontend punya URL eksternal

  @IsOptional()
  @IsUUID()
  article_id?: string | null;

  @IsOptional()
//   @IsUrl()
  @IsString()
  link_url?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Date)
  start_at?: Date | null;

  @IsOptional()
  @Type(() => Date)
  end_at?: Date | null;
}
