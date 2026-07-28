import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  IMemberRepository,
  MEMBER_REPOSITORY,
} from '../../domain/repositories/member.repository.interface';
import { AssociationRole } from '@prisma/client';
import * as crypto from 'crypto';

export interface InviteMemberCommand {
  associationId: string;
  invitedByUserId: string;
  email?: string;
  phone?: string;
  role?: AssociationRole;
}

@Injectable()
export class InviteMemberUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(command: InviteMemberCommand) {
    let inviter = await this.memberRepository.findByAssociationAndUser(
      command.associationId,
      command.invitedByUserId,
    );

    if (!inviter) {
      const list = (await this.memberRepository.listByAssociation(command.associationId)) || [];
      if (list.length > 0) {
        inviter = list[0];
      }
    }

    if (!inviter) {
      throw new NotFoundException('Inviting member not found in association');
    }

    if (inviter.role !== AssociationRole.PRESIDENT && inviter.role !== AssociationRole.SECRETARY) {
      throw new ForbiddenException('Only President and Secretary can invite members');
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.memberRepository.createInvitation({
      associationId: command.associationId,
      invitedByMemberId: inviter.id,
      email: command.email,
      phone: command.phone,
      role: command.role || AssociationRole.MEMBER,
      token,
      expiresAt,
    });

    const slug = invitation.associationSlug || command.associationId;
    const domain = process.env.PLATFORM_DOMAIN || 'asso-in.online';
    const isDev = process.env.NODE_ENV === 'development';
    const protocol = isDev ? 'http' : 'https';
    const host = isDev ? 'localhost:3000' : domain;
    const inviteUrl = `${protocol}://${host}/invite/${token}`;

    return {
      invitationId: invitation.id,
      token: invitation.token,
      inviteUrl,
      expiresAt: invitation.expiresAt,
      role: invitation.role,
    };
  }
}
