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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  // 🟢 GET all banners
  @Get()
  async findAll() {
    const data = await this.bannersService.findAll();
    return { success: true, data };
  }

  // 🟢 GET single banner
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const banner = await this.bannersService.findOne(id);
    if (!banner) throw new NotFoundException('Banner not found');
    return { success: true, data: banner };
  }

  // 🟢 POST new banner (with optional image)
  @Post()
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() body: CreateBannerDto, @UploadedFile() file?: Express.Multer.File) {
    try {
      const created = await this.bannersService.createBanner(body, file);
      return { success: true, data: created };
    } catch (err) {
      throw new BadRequestException(err?.message ?? 'Failed to create banner');
    }
  }

  // 🟡 PUT update banner (optionally upload new image)
  @Put(':id')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }))
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

  // 🔴 DELETE banner (and optionally delete its file)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.bannersService.deleteBanner(id);
    if (!deleted) throw new NotFoundException('Banner not found');
    return { success: true, message: 'Banner deleted successfully' };
  }
}
