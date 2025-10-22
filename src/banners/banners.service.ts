import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';
import { Media } from './entities/media.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
  ) {}

  private uploadDir = process.env.UPLOAD_DIR || './uploads';
  private mediaSubfolder = process.env.MEDIA_SUBFOLDER || 'banners';
  private appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:4000';

    // BACKWARDS-COMPAT wrapper (jika ada kode lama memanggil nama ini)
  async createBannerWithOptionalFile(dto: any, file?: Express.Multer.File) {
    return this.createBanner(dto, file);
  }

  // CREATE banner (termasuk optional file)
  async createBanner(data: any, file?: Express.Multer.File) {
    let media: Media | undefined;

    if (file) {
      // validasi sederhana: hanya image
      if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        throw new Error('Uploaded file is not an image');
      }

      // pastikan folder tersedia
      const folderPath = path.join(this.uploadDir, this.mediaSubfolder);
      await fs.mkdir(folderPath, { recursive: true });

      const filename = `${Date.now()}_${file.originalname}`;
      const fullPath = path.join(folderPath, filename);
      await fs.writeFile(fullPath, file.buffer);

      const fileUrl = `${this.appBaseUrl.replace(/\/$/, '')}/uploads/${this.mediaSubfolder}/${filename}`;

      const mediaEntity = this.mediaRepo.create({
        filename,
        url: fileUrl,
        mime: file.mimetype,
        size: file.size,
      });
      media = await this.mediaRepo.save(mediaEntity);
    }

    const bannerEntity = this.bannerRepo.create({
      title: data.title ?? null,
      caption: data.caption ?? null,
      link_url: data.link_url ?? null,
      order_index: typeof data.order_index === 'number' ? data.order_index : 0,
      is_active: typeof data.is_active === 'boolean' ? data.is_active : true,
      media: media ?? undefined,
    });

    const saved = await this.bannerRepo.save(bannerEntity);
    // kembalikan dengan relasi media
    return this.bannerRepo.findOne({ where: { id: saved.id }, relations: ['media'] });
  }

  async findOne(id: string) {
    return this.bannerRepo.findOne({
      where: { id },
      relations: ['media'],
    });
  }

  async findAll() {
  return this.bannerRepo.find({
    relations: ['media'],
    order: { order_index: 'ASC' },
  });
}

  async updateBanner(id: string, data: UpdateBannerDto, file?: Express.Multer.File) {
    const banner = await this.bannerRepo.findOne({ where: { id }, relations: ['media'] });
    if (!banner) throw new NotFoundException('Banner not found');

    let media = banner.media;

    if (file) {
      // hapus file lama (jika ada)
      if (media && media.filename) {
        const oldPath = path.join(this.uploadDir, this.mediaSubfolder, media.filename);
        try {
          await fs.unlink(oldPath);
        } catch {}

        // hapus record lama dari DB
        await this.mediaRepo.delete(media.id);
      }

      // simpan file baru
      const folderPath = path.join(this.uploadDir, this.mediaSubfolder);
      await fs.mkdir(folderPath, { recursive: true });

      const filename = `${Date.now()}_${file.originalname}`;
      const fullPath = path.join(folderPath, filename);
      await fs.writeFile(fullPath, file.buffer);
      const fileUrl = `${this.appBaseUrl}/uploads/${this.mediaSubfolder}/${filename}`;

      // buat record media baru
      const newMedia = this.mediaRepo.create({
        filename,
        url: fileUrl,
        mime: file.mimetype,
        size: file.size,
      });
      media = await this.mediaRepo.save(newMedia);
    }

    // update data banner
    Object.assign(banner, {
      title: data.title ?? banner.title,
      caption: data.caption ?? banner.caption,
      link_url: data.link_url ?? banner.link_url,
      order_index: data.order_index ?? banner.order_index,
      is_active: data.is_active ?? banner.is_active,
      media: media ?? banner.media,
    });

    const updated = await this.bannerRepo.save(banner);
    return updated;
  }

  async deleteBanner(id: string) {
    const banner = await this.bannerRepo.findOne({ where: { id }, relations: ['media'] });
    if (!banner) return false;

    // hapus file fisik
    if (banner.media?.filename) {
      const filePath = path.join(this.uploadDir, this.mediaSubfolder, banner.media.filename);
      try {
        await fs.unlink(filePath);
      } catch {}
    }

    // hapus data di DB
    await this.bannerRepo.delete(id);
    if (banner.media?.id) await this.mediaRepo.delete(banner.media.id);
    return true;
  }
}
