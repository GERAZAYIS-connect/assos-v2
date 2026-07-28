import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ITokenService,
  TokenPayload,
} from '../../domain/ports/token.service.interface';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign({ ...payload }, {
      expiresIn: (this.configService.get<string>('app.jwtAccessExpiry', '15m')) as any,
    });
  }

  generateRefreshToken(payload: Pick<TokenPayload, 'sub'>): string {
    return this.jwtService.sign({ ...payload }, {
      expiresIn: (this.configService.get<string>('app.jwtRefreshExpiry', '30d')) as any,
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.jwtService.verify<TokenPayload>(token);
  }

  verifyRefreshToken(token: string): TokenPayload {
    return this.jwtService.verify<TokenPayload>(token);
  }
}
