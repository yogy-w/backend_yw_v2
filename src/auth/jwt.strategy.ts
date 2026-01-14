// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // primary: Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // fallback: cookie named 'jwt'
        (req: Request) => {
          return req?.cookies?.jwt || null;
        },
      ]),
      ignoreExpiration: false,
       // PAKAI JWT_SECRET dari .env
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  // 🔹 Validasi payload JWT
  async validate(payload: any): Promise<User> {
  const user = await this.usersRepo.findOne({
    where: { id: payload.sub },
    relations: ['role'],
  });

  if (!user) {
    throw new UnauthorizedException('Invalid token');
  }

  return user; // aman karena user pasti ada
}
}
