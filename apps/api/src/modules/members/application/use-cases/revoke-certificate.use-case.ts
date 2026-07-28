import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  IMemberRepository,
  MEMBER_REPOSITORY,
} from '../../domain/repositories/member.repository.interface';
import { AssociationRole } from '@prisma/client';

export interface RevokeCertificateCommand {
  associationId: string;
  certificateId: string;
  actorUserId: string;
  reason?: string;
}

@Injectable()
export class RevokeCertificateUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(command: RevokeCertificateCommand) {
    const actor = await this.memberRepository.findByAssociationAndUser(
      command.associationId,
      command.actorUserId,
    );

    if (
      !actor ||
      (actor.role !== AssociationRole.PRESIDENT &&
        actor.role !== AssociationRole.SECRETARY)
    ) {
      throw new ForbiddenException(
        "Seuls le Président et le Secrétaire Général peuvent invalider une attestation.",
      );
    }

    await this.memberRepository.revokeCertificate(
      command.certificateId,
      command.reason,
    );

    return { success: true, message: 'Attestation invalidée avec succès.' };
  }
}
