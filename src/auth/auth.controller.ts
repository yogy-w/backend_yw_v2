import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto.email, dto.password, dto.role);
    return { id: user.id, email: user.email, role: user.role };
  }

  @Post('login')
  @UseGuards(ThrottlerGuard) // 🚀 aktifkan rate-limit hanya di route ini
  @Throttle({ default: { limit: 5, ttl: 60 } }) // maks 5 percobaan per menit per IP
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) throw new Error('Invalid credentials');

    const token = await this.authService.createJwt(user);
    return { access_token: token, token_type: 'bearer' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }
}
