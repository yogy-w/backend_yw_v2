import { IsBoolean, IsOptional, IsString, IsUrl, IsUUID, IsInt } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateBannerDto {
  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  caption?: string | null;

  @IsOptional()
  @IsUUID()
  media_id?: string | null;

  @IsOptional()
  @IsUrl()
  image_url?: string | null;

  @IsOptional()
  @IsString()
  link_url?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  })
  @IsInt()
  order_index?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    const v = String(value).toLowerCase().trim();
    return v === 'true' || v === '1' || v === 'yes';
  })
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Date)
  start_at?: Date | null;

  @IsOptional()
  @Type(() => Date)
  end_at?: Date | null;
}
