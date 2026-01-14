// src/auth/jwt.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }

  // Optional: passport-jwt strategy config should already read token from header.
  // To accept cookie, configure passport strategy to read token from cookie as fallback.
}
