import { Inject, Injectable } from '@nestjs/common';
import { ILoanRepository } from '../../domain/repositories/loan.repository.interface';
import { Loan } from '../../domain/entities/loan.entity';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';

export interface RejectLoanCommand {
  loanId: string;
  associationId: string;
}

@Injectable()
export class RejectLoanUseCase {
  constructor(
    @Inject('ILoanRepository') private readonly loanRepo: ILoanRepository,
  ) {}

  async execute(command: RejectLoanCommand): Promise<Loan> {
    const loan = await this.loanRepo.findById(command.loanId);
    if (!loan) {
      throw new NotFoundException('Prêt', command.loanId);
    }

    loan.reject();

    await this.loanRepo.updateLoan(loan);
    return loan;
  }
}
