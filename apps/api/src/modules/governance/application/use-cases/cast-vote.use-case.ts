import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IGovernanceRepository } from '../../domain/repositories/governance.repository.interface';
import { VoteChoice } from '@prisma/client';

export interface CastVoteCommand {
  resolutionId: string;
  voterMemberId: string;
  choice: VoteChoice;
}

@Injectable()
export class CastVoteUseCase {
  constructor(
    @Inject('IGovernanceRepository')
    private readonly governanceRepo: IGovernanceRepository,
  ) {}

  async execute(command: CastVoteCommand): Promise<any> {
    if (!command.voterMemberId) {
      throw new BadRequestException('L\'identifiant du membre votant est obligatoire.');
    }
    if (!command.choice) {
      throw new BadRequestException('Le choix du vote (FOR, AGAINST, ABSTAIN) est obligatoire.');
    }

    return this.governanceRepo.castVote(command);
  }
}
