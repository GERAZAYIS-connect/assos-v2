import { Inject, Injectable } from '@nestjs/common';
import { ITreasuryRepository } from '../../domain/repositories/treasury.repository.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface RecordTransactionCommand {
  associationId: string;
  caisseId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  memberId?: string;
  createdByUserId?: string;
}

@Injectable()
export class RecordTransactionUseCase {
  constructor(
    @Inject('ITreasuryRepository')
    private readonly treasuryRepository: ITreasuryRepository
  ) {}

  private generateReference(): string {
    const date = new Date();
    const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    return `REC-${dateString}-${randomSuffix}`;
  }

  async execute(command: RecordTransactionCommand): Promise<Transaction> {
    if (command.type === TransactionType.TRANSFER) {
      throw new Error("Use TransferFundsUseCase for transfers");
    }

    const assocId = await this.treasuryRepository.resolveAssociationId(command.associationId);
    const caisse = await this.treasuryRepository.findById(command.caisseId);
    if (!caisse || caisse.associationId !== assocId) {
      throw new Error("Source caisse not found or doesn't belong to the association");
    }

    const transaction = Transaction.create({
      id: randomUUID(),
      associationId: assocId,
      caisseId: command.caisseId,
      type: command.type,
      amount: command.amount,
      reference: this.generateReference(),
      description: command.description,
      memberId: command.memberId,
      status: TransactionStatus.PENDING, // Could be confirmed immediately based on business rules
      createdByUserId: command.createdByUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    transaction.complete(); // Mark as confirmed

    await this.treasuryRepository.executeTransaction(transaction);

    // TODO: Generate PDF receipt and save URL asynchronously
    
    return transaction;
  }
}
