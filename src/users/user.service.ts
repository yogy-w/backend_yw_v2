import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    // Inject repository User → otomatis disediakan oleh TypeORM
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  // 🔍 Cari user berdasarkan email
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email },
      relations: ['role'], // ikut ambil data relasi role (misalnya admin/user)
    });
  }

  // ➕ Buat user baru
  async createUser(email: string, password: string, roleId: string): Promise<User> {
    // create() hanya membuat instance entity, belum menyimpan ke database
    const user = this.usersRepo.create({
      email,
      password,
      role: { id: roleId }, // relasi role (langsung isi id role)
    });

    // save() menyimpan user baru ke database
    return this.usersRepo.save(user);
  }

  // 🔍 Cari user berdasarkan ID
  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { id },
      relations: ['role'], // ambil juga relasi role
    });
  }
}
