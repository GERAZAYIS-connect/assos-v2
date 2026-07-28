import { Inject, Injectable } from '@nestjs/common';
import { ILoanRepository } from '../../domain/repositories/loan.repository.interface';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';

@Injectable()
export class GetLoanDetailsUseCase {
  constructor(
    @Inject('ILoanRepository') private readonly loanRepo: ILoanRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(associationId: string, loanId: string) {
    const assocId = await this.loanRepo.resolveAssociationId(associationId);
    
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        borrower: {
          include: {
            user: { select: { email: true, phone: true } },
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        caisse: { select: { id: true, name: true, type: true } },
        repayments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });

    if (!loan || loan.associationId !== assocId) {
      throw new NotFoundException('Prêt', loanId);
    }

    return loan;
  }
}
