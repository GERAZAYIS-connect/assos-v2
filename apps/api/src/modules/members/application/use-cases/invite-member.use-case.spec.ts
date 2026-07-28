import { InviteMemberUseCase } from './invite-member.use-case';
import { IMemberRepository } from '../../domain/repositories/member.repository.interface';
import { MemberEntity } from '../../domain/entities/member.entity';
import { AssociationRole, MemberStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('InviteMemberUseCase', () => {
  let useCase: InviteMemberUseCase;
  let mockMemberRepository: jest.Mocked<IMemberRepository>;

  const presidentMember = new MemberEntity({
    id: 'mem-pres',
    associationId: 'asso-1',
    userId: 'user-pres',
    role: AssociationRole.PRESIDENT,
    status: MemberStatus.ACTIVE,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const simpleMember = new MemberEntity({
    id: 'mem-simple',
    associationId: 'asso-1',
    userId: 'user-simple',
    role: AssociationRole.MEMBER,
    status: MemberStatus.ACTIVE,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockMemberRepository = {
      findById: jest.fn(),
      findByAssociationAndUser: jest.fn(),
      listByAssociation: jest.fn(),
      save: jest.fn(),
      createInvitation: jest.fn().mockImplementation(async (data) => ({
        id: 'inv-1',
        ...data,
        createdAt: new Date(),
      })),
      findInvitationByToken: jest.fn(),
      markInvitationUsed: jest.fn(),
      createCertificate: jest.fn(),
      findCertificateByToken: jest.fn(),
    };

    useCase = new InviteMemberUseCase(mockMemberRepository);
  });

  it('should allow President to create an invitation link', async () => {
    mockMemberRepository.findByAssociationAndUser.mockResolvedValue(presidentMember);

    const result = await useCase.execute({
      associationId: 'asso-1',
      invitedByUserId: 'user-pres',
      email: 'newmember@test.com',
      role: AssociationRole.MEMBER,
    });

    expect(result.token).toBeDefined();
    expect(result.inviteUrl).toContain('/invite/');
    expect(mockMemberRepository.createInvitation).toHaveBeenCalled();
  });

  it('should throw ForbiddenException if simple member tries to invite', async () => {
    mockMemberRepository.findByAssociationAndUser.mockResolvedValue(simpleMember);

    await expect(
      useCase.execute({
        associationId: 'asso-1',
        invitedByUserId: 'user-simple',
        email: 'newmember@test.com',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if inviter is not found', async () => {
    mockMemberRepository.findByAssociationAndUser.mockResolvedValue(null);

    await expect(
      useCase.execute({
        associationId: 'asso-1',
        invitedByUserId: 'user-unknown',
        email: 'newmember@test.com',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
