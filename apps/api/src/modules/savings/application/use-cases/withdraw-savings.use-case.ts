import { Inject, Injectable } from '@nestjs/common';
import { ITreasuryRepository } from '../../../treasury/domain/repositories/treasury.repository.interface';
import { RecordTransactionUseCase } from '../../../treasury/application/use-cases/record-transaction.use-case';
import { NotFoundException, ConflictException } from '../../../../core/exceptions/global-exception.filter';
import { TransactionType } from '@prisma/client';
import { AuditService } from '../../../../core/audit/audit.service';

export interface WithdrawSavingsCommand {
  associationId: string;
  caisseId: string;
  memberId: string;
  amount: number;
  actorUserId: string;
  description?: string;
  receiptUrl?: string;
}

@Injectable()
export class WithdrawSavingsUseCase {
  constructor(
    @Inject('ITreasuryRepository') private readonly treasuryRepo: ITreasuryRepository,
    private readonly recordTransactionUseCase: RecordTransactionUseCase,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: WithdrawSavingsCommand) {
    const assocId = await this.treasuryRepo.resolveAssociationId(command.associationId);
    const caisse = await this.treasuryRepo.findById(command.caisseId);
    if (!caisse || caisse.associationId !== assocId) {
      throw new NotFoundException('Caisse', command.caisseId);
    }

    // 1. Check member's balance in this specific caisse
    const currentBalance = await this.treasuryRepo.getMemberBalanceInCaisse(command.memberId, command.caisseId);

    if (currentBalance < command.amount) {
      throw new ConflictException(`Insufficient individual savings balance. Current balance is ${currentBalance}`);
    }

    // 2. We don't necessarily need to check global caisse balance because RecordTransactionUseCase will check it.
    // However, it's good to be aware. The record transaction will throw if the caisse itself is empty.

    const transaction = await this.recordTransactionUseCase.execute({
      associationId: command.associationId,
      caisseId: command.caisseId,
      type: TransactionType.WITHDRAWAL,
      amount: command.amount,
      memberId: command.memberId,
      description: command.description || 'Savings Withdrawal',
      createdByUserId: command.actorUserId,
    });

    await this.auditService.log({
      actorId: command.actorUserId,
      category: 'TREASURY',
      action: 'SAVINGS_WITHDRAWN',
      targetType: 'Transaction',
      targetId: transaction.id,
      metadata: { memberId: command.memberId, caisseId: command.caisseId, amount: command.amount },
    });

    return transaction;
  }
}
