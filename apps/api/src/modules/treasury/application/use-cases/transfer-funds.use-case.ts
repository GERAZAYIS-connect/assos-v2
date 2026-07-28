import { Inject, Injectable } from '@nestjs/common';
import { ITreasuryRepository } from '../../domain/repositories/treasury.repository.interface';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface TransferFundsCommand {
  associationId: string;
  sourceCaisseId: string;
  destinationCaisseId: string;
  amount: number;
  description?: string;
  createdByUserId?: string;
}

@Injectable()
export class TransferFundsUseCase {
  constructor(
    @Inject('ITreasuryRepository')
    private readonly treasuryRepository: ITreasuryRepository
  ) {}

  private generateReference(): string {
    const date = new Date();
    const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    return `TRF-${dateString}-${randomSuffix}`;
  }

  async execute(command: TransferFundsCommand): Promise<Transaction> {
    if (command.sourceCaisseId === command.destinationCaisseId) {
      throw new Error("Source and destination caisse must be different");
    }
    if (command.amount <= 0) {
      throw new Error("Transfer amount must be positive");
    }

    const assocId = await this.treasuryRepository.resolveAssociationId(command.associationId);
    const sourceCaisse = await this.treasuryRepository.findById(command.sourceCaisseId);

    if (!sourceCaisse || sourceCaisse.associationId !== assocId) {
      throw new Error("Source caisse not found or belongs to a different association");
    }
    const destCaisse = await this.treasuryRepository.findById(command.destinationCaisseId);
    if (!destCaisse || destCaisse.associationId !== assocId) {
      throw new Error("Destination caisse not found or belongs to a different association");
    }
    if (sourceCaisse.balance < command.amount) {
      throw new Error(`Insufficient funds in source caisse (${sourceCaisse.name})`);
    }

    const transaction = Transaction.create({
      id: randomUUID(),
      associationId: command.associationId,
      caisseId: command.sourceCaisseId,
      destinationCaisseId: command.destinationCaisseId,
      type: TransactionType.TRANSFER,
      amount: command.amount,
      reference: this.generateReference(),
      description: command.description,
      status: TransactionStatus.CONFIRMED,
      createdByUserId: command.createdByUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Use the ACID repository method to guarantee atomicity
    await this.treasuryRepository.executeTransfer(sourceCaisse, destCaisse, transaction);

    return transaction;
  }
}
