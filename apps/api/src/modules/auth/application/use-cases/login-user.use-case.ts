import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Email } from '../../domain/value-objects/email.vo';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IPasswordHasher,
  PASSWORD_HASHER,
} from '../../domain/ports/password-hasher.interface';
import {
  ITokenService,
  TOKEN_SERVICE,
  AuthTokens,
} from '../../domain/ports/token.service.interface';
import { AuditService } from '../../../../core/audit/audit.service';
import { AuditCategory } from '@prisma/client';

export interface LoginUserCommand {
  email?: string;
  phone?: string;
  password: string;
  ipAddress?: string;
}

export interface LoginUserResult {
  userId: string;
  tokens: AuthTokens;
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    // Find user by email or phone
    let user = null;

    if (command.email) {
      const email = Email.create(command.email).value;
      user = await this.userRepo.findByEmail(email);
    } else if (command.phone) {
      user = await this.userRepo.findByPhone(command.phone);
    }

    if (!user || user.isDeleted()) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hasher.compare(command.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.auditService.log({
        actorId: user.id,
        category: AuditCategory.AUTH,
        action: 'LOGIN_FAILED',
        targetId: user.id,
        metadata: { reason: 'invalid_password', ipAddress: command.ipAddress },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = {
      accessToken: this.tokenService.generateAccessToken({
        sub: user.id,
        email: user.email ?? undefined,
        phone: user.phone ?? undefined,
        platformRole: user.platformRole ?? undefined,
      }),
      refreshToken: this.tokenService.generateRefreshToken({ sub: user.id }),
    };

    await this.auditService.log({
      actorId: user.id,
      category: AuditCategory.AUTH,
      action: 'LOGIN_SUCCESS',
      targetId: user.id,
      metadata: { ipAddress: command.ipAddress },
    });

    return { userId: user.id, tokens };
  }
}
