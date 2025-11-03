import { IsOptional, IsString, IsBoolean, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  link_url?: string;

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
}
