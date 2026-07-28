import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../../domain/ports/token.service.interface';
import * as crypto from 'crypto';

function isValidPublicKey(key?: string): boolean {
  if (!key || !key.includes('BEGIN')) return false;
  try {
    crypto.createPublicKey(key.replace(/\\n/g, '\n'));
    return true;
  } catch {
    return false;
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const rawPublicKey = configService.get<string>('app.jwtPublicKey');
    const publicKey = rawPublicKey ? rawPublicKey.replace(/\\n/g, '\n') : undefined;

    const isRsa = isValidPublicKey(publicKey);
    const secretOrKey = isRsa && publicKey ? publicKey : 'dev_secret_key_123456789_assos_v2';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
      algorithms: isRsa ? ['RS256'] : ['HS256'],
    });
  }

  async validate(payload: TokenPayload): Promise<TokenPayload> {
    if (!payload.sub) throw new UnauthorizedException();
    return payload;
  }
}
