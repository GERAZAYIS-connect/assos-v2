import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  IMemberRepository,
  MEMBER_REPOSITORY,
} from '../../domain/repositories/member.repository.interface';
import { AssociationRole } from '@prisma/client';

export interface UpdateMemberProfileCommand {
  associationId: string;
  actorUserId: string;
  targetMemberId: string;
  profileData: {
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    idCardType?: string;
    idCardNumber?: string;
    address?: string;
    profession?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    proxyName?: string;
    proxyPhone?: string;
    proxyNotes?: string;
  };
}

@Injectable()
export class UpdateMemberProfileUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(command: UpdateMemberProfileCommand) {
    const actor = await this.memberRepository.findByAssociationAndUser(
      command.associationId,
      command.actorUserId,
    );

    if (!actor) {
      throw new ForbiddenException("Vous n'appartenez pas à cette association.");
    }

    const target = await this.memberRepository.findById(command.targetMemberId);
    if (!target) {
      throw new NotFoundException("Membre introuvable.");
    }

    const isSelf = actor.userId === target.userId;
    const isBureau =
      actor.role === AssociationRole.PRESIDENT ||
      actor.role === AssociationRole.SECRETARY;

    if (!isSelf && !isBureau) {
      throw new ForbiddenException(
        "Seul le membre concerné ou le Président/Secrétaire peut modifier ces informations de profil.",
      );
    }

    // Merge existing profile props with updated fields
    const updatedProfile = {
      ...(target.profile || {}),
      ...command.profileData,
    };

    target.updateProxy(
      updatedProfile.proxyName,
      updatedProfile.proxyPhone,
      updatedProfile.proxyNotes,
    );

    // Save profile props via repo
    (target as any).props.profile = updatedProfile;

    const saved = await this.memberRepository.save(target);
    return saved.toResponseObject();
  }
}
