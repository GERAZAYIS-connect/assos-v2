import { Injectable, Inject, Logger } from '@nestjs/common';
import { ILoanRepository } from '../../domain/repositories/loan.repository.interface';
import { LoanStatus } from '@prisma/client';

export interface CheckPendingLoansUrgencyCommand {
  thresholdHours?: number; // Default could be 24
}

@Injectable()
export class CheckPendingLoansUrgencyUseCase {
  private readonly logger = new Logger(CheckPendingLoansUrgencyUseCase.name);

  constructor(
    @Inject('ILoanRepository') private readonly loanRepo: ILoanRepository,
  ) {}

  async execute(command?: CheckPendingLoansUrgencyCommand): Promise<{ markedUrgentCount: number }> {
    const thresholdHours = command?.thresholdHours || 24;
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - thresholdHours);

    const pendingLoans = await this.loanRepo.listAllByStatus(LoanStatus.PENDING);
    let markedUrgentCount = 0;

    for (const loan of pendingLoans) {
      if (loan.createdAt < thresholdDate) {
        loan.markUrgent();
        await this.loanRepo.updateLoan(loan);
        markedUrgentCount++;
        this.logger.log(`Loan ${loan.id} marked as URGENT (pending since ${loan.createdAt.toISOString()})`);
      }
    }

    this.logger.log(`Checked ${pendingLoans.length} pending loans. Marked ${markedUrgentCount} as urgent.`);
    return { markedUrgentCount };
  }
}
