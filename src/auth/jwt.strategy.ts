import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // ambil token dari header Authorization: Bearer <token>
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret')!,
    });
  }

  // 🔹 Validasi payload JWT
  async validate(payload: any): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id: payload.sub },
      relations: ['role'],
    });
    if (!user) throw new UnauthorizedException('Invalid token');
    return user; // otomatis jadi req.user di controller
  }
}
