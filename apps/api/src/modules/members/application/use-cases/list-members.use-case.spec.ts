import { ListMembersUseCase } from './list-members.use-case';
import { IMemberRepository } from '../../domain/repositories/member.repository.interface';
import { MemberEntity } from '../../domain/entities/member.entity';
import { AssociationRole, MemberStatus } from '@prisma/client';

describe('ListMembersUseCase', () => {
  let useCase: ListMembersUseCase;
  let mockMemberRepository: jest.Mocked<IMemberRepository>;

  const mockMember = new MemberEntity({
    id: 'mem-1',
    associationId: 'asso-1',
    userId: 'user-1',
    role: AssociationRole.MEMBER,
    status: MemberStatus.ACTIVE,
    joinedAt: new Date(),
    userEmail: 'member@test.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockMemberRepository = {
      findById: jest.fn(),
      findByAssociationAndUser: jest.fn(),
      listByAssociation: jest.fn().mockResolvedValue([mockMember]),
      save: jest.fn(),
      createInvitation: jest.fn(),
      findInvitationByToken: jest.fn(),
      markInvitationUsed: jest.fn(),
      createCertificate: jest.fn(),
      findCertificateByToken: jest.fn(),
    };

    useCase = new ListMembersUseCase(mockMemberRepository);
  });

  it('should return mapped member list for association', async () => {
    const result = await useCase.execute({ associationId: 'asso-1' });

    expect(mockMemberRepository.listByAssociation).toHaveBeenCalledWith('asso-1', {
      status: undefined,
      role: undefined,
      search: undefined,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('mem-1');
    expect(result[0].userEmail).toBe('member@test.com');
  });
});
