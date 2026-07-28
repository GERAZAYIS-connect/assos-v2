import { Inject, Injectable } from '@nestjs/common';
import { ILoanRepository } from '../../domain/repositories/loan.repository.interface';
import { LoanStatus } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';

export interface ListLoansQuery {
  associationId: string;
  status?: LoanStatus;
  memberId?: string;
}

@Injectable()
export class ListLoansUseCase {
  constructor(
    @Inject('ILoanRepository') private readonly loanRepo: ILoanRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: ListLoansQuery) {
    const assocId = await this.loanRepo.resolveAssociationId(query.associationId);
    if (!assocId) return [];

    const where: any = { associationId: assocId };
    if (query.status) where.status = query.status;
    if (query.memberId) where.borrowerMemberId = query.memberId;

    const loans = await this.prisma.loan.findMany({
      where,
      include: {
        borrower: {
          include: {
            user: { select: { email: true, phone: true } },
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        caisse: { select: { id: true, name: true, type: true } },
        repayments: { select: { id: true, amount: true, paidAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return loans;
  }
}
