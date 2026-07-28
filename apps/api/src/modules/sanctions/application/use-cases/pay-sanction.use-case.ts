import { Inject, Injectable } from '@nestjs/common';
import { ISanctionRepository } from '../../domain/repositories/sanction.repository.interface';
import { ITreasuryRepository } from '../../../treasury/domain/repositories/treasury.repository.interface';
import { RecordTransactionUseCase } from '../../../treasury/application/use-cases/record-transaction.use-case';
import { Sanction } from '../../domain/entities/sanction.entity';
import { TransactionType } from '@prisma/client';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';
import { BadRequestException } from '@nestjs/common';

export interface PaySanctionCommand {
  sanctionId: string;
  associationId: string;
  caisseId: string;
  paidByUserId?: string;
}

@Injectable()
export class PaySanctionUseCase {
  constructor(
    @Inject('ISanctionRepository') private readonly sanctionRepo: ISanctionRepository,
    @Inject('ITreasuryRepository') private readonly treasuryRepo: ITreasuryRepository,
    private readonly recordTransactionUseCase: RecordTransactionUseCase,
  ) {}

  async execute(command: PaySanctionCommand): Promise<Sanction> {
    return this.sanctionRepo.paySanctionAtomic(
      command.sanctionId,
      command.caisseId,
      command.paidByUserId,
      command.associationId
    );
  }
}
