import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { ITreasuryRepository } from '../../domain/repositories/treasury.repository.interface';
import { Caisse } from '../../domain/entities/caisse.entity';
import { Transaction } from '../../domain/entities/transaction.entity';
import { CaisseType, TransactionStatus, TransactionType } from '@prisma/client';

@Injectable()
export class PrismaTreasuryRepository implements ITreasuryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToCaisseEntity(data: any): Caisse {
    return Caisse.create({
      id: data.id,
      associationId: data.associationId,
      type: data.type as CaisseType,
      name: data.name,
      balance: data.balance,
      isLoanable: data.isLoanable,
      isBankAccount: data.isBankAccount,
      accountDetails: data.accountDetails,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  private mapToTransactionEntity(data: any): Transaction {
    return Transaction.create({
      id: data.id,
      associationId: data.associationId,
      caisseId: data.caisseId,
      destinationCaisseId: data.destinationCaisseId,
      type: data.type as TransactionType,
      amount: data.amount,
      reference: data.reference,
      description: data.description,
      memberId: data.memberId,
      status: data.status as TransactionStatus,
      receiptUrl: data.receiptUrl,
      createdByUserId: data.createdByUserId,
      approvedByUserId: data.approvedByUserId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async resolveAssociationId(idOrSlug: string): Promise<string | null> {
    const assoc = await this.prisma.association.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    return assoc ? assoc.id : null;
  }

  async createCaisse(caisse: Caisse): Promise<void> {
    const data = caisse.toJSON();
    data.associationId = await this.resolveAssociationId(data.associationId) || data.associationId;
    await this.prisma.caisse.create({
      data: data,
    });
  }

  async updateCaisse(caisse: Caisse): Promise<void> {
    await this.prisma.caisse.update({
      where: { id: caisse.id },
      data: caisse.toJSON(),
    });
  }

  async findById(id: string): Promise<Caisse | null> {
    const data = await this.prisma.caisse.findUnique({
      where: { id },
    });
    return data ? this.mapToCaisseEntity(data) : null;
  }

  async findByAssociationId(associationId: string): Promise<Caisse[]> {
    const assocId = await this.resolveAssociationId(associationId) || associationId;
    const data = await this.prisma.caisse.findMany({
      where: { associationId: assocId },
    });
    return data.map((d: any) => this.mapToCaisseEntity(d));
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    const data = transaction.toJSON();
    const assocId = await this.resolveAssociationId(data.associationId) || data.associationId;
    await this.prisma.transaction.upsert({
      where: { id: transaction.id },
      update: {
        status: data.status,
        receiptUrl: data.receiptUrl,
        updatedAt: data.updatedAt,
      },
      create: {
        id: data.id,
        associationId: assocId,
        caisseId: data.caisseId,
        destinationCaisseId: data.destinationCaisseId,
        type: data.type,
        amount: data.amount,
        reference: data.reference,
        description: data.description,
        memberId: data.memberId,
        status: data.status,
        receiptUrl: data.receiptUrl,
        createdByUserId: data.createdByUserId,
        approvedByUserId: data.approvedByUserId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }
    });
  }

  async findTransactionById(id: string): Promise<Transaction | null> {
    const data = await this.prisma.transaction.findUnique({
      where: { id },
    });
    return data ? this.mapToTransactionEntity(data) : null;
  }

  async findTransactionsByCaisse(caisseId: string): Promise<Transaction[]> {
    const data = await this.prisma.transaction.findMany({
      where: {
        OR: [
          { caisseId: caisseId },
          { destinationCaisseId: caisseId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    return data.map((d: any) => this.mapToTransactionEntity(d));
  }
  async getMemberBalanceInCaisse(memberId: string, caisseId: string): Promise<number> {
    const aggregations = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        memberId: memberId,
        caisseId: caisseId,
        status: TransactionStatus.CONFIRMED,
        OR: [
          { type: TransactionType.DEPOSIT },
          { type: TransactionType.WITHDRAWAL }
        ]
      },
      _sum: {
        amount: true,
      },
    });

    let balance = 0;
    for (const agg of aggregations) {
      if (agg.type === TransactionType.DEPOSIT) {
        balance += agg._sum.amount || 0;
      } else if (agg.type === TransactionType.WITHDRAWAL) {
        balance -= agg._sum.amount || 0;
      }
    }

    return balance;
  }

  // ACID transaction for single caisse operations
  async executeTransaction(transaction: Transaction): Promise<void> {
    const txData = transaction.toJSON();
    const assocId = await this.resolveAssociationId(txData.associationId) || txData.associationId;
    
    await this.prisma.$transaction(async (prisma: any) => {
      // 1. For withdrawals, check balance to avoid overdraft race conditions
      if (txData.type === TransactionType.WITHDRAWAL) {
        const currentCaisse = await prisma.caisse.findUnique({
          where: { id: txData.caisseId },
          select: { balance: true }
        });
        if (!currentCaisse || currentCaisse.balance < txData.amount) {
          throw new Error(`Fonds insuffisants dans la caisse pour effectuer ce retrait`);
        }
      }

      // 2. Update caisse atomically
      if (txData.type === TransactionType.DEPOSIT) {
        await prisma.caisse.update({
          where: { id: txData.caisseId },
          data: { balance: { increment: txData.amount }, updatedAt: new Date() }
        });
      } else if (txData.type === TransactionType.WITHDRAWAL) {
        await prisma.caisse.update({
          where: { id: txData.caisseId },
          data: { balance: { decrement: txData.amount }, updatedAt: new Date() }
        });
      } else if (txData.type === TransactionType.ADJUSTMENT) {
        if (txData.amount > 0) {
          await prisma.caisse.update({
            where: { id: txData.caisseId },
            data: { balance: { increment: txData.amount }, updatedAt: new Date() }
          });
        } else if (txData.amount < 0) {
          await prisma.caisse.update({
            where: { id: txData.caisseId },
            data: { balance: { decrement: Math.abs(txData.amount) }, updatedAt: new Date() }
          });
        }
      }

      // 3. Save transaction log
      await prisma.transaction.create({
        data: {
          id: txData.id,
          associationId: assocId,
          caisseId: txData.caisseId,
          type: txData.type,
          amount: Math.abs(txData.amount), // Always store absolute in DB if we want, or keep original. Let's keep original
          reference: txData.reference,
          description: txData.description,
          memberId: txData.memberId,
          status: txData.status,
          receiptUrl: txData.receiptUrl,
          createdByUserId: txData.createdByUserId,
          approvedByUserId: txData.approvedByUserId,
          createdAt: txData.createdAt,
          updatedAt: txData.updatedAt,
        }
      });
    });
  }

  // ACID transaction for transfers
  async executeTransfer(
    sourceCaisse: Caisse,
    destinationCaisse: Caisse,
    transaction: Transaction
  ): Promise<void> {
    const txData = transaction.toJSON();
    const assocId = await this.resolveAssociationId(txData.associationId) || txData.associationId;
    
    await this.prisma.$transaction(async (prisma: any) => {
      // 1. Check current source balance in DB to avoid race conditions
      const currentSource = await prisma.caisse.findUnique({
        where: { id: sourceCaisse.id },
        select: { balance: true }
      });
      
      if (!currentSource || currentSource.balance < transaction.amount) {
        throw new Error(`Insufficient funds in source caisse for transfer`);
      }

      // 2. Debit source
      await prisma.caisse.update({
        where: { id: sourceCaisse.id },
        data: {
          balance: { decrement: transaction.amount },
          updatedAt: new Date()
        }
      });

      // 3. Credit destination
      await prisma.caisse.update({
        where: { id: destinationCaisse.id },
        data: {
          balance: { increment: transaction.amount },
          updatedAt: new Date()
        }
      });

      // 4. Save transaction log
      await prisma.transaction.create({
        data: {
          id: txData.id,
          associationId: assocId,
          caisseId: txData.caisseId,
          destinationCaisseId: txData.destinationCaisseId,
          type: txData.type,
          amount: txData.amount,
          reference: txData.reference,
          description: txData.description,
          memberId: txData.memberId,
          status: txData.status,
          receiptUrl: txData.receiptUrl,
          createdByUserId: txData.createdByUserId,
          approvedByUserId: txData.approvedByUserId,
          createdAt: txData.createdAt,
          updatedAt: txData.updatedAt,
        }
      });
    });
  }
}
