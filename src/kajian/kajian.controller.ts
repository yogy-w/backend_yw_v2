import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UsePipes,
  ValidationPipe,
  BadRequestException,
  Get,
  Param,
  Put,
  Delete,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { KajianService } from './kajian.service';
import { CreateKajianDto } from './dto/create-kajian.dto';
import { UpdateKajianDto } from './dto/update-kajian.dto';

import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';

@Controller('kajian')
export class KajianController {
  constructor(private readonly kajianService: KajianService) {}

  @Get()
  async findAll() {
    try {
      const data = await this.kajianService.findAll();
      return { success: true, data };
    } catch (err: any) {
      console.error('[KajianController.findAll] error:', err);
      return { success: false, message: err?.message ?? 'Internal server error', data: [] };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const kajian = await this.kajianService.findOne(id);
      return { success: true, data: kajian };
    } catch (err: any) {
      console.error('[KajianController.findOne] error:', err);
      if (err instanceof NotFoundException) throw err;
      return { success: false, message: err?.message ?? 'Internal server error', data: null };
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() body: CreateKajianDto, @UploadedFile() file?: Express.Multer.File) {
    try {
      const created = await this.kajianService.createWithFile(body, file);
      return { success: true, data: created };
    } catch (err: any) {
      console.error('[KajianController.create] error:', err);
      throw new BadRequestException(err?.message ?? 'Failed to create Kajian');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async update(
    @Param('id') id: string,
    @Body() body: UpdateKajianDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const updated = await this.kajianService.updateWithFile(id, body, file);
      return { success: true, data: updated };
    } catch (err: any) {
      console.error('[KajianController.update] error:', err);
      throw new BadRequestException(err?.message ?? 'Failed to update Kajian');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.kajianService.remove(id);
      return { success: true, message: result?.message ?? 'Kajian deleted successfully' };
    } catch (err: any) {
      console.error('[KajianController.remove] error:', err);
      throw new BadRequestException(err?.message ?? 'Failed to delete Kajian');
    }
  }
}
