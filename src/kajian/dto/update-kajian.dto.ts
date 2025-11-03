// src/kajian/dto/update-kajian.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateKajianDto } from './create-kajian.dto';

export class UpdateKajianDto extends PartialType(CreateKajianDto) {}
