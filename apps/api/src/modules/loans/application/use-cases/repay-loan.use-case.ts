import { Inject, Injectable } from '@nestjs/common';
import { ILoanRepository } from '../../domain/repositories/loan.repository.interface';
import { RecordTransactionUseCase } from '../../../treasury/application/use-cases/record-transaction.use-case';
import { Loan } from '../../domain/entities/loan.entity';
import { TransactionType } from '@prisma/client';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';
import { BadRequestException } from '@nestjs/common';

export interface RepayLoanCommand {
  loanId: string;
  associationId: string;
  amount: number;
  notes?: string;
  createdByUserId?: string;
}

@Injectable()
export class RepayLoanUseCase {
  constructor(
    @Inject('ILoanRepository') private readonly loanRepo: ILoanRepository,
    private readonly recordTransactionUseCase: RecordTransactionUseCase,
  ) {}

  async execute(command: RepayLoanCommand): Promise<{ loan: Loan; repayment: any }> {
    return this.loanRepo.repayLoanAtomic(
      command.loanId,
      command.amount,
      command.notes,
      command.createdByUserId,
      command.associationId
    );
  }
}
