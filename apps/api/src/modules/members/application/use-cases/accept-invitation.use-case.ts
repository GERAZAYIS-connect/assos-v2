import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  IMemberRepository,
  MEMBER_REPOSITORY,
} from '../../domain/repositories/member.repository.interface';

export interface AcceptInvitationCommand {
  token: string;
  userId: string;
}

@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async getInvitationDetails(token: string) {
    const invitation = await this.memberRepository.findInvitationByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation non trouvée ou invalide.');
    }

    const isExpired = new Date() > new Date(invitation.expiresAt);
    const isUsed = Boolean(invitation.usedAt);

    return {
      token: invitation.token,
      associationName: invitation.associationName,
      associationSlug: invitation.associationSlug,
      inviterName: invitation.inviterName,
      role: invitation.role,
      email: invitation.email,
      phone: invitation.phone,
      isExpired,
      isUsed,
      isValid: !isExpired && !isUsed,
    };
  }

  async execute(command: AcceptInvitationCommand) {
    const invitation = await this.memberRepository.findInvitationByToken(command.token);
    if (!invitation) {
      throw new NotFoundException('Invitation non trouvée.');
    }

    if (invitation.usedAt) {
      throw new BadRequestException('Cette invitation a déjà été utilisée.');
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      throw new BadRequestException('Cette invitation a expiré.');
    }

    // Check if user is already a member
    const existing = await this.memberRepository.findByAssociationAndUser(
      invitation.associationId,
      command.userId,
    );

    if (existing) {
      throw new ConflictException('Vous êtes déjà membre de cette association.');
    }

    // Create new member
    const newMember = await this.memberRepository.createMember(
      invitation.associationId,
      command.userId,
      invitation.role,
    );

    // Mark invitation as used
    await this.memberRepository.markInvitationUsed(invitation.id);

    return {
      memberId: newMember.id,
      associationSlug: invitation.associationSlug,
      role: newMember.role,
    };
  }
}
