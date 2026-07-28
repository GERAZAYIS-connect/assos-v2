import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// Domain ports
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { PASSWORD_HASHER } from './domain/ports/password-hasher.interface';
import { TOKEN_SERVICE } from './domain/ports/token.service.interface';

// Application
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';

// Infrastructure
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { BcryptPasswordHasher } from './infrastructure/adapters/bcrypt-password-hasher.adapter';
import { JwtTokenService } from './infrastructure/adapters/jwt-token.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

// Interfaces
import { AuthController } from './interfaces/http/auth.controller';

function isValidRsaKey(key?: string): boolean {
  if (!key || !key.includes('BEGIN')) return false;
  try {
    crypto.createPrivateKey(key.replace(/\\n/g, '\n'));
    return true;
  } catch {
    return false;
  }
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const rawPrivateKey = configService.get<string>('app.jwtPrivateKey');
        const rawPublicKey = configService.get<string>('app.jwtPublicKey');

        const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;
        const publicKey = rawPublicKey ? rawPublicKey.replace(/\\n/g, '\n') : undefined;

        const isRsa = isValidRsaKey(privateKey);

        return {
          privateKey: isRsa ? privateKey : undefined,
          publicKey: isRsa ? publicKey : undefined,
          secret: !isRsa ? 'dev_secret_key_123456789_assos_v2' : undefined,
          signOptions: {
            algorithm: isRsa ? 'RS256' : 'HS256',
            expiresIn: (configService.get<string>('app.jwtAccessExpiry', '15m')) as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Use cases
    RegisterUserUseCase,
    LoginUserUseCase,
    // Port bindings (DI inversion)
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    // Infrastructure
    JwtTokenService,
    JwtStrategy,
  ],
  exports: [JwtModule, PassportModule, TOKEN_SERVICE, USER_REPOSITORY, PASSWORD_HASHER],
})
export class AuthModule {}
