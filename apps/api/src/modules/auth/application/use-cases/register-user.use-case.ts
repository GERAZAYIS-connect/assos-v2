import { Inject, Injectable } from '@nestjs/common';
import { ConflictException } from '../../../../core/exceptions/global-exception.filter';
import { Email } from '../../domain/value-objects/email.vo';
import { Phone } from '../../domain/value-objects/phone.vo';
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

export interface RegisterUserCommand {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterUserResult {
  userId: string;
  tokens: AuthTokens;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    // Validate and normalize inputs
    if (!command.email && !command.phone) {
      throw new ConflictException('Either email or phone is required');
    }

    let normalizedEmail: string | undefined;
    let normalizedPhone: string | undefined;

    if (command.email) {
      normalizedEmail = Email.create(command.email).value;
      const emailTaken = await this.userRepo.emailExists(normalizedEmail);
      if (emailTaken) {
        throw new ConflictException(`Email "${normalizedEmail}" is already registered`);
      }
    }

    if (command.phone) {
      normalizedPhone = Phone.create(command.phone).value;
      const phoneTaken = await this.userRepo.phoneExists(normalizedPhone);
      if (phoneTaken) {
        throw new ConflictException(`Phone "${normalizedPhone}" is already registered`);
      }
    }

    // Hash password
    const passwordHash = await this.hasher.hash(command.password);

    // Create user
    const user = await this.userRepo.create({
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
    });

    // Generate tokens
    const tokens = {
      accessToken: this.tokenService.generateAccessToken({
        sub: user.id,
        email: user.email ?? undefined,
        phone: user.phone ?? undefined,
      }),
      refreshToken: this.tokenService.generateRefreshToken({ sub: user.id }),
    };

    // Audit log
    await this.auditService.log({
      actorId: user.id,
      category: AuditCategory.AUTH,
      action: 'USER_REGISTERED',
      targetType: 'User',
      targetId: user.id,
    });

    return { userId: user.id, tokens };
  }
}
