import { CreateAssociationUseCase } from './create-association.use-case';
import { IAssociationRepository } from '../../domain/repositories/association.repository.interface';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../../../core/audit/audit.service';
import { AssociationAggregate } from '../../domain/aggregates/association.aggregate';
import { Currency, Language, SubscriptionPlan } from '@assos/shared';

describe('CreateAssociationUseCase', () => {
  let useCase: CreateAssociationUseCase;
  let mockAssocRepo: jest.Mocked<IAssociationRepository>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockAuditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    mockAssocRepo = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findByMemberId: jest.fn(),
      slugExists: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue(['admin', 'api', 'www']),
    } as any;

    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new CreateAssociationUseCase(
      mockAssocRepo,
      mockConfigService,
      mockAuditService,
    );
  });

  it('should successfully create an association and record audit log', async () => {
    const fakeAssoc = new AssociationAggregate({
      id: 'asc_123',
      name: 'Mutuelle Les Collines',
      slug: 'les-collines',
      logoUrl: null,
      currency: Currency.XAF,
      country: 'CM',
      language: Language.FR,
      branding: null,
      plan: SubscriptionPlan.DISCOVERY,
      isActive: true,
      createdAt: new Date(),
    });

    mockAssocRepo.create.mockResolvedValue(fakeAssoc);

    const result = await useCase.execute({
      name: 'Mutuelle Les Collines',
      slug: 'les-collines',
      creatorUserId: 'usr_owner',
    });

    expect(result.id).toBe('asc_123');
    expect(mockAssocRepo.slugExists).toHaveBeenCalledWith('les-collines');
    expect(mockAssocRepo.create).toHaveBeenCalledWith({
      name: 'Mutuelle Les Collines',
      slug: 'les-collines',
      currency: undefined,
      country: undefined,
      language: undefined,
      creatorUserId: 'usr_owner',
    });
    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ASSOCIATION_CREATED', associationId: 'asc_123' }),
    );
  });

  it('should reject a reserved slug', async () => {
    await expect(
      useCase.execute({
        name: 'API Assos',
        slug: 'api',
        creatorUserId: 'usr_owner',
      }),
    ).rejects.toThrow('reserved');
  });

  it('should reject a slug that is already taken', async () => {
    mockAssocRepo.slugExists.mockResolvedValue(true);

    await expect(
      useCase.execute({
        name: 'Taken Asso',
        slug: 'taken-asso',
        creatorUserId: 'usr_owner',
      }),
    ).rejects.toThrow('already taken');
  });
});
