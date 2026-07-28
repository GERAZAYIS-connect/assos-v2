import { Inject, Injectable } from '@nestjs/common';
import { ILoanRepository } from '../../domain/repositories/loan.repository.interface';
import { RecordTransactionUseCase } from '../../../treasury/application/use-cases/record-transaction.use-case';
import { Loan } from '../../domain/entities/loan.entity';
import { TransactionType } from '@prisma/client';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';
import { BadRequestException } from '@nestjs/common';

export interface ApproveLoanCommand {
  loanId: string;
  associationId: string;
  approvedByUserId: string;
}

@Injectable()
export class ApproveLoanUseCase {
  constructor(
    @Inject('ILoanRepository') private readonly loanRepo: ILoanRepository,
    private readonly recordTransactionUseCase: RecordTransactionUseCase,
  ) {}

  async execute(command: ApproveLoanCommand): Promise<Loan> {
    return this.loanRepo.approveLoanAtomic(
      command.loanId,
      command.approvedByUserId,
      command.associationId
    );
  }
}
