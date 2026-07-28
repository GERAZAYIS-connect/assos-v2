import { Inject, Injectable } from '@nestjs/common';
import { ITreasuryRepository } from '../../../treasury/domain/repositories/treasury.repository.interface';
import { RecordTransactionUseCase } from '../../../treasury/application/use-cases/record-transaction.use-case';
import { NotFoundException, ConflictException } from '../../../../core/exceptions/global-exception.filter';
import { TransactionType } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';

export interface DepositSavingsCommand {
  associationId: string;
  caisseId: string;
  memberId: string;
  amount: number;
  actorUserId: string;
  description?: string;
  receiptUrl?: string;
}

@Injectable()
export class DepositSavingsUseCase {
  constructor(
    @Inject('ITreasuryRepository') private readonly treasuryRepo: ITreasuryRepository,
    private readonly recordTransactionUseCase: RecordTransactionUseCase,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: DepositSavingsCommand) {
    const assocId = await this.treasuryRepo.resolveAssociationId(command.associationId);
    const caisse = await this.treasuryRepo.findById(command.caisseId);
    if (!caisse || caisse.associationId !== assocId) {
      throw new NotFoundException('Caisse', command.caisseId);
    }
    
    // We can allow any caisse type to receive savings technically, 
    // but usually it's INDIVIDUAL_SAVINGS, COLLECTIVE_SAVINGS, EMERGENCY.
    // For now, we trust the treasurer.

    const transaction = await this.recordTransactionUseCase.execute({
      associationId: command.associationId,
      caisseId: command.caisseId,
      type: TransactionType.DEPOSIT,
      amount: command.amount,
      memberId: command.memberId,
      description: command.description || 'Savings Deposit',
      createdByUserId: command.actorUserId,
    });

    await this.auditService.log({
      actorId: command.actorUserId,
      category: 'TREASURY',
      action: 'SAVINGS_DEPOSITED',
      targetType: 'Transaction',
      targetId: transaction.id,
      metadata: { memberId: command.memberId, caisseId: command.caisseId, amount: command.amount },
    });

    return transaction;
  }
}
