import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ITontineRepository } from '../../domain/repositories/tontine.repository.interface';

export interface AttributeTontinePotCommand {
  roundId: string;
  beneficiaryMemberId: string;
  potAmount: number;
  auctionAmount?: number;
  createdByUserId?: string;
}

@Injectable()
export class AttributeTontinePotUseCase {
  constructor(
    @Inject('ITontineRepository') private readonly tontineRepo: ITontineRepository,
  ) {}

  async execute(command: AttributeTontinePotCommand) {
    if (!command.beneficiaryMemberId) {
      throw new BadRequestException('Un membre bénéficiaire doit être désigné.');
    }
    if (!command.potAmount || command.potAmount <= 0) {
      throw new BadRequestException('Le montant du pot doit être supérieur à zéro.');
    }

    return this.tontineRepo.attributePotAtomic(command);
  }
}
