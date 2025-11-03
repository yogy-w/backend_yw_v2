// src/kajian/kajian.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kajian } from './entities/kajian.entity';
import { CreateKajianDto } from './dto/create-kajian.dto';
import { UpdateKajianDto } from './dto/update-kajian.dto';
import { Media } from '../media/media.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

@Injectable()
export class KajianService {
  constructor(
    @InjectRepository(Kajian)
    private readonly kajianRepo: Repository<Kajian>,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
  ) {}

  private uploadDir = process.env.UPLOAD_DIR ?? './uploads';
  private mediaSubfolder = process.env.MEDIA_SUBFOLDER ?? 'media/kajian';
  private appBaseUrl = (process.env.APP_BASE_URL ?? 'http://localhost:4000').replace(/\/$/, '');

  async findAll() {
    try {
      const items = await this.kajianRepo
        .createQueryBuilder('k')
        .leftJoinAndSelect('k.media', 'media')
        .orderBy('k.created_at', 'DESC')
        .getMany();

      return items.map((k) => ({
        ...k,
        imageUrl: k.media?.url ?? null,
      }));
    } catch (err) {
      console.error('[KajianService.findAll] error:', err);
      throw err;
    }
  }

  async findOne(id: string) {
    const kajian = await this.kajianRepo.findOne({ where: { id }, relations: ['media'] });
    if (!kajian) throw new NotFoundException('Kajian tidak ditemukan');
    return { ...kajian, imageUrl: kajian.media?.url ?? null };
  }

  async createWithFile(dto: CreateKajianDto, file?: Express.Multer.File) {
    let media: Media | null = null;

    if (file) {
      if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        throw new Error('File yang diupload bukan gambar');
      }

      const folderPath = path.join(this.uploadDir, this.mediaSubfolder);
      await fs.mkdir(folderPath, { recursive: true });

      const filename = `${Date.now()}_${file.originalname}`;
      const fullPath = path.join(folderPath, filename);
      await fs.writeFile(fullPath, file.buffer);

      let width: number | undefined = undefined;
      let height: number | undefined = undefined;
      try {
        const meta = await sharp(file.buffer).metadata();
        width = meta.width ?? undefined;
        height = meta.height ?? undefined;
      } catch (err) {
        console.warn('[KajianService.createWithFile] sharp metadata error:', err);
      }

      const fileUrl = `${this.appBaseUrl}/uploads/${this.mediaSubfolder}/${filename}`;
      const mediaObj = {
        filename,
        url: fileUrl,
        storage_bucket: null,
        storage_path: `${this.mediaSubfolder}/${filename}`,
        mime: file.mimetype,
        width,
        height,
        size: file.size,
        alt_text: dto.title ?? null,
        variants: {},
        metadata: { source: 'kajian_upload' },
        uploaded_by: null,
      };

      // cast hasil save ke Media untuk hindari inference array
      media = (await this.mediaRepo.save(mediaObj as any)) as Media;
    }

    const kajianEntity = this.kajianRepo.create({
      ...dto,
      media: media ?? undefined,
    } as any);

    // cast hasil save ke Kajian agar TS tahu ini entity tunggal
    const saved = (await this.kajianRepo.save(kajianEntity as any)) as Kajian;

    const result = await this.kajianRepo.findOne({ where: { id: saved.id }, relations: ['media'] });
    return { ...result, imageUrl: result?.media?.url ?? null };
  }

  async updateWithFile(id: string, dto: UpdateKajianDto, file?: Express.Multer.File) {
    const kajian = await this.kajianRepo.findOne({ where: { id }, relations: ['media'] });
    if (!kajian) throw new NotFoundException('Kajian tidak ditemukan');

    let media: Media | null = kajian.media ?? null;

    if (file) {
      if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        throw new Error('File yang diupload bukan gambar');
      }

      const folderPath = path.join(this.uploadDir, this.mediaSubfolder);
      await fs.mkdir(folderPath, { recursive: true });

      const filename = `${Date.now()}_${file.originalname}`;
      const fullPath = path.join(folderPath, filename);
      await fs.writeFile(fullPath, file.buffer);

      if (media?.filename) {
        const oldPath = path.join(this.uploadDir, media.storage_path ?? `${this.mediaSubfolder}/${media.filename}`);
        try {
          await fs.unlink(oldPath);
        } catch (err) {
          console.warn('[KajianService.updateWithFile] unlink old file failed:', err);
        }
        try {
          await this.mediaRepo.delete(media.id);
        } catch (err) {
          console.warn('[KajianService.updateWithFile] delete old media record failed:', err);
        }
      }

      let width: number | undefined = undefined;
      let height: number | undefined = undefined;
      try {
        const meta = await sharp(file.buffer).metadata();
        width = meta.width ?? undefined;
        height = meta.height ?? undefined;
      } catch (err) {
        console.warn('[KajianService.updateWithFile] sharp metadata error:', err);
      }

      const fileUrl = `${this.appBaseUrl}/uploads/${this.mediaSubfolder}/${filename}`;
      const newMediaObj = {
        filename,
        url: fileUrl,
        storage_bucket: null,
        storage_path: `${this.mediaSubfolder}/${filename}`,
        mime: file.mimetype,
        width,
        height,
        size: file.size,
        alt_text: dto && (dto as any).title ? (dto as any).title : kajian.title ?? null,
        variants: {},
        metadata: { source: 'kajian_upload' },
        uploaded_by: null,
      };

      media = (await this.mediaRepo.save(newMediaObj as any)) as Media;
    }

    Object.assign(kajian, {
      ...dto,
      media: media ?? kajian.media,
    });

    const updated = (await this.kajianRepo.save(kajian as any)) as Kajian;
    const result = await this.kajianRepo.findOne({ where: { id: updated.id }, relations: ['media'] });
    return { ...result, imageUrl: result?.media?.url ?? null };
  }

  async remove(id: string) {
    const kajian = await this.kajianRepo.findOne({ where: { id }, relations: ['media'] });
    if (!kajian) throw new NotFoundException('Kajian tidak ditemukan');

    if (kajian.media?.filename) {
      const filePath = path.join(this.uploadDir, kajian.media.storage_path ?? `${this.mediaSubfolder}/${kajian.media.filename}`);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn('[KajianService.remove] unlink failed:', err);
      }
      try {
        await this.mediaRepo.delete(kajian.media.id);
      } catch (err) {
        console.warn('[KajianService.remove] delete media record failed:', err);
      }
    }

    await this.kajianRepo.remove(kajian);
    return { message: 'Kajian berhasil dihapus' };
  }
}
