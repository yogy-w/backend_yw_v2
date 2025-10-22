import { Controller, Post, Get, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannersService } from './banners.service';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  async getAll() {
    return this.bannersService.findAll();
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    return this.bannersService.createBanner(body, file);
  }
}
