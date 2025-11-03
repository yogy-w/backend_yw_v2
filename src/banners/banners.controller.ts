// src/banners/banners.controller.ts
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
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import * as multer from 'multer';

// import JwtAuthGuard
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  // GET all banners (untuk dashboard admin / landing)
  @Get()
  async findAll() {
    const data = await this.bannersService.findAll();
    return { success: true, data };
  }

  // GET single banner
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const banner = await this.bannersService.findOne(id);
    if (!banner) throw new NotFoundException('Banner not found');
    return { success: true, data: banner };
  }

  // POST new banner (with optional image)
  // dilindungi untuk admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() body: CreateBannerDto, @UploadedFile() file?: Express.Multer.File) {
    try {
      const created = await this.bannersService.createBanner(body, file);
      return { success: true, data: created };
    } catch (err) {
      throw new BadRequestException(err?.message ?? 'Failed to create banner');
    }
  }

  // PUT update banner (optionally upload new image)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() body: UpdateBannerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const updated = await this.bannersService.updateBanner(id, body, file);
      return { success: true, data: updated };
    } catch (err) {
      throw new BadRequestException(err?.message ?? 'Failed to update banner');
    }
  }

  // DELETE banner (and its media if unused)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.bannersService.deleteBanner(id);
    if (!deleted) throw new NotFoundException('Banner not found');
    return { success: true, message: 'Banner deleted successfully' };
  }
}
