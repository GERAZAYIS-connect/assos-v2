import { Inject, Injectable } from '@nestjs/common';
import { ILoanRepository } from '../../domain/repositories/loan.repository.interface';
import { ITreasuryRepository } from '../../../treasury/domain/repositories/treasury.repository.interface';
import { Loan } from '../../domain/entities/loan.entity';
import { LoanStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';
import { BadRequestException } from '@nestjs/common';

export interface RequestLoanCommand {
  associationId: string;
  borrowerMemberId: string;
  guarantorMemberId?: string;
  caisseId: string;
  amount: number;
  interestRate?: number;
  reason?: string;
  dueDate?: Date;
}

@Injectable()
export class RequestLoanUseCase {
  constructor(
    @Inject('ILoanRepository') private readonly loanRepo: ILoanRepository,
    @Inject('ITreasuryRepository') private readonly treasuryRepo: ITreasuryRepository,
  ) {}

  async execute(command: RequestLoanCommand): Promise<Loan> {
    const assocId = await this.loanRepo.resolveAssociationId(command.associationId);
    if (!assocId) {
      throw new NotFoundException('Association', command.associationId);
    }

    const caisse = await this.treasuryRepo.findById(command.caisseId);
    if (!caisse || caisse.associationId !== assocId) {
      throw new NotFoundException('Caisse', command.caisseId);
    }

    if (!caisse.isLoanable) {
      throw new BadRequestException(`La caisse ${caisse.name} n'est pas autorisée pour les prêts`);
    }

    if (caisse.balance < command.amount) {
      throw new BadRequestException(
        `Solde insuffisant dans la caisse (${caisse.name}: ${caisse.balance.toLocaleString('fr-FR')} XAF disponibles, montant demandé: ${command.amount.toLocaleString('fr-FR')} XAF)`
      );
    }

    if (command.guarantorMemberId && command.guarantorMemberId === command.borrowerMemberId) {
      throw new BadRequestException(`L'emprunteur ne peut pas être son propre garant solidaire.`);
    }

    const interestRate = command.interestRate || 0;
    const totalToRepay = command.amount + (command.amount * interestRate) / 100;

    const loan = Loan.create({
      id: randomUUID(),
      associationId: assocId,
      borrowerMemberId: command.borrowerMemberId,
      guarantorMemberId: command.guarantorMemberId,
      caisseId: command.caisseId,
      amount: command.amount,
      interestRate,
      totalToRepay,
      balanceRemaining: totalToRepay,
      status: LoanStatus.PENDING,
      reason: command.reason,
      dueDate: command.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.loanRepo.createLoan(loan);
    return loan;
  }
}
