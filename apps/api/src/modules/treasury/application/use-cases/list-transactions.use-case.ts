import { Inject, Injectable } from '@nestjs/common';
import { ITreasuryRepository } from '../../domain/repositories/treasury.repository.interface';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { TransactionType } from '@prisma/client';

export interface ListTransactionsQuery {
  associationId: string;
  caisseId?: string;
  type?: TransactionType;
}

@Injectable()
export class ListTransactionsUseCase {
  constructor(
    @Inject('ITreasuryRepository') private readonly treasuryRepo: ITreasuryRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: ListTransactionsQuery) {
    const assocId = await this.treasuryRepo.resolveAssociationId(query.associationId);
    if (!assocId) return [];

    const where: any = { associationId: assocId };
    if (query.caisseId) where.caisseId = query.caisseId;
    if (query.type) where.type = query.type;

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        caisse: { select: { id: true, name: true, type: true } },
        destinationCaisse: { select: { id: true, name: true, type: true } },
        member: {
          include: {
            user: { select: { email: true, phone: true } },
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        createdBy: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return transactions;
  }
}
