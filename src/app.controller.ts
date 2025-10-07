import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users/user.entity';

@Controller()
export class AppController {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  @Get('test-db')
  async testDB() {
    const users = await this.usersRepo.find();
    return { message: 'Koneksi berhasil!', totalUsers: users.length };
  }
}
