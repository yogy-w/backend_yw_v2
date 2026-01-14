import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Banner } from './entities/banner.entity';
import { Media } from 'src/media/media.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { CreateBannerDto } from './dto/create-banner.dto';


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
  private appBaseUrl = (process.env.APP_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

  // CREATE banner (bisa file upload, media_id existing, atau image_url eksternal)
  async createBanner(data: CreateBannerDto, file?: Express.Multer.File) {
    let media: Media | undefined;

    // 1️⃣ Jika diberikan media_id -> gunakan media existing
    if (data.media_id) {
      const existing = await this.mediaRepo.findOne({ where: { id: data.media_id } });
      if (!existing) throw new NotFoundException('Media not found');
      media = existing;
    }

    // 2️⃣ Jika image_url eksternal diberikan -> buat record media tanpa file
    if (!media && data.image_url) {
      const mediaEntity = this.mediaRepo.create({
        filename: data.image_url, // tidak ada file fisik
        url: data.image_url,
        mime: null,
        size: null,
        storage_bucket: null,
        storage_path: null,
        alt_text: data.title ?? null,
        metadata: { source: 'external' },
      });
      media = await this.mediaRepo.save(mediaEntity);
    }

    // 3️⃣ Jika upload file
    if (!media && file) {
      if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Uploaded file is not an image');
      }

      const folderPath = path.join(this.uploadDir, this.mediaSubfolder);
      await fs.mkdir(folderPath, { recursive: true });

      const filename = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
      const fullPath = path.join(folderPath, filename);
      await fs.writeFile(fullPath, file.buffer);

      const fileUrl = `${this.appBaseUrl}/uploads/${this.mediaSubfolder}/${filename}`;

      const mediaEntity = this.mediaRepo.create({
        filename,
        url: fileUrl,
        mime: file.mimetype,
        size: file.size,
        width: null,
        height: null,
        storage_bucket: null,
        storage_path: `${this.mediaSubfolder}/${filename}`,
        alt_text: data.title ?? null,
        metadata: { from: 'banner_upload' },
      });
      media = await this.mediaRepo.save(mediaEntity);
    }

    // 4️⃣ Buat banner
   // buat entity banner dengan tipe yang aman untuk TypeORM
const bannerEntity = this.bannerRepo.create({
  title: data.title ?? null,
  caption: data.caption ?? null,
  link_url: data.link_url ?? null,
  order_index: typeof (data as any).order_index === 'number' ? (data as any).order_index : 0,
  is_active: typeof (data as any).is_active === 'boolean' ? (data as any).is_active : true,
  media: media ?? undefined,
} as DeepPartial<Banner>);

const saved = await this.bannerRepo.save(bannerEntity);
    // TypeScript kadang tidak yakin saved.id ada -> pakai non-null assertion atau cast
  return this.bannerRepo.findOne({
    where: { id: (saved as Banner).id }, // atau id: saved.id!
    relations: ['media'],
    });
  }

  async findOne(id: string) {
    return this.bannerRepo.findOne({ where: { id }, relations: ['media'] });
  }

  async findAll() {
    return this.bannerRepo.find({ relations: ['media'], order: { order_index: 'ASC' } });
  }

  // UPDATE banner (opsional upload gambar baru)
  async updateBanner(id: string, data: UpdateBannerDto, file?: Express.Multer.File) {
    const banner = await this.bannerRepo.findOne({ where: { id }, relations: ['media'] });
    if (!banner) throw new NotFoundException('Banner not found');

    let media = banner.media;

    if (file) {
      if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Uploaded file is not an image');
      }

      // Hapus file lama jika ada dan bukan dipakai banner lain
      if (media && media.filename) {
        const oldPath = path.join(this.uploadDir, this.mediaSubfolder, media.filename);
        try {
          await fs.unlink(oldPath);
        } catch {}
      }

      // Cek apakah media masih dipakai banner lain
      if (media && media.id) {
        const count = await this.bannerRepo.count({ where: { media: { id: media.id } } });
        if (count <= 1) await this.mediaRepo.delete(media.id);
      }

      // Simpan file baru
      const folderPath = path.join(this.uploadDir, this.mediaSubfolder);
      await fs.mkdir(folderPath, { recursive: true });
      const filename = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
      const fullPath = path.join(folderPath, filename);
      await fs.writeFile(fullPath, file.buffer);
      const fileUrl = `${this.appBaseUrl}/uploads/${this.mediaSubfolder}/${filename}`;

      const newMedia = this.mediaRepo.create({
        filename,
        url: fileUrl,
        mime: file.mimetype,
        size: file.size,
        storage_path: `${this.mediaSubfolder}/${filename}`,
        metadata: { updated_from_banner: id },
      });
      media = await this.mediaRepo.save(newMedia);
    }

    Object.assign(banner, {
      title: data.title ?? banner.title,
      caption: data.caption ?? banner.caption,
      link_url: data.link_url ?? banner.link_url,
      order_index: data.order_index ?? banner.order_index,
      is_active: data.is_active ?? banner.is_active,
      media: media ?? banner.media,
    });

    const updated = await this.bannerRepo.save(banner);
    return this.bannerRepo.findOne({ where: { id: updated.id }, relations: ['media'] });
  }

  // DELETE banner dan hapus media jika tidak digunakan lagi
  async deleteBanner(id: string) {
    const banner = await this.bannerRepo.findOne({ where: { id }, relations: ['media'] });
    if (!banner) return false;

    const media = banner.media;
    await this.bannerRepo.delete(id);

    if (media && media.id) {
      const count = await this.bannerRepo.count({ where: { media: { id: media.id } } });
      if (count === 0) {
        if (media.filename && media.storage_path) {
          const filePath = path.join(this.uploadDir, this.mediaSubfolder, media.filename);
          try {
            await fs.unlink(filePath);
          } catch {}
        }
        await this.mediaRepo.delete(media.id);
      }
    }

    return true;
  }
}
