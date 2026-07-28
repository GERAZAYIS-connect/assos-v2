import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  IMemberRepository,
  MEMBER_REPOSITORY,
} from '../../domain/repositories/member.repository.interface';
import { AssociationRole, MemberStatus } from '@prisma/client';

export interface UpdateMemberStatusCommand {
  associationId: string;
  actorUserId: string;
  targetMemberId: string;
  status: MemberStatus;
  role?: AssociationRole;
}

@Injectable()
export class UpdateMemberStatusUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(command: UpdateMemberStatusCommand) {
    const actor = await this.memberRepository.findByAssociationAndUser(
      command.associationId,
      command.actorUserId,
    );

    if (!actor || actor.role !== AssociationRole.PRESIDENT) {
      throw new ForbiddenException('Only the President can update member status or roles');
    }

    const assocId =
      (await this.memberRepository.resolveAssociationId(command.associationId)) ||
      command.associationId;

    const target = await this.memberRepository.findById(command.targetMemberId);
    if (!target || target.associationId !== assocId) {
      throw new NotFoundException('Member not found');
    }

    if (command.role && command.role !== target.role) {
      target.updateRole(command.role);
    }

    if (command.status === MemberStatus.SUSPENDED) {
      target.suspend();
    } else if (command.status === MemberStatus.ACTIVE) {
      target.activate();
    } else if (command.status === MemberStatus.EXPELLED) {
      target.expel();
    }

    const saved = await this.memberRepository.save(target);
    return saved.toResponseObject();
  }
}
