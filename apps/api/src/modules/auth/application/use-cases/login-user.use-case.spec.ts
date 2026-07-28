import { LoginUserUseCase } from './login-user.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IPasswordHasher } from '../../domain/ports/password-hasher.interface';
import { ITokenService } from '../../domain/ports/token.service.interface';
import { AuditService } from '../../../../core/audit/audit.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { Language } from '@assos/shared';

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockHasher: jest.Mocked<IPasswordHasher>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockAuditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      create: jest.fn(),
      emailExists: jest.fn(),
      phoneExists: jest.fn(),
    };

    mockHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    mockTokenService = {
      generateAccessToken: jest.fn().mockReturnValue('mock_access'),
      generateRefreshToken: jest.fn().mockReturnValue('mock_refresh'),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new LoginUserUseCase(
      mockUserRepo,
      mockHasher,
      mockTokenService,
      mockAuditService,
    );
  });

  it('should authenticate user and return tokens when credentials are valid', async () => {
    const fakeUser = new UserEntity({
      id: 'usr_999',
      email: 'marie@example.com',
      phone: null,
      passwordHash: 'hashed_secret',
      platformRole: null,
      isEmailVerified: true,
      isPhoneVerified: false,
      twoFactorEnabled: false,
      preferredLanguage: Language.FR,
      createdAt: new Date(),
      deletedAt: null,
    });

    mockUserRepo.findByEmail.mockResolvedValue(fakeUser);
    mockHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({
      email: 'marie@example.com',
      password: 'CorrectPassword',
      ipAddress: '127.0.0.1',
    });

    expect(result.userId).toBe('usr_999');
    expect(result.tokens.accessToken).toBe('mock_access');
    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN_SUCCESS', targetId: 'usr_999' }),
    );
  });

  it('should throw UnauthorizedException when password is invalid', async () => {
    const fakeUser = new UserEntity({
      id: 'usr_999',
      email: 'marie@example.com',
      phone: null,
      passwordHash: 'hashed_secret',
      platformRole: null,
      isEmailVerified: true,
      isPhoneVerified: false,
      twoFactorEnabled: false,
      preferredLanguage: Language.FR,
      createdAt: new Date(),
      deletedAt: null,
    });

    mockUserRepo.findByEmail.mockResolvedValue(fakeUser);
    mockHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'marie@example.com', password: 'WrongPassword' }),
    ).rejects.toThrow('Invalid credentials');

    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN_FAILED' }),
    );
  });
});
