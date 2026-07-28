import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IMemberRepository,
  MEMBER_REPOSITORY,
} from '../../domain/repositories/member.repository.interface';

export interface AssignProxyCommand {
  associationId: string;
  memberId: string;
  proxyName?: string;
  proxyPhone?: string;
  proxyNotes?: string;
  expiresAt?: string; // ISO date string
}

@Injectable()
export class AssignProxyUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(command: AssignProxyCommand) {
    const assocId =
      (await this.memberRepository.resolveAssociationId(command.associationId)) ||
      command.associationId;

    const member = await this.memberRepository.findById(command.memberId);
    if (!member || member.associationId !== assocId) {
      throw new NotFoundException('Member not found');
    }

    const expiresAt = command.expiresAt ? new Date(command.expiresAt) : undefined;

    member.updateProxy(
      command.proxyName,
      command.proxyPhone,
      command.proxyNotes,
      expiresAt,
    );
    const saved = await this.memberRepository.save(member);
    return saved.toResponseObject();
  }
}
