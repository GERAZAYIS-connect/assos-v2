import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IMemberRepository,
  MEMBER_REPOSITORY,
} from '../../domain/repositories/member.repository.interface';

export interface RevokeProxyCommand {
  associationId: string;
  memberId: string;
}

@Injectable()
export class RevokeProxyUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(command: RevokeProxyCommand) {
    const assocId =
      (await this.memberRepository.resolveAssociationId(command.associationId)) ||
      command.associationId;

    const member = await this.memberRepository.findById(command.memberId);
    if (!member || member.associationId !== assocId) {
      throw new NotFoundException('Member not found');
    }

    member.revokeProxy();
    const saved = await this.memberRepository.save(member);
    return saved.toResponseObject();
  }
}
