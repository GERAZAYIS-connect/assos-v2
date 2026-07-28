import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ITontineRepository } from '../../domain/repositories/tontine.repository.interface';

export interface PayTontineContributionCommand {
  roundId: string;
  memberId: string;
  amount: number;
  createdByUserId?: string;
}

@Injectable()
export class PayTontineContributionUseCase {
  constructor(
    @Inject('ITontineRepository') private readonly tontineRepo: ITontineRepository,
  ) {}

  async execute(command: PayTontineContributionCommand) {
    if (!command.amount || command.amount <= 0) {
      throw new BadRequestException('Le montant de la cotisation doit être positif.');
    }

    return this.tontineRepo.payContributionAtomic(command);
  }
}
