import { RegisterUserUseCase } from './register-user.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IPasswordHasher } from '../../domain/ports/password-hasher.interface';
import { ITokenService } from '../../domain/ports/token.service.interface';
import { AuditService } from '../../../../core/audit/audit.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { Language } from '@assos/shared';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
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
      emailExists: jest.fn().mockResolvedValue(false),
      phoneExists: jest.fn().mockResolvedValue(false),
    };

    mockHasher = {
      hash: jest.fn().mockResolvedValue('hashed_password_123'),
      compare: jest.fn(),
    };

    mockTokenService = {
      generateAccessToken: jest.fn().mockReturnValue('mock_access_token'),
      generateRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new RegisterUserUseCase(
      mockUserRepo,
      mockHasher,
      mockTokenService,
      mockAuditService,
    );
  });

  it('should successfully register a user with email and return tokens', async () => {
    const fakeUser = new UserEntity({
      id: 'usr_123',
      email: 'marie@example.com',
      phone: null,
      passwordHash: 'hashed_password_123',
      platformRole: null,
      isEmailVerified: false,
      isPhoneVerified: false,
      twoFactorEnabled: false,
      preferredLanguage: Language.FR,
      createdAt: new Date(),
      deletedAt: null,
    });

    mockUserRepo.create.mockResolvedValue(fakeUser);

    const result = await useCase.execute({
      email: 'Marie@Example.com',
      password: 'Password123!',
    });

    expect(mockUserRepo.emailExists).toHaveBeenCalledWith('marie@example.com');
    expect(mockHasher.hash).toHaveBeenCalledWith('Password123!');
    expect(mockUserRepo.create).toHaveBeenCalledWith({
      email: 'marie@example.com',
      phone: undefined,
      passwordHash: 'hashed_password_123',
    });
    expect(result.userId).toBe('usr_123');
    expect(result.tokens.accessToken).toBe('mock_access_token');
    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_REGISTERED',
        targetId: 'usr_123',
      }),
    );
  });

  it('should throw an error if email is already taken', async () => {
    mockUserRepo.emailExists.mockResolvedValue(true);

    await expect(
      useCase.execute({ email: 'existing@example.com', password: 'Password123!' }),
    ).rejects.toThrow('already registered');
  });
});
