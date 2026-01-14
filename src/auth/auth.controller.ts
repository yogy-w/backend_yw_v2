import { Controller, Post, Body, Get, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt.guard';
import { Response, Request } from 'express';

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
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    };

    const token = await this.authService.createJwt(user);

     // Set cookie HttpOnly — untuk development gunakan sameSite:'lax' dan secure:false
    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'lax',   // dev: 'lax' biasanya cukup. Kalau cross-site, gunakan 'none' + secure:true (HTTPS)
      secure: false,     // di production harus true (HTTPS)
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

     // no-cache → mencegah 304
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', '');

   // jangan return token di body (opsional). Return minimal data:
    return { ok: true, user: { id: user.id, email: user.email } };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: any) {
  res.clearCookie('jwt', { path: '/' });
  return { ok: true };
  }   

@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Req() req, @Res({ passthrough: true }) res: any) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('ETag', '');
  return req.user;
}

}
