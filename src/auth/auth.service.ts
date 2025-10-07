import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../users/role.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { SignJWT } from 'jose';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private config: ConfigService,

     @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  // 🔹 Register user baru
async register(email: string, password: string, roleName: string) {
  const existing = await this.usersRepo.findOne({ where: { email } });
  if (existing) throw new Error('Email sudah terdaftar');

  const role = await this.roleRepo.findOne({ where: { name: roleName } });
  if (!role) throw new Error('Role tidak ditemukan');

  const hashed = await bcrypt.hash(password, 10);

  const user = this.usersRepo.create({
    email,
    password: hashed,
    role, // assign entity Role langsung
  });

  return this.usersRepo.save(user);
}

  // 🔹 Validasi login user
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepo.findOne({
      where: { email },
      relations: ['role'], // ambil role juga
    });
    if (!user) return null;

    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;

    return user;
  }

  // 🔹 Generate JWT
  async createJwt(user: User) {
    const secret = this.config.get<string>('jwt.secret');
    if (!secret) throw new Error('JWT secret not found');

    const secretKey = new TextEncoder().encode(secret);

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + this.parseExpires(this.config.get<string>('jwt.expiresIn') ?? '1h');

    // ⚡ ambil nama role dari relasi Role
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role?.name,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .sign(secretKey);

    return token;
  }

  // 🔹 Parser waktu expired dari string → detik
  private parseExpires(expStr: string) {
    if (expStr.endsWith('s')) return parseInt(expStr) || 3600;
    if (expStr.endsWith('m')) return parseInt(expStr) * 60;
    if (expStr.endsWith('h')) return parseInt(expStr) * 3600;
    if (expStr.endsWith('d')) return parseInt(expStr) * 86400;
    return 3600;
  }
}
