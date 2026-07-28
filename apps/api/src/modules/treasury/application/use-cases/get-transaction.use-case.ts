import { Inject, Injectable } from '@nestjs/common';
import { ITreasuryRepository } from '../../domain/repositories/treasury.repository.interface';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';
import { PrismaService } from '../../../../core/prisma/prisma.service';

export interface GetTransactionQuery {
  transactionId: string;
  associationId: string;
}

@Injectable()
export class GetTransactionUseCase {
  constructor(
    @Inject('ITreasuryRepository') private readonly treasuryRepo: ITreasuryRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: GetTransactionQuery) {
    const assocId = await this.treasuryRepo.resolveAssociationId(query.associationId);

    const tx = await this.prisma.transaction.findUnique({
      where: { id: query.transactionId },
      include: {
        caisse: { select: { id: true, name: true, type: true } },
        destinationCaisse: { select: { id: true, name: true, type: true } },
        member: {
          include: {
            user: { select: { email: true, phone: true } },
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        createdBy: { select: { email: true, phone: true } },
        association: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    });

    if (!tx || tx.associationId !== assocId) {
      throw new NotFoundException('Transaction', query.transactionId);
    }

    return tx;
  }
}
